// Cromatic · lottie-ui: one frame of a piece as plain SVG markup (TASK-067, the website's coffee stop). The website paints
// this with its HTML, so the scene is there at the first paint, before any script; the Lottie draws over it once the
// player is in, from the very same frame, so the hand-over cannot be seen. It reads the subset the site's pieces are
// written in (lib/lottie.mjs): shape and null layers with parents, groups and their transforms, rectangles, ellipses,
// paths, solid fills, strokes, trims. Gradients, masks, mattes, images and expressions are not drawn (a piece that wants
// a still keeps to the subset). The rules are lottie-web's canvas renderer's: an item earlier in a group is drawn over
// a later one; a fill or a stroke styles every shape before it at its level and inside the groups before it; a stroke's
// width follows the transform of the group it sits in; the first layer is drawn on top.
//   stillSvg(json, { frame = 0, cls, label }) -> "<svg ...>...</svg>"

const R = (v) => Math.round(v * 10) / 10; // a tenth of a unit: the comp is drawn at about its own size

// cubic-bezier easing (x1, y1, x2, y2) at x
function bez(x1, y1, x2, y2, x) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx, cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const X = (t) => ((ax * t + bx) * t + cx) * t, Y = (t) => ((ay * t + by) * t + cy) * t, dX = (t) => (3 * ax * t + 2 * bx) * t + cx;
  let t = x;
  for (let i = 0; i < 8; i++) { const e = X(t) - x, d = dX(t); if (Math.abs(e) < 1e-6 || Math.abs(d) < 1e-6) break; t -= e / d; }
  if (t < 0 || t > 1 || Math.abs(X(t) - x) > 1e-4) { let lo = 0, hi = 1; t = x; for (let i = 0; i < 40; i++) { if (X(t) < x) lo = t; else hi = t; t = (lo + hi) / 2; } }
  return Y(t);
}
const lerp = (a, b, k) => (Array.isArray(a) ? a.map((v, i) => (typeof v === "number" ? v + ((b?.[i] ?? v) - v) * k : v)) : a + (b - a) * k);
// a property's value at frame f (keys sorted by t; a key with h is held; the easing of the segment is the first key's o/i)
export function val(pr, f) {
  if (pr == null) return undefined;
  if (pr.s === true && pr.x) return [val(pr.x, f), val(pr.y, f)];
  if (!pr.a) return pr.k;
  const k = pr.k, un = (s) => (Array.isArray(s) && s.length === 1 && typeof s[0] !== "object" ? s[0] : Array.isArray(s) && s.length === 1 ? s[0] : s);
  if (f <= k[0].t) return un(k[0].s);
  for (let i = 0; i < k.length - 1; i++) {
    const a = k[i], b = k[i + 1];
    if (f >= b.t) continue;
    if (a.h || typeof un(a.s) === "object" && !Array.isArray(un(a.s))) return un(a.s);
    const x = (f - a.t) / (b.t - a.t);
    const e = a.o ? bez(a.o.x[0], a.o.y[0], a.i.x[0], a.i.y[0], x) : x;
    return lerp(un(a.s), un(b.s ?? a.e), e);
  }
  return un(k[k.length - 1].s);
}

/* ---------- 2D affine matrices [a, b, c, d, e, f] (x' = a x + c y + e, y' = b x + d y + f) ---------- */
const I = [1, 0, 0, 1, 0, 0];
const mul = (m, n) => [m[0] * n[0] + m[2] * n[1], m[1] * n[0] + m[3] * n[1], m[0] * n[2] + m[2] * n[3], m[1] * n[2] + m[3] * n[3], m[0] * n[4] + m[2] * n[5] + m[4], m[1] * n[4] + m[3] * n[5] + m[5]];
const app = (m, [x, y]) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
const vec = (m, [x, y]) => [m[0] * x + m[2] * y, m[1] * x + m[3] * y];
// a Lottie transform (tr item or layer ks) at frame f: translate(p) rotate(r) scale(s) translate(-a)
function trMat(t, f) {
  const p = val(t.p, f) || [0, 0], a = val(t.a, f) || [0, 0], s = val(t.s, f) || [100, 100], r = ((val(t.r, f) || 0) * Math.PI) / 180;
  const cs = Math.cos(r), sn = Math.sin(r), sx = s[0] / 100, sy = s[1] / 100;
  const m = [cs * sx, sn * sx, -sn * sy, cs * sy, 0, 0];
  const o = vec(m, [-a[0], -a[1]]);
  return [m[0], m[1], m[2], m[3], p[0] + o[0], p[1] + o[1]];
}
const matStr = (m) => (m.every((v, i) => Math.abs(v - I[i]) < 1e-6) ? "" : ` transform="matrix(${m.map(R).join(" ")})"`);

