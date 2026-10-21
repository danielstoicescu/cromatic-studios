// Cromatic · stories · the cards as Lottie layers (Iris, TASK-065d), for the story builds (60 fps comps).
//   import { loadCards, drawCard } from "../../cards/cards.mjs";
//   const K = await loadCards();                       // the specs (json/*.json) and the house face
//   drawCard(Cm, K.card("c3-coffee"), T);              // T: the story's shot spans at 60 fps (buildC4's T, buildA5's SP)
// Each card's cues ("steam+4", "berero.end-6", in 30 fps frames) are resolved against the spans passed in, so a retimed
// story moves its cards with it. Call drawCard where the old words were drawn (over the shots, under the grain and the
// black end). The layers come out in the order Cm.shape adds them (on top first). A card's "behindRide" block (SLOW)
// is returned in .behind: splice those layers under the ride, as v4 does.
// Only transforms and opacity move. One text colour per card (spec.textColour); the pill and the aplat are objects.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { group, rect, ellipse, fill, stroke, rgb, E, prop, path as shp, poly, roundRect, pathProp, clean, letterGroup } from "../../lottie-ui/_source/lib/ui.mjs";
import { loadType, setLine } from "../../intro-lottie/_source/lib/type.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
export const EXPO = [0.16, 1, 0.3, 1], SNAP = [0.7, 0, 0.84, 0], BOUNCE = [0.34, 1.56, 0.64, 1], GLIDE = [0.65, 0, 0.35, 1];

export async function loadCards(dir = path.join(here, "json")) {
  const T = await loadType();
  const cards = fs.readdirSync(dir).filter((f) => f.endsWith(".json") && f !== "tokens.json").map((f) => JSON.parse(fs.readFileSync(path.join(dir, f), "utf8")));
  const tokens = JSON.parse(fs.readFileSync(path.join(dir, "tokens.json"), "utf8"));
  return { T, cards, tokens, card: (id) => { const c = cards.find((x) => x.id === id); if (!c) throw new Error("no card " + id); c.__T = T; return c; } };
}

// "steam+4" | "berero.end-6" | "end+0" -> a frame at 60 fps on the spans T (60 fps)
export function cue(s, T60) {
  const m = /^([a-z0-9_]+)(\.end)?([+-]\d+)$/i.exec(s);
  if (!m) throw new Error("cue " + s);
  const span = T60[m[1]]; if (!span) throw new Error("no shot " + m[1]);
  return (m[2] ? span[1] : span[0]) + 2 * +m[3];
}
const keys = (k) => { const c = clean(k); return c.length > 1 ? c : c[0][1]; };

/* ---------- a line: its letters rise out of the baseline (a mask), and go up out of it ---------- */
function line(Cm, T, L, { tIn, tOut, parent, smash = false, nm }) {
  const S = L.size, lt = setLine(T, L.text, S, L.tracking), n = lt.letters.length, up = 1.08 * S;
  const st = 1.2, dur = 24, outDur = 14, outSt = 0.7;
  const groups = lt.letters.map((l, j) => letterGroup(T, { ...l, x: L.x + l.x }, S, rgb(L.ink), {
    extra: (b, s) => {
      const at = [b[0], b[1] + L.baseline];
      if (smash) return { p: at, s: [s, s] };
      const ti = tIn + Math.round(j * st), to = tOut + Math.round(j * outSt);
      return { p: [[ti, [at[0], at[1] + up], EXPO], [ti + dur, at, E.hold], [to, at, SNAP], [to + outDur, [at[0], at[1] - up]]], s: [s, s], o: [[0, 0, E.hold], [ti, 100, E.hold], [to + outDur, 0]] };
    }
  }));
  const top = L.baseline - 1.0 * S, bot = L.baseline + 0.3 * S, pad = 0.25 * S;
  const masks = smash ? undefined : [{ inv: false, mode: "a", pt: pathProp(poly([[L.x - pad, top], [L.x + L.width + pad, top], [L.x + L.width + pad, bot], [L.x - pad, bot]])), o: prop(100), x: prop(0), nm: "baseline" }];
  const op = smash ? tOut : tOut + Math.round(n * outSt) + outDur + 1;
  return Cm.shape(nm, groups, { parent, ip: tIn, op, masks });
}

