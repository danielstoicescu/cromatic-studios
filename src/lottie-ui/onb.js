/* Cromatic Studios · /onboarding/'s explainers (r232, Lottie piece 2). Every [data-czl] box in the page's cards gets its
   little animation from the site's Lottie layer (czl.js: the intro's worker player, one worker for all of them):
     drive   the arrows (a laptop) or the stick (a phone) take a car round a block and drift its last corner
     views   Street or Bird's eye: the toggle (V on a laptop, a tap on a phone) and the camera rising over the car
     places  tap a place, the route, the drive, the card with the project, Nearby
     worlds  the Multiverse pill deals the nine worlds (the intro's own previews)
     game    the arcade: 2M2F, the cabinet's screen, a glove, K.O., PRESS START (APASĂ START in Romanian)
   Each is fetched and drawn only as its card comes near (one screen ahead), plays only while it is on screen, and
   follows its card's colours (a light and a dark version; the worlds' zone changes as you scroll). With reduced motion
   it is one still frame, the one that tells it best. */
(function () {
  if (!window.czL) return;
  var L = window.czL, boxes = [].slice.call(document.querySelectorAll("[data-czl]"));
  if (!boxes.length) return;
  document.documentElement.classList.add("czl-on"); // (the boxes show, the drive's keys step aside)
  var coarse = false; try { coarse = matchMedia("(pointer: coarse)").matches; } catch (e) {}
  var rm = L.rm() || document.documentElement.classList.contains("rm");
  // the frame that tells each one best, for reduced motion
  var STILL = { drive: 215, views: 190, places: 236, worlds: 62, game: 160 };
  var lum = function (c) { var m = /rgba?\(([\d.]+),\s*([\d.]+),\s*([\d.]+)/.exec(c || ""); if (!m) return 0; return (0.2126 * m[1] + 0.7152 * m[2] + 0.0722 * m[3]) / 255; };
  // the card's text is light: a dark card
  var themeOf = function (el) { return lum(getComputedStyle(el).color) > 0.55 ? "dark" : "light"; };
  var nameOf = function (el, th) {
    var k = el.getAttribute("data-czl");
    if (k === "drive") return "onb-drive-" + (coarse ? "stick" : "keys") + "-" + th;
    if (k === "views") return "onb-views-" + (coarse ? "tap" : "key") + "-" + th;
    if (k === "game") return "onb-game-" + th + "-" + (L.ro() ? "ro" : "en");
    return "onb-" + k + "-" + th;
  };
  var atlas = (L.cfg && L.cfg.atlas) || "";
  var mountBox = function (b) {
    if (b._p || b._busy) return;
    var th = themeOf(b), name = nameOf(b, th), r = b.getBoundingClientRect();
    if (r.width < 40) return;
    b._busy = true;
    L.mount(name, { host: b, w: r.width, h: r.height, cls: "czl-in", assets: atlas ? { worlds: atlas } : null }).then(function (p) {
      b._busy = false;
      if (!p) { b.classList.add("czl-fail"); return; } // no player: the page's own stand-in comes back (the drive's keys)
      b._p = p; b._th = th; b.classList.add("on");
      if (rm) { p.at(STILL[b.getAttribute("data-czl")] || 0); return; }
      if (b._vis) play(b); else p.at(0);
    });
  };
  var play = function (b) { var p = b._p; if (!p || rm) return; if (!b._playing) { b._playing = true; if (!b._started) { b._started = true; p.seg("loop", true); } else { try { p.anim.play(); } catch (e) {} } } };
  var pause = function (b) { var p = b._p; if (!p || !b._playing) return; b._playing = false; try { p.anim.pause(); } catch (e) {} };
  // near: fetch and draw; on screen: play; off: pause (the worker draws nothing it does not need to)
  var near = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) mountBox(e.target); }); }, { rootMargin: "100% 0px 100% 0px" });
  var seen = new IntersectionObserver(function (es) { es.forEach(function (e) { var b = e.target; b._vis = e.isIntersecting && e.intersectionRatio > 0.4; if (b._vis) play(b); else pause(b); }); }, { threshold: [0, 0.4, 0.8] });
  boxes.forEach(function (b) { near.observe(b); seen.observe(b); });
  // its card changed colour (the worlds' zone), or its size: drawn again, at the same moment of its loop
  var redo = function (b) { var p = b._p; if (!p) return; var was = b._playing; b._p = null; b._started = false; b._playing = false; p.destroy(); b.classList.remove("on"); if (was) b._vis = true; mountBox(b); };
  setInterval(function () { boxes.forEach(function (b) { if (b._p && b._vis && themeOf(b) !== b._th) redo(b); }); }, 700);
  var rt = 0, lastW = innerWidth;
  addEventListener("resize", function () { clearTimeout(rt); rt = setTimeout(function () { if (Math.abs(innerWidth - lastW) < 40) return; lastW = innerWidth; boxes.forEach(redo); }, 400); });
  document.addEventListener("visibilitychange", function () { boxes.forEach(function (b) { if (document.hidden) pause(b); else if (b._vis) play(b); }); });
})();
