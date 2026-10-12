// r135c: the big film of a case page (Daniel): opened from the map, it starts by itself, with sound when the browser
// allows it (the visitor just clicked), muted otherwise; a film further down starts when it comes into view and
// pauses when it leaves. Whatever happens, nothing plays once the page is closed or hidden.
// r136: YouTube films sit behind a click-to-play facade (ytFacade below); "playing" one means opening its facade.
export const FILM_AUTO = `<script>(function(){
var EMB=/[?&]embed=1/.test(location.search);
function ytCmd(f,c){try{f.contentWindow.postMessage(JSON.stringify({event:"command",func:c,args:""}),"*")}catch(e){}}
function stopAll(){document.querySelectorAll("video").forEach(function(v){try{v.pause()}catch(e){}});document.querySelectorAll('iframe[src*="youtube"]').forEach(function(f){ytCmd(f,"pauseVideo")})}
addEventListener("pagehide",stopAll);document.addEventListener("visibilitychange",function(){if(document.hidden)stopAll()});
if(!EMB)return;
var FILMS=[];
function big(el){var r=el.getBoundingClientRect();return r.width*r.height>=innerWidth*innerHeight*0.18&&r.width>=Math.min(innerWidth*0.4,360)}
function yf(el){return el.tagName==="IFRAME"?el:el.querySelector("iframe")}
function others(el){FILMS.forEach(function(o){if(o===el)return;if(o.tagName==="VIDEO"){o.muted=true}else{var f=yf(o);if(f&&/enablejsapi=1/.test(f.src))ytCmd(f,"pauseVideo")}})}
function playVideo(v){others(v);if(v.dataset.src&&!v.getAttribute("src"))v.src=v.dataset.src;v.muted=false;v.volume=1;var p=v.play();if(p&&p.catch)p.catch(function(){v.muted=true;v.play().catch(function(){})});var b=v.parentElement&&v.parentElement.querySelector(".vs-btn");if(b&&!v.muted)b.setAttribute("aria-pressed","true")}
function playYT(el){others(el);var f=yf(el);if(!f){if(window.__ytPlay)window.__ytPlay(el);return}if(!/enablejsapi=1/.test(f.src)){f.src=f.src+(f.src.indexOf("?")>-1?"&":"?")+"enablejsapi=1&autoplay=1";return}ytCmd(f,"playVideo")}
function go(){
  var films=FILMS=[].slice.call(document.querySelectorAll('.yt-facade, iframe[src*="youtube"], video')).filter(function(el){return !(el.tagName==="IFRAME"&&el.closest(".yt-facade"))}).filter(big);
  if(!films.length)return;
  var first=films[0];
  var io=new IntersectionObserver(function(es){es.forEach(function(e){var el=e.target;
    if(e.isIntersecting&&e.intersectionRatio>=0.5){if(el.tagName==="VIDEO")playVideo(el);else playYT(el)}
    else if(!e.isIntersecting||e.intersectionRatio<0.2){if(el.tagName==="VIDEO"){if(!el.loop)el.pause()}else{var f=yf(el);if(f&&/enablejsapi=1/.test(f.src))ytCmd(f,"pauseVideo")}}})},{threshold:[0,0.2,0.5]});
  films.forEach(function(f){io.observe(f)});
  var r=first.getBoundingClientRect();if(r.top<innerHeight*1.1){if(first.tagName==="VIDEO")playVideo(first);else playYT(first)}
}
if(document.readyState==="complete")setTimeout(go,350);else addEventListener("load",function(){setTimeout(go,350)});
})();</script>`;

