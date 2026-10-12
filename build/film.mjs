// r135c: the big film of a case page (Daniel): opened from the map, it starts by itself, with sound when the browser
// allows it (the visitor just clicked), muted otherwise; a film further down starts when it comes into view and
// pauses when it leaves. Whatever happens, nothing plays once the page is closed or hidden.
export const FILM_AUTO = `<script>(function(){
var EMB=/[?&]embed=1/.test(location.search);
function ytCmd(f,c){try{f.contentWindow.postMessage(JSON.stringify({event:"command",func:c,args:""}),"*")}catch(e){}}
function stopAll(){document.querySelectorAll("video").forEach(function(v){try{v.pause()}catch(e){}});document.querySelectorAll('iframe[src*="youtube"]').forEach(function(f){ytCmd(f,"pauseVideo")})}
addEventListener("pagehide",stopAll);document.addEventListener("visibilitychange",function(){if(document.hidden)stopAll()});
if(!EMB)return;
var FILMS=[];
function big(el){var r=el.getBoundingClientRect();return r.width*r.height>=innerWidth*innerHeight*0.18&&r.width>=Math.min(innerWidth*0.4,360)}
function others(el){FILMS.forEach(function(o){if(o===el)return;if(o.tagName==="VIDEO"){o.muted=true}else if(/enablejsapi=1/.test(o.src))ytCmd(o,"pauseVideo")})}
function playVideo(v){others(v);if(v.dataset.src&&!v.getAttribute("src"))v.src=v.dataset.src;v.muted=false;v.volume=1;var p=v.play();if(p&&p.catch)p.catch(function(){v.muted=true;v.play().catch(function(){})});var b=v.parentElement&&v.parentElement.querySelector(".vs-btn");if(b&&!v.muted)b.setAttribute("aria-pressed","true")}
function playYT(f){others(f);if(!/enablejsapi=1/.test(f.src)){f.src=f.src+(f.src.indexOf("?")>-1?"&":"?")+"enablejsapi=1&autoplay=1";return}ytCmd(f,"playVideo")}
function go(){
  var films=FILMS=[].slice.call(document.querySelectorAll('iframe[src*="youtube"], video')).filter(big);
  if(!films.length)return;
  var first=films[0];
  var io=new IntersectionObserver(function(es){es.forEach(function(e){var el=e.target;
    if(e.isIntersecting&&e.intersectionRatio>=0.5){if(el.tagName==="VIDEO")playVideo(el);else playYT(el)}
    else if(!e.isIntersecting||e.intersectionRatio<0.2){if(el.tagName==="VIDEO"){if(!el.loop)el.pause()}else if(/enablejsapi=1/.test(el.src))ytCmd(el,"pauseVideo")}})},{threshold:[0,0.2,0.5]});
  films.forEach(function(f){io.observe(f)});
  var r=first.getBoundingClientRect();if(r.top<innerHeight*1.1){if(first.tagName==="VIDEO")playVideo(first);else playYT(first)}
}
if(document.readyState==="complete")setTimeout(go,350);else addEventListener("load",function(){setTimeout(go,350)});
})();</script>`;
