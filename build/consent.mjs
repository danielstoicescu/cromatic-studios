// r134h: Google Analytics 4, only after a yes. A small card in the corner asks once (EN or RO, from <html lang>);
// nothing from Google loads before the visitor accepts, and "Cookies" in any page can reopen it (data-cookies).
// Pages shown inside the map (html.embed / ?embed=1) never ask (the map around them already did) but count when allowed.
// Events: generate_lead (boarding pass sent), form_start, boarding_open, email_click, phone_click, language_switch,
// open_normal_website, map_place_open {place}, world_change {world}, vehicle_select {vehicle}, mode_switch {to},
// stop_view {place, mode}, video_sound_on {page},
// open_drive_mode, case_study_click. Google Tag Manager (GTM_ID) loads after the same yes, for future tags (pixels,
// ads); GA4 stays here, so it must not be added again as a GA4 tag inside GTM (it would count every visit twice).
// r136: the card links the privacy policy (/privacy/, /ro/confidentialitate/).
// r139c: that link is built with DOM calls (no '+'-glued href in the source, audit N50); the footer's "Cookies" link
// (data-cookies, on every page) opens the card even inside the map's frame, where it otherwise never asks.
// r149 (Cristian, OpenAI Ads; Daniel: "let's add the pixel"): the OpenAI Ads measurement pixel loads after the same
// yes, and a sent boarding pass is measured as "lead_created" (only that it happened, none of what was written). The
// card now says "ad measurement" (Daniel: without naming OpenAI there; the privacy page names it), so a yes given
// before ("yes") keeps Google Analytics and the card asks once more; the new yes is "yes2". The Conversions API
// (server side) needs a secret key set in the server's environment by Daniel or Cristian: not wired.
// r196 (Daniel: on phones the card covered the bottom third until answered): on a phone it is a slim card, the same
// copy and the same Sure / No, thanks, the buttons stacked at its right; on the map it sits under the top controls
// (the views, the sound) instead of over the joystick, the zoom and the place cards at the bottom. The consent logic
// is unchanged (GA and the OpenAI pixel only after "Sure"); a desktop keeps the card as it was.
// beta 3.64 (Daniel: "make sure we record everyone", the mini-game): a page that asks in its own way (the game inside
// the map's frame, where this card never shows) decides through window.czConsent.decide("yes2" | "no"): the same key,
// the same Consent Mode calls, GA and the pixel only after a yes. Every decision (this card's, czConsent's, or one made
// in another tab or frame of the site: the storage event) is announced as a "cz-consent" event on window, and a card
// still open elsewhere (the map's, under the game's frame) closes: the map and the game always agree.
export function consentSnippet(GA_ID, GTM_ID = "", OAI_PIXEL = "") {
  if (!GA_ID) return "";
  const css = `#cz-ck{position:fixed;left:50%;bottom:16px;z-index:2147483000;box-sizing:border-box;width:min(460px,calc(100vw - 24px));display:flex;flex-direction:column;align-items:center;text-align:center;gap:4px;padding:18px 22px 20px;border-radius:24px;background:#fff;color:#0d0c09;border:2.5px solid #0d0c09;box-shadow:0 14px 40px rgba(13,12,9,.2);font:500 15px/1.4 CromaticSans,"Darker Grotesque",system-ui,sans-serif;transform:translate(-50%,16px);opacity:0;transition:transform .45s cubic-bezier(.2,.8,.2,1),opacity .45s}
#cz-ck.on{transform:translate(-50%,0);opacity:1}
#cz-ck .ck-cup{width:46px;height:46px;margin-bottom:2px;background:url(/cup-spin.png) 0 0/2400% 100%;animation:czck 2.25s steps(24,jump-none) infinite}
#cz-ck b{display:block;font:800 19px/1.2 CromaticSans,system-ui,sans-serif;letter-spacing:-.01em;margin:0}
#cz-ck p{margin:2px 0 0;max-width:34ch;color:#3d3a34;font-size:15px;line-height:1.4;text-wrap:balance}
#cz-ck p a{all:unset;cursor:pointer;color:inherit;text-decoration:underline;text-underline-offset:2px}#cz-ck p a:focus-visible{outline:3px solid #119BFE;outline-offset:2px}
#cz-ck .ck-row{display:flex;justify-content:center;flex-wrap:wrap;gap:10px;margin-top:14px;width:100%}
#cz-ck button{all:unset;box-sizing:border-box;cursor:pointer;min-width:132px;text-align:center;padding:12px 20px;border-radius:999px;border:2px solid #0d0c09;font:800 15px/1 CromaticSans,system-ui,sans-serif;white-space:nowrap;transition:transform .2s}
#cz-ck button:hover{transform:translateY(-1px)}
#cz-ck .ck-yes{background:#FED012}
#cz-ck .ck-no{background:#fff}
#cz-ck button:focus-visible{outline:3px solid #119BFE;outline-offset:2px}
@keyframes czck{to{background-position:100% 0}}
@media (prefers-reduced-motion:reduce){#cz-ck{transition:none}#cz-ck .ck-cup{animation:none}}
@media (max-width:600px){#cz-ck{display:grid;grid-template-columns:auto 1fr auto;grid-template-areas:"cup t row" "p p row";align-items:center;column-gap:10px;row-gap:2px;left:10px;right:10px;bottom:calc(10px + env(safe-area-inset-bottom));width:auto;text-align:left;padding:10px 10px 11px 12px;border-radius:18px;border-width:2px;box-shadow:0 8px 24px rgba(13,12,9,.18);transform:translateY(12px)}#cz-ck.on{transform:none}#cz-ck .ck-cup{grid-area:cup;width:24px;height:24px;margin:0}#cz-ck b{grid-area:t;font-size:15px}#cz-ck p{grid-area:p;max-width:none;margin:0;font-size:12.5px;line-height:1.3;text-wrap:pretty}#cz-ck .ck-row{grid-area:row;flex-direction:column;flex-wrap:nowrap;gap:6px;margin:0;width:auto}#cz-ck button{min-width:0;padding:9px 14px;font-size:14px;border-width:1.5px}
body.map-mode #cz-ck{bottom:auto;top:calc(186px + env(safe-area-inset-top));transform:translateY(-12px)}body.map-mode #cz-ck.on{transform:none}}
html.embed #cz-ck,body.map-boarding #cz-ck,body.modal-open #cz-ck,body.scf-open #cz-ck{display:none}
html.embed #cz-ck.ck-ask{display:flex}`;
  const js = `(function(){var ID=${JSON.stringify(GA_ID)},GTM=${JSON.stringify(GTM_ID)},K="cz-consent",OAI=${JSON.stringify(OAI_PIXEL)};
var ONB=/[?&]onb(&|$)/.test(location.search);/* r140: the city inside /onboarding/ counts nothing, asks nothing */
var EMB=ONB||/[?&]embed=1/.test(location.search)||document.documentElement.classList.contains("embed");
function get(){try{return localStorage.getItem(K)}catch(e){var m=document.cookie.match(/(?:^|; )cz-consent=(\\w+)/);return m&&m[1]}}
function set(v){try{localStorage.setItem(K,v)}catch(e){}document.cookie="cz-consent="+v+";path=/;max-age=15552000;SameSite=Lax"}
/* beta 3.60 r222c: on the 3D map ("/", English UI) a visitor who reads the website in Romanian gets the card in Romanian (cz-lang, build/footer.mjs) */
function lsRo(){try{return localStorage.getItem("cz-lang")==="ro"}catch(e){return false}}
function told(v){try{window.dispatchEvent(new CustomEvent("cz-consent",{detail:v}))}catch(e){}}
function ga(){if(window.__czGA)return;window.__czGA=1;window.dataLayer=window.dataLayer||[];window.gtag=function(){dataLayer.push(arguments)};
gtag("consent","default",{ad_storage:"denied",ad_user_data:"denied",ad_personalization:"denied",analytics_storage:"granted"});
gtag("js",new Date());var go=function(){if(go.d)return;go.d=1;gtag("config",ID,{anonymize_ip:true});var s=document.createElement("script");s.async=1;s.src="https://www.googletagmanager.com/gtag/js?id="+ID;document.head.appendChild(s);
if(GTM){dataLayer.push({"gtm.start":new Date().getTime(),event:"gtm.js"});var g=document.createElement("script");g.async=1;g.src="https://www.googletagmanager.com/gtm.js?id="+GTM;document.head.appendChild(g)}};
/* visits from the studio's own network are marked internal (GA4 data filter) */
try{fetch("/api/ctx",{cache:"no-store"}).then(function(r){return r.json()}).then(function(j){if(j&&j.internal)gtag("set",{traffic_type:"internal"});go()}).catch(go);setTimeout(go,1200)}catch(e){go()}}
function oai(){if(!OAI||window.__czOAI)return;window.__czOAI=1;window.oaiq=window.oaiq||function(){(window.oaiq.q=window.oaiq.q||[]).push(arguments)};oaiq("init",{pixelId:OAI});var s=document.createElement("script");s.async=1;s.src="https://bzrcdn.openai.com/sdk/oaiq.min.js";document.head.appendChild(s)}
function ask(force){if(document.getElementById("cz-ck"))return;var ro=(document.documentElement.lang||"").slice(0,2)==="ro"||(location.pathname==="/"&&lsRo());
var d=document.createElement("div");d.id="cz-ck";d.setAttribute("role","dialog");d.setAttribute("aria-label",ro?"Cookie-uri":"Cookies");
d.innerHTML='<span class="ck-cup" aria-hidden="true"></span><b>'+(ro?"Un cookie la cafea?":"A cookie with your coffee?")+'</b><p>'+(ro?"Statistici de vizitare prin Google Analytics și măsurarea reclamelor, ca să știm ce merge. ":"Visit statistics with Google Analytics and ad measurement, so we know what works. ")+'</p><div class="ck-row"><button type="button" class="ck-yes">'+(ro?"Da, sigur":"Sure")+'</button><button type="button" class="ck-no">'+(ro?"Nu, mersi":"No, thanks")+"</button></div>";
/* r139c (audit N50): the privacy link is made with DOM calls, so the page source holds no half-built href that crawlers report as a 404 */
var pl=document.createElement("a");pl.setAttribute("href",ro?"/ro/confidentialitate/":"/privacy/");pl.textContent=ro?"Confidențialitate":"Privacy";d.querySelector("p").appendChild(pl);
if(force)d.classList.add("ck-ask");
document.body.appendChild(d);requestAnimationFrame(function(){requestAnimationFrame(function(){d.classList.add("on")})});
d.querySelector(".ck-yes").onclick=function(){set("yes2");d.remove();ga();oai();told("yes2")};d.querySelector(".ck-no").onclick=function(){set("no");d.remove();told("no")}}
window.czConsent={get:get,ro:lsRo,decide:function(v){if(v!=="yes2"&&v!=="no")return;set(v);var c=document.getElementById("cz-ck");if(c)c.remove();if(v==="yes2"&&!ONB){ga();oai()}told(v)}};
addEventListener("storage",function(e){if(e.key!==K||(e.newValue!=="yes2"&&e.newValue!=="no"))return;var c=document.getElementById("cz-ck");if(c)c.remove();if(e.newValue==="yes2"&&!ONB){ga();oai()}told(e.newValue)});
document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("[data-cookies]");if(a){e.preventDefault();ask(true)}});
var ONCE={};function ev(n,p){p=p||{};if(p.once){if(ONCE[p.once])return;ONCE[p.once]=1;delete p.once}if(window.__czGA&&window.gtag)gtag("event",n,p)}window.czEvent=ev;
document.addEventListener("click",function(e){var a=e.target.closest&&e.target.closest("a,button");if(!a)return;var h=a.getAttribute("href")||"",t=(a.textContent||"").trim().slice(0,60);
if(/^mailto:/.test(h))ev("email_click",{link_text:t});else if(/^tel:/.test(h))ev("phone_click",{link_text:t});
else if(a.classList.contains("lang-sw")||a.closest(".czf-lang"))ev("language_switch",{to:h});
else if(/^\\/(site|ro)\\/?$/.test(h))ev("open_normal_website",{link_text:t});
else if(/^\\/(\\?drive|\\?map|\\/?$)/.test(h)&&a.closest("header,nav,.map-top,.drive-btn"))ev("open_drive_mode",{link_text:t});
else if(/\\/(work|proiecte)\\//.test(h))ev("case_study_click",{case_path:h.split("?")[0]});
else if(/drive|ride/i.test(a.className||"")&&/drive/i.test(t))ev("open_drive_mode",{link_text:t})},true);
document.addEventListener("click",function(e){var b=e.target.closest&&e.target.closest(".vs-btn");if(b&&b.getAttribute("aria-pressed")!=="true")ev("video_sound_on",{page:location.pathname})},true);
document.addEventListener("focusin",function(e){var f=e.target.closest&&e.target.closest("form, .bp-form, .mapcard.contact");if(f)ev("form_start",{form:"boarding_pass",page:location.pathname,once:"form_start"})});
if(window.fetch){var f0=window.fetch;window.fetch=function(u,o){var r=f0.apply(this,arguments);try{if(String(u).indexOf("/api/boarding")>-1&&o&&o.method==="POST")r.then(function(x){if(x.ok&&window.__czOAI&&window.oaiq){var m=function(id){try{oaiq("measure","lead_created",{type:"customer_action"},{event_id:id})}catch(e){}};/* r149b: the server reports the same lead as "lead_"+ref, so the browser uses that id too (OpenAI counts it once) */try{x.clone().json().then(function(j){m(j&&j.ref?"lead_"+j.ref:"lead_"+Date.now().toString(36))},function(){m("lead_"+Date.now().toString(36))})}catch(e){m("lead_"+Date.now().toString(36))}}if(x.ok)ev("generate_lead",{form:"boarding_pass",page:location.pathname})})}catch(e){}return r}}
var v=get();if(v==="yes2"&&!ONB){ga();oai()}else if(v==="yes"&&!ONB){ga();if(OAI&&!EMB){if(document.readyState==="complete")setTimeout(ask,1200);else addEventListener("load",function(){setTimeout(ask,1200)})}}else if(!EMB&&v!=="no"){if(document.readyState==="complete")setTimeout(ask,1200);else addEventListener("load",function(){setTimeout(ask,1200)})}})();`;
  return `<style id="cz-ck-css">${css}</style>\n<script>${js}</script>`;
}
