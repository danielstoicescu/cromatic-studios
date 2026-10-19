// Cromatic opening · build every direction, both artboards: design/intro-lottie/<A|B|C>/<desktop|phone>.json
// node build.mjs [A B C]
import fs from "fs";
import path from "path";
import zlib from "zlib";
import { fileURLToPath } from "url";
import { loadType } from "./lib/type.mjs";
import { ARTBOARDS } from "./lib/kit.mjs";
import { buildA } from "./directions/A.mjs";
import { buildB } from "./directions/B.mjs";
import { buildC } from "./directions/C.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(here, "..");
const want = process.argv.slice(2);
const T = await loadType();
const DIRS = { A: buildA, B: buildB, C: buildC };
const sizes = {};
for (const [k, build] of Object.entries(DIRS)) {
  if (want.length && !want.includes(k)) continue;
  for (const ab of Object.values(ARTBOARDS)) {
    const json = build(T, ab);
    const s = JSON.stringify(json);
    const file = path.join(OUT, k, `${ab.name}.json`);
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, s);
    const gz = zlib.gzipSync(s, { level: 9 }).length, br = zlib.brotliCompressSync(Buffer.from(s), { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11 } }).length;
    const layers = json.layers.length, shapes = countShapes(json.layers);
    sizes[`${k}/${ab.name}`] = { raw: s.length, gz, br, layers, paths: shapes, frames: json.op, markers: json.markers.map((m) => `${m.cm}@${m.tm}+${m.dr}`).join(" ") };
  }
}
console.table(sizes);
fs.writeFileSync(path.join(here, "sizes.json"), JSON.stringify(sizes, null, 1));

function countShapes(ls) { let n = 0; const walk = (it) => it.forEach((s) => { if (s.ty === "sh" || s.ty === "rc" || s.ty === "el") n++; if (s.it) walk(s.it); }); ls.forEach((l) => l.shapes && walk(l.shapes)); return n; }
