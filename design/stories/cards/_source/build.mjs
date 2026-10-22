// Cromatic · stories · the cards (Iris, TASK-065d): defs.mjs -> json/<card>.json (the spec: every position, size and
// colour, the cues and the frames on each clock), svg/outlined/<card>[-state].svg (the words as paths, the house
// face's own outlines and kerning) and svg/live/<card>[-state].svg (the same as live text), json/tokens.json.
//   node build.mjs        (from design/stories/cards/_source; the type libraries from design/node_modules)
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { TOKENS, W, H, type, setText, layBlock, layTag, layUrl } from "./system.mjs";
import { CARDS, CLOCKS } from "./defs.mjs";

const here = path.dirname(fileURLToPath(import.meta.url)), OUT = path.resolve(here, "..");
const T = await type();
for (const d of ["json", "svg/outlined", "svg/live"]) fs.mkdirSync(path.join(OUT, d), { recursive: true });
const HEX = (k) => TOKENS.colour[k] || k;

/* ---------- cues -> frames ---------- */
function cue30(s, clock) {
  const m = /^([a-z0-9_]+)(\.end)?([+-]\d+)$/i.exec(s); const sp = clock[m[1]];
  if (!sp) return null;
  return (m[2] ? sp[1] : sp[0]) + +m[3];
}
function frames(card, clockName) {
  const clock = CLOCKS[clockName], tm = card.timing.cues, c = (k) => (k ? cue30(k, clock) : null), out = { clock: clockName, fps: 30, elements: [] };
  const tOut = c(tm.out);
  for (const B of card.layout.blocks || []) {
    const bi = card.layout.blocks.indexOf(B), tIn = c(tm.in) + (tm.blockStagger || 0) * bi, smash = (tm.smash || []).includes(B.id);
    if (B.aplat) out.elements.push({ id: B.id + "-aplat", in: tIn, out: tOut + 9, frames: { in: TOKENS.motion.aplatIn.frames, out: 7 }, hold: tOut + 2 - tIn - 14 });
    B.lines.forEach((L, i) => {
      const ti = tIn + (tm.lineStagger || 0) * i + (B.aplat ? 4 : 0), to = smash ? tOut : tOut - (B.lines.length - 1 - i);
      if (L.text) out.elements.push({ id: L.id, text: L.text, in: ti, out: to, motion: smash ? "smashCut" : "lineIn / lineOut", hold: to - ti - (smash ? 0 : TOKENS.motion.lineIn.frames) });
      if (L.pill) {
        const pin = tm.pillIn ? c(tm.pillIn) : ti + 4, sw = (tm.swaps || []).map(c), at = [pin, ...sw];
        L.pill.states.forEach((q, k) => out.elements.push({ id: `${L.pill.id}-${k}`, word: q.word, in: at[k], out: k < sw.length ? sw[k] : to, motion: k ? "pillSwap" : "pillIn", hold: (k < sw.length ? sw[k] : to) - at[k] }));
      }
    });
  }
  for (const G of card.layout.tags || []) out.elements.push({ id: G.id, text: G.text, in: c(tm.in), out: tOut, motion: "tagIn / tagOut", hold: tOut - c(tm.in) - TOKENS.motion.tagIn.frames });
  if (card.layout.url && !card.layout.url.continues) { const cb = card.continuedBy || {}; out.elements.push({ id: "url", text: TOKENS.url.text, in: c(tm.urlIn), black: c(tm.black || cb.black), settle: c(tm.settle || cb.settle), out: c(cb.out || (card.layout.black ? tm.out : null) || "end.end-0"), motion: "urlIn, then urlSettle on black" }); }
  if (card.layout.url && card.layout.url.continues) out.elements.push({ id: "url (continued from " + card.layout.url.continues + ")", black: c(tm.black), settle: c(tm.settle), out: c(tm.out) });
  return out;
}

