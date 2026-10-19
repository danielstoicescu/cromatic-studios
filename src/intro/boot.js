/* Cromatic Studios · the opening (r223, Daniel: "use the animation as the site loader"). Inline, the first thing in
   <body> (build/build.mjs): it decides what the visitor sees while the city loads, paints that ground at once, and loads
   the player (lottie-web's worker build: it draws in a Web Worker, so the city's boot on the main thread cannot stall
   it) and the opening (src/intro/intro-{desktop,phone}.json, made by design/intro-lottie/_source).
     full  · a first visit (or ?intro, always, even with reduced motion: asked for by name): the words, then the opening onto the map
     short · a returning visitor (the intro was seen in the last 6 h) or ?map: the pill alone, then the same opening
     rm    · prefers-reduced-motion: the pill, still; then a short fade onto the map
   The app (src/app.js) talks to it through window.__czIntro: progress(0..1), ready() when the city is built and drawn,
   onReveal(fn) as the map starts to show through the pill, onEnd(fn) when the map is the page. Skip appears only once
   the city is ready (before that the same pill shows the progress).
   r226 (Daniel: "in the final pill, the map behind it, not the grid"): the pill opens as a hole through the opening onto
   the live map. The reveal unfreezes the map first; the window opens only once the app says the map has drawn a frame
   (mapFrame()): until then the pill keeps its white and breathes (no hole onto an empty canvas). While the city loads the
   pill holds the Cromatic Studios logo (in the opening itself); after 1.5 s of that a caption under it says "brewing the
   city..." with the city's progress as a coffee line; it goes as soon as the city is ready.
   beta 3.69 (Daniel: "something to read first, for robots or for people"): the first paint is real text, the opening's
   own first line ("Nobody remembers a thumbnail.") where the opening draws it, at its size, in its face; the player
   takes over on its first frame (the opening starts with that line set) and the text goes, still in the page for
   readers and the largest paint. A returning visitor and reduced motion get the brand line over the pill.
   beta 3.77 (Daniel: over the pill the line "reads as an overlap"; on a phone "the right brand" ran edge to edge): that
   line is the pill's headline, one lockup with it: two lines, centred, half the pill's height clear above it, at a size
   that leaves wide margins (never less than 24 px a side) and is still the largest paint. */
