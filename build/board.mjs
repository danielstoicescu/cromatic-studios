// r136b: "Ready to fly, already?", the boarding banner at the end of every case page (Daniel: much more visual,
// illustrations that play on hover, animated on press, and the boarding pass comes out from behind it).
// A ticket: the yellow part holds the copy and a little route (you -> Olari 9) with a plane, clouds and a cup; the
// white stub holds gate, seat and a barcode. Hover tilts it towards the pointer with a soft glare, the plane flies
// the route and the stub gets ready to tear. A press tears the stub and the plane takes off; inside the map the page
// then asks the map for the boarding pass with the ticket's place on screen, and the map pulls the pass out from
// behind the ticket's top edge (src/app.js, boardFx). On its own the page goes to /?map&boarding.

const INK = "#0d0c09", Y = "#FED012", UM = "#2840F0";

// a barcode that is always the same (no randomness between builds)
function barcode() {
  let x = 0, bars = "", seed = 9;
  for (let i = 0; i < 46; i++) {
    seed = (seed * 37 + 11) % 101;
    const w = 1 + (seed % 3), gap = 1 + ((seed >> 2) % 2) * 1.5;
    bars += `<rect x="${x}" width="${w}" height="40"/>`;
    x += w + gap;
  }
  return `<svg class="czb-bars" viewBox="0 0 ${x.toFixed(1)} 40" preserveAspectRatio="none" aria-hidden="true" fill="${INK}">${bars}</svg>`;
}

const CLOUD = `<path d="M8 30h52a11 11 0 0 0 1-22 16 16 0 0 0-30-3 12 12 0 0 0-21 9A8 8 0 0 0 8 30z" fill="#fff" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/>`;
const ROUTE = "M36 150C150 40 330 10 476 72";
const ART = `<svg class="czb-svg" viewBox="0 0 520 200" aria-hidden="true">
<circle class="czb-sun" cx="408" cy="96" r="74" fill="#FFE357"/><circle cx="408" cy="96" r="50" fill="#FFEA80"/>
<g class="czb-cl" data-x="96" data-y="104" data-d="0.6" transform="translate(96 104)"><g class="czb-drift">${CLOUD}</g></g>
<g class="czb-cl" data-x="282" data-y="126" data-d="1.2" transform="translate(282 126) scale(1.15)"><g class="czb-drift d2">${CLOUD}</g></g>
<g class="czb-cl" data-x="352" data-y="8" data-d="0.35" transform="translate(352 8) scale(.72)"><g class="czb-drift d3">${CLOUD}</g></g>
<path d="${ROUTE}" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round" stroke-dasharray="1 9" opacity=".45"/>
<path class="czb-trail" d="${ROUTE}" fill="none" stroke="${UM}" stroke-width="3" stroke-linecap="round" stroke-dasharray="0 2000"/>
<g transform="translate(36 150)"><circle class="czb-ring" r="11" fill="none" stroke="${INK}" stroke-width="2"/><circle r="11" fill="#fff" stroke="${INK}" stroke-width="2"/><circle r="4" fill="${INK}"/></g>
<g class="czb-star" transform="translate(430 150)"><g class="czb-spin" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"><path d="M0-9V9M-7.8-4.5 7.8 4.5M-7.8 4.5 7.8-4.5"/></g></g>
<g class="czb-dest" transform="translate(476 72)"><g class="czb-cup">
<g class="czb-steam" fill="none" stroke="${INK}" stroke-width="2" stroke-linecap="round"><path d="M-5-27c-3-4 3-6 0-10"/><path d="M2-29c-3-4 3-6 0-10"/></g>
<circle r="21" fill="${Y}" stroke="${INK}" stroke-width="2"/>
<path d="M-10-5h17v5a8.5 8.5 0 0 1-17 0z" fill="#fff" stroke="${INK}" stroke-width="2" stroke-linejoin="round"/><path d="M7-2.5a4 4 0 0 1 0 8" fill="none" stroke="${INK}" stroke-width="2"/><path d="M-12 11h21" stroke="${INK}" stroke-width="2" stroke-linecap="round"/>
</g></g>
<ellipse class="czb-pls" rx="15" ry="4" fill="${INK}" opacity=".13" cx="60" cy="150"/>
<g class="czb-pl" transform="translate(60 130)">
<path d="M1-4-7-19h5L10-4zM1 4l-8 15h5L10 4zM-13-4l-5-7h4l6 7zM-13 4l-5 7h4l6-7z" fill="${UM}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>
<path d="M-17 0c0-3 3-4 7-4h23c5 0 8 2 9 4-1 2-4 4-9 4h-23c-4 0-7-1-7-4z" fill="#fff" stroke="${INK}" stroke-width="1.8"/>
<path d="M15-2c3 0 4.5 1 5 2-.5 1-2 2-5 2z" fill="${INK}"/>
</g>
</svg>`;

