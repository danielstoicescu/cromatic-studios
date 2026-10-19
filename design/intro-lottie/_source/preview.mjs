// Cromatic opening · writes <A|B|C>/preview.html: a standalone page (opens from disk too: the JSON is inside it) that
// plays a direction with lottie-web over a still of the map's first frame, the way the site would: the words, the
// hold that loops while the city is not ready, the handoff, the map. node preview.mjs (after build.mjs)
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const here = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.resolve(here, "..");
const handoffJs = fs.readFileSync(path.join(here, "lib/handoff.js"), "utf8");
export const DIRECTIONS = {
  A: { name: "Pastila", en: "The pill", line: "Tipografie cinetică pe hârtie milimetrică. Pastila își schimbă cuvântul, numără lumile, iar „coffee.” se deschide ca o diafragmă spre oraș." },
  B: { name: "Strada", en: "The street", line: "O stradă desenată: casa crește, primește fațadă și brand, nouă lumi trec peste ea, apoi camera se retrage și desenul aterizează pe strada reală." },
  C: { name: "Ceașca", en: "The cup", line: "O ceașcă văzută de sus, pe galbenul studioului. Latte art pentru casă, fațadă, brand; nouă cești, una rămâne; camera se scufundă în cafea, care se deschide spre oraș." }
};

for (const k of Object.keys(DIRECTIONS)) {
  const D = DIRECTIONS[k];
  const desk = fs.readFileSync(path.join(OUT, k, "desktop.json"), "utf8"), phone = fs.readFileSync(path.join(OUT, k, "phone.json"), "utf8");
  const html = page(k, D, desk, phone);
  fs.writeFileSync(path.join(OUT, k, "preview.html"), html);
  console.log(`${k}/preview.html`, Math.round(html.length / 1024) + " KB");
}

