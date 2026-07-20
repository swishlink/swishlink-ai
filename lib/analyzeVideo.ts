import { extractFrames } from "@/lib/frames";
import { getProfile, type PlayerProfile } from "@/lib/playerProfile";

type ApiResult = {
  archetype: string;
  nba_comparison: string;
  comparison_reason: string;
  rating_3pt: number;
  rating_finishing: number;
  rating_handles: number;
  confidence: "high" | "medium" | "low";
  confidence_note: string;
};

// Bounds the analysis request well under the server's max duration, so a
// slow/stuck request fails fast into the fallback instead of leaving the
// user staring at "Analyzing your game…" for minutes.
const ANALYZE_TIMEOUT_MS = 90_000;

// Extracts frames from the uploaded clip, sends them (with the user's jersey
// details) to the scout AI, and returns a PlayerProfile. Falls back to the
// mock profile if extraction or the API call fails so the flow never dead-ends.
export async function analyzeVideo(
  file: File,
  jerseyColor: string,
  jerseyNumber: string,
  fallbackSeed: string
): Promise<PlayerProfile> {
  try {
    const frames = await extractFrames(file);

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), ANALYZE_TIMEOUT_MS);
    let res: Response;
    try {
      res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ frames, jerseyColor, jerseyNumber }),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!res.ok) {
      const { error } = await res.json().catch(() => ({ error: "" }));
      throw new Error(error || `Analysis request failed (${res.status}).`);
    }

    const data: ApiResult = await res.json();
    return {
      archetype: data.archetype,
      ratings: {
        threePoint: data.rating_3pt,
        finishing: data.rating_finishing,
        handles: data.rating_handles,
      },
      nbaComparison: data.nba_comparison,
      comparisonReason: data.comparison_reason,
      confidence: data.confidence,
      confidenceNote: data.confidence_note,
    };
  } catch (err) {
    console.warn("Falling back to mock profile:", err);
    return getProfile(fallbackSeed);
  }
}
