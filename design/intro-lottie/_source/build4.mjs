// Nine cups v2: node build4.mjs [ninecups2|cup2test] [--site] -> ../phase3/<out>/{desktop,phone}.json
//   --site (beta 3.69: Nine cups v2 is the site's opening): also src/intro/intro-{desktop,phone}.json and
//   src/intro/worlds-{desktop,phone}.webp (the square atlas, the same for both)
import fs from "fs";
import path from "path";
import zlib from "zlib";
import { fileURLToPath } from "url";
import { loadType } from "./lib/type.mjs";
import { ARTBOARDS2 } from "./directions/A2.mjs";
import { simplifyKeys } from "./lib/optimize.mjs";
const here = path.dirname(fileURLToPath(import.meta.url));
const T = await loadType();
const SITE = process.argv.includes("--site") ? path.resolve(here, "../../../src/intro") : null;
const want = process.argv.slice(2).filter((a) => !a.startsWith("--"));
const DIRS = {
  cup2test: { out: "_cup2test", fn: async () => (await import("./directions/cup2test.mjs")).buildCup2Test },
  ninecups2: { out: "ninecups-v2", fn: async () => (await import("./directions/ninecups2.mjs")).buildNineCups2 }
};
import { createRequire } from "module";
const sharp = createRequire(import.meta.url)(path.resolve(here, "../../../node_modules/sharp"));
// the square atlas: each world's street (its Multiverse preview, a square from under its top), 3 x 3 cells of 150 px,
// each darkened toward its edge as the espresso round a picture in a cup (the radial edge the coffee had as a layer)
async function squareAtlas() {
  const ids = ["monument", "nightlife", "ghibli", "sketch", "circuit", "orchid", "underwater", "gta2", "riso"];
  const r = 75 / 1.04;
  const vig = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="150" height="150"><defs><radialGradient id="v" cx="75" cy="75" r="${r}" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#1c0e07" stop-opacity="0"/><stop offset="0.62" stop-color="#1c0e07" stop-opacity="0.05"/><stop offset="0.88" stop-color="#1c0e07" stop-opacity="0.35"/><stop offset="1" stop-color="#1c0e07" stop-opacity="0.7"/></radialGradient></defs><rect width="150" height="150" fill="url(#v)"/></svg>`);
  const tiles = await Promise.all(ids.map(async (id) => sharp(await sharp(path.join(here, "assets/worlds", id + ".jpg")).extract({ left: 0, top: 40, width: 324, height: 324 }).resize(150, 150).toBuffer()).composite([{ input: vig }]).toBuffer()));
  return sharp({ create: { width: 450, height: 450, channels: 3, background: "#ffffff" } }).composite(tiles.map((b, i) => ({ input: b, left: (i % 3) * 150, top: Math.floor(i / 3) * 150 }))).webp({ quality: 62, effort: 6 }).toBuffer();
}
const sizes = {};
for (const name of want.length ? want : ["ninecups2"]) {
  const D = DIRS[name], build = await D.fn();
  const out = path.resolve(here, "../phase3", D.out);
  fs.mkdirSync(out, { recursive: true });
  let atlasImg = null;
  if (name === "ninecups2") { atlasImg = await squareAtlas(); fs.writeFileSync(path.join(out, "worlds-sq.webp"), atlasImg); sizes.atlas = { kb: +(atlasImg.length / 1024).toFixed(1) }; }
  for (const ab of Object.values(ARTBOARDS2)) {
    const json = build(T, ab, { out });
    const sk = simplifyKeys(json);
    const s = JSON.stringify(json);
    fs.writeFileSync(path.join(out, `${ab.name}.json`), s);
    if (SITE && name === "ninecups2") { fs.writeFileSync(path.join(SITE, `intro-${ab.name}.json`), s); fs.writeFileSync(path.join(SITE, `worlds-${ab.name}.webp`), atlasImg); }
    sizes[`${name} ${ab.name}`] = { kb: +(s.length / 1024).toFixed(1), br: +(zlib.brotliCompressSync(Buffer.from(s)).length / 1024).toFixed(1), layers: json.layers.length, assets: json.assets.length, frames: json.op, keys: `${sk.before} -> ${sk.after}` };
  }
}
console.table(sizes);