function page(k, D, desk, phone) {
  return `<!doctype html>
<html lang="ro"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>Intro ${k} · ${D.name}</title>
<meta name="description" content="Cromatic Studios, deschiderea site-ului ca Lottie: direcția ${k}, ${D.en}. Prototip, faza 1.">
<style>
:root{--y:#FED012;--ink:#000;--paper:#F2F2F2;--white:#fff;--bar:#E7E7E7}
*{box-sizing:border-box}
html,body{margin:0;height:100%;background:#1b1b1b;color:var(--ink);font:500 14px/1.3 system-ui,-apple-system,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased;overflow:hidden}
#room{position:fixed;inset:0;display:grid;place-items:center}
#stage{position:relative;overflow:hidden;background:#EEE7EC}
#stage.framed{border:3px solid #000;border-radius:28px;box-shadow:0 0 0 6px #2a2a2a}
#city{position:absolute;left:0;top:0;transform-origin:0 0;background:center/cover no-repeat;will-change:transform}
#lot{position:absolute;inset:0}
#lot svg,#lot canvas{display:block}
#done{position:absolute;left:50%;bottom:18px;translate:-50% 0;padding:10px 16px;border:2px solid #000;border-radius:999px;background:var(--white);font-weight:700;white-space:nowrap;opacity:0;transition:opacity .3s;pointer-events:none}
#done.on{opacity:1}
#bar{position:fixed;left:12px;right:12px;bottom:calc(12px + env(safe-area-inset-bottom,0px));display:flex;flex-wrap:wrap;gap:6px;align-items:center;justify-content:flex-start;pointer-events:none}
#bar>*{pointer-events:auto}
.p{appearance:none;border:2px solid #000;border-radius:999px;background:var(--white);color:#000;font:700 13px/1 system-ui,sans-serif;padding:9px 13px;cursor:pointer;white-space:nowrap}
.p:hover{background:var(--y)}
.p:focus-visible{outline:3px solid #119BFE;outline-offset:2px}
.p[aria-pressed="true"]{background:#000;color:#fff}
.tag{background:var(--y);cursor:default}
#info{font:600 12px/1 ui-monospace,Menlo,monospace;color:#fff;background:rgba(0,0,0,.55);border-radius:999px;padding:8px 11px}
#scrub{flex:1 1 160px;min-width:120px;accent-color:#FED012}
#about{position:fixed;left:12px;top:calc(12px + env(safe-area-inset-top,0px));max-width:min(520px,calc(100vw - 24px));background:var(--white);border:2px solid #000;border-radius:18px;padding:12px 14px;font-size:13px;line-height:1.4;display:none}
#about.on{display:block}
#about b{display:block;font-size:15px;margin-bottom:4px}
@media (max-width:560px){.p{padding:8px 10px;font-size:12px}#info{display:none}}
@media (prefers-reduced-motion:reduce){#done{transition:none}}
</style></head>
<body>
<div id="room"><div id="stage"><div id="city"></div><div id="lot" aria-label="Deschiderea site-ului (animație)"></div><div id="done">Aici harta devine interactivă</div></div></div>
<div id="about"><b>${k} · ${D.name} <span style="font-weight:500">(${D.en})</span></b>${D.line}<br><br>Sub animație e o imagine statică a primului cadru al hărții; pe site, acolo e orașul 3D adevărat. „Oraș lent” simulează un telefon pe care orașul e gata abia după 12 s: animația ține ultimul rând în buclă până atunci.</div>
<div id="bar">
  <span class="p tag">${k} · ${D.name}</span>
  <button class="p" id="again" type="button">Din nou</button>
  <button class="p" id="skip" type="button">Sari peste</button>
  <button class="p" id="slow" type="button" aria-pressed="false">Oraș lent (12 s)</button>
  <button class="p" id="ab" type="button">Telefon</button>
  <button class="p" id="help" type="button" aria-pressed="false">Despre</button>
  <input id="scrub" type="range" min="0" max="600" step="1" value="0" aria-label="Cadru">
  <span id="info">0.00 s</span>
</div>
<script type="application/json" id="j-desktop">${desk}</script>
<script type="application/json" id="j-phone">${phone}</script>
<script>${handoffJs}</script>
<script>
(() => {
  const $ = (s) => document.querySelector(s);
  const DATA = { desktop: JSON.parse($("#j-desktop").textContent), phone: JSON.parse($("#j-phone").textContent) };
  const RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const q = new URLSearchParams(location.search);
  // the player: lottie-web's worker build (the recommendation: it draws in a Web Worker on an OffscreenCanvas), or
  // ?r=svg for lottie-web's light SVG build. A missing worker falls back to SVG.
  let R = q.get("r") === "svg" ? "svg" : "worker";
  let ab = q.get("ab") || (innerWidth < innerHeight ? "phone" : "desktop");
  let anim = null, data = null, slow = false, cityReady = false, phase = "words", fpsN = 0, fpsT = performance.now(), fps = 0, seg0 = 0, cur = 0, gen = 0, readyT = null;
  const stage = $("#stage"), city = $("#city"), lot = $("#lot"), done = $("#done");
  const mk = (n) => data.markers.find((m) => m.cm === n);
  const loadPlayer = (r) => new Promise((res, rej) => { const s = document.createElement("script"); s.src = r === "svg" ? "../_lib/lottie_light.min.js" : "../_lib/lottie_worker.min.js"; s.onload = () => (window.lottie ? res() : rej(new Error("no lottie"))); s.onerror = rej; document.head.appendChild(s); });
  function layout() {
    const vw = innerWidth, vh = innerHeight, W = data.w, H = data.h;
    const fits = (W > H) === (vw > vh) && Math.abs(W / H - vw / vh) < 0.6;
    if (fits) { stage.className = ""; stage.style.width = vw + "px"; stage.style.height = vh + "px"; }
    else { const k = Math.min((vw - 32) / W, (vh - 110) / H); stage.className = "framed"; stage.style.width = W * k + "px"; stage.style.height = H * k + "px"; }
    city.style.backgroundImage = "url(../_lib/city-" + ab + ".jpg)";
    city.style.width = data.w + "px"; city.style.height = data.h + "px";
    $("#ab").textContent = ab === "phone" ? "Laptop" : "Telefon";
  }
  function paintCity(f = cur) { city.style.transform = cromaticHandoff.cityTransform(data, f, stage.clientWidth, stage.clientHeight); }
  // one small adapter over both builds: segments, loop, events with the absolute frame
  const seg = (a, b, loop) => { seg0 = a; if (R === "svg") anim.loop = loop; else anim.setLoop(loop); anim.playSegments([a, b], true); };
  const scrubTo = (f) => { if (seg0 !== 0) { seg0 = 0; anim.playSegments([0, data.op], true); } anim.goToAndStop(f, true); cur = f; paintCity(); };
  function load() {
    const g = ++gen;
    if (anim) { try { anim.destroy(); } catch (e) {} lot.innerHTML = ""; }
    data = DATA[ab]; layout();
    $("#scrub").max = data.op;
    anim = lottie.loadAnimation({ container: lot, renderer: R === "svg" ? "svg" : "canvas", loop: false, autoplay: false, animationData: JSON.parse(JSON.stringify(data)), rendererSettings: { preserveAspectRatio: "xMidYMid slice", clearCanvas: true } });
    anim.addEventListener("enterFrame", (e) => { if (g !== gen || phase === "map") return; cur = seg0 + e.currentTime; paintCity(); $("#scrub").value = cur; $("#info").textContent = R + " · " + (cur / data.fr).toFixed(2) + " s · " + phase + (fps ? " · " + fps + " fps" : ""); });
    anim.addEventListener("complete", () => g === gen && onComplete());
    anim.addEventListener("loopComplete", () => g === gen && onLoop());
    let started = false; const go = () => { if (!started && g === gen) { started = true; run(); } };
    anim.addEventListener("DOMLoaded", go); setTimeout(go, 1500);
  }
  // the host's contract: words, then the handoff only once the city is ready (else the hold loops), then the map
  function run() {
    done.classList.remove("on"); lot.style.display = ""; cityReady = !slow; clearTimeout(readyT);
    if (slow) readyT = setTimeout(() => { cityReady = true; }, 12000);
    if (RM) { phase = "fără mișcare"; scrubTo(mk("handoff").tm + mk("handoff").dr - 1); lot.style.transition = "opacity .6s"; lot.style.opacity = 0; setTimeout(finish, 650); return; }
    lot.style.transition = ""; lot.style.opacity = 1;
    phase = "words"; seg(0, mk("hold").tm, false);
  }
  function onComplete() {
    if (phase === "words") { if (cityReady) handoff(); else { phase = "hold"; seg(mk("hold").tm, mk("handoff").tm, true); } }
    else if (phase === "handoff") finish();
  }
  // the hold's last frame is its first, so from the loop the handoff starts at its own marker, without a second hold
  function onLoop() { if (phase === "hold" && cityReady) { phase = "handoff"; const hd = mk("handoff"); seg(hd.tm, hd.tm + hd.dr, false); } }
  function handoff() { phase = "handoff"; const h = mk("hold"), hd = mk("handoff"); seg(h.tm, hd.tm + hd.dr, false); }
  function skip() { if (phase === "map" || phase === "handoff") return; if (!cityReady) { phase = "hold"; seg(mk("hold").tm, mk("handoff").tm, true); return; } phase = "handoff"; const hd = mk("handoff"); seg(hd.tm, hd.tm + hd.dr, false); }
  function finish() { phase = "map"; lot.style.display = "none"; paintCity(data.op); done.classList.add("on"); }
  $("#again").onclick = () => { run(); };
  $("#skip").onclick = skip;
  $("#slow").onclick = (e) => { slow = !slow; e.currentTarget.setAttribute("aria-pressed", slow); run(); };
  $("#ab").onclick = () => { ab = ab === "phone" ? "desktop" : "phone"; load(); };
  $("#help").onclick = (e) => { const on = !$("#about").classList.contains("on"); $("#about").classList.toggle("on", on); e.currentTarget.setAttribute("aria-pressed", on); };
  $("#scrub").oninput = (e) => { phase = "scrub"; lot.style.display = ""; lot.style.opacity = 1; done.classList.remove("on"); scrubTo(+e.target.value); $("#info").textContent = R + " · " + (+e.target.value / data.fr).toFixed(2) + " s"; };
  addEventListener("keydown", (e) => { if (e.key === "Escape" || e.key === "s") skip(); if (e.key === "r") $("#again").click(); });
  let rz = null; addEventListener("resize", () => { clearTimeout(rz); rz = setTimeout(load, 250); });
  (function tick(t) { fpsN++; if (t - fpsT >= 1000) { fps = Math.round((fpsN * 1000) / (t - fpsT)); fpsN = 0; fpsT = t; } requestAnimationFrame(tick); })(performance.now());
  loadPlayer(R).catch(() => { R = "svg"; return loadPlayer("svg"); }).then(load);
})();
</script>
</body></html>
`;
}
