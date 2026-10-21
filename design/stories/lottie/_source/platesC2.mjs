// Cromatic · stories in Lottie · story C v2 (TASK-065): the chase's renders (RAW2) into plates (images/c2-*.webp) and
// their places in each shot's frame (platesC2.json). node platesC2.mjs
import fs from "fs";
import path from "path";
import sharp from "/Users/daniel.stoic/cromatic-drive/node_modules/sharp/lib/index.js";
import crypto from "crypto";
import { ORDER } from "./chase2.mjs";
const RAW = process.env.RAW || "/private/tmp/claude-501/-Users-daniel-stoic/307623b0-7c3c-4b30-b2d7-c12e0dda2036/scratchpad/stl/raw2";
const here = path.dirname(new URL(import.meta.url).pathname), OUT = path.resolve(here, "../images");
const plates = {}, shots = {};
async function write(name, file, { at = [0, 0], opaque = false, q = 82, crop = true } = {}) {
  const { data, info } = await sharp(file).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let x0 = 0, y0 = 0, x1 = info.width - 1, y1 = info.height - 1;
  if (crop) { x0 = info.width; y0 = info.height; x1 = -1; y1 = -1; for (let y = 0; y < info.height; y++) for (let x = 0; x < info.width; x++) if (data[(y * info.width + x) * 4 + 3] > 2) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } if (x1 < 0) return null; x0 = Math.max(0, x0 - 3); y0 = Math.max(0, y0 - 3); x1 = Math.min(info.width - 1, x1 + 3); y1 = Math.min(info.height - 1, y1 + 3); }
  let s = sharp(data, { raw: { width: info.width, height: info.height, channels: 4 } }).extract({ left: x0, top: y0, width: x1 - x0 + 1, height: y1 - y0 + 1 });
  if (opaque) s = s.removeAlpha();
  await s.webp({ quality: q, alphaQuality: 90, effort: 4 }).toFile(path.join(OUT, name + ".webp"));
  plates[name] = { file: name + ".webp", x: at[0] + x0, y: at[1] + y0, w: x1 - x0 + 1, h: y1 - y0 + 1, kb: Math.round(fs.statSync(path.join(OUT, name + ".webp")).size / 1024) };
  return name;
}
for (const k of ORDER) {
  const J = JSON.parse(fs.readFileSync(`${RAW}/${k}.json`, "utf8"));
  const plate = await write(`c2-${k}-plate`, `${RAW}/${k}-plate.png`, { opaque: true, crop: false, q: 84 });
  const sprites = {};
  for (const car of ["yellow", "cop"]) {
    sprites[car] = [];
    // (a car standing still renders the same picture frame after frame: one plate for all of them)
    const seen = new Map();
    for (let i = 0; i < J.sprites[car].length; i++) {
      const r = J.sprites[car][i]; if (!r) { sprites[car].push(null); continue; }
      const f = `${RAW}/${k}-${car}-${String(i).padStart(3, "0")}.png`, h = crypto.createHash("sha1").update(fs.readFileSync(f)).digest("hex") + r.join(",");
      if (seen.has(h)) { sprites[car].push(seen.get(h)); continue; }
      const nm = await write(`c2-${k}-${car}-${String(i).padStart(3, "0")}`, f, { at: [r[0], r[1]] }); seen.set(h, nm); sprites[car].push(nm);
    }
  }
  shots[k] = { o: J.o, plate, sprites };
  console.log(k, sprites.yellow.filter(Boolean).length, sprites.cop.filter(Boolean).length);
}
fs.writeFileSync(path.join(here, "platesC2.json"), JSON.stringify({ plates, shots }));
console.log("plates C2", Object.keys(plates).length, Object.values(plates).reduce((s, m) => s + m.kb, 0), "KB");
