import type { PlayerProfile } from "@/lib/playerProfile";

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

  // "PLAYER PROFILE" badge
  ctx.fillStyle = "#f97316";
  ctx.font = "bold 36px system-ui,sans-serif";
  ctx.fillText("PLAYER PROFILE", W / 2, 320);

  // Archetype
  ctx.fillStyle = "#ffffff";
  ctx.font = `bold ${profile.archetype.length > 10 ? 88 : 108}px system-ui,sans-serif`;
  ctx.fillText(profile.archetype.toUpperCase(), W / 2, 470);

  // "Plays like"
  ctx.fillStyle = "#6b7280";
  ctx.font = "40px system-ui,sans-serif";
  ctx.fillText("Plays like", W / 2, 560);
  ctx.fillStyle = "#ffffff";
  ctx.font = "bold 62px system-ui,sans-serif";
  ctx.fillText(profile.nbaComparison, W / 2, 648);

  // Divider
  ctx.strokeStyle = "rgba(255,255,255,0.08)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(108, 710);
  ctx.lineTo(W - 108, 710);
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
    ctx.fillText(String(r.value), cx, 900);

    ctx.fillStyle = "#6b7280";
    ctx.font = "bold 30px system-ui,sans-serif";
    ctx.fillText(r.label, cx, 956);

    bar(ctx, cx - 96, 976, 192, 12, r.color, r.value);
  });

  // Username (only if a real handle is set)
  if (username) {
    ctx.textAlign = "center";
    ctx.fillStyle = "#4b5563";
    ctx.font = "38px system-ui,sans-serif";
    ctx.fillText(`@${username}`, W / 2, 1080);
  }

  // Divider above reason
  ctx.strokeStyle = "rgba(255,255,255,0.05)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(108, 1130);
  ctx.lineTo(W - 108, 1130);
  ctx.stroke();

  // Comparison reason
  if (profile.comparisonReason) {
    ctx.fillStyle = "#9ca3af";
    ctx.font = "italic 34px system-ui,sans-serif";
    ctx.textAlign = "center";
    wrapText(ctx, `"${profile.comparisonReason}"`, W / 2, 1210, W - 280, 56);
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
