// Cromatic · photo mode (TASK-119, phase 1, behind ?photo). A camera that orbits the ride: distance, height, rotation,
// zoom and roll, with inertia and soft limits; it never goes under the street or into a building (the city's footprints).
// The worlds are the filters, the formats 9:16 / 4:5 / 1:1 / 16:9 are drawn over the view, the photo is a PNG at 2x
// (the city drawn again at that size, the world's own post and overlays, the cromaticstudios.com signature), shared
// through the phone's share sheet or downloaded. Desktop and phone have their own controls; everything is a real button
// or slider, keyboard included. app.js hands over what it needs (window.czPhoto(app)) and calls frame() before it draws.
(() => {
  "use strict";
  try { if (/[?&]photo\b/.test(location.search)) sessionStorage.setItem("cz-photo", "1"); } catch (e) {}
  // the keys: taken in the capture phase from the very start (before the map's and the street drive's own listeners
  // exist), handed to the photo mode while it is on, so an arrow framing a photo never drives the car
  let keyHook = null;
  if (/[?&]photo\b/.test(location.search) || (() => { try { return sessionStorage.getItem("cz-photo") === "1"; } catch (e) { return false; } })()) {
    addEventListener("keydown", (e) => keyHook && keyHook.down(e), true);
    addEventListener("keyup", (e) => keyHook && keyHook.up(e), true);
  }
  const FLAG = (() => { try { return /[?&]photo\b/.test(location.search) || sessionStorage.getItem("cz-photo") === "1"; } catch (e) { return /[?&]photo\b/.test(location.search); } })();
  const FORMATS = [
    { id: "9:16", w: 1080, h: 1920, label: "9:16", hint: "Story" },
    { id: "4:5", w: 1080, h: 1350, label: "4:5", hint: "Post" },
    { id: "1:1", w: 1080, h: 1080, label: "1:1", hint: "Square" },
    { id: "16:9", w: 1920, h: 1080, label: "16:9", hint: "Wide" }
  ];
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const reduced = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarse = () => matchMedia("(pointer: coarse)").matches || innerWidth < 760;

  function create(app) {
    const { camera, renderer } = app;
    const V3 = camera.position.constructor;
    // ---------- the camera's state: each parameter a goal and a value that follows it ----------
    // yaw: round the car (0 = behind it, radians), pitch: the camera's height as an angle over the car's middle,
    // dist: in car radii, fov: degrees (zoom), roll: radians
    const LIM = { pitch: [-0.06, 1.42], dist: [1.15, 12], fov: [14, 75], roll: [-0.35, 0.35] };
    const P = { yaw: 0, pitch: 0, dist: 0, fov: 0, roll: 0 }, G = { ...P }, VEL = { yaw: 0, pitch: 0 };
    let on = false, R0 = 30, T = new V3(), carY = 0, heading = 0, near = [], saved = null, fmt = FORMATS[0], tilt = true;
    const shift = { x: 0, y: 0 };
    let effDist = 3, lastT = 0, dragging = false, worldBusy = false, world0 = 0, lastShot = null, panelHidden = false, needSnap = true;
    const DEF = () => ({ yaw: 0.72, pitch: 0.2, dist: 3.1, fov: 34, roll: 0 });

    // ---------- the car: where it stands, its size, which way it faces ----------
    function measureCar() {
      const g = app.car(); if (!g) return false;
      g.updateMatrixWorld(true);
      let min = new V3(Infinity, Infinity, Infinity), max = new V3(-Infinity, -Infinity, -Infinity), any = false;
      const p = new V3();
      g.traverse((m) => {
        if (!m.isMesh || !m.visible || !m.geometry || (m.material && (m.material.transparent || m.material.blending === 2))) return;
        const gg = m.geometry; if (!gg.boundingBox) gg.computeBoundingBox();
        const b = gg.boundingBox;
        for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) { p.set(x, y, z).applyMatrix4(m.matrixWorld); min.min(p); max.max(p); any = true; }
      });
      if (!any) return false;
      const c = min.clone().add(max).multiplyScalar(0.5), size = max.clone().sub(min);
      R0 = clamp(Math.hypot(size.x, size.z) / 2, 8, 120);
      carY = min.y;
      // the target: the car's middle, a little under its roof (logical, then bent like the city)
      T.copy(app.warp(new V3(c.x, min.y + size.y * 0.42, c.z)));
      const f = new V3(0, 0, 1).applyQuaternion(g.getWorldQuaternion(new g.quaternion.constructor()));
      heading = Math.atan2(f.x, f.z);
      // the buildings that could stand between the camera and the car (logical footprints near it)
      const reach = R0 * LIM.dist[1] * 1.3 + 60;
      near = app.footprints().filter((b) => Math.hypot(b.x - c.x, b.z - c.z) < reach + Math.max(b.w, b.d));
      return true;
    }
    // is a point (bent coordinates) inside a building, or under the street?
    const _u = new V3();
    function blocked(q, margin, trees) {
      if (q.y < carY + 0.9) return true;
      _u.copy(q); app.unwarp(_u);
      for (const b of near) {
        if (b.tree && !trees) continue;
        if (_u.y > b.h + margin) continue;
        const dx = _u.x - b.x, dz = _u.z - b.z, c = Math.cos(b.ang || 0), s = Math.sin(b.ang || 0);
        const lx = dx * c - dz * s, lz = dx * s + dz * c;
        if (Math.abs(lx) < b.w / 2 + margin && Math.abs(lz) < b.d / 2 + margin) return true;
      }
      return false;
    }
    // how far the camera may go along a direction before it meets a wall or the street (in car radii)
    const _q = new V3();
    function freeDist(dir, want) {
      const steps = 40, margin = R0 * 0.08;
      // a building between the camera and the car: the camera comes in front of it. A tree only matters where the
      // camera itself is (a trunk in front is the visitor's composition to change; the lens inside a crown is not)
      let ok = 0, lim = want;
      for (let i = 1; i <= steps; i++) {
        const d = (want * i) / steps;
        _q.copy(T).addScaledVector(dir, d * R0);
        if (blocked(_q, margin, false)) { lim = Math.max(LIM.dist[0] * 0.92, ok - 0.06); break; }
        ok = d;
      }
      for (let d = lim; d > LIM.dist[0]; d -= 0.05) { _q.copy(T).addScaledVector(dir, d * R0); if (!blocked(_q, margin, true)) return d; }
      return Math.max(LIM.dist[0] * 0.92, Math.min(lim, LIM.dist[0]));
    }
    const dirOf = (yaw, pitch) => { const a = heading + Math.PI + yaw; return new V3(Math.sin(a) * Math.cos(pitch), Math.sin(pitch), Math.cos(a) * Math.cos(pitch)); };

    // ---------- each frame, before the city draws ----------
    function frame(now) {
      if (!on) return;
      const dt = Math.min(0.05, Math.max(0.001, (now - (lastT || now)) / 1000)); lastT = now;
      // inertia: a flick keeps turning, slowing down
      if (!dragging && !reduced()) {
        const fr = Math.exp(-dt * 4.2);
        if (Math.abs(VEL.yaw) > 1e-4) { G.yaw += VEL.yaw * dt; VEL.yaw *= fr; } else VEL.yaw = 0;
        if (Math.abs(VEL.pitch) > 1e-4) { G.pitch += VEL.pitch * dt; VEL.pitch *= fr; } else VEL.pitch = 0;
      }
      // soft limits: a goal past a limit is pulled back (rubber band) once the hand lets go
      if (!dragging) {
        for (const k of ["pitch", "dist", "fov", "roll"]) {
          const [a, b] = LIM[k];
          if (G[k] < a) { G[k] = lerp(G[k], a, 1 - Math.exp(-dt * 10)); if (k === "pitch") VEL.pitch = 0; }
          else if (G[k] > b) { G[k] = lerp(G[k], b, 1 - Math.exp(-dt * 10)); if (k === "pitch") VEL.pitch = 0; }
        }
      }
      const k = needSnap ? 1 : 1 - Math.exp(-dt * (reduced() ? 30 : 11));
      for (const key of Object.keys(P)) P[key] = lerp(P[key], G[key], k);
      // the walls: the camera comes in quickly when something is in the way, goes back out gently
      const dir = dirOf(P.yaw, P.pitch), free = freeDist(dir, P.dist);
      effDist = needSnap ? free : free < effDist ? lerp(effDist, free, 1 - Math.exp(-dt * 26)) : lerp(effDist, free, 1 - Math.exp(-dt * 5));
      effDist = Math.min(effDist, free + 0.02);
      needSnap = false;
      // the car sits in the middle of the format's frame, wherever the bars put the frame (a lens shift, eased)
      const gx = innerWidth / 2 - (guide.x + guide.w / 2), gy = innerHeight / 2 - (guide.y + guide.h / 2), ke = 1 - Math.exp(-dt * 9);
      shift.x = lerp(shift.x, gx, ke); shift.y = lerp(shift.y, gy, ke);
      place(camera, dir, effDist, P.fov, P.roll);
      syncSliders();
    }
    function place(cam, dir, d, fov, roll) {
      cam.position.copy(T).addScaledVector(dir, d * R0);
      cam.up.set(0, 1, 0);
      cam.lookAt(T);
      if (roll) cam.rotateZ(roll);
      cam.fov = fov; cam.near = Math.max(0.3, d * R0 * 0.02); cam.far = Math.max(cam.far, 30000);
      cam.aspect = innerWidth / innerHeight;
      cam.setViewOffset(innerWidth, innerHeight, shift.x, shift.y, innerWidth, innerHeight);
      cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);
    }

    // ---------- the UI ----------
    const root = document.createElement("div");
    root.className = "pm-root"; root.hidden = true;
    root.setAttribute("role", "dialog"); root.setAttribute("aria-label", "Photo mode");
    const worlds = app.worlds();
    root.innerHTML = `
      <div class="pm-guide" aria-hidden="true"><i class="pm-m t"></i><i class="pm-m b"></i><i class="pm-m l"></i><i class="pm-m r"></i>
        <div class="pm-frame"><i class="pm-third v1"></i><i class="pm-third v2"></i><i class="pm-third h1"></i><i class="pm-third h2"></i><span class="pm-wm">cromaticstudios.com</span></div></div>
      <div class="pm-flash" aria-hidden="true"></div>
      <div class="pm-top">
        <button class="pm-btn pm-exit" type="button" aria-label="Exit photo mode (Esc)"><span aria-hidden="true">×</span><b>Exit</b></button>
        <div class="pm-formats" role="radiogroup" aria-label="Format">${FORMATS.map((f, i) => `<button type="button" role="radio" aria-checked="${i === 0}" data-f="${f.id}" class="pm-chip"><b>${f.label}</b><small>${f.hint}</small></button>`).join("")}</div>
        <button class="pm-btn pm-hide" type="button" aria-pressed="false" aria-label="Hide the controls (H)"><span aria-hidden="true">◐</span><b>Clean view</b></button>
      </div>
      <div class="pm-panel" aria-label="Camera">
        <div class="pm-tabs" role="tablist"><button type="button" role="tab" aria-selected="true" data-tab="cam" class="pm-tab">Camera</button><button type="button" role="tab" aria-selected="false" data-tab="world" class="pm-tab">World</button></div>
        <div class="pm-pane pm-cam" role="tabpanel" data-pane="cam">
          ${[["dist", "Distance", 0], ["pitch", "Height", 1], ["yaw", "Rotation", 2], ["fov", "Zoom", 3], ["roll", "Tilt", 4]].map(([k, l]) => `<label class="pm-sl"><span>${l}</span><input type="range" data-k="${k}" min="0" max="1000" step="1" aria-label="${l}"><output></output></label>`).join("")}
          <div class="pm-row"><label class="pm-tog"><input type="checkbox" class="pm-tilt" checked><span>Miniature blur</span></label><button type="button" class="pm-btn pm-reset">Reset</button></div>
          <p class="pm-help pm-desk">Drag to orbit · wheel: distance · Shift+wheel: zoom · Q / E: tilt · arrows: rotate and height · Space: photo · H: clean view · Esc: exit</p>
          <p class="pm-help pm-touch">One finger: orbit · pinch: distance · twist: tilt · two fingers up / down: height</p>
        </div>
        <div class="pm-pane pm-worlds" role="tabpanel" data-pane="world" hidden>
          <div class="pm-wlist" role="radiogroup" aria-label="World">${worlds.map((w, i) => `<button type="button" role="radio" class="pm-world" data-i="${w.i}" style="--wb:${w.bg};--wa:${w.ac}"><i aria-hidden="true"></i><b>${w.n}</b></button>`).join("")}</div>
        </div>
      </div>
      <div class="pm-bottom">
        <button class="pm-shutter" type="button" aria-label="Take the photo (Space)"><i aria-hidden="true"></i></button>
      </div>
      <div class="pm-sheet" hidden role="dialog" aria-label="Your photo">
        <div class="pm-sheet-in"><img alt="Your photo of the Cromatic city"><div class="pm-sheet-b">
          <button type="button" class="pm-btn pm-share" hidden><b>Share</b></button>
          <a class="pm-btn pm-dl" download><b>Download PNG</b></a>
          <button type="button" class="pm-btn pm-again"><b>Take another</b></button></div>
          <p class="pm-meta mono"></p></div></div>
      <p class="pm-live" aria-live="polite"></p>`;
    document.body.appendChild(root);
    const $ = (s) => root.querySelector(s), $$ = (s) => [...root.querySelectorAll(s)];
    const live = (t) => { const l = $(".pm-live"); l.textContent = ""; setTimeout(() => (l.textContent = t), 30); };

    // the format guide: the frame the photo will have, as large as fits between the bars
    function layoutGuide() {
      const W = innerWidth, H = innerHeight, mob = root.classList.contains("pm-touchui");
      // the room the bars leave: on a phone, above the shutter (over the sheet); on a computer, between the panel and
      // its mirror on the left, over the shutter. A clean view takes nearly all of it
      let top = mob ? 60 : 70, bot = 118, side = 330;
      if (panelHidden) { top = mob ? 56 : 66; bot = mob ? 112 : 112; side = 16; }
      else if (mob) { const sh = $(".pm-shutter").getBoundingClientRect(); bot = sh.top > 0 ? H - sh.top + 10 : H * 0.5; side = 10; }
      // (on a computer the panel is on the right: the frame takes the room to its left)
      const left = mob || panelHidden ? side : 16, right = mob || panelHidden ? side : 330;
      const aw = W - left - right, ah = Math.max(80, H - top - bot), A = fmt.w / fmt.h;
      let gw = aw, gh = gw / A; if (gh > ah) { gh = ah; gw = gh * A; }
      const x = left + (aw - gw) / 2, y = top + (ah - gh) / 2;
      const set = (el, l, t, w, h) => Object.assign(el.style, { left: l + "px", top: t + "px", width: Math.max(0, w) + "px", height: Math.max(0, h) + "px" });
      set($(".pm-m.t"), 0, 0, W, y); set($(".pm-m.b"), 0, y + gh, W, H - y - gh); set($(".pm-m.l"), 0, y, x, gh); set($(".pm-m.r"), x + gw, y, W - x - gw, gh);
      set($(".pm-frame"), x, y, gw, gh);
      root.style.setProperty("--wm", Math.max(9, gw * 0.022) + "px");
      guide = { x, y, w: gw, h: gh };
    }
    let guide = { x: 0, y: 0, w: innerWidth, h: innerHeight };

    // sliders <-> parameters (each slider 0..1000 over its range; yaw wraps)
    const RANGE = { dist: LIM.dist, pitch: LIM.pitch, fov: LIM.fov, roll: LIM.roll, yaw: [-Math.PI, Math.PI] };
    const toS = (k, v) => { const [a, b] = RANGE[k]; if (k === "yaw") v = Math.atan2(Math.sin(v), Math.cos(v)); if (k === "fov") v = b + a - v; return Math.round(((clamp(v, a, b) - a) / (b - a)) * 1000); };
    const fromS = (k, s) => { const [a, b] = RANGE[k]; const v = a + (s / 1000) * (b - a); return k === "fov" ? b + a - v : v; };
    const text = { dist: (v) => `${(v * R0 * 0.083).toFixed(1)} m`, pitch: (v) => `${Math.round((v * 180) / Math.PI)}°`, yaw: (v) => `${Math.round(((((v * 180) / Math.PI) % 360) + 540) % 360 - 180)}°`, fov: (v) => `${Math.round(18 / Math.tan((v * Math.PI) / 360))} mm`, roll: (v) => `${Math.round((v * 180) / Math.PI)}°` };
    let slFocus = null;
    function syncSliders() {
      for (const s of $$(".pm-sl input")) {
        const k = s.dataset.k; if (s === slFocus && dragSl) continue;
        const nv = String(toS(k, G[k])); if (s.value !== nv) s.value = nv;
        const t = text[k](k === "dist" ? Math.min(G.dist, effDist) : G[k]); s.nextElementSibling.textContent = t; s.setAttribute("aria-valuetext", t);
      }
    }
    let dragSl = false;
    for (const s of $$(".pm-sl input")) {
      s.addEventListener("input", () => { const k = s.dataset.k; let v = fromS(k, +s.value); if (k === "yaw") { const cur = G.yaw, d = Math.atan2(Math.sin(v - cur), Math.cos(v - cur)); v = cur + d; VEL.yaw = 0; } if (k === "pitch") VEL.pitch = 0; G[k] = v; });
      s.addEventListener("pointerdown", () => { dragSl = true; slFocus = s; });
      s.addEventListener("pointerup", () => { dragSl = false; });
      s.addEventListener("focus", () => (slFocus = s)); s.addEventListener("blur", () => { if (slFocus === s) slFocus = null; dragSl = false; });
    }
    $(".pm-reset").addEventListener("click", () => { Object.assign(G, DEF()); VEL.yaw = VEL.pitch = 0; live("Camera reset"); });
    $(".pm-tilt").addEventListener("change", (e) => { tilt = e.target.checked; app.setTilt(tilt ? 1 : 0); });
    for (const t of $$(".pm-tab")) t.addEventListener("click", () => { for (const u of $$(".pm-tab")) u.setAttribute("aria-selected", String(u === t)); for (const p of $$(".pm-pane")) p.hidden = p.dataset.pane !== t.dataset.tab; });
    for (const b of $$(".pm-chip")) b.addEventListener("click", () => setFormat(b.dataset.f));
    function setFormat(id) { fmt = FORMATS.find((f) => f.id === id) || FORMATS[0]; for (const b of $$(".pm-chip")) b.setAttribute("aria-checked", String(b.dataset.f === fmt.id)); layoutGuide(); live(`Format ${fmt.label}, ${fmt.hint}`); }
    for (const b of $$(".pm-world")) b.addEventListener("click", () => setWorld(+b.dataset.i));
    function markWorld() { const i = app.worldIdx(); for (const b of $$(".pm-world")) b.setAttribute("aria-checked", String(+b.dataset.i === i)); }
    async function setWorld(i) {
      if (worldBusy || i === app.worldIdx()) return;
      worldBusy = true; root.classList.add("pm-busy");
      try { await app.setWorld(i); } catch (e) {} finally { worldBusy = false; root.classList.remove("pm-busy"); markWorld(); live(`World: ${worlds.find((w) => w.i === i)?.n || ""}`); }
    }
    $(".pm-exit").addEventListener("click", () => exit());
    $(".pm-hide").addEventListener("click", () => setClean(!panelHidden));
    function setClean(v) { panelHidden = v; root.classList.toggle("pm-clean", v); $(".pm-hide").setAttribute("aria-pressed", String(v)); requestAnimationFrame(layoutGuide); }
    $(".pm-shutter").addEventListener("click", () => shoot());
    $(".pm-again").addEventListener("click", () => closeSheet());

    // ---------- gestures: the canvas under the UI takes them (pointer events, with inertia) ----------
    const pts = new Map(); let g0 = null, lastMove = 0;
    const gestureLayer = $(".pm-guide");
    gestureLayer.style.pointerEvents = "auto"; gestureLayer.style.touchAction = "none";
    gestureLayer.addEventListener("pointerdown", (e) => {
      if (!on) return; gestureLayer.setPointerCapture(e.pointerId);
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY }); dragging = true; VEL.yaw = VEL.pitch = 0; g0 = snapshot(); lastMove = performance.now();
    });
    const snapshot = () => { const a = [...pts.values()]; if (a.length < 2) return { n: a.length, x: a[0]?.x, y: a[0]?.y }; const [p, q] = a; return { n: 2, d: Math.hypot(q.x - p.x, q.y - p.y), ang: Math.atan2(q.y - p.y, q.x - p.x), my: (p.y + q.y) / 2, dist: G.dist, roll: G.roll, pitch: G.pitch }; };
    gestureLayer.addEventListener("pointermove", (e) => {
      if (!pts.has(e.pointerId)) return;
      const prev = pts.get(e.pointerId), now = performance.now(), dt = Math.max(0.008, (now - lastMove) / 1000); lastMove = now;
      pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pts.size === 1) {
        const dx = e.clientX - prev.x, dy = e.clientY - prev.y, sc = (Math.PI * 1.1) / Math.max(320, innerWidth);
        const dyaw = -dx * sc, dpitch = dy * sc * 0.8;
        G.yaw += dyaw; G.pitch = rubber("pitch", G.pitch + dpitch);
        VEL.yaw = lerp(VEL.yaw, dyaw / dt, 0.5); VEL.pitch = lerp(VEL.pitch, dpitch / dt, 0.5);
      } else if (pts.size === 2 && g0 && g0.n === 2) {
        const s = snapshot();
        G.dist = rubber("dist", g0.dist * (g0.d / Math.max(10, s.d)));
        let da = s.ang - g0.ang; da = Math.atan2(Math.sin(da), Math.cos(da));
        G.roll = rubber("roll", g0.roll + da);
        G.pitch = rubber("pitch", g0.pitch + ((s.my - g0.my) / innerHeight) * 1.6);
      }
    });
    const up = (e) => { pts.delete(e.pointerId); g0 = pts.size ? snapshot() : null; if (!pts.size) { dragging = false; if (performance.now() - lastMove > 90) VEL.yaw = VEL.pitch = 0; } };
    gestureLayer.addEventListener("pointerup", up); gestureLayer.addEventListener("pointercancel", up);
    // past a limit, a drag meets more and more resistance (it springs back on release, in frame())
    function rubber(k, v) { const [a, b] = LIM[k], span = (b - a) * 0.12; if (v < a) return a - span * (1 - Math.exp(-(a - v) / span)); if (v > b) return b + span * (1 - Math.exp(-(v - b) / span)); return v; }
    gestureLayer.addEventListener("wheel", (e) => {
      if (!on) return; e.preventDefault();
      const d = clamp(e.deltaY, -120, 120);
      if (e.shiftKey || e.altKey) G.fov = clamp(G.fov * Math.exp(d * 0.0016), LIM.fov[0], LIM.fov[1]);
      else G.dist = clamp(G.dist * Math.exp(d * 0.0016), LIM.dist[0], LIM.dist[1]);
    }, { passive: false });
    gestureLayer.addEventListener("dblclick", () => { Object.assign(G, DEF()); });

    // ---------- the keyboard ----------
    const held = new Set();
    function onKey(e) {
      if (!on) return;
      const tag = (e.target && e.target.tagName) || "", typing = /INPUT|TEXTAREA|SELECT/.test(tag) && e.target.type !== "range" && e.target.type !== "checkbox";
      if (typing) return;
      const k = e.key;
      if (k === "Escape") { e.preventDefault(); e.stopImmediatePropagation(); if (!$(".pm-sheet").hidden) closeSheet(); else exit(); return; }
      if (!$(".pm-sheet").hidden) return;
      const onRange = e.target && e.target.type === "range";
      if ((k === " " || k === "Enter") && !/BUTTON|A/.test(tag) && !onRange) { e.preventDefault(); e.stopImmediatePropagation(); shoot(); return; }
      if (k === " " && /BUTTON/.test(tag)) return;
      if (onRange && /^Arrow|Home|End|Page/.test(k)) { e.stopImmediatePropagation(); return; } // (the slider's own keys)
      const map = { ArrowLeft: 1, ArrowRight: 1, ArrowUp: 1, ArrowDown: 1, q: 1, e: 1, Q: 1, E: 1, "+": 1, "=": 1, "-": 1, _: 1 };
      if (map[k]) { e.preventDefault(); e.stopImmediatePropagation(); held.add(k.toLowerCase()); return; }
      if (k === "h" || k === "H") { e.preventDefault(); e.stopImmediatePropagation(); setClean(!panelHidden); return; }
      if (k === "r" || k === "R") { e.preventDefault(); e.stopImmediatePropagation(); Object.assign(G, DEF()); return; }
      if (/^[1-4]$/.test(k) && !e.metaKey && !e.ctrlKey) { e.preventDefault(); e.stopImmediatePropagation(); setFormat(FORMATS[+k - 1].id); return; }
      if (/^Arrow|^[a-z]$/i.test(k)) e.stopImmediatePropagation(); // the map's own keys rest while the camera is ours
    }
    function onKeyUp(e) { held.delete(String(e.key).toLowerCase()); }
    // held keys move the goals smoothly (and give the same inertia as a flick when let go)
    function keysTick(dt) {
      if (!held.size) return;
      const s = dt;
      if (held.has("arrowleft")) { G.yaw += 1.4 * s; VEL.yaw = 1.4; } if (held.has("arrowright")) { G.yaw -= 1.4 * s; VEL.yaw = -1.4; }
      if (held.has("arrowup")) G.pitch = clamp(G.pitch + 0.9 * s, LIM.pitch[0], LIM.pitch[1]); if (held.has("arrowdown")) G.pitch = clamp(G.pitch - 0.9 * s, LIM.pitch[0], LIM.pitch[1]);
      if (held.has("q")) G.roll = clamp(G.roll + 0.5 * s, LIM.roll[0], LIM.roll[1]); if (held.has("e")) G.roll = clamp(G.roll - 0.5 * s, LIM.roll[0], LIM.roll[1]);
      if (held.has("+") || held.has("=")) G.dist = clamp(G.dist * Math.exp(-1.2 * s), LIM.dist[0], LIM.dist[1]); if (held.has("-") || held.has("_")) G.dist = clamp(G.dist * Math.exp(1.2 * s), LIM.dist[0], LIM.dist[1]);
    }
    const _frame = frame;
    let lastK = 0;
    function frameWithKeys(now) { const dt = Math.min(0.05, (now - (lastK || now)) / 1000); lastK = now; if (on) keysTick(dt); _frame(now); }

    // ---------- the photo ----------
    async function shoot() {
      if (!on || root.classList.contains("pm-shooting")) return;
      root.classList.add("pm-shooting");
      if (!reduced()) { const f = $(".pm-flash"); f.classList.remove("go"); void f.offsetWidth; f.classList.add("go"); }
      await new Promise((r) => requestAnimationFrame(() => setTimeout(r, 0)));
      let blob = null, size = null;
      for (const scale of [2, 1.5, 1]) {
        try { ({ blob, size } = await render(scale)); if (blob) break; } catch (e) { console.warn("[photo] a render failed at", scale, e); }
      }
      root.classList.remove("pm-shooting");
      if (!blob) { live("The photo could not be made. Try a smaller format."); return; }
      openSheet(blob, size);
    }
    // the city drawn again at the photo's size, from the same camera, through the same look, then the overlays
    function render(scale) {
      const W = Math.round(fmt.w * scale), H = Math.round(fmt.h * scale);
      const pr = renderer.getPixelRatio(), cv = renderer.domElement, sw = cv.width / pr, sh = cv.height / pr;
      // the frame on screen, exactly: the same camera, its picture cut to the guide's window (with the live lens shift)
      const sub = [innerWidth, innerHeight, shift.x + guide.x, shift.y + guide.y, guide.w, guide.h];
      let out = null;
      try {
        renderer.setPixelRatio(1); renderer.setSize(W, H, false);
        camera.aspect = innerWidth / innerHeight; camera.setViewOffset(...sub); camera.updateProjectionMatrix();
        app.setCapK(W / Math.max(1, guide.w * pr));
        app.draw(performance.now());
        out = document.createElement("canvas"); out.width = W; out.height = H;
        const c = out.getContext("2d"); c.drawImage(cv, 0, 0, W, H);
        overlays(c, W, H);
        signature(c, W, H);
      } finally {
        app.setCapK(1);
        renderer.setPixelRatio(pr); renderer.setSize(sw, sh, false);
        camera.setViewOffset(innerWidth, innerHeight, shift.x, shift.y, innerWidth, innerHeight); camera.updateProjectionMatrix();
        app.draw(performance.now()); // (the screen again, at once: no blank frame)
      }
      return new Promise((res) => out.toBlob((b) => res({ blob: b, size: [W, H] }), "image/png"));
    }
    // the world's screen layers (they are CSS over the canvas, so the PNG draws its own)
    function overlays(c, W, H) {
      const id = app.worldId(), map = app.isMap();
      if (id === "nightlife") { c.save(); c.globalCompositeOperation = "overlay"; const g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "rgba(64,118,255,.34)"); g.addColorStop(0.4, "rgba(42,78,210,.14)"); g.addColorStop(0.74, "rgba(255,148,58,.16)"); g.addColorStop(1, "rgba(255,120,40,.30)"); c.fillStyle = g; c.fillRect(0, 0, W, H); c.restore(); }
      if (id === "underwater") { c.save(); c.globalAlpha = map ? 0.45 : 1; let g = c.createRadialGradient(W / 2, 0, 0, W / 2, 0, Math.max(W, H) * 0.7); g.addColorStop(0, "rgba(120,240,255,.10)"); g.addColorStop(1, "rgba(120,240,255,0)"); c.fillStyle = g; c.fillRect(0, 0, W, H); g = c.createRadialGradient(W / 2, H * 1.1, 0, W / 2, H * 1.1, Math.max(W, H) * 0.9); g.addColorStop(0, "rgba(2,20,40,.55)"); g.addColorStop(1, "rgba(2,20,40,0)"); c.fillStyle = g; c.fillRect(0, 0, W, H); c.restore(); }
      if (id === "ghibli") { c.save(); c.globalAlpha = 0.42; c.globalCompositeOperation = "multiply"; const g = c.createRadialGradient(W / 2, H * 0.4, Math.min(W, H) * 0.35, W / 2, H * 0.4, Math.max(W, H) * 0.75); g.addColorStop(0, "rgba(120,90,40,0)"); g.addColorStop(1, "rgba(120,90,40,.32)"); c.fillStyle = g; c.fillRect(0, 0, W, H); paperGrain(c, W, H); c.restore(); }
      if (id === "orchid") petals(c, W, H);
    }
    function paperGrain(c, W, H) { const t = document.createElement("canvas"); t.width = t.height = 220; const x = t.getContext("2d"), im = x.createImageData(220, 220); for (let i = 0; i < im.data.length; i += 4) { const v = 140 + Math.random() * 60; im.data[i] = v * 0.45 * 2; im.data[i + 1] = v * 0.38 * 2; im.data[i + 2] = v * 0.25 * 2; im.data[i + 3] = 40 + Math.random() * 60; } x.putImageData(im, 0, 0); c.fillStyle = c.createPattern(t, "repeat"); c.fillRect(0, 0, W, H); }
    function petals(c, W, H) {
      const s = W / 1080;
      for (let i = 0; i < 22; i++) {
        const x = (((i * 47) % 100) / 100) * W, y = ((i * 37 + 11) % 100) / 100 * H, sc = 0.6 + ((i * 29) % 10) / 12, r = (((i * 77) % 360) * Math.PI) / 180;
        c.save(); c.translate(x, y); c.rotate(r); c.scale(sc * s * 1.4, sc * s * 1.4);
        const g = c.createLinearGradient(-8, -6, 8, 6); g.addColorStop(0, "#ffd9e6"); g.addColorStop(1, "#f7a1c1");
        c.fillStyle = g; c.shadowColor = "rgba(200,90,130,.25)"; c.shadowBlur = 6 * s; c.shadowOffsetY = 2 * s; c.globalAlpha = 0.9;
        c.beginPath(); c.moveTo(-8, 0); c.quadraticCurveTo(-8, -6, 0, -6); c.quadraticCurveTo(8, -6, 8, 0); c.quadraticCurveTo(8, 6, 0, 6); c.quadraticCurveTo(-8, 6, -8, 0); c.fill(); c.restore();
      }
    }
    // the signature: always there, small, in the corner (Daniel)
    function signature(c, W, H) {
      const fs = Math.round(Math.max(18, W * 0.021)), pad = Math.round(fs * 1.25), txt = "cromaticstudios.com";
      c.save(); c.font = `600 ${fs}px CromaticSans, "Helvetica Neue", Arial, sans-serif`; c.textAlign = "right"; c.textBaseline = "alphabetic";
      c.shadowColor = "rgba(0,0,0,.38)"; c.shadowBlur = fs * 0.5; c.shadowOffsetY = fs * 0.06;
      c.fillStyle = "rgba(255,255,255,.88)"; c.fillText(txt, W - pad, H - pad);
      const tw = c.measureText(txt).width; c.shadowColor = "transparent"; c.fillStyle = "#FED012";
      c.beginPath(); c.arc(W - pad - tw - fs * 0.55, H - pad - fs * 0.34, fs * 0.22, 0, Math.PI * 2); c.fill();
      c.restore();
    }
    let sheetURL = null;
    function openSheet(blob, size) {
      if (sheetURL) URL.revokeObjectURL(sheetURL);
      sheetURL = URL.createObjectURL(blob);
      const name = `cromatic-${app.worldId()}-${fmt.id.replace(":", "x")}-${new Date().toISOString().slice(0, 10)}.png`;
      const file = new File([blob], name, { type: "image/png" });
      lastShot = { blob, file, name };
      const sheet = $(".pm-sheet"); sheet.hidden = false; root.classList.add("pm-sheet-on");
      $(".pm-sheet img").src = sheetURL; $(".pm-sheet img").style.aspectRatio = `${size[0]} / ${size[1]}`;
      const dl = $(".pm-dl"); dl.href = sheetURL; dl.download = name;
      const share = $(".pm-share"); let can = false; try { can = !!(navigator.canShare && navigator.canShare({ files: [file] })); } catch (e) {}
      share.hidden = !can; dl.classList.toggle("pm-secondary", can);
      $(".pm-meta").textContent = `${size[0]} × ${size[1]} PNG · ${fmt.hint} ${fmt.label}`;
      live("Photo ready"); (can ? share : dl).focus();
    }
    $(".pm-share").addEventListener("click", async () => { if (!lastShot) return; try { await navigator.share({ files: [lastShot.file], title: "Cromatic Studios", text: "cromaticstudios.com" }); live("Shared"); } catch (e) { if (e && e.name !== "AbortError") live("Sharing did not work; download it instead"); } });
    function closeSheet() { $(".pm-sheet").hidden = true; root.classList.remove("pm-sheet-on"); $(".pm-shutter").focus(); }

    // ---------- in and out ----------
    function enter() {
      if (on || !app.canEnter()) return false;
      if (!measureCar()) return false;
      on = true; needSnap = true; lastT = lastK = 0; world0 = app.worldIdx();
      saved = { near: camera.near, far: camera.far, fov: camera.fov, focus: document.activeElement };
      Object.assign(G, DEF());
      // start from where the eye already is (the map's angle round the car), then glide to the portrait
      const off = camera.position.clone().sub(T), dist0 = off.length() / R0, yaw0 = Math.atan2(off.x, off.z) - heading - Math.PI, pitch0 = Math.asin(clamp(off.y / Math.max(1e-6, off.length()), -1, 1));
      Object.assign(P, { yaw: Math.atan2(Math.sin(yaw0), Math.cos(yaw0)), pitch: clamp(pitch0, LIM.pitch[0], LIM.pitch[1]), dist: clamp(dist0, LIM.dist[0], LIM.dist[1] * 3), fov: camera.fov, roll: 0 });
      { let d = G.yaw - P.yaw; d = Math.atan2(Math.sin(d), Math.cos(d)); G.yaw = P.yaw + d; }
      effDist = P.dist; needSnap = false; shift.x = shift.y = 0;
      app.onEnter(); app.setTilt(tilt ? 1 : 0);
      document.body.classList.add("photo-on"); root.hidden = false; root.classList.toggle("pm-touchui", coarse());
      setFormat(coarse() ? "9:16" : fmt.id); markWorld(); layoutGuide(); setClean(false);
      keyHook = { down: onKey, up: onKeyUp }; addEventListener("resize", layoutGuide);
      setTimeout(() => $(".pm-shutter").focus({ preventScroll: true }), 50);
      live("Photo mode. Drag to move round the ride; Space takes the photo.");
      return true;
    }
    async function exit() {
      if (!on) return;
      on = false; closeSheet(); held.clear(); pts.clear(); dragging = false;
      keyHook = null; removeEventListener("resize", layoutGuide);
      root.hidden = true; document.body.classList.remove("photo-on");
      camera.clearViewOffset(); camera.aspect = innerWidth / innerHeight;
      camera.near = saved.near; camera.far = saved.far; camera.fov = saved.fov; camera.updateProjectionMatrix();
      app.setTilt(1); app.onExit();
      if (app.worldIdx() !== world0) { try { await app.setWorld(world0); } catch (e) {} } // (a filter: the map goes back to the visitor's own world, and its ride)
      try { saved.focus && saved.focus.focus && saved.focus.focus({ preventScroll: true }); } catch (e) {}
    }
    return { get on() { return on; }, enter, exit, frame: frameWithKeys, toggle: () => (on ? exit() : enter()) };
  }
  window.czPhoto = FLAG ? create : null;
})();
