// 2 · /onboarding/ (Daniel, Lottie across the site: piece 2). Small looping explainers inside the page's cards, drawn in
// the intro's language (pills, outlines, the paper grid, soft stacked shadows, the key light, landings that squash):
//   drive-keys / drive-stick  · how you drive: the arrows (laptop) or the stick (phone) drive the little car round a
//                               block; Space (or DRIFT) on the last corner: it drifts, the tyres mark the road
//   views                     · Street or Bird's eye: the toggle flips and the camera goes from behind the car to above it
//   places                    · tap a place: the route draws, the car drives it, the place's card opens, Nearby fills in
//   worlds                    · the Multiverse pill deals the nine worlds (the intro's own previews), one is picked
//   game                      · the arcade: the 2M2F button, the cabinet's screen, a glove, K.O.
// Each in a light and a dark version (the page's paper and ink sections). The map's own interface is English by design
// (Daniel, 2026-10-19), so its labels drawn here are too; every word around them on the page is translated.
import { Comp, group, rect, ellipse, fill, stroke, trim, rgb, E, prop, path, poly, roundRect, circlePath, pathProp, rng, C, clean, RISE, softShadow, shOff, shO, sheen, line, capH, unionOutline, starPath, checkPath, LILAC, SHADOW, gfill } from "../lib/ui.mjs";

export const THEMES = {
  light: { name: "light", plate: "#F2F2F2", grid: "#DCDCDC", ink: C.black, edge: C.black, text: C.black, ground: "#EEE7EC", shadowO: 1 },
  dark: { name: "dark", plate: "#1b1a16", grid: "#2b2924", ink: C.black, edge: "#fbfaf5", text: "#fbfaf5", ground: "#24222c", shadowO: 1.6 }
};
const ROAD = "#E0907E", ROAD_EDGE = "#2a2118";
const L = 60; // frames per second (the writer's clock)

/* ---------- shared pieces ---------- */
// the plate: a rounded rectangle of the map's ground or the paper grid, outlined, with its soft shadow
function plate(Cm, th, { x, y, w, h, r = 18, grid = true, nm = "plate", fillHex, ip = 0, op } = {}) {
  const items = [];
  if (grid) {
    const ls = [];
    for (let gx = x + 17; gx < x + w; gx += 34) ls.push(path(poly([[gx, y], [gx, y + h]], false)));
    for (let gy = y + 17; gy < y + h; gy += 34) ls.push(path(poly([[x, gy], [x + w, gy]], false)));
    items.push(group("grid", [...ls, stroke(rgb(th.grid), 1, 100, { lc: 1, lj: 1 })]));
  }
  Cm.shape(nm + " · outline", [group("outline", [rect([w, h], [x + w / 2, y + h / 2], r), stroke(rgb(th.edge), 2)])], { ip, op });
  Cm.shape(nm, [...items, group("ground", [rect([w, h], [x + w / 2, y + h / 2], r), fill(rgb(fillHex || th.plate))])], {
    ip, op, masks: [{ inv: false, mode: "a", pt: { a: 0, k: roundRect(x + w / 2, y + h / 2, w, h, r) }, o: prop(100), x: prop(0), nm: "plate" }]
  });
  Cm.shape(nm + " · shadow", softShadow([w, h], [x + w / 2 + 3, y + h / 2 + 6], r, 0.5).map((g) => ({ ...g })), { ip, op, ks: { o: Math.min(100, 70 * th.shadowO) } });
}
// a keycap like the map's own pad: white, outlined, a black lip under it; pressed = down on its lip, yellow
function keycap(T, { cx, cy, w = 38, h = 38, label, glyph, press = [], nm = "key", small, held }) {
  // press: [[t0, t1], ...] frames when held; held: down the whole time
  const pk = [[0, held ? [0, 2.5] : [0, 0], E.hold]], fk = [[0, rgb(held ? C.yellow : C.white), E.hold]];
  for (const [a, b] of press) { pk.push([a, [0, 0], [0.3, 0, 0.3, 1]], [a + 3, [0, 2.5], E.hold], [b, [0, 2.5], [0.3, 0, 0.3, 1]], [b + 4, [0, 0], E.hold]); fk.push([a, rgb(C.white), E.linear], [a + 2, rgb(C.yellow), E.hold], [b, rgb(C.yellow), E.linear], [b + 3, rgb(C.white), E.hold]); }
  const lab = [];
  if (glyph) lab.push(group("glyph", [path(glyph(cx, cy)), fill(rgb(C.black))]));
  if (label) { const size = small || 13, tw = line(T, label, size, C.black, 0, 0, { tracking: 0.02 }).width; lab.push(group("label", line(T, label, size, C.black, cx - tw / 2, cy + capH(T, size) / 2, { tracking: 0.02 }).groups)); }
  return group(nm, [
    group("cap", [...lab, rect([w, h], [cx, cy], 9), stroke(rgb(C.black), 2), fill(clean(fk).length > 1 ? clean(fk) : clean(fk)[0][1])], { p: clean(pk).length > 1 ? clean(pk) : clean(pk)[0][1] }),
    group("lip", [rect([w, h], [cx, cy + 3], 9), stroke(rgb(C.black), 2), fill(rgb(C.black))])
  ]);
}
// the map's arrow glyphs (src/nav2.js), centred, about 18 px
const arrowGlyph = (dir) => (cx, cy) => {
  const P = { up: [[0, -7.5], [6.5, -1], [2.5, -1], [2.5, 7.5], [-2.5, 7.5], [-2.5, -1], [-6.5, -1]] }.up;
  const rot = { up: 0, right: 90, down: 180, left: 270 }[dir] * Math.PI / 180;
  return poly(P.map(([x, y]) => [cx + x * Math.cos(rot) - y * Math.sin(rot), cy + x * Math.sin(rot) + y * Math.cos(rot)]));
};
// the yellow car seen from above, nose up, centred on 0,0 (the site's own yellow ride)
function carTop(s = 1) {
  return [
    group("roof", [rect([11 * s, 11 * s], [0, 2 * s], 3 * s), stroke(rgb(C.black), 1.4), fill(rgb("#FFE36B"))]),
    group("glass", [rect([13 * s, 5 * s], [0, -6 * s], 2 * s), fill(rgb("#2b2b33"))]),
    group("lights", [rect([3 * s, 2 * s], [-5 * s, -14 * s], 1), rect([3 * s, 2 * s], [5 * s, -14 * s], 1), fill(rgb(C.white))]),
    group("body", [rect([17 * s, 30 * s], [0, 0], 6 * s), stroke(rgb(C.black), 2), fill(rgb(C.yellow))]),
    group("wheels", [rect([3 * s, 7 * s], [-9 * s, -8 * s], 1.5), rect([3 * s, 7 * s], [9 * s, -8 * s], 1.5), rect([3 * s, 7 * s], [-9 * s, 9 * s], 1.5), rect([3 * s, 7 * s], [9 * s, 9 * s], 1.5), fill(rgb(C.black))])
  ];
}
// a closed loop road (rounded rectangle) and the car's place on it at arc length s (counter-clockwise: left turns)
function loopTrack(x0, y0, x1, y1, r) {
  const segs = [], add = (kind, len, f) => segs.push({ kind, len, f });
  const W = x1 - x0, H = y1 - y0, sx = W - 2 * r, sy = H - 2 * r, q = (Math.PI * r) / 2;
  // up the right side, the top-right corner, left along the top, down the left, right along the bottom
  add("s", sy, (u) => [x1, y1 - r - u * sy, 0]);
  add("c", q, (u) => { const a = u * Math.PI / 2; return [x1 - r + r * Math.cos(a), y0 + r - r * Math.sin(a), -a * 180 / Math.PI]; });
  add("s", sx, (u) => [x1 - r - u * sx, y0, -90]);
  add("c", q, (u) => { const a = Math.PI / 2 + u * Math.PI / 2; return [x0 + r + r * Math.cos(a), y0 + r - r * Math.sin(a), -a * 180 / Math.PI]; });
  add("s", sy, (u) => [x0, y0 + r + u * sy, -180]);
  add("c", q, (u) => { const a = Math.PI + u * Math.PI / 2; return [x0 + r + r * Math.cos(a), y1 - r - r * Math.sin(a), -a * 180 / Math.PI]; });
  add("s", sx, (u) => [x0 + r + u * sx, y1, -270]);
  add("c", q, (u) => { const a = 1.5 * Math.PI + u * Math.PI / 2; return [x1 - r + r * Math.cos(a), y1 - r - r * Math.sin(a), -a * 180 / Math.PI]; });
  const P = segs.reduce((a, s) => a + s.len, 0);
  const at = (s) => { s = ((s % P) + P) % P; let acc = 0; for (let i = 0; i < segs.length; i++) { const g = segs[i]; if (s <= acc + g.len) { const [x, y, a] = g.f((s - acc) / g.len); return { x, y, a, seg: i, kind: g.kind, u: (s - acc) / g.len }; } acc += g.len; } return { ...segs[0].f(0), seg: 0 }; };
  const startOf = (i) => segs.slice(0, i).reduce((a, s) => a + s.len, 0);
  return { P, at, segs, startOf, shape: () => roundRect((x0 + x1) / 2, (y0 + y1) / 2, W, H, r) };
}

