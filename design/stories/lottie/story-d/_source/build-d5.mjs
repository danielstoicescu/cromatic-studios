// Cromatic · stories in Lottie · story D5 (TASK-115, Iris; Daniel's notes on D4), English, 1080 x 1920, 60 fps, 39.1 s.
// D4 (build-d4.mjs, Lia) with:
//   the opening: the portfolio's grid scrolled much more slowly; Our portfolio / is not only [scrollable.] centred, the
//     pill last (d15-portfolio)
//   Printoteca and the skyline out; in their place the city from high with the map's own pins and three of its place
//     cards opening one after another, "Every brand / in our portfolio / is on this [map.]" (d16-map); then one
//     continuous move down to the street in front of Steam (no cut, no facade card), Knock knock., Come in.
//   Steam's live case page scrolled in three bursts (a quick start, a stop of about a second on each: the green
//     T-shirt, the brand manual's logos and type, "Ne știm de la Steam"), then the page closes into its pill (the
//     site's own close) onto the street
//   the rides as D4, in the same order, slower (the hold rule plus the move); See you / around. bottom right (d17)
// The new shots are the map's frames at 2x (renderD5.mjs) and the site's own pages (capture-work-d3.mjs slower,
// capture-steam-d5.mjs): they are not in the Lottie, compose-d5.mjs puts them under it frame by frame (the Lottie is
// transparent over them: its cards, pins, the page's pill). Everything after the street is D4's Lottie as it was.
//   node build-d5.mjs  -> ../story-d5-en.json   (plates: platesD5.json = D4's + plates-d5.mjs)
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Comp, roundRect } from "../../../../intro-lottie/_source/lib/lottie.mjs";
import { W, H, K, clamp, lerp, easeOut, easeIn, easeInOut, ramp, backOut, rng, bake, holdKeys, grain, weave, flicker, vignette, glowShape, group, rect, ellipse, fill, gfill, stroke, rgb, E, prop, shp, poly } from "./lib-d.mjs";
import { letterGroup } from "../../../../lottie-ui/_source/lib/ui.mjs";
import { setLine } from "../../../../intro-lottie/_source/lib/type.mjs";
import { loadCards, drawCard } from "../../../cards/cards.mjs";
import { layTag, type as cardType } from "../../../cards/_source/system.mjs";

const here = path.dirname(fileURLToPath(import.meta.url)), OUT = path.resolve(here, "..");
const P = JSON.parse(fs.readFileSync(path.join(here, "platesD5.json"), "utf8"));
import { cam as camProj } from "../../_source/kit2.mjs";
import { D3 as SH3 } from "../../_source/shotsD3.mjs";
const S = P.shots;
const KC = await loadCards(); await cardType();
const BOUNCE = [0.34, 1.56, 0.64, 1], SNAP = [0.7, 0, 0.84, 0], EXPO = [0.16, 1, 0.3, 1];
// a line of the house face as letter groups at a baseline (the tags' words, as cards.mjs sets them)
const letterGroupD = (text, size, tracking, x, baseline, ink) => setLine(KC.T, text, size, tracking).letters.map((l) => letterGroup(KC.T, { ...l, x: x + l.x }, size, rgb(ink), { extra: (b, s2) => ({ p: [b[0], b[1] + baseline], s: [s2, s2] }) }));

/* ======================= the clock (frames at 60; the cards' D2 clock is this /2) ======================= */
// (v4: the drift 2.5 s, cut once the ride is round the corner; the page carries the scroll; Dive. before pulled over)
const T2 = { site: [0, 240], bird: [240, 456], zoom: [456, 660], steam: [660, 850], page: [790, 1204], r1: [1204, 1288], r2: [1288, 1378], r3: [1378, 1510], r4: [1510, 1600], r5: [1600, 1696], sip: [1696, 1816], r9: [1816, 1906], r8: [1906, 2026], fount: [2026, 2206], end: [2206, 2346] };
const F = 2346, DUR = F / 60, WHIPD = 6;
// (Steam: the card rises, two knocks, the pill opens the page (D4's timings on the steam shot); the real page from REAL;
// it closes into its pill over CLOSE, onto the street; the backgrounds under the Lottie: BG, read by compose-d5.mjs)
const CARD = 736, KNOCK = [752, 768], OPEN = 790, OPEND = 29, SCROLL = [F + 10, F + 20], DEAL = F + 30, REAL = 850, CLOSE = [1140, 1176];
export const BG = [["site", 0, 240], ["bird", 240, 456], ["zoom", 456, 660], ["steam", 660, REAL], ["page", REAL, CLOSE[0]], ["street", CLOSE[0], T2.r1[0]]];

/* ======================= plates ======================= */
let Cm;
function asset(name) {
  const m = P.plates[name]; if (!m) throw new Error("no plate " + name);
  if (!Cm.assets.find((a) => a.id === name)) { Cm.asset(name, m.w, m.h, m.file); Cm.assets[Cm.assets.length - 1].u = "images/"; }
  return name;
}
const img = (name, parent, { ip, op, p, s, o, nm, r, a } = {}) => { const m = P.plates[name]; asset(name); return Cm.image(nm || name, name, { ip, op, parent, ks: { p: p || [m.x, m.y], ...(s != null ? { s: Array.isArray(s) ? s : [s, s] } : {}), ...(o != null ? { o } : {}), ...(r != null ? { r } : {}), ...(a ? { a } : {}) } }); };

