/* Cromatic Studios · the map's small moments (r234, Lottie piece 4), with the intro's finesse and none of its weight: Web
   Animations and CSS only (the compositor's transforms and opacity; no canvas, no worker for something this small).
     xpFly(from, to, pts, bg, ink)  "+5 XP" pops off the place it was found at, in the place's colours: it springs out of
                                    the pin with a few sparks, floats a beat, flies up to the XP bar on an arc and is
                                    swallowed by it; the bar takes it with a squash and a little flash of its own
   The rest is CSS in czl.css: the place cards landing (and leaving quickly), the 2M2F tile's gleam and its glove's jab,
   Nearby's 2M2F card taking a hit, Nearby's new places dealt in. All of it transforms and opacity only (the compositor
   draws it: a busy main thread does not stop it), each gone when it ends: nothing runs while nothing happens. Sketchbook
   draws them on its notebook (czl.css). With reduced motion: the points show by the bar for a moment, still; the rest
   does not move. */
(function () {
  if (window.czMicro || window.__czL === false) return;
  document.documentElement.classList.add("czx-on"); // (the CSS half hangs on it: __czL = false turns the whole piece off)
  var rm = function () { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return true; } };
  var SPRING = "cubic-bezier(.34,1.56,.64,1)";
  var spark = function (host, x, y, i, n, col) {
    var s = document.createElement("i");
    s.className = "czx-sp czx-sp" + i; s.style.background = col;
    host.appendChild(s);
    var a = (i / n) * Math.PI * 2 - Math.PI / 2 + (Math.random() - 0.5) * 0.5, r = 26 + Math.random() * 16;
    var k = s.animate([
      { transform: "translate(" + x + "px," + y + "px) scale(.2) rotate(0deg)", opacity: 1 },
      { transform: "translate(" + (x + Math.cos(a) * r) + "px," + (y + Math.sin(a) * r) + "px) scale(1) rotate(45deg)", opacity: 1, offset: 0.55 },
      { transform: "translate(" + (x + Math.cos(a) * r * 1.25) + "px," + (y + Math.sin(a) * r * 1.25 + 6) + "px) scale(.3) rotate(90deg)", opacity: 0 }
    ], { duration: 520, easing: "cubic-bezier(.2,.7,.3,1)", delay: 40 });
    k.onfinish = k.oncancel = function () { s.remove(); };
  };
  var barTake = function (bar) {
    if (!bar || !bar.animate) return;
    bar.animate([{ transform: "scale(1)" }, { transform: "scale(1.07,.92)", offset: 0.3 }, { transform: "scale(.98,1.03)", offset: 0.62 }, { transform: "scale(1)" }], { duration: 420, easing: "cubic-bezier(.3,0,.3,1)" });
    var f = document.createElement("i"); f.className = "czx-flash"; bar.appendChild(f);
    var k = f.animate([{ opacity: 0.85, transform: "scaleX(.2)" }, { opacity: 0, transform: "scaleX(1.05)" }], { duration: 480, easing: "ease-out" });
    k.onfinish = k.oncancel = function () { f.remove(); };
  };
  var xpFly = function (from, to, pts, bg, ink) {
    if (!from || !to || !document.body.animate) return false;
    var f = document.createElement("span");
    f.className = "czx"; f.setAttribute("aria-hidden", "true");
    f.innerHTML = "<b>+" + pts + "</b><i>XP</i>";
    f.style.setProperty("--pc", bg || "#FED012"); f.style.setProperty("--pt", ink || "#111");
    document.body.appendChild(f);
    var bar = document.querySelector(".topbar .you");
    var x1 = to.right - 40, y1 = to.top + to.height / 2;
    if (rm()) {
      var r = f.animate([{ transform: "translate(" + (x1 - 70) + "px," + (y1 + 34) + "px)", opacity: 0 }, { opacity: 1, offset: 0.2 }, { opacity: 1, offset: 0.8 }, { transform: "translate(" + (x1 - 70) + "px," + (y1 + 34) + "px)", opacity: 0 }], { duration: 1100 });
      r.onfinish = r.oncancel = function () { f.remove(); };
      return true;
    }
    var x0 = from.left + from.width / 2, y0 = from.top + 4;
    // the arc: up off the pin, then a curve to the bar (its control point above the straight line between them)
    var cx = (x0 + x1) / 2 + (x1 > x0 ? -60 : 60), cy = Math.min(y0, y1) - 70, pt = function (u) { var a = 1 - u; return [a * a * (x0) + 2 * a * u * cx + u * u * x1, a * a * (y0 - 40) + 2 * a * u * cy + u * u * y1]; };
    var kf = [
      { transform: "translate(" + x0 + "px," + y0 + "px) scale(.2) rotate(-14deg)", opacity: 0 },
      { transform: "translate(" + x0 + "px," + (y0 - 34) + "px) scale(1.2,.9) rotate(-4deg)", opacity: 1, offset: 0.13, easing: SPRING },
      { transform: "translate(" + x0 + "px," + (y0 - 42) + "px) scale(1) rotate(-3deg)", opacity: 1, offset: 0.24 },
      { transform: "translate(" + x0 + "px," + (y0 - 40) + "px) scale(1) rotate(-2deg)", opacity: 1, offset: 0.34, easing: "cubic-bezier(.6,0,.4,1)" }
    ];
    // (every keyframe says its opacity: the pill stays whole all the way and goes only at the bar)
    for (var i = 1; i <= 4; i++) { var u = i / 4, p = pt(u); kf.push({ transform: "translate(" + p[0] + "px," + p[1] + "px) scale(" + (1 - 0.45 * u) + ") rotate(" + (-2 + 2 * u) + "deg)", opacity: 1, offset: 0.34 + 0.5 * u }); }
    kf.push({ transform: "translate(" + x1 + "px," + y1 + "px) scale(.25)", opacity: 0 });
    var a = f.animate(kf, { duration: 1250, easing: "linear" });
    var sp = document.createElement("div"); sp.className = "czx-sparks"; sp.setAttribute("aria-hidden", "true"); document.body.appendChild(sp);
    var cols = [bg || "#FED012", "#FED012", "#119BFE", "#F65342", "#28C840"];
    for (var j = 0; j < 5; j++) spark(sp, x0, y0 - 30, j, 5, cols[j % cols.length]);
    var rate = window.__czxRate || 1; // (the previews slow the page's animations down: its timers follow)
    setTimeout(function () { sp.remove(); }, 800 / rate);
    setTimeout(function () { barTake(bar); }, 1040 / rate);
    a.onfinish = a.oncancel = function () { f.remove(); };
    return true;
  };
  // Nearby (src/nav2.js) builds its list again only when what is around changes (its distances change in place): only
  // the places that were not in it a moment ago come in, one after another (.czx-new, set before the page paints them;
  // the roundabout's row of six is dealt that way as the panel slides in); the others just stay. The observer watches the
  // panel's own children, which is what a new list replaces: the distances ticking do not wake it
  var watchNearby = function () {
    var panel = document.querySelector(".nav2-ui .n2-panel");
    if (!panel) return false;
    var seen = null;
    var tag = function () {
      var now = new Set(), k = 0, cards = panel.querySelectorAll(".n2-strip > .n2-pc");
      for (var i = 0; i < cards.length; i++) {
        var c = cards[i], id = c.getAttribute("data-id") || "";
        now.add(id);
        if (seen && !seen.has(id)) { c.classList.add("czx-new"); c.style.animationDelay = (Math.min(k++, 6) * 0.055).toFixed(3) + "s"; }
      }
      seen = now;
    };
    new MutationObserver(tag).observe(panel, { childList: true });
    tag();
    return true;
  };
  // (the panel is made with the map's interface: looked for once a second until it is there, a minute at most)
  if (!rm()) { var tries = 0, iv = setInterval(function () { if (watchNearby() || ++tries > 60) clearInterval(iv); }, 1000); }
  window.czMicro = { xpFly: xpFly, barTake: barTake };
})();
