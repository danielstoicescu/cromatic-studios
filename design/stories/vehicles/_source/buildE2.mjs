// Cromatic · stories · E2 (TASK-111b, Iris; Daniel's notes on E1): the cards as a transparent Lottie (60 fps) on E2's
// clock, and the Sakura petals of the scooter's shot: the map's own petal (src/styles.css .sk-petals i: a 16 x 11 leaf,
// border-radius 80% 0 80% 0, #ffd9e6 to #f7a1c1, its pink shadow), many of them, tumbling down and landing on the
// floor round the scooter, each one's shadow on the white floor coming in under it as it falls.
//   node buildE2.mjs   -> ../story-e2-cards.json
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Comp, group, fill, gfill, rgb, E, prop, path as shp, ellipse } from "../../../lottie-ui/_source/lib/ui.mjs";
import { loadCards, drawCard } from "../../cards/cards.mjs";
import { CLOCKS } from "../../cards/_source/defs.mjs";
// (ST=e3: E3's clock, cards (v3-) and rides; the same petals)
const ST = process.env.ST || "e2", { F } = await import(ST === "e3" ? "./shotsE3.mjs" : "./shotsE2.mjs"), CK = ST === "e3" ? "E3" : "E2", PRE = ST === "e3" ? "v3-" : "v2-";

const here = path.dirname(fileURLToPath(import.meta.url));
const K = await loadCards();
const T60 = Object.fromEntries(Object.entries(CLOCKS[CK]).map(([k, [a, b]]) => [k, [a * 2, b * 2]]));
const Cm = new Comp({ w: 1080, h: 1920, dur: (F * 2) / 60, nm: `Cromatic · story ${CK} · the rides · en` });
const cards = K.cards.filter((c) => c.id.startsWith(PRE)).sort((a, b) => (b.layout.url ? 1 : 0) - (a.layout.url ? 1 : 0) || a.id.localeCompare(b.id, "en", { numeric: true }));
for (const c of cards) { c.__T = K.T; drawCard(Cm, c, T60); }

/* ---------- the petals ---------- */
{
  let box = { x: 419, y: 891, w: 239, h: 301 };
  try { box = JSON.parse(fs.readFileSync(path.join(here, `rides-${ST}.json`), "utf8")).find((x) => x.id === "scooter").box; } catch {}
  const [a, b] = T60.scooter, floorY = box.y + box.h - 6, cx = box.x + box.w / 2;
  let seed = 811; const R = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  // the leaf (16 x 11 at the CSS size, its two round corners 80 %), centred, at 3.6x
  const S = 3.6, w = 16 * S, h = 11 * S, rx = 0.8 * w, ry = 0.8 * h, k = 0.5523;
  const leaf = { c: true, v: [[w, 0], [w, h - ry], [w - rx, h], [0, h], [0, ry], [rx, 0]].map(([x, y]) => [x - w / 2, y - h / 2]),
    i: [[0, 0], [0, 0], [rx * k, 0], [0, 0], [0, 0], [-rx * k, 0]].map((q, n) => [[0, 0], [0, 0], [rx * k, 0], [0, 0], [0, 0], [-rx * k, 0]][n]),
    o: [[0, 0], [0, ry * k], [0, 0], [0, 0], [0, -ry * k], [0, 0]] };
  // (in/out tangents of the two curves: BR from (w, h-ry) to (w-rx, h); TL from (0, ry) to (rx, 0))
  leaf.i[2] = [rx * k, 0]; leaf.o[1] = [0, ry * k]; leaf.i[5] = [-rx * k, 0]; leaf.o[4] = [0, -ry * k];
  const N = 52, layersP = [], layersS = [];
  for (let n = 0; n < N; n++) {
    // where it lands: on the floor round the scooter (an ellipse in perspective), not on the scooter itself
    let lx, ly; do { const t = R() * Math.PI * 2, r = Math.sqrt(R()); lx = cx + Math.cos(t) * 470 * r; ly = floorY + Math.sin(t) * 150 * r; } while (Math.abs(lx - cx) < box.w * 0.55 && ly < floorY + 10);
    const t0 = a + Math.round(R() * 96), dur = 64 + Math.round(R() * 40), t1 = t0 + dur, x0 = lx + (R() - 0.5) * 300, sway = 40 + R() * 60, ph = R() * 6.3, spin = (R() < 0.5 ? -1 : 1) * (200 + R() * 260), r0 = R() * 360, sc = 0.7 + R() * 0.55;
    const pk = [], rk = [], sk = [];
    for (let t = t0; t <= t1; t += 2) { const u = (t - t0) / dur, e = 1 - Math.pow(1 - u, 1.6), y = -80 + (ly + 80) * (u < 1 ? u : 1), x = x0 + (lx - x0) * e + Math.sin(ph + u * 9) * sway * (1 - u); pk.push([t, [x, y], E.linear]); rk.push([t, r0 + spin * u, E.linear]); sk.push([t, [100 * sc * Math.cos(ph + u * 7), 100 * sc], E.linear]); }
    // landed: lying on the floor (flattened), still
    pk.push([t1 + 4, [lx, ly]]); rk.push([t1 + 4, r0 + spin]); sk.push([t1 + 4, [100 * sc * 0.95, 100 * sc * 0.5]]);
    const P = Cm.shape(`petal ${n}`, [group("leaf", [shp(leaf), gfill({ type: 1, s: [-w / 2, -h / 2], e: [w / 2, h / 2], stops: [[0, "#ffd9e6"], [1, "#f7a1c1"]] })])], { ip: t0, op: b, ks: { p: pk, r: rk, s: sk, o: 92 } });
    layersP.push(P);
    // its shadow on the floor: under where it will land, coming in (darker, smaller) as the petal comes down
    const sh = Cm.shape(`petal ${n} · shadow`, [group("s", [ellipse([w * 1.1, h * 0.55], [0, 0]), fill(rgb("#C25A82"), 100)])], { ip: t0, op: b, ks: { p: [lx + 6, ly + 8], s: [[t0, [230 * sc, 230 * sc], E.linear], [t1, [100 * sc, 100 * sc]]], o: [[t0, 0, E.linear], [t0 + dur * 0.4, 6, E.linear], [t1, 26]] } });
    layersS.push(sh);
  }
  // (the shadows under every petal: moved to the bottom of the petals' stack)
  for (const L of layersS) Cm.layers.splice(Cm.layers.indexOf(L), 1);
  Cm.layers.push(...layersS);
}
const j = Cm.json(); j.cromatic = { story: `${CK} (the rides, Daniel's notes)`, lang: "en", clock: CLOCKS[CK], fps: 60 };
fs.writeFileSync(path.join(here, "..", `story-${ST}-cards.json`), JSON.stringify(j));
console.log(`story-${ST}-cards`, (JSON.stringify(j).length / 1024).toFixed(1), "KB", j.layers.length, "layers", j.op, "frames");
