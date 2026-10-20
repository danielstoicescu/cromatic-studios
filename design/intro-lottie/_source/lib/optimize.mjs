// Cromatic opening · after-build passes on a Lottie JSON.
//   simplifyKeys(json)   drops keyframes a straight line between their neighbours already gives (to a tolerance under a
//                        tenth of a pixel, a twentieth of a degree or percent, 1/300 of a colour), and the middle keys of
//                        constant runs: what a keyed property plays is unchanged to that tolerance
//   warpTime(json, W, { splitAt })   retimes the main composition: every key, layer in and out point and marker of the
//                        top level goes through W (frames -> frames, increasing); precomps keep their own time (they are
//                        played by remaps, whose values are their own seconds). Linear and held segments that span a
//                        frame in splitAt are cut there first (so a loop after it is only shifted, never stretched)

const isKeyArr = (k) => Array.isArray(k) && k.length > 0 && k[0] && typeof k[0] === "object" && "t" in k[0];
const flat = (v, out = []) => { if (typeof v === "number") out.push(v); else if (Array.isArray(v)) for (const x of v) flat(x, out); else if (v && typeof v === "object") { for (const key of ["v", "i", "o"]) if (key in v) flat(v[key], out); } return out; };
const linearSeg = (k) => !k.h && k.o && k.i && [].concat(k.o.x).every((x, j) => Math.abs(x - [].concat(k.o.y)[j]) < 1e-9) && [].concat(k.i.x).every((x, j) => Math.abs(x - [].concat(k.i.y)[j]) < 1e-9);
// lerp of two values of the same shape (numbers, arrays, shape paths)
function lerpV(a, b, u) {
  if (typeof a === "number") return a + (b - a) * u;
  if (Array.isArray(a)) return a.map((x, j) => lerpV(x, b[j], u));
  if (a && typeof a === "object") { const o = { ...a }; for (const key of ["v", "i", "o"]) if (key in a) o[key] = lerpV(a[key], b[key], u); return o; }
  return a;
}
const round = (v, d = 3) => { const m = 10 ** d; if (typeof v === "number") return Math.round(v * m) / m; if (Array.isArray(v)) return v.map((x) => round(x, d)); if (v && typeof v === "object") { const o = { ...v }; for (const key of ["v", "i", "o"]) if (key in v) o[key] = round(v[key], d); return o; } return v; };

function simplifyArr(K, tol) {
  if (K.length < 3) return K;
  const vals = K.map((k) => flat(k.s));
  const n0 = vals[0].length;
  if (vals.some((v) => v.length !== n0)) return K;
  const keep = [0];
  const within = (a, b, idx) => { // the original keys a < idx < b on the straight line from a to b?
    const ta = K[a].t, tb = K[b].t;
    for (let m = a + 1; m < b; m++) { const u = (K[m].t - ta) / (tb - ta || 1); for (let j = 0; j < n0; j++) { const lin = vals[a][j] + (vals[b][j] - vals[a][j]) * u; if (Math.abs(lin - vals[m][j]) > tol) return false; } }
    return true;
  };
  for (let i = 1; i < K.length - 1; i++) {
    const a = keep[keep.length - 1];
    const same = vals[i].every((x, j) => x === vals[a][j] && x === vals[i + 1][j]);
    // all the segments from a to i + 1 linear (no holds, no eases): then i is dropped if the line a -> i + 1 gives it
    let lin = true; for (let m = a; m <= i; m++) if (!linearSeg(K[m])) { lin = false; break; }
    if (same && !K[a].h && !K[i].h) continue;
    if (lin && within(a, i + 1, i)) continue;
    keep.push(i);
  }
  keep.push(K.length - 1);
  return keep.map((i) => K[i]);
}
const TOL = { tm: 1e-5, s: 0.05, r: 0.05, o: 0.05, g: 1 / 300, default: 0.08 };
export function simplifyKeys(json) {
  let before = 0, after = 0;
  const walk = (o, name) => {
    if (Array.isArray(o)) { for (const x of o) walk(x, name); return; }
    if (!o || typeof o !== "object") return;
    for (const key of Object.keys(o)) {
      const v = o[key];
      if (v && typeof v === "object" && v.a === 1 && isKeyArr(v.k)) {
        const tol = key === "g" ? TOL.g : TOL[key] ?? TOL.default;
        before += v.k.length; v.k = simplifyArr(v.k, tol); after += v.k.length;
        if (v.k.length === 1) { const s = v.k[0].s; o[key] = { a: 0, k: Array.isArray(s) && s.length === 1 && typeof s[0] !== "object" && key !== "g" ? s[0] : Array.isArray(s) && s.length === 1 && typeof s[0] === "object" ? s[0] : s }; }
      } else if (key === "g" && v && v.k && v.k.a === 1 && isKeyArr(v.k.k)) {
        before += v.k.k.length; v.k.k = simplifyArr(v.k.k, TOL.g); after += v.k.k.length;
      } else walk(v, key);
    }
  };
  walk(json.layers); for (const a of json.assets || []) if (a.layers) walk(a.layers);
  return { before, after };
}

