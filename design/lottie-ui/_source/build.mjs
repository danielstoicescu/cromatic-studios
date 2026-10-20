// Cromatic · the site's Lottie layer: writes every piece's JSON
//   src/lottie-ui/<name>.json   (the site's build hashes them into /assets and lists them in window.__CZL_CFG; the
//                                previews and renders in design/lottie-ui/<n>-<piece>/ read the same files)
// node build.mjs [piece ...]   (the type libraries are found in design/node_modules: see README)
import fs from "fs";
import path from "path";
import zlib from "zlib";
import { fileURLToPath } from "url";
import { loadType } from "./lib/ui.mjs";
import { buildStamp, buildFinale, FINALE_AB } from "./pieces/finale.mjs";
import { buildDrive, buildViews, buildPlaces, buildWorlds, buildGame } from "./pieces/onboarding.mjs";
import { WPAL, buildWDrive, buildWTap, buildWWork, buildWHi, buildWOpen } from "./pieces/welcome.mjs";
import { GAB, GPAL, buildGamePx } from "./pieces/game.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const SITE = path.resolve(here, "../../../src/lottie-ui"), DESIGN = path.resolve(here, "..");
const only = process.argv.slice(2);
const T = await loadType();
// name -> [piece folder, () => json]
const PIECES = {
  "1-finale": {
    "stamp-en": () => buildStamp(T, "en"),
    "stamp-ro": () => buildStamp(T, "ro"),
    "finale-desktop": () => buildFinale(T, FINALE_AB.desktop),
    "finale-phone": () => buildFinale(T, FINALE_AB.phone)
  },
  "2-onboarding": Object.fromEntries(["light", "dark"].flatMap((th) => [
    [`onb-drive-keys-${th}`, () => buildDrive(T, { theme: th, mode: "keys" })],
    [`onb-drive-stick-${th}`, () => buildDrive(T, { theme: th, mode: "stick" })],
    [`onb-views-key-${th}`, () => buildViews(T, { theme: th, key: true })],
    [`onb-views-tap-${th}`, () => buildViews(T, { theme: th, key: false })],
    [`onb-places-${th}`, () => buildPlaces(T, { theme: th })],
    [`onb-worlds-${th}`, () => buildWorlds(T, { theme: th })],
    [`onb-game-${th}-en`, () => buildGame(T, { theme: th, lang: "en" })],
    [`onb-game-${th}-ro`, () => buildGame(T, { theme: th, lang: "ro" })]
  ])),
  // 4 · the map's welcome card (TASK-007): the four steps' explainers (the card's light paper, and Sketchbook's notebook)
  // and its opening out of the intro's pill
  "4-welcome": {
    ...Object.fromEntries(["light", "sketch"].flatMap((th) => [
      [`welcome-drive-${th}`, () => buildWDrive(T, WPAL[th])],
      [`welcome-tap-${th}`, () => buildWTap(T, WPAL[th])],
      [`welcome-work-${th}`, () => buildWWork(T, WPAL[th])],
      [`welcome-hi-${th}`, () => buildWHi(T, WPAL[th])]
    ])),
    "welcome-open": () => buildWOpen()
  },
  // 5 · into the arcade game and back out (TASK-009): the screen into chunky pixels and out of them, wide and tall, in the
  // game's dusk and in Sketchbook's notebook
  "5-game": Object.fromEntries(["wide", "tall"].flatMap((ab) => ["light", "sketch"].flatMap((th) => ["en", "ro"].map((lang) => [`game-${ab}${th === "sketch" ? "-sketch" : ""}-${lang}`, () => buildGamePx(GAB[ab], GPAL[th], lang)]))))
  // (3-transitions: the case page's window, r233, was replaced by a CSS pill in r235: pieces/window.mjs is kept as a source)
};
const sizes = {};
fs.mkdirSync(SITE, { recursive: true });
for (const [dir, items] of Object.entries(PIECES)) {
  if (only.length && !only.some((o) => dir.includes(o))) continue;
  for (const [name, make] of Object.entries(items)) {
    const j = make(), s = JSON.stringify(j);
    fs.writeFileSync(path.join(SITE, name + ".json"), s);
    sizes[name] = { kb: +(s.length / 1024).toFixed(1), brKb: +(zlib.brotliCompressSync(Buffer.from(s)).length / 1024).toFixed(1), layers: j.layers.length, frames: j.op, size: `${j.w}x${j.h}` };
  }
}
console.table(sizes);
const prev = fs.existsSync(path.join(here, "sizes.json")) ? JSON.parse(fs.readFileSync(path.join(here, "sizes.json"), "utf8")) : {};
fs.writeFileSync(path.join(here, "sizes.json"), JSON.stringify({ ...prev, ...sizes }, null, 1));
