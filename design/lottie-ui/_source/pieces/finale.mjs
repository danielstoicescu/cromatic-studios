// 1 · The plane finale (Daniel, Lottie across the site: piece 1). The 3D take-off stays 3D; on top of it:
//   stamp   · BOARDED (RO: ÎMBARCAT), slapped onto the boarding pass the moment it is sent: a green pill with its stamp
//             frame drops from above with its shadow, lands with a squash, a ring and a few specks go off, it stays
//   finale  · the clouds: a deck of clouds the camera climbs through as the jet goes in (markers in, reveal), the
//             confetti in the brand's shapes behind the end card as the sky clears; and the way back down (down, up)
import { Comp, group, rect, ellipse, fill, stroke, rgb, E, prop, path, roundRect, pathProp, f, rng, C, clean, RISE, softShadow, shOff, shO, sheen, line, capH, unionOutline, starPath, checkPath, confetti, LILAC, SHADOW, gfill } from "../lib/ui.mjs";

/* ======================= the stamp ======================= */
export const STAMP_TEXT = { en: "BOARDED", ro: "ÎMBARCAT" };
export function buildStamp(T, lang = "en") {
  const S = 30, TRK = 0.02, word = STAMP_TEXT[lang];
  const tw = line(T, word, S, C.black, 0, 0, { tracking: TRK }).width;
  const h = 56, d = 32, padL = 12, gap = 10, padR = 22, w = padL + d + gap + tw + padR;
  const W = Math.ceil(w * 1.62 + 30), H = 214, cx = W / 2, cy = H / 2 + 4;
  const Cm = new Comp({ w: W, h: H, dur: 46 / 60, nm: `Cromatic · BOARDED stamp · ${lang}` });
  const tLand = 13, ROT = -8;
  // the stamp: from high above (big, tilted further), down onto the paper; a squash on landing, a spring back
  const root = Cm.nul("stamp", {
    ks: {
      a: [cx, cy], p: [cx, cy],
      r: [[0, ROT - 12, [0.5, 0, 0.75, 0.6]], [tLand, ROT]],
      s: [[0, [158, 158], [0.55, 0, 0.92, 0.55]], [tLand, [100, 100], E.out], [tLand + 3, [110, 86], [0.3, 0, 0.4, 1]], [tLand + 9, [97, 103], E.inOut], [tLand + 16, [100, 100]]],
      o: [[0, 0, E.linear], [3, 100]]
    }
  });
  // the face: the green pill (the brand's confirmation colour) in its black outline, a stamp's frame line around it,
  // a black check badge, the word in black
  const x0 = cx - w / 2, by = cy + capH(T, S) / 2;
  const word0 = line(T, word, S, C.black, x0 + padL + d + gap, by, { tracking: TRK });
  const bx = x0 + padL + d / 2;
  Cm.shape("stamp · face", [
    group("word", word0.groups),
    group("check", [path(checkPath(bx, cy, d)), stroke(rgb(C.white), 3.4, 100, { lc: 2, lj: 2 })]),
    group("badge", [ellipse([d, d], [bx, cy]), fill(rgb(C.black))]),
    ...sheen(() => rect([w, h], [cx, cy], 9999), w, h, cx, cy, { light: 0.32, shade: 0.08 }),
    group("pill", [rect([w, h], [cx, cy], 9999), stroke(rgb(C.black), 3), fill(rgb(C.green))]),
    group("frame", [rect([w + 14, h + 14], [cx, cy], 9999), stroke(rgb(C.black), 1.6)])
  ], { parent: root });
  // the shadow: far and faint while it falls, tight as it lands, gone once it is ink on the paper
  const elev = [[0, 3.4, [0.55, 0, 0.92, 0.55]], [tLand, 0.15]];
  Cm.shape("stamp · shadow", softShadow([w + 14, h + 14], [cx, cy], 9999, 0.8), {
    parent: root,
    ks: { p: elev.map(([t, e, ea]) => [t, shOff(e, 0.8), ea]), o: [[0, 0, E.linear], [3, shO(3.4), E.linear], [tLand, 92, E.linear], [tLand + 7, 0]] }
  });
  // the landing: a ring goes off the frame's edge, and a few specks (the brand's dots and a star) fly out
  const ringRoot = Cm.nul("landing", { ks: { a: [cx, cy], p: [cx, cy], r: ROT } });
  Cm.shape("landing · ring", [group("ring", [rect([w + 14, h + 14], [cx, cy], 9999), stroke(rgb(C.black), [[tLand, 3, E.out], [tLand + 22, 0.6]], [[tLand, 80, E.linear], [tLand + 22, 0]])], {
    a: [cx, cy], p: [cx, cy], s: [[tLand, [100, 100], [0.15, 0.7, 0.3, 1]], [tLand + 22, [124, 150]]]
  })], { parent: ringRoot, ip: tLand, op: tLand + 23 });
  const R = rng(5), cols = [C.yellow, C.black, C.blue, C.coral, C.black, C.yellow, C.green, C.black];
  for (let i = 0; i < 9; i++) {
    const a = (i / 9) * Math.PI * 2 + R() * 0.4, ex = Math.cos(a), ey = Math.sin(a);
    const sx = cx + ex * (w / 2 + 2), sy = cy + ey * (h / 2 + 2), dist = 26 + R() * 30;
    const star = i % 4 === 1, sz = star ? 15 : 6 + R() * 4, col = cols[i % cols.length];
    Cm.shape(`landing · speck ${i}`, [group("speck", [star ? path(starPath(0, 0, sz / 2)) : ellipse([sz, sz], [0, 0]), ...(star || col === C.black ? [] : [stroke(rgb(C.black), 1.2)]), fill(rgb(col))])], {
      parent: ringRoot, ip: tLand, op: tLand + 32,
      ks: { p: [[tLand, [sx, sy], [0.15, 0.8, 0.3, 1]], [tLand + 26, [sx + ex * dist * 1.25, sy + ey * dist]]], s: [[tLand, [40, 40], E.out], [tLand + 6, [110, 110], E.inOut], [tLand + 30, [30, 30]]], o: [[tLand, 100, E.hold], [tLand + 18, 100, E.linear], [tLand + 30, 0]], r: [[tLand, 0, E.linear], [tLand + 30, star ? 90 : 0]] }
    });
  }
  const json = Cm.json();
  json.cromatic = { piece: "stamp", lang, land: tLand, size: [W, H], pill: [Math.round(w), h], rot: ROT };
  return json;
}

