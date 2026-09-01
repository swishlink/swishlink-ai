import sharp from "sharp";
import { readFileSync, writeFileSync } from "fs";

const src = "public/Swishlink.aiknowyourgamelogover1.png";
const dst = "public/swishlink-logo.png";

const image = sharp(src);
const { data, info } = await image
  .ensureAlpha()
  .raw()
  .toBuffer({ resolveWithObject: true });

const { width, height, channels } = info;
const buf = Buffer.from(data);

// Sample background color from top-left corner (4 pixels averaged)
const samplePixels = [0, 4, width * channels, width * channels + 4];
let rSum = 0, gSum = 0, bSum = 0;
for (const offset of samplePixels) {
  rSum += buf[offset];
  gSum += buf[offset + 1];
  bSum += buf[offset + 2];
}
const bgR = Math.round(rSum / samplePixels.length);
const bgG = Math.round(gSum / samplePixels.length);
const bgB = Math.round(bSum / samplePixels.length);
console.log(`Background color sampled: rgb(${bgR}, ${bgG}, ${bgB})`);

// Replace pixels within tolerance of background color with transparent
const tolerance = 30;
for (let i = 0; i < buf.length; i += channels) {
  const dr = Math.abs(buf[i] - bgR);
  const dg = Math.abs(buf[i + 1] - bgG);
  const db = Math.abs(buf[i + 2] - bgB);
  if (dr < tolerance && dg < tolerance && db < tolerance) {
    buf[i + 3] = 0; // set alpha to 0 (transparent)
  }
}

const result = await sharp(buf, { raw: { width, height, channels } })
  .png()
  .toBuffer();

writeFileSync(dst, result);
console.log(`Saved transparent logo to ${dst}`);

// The source art is a 1536x1024 frame with the lockup sitting in the middle
// surrounded by transparent padding. Drawing that whole frame at a header
// height shrinks the actual lockup to a fraction of the requested size and
// turns it to mush, so also emit a padding-free copy for the share card to
// draw from at full resolution.
const cardDst = "public/swishlink-logo-card.png";
const trimmed = await sharp(result).trim({ threshold: 1 }).png().toBuffer();
writeFileSync(cardDst, trimmed);
const trimmedMeta = await sharp(trimmed).metadata();
console.log(
  `Saved padding-free card logo to ${cardDst} (${trimmedMeta.width}x${trimmedMeta.height})`
);
