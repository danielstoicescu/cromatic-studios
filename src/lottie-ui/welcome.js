/* Cromatic Studios · the map's welcome card in Lottie (TASK-007, Daniel: "the old onboarding, not Lottie"). The card stays
   HTML (its words read and translate, its buttons take a tap and a key); this adds, with the site's shared player (czl.js):
     the opening   the intro ends on its pill opening onto the map; a second later the same pill (its rainbow ring, its
                   size on this screen) pops in where the card will be and stretches into it (welcome-open, fitted here
                   to the card as it is laid out), its ring turning into the card's ink line; the card's words land as
                   it opens (the page's CSS: .mw-play, .mw-morph)
     the steps     each grey circle gets its explainer (welcome-{drive,tap,work,hi}-{light,sketch}, Sketchbook's in its
                   ink): their pieces arrive with the card, then each plays once, in turn (drive, tap, the work, hi: the
                   card's own story, one after the other), and rests. On a computer a step plays on a loop while the
                   pointer is on it or on the button it stands for (or that button has the keyboard's focus): "Drive it
                   yourself" the drive, "Or help me set my first direction" the tap, the three streets the work, Olari 9
                   the hi. A tap on a step plays it again.
   czWelcome.warm()        the pieces' data, ahead of time (the app asks while the intro plays, when the card will show)
   czWelcome.open(el)  ->  true when it runs the card's entrance (otherwise the page adds .mw-play itself)
   czWelcome.close(el)     the pieces go (the app calls it once the card has folded away)
   Reduced motion: no opening, each step one still drawing (the frame that tells it best). No player, or a piece late:
   the card's own CSS entrance and its line icons. Nothing draws while the card is hidden, nor once its pieces have
   played (a piece at rest costs the worker nothing). */
