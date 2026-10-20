/* Cromatic Studios · into the arcade game and back out (TASK-009, Lottie piece 5; Daniel: "the pixel transition into
   2 MINUTES 2 FIGHT w/ I O N"; "exiting the game, the camera zooms out from the map's arcade cabinet screen to Bird's
   eye", and "it should not cost too much"). The game's frame (src/app.js: the case frame with a /play/ page) gets:
     open(frame)        the way in. The frame is drawn but all but unseen (1 %) while the game loads under the pixels: the
                        screen breaks into chunky pixels from the button that was pressed (game-{wide,tall}[-sketch]-{en,ro},
                        "in": each block's start is moved here to its distance from that button), in the game's dusk
                        colours (Sketchbook: squares inked on the notebook, then coloured in). Once they cover it the frame
                        is shown under them (the city rests from then: the game has the thread); once the game has drawn
                        its splash (its czGloves.ready) they dissolve into it ("out"). A game still loading gets NOW
                        LOADING (SE ÎNCARCĂ on a Romanian page) meanwhile, "hold", on a loop
     close(frame, done) the way out. The pixels cover the game, done() takes it away, the map's camera is put square on the
                        arcade cabinet's screen (window.__czArcadeOut: mapUI's arcadeOut, src/app.js), the pixels dissolve
                        onto it and the camera pulls back to Bird's eye
   Drawn by the shared player in its worker (czl.js), one canvas pixel a CSS pixel, scaled up unsmoothed (every shape is a
   square). Each mount goes as soon as its "out" ends: nothing runs or stays once the way in or out is over. The data is
   fetched once, when the map has been idle a while or a game button is pointed at.
   Reduced motion: none of it (the game opens and closes at once; the camera stays). No player, or the piece late: the game
   shows as before; on the way out the camera still pulls back from the cabinet (that is the map's own, not this layer's). */
