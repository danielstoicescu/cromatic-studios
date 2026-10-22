// Cromatic · stories in Lottie · story B7 (TASK-065h): renderV6.mjs JOB=b7's captures into the story's frames
// (frames/b7/sKK-NNN.webp, 1080 x 1920; local, gitignored, rebuilt from RAW by this script).   node framesB7.mjs [segs]
import fs from "fs";
import path from "path";
import sharp from "/Users/daniel.stoic/cromatic-drive/node_modules/sharp/lib/index.js";
const R = (process.env.RAW || "/private/tmp/claude-501/-Users-daniel-stoic/8f3b4503-769c-4f86-ba4b-8e36528128b3/scratchpad/stl4/raw") + "/v6/b7";
const here = path.dirname(new URL(import.meta.url).pathname), OUT = path.resolve(here, "../frames/b7");
fs.mkdirSync(OUT, { recursive: true });
const only = process.argv[2] ? process.argv[2].split(",").map(Number) : null, idx = fs.existsSync(path.join(OUT, "index.json")) ? JSON.parse(fs.readFileSync(path.join(OUT, "index.json"), "utf8")) : {};
const files = fs.readdirSync(R).filter((f) => f.endsWith(".png")).sort();
for (const f of files) { const k = +f.slice(1, 3); if (only && !only.includes(k)) continue; const nm = f.replace(".png", ""); await sharp(`${R}/${f}`).resize(1080, 1920).removeAlpha().webp({ quality: 84, effort: 4 }).toFile(path.join(OUT, nm + ".webp")); (idx[k] = idx[k] || []); if (!idx[k].includes(nm)) idx[k].push(nm); }
for (const k of Object.keys(idx)) idx[k].sort();
fs.writeFileSync(path.join(OUT, "index.json"), JSON.stringify(idx));
console.log(Object.fromEntries(Object.entries(idx).map(([k, v]) => [k, v.length])));