/* ---------- shapes as path data, through a matrix ---------- */
function bezD(p, m) {
  const v = p.v, n = v.length;
  if (!n) return "";
  const P = (q) => app(m, q).map(R).join(" ");
  let d = `M${P(v[0])}`;
  const segs = p.c ? n : n - 1;
  for (let k = 0; k < segs; k++) {
    const a = v[k], b = v[(k + 1) % n], o = p.o[k] || [0, 0], i = p.i[(k + 1) % n] || [0, 0];
    if (!o[0] && !o[1] && !i[0] && !i[1]) d += `L${P(b)}`;
    else d += `C${P([a[0] + o[0], a[1] + o[1]])} ${P([b[0] + i[0], b[1] + i[1]])} ${P(b)}`;
  }
  return d + (p.c ? "Z" : "");
}
function rectPath(size, pos, rr) {
  const [w, h] = size, [cx, cy] = pos, r = Math.max(0, Math.min(rr || 0, w / 2, h / 2)), k = 0.5523 * r, x0 = cx - w / 2, x1 = cx + w / 2, y0 = cy - h / 2, y1 = cy + h / 2;
  if (!r) return { c: true, v: [[x1, y0], [x1, y1], [x0, y1], [x0, y0]], i: [[0, 0], [0, 0], [0, 0], [0, 0]], o: [[0, 0], [0, 0], [0, 0], [0, 0]] };
  return { c: true, v: [[x1, y0 + r], [x1, y1 - r], [x1 - r, y1], [x0 + r, y1], [x0, y1 - r], [x0, y0 + r], [x0 + r, y0], [x1 - r, y0]],
    i: [[0, -k], [0, 0], [k, 0], [0, 0], [0, k], [0, 0], [-k, 0], [0, 0]], o: [[0, 0], [0, k], [0, 0], [-k, 0], [0, 0], [0, -k], [0, 0], [k, 0]] };
}
function ellPath(size, pos) {
  const rx = size[0] / 2, ry = size[1] / 2, [cx, cy] = pos, kx = 0.5523 * rx, ky = 0.5523 * ry;
  return { c: true, v: [[cx, cy - ry], [cx + rx, cy], [cx, cy + ry], [cx - rx, cy]], i: [[-kx, 0], [0, -ky], [kx, 0], [0, ky]], o: [[kx, 0], [0, ky], [-kx, 0], [0, -ky]] };
}
const shapeOf = (it, f) => (it.ty === "sh" ? val(it.ks, f) : it.ty === "rc" ? rectPath(val(it.s, f), val(it.p, f), val(it.r, f)) : ellPath(val(it.s, f), val(it.p, f)));
// a rectangle or an ellipse under a matrix that neither turns nor skews: the short way (lines and arcs, same outline)
function shortD(it, f, m) {
  if (Math.abs(m[1]) > 1e-9 || Math.abs(m[2]) > 1e-9 || (it.ty !== "rc" && it.ty !== "el")) return null;
  const [w0, h0] = val(it.s, f), [cx0, cy0] = val(it.p, f), sx = Math.abs(m[0]), sy = Math.abs(m[3]);
  const cx = m[0] * cx0 + m[4], cy = m[3] * cy0 + m[5], w = w0 * sx, h = h0 * sy;
  if (it.ty === "el") { const rx = R(w / 2), ry = R(h / 2); return `M${R(cx - w / 2)} ${R(cy)}a${rx} ${ry} 0 1 1 ${R(w)} 0a${rx} ${ry} 0 1 1 ${R(-w)} 0Z`; }
  const r0 = Math.max(0, Math.min(val(it.r, f) || 0, w0 / 2, h0 / 2)), rx = R(r0 * sx), ry = R(r0 * sy), x0 = R(cx - w / 2), y0 = R(cy - h / 2), W = R(w), H = R(h);
  if (!r0) return `M${x0} ${y0}h${W}v${H}h${R(-w)}Z`;
  const a = (dx, dy) => `a${rx} ${ry} 0 0 1 ${dx} ${dy}`;
  return `M${R(x0 + rx)} ${y0}h${R(W - 2 * rx)}${a(rx, ry)}v${R(H - 2 * ry)}${a(-rx, ry)}h${R(-(W - 2 * rx))}${a(-rx, -ry)}v${R(-(H - 2 * ry))}${a(rx, -ry)}Z`;
}
const hex = (c) => "#" + c.slice(0, 3).map((v) => Math.round(Math.max(0, Math.min(1, v)) * 255).toString(16).padStart(2, "0")).join("");

