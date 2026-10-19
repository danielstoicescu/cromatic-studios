// Cromatic opening · A2 (phase 2): the site's loader and opening. Writes the two artboards and the worlds' atlas:
//   design/intro-lottie/A2/{desktop,phone}.json + worlds-{desktop,phone}.webp (for previews and renders)
//   src/intro/intro-{desktop,phone}.json + src/intro/worlds-{desktop,phone}.webp (for the site's build)
// node build2.mjs
import fs from "fs";
import path from "path";
import zlib from "zlib";
import { createRequire } from "module";
import { fileURLToPath } from "url";
import { loadType } from "./lib/type.mjs";
import { buildA2, ARTBOARDS2, WORLD_IDS, ATLAS } from "./directions/A2.mjs";
const here = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);
const sharp = require(path.resolve(here, "../../../node_modules/sharp"));
const OUT = path.resolve(here, "../A2"), SITE = path.resolve(here, "../../../src/intro");
fs.mkdirSync(OUT, { recursive: true }); fs.mkdirSync(SITE, { recursive: true });
// the atlas: each world's Multiverse preview (324×432, rendered by the site's own picker), a band across the road
const TOP = 160;
async function atlas(scale, q) {
  const w = Math.round(ATLAS.cw * scale), h = Math.round(ATLAS.ch * scale);
  const tiles = await Promise.all(WORLD_IDS.map((id) => sharp(path.join(here, "assets/worlds", id + ".jpg")).extract({ left: 0, top: TOP, width: ATLAS.cw, height: ATLAS.ch }).resize(w, h).toBuffer()));
  return sharp({ create: { width: w, height: h * tiles.length, channels: 3, background: "#ffffff" } }).composite(tiles.map((b, i) => ({ input: b, top: i * h, left: 0 }))).webp({ quality: q, effort: 6 }).toBuffer();
}
const T = await loadType();
const sizes = {};
for (const ab of Object.values(ARTBOARDS2)) {
  // the phone's pills are smaller on screen: its atlas is smaller too (the layers scale it by its own size)
  const scale = ab.name === "phone" ? 0.9 : 1, img = await atlas(scale, 58);
  const json = buildA2(T, ab, { atlasPath: `worlds-${ab.name}.webp` });
  const a = json.assets.find((x) => x.id === "worlds"); a.w = Math.round(ATLAS.cw * scale); a.h = Math.round(ATLAS.ch * scale) * WORLD_IDS.length;
  // the image layers were laid out for the full-size atlas: scale their anchors and sizes to this one
  if (scale !== 1) for (const L of json.layers) if (L.ty === 2) { const k = L.ks; k.a.k = k.a.k.map((v, i) => (i < 2 ? v * scale : v)); k.s.k = k.s.k.map((v, i) => (i < 2 ? v / scale : v)); for (const m of L.masksProperties || []) { const pk = m.pt.k; pk.v = pk.v.map((p) => p.map((v) => v * scale)); pk.i = pk.i.map((p) => p.map((v) => v * scale)); pk.o = pk.o.map((p) => p.map((v) => v * scale)); } }
  const s = JSON.stringify(json);
  for (const dir of [OUT, SITE]) { fs.writeFileSync(path.join(dir, dir === SITE ? `intro-${ab.name}.json` : `${ab.name}.json`), s); fs.writeFileSync(path.join(dir, `worlds-${ab.name}.webp`), img); }
  sizes[ab.name] = { json: s.length, jsonBr: zlib.brotliCompressSync(Buffer.from(s)).length, atlas: img.length, layers: json.layers.length, frames: json.op, markers: json.markers.map((m) => `${m.cm}@${m.tm}+${m.dr}`).join(" ") };
}
console.table(sizes);
fs.writeFileSync(path.join(here, "sizes-A2.json"), JSON.stringify(sizes, null, 1));
