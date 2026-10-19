// Cromatic · the site's Lottie layer: writes every piece's JSON
//   src/lottie-ui/<name>.json   (the site's build hashes them into /assets and lists them in window.__CZL_CFG; the
//                                previews and renders in design/lottie-ui/<n>-<piece>/ read the same files)
// node build.mjs [piece ...]   (the type libraries are found in design/node_modules: see README)
import fs from "fs";
import path from "path";
import zlib from "zlib";
import { fileURLToPath } from "url";
import { loadType } from "./lib/ui.mjs";
import { buildStamp, buildFinale, FINALE_AB } from "./pieces/finale.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(here, "../../../src/lottie-ui"), DESIGN = path.resolve(here, "..");
const only = process.argv.slice(2);
const T = await loadType();
// name -> [piece folder, () => json]
const PIECES = {
  "1-finale": {
    "stamp-en": () => buildStamp(T, "en"),
    "stamp-ro": () => buildStamp(T, "ro"),
    "finale-desktop": () => buildFinale(T, FINALE_AB.desktop),
    "finale-phone": () => buildFinale(T, FINALE_AB.phone)
  }
};
const sizes = {};
fs.mkdirSync(SITE, { recursive: true });
for (const [dir, items] of Object.entries(PIECES)) {
  if (only.length && !only.some((o) => dir.includes(o))) continue;
  for (const [name, make] of Object.entries(items)) {
    const j = make(), s = JSON.stringify(j);
    fs.writeFileSync(path.join(SITE, name + ".json"), s);
    sizes[name] = { kb: +(s.length / 1024).toFixed(1), brKb: +(zlib.brotliCompressSync(Buffer.from(s)).length / 1024).toFixed(1), layers: j.layers.length, frames: j.op, size: `${j.w}x${j.h}` };
  }
}
console.table(sizes);
const prev = fs.existsSync(path.join(here, "sizes.json")) ? JSON.parse(fs.readFileSync(path.join(here, "sizes.json"), "utf8")) : {};
fs.writeFileSync(path.join(here, "sizes.json"), JSON.stringify({ ...prev, ...sizes }, null, 1));