/* ======================= drive: keys (laptop) / stick (phone) ======================= */
export function buildDrive(T, { theme = "light", mode = "keys" } = {}) {
  const th = THEMES[theme], W = 420, H = 168, LOOP = 330;
  const Cm = new Comp({ w: W, h: H, dur: LOOP / L, nm: `Cromatic · onboarding · drive (${mode}) · ${theme}` });
  Cm.marker("loop", 0, LOOP);
  // the little map: a block with a road round it, the car going round counter-clockwise (left turns)
  const mx = 172, my = 8, mw = 240, mh = 152, tr = loopTrack(mx + 34, my + 30, mx + mw - 34, my + mh - 30, 30);
  // where the car is over the loop: one lap; the third corner (bottom left) is the drift, so its marks fade before the lap ends
  const dS = tr.startOf(5), dE = dS + tr.segs[5].len; // the drift corner's arc length
  const sAt = (t) => (t / LOOP) * tr.P; // even speed
  const tOf = (s) => (s / tr.P) * LOOP;
  const tD0 = Math.round(tOf(dS) - 8), tD1 = Math.round(tOf(dE) + 4);
  const corners = [1, 3, 5, 7].map((i) => [Math.round(tOf(tr.startOf(i)) - 3), Math.round(tOf(tr.startOf(i) + tr.segs[i].len) + 1)]);
  const pos = [], rot = [];
  for (let t = 0; t <= LOOP; t += 3) {
    const p = tr.at(sAt(t));
    let a = p.a, ox = 0, oy = 0;
    // the drift: the tail steps out (the car turned further than the road, up to 38°), a little slide out of the corner
    if (t >= tD0 && t <= tD1 + 14) { const u = Math.min(1, Math.max(0, (t - tD0) / (tD1 + 14 - tD0))), env = Math.sin(u * Math.PI); a -= 38 * env; const n = (p.a - 90) * Math.PI / 180; ox = Math.cos(n) * 5 * env; oy = Math.sin(n) * 5 * env; }
    pos.push([t, [p.x + ox, p.y + oy], E.linear]); rot.push([t, a, E.linear]);
  }
  // the angles unwrapped (no spin back round at the loop's end): the last lap ends at -360, the start is 0
  for (let i = 1; i < rot.length; i++) { while (rot[i][1] - rot[i - 1][1] > 180) rot[i][1] -= 360; while (rot[i][1] - rot[i - 1][1] < -180) rot[i][1] += 360; }
  Cm.shape("car", [group("car", carTop(1))], { ks: { p: clean(pos), r: clean(rot) } });
  // the car's soft shadow on the road
  Cm.shape("car · shadow", [group("shadow", [rect([19, 32], [0, 0], 7), fill(rgb(SHADOW), 22)])], { ks: { p: clean(pos.map(([t, v, e]) => [t, [v[0] + 2, v[1] + 3.5], e])), r: clean(rot) } });
  // the skid marks of the drift: two tyre lines drawn along the corner, then gone
  const skid = (off) => { const pts = []; for (let k = 0; k <= 12; k++) { const p = tr.at(dS - 6 + ((dE - dS + 18) * k) / 12), n = p.a * Math.PI / 180; pts.push([p.x + Math.cos(n) * off, p.y + Math.sin(n) * off]); } return poly(pts, false); };
  Cm.shape("drift · tyre marks", [group("marks", [path(skid(-6)), path(skid(6)), trim(0, [[tD0, 0, E.linear], [tD1 + 10, 100]], 0), stroke(rgb(SHADOW), 3, [[tD0, 46, E.hold], [tD1 + 40, 46, E.linear], [LOOP - 12, 0]], { lc: 2, lj: 2 })])], { ip: tD0, op: LOOP });
  // DRIFT! pops by the corner
  const dp = tr.at((dS + dE) / 2), tagW = line(T, "DRIFT!", 11, C.black, 0, 0, { tracking: 0.08 }).width + 16;
  const tagC = [dp.x + 50, dp.y - 22];
  Cm.shape("drift · tag", [group("tag", [
    group("word", line(T, "DRIFT!", 11, C.black, tagC[0] - (tagW - 16) / 2, tagC[1] + capH(T, 11) / 2, { tracking: 0.08 }).groups),
    group("pill", [rect([tagW, 22], tagC, 9999), stroke(rgb(C.black), 2), fill(rgb(C.yellow))]),
    group("shadow", [rect([tagW, 22], [tagC[0] + 2, tagC[1] + 3], 9999), fill(rgb(SHADOW), 30)])
  ], { a: tagC, p: tagC, s: [[tD0 + 6, [0, 0], E.spring], [tD0 + 22, [100, 100], E.hold], [tD1 + 26, [100, 100], E.in], [tD1 + 36, [0, 0]]], r: [[tD0 + 6, -14, E.spring], [tD0 + 22, -6]] })], { ip: tD0 + 5, op: tD1 + 37 });
  // the road (its edge, the asphalt, the dashes) and the block inside it, on the map's ground
  const shape = tr.shape();
  Cm.shape("road · dashes", [group("dashes", [path(shape), stroke(rgb(C.white), 1.6, 100, { lc: 1, lj: 1, d: [6, 7] })])]);
  Cm.shape("road", [group("asphalt", [path(shape), stroke(rgb(ROAD), 18, 100, { lc: 1, lj: 2 })]), group("edge", [path(shape), stroke(rgb(ROAD_EDGE), 21, 100, { lc: 1, lj: 2 })])]);
  // the block: three houses (roofs from above) and two trees
  const hx = mx + mw / 2 + 22, houses = [[hx - 30, my + mh / 2 - 8, 30, 24, C.coral], [hx + 12, my + mh / 2 - 12, 26, 30, LILAC], [hx + 2, my + mh / 2 + 22, 44, 18, "#F0B48A"]];
  Cm.shape("block", [
    ...houses.map(([x, y, w, h, c], i) => group("house " + i, [rect([w, h], [x, y], 4), stroke(rgb(C.black), 1.6), fill(rgb(c))])),
    ...[[mx + mw / 2 - 52, my + mh / 2 - 26], [mx + mw / 2 + 70, my + mh / 2 + 26]].map(([x, y], i) => group("tree " + i, [ellipse([16, 16], [x, y]), stroke(rgb(C.black), 1.6), fill(rgb(C.green))])),
    group("shadows", houses.map(([x, y, w, h]) => rect([w, h], [x + 3, y + 4], 4)).concat([fill(rgb(SHADOW), 18)]))
  ]);
  plate(Cm, th, { x: mx, y: my, w: mw, h: mh, r: 20, nm: "map", fillHex: theme === "dark" ? "#2a2735" : th.ground, grid: false });

  // the controls
  const turn = corners; // ← while turning
  const drift = [[tD0, tD1]];
  if (mode === "keys") {
    const kx = 16, ky = 22, k = 38, g = 6;
    const cx = kx + k + g + k / 2;
    Cm.shape("keys", [
      keycap(T, { cx, cy: ky + k / 2, glyph: arrowGlyph("up"), held: true, nm: "up" }),
      keycap(T, { cx: cx - k - g, cy: ky + k + g + k / 2, glyph: arrowGlyph("left"), press: turn, nm: "left" }),
      keycap(T, { cx, cy: ky + k + g + k / 2, glyph: arrowGlyph("down"), nm: "down" }),
      keycap(T, { cx: cx + k + g, cy: ky + k + g + k / 2, glyph: arrowGlyph("right"), nm: "right" }),
      keycap(T, { cx, cy: ky + 2 * (k + g) + 15, w: 3 * k + 2 * g, h: 30, label: "Space", press: drift, nm: "space", small: 12 })
    ]);
  } else {
    // the stick (a ring, a yellow knob) and the round DRIFT button, as on the phone
    const sc = [62, 82], R = 44, kn = 18;
    const kp = [[0, [sc[0], sc[1] - 16], E.inOut]];
    for (const [a, b] of turn) { kp.push([a, [sc[0], sc[1] - 16], E.out], [a + 6, [sc[0] - 17, sc[1] - 12], E.hold], [b, [sc[0] - 17, sc[1] - 12], E.out], [b + 6, [sc[0], sc[1] - 16], E.hold]); }
    // a fingertip on the knob
    Cm.shape("stick · finger", [group("finger", [ellipse([30, 30], [0, 0]), fill(rgb(C.black), 10)]), group("touch", [ellipse([46, 46], [0, 0]), stroke(rgb(C.black), 1.2, 22)])], { ks: { p: clean(kp) } });
    Cm.shape("stick · knob", [group("knob", [ellipse([kn * 2, kn * 2], [0, 0]), stroke(rgb(C.black), 2.2), fill(rgb(C.yellow))]), group("lip", [ellipse([kn * 2, kn * 2], [1.5, 3]), fill(rgb(C.black))])], { ks: { p: clean(kp) } });
    Cm.shape("stick · ring", [group("ring", [ellipse([R * 2, R * 2], sc), stroke(rgb(C.black), 2.2), fill(rgb("#FFF8EA"), 92)]), group("inner", [ellipse([R * 2 - 18, R * 2 - 18], sc), stroke(rgb(C.yellow), 8, 22)]), group("lip", [ellipse([R * 2, R * 2], [sc[0] + 2, sc[1] + 3]), fill(rgb(C.black), 80)])]);
    const dc = [146, 116], dr = 26;
    const dk = [[0, [0, 0], E.hold]], dfk = [[0, rgb(C.white), E.hold]];
    for (const [a, b] of drift) { dk.push([a, [0, 0], E.out], [a + 3, [0, 2], E.hold], [b, [0, 2], E.out], [b + 4, [0, 0], E.hold]); dfk.push([a, rgb(C.white), E.linear], [a + 2, rgb(C.yellow), E.hold], [b, rgb(C.yellow), E.linear], [b + 3, rgb(C.white), E.hold]); }
    const dw = line(T, "DRIFT", 9, C.black, 0, 0, { tracking: 0.1 }).width;
    Cm.shape("drift button", [
      group("button", [group("word", line(T, "DRIFT", 9, C.black, dc[0] - dw / 2, dc[1] + capH(T, 9) / 2, { tracking: 0.1 }).groups), ellipse([dr * 2, dr * 2], dc), stroke(rgb(C.black), 2.2), fill(clean(dfk))], { p: clean(dk) }),
      group("lip", [ellipse([dr * 2, dr * 2], [dc[0] + 2, dc[1] + 3]), fill(rgb(C.black))])
    ]);
    Cm.shape("drift · tap", [group("tap", [ellipse([30, 30], dc), fill(rgb(C.black), [[tD0 - 2, 0, E.linear], [tD0, 12, E.hold], [tD1, 12, E.linear], [tD1 + 4, 0]])])]);
  }
  const json = Cm.json();
  json.cromatic = { piece: "onb-drive", mode, theme, loop: [0, LOOP] };
  return json;
}

