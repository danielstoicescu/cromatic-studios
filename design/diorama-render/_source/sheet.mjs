// Cromatic · diorama renders (TASK-118): a contact sheet of a shot's frames (every Nth), to check a clip at a glance.
//   node _source/sheet.mjs out/slow [every=13] [out.jpg]
import fs from "fs";
import path from "path";
import sharp from "/Users/daniel.stoic/cromatic-drive/node_modules/sharp/lib/index.js";
const dir = path.resolve(process.argv[2]), name = path.basename(dir), every = +(process.argv[3] || 13);
const fr = fs.readdirSync(dir).filter((f) => new RegExp(`^${name}-\\d{4}\\.png$`).test(f)).sort().filter((_, i, a) => i % every === 0 || i === a.length - 1);
const W = 270, H = 480, cols = Math.min(fr.length, 9), rows = Math.ceil(fr.length / cols);
const tiles = await Promise.all(fr.map((f) => sharp(path.join(dir, f)).resize(W, H).toBuffer()));
const out = process.argv[4] || path.join(dir, `${name}-sheet.jpg`);
await sharp({ create: { width: cols * W, height: rows * H, channels: 3, background: "#111" } }).composite(tiles.map((t, i) => ({ input: t, left: (i % cols) * W, top: Math.floor(i / cols) * H }))).jpeg({ quality: 86 }).toFile(out);
console.log(fr.length, "->", out);
