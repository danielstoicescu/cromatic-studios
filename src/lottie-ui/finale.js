/* Cromatic Studios · the plane finale's 2D layer (r231, Lottie piece 1). The take-off stays 3D (src/app.js, mapTakeoff);
   this draws on top of it, with the shared player (czl.js):
     stamp(root)   BOARDED lands on the boarding pass the moment it is sent (ÎMBARCAT on a Romanian page)
     prepare()     the clouds and the confetti are loaded and mounted while the pass counts down to wheels up
     up()          the clouds close over the climb; they clear (the confetti behind the end card) once the end card
                   is there (endCard) and the screen was covered
     endCard(el)   the end card waits under the clouds and comes in with them; Romanian copy for a Romanian visitor
     down(cut)     "Back to the map": the card goes, the clouds rise over the sky, cut() lands the camera, they clear
   With reduced motion, without a player or before the clouds are ready, every call says so (false) and the app keeps
   its own way (the crossfade, the card's fade). */
(function () {
  if (window.czFinale || !window.czL) return;
  var L = window.czL, fin = null, finP = null, state = "idle", card = null, covered = false, cardT = 0, coverWait = null;
  var phone = function () { return innerWidth < 720 || innerWidth < innerHeight; };
  var COPY = {
    en: { b: "See you on board.", s: "Your boarding pass is with us. We write back within one working day.", save: "⬇ Save my boarding pass", replay: "↻ Start over on the map", map: "Back to the map" },
    ro: { b: "Ne vedem la bord.", s: "Cartea ta de îmbarcare e la noi. Îți răspundem într-o zi lucrătoare.", save: "⬇ Salvează cartea de îmbarcare", replay: "↻ Ia harta de la capăt", map: "Înapoi la hartă" }
  };

  /* ---- the stamp ---- */
  // where it lands: on a laptop in the stub's empty band between the seat and the barcode; on a phone (one column) on
  // the main part, right of the chips (both measured on the pass as it is drawn)
  var stampAt = function (pass) {
    var P = pass.getBoundingClientRect(), stub = pass.querySelector(".bp-stub"), main = pass.querySelector(".bp-main");
    // in the pass's own pixels: it may still be scaled by its card's entrance when it is measured
    var k = pass.offsetWidth / Math.max(1, P.width), X = function (v) { return (v - P.left) * k; }, Y = function (v) { return (v - P.top) * k; };
    var S = stub && stub.getBoundingClientRect(), M = main && main.getBoundingClientRect();
    var side = S && M && S.left > M.left + 40; // the stub beside the main part (laptop), not under it
    var pillW = side ? Math.min(190, S.width * k * 0.86) : Math.min(156, pass.offsetWidth * 0.44);
    if (side) {
      var seat = stub.querySelector(".bp-stub-row"), bars = stub.querySelector(".bp-bars");
      var y0 = seat ? seat.getBoundingClientRect().bottom : S.top + S.height * 0.4, y1 = bars ? bars.getBoundingClientRect().top : S.bottom - 60;
      return { x: X(S.left + S.width / 2), y: Y((y0 + y1) / 2), pillW: pillW };
    }
    var chips = main && main.querySelector(".bp-chips"), Cr = chips && chips.getBoundingClientRect();
    var yy = Cr ? Cr.top + Cr.height / 2 - 8 : M.bottom - 50;
    return { x: X(M ? M.right : P.right) - pillW * 0.62 - 6, y: Y(yy), pillW: pillW };
  };
  var stillStamp = function (pass, at, ro) {
    var s = document.createElement("span");
    s.className = "czl-stamp-still"; s.setAttribute("aria-hidden", "true");
    s.innerHTML = '<i class="czs-ck"></i><b>' + (ro ? "ÎMBARCAT" : "BOARDED") + "</b>";
    s.style.left = at.x + "px"; s.style.top = at.y + "px";
    pass.appendChild(s);
    s.style.setProperty("--czs", (at.pillW / Math.max(1, s.offsetWidth)).toFixed(3)); // as wide as the moving one
    return s;
  };
  var stamp = function (root) {
    var pass = root && root.querySelector(".bpass");
    if (!pass || pass.querySelector(".czl-stamp, .czl-stamp-still")) return false;
    var ro = (document.documentElement.lang || "").slice(0, 2) === "ro"; // the pass's own language (the map's pass is English)
    var at = stampAt(pass);
    pass.classList.add("czl-host");
    if (L.rm()) { stillStamp(pass, at, ro); return true; }
    var name = ro ? "stamp-ro" : "stamp-en";
    L.data(name).then(function (d) {
      if (!d || !pass.isConnected) { if (pass.isConnected) stillStamp(pass, at, ro); return; }
      // the canvas is the stamp's own artboard, scaled so its pill is as wide as wanted
      var k = at.pillW / d.cromatic.pill[0], w = d.w * k, h = d.h * k;
      return L.mount(name, { host: pass, w: w, h: h, cls: "czl-stamp" }).then(function (p) {
        if (!p) { stillStamp(pass, at, ro); return; }
        p.el.style.left = at.x - w / 2 + "px"; p.el.style.top = at.y - h / 2 + "px";
        // the pass takes the blow when it lands
        var land = (d.cromatic.land / 60) * 1000;
        setTimeout(function () { try { pass.animate([{ transform: "translateY(0) scale(1)" }, { transform: "translateY(2px) scale(.996)" }, { transform: "none" }], { duration: 260, easing: "cubic-bezier(.3,0,.3,1)" }); } catch (e) {} }, land);
        p.seg([0, d.op - 1]);
      });
    });
    return true;
  };

  /* ---- the clouds ---- */
  var ready = function () { return !!fin && !L.rm(); };
  var prepare = function () {
    if (L.rm() || finP) return finP;
    finP = L.mount("finale-" + (phone() ? "phone" : "desktop"), { full: true, cls: "czl-finale" }).then(function (p) { fin = p; return p; });
    return finP;
  };
  var reveal = function () {
    if (state !== "covered" || !card) return;
    state = "reveal"; clearTimeout(coverWait);
    var cardMs = ((fin.data.cromatic.card || 14) / 60) * 1000;
    fin.seg("reveal").then(function () { if (state === "reveal") state = "sky"; });
    cardT = setTimeout(showCard, cardMs);
  };
  var showCard = function () { if (card) { card.classList.remove("fe-wait"); card.classList.add("fe-in"); } };
  // the climb into the clouds (or the skip): false if the app should do it its own way
  var up = function () {
    if (!ready()) return false;
    if (state !== "idle") return true;
    state = "in"; covered = false; card = null;
    document.body.classList.add("czl-clouds");
    fin.seg("in").then(function () {
      covered = true; state = "covered";
      // the end card is made as the jet is gone; the clouds wait for it a moment (never long)
      if (card) reveal(); else coverWait = setTimeout(function () { card = card || document.querySelector(".flight-end") || null; if (!card) { state = "covered"; card = document.createElement("i"); } reveal(); }, 1400);
    });
    return true;
  };
  var endCard = function (el) {
    if (!el) return;
    var c = L.ro() ? COPY.ro : COPY.en;
    var b = el.querySelector("b"), s = el.querySelector("span");
    if (b) { b.setAttribute("aria-label", c.b); b.innerHTML = c.b.split("").map(function (ch, i) { return ch === " " ? " " : '<i class="fe-l" style="--i:' + i + '" aria-hidden="true">' + ch + "</i>"; }).join(""); }
    if (s) s.textContent = c.s;
    [[".fe-save", c.save], [".fe-replay", c.replay], [".fe-map", c.map]].forEach(function (x) { var q = el.querySelector(x[0]); if (q) q.textContent = x[1]; });
    if (L.ro()) el.setAttribute("lang", "ro");
    el.classList.add("fe-pol");
    if (state === "in" || state === "covered") { el.classList.add("fe-wait"); card = el; if (state === "covered") reveal(); }
    else el.classList.add("fe-in");
  };
  // "Back to the map": false if the app should crossfade as before
  var down = function (cut) {
    if (!ready() || (state !== "sky" && state !== "reveal")) return false;
    state = "down"; clearTimeout(cardT);
    if (card) { card.classList.remove("fe-in"); card.classList.add("fe-out"); }
    fin.seg("down").then(function () {
      try { cut(); } catch (e) {}
      state = "upout";
      return fin.seg("up");
    }).then(function () {
      document.body.classList.remove("czl-clouds");
      state = "idle"; card = null; fin.destroy(); fin = null; finP = null;
    });
    return true;
  };
  var active = function () { return state !== "idle"; };
  window.czFinale = { stamp: stamp, prepare: prepare, up: up, endCard: endCard, down: down, active: active, ready: ready, covered: function () { return covered; }, state: function () { return state; }, piece: function () { return fin; } };
})();