/* ------------------------------ time ------------------------------ */
export function warpTime(json, W, { splitAt = [] } = {}) {
  const precompIds = new Set((json.assets || []).filter((a) => a.layers).map((a) => a.id));
  const issues = [];
  const splitArr = (K, where) => {
    const out = [];
    for (let i = 0; i < K.length; i++) {
      out.push(K[i]);
      if (i === K.length - 1) break;
      for (const T of splitAt) {
        const a = K[i], b = K[i + 1];
        if (a.t < T && b.t > T) {
          const u = (T - a.t) / (b.t - a.t);
          if (a.h) out.push({ ...a, t: T });
          else if (linearSeg(a)) out.push({ ...a, t: T, s: round(lerpV(a.s, b.s, u), 5) });
          else issues.push(`${where}: an eased segment ${a.t}..${b.t} spans ${T}`);
        }
      }
    }
    return out;
  };
  const walk = (o, where) => {
    if (Array.isArray(o)) { for (const x of o) walk(x, where); return; }
    if (!o || typeof o !== "object") return;
    for (const key of Object.keys(o)) {
      const v = o[key];
      if (v && typeof v === "object" && v.a === 1 && isKeyArr(v.k)) { v.k = splitArr(v.k, where + "." + key); for (const k of v.k) k.t = +W(k.t).toFixed(3); }
      else if (key === "g" && v && v.k && v.k.a === 1 && isKeyArr(v.k.k)) { v.k.k = splitArr(v.k.k, where + ".g"); for (const k of v.k.k) k.t = +W(k.t).toFixed(3); }
      else walk(v, where);
    }
  };
  for (const L of json.layers) {
    if (L.ty === 0 && precompIds.has(L.refId) && !L.tm) issues.push(`${L.nm}: a precomp played without a remap (its own time would not follow)`);
    walk(L.ks, L.nm); if (L.shapes) walk(L.shapes, L.nm); if (L.masksProperties) walk(L.masksProperties, L.nm); if (L.tm) walk({ tm: L.tm }, L.nm);
    L.ip = Math.round(W(L.ip)); L.op = Math.round(W(L.op)); if (L.st) L.st = W(L.st);
  }
  for (const m of json.markers || []) { const a = W(m.tm), b = W(m.tm + m.dr); m.tm = Math.round(a); m.dr = Math.round(b) - Math.round(a); }
  json.op = Math.round(W(json.op));
  if (issues.length) throw new Error("warpTime:\n  " + issues.join("\n  "));
  return json;
}
// a piecewise linear warp through [[from, to], ...] (increasing), straight on past the last point
export function piecewise(points) {
  return (t) => {
    if (t <= points[0][0]) return points[0][1] + (t - points[0][0]);
    for (let i = 0; i < points.length - 1; i++) { const [a, A] = points[i], [b, B] = points[i + 1]; if (t <= b) return A + ((t - a) * (B - A)) / (b - a); }
    const [z, Z] = points[points.length - 1]; return Z + (t - z);
  };
}
