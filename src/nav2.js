// nav2 (prototype, opt-in: ?nav=v2 on the map). One way round Cromatic City that mixes the drive and the map:
// the car drives the city's real road graph (every street the city draws, not only the scripted branches) under the
// arrows: ↑ on, ↓ brake / turn round, ← → at junctions and at the sharp bends (↑ only where straight on exists).
// Two views (Street: a chase camera behind the car; Satellite: the map's camera following it, zoom as on the map),
// blended, and a Waze-style panel of what is ahead per direction, filtered to the quarter you are in.
// app.js calls window.czNav2(host) when the map first opens with the flag; every hook on that side is tagged "nav2".
(function () {
  "use strict";
  const TAU = Math.PI * 2;
  const wrapA = (a) => { a = (a + Math.PI) % TAU; if (a < 0) a += TAU; return a - Math.PI; };
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const sss = (t) => t * t * t * (t * (t * 6 - 15) + 10);
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1]);
  const cumOf = (pts) => { const c = [0]; for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + dist(pts[i], pts[i - 1])); return c; };
  // the point at arc length s along a polyline (cum = its running lengths)
  function pointAt(pts, cum, s) {
    const n = pts.length;
    if (s <= 0) return pts[0].slice();
    if (s >= cum[n - 1]) return pts[n - 1].slice();
    let lo = 0, hi = n - 1;
    while (lo < hi - 1) { const m = (lo + hi) >> 1; if (cum[m] <= s) lo = m; else hi = m; }
    const f = (s - cum[lo]) / (cum[hi] - cum[lo] || 1);
    return [pts[lo][0] + (pts[hi][0] - pts[lo][0]) * f, pts[lo][1] + (pts[hi][1] - pts[lo][1]) * f];
  }
  const QNAME = { A: "Coffee Street", B: "Fintech Boulevard", C: "Medical Avenue", D: "Dacia 99 & Olari 9" };
  const QCOL = { A: "#28C840", B: "#119BFE", C: "#F28BA8", D: "#FED012" };
  const esc = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");

  // ===================== 1. the road graph =====================
  // Every road the city draws, from the same data that draws it: the drive's own network (navNet: the start road, the
  // roundabout's ring, the three portfolio streets, the Dacia row, the lane, the road to Olari 9), the long streets
  // (cityNet().longs, densified the way buildRoads draws them) and the organic side streets (cityNet().minor). They
  // are clipped to the part of the city the map shows, cut where they cross, joined where one ends on another (a
  // T-junction), junction points closer than 14 units merged, tiny overshoot stubs pruned, chains of degree 2
  // contracted into one edge; the connected piece that holds the start road is the graph.
  function buildGraph(H) {
    const t0 = performance.now();
    const B = { x0: -280, x1: 2880, z0: 2380, z1: 9640 };
    const raw = [];
    {
      const { P, adj } = H.navNet();
      const nb = adj.map((l) => [...new Set(l.map((q) => q[0]))]);
      const done = new Set(), ek = (a, b) => (a < b ? a * 1e6 + b : b * 1e6 + a);
      for (let s = 0; s < P.length; s++) {
        if (nb[s].length === 2) continue;
        for (const n of nb[s]) {
          if (done.has(ek(s, n))) continue;
          done.add(ek(s, n));
          const pts = [P[s], P[n]];
          let prev = s, cur = n;
          while (nb[cur].length === 2) {
            const nx = nb[cur][0] === prev ? nb[cur][1] : nb[cur][0];
            if (done.has(ek(cur, nx))) break;
            done.add(ek(cur, nx)); pts.push(P[nx]); prev = cur; cur = nx;
          }
          const F = H.fork, ring = pts.every(([x, z]) => Math.abs(Math.hypot(x - F.x, z - F.y) - 70) < 6);
          raw.push({ pts: pts.map(([x, z]) => [x, z]), w: 56, kind: ring ? "ring" : "drive" });
        }
      }
    }
    const net = H.cityNet();
    for (const s of net.longs) raw.push({ pts: H.rounded(s.pts, 160).map(([x, z]) => [x, z]), w: s.w, kind: "long" });
    for (const s of net.minor) raw.push({ pts: s.pts.map(([x, z]) => [x, z]), w: s.w, kind: "minor" });
    // clip to the map's box (Liang-Barsky per segment)
    const clipSeg = (ax, az, bx, bz) => {
      let u0 = 0, u1 = 1;
      const dx = bx - ax, dz = bz - az, p = [-dx, dx, -dz, dz], q = [ax - B.x0, B.x1 - ax, az - B.z0, B.z1 - az];
      for (let i = 0; i < 4; i++) {
        if (p[i] === 0) { if (q[i] < 0) return null; continue; }
        const r = q[i] / p[i];
        if (p[i] < 0) { if (r > u1) return null; if (r > u0) u0 = r; } else { if (r < u0) return null; if (r < u1) u1 = r; }
      }
      return [u0, u1];
    };
    const lines = [];
    for (const L of raw) {
      let run = [];
      const flush = () => {
        const o = [];
        for (const p of run) if (!o.length || dist(o[o.length - 1], p) > 0.5) o.push(p);
        if (o.length > 1 && cumOf(o)[o.length - 1] > 24) lines.push({ w: L.w, kind: L.kind, pts: o, cuts: [], pre: null, post: null });
        run = [];
      };
      for (let i = 1; i < L.pts.length; i++) {
        const [ax, az] = L.pts[i - 1], [bx, bz] = L.pts[i], c = clipSeg(ax, az, bx, bz);
        if (!c) { flush(); continue; }
        const A = [ax + (bx - ax) * c[0], az + (bz - az) * c[0]], Bp = [ax + (bx - ax) * c[1], az + (bz - az) * c[1]];
        if (!run.length || c[0] > 0) { flush(); run.push(A); }
        run.push(Bp);
        if (c[1] < 1) flush();
      }
      flush();
    }
    // every segment in a coarse grid
    const CS = 90, grid = new Map(), segs = [];
    const gk = (cx, cz) => (cx + 200) * 4000 + (cz + 200);
    lines.forEach((L, li) => {
      for (let i = 0; i < L.pts.length - 1; i++) {
        const si = segs.length, a = L.pts[i], b = L.pts[i + 1];
        segs.push([li, i]);
        for (let cx = Math.floor(Math.min(a[0], b[0]) / CS); cx <= Math.floor(Math.max(a[0], b[0]) / CS); cx++)
          for (let cz = Math.floor(Math.min(a[1], b[1]) / CS); cz <= Math.floor(Math.max(a[1], b[1]) / CS); cz++) {
            const k = gk(cx, cz); let l = grid.get(k); if (!l) grid.set(k, (l = [])); l.push(si);
          }
      }
    });
    // crossings: each pair is tested in every cell it shares, kept only in the cell the crossing falls in
    let nCross = 0;
    for (const [k, list] of grid) {
      for (let x = 0; x < list.length; x++) for (let y = x + 1; y < list.length; y++) {
        const [l1, i1] = segs[list[x]], [l2, i2] = segs[list[y]];
        if (l1 === l2) continue;
        const a = lines[l1].pts[i1], b = lines[l1].pts[i1 + 1], c = lines[l2].pts[i2], d = lines[l2].pts[i2 + 1];
        const rx = b[0] - a[0], rz = b[1] - a[1], sx = d[0] - c[0], sz = d[1] - c[1], den = rx * sz - rz * sx;
        if (Math.abs(den) < 1e-9) continue;
        const qx = c[0] - a[0], qz = c[1] - a[1], t = (qx * sz - qz * sx) / den, u = (qx * rz - qz * rx) / den;
        if (t < -1e-9 || t > 1 + 1e-9 || u < -1e-9 || u > 1 + 1e-9) continue;
        const X = a[0] + rx * t, Z = a[1] + rz * t;
        if (gk(Math.floor(X / CS), Math.floor(Z / CS)) !== k) continue;
        lines[l1].cuts.push({ i: i1, t, x: X, z: Z });
        lines[l2].cuts.push({ i: i2, t: u, x: X, z: Z });
        nCross++;
      }
    }
    // T-junctions: a street that ends just short of (or on) another is joined to it
    const ek2 = (p) => Math.round(p[0]) + "," + Math.round(p[1]);
    const ends = new Map();
    for (const L of lines) for (const p of [L.pts[0], L.pts[L.pts.length - 1]]) ends.set(ek2(p), (ends.get(ek2(p)) || 0) + 1);
    let nT = 0;
    lines.forEach((L, li) => {
      for (const side of [0, 1]) {
        const p = side ? L.pts[L.pts.length - 1] : L.pts[0];
        if (ends.get(ek2(p)) > 1) continue;
        if (L.cuts.some((c) => Math.hypot(c.x - p[0], c.z - p[1]) < 3)) continue;
        let best = null;
        const cx0 = Math.floor(p[0] / CS), cz0 = Math.floor(p[1] / CS);
        for (let cx = cx0 - 1; cx <= cx0 + 1; cx++) for (let cz = cz0 - 1; cz <= cz0 + 1; cz++) for (const si of grid.get(gk(cx, cz)) || []) {
          const [l2, i2] = segs[si];
          if (l2 === li) continue;
          const a = lines[l2].pts[i2], b = lines[l2].pts[i2 + 1], dx = b[0] - a[0], dz = b[1] - a[1], l2s = dx * dx + dz * dz || 1;
          const t = clamp(((p[0] - a[0]) * dx + (p[1] - a[1]) * dz) / l2s, 0, 1), X = a[0] + dx * t, Z = a[1] + dz * t, d = Math.hypot(X - p[0], Z - p[1]);
          const tol = lines[l2].w / 2 + 14;
          if (d < tol && (!best || d < best.d)) best = { d, l2, i2, t, X, Z };
        }
        if (!best) continue;
        lines[best.l2].cuts.push({ i: best.i2, t: best.t, x: best.X, z: best.Z });
        if (best.d > 0.5) { if (side) L.post = [best.X, best.Z]; else L.pre = [best.X, best.Z]; }
        nT++;
      }
    });
    // every line as a list of points with its junction points flagged
    const J = []; // junction points: [x, z]
    const lineJ = lines.map((L) => {
      const out = [];
      const add = (x, z, j) => {
        const last = out[out.length - 1];
        if (last && Math.hypot(last.x - x, last.z - z) < 0.5) { last.j = last.j || j; return; }
        out.push({ x, z, j });
      };
      if (L.pre) add(L.pre[0], L.pre[1], true);
      const cuts = L.cuts.slice().sort((a, b) => a.i + a.t - (b.i + b.t));
      let ci = 0;
      add(L.pts[0][0], L.pts[0][1], !L.pre);
      for (let i = 0; i < L.pts.length - 1; i++) {
        while (ci < cuts.length && cuts[ci].i === i) { add(cuts[ci].x, cuts[ci].z, true); ci++; }
        add(L.pts[i + 1][0], L.pts[i + 1][1], i + 1 === L.pts.length - 1 && !L.post);
      }
      if (L.post) add(L.post[0], L.post[1], true);
      out[0].j = out[out.length - 1].j = true;
      for (const p of out) if (p.j) { p.ji = J.length; J.push([p.x, p.z]); }
      return out;
    });
    // junction points within 14 units are one node (union-find over a grid)
    const par = J.map((_, i) => i), find = (i) => { while (par[i] !== i) i = par[i] = par[par[i]]; return i; };
    {
      const G2 = new Map(), C2 = 14;
      J.forEach((p, i) => { const k = gk(Math.floor(p[0] / C2), Math.floor(p[1] / C2)); let l = G2.get(k); if (!l) G2.set(k, (l = [])); l.push(i); });
      J.forEach((p, i) => {
        const cx0 = Math.floor(p[0] / C2), cz0 = Math.floor(p[1] / C2);
        for (let cx = cx0 - 1; cx <= cx0 + 1; cx++) for (let cz = cz0 - 1; cz <= cz0 + 1; cz++) for (const j of G2.get(gk(cx, cz)) || []) {
          if (j <= i) continue;
          if (Math.hypot(J[j][0] - p[0], J[j][1] - p[1]) < C2) { const a = find(i), b = find(j); if (a !== b) par[a] = b; }
        }
      });
    }
    const rootN = new Map(), nodes = [];
    J.forEach((p, i) => {
      const r = find(i);
      if (!rootN.has(r)) { rootN.set(r, nodes.length); nodes.push({ x: 0, z: 0, n: 0 }); }
      const nd = nodes[rootN.get(r)]; nd.x += p[0]; nd.z += p[1]; nd.n++;
    });
    for (const nd of nodes) { nd.x /= nd.n; nd.z /= nd.n; }
    const nodeOf = (ji) => rootN.get(find(ji));
    // edges: each line split at its junction points
    let edges = [];
    lines.forEach((L, li) => {
      const pts = lineJ[li];
      let start = 0;
      for (let k = 1; k < pts.length; k++) {
        if (!pts[k].j) continue;
        const a = nodeOf(pts[start].ji), b = nodeOf(pts[k].ji);
        if (a !== b) {
          const g = [[nodes[a].x, nodes[a].z]];
          for (let m = start + 1; m < k; m++) {
            const q = [pts[m].x, pts[m].z];
            if (dist(q, g[0]) < 8 || Math.hypot(q[0] - nodes[b].x, q[1] - nodes[b].z) < 8) continue;
            g.push(q);
          }
          g.push([nodes[b].x, nodes[b].z]);
          edges.push({ a, b, pts: g, w: L.w, kind: L.kind });
        }
        start = k;
      }
    });
    // the same street twice between the same two nodes (a long street over a drive road): keep one
    {
      const seen = new Map();
      edges = edges.filter((e) => {
        const k = e.a < e.b ? e.a + ":" + e.b : e.b + ":" + e.a, len = cumOf(e.pts)[e.pts.length - 1], m = pointAt(e.pts, cumOf(e.pts), len / 2);
        const o = seen.get(k) || [];
        if (o.some((q) => Math.abs(q.len - len) < Math.max(12, len * 0.12) && dist(q.m, m) < 24)) return false;
        o.push({ len, m }); seen.set(k, o);
        return true;
      });
    }
    // prune: tiny stubs (a street overshooting the one it meets), then contract the chains of degree 2
    const inc = () => { const l = nodes.map(() => []); edges.forEach((e, i) => { if (!e.dead) { l[e.a].push(i); l[e.b].push(i); } }); return l; };
    for (let pass = 0; pass < 3; pass++) {
      const l = inc();
      edges.forEach((e, i) => {
        if (e.dead) return;
        const len = cumOf(e.pts)[e.pts.length - 1];
        if (len < 36 && ((l[e.a].length === 1 && l[e.b].length >= 3) || (l[e.b].length === 1 && l[e.a].length >= 3))) e.dead = true;
      });
    }
    {
      let l = inc();
      for (let n = 0; n < nodes.length; n++) {
        const es = l[n];
        if (es.length !== 2 || es[0] === es[1]) continue;
        const e1 = edges[es[0]], e2 = edges[es[1]];
        if (e1.dead || e2.dead) continue;
        const p1 = e1.b === n ? e1.pts : e1.pts.slice().reverse(), a = e1.b === n ? e1.a : e1.b;
        const p2 = e2.a === n ? e2.pts : e2.pts.slice().reverse(), b = e2.a === n ? e2.b : e2.a;
        if (a === b) continue; // would close a loop on itself
        const ne = { a, b, pts: [...p1, ...p2.slice(1)], w: Math.max(e1.w, e2.w), kind: e1.kind === e2.kind ? e1.kind : e1.kind === "drive" || e2.kind === "drive" ? "drive" : e1.kind };
        e1.dead = e2.dead = true;
        const ni = edges.length; edges.push(ne);
        l[n] = [];
        l[a] = l[a].filter((i) => i !== es[0] && i !== es[1]).concat(ni);
        l[b] = l[b].filter((i) => i !== es[0] && i !== es[1]).concat(ni);
      }
    }
    edges = edges.filter((e) => !e.dead);
    // the connected piece with the start road in it
    let start = 0, sd = Infinity;
    nodes.forEach((nd, i) => { const d = Math.hypot(nd.x - H.start[0], nd.z - H.start[1]); if (d < sd) { sd = d; start = i; } });
    const l = nodes.map(() => []);
    edges.forEach((e, i) => { l[e.a].push(i); l[e.b].push(i); });
    const keep = new Uint8Array(nodes.length), q = [start];
    keep[start] = 1;
    while (q.length) { const n = q.pop(); for (const ei of l[n]) { const e = edges[ei], o = e.a === n ? e.b : e.a; if (!keep[o]) { keep[o] = 1; q.push(o); } } }
    const remap = new Int32Array(nodes.length).fill(-1), N = [];
    nodes.forEach((nd, i) => { if (keep[i]) { remap[i] = N.length; N.push({ id: N.length, x: nd.x, z: nd.z, out: [] }); } });
    const E = [], dropped = [];
    for (const e of edges) {
      if (!keep[e.a]) { dropped.push(e.pts); continue; }
      const ed = { id: E.length, a: remap[e.a], b: remap[e.b], pts: e.pts, w: e.w, kind: e.kind };
      ed.cum = cumOf(ed.pts); ed.len = ed.cum[ed.cum.length - 1];
      ed.rpts = ed.pts.slice().reverse(); ed.rcum = cumOf(ed.rpts);
      ed.bends = ed.kind === "ring" ? [] : findBends(ed);
      E.push(ed);
      N[ed.a].out.push({ e: ed.id, dir: 1 }); N[ed.b].out.push({ e: ed.id, dir: -1 });
    }
    const stats = { nodes: N.length, edges: E.length, junctions: N.filter((n) => n.out.length >= 3).length, deadEnds: N.filter((n) => n.out.length === 1).length,
      km: Math.round(E.reduce((s, e) => s + e.len, 0)), bends: E.reduce((s, e) => s + e.bends.length, 0), crossings: nCross, tees: nT, lines: lines.length,
      byKind: E.reduce((o, e) => ((o[e.kind] = (o[e.kind] || 0) + 1), o), {}), dropped: dropped.length, ms: Math.round(performance.now() - t0) };
    // a grid of the edges' segments for nearest-point queries
    const SG = 120, sgrid = new Map();
    E.forEach((e) => {
      for (let i = 0; i < e.pts.length - 1; i++) {
        const a = e.pts[i], b = e.pts[i + 1];
        for (let cx = Math.floor(Math.min(a[0], b[0]) / SG); cx <= Math.floor(Math.max(a[0], b[0]) / SG); cx++)
          for (let cz = Math.floor(Math.min(a[1], b[1]) / SG); cz <= Math.floor(Math.max(a[1], b[1]) / SG); cz++) {
            const k = gk(cx, cz); let ll = sgrid.get(k); if (!ll) sgrid.set(k, (ll = [])); ll.push(e.id * 4096 + i);
          }
      }
    });
    // the nearest point of the graph to (x, z): its edge, arc length from the edge's a, the distance
    const nearest = (x, z, maxD = 400) => {
      let best = null;
      const r = Math.ceil(maxD / SG), cx0 = Math.floor(x / SG), cz0 = Math.floor(z / SG);
      for (let ring = 0; ring <= r; ring++) {
        for (let cx = cx0 - ring; cx <= cx0 + ring; cx++) for (let cz = cz0 - ring; cz <= cz0 + ring; cz++) {
          if (Math.max(Math.abs(cx - cx0), Math.abs(cz - cz0)) !== ring) continue;
          for (const code of sgrid.get(gk(cx, cz)) || []) {
            const e = E[Math.floor(code / 4096)], i = code % 4096, a = e.pts[i], b = e.pts[i + 1];
            const dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1, t = clamp(((x - a[0]) * dx + (z - a[1]) * dz) / l2, 0, 1);
            const d = Math.hypot(a[0] + dx * t - x, a[1] + dz * t - z);
            if (!best || d < best.d) best = { e: e.id, s: e.cum[i] + Math.sqrt(l2) * t, d };
          }
        }
        if (best && best.d < ring * SG) break;
      }
      return best && best.d <= maxD ? best : null;
    };
    return { N, E, stats, nearest, dropped };
  }

  // the sharp bends of an edge (a→b): runs of turning one way that add up to ≥ 46° within 460 units
  function findBends(e) {
    const STEP = 8, n = Math.floor(e.len / STEP);
    if (n < 4) return [];
    const q = [];
    for (let k = 0; k <= n; k++) q.push(pointAt(e.pts, e.cum, k * STEP));
    const h = [];
    for (let k = 0; k < q.length - 1; k++) h.push(Math.atan2(q[k + 1][0] - q[k][0], q[k + 1][1] - q[k][1]));
    const out = [];
    let k0 = -1, sg = 0, sum = 0, gap = 0, kl = -1;
    const end = () => {
      if (k0 >= 0 && Math.abs(sum) >= 0.8 && (kl - k0 + 1) * STEP <= 460) out.push({ s0: k0 * STEP, s1: (kl + 2) * STEP, sign: Math.sign(sum), ang: sum });
      k0 = -1; sum = 0; gap = 0;
    };
    for (let k = 0; k < h.length - 1; k++) {
      const d = wrapA(h[k + 1] - h[k]);
      if (Math.abs(d) < 0.004) { if (k0 >= 0 && ++gap > 3) end(); continue; }
      const s = Math.sign(d);
      if (k0 >= 0 && s !== sg) end();
      if (k0 < 0) { k0 = k; sg = s; }
      sum += d; gap = 0; kl = k;
    }
    end();
    return out;
  }

  window.czNav2 = function czNav2(H) {
    // the viewport, read on resize only: reading innerWidth in the frame, after the pins have moved, forced a style and
    // layout pass (~3 ms a frame on phones)
    const VP = { w: innerWidth, h: innerHeight };
    addEventListener("resize", () => { VP.w = innerWidth; VP.h = innerHeight; });
    const G = buildGraph(H);
    const { N, E } = G;
    const reduced = () => H.reduced();
    const dpts = (it) => (it.dir > 0 ? E[it.e].pts : E[it.e].rpts);
    const dcum = (it) => (it.dir > 0 ? E[it.e].cum : E[it.e].rcum);
    const endNode = (it) => (it.dir > 0 ? E[it.e].b : E[it.e].a);
    const startNode = (it) => (it.dir > 0 ? E[it.e].a : E[it.e].b);
    // heading leaving the start of a directed edge, and arriving at its end (35 units of chord)
    const outH = (it) => { const p = dpts(it), c = dcum(it), L = c[c.length - 1], a = pointAt(p, c, Math.min(2, L * 0.1)), b = pointAt(p, c, Math.min(35, L * 0.6)); return Math.atan2(b[0] - a[0], b[1] - a[1]); };
    const inH = (it) => { const p = dpts(it), c = dcum(it), L = c[c.length - 1], a = pointAt(p, c, L - Math.min(35, L * 0.6)), b = pointAt(p, c, L - Math.min(2, L * 0.1)); return Math.atan2(b[0] - a[0], b[1] - a[1]); };
    const bendsOf = (it) => { const e = E[it.e]; return it.dir > 0 ? e.bends : e.bends.map((b) => ({ s0: e.len - b.s1, s1: e.len - b.s0, sign: -b.sign, ang: -b.ang })); };
    // the roundabout's ring is one way: counter-clockwise seen from above (right-hand traffic: in to the right, round,
    // out to the right). e.ccw is the direction of each ring edge that goes with the flow
    const ringNodes = new Set();
    for (const e of E) if (e.kind === "ring") {
      const F = H.fork, p0 = e.pts[0], p1 = e.pts[Math.min(3, e.pts.length - 1)];
      e.ccw = wrapA(Math.atan2(p1[1] - F.y, p1[0] - F.x) - Math.atan2(p0[1] - F.y, p0[0] - F.x)) < 0 ? 1 : -1;
      ringNodes.add(e.a); ringNodes.add(e.b);
    }
    const against = (o) => E[o.e].kind === "ring" && o.dir !== E[o.e].ccw;
    // candidates (each with d, its turn from the way you arrive) into ← ↑ →: order kept, ↑ only for a real straight on
    function slots(c) {
      c.sort((a, b) => b.d - a.d);
      const SL = [["l", Math.PI / 2], ["s", 0], ["r", -Math.PI / 2]];
      const ok = (o, s) => (s === "s" ? Math.abs(o.d) < 0.7 : s === "l" ? o.d > 0.22 : o.d < -0.22);
      let best = null;
      const rec = (i, minSlot, cost, asg) => {
        if (i === c.length) { if (!best || cost < best.cost) best = { cost, asg: asg.slice() }; return; }
        rec(i + 1, minSlot, cost + 10, asg);
        for (let s = minSlot; s < 3; s++) if (ok(c[i], SL[s][0])) { asg.push([i, SL[s][0]]); rec(i + 1, s + 1, cost + Math.abs(c[i].d - SL[s][1]), asg); asg.pop(); }
      };
      rec(0, 0, 0, []);
      const ex = { l: null, s: null, r: null, all: c };
      if (best) for (const [i, s] of best.asg) ex[s] = c[i];
      return ex;
    }
    // the exits of the node at the end of a directed edge, sorted into ← ↑ →
    const exitCache = new Map();
    function exitsAt(it) {
      const k = it.e * 2 + (it.dir > 0 ? 1 : 0);
      if (exitCache.has(k)) return exitCache.get(k);
      const n = endNode(it), hin = inH(it);
      let ex;
      if (E[it.e].kind !== "ring" && ringNodes.has(n)) {
        // a roundabout: the choice is the arm you leave by; the ring in between is driven for you, with the flow
        const c = [];
        let m = n, via = [], pre = 0;
        for (let g = 0; g < 16; g++) {
          const r = N[m].out.find((o) => E[o.e].kind === "ring" && o.dir === E[o.e].ccw);
          if (!r) break;
          via = via.concat([{ e: r.e, dir: r.dir }]); pre += E[r.e].len; m = endNode(r);
          if (m === n) break;
          for (const o of N[m].out) if (E[o.e].kind !== "ring") c.push({ e: o.e, dir: o.dir, via, pre, d: wrapA(outH(o) - hin) });
        }
        ex = slots(c.filter((o) => Math.abs(o.d) < 2.7));
        ex.round = true;
      } else {
        ex = slots(N[n].out.filter((o) => !(o.e === it.e && o.dir === -it.dir) && !against(o)).map((o) => ({ e: o.e, dir: o.dir, d: wrapA(outH(o) - hin) })).filter((o) => Math.abs(o.d) < 2.7));
      }
      exitCache.set(k, ex);
      return ex;
    }

    // ---------- places on the graph, and the quarters ----------
    const PL = [];
    for (const pl of H.places) {
      if (pl.find || pl.unmarked || pl.small) continue;
      const st = pl.stop ? H.stops.find((s) => s.id === pl.stop) : null;
      const x = st ? st.x : pl.x ?? pl.px, z = st ? st.y : pl.z ?? pl.pz;
      if (x == null || z == null) continue;
      const a = G.nearest(x, z, 160);
      if (!a) continue;
      PL.push({ pl, x, z, e: a.e, s: a.s, q: pl.br || null });
    }
    const byEdge = new Map();
    for (const p of PL) { let l = byEdge.get(p.e); if (!l) byEdge.set(p.e, (l = [])); l.push(p); }
    // the quarters are the portfolio streets themselves (each from the roundabout to the Dacia row; the lane belongs to
    // Medical Avenue, the road on to Olari 9 is its own): you are in a quarter within 340 units of its street, and in none round the roundabout
    const QL = [];
    {
      const F = H.fork, st = H.streets;
      for (const k of ["A", "B", "C", "D"]) {
        const pts = H.rounded(st[k], 160).map(([x, z]) => [x, z]).filter(([x, z]) => Math.hypot(x - F.x, z - F.y) > 200 && (k === "D" || !(z > 6090 && x < 1260)) && (k !== "C" || z < 6090));
        QL.push([k, pts]);
      }
      QL.push(["C", st.lane.map(([x, z]) => [x, z])]);
    }
    const segD = (x, z, pts) => { let b = Infinity; for (let i = 0; i < pts.length - 1; i++) { const a = pts[i], c = pts[i + 1], dx = c[0] - a[0], dz = c[1] - a[1], l2 = dx * dx + dz * dz || 1, t = clamp(((x - a[0]) * dx + (z - a[1]) * dz) / l2, 0, 1); b = Math.min(b, Math.hypot(a[0] + dx * t - x, a[1] + dz * t - z)); } return b; };
    function quarterAt(x, z) {
      if (Math.hypot(x - H.fork.x, z - H.fork.y) < 300) return null;
      let best = null, bd = 340;
      for (const [k, pts] of QL) { const d = segD(x, z, pts); if (d < bd) { bd = d; best = k; } }
      return best;
    }
    for (const p of PL) if (!p.q) p.q = p.z > 6040 ? "D" : quarterAt(p.x, p.z) || "D";

    // ===================== 2. driving =====================
    const VMAX = 430, VREV = 140, ACC = 250, ACC_REV = 150, COAST = 300, BRAKE = 460, HARD = 950, ALAT = 1300, WINDOW = 360;
    const D = {
      seq: [], px: [], pz: [], cum: [], kap: [], total: 0, C: 0, v: 0, uid: 1,
      cleared: new Set(), goUntil: -1, auto: null, uturn: null, kturn: null, revSteer: null, wasRev: false, backHold: false, downT: 0,
      keys: { u: false, d: false, l: false, r: false }, ready: false, view: "sat", streetT: 0, camPull: 1, camUp: 0, camOver: 0, camLag: 0, camK: 0, camH: null,
      lastArr: null, cardFor: null, firstDrive: true
    };
    // the corner at a node: as wide as the narrower road allows (a lane change is a light blend), a tighter one on the
    // roundabout's ring; never more than 42% of either edge
    function filletR(a, b) {
      const ea = E[a.e], eb = E[b.e], phi = Math.abs(wrapA(outH(b) - inH(a)));
      let r = phi < 0.15 ? 10 : ea.kind === "ring" || eb.kind === "ring" ? 24 : Math.min(ea.w, eb.w) * 0.5 + 16;
      if (phi > 2) r *= 0.75;
      return Math.min(r, ea.len * 0.42, eb.len * 0.42);
    }
    const gapOf = (it) => Math.min(48, E[it.e].len * 0.42) + 6; // the stop line before a node
    // the path the car drives: the directed edges of D.seq, joined with a rounded corner at each node
    function buildPath() {
      const P = [];
      const S = D.seq;
      const rAt = (k) => filletR(S[k], S[k + 1]);
      let rin = 0;
      for (let k = 0; k < S.length; k++) {
        const it = S[k], p = dpts(it), c = dcum(it), len = c[c.length - 1];
        const rout = k < S.length - 1 ? rAt(k) : 0;
        const from = rin, to = len - rout;
        const Lstart = P.length ? P.cumL : 0;
        if (!P.length) { P.push(pointAt(p, c, from)); P.cumL = 0; }
        it.L0 = Lstart - from;
        for (let i = 0; i < p.length; i++) if (c[i] > from + 0.5 && c[i] < to - 0.5) pushP(P, p[i]);
        pushP(P, pointAt(p, c, to));
        it.L1 = P.cumL + rout;
        if (k < S.length - 1) {
          const nxt = S[k + 1], q = dpts(nxt), qc = dcum(nxt);
          const A = pointAt(p, c, to), M = p[p.length - 1], Bp = pointAt(q, qc, rout);
          for (let j = 1; j <= 12; j++) { const t = j / 12, u = 1 - t; pushP(P, [u * u * A[0] + 2 * u * t * M[0] + t * t * Bp[0], u * u * A[1] + 2 * u * t * M[1] + t * t * Bp[1]]); }
        }
        rin = rout;
      }
      D.px = P.map((p) => p[0]); D.pz = P.map((p) => p[1]);
      D.cum = cumOf(P); D.total = D.cum[D.cum.length - 1];
      // curvature per point, for the speed in the bends
      D.kap = P.map((p, i) => {
        if (i === 0 || i === P.length - 1) return 0;
        const h1 = Math.atan2(p[0] - P[i - 1][0], p[1] - P[i - 1][1]), h2 = Math.atan2(P[i + 1][0] - p[0], P[i + 1][1] - p[1]);
        return Math.abs(wrapA(h2 - h1)) / Math.max(4, (D.cum[i + 1] - D.cum[i - 1]) / 2);
      });
      return P;
    }
    function pushP(P, q) {
      const last = P[P.length - 1];
      const d = Math.hypot(q[0] - last[0], q[1] - last[1]);
      if (d < 0.4) return;
      P.push(q); P.cumL += d;
    }
    function pathPos(L) {
      const n = D.cum.length;
      if (L <= 0) return [D.px[0], D.pz[0]];
      if (L >= D.total) return [D.px[n - 1], D.pz[n - 1]];
      let lo = 0, hi = n - 1;
      while (lo < hi - 1) { const m = (lo + hi) >> 1; if (D.cum[m] <= L) lo = m; else hi = m; }
      const f = (L - D.cum[lo]) / (D.cum[hi] - D.cum[lo] || 1);
      return [D.px[lo] + (D.px[hi] - D.px[lo]) * f, D.pz[lo] + (D.pz[hi] - D.pz[lo]) * f];
    }
    // the arc length on the current path nearest to (x, z), searched around a guess
    function locate(x, z, guess = null, win = 1e9) {
      let best = 0, bd = Infinity;
      for (let i = 0; i < D.px.length - 1; i++) {
        if (guess != null && (D.cum[i + 1] < guess - win || D.cum[i] > guess + win)) continue;
        const ax = D.px[i], az = D.pz[i], dx = D.px[i + 1] - ax, dz = D.pz[i + 1] - az, l2 = dx * dx + dz * dz || 1;
        const t = clamp(((x - ax) * dx + (z - az) * dz) / l2, 0, 1), d = Math.hypot(ax + dx * t - x, az + dz * t - z);
        if (d < bd) { bd = d; best = D.cum[i] + Math.sqrt(l2) * t; }
      }
      return best;
    }
    const pathPts = () => D.px.map((x, i) => [x, D.pz[i]]);
    // the path is re-based (L shifts): everything kept in path units shifts with it
    function apply(L, C) { const dL = L - H.state.L; if (D.goUntil > 0 && isFinite(D.goUntil)) D.goUntil += dL; H.rebase(pathPts(), L, C); D.C = C; }
    function ciOf(L) { let k = 0; for (let i = 0; i < D.seq.length; i++) if (D.seq[i].L0 <= L + 0.01) k = i; return k; }
    function place() {
      // put the car on the graph where it stands, facing the way it faces
      const R = H.route(), c = R.posAt(H.state.L), t = R.tangentAt(H.state.L);
      const a = G.nearest(c.x, c.z, 600);
      if (!a) return false;
      const e = E[a.e], p = pointAt(e.pts, e.cum, Math.min(e.len, a.s + 4)), p0 = pointAt(e.pts, e.cum, Math.max(0, a.s - 4));
      const dir = (p[0] - p0[0]) * t.x + (p[1] - p0[1]) * t.z >= 0 ? 1 : -1;
      D.seq = [{ e: a.e, dir, uid: D.uid++, fresh: true }];
      buildPath();
      const L = locate(c.x, c.z);
      D.v = 0; D.auto = null; D.uturn = null; D.cleared.clear();
      apply(L, L);
      return true;
    }
    function commit(it) {
      for (const v of it.via || []) D.seq.push({ e: v.e, dir: v.dir, uid: D.uid++ });
      D.seq.push({ e: it.e, dir: it.dir, uid: D.uid++ });
      const L = H.state.L, C = D.C;
      buildPath();
      apply(L, C); // the path before the new corner is unchanged: same L
    }
    function trim() {
      const L = H.state.L;
      if (D.seq.length < 3 || D.v < 0) return;
      const ci = ciOf(L);
      if (ci < 1 || L < D.seq[1].L0 + 90) return;
      const [x, z] = pathPos(L), [cx, cz] = pathPos(D.C), old1 = D.seq[1].L0;
      D.seq.shift();
      buildPath();
      const nL = locate(x, z, L - old1, 80), nC = locate(cx, cz, D.C - old1, 80);
      apply(nL, Math.max(nL, nC));
    }
    // the next thing that needs a choice: the junction at the end of the path, or a dead end
    // round 2 (Daniel): a bend with no choice is no decision: ↑ carries you round it (the speed follows its curve);
    // ← → are asked only at real choices, the junctions and the roundabout's exits
    function nextDecision(L) {
      const last = D.seq[D.seq.length - 1], n = endNode(last);
      if (N[n].out.length <= 1) return { type: "end", key: "end:" + last.uid, L: last.L1, it: last };
      const ex = exitsAt(last);
      return { type: "junction", key: "j:" + last.uid, L: last.L1, it: last, ex, node: n, gap: gapOf(last) };
    }
    // the rides that turn on the spot (the scooter, the submarine, the plane); every car reverses instead
    const pivots = () => { const id = H.vehicle(); return id === "scooter" || id === "sub" || id === "plane"; };
    const reversing = () => D.v < -0.5 || (D.keys.d && D.v <= 0.5 && !pivots() && !D.kturn);
    // the side streets a reversing car can back into, at the node behind it
    function backInto(L) {
      const ci = ciOf(L), it = D.seq[ci], B = startNode(it), h0 = outH(it), rin = ci > 0 ? filletR(D.seq[ci - 1], it) : 0;
      if (L - it.L0 > 140 || L - it.L0 < rin + 3) return null;
      const c = N[B].out.filter((o) => !(o.e === it.e && o.dir === it.dir) && E[o.e].kind !== "ring").map((o) => ({ ...o, d: wrapA(outH(o) - h0) }));
      const side = (sg) => c.filter((o) => sg * o.d > 0.3 && sg * o.d < 2.6).sort((a, b) => Math.abs(Math.abs(a.d) - Math.PI / 2) - Math.abs(Math.abs(b.d) - Math.PI / 2))[0] || null;
      return { ci, it, l: side(1), r: side(-1), back: c.filter((o) => Math.abs(o.d) >= 2.6).sort((a, b) => Math.abs(b.d) - Math.abs(a.d))[0] || null };
    }
    function reverseInto(o, L) {
      const ci = ciOf(L), [x, z] = pathPos(L), [cx, cz] = pathPos(D.C), off = L - D.seq[ci].L0;
      D.seq = [{ e: o.e, dir: -o.dir, uid: D.uid++ }, ...D.seq.slice(ci)];
      buildPath();
      const g = D.seq[1].L0 + off;
      apply(locate(x, z, g, 60), locate(cx, cz, g + (D.C - L), 60));
    }
    // a key: what it does here
    function valid(dec, L) {
      const near = dec && dec.L - L < WINDOW;
      const stopped = Math.abs(D.v) < 8;
      const v = { u: true, d: true, l: false, r: false };
      if (D.kturn || D.uturn) return { u: false, d: false, l: false, r: false };
      if (reversing()) { const b = backInto(L); v.l = !!b?.l; v.r = !!b?.r; return v; }
      if (!dec) return v;
      if (dec.type === "bend" && near) { v[dec.side] = true; if (stopped && dec.L - L < 34) v.u = false; }
      if (dec.type === "junction" && near) { v.l = !!dec.ex.l; v.r = !!dec.ex.r; if (!dec.ex.s && stopped && dec.L - L < dec.gap + 40) v.u = false; }
      if (dec.type === "end" && stopped && dec.L - L < 60) v.u = false;
      return v;
    }
    function press(k) {
      if (!D.ready || D.kturn || D.uturn) return;
      if (D.auto) stopAuto();
      H.follow();
      D.firstDrive && firstDrive();
      const L = H.state.L, dec = nextDecision(L);
      if (k === "d") {
        D.downT = 0; D.goUntil = -1;
        if (Math.abs(D.v) < 40 && pivots()) { uturn(); return; }
        if (Math.abs(D.v) < 6 && dec && dec.type === "end" && dec.L - L < 44) kturn();
        return;
      }
      // reversing: ← → back into the side street at the node behind
      if ((k === "l" || k === "r") && reversing()) { D.revSteer = k; flashKey(k); return; }
      if (!dec || dec.L - L > 600) { if (k !== "u") nope(k); return; }
      if (dec.type === "bend") {
        if (k === dec.side) { D.cleared.add(dec.key); D.goUntil = dec.Lend + 20; flashKey(k); return; }
        if (k !== "u") nope(k);
        return;
      }
      if (dec.type === "junction") {
        const o = dec.ex[k];
        if (!o) { if (k !== "u") nope(k); return; }
        if (k === "u" && (!D.keys.u || dec.L - L > WINDOW)) return;
        commit(o);
        D.goUntil = dec.L + 40 + (o.pre || 0);
        flashKey(k);
        return;
      }
      if (k !== "u") nope(k);
    }
    // a turn picked on the panel: taken at the next junction, however far it is
    function choose(k) {
      if (D.auto) stopAuto();
      H.follow();
      const L = H.state.L, dec = nextDecision(L);
      if (dec && dec.type === "junction" && dec.ex[k] && dec.L - dec.gap >= L - 1) { commit(dec.ex[k]); flashKey(k); render(true); }
      else nope(k);
    }
    // the rides that can: a half circle on the spot from one lane to the other
    function uturn() {
      const L = H.state.L, it = D.seq[ciOf(L)];
      if (E[it.e].kind === "ring") { nope("d"); return; }
      const [x, z] = pathPos(L), [x2, z2] = pathPos(Math.min(D.total, L + 6)), [x1, z1] = pathPos(Math.max(0, L - 6));
      let fx = x2 - x1, fz = z2 - z1; const fl = Math.hypot(fx, fz) || 1; fx /= fl; fz /= fl;
      D.seq = [{ e: it.e, dir: -it.dir, uid: D.uid++, fresh: true }];
      buildPath();
      const nL = locate(x, z);
      D.v = 0;
      apply(nL, nL);
      D.uturn = { t: 0, dur: reduced() ? 0.35 : 1.05, cx: x, cz: z, fx, fz, rx: -fz, rz: fx };
      D.backHold = D.keys.d;
    }
    // a car at a dead end: a three-point turn (forward and left across the road, back and right, forward and away)
    const KT = [[0, 11, 0], [17, -6, 1.6], [6, 4, 2.35], [-4, -11, Math.PI]], KTD = [0.95, 0.8, 0.95], KTS = [1, -1, 1];
    function kturn() {
      const L = H.state.L, it = D.seq[ciOf(L)];
      const [x, z] = pathPos(L), [x2, z2] = pathPos(Math.min(D.total, L + 6)), [x1, z1] = pathPos(Math.max(0, L - 6));
      let fx = x2 - x1, fz = z2 - z1; const fl = Math.hypot(fx, fz) || 1; fx /= fl; fz /= fl;
      D.seq = [{ e: it.e, dir: -it.dir, uid: D.uid++, fresh: true }];
      buildPath();
      const nL = locate(x - fx * 4, z - fz * 4);
      D.v = 0;
      apply(nL, nL);
      D.kturn = { t: 0, k: reduced() ? 0.6 : 1, cx: x, cz: z, fx, fz, rx: -fz, rz: fx };
    }
    function stopAuto() { D.auto = null; H.mapNav.place = null; H.mark(); render(true); }
    // ---------- auto-pilot: the shortest way along the graph to a place, the junctions taken for you ----------
    function plan(target) {
      // target: { e, s } (s from the edge's a)
      const L = H.state.L, it = D.seq[ciOf(L)], e = E[it.e];
      const sDir = clamp(L - it.L0, 0, e.len); // along the directed edge
      const tE = E[target.e];
      const tsDir = it.dir > 0 ? target.s : tE.len - target.s;
      if (target.e === it.e && tsDir >= sDir - 4) return { legs: [], uturn: false, cost: tsDir - sDir };
      const piv = pivots() && e.kind !== "ring";
      if (piv && target.e === it.e && sDir - tsDir < 400) return { legs: [], uturn: true, cost: sDir - tsDir + 90 };
      const n = N.length, dist0 = new Float64Array(n).fill(Infinity), prev = new Int32Array(n).fill(-1), pe = new Int32Array(n).fill(-1), pd = new Int8Array(n);
      const heap = [];
      const push = (d, v) => { heap.push([d, v]); let i = heap.length - 1; while (i > 0) { const p = (i - 1) >> 1; if (heap[p][0] <= heap[i][0]) break; [heap[p], heap[i]] = [heap[i], heap[p]]; i = p; } };
      const pop = () => { const top = heap[0], last = heap.pop(); if (heap.length) { heap[0] = last; let i = 0; for (;;) { const l = 2 * i + 1, r = l + 1; let m = i; if (l < heap.length && heap[l][0] < heap[m][0]) m = l; if (r < heap.length && heap[r][0] < heap[m][0]) m = r; if (m === i) break; [heap[m], heap[i]] = [heap[i], heap[m]]; i = m; } } return top; };
      const fwdN = endNode(it), backN = startNode(it), deadAhead = N[fwdN].out.length === 1;
      dist0[fwdN] = e.len - sDir + (deadAhead ? 160 : 0); pd[fwdN] = 1; push(dist0[fwdN], fwdN);
      if (piv) { const back = sDir + 90; if (back < dist0[backN]) { dist0[backN] = back; pd[backN] = -1; push(back, backN); } }
      while (heap.length) {
        const [d, u] = pop();
        if (d > dist0[u]) continue;
        for (const o of N[u].out) {
          if (against(o)) continue; // the ring only with the flow
          if (o.e === it.e && prev[u] === -1 && !(u === fwdN && deadAhead)) continue; // not back along your own edge (but out of a dead end, after the three-point turn)
          const ed = E[o.e], v = o.dir > 0 ? ed.b : ed.a, nd = d + ed.len;
          if (nd < dist0[v]) { dist0[v] = nd; prev[v] = u; pe[v] = o.e * 2 + (o.dir > 0 ? 1 : 0); pd[v] = pd[u]; push(nd, v); }
        }
      }
      const viaA = dist0[tE.a] + target.s, viaB = dist0[tE.b] + (tE.len - target.s);
      let endN, last;
      if (viaA <= viaB) { endN = tE.a; last = { e: tE.id, dir: 1 }; } else { endN = tE.b; last = { e: tE.id, dir: -1 }; }
      if (!isFinite(Math.min(viaA, viaB))) return null;
      const legs = [];
      for (let v = endN; prev[v] !== -1; v = prev[v]) legs.push({ e: pe[v] >> 1, dir: pe[v] & 1 ? 1 : -1 });
      legs.reverse();
      if (!(legs.length === 0 && last.e === it.e && last.dir === it.dir)) legs.push(last);
      return { legs, uturn: pd[endN] === -1, cost: Math.min(viaA, viaB) };
    }
    function goTo(target, pl) {
      if (!D.ready && !place()) return false;
      D.ready = true;
      if (D.kturn || D.uturn) return false;
      // drop the corners already chosen beyond the car
      const L = H.state.L, ci = ciOf(L);
      if (D.seq.length > ci + 1 && L < D.seq[ci].L1 - gapOf(D.seq[ci])) { D.seq.length = ci + 1; buildPath(); apply(L, clamp(D.C, L, D.total)); }
      // round 2 (Daniel): a place close behind, on the road you just drove: the car backs up to it (lamps on); turning
      // round is for the longer trips
      if (!pivots()) {
        for (let k = ci; k >= 0; k--) {
          const it = D.seq[k];
          if (it.e !== target.e) continue;
          const sd = it.dir > 0 ? target.s : E[it.e].len - target.s, Lt = it.L0 + sd;
          if (Lt < L - 8 && L - Lt < 350 && Lt > 2) {
            D.auto = { pl, target, legs: [], rev: true, Lt };
            D.goUntil = -1;
            H.mapNav.place = pl && !pl.tap ? pl : null; H.mark(); H.follow();
            if (D.firstDrive) firstDrive();
            render(true);
            return true;
          }
          break;
        }
      }
      const p = plan(target);
      if (!p) return false;
      // legs already on the path (a corner taken too late to drop) are skipped
      while (p.legs.length && D.seq.slice(ci + 1).some((q) => q.e === p.legs[0].e && q.dir === p.legs[0].dir)) p.legs.shift();
      D.auto = { pl, target, legs: p.legs, uturn: p.uturn };
      D.goUntil = -1;
      H.mapNav.place = pl && !pl.tap ? pl : null; H.mark();
      H.follow();
      if (D.firstDrive) firstDrive();
      render(true);
      return true;
    }
    // the stop for the place on the path, if its edge is on the path: a little short of it, the car parks beside it
    function autoStopL() {
      const a = D.auto; if (!a || a.uturn || a.rev || a.legs.length) return null;
      for (let k = D.seq.length - 1; k >= ciOf(H.state.L); k--) {
        const it = D.seq[k];
        if (it.e !== a.target.e) continue;
        const e = E[it.e], s = it.dir > 0 ? a.target.s : e.len - a.target.s;
        return Math.max(it.L0 + s - (a.pl && !a.pl.tap ? 18 : 0), 0);
      }
      return null;
    }
    function arrive(pl) {
      D.arrT = performance.now();
      D.lastArr = pl;
      D.cardFor = pl;
      H.arrive(pl);
      if (D.streetT > 0.5 || !H.wantsCine()) H.cineStop();
      render(true);
    }

    // ---------- the frame: from the keys (or the auto-pilot) to the carrot the car's own spring follows ----------
    let panelT = 0;
    function tick(dt, now) {
      if (!H.ready()) return;
      if (!D.ready) { if (!place()) return; D.ready = true; render(true); }
      const L = H.state.L;
      if (D.uturn || D.kturn) {
        const m = D.uturn || D.kturn;
        m.t += dt;
        D.C = L; H.setTarget(L); D.v = 0;
        const done = D.uturn ? m.t >= m.dur : m.t * (1 / m.k) >= KTD[0] + KTD[1] + KTD[2];
        if (done) { if (D.uturn && D.keys.d && D.backHold) D.goUntil = Infinity; D.uturn = D.kturn = null; render(true); }
        lamps(D.kturn ? ktSeg() === 1 : false);
        ui(L, null);
        return;
      }
      if (D.goUntil === Infinity && !D.keys.d) D.goUntil = -1;
      trim();
      const L2 = H.state.L;
      let dec = nextDecision(L2);
      // the auto-pilot takes the junctions, the roundabouts and the bends itself
      if (D.auto && !D.auto.rev) {
        if (D.auto.uturn) {
          if (Math.abs(D.v) < 6 && Math.abs(D.C - L2) < 6) { const a = D.auto; uturn(); a.uturn = false; D.auto = a; }
        } else if (dec && dec.L - L2 < WINDOW) {
          const As0 = autoStopL();
          if (dec.type === "bend" && (As0 == null || dec.L < As0)) { D.cleared.add(dec.key); dec = nextDecision(L2); }
          const last = D.seq[D.seq.length - 1], nx = D.auto.legs[0];
          if (dec && dec.type === "junction" && nx) {
            if (nx.e === last.e && nx.dir === last.dir) D.auto.legs.shift();
            else if (N[endNode(last)].out.some((o) => o.e === nx.e && o.dir === nx.dir)) {
              D.auto.legs.shift(); commit(nx);
              while (E[nx.e].kind === "ring" && D.auto.legs.length) { const n2 = D.auto.legs.shift(); commit(n2); if (E[n2.e].kind !== "ring") break; }
              dec = nextDecision(H.state.L);
            }
          } else if (dec && dec.type === "end" && nx && nx.e === last.e && nx.dir === -last.dir && Math.abs(D.v) < 3 && dec.L - L2 < 44) {
            const a = D.auto; kturn(); a.legs.shift(); D.auto = a; return;
          }
        }
      }
      // ↑ held into a junction that goes straight on: straight on
      if (!D.auto && D.keys.u && D.v >= 0 && dec && dec.type === "junction" && dec.ex.s && dec.L - L2 < 70 + D.v * 0.45) { commit(dec.ex.s); dec = nextDecision(H.state.L); }
      let Lc = H.state.L;
      // after reversing, driving on again: the choices made beyond the car are dropped (you choose again)
      if (D.wasRev && D.keys.u && D.v >= 0) {
        D.wasRev = false;
        const ci = ciOf(Lc);
        if (D.seq.length > ci + 1 && Lc < D.seq[ci].L1 - gapOf(D.seq[ci])) { D.seq.length = ci + 1; buildPath(); apply(Lc, Lc); dec = nextDecision(Lc); }
      }
      const autoRev = !!(D.auto && D.auto.rev);
      const auto = D.auto && !D.auto.uturn && !autoRev;
      const fwdIn = (D.keys.u || auto || D.goUntil > Lc || D.goUntil === Infinity) && !(D.keys.d && D.goUntil !== Infinity);
      const rev = (D.keys.d && D.v <= 0.5 && !pivots() && !D.auto) || (autoRev && D.v <= 0.5); // ↓ held (or backing up to a place): reverse
      // and going back: the start of the path, unless you back into a street there
      let Lb = 4;
      if ((rev || D.v < -0.5) && !autoRev) {
        D.wasRev = true;
        const b = backInto(Lc);
        if (b) {
          const steer = D.keys.l ? "l" : D.keys.r ? "r" : D.revSteer;
          const pick = steer ? b[steer] : b.ci === 0 ? b.back : null;
          if (pick && !(b.ci > 0 && D.seq[b.ci - 1].e === pick.e && D.seq[b.ci - 1].dir === -pick.dir)) { reverseInto(pick, Lc); D.revSteer = null; Lc = H.state.L; dec = nextDecision(Lc); }
        }
      }
      // where the carrot must stop going forward: the next undecided choice, or the auto-pilot's place
      let Ls = D.total - 2;
      if (dec) Ls = dec.type === "bend" ? dec.L - 4 : dec.type === "junction" ? dec.L - dec.gap : dec.L - 16;
      const As = autoStopL();
      if (As != null) Ls = Math.min(Ls, As);
      Ls = Math.max(Ls, Math.min(D.C, dec ? dec.L - 6 : D.total));
      if (autoRev) Lb = D.auto.Lt;
      let want;
      if (rev) want = D.v > 0.5 ? 0 : Math.max(-VREV, -Math.sqrt(2 * BRAKE * Math.max(0, D.C - Lb)));
      else if (D.v < -0.5) want = 0; // ↓ let go while backing: it rolls to a stop
      else {
        want = fwdIn ? VMAX : 0;
        want = Math.min(want, Math.sqrt(2 * BRAKE * Math.max(0, Ls - D.C)));
        // the bends ahead: the speed their curvature allows, braked for in time
        const look = (D.v * D.v) / (2 * BRAKE) + 40;
        let i = 0; while (i < D.cum.length - 1 && D.cum[i] < D.C) i++;
        for (; i < D.cum.length && D.cum[i] < D.C + look; i++) {
          const k = D.kap[i]; if (k < 1e-4) continue;
          want = Math.min(want, Math.sqrt(ALAT / k + 2 * BRAKE * Math.max(0, D.cum[i] - D.C)));
        }
      }
      if (D.v === 0 && want !== 0) D.C = Lc; // pulling away (either way) from where the car is
      const speedUp = Math.abs(want) > Math.abs(D.v) && want * D.v >= 0;
      const rate = speedUp ? (want < 0 ? ACC_REV : ACC * (1 - 0.45 * Math.min(1, D.v / VMAX))) : (D.keys.d && D.v > 0) || (fwdIn && D.v < 0) ? HARD : fwdIn || rev ? BRAKE : COAST;
      const nv = D.v < want ? Math.min(want, D.v + rate * dt) : Math.max(want, D.v - rate * dt);
      D.v = D.v * nv < 0 ? 0 : nv;
      D.C = clamp(D.C + D.v * dt, Lb, Math.max(Ls, Lb));
      if ((D.C >= Ls - 0.01 && want <= 0.5 && D.v > 0) || (D.C <= Lb + 0.01 && D.v < 0)) D.v = 0;
      if (D.v > 0) D.C = Math.max(D.C, Lc - 0.5);
      H.setTarget(D.C);
      lamps(D.v < -0.5 || (rev && Math.abs(D.v) < 0.5 && (D.keys.d || autoRev)));
      // arrivals
      if (autoRev && Math.abs(Lc - D.auto.Lt) < 6 && Math.abs(D.v) < 3) {
        const pl = D.auto.pl;
        D.auto = null;
        if (pl && !pl.tap) arrive(pl); else { if (pl) H.arrive(pl); H.mapNav.place = null; H.mark(); }
        render(true);
      } else if (D.auto && As != null && Math.abs(Lc - As) < 6 && Math.abs(D.v) < 3) {
        const pl = D.auto.pl;
        D.auto = null;
        if (pl) arrive(pl); else { H.mapNav.place = null; H.mark(); }
        render(true);
      } else if (!D.auto && D.v === 0 && Math.abs(D.C - Lc) < 3 && !D.keys.d) {
        const here = hereAt();
        if (here && here.pl !== D.lastArr) arrive(here.pl);
      }
      if (D.lastArr) { const p = PL.find((q) => q.pl === D.lastArr); if (p && Math.hypot(H.carPos.x - p.x, H.carPos.z - p.z) > 200) { D.lastArr = null; if (D.cardFor) { H.hideCard(); D.cardFor = null; } if (!D.auto) { H.mapNav.place = null; H.mark(); } } }
      ui(Lc, dec);
      tutTick();
      panelT -= dt;
      if (panelT <= 0) { panelT = 0.22; document.body.classList.toggle("n2-card", H.cardOpen()); render(); }
    }
    let lampOn = false;
    function lamps(on) { lampOn = on; H.reverseLamps(on); }
    function hereAt() {
      let best = null;
      for (const p of PL) { const d = Math.hypot(H.carPos.x - p.x, H.carPos.z - p.z); if (d < 75 && (!best || d < best.d)) best = { pl: p.pl, d, p }; }
      return best;
    }
    const ktSeg = () => { const m = D.kturn, t = m.t / m.k; return t < KTD[0] ? 0 : t < KTD[0] + KTD[1] ? 1 : 2; };
    // the car's pose while it turns round: on the spot (the rides that can), or the three-point turn
    function pose(carPos, carTan) {
      const u = D.uturn;
      if (u) {
        const ph = Math.PI * sss(clamp(u.t / u.dur, 0, 1)), r = 11;
        carPos.x = u.cx + r * (u.rx * Math.cos(ph) + u.fx * Math.sin(ph) * 1.2);
        carPos.z = u.cz + r * (u.rz * Math.cos(ph) + u.fz * Math.sin(ph) * 1.2);
        carTan.set(-u.rx * Math.sin(ph) + u.fx * Math.cos(ph), 0, -u.rz * Math.sin(ph) + u.fz * Math.cos(ph)).normalize();
        return;
      }
      const m = D.kturn;
      if (!m) return;
      const t = m.t / m.k, i = ktSeg(), t0 = i === 0 ? 0 : i === 1 ? KTD[0] : KTD[0] + KTD[1], uu = clamp((t - t0) / KTD[i], 0, 1), e = uu * uu * (3 - 2 * uu);
      const [f0, r0, a0] = KT[i], [f1, r1, a1] = KT[i + 1], sg = KTS[i];
      // Hermite between the two key poses, its ends along the car's nose (forward) or tail (reverse)
      const len = Math.hypot(f1 - f0, r1 - r0) * 1.25, d0 = [Math.cos(a0) * sg * len, -Math.sin(a0) * sg * len], d1 = [Math.cos(a1) * sg * len, -Math.sin(a1) * sg * len];
      const h00 = 2 * e ** 3 - 3 * e * e + 1, h10 = e ** 3 - 2 * e * e + e, h01 = -2 * e ** 3 + 3 * e * e, h11 = e ** 3 - e * e;
      const pf = h00 * f0 + h10 * d0[0] + h01 * f1 + h11 * d1[0], pr = h00 * r0 + h10 * d0[1] + h01 * r1 + h11 * d1[1], a = a0 + (a1 - a0) * e;
      carPos.x = m.cx + pf * m.fx + pr * m.rx; carPos.z = m.cz + pf * m.fz + pr * m.rz;
      carTan.set(Math.cos(a) * m.fx - Math.sin(a) * m.rx, 0, Math.cos(a) * m.fz - Math.sin(a) * m.rz).normalize();
    }

    // ===================== 2b. the body: weight, bounce, the engine =====================
    // on top of the ride's own springs (VEH_MOTION): the nose lifts as it pulls away and dips as it brakes (from the
    // carrot's own acceleration, so it reads at the map's scale), with a slightly underdamped bounce; stopped, the engine
    // trembles lightly (not the electric scooter); at speed a faint road buzz. None of it with reduced motion
    const BODY = { p: 0, pv: 0, h: 0, hv: 0, acc: 0, vp: 0, idle: 0, ride: 1.2 };
    const ENGINE = { dacia1300: 1, cop: 1, groovy: 1.3, foodvan: 1.5, monopoly: 1, f1: 1.6, plane: 0.6, sub: 0.3, scooter: 0 };
    function body(g, dt, now) {
      if (!D.ready || dt <= 0) return;
      const red = reduced(), spr = (k, kv, target, w, z) => { const n = Math.max(1, Math.ceil(dt * w / 0.4)), h = dt / n; for (let i = 0; i < n; i++) { BODY[kv] += (w * w * (target - BODY[k]) - 2 * z * w * BODY[kv]) * h; BODY[k] += BODY[kv] * h; } };
      const a = (D.v - BODY.vp) / dt; BODY.vp = D.v;
      BODY.acc += (clamp(a, -1500, 1500) - BODY.acc) * (1 - Math.exp(-dt * 10));
      spr("p", "pv", red ? 0 : clamp(-BODY.acc * 6e-5, -0.05, 0.05), 7.5, 0.42);
      g.rotation.x += BODY.p;
      // round 2 (Daniel: "the wheels sink into the road"): the tyres sit on the asphalt. The car rides at the height of the
      // road under it (the gold roads stand 1.3 up, the boulevards 0.55, the side streets 0.35; plus a little for the depth
      // offset the roads are drawn with), eased between them; and the pitch and the roll, which turn the whole ride
      // (wheels too), lift it by as much as they would push its lowest tyre under
      {
        const a = G.nearest(H.carPos.x, H.carPos.z, 80), kind = a ? E[a.e].kind : "minor";
        const surf = kind === "drive" || kind === "ring" ? 1.75 : kind === "long" ? 0.85 : 0.65;
        BODY.ride += (surf - BODY.ride) * (1 - Math.exp(-dt * 5));
        const [hw, ht] = H.vehSpan?.() || [20, 10];
        g.position.y += BODY.ride + Math.abs(Math.sin(g.rotation.x)) * hw + Math.abs(Math.sin(g.rotation.z)) * ht;
      }
      if (red) return;
      const eng = ENGINE[H.vehicle()] ?? 1, still = Math.abs(D.v) < 4 && !D.kturn && !D.uturn;
      BODY.idle += ((still ? 1 : 0) - BODY.idle) * (1 - Math.exp(-dt * (still ? 2 : 8)));
      const t = now * 0.001, sp = Math.min(1, Math.abs(D.v) / VMAX);
      const idle = BODY.idle * eng, buzz = sp * sp * 0.6 * eng;
      if (idle > 1e-3 || buzz > 1e-3) {
        // round 2 (Daniel: "too strong"): about a fifth of r1, barely there: a hum, not a shake
        g.position.y += (Math.sin(t * 108) * 0.014 + Math.sin(t * 171 + 1.3) * 0.009) * idle + Math.sin(t * 61 + 0.7) * 0.03 * buzz;
        g.rotation.z += (Math.sin(t * 93 + 0.4) * 0.0006 + Math.sin(t * 137) * 0.00035) * idle + Math.sin(t * 47) * 0.0008 * buzz;
        g.rotation.x += Math.sin(t * 119 + 2.1) * 0.0003 * idle;
      }
    }

    // ===================== 3. the cameras =====================
    const V3 = (x, y, z) => ({ x, y, z });
    // the city's trees (TREE_BLOBS) in a grid: treeAt()(x, z) is the height of the tallest canopy over that point (0 if none)
    let TG = null;
    const treeAt = () => {
      if (!TG) {
        const list = H.trees?.() || [];
        if (!list.length) return () => 0;
        TG = new Map();
        for (const t of list) { const k = Math.floor(t.x / 60) * 4096 + Math.floor(t.z / 60); let l = TG.get(k); if (!l) TG.set(k, (l = [])); l.push(t); }
      }
      return (x, z) => {
        let h = 0;
        const cx = Math.floor(x / 60), cz = Math.floor(z / 60);
        for (let i = cx - 1; i <= cx + 1; i++) for (let j = cz - 1; j <= cz + 1; j++) for (const t of TG.get(i * 4096 + j) || []) if (Math.hypot(t.x - x, t.z - z) < t.w * 0.6 + 4 && t.h * 1.6 > h) h = t.h * 1.6; // the drawn canopies stand taller than their shadow boxes
        return h;
      };
    };
    function camera(dt, camPos, camTarget) {
      const want = syncView() === "street" ? 1 : 0;
      if (reduced()) D.streetT = want;
      else D.streetT = want > D.streetT ? Math.min(1, D.streetT + dt / 1.15) : Math.max(0, D.streetT - dt / 1.15);
      const k = sss(D.streetT);
      D.camK = k;
      const mv = H.mapView, hd = H.heading();
      if (D.camH == null) D.camH = hd;
      D.camH += wrapA(hd - D.camH) * (1 - Math.exp(-dt * 5.5));
      // satellite: heading up while you drive (the arrows then point the way they turn), gently
      if (D.ready && mv.follow && (D.v > 25 || D.auto || D.uturn || D.kturn) && !reduced()) {
        mv.yawGoal = null;
        mv.yaw += wrapA(hd + Math.PI - mv.yaw) * (1 - Math.exp(-dt * (D.uturn ? 1.8 : 1.3)));
      }
      if (k < 1e-4) return;
      const cp = H.carPos, len = H.carLen() * (VP.w < VP.h ? 1.7 : 1), f = [Math.sin(D.camH), Math.cos(D.camH)];
      // the camera stays over the road: where the spot behind the car is not road (a dead end's end, a turn), it comes
      // in closer and a little higher, so it never sits inside a tree or a wall
      let pull = 0.4;
      const tree = treeAt(); // the canopies near a point: the camera keeps out of them (or rises over them)
      const onRoad = (x, z) => { const a = G.nearest(x, z, 60); if (!a) return false; const e = E[a.e]; if (a.d > e.w * 0.5 + 5) return false; return !((a.s < 4 && N[e.a].out.length === 1) || (a.s > e.len - 4 && N[e.b].out.length === 1)); };
      let over = 0;
      const hEye = cp.y + len * 0.4;
      // the tallest canopy on the line from a camera spot to the car (sampled), against the line's own height there
      const block = (x, z) => { let m = 0; for (const q of [0, 0.25, 0.5, 0.75]) { const th = tree(x + (cp.x - x) * q, z + (cp.z - z) * q); const yl = hEye + (cp.y + len * 0.25 - hEye) * q; if (th > yl - 2) m = Math.max(m, th); } return m; };
      for (const t of [1, 0.85, 0.7, 0.55, 0.4]) {
        const x = cp.x - f[0] * len * 0.92 * t, z = cp.z - f[1] * len * 0.92 * t, th = block(x, z);
        if (t === 0.4) { pull = 0.4; over = th; break; }
        if (onRoad(x, z) && !th) { pull = t; break; }
      }
      D.camOver += (over - D.camOver) * (1 - Math.exp(-dt * (over > D.camOver ? 8 : 2)));
      D.camPull += (pull - D.camPull) * (1 - Math.exp(-dt * (pull < D.camPull ? 9 : 3)));
      // a manoeuvre (the three-point turn, the turn on the spot, backing up) is watched from up and over the car
      D.camUp += ((D.kturn || D.uturn || D.v < -0.5 ? 1 : 0) - D.camUp) * (1 - Math.exp(-dt * 2.5));
      D.camLag += ((reduced() ? 0 : Math.min(1, Math.max(0, D.v) / VMAX)) - D.camLag) * (1 - Math.exp(-dt * 1.6));
      const back = len * 0.92 * D.camPull * (1 - 0.35 * D.camUp) * (1 + 0.16 * D.camLag);
      const eye = V3(cp.x - f[0] * back, Math.max(cp.y + len * (0.36 + 0.3 * (1 - D.camPull) + 0.7 * D.camUp), D.camOver + 8), cp.z - f[1] * back);
      const ahead = len * 1.3 * (1 - 0.8 * D.camUp); // in a manoeuvre the camera looks at the car itself
      const look = V3(cp.x + f[0] * ahead, cp.y + len * 0.2, cp.z + f[1] * ahead);
      // blend on the orbit (target, yaw, pitch, the height the frame shows, lens), so the car stays in frame throughout
      const ex = eye.x - look.x, ey = eye.y - look.y, ez = eye.z - look.z, d1 = Math.hypot(ex, ey, ez);
      // speed: the lens widens a little and the camera falls back (lag), a faint shake, and the post pass's radial blur
      const spd = reduced() ? 0 : Math.min(1, Math.max(0, D.v) / VMAX), kick = spd * Math.sqrt(spd);
      const yaw1 = Math.atan2(ex, ez), pitch1 = Math.asin(ey / d1), fov1 = 74 + 12 * kick;
      H.mapView.zoomBlur = Math.max(H.mapView.zoomBlur || 0, kick * kick * 0.55 * k);
      const fov0 = H.camera.fov, d0 = Math.hypot(camPos.x - camTarget.x, camPos.y - camTarget.y, camPos.z - camTarget.z);
      const yaw0 = Math.atan2(camPos.x - camTarget.x, camPos.z - camTarget.z), pitch0 = Math.asin(clamp((camPos.y - camTarget.y) / Math.max(d0, 1e-3), -1, 1));
      const tanH = (f) => Math.tan((f * Math.PI) / 360);
      const h0 = 2 * d0 * tanH(fov0), h1 = 2 * d1 * tanH(fov1);
      const fov = fov0 + (fov1 - fov0) * k, h = Math.exp(Math.log(h0) + (Math.log(h1) - Math.log(h0)) * k), d = h / (2 * tanH(fov));
      const yaw = yaw0 + wrapA(yaw1 - yaw0) * k, pitch = pitch0 + (pitch1 - pitch0) * k;
      const tx = camTarget.x + (look.x - camTarget.x) * k, ty = camTarget.y + (look.y - camTarget.y) * k, tz = camTarget.z + (look.z - camTarget.z) * k;
      camTarget.set(tx, ty, tz);
      camPos.set(tx + Math.sin(yaw) * Math.cos(pitch) * d, ty + Math.sin(pitch) * d, tz + Math.cos(yaw) * Math.cos(pitch) * d);
      if (spd > 0.05) { const t = performance.now() * 0.001, a = spd * spd * 0.5 * k; camPos.x += Math.sin(t * 23.1) * a; camPos.y += Math.sin(t * 31.7 + 1) * a * 0.7; camPos.z += Math.sin(t * 19.3 + 2) * a; }
      const cam = H.camera, near = Math.max(2.5, d * 0.32 * (1 - k) + 3 * k), far = Math.max(14000, d * 3 + 6000);
      if (Math.abs(cam.fov - fov) > 0.01 || Math.abs(cam.near - near) > 0.5 || Math.abs(cam.far - far) > 10) { cam.fov = fov; cam.near = near; cam.far = far; cam.updateProjectionMatrix(); }
    }
    // one source of truth for the view: D.view is the visitor's choice; the view on screen is that choice unless a scene
    // owns the camera (the jet's take-off, the opening), when it is the satellite. The buttons, the body class, the
    // swipe and the wheel all follow the view on screen, checked every frame
    let viewSig = "";
    const viewNow = () => (D.view === "street" && !H.camBusy() ? "street" : "sat");
    function syncView() {
      const a = viewNow(), busy = H.camBusy(), sig = a + busy;
      if (sig !== viewSig) {
        viewSig = sig;
        views.querySelectorAll("button").forEach((b) => { b.setAttribute("aria-pressed", String(b.dataset.v === a)); b.disabled = busy; });
        document.body.classList.toggle("nav2-street", a === "street");
      }
      return a;
    }
    function setView(street) {
      const v = street ? "street" : "sat";
      if (D.view === v) return;
      D.view = v;
      syncView();
      if (!street && H.mapView.pitch < 0.75) H.mapView.pitchGoal = 0.98;
      if (street) H.cineStop();
      H.follow();
      toast(street ? "Street view · the camera rides behind you" : "Satellite view · zoom with + − or the wheel");
    }
    function firstDrive() {
      D.firstDrive = false;
      const mv = H.mapView;
      if (mv.dist > 3000) { mv.distGoal = H.isPhone() ? 2900 : 2500; mv.distRate = 1.4; }
      if (mv.pitch < 0.85) mv.pitchGoal = 0.98;
      H.welcome(false);
    }

    // ===================== 4. the screen =====================
    const ARR = {
      u: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 4.5 5.5 11h4v8.5h5V11h4z"/></svg>',
      d: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 19.5 5.5 13h4V4.5h5V13h4z"/></svg>',
      l: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4.5 12 11 5.5v4h8.5v5H11v4z"/></svg>',
      r: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M19.5 12 13 5.5v4H4.5v5H13v4z"/></svg>'
    };
    const GLY = { l: "←", s: "↑", r: "→" };
    const root = document.createElement("div");
    root.className = "nav2-ui";
    root.innerHTML = `
      <section class="n2-panel" aria-label="What's nearby" aria-live="polite"></section>
      <div class="n2-views" role="group" aria-label="View">
        <button data-v="street" aria-pressed="false" title="Street view (V)"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M3 20 9 4h6l6 16" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 6.5v2.5M12 12v2.5M12 17.5V20" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><b>Street</b></button>
        <button data-v="sat" aria-pressed="true" title="Satellite view (V)"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="6" height="6" rx="1" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9 12H3.5M20.5 12H15M12 9V3.5M12 20.5V15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="m4 4 3 3M20 20l-3-3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><b>Satellite</b></button>
      </div>
      <div class="n2-pad" aria-label="Drive">
        <span class="n2-hint mono">HOLD ↑ TO DRIVE</span>
        <div class="n2-keys">
          <button class="n2-k n2-u" data-k="u" aria-label="Forward (↑ or W)">${ARR.u}<i class="n2-w" aria-hidden="true">W</i></button>
          <button class="n2-k n2-l" data-k="l" aria-label="Turn left (← or A)">${ARR.l}<i class="n2-w" aria-hidden="true">A</i></button>
          <button class="n2-k n2-d" data-k="d" aria-label="Brake, reverse (↓ or S)">${ARR.d}<i class="n2-w" aria-hidden="true">S</i></button>
          <button class="n2-k n2-r" data-k="r" aria-label="Turn right (→ or D)">${ARR.r}<i class="n2-w" aria-hidden="true">D</i></button>
        </div>
      </div>
      <div class="n2-toast" role="status"></div>`;
    document.body.appendChild(root);
    const panel = root.querySelector(".n2-panel"), views = root.querySelector(".n2-views"), pad = root.querySelector(".n2-pad"), hintEl = root.querySelector(".n2-hint"), toastEl = root.querySelector(".n2-toast");
    const keyEls = {}; pad.querySelectorAll(".n2-k").forEach((b) => { keyEls[b.dataset.k] = b; });
    views.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) setView(b.dataset.v === "street"); });
    let toastT = 0;
    function toast(t) { toastEl.textContent = t; toastEl.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove("on"), 2600); }
    function nope(k) { const b = keyEls[k]; if (!b) return; b.classList.remove("nope"); void b.offsetWidth; b.classList.add("nope"); }
    function flashKey(k) { const b = keyEls[k === "s" ? "u" : k]; if (!b) return; b.classList.remove("took"); void b.offsetWidth; b.classList.add("took"); }
    const keyDown = (k) => { if (D.keys[k]) return; D.keys[k] = true; keyEls[k]?.classList.add("on"); press(k); };
    const keyUp = (k) => { D.keys[k] = false; keyEls[k]?.classList.remove("on"); if (k === "d") D.backHold = false; };
    pad.querySelectorAll(".n2-k").forEach((b) => {
      const k = b.dataset.k;
      b.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); b.setPointerCapture?.(e.pointerId); keyDown(k); });
      const up = () => keyUp(k);
      b.addEventListener("pointerup", up); b.addEventListener("pointercancel", up); b.addEventListener("lostpointercapture", up);
      b.addEventListener("contextmenu", (e) => e.preventDefault());
    });
    for (const n of [pad, views, panel]) n.addEventListener("pointerdown", (e) => e.stopPropagation());
    const KEYS = { ArrowUp: "u", ArrowDown: "d", ArrowLeft: "l", ArrowRight: "r", w: "u", W: "u", s: "d", S: "d", a: "l", A: "l", d: "r", D: "r" };
    const typing = (e) => e.target?.closest?.("input, textarea, select, [contenteditable]");
    window.addEventListener("keydown", (e) => {
      if (!api.on || typing(e) || H.overlay() || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "v" || e.key === "V") { e.preventDefault(); setView(D.view !== "street"); return; }
      const k = KEYS[e.key];
      if (!k) return;
      e.preventDefault(); e.stopImmediatePropagation();
      if (!e.repeat) keyDown(k);
    }, true);
    window.addEventListener("keyup", (e) => {
      const k = KEYS[e.key];
      if (!k || !api.on) return;
      e.stopImmediatePropagation();
      keyUp(k);
    }, true);
    window.addEventListener("blur", () => { for (const k of "udlr") keyUp(k); });
    // phones, in street view: a swipe drives (up: go while the finger is down, left/right: turn, down: brake / turn round)
    {
      const cv = H.canvas();
      let sw = null;
      cv.addEventListener("pointerdown", (e) => {
        if (!api.on || D.streetT < 0.5) return;
        e.stopImmediatePropagation();
        sw = { id: e.pointerId, x: e.clientX, y: e.clientY, k: null };
      }, true);
      cv.addEventListener("pointermove", (e) => {
        if (!sw || e.pointerId !== sw.id) return;
        e.stopImmediatePropagation();
        if (sw.k) return;
        const dx = e.clientX - sw.x, dy = e.clientY - sw.y;
        if (Math.hypot(dx, dy) < 28) return;
        sw.k = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "r" : "l") : dy < 0 ? "u" : "d";
        keyDown(sw.k);
        if (sw.k === "l" || sw.k === "r") keyUp(sw.k);
      }, true);
      const end = (e) => { if (!sw || e.pointerId !== sw.id) return; e.stopImmediatePropagation(); if (sw.k === "u" || sw.k === "d") keyUp(sw.k); sw = null; };
      cv.addEventListener("pointerup", end, true); cv.addEventListener("pointercancel", end, true);
      window.addEventListener("wheel", (e) => { if (api.on && D.streetT > 0.5 && !e.target.closest?.(".map-card, .case-frame, .nav2-ui, .map-rides, .crew-panel")) { e.preventDefault(); e.stopImmediatePropagation(); } }, { passive: false, capture: true });
    }
    // the pad: only what does something here lights up; the hint says what is next
    let padSig = "";
    function ui(L, dec) {
      const v = valid(dec, L), near = dec && dec.L - L < WINDOW, stoppedAt = Math.abs(D.v) < 8 && dec && dec.L - L < (dec.gap || 34) + 50;
      let hint = pivots() ? "HOLD ↑ TO DRIVE · ↓ TURNS ROUND" : "HOLD ↑ TO DRIVE · ↓ REVERSES";
      let need = "";
      if (D.uturn) hint = "TURNING ROUND";
      else if (D.kturn) hint = "THREE-POINT TURN";
      else if (D.auto) hint = D.auto.rev ? "BACKING UP TO IT · ANY ARROW TAKES OVER" : D.auto.pl && !D.auto.pl.tap ? "DRIVING YOU THERE · ANY ARROW TAKES OVER" : "DRIVING YOU THERE";
      else if (reversing()) { const b = backInto(L); hint = b && (b.l || b.r) ? `REVERSING · ${[b.l && "←", b.r && "→"].filter(Boolean).join(" ")} BACKS INTO THE SIDE STREET` : "REVERSING"; }
      else if (dec && near) {
        const m = Math.max(0, Math.round((dec.L - L) / 10) * 10);
        if (dec.type === "bend") { hint = `${dec.side === "l" ? "←" : "→"} THE ROAD TURNS ${dec.side === "l" ? "LEFT" : "RIGHT"}${stoppedAt ? "" : ` · ${m} M`}`; need = dec.side; }
        else if (dec.type === "junction") {
          const o = ["l", "s", "r"].filter((k) => dec.ex[k]).map((k) => GLY[k]).join(" "), what = dec.ex.round ? "ROUNDABOUT" : "JUNCTION";
          hint = stoppedAt ? `${what} · ${dec.ex.round ? "PICK YOUR EXIT" : "PICK"} ${o}` : `${what} IN ${m} M · ${o}`;
          if (stoppedAt) need = ["l", "r"].filter((k) => dec.ex[k]).join("") + (dec.ex.s ? "u" : "");
        }
        else if (dec.type === "end") hint = stoppedAt ? (pivots() ? "DEAD END · ↓ TO TURN ROUND" : "DEAD END · ↓ FOR A THREE-POINT TURN") : `DEAD END IN ${m} M`;
      } else if (D.v > 10) hint = "↓ BRAKES";
      const sig = `${v.u}${v.d}${v.l}${v.r}|${need}|${hint}`;
      if (sig === padSig) return;
      padSig = sig;
      for (const k of "udlr") { keyEls[k].classList.toggle("off", !v[k]); keyEls[k].classList.toggle("need", need.includes(k)); }
      hintEl.textContent = hint;
    }
    // the Waze panel: where you are, what is here, and what each way leads to (the next junction's exits, looked ahead
    // along the graph a few hundred units), only the places of the quarter you're in or the one an exit leads into
    let panelSig = "";
    function explore(it, budget, base, out, seen, depth) {
      if (depth > 7 || seen.has(it.e)) return;
      seen.add(it.e);
      const e = E[it.e];
      for (const p of byEdge.get(it.e) || []) { const s = it.dir > 0 ? p.s : e.len - p.s; if (s <= budget) out.push({ p, d: base + s }); }
      if (e.len >= budget) return;
      for (const o of N[endNode(it)].out) if (!(o.e === it.e) && !against(o)) explore(o, budget - e.len, base + e.len, out, seen, depth + 1);
    }
    const uniq = (list) => { const s = new Set(); return list.sort((a, b) => a.d - b.d).filter((x) => (s.has(x.p.pl) ? false : (s.add(x.p.pl), true))); };
    const mDist = (d) => (d < 1000 ? `${Math.max(10, Math.round(d / 10) * 10)} m` : `${(d / 1000).toFixed(1)} km`);
    function render(force) {
      if (!D.ready) return;
      const L = H.state.L, ci = ciOf(L), cur = D.seq[ci], q = quarterAt(H.carPos.x, H.carPos.z), dec = nextDecision(L);
      const rows = [];
      // ahead: the places still in front of the car on the edges already chosen
      const ahead = [];
      for (let k = ci; k < D.seq.length; k++) {
        const it = D.seq[k], e = E[it.e];
        for (const p of byEdge.get(it.e) || []) { const s = it.dir > 0 ? p.s : e.len - p.s, d = it.L0 + s - L; if (d > 30 && d < 900) ahead.push({ p, d }); }
      }
      const here = hereAt();
      const jd = dec && dec.type === "junction" ? dec.L - L : Infinity;
      const ex = dec && dec.type === "junction" && jd < 900 ? dec.ex : null;
      const ways = { l: [], s: [], r: [] };
      if (ex) for (const k of ["l", "s", "r"]) if (ex[k]) { const o = []; explore(ex[k], 650, jd + (ex[k].pre || 0), o, new Set(), 0); ways[k] = uniq(o); }
      // a place reached by more than one way belongs to the shortest (a tie: the straighter way)
      {
        const best = new Map();
        for (const k of ["l", "s", "r"]) for (const x of ways[k]) {
          const c = best.get(x.p.pl);
          if (!c || x.d < c.d - 5 || (Math.abs(x.d - c.d) <= 5 && Math.abs(ex[k].d) < Math.abs(ex[c.k].d))) best.set(x.p.pl, { k, d: x.d });
        }
        for (const k of ["l", "s", "r"]) ways[k] = ways[k].filter((x) => best.get(x.p.pl).k === k);
      }
      const onPath = new Set(ahead.map((x) => x.p.pl));
      for (const k of ["l", "r"]) ways[k] = ways[k].filter((x) => !onPath.has(x.p.pl));
      const sAhead = uniq([...ahead, ...ways.s]);
      for (const k of ["s", "l", "r"]) {
        const list = k === "s" ? sAhead : ways[k];
        if (!list.length) continue;
        const groups = new Map();
        for (const x of list) { if (!groups.has(x.p.q)) groups.set(x.p.q, []); groups.get(x.p.q).push(x); }
        // only the places of the quarter you're in; a way that leads into another quarter shows that quarter
        const lead = q && groups.has(q) ? null : [...groups.keys()][0];
        rows.push({ k, other: lead, items: groups.get(lead || q).slice(0, 3) });
      }
      const auto = D.auto;
      // round 2 (Daniel: "more visual"): the panel is rebuilt only when what it shows changes; the distances update in place
      const sig = JSON.stringify([q, here?.pl.id, auto ? auto.pl?.id || "tap" : 0, rows.map((r) => [r.k, r.other, !!ex?.[r.k], r.items.map((x) => x.p.pl.id)]), D.cardFor?.id && H.cardOpen(), imgV]);
      const dists = new Map();
      for (const r of rows) for (const x of r.items) dists.set(r.k + ":" + x.p.pl.id, x.d);
      if (!force && sig === panelSig) { updDist(dists, auto); return; }
      panelSig = sig;
      const cols = (pl) => { const b = H.brand?.(pl); return { c: b?.c || pl.pin || pl.c || "#FED012", t: b?.t || pl.t || "#111" }; };
      const pic = (pl) => { const u = imgOf(pl); const { c, t } = cols(pl); return u ? `<img src="${esc(u)}" alt="" decoding="async" loading="lazy">` : `<span class="n2-ini" style="color:${esc(t)}">${esc(pl.name.replace(/[^A-Za-z0-9 ]/g, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase())}</span>`; };
      const card = (x, k) => { const pl = x.p.pl, { c, t } = cols(pl); return `<button class="n2-pc" data-id="${esc(pl.id)}" data-dk="${k}:${esc(pl.id)}" style="--pc:${esc(c)};--pt:${esc(t)}" aria-label="${esc(pl.name)}, ${mDist(x.d)}"><span class="n2-pic">${pic(pl)}<em class="n2-dch">${GLY[k]}</em></span><b class="n2-nm">${esc(pl.name)}</b><span class="n2-dist mono">${mDist(x.d)}</span></button>`; };
      const qpill = (qq) => `<span class="n2-q" style="--qc:${QCOL[qq] || "#FED012"}">${esc(qq ? QNAME[qq] : "Cromatic City")}</span>`;
      let h = `<header>${qpill(q)}<span class="n2-sub mono">${q ? "NEARBY IN THIS QUARTER" : "BETWEEN THE QUARTERS"}</span></header>`;
      if (auto) { const pl = auto.pl && !auto.pl.tap ? auto.pl : null, cc = pl ? cols(pl) : { c: "#FED012", t: "#111" }; h += `<div class="n2-auto" style="--pc:${esc(cc.c)};--pt:${esc(cc.t)}">${pl ? `<span class="n2-pic sm">${pic(pl)}</span>` : ""}<span class="n2-at"><i class="mono">${auto.rev ? "BACKING UP TO" : "DRIVING YOU TO"}</i><b>${esc(pl ? pl.name : "the spot you tapped")}</b><em class="n2-dist mono" data-auto="1">${mDist(autoLeft())}</em></span><button class="n2-take">Take the wheel</button></div>`; }
      if (here && !(D.cardFor === here.pl && H.cardOpen())) { const { c, t } = cols(here.pl); h += `<button class="n2-here" data-id="${esc(here.pl.id)}" style="--pc:${esc(c)};--pt:${esc(t)}"><span class="n2-pic sm">${pic(here.pl)}</span><span class="n2-at"><i class="mono">YOU'RE AT</i><b>${esc(here.pl.name)}</b></span><em class="n2-open">Open →</em></button>`; }
      for (const r of rows) {
        const lab = r.k === "s" ? "Ahead" : r.k === "l" ? "Left" : "Right";
        h += `<div class="n2-row" data-k="${r.k}"><div class="n2-rh"><button class="n2-dir" data-turn="${r.k}" aria-label="${lab}"${r.k === "s" || !ex?.[r.k] ? " disabled" : ""}><span class="n2-g">${GLY[r.k]}</span></button><span class="n2-rt">${lab}${r.other ? ` <span class="n2-q sm" style="--qc:${QCOL[r.other]}">${esc(QNAME[r.other])}</span>` : ""}</span></div><div class="n2-strip">${r.items.map((x) => card(x, r.k)).join("")}</div></div>`;
      }
      if (!rows.length && !here && !auto) h += `<p class="n2-empty">Nothing of ours down this way. Back up with ↓, or tap a place on the map.</p>`;
      panel.innerHTML = h;
      panel.classList.toggle("n2-has", true);
      // the postcards of places with no photo are rendered one at a time, when the page is idle
      for (const r of rows) for (const x of r.items) if (!imgOf(x.p.pl)) wantShot(x.p.pl);
      if (here && !imgOf(here.pl)) wantShot(here.pl);
    }
    function updDist(dists, auto) {
      for (const el of panel.querySelectorAll("[data-dk]")) { const d = dists.get(el.dataset.dk); if (d != null) { const t = mDist(d), s = el.querySelector(".n2-dist"); if (s && s.textContent !== t) s.textContent = t; } }
      const a = panel.querySelector("[data-auto]"); if (a && auto) { const t = mDist(autoLeft()); if (a.textContent !== t) a.textContent = t; }
    }
    // pictures: the photo (case cover) when there is one, else the map's postcard of the place (cached)
    const shots = new Map(), shotQ = []; let imgV = 0, shotBusy = false;
    const imgOf = (pl) => H.cover?.(pl) || shots.get(pl.id) || null;
    function wantShot(pl) {
      if (shots.has(pl.id) || shotQ.includes(pl)) return;
      shotQ.push(pl);
      if (shotBusy) return;
      shotBusy = true;
      const next = () => {
        const q = shotQ.shift();
        if (!q) { shotBusy = false; imgV++; render(); return; }
        const u = H.shot?.(q);
        shots.set(q.id, u || "");
        (window.requestIdleCallback || setTimeout)(next, { timeout: 600 });
      };
      (window.requestIdleCallback || setTimeout)(next, { timeout: 600 });
    }
    function autoLeft() {
      const a = D.auto; if (!a) return 0;
      if (a.rev) return Math.max(0, H.state.L - a.Lt);
      const s = autoStopL(); if (s != null) return Math.max(0, s - H.state.L);
      const L = H.state.L, last = D.seq[D.seq.length - 1];
      let d = last.L1 - L;
      for (const lg of a.legs) d += E[lg.e].len;
      return d;
    }
    panel.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      if (b.classList.contains("n2-take")) { stopAuto(); return; }
      if (b.dataset.turn) { choose(b.dataset.turn); return; }
      const pl = H.places.find((p) => p.id === b.dataset.id); if (!pl) return; // a card, the "you're at" banner
      if (b.classList.contains("n2-here")) { arrive(pl); return; }
      api.go(pl);
    });

    // ---------- the first-time tutorial (in the drive guide's look): "Or, you can drive it yourself" at the car, then
    // "Pick a way" at the first junction, then "You're driving". Once per visitor (cz-drive-guide); a visitor who does not
    // drive within 10 s goes on to the map guide's "Start here" (done("skipped")); any hand on the map ends it ----------
    const TUT = { step: null, el: null, done: null, t0: 0, L0: 0, timer: 0 };
    const touchUI = matchMedia("(hover: none) and (pointer: coarse)").matches;
    function tutorial(done, force) {
      try { if (!force && localStorage.getItem("cz-drive-guide")) return false; localStorage.setItem("cz-drive-guide", "1"); } catch {}
      if (!D.ready && !place()) return false;
      D.ready = true;
      if (!TUT.el) { TUT.el = document.createElement("div"); TUT.el.className = "drive-guide n2-guide hidden"; TUT.el.setAttribute("role", "status"); document.body.appendChild(TUT.el); }
      TUT.asked = true; TUT.done = done; TUT.step = "go"; TUT.t0 = performance.now(); TUT.L0 = H.state.L;
      tutShow();
      clearTimeout(TUT.timer); TUT.timer = setTimeout(() => tutEnd("skipped"), 10000);
      return true;
    }
    function tutShow() {
      const e = TUT.el, st = TUT.step;
      const key = (k, big) => `<span class="n2-cap${big ? " big" : ""}" aria-hidden="true">${k}</span>`;
      if (st === "go") e.innerHTML = `<span class="n2-caps">${key("↑", 1)}</span><b>Or, you can drive it yourself</b><i>${touchUI ? "Hold ↑ on the pad" : "Hold ↑ to drive · WASD works too"}</i>`;
      if (st === "turn") e.innerHTML = `<span class="n2-caps">${key("←")}${key("→")}</span><b>Pick a way</b><i>${touchUI ? "Tap ← or → on the pad" : "← or → at the junction"}</i>`;
      if (st === "end") e.innerHTML = `<b>You're driving</b><i>Tap any place and we drive you there</i>`;
      e.classList.remove("hidden");
      e.classList.remove("in"); void e.offsetWidth; e.classList.add("in");
      keyEls.u.classList.toggle("tut", st === "go"); keyEls.l.classList.toggle("tut", st === "turn"); keyEls.r.classList.toggle("tut", st === "turn");
    }
    function tutEnd(how) {
      if (!TUT.step) return;
      TUT.step = null; clearTimeout(TUT.timer);
      TUT.el?.classList.add("hidden");
      for (const k of "ulr") keyEls[k].classList.remove("tut");
      const d = TUT.done; TUT.done = null; d?.(how);
    }
    // per frame: follow the car on screen, and move on as the visitor drives
    function tutTick() {
      // a visitor who began with a place (the welcome card, a pin): the invitation comes once that first card is closed
      if (!TUT.step && !TUT.asked && D.arrT && !D.auto && !H.cardOpen() && performance.now() - D.arrT > 1500) { TUT.asked = true; tutorial(null); }
      if (!TUT.step) return;
      const L = H.state.L;
      if (TUT.step === "go" && (D.v > 30 || Math.abs(L - TUT.L0) > 60)) { TUT.step = "drove"; TUT.el.classList.add("hidden"); keyEls.u.classList.remove("tut"); clearTimeout(TUT.timer); TUT.timer = setTimeout(() => tutEnd("done"), 20000); }
      if (TUT.step === "drove") { const dec = nextDecision(L); if (dec && dec.type === "junction" && dec.L - L < WINDOW && (dec.ex.l || dec.ex.r)) { TUT.step = "turn"; TUT.dec = dec.key; tutShow(); } }
      if (TUT.step === "turn") { const dec = nextDecision(L); if (!dec || dec.key !== TUT.dec) { TUT.step = "end"; tutShow(); clearTimeout(TUT.timer); TUT.timer = setTimeout(() => tutEnd("done"), 3200); } }
      if (TUT.step === "drove" || TUT.el.classList.contains("hidden")) return;
      // over the car, kept inside the screen
      const p = H.project(H.carPos.x, 40, H.carPos.z), W = VP.w, Hh = VP.h, ph = W < 720;
      if (p.z < 1) { TUT.el.style.left = clamp((p.x * 0.5 + 0.5) * W, 140, W - 140).toFixed(0) + "px"; TUT.el.style.top = clamp((-p.y * 0.5 + 0.5) * Hh - 70, ph ? 250 : 150, Hh - (ph ? 260 : 200)).toFixed(0) + "px"; }
    }
    // a hand on the map (a drag, a zoom) ends the tutorial, but the pad, the panel and the views do not
    window.addEventListener("pointerdown", (e) => { if (TUT.step && TUT.step !== "end" && e.target === H.canvas() && D.streetT < 0.5) tutEnd("skipped"); }, true);
    window.addEventListener("wheel", () => { if (TUT.step === "go") tutEnd("skipped"); }, { passive: true });

    const api = {
      on: false, graph: G, D,
      tutorial, tutorialEnd: () => tutEnd(null),
      get camK() { return D.camK; },
      tick, pose, camera, body,
      // a place from the map (a pin, a chip, the welcome card): driven to along the graph
      go(pl) {
        if (!pl || pl.find) return false;
        const st = pl.stop ? H.stops.find((s) => s.id === pl.stop) : null;
        const x = st ? st.x : pl.x ?? pl.px, z = st ? st.y : pl.z ?? pl.pz;
        if (x == null) return false;
        const a = G.nearest(x, z, 260);
        if (!a) return false;
        H.hideCard(); D.cardFor = null; D.lastArr = null;
        return goTo({ e: a.e, s: a.s }, pl);
      },
      moving: () => Math.abs(D.v) > 20 || !!D.auto || !!D.kturn || !!D.uturn,
      // a point on a drawn road (within its width, a little margin)
      onRoad: (x, z) => { const a = G.nearest(x, z, 60); return !!a && a.d < E[a.e].w * 0.5 + 6; },
      // a tap on any street of the graph
      tap(x, z) {
        const a = G.nearest(x, z, 45);
        if (!a) return null;
        const e = E[a.e], p = pointAt(e.pts, e.cum, a.s);
        goTo({ e: a.e, s: a.s }, { id: "tap", tap: true, x: p[0], z: p[1], name: "", c: "#FED012" });
        return p;
      },
      setActive(on) {
        api.on = on;
        document.body.classList.toggle("nav2", on);
        if (!on) { for (const k of "udlr") keyUp(k); D.ready = false; D.auto = null; D.uturn = null; D.streetT = 0; D.camK = 0; viewSig = ""; document.body.classList.remove("nav2-street"); }
        else { viewSig = ""; let seen = false; try { seen = !!localStorage.getItem("cz-drive-guide"); } catch {} if (seen) setTimeout(() => toast(H.isPhone() ? "Drive it yourself with the pad · or tap a place" : "Drive it yourself: arrows or WASD · V switches the view"), 1600); } // a first visit gets the tutorial instead
      },
      view: setView,
      press: (k, down = true) => (down ? keyDown(k) : keyUp(k)),
      quarterAt, vehLow: () => H.vehLow?.(), lamps: (on) => H.reverseLamps(on), treeH: (x, z) => treeAt()(x, z), trees: () => (H.trees?.() || []).length,
      place: (id) => H.places.find((p) => p.id === id),
      state: () => { const L = H.state.L, dec = nextDecision(L); return { v: Math.round(D.v), L: Math.round(L), car: [Math.round(H.carPos.x), Math.round(H.carPos.z)], dec: dec && { type: dec.type, in: Math.round(dec.L - L), ex: dec.ex && { l: !!dec.ex.l, s: !!dec.ex.s, r: !!dec.ex.r }, side: dec.side }, auto: D.auto && (D.auto.pl?.id || "tap"), q: quarterAt(H.carPos.x, H.carPos.z), hint: hintEl.textContent, card: H.cardOpen(), keys: { ...D.keys }, yaw: +H.mapView.yaw.toFixed(2), hd: +H.heading().toFixed(2) }; }
    };
    window.__nav2 = api; // for tests
    return api;
  };
})();
