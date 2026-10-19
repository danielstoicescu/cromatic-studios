// Contours of a coverage image (0..255, antialiased): marching squares at the half level, chained into closed
// polygons with sub-pixel vertices, outer outlines and holes told apart by their winding.

// cov(x, y) -> 0..255; returns [{ pts: [[x, y]...] (pixel units), area (signed shoelace in y-down pixels: outlines < 0,
// holes > 0) }]
export function contours(W, H, cov, lvl = 127.5) {
  const v = (x, y) => (x < 0 || y < 0 || x >= W || y >= H ? 0 : cov(x, y));
  const segs = [];
  const ip = (a, b) => (lvl - a) / (b - a || 1e-9);
  for (let j = -1; j < H; j++) for (let i = -1; i < W; i++) {
    const a = v(i, j), b = v(i + 1, j), c = v(i + 1, j + 1), d = v(i, j + 1);
    const idx = (a > lvl ? 8 : 0) | (b > lvl ? 4 : 0) | (c > lvl ? 2 : 0) | (d > lvl ? 1 : 0);
    if (idx === 0 || idx === 15) continue;
    const top = [i + ip(a, b), j], right = [i + 1, j + ip(b, c)], bot = [i + ip(d, c), j + 1], left = [i, j + ip(a, d)];
    // oriented so the inside is on the left going along (a consistent winding for every loop: outlines one way, holes the other)
    const L = { 1: [[bot, left]], 2: [[right, bot]], 3: [[right, left]], 4: [[top, right]], 5: [[top, right], [bot, left]], 6: [[top, bot]], 7: [[top, left]], 8: [[left, top]], 9: [[bot, top]], 10: [[left, top], [right, bot]], 11: [[right, top]], 12: [[left, right]], 13: [[bot, right]], 14: [[left, bot]] }[idx];
    for (const s of L) segs.push(s);
  }
  const key = (p) => p[0].toFixed(3) + "," + p[1].toFixed(3);
  const starts = new Map();
  segs.forEach((s, i) => starts.set(key(s[0]), i));
  const used = new Uint8Array(segs.length), out = [];
  for (let i = 0; i < segs.length; i++) {
    if (used[i]) continue;
    const pts = [segs[i][0]]; used[i] = 1;
    let cur = segs[i][1];
    for (let guard = 0; guard < 200000; guard++) {
      const nx = starts.get(key(cur));
      if (nx === undefined || used[nx]) break;
      pts.push(segs[nx][0]); used[nx] = 1; cur = segs[nx][1];
    }
    if (pts.length < 6) continue;
    let A = 0; for (let k = 0; k < pts.length; k++) { const p = pts[k], q = pts[(k + 1) % pts.length]; A += p[0] * q[1] - q[0] * p[1]; }
    out.push({ pts, area: A / 2 });
  }
  return out;
}
// Douglas-Peucker on a closed polygon (tolerance in its units)
export function simplify(pts, tol) {
  if (pts.length < 8) return pts;
  const dp = (a, b) => {
    let md = 0, mi = -1;
    const [x1, y1] = pts[a], [x2, y2] = pts[b % pts.length], dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1;
    for (let i = a + 1; i < b; i++) { const [x, y] = pts[i % pts.length], d = Math.abs((x - x1) * dy - (y - y1) * dx) / L; if (d > md) { md = d; mi = i; } }
    return md > tol ? [...dp(a, mi), ...dp(mi, b).slice(1)] : [a, b];
  };
  // split at the two furthest-apart points
  let far = 0, fd = 0; for (let i = 1; i < pts.length; i++) { const d = Math.hypot(pts[i][0] - pts[0][0], pts[i][1] - pts[0][1]); if (d > fd) { fd = d; far = i; } }
  const idx = [...dp(0, far), ...dp(far, pts.length).slice(1)];
  idx.pop();
  return idx.map((i) => pts[i % pts.length]);
}
