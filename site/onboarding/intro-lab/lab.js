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
    try { k = window.cromaticKinetic(() => cur.onFinale?.(), async () => {}, { drop: true, lite, onDrop: () => { try { cur.onDrop?.(); } catch (e) {} } }); } catch (e) { return null; }
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
    if (phone()) send({ op: "rate", half: true }); else send({ op: "rate", half: false, dpr: 1.5 });
  };

  /* ---------- a small timeline ---------- */
  const cur = { token: 0, t0: 0, kz: null };
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
      if (letters) letterize(s, w.w); else s.textContent = w.w;
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
  // the worlds, in the order they pass behind "yours.": each one's sky (the wash) and the pill's colour under it
  const WORLDS = [
    ["nightlife", "#121d3a", "#FF9E3D"], ["ghibli", "#e4f1f4", "#e0b25a"], ["orchid", "#fbeef3", "#f08bb4"],
    ["sketch", "#f6f3ec", "#ffd84a"], ["underwater", "#0b3b5c", "#3de0d0"], ["monument", "#f6e2d8", "#FED012"],
  ];
  const wash = (color) => { const b = document.createElement("i"); b.className = "wash"; b.style.background = color; over.appendChild(b); setTimeout(() => b.remove(), 700); };
  // the pill's word changes in place: the old word blurs out, the pill eases to the new width, the new word blurs in
  // (a crossfade: the old word's letters leave while the new word's letters arrive, in the same place, the pill
  // easing between the two widths under them, so the pill is never seen empty)
  const morph = async (el, list, every, tok) => {
    for (const [w, color] of list) {
      await wait(every, tok);
      const w0 = el.offsetWidth;
      const old = document.createElement("span"); old.className = "wv";
      [...el.querySelectorAll(":scope > .l")].forEach((l, j) => { l.style.setProperty("--lo", (j * 14) + "ms"); old.appendChild(l); });
      const nw = document.createElement("span"); nw.className = "wn"; letterize(nw, w);
      el.appendChild(old); el.appendChild(nw);
      el.style.width = "auto"; old.style.display = "none";
      const w1 = el.offsetWidth; old.style.display = ""; el.style.width = w0 + "px"; void el.offsetWidth;
      el.classList.add("mw"); el.style.width = w1 + "px"; if (color) el.style.background = color;
      await wait(620, tok);
      old.remove(); [...nw.querySelectorAll(".l")].forEach((l) => el.appendChild(l)); nw.remove();
      el.classList.remove("mw"); el.style.width = "";
    }
  };
  const v4 = async (tok) => {
    await prep(tok, { at: { t: [1000, 4800], dist: 3400, yaw: 0.2, pitch: 0.98 } });
    veil.classList.add("warm");
    lab.classList.add("warming");
    await cityWarm(tok);
    await cupsPrep(tok);
    lab.classList.remove("warming");
    cur.t0 = performance.now();
    const t0 = performance.now();
    const at = async (ms) => { const d = ms - (performance.now() - t0); if (d > 0) await wait(d, tok); };
    const soft = (parts, o = {}) => line(parts, { fx: "soft", stagger: 55, letters: true, ...o });
    // a line leaves letter by letter, each on its own moment, upwards and out of focus
    const gone = (el) => { if (!el || !el.isConnected) return; el.querySelectorAll(".l").forEach((l) => l.style.setProperty("--lo", Math.round(Math.random() * 240) + "ms")); el.classList.add("outsoft"); setTimeout(() => el.remove(), 1000); };
    // a word is forgotten: its letters drift apart and out of focus, each on its own moment (k: how far it goes)
    const forget = (w, k = 1, spread = 700, from = 0) => { if (!w) return; w.querySelectorAll(".l").forEach((l) => { l.style.setProperty("--lo", (from + Math.random() * spread).toFixed(0) + "ms"); l.style.setProperty("--fx", ((Math.random() - 0.5) * 22 * k).toFixed(1) + "px"); l.style.setProperty("--fy", (-(4 + Math.random() * 10) * k).toFixed(1) + "px"); l.style.setProperty("--fo", k >= 1 ? 0.06 : 0.3); }); w.classList.add("forget"); };
    // the camera, start to end, one continuous move (it only shows from 6.9 s, when the ground dissolves)
    const road = path([
      [0, { t: [1000, 4800], dist: 3400, yaw: 0.2, pitch: 0.98 }],
      [5400, { t: [1000, 4800], dist: 3400, yaw: 0.2, pitch: 0.98 }],
      [7800, { t: [880, 4420], dist: 2350, yaw: 0.48, pitch: 0.8 }],
      [10600, { t: [880, 4420], dist: 2100, yaw: 0.7, pitch: 0.75 }],
      [13000, { t: [900, 4400], dist: 1950, yaw: 0.9, pitch: 0.7 }],
      [15000, { t: [1000, 4700], dist: 2600, yaw: 1.02, pitch: 0.8 }],
      [18000, { t: [1350, 5200], dist: 6000, yaw: 1.18, pitch: 0.98 }],
      [23000, { t: [1350, 5200], dist: 6000, yaw: 1.26, pitch: 0.98 }],
    ]);
    (function drive(now) { if (tok !== cur.token) return; camAt(road(now - t0)); requestAnimationFrame(drive); })(performance.now());
    // 1 · nobody remembers a thumbnail (the word dissolves)
    await at(300);
    const a = soft(["Nobody", "remembers", { br: true }, { w: "a", d: 260 }, { w: "thumbnail.", cls: "thumb", d: 330 }], { cls: "calm" });
    await at(1650); forget(a.querySelector(".thumb"), 1, 650); forget(a.querySelectorAll(".kw")[1], 0.45, 600, 300);
    await at(2750); gone(a);
    // 2 · but someone could remember a house → facade → brand
    await at(2900);
    const b = soft(["But", "someone", "could", { br: true }, { w: "remember", d: 300 }, { w: "a", d: 360 }, { brm: true }, { w: "house.", pill: "g", d: 440 }], { cls: "calm" });
    await at(4000);
    await morph(b.querySelector(".pill"), [["facade.", "#119BFE"], ["brand.", "#FED012"]], 640, tok);
    await at(5900); gone(b);
    // 3 · the ground dissolves to the city; nine worlds, one will feel like yours (the sky changes behind the words)
    veilTo(0, 1300);
    await at(6500);
    const c = soft(["Nine", "worlds", "over", "the", "same", "streets."], { cls: "calm mid onCity" });
    await at(7400);
    const c2 = soft(["One", "will", "feel", "like", { w: "yours.", pill: "y", d: 320 }], { cls: "calm mid" });
    const yours = c2.querySelector(".pill");
    for (let i = 0; i < WORLDS.length; i++) {
      await at(8300 + i * 500);
      const [id, sky, pc] = WORLDS[i];
      wash(sky); send({ op: "scheme", id }); yours.style.background = pc;
    }
    await at(11600); gone(c); gone(c2);
    // 4 · that is what the right brand feels like
    await at(11850);
    const d = soft(["That's", "how", "the", { w: "right", pill: "y", d: 280 }, { w: "brand", d: 330 }, { w: "feels", d: 380 }, { w: "like.", d: 430 }], { cls: "calm mid onCity" });
    await at(13900); gone(d);
    // 5 · and like good coffee: the words stay while the wall of cups fills the screen under them, then it falls
    await at(14150);
    const e = soft(["And", "like", "good", { w: "coffee.", pill: "y", d: 300 }], { cls: "calm mid onCity" });
    await at(15300); gone(e);
    await at(15500);
    await cups(tok);
    if (tok !== cur.token) return;
    // 6 · there's always a good coffee around, over the whole city
    await wait(450, tok);
    const f = soft(["There's", "always", "a", "good", { w: "coffee", pill: "y", d: 300 }, { w: "around.", d: 360 }], { cls: "calm mid onCity" });
    await wait(2600, tok); gone(f);
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

  /* ---------- skip: straight to the end, the city seen whole ---------- */
  const skip = () => {
    cur.token++;
    try { cur.kz?.pause?.(); } catch (e) {}
    kzhost.innerHTML = ""; kzhost.className = "kzhost"; cur.kz = null;
    clearAll(); lab.classList.remove("warming");
    veilTo(0, 700);
    send({ op: "pause", on: false }); send({ op: "scheme", id: "monument" }); cam(CAM.over);
    document.querySelectorAll(".tabs button").forEach((b) => b.setAttribute("aria-pressed", "false"));
  };
  $(".skip").addEventListener("click", skip);

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
    clearAll(); lab.classList.remove("warming");
    city.classList.remove("on");
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
