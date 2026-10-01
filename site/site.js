// Cromatic Studios · the lo-fi website. Menu, lazy video, the YouTube facade, reveal on scroll
// and the boarding-pass form (the same POST /api/boarding the drive uses).
(() => {
  const d = document, root = d.documentElement;
  root.classList.add("js");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // mobile menu
  const mb = d.querySelector(".menu-btn"), mn = d.getElementById("mnav");
  if (mb && mn) {
    const set = (on) => { mb.setAttribute("aria-expanded", String(on)); mn.classList.toggle("open", on); };
    mb.addEventListener("click", () => set(mb.getAttribute("aria-expanded") !== "true"));
    mn.addEventListener("click", (e) => { if (e.target.closest("a")) set(false); });
  }

  // videos load and play only while on screen
  const vids = [...d.querySelectorAll("video.lv")];
  if ("IntersectionObserver" in window) {
    const io = new IntersectionObserver((es) => es.forEach(({ target: v, isIntersecting: on }) => {
      if (on) { if (!v.src) v.src = v.dataset.src; if (!reduced) v.play().catch(() => {}); }
      else if (v.src) v.pause();
    }), { rootMargin: "200px 0px" });
    vids.forEach((v) => io.observe(v));
    // gentle reveal
    const rv = [...d.querySelectorAll(".chap, .pcard, .svc, .tl li, .qa details, .cblock, .photos figure")];
    const io2 = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add("in"); io2.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
    rv.forEach((el, i) => { el.classList.add("rv"); el.style.transitionDelay = `${(i % 3) * 70}ms`; io2.observe(el); });
  } else vids.forEach((v) => { v.src = v.dataset.src; });

  // the hero: the drive's kinetic intro plays over the first fold, once per visit; when the
  // screen is full of coffee the page jumps to the next fold, so the cups lift off onto it
  const kjs = d.body.dataset.kzJs;
  if (kjs && root.classList.contains("kz-wait")) {
    const link = d.createElement("link"); link.rel = "stylesheet"; link.href = d.body.dataset.kzCss; d.head.appendChild(link);
    const sc = d.createElement("script"); sc.src = kjs; sc.async = true;
    const release = () => root.classList.remove("kz-wait");
    sc.onerror = release;
    sc.onload = () => {
      clearTimeout(window.__kzT);
      if (!window.cromaticKinetic) return release();
      const next = d.getElementById("clients") || d.querySelector(".clients");
      let over = false;
      const k = window.cromaticKinetic(() => {
        over = true; release();
        try { sessionStorage.setItem("kzSeen", "1"); } catch {}
        removeEventListener("wheel", skip); removeEventListener("touchmove", skip); removeEventListener("keydown", skip);
      }, async () => {
        release();
        if (next) scrollTo({ top: next.getBoundingClientRect().top + scrollY - 72, behavior: "instant" });
      });
      const skip = () => { if (!over && !k.busy) k.finish(); };
      addEventListener("wheel", skip, { passive: true }); addEventListener("touchmove", skip, { passive: true }); addEventListener("keydown", skip);
      link.sheet ? k.resume() : link.addEventListener("load", () => k.resume(), { once: true });
      setTimeout(() => { if (!over) release(); }, 30000);
    };
    d.body.appendChild(sc);
  }

  // brand canvas: on desktop the page scrolls down while the board slides left; on phones the
  // board is dragged sideways. Elements appear as they enter the screen.
  if (/[?&]embed\b/.test(location.search)) root.classList.add("embed");
  const cv = d.querySelector(".cv");
  if (cv) {
    const sticky = cv.querySelector(".cv-sticky"), track = cv.querySelector(".cv-track"), bar = cv.querySelector(".cv-bar");
    const els = [...cv.querySelectorAll(".cv-el")];
    const mq = matchMedia("(max-width: 760px), (pointer: coarse)");
    let travel = 0, raf = 0, batch = 0;
    const reveal = () => {
      const R = innerWidth * 0.94;
      let n = 0;
      for (const e of els) {
        if (e.classList.contains("in")) continue;
        const r = e.getBoundingClientRect();
        if (r.left < R && r.right > -40) { e.style.transitionDelay = `${Math.min(n++, 10) * 55}ms`; e.classList.add("in"); }
      }
    };
    const tick = () => {
      raf = 0;
      let p;
      if (mq.matches) {
        const max = sticky.scrollWidth - sticky.clientWidth;
        p = max > 0 ? sticky.scrollLeft / max : 0;
      } else {
        const top = cv.getBoundingClientRect().top - (root.classList.contains("embed") ? 0 : 72);
        p = travel > 0 ? Math.min(1, Math.max(0, -top / travel)) : 0;
        track.style.transform = `translate3d(${(-p * travel).toFixed(1)}px,0,0)`;
      }
      bar?.style.setProperty("--p", p.toFixed(4));
      if (p > 0.01) cv.classList.add("moved");
      reveal();
    };
    const queue = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const layout = () => {
      if (mq.matches) { cv.style.height = ""; track.style.transform = ""; }
      else { travel = Math.max(0, track.scrollWidth - innerWidth); cv.style.height = `${travel + sticky.offsetHeight}px`; }
      queue();
    };
    addEventListener("scroll", queue, { passive: true });
    sticky.addEventListener("scroll", queue, { passive: true });
    addEventListener("resize", layout);
    mq.addEventListener?.("change", layout);
    // mouse drag works too (and on a touch laptop the board follows the finger natively)
    let drag = null;
    sticky.addEventListener("pointerdown", (e) => { if (!mq.matches || e.pointerType === "touch") return; drag = { x: e.clientX, s: sticky.scrollLeft }; sticky.setPointerCapture(e.pointerId); });
    sticky.addEventListener("pointermove", (e) => { if (drag) sticky.scrollLeft = drag.s - (e.clientX - drag.x); });
    sticky.addEventListener("pointerup", () => { drag = null; });
    // arrow keys move along the board on desktop
    sticky.addEventListener("keydown", (e) => { if (mq.matches) return; const k = { ArrowRight: 1, ArrowLeft: -1 }[e.key]; if (k) { e.preventDefault(); scrollBy({ top: k * innerWidth * 0.4, behavior: "smooth" }); } });
    // the board's images are wide: wait for the stage to have its size before measuring
    const st = cv.querySelector(".cv-stage");
    if ("ResizeObserver" in window) new ResizeObserver(layout).observe(st); else layout();
    layout();
  }

  // YouTube: a poster until clicked, then the privacy-friendly embed
  d.querySelectorAll(".yt").forEach((y) => y.querySelector(".yt-play")?.addEventListener("click", () => {
    y.innerHTML = `<iframe src="https://www.youtube-nocookie.com/embed/${y.dataset.id}?autoplay=1&rel=0&modestbranding=1&playsinline=1" title="Two Minutes film" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen></iframe>`;
  }));

  // the boarding pass
  const f = d.getElementById("bform");
  if (!f) return;
  const pick = {};
  f.querySelectorAll(".chips").forEach((g) => {
    const name = g.dataset.name, multi = g.dataset.multi === "1";
    pick[name] = multi ? [] : "";
    g.addEventListener("click", (e) => {
      const b = e.target.closest(".chip");
      if (!b) return;
      const v = b.textContent.trim(), on = b.getAttribute("aria-pressed") !== "true";
      if (multi) { b.setAttribute("aria-pressed", String(on)); pick[name] = on ? [...pick[name], v] : pick[name].filter((x) => x !== v); }
      else { g.querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", "false")); b.setAttribute("aria-pressed", String(on)); pick[name] = on ? v : ""; }
    });
  });
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
  const CODES = { "Branding": ["BRD", "Branding"], "Website / App": ["WEB", "Website / App"], "Video": ["VID", "Video"], "Growth & Social": ["GRW", "Growth & Social"], "Not sure yet": ["TBD", "Open route"] };
  const CLASS = { "Indie / local": "Indie Class", "Startup": "Startup Class", "Scale-up": "Growth Class", "Established": "First Class" };
  const BOARD = { "Yesterday :)": "Now boarding", "1 - 3 months": "In 1–3 months", "Just exploring": "Open ticket" };
  const MON = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
  const status = f.querySelector(".bf-status");
  const bars = (ref) => { let x = 0, s = ""; for (let i = 0; i < 44; i++) { const c = ref.charCodeAt(i % ref.length) * (i + 3), w = 1 + (c % 3); s += `<rect x="${x}" y="0" width="${w}" height="40"/>`; x += w + 1 + ((c >> 2) % 2); } return `<svg viewBox="0 0 ${x} 40" preserveAspectRatio="none" aria-hidden="true">${s}</svg>`; };

  f.addEventListener("submit", async (e) => {
    e.preventDefault();
    const v = (n) => (f.elements[n]?.value || "").trim();
    const name = v("name"), email = v("email");
    f.elements.name.setAttribute("aria-invalid", String(!name));
    const okMail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email);
    f.elements.email.setAttribute("aria-invalid", String(!okMail));
    if (!name || !okMail) { status.textContent = !name ? "We'd love to know your name." : "That email doesn't look right."; (!name ? f.elements.name : f.elements.email).focus(); return; }
    const now = new Date();
    let h = 2166136261;
    for (const ch of `${name}|${email}|${now.getTime()}`) h = Math.imul(h ^ ch.charCodeAt(0), 16777619) >>> 0;
    const t = {
      ref: "CS" + h.toString(36).toUpperCase().slice(0, 5).padStart(5, "0"),
      name, first: name.split(/\s+/)[0], email, phone: v("phone"), msg: v("msg"),
      date: `${String(now.getDate()).padStart(2, "0")} ${MON[now.getMonth()]} ${now.getFullYear()}`,
      time: `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`,
      flight: `CS ${String(99 + pick.dreams.length).padStart(3, "0")}`,
      stops: pick.dreams.map((x) => CODES[x] || ["TBD", x]), dreams: pick.dreams, biz: pick.biz, when: pick.when,
      klass: CLASS[pick.biz] || "Open Class", boarding: BOARD[pick.when] || "When you are ready",
      company_site: v("company_site")
    };
    const btn = f.querySelector("button[type=submit]");
    btn.disabled = true; status.textContent = "Printing your boarding pass…";
    let sent = false;
    try {
      const r = await fetch("/api/boarding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(t) });
      sent = r.ok;
      if (r.status === 429) { status.textContent = "Too many passes from here for now. Write to hi@cromaticstudios.com and we'll answer."; btn.disabled = false; return; }
    } catch {}
    if (!sent) {
      // no server (or it failed): hand it to the visitor's email app instead
      const body = `${t.msg}\n\n${t.name} · ${t.email}${t.phone ? " · " + t.phone : ""}\nDreaming about: ${t.dreams.join(", ") || "-"}\nBusiness: ${t.biz || "-"} · When: ${t.when || "-"}`;
      location.href = `mailto:hi@cromaticstudios.com?subject=${encodeURIComponent("Boarding pass " + t.ref + " · " + t.name)}&body=${encodeURIComponent(body)}`;
    }
    const legs = [["DRM", "The Dream"], ...t.stops, ["OLR", "Olari 9"]];
    const pass = d.createElement("div");
    pass.className = "pass"; pass.setAttribute("role", "status"); pass.tabIndex = -1;
    pass.innerHTML = `<div class="pass-main">
      <div class="pass-head mono"><span>✳ Cromatic Air</span><b>Boarding pass</b><span>Booking ${esc(t.ref)}</span></div>
      <p class="pass-hello">Welcome aboard, <b>${esc(t.first)}</b>. ${sent ? "Your pass is in your inbox, and we'll answer within one working day." : "Your email app should open with the details; send it and we'll answer within one working day."}</p>
      <div class="pass-route">${legs.map(([c, n], i) => `<span class="${i === 0 || i === legs.length - 1 ? "end" : ""}"><b>${esc(c)}</b><i>${esc(n)}</i></span>`).join('<span class="hop">· · ✈ · ·</span>')}</div>
      <div class="pass-grid">
        <span><small>PASSENGER</small>${esc(t.name)}</span><span><small>FLIGHT</small>${esc(t.flight)}</span>
        <span><small>CLASS</small>${esc(t.klass)}</span><span><small>BOARDING</small>${esc(t.boarding)}</span>
      </div></div>
      <div class="pass-stub"><span class="mono">To · Str. Olari 9</span><span><small class="mono">Gate</small> <span class="big">9</span> · <small class="mono">Seat</small> <span class="big">1A</span></span>${bars(t.ref)}<span class="mono">${esc(t.ref)}</span></div>`;
    f.replaceWith(pass);
    pass.focus();
  });
})();
