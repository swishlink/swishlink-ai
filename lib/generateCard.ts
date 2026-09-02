import type { PlayerProfile } from "@/lib/playerProfile";
import { SITE_DOMAIN } from "@/lib/siteUrl";
import {
  confidenceLabel,
  shouldPromptForSharperRatings,
  SHARPER_RATINGS_CTA,
} from "@/lib/playerProfile";

const CONFIDENCE_LABEL_COLORS: Record<string, string> = {
  high: "#34d399",
  medium: "#38bdf8",
  low: "#fbbf24",
};

const W = 1080;
const H = 1920;

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
}

function wrapText(
  ctx: CanvasRenderingContext2D,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight: number
): number {
  const words = text.split(" ");
  let line = "";
  const lines: string[] = [];
  for (const word of words) {
    const test = line + word + " ";
    if (ctx.measureText(test).width > maxWidth && line !== "") {
      lines.push(line.trim());
      line = word + " ";
    } else {
      line = test;
    }
  }
  if (line.trim()) lines.push(line.trim());
  lines.forEach((l, i) => ctx.fillText(l, x, y + i * lineHeight));
  return lines.length;
}

// Fits the archetype title within maxWidth by shrinking the font size; if it
// still doesn't fit at the minimum size, falls back to the most balanced
// two-line word split at that minimum size.
function fitArchetypeTitle(
  ctx: CanvasRenderingContext2D,
  rawText: string,
  maxWidth: number
): { fontSize: number; lines: string[] } {
  const text = rawText.toUpperCase();
  const MAX_SIZE = 108;
  const MIN_SIZE = 56;
  const STEP = 4;

  for (let size = MAX_SIZE; size >= MIN_SIZE; size -= STEP) {
    ctx.font = `bold ${size}px system-ui,sans-serif`;
    if (ctx.measureText(text).width <= maxWidth) {
      return { fontSize: size, lines: [text] };
    }
  }

  ctx.font = `bold ${MIN_SIZE}px system-ui,sans-serif`;
  const words = text.split(" ");
  if (words.length === 1) {
    return { fontSize: MIN_SIZE, lines: [text] };
  }

  let bestSplit = 1;
  let bestMaxWidth = Infinity;
  for (let i = 1; i < words.length; i++) {
    const line1 = words.slice(0, i).join(" ");
    const line2 = words.slice(i).join(" ");
    const widest = Math.max(ctx.measureText(line1).width, ctx.measureText(line2).width);
    if (widest < bestMaxWidth) {
      bestMaxWidth = widest;
      bestSplit = i;
    }
  }

  return {
    fontSize: MIN_SIZE,
    lines: [words.slice(0, bestSplit).join(" "), words.slice(bestSplit).join(" ")],
  };
}

// One fixed track width for all three stat bars, so the fills are directly
// comparable to each other and each fill is a straight fraction of a track
// the viewer can actually see. A bar must never disagree with the number
// printed above it.
const BAR_TRACK_W = 192;
const BAR_H = 12;
const BAR_TRACK_COLOR = "#374151";
// All three bars share the brand orange. Per-stat colours implied a meaning
// the categories don't have, and made equal-length bars read as unequal.
const BAR_FILL_COLOR = "#F07B25";

// Draws one stat bar centred on cx. Takes the rating, not a pixel width, so
// every bar goes through the same clamp and the same rounding.
function bar(
  ctx: CanvasRenderingContext2D,
  cx: number,
  y: number,
  rating: number,
  dim: boolean = false
) {
  const x = Math.round(cx - BAR_TRACK_W / 2);
  const pct = Math.min(100, Math.max(0, rating));
  const fillW = Math.round((pct / 100) * BAR_TRACK_W);

  ctx.fillStyle = BAR_TRACK_COLOR;
  ctx.fillRect(x, y, BAR_TRACK_W, BAR_H);
  ctx.globalAlpha = dim ? 0.5 : 1;
  ctx.fillStyle = BAR_FILL_COLOR;
  ctx.fillRect(x, y, fillW, BAR_H);
  ctx.globalAlpha = 1;
}

