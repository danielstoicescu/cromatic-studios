// phase 3 · calibration: the vector cup at the same views as the three.js reference (~/.x-p3-ref.mjs), U = 100, dc = 14
import { Comp, group, rect, fill, rgb } from "../lib/lottie.mjs";
import { cupMove } from "../lib/cupLayers.mjs";
export const VIEWS = [[30, 0], [30, 45], [30, 90], [30, 180], [30, 270], [60, 30], [85, 30], [15, 30]];
export function buildCupViews(T, ab) {
  const Cm = new Comp({ w: 2400, h: 1200, dur: 0.1, nm: "cup views" });
  VIEWS.forEach(([pitch, yaw], i) => {
    const nul = Cm.nul("v" + i, { ks: { p: [300 + (i % 4) * 600, 300 + Math.floor(i / 4) * 600] } });
    cupMove(Cm, { nm: `cup ${pitch}/${yaw}`, parent: nul, t0: 0, t1: 0, every: 1, viewAt: () => ({ pitch, yaw, U: 100 }), turnK: [[0, 0]] });
  });
  Cm.shape("paper", [group("p", [rect([2400, 1200], [1200, 600]), fill(rgb("#F2F2F2"))])]);
  const json = Cm.json(); json.markers = [{ tm: 0, cm: "words", dr: 1 }, { tm: 0, cm: "hold", dr: 1 }, { tm: 0, cm: "handoff", dr: 1 }];
  return json;
}
