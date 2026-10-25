// Polite City · Phase B · traffic.js (Radu). Ambient traffic on nav2's real road graph.
// A classic script (concatenated before the app like polite.js): it only registers a factory,
//   window.__politePhaseB.traffic(opts) -> { init(ctx), update(dt, ctx), dispose(), stats() }
// and src/polite.js plugs it in with registerSystem("traffic", ...) (see README.md / systems.js for ctx).
//
// What it does: 15-40 cars on desktop, 6-12 on the lite path, in their right-hand lane on the drivable roads (e.drive,
// the player's own network; the side streets and the closed avenues stay empty), one-way round the ring (counter-
// clockwise, as in Romania). They follow the car ahead, stop and give way at junctions (one car in a junction at a
// time), brake lights when they slow, headlights and a soft light pool at night, and they keep clear of the player (brake,
// wait, then pass round a stopped player when the other lane is clear). The fleet is ours, low-poly, in the site's
// flat style: a Dacia-ish 3-box sedan (the 1300's proportions, not the hero model), a yellow taxi with a generic TAXI roof
// sign, a delivery van of a fictional courier ("Scope Creep Couriers"), a city bus that pulls in at stops, and now and
// then a Polite Patrol car cruising with its coral|blue beacons (steady under reduced motion). One car in 50 carries a
// bass thump as it passes (Sorin's slot: ctx.sfx or window.__politeRadio.sfx, only once the visitor has the radio on).
// Draws: one instanced mesh per vehicle type (5), one for the blob shadows, one for the headlight pools = 7 draw calls.
(() => {
  "use strict";
  const PB = (window.__politePhaseB = window.__politePhaseB || {});

  // ---------- the fleet (model space: +z forward, y up from the road, plan units ~0.1 m) ----------
  const PAL = { ink: "#141414", glass: "#1b2733", chrome: "#9aa0a6", tyre: "#17181a", paper: "#F2F2F2", yellow: "#FED012", coral: "#F65342", blue: "#119BFE", purple: "#B098C8" };
  // Dacia-ish paints you still see parked in Bucharest: white, cream, sky blue, brick, olive, ochre, grey, navy
  const SEDAN_PAINTS = ["#ece8dc", "#e3d6b4", "#8fb3cf", "#9b3b2e", "#6b7350", "#c99a3e", "#8b9096", "#2d3f5c", "#b9c4c9", "#5d2a2a"];
  const M = { BODY: 0, PAINT: 1, TAIL: 2, HEAD: 3, BEACON_R: 4, BEACON_B: 5, SIGN: 6, AMBER: 7 };
  const ATLAS = { w: 512, h: 256, white: [2, 2, 12, 12], taxi: [0, 32, 256, 64], patrol: [0, 96, 512, 64], courier: [0, 160, 512, 64], dest: [256, 32, 256, 64] };

  function paintAtlas(cv) {
    const c = cv.getContext("2d"), F = (w, px) => `${w} ${px}px CromaticSans, "Google Sans", system-ui, sans-serif`;
    c.fillStyle = "#fff"; c.fillRect(0, 0, 32, 32);
    // TAXI (black on yellow, a generic sign: no operator, no number)
    c.fillStyle = PAL.yellow; c.fillRect(0, 32, 256, 64); c.fillStyle = PAL.ink; c.font = F(900, 46); c.textAlign = "center"; c.textBaseline = "middle"; c.fillText("TAXI", 128, 66);
    // POLITE PATROL door text (ink on paper, the beacon pill at the end)
    c.fillStyle = PAL.paper; c.fillRect(0, 96, 512, 64); c.fillStyle = PAL.ink; c.font = F(900, 38); c.textAlign = "left"; c.fillText("POLITE PATROL", 16, 129);
    const pill = (x, y) => { c.fillStyle = PAL.coral; c.beginPath(); c.arc(x + 14, y, 14, Math.PI / 2, Math.PI * 1.5); c.lineTo(x + 28, y - 14); c.lineTo(x + 28, y + 14); c.fill(); c.fillStyle = PAL.blue; c.beginPath(); c.arc(x + 42, y, 14, -Math.PI / 2, Math.PI / 2); c.lineTo(x + 28, y + 14); c.lineTo(x + 28, y - 14); c.fill(); };
    pill(420, 128);
    // Scope Creep Couriers (fictional; our own joke about our own industry)
    c.fillStyle = PAL.purple; c.fillRect(0, 160, 512, 64); c.fillStyle = PAL.ink; c.font = F(900, 30); c.fillText("SCOPE CREEP COURIERS", 14, 186); c.font = `700 15px "JetBrains Mono", ui-monospace, monospace`; c.fillText("ALWAYS A LITTLE EXTRA", 16, 211);
    // bus destination (amber LED on black)
    c.fillStyle = "#0a0a0a"; c.fillRect(256, 32, 256, 64); c.fillStyle = "#ffb43a"; c.font = `700 30px "JetBrains Mono", ui-monospace, monospace`; c.textAlign = "center"; c.fillText("9  OLARI", 384, 66);
  }

  function makeKit(T) {
    const parts = [];
    const white = (u, v) => [(ATLAS.white[0] + 6) / ATLAS.w, 1 - (ATLAS.white[1] + 6) / ATLAS.h];
    function add(geo, color, mask, rect, flipU) {
      const g = geo.index ? geo.toNonIndexed() : geo;
      const n = g.attributes.position.count, col = new Float32Array(n * 3), mk = new Float32Array(n), c = new T.Color(color);
      for (let i = 0; i < n; i++) { col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b; mk[i] = mask; }
      g.setAttribute("color", new T.BufferAttribute(col, 3)); g.setAttribute("aMask", new T.BufferAttribute(mk, 1));
      const uv = g.attributes.uv ? g.attributes.uv.array.slice() : new Float32Array(n * 2);
      for (let i = 0; i < n; i++) {
        if (rect) { let u = uv[i * 2]; if (flipU) u = 1 - u; uv[i * 2] = (rect[0] + u * rect[2]) / ATLAS.w; uv[i * 2 + 1] = 1 - (rect[1] + (1 - uv[i * 2 + 1]) * rect[3]) / ATLAS.h; }
        else { const w = white(); uv[i * 2] = w[0]; uv[i * 2 + 1] = w[1]; }
      }
      g.setAttribute("uv", new T.BufferAttribute(uv, 2));
      for (const k of Object.keys(g.attributes)) if (!["position", "normal", "uv", "color", "aMask"].includes(k)) g.deleteAttribute(k);
      parts.push(g); return g;
    }
    // a box, optionally tapered at the top (sx, sz scale the top face; dz shifts it) for cabins and windscreens
    function box(w, h, l, x, y, z, color, mask = M.BODY, taper) {
      const g = new T.BoxGeometry(w, h, l);
      if (taper) { const p = g.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) > 0) { p.setX(i, p.getX(i) * taper[0]); p.setZ(i, p.getZ(i) * taper[1] + (taper[2] || 0)); } g.computeVertexNormals(); }
      g.translate(x, y, z); return add(g, color, mask);
    }
    function wheel(r, w, x, z) { const g = new T.CylinderGeometry(r, r, w, 10); g.rotateZ(Math.PI / 2); g.translate(x, r, z); add(g, PAL.tyre, M.BODY); const h = new T.CylinderGeometry(r * 0.55, r * 0.55, w + 0.4, 8); h.rotateZ(Math.PI / 2); h.translate(x, r, z); add(h, "#6c7177", M.BODY); }
    // a flat decal from the atlas, facing +x (side = 1), -x (side = -1), +z (side = 2) or -z (side = -2)
    function decal(w, h, x, y, z, side, rect, mask = M.BODY) {
      const g = new T.PlaneGeometry(w, h);
      if (side === 1) g.rotateY(Math.PI / 2); else if (side === -1) g.rotateY(-Math.PI / 2); else if (side === -2) g.rotateY(Math.PI);
      g.translate(x, y, z); return add(g, "#ffffff", mask, rect);
    }
    function build() {
      const keys = ["position", "normal", "uv", "color", "aMask"], g = new T.BufferGeometry();
      for (const k of keys) { const it = parts[0].attributes[k].itemSize, n = parts.reduce((a, q) => a + q.attributes[k].count, 0), arr = new Float32Array(n * it); let o = 0; for (const q of parts) { arr.set(q.attributes[k].array, o); o += q.attributes[k].array.length; } g.setAttribute(k, new T.BufferAttribute(arr, it)); }
      for (const q of parts) q.dispose();
      g.computeBoundingSphere(); g.boundingSphere.radius = 1e5; // instances roam the whole map: never frustum-culled as a block
      return g;
    }
    return { box, wheel, decal, build };
  }

  // the 3-box sedan: long bonnet, upright glasshouse, a proper boot; rectangular lamps (the 1300 family's proportions)
  function sedanParts(k, kind) {
    const W = 26, L = 68;
    k.box(W, 8.5, L, 0, 8.6, 0, "#ffffff", M.PAINT);                       // the body (paint)
    k.box(W - 1, 2.2, 22, 0, 13.9, 22.5, "#ffffff", M.PAINT, [0.96, 1]);   // bonnet crown
    k.box(W - 1, 2.0, 15, 0, 13.8, -26.5, "#ffffff", M.PAINT);             // boot lid
    k.box(W - 2.5, 8.8, 31, 0, 17.6, -3.5, PAL.glass, M.BODY, [0.84, 0.66, -1]); // the glasshouse
    k.box(W - 6, 1.3, 19.5, 0, 22.5, -4.2, "#ffffff", M.PAINT);            // roof
    k.box(W + 1, 2.4, 2.2, 0, 6.2, 34.4, PAL.chrome); k.box(W + 1, 2.4, 2.2, 0, 6.2, -34.4, PAL.chrome); // bumpers
    k.box(9, 3, 0.8, 0, 10.1, 34.3, "#2a2c30");                            // grille
    for (const s of [-1, 1]) {
      k.box(6, 3, 0.9, s * 8.8, 10.1, 34.3, "#fff6d8", M.HEAD);
      k.box(6.2, 3.2, 0.9, s * 8.8, 10.4, -34.3, "#6e0d10", M.TAIL);
      k.box(1.6, 1.6, 0.9, s * 12, 7.6, 34.4, "#c77a12", M.AMBER);
      k.box(1.6, 1.6, 0.9, s * 12, 7.6, -34.4, "#c77a12", M.AMBER);
      k.box(0.6, 1.2, 2.4, s * (W / 2 + 0.3), 15.2, 9.5, PAL.ink);           // mirrors
    }
    k.box(8, 2, 0.5, 0, 6.6, 35.6, "#e9e9e2"); k.box(8, 2, 0.5, 0, 9.2, -34.9, "#e9e9e2"); // plates (blank)
    for (const sx of [-12.2, 12.2]) for (const z of [21.5, -21.5]) k.wheel(5.6, 4, sx, z);
    if (kind === "taxi") {
      k.box(W + 0.3, 1.4, 50, 0, 10.6, -2, PAL.ink);                        // a black waist band
      k.box(11, 3.6, 4.4, 0, 24.9, -5, PAL.yellow, M.SIGN);                 // roof sign
      k.decal(10.6, 3.4, 0, 24.9, -2.75, 2, ATLAS.taxi, M.SIGN); k.decal(10.6, 3.4, 0, 24.9, -7.25, -2, ATLAS.taxi, M.SIGN);
    }
    if (kind === "patrol") {
      k.box(W + 0.4, 3.2, L - 6, 0, 8.4, 0, PAL.blue);                       // the blue band
      k.decal(26, 3.25, W / 2 + 0.35, 11.6, -1, 1, ATLAS.patrol); k.decal(26, 3.25, -(W / 2 + 0.35), 11.6, -1, -1, ATLAS.patrol);
      k.box(17, 1.4, 4.6, 0, 23.6, -4.5, PAL.ink);                           // the beacon bar: coral | blue, the world's pill
      k.box(7.6, 2.4, 4.2, -4.1, 25.3, -4.5, "#ff6a5c", M.BEACON_R); k.box(7.6, 2.4, 4.2, 4.1, 25.3, -4.5, "#47b2ff", M.BEACON_B);
    }
    return { L, W };
  }
  function vanParts(k) {
    const W = 30, L = 84;
    k.box(W, 31, 62, 0, 20, -10, "#ffffff", M.PAINT);                      // cargo box
    k.box(W - 0.5, 15, 20, 0, 11.5, 31, "#ffffff", M.PAINT);               // cab, lower
    k.box(W - 1.5, 11, 18, 0, 24.5, 30, PAL.glass, M.BODY, [0.94, 0.55, -3]); // cab glass, raked
    k.box(W + 1, 3, 2.2, 0, 6, 41.6, PAL.ink); k.box(W + 1, 3, 2.2, 0, 6, -41.4, PAL.ink);
    k.decal(56, 7, W / 2 + 0.2, 23, -10, 1, ATLAS.courier); k.decal(56, 7, -(W / 2 + 0.2), 23, -10, -1, ATLAS.courier);
    k.box(W + 0.4, 1.2, 62, 0, 30.2, -10, PAL.ink);                         // roof edge line
    k.box(0.5, 26, 0.6, 0, 19, -41.3, PAL.ink);                             // rear doors' split
    for (const s of [-1, 1]) {
      k.box(5.5, 3.2, 0.9, s * 10.5, 12, 41.1, "#fff6d8", M.HEAD); k.box(3.2, 8, 0.9, s * 13, 12, -41.2, "#6e0d10", M.TAIL);
      k.box(1.8, 1.8, 0.9, s * 13.6, 8.4, 41.2, "#c77a12", M.AMBER); k.box(1.8, 1.8, 0.9, s * 13, 18, -41.2, "#c77a12", M.AMBER);
      k.box(0.8, 3, 3, s * (W / 2 + 0.6), 21, 36, PAL.ink);
    }
    for (const sx of [-13.4, 13.4]) for (const z of [28, -26]) k.wheel(6, 4.4, sx, z);
    return { L, W };
  }
  function busParts(k) {
    const W = 32, L = 172;
    k.box(W, 34, L, 0, 22, 0, "#ffffff", M.PAINT);                          // body (paper by default)
    k.box(W + 0.4, 6, L + 0.2, 0, 9, 0, PAL.blue);                          // the blue skirt
    k.box(W + 0.5, 11, L - 22, 0, 29, -6, PAL.glass);                       // window band
    k.box(W - 4, 17, 1, 0, 25.5, L / 2 + 0.3, PAL.glass);                   // windscreen
    k.decal(26, 5, 0, 35.8, L / 2 + 0.85, 2, ATLAS.dest, M.SIGN);           // destination LED
    k.box(20, 3, 44, 0, 40.5, -20, "#8f969e");                              // roof unit
    for (const s of [-1, 1]) {
      k.box(5, 3, 0.9, s * 11.5, 10, L / 2 + 0.3, "#fff6d8", M.HEAD); k.box(3.5, 9, 0.9, s * 13, 13, -L / 2 - 0.3, "#6e0d10", M.TAIL);
      k.box(2, 2, 0.9, s * 14.5, 6.5, L / 2 + 0.3, "#c77a12", M.AMBER); k.box(2, 2, 0.9, s * 14.5, 20, -L / 2 - 0.3, "#c77a12", M.AMBER);
    }
    for (const sx of [-14, 14]) for (const z of [56, -48]) k.wheel(7, 5, sx, z);
    return { L, W };
  }

  // ---------- the material: one Lambert/Standard material per type, its colours and lamps per instance ----------
  function vehicleMaterial(T, atlasTex) {
    const Mat = T.MeshLambertMaterial || T.MeshStandardMaterial;
    const m = new Mat({ vertexColors: true, map: atlasTex });
    if (m.isMeshStandardMaterial) { m.roughness = 0.45; m.metalness = 0.1; }
    m.onBeforeCompile = (sh) => {
      sh.vertexShader = sh.vertexShader
        .replace("#include <common>", "#include <common>\nattribute float aMask; attribute vec3 iPaint; attribute vec4 iLamp; varying float vMask; varying vec3 vPaint; varying vec4 vLamp;")
        .replace("#include <color_vertex>", "#include <color_vertex>\nvMask = aMask; vPaint = iPaint; vLamp = iLamp;");
      sh.fragmentShader = sh.fragmentShader
        .replace("#include <common>", "#include <common>\nvarying float vMask; varying vec3 vPaint; varying vec4 vLamp;")
        .replace("#include <color_fragment>", "#include <color_fragment>\nif (abs(vMask - 1.0) < 0.5) diffuseColor.rgb *= vPaint;")
        // vLamp: x brake (0..1), y night (0..1: heads + tails on), z red beacon / amber blink, w blue beacon
        .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
          if (abs(vMask - 2.0) < 0.5) totalEmissiveRadiance += vec3(1.0, 0.08, 0.06) * (0.55 * vLamp.y + 2.2 * vLamp.x);
          else if (abs(vMask - 3.0) < 0.5) totalEmissiveRadiance += vec3(1.0, 0.92, 0.75) * (0.12 + 1.4 * vLamp.y);
          else if (abs(vMask - 4.0) < 0.5) totalEmissiveRadiance += vec3(1.0, 0.25, 0.2) * (0.1 + 3.0 * vLamp.z);
          else if (abs(vMask - 5.0) < 0.5) totalEmissiveRadiance += vec3(0.15, 0.55, 1.0) * (0.1 + 3.0 * vLamp.w);
          else if (abs(vMask - 6.0) < 0.5) totalEmissiveRadiance += diffuseColor.rgb * (0.15 + 1.1 * vLamp.y);
          else if (abs(vMask - 7.0) < 0.5) totalEmissiveRadiance += vec3(1.0, 0.55, 0.08) * 2.4 * vLamp.z;`);
    };
    m.customProgramCacheKey = () => "pb-vehicle-1";
    m.userData.outlineParameters = { visible: false };
    return m;
  }
  function radial(T, size, stops) {
    const cv = document.createElement("canvas"); cv.width = cv.height = size; const c = cv.getContext("2d"), g = c.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
    for (const [o, col] of stops) g.addColorStop(o, col); c.fillStyle = g; c.fillRect(0, 0, size, size);
    const t = new T.CanvasTexture(cv); return t;
  }

  // ---------- road helpers (nav2's graph: E[i] = { a, b, pts, cum, len, rpts, rcum, w, kind, drive }, N[i].out = [{ e, dir }]) ----------
  const cumOf = (p) => { const c = [0]; for (let i = 1; i < p.length; i++) c.push(c[i - 1] + Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1])); return c; };
  function prep(G) { for (const e of G.E) { if (!e.cum) e.cum = cumOf(e.pts); if (e.len == null) e.len = e.cum[e.cum.length - 1]; if (!e.rpts) { e.rpts = e.pts.slice().reverse(); e.rcum = cumOf(e.rpts); } } }
  // point + unit tangent at arc s along an edge travelled in dir (+1 a->b, -1 b->a); `hint` = last segment (walks from it)
  function sample(e, dir, s, hint, out) {
    const P = dir > 0 ? e.pts : e.rpts, C = dir > 0 ? e.cum : e.rcum, n = P.length;
    let i = Math.max(1, Math.min(n - 1, hint | 0));
    while (i < n - 1 && C[i] < s) i++;
    while (i > 1 && C[i - 1] > s) i--;
    const a = P[i - 1], b = P[i], L = C[i] - C[i - 1] || 1, f = Math.max(0, Math.min(1, (s - C[i - 1]) / L));
    out.x = a[0] + (b[0] - a[0]) * f; out.z = a[1] + (b[1] - a[1]) * f; out.tx = (b[0] - a[0]) / L; out.tz = (b[1] - a[1]) / L; out.i = i;
    return out;
  }

  PB.traffic = function createTraffic(opts = {}) {
    let busEdges = [], clusters = [], T, ctx0, group, types = {}, agents = [], G, edges = [], ringC = null, nodeRes = new Map(), shadow, pools, atlasTex, rng, lite, gy;
    const st = { cars: 0, patrol: false, ms: 0, stops: 0, thumps: 0 };
    const tmpA = {}, tmpB = {}, m4 = { m: null }, q = { q: null };
    let patrolT = 0, patrolOn = false, time = 0, nightK = 1;

    function allowed(e) { return opts.edgeFilter ? opts.edgeFilter(e) : e.drive !== false && e.kind !== "minor" && (e.drive === true || opts.includeLong); }
    // the lane: the right-hand lane's centre, a quarter of the road in (a 56 road: 14 off the centre line)
    const laneOff = (e) => (e.kind === "ring" ? 0 : Math.max(13.5, Math.min(e.w / 2 - 8, e.w / 4))); // (never closer than a car width to the oncoming lane)
    // one-way round the ring: counter-clockwise seen from above (x east, z south): (p - c) x v > 0
    function ringDir(e) {
      if (e.kind !== "ring" || !ringC) return 0;
      const m = sample(e, 1, e.len / 2, 1, tmpA), px = m.x - ringC.x, pz = m.z - ringC.z;
      return pz * m.tx - px * m.tz > 0 ? 1 : -1;
    }
    const canGo = (o) => { const e = G.E[o.e]; return e.ok && (!e.oneWay || e.oneWay === o.dir); };
    const nodeDeg = (n) => G.N[n].pbDeg;

    function chooseNext(a) {
      const e = a.e, node = a.dir > 0 ? e.b : e.a, outs = G.N[node].out;
      let c = outs.filter((o) => canGo(o) && !(o.e === e.id && o.dir === -a.dir));
      if (a.kind === "bus" && e.busOk) { const cb = c.filter((o) => G.E[o.e].busOk); if (!cb.length && !e.oneWay) return { e: e.id, dir: -a.dir }; if (cb.length) c = cb; } // r304 (Ilinca): the 17 m bus keeps off the ring and its clustered junctions (the end of its roads is a terminus: it turns round)
      if (!c.length) c = outs.filter(canGo); // a dead end: turn round
      if (!c.length) return { e: e.id, dir: -a.dir };
      // a mild preference for going straight on (and buses keep to the longer roads)
      const s = sample(e, a.dir, e.len - 0.5, 1e6, tmpA), w = c.map((o) => { const f = sample(G.E[o.e], o.dir, 0.5, 1, tmpB); const d = s.tx * f.tx + s.tz * f.tz; return 0.35 + Math.max(0, d) * 1.4 + (a.kind === "bus" ? G.E[o.e].len / 2000 : 0); });
      let r = rng() * w.reduce((x, y) => x + y, 0); for (let i = 0; i < c.length; i++) { r -= w[i]; if (r <= 0) return c[i]; }
      return c[c.length - 1];
    }

    const SPEC = { sedan: { vmax: [105, 145], cap: 0 }, taxi: { vmax: [120, 160] }, van: { vmax: [95, 125] }, bus: { vmax: [80, 100] }, patrol: { vmax: [110, 130] } };
    function makeAgent(kind, slot) {
      const t = types[kind];
      return { kind, slot, L: t.L, W: t.W, e: null, dir: 1, s: 0, seg: 1, v: 0, vmax: SPEC[kind].vmax[0] + rng() * (SPEC[kind].vmax[1] - SPEC[kind].vmax[0]), next: null, prevR: null, x: 0, z: 0, h: 0, fx: 0, fz: 1,
        acc: 0, wait: 0, holds: [], ghost: 0, stuck: 0, stopFor: -1, nudge: 0, nudgeT: 0, blockedT: 0, dwell: 0, sinceStop: 600 + rng() * 900, bass: kind === "sedan" && rng() < 1 / 50, thumpT: 0, active: false, paint: null, hazard: false, beacon: rng() * 6 };
    }
    function place(a, e, dir, s) { a.e = e; a.dir = dir; a.s = s; a.seg = 1; a.next = chooseNext(a); a.prevR = null; a.v = a.vmax * 0.6; a.active = true; a.wait = 0; releaseAll(a); a.nudge = 0; pose(a, 0); }
    // a random lane point clear of other cars and of the player (min distance from the player: dmin)
    function spawn(a, dmin, dmax) {
      const p = ctx0.player();
      for (let tries = 0; tries < 60; tries++) {
        const pool = a.kind === "bus" && busEdges.length ? busEdges : edges; // (r304: the bus is placed on its own roads only)
        const e = pool[Math.floor(rng() * pool.length)]; if (e.len < a.L + 40) continue;
        const dir = e.oneWay || (rng() < 0.5 ? 1 : -1), s = a.L / 2 + 20 + rng() * (e.len - a.L - 40);
        const pt = sample(e, dir, s, 1, tmpA), o = laneOff(e), x = pt.x - pt.tz * o, z = pt.z + pt.tx * o, d = Math.hypot(x - p.x, z - p.z);
        if (d < dmin || d > dmax) continue;
        if (agents.some((b) => b !== a && b.active && Math.hypot(b.x - x, b.z - z) < (a.L + b.L) / 2 + 30)) continue;
        place(a, e, dir, s); return true;
      }
      return false;
    }

    // the car's position: its lane on its edge; near a junction the lane normal blends with the next (or previous) edge's,
    // so the lane change through the corner is continuous (no jump at the node)
    function pose(a, dt) {
      const e = a.e, pt = sample(e, a.dir, a.s, a.seg, tmpA); a.seg = pt.i;
      let rx = -pt.tz, rz = pt.tx; const o = laneOff(e) + a.nudge, B = Math.min(40, e.len / 3);
      if (a.s > e.len - B && a.next) {
        const ne = G.E[a.next.e], f = sample(ne, a.next.dir, 0.1, 1, tmpB), k = 0.5 * (1 - (e.len - a.s) / B);
        rx = rx * (1 - k) + -f.tz * k; rz = rz * (1 - k) + f.tx * k;
      } else if (a.s < B && a.prevR) {
        const k = 0.5 * (1 - a.s / B); rx = rx * (1 - k) + a.prevR[0] * k; rz = rz * (1 - k) + a.prevR[1] * k;
      }
      const l = Math.hypot(rx, rz) || 1, nx = pt.x + (rx / l) * o, nz = pt.z + (rz / l) * o;
      if (dt > 0) { const dx = nx - a.x, dz = nz - a.z, d = Math.hypot(dx, dz); if (d > 0.05) { const th = Math.atan2(dx, dz); let dh = th - a.h; dh = Math.atan2(Math.sin(dh), Math.cos(dh)); a.h += dh * Math.min(1, dt * 14); } }
      else a.h = Math.atan2(pt.tx, pt.tz);
      a.x = nx; a.z = nz; a.fx = Math.sin(a.h); a.fz = Math.cos(a.h);
    }

    function init(ctx) {
      ctx0 = ctx; T = ctx.T; G = ctx.graph; rng = ctx.rng || Math.random; lite = !!ctx.lite; gy = ctx.groundY ?? 1.6;
      prep(G);
      const ring = G.E.filter((e) => e.kind === "ring");
      if (ring.length) { let x = 0, z = 0, n = 0; for (const e of ring) for (const p of e.pts) { x += p[0]; z += p[1]; n++; } ringC = { x: x / n, z: z / n }; }
      for (const e of G.E) { e.ok = allowed(e); e.oneWay = ringDir(e); }
      edges = G.E.filter((e) => e.ok);
      for (const n of G.N) { n.pbDeg = n.out.filter((o) => G.E[o.e].ok).length; n.pbR = Math.max(24, ...n.out.map((o) => G.E[o.e].w / 2 + 8)); }
      // junction clusters: nodes joined by short edges (a wide crossing drawn as two or three nodes) are reserved as one
      { const par = G.N.map((_, i) => i), f = (i) => { while (par[i] !== i) i = par[i] = par[par[i]]; return i; };
        for (const e of G.E) if (e.ok && e.kind !== "ring" && e.len < 130) par[f(e.a)] = f(e.b);
        const by = new Map(); G.N.forEach((n, i) => { const r = f(i); if (!by.has(r)) by.set(r, []); by.get(r).push(n); });
        clusters = []; for (const list of by.values()) { const c = { id: clusters.length, x: 0, z: 0, r: 0, n: list.length }; for (const n of list) { c.x += n.x / list.length; c.z += n.z / list.length; } for (const n of list) { c.r = Math.max(c.r, Math.hypot(n.x - c.x, n.z - c.z) + n.pbR); n.pbC = c.id; } clusters.push(c); } }
      // r304 (Ilinca, the known knot): the bus kept off the ring and off the junctions near it that are drawn as several
      // nodes (clustered), where its 17 m overlapped the cars waiting there. Its roads: drive edges, not the ring, whose two
      // ends are neither a clustered junction within BUS_NEAR of the ring nor any junction within the ring's own radius + 260
      { let ringR = 0; if (ringC) { let n = 0; for (const e of G.E) if (e.kind === "ring") for (const p of e.pts) { ringR += Math.hypot(p[0] - ringC.x, p[1] - ringC.z); n++; } ringR /= n || 1; }
        const BUS_NEAR = opts.busNear ?? 900;
        const badNode = (i) => { if (!ringC) return false; const n = G.N[i], d = Math.hypot(n.x - ringC.x, n.z - ringC.z), c = clusters[n.pbC]; return d < ringR + 260 || (c && c.n > 1 && d < ringR + BUS_NEAR); };
        for (const e of G.E) e.busOk = e.ok && e.kind !== "ring" && !badNode(e.a) && !badNode(e.b);
        busEdges = G.E.filter((e) => e.busOk && e.len > 120); st.busEdges = busEdges.length; }
      group = new T.Group(); group.name = "pb-traffic";
      const cv = document.createElement("canvas"); cv.width = ATLAS.w; cv.height = ATLAS.h; paintAtlas(cv);
      atlasTex = new T.CanvasTexture(cv); if (T.SRGBColorSpace) atlasTex.colorSpace = T.SRGBColorSpace;
      // density from the network: one car per ~1.4k units of lane (both ways) on desktop, half that on the lite path
      const laneLen = edges.reduce((a2, e) => a2 + e.len * (e.oneWay ? 1 : 2), 0);
      const total = Math.max(lite ? 6 : 15, Math.min(lite ? 12 : 40, Math.round(opts.count ?? laneLen / (lite ? 2600 : 1400))));
      const nBus = lite || laneLen < 40000 ? 1 : 2, nVan = lite ? 1 : laneLen < 40000 ? 2 : 3, nTaxi = Math.round(total * 0.2), nSedan = Math.max(1, total - nBus - nVan - nTaxi - 1);
      const plan = { sedan: nSedan, taxi: nTaxi, van: nVan, bus: nBus, patrol: 1 };
      const builders = { sedan: (k) => sedanParts(k, "sedan"), taxi: (k) => sedanParts(k, "taxi"), patrol: (k) => sedanParts(k, "patrol"), van: vanParts, bus: busParts };
      const mat = vehicleMaterial(T, atlasTex);
      for (const kind of Object.keys(plan)) {
        const k = makeKit(T), dim = builders[kind](k), geo = k.build(), n = plan[kind];
        const paint = new Float32Array(n * 3), lamp = new Float32Array(n * 4);
        geo.setAttribute("iPaint", new T.InstancedBufferAttribute(paint, 3)); geo.setAttribute("iLamp", new T.InstancedBufferAttribute(lamp, 4));
        const mesh = new T.InstancedMesh(geo, mat, n); mesh.frustumCulled = false; mesh.name = "pb-" + kind;
        types[kind] = { mesh, paint: geo.attributes.iPaint, lamp: geo.attributes.iLamp, L: dim.L, W: dim.W, n };
        group.add(mesh);
        for (let i = 0; i < n; i++) {
          const a = makeAgent(kind, i);
          const col = new T.Color(kind === "sedan" ? SEDAN_PAINTS[Math.floor(rng() * SEDAN_PAINTS.length)] : kind === "taxi" ? PAL.yellow : kind === "van" ? PAL.purple : PAL.paper);
          paint.set([col.r, col.g, col.b], i * 3);
          a.uid = agents.length; agents.push(a);
        }
      }
      // blob shadows (all vehicles, one draw) and the headlight pools (desktop, at night, one draw)
      const flat = () => { const g = new T.PlaneGeometry(1, 1); g.rotateX(-Math.PI / 2); return g; };
      const nAll = agents.length;
      const shTex = radial(T, 64, [[0, "rgba(0,0,0,0.75)"], [0.55, "rgba(0,0,0,0.45)"], [1, "rgba(0,0,0,0)"]]);
      shadow = new T.InstancedMesh(flat(), new T.MeshBasicMaterial({ map: shTex, transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -4 }), nAll);
      shadow.frustumCulled = false; shadow.renderOrder = 1; shadow.material.userData.outlineParameters = { visible: false }; group.add(shadow);
      if (!lite) {
        const plTex = radial(T, 128, [[0, "rgba(255,206,140,0.42)"], [0.4, "rgba(255,190,115,0.16)"], [1, "rgba(255,185,105,0)"]]);
        pools = new T.InstancedMesh(flat(), new T.MeshBasicMaterial({ map: plTex, transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false }), nAll);
        pools.frustumCulled = false; pools.renderOrder = 2; pools.material.userData.outlineParameters = { visible: false }; group.add(pools);
      }
      ctx.scene.add(group);
      // spread the fleet over the network (the patrol waits for its turn)
      for (const a of agents) if (a.kind !== "patrol") spawn(a, 260, 1e9);
      patrolT = opts.patrolFirst ?? 6 + rng() * 10;
      m4.m = new T.Matrix4(); q.q = new T.Quaternion(); m4.p = new T.Vector3(); m4.s = new T.Vector3(1, 1, 1); m4.up = new T.Vector3(0, 1, 0); m4.zero = new T.Matrix4().makeScale(0, 0, 0);
      ctx.shared = ctx.shared || {};
      ctx.shared.traffic = { cars: [] };
    }

    // a junction is one car at a time: reserve on entry, release once clear of it
    function reserve(node, id, now) { const r = nodeRes.get(node); if (!r || r.id === id || now - r.t > 5) { nodeRes.set(node, { id, t: now }); return true; } return false; }
    function release(node, id) { const r = nodeRes.get(node); if (r && r.id === id) nodeRes.delete(node); }
    function releaseAll(a) { for (const n of a.holds) release(n, a); a.holds.length = 0; }
    // a car keeps a junction until it is clear of it (by position: a cluster of short edges can hold two at once)
    function releasePassed(a) {
      for (let i = a.holds.length - 1; i >= 0; i--) { const c = clusters[a.holds[i]], dx = c.x - a.x, dz = c.z - a.z;
        if (Math.hypot(dx, dz) > c.r + a.L / 2 + 4 && dx * a.fx + dz * a.fz < 0) { release(c.id, a); a.holds.splice(i, 1); if (a.stopFor === c.id) a.stopFor = -1; } }
    }

    // room on the far side? (don't enter a junction you can't leave: no gridlock from spillback)
    function exitClear(a) {
      const n = a.next; if (!n) return true;
      for (const b of agents) if (b !== a && b.active && b.e && b.e.id === n.e && b.dir === n.dir && b.s < a.L + b.L / 2 + 26 && b.v < 25) return false;
      return true;
    }
    // someone in the junction who holds no reservation (a car on the ring leaving it, one squeezing on): wait for them
    function nodeBusy(n, a) { const nd = G.N[n]; for (const b of agents) if (b !== a && b.active && !b.holds.length && Math.hypot(b.x - nd.x, b.z - nd.z) < nd.pbR + b.L / 2) return true; return false; }
    // r304 (Ilinca): the last word before moving. The rules above can let two cars into the same few metres (two clusters
    // that touch at the ring's mouths, a car squeezing on, cross traffic that does not hold the junction); then both drove
    // into each other until the 9 s untangling. Now a car whose nose would touch another car in the next moment stops;
    // if the two would touch each other (side by side, a corner), the one with the lower number goes first and the other
    // waits. Head-on pairs both wait (the old untangling still frees them). ~n² box tests on nearby cars only
    const obb = (a, adv, out) => { const c = Math.cos(a.h), s = Math.sin(a.h); out.x = a.x + s * adv; out.z = a.z + c * adv; out.ax0 = s; out.ax1 = c; out.ay0 = c; out.ay1 = -s; out.hl = a.L / 2; out.hw = a.W / 2 * 0.9; return out; };
    const prj = (O, x, z) => Math.abs(O.ax0 * x + O.ax1 * z) * O.hl + Math.abs(O.ay0 * x + O.ay1 * z) * O.hw;
    const sepAx = (A, B, x, z) => Math.abs((B.x - A.x) * x + (B.z - A.z) * z) > prj(A, x, z) + prj(B, x, z);
    const hitAB = (A, B) => !(sepAx(A, B, A.ax0, A.ax1) || sepAx(A, B, A.ay0, A.ay1) || sepAx(A, B, B.ax0, B.ax1) || sepAx(A, B, B.ay0, B.ay1));
    const _fa = {}, _fb = {}, _ta = {}, _tb = {};
    const tangled = (a, b) => { const dx = b.x - a.x, dz = b.z - a.z; return dx * dx + dz * dz < ((a.L + b.L) / 2) ** 2 && hitAB(obb(a, 0, _ta), obb(b, 0, _tb)); };
    function frontHit(a, act) {
      const adv = 6 + a.v * 0.35; obb(a, adv, _fa);
      for (const b of act) {
        if (b === a) continue;
        const dx = b.x - a.x, dz = b.z - a.z; if (dx * dx + dz * dz > (a.L + b.L + adv + 10) ** 2) continue;
        if (dx * a.fx + dz * a.fz <= 0) continue; // (only what is in front of me)
        if (a.ghost > 0 && tangled(a, b)) continue;
        if (hitAB(_fa, obb(b, 0, _fb))) return b;
      }
      return null;
    }
    function sfxPass(a, d) {
      const id = opts.bassSfx || "sfx-bass-pass", db = -6 - Math.min(14, d / 20);
      if (ctx0.sfx) { ctx0.sfx(id, { db }); st.thumps++; return; }
      const r = window.__politeRadio; // only with the radio on: the visitor chose sound (radio.js also keeps the site's mute)
      if (r && typeof r.sfx === "function" && r.state?.().station) { try { r.sfx(id, { db }); st.thumps++; } catch (e) {} }
    }

    function update(dt, ctx) {
      if (!group) return;
      const t0 = performance.now();
      dt = Math.min(dt, 0.05); time += dt;
      const P = ctx.player(), reduced = !!(typeof ctx.reduced === "function" ? ctx.reduced() : ctx.reduced);
      nightK = ctx.shared?.night ?? (typeof ctx.night === "function" ? ctx.night() : 1);
      const copBusy = !!ctx.copBusy?.();
      // the Patrol: now and then one car cruises the network for a minute or two, then goes off duty out of sight
      patrolT -= dt;
      const pa = agents.find((a) => a.kind === "patrol");
      if (!patrolOn && patrolT <= 0 && !copBusy) { if (spawn(pa, 700, 2200) || spawn(pa, 400, 1e9)) { patrolOn = true; patrolT = 70 + rng() * 70; } else patrolT = 5; }
      if (patrolOn && ((patrolT <= 0 && Math.hypot(pa.x - P.x, pa.z - P.z) > 900) || copBusy)) { patrolOn = false; pa.active = false; patrolT = 50 + rng() * 120; releaseAll(pa); }
      const act = agents.filter((a) => a.active);
      const peds = ctx.shared?.pedObstacles || [];
      for (const a of act) {
        // ---- what is ahead in my lane: cars, the player, people on a crossing
        let gap = 1e9, gapV = 0, block = null;
        const look = 120 + a.v * 1.6, curving = a.e.kind === "ring" || a.s < 60 || a.e.len - a.s < 60; // (on a curve the car ahead sits off my axis)
        for (const b of act) {
          if (b === a || (a.ghost > 0 && tangled(a, b))) continue; // (r304: a ghost passes only the car it is knotted with)
          // cross traffic counts only while it is actually in the junction (not waiting at its line)
          const dx = b.x - a.x, dz = b.z - a.z, al = dx * a.fx + dz * a.fz;
          const dot = b.fx * a.fx + b.fz * a.fz;
          if (dot < 0.3 && !b.holds.length && (dot < -0.3 || Math.hypot(dx, dz) > (a.L + b.L) / 2 + 6)) continue;
          if (al <= 0 || al > look + b.L) continue;
          const lat = Math.abs(dx * a.fz - dz * a.fx);
          if (lat > (a.W + b.W) / 2 - 2 + (curving ? 12 : 0)) continue;
          const g = al - (a.L + b.L) / 2;
          if (g < gap) { gap = g; gapV = b.v * (b.fx * a.fx + b.fz * a.fz); block = b; }
        }
        { const dx = P.x - a.x, dz = P.z - a.z, al = dx * a.fx + dz * a.fz, lat = Math.abs(dx * a.fz - dz * a.fx);
          if (al > 0 && al < look + 125 && lat < (a.W + 27) / 2 + 4) { /* r304: the player keeps ~55 more units behind it: the Street camera rides there, and a car stopped inside it filled the screen */ const g = al - (a.L + 69) / 2 - 55; if (g < gap) { gap = g; gapV = 0; block = "player"; } }
          // the player coming straight at me in my lane: slow right down and tuck in to the kerb
          a.dodge = al > 0 && al < 260 && lat < 30 && (P.v || 0) > 20 && Math.cos(P.h - a.h) < -0.7;
        }
        for (const p of peds) { const dx = p.x - a.x, dz = p.z - a.z, al = dx * a.fx + dz * a.fz; if (al > 0 && al < look && Math.abs(dx * a.fz - dz * a.fx) < a.W / 2 + 10) { const g = al - a.L / 2 - 8; if (g < gap) { gap = g; gapV = 0; block = "ped"; } } }

        // ---- the junction ahead: stop (a stop line for crossroads off the ring), then go when it is free
        const e = a.e, toEnd = e.len - a.s, endNode = a.dir > 0 ? e.b : e.a, deg = nodeDeg(endNode);
        const nodeR = Math.max(26, e.w / 2 + 8) + a.L / 2 + (a.next && G.E[a.next.e].kind === "ring" && e.kind !== "ring" ? 16 : 0);
        let vCap = a.vmax;
        const onRing = e.kind === "ring", enteringRing = !onRing && a.next && G.E[a.next.e].kind === "ring";
        const cl = G.N[endNode].pbC;
        if (deg >= 3 && !a.holds.includes(cl) && !onRing) {
          const stopAt = toEnd - nodeR;
          if (stopAt < 10 + a.v * 0.35) {
            if (enteringRing) {
              // give way to the ring: wait while a car on it is close to this entry
              const nd = G.N[endNode], busy = act.some((b) => b !== a && b.e.kind === "ring" && Math.hypot(b.x - nd.x, b.z - nd.z) < 95 + b.L / 2);
              if (busy) vCap = Math.min(vCap, Math.max(0, stopAt) * 2.2);
            } else if (a.stopFor !== cl && e.len > 170) {
              // a crossroads: stop at the line, then go when the junction is free
              if (a.v < 6) { a.wait += dt; if (a.wait > 0.5 + (a.slot % 3) * 0.3) { a.stopFor = cl; a.wait = 0; st.stops++; } }
              vCap = Math.min(vCap, Math.max(0, stopAt) * 2.2);
            } else if (exitClear(a) && !nodeBusy(endNode, a) && reserve(cl, a, time)) a.holds.push(cl);
            else vCap = Math.min(vCap, Math.max(0, stopAt) * 2.2);
          } else if (stopAt < 160) vCap = Math.min(vCap, (enteringRing ? 55 : 40) + stopAt * 0.9); // slow for the junction
        }
        // corner speed: tighter turns, slower
        if (a.next && toEnd < 90) { const f = sample(G.E[a.next.e], a.next.dir, 0.5, 1, tmpB), s = sample(e, a.dir, e.len - 0.5, 1e6, tmpA), d = s.tx * f.tx + s.tz * f.tz; if (d < 0.7) vCap = Math.min(vCap, 55 + 60 * Math.max(0, d)); }
        // ---- the bus calls at a stop now and then; the van double-parks with its hazards on
        if ((a.kind === "bus" || a.kind === "van") && a.dwell <= 0) { a.sinceStop -= a.v * dt; if (a.sinceStop < 0 && a.s > 150 && toEnd > 200 && e.kind !== "ring") { a.dwell = a.kind === "bus" ? 4 + rng() * 2 : 7 + rng() * 6; a.hazard = true; } }
        if (a.dwell > 0) { vCap = 0; if (a.v < 3) { a.dwell -= dt; if (a.dwell <= 0) { a.hazard = false; a.sinceStop = (a.kind === "bus" ? 1400 : 3000) + rng() * 1500; } } }
        a.parked = a.dwell > 0 && a.v < 3;
        // ---- following: aim for a speed that keeps a safe gap (2 s at speed, 14 units standing)
        const safe = 14 + a.v * 0.55;
        if (gap < 1e8) vCap = Math.min(vCap, Math.max(0, gapV + (gap - safe) * 1.6));
        if (a.dodge) vCap = Math.min(vCap, 25);
        // ---- passing a stopped player / a parked van or bus when the other lane is clear (after waiting a moment)
        const blockedByParked = (block === "player" && (P.v || 0) < 8) || (block && block.parked);
        a.blockedT = blockedByParked && gap < 60 ? a.blockedT + dt : Math.max(0, a.blockedT - dt * 2);
        // r304: a player who stays parked across the road: after 4 s with no way past, a two-way road's car turns round
        if (block === "player" && a.blockedT > 4 && !(a.kerbT > 0) && !a.passObj && !e.oneWay && e.kind !== "ring" && a.s > 50 && toEnd > 50 && a.v < 3) {
          const back = !act.some((b) => b !== a && Math.hypot(b.x - a.x, b.z - a.z) < a.L + b.L + 60 && !(b.e === e && b.dir === a.dir && (b.x - a.x) * a.fx + (b.z - a.z) * a.fz > 0)); // (nobody near but the queue ahead of me in my own lane: the other lane is where I turn into)
          if (back) { releaseAll(a); a.dir = -a.dir; a.s = e.len - a.s; a.seg = 1; a.next = chooseNext(a); a.prevR = null; a.blockedT = 0; a.stuck = 0; a.nudge = 0; st.uturns = (st.uturns || 0) + 1; }
        }
        let wantNudge = a.dodge ? 7 : 0;
        // r304 (Ilinca): a player standing on the centre line blocks both lanes, so nobody could pass in the other lane and
        // both queues stacked up for good. If the player is to my left and there is room at my kerb, I squeeze past on the
        // right, slowly (half a car onto the kerb at most)
        if (block === "player" && (P.v || 0) < 8 && gap < 90 && e.kind !== "ring") {
          const rightLat = -((P.x - a.x) * a.fz - (P.z - a.z) * a.fx), need = a.W / 2 + 27 / 2 + 5 + rightLat;
          const room = e.w / 2 - laneOff(e) + a.W / 2 - 4;
          if (rightLat < 0 && need > 0 && need < room) { wantNudge = need; a.kerbT = 1.2; }
        }
        if (a.kerbT > 0 && !(wantNudge > 0)) { a.kerbT -= dt; const al = (P.x - a.x) * a.fx + (P.z - a.z) * a.fz; if (al > -((a.L + 69) / 2 + 8)) wantNudge = Math.max(wantNudge, a.W / 2 + 27 / 2 + 5 - (((P.x - a.x) * a.fz - (P.z - a.z) * a.fx))); else a.kerbT = 0; }
        if (a.blockedT > 1.6 && e.kind !== "ring" && toEnd > 260 && !a.passObj) {
          const clear = !act.some((b) => b !== a && Math.hypot(b.x - a.x, b.z - a.z) < 420 && b.fx * a.fx + b.fz * a.fz < -0.5);
          // r304: past a player only if the other lane really clears them (a player on the centre line is passed at the kerb, see above)
          const shift = laneOff(e) * 2 + 2, pr = block === "player" ? -((P.x - a.x) * a.fz - (P.z - a.z) * a.fx) + shift : 1e9;
          if (clear && Math.abs(pr) > (a.W + 27) / 2 + 3) { wantNudge = -shift; a.nudgeT = 2.2; a.passObj = block; }
        }
        // keep out in the other lane until the thing being passed is behind
        if (a.passObj) { const o = a.passObj === "player" ? { x: P.x, z: P.z, L: 69 } : a.passObj, al = (o.x - a.x) * a.fx + (o.z - a.z) * a.fz;
          if (al > -((a.L + o.L) / 2 + 12)) a.nudgeT = Math.max(a.nudgeT, 0.4); else a.passObj = null; }
        if (a.nudgeT > 0) { a.nudgeT -= dt; wantNudge = -(laneOff(e) * 2 + 2); if (block === "player" || (block && block.parked)) vCap = Math.min(a.vmax * 0.5, 60); else vCap = Math.min(vCap, 70); }
        if (a.nudgeT > 0 && (block === "player" || (block && block.parked))) vCap = Math.max(vCap, 35); // (squeeze past: the lateral offset clears it)
        if (a.kerbT > 0 && (block === "player" || !block || gap > 40)) { const latNow = Math.abs((P.x - a.x) * a.fz - (P.z - a.z) * a.fx); vCap = latNow > (a.W + 27) / 2 + 2 ? Math.max(Math.min(vCap, 30), 22) : Math.min(vCap, 4); } // (r304: the kerb squeeze: edge out, then crawl past once clear)
        a.nudge += (wantNudge - a.nudge) * Math.min(1, dt * 2.5);
        // ---- r304: nothing in front of my nose (see frontHit)
        if (vCap > 0) { const h = frontHit(a, act);
          // (a car waiting at its line for me to clear the ring or the junction I hold is passed close by: a tight probe,
          // so its corner does not stop me in the junction and leave us both waiting for each other)
          const prio = a.holds.length > 0 || a.e.kind === "ring", waits = h && h.v < 3 && !h.holds.length && h.e.kind !== "ring";
          if (h && prio && waits && !hitAB(obb(a, 1.5, _fa), (() => { const o = obb(h, 0, _fb); o.hw *= 0.8; o.hl *= 0.95; return o; })())) { /* room enough: go */ }
          else if (h) { const headOn = h.fx * a.fx + h.fz * a.fz < -0.5, mutual = !headOn && frontHit(h, act) === a;
            if (!(mutual && a.uid < h.uid)) vCap = 0; } }
        // ---- integrate
        const accel = vCap > a.v ? Math.min(55, (vCap - a.v) * 2) : Math.max(-320, (vCap - a.v) * 4.5);
        a.acc = accel; a.v = Math.max(0, a.v + accel * dt);
        a.s += a.v * dt;
        while (a.s >= a.e.len) {
          a.s -= a.e.len;
          const prev = sample(a.e, a.dir, a.e.len - 0.1, 1e6, tmpA); a.prevR = [-prev.tz, prev.tx];
          const nx = a.next || chooseNext(a);
          a.e = G.E[nx.e]; a.dir = nx.dir; a.seg = 1; a.next = chooseNext(a);
        }
        // release the junction once the car is clear of it
        if (a.stopFor >= 0 && !a.holds.length && G.N[a.dir > 0 ? a.e.b : a.e.a].pbC !== a.stopFor) a.stopFor = -1;
        pose(a, dt);
        if (a.holds.length) releasePassed(a);
        // stuck for long (a knot the rules can't untie): far from the player it is quietly re-placed; near, it squeezes on
        a.stuck = a.v < 2 && !a.parked ? (a.stuck || 0) + dt : 0;
        if (a.ghost > 0) a.ghost -= dt;
        if (a.stuck > 9) { a.stuck = 0; st.unstuck = (st.unstuck || 0) + 1;
          if (Math.hypot(a.x - P.x, a.z - P.z) > 600 && a.kind !== "patrol") { releaseAll(a); spawn(a, 700, 1e9); }
          else if ((a.stuckN = (a.stuckN || 0) + 1) >= 2) { a.stuckN = 0; a.ghost = 2.5; a.stopFor = G.N[a.dir > 0 ? a.e.b : a.e.a].pbC; } }
        // recycle: a car far from the player comes back somewhere nearer (out of the camera's way)
        const dP = Math.hypot(a.x - P.x, a.z - P.z), far = lite ? 1900 : 2800;
        if (dP > far && a.kind !== "patrol" && rng() < 0.02) { releaseAll(a); spawn(a, 900, far * 0.9); }
        // the bass thump: one car in 50, once per pass, when it comes within ~16 m of the player
        if (a.bass) { a.thumpT -= dt; if (dP < 170 && a.thumpT <= 0) { a.thumpT = 25; sfxPass(a, dP); } }
      }
      // ---- write instances
      const { m, p, s, up, zero } = { m: m4.m, p: m4.p, s: m4.s, up: m4.up, zero: m4.zero };
      const pulse = Math.floor(time * 5.2) % 2, blink = Math.floor(time * 2.6) % 2;
      let k = 0;
      for (const kind in types) { const t = types[kind]; for (let i = 0; i < t.n; i++) t.mesh.setMatrixAt(i, zero); }
      const cars = ctx.shared.traffic.cars; cars.length = 0;
      for (const a of agents) {
        const t = types[a.kind];
        if (!a.active) continue;
        q.q.setFromAxisAngle(up, a.h); p.set(a.x, gy, a.z); m.compose(p, q.q, s); t.mesh.setMatrixAt(a.slot, m);
        const brake = a.acc < -25 || (a.v < 2 && (a.wait > 0 || a.parked)) ? 1 : 0;
        let z = 0, w = 0;
        if (a.kind === "patrol") { if (reduced) { z = w = 0.45; } else { z = pulse ? 1 : 0.05; w = pulse ? 0.05 : 1; } }
        else if (a.hazard) z = reduced ? 0.6 : blink;
        t.lamp.setXYZW(a.slot, brake, nightK, z, w);
        // shadow + pool
        p.set(a.x, gy + 0.35, a.z); s.set(a.W * 1.35, 1, a.L * 1.12); m.compose(p, q.q, s); shadow.setMatrixAt(k, m);
        if (pools) { if (nightK > 0.15) { p.set(a.x + a.fx * (a.L / 2 + 38), gy + 0.6, a.z + a.fz * (a.L / 2 + 38)); s.set(a.W * 1.2, 1, 80); /* (polite-look: a shorter, dimmer throw) */ pools.setMatrixAt(k, m.compose(p, q.q, s)); } else pools.setMatrixAt(k, zero); }
        s.set(1, 1, 1);
        cars.push({ x: a.x, z: a.z, vx: a.fx * a.v, vz: a.fz * a.v, L: a.L, W: a.W, kind: a.kind });
        k++;
      }
      for (let i = k; i < shadow.count; i++) { shadow.setMatrixAt(i, zero); if (pools) pools.setMatrixAt(i, zero); }
      for (const kind in types) { const t = types[kind]; t.mesh.instanceMatrix.needsUpdate = true; t.lamp.needsUpdate = true; }
      shadow.instanceMatrix.needsUpdate = true; if (pools) { pools.instanceMatrix.needsUpdate = true; pools.visible = nightK > 0.15; pools.material.opacity = Math.min(1, nightK) * 0.55; }
      st.cars = k; st.patrol = patrolOn; st.ms = performance.now() - t0;
    }

    function dispose() {
      if (!group) return;
      group.removeFromParent();
      group.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) { o.material.map?.dispose(); o.material.dispose(); } });
      atlasTex?.dispose();
      if (ctx0?.shared) delete ctx0.shared.traffic;
      group = null; agents = []; types = {}; nodeRes.clear();
    }
    return { init, update, dispose, stats: () => ({ uturns: st.uturns || 0, busEdges: st.busEdges, cars: st.cars, patrol: st.patrol, stops: st.stops, thumps: st.thumps, unstuck: st.unstuck || 0 }), get agents() { return agents; }, forcePatrol() { patrolT = 0; } };
  };
})();
