// Cromatic · stories in Lottie · C8 (TASK-065i): the cinematic post (post.mjs) on story-c8-en.json's images: the frame
// sequences (frames/c8 interior, frames/c8oma the OMA pass) into frames/c8p with the tilt-shift; the plates (opaque)
// and the sprites and water (alpha: the grade only) into images-c8/, the story's assets pointed there. The cards and
// the grain are drawn by Lottie: untouched.   node postC8.mjs [--frames] [--images]
import fs from "fs";
import path from "path";
import sharp from "/Users/daniel.stoic/cromatic-drive/node_modules/sharp/lib/index.js";
import { post } from "./post.mjs";
const here = path.dirname(new URL(import.meta.url).pathname), L = path.resolve(here, "..");
const all = process.argv.length <= 2, doF = all || process.argv.includes("--frames"), doI = all || process.argv.includes("--images");
if (doF) for (const [dir, re] of [["frames/c8", /^int-\d{3}\.webp$/], ["frames/c8oma", /^oma-\d{3}\.webp$/]]) {
  for (const f of fs.readdirSync(path.join(L, dir)).filter((x) => re.test(x))) await sharp(await post(path.join(L, dir, f), { tilt: true, amt: 0.7 })).removeAlpha().webp({ quality: 86, effort: 4 }).toFile(path.join(L, "frames/c8p", f));
  console.log(dir, "graded");
}
if (doI) {
  const J = JSON.parse(fs.readFileSync(path.join(L, "story-c8-en.json"), "utf8")); fs.mkdirSync(path.join(L, "images-c8"), { recursive: true });
  let n = 0;
  for (const a of J.assets) {
    if (a.u !== "images/" || !a.p || /grain/i.test(a.id)) continue;
    const src = path.join(L, "images", a.p), dst = path.join(L, "images-c8", a.p), m = await sharp(src).metadata();
    if (!fs.existsSync(dst)) { const opaque = !m.hasAlpha && a.w >= 2000; const b = await post(src, { tilt: opaque, amt: 0.7 }); await (opaque ? sharp(b).removeAlpha() : sharp(b)).webp({ quality: opaque ? 84 : 82, alphaQuality: 92, effort: 4 }).toFile(dst); }
    a.u = "images-c8/"; n++;
  }
  fs.writeFileSync(path.join(L, "story-c8-en.json"), JSON.stringify(J)); console.log("images graded", n);
}
