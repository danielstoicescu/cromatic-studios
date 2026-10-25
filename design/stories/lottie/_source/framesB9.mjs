// Cromatic · stories in Lottie · story B9: the diorama renders, already graded per world (cromatic-vera-e8
// design/diorama-render/_source/b9-post.mjs -> sKK-NNN.jpg, 1080 x 1920), into the story's frames: frames/b9/sKK-NNN.webp
// (local, gitignored) + index.json (per shot: [frame index at 30 a second, name]). No post here: the light is the render's.
//   node framesB9.mjs <graded dir> [segs]
import fs from "fs";
import path from "path";
import sharp from "/Users/daniel.stoic/cromatic-drive/node_modules/sharp/lib/index.js";
const here = path.dirname(new URL(import.meta.url).pathname), OUT = path.resolve(here, "../frames/b9");
const [IN, segs] = process.argv.slice(2), only = segs ? segs.split(",").map(Number) : null;
fs.mkdirSync(OUT, { recursive: true });
const idx = fs.existsSync(path.join(OUT, "index.json")) ? JSON.parse(fs.readFileSync(path.join(OUT, "index.json"), "utf8")) : {};
for (const f of fs.readdirSync(IN).filter((f) => /^s\d\d-\d{3}\.jpg$/.test(f)).sort()) {
  const k = +f.slice(1, 3), i = +f.slice(4, 7), nm = f.replace(".jpg", ""); if (only && !only.includes(k)) continue;
  const dst = path.join(OUT, nm + ".webp");
  if (!fs.existsSync(dst) || fs.statSync(dst).mtimeMs < fs.statSync(path.join(IN, f)).mtimeMs) await sharp(path.join(IN, f)).webp({ quality: 88, effort: 4 }).toFile(dst);
  (idx[k] = idx[k] || []); if (!idx[k].some(([j]) => j === i)) idx[k].push([i, nm]);
}
for (const k of Object.keys(idx)) idx[k].sort((a, b) => a[0] - b[0]);
fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify(idx));
console.log(Object.fromEntries(Object.entries(idx).map(([k, v]) => [k, v.length])));