/* ---------- the word in a pill: one state, or a swap (the width rolls, the words rise through it) ---------- */
function pill(Cm, T, L, { tIn, swaps = [], tOut, parent, nm }) {
  const P = L.pill, S = L.size, st = P.states, h = P.h, left = P.left, cy = P.cy;
  const at = [tIn, ...swaps];
  // size and centre per state (the left edge stays)
  const sK = [[tIn, [st[0].w * 0.6, h * 0.6], BOUNCE], [tIn + 20, [st[0].w, h], E.hold]], pK = [[tIn, [left + st[0].w / 2, cy], E.hold]];
  swaps.forEach((t, k) => { const a = st[k], b = st[k + 1]; sK.push([t - 2, [a.w, h], EXPO], [t + 14, [b.w, h], E.hold]); pK.push([t - 2, [left + a.w / 2, cy], EXPO], [t + 14, [left + b.w / 2, cy], E.hold]); });
  const last = st[swaps.length];
  sK.push([tOut, [last.w, h], SNAP], [tOut + 12, [last.w * 0.6, h * 0.6]]);
  const pAt = (t) => { let v = pK[0][1]; for (const k of pK) if (k[0] <= t) v = k[1]; return v; };
  const maskK = sK.map(([t, sz, e]) => [t, roundRect(pAt(t)[0], pAt(t)[1], sz[0], sz[1], sz[1] / 2), e]);
  const rot = { a: [left, cy], p: [left, cy], r: [[tIn, P.tilt - 6, BOUNCE], [tIn + 20, P.tilt]] };
  // the words: each in at its state, out at the next (or at the end), inside the pill
  const words = st.map((q, k) => {
    const t0 = at[k], t1 = k < swaps.length ? swaps[k] - 2 : tOut, lt = setLine(T, q.word, S, L.tracking);
    return group(q.word, lt.letters.map((l, j) => letterGroup(T, { ...l, x: P.wordX + l.x }, S, rgb(P.ink), { extra: (b, s) => {
      const p0 = [b[0], b[1] + L.baseline], ti = t0 + (k ? 2 : 6) + j, to = t1 + Math.round(j * 0.5);
      return { p: [[ti, [p0[0], p0[1] + 0.7 * S], EXPO], [ti + 16, p0, E.hold], [to, p0, SNAP], [to + 10, [p0[0], p0[1] - 0.7 * S]]], s: [s, s], o: [[0, 0, E.hold], [ti, 100, E.hold], [to + 10, 0]] };
    } })));
  });
  const op = tOut + 14;
  Cm.shape(`${nm} · words`, words, { parent, ip: tIn, op, ks: rot, masks: [{ inv: false, mode: "a", pt: pathProp(clean(maskK)), o: prop(100), x: prop(0), nm: "pill" }] });
  Cm.shape(`${nm} · pill`, [
    group("pill", [rect(keys(sK), keys(pK), 9999), stroke(rgb("#0D0C09"), P.keyline), fill(rgb(P.fill))]),
    group("shadow", [rect(keys(sK), keys(pK), 9999), fill(rgb("#0D0C09"))], { p: P.shadow })
  ], { parent, ip: tIn, op, ks: rot });
}

/* ---------- the aplat: a null carries the card (its tilt, its swing in, its moves); the block under the words ---------- */
function aplatCard(Cm, A, { tIn, tOut, moves = [], swaps = [], nm }) {
  const s0 = A.states[0], piv = [s0.x, s0.y];
  const offAt = (k) => { const m = moves.filter((q) => q.state <= k).pop(); return m ? m.offset : [0, 0]; };
  const pK = [[tIn, [piv[0], piv[1] - 24], BOUNCE], [tIn + 28, piv, E.hold]];
  for (const m of moves) { const t = swaps[m.state - 1]; pK.push([t - 2, [piv[0] + offAt(m.state - 1)[0], piv[1] + offAt(m.state - 1)[1]], GLIDE], [t + 22, [piv[0] + m.offset[0], piv[1] + m.offset[1]], E.hold]); }
  pK.push([tOut + 6, pK[pK.length - 1][1]]);
  const card = Cm.nul(`${nm} · card`, { ip: tIn, op: tOut + 30, ks: { a: piv, p: keys(pK), r: [[tIn, A.tilt - 5, BOUNCE], [tIn + 28, A.tilt]], s: [[tIn, [92, 92], BOUNCE], [tIn + 28, [100, 100], E.hold], [tOut + 6, [100, 100], SNAP], [tOut + 26, [0, 0]]] } });
  // the block's size per state (the words' widest, plus the padding)
  const sz = [[tIn, [s0.w, s0.h], E.hold]], ct = [[tIn, [s0.x + s0.w / 2, s0.y + s0.h / 2], E.hold]];
  swaps.forEach((t, k) => { const a = A.states[Math.min(k, A.states.length - 1)], b = A.states[Math.min(k + 1, A.states.length - 1)]; sz.push([t - 2, [a.w, a.h], EXPO], [t + 14, [b.w, b.h], E.hold]); ct.push([t - 2, [a.x + a.w / 2, a.y + a.h / 2], EXPO], [t + 14, [b.x + b.w / 2, b.y + b.h / 2], E.hold]); });
  return { card, draw: () => Cm.shape(`${nm} · aplat`, [
    group("block", [rect(keys(sz), keys(ct), A.radius), stroke(rgb("#0D0C09"), A.keyline), fill(rgb(A.fill))]),
    group("shadow", [rect(keys(sz), keys(ct), A.radius), fill(rgb("#0D0C09"))], { p: A.shadow })
  ], { parent: card, ip: tIn, op: tOut + 30, ks: { o: [[tIn, 0, E.linear], [tIn + 6, 100]] } }) };
}

