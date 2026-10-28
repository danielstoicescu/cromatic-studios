/* Cromatic Studios · the pill transitions, the website's half (r233, Lottie piece 3). Inlined first thing in <body> on
   every page of the website (build/build.mjs) with its few lines of CSS:
     arriving from the map (it left a mark in sessionStorage a moment ago, src/lottie-ui/pill.js): the page paints with
     the studio's paper over it and a pill window in the middle, which opens past every edge (the page is there under it
     from the first frame, and takes taps through it)
     leaving for the map (a link to /city/, r359; it was "/" before the home move): the paper closes in round the pill while the map loads; the map's own loader
     is that pill on that paper (src/intro), and opens onto the city
   Nothing in a frame (a case page opened inside the map), nothing with reduced motion. */
(function () {
  try {
    if (window.parent !== window || window.__czL === false || matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    var mk = function (cls) { var o = document.createElement("div"); o.className = "czpt " + cls; o.setAttribute("aria-hidden", "true"); o.innerHTML = '<i class="czpt-hole"></i><i class="czpt-body"></i><i class="czpt-ring"></i>'; document.body.appendChild(o); return o; };
    var t = +sessionStorage.getItem("cz-pt") || 0;
    sessionStorage.removeItem("cz-pt");
    if (Date.now() - t < 4000) { var a = mk("czpt-arrive"); setTimeout(function () { a.remove(); }, 400); }
    document.addEventListener("click", function (e) {
      if (e.defaultPrevented || e.button || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      var l = e.target && e.target.closest && e.target.closest("a[href]");
      if (!l || l.target === "_blank" || l.hasAttribute("download")) return;
      var u = new URL(l.href, location.href);
      if (u.origin !== location.origin || !/^\/city\/?$/.test(u.pathname)) return;
      try { sessionStorage.setItem("cz-pt", String(Date.now())); } catch (er) {}
      var o = mk("czpt-leave");
      addEventListener("pageshow", function (ev) { if (ev.persisted) o.remove(); }, { once: true });
      setTimeout(function () { o.remove(); }, 6000);
    }, true);
  } catch (e) {}
})();
