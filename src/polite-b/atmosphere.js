// Polite City · Phase B · atmosphere.js (Iris). "Bucharest after rain", richer.
// A classic script: registers window.__politePhaseB.atmosphere(opts) -> { init(ctx), update(dt, ctx), dispose(), stats() }.
//
//  - the clock: the real Bucharest time (Intl, Europe/Bucharest) and the sun's real height over Bucharest (44.43 N,
//    26.10 E) for today's date give a slow day-to-night shift: night, blue hour, golden hour, and a "day" that stays
//    golden (plan.md: Polite City leans night and never looks flat). It publishes ctx.shared.night (0..1), .tone (sky,
//    fog, hemi, sun colours and intensities), .clock, .rain, .neonGain; with ctx.lights it also drives them itself.
//  - puddles on the asphalt (kerb-side mostly) with rain ripples and the colour of the nearest neon / sodium light in
//    them (one instanced draw; the lite path keeps a static sheen, no ripples)
//  - neon shop signs of the generic Bucharest kind (NON STOP, FARMACIE with its green cross, SHAORMA, AMANET, PÂINE
//    CALDĂ...: shop words, no brands), a couple of them failing and flickering, each throwing a coloured pool on the
//    wet road (2 draws). ctx.shared.flicker(seed, t) is exported so polite.js can flicker its own billboards the same way
//  - light fog banks drifting low through the streets and steam from kitchen vents and grates (billboards, 2 draws)
//  - lit windows that switch on and off over the evening, one by one, on the city's own buildings: a shader hook on the
//    buildings material (ctx.windowsMaterial = mats.buildings), no geometry. Its window grid matches app.js's window tile
//  - a distant thunder rumble now and then while it rains: lightning-free, a sound hook only (ctx.sfx / the radio)
(() => {
  "use strict";
  const PB = (window.__politePhaseB = window.__politePhaseB || {});
  const LAT = 44.4268, LON = 26.1025;
  const SIGNS = [
    { t: "NON STOP", c: "#FED012" }, { t: "FARMACIE", c: "#28C840", cross: true }, { t: "SHAORMA", c: "#F65342", steam: true }, { t: "PIZZA", c: "#ff9e3d", steam: true },
    { t: "CAFÉ", c: "#F2F2F2" }, { t: "BAR", c: "#B098C8" }, { t: "AMANET", c: "#119BFE" }, { t: "FLORI", c: "#f28ba8" }, { t: "PÂINE CALDĂ", c: "#ffb265", steam: true },
    { t: "HOTEL", c: "#119BFE" }, { t: "COPY CENTER", c: "#28C840" }, { t: "OPEN", c: "#F65342" }
  ];

  // ---------- time ----------
  function bucharestHours(d) {
    try { const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Bucharest", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(d); const h = +p.find((x) => x.type === "hour").value, m = +p.find((x) => x.type === "minute").value; return h + m / 60 + d.getSeconds() / 3600; }
    catch { return (d.getUTCHours() + 2 + d.getUTCMinutes() / 60) % 24; }
  }
  // the sun's elevation (degrees) over Bucharest at a UTC moment (NOAA-style approximation, good to ~0.5 deg)
  function sunElevation(d) {
    const start = Date.UTC(d.getUTCFullYear(), 0, 0), doy = (d - start) / 864e5, B = (2 * Math.PI * (doy - 81)) / 364;
    const eot = 9.87 * Math.sin(2 * B) - 7.53 * Math.cos(B) - 1.5 * Math.sin(B), decl = (23.44 * Math.PI / 180) * Math.sin((2 * Math.PI * (284 + doy)) / 365);
    const utcH = d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600, solar = utcH + LON / 15 + eot / 60, H = (15 * (solar - 12) * Math.PI) / 180, phi = (LAT * Math.PI) / 180;
    return (Math.asin(Math.sin(phi) * Math.sin(decl) + Math.cos(phi) * Math.cos(decl) * Math.cos(H)) * 180) / Math.PI;
  }
  // a moment at Bucharest local hours h on today's date (for the clock override)
  function atLocalHours(h) { const now = new Date(), off = ((bucharestHours(now) - (now.getUTCHours() + now.getUTCMinutes() / 60)) % 24 + 24 + 12) % 24 - 12; const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate(), 0, 0, 0)); return new Date(d.getTime() + (h - off) * 36e5); }
  const smooth = (a, b, x) => { const t = Math.max(0, Math.min(1, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
  // the grade keys by sun height (legal.md §5 palette at night; the day is held at golden hour)
  const KEYS = [
    { e: -12, bg: "#0d1014", fog: "#151a21", sky: "#4f6188", gnd: "#2a1d12", hi: 1.05, sun: "#a9bcff", si: 0.45, exp: 1.45 },
    { e: -5, bg: "#141c30", fog: "#1e2740", sky: "#5a70ab", gnd: "#2b2230", hi: 1.12, sun: "#9fb0ff", si: 0.5, exp: 1.4 },
    { e: 0, bg: "#3a2f4a", fog: "#4a3a4e", sky: "#c28a8a", gnd: "#2e2028", hi: 1.15, sun: "#ff9a6a", si: 0.9, exp: 1.3 },
    { e: 8, bg: "#6e4a46", fog: "#7a5548", sky: "#f2b08a", gnd: "#3a2a20", hi: 1.25, sun: "#ffb070", si: 1.3, exp: 1.2 },
    { e: 30, bg: "#8a6450", fog: "#94705a", sky: "#ffcfa4", gnd: "#4a3626", hi: 1.35, sun: "#ffc88c", si: 1.5, exp: 1.1 }
  ];
  function toneAt(e, C) {
    let i = 0; while (i < KEYS.length - 2 && e > KEYS[i + 1].e) i++;
    const a = KEYS[i], b = KEYS[i + 1], k = smooth(a.e, b.e, e), mix = (p, q) => C.copy(new C.constructor(p)).lerp(new C.constructor(q), k).getHexString();
    return { bg: "#" + mix(a.bg, b.bg), fog: "#" + mix(a.fog, b.fog), sky: "#" + mix(a.sky, b.sky), gnd: "#" + mix(a.gnd, b.gnd), hi: a.hi + (b.hi - a.hi) * k, sun: "#" + mix(a.sun, b.sun), si: a.si + (b.si - a.si) * k, exp: a.exp + (b.exp - a.exp) * k };
  }
  // how many windows are lit at Bucharest hour h: most through the evening, few after 2, a few early risers, few by day
  function windowsLit(h, night) {
    const ev = smooth(16.5, 19.5, h) * (1 - smooth(22.5, 26.5, h < 12 ? h + 24 : h));
    const morning = smooth(5, 6.5, h) * (1 - smooth(7.5, 9, h));
    return Math.max(0.08, Math.min(0.58, 0.08 + 0.5 * ev + 0.22 * morning)) * (0.35 + 0.65 * night);
  }
  // flicker: steady with a hum for most signs; a failing one drops out in short bursts
  function flicker(seed, t, failing) {
    const hum = 0.92 + 0.08 * Math.sin(t * 2.1 + seed * 13.0);
    if (!failing) return hum;
    const w = Math.sin(t * 0.9 + seed * 7.1) * Math.sin(t * 2.7 + seed), burst = w > 0.55 ? (Math.sin(t * 47 + seed) > 0 ? 1 : 0.08) : 1;
    return hum * burst;
  }

  function softTex(T, size, blobs, seed) {
    const cv = document.createElement("canvas"); cv.width = cv.height = size; const c = cv.getContext("2d");
    let a = seed; const r = () => ((a = (a * 16807) % 2147483647) / 2147483647);
    for (let i = 0; i < blobs; i++) { const x = size * (0.25 + r() * 0.5), y = size * (0.3 + r() * 0.4), rad = size * (0.15 + r() * 0.22), g = c.createRadialGradient(x, y, 0, x, y, rad); g.addColorStop(0, "rgba(255,255,255,0.22)"); g.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = g; c.fillRect(0, 0, size, size); }
    return new T.CanvasTexture(cv);
  }
  function glowTex(T) { const cv = document.createElement("canvas"); cv.width = cv.height = 64; const c = cv.getContext("2d"), g = c.createRadialGradient(32, 32, 0, 32, 32, 32); g.addColorStop(0, "rgba(255,255,255,0.8)"); g.addColorStop(0.45, "rgba(255,255,255,0.28)"); g.addColorStop(1, "rgba(255,255,255,0)"); c.fillStyle = g; c.fillRect(0, 0, 64, 64); return new T.CanvasTexture(cv); }
  function signAtlas(T) {
    const cv = document.createElement("canvas"); cv.width = 512; cv.height = 512; const c = cv.getContext("2d");
    SIGNS.forEach((s, i) => {
      const x = (i % 2) * 256, y = Math.floor(i / 2) * 80;
      c.fillStyle = "#07080b"; c.fillRect(x + 4, y + 6, 248, 68); c.strokeStyle = "#20242c"; c.lineWidth = 3; c.strokeRect(x + 5.5, y + 7.5, 245, 65);
      c.save(); c.shadowColor = s.c; c.shadowBlur = 14; c.fillStyle = s.c; c.textAlign = "center"; c.textBaseline = "middle";
      let fs = 40; c.font = `800 ${fs}px CromaticSans, "Google Sans", system-ui, sans-serif`; const room = s.cross ? 168 : 224;
      while (c.measureText(s.t).width > room && fs > 18) { fs -= 2; c.font = `800 ${fs}px CromaticSans, "Google Sans", system-ui, sans-serif`; }
      c.fillText(s.t, x + (s.cross ? 150 : 128), y + 41); c.fillText(s.t, x + (s.cross ? 150 : 128), y + 41);
      if (s.cross) { c.fillRect(x + 30, y + 34, 36, 12); c.fillRect(x + 42, y + 22, 12, 36); }
      c.restore();
    });
    const t = new T.CanvasTexture(cv); if (T.SRGBColorSpace) t.colorSpace = T.SRGBColorSpace; return t;
  }

  PB.atmosphere = function createAtmosphere(opts = {}) {
    let T, ctx0, G, group, rng, lite, gy, puddles, signs, signPools, fog, steam, winMat = null, winPrev = null, winKey = null, saved = null;
    let time = 0, toneT = 0, thunderT = 0, rainBump = 0, lastHours = 0;
    const st = { phase: "", hours: 0, sunElev: 0, night: 1, lit: 0, puddles: 0, signs: 0, fogBanks: 0, steam: 0, thunders: 0, applied: false };
    const U = { t: { value: 0 }, rain: { value: 0.7 }, neon: { value: 1 }, night: { value: 1 } };
    const WU = { pbOn: { value: 0.5 }, pbTime: { value: 0 } };
    let signList = [], fogList = [], plumes = [], m, q, p, s, C, tmpQ, flatQ;

    const cumOf = (pp) => { const c = [0]; for (let i = 1; i < pp.length; i++) c.push(c[i - 1] + Math.hypot(pp[i][0] - pp[i - 1][0], pp[i][1] - pp[i - 1][1])); return c; };
    function at(e, sd) { if (!e.cum) { e.cum = cumOf(e.pts); e.len = e.cum[e.cum.length - 1]; } const P = e.pts, Cm = e.cum; let i = 1; while (i < P.length - 1 && Cm[i] < sd) i++; const a = P[i - 1], b = P[i], L = Cm[i] - Cm[i - 1] || 1, f = Math.max(0, Math.min(1, (sd - Cm[i - 1]) / L)); return { x: a[0] + (b[0] - a[0]) * f, z: a[1] + (b[1] - a[1]) * f, tx: (b[0] - a[0]) / L, tz: (b[1] - a[1]) / L }; }
    const roads = () => G.E.filter((e) => (e.kind === "drive" || e.kind === "long") && (e.len ?? 1e9) > 120);

    function hoursNow() { const o = typeof ctx0.clockHours === "function" ? ctx0.clockHours() : null; return o != null ? o : bucharestHours(new Date()); }
    function elevNow(h) { const o = typeof ctx0.clockHours === "function" ? ctx0.clockHours() : null; return sunElevation(o != null ? atLocalHours(o) : new Date()); }

    function init(ctx) {
      ctx0 = ctx; T = ctx.T; G = ctx.graph; rng = ctx.rng || Math.random; lite = !!ctx.lite; gy = ctx.groundY ?? 1.6;
      m = new T.Matrix4(); q = new T.Quaternion(); p = new T.Vector3(); s = new T.Vector3(); C = new T.Color(); tmpQ = new T.Quaternion(); flatQ = new T.Quaternion().setFromAxisAngle(new T.Vector3(1, 0, 0), -Math.PI / 2);
      group = new T.Group(); group.name = "pb-atmosphere";
      for (const e of G.E) if (!e.cum) { e.cum = cumOf(e.pts); e.len = e.cum[e.cum.length - 1]; }
      const R = roads(), totalLen = R.reduce((a, e) => a + e.len, 0), pick = () => { let r = rng() * totalLen; for (const e of R) { r -= e.len; if (r <= 0) return e; } return R[R.length - 1]; };
      const nearNode = (x, z, d) => G.N.some((n) => n.out.length > 2 && Math.hypot(n.x - x, n.z - z) < d);
      const FP = ctx.footprints || [];
      const inB = (x, z) => { for (const f of FP) { if (Math.abs(x - f.x) > f.w + f.d || Math.abs(z - f.z) > f.w + f.d) continue; const dx = x - f.x, dz = z - f.z, c = Math.cos(f.ang || 0), sn = Math.sin(f.ang || 0), u = dx * c - dz * sn, v = dx * sn + dz * c; if (Math.abs(u) < f.w / 2 && Math.abs(v) < f.d / 2) return true; } return false; };

      // ---- neon shop signs (+ their pools on the wet road)
      const nSigns = opts.signs ?? (lite ? 6 : 16);
      for (let tries = 0; tries < 900 && signList.length < nSigns; tries++) {
        const e = pick(), sd = 60 + rng() * (e.len - 120), pt = at(e, sd), side = rng() < 0.5 ? 1 : -1;
        // on a facade: the first offset from the kerb with a building just behind it (no footprints: 24 out, on a bracket)
        let o = e.w / 2 + 24;
        if (FP.length) { o = 0; for (let oo = e.w / 2 + 20; oo < e.w / 2 + 90; oo += 6) { if (inB(pt.x - pt.tz * oo * side, pt.z + pt.tx * oo * side)) break; if (inB(pt.x - pt.tz * (oo + 8) * side, pt.z + pt.tx * (oo + 8) * side)) { o = oo + 6; break; } } if (!o) continue; }
        const x = pt.x - pt.tz * o * side, z = pt.z + pt.tx * o * side;
        if (nearNode(x, z, e.w + 30) || signList.some((q2) => Math.hypot(q2.x - x, q2.z - z) < 300)) continue;
        const k = signList.length % SIGNS.length;
        signList.push({ pd: Math.max(30, o - e.w / 2 + 10), x, z, h: Math.atan2(pt.tz * side, -pt.tx * side), nx: pt.tz * side, nz: -pt.tx * side, k, sig: SIGNS[k], failing: rng() < 0.22 || k === 0, seed: rng() * 10, y: 24 + rng() * 10 });
      }
      st.signs = signList.length;
      if (signList.length) {
        const sg = new T.PlaneGeometry(34, 10.6), uv = sg.attributes.uv;
        signs = new T.InstancedMesh(sg, new T.MeshBasicMaterial({ map: signAtlas(T), toneMapped: false, side: T.DoubleSide }), signList.length);
        // per-instance atlas cell through the uv: one geometry, the cell picked in the vertex shader
        const cell = new Float32Array(signList.length); signList.forEach((g, i) => (cell[i] = g.k)); sg.setAttribute("iCell", new T.InstancedBufferAttribute(cell, 1));
        signs.material.onBeforeCompile = (sh) => { sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nattribute float iCell;").replace("#include <uv_vertex>", "#include <uv_vertex>\n#ifdef USE_MAP\nvMapUv = vec2((mod(iCell, 2.0) + 0.008 + uv.x * 0.984) * 0.5, 1.0 - (floor(iCell / 2.0) * 80.0 + 6.0 + (1.0 - uv.y) * 68.0) / 512.0);\n#endif"); };
        signs.material.customProgramCacheKey = () => "pb-sign-1";
        signList.forEach((g, i) => { q.setFromAxisAngle(p.set(0, 1, 0), g.h); m.compose(p.set(g.x, g.y, g.z), q, s.set(1, 1, 1)); signs.setMatrixAt(i, m); signs.setColorAt(i, C.setRGB(1, 1, 1)); });
        signs.frustumCulled = false; signs.material.userData.outlineParameters = { visible: false }; group.add(signs);
        if (!lite) {
          const pg = new T.PlaneGeometry(1, 1); pg.rotateX(-Math.PI / 2);
          signPools = new T.InstancedMesh(pg, new T.MeshBasicMaterial({ map: glowTex(T), transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false }), signList.length);
          signList.forEach((g, i) => { q.setFromAxisAngle(p.set(0, 1, 0), g.h); m.compose(p.set(g.x + g.nx * g.pd, gy + 0.7, g.z + g.nz * g.pd), q, s.set(50, 1, 40)); signPools.setMatrixAt(i, m); signPools.setColorAt(i, C.set(g.sig.c)); });
          signPools.frustumCulled = false; signPools.renderOrder = 2; signPools.material.userData.outlineParameters = { visible: false }; group.add(signPools);
        }
      }

      // ---- puddles (kerb-side mostly), tinted by the nearest sign, else sodium or sky
      const nP = opts.puddles ?? (lite ? 24 : 80), pList = [];
      for (let tries = 0; tries < nP * 8 && pList.length < nP; tries++) {
        const e = pick(), sd = 30 + rng() * (e.len - 60), pt = at(e, sd), side = rng() < 0.5 ? 1 : -1, kerb = rng() < 0.75, o = kerb ? e.w / 2 - 7 - rng() * 5 : rng() * (e.w / 2 - 12);
        const x = pt.x - pt.tz * o * side, z = pt.z + pt.tx * o * side;
        if (pList.some((q2) => Math.hypot(q2.x - x, q2.z - z) < 70)) continue;
        const near = signList.reduce((b, g) => { const d = Math.hypot(g.x - x, g.z - z); return d < (b ? b.d : 220) ? { g, d } : b; }, null);
        pList.push({ x, z, h: Math.atan2(pt.tx, pt.tz), w: kerb ? 12 + rng() * 10 : 18 + rng() * 22, l: kerb ? 26 + rng() * 34 : 18 + rng() * 26, c: near ? near.g.sig.c : rng() < 0.6 ? "#ff9e3d" : "#6f86c8", k: near ? 1.2 : 0.6 });
      }
      st.puddles = pList.length;
      if (pList.length) {
        const pg = new T.PlaneGeometry(1, 1); pg.rotateX(-Math.PI / 2);
        const seed = new Float32Array(pList.length); pList.forEach((d, i) => (seed[i] = rng() * 100)); pg.setAttribute("iSeed", new T.InstancedBufferAttribute(seed, 1));
        const pm = new T.MeshBasicMaterial({ transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -6 });
        pm.onBeforeCompile = (sh) => {
          Object.assign(sh.uniforms, { pbT: U.t, pbRain: U.rain, pbNeon: U.neon, pbNight: U.night });
          sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nattribute float iSeed; varying float vSeed; varying vec2 vPUv;").replace("#include <begin_vertex>", "#include <begin_vertex>\nvSeed = iSeed; vPUv = position.xz + 0.5;");
          sh.fragmentShader = sh.fragmentShader.replace("#include <common>", `#include <common>
            uniform float pbT, pbRain, pbNeon, pbNight; varying float vSeed; varying vec2 vPUv;
            float h1(float n) { return fract(sin(n) * 43758.5453); }`)
            .replace("#include <color_fragment>", `#include <color_fragment>
              vec2 q = vPUv * 2.0 - 1.0; float an = atan(q.y, q.x);
              float edge = 0.78 + 0.12 * sin(an * 3.0 + vSeed) + 0.07 * sin(an * 5.0 + vSeed * 2.3);
              float r = length(q), shape = 1.0 - smoothstep(edge - 0.22, edge, r);
              float sheen = 0.13 + 0.12 * (1.0 - r) + 0.05 * sin(q.x * 3.0 + q.y * 2.0 + vSeed);
              float rip = 0.0;
              #ifndef PB_LITE
              for (int k = 0; k < 3; k++) {
                float fk = float(k), rate = 0.55 + 0.35 * h1(vSeed + fk * 3.1), ph = pbT * rate + h1(vSeed * 1.7 + fk), cyc = floor(ph), age = fract(ph);
                vec2 c = vec2(h1(vSeed + cyc * 1.31 + fk), h1(vSeed * 2.1 + cyc * 0.73 + fk)) * 1.0 - 0.5;
                float d = length(q - c), ring = exp(-pow((d - age * 0.7) * 30.0, 2.0)) * (1.0 - age) * (1.0 - age);
                rip += ring * step(h1(cyc + vSeed + fk * 9.0), pbRain);
              }
              #endif
              diffuseColor.rgb = (vColor * sheen * 0.6 * min(pbNeon, 1.0) * (0.35 + 0.65 * pbNight) + vec3(0.75, 0.82, 1.0) * rip * (0.12 + 0.22 * pbNight)) * shape;`);
          if (lite) sh.fragmentShader = "#define PB_LITE\n" + sh.fragmentShader;
        };
        pm.customProgramCacheKey = () => "pb-puddle-" + (lite ? 1 : 0);
        puddles = new T.InstancedMesh(pg, pm, pList.length);
        pList.forEach((d, i) => { q.setFromAxisAngle(p.set(0, 1, 0), d.h); m.compose(p.set(d.x, gy + 0.5, d.z), q, s.set(d.w, 1, d.l)); puddles.setMatrixAt(i, m); puddles.setColorAt(i, C.set(d.c).lerp(C.clone().setRGB(0.45, 0.5, 0.6), 0.3).multiplyScalar(d.k)); });
        puddles.frustumCulled = false; puddles.renderOrder = 1; puddles.material.userData.outlineParameters = { visible: false }; group.add(puddles);
      }

      // ---- fog banks and steam (camera-facing, additive; instance colour = tint x strength)
      const bb = (n, tex) => { const g = new T.PlaneGeometry(1, 1), mm = new T.InstancedMesh(g, new T.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false }), n); for (let i = 0; i < n; i++) mm.setColorAt(i, C.setRGB(0, 0, 0)); mm.frustumCulled = false; mm.renderOrder = 3; mm.material.userData.outlineParameters = { visible: false }; group.add(mm); return mm; };
      const nFog = opts.fogBanks ?? (lite ? 0 : 9);
      if (nFog) { fog = bb(nFog, softTex(T, 128, 9, 11)); for (let i = 0; i < nFog; i++) fogList.push({ x: 0, z: 0, y: 30 + rng() * 40, w: 420 + rng() * 380, hgt: 110 + rng() * 80, k: 0.5 + rng() * 0.5, life: -1 }); }
      // steam: from the kitchen signs (SHAORMA, PIZZA, PÂINE CALDĂ) and a few street grates
      const src = signList.filter((g) => g.sig.steam).map((g) => ({ x: g.x + g.nx * 6, z: g.z + g.nz * 6, y: g.y - 12 }));
      for (let tries = 0; tries < 200 && src.length < (lite ? 2 : 8); tries++) { const e = pick(), sd = 40 + rng() * (e.len - 80), pt = at(e, sd), sd2 = rng() < 0.5 ? 1 : -1, o = e.w / 2 + 8; src.push({ x: pt.x - pt.tz * o * sd2, z: pt.z + pt.tx * o * sd2, y: gy }); }
      const per = lite ? 3 : 6;
      plumes = src.slice(0, lite ? 2 : 8).map((q2) => ({ ...q2, puffs: Array.from({ length: per }, (_, j) => ({ a: j / per + rng() * 0.05 })), rate: 0.16 + rng() * 0.08 }));
      st.steam = plumes.length;
      if (plumes.length) steam = bb(plumes.length * per, softTex(T, 64, 5, 29));

      // ---- lit windows: a hook on the city's buildings material (zero geometry)
      if (ctx.windowsMaterial && opts.windows !== false) hookWindows(ctx.windowsMaterial);
      ctx.shared = ctx.shared || {};
      ctx.shared.flicker = flicker;
      ctx.scene.add(group);
      thunderT = opts.thunderFirst ?? 40 + rng() * 80;
      // remember the lights to put them back on dispose
      const L = ctx.lights; if (L && opts.apply !== false) saved = { bg: L.background?.isColor ? L.background.getHex() : null, fog: L.fog?.color.getHex(), sky: L.hemi?.color.getHex(), gnd: L.hemi?.groundColor.getHex(), hi: L.hemi?.intensity, sun: L.sun?.color.getHex(), si: L.sun?.intensity };
      tone(true);
    }

    function hookWindows(mat) {
      winMat = mat; winPrev = mat.onBeforeCompile; winKey = mat.customProgramCacheKey;
      mat.onBeforeCompile = (sh, r) => {
        winPrev?.call(mat, sh, r);
        if (!sh.fragmentShader.includes("#include <emissivemap_fragment>")) return;
        Object.assign(sh.uniforms, WU);
        sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vPbW;").replace("#include <begin_vertex>", "#include <begin_vertex>\nvPbW = (modelMatrix * vec4(transformed, 1.0)).xyz;");
        sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nuniform float pbOn, pbTime; varying vec3 vPbW;")
          // app.js's window tile: 4 x 4 panes of 40 x 46 px at 14 + 62 n in 256 px; each pane is on or off by itself
          .replace("#include <emissivemap_fragment>", `#ifdef USE_EMISSIVEMAP
            vec2 pbPx = fract(vEmissiveMapUv) * 256.0, pbCl = floor((pbPx - 14.0) / 62.0), pbLc = pbPx - 14.0 - pbCl * 62.0;
            float pbIn = step(0.0, pbCl.x) * step(pbCl.x, 3.0) * step(0.0, pbCl.y) * step(pbCl.y, 3.0) * step(pbLc.x, 40.0) * step(pbLc.y, 46.0);
            vec2 pbId = floor(vEmissiveMapUv) * 4.0 + pbCl + floor(vPbW.xz / 230.0) * vec2(17.0, 31.0) + floor(vPbW.y / 600.0);
            float pbH = fract(sin(dot(pbId, vec2(12.9898, 78.233))) * 43758.5453), pbH2 = fract(pbH * 91.7 + 0.13);
            float pbPh = floor(pbTime / (25.0 + pbH2 * 90.0) + pbH2 * 7.0);
            float pbFlip = step(0.9, fract(sin(dot(pbId + pbPh, vec2(4.1, 7.7))) * 1234.5));
            float pbLit = abs(step(pbH, pbOn) - pbFlip);
            totalEmissiveRadiance *= mix(vec3(1.0, 0.76, 0.40), vec3(1.0, 0.9, 0.7), pbH2) * pbIn * pbLit;
            #endif`);
      };
      mat.customProgramCacheKey = () => (winKey ? winKey.call(mat) : "") + "|pb-win-1";
      mat.needsUpdate = true;
    }

    function tone(force) {
      const h = hoursNow(), e = elevNow(h), night = smooth(4, -8, e);
      const T0 = toneAt(e, C);
      const phase = e < -8 ? "night" : e < -2 ? "blue hour" : e < 10 ? "golden hour" : "day (held golden)";
      Object.assign(st, { phase, hours: +h.toFixed(2), sunElev: +e.toFixed(1), night: +night.toFixed(3) });
      const sh = ctx0.shared; sh.night = night; sh.tone = T0; sh.clock = { hours: h, phase, sunElev: e };
      WU.pbOn.value = windowsLit(h, night); st.lit = +WU.pbOn.value.toFixed(2);
      const L = ctx0.lights;
      if (L && opts.apply !== false) {
        L.background?.isColor && L.background.set(T0.bg); L.fog?.color.set(T0.fog);
        if (L.hemi) { L.hemi.color.set(T0.sky); L.hemi.groundColor.set(T0.gnd); L.hemi.intensity = T0.hi; }
        if (L.sun) { L.sun.color.set(T0.sun); L.sun.intensity = T0.si; }
        st.applied = true;
      }
      ctx0.onTone?.(T0, st);
    }

    function update(dt, ctx) {
      if (!group) return;
      dt = Math.min(dt, 0.05); time += dt;
      const reduced = !!(typeof ctx.reduced === "function" ? ctx.reduced() : ctx.reduced), P = ctx.player(), cam = ctx.camera;
      toneT -= dt; if (toneT <= 0) { toneT = 1; tone(); }
      const night = ctx.shared.night ?? 1;
      rainBump = Math.max(0, rainBump - dt / 20);
      const rain = Math.min(1, (typeof ctx.rain === "function" ? ctx.rain() : opts.rain ?? 0.7) + rainBump * 0.15);
      const neon = (0.35 + 0.65 * night) * (0.6 + 0.6 * rain);
      ctx.shared.rain = rain; ctx.shared.neonGain = neon;
      U.t.value = time % 1000; U.rain.value = rain; U.neon.value = neon; U.night.value = night; WU.pbTime.value = time;
      // signs: hum and the failing ones' bursts (steady under reduced motion); dimmer by day
      if (signs) {
        const dayDim = 0.45 + 0.55 * night;
        signList.forEach((g, i) => { const f = reduced ? 1 : flicker(g.seed, time, g.failing), k = f * dayDim * 1.1; signs.setColorAt(i, C.setRGB(k, k, k)); if (signPools) signPools.setColorAt(i, C.set(g.sig.c).multiplyScalar(f * Math.min(1, neon) * 0.28)); });
        signs.instanceColor.needsUpdate = true; if (signPools) signPools.instanceColor.needsUpdate = true;
      }
      // fog banks: drift with the wind, live ~40-70 s, fade in and out, re-placed around the player
      if (cam) tmpQ.copy(cam.quaternion);
      if (fog) {
        const wind = 7;
        fogList.forEach((f, i) => {
          if (f.life < 0 || f.life > f.max) { const a = rng() * Math.PI * 2, r = 250 + rng() * 1300; f.x = P.x + Math.cos(a) * r; f.z = P.z + Math.sin(a) * r; f.life = f.life < 0 ? rng() * 40 : 0; f.max = 40 + rng() * 30; }
          f.life += dt; f.x += wind * dt; f.z -= wind * 0.4 * dt;
          const fade = Math.min(1, f.life / 8, (f.max - f.life) / 8), k = Math.max(0, fade) * f.k * (0.025 + 0.025 * night) * (0.6 + 0.6 * rain);
          m.compose(p.set(f.x, 9 + f.k * 4, f.z), flatQ, s.set(f.w, f.w * 0.45, 1)); fog.setMatrixAt(i, m); // (polite-look: a flat mist lying in the street, anchored in the world; it used to face the camera and swim)
          const tc = ctx.shared.tone ? C.set(ctx.shared.tone.fog).lerp(C.clone().setRGB(0.55, 0.6, 0.7), 0.6) : C.setRGB(0.5, 0.55, 0.65); fog.setColorAt(i, tc.multiplyScalar(k * 4));
        });
        fog.instanceMatrix.needsUpdate = true; fog.instanceColor.needsUpdate = true;
      }
      if (steam) {
        let i = 0;
        for (const pl of plumes) for (const pf of pl.puffs) {
          pf.a += dt * pl.rate * (reduced ? 0.5 : 1); if (pf.a >= 1) pf.a -= 1;
          const a = pf.a, sc = 7 + a * 26, k = Math.sin(a * Math.PI) * (0.1 + 0.06 * night);
          m.compose(p.set(pl.x + a * 22, pl.y + 6 + a * 80, pl.z - a * 9), tmpQ, s.set(sc, sc, 1)); steam.setMatrixAt(i, m); steam.setColorAt(i, C.setRGB(k * 0.9, k * 0.92, k)); i++;
        }
        steam.instanceMatrix.needsUpdate = true; steam.instanceColor.needsUpdate = true;
      }
      // thunder, far away (no lightning): a sound hook and a short swell of the rain
      thunderT -= dt;
      if (thunderT <= 0) {
        thunderT = (opts.thunderEvery ?? 70) + rng() * 130;
        if (rain > 0.4) { rumble(); rainBump = 1; }
      }
      st.fogBanks = fogList.length;
    }
    function rumble() {
      st.thunders++;
      const id = opts.thunderSfx || "sfx-thunder-far", db = -10;
      if (ctx0.sfx) ctx0.sfx(id, { db });
      else { const r = window.__politeRadio; if (r && typeof r.sfx === "function" && r.state?.().station) { try { r.sfx(id, { db }); } catch (e) {} } }
      ctx0.onThunder?.();
    }

    function dispose() {
      if (!group) return;
      group.removeFromParent();
      group.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material) { o.material.map?.dispose(); o.material.dispose(); } });
      if (winMat) { winMat.onBeforeCompile = winPrev || (() => {}); winMat.customProgramCacheKey = winKey || (() => ""); if (!winKey) delete winMat.customProgramCacheKey; winMat.needsUpdate = true; winMat = null; }
      const L = ctx0?.lights;
      if (L && saved) { if (saved.bg != null) L.background.setHex(saved.bg); L.fog?.color.setHex(saved.fog); if (L.hemi) { L.hemi.color.setHex(saved.sky); L.hemi.groundColor.setHex(saved.gnd); L.hemi.intensity = saved.hi; } if (L.sun) { L.sun.color.setHex(saved.sun); L.sun.intensity = saved.si; } }
      if (ctx0?.shared) { delete ctx0.shared.flicker; }
      group = null; signList = []; fogList = []; plumes = [];
    }
    return { init, update, dispose, stats: () => ({ ...st }), thunderNow() { thunderT = 0; }, tone: () => ctx0?.shared?.tone, get signs() { return signList; } };
  };
  PB.atmosphere.sunElevation = sunElevation; PB.atmosphere.bucharestHours = bucharestHours; PB.atmosphere.flicker = flicker;
})();
