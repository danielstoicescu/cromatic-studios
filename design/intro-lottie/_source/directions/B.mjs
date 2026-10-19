// Direction B · "The street" (illustrated). One street, drawn: a feed of thumbnails falls away, a road is laid, and on
// it a house goes up (place), gets its face (facade), its awning and sign (brand). Nine worlds wash over the same
// street. Then the camera pulls back: the city builds itself around the street, the roundabout arrives where the
// map's roundabout is, the car waits where the map's car is, and the drawing gives way to the real city, road on road.
import { Comp, group, rect, ellipse, fill, stroke, trim, rgb, E, prop, path, poly, roundRect, pathProp, rng } from "../lib/lottie.mjs";
import { C, WORLD_GROUNDS, layout, wordsLayer, pillGeom, pillShift, slotWord, at } from "../lib/kit.mjs";

export const TL_B = { B1: 0.1, B2: 1.85, B3: 4.1, B4: 6.85, HOLD: 8.45, HAND: 8.85, END: 10.0 };

// the map's first frame, measured on the stills (fractions of the screen): the street, the roundabout, the car
const MAP = {
  desktop: { road: [[0.427, 0.232], [0.427, 1.06]], roadW: 0.03, rb: [0.427, 0.232], rbR: 60, cross: 0.232, crossW: 28, car: [0.429, 0.795] },
  phone: { road: [[0.448, 0.265], [0.46, 0.45], [0.475, 0.65], [0.519, 0.85], [0.62, 0.95], [0.7, 1.04]], roadW: 0.088, rb: [0.448, 0.265], rbR: 54, cross: 0.265, crossW: 26, car: [0.498, 0.756] }
};

