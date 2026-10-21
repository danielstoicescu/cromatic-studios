/* Cromatic Studios · TASK-062: the Litorsal case page's animated metro mockups (on the platform, in the carriage, on
   the train), drawn by the site's Lottie layer (czl.js: the worker player). Each .frame[data-czl] shows its still (an
   <img>, the piece's first frame) until the piece is mounted over it; nothing is fetched until the frame comes within a
   screen of the view, and a piece plays only while it is on screen (paused off screen and in a hidden tab). With
   reduced motion nothing is mounted: the still stays. The pictures' addresses (two sets: s1 for screens that draw the
   piece up to ~1100 px wide, s2 above that) are in the page's #czl-assets JSON. */
(function () {
  var Z = window.czL;
  if (!Z || typeof IntersectionObserver === "undefined") return;
  var frames = [].slice.call(document.querySelectorAll(".frame[data-czl]"));
  if (!frames.length) return;
  var A = {};
  try { A = JSON.parse(document.getElementById("czl-assets").textContent); } catch (e) { return; }
  var mq = null; try { mq = matchMedia("(prefers-reduced-motion: reduce)"); } catch (e) {}
  var rm = function () { return !!(mq && mq.matches); };
  var items = frames.map(function (f) { var it = { f: f, name: f.getAttribute("data-czl"), at: +f.getAttribute("data-czl-at") || 0, p: null, busy: false, vis: false }; f._czl = it; return it; }); // (f._czl: for the QA scripts)
  var play = function (it) { if (!it.p) return; try { if (it.vis && !document.hidden && !rm()) it.p.anim.play(); else it.p.anim.pause(); } catch (e) {} };
  var mount = function (it) {
    if (it.busy || it.p || rm()) return;
    it.busy = true;
    var w = it.f.clientWidth, h = it.f.clientHeight, set = w * Math.min(window.devicePixelRatio || 1, 2) > 1100 ? "s2" : "s1";
    var assets = (A[it.name] || {})[set];
    if (!assets || !w || !h) return;
    // (the piece is ready once its pictures are in: up to 20 s for them on a slow line, not the mount's usual 2.5 s)
    Z.mount(it.name + "-" + set, { host: it.f, w: w, h: h, assets: assets, cls: "czl-metro", wait: 20000 }).then(function (p) {
      if (!p) return;
      it.p = p;
      // the canvas fades in over the still (its pictures are in: the worker waited for them)
      requestAnimationFrame(function () { p.el.classList.add("on"); });
      try { p.anim.setLoop(true); p.anim.goToAndPlay(it.at, true); } catch (e) {}
      play(it);
    });
  };
  // near: mount (a screen ahead); on screen: play
  var near = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { var it = items[frames.indexOf(e.target)]; mount(it); near.unobserve(e.target); } }); }, { rootMargin: "100% 0px 100% 0px" });
  var seen = new IntersectionObserver(function (es) { es.forEach(function (e) { var it = items[frames.indexOf(e.target)]; it.vis = e.isIntersecting && e.intersectionRatio >= 0.15; play(it); }); }, { threshold: [0, 0.15, 0.5] });
  frames.forEach(function (f) { near.observe(f); seen.observe(f); });
  document.addEventListener("visibilitychange", function () { items.forEach(play); });
  // reduced motion turned on while reading: the pieces stop and the stills come back
  if (mq && mq.addEventListener) mq.addEventListener("change", function () { items.forEach(function (it) { if (!it.p) return; if (rm()) it.p.el.classList.remove("on"); else it.p.el.classList.add("on"); play(it); }); });
})();