/* ---------- a map tag: lands on its pointer ---------- */
function tag(Cm, T, G, { tIn, tOut, nm }) {
  const lt = setLine(T, G.text, G.size, G.tracking), pl = G.plate, d = G.dot, po = G.pointer, ink = rgb("#0D0C09");
  // the pointer joins the plate: its fill covers the plate's keyline, its two sides are drawn on top
  const tri = (dx, dy) => poly([[po.x - po.w / 2 + dx, po.y - pl.keyline + dy], [po.x + po.w / 2 + dx, po.y - pl.keyline + dy], [po.x + dx, po.y + po.h + dy]]);
  const sides = poly([[po.x - po.w / 2, po.y], [po.x, po.y + po.h], [po.x + po.w / 2, po.y]], false);
  Cm.shape(nm, [
    group("text", lt.letters.map((l) => letterGroup(T, { ...l, x: G.textX + l.x }, G.size, rgb(G.ink), { extra: (b, s) => ({ p: [b[0], b[1] + G.baseline], s: [s, s] }) }))),
    group("dot", [ellipse([d.d, d.d], [d.cx, d.cy]), stroke(ink, d.keyline), fill(rgb(d.fill))]),
    group("pointer · sides", [shp(sides), stroke(ink, pl.keyline, 100, { lc: 2, lj: 2 })]),
    group("pointer", [shp(tri(0, 0)), fill(rgb(pl.fill))]),
    group("plate", [rect([pl.w, pl.h], [pl.x + pl.w / 2, pl.y + pl.h / 2], pl.r), stroke(ink, pl.keyline), fill(rgb(pl.fill))]),
    group("shadow", [rect([pl.w, pl.h], [pl.x + pl.w / 2 + pl.shadow[0], pl.y + pl.h / 2 + pl.shadow[1]], pl.r), shp(tri(pl.shadow[0], pl.shadow[1])), fill(ink)])
  ], { ip: tIn, op: tOut + 14, ks: { a: po.tip, p: po.tip, s: [[tIn, [40, 40], BOUNCE], [tIn + 18, [100, 100], E.hold], [tOut, [100, 100], SNAP], [tOut + 12, [0, 0]]], o: [[tIn, 0, E.linear], [tIn + 4, 100]] } });
}

