// r134h: Google Analytics 4, only after a yes. A small card in the corner asks once (EN or RO, from <html lang>);
// nothing from Google loads before the visitor accepts, and "Cookies" in any page can reopen it (data-cookies).
// Pages shown inside the map (html.embed / ?embed=1) never ask (the map around them already did) but count when allowed.
// Events: generate_lead (boarding pass sent), email_click, phone_click, language_switch, open_normal_website,
// open_drive_mode, case_study_click.
export function consentSnippet(GA_ID) {
  if (!GA_ID) return "";
  const css = `#cz-ck{position:fixed;left:16px;bottom:16px;z-index:2147483000;box-sizing:border-box;width:min(372px,calc(100vw - 24px));display:grid;grid-template-columns:40px 1fr;gap:2px 14px;align-items:start;padding:16px 18px 16px 16px;border-radius:20px;background:#fff;color:#0d0c09;border:2.5px solid #0d0c09;box-shadow:0 12px 34px rgba(13,12,9,.18);font:500 15px/1.4 CromaticSans,"Darker Grotesque",system-ui,sans-serif;text-align:left;transform:translateY(14px);opacity:0;transition:transform .4s cubic-bezier(.2,.8,.2,1),opacity .4s}
#cz-ck.on{transform:none;opacity:1}
#cz-ck .ck-cup{grid-row:1/4;width:40px;height:40px;margin-top:2px;background:url(/cup-spin.png) 0 0/2400% 100%;animation:czck 2.25s steps(24,jump-none) infinite}
#cz-ck b{display:block;font:800 17px/1.2 CromaticSans,system-ui,sans-serif;letter-spacing:-.01em;margin:0}
#cz-ck p{margin:2px 0 0;color:#3d3a34;font-size:14.5px;line-height:1.4;text-wrap:pretty}
#cz-ck .ck-row{display:flex;gap:8px;margin-top:12px}
#cz-ck button{all:unset;box-sizing:border-box;cursor:pointer;padding:10px 16px;border-radius:999px;border:2px solid #0d0c09;font:800 14px/1 CromaticSans,system-ui,sans-serif;white-space:nowrap;transition:transform .2s}
#cz-ck button:hover{transform:translateY(-1px)}
#cz-ck .ck-yes{background:#FED012}
#cz-ck .ck-no{background:#fff}
#cz-ck button:focus-visible{outline:3px solid #119BFE;outline-offset:2px}
@keyframes czck{to{background-position:100% 0}}
@media (prefers-reduced-motion:reduce){#cz-ck{transition:none}#cz-ck .ck-cup{animation:none}}
@media (max-width:480px){#cz-ck{left:12px;bottom:12px;grid-template-columns:34px 1fr;gap:2px 12px;padding:14px 14px 14px 12px}#cz-ck .ck-cup{width:34px;height:34px}#cz-ck .ck-row{flex-wrap:wrap}}
html.embed #cz-ck{display:none}`;
  const js = `(function(){var ID=${JSON.stringify(GA_ID)},K="cz-consent";
var EMB=/[?&]embed=1/.test(location.search)||document.documentElement.classList.contains("embed");
function get(){try{return localStorage.getItem(K)}catch(e){var m=document.cookie.match(/(?:^|; )cz-consent=(\\w+)/);return m&&m[1]}}
function set(v){try{localStorage.setItem(K,v)}catch(e){}document.cookie="cz-consent="+v+";path=/;max-age=15552000;SameSite=Lax"}
function ga(){if(window.__czGA)return;window.__czGA=1;window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};
gtag("consent","default",{ad_storage:"denied",ad_user_data:"denied",ad_personalization:"denied",analytics_storage:"granted"});
gtag("js",new Date());gtag("config",ID,{anonymize_ip:true});var s=document.createElement("script");s.async=1;s.src="https://www.googletagmanager.com/gtag/js?id="+ID;document.head.appendChild(s)}
function ask(){if(document.getElementById("cz-ck"))return;var ro=(document.documentElement.lang||"").slice(0,2)==="ro";
var d=document.createElement("div");d.id="cz-ck";d.setAttribute("role","dialog");d.setAttribute("aria-label",ro?"Cookie-uri":"Cookies");
d.innerHTML='<span class="ck-cup" aria-hidden="true"></span><b>'+(ro?"Un cookie la cafea?":"A cookie with your coffee?")+'</b><p>'+(ro?"Doar statistici anonime (Google Analytics), ca să știm ce merge.":"Only anonymous stats (Google Analytics), so we know what works.")+'</p><div class="ck-row"><button type="button" class="ck-yes">'+(ro?"Da, sigur":"Sure")+'</button><button type="button" class="ck-no">'+(ro?"Nu, mersi":"No, thanks")+"</button></div>";
document.body.appendChild(d);requestAnimationFrame(function(){requestAnimationFrame(function(){d.classList.add("on")})});
d.querySelector(".ck-yes").onclick=function(){set("yes");d.remove();ga()};d.querySelector(".ck-no").onclick=function(){set("no");d.remove()}}
document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("[data-cookies]");if(a){e.preventDefault();ask()}});
function ev(n,p){if(window.__czGA&&window.gtag)gtag("event",n,p||{})}
document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("a,button");if(!a)return;var h=a.getAttribute("href")||"",t=(a.textContent||"").trim().slice(0,60);
if(/^mailto:/.test(h))ev("email_click",{link_text:t});else if(/^tel:/.test(h))ev("phone_click",{link_text:t});
else if(a.classList.contains("lang-sw"))ev("language_switch",{to:h});
else if(/^\\/(site|ro)\\/?$/.test(h))ev("open_normal_website",{link_text:t});
else if(/^\\/(\\?drive|\\?map|\\/?$)/.test(h)&&a.closest("header,nav,.map-top,.drive-btn"))ev("open_drive_mode",{link_text:t});
else if(/\\/(work|proiecte)\\//.test(h))ev("case_study_click",{case_path:h.split("?")[0]});
else if(/drive|ride/i.test(a.className||"")&&/drive/i.test(t))ev("open_drive_mode",{link_text:t})},true);
if(window.fetch){var f0=window.fetch;window.fetch=function(u,o){var r=f0.apply(this,arguments);try{if(String(u).indexOf("/api/boarding")>-1&&o&&o.method==="POST")r.then(function(x){if(x.ok)ev("generate_lead",{form:"boarding_pass",page:location.pathname})})}catch(e){}return r}}
var v=get();if(v==="yes")ga();else if(!EMB&&v!=="no"){if(document.readyState==="complete")setTimeout(ask,1200);else addEventListener("load",function(){setTimeout(ask,1200)})}})();`;
  return `<style id="cz-ck-css">${css}</style>\n<script>${js}</script>`;
}