/* ======================= cameras (as story D) ======================= */
const camNull = (nm, ip, op, fn, parent) => {
  const k = bake(ip, op, (t) => { const c = fn(t); return { a: c.a, p: [W / 2 + (c.dx || 0), H / 2 + (c.dy || 0)], s: [100 * K * c.z, 100 * K * c.z], r: c.r || 0 }; });
  return Cm.nul(nm, { ip, op: op + 1, parent, ks: { a: k.a, p: k.p, s: k.s, r: k.r } });
};
const D_WHIP = 1150;
const whipOut = (t, t1, dir) => { const u = ramp(t, t1 - WHIPD, t1, easeIn); return [dir[0] * D_WHIP * u, dir[1] * D_WHIP * u]; };
const whipIn = (t, t0, dir) => { const u = 1 - ramp(t, t0, t0 + WHIPD, easeOut); return [-dir[0] * D_WHIP * u, -dir[1] * D_WHIP * u]; };
const smearO = (t0in, t1out) => { const k = [[0, 0, E.hold]]; if (t0in != null) k.push([t0in, 100, E.linear], [t0in + 3, 100, E.linear], [t0in + WHIPD, 0, E.hold]); if (t1out != null) k.push([t1out - WHIPD + 1, 0, E.linear], [t1out - 2, 100, E.hold]); k.sort((a, b) => a[0] - b[0]); k[k.length - 1] = [k[k.length - 1][0], k[k.length - 1][1]]; return k; };

// a card spec with its cues overridden (Iris's specs are shared: never changed in place)
const card = (id, t) => { const { __T, ...src } = KC.card(id), cc = JSON.parse(JSON.stringify(src)); cc.__T = KC.T; if (t) Object.assign(cc.timing.cues, t); return cc; };
const clip = (r, shot) => { for (const L of [...r.layers, ...r.behind]) L.op = Math.min(L.op, T2[shot][1]); return r; };
// a map tag (Iris's tag: the white plate, the yellow dot, the pointer) pinned to a point of a plate: drawn in story px
// about its pointer's tip, under a null that sits on the point (its parent the plate's camera) and undoes its zoom
function mapTag(name, parent, at, zoom, tIn, tOut, right = false) {
  const G = layTag({ id: name, text: name, x: 0, top: 0 });
  // (right: the pointer near the plate's right end, so a tag on the frame's right edge reads leftwards)
  if (right) { const px = G.plate.x + G.plate.w - (G.pointer.x - G.plate.x); G.pointer = { ...G.pointer, x: px, tip: [px, G.pointer.tip[1]] }; }
  const lt = KC.T, ink = rgb("#0D0C09"), pl = G.plate, d = G.dot, po = G.pointer, tip = po.tip;
  const tri = (dx, dy) => poly([[po.x - po.w / 2 + dx, po.y - pl.keyline + dy], [po.x + po.w / 2 + dx, po.y - pl.keyline + dy], [po.x + dx, po.y + po.h + dy]]);
  const sides = poly([[po.x - po.w / 2, po.y], [po.x, po.y + po.h], [po.x + po.w / 2, po.y]], false);
  const pin = Cm.nul(`tag · ${name} · pin`, { parent, ip: tIn, op: tOut + 14, ks: { p: at, s: [100 / zoom, 100 / zoom] } });
  Cm.shape(`tag · ${name}`, [
    group("text", letterGroupD(G.text, G.size, G.tracking, G.textX, G.baseline, "#0D0C09")),
    group("dot", [ellipse([d.d, d.d], [d.cx, d.cy]), stroke(ink, d.keyline), fill(rgb(d.fill))]),
    group("pointer · sides", [shp(sides), stroke(ink, pl.keyline, 100, { lc: 2, lj: 2 })]),
    group("pointer", [shp(tri(0, 0)), fill(rgb(pl.fill))]),
    group("plate", [rect([pl.w, pl.h], [pl.x + pl.w / 2, pl.y + pl.h / 2], pl.r), stroke(ink, pl.keyline), fill(rgb(pl.fill))]),
    group("shadow", [rect([pl.w, pl.h], [pl.x + pl.w / 2 + pl.shadow[0], pl.y + pl.h / 2 + pl.shadow[1]], pl.r), shp(tri(pl.shadow[0], pl.shadow[1])), fill(ink)])
  ], { parent: pin, ip: tIn, op: tOut + 14, ks: { a: tip, p: [0, 0], s: [[tIn, [40, 40], BOUNCE], [tIn + 18, [100, 100], E.hold], [tOut, [100, 100], SNAP], [tOut + 12, [0, 0]]], o: [[tIn, 0, E.linear], [tIn + 4, 100]] } });
}