/* ======================= views: Street or Bird's eye ======================= */
// the toggle as on the map (white, outlined, a hard shadow; the chosen one black), and a little window onto the road:
// behind the car, low (Street), then the camera rises over it (Bird's eye) and comes back down
const roadIcon = (cx, cy, k = 0.8) => [path(poly([[cx - 9 * k, cy + 8 * k], [cx - 3 * k, cy - 8 * k], [cx + 3 * k, cy - 8 * k], [cx + 9 * k, cy + 8 * k]], false)), path(poly([[cx, cy - 5.5 * k], [cx, cy - 3 * k]], false)), path(poly([[cx, cy - 0 * k], [cx, cy + 2.5 * k]], false)), path(poly([[cx, cy + 5.5 * k], [cx, cy + 8 * k]], false))];
const satIcon = (cx, cy, k = 0.8) => [rect([6 * k, 6 * k], [cx, cy], 1), path(poly([[cx - 3 * k, cy], [cx - 8.5 * k, cy]], false)), path(poly([[cx + 8.5 * k, cy], [cx + 3 * k, cy]], false)), path(poly([[cx, cy - 3 * k], [cx, cy - 8.5 * k]], false)), path(poly([[cx, cy + 8.5 * k], [cx, cy + 3 * k]], false)), path(poly([[cx - 8 * k, cy - 8 * k], [cx - 5 * k, cy - 5 * k]], false)), path(poly([[cx + 8 * k, cy + 8 * k], [cx + 5 * k, cy + 5 * k]], false))];
export function buildViews(T, { theme = "light", key = true } = {}) {
  const th = THEMES[theme], W = 420, H = 168, LOOP = 300;
  const Cm = new Comp({ w: W, h: H, dur: LOOP / L, nm: `Cromatic · onboarding · Street or Bird's eye · ${theme}` });
  Cm.marker("loop", 0, LOOP);
  // the camera: 0 = Street, 1 = Bird's eye; up at 96-128, down at 246-278 (the toggle goes as it starts)
  const UP0 = 96, UP1 = 130, DN0 = 246, DN1 = 280, sw = (x) => x * x * (3 - 2 * x);
  const m = (t) => (t < UP0 ? 0 : t < UP1 ? sw((t - UP0) / (UP1 - UP0)) : t < DN0 ? 1 : t < DN1 ? 1 - sw((t - DN0) / (DN1 - DN0)) : 0);
  const lerp = (a, b, k) => a + (b - a) * k;
  // the window
  const vx = 190, vy = 10, vw = 222, vh = 148, cx = vx + vw / 2, hy = vy + 30, by = vy + vh;
  // street: a point at road depth z (0 near, 1 the horizon) and side offset u (-1..1 of the road's half width)
  const stP = (z, u) => { const y = lerp(by + 6, hy, Math.pow(z, 0.62)), half = lerp(82, 6, Math.pow(z, 0.62)); return [cx + u * half, y]; };
  const stK = (z) => lerp(1, 0.12, Math.pow(z, 0.62)); // the size at that depth
  // bird: the same point from above
  const bdP = (z, u) => [cx + u * 34, lerp(by + 8, vy - 8, z)];
  const at = (z, u, k) => { const a = stP(z, u), b = bdP(z, u); return [lerp(a[0], b[0], k), lerp(a[1], b[1], k)]; };
  const objs = [];
  // the road: a quad (street: a wedge to the horizon; bird: a straight band)
  const roadAt = (k) => poly([at(0, -1, k), at(1, -1, k), at(1, 1, k), at(0, 1, k)].map((p, i) => (k > 0.5 || i % 3 === 0 ? p : p)));
  const roadKeys = [];
  for (let t = 0; t <= LOOP; t += 2) { const k = m(t); if (roadKeys.length && Math.abs(roadKeys[roadKeys.length - 1].k - k) < 1e-4 && t < LOOP) continue; roadKeys.push({ t, k }); }
  const roadPath = roadKeys.map(({ t, k }) => [t, roadAt(k), E.linear]);
  // the dashes stream towards the camera (the car is driving); each one a short quad
  const ND = 7, SPEED = 1.4; // depth units a loop
  const dashes = [];
  for (let i = 0; i < ND; i++) {
    const pts = [], op = [];
    for (let t = 0; t <= LOOP; t += 5) { // (every 5 frames: the dashes are most of the file)
      const k = m(t), z = (((i / ND) - (t / LOOP) * SPEED) % 1 + 1) % 1, dz = 0.045;
      const a = at(z, -0.07, k), b = at(z + dz, -0.07, k), c = at(z + dz, 0.07, k), d = at(z, 0.07, k);
      pts.push([t, poly([a, b, c, d]), E.linear]);
      op.push([t, z > 0.9 ? Math.max(0, (1 - z) * 1000) : 100, E.linear]);
    }
    dashes.push(group("dash " + i, [path(pts), fill(rgb(C.white), op)]));
  }
  // the car: from behind (Street) and from above (Bird's eye), crossing over as the camera turns
  const carK = (t) => m(t);
  const rear = [
    group("lights", [rect([7, 4], [-12, -1], 1.5), rect([7, 4], [12, -1], 1.5), fill(rgb(C.coral))]),
    group("plate", [rect([12, 5], [0, 5], 1), stroke(rgb(C.black), 1), fill(rgb(C.white))]),
    group("glass", [rect([28, 9], [0, -11], 3), stroke(rgb(C.black), 1.4), fill(rgb("#2b2b33"))]),
    group("body", [path(poly([[-21, 9], [-21, -4], [-15, -17], [15, -17], [21, -4], [21, 9]])), stroke(rgb(C.black), 2), fill(rgb(C.yellow))]),
    group("wheels", [rect([8, 7], [-15, 11], 2), rect([8, 7], [15, 11], 2), fill(rgb(C.black))])
  ];
  const carPos = [], carS = [], rearO = [], topO = [];
  for (let t = 0; t <= LOOP; t += 2) { const k = carK(t); carPos.push([t, [cx, lerp(by - 24, by - 46, k)], E.linear]); carS.push([t, [100, 100], E.linear]); rearO.push([t, Math.max(0, 100 - k * 220), E.linear]); topO.push([t, Math.min(100, Math.max(0, (k - 0.35) * 220)), E.linear]); }
  const dedupe = (keys) => keys.filter((k, i, a) => i === 0 || i === a.length - 1 || JSON.stringify(k[1]) !== JSON.stringify(a[i - 1][1]) || JSON.stringify(k[1]) !== JSON.stringify(a[i + 1][1]));
  Cm.shape("car · from above", [group("car", carTop(1.15), { o: dedupe(topO) })], { ks: { p: dedupe(carPos) } });
  Cm.shape("car · from behind", [group("car", rear, { o: dedupe(rearO) })], { ks: { p: dedupe(carPos) } });
  Cm.shape("car · shadow", [group("shadow", [ellipse([44, 12], [0, 12]), fill(rgb(SHADOW), 22)], { o: dedupe(rearO) }), group("shadow top", [rect([22, 36], [3, 4], 8), fill(rgb(SHADOW), 22)], { o: dedupe(topO) })], { ks: { p: dedupe(carPos) } });
  // the houses and trees beside the road: facades standing (Street), roofs seen from above (Bird's eye)
  const HS = [[0.18, -1, C.coral, LILAC], [0.42, -1, "#F0B48A", C.coral], [0.7, -1, LILAC, "#F0B48A"], [0.12, 1, LILAC, C.coral], [0.36, 1, C.coral, LILAC], [0.62, 1, "#F0B48A", "#9C8CC6"]];
  const houses = HS.map(([z, side, face, roof], i) => {
    const sizeK = [], posK = [], colK = [], rsK = [], rpK = [];
    for (let t = 0; t <= LOOP; t += 3) {
      const k = m(t), sk = stK(z), u = side * 1.5;
      const s = [58 * sk, 70 * sk], p0 = stP(z, side * (1 + 0.62)); p0[1] -= s[1] / 2;
      const b = [40, 34], p1 = bdP(z, side * 2.05);
      const sz = [lerp(s[0], b[0], k), lerp(s[1], b[1], k)], ps = [lerp(p0[0], p1[0], k), lerp(p0[1], p1[1], k)];
      sizeK.push([t, sz, E.linear]); posK.push([t, ps, E.linear]); colK.push([t, k < 0.5 ? rgb(face) : rgb(roof), E.hold]);
      // the roof: a band along the facade's top (Street), its ridge seen from above (Bird's eye)
      rsK.push([t, [lerp(sz[0], sz[0] * 0.8, k), lerp(sz[1] * 0.3, 2.4, k)], E.linear]); rpK.push([t, [ps[0], lerp(ps[1] - sz[1] * 0.35, ps[1], k)], E.linear]);
    }
    return { sizeK: dedupe(sizeK), posK: dedupe(posK), rsK: dedupe(rsK), rpK: dedupe(rpK), colK: dedupe(colK).filter((c, j, a) => j === 0 || JSON.stringify(c[1]) !== JSON.stringify(a[j - 1][1])), z };
  }).sort((a, b) => a.z - b.z); // near ones drawn on top
  const win = () => [{ inv: false, mode: "a", pt: { a: 0, k: roundRect(vx + vw / 2, vy + vh / 2, vw, vh, 18) }, o: prop(100), x: prop(0), nm: "window" }];
  Cm.shape("houses", houses.map((h, i) => group("house " + i, [group("roof", [rect(h.rsK, h.rpK, 2), fill(rgb(SHADOW), 26)]), rect(h.sizeK, h.posK, 3), stroke(rgb(C.black), 1.5), fill(h.colK.length > 1 ? h.colK : h.colK[0][1])])), { masks: win() });
  Cm.shape("road · dashes", dashes, { masks: win() });
  Cm.shape("road", [group("asphalt", [path(roadPath), stroke(rgb(ROAD_EDGE), 1.6), fill(rgb(ROAD))])], { masks: win() });
  // the window's ground, its outline and shadow (the map's pale ground; a hint of the horizon in Street)
  plate(Cm, th, { x: vx, y: vy, w: vw, h: vh, r: 18, nm: "window", fillHex: theme === "dark" ? "#2a2735" : th.ground, grid: false });

  // the toggle: two buttons stacked (as on a phone), the chosen one black; a tap (or V) at each change
  const bx = 16, bw = 156, bh = 40, b1 = [bx + bw / 2, 46], b2 = [bx + bw / 2, 92];
  const knob = [[0, b1, E.hold], [UP0 - 2, b1, [0.3, 1.3, 0.5, 1]], [UP0 + 14, b2, E.hold], [DN0 - 2, b2, [0.3, 1.3, 0.5, 1]], [DN0 + 14, b1]];
  const sz = 14;
  const lab = (text, c, icon, cxy, col) => { const tw = line(T, text, sz, col, 0, 0).width, x0 = cxy[0] - (tw + 26) / 2; return group(text, [...line(T, text, sz, col, x0 + 26, cxy[1] + capH(T, sz) / 2).groups, group("icon", [...icon(x0 + 9, cxy[1], 0.78), stroke(col, 1.8, 100, { lc: 2, lj: 2 })])]); };
  const white = rgb(C.white), black = rgb(C.black);
  const c1 = [[0, white, E.hold], [UP0 + 4, black, E.hold], [DN0 + 4, white]], c2 = [[0, black, E.hold], [UP0 + 4, white, E.hold], [DN0 + 4, black]];
  Cm.shape("toggle · words", [lab("Street", null, roadIcon, b1, c1.map(([t, v, e]) => [t, v, e])), lab("Bird’s eye", null, satIcon, b2, c2)].map((g) => g));
  Cm.shape("toggle · chosen", [group("chosen", [rect([bw - 8, bh], knob, 9999), fill(rgb("#141414"))])], { ks: {} });
  const tw = bw + 8, th2 = 2 * bh + 14;
  Cm.shape("toggle", [
    group("pill", [rect([tw, th2], [bx + bw / 2, (b1[1] + b2[1]) / 2], 24), stroke(rgb("#141414"), 2.5), fill(rgb(C.white))]),
    group("hard shadow", [rect([tw, th2], [bx + bw / 2 + 3, (b1[1] + b2[1]) / 2 + 4], 24), fill(rgb("#141414"))])
  ]);
  // the change: a tap on the button (phone) or V (laptop)
  if (key) {
    Cm.shape("key V", [keycap(T, { cx: bx + bw / 2, cy: 142, w: 34, h: 26, label: "V", press: [[UP0 - 8, UP0 + 4], [DN0 - 8, DN0 + 4]], nm: "V", small: 13 })]);
  } else {
    for (const [t, c] of [[UP0 - 6, b2], [DN0 - 6, b1]]) Cm.shape("tap " + t, [group("tap", [ellipse([16, 16], c), stroke(rgb(C.black), 2, [[t, 70, E.linear], [t + 18, 0]])], { a: c, p: c, s: [[t, [60, 60], E.out], [t + 18, [260, 260]]] })], { ip: t, op: t + 19 });
  }
  const json = Cm.json();
  json.cromatic = { piece: "onb-views", theme, key, loop: [0, LOOP] };
  return json;
}