/* ---------- SVG ---------- */
const f1 = (v) => Math.round(v * 10) / 10;
const glyphs = (text, size, tracking, x, base) => {
  const { letters } = setText(text, { size, tracking });
  // (the glyph's own commands, scaled here: opentype's toPathData writes NaN for some offsets)
  const k = size / T.upm, X = (v, x0) => f1(x0 + v * k), Y = (v) => f1(base - v * k);
  return letters.map((l) => T.glyphOf(l.ch).g.path.commands.map((c) => { const x0 = x + l.x;
    if (c.type === "M" || c.type === "L") return `${c.type}${X(c.x, x0)} ${Y(c.y)}`;
    if (c.type === "Q") return `Q${X(c.x1, x0)} ${Y(c.y1)} ${X(c.x, x0)} ${Y(c.y)}`;
    if (c.type === "C") return `C${X(c.x1, x0)} ${Y(c.y1)} ${X(c.x2, x0)} ${Y(c.y2)} ${X(c.x, x0)} ${Y(c.y)}`;
    return "Z"; }).join("")).join("");
};
const esc = (s) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;");
function words(mode, text, size, tracking, x, base, ink, id) {
  if (mode === "paths") return `<path id="${id}" d="${glyphs(text, size, tracking, x, base)}" fill="${ink}"/>`;
  return `<text id="${id}" x="${f1(x)}" y="${f1(base)}" font-family="'Google Sans', CromaticSans, sans-serif" font-weight="600" font-size="${size}" letter-spacing="${f1(tracking * size)}" fill="${ink}">${esc(text)}</text>`;
}
const INK = TOKENS.colour.ink;
function pillSvg(mode, L, k) {
  const P = L.pill, q = P.states[k], x = P.left, y = P.cy - P.h / 2;
  return `<g id="${P.id}" transform="rotate(${P.tilt} ${f1(x)} ${f1(P.cy)})">` +
    `<rect id="${P.id}-shadow" x="${f1(x + P.shadow[0])}" y="${f1(y + P.shadow[1])}" width="${q.w}" height="${P.h}" rx="${P.h / 2}" fill="${INK}"/>` +
    `<rect id="${P.id}-body" x="${f1(x)}" y="${f1(y)}" width="${q.w}" height="${P.h}" rx="${P.h / 2}" fill="${P.fills ? P.fills[k] : P.fill}" stroke="${INK}" stroke-width="${P.keyline}"/>` +
    words(mode, q.word, L.size, L.tracking, P.wordX, L.baseline, P.ink, `${P.id}-word`) + `</g>`;
}
function blockSvg(mode, B, k, offset = [0, 0]) {
  let s = "";
  const lines = B.lines.map((L) => (L.text ? words(mode, L.text, L.size, L.tracking, L.x, L.baseline, L.ink, L.id) : "") + (L.pill ? pillSvg(mode, L, Math.min(k, L.pill.states.length - 1)) : "")).join("");
  if (B.aplat) {
    const A = B.aplat, a = A.states[Math.min(k, A.states.length - 1)], piv = A.states[0];
    s += `<g id="${B.id}-card" transform="translate(${f1(offset[0])} ${f1(offset[1])}) rotate(${A.tilt} ${f1(piv.x)} ${f1(piv.y)})">` +
      `<rect id="${B.id}-aplat-shadow" x="${f1(a.x + A.shadow[0])}" y="${f1(a.y + A.shadow[1])}" width="${a.w}" height="${a.h}" rx="${A.radius}" fill="${INK}"/>` +
      `<rect id="${B.id}-aplat" x="${a.x}" y="${a.y}" width="${a.w}" height="${a.h}" rx="${A.radius}" fill="${A.fill}" stroke="${INK}" stroke-width="${A.keyline}"/>` + lines + `</g>`;
  } else s += `<g id="${B.id}"${offset[0] || offset[1] ? ` transform="translate(${f1(offset[0])} ${f1(offset[1])})"` : ""}>${lines}</g>`;
  return s;
}
function tagSvg(mode, G) {
  const p = G.plate, d = G.dot, po = G.pointer, tri = (dx, dy) => `M${f1(po.x - po.w / 2 + dx)} ${f1(po.y - p.keyline + dy)}L${f1(po.x + dx)} ${f1(po.y + po.h + dy)}L${f1(po.x + po.w / 2 + dx)} ${f1(po.y - p.keyline + dy)}Z`;
  const side = `M${f1(po.x - po.w / 2)} ${f1(po.y)}L${f1(po.x)} ${f1(po.y + po.h)}L${f1(po.x + po.w / 2)} ${f1(po.y)}`;
  return `<g id="${G.id}">` +
    `<g id="${G.id}-shadow" fill="${INK}"><rect x="${f1(p.x + p.shadow[0])}" y="${f1(p.y + p.shadow[1])}" width="${p.w}" height="${p.h}" rx="${p.r}"/><path d="${tri(p.shadow[0], p.shadow[1])}"/></g>` +
    `<rect id="${G.id}-plate" x="${p.x}" y="${p.y}" width="${p.w}" height="${p.h}" rx="${p.r}" fill="${p.fill}" stroke="${INK}" stroke-width="${p.keyline}"/>` +
    `<path id="${G.id}-pointer" d="${tri(0, 0)}" fill="${p.fill}"/><path d="${side}" fill="none" stroke="${INK}" stroke-width="${p.keyline}" stroke-linejoin="round"/>` +
    `<circle id="${G.id}-dot" cx="${d.cx}" cy="${d.cy}" r="${d.d / 2}" fill="${d.fill}" stroke="${INK}" stroke-width="${d.keyline}"/>` +
    words(mode, G.text, G.size, G.tracking, G.textX, G.baseline, G.ink, `${G.id}-text`) + `</g>`;
}
function urlSvg(mode, U) {
  const [x, y] = U.centre;
  return `<g id="url" transform="rotate(${U.tilt} ${x} ${y})">` +
    `<rect id="url-shadow" x="${f1(x - U.w / 2 + U.shadow[0])}" y="${f1(y - U.h / 2 + U.shadow[1])}" width="${U.w}" height="${U.h}" rx="${U.h / 2}" fill="${INK}"/>` +
    `<rect id="url-body" x="${f1(x - U.w / 2)}" y="${f1(y - U.h / 2)}" width="${U.w}" height="${U.h}" rx="${U.h / 2}" fill="${U.fill}" stroke="${INK}" stroke-width="${U.keyline}"/>` +
    words(mode, U.text, U.size, U.tracking, U.textX, U.baseline, U.ink, "url-text") + `</g>`;
}
export function svg(card, k, mode, { bg } = {}) {
  const L = card.layout, off = (L.moves || []).filter((m) => m.state <= k).pop()?.offset || [0, 0];
  let body = "";
  if (bg) body += `<rect width="${W}" height="${H}" fill="${bg}"/>`;
  if (L.black) body += `<rect id="black" width="${W}" height="${H}" fill="#000000"/>`;
  if (L.url) body += urlSvg(mode, L.url);
  for (const G of L.tags || []) body += tagSvg(mode, G);
  for (const B of L.blocks || []) body += blockSvg(mode, B, k, off);
  const font = mode === "text" ? `<defs><style>@font-face{font-family:'Google Sans';font-weight:600;src:local('Google Sans'),url('../../../../../site/fonts/google-sans-latin.woff2') format('woff2')}</style></defs>` : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><title>${esc(card.id)} · ${esc(card.states[k].label)}</title>${font}${body}</svg>\n`;
}

/* ---------- the cards ---------- */
export function layout(def) {
  const ink = HEX(def.ink);
  const L = {};
  if (def.blocks) {
    L.blocks = [];
    for (const b of def.blocks) {
      let bd = b;
      if (b.attach) {
        // a block pinned to another: its pill's top at the other's bottom + gap (negative: it overlaps), x = its left + dx
        const tg = L.blocks.find((q) => q.id === b.attach.to), P = TOKENS.pill, S = TOKENS.type[b.lines[0].style].size;
        const bottom = tg.aplat ? tg.aplat.states[0].y + tg.aplat.states[0].h : Math.max(...tg.lines.map((l) => l.box.y + l.box.h));
        const left = tg.aplat ? tg.aplat.states[0].x : Math.min(...tg.lines.map((l) => l.x));
        const pillTop = bottom + b.attach.gap, cap = (S * T.cap) / T.upm;
        bd = { ...b, place: { x: left + b.attach.dx, align: "left", top: pillTop + (P.height / 2 + P.centreFromBaseline) * S - cap } };
      }
      L.blocks.push({ ...layBlock(bd, ink), behindRide: !!b.behindRide, ...(b.attach ? { attach: b.attach } : {}) });
    }
  }
  if (def.tags) L.tags = def.tags.map(layTag);
  if (def.url) { L.url = layUrl(); if (def.url.continues) L.url.continues = def.url.continues; }
  if (def.id.endsWith("end")) L.black = true;
  // a move: everything on the card (blocks, aplat, pills) goes together; the offset centres their union in state k
  if (def.moves) L.moves = def.moves.map((m) => {
    const k = m.state, bx = [];
    for (const B of L.blocks) {
      if (B.aplat) { const a = B.aplat.states[Math.min(k, B.aplat.states.length - 1)]; bx.push([a.x, a.y, a.x + a.w, a.y + a.h]); }
      for (const l of B.lines) {
        if (l.text) bx.push([l.box.x, l.box.y, l.box.x + l.box.w, l.box.y + l.box.h]);
        if (l.pill) { const q = l.pill.states[Math.min(k, l.pill.states.length - 1)]; bx.push([l.pill.left, l.pill.cy - l.pill.h / 2, l.pill.left + q.w, l.pill.cy + l.pill.h / 2]); }
      }
    }
    const x0 = Math.min(...bx.map((b) => b[0])), x1 = Math.max(...bx.map((b) => b[2])), y0 = Math.min(...bx.map((b) => b[1]));
    return { state: k, to: m.to, offset: [Math.round(m.to.centreX - (x0 + x1) / 2), Math.round(m.to.top - y0)] };
  });
  // the states: the pill's words (one state if none)
  const pl = (L.blocks || []).flatMap((b) => b.lines).find((l) => l.pill);
  const states = pl ? pl.pill.states.map((q, k) => ({ index: k, label: q.word.replace(/\.$/, "") })) : [{ index: 0, label: "card" }];
  return { L, states };
}

const all = [];
for (const def of CARDS) {
  const { L, states } = layout(def);
  const card = {
    id: def.id, story: def.story, ...(def.variantOf ? { variantOf: def.variantOf } : {}), beat: def.beat, shots: def.shots, scene: def.scene,
    textColour: HEX(def.ink), rule: TOKENS.rule,
    canvas: { w: W, h: H, safe: TOKENS.safe }, layout: L, states,
    timing: { cues: def.timing, note: "Cues in 30 fps frames on the story's shots: 'steam+4' = 4 frames after the steam shot starts, 'scf.end-8' = 8 before it ends. Lottie (60 fps): x2, which cards.mjs does." },
    mocks: def.mocks, notes: def.notes || ""
  };
  if (def.url && !def.url.continues) { const nx = CARDS.find((d) => d.url && d.url.continues === def.id); if (nx) card.continuedBy = { black: nx.timing.black, settle: nx.timing.settle, out: nx.timing.out }; }
  const clocks = def.story === "A" ? ["A_v4"] : def.story === "D" ? ["D2"] : def.story === "B" ? ["B5"] : def.story === "E" ? (def.id.startsWith("v2-") ? ["E2"] : ["E1"]) : ["C_v4", "C_long"];
  card.timing.frames = Object.fromEntries(clocks.map((k) => [k, frames(card, k)]));
  card.files = { outlined: states.map((s) => `svg/outlined/${def.id}${states.length > 1 ? "-" + s.label : ""}.svg`), live: states.map((s) => `svg/live/${def.id}${states.length > 1 ? "-" + s.label : ""}.svg`) };
  states.forEach((s, k) => {
    fs.writeFileSync(path.join(OUT, card.files.outlined[k]), svg(card, k, "paths"));
    fs.writeFileSync(path.join(OUT, card.files.live[k]), svg(card, k, "text"));
  });
  fs.writeFileSync(path.join(OUT, "json", `${def.id}.json`), JSON.stringify(card, null, 1));
  all.push(card);
}
fs.writeFileSync(path.join(OUT, "json", "tokens.json"), JSON.stringify({ ...TOKENS, clocks: CLOCKS }, null, 1));
// a check: nothing that must be read in the safe bands, nothing past the side margins
for (const c of all) {
  const boxes = [...(c.layout.blocks || []).flatMap((b) => [...b.lines.map((l) => [l.id, l.box]), ...(b.aplat ? b.aplat.states.map((a, k) => [b.id + "-aplat-" + k, { ...a, x: a.x + ((c.layout.moves || []).filter((m) => m.state <= k).pop()?.offset[0] || 0), y: a.y + ((c.layout.moves || []).filter((m) => m.state <= k).pop()?.offset[1] || 0) }]) : [])]), ...(c.layout.tags || []).map((g) => [g.id, g.box])];
  for (const [id, b] of boxes) {
    const bad = b.y < TOKENS.safe.top || b.y + b.h > H - TOKENS.safe.bottom || b.x < 60 || b.x + b.w > W - 60;
    if (bad) console.log("  ! out of the safe area:", c.id, id, JSON.stringify(b));
  }
}
console.log(all.map((c) => `${c.id}: ${c.states.length} state(s)`).join("\n"));
