// Renders the share card to a PNG in Node so the real drawing code in
// lib/generateCard.ts can be eyeballed without a browser upload flow.
//
//   node scripts/render-sample-card.mjs out.png --three 20 --finishing 50 --handles 90
//
// Requires @napi-rs/canvas + esbuild (install with `npm i --no-save
// @napi-rs/canvas esbuild`). Segoe UI is registered as `system-ui` so text
// metrics match Chrome on Windows.
import { createCanvas, GlobalFonts, loadImage as loadCanvasImage } from "@napi-rs/canvas";
import * as esbuild from "esbuild";
import { readFileSync, writeFileSync, mkdtempSync } from "fs";
import { tmpdir } from "os";
import path from "path";
import { pathToFileURL } from "url";

const ROOT = process.cwd();

// --- args ---------------------------------------------------------------
const argv = process.argv.slice(2);
const out = argv[0] && !argv[0].startsWith("--") ? argv[0] : "sample-card.png";
const flag = (name, fallback) => {
  const i = argv.indexOf(`--${name}`);
  return i === -1 ? fallback : argv[i + 1];
};
const numFlag = (name, fallback) => Number(flag(name, fallback));

// --- fonts: make `system-ui` resolve to Segoe UI, as Chrome does on Windows
for (const file of ["segoeui.ttf", "segoeuib.ttf", "segoeuii.ttf", "segoeuiz.ttf"]) {
  const p = path.join("C:\\Windows\\Fonts", file);
  if (!GlobalFonts.registerFromPath(p, "system-ui")) {
    console.warn(`warn: could not register ${file}`);
  }
}

// --- browser shims the card code expects --------------------------------
class NodeImage {
  set src(value) {
    const rel = value.startsWith("/") ? value.slice(1) : value;
    loadCanvasImage(path.join(ROOT, "public", rel)).then(
      (img) => {
        this.width = img.width;
        this.height = img.height;
        this._img = img;
        this.onload?.();
      },
      (err) => this.onerror?.(err)
    );
  }
}
globalThis.Image = NodeImage;

// @napi-rs/canvas drawImage needs its own Image instance, so unwrap ours.
function patchDrawImage(ctx) {
  const original = ctx.drawImage.bind(ctx);
  ctx.drawImage = (img, ...rest) => original(img?._img ?? img, ...rest);
}

// --- bundle the TS card renderer ---------------------------------------
const tmp = mkdtempSync(path.join(tmpdir(), "cardgen-"));
const bundlePath = path.join(tmp, "card.mjs");
await esbuild.build({
  entryPoints: [path.join(ROOT, "lib", "generateCard.ts")],
  bundle: true,
  format: "esm",
  platform: "neutral",
  outfile: bundlePath,
  alias: { "@": ROOT },
  logLevel: "warning",
});
const { drawShareCard } = await import(pathToFileURL(bundlePath).href);

// --- render -------------------------------------------------------------
const profile = {
  archetype: flag("archetype", "Two-Way Wing"),
  ratings: {
    threePoint: numFlag("three", 80),
    finishing: numFlag("finishing", 83),
    handles: numFlag("handles", 79),
  },
  observed: {
    threePoint: flag("obs3", "1") !== "0",
    finishing: flag("obsF", "1") !== "0",
    handles: flag("obsH", "1") !== "0",
  },
  nbaComparison: flag("nba", "Kawhi Leonard"),
  comparisonReason: flag(
    "reason",
    "You showed active hands in passing lanes and attacked mid-range spots off the catch — the methodical, two-way style that makes Leonard a threat on both ends of the floor."
  ),
  confidence: flag("confidence", "medium"),
};

const canvas = createCanvas(1080, 1920);
const ctx = canvas.getContext("2d");
patchDrawImage(ctx);
await drawShareCard(ctx, profile, flag("user", "jaydencrossover"));

writeFileSync(out, canvas.toBuffer("image/png"));
console.log(
  `wrote ${out} (1080x1920) — ${profile.ratings.threePoint}/${profile.ratings.finishing}/${profile.ratings.handles}`
);
