// Cromatic opening, phase 3: the cup concepts. node build3.mjs [names...]  -> ../phase3/<name>/{desktop,phone}.json
import fs from "fs";
import path from "path";
import zlib from "zlib";
import { fileURLToPath } from "url";
import { loadType } from "./lib/type.mjs";
import { ARTBOARDS2 } from "./directions/A2.mjs";
const here = path.dirname(fileURLToPath(import.meta.url));
const T = await loadType();
const want = process.argv.slice(2);
const DIRS = {
  cuptest: async () => (await import("./directions/cuptest.mjs")).buildCupTest,
  cupviews: async () => (await import("./directions/cupviews.mjs")).buildCupViews,
  crema: async () => (await import("./directions/crema.mjs")).buildCrema,
  ninecups: async () => (await import("./directions/ninecups.mjs")).buildNineCups,
  cupcity: async () => (await import("./directions/cupcity.mjs")).buildCupCity
};
import { createRequire } from "module";
const require = createRequire(import.meta.url);
const sharp = require(path.resolve(here, "../../../node_modules/sharp"));
// the square atlas: each world's street (the Multiverse preview, a square from under its top), 3 x 3 cells of 150 px
async function squareAtlas() {
  const ids = ["monument", "nightlife", "ghibli", "sketch", "circuit", "orchid", "underwater", "polite", "riso"];
  const tiles = await Promise.all(ids.map((id) => sharp(path.join(here, "assets/worlds", id + ".jpg")).extract({ left: 0, top: 40, width: 324, height: 324 }).resize(150, 150).toBuffer()));
  return sharp({ create: { width: 450, height: 450, channels: 3, background: "#ffffff" } }).composite(tiles.map((b, i) => ({ input: b, left: (i % 3) * 150, top: Math.floor(i / 3) * 150 }))).webp({ quality: 62, effort: 6 }).toBuffer();
}
const SQIMG = await squareAtlas();
// the worlds' atlas (the same as the live opening's)
const SITE = path.resolve(here, "../../../src/intro");
const sizes = {};
for (const name of want.length ? want : Object.keys(DIRS)) {
  const build = await DIRS[name]();
  const out = path.resolve(here, "../phase3", name);
  fs.mkdirSync(out, { recursive: true });
  for (const ab of Object.values(ARTBOARDS2)) {
    const json = build(T, ab, { atlasPath: `worlds-${ab.name}.webp` });
    if (json.assets.some((a) => a.id === "worlds-sq")) { fs.writeFileSync(path.join(out, "worlds-sq.webp"), SQIMG); sizes[`${name} ${ab.name}`] = { sq: SQIMG.length }; }
    if (json.assets.some((a) => a.id === "worlds")) {
      fs.copyFileSync(path.join(SITE, `worlds-${ab.name}.webp`), path.join(out, `worlds-${ab.name}.webp`));
      // the phone's atlas is 0.9 of the full size: the image layers were laid out for the full one
      if (ab.name === "phone") fixAtlasScale(json, 0.9);
    }
    const s = JSON.stringify(json);
    fs.writeFileSync(path.join(out, `${ab.name}.json`), s);
    sizes[`${name} ${ab.name}`] = { kb: +(s.length / 1024).toFixed(1), br: +(zlib.brotliCompressSync(Buffer.from(s)).length / 1024).toFixed(1), layers: json.layers.length, assets: json.assets.length, frames: json.op };
  }
}
console.table(sizes);

function fixAtlasScale(json, scale) {
  const a = json.assets.find((x) => x.id === "worlds"); a.w = Math.round(324 * scale); a.h = Math.round(128 * scale) * 9;
  const fix = (layers) => { for (const L of layers) if (L.ty === 2 && L.refId === "worlds") { const k = L.ks; k.a.k = k.a.k.map((v, i) => (i < 2 ? v * scale : v)); k.s.k = k.s.k.map((v, i) => (i < 2 ? v / scale : v)); for (const m of L.masksProperties || []) { const pk = m.pt.k; pk.v = pk.v.map((p) => p.map((v) => v * scale)); pk.i = pk.i.map((p) => p.map((v) => v * scale)); pk.o = pk.o.map((p) => p.map((v) => v * scale)); } } };
  fix(json.layers); for (const as of json.assets) if (as.layers) fix(as.layers);
}
