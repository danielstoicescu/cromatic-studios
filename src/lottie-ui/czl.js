/* Cromatic Studios · the site's Lottie layer (r231, Daniel: "Lottie across the site"). One player for every piece: the
   intro's own lottie-web 5.12.2 worker build (src/intro/vendor), so every animation draws in the same Web Worker on an
   OffscreenCanvas and the city's work on the main thread cannot make it stutter. On the map the intro has usually loaded
   it already; anywhere else it is fetched once, the first time a piece is needed. The pieces' JSON (made by
   design/lottie-ui/_source) are listed by the build in window.__CZL_CFG = { player, j: { name: url } }.
     czL.mount(name, { host, w, h, full, fit, cls, assets })  -> Promise<piece | null>  (null: no player, no data)
       piece.seg("marker" | [a, b], loop) -> Promise (resolved when the segment ends), piece.last() (its last frame,
       still), piece.destroy(); piece.el is the canvas's wrapper (pointer-events: none)
     czL.rm()     reduced motion is asked for
     czL.ro()     the visitor reads the site in Romanian (the page's language, or on the map the language it remembers)
     czL.warm(names) fetches the player and the data ahead of time */
(function () {
  if (window.czL || window.__czL === false) return; // (__czL = false: the whole layer off, for an A/B)
  var C = window.__CZL_CFG || {};
  var libP = null, dataP = {};
  var rm = function () { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return false; } };
  var ro = function () {
    var l = (document.documentElement.lang || "").slice(0, 2);
    if (l === "ro") return true;
    if (location.pathname !== "/") return false;
    try { return localStorage.getItem("cz-lang") === "ro"; } catch (e) { return false; }
  };
  var player = function () {
    if (window.lottie && window.lottie.loadAnimation) return Promise.resolve(window.lottie);
    if (libP) return libP;
    var url = C.player || (window.__CZI_CFG && window.__CZI_CFG.player);
    if (!url || typeof Worker === "undefined" || typeof fetch === "undefined") return Promise.resolve(null);
    libP = new Promise(function (res) {
      // the intro's loader may be fetching the very same file: wait for that one rather than starting a second worker
      var s = document.querySelector('script[src="' + url + '"]');
      var done = function () { res(window.lottie && window.lottie.loadAnimation ? window.lottie : null); };
      if (s) { s.addEventListener("load", done); s.addEventListener("error", function () { res(null); }); setTimeout(done, 8000); return; }
      s = document.createElement("script"); s.src = url; s.async = true;
      s.onload = done; s.onerror = function () { res(null); };
      document.head.appendChild(s);
    });
    return libP;
  };
  var url = function (name) { var j = C.j || {}; return ro() && j[name + "-ro"] ? j[name + "-ro"] : j[name] || j[name + "-en"]; };
  var data = function (name) {
    var u = url(name);
    if (!u) return Promise.resolve(null);
    if (!dataP[u]) dataP[u] = fetch(u).then(function (r) { if (!r.ok) throw 0; return r.json(); }).catch(function () { dataP[u] = null; return null; });
    return dataP[u];
  };
  // at most 2x, and at most ~3.5 M pixels for a full-screen piece (the intro's rule)
  var dpr = function (w, h) { return Math.max(1, Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(3.5e6 / Math.max(1, w * h)))); };
  var mount = function (name, o) {
    o = o || {};
    return Promise.all([player(), data(name)]).then(function (r) {
      var lib = r[0], d = r[1];
      if (!lib || !d) return null;
      // pictures the piece shows (the worlds' previews): fetched by the worker, so an absolute address (its base is a blob)
      if (o.assets) for (var i = 0; i < (d.assets || []).length; i++) { var a = d.assets[i]; if (a.p && !a.layers && o.assets[a.id]) { a.p = location.origin + o.assets[a.id]; a.u = ""; a.e = 1; } }
      var el = document.createElement("div");
      el.className = "czl" + (o.full ? " czl-full" : "") + (o.cls ? " " + o.cls : "");
      el.setAttribute("aria-hidden", "true");
      var w = o.full ? innerWidth : o.w || d.w, h = o.full ? innerHeight : o.h || (w * d.h) / d.w;
      if (!o.full) { el.style.width = w + "px"; el.style.height = h + "px"; }
      var cv = document.createElement("canvas"), k = dpr(w, h);
      cv.width = Math.round(w * k); cv.height = Math.round(h * k);
      el.appendChild(cv);
      (o.host || document.body).appendChild(el);
      var M = {}; (d.markers || []).forEach(function (m) { M[m.cm] = [m.tm, m.tm + m.dr]; });
      // the worker gets its own copy of the data (it is posted): one fetch serves every mount
      var anim = lib.loadAnimation({ container: el, renderer: "canvas", loop: false, autoplay: false, animationData: d, rendererSettings: { canvas: cv, preserveAspectRatio: o.fit || (o.full ? "xMidYMid slice" : "xMidYMid meet"), clearCanvas: true, dpr: 1 } });
      var waiting = null, gone = false;
      anim.addEventListener("complete", function () { var w2 = waiting; waiting = null; if (w2) w2(); });
      var onResize = o.full ? function () { var k2 = dpr(innerWidth, innerHeight); try { anim.resize(Math.round(innerWidth * k2), Math.round(innerHeight * k2)); } catch (e) {} } : null;
      if (onResize) addEventListener("resize", onResize);
      var piece = {
        el: el, anim: anim, data: d, markers: M, w: w, h: h,
        seg: function (s, loop) {
          var ab = typeof s === "string" ? M[s] : s;
          if (!ab || gone) return Promise.resolve();
          return new Promise(function (res) {
            if (waiting) { var p = waiting; waiting = null; p(); }
            if (!loop) waiting = res; else res();
            try { anim.setLoop(!!loop); anim.playSegments([ab[0], ab[1]], true); } catch (e) { waiting = null; res(); }
            // the worker says so when a segment ends; never wait on it for ever
            if (!loop) setTimeout(function () { if (waiting === res) { waiting = null; res(); } }, ((ab[1] - ab[0]) / (d.fr || 60)) * 1000 + 1500);
          });
        },
        at: function (f) { try { anim.goToAndStop(f, true); } catch (e) {} },
        last: function () { try { anim.goToAndStop(d.op - 1, true); } catch (e) {} },
        destroy: function () { if (gone) return; gone = true; if (onResize) removeEventListener("resize", onResize); var w2 = waiting; waiting = null; if (w2) w2(); try { anim.destroy(); } catch (e) {} el.remove(); }
      };
      return new Promise(function (res) {
        var ok = false, go = function () { if (ok) return; ok = true; res(piece); };
        anim.addEventListener("DOMLoaded", go);
        // the event comes from the worker: without it in 2.5 s the piece is given up (and the page goes on without it)
        setTimeout(function () { if (!ok) { ok = true; piece.destroy(); res(null); } }, 2500);
      });
    }).catch(function () { return null; });
  };
  window.czL = {
    cfg: C, rm: rm, ro: ro, player: player, data: data, mount: mount,
    warm: function (names) { if (rm() && !(names || []).length) return; player(); (names || []).forEach(function (n) { data(n); }); }
  };
})();