/* ======================= places: tap a place, the card, Nearby ======================= */
// a place's tag as on the map (white, outlined, its colour's dot); a tap; the route; the car drives it; the card opens
// with the project; Nearby fills in with what is around
function polyAt(pts, s) {
  // a point and heading (degrees, 0 = up) at arc length s along a polyline, the heading eased round each corner
  const seg = []; let P = 0;
  for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push([P, d]); P += d; }
  const ang = (i) => (Math.atan2(pts[i + 1][0] - pts[i][0], -(pts[i + 1][1] - pts[i][1])) * 180) / Math.PI;
  s = Math.max(0, Math.min(P, s));
  let i = seg.findIndex(([a, d]) => s <= a + d); if (i < 0) i = seg.length - 1;
  const u = (s - seg[i][0]) / seg[i][1], x = pts[i][0] + (pts[i + 1][0] - pts[i][0]) * u, y = pts[i][1] + (pts[i + 1][1] - pts[i][1]) * u;
  let a = ang(i); const R = 14;
  // round the corners: within R of a corner, turn halfway towards the next (or from the last) heading
  const toEnd = seg[i][1] - (s - seg[i][0]), fromStart = s - seg[i][0];
  const blend = (a1, a2, k) => { let d = a2 - a1; while (d > 180) d -= 360; while (d < -180) d += 360; return a1 + d * k; };
  if (i < seg.length - 1 && toEnd < R) a = blend(a, ang(i + 1), 0.5 * (1 - toEnd / R));
  if (i > 0 && fromStart < R) a = blend(ang(i - 1), a, 0.5 + 0.5 * (fromStart / R));
  return { x, y, a, P };
}
export function buildPlaces(T, { theme = "light" } = {}) {
  const th = THEMES[theme], W = 420, H = 168, LOOP = 330;
  const Cm = new Comp({ w: W, h: H, dur: LOOP / L, nm: `Cromatic · onboarding · tap a place · ${theme}` });
  Cm.marker("loop", 0, LOOP);
  const mx = 8, my = 8, mw = 250, mh = 152;
  const vR = [[92, my - 10], [92, my + mh + 10]], vR2 = [[196, my - 10], [196, my + mh + 10]], hR = [[mx - 10, 112], [mx + mw + 10, 112]];
  const route = [[92, 146], [92, 112], [196, 112], [196, 62]];
  const tTap = 24, tR0 = 30, tR1 = 54, tD0 = 58, tD1 = 150, tCard = 158, tChips = 192, tOut = 282, tBack = 306;
  // the car along the route (eased), then it fades out where it arrived and back in at the start
  const P = polyAt(route, 0).P, sw = (x) => x * x * (3 - 2 * x);
  const pos = [], rot = [];
  for (let t = 0; t <= LOOP; t += 3) {
    const k = t < tD0 ? 0 : t < tD1 ? sw((t - tD0) / (tD1 - tD0)) : t < tBack ? 1 : 0;
    const p = polyAt(route, k * P); pos.push([t, [p.x, p.y], E.linear]); rot.push([t, p.a, E.linear]);
  }
  const carO = [[0, 100, E.hold], [tOut, 100, E.linear], [tOut + 10, 0, E.hold], [tBack, 0, E.linear], [tBack + 10, 100]];
  const arrive = [[tD1 - 2, [100, 100], E.out], [tD1 + 3, [108, 92], E.out], [tD1 + 10, [100, 100]]];
  Cm.shape("car", [group("car", carTop(0.8), { s: arrive })], { ks: { p: clean(pos), r: clean(rot), o: carO } });
  Cm.shape("car · shadow", [group("shadow", [rect([16, 26], [0, 0], 6), fill(rgb(SHADOW), 22)])], { ks: { p: clean(pos.map(([t, v, e]) => [t, [v[0] + 2, v[1] + 3], e])), r: clean(rot), o: carO } });
  // the route, drawn after the tap, eaten by the car as it goes
  const rk = (t) => (t < tD0 ? 0 : t < tD1 ? sw((t - tD0) / (tD1 - tD0)) * 100 : 100);
  const trimS = []; for (let t = tD0; t <= tD1; t += 4) trimS.push([t, rk(t), E.linear]);
  Cm.shape("route", [group("route", [path(poly(route, false)), trim(clean(trimS), [[tR0, 0, [0.3, 0, 0.2, 1]], [tR1, 100]], 0), stroke(rgb(C.black), 3, [[0, 100, E.hold], [tOut, 100, E.linear], [tOut + 8, 0]], { lc: 2, lj: 2, d: [5, 5] })])], { ip: tR0, op: tBack });
  // the place: its pin and tag (Two Minutes, the studio's own coffee shop), a tap on it
  const tag = [196, 40], nameS = 10, nm = "Two Minutes", nw = line(T, nm, nameS, C.black, 0, 0).width, tw = nw + 26;
  const pulse = [[0, [100, 100], E.hold], [tTap, [100, 100], E.out], [tTap + 5, [110, 110], E.spring], [tTap + 16, [100, 100], E.hold], [tD1, [100, 100], E.out], [tD1 + 6, [112, 112], E.spring], [tD1 + 18, [100, 100]]];
  Cm.shape("place · tag", [group("tag", [
    group("name", line(T, nm, nameS, C.black, tag[0] - tw / 2 + 18, tag[1] + capH(T, nameS) / 2).groups),
    group("dot", [ellipse([7, 7], [tag[0] - tw / 2 + 10, tag[1]]), fill(rgb("#111111"))]),
    group("pill", [rect([tw, 20], tag, 9999), stroke(rgb(C.black), 1.8), fill(rgb(C.white))]),
    group("stem", [path(poly([[tag[0], tag[1] + 10], [tag[0], 58]], false)), stroke(rgb(C.black), 1.6, 100, { d: [2, 2] })]),
    group("shadow", [rect([tw, 20], [tag[0] + 2, tag[1] + 3], 9999), fill(rgb(SHADOW), 26)])
  ], { a: [tag[0], 58], p: [tag[0], 58], s: pulse })]);
  Cm.shape("tap", [group("tap", [ellipse([18, 18], tag), stroke(rgb(C.black), 2, [[tTap, 80, E.linear], [tTap + 20, 0]])], { a: tag, p: tag, s: [[tTap, [50, 50], E.out], [tTap + 20, [280, 280]]] }), group("finger", [ellipse([22, 22], tag), fill(rgb(C.black), [[tTap - 6, 0, E.linear], [tTap, 16, E.hold], [tTap + 6, 16, E.linear], [tTap + 14, 0]])])], { ip: tTap - 6, op: tTap + 21 });
  // the city: roads and blocks
  const roadItems = [vR, vR2, hR].map((r) => path(poly(r, false)));
  const mapMask = () => [{ inv: false, mode: "a", pt: { a: 0, k: roundRect(mx + mw / 2, my + mh / 2, mw, mh, 18) }, o: prop(100), x: prop(0), nm: "map" }];
  Cm.shape("roads · dashes", [group("dashes", [...[vR, vR2, hR].map((r) => path(poly(r, false))), stroke(rgb(C.white), 1.4, 100, { lc: 1, d: [5, 6] })])], { masks: mapMask() });
  Cm.shape("roads", [group("asphalt", [...roadItems, stroke(rgb(ROAD), 15, 100, { lc: 1 })]), group("edge", [...[vR, vR2, hR].map((r) => path(poly(r, false))), stroke(rgb(ROAD_EDGE), 18, 100, { lc: 1 })])], { masks: [{ inv: false, mode: "a", pt: { a: 0, k: roundRect(mx + mw / 2, my + mh / 2, mw, mh, 18) }, o: prop(100), x: prop(0), nm: "map" }] });
  const blocks = [[44, 50, 46, 50, C.coral], [44, 140, 46, 28, LILAC], [144, 46, 50, 52, "#F0B48A"], [144, 140, 50, 28, C.coral], [230, 46, 30, 52, LILAC], [230, 140, 30, 28, "#F0B48A"]];
  Cm.shape("blocks", [
    ...blocks.map(([x, y, w, h, c], i) => group("block " + i, [rect([w, h], [x, y], 4), stroke(rgb(C.black), 1.5), fill(rgb(c))])),
    ...[[30, 96], [124, 84], [236, 92]].map(([x, y], i) => group("tree " + i, [ellipse([13, 13], [x, y]), stroke(rgb(C.black), 1.4), fill(rgb(C.green))])),
    group("shadows", [...blocks.map(([x, y, w, h]) => rect([w, h], [x + 3, y + 4], 4)), fill(rgb(SHADOW), 16)])
  ], { masks: [{ inv: false, mode: "a", pt: { a: 0, k: roundRect(mx + mw / 2, my + mh / 2, mw, mh, 18) }, o: prop(100), x: prop(0), nm: "map" }] });
  plate(Cm, th, { x: mx, y: my, w: mw, h: mh, r: 18, nm: "map", fillHex: theme === "dark" ? "#2a2735" : th.ground, grid: false });
  // the card: as on the map, the place's picture, its street, its name, the way in
  const cx0 = 266, cw = 146, cy0 = 8, ch = 100, cc = [cx0 + cw / 2, cy0 + ch / 2];
  const cardIn = { s: [[tCard, [62, 62], [0.3, 1.32, 0.6, 1]], [tCard + 22, [100, 100], E.hold], [tOut - 4, [100, 100], E.in], [tOut + 10, [86, 86]]], o: [[tCard, 0, E.linear], [tCard + 6, 100, E.hold], [tOut, 100, E.linear], [tOut + 10, 0]], p: [[tCard, [cc[0], cc[1] + 18], [0.3, 1.2, 0.6, 1]], [tCard + 22, cc]], a: cc };
  const ey = "COFFEE STREET", es = 7, eyw = line(T, ey, es, C.black, 0, 0, { tracking: 0.12 }).width;
  const bt = "Go deeper", bs = 10, btw = line(T, bt, bs, C.white, 0, 0).width + 14; // (an arrow drawn after it: the font has no arrow)
  Cm.shape("card", [group("card", [
    group("button", [...line(T, bt, bs, C.white, cc[0] - btw / 2, cy0 + 86 + capH(T, bs) / 2).groups,
      group("arrow", [path(poly([[cc[0] + btw / 2 - 9, cy0 + 86], [cc[0] + btw / 2, cy0 + 86]], false)), path(poly([[cc[0] + btw / 2 - 3.5, cy0 + 82.5], [cc[0] + btw / 2, cy0 + 86], [cc[0] + btw / 2 - 3.5, cy0 + 89.5]], false)), stroke(rgb(C.white), 1.6, 100, { lc: 2, lj: 2 })]),
      group("pill", [rect([cw - 20, 20], [cc[0], cy0 + 86], 9999), fill(rgb("#111111"))])]),
    group("name", line(T, nm, 13, C.black, cx0 + 10, cy0 + 72).groups),
    group("street", line(T, ey, es, rgb(C.black, 0.55), cx0 + 10, cy0 + 56, { tracking: 0.12 }).groups),
    group("cup", [path(poly([[cc[0] - 9, cy0 + 16], [cc[0] + 9, cy0 + 16], [cc[0] + 7, cy0 + 32], [cc[0] - 7, cy0 + 32]])), stroke(rgb(C.white), 2), path(circlePath(cc[0] + 11, cy0 + 22, 4)), stroke(rgb(C.white), 2)]),
    group("picture", [rect([cw, 46], [cc[0], cy0 + 23], 0), fill(rgb("#111111"))]),
    group("body", [rect([cw, ch], cc, 16), stroke(rgb(C.black), 2), fill(rgb(C.white))])
  ], cardIn)], { ip: tCard, op: tOut + 11, masks: [{ inv: false, mode: "a", pt: { a: 0, k: roundRect(cc[0], cc[1], cw + 6, ch + 6, 18) }, o: prop(100), x: prop(0), nm: "card" }] });
  Cm.shape("card · shadow", softShadow([cw, ch], [cc[0] + 3, cc[1] + 6], 16, 0.55), { ip: tCard, op: tOut + 11, ks: { o: [[tCard, 0, E.linear], [tCard + 14, 100, E.hold], [tOut, 100, E.linear], [tOut + 10, 0]] } });
  // Nearby: two places round you, in their colours, one after the other
  const ny = 120, chips = [["Steam", "#2f9e4f", "0.4 km"], ["Two Min Lab", "#C6402E", "0.1 km"]];
  const nl = "NEARBY", nls = 7;
  Cm.shape("nearby · label", [group("label", line(T, nl, nls, rgb(th.text, 0.6), cx0 + 2, ny, { tracking: 0.14 }).groups, { o: [[tChips - 4, 0, E.linear], [tChips + 4, 100, E.hold], [tOut, 100, E.linear], [tOut + 8, 0]] })], { ip: tChips - 4, op: tOut + 9 });
  chips.forEach(([n, c, d], i) => {
    const w = 70, h = 30, x = cx0 + 2 + i * (w + 6) + w / 2, y = ny + 8 + h / 2, t0 = tChips + i * 6;
    const nsz = 8.5, ns = line(T, n, nsz, C.white, 0, 0).width;
    Cm.shape("nearby · " + n, [group(n, [
      group("name", line(T, n, nsz, C.white, x - w / 2 + 7, y - 2).groups),
      group("dist", line(T, d, 7, rgb(C.white, 0.85), x - w / 2 + 7, y + 9, { tracking: 0.04 }).groups),
      group("chip", [rect([w, h], [x, y], 9), stroke(rgb(C.black), 1.8), fill(rgb(c))]),
      group("hard shadow", [rect([w, h], [x + 2, y + 3], 9), fill(rgb(C.black))])
    ], { a: [x, y], p: [[t0, [x, y + 14], [0.3, 1.3, 0.5, 1]], [t0 + 16, [x, y]]], s: [[t0, [70, 70], [0.3, 1.3, 0.5, 1]], [t0 + 16, [100, 100], E.hold], [tOut - 2 + i * 2, [100, 100], E.in], [tOut + 8 + i * 2, [80, 80]]], o: [[t0, 0, E.linear], [t0 + 5, 100, E.hold], [tOut + i * 2, 100, E.linear], [tOut + 8 + i * 2, 0]] })], { ip: t0, op: tOut + 11 });
  });
  const json = Cm.json();
  json.cromatic = { piece: "onb-places", theme, loop: [0, LOOP] };
  return json;
}

