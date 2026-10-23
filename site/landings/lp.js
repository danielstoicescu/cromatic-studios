// TASK-122 v2: the ads landings' behaviour (inlined by the build, minified). The page carries its name and the
// freebie's address on <main data-lp data-free>. GA4 through the site's own window.czEvent (only after a yes on the
// cookie card). Nothing here moves with reduced motion.
(function () {
  var d = document, de = d.documentElement, main = d.querySelector("main[data-lp]");
  if (!main) return;
  window.__lpOk = 1;
  var q = new URLSearchParams(location.search), v = q.get("v") === "b" ? "b" : "a", lp = main.getAttribute("data-lp"), lang = de.lang === "ro" ? "ro" : "en";
  var reduced = matchMedia("(prefers-reduced-motion: reduce)").matches, fine = matchMedia("(hover: hover) and (pointer: fine)").matches;
  var ev = function (n, p) { try { if (window.czEvent) window.czEvent(n, Object.assign({ lp: lp, lp_variant: v, lp_lang: lang }, p || {})); } catch (e) {} };

  // the utm_* parameters of the ad: on to The Core Lite, and into the boarding pass
  var u = {};
  q.forEach(function (val, k) { if (/^utm_[a-z]+$/.test(k)) u[k] = val.slice(0, 120); });
  var free = main.getAttribute("data-free");
  var fh = free + (free.indexOf("?") < 0 ? "?" : "&") + "src=" + encodeURIComponent(lp);
  for (var k in u) fh += "&" + k + "=" + encodeURIComponent(u[k]);
  d.querySelectorAll("[data-lp-free]").forEach(function (a) { a.href = fh; });
  d.querySelectorAll("input[data-lead]").forEach(function (i) { if (i.name === "lp_v") i.value = v; else if (u[i.name]) i.value = u[i.name]; });

  // GA4: every CTA (lp_cta_click), the freebie opened (lp_freebie_start), the drive (lp_drive_click), the form
  d.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("[data-lp-cta],[data-lp-free],[data-lp-drive]");
    if (!a) return;
    if (a.hasAttribute("data-lp-drive")) return ev("lp_drive_click", { position: a.getAttribute("data-lp-drive") });
    var free = a.hasAttribute("data-lp-free"), pos = a.getAttribute(free ? "data-lp-free" : "data-lp-cta");
    ev("lp_cta_click", { position: pos, target: free ? "core_lite" : "freebie_block" });
    if (free) ev("lp_freebie_start", { position: pos });
  }, true);
  var f = d.getElementById("bform");
  if (f) f.addEventListener("submit", function () { var n = (f.elements.name || {}).value, m = (f.elements.email || {}).value; if (n && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test((m || "").trim())) ev("lp_form_submit", { form: "boarding_pass" }); });
  var talk = d.querySelector(".lp-talk details");
  if (talk) talk.addEventListener("toggle", function () { if (talk.open) { ev("lp_talk_open"); var i = talk.querySelector("input[name=name]"); if (i && fine) i.focus({ preventScroll: true }); } });

  if (!("IntersectionObserver" in window)) { d.querySelectorAll("[data-rv]").forEach(function (x) { x.classList.add("in"); }); return; }

  // reveal, and the figures that count up
  var count = function (b) {
    var to = parseInt(b.getAttribute("data-count"), 10), from = parseInt(b.getAttribute("data-from") || "0", 10);
    if (reduced || isNaN(to)) { b.textContent = b.getAttribute("data-count"); return; }
    var t0 = 0, dur = 1400, step = function (t) { if (!t0) t0 = t; var p = Math.min(1, (t - t0) / dur), e2 = 1 - Math.pow(1 - p, 3); b.textContent = Math.round(from + (to - from) * e2); if (p < 1) requestAnimationFrame(step); };
    requestAnimationFrame(step);
  };
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      e.target.classList.add("in"); io.unobserve(e.target);
      e.target.querySelectorAll("[data-count]").forEach(count);
    });
  }, { rootMargin: "0px 0px -10% 0px" });
  d.querySelectorAll("[data-rv]").forEach(function (x) { io.observe(x); });
  d.querySelectorAll("[data-count]").forEach(function (b) { if (!reduced) b.textContent = b.getAttribute("data-from") || "0"; });

  // the sticky freebie: on once the hero has gone, off while the finale or the talk is on screen
  var sticky = d.querySelector(".lp-sticky"), hero = d.querySelector(".lp-hero"), seen = { hero: true, final: false, talk: false };
  if (sticky && hero) {
    var io2 = new IntersectionObserver(function (es) {
      es.forEach(function (e) { seen[e.target.getAttribute("data-zone")] = e.isIntersecting; });
      var on = !seen.hero && !seen.final && !seen.talk;
      sticky.classList.toggle("on", on); sticky.setAttribute("aria-hidden", on ? "false" : "true");
      sticky.querySelectorAll("a").forEach(function (a) { a.tabIndex = on ? 0 : -1; });
    });
    [hero, d.getElementById("freebie"), d.querySelector(".lp-talk")].forEach(function (x, i) { if (x) { x.setAttribute("data-zone", ["hero", "final", "talk"][i]); io2.observe(x); } });
  }

  // the road under the header: how far the freebie is
  var hdr = d.querySelector(".lp-hdr"), goal = d.getElementById("freebie"), raf = 0;
  var road = function () { raf = 0; if (!hdr || !goal) return; var end = goal.offsetTop - innerHeight * .4, p = Math.max(0, Math.min(1, scrollY / Math.max(1, end))); hdr.style.setProperty("--p", p.toFixed(4)); };
  addEventListener("scroll", function () { if (!raf) raf = requestAnimationFrame(road); }, { passive: true });
  addEventListener("resize", road); road();

  if (reduced || !fine) return;
  // the boarding pass in the hero tips toward the pointer; the big CTA leans toward it a little
  d.querySelectorAll(".lp-ticket").forEach(function (t) {
    t.addEventListener("pointermove", function (e) { var r = t.getBoundingClientRect(); t.style.setProperty("--tx", ((e.clientX - r.left) / r.width - .5).toFixed(3)); t.style.setProperty("--ty", ((e.clientY - r.top) / r.height - .5).toFixed(3)); });
    t.addEventListener("pointerleave", function () { t.style.removeProperty("--tx"); t.style.removeProperty("--ty"); });
  });
  var big = d.querySelector(".lpf-cta .btn"), box = d.querySelector(".lpf-cta");
  if (big && box) {
    box.addEventListener("pointermove", function (e) { var r = big.getBoundingClientRect(); big.style.setProperty("--gx", ((e.clientX - r.left - r.width / 2) * .12).toFixed(1) + "px"); big.style.setProperty("--gy", ((e.clientY - r.top - r.height / 2) * .2).toFixed(1) + "px"); });
    box.addEventListener("pointerleave", function () { big.style.removeProperty("--gx"); big.style.removeProperty("--gy"); });
  }
})();
