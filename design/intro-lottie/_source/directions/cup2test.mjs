// Nine cups v2 · a test sheet: the nine baked cups in the rhombus, as three.js would show them (bake2.html frame()):
// still (0..30), one turn each (30..130), the tilt from straight above to the old angle (140..180), back (180..220)
import { Comp, group, rect, fill, rgb } from "../lib/lottie.mjs";
import { buildCups, placePre, KP, STEP_T, STEP_Y, NYK } from "../lib/cup2build.mjs";
import * as L from "./ninecups2.layout.mjs";
export function buildCup2Test(T, ab) {
  const ph = ab.name === "phone";
  const W = ab.w, H = ab.h, k = ph ? 17 : 34;
  const Cm = new Comp({ w: W, h: H, dur: 230 / 60, nm: "cup2 test" });
  Cm.op = 230;
  const ox = 0, oy = L.DIAMOND_Y + 1.2;
  const comp = (q) => [W / 2 + (q[0] - ox) * k, H / 2 - (q[1] - oy) * k];
  const cups = buildCups(Cm, {});
  const order = [...cups].sort((a, b) => b.C.Y - a.C.Y); // back rows first (drawn under the near ones)
  for (const c of order.reverse()) {
    const turnF = NYK * STEP_Y;
    placePre(Cm, c, c.turn, { nm: `cup ${c.n} · turn`, ip: 0, op: 131, k, comp, tm: [[0, 0, "hold"], [30, 0, [0, 0, 1, 1]], [130, (turnF - 0.01) / 60]] });
    const tF = L.NT * STEP_T;
    placePre(Cm, c, c.tilt, { nm: `cup ${c.n} · tilt`, ip: 131, op: 230, k, comp, tm: [[131, 0, "hold"], [140, 0, [0.65, 0, 0.35, 1]], [180, tF / 60, [0.65, 0, 0.35, 1]], [220, 0]] });
  }
  Cm.shape("paper", [group("paper", [rect([W, H], [W / 2, H / 2], 0), fill(rgb("#f2f2f2"))])], {});
  return Cm.json();
}