/* ======================= worlds: the Multiverse pill deals the nine worlds ======================= */
// the top bar's Multiverse button (the world's picture in a pill, the turning rainbow ring); a tap and it deals the nine
// worlds as pills with their own pictures (the intro's atlas: the Multiverse menu's previews), one is picked, the others
// fall away, the chosen one flies back into the button and the city takes it on
import { WORLD_IDS, ATLAS } from "../../../intro-lottie/_source/directions/A2.mjs";
const WORLD_NAMES = ["Cromatic", "Night Mode", "Ghib.ly", "Sketchbook", "Race Day", "Sakura", "Underwater", "GTA 2", "Risograph"];
const RAINBOW = ["#FED012", "#28C840", "#119BFE", "#B098C8", "#F65342", "#FED012"];
const rainbowAt = (u) => { const n = RAINBOW.length - 1, x = u * n, i = Math.min(n - 1, Math.floor(x)), f = x - i; const a = parseInt(RAINBOW[i].slice(1), 16), b = parseInt(RAINBOW[i + 1].slice(1), 16); return "#" + [16, 8, 0].map((s) => Math.round((((a >> s) & 255) * (1 - f)) + (((b >> s) & 255) * f)).toString(16).padStart(2, "0")).join(""); };
export function buildWorlds(T, { theme = "light", pick = 5 } = {}) {
  const th = THEMES[theme], W = 420, H = 150, LOOP = 300;
  const Cm = new Comp({ w: W, h: H, dur: LOOP / L, nm: `Cromatic · onboarding · the Multiverse · ${theme}` });
  Cm.marker("loop", 0, LOOP);
  const ATL = Cm.asset("worlds", ATLAS.cw, ATLAS.ch * WORLD_IDS.length, "worlds.webp");
  const DEAL = [0.22, 1.12, 0.32, 1], FALL = [0.5, 0, 0.92, 0.55], GLIDE = [0.62, 0, 0.22, 1.08];
  const tTap = 16, tDeal = 24, tPick = 118, tBack = 168, tLand = 194, tSwap = 276;
  const mv = [74, 74], mvW = 128, mvH = 44;
  // a picture pill: the world's crop of the atlas, scaled to the pill, masked to its stadium
  const pic = (nm, wi, w, h, { parent, ip, op }) => {
    const ay = ATLAS.ch * wi + ATLAS.ch / 2, k = Math.max(w / ATLAS.cw, h / ATLAS.ch) * 100;
    return Cm.image(nm, ATL, { parent, ip, op, ks: { a: [ATLAS.cw / 2, ay], p: [0, 0], s: [k, k] },
      masks: [{ inv: false, mode: "a", pt: { a: 0, k: roundRect(ATLAS.cw / 2, ay, (w * 100) / k, (h * 100) / k, (h * 50) / k) }, o: prop(100), x: prop(0), nm: "pill" }] });
  };
  // the nine, dealt from the button into three rows on the right, the chosen one in the middle
  const slots = []; for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) slots.push([196 + c * 88 + (r === 1 ? -12 : 4), 30 + r * 45]);
  const order = [pick, ...WORLD_IDS.map((_, i) => i).filter((i) => i !== pick)];
  const pw = 82, ph = 32;
  order.forEach((wi, k) => {
    const s0 = slots[k === 0 ? 4 : k <= 4 ? k - 1 : k], chosen = k === 0, ti = tDeal + k * 3, tilt = [0, -3, 2, -2, 3, 2, -3, 2, -1][k];
    const tf = tPick + 6 + ((k * 5) % 8) * 2;
    let ks;
    if (chosen) ks = {
      p: [[ti, mv, DEAL], [ti + 24, s0, E.hold], [tBack, s0, GLIDE], [tBack + 26, mv]],
      s: [[ti, [30, 30], DEAL], [ti + 24, [100, 100], E.hold], [tPick, [100, 100], [0.3, 1.4, 0.5, 1]], [tPick + 14, [118, 118], E.hold], [tBack, [118, 118], GLIDE], [tBack + 26, [(mvW / pw) * 100, (mvH / ph) * 100]]],
      o: [[0, 0, E.hold], [ti, 100, E.hold], [tBack + 26, 100, E.linear], [tBack + 30, 0]]
    };
    else {
      const drift = (s0[0] < 300 ? -1 : 1) * 24;
      ks = {
        p: [[ti, mv, DEAL], [ti + 24, s0, E.hold], [tf, s0, FALL], [tf + 30, [s0[0] + drift, s0[1] + 150]]],
        s: [[ti, [30, 30], DEAL], [ti + 24, [100, 100]]],
        r: [[ti, -tilt * 3, DEAL], [ti + 24, tilt, E.hold], [tf, tilt, E.in], [tf + 30, tilt + (drift > 0 ? 24 : -24)]],
        o: [[0, 0, E.hold], [ti, 0, E.linear], [ti + 2, 100, E.hold], [tf + 18, 100, E.linear], [tf + 30, 0]]
      };
    }
    const lop = chosen ? tBack + 31 : tf + 31;
    const nul = Cm.nul(`world · ${WORLD_NAMES[wi]}`, { ks, ip: ti - 1, op: lop });
    Cm.shape(`world · ${WORLD_NAMES[wi]} · outline`, [group("outline", [rect([pw, ph], [0, 0], 9999), stroke(rgb(th.edge), chosen ? 2.4 : 1.8)]), ...sheen(() => rect([pw, ph], [0, 0], 9999), pw, ph, 0, 0, { light: 0.3, shade: 0.14 })], { parent: nul, ip: ti - 1, op: lop });
    pic(`world · ${WORLD_NAMES[wi]} · picture`, wi, pw, ph, { parent: nul, ip: ti - 1, op: lop });
    Cm.shape(`world · ${WORLD_NAMES[wi]} · shadow`, softShadow([pw, ph], [3, 6], 9999, 0.5), { parent: nul, ip: ti - 1, op: lop, ks: { o: [[ti, 0, E.linear], [ti + 20, 100]] } });
  });
  // the chosen world's name, by the button, once it is the city's
  const nmS = 11, cname = WORLD_NAMES[pick], cw = line(T, cname, nmS, C.black, 0, 0).width + 18, cc = [mv[0], mv[1] + 40];
  Cm.shape("chosen · name", [group("tag", [
    group("word", line(T, cname, nmS, C.black, cc[0] - (cw - 18) / 2, cc[1] + capH(T, nmS) / 2).groups),
    group("pill", [rect([cw, 22], cc, 9999), stroke(rgb(C.black), 1.8), fill(rgb(C.white))])
  ], { a: cc, p: cc, s: [[tLand, [0, 0], E.spring], [tLand + 16, [100, 100], E.hold], [tSwap, [100, 100], E.in], [tSwap + 10, [0, 0]]] })], { ip: tLand, op: tSwap + 11 });
  // the button: the city's world in it (Cromatic, then the chosen one), "Multiverse", the rainbow ring turning
  const wordS = 13, ww = line(T, "Multiverse", wordS, C.white, 0, 0).width;
  const btnS = [[0, [100, 100], E.hold], [tTap, [100, 100], E.out], [tTap + 4, [92, 92], [0.3, 1.5, 0.5, 1]], [tTap + 16, [100, 100], E.hold], [tLand, [100, 100], E.out], [tLand + 4, [108, 94], [0.3, 1.5, 0.5, 1]], [tLand + 16, [100, 100]]];
  const btn = Cm.nul("Multiverse button", { ks: { p: mv, s: btnS } });
  const NR = 36, ringW = 3;
  Cm.shape("Multiverse · word, ring", [
    group("word", line(T, "Multiverse", wordS, C.white, -ww / 2, capH(T, wordS) / 2).groups),
    group("word shadow", line(T, "Multiverse", wordS, rgb(C.black, 0.55), -ww / 2 + 1, capH(T, wordS) / 2 + 1.5).groups),
    group("dim", [rect([mvW, mvH], [0, 0], 9999), fill(rgb(C.black), 26)]),
    ...Array.from({ length: NR }, (_, i) => group("ring " + i, [rect([mvW, mvH], [0, 0], 9999), trim((i * 100) / NR, Math.min(100, ((i + 1) * 100) / NR + 0.9), [[0, 0, E.linear], [LOOP, 360]]), stroke(rgb(rainbowAt((i + 0.5) / NR)), ringW, 100, { lc: 1, lj: 1 })])),
    group("ring underlay", [rect([mvW, mvH], [0, 0], 9999), stroke(rgb(RAINBOW[0]), ringW * 0.98, 100, { lc: 1, lj: 1 })]),
    group("edge", [rect([mvW + ringW + 1.5, mvH + ringW + 1.5], [0, 0], 9999), stroke(rgb(C.black), 1.4)])
  ], { parent: btn });
  // its picture: Cromatic, the chosen world after it lands, back to Cromatic as the loop closes
  const swapIn = [[0, 0, E.hold], [tLand - 2, 0, E.linear], [tLand + 2, 100, E.hold], [tSwap, 100, E.linear], [tSwap + 14, 0]];
  const chosenPic = pic("Multiverse · the chosen world", pick, mvW, mvH, { parent: btn });
  chosenPic.ks.o = prop(swapIn);
  pic("Multiverse · Cromatic", 0, mvW, mvH, { parent: btn });
  Cm.shape("Multiverse · shadow", softShadow([mvW, mvH], [3, 6], 9999, 0.55), { parent: btn });
  Cm.shape("tap", [group("tap", [ellipse([18, 18], mv), stroke(rgb(th.edge), 2, [[tTap, 80, E.linear], [tTap + 20, 0]])], { a: mv, p: mv, s: [[tTap, [50, 50], E.out], [tTap + 20, [300, 300]]] })], { ip: tTap, op: tTap + 21 });
  const json = Cm.json();
  json.cromatic = { piece: "onb-worlds", theme, loop: [0, LOOP], atlas: true };
  return json;
}

