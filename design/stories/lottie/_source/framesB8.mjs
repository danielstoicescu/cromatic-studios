// Cromatic · stories in Lottie · story B8 (TASK-065j): renderV6.mjs JOB=b8's captures into the story's frames, with the
// light post on the image (post.mjs: Vera's grade, luts/cromatic-diorama.cube by day and cromatic-night.cube in the dark
// worlds, and the soft tilt-shift); the cards and the grain stay Lottie's, untouched. frames/b8/sKK-NNN.webp (1080 x
// 1920; local, gitignored) + index.json (per shot: [frame index at 30 a second, name]).   RAW=... node framesB8.mjs [segs]
import fs from "fs";
import path from "path";
import sharp from "/Users/daniel.stoic/cromatic-drive/node_modules/sharp/lib/index.js";
import { post } from "./post.mjs";
import { SEG } from "./shotsB8.mjs";
const here = path.dirname(new URL(import.meta.url).pathname), OUT = path.resolve(here, "../frames/b8");
const R = (process.env.RAW || path.resolve(here, "../frames/raw")) + "/v6/b8";
const NIGHT = { nightlife: 1, underwater: 1, gta2: 1 }, AMT = +process.env.AMT || 0.75;
fs.mkdirSync(OUT, { recursive: true });
const only = process.argv[2] ? process.argv[2].split(",").map(Number) : null, idx = fs.existsSync(path.join(OUT, "index.json")) ? JSON.parse(fs.readFileSync(path.join(OUT, "index.json"), "utf8")) : {};
for (const f of fs.readdirSync(R).filter((f) => f.endsWith(".png")).sort()) {
  const k = +f.slice(1, 3), i = +f.slice(4, 7), nm = f.replace(".png", ""); if (only && !only.includes(k)) continue;
  const dst = path.join(OUT, nm + ".webp");
  if (!fs.existsSync(dst) || fs.statSync(dst).mtimeMs < fs.statSync(path.join(R, f)).mtimeMs || process.env.FORCE) {
    const small = await sharp(path.join(R, f)).resize(1080, 1920).removeAlpha().png().toBuffer();
    await sharp(await post(small, { tilt: true, amt: AMT, lut: NIGHT[SEG[k].world] ? "night" : "diorama" })).removeAlpha().webp({ quality: 86, effort: 4 }).toFile(dst);
  }
  (idx[k] = idx[k] || []); if (!idx[k].some(([j]) => j === i)) idx[k].push([i, nm]);
}
for (const k of Object.keys(idx)) idx[k].sort((a, b) => a[0] - b[0]);
fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify(idx));
console.log(Object.fromEntries(Object.entries(idx).map(([k, v]) => [k, v.length])));
