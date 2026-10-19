// Nine cups v2 · the nine baked cups as precomps: for each, its tilt (straight above -> the old angle) and its turn (one
// turn at the old angle, its pattern sliding round in a nested loop). Reads _source/bake/ninecups2.json.
import fs from "fs";
import { fileURLToPath } from "url";
import { FPS } from "./lottie.mjs";
import * as G from "./cup2geo.mjs";
import { space, keyData, patternShapes, cupPre, patternLoop, preLayer, ringEllipse } from "./cup2layers.mjs";
import * as L from "../directions/ninecups2.layout.mjs";

export const BAKE = JSON.parse(fs.readFileSync(fileURLToPath(new URL("../bake/ninecups2.json", import.meta.url)), "utf8"));
export const KP = 40, BOX = 8;
export const STEP_T = 2, STEP_Y = 2, PK = 8, STEP_P = 2, NYK = 24;
const TAU = Math.PI * 2;

// the texture px facing the camera at a yaw (the cup turned by yaw: the point at -yaw faces +z), and a window round it
const uFront = (yaw) => ((((-yaw / TAU) * 1024) % 1024) + 1024) % 1024;
const winAt = (yaw, extra = 0) => { const u = uFront(yaw); return { x0: u - 296 - extra, x1: u + 296 }; };