const shapeSvg = (id, perf) => `<svg class="czb-shape" aria-hidden="true"><defs><radialGradient id="${id}" gradientUnits="userSpaceOnUse" cx="0" cy="0" r="340"><stop offset="0" stop-color="#fff" stop-opacity=".6"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><path class="f"/><path class="g" fill="url(#${id})"/><path class="s"/>${perf ? `<path class="p"/>` : ""}</svg>`;

export const BOARD_HTML = `<div class="czb" data-czb>
<div class="czb-tilt">
<div class="czb-main">${shapeSvg("czbG1")}
<div class="czb-copy">
<p class="czb-eb">Cromatic Air · Now boarding</p>
<p class="czb-h">Ready to fly, already?</p>
<p class="czb-sub">Complete your boarding pass in a minute. We'll be in touch within a day.</p>
<a class="czb-go" href="/?map&amp;boarding" data-board><span class="czb-go-t">Begin boarding</span><span class="czb-go-i" aria-hidden="true"><svg viewBox="0 0 20 20"><path class="a1" d="M4 10h11M11 5.5 15.5 10 11 14.5"/><path class="a2" d="M4 10h11M11 5.5 15.5 10 11 14.5"/></svg></span></a>
</div>
<div class="czb-art">${ART}</div>
</div>
<div class="czb-stub" aria-hidden="true">${shapeSvg("czbG2", true)}
<div class="czb-cells">
<div class="czb-c"><span>From</span><b>You</b></div>
<div class="czb-c"><span>To</span><b>Olari 9</b></div>
<div class="czb-c"><span>Gate</span><b>9</b></div>
<div class="czb-c"><span>Seat</span><b>1A</b></div>
</div>
<div class="czb-code">${barcode()}<i class="czb-scan"></i></div>
</div>
<i class="czb-slot" aria-hidden="true"></i>
</div>
</div>`;