// a group's items: returns the styles it creates (in drawing order), each with its shapes' path data (in layer space)
function walk(items, f, M, op, inherited, out) {
  const t = items.find((x) => x.ty === "tr");
  const Mg = t ? mul(M, trMat(t, f)) : M, og = op * (t ? (val(t.o, f) ?? 100) / 100 : 1);
  let styles = inherited.slice(), trims = [];
  for (let n = items.length - 1; n >= 0; n--) {
    const it = items[n];
    if (it.hd || it.ty === "tr") continue;
    if (it.ty === "fl" || it.ty === "st") {
      const rec = { it, M: Mg, o: og * (val(it.o, f) ?? 100) / 100, d: [], trimmed: [] };
      out.push(rec); styles = [rec, ...styles];
    } else if (it.ty === "tm") trims.push(it);
    else if (it.ty === "sh" || it.ty === "rc" || it.ty === "el") {
      const p = shapeOf(it, f), d0 = shortD(it, f, Mg);
      for (const s of styles) {
        const d = trims.length || !d0 ? bezD(p, Mg) : d0;
        if (trims.length) { const tm = trims[0]; let a = val(tm.s, f), b = val(tm.e, f); const off = ((val(tm.o, f) || 0) / 360) * 100; if (a > b) [a, b] = [b, a]; s.trimmed.push({ d, a: a + off, b: b + off }); }
        else s.d.push(d);
      }
    } else if (it.ty === "gr") walk(it.it, f, Mg, og, styles, out);
  }
}
function drawStyles(list, f) {
  let s = "";
  for (let n = 0; n < list.length; n++) {
    const rec = list[n], it = rec.it;
    if (rec.o <= 0.001) continue;
    const col = hex(val(it.c, f)), op = rec.o < 0.999 ? ` opacity="${R(rec.o)}"` : "";
    if (it.ty === "fl") {
      if (!rec.d.length) continue;
      const d = rec.d.join(""), nx = list[n + 1];
      // a stroke drawn next over the very same shapes, at the same opacity: one element (SVG paints the fill, then the stroke)
      if (nx && nx.it.ty === "st" && !nx.trimmed.length && Math.abs(nx.o - rec.o) < 1e-3 && nx.d.join("") === d) {
        s += `<path d="${d}" fill="${col}"${it.r === 2 ? ' fill-rule="evenodd"' : ""}${strokeAttrs(nx, f)}${op}/>`; n++; continue;
      }
      s += `<path d="${d}" fill="${col}"${it.r === 2 ? ' fill-rule="evenodd"' : ""}${op}/>`; continue;
    }
    const st = ` fill="none"${strokeAttrs(rec, f)}${op}`;
    if (rec.d.length) s += `<path d="${rec.d.join("")}"${st}/>`;
    for (const t of rec.trimmed) { const len = Math.max(0, Math.min(100, t.b) - Math.max(0, t.a)); if (len > 0.05) s += `<path d="${t.d}" pathLength="100" stroke-dasharray="${R(len)} 200" stroke-dashoffset="${R(-Math.max(0, t.a))}"${st}/>`; }
  }
  return s;
}

function strokeAttrs(rec, f) {
  const it = rec.it, k = Math.sqrt(Math.abs(rec.M[0] * rec.M[3] - rec.M[1] * rec.M[2])), w = R((val(it.w, f) || 0) * k);
  return ` stroke="${hex(val(it.c, f))}" stroke-width="${w}"${it.lc === 1 ? "" : ` stroke-linecap="${it.lc === 3 ? "square" : "round"}"`}${it.lj === 1 ? "" : ` stroke-linejoin="${it.lj === 3 ? "bevel" : "round"}"`}`;
}
export function stillSvg(J, { frame = 0, cls = "", label = "" } = {}) {
  const f = frame, byInd = new Map(J.layers.map((L) => [L.ind, L]));
  const layerMat = (L) => { const own = trMat(L.ks, f); return L.parent && byInd.has(L.parent) ? mul(layerMat(byInd.get(L.parent)), own) : own; };
  let body = "";
  for (let n = J.layers.length - 1; n >= 0; n--) {
    const L = J.layers[n];
    if (L.ty !== 4 || L.hd || f < L.ip || f >= L.op || L.td) continue;
    const o = (val(L.ks.o, f) ?? 100) / 100;
    if (o <= 0.001) continue;
    const out = [];
    walk(L.shapes, f, I, 1, [], out);
    // styles were created from the end of the list: the first created is drawn first (at the bottom)
    const inner = drawStyles(out, f);
    if (!inner) continue;
    body += `<g${matStr(layerMat(L))}${o < 0.999 ? ` opacity="${R(o)}"` : ""}>${inner}</g>`;
  }
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${J.w} ${J.h}" preserveAspectRatio="xMidYMid meet"${cls ? ` class="${cls}"` : ""}${label ? ` role="img" aria-label="${label}"` : ' aria-hidden="true" focusable="false"'}>${body}</svg>`;
}
