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
  const QNAME = { A: "Coffee Street", B: "Fintech Boulevard", C: "Medical Avenue", D: "Strada Olari" }; // beta 3.01: Dacia 99 lives on Coffee Street now
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
        if ((e1.kind === "minor") !== (e2.kind === "minor")) continue; // round 3: a side street never merges into a road
        if ((e1.kind === "long") !== (e2.kind === "long")) continue; // round 5: nor does an avenue into one of our roads (closed vs open)
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
    const nearest = (x, z, maxD = 400, only = null) => {
      let best = null;
      const r = Math.ceil(maxD / SG), cx0 = Math.floor(x / SG), cz0 = Math.floor(z / SG);
      for (let ring = 0; ring <= r; ring++) {
        for (let cx = cx0 - ring; cx <= cx0 + ring; cx++) for (let cz = cz0 - ring; cz <= cz0 + ring; cz++) {
          if (Math.max(Math.abs(cx - cx0), Math.abs(cz - cz0)) !== ring) continue;
          for (const code of sgrid.get(gk(cx, cz)) || []) {
            const e = E[Math.floor(code / 4096)], i = code % 4096, a = e.pts[i], b = e.pts[i + 1];
            if (only && !only(e)) continue;
            const dx = b[0] - a[0], dz = b[1] - a[1], l2 = dx * dx + dz * dz || 1, t = clamp(((x - a[0]) * dx + (z - a[1]) * dz) / l2, 0, 1);
            const d = Math.hypot(a[0] + dx * t - x, a[1] + dz * t - z);
            if (!best || d < best.d) best = { e: e.id, s: e.cum[i] + Math.sqrt(l2) * t, d };
          }
        }
        if (best && best.d < ring * SG) break;
      }
      return best && best.d <= maxD ? best : null;
    };
    // round 3 (Daniel: "only the normal roads, no back alleys"): the car drives the drive's own network (the start road,
    // the ring, the three streets, the Dacia row, the lane, the road to Olari 9) and the long avenues; the side streets
    // (cityNet().minor) stay in the graph only as mouths to back into for a turn, never to drive on
    {
      for (const e of E) e.drive = false;
      // round 5 (Daniel: "close all roads that aren't ours"): ours are the drive's own network (navNet): an edge is ours when
      // nearly all of it lies on one of its polylines (a long avenue merged onto one of them is not)
      const own = [];
      { const { P, adj } = H.navNet(); P.forEach((p, i) => { for (const [j] of adj[i]) if (j > i) own.push([p[0], p[1], P[j][0], P[j][1]]); }); }
      const onOwn = (x, z) => own.some(([ax, az, bx, bz]) => { const dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1, t = clamp(((x - ax) * dx + (z - az) * dz) / l2, 0, 1); return Math.hypot(ax + dx * t - x, az + dz * t - z) < 8; });
      for (const e of E) { if (e.kind === "minor") { e.ours = false; continue; } let k = 0, n = 0; for (let s2 = 0; s2 <= e.len; s2 += 20) { const p = pointAt(e.pts, e.cum, s2); n++; if (onOwn(p[0], p[1])) k++; } e.ours = k / n > 0.9; }
      const seen = new Uint8Array(N.length), st = [start2()];
      function start2() { let b = 0, bd = Infinity; N.forEach((n, i) => { if (!n.out.some((o) => E[o.e].ours)) return; const d = Math.hypot(n.x - H.start[0], n.z - H.start[1]); if (d < bd) { bd = d; b = i; } }); return b; }
      seen[st[0]] = 1;
      while (st.length) { const n = st.pop(); for (const o of N[n].out) { const e = E[o.e]; if (!e.ours) continue; e.drive = true; const m = o.dir > 0 ? e.b : e.a; if (!seen[m]) { seen[m] = 1; st.push(m); } } }
      stats.drivable = E.filter((e) => e.drive).length;
      stats.drivableKm = Math.round(E.filter((e) => e.drive).reduce((a, e) => a + e.len, 0));
    }
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
    // beta 2.9: a phone's layout: a narrow screen, or a touch screen held sideways (short)
    const coarse = matchMedia("(hover: none) and (pointer: coarse)").matches;
    const phoneUI = () => VP.w < 720 || (coarse && VP.h < 520);
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
          for (const o of N[m].out) if (E[o.e].kind !== "ring" && E[o.e].drive) c.push({ e: o.e, dir: o.dir, via, pre, d: wrapA(outH(o) - hin) });
        }
        ex = slots(c.filter((o) => Math.abs(o.d) < 2.7));
        ex.round = true;
      } else {
        ex = slots(N[n].out.filter((o) => !(o.e === it.e && o.dir === -it.dir) && !against(o) && E[o.e].drive).map((o) => ({ e: o.e, dir: o.dir, d: wrapA(outH(o) - hin) })).filter((o) => Math.abs(o.d) < 2.7));
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
      const a = G.nearest(x, z, 360, (e) => e.drive);
      if (!a) continue;
      const ap = pointAt(E[a.e].pts, E[a.e].cum, a.s);
      // r201: which kerb the building stands on, seen along the edge's own direction (+1 left, -1 right, 0 on the road)
      const t0 = pointAt(E[a.e].pts, E[a.e].cum, a.s - 6), t1 = pointAt(E[a.e].pts, E[a.e].cum, a.s + 6), bx = pl.px ?? x, bz = pl.pz ?? z;
      const cr = (t1[0] - t0[0]) * (bz - ap[1]) - (t1[1] - t0[1]) * (bx - ap[0]), side = Math.hypot(bx - ap[0], bz - ap[1]) < 12 ? 0 : cr > 0 ? 1 : -1;
      PL.push({ pl, x, z, e: a.e, s: a.s, ax: ap[0], az: ap[1], side, q: pl.br || null, hide: !!(pl.past || pl.chapter) }); // ax/az: where the car parks for it; hide: beta 2.7, a discovery (never suggested)
    }
    const byEdge = new Map();
    for (const p of PL) { if (p.hide) continue; let l = byEdge.get(p.e); if (!l) byEdge.set(p.e, (l = [])); l.push(p); } // beta 2.7 (Daniel): the blast-from-the-past places are found only by driving past them
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
      cleared: new Set(), goUntil: -1, cruise: false, cruiseOff: false, keyT: {}, auto: null, uturn: null, kturn: null, revSteer: null, wasRev: false, backHold: false, downT: 0,
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
      const a = G.nearest(c.x, c.z, 900, (e) => e.drive);
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
      const L = curL(), C = D.C;
      buildPath();
      apply(L, C); // the path before the new corner is unchanged: same L
    }
    function trim() {
      const L = curL();
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
      if (N[n].out.filter((o) => E[o.e].drive).length <= 1) return { type: "end", key: "end:" + last.uid, L: last.L1, it: last };
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
      return { ci, it, l: side(1), r: side(-1), back: c.filter((o) => Math.abs(o.d) >= 2.6 && E[o.e].drive).sort((a, b) => Math.abs(b.d) - Math.abs(a.d))[0] || null };
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
      if (FREE) return; // round 4: the keys drive the car itself (see physics)
      const L = curL(), dec = nextDecision(L);
      if (k === "d") {
        D.downT = 0; D.goUntil = -1;
        if (Math.abs(D.v) < 40 && pivots()) { uturn(); return; }
        if (Math.abs(D.v) < 6 && dec && dec.type === "end" && dec.L - L < 44) kturn();
        return;
      }
      // reversing: ← → back into the side street at the node behind
      if ((k === "l" || k === "r") && reversing()) { D.revSteer = k; flashKey(k); return; }
      if (!dec || (dec.type !== "junction" && dec.L - L > 600)) { if (k !== "u") nope(k); return; } // round 3: ← → pick the next junction's way however far it is
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
        if (k !== "u" || dec.ex.l || dec.ex.r) D.turnT = (D.turnT || 0) + 1; // a way picked where there was a choice
        flashKey(k);
        return;
      }
      if (k !== "u") nope(k);
    }
    // a turn picked on the panel: taken at the next junction, however far it is
    function choose(k) {
      if (D.auto) stopAuto();
      H.follow();
      const L = curL(), dec = nextDecision(L);
      if (dec && dec.type === "junction" && dec.ex[k] && dec.L - dec.gap >= L - 1) { commit(dec.ex[k]); if (k !== "s") D.turnT = (D.turnT || 0) + 1; flashKey(k); render(true); }
      else nope(k);
    }
    // the rides that can: a half circle on the spot from one lane to the other
    function uturn() {
      const L = curL(), it = D.seq[ciOf(L)];
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
      const L = curL(), it = D.seq[ciOf(L)];
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
    let PLAN_LOOSE = false; // beta 2.91: the no-hairpin rule, relaxed when it leaves no route at all
    function plan(target) {
      // target: { e, s } (s from the edge's a)
      const L = curL(), it = D.seq[ciOf(L)], e = E[it.e];
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
      const fwdN = endNode(it), backN = startNode(it), deadAhead = N[fwdN].out.filter((o) => E[o.e].drive).length === 1;
      dist0[fwdN] = e.len - sDir + (deadAhead ? 160 : 0); pd[fwdN] = 1; push(dist0[fwdN], fwdN);
      if (piv) { const back = sDir + 90; if (back < dist0[backN]) { dist0[backN] = back; pd[backN] = -1; push(back, backN); } }
      while (heap.length) {
        const [d, u] = pop();
        if (d > dist0[u]) continue;
        for (const o of N[u].out) {
          if (against(o) || !E[o.e].drive) continue; // the ring only with the flow; the roads only
          if (o.e === it.e && prev[u] === -1 && !(u === fwdN && deadAhead)) continue; // not back along your own edge (but out of a dead end, after the three-point turn)
          if (FREE && !PLAN_LOOSE) { const inIt = prev[u] === -1 ? (u === fwdN ? it : null) : { e: pe[u] >> 1, dir: pe[u] & 1 ? 1 : -1 }; if (inIt && Math.abs(wrapA(outH(o) - inH(inIt))) > 2.5) continue; } // beta 2.91: no hairpins (r182's flares meet the spokes at a point: link -> spoke back was a U-turn the car circled)
          const ed = E[o.e], v = o.dir > 0 ? ed.b : ed.a, nd = d + ed.len;
          if (nd < dist0[v]) { dist0[v] = nd; prev[v] = u; pe[v] = o.e * 2 + (o.dir > 0 ? 1 : 0); pd[v] = pd[u]; push(nd, v); }
        }
      }
      let viaA = dist0[tE.a] + target.s, viaB = dist0[tE.b] + (tE.len - target.s);
      // beta 2.91 (usage pass: the auto-pilot stood still after backing up): the arcade car cannot reverse along its own
      // edge at its end node (that was the old three-point turn): such a route is no route (freeGo turns round instead)
      if (FREE && target.e === it.e) { if (tE.a === fwdN && prev[tE.a] === -1 && it.dir < 0) viaA = Infinity; if (tE.b === fwdN && prev[tE.b] === -1 && it.dir > 0) viaB = Infinity; }
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
      if (FREE) {
        if (!P.init) freeInit();
        if (!freeGo(target, pl)) { if (pl?.board) { H.arrive(pl); return true; } return false; } // beta 2.92: since r185 the road ends at Olari 9's forecourt: the jet (no road to it now) opens its boarding pass straight away
        H.mapNav.place = pl && !pl.tap ? pl : null; H.mark(); H.follow();
        if (D.firstDrive) firstDrive();
        render(true);
        return true;
      }
      if (D.kturn || D.uturn) return false;
      // drop the corners already chosen beyond the car
      const L = curL(), ci = ciOf(L);
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
      for (let k = D.seq.length - 1; k >= ciOf(curL()); k--) {
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
      if (!D.ready) { if (!place()) return; D.ready = true; render(true); H.closures?.(CLOSED); setTimeout(preShots, 1200); setTimeout(() => engineLoops(H.vehicle()), 2500); }
      if (FREE) return freeTick(dt, now); // round 4: the arcade car
      const L = curL();
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
      const L2 = curL();
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
              dec = nextDecision(curL());
            }
          } else if (dec && dec.type === "end" && nx && nx.e === last.e && nx.dir === -last.dir && Math.abs(D.v) < 3 && dec.L - L2 < 44) {
            const a = D.auto; kturn(); a.legs.shift(); D.auto = a; return;
          }
        }
      }
      // ↑ held into a junction that goes straight on: straight on
      if (!D.auto && (D.keys.u || D.cruise) && D.v >= 0 && dec && dec.type === "junction" && dec.ex.s && dec.L - L2 < 70 + D.v * 0.45) { if (dec.ex.l || dec.ex.r) D.turnT = (D.turnT || 0) + 1; commit(dec.ex.s); dec = nextDecision(curL()); }
      let Lc = curL();
      // after reversing, driving on again: the choices made beyond the car are dropped (you choose again)
      if (D.wasRev && (D.keys.u || D.cruise) && D.v >= 0) {
        D.wasRev = false;
        const ci = ciOf(Lc);
        if (D.seq.length > ci + 1 && Lc < D.seq[ci].L1 - gapOf(D.seq[ci])) { D.seq.length = ci + 1; buildPath(); apply(Lc, Lc); dec = nextDecision(Lc); }
      }
      const autoRev = !!(D.auto && D.auto.rev);
      const auto = D.auto && !D.auto.uturn && !autoRev;
      if (D.cruise && (D.auto || D.kturn || D.uturn)) D.cruise = false;
      const fwdIn = (D.keys.u || D.cruise || auto || D.goUntil > Lc || D.goUntil === Infinity) && !(D.keys.d && D.goUntil !== Infinity);
      const rev = (D.keys.d && D.v <= 0.5 && !pivots() && !D.auto) || (autoRev && D.v <= 0.5); // ↓ held (or backing up to a place): reverse
      // and going back: the start of the path, unless you back into a street there
      let Lb = 4;
      if (D.seq.length > 1 && !E[D.seq[0].e].drive) Lb = Math.max(4, D.seq[1].L0 - 45); // a side street: only its mouth, for a turn
      if ((rev || D.v < -0.5) && !autoRev) {
        D.wasRev = true;
        const b = backInto(Lc);
        if (b) {
          const steer = D.keys.l ? "l" : D.keys.r ? "r" : D.revSteer;
          const pick = steer ? b[steer] : b.ci === 0 ? b.back : null;
          if (pick && !(b.ci > 0 && D.seq[b.ci - 1].e === pick.e && D.seq[b.ci - 1].dir === -pick.dir)) { reverseInto(pick, Lc); D.revSteer = null; Lc = curL(); dec = nextDecision(Lc); }
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
      if (D.v < -0.5) D.revDist = (D.revDist || 0) - D.v * dt;
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
      if (D.lastArr) { const p = PL.find((q) => q.pl === D.lastArr); if (p && Math.hypot(H.carPos.x - p.ax, H.carPos.z - p.az) > 200) { D.lastArr = null; if (D.cardFor) { H.hideCard(); D.cardFor = null; } if (!D.auto) { H.mapNav.place = null; H.mark(); } } }
      ui(Lc, dec);
      arms(Lc, dec);
      tutTick();
      panelT -= dt;
      if (panelT <= 0) { panelT = 0.22; document.body.classList.toggle("n2-card", H.cardOpen()); render(); }
    }
    let lampOn = false;
    function lamps(on) { lampOn = on; H.reverseLamps(on); }
    function hereAt(listed) {
      let best = null;
      for (const p of PL) { if (listed && p.hide) continue; const d = Math.hypot(H.carPos.x - p.ax, H.carPos.z - p.az); if (d < 75 && (!best || d < best.d)) best = { pl: p.pl, d, p }; }
      // beta 3.01 (Daniel): in front of Two Minutes, Two Minutes (its neighbours Two Min Lab and Călinescu 54 don't take it)
      { const tmP = PL.find((q) => q.pl.id === "tm"); if (tmP && Math.hypot(H.carPos.x - tmP.ax, H.carPos.z - tmP.az) < 90 && !(best && best.pl.id === "tm")) { const lab = best && (best.pl.id === "lab" || best.pl.id === "gloves") && best.d < 25; if (!lab) best = { pl: tmP.pl, d: Math.hypot(H.carPos.x - tmP.ax, H.carPos.z - tmP.az), p: tmP }; } }
      // beta 2.6: the place you just arrived at stays "here" (two places can share a stretch of kerb: Dacia 99 read as Echo School)
      if (D.lastArr) { const p = PL.find((q) => q.pl === D.lastArr && !(listed && q.hide)); if (p) { const d = Math.hypot(H.carPos.x - p.ax, H.carPos.z - p.az); if (d < 110) return { pl: p.pl, d, p }; } }
      return best;
    }
    const ktSeg = () => { const m = D.kturn, t = m.t / m.k; return t < KTD[0] ? 0 : t < KTD[0] + KTD[1] ? 1 : 2; };
    // the car's pose while it turns round: on the spot (the rides that can), or the three-point turn
    function pose(carPos, carTan) {
      if (FREE && P.init) { carPos.x = P.x; carPos.z = P.z; carTan.set(Math.sin(P.h), 0, Math.cos(P.h)); return; }
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

    // ===================== 2c. round 4: GTA 2-style arcade driving =====================
    // Daniel: "take inspiration from car games like GTA 2". The keys are the car's own: ↑ / W accelerate, ↓ / S brake
    // then reverse, ← → / A D steer (the car turns as it moves, the other way round when backing), Space the
    // handbrake (round 5: a quick spin). The car drives freely on the road surface of our own streets (round 5: the
    // avenues and the side streets are closed at their mouths) and the ring round the fountain; off it is the kerb: pushed back and
    // slides along it, and can always steer or back away. The road graph is kept for the auto-pilot (a tap, Nearby),
    // which drives the same physics along its route, and for the Nearby panel and the road signs.
    const FREE = true;
    const VMAX_F = 460, ACC_F = 340, BRAKE_F = 620, REV_F = 210, VREV_F = 150, ROLL_F = 45, DRAG_F = 0.22, TURN_F = 2.5, CR = 9;
    // the road mask, from the same geometry the roads are drawn with
    const MASK = (() => {
      const segs = [], CS = 100, grid = new Map();
      const gk2 = (cx, cz) => (cx + 300) * 5000 + (cz + 300);
      const add = (pts, hw) => {
        for (let i = 0; i < pts.length - 1; i++) {
          const a = pts[i], b = pts[i + 1], si = segs.length;
          segs.push([a[0], a[1], b[0], b[1], hw]);
          for (let cx = Math.floor((Math.min(a[0], b[0]) - hw) / CS); cx <= Math.floor((Math.max(a[0], b[0]) + hw) / CS); cx++)
            for (let cz = Math.floor((Math.min(a[1], b[1]) - hw) / CS); cz <= Math.floor((Math.max(a[1], b[1]) + hw) / CS); cz++) { const k = gk2(cx, cz); let l = grid.get(k); if (!l) grid.set(k, (l = [])); l.push(si); }
        }
      };
      for (const e of E) {
        if (e.drive) add(e.pts, (H.plaza && e.pts.every(([x, z]) => Math.abs(x - H.plaza.x) < 6 && z > H.plaza.z0 - 10) ? H.plaza.w : e.w) / 2 + 2); // round 5: our roads only; beta 2.92: r185's Olari boulevard at its width
        // polish: a sharp corner's inside is rounded off a little (a chord across it), so a car taking it tight is not caught
        // on a point of kerb the eye hardly sees
        if (e.drive && e.kind !== "ring") for (let i = 1; i < e.pts.length - 1; i++) {
          const a0 = e.pts[i - 1], a1 = e.pts[i], a2 = e.pts[i + 1], dh = wrapA(Math.atan2(a2[0] - a1[0], a2[1] - a1[1]) - Math.atan2(a1[0] - a0[0], a1[1] - a0[1]));
          if (Math.abs(dh) > 0.45 && e.cum[i] > 30 && e.cum[i] < e.len - 30) add([pointAt(e.pts, e.cum, e.cum[i] - 34), pointAt(e.pts, e.cum, e.cum[i] + 34)], e.w / 2 - 4);
        }
      }
      // beta 2.92 (r185): the forecourt in front of Casa Cromatic is road too (the boulevard ends in it)
      if (H.plaza) add([[H.plaza.x, H.plaza.z - 0.5], [H.plaza.x, H.plaza.z + 0.5]], H.plaza.r - 8);
      // the point (x, z) for a car of radius r: on the road, or pushed back onto it (and the kerb's outward normal)
      function resolve(x, z, r) {
        let best = null;
        const cx0 = Math.floor(x / CS), cz0 = Math.floor(z / CS);
        for (let cx = cx0 - 1; cx <= cx0 + 1; cx++) for (let cz = cz0 - 1; cz <= cz0 + 1; cz++) for (const si of grid.get(gk2(cx, cz)) || []) {
          const [ax, az, bx, bz, hw] = segs[si], dx = bx - ax, dz = bz - az, l2 = dx * dx + dz * dz || 1;
          const t = clamp(((x - ax) * dx + (z - az) * dz) / l2, 0, 1), px = ax + dx * t, pz = az + dz * t, d = Math.hypot(x - px, z - pz), slack = hw - r - d;
          if (slack >= 0) return { hit: false, x, z };
          if (!best || slack > best.slack) best = { slack, px, pz, d, lim: hw - r };
        }
        if (!best) return { hit: false, x, z, lost: true };
        const nx = (x - best.px) / (best.d || 1), nz = (z - best.pz) / (best.d || 1), lim = Math.max(0, best.lim);
        return { hit: true, x: best.px + nx * lim, z: best.pz + nz * lim, nx, nz };
      }
      return { resolve, segs: segs.length };
    })();
    // round 5: the closures, where a street that is not ours leaves one of ours: just past our kerb line, across the
    // closed street (its centre, its direction away from our road, its width), drawn by the host
    const CLOSED = (() => {
      const out = [];
      for (const n of N) {
        if (!n.out.some((o) => E[o.e].drive)) continue;
        for (const o of n.out) {
          const e = E[o.e]; if (e.drive) continue;
          const pts = o.dir > 0 ? e.pts : e.rpts, cum = o.dir > 0 ? e.cum : e.rcum;
          for (let s2 = 4; s2 <= Math.min(e.len, 260); s2 += 2) {
            const p = pointAt(pts, cum, s2), a = G.nearest(p[0], p[1], 200, (e2) => e2.drive);
            if (a && a.d < E[a.e].w / 2 + 5) continue;
            const q = pointAt(pts, cum, Math.min(e.len, s2 + 8)), l = Math.hypot(q[0] - p[0], q[1] - p[1]) || 1;
            out.push({ x: p[0], z: p[1], nx: (q[0] - p[0]) / l, nz: (q[1] - p[1]) / l, w: e.w + 4, kind: e.kind });
            break;
          }
        }
      }
      return out;
    })();
    const P = { x: 0, z: 0, h: 0, u: 0, w: 0, yr: 0, st: 0, ds: 0, init: false, contact: 0, vx: 0, vz: 0 };
    function freeInit() {
      const c = H.carPos;
      P.x = c.x; P.z = c.z; P.h = H.heading(); P.u = P.w = P.yr = P.st = 0; P.init = true;
      const q = MASK.resolve(P.x, P.z, CR); P.x = q.x; P.z = q.z;
      D.vL = 0;
    }
    const curL = () => (FREE ? D.vL || 0 : curL());
    // the graph item under the car, in its direction of travel (for the Nearby panel, the road signs, the auto-pilot)
    let syncT = 0;
    function syncGraph(force) {
      const a = G.nearest(P.x, P.z, 120, (e) => e.drive);
      if (!a) return;
      const e = E[a.e], p0 = pointAt(e.pts, e.cum, Math.max(0, a.s - 6)), p1 = pointAt(e.pts, e.cum, Math.min(e.len, a.s + 6));
      const fx = Math.sin(P.h), fz = Math.cos(P.h), moving = Math.abs(P.u) > 8 ? Math.sign(P.u) : 1;
      const dir = ((p1[0] - p0[0]) * fx + (p1[1] - p0[1]) * fz) * moving >= 0 ? 1 : -1;
      const it0 = D.seq[0];
      if (force || D.seq.length !== 1 || !it0 || it0.e !== a.e || it0.dir !== dir) { D.seq = [{ e: a.e, dir, uid: D.uid++ }]; buildPath(); }
      D.vL = locate(P.x, P.z);
    }
    // the physics, one frame
    // round 5 (Daniel: "more arcade, less sim; turn round within the road's width"): a steering wheel that is smoothed and
    // self-centres, a yaw rate capped by speed (tight at a crawl: a radius of 14 units; near a pivot when almost stopped
    // with ↑ or ↓ held, so the car turns round in the road's own width), high grip (only the handbrake slides: Space + ← →
    // is a quick spin), and the car's nose and tail meet the kerb too (three circles), so it stops at a closed street's
    // kerb line instead of poking into it; pushes only ever move it back onto the road, so it can never get stuck
    // beta 2.5 (Daniel: "hold the road much better, more arcade, more fun, more like Mario Kart"): snappier off the line
    // and in the wheel; Space + ← → at speed is a drift (a little hop, the tail out, smoke and marks on the road) that
    // charges a mini-turbo: let go after ~0.6 s for a short boost (longer after ~1.4 s); stopped or slow, Space + ← → is
    // still the quick spin; and the kerbs are soft bumpers: the car bounces off them back into the road, it never grinds
    const DRIFT_V = 110;
    const BOUNDS = (() => { let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity; for (const n of N) { x0 = Math.min(x0, n.x); x1 = Math.max(x1, n.x); z0 = Math.min(z0, n.z); z1 = Math.max(z1, n.z); } return { x0: x0 - 150, x1: x1 + 150, z0: z0 - 150, z1: z1 + 150 }; })();
    // beta 2.7 (Daniel): drift too long at speed (4 s of drifting within 8 s) and the police come: the patrol car arrives behind
    // you, blue lamps flashing, and follows for a 5 s cooldown: top speed ~55%, no drift, no boost; then it drops back and
    // goes. Not with the auto-pilot, the tour or a card open; reduced motion: no flashing
    const COP = { log: [], on: null, trail: [] };
    function copTick(dt) {
      const now = performance.now(), fx = Math.sin(P.h), fz = Math.cos(P.h);
      COP.trail.push([P.x, P.z]); if (COP.trail.length > 400) COP.trail.shift();
      const behind = (dist) => { let acc = 0; for (let i = COP.trail.length - 1; i > 0; i--) { const a = COP.trail[i], b = COP.trail[i - 1]; acc += Math.hypot(a[0] - b[0], a[1] - b[1]); if (acc >= dist) return b; } return COP.trail[0] || [P.x - fx * dist, P.z - fz * dist]; };
      const ok = !D.auto && TUT.i < 0 && !H.cardOpen();
      if (!COP.on) {
        if (D.drift && Math.hypot(P.u, P.w) > VMAX_F * 0.42 && ok) COP.log.push([now, dt]);
        while (COP.log.length && now - COP.log[0][0] > 8000) COP.log.shift();
        D.copSum = COP.log.reduce((a, q) => a + q[1], 0);
        if (ok && D.copSum > 4) {
          COP.log.length = 0;
          const b = behind(260), q = MASK.resolve(b[0], b[1], CR);
          COP.on = { t: 0, x: q.lost ? P.x - fx * 120 : q.x, z: q.lost ? P.z - fz * 120 : q.z, h: P.h };
          D.cop = true; D.drift = null; D.boost = null;
          copEl.classList.add("on"); copEl.querySelector("em").textContent = "5";
        }
        return;
      }
      const c = COP.on; c.t += dt;
      if (c.t > 5 && D.cop) { D.cop = false; copEl.classList.remove("on"); }
      const tgt = c.t > 5 ? behind(70 + (c.t - 5) * 260) : behind(75), k = 1 - Math.exp(-dt * (c.t < 1.2 ? 2.6 : 4));
      const nx = c.x + (tgt[0] - c.x) * k, nz = c.z + (tgt[1] - c.z) * k;
      if (Math.hypot(nx - c.x, nz - c.z) > 0.3) c.h += wrapA(Math.atan2(nx - c.x, nz - c.z) - c.h) * (1 - Math.exp(-dt * 8));
      c.x = nx; c.z = nz;
      if (c.t <= 5) { const left = Math.max(0, 5 - c.t); copEl.querySelector("em").textContent = String(Math.ceil(left)); copEl.style.setProperty("--k", (left / 5).toFixed(3)); }
      if (c.t > 6.4) { COP.on = null; H.cop?.(null); return; }
      H.cop?.({ x: c.x, z: c.z, h: c.h, flash: !reduced() });
    }
    const FX = { hop: 0, bump: 0, squash: 0, boostKick: 0, smokeT: 0, skidL: 0, skidR: 0, lastX: 0, lastZ: 0, side: 0, sparkT: 0, dustT: 0 };
    // the road effects of a frame: tyre smoke and skid marks in a drift (or a hard spin), the mini-turbo's charge as
    // sparks at the rear wheels (blue, then orange), a boost's flame, dust at top speed; none with reduced motion but the marks
    function roadFx(dt) {
      const fxh = H.fx; if (!fxh) return;
      fxh.tick(dt);
      const red = reduced(), [hw, ht] = H.vehSpan?.() || [20, 10], fx = Math.sin(P.h), fz = Math.cos(P.h), rx = -fz, rz = fx, au = Math.abs(P.u);
      const rearX = P.x - fx * hw * 0.85, rearZ = P.z - fz * hw * 0.85;
      const wheel = (sd) => [rearX + rx * ht * sd, rearZ + rz * ht * sd];
      const sliding = !!D.drift || (D.keys.h && au > 25 && Math.abs(P.yr) > 1) || Math.abs(P.w) > 40;
      const moved = Math.hypot(P.x - FX.lastX, P.z - FX.lastZ); FX.lastX = P.x; FX.lastZ = P.z;
      if (sliding && moved < 60) {
        FX.skidL += moved;
        if (FX.skidL > 5) { FX.skidL = 0; for (const sd of [-1, 1]) { const [x, z] = wheel(sd); fxh.skid(x, z, Math.atan2(P.vx || fx, P.vz || fz), 7, 2.4); } }
        FX.smokeT -= dt;
        if (!red && FX.smokeT <= 0) { FX.smokeT = 0.05; FX.side = -FX.side || 1; const [x, z] = wheel(FX.side); fxh.puff(x, 3, z, { r0: 2, r1: 5.5 + Math.random() * 2, life: 0.7, vy: 6, vx: -P.vx * 0.12, vz: -P.vz * 0.12, a: 0.42 }); }
      }
      if (red) return;
      if (D.drift && D.drift.t > 0.6) { // the mini-turbo's charge
        FX.sparkT -= dt;
        if (FX.sparkT <= 0) { FX.sparkT = 0.04; const lvl = D.drift.t > 1.4 ? 2 : 1, sd = Math.random() < 0.5 ? -1 : 1, [x, z] = wheel(sd); fxh.puff(x + (Math.random() - 0.5) * 3, 2.5, z + (Math.random() - 0.5) * 3, { color: lvl === 2 ? "#ffab2e" : "#5fc4ff", r0: 2, r1: 0.4, life: 0.3, vy: 22 + Math.random() * 14, vx: rx * sd * 20, vz: rz * sd * 20, a: 0.95 }); }
      }
      if (D.boost) { // the boost: a flame from the back
        FX.sparkT -= dt;
        if (FX.sparkT <= 0) { FX.sparkT = 0.035; fxh.puff(rearX - fx * 6, 5, rearZ - fz * 6, { color: Math.random() < 0.5 ? "#ffcf3a" : "#ff7a2e", r0: 4, r1: 1.2, life: 0.3, vy: 4, vx: -fx * 90, vz: -fz * 90, a: 0.9 }); }
      }
      if (P.u > VMAX_F * 0.86 && !D.boost) { // light dust at top speed
        FX.dustT -= dt;
        if (FX.dustT <= 0) { FX.dustT = 0.09; FX.side = -FX.side || 1; const [x, z] = wheel(FX.side * 1.3); fxh.puff(x, 2, z, { color: "#e9dfcf", r0: 2, r1: 9, life: 0.6, vy: 5, vx: -P.vx * 0.2, vz: -P.vz * 0.2, a: 0.32 }); }
      }
    }
    function physics(dt, thr, steerIn, hb, assisted) {
      const spinning = (thr !== 0 || hb) && Math.abs(P.u) < 40 && steerIn !== 0; // turning round on the spot: the wheel goes over at once
      P.st += (steerIn - P.st) * (1 - Math.exp(-dt * (spinning ? 16 : steerIn === 0 || assisted ? 11 : Math.abs(steerIn) < Math.abs(P.st) ? 11 : 9)));
      let u = P.u;
      // the drift: starts with Space + ← / → above DRIFT_V, holds while Space is held and the car keeps some speed
      if (!D.drift && hb && u > DRIFT_V && Math.abs(steerIn) > 0.2 && !D.auto && !D.cop) { D.drift = { t: 0, dir: Math.sign(steerIn) }; FX.hop = 1; }
      if (D.drift && (!hb || Math.hypot(u, P.w) < 60)) {
        const t = D.drift.t; D.drift = null;
        if (t > 0.6 && u > 60) { D.boost = { t: 0, dur: t > 1.4 ? 1.15 : 0.7, lvl: t > 1.4 ? 2 : 1 }; FX.boostKick = 1; }
      }
      const drift = D.drift; if (drift) drift.t += dt;
      if (D.boost) { D.boost.t += dt; if (D.boost.t > D.boost.dur) D.boost = null; }
      const boost = D.boost ? 1 - D.boost.t / D.boost.dur : 0;
      // beta 2.5: the auto-pilot drives faster between places (its own top speed, quicker off the line); a boost lifts both
      const vcap = (D.auto?.vmax ? Math.max(VMAX_F, D.auto.vmax * 1.04) : VMAX_F) * (1 + 0.28 * boost) * (D.cop ? 0.55 : 1), acc = (D.auto ? ACC_F * 1.5 : ACC_F) * (1 + 1.5 * boost);
      const crawlCap = !hb && Math.abs(P.st) > 0.6 && Math.abs(u) < 70 ? 28 : Infinity; // turning hard from a crawl: stay slow, turn tight
      if (boost > 0 && u > 0 && thr >= 0) u = Math.min(vcap, u + 520 * boost * dt); // the mini-turbo pushes even off the throttle
      const tA = Math.min(1, Math.abs(thr)), vcapT = vcap * (0.3 + 0.7 * tA); // a stick pushed part way: a gentler, slower drive
      if (thr > 0) { if (u < -4) u = Math.min(0, u + BRAKE_F * tA * dt); else if (u < Math.min(crawlCap, vcapT)) u = Math.min(Math.max(u, Math.min(crawlCap, vcapT)), u + acc * Math.max(0.4, tA) * dt * (1 - Math.max(0, u) / vcap)); else if (u > vcapT + 10 && !boost) u -= (ROLL_F + DRAG_F * u) * dt; }
      else if (thr < 0) { if (u > 4) u = Math.max(0, u - BRAKE_F * Math.max(0.35, tA) * dt); else if (u > -crawlCap) u = Math.max(-VREV_F * Math.max(0.4, tA), Math.min(u, -crawlCap), u - REV_F * dt); }
      else { const dec = (ROLL_F + DRAG_F * Math.abs(u)) * dt; u = Math.abs(u) <= dec ? 0 : u - Math.sign(u) * dec; }
      if (u > vcap) u = Math.max(vcap, u - 260 * dt); // out of a boost: eases back to the normal top speed
      if (hb && !drift) { const dec = 280 * dt; u = Math.abs(u) <= dec ? 0 : u - Math.sign(u) * dec; }
      if (drift) u = Math.max(0, u - 35 * dt); // a drift keeps its speed
      const au = Math.abs(u), sg = au > 4 ? Math.sign(u) : thr < 0 ? -1 : 1;
      let yr = P.st * Math.sign(u) * Math.min(au / 14, (D.auto ? 3.5 : 2.7) / (1 + au / 480)); // the auto-pilot turns a little sharper (it never overshoots)
      if (thr !== 0 && au < 40) yr += P.st * sg * 3.3 * (1 - au / 40);
      else if (thr === 0 && au < 30 && pivots()) yr += P.st * 2.4 * (1 - au / 30); // beta 2.92: the sub and the plane turn on the spot with ← → alone // near a pivot, almost stopped with ↑ or ↓ held (beta 2.5: snappier, ~1 s round)
      if (hb && !drift && Math.abs(P.st) > 0.05) yr = P.st * sg * 3.6; // the handbrake spin (slow)
      if (drift) yr = drift.dir * clamp(1.0 + 0.8 * P.st * drift.dir, 0.25, 1.9) * Math.min(1, au / 160 + 0.4); // into the drift: ← → make it tighter or wider
      yr = clamp(yr, -3.6, 3.6);
      P.yr += (yr - P.yr) * (1 - Math.exp(-dt * 14));
      // the velocity keeps its direction while the car turns under it, and the tyres pull it round: glued to the road
      // (beta 2.5: grip 22), a drift lets the tail out (its own slide), the slow handbrake slides freely
      const f0x = Math.sin(P.h), f0z = Math.cos(P.h), r0x = -f0z, r0z = f0x;
      let vx = f0x * u + r0x * P.w, vz = f0z * u + r0z * P.w;
      P.h += P.yr * dt;
      const fx = Math.sin(P.h), fz = Math.cos(P.h), rx = -fz, rz = fx;
      u = vx * fx + vz * fz; let w = vx * rx + vz * rz;
      if (drift) { const sp = Math.hypot(u, w); w *= Math.exp(-dt * 3.2); u = Math.sign(u || 1) * Math.sqrt(Math.max(0, sp * sp - w * w)); } // a drift keeps its speed while the tail comes round
      else w *= Math.exp(-dt * (hb ? 1.6 : 22));
      vx = fx * u + rx * w; vz = fz * u + rz * w;
      let nx = P.x + vx * dt, nz = P.z + vz * dt, hit = false, lost = false, impact = 0;
      const half = clamp(H.carLen() * 0.5 - CR + 2, 2, 20); // polish: the footprint of a laptop's car (phones show a bigger one)
      // polish: turning round on the spot, the car eases towards the middle of the road, so nose and tail clear both kerbs
      if (thr !== 0 && !hb && au < 40 && Math.abs(P.st) > 0.3) {
        const a = G.nearest(nx, nz, 60, (e) => e.drive && e.kind !== "ring");
        if (a && a.d > 1) { const e = E[a.e], c = pointAt(e.pts, e.cum, a.s), k = Math.min(1, (150 * dt * Math.abs(P.st) * (1 - au / 70)) / a.d); nx += (c[0] - nx) * k; nz += (c[1] - nz) * k; }
      }
      const flying = H.vehicle() === "plane"; // beta 2.92 (Daniel): the plane flies over the fountain, the kerbs, the closures
      if (flying) { nx = clamp(nx, BOUNDS.x0, BOUNDS.x1); nz = clamp(nz, BOUNDS.z0, BOUNDS.z1); }
      for (let pass = 0; pass < (flying ? 0 : 2); pass++) for (const k of [0, 1, -1]) {
        const px = nx + fx * half * k, pz = nz + fz * half * k, q = MASK.resolve(px, pz, k ? CR - 4 : CR); // the ends rounder: a car turning round in the road's width may overhang its kerb a little at the corners
        if (q.lost) { if (!k) lost = true; continue; }
        if (!q.hit) continue;
        nx += q.x - px; nz += q.z - pz; hit = true;
        const vn = vx * q.nx + vz * q.nz;
        // beta 2.5: a soft bumper: the push into the kerb comes back out as a bounce (not a grind along it)
        if (vn > 0) { impact = Math.max(impact, vn); const b = vn * (vn > 35 ? 1.45 : 1); vx -= q.nx * b; vz -= q.nz * b; }
      }
      if (hit) {
        const k = Math.exp(-dt * 0.7); vx *= k; vz *= k;
        // and the car turns with its new way (back along the road), so it does not nose into the kerb again
        const sp = Math.hypot(vx, vz);
        if (sp > 25 && !drift) { const want = Math.atan2(vx, vz) + (u < 0 ? Math.PI : 0); P.h += wrapA(want - P.h) * (1 - Math.exp(-dt * 7)); }
        const gx = Math.sin(P.h), gz = Math.cos(P.h);
        u = vx * gx + vz * gz; w = vx * -gz + vz * gx;
        P.contact = 0.3;
        if (impact > 45) { const s = Math.min(1, impact / 260); if (!reduced()) { FX.bump = Math.max(FX.bump, s); FX.squash = Math.max(FX.squash, s); } SND.thud(s); }
      } else if (lost) { // nowhere near a road (should not happen): back to the last good spot
        nx = P.x; nz = P.z; u = 0; w = 0;
      }
      P.contact = Math.max(0, P.contact - dt);
      { const gx = Math.sin(P.h), gz = Math.cos(P.h); P.ds = (nx - P.x) * gx + (nz - P.z) * gz; }
      P.x = nx; P.z = nz; P.u = u; P.w = w; P.vx = vx; P.vz = vz;
      D.v = u;
      if (u < -0.5) D.revDist = (D.revDist || 0) + Math.abs(P.ds);
      if (Math.abs(u) > 30) D.moved = true;
      if (Math.abs(u) < 60) D.slowTurn = (D.slowTurn || 0) + Math.abs(P.yr) * dt; // turning round (the tutorial's "back" step)
    }
    // round 5: the steering assist, with no ← → held: the car aims a little ahead along the road it is on (on through a
    // junction when one way is straight on, else fading out as it nears it, so the turn stays yours), in its right-hand
    // lane: it self-aligns with the road, follows its bends and keeps its lane; and it eases off for a bend it cannot take
    // the nose about to touch a kerb: a steer away from it (the assist and the auto-pilot both use it)
    function kerbAway() {
      const fx = Math.sin(P.h), fz = Math.cos(P.h), half = clamp(H.carLen() * 0.5 - CR + 2, 2, 20), k2 = MASK.resolve(P.x + fx * half, P.z + fz * half, CR + 4);
      return k2.hit ? clamp((k2.nx * -fz + k2.nz * fx) * 1.4, -0.9, 0.9) : 0;
    }
    // on the ring (or just at its edge): which side is out (the steer sign that means "out"), and the next exit ahead the
    // way you are going round (the one a tap out takes); null off the ring. beta 3.20 (r197): shared by the tap and the marker
    function ringNext() {
      const rx2 = P.x - H.fork.x, rz2 = P.z - H.fork.y, rr = Math.hypot(rx2, rz2);
      if (!(rr < 105 && rr > 30)) return null;
      const fx = Math.sin(P.h), fz = Math.cos(P.h), outSign = (fz * rx2 - fx * rz2) > 0 ? 1 : -1;
      const ac = Math.atan2(rz2, rx2), sgn = rx2 * fz - rz2 * fx > 0 ? 1 : -1; // the way round: + or - in angle
      let best = null;
      for (const n of ringNodes) for (const o of N[n].out) {
        const e = E[o.e]; if (e.kind === "ring" || !e.drive) continue;
        const h0 = outH(o), ox = Math.sin(h0), oz = Math.cos(h0), nx = N[n].x - H.fork.x, nz = N[n].z - H.fork.y;
        if (ox * nx + oz * nz <= 0) continue; // leads away from the fountain
        let d = ((Math.atan2(nz, nx) - ac) * sgn) % (2 * Math.PI); if (d < 0) d += 2 * Math.PI;
        if (d < 0.12 || d > 2.6) continue;
        // beta 3.20 (r197): and the arm it leads to is ahead too (an arm's other link, taken backwards, led out behind you,
        // to the arm just passed, or the one you came in by)
        const f = dpts(o)[dpts(o).length - 1];
        let dA = ((Math.atan2(f[1] - H.fork.y, f[0] - H.fork.x) - ac) * sgn) % (2 * Math.PI); if (dA < 0) dA += 2 * Math.PI;
        if (dA < 0.12 || dA > 2.9) continue;
        if (!best || d < best.d) best = { e: o.e, dir: o.dir, d, n, ang: Math.atan2(nz, nx) };
      }
      return { outSign, sgn, rr, rx: rx2, rz: rz2, best };
    }
    const ringExits = new Map();
    function ringExitFor(spoke) {
      const k = spoke.e * 2 + (spoke.dir > 0 ? 1 : 0);
      if (ringExits.has(k)) return ringExits.get(k);
      const hin = inH(spoke);
      let best = null;
      for (const n of ringNodes) for (const o of N[n].out) {
        const e = E[o.e]; if (e.kind === "ring" || !e.drive || (o.e === spoke.e)) continue;
        const d = Math.abs(wrapA(outH(o) - hin));
        if (!best || d < best.d) best = { e: o.e, dir: o.dir, d };
      }
      ringExits.set(k, best);
      return best;
    }
    function assist() {
      const au = Math.abs(P.u);
      if (H.vehicle() === "plane" && Math.hypot(P.x - H.fork.x, P.z - H.fork.y) < 200) return { steer: 0, vmax: Infinity }; // beta 2.92: straight over the fountain
      const a = G.nearest(P.x, P.z, 90, (e) => e.drive);
      if (!a) return null;
      const e0 = E[a.e], fx = Math.sin(P.h), fz = Math.cos(P.h);
      const t0 = pointAt(e0.pts, e0.cum, Math.max(0, a.s - 5)), t1 = pointAt(e0.pts, e0.cum, Math.min(e0.len, a.s + 5));
      let it = { e: a.e, dir: ((t1[0] - t0[0]) * fx + (t1[1] - t0[1]) * fz) >= 0 ? 1 : -1 };
      if (against(it)) return null; // the wrong way round the ring: your call
      // the road ahead, as far as a stop needs: on along the same street, straight on through a junction, into the
      // roundabout its own way round (and round it, until you steer out); else it ends at the junction
      const look = e0.kind === "ring" ? 20 + au * 0.3 : 34 + au * 0.42, far = Math.max(look + 10, 60 + (au * au) / (2 * 520));
      let s0 = it.dir > 0 ? a.s : e0.len - a.s, run = 0, open = true, aimIt = it;
      const pts2 = [];
      for (let k = 0; k < 5; k++) {
        const p = dpts(it), c = dcum(it), L = c[c.length - 1];
        for (let s2 = s0; s2 < L && run + s2 - s0 <= far; s2 += 10) pts2.push([...pointAt(p, c, s2), run + s2 - s0, it]);
        if (run + L - s0 > far) break;
        run += L - s0;
        const hin = inH(it), n = endNode(it);
        const cs = N[n].out.filter((o) => E[o.e].drive && !(o.e === it.e && o.dir === -it.dir) && !against(o)).map((o) => ({ o, d: Math.abs(wrapA(outH(o) - hin)) })).sort((x, y) => x.d - y.d);
        const ringOn = cs.find((c2) => E[c2.o.e].kind === "ring");
        // polish (Daniel: no circling forever): into the roundabout, ↑ alone means straight on: the arm nearest the way you came in
        if (E[it.e].kind !== "ring" && ringOn && (!cs[0] || cs[0].d > 0.5)) D.ringExit = ringExitFor(it);
        const out = E[it.e].kind === "ring" && D.ringExit ? cs.find((c2) => c2.o.e === D.ringExit.e && c2.o.dir === D.ringExit.dir) : null;
        const nx2 = out || (E[it.e].kind === "ring" ? ringOn : cs[0] && cs[0].d <= 0.5 ? cs[0] : ringOn);
        if (!nx2) { pts2.push([...pointAt(p, c, L), run, it]); open = false; break; }
        it = nx2.o; s0 = 0;
      }
      if (pts2.length < 2) return null;
      let laneK = 1, kinkAt = null;
      for (let i = 2; i < pts2.length; i++) { const A = pts2[i - 2], B = pts2[i - 1], C = pts2[i]; if (A[3].e !== C[3].e && Math.abs(wrapA(Math.atan2(C[0] - B[0], C[1] - B[1]) - Math.atan2(B[0] - A[0], B[1] - A[1]))) > 0.35) { laneK = clamp((B[2] - 25) / 70, 0, 1); kinkAt = B[2]; break; } }
      // the aim: `look` ahead, in the right-hand lane (the ring: its middle); a junction ahead with no way straight on fades it;
      // before a corner it aims no further than just past it (aiming beyond cut the corner across the kerb)
      const lk = kinkAt != null ? Math.min(look, Math.max(18, kinkAt + 16)) : look;
      let wide = 0; // in a bend: the lane gives way to a wide line (aim a little to the outside), so the car's nose clears the inside corner
      { let mt = 0, turn = 0; for (let i = 3; i < pts2.length && pts2[i][2] < 90; i++) { const A = pts2[i - 3], B = pts2[i - 1], C = pts2[i], dh = wrapA(Math.atan2(C[0] - B[0], C[1] - B[1]) - Math.atan2(B[0] - A[0], B[1] - A[1])); mt = Math.max(mt, Math.abs(dh) / Math.max(8, (C[2] - A[2]) / 2)); turn += dh; } laneK *= clamp(1 - mt * 70, 0, 1); wide = -Math.sign(turn) * Math.min(11, mt * 650); }
      let j = pts2.findIndex((q) => q[2] >= lk); if (j < 0) j = pts2.length - 1;
      const q = pts2[j], q2 = pts2[Math.min(pts2.length - 1, j + 1)] !== q ? pts2[Math.min(pts2.length - 1, j + 1)] : pts2[j - 1], sgn = q2 === pts2[j - 1] ? -1 : 1;
      let ax = q[0], az = q[1];
      { const dx = (q2[0] - ax) * sgn, dz = (q2[1] - az) * sgn, l = Math.hypot(dx, dz) || 1, lane = E[q[3].e].kind === "ring" ? 0 : Math.min(9, E[q[3].e].w * 0.16) * laneK + wide; ax += (-dz / l) * lane; az += (dx / l) * lane; }
      const fade = open ? 1 : clamp((pts2[pts2.length - 1][2] - 30) / 80, 0, 1);
      const dist = Math.hypot(ax - P.x, az - P.z) || 1, err = wrapA(Math.atan2(ax - P.x, az - P.z) - P.h);
      if (Math.abs(err) > (P.contact > 0 ? 1.75 : E[q[3].e].kind === "ring" ? 1.4 : 1.1)) return null; // crosswise (a spin, a turn half done): yours
      // the speed for the bends ahead: each 30 units' turn, reached by braking
      let vmax = Infinity;
      for (let i = 3; i < pts2.length; i++) {
        const A = pts2[i - 3], B = pts2[i - 1], C = pts2[i];
        let t = Math.abs(wrapA(Math.atan2(C[0] - B[0], C[1] - B[1]) - Math.atan2(B[0] - A[0], B[1] - A[1]))) / Math.max(8, (C[2] - A[2]) / 2) * 1.5;
        t = Math.min(t, 1 / 19); // a kink at a junction: the car rounds it (a radius of some 26 units at least)
        if (t > 1e-3) { const vy = (-t + Math.sqrt(t * t + (4 * t / 480) * 2.2)) / ((2 * t) / 480); vmax = Math.min(vmax, Math.sqrt(Math.min(1100 / t, vy * vy) + 2 * 400 * Math.max(0, A[2] - 10))); }
      }
      if (!open) vmax = Math.min(vmax, Math.sqrt(90 * 90 + 2 * 480 * Math.max(0, pts2[pts2.length - 1][2] - 40))); // a junction to choose at: arrive at it slowly
      // and it keeps the car's nose off the kerb: a kerb within a few units of the nose steers it away (corners, tight bends)
      return { steer: clamp(err * 2.2 * fade + kerbAway(), -1, 1), vmax };
    }
    // the auto-pilot on the same physics: pure pursuit of its route (the right-hand lane), slowing for the bends and the stop
    function pursuit(dt) {
      const a = D.auto, Lp = locate(P.x, P.z, D.vL, 120); D.vL = Lp;
      const au = Math.abs(P.u);
      if (a.rev) {
        const rem = Lp - a.Lt;
        const [tx, tz] = pathPos(Math.max(a.Lt, Lp - (28 + au * 0.3)));
        const err = wrapA(Math.atan2(tx - P.x, tz - P.z) + Math.PI - P.h);
        const vt = -Math.min(VREV_F * 0.8, Math.sqrt(2 * BRAKE_F * 0.5 * Math.max(0, rem)));
        return { rem, steer: clamp(-err * 2.4, -1, 1), thr: P.u > vt + 8 ? -1 : P.u < vt - 8 && P.u < -4 ? 1 : 0 };
      }
      if (a.turn) {
        const [x0, z0] = pathPos(Math.min(D.total, Lp + 4)), [x1, z1] = pathPos(Math.min(D.total, Lp + 30));
        const err = wrapA(Math.atan2(x1 - x0, z1 - z0) - P.h);
        if (Math.abs(err) < 0.45) a.turn = false;
        else if (P.u > 30) return { rem: a.Lt - Lp, steer: 0, thr: -1 }; // brake first (a hard stop, arcade)
        else return { rem: a.Lt - Lp, steer: err > 0 ? 1 : -1, thr: 1, spin: true }; // round on the spot
      }
      let la = 36 + au * 0.35, keep = 10;
      { let i = 0; while (i < D.cum.length - 1 && D.cum[i] < Lp) i++; for (; i < D.cum.length && D.cum[i] < Lp + Math.max(la, 110); i++) if (D.kap[i] > 1 / 65) { const dk = D.cum[i] - Lp; la = Math.min(la, Math.max(18, dk < 28 ? dk + 16 : dk)); keep = 10 * clamp((dk - 25) / 80, 0, 1); break; } } // before a corner: aim just past it, in the middle of the road
      const rem = a.Lt - Lp, L2 = Math.min(D.total, Lp + la);
      let [tx, tz] = pathPos(L2); const [ax2, az2] = pathPos(Math.min(D.total, L2 + 4)); const tl = Math.hypot(ax2 - tx, az2 - tz) || 1;
      tx += (-(az2 - tz) / tl) * keep; tz += ((ax2 - tx) / tl) * keep; // keep right
      const err = wrapA(Math.atan2(tx - P.x, tz - P.z) - P.h);
      let vt = Math.min(a.vmax || VMAX_F * 0.82, Math.sqrt(2 * BRAKE_F * 0.7 * Math.max(0, rem)));
      { let i = 0; while (i < D.cum.length - 1 && D.cum[i] < Lp) i++; for (; i < D.cum.length && D.cum[i] < Lp + 300 + au * 0.9; i++) { const k = D.kap[i]; if (k > 1e-4) { const vy = (-k + Math.sqrt(k * k + (4 * k / 480) * 3.1)) / ((2 * k) / 480); vt = Math.min(vt, Math.sqrt(Math.min(ALAT * 1.6 / k, vy * vy) + 2 * BRAKE_F * 0.6 * Math.max(0, D.cum[i] - Lp))); } } }
      vt *= Math.max(0.45, 1 - Math.abs(err) * 0.5);
      if (rem > 20) vt = Math.max(vt, 30); // beta 2.91: never stall short of the place
      return { rem, steer: clamp(err * 2.4 + kerbAway(), -1, 1), thr: P.u < vt - 8 ? 1 : P.u > vt + 8 && P.u > 4 ? -1 : 0 };
    }
    // beta 2.5 (Daniel: "a place behind the car: turn round fast, arcade"): the route is planned both ways, as the car
    // points and as if it were turned round; when turned round is the shorter way (or the place is just behind), the
    // auto-pilot first spins the car round on the spot (about a second, in the road's width), then drives
    function freeGo(target, pl) {
      syncGraph(true);
      const it = D.seq[0], e = E[it.e], L = curL(), sDir = clamp(L - it.L0, 0, e.len), tsDir = it.dir > 0 ? target.s : e.len - target.s;
      if (target.e === it.e && tsDir < sDir - 8 && sDir - tsDir < 70 && Math.abs(P.u) < 60) { D.auto = { pl, target, rev: true, Lt: it.L0 + tsDir }; return true; } // a few metres back: backs up to it
      const fwd = plan(target);
      const itR = { e: it.e, dir: -it.dir, uid: D.uid++ };
      D.seq = [itR]; buildPath(); D.vL = locate(P.x, P.z);
      let bwd = plan(target);
      if (!fwd && !bwd) { PLAN_LOOSE = true; bwd = plan(target); PLAN_LOOSE = false; }
      // on the ring facing against its flow: always turn round first (beta 2.91: a tap there did nothing, or the car stood)
      const turn = !!bwd && (!fwd || against(it) || bwd.cost + 110 + Math.max(0, P.u) * 0.6 < fwd.cost) && !against(itR);
      const base = turn ? itR : { e: it.e, dir: it.dir, uid: D.uid++ };
      const p = turn ? bwd : fwd;
      if (!p) { D.seq = [base]; buildPath(); D.vL = locate(P.x, P.z); return false; }
      D.seq = [base, ...p.legs.filter((q, i) => !(i === 0 && q.e === base.e && q.dir === base.dir)).map((q) => ({ e: q.e, dir: q.dir, uid: D.uid++ }))];
      buildPath();
      D.vL = locate(P.x, P.z);
      let Lt = D.total;
      for (let k = D.seq.length - 1; k >= 0; k--) { const q = D.seq[k]; if (q.e !== target.e) continue; const s = q.dir > 0 ? target.s : E[q.e].len - target.s; Lt = Math.max(0, q.L0 + s - (pl && !pl.tap ? 18 : 0)); break; }
      const dist = Math.max(0, Lt - D.vL);
      // beta 2.5: faster between places, more so the further it is (x1.3 on a short hop, up to x1.9 across the city)
      const vmax = VMAX_F * 0.82 * clamp(1.3 + (dist - 500) / 3500 * 0.6, 1.3, 1.9);
      D.auto = { pl, target, legs: [], Lt, turn: turn, vmax };
      return true;
    }
    function freeTick(dt, now) {
      if (!P.init) freeInit();
      H.setTarget(H.state.L);
      let thr = 0, steer = 0, hb = !!D.keys.h;
      if (D.auto) {
        const c = pursuit(dt); thr = c.thr; steer = c.steer;
        if (c.rem < 10 && Math.abs(P.u) < 25) { P.u *= 0.5; if (Math.abs(P.u) < 6) { P.u = 0; P.w = 0; const pl = D.auto.pl; D.auto = null; if (pl && !pl.tap) arrive(pl); else { if (pl) H.arrive(pl); H.mapNav.place = null; H.mark(); } render(true); } }
      } else {
        thr = (D.keys.u ? 1 : 0) - (D.keys.d ? 1 : 0); steer = (D.keys.l ? 1 : 0) - (D.keys.r ? 1 : 0);
        if (D.stick) { thr = D.stick.y; steer = -D.stick.x; } // beta 2.7: the phone's stick, proportional
      }
      let assisted = false;
      if (!D.auto && steer !== 0 && D.ringExit && Math.hypot(P.x - H.fork.x, P.z - H.fork.y) > 110) D.ringExit = null; // steering yourself, off the ring: your own way
      // beta 2.91 (Daniel: "exiting the roundabout should be easier"; r182's smooth links): on the ring, a tap outwards
      // means "the next exit": the assist takes the next arm ahead out (a tap inwards: stay on the ring)
      if (!D.auto && steer !== 0) {
        const rn = ringNext();
        if (rn) {
          if (Math.sign(steer) === rn.outSign) {
            if (rn.best) { D.ringExit = { e: rn.best.e, dir: rn.best.dir }; D.ringTap = performance.now(); }
          } else if (D.ringExit && performance.now() - (D.ringTap || 0) > 300) D.ringExit = { e: -1, dir: 0 }; // inwards: round again
        }
      }
      if (!D.auto && steer === 0 && !hb && (P.u > 12 || (P.contact > 0 && thr > 0 && P.u >= 0))) {
        const as = assist();
        if (as) { D.asv = Math.round(Math.min(as.vmax, 9999)); steer = as.steer; assisted = true; if (thr > 0 && P.u > as.vmax - 5) thr = P.u > as.vmax + 12 ? -1 : 0; }
      }
      D.assist = assisted;
      physics(dt, thr, steer, hb, assisted);
      roadFx(dt);
      copTick(dt);
      SND.update(dt);
      { const au = !!D.auto; if (au !== D.autoCls) { D.autoCls = au; document.body.classList.toggle("n2-driving-auto", au); } } // beta 2.6: the phone's tap hint steps aside while it drives
      lamps(P.u < -0.5 || (D.keys.d && P.u <= 0.5 && !D.auto));
      if (!D.auto) {
        syncT -= dt;
        if (syncT <= 0) { syncT = 0.2; syncGraph(false); }
        else D.vL = locate(P.x, P.z, D.vL, 80);
        // arrivals: slowly past (or stopped at) a place opens its card
        if (Math.abs(P.u) < 14) { const here = hereAt(); if (here && here.pl !== D.lastArr) arrive(here.pl); }
      }
      if (D.lastArr) { const p = PL.find((q) => q.pl === D.lastArr); if (p && Math.hypot(P.x - p.ax, P.z - p.az) > 200) { D.lastArr = null; if (D.cardFor) { H.hideCard(); D.cardFor = null; } if (!D.auto) { H.mapNav.place = null; H.mark(); } } }
      const dec = nextDecision(curL());
      freeUI();
      arms(curL(), dec);
      nextExit(dt);
      tutTick();
      panelT -= dt;
      if (panelT <= 0) { panelT = 0.22; document.body.classList.toggle("n2-card", H.cardOpen()); render(); }
    }
    let freeSig = "";
    function freeUI() {
      let hint = phoneUI() ? "DRAG THE STICK TO DRIVE" : touchUI ? "↑ GO · ← → STEER · ↓ BACK" : "↑ GO · ← → STEER · ↓ BACK · SPACE + ← → DRIFT";
      if (D.assist && Math.hypot(P.x - H.fork.x, P.z - H.fork.y) < 110) hint = phoneUI() ? "ROUNDABOUT · STRAIGHT ON · NUDGE → FOR THE NEXT EXIT" : "ROUNDABOUT · ↑ STRAIGHT ON · TAP → FOR THE NEXT EXIT";
      if (D.moved && Math.abs(P.u) < 5 && !D.auto && P.contact <= 0) hint = phoneUI() ? "STOPPED · ↑ + ← → TURNS YOU ROUND" : "STOPPED · ↑ OR ↓ WITH ← → TURNS YOU ROUND"; // round 5
      if (D.auto) hint = D.auto.rev ? "BACKING UP TO IT · ANY KEY TAKES OVER" : "DRIVING YOU THERE · ANY KEY TAKES OVER";
      else if (D.drift) hint = D.drift.t > 1.4 ? "DRIFT · LET GO OF SPACE: SUPER BOOST" : D.drift.t > 0.6 ? "DRIFT · LET GO OF SPACE: BOOST" : "DRIFT · HOLD SPACE, STEER WITH ← →";
      else if (D.boost) hint = D.boost.lvl > 1 ? "SUPER BOOST!" : "BOOST!";
      else if (P.u < -5) hint = "REVERSING";
      else if (P.contact > 0 && (Math.abs(P.u) > 3 || D.keys.u || D.keys.d)) hint = phoneUI() ? "THE KERB · STEER OR BACK UP" : "THE KERB · STEER AWAY OR BACK UP";
      if (hint === freeSig) return;
      freeSig = hint;
      for (const k of "udlr") { keyEls[k].classList.remove("off", "need"); }
      hintEl.textContent = hint;
    }

    // ===================== 2s. beta 2.8: sound (Daniel) =====================
    // All generated with Web Audio (no files): the car's engine following the physics (its pitch from a little gearbox
    // model, louder with the throttle, an idle burble when stopped), tyres squealing in a drift, a whoosh on a boost, a
    // rubbery thud on a kerb, the police siren in the cooldown; and the city: a far traffic hum, wind, birds, now and then a
    // far horn, a café murmur near Two Minutes. Mixed by the view (Street: the car up front; Bird's eye: the city). It starts
    // on the first touch or key (browsers ask for one), fades in, never loud; a speaker button mutes it (cz-sound); silent
    // with the tab hidden, under a case page or the boarding pass. Per frame it only sets a few parameter targets.
    // beta 2.9 (Daniel: "the engine sounds very weird: much more realistic, for every vehicle, and much quieter"): a
    // combustion model, pre-rendered: for each ride, at a few rpm steps and two loads (on the throttle / off it), a short
    // seamless loop is built in an OfflineAudioContext: a pulse train at the firing frequency (rpm / 60 x cylinders / 2;
    // a two-stroke fires every turn), each firing a low thump and a short burst of noise, a little uneven from cylinder to
    // cylinder and from cycle to cycle, then an exhaust: a pipe resonance (a comb), a muffler (a lowpass) and the body (a
    // peak); on the throttle the intake breathes in time with it, off it the pulses thin out and crackle; a diesel knocks,
    // an old carb idles rough. At run time the two nearest steps play, pitched to the exact rpm and crossfaded, the two
    // loads crossfaded too. The submarine is an electric whine and a propeller's wash; the plane a turboprop and a jet's rush.
    const ENGINES = {
      dacia1300: { kind: "ice", cyl: 4, idle: 820, max: 5600, gears: [0, 95, 190, 290, 400], thump: 1.0, noise: 0.55, pipe: 3.1, fb: 0.55, muf: 1500, body: 115, rough: 0.09, carb: 1, level: 1 },
      cop: { kind: "ice", cyl: 4, idle: 850, max: 5800, gears: [0, 100, 200, 300, 410], thump: 1.0, noise: 0.62, pipe: 3.0, fb: 0.55, muf: 1700, body: 120, rough: 0.07, carb: 1, level: 1.2 },
      groovy: { kind: "ice", cyl: 4, idle: 750, max: 4200, diesel: 1, gears: [0, 80, 160, 250, 360], thump: 1.1, noise: 0.5, pipe: 3.8, fb: 0.5, muf: 1100, body: 95, rough: 0.06, level: 1 },
      foodvan: { kind: "ice", cyl: 6, idle: 620, max: 3200, diesel: 1, gears: [0, 70, 140, 220, 320], thump: 1.25, noise: 0.45, pipe: 4.6, fb: 0.5, muf: 900, body: 80, rough: 0.05, level: 1.05 },
      monopoly: { kind: "ice", cyl: 6, idle: 600, max: 4600, gears: [0, 110, 220, 340], thump: 0.9, noise: 0.35, pipe: 3.4, fb: 0.62, muf: 1200, body: 105, rough: 0.025, level: 0.9 },
      f1: { kind: "ice", cyl: 10, idle: 4000, max: 18000, gears: [0, 60, 110, 160, 210, 260, 320, 400], thump: 0.7, noise: 0.9, pipe: 1.3, fb: 0.45, muf: 5200, body: 300, rough: 0.02, level: 0.85 },
      scooter: { kind: "ice", cyl: 1, two: 1, idle: 1900, max: 9000, gears: [0], thump: 0.6, noise: 1.0, pipe: 1.9, fb: 0.6, muf: 3200, body: 260, rough: 0.05, level: 0.75 },
      sub: { kind: "electric", level: 0.5 },
      plane: { kind: "turbo", level: 0.9 }
    };
    async function renderEngine(pr, sr) {
      const OAC = window.OfflineAudioContext || window.webkitOfflineAudioContext; if (!OAC) return null;
      const steps = []; for (let i = 0; i < 6; i++) steps.push(pr.idle * Math.pow(pr.max / pr.idle, i / 5));
      const fire = (rpm) => (rpm / 60) * (pr.two ? 1 : pr.cyl / 2);
      const one = async (rpm, load, isIdle) => {
        const fF = fire(rpm), T0 = 1 / fF, N = Math.max(8, Math.round(0.7 * fF)), L = Math.round(N * T0 * sr), pre = L, len = pre + L;
        const raw = new Float32Array(len), pat = [];
        let seed = Math.round(rpm * 7 + load * 13 + 1); const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
        for (let k = 0; k < N; k++) pat.push({ j: (rnd() - 0.5) * 2 * pr.rough * (isIdle && pr.carb ? 2.2 : 1), a: 1 + (((k % (pr.two ? 1 : pr.cyl)) * 0.37) % 0.3 - 0.15) * (pr.rough * 4) + (rnd() - 0.5) * pr.rough * 2, pop: !load && rnd() < 0.06 && rpm > pr.idle * 1.8 });
        const fT = Math.min(2400, Math.max(45, fF * 1.6)), tauT = Math.min(0.03, 2.2 / fF / 3), tauN = Math.min(pr.diesel ? 0.0009 : pr.two ? 0.0022 : 0.0016, 0.4 / fF); // a fast engine's bursts stay shorter than its period (a tone, a scream)
        const amp = load ? 1 : 0.38;
        for (let rep2 = 0; rep2 < 2; rep2++) for (let k = 0; k < N; k++) {
          const p = pat[k], t0 = Math.round((rep2 * N + k + p.j) * T0 * sr); if (t0 < 0 || t0 >= len) continue;
          const A = amp * p.a, n1 = Math.min(len - t0, Math.round(sr * Math.max(tauT * 5, 0.02)));
          for (let i = 0; i < n1; i++) {
            const t = i / sr;
            let v = pr.thump * A * Math.sin(2 * Math.PI * fT * t) * Math.exp(-t / tauT);
            v += pr.noise * A * (rnd() * 2 - 1) * Math.exp(-t / tauN);
            if (pr.diesel) v += 0.5 * A * (rnd() * 2 - 1) * Math.exp(-t / 0.00035) * (isIdle ? 1.6 : 1); // the knock
            if (p.pop) v += 1.4 * (rnd() * 2 - 1) * Math.exp(-t / 0.0012); // overrun crackle
            raw[t0 + i] += v;
          }
        }
        // the intake, on the throttle: noise breathing at the firing rate
        if (load) for (let i = 0; i < len; i++) { const ph = (i / sr) * fF; raw[i] += 0.12 * (rnd() * 2 - 1) * (0.5 + 0.5 * Math.sin(2 * Math.PI * ph)) * Math.min(1, rpm / pr.max + 0.2); }
        // mechanical clatter at idle (valves, an old engine's ticking)
        if (isIdle && (pr.carb || pr.diesel)) for (let k = 0; k < N * 2; k++) { const t0 = Math.round((k + 0.5) * T0 * 0.5 * sr); for (let r2 = 0; r2 < 2; r2++) { const b = t0 + r2 * L; for (let i = 0; i < 40 && b + i < len; i++) raw[b + i] += 0.08 * (rnd() * 2 - 1) * Math.exp(-i / 8); } }
        // the pipe: a comb (done here: a Web Audio feedback loop can't be shorter than a render quantum)
        { const Dd = Math.max(1, Math.round((pr.pipe / 1000) * sr)); for (let i = Dd; i < len; i++) raw[i] += pr.fb * raw[i - Dd]; }
        const oc = new OAC(1, len, sr), b = oc.createBuffer(1, len, sr); b.copyToChannel(raw, 0);
        const src = oc.createBufferSource(); src.buffer = b;
        const sum = oc.createGain(); src.connect(sum);
        const muf = oc.createBiquadFilter(); muf.type = "lowpass"; muf.frequency.value = pr.muf * (load ? 1 : 0.75); muf.Q.value = 0.8;
        const body = oc.createBiquadFilter(); body.type = "peaking"; body.frequency.value = pr.body; body.Q.value = 1.4; body.gain.value = 7;
        const hp = oc.createBiquadFilter(); hp.type = "highpass"; hp.frequency.value = 35;
        sum.connect(muf); muf.connect(body); body.connect(hp); hp.connect(oc.destination);
        src.start();
        const out = await oc.startRendering(), d = out.getChannelData(0).slice(pre, pre + L);
        let rms = 0; for (let i = 0; i < d.length; i++) rms += d[i] * d[i]; rms = Math.sqrt(rms / d.length) || 1;
        const k2 = 0.18 / rms; for (let i = 0; i < d.length; i++) d[i] = Math.max(-1, Math.min(1, d[i] * k2));
        return d;
      };
      // beta 2.91: one loop per task, when the page is idle (the whole set in one go was ~0.5 s of main thread: the
      // "first drive on a phone stutters" of 2.9, as the sound started with the first touch)
      const idle = () => new Promise((r) => (window.requestIdleCallback || setTimeout)(r, { timeout: 400 }));
      const on = [], off = [];
      for (let i = 0; i < steps.length; i++) { await idle(); on.push(await one(steps[i], 1, i === 0)); await idle(); off.push(await one(steps[i], 0, i === 0)); }
      return { steps, on, off, sr };
    }
    // the rendered loops, kept per ride (they need no AudioContext: rendered ahead, before the first touch)
    const ENG_CACHE = new Map(), ENG_PEND = new Map();
    const engineLoops = (id) => { const pr = ENGINES[id] || ENGINES.dacia1300; if (pr.kind !== "ice") return Promise.resolve(null); if (ENG_CACHE.has(id)) return Promise.resolve(ENG_CACHE.get(id)); if (!ENG_PEND.has(id)) ENG_PEND.set(id, renderEngine(pr, 32000).then((d) => { ENG_CACHE.set(id, d); return d; }).catch(() => null)); return ENG_PEND.get(id); };
    const SND = (() => {
      let on = true, ctx = null, master = null, carBus = null, cityBus = null, E2 = null, C = null, started = false, out = 1, cafe = 0;
      try { on = localStorage.getItem("cz-sound") !== "off"; } catch {}
      const btns = new Set();
      const noiseBuf = (sec, brown) => {
        const b = ctx.createBuffer(1, Math.floor(ctx.sampleRate * sec), ctx.sampleRate), d = b.getChannelData(0);
        let last = 0; for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; if (brown) { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; } else d[i] = w; }
        return b;
      };
      const loop = (buf, rate = 1) => { const n = ctx.createBufferSource(); n.buffer = buf; n.loop = true; n.playbackRate.value = rate; n.start(); return n; };
      const filt = (type, f, q = 0.7) => { const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = f; b.Q.value = q; return b; };
      const gain = (v = 0) => { const g = ctx.createGain(); g.gain.value = v; return g; };
      function build() {
        const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return false;
        ctx = new AC();
        const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -18; comp.ratio.value = 3; comp.connect(ctx.destination); ctx._comp = comp;
        master = gain(0); master.connect(comp);
        carBus = gain(0.8); cityBus = gain(0.6); carBus.connect(master); cityBus.connect(master);
        const white = noiseBuf(2, false), brown = noiseBuf(4, true);
        // the engine (beta 2.9): its own bus; the voice is built per ride (see ENGINES)
        E2 = { g: gain(0), rpm: 820, load: 0, gear: 1, shift: 0, id: null, v: null, cache: new Map(), white };
        E2.g.connect(carBus);
        // the tyres: a narrow band of noise and a wailing tone
        const sq = { n: loop(white, 1.3), bp: filt("bandpass", 2300, 7), o: ctx.createOscillator(), og: gain(0.25), g: gain(0) };
        const sqn = gain(3.2); sq.n.connect(sq.bp); sq.bp.connect(sqn); sqn.connect(sq.g); sq.o.type = "triangle"; sq.o.frequency.value = 1750; sq.o.connect(sq.og); sq.og.connect(sq.g); sq.o.start(); sq.g.connect(carBus);
        E2.sq = sq;
        // the siren: two tones, a lowpass, quiet
        const si = { o: ctx.createOscillator(), lp: filt("lowpass", 1800, 0.8), g: gain(0) }; si.o.type = "square"; si.o.frequency.value = 720; si.o.connect(si.lp); si.lp.connect(si.g); si.g.connect(carBus); si.o.start(); E2.si = si;
        // the city: a far traffic hum, wind that comes and goes, the café
        C = { hum: gain(0.5), wind: gain(0.0), windBp: filt("bandpass", 600, 0.5), cafe: gain(0), birdT: 0, hornT: 0 };
        const hn = loop(brown, 0.7), hlp = filt("lowpass", 380, 0.6); hn.connect(hlp); hlp.connect(C.hum); C.hum.connect(cityBus);
        const wn = loop(white, 0.5); wn.connect(C.windBp); C.windBp.connect(C.wind); C.wind.connect(cityBus);
        const cn = loop(brown, 2.2); for (const [f, q] of [[480, 3], [1100, 4], [2300, 5]]) { const b = filt("bandpass", f, q); cn.connect(b); b.connect(C.cafe); }
        // beta 2.9 (Daniel): rain where it rains (Night Mode, Sin City), under the city
        C.rain = gain(0); { const rn = loop(white, 0.85), rh = filt("highpass", 900, 0.5), rl = filt("lowpass", 7000, 0.5); rn.connect(rh); rh.connect(rl); rl.connect(C.rain); C.rain.connect(cityBus); }
        const cam = gain(1), cl = ctx.createOscillator(), clg = gain(0.5); cl.frequency.value = 3.1; cl.connect(clg); clg.connect(cam.gain); cl.start(); C.cafe.connect(cam); cam.connect(cityBus);
        document.addEventListener("visibilitychange", () => { if (!ctx) return; if (document.hidden) ctx.suspend(); else if (on) ctx.resume(); });
        return true;
      }
      const T = () => ctx.currentTime;
      const ramp = (p, v, k = 0.08) => p.setTargetAtTime(v, T(), k);
      function start() {
        if (!on || started) return; if (!ctx && !build()) return;
        started = true; ctx.resume?.(); ramp(master.gain, 0.42, 0.9);
      }
      const first = () => { start(); if (started) for (const ev of ["pointerdown", "keydown", "touchend"]) window.removeEventListener(ev, first, true); };
      for (const ev of ["pointerdown", "keydown", "touchend"]) window.addEventListener(ev, first, true);
      const sync = () => { for (const b of btns) { b.classList.toggle("off", !on); b.setAttribute("aria-pressed", String(on)); b.title = on ? "Sound off" : "Sound on"; b.setAttribute("aria-label", b.title); } };
      function toggle() {
        on = !on; try { localStorage.setItem("cz-sound", on ? "on" : "off"); } catch {}
        if (on) { if (!started) start(); else { ctx.resume(); ramp(master.gain, 0.42, 0.4); } }
        else if (ctx) { ramp(master.gain, 0, 0.12); setTimeout(() => { if (!on) ctx.suspend(); }, 700); }
        sync();
      }
      // the engine's voice for a ride: the pre-rendered loops (6 rpm steps x on/off), or live for the electric and the turbine
      function voiceFor(id) {
        const pr = ENGINES[id] || ENGINES.dacia1300;
        if (E2.v) { const old = E2.v; ramp(old.out.gain, 0, 0.1); setTimeout(() => old.stop(), 400); }
        E2.v = null; E2.id = id;
        const out = gain(0); out.connect(E2.g);
        if (pr.kind === "electric") { // the sub: a motor's whine and its harmonic, a propeller's wash, all through water
          const o1 = ctx.createOscillator(), o2 = ctx.createOscillator(), g1 = gain(0.5), g2 = gain(0.18), lp = filt("lowpass", 700, 0.7), wash = loop(E2.white, 0.6), wbp = filt("bandpass", 260, 0.8), wg = gain(0), am = gain(1), lfo = ctx.createOscillator(), lfoG = gain(0.5);
          o1.type = "sine"; o2.type = "triangle"; o1.connect(g1); o2.connect(g2); g1.connect(lp); g2.connect(lp); wash.connect(wbp); wbp.connect(wg); wg.connect(am); lfo.connect(lfoG); lfoG.connect(am.gain); am.connect(lp); lp.connect(out); o1.start(); o2.start(); lfo.start();
          E2.v = { pr, out, live: (rpmK, load) => { ramp(o1.frequency, 180 + rpmK * 520, 0.08); ramp(o2.frequency, (180 + rpmK * 520) * 2.01, 0.08); ramp(wg.gain, 0.5 + rpmK * 1.5, 0.1); ramp(lfo.frequency, 3 + rpmK * 14, 0.1); ramp(g1.gain, 0.12 + 0.25 * load, 0.1); }, stop: () => { for (const n of [o1, o2, wash, lfo]) try { n.stop(); } catch {} out.disconnect(); } };
          return;
        }
        if (pr.kind === "turbo") { // the plane: a turbine's rush and whine, a propeller's buzz
          const rush = loop(E2.white, 1), bp = filt("bandpass", 900, 0.6), rg = gain(0), wh = ctx.createOscillator(), whg = gain(0), lpw = filt("lowpass", 5000, 0.7), prop = ctx.createOscillator(), pg = gain(0), plp = filt("lowpass", 420, 0.9);
          wh.type = "sine"; prop.type = "sawtooth"; rush.connect(bp); bp.connect(rg); rg.connect(out); wh.connect(whg); whg.connect(lpw); lpw.connect(out); prop.connect(plp); plp.connect(pg); pg.connect(out); wh.start(); prop.start();
          E2.v = { pr, out, live: (rpmK, load) => { ramp(bp.frequency, 600 + rpmK * 2200, 0.15); ramp(rg.gain, 0.25 + rpmK * 0.5, 0.15); ramp(wh.frequency, 2400 + rpmK * 2600, 0.2); ramp(whg.gain, 0.012 + 0.02 * rpmK, 0.2); ramp(prop.frequency, 55 + rpmK * 60, 0.15); ramp(pg.gain, 0.08 + 0.1 * load, 0.15); }, stop: () => { for (const n of [rush, wh, prop]) try { n.stop(); } catch {} out.disconnect(); } };
          return;
        }
        const make = (d) => {
          const srcs = [];
          for (const set of [d.on, d.off]) set.forEach((arr) => { const b = ctx.createBuffer(1, arr.length, d.sr); b.copyToChannel(arr, 0); const s2 = ctx.createBufferSource(); s2.buffer = b; s2.loop = true; const g = gain(0); s2.connect(g); g.connect(out); s2.start(ctx.currentTime + Math.random() * 0.05); srcs.push({ s: s2, g }); });
          E2.v = { pr, out, d, srcs, stop: () => { for (const q of srcs) try { q.s.stop(); } catch {} out.disconnect(); } };
        };
        const c = ENG_CACHE.get(id);
        if (c) make(c);
        else engineLoops(id).then((d) => { if (d && E2.id === id && !E2.v) make(d); });
      }
      // per frame: the engine's rpm (a gearbox), its load, the voice's mix
      function engineTick(thr, sp, red) {
        const id = H.vehicle(); if (id !== E2.id) voiceFor(id);
        const v = E2.v; if (!v) return;
        const pr = v.pr, gears = pr.gears || [0];
        let g = 1; for (let i = 1; i < gears.length; i++) if (sp >= gears[i] * (VMAX_F / 460)) g = i + 1;
        if (g > E2.gear) E2.shift = 0.16; E2.gear = g;
        E2.shift = Math.max(0, E2.shift - 1 / 30);
        let rpm;
        if (pr.kind !== "ice") rpm = pr.idle || 0;
        else if (sp < 6) rpm = pr.idle * (1 + thr * 1.6); // stopped: a blip when you press
        else { const lo = gears[g - 1] * (VMAX_F / 460), hi = (gears[g] || (gears[g - 1] + 160)) * (VMAX_F / 460), k = clamp((sp - lo) / Math.max(1, hi - lo), 0, 1); rpm = pr.idle * 1.3 + (pr.max - pr.idle * 1.3) * (0.28 + 0.66 * k); }
        E2.rpm += (rpm - E2.rpm) * (E2.shift > 0 ? 0.5 : 0.22);
        const load = E2.shift > 0 ? 0 : thr > 0.05 ? 1 : 0;
        E2.load += (load - E2.load) * 0.3;
        // quieter than before (Daniel): Street about -10 dB, more in Bird's eye; a little fuller on the throttle
        ramp(E2.g.gain, pr.level * (0.2 + 0.11 * E2.load + 0.06 * Math.min(1, sp / VMAX_F)), 0.08);
        if (v.live) { const rk = Math.min(1, sp / VMAX_F); v.live(rk, E2.load); ramp(v.out.gain, 1, 0.1); return; }
        if (!v.srcs) return;
        ramp(v.out.gain, 1, 0.2);
        const st = v.d.steps, r = clamp(E2.rpm, st[0], st[st.length - 1]);
        let i = 0; while (i < st.length - 2 && r > st[i + 1]) i++;
        const w = Math.log(r / st[i]) / Math.log(st[i + 1] / st[i]), n = st.length;
        for (let k = 0; k < n; k++) {
          const wk = k === i ? Math.cos(w * Math.PI / 2) : k === i + 1 ? Math.sin(w * Math.PI / 2) : 0;
          const on = v.srcs[k], off = v.srcs[n + k], rate = r / st[k];
          if (wk > 0) { on.s.playbackRate.setTargetAtTime(rate, T(), 0.03); off.s.playbackRate.setTargetAtTime(rate, T(), 0.03); }
          ramp(on.g.gain, wk * Math.sqrt(E2.load), 0.05); ramp(off.g.gain, wk * Math.sqrt(1 - E2.load) * 0.8, 0.05);
        }
      }
      // one-shots
      function thud(s) {
        if (!started || !on) return; const t = T(), o = ctx.createOscillator(), g = gain(0); o.type = "sine";
        o.frequency.setValueAtTime(95, t); o.frequency.exponentialRampToValueAtTime(42, t + 0.16);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.5 * s + 0.12, t + 0.008); g.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
        o.connect(g); g.connect(carBus); o.start(t); o.stop(t + 0.3);
      }
      function whoosh(lvl) {
        if (!started || !on) return; const t = T(), n = ctx.createBufferSource(); n.buffer = ctx._wb || (ctx._wb = noiseBuf(1.4, false));
        const b = filt("bandpass", 400, 1.4), g = gain(0); b.frequency.setValueAtTime(380, t); b.frequency.exponentialRampToValueAtTime(lvl > 1 ? 3600 : 2600, t + 0.55);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(lvl > 1 ? 0.32 : 0.24, t + 0.06); g.gain.exponentialRampToValueAtTime(0.001, t + (lvl > 1 ? 1.2 : 0.8));
        n.connect(b); b.connect(g); g.connect(carBus); n.start(t); n.stop(t + 1.3);
      }
      function chirp() {
        const t = T(), o = ctx.createOscillator(), g = gain(0), f = 2600 + Math.random() * 2200, n = 2 + Math.floor(Math.random() * 3);
        o.type = "sine"; g.connect(cityBus); o.connect(g);
        for (let i = 0; i < n; i++) { const t0 = t + i * (0.11 + Math.random() * 0.06); o.frequency.setValueAtTime(f * (1 + Math.random() * 0.15), t0); o.frequency.exponentialRampToValueAtTime(f * 1.35, t0 + 0.07); g.gain.setValueAtTime(0, t0); g.gain.linearRampToValueAtTime(0.045, t0 + 0.012); g.gain.exponentialRampToValueAtTime(0.0008, t0 + 0.09); }
        o.start(t); o.stop(t + n * 0.2 + 0.2);
      }
      // thunder: a short while after each flash, a low rumble rolling away
      function thunder() {
        const t = T() + 0.5 + Math.random() * 1.3, n = ctx.createBufferSource(); n.buffer = ctx._tb || (ctx._tb = noiseBuf(4, true));
        const lp = filt("lowpass", 260, 0.7), g = gain(0); lp.frequency.setValueAtTime(420, t); lp.frequency.exponentialRampToValueAtTime(110, t + 2.6);
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.5, t + 0.08); g.gain.setTargetAtTime(0.22, t + 0.25, 0.3); g.gain.exponentialRampToValueAtTime(0.001, t + 3.4);
        n.connect(lp); lp.connect(g); g.connect(cityBus); n.start(t); n.stop(t + 3.6);
      }
      // beta 3.0: the boarding gate's soft chime (two notes, a bell)
      window.__czChime = () => { if (!started || !on || !ctx) return; const t = T(); [880, 1318.5].forEach((f, i) => { const o = ctx.createOscillator(), g = gain(0); o.type = "sine"; o.frequency.value = f; o.connect(g); g.connect(master); g.gain.setValueAtTime(0, t + i * 0.16); g.gain.linearRampToValueAtTime(0.12, t + i * 0.16 + 0.01); g.gain.exponentialRampToValueAtTime(0.0005, t + i * 0.16 + 1.1); o.start(t + i * 0.16); o.stop(t + i * 0.16 + 1.2); }); };
      let boltWas = false;
      function horn() {
        const t = T(), g = gain(0), lp = filt("lowpass", 900, 0.7), f = 300 + Math.random() * 120; lp.connect(g); g.connect(cityBus);
        for (const k of [1, 1.26]) { const o = ctx.createOscillator(); o.type = "sawtooth"; o.frequency.value = f * k; o.connect(lp); o.start(t); o.stop(t + 0.9); }
        g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(0.035, t + 0.04); g.gain.setValueAtTime(0.035, t + (Math.random() < 0.5 ? 0.18 : 0.5)); g.gain.exponentialRampToValueAtTime(0.0005, t + 0.8);
      }
      let fN = 0, prevBoost = null, gearT = 0; let soloEng = false;
      // per frame (every other): the targets
      function update(dt) {
        if (!started || !ctx) return;
        if (++fN % 2) return;
        const hold = !on || H.overlay() || document.body.classList.contains("map-boarding") || document.hidden;
        out += ((hold ? 0 : 1) - out) * 0.2;
        ramp(master.gain, 0.42 * out, 0.15);
        if (out < 0.02 && hold) return;
        const red = reduced(), k = D.camK || 0;
        // the mix by view
        ramp(carBus.gain, 0.3 + 0.7 * k, 0.25); ramp(cityBus.gain, soloEng ? 0 : 0.7 - 0.3 * k, 0.25); // Bird's eye: the car further back
        // the engine (beta 2.9: the combustion model)
        const sp = Math.abs(P.u), x = Math.min(1, sp / VMAX_F);
        const thr = D.auto ? 0.7 : Math.max(0, (D.keys.u ? 1 : 0) + (D.stick ? Math.max(0, D.stick.y) : 0));
        engineTick(Math.min(1, thr), sp, red);
        // the tyres
        const slip = D.drift ? 1 : Math.min(1, Math.max(0, (Math.abs(P.w) - 25) / 90)) * (sp > 40 ? 1 : 0);
        ramp(E2.sq.g.gain, slip * 0.1, 0.05); ramp(E2.sq.o.frequency, 1650 + Math.sin(performance.now() / 90) * 60 + sp * 0.4, 0.05);
        if (D.boost && D.boost !== prevBoost) whoosh(D.boost.lvl); prevBoost = D.boost;
        // the siren: the cooldown's (two tones; a little higher coming up behind, lower as it drops back)
        if (COP.on) { const t2 = COP.on.t, base = (Math.floor(performance.now() / 480) % 2 ? 960 : 720) * (t2 < 1.2 ? 1.04 : t2 > 5 ? 0.95 : 1); ramp(E2.si.o.frequency, base, 0.02); ramp(E2.si.g.gain, t2 > 5 ? Math.max(0, 0.05 * (6.4 - t2) / 1.4) : 0.05, 0.1); } else ramp(E2.si.g.gain, 0, 0.2);
        // the city: hum, wind, birds, the odd horn; the café near Two Minutes; quieter at the city's edges
        const tmP = PL.find((q) => q.pl.id === "tm"), dTm = tmP ? Math.hypot(H.carPos.x - tmP.x, H.carPos.z - tmP.z) : 9999;
        const edge = clamp(1.25 - Math.hypot(H.carPos.x - 1500, (H.carPos.z - 5000) * 0.5) / 2400, 0.35, 1);
        ramp(C.hum.gain, 0.32 * edge, 0.6); ramp(C.wind.gain, (0.04 + 0.04 * Math.sin(performance.now() / 7300)) * (1.2 - 0.6 * edge), 0.8);
        ramp(C.windBp.frequency, 500 + 300 * Math.sin(performance.now() / 5100), 0.8);
        ramp(C.cafe.gain, clamp(1 - dTm / 420, 0, 1) * 0.16, 0.6);
        { const w2 = window.__wxNow || {}; ramp(C.rain.gain, w2.rain ? 0.11 : 0, 0.8); if (w2.bolt && !boltWas) thunder(); boltWas = !!w2.bolt; }
        const t = T();
        if (t > C.birdT) { C.birdT = t + 2.5 + Math.random() * 6; if (!red || true) chirp(); }
        if (t > C.hornT) { C.hornT = t + 14 + Math.random() * 26; if (C.hornT > 20) horn(); }
      }
      return {
        start, toggle, update, thud, bind(b) { btns.add(b); b.addEventListener("click", (e) => { e.stopPropagation(); toggle(); }); sync(); },
        get on() { return on; }, get running() { return started && on && !!ctx && ctx.state === "running"; }, ctx: () => ctx,
        info: () => E2 && { id: E2.id, voice: !!E2.v, srcs: E2.v?.srcs?.length || 0, rpm: Math.round(E2.rpm), load: +E2.load.toFixed(2), gear: E2.gear, gain: +E2.g.gain.value.toFixed(3) },
        solo(on2) { soloEng = !!on2; }, // tests: the engine alone
        stream() { if (!ctx) return null; if (!ctx._dest) { ctx._dest = ctx.createMediaStreamDestination(); ctx._comp.connect(ctx._dest); } return ctx._dest.stream; } // tests: what it sounds like
      };
    })();

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
      const base = g.userData.n2base || (g.userData.n2base = g.scale.clone());
      if (red) { g.scale.copy(base); return; }
      // beta 2.5 (Mario Kart): a hop into a drift, squash and stretch (bumps, landings, a boost, pulling away), a bigger
      // lean into the turns (and into a drift), the wheels bouncing a little over the road at speed
      if (FX.hop) { FX.hop = 0; BODY.hyv = 52; BODY.hy = BODY.hy || 0.01; }
      if (BODY.hy > 0) { BODY.hyv -= 980 * dt; BODY.hy += BODY.hyv * dt; if (BODY.hy <= 0) { BODY.hy = 0; FX.squash = Math.max(FX.squash, 0.4); BODY.hyv = 0; } }
      g.position.y += BODY.hy || 0;
      if (FX.squash) { BODY.sv = (BODY.sv || 0) + FX.squash * 1.7; FX.squash = 0; }
      if (FX.boostKick) { BODY.sv = (BODY.sv || 0) - 1.3; FX.boostKick = 0; }
      BODY.s = BODY.s || 0; BODY.sv = BODY.sv || 0;
      spr("s", "sv", clamp(BODY.acc * 2.4e-5, -0.035, 0.035) * -1, 13, 0.3);
      const sq = clamp(BODY.s, -0.12, 0.16);
      g.scale.set(base.x * (1 + sq * 0.5), base.y * (1 - sq), base.z * (1 + sq * 0.5));
      BODY.lean = (BODY.lean || 0) + (clamp(-P.u * P.yr * 0.00011, -0.075, 0.075) + (D.drift ? -D.drift.dir * 0.055 : 0) - (BODY.lean || 0)) * (1 - Math.exp(-dt * 8));
      g.rotation.z += BODY.lean;
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
      if (sp > 0.2) g.position.y += Math.abs(Math.sin(t * 10.5)) * 0.32 * sp * sp; // over the road's little bumps
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
      if (H.jetCine?.() || H.camBusy() && document.querySelector(".jet-xfade")) D.streetT = 0; // beta 3.01: the take-off's film cuts straight in
      const k = sss(D.streetT);
      D.camK = k;
      const mv = H.mapView, hd = H.heading();
      if (D.camH == null) D.camH = hd;
      // polish (comfort): the street camera turns after the car smoothly and never faster than ~1.7 rad/s (a spin or a turn on the spot no longer whips it round)
      D.camH += clamp(wrapA(hd - D.camH) * (1 - Math.exp(-dt * 4.2)), -1.7 * dt, 1.7 * dt);
      // satellite: heading up while you drive (the arrows then point the way they turn), gently
      if (!FREE && D.ready && mv.follow && (D.v > 25 || D.auto || D.uturn || D.kturn) && !reduced()) {
        mv.yawGoal = null;
        mv.yaw += wrapA(hd + Math.PI - mv.yaw) * (1 - Math.exp(-dt * (D.uturn ? 1.8 : 1.3)));
      }
      // round 4 (GTA 2): following the car the satellite looks more straight down, pulls back as the speed rises (and in
      // again when slow), and looks a little ahead of where the car is going; the map's own zoom stays the base
      if (FREE && D.ready && P.init) {
        const spd = Math.min(1.45, Math.abs(P.u) / VMAX_F); // beta 2.5: the auto-pilot goes faster: the map pulls back further with it
        if (mv.follow && !reduced()) {
          const m = D.zm || 1, nm = m + (1 + 0.6 * spd - m) * (1 - Math.exp(-dt * 1.1));
          mv.dist *= nm / m; D.zm = nm;
          if (Math.abs(P.u) > 25 && mv.pitch < 1.2 && mv.pitchGoal == null) mv.pitchGoal = 1.24;
        }
        const lax = mv.follow && !reduced() ? clamp(P.vx * 0.45, -220, 220) : 0, laz = mv.follow && !reduced() ? clamp(P.vz * 0.45, -220, 220) : 0;
        D.lax = (D.lax || 0) + (lax - (D.lax || 0)) * (1 - Math.exp(-dt * 1.6)); D.laz = (D.laz || 0) + (laz - (D.laz || 0)) * (1 - Math.exp(-dt * 1.6));
        camPos.x += D.lax; camPos.z += D.laz; camTarget.x += D.lax; camTarget.z += D.laz;
      }
      FX.bump *= Math.exp(-dt * 7);
      const shake = (amt) => { if (amt > 0.05 && !reduced()) { camPos.x += (Math.random() - 0.5) * amt; camPos.y += (Math.random() - 0.5) * amt; camPos.z += (Math.random() - 0.5) * amt; } };
      if (k < 1e-4) { shake(FX.bump * H.mapView.dist * 0.006); return; }
      // beta 2.9 (Daniel): small rides are framed like the car (the scooter's length reads long: its stem), the plane from
      // further back and higher, at its own altitude
      const vid = H.vehicle(), vk = vid === "scooter" ? 0.82 : vid === "plane" ? 1.12 : vid === "sub" ? 1.1 : 1, alt = H.vehAlt?.() || 0;
      const cp = { x: H.carPos.x, y: (H.carPos.y || 0) + alt, z: H.carPos.z }, len = H.carLen() * vk * (VP.w < VP.h ? 1.7 : 1.18), f = [Math.sin(D.camH), Math.cos(D.camH)]; // polish: a little further back on a laptop (the car filled the frame)
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
      const yaw1 = Math.atan2(ex, ez), pitch1 = Math.asin(ey / d1), fov1 = 74 + 12 * kick + (D.boost && !reduced() ? 10 * (1 - D.boost.t / D.boost.dur) : 0);
      // polish: no radial speed blur in the street view (10 more taps a pixel, ~15 fps on a laptop, and a nausea risk); the lens still widens
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
      shake(FX.bump * 3.2 * k);
      // beta 2.5: the street camera leans into the turns (and a drift), a little
      { const want = reduced() ? 0 : clamp(P.u * P.yr * 0.00016, -0.07, 0.07) + (D.drift ? D.drift.dir * 0.03 : 0); D.roll = (D.roll || 0) + (want - (D.roll || 0)) * (1 - Math.exp(-dt * 5));
        if (Math.abs(D.roll) > 1e-4) { const fx2 = camTarget.x - camPos.x, fz2 = camTarget.z - camPos.z, l = Math.hypot(fx2, fz2) || 1, r = D.roll * k; H.camera.up.set((-fz2 / l) * Math.sin(r), Math.cos(r), (fx2 / l) * Math.sin(r)); } }
      const cam = H.camera, near = Math.max(2.5, d * 0.32 * (1 - k) + 3 * k), far = Math.max(14000, d * 3 + 6000) * (1 - k) + 2400 * k; // polish: the street view draws what its haze lets you see (was the whole city)
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
      toast(street ? "Street view · the camera rides behind you" : phoneUI() ? "Bird's eye · pinch to zoom" : "Bird's eye · zoom with + − or the wheel");
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
        <button data-v="sat" aria-pressed="true" title="Bird's eye view (V)"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="9" y="9" width="6" height="6" rx="1" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9 12H3.5M20.5 12H15M12 9V3.5M12 20.5V15" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="m4 4 3 3M20 20l-3-3" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><b>Bird's eye</b></button>
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
      <div class="n2-toast" role="status"></div>
      <div class="n2-taphint mono" aria-hidden="true">TAP THE ROAD TO DRIVE THERE</div>
      <button class="n2-snd" aria-pressed="true" title="Sound off" aria-label="Sound off"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 9.5h3.2L12 5.5v13l-4.8-4H4z" fill="currentColor"/><path class="w1" d="M15.2 9.2a4 4 0 0 1 0 5.6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path class="w2" d="M17.8 6.8a7.4 7.4 0 0 1 0 10.4" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path class="x" d="M15.5 9.5l5 5m0-5-5 5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg></button>
      <div class="n2-cop" role="status" aria-live="polite"><svg viewBox="0 0 36 36" aria-hidden="true"><circle cx="18" cy="18" r="15" class="n2-cop-bg"/><circle cx="18" cy="18" r="15" class="n2-cop-ring"/></svg><b>POLICE · SLOW DOWN</b><em class="mono">5</em></div>
      <div class="n2-stick" aria-hidden="true"><span class="n2-ring"></span><span class="n2-knob"></span></div>
      <button class="n2-driftb mono" aria-label="Drift (hold)">DRIFT</button>
      <div class="n2-arms" aria-hidden="true"><span class="n2-arm" data-k="l"></span><span class="n2-arm" data-k="s"></span><span class="n2-arm" data-k="r"></span><span class="n2-arm n2-next off"></span></div>`;
    document.body.appendChild(root);
    const panel = root.querySelector(".n2-panel"), views = root.querySelector(".n2-views"), pad = root.querySelector(".n2-pad"), hintEl = root.querySelector(".n2-hint"), toastEl = root.querySelector(".n2-toast");
    const copEl = root.querySelector(".n2-cop");
    // beta 2.9 (Daniel's phone): the phone layout's class, and the top bar's real bottom (the brand, the bar, the XP pill),
    // measured, so the toggle, the hint and the speaker sit under it with 8 px clear, on any phone, either way round
    function phoneLayout() {
      const ph = phoneUI(); document.body.classList.toggle("n2-phone", ph);
      if (!ph) return;
      let b = 0; for (const sel of [".map-top", ".you", ".brand"]) for (const e of document.querySelectorAll(sel)) { const r = e.getBoundingClientRect(); if (r.width > 0 && r.height > 0 && r.top < VP.h * 0.4) b = Math.max(b, r.bottom); }
      const v = Math.round((b || 104) + 8) + "px", de = document.documentElement; if (de.style.getPropertyValue("--n2top") !== v) de.style.setProperty("--n2top", v);
    }
    phoneLayout(); setInterval(phoneLayout, 700); addEventListener("resize", () => setTimeout(phoneLayout, 60));
    SND.bind(root.querySelector(".n2-snd"));
    root.querySelector(".n2-snd").addEventListener("pointerdown", (e) => e.stopPropagation());
    const keyEls = {}; pad.querySelectorAll(".n2-k").forEach((b) => { keyEls[b.dataset.k] = b; });
    views.addEventListener("click", (e) => { const b = e.target.closest("button"); if (b) setView(b.dataset.v === "street"); });
    let toastT = 0;
    function toast(t) { toastEl.textContent = t; toastEl.classList.add("on"); clearTimeout(toastT); toastT = setTimeout(() => toastEl.classList.remove("on"), 2600); }
    function nope(k) { const b = keyEls[k]; if (!b) return; b.classList.remove("nope"); void b.offsetWidth; b.classList.add("nope"); }
    function flashKey(k) { const b = keyEls[k === "s" ? "u" : k]; if (!b) return; b.classList.remove("took"); void b.offsetWidth; b.classList.add("took"); }
    // round 3 (Daniel: "no well-timed presses"): a short tap of ↑ cruises (the car keeps going, round the bends, straight
    // over the junctions that go straight on, along a way you picked, until ↓, a dead end, a choice still to make or a place);
    // ↑ held drives and letting go coasts to a stop, as before
    const keyDown = (k) => { if (D.keys[k]) return; D.keys[k] = true; D.keyT[k] = performance.now(); keyEls[k]?.classList.add("on"); if (k === "d") D.cruise = false; press(k); };
    const keyUp = (k) => {
      if (!D.keys[k]) return;
      D.keys[k] = false; keyEls[k]?.classList.remove("on"); if (k === "d") D.backHold = false;
      if (k === "u") { D.cruise = performance.now() - (D.keyT.u || 0) < 280 && !D.auto; } // a tap cruises; a hold let go stops
    };
    pad.querySelectorAll(".n2-k").forEach((b) => {
      const k = b.dataset.k;
      b.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); b.setPointerCapture?.(e.pointerId); keyDown(k); });
      const up = () => keyUp(k);
      b.addEventListener("pointerup", up); b.addEventListener("pointercancel", up); b.addEventListener("lostpointercapture", up);
      b.addEventListener("contextmenu", (e) => e.preventDefault());
    });
    for (const n of [pad, views, panel]) n.addEventListener("pointerdown", (e) => e.stopPropagation());
    const KEYS = { ArrowUp: "u", ArrowDown: "d", ArrowLeft: "l", ArrowRight: "r", w: "u", W: "u", s: "d", S: "d", a: "l", A: "l", d: "r", D: "r", " ": "h", Spacebar: "h" };
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
      // beta 2.7 (Daniel): on a phone the Street view is driven with a floating stick: it appears under the thumb anywhere in
      // the lower half; push up to go (as far as you push), down to brake and back, sideways to steer, diagonals combine;
      // let go and it coasts with the road assist. A small DRIFT button (held) is Space
      const stickEl = root.querySelector(".n2-stick"), knobEl = root.querySelector(".n2-knob"), driftB = root.querySelector(".n2-driftb");
      const R = 58; let st = null;
      const stickHome = () => { stickEl.style.transform = `translate(${70}px, ${VP.h - 150}px)`; knobEl.style.transform = "translate(-50%, -50%)"; };
      stickHome();
      addEventListener("resize", () => { if (!st) stickHome(); });
      const stickSet = (e) => {
        let dx = e.clientX - st.x, dy = e.clientY - st.y; const l = Math.hypot(dx, dy); if (l > R) { dx *= R / l; dy *= R / l; }
        knobEl.style.transform = `translate(calc(-50% + ${dx.toFixed(1)}px), calc(-50% + ${dy.toFixed(1)}px))`;
        const dz = (v) => (Math.abs(v) < 0.14 ? 0 : Math.sign(v) * (Math.abs(v) - 0.14) / 0.86);
        D.stick = { x: dz(dx / R), y: dz(-dy / R) };
      };
      const phoneStreet = () => phoneUI() && D.streetT >= 0.5;
      cv.addEventListener("pointerdown", (e) => {
        if (!api.on || D.streetT < 0.5) return;
        if (phoneStreet()) {
          if (e.clientY < VP.h * 0.45) return; // the upper half stays the map's (taps, the toggle); beta 2.9: a card (compact, right) leaves it free
          e.stopImmediatePropagation(); e.preventDefault?.();
          st = { id: e.pointerId, x: e.clientX, y: e.clientY };
          stickEl.classList.add("on"); stickEl.style.transform = `translate(${e.clientX}px, ${e.clientY}px)`; stickSet(e);
          if (D.auto) { D.auto = null; render(true); }
          return;
        }
        e.stopImmediatePropagation();
        sw = { id: e.pointerId, x: e.clientX, y: e.clientY, k: null };
      }, true);
      cv.addEventListener("pointermove", (e) => {
        if (st && e.pointerId === st.id) { e.stopImmediatePropagation(); stickSet(e); return; }
        if (!sw || e.pointerId !== sw.id) return;
        e.stopImmediatePropagation();
        if (sw.k) return;
        const dx = e.clientX - sw.x, dy = e.clientY - sw.y;
        if (Math.hypot(dx, dy) < 28) return;
        sw.k = Math.abs(dx) > Math.abs(dy) ? (dx > 0 ? "r" : "l") : dy < 0 ? "u" : "d";
        keyDown(sw.k);
        if (sw.k === "l" || sw.k === "r") keyUp(sw.k);
      }, true);
      const stickEnd = (e) => { if (!st || e.pointerId !== st.id) return false; st = null; D.stick = null; stickEl.classList.remove("on"); stickHome(); return true; };
      const end = (e) => { if (stickEnd(e)) { e.stopImmediatePropagation(); return; } if (!sw || e.pointerId !== sw.id) return; e.stopImmediatePropagation(); if (sw.k === "u" || sw.k === "d") keyUp(sw.k); sw = null; };
      cv.addEventListener("pointerup", end, true); cv.addEventListener("pointercancel", end, true);
      driftB.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); driftB.setPointerCapture?.(e.pointerId); D.keys.h = true; driftB.classList.add("on"); });
      for (const ev of ["pointerup", "pointercancel", "lostpointercapture"]) driftB.addEventListener(ev, () => { D.keys.h = false; driftB.classList.remove("on"); });
      window.addEventListener("wheel", (e) => { if (api.on && D.streetT > 0.5 && !e.target.closest?.(".map-card, .case-frame, .nav2-ui, .map-rides, .crew-panel")) { e.preventDefault(); e.stopImmediatePropagation(); } }, { passive: false, capture: true });
    }
    // beta 3.20 (r197, Daniel: the next exit should be obvious without reading the hint): driving round the ring yourself,
    // the next exit ahead is painted on the road, an arrow in the lane just before it turning out, and named in a pill
    // over it with the key (or the stick's way) that takes it, → (← if out were left); white with a yellow pill once it is
    // the exit you will take (a tap out, or the straight on picked as you came in). Both views; never on auto-pilot
    let nxSig = "";
    // a simple polygon pushed out by d on every side (mitred corners, capped), for the marker's ink outline
    function grow(pts, d) {
      const n = pts.length; let A = 0;
      for (let i = 0; i < n; i++) { const p = pts[i], q = pts[(i + 1) % n]; A += p[0] * q[1] - q[0] * p[1]; }
      const sg = A > 0 ? 1 : -1, nrm = (p, q) => { const dx = q[0] - p[0], dz = q[1] - p[1], l = Math.hypot(dx, dz) || 1; return [(dz / l) * sg, (-dx / l) * sg]; };
      return pts.map((p, i) => {
        const a = nrm(pts[(i + n - 1) % n], p), b = nrm(p, pts[(i + 1) % n]), mx = a[0] + b[0], mz = a[1] + b[1], ml = Math.hypot(mx, mz) || 1;
        const k = Math.min(d / Math.max(0.35, (mx / ml) * a[0] + (mz / ml) * a[1]), d * 2.5);
        return [p[0] + (mx / ml) * k, p[1] + (mz / ml) * k];
      });
    }
    function nextExit(dt) {
      const el = nextEl;
      const fx = Math.sin(P.h), fz = Math.cos(P.h);
      let rn = !D.auto && !D.uturn && !D.kturn && P.u > 3 && H.vehicle() !== "plane" ? ringNext() : null;
      // going round with the flow (the ring is one way: its angle about the fountain falls), not in or out along a spoke
      if (rn && (rn.sgn !== -1 || Math.abs((fx * -rn.rz + fz * rn.rx) / rn.rr) < 0.55)) rn = null;
      const b = rn && rn.best;
      D.onRing = !!b; // the arms' pills step aside meanwhile
      if (!b) { if (nxSig) { nxSig = ""; H.exitMark?.(null); el.classList.add("off"); } return; }
      const F = H.fork, R = 70, a0 = b.ang; // the arrow: in the lane, its head turning out where the exit leaves the ring
      const bx = F.x + Math.cos(a0) * R, bz = F.y + Math.sin(a0) * R;
      const ux = Math.cos(a0), uz = Math.sin(a0), tx = -Math.sin(a0) * rn.sgn, tz = Math.cos(a0) * rn.sgn; // out, and the way round
      const picked = !!D.ringExit && D.ringExit.e === b.e && D.ringExit.dir === b.dir;
      const key = `${b.e}:${b.dir}:${rn.sgn}`;
      // its outline: a stem along the lane, then a bar and a head turning out (X out, Y along), some 41 by 24 units
      const SH = [[-2.5, -16], [2.5, -16], [2.5, -1], [8, -1], [8, -6], [17, 1.5], [8, 9], [8, 4], [-2.5, 4]];
      const pts = SH.map(([X, Y]) => [bx + ux * (X - 7) * 1.25 + tx * (Y - 4) * 1.25, bz + uz * (X - 7) * 1.25 + tz * (Y - 4) * 1.25]);
      H.exitMark?.({ key, pts, out: grow(pts, 2.2), picked });
      const ep = dpts(b), ec = dcum(b), pp = pointAt(ep, ec, Math.min(ec[ec.length - 1], 55)); // the pill: over the street it leads into
      const v = H.project(pp[0], 22, pp[1]);
      if (v.z > 1 || Math.abs(v.x) > 1.1 || Math.abs(v.y) > 1.1) el.classList.add("off");
      else { el.classList.remove("off"); el.style.transform = `translate3d(${((v.x * 0.5 + 0.5) * VP.w).toFixed(1)}px, ${((-v.y * 0.5 + 0.5) * VP.h).toFixed(1)}px, 0) translate(-50%, -100%)`; }
      const sig = key + (picked ? "p" : "");
      if (sig === nxSig) return;
      nxSig = sig;
      el.classList.toggle("picked", picked);
      el.innerHTML = `<i class="n2-sg">${rn.outSign > 0 ? "←" : "→"}</i><span>${esc(armName(b))}</span>`;
    }
    // round 3 (Daniel: "show which arm each key means"): at a junction or a roundabout coming up, a pill on each way you can
    // take, its key and where it leads; once a way is picked only that one stays, until you are through
    const armEls = {};
    document.querySelectorAll(".n2-arm[data-k]").forEach((e) => { armEls[e.dataset.k] = e; });
    const nextEl = document.querySelector(".n2-next"); // beta 3.20 (r197): the next exit's pill
    const armNames = new Map();
    function armName(o) {
      const k = o.e * 2 + (o.dir > 0 ? 1 : 0);
      if (armNames.has(k)) return armNames.get(k);
      // beta 3.20 (r197): a roundabout's short links (r182: three per arm) take the name of the arm they lead to, so
      // every way into one arm reads the same (they were named by their own slant: "the road north" and "west" for one arm)
      if (E[o.e].len < 140 && ringNodes.has(startNode(o)) && !ringNodes.has(endNode(o))) {
        let far = null, fd = 0;
        for (const q of N[endNode(o)].out) {
          const e2 = E[q.e]; if (!e2.drive || e2.kind === "ring") continue;
          const p2 = dpts(q), f = p2[p2.length - 1], d = Math.hypot(f[0] - H.fork.x, f[1] - H.fork.y);
          if (d > fd) { fd = d; far = q; }
        }
        if (far && fd > 200) { const nm = armName(far); armNames.set(k, nm); return nm; }
      }
      const e = E[o.e], pts = o.dir > 0 ? e.pts : e.rpts, cum = o.dir > 0 ? e.cum : e.rcum;
      let name = null;
      for (const d of [320, 200, 120]) { const p = pointAt(pts, cum, Math.min(e.len, d)), q = quarterAt(p[0], p[1]); if (q) { name = QNAME[q]; break; } }
      if (!name) { const ws = []; explore(o, 700, 0, ws, new Set(), 0); const f = uniq(ws)[0]; name = f ? (f.p.q && QNAME[f.p.q]) || f.p.pl.name : null; }
      if (!name) {
        const h = outH(o), cmp = ["south", "east", "north", "west"][((Math.round(h / (Math.PI / 2)) % 4) + 4) % 4]; // plan: +z is south
        name = e.kind === "long" ? `The avenue, ${cmp}` : e.kind === "drive" && Math.hypot(pointAt(pts, cum, Math.min(e.len, 200))[0] - H.start[0], pointAt(pts, cum, Math.min(e.len, 200))[1] - H.start[1]) < 900 ? "The start" : `The road ${cmp}`;
      }
      armNames.set(k, name);
      return name;
    }
    let armSig = "";
    function arms(L, dec) {
      const show = { l: null, s: null, r: null };
      const near = dec && dec.type === "junction" && dec.L - L < (FREE ? 320 : 460) && dec.L - L > (FREE ? 15 : -1e9) && !D.auto && !D.uturn && !D.kturn && D.v >= -0.5 && !D.onRing; // beta 3.20 (r197): on the ring the next exit's own marker says it
      if (near) for (const k of ["l", "s", "r"]) if (dec.ex[k]) show[k] = dec.ex[k];
      // a way already picked: the one the path takes at the last node passed or coming (shown until it is behind)
      let picked = null;
      if (!near && !D.auto && !D.onRing && D.seq.length > 1) {
        for (let k = 0; k < D.seq.length - 1 && !picked; k++) {
          const it = D.seq[k];
          if (E[it.e].kind === "ring") continue;
          if (it.L1 - L > 460) break;
          const nx = D.seq[k + 1], ex = exitsAt(it);
          for (const s2 of ["l", "s", "r"]) {
            const o = ex[s2]; if (!o) continue;
            const first = o.via ? o.via[0] : o;
            if (nx.e !== first.e || nx.dir !== first.dir) continue;
            const out = o.via ? D.seq.find((q, j) => j > k && q.e === o.e && q.dir === o.dir) : nx;
            if (L < (out ? out.L0 : it.L1) + 30) { picked = s2; show[s2] = o; }
            break;
          }
        }
      }
      const sig = ["l", "s", "r"].map((k) => (show[k] ? show[k].e + ":" + show[k].dir : "-")).join("|") + (picked || "");
      for (const k of ["l", "s", "r"]) {
        const el = armEls[k], o = show[k];
        if (!o) { if (!el.classList.contains("off")) el.classList.add("off"); continue; }
        const e = E[o.e], pts = o.dir > 0 ? e.pts : e.rpts, cum = o.dir > 0 ? e.cum : e.rcum, p = pointAt(pts, cum, Math.min(e.len * 0.6, o.via ? 70 : 90));
        const v = H.project(p[0], 28, p[1]);
        if (v.z > 1 || Math.abs(v.x) > 1.1 || Math.abs(v.y) > 1.1) { el.classList.add("off"); continue; }
        el.classList.remove("off");
        el.style.transform = `translate3d(${((v.x * 0.5 + 0.5) * VP.w).toFixed(1)}px, ${((-v.y * 0.5 + 0.5) * VP.h).toFixed(1)}px, 0) translate(-50%, -100%)`;
      }
      if (sig === armSig) return;
      armSig = sig;
      for (const k of ["l", "s", "r"]) {
        const o = show[k], el = armEls[k];
        if (!o) continue;
        el.classList.toggle("picked", picked === k);
        el.innerHTML = FREE ? `<i class="n2-sg">${GLY[k]}</i><span>${esc(armName(o))}</span>` : `<b class="n2-cap sm">${GLY[k]}</b><span>${esc(armName(o))}</span>`;
      }
    }
    // the pad: only what does something here lights up; the hint says what is next
    let padSig = "";
    function ui(L, dec) {
      const v = valid(dec, L), near = dec && dec.L - L < WINDOW, stoppedAt = Math.abs(D.v) < 8 && dec && dec.L - L < (dec.gap || 34) + 50;
      let hint = pivots() ? "↑ TO DRIVE · ↓ TURNS ROUND" : "↑ TO DRIVE (TAP TO CRUISE) · ↓ REVERSES";
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
      } else if (D.cruise && D.v > 10) hint = "CRUISING · ↓ TO STOP";
      else if (D.v > 10) hint = "↓ BRAKES";
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
      for (const p of byEdge.get(it.e) || []) { const s = it.dir > 0 ? p.s : e.len - p.s; if (s <= budget) out.push({ p, d: base + s, sd: p.side * (it.dir > 0 ? 1 : -1) }); }
      if (e.len >= budget) return;
      for (const o of N[endNode(it)].out) if (!(o.e === it.e) && !against(o) && E[o.e].drive) explore(o, budget - e.len, base + e.len, out, seen, depth + 1);
    }
    const uniq = (list) => { const s = new Set(); return list.sort((a, b) => a.d - b.d).filter((x) => (s.has(x.p.pl) ? false : (s.add(x.p.pl), true))); };
    const mDist = (d) => (d = Math.abs(d), d < 1000 ? `${Math.max(10, Math.round(d / 10) * 10)} m` : `${(d / 1000).toFixed(1)} km`);
    // beta 2.6 (Daniel: "Nearby: only what is genuinely near"): ahead on your own stretch up to 420, a junction's ways
    // only when it is within 240 (and 320 beyond it)
    const inkLum = (hex) => { const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex).trim()); if (!m) return 0.5; let h = m[1]; if (h.length === 3) h = [...h].map((x) => x + x).join(""); const v = [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16) / 255); return 0.2126 * v[0] + 0.7152 * v[1] + 0.0722 * v[2]; };
    const NEAR_AHEAD = 420, NEAR_JUNCTION = 240, NEAR_BEYOND = 320;
    // r201: the Ahead row: what is up to 160 behind still counts (passed but beside you, behind weighs 1.6x its distance),
    // four cards at most, both kerbs kept in: while each side has places in reach, neither gets more than one card over
    // the other; the cards stay nearest first (ahead before just passed at the same distance)
    const NEAR_BEHIND = 160, NEAR_CAP = 4;
    const nearW = (x) => (x.d < 0 ? -x.d * 1.6 : x.d);
    function balance(list, cap) {
      const by = { 1: [], [-1]: [], 0: [] };
      for (const x of list.slice().sort((a, b) => nearW(a) - nearW(b))) (by[x.sd ?? 0] || by[0]).push(x);
      const out = [];
      while (out.length < cap && (by[1].length || by[-1].length || by[0].length)) {
        const nL = out.filter((x) => x.sd === 1).length, nR = out.filter((x) => x.sd === -1).length;
        let pick = null;
        if (by[1].length && by[-1].length && Math.abs(nL - nR) >= 1) pick = nL < nR ? by[1] : by[-1]; // the side that is behind gets the next card
        else pick = [by[1], by[-1], by[0]].filter((l) => l.length).sort((a, b) => nearW(a[0]) - nearW(b[0]))[0];
        out.push(pick.shift());
      }
      return out.sort((a, b) => nearW(a) - nearW(b));
    }
    function render(force) {
      if (!D.ready) return;
      const L = curL(), ci = ciOf(L), cur = D.seq[ci], q = quarterAt(H.carPos.x, H.carPos.z), dec = nextDecision(L);
      const rows = [];
      // ahead: the places still in front of the car on the edges already chosen
      // r201 (Daniel: "sometimes it shows me only the places on one side of the street"): the row used to take only what
      // was more than 30 ahead, the three nearest: a place dropped out the moment you drew level with it, so as you passed
      // one kerb's places the row was the other kerb's (often one card). Now the stretch around the car counts, a little
      // behind too (what you just passed, while it is still beside you), and each card knows its kerb (x.sd: 1 left, -1 right)
      const ahead = [];
      for (let k = Math.max(0, ci - 1); k < D.seq.length; k++) {
        const it = D.seq[k], e = E[it.e];
        for (const p of byEdge.get(it.e) || []) { const s = it.dir > 0 ? p.s : e.len - p.s, d = it.L0 + s - L; if (d > -NEAR_BEHIND && d < NEAR_AHEAD) ahead.push({ p, d, sd: p.side * (it.dir > 0 ? 1 : -1) }); }
      }
      const here = hereAt(true); // beta 2.7: the panel never names a discovery place
      const jd = dec && dec.type === "junction" ? dec.L - L : Infinity;
      const ex = dec && dec.type === "junction" && jd < NEAR_JUNCTION ? dec.ex : null;
      const ways = { l: [], s: [], r: [] };
      if (ex) for (const k of ["l", "s", "r"]) if (ex[k]) { const o = []; explore(ex[k], NEAR_BEYOND, jd + (ex[k].pre || 0), o, new Set(), 0); ways[k] = uniq(o); }
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
      // one card per place, its nearest sighting (a place behind and met again ahead: whichever weighs less)
      const sAhead = (() => { const m = new Map(); for (const x of [...ahead, ...ways.s]) { const c = m.get(x.p.pl); if (!c || nearW(x) < nearW(c)) m.set(x.p.pl, x); } return [...m.values()].sort((a, b) => nearW(a) - nearW(b)); })();
      for (const k of ["s", "l", "r"]) {
        const list = k === "s" ? sAhead : ways[k];
        if (!list.length) continue;
        const groups = new Map();
        for (const x of list) { if (!groups.has(x.p.q)) groups.set(x.p.q, []); groups.get(x.p.q).push(x); }
        // only the places of the quarter you're in; a way that leads into another quarter shows that quarter, but only
        // right at its junction (beta 2.6: Nearby is the car's immediate zone)
        const lead = q && groups.has(q) ? null : [...groups.keys()][0];
        if (lead && !(k !== "s" && jd < 160) && !(k === "s" && !q)) continue;
        // r201: the Ahead row keeps its full reach with a "you're at" banner (the 0.7 cut dropped the far kerb's next place), one card fewer instead
        const pool = groups.get(lead || q).filter((x) => x.d < (here && k !== "s" ? NEAR_AHEAD * 0.7 : NEAR_AHEAD) && x.p.pl !== here?.pl);
        rows.push({ k, other: lead, items: k === "s" ? balance(pool, here ? NEAR_CAP - 1 : NEAR_CAP) : pool.slice(0, 3) });
        if (!rows[rows.length - 1].items.length) rows.pop();
      }
      // beta 2.91 (usage pass: "at the roundabout Nearby said: nothing of ours down this way"): round the fountain, where
      // you choose, Nearby shows each street's first places, Ahead / Left / Right as the arm lies from where you are
      { const dF = Math.hypot(H.carPos.x - H.fork.x, H.carPos.z - H.fork.y); var nearFork = !here && (dF < 420 || (dF < 1100 && !rows.length)); } // beta 3.0: on the start road too (it said "nothing of ours" at the very first frame)
      if (nearFork) {
        rows.length = 0;
        const fx = Math.sin(P.h), fz = Math.cos(P.h), byQ = new Map(), dirQ = new Map();
        for (const n of ringNodes) for (const o of N[n].out) {
          const e = E[o.e]; if (e.kind === "ring" || !e.drive) continue;
          const nx = N[n].x - H.fork.x, nz = N[n].z - H.fork.y, h0 = outH(o); if (Math.sin(h0) * nx + Math.cos(h0) * nz <= 0) continue;
          const o2 = [];
          // out along the street only (never back into the ring: a depth-first walk with one "seen" set cut it short)
          const walk = (it, budget, base, depth) => { if (depth > 6) return; const e2 = E[it.e]; for (const p of byEdge.get(it.e) || []) { const s2 = it.dir > 0 ? p.s : e2.len - p.s; if (s2 <= budget) o2.push({ p, d: base + s2 }); } if (e2.len >= budget) return; const m = endNode(it); if (ringNodes.has(m)) return; for (const o3 of N[m].out) if (o3.e !== it.e && E[o3.e].drive && E[o3.e].kind !== "ring" && !ringNodes.has(o3.dir > 0 ? E[o3.e].b : E[o3.e].a)) walk(o3, budget - e2.len, base + e2.len, depth + 1); };
          walk(o, 700, Math.hypot(N[n].x - H.carPos.x, N[n].z - H.carPos.z), 0);
          for (const x of uniq(o2)) { const q2 = x.p.q; if (!q2) continue; const l = byQ.get(q2) || []; const j = l.findIndex((y) => y.p.pl === x.p.pl); if (j < 0) l.push(x); else if (x.d < l[j].d) l[j] = x; byQ.set(q2, l); const dq = dirQ.get(q2); if (!dq || x.d < dq.d) dirQ.set(q2, { a: Math.atan2(nx, nz), d: x.d }); }
        }
        for (const [q2, l] of byQ) {
          const d = wrapA(dirQ.get(q2).a - P.h);
          if (Math.abs(d) > 2.5) continue; // the street behind you
          const k = Math.abs(d) < 0.6 ? "s" : d > 0 ? "l" : "r";
          rows.push({ k, other: q2, items: l.sort((a2, b2) => a2.d - b2.d).slice(0, 3) });
        }
        rows.sort((a2, b2) => "slr".indexOf(a2.k) - "slr".indexOf(b2.k));
      }
      // beta 3.01 (Daniel): at Two Minutes, Nearby lists Two Min Lab, then Călinescu 54 (an exception to the discovery rule)
      // r201: and the mini-game's place, the arcade by the Lab
      if (here?.pl.id === "tm") { const it = ["lab", "gloves", "hq"].map((id) => PL.find((q) => q.pl.id === id)).filter(Boolean).map((q) => ({ p: q, d: Math.hypot(q.ax - H.carPos.x, q.az - H.carPos.z) })); if (it.length) { rows.length = 0; rows.push({ k: "s", other: null, items: it }); } }
      // beta 3.01: on Strada Olari, with nothing of ours in the immediate zone, Nearby names the house ahead (it said
      // "nothing of ours down this way" on the way to it, now that Dacia 99 is not on Olari any more)
      if (!rows.length && !here && (q === "D" || Math.abs(H.carPos.x - 1170) < 60)) { let f = null; for (let k = ci; k < D.seq.length && !f; k++) { const it = D.seq[k], e = E[it.e]; for (const p of byEdge.get(it.e) || []) if (p.pl.stop === "end") { f = { p, d: it.L0 + (it.dir > 0 ? p.s : e.len - p.s) - L }; break; } } if (!f && Math.abs(H.carPos.x - 1170) < 60 && Math.cos(P.h) > 0.7) { const p = PL.find((x) => x.pl.stop === "end"); if (p) f = { p, d: Math.hypot(p.ax - H.carPos.x, p.az - H.carPos.z) }; } /* (at the junction itself the path ahead stops at the turn) */ if (f && f.d > 30 && f.d < 1400) rows.push({ k: "s", other: null, items: [f] }); }
      const auto = D.auto;
      // round 2 (Daniel: "more visual"): the panel is rebuilt only when what it shows changes; the distances update in place
      const sig = JSON.stringify([q, here?.pl.id, auto ? auto.pl?.id || "tap" : 0, rows.map((r) => [r.k, r.other, !!ex?.[r.k], r.items.map((x) => x.p.pl.id + (x.d < 0 ? "-" : ""))]), D.cardFor?.id && H.cardOpen(), imgV]);
      const dists = new Map();
      for (const r of rows) for (const x of r.items) dists.set(r.k + ":" + x.p.pl.id, x.d);
      if (!force && sig === panelSig) { updDist(dists, auto); return; }
      panelSig = sig;
      const cols = (pl) => { const b = H.brand?.(pl); const c = b?.c || pl.pin || pl.c || "#FED012"; let t = b?.t || pl.t || "#111"; if (inkLum(c) < 0.25 && inkLum(t) < 0.25) t = "#ffffff"; else if (inkLum(c) > 0.6 && inkLum(t) > 0.6) t = "#141414"; return { c, t }; }; // beta 2.92: a dark name on a dark colour (Olari 9's "you're at") turned white
      const pic = (pl) => { const u = imgOf(pl); const { c, t } = cols(pl); return u ? `<img src="${esc(u)}" alt="" decoding="async" loading="lazy">` : `<span class="n2-ini" style="color:${esc(t)}">${esc(pl.name.replace(/[^A-Za-z0-9 ]/g, "").split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]).join("").toUpperCase())}</span>`; };
      const card = (x, k) => { const pl = x.p.pl, { c, t } = cols(pl), g = k === "s" && x.sd ? (x.d < 0 ? (x.sd > 0 ? "\u2199" : "\u2198") : (x.sd > 0 ? "\u2196" : "\u2197")) : GLY[k]; return `<button class="n2-pc" data-id="${esc(pl.id)}" data-dk="${k}:${esc(pl.id)}" style="--pc:${esc(c)};--pt:${esc(t)}" aria-label="${esc(pl.name)}, ${mDist(x.d)}${k === "s" && x.sd ? `, on your ${x.sd > 0 ? "left" : "right"}${x.d < 0 ? ", just passed" : ""}` : ""}"><span class="n2-pic">${pic(pl)}<em class="n2-dch">${g}</em></span><b class="n2-nm">${esc(pl.name)}</b><span class="n2-dist mono">${mDist(x.d)}</span></button>`; };
      const qpill = (qq) => `<span class="n2-q" style="--qc:${QCOL[qq] || "#FED012"}">${esc(qq ? QNAME[qq] : "Cromatic City")}</span>`;
      let h = `<header>${qpill(q)}<span class="n2-sub mono">${q ? "NEARBY IN THIS QUARTER" : "BETWEEN THE QUARTERS"}</span></header>`;
      if (auto) { const pl = auto.pl && !auto.pl.tap ? auto.pl : null, cc = pl ? cols(pl) : { c: "#FED012", t: "#111" }; h += `<div class="n2-auto" style="--pc:${esc(cc.c)};--pt:${esc(cc.t)}">${pl ? `<span class="n2-pic sm">${pic(pl)}</span>` : ""}<span class="n2-at"><i class="mono">${auto.rev ? "BACKING UP TO" : "DRIVING YOU TO"}</i><b>${esc(pl ? pl.name : "the spot you tapped")}</b><em class="n2-dist mono" data-auto="1">${mDist(autoLeft())}</em></span><button class="n2-take">Take the wheel</button></div>`; }
      if (here && here.pl.stop !== "end" && !(D.cardFor === here.pl && H.cardOpen())) { /* beta 3.0: at Olari 9 the house's own cards are enough (no "Open" banner) */ const { c, t } = cols(here.pl); h += `<button class="n2-here" data-id="${esc(here.pl.id)}" style="--pc:${esc(c)};--pt:${esc(t)}"><span class="n2-pic sm">${pic(here.pl)}</span><span class="n2-at"><i class="mono">YOU'RE AT</i><b>${esc(here.pl.name)}</b></span><em class="n2-open">Open →</em></button>`; }
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
        // polish: a postcard is a whole render of the city (~50 ms): never while the car is moving, it would be a hitch
        if (shotQ.length && Math.abs(P.u) > 25) { setTimeout(next, 450); return; }
        const q = shotQ.shift();
        if (!q) { shotBusy = false; imgV++; render(); return; }
        const t0 = performance.now(), u = H.shot?.(q);
        (window.__n2shotMs ||= []).push(Math.round(performance.now() - t0)); // tests: what a postcard costs
        shots.set(q.id, u || "");
        (window.requestIdleCallback || setTimeout)(next, { timeout: 600 });
      };
      (window.requestIdleCallback || setTimeout)(next, { timeout: 600 });
    }
    // polish: the postcards of the places nearest the start, made while the welcome card is read (not on the first drive)
    function preShots() {
      const c = H.carPos;
      PL.slice().sort((a, b) => Math.hypot(a.x - c.x, a.z - c.z) - Math.hypot(b.x - c.x, b.z - c.z)).forEach((p) => { if (!imgOf(p.pl)) wantShot(p.pl); });
    }
    function autoLeft() {
      const a = D.auto; if (!a) return 0;
      if (FREE) return Math.abs(a.Lt - curL());
      if (a.rev) return Math.max(0, curL() - a.Lt);
      const s = autoStopL(); if (s != null) return Math.max(0, s - curL());
      const L = curL(), last = D.seq[D.seq.length - 1];
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

    // ---------- round 3: the first-time tour (in the drive guide's look), six short steps, each done by doing it:
    // drive yourself, pick a way, back up, or let us drive, look around, street or satellite. Progress n/6 and Skip on
    // every step; once per visitor (cz-drive-guide = "2"); a visitor who began with a place gets it after that card ----------
    const TUT = { i: -1, el: null, done: null, t0: 0, L0: 0, timer: 0, asked: false };
    const touchUI = matchMedia("(hover: none) and (pointer: coarse)").matches;
    // beta 2.6 (Daniel): on a phone the map (Satellite) is driven by tapping, the Street view by the pad; its tour follows
    const PHONE_STEPS = [
      { id: "taproad", keys: [], t: "Tap the road to drive there", s: "Anywhere on a street: the car takes you", at: "mid" },
      { id: "tapplace", keys: [], t: "Tap a place to visit it", s: "Its pin or its name: the car drives you there", at: "mid" },
      { id: "look", keys: [], t: "Look around", s: "Drag the map, pinch to zoom · ◎ brings you back", at: "mid" },
      { id: "view", keys: [], t: "Take the wheel", s: "Switch to Street up here", at: "views" },
      { id: "drive", keys: [], t: "Drive it yourself", s: "Drag the stick: up to go, sideways to steer", at: "car" }
    ];
    let STEPS;
    const DESK_STEPS = [
      { id: "drive", keys: ["←", "↑", "→"], t: "Drive it yourself", s: touchUI ? "↑ to go: it keeps to the road · ← → to turn" : "↑ to go: it keeps to the road · ← → to turn (or W A S D)", at: "car" },
      { id: "round", keys: ["↑"], t: "Take the roundabout", s: touchUI ? "Hold ↑: round it and straight on · tap → for the next exit" : "Hold ↑: round the fountain and straight on · tap → for the next exit", at: "car" },
      { id: "back", keys: ["↓"], t: "Back up or turn round", s: touchUI ? "Hold ↓ to back up · stopped, ↑ with ← or → turns you round" : "Hold ↓ (or S) to back up · stopped, ↑ with ← or → turns you round", at: "car" },
      { id: "tap", keys: [], t: "Or let us drive", s: "Tap a place on the map, or a card in Nearby", at: "panel" },
      { id: "look", keys: [], t: "Look around", s: touchUI ? "Drag the map, pinch to zoom · ◎ brings you back" : "Drag the map, scroll to zoom · ◎ brings you back", at: "mid" },
      { id: "view", keys: [], t: "Street or Bird's eye", s: touchUI ? "Switch the view down here" : "Switch the view down here, or press V", at: "views" }
    ];
    STEPS = DESK_STEPS;
    function tutorial(done, force) {
      STEPS = phoneUI() ? PHONE_STEPS : DESK_STEPS;
      try { if (!force && localStorage.getItem("cz-drive-guide") === "2") return false; localStorage.setItem("cz-drive-guide", "2"); } catch {}
      if (!D.ready && !place()) return false;
      D.ready = true;
      if (!TUT.el) {
        TUT.el = document.createElement("div"); TUT.el.className = "drive-guide n2-guide hidden"; TUT.el.setAttribute("role", "status");
        document.body.appendChild(TUT.el);
        TUT.el.addEventListener("click", (e) => { if (e.target.closest(".n2-skip")) tutEnd("skipped"); });
        TUT.el.addEventListener("pointerdown", (e) => e.stopPropagation());
      }
      TUT.asked = true; TUT.done = done;
      tutGo(0);
      return true;
    }
    function tutGo(i) {
      if (FREE && !P.init) freeInit(); // beta 2.91: the tour can start before the car's first frame (an early skip): step 1 measured from x=0 and passed at once
      TUT.i = i; TUT.t0 = performance.now(); TUT.L0 = curL(); TUT.x0 = P.x; TUT.z0 = P.z; TUT.inRing = false; TUT.turn = D.turnT || 0; TUT.rev = D.revDist || 0; TUT.slow = D.slowTurn || 0; TUT.view = D.view; TUT.dragged = false;
      const st = STEPS[i], e = TUT.el, key = (k) => `<span class="n2-cap${k === "↑" ? " big" : ""}" aria-hidden="true">${k}</span>`;
      e.innerHTML = `${st.keys.length ? `<span class="n2-caps">${st.keys.map(key).join("")}</span>` : ""}<b>${st.t}</b><i>${st.s}</i><span class="n2-tbar"><em class="mono">${i + 1}/${STEPS.length}</em><button class="n2-skip">Skip</button></span>`;
      e.dataset.at = st.at;
      e.classList.remove("hidden", "in"); void e.offsetWidth; e.classList.add("in");
      keyEls.u.classList.toggle("tut", st.id === "drive" || st.id === "round"); keyEls.l.classList.toggle("tut", st.id === "drive"); keyEls.r.classList.toggle("tut", st.id === "drive"); keyEls.d.classList.toggle("tut", st.id === "back"); // polish: step 2 is "hold ↑"
      views.classList.toggle("tut", st.id === "view"); panel.classList.toggle("tut", st.id === "tap");
      document.body.classList.toggle("n2-tour", true);
      // phone, "tap a place": the map pulls back to show the nearest places (the car's own spot may have none in view)
      TUT.fly = null;
      if (st.id === "tapplace") { const c = H.carPos, q = PL.filter((p) => !p.hide).sort((a, b) => Math.hypot(a.x - c.x, a.z - c.z) - Math.hypot(b.x - c.x, b.z - c.z))[0]; if (q) { const d = Math.hypot(q.x - c.x, q.z - c.z); TUT.fly = { x: q.x * 0.85 + c.x * 0.15, z: q.z * 0.85 + c.z * 0.15, d: clamp(d * 1.6, 2400, 4600), t: 0 }; } }
      czEv?.("onboarding_step", { step: "drive_" + st.id, action: "shown" });
    }
    const czEv = (n, p) => { try { window.czEvent && window.czEvent(n, p || {}); } catch {} };
    function tutNext() {
      czEv("onboarding_step", { step: "drive_" + STEPS[TUT.i].id, action: "done" });
      if (TUT.i + 1 < STEPS.length) { tutGo(TUT.i + 1); return; }
      // the end: a short "you're all set", then it goes
      const e = TUT.el; e.innerHTML = `<b>You're all set</b><i>Have a good drive</i>`; e.dataset.at = "mid";
      for (const k of "udlr") keyEls[k].classList.remove("tut"); views.classList.remove("tut"); panel.classList.remove("tut");
      TUT.i = STEPS.length; clearTimeout(TUT.timer); TUT.timer = setTimeout(() => tutEnd("done"), 2200);
    }
    function tutEnd(how) {
      if (TUT.i < 0) return;
      TUT.i = -1; clearTimeout(TUT.timer); document.body.classList.remove("n2-tour");
      TUT.el?.classList.add("hidden");
      for (const k of "udlr") keyEls[k].classList.remove("tut"); views.classList.remove("tut"); panel.classList.remove("tut");
      if (how === "skipped") czEv("onboarding_step", { step: "drive_tour", action: "skipped" });
      const d = TUT.done; TUT.done = null; d?.("done");
    }
    // per frame: is the step done? and the pill's place (over the car, by the panel, mid screen, over the views)
    function tutTick() {
      if (TUT.i < 0 && !TUT.asked && D.arrT && !D.auto && !H.cardOpen() && performance.now() - D.arrT > 1500) { TUT.asked = true; tutorial(null); }
      if (TUT.i < 0 || TUT.i >= STEPS.length) { if (TUT.i >= 0) tutPlace("mid"); return; }
      const st = STEPS[TUT.i], L = curL(), now = performance.now(), mv = H.mapView;
      if (TUT.fly && st.id === "tapplace") {
        const f = TUT.fly; f.t += 1 / 60;
        if ((mv.direct || 0) > TUT.t0 || f.t > 2.2 || (D.auto && !D.auto.pl?.tap)) TUT.fly = null;
        else { const k = reduced() ? 1 : 0.06; mv.follow = false; mv.focus = null; mv.distGoal = null; mv.tgt.x += (f.x - mv.tgt.x) * k; mv.tgt.z += (f.z - mv.tgt.z) * k; mv.dist += (f.d - mv.dist) * k; }
      }
      if (now - TUT.t0 > 600) {
        if (st.id === "drive" && Math.hypot(P.x - TUT.x0, P.z - TUT.z0) > 140) return tutNext();
        if (st.id === "round") { const d = Math.hypot(P.x - H.fork.x, P.z - H.fork.y); if (d < 105) TUT.inRing = true; if (TUT.inRing && d > 230) return tutNext(); }
        if (st.id === "back" && ((D.revDist || 0) - TUT.rev > 25 || (D.slowTurn || 0) - TUT.slow > 2.4)) return tutNext();
        if (st.id === "tap" && D.auto) return tutNext();
        if (st.id === "taproad" && D.auto && D.auto.pl?.tap) return tutNext();
        if (st.id === "tapplace" && ((D.auto && D.auto.pl && !D.auto.pl.tap) || H.cardOpen())) return tutNext();
        if (st.id === "look") { if ((mv.direct || 0) > TUT.t0) TUT.dragged = true; if (TUT.dragged && mv.follow) return tutNext(); } // a real hand on the map (r166's), then back with ◎ or by driving
        if (st.id === "view" && D.view !== TUT.view) return tutNext();
      }
      tutPlace(st.at);
    }
    function tutPlace(at) {
      const e = TUT.el, W = VP.w, Hh = VP.h, ph = W < 720;
      let x = W / 2, y = Hh * 0.42;
      if (at === "car") { const p = H.project(H.carPos.x, 40, H.carPos.z); if (p.z < 1) { x = (p.x * 0.5 + 0.5) * W; y = (-p.y * 0.5 + 0.5) * Hh - 80; } }
      else if (at === "panel") { const r = panel.getBoundingClientRect(); if (ph) { x = W / 2; y = r.bottom + 70; } else { x = r.left + r.width / 2; y = r.top - 70; } }
      else if (at === "views") { const r = views.getBoundingClientRect(); x = r.left + r.width / 2; y = ph ? r.bottom + 70 : r.top - 80; } // beta 2.7: on a phone the toggle is at the top
      if (ph && D.streetT > 0.5) y = Math.min(y, Hh * 0.4); // the lower half is the stick's
      // on a phone the Nearby panel takes the top: the pill stays below it
      const top = ph ? Math.max(250, (getComputedStyle(panel).opacity !== "0" && getComputedStyle(root).display !== "none" ? panel.getBoundingClientRect().bottom : 0) + 95) : 150;
      e.style.left = clamp(x, 150, W - 150).toFixed(0) + "px";
      e.style.top = (ph && at === "views" ? clamp(y, 150, Hh - 230) : clamp(y, Math.min(top, Hh - 260), Hh - (ph ? 230 : 120))).toFixed(0) + "px";
    }

    const api = {
      on: false, graph: G, D,
      tutorial, tutorialEnd: () => tutEnd(null), tourStep: () => (TUT.i >= 0 && TUT.i < STEPS.length ? STEPS[TUT.i].id : TUT.i >= STEPS.length ? "end" : null),
      get camK() { return D.camK; },
      mv: () => { const m = H.mapView; return { x: Math.round(m.tgt.x), z: Math.round(m.tgt.z), dist: Math.round(m.dist), yaw: +m.yaw.toFixed(3), pitch: +m.pitch.toFixed(3), follow: m.follow }; },
      onRoadMask: (x, z) => !MASK.resolve(x, z, 0).hit, closed: () => CLOSED, snd: SND, explore: (e, dir) => { const o = []; explore({ e, dir }, 700, 0, o, new Set(), 0); return uniq(o).map((x) => [x.p.pl.name, x.p.q, Math.round(x.d)]); }, copT: () => (COP.on ? +COP.on.t.toFixed(2) : null), speed: () => P.u, dims: () => ({ len: H.carLen(), span: H.vehSpan() }), cam: () => H.camera, look: (x, z, d) => { const m = H.mapView; m.follow = false; m.tgt.set(x, 0, z); m.dist = d; m.distGoal = null; m.vx = m.vz = 0; }, put: (x, z, h) => { P.x = x; P.z = z; P.h = h; P.u = P.w = P.yr = 0; }, tick, pose, camera, body, free: FREE, stepDist: () => (FREE ? P.ds : 0), kap: () => (Math.abs(P.u) < 5 ? 0 : P.yr / P.u), phys: () => ({ x: P.x, z: P.z, h: P.h, u: P.u, w: P.w, contact: P.contact }),
      // a place from the map (a pin, a chip, the welcome card): driven to along the graph
      go(pl) {
        if (!pl || pl.find) return false;
        if (pl.board) { H.hideCard(); D.auto = null; H.arrive(pl); return true; } // beta 2.92 (r185): no road to the jet any more: its pin opens the boarding pass
        const st = pl.stop ? H.stops.find((s) => s.id === pl.stop) : null;
        const x = st ? st.x : pl.x ?? pl.px, z = st ? st.y : pl.z ?? pl.pz;
        if (x == null) return false;
        const a = G.nearest(x, z, 420, (e) => e.drive);
        if (!a) return false;
        H.hideCard(); D.cardFor = null; D.lastArr = null;
        return goTo({ e: a.e, s: a.s }, pl);
      },
      moving: () => Math.abs(D.v) > 20 || !!D.auto || !!D.kturn || !!D.uturn,
      // a point on a drawn road (within its width, a little margin)
      onRoad: (x, z) => { const a = G.nearest(x, z, 60); return !!a && a.d < E[a.e].w * 0.5 + 6; },
      // a tap on any street of the graph
      tap(x, z) {
        // round 3: a tap on any street (side streets too) drives to the nearest point of a normal road
        if (!G.nearest(x, z, 45)) return null;
        const a = G.nearest(x, z, 420, (e) => e.drive);
        if (!a) return null;
        const e = E[a.e], p = pointAt(e.pts, e.cum, a.s);
        goTo({ e: a.e, s: a.s }, { id: "tap", tap: true, x: p[0], z: p[1], name: "", c: "#FED012" });
        return p;
      },
      setActive(on) {
        api.on = on;
        document.body.classList.toggle("nav2", on);
        if (!on) { H.exitMark?.(null); nextEl.classList.add("off"); nxSig = ""; for (const k of "udlr") keyUp(k); D.ready = false; D.auto = null; D.uturn = null; D.streetT = 0; D.camK = 0; viewSig = ""; document.body.classList.remove("nav2-street"); }
        else { viewSig = ""; let seen = false; try { seen = localStorage.getItem("cz-drive-guide") === "2"; } catch {} if (seen) setTimeout(() => toast(H.isPhone() ? "Drive it yourself with the pad · or tap a place" : "Drive it yourself: arrows or WASD · V switches the view"), 1600); } // a first visit gets the tutorial instead
      },
      view: setView,
      press: (k, down = true) => (down ? keyDown(k) : keyUp(k)),
      quarterAt, vehLow: () => H.vehLow?.(), lamps: (on) => H.reverseLamps(on), treeH: (x, z) => treeAt()(x, z), trees: () => (H.trees?.() || []).length,
      place: (id) => H.places.find((p) => p.id === id),
      pl: () => PL.map((p) => ({ id: p.pl.id, name: p.pl.name, x: p.x, z: p.z, bx: p.pl.px ?? p.x, bz: p.pl.pz ?? p.z, e: p.e, s: Math.round(p.s), ax: Math.round(p.ax), az: Math.round(p.az), q: p.q, hide: p.hide })), // r201: tests (Nearby balance)
      rows: () => [...panel.querySelectorAll(".n2-pc")].map((b) => b.dataset.dk), // r201: tests
      copNow: () => { COP.log.push([performance.now(), 5]); }, // r201: tests (the chase without four seconds of drifting by script)
      state: () => { const L = curL(), dec = nextDecision(L); return { v: Math.round(D.v), L: Math.round(L), car: [Math.round(H.carPos.x), Math.round(H.carPos.z)], dec: dec && { type: dec.type, in: Math.round(dec.L - L), ex: dec.ex && { l: !!dec.ex.l, s: !!dec.ex.s, r: !!dec.ex.r }, side: dec.side }, auto: D.auto && (D.auto.pl?.id || "tap"), q: quarterAt(H.carPos.x, H.carPos.z), hint: hintEl.textContent, card: H.cardOpen(), keys: { ...D.keys }, yaw: +H.mapView.yaw.toFixed(2), hd: +H.heading().toFixed(2) }; }
    };
    window.__nav2 = api; // for tests
    return api;
  };
})();