export const BOARD_CSS = `<style>
.czb{--ink:${INK};--y:${Y};--um:${UM};position:relative;margin-top:34px;perspective:1600px;color:var(--ink);font-family:CromaticSans,"Darker Grotesque",system-ui,sans-serif;-webkit-tap-highlight-color:transparent}
.czb-tilt{position:relative;display:flex;cursor:pointer;transform-origin:50% 60%;filter:drop-shadow(0 16px 26px rgba(13,12,9,.13)) drop-shadow(0 2px 3px rgba(13,12,9,.08));transition:filter .6s cubic-bezier(.2,.8,.2,1)}
.czb.hov .czb-tilt{filter:drop-shadow(0 30px 40px rgba(13,12,9,.18)) drop-shadow(0 4px 8px rgba(13,12,9,.1))}
.czb-main,.czb-stub{position:relative;box-sizing:border-box}
.czb-main{flex:1 1 auto;min-width:0;display:flex;align-items:center;gap:10px;padding:30px 14px 30px 36px;min-height:220px;background:var(--y);border:2px solid var(--ink);border-right:0;border-radius:28px 0 0 28px}
.czb-stub{flex:0 0 208px;display:flex;flex-direction:column;justify-content:space-between;gap:16px;padding:24px 24px 22px 28px;background:#fff;border:2px dashed var(--ink);border-radius:0 28px 28px 0;transform-origin:0 100%;transition:transform .7s cubic-bezier(.2,.8,.2,1)}
.czb.on .czb-main,.czb.on .czb-stub{background:none;border:0}
.czb-shape{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none;display:none}
.czb.on .czb-shape{display:block}
.czb-shape .f{fill:var(--y)}.czb-stub .czb-shape .f{fill:#fff}
.czb-shape .s{fill:none;stroke:var(--ink);stroke-width:2;stroke-linejoin:round}
.czb-shape .p{fill:none;stroke:var(--ink);stroke-width:2;stroke-dasharray:1 7;stroke-linecap:round;opacity:.5}
.czb-shape .g{opacity:0;transition:opacity .5s;mix-blend-mode:soft-light}
.czb.hov .czb-shape .g{opacity:1}
.czb-copy{position:relative;z-index:1;flex:0 1 440px;min-width:0}
.czb-eb{display:flex;align-items:center;gap:9px;margin:0 0 14px;font:700 11px/1.2 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase}
.czb-eb::before{content:"";width:8px;height:8px;border-radius:50%;background:#16B45A;box-shadow:0 0 0 0 rgba(22,180,90,.55);animation:czbDot 1.9s infinite}
.czb-h{margin:0;font:900 clamp(32px,3.8vw,50px)/.98 CromaticSans,system-ui,sans-serif;letter-spacing:-.025em;text-wrap:balance}
.czb-sub{margin:12px 0 22px;max-width:36ch;font:500 16px/1.4 CromaticSans,system-ui,sans-serif;opacity:.8}
.czb-go{position:relative;display:inline-flex;align-items:center;gap:14px;padding:8px 8px 8px 26px;border-radius:999px;background:var(--ink);color:#fff;text-decoration:none;font:800 17px/1 CromaticSans,system-ui,sans-serif;white-space:nowrap;overflow:hidden;isolation:isolate;transition:transform .45s cubic-bezier(.2,.8,.2,1),box-shadow .45s}
.czb-go::after{content:"";position:absolute;inset:0;z-index:-1;background:linear-gradient(105deg,transparent 30%,rgba(255,255,255,.22) 48%,transparent 66%);transform:translateX(-120%);transition:transform .9s cubic-bezier(.2,.8,.2,1)}
.czb.hov .czb-go::after{transform:translateX(120%)}
.czb.hov .czb-go{box-shadow:0 10px 22px -8px rgba(13,12,9,.55)}
.czb-go:focus-visible{outline:3px solid #119BFE;outline-offset:3px}
.czb-go-i{position:relative;display:grid;place-items:center;width:38px;height:38px;border-radius:50%;background:var(--y);color:var(--ink);overflow:hidden;transition:transform .45s cubic-bezier(.2,.8,.2,1)}
.czb-go-i svg{width:20px;height:20px;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round;overflow:visible}
.czb-go-i path{transition:transform .5s cubic-bezier(.65,0,.35,1)}
.czb-go-i .a2{transform:translateX(-26px)}
.czb.hov .czb-go-i .a1{transform:translateX(26px)}.czb.hov .czb-go-i .a2{transform:none}
.czb.hov .czb-go-i{transform:rotate(-8deg) scale(1.06)}
.czb-art{position:relative;z-index:1;flex:1 1 auto;min-width:0;align-self:stretch;display:flex;align-items:center;justify-content:center}
.czb-svg{width:100%;max-width:620px;height:auto;max-height:250px;overflow:visible}
.czb-drift{animation:czbDrift 7s ease-in-out infinite alternate}.czb-drift.d2{animation-duration:9s;animation-delay:-3s}.czb-drift.d3{animation-duration:6s;animation-delay:-1s}
.czb-ring{transform-box:fill-box;transform-origin:center;animation:czbRing 2.4s cubic-bezier(.2,.8,.2,1) infinite}
.czb-spin{transform-box:fill-box;transform-origin:center;animation:czbSpin 12s linear infinite}
.czb.hov .czb-spin{animation-duration:3s}
.czb-steam path{animation:czbSteam 2.2s ease-in-out infinite}.czb-steam path+path{animation-delay:-1.1s}
.czb-cup{transform-box:fill-box;transform-origin:50% 100%;transition:transform .6s cubic-bezier(.34,1.56,.64,1)}
.czb.near .czb-cup{transform:scale(1.12) rotate(-6deg)}
.czb-cells{display:grid;grid-template-columns:1fr 1fr;gap:14px 10px;position:relative}
.czb-c span{display:block;font:700 9.5px/1.2 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase;opacity:.55;margin-bottom:4px}
.czb-c b{display:block;font:900 21px/1 CromaticSans,system-ui,sans-serif;letter-spacing:-.01em;white-space:nowrap}
.czb-code{position:relative;height:44px}
.czb-bars{display:block;width:100%;height:100%}
.czb-scan{position:absolute;left:-6px;right:-6px;top:0;height:2px;border-radius:2px;background:#FF3B30;box-shadow:0 0 10px 2px rgba(255,59,48,.55);opacity:0}
.czb.hov .czb-scan{opacity:1;animation:czbScan 1.3s cubic-bezier(.45,0,.55,1) infinite alternate}
.czb.hov .czb-stub{transform:rotate(1.4deg) translate(3px,-3px)}
.czb-slot{position:absolute;left:6%;right:6%;top:-2px;height:4px;border-radius:4px;background:linear-gradient(90deg,transparent,rgba(255,255,255,.95) 20%,#fff 50%,rgba(255,255,255,.95) 80%,transparent);box-shadow:0 0 18px 4px rgba(254,208,18,.75);opacity:0;transform:scaleX(.2);pointer-events:none}
.czb.fly .czb-slot{animation:czbSlot 1.1s cubic-bezier(.2,.8,.2,1) forwards}
.czb.fly .czb-stub{animation:czbTear 1s cubic-bezier(.3,.7,.2,1) forwards}
.czb.fly .czb-go{transform:scale(.96)}
.czb.fly .czb-scan{opacity:0;animation:none}
@keyframes czbDot{0%{box-shadow:0 0 0 0 rgba(22,180,90,.55)}70%,100%{box-shadow:0 0 0 9px rgba(22,180,90,0)}}
@keyframes czbDrift{to{transform:translateX(14px)}}
@keyframes czbRing{0%{transform:scale(1);opacity:.7}100%{transform:scale(2.3);opacity:0}}
@keyframes czbSpin{to{transform:rotate(360deg)}}
@keyframes czbSteam{0%,100%{opacity:0;transform:translateY(4px)}40%,60%{opacity:.85;transform:translateY(-2px)}}
@keyframes czbScan{to{top:calc(100% - 2px)}}
@keyframes czbSlot{0%{opacity:0;transform:scaleX(.2)}22%{opacity:1;transform:scaleX(1)}70%{opacity:.9}100%{opacity:0;transform:scaleX(1.05)}}
@keyframes czbTear{0%{transform:rotate(1.4deg) translate(3px,-3px)}25%{transform:rotate(4deg) translate(8px,-6px)}100%{transform:rotate(11deg) translate(34px,26px);opacity:0}}
@media (max-width:760px){
.czb-tilt{flex-direction:column}
.czb-main{flex-direction:column;align-items:stretch;padding:22px 22px 26px;min-height:0;border:2px solid var(--ink);border-bottom:0;border-radius:26px 26px 0 0}
.czb-art{order:-1;margin:-4px -6px 4px}
.czb-svg{max-height:150px}
.czb-copy{flex:none}
.czb-go{width:100%;justify-content:space-between;box-sizing:border-box}
.czb-stub{flex:none;padding:20px 22px 20px;border:2px dashed var(--ink);border-radius:0 0 26px 26px;transform-origin:0 0}
.czb-cells{grid-template-columns:repeat(4,auto);justify-content:space-between}
.czb-c b{font-size:18px}
.czb-code{height:34px}
.czb-slot{left:10%;right:10%}
.czb.hov .czb-stub{transform:rotate(-1deg) translate(2px,3px)}
@keyframes czbTear{0%{transform:none}25%{transform:rotate(-2deg) translate(4px,4px)}100%{transform:rotate(-7deg) translate(20px,40px);opacity:0}}
}
@media (prefers-reduced-motion:reduce){.czb *,.czb *::before,.czb *::after{animation:none!important;transition:none!important}}
</style>`;

