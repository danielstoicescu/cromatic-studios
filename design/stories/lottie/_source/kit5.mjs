// Cromatic · stories in Lottie · v5 (TASK-065d): what the v5 stories add to kit2/kit3.
//   softPill(...)   cromaticstudios.com landing softly (Daniel: "a soft final animation"): it rises a little into place,
//                   its tilt settling, no bounce; then it breathes until the end. Where story C has it: centred.
//   person(...)     a silhouette (head and shoulders, or the whole figure) for the people behind a lit window
import { group, rect, ellipse, fill, gfill, stroke, rgb, E, prop, C, line } from "../../../lottie-ui/_source/lib/ui.mjs";
import { W, H, T } from "./build.mjs";
import { EXPO } from "./kit3.mjs";

export const PILL = { x: W / 2, y: H / 2 + 40, rot: -6, size: 64 };
export function softPill(Cm, { t0, t1, x = PILL.x, y = PILL.y, rot = PILL.rot, size = PILL.size, fillHex = C.yellow, ink = C.black, nm = "cromaticstudios.com", dur = 40 }) {
  const url = "cromaticstudios.com", Lu = line(T, url, size, ink, 0, 0, { tracking: -0.02 }), w = Lu.width + size * 1.25, h = size * 1.6;
  const L = Cm.shape(nm, [group("text", Lu.groups, { p: [-Lu.width / 2, size * 0.36] }), group("pill", [rect([w, h], [0, 0], 9999), stroke(rgb(C.black), 6), fill(rgb(fillHex))]), group("shadow", [rect([w, h], [10, 14], 9999), fill(rgb(C.black), 100)])], {
    ip: t0, op: t1, ks: {
      p: [[t0, [x, y + 70], EXPO], [t0 + dur, [x, y]]],
      r: [[t0, rot + 5, EXPO], [t0 + dur + 6, rot]],
      s: [[t0, [90, 90], EXPO], [t0 + dur, [100, 100], E.inOut], [t1, [103, 103]]],
      o: [[t0, 0, E.linear], [t0 + 14, 100]]
    }
  });
  return { w, h, layer: L };
}

// a person seen through glass: x, by (the feet, or where the figure is cut), u (px per unit of a 1-unit-tall figure,
// i.e. its height in px); keys: [[t, [x, by]], ...] for its walk; bob: a walk's rise and fall
export function person({ nm = "person", h, col = "#4A2414", o = 82, keys, bob = 0, sway = 0, t0, t1, soft = true }) {
  const u = h / 100;
  // head, neck and shoulders, the torso, the legs: one figure 100 tall (feet at 0)
  const body = (k = 1, a = 100) => group("figure", [
    ellipse([20 * u * k, 23 * u * k], [0, -88 * u]), rect([40 * u * k, 44 * u * k], [0, -55 * u], 15 * u), rect([30 * u * k, 46 * u * k], [0, -24 * u], 7 * u), fill(rgb(col), a)
  ]);
  const p = keys.length > 1 ? keys.map(([t, v, e], i) => (i < keys.length - 1 ? [t, v, e || E.linear] : [t, v])) : keys[0][1];
  const items = [group("core", [body(1, 100)])];
  if (soft) items.push(group("halo", [body(1.12, 100)], { o: 30 }));
  const bobK = [];
  if (bob && keys.length > 1) { for (let t = keys[0][0]; t <= keys[keys.length - 1][0]; t += 8) bobK.push([t, [0, ((t / 8) % 2 ? -1 : 1) * bob * u], E.inOut]); bobK[bobK.length - 1] = [bobK[bobK.length - 1][0], bobK[bobK.length - 1][1]]; }
  const swayK = [];
  if (sway) { for (let t = t0, i = 0; t <= t1; t += 26, i++) swayK.push([t, (i % 2 ? -1 : 1) * sway, E.inOut]); swayK[swayK.length - 1] = [swayK[swayK.length - 1][0], swayK[swayK.length - 1][1]]; }
  return group(nm, [group("bob", items, bobK.length ? { p: bobK } : {})], { p, o, ...(swayK.length ? { r: swayK } : {}) });
}
