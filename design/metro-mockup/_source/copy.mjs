// Cromatic · metro mockups (TASK-062): the web set into the site. The pieces' pictures (both sets) go to
// site/media/metro/<id>-s1.webp / -s2.webp (hashed into /assets/m by the build), each piece's still (the frame the page
// shows before it plays, and for reduced motion) to site/media/metro/<shot>-still.jpg; the pictures' addresses per piece
// are written to site/cases/src/metro-assets.mjs ("m:" keys the build swaps for the hashed addresses), the stills'
// sizes to site/cases/src/dims.json.
//   PLATES=<dir with s1/ s2/> STILLS=<dir with <shot>-still.jpg> node copy.mjs [shot ...]   (none: all three)
import fs from "fs";
import path from "path";
import sharp from "/Users/daniel.stoic/cromatic-drive/node_modules/sharp/lib/index.js";
const here = path.dirname(new URL(import.meta.url).pathname), root = path.resolve(here, "../../..");
const PL = JSON.parse(fs.readFileSync(path.join(here, "plates.json"), "utf8"));
const PLATES = process.env.PLATES, STILLS = process.env.STILLS;
const media = path.join(root, "site/media/metro");
// only the shots named (node copy.mjs platform train): the others keep their files and their entries
const only = process.argv.slice(2), PRE = { platform: "p-", train: "t-", inside: "i-" };
const ASSETS = path.join(root, "site/cases/src/metro-assets.mjs");
const prev = fs.existsSync(ASSETS) ? (await import(ASSETS + "?" + Date.now())).METRO : {};
fs.mkdirSync(media, { recursive: true });
for (const f of fs.readdirSync(media)) { const sh = Object.keys(PRE).find((k) => f.startsWith(PRE[k]) || f.startsWith(k + "-still")); if (!only.length || only.includes(sh)) fs.rmSync(path.join(media, f)); }
const out = {}; let kb = { s1: 0, s2: 0 };
for (const [shot, plates] of Object.entries(PL)) {
  if (typeof plates !== "object" || shot.startsWith("_")) continue;
  if (only.length && !only.includes(shot)) { out["metro-" + shot] = prev["metro-" + shot]; continue; }
  const name = "metro-" + shot; out[name] = { s1: {}, s2: {} };
  // (only the pictures the piece uses)
  const used = new Set(JSON.parse(fs.readFileSync(path.join(root, "src/lottie-ui", `${name}-s1.json`), "utf8")).assets.filter((a) => a.p).map((a) => a.id));
  for (const [id, P] of Object.entries(plates)) {
    if (!P || !P.s1 || !used.has(id)) continue;
    for (const set of ["s1", "s2"]) {
      const f = `${id}-${set}.webp`;
      fs.copyFileSync(path.join(PLATES, set, id + ".webp"), path.join(media, f));
      out[name][set][id] = `m:metro/${id}-${set}`;
      kb[set] += fs.statSync(path.join(media, f)).size / 1024;
    }
  }
}
// the stills: 1600 px wide (the case pages' size; the build makes the smaller copies)
const dimsF = path.join(root, "site/cases/src/dims.json"), dims = JSON.parse(fs.readFileSync(dimsF, "utf8"));
for (const shot of ["platform", "train", "inside"]) {
  if (only.length && !only.includes(shot)) continue;
  const src = path.join(STILLS, `${shot}-still.jpg`); if (!fs.existsSync(src)) continue;
  const dst = path.join(media, `${shot}-still.jpg`);
  const info = await sharp(src).resize({ width: shot === "inside" ? 1080 : 1600 }).jpeg({ quality: 84, mozjpeg: true }).toFile(dst);
  dims[`m:metro/${shot}-still`] = [info.width, info.height, fs.statSync(dst).size];
}
const tail = fs.readFileSync(dimsF, "utf8").endsWith("\n") ? "\n" : "";
fs.writeFileSync(dimsF, JSON.stringify(dims, null, 1).replace(/^ +/gm, "") + tail); // (the file's own format)
fs.writeFileSync(path.join(root, "site/cases/src/metro-assets.mjs"), `// TASK-062: the metro mockups' pictures, by piece and set (written by design/metro-mockup/_source/copy.mjs)\nexport const METRO = ${JSON.stringify(out, null, 1)};\n`);
console.log("site/media/metro:", fs.readdirSync(media).length, "files; s1", kb.s1.toFixed(0), "KB, s2", kb.s2.toFixed(0), "KB");