// the browser side, written as a function and inlined as its source (no escaping to get wrong)
function client() {
  var root = document.querySelector("[data-czb]");
  if (!root) return;
  var RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
  var FINE = matchMedia("(hover: hover) and (pointer: fine)").matches;
  var tilt = root.querySelector(".czb-tilt"), main = root.querySelector(".czb-main"), stub = root.querySelector(".czb-stub");
  var link = root.querySelector("a[data-board]");
  var trail = root.querySelector(".czb-trail"), pl = root.querySelector(".czb-pl"), pls = root.querySelector(".czb-pls");
  var clouds = [].slice.call(root.querySelectorAll(".czb-cl"));
  var L = trail.getTotalLength();

  // ---- the ticket's outline: rounded corners, two half-circle notches where the stub tears off ----
  function outline(w, h, t, skip) {
    function en(i) { var k = t[i][0]; return i === 0 ? [0, k] : i === 1 ? [w - k, 0] : i === 2 ? [w, h - k] : [k, h]; }
    function ex(i) { var k = t[i][0]; return i === 0 ? [k, 0] : i === 1 ? [w, k] : i === 2 ? [w - k, h] : [0, h - k]; }
    function arc(i) { var k = t[i][0], p = ex(i); return "A" + k + " " + k + " 0 0 " + (t[i][1] ? 0 : 1) + " " + p[0] + " " + p[1]; }
    var f = "M" + ex(0).join(" "), i;
    for (i = 1; i < 4; i++) f += "L" + en(i).join(" ") + arc(i);
    f += "L" + en(0).join(" ") + arc(0) + "Z";
    var st = (skip + 1) % 4, s = "M" + en(st).join(" ");
    for (i = 0; i < 4; i++) { var c = (st + i) % 4; s += arc(c); if (i < 3) s += "L" + en((c + 1) % 4).join(" "); }
    return [f, s];
  }
  function shape() {
    var col = getComputedStyle(tilt).flexDirection === "column", R = col ? 26 : 28, r = 13, N = [r, 1], C = [R, 0];
    var mw = main.offsetWidth, mh = main.offsetHeight, sw = stub.offsetWidth, sh = stub.offsetHeight;
    var m = col ? outline(mw, mh, [C, C, N, N], 2) : outline(mw, mh, [C, N, N, C], 1);
    var s = col ? outline(sw, sh, [N, N, C, C], 0) : outline(sw, sh, [N, C, C, N], 3);
    var ms = main.querySelector(".czb-shape"), ss = stub.querySelector(".czb-shape");
    ms.querySelector(".f").setAttribute("d", m[0]); ms.querySelector(".g").setAttribute("d", m[0]); ms.querySelector(".s").setAttribute("d", m[1]);
    ss.querySelector(".f").setAttribute("d", s[0]); ss.querySelector(".g").setAttribute("d", s[0]); ss.querySelector(".s").setAttribute("d", s[1]);
    ss.querySelector(".p").setAttribute("d", col ? "M" + (r + 8) + " 0H" + (sw - r - 8) : "M0 " + (r + 8) + "V" + (sh - r - 8));
    root.classList.add("on");
  }
  shape();
  if (window.ResizeObserver) new ResizeObserver(shape).observe(tilt); else addEventListener("resize", shape);

  // ---- motion: tilt, glare, parallax and the plane, smoothed every frame ----
  var S = { rx: 0, ry: 0, l: 0, sc: 1, px: 0, py: 0 }, T = { rx: 0, ry: 0, l: 0, sc: 1, px: 0, py: 0 };
  var hov = false, press = false, fly = false, seen = false, vis = false, mode = "idle";
  var u = 0, ut = 0, last = 0, raf = 0, t0 = performance.now();
  var IDLE = 0.17;
  function pos(x) { var p = trail.getPointAtLength(Math.max(0, Math.min(1, x)) * L); return p; }
  function frame(now) {
    raf = 0;
    var dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
    var k = 1 - Math.exp(-dt * 7);
    for (var key in T) S[key] += (T[key] - S[key]) * k;
    tilt.style.transform = "rotateX(" + S.rx.toFixed(2) + "deg) rotateY(" + S.ry.toFixed(2) + "deg) translateY(" + (-S.l).toFixed(2) + "px) scale(" + S.sc.toFixed(4) + ")";
    clouds.forEach(function (c) { var d = +c.dataset.d; c.setAttribute("transform", c.getAttribute("transform").replace(/translate\([^)]*\)/, "translate(" + (+c.dataset.x + S.px * d * 22).toFixed(1) + " " + (+c.dataset.y + S.py * d * 10).toFixed(1) + ")")); });
    // the plane: idle near home, flies the route on hover, takes off past the cup on a press, then comes round again
    if (mode === "loop") u += dt * 0.2;
    else u += (ut - u) * (1 - Math.exp(-dt * (fly ? 4.2 : 2.4)));
    if (u >= 1.3 && !fly) { u = 0; if (mode === "out") { mode = hov ? "hover" : "idle"; ut = hov ? 0.86 : IDLE; } }
    var tl = 0.32, a = L * Math.max(0, u - tl), b = L * (Math.min(u, 1) - Math.max(0, u - tl));
    trail.setAttribute("stroke-dasharray", "0 " + a.toFixed(1) + " " + Math.max(0, b).toFixed(1) + " " + (L * 3).toFixed(0));
    var e = Math.max(0, Math.min(1, (u - 1) / 0.3)), p = pos(u), q = pos(Math.min(u, 0.995) + 0.005), p0 = pos(Math.min(u, 0.995));
    var ang = Math.atan2(q.y - p0.y, q.x - p0.x), bob = Math.sin((now - t0) / 420) * 1.6 * (1 - e);
    var x = p.x + Math.cos(ang) * e * 150, y = p.y + Math.sin(ang) * e * 150 - e * e * 70 + bob - 18;
    var sc = (1 + e * 0.9) * Math.min(1, 0.55 + u * 6), op = Math.min(1, u * 14) * (1 - e * e);
    pl.setAttribute("transform", "translate(" + x.toFixed(1) + " " + y.toFixed(1) + ") rotate(" + (ang * 57.3 - e * 18).toFixed(1) + ") scale(" + sc.toFixed(3) + ")");
    pl.setAttribute("opacity", op.toFixed(3));
    pls.setAttribute("cx", (p.x + 4).toFixed(1)); pls.setAttribute("cy", (p.y + 6 + e * 26).toFixed(1));
    pls.setAttribute("opacity", (0.13 * op * (1 - e)).toFixed(3));
    root.classList.toggle("near", u > 0.8 && u < 1.15);
    if (vis || fly) raf = requestAnimationFrame(frame);
  }
  function kick() { if (!raf && !RM) { last = 0; raf = requestAnimationFrame(frame); } }
  if (RM) { u = 0.6; frame(performance.now()); }
  if (window.IntersectionObserver) new IntersectionObserver(function (es) {
    vis = es[0].isIntersecting;
    if (vis && !seen) { seen = true; u = 0; if (FINE) { mode = "idle"; ut = IDLE; } else mode = "loop"; }
    kick();
  }, { threshold: 0.25 }).observe(root); else { vis = true; ut = IDLE; kick(); }

  function glare(e) {
    [main, stub].forEach(function (el) {
      var r = el.getBoundingClientRect(), g = el.querySelector("radialGradient");
      g.setAttribute("cx", (e.clientX - r.left).toFixed(0)); g.setAttribute("cy", (e.clientY - r.top).toFixed(0));
    });
  }
  root.addEventListener("pointermove", function (e) {
    if (!FINE || fly || RM) return;
    var r = root.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5;
    T.ry = x * 6; T.rx = -y * 5; T.px = x; T.py = y;
    glare(e); kick();
  });
  root.addEventListener("pointerenter", function (e) {
    if (!FINE || fly) return;
    hov = true; root.classList.add("hov"); T.l = 4;
    if (mode !== "out") { mode = "hover"; ut = 0.86; }
    glare(e); kick();
  });
  root.addEventListener("pointerleave", function () {
    if (!FINE || fly) return;
    hov = false; press = false; root.classList.remove("hov");
    T.rx = T.ry = T.px = T.py = 0; T.l = 0; T.sc = 1;
    // the plane does not fly backwards: it finishes the route, leaves, and comes home again
    if (u > IDLE + 0.1) { mode = "out"; ut = 1.36; } else { mode = "idle"; ut = IDLE; }
    kick();
  });
  root.addEventListener("pointerdown", function () { if (fly) return; press = true; T.sc = 0.982; T.l = 1; kick(); });
  addEventListener("pointerup", function () { if (!press) return; press = false; T.sc = 1; T.l = hov ? 4 : 0; kick(); });

  function reset() {
    fly = false; root.classList.remove("fly", "hov"); hov = false;
    T.sc = 1; T.l = 0; u = 0; mode = FINE ? "idle" : "loop"; ut = IDLE; kick();
  }
  addEventListener("pageshow", function (e) { if (e.persisted) reset(); });

  root.addEventListener("click", function (e) {
    if (!e.target.closest(".czb-tilt")) return;
    e.preventDefault();
    if (fly) return;
    fly = true; root.classList.add("fly");
    T.rx = T.ry = T.px = T.py = 0; T.sc = 0.975; T.l = 0;
    setTimeout(function () { T.sc = 1; }, 160);
    mode = "fly"; ut = 1.36; kick();
    var emb = /[?&]embed=1/.test(location.search) || document.documentElement.classList.contains("embed");
    if (emb && window.parent !== window) {
      // the map takes it from here: it pulls the boarding pass out from behind this ticket
      setTimeout(function () {
        var r = tilt.getBoundingClientRect();
        window.parent.postMessage({ cz: "boarding", rect: { left: r.left, top: r.top, width: r.width, height: r.height } }, location.origin);
      }, RM ? 0 : 150);
      setTimeout(reset, 4000);
    } else setTimeout(function () { location.href = link.href; }, RM ? 0 : 760);
  });
}

export const BOARD_JS = `<script>(${client.toString()})();</script>`;

// Romanian for the ticket (merged into site/i18n/ro.json by the build)
export const BOARD_RO = {
  "Cromatic Air · Now boarding": "Cromatic Air · Îmbarcarea a început",
  "Ready to fly, already?": "Gata de zbor, deja?",
  "Complete your boarding pass in a minute. We'll be in touch within a day.": "Completezi boarding pass-ul într-un minut. Îți răspundem într-o zi.",
  "Begin boarding": "Începe îmbarcarea",
  "From": "De la",
  "You": "Tine",
  "To": "Spre",
  "Olari 9": "Olari 9",
  "Gate": "Poarta",
  "Seat": "Loc"
};
