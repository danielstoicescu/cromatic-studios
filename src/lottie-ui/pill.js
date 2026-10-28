/* Cromatic Studios · the pill transitions (r233; r235, Daniel: "the pill transition between the map and the projects is a
   bit weird"). A case page over the map is one quick shape, the pill:
     open(frame, fallback)  the place card's "Go deeper" button (or whatever was tapped, or a pill in the middle) gets the
                            Multiverse's ring on the frame of the tap; the page loads under it, drawn whole at 1 % (at 0
                            it would not be painted at all). Once it is parsed, has its fonts and has painted (at most
                            2.5 s), the button's pill stretches sideways past the screen's sides, then opens up and down
                            past the top and the bottom (480 ms), the page fading in over the first third. The city
                            keeps drawing until the page covers it (then it rests, as under any page)
     close(frame, done)     the reverse: the city draws again under the page (a frame), the page closes into a band and
                            the band into the button, fading as it lands (300 ms); done() then hides it
     leave()                the map to the website: the paper closes in round a pill (CSS, at once, nothing to load: the
                            click goes ahead and the next page loads meanwhile); the page that comes opens out of the same
                            pill (src/lottie-ui/pt-site.js, inlined in every page of the website)
   The pill is cut by the frame's four nested boxes (src/app.js), each a little bigger than the screen and rounding one
   corner, moved by transforms; the page inside (the iframe and its buttons) is moved back by their sum (exactly:
   translations add up), and the ring
   is two bars and two half rings, moved the same way. All of it is the compositor's (a main thread busy parsing the page
   does not stop it); clip-path, tried first, repainted on every frame. One radius (half the button's height) all the
   way: sideways, then up and down, it is a true pill throughout. No worker, no file to fetch.
   Reduced motion: none of it (the page opens and closes as before; fallback() is the r137 grow, which does nothing then). */