/* ======================= D5 · the map's pins and place cards over the city from high ======================= */
// the pins (their own pictures from the map's page, at 2x: drawn at 40 %, so a pin is a phone's pin at 80 %) sit on
// their places' feet, frame by frame (the renders' projections); they land one after another, the way the map shows
// them; three place cards open one after another over their pins; as the camera falls they go, Steam's last
const PIN_IDS = ["steam", "berero", "yoshi", "artisan", "scf", "sip", "oma", "tac"], CARD_SEQ = [["berero", 36], ["scf", 92], ["yoshi", 148]];
function pinsAndCards() {
  const D5 = S.d5, PS = 0.62, CS = 0.26;
  const at = (shot, i, id) => { const q = D5.pinsAt[shot]?.[i]?.[id]; return q ? [q[0] / 2, q[1] / 2, q[2]] : null; };
  // a story frame (60) -> [shot, capture index]
  const where = (f) => (f < T2.zoom[0] ? ["bird", Math.round((f - T2.bird[0]) / 2)] : ["zoom", Math.min(D5.pinsAt.zoom.length - 1, Math.round((f - T2.zoom[0]) / 2))]);
  const a = T2.bird[0], b0 = T2.zoom[0];
  // the cards: each over its pin (its bottom a little above the pin's label), the next one closing the last
  CARD_SEQ.forEach(([id, d], n) => {
    const C0 = D5.cards[id], P0 = D5.pins[id]; if (!C0 || !P0) return;
    const tIn = a + d, tOut = n < CARD_SEQ.length - 1 ? a + CARD_SEQ[n + 1][1] - 4 : b0 - 6, w = C0.w * CS, h = C0.h * CS, lift = P0.anchor[1] * PS + 24;
    // (the card low in the frame, where the map's sheet would open, leaning towards its pin; the pin answers with a ring)
    const k = bake(tIn, tOut + 14, (f) => { const [sh, i] = where(f), q = at(sh, i, id) || [W / 2, H * 0.7]; return { p: [clamp(lerp(W / 2, q[0], 0.35), 90 + w / 2, W - 90 - w / 2), 1560] }; }, 2);
    { const [sh, i] = where(tIn), q = at(sh, i, id); if (q) Cm.shape(`pin ring · ${id}`, [group("ring", [ellipse([120, 120], [0, 0]), stroke(rgb("#ffffff"), [[tIn, 8, E.out], [tIn + 22, 1]], [[tIn, 95, E.linear], [tIn + 22, 0]])], { s: [[tIn, [40, 40], E.out], [tIn + 22, [260, 260]]] })], { ip: tIn, op: tIn + 23, ks: { p: [q[0], q[1]] } }); }
    const cn = Cm.nul(`card · ${id} · place`, { ip: tIn, op: tOut + 15, ks: { p: k.p } });
    const L = img(C0.img, cn, { ip: tIn, op: tOut + 14, p: [0, 0], nm: `place card · ${id}` });
    const sK = [[tIn, [100 * CS * 0.6, 100 * CS * 0.6], [0.34, 1.56, 0.64, 1]], [tIn + 18, [100 * CS, 100 * CS], E.hold], [tOut, [100 * CS, 100 * CS], [0.7, 0, 0.84, 0]], [tOut + 12, [100 * CS * 0.5, 100 * CS * 0.5]]], oK = [[tIn, 0, E.linear], [tIn + 5, 100, E.hold], [tOut + 6, 100, E.linear], [tOut + 12, 0]];
    L.ks.a = prop([C0.w / 2, C0.h]); L.ks.s = prop(sK); L.ks.o = prop(oK);
    Cm.shape(`place card · ${id} · shadow`, [group("s", [rect([C0.w - 30, C0.h - 30], [C0.w / 2 + 10, C0.h / 2 + 30], 70), fill(rgb("#000000"), 22)])], { parent: cn, ip: tIn, op: tOut + 14, ks: { a: [C0.w / 2, C0.h], s: sK, o: oK } });
  });
  const pinLayers = [];
  PIN_IDS.forEach((id, n) => {
    const P0 = D5.pins[id]; if (!P0) return;
    let tIn = a + 10 + n * 7; const tOut = id === "steam" ? b0 + 120 : b0 + 14 + n * 2, end = tOut + 12;
    const onScreen = (f) => { const [sh, i] = where(f), q = at(sh, i, id); return q && q[2] < 1 && q[0] > -200 && q[0] < W + 200 && q[1] > 200 && q[1] < H - 240; };
    // (Steam's pin is off the frame from high: it lands as the move down brings it in)
    if (id === "steam") { let f = a; while (f < tOut && !onScreen(f)) f += 2; if (f >= tOut - 20) return; tIn = Math.max(tIn, f); }
    else if (!onScreen(tIn + 20)) return;
    // (where it is, every 2 frames; off the frame or behind: it stays where it was last seen, hidden)
    const k = bake(tIn, end, (f) => { const [sh, i] = where(f), q = at(sh, i, id); return { p: q ? [q[0], q[1]] : [-999, -999] }; }, 2);
    const pn = Cm.nul(`pin · ${id} · place`, { ip: tIn, op: end + 1, ks: { p: k.p } });
    const L = img(P0.img, pn, { ip: tIn, op: end, p: [0, 0], nm: `pin · ${id}` });
    L.ks.a = prop(P0.anchor); L.ks.s = prop([[tIn, [0, 0], [0.34, 1.56, 0.64, 1]], [tIn + 16, [100 * PS, 100 * PS], E.hold], [tOut, [100 * PS, 100 * PS], [0.7, 0, 0.84, 0]], [end, [0, 0]]]);
    pinLayers.push(L);
  });
}

