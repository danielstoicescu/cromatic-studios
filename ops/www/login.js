// TASK-124 · /ops login: email -> 6-digit code -> session cookie (set by the server). Nothing secret lives here.
// The server's answers are neutral: the page never says whether an email is on the list.
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  const lg = $("lg"), pill = $("pill"), email = $("email"), code = $("code"), dots = [...$("dots").children], msgEl = $("msg");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  // the theme: same key as the dashboard ("ops-theme"), so the choice carries over after login
  const THEME_K = "ops-theme", darkMQ = matchMedia("(prefers-color-scheme: dark)");
  let themePick = null; try { const v = localStorage.getItem(THEME_K); themePick = v === "light" || v === "dark" ? v : null; } catch {}
  const isDark = () => (themePick ? themePick === "dark" : darkMQ.matches);
  function applyTheme() {
    if (themePick) document.documentElement.dataset.theme = themePick; else delete document.documentElement.dataset.theme;
    const b = $("thsw"), d = isDark(); b.classList.toggle("on", d); b.setAttribute("aria-checked", String(d));
    b.setAttribute("aria-label", d ? "Temă întunecată, pornită. Comută pe luminos" : "Temă luminoasă. Comută pe întunecat");
  }
  applyTheme(); darkMQ.addEventListener && darkMQ.addEventListener("change", applyTheme);
  $("thsw").onclick = () => { themePick = isDark() ? "light" : "dark"; try { localStorage.setItem(THEME_K, themePick); } catch {} applyTheme(); };
  const RESEND = 60; // seconds between two codes from this page (the server also limits per email and per IP)
  let state = "", sentTo = "", busy = false, cool = 0, coolT = 0;

  const post = async (path, body) => {
    const r = await fetch(path, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    let j = {}; try { j = await r.json(); } catch {}
    return { status: r.status, ...j };
  };
  const msg = (html, err) => { msgEl.innerHTML = html || ""; msgEl.classList.toggle("err", !!err); };
  const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  function setState(s) {
    state = s; lg.dataset.state = s;
    email.tabIndex = $("go").tabIndex = s === "email" || s === "sending" ? 0 : -1;
    code.tabIndex = s === "code" ? 0 : -1;
    email.readOnly = s === "sending";
  }

  // 1. the filled pill, then it empties into the email field (after a beat, or at the first touch / key / focus)
  setState("intro");
  let opened = false;
  function open() {
    if (opened) return; opened = true; clearTimeout(introT); removeEventListener("load", startIntro);
    ["pointerdown", "keydown", "focusin"].forEach((t) => removeEventListener(t, open, true));
    setState("email");
    setTimeout(() => email.focus({ preventScroll: true }), reduced ? 0 : 380);
  }
  // the beat starts once the page (and its fonts) has loaded, so the filled pill is really seen
  let introT = 0;
  const startIntro = () => { introT = setTimeout(open, reduced ? 0 : 1500); };
  if (reduced || document.readyState === "complete") startIntro(); else addEventListener("load", startIntro, { once: true });
  ["pointerdown", "keydown", "focusin"].forEach((t) => addEventListener(t, open, true));

  // 2. the email
  $("f-email").onsubmit = async (e) => {
    e.preventDefault();
    if (state !== "email") return;
    const v = email.value.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { msg("Scrie un email valid, de forma nume@cromaticstudios.com.", true); nudge(); email.focus(); return; }
    setState("sending"); msg("Se trimite…");
    try {
      const r = await post("/api/ops/login", { email: v });
      if (r.status === 429) { setState("email"); msg("Prea multe încercări de pe acest dispozitiv. Mai încearcă peste 15 minute.", true); return; }
      if (!r.ok) { setState("email"); msg("Nu a mers. Mai încearcă o dată.", true); return; }
      sentTo = v; toCode(); startCool();
      msg("Dacă <b>" + esc(v) + "</b> e în echipă, codul e deja pe drum. Merge 10 minute.");
    } catch { setState("email"); msg("Fără conexiune. Mai încearcă.", true); }
  };
  function nudge() { pill.animate && !reduced && pill.animate([{ transform: "translateX(0)" }, { transform: "translateX(-8px)" }, { transform: "translateX(8px)" }, { transform: "translateX(0)" }], { duration: 320 }); }

  // 3. the code: one real input under six circles
  function toCode() { code.value = ""; draw(); setState("code"); setTimeout(() => code.focus({ preventScroll: true }), reduced ? 0 : 420); }
  function draw() {
    const n = code.value.length;
    dots.forEach((d, i) => { d.textContent = code.value[i] || ""; d.classList.toggle("on", i < n); d.classList.toggle("cur", i === n && document.activeElement === code); });
  }
  code.addEventListener("input", () => {
    const v = code.value.replace(/\D/g, "").slice(0, 6);
    if (v !== code.value) code.value = v;
    draw();
    if (v.length === 6) verify(v);
  });
  code.addEventListener("focus", draw); code.addEventListener("blur", draw);
  $("dots").addEventListener("click", () => code.focus());
  $("f-code").onsubmit = (e) => { e.preventDefault(); if (code.value.length === 6) verify(code.value); };

  async function verify(c) {
    if (busy) return; busy = true;
    try {
      const r = await post("/api/ops/verify", { email: sentTo, code: c });
      if (r.ok) return success();
      if (r.status === 429) { bad("Prea multe încercări. Mai încearcă peste 15 minute."); return; }
      if (r.error === "code") { bad("Cod greșit · mai " + (r.left === 1 ? "ai o încercare" : "ai " + r.left + " încercări"), true); return; }
      if (r.error === "locked") { bad("Prea multe coduri greșite. Cere unul nou."); hot(); return; }
      bad("Codul a expirat sau nu mai e valid."); hot();
    } catch { bad("Fără conexiune. Mai încearcă."); }
    finally { busy = false; const v = code.value; if (v.length === 6 && v !== c) verify(v); }
  }
  function bad(text, soft) {
    msg(text, true);
    const box = $("dots"); box.classList.remove("bad"); void box.offsetWidth; box.classList.add("bad");
    setTimeout(() => { box.classList.remove("bad"); code.value = ""; draw(); code.focus({ preventScroll: true }); if (soft) msgEl.classList.remove("err"); }, reduced ? 0 : 650);
  }
  function hot() { $("resend").classList.add("hot"); label(); }
  const label = () => { const b = $("resend"), h = b.classList.contains("hot"); b.textContent = cool > 0 ? (h ? "trimite alt cod în " : "retrimite în ") + Math.floor(cool / 60) + ":" + String(cool % 60).padStart(2, "0") : h ? "trimite alt cod" : "nu a venit codul? retrimite"; };

  // 4. in: the circles go back into the pill, a burst, "salut, <Nume>", then the dashboard
  async function success() {
    let name = "";
    try { const r = await fetch("/api/ops/me", { credentials: "same-origin", cache: "no-store" }); const j = await r.json(); name = (j.user && j.user.name) || ""; } catch {}
    code.blur(); setState("ok"); msg("");
    $("hello").textContent = name ? "salut, " + name : "salut";
    if (!reduced) burst();
    setTimeout(() => lg.classList.add("leave"), reduced ? 300 : 1250);
    setTimeout(() => location.replace("/ops"), reduced ? 350 : 1750);
  }
  function burst() {
    const r = pill.getBoundingClientRect(), C = ["#FED012", "#28C840", "#119BFE", "#B098C8", "#F65342"];
    for (let i = 0; i < 28; i++) {
      const s = document.createElement("i"); s.className = "spark";
      const a = (i / 28) * Math.PI * 2 + Math.random() * .3, d = 90 + Math.random() * 120;
      s.style.left = r.left + r.width / 2 + "px"; s.style.top = r.top + r.height / 2 + "px";
      s.style.setProperty("--dx", Math.cos(a) * d * 1.4 + "px"); s.style.setProperty("--dy", Math.sin(a) * d + "px");
      s.style.background = C[i % C.length]; s.style.animationDelay = Math.random() * 120 + "ms";
      lg.append(s); setTimeout(() => s.remove(), 1200);
    }
  }

  // 5. secondary links
  $("change").onclick = () => { $("resend").classList.remove("hot"); label(); msg(""); setState("email"); setTimeout(() => { email.focus({ preventScroll: true }); email.select(); }, reduced ? 0 : 380); };
  $("resend").onclick = async () => {
    if (cool > 0 || !sentTo) return;
    const b = $("resend"); b.disabled = true; b.classList.remove("hot");
    try {
      const r = await post("/api/ops/login", { email: sentTo });
      if (r.status === 429) { msg("Prea multe încercări. Mai încearcă peste 15 minute.", true); startCool(15 * 60); return; }
      msg("Am trimis alt cod, dacă <b>" + esc(sentTo) + "</b> e în echipă. Cel vechi nu mai merge.");
      code.value = ""; draw(); code.focus({ preventScroll: true }); startCool();
    } catch { msg("Fără conexiune. Mai încearcă.", true); b.disabled = false; }
  };
  function startCool(sec) {
    cool = sec || RESEND; clearInterval(coolT);
    const b = $("resend"), tick = () => {
      if (cool <= 0) { clearInterval(coolT); b.disabled = false; label(); return; }
      b.disabled = true; label(); cool--;
    };
    tick(); coolT = setInterval(tick, 1000);
  }
})();