// Draws the full card into a 1080x1920 context. Exported separately from the
// download path so a sample can be rendered and inspected without an upload
// (see scripts/render-sample-card.mjs).
export async function drawShareCard(
  ctx: CanvasRenderingContext2D,
  profile: PlayerProfile,
  username: string
): Promise<void> {
  // Background
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, W, H);

  // Ambient orange glow
  const glow = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, 960);
  glow.addColorStop(0, "rgba(249,115,22,0.2)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Logo — the padding-free lockup, so the requested height is the height the
  // mark actually renders at. Source is 1033px wide against ~366px drawn, so
  // it downsamples with plenty of pixels to spare.
  ctx.textAlign = "center";
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  try {
    const logo = await loadImage("/swishlink-logo-card.png");
    const lh = 88;
    const lw = (logo.width / logo.height) * lh;
    ctx.drawImage(logo, Math.round((W - lw) / 2), 76, Math.round(lw), lh);
  } catch {
    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 56px system-ui,sans-serif";
    ctx.fillText("SWISHLINK.AI", W / 2, 160);
  }

  // Username — prominent, brand orange, reads as the player's identity
  const hasUsername = Boolean(username);
  if (hasUsername) {
    ctx.fillStyle = "#f97316";
    ctx.font = "bold 68px system-ui,sans-serif";
    ctx.fillText(`@${username}`, W / 2, 250);
  }
  const off = hasUsername ? 100 : 0;

  // "YOUR BASKETBALL IDENTITY" badge
  ctx.fillStyle = "#f97316";
  ctx.font = "bold 30px system-ui,sans-serif";
  ctx.fillText("YOUR BASKETBALL IDENTITY", W / 2, 300 + off);

  // Identity name — the largest element on the card. Auto-fits within the
  // card's content width, shrinking font size and falling back to two lines
  // if it still doesn't fit (e.g. a long 25-character archetype).
  const archetypeMaxWidth = W - 216; // matches the divider margins below
  const { fontSize: archFontSize, lines: archLines } = fitArchetypeTitle(
    ctx,
    profile.archetype,
    archetypeMaxWidth
  );
  const archLineHeight = Math.round(archFontSize * 1.05);
  const archExtra = archLines.length > 1 ? archLineHeight : 0;

  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${archFontSize}px system-ui,sans-serif`;
  ctx.textAlign = "center";
  if (archLines.length === 1) {
    ctx.fillText(archLines[0], W / 2, 440 + off);
  } else {
    ctx.fillText(archLines[0], W / 2, 440 + off - archLineHeight / 2);
    ctx.fillText(archLines[1], W / 2, 440 + off + archLineHeight / 2);
  }

  // Everything below the title shifts down if it wrapped to two lines.
  const offBelow = off + archExtra;

  ctx.fillStyle = "#ffffff";
  ctx.font = "26px system-ui,sans-serif";
  ctx.fillText("Based on AI analysis of your uploaded game footage.", W / 2, 500 + offBelow);

  // Closest NBA Match — name only; confidence now lives with the observation
  ctx.fillStyle = "#6b7280";
  ctx.font = "38px system-ui,sans-serif";
  ctx.fillText("Closest NBA Match", W / 2, 566 + offBelow);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 62px system-ui,sans-serif";
  ctx.fillText(profile.nbaComparison, W / 2, 634 + offBelow);

  // Divider before ratings
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(108, 690 + offBelow);
  ctx.lineTo(W - 108, 690 + offBelow);
  ctx.stroke();

  // Ratings
  const ratings = [
    {
      label: "3PT",
      value: profile.ratings.threePoint,
      observed: profile.observed?.threePoint ?? true,
    },
    {
      label: "FINISHING",
      value: profile.ratings.finishing,
      observed: profile.observed?.finishing ?? true,
    },
    {
      label: "HANDLES",
      value: profile.ratings.handles,
      observed: profile.observed?.handles ?? true,
    },
  ];

  const ratingsNumberY = 845 + offBelow;
  const colW = (W - 216) / 3;
  ratings.forEach((r, i) => {
    const cx = 108 + i * colW + colW / 2;

    ctx.fillStyle = r.observed ? "#ffffff" : "rgba(255,255,255,0.45)";
    ctx.font = "bold 140px system-ui,sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(r.value), cx, ratingsNumberY);

    if (!r.observed) {
      ctx.fillStyle = "#9ca3af";
      ctx.font = "bold 22px system-ui,sans-serif";
      ctx.fillText("EST.", cx, ratingsNumberY + 26);
    }

    ctx.fillStyle = "#6b7280";
    ctx.font = "bold 30px system-ui,sans-serif";
    ctx.fillText(r.label, cx, ratingsNumberY + 56);

    bar(ctx, cx, ratingsNumberY + 76, r.value, !r.observed);
  });

  // Sharper-ratings CTA — fills the empty space between ratings and the
  // observation below, only when the footage likely under-informed the AI.
  let extraForCta = 0;
  if (shouldPromptForSharperRatings(profile)) {
    ctx.fillStyle = "#fb923c";
    ctx.font = "600 28px system-ui,sans-serif";
    ctx.textAlign = "center";
    const ctaY = ratingsNumberY + 155;
    const ctaLines = wrapText(ctx, SHARPER_RATINGS_CTA, W / 2, ctaY, W - 280, 40);
    extraForCta = ctaLines * 40 + 40;
  }

  // Divider before the observation
  const divider2Y = ratingsNumberY + 230 + extraForCta;
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(108, divider2Y);
  ctx.lineTo(W - 108, divider2Y);
  ctx.stroke();

  // Observation — confidence read, then the quote it's based on
  let contentBottom = divider2Y + 40;
  if (profile.comparisonReason) {
    const readLabel = confidenceLabel(profile.confidence).toUpperCase();
    ctx.fillStyle = CONFIDENCE_LABEL_COLORS[profile.confidence ?? "medium"];
    ctx.font = "bold 26px system-ui,sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(readLabel, W / 2, divider2Y + 40);

    // Says out loud what the read above is measuring, so "GOOD READ" can't be
    // mistaken for a compliment about the player.
    ctx.fillStyle = "#6b7280";
    ctx.font = "600 20px system-ui,sans-serif";
    ctx.fillText("ANALYSIS CONFIDENCE", W / 2, divider2Y + 70);

    ctx.fillStyle = "#ffffff";
    ctx.font = "italic 34px system-ui,sans-serif";
    ctx.textAlign = "center";
    const quoteTop = divider2Y + 126;
    const quoteLineHeight = 56;
    const quoteLines = wrapText(
      ctx,
      `"${profile.comparisonReason}"`,
      W / 2,
      quoteTop,
      W - 280,
      quoteLineHeight
    );
    contentBottom = quoteTop + (quoteLines - 1) * quoteLineHeight + 16;
  }

  // Bottom branding — a question rather than a statement, so a teammate
  // seeing the card knows what to do next. "Know your game." isn't repeated
  // here; the logo lockup at the top already carries it.
  //
  // Normally sits at a fixed spot near the bottom, close enough that the
  // quote above doesn't read as stranded mid-card while still clearing the
  // Instagram Story / TikTok UI overlays. A long archetype, the
  // sharper-ratings CTA and a long quote all push content down, so the footer
  // gives way rather than colliding — capped so the URL stays on the card.
  const taglineY = Math.min(Math.max(H - 262, contentBottom + 92), H - 110);
  ctx.fillStyle = "#6b7280";
  ctx.font = "38px system-ui,sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("What kind of player are you?", W / 2, taglineY);
  ctx.fillStyle = "#9ca3af";
  ctx.font = "bold 46px system-ui,sans-serif";
  ctx.fillText(SITE_DOMAIN, W / 2, taglineY + 64);
}

export function shareCardFilename(username: string): string {
  const safe = username.replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase();
  return `swishlink-${safe || "card"}.png`;
}

// Renders the card and hands back a real File — not a Blob. navigator.canShare
// rejects a bare Blob, and iOS uses the .png filename and image/png type to
// decide the share sheet can offer "Save Image".
//
// Deliberately does NOT touch the DOM beyond an offscreen canvas: the caller
// renders this ahead of the user's tap, because awaiting it inside the tap
// handler would spend the user activation iOS requires for navigator.share.
export async function renderShareCardFile(
  profile: PlayerProfile,
  username: string
): Promise<File> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  await drawShareCard(ctx, profile, username);

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, "image/png")
  );
  if (!blob) throw new Error("Could not encode the share card as a PNG.");

  return new File([blob], shareCardFilename(username), { type: "image/png" });
}
