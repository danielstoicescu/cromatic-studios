// Cromatic · stories in Lottie · story D5 (TASK-115, Iris): the captures into the story's frames and plates.
//   frames/d5/ (local, gitignored: the backgrounds composed under the Lottie by compose-d5.mjs, 1080 x 1920 webp)
//     site-NNN   the site's portfolio grid, scrolled slowly (capture-work-d3.mjs, DIST=760, 4.4 s)
//     bird-NNN, zoom-NNN, steam-NNN   the map's frames at 2x (renderD5.mjs; the zoom's subframes averaged: its shutter)
//     page-NNN   Steam's case page, three bursts and three stops (capture-steam-d5.mjs)
//   images/d5-pin-<id>.webp, d5-card-<id>.webp, d5-page-last.webp (in the Lottie: the map's pins and place cards, the
//   page's last frame for its close into the pill)
//   platesD5.json: D4's plates and numbers + these (each pin's anchor: the foot of its stem; the pins' places per frame)
//   node plates-d5.mjs <raw dir> <work dir> <steam dir> <ui dir>
import fs from "fs";
import path from "path";
import sharp from "/Users/daniel.stoic/cromatic-drive/node_modules/sharp/lib/index.js";
const [RAW, WORK, STEAM, UI] = process.argv.slice(2);
const here = path.dirname(new URL(import.meta.url).pathname), IMG = path.resolve(here, "../images"), FR = path.resolve(here, "../../frames/d5");
fs.mkdirSync(FR, { recursive: true });
const P4 = JSON.parse(fs.readFileSync(path.join(here, "platesD4.json"), "utf8")), meta = { ...P4.plates }, nums = { ...P4.shots };
const J = JSON.parse(fs.readFileSync(`${RAW}/d5.json`, "utf8"));
const webp = (src, out) => sharp(src).resize(1080, 1920, { fit: "cover", kernel: "lanczos3" }).removeAlpha().webp({ quality: 86, effort: 4 }).toFile(out);
const frames = {};
// the map's shots (a frame of the zoom is the mean of its subframes)
for (const k of ["bird", "zoom", "steam"]) {
  if (!J[k]) continue; frames[k] = [];
  for (let i = 0; i < J[k].cams.length; i++) {
    const n = String(i).padStart(3, "0"), ns = J[k].subs[i], out = `${FR}/${k}-${n}.webp`;
    if (ns > 1) {
      const bufs = await Promise.all(Array.from({ length: ns }, (_, j) => sharp(`${RAW}/d5/${k}-${n}-s${j}.png`).removeAlpha().raw().toBuffer({ resolveWithObject: true })));
      const { width, height } = bufs[0].info, acc = new Uint16Array(width * height * 3);
      for (const b of bufs) for (let q = 0; q < acc.length; q++) acc[q] += b.data[q];
      const avg = Buffer.alloc(acc.length); for (let q = 0; q < acc.length; q++) avg[q] = Math.round(acc[q] / ns);
      await sharp(avg, { raw: { width, height, channels: 3 } }).resize(1080, 1920, { kernel: "lanczos3" }).webp({ quality: 86, effort: 4 }).toFile(out);
    } else await webp(`${RAW}/d5/${k}-${n}.png`, out);
    frames[k].push(path.basename(out));
  }
}
// the site's grid and Steam's page (already 1080 x 1920)
for (const [k, dir] of [["site", WORK], ["page", STEAM]]) {
  frames[k] = [];
  for (const f of fs.readdirSync(dir).filter((x) => x.startsWith("raw-")).sort()) { const out = `${FR}/${k}-${f.slice(4, 7)}.webp`; await webp(`${dir}/${f}`, out); frames[k].push(path.basename(out)); }
}
// the page's last frame, for its close into the pill (in the Lottie)
{ const last = fs.readdirSync(STEAM).filter((x) => x.startsWith("raw-")).sort().pop(), nm = "d5-page-last"; await webp(`${STEAM}/${last}`, `${IMG}/${nm}.webp`); meta[nm] = { file: nm + ".webp", x: 0, y: 0, w: 1080, h: 1920 }; }
// the street at the end of the move, for under the close
{ const nm = "d5-street"; await webp(`${RAW}/d5/steam-${String(J.steam.cams.length - 1).padStart(3, "0")}.png`, `${IMG}/${nm}.webp`); meta[nm] = { file: nm + ".webp", x: 0, y: 0, w: 1080, h: 1920 }; }
// the pins (at 2x of the story: drawn at 50 %) and the cards; each pin's anchor = the bottom of its stem's dot
const ui = JSON.parse(fs.readFileSync(`${UI}/ui-d5.json`, "utf8")), pins = {};
for (const id of Object.keys(ui.pins)) {
  const src = `${UI}/pin-${id}.png`, { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  let yb = 0, xs = 0, xn = 0;
  for (let y = info.height - 1; y >= 0 && !yb; y--) for (let x = 0; x < info.width; x++) if (data[(y * info.width + x) * 4 + 3] > 140) { yb = y; break; }
  for (let x = 0; x < info.width; x++) if (data[(yb * info.width + x) * 4 + 3] > 140) { xs += x; xn++; }
  const nm = `d5-pin-${id}`; await sharp(src).webp({ quality: 92, alphaQuality: 100 }).toFile(`${IMG}/${nm}.webp`);
  meta[nm] = { file: nm + ".webp", x: 0, y: 0, w: info.width, h: info.height }; pins[id] = { img: nm, anchor: [Math.round(xs / Math.max(1, xn)), yb], w: info.width, h: info.height };
}
const cards = {};
for (const id of Object.keys(ui.cards)) { const nm = `d5-card-${id}`, src = `${UI}/card-${id}.png`, m = await sharp(src).metadata(); await sharp(src).webp({ quality: 90, alphaQuality: 100 }).toFile(`${IMG}/${nm}.webp`); meta[nm] = { file: nm + ".webp", x: 0, y: 0, w: m.width, h: m.height }; cards[id] = { img: nm, w: m.width, h: m.height }; }
const stp = JSON.parse(fs.readFileSync(`${STEAM}/plan.json`, "utf8"));
nums.d5 = { frames, pins, cards, pinsAt: { bird: J.bird && J.bird.pins, zoom: J.zoom && J.zoom.pins, steam: J.steam && J.steam.pins }, steamPlan: stp };
fs.writeFileSync(path.join(here, "platesD5.json"), JSON.stringify({ plates: meta, shots: nums }));
console.log("D5:", Object.fromEntries(Object.entries(frames).map(([k, v]) => [k, v.length])), "pins", Object.keys(pins).length, "cards", Object.keys(cards).length);
