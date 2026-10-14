/* Cromatic Studios · intro lab (r141): a new opening, played over the live city.
   04 (the one we are finishing): the four reasons for a city, told the way a keynote would: one calm ground, lines
   that dissolve into each other on long ease-outs, the key word morphing in place (house, facade, brand), the ground
   dissolving to the city under a camera that never stops moving, each new sky arriving on a wash of its own colour,
   the cups as the one hard cut.
   01 (parked): the same words on the site's own kinetic stage (veils of glass, stamps, bursts, the coffee). */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lab = $(".lab"), city = $(".city"), veil = $(".veil"), words = $(".words"), kzhost = $(".kzhost"), over = $(".over"), tc = $(".tc");
  const phone = () => innerWidth < 760;
  if (phone()) lab.classList.add("lite");
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  /* ---------- the city: one live copy, driven like /onboarding/ does ---------- */
  let ready = false; const readyCbs = [];
  city.src = "/?drive&nointro&onb";
  addEventListener("message", (e) => { if (e.origin === location.origin && e.data && e.data.cz === "onb" && e.data.ev === "ready" && !ready) { ready = true; readyCbs.splice(0).forEach((f) => f()); } });
  const win = () => city.contentWindow;
  const send = (o) => { try { const w = win(); w.__onb ? w.__onb(o) : w.postMessage({ cz: "onb", ...o }, location.origin); } catch (e) {} };
  const whenReady = () => new Promise((r) => (ready ? r() : readyCbs.push(r)));
  // a change of world as a dissolve: the city's last frame (snapped inside the frame, right after its draw) is laid
  // over the city, the world changes under it, and it fades away
  const ghost = $(".ghost"), gctx = ghost.getContext("2d");
  let snapCb = null;
  addEventListener("message", (e) => { if (e.origin === location.origin && e.data && e.data.cz === "onb" && e.data.ev === "snap" && snapCb) { const f = snapCb; snapCb = null; f(); } });
  const dissolveTo = (id, ms = 420) => new Promise((res) => {
    let done = false; const go = () => { if (done) return; done = true; cur.camHold = performance.now() + ms + 40; send({ op: "scheme", id }); res(); };
    snapCb = () => {
      try {
        const src = win().__onbSnapCanvas?.(); if (!src) return go();
        if (ghost.width !== src.width || ghost.height !== src.height) { ghost.width = src.width; ghost.height = src.height; }
        gctx.drawImage(src, 0, 0);
        ghost.style.transition = "none"; ghost.style.opacity = "1";
        requestAnimationFrame(() => { go(); requestAnimationFrame(() => { ghost.style.transition = `opacity ${ms}ms ease`; ghost.style.opacity = "0"; }); });
      } catch (e) { go(); }
    };
    send({ op: "snap" });
    setTimeout(go, 400); // no snapshot came: a plain change
  });
  const CAM = {
    over: { t: [1350, 5200], dist: 6000, yaw: 0.3, pitch: 0.98 },
    worlds: { t: [880, 4420], dist: 2400, yaw: 0.5, pitch: 0.78 },
  };
  const cam = (c) => send({ op: "cam", t: c.t, dist: c.dist, yaw: c.yaw, pitch: c.pitch });
  const mix = (A, B, u) => ({ t: [lerp(A.t[0], B.t[0], u), lerp(A.t[1], B.t[1], u)], dist: lerp(A.dist, B.dist, u), yaw: lerp(A.yaw, B.yaw, u), pitch: lerp(A.pitch, B.pitch, u) });
  // a camera path through keyframes (absolute ms): a Catmull-Rom spline, so the move never stops or kinks at a key
  const path = (keys) => {
    const P = keys.map(([t, c]) => [t, [c.t[0], c.t[1], c.dist, c.yaw, c.pitch]]);
    return (ms) => {
      if (ms <= P[0][0]) return P[0][1];
      if (ms >= P[P.length - 1][0]) return P[P.length - 1][1];
      let i = 0; while (P[i + 1][0] < ms) i++;
      const [t1, p1] = P[i], [t2, p2] = P[i + 1], p0 = (P[i - 1] || P[i])[1], p3 = (P[i + 2] || P[i + 1])[1];
      const t = (ms - t1) / (t2 - t1), tt = t * t, ttt = tt * t;
      return p1.map((_, k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * tt + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * ttt));
    };
  };
  const camAt = (v) => cam({ t: [v[0], v[1]], dist: v[2], yaw: v[3], pitch: v[4] });

  /* ---------- the cups: the kinetic bundle's wall, filling the screen and falling (bridge) ---------- */
  const [kjs, kcss] = (lab.dataset.kz || "").split("|");
  let kzLoad = null;
  const loadKz = () => kzLoad || (kzLoad = new Promise((res) => {
    if (!kjs) return res(false);
    const l = document.createElement("link"); l.rel = "stylesheet"; l.href = kcss; document.head.appendChild(l);
    const s = document.createElement("script"); s.src = kjs; s.async = true; s.onload = () => res(true); s.onerror = () => res(false); document.body.appendChild(s);
  }));
  // the wall of cups is made and warmed at the start of a run (its porcelain programs compile then, out of sight),
  // so when it comes it comes at once; cups() then only lets it go
  const cupsPrep = async (tok, { lite = phone() } = {}) => {
    if (RM || !(await loadKz()) || !window.cromaticKinetic || tok !== cur.token) return null;
    let k = null;
    // the standing cup is an obstacle: the wall parts around it and the falling cups bounce off it (as /onboarding/'s end)
    const obstacles = () => { const el = over.querySelector(".cupbig"); if (!el) return []; const r = el.getBoundingClientRect(); return [{ x: (r.left + r.width / 2) / innerWidth, y: (r.top + r.height * 0.56) / innerHeight, r: (r.width * 0.4) / innerHeight, m: (phone() ? 0.022 : 0.04) * 1.2 }]; };
    try { k = window.cromaticKinetic(() => cur.onFinale?.(), async () => {}, { drop: true, lite, obstacles, onDrop: () => { try { cur.onDrop?.(); } catch (e) {} } }); } catch (e) { return null; }
    const st = document.body.querySelector(":scope > .kz");
    kzhost.className = "kzhost cupsonly";
    if (st) kzhost.appendChild(st);
    try { await k.warm?.(); } catch (e) {}
    if (tok !== cur.token) return null;
    cur.kz = k;
    return k;
  };
  // resolves when the cups have dropped (or, failing that, after a moment); onDrop fires as the first cup lets go
  const cups = (tok, { onDrop } = {}) => new Promise((done) => {
    let fin = false; const end = () => { if (!fin) { fin = true; done(); } };
    const k = cur.kz;
    if (!k || tok !== cur.token) return end();
    cur.onDrop = onDrop; cur.onFinale = end;
    try { k.bridge(); } catch (e) { return end(); }
    setTimeout(end, 7000);
  });
  // the city compiles every world out of sight before the run (the same warm-up /onboarding/ asks for), so a change of
  // sky behind the words is a cut, not a stall
  const cityWarm = async (tok) => {
    send({ op: "pause", on: true });
    await wait(120, tok);
    const t0 = performance.now();
    while (performance.now() - t0 < 12000) {
      send({ op: "warm" });
      await wait(400, tok);
      let left = 1; try { left = win().__onbWarmLeft?.() ?? 0; } catch (e) { left = 0; }
      if (!left) break;
    }
    send({ op: "pause", on: false });
    if (phone()) send({ op: "rate", half: true }); else send({ op: "rate", half: false, dpr: Math.min(1, Math.sqrt(1.6e6 / (innerWidth * innerHeight))) }); // the city behind the words: at most 1x, at most ~1.6 M pixels (it moves, nobody counts them)
  };

  /* ---------- a small timeline ---------- */
  const cur = { token: 0, t0: 0, kz: null, lines: new Set(), running: false, camOn: false, gone: null };
  const abort = () => new Error("abort");
  const wait = (ms, tok) => new Promise((res, rej) => setTimeout(() => (tok === cur.token ? res() : rej(abort())), ms));
  const tween = (ms, fn, tok, ease = easeIO) => new Promise((res, rej) => {
    const t0 = performance.now();
    const tick = (now) => { if (tok !== cur.token) return rej(abort()); const u = Math.min(1, (now - t0) / ms); fn(ease(u)); if (u < 1) requestAnimationFrame(tick); else res(); };
    requestAnimationFrame(tick);
  });
  const veilTo = (o, ms = 900, bg) => { if (bg) veil.style.setProperty("--veil", bg); veil.style.setProperty("--vt", ms + "ms"); veil.style.opacity = o; };

  /* ---------- the words ---------- */
  // parts: "word" or { w, fx, pill, cls, d }; a line enters word by word (stagger ms between them)
  // a word as letters, each with its own small delay (the calm lines move letter by letter)
  const letterize = (s, text, from = 0) => { s.innerHTML = ""; [...text].forEach((ch, j) => { const l = document.createElement("i"); l.className = "l"; l.textContent = ch; l.style.setProperty("--ld", (from + j * 16) + "ms"); s.appendChild(l); }); };
  const line = (parts, { cls = "", fx = "stamp", stagger = 110, delay = 0, letters = false } = {}) => {
    const el = document.createElement("div"); el.className = "kl " + cls;
    parts.forEach((p, i) => {
      const w = typeof p === "string" ? { w: p } : p;
      if (w.br || w.brm) { const r = document.createElement("i"); r.className = w.brm ? "brm" : "br"; el.appendChild(r); return; } // a forced line break (brm: on phones only)
      const s = document.createElement("span");
      s.className = "kw fx-" + (w.fx || fx) + (w.pill ? " pill pill-" + w.pill : "") + (w.cls ? " " + w.cls : "");
      if (letters && w.pill) { const wn = document.createElement("span"); wn.className = "wn"; letterize(wn, w.w); s.appendChild(wn); }
      else if (letters) letterize(s, w.w); else s.textContent = w.w;
      s.style.setProperty("--d", (delay + (w.d ?? i * stagger)) + "ms");
      el.appendChild(s);
    });
    words.appendChild(el);
    requestAnimationFrame(() => el.classList.add("in"));
    return el;
  };
  const clearAll = () => { words.innerHTML = ""; over.innerHTML = ""; };

  /* ---------- the common start: the city ready, hidden under the ground ---------- */
  const prep = async (tok, { veilColor = "#fbfaf5", at = CAM.worlds } = {}) => {
    veil.style.setProperty("--vt", "0ms"); veil.style.setProperty("--veil", veilColor); veil.style.opacity = 1; veil.classList.remove("warm");
    clearAll();
    await whenReady();
    if (tok !== cur.token) throw abort();
    send({ op: "pause", on: false }); send({ op: "mode", map: true }); send({ op: "scheme", id: "monument" }); send({ op: "frame" });
    cam(at);
    city.classList.add("on");
    await wait(80, tok);
  };

  /* ================= 04 · the final ================= */
  // the worlds, in the order they pass behind "yours.": id, sky (the wash), the pill's colour, the chip's name
  const WORLDS = [
    ["nightlife", "#121d3a", "#FF9E3D", "Night Mode"], ["ghibli", "#e4f1f4", "#e0b25a", "Ghib.ly"], ["orchid", "#fbeef3", "#f08bb4", "Sakura"],
    ["sketch", "#f6f3ec", "#ffd84a", "Sketchbook"], ["underwater", "#0b3b5c", "#3de0d0", "Underwater"], ["monument", "#f6e2d8", "#FED012", "Cromatic"],
  ];
  const wash = (color) => { const b = document.createElement("i"); b.className = "wash"; b.style.background = color; over.appendChild(b); setTimeout(() => b.remove(), 700); };
  const html = (h) => { const d = document.createElement("div"); d.innerHTML = h; const n = d.firstElementChild; over.appendChild(n); return n; };
  // the pill's word changes in place: the old word's letters leave while the new word's letters arrive, in the same
  // place, the pill easing between the two widths under them (a crossfade: the pill is never seen empty)
  const morph = async (el, list, every, tok) => {
    for (const [w, color] of list) {
      await wait(every, tok);
      if (!el.isConnected) return;
      const w0 = el.offsetWidth;
      const old = el.querySelector(":scope > .wn"); if (!old) return;
      old.className = "wv"; [...old.querySelectorAll(".l")].forEach((l, j) => l.style.setProperty("--lo", (j * 14) + "ms"));
      const nw = document.createElement("span"); nw.className = "wn m"; letterize(nw, w);
      el.appendChild(nw);
      el.style.width = "auto"; old.style.display = "none";
      const w1 = el.offsetWidth; old.style.display = ""; el.style.width = w0 + "px"; void el.offsetWidth;
      el.classList.add("mw"); el.style.width = w1 + "px"; if (color) el.style.background = color;
      await wait(620, tok);
      old.remove(); el.classList.remove("mw"); el.style.width = "";
    }
  };
  // the run's clock: at(ms) waits for its moment on the clock, and the clock can be pushed forward (a click skips
  // to the next beat), so everything after the push happens at once, in order
  const at = (ms, tok) => new Promise((res, rej) => { const tick = () => { if (tok !== cur.token) return rej(abort()); if (performance.now() - cur.t0 >= ms) res(); else requestAnimationFrame(tick); }; tick(); });
  const elapsed = () => performance.now() - cur.t0;
  const BEATS4 = [300, 3350, 6300, 12500, 15000, 16300]; // where each beat begins on the clock
  const v4 = async (tok) => {
    await prep(tok, { at: { t: [1000, 4800], dist: 3400, yaw: 0.2, pitch: 0.98 } });
    veil.classList.add("warm");
    lab.classList.add("warming");
    await cityWarm(tok);
    await cupsPrep(tok);
    lab.classList.remove("warming");
    cur.t0 = performance.now();
    cur.running = true; lab.classList.add("running");
    meter.begin();
    const soft = (parts, o = {}) => { const el = line(parts, { fx: "soft", stagger: 55, letters: true, ...o }); cur.lines.add(el); return el; };
    // a line leaves letter by letter in a short cascade; a pill leaves whole, with its letters inside it
    const gone = (el) => {
      if (!el || !el.isConnected) return; cur.lines.delete(el);
      el.querySelectorAll(".l").forEach((l, j) => l.style.setProperty("--lo", Math.min(120, j * 5) + "ms"));
      // a forgotten letter leaves from where it drifted to, with what little was left of it (no jump back to full)
      el.querySelectorAll(".kw.forget .l").forEach((l) => { const cs = getComputedStyle(l); l.style.opacity = cs.opacity; l.style.transform = cs.transform; l.style.animation = "none"; l.style.transition = "opacity .3s ease"; requestAnimationFrame(() => { l.style.opacity = "0"; }); });
      el.classList.add("outsoft"); setTimeout(() => el.remove(), 600);
    };
    cur.gone = gone;
    // a word is forgotten: its letters drift apart and out of focus, each on its own moment (k: how far it goes)
    const forget = (w, k = 1, spread = 700, from = 0) => { if (!w) return; const ls = [...w.querySelectorAll(".l")]; ls.forEach((l, j) => { const u = ls.length > 1 ? j / (ls.length - 1) : 0; l.style.setProperty("--lo", (from + (0.35 * u + 0.65 * ((j * 7) % 10) / 10) * spread).toFixed(0) + "ms"); l.style.setProperty("--fx", ((u - 0.5) * 26 * k).toFixed(1) + "px"); l.style.setProperty("--fy", (-(5 + ((j * 3) % 5) * 2) * k).toFixed(1) + "px"); l.style.setProperty("--fo", k >= 1 ? 0.06 : 0.3); }); w.classList.add("forget"); };
    const late = (ms) => elapsed() > ms + 450; // a moment the clock was pushed past: skip what it would have done
    // the camera, start to end, one continuous move (it only shows from 6.3 s, when the ground dissolves); it lets go
    // of the city at the end, where the map's own hands take over
    const road = path([
      [0, { t: [1000, 4800], dist: 3400, yaw: 0.2, pitch: 0.98 }],
      [5800, { t: [1000, 4800], dist: 3400, yaw: 0.2, pitch: 0.98 }],
      [8200, { t: [880, 4420], dist: 2350, yaw: 0.48, pitch: 0.8 }],
      [11200, { t: [880, 4420], dist: 2100, yaw: 0.7, pitch: 0.75 }],
      [13800, { t: [900, 4400], dist: 1950, yaw: 0.9, pitch: 0.7 }],
      [15800, { t: [1000, 4700], dist: 2600, yaw: 1.02, pitch: 0.8 }],
      [18800, { t: [1300, 5100], dist: 5400, yaw: 1.18, pitch: 0.98 }],
      [21500, { t: [1300, 5100], dist: 5400, yaw: 1.22, pitch: 0.98 }],
    ]);
    cur.camOn = true; cur.camOff = 0; cur.camHold = 0; let camLast = performance.now();
    (function drive(now) { if (tok !== cur.token || !cur.camOn) return; if (now < cur.camHold) cur.camOff += now - camLast; camLast = now; camAt(road(now - cur.t0 - cur.camOff)); requestAnimationFrame(drive); })(performance.now());
    // 1 · nobody remembers a thumbnail: a row of thumbnails under the word, forgotten with it
    await at(300, tok);
    const a = soft(["Nobody", "remembers", { br: true }, { w: "a", d: 260 }, { w: "thumbnail.", cls: "thumb", d: 330 }], { cls: "calm" });
    await at(1250, tok);
    const th = a.querySelector(".thumb");
    if (th && th.isConnected && !late(1250)) {
      // a grid of thumbnails behind the word (the kind nobody remembers): nine cells, then it falls apart, each cell
      // drifting its own way, out of focus, and the word goes dim with it
      const r = th.getBoundingClientRect();
      const grid = html(`<div class="tgrid">${Array.from({ length: 9 }, (_, i) => `<i style="--i:${i};--dx:${((i % 3) - 1) * 34}px;--dy:${(Math.floor(i / 3) - 1) * 26}px;--rz:${((i * 7) % 11 - 5) * 3}deg"></i>`).join("")}</div>`);
      grid.style.left = (r.left + r.width / 2) + "px"; grid.style.top = (r.top + r.height / 2) + "px";
      grid.style.setProperty("--gw", Math.round(r.width + 120) + "px"); grid.style.setProperty("--gh", Math.round(r.height * 3) + "px");
    }
    await at(1750, tok); over.querySelector(".tgrid")?.classList.add("apart"); forget(th, 0.3, 500, 150); forget(a.querySelectorAll(".kw")[1], 0.25, 500, 400);
    await at(2750, tok); gone(a); { const g = over.querySelector(".tgrid"); if (g) { g.classList.add("outfast"); setTimeout(() => g.remove(), 240); } }
    // 2 · but someone could remember a house → facade → brand
    await at(3350, tok);
    const b = soft(["But", "someone", "could", { br: true }, { w: "remember", d: 300 }, { w: "a", d: 360 }, { brm: true }, { w: "house.", pill: "g", d: 440 }], { cls: "calm" });
    await at(4350, tok);
    if (!late(4350)) await morph(b.querySelector(".pill"), [["facade.", "#119BFE"], ["brand.", "#FED012"]], 640, tok);
    await at(6100, tok); gone(b);
    // 3 · the ground dissolves to the city; nine worlds, one will feel like yours (the sky changes behind the words,
    // the worlds' own chips along the bottom, the one on screen lit)
    await at(6300, tok); veilTo(0, 1300);
    await at(6900, tok);
    const c = soft(["Nine", "worlds", "over", "the", "same", "streets.", { br: true }, { w: "One", d: 900 }, { w: "will", d: 955 }, { w: "feel", d: 1010 }, { w: "like", d: 1065 }, { w: "yours.", pill: "y", d: 1220 }], { cls: "calm mid onCity" });
    const yours = c.querySelector(".pill");
    const chips = html(`<div class="wchips">${WORLDS.map(([id, , col, name], i) => `<span class="wchip" data-w="${id}" style="--wc:${col};--i:${i}">${name}</span>`).join("")}</div>`);
    for (let i = 0; i < WORLDS.length; i++) {
      await at(8600 + i * 500, tok);
      if (late(8600 + i * 500)) continue;
      const [id, , pc] = WORLDS[i];
      yours.style.background = pc;
      chips.querySelectorAll(".wchip").forEach((ch) => ch.classList.toggle("on", ch.dataset.w === id));
      dissolveTo(id);
    }
    await at(11900, tok); gone(c); chips.classList.add("gone"); setTimeout(() => chips.remove(), 700);
    // 4 · that's how the right brand feels like: the site's own XP bar fills up under the words
    await at(12500, tok);
    const d = soft(["That's", "how", "the", { w: "right", pill: "y", d: 280 }, { w: "brand", d: 330 }, { w: "feels", d: 380 }, { w: "like.", d: 430 }], { cls: "calm mid onCity" });
    const xp = html(`<div class="xpbar"><span class="xp-fill"></span><span class="xp-sun"><svg viewBox="0 0 24 24" width="20" height="20"><g fill="#FED012"><circle cx="12" cy="12" r="5"/><path d="M12 1l1.4 4h-2.8zM12 23l-1.4-4h2.8zM1 12l4-1.4v2.8zM23 12l-4 1.4v-2.8zM4.2 4.2l3.8 1.9-1.9 1.9zM19.8 19.8l-3.8-1.9 1.9-1.9zM4.2 19.8l1.9-3.8 1.9 1.9zM19.8 4.2l-1.9 3.8-1.9-1.9z"/></g></svg></span><span class="xp-label">YOU + YOUR BRAND</span><span class="xp-num"><b>0</b> XP</span></div>`);
    xp.style.setProperty("--w", (xp.getBoundingClientRect().width - 26) + "px");
    requestAnimationFrame(() => xp.classList.add("in"));
    { const n = xp.querySelector("b"), t0 = performance.now(); const run = () => { if (tok !== cur.token || !xp.isConnected) return; const u = Math.min(1, (performance.now() - t0 - 500) / 1500); const e = u <= 0 ? 0 : 1 - Math.pow(1 - u, 3); xp.style.setProperty("--f", e.toFixed(3)); n.textContent = Math.round(225 * e); if (u < 1) requestAnimationFrame(run); else xp.classList.add("full"); }; run(); }
    await at(14400, tok); gone(d); xp.classList.add("gone"); setTimeout(() => xp.remove(), 700);
    // 5 · and like good coffee: the studio's cup turns up beside the words; the words leave as the wall of cups comes
    await at(15000, tok);
    const e = soft(["And", "like", "good", { w: "coffee.", pill: "y", d: 300 }], { cls: "calm mid onCity hi" });
    const cup = html(`<i class="cupbig c4"></i>`);
    await at(16100, tok); gone(e);
    await at(16300, tok);
    // 6 · the cups fall onto the city, which becomes the map itself, its interface up, and the last line over it
    lab.classList.add("ending");
    // the map's interface is built while the wall of cups covers the screen (its cost lands out of sight), so when
    // the cups fall the real map is already there, interface and all
    setTimeout(() => { if (tok === cur.token) { send({ op: "ui", on: true, welcome: false }); city.classList.add("live"); } }, 1100);
    // the last line comes as the cups are still falling (the first one has let go), not after they have settled
    let letGo = null; const dropP = new Promise((r) => (letGo = r));
    const cupP = cups(tok, { onDrop: () => letGo() });
    await Promise.race([dropP, cupP]);
    if (tok !== cur.token) return;
    await wait(650, tok);
    const f = soft(["There's", "always", "a", "good", { w: "coffee", pill: "y", d: 300 }, { w: "around.", d: 360 }], { cls: "calm mid onCity lo" });
    await cupP;
    if (tok !== cur.token) return;
    cur.camOn = false; // the map's own hands from here
    await wait(700, tok); gone(f); over.querySelector(".cupbig")?.classList.add("gone");
    await wait(700, tok);
    finish(tok);
  };
  // the end state: the real map, its interface, the welcome card, the lab's chrome out of the way
  const finish = (tok) => {
    if (tok !== cur.token) return;
    cur.running = false; cur.camOn = false; meter.end();
    lab.classList.remove("running", "ending"); lab.classList.add("done");
    send({ op: "ui", on: true, welcome: true, welcomeIn: 600 });
    city.classList.add("live");
  };
  // a click (or Space / →) skips to the next beat: the clock is pushed forward, what is on screen leaves at once
  const next = () => {
    if (!cur.running) return;
    const e = elapsed();
    const n = BEATS4.find((t) => t > e + 80);
    if (n == null) { skip(); return; }
    cur.lines.forEach((el) => { el.classList.add("outfast"); setTimeout(() => el.remove(), 220); }); cur.lines.clear();
    over.querySelectorAll(".tgrid, .wchips, .xpbar, .cupbig").forEach((x) => { x.classList.add("outfast"); setTimeout(() => x.remove(), 220); });
    cur.t0 -= (Math.max(e, n - 200) - e);
  };

  /* ================= 01 · parked: the site's own kinetic stage, with the new words ================= */
  const C = { y: "#FED012", b: "#119BFE", g: "#28C840", r: "#F65342", l: "#B098C8" };
  const BEATS1 = [
    { veil: C.y, tr: "iris", marq: "", lines: [[{ w: "Nobody" }, { w: "remembers" }], [{ w: "a" }, { w: "thumbnail.", fx: "fade" }]], hold: 520 },
    { veil: C.r, tr: "blinds", marq: "", lines: [[{ w: "But" }, { w: "someone" }, { w: "could" }], [{ w: "remember" }, { w: "a" }, { w: "house.", p: C.y, fx: "cycle", alt: ["facade.", "brand."] }]], hold: 2100 },
    { veil: "none", tr: "iris", marq: "", lines: [[{ w: "Nine" }, { w: "worlds" }, { w: "over" }, { w: "the" }, { w: "same" }, { w: "streets." }], [{ w: "One" }, { w: "will" }, { w: "feel" }, { w: "like" }, { w: "yours.", p: C.y, fx: "stamp", burst: 1 }]], hold: 900 },
    { veil: C.b, tr: "blinds", marq: "", lines: [[{ w: "That" }, { w: "is" }, { w: "what" }, { w: "the" }, { w: "right", p: C.r, fx: "stamp" }], [{ w: "brand" }, { w: "feels" }, { w: "like." }]] },
    { veil: C.g, tr: "doors", marq: "", coffee: 1, lines: [[{ w: "And" }, { w: "like" }, { w: "good" }, { w: "coffee.", p: C.y, fx: "stamp" }]] },
    { veil: C.y, tr: "iris", marq: "", coffee: 2, lines: [[{ w: "There's" }, { w: "always" }, { w: "a" }, { w: "good" }], [{ w: "coffee", p: C.b, fx: "stamp" }, { w: "around." }]] },
  ];
  const v1 = async (tok) => {
    await prep(tok);
    if (RM || !(await loadKz()) || !window.cromaticKinetic || tok !== cur.token) return;
    let k = null;
    const played = new Promise((res) => {
      k = window.cromaticKinetic(() => res(), async () => {}, {
        drop: true, lite: phone(), beats: BEATS1,
        onBeat: (i, beat) => {
          if (tok !== cur.token || beat.veil !== "none") return;
          veilTo(0, 0);
          WORLDS.forEach(([id], j) => setTimeout(() => { if (tok === cur.token) send({ op: "scheme", id }); }, 600 + j * 340));
        },
        onDrop: () => { veilTo(0, 0); tween(2400, (u) => cam(mix(CAM.worlds, CAM.over, u)), tok).catch(() => {}); },
      });
    });
    const st = document.body.querySelector(":scope > .kz");
    kzhost.className = "kzhost full";
    if (st) kzhost.appendChild(st);
    try { await k.warm?.(); } catch (e) {}
    if (tok !== cur.token) return;
    cur.kz = k;
    k.resume();
    await played;
  };

  /* ---------- the frame meter: how long every frame took (a bar each), the run's dropped share and its worst moments ---------- */
  const meter = (() => {
    const box = document.createElement("div"); box.className = "meter";
    box.innerHTML = '<canvas width="300" height="44"></canvas><span class="mono"></span>';
    document.body.appendChild(box);
    const cv = box.querySelector("canvas"), ctx = cv.getContext("2d"), txt = box.querySelector("span");
    const N = 150, ring = new Float32Array(N); let head = 0, last = 0, run = null;
    const begin = () => { run = { t0: performance.now(), n: 0, dropped: 0, worst: [], sum: 0 }; };
    const end = () => { if (!run) return; const r = run; run = null; report(r, true); };
    const report = (r, fin) => {
      const w = r.worst.slice().sort((a, b) => b[1] - a[1]).slice(0, 3).map((x) => `${Math.round(x[1])} ms @ ${(x[0] / 1000).toFixed(1)}s`).join(" · ");
      txt.textContent = `${fin ? "run" : "live"} · ${Math.round(1000 / (r.sum / Math.max(1, r.n)))} fps · dropped ${(100 * r.dropped / Math.max(1, r.n + r.dropped)).toFixed(1)}%` + (w ? ` · worst ${w}` : "");
    };
    const tick = (now) => {
      const dt = last ? now - last : 16.7; last = now;
      ring[head] = dt; head = (head + 1) % N;
      const W = cv.width, H = cv.height;
      ctx.clearRect(0, 0, W, H);
      for (let i = 0; i < N; i++) { const v = ring[(head + i) % N]; if (!v) continue; const h = Math.min(H, v / 100 * H); ctx.fillStyle = v < 20 ? "#28C840" : v < 34 ? "#FED012" : "#F65342"; ctx.fillRect(i * 2, H - h, 2, h); }
      if (run) {
        run.n++; run.sum += dt;
        const d = Math.max(0, Math.round(dt / 16.667) - 1); run.dropped += d;
        if (dt > 40) run.worst.push([now - run.t0, dt]);
        if (run.n % 30 === 0) report(run, false);
      }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    return { begin, end };
  })();

  /* ---------- skip: straight to the end, the city seen whole ---------- */
  const skip = () => {
    cur.token++; const tok = cur.token; meter.end();
    try { cur.kz?.pause?.(); } catch (e) {}
    kzhost.innerHTML = ""; kzhost.className = "kzhost"; cur.kz = null;
    clearAll(); cur.lines.clear(); lab.classList.remove("warming", "running", "ending");
    whenReady().then(() => {
      if (tok !== cur.token) return;
      veilTo(0, 700);
      send({ op: "pause", on: false }); send({ op: "scheme", id: "monument" }); cam(CAM.over);
      city.classList.add("on");
      finish(tok);
    });
    document.querySelectorAll(".tabs button").forEach((b) => b.setAttribute("aria-pressed", "false"));
  };
  $(".skip").addEventListener("click", skip);
  $(".stage").addEventListener("click", (e) => { if (!lab.classList.contains("done")) next(); });
  addEventListener("keydown", (e) => { if (e.key === " " || e.key === "ArrowRight") { e.preventDefault(); next(); } });

  /* ---------- play, replay, switch ---------- */
  const V = { 1: v1, 4: v4 };
  let which = 4;
  const start = (n) => {
    if (!V[n]) return;
    which = n;
    cur.token++;
    const tok = cur.token;
    cur.t0 = performance.now();
    try { cur.kz?.pause?.(); } catch (e) {}
    kzhost.innerHTML = ""; kzhost.className = "kzhost"; cur.kz = null; cur.onDrop = cur.onFinale = null;
    clearAll(); cur.lines.clear(); cur.running = false; cur.camOn = false; lab.classList.remove("warming", "running", "ending", "done"); ghost.style.transition = "none"; ghost.style.opacity = "0";
    city.classList.remove("on", "live"); send({ op: "ui", on: false });
    document.querySelectorAll(".tabs button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.v === String(n) ? "true" : "false"));
    V[n](tok).catch((e) => { if (!(e && e.message === "abort")) console.error(e); });
  };
  document.querySelectorAll(".tabs button").forEach((b) => b.addEventListener("click", () => start(+b.dataset.v)));
  $(".replay").addEventListener("click", () => start(which));
  addEventListener("keydown", (e) => { if (e.key === "1" || e.key === "4") start(+e.key); else if (e.key === "r" || e.key === "R") start(which); else if (e.key === "Escape" || e.key === "s" || e.key === "S") skip(); });
  const clock = (now) => { tc.textContent = ((now - cur.t0) / 1000).toFixed(1) + "s"; requestAnimationFrame(clock); };
  requestAnimationFrame(clock);
  whenReady().then(() => start(+(new URLSearchParams(location.search).get("v")) || 4));
})();
