import type { PlayerProfile } from "@/lib/playerProfile";
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

function bar(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
  fill: string,
  pct: number
) {
  ctx.fillStyle = "#1f2937";
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = fill;
  ctx.fillRect(x, y, (w * pct) / 100, h);
}

export async function generateShareCard(
  profile: PlayerProfile,
  username: string
): Promise<void> {
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  // Background
  ctx.fillStyle = "#0a0a0a";
  ctx.fillRect(0, 0, W, H);

  // Ambient orange glow
  const glow = ctx.createRadialGradient(W / 2, 0, 0, W / 2, 0, 960);
  glow.addColorStop(0, "rgba(249,115,22,0.2)");
  glow.addColorStop(1, "rgba(0,0,0,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(0, 0, W, H);

  // Logo
  ctx.textAlign = "center";
  try {
    const logo = await loadImage("/swishlink-logo.png");
    const lh = 100;
    const lw = (logo.width / logo.height) * lh;
    ctx.drawImage(logo, (W - lw) / 2, 100, lw, lh);
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
    { label: "3PT", value: profile.ratings.threePoint, color: "#fb923c" },
    { label: "FINISHING", value: profile.ratings.finishing, color: "#38bdf8" },
    { label: "HANDLES", value: profile.ratings.handles, color: "#34d399" },
  ];

  const ratingsNumberY = 845 + offBelow;
  const colW = (W - 216) / 3;
  ratings.forEach((r, i) => {
    const cx = 108 + i * colW + colW / 2;

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 140px system-ui,sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(r.value), cx, ratingsNumberY);

    ctx.fillStyle = "#6b7280";
    ctx.font = "bold 30px system-ui,sans-serif";
    ctx.fillText(r.label, cx, ratingsNumberY + 56);

    bar(ctx, cx - 96, ratingsNumberY + 76, 192, 12, r.color, r.value);
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
  if (profile.comparisonReason) {
    const readLabel = confidenceLabel(profile.confidence).toUpperCase();
    ctx.fillStyle = CONFIDENCE_LABEL_COLORS[profile.confidence ?? "medium"];
    ctx.font = "bold 26px system-ui,sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(readLabel, W / 2, divider2Y + 40);

    ctx.fillStyle = "#ffffff";
    ctx.font = "italic 34px system-ui,sans-serif";
    ctx.textAlign = "center";
    wrapText(ctx, `"${profile.comparisonReason}"`, W / 2, divider2Y + 80, W - 280, 56);
  }

  // Bottom branding
  ctx.fillStyle = "#374151";
  ctx.font = "38px system-ui,sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("Know your game.", W / 2, H - 160);
  ctx.fillStyle = "#6b7280";
  ctx.font = "bold 46px system-ui,sans-serif";
  ctx.fillText("swishlink-ai.vercel.app", W / 2, H - 96);

  // Download
  canvas.toBlob(
    (blob) => {
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `swishlink-${username}-${profile.archetype
        .toLowerCase()
        .replace(/ /g, "-")}.png`;
      a.click();
      URL.revokeObjectURL(url);
    },
    "image/png"
  );
}
