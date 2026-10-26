// Polite City (polite-city branch; working name, Daniel decides phase 0): the after-dark twin of Cromatic City, opened by
// URL only for now (?world=polite; "gta2" is an alias for the stories pipeline). An open-world night genre piece where
// everything is polite: the Patrol compliments you, the ads sell our own industry's habits back to it.
// refs: cromatic-ops/refs/gta-world (plan.md: phases 1-4 + 7, the "fast legit-vibe cut"; legal.md is binding: no names,
// screens, words, type or art of the game the genre comes from; our own type, colours, glyphs and copy throughout).
//
// What lives here (app.js hands over what it needs: window.czPolite(app), and calls frame() before it draws):
//  1. the dressing, made once the map and nav2's road graph exist: sodium street lamps along the drivable roads, the
//     wet-asphalt reflections (one instanced draw: each light leaves a pool on the road that stretches into a streak
//     towards the camera as it gets lower, broken by rain ripples), manhole steam, the neon billboards of fictional
//     brands (one atlas, merged into three draws), two LED tickers (a news ticker that reports your session, the Brand
//     Index), the Final_FINAL_v7 sign. Phones and small machines get the lite path (fewer lamps, pools only, less steam)
//  2. the HUD (only here): the radar (our rounded-square frame, our blips), the real Bucharest clock, ₡ credits (the
//     XP you already have), Heat (Cromatic's four-point star, 0-3, from nav2's Polite Patrol), the pager (2M2F's own
//     5x7 pixel letters), the big-moment cards ("Pulled over · Fined: one compliment.")
//  3. the arrival (r303): the loading card (panels of the world rendered live from it, painted by a small ink + posterize
//     pass, the name in the Cromatic display type, set italic and tight, with the beacon pill), then the camera drops
//     from high over the car through the rain onto the street, then the HUD fades in and the pager buzzes "Welcome to
//     Polite City". Under 3 s, skippable (a tap, a click or a key), still with reduced motion (the card, then the HUD)
//  4. the codes (typed on a keyboard): KERNING, BIGGERLOGO, POLITE
//  5. the radio slot: window.__politeRadio (Sorin's stations plug in here; nothing plays by default)
//  6. the systems hook (r303, for phase B: traffic and vehicles, pedestrians and atmosphere): api.registerSystem(name,
//     { init(ctx), update(dt, now, ctx), dispose() }), or window.czPoliteSystems.push({ name, init, update, dispose })
//     before the world exists. ctx.lite is the phone / small-machine path; each system gets its own group under the
//     dressing (hidden with it). See refs/gta-world/build/build-notes.md
(() => {
  "use strict";
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const PAL = { asphalt: "#14171b", wet: "#232a33", sodium: "#ff9e3d", yellow: "#FED012", coral: "#F65342", blue: "#119BFE", green: "#28C840", paper: "#F2F2F2", ink: "#141414", purple: "#B098C8" };
  // our own fictional brands, about our own industry (no real company, no parody of a real brand: legal.md §2)
  const BRANDS = [
    { id: "final", name: "Final_FINAL_v7", sub: "PRINT SHOP · OPEN LATE", bg: "#141414", fg: "#FED012", neon: "#FED012", style: "mono" },
    { id: "index", name: "Brand Index", sub: "UP. DOWN. MOSTLY SIDEWAYS.", bg: "#119BFE", fg: "#F2F2F2", neon: "#119BFE", style: "big" },
    { id: "repaint", name: "Repaint & Rebrand", sub: "NEW IDENTITY, SAME DRIVER", bg: "#F65342", fg: "#141414", neon: "#F65342", style: "big" },
    { id: "kern", name: "Kern & Sons", sub: "FAMILY SPACING SINCE 1957", bg: "#F2F2F2", fg: "#141414", neon: "#F2F2F2", style: "serif" },
    { id: "deadline", name: "Deadline Energy", sub: "TASTES LIKE FRIDAY 17:59", bg: "#28C840", fg: "#141414", neon: "#28C840", style: "big" },
    { id: "moodboard", name: "Moodboard Mattresses", sub: "SLEEP ON IT. THEN PIN IT.", bg: "#B098C8", fg: "#141414", neon: "#B098C8", style: "big" },
    { id: "brief", name: "Brief Burger", sub: "ONE PAGE. NO SCOPE CREEP.", bg: "#FED012", fg: "#141414", neon: "#FED012", style: "big" },
    { id: "pitch", name: "Pitch Deck Motors", sub: "0-100 SLIDES IN 4 SECONDS", bg: "#141414", fg: "#F2F2F2", neon: "#F65342", style: "big" },
    { id: "synergy", name: "Synergy Water", sub: "NOW WITH MORE ALIGNMENT", bg: "#e8f6ff", fg: "#119BFE", neon: "#119BFE", style: "big" },
    { id: "olari", name: "Lie low with a flat white", sub: "OLARI 9 · THE KETTLE IS ON", bg: "#F2F2F2", fg: "#141414", neon: "#FED012", style: "big" },
    { id: "polite", name: "Please drive nicely", sub: "A MESSAGE FROM THE POLITE PATROL", bg: "#141414", fg: "#F2F2F2", neon: "#119BFE", style: "beacon" },
    { id: "kerning", name: "K E R N I N G", sub: "IT MATTERS. ASK ANYONE.", bg: "#FED012", fg: "#141414", neon: "#FED012", style: "big" }
  ];
  // the 2M2F game's 5x7 pixel letters (src/minigame.js: ours), the pager's face
  const GLYPHS = {
    A: ".###.|#...#|#...#|#####|#...#|#...#|#...#", B: "####.|#...#|#...#|####.|#...#|#...#|####.", C: ".###.|#...#|#....|#....|#....|#...#|.###.",
    D: "####.|#...#|#...#|#...#|#...#|#...#|####.", E: "#####|#....|#....|####.|#....|#....|#####", F: "#####|#....|#....|####.|#....|#....|#....",
    G: ".###.|#...#|#....|#.###|#...#|#...#|.####", H: "#...#|#...#|#...#|#####|#...#|#...#|#...#", I: "###|.#.|.#.|.#.|.#.|.#.|###",
    J: "..###|...#.|...#.|...#.|#..#.|#..#.|.##..", K: "#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#", L: "#....|#....|#....|#....|#....|#....|#####",
    M: "#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#", N: "#...#|##..#|#.#.#|#..##|#...#|#...#|#...#", O: ".###.|#...#|#...#|#...#|#...#|#...#|.###.",
    P: "####.|#...#|#...#|####.|#....|#....|#....", Q: ".###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#", R: "####.|#...#|#...#|####.|#.#..|#..#.|#...#",
    S: ".####|#....|#....|.###.|....#|....#|####.", T: "#####|..#..|..#..|..#..|..#..|..#..|..#..", U: "#...#|#...#|#...#|#...#|#...#|#...#|.###.",
    V: "#...#|#...#|#...#|#...#|#...#|.#.#.|..#..", W: "#...#|#...#|#...#|#.#.#|#.#.#|##.##|#...#", X: "#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#",
    Y: "#...#|#...#|.#.#.|..#..|..#..|..#..|..#..", Z: "#####|....#|...#.|..#..|.#...|#....|#####",
    0: ".###.|#...#|#..##|#.#.#|##..#|#...#|.###.", 1: ".#.|##.|.#.|.#.|.#.|.#.|###", 2: ".###.|#...#|....#|...#.|..#..|.#...|#####",
    3: "####.|....#|....#|.###.|....#|....#|####.", 4: "...#.|..##.|.#.#.|#..#.|#####|...#.|...#.", 5: "#####|#....|####.|....#|....#|#...#|.###.",
    6: ".###.|#....|#....|####.|#...#|#...#|.###.", 7: "#####|....#|...#.|..#..|.#...|.#...|.#...", 8: ".###.|#...#|#...#|.###.|#...#|#...#|.###.",
    9: ".###.|#...#|#...#|.####|....#|....#|.###.",
    ".": ".|.|.|.|.|.|#", ",": ".|.|.|.|.|#|#", "!": "#|#|#|#|#|.|#", "?": ".###.|#...#|....#|...#.|..#..|.....|..#..",
    ":": ".|.|#|.|.|#|.", "-": "...|...|...|###|...|...|...", "'": "#|#|.|.|.|.|.", "/": "....#|...#.|...#.|..#..|.#...|.#...|#....",
    "&": ".##..|#..#.|#.#..|.#...|#.#.#|#..#.|.##.#", "_": ".....|.....|.....|.....|.....|.....|#####", " ": "...|...|...|...|...|...|...", "*": ".|.|.|#|.|.|."
  };
  const GL = {};
  for (const [k, v] of Object.entries(GLYPHS)) { const rows = v.split("|"); GL[k] = { w: Math.max(...rows.map((r) => r.length)), rows }; }
  const glyph = (ch) => GL[ch] || GL[ch.toUpperCase()] || GL["?"];
  function pixelText(ctx, s, x, y, sc, col) {
    ctx.fillStyle = col;
    for (const ch of s) { const g = glyph(ch); g.rows.forEach((r, j) => { for (let i = 0; i < r.length; i++) if (r[i] === "#") ctx.fillRect(x + i * sc, y + j * sc, sc, sc); }); x += (g.w + 1) * sc; }
    return x;
  }
  const pixelW = (s, sc) => { let w = 0; for (const ch of s) w += (glyph(ch).w + 1) * sc; return w - sc; };
  // Cromatic's four-point star (the HUD's Heat, the brand mark), as an SVG path in a 24 box
  const STAR4 = "M12 1.5c.9 5.6 4.9 9.6 10.5 10.5-5.6.9-9.6 4.9-10.5 10.5C11.1 16.9 7.1 12.9 1.5 12 7.1 11.1 11.1 7.1 12 1.5z";

  // the radio: Sorin's player (site/polite-radio/radio.js -> /assets/polite-radio/, window.__politeRadio: play, next, stop,
  // setVolume, sfx, ambience, duck, state, onchange). Sound is off by default: radio.js is only laid in once the world is
  // on (it fetches and plays nothing by itself), and nothing plays until the visitor taps the radio pill. It keeps the
  // site's mute ("cz-sound" off: the pill says so and the radio stops), ducks under a card, stops when you leave the world
  const RADIO_BASE = "/assets/polite-radio/";
  const radioApi = () => (window.__politeRadio && typeof window.__politeRadio.play === "function" ? window.__politeRadio : null);
  let radioLoading = false;
  function radioLoad(onReady) {
    if (radioApi()) { onReady?.(radioApi()); return; }
    if (radioLoading) return; radioLoading = true;
    const sc = document.createElement("script"); sc.src = RADIO_BASE + "radio.js"; sc.async = true; sc.setAttribute("data-base", RADIO_BASE);
    sc.onload = () => onReady?.(radioApi()); sc.onerror = () => { radioLoading = false; };
    document.head.appendChild(sc);
  }
  const muted = () => { try { return localStorage.getItem("cz-sound") === "off"; } catch { return false; } };
  const radio = { on: false, idx: -1, emit() {} }; // (the HUD's own state; emit kept as a no-op hook for later events)

  window.czPolite = function (A) {
    const T = A.T;
    const api = { on: false, built: false, heat: 0 };
    const low = !!A.lowEnd();
    let group = null, streak = null, steam = null, boards = null, tickers = [], finalSign = null, hud = null, card = null;
    const session = { visits: new Set(), stops: 0, codes: 0, km: 0, lastCar: null, t0: performance.now() };

    // ===================== 1. the dressing =====================
    const footprints = () => A.footprints() || [];
    function inBuilding(x, z, pad) {
      for (const f of footprints()) {
        const dx = x - f.x, dz = z - f.z;
        if (Math.abs(dx) > f.w + f.d + pad && Math.abs(dz) > f.w + f.d + pad) continue;
        const c = Math.cos(f.ang || 0), s = Math.sin(f.ang || 0), u = dx * c - dz * s, v = dx * s + dz * c;
        if (Math.abs(u) < f.w / 2 + pad && Math.abs(v) < f.d / 2 + pad) return true;
      }
      return false;
    }
    // points along the drivable roads, every `step`, alternating sides: { x, z, nx, nz (out of the road), tx, tz, w, e }
    function roadside(step, off, maxN, filter) {
      const G = A.nav2()?.graph; if (!G) return [];
      const out = []; let side = 1;
      for (const e of G.E.concat(extraEdges())) {
        if (!filter(e)) continue;
        for (let s = step * 0.5; s < e.len - 30; s += step) {
          let i = 1; while (i < e.cum.length - 1 && e.cum[i] < s) i++;
          const a = e.pts[i - 1], b = e.pts[i], f = (s - e.cum[i - 1]) / ((e.cum[i] - e.cum[i - 1]) || 1);
          const x = a[0] + (b[0] - a[0]) * f, z = a[1] + (b[1] - a[1]) * f, l = Math.hypot(b[0] - a[0], b[1] - a[1]) || 1, tx = (b[0] - a[0]) / l, tz = (b[1] - a[1]) / l;
          side = -side;
          const nx = -tz * side, nz = tx * side, o = e.w / 2 + off;
          out.push({ x: x + nx * o, z: z + nz * o, rx: x, rz: z, nx, nz, tx, tz, w: e.w, e: e.id });
        }
      }
      // every few: a phone keeps fewer
      return out.length > maxN ? out.filter((_, i) => i % Math.ceil(out.length / maxN) === 0) : out;
    }
    // the start road runs south of the part of the city nav2's graph covers (z < 2380): its edges are added here
    let XE = null;
    function extraEdges() {
      if (XE) return XE; XE = [];
      for (const pts0 of A.roads?.() || []) {
        const pts = pts0.filter((p) => p[1] < 2420); if (pts.length < 2) continue;
        const cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
        XE.push({ id: -1, pts, cum, len: cum[cum.length - 1], w: 56, kind: "drive", drive: true });
      }
      return XE;
    }
    function farFrom(list, x, z, d) { for (const p of list) if ((p.x - x) ** 2 + (p.z - z) ** 2 < d * d) return false; return true; }
    function placesNear(x, z, d) { for (const p of A.places() || []) { const px = p.px ?? p.x, pz = p.pz ?? p.z; if (px != null && (px - x) ** 2 + (pz - z) ** 2 < d * d) return true; } return false; }

    // a tiny merge of non-indexed geometries with the same attributes (position, normal, uv, and colour or centre)
    function merge(list) {
      const keys = Object.keys(list[0].attributes), g = new T.BufferGeometry();
      for (const k of keys) {
        const it = list[0].attributes[k].itemSize, n = list.reduce((a, q) => a + q.attributes[k].count, 0), arr = new Float32Array(n * it);
        let o = 0; for (const q of list) { arr.set(q.attributes[k].array, o); o += q.attributes[k].array.length; }
        g.setAttribute(k, new T.BufferAttribute(arr, it));
      }
      return g;
    }
    function prep(geo, m, color, center) {
      const g = geo.index ? geo.toNonIndexed() : geo.clone();
      g.applyMatrix4(m);
      if (color) { const c = new T.Color(color), n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = c.r; a[i * 3 + 1] = c.g; a[i * 3 + 2] = c.b; } g.setAttribute("color", new T.BufferAttribute(a, 3)); }
      if (center) { const n = g.attributes.position.count, a = new Float32Array(n * 3); for (let i = 0; i < n; i++) { a[i * 3] = center.x; a[i * 3 + 1] = center.y; a[i * 3 + 2] = center.z; } g.setAttribute("ctr", new T.BufferAttribute(a, 3)); }
      for (const k of Object.keys(g.attributes)) if (!["position", "normal", "uv", "color", "ctr"].includes(k)) g.deleteAttribute(k);
      return g;
    }

    // the wet road (polite-look, Daniel: "not under the lamps, far too big"): every light leaves two things on the asphalt,
    // both small and soft. (1) a diffuse pool right under it: round, a few metres, what lights a wet road from above.
    // (2) its mirror image: where the light's reflection meets the road for this eye, the point on the line from the lamp's
    // foot towards the camera at h / (h + H) of the way (h the light's height, H the camera's): under the lamp from high
    // up, further out as the camera comes down. It stretches along that axis as the view grazes (the wet road's
    // roughness), never longer than a lane, and fades near the viewer's feet so nothing chases the camera. One
    // instanced quad per pool and per mirror image, additive; the city's fog fades them with the rest
    const STREAK_VS = `
      #include <common>
      attribute vec4 iP; attribute vec3 iC; attribute vec2 iH;
      uniform vec3 camW;
      varying vec2 vUv; varying vec3 vC; varying float vSeed; varying float vFog; varying float vLen; varying float vKind;
      uniform float fogNear, fogFar;
      void main() {
        vec2 b = cityWarp(iP.xy);
        vec3 w = vec3(b.x, 3.2, b.y); // over the road decals and their markings
        vec3 toC = camW - w;
        float H = max(toC.y, 4.0), hl = iH.x, D = length(toC.xz);
        vec2 d2 = toC.xz / max(D, 1e-3);
        float len, wid, fade = 1.0;
        if (iH.y < 0.5) { // the pool under the light
          len = wid = iP.z * 2.0; d2 = vec2(0.0, 1.0);
        } else {          // the mirror image
          w.xz += d2 * D * hl / (hl + H);
          float graze = clamp(D / H, 0.0, 6.0);
          wid = iP.z * 0.5;
          len = min(wid * (1.4 + 1.6 * graze), 150.0);
          fade = smoothstep(60.0, 180.0, length(camW.xz - w.xz)) * smoothstep(0.15, 0.9, graze + 0.25);
        }
        vec2 side = vec2(d2.y, -d2.x);
        w.xz += side * position.x * wid + d2 * position.y * len;
        vUv = position.xy + 0.5; vC = iC * fade; vSeed = iP.w; vLen = len; vKind = iH.y;
        vec4 mv = viewMatrix * vec4(w, 1.0);
        vFog = smoothstep(fogNear, fogFar, -mv.z);
        gl_Position = projectionMatrix * mv;
      }`;
    const STREAK_FS = `
      uniform float t, amp, rip;
      varying vec2 vUv; varying vec3 vC; varying float vSeed; varying float vFog; varying float vLen; varying float vKind;
      void main() {
        vec2 q = vUv - 0.5; float a;
        if (vKind < 0.5) {
          float r2 = dot(q, q) * 4.0; a = exp(-r2 * 3.0) * (1.0 - smoothstep(0.7, 1.0, r2)) * 0.32;
        } else {
          float across = exp(-q.x * q.x * 22.0), along = exp(-q.y * q.y * 9.0) * (1.0 - smoothstep(0.42, 0.5, abs(q.y)));
          // rain on it: soft bands that drift along the image and break it up a little
          float r = 0.8 + 0.2 * sin(q.y * vLen * 0.3 + t * 3.1 + vSeed * 17.0) * sin(q.y * vLen * 0.09 - t * 1.7 + vSeed * 5.0);
          a = across * along * mix(1.0, r, rip) * 0.55;
        }
        gl_FragColor = vec4(vC * a * amp * (1.0 - vFog), 1.0);
      }`;
    // sources: { x, z, r (pool radius), h (the light's height), c, k, spec (a mirror image too) }
    function buildStreaks(sources) {
      const list = []; for (const s of sources) { list.push([s, 0]); if (s.spec !== false) list.push([s, 1]); }
      const n = list.length, geo = new T.PlaneGeometry(1, 1);
      const g = new T.InstancedMesh(geo, null, n);
      const P = new Float32Array(n * 4), C = new Float32Array(n * 3), Hh = new Float32Array(n * 2);
      list.forEach(([s, kind], i) => { P.set([s.x, s.z, s.r, Math.random()], i * 4); const c = new T.Color(s.c).multiplyScalar((s.k || 1) * (kind ? 1 : 0.8)); C.set([c.r, c.g, c.b], i * 3); Hh.set([s.h || 40, kind], i * 2); });
      g.geometry.setAttribute("iP", new T.InstancedBufferAttribute(P, 4));
      g.geometry.setAttribute("iC", new T.InstancedBufferAttribute(C, 3));
      g.geometry.setAttribute("iH", new T.InstancedBufferAttribute(Hh, 2));
      g.material = new T.ShaderMaterial({
        uniforms: { camW: { value: new T.Vector3() }, t: { value: 0 }, amp: { value: 1 }, rip: { value: low ? 0 : 1 }, fogNear: { value: 900 }, fogFar: { value: 4800 } },
        vertexShader: STREAK_VS, fragmentShader: STREAK_FS, transparent: true, depthWrite: false, blending: T.AdditiveBlending, toneMapped: false, side: T.DoubleSide
      });
      g.material.userData.outlineParameters = { visible: false };
      g.frustumCulled = false; g.renderOrder = 5;
      return g;
    }
    // steam from the manholes: a few soft puffs per vent, rising and fading, camera-facing (billboarded in the shader)
    const STEAM_VS = `
      #include <common>
      attribute vec4 iP;
      uniform float t;
      varying vec2 vUv; varying float vA;
      void main() {
        float age = fract(t * (0.16 + 0.05 * fract(iP.w * 7.3)) + iP.w);
        vec2 b = cityWarp(iP.xy);
        vec3 c = vec3(b.x + sin(age * 3.0 + iP.w * 6.0) * 7.0 + age * 16.0, 2.0 + age * 66.0, b.y + cos(age * 2.0 + iP.w) * 5.0);
        float sz = iP.z * (0.45 + age * 1.6);
        vec3 r = vec3(viewMatrix[0][0], viewMatrix[1][0], viewMatrix[2][0]), u = vec3(viewMatrix[0][1], viewMatrix[1][1], viewMatrix[2][1]);
        vec3 w = c + (r * position.x + u * position.y) * sz;
        vUv = position.xy + 0.5; vA = sin(age * 3.14159) * (1.0 - age * 0.4);
        gl_Position = projectionMatrix * viewMatrix * vec4(w, 1.0);
      }`;
    const STEAM_FS = `
      uniform vec3 col; uniform float amp;
      varying vec2 vUv; varying float vA;
      void main() { vec2 q = vUv - 0.5; float d = dot(q, q) * 4.0; float a = exp(-d * 3.6) * vA * 0.17 * amp; gl_FragColor = vec4(col, a); }`; // (polite-look: a breath of steam, not a white blob)
    function buildSteam(vents) {
      const per = low ? 3 : 6, n = vents.length * per, geo = new T.PlaneGeometry(1, 1);
      const g = new T.InstancedMesh(geo, null, n), P = new Float32Array(n * 4);
      vents.forEach((v, i) => { for (let j = 0; j < per; j++) P.set([v.x, v.z, 18 + Math.random() * 9, (j + Math.random() * 0.5) / per], (i * per + j) * 4); });
      g.geometry.setAttribute("iP", new T.InstancedBufferAttribute(P, 4));
      g.material = new T.ShaderMaterial({ uniforms: { t: { value: 0 }, col: { value: new T.Color("#8f9399") }, amp: { value: 1 } }, vertexShader: STEAM_VS, fragmentShader: STEAM_FS, transparent: true, depthWrite: false, toneMapped: false, side: T.DoubleSide });
      g.material.userData.outlineParameters = { visible: false };
      g.frustumCulled = false; g.renderOrder = 6;
      return g;
    }
    // a billboard's face, painted on its slot of the atlas (512 x 256)
    function paintBoard(ctx, b, x, y, W, H, alt) {
      ctx.save(); ctx.translate(x, y);
      ctx.fillStyle = b.bg; ctx.fillRect(0, 0, W, H);
      ctx.strokeStyle = PAL.ink; ctx.lineWidth = 14; ctx.strokeRect(7, 7, W - 14, H - 14);
      const name = alt || b.name;
      ctx.fillStyle = b.fg; ctx.textBaseline = "alphabetic";
      if (b.style === "mono") {
        ctx.font = `700 ${name.length > 14 ? 52 : 58}px "JetBrains Mono", ui-monospace, monospace`;
        ctx.fillText(name, 34, 132);
        ctx.fillStyle = b.fg; ctx.fillRect(34, 150, W - 68, 6);
      } else if (b.style === "serif") {
        ctx.font = `italic 700 64px Georgia, "Times New Roman", serif`; ctx.fillText(name, 34, 130);
      } else {
        // the Cromatic display type for loud moments: heavy, tight, set italic (legal.md §5); fitted to the slot
        let fs = 74; ctx.font = `900 ${fs}px CromaticSans, "Google Sans", system-ui, sans-serif`;
        while (ctx.measureText(name).width > W - 80 && fs > 30) { fs -= 2; ctx.font = `900 ${fs}px CromaticSans, "Google Sans", system-ui, sans-serif`; }
        ctx.save(); ctx.translate(34, 136); ctx.transform(1, 0, -0.14, 1, 0, 0); ctx.fillText(name, 0, 0); ctx.restore();
      }
      if (b.style === "beacon") { ctx.fillStyle = PAL.coral; roundRect(ctx, W - 150, 26, 54, 34, 17); ctx.fill(); ctx.fillStyle = PAL.blue; roundRect(ctx, W - 96, 26, 54, 34, 17); ctx.fill(); ctx.strokeStyle = PAL.paper; ctx.lineWidth = 3; roundRect(ctx, W - 150, 26, 108, 34, 17); ctx.stroke(); }
      ctx.font = `700 22px "JetBrains Mono", ui-monospace, monospace`; ctx.fillStyle = b.fg; ctx.globalAlpha = 0.86;
      ctx.fillText(b.sub, 36, H - 44);
      ctx.restore();
    }
    function roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.arcTo(x + w, y, x + w, y + h, r); ctx.arcTo(x + w, y + h, x, y + h, r); ctx.arcTo(x, y + h, x, y, r); ctx.arcTo(x, y, x + w, y, r); ctx.closePath(); }
    function makeAtlas() {
      const cv = document.createElement("canvas"); cv.width = 2048; cv.height = 1024;
      const ctx = cv.getContext("2d");
      BRANDS.forEach((b, i) => paintBoard(ctx, b, (i % 4) * 512, Math.floor(i / 4) * 256, 512, 256));
      const tex = new T.CanvasTexture(cv); tex.colorSpace = T.SRGBColorSpace; tex.anisotropy = 4;
      return { cv, ctx, tex };
    }
    const BOARD_VS = `
      #include <common>
      attribute vec3 ctr; uniform float big;
      varying vec2 vUv;
      void main() { vUv = uv; vec3 p = ctr + (position - ctr) * big; vec4 w = modelMatrix * vec4(p, 1.0); w.xz = cityWarp(w.xz); gl_Position = projectionMatrix * viewMatrix * w; }`;
    const BOARD_FS = `
      uniform sampler2D map; uniform float gain;
      varying vec2 vUv;
      void main() { vec4 c = texture2D(map, vUv); gl_FragColor = vec4(c.rgb * gain, 1.0);
        #include <colorspace_fragment>
      }`;
    function buildBoards(spots) {
      const atlas = makeAtlas();
      const faces = [], frames = [], neon = [], m = new T.Matrix4(), q = new T.Quaternion(), e = new T.Euler(0, 0, 0, "YXZ"), S = new T.Vector3(1, 1, 1);
      const BW = 92, BH = 46, LEG = 46, TILT = -0.62; // the board leans back like an easel, so the top-down camera reads it too
      const plane = new T.PlaneGeometry(BW, BH), back = new T.BoxGeometry(BW + 6, BH + 6, 3), leg = new T.BoxGeometry(3.2, LEG + 8, 3.2), rimH = new T.BoxGeometry(BW + 9, 2.2, 2.2), rimV = new T.BoxGeometry(2.2, BH + 9, 2.2);
      const list = [];
      spots.forEach((s, i) => {
        const b = BRANDS[i % BRANDS.length];
        // an A-frame: two faces back to back, each leaning back, their tops meeting: one reads from the road's each way,
        // and from above (the map, the Top-down) whichever way the camera turns
        const yaw = Math.atan2(-s.nx, -s.nz), off = (BH / 2) * Math.sin(-TILT), cy = LEG + (BH / 2) * Math.cos(TILT);
        const slot = BRANDS.indexOf(b), u0 = (slot % 4) / 4, v0 = 1 - (Math.floor(slot / 4) + 1) / 4, isFinal = b.id === "final" && !finalSign, ff = [];
        for (const side of [0, Math.PI]) {
          const ys = yaw + side, ctr = new T.Vector3(s.x + Math.sin(ys) * off, cy, s.z + Math.cos(ys) * off);
          e.set(TILT, ys, 0); q.setFromEuler(e); m.compose(ctr, q, S);
          const f = prep(plane, new T.Matrix4().makeTranslation(0, 0, 1.8).premultiply(m), null, ctr);
          if (isFinal) ff.push(f); else { const uv = f.attributes.uv; for (let k = 0; k < uv.count; k++) uv.setXY(k, u0 + uv.getX(k) / 4, v0 + uv.getY(k) / 4); faces.push(f); }
          frames.push(prep(back, m, "#16181c"));
          for (const [g, y, x] of [[rimH, BH / 2 + 3.5, 0], [rimH, -BH / 2 - 3.5, 0], [rimV, 0, BW / 2 + 3.5], [rimV, 0, -BW / 2 - 3.5]]) neon.push(prep(g, new T.Matrix4().makeTranslation(x, y, 2.4).premultiply(m), b.neon));
        }
        if (isFinal) finalSign = { x: s.x, z: s.z, geo: merge(ff), passes: 0, near: false, state: "v7" }; // its own texture (plain uvs)
        for (const sx of [-BW * 0.36, BW * 0.36]) frames.push(prep(leg, new T.Matrix4().compose(new T.Vector3(s.x + Math.cos(yaw) * sx, (LEG + 8) / 2, s.z - Math.sin(yaw) * sx), new T.Quaternion().setFromAxisAngle(new T.Vector3(0, 1, 0), yaw), S), "#1e2127"));
        list.push({ x: s.x, z: s.z, rx: s.rx, rz: s.rz, b, i });
      });
      const faceMat = new T.ShaderMaterial({ uniforms: { map: { value: atlas.tex }, big: { value: 1 }, gain: { value: 1.12 } }, vertexShader: BOARD_VS, fragmentShader: BOARD_FS, side: T.DoubleSide, toneMapped: false });
      const g = new T.Group();
      if (faces.length) g.add(new T.Mesh(merge(faces), faceMat));
      const fr = new T.Mesh(merge(frames), new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.8, metalness: 0.2 }));
      fr.castShadow = false; g.add(fr);
      const ne = new T.Mesh(merge(neon), new T.MeshBasicMaterial({ vertexColors: true, toneMapped: false }));
      ne.material.color.setScalar(1.6); g.add(ne);
      if (finalSign) {
        // its own canvas (the v8 flicker swaps it without re-uploading the whole atlas)
        const cv = document.createElement("canvas"); cv.width = 512; cv.height = 256; const ctx = cv.getContext("2d");
        paintBoard(ctx, BRANDS[0], 0, 0, 512, 256);
        const tex = new T.CanvasTexture(cv); tex.colorSpace = T.SRGBColorSpace;
        const mat = new T.ShaderMaterial({ uniforms: { map: { value: tex }, big: faceMat.uniforms.big, gain: { value: 1.15 } }, vertexShader: BOARD_VS, fragmentShader: BOARD_FS, side: T.DoubleSide, toneMapped: false });
        finalSign.mesh = new T.Mesh(finalSign.geo, mat); finalSign.cv = cv; finalSign.ctx = ctx; finalSign.tex = tex;
        g.add(finalSign.mesh);
      }
      for (const o of g.children) { o.frustumCulled = false; if (o.material) o.material.userData.outlineParameters = { visible: false }; }
      return { group: g, list, faceMat, atlas };
    }
    // an LED ticker: a long strip on its own gantry over a road, its text scrolled by the texture's offset
    function buildTicker(s, kind) {
      const cv = document.createElement("canvas"); cv.width = 2048; cv.height = 64;
      const tex = new T.CanvasTexture(cv); tex.colorSpace = T.SRGBColorSpace; tex.wrapS = T.RepeatWrapping; tex.repeat.set(0.5, 1);
      const W = 150, H = 13, yaw = Math.atan2(-s.nx, -s.nz) * 0.6, y = 30; // (towards the map's camera, like the boards)
      const g = new T.Group();
      const strip = new T.Mesh(new T.PlaneGeometry(W, H), new T.MeshBasicMaterial({ map: tex, toneMapped: false, side: T.DoubleSide }));
      strip.material.color.setScalar(1.35);
      const box = new T.Mesh(new T.BoxGeometry(W + 4, H + 4, 3), new T.MeshStandardMaterial({ color: "#121418", roughness: 0.7 }));
      strip.position.z = 1.7;
      const legs = [-W * 0.42, W * 0.42].map((x) => { const l = new T.Mesh(new T.BoxGeometry(2.6, y, 2.6), box.material); l.position.set(x, -y / 2, 0); return l; });
      const head = new T.Group(); head.add(box, strip, ...legs); head.position.set(0, y, 0);
      g.add(head); g.position.set(s.x, 0, s.z); g.rotation.y = yaw;
      for (const o of [strip, box, ...legs]) { o.frustumCulled = false; o.material.userData.outlineParameters = { visible: false }; }
      return { g, cv, ctx: cv.getContext("2d"), tex, kind, text: "", x: s.x, z: s.z, rx: s.rx, rz: s.rz, c: kind === "news" ? PAL.yellow : PAL.green };
    }
    function paintTicker(tk, text) {
      if (tk.text === text) return; tk.text = text;
      const { ctx, cv } = tk;
      ctx.fillStyle = "#06070a"; ctx.fillRect(0, 0, cv.width, cv.height);
      // LED dots: the text in the 2M2F pixel letters at 6 px a dot, then a dot screen over it
      const sc = 6, w = pixelW(text, sc), reps = Math.max(1, Math.floor(cv.width / (w + 120)));
      for (let r = 0, x = 20; r < reps; r++, x += w + 120) pixelText(ctx, text, x, 11, sc, tk.c);
      ctx.fillStyle = "rgba(0,0,0,.45)"; for (let x = 0; x < cv.width; x += sc) ctx.fillRect(x, 0, 1, cv.height); for (let y = 11; y < cv.height; y += sc) ctx.fillRect(0, y, cv.width, 1);
      tk.tex.needsUpdate = true;
    }
    function newsText() {
      const v = session.visits.size, s = session.stops, km = (session.km / 1000).toFixed(1);
      const lines = [
        v ? `LOCAL DRIVER VISITS ${v} PLACE${v === 1 ? "" : "S"}, CALLS IT RESEARCH` : "POLITE CITY: RAIN STOPS, ASPHALT STAYS SHINY",
        s ? `POLITE PATROL ISSUES ${s} COMPLIMENT${s === 1 ? "" : "S"} TONIGHT` : "PATROL REPORTS A QUIET NIGHT. SUSPICIOUSLY QUIET.",
        `${km} KM DRIVEN. NOBODY ASKED FOR DIRECTIONS`,
        "WEATHER: WET, WITH A CHANCE OF REBRANDING"
      ];
      return lines.join("  *  ") + "  *  ";
    }
    const INDEX_TEXT = "BRAND INDEX:  DEADLN +12.4  *  LOGO.BIG -1.1  *  REVISN +400  *  KERN +0.02  *  SYNRGY FLAT  *  BRIEF.1PG +8.8  *  FONT.NEW -3.0  *  FINAL.V7 +0.7  *  ";


    // ===================== 1b. the look (polite-look, Daniel: "the buildings look unfinished, the roofs don't make sense") =====================
    // Polite City reuses the shared city, so its buildings are dressed here and only here:
    //  - a shader layer on the city's own two materials (mats.buildings, mats.roofs), switched by one uniform (pcOn): off in
    //    every other world, where the shaders take exactly their old path. With it on, the facades get a window rhythm
    //    that sits on the floors (each window cell of app.js's tile is one floor): a recessed pane with a light stucco frame
    //    and sill, a thin ledge at every floor, a shop floor of wide glazing; each pane lit or dark by itself over the
    //    evening (the hour from phase B's clock). The roofs get their materials back (clay tiles in courses, zinc with
    //    standing seams, flat roofs in tar and gravel) and a little modelling from the moonlight, so their shapes read
    //  - geometry on the roofs, from what each footprint's roof is (app.js tags FOOTPRINTS[i].roof): on flat roofs a
    //    stone coping on the parapet, a cornice under it, water tanks on stands, AC units, vent pipes and antennae; under
    //    the zinc mansards a cornice and brick chimney stacks on the top; on a few tiled roofs an antenna on the ridge.
    //    Instanced: one draw for the boxes, one for the cylinders. Nothing floats: every piece stands on the surface below it
    const PCU = { pcOn: { value: 0 }, pcLit: { value: 0.5 }, pcT: { value: 0 } };
    let lookHooked = false; const roofMeshes = [];
    function lookHook() {
      const M = A.mats; if (lookHooked || !M?.buildings || !M?.roofs) return; lookHooked = true;
      const common = `#include <common>
        uniform float pcOn, pcLit, pcT; varying vec3 vPcW; varying vec3 vPcN;
        float pcH(vec2 p) { return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }`;
      const vert = (sh) => {
        Object.assign(sh.uniforms, PCU);
        sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nvarying vec3 vPcW; varying vec3 vPcN;")
          .replace("#include <begin_vertex>", "#include <begin_vertex>\nvPcW = (modelMatrix * vec4(transformed, 1.0)).xyz;")
          .replace("#include <beginnormal_vertex>", "#include <beginnormal_vertex>\nvPcN = normalize(mat3(modelMatrix) * objectNormal);");
      };
      const B = M.buildings, prevB = B.onBeforeCompile, keyB = B.customProgramCacheKey;
      B.onBeforeCompile = (sh, r) => {
        prevB?.call(B, sh, r); vert(sh);
        sh.fragmentShader = sh.fragmentShader.replace("#include <common>", common)
          .replace("#include <map_fragment>", "vec4 pcBase = diffuseColor;\n#include <map_fragment>")
          .replace("#include <color_fragment>", `#include <color_fragment>
            float pcPane = 0.0, pcShop = 0.0, pcWall = 0.0; vec2 pcId = vec2(0.0), pcC = vec2(0.0);
            #if defined(USE_MAP) && defined(USE_COLOR)
            if (pcOn > 0.5) {
              pcWall = 1.0 - step(0.9, abs(vPcN.y));
              vec2 g = vMapUv * 4.0, id = floor(g), c = fract(g); pcC = c;
              pcId = id + floor(vPcW.xz / 230.0) * vec2(17.0, 31.0) + floor(vPcW.y / 600.0);
              vec3 wall = pcBase.rgb * vColor * (0.9 + 0.1 * pcH(floor(vPcW.xz / 40.0)));
              vec3 col = wall * (1.0 - 0.3 * (1.0 - step(0.06, c.y)));       // the floor ledge
              vec3 glass = mix(vec3(0.04, 0.045, 0.06), vec3(0.1, 0.11, 0.14), smoothstep(0.2, 0.8, c.y));
              if (vPcW.y < 13.0) { // the shop floor: wide glazing between piers, under the plinth band
                pcShop = 1.0; pcPane = step(0.1, c.x) * step(c.x, 0.9) * step(0.06, c.y) * step(c.y, 0.8);
                col = mix(col, glass, pcPane);
              } else {
                pcPane = step(0.31, c.x) * step(c.x, 0.69) * step(0.27, c.y) * step(c.y, 0.79);
                float fr = step(0.275, c.x) * step(c.x, 0.725) * step(0.235, c.y) * step(c.y, 0.825) - pcPane;
                float sill = step(0.25, c.x) * step(c.x, 0.75) * step(0.19, c.y) * step(c.y, 0.235);
                col = mix(col, wall * 1.3, clamp(fr + sill, 0.0, 1.0));
                col = mix(col, glass, pcPane);
              }
              pcPane *= pcWall;
              diffuseColor.rgb = mix(diffuseColor.rgb, col, pcWall);
            }
            #endif`)
          .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.28, pcPane);")
          .replace("#include <emissivemap_fragment>", `#include <emissivemap_fragment>
            if (pcOn > 0.5) {
              float h = pcH(pcId), h2 = fract(h * 91.7 + 0.13);
              float ph = floor(pcT / (25.0 + h2 * 90.0) + h2 * 7.0);
              float flip = step(0.92, fract(sin(dot(pcId + ph, vec2(4.1, 7.7))) * 1234.5));
              float lit = abs(step(h, pcLit * (pcShop > 0.5 ? 0.7 : 1.0)) - flip);
              vec3 warm = mix(vec3(1.0, 0.62, 0.3), vec3(1.0, 0.82, 0.56), h2);
              warm = mix(warm, vec3(0.5, 0.66, 1.0), step(0.94, fract(h * 13.7)));      // now and then a television
              float room = 0.62 + 0.38 * smoothstep(0.8, 0.3, pcC.y);                  // a room, brighter low, the ceiling darker
              float curtain = 1.0 - 0.55 * step(0.6, h2) * smoothstep(0.42, 0.4, abs(pcC.x - 0.5)); // drawn curtains on some
              totalEmissiveRadiance = warm * lit * room * curtain * pcPane * 0.85;
            }`);
      };
      B.customProgramCacheKey = () => (keyB ? keyB.call(B) : "") + "|pc-look-1";
      const R = M.roofs, prevR = R.onBeforeCompile, keyR = R.customProgramCacheKey;
      R.onBeforeCompile = (sh, r) => {
        prevR?.call(R, sh, r); vert(sh);
        sh.fragmentShader = sh.fragmentShader.replace("#include <common>", common)
          .replace("#include <color_fragment>", `#include <color_fragment>
            #ifdef USE_COLOR
            if (pcOn > 0.5) {
              vec3 v = vColor, n = normalize(vPcN), col;
              float mx = max(v.r, max(v.g, v.b)), mn = min(v.r, min(v.g, v.b)), sat = (mx - mn) / max(mx, 1e-3);
              if (sat > 0.38 && v.r > v.b * 1.4) {                       // clay tiles, laid in courses down the slope
                col = v * vec3(0.62, 0.5, 0.44) * (0.78 + 0.22 * smoothstep(0.0, 0.2, fract(vPcW.y / 1.6))) / vec3(0.72, 0.74, 0.82);
              } else if (sat < 0.25 && mx < 0.35) {                         // zinc (linear colours): standing seams
                float sm = fract((vPcW.x * 0.71 + vPcW.z * 0.71) / 3.4);
                col = vec3(0.4, 0.44, 0.48) * (0.95 - 0.3 * (1.0 - smoothstep(0.0, 0.07, sm)));
              } else if (n.y > 0.85 && mx > 0.45 && sat < 0.3) {            // flat roofs: tar and gravel
                col = vec3(0.21, 0.22, 0.24) * (0.85 + 0.3 * pcH(floor(vPcW.xz * 0.7)));
              } else col = v * 0.8;                                         // parapets, the plinth band, chimneys, dormers
              col *= 0.78 + 0.32 * clamp(dot(n, normalize(vec3(-0.45, 0.75, 0.5))), 0.0, 1.0); // the moon models the slopes
              diffuseColor.rgb = col * vec3(0.72, 0.74, 0.82);
            }
            #endif`);
      };
      R.customProgramCacheKey = () => (keyR ? keyR.call(R) : "") + "|pc-look-1";
      B.needsUpdate = R.needsUpdate = true;
    }
    function lookSet(on) {
      PCU.pcOn.value = on ? 1 : 0;
      const tl = A.mats?.trafficLights; // the signals' glows, pulled back in this world only (app.js keeps its own look elsewhere)
      if (tl) tl.look = on ? { halo: 0.62, haloK: 0.7, pool: 0.6, poolK: 0.55, streak: 0.32, streakK: 0.6, centre: 0 } : null;
    }
    // the roof dressing (only roofs app.js tagged; the landmarks have their own)
    function buildRoofs() {
      const FP = A.footprints() || [], boxes = [], cyls = [];
      const stone = new T.Color("#9d968a"), stucco = new T.Color("#6f6a62"), metal = new T.Color("#5a6168"), ac = new T.Color("#858c93"), dark = new T.Color("#26292e"), brick = new T.Color("#5e3d31");
      let seed = 7; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      for (const f of FP) {
        if (!f.roof || !f.h) continue;
        const c = Math.cos(f.ang || 0), sn = Math.sin(f.ang || 0), hw = f.w / 2, hd = f.d / 2, h = f.h;
        // local (x along the street, z away from it) -> world, as app.js's frame()
        const put = (arr, lx, lz, y0, sx, sy, sz, col, rot = 0) => arr.push([f.x + lx * c + lz * sn, y0, f.z - lx * sn + lz * c, sx, sy, sz, (f.ang || 0) + rot, col]);
        const ring = (y0, sy, out, t, col) => { put(boxes, 0, -(hd + out - t / 2), y0, 2 * (hw + out), sy, t, col); put(boxes, 0, hd + out - t / 2, y0, 2 * (hw + out), sy, t, col); put(boxes, -(hw + out - t / 2), 0, y0, t, sy, 2 * (hd + out) - 2 * t, col); put(boxes, hw + out - t / 2, 0, y0, t, sy, 2 * (hd + out) - 2 * t, col); };
        if (f.roof === "flat") {
          ring(h + 3, 0.8, 1.5, 1.8, stone);           // the coping on the parapet
          ring(h - 2.4, 2.4, 2.2, 2.4, stucco);        // the cornice under it
          if (low) continue;
          const free = (x, z, r) => !(f.stair && Math.abs(x - f.stair[0]) < 6 + r && Math.abs(z - f.stair[1]) < 5.5 + r) && !(f.dome && Math.hypot(x + hw - 4, z + hd - 4) < 10 + r) && Math.abs(x) < hw - 2.5 - r && Math.abs(z) < hd - 2.5 - r;
          const y = h + 3;
          if (f.w > 24 && f.d > 22 && rnd() < 0.45) { const x = (rnd() - 0.5) * (f.w - 18), z = (rnd() - 0.5) * (f.d - 18); if (free(x, z, 5)) {
            put(boxes, x, z, y, 9, 1.4, 9, dark); for (const [a, b] of [[-3, -3], [3, -3], [-3, 3], [3, 3]]) put(boxes, x + a, z + b, y + 1.4, 0.7, 2.2, 0.7, dark);
            put(cyls, x, z, y + 3.6, 3.7, 7, 3.7, metal); put(cyls, x, z, y + 10.6, 3.9, 0.6, 3.9, dark); } }
          const nAc = f.w > 20 ? 1 + Math.floor(rnd() * 3) : 0;
          for (let k = 0; k < nAc; k++) { const x = (rnd() - 0.5) * (f.w - 10), z = (rnd() - 0.5) * (f.d - 10); if (!free(x, z, 3)) continue; const r = rnd() < 0.5 ? 0 : Math.PI / 2; put(boxes, x, z, y, 5, 3.2, 4, ac, r); put(cyls, x, z, y + 3.2, 1.5, 0.3, 1.5, dark); }
          for (let k = 0; k < 2; k++) { const x = (rnd() - 0.5) * (f.w - 8), z = (rnd() - 0.5) * (f.d - 8); if (free(x, z, 1)) put(cyls, x, z, y, 0.6, 2.6 + rnd() * 2, 0.6, dark); }
          if (rnd() < 0.35) { const x = (rnd() - 0.5) * (f.w - 10), z = (rnd() - 0.5) * (f.d - 10); if (free(x, z, 2)) { const ht = 12 + rnd() * 8; put(cyls, x, z, y, 0.28, ht, 0.28, dark); put(boxes, x, z, y + ht * 0.82, 7, 0.3, 0.3, dark); put(boxes, x, z, y + ht * 0.66, 5, 0.3, 0.3, dark); } }
        } else if (f.roof === "mansard") {
          ring(h - 2, 2, 2, 2.2, stucco);              // the cornice the mansard sits on
          if (low) continue;
          const tx = (hw + 1.5) * 0.66, tz = (hd + 1.5) * 0.66, top = h + (f.rh || 14);
          const nC = 1 + Math.floor(rnd() * 2);
          for (let k = 0; k < nC; k++) { const x = (rnd() - 0.5) * (tx * 2 - 5), z = (rnd() - 0.5) * (tz * 2 - 5); put(boxes, x, z, top - 0.5, 2.6, 5.5, 2.6, brick); put(boxes, x, z, top + 5, 3.2, 0.6, 3.2, stone); }
          if (rnd() < 0.3) { const ht = 10 + rnd() * 6; put(cyls, 0, 0, top - 0.3, 0.25, ht, 0.25, dark); put(boxes, 0, 0, top + ht * 0.8, 6, 0.3, 0.3, dark); }
        } else if (f.roof === "hip" && !low && rnd() < 0.18) {
          const ht = 9 + rnd() * 5, top = h + (f.rh || 10); // an antenna on the ridge
          put(cyls, 0, 0, top - 1.5, 0.22, ht, 0.22, dark); put(boxes, 0, 0, top - 1.5 + ht * 0.8, 5, 0.25, 0.25, dark);
        }
      }
      const mk = (geo, list) => {
        if (!list.length) return null;
        geo.translate(0, 0.5, 0);
        const mesh = new T.InstancedMesh(geo, new T.MeshStandardMaterial({ color: "#ffffff", roughness: 0.85, metalness: 0.05 }), list.length);
        const m = new T.Matrix4(), q = new T.Quaternion(), up = new T.Vector3(0, 1, 0), v = new T.Vector3(), sc = new T.Vector3();
        list.forEach(([x, y, z, sx, sy, sz, a, col], i) => { q.setFromAxisAngle(up, a); m.compose(v.set(x, y, z), q, sc.set(sx, sy, sz)); mesh.setMatrixAt(i, m); mesh.setColorAt(i, col); });
        mesh.frustumCulled = false; mesh.castShadow = false; mesh.receiveShadow = false; mesh.material.userData.outlineParameters = { visible: false };
        return mesh;
      };
      const gb = mk(new T.BoxGeometry(1, 1, 1), boxes), gc = mk(new T.CylinderGeometry(1, 1, 1, 10), cyls);
      for (const o of [gb, gc]) if (o) { o.name = "pc-roofs"; group.add(o); roofMeshes.push(o); }
      return { boxes: boxes.length, cyls: cyls.length };
    }

    function build() {
      const G = A.nav2()?.graph; if (!G || !G.E) return false;
      const t0 = performance.now();
      group = new T.Group(); group.name = "polite-city";
      const lamps = [];
      for (const p of roadside(low ? 300 : 200, 5, low ? 220 : 460, (e) => e.kind !== "minor" && e.w >= 30)) {
        if (inBuilding(p.x, p.z, 1) || !farFrom(lamps, p.x, p.z, 110)) continue;
        lamps.push(p);
      }
      // the sodium lamps: one instanced pole + arm, one head (emissive, warm)
      {
        const pole = new T.CylinderGeometry(1.3, 1.8, 56, 6); pole.translate(0, 28, 0);
        const arm = new T.BoxGeometry(2.2, 2, 20); arm.translate(0, 55, 9);
        const head = new T.BoxGeometry(6, 2.6, 9); head.translate(0, 53.5, 17);
        const pm = new T.MeshStandardMaterial({ color: "#2a2e35", roughness: 0.85 }), hm = new T.MeshBasicMaterial({ color: new T.Color("#ffb46a").multiplyScalar(1.6), toneMapped: false });
        const P = new T.InstancedMesh(pole, pm, lamps.length), R = new T.InstancedMesh(arm, pm, lamps.length), H = new T.InstancedMesh(head, hm, lamps.length);
        const m = new T.Matrix4(), q = new T.Quaternion(), up = new T.Vector3(0, 1, 0), S = new T.Vector3(1, 1, 1);
        lamps.forEach((l, i) => { q.setFromAxisAngle(up, Math.atan2(-l.nx, -l.nz)); m.compose(new T.Vector3(l.x, 0, l.z), q, S); P.setMatrixAt(i, m); R.setMatrixAt(i, m); H.setMatrixAt(i, m); });
        for (const o of [P, R, H]) { o.material.userData.outlineParameters = { visible: false }; group.add(o); }
      }
      // the billboards: spaced along the long roads, never in a building or on a place's pin
      const bspots = [];
      for (const p of roadside(430, 30, 600, (e) => e.kind !== "minor" && e.w >= 30)) {
        if (bspots.length >= (low ? 12 : 20)) break;
        if (inBuilding(p.x, p.z, 12) || placesNear(p.x, p.z, 130) || !farFrom(bspots, p.x, p.z, 480) || !farFrom(lamps, p.x, p.z, 30)) continue;
        bspots.push(p);
      }
      boards = buildBoards(bspots);
      group.add(boards.group);
      // the tickers: the news (near the start: the first road you drive) and the Brand Index (further on)
      const tspots = roadside(520, 24, 400, (e) => e.kind !== "minor" && e.w >= 30).filter((p) => -p.nz > 0.15 && !inBuilding(p.x, p.z, 10) && !placesNear(p.x, p.z, 120) && farFrom(bspots, p.x, p.z, 220));
      const car = A.car(); tspots.sort((a, b) => Math.hypot(a.x - car.x, a.z - car.z) - Math.hypot(b.x - car.x, b.z - car.z));
      if (tspots[0]) { const tk = buildTicker(tspots[0], "news"); paintTicker(tk, newsText()); tickers.push(tk); group.add(tk.g); }
      const far = tspots.find((p) => tspots[0] && Math.hypot(p.x - tspots[0].x, p.z - tspots[0].z) > 1500);
      if (far) { const tk = buildTicker(far, "index"); paintTicker(tk, INDEX_TEXT); tickers.push(tk); group.add(tk.g); }
      // the manholes and their steam: on the road itself, a little off the centre line
      const vents = [];
      for (const p of roadside(low ? 900 : 600, 0, 60, (e) => e.kind !== "minor" && e.w >= 30)) { const x = p.rx + p.nx * 9, z = p.rz + p.nz * 9; if (farFrom(vents, x, z, 400) && !placesNear(x, z, 90)) vents.push({ x, z }); }
      {
        const disc = new T.CircleGeometry(6.5, 14); disc.rotateX(-Math.PI / 2); disc.translate(0, 2.9, 0);
        const ring = new T.RingGeometry(6.5, 8, 14); ring.rotateX(-Math.PI / 2); ring.translate(0, 2.85, 0);
        const D = new T.InstancedMesh(disc, new T.MeshStandardMaterial({ color: "#0b0d10", roughness: 0.4, metalness: 0.6 }), vents.length);
        const Rg = new T.InstancedMesh(ring, new T.MeshStandardMaterial({ color: "#3b414b", roughness: 0.6 }), vents.length);
        const m = new T.Matrix4(); vents.forEach((v, i) => { m.makeTranslation(v.x, 0, v.z); D.setMatrixAt(i, m); Rg.setMatrixAt(i, m); });
        for (const o of [D, Rg]) { o.material.polygonOffset = true; o.material.polygonOffsetFactor = -3; o.material.polygonOffsetUnits = -6; o.material.userData.outlineParameters = { visible: false }; group.add(o); }
        steam = buildSteam(vents); group.add(steam);
      }
      // the reflections: a sodium pool under every lamp head (on the road), a neon one in front of every board and
      // ticker; the lite path keeps them (they are the look) but without the ripples
      const src = [];
      for (const l of lamps) src.push({ x: l.x - l.nx * 17, z: l.z - l.nz * 17, r: 30, h: 53, c: "#ff9e3d", k: 0.9 }); // (polite-look: right under the head, ~2 m)
      // the lit windows spill onto the wet road too: a soft warm pool at the kerb in front of the buildings that face it
      { const spill = [], lim = low ? 60 : 160;
        for (const p of roadside(150, -4, 3000, (e) => e.w >= 28)) {
          if (spill.length >= lim) break;
          if (!inBuilding(p.x + p.nx * 40, p.z + p.nz * 40, 12) || !farFrom(spill, p.x, p.z, 150) || !farFrom(lamps, p.x, p.z, 80)) continue;
          spill.push(p); src.push({ x: p.x, z: p.z, r: 34, h: 18, c: "#ffb265", k: 0.22, spec: false });
        } }
      for (const b of boards.list) src.push({ x: b.rx + (b.x - b.rx) * 0.45, z: b.rz + (b.z - b.rz) * 0.45, r: 30, h: 30, c: b.b.neon, k: 0.5 });
      for (const tk of tickers) src.push({ x: tk.rx + (tk.x - tk.rx) * 0.5, z: tk.rz + (tk.z - tk.rz) * 0.5, r: 26, h: 40, c: tk.c, k: 0.4 });
      streak = buildStreaks(src); group.add(streak);
      lookHook(); const roofs = buildRoofs();
      group.visible = false;
      A.scene.add(group);
      api.built = true;
      api._dbg = { lamps, bspots, vents, src }; // tests
      api.stats = { lamps: lamps.length, boards: boards.list.length, tickers: tickers.length, vents: vents.length, reflections: src.length, roofs, ms: Math.round(performance.now() - t0), low };
      return true;
    }

    // ===================== 2. the HUD =====================
    function el(tag, cls, html) { const e = document.createElement(tag); if (cls) e.className = cls; if (html != null) e.innerHTML = html; return e; }
    function buildHud() {
      const root = el("div", "pc-hud");
      root.setAttribute("aria-hidden", "false");
      root.innerHTML = `
        <div class="pc-radar" role="img" aria-label="Radar: the roads around you, your car in the middle"><canvas width="368" height="368"></canvas><i class="pc-pill" aria-hidden="true"></i></div>
        <div class="pc-stack">
          <button class="pc-radio" type="button" aria-pressed="false" title="Polite City radio"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="8" width="18" height="12" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="15.5" cy="14" r="3" fill="none" stroke="currentColor" stroke-width="2"/><path d="M7 12h3M7 15.5h3M6 8l10-4.5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg><span>Radio off</span></button>
          <div class="pc-clock" title="The real time in Bucharest"><b>--:--</b><small>BUC</small></div>
          <div class="pc-cred" title="Credits (your XP)"><b>₡ 0</b></div>
          <div class="pc-heat" role="img" aria-label="Heat 0 of 3">${[0, 1, 2].map(() => `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="${STAR4}"/></svg>`).join("")}</div>
        </div>
        <div class="pc-pager" aria-live="polite"><canvas width="512" height="72"></canvas><span class="pc-sr"></span></div>
        <div class="pc-station" aria-live="polite"></div>
        <div class="pc-moment" role="status"><div class="pc-mc"><i class="pc-pill" aria-hidden="true"></i><b></b><span></span></div></div>`;
      document.body.appendChild(root);
      const H = { root, radar: root.querySelector(".pc-radar canvas"), clock: root.querySelector(".pc-clock b"), cred: root.querySelector(".pc-cred b"), heat: root.querySelector(".pc-heat"), pager: root.querySelector(".pc-pager"), pagerCv: root.querySelector(".pc-pager canvas"), pagerSr: root.querySelector(".pc-sr"), station: root.querySelector(".pc-station"), moment: root.querySelector(".pc-moment") };
      window.__politeHud = { flashStation: (n, f) => flashStation(n, f) };
      H.radioBtn = root.querySelector(".pc-radio");
      H.radioBtn.addEventListener("pointerdown", (e) => e.stopPropagation());
      H.radioBtn.addEventListener("click", (e) => { e.stopPropagation(); radioTap(); });
      return H;
    }
    // the road map behind the radar: every road of the graph, drawn once at 1 px = 4 units
    let mapCv = null; const MS = 0.25;
    function radarBase() {
      const G = A.nav2()?.graph; if (!G) return null;
      let x0 = Infinity, x1 = -Infinity, z0 = Infinity, z1 = -Infinity;
      for (const n of G.N) { x0 = Math.min(x0, n.x); x1 = Math.max(x1, n.x); z0 = Math.min(z0, n.z); z1 = Math.max(z1, n.z); }
      x0 -= 400; z0 -= 400; x1 += 400; z1 += 400;
      const cv = document.createElement("canvas"); cv.width = Math.ceil((x1 - x0) * MS); cv.height = Math.ceil((z1 - z0) * MS);
      const c = cv.getContext("2d"); c.fillStyle = "#1a1f26"; c.fillRect(0, 0, cv.width, cv.height);
      c.lineCap = c.lineJoin = "round";
      for (const pass of [0, 1]) for (const e of G.E) {
        if (pass === 0 && e.drive) continue; if (pass === 1 && !e.drive) continue;
        c.strokeStyle = e.drive ? "#9aa3b2" : "#3a424e"; c.lineWidth = Math.max(2, e.w * MS * (e.drive ? 0.9 : 0.7));
        c.beginPath(); e.pts.forEach((p, i) => (i ? c.lineTo : c.moveTo).call(c, (p[0] - x0) * MS, (p[1] - z0) * MS)); c.stroke();
      }
      mapCv = { cv, x0, z0 };
      return mapCv;
    }
    let radarT = 0;
    function drawRadar(now) {
      const cv = hud.radar, c = cv.getContext("2d"), W = cv.width, R = W / 2;
      if (!mapCv && !radarBase()) return;
      const car = A.car(), D = A.nav2()?.D, topYaw = D && D.topK > 0.5 && D.topYaw != null ? D.topYaw : A.mapView.yaw;
      // the radar turns with the camera: up on the radar is up on the screen
      const zoom = 1.45 * (1 + 0.5 * clamp(Math.abs(A.nav2()?.speed?.() || 0) / (A.nav2()?.vmax || 600), 0, 1)); // it pulls out a little with speed, like the camera
      c.save(); c.clearRect(0, 0, W, W);
      c.fillStyle = "#1a1f26"; c.fillRect(0, 0, W, W);
      c.translate(R, R); c.rotate(topYaw); c.scale(1 / zoom * 2, 1 / zoom * 2);
      c.drawImage(mapCv.cv, -(car.x - mapCv.x0) * MS, -(car.z - mapCv.z0) * MS);
      // the blips: our glyphs (a dot in the place's colour, the house for Olari 9, the cup for the cafés)
      const toR = (x, z) => [(x - car.x) * MS, (z - car.z) * MS];
      const rot = topYaw;
      for (const p of A.places() || []) {
        const px = p.px ?? p.x, pz = p.pz ?? p.z; if (px == null || p.find) continue;
        const [x, y] = toR(px, pz); if (Math.abs(x) > 140 || Math.abs(y) > 140) continue;
        c.save(); c.translate(x, y); c.rotate(-rot); c.scale(zoom / 2, zoom / 2);
        if (p.id === "end") { c.fillStyle = PAL.green; c.strokeStyle = PAL.ink; c.lineWidth = 3; c.beginPath(); c.moveTo(-9, 2); c.lineTo(0, -8); c.lineTo(9, 2); c.lineTo(9, 9); c.lineTo(-9, 9); c.closePath(); c.fill(); c.stroke(); }
        else { c.fillStyle = p.c && p.c !== "#ffffff" ? p.c : PAL.paper; c.strokeStyle = PAL.ink; c.lineWidth = 3; c.beginPath(); c.arc(0, 0, 6.5, 0, Math.PI * 2); c.fill(); c.stroke(); }
        c.restore();
      }
      c.restore();
      // the car: our arrow, yellow (the one emphasis), always in the middle, turned by its heading against the radar's
      c.save(); c.translate(R, R); c.rotate(Math.PI - car.h + topYaw); c.fillStyle = PAL.yellow; c.strokeStyle = PAL.ink; c.lineWidth = 5;
      c.beginPath(); c.moveTo(0, -24); c.lineTo(16, 18); c.lineTo(0, 9); c.lineTo(-16, 18); c.closePath(); c.fill(); c.stroke();
      // the Patrol, while it follows you: a beacon blip behind the car that alternates coral and blue
      if (A.nav2()?.copT?.() != null) { c.fillStyle = Math.floor(now / 220) % 2 ? PAL.coral : PAL.blue; c.lineWidth = 4; c.beginPath(); c.arc(0, 52, 11, 0, Math.PI * 2); c.fill(); c.stroke(); }
      c.restore();
    }
    // the pager: 2M2F's pixel letters on a little LCD, a line at a time, scrolled when long
    const pagerQ = []; let pagerCur = null;
    function page(msg, from = "OLARI 9") { pagerQ.push({ msg: msg.toUpperCase(), from }); }
    function pagerTick(dt, now) {
      const P = hud.pager;
      if (!pagerCur && pagerQ.length) { pagerCur = { ...pagerQ.shift(), t: 0 }; P.classList.add("on"); sfx("sfx-pager-buzz"); if (!A.reduced()) { P.classList.remove("buzz"); void P.offsetWidth; P.classList.add("buzz"); } hud.pagerSr.textContent = `${pagerCur.from}: ${pagerCur.msg}`; }
      if (!pagerCur) return;
      pagerCur.t += dt;
      const cv = hud.pagerCv, c = cv.getContext("2d"), sc = 4, line = `${pagerCur.from}: ${pagerCur.msg}`, w = pixelW(line, sc);
      c.fillStyle = "#c9d86a"; c.fillRect(0, 0, cv.width, cv.height);
      c.fillStyle = "rgba(20,30,10,.08)"; for (let x = 0; x < cv.width; x += sc) c.fillRect(x, 0, 1, cv.height);
      const scroll = w > cv.width - 32 ? Math.max(0, (pagerCur.t - 0.8) * 70) % (w + 80) : 0;
      pixelText(c, line, 16 - scroll, 22, sc, "#1d2410");
      if (scroll && 16 - scroll + w + 80 < cv.width) pixelText(c, line, 16 - scroll + w + 80, 22, sc, "#1d2410");
      const dur = Math.max(3.6, w / 70 + 1.6);
      if (pagerCur.t > dur) { pagerCur = null; if (!pagerQ.length) P.classList.remove("on"); }
    }
    const STATIONS = [["Olari FM", "88.9"], ["Radio Kerning", "92.4"], ["Brief Talk", "104.1"]];
    function radioPaint() {
      const b = hud?.radioBtn; if (!b) return;
      const m = muted(), on = radio.on && !m;
      b.querySelector("span").textContent = m ? "Sound is off" : on ? `${STATIONS[radio.idx][0]} ${STATIONS[radio.idx][1]}` : "Radio off";
      b.setAttribute("aria-pressed", String(on)); b.classList.toggle("on", on); b.classList.toggle("muted", m);
      b.title = m ? "The site's sound is off (the speaker button)" : on ? "Next station" : "Turn the radio on";
    }
    // a tap: off -> Olari FM -> Radio Kerning -> Brief Talk -> off
    function radioTap() {
      if (muted()) { page("The sound is off. The speaker turns it on.", "RADIO"); radioPaint(); return; }
      radioLoad((r) => {
        if (!r) return;
        r.onchange = (o) => { if (o && o.station) flashStation(o.name, `${o.dial} FM`); };
        if (radio.idx >= STATIONS.length - 1) { radio.on = false; radio.idx = -1; r.stop(); r.ambience(false); }
        else { radio.on = true; radio.idx++; r.play(radio.idx); if (radio.idx === 0) r.ambience(true); }
        radioPaint();
      });
    }
    function radioStop() { const r = radioApi(); if (r && radio.on) { r.stop(); r.ambience(false); } radio.on = false; radio.idx = -1; radioPaint(); }
    const sfx = (id, o) => { const r = radioApi(); if (r && radio.on && !muted()) try { r.sfx(id, o); } catch (e) {} }; // only once the visitor has opted into the world's sound
    // r304: the ids Sorin's manifest has. Phase B asks for sfx-bass-pass and sfx-thunder-far, which are not in it yet: an id it
    // lacks is skipped silently (radio.js would console.warn on each call)
    let sfxIds = null;
    const sfxHas = (id) => { if (!sfxIds) { sfxIds = new Set(); fetch(RADIO_BASE + "manifest.json").then((r) => r.json()).then((m) => { for (const k of Object.keys(m.files || {})) sfxIds.add(k); }).catch(() => {}); } return sfxIds.has(id); };
    let duckOn = false;
    function radioTick() {
      if (!radio.on) return;
      if (muted()) { radioStop(); return; }
      const d = !!A.overlay() || !!document.querySelector(".case-frame:not(.hidden)");
      if (d !== duckOn) { duckOn = d; radioApi()?.duck(d); }
    }
    function flashStation(name, freq) {
      const s = hud?.station; if (!s) return;
      s.innerHTML = `<b>${String(name).replace(/</g, "&lt;")}</b>${freq ? `<small>${String(freq).replace(/</g, "&lt;")}</small>` : ""}`;
      s.classList.remove("on"); void s.offsetWidth; s.classList.add("on");
      clearTimeout(s._t); s._t = setTimeout(() => s.classList.remove("on"), 2600);
    }
    // a big moment: a rounded card slammed in (10% overshoot; reduced motion: a fade), ≤ 2.5 s
    function moment(title, sub, kind = "") {
      if (!hud) return;
      const m = hud.moment; m.querySelector("b").textContent = title; m.querySelector("span").textContent = sub || "";
      m.dataset.k = kind; m.classList.remove("on"); void m.offsetWidth; m.classList.add("on");
      clearTimeout(m._t); m._t = setTimeout(() => m.classList.remove("on"), 2400);
    }
    // Heat: nav2's Polite Patrol already watches the driving (4 s of drifting in 8 s, or holding top speed): a star lights as
    // it notices, two while it follows you, three if it has to come back within 90 s; one goes out every 12 s of calm
    const heat = { lvl: 0, chases: [], lastCop: false, calmT: 0, shown: -1 };
    function heatTick(dt, now) {
      const n = A.nav2(), D = n?.D; if (!D) return;
      const cop = !!D.cop || n.copT?.() != null;
      if (cop && !heat.lastCop) {
        heat.chases.push(now); heat.chases = heat.chases.filter((t) => now - t < 90000);
        session.stops++;
        moment("Pulled over", heat.chases.length > 1 ? "Fined: two compliments. You're doing great." : "Fined: one compliment.", "cop");
        if (session.stops === 1) page("Thank you for slowing down. Have a lovely night.", "PATROL");
        sfx("sfx-scanner-chirp");
      }
      heat.lastCop = cop;
      const warm = Math.max((D.copSum || 0) / 4, (D.copSpeed || 0) / 1.5);
      let want = cop ? (heat.chases.length > 1 ? 3 : 2) : warm > 0.45 ? Math.max(1, heat.lvl) : heat.lvl;
      if (!cop && warm <= 0.45 && heat.lvl > 0) { heat.calmT += dt; if (heat.calmT > 12) { heat.calmT = 0; want = heat.lvl - 1; } } else heat.calmT = 0;
      heat.lvl = clamp(want, 0, 3); api.heat = heat.lvl;
      const key = heat.lvl * 10 + (cop ? 1 : 0) + (warm > 0.45 ? 2 : 0);
      if (key !== heat.shown) {
        heat.shown = key;
        [...hud.heat.children].forEach((s, i) => s.classList.toggle("on", i < heat.lvl));
        hud.heat.classList.toggle("hot", cop); hud.heat.classList.toggle("warm", warm > 0.45 && !cop);
        hud.heat.setAttribute("aria-label", `Heat ${heat.lvl} of 3`);
      }
    }
    const fmt = (() => { try { return new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Bucharest", hour: "2-digit", minute: "2-digit", hour12: false }); } catch { return null; } })();
    let hudSlow = 0, credShown = -1;
    function hudTick(dt, now) {
      heatTick(dt, now);
      pagerTick(dt, now);
      radarT -= dt;
      if (radarT <= 0) { radarT = low ? 1 / 12 : 1 / 24; drawRadar(now); }
      hudSlow -= dt;
      if (hudSlow <= 0) {
        hudSlow = 0.5;
        radioTick(); if (hud.radioBtn.classList.contains("muted") !== muted()) radioPaint();
        // the radar sits over nav2's Nearby panel when that panel is up (bottom left on a laptop)
        if (!A.isPhone()) { const pn = document.querySelector(".nav2-ui .n2-panel"), r = pn && pn.getClientRects().length && getComputedStyle(pn).visibility !== "hidden" && +getComputedStyle(pn).opacity > 0.1 ? pn.getBoundingClientRect() : null; const b = r && r.left < 230 && r.height > 40 ? Math.round(innerHeight - r.top + 14) : null; const v = b ? b + "px" : ""; if (hud.radar.parentElement.style.bottom !== v) hud.radar.parentElement.style.bottom = v; }
        const open = document.querySelector(".map-card:not(.hidden) .mcd-title")?.textContent; if (open) session.visits.add(open); // the news ticker counts the places you open
        const t = fmt ? fmt.format(new Date()) : new Date().toTimeString().slice(0, 5); if (hud.clock.textContent !== t) hud.clock.textContent = t;
        const xp = parseInt(document.querySelector(".you .you-xp")?.textContent || "0", 10) || 0;
        if (xp !== credShown) { credShown = xp; hud.cred.textContent = `₡ ${xp * 10}`; hud.cred.parentElement.classList.remove("pop"); void hud.cred.offsetWidth; hud.cred.parentElement.classList.add("pop"); }
      }
    }

    // ===================== 3. the loading card =====================
    // panels of the world, rendered live (our compositions, from our own city) through a small "painted" pass: the colours
    // posterized in light, an ink line where the light changes, a warm paper tone. Made once per visit, then reused
    const PAINT_FS = `
      uniform sampler2D tD; uniform vec2 res; uniform float expo; varying vec2 vUv;
      vec3 tm(vec3 x) { x *= expo * 0.85; x = (x * (2.51 * x + 0.03)) / (x * (2.43 * x + 0.59) + 0.14); return pow(clamp(x, 0.0, 1.0), vec3(1.0 / 2.2)); }
      float L(vec2 p) { vec3 c = tm(texture2D(tD, p).rgb); return dot(c, vec3(0.299, 0.587, 0.114)); }
      void main() {
        vec2 px = 1.0 / res; vec3 c = tm(texture2D(tD, vUv).rgb);
        float l = dot(c, vec3(0.299, 0.587, 0.114));
        float q = floor(pow(l, 0.8) * 5.0 + 0.5) / 5.0;
        vec3 o = c / max(l, 0.02) * max(q, 0.04); o = mix(o, c, 0.25);
        float gx = L(vUv + vec2(px.x, 0.0)) - L(vUv - vec2(px.x, 0.0)), gy = L(vUv + vec2(0.0, px.y)) - L(vUv - vec2(0.0, px.y));
        float e = smoothstep(0.07, 0.2, length(vec2(gx, gy)));
        o = mix(o, vec3(0.05, 0.05, 0.07), e * 0.85);
        o = o * 1.08 + vec3(0.02, 0.012, 0.0);
        gl_FragColor = vec4(clamp(o, 0.0, 1.0), 1.0);
      }`;
    let shots = null, paintRig = null;
    const isOurs = (o) => { for (let p = o; p; p = p.parent) if (p === group) return true; return false; };
    function shoot(cam, w, h) {
      const R = A.renderer;
      if (!paintRig) {
        const rt = new T.WebGLRenderTarget(w, h, { samples: 4, type: T.HalfFloatType }), rt2 = new T.WebGLRenderTarget(w, h);
        const mat = new T.ShaderMaterial({ uniforms: { tD: { value: rt.texture }, res: { value: { x: w, y: h } }, expo: { value: 1.3 } }, vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }", fragmentShader: PAINT_FS, depthTest: false, depthWrite: false });
        const quad = new T.Mesh(new T.PlaneGeometry(2, 2), mat); quad.frustumCulled = false;
        const sc = new A.scene.constructor(); sc.add(quad);
        paintRig = { rt, rt2, sc, cam: new T.PerspectiveCamera(), buf: new Uint8Array(w * h * 4) };
      }
      const { rt, rt2, sc, buf } = paintRig;
      sc.children[0].material.uniforms.expo.value = R.toneMappingExposure;
      const prev = R.getRenderTarget();
      // the city's additive glows (headlight cones, the beacon's beam, halos) are made for the map's own pass; through the
      // painted pass they wash the frame: off for the shot (ours, the wet reflections, stay)
      const glows = []; A.scene.traverse((o) => { if (o.visible && o.material && !o.isInstancedMesh && o.material.blending === T.AdditiveBlending && !isOurs(o)) { glows.push(o); o.visible = false; } });
      R.setRenderTarget(rt); R.render(A.scene, cam);
      for (const o of glows) o.visible = true;
      R.setRenderTarget(rt2); R.render(sc, paintRig.cam);
      R.readRenderTargetPixels(rt2, 0, 0, w, h, buf);
      R.setRenderTarget(prev);
      const cv = document.createElement("canvas"); cv.width = w; cv.height = h;
      const c = cv.getContext("2d"), img = c.createImageData(w, h);
      for (let y = 0; y < h; y++) img.data.set(buf.subarray((h - 1 - y) * w * 4, (h - y) * w * 4), y * w * 4);
      c.putImageData(img, 0, 0);
      return cv.toDataURL("image/jpeg", 0.86);
    }
    function panelCams() {
      const car = A.car(), fx = Math.sin(car.h), fz = Math.cos(car.h), V = (x, y, z) => A.warp(new T.Vector3(x, y, z));
      const mk = (pos, tgt, fov) => { const c = new T.PerspectiveCamera(fov, 1.6, 4, 9000); c.layers.mask = A.camera.layers.mask; c.position.copy(pos); c.lookAt(tgt); c.updateMatrixWorld(); return c; };
      const b = boards?.list?.slice().sort((p, q) => Math.hypot(p.x - car.x, p.z - car.z) - Math.hypot(q.x - car.x, q.z - car.z))[0];
      const cams = [
        { id: "street", cam: mk(V(car.x - fx * 70 + fz * 18, 16, car.z - fz * 70 - fx * 18), V(car.x + fx * 90, 8, car.z + fz * 90), 50) },
        (() => { const cx = car.x - fx * 30 + fz * 26, cz = car.z - fz * 30 - fx * 26; // the Patrol pulled up beside you, filmed from its front quarter
          return { id: "patrol", cop: { x: cx, z: cz, h: car.h }, cam: mk(V(cx + fx * 52 + fz * 30, 13, cz + fz * 52 - fx * 30), V(cx - fx * 4, 7, cz - fz * 4), 44) }; })(),
        { id: "top", cam: mk(V(car.x, 900, car.z + 1), V(car.x, 0, car.z), 42) },
        b ? { id: "board", cam: mk(V(b.rx - (b.x - b.rx) * 1.2 + (b.z - b.rz) * 1.6, 26, b.rz - (b.z - b.rz) * 1.2 - (b.x - b.rx) * 1.6), V(b.x, 52, b.z), 48) } : null,
        { id: "city", cam: mk(V(car.x - fx * 900, 520, car.z - fz * 900), V(car.x + fx * 600, 0, car.z + fz * 600), 40) }
      ].filter(Boolean);
      return cams;
    }
    function buildCard() {
      const c = el("div", "pc-card");
      // (r303: the card is the first beat of the arrival; a tap skips the whole arrival)
      c.setAttribute("role", "dialog"); c.setAttribute("aria-label", "Polite City");
      c.innerHTML = `<div class="pc-grid">${["street", "patrol", "top", "board", "city"].map((k) => `<figure class="pc-p pc-p-${k}"><img alt=""></figure>`).join("")}</div>
        <div class="pc-title"><i class="pc-pill" aria-hidden="true"></i><h1>Polite City</h1><p>Bonus world · after dark · wanted for good taste</p></div>
        <button class="pc-skip" type="button">Skip</button>`;
      document.body.appendChild(c);
      c.addEventListener("pointerdown", (e) => { e.preventDefault(); e.stopPropagation(); arrivalSkip(); });
      return c;
    }
    let cardState = null;
    function showCard() {
      if (!card) card = buildCard();
      cardState = { t: 0, queue: shots ? [] : panelCams(), dur: shots ? 0.85 : 1.2 }; // r303: shorter, the dive follows (2.6 / 1.5 s before)
      if (shots) for (const [k, u] of Object.entries(shots)) { const im = card.querySelector(`.pc-p-${k} img`); if (im) { im.src = u; im.parentElement.classList.add("ready"); } }
      card.classList.remove("out"); card.classList.add("on"); document.body.classList.add("pc-carding");
      arrival = { phase: "card", t: 0 }; document.body.classList.add("pc-arriving");
    }
    let cardOutT = 0;
    function hideCard(soft) {
      if (!cardState) return; cardState = null; document.body.classList.remove("pc-carding"); A.cop(null);
      clearTimeout(cardOutT);
      if (soft && card) { card.classList.add("out"); cardOutT = setTimeout(() => card.classList.remove("on", "out"), 380); } // (it lifts off over the dive)
      else card?.classList.remove("on", "out");
    }
    function cardTick(dt) {
      if (!cardState) return;
      // one panel per frame (each is a render of the city), the Patrol posed for its own
      const q = cardState.queue;
      if (q.length && cardState.t > 0.05) {
        const p = q.shift(), car = A.car();
        if (p.cop) A.cop({ ...p.cop, flash: true }); void car;
        try {
          const w = A.isPhone() ? 400 : 560, h = Math.round(w / 1.6), url = shoot(p.cam, w, h);
          (shots ||= {})[p.id] = url;
          const im = card.querySelector(`.pc-p-${p.id} img`); if (im) { im.src = url; im.parentElement.classList.add("ready"); }
        } catch (e) { (shots ||= {}); }
        if (p.cop) A.cop(null);
        return;
      }
      cardState.t += dt;
      if (!q.length && cardState.t > cardState.dur) { hideCard(true); arrivalDive(); }
    }

    // ===================== 3b. the arrival (r303) =====================
    // card -> the dive -> the HUD. The dive: from ~3,000 units over the car, looking straight down and turning a little,
    // down onto the view the visitor drives in (Top-down on a laptop, the phone's own view), a smooth drop over 1.15 s, rain
    // streaks over the frame thinning as it lands. Our own timing and framing (legal.md amber: a generic camera drop, not a
    // restaging of anyone's shot). The camera is lent for the frame only: set before the draw, put back after it
    // (a microtask), so the app's own camera never learns about it
    let arrival = null, rainFx = null;
    const _qN = new T.Quaternion(), _qH = new T.Quaternion(), _pN = new T.Vector3(), _hi = new T.Vector3(), _tg = new T.Vector3(), _upv = new T.Vector3(), _m4 = new T.Matrix4(), _Y = new T.Vector3(0, 1, 0);
    function arrivalDive() {
      if (!arrival) return;
      if (A.reduced()) return arrivalEnd(true);
      arrival = { phase: "dive", t0: performance.now(), dur: 1.15, spin: (Math.random() < 0.5 ? -1 : 1) * 0.55 };
      if (!rainFx) { rainFx = el("div", "pc-rainfx"); rainFx.setAttribute("aria-hidden", "true"); document.body.appendChild(rainFx); }
      document.body.classList.add("pc-diving");
    }
    function arrivalEnd(welcome) {
      if (!arrival) return;
      arrival = null;
      document.body.classList.remove("pc-arriving", "pc-diving");
      if (welcome) welcomePages();
    }
    function arrivalSkip() { if (!arrival) return; hideCard(false); arrivalEnd(true); }
    addEventListener("pointerdown", () => { if (arrival && arrival.phase === "dive") arrivalSkip(); }, true);
    addEventListener("keydown", (e) => { if (arrival && !e.metaKey && !e.ctrlKey && !e.altKey && !/^(Shift|Control|Alt|Meta)$/.test(e.key)) arrivalSkip(); }, true);
    function diveTick(dt) {
      if (!arrival || arrival.phase !== "dive") return;
      const u = (performance.now() - arrival.t0) / 1000 / arrival.dur; // (the wall clock: a slow phone lands on time too)
      if (u >= 1) return arrivalEnd(true);
      const e = u * u * u * (u * (u * 6 - 15) + 10), r = Math.min(1, e * 1.15), cam = A.camera, car = A.car(); // (it hangs a beat up high as the card lifts, drops, settles)
      _pN.copy(cam.position); _qN.copy(cam.quaternion);
      _tg.copy(A.warp(new T.Vector3(car.x, 0, car.z)));
      _hi.set(_tg.x, Math.max(_pN.y, 0) + 3000, _tg.z);
      _upv.set(0, 1, 0).applyQuaternion(_qN); _upv.y = 0; if (_upv.lengthSq() < 1e-6) _upv.set(0, 0, -1); _upv.normalize().applyAxisAngle(_Y, arrival.spin * (1 - e));
      _m4.lookAt(_hi, _tg, _upv); _qH.setFromRotationMatrix(_m4);
      cam.position.lerpVectors(_hi, _pN, e);
      cam.quaternion.copy(_qH).slerp(_qN, r);
      cam.updateMatrixWorld(true);
      const P = _pN.clone(), Q = _qN.clone();
      queueMicrotask(() => { cam.position.copy(P); cam.quaternion.copy(Q); cam.updateMatrixWorld(true); });
    }
    function welcomePages() {
      let seen = false; try { seen = sessionStorage.getItem("cz-polite-pager") === "1"; sessionStorage.setItem("cz-polite-pager", "1"); } catch {}
      if (!seen) { page("Welcome to Polite City. Please drive nicely."); page(A.isPhone() ? "Top-down here. Drag to drive." : "Top-down here. T for Street. Some say there are codes.", "TIP"); } // (r309: Top-down is this world's map view)
      else page("Welcome back to Polite City.");
    }

    // ===================== 4. the codes, 5. the easter eggs =====================
    let typed = "", bigT = 0, bowT = 0, pTimer = 0;
    window.__czKeyGate = (e) => {
      if (arrival && !e.metaKey && !e.ctrlKey && !e.altKey) arrivalSkip(); // r303: a drive key skips the arrival too (nav2 stops those before our own listener; the key still drives)
      return api.on && shown && (e.key === "t" || e.key === "T") && typed.endsWith("POLI"); // (nav2's keys ask first: its listener may run before ours)
    };
    // POLITE starts with P (the Postcard's key) and holds a T (the Top-down's): in this world a P waits 0.4 s for an O
    // before it opens the Postcard, and the T of "POLIT" is the code's, not the view's
    addEventListener("keydown", (e) => {
      if (!api.on || !shown || e.metaKey || e.ctrlKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test(e.target?.tagName || "") || e.key.length !== 1) return;
      const k = e.key.toUpperCase();
      if (k === "P" && !document.body.classList.contains("photo-on")) { e.preventDefault(); e.stopImmediatePropagation(); clearTimeout(pTimer); pTimer = setTimeout(() => { pTimer = 0; window.czPhotoOpen?.(); }, 400); }
      else if (pTimer && k === "O") { clearTimeout(pTimer); pTimer = 0; }
      if (k === "T" && typed.endsWith("POLI")) { e.preventDefault(); e.stopImmediatePropagation(); }
      typed = (typed + k).slice(-12);
      const hit = ["KERNING", "BIGGERLOGO", "POLITE"].find((c) => typed.endsWith(c));
      if (!hit) return;
      typed = ""; session.codes++; e.preventDefault(); e.stopImmediatePropagation();
      if (hit === "KERNING") { document.body.classList.add("pc-kern"); setTimeout(() => document.body.classList.remove("pc-kern"), 5000); moment("K E R N I N G", "Code accepted. Everything breathes for five seconds.", "code"); }
      if (hit === "BIGGERLOGO") { bigT = 8; document.body.classList.add("pc-biglogo"); setTimeout(() => document.body.classList.remove("pc-biglogo"), 8000); moment("Bigger logo", "Code accepted. The client is thrilled.", "code"); }
      if (hit === "POLITE") { if (!A.copBusy()) bowT = 4.2; moment("After you", "Code accepted. The Patrol insists.", "code"); }
    }, true);
    function eggsTick(dt, now) {
      // BIGGERLOGO: every board twice its size, back over a second
      if (boards) { bigT = Math.max(0, bigT - dt); const k = bigT > 1 ? 2 : 1 + bigT; if (boards.faceMat.uniforms.big.value !== k) boards.faceMat.uniforms.big.value = k; }
      // POLITE: the Patrol pulls up in front and bows (a nose dip, twice), then goes
      if (bowT > 0) {
        bowT -= dt; const car = A.car(), fx = Math.sin(car.h), fz = Math.cos(car.h), u = 4.2 - bowT;
        const dip = u > 0.8 && u < 3.2 ? Math.max(0, Math.sin((u - 0.8) * Math.PI / 0.6)) * 0.22 : 0;
        A.cop({ x: car.x + fx * 70 + fz * 10, z: car.z + fz * 70 - fx * 10, h: car.h + Math.PI, pitch: dip, lift: dip * 6, flash: false });
        if (bowT <= 0) A.cop(null);
      }
      // Final_FINAL_v7: pass it twice and its sign flickers to v8 (and stays)
      if (finalSign) {
        const car = A.car(), d = Math.hypot(car.x - finalSign.x, car.z - finalSign.z);
        if (d < 170 && !finalSign.near) { finalSign.near = true; finalSign.passes++; if (finalSign.passes === 2 && finalSign.state === "v7") { finalSign.state = "flick"; finalSign.ft = 0; } }
        if (d > 420) finalSign.near = false;
        if (finalSign.state === "flick") {
          finalSign.ft += dt; const on8 = finalSign.ft > 1.1 || Math.floor(finalSign.ft / 0.11) % 2 === 1, want = on8 ? "8" : "7";
          if (finalSign.shown !== want) { finalSign.shown = want; paintBoard(finalSign.ctx, BRANDS[0], 0, 0, 512, 256, `Final_FINAL_v${want}`); finalSign.tex.needsUpdate = true; }
          if (finalSign.ft > 1.1) { finalSign.state = "v8"; page("Final_FINAL_v8 is ready. Probably.", "PRINT SHOP"); }
        }
      }
    }

    // ===================== the frame =====================
    let shown = false, newsT = 0;
    const camW = new T.Vector3();
    let cardDue = false;
    api.setActive = (on) => {
      if (on && !api.on) cardDue = true; // the loading card once per entry into the world
      api.on = !!on;
      if (!on) { show(false); hideCard(false); arrivalEnd(false); sysActive(false); }
    };
    function show(v) {
      if (shown === v) return; shown = v;
      if (group) group.visible = v;
      lookSet(v);
      document.body.classList.toggle("pc-on", v);
      if (v) {
        if (!hud) hud = buildHud();
        if (cardDue) { cardDue = false; showCard(); }
        // r309 (Daniel, 26 Oct): Top-down replaces Bird's eye here, on phones too (nav2.js syncView); was: desktop only, a phone kept its view (the stick and the
        // tap both work in every view)
        const n = A.nav2(); if (n && n.D?.view === "sat") n.view("top", true);
        // (the welcome lines come with the arrival's end: welcomePages)
        radioLoad(); // laid in, silent (see RADIO_BASE)
        radioPaint();
      } else { radioStop(); if (arrival) { hideCard(false); arrivalEnd(false); } }
    }
    api.frame = (dt, now) => {
      if (!api.on) return;
      if (!api.built) { if (!A.isMap() || !build()) return; }
      sysInit();
      if (A.worldPrev()) return; // a Multiverse preview step (the world and back inside one frame): nothing changes
      const bc = document.body.classList, vis = A.isMap() && !bc.contains("kz-boot") && !bc.contains("kz-intro"); // (not under the opening)
      show(vis);
      if (!vis) return;
      const cam = A.camera; camW.copy(cam.position);
      const t = (now * 0.001) % 1000, fog = A.fog();
      if (streak) { const u = streak.material.uniforms; u.camW.value.copy(camW); u.amp.value = 0.75 * Math.min(1, pbShared.neonGain ?? 1); /* r304: the wet streaks follow phase B's night (polite-look: and stay under it) */ u.t.value = t; if (fog) { u.fogNear.value = fog.near; u.fogFar.value = fog.far; } }
      if (steam) steam.material.uniforms.t.value = t;
      PCU.pcT.value = t; PCU.pcLit.value = litFrac(pbHours());
      for (const tk of tickers) tk.tex.offset.x = (t * (tk.kind === "news" ? 0.035 : 0.028)) % 1;
      // the session, for the news ticker
      const car = A.car();
      if (session.lastCar) session.km += Math.min(60, Math.hypot(car.x - session.lastCar[0], car.z - session.lastCar[1])) * 0.33; // 1 unit ~ 0.33 m (the 1300 is ~4.2 m)
      session.lastCar = [car.x, car.z];
      newsT -= dt; if (newsT <= 0) { newsT = 6; const nt = tickers.find((x) => x.kind === "news"); if (nt) paintTicker(nt, newsText()); }
      cardTick(dt);
      diveTick(dt);
      hudTick(dt, now);
      eggsTick(dt, now);
      sysTick(dt, now);
    };
    api.dress = (v) => { if (group) group.visible = !!v && shown; }; // applyScheme, every call (a Multiverse preview of another world draws without the dressing)
    // ===================== 6. the systems hook (r303, phase B) =====================
    // Radu's traffic and vehicles, Iris's pedestrians and atmosphere (refs/gta-world/phaseB/) plug in here, not into the
    // dressing's code: registerSystem(name, { init(ctx), update(dt, now, ctx), dispose() }). init runs once the dressing
    // exists (the map and nav2's road graph are there), update every frame the world is on screen (not under the card or
    // the opening; the arrival's dive included), dispose when unregistered (or registered again under the same name).
    // ctx: T (three's classes), scene, camera, group (the system's own, under the dressing: hidden with it), graph (nav2's
    // road graph: E[] edges with pts/cum/len/w/kind), car(), places(), footprints(), warp(v), fog(), isPhone(), reduced(),
    // lite (phones and small machines: build less), page(msg, from), moment(title, sub), session, active (false while the
    // visitor is in another world; update is not called then)
    const systems = new Map();
    const sysCtx = () => ({ T, scene: A.scene, camera: A.camera, graph: A.nav2()?.graph, car: A.car, places: A.places, footprints: A.footprints, warp: A.warp, fog: A.fog, isPhone: A.isPhone, reduced: A.reduced, lite: low, page, moment, session, active: api.on });
    function sysInit() {
      if (!api.built) return;
      for (const [name, S] of systems) if (!S.ready) {
        S.ready = true; S.ctx = sysCtx(); S.ctx.group = new T.Group(); S.ctx.group.name = "polite-sys-" + name; group.add(S.ctx.group);
        try { S.sys.init?.(S.ctx); } catch (e) { S.dead = true; console.warn("[polite] system " + name + ":", e); }
      }
    }
    function sysTick(dt, now) { for (const [name, S] of systems) if (S.ready && !S.dead) { S.ctx.active = true; try { S.sys.update?.(dt, now, S.ctx); } catch (e) { S.dead = true; console.warn("[polite] system " + name + ":", e); } } }
    function sysActive(on) { for (const [name, S] of systems) if (S.ctx) { S.ctx.active = on; try { S.sys.active?.(on, S.ctx); } catch (e) { console.warn("[polite] system " + name + ":", e); } } } // (r304: an optional active(on) per system)
    api.registerSystem = (name, sys) => {
      if (!name || !sys) return false;
      api.unregisterSystem(name);
      systems.set(name, { sys, ready: false, dead: false, ctx: null });
      if (api.built) sysInit();
      return true;
    };
    api.unregisterSystem = (name) => {
      const S = systems.get(name); if (!S) return false;
      systems.delete(name);
      try { if (S.ready) S.sys.dispose?.(S.ctx); } catch (e) {}
      if (S.ctx?.group) S.ctx.group.removeFromParent();
      return true;
    };
    api.systems = () => [...systems.keys()];
    { const Q = (window.czPoliteSystems ||= []); for (const x of Q.splice(0)) api.registerSystem(x.name, x); Q.push = (x) => (api.registerSystem(x.name, x), 0); } // (registered before the world existed)
    // ===================== 6b. phase B (r304, beta): atmosphere, traffic, pedestrians (src/polite-b, Radu + Iris) =====================
    // Their modules register factories on window.__politePhaseB; each is wrapped as one of our systems. Their context is
    // their own (README in refs/gta-world/phaseB): `scene` is the system's group under the dressing (so it hides with the
    // world), atmosphere goes first (it publishes night / rain / neonGain to `shared`). They live only while the visitor is
    // in Polite City: leaving disposes them (the lit-window hook on the shared buildings material comes off with it, so
    // the other worlds keep their windows), coming back builds them again under the loading card (~35-100 ms).
    // The clock: Polite City is always night for now, so by day the modules get a night hour (22:30) and at night the real
    // Bucharest one (the real time-of-day grade of the whole world is a later decision)
    const bucH = () => { try { const p = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Bucharest", hour: "2-digit", minute: "2-digit", hour12: false }).formatToParts(new Date()); const g = (t) => +p.find((x) => x.type === t).value; return (g("hour") % 24) + g("minute") / 60; } catch { return 22.5; } };
    // how many windows are lit at Bucharest hour h (polite-look): most through the evening, few after 2, some early risers
    function litFrac(h) { const sm = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); }; const hh = h < 12 ? h + 24 : h; return Math.max(0.12, 0.12 + 0.4 * sm(17, 19.5, hh) * (1 - sm(23, 27, hh)) + 0.18 * sm(29, 30.5, hh) * (1 - sm(31, 32.5, hh))); }
    const pbHours = () => { const h = bucH(); return h >= 18.5 || h < 6.5 ? h : 22.5; };
    let pbShared = {};
    const pbCtx = (group) => ({
      T, scene: group, camera: A.camera, graph: A.nav2()?.graph,
      player: () => { const c = A.car(); return { x: c.x, z: c.z, h: c.h, v: A.nav2()?.speed?.() ?? 0 }; },
      lite: low, reduced: A.reduced, rng: Math.random, groundY: 1.6, footprints: A.footprints() || [], crossings: [],
      windowsMaterial: null, /* (polite-look: the lit windows are the look layer's, 1b) */ lights: null, rain: () => 0.7, copBusy: A.copBusy, clockHours: pbHours,
      sfx: pbSfx, shared: pbShared
    });
    function pbSfx(id, o) { if (sfxHas(id)) sfx(id, o); } // (an id Sorin's manifest lacks: nothing, no warning)
    function phaseB(name) {
      let m = null, c = null, grp = null;
      const make = () => { const f = window.__politePhaseB?.[name]; if (!f || !grp) return; m = f(name === "atmosphere" ? { fogBanks: 0 } : {}); c = pbCtx(grp); m.init(c); }; // (polite-look: no fog banks; the city's haze is enough)
      return {
        init(ctx) { grp = ctx.group; make(); },
        update(dt) { if (!m) make(); if (m) m.update(Math.min(dt, 0.05), c); },
        active(on) { if (!on && m) { m.dispose(); m = null; } },
        dispose() { if (m) m.dispose(); m = null; },
        get mod() { return m; }
      };
    }
    if (window.__politePhaseB) for (const n of ["atmosphere", "pedestrians"]) // (r306, Daniel: "the traffic isn't good: cars pass through each other": the ambient traffic is gone, its Patrol cruiser with it; nav2's own Polite Patrol stays)
       if (window.__politePhaseB[n]) api.registerSystem("pb-" + n, phaseB(n));
    api._pbSfx = pbSfx; api._mats = A.mats; api.pb = () => ({ player: A.car(), shared: pbShared, mods: Object.fromEntries([...systems].filter(([k]) => k.startsWith("pb-")).map(([k, S]) => [k, S.sys.mod])) }); // tests
    api.arrival = () => arrival && arrival.phase; // tests
    api._look = (on, roofs = on) => { PCU.pcOn.value = on ? 1 : 0; for (const o of roofMeshes) o.visible = !!roofs; }; // tests (polite-look: the A/B)
    api.page = page; api.moment = moment; api.flashStation = flashStation; api.showCard = showCard; api.session = session;
    return api;
  };
})();
