/* Cromatic Studios · The new website · launch page. No framework: one rAF loop for the scroll scenes.
   r140: the page now has four live zones (the map, the drive, the worlds, the rides) where the real city shows through
   it. One copy of the app runs in a frame behind the page (/?drive&nointro&onb, loaded only when a zone comes close)
   and the page tells it, frame by frame, where to be: the camera over the map, the car's place on the road, the world,
   the ride, the showroom. Until it is ready, with reduced motion or without WebGL, a still of the same view stands in.
   r195: the scroll drive is gone from the site, so the frame is the map itself (/?map&nointro&onb) and the drive zone
   is the map's camera, from above and low along the streets, the way you drive it now (Street and Bird's eye). */
(() => {
  const root = document.documentElement;
  const RM = root.classList.contains("rm");
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const smooth = (t) => t * t * (3 - 2 * t);
  let vw = innerWidth, vh = innerHeight;
  // r139c: the same page in Romanian at /ro/onboarding/: files from /onboarding/, Romanian words and case pages
  const RO = (root.lang || "").slice(0, 2) === "ro";
  const M = "/onboarding/media/";
  const W = (en, ro) => (RO ? ro : en);
  const phone = () => vw < 760;

  /* ---------- videos: play only while on screen ---------- */
  const vids = $$("video.lazy-v, .hero-v");
  if (RM) {
    vids.forEach((v) => { v.removeAttribute("autoplay"); v.pause?.(); v.controls = true; v.preload = "none"; });
  } else {
    const vio = new IntersectionObserver((es) => {
      for (const e of es) { const v = e.target; if (e.isIntersecting) { const p = v.play(); p && p.catch(() => {}); } else v.pause(); }
    }, { threshold: 0.2 });
    vids.forEach((v) => vio.observe(v));
  }

  /* ---------- reveal on enter ---------- */
  const rio = new IntersectionObserver((es) => {
    for (const e of es) if (e.isIntersecting) { e.target.classList.add("in"); rio.unobserve(e.target); }
  }, { threshold: 0.18, rootMargin: "0px 0px -6% 0px" });
  $$(".reveal, .open-h").forEach((el) => rio.observe(el));
  // the cards of the live zones come and go with the middle of the screen
  const zio = new IntersectionObserver((es) => { for (const e of es) e.target.classList.toggle("in", e.isIntersecting); }, { rootMargin: "-22% 0px -22% 0px" });
  $$(".zstep").forEach((el) => zio.observe(el));

  /* ---------- the idea: words light up as you read ---------- */
  const read = $("[data-words]");
  let words = [];
  if (read && !RM) {
    read.innerHTML = read.textContent.trim().split(/\s+/).map((w) => `<span class="w">${w}</span>`).join(" ");
    words = $$(".w", read);
  }

  /* ---------- numbers count up ---------- */
  const nio = new IntersectionObserver((es) => {
    for (const e of es) {
      if (!e.isIntersecting) continue;
      nio.unobserve(e.target);
      const b = e.target, to = +b.dataset.count, suf = b.dataset.suffix || "";
      if (RM) continue;
      const t0 = performance.now(), d = 1400;
      const tick = (now) => { const u = clamp((now - t0) / d); b.textContent = Math.round(to * (1 - Math.pow(1 - u, 3))) + suf; if (u < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    }
  }, { threshold: 0.6 });
  $$("[data-count]").forEach((b) => nio.observe(b));

  /* ---------- the case wall ---------- */
  const STREET = { c: "#28C840", f: "#119BFE", m: "#F28BA8", p: "#FED012" };
  const CASES = [
    ["two-minutes", "Two Minutes", "c"], ["investimental", "Investimental", "f"], ["the-aesthetic-court", "The Aesthetic Court", "m"], ["slow-coffee-festival", "Slow Coffee Festival", "c"],
    ["sticker-republic", "Sticker Republic", "p"], ["arca-resort", "ARCA Resort", "c"], ["techventures-bank", "Techventures Bank", "f"], ["toskani-med", "Toskani MED", "m"],
    ["oma-coffee", "OMA Coffee", "c"], ["unchain-festival", "Unchain Festival", "f"], ["antila", "Antila", "c"], ["elithia", "Elithia", "m"],
    ["steam", "Steam Coffee Shop", "c"], ["bepco", "Bepco", "f"], ["clinica-sante", "Clinica Sante", "m"], ["printoteca", "Printoteca", "p"],
    ["artisan-coffee-gear", "Artisan Coffee Gear", "c"], ["infinity-capital", "Infinity Capital", "f"], ["routine-paris", "Routine Paris", "m"], ["craft-coffee", "Craft Coffee", "c"],
    ["longshield", "Longshield", "f"], ["help-4-brain", "Help 4 Brain", "m"], ["sip-coffee-wine", "Sip Coffee & Wine", "c"], ["esd", "ESD", "f"],
    ["altius", "Altius", "m"], ["casa-berero", "Berero", "c"], ["assetto", "Assetto", "f"], ["pain-plaisir", "Pain Plaisir", "c"],
    ["witanalytica", "Witanalytica", "f"], ["kompus", "Kómpus", "c"], ["venevo", "Venevo", "f"], ["yoshi-izakaya", "Yoshi Izakaya", "c"],
    ["unde", "UNDÉ", "c"], ["patiline", "Patiline", "c"], ["eliade-18", "Eliade 18", "p"], ["rdw-2023", "RDW 2023", "p"], // r139i: all 36
    ["echo-school", "Echo School", "f"], // r159: 37
  ];
  const wall = $("[data-wall]");
  let wallRows = [];
  if (wall) {
    const per = Math.ceil(CASES.length / 3);
    for (let r = 0; r < 3; r++) {
      const list = CASES.slice(r * per, r * per + per);
      const row = document.createElement("div");
      row.className = "wall-row";
      const html = list.map(([s, n, st]) => `<a class="case" href="${RO ? "/ro/proiecte/" : "/work/"}${s}/" style="--sc:${STREET[st]}"><img src="${M}covers/${s}.webp" alt="${n}" loading="lazy" width="560" height="380"><i aria-hidden="true"></i><span>${n}</span></a>`).join("");
      row.innerHTML = RM ? html : html + html.replace(/<a /g, '<a aria-hidden="true" tabindex="-1" ');
      wall.appendChild(row);
      wallRows.push(row);
    }
  }

  /* ---------- the page colour ---------- */
  const THEMES = {
    paper: ["#fbfaf5", "#0d0c09"], cream: ["#f4efe4", "#0d0c09"], mist: ["#ecebe6", "#0d0c09"], ink: ["#0d0c09", "#fbfaf5"],
    warm: ["#ECEAE3", "#0d0c09"], yellow: ["#FED012", "#0d0c09"],
    // the worlds: each one's own sky (the app's SCHEMES bg / fg)
    "w-nightlife": ["#121d3a", "#F7EEDF"], "w-underwater": ["#0b3b5c", "#e8fbff"], "w-monument": ["#f6e2d8", "#3b2b44"], "w-ghibli": ["#e4f1f4", "#243322"],
    "w-sketch": ["#f6f3ec", "#232326"], "w-circuit": ["#e9edf1", "#111418"], "w-orchid": ["#fbeef3", "#3a1e2c"], "w-riso": ["#f3eee3", "#1d3f8f"],
  };
  const hexRgb = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const isDark = (h) => { const [r, g, b] = hexRgb(h); return 0.2126 * r + 0.7152 * g + 0.0722 * b < 110; };
  const nav = $(".nav");
  const metaTheme = $('meta[name="theme-color"]');
  const bgOf = (name) => (THEMES[name] || THEMES.paper)[0];
  // the colour of the browser bar and of the nav follow what is under them; the worlds zone takes each world's sky
  let topTheme = "", navDark = false;
  const setTop = (name) => {
    if (!THEMES[name] || name === topTheme) return;
    topTheme = name;
    metaTheme?.setAttribute("content", bgOf(name));
    const d = isDark(bgOf(name));
    if (d !== navDark) { navDark = d; nav.classList.toggle("dark", d); }
  };
  let worldTheme = "";
  const setWorld = (z, name) => {
    if (!THEMES[name] || name === worldTheme) return;
    worldTheme = name;
    const [bg, fg] = THEMES[name], [r, g, b] = hexRgb(bg);
    z.el.style.setProperty("--bg", bg); z.el.style.setProperty("--fg", fg);
    z.el.style.setProperty("--card", `rgba(${r},${g},${b},${isDark(bg) ? 0.8 : 0.9})`);
  };
  // where two themes meet, the later section opens with a gradient from the earlier one's colour; a zone's edges fade
  // into the sections around it
  const seams = () => {
    const secs = $$("main > section");
    secs.forEach((sec, i) => {
      const prev = secs[i - 1], next = secs[i + 1];
      const pb = prev && bgOf(prev.dataset.theme), cb = bgOf(sec.dataset.theme);
      if (sec.matches(".zone")) {
        if (prev) sec.style.setProperty("--prev", pb);
        if (next) sec.style.setProperty("--next", bgOf(next.dataset.theme));
      } else if (prev && !prev.matches(".zone") && pb !== cb) { sec.classList.add("seam"); sec.style.setProperty("--prev", pb); }
    });
  };

  /* ---------- layout cache: every scroll scene reads scrollY against these, never the layout ---------- */
  const scenes = RM ? [] : $$("[data-scene]").map((el) => ({ el, kind: el.dataset.scene, top: 0, h: 0 }));
  if (RM) root.classList.add("no-scenes");
  const themed = $$("main > section[data-theme], .zstep[data-theme], .zseg[data-theme]").map((el) => ({ el, theme: el.dataset.theme, top: 0, h: 0, depth: el.matches("main > section") ? 0 : 1 }));
  const ZONES = $$("[data-zone]").map((el) => ({
    el, kind: el.dataset.zone, top: 0, h: 0,
    steps: $$(".zstep, .zseg", el).map((s) => ({ el: s, top: 0, h: 0, c: 0, d: s.dataset })),
  }));
  // r141: the map's cards count their stops (five dots, the current one filled)
  for (const z of ZONES) if (z.kind === "map") z.steps.forEach((s, i) => {
    const cd = s.el.querySelector(".zcard"); if (!cd) return;
    const p = document.createElement("p"); p.className = "zdots"; p.setAttribute("aria-hidden", "true");
    p.innerHTML = z.steps.map((_, j) => `<i${j === i ? ' class="on"' : ""}></i>`).join("");
    cd.appendChild(p);
  });
  let seamed = false, docH = 0;
  const offTop = (el) => { let y = 0, e = el; while (e) { y += e.offsetTop; e = e.offsetParent; } return y; };
  const measure = () => {
    vw = innerWidth; vh = innerHeight;
    for (const s of scenes) { s.top = offTop(s.el); s.h = s.el.offsetHeight; }
    for (const t of themed) { t.top = offTop(t.el); t.h = t.el.offsetHeight; }
    for (const z of ZONES) { z.top = offTop(z.el); z.h = z.el.offsetHeight; for (const s of z.steps) {
      s.top = offTop(s.el); s.h = s.el.offsetHeight; s.c = s.top + s.h / 2;
      const cd = s.el.querySelector(".zcard");
      if (cd) { const r = cd.getBoundingClientRect(); s.card = { l: r.left, r: r.right, t: r.top + scrollY - s.c, b: r.bottom + scrollY - s.c }; } else s.card = null;
    } }
    if (read) { read._top = offTop(read); read._h = read.offsetHeight; }
    docH = document.documentElement.scrollHeight;
    if (!seamed) { seamed = true; seams(); }
    req();
  };

  /* ---------- the live city ---------- */
  const stage = $(".stage");
  const posters = $$(".st-poster", stage);
  let frame3d = null, win3d = null, live = false, asked = false, failed = false;
  const can3D = (() => {
    if (RM || /[?&]no3d\b/.test(location.search)) return false;
    try { if (navigator.connection?.saveData) return false; } catch {}
    try { if (navigator.deviceMemory && navigator.deviceMemory < 3) return false; } catch {}
    try { const c = document.createElement("canvas"); return !!(c.getContext("webgl2") || c.getContext("webgl")); } catch { return false; }
  })();
  const send = (o) => { if (!win3d) return; try { win3d.__onb ? win3d.__onb(o) : win3d.postMessage({ cz: "onb", ...o }, location.origin); } catch {} };
  const ask3D = () => {
    if (asked || !can3D) return;
    asked = true;
    frame3d = document.createElement("iframe");
    frame3d.title = W("The Cromatic city, live", "Orașul Cromatic, live");
    frame3d.setAttribute("aria-hidden", "true");
    frame3d.tabIndex = -1;
    frame3d.src = "/?map&nointro&onb"; // r195: the map, never the old scroll drive
    stage.insertBefore(frame3d, $(".st-veil", stage));
    win3d = frame3d.contentWindow;
    setTimeout(() => { if (!live) failed = true; }, 30000);
  };
  addEventListener("message", (e) => {
    if (e.origin !== location.origin || !e.data || e.data.cz !== "onb" || !frame3d || e.source !== frame3d.contentWindow) return;
    if (e.data.ev === "ready" && !live && !failed) {
      win3d = frame3d.contentWindow;
      applied = {}; // everything is sent again
      settleUntil = performance.now() + 900;
      // r141: a phone starts at every other frame (the page's own scroll keeps the rest); the governor climbs back
      // when the frames prove easy, instead of waiting a second of dropped ones to come down
      if (phone()) { gov.lvl = 1; gov.since = performance.now(); send({ op: "rate", half: true }); }
      req();
      // the first frames go to the right view, then the city fades in over the still
      setTimeout(() => { live = true; stage.classList.add("live"); req(); }, 650);
    }
  });

  // what each zone wants from the city
  const MAPCAM = (s) => s.d.cam.split(",").map(Number); // x, z, dist, yaw, pitch
  const lerpAng = (a, b, t) => { let d = b - a; while (d > Math.PI) d -= 2 * Math.PI; while (d < -Math.PI) d += 2 * Math.PI; return a + d * t; };
  // between two steps: the centre of the screen between their centres (eased); a far hop pulls the camera up
  const between = (z, y) => {
    const st = z.steps;
    if (y <= st[0].c) return [0, 0, 0];
    for (let i = 0; i < st.length - 1; i++) if (y < st[i + 1].c) return [i, i + 1, (y - st[i].c) / (st[i + 1].c - st[i].c)];
    return [st.length - 1, st.length - 1, 0];
  };
  const nearestStep = (z, y) => { let bi = 0, bd = Infinity; z.steps.forEach((s, i) => { const d = Math.abs(s.c - y); if (d < bd) { bd = d; bi = i; } }); return bi; };
  // pinned zones: the segment under the middle of the screen
  const segAt = (z, y) => { let k = 0; z.steps.forEach((s, i) => { if (s.top <= y) k = i; }); return k; };
  const jump = { z: null, i: -1, until: 0, y: 0 };
  const segPick = (z, y, now) => {
    if (jump.z === z && now < jump.until) { if (Math.abs(scrollY - jump.y) < 3) jump.until = 0; return jump.i; }
    return segAt(z, y);
  };
  // a pick only counts once it has held for a moment (a fast scroll does not change the world eight times)
  const hold = new Map();
  const steady = (key, v, now, ms = 90) => { const h = hold.get(key); if (!h || h.v !== v) { hold.set(key, { v, t: now, ok: h?.ok ?? v }); return h?.ok ?? v; } if (now - h.t >= ms) h.ok = v; return h.ok; };

  // the middle of the part of the screen a step's card leaves free (beside it on a desktop, above it on a phone)
  const freeOf = (s) => {
    if (!s || !s.card) return null;
    if (!phone()) return [(s.card.r + vw) / 2, vh / 2];
    const top = vh / 2 + s.card.t, navB = 72;
    return [vw / 2, (navB + Math.max(navB + 120, top)) / 2];
  };
  const frameAt = (z, a, b, u, subject) => {
    const A = freeOf(z.steps[a]), B = freeOf(z.steps[b]), e = smooth(clamp(u)), mid = [vw / 2, vh / 2];
    if (!A && !B) return null;
    const P = A || mid, Q = B || mid;
    return { x: Math.round(lerp(P[0], Q[0], e)), y: Math.round(lerp(P[1], Q[1], e)), subject };
  };
  const want = (z, now) => {
    const y = scrollY + vh * 0.5, mob = phone();
    // r195: the drive zone is the map's camera too (a step may bring its world, data-scheme, and its page colour)
    if (z.kind === "map" || z.kind === "drive") {
      const [a, b, u] = between(z, y), A = MAPCAM(z.steps[a]), B = MAPCAM(z.steps[b]), e = smooth(clamp(u));
      const far = Math.hypot(A[0] - B[0], A[1] - B[1]), hop = Math.min(2600, far * 0.55) * Math.sin(Math.PI * e);
      const dm = mob ? 1.3 : 1, s = z.steps[nearestStep(z, y)];
      return { map: true, scheme: steady(z.kind, s.d.scheme || "monument", now, 140), veil: true, stepTheme: s.d.theme, show: false, poster: s.d.still, frame: frameAt(z, a, b, u, "center"),
        cam: { t: [lerp(A[0], B[0], e), lerp(A[1], B[1], e)], dist: (lerp(A[2], B[2], e) + hop) * dm, yaw: lerpAng(A[3], B[3], e), pitch: clamp(lerp(A[4], B[4], e) + 0.12 * Math.sin(Math.PI * e), 0.2, 1.1) } };
    }
    if (z.kind === "worlds") {
      const i = segPick(z, y, now), w = steady("worlds", z.steps[i].d.w, now);
      const p = clamp((scrollY - z.top) / Math.max(1, z.h - vh));
      return { map: true, scheme: w, ride: true, show: false, poster: z.steps[i].d.still, theme: "w-" + w, sel: z.steps[i].d.w,
        cam: { t: [880, 4420], dist: mob ? 3000 : 2400, yaw: 0.2 + p * 1.2 + now * 0.000025, pitch: 0.78 } };
    }
    if (z.kind === "rides") {
      const i = segPick(z, y, now), v = steady("rides", z.steps[i].d.v, now, 70), s = z.steps[i];
      const u = clamp((y - s.top) / Math.max(1, s.h));
      return { map: true, scheme: "monument", show: { on: true, bg: THEMES.warm[0], fill: mob ? 1.75 : 1.5, ay: mob ? -0.03 : -0.16, ax: mob ? 0 : 0.2, turn: u * 0.9 }, veh: v, poster: s.d.still, sel: s.d.v };
    }
    return null;
  };
  // what the city has been told, so only changes go across
  let applied = {}, settleUntil = 0, zoneNow = null, stageOn = false, pausedAt = 0, veilT = 0, stageBg = "", warmAt = 0;
  const struct = (w) => `${w.map}|${w.show ? 1 : 0}|${w.veil ? w.scheme : ""}`;
  const applyWant = (w, visible, now) => {
    const k = struct(w);
    // a change of mode, of the showroom, or night falling on the drive, happens behind a short veil when it is seen
    if (visible && live && applied.k && applied.k !== k) {
      if (!veilT) { stage.classList.add("veil"); veilT = now + 190; return; }
      if (now < veilT) return;
    }
    if (applied.map !== w.map) {
      send({ op: "mode", map: w.map });
      applied.map = w.map; applied.scheme = applied.veh = undefined; applied.show = false; applied.snap = true;
      settleUntil = Math.max(settleUntil, now + 700);
    }
    if (!w.show && applied.show) { send({ op: "show", on: false }); applied.show = false; }
    if (applied.scheme !== w.scheme) { send({ op: "scheme", id: w.scheme, ride: !!w.ride }); applied.scheme = w.scheme; if (w.ride) applied.veh = null; }
    const v = w.veh || (w.ride ? null : "dacia1300");
    if (v && applied.veh !== v) { send({ op: "veh", id: v }); applied.veh = v; }
    if (w.show) { send({ op: "show", ...w.show }); applied.show = true; }
    if (w.cam) send({ op: "cam", ...w.cam });
    const fk = w.frame ? `${w.frame.x}|${w.frame.y}|${String(w.frame.subject)}` : "";
    if (fk !== applied.frame) { send(w.frame ? { op: "frame", ...w.frame } : { op: "frame" }); applied.frame = fk; }
    // r195: no more road place, espressos or morning: the scroll drive (op drive, coffee, morning) is gone from the page
    if (veilT && now >= veilT) { veilT = 0; setTimeout(() => stage.classList.remove("veil"), 160); }
    applied.k = k;
  };
  // the still behind the live city (and instead of it)
  let posterNow = "", posterTurn = 0;
  const showPoster = (name) => {
    if (!name || name === posterNow) return;
    posterNow = name;
    const src = M + (name.startsWith("z/") ? name + (vw / vh < 0.9 ? "-m" : "") : name) + ".webp";
    const nxt = posters[posterTurn ^ 1], cur = posters[posterTurn];
    nxt.onload = () => { if (posterNow !== name) return; nxt.classList.add("on"); cur.classList.remove("on"); posterTurn ^= 1; };
    nxt.onerror = () => {};
    nxt.src = src;
  };
  // the chips: a world or a ride, picked by hand, scrolls you to it
  const chipSets = ZONES.filter((z) => z.kind === "worlds" || z.kind === "rides").map((z) => {
    const chips = $$(".chip", z.el), caps = $$(".wcap, .rcap", z.el), key = z.kind === "worlds" ? "w" : "v";
    chips.forEach((c) => c.addEventListener("click", () => {
      const i = z.steps.findIndex((s) => s.d[key] === c.dataset[key]);
      if (i < 0) return;
      const s = z.steps[i], top = Math.round(s.top + Math.min(s.h, vh) * 0.5 - vh * 0.5 + 2);
      jump.z = z; jump.i = i; jump.y = top; jump.until = performance.now() + 1600;
      hold.delete(z.kind);
      scrollTo({ top, behavior: RM ? "auto" : "smooth" });
      req();
    }));
    return { z, chips, caps, key, cur: null };
  });
  const markSel = (cs, v) => {
    if (cs.cur === v) return;
    cs.cur = v;
    cs.chips.forEach((c) => { const on = c.dataset[cs.key] === v; c.setAttribute("aria-pressed", on ? "true" : "false"); if (on && phone()) { const row = c.parentElement; row.scrollTo({ left: c.offsetLeft - row.clientWidth / 2 + c.offsetWidth / 2, behavior: RM ? "auto" : "smooth" }); } });
    cs.caps.forEach((c) => c.classList.toggle("on", c.dataset[cs.key] === v));
  };

  const tick3d = (now) => {
    // which zone is on screen (the one covering most of it), and which one is next
    let best = null, bestA = 0, near = null, nearD = Infinity;
    const y0 = scrollY, y1 = y0 + vh;
    for (const z of ZONES) {
      const a = Math.min(y1, z.top + z.h) - Math.max(y0, z.top);
      if (a > bestA) { bestA = a; best = z; }
      const d = a > 0 ? 0 : Math.min(Math.abs(z.top - y1), Math.abs(y0 - (z.top + z.h)));
      if (d < nearD) { nearD = d; near = z; }
    }
    // the city boots on this page's thread (same origin): it is asked for while the reader pauses (r141: the first
    // pause after the page has loaded, wherever they are: the start-up then lands on the opening screens, read rather
    // than scrolled), or at the latest one screen before the first zone
    if (!asked && near && document.readyState === "complete" && now - loadedAt > 1500 && (nearD < vh * 0.9 || now - lastScrollAt > 700)) ask3D();
    const visible = bestA > 0;
    if (visible !== stageOn) { stageOn = visible; stage.classList.toggle("on", visible); }
    const z = best || near;
    if (!z) return;
    if (z !== zoneNow) { zoneNow = z; }
    const w = want(z, now);
    if (!w) return;
    if (w.theme && z.kind === "worlds") setWorld(z, w.theme);
    const sb = w.theme ? bgOf(w.theme) : bgOf(w.stepTheme || z.el.dataset.theme);
    if (sb !== stageBg) { stageBg = sb; stage.style.backgroundColor = sb; stage.style.setProperty("--veil", sb); }
    const cs = chipSets.find((c) => c.z === z);
    if (cs && w.sel) markSel(cs, w.sel);
    showPoster(w.poster);
    // the city runs while a zone is seen, and for a moment after a change made out of sight
    const run = visible || now < settleUntil;
    if (win3d) {
      if (run && applied.paused !== false) { send({ op: "pause", on: false }); applied.paused = false; }
      if (!run && applied.paused !== true && now - pausedAt > 400) { send({ op: "pause", on: true }); applied.paused = true; }
      if (run) pausedAt = now;
      // r141: while it waits out of sight and the reader is still, the city compiles every world and every ride, so
      // their first switch on screen is a cut, not a stall (it stops on its own the moment a zone is seen again)
      if (!run && live && applied.paused === true && now - lastScrollAt > 300 && now - warmAt > 2500) { warmAt = now; send({ op: "warm" }); }
      applyWant(w, visible, now);
    }
  };

  /* ---------- scroll scenes ---------- */
  const hero = { frame: $(".hero-frame"), copy: $(".hero-copy"), after: $(".hero-after"), cue: $(".scroll-cue") };
  const kin = $$(".kin li");
  const xpRows = $$(".xl-row"), you = $(".you"), xpNum = $("[data-xp]"), xpNum2 = $("[data-xp2]"), chip = $(".xp-chip");
  const feats = $$(".site-feats li"), longs = $$(".site-scroll .long-img");
  longs.forEach((im) => { im.addEventListener("load", () => req()); });
  let xpShown = -1, boomed = false, xpLaid = -1;

  const burst = () => {
    const host = $(".xp-ui"); if (!host) return;
    const cols = ["#FED012", "#119BFE", "#28C840", "#F65342", "#B098C8", "#ff8a6a"];
    for (let i = 0; i < 36; i++) {
      const d = document.createElement("i"); d.className = "burst";
      d.style.cssText = `right:${30 + Math.random() * 40}px;top:28px;background:${cols[i % 6]}`;
      host.appendChild(d);
      const a = Math.random() * Math.PI * 2, r = 80 + Math.random() * 160;
      d.animate([{ transform: "translate(0,0) rotate(0)", opacity: 1 }, { transform: `translate(${Math.cos(a) * r}px,${Math.sin(a) * r + 60}px) rotate(${Math.random() * 720}deg)`, opacity: 0 }], { duration: 1100 + Math.random() * 600, easing: "cubic-bezier(.22,1,.36,1)" }).onfinish = () => d.remove();
    }
  };

  const update = {
    hero(p) {
      const a = clamp(p / 0.32);
      hero.copy.style.opacity = 1 - a;
      hero.copy.style.transform = `translateY(${-a * 90}px)`;
      hero.cue.style.opacity = 1 - clamp(p * 6);
      const e = ease(clamp((p - 0.22) / 0.48));
      const s = 1 - (vw < 760 ? 0.12 : 0.2) * e;
      hero.frame.style.transform = `scale(${s}) translateY(${-e * 4}vh)`;
      hero.frame.style.borderRadius = `${(e * 34) / s}px`;
      hero.after.style.opacity = clamp((p - 0.5) / 0.18);
      hero.after.style.transform = `translateY(${(1 - clamp((p - 0.5) / 0.18)) * 20}px)`;
    },
    intro(p) {
      if (vw < 900) { kin.forEach((l) => l.classList.add("on")); return; }
      const n = Math.floor(clamp((p - 0.05) / 0.8) * (kin.length + 0.01));
      kin.forEach((l, i) => l.classList.toggle("on", i < n || (i === 0 && p > 0)));
    },
    xp(p) {
      const n = Math.min(xpRows.length, Math.floor(clamp((p - 0.08) / 0.78) * (xpRows.length + 0.999)));
      let pts = 0;
      xpRows.forEach((r, i) => { const got = i < n; r.classList.toggle("got", got); if (got) pts += +r.dataset.pts; });
      if (n !== xpLaid) {
        // newest on top, the older ones slide down under it (transforms only: no layout shift)
        xpLaid = n;
        let yy = 0;
        // the gains so far, newest first; under them, dimmed, the ones still to come, so the journal is never empty
        for (let i = n - 1; i >= 0; i--) { const r = xpRows[i]; r.style.setProperty("--y", yy + "px"); yy += (r._h || (r._h = r.offsetHeight)) + 12; }
        if (n) yy += 6;
        for (let i = n; i < xpRows.length; i++) { const r = xpRows[i]; r.style.setProperty("--y", yy + "px"); yy += (r._h || (r._h = r.offsetHeight)) + 12; }
      }
      if (pts !== xpShown) {
        if (pts > xpShown && xpShown >= 0) { chip.textContent = `+${pts - xpShown}xp`; chip.classList.remove("fly"); void chip.offsetWidth; chip.classList.add("fly"); }
        xpShown = pts;
        xpNum.textContent = pts; xpNum2.textContent = pts;
        you.style.setProperty("--f", (pts / 225).toFixed(3));
        if (pts >= 225 && !boomed) { boomed = true; you.classList.add("boom"); burst(); setTimeout(() => you.classList.remove("boom"), 800); }
        if (pts < 225) boomed = false;
      }
    },
    site(p) {
      const c = Math.min(feats.length - 1, Math.floor(clamp((p - 0.04) / 0.92) * feats.length));
      feats.forEach((f, i) => f.classList.toggle("on", i === c));
      longs.forEach((im) => {
        const scr = im.parentElement, max = im.offsetHeight - scr.clientHeight;
        if (max > 0) im.style.transform = `translate3d(0,${(-max * smooth(clamp((p - 0.04) / 0.92))).toFixed(1)}px,0)`;
      });
    },
    wall(p, s) {
      const base = (vh - (s.top - scrollY)) * 0.35;
      wallRows.forEach((row, i) => {
        if (!row._half) row._half = row.scrollWidth / 2;
        const half = row._half, dir = i % 2 ? 1 : -1;
        let x = (base * (1 + i * 0.25)) % half;
        row.style.transform = `translate3d(${dir < 0 ? -x : x - half}px,0,0)`;
      });
    },
  };

  /* nav: hide on the way down, back on the way up; mark the section */
  let navY = scrollY;
  const navLinks = $$(".nav nav a, .ch-sheet a[href^='#']"); // r141: and the sheet's list
  const navIO = new IntersectionObserver((es) => {
    for (const e of es) if (e.isIntersecting) navLinks.forEach((a) => a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id));
  }, { rootMargin: "-50% 0px -50% 0px" });
  ["idea", "drive", "worlds", "rides", "website", "work", "studio", "go"].forEach((id) => { const s = document.getElementById(id); s && navIO.observe(s); });

  // r141: the sheet of sections (a phone's menu); the line along the bar is how far down the page you are
  const menuBtn = $(".nav-menu"), chapters = $("#chapters");
  const setMenu = (on) => {
    if (!menuBtn || !chapters) return;
    root.classList.toggle("menu-on", on);
    menuBtn.setAttribute("aria-expanded", on ? "true" : "false");
    if (on) { chapters.hidden = false; requestAnimationFrame(() => chapters.classList.add("in")); }
    else { chapters.classList.remove("in"); setTimeout(() => { if (!root.classList.contains("menu-on")) chapters.hidden = true; }, 320); }
  };
  if (menuBtn && chapters) {
    menuBtn.addEventListener("click", () => setMenu(!root.classList.contains("menu-on")));
    chapters.addEventListener("click", (e) => { if (e.target === chapters || e.target.closest("a")) setMenu(false); });
    addEventListener("keydown", (e) => { if (e.key === "Escape" && root.classList.contains("menu-on")) { setMenu(false); menuBtn.focus(); } });
  }
  let progShown = -1;
  let ticking = false;
  const frame = (now) => {
    ticking = false;
    const y = scrollY;
    if (Math.abs(y - navY) > 8) { nav.classList.toggle("hide", y > navY && y > vh * 0.6 && !root.classList.contains("menu-on")); navY = y; }
    const prog = Math.round(clamp(y / Math.max(1, docH - vh)) * 200) / 200;
    if (prog !== progShown) { progShown = prog; nav.style.setProperty("--prog", prog); }
    // the theme under the nav (the deepest themed block there): the bar and the browser chrome follow it
    const top = y + 34;
    let th = null, thD = -1;
    for (const t of themed) if (t.top <= top && t.top + t.h > top && t.depth > thD) { th = t; thD = t.depth; }
    if (th) setTop(th.el.closest(".z-worlds") && worldTheme ? worldTheme : th.theme);
    for (const s of scenes) {
      if (s.top + s.h < y - vh * 0.5 || s.top > y + vh * 1.5) continue;
      const p = clamp((y - s.top) / Math.max(1, s.h - vh));
      update[s.kind]?.(p, s);
    }
    if (words.length) {
      const t = clamp((vh * 0.85 - (read._top - y)) / (read._h + vh * 0.35));
      const n = Math.round(t * words.length);
      words.forEach((w, i) => w.classList.toggle("lit", i < n));
    }
    tick3d(now);
  };
  const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  let lastScrollAt = 0, loadedAt = Infinity, idleCheck = 0;
  addEventListener("scroll", () => { lastScrollAt = performance.now(); req(); }, { passive: true });
  addEventListener("load", () => { loadedAt = performance.now(); setTimeout(req, 1600); }, { once: true });
  let rzT = 0;
  addEventListener("resize", () => { clearTimeout(rzT); rzT = setTimeout(measure, 120); req(); });
  try { new ResizeObserver(() => { clearTimeout(rzT); rzT = setTimeout(measure, 120); }).observe($("main")); } catch {}
  addEventListener("load", measure, { once: true });
  // one steady clock: the police dial, the live city's slow turns, settling after a change
  // the city shares this page's thread: when frames run long while it is on screen, it draws every other frame, then
  // at a lower resolution; when things are easy again it climbs back
  const gov = { last: 0, avg: 16.7, lvl: 0, since: 0 };
  const governor = (now) => {
    const dt = now - gov.last; gov.last = now;
    if (!(stageOn && live) || dt > 200) { gov.since = now; return; }
    gov.avg += (dt - gov.avg) * 0.06;
    const up = gov.lvl === 0 ? gov.avg > 21 : gov.avg > 24, down = gov.avg < 17.4;
    if (!up && !down) { gov.since = now; return; }
    if (up && gov.lvl < 2 && now - gov.since > (gov.lvl ? 2000 : 1000)) { gov.lvl++; gov.since = now; send({ op: "rate", half: true, dpr: gov.lvl === 2 ? 1 : undefined }); }
    else if (down && gov.lvl > 0 && now - gov.since > 5000) { gov.lvl--; gov.since = now; send({ op: "rate", half: gov.lvl > 0, dpr: gov.lvl < 2 ? Math.min(devicePixelRatio || 1, phone() ? 1.5 : 2) : 1 }); }
    else if (!(up && gov.lvl < 2) && !(down && gov.lvl > 0)) gov.since = now;
  };
  const loop = (now) => {
    governor(now);
    if (stageOn || now < settleUntil || veilT || applied.paused === false) req();
    else if (((!asked && can3D) || (live && applied.paused === true)) && now - idleCheck > 500) { idleCheck = now; req(); } // r141: and a look now and then while the city waits, for the warm-up
    requestAnimationFrame(loop);
  };
  measure();
  frame(performance.now());
  requestAnimationFrame(loop);

  /* ---------- r138k: the buttons into the map are windows onto it ----------
     Behind the glass the city pans with the pointer, as if you were looking around through it (not with reduced
     motion; then it simply stays centred). */
  const wins = $$(".see-map");
  if (wins.length) {
    const place = (b, e) => {
      if (RM || !e || e.clientX == null) return;
      const r = b.getBoundingClientRect();
      const fx = clamp((e.clientX - r.left) / r.width), fy = clamp((e.clientY - r.top) / r.height);
      b.style.setProperty("--bx", (28 + fx * 44).toFixed(1) + "%");
      b.style.setProperty("--by", (34 + fy * 24).toFixed(1) + "%");
    };
    wins.forEach((b) => {
      b.addEventListener("pointerenter", (e) => place(b, e));
      b.addEventListener("pointermove", (e) => place(b, e), { passive: true });
      b.addEventListener("pointerdown", (e) => { place(b, e); if (e.pointerType !== "mouse") b.classList.add("peek"); });
      for (const t of ["pointerup", "pointercancel", "pointerleave"]) b.addEventListener(t, () => setTimeout(() => b.classList.remove("peek"), 450));
      b.addEventListener("focus", () => place(b));
    });
    addEventListener("pageshow", () => wins.forEach((b) => b.classList.remove("peek")));
    addEventListener("load", () => setTimeout(() => root.classList.add("map-win"), 1200), { once: true }); // TASK-053: the CSS fetches the picture (once)
  }
})();
