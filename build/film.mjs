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
const YT_CSS = `<style>.yt-facade{background:#111}.yt-play{position:absolute;inset:0;width:100%;height:100%;margin:0;padding:0;border:0;background:#111;cursor:pointer;display:block;overflow:hidden;font:inherit;color:inherit}.yt-play img{position:absolute;inset:0;width:100%;height:100%;max-width:none;object-fit:cover;display:block;transition:transform .6s cubic-bezier(.2,.8,.2,1)}.yt-play::after{content:"";position:absolute;inset:0;background:linear-gradient(rgba(0,0,0,0) 50%,rgba(0,0,0,.32))}.yt-cta{position:absolute;left:50%;top:50%;z-index:1;transform:translate(-50%,-50%);display:inline-flex;align-items:center;gap:12px;padding:12px 26px 14px 14px;border:var(--line,1.5px solid #121212);border-radius:999px;background:var(--yellow,#FED012);color:var(--ink,#121212);font-family:var(--font,system-ui),sans-serif;font-weight:800;font-size:var(--fs-ui,18px);line-height:1.05;text-align:left;box-shadow:0 3px 0 var(--ink,#121212);transition:transform .2s cubic-bezier(.2,.8,.2,1)}.yt-cta svg{flex:none;width:44px;height:44px}.yt-src{display:block;font-weight:600;font-size:.74em;opacity:.72;margin-top:3px}.yt-play:hover .yt-cta,.yt-play:focus-visible .yt-cta{transform:translate(-50%,-50%) scale(1.05)}.yt-play:hover img{transform:scale(1.02)}.yt-play:focus-visible{outline:3px solid var(--blue,#519EF5);outline-offset:-3px}@media (max-width:560px){.yt-cta{gap:9px;padding:8px 18px 9px 8px;font-size:15px}.yt-cta svg{width:34px;height:34px}}@media (prefers-reduced-motion:reduce){.yt-play img,.yt-cta{transition:none}}</style>
<script>(function(){function play(f){if(!f||f.querySelector("iframe"))return;var q=f.getAttribute("data-q")||"",i=document.createElement("iframe");i.src="https://www.youtube-nocookie.com/embed/"+f.getAttribute("data-yt")+"?"+(q?q+"&":"")+"autoplay=1&enablejsapi=1";i.title=f.getAttribute("data-title")||"";i.setAttribute("allow","accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; web-share");i.setAttribute("referrerpolicy","strict-origin-when-cross-origin");i.setAttribute("allowfullscreen","");var b=f.querySelector(".yt-play");i.addEventListener("load",function(){if(b)b.remove();try{i.focus()}catch(e){}});f.appendChild(i);setTimeout(function(){if(b&&b.parentNode)b.remove()},4000)}window.__ytPlay=play;document.addEventListener("click",function(e){var b=e.target.closest&&e.target.closest(".yt-play");if(!b)return;e.preventDefault();play(b.parentElement)})})();</script>`;
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
  return n ? html.replace("</head>", `${YT_CSS}\n</head>`) : html;
}
