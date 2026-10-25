// Polite City · Phase B · pedestrians.js (Iris). People on the pavements of nav2's real road graph.
// A classic script: registers window.__politePhaseB.pedestrians(opts) -> { init(ctx), update(dt, ctx), dispose(), stats() }.
//
// 20-60 people on desktop, 8-15 on the lite path, kept around the player (recycled beyond ~1.7k units). They walk the
// pavements of the drawn roads (drive + long avenues; ring and side streets optional), turn corners at junctions, and
// cross: at the corners and at the zebra crossings the host passes in (ctx.crossings), after a look for cars (traffic.js
// publishes ctx.shared.traffic.cars; the player counts too), quicker if a car turns up. While they are on the
// carriageway they are published as ctx.shared.pedObstacles so the traffic waits. When the player's car comes close they
// step aside towards the buildings and wait for it. In the rain most of them carry umbrellas (black mostly, a few in the
// world's colours: that's the top-down view's confetti). Now and then (max one a minute, plan.md) someone near the car
// says something in a speech bubble: "Nice kerning!", "Is that the Cromatic car?"... short, our words, no em dashes.
// Cheap: one instanced low-poly body (walk cycle in the vertex shader: legs and arms swing around hip and shoulder from a
// per-instance phase), one instanced umbrella, one instanced blob shadow (desktop), one sprite for the bubble: 3-4 draws.
(() => {
  "use strict";
  const PB = (window.__politePhaseB = window.__politePhaseB || {});
  const BARKS = [
    "Nice kerning!", "Is that the Cromatic car?", "My cousin did our logo… it's fine.", "After you!", "Lovely night for a rebrand.",
    "Mind the puddle, please.", "Love the leading on that sign.", "Final_FINAL_v8? Bold.", "Drive nicely, dear.", "Is it raining or is it a mood?",
    "That's a very polite indicator.", "Olari 9? Second left. Probably.", "Who approved this font?", "Wait, is that a 1300?"
  ];
  const COATS = ["#2d3f5c", "#1f2a36", "#5a2f2b", "#3f4b3a", "#8a6a3c", "#24282f", "#6d6f74", "#b3a58a", "#7a2e3b", "#33465e", "#c9a46a", "#2c2c2c", "#4e3b5e", "#F65342", "#119BFE", "#FED012"];
  const SKINS = ["#f1c9a5", "#e0ac84", "#c68b62", "#a86e46", "#7d4f32", "#f4d6bf"];
  const UMBRELLAS = ["#141414", "#141414", "#141414", "#1d2633", "#2d3f5c", "#FED012", "#F65342", "#119BFE", "#B098C8", "#e8e2d0", "#28C840"];
  const cumOf = (p) => { const c = [0]; for (let i = 1; i < p.length; i++) c.push(c[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1])); return c; };
  function prep(G) { for (const e of G.E) { if (!e.cum) e.cum = cumOf(e.pts); if (e.len == null) e.len = e.cum[e.cum.length - 1]; } }
  function sample(e, s, out) { // along a->b
    const P = e.pts, C = e.cum; let i = 1; while (i < P.length - 1 && C[i] < s) i++;
    const a = P[i - 1], b = P[i], L = C[i] - C[i - 1] || 1, f = Math.max(0, Math.min(1, (s - C[i - 1]) / L));
    out.x = a[0] + (b[0] - a[0]) * f; out.z = a[1] + (b[1] - a[1]) * f; out.tx = (b[0] - a[0]) / L; out.tz = (b[1] - a[1]) / L; return out;
  }

  // the body: legs, coat (torso + sleeves), head, hair; model space feet at y 0, ~17.5 units (1.75 m), facing +z
  function personGeometry(T) {
    const parts = [];
    const add = (g, part, ty) => { g = g.index ? g.toNonIndexed() : g; if (ty) g.translate(0, ty, 0); const n = g.attributes.position.count, a = new Float32Array(n).fill(part); g.setAttribute("aPart", new T.BufferAttribute(a, 1)); for (const k of Object.keys(g.attributes)) if (!["position", "normal", "aPart"].includes(k)) g.deleteAttribute(k); parts.push(g); };
    const box = (w, h, d, x, y, z, part, taper) => { const g = new T.BoxGeometry(w, h, d); if (taper) { const p = g.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) > 0) p.setX(i, p.getX(i) * taper); g.computeVertexNormals(); } g.translate(x, y, z); add(g, part); };
    box(1.7, 8.6, 1.9, -1.15, 4.3, 0, 2); box(1.7, 8.6, 1.9, 1.15, 4.3, 0, 3);           // legs (hip at 8.6)
    box(4.9, 7.6, 2.9, 0, 12.1, 0, 0, 0.92);                                            // coat (to the hip)
    box(1.3, 6.4, 1.5, -3.15, 12.4, 0, 4); box(1.3, 6.4, 1.5, 3.15, 12.4, 0, 5);          // sleeves (shoulder at 15.4)
    const h = new T.IcosahedronGeometry(1.55, 0); h.translate(0, 17.1, 0.1); add(h, 1);   // head
    box(3.0, 1.1, 3.0, 0, 18.3, -0.15, 6);                                              // hair / cap
    const keys = ["position", "normal", "aPart"], g = new T.BufferGeometry();
    for (const k of keys) { const it = parts[0].attributes[k].itemSize, n = parts.reduce((s, q) => s + q.attributes[k].count, 0), arr = new Float32Array(n * it); let o = 0; for (const q of parts) { arr.set(q.attributes[k].array, o); o += q.attributes[k].array.length; } g.setAttribute(k, new T.BufferAttribute(arr, it)); }
    g.computeBoundingSphere(); g.boundingSphere.radius = 1e5;
    return g;
  }
  function personMaterial(T) {
    const Mat = T.MeshLambertMaterial || T.MeshStandardMaterial, m = new Mat({ color: "#ffffff" });
    if (m.isMeshStandardMaterial) m.roughness = 0.8;
    m.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", `#include <common>
          attribute float aPart; attribute vec3 iCoat; attribute vec4 iMisc; varying vec3 vCol;
          vec3 pbRotX(vec3 p, float pivotY, float a) { p.y -= pivotY; float c = cos(a), s = sin(a); return vec3(p.x, p.y * c - p.z * s, p.y * s + p.z * c) + vec3(0.0, pivotY, 0.0); }`)
        // iMisc: x walk phase, y stride (0 standing .. 1 walking, 1.6 hurrying), z skin tone (0..1), w umbrella (arm up)
        .replace("#include <begin_vertex>", `#include <begin_vertex>
          float sw = sin(iMisc.x) * 0.55 * iMisc.y;
          if (aPart > 1.5 && aPart < 2.5) transformed = pbRotX(transformed, 8.6, sw);
          else if (aPart > 2.5 && aPart < 3.5) transformed = pbRotX(transformed, 8.6, -sw);
          else if (aPart > 3.5 && aPart < 4.5) transformed = pbRotX(transformed, 15.0, -sw * 0.8);
          else if (aPart > 4.5 && aPart < 5.5) transformed = pbRotX(transformed, 15.0, mix(sw * 0.8, -1.25, iMisc.w));
          transformed.y += abs(cos(iMisc.x)) * 0.35 * iMisc.y;
          vec3 skin = mix(vec3(0.95, 0.78, 0.64), vec3(0.42, 0.27, 0.17), iMisc.z);
          vCol = aPart < 0.5 || aPart > 3.5 && aPart < 5.5 ? iCoat : aPart < 1.5 ? skin : aPart < 3.5 ? mix(vec3(0.07, 0.08, 0.11), vec3(0.16, 0.22, 0.33), fract(iMisc.z * 7.0)) : vec3(0.08, 0.06, 0.05);`);
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", "#include <common>\nvarying vec3 vCol;")
        .replace("#include <color_fragment>", "#include <color_fragment>\ndiffuseColor.rgb *= vCol;");
    };
    m.customProgramCacheKey = () => "pb-person-1";
    m.userData.outlineParameters = { visible: false };
    return m;
  }
  function umbrellaGeometry(T) {
    const can = new T.ConeGeometry(7.6, 2.6, 8, 1, true); can.translate(2.6, 21.6, 3.4);
    const tip = new T.CylinderGeometry(0.3, 0.3, 1.4, 4); tip.translate(2.6, 23.4, 3.4);
    const shaft = new T.CylinderGeometry(0.22, 0.22, 8.5, 4); shaft.translate(2.6, 16.6, 3.4); // in the raised right hand
    const parts = [can, tip, shaft].map((g) => { g = g.index ? g.toNonIndexed() : g; for (const k of Object.keys(g.attributes)) if (!["position", "normal"].includes(k)) g.deleteAttribute(k); return g; });
    const g = new T.BufferGeometry();
    for (const k of ["position", "normal"]) { const n = parts.reduce((s, q) => s + q.attributes[k].array.length, 0), arr = new Float32Array(n); let o = 0; for (const q of parts) { arr.set(q.attributes[k].array, o); o += q.attributes[k].array.length; } g.setAttribute(k, new T.BufferAttribute(arr, 3)); }
    g.computeBoundingSphere(); g.boundingSphere.radius = 1e5;
    return g;
  }

  PB.pedestrians = function createPedestrians(opts = {}) {
    let T, ctx0, G, group, body, umb, shadow, bubble, bubbleTex, bubbleCv, rng, lite, gy, iCoat, iMisc;
    let walks = [], peds = [], crossPts = [], time = 0, barkT = 8, barkUntil = 0, barkPed = null, barkScale = 0, barkIdx = -1;
    const st = { peds: 0, crossing: 0, barks: 0, aside: 0, lastBark: "" };
    const tA = {}, tB = {};
    let m, q, p, s, up, zero, cam = null;

    // the pavements: every allowed edge, both sides (side +1 = right of a->b), minus the sides that run into buildings
    function allowed(e) { return opts.edgeFilter ? opts.edgeFilter(e) : (e.kind === "drive" || e.kind === "long" || (opts.minor && e.kind === "minor")) && e.len > 90; }
    const off = (e) => e.w / 2 + 9;
    function trim(e, node) { const n = G.N[node]; let w = 0; for (const o of n.out) w = Math.max(w, G.E[o.e].w); return n.out.length > 1 ? w / 2 + 14 : 6; }

    function init(ctx) {
      ctx0 = ctx; T = ctx.T; G = ctx.graph; rng = ctx.rng || Math.random; lite = !!ctx.lite; gy = ctx.groundY ?? 1.6;
      prep(G);
      // footprints on a grid, for the pavement check (the site's FOOTPRINTS: { x, z, w, d, ang })
      const FP = ctx.footprints || [], grid = new Map(), CS = 200, gk = (x, z) => Math.floor(x / CS) * 100003 + Math.floor(z / CS);
      for (const f of FP) { const r = (f.w + f.d) / 2 + 4; for (let x = f.x - r; x <= f.x + r + CS; x += CS) for (let z = f.z - r; z <= f.z + r + CS; z += CS) { const k = gk(x, z); let l = grid.get(k); if (!l) grid.set(k, (l = [])); if (!l.includes(f)) l.push(f); } }
      const inB = (x, z) => { for (const f of grid.get(gk(x, z)) || []) { const dx = x - f.x, dz = z - f.z, c = Math.cos(f.ang || 0), sn = Math.sin(f.ang || 0), u = dx * c - dz * sn, v = dx * sn + dz * c; if (Math.abs(u) < f.w / 2 + 3 && Math.abs(v) < f.d / 2 + 3) return true; } return false; };
      for (const e of G.E) {
        if (!allowed(e)) continue;
        for (const side of [1, -1]) {
          const t0 = trim(e, e.a), t1 = e.len - trim(e, e.b); if (t1 - t0 < 60) continue;
          let ok = true; for (let sd = t0; sd <= t1 && ok; sd += 30) { const pt = sample(e, sd, tA), o = off(e) * side; if (inB(pt.x - pt.tz * o, pt.z + pt.tx * o)) ok = false; }
          if (ok) walks.push({ e, side, t0, t1 });
        }
      }
      const walkOf = new Map(); for (const w of walks) walkOf.set(w.e.id * 2 + (w.side > 0 ? 0 : 1), w);
      ctx0._pbWalkOf = walkOf;
      // zebra crossings from the host (optional): snapped to the nearest pavement edge
      for (const c of ctx.crossings || []) {
        let best = null; for (const w of walks) { if (w.side < 0) continue; const e = w.e; for (let sd = w.t0; sd <= w.t1; sd += 10) { const pt = sample(e, sd, tA), d = Math.hypot(pt.x - c.x, pt.z - c.z); if (d < e.w && (!best || d < best.d)) best = { e, s: sd, d }; } }
        if (best) crossPts.push(best);
      }
      // the meshes
      const n = Math.max(lite ? 8 : 20, Math.min(lite ? 15 : 60, opts.count ?? (lite ? 11 : 40)));
      group = new T.Group(); group.name = "pb-pedestrians";
      const geo = personGeometry(T);
      iCoat = new T.InstancedBufferAttribute(new Float32Array(n * 3), 3); iMisc = new T.InstancedBufferAttribute(new Float32Array(n * 4), 4);
      geo.setAttribute("iCoat", iCoat); geo.setAttribute("iMisc", iMisc);
      body = new T.InstancedMesh(geo, personMaterial(T), n); body.frustumCulled = false; group.add(body);
      const UM = T.MeshLambertMaterial || T.MeshStandardMaterial;
      umb = new T.InstancedMesh(umbrellaGeometry(T), new UM({ color: "#ffffff", side: T.DoubleSide }), n); umb.frustumCulled = false; umb.material.userData.outlineParameters = { visible: false }; group.add(umb);
      if (!lite) {
        const cv = document.createElement("canvas"); cv.width = cv.height = 32; const c = cv.getContext("2d"), g = c.createRadialGradient(16, 16, 0, 16, 16, 16); g.addColorStop(0, "rgba(0,0,0,.55)"); g.addColorStop(1, "rgba(0,0,0,0)"); c.fillStyle = g; c.fillRect(0, 0, 32, 32);
        const pg = new T.PlaneGeometry(1, 1); pg.rotateX(-Math.PI / 2);
        shadow = new T.InstancedMesh(pg, new T.MeshBasicMaterial({ map: new T.CanvasTexture(cv), transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }), n);
        shadow.frustumCulled = false; shadow.renderOrder = 1; shadow.material.userData.outlineParameters = { visible: false }; group.add(shadow);
      }
      // the speech bubble: one sprite, repainted per bark
      bubbleCv = document.createElement("canvas"); bubbleCv.width = 512; bubbleCv.height = 160;
      bubbleTex = new T.CanvasTexture(bubbleCv); if (T.SRGBColorSpace) bubbleTex.colorSpace = T.SRGBColorSpace;
      bubble = new T.Sprite(new T.SpriteMaterial({ map: bubbleTex, transparent: true, depthTest: false, depthWrite: false, toneMapped: false }));
      bubble.center.set(0.5, 0); bubble.visible = false; bubble.renderOrder = 10; group.add(bubble);
      for (let i = 0; i < n; i++) {
        const c = new T.Color(COATS[Math.floor(rng() * COATS.length)]);
        iCoat.setXYZ(i, c.r, c.g, c.b);
        peds.push({ i, w: null, s: 0, dir: 1, v: 12 + rng() * 6, phase: rng() * 6.28, lat: rng() * 6 - 3, x: 0, z: 0, h: 0, state: "walk", leg: null, wait: 0, aside: 0, umbK: rng(), umbC: new T.Color(UMBRELLAS[Math.floor(rng() * UMBRELLAS.length)]), skin: rng(), idle: 0, crossed: false, active: false, size: 0.95 + rng() * 0.12 });
      }
      for (const pd of peds) spawn(pd, 0, lite ? 1000 : 1400);
      m = new T.Matrix4(); q = new T.Quaternion(); p = new T.Vector3(); s = new T.Vector3(1, 1, 1); up = new T.Vector3(0, 1, 0); zero = new T.Matrix4().makeScale(0, 0, 0);
      ctx.shared = ctx.shared || {}; ctx.shared.pedObstacles = [];
      ctx.scene.add(group);
    }
    function pavePoint(w, sd, lat, out) { const pt = sample(w.e, sd, tB), o = (off(w.e) + lat) * w.side; out.x = pt.x - pt.tz * o; out.z = pt.z + pt.tx * o; out.tx = pt.tx; out.tz = pt.tz; return out; }
    function spawn(pd, dmin, dmax) {
      const P = ctx0.player();
      for (let k = 0; k < 40; k++) {
        const w = walks[Math.floor(rng() * walks.length)]; if (!w) return false;
        const sd = w.t0 + rng() * (w.t1 - w.t0), pt = pavePoint(w, sd, pd.lat, tA), d = Math.hypot(pt.x - P.x, pt.z - P.z);
        if (d < dmin || d > dmax) continue;
        pd.w = w; pd.s = sd; pd.dir = rng() < 0.5 ? 1 : -1; pd.state = "walk"; pd.leg = null; pd.aside = 0; pd.active = true; pd.x = pt.x; pd.z = pt.z; pd.h = Math.atan2(pt.tx * pd.dir, pt.tz * pd.dir); pd.idle = rng() < 0.12 ? 2 + rng() * 6 : 0;
        return true;
      }
      return false;
    }
    // the end of a pavement: turn the corner onto another one, or cross (the street just walked, or the next one)
    function atEnd(pd) {
      const e = pd.w.e, node = pd.dir > 0 ? e.b : e.a, here = { x: pd.x, z: pd.z };
      const choices = [];
      for (const o of G.N[node].out) {
        const ne = G.E[o.e];
        for (const side of [1, -1]) {
          const w = ctx0._pbWalkOf.get(ne.id * 2 + (side > 0 ? 0 : 1)); if (!w) continue;
          if (w === pd.w) continue;
          const sd = o.dir > 0 ? w.t0 : w.t1, pt = pavePoint(w, sd, pd.lat, tA), d = Math.hypot(pt.x - here.x, pt.z - here.z);
          choices.push({ w, sd, dir: o.dir, d, x: pt.x, z: pt.z });
        }
      }
      // the other side of the street just walked (a crossing at this corner)
      const other = ctx0._pbWalkOf.get(e.id * 2 + (pd.w.side > 0 ? 1 : 0));
      if (other) { const sd = pd.dir > 0 ? other.t1 : other.t0, pt = pavePoint(other, sd, pd.lat, tA); choices.push({ w: other, sd, dir: -pd.dir, d: Math.hypot(pt.x - here.x, pt.z - here.z), x: pt.x, z: pt.z, back: true }); }
      if (!choices.length) { pd.dir = -pd.dir; return; } // a dead end: walk back
      const corner = choices.filter((c) => c.d < 70 && !c.back), cross = choices.filter((c) => c.d >= 70 && c.d < 240);
      let c;
      if (cross.length && (rng() < (opts.crossRate ?? 0.4) || !corner.length) && !pd.crossed) c = cross[Math.floor(rng() * cross.length)];
      else if (corner.length) c = corner[Math.floor(rng() * corner.length)];
      else { pd.dir = -pd.dir; return; }
      pd.crossed = c.d >= 70;
      pd.leg = { x0: here.x, z0: here.z, x1: c.x, z1: c.z, len: c.d, t: 0, next: c, road: c.d >= 70 };
      pd.state = pd.leg.road ? "kerb" : "leg"; pd.wait = 0.4 + rng() * 0.8;
    }
    // is it safe to cross from (x0,z0) to (x1,z1)? no car (or the player) heading for it soon
    function clearToCross(L, P) {
      const mx = (L.x0 + L.x1) / 2, mz = (L.z0 + L.z1) / 2;
      const cars = ctx0.shared?.traffic?.cars || [];
      for (const c of cars) { const dx = mx - c.x, dz = mz - c.z, d = Math.hypot(dx, dz); if (d < 90) return false; const sp = Math.hypot(c.vx, c.vz); if (d < 330 && sp > 5 && (dx * c.vx + dz * c.vz) / (d * sp) > 0.6 && d / sp < 4) return false; }
      const dp = Math.hypot(mx - P.x, mz - P.z); if (dp < 160) return false;
      return true;
    }

    function paintBubble(text) {
      const c = bubbleCv.getContext("2d"), W = 512, H = 160; c.clearRect(0, 0, W, H);
      let fs = 44; c.font = `700 ${fs}px CromaticSans, "Google Sans", system-ui, sans-serif`;
      while (c.measureText(text).width > W - 70 && fs > 22) { fs -= 2; c.font = `700 ${fs}px CromaticSans, "Google Sans", system-ui, sans-serif`; }
      const tw = c.measureText(text).width, bw = Math.min(W - 12, tw + 56), bh = 92, x = (W - bw) / 2, y = 8;
      c.lineWidth = 6; c.strokeStyle = "#141414"; c.fillStyle = "#F2F2F2";
      c.beginPath(); const r = 30; c.moveTo(x + r, y); c.arcTo(x + bw, y, x + bw, y + bh, r); c.arcTo(x + bw, y + bh, x, y + bh, r); c.lineTo(W / 2 + 18, y + bh); c.lineTo(W / 2 - 4, y + bh + 40); c.lineTo(W / 2 - 14, y + bh); c.arcTo(x, y + bh, x, y, r); c.arcTo(x, y, x + bw, y, r); c.closePath();
      c.fill(); c.stroke();
      c.fillStyle = "#141414"; c.textAlign = "center"; c.textBaseline = "middle"; c.fillText(text, W / 2, y + bh / 2 + 2);
      bubbleTex.needsUpdate = true;
      return bw / W;
    }
    function bark(P, camera) {
      // someone near the car, in front of the camera, not crossing
      let best = null, bd = 1e9;
      for (const pd of peds) { if (!pd.active || pd.state === "cross") continue; const d = Math.hypot(pd.x - P.x, pd.z - P.z); if (d < 60 || d > 300) continue; if (camera) { const v = p.set(pd.x, 15, pd.z).project(camera); if (Math.abs(v.x) > 0.8 || Math.abs(v.y) > 0.8 || v.z > 1) continue; } if (d < bd) { bd = d; best = pd; } }
      if (!best) return false;
      let i; do i = Math.floor(rng() * BARKS.length); while (i === barkIdx && BARKS.length > 1); barkIdx = i;
      paintBubble(BARKS[i]); barkPed = best; barkUntil = time + 2.8; barkScale = 0; st.barks++; st.lastBark = BARKS[i];
      best.idle = Math.max(best.idle, 2.2); // they stop to say it
      ctx0.onBark?.(BARKS[i]);
      return true;
    }

    function update(dt, ctx) {
      if (!group) return;
      dt = Math.min(dt, 0.05); time += dt;
      const P = ctx.player(), camera = ctx.camera, reduced = !!(typeof ctx.reduced === "function" ? ctx.reduced() : ctx.reduced);
      const rain = ctx.shared?.rain ?? (typeof ctx.rain === "function" ? ctx.rain() : 0.7);
      const obst = ctx.shared.pedObstacles; obst.length = 0;
      let nCross = 0, nAside = 0;
      for (const pd of peds) {
        if (!pd.active) { spawn(pd, 700, lite ? 1100 : 1500); continue; }
        const dP = Math.hypot(pd.x - P.x, pd.z - P.z);
        if (dP > (lite ? 1400 : 1800) && pd.state !== "cross") { spawn(pd, 600, lite ? 1100 : 1400); continue; }
        let stride = 0, v = pd.v;
        // the car close by: step aside (out, towards the buildings) and wait; hurry if on the road
        const near = dP < 95 && pd.state !== "cross";
        pd.aside += ((near ? 9 : 0) - pd.aside) * Math.min(1, dt * 4); if (near) nAside++;
        if (pd.state === "walk") {
          if (pd.idle > 0) { pd.idle -= dt; }
          else if (!near) {
            pd.s += v * dt * pd.dir; stride = 1;
            // a zebra crossing on this pavement: cross it now and then
            for (const c of crossPts) if (c.e === pd.w.e && Math.abs(c.s - pd.s) < v * dt * 1.5 && rng() < 0.5 && !pd.crossed) {
              const ow = ctx0._pbWalkOf.get(pd.w.e.id * 2 + (pd.w.side > 0 ? 1 : 0)); if (!ow) break;
              const a = pavePoint(pd.w, c.s, pd.lat, tA), x0 = a.x, z0 = a.z, b = pavePoint(ow, c.s, pd.lat, tA);
              pd.leg = { x0, z0, x1: b.x, z1: b.z, len: Math.hypot(b.x - x0, b.z - z0), t: 0, next: { w: ow, sd: c.s, dir: rng() < 0.5 ? 1 : -1 }, road: true }; pd.state = "kerb"; pd.wait = 0.5; pd.crossed = true; break;
            }
            if (pd.state === "walk" && (pd.s > pd.w.t1 || pd.s < pd.w.t0)) { pd.s = Math.max(pd.w.t0, Math.min(pd.w.t1, pd.s)); const pt = pavePoint(pd.w, pd.s, pd.lat, tA); pd.x = pt.x; pd.z = pt.z; atEnd(pd); }
            else if (pd.state === "walk" && rng() < dt * 0.02) pd.idle = 1.5 + rng() * 4; // window shopping
          }
          if (pd.state === "walk") { const pt = pavePoint(pd.w, pd.s, pd.lat + pd.aside, tA); const th = near ? Math.atan2(P.x - pt.x, P.z - pt.z) : Math.atan2(pt.tx * pd.dir, pt.tz * pd.dir); pd.x = pt.x; pd.z = pt.z; turn(pd, th, dt); }
        } else if (pd.state === "kerb") {
          // at the kerb: a look, then over when it is clear
          const L = pd.leg; turn(pd, Math.atan2(L.x1 - L.x0, L.z1 - L.z0), dt);
          pd.wait -= dt; if (pd.wait <= 0 && clearToCross(L, P)) pd.state = "cross";
        } else if (pd.state === "leg" || pd.state === "cross") {
          const L = pd.leg, cross = pd.state === "cross";
          if (cross) { nCross++; const dCar = Math.min(dP, ...(ctx.shared?.traffic?.cars || []).map((c) => Math.hypot(c.x - pd.x, c.z - pd.z))); if (dCar < 200) v *= 1.7; }
          L.t += v * dt; stride = v > pd.v * 1.3 ? 1.6 : 1;
          const f = Math.min(1, L.t / (L.len || 1)); pd.x = L.x0 + (L.x1 - L.x0) * f; pd.z = L.z0 + (L.z1 - L.z0) * f; turn(pd, Math.atan2(L.x1 - L.x0, L.z1 - L.z0), dt);
          if (cross) obst.push({ x: pd.x, z: pd.z });
          if (f >= 1) { const c = L.next; pd.w = c.w; pd.s = c.sd; pd.dir = c.dir; pd.state = "walk"; pd.leg = null; if (!cross) pd.crossed = false; }
        }
        if (pd.state === "walk" && pd.crossed && pd.s > pd.w.t0 + 80 && pd.s < pd.w.t1 - 80) pd.crossed = false;
        pd.phase += dt * (stride ? v * 0.62 : 0);
        pd.stride = (pd.stride || 0) + ((reduced ? stride * 0.4 : stride) - (pd.stride || 0)) * Math.min(1, dt * 8);
      }
      // ---- the bark (max one a minute; the first after ~8 s in the world)
      barkT -= dt;
      if (barkT <= 0 && (P.v ?? 0) < 90) { if (bark(P, camera)) barkT = opts.barkEvery ?? 60; else barkT = 3; }
      if (barkPed && time < barkUntil && barkPed.active) {
        const cd = camera ? camera.position.distanceTo(p.set(barkPed.x, 20, barkPed.z)) : 400, sc = Math.max(46, cd * 0.085);
        barkScale += ((reduced ? 1 : 1) - barkScale) * Math.min(1, dt * 10);
        const pop = reduced ? 1 : barkScale < 0.98 ? barkScale * 1.1 : 1; // the 10% overshoot, house motion
        bubble.visible = true; bubble.position.set(barkPed.x, gy + 22 * barkPed.size + 2, barkPed.z); bubble.scale.set(sc * 3.2 * pop, sc * pop, 1);
        bubble.material.opacity = Math.min(1, (barkUntil - time) * 3);
      } else bubble.visible = false;
      // ---- instances
      const umbOn = rain > 0.2;
      let k = 0;
      for (const pd of peds) {
        if (!pd.active) { body.setMatrixAt(pd.i, zero); umb.setMatrixAt(pd.i, zero); if (shadow) shadow.setMatrixAt(pd.i, zero); continue; }
        const hasU = umbOn && pd.umbK < 0.25 + rain * 0.7;
        q.setFromAxisAngle(up, pd.h); p.set(pd.x, gy, pd.z); s.setScalar(pd.size); m.compose(p, q, s); body.setMatrixAt(pd.i, m);
        iMisc.setXYZW(pd.i, pd.phase, pd.stride, pd.skin, hasU ? 1 : 0);
        if (hasU) { umb.setMatrixAt(pd.i, m); umb.setColorAt(pd.i, pd.umbC); } else umb.setMatrixAt(pd.i, zero);
        if (shadow) { p.set(pd.x, gy + 0.3, pd.z); s.set(hasU ? 14 : 8, 1, hasU ? 14 : 8); m.compose(p, q, s); shadow.setMatrixAt(pd.i, m); }
        k++;
      }
      body.instanceMatrix.needsUpdate = true; iMisc.needsUpdate = true; umb.instanceMatrix.needsUpdate = true; if (umb.instanceColor) umb.instanceColor.needsUpdate = true; if (shadow) shadow.instanceMatrix.needsUpdate = true;
      st.peds = k; st.crossing = nCross; st.aside = nAside;
    }
    function turn(pd, th, dt) { let d = th - pd.h; d = Math.atan2(Math.sin(d), Math.cos(d)); pd.h += d * Math.min(1, dt * 9); }
    function dispose() {
      if (!group) return;
      group.removeFromParent();
      group.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) { o.material.map?.dispose(); o.material.dispose(); } });
      if (ctx0?.shared) delete ctx0.shared.pedObstacles;
      group = null; peds = []; walks = [];
    }
    return { init, update, dispose, stats: () => ({ ...st }), get peds() { return peds; }, barkNow() { barkT = 0; } };
  };
})();