(function () {
  if (window.czGame || !window.czL) return;
  var L = window.czL, cur = null, closing = null;
  var IN1 = 36, BTN = ".mcd-fight, .map-2m2f, .n2-2m2f, .lab-play";
  var rm = function () { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return true; } };
  // the piece for this screen: wide (a laptop, a phone on its side) or tall (a phone upright); Sketchbook's notebook
  var name = function (shape) { return "game-" + (shape || (innerWidth >= innerHeight ? "wide" : "tall")) + (document.body.classList.contains("scheme-sketch") ? "-sketch" : ""); };
  var has = function (n) { var j = (L.cfg && L.cfg.j) || {}; return !!(j[n + "-en"] || j[n]); };
  var warmed = {};
  var warm = function () { var n = name(); if (warmed[n] || rm() || !has(n)) return; warmed[n] = 1; L.warm([n]); };

  /* ---- where the pixels start: the button that was pressed (or focused and pressed), if it is still on screen ---- */
  var last = null;
  var note = function (t) { last = t ? { el: t, t: performance.now() } : null; };
  document.addEventListener("pointerdown", function (e) { var t = e.target && e.target.closest && e.target.closest("button, a, [role=button]"); note(t); if (t && t.matches(BTN)) warm(); }, true);
  document.addEventListener("keydown", function (e) { if (e.key !== "Enter" && e.key !== " ") return; var t = document.activeElement; note(t && t.closest ? t.closest("button, a, [role=button]") : null); }, true);
  document.addEventListener("mouseover", function (e) { if (e.target && e.target.closest && e.target.closest(BTN)) warm(); }, { passive: true });
  document.addEventListener("focusin", function (e) { if (e.target && e.target.closest && e.target.closest(BTN)) warm(); });
  // (and once the page has been quiet a while: a laptop's 2M2F button is always there)
  var later = function () { setTimeout(function () { if (window.requestIdleCallback) requestIdleCallback(warm, { timeout: 4000 }); else warm(); }, 15000); };
  if (document.readyState === "complete") later(); else addEventListener("load", later);
  var origin = function () {
    var W = innerWidth, H = innerHeight, el = last && performance.now() - last.t < 6000 ? last.el : null; // (a laptop's card first parks the camera: ~3.4 s)
    if (el && el.isConnected) { var r = el.getBoundingClientRect(); if (r.width > 4 && r.bottom > 0 && r.right > 0 && r.left < W && r.top < H) return [r.left + r.width / 2, r.top + r.height / 2]; }
    return [W / 2, H / 2];
  };
  // the blocks' starts, by their distance from the origin (sx, sy on screen) across what the screen shows of the piece
  // (it covers the screen, "slice"), with each block's own share of noise (json.cromatic.n). Only the "in" keys move;
  // the shared copy is not changed: a block's group is new only where its keys are
  // (cols: the way out gives every block its colour too: the game's screen as it was left, the pixels it breaks into)
  var retime = function (d, sx, sy, cols) {
    var Z = d.cromatic, vw = innerWidth, vh = innerHeight, s = Math.max(vw / d.w, vh / d.h), ox = (vw - d.w * s) / 2, oy = (vh - d.h * s) / 2;
    var cx = (sx - ox) / s, cy = (sy - oy) / s, x0 = -ox / s, y0 = -oy / s, x1 = (vw - ox) / s, y1 = (vh - oy) / s;
    var maxD = Math.max(Math.hypot(x0 - cx, y0 - cy), Math.hypot(x1 - cx, y0 - cy), Math.hypot(x0 - cx, y1 - cy), Math.hypot(x1 - cx, y1 - cy)) || 1;
    var li = -1; for (var i = 0; i < d.layers.length; i++) if (d.layers[i].nm === "blocks") li = i;
    if (li < 0 || !Z || !Z.d) return d;
    var shift = function (prop, a, b, dd) { var k = prop.k.slice(); for (var j = a; j <= b; j++) k[j] = Object.assign({}, k[j], { t: k[j].t + dd }); return Object.assign({}, prop, { k: k }); };
    var shapes = d.layers[li].shapes.map(function (g, i) {
      var c = i % Z.cols, r = (i / Z.cols) | 0, bx = (c + 0.5) * Z.B, by = (r + 0.5) * Z.B;
      var nd = Math.round(Math.min(1, (0.86 * Math.hypot(bx - cx, by - cy)) / maxD + 0.14 * Z.n[i]) * Z.spread), dd = nd - Z.d[i];
      if (!dd && !cols) return g;
      var it = g.it.slice(), fl = it.length - 2;
      if (dd) it[0] = Object.assign({}, it[0], { s: shift(it[0].s, 1, 2, dd) });
      if (cols) it[fl] = Object.assign({}, it[fl], { c: { a: 0, k: cols[i] } }); // (no gold flash: the screen itself breaks up)
      else if (dd) it[fl] = Object.assign({}, it[fl], { c: shift(it[fl].c, 1, 2, dd) });
      return Object.assign({}, g, { it: it });
    });
    var layers = d.layers.slice(); layers[li] = Object.assign({}, d.layers[li], { shapes: shapes });
    return Object.assign({}, d, { layers: layers });
  };
  var mount = function (o, shot) {
    return L.mount(name(), { full: true, k: 1, cls: "czl-game", patch: function (d) { return retime(d, o[0], o[1], shot ? shot(d) : null); }, cz: { play: [[0, IN1]], loop: false } });
  };
  /* ---- the way out's colours: the game's own screen, brought down to the blocks ---- */
  // json.cromatic.tone, as the generator does it (design/lottie-ui/_source/pieces/game.mjs tone): saturation and contrast
  // lifted a little, the dark ones in a two-tone checker; Sketchbook: towards the paper, the dark ones in indigo pencil
  var hex2 = function (h) { return [1, 3, 5].map(function (i) { return parseInt(h.slice(i, i + 2), 16) / 255; }); };
  var tone = function (c, checker, sk, T) {
    var r = c[0], g = c[1], b = c[2], mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, s = 0, h = 0;
    if (mx !== mn) { var dd = mx - mn; s = l > 0.5 ? dd / (2 - mx - mn) : dd / (mx + mn); h = (mx === r ? (g - b) / dd + (g < b ? 6 : 0) : mx === g ? (b - r) / dd + 2 : (r - g) / dd + 4) / 6; }
    var dark = l < T.d;
    s = Math.min(1, s * T.s); l = Math.min(1, Math.max(0, (l - 0.5) * T.k + 0.5 + T.l)); if (dark && checker) l = Math.min(1, l + T.dl);
    var q = l < 0.5 ? l * (1 + s) : l + s - l * s, p = 2 * l - q;
    var f = function (t) { t = (t + 1) % 1; return t < 1 / 6 ? p + (q - p) * 6 * t : t < 1 / 2 ? q : t < 2 / 3 ? p + (q - p) * (2 / 3 - t) * 6 : p; };
    var o = s === 0 ? [l, l, l] : [f(h + 1 / 3), f(h), f(h - 1 / 3)];
    if (sk) { var S = T.sketch, P = hex2(S.paper), I = hex2(S.ink); o = dark ? I.map(function (v, i) { return v + (P[i] - v) * (S.inkK + (checker ? 0.08 : 0)); }) : o.map(function (v, i) { return v + (P[i] - v) * S.k; }); }
    return [o[0], o[1], o[2], 1].map(function (v) { return Math.round(v * 1000) / 1000; });
  };
  // the game's canvas as it is on the screen, drawn small: one pixel a block (in two steps, so each is an average and not
  // one sample of the picture), on the game page's own dark; a few hundred pixels read once, at the moment it is left
  var shotOf = function (frame) {
    return function (d) {
      var Z = d.cromatic; if (!Z || !Z.tone) return null;
      try {
        var f = frame.querySelector("iframe"), gc = f && f.contentDocument && f.contentDocument.querySelector(".mg-cv");
        if (!gc || !gc.width) return null;
        var R = gc.getBoundingClientRect(), vw = innerWidth, vh = innerHeight, s = Math.max(vw / d.w, vh / d.h), ox = (vw - d.w * s) / 2, oy = (vh - d.h * s) / 2, bs = Z.B * s;
        var mid = document.createElement("canvas"), mw = Math.min(gc.width, Math.ceil(R.width / bs) * 4), mh = Math.min(gc.height, Math.ceil(R.height / bs) * 4);
        mid.width = Math.max(1, mw); mid.height = Math.max(1, mh);
        var mx = mid.getContext("2d"); mx.imageSmoothingEnabled = true; mx.imageSmoothingQuality = "high"; mx.drawImage(gc, 0, 0, mid.width, mid.height);
        var sm = document.createElement("canvas"); sm.width = Z.cols; sm.height = Z.rows;
        var x = sm.getContext("2d", { willReadFrequently: true }); x.fillStyle = "#0b0816"; x.fillRect(0, 0, Z.cols, Z.rows);
        x.imageSmoothingEnabled = true; x.imageSmoothingQuality = "high";
        x.drawImage(mid, (R.left - ox) / bs, (R.top - oy) / bs, R.width / bs, R.height / bs);
        var px = x.getImageData(0, 0, Z.cols, Z.rows).data, out = [], sk = Z.theme === "sketch";
        for (var i = 0; i < Z.cols * Z.rows; i++) out.push(tone([px[i * 4] / 255, px[i * 4 + 1] / 255, px[i * 4 + 2] / 255], ((i % Z.cols) + ((i / Z.cols) | 0)) % 2 === 1, sk, Z.tone));
        return out;
      } catch (e) { return null; }
    };
  };
  // two frames (the page drawn once more), or 150 ms if frames do not come
  var raf2 = function (fn) { var done = false, go = function () { if (!done) { done = true; fn(); } }; requestAnimationFrame(function () { requestAnimationFrame(go); }); setTimeout(go, 150); };
  // the game has drawn its splash (an older game, with no ready(): as soon as it is there)
  var gameReady = function (frame) {
    var f = frame.querySelector("iframe");
    try { var g = f && f.contentWindow && f.contentWindow.czGloves; if (!g) return false; return typeof g.ready === "function" ? !!g.ready() : true; } catch (e) { return true; }
  };
  var clean = function () {
    if (!cur) return;
    var c = cur; cur = null;
    clearTimeout(c.late);
    c.anims.forEach(function (a) { try { a.cancel(); } catch (e) {} });
    if (c.p) c.p.destroy();
  };
  // when the worker says the opening segment ("in") has ended (it plays it on its own as soon as it has built the piece)
  var onCovered = function (c, p, fn) { p.anim.addEventListener("complete", function () { if (c.stage || cur !== c) return; c.stage = "covered"; fn(); }); };

  /* ---- the way in ---- */
  var open = function (frame) {
    if (rm() || !frame.animate || !has(name()) || closing) return false;
    clean();
    var c = cur = { frame: frame, anims: [], p: null, stage: null };
    L.warm([name(innerWidth >= innerHeight ? "tall" : "wide")]); // (the way out may be the other way up: a phone turned for the game)
    // drawn whole, all but unseen (at 0 it would not be drawn at all); the city keeps drawing until the pixels cover it
    c.anims.push(frame.animate([{ opacity: 0.01 }, { opacity: 0.01 }], { duration: 1, fill: "forwards" }));
    c.late = setTimeout(function () { if (cur === c && !c.p) { c.p = false; clean(); } }, 900); // (the pixels late: the game shows, as before)
    mount(origin()).then(function (p) {
      if (!p) { if (cur === c) clean(); return; }
      if (cur !== c || c.p === false) { p.destroy(); return; }
      clearTimeout(c.late); c.p = p;
      onCovered(c, p, function () {
        // covered: the frame is shown under the pixels (the city rests now); the game draws its splash, then they go
        c.anims.forEach(function (a) { try { a.cancel(); } catch (e) {} }); c.anims = [];
        var t0 = performance.now();
        var check = function () {
          if (cur !== c) return;
          if (frame.classList.contains("hidden")) { clean(); return; }
          if (gameReady(frame) || performance.now() - t0 > 8000) {
            raf2(function () { if (cur !== c) return; c.stage = "out"; p.seg("out").then(function () { if (cur === c) clean(); }); });
            return;
          }
          if (!c.held && performance.now() - t0 > 120) { c.held = true; p.seg("hold", true); } // (still loading: NOW LOADING)
          setTimeout(check, 50);
        };
        check();
      });
    });
    return true;
  };

  /* ---- the way out ---- */
  var close = function (frame, done) {
    if (rm() || !frame.classList.contains("cf-game") || frame.classList.contains("hidden")) return false;
    if (closing === frame) return true; // (Escape can reach it twice: the map's panels and the frame's own key)
    clean(); closing = frame; frame._czClosing = true; // (its address is no longer the page's: src/app.js, the overlays' history)
    var c = cur = { frame: frame, anims: [], p: null, stage: null }, fin = false;
    // the game goes, the camera is put on the cabinet's screen
    var finish = function () { if (fin) return; fin = true; closing = null; frame._czClosing = false; try { done(); } catch (e) {} try { if (window.__czArcadeOut) window.__czArcadeOut(); } catch (e) {} };
    if (!has(name())) { finish(); return true; }
    c.late = setTimeout(function () { if (cur === c && !c.p) { c.p = false; finish(); clean(); } }, 700);
    setTimeout(function () { if (!fin) { finish(); if (cur === c) clean(); } }, 3000); // (never leave the game up because the worker did not answer)
    mount([innerWidth / 2, innerHeight / 2], shotOf(frame)).then(function (p) {
      if (!p) { if (cur === c) { finish(); clean(); } return; }
      if (cur !== c || c.p === false) { p.destroy(); return; }
      clearTimeout(c.late); c.p = p;
      try { p.anim.setSpeed(2); } catch (e) {} // (a way out is quicker than a way in: the game is still running under it)
      onCovered(c, p, function () {
        finish();
        // the city draws the cabinet's screen (two frames), then the pixels clear off it
        raf2(function () { if (cur !== c) return; c.stage = "out"; try { p.anim.setSpeed(1); } catch (e) {} p.seg("out").then(function () { if (cur === c) clean(); }); });
      });
    });
    return true;
  };
  window.czGame = { open: open, close: close, warm: warm };
})();