/* ======================= the clouds and the confetti ======================= */
export const FINALE_AB = { desktop: { name: "desktop", w: 1440, h: 900, U: 1 }, phone: { name: "phone", w: 390, h: 844, U: 0.55 } };
// the clock (frames): in 0-30 (the clouds close over the climb), reveal 30-160 (they clear into a sea of clouds under the
// end card, which comes in at 44; the confetti fly from behind it as its pill lands, at 64), down 170-200 (back to the
// map: the sea rises over the sky), up 200-246 (the clouds clear off the map, out at the top)
export const FT = { IN0: 0, IN1: 30, REV1: 160, DOWN0: 170, DOWN1: 200, UP1: 246, CONF: 64, CARD: 14 };
export function buildFinale(T, ab) {
  const ph = ab.name === "phone", W = ab.w, H = ab.h, U = ab.U;
  const Cm = new Comp({ w: W, h: H, dur: FT.UP1 / 60 + 0.02, nm: `Cromatic · the finale (clouds, confetti) · ${ab.name}` });
  Cm.marker("in", FT.IN0, FT.IN1); Cm.marker("reveal", FT.IN1, FT.REV1); Cm.marker("down", FT.DOWN0, FT.DOWN1); Cm.marker("up", FT.DOWN1, FT.UP1);
  const SW = ph ? 2.2 : 2.8, bleed = 80 * U;

  // confetti on top (the end card, in the page, sits over all of this: the burst comes from behind it)
  const cardBox = ph ? [W * 0.14, H * 0.4, W * 0.72, H * 0.14] : [W * 0.36, H * 0.4, W * 0.28, H * 0.12];
  confetti(Cm, { n: ph ? 34 : 48, box: cardBox, t0: FT.CONF, life: ph ? 92 : 104, U: ph ? 0.8 : 1, seed: 23, spread: ph ? 1.1 : 0.55 });

  // a cloud band: a long strip whose two long edges are rows of puffs (circles of seeded sizes), one black contour
  // around them (the brand's outline), its colour, a soft shadow where its leading edge lies over what is under it.
  // Bands travel the whole screen: in from the top on the way up (in -> reveal), in from the bottom on the way down
  const band = (nm, seed, { hb, rMin, rMax, fillHex, puffs }) => {
    const R = rng(seed), items = [], x0 = -W / 2 - bleed - rMax, x1 = W / 2 + bleed + rMax;
    const edge = (y, dir) => { let x = x0; while (x < x1) { const r = rMin + R() * (rMax - rMin); items.push([x + r * 0.6, y + dir * (R() * 0.35 - 0.1) * r, r]); x += r * (1.05 + R() * 0.35); } };
    edge(hb / 2, 1); edge(-hb / 2, -1);
    for (let i = 0; i < (puffs || 0); i++) items.push([x0 + R() * (x1 - x0), (R() - 0.5) * hb * 0.6, rMax * (0.8 + R() * 0.6)]);
    const shapes = () => [...items.map(([x, y, r]) => ellipse([2 * r, 2 * r], [x, y])), rect([x1 - x0, hb], [(x0 + x1) / 2, 0], 0)];
    // little clouds riding on the band (its depth while it covers the screen): a few puffs each, their own outline
    const clusters = [];
    for (let i = 0; i < (puffs || 0); i++) {
      const cx = -W / 2 + ((i + 0.5) / puffs) * W + (R() - 0.5) * W * 0.12, cy = (R() - 0.5) * hb * 0.62, k = (ph ? 0.6 : 1) * (0.7 + R() * 0.6), ps = [];
      for (let j = 0; j < 4; j++) ps.push([cx + (j - 1.5) * 38 * k + (R() - 0.5) * 10 * k, cy - (j === 1 || j === 2 ? 18 * k : 0) + (R() - 0.5) * 8 * k, (j === 1 || j === 2 ? 34 : 24) * k]);
      clusters.push(() => [...ps.map(([x, y, r]) => ellipse([2 * r, 2 * r], [x, y])), rect([3 * 38 * k, 30 * k], [cx, cy + 10 * k], 0)]);
    }
    return { shapes, clusters, extent: hb / 2 + rMax * 1.1, hb, fillHex, nm };
  };
  const bands = [
    band("back", 3, { hb: H * 1.15, rMin: 46 * (ph ? 0.62 : 1), rMax: 104 * (ph ? 0.62 : 1), fillHex: "#E7E7E7", puffs: 0 }),
    band("middle", 8, { hb: H * 1.2, rMin: 52 * (ph ? 0.62 : 1), rMax: 118 * (ph ? 0.62 : 1), fillHex: C.paper, puffs: 0 }),
    band("front", 13, { hb: H * 1.3, rMin: 60 * (ph ? 0.62 : 1), rMax: 132 * (ph ? 0.62 : 1), fillHex: C.white, puffs: ph ? 4 : 7 })
  ];
  // each band's centre when the screen is covered (the front one centred, the others a little ahead of it), and where
  // it rests once the camera is above the clouds: a sea of clouds under the end card, the farthest band highest
  const coverY = (i, dir) => H / 2 + dir * [0.22, 0.1, 0][i] * H;
  const restTop = ph ? [0.76, 0.81, 0.87] : [0.7, 0.755, 0.815];
  const restY = (i) => restTop[i] * H + bands[i].extent * 0.96; // (the puffs reach past the band: its visible top is its extent)
  const LAG_IN = [0, 3, 6], LAG_OUT = [12, 6, 0];
  // drawn front first (the first layer added is on top). One layer per band for the whole story: down through the
  // climb (in), settling into the sea under the card (reveal), up over it again (down), away off the top (up)
  for (let bi = bands.length - 1; bi >= 0; bi--) {
    const b = bands[bi], t0 = FT.IN0 + LAG_IN[bi], t9 = FT.UP1 - 12 + LAG_OUT[bi];
    const y = [
      [t0, -b.extent, [0.3, 0.1, 0.35, 1]], [FT.IN1, coverY(bi, 1), [0.25, 0.35, 0.2, 1]],
      [FT.IN1 + 64 + LAG_OUT[bi], restY(bi), [0.45, 0, 0.55, 1]], [FT.DOWN0 - 6, restY(bi) + 4 * U, [0.55, 0, 0.5, 1]],
      [FT.DOWN1, coverY(bi, -1), [0.45, 0.2, 0.55, 1]], [t9, -b.extent]
    ];
    const sx = (bi - 1) * 30 * U;
    const x = [[t0, W / 2 + sx, E.inOut], [FT.IN1 + 64, W / 2 - sx, E.inOut], [FT.DOWN0, W / 2 - sx * 1.2, E.inOut], [t9, W / 2 + sx]];
    const nul = Cm.nul(`clouds · ${b.nm}`, { ip: t0, op: t9 + 1, ks: { p: { x, y } } });
    if (b.clusters.length) Cm.shape(`clouds · ${b.nm} · puffs`, b.clusters.flatMap((c, i) => [group("puff " + i, [...unionOutline(c, b.fillHex, SW * 0.8), group("shadow", [...c(), fill(rgb(SHADOW), 8)], { p: [6 * U, 12 * U] })])]), { parent: nul, ip: t0, op: t9 + 1 });
    Cm.shape(`clouds · ${b.nm} · body`, unionOutline(b.shapes, b.fillHex, SW), { parent: nul, ip: t0, op: t9 + 1 });
    // the shadow it throws on what is under it (the key light is top left: down and to the right)
    Cm.shape(`clouds · ${b.nm} · shadow`, [
      group("shadow 2", [...b.shapes(), fill(rgb(SHADOW), 6)], { p: [10 * U, 26 * U] }),
      group("shadow 1", [...b.shapes(), fill(rgb(SHADOW), 9)], { p: [5 * U, 13 * U] })
    ], { parent: nul, ip: t0, op: t9 + 1 });
  }
  const json = Cm.json();
  json.cromatic = { piece: "finale", markers: { in: [FT.IN0, FT.IN1], reveal: [FT.IN1, FT.REV1], down: [FT.DOWN0, FT.DOWN1], up: [FT.DOWN1, FT.UP1] }, card: FT.CARD };
  return json;
}
