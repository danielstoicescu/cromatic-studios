// Cromatic opening · type as shapes. The site's display face (CromaticSans 700-900 = Google Sans 18pt SemiBold, the
// very woff2 files the site serves from site/fonts) is opened here, its glyphs turned into Lottie bezier paths, and
// lines are set with the font's own GPOS kerning and the site's tight tracking. Google Sans is OFL 1.1
// (Copyright 2025 The Google Sans Project Authors): outlines inside an animation are a document made with the font,
// which the OFL does not restrict, so no font file ships and nothing depends on the visitor's fonts.
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import opentype from "opentype.js";
import wawoff2 from "wawoff2";
import { gposKerner } from "./gpos.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const FONT_DIR = path.resolve(here, "../../../../site/fonts");

async function open(file) {
  const buf = fs.readFileSync(path.join(FONT_DIR, file));
  const ttf = Buffer.from(await wawoff2.decompress(buf));
  const font = opentype.parse(ttf.buffer.slice(ttf.byteOffset, ttf.byteOffset + ttf.length));
  font.__ttf = ttf;
  return font;
}

export async function loadType() {
  const main = await open("google-sans-latin.woff2");
  let ext = null; try { ext = await open("google-sans-latin-ext.woff2"); } catch {}
  const kern = gposKerner(main.__ttf); // the font's GPOS kern feature (latn)
  const glyphOf = (ch) => { const g = main.charToGlyph(ch); if (g.index > 0 || !ext) return { g, font: main }; const g2 = ext.charToGlyph(ch); return { g: g2, font: ext }; };
  const os2 = main.tables.os2;
  return { main, ext, kern, glyphOf, upm: main.unitsPerEm, cap: os2.sCapHeight, xh: os2.sxHeight, asc: main.ascender, desc: main.descender };
}

// a glyph's outline as Lottie paths, in font units, y down (so a group transform scales it to px)
const shapeCache = new Map();
export function glyphShapes(T, ch) {
  if (shapeCache.has(ch)) return shapeCache.get(ch);
  const { g } = T.glyphOf(ch);
  const cmds = g.path.commands;
  const contours = []; let cur = null, last = null;
  const R = (v) => Math.round(v);
  const push = (pt, inT) => { cur.v.push([R(pt[0]), R(-pt[1])]); cur.i.push([R(inT[0]), R(-inT[1])]); cur.o.push([0, 0]); };
  for (const c of cmds) {
    if (c.type === "M") { cur = { v: [], i: [], o: [], c: true }; contours.push(cur); push([c.x, c.y], [0, 0]); last = [c.x, c.y]; }
    else if (c.type === "L") { push([c.x, c.y], [0, 0]); last = [c.x, c.y]; }
    else if (c.type === "Q") {
      const c1 = [last[0] + (2 / 3) * (c.x1 - last[0]), last[1] + (2 / 3) * (c.y1 - last[1])], c2 = [c.x + (2 / 3) * (c.x1 - c.x), c.y + (2 / 3) * (c.y1 - c.y)];
      cur.o[cur.o.length - 1] = [R(c1[0] - last[0]), R(-(c1[1] - last[1]))];
      push([c.x, c.y], [c2[0] - c.x, c2[1] - c.y]); last = [c.x, c.y];
    } else if (c.type === "C") {
      cur.o[cur.o.length - 1] = [R(c.x1 - last[0]), R(-(c.y1 - last[1]))];
      push([c.x, c.y], [c.x2 - c.x, c.y2 - c.y]); last = [c.x, c.y];
    } else if (c.type === "Z") {
      // closing: a last vertex on the first is the same point; its in-tangent belongs to the first
      const n = cur.v.length;
      if (n > 1 && cur.v[n - 1][0] === cur.v[0][0] && cur.v[n - 1][1] === cur.v[0][1]) { cur.i[0] = cur.i[n - 1]; cur.v.pop(); cur.i.pop(); cur.o.pop(); }
    }
  }
  // drop degenerate contours and zero-length duplicates (TrueType "L to the same point" after M)
  const out = contours.map((ct) => {
    const v = [], i = [], o = [];
    for (let k = 0; k < ct.v.length; k++) {
      const p = v.length ? v[v.length - 1] : null;
      if (p && p[0] === ct.v[k][0] && p[1] === ct.v[k][1]) { o[o.length - 1] = ct.o[k]; continue; }
      v.push(ct.v[k]); i.push(ct.i[k]); o.push(ct.o[k]);
    }
    return { c: true, v, i, o };
  }).filter((ct) => ct.v.length > 2);
  const res = { contours: out, adv: g.advanceWidth, index: g.index };
  shapeCache.set(ch, res);
  return res;
}

// set a line: letters with x (px from the line's start), the line's width in px. tracking in em.
export function setLine(T, text, size, tracking = -0.035) {
  const k = size / T.upm;
  const letters = []; let x = 0, prev = null;
  for (const ch of [...text]) {
    const { g } = T.glyphOf(ch);
    if (prev) x += T.kern(prev.index, g.index) * k;
    if (ch !== " ") letters.push({ ch, x, adv: g.advanceWidth * k });
    x += g.advanceWidth * k + tracking * size;
    prev = g;
  }
  return { letters, width: x - tracking * size, size };
}
// split a line's letters into words (by the spaces in the text)
export function words(T, text, size, tracking) {
  const L = setLine(T, text, size, tracking);
  const ws = []; let w = null, li = 0;
  for (const ch of [...text]) {
    if (ch === " ") { w = null; continue; }
    if (!w) { w = { text: "", letters: [] }; ws.push(w); }
    w.text += ch; w.letters.push(L.letters[li++]);
  }
  for (const w of ws) { w.x = w.letters[0].x; const l = w.letters[w.letters.length - 1]; w.w = l.x + l.adv - w.x; }
  return { words: ws, width: L.width, size };
}
