// phase 3 · the cup engine's test bench: cups turning at a fixed tilt (one precomp, four speeds, the Multiverse band on
// two of them), one cup tilting from the side to above, steam from one looping precomp.
import { Comp, E } from "../lib/lottie.mjs";
import { gridPaper } from "../lib/kit.mjs";
import { cupTurn, cupPlay, cupMove, steamLoop, steamPlay } from "../lib/cupLayers.mjs";
export function buildCupTest(T, ab) {
  const W = ab.w, H = ab.h;
  const Cm = new Comp({ w: W, h: H, dur: 6, nm: "cup test" });
  const pre = cupTurn(Cm, "cup-30", { pitch: 30, U: 60, steps: 48 });
  const preB = cupTurn(Cm, "cup-30-band", { pitch: 30, U: 60, steps: 48, band: { y0: 0.75, y1: 1.15 } });
  const st = steamLoop(Cm, "steam", { period: 120, height: 130, scale: 0.6 });
  const spots = [[200, 300], [500, 300], [800, 300], [1100, 300]];
  spots.forEach((p, i) => {
    const nul = Cm.nul("spot " + i, { ks: { p } });
    steamPlay(Cm, st, { nm: "steam " + i, parent: nul, p: [0, -62], phase: i * 0.27 });
    cupPlay(Cm, i % 2 ? preB : pre, { nm: "cup " + i, parent: nul, turnsK: [[0, i * 0.25, E.linear], [360, i * 0.25 + 1.5 + i * 0.5]] });
  });
  const hero = Cm.nul("hero", { ks: { p: [640, 660] } });
  cupMove(Cm, { nm: "hero", parent: hero, t0: 0, t1: 360, every: 6, band: { y0: 0.75, y1: 1.15 }, viewAt: (t) => ({ pitch: 15 + 70 * (0.5 - 0.5 * Math.cos((Math.PI * t) / 360)), yaw: 30 + (t / 360) * 120, U: 70 }) });
  gridPaper(Cm, {});
  const json = Cm.json();
  json.markers = [{ tm: 0, cm: "words", dr: 360 }, { tm: 359, cm: "hold", dr: 1 }, { tm: 359, cm: "handoff", dr: 1 }];
  return json;
}
