// Cromatic · stories in Lottie · story D4 (TASK-065f): Steam's case page scrolled for real (capture-steam-d4.mjs, the
// live /work/steam/ to its T-shirts) into story D's images (d4-steam-scroll-*.webp), added to D3's plates as
// platesD4.json.   node plates-d4.mjs [captureDir]
import fs from "fs";
import path from "path";
import sharp from "/Users/daniel.stoic/cromatic-drive/node_modules/sharp/lib/index.js";
const CAP = process.argv[2] || "/private/tmp/claude-501/-Users-daniel-stoic/91f99970-4c85-4c76-9af9-b4762e98f53c/scratchpad/sd4/steam";
const here = path.dirname(new URL(import.meta.url).pathname), OUT = path.resolve(here, "../images");
const P3 = JSON.parse(fs.readFileSync(path.join(here, "platesD3.json"), "utf8")), meta = { ...P3.plates }, nums = { ...P3.shots };
const fr = fs.readdirSync(CAP).filter((f) => f.startsWith("raw-")).sort(), names = [];
for (const f of fr) { const nm = `d4-steam-scroll-${f.slice(4, 7)}`, out = path.join(OUT, nm + ".webp"); await sharp(`${CAP}/${f}`).resize(1080, 1920, { fit: "cover" }).webp({ quality: 80, effort: 4 }).toFile(out); meta[nm] = { file: nm + ".webp", x: 0, y: 0, w: 1080, h: 1920, kb: Math.round(fs.statSync(out).size / 1024) }; names.push(nm); }
nums.steamScroll = { frames: names };
fs.writeFileSync(path.join(here, "platesD4.json"), JSON.stringify({ plates: meta, shots: nums }));
console.log("plates D4", names.length, "scroll frames");
