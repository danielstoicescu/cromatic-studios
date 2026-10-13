// r134h: Google Analytics 4, only after a yes. A small card in the corner asks once (EN or RO, from <html lang>);
// nothing from Google loads before the visitor accepts, and "Cookies" in any page can reopen it (data-cookies).
// Pages shown inside the map (html.embed / ?embed=1) never ask (the map around them already did) but count when allowed.
// Events: generate_lead (boarding pass sent), form_start, boarding_open, email_click, phone_click, language_switch,
// open_normal_website, map_place_open {place}, world_change {world}, vehicle_select {vehicle}, mode_switch {to},
// stop_view {place, mode}, video_sound_on {page},
// open_drive_mode, case_study_click. Google Tag Manager (GTM_ID) loads after the same yes, for future tags (pixels,
// ads); GA4 stays here, so it must not be added again as a GA4 tag inside GTM (it would count every visit twice).
// r136: the card links the privacy policy (/privacy/, /ro/confidentialitate/).
export function consentSnippet(GA_ID, GTM_ID = "") {
  if (!GA_ID) return "";
  const css = `#cz-ck{position:fixed;left:50%;bottom:16px;z-index:2147483000;box-sizing:border-box;width:min(460px,calc(100vw - 24px));display:flex;flex-direction:column;align-items:center;text-align:center;gap:4px;padding:18px 22px 20px;border-radius:24px;background:#fff;color:#0d0c09;border:2.5px solid #0d0c09;box-shadow:0 14px 40px rgba(13,12,9,.2);font:500 15px/1.4 CromaticSans,"Darker Grotesque",system-ui,sans-serif;transform:translate(-50%,16px);opacity:0;transition:transform .45s cubic-bezier(.2,.8,.2,1),opacity .45s}
#cz-ck.on{transform:translate(-50%,0);opacity:1}
#cz-ck .ck-cup{width:46px;height:46px;margin-bottom:2px;background:url(/cup-spin.png) 0 0/2400% 100%;animation:czck 2.25s steps(24,jump-none) infinite}
#cz-ck b{display:block;font:800 19px/1.2 CromaticSans,system-ui,sans-serif;letter-spacing:-.01em;margin:0}
#cz-ck p{margin:2px 0 0;max-width:34ch;color:#3d3a34;font-size:15px;line-height:1.4;text-wrap:balance}
#cz-ck p a{color:inherit;text-decoration:underline;text-underline-offset:2px}
#cz-ck .ck-row{display:flex;justify-content:center;flex-wrap:wrap;gap:10px;margin-top:14px;width:100%}
#cz-ck button{all:unset;box-sizing:border-box;cursor:pointer;min-width:132px;text-align:center;padding:12px 20px;border-radius:999px;border:2px solid #0d0c09;font:800 15px/1 CromaticSans,system-ui,sans-serif;white-space:nowrap;transition:transform .2s}
#cz-ck button:hover{transform:translateY(-1px)}
#cz-ck .ck-yes{background:#FED012}
#cz-ck .ck-no{background:#fff}
#cz-ck button:focus-visible{outline:3px solid #119BFE;outline-offset:2px}
@keyframes czck{to{background-position:100% 0}}
@media (prefers-reduced-motion:reduce){#cz-ck{transition:none}#cz-ck .ck-cup{animation:none}}
@media (max-width:600px){#cz-ck{bottom:12px;width:calc(100vw - 24px);padding:16px 16px 18px}#cz-ck .ck-row{flex-wrap:nowrap}#cz-ck button{flex:1;min-width:0}}
html.embed #cz-ck,body.map-boarding #cz-ck,body.modal-open #cz-ck,body.scf-open #cz-ck{display:none}`;
  const js = `(function(){var ID=${JSON.stringify(GA_ID)},GTM=${JSON.stringify(GTM_ID)},K="cz-consent";
var EMB=/[?&]embed=1/.test(location.search)||document.documentElement.classList.contains("embed");
function get(){try{return localStorage.getItem(K)}catch(e){var m=document.cookie.match(/(?:^|; )cz-consent=(\\w+)/);return m&&m[1]}}
function set(v){try{localStorage.setItem(K,v)}catch(e){}document.cookie="cz-consent="+v+";path=/;max-age=15552000;SameSite=Lax"}
function ga(){if(window.__czGA)return;window.__czGA=1;window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};
gtag("consent","default",{ad_storage:"denied",ad_user_data:"denied",ad_personalization:"denied",analytics_storage:"granted"});
gtag("js",new Date());var go=function(){if(go.d)return;go.d=1;gtag("config",ID,{anonymize_ip:true});var s=document.createElement("script");s.async=1;s.src="https://www.googletagmanager.com/gtag/js?id="+ID;document.head.appendChild(s);
if(GTM){dataLayer.push({"gtm.start":new Date().getTime(),event:"gtm.js"});var g=document.createElement("script");g.async=1;g.src="https://www.googletagmanager.com/gtm.js?id="+GTM;document.head.appendChild(g)}};
/* visits from the studio's own network are marked internal (GA4 data filter) */
try{fetch("/api/ctx",{cache:"no-store"}).then(function(r){return r.json()}).then(function(j){if(j&&j.internal)gtag("set",{traffic_type:"internal"});go()}).catch(go);setTimeout(go,1200)}catch(e){go()}}
function ask(){if(document.getElementById("cz-ck"))return;var ro=(document.documentElement.lang||"").slice(0,2)==="ro";
var d=document.createElement("div");d.id="cz-ck";d.setAttribute("role","dialog");d.setAttribute("aria-label",ro?"Cookie-uri":"Cookies");
d.innerHTML='<span class="ck-cup" aria-hidden="true"></span><b>'+(ro?"Un cookie la cafea?":"A cookie with your coffee?")+'</b><p>'+(ro?"Statistici de vizitare prin Google Analytics, ca să știm ce merge. ":"Visit statistics with Google Analytics, so we know what works. ")+'<a href="'+(ro?"/ro/confidentialitate/":"/privacy/")+'">'+(ro?"Confidențialitate":"Privacy")+'</a></p><div class="ck-row"><button type="button" class="ck-yes">'+(ro?"Da, sigur":"Sure")+'</button><button type="button" class="ck-no">'+(ro?"Nu, mersi":"No, thanks")+"</button></div>";
document.body.appendChild(d);requestAnimationFrame(function(){requestAnimationFrame(function(){d.classList.add("on")})});
d.querySelector(".ck-yes").onclick=function(){set("yes");d.remove();ga()};d.querySelector(".ck-no").onclick=function(){set("no");d.remove()}}
document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("[data-cookies]");if(a){e.preventDefault();ask()}});
var ONCE={};function ev(n,p){p=p||{};if(p.once){if(ONCE[p.once])return;ONCE[p.once]=1;delete p.once}if(window.__czGA&&window.gtag)gtag("event",n,p)}window.czEvent=ev;
document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("a,button");if(!a)return;var h=a.getAttribute("href")||"",t=(a.textContent||"").trim().slice(0,60);
if(/^mailto:/.test(h))ev("email_click",{link_text:t});else if(/^tel:/.test(h))ev("phone_click",{link_text:t});
else if(a.classList.contains("lang-sw"))ev("language_switch",{to:h});
else if(/^\\/(site|ro)\\/?$/.test(h))ev("open_normal_website",{link_text:t});
else if(/^\\/(\\?drive|\\?map|\\/?$)/.test(h)&&a.closest("header,nav,.map-top,.drive-btn"))ev("open_drive_mode",{link_text:t});
else if(/\\/(work|proiecte)\\//.test(h))ev("case_study_click",{case_path:h.split("?")[0]});
else if(/drive|ride/i.test(a.className||"")&&/drive/i.test(t))ev("open_drive_mode",{link_text:t})},true);
document.addEventListener("click",function(e){var b=e.target.closest&&e.target.closest(".vs-btn");if(b&&b.getAttribute("aria-pressed")!=="true")ev("video_sound_on",{page:location.pathname})},true);
document.addEventListener("focusin",function(e){var f=e.target.closest&&e.target.closest("form, .bp-form, .mapcard.contact");if(f)ev("form_start",{form:"boarding_pass",page:location.pathname,once:"form_start"})});
if(window.fetch){var f0=window.fetch;window.fetch=function(u,o){var r=f0.apply(this,arguments);try{if(String(u).indexOf("/api/boarding")>-1&&o&&o.method==="POST")r.then(function(x){if(x.ok)ev("generate_lead",{form:"boarding_pass",page:location.pathname})})}catch(e){}return r}}
var v=get();if(v==="yes")ga();else if(!EMB&&v!=="no"){if(document.readyState==="complete")setTimeout(ask,1200);else addEventListener("load",function(){setTimeout(ask,1200)})}})();`;
  return `<style id="cz-ck-css">${css}</style>\n<script>${js}</script>`;
}
