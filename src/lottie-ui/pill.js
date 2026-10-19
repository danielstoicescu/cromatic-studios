/* Cromatic Studios · the pill transitions (r233, Lottie piece 3): the intro's window, wherever the map hands over to a page.
     open(frame, fallback)  a case page over the map: the studio's paper comes in and leaves a pill window onto the map,
                            the pill fills with white, the page is put under it, the white dissolves onto the page and
                            the window grows past every edge (src/lottie-ui/window-*.json, the shared worker player). The
                            page was asked for at the click: it loads meanwhile, unseen until the pill opens on it
     close(frame, done)     the reverse: the paper closes in round the page, the pill fills, the page goes (done), the
                            window opens onto the map, which has drawn again under the white
     leave()                the map to the website: the paper closes in round a pill (CSS, at once, nothing to load: the
                            click goes ahead and the next page loads meanwhile); the page that comes opens out of the same
                            pill (src/lottie-ui/pt-site.js, inlined in every page of the website)
   Reduced motion, or no player: none of it (the page opens and closes as before; fallback() is the old grow-in). */
(function () {
  if (window.czPill) return;
  var rm = function () { try { return matchMedia("(prefers-reduced-motion: reduce)").matches; } catch (e) { return true; } };
  var L = window.czL, piece = null, pieceP = null, gen = 0;
  var phone = function () { return innerWidth < 720 || innerWidth < innerHeight; };
  // the window: one full-screen canvas in the map's interface layer, over the page's frame (z 96), mounted when needed
  var get = function () {
    if (piece) return Promise.resolve(piece);
    if (pieceP) return pieceP;
    pieceP = L.mount("window-" + (phone() ? "phone" : "desktop"), { full: true, cls: "czl-window", host: document.querySelector(".ui-root") || document.body }).then(function (p) { piece = p; pieceP = null; return p; });
    return pieceP;
  };
  // (the map's driving controls sit outside its interface layer, over the window: they step aside while it plays)
  var busy = function (on) { document.body.classList.toggle("czl-win", !!on); };
  var drop = function () { busy(false); if (piece) { piece.destroy(); piece = null; } };
  var stop = function () { gen++; drop(); };
  var open = function (frame, fallback) {
    if (!L || rm() || frame.classList.contains("cf-game")) return false;
    var my = ++gen; closing = null;
    frame.style.visibility = "hidden";
    get().then(function (p) {
      if (my !== gen) return;
      if (!p) { frame.style.visibility = ""; if (fallback) fallback(); return; }
      busy(true);
      return p.seg("close").then(function () {
        if (my !== gen) return;
        frame.style.visibility = "";
        return p.seg("open");
      }).then(function () { if (my === gen) drop(); });
    });
    return true;
  };
  var closing = null;
  var close = function (frame, done) {
    if (!L || rm() || frame.classList.contains("cf-game") || frame.classList.contains("hidden")) return false;
    if (closing === frame) return true; // (Escape reaches it twice: the map's panels and the frame's own key)
    closing = frame;
    var my = ++gen, fin = false, finish = function () { if (fin) return; fin = true; closing = null; try { done(); } catch (e) {} };
    get().then(function (p) {
      if (my !== gen) { finish(); return; }
      if (!p) { finish(); return; }
      busy(true);
      return p.seg("close").then(function () {
        finish();
        if (my !== gen) return;
        return p.seg("open");
      }).then(function () { if (my === gen) drop(); });
    });
    setTimeout(finish, 2500); // (never leave the page up because the player went quiet)
    return true;
  };
  // ahead of a click that may open a page: the player and the window's data (no canvas yet)
  var warm = function () { if (L && !rm()) L.warm(["window-" + (phone() ? "phone" : "desktop")]); };

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
    if (u.origin !== location.origin || !/^\/(site|ro)\/$/.test(u.pathname)) return;
    leave();
  }, true);
  // the window's data fetched once the map has settled (the player is the intro's, usually there already)
  addEventListener("load", function () { setTimeout(warm, 5000); }, { once: true });
  window.czPill = { open: open, close: close, leave: leave, stop: stop, warm: warm };
})();
