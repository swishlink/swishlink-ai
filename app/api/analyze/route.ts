import Anthropic from "@anthropic-ai/sdk";

export const runtime = "nodejs";
export const maxDuration = 300;

const MODEL = "claude-opus-4-8";

// The SwishLink scout prompt. {jersey_color} / {jersey_number} are injected
// from the values the user gives during upload.
function buildSystemPrompt(jerseyColor: string, jerseyNumber: string): string {
  return `You are SwishLink's basketball scout AI. You analyze frames
extracted from a player's uploaded game footage and produce
their player profile.

THE PLAYER YOU ARE ANALYZING:
The user is the player wearing: ${jerseyColor} jersey,
number ${jerseyNumber}.
Analyze ONLY this player. Ignore all other players except
as context (e.g., how the user moves relative to defenders).
If you cannot clearly find this player in the frames, say so
in the "confidence" field rather than guessing.

GROUNDING RULES — CRITICAL:
1. Base every observation ONLY on what is visible in the
   provided frames. Never invent events you cannot see.
2. Frames are snapshots — you CANNOT see whether shots went
   in, final scores, or full plays. Never claim makes/misses
   or outcomes.
3. You CAN observe: shot form, release point, body positioning,
   court locations, ball-handling stance, defensive stance,
   spacing awareness, athleticism indicators, physical build.
4. If the footage doesn't show enough of a skill to rate it,
   give a mid-range rating (65-75) and note lower confidence —
   never fabricate specifics.
5. Every sentence in comparison_reason must reference
   something actually visible in the frames.

RATINGS GUIDANCE:
- Rate 3PT based on: shooting form, release mechanics, shot
  locations visible in frames (NOT makes/misses).
- Rate FINISHING based on: attacking posture, body control
  near the rim, contact absorption visible in frames.
- Rate HANDLES based on: dribbling stance, ball position,
  change-of-direction body mechanics visible in frames.
- Scale: 60-69 developing, 70-79 solid, 80-89 strong,
  90+ exceptional. Be encouraging but honest — players
  compare cards and detect inflation.

NBA COMPARISON:
Choose a comparison based on playstyle and body type visible
in frames — NOT skill level. A 15-year-old is never "as good
as" an NBA player; he plays in a similar STYLE. Prefer current,
recognizable players a teenager would know. Vary comparisons —
do not default to the same few names.

OUTPUT — respond ONLY with this JSON, no other text:
{
  "archetype": "string — 2-3 word playstyle title",
  "nba_comparison": "string — player name",
  "comparison_reason": "string — 1-2 sentences citing specific
    visible observations from THIS footage",
  "rating_3pt": integer,
  "rating_finishing": integer,
  "rating_handles": integer,
  "confidence": "high | medium | low — based on footage
    quality and how clearly the target player was visible",
  "confidence_note": "string — only if confidence is not high,
    one short sentence explaining why (e.g. 'Player was only
    visible in 4 of 10 frames')"
}`;
}

const OUTPUT_SCHEMA = {
  type: "object",
  properties: {
    archetype: { type: "string" },
    nba_comparison: { type: "string" },
    comparison_reason: { type: "string" },
    rating_3pt: { type: "integer" },
    rating_finishing: { type: "integer" },
    rating_handles: { type: "integer" },
    confidence: { type: "string", enum: ["high", "medium", "low"] },
    confidence_note: { type: "string" },
  },
  required: [
    "archetype",
    "nba_comparison",
    "comparison_reason",
    "rating_3pt",
    "rating_finishing",
    "rating_handles",
    "confidence",
    "confidence_note",
  ],
  additionalProperties: false,
} as const;

type Frame = { data: string; mediaType: string };

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return Response.json(
      { error: "ANTHROPIC_API_KEY is not configured on the server." },
      { status: 500 }
    );
  }

  let body: { frames?: Frame[]; jerseyColor?: string; jerseyNumber?: string };
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: "Invalid request body." }, { status: 400 });
  }

  const frames = body.frames ?? [];
  const jerseyColor = (body.jerseyColor ?? "").trim() || "unspecified";
  const jerseyNumber = (body.jerseyNumber ?? "").trim() || "unspecified";

  if (frames.length === 0) {
    return Response.json({ error: "No frames provided." }, { status: 400 });
  }

  const client = new Anthropic({ apiKey });

  const imageBlocks = frames.map((f) => ({
    type: "image" as const,
    source: {
      type: "base64" as const,
      media_type: (f.mediaType || "image/jpeg") as "image/jpeg",
      data: f.data,
    },
  }));

  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2048,
      thinking: { type: "adaptive" },
      output_config: {
        effort: "medium",
        format: { type: "json_schema", schema: OUTPUT_SCHEMA },
      },
      system: buildSystemPrompt(jerseyColor, jerseyNumber),
      messages: [
        {
          role: "user",
          content: [
            ...imageBlocks,
            {
              type: "text",
              text: `These are ${frames.length} frames extracted evenly across the uploaded game clip. Analyze the player as instructed and respond with the JSON profile.`,
            },
          ],
        },
      ],
    });

    if (response.stop_reason === "refusal") {
      return Response.json(
        { error: "Analysis was declined for this footage." },
        { status: 422 }
      );
    }

    const textBlock = response.content.find((b) => b.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return Response.json(
        { error: "Model returned no analysis." },
        { status: 502 }
      );
    }

    const parsed = JSON.parse(textBlock.text);
    return Response.json(parsed);
  } catch (err) {
    console.error("Anthropic analysis failed:", err);
    return Response.json(
      { error: "Analysis failed. Please try again." },
      { status: 502 }
    );
  }
}