export function buildB(T, ab) {
  const ph = ab.name === "phone";
  const W = ab.w, H = ab.h, M = MAP[ab.name];
  const Cm = new Comp({ w: W, h: H, dur: TL_B.END, nm: `Cromatic opening · B · the street · ${ab.name}` });
  const { B1, B2, B3, B4, HOLD, HAND, END } = TL_B;
  Cm.marker("words", 0, at(HOLD)); Cm.marker("hold", at(HOLD), at(HAND)); Cm.marker("handoff", at(HAND), at(END));
  const S = ph ? 36 : 64, LEAD = 1.06, PG = 0.13;
  const capPx = (T.cap / T.upm) * S;
  // text: desktop in the right column (the street and the house take the left), phone across the top
  const TX = ph ? 24 : Math.round(W * 0.56), TY = ph ? 0.2 : 0.5;
  const blk = (lines, pill = false) => { const n = lines.length; const y = H * TY - (capPx + (n - 1) * S * LEAD + (pill ? PG * S : 0)) / 2 + capPx; return layout(T, lines, { x: TX, y, size: S, leading: LEAD, pillLines: pill ? [n - 1] : [], pillGap: PG }); };
  const SW = 2.5;

  // the camera: everything of the city lives in one scene group in map coordinates (screen px at the end); during
  // the beats it is seen through a lens Z times closer around P (a point on the street, by the house)
  const Z = ph ? 3.0 : 3.8;
  const roadAt = (fy) => { const pts = M.road; for (let i = 1; i < pts.length; i++) if (fy <= pts[i][1]) { const [a, b] = [pts[i - 1], pts[i]]; const u = (fy - a[1]) / (b[1] - a[1]); return (a[0] + (b[0] - a[0]) * u) * W; } return pts[pts.length - 1][0] * W; };
  const Py = ph ? 0.6 * H : 0.6 * H, P = [roadAt(Py / H), Py];
  // where P shows on screen during the beats (desktop: left of the text column; phone: under the text)
  const Ps = ph ? [W * 0.36, H * 0.66] : [W * 0.36, H * 0.6];
  const tZoom0 = at(HAND + 0.05), tZoom1 = at(END - 0.3), tFade0 = at(END - 0.32), tEnd = at(END);
  const tGround0 = tZoom0 + Math.round((tZoom1 - tZoom0) * 0.35);
  const cam = { a: P, p: [[0, Ps, E.hold], [tZoom0, Ps, [0.6, 0, 0.2, 1]], [tZoom1, P]], s: [[0, [Z * 100, Z * 100], E.hold], [tZoom0, [Z * 100, Z * 100], [0.6, 0, 0.2, 1]], [tZoom1, [100, 100]]] };
  const sw = (px) => px / Z; // a stroke that reads as px on screen while zoomed in
  const rw = M.roadW * W; // road width at the end

  /* ---------- text (top of the stack) ---------- */
  // ink per world: the text follows the ground (light ink on the dark worlds)
  const cuts = WORLD_GROUNDS.map((g, i) => [at(B3 + 0.45) + i * 7, g]);
  const inkKeys = [[0, rgb(C.black), E.hold], ...cuts.map(([t, g], i) => [t, rgb(g[2]), i < cuts.length - 1 ? E.hold : undefined])];
  const groundKeys = [[0, rgb(C.ground), E.hold], ...cuts.map(([t, g], i) => [t, rgb(g[0]), i < cuts.length - 1 ? E.hold : undefined])];
  const roadKeys = [[0, rgb(C.road), E.hold], ...cuts.map(([t, g], i) => [t, rgb(g[1]), i < cuts.length - 1 ? E.hold : undefined])];

  // beat 4
  const b4 = blk(["That's how the right", "brand feels.", "And like a good", "coffee."], true);
  const coffeeW = b4.find((w) => w.text === "coffee."), t4 = at(B4), t4b = at(B4 + 0.7), tH = at(HAND), tHold = at(HOLD);
  const cX = coffeeW.lx + coffeeW.x + pillShift(S);
  {
    const cp = pillGeom(S, cX - 0.34 * S, coffeeW.by, coffeeW.w), tIn = at(B4 + 0.95);
    const cw = slotWord(T, "coffee.", S, C.black, cX, coffeeW.by, { inAt: tIn + 6, outAt: tH, dist: 0.62, outDur: 10 });
    Cm.shape("beat 4 · coffee. (word)", [group("word", cw.groups)], { ip: tIn, op: tH + 12 });
    Cm.shape("beat 4 · coffee. (pill)", [group("pill", [rect([[tIn, [cp.w * 0.55, cp.h * 0.55], E.spring], [tIn + 26, [cp.w, cp.h], E.hold], [tH, [cp.w, cp.h], E.in], [tH + 12, [cp.w * 0.9, cp.h * 0.9]]], [cp.cx, cp.cy], 9999), stroke(rgb(C.black), SW), fill(rgb(C.yellow))], { o: [[tH, 100, E.linear], [tH + 12, 0]] })], { ip: tIn, op: tH + 14 });
  }
  wordsLayer(Cm, T, b4.filter((w) => w !== coffeeW), { nm: "beat 4 · words", size: S, enterAt: (i) => (i < 6 ? t4 + i * 4 : t4b + (i - 6) * 4), exitAt: (i) => tH + i * 0.6, exitDur: 12, ip: t4 - 1, op: tH + 20 });

  // beat 3
  const b3a = blk(ph ? ["Nine worlds over", "the same streets."] : ["Nine worlds over", "the same streets."]);
  const b3b = blk(["One will feel", "like yours."], true);
  const t3 = at(B3), t3b = cuts[cuts.length - 1][0] - 6, t3out = at(B4 - 0.28);
  const inkFor = () => inkKeys;
  wordsLayer(Cm, T, b3a, { nm: "beat 3 · nine worlds over the same streets", size: S, colorOf: inkFor, enterAt: (i) => t3 + i * 4, exitAt: (i) => t3b - 14 + i, exitDur: 12, ip: t3 - 1, op: t3b + 4 });
  const yoursW = b3b.find((w) => w.text === "yours.");
  wordsLayer(Cm, T, b3b.filter((w) => w !== yoursW), { nm: "beat 3 · one will feel like", size: S, enterAt: (i) => t3b + i * 4, exitAt: (i) => t3out + i * 1.5, exitDur: 14, ip: t3b - 1, op: t3out + 20 });
  const yX = yoursW.lx + yoursW.x + pillShift(S), yp = pillGeom(S, yX - 0.34 * S, yoursW.by, yoursW.w), tY = t3b + 14;
  Cm.shape("beat 3 · yours. (word)", [group("word", slotWord(T, "yours.", S, C.black, yX, yoursW.by, { inAt: tY + 6, outAt: t3out + 2, dist: 0.62, outDur: 12 }).groups)], { ip: tY, op: t3out + 20 });
  Cm.shape("beat 3 · yours. (pill)", [group("pill", [rect([[tY, [yp.w * 0.55, yp.h * 0.55], E.spring], [tY + 26, [yp.w, yp.h], E.hold], [t3out, [yp.w, yp.h], E.in], [t3out + 14, [yp.w * 0.9, yp.h * 0.9]]], [yp.cx, yp.cy], 9999), stroke(rgb(C.black), SW), fill(rgb(C.yellow))], { o: [[t3out, 100, E.linear], [t3out + 14, 0]] })], { ip: tY, op: t3out + 20 });

  // beat 2: the key word in a pill whose colour is the thing it names in the drawing (green house, blue windows, yellow awning)
  const b2 = blk(["But someone could", "remember a", "place."], true);
  const placeW = b2.find((w) => w.text === "place.");
  const t2 = at(B2), tP = at(B2 + 0.5), tF = at(B2 + 0.95), tB = at(B2 + 1.4), t2out = at(B3 - 0.22);
  wordsLayer(Cm, T, b2.filter((w) => w !== placeW), { nm: "beat 2 · but someone could remember a", size: S, enterAt: (i) => t2 + i * 4, exitAt: (i) => t2out + i * 1.5, exitDur: 14, ip: t2 - 1, op: t2out + 22 });
  const x0 = placeW.lx + placeW.x + pillShift(S);
  const W2 = [["place.", C.green, C.black, tP], ["facade.", C.blue, C.white, tF], ["brand.", C.yellow, C.black, tB]];
  const g2 = W2.map(([w]) => pillGeom(S, x0 - 0.34 * S, placeW.by, slotWord(T, w, S, C.black, x0, placeW.by).width));
  const c2 = (g) => [g.cx, g.cy], s2 = (g, k = 1) => [g.w * k, g.h * k];
  const pSize = [[tP, s2(g2[0], 0.55), E.spring], [tP + 26, s2(g2[0]), E.hold], [tF - 2, s2(g2[0]), E.spring], [tF + 22, s2(g2[1]), E.hold], [tB - 2, s2(g2[1]), E.spring], [tB + 22, s2(g2[2]), E.hold], [t2out, s2(g2[2]), E.in], [t2out + 14, s2(g2[2], 0.9)]];
  const pPos = [[tP, c2(g2[0]), E.hold], [tF - 2, c2(g2[0]), E.spring], [tF + 22, c2(g2[1]), E.hold], [tB - 2, c2(g2[1]), E.spring], [tB + 22, c2(g2[2])]];
  const slots = W2.map(([w, , ink, t], k) => slotWord(T, w, S, ink, x0, placeW.by, { inAt: t + (k ? 4 : 8), outAt: k < 2 ? W2[k + 1][3] - 2 : t2out + 1, dist: 0.62, outDur: 12 }));
  const maskKeys = pSize.map(([t, sz, e]) => { const c = valAt(pPos, t); return [t, roundRect(c[0], c[1], sz[0], sz[1], sz[1] / 2), e]; });
  Cm.shape("beat 2 · place. facade. brand. (words)", slots.map((s, k) => group(W2[k][0], s.groups)), { ip: tP, op: t2out + 22, masks: [{ inv: false, mode: "a", pt: pathProp(maskKeys), o: prop(100), x: prop(0), nm: "pill" }] });
  Cm.shape("beat 2 · pill", [group("pill", [rect(pSize, pPos, 9999), stroke(rgb(C.black), SW), fill([[tP, rgb(C.green), E.hold], [tF + 2, rgb(C.blue), E.hold], [tB + 2, rgb(C.yellow)]])], { o: [[t2out, 100, E.linear], [t2out + 14, 0]] })], { ip: tP, op: t2out + 22 });

  // beat 1: the feed of thumbnails (where the house will stand) falls away
  const b1 = blk(ph ? ["Nobody remembers", "a thumbnail."] : ["Nobody remembers", "a thumbnail."]);
  const t1 = at(B1), t1out = at(1.5);
  wordsLayer(Cm, T, b1, { nm: "beat 1 · nobody remembers a thumbnail", size: S, enterAt: (i) => t1 + i * 5, exitAt: (i) => t1out + i * 2, exitDur: 16, ip: 0, op: t1out + 24 });
  {
    const cols = 3, rows = 3, cw = ph ? 58 : 92, ch = cw * 0.62, g = ph ? 10 : 16;
    const ox = (ph ? W * 0.5 : W * 0.3) - ((cols * cw + (cols - 1) * g) / 2), oy = (ph ? H * 0.6 : H * 0.5) - ((rows * ch + (rows - 1) * g) / 2);
    const cards = [];
    for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) {
      const i = r * cols + c, x = ox + c * (cw + g) + cw / 2, y = oy + r * (ch + g) + ch / 2, t0 = at(0.25) + i * 3, tf = at(1.05) + ((i * 5) % 9) * 2;
      cards.push(group("thumb " + i, [
        group("hill", [path(poly([[-cw * 0.36, ch * 0.3], [-cw * 0.1, -ch * 0.04], [cw * 0.08, ch * 0.16], [cw * 0.18, ch * 0.06], [cw * 0.36, ch * 0.3]])), stroke(rgb(C.black), 1.5), fill(rgb(C.white))]),
        group("sun", [ellipse([cw * 0.12, cw * 0.12], [cw * 0.24, -ch * 0.2]), stroke(rgb(C.black), 1.5), fill(rgb(C.white))]),
        group("card", [rect([cw, ch], [0, 0], ph ? 6 : 9), stroke(rgb(C.black), 2), fill(rgb(C.bar))])
      ].map((g) => moveTo(g, x, y)), { a: [x, y + ch / 2], p: [[t0, [x, y + ch / 2 + 10], E.out], [t0 + 20, [x, y + ch / 2], E.hold], [tf, [x, y + ch / 2], E.in], [tf + 18, [x, y + ch / 2 + 26]]], s: [[t0, [90, 90], E.spring], [t0 + 20, [100, 100], E.hold], [tf, [100, 100], E.in], [tf + 18, [100, 0]]], o: [[t0, 0, E.linear], [t0 + 8, 100, E.hold], [tf + 10, 100, E.linear], [tf + 18, 0]] }));
    }
    Cm.shape("beat 1 · a feed of thumbnails", cards, { ip: 0, op: at(1.7) });
  }

  /* ---------- the scene (map coordinates), under the text ---------- */
  const scene = Cm.nul("camera", { ks: cam, op: tEnd + 1 });
  const fadeOut = [[tFade0, 100, E.linear], [tEnd, 0]];
  // the house: green walls (the studio's own house is green on the map), roof, then its facade, then its brand
  const side = ph ? 1 : -1; // the house stands right of the street on a phone, left of it on a laptop
  const hw = ph ? 40 : 52, hh = ph ? 30 : 38, hd = ph ? 18 : 22; // in map px (it is seen Z times bigger)
  const hx = P[0] + side * (rw / 2 + 6 + hw / 2), hb = P[1] + (ph ? 6 : 10); // front bottom
  const tHouse = tP, tFac = tF, tBrand = tB, tCafe = at(B4 + 1.05);
  const ol = sw(2.5);
  const house = [];
  // brand: awning (yellow, scalloped) and a round sign with the studio's four-point star
  const aw = hw * 0.92, ah = hh * 0.22, ay = hb - hh * 0.52;
  const scallops = []; const nS = 5; for (let i = 0; i < nS; i++) scallops.push(ellipse([aw / nS, ah * 0.9], [hx - aw / 2 + (i + 0.5) * (aw / nS), ay + ah / 2]));
  house.push(group("brand · sign", [
    group("star", [path(star4(hx, hb - hh - hd * 0.5, hd * 0.32)), fill(rgb(C.black))]),
    group("disc", [ellipse([hd * 0.95, hd * 0.95], [hx, hb - hh - hd * 0.5]), stroke(rgb(C.black), ol), fill(rgb(C.yellow))])
  ], { a: [hx, hb - hh - hd * 0.5], p: [hx, hb - hh - hd * 0.5], s: popKeys(tBrand + 8), o: appear(tBrand + 8) }));
  house.push(group("brand · awning", [
    group("scallops", [...scallops, stroke(rgb(C.black), ol), fill(rgb(C.yellow))]),
    group("band", [rect([aw, ah], [hx, ay], 0), stroke(rgb(C.black), ol), fill(rgb(C.yellow))])
  ], { a: [hx, ay - ah / 2], p: [hx, ay - ah / 2], s: [[0, [100, 0], E.hold], [tBrand, [100, 0], E.spring], [tBrand + 20, [100, 100]]], o: appear(tBrand) }));
  // facade: door, windows, a cornice band
  const facade = [];
  facade.push(group("door", [rect([hw * 0.2, hh * 0.38], [hx, hb - hh * 0.19], 1.2), stroke(rgb(C.black), ol), fill(rgb(C.black))]));
  const wins = [[-0.3, 0.3], [0.3, 0.3], [-0.3, 0.62], [0.3, 0.62]];
  wins.forEach(([u, v], i) => facade.push(group("window " + i, [rect([hw * 0.22, hh * 0.2], [hx + u * hw, hb - v * hh], 1), stroke(rgb(C.black), ol), fill(rgb(C.blue))], { a: [hx + u * hw, hb - v * hh], p: [hx + u * hw, hb - v * hh], s: popKeys(tFac + 4 + i * 3), o: appear(tFac + 4 + i * 3) })));
  facade.push(group("cornice", [rect([hw * 1.06, hh * 0.08], [hx, hb - hh * 0.97], 0), stroke(rgb(C.black), ol), fill(rgb(C.white))], { o: appear(tFac) }));
  house.push(group("facade", facade, { o: appear(tFac) }));
  // the block itself, up from the ground on a spring
  house.push(group("roof", [rect([hw, hd], [hx, hb - hh - hd / 2], 0), stroke(rgb(C.black), ol), fill(rgb("#7EE08F"))]));
  house.push(group("walls", [rect([hw, hh], [hx, hb - hh / 2], 0), stroke(rgb(C.black), ol), fill(rgb(C.green))]));
  // the coffee (beat 4): a place pin pops up over the house, a cup in it (the map marks its places with pins)
  const pr = hd * 0.78, px = hx, py = hb - hh - hd - pr * 1.9;
  const cupI = (x, y, u) => [
    group("steam", [path({ c: false, v: [[x - u * 0.22, y - u * 0.62], [x - u * 0.1, y - u * 0.95]], i: [[0, 0], [-u * 0.12, u * 0.1]], o: [[u * 0.12, -u * 0.1], [0, 0]] }), path({ c: false, v: [[x + u * 0.14, y - u * 0.62], [x + u * 0.26, y - u * 0.95]], i: [[0, 0], [-u * 0.12, u * 0.1]], o: [[u * 0.12, -u * 0.1], [0, 0]] }), stroke(rgb(C.black), u * 0.09, 100, { lc: 2 })]),
    group("handle", [ellipse([u * 0.42, u * 0.42], [x + u * 0.42, y - u * 0.05]), stroke(rgb(C.black), u * 0.11)]),
    group("body", [path({ c: true, v: [[x - u * 0.5, y - u * 0.42], [x + u * 0.5, y - u * 0.42], [x + u * 0.36, y + u * 0.3], [x - u * 0.36, y + u * 0.3]], i: [[0, 0], [0, 0], [u * 0.08, -u * 0.12], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [-u * 0.08, -u * 0.12]] }), fill(rgb(C.black))]),
    group("saucer", [rect([u * 1.25, u * 0.12], [x, y + u * 0.42], 9999), fill(rgb(C.black))])
  ];
  const cafe = group("coffee pin", [
    ...cupI(px, py + pr * 0.08, pr * 0.95),
    group("head", [ellipse([pr * 2, pr * 2], [px, py]), stroke(rgb(C.black), ol), fill(rgb(C.white))]),
    group("tip", [path(poly([[px - pr * 0.45, py + pr * 0.8], [px + pr * 0.45, py + pr * 0.8], [px, py + pr * 1.75]])), stroke(rgb(C.black), ol), fill(rgb(C.white))])
  ], { a: [px, py + pr * 1.75], p: [px, py + pr * 1.75], s: [...popKeys(tCafe, 22).slice(0, 2), [tCafe + 22, [100, 100], E.hold], [tHold, [100, 100], E.inOut], [Math.round((tHold + tH) / 2), [108, 108], E.inOut], [tH, [100, 100]]], o: appear(tCafe) }); // the pin bobs once in the hold: the loop while the city is late
  Cm.shape("scene · café", [cafe], { parent: scene, ks: { o: fadeOut }, ip: tCafe - 1, op: tEnd + 1 });
  Cm.shape("scene · the house", [group("house", house, { a: [hx, hb], p: [hx, hb], s: [[0, [100, 0], E.hold], [tHouse, [100, 0], E.spring], [tHouse + 24, [100, 100]]], o: appear(tHouse) })], { parent: scene, ks: { o: fadeOut }, ip: tHouse - 1, op: tEnd + 1 });

  // the car, where the map's car waits
  const car = [M.car[0] * W, M.car[1] * H], cw2 = ph ? 9 : 10, chh = ph ? 15 : 17;
  Cm.shape("scene · the car", [group("car", [
    group("windshield", [rect([cw2 * 0.8, chh * 0.22], [car[0], car[1] - chh * 0.18], 1.5), fill(rgb(C.black))]),
    group("body", [rect([cw2, chh], car, 3), stroke(rgb(C.black), 1.2), fill(rgb(C.yellow))])
  ], { a: car, p: car, s: popKeys(tZoom0 + 10, 14), o: appear(tZoom0 + 10) })], { parent: scene, ks: { o: fadeOut }, ip: tZoom0, op: tEnd + 1 });

  // the street: laid in beat 2 from the bottom up to the house; drawn to the roundabout as the camera pulls back
  const roadPts = M.road.map(([fx, fy]) => [fx * W, fy * H]).reverse(); // bottom -> top
  const roadPath = smooth(roadPts);
  const tRoad = at(B2 + 0.05), roadToHouse = (roadPts[0][1] - (P[1] - (ph ? 70 : 100))) / (roadPts[0][1] - roadPts[roadPts.length - 1][1]);
  const roadTrim = [[0, 0, E.hold], [tRoad, 0, E.out], [tRoad + 30, Math.max(0.2, roadToHouse) * 100, E.hold], [tZoom0, Math.max(0.2, roadToHouse) * 100, [0.5, 0, 0.2, 1]], [tZoom0 + at(0.5), 100]];
  const uRb = ((M.rb[0] * W + 60) / (W + 120)) * 100; // where the roundabout sits along the cross street (%)
  const crossFrom = [[0, 100, E.hold], [tZoom0 + 10, 100, E.out], [tZoom0 + at(0.55), 0]]; // 100 = closed at the roundabout, 0 = open
  const cy = M.cross * H, rb = [M.rb[0] * W, M.rb[1] * H];
  Cm.shape("scene · roundabout", [
    group("island", [ellipse([M.rbR * 1.1, M.rbR * 1.1], rb), stroke(rgb(C.black), 1.2), fill(rgb(C.tree))]),
    group("ring", [ellipse([M.rbR * 2, M.rbR * 2], rb), stroke(rgb(C.black), 1.2), fill(roadKeys)])
  ], { parent: scene, ks: { o: fadeOut, a: rb, p: rb, s: popKeys(tZoom0 + at(0.3), 16) }, ip: tZoom0, op: tEnd + 1 });
  Cm.shape("scene · cross street", [group("cross", [
    path(poly([[-60, cy], [W + 60, cy]], false)), trim(crossFrom.map(([t, v, e]) => [t, (v * uRb) / 100, e]), crossFrom.map(([t, v, e]) => [t, uRb + (100 - uRb) * (1 - v / 100), e])), stroke(rgb("#FFFFFF"), 1.2, 100, { lc: 1, d: [6, 6] }), stroke(roadKeys, M.crossW, 100, { lc: 1 }), stroke(rgb(C.black), M.crossW + 2.4, 100, { lc: 1 })
  ])], { parent: scene, ks: { o: fadeOut }, ip: tZoom0, op: tEnd + 1 });
  Cm.shape("scene · the street", [group("street", [
    path(roadPath), trim(0, roadTrim), stroke(rgb("#FFFFFF"), sw(3), 100, { lc: 1, d: [sw(14), sw(12)] }), stroke(roadKeys, rw, 100, { lc: 1, lj: 2 }), stroke(rgb(C.black), rw + sw(5), 100, { lc: 1, lj: 2 })
  ])], { parent: scene, ks: { o: fadeOut }, ip: tRoad, op: tEnd + 1 });

  /* ---------- the ground: each world's, last the Cromatic one; it fades with the drawing into the real city ---------- */
  Cm.shape("ground", [group("ground", [rect([W + 8, H + 8], [W / 2, H / 2]), fill(groundKeys)])], { ks: { o: [[tGround0, 100, E.inOut], [tZoom1 - 4, 0]] }, op: tEnd + 1 });
  const json = Cm.json();
  // the host's part of the handoff: the real map's camera makes the same move as the drawing's camera (a pull-back
  // from Z around the street to the first frame), so the drawn street lands on the real one all the way down
  json.cromatic = { handoff: { kind: "pullback", anchor: P.map((v, i) => +(v / (i ? H : W)).toFixed(4)), from: Ps.map((v, i) => +(v / (i ? H : W)).toFixed(4)), scale: Z, t0: tZoom0, t1: tZoom1, ease: [0.6, 0, 0.2, 1] } };
  return json;
}