// the pattern's shapes that no key shows (fully round the back, folded onto an edge) are left out
function prunePatterns(keys) {
  const K0 = keys[0][1]; if (!K0.pat) return;
  const keep = K0.pat.map((_, s) => keys.some(([, K]) => Math.abs(G.area(K.pat[s])) > 1e-4));
  for (const [, K] of keys) { K.pat = K.pat.filter((_, s) => keep[s]); K.patSmooth = !!K.patSmooth; }
}
export function buildCups(Cm, { worldAsset = null, cellOf = null, cellPx = 150, only = null, tops = [] } = {}) {
  const cam = G.wallCam(BAKE.cam);
  const out = [];
  for (const C of BAKE.cups) {
    if (only && !only.includes(C.n)) { out.push(null); continue; }
    const design = BAKE.designs[C.design], patName = design.outer.pat || null, PT = patName ? G.PATTERNS[patName] : null;
    const cupDef = { X: C.Xv, Y: C.Y };
    const O = C.turn[0].frame, S = space(O, KP, BOX);
    const world = worldAsset ? { refId: worldAsset, cell: cellOf(C.world), cellPx } : null;
    const looped = PT && PT.period < TAU - 1e-6; // a pattern that repeats round the cup (the rest are rings: still)
    // the tilt
    const tiltKeys = C.tilt.map((B, i) => {
      const b = { ...B, tiltRad: B.tilt, yawRad: C.yaw0 };
      const pat = PT ? patternShapes(cam, cupDef, { tilt: B.tilt, yaw: C.yaw0 }, patName, { window: winAt(C.yaw0) }) : null;
      const K = keyData(cam, cupDef, b, design, { patName, patShapes: pat }); K.patSmooth = patName === "dots";
      return [i * STEP_T, K];
    });
    // the body's colours straight above (barely seen there): the nearest key's colours, flat, with no light up and down
    for (let i = 0; i < tiltKeys.length; i++) {
      const K = tiltKeys[i][1];
      for (const f of ["bodyGrad", "patGrad"]) if (!K[f]) { const n = tiltKeys.find(([, q]) => q[f]); if (n) { const g = n[1][f], mid = g.stops[Math.floor(g.stops.length / 2)][1]; K[f] = { s: g.s, e: g.e, stops: [[0, mid], [1, mid]] }; } }
      for (const f of ["vDark", "vLight"]) if (!K[f]) { const n = tiltKeys.find(([, q]) => q[f]); if (n) K[f] = { ...n[1][f], alphas: n[1][f].alphas.map(([t]) => [t, 0]) }; }
    }
    prunePatterns(tiltKeys);
    // the coffee: the original's espresso is a mirror (roughness .04, the room's light 1.5x), which from near above
    // shows the room's bright ceiling, the coffee grey-white (the original never looked from there): those keys take the
    // coffee as the cup standing shows it
    const lumS = (st) => st.reduce((a, [, h]) => { const n = parseInt(h.slice(1), 16); return a + (0.2126 * ((n >> 16) & 255) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255)) / 255; }, 0) / st.length;
    const standC = tiltKeys[tiltKeys.length - 1][1].cofStops, standL = lumS(standC);
    for (const [, K] of tiltKeys) if (lumS(K.cofStops) > standL * 1.25) K.cofStops = standC;
    const tilt = cupPre(Cm, `cup ${C.n} · tilt`, S, tiltKeys, { design, world });
    // the turn: the handle keyed; the rest as the tilt's last key (the same view)
    const still = tiltKeys[tiltKeys.length - 1][1];
    const turnKeys = [];
    // (every other baked key: 15 degrees a key)
    const NYK = L.NY / 2;
    for (let k = 0; k <= NYK; k++) {
      const B = C.turn[(2 * k) % L.NY], b = { ...B, tiltRad: L.TILT_END, yawRad: (k / NYK) * TAU };
      turnKeys.push([k * STEP_Y, { B: b, F: still.F, handleC: null }]);
      // the handle's centre and anchors for this turn
      const xf = G.cupXf({ X: C.Xv, Y: C.Y, tilt: L.TILT_END, yaw: b.yawRad }), H = G.HANDLE;
      Object.assign(turnKeys[k][1], { handleC: cam.P(xf.spun([H.cx, H.cy, 0])), handleAnchor: cam.P(xf.spun([H.cx + H.R + H.r, H.cy, 0])), holeAnchor: cam.P(xf.spun([H.cx + H.R - H.r, H.cy, 0])), ring: ringEllipse(cam, xf) });
    }
    let patternLayer = null, loop = null;
    if (looped) {
      const win = winAt(0, 64);
      const pk = [];
      for (let j = 0; j <= PK; j++) pk.push([j * STEP_P, { pat: patternShapes(cam, cupDef, { tilt: L.TILT_END, yaw: (j / PK) * PT.period }, patName, { window: win }), patGrad: still.patGrad, patSmooth: patName === "dots" }]);
      prunePatterns(pk);
      loop = patternLoop(Cm, `cup ${C.n} · pattern loop`, S, pk);
      // in the turn's own time: a sawtooth, one period of the pattern after another
      const turnF = NYK * STEP_Y, nP = Math.round(TAU / PT.period), perF = turnF / nP, loopS = (PK * STEP_P) / FPS;
      const tm = [];
      for (let p = 0; p < nP; p++) { tm.push([p * perF, 0, [0, 0, 1, 1]]); tm.push([(p + 1) * perF - 0.001, loopS - 0.00001, "hold"]); }
      tm.push([turnF, 0]);
      patternLayer = (P, root, hullMask) => preLayer(P, loop, { nm: "pattern", parent: root, masks: [hullMask], tm });
    }
    const turnStill = { ...still, pat: looped ? null : still.pat };
    const turn = cupPre(Cm, `cup ${C.n} · turn`, S, turnKeys, { design, world, still: turnStill, patternLayer });
    // (and a still of it straight above, the coffee plain: the cup in the text line)
    const top = tops.includes(C.n) ? cupPre(Cm, `cup ${C.n} · from above`, S, [[0, tiltKeys[0][1]]], { design, world: null }) : null;
    out.push({ n: C.n, C, design, S, O, tilt, turn, loop, top, cupDef, tiltKeys, still });
  }
  return out;
}
// a cup's precomp placed in a comp: comp(q) maps wall units to the comp, k its px a unit
export function placePre(Cm, cup, pre, { nm, parent, ip, op, k, comp, tm, ks = {} }) {
  const p = comp(cup.O);
  return preLayer(Cm, pre, { nm, parent, ip, op, tm, ks: { p, s: [(k / KP) * 100, (k / KP) * 100], ...ks } });
}
// a remap that plays the turn precomp by turns (turnsK [[t, turns, ease]]), sampled every 2 frames, wrapped each turn
export { STEP_Y as TURN_STEP };
