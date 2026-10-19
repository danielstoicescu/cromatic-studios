// Cromatic opening · GPOS pair kerning read straight from the font's bytes (PairPos formats 1 and 2, also when they
// sit inside Extension lookups, which opentype.js 2.0 leaves unparsed). Only xAdvance of the first glyph is used,
// which is what horizontal Latin kerning is.
export function gposKerner(buf, scriptTag = "latn") {
  const dv = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const u16 = (o) => dv.getUint16(o), i16 = (o) => dv.getInt16(o), u32 = (o) => dv.getUint32(o);
  const tag = (o) => String.fromCharCode(dv.getUint8(o), dv.getUint8(o + 1), dv.getUint8(o + 2), dv.getUint8(o + 3));
  const n = u16(4); let G = -1;
  for (let i = 0; i < n; i++) { const r = 12 + i * 16; if (tag(r) === "GPOS") G = u32(r + 8); }
  if (G < 0) return () => 0;
  const SL = G + u16(G + 4), FL = G + u16(G + 6), LL = G + u16(G + 8);
  // the script's default language: its features
  let langSys = -1;
  for (let i = 0, c = u16(SL); i < c; i++) { const r = SL + 2 + i * 6; if (tag(r) === scriptTag || (langSys < 0 && tag(r) === "DFLT")) { const S = SL + u16(r + 4); const d = u16(S); if (d) langSys = S + d; if (tag(r) === scriptTag) break; } }
  if (langSys < 0) return () => 0;
  const lookupIdx = new Set();
  for (let i = 0, c = u16(langSys + 4); i < c; i++) {
    const fi = u16(langSys + 6 + i * 2), r = FL + 2 + fi * 6;
    if (tag(r) !== "kern") continue;
    const F = FL + u16(r + 4);
    for (let j = 0, lc = u16(F + 2); j < lc; j++) lookupIdx.add(u16(F + 4 + j * 2));
  }
  const vrSize = (fmt) => { let s = 0; for (let b = fmt; b; b >>= 1) s += (b & 1) * 2; return s; };
  const xAdvOff = (fmt) => (fmt & 4 ? vrSize(fmt & 3) : -1);
  const coverage = (C, g) => {
    const fmt = u16(C);
    if (fmt === 1) { let lo = 0, hi = u16(C + 2) - 1; while (lo <= hi) { const m = (lo + hi) >> 1, v = u16(C + 4 + m * 2); if (v === g) return m; if (v < g) lo = m + 1; else hi = m - 1; } return -1; }
    for (let i = 0, c = u16(C + 2); i < c; i++) { const r = C + 4 + i * 6; if (g >= u16(r) && g <= u16(r + 2)) return u16(r + 4) + g - u16(r); }
    return -1;
  };
  const classOf = (D, g) => {
    const fmt = u16(D);
    if (fmt === 1) { const s = u16(D + 2), c = u16(D + 4); return g >= s && g < s + c ? u16(D + 6 + (g - s) * 2) : 0; }
    for (let i = 0, c = u16(D + 2); i < c; i++) { const r = D + 4 + i * 6; if (g >= u16(r) && g <= u16(r + 2)) return u16(r + 4); }
    return 0;
  };
  // every PairPos subtable of every kern lookup, in lookup order
  const lookups = [...lookupIdx].sort((a, b) => a - b).map((li) => {
    const L = LL + u16(LL + 2 + li * 2), type = u16(L), subs = [];
    for (let s = 0, c = u16(L + 4); s < c; s++) {
      let S = L + u16(L + 6 + s * 2), t = type;
      if (t === 9) { t = u16(S + 2); S = S + u32(S + 4); }
      if (t === 2) subs.push(S);
    }
    return subs;
  });
  const cache = new Map();
  return (a, b) => {
    const key = a * 65536 + b; if (cache.has(key)) return cache.get(key);
    let v = 0;
    for (const subs of lookups) {
      for (const S of subs) {
        const fmt = u16(S), ci = coverage(S + u16(S + 2), a); if (ci < 0) continue;
        const vf1 = u16(S + 4), vf2 = u16(S + 6), s1 = vrSize(vf1), s2 = vrSize(vf2), xo = xAdvOff(vf1);
        if (fmt === 1) {
          const P = S + u16(S + 10 + ci * 2), rec = 2 + s1 + s2;
          let found = false;
          for (let i = 0, c = u16(P); i < c; i++) { const r = P + 2 + i * rec; if (u16(r) === b) { if (xo >= 0) v += i16(r + 2 + xo); found = true; break; } }
          if (found) break;
        } else if (fmt === 2) {
          const c1 = classOf(S + u16(S + 8), a), c2 = classOf(S + u16(S + 10), b), n2 = u16(S + 14);
          const r = S + 16 + (c1 * n2 + c2) * (s1 + s2);
          if (xo >= 0) v += i16(r + xo);
          break;
        }
      }
    }
    cache.set(key, v); return v;
  };
}