// r136 (audit N25): a YouTube film is a local poster and a play button until the visitor asks for it. Nothing is
// requested from Google (not youtube-nocookie.com, not i.ytimg.com, not fonts.gstatic.com) before that click; the
// click swaps in the real youtube-nocookie player with autoplay=1 (enablejsapi=1, so FILM_AUTO can pause it).
// r138d (Daniel: "remove as much of the YouTube interface as possible"): the player comes without its controls
// (controls=0, no keyboard, no fullscreen, no annotations, no captions, related films from the same channel only) and
// never under the pointer: it sits in a frame taller than the film (16:9 fits the width, YouTube's title bar and logo
// land in the bands cut off above and below) behind a layer that takes the clicks. Our own two buttons (play/pause,
// sound) drive it through the IFrame API's postMessage; the poster comes back over it on pause and at the end, so
// YouTube's "More videos" shelf and end screen are never seen. If the API never answers, the player gets its own
// controls back (controls=1), uncropped.
const YT_PARAMS = "controls=0&disablekb=1&fs=0&iv_load_policy=3&cc_load_policy=0&rel=0&modestbranding=1&playsinline=1&showinfo=0&color=white";
const YT_CSS2 = `.yt-facade{overflow:hidden}.yt-stage{position:absolute;inset:0;overflow:hidden;background:#000;z-index:0}.yt-facade .yt-stage iframe{position:absolute;inset:auto;left:0;top:-90px;width:100%;height:calc(100% + 180px);border:0;pointer-events:none}.yt-native .yt-stage iframe{top:0;height:100%;pointer-events:auto}.yt-play{z-index:2;transition:opacity .35s ease}.yt-live .yt-play{opacity:0;pointer-events:none}.yt-live.yt-wait .yt-play,.yt-live.yt-paused .yt-play{opacity:1;pointer-events:auto}.yt-live.yt-wait .yt-cta svg{animation:yt-pulse .8s ease-in-out infinite alternate}@keyframes yt-pulse{to{transform:scale(.86)}}.yt-native .yt-play{display:none}.yt-hit{position:absolute;inset:0;z-index:1;margin:0;padding:0;border:0;background:transparent;cursor:pointer}.yt-ctl{position:absolute;left:clamp(10px,2vw,18px);bottom:clamp(10px,2vw,18px);z-index:3;display:flex;gap:8px;opacity:0;transform:translateY(6px);transition:opacity .25s ease,transform .25s ease}.yt-live:hover .yt-ctl,.yt-ctl:focus-within,.yt-live.yt-touch .yt-ctl{opacity:1;transform:none}.yt-hit,.yt-ctl{display:none}.yt-live:not(.yt-wait):not(.yt-paused):not(.yt-native) .yt-hit{display:block}.yt-live:not(.yt-wait):not(.yt-native) .yt-ctl{display:flex}.yt-ctl button{width:44px;height:44px;display:grid;place-items:center;margin:0;padding:0;border:var(--line,1.5px solid #121212);border-radius:50%;background:var(--yellow,#FED012);color:var(--ink,#121212);box-shadow:0 2px 0 var(--ink,#121212);cursor:pointer}.yt-ctl button svg{width:20px;height:20px;display:block}.yt-ctl button:focus-visible{outline:3px solid var(--blue,#519EF5);outline-offset:2px}.yt-bz{position:absolute;left:50%;top:50%;z-index:1;width:68px;height:68px;margin:-34px 0 0 -34px;display:grid;place-items:center;border:var(--line,1.5px solid #121212);border-radius:50%;background:var(--yellow,#FED012);color:var(--ink,#121212);box-shadow:0 3px 0 var(--ink,#121212);pointer-events:none;opacity:0;transform:scale(.9);transition:opacity .3s ease,transform .3s ease}.yt-bz svg{width:26px;height:26px}.yt-live.yt-bzon .yt-bz{opacity:1;transform:none}.yt-native .yt-bz{display:none}.yt-ctl .yt-i1{display:none}.yt-ctl [aria-pressed="true"] .yt-i0{display:none}.yt-ctl [aria-pressed="true"] .yt-i1{display:block}@media (prefers-reduced-motion:reduce){.yt-play,.yt-ctl,.yt-bz{transition:none}.yt-live.yt-wait .yt-cta svg{animation:none}}`;
// the player, in the page (serialised below, so plain ES5 and nothing from this module)
function ytClient() {
  var RO = (document.documentElement.lang || "").slice(0, 2) === "ro";
  var T = RO ? { play: "Pornește filmul", pause: "Pune filmul pe pauză", snd: "Sunet", ctl: "Comenzile filmului" } : { play: "Play the film", pause: "Pause the film", snd: "Sound", ctl: "Film controls" };
  var PARAMS = "%%YT_PARAMS%%";
  var SVG = function (d) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + d + "</svg>"; };
  var I_PLAY = '<path d="M7 4.5v15l12.5-7.5z" fill="currentColor"/>', I_PAUSE = '<path d="M6.5 4.5h4v15h-4zM13.5 4.5h4v15h-4z" fill="currentColor"/>';
  var I_SPK = '<path d="M3.5 9h4l5-4.5v15l-5-4.5h-4z" fill="currentColor"/>';
  var I_ON = I_SPK + '<path d="M15.5 8.5a5 5 0 0 1 0 7M18 6a8.5 8.5 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>';
  var I_OFF = I_SPK + '<path d="M15.5 9.5l5 5M20.5 9.5l-5 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>';
  var uid = 0;
  function cmd(P, func, args) { try { P.ifr.contentWindow.postMessage(JSON.stringify({ event: "command", func: func, args: args || [], id: P.id, channel: "widget" }), "*"); } catch (e) {} }
  function setState(P, st) {
    var f = P.f; P.state = st;
    // YouTube draws its own round play-state mark in the middle for ~4.2 s whenever the film starts, resumes or buffers
    // (with controls=0 too, and nothing turns it off); ours sits exactly over it for that long
    if (st === 3 || (st === 1 && P.prev !== 1)) { f.classList.add("yt-bzon"); clearTimeout(P.bzT); if (st === 1) P.bzT = setTimeout(function () { f.classList.remove("yt-bzon"); }, 5200); }
    if (st === 0 || st === 2) { clearTimeout(P.bzT); f.classList.remove("yt-bzon"); }
    P.prev = st;
    if (st === 1) { if (!P.started) noCC(P); P.started = true; f.classList.remove("yt-wait", "yt-paused", "yt-ended"); }
    else if (st === 2 && P.started) f.classList.add("yt-paused");
    else if (st === 0) { f.classList.add("yt-paused", "yt-ended"); }
    var on = st === 1 || st === 3;
    P.pp.setAttribute("aria-pressed", on ? "true" : "false");
    P.pp.setAttribute("aria-label", on ? T.pause : T.play);
    // the hand that paused it from our button finds the poster's play button under it
    if (!on && P.f.contains(document.activeElement) && document.activeElement !== P.btn && P.btn && f.classList.contains("yt-paused")) try { P.btn.focus({ preventScroll: true }); } catch (e) {}
  }
  function noCC(P) { cmd(P, "unloadModule", ["captions"]); cmd(P, "unloadModule", ["cc"]); }
  function setMuted(P, m) { P.muted = !!m; P.snd.setAttribute("aria-pressed", m ? "false" : "true"); }
  function onMsg(e) {
    if (!/^https:\/\/www\.youtube(-nocookie)?\.com$/.test(e.origin)) return;
    var d; try { d = typeof e.data === "string" ? JSON.parse(e.data) : e.data; } catch (x) { return; }
    if (!d) return;
    for (var i = 0; i < PL.length; i++) {
      var P = PL[i];
      if (!P.ifr || e.source !== P.ifr.contentWindow) continue;
      if (!P.heard) { P.heard = true; clearInterval(P.knock); cmd(P, "addEventListener", ["onStateChange"]); }
      // captions the channel switched on by default (cc_load_policy=0 does not turn those off): unloaded
      if (d.event === "onReady") { P.ready = true; noCC(P); }
      if (d.event === "onStateChange" && typeof d.info === "number") setState(P, d.info);
      if (d.event === "infoDelivery" && d.info) {
        if (typeof d.info.playerState === "number" && d.info.playerState !== P.state) setState(P, d.info.playerState);
        if (typeof d.info.muted === "boolean") setMuted(P, d.info.muted);
      }
      if (d.event === "initialDelivery" && d.info && typeof d.info.muted === "boolean") setMuted(P, d.info.muted);
    }
  }
  var PL = [];
  addEventListener("message", onMsg);
  function find(f) { for (var i = 0; i < PL.length; i++) if (PL[i].f === f) return PL[i]; return null; }
  function resume(P) {
    P.want = true; P.f.classList.remove("yt-paused");
    if (P.state === 0) cmd(P, "seekTo", [0, true]);
    cmd(P, "playVideo");
  }
  function pause(P) { P.want = false; cmd(P, "pauseVideo"); P.f.classList.add("yt-paused"); }
  function play(f) {
    if (!f) return;
    var P = find(f);
    if (P) { if (!f.classList.contains("yt-native")) resume(P); return; }
    var id = f.getAttribute("data-yt"), q = (f.getAttribute("data-q") || "").replace(/&amp;/g, "&");
    var keep = q.split("&").filter(function (kv) { return kv && !/^(rel|modestbranding|playsinline|controls|autoplay|enablejsapi)=/.test(kv); }).join("&");
    var org = location.origin && location.origin !== "null" ? "&origin=" + encodeURIComponent(location.origin) : "";
    P = { f: f, id: ++uid, state: -1, want: true, muted: false, btn: f.querySelector(".yt-play") };
    PL.push(P);
    var stage = document.createElement("div"); stage.className = "yt-stage";
    var i = document.createElement("iframe");
    i.src = "https://www.youtube-nocookie.com/embed/" + id + "?" + PARAMS + (keep ? "&" + keep : "") + "&autoplay=1&enablejsapi=1" + org;
    i.title = f.getAttribute("data-title") || T.play;
    i.setAttribute("allow", "accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share");
    i.setAttribute("referrerpolicy", "strict-origin-when-cross-origin");
    i.setAttribute("tabindex", "-1");
    stage.appendChild(i); P.ifr = i;
    var hit = document.createElement("button"); hit.type = "button"; hit.className = "yt-hit"; hit.tabIndex = -1; hit.setAttribute("aria-hidden", "true");
    var ctl = document.createElement("div"); ctl.className = "yt-ctl"; ctl.setAttribute("role", "group"); ctl.setAttribute("aria-label", T.ctl);
    ctl.innerHTML = '<button type="button" class="yt-pp" aria-pressed="false" aria-label="' + T.play + '"><span class="yt-i0">' + SVG(I_PLAY) + '</span><span class="yt-i1">' + SVG(I_PAUSE) + '</span></button><button type="button" class="yt-snd" aria-pressed="true" aria-label="' + T.snd + '"><span class="yt-i0">' + SVG(I_OFF) + '</span><span class="yt-i1">' + SVG(I_ON) + "</span></button>";
    P.pp = ctl.firstChild; P.snd = ctl.lastChild;
    var bz = document.createElement("span"); bz.className = "yt-bz"; bz.setAttribute("aria-hidden", "true"); bz.innerHTML = SVG(I_PAUSE);
    f.insertBefore(stage, f.firstChild); f.appendChild(hit); f.appendChild(bz); f.appendChild(ctl);
    f.classList.add("yt-live", "yt-wait");
    var touchT = 0, lastPtr = "mouse";
    f.addEventListener("pointerdown", function (e) { lastPtr = e.pointerType || "mouse"; if (lastPtr !== "mouse") { f.classList.add("yt-touch"); clearTimeout(touchT); touchT = setTimeout(function () { f.classList.remove("yt-touch"); }, 3000); } });
    hit.addEventListener("click", function () {
      // a tap first shows our two buttons, a second tap pauses; a click pauses
      if (lastPtr !== "mouse" && !P.tapped) { P.tapped = true; setTimeout(function () { P.tapped = false; }, 3000); return; }
      if (P.state === 1 || P.state === 3) pause(P); else resume(P);
    });
    P.pp.addEventListener("click", function () { if (P.state === 1 || P.state === 3) pause(P); else resume(P); });
    P.snd.addEventListener("click", function () { if (P.muted) { cmd(P, "unMute"); cmd(P, "setVolume", [100]); setMuted(P, false); } else { cmd(P, "mute"); setMuted(P, true); } });
    // the player answers only once it is told someone listens; it may not be ready at "load", so knock until it does
    i.addEventListener("load", function () {
      var n = 0;
      clearInterval(P.knock);
      P.knock = setInterval(function () { if (P.heard || ++n > 40) { clearInterval(P.knock); return; } try { i.contentWindow.postMessage(JSON.stringify({ event: "listening", id: P.id, channel: "widget" }), "*"); } catch (e) {} }, 150);
      // no answer: its own controls back, uncropped
      setTimeout(function () { if (!P.heard) { f.classList.add("yt-native"); f.classList.remove("yt-wait"); i.removeAttribute("tabindex"); i.src = i.src.replace("controls=0", "controls=1").replace("disablekb=1", "disablekb=0").replace("fs=0", "fs=1"); } }, 7000);
      // autoplay with sound needs the visitor's own click on this page; opened from the map it may be refused: muted then
      setTimeout(function () { if (P.heard && P.want && P.state !== 1 && P.state !== 3) { cmd(P, "mute"); setMuted(P, true); cmd(P, "playVideo"); } }, 2200);
    });
  }
  window.__ytPlay = play;
  document.addEventListener("click", function (e) { var b = e.target.closest && e.target.closest(".yt-play"); if (!b) return; e.preventDefault(); play(b.parentElement); });
}
const YT_CSS = `<style>.yt-facade{background:#111}.yt-play{position:absolute;inset:0;width:100%;height:100%;margin:0;padding:0;border:0;background:#111;cursor:pointer;display:block;overflow:hidden;font:inherit;color:inherit}.yt-play img{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover;display:block;transition:transform .6s cubic-bezier(.2,.8,.2,1)}.yt-play::after{content:"";position:absolute;inset:0;background:linear-gradient(rgba(0,0,0,0) 50%,rgba(0,0,0,.32))}.yt-cta{position:absolute;left:50%;top:50%;z-index:1;transform:translate(-50%,-50%);display:inline-flex;align-items:center;gap:12px;padding:12px 26px 14px 14px;border:var(--line,1.5px solid #121212);border-radius:999px;background:var(--yellow,#FED012);color:var(--ink,#121212);font-family:var(--font,system-ui),sans-serif;font-weight:800;font-size:var(--fs-ui,18px);line-height:1.05;text-align:left;box-shadow:0 3px 0 var(--ink,#121212);transition:transform .2s cubic-bezier(.2,.8,.2,1)}.yt-cta svg{flex:none;width:44px;height:44px}.yt-src{display:block;font-weight:600;font-size:.74em;opacity:.72;margin-top:3px}.yt-play:hover .yt-cta,.yt-play:focus-visible .yt-cta{transform:translate(-50%,-50%) scale(1.05)}.yt-play:hover img{transform:scale(1.02)}.yt-play:focus-visible{outline:3px solid var(--blue,#519EF5);outline-offset:-3px}@media (max-width:560px){.yt-cta{gap:9px;padding:8px 18px 9px 8px;font-size:15px}.yt-cta svg{width:34px;height:34px}}@media (prefers-reduced-motion:reduce){.yt-play img,.yt-cta{transition:none}}${YT_CSS2}</style>
<script>(${ytClient.toString().replace("%%YT_PARAMS%%", YT_PARAMS)})();</script>`;
const PLAY_SVG = `<svg viewBox="0 0 44 44" aria-hidden="true"><circle cx="22" cy="22" r="21" fill="#121212"/><path d="M17.5 13.5v17l13.5-8.5z" fill="#fff"/></svg>`;