/* ---------- cromaticstudios.com: in with the house bounce, then (on black) the soft settle ---------- */
function url(Cm, T, U, { tIn, settle, tEnd, nm = "cromaticstudios.com" }) {
  const lt = setLine(T, U.text, U.size, U.tracking), [x, y] = U.centre;
  const ks = {
    a: [x, y], p: [[tIn, [x, y + 260], [0.2, 1.25, 0.3, 1]], [tIn + 22, [x, y]]],
    r: settle != null ? [[tIn, U.tilt - 18, [0.2, 1.4, 0.3, 1]], [tIn + 26, U.tilt, E.hold], [settle, U.tilt, GLIDE], [settle + 60, U.tilt + 2]] : [[tIn, U.tilt - 18, [0.2, 1.4, 0.3, 1]], [tIn + 26, U.tilt]],
    s: [[tIn, [70, 70], E.spring], [tIn + 20, [104, 96], E.inOut], [tIn + 30, [98, 102], E.inOut], [tIn + 40, [100, 100], ...(settle != null ? [E.hold] : [])], ...(settle != null ? [[settle, [100, 100], GLIDE], [settle + 60, [104, 104]]] : [])]
  };
  return Cm.shape(nm, [
    group("text", lt.letters.map((l) => letterGroup(T, { ...l, x: U.textX + l.x }, U.size, rgb(U.ink), { extra: (b, s) => ({ p: [b[0], b[1] + U.baseline], s: [s, s] }) }))),
    group("pill", [rect([U.w, U.h], [x, y], 9999), stroke(rgb("#0D0C09"), U.keyline), fill(rgb(U.fill))]),
    group("shadow", [rect([U.w, U.h], [x + U.shadow[0], y + U.shadow[1]], 9999), fill(rgb("#0D0C09"))])
  ], { ip: tIn, op: tEnd, ks });
}

/* ---------- a card ---------- */
// T60: the story's shot spans at 60 fps. opts.black: also draw the end's black (under the pill) for url cards
export function drawCard(Cm, spec, T60, { T = spec.__T, black = true } = {}) {
  if (!T) throw new Error("drawCard: pass { T } (loadCards().T)");
  const tm = spec.timing.cues, c = (k) => cue(k, T60), out = { layers: [], behind: [] }, n0 = Cm.layers.length;
  const swaps = (tm.swaps || []).map(c), tOut = tm.out ? c(tm.out) : null;
  // the pill line of the end: cromaticstudios.com (A: in over the site; C: in after "Drive it for yourself.", kept on black)
  if (spec.layout.url && !spec.layout.url.continues) {
    const tEnd = c(tm.out || "end.end-0"), cont = spec.continuedBy ? c(spec.continuedBy.out) : tEnd;
    const settle = spec.continuedBy ? c(spec.continuedBy.settle) : tm.settle ? c(tm.settle) : null;
    url(Cm, T, spec.layout.url, { tIn: c(tm.urlIn), settle, tEnd: Math.max(tEnd, cont) });
    if (black) { const b0 = spec.continuedBy ? c(spec.continuedBy.black) : tm.black ? c(tm.black) : null; if (b0 != null) Cm.shape(`${spec.id} · black`, [group("b", [rect([1120, 1960], [540, 960]), fill(rgb("#000000"))])], { ip: b0, op: Math.max(tEnd, cont), ks: { o: [[b0, 0, E.inOut], [b0 + 22, 100]] } }); }
  }
  for (const G of spec.layout.tags || []) tag(Cm, T, G, { tIn: c(tm.in), tOut, nm: `${spec.id} · ${G.text}` });
  (spec.layout.blocks || []).forEach((B, bi) => {
    const tIn = c(tm.in) + 2 * (tm.blockStagger || 0) * bi, smash = (tm.smash || []).includes(B.id);
    const nB = Cm.layers.length;
    let parent, ap;
    if (B.aplat) { ap = aplatCard(Cm, B.aplat, { tIn, tOut, swaps, moves: spec.layout.moves || [], nm: B.id }); parent = ap.card; }
    B.lines.forEach((L, i) => {
      const ti = tIn + 2 * (tm.lineStagger || 0) * i + (B.aplat ? 8 : 0), to = smash ? tOut : tOut - 2 * (B.lines.length - 1 - i);
      if (L.text) line(Cm, T, L, { tIn: smash ? tIn : ti, tOut: to, parent, smash, nm: `${B.id} · ${L.text}` });
      if (L.pill) pill(Cm, T, L, { tIn: tm.pillIn ? c(tm.pillIn) : ti + 8, swaps, tOut: to, parent, nm: `${B.id} · pill` });
    });
    if (ap) ap.draw();
    if (B.behindRide) out.behind.push(...Cm.layers.slice(nB));
  });
  out.layers = Cm.layers.slice(n0).filter((L) => !out.behind.includes(L));
  return out;
}

// move layers drawCard made (e.g. .behind, SLOW) to just above the layer named nm (under it in the stack: the ride)
export function moveLayers(Cm, layers, nm) {
  for (const L of layers) Cm.layers.splice(Cm.layers.indexOf(L), 1);
  const i = Cm.layers.findIndex((l) => l.nm === nm); if (i < 0) throw new Error("no layer " + nm);
  Cm.layers.splice(i, 0, ...layers);
}
