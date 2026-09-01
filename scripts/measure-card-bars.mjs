// Measures the three stat bars in a rendered card PNG: track extent, fill
// extent, and the implied percentage. Used to check bar fills against the
// numbers printed above them.
//   node scripts/measure-card-bars.mjs sample-card.png
import sharp from "sharp";

const file = process.argv[2] ?? "sample-card.png";
const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
const { width, height, channels } = info;

const px = (x, y) => {
  const o = (y * width + x) * channels;
  return [data[o], data[o + 1], data[o + 2]];
};
const isBg = ([r, g, b]) => r < 25 && g < 25 && b < 22;

// Find candidate bar rows: short horizontal runs of non-background in the
// lower-middle of the card. Scan every row, group contiguous non-bg runs.
function runsInRow(y) {
  const runs = [];
  let start = null;
  for (let x = 0; x < width; x++) {
    const nonBg = !isBg(px(x, y));
    if (nonBg && start === null) start = x;
    if (!nonBg && start !== null) {
      runs.push([start, x - 1]);
      start = null;
    }
  }
  if (start !== null) runs.push([start, width - 1]);
  return runs;
}

// The bar row is the row with exactly 3 runs of near-equal width in the 150-250px range.
let barRow = null;
for (let y = Math.floor(height * 0.4); y < Math.floor(height * 0.75); y++) {
  const runs = runsInRow(y).filter(([a, b]) => b - a > 120 && b - a < 320);
  if (runs.length === 3) {
    barRow = { y, runs };
    break;
  }
}

if (!barRow) {
  console.log("no bar row found");
  process.exit(1);
}

const y = barRow.y + 5;
console.log(`bar row y=${y}\n`);
const labels = ["3PT", "FINISHING", "HANDLES"];
for (let i = 0; i < barRow.runs.length; i++) {
  const [x0, x1] = barRow.runs[i];
  const trackW = x1 - x0 + 1;
  // Fill = leading pixels that differ from the track color (sampled at the far right).
  const trackColor = px(x1 - 1, y);
  let fillEnd = x0 - 1;
  for (let x = x0; x <= x1; x++) {
    const c = px(x, y);
    const diff = Math.abs(c[0] - trackColor[0]) + Math.abs(c[1] - trackColor[1]) + Math.abs(c[2] - trackColor[2]);
    if (diff > 30) fillEnd = x;
    else break;
  }
  const fillW = fillEnd - x0 + 1;
  console.log(
    `${labels[i].padEnd(10)} track x=${x0}-${x1} w=${trackW}  fill w=${fillW}  ` +
      `=> ${((fillW / trackW) * 100).toFixed(1)}%  fillColor=rgb(${px(x0 + 2, y).join(",")})`
  );
}