(function () {
  if (window.czPill || window.__czL === false) return;
  var rm = function () { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return true; } };
  var gen = 0, cur = null, closing = null;
  var bez = function (x1, y1, x2, y2) {
    return function (x) {
      var t = x;
      for (var i = 0; i < 8; i++) {
        var u = 1 - t, cx = 3 * x1 * t * u * u + 3 * x2 * t * t * u + t * t * t - x, d = 3 * x1 * u * u + 6 * (x2 - x1) * t * u + 3 * (1 - x2) * t * t;
        if (Math.abs(cx) < 1e-5) break;
        if (d) t = Math.min(1, Math.max(0, t - cx / d));
      }
      var v = 1 - t;
      return 3 * y1 * t * v * v + 3 * y2 * t * t * v + t * t * t;
    };
  };
  var EOPEN = bez(0.6, 0, 0.2, 1), ECLOSE = bez(0.5, 0, 0.3, 1);
  var n1 = function (x) { return Math.round(x * 10) / 10; };
  var T = function (x, y) { return "translate(" + n1(x) + "px," + n1(y) + "px)"; };
  // where the pill starts (and ends on the way back): the button that was pressed, if it is still on screen
  var lastTap = null;
  document.addEventListener("pointerdown", function (e) {
    var t = e.target && e.target.closest && e.target.closest("button, a, [role=button], .n2-pc");
    lastTap = t ? { el: t, t: performance.now() } : null;
  }, true);
  var onScreen = function (el, W, H) {
    if (!el || !el.isConnected) return null;
    var r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 8 || r.right < 0 || r.bottom < 0 || r.left > W || r.top > H) return null;
    return { x: r.left, y: r.top, w: r.width, h: r.height };
  };
  var cardBtn = function () { return document.querySelector(".map-card:not(.hidden) .mcd-open:not(.mcd-jet):not(.mcd-fight)"); };
  var middle = function (W, H) { var w = Math.min(W * 0.5, 260), h = 64; return { x: (W - w) / 2, y: (H - h) / 2, w: w, h: h }; };
  // a pill: never narrower than it is tall (a tall thing tapped starts as a circle on its middle), at most 120 px tall
  var asPill = function (r) {
    var h = Math.min(r.h, 120), y = r.y + (r.h - h) / 2, w = Math.max(r.w, h), x = r.x + (r.w - w) / 2;
    return { x: x, y: y, w: w, h: h };
  };
  var source = function (frame, W, H) {
    var from = frame._from, r = null;
    if (from && performance.now() - from.t < 1500) r = onScreen(cardBtn(), W, H);
    if (!r && lastTap && performance.now() - lastTap.t < 900) r = onScreen(lastTap.el, W, H);
    return asPill(r || middle(W, H));
  };
  var ringW = function () { return innerWidth < 720 ? 3 : 4; };
  /* The shape over time, as four edges (l, r, t, b) and a fixed radius R = the pill's half height. Two moves, so that it
     is a true pill all the way with that one radius: the pill stretches sideways until its round ends are past the
     screen's sides, then the band opens up and down past the top and the bottom. u in [0, 1] along the whole way */
  var path = function (p, W, H, k) {
    var R = p.h / 2, L1 = -(R + k + 6), R1 = W + R + k + 6, T2 = -48, B2 = H + 48;
    var d1 = Math.max(p.x - L1, R1 - (p.x + p.w)), d2 = Math.max(p.y - T2, B2 - (p.y + p.h)), cut = d1 / Math.max(1, d1 + d2);
    return {
      R: R, SW: W + 2 * (R + k + 60), SH: H + 2 * 60,
      at: function (u) {
        if (u <= cut) { var e = cut ? u / cut : 1; return { l: p.x + (L1 - p.x) * e, r: p.x + p.w + (R1 - p.x - p.w) * e, t: p.y, b: p.y + p.h }; }
        var f = (u - cut) / Math.max(1e-6, 1 - cut);
        return { l: L1, r: R1, t: p.y + (T2 - p.y) * f, b: p.y + p.h + (B2 - p.y - p.h) * f };
      }
    };
  };
  // the frame's boxes and the ring's parts, for edges e
  var place = function (P, e, k) {
    var SW = P.SW, SH = P.SH, R = P.R;
    return {
      w: [T(e.l, e.t), T(e.r - SW - e.l, 0), T(e.l - (e.r - SW), e.b - SH - e.t), T(e.r - SW - e.l, 0)],
      c: T(-(e.r - SW), -(e.b - SH)),
      top: T(e.l + R, e.t - k) + " scaleX(" + Math.max(0.001, (e.r - e.l - 2 * R) / 100).toFixed(4) + ")",
      bot: T(e.l + R, e.b) + " scaleX(" + Math.max(0.001, (e.r - e.l - 2 * R) / 100).toFixed(4) + ")",
      cl: T(e.l - k, e.t - k), cr: T(e.r - R, e.t - k)
    };
  };
  var mkRing = function (R, k) {
    var g = document.createElement("div");
    g.className = "czpf"; g.setAttribute("aria-hidden", "true");
    g.style.setProperty("--czr", R + "px"); g.style.setProperty("--czk", k + "px");
    g.innerHTML = '<i class="czpf-bar"></i><i class="czpf-bar"></i><i class="czpf-cap czpf-l"><b></b></i><i class="czpf-cap czpf-r"><b></b></i>';
    return g;
  };
  // the parts a run moves: the four boxes; the page's own parts, moved back (the iframe and its two buttons, each on its
  // own: WebKit drew on at a fraction of its pace for as long as the page stayed open once the box holding the iframe
  // had been animated, not when the iframe itself is); the ring's two bars and two caps
  var parts = function (frame, ring) {
    var g = function (q) { return [].slice.call(frame.querySelectorAll(q)); };
    return { w: g(".cf-w"), m: g(".cf-in > iframe, .cf-in > .cf-share, .cf-in > .cf-close"), r: [].slice.call(ring.children) };
  };
  // the ring's parts where they are while the page loads (they are the only parts given a transform of their own: the
  // buttons have a transition on theirs, which would take over from the animation)
  var ringAt = function (c, q) { var v = [q.top, q.bot, q.cl, q.cr]; for (var i = 0; i < c.els.r.length; i++) c.els.r[i].style.transform = v[i]; };
  // one animation per part, its keyframes sampled along the way (straight lines between them: transforms add up, so
  // the page's move back cancels the boxes' exactly at every frame)
  var run = function (c, P, from, to, E, D, fade, k) {
    var n = 24, kw = [[], [], [], []], km = [], kr = [[], [], [], []], fk = [];
    for (var i = 0; i <= n; i++) {
      var q = place(P, P.at(from + (to - from) * E(i / n)), k);
      for (var j = 0; j < 4; j++) kw[j].push({ transform: q.w[j] });
      km.push({ transform: q.c });
      [q.top, q.bot, q.cl, q.cr].forEach(function (t, j) { kr[j].push({ transform: t }); });
      fk.push({ opacity: fade(i / n) });
    }
    var o = { duration: D, easing: "linear", fill: "forwards" }, as = [];
    c.els.w.forEach(function (el, j) { as.push(el.animate(kw[j], o)); });
    c.els.m.forEach(function (el) { as.push(el.animate(km, o)); });
    c.els.r.forEach(function (el, j) { as.push(el.animate(kr[j], o)); });
    as.push(c.frame.animate(fk, o));
    return as;
  };
  // everything a run left on the page goes with it (another open or close, or the page hidden some other way)
  var clean = function () {
    if (!cur) return;
    var c = cur; cur = null;
    c.anims.forEach(function (a) { try { a.cancel(); } catch (e) {} });
    if (c.ring) c.ring.remove();
    if (c.els) c.els.r.forEach(function (el) { el.style.removeProperty("transform"); });
    c.frame.classList.remove("czpf-run");
    ["--czsw", "--czsh", "--czr", "--czvw", "--czvh", "pointer-events"].forEach(function (k) { c.frame.style.removeProperty(k); });
    document.body.classList.remove("czpf-open", "czpf-close");
  };
  var setup = function (c, P, W, H, k) {
    var f = c.frame;
    f.style.setProperty("--czsw", P.SW + "px"); f.style.setProperty("--czsh", P.SH + "px"); f.style.setProperty("--czr", P.R + "px");
    f.style.setProperty("--czvw", W + "px"); f.style.setProperty("--czvh", H + "px");
    c.ring = mkRing(P.R, k);
    f.parentNode.insertBefore(c.ring, f);
    c.els = parts(f, c.ring);
  };
  // the page is there: its own document parsed (not the empty one a new frame starts with), the fonts its first screen
  // asked for in (its words wait for them) and painted (its first words or picture: drawn whole at 1 % meanwhile, so
  // the pill grows over a page already drawn)
  var doc = function (frame) {
    var f = frame.querySelector("iframe");
    try { var d = f && f.contentDocument; if (!d) return true; return !/^about:blank/.test(d.URL) && d.readyState !== "loading" && d.body ? d : null; } catch (e) { return true; }
  };
  var fontsIn = function (d) { try { return d === true || !d.fonts || d.fonts.status === "loaded"; } catch (e) { return true; } };
  var painted = function (d) { try { if (d === true) return true; var P = d.defaultView.performance; return !P.getEntriesByName || P.getEntriesByName("first-contentful-paint").length > 0; } catch (e) { return true; } };
  // two frames (the page or the map drawn once more), or 150 ms if frames do not come (a starved page: never stall on it)
  var raf2 = function (fn) { var done = false, go = function () { if (!done) { done = true; fn(); } }; requestAnimationFrame(function () { requestAnimationFrame(go); }); setTimeout(go, 150); };
  // one frame (the city drawn once more under the page), or 100 ms
  var raf1 = function (fn) { var done = false, go = function () { if (!done) { done = true; fn(); } }; requestAnimationFrame(go); setTimeout(go, 100); };
  var open = function (frame, fallback) {
    if (rm() || frame.classList.contains("cf-game") || !frame.animate || !frame.querySelector(".cf-in")) return false;
    clean(); closing = null;
    var my = ++gen, W = innerWidth, H = innerHeight, k = ringW(), src = source(frame, W, H), P = path(src, W, H, k);
    var c = cur = { frame: frame, anims: [], open: true };
    setup(c, P, W, H, k);
    // the tap's answer, on its frame: the ring round the button. The page loads meanwhile, whole and all but invisible
    // (1 %: at 0 it would not be drawn at all, and its first drawing would land in the middle of the growing pill)
    ringAt(c, place(P, P.at(0), k));
    frame.style.pointerEvents = "none"; // (the city keeps drawing until the page covers it: the frame animates meanwhile)
    c.anims.push(frame.animate([{ opacity: 0.01 }, { opacity: 0.01 }], { duration: 1, fill: "forwards" }));
    c.anims.push(c.ring.animate([{ opacity: 0 }, { opacity: 1 }], { duration: 140, easing: "ease-out", fill: "forwards" }));
    document.body.classList.add("czpf-open");
    var t0 = performance.now(), seen = 0;
    var wait = function () {
      if (my !== gen) return;
      if (frame.classList.contains("hidden")) { clean(); return; }
      var d = doc(frame);
      if (d) seen++;
      if (!(d && seen > 2 && fontsIn(d) && painted(d)) && performance.now() - t0 < 2500) {
        // still loading: the ring breathes (once it has been there a moment)
        if (performance.now() - t0 > 350 && !c.breath) { c.breath = c.ring.animate([{ opacity: 1 }, { opacity: 0.45 }, { opacity: 1 }], { duration: 900, iterations: Infinity, easing: "ease-in-out" }); c.anims.push(c.breath); }
        setTimeout(wait, 40); return; // (timers, not frames: frames may not come while the page is being parsed)
      }
      raf2(go);
    };
    var go = function () {
      if (my !== gen) return;
      if (frame.classList.contains("hidden")) { clean(); return; }
      c.anims.forEach(function (a) { try { a.cancel(); } catch (e) {} });
      // from here the boxes cut the pill (they were the screen while the page drew itself); the class and the animations
      // in the same task, so no frame is drawn with one and not the other
      frame.classList.add("czpf-run");
      var D = 480;
      c.anims = run(c, P, 0, 1, EOPEN, D, function (u) { return Math.min(1, u / 0.3); }, k);
      c.anims.push(c.ring.animate([{ opacity: 1 }, { opacity: 1, offset: 0.6 }, { opacity: 0 }], { duration: D, fill: "forwards" }));
      c.anims[0].onfinish = function () { if (my === gen && cur === c) clean(); };
    };
    setTimeout(wait, 40);
    return true;
  };
  var close = function (frame, done) {
    if (rm() || frame.classList.contains("cf-game") || frame.classList.contains("hidden") || !frame.animate || !frame.querySelector(".cf-in")) return false;
    if (closing === frame) return true; // (Escape reaches it twice: the map's panels and the frame's own key)
    if (cur && cur.open) { clean(); gen++; done(); return true; } // (closed before it had finished opening: gone at once)
    clean(); closing = frame;
    var my = ++gen, W = innerWidth, H = innerHeight, k = ringW();
    var fin = false, finish = function () { if (fin) return; fin = true; closing = null; frame._czClosing = false; try { done(); } catch (e) {} };
    frame._czClosing = true; // (its address is no longer the page's: src/app.js, the overlays' history)
    var c = cur = { frame: frame, anims: [] };
    // the city draws again under the page (an animation on the frame: not "covered" any more), then the pill closes
    c.anims.push(frame.animate([{ opacity: 1 }, { opacity: 1 }], { duration: 1, fill: "forwards" }));
    document.body.classList.add("czpf-close");
    raf1(function () {
      if (my !== gen) return;
      var dst = asPill(onScreen(cardBtn(), W, H) || middle(W, H)), P = path(dst, W, H, k);
      setup(c, P, W, H, k);
      ringAt(c, place(P, P.at(1), k));
      frame.classList.add("czpf-run");
      c.anims.forEach(function (a) { try { a.cancel(); } catch (e) {} });
      var D = 300; // (a way out is quicker than a way in)
      c.anims = run(c, P, 1, 0, ECLOSE, D, function (u) { return u < 0.7 ? 1 : Math.max(0, 1 - (u - 0.7) / 0.3); }, k);
      c.anims.push(c.ring.animate([{ opacity: 0 }, { opacity: 1, offset: 0.25 }, { opacity: 1 }], { duration: D, fill: "forwards" }));
      c.anims[0].onfinish = function () {
        if (my !== gen) return;
        finish();
        var f = c.ring.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 120, easing: "ease-out", fill: "forwards" });
        c.anims.push(f);
        f.onfinish = function () { if (cur === c) clean(); };
      };
    });
    setTimeout(function () { if (fin || my !== gen) return; finish(); if (cur === c) clean(); }, 2000); // (never leave the page up because a frame never came)
    return true;
  };

  /* ---- the map to the website: the paper closes in to a pill, the next page opens out of it ---- */
  var leave = function () {
    if (rm()) return false;
    try { sessionStorage.setItem("cz-pt", String(Date.now())); } catch (e) {}
    var o = document.createElement("div");
    o.className = "czpt czpt-leave"; o.setAttribute("aria-hidden", "true");
    o.innerHTML = '<i class="czpt-hole"></i><i class="czpt-body"></i><i class="czpt-ring"></i>';
    document.body.appendChild(o);
    // (back from the next page with the browser's Back: the page comes from the cache as it was left)
    addEventListener("pageshow", function (e) { if (e.persisted) o.remove(); }, { once: true });
    setTimeout(function () { o.remove(); }, 6000);
    return true;
  };
  // the map's ways to the website: "Normal website", the website button; the click goes ahead, the paper comes with it
  document.addEventListener("click", function (e) {
    if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target && e.target.closest && e.target.closest("a[href]");
    if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
    var u; try { u = new URL(a.href, location.href); } catch (er) { return; }
    if (u.origin !== location.origin || !/^\/(ro\/)?$/.test(u.pathname)) return;
    leave();
  }, true);
  window.czPill = { open: open, close: close, leave: leave };
})();