(function () {
  var C = window.__CZI_CFG; if (!C) return;
  var q = location.search;
  // the /onboarding/ frame and the drive keep their own boot
  if (/[?&](drive|onb|nointro)\b/.test(q) || window.parent !== window) return;
  // 3.77: ?intro is the whole opening whatever else holds (Daniel's way to see it again: a returning visitor, reduced motion)
  var ask = /[?&]intro\b/.test(q);
  var rm = false; try { rm = !ask && matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) {}
  var seen = 0; try { seen = +localStorage.getItem("cz-intro-at") || 0; } catch (e) {}
  var full = ask || (!/[?&]map\b/.test(q) && Date.now() - seen >= 216e5);
  if (full) try { localStorage.setItem("cz-intro-at", String(Date.now())); } catch (e) {}
  var mode = rm ? "rm" : full ? "full" : "short";
  // 3.77: a returning visitor's moment is the lockup alone: the cookie card waits until the map is the page (on a laptop
  // it waited at the top right, where the headline is). Never longer than 30 s, whatever happens to the opening
  var de = document.documentElement, ckFree = function () { de.classList.remove("czi-ret"); };
  if (mode !== "full") { de.classList.add("czi-ret"); setTimeout(ckFree, 30000); }
  var ro = (document.documentElement.lang || "").slice(0, 2) === "ro";
  var TX = ro ? { load: "Construim orașul", skip: "Sari peste", brew: "se prepară orașul" } : { load: "Building the city", skip: "Skip intro", brew: "brewing the city" };
  var LINES = "Nobody remembers a thumbnail. But someone could remember a place, a facade, a brand. Nine worlds over the same streets. One will feel like yours. That's how the right brand feels.";
  var ab = innerWidth >= innerHeight ? "desktop" : "phone";
  var W = C.size[ab][0], H = C.size[ab][1];
  var Z = window.__czIntro = { mode: mode, ab: ab, done: false, isReady: false, t0: performance.now(), tm: {} };
  var tm = function (k) { if (Z.tm[k] == null) Z.tm[k] = Math.round(performance.now()); };
  var reveals = [], ends = [], cityReady = false, phase = "load", anim = null, M = null, pct = 0, want = 0.04, raf = 0, failed = false;
  var revealed = false, mapShown = false, wantOpen = false, holdT = 0, capT = 0;

  /* ---- the stage: the opening's own ground (grid paper at the opening's scale), its canvas, one button ---- */
  var st = document.createElement("div");
  st.id = "czi"; st.className = "czi czi-" + mode;
  var cv = document.createElement("canvas"); cv.className = "czi-cv";
  // (the drawing is an image of the words; the first line is also text, before it)
  // the text painted first (3.69): the opening's first line, or the brand line over the pill
  var FT = mode === "full" ? C.first && C.first[ab] : C.brand && C.brand[ab];
  cv.setAttribute("role", "img"); cv.setAttribute("aria-label", mode === "full" ? (FT ? LINES.replace(/^Nobody remembers a thumbnail\.\s*/, "") : LINES) : TX.load);
  var ft = null;
  if (FT) {
    ft = document.createElement("p"); ft.className = mode === "full" ? "czi-ft czi-first" : "czi-ft czi-brand"; ft.lang = "en";
    // (a space before each break, so the words do not run together for whoever reads the text rather than sees it)
    for (var li = 0; li < FT.lines.length; li++) { if (li) ft.appendChild(document.createElement("br")); ft.appendChild(document.createTextNode(FT.lines[li].t + (li < FT.lines.length - 1 ? " " : ""))); }
  }
  var pill = document.createElement("i"); pill.className = "czi-pill"; // the still pill (reduced motion, and the player's fallback)
  var bt = document.createElement("button"); bt.type = "button"; bt.className = "czi-btn"; bt.disabled = true;
  bt.innerHTML = '<span class="czi-t">' + TX.load + '</span> <b class="czi-p">4%</b>';
  // the caption under the pill while the city takes its time (r226): words, three dots, a coffee line (the progress)
  var cap = document.createElement("div"); cap.className = "czi-cap"; cap.setAttribute("aria-hidden", "true");
  cap.innerHTML = '<span class="czi-ct">' + TX.brew + '<span class="czi-dots"><i>.</i><i>.</i><i>.</i></span></span><span class="czi-fill"><i></i></span>';
  var capFill = cap.querySelector(".czi-fill i");
  st.appendChild(cv); st.appendChild(pill); if (ft) st.appendChild(ft); st.appendChild(cap); st.appendChild(bt);
  var ground = function () {
    var vw = innerWidth, vh = innerHeight, k = Math.max(vw / W, vh / H), ox = (vw - W * k) / 2, oy = (vh - H * k) / 2, g = 34 * k, l = Math.max(1, k).toFixed(2);
    st.style.backgroundSize = g + "px " + g + "px";
    st.style.backgroundPosition = (ox + 17 * k - l / 2) + "px " + (oy + 17 * k - l / 2) + "px";
    st.style.setProperty("--czl", l + "px");
    // the still pill sits where the opening's pill breathes: the middle of the screen, at its size
    var P = C.pill[ab], pw = P[0] * P[2], ph = P[1] * P[2];
    pill.style.width = pw * k + "px"; pill.style.height = ph * k + "px"; pill.style.setProperty("--czr", P[3] * P[2] * k + "px");
    // the caption: under the pill (its breath and its shadow included)
    cap.style.top = Math.round(vh / 2 + (ph * k * 1.03) / 2 + Math.max(18, 0.2 * ph * k)) + "px";
    // the text: its first baseline where the opening's is (a line box of lead x size, its baseline (half the leading
    // and the face's ascent) below its top: the face's metrics are set in boot.css, the same on every platform)
    if (ft) {
      // (3.77: the headline keeps 24 px a side on any screen, set smaller if it must; its last line stays where it is,
      // half the pill's height over it)
      var f = FT.size * k, n = FT.lines.length;
      if (FT.w && FT.w * k > vw - 48) f *= Math.max(0.5, (vw - 48) / (FT.w * k));
      var L = FT.lead * f, base = (L - (FT.asc + FT.desc) * f) / 2 + FT.asc * f;
      ft.style.fontSize = f + "px"; ft.style.lineHeight = L + "px";
      ft.style.top = oy + FT.lines[n - 1].by * k - base - (n - 1) * L + "px";
      if (FT.center != null) { ft.style.left = ox + "px"; ft.style.width = W * k + "px"; }
      else ft.style.left = ox + FT.lines[0].x * k + "px";
    }
  };
  ground();
  (document.body || document.documentElement).appendChild(st);
  addEventListener("resize", function () { ground(); if (anim && cv.width) { var d = dpr(); try { anim.resize(Math.round(innerWidth * d), Math.round(innerHeight * d)); } catch (e) {} } });

  /* ---- progress: the app's milestones, eased; a slow creep in between so it never sits still ---- */
  var paintPct = function () {
    var tgt = cityReady ? 1 : Math.min(0.97, Math.max(want, pct + (want + 0.1 - pct) * 0.004));
    pct += (tgt - pct) * (cityReady ? 0.25 : 0.08);
    bt.querySelector(".czi-p").textContent = Math.round(pct * 100) + "%";
    capFill.style.width = (pct * 100).toFixed(1) + "%";
    if (!Z.done && !(cityReady && pct > 0.995)) raf = requestAnimationFrame(paintPct);
    else if (cityReady) armSkip();
  };
  raf = requestAnimationFrame(paintPct);
  var armSkip = function () {
    if (mode !== "full" || noSkip || phase === "handoff" || phase === "end") { st.classList.add("czi-loaded"); return; }
    bt.disabled = false;
    bt.innerHTML = '<span class="czi-t">' + TX.skip + '</span> <span aria-hidden="true">→</span>';
    st.classList.add("czi-loaded", "czi-can-skip");
  };
  Z.progress = function (p) { if (p > want) want = Math.min(0.99, p); };
  // the logo holds in the pill while the city loads: 1.5 s of that, and the caption comes; the city ready, it goes.
  // Its time is set when the opening starts (the words' or the pill's length, + 1.5 s) and kept by a CSS animation's
  // delay: the compositor shows it on time even while the city's boot holds the main thread
  var brewAt = 0, noSkip = false;
  var armBrew = function (ms) {
    if (cityReady || brewAt) return;
    brewAt = performance.now() + ms;
    st.style.setProperty("--czb", (ms / 1000).toFixed(2) + "s");
    st.classList.add("czi-brewing");
  };
  var endBrew = function () {
    if (brewAt <= 0) return;
    var shown = performance.now() >= brewAt; brewAt = -1;
    st.classList.remove("czi-brewing");
    if (shown) st.classList.add("czi-brew-off");
  };

  /* ---- the player ---- */
  // at most 2x, and at most ~3.5 M pixels (a laptop at 2x: ~1.6x; the opening is all flat shapes and still crisp)
  var dpr = function () { return Math.max(1, Math.min(window.devicePixelRatio || 1, 2, Math.sqrt(3.5e6 / (innerWidth * innerHeight)))); };
  var mk = function (n) { return M && M[n]; };
  var segAt = 0, segFrames = 0, segArgs = null, lastFrameAt = 0;
  var play = function (a, b, loop) { segArgs = [a, b, loop]; segAt = performance.now(); segFrames = 0; try { anim.setLoop(!!loop); anim.playSegments([a, b], true); } catch (e) {} };
  // r226: a segment asked for before the worker had the animation (its DOMLoaded late, under load: the 2.5 s fallback
  // start) never plays; it is asked for again. A player that stops drawing altogether hands over to the fade
  var reveal = function () {
    if (revealed) return;
    revealed = true;
    for (var i = 0; i < reveals.length; i++) try { reveals[i](); } catch (e) {}
    reveals = [];
  };
  // the window opens (the handoff segment): only onto a map that has drawn
  var openNow = function () {
    if (phase === "handoff" || phase === "end") return;
    wantOpen = false; clearTimeout(capT); endBrew();
    phase = "handoff"; st.classList.add("czi-opening"); st.classList.remove("czi-can-skip"); bt.disabled = true;
    var h = mk("handoff"); play(h[0], h[1], false);
  };
  // time to open: the map is unfrozen (the reveal); if it has not drawn yet, the pill breathes (the hold) until it has
  var toHandoff = function () {
    if (phase === "handoff" || phase === "end" || phase === "fade") return;
    reveal();
    if (mapShown) { openNow(); return; }
    st.classList.remove("czi-can-skip"); bt.disabled = true;
    wantOpen = true;
    if (phase !== "hold") { phase = "hold"; holdT = 0; var h = mk("hold"); play(h[0], h[1], true); }
    clearTimeout(capT); capT = setTimeout(function () { mapShown = true; tryOpen(true); }, 2500); // a map that never says so: open anyway
  };
  // the hold breathes (its scale 100-103 %): the opening starts from it near its rest, its first or last frames, or at its end
  var tryOpen = function (force) {
    if (!wantOpen || phase !== "hold") return;
    var n = M && M.hold ? M.hold[1] - M.hold[0] : 96;
    if (force || holdT < 14 || holdT > n - 14) openNow();
  };
  Z.mapFrame = function () { if (mapShown) return; mapShown = true; Z.tm.mapFrame = Math.round(performance.now()); tryOpen(); };
  var finish = function () {
    if (Z.done) return;
    Z.done = true; phase = "end"; cancelAnimationFrame(raf);
    for (var i = 0; i < ends.length; i++) try { ends[i](); } catch (e) {}
    ends = [];
    st.classList.add("czi-gone"); ckFree();
    setTimeout(function () { try { anim && anim.destroy(); } catch (e) {} st.remove(); }, 450);
  };
  // the player has drawn: the first line's text goes (two frames on, when its drawing is on the screen); the brand line
  // over a returning visitor's pill stays until the window opens
  var drawn = function () { if (mode !== "full" || !ft) return; requestAnimationFrame(function () { requestAnimationFrame(function () { st.classList.add("czi-drawn"); }); }); };
  // without the player (reduced motion, no Worker, a failed load): the still pill, then a short fade onto the map
  var still = function () {
    failed = true; st.classList.add("czi-still"); armBrew(1500);
    startedOnce = true; for (var i = 0; i < started.length; i++) try { started[i](); } catch (e) {}
    started = [];
    if (cityReady) fadeOut();
  };
  var fadeOut = function () {
    if (phase === "end" || phase === "fade") return;
    phase = "fade";
    reveal();
    // the still pill fades once the map has drawn (or after a moment)
    var go = function () { if (st.classList.contains("czi-fade")) return; st.classList.add("czi-fade"); setTimeout(finish, 650); };
    if (mapShown) go(); else { var iv = setInterval(function () { if (mapShown) { clearInterval(iv); go(); } }, 30); setTimeout(function () { clearInterval(iv); go(); }, 900); }
  };
  var onComplete = function () {
    if (phase === "words" || phase === "short") {
      if (cityReady) toHandoff(); else { phase = "hold"; var h = mk("hold"); play(h[0], h[1], true); }
    } else if (phase === "handoff") finish();
  };
  var onLoop = function () { holdT = 0; if (phase === "hold" && cityReady) { if (wantOpen) tryOpen(true); else toHandoff(); } };
  // the app's bundle runs once the opening (or the returning visitor's pill) is under way: its first long tasks cannot
  // hold the player's start; at the latest after 1.2 s (0.6 s for the pill)
  var started = [], startedOnce = false;
  Z.afterStart = function (fn, cap) { if (startedOnce || mode === "rm") fn(); else { started.push(fn); setTimeout(fn, mode === "full" ? cap || 1200 : 600); } };
  var start = function () {
    if (phase !== "load") return;
    st.classList.add("czi-playing");
    startedOnce = true; for (var i = 0; i < started.length; i++) try { started[i](); } catch (e) {}
    started = [];
    if (mode === "full") { phase = "words"; var w = mk("words"); play(w[0], w[1], false); armBrew(((w[1] - w[0]) / 60) * 1000 + 1500); }
    else { phase = "short"; var s = mk("short"); play(s[0], s[1], false); armBrew(((s[1] - s[0]) / 60) * 1000 + 1500); }
  };
  var boot = function () {
    if (mode === "rm" || typeof Worker === "undefined" || typeof fetch === "undefined") { still(); return; }
    var data = null, lib = false, tryGo = function () {
      if (!data || !lib || anim || failed) return;
      try {
        M = data.cromatic && data.cromatic.markers;
        // the worlds' pictures: one atlas, fetched by the worker (an absolute address: the worker's base is a blob)
        for (var i = 0; i < data.assets.length; i++) if (data.assets[i].p && !data.assets[i].layers) { data.assets[i].p = location.origin + C.atlas[ab]; data.assets[i].u = ""; data.assets[i].e = 1; }
        var d = dpr(); cv.width = Math.round(innerWidth * d); cv.height = Math.round(innerHeight * d);
        tm("load");
        anim = window.lottie.loadAnimation({ container: st, renderer: "canvas", loop: false, autoplay: false, animationData: data, rendererSettings: { canvas: cv, preserveAspectRatio: "xMidYMid slice", clearCanvas: true, dpr: 1 } });
        anim.addEventListener("complete", onComplete);
        anim.addEventListener("loopComplete", onLoop);
        anim.addEventListener("enterFrame", function (e) { segFrames++; lastFrameAt = performance.now(); if (phase === "hold") holdT = +e.currentTime || 0; if (segFrames === 1) drawn(); });
        var watch = setInterval(function () {
          if (Z.done || phase === "fade" || failed) { clearInterval(watch); return; }
          if (phase === "load" || document.hidden || !segArgs) return;
          var now = performance.now();
          if (segFrames === 0 && now - segAt > 2000) play(segArgs[0], segArgs[1], segArgs[2]);
          else if (cityReady && now - Math.max(lastFrameAt, segAt) > 6000) { clearInterval(watch); fadeOut(); }
        }, 500);
        var started2 = false, go = function () { if (!started2) { started2 = true; tm("start"); start(); } };
        anim.addEventListener("DOMLoaded", go);
        setTimeout(go, 2500); // the event comes from the worker; never wait on it forever
      } catch (e) { still(); }
    };
    fetch(C.json[ab]).then(function (r) { if (!r.ok) throw 0; return r.json(); }).then(function (j) { tm("json"); data = j; tryGo(); }, still);
    var s = document.createElement("script"); s.src = C.player; s.async = true;
    s.onload = function () { tm("player"); lib = !!window.lottie; if (!lib) still(); else tryGo(); };
    s.onerror = still;
    document.head.appendChild(s);
  };
  boot();
  // a tab in the background: the opening waits (a hidden tab does not draw; on return it would jump to its end)
  document.addEventListener("visibilitychange", function () { if (!anim || Z.done) return; try { if (document.hidden) anim.pause(); else { segAt = lastFrameAt = performance.now(); anim.play(); } } catch (e) {} });

  /* ---- the app's side ---- */
  Z.ready = function () {
    if (cityReady) return;
    cityReady = true; Z.isReady = true; want = 1;
    // the caption was up (the pill held on its own): the opening follows at once, no button comes back for it
    if (brewAt > 0 && performance.now() >= brewAt) { noSkip = true; st.classList.add("czi-loaded"); }
    if (mode !== "full") st.classList.add("czi-loaded");
    endBrew();
    cancelAnimationFrame(raf); raf = requestAnimationFrame(paintPct);
    if (failed || mode === "rm") { fadeOut(); return; }
    if (phase === "hold") return; // the loop ends at its next turn (onLoop)
  };
  Z.onReveal = function (fn) { if (phase === "handoff" || phase === "fade" || phase === "end") fn(); else reveals.push(fn); };
  Z.onEnd = function (fn) { if (Z.done) fn(); else ends.push(fn); };
  Z.phase = function () { return phase; }; Z.player = function () { return anim; }; // tests (and the console)
  Z.skip = function () {
    if (!cityReady || mode !== "full" || (phase !== "words" && phase !== "hold") || wantOpen) return;
    // the words go in a blink; the empty pill is in the middle, and opens (once the map has drawn: until then it breathes)
    // (no timer before the worker is told: the main thread may still be busy with the city)
    st.classList.add("czi-blink");
    if (!mapShown && phase !== "hold") { phase = "hold"; holdT = 0; var h = mk("hold"); play(h[0], h[1], true); }
    toHandoff();
    setTimeout(function () { st.classList.remove("czi-blink"); }, 90);
  };
  bt.addEventListener("click", function () { Z.skip(); });
  addEventListener("keydown", function (e) { if (e.key === "Escape" && !Z.done) Z.skip(); });
  // a last resort: the app never said it was ready (an error): the map is shown anyway
  setTimeout(function () { if (!cityReady) { Z.ready(); } }, 45000);
})();
