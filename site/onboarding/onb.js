/* Cromatic Studios · The new website · launch page. No framework: one rAF loop for the scroll scenes. */
(() => {
  const root = document.documentElement;
  const RM = root.classList.contains("rm");
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
  const smooth = (t) => t * t * (3 - 2 * t);
  let vw = innerWidth, vh = innerHeight;

  /* ---------- videos: play only while on screen ---------- */
  const vids = $$("video.lazy-v, video.layer, .hero-v");
  if (RM) {
    vids.forEach((v) => { v.removeAttribute("autoplay"); v.pause?.(); v.controls = true; v.preload = "none"; });
  } else {
    const vio = new IntersectionObserver((es) => {
      for (const e of es) {
        const v = e.target;
        if (v.classList.contains("layer")) continue; // map layers are driven by the steps
        if (e.isIntersecting) { const p = v.play(); p && p.catch(() => {}); } else v.pause();
      }
    }, { threshold: 0.2 });
    vids.forEach((v) => vio.observe(v));
  }

  /* ---------- reveal on enter ---------- */
  const rio = new IntersectionObserver((es) => {
    for (const e of es) if (e.isIntersecting) { e.target.classList.add("in"); rio.unobserve(e.target); }
  }, { threshold: 0.18, rootMargin: "0px 0px -6% 0px" });
  $$(".reveal").forEach((el) => rio.observe(el));

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
      const b = e.target, to = +b.dataset.count, suf = b.dataset.suffix || "", from = to > 1000 ? to - 24 : 0;
      if (RM) continue;
      const t0 = performance.now(), d = 1400;
      const tick = (now) => { const u = clamp((now - t0) / d); b.textContent = Math.round(from + (to - from) * (1 - Math.pow(1 - u, 3))) + suf; if (u < 1) requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
    }
  }, { threshold: 0.6 });
  $$("[data-count]").forEach((b) => nio.observe(b));

  /* ---------- map steps ---------- */
  const stepEls = $$("[data-step]");
  const layers = $$(".steps-stage .layer");
  let curStep = -1;
  const setStep = (i) => {
    if (i === curStep) return;
    curStep = i;
    stepEls.forEach((s) => s.classList.toggle("on", +s.dataset.step === i));
    layers.forEach((l) => {
      const on = +l.dataset.layer === i;
      l.classList.toggle("on", on);
      if (l.tagName === "VIDEO" && !RM) { if (on) { l.currentTime = 0; const p = l.play(); p && p.catch(() => {}); } else l.pause(); }
    });
  };
  if (stepEls.length) {
    setStep(0);
    const sio = new IntersectionObserver((es) => { for (const e of es) if (e.isIntersecting) setStep(+e.target.dataset.step); }, { rootMargin: "-45% 0px -45% 0px" });
    stepEls.forEach((s) => sio.observe(s));
  }

  /* ---------- the case wall ---------- */
  const STREET = { c: "#28C840", f: "#119BFE", m: "#F28BA8", p: "#FED012" };
  const CASES = [
    ["two-minutes", "Two Minutes", "c"], ["investimental", "Investimental", "f"], ["the-aesthetic-court", "The Aesthetic Court", "m"], ["slow-coffee-festival", "Slow Coffee Festival", "c"],
    ["sticker-republic", "Sticker Republic", "p"], ["arca-resort", "ARCA Resort", "c"], ["techventures-bank", "Techventures Bank", "f"], ["toskani-med", "Toskani MED", "m"],
    ["oma-coffee", "OMA Coffee", "c"], ["unchain-festival", "Unchain Festival", "f"], ["antila", "Antila", "c"], ["elithia", "Elithia", "m"],
    ["steam", "Steam Coffee Shop", "c"], ["bepco", "Bepco", "f"], ["clinica-sante", "Clinica Sante", "m"], ["printoteca", "Printoteca", "p"],
    ["artisan-coffee-gear", "Artisan Coffee Gear", "c"], ["infinity-capital", "Infinity Capital", "f"], ["routine-paris", "Routine Paris", "m"], ["craft-coffee", "Craft Coffee", "c"],
    ["longshield", "Longshield", "f"], ["help-4-brain", "Help 4 Brain", "m"], ["sip-coffee-wine", "Sip Coffee & Wine", "c"], ["esd", "ESD", "f"],
    ["altius", "Altius", "m"], ["casa-berero", "Casa Berero", "c"], ["assetto", "Assetto", "f"], ["pain-plaisir", "Pain Plaisir", "c"],
    ["witanalitica", "Witanalytica", "f"], ["kompus", "Kómpus", "c"], ["venevo", "Venevo", "f"], ["yoshi-izakaya", "Yoshi Izakaya", "c"],
    ["unde", "UNDÉ", "c"], ["patiline", "Patiline", "c"],
  ];
  const wall = $("[data-wall]");
  let wallRows = [];
  if (wall) {
    const per = Math.ceil(CASES.length / 3);
    for (let r = 0; r < 3; r++) {
      const list = CASES.slice(r * per, r * per + per);
      const row = document.createElement("div");
      row.className = "wall-row";
      const html = list.map(([s, n, st]) => `<a class="case" href="/work/${s}/" style="--sc:${STREET[st]}"><img src="media/covers/${s}.webp" alt="${n}" loading="lazy" width="560" height="380"><i aria-hidden="true"></i><span>${n}</span></a>`).join("");
      row.innerHTML = RM ? html : html + html.replace(/<a /g, '<a aria-hidden="true" tabindex="-1" ');
      wall.appendChild(row);
      wallRows.push(row);
    }
  }

  /* ---------- the speedometer (same geometry as the drive's dash) ---------- */
  const dial = $(".dial");
  const A0 = -105, SW = 270, RED_F = 200 / 240;
  const arcPt = (a, r) => { const t = (a * Math.PI) / 180; return [60 + r * Math.sin(t), 60 - r * Math.cos(t)]; };
  const arcPath = (a0, a1, r) => { const [x0, y0] = arcPt(a0, r), [x1, y1] = arcPt(a1, r); return `M${x0.toFixed(2)} ${y0.toFixed(2)} A${r} ${r} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1.toFixed(2)} ${y1.toFixed(2)}`; };
  if (dial) {
    $(".dd-arc", dial).setAttribute("d", arcPath(A0, A0 + SW, 49));
    $(".dd-red", dial).setAttribute("d", arcPath(A0 + SW * RED_F, A0 + SW, 49));
    let t = "";
    for (let i = 0; i <= 10; i++) { const a = A0 + (SW * i) / 10, mj = i % 5 === 0; const [x0, y0] = arcPt(a, mj ? 38 : 41), [x1, y1] = arcPt(a, 45); t += `<line x1="${x0.toFixed(2)}" y1="${y0.toFixed(2)}" x2="${x1.toFixed(2)}" y2="${y1.toFixed(2)}" class="${mj ? "mj" : ""}"/>`; }
    $(".dd-ticks", dial).innerHTML = t;
  }
  const police = { el: $("[data-police]"), on: false, kmh: 0, red: 0, state: "idle", until: 0, cool: 0 };
  const pill = $(".cop-pill");
  const setPill = (state) => {
    police.state = state;
    pill.className = "cop-pill pop " + (state === "idle" ? "idle" : state === "free" ? "free" : "");
    const b = $("b", pill), s = $("span.mono", pill);
    if (state === "idle") { b.textContent = "SPEED LIMIT 50"; s.textContent = "SCROLL FAST TO TEST IT"; }
    if (state === "pulled") { b.textContent = "PULLED OVER"; s.textContent = "UNDER SURVEILLANCE · MAX 50 KM/H"; try { if (navigator.userActivation?.hasBeenActive) navigator.vibrate?.([80, 60, 80, 60, 120]); } catch {} }
    if (state === "free") { b.textContent = "✓ FREE TO GO"; s.textContent = "DRIVE NICE OUT THERE"; }
  };
  if (police.el && !RM) new IntersectionObserver((es) => { police.on = es[0].isIntersecting; }, { threshold: 0.3 }).observe(police.el);

  /* ---------- scroll scenes ---------- */
  const scenes = RM ? [] : $$("[data-scene]").map((el) => ({ el, kind: el.dataset.scene }));
  if (RM) root.classList.add("no-scenes");

  // the drive, frame by frame
  const scrub = $(".scrub");
  const canvas = $(".scrub-c"), ctx = canvas?.getContext("2d");
  const N = 56, frames = new Array(N);
  let framesAsked = false, lastDrawn = -1;
  const askFrames = () => {
    if (framesAsked) return; framesAsked = true;
    const order = [];
    for (let s = 8; s >= 1; s = s >> 1) for (let i = 0; i < N; i += s) if (!order.includes(i)) order.push(i);
    for (let i = 0; i < N; i++) if (!order.includes(i)) order.push(i);
    order.forEach((i, k) => setTimeout(() => { const im = new Image(); im.decoding = "async"; im.onload = () => { frames[i] = im; lastDrawn = -1; }; im.src = `media/seq/d${String(i).padStart(2, "0")}.webp`; }, k * 25));
  };
  if (scrub && !RM) new IntersectionObserver((es) => { if (es[0].isIntersecting) askFrames(); }, { rootMargin: "1600px 0px" }).observe(scrub);
  const drawFrame = (i) => {
    if (!ctx) return;
    let k = i; while (k >= 0 && !frames[k]) k--;
    if (k < 0) { k = i; while (k < N && !frames[k]) k++; }
    const im = frames[k]; if (!im || k === lastDrawn) return;
    lastDrawn = k;
    const cw = canvas.clientWidth, ch = canvas.clientHeight, dpr = Math.min(2, devicePixelRatio || 1);
    if (canvas.width !== Math.round(cw * dpr) || canvas.height !== Math.round(ch * dpr)) { canvas.width = Math.round(cw * dpr); canvas.height = Math.round(ch * dpr); }
    const s = Math.max(canvas.width / im.width, canvas.height / im.height), w = im.width * s, h = im.height * s;
    ctx.drawImage(im, (canvas.width - w) / 2, (canvas.height - h) / 2, w, h);
  };

  const hero = { frame: $(".hero-frame"), copy: $(".hero-copy"), after: $(".hero-after"), cue: $(".scroll-cue") };
  const kin = $$(".kin li");
  const track = $(".streets-track");
  const caps = $$(".cap");
  const sbar = $(".scrub-bar");
  const worlds = $$(".world"), wdots = $$(".worlds-dots li");
  // the captions leave the figures so the wipe does not cut them in half
  let wcaps = [];
  if (!RM && worlds.length) {
    const box = document.createElement("div"); box.className = "worlds-caps";
    worlds.forEach((w) => { const c = w.querySelector("figcaption"); c.style.setProperty("--wc", getComputedStyle(w).getPropertyValue("--wc")); box.appendChild(c); wcaps.push(c); w.setAttribute("aria-label", c.textContent.trim()); });
    $(".worlds-pin").appendChild(box);
    const edge = document.createElement("i"); edge.className = "wipe-edge"; $(".worlds-pin").appendChild(edge);
  }
  const xpRows = $$(".xl-row"), you = $(".you"), xpNum = $("[data-xp]"), xpNum2 = $("[data-xp2]"), chip = $(".xp-chip");
  const feats = $$(".site-feats li"), longs = $$(".site-scroll .long-img");
  longs.forEach((im) => { im.addEventListener("load", () => req()); });
  let xpShown = -1, boomed = false;

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
    streets(p, el) {
      const max = track.scrollWidth - vw;
      track.style.transform = `translate3d(${-max * smooth(clamp((p - 0.06) / 0.88))}px,0,0)`;
    },
    scrub(p) {
      const i = Math.round(clamp(p) * (N - 1));
      drawFrame(i);
      const c = Math.min(caps.length - 1, Math.floor(p * caps.length));
      caps.forEach((x, k) => x.classList.toggle("on", k === c));
      sbar.style.setProperty("--p", p.toFixed(4));
    },
    worlds(p) {
      const n = worlds.length, t = clamp(p * 1.04) * (n - 1);
      let ex = -1;
      worlds.forEach((w, i) => {
        if (i === 0) return;
        const r = smooth(clamp((t - (i - 1)) * 1.5 - 0.25));
        if (r > 0 && r < 1) ex = (1 - r) * 100;
        w.style.clipPath = r >= 1 ? "none" : `inset(0 0 0 ${((1 - r) * 100).toFixed(2)}%)`;
        w.style.visibility = r <= 0 ? "hidden" : "visible";
      });
      let cur = 0;
      worlds.forEach((w, i) => { if (i === 0 || smooth(clamp((t - (i - 1)) * 1.5 - 0.25)) > 0.55) cur = i; });
      wdots.forEach((d, i) => d.classList.toggle("on", i === cur));
      wcaps.forEach((c, i) => c.classList.toggle("on", i === cur));
      const edge = $(".wipe-edge"); if (edge) { edge.style.left = ex.toFixed(2) + "%"; edge.style.opacity = ex < 0 ? 0 : 1; }
    },
    xp(p) {
      const n = Math.min(xpRows.length, Math.floor(clamp((p - 0.08) / 0.78) * (xpRows.length + 0.999)));
      let pts = 0;
      xpRows.forEach((r, i) => { const got = i < n; r.classList.toggle("got", got); if (got) pts += +r.dataset.pts; });
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
    wall(p, el, r) {
      const base = (vh - r.top) * 0.35;
      wallRows.forEach((row, i) => {
        const half = row.scrollWidth / 2, dir = i % 2 ? 1 : -1;
        let x = (base * (1 + i * 0.25)) % half;
        row.style.transform = `translate3d(${dir < 0 ? -x : x - half}px,0,0)`;
      });
    },
  };

  /* police: the speedometer reads your scroll */
  let lastY = scrollY, lastT = performance.now();
  const policeTick = (now) => {
    if (!dial) return;
    const dt = Math.max(1, now - lastT), dy = Math.abs(scrollY - lastY);
    lastY = scrollY; lastT = now;
    const target = police.on && police.state !== "pulled" ? clamp((dy / dt) * 1000 / 16, 0, 240) : police.state === "pulled" ? Math.min(police.kmh, 50) : 0;
    police.kmh += (target - police.kmh) * (target > police.kmh ? 0.35 : 0.06);
    if (police.state === "pulled") police.kmh = Math.min(police.kmh, 50);
    const k = Math.round(police.kmh);
    const num = $(".dd-num", dial); if (num.textContent !== String(k)) num.textContent = k;
    $(".dd-needle", dial).style.transform = `rotate(${A0 + (SW * police.kmh) / 240}deg)`;
    const red = police.kmh >= 200;
    dial.classList.toggle("red", red);
    if (red && police.state === "idle" && now > police.cool) { police.red += dt; if (police.red > 500) { setPill("pulled"); police.until = now + 10000; police.red = 0; } } else police.red = 0;
    if (police.state === "pulled") {
      const s = Math.ceil((police.until - now) / 1000);
      const em = $("em", pill); if (em) em.textContent = `0:${String(Math.max(0, s)).padStart(2, "0")}`;
      if (now >= police.until) { setPill("free"); police.cool = now + 6000; setTimeout(() => setPill("idle"), 2400); }
    }
  };

  /* nav: hide on the way down, back on the way up; mark the section */
  const nav = $(".nav");
  let navY = scrollY;
  const navLinks = $$(".nav nav a");
  const navIO = new IntersectionObserver((es) => {
    for (const e of es) if (e.isIntersecting) navLinks.forEach((a) => a.classList.toggle("on", a.getAttribute("href") === "#" + e.target.id));
  }, { rootMargin: "-50% 0px -50% 0px" });
  ["map", "drive", "website", "worlds", "xp"].forEach((id) => { const s = document.getElementById(id); s && navIO.observe(s); });

  let ticking = false;
  const frame = (now) => {
    ticking = false;
    const y = scrollY;
    if (Math.abs(y - navY) > 8) { nav.classList.toggle("hide", y > navY && y > vh * 0.6); navY = y; }
    for (const s of scenes) {
      const r = s.el.getBoundingClientRect();
      if (r.bottom < -vh * 0.5 || r.top > vh * 1.5) continue;
      const total = Math.max(1, r.height - vh);
      const p = clamp(-r.top / total);
      update[s.kind]?.(p, s.el, r);
    }
    if (words.length) {
      const r = read.getBoundingClientRect();
      const t = clamp((vh * 0.85 - r.top) / (r.height + vh * 0.35));
      const n = Math.round(t * words.length);
      words.forEach((w, i) => w.classList.toggle("lit", i < n));
    }
  };
  const req = () => { if (!ticking) { ticking = true; requestAnimationFrame(frame); } };
  addEventListener("scroll", req, { passive: true });
  addEventListener("resize", () => { vw = innerWidth; vh = innerHeight; lastDrawn = -1; req(); });
  // the police dial needs a steady clock while it is on screen
  const loop = (now) => { policeTick(now); requestAnimationFrame(loop); };
  if (!RM) requestAnimationFrame(loop);
  frame(performance.now());
  // frames arriving late: redraw the scrub once they land
  setInterval(() => { if (lastDrawn === -1 && framesAsked) req(); }, 300);
})();