/* ======================= the story ======================= */
function story() {
  const lang = "en";
  Cm = new Comp({ w: W, h: H, dur: DUR, nm: `Cromatic · story D5 · around the city · ${lang}` });
  const WV = weave(Cm, { amp: 0.9 }); // (v3: a little less; the screens are not under it)
  const N = {};
  // ---------- the cameras ----------
  // (v3: the overtake: still, a hair of push; the cars do the moving)
  N.r3 = camNull("camera · overtake", ...T2.r3, (t) => { const [a, b] = T2.r3, wi = whipIn(t, a, [-1, 0]); return { a: [1080, 1920], z: lerp(1.0, 1.03, (t - a) / (b - a)), dx: wi[0] }; }, WV);
  // the rides (story D's cameras, on the new clock)
  const rideCam = (id, { snap = 1.1, push = 1.04, inDir, outDir, r0 = 0, r1 = 0, still = false, dolly = [0, 0], shake = 0, sn = 8 } = {}) => camNull(`camera · ${id}`, T2[id][0], T2[id][1], (t) => {
    const [a, b] = T2[id], u = (t - a) / (b - a), wi = inDir ? whipIn(t, a, inDir) : [0, 0], wo = outDir ? whipOut(t, b, outDir) : [0, 0];
    const z = still ? 1 : lerp(snap, 1, ramp(t, a, a + sn, easeOut)) * lerp(1, push, u);
    const k = shake * Math.exp(-(t - a) / 9), sh = [k * Math.sin(t * 2.7), k * 0.7 * Math.cos(t * 3.3)];
    return { a: [1080, 1920], z, r: lerp(r0, r1, u) + k * 0.06 * Math.sin(t * 1.9), dx: wi[0] + wo[0] + lerp(dolly[0], dolly[1], u) + sh[0], dy: wi[1] + wo[1] + sh[1] };
  }, WV);
  N.r1 = rideCam("r1", { inDir: [-1, 0], snap: 1.0, push: 1.06 });
  N.r2 = rideCam("r2", { snap: 1.12, r0: -5, r1: -2, dolly: [150, -150], sn: 12 });
  N.r4 = rideCam("r4", { snap: 1.06, sn: 14, push: 1.05, outDir: [-1, 0] });
  N.r5 = rideCam("r5", { inDir: [-1, 0], snap: 1.0, push: 1.05, r0: 0, r1: 8 });
  N.sip = rideCam("sip", { snap: 1.08, push: 1.1, r0: -4, r1: 6 });
  N.r8 = rideCam("r8", { snap: 1.25, sn: 10, push: 1.03, shake: 7 });
  N.r9 = rideCam("r9", { snap: 1.0, push: 1.07, r0: -3, r1: 2 });
  N.fount = camNull("camera · fountain", T2.fount[0], T2.end[0] + 30, (t) => ({ a: [1080, 1920], z: lerp(1.0, 1.035, ramp(t, T2.fount[0], T2.end[0] + 30, (u) => u)) }), WV);
  // the page (story px: its own null for the scroll and the whip out), as story D
  const ui = S["ui2-en"], pageDPR = 1080 / 390, SY = ui.scrollTo;
  const scrollY = (t) => SY * ramp(t, SCROLL[0], SCROLL[1], (u) => (u < 0.5 ? 16 * u ** 5 : 1 - Math.pow(-2 * u + 2, 5) / 2));
  const pageN = Cm.nul("page · scroll", { ip: OPEN, op: T2.page[1] + 1, ks: (() => { const k = bake(OPEN, T2.page[1], (t) => { const w = whipOut(t, T2.page[1], [-1, 0]), z = lerp(1, 1.035, ramp(t, SCROLL[1], T2.page[1] - 6, (u) => u)); return { p: [W / 2 + w[0], H / 2 - scrollY(t) * z + w[1]], s: [100 * z, 100 * z] }; }); return { a: [W / 2, H / 2], p: k.p, s: k.s }; })() });

  // ================= the picture, top to bottom =================
  grain(Cm, asset, { o: 30 });
  // ---------- the end (Iris's d14: the pill lands centred, the black comes under it, the settle) ----------
  drawCard(Cm, card("d14-end"), T2);
  // ---------- the words: Iris's system (d1-d13), each card gone by its last shot's cut ----------
  clip(drawCard(Cm, card("d15-portfolio"), T2), "site");
  clip(drawCard(Cm, card("d16-map"), T2), "bird");
  clip(drawCard(Cm, card("d3-knock"), T2), "steam");
  clip(drawCard(Cm, card("d4-come-in"), T2), "page");
  for (const [id, shot] of [["d5-drive", "r1"], ["d6-snoop", "r2"], ["d7-overtake", "r3"], ["d18-pass-go", "r4"], ["d9-fly-high", "r5"], ["d10-sip", "sip"], ["d11-pulled-over", "r8"], ["d12-dive", "r9"], ["d17-around", "fount"]]) clip(drawCard(Cm, card(id), T2), shot);
  // ---------- 4c (D5) · the page closes into its pill (the site's own close: the opening backwards), onto the street.
  // Its last frame (the real scroll under the Lottie stops on "Ne știm de la Steam") is the picture the pill closes on.
  {
    const ui0 = S["ui2-en"], [bx, by, bw, bh] = ui0.btnPx, R0 = bh / 2, kk = 3 * pageDPR, L1 = -(R0 + kk + 6), R1 = W + R0 + kk + 6, T3 = -48 * pageDPR, B2 = H + 48 * pageDPR;
    const d1 = Math.max(bx - L1, R1 - (bx + bw)), d2 = Math.max(by - T3, B2 - (by + bh)), cut = d1 / (d1 + d2);
    const edges = (u) => u <= cut ? { l: bx + (L1 - bx) * (u / cut), r: bx + bw + (R1 - bx - bw) * (u / cut), t: by, b: by + bh } : (() => { const f = (u - cut) / (1 - cut); return { l: L1, r: R1, t: by + (T3 - by) * f, b: by + bh + (B2 - by - bh) * f }; })();
    const [c0, c1] = CLOSE, ECL = (x) => 1 - (x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2), uOf = (t) => ECL(clamp((t - c0) / (c1 - c0)));
    const pk = []; for (let t = c0; t <= c1; t++) { const e = edges(uOf(t)); pk.push([t, roundRect((e.l + e.r) / 2, (e.t + e.b) / 2, Math.max(2, e.r - e.l), Math.max(2, e.b - e.t), R0), E.linear]); }
    pk[pk.length - 1] = [pk[pk.length - 1][0], pk[pk.length - 1][1]];
    const ringStops = [[0, "#F65342"], [0.22, "#FED012"], [0.45, "#28C840"], [0.68, "#119BFE"], [0.88, "#B098C8"], [1, "#F65342"]];
    const gs = { ty: "gs", o: prop([[c0, 0, E.linear], [c0 + 10, 100, E.hold], [c1 - 4, 100, E.linear], [c1, 0]]), w: prop(kk * 2), g: { p: ringStops.length, k: { a: 0, k: ringStops.flatMap(([q, h]) => [q, ...rgb(h).slice(0, 3)]) } }, s: prop([0, H / 2]), e: prop([W, H / 2]), t: 1, lc: 2, lj: 2, ml: 4, bm: 0, h: prop(0), a: prop(0), nm: "ring" };
    Cm.shape("close · ring", [group("ring", [shp(pk), gs])], { ip: c0, op: c1 + 1 });
    Cm.shape("close · matte", [group("pill", [shp(pk), fill(rgb("#ffffff"))])], { ip: c0, op: c1 + 1, td: true });
    const pg = img("d5-page-last", null, { ip: c0, op: c1 + 1, nm: "close · the page" }); pg.tt = 1;
    pg.ks.o = prop(bake(c0, c1, (t) => ({ o: 100 * clamp(uOf(t) / 0.25) })).o);
  }
  flicker(Cm, { amt: 3 });
  vignette(Cm, { a: 0.28, inner: 0.6, op: T2.end[0] + 30 });

  // ---------- 4b · the pill and the page (story px), as story D, with Steam's page ----------
  {
    const [bx, by, bw, bh] = ui.btnPx, R = bh / 2, k = 3 * pageDPR, L1 = -(R + k + 6), R1 = W + R + k + 6, T3 = -48 * pageDPR, B2 = H + 48 * pageDPR;
    const d1 = Math.max(bx - L1, R1 - (bx + bw)), d2 = Math.max(by - T3, B2 - (by + bh)), cut = d1 / (d1 + d2);
    const bez = (x1, y1, x2, y2) => (x) => { let t = x; for (let i = 0; i < 10; i++) { const u = 1 - t, cx = 3 * x1 * t * u * u + 3 * x2 * t * t * u + t * t * t - x, d = 3 * x1 * u * u + 6 * (x2 - x1) * t * u + 3 * (1 - x2) * t * t; if (Math.abs(cx) < 1e-6) break; if (d) t = clamp(t - cx / d); } const v = 1 - t; return 3 * y1 * t * v * v + 3 * y2 * t * t * v + t * t * t; };
    const EOPEN = bez(0.6, 0, 0.2, 1);
    const edges = (u) => u <= cut ? { l: bx + (L1 - bx) * (u / cut), r: bx + bw + (R1 - bx - bw) * (u / cut), t: by, b: by + bh } : (() => { const f = (u - cut) / (1 - cut); return { l: L1, r: R1, t: by + (T3 - by) * f, b: by + bh + (B2 - by - bh) * f }; })();
    const uOf = (t) => EOPEN(clamp((t - OPEN) / OPEND));
    const pk = []; for (let t = OPEN; t <= OPEN + OPEND; t++) { const e = edges(uOf(t)); pk.push([t, roundRect((e.l + e.r) / 2, (e.t + e.b) / 2, e.r - e.l, e.b - e.t, R), E.linear]); }
    pk[pk.length - 1] = [pk[pk.length - 1][0], pk[pk.length - 1][1]];
    const ringStops = [[0, "#F65342"], [0.22, "#FED012"], [0.45, "#28C840"], [0.68, "#119BFE"], [0.88, "#B098C8"], [1, "#F65342"]];
    const gs = { ty: "gs", o: prop([[OPEN, 100, E.hold], [OPEN + Math.round(OPEND * 0.7), 100, E.linear], [OPEN + OPEND, 0]]), w: prop(k * 2), g: { p: ringStops.length, k: { a: 0, k: ringStops.flatMap(([p, h]) => [p, ...rgb(h).slice(0, 3)]) } }, s: prop([0, H / 2]), e: prop([W, H / 2]), t: 1, lc: 2, lj: 2, ml: 4, bm: 0, h: prop(0), a: prop(0), nm: "ring" };
    Cm.shape("pill · ring", [group("ring", [shp(pk), gs])], { ip: OPEN, op: OPEN + OPEND + 1 });
    const fb = ui.frameButtons, bx0 = Math.floor(fb[0][0] * pageDPR) - 12, by1 = Math.ceil((fb[1][1] + fb[1][3]) * pageDPR) + 12;
    const btnLayer = img(`d2-ui-opened-${lang}`, null, { ip: REAL, op: CLOSE[0], nm: "page · frame buttons" });
    btnLayer.hasMask = true; btnLayer.masksProperties = [{ inv: false, mode: "a", pt: { a: 0, k: poly([[bx0, 0], [W, 0], [W, by1], [bx0, by1]]) }, o: prop(100), x: prop(0), nm: "buttons" }];
    btnLayer.ks.o = prop([[REAL, 100, E.hold], [CLOSE[0] - 4, 100, E.linear], [CLOSE[0], 0]]);
    Cm.shape("pill · matte", [group("pill", [shp(pk), fill(rgb("#ffffff"))])], { ip: OPEN, op: OPEN + OPEND + 1, td: true });
    const pg = img(`d2-ui-opened-${lang}`, null, { ip: OPEN, op: OPEN + OPEND + 1, nm: "pill · the page" });
    pg.tt = 1; pg.ks.o = prop(bake(OPEN, OPEN + OPEND, (t) => ({ o: 100 * clamp(uOf(t) / 0.33) })).o);
    img(`d2-ui-opened-${lang}`, null, { ip: OPEN + OPEND, op: REAL, nm: "page · opened" });
  }
  // ---------- 4a · Steam's place card, the site's own, rising over the facade; the knocks ----------
  {
    const [cx0, cy0, cw, ch] = ui.cardPx, [bx, by, bw, bh] = ui.btnPx, bc = [bx + bw / 2, by + bh / 2];
    KNOCK.forEach((t0, i) => { Cm.shape(`knock ring ${i}`, [group("ring", [ellipse([120, 120], [0, 0]), stroke(rgb("#ffffff"), [[t0, 8, E.out], [t0 + 20, 1]], [[t0, 95, E.linear], [t0 + 20, 0]])], { s: [[t0, [50, 50], E.out], [t0 + 20, [300, 300]]] })], { ip: t0, op: t0 + 21, ks: { p: bc } }); });
    const press = (t) => KNOCK.reduce((s, t0) => s * (1 - 0.018 * Math.sin(Math.PI * clamp((t - t0) / 8))), 1);
    const ck = bake(CARD, OPEN + OPEND, (t) => { const u = ramp(t, CARD, CARD + 26, (x) => backOut(x, 1.1)); const s = press(t) * 100; return { p: [cx0 + cw / 2, lerp(H + ch * 0.6, cy0 + ch / 2, u)], r: lerp(-4, 0, u), s: [s, s] }; });
    const cardN = Cm.nul("card", { ip: CARD, op: OPEN + OPEND + 1, ks: { a: [cw / 2, ch / 2], p: ck.p, r: ck.r, s: ck.s } });
    img("d2-ui-card", cardN, { ip: CARD, op: OPEN + OPEND + 1, p: [0, 0], nm: "card · the site's place card" });
    Cm.shape("card · shadow", [group("s", [rect([cw - 20, ch - 20], [cw / 2 + 6, ch / 2 + 28], 60), fill(rgb("#000000"), 34)])], { parent: cardN, ip: CARD, op: OPEN + OPEND + 1 });
    Cm.shape("card · dim", [group("d", [rect([W * 1.3, H * 1.3], [W / 2, H / 2]), fill(rgb("#0B0710"))])], { ip: CARD - 8, op: OPEN + OPEND + 1, ks: { o: [[CARD - 8, 0, E.linear], [CARD + 10, 46]] } });
  }

  // ---------- 7 · the fountain at night: the ride round it (story D's end), the jets frame by frame ----------
  {
    const J = S.end, [a] = T2.fount, b = T2.end[0] + 30, n0 = a + 4;
    J.pass.forEach((q, i) => { const f0 = n0 + i * 2; if (q.plate && f0 < b) img(q.plate, N.fount, { ip: f0, op: f0 + 2, nm: `fountain · ride ${i}` }); for (const [k, L] of q.lamps.entries()) { if (L[2] >= 1 || f0 >= b) continue; const g = Cm.shape(`fountain · lamp ${i}.${k}`, [glowShape(150, "#FFE6B0"), group("streak", [ellipse([900, 26], [0, 0]), gfill({ type: 2, s: [0, 0], e: [450, 0], stops: [[0, "#FFF6E0"], [1, "#FFD9A0"]], alphas: [[0, 0.7], [1, 0]] })])], { parent: N.fount, ip: f0, op: f0 + 2, ks: { p: [L[0], L[1]] } }); g.bm = 2; } });
    J.glows.forEach((g, i) => { const L = Cm.shape(`fountain · bulb ${i}`, [glowShape(g[1] < 1600 ? 46 : 70, "#FFC870", { a0: 0.8, mid: 0.4 })], { parent: N.fount, ip: a, op: b, ks: { p: [g[0], g[1]], o: 75 } }); L.bm = 2; });
    // the water: frame after frame (each blended with its neighbours: a longer shutter), there and back so it never jumps
    const Wf = S.water.frames, n = Wf.length, pp = (i) => { const m = i % (2 * n - 2); return m < n ? m : 2 * n - 2 - m; };
    for (let i = 0, f0 = a; f0 < b; i++, f0 += 2) img(Wf[pp(i)], N.fount, { ip: f0, op: Math.min(b, f0 + 2), nm: `fountain · water ${i}` });
    // a fine spray over the jets: soft motes rising and falling in the lamps' light
    const R = rng(91), box = S.water.box, motes = [];
    for (let i = 0; i < 46; i++) { const x = box[0] + R() * box[2], y = box[1] + 120 + R() * (box[3] - 300), t0 = a + Math.round(R() * 150), l = 40 + Math.round(R() * 40), r = 5 + R() * 9; motes.push(group(`m${i}`, [ellipse([r, r], [0, 0]), fill(rgb("#F4FBFF"), 60)], { p: [[t0, [x, y], E.out], [t0 + l, [x + (R() - 0.5) * 60, y - 60 - R() * 80]]], o: [[0, 0, E.hold], [t0, 0, E.linear], [t0 + 8, 100, E.linear], [t0 + l, 0]] })); }
    const sp = Cm.shape("fountain · spray", motes, { parent: N.fount, ip: a, op: b }); sp.bm = 2;
    img("d-end-L0", N.fount, { ip: a, op: b, nm: "fountain · the roundabout at night" });
  }

  // ---------- 6 · the rides (story D's plates, the new clock) ----------
  const nightGlows = (id, { r = 60, o = 70 } = {}) => S[id].glows.forEach((g, i) => { const [a, b] = T2[id]; const L = Cm.shape(`${id} · bulb ${i}`, [glowShape(r, "#FFC870", { a0: 0.8, mid: 0.4 })], { parent: N[id], ip: a, op: b, ks: { p: [g[0], g[1]], o } }); L.bm = 2; });
  const lampFlare = (id, pts, { r = 190, streak = 1100 } = {}) => pts.forEach((L, k) => { const [a, b] = T2[id]; const g = Cm.shape(`${id} · lamp ${k}`, [glowShape(r, "#FFE6B0"), group("streak", [ellipse([streak, 30], [0, 0]), gfill({ type: 2, s: [0, 0], e: [streak / 2, 0], stops: [[0, "#FFF6E0"], [1, "#FFD9A0"]], alphas: [[0, 0.75], [1, 0]] })])], { parent: N[id], ip: a, op: b, ks: { p: L, o: [[a, 0, E.linear], [a + 3, 100]] } }); g.bm = 2; });
  const ride = (id) => img(`d-${id}-ride`, N[id], { ip: T2[id][0], op: T2[id][1], nm: `${id} · the ride` });
  const plate = (id) => img(`d-${id}-L0`, N[id], { ip: T2[id][0], op: T2[id][1], nm: `${id} · plate` });
  const smearLayer = (id, inAt, outAt, dir = "h") => img(`d-${id}-w${dir}`, N[id], { ip: T2[id][0], op: T2[id][1], p: [0, 0], s: 400, o: smearO(inAt, outAt), nm: `${id} · whip smear` });
  // r9 · the sub, under water (a bit slower): light from the surface, bubbles
  {
    const id = "r9", [a, b] = T2[id];
    const rays = Cm.shape("r9 · light from above", [0, 1, 2, 3].map((k) => group(`ray ${k}`, [rect([260 + k * 60, 4200], [0, 1800]), gfill({ type: 1, s: [-150, 0], e: [150, 0], stops: [[0, "#CFFBFF"], [0.5, "#E9FFFF"], [1, "#CFFBFF"]], alphas: [[0, 0], [0.5, 0.28], [1, 0]] })], { p: [400 + k * 480, -200], r: -14 + k * 6 })), { parent: N[id], ip: a, op: b, ks: { o: [[a, 60, E.linear], [b, 90]] } });
    rays.bm = 2;
    const R = rng(21), bub = [];
    for (let i = 0; i < 26; i++) { const x = 300 + R() * 1600, y = 2600 + R() * 1200, r = 8 + R() * 22, d = 300 + R() * 500, t0 = a + Math.round(R() * 10); bub.push(group(`b${i}`, [ellipse([r * 2, r * 2], [0, 0]), stroke(rgb("#E8FDFF"), 3, 80), fill(rgb("#E8FDFF"), 18)], { p: [[t0, [x, y], E.linear], [b, [x + (R() - 0.5) * 80, y - d]]] })); }
    Cm.shape("r9 · bubbles", bub, { parent: N[id], ip: a, op: b });
    ride(id); plate(id);
  }
  // r8 · the patrol (slower): its roof lamps red, blue (the map's 190 ms beat), the washes
  {
    const id = "r8", [a, b] = T2[id], beat = (t) => Math.floor(((t - a) * 1000) / 60 / 190) % 2;
    ["red", "blue"].forEach((col, k) => {
      const L = img(`d-${id}-beacon-${k}`, N[id], { ip: a, op: b, nm: `r8 · lamp ${col}` }); L.ks.o = prop(holdKeys(a, b, (t) => (beat(t) === k ? 100 : 0)));
      const w = Cm.shape(`r8 · wash ${col}`, [group("w", [rect([3000, 4200], [1080, 1920]), gfill({ type: 2, s: [k ? 1500 : 660, 900], e: [k ? 3300 : -1100, 900], stops: [[0, k ? "#3D7BFF" : "#FF3B4E"], [1, k ? "#3D7BFF" : "#FF3B4E"]], alphas: [[0, 0.55], [1, 0]] })])], { parent: N[id], ip: a, op: b, ks: { o: holdKeys(a, b, (t) => (beat(t) === k ? 100 : 0)) } });
      w.bm = 2;
    });
    lampFlare(id, [[216, 1624], [1448, 1624]], { r: 150, streak: 900 });
    ride(id); nightGlows(id, { r: 50 }); plate(id);
  }
  // sip · the F1 through the Two Minutes corner from above, at night (story C's corner plate, the F1 frame by frame)
  {
    const id = "sip", [a, b] = T2[id], list = S.sip.rides; let last = null;
    // (D5: slower: D4's frames stretched over the longer shot, a slow motion)
    const nOut = Math.floor((b - a) / 2), idx = (k) => Math.min(list.length - 1, Math.floor((k * list.length) / nOut));
    for (let k = 0; k < nOut; k++) { const f0 = a + k * 2, q = list[idx(k)]; if (q) img(q, N[id], { ip: f0, op: Math.min(b, f0 + 2), nm: `sip · F1 ${k}` }); }
    img("d2-sip-L0", N[id], { ip: a, op: b, nm: "sip · plate" });
  }
  // r5 · the Cropduster climbing away (Fly high.): it rises up the frame and away, smaller, into the stars
  {
    const id = "r5", [a, b] = T2[id], sp = S[id].sprites.ride, m = P.plates[`d-${id}-ride`];
    const pn = Cm.nul("r5 · plane", { parent: N[id], ip: a, op: b + 1, ks: (() => { const k = bake(a, b, (t) => { const u = (t - a) / (b - a), s = lerp(0.95, 0.32, easeOut(u)); return { p: [lerp(1180, 1060, u), lerp(3600, 700, easeOut(u))], s: [100 * s, 100 * s], r: lerp(-14, -4, u) }; }); return { a: [0, 0], p: k.p, s: k.s, r: k.r }; })() });
    img(`d-${id}-ride`, pn, { ip: a, op: b, p: [m.x - sp.c[0], m.y - sp.c[1]], nm: "r5 · the plane" });
    const R = rng(55), st = []; for (let i = 0; i < 70; i++) st.push(group(`s${i}`, [ellipse([3 + R() * 5, 3 + R() * 5], [R() * 2160, R() * 2600]), fill(rgb("#FFFFFF"), 40 + R() * 50)]));
    Cm.shape("r5 · stars", st, { parent: N[id], ip: a, op: b });
    smearLayer(id, a, null); plate(id);
  }
  // r4 · the chrome racer under the Court's lights (Pass Go., slower)
  // (D5: The Aesthetic Court as the one-day pop-up, Ilinca's TASK-114: the plate with the racer in it, a slow push)
  { const id = "r4"; img("d5-r4-L0", N[id], { ip: T2[id][0], op: T2[id][1], nm: "r4 · the pop-up, the racer" }); }
  // r3 · Overtake. (v3): head on down Fintech Boulevard at night, the yellow ride steady, the F1 up behind it, out and
  // past it: each car frame by frame, the nearer one on top in each frame
  {
    const id = "r3", [a, b] = T2[id], OV = S.overtake, dz = (t, car) => SH3.overtake.cam.pos[2] - SH3.overtake[car](t).z;
    // (D5: slower: D4's frames stretched over the longer shot)
    const nOut = Math.floor((b - a) / 2), nIn = OV.dacia1300.length;
    for (let k = 0; k < nOut; k++) {
      const i = Math.min(nIn - 1, Math.floor((k * nIn) / nOut)), f0 = a + k * 2, t = i / 30, cars = [["f1", OV.f1[i]], ["dacia", OV.dacia1300[i]]].filter((c) => c[1]);
      // (drawn first = on top: the nearer car first)
      cars.sort((p1, p2) => dz(t, p1[0]) - dz(t, p2[0]));
      for (const [c, nm] of cars) img(nm, N[id], { ip: f0, op: Math.min(b, f0 + 2), nm: `overtake · ${c} ${k}` });
    }
    // the lamps' glow on the road ahead of each car (screen, soft)
    img("d3-overtake-L0", N[id], { ip: a, op: b, nm: "overtake · plate" });
  }
  // r2 · the Mystery van at the roundabout (Snoop., slower)
  { const id = "r2"; lampFlare(id, [[2056, 1712]], { r: 170, streak: 900 }); ride(id); nightGlows(id, { r: 55 }); plate(id); }
  // r1 · the yellow Dacia, from the bumper (Drive.)
  { const id = "r1", [a] = T2[id]; lampFlare(id, [[160, 1800], [1096, 1800]], { r: 200, streak: 1300 }); ride(id); nightGlows(id, { r: 55, o: 80 }); smearLayer(id, a, null); plate(id); }

  // ---------- 2-3 (D5) · the city from high: the map's pins on their places, three place cards opening one after
  // another; then the move down to Steam: the pins go as the camera falls (Steam's last). In story px: the renders'
  // numbers are at 2x.
  pinsAndCards();
  Cm.shape("ground", [group("g", [rect([W * 1.4, H * 1.4], [W / 2, H / 2]), fill(rgb("#0B0A12"))])], { ip: T2.r1[0], op: F });
  const j = Cm.json(); j.cromatic = { story: "D5 (Daniel's notes on D4)", lang, dur: DUR, cuts: T2, bg: BG };
  return j;
}

const j = story(), s = JSON.stringify(j);
fs.writeFileSync(path.join(OUT, "story-d5-en.json"), s);
console.table({ "story-d5-en": { kb: +(s.length / 1024).toFixed(1), layers: j.layers.length, frames: j.op, images: j.assets.length } });
