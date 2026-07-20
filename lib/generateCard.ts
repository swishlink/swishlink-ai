import type { PlayerProfile } from "@/lib/playerProfile";
import { confidenceLabel } from "@/lib/playerProfile";

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

  // Identity name — the largest element on the card
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${profile.archetype.length > 10 ? 88 : 108}px system-ui,sans-serif`;
  ctx.fillText(profile.archetype.toUpperCase(), W / 2, 440 + off);

  ctx.fillStyle = "#6b7280";
  ctx.font = "26px system-ui,sans-serif";
  ctx.fillText("Based on AI analysis of your uploaded game footage.", W / 2, 500 + off);

  // Closest NBA Match
  ctx.fillStyle = "#6b7280";
  ctx.font = "38px system-ui,sans-serif";
  ctx.fillText("Closest NBA Match", W / 2, 566 + off);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 62px system-ui,sans-serif";
  ctx.fillText(profile.nbaComparison, W / 2, 634 + off);

  // Confidence — small, secondary label near the observation text
  const readLabel = confidenceLabel(profile.confidence).toUpperCase();
  ctx.fillStyle = CONFIDENCE_LABEL_COLORS[profile.confidence ?? "medium"];
  ctx.font = "bold 26px system-ui,sans-serif";
  ctx.fillText(readLabel, W / 2, 674 + off);

  // Divider
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(108, 706 + off);
  ctx.lineTo(W - 108, 706 + off);
  ctx.stroke();

  // Ratings
  const ratings = [
    { label: "3PT", value: profile.ratings.threePoint, color: "#fb923c" },
    { label: "FINISHING", value: profile.ratings.finishing, color: "#38bdf8" },
    { label: "HANDLES", value: profile.ratings.handles, color: "#34d399" },
  ];

  const colW = (W - 216) / 3;
  ratings.forEach((r, i) => {
    const cx = 108 + i * colW + colW / 2;

    ctx.fillStyle = "#ffffff";
    ctx.font = "bold 140px system-ui,sans-serif";
    ctx.textAlign = "center";
    ctx.fillText(String(r.value), cx, 861 + off);

    ctx.fillStyle = "#6b7280";
    ctx.font = "bold 30px system-ui,sans-serif";
    ctx.fillText(r.label, cx, 917 + off);

    bar(ctx, cx - 96, 937 + off, 192, 12, r.color, r.value);
  });

  // Divider above reason
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(108, 1091 + off);
  ctx.lineTo(W - 108, 1091 + off);
  ctx.stroke();

  // Comparison reason
  if (profile.comparisonReason) {
    ctx.fillStyle = "#9ca3af";
    ctx.font = "italic 34px system-ui,sans-serif";
    ctx.textAlign = "center";
    wrapText(ctx, `"${profile.comparisonReason}"`, W / 2, 1171 + off, W - 280, 56);
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
