/* Cromatic Studios · intro lab (r141, r142): the opening (engine.js) played over the live city in a frame, with the
   lab's chrome: tabs, Replay, Skip, a frame meter. 01 (parked) is the same words on the site's own kinetic stage. */
(() => {
  const $ = (s, c = document) => c.querySelector(s);
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const lab = $(".lab"), city = $(".city"), stage = $(".stage"), tc = $(".tc");
  const phone = () => innerWidth < 760;
  const lerp = (a, b, t) => a + (b - a) * t;
  const easeIO = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

  /* ---------- the city: one live copy, driven like /onboarding/ does ---------- */
  let ready = false; const readyCbs = [];
  city.src = "/?drive&nointro&onb";
  let snapCb = null;
  addEventListener("message", (e) => {
    if (e.origin !== location.origin || !e.data || e.data.cz !== "onb") return;
    if (e.data.ev === "ready" && !ready) { ready = true; readyCbs.splice(0).forEach((f) => f()); }
    if (e.data.ev === "snap" && snapCb) { const f = snapCb; snapCb = null; f(); }
  });
  const win = () => city.contentWindow;
  const send = (o) => { try { const w = win(); w.__onb ? w.__onb(o) : w.postMessage({ cz: "onb", ...o }, location.origin); } catch (e) {} };
  const whenReady = () => new Promise((r) => (ready ? r() : readyCbs.push(r)));
  const CAM = { over: { t: [1350, 5200], dist: 6000, yaw: 0.3, pitch: 0.98 }, worlds: { t: [880, 4420], dist: 2400, yaw: 0.5, pitch: 0.78 } };
  const cam = (c) => send({ op: "cam", t: c.t, dist: c.dist, yaw: c.yaw, pitch: c.pitch });
  const mix = (A, B, u) => ({ t: [lerp(A.t[0], B.t[0], u), lerp(A.t[1], B.t[1], u)], dist: lerp(A.dist, B.dist, u), yaw: lerp(A.yaw, B.yaw, u), pitch: lerp(A.pitch, B.pitch, u) });

  /* ---------- the cups: the kinetic bundle's wall ---------- */
  const [kjs, kcss] = (lab.dataset.kz || "").split("|");
  let kzLoad = null;
  const loadKz = () => kzLoad || (kzLoad = new Promise((res) => {
    if (!kjs) return res(false);
    const l = document.createElement("link"); l.rel = "stylesheet"; l.href = kcss; document.head.appendChild(l);
    const s = document.createElement("script"); s.src = kjs; s.async = true; s.onload = () => res(true); s.onerror = () => res(false); document.body.appendChild(s);
  }));
  const kzhost = $(".kzhost");
  const cur = { token: 0, t0: 0, kz: null, onDrop: null, onFinale: null, intro: null };
  const cupsPrep = async (tok, obstacles, lite = phone()) => {
    if (RM || !(await loadKz()) || !window.cromaticKinetic || tok !== cur.token) return null;
    let k = null;
    try { k = window.cromaticKinetic(() => cur.onFinale?.(), async () => {}, { drop: true, lite, settle: 700, obstacles, onDrop: () => { try { cur.onDrop?.(); } catch (e) {} } }); } catch (e) { return null; }
    const st = document.body.querySelector(":scope > .kz");
    kzhost.className = "kzhost cupsonly";
    if (st) kzhost.appendChild(st);
    try { await k.warm?.(); } catch (e) {}
    if (tok !== cur.token) return null;
    cur.kz = k;
    return k;
  };
  const cups = (tok, { onDrop } = {}) => new Promise((done) => {
    let fin = false; const end = () => { if (!fin) { fin = true; done(); } };
    const k = cur.kz;
    if (!k || tok !== cur.token) return end();
    cur.onDrop = onDrop; cur.onFinale = end;
    try { k.bridge(); } catch (e) { return end(); }
    setTimeout(end, 7000);
  });
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  // the city compiles every world out of sight before the run (the same warm-up /onboarding/ asks for)
  const cityWarm = async (tok) => {
    send({ op: "pause", on: true });
    await wait(120);
    const t0 = performance.now();
    while (performance.now() - t0 < 12000 && tok === cur.token) {
      send({ op: "warm" });
      await wait(400);
      let left = 1; try { left = win().__onbWarmLeft?.() ?? 0; } catch (e) { left = 0; }
      if (!left) break;
    }
    send({ op: "pause", on: false });
    if (phone()) send({ op: "rate", half: true }); else send({ op: "rate", half: false, dpr: Math.min(1, Math.sqrt(1.6e6 / (innerWidth * innerHeight))) });
  };

  /* ---------- the frame meter ---------- */
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
      if (run) { run.n++; run.sum += dt; run.dropped += Math.max(0, Math.round(dt / 16.667) - 1); if (dt > 40) run.worst.push([now - run.t0, dt]); if (run.n % 30 === 0) report(run, false); }
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    return { begin, end };
  })();

  /* ================= 04 · the opening, hosted over the frame ================= */
  const v4 = async (tok) => {
    await whenReady();
    if (tok !== cur.token) return;
    city.classList.add("on");
    const host = {
      stage: $(".i4-stage"),
      isPhone: phone, reduced: RM, warmBlocking: true,
      carPos: () => { try { const d = win().__dbg?.(); return d && d.car ? [d.car[0], d.car[2]] : null; } catch (e) { return null; } },
      endView: () => { try { return win().__onbOpeningView?.() || null; } catch (e) { return null; } },
      send,
      snap: () => new Promise((res) => { snapCb = () => { let c = null; try { c = win().__onbSnapCanvas?.(); } catch (e) {} res(c); }; send({ op: "snap" }); setTimeout(() => { if (snapCb) { snapCb = null; res(null); } }, 400); }),
      warm: () => cityWarm(tok),
      cupsPrep: () => cupsPrep(tok, () => cur.intro?.obstacles() || []),
      cups: (o) => cups(tok, o),
      reveal: () => {},
      ui: (on) => { send({ op: "ui", on, welcome: false }); if (on) city.classList.add("live"); },
      end: () => { send({ op: "ui", on: true, welcome: true, welcomeIn: 600 }); city.classList.add("live"); lab.classList.add("done"); lab.classList.remove("running"); meter.end(); },
      skipEnd: () => { try { cur.kz?.pause?.(); } catch (e) {} kzhost.innerHTML = ""; kzhost.className = "kzhost"; cur.kz = null; send({ op: "pause", on: false }); send({ op: "scheme", id: "monument" }); cam(CAM.over); send({ op: "ui", on: true, welcome: true, welcomeIn: 600 }); city.classList.add("live"); lab.classList.add("done"); lab.classList.remove("running"); meter.end(); },
    };
    cur.intro = window.cromaticIntro4(host, { onStart: () => { cur.t0 = performance.now(); lab.classList.add("running"); meter.begin(); }, onEnd: () => {} });
    cur.intro.start();
  };

  /* ================= 01 · parked: the site's own kinetic stage, with the new words ================= */
  const C = { y: "#FED012", b: "#119BFE", g: "#28C840", r: "#F65342", l: "#B098C8" };
  const BEATS1 = [
    { veil: C.y, tr: "iris", marq: "", lines: [[{ w: "Nobody" }, { w: "remembers" }], [{ w: "a" }, { w: "thumbnail.", fx: "fade" }]], hold: 520 },
    { veil: C.r, tr: "blinds", marq: "", lines: [[{ w: "But" }, { w: "someone" }, { w: "could" }], [{ w: "remember" }, { w: "a" }, { w: "house.", p: C.y, fx: "cycle", alt: ["facade.", "brand."] }]], hold: 2100 },
    { veil: "none", tr: "iris", marq: "", lines: [[{ w: "Nine" }, { w: "worlds" }, { w: "over" }, { w: "the" }, { w: "same" }, { w: "streets." }], [{ w: "One" }, { w: "will" }, { w: "feel" }, { w: "like" }, { w: "yours.", p: C.y, fx: "stamp", burst: 1 }]], hold: 900 },
    { veil: C.b, tr: "blinds", marq: "", lines: [[{ w: "That's" }, { w: "how" }, { w: "the" }, { w: "right", p: C.r, fx: "stamp" }], [{ w: "brand" }, { w: "feels" }, { w: "like." }]] },
    { veil: C.g, tr: "doors", marq: "", coffee: 1, lines: [[{ w: "And" }, { w: "like" }, { w: "good" }, { w: "coffee.", p: C.y, fx: "stamp" }]] },
    { veil: C.y, tr: "iris", marq: "", coffee: 2, lines: [[{ w: "There's" }, { w: "always" }, { w: "a" }, { w: "good" }], [{ w: "coffee", p: C.b, fx: "stamp" }, { w: "around." }]] },
  ];
  const veil1 = $(".veil1");
  const v1 = async (tok) => {
    veil1.style.opacity = 1;
    await whenReady();
    if (tok !== cur.token) return;
    send({ op: "pause", on: false }); send({ op: "mode", map: true }); send({ op: "scheme", id: "monument" }); send({ op: "frame" }); cam(CAM.worlds);
    city.classList.add("on");
    if (RM || !(await loadKz()) || !window.cromaticKinetic || tok !== cur.token) return;
    let k = null;
    const played = new Promise((res) => {
      k = window.cromaticKinetic(() => res(), async () => {}, {
        drop: true, lite: phone(), beats: BEATS1,
        onBeat: (i, beat) => {
          if (tok !== cur.token || beat.veil !== "none") return;
          veil1.style.opacity = 0;
          ["nightlife", "ghibli", "orchid", "sketch", "underwater", "monument"].forEach((id, j) => setTimeout(() => { if (tok === cur.token) send({ op: "scheme", id }); }, 600 + j * 340));
        },
        onDrop: () => { veil1.style.opacity = 0; const t0 = performance.now(); const tw = () => { const u = Math.min(1, (performance.now() - t0) / 2400); cam(mix(CAM.worlds, CAM.over, easeIO(u))); if (u < 1 && tok === cur.token) requestAnimationFrame(tw); }; tw(); },
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

  /* ---------- play, replay, switch, skip ---------- */
  const V = { 1: v1, 4: v4 };
  let which = 4;
  const reset = () => {
    cur.token++;
    try { cur.kz?.pause?.(); } catch (e) {}
    try { cur.intro?.destroy(); } catch (e) {} cur.intro = null;
    const st = document.createElement("div"); st.className = "i4-stage"; const old = $(".i4-stage"); if (old) old.replaceWith(st); else stage.appendChild(st);
    kzhost.innerHTML = ""; kzhost.className = "kzhost"; cur.kz = null; cur.onDrop = cur.onFinale = null;
    lab.classList.remove("running", "done"); veil1.style.opacity = 0;
    city.classList.remove("on", "live"); send({ op: "ui", on: false });
    meter.end();
  };
  const start = (n) => {
    if (!V[n]) return;
    which = n; reset();
    const tok = cur.token; cur.t0 = performance.now();
    document.querySelectorAll(".tabs button").forEach((b) => b.setAttribute("aria-pressed", b.dataset.v === String(n) ? "true" : "false"));
    V[n](tok).catch((e) => { if (!(e && e.message === "abort")) console.error(e); });
  };
  const skip = () => { if (cur.intro && !cur.intro.done) cur.intro.skip(); else { reset(); const tok = cur.token; whenReady().then(() => { if (tok !== cur.token) return; send({ op: "pause", on: false }); send({ op: "scheme", id: "monument" }); cam(CAM.over); city.classList.add("on", "live"); send({ op: "ui", on: true, welcome: true, welcomeIn: 600 }); lab.classList.add("done"); }); } };
  document.querySelectorAll(".tabs button").forEach((b) => b.addEventListener("click", () => start(+b.dataset.v)));
  $(".replay").addEventListener("click", () => start(which));
  $(".skip").addEventListener("click", skip);
  addEventListener("keydown", (e) => { if (e.key === "1" || e.key === "4") start(+e.key); else if (e.key === "r" || e.key === "R") start(which); else if (e.key === "s" || e.key === "S") skip(); });
  const clock = (now) => { tc.textContent = ((now - cur.t0) / 1000).toFixed(1) + "s"; requestAnimationFrame(clock); };
  requestAnimationFrame(clock);
  whenReady().then(() => start(+(new URLSearchParams(location.search).get("v")) || 4));
})();