/* ======================= the game: 2 MINUTES 2 FIGHT w/ I O N ======================= */
import { pixelText, pixelWidth, glove } from "../lib/pixel.mjs";
export function buildGame(T, { theme = "light", lang = "en" } = {}) {
  const th = THEMES[theme], W = 420, H = 150, LOOP = 300;
  const Cm = new Comp({ w: W, h: H, dur: LOOP / L, nm: `Cromatic · onboarding · the arcade · ${theme} · ${lang}` });
  Cm.marker("loop", 0, LOOP);
  const tTap = 14, tOn = 22, tTitle = 36, tPunch = 74, tKO = 82, tStart = 112, tOff = 264;
  // the cabinet's screen (the frame's dark purple), switched on like a tube: a line, then the picture
  const sx = 158, sy = 10, sw = 254, sh = 130, sc = [sx + sw / 2, sy + sh / 2];
  const shake = [[tKO, [0, 0], E.linear], [tKO + 2, [-3, 2], E.linear], [tKO + 4, [3, -1], E.linear], [tKO + 6, [-2, 1], E.linear], [tKO + 8, [0, 0]]];
  const scr = Cm.nul("screen", { ks: { p: shake } });
  const onS = [[0, [100, 1], E.hold], [tOn, [100, 1], [0.2, 0.7, 0.3, 1]], [tOn + 10, [100, 100], E.hold], [tOff, [100, 100], [0.6, 0, 0.8, 0.4]], [tOff + 8, [100, 1], E.hold], [tOff + 14, [0, 1]]];
  const mask = () => [{ inv: false, mode: "a", pt: { a: 0, k: roundRect(sc[0], sc[1], sw - 8, sh - 8, 12) }, o: prop(100), x: prop(0), nm: "glass" }];
  // the title in the game's own letters, two lines, falling in with a bounce; "w/ I O N" under it
  const px = 4, l1 = "2 MINUTES", l2 = "2 FIGHT", w1 = pixelWidth(l1) * px, w2 = pixelWidth(l2) * px;
  const t1 = pixelText(l1, { x: sc[0] - w1 / 2, y: sy + 18, px }), t2 = pixelText(l2, { x: sc[0] - w2 / 2, y: sy + 18 + 34, px });
  const drop = (t0) => ({ a: sc, p: [[t0, [sc[0], sc[1] - 70], [0.5, 0, 0.9, 0.5]], [t0 + 10, sc, E.out], [t0 + 13, [sc[0], sc[1] + 3], E.out], [t0 + 18, sc]], o: [[0, 0, E.hold], [t0, 100, E.hold], [tOff - 2, 100, E.hold], [tOff, 0]] });
  const ion = "W/ I O N", iw = pixelWidth(ion) * 2;
  const st = lang === "ro" ? "APASĂ START" : "PRESS START", stw = pixelWidth(st) * 2;
  const blink = [[0, 0, E.hold]]; for (let t = tStart; t < tOff - 20; t += 24) blink.push([t, 100, E.hold], [t + 14, 0, E.hold]);
  Cm.shape("screen · press start", [group("start", pixelText(st, { x: sc[0] - stw / 2, y: sy + sh - 26, px: 2, colors: "#FFFFFF", shadow: null }).groups, { o: blink })], { parent: scr, masks: mask() });
  Cm.shape("screen · w/ I O N", [group("ion", pixelText(ion, { x: sc[0] - iw / 2, y: sy + 86, px: 2, colors: "#B9A9E8", shadow: null }).groups, { o: [[0, 0, E.hold], [tTitle + 22, 100, E.hold], [tOff - 2, 100, E.hold], [tOff, 0]] })], { parent: scr, masks: mask() });
  Cm.shape("screen · title 2", [group("l2", t2.groups, drop(tTitle + 6))], { parent: scr, masks: mask() });
  Cm.shape("screen · title 1", [group("l1", t1.groups, drop(tTitle))], { parent: scr, masks: mask() });
  // a glove comes in from the left and lands on the title: K.O.
  const gpx = 4, gl = glove({ x: 0, y: 0, px: gpx });
  const kx = sx + sw - 54, ky = sy + sh - 36, gy = ky + 2;
  Cm.shape("screen · glove", [group("glove", [gl], { a: [22, 22], p: [[tPunch, [sx - 40, gy], [0.5, 0, 0.9, 0.3]], [tPunch + 8, [kx - 52, gy], E.out], [tKO + 10, [kx - 60, gy], [0.5, 0, 0.6, 1]], [tKO + 26, [sx - 50, gy]]], s: [[tPunch + 8, [100, 100], E.out], [tPunch + 10, [118, 90], E.out], [tPunch + 16, [100, 100]]] })], { parent: scr, ip: tPunch, op: tKO + 27, masks: mask() });
  Cm.shape("screen · K.O.", [group("ko", [
    group("word", pixelText("K.O.", { x: kx - (pixelWidth("K.O.") * 3) / 2, y: ky - 10, px: 3, colors: "#121212", shadow: null }).groups),
    group("burst", [path(starPath(kx, ky, 30, 0.5)), stroke(rgb("#121212"), 2.5), fill(rgb(C.yellow))])
  ], { a: [kx, ky], p: [kx, ky], s: [[tKO, [20, 20], [0.3, 1.6, 0.5, 1]], [tKO + 8, [110, 110], E.inOut], [tKO + 14, [100, 100], E.hold], [tKO + 22, [100, 100], E.in], [tKO + 30, [0, 0]]], r: [[tKO, -20, E.out], [tKO + 30, 8]] })], { parent: scr, ip: tKO, op: tKO + 31, masks: mask() });
  // the flash as the tube comes on, and the glass
  Cm.shape("screen · tube", [group("line", [rect([sw - 8, sh - 8], sc, 12), fill(rgb("#FFFFFF"), [[tOn, 100, E.linear], [tOn + 12, 0, E.hold], [tOff, 0, E.linear], [tOff + 3, 85]])], { a: sc, p: sc, s: onS })], { parent: scr, masks: mask() });
  Cm.shape("screen · glass", [
    group("sheen", [rect([sw - 8, sh - 8], sc, 12), gfill({ s: [sx, sy], e: [sx + sw * 0.5, sy + sh * 0.7], stops: [[0, "#ffffff"], [1, "#ffffff"]], alphas: [[0, 0.16], [1, 0]] })]),
    group("picture", [rect([sw - 8, sh - 8], sc, 12), fill(rgb("#0b0816"))], { a: sc, p: sc, s: onS })
  ], { parent: scr });
  Cm.shape("cabinet", [
    group("bezel", [rect([sw, sh], sc, 16), stroke(rgb(theme === "dark" ? "#fbfaf5" : C.black), 2.4), fill(rgb("#1d1638"))]),
    group("gold", [rect([sw - 4, sh - 4], sc, 14), stroke(rgb(C.yellow), 1.4, 60)])
  ], { parent: scr });
  Cm.shape("cabinet · shadow", softShadow([sw, sh], [sc[0] + 3, sc[1] + 6], 16, 0.55), { parent: scr, ks: { o: Math.min(100, 80 * th.shadowO) } });
  // the 2M2F button, as in the map's top bar: deep purple, the gold ring, the glove and its pixel letters; tapped
  const bc = [72, 75], bw = 118, bh = 46;
  const b2 = pixelText("2M2F", { x: bc[0] - 12, y: bc[1] - 7, px: 2 }), bg = glove({ x: bc[0] - 46, y: bc[1] - 11, px: 2 });
  Cm.shape("2M2F", [group("button", [
    ...b2.groups, bg,
    group("pill", [rect([bw, bh], bc, 9999), stroke(rgb(C.black), 2.2), fill(rgb("#1d1638"))]),
    group("gold ring", [rect([bw - 7, bh - 7], bc, 9999), stroke(rgb(C.yellow), 2)])
  ], { a: bc, p: bc, s: [[0, [100, 100], E.hold], [tTap, [100, 100], E.out], [tTap + 4, [92, 92], [0.3, 1.5, 0.5, 1]], [tTap + 16, [100, 100]]] })]);
  Cm.shape("2M2F · shadow", [group("hard", [rect([bw, bh], [bc[0] + 3, bc[1] + 4], 9999), fill(rgb(C.black), theme === "dark" ? 0 : 100)])]);
  Cm.shape("tap", [group("tap", [ellipse([18, 18], bc), stroke(rgb(th.edge), 2, [[tTap, 80, E.linear], [tTap + 20, 0]])], { a: bc, p: bc, s: [[tTap, [50, 50], E.out], [tTap + 20, [300, 300]]] })], { ip: tTap, op: tTap + 21 });
  const json = Cm.json();
  json.cromatic = { piece: "onb-game", theme, lang, loop: [0, LOOP] };
  return json;
}