(function () {
  if (window.czWelcome || !window.czL) return;
  var L = window.czL, KINDS = ["drive", "tap", "work", "hi"];
  var sketch = function () { return document.body.classList.contains("scheme-sketch"); };
  var nameOf = function (k, sk) { return "welcome-" + k + "-" + (sk ? "sketch" : "light"); };
  var fine = function () { try { return matchMedia("(hover: hover) and (pointer: fine)").matches; } catch (e) { return false; } };
  var has = function (n) { return !!(L.cfg && L.cfg.j && L.cfg.j[n]); };
  var S = null; // the card while it is open: { el, p: pieces, st: states, t: timers, gone, ... }

  /* ---- the opening: the intro's pill, measured as the intro drew it on this screen ---- */
  var pillSize = function (w, h) {
    var C = window.__CZI_CFG, ab = innerWidth >= innerHeight ? "desktop" : "phone", P = C && C.pill && C.pill[ab], Z = C && C.size && C.size[ab], pw, ph;
    if (P && Z) { var k = Math.max(innerWidth / Z[0], innerHeight / Z[1]); pw = P[0] * P[2] * k; ph = P[1] * P[2] * k; }
    else { pw = 300; ph = 112; }
    var f = Math.min(1, (w * 0.8) / pw, (h * 0.45) / ph); // (never wider than the card it becomes)
    return [pw * f, ph * f];
  };
  // every rectangle of the opening (written for a reference card and pill, json.cromatic.fit) onto this card and pill:
  // its size (the pill's end and the card's end map onto ours), its corner, its centre
  var fit = function (d0, w, h, pill) {
    var d = JSON.parse(JSON.stringify(d0)), F = d.cromatic.fit, pw = pill[0], ph = pill[1];
    var mx = function (v) { return pw + ((v - F.PW) * (w - pw)) / (F.W - F.PW); };
    var my = function (v) { return ph + ((v - F.PH) * (h - ph)) / (F.H - F.PH); };
    var mr = function (v) { return F.R + ((v - F.R) * (ph - F.R)) / (F.PH - F.R); };
    var dx = (w - F.W) / 2, dy = (h - F.H) / 2;
    var each = function (pr, fn) { if (!pr) return; if (pr.a) pr.k.forEach(function (key) { if (key.s) key.s = fn(key.s); }); else pr.k = fn(pr.k); };
    var walk = function (items) {
      items.forEach(function (it) {
        if (it.ty === "gr") walk(it.it);
        else if (it.ty === "rc") {
          each(it.s, function (v) { return [mx(v[0]), my(v[1])]; });
          each(it.r, function (v) { return Array.isArray(v) ? [mr(v[0])] : mr(v); });
          each(it.p, function (v) { return [v[0] + dx, v[1] + dy]; });
        }
      });
    };
    d.layers.forEach(function (l) { if (l.shapes) walk(l.shapes); });
    d.w = Math.round(w + 2 * F.PAD); d.h = Math.round(h + 2 * F.PAD);
    return d;
  };

  /* ---- the steps ---- */
  // the CSS's times (czl.css / styles.css): the card's words start at --mw0, the steps pop in from +.08 s, .07 s apart
  var later = function (s, fn, ms) { s.t.push(setTimeout(function () { if (!s.gone) fn(); }, ms)); };
  var measureSteps = function (s) {
    s.tiles = [].slice.call(s.el.querySelectorAll(".mw-how > span > i"));
    s.sizes = s.tiles.map(function (t) { return t.offsetWidth; }); // (read with the card's: one layout)
  };
  var mountSteps = function (s) {
    var tiles = s.tiles, sizes = s.sizes;
    tiles.forEach(function (tile, i) {
      if (i > 3 || !sizes[i] || !has(nameOf(KINDS[i], s.sk))) return;
      var px = Math.round(sizes[i] * 1.25); // (the piece is 80 for the circle's 64: room to pop out of it)
      L.mount(nameOf(KINDS[i], s.sk), { host: tile, w: px, h: px, cls: "czw-ic" }).then(function (p) {
        if (!p) return;
        if (s.gone) { p.destroy(); return; }
        s.p[i] = p; tile.classList.add("czw-on");
        var cz = p.data.cromatic || {};
        if (s.rm) { p.at(cz.still || 0); return; }
        p.anim.addEventListener("complete", function () { if (s.st[i] === "ending") { s.st[i] = "idle"; want(s, i); } });
        if (s.st[i] === "rest") { s.st[i] = "idle"; p.at(cz.act ? cz.act[0] : 0); return; } // (drawn again after a resize: at rest)
        // a piece that comes after its moment starts at once (its tile is already there)
        if (s.started) intro(s, i); else p.at(0);
      });
    });
  };
  // its pieces arrive with its tile; its explainer follows in turn; then it rests
  var intro = function (s, i) {
    var p = s.p[i]; if (!p || s.st[i]) return;
    s.st[i] = "intro";
    var now = performance.now() - s.t0, inAt = s.base + 80 + i * 70, actAt = s.base + 620 + i * 560;
    // (hidden when its turn comes: it waits until the card is seen again)
    var act = function () { if (!s.vis) { s.pend.push(act); return; } p.seg("act").then(function () { if (s.st[i] === "intro") { s.st[i] = "idle"; want(s, i); } }); };
    var go = function () { if (!s.vis) { s.pend.push(go); return; } p.seg("in").then(function () { if (s.gone || s.st[i] !== "intro") return; var wait = actAt - (performance.now() - s.t0); if (wait > 30) later(s, act, wait); else act(); }); };
    if (inAt - now > 30) later(s, go, inAt - now); else go();
  };
  // hover / focus / a tap: loop it (or play it once) when it is at rest; let a loop finish its turn when it is let go
  var want = function (s, i) {
    var p = s.p[i]; if (!p || s.rm || s.gone) return;
    var on = s.hov === i || s.foc === i;
    if (on && s.st[i] === "idle") { s.st[i] = "loop"; p.seg("act", true); }
    else if (on && s.st[i] === "ending") { s.st[i] = "loop"; try { p.anim.setLoop(true); } catch (e) {} }
    else if (!on && s.st[i] === "loop") { s.st[i] = "ending"; try { p.anim.setLoop(false); } catch (e) {} }
  };
  var once = function (s, i) { var p = s.p[i]; if (!p || s.rm || s.st[i] !== "idle") return; s.st[i] = "ending"; p.seg("act"); };
  // which step a pointer or a focus is on: the step itself, or the button it stands for
  var stepOf = function (s, t) {
    var b = t && t.closest ? t.closest(".mw-how > span, button") : null;
    if (!b || !s.el.contains(b)) return -1;
    if (b.tagName !== "BUTTON") return [].indexOf.call(s.el.querySelectorAll(".mw-how > span"), b);
    if (b.classList.contains("mw-go")) return 0;
    if (b.classList.contains("mw-tap")) return 1;
    var g = b.getAttribute("data-go");
    return g === "end" ? 3 : g ? 2 : -1;
  };
  var listen = function (el) {
    if (el._czw) return; el._czw = true;
    el.addEventListener("mouseover", function (e) { var s = S; if (!s || s.el !== el || !fine()) return; var i = stepOf(s, e.target); if (i === s.hov) return; var o = s.hov; s.hov = i; if (o >= 0) want(s, o); if (i >= 0) want(s, i); });
    el.addEventListener("mouseleave", function () { var s = S; if (!s || s.el !== el) return; var o = s.hov; s.hov = -1; if (o >= 0) want(s, o); });
    el.addEventListener("focusin", function (e) { var s = S; if (!s || s.el !== el) return; var vis = true; try { vis = e.target.matches(":focus-visible"); } catch (x) {} var i = vis ? stepOf(s, e.target) : -1, o = s.foc; s.foc = i; if (o >= 0 && o !== i) want(s, o); if (i >= 0) want(s, i); });
    el.addEventListener("focusout", function () { var s = S; if (!s || s.el !== el) return; var o = s.foc; s.foc = -1; if (o >= 0) want(s, o); });
    // a phone: a tap on a step plays it again
    el.addEventListener("click", function (e) { var s = S; if (!s || s.el !== el || fine()) return; var b = e.target.closest && e.target.closest(".mw-how > span"); if (b) once(s, stepOf(s, b)); });
  };

  /* ---- hidden (the boarding pass over it, another tab): nothing draws; back: it goes on ---- */
  var pauseAll = function (s, off) {
    s.p.concat(s.open ? [s.open] : []).forEach(function (p) {
      if (!p) return;
      try { if (off) { if (!p.anim.isPaused) { p.anim.pause(); p._paused = true; } } else if (p._paused) { p._paused = false; p.anim.play(); } } catch (e) {} // (only what was playing)
    });
  };
  var onVis = function () {
    var s = S; if (!s) return;
    s.vis = !document.hidden && s.seen; pauseAll(s, !s.vis);
    if (s.vis && s.pend.length) { var q = s.pend; s.pend = []; q.forEach(function (fn, k) { later(s, fn, 250 + k * 450); }); }
  };
  document.addEventListener("visibilitychange", onVis);
  // a new size for the circles (a phone turned, a window resized across the card's breakpoints): drawn again at it, at rest
  var rt = 0;
  var redraw = function (s) {
    s.p.forEach(function (p, i) { if (p) { p.destroy(); s.p[i] = null; s.st[i] = s.st[i] && "rest"; s.tiles[i].classList.remove("czw-on"); } });
    mountSteps(s);
  };
  addEventListener("resize", function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      var s = S; if (!s || !s.tiles) return;
      var now = s.tiles.map(function (t) { return t.offsetWidth; });
      if (now.every(function (v, i) { return v === s.sizes[i]; })) return;
      s.sizes = now;
      redraw(s);
    }, 300);
  });
  // the world changed under the open card (Multiverse -> Sketchbook, or back): its steps drawn again in that world's
  // ink, at rest (TASK-059: they stayed in colour on the notebook)
  var onScheme = function () { var s = S; if (!s || !s.tiles || sketch() === s.sk) return; s.sk = sketch(); redraw(s); };

  /* ---- open, close ---- */
  var close = function () {
    var s = S; if (!s) return;
    S = null; s.gone = true;
    s.t.forEach(clearTimeout);
    try { s.io && s.io.disconnect(); } catch (e) {}
    try { s.mo && s.mo.disconnect(); } catch (e) {}
    s.p.forEach(function (p) { if (p) p.destroy(); });
    if (s.open) s.open.destroy();
    [].forEach.call(s.el.querySelectorAll(".czw-on"), function (t) { t.classList.remove("czw-on"); });
    s.el.classList.remove("mw-shell", "mw-morph");
  };
  var start = function (s, morph) {
    s.started = true; s.t0 = performance.now(); s.base = morph ? 360 : 120;
    s.el.classList.toggle("mw-morph", !!morph);
    s.el.classList.add("mw-play");
    for (var i = 0; i < 4; i++) intro(s, i);
  };
  var open = function (el) {
    close();
    var s = S = { el: el, p: [null, null, null, null], st: ["", "", "", ""], hov: -1, foc: -1, t: [], pend: [], gone: false, open: null, started: false, rm: L.rm(), sk: sketch(), vis: true, seen: true, base: 120, t0: 0 };
    listen(el);
    if ("MutationObserver" in window) { s.mo = new MutationObserver(onScheme); s.mo.observe(document.body, { attributes: true, attributeFilter: ["class"] }); }
    if ("IntersectionObserver" in window) { s.io = new IntersectionObserver(function (es) { var e = es[es.length - 1]; s.seen = e.isIntersecting; onVis(); }); s.io.observe(el); }
    var r = el.getBoundingClientRect();
    measureSteps(s);
    // the steps' pieces in a task of their own (the card's first frame does not wait for them; they show from +.4 s)
    later(s, function () { mountSteps(s); }, 0);
    if (s.rm) return false;
    // the opening: in the city's worlds (Sketchbook has its notebook card), on a card that is laid out and on screen
    if (s.sk || !has("welcome-open") || r.width < 120 || r.height < 120) { start(s, false); return true; }
    var P = 72, bl = el.clientLeft || 0, bt = el.clientTop || 0, w = Math.round(r.width), h = Math.round(r.height), pill = pillSize(w, h);
    el.style.setProperty("--czwx", -(P + bl) + "px"); el.style.setProperty("--czwy", -(P + bt) + "px");
    el.classList.add("mw-shell");
    var done = false;
    // a piece that is not on its way in time: the card comes in on its own (its CSS entrance)
    later(s, function () { if (done) return; done = true; el.classList.remove("mw-shell"); start(s, false); }, 650);
    L.mount("welcome-open", { host: el, w: w + 2 * P, h: h + 2 * P, cls: "czw-open", patch: function (d) { return fit(d, w, h, pill); }, cz: { play: [[0, 34]], loop: false } }).then(function (p) {
      if (!p) { if (!done && !s.gone) { done = true; el.classList.remove("mw-shell"); start(s, false); } return; }
      if (done || s.gone) { p.destroy(); return; }
      done = true; s.open = p;
      start(s, true);
      // the card is its own again once the pill has become it (the canvas's last frame is the card: no seam)
      var end = function () { if (s.open !== p) return; s.open = null; el.classList.remove("mw-shell"); p.destroy(); };
      p.anim.addEventListener("complete", end);
      later(s, end, p.dur([0, 34]) + 900);
    });
    return true;
  };
  window.czWelcome = {
    warm: function () { var sk = sketch(); L.warm(KINDS.map(function (k) { return nameOf(k, sk); }).concat(sk || L.rm() ? [] : ["welcome-open"])); },
    open: open,
    close: close,
    state: function () { var s = S; return s ? { st: s.st.slice(), on: s.p.map(function (p) { return !!p; }), sk: s.sk, open: !!s.open, morph: s.el.classList.contains("mw-morph") } : null; } // (tests)
  };
})();
