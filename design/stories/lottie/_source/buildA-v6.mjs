// Cromatic · stories in Lottie · story A6 (TASK-065g, Daniel's notes on A5), English, 1080 x 1920, 60 fps, 16 s.
// Every background is the map itself (beta 4.4), captured frame by frame at 2x with the camera moving in the map
// (renderV6.mjs JOB=a6 -> framesA6.mjs: frames/a6/, local); no plate is redrawn or pushed in Lottie any more. The ride is
// in each capture (its matte and the camera's numbers are kept per frame in RAW/v6/a6.json for a better car later).
//   1 · straight down on the ride driving up the coffee street: Our new website / is a [city.] -> [diorama.] (a1, now
//       on the aplat: the frame was too dark for ink)
//   2-4 · Steam's street (the ride parked), OMA (its room lit behind the glass, people in it: omaRoom.js), the Slow
//       Coffee dome from high with the whole city behind: Every brand / has its own [place. / facade. / building.]
//   5 · from behind the ride: it pulls away down the street: Take your / drive.; the pill, centred; black under it
//   node buildA-v6.mjs -> story-a6-en.json
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Comp, group, rect, fill, gfill, rgb, E, prop } from "../../../lottie-ui/_source/lib/ui.mjs";
import { W, H, bake } from "./build.mjs";
import { grain, grainPlates } from "./kit2.mjs";
import { loadCards, drawCard } from "../../cards/cards.mjs";
const KC = await loadCards();
const here = path.dirname(fileURLToPath(import.meta.url)), OUT = path.resolve(here, "..");
const IDX = JSON.parse(fs.readFileSync(path.join(OUT, "frames/a6/index.json"), "utf8"));
const PL = {}; await grainPlates(PL);
const F = 960;
const SP = { over: [0, 152], steam: [152, 268], oma: [268, 402], scf: [402, 516], drive: [516, 858], end: [830, F] };
const card = (id, t) => { const { __T, ...src } = KC.card(id), c = JSON.parse(JSON.stringify(src)); c.__T = KC.T; if (t) Object.assign(c.timing.cues, t); return c; };
const WH = 6, whipOut = (f, b) => (f > b - WH ? -W * 1.3 * Math.pow((f - (b - WH)) / WH, 2) : 0), whipIn = (f, a) => (f < a + WH ? W * 1.3 * Math.pow(1 - (f - a) / WH, 2) : 0);
function story() {
  const Cm = new Comp({ w: W, h: H, dur: F / 60, nm: "Cromatic · story A6 · Our new website is a city · en" });
  const asset = (C2, n) => { const m = PL[n]; if (!C2.assets.find((a) => a.id === n)) { C2.asset(n, m.w, m.h, m.file); C2.assets[C2.assets.length - 1].u = "images/"; } return m; };
  // ---- top: the end (a4: the pill centred, black under it, the settle), grain, the cards
  drawCard(Cm, card("a4-end", { urlIn: "end-30" }), SP);
  grain(Cm, asset, { o: 26, F });
  for (const id of ["a1-website", "a2-brand"]) drawCard(Cm, card(id), SP);
  drawCard(Cm, card("a3-drive", { out: "drive+116" }), SP);
  Cm.shape("vignette", [group("v", [rect([W * 1.2, H * 1.2], [W / 2, H / 2]), gfill({ type: 2, s: [W / 2, H * 0.5], e: [W * 1.08, H * 0.5], stops: [[0, "#120A1C"], [1, "#120A1C"]], alphas: [[0, 0], [0.6, 0], [1, 0.4]] })])], { ip: 0, op: SP.end[0] + 24 });
  // ---- the shots: the map's own frames, 30 a second (each on for 2 of 60), the whips between them in a null
  const whips = { over: { out: 1 }, steam: { in: 1, out: 1 }, oma: { in: 1, out: 1 }, scf: { in: 1, out: 1 }, drive: { in: 1 } };
  for (const k of ["drive", "scf", "oma", "steam", "over"]) {
    const [a, b] = SP[k], wh = whips[k], fr = IDX[k];
    const N = Cm.nul(`shot · ${k}`, { ip: a, op: b, ks: { p: bake(a, b, (f) => ({ p: [(wh.in ? whipIn(f, a) : 0) + (wh.out ? whipOut(f, b) : 0), 0] })).p } });
    for (let f = a, i = 0; f < b; f += 2, i++) {
      const nm = fr[Math.min(fr.length - 1, i)];
      if (!Cm.assets.find((x) => x.id === nm)) { Cm.asset(nm, 1080, 1920, nm + ".webp"); Cm.assets[Cm.assets.length - 1].u = "frames/a6/"; }
      Cm.image(`${k} · ${i}`, nm, { parent: N, ip: f, op: Math.min(b, f + 2), ks: { p: [0, 0] } });
    }
  }
  Cm.shape("ground", [group("g", [rect([W, H], [W / 2, H / 2]), fill(rgb("#0A0A0A"))])]);
  const j = Cm.json(); j.cromatic = { story: "A6 (the map captured per frame)", lang: "en", dur: F / 60, spans: SP };
  return j;
}
const j = story(), s = JSON.stringify(j);
fs.writeFileSync(path.join(OUT, "story-a6-en.json"), s);
console.log("story-a6-en", (s.length / 1024).toFixed(1), "KB", j.layers.length, "layers", j.op, "frames");