/* ---------- helpers ---------- */
function valAt(keys, t) { let v = keys[0][1]; for (const k of keys) if (k[0] <= t) v = k[1]; return v; }
const appear = (t, d = 6) => [[0, 0, E.hold], [t, 0, E.linear], [t + d, 100]];
const popKeys = (t, d = 20) => [[0, [0, 0], E.hold], [t, [0, 0], E.spring], [t + d, [100, 100]]];
// the studio's four-point star (punctuation on the site)
function star4(cx, cy, r) { const k = 0.28 * r; return poly([[cx, cy - r], [cx + k, cy - k], [cx + r, cy], [cx + k, cy + k], [cx, cy + r], [cx - k, cy + k], [cx - r, cy], [cx - k, cy - k]]); }
// a smooth open path through points (Catmull-Rom as cubic tangents)
function smooth(pts) {
  const v = pts.map((p) => p.map((x) => +x.toFixed(1))), i = [], o = [];
  for (let k = 0; k < pts.length; k++) {
    const a = pts[Math.max(0, k - 1)], b = pts[Math.min(pts.length - 1, k + 1)];
    const t = [(b[0] - a[0]) / 6, (b[1] - a[1]) / 6];
    i.push([-t[0], -t[1]].map((x) => +x.toFixed(1))); o.push(t.map((x) => +x.toFixed(1)));
  }
  i[0] = [0, 0]; o[o.length - 1] = [0, 0];
  return { c: false, v, i, o };
}
function roadLen(pts) { let L = 0; for (let k = 1; k < pts.length; k++) L += Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]); return L; }
// a group's contents drawn around (0,0) moved to (x, y): for the thumbnails' parts
function moveTo(g, x, y) { const t = g.it[g.it.length - 1]; t.p = prop([x, y]); return g; }
