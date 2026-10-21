// Cromatic · stories in Lottie · story B7 (TASK-065h, Daniel on B6), English, 1080 x 1920, 60 fps, 16 s.
// Str. Olari, driven: its street plate first, then the ride up the street, a shot per world as it drives (tracking,
// low, passes by the lens, from above, GTA 2 top down, a crane to the house), each world with its own ride, into the
// plaza of the Cromatic Studios House; every frame captured from the map (renderV6.mjs JOB=b7 -> framesB7.mjs,
// frames/b7/, local). Iris's cards as B6 (Same street. / New [..] small and low on the aplat, the worlds' tags, Nine
// worlds. One street., the pill on black). Each world's cut is a smash cut with a white flash.
//   node buildB7.mjs -> story-b7-en.json
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Comp, group, rect, fill, gfill, rgb, E } from "../../../lottie-ui/_source/lib/ui.mjs";
import { W, H } from "./build.mjs";
import { grain, grainPlates } from "./kit2.mjs";
import { SEG } from "./shotsB7.mjs";
import { loadCards, drawCard } from "../../cards/cards.mjs";
const KC = await loadCards();
const here = path.dirname(fileURLToPath(import.meta.url)), OUT = path.resolve(here, "..");
const IDX = JSON.parse(fs.readFileSync(path.join(OUT, "frames/b7/index.json"), "utf8"));
const PL = {}; await grainPlates(PL);
const F = 960, f60 = (s) => Math.round(s * 60);
// the cards' clock: each world from its first shot to its last (Cromatic: the plate and the first tracking shot)
const SPAN = { monument: [0, f60(SEG[1].b)], end: [f60(SEG[10].a), F] };
for (const S of SEG.slice(2, 10)) SPAN[S.world] = [f60(S.a), f60(S.b)];
const card = (id, t) => { const { __T, ...src } = KC.card(id), c = JSON.parse(JSON.stringify(src)); c.__T = KC.T; if (t) Object.assign(c.timing.cues, t); return c; };
function story() {
  const Cm = new Comp({ w: W, h: H, dur: F / 60, nm: "Cromatic · story B7 · nine worlds, one street, driven · en" });
  const asset = (C2, n) => { const m = PL[n]; if (!C2.assets.find((a) => a.id === n)) { C2.asset(n, m.w, m.h, m.file); C2.assets[C2.assets.length - 1].u = "images/"; } return m; };
  drawCard(Cm, card("b4-end"), SPAN);
  grain(Cm, asset, { o: 26, F });
  for (const w of ["monument", "nightlife", "underwater", "circuit", "sketch", "orchid", "gta2", "riso", "ghibli"]) { const r = drawCard(Cm, card(`b2-${w}`, { in: `${w}+3`, out: `${w}.end-7` }), SPAN); for (const L of r.layers) L.op = Math.min(L.op, SPAN[w][1]); }
  drawCard(Cm, card("b1-street", { lineStagger: 70, pillIn: "nightlife+7", swaps: ["underwater+5", "circuit+5", "sketch+5", "orchid+5", "gta2+5", "riso+5", "ghibli+5"], out: "ghibli.end-6" }), SPAN);
  drawCard(Cm, card("b3-end", { out: "end+56" }), SPAN);
  Cm.shape("vignette", [group("v", [rect([W * 1.2, H * 1.2], [W / 2, H / 2]), gfill({ type: 2, s: [W / 2, H * 0.5], e: [W * 1.08, H * 0.5], stops: [[0, "#000000"], [1, "#000000"]], alphas: [[0, 0], [0.6, 0], [1, 0.35]] })])], { ip: 0, op: F });
  // the world changes on a smash cut: a white frame, then the new world
  SEG.forEach((S, k) => { if (k < 2) return; const a = f60(S.a); Cm.shape(`flash · ${S.world}`, [group("f", [rect([W, H], [W / 2, H / 2]), fill(rgb("#FFFFFF"))])], { ip: a, op: a + 4, ks: { o: [[a, 75, E.linear], [a + 3, 0]] } }); });
  // the shots: the map's own frames, 30 a second; the last one held into the black
  SEG.forEach((S, k) => {
    const a = f60(S.a), b = k === SEG.length - 1 ? F : f60(S.b), fr = IDX[k];
    for (let f = a, i = 0; f < b; f += 2, i++) {
      const nm = fr[Math.min(fr.length - 1, i)];
      if (!Cm.assets.find((x) => x.id === nm)) { Cm.asset(nm, 1080, 1920, nm + ".webp"); Cm.assets[Cm.assets.length - 1].u = "frames/b7/"; }
      Cm.image(`${S.world} · ${S.kind} · ${i}`, nm, { ip: f, op: Math.min(b, f + 2), ks: { p: [0, 0] } });
    }
  });
  const j = Cm.json(); j.cromatic = { story: "B7 (Str. Olari driven, the map captured per frame)", lang: "en", dur: F / 60, spans: SPAN };
  return j;
}
const j = story(), s = JSON.stringify(j);
fs.writeFileSync(path.join(OUT, "story-b7-en.json"), s);
console.log("story-b7-en", (s.length / 1024).toFixed(1), "KB", j.layers.length, "layers", j.op, "frames");