/**
 * Replace every YouTube iframe of a page with the facade. `poster(id)` returns { src, w, h } of a local picture, or
 * null (the facade then shows the play button on black).
 */
export function ytFacade(html, poster) {
  let n = 0;
  html = html.replace(/(<div class="film-frame">)?<iframe\b([^>]*?)\bsrc="https:\/\/www\.youtube(?:-nocookie)?\.com\/embed\/([\w-]+)(?:\?([^"]*))?"([^>]*)><\/iframe>/g, (m, ff, a, id, q, b) => {
    const title = /\btitle="([^"]*)"/.exec(a + b)?.[1] || "";
    const p = poster(id);
    n++;
    const img = p ? `<img src="${p.src}" alt=""${p.w ? ` width="${p.w}" height="${p.h}"` : ""} decoding="async"${n === 1 ? ' fetchpriority="high"' : ' loading="lazy"'}>` : "";
    const btn = `<button type="button" class="yt-play" aria-label="Play the film">${img}<span class="yt-cta">${PLAY_SVG}<span>Play the film<span class="yt-src">from YouTube</span></span></span></button>`;
    const data = `data-yt="${id}" data-q="${q || ""}" data-title="${title}"`;
    // inside the case pages' film frame the frame stays (its own closing tag follows); anywhere else the facade is its own 16:9 box
    return ff ? `<div class="film-frame yt-facade" ${data}>${btn}` : `<div class="yt-facade" style="position:relative;aspect-ratio:16/9" ${data}>${btn}</div>`;
  });
  // r138d: the Two Minutes film (site/render.mjs, a .yt poster that site/site.js used to swap for a plain player) gets
  // the same chromeless player: the poster stays, the click goes to window.__ytPlay
  html = html.replace(/<div class="yt" data-id="([\w-]+)"><button class="yt-play" aria-label="([^"]*)"/g, (m, id, label) => {
    n++;
    return `<div class="yt yt-facade" style="position:relative" data-id="${id}" data-yt="${id}" data-q="" data-title="${label.replace(/^Play the /, "")}"><button class="yt-play" aria-label="${label}"`;
  });
  return n ? html.replace("</head>", `${YT_CSS}\n</head>`) : html;
}
