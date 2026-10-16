// Builds the site from src/.
//   node build/build.mjs            -> public/  (production: assets split out, hashed, cache-friendly)
//   node build/build.mjs --single F -> F       (one self-contained HTML file, for local viewing)
import { readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync } from "node:fs";
import { createHash } from "node:crypto";
import zlib from "node:zlib";
import { readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { jsonLd, llmsTxt, llmsFull, robotsTxt, sitemapXml, manifest, icoFromPng, studioNode, websiteNode } from "./seo.mjs";
import { seoPage, pageText, lastmodStore, SAME_AS, CLIPPED } from "./seo-pages.mjs";
import { consentSnippet } from "./consent.mjs";
import { withFooter } from "./footer.mjs"; // r139c
import { videoLd } from "./videos.mjs"; // r139c
import { BOARD_HTML, BOARD_CSS, BOARD_JS } from "./board.mjs";
import { FILM_AUTO, ytFacade } from "./film.mjs";
import * as DATA from "../site/data.mjs";
import { makeRender } from "../site/render.mjs";
import { kineticBundle } from "./kinetic.mjs";
import { optimizeImages, socialCards, canvasVariants } from "./images.mjs"; // r139d: canvasVariants
import { makeI18n, roPath } from "./i18n.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = (f) => join(root, "src", f);
// r135: live on the main domain (Daniel, 2026-10-12): drive.cromaticstudios.com and www. answer with a 301 to it
const SITE_URL = (process.env.SITE_URL || "https://cromaticstudios.com").replace(/\/$/, "");
// r139c (N51): how many case studies there are, counted from their sources (the "34" in the copy was written by hand)
const CASE_COUNT = (() => { let fs = []; try { fs = readdirSync(join(root, "site", "cases")).filter((f) => f.endsWith(".html")).map((f) => f.slice(0, -5)); } catch {} return new Set([...Object.keys(DATA.CASES || {}), ...Object.keys(DATA.CANVASES || {}), ...fs, "steam"]).size; })();
const head = readFileSync(src("head.html"), "utf8");
const css = readFileSync(src("styles.css"), "utf8");
// nav2: the opt-in navigation prototype (?nav=v2) is its own module, laid before the app (window.czNav2 is there when
// the map first opens) with its own styles; app.js only calls it when the flag is on
const NAV2_JS = (() => { try { return readFileSync(src("nav2.js"), "utf8"); } catch { return ""; } })();
const NAV2_CSS = (() => { try { return readFileSync(src("nav2.css"), "utf8"); } catch { return ""; } })();
const js = readFileSync(src("app.js"), "utf8");
const content = readFileSync(src("content.html"), "utf8").replace(/<!--[\s\S]*?-->\s*/, "").replace(/\b\d+ case studies\b/g, `${CASE_COUNT} case studies`);
// r136c: the first paint is the brewing cup, turning: the 3D cup's own 24-frame strip (src/cup-spin.png) is inlined,
// so it paints with the HTML before any request, never a star. On "/" and ?map app.js adopts this element as its
// "Brewing the city" loader (no swap); on ?drive it steps aside as soon as the app has drawn its own loader (r164: only
// the /onboarding/ frame still boots the drive, ?drive&onb; a plain ?drive opens the map)
const CUP_STRIP = `data:image/png;base64,${readFileSync(src("cup-spin.png")).toString("base64")}`;
const boot = `<style>.kz-brew .kb-cup .kb-sprite.kb-cs{background-image:url(${CUP_STRIP})}</style><div class="boot kz-brew" aria-hidden="true"><div class="kb-cup kb-3d"><i class="kb-sprite kb-cs"></i></div><span class="kb-t">Brewing the city</span></div>
<script>(function(){var t0=Date.now(),drive=/[?&]drive\\b/.test(location.search)&&/[?&]onb\\b/.test(location.search);(function w(){var b=document.querySelector(".boot");if(!b)return;if((drive&&document.querySelector(".loader"))||Date.now()-t0>30000){b.classList.add("gone");setTimeout(function(){b.remove()},450)}else requestAnimationFrame(w)})()})();<\/script>`;
// r153 (Daniel: "the opening still takes long to start"): the opening's first line is painted from the HTML itself,
// the moment the page arrives, with its own letter animation on the compositor; the bundle (parsed and run for
// seconds on a phone) then adopts this very element (engine.js) and carries on from it, the beats in step. An inline
// check decides, before the first paint, whether the opening will play (the same rule as app.js: "/" once per visit
// (6 h) or ?intro, never ?map / ?drive / ?intro=classic, never with reduced motion); otherwise the cup stays
const preLine = (() => {
  const parts = [["Nobody", 0], ["remembers", 55], null, ["a", 260], ["thumbnail.", 330, "thumb"]];
  const lead = 380; // the beat on the engine's clock (300 ms) plus a breath after the paint
  const word = ([w, d, cls]) => `<span class="kw${cls ? " " + cls : ""}" style="--d:${lead + d}ms">${[...w].map((ch, j) => `<i class="l" style="--ld:${j * 16}ms">${ch}</i>`).join("")}</span>`;
  const kl = parts.map((p) => (p ? word(p) : '<i class="br"></i>')).join("");
  // r184 (Daniel, from the beta's usage pass): "Skip intro" could not be pressed while this line was up (it lay over the
  // button, full screen), and a skip pressed before the city was ready was lost: the whole opening played. The line lets
  // taps through now, and the page paints its own Skip button with it, above it, from the first paint; a press there
  // (or on the app's) is kept in window.__czSkipWanted and honoured as soon as the intro can take it (src/app.js)
  const css = `.i4-pre{pointer-events:none;position:fixed;inset:0;z-index:2147483001;display:grid;place-items:center;grid-template-columns:100%;padding:10vh 5vw 14vh;overflow:hidden;text-align:center;background:#fbf3cf;--ink:#0d0c09;--sans:CromaticSans,"Darker Grotesque",system-ui,sans-serif;color:var(--ink);transition:opacity .4s ease}.i4-pre[hidden]{display:none}.i4-pre.gone{opacity:0;pointer-events:none}.i4-pre.adopted{background:transparent}.i4-pre.adopted::before{display:none}.i4-pre::before{content:"";position:absolute;left:-25%;top:-25%;width:150%;height:150%;background:radial-gradient(45% 40% at 50% 46%, #fff9e0 0%, #fbf3cf 48%, #f5e4ad 100%);will-change:transform;animation:i4breathe 18s ease-in-out infinite alternate}@keyframes i4breathe{from{transform:translate(-4%,-3%)}to{transform:translate(4%,3%)}}.i4-pre .kl{position:relative;grid-area:1/1;justify-self:center;align-self:center;display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:.04em .24em;font:900 clamp(44px,7.8vw,128px)/1.02 var(--sans);letter-spacing:-.045em;max-width:1240px}.i4-pre .kl .br{flex-basis:100%;height:0}.i4-pre .kw{display:inline-block;opacity:1}.i4-pre .kw .l{display:inline-block;font-style:normal;opacity:0;will-change:transform,opacity}.i4-pre .kl.in .kw .l{animation:i4in .95s cubic-bezier(.16,1,.3,1) calc(var(--d,0ms) + var(--ld,0ms)) both}@keyframes i4in{from{opacity:0;transform:translateY(.42em) scale(.96)}to{opacity:1;transform:none}}.i4-skip{z-index:2147483002}.i4-skip[hidden]{display:none}.i4-skip.on{background:#FED012}`;
  const js = `(function(){try{var q=location.search,rm=matchMedia("(prefers-reduced-motion: reduce)").matches,t=+localStorage.getItem("cz-intro-at")||0;var on=!/[?&](map|drive)\\b/.test(q)&&!/[?&]intro=classic\\b/.test(q)&&!rm&&(/[?&]intro\\b/.test(q)||Date.now()-t>=216e5);if(!on)return;var p=document.querySelector(".i4-pre"),b=document.querySelector(".boot"),k=document.querySelector(".i4-skip");if(!p)return;p.hidden=false;if(k){k.hidden=false;k.onclick=function(){window.__czSkipWanted=true;k.classList.add("on")}}window.__i4t0=performance.now();if(b)b.classList.add("gone");setTimeout(function(){if(p.isConnected&&!p.classList.contains("adopted")){p.classList.add("gone");setTimeout(function(){p.remove()},500)}if(k&&k.isConnected)k.remove()},30000)}catch(e){}})();`;
  return `<style>${css}</style><div class="i4-pre" hidden aria-hidden="true"><div class="kl calm in">${kl}</div></div><button type="button" class="kz-skip i4-skip" hidden>Skip intro <span>→</span></button><script>${js}</script>`;
})();
// the text version's portfolio, from site/data.mjs (every case study linked, grouped by street)
const homeWork = () => {
  const e = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const seen = new Set();
  return Object.entries(DATA.STREETS).map(([k, [street]]) => {
    const list = DATA.PROJECTS.filter((p) => p.street === k && !p.small && !p.wip && !(p.page && seen.has(p.page)) && (p.page ? seen.add(p.page) : true));
    if (!list.length) return "";
    return `    <h3>${e(street)}</h3>\n    <ul>\n${list.map((p) => `      <li>${p.page ? `<a href="/work/${p.page}/"><strong>${e(p.name)}</strong></a>` : `<strong>${e(p.name)}</strong>`} (${e(p.cat.toLowerCase())}): ${e(p.desc)}</li>`).join("\n")}\n    </ul>`;
  }).filter(Boolean).join("\n");
};
const hash = (buf) => createHash("sha1").update(buf).digest("hex").slice(0, 10);

// r134: Montserrat, JetBrains Mono and Cinzel served from our own domain (site/fonts/gf), latin + latin-ext
let GF_CSS = "";
const gfAssets = [];
try {
  GF_CSS = readFileSync(join(root, "site", "fonts", "gf", "fonts.css"), "utf8").replace(/%%([\w.-]+)%%/g, (m, f) => {
    const buf = readFileSync(join(root, "site", "fonts", "gf", f)), rel = `assets/fonts/gf-${f.replace(/\.woff2$/, "")}-${hash(buf).slice(0, 8)}.woff2`;
    gfAssets.push([rel, buf]);
    return "/" + rel;
  }).replace(/\n/g, "");
} catch {}
const args = process.argv.slice(2);
const single = args.indexOf("--single");
if (single >= 0) {
  const out = args[single + 1] || join(root, "dist", "index.html");
  mkdirSync(dirname(out), { recursive: true });
  // a local file has no domain: drop the absolute social/canonical tags
  const h = head.split("\n").filter((l) => !l.includes("%%SITE_URL%%")).join("\n");
  const html = `${h}<style>${css}\n${NAV2_CSS}</style>\n</head><body>\n${boot}\n${content}\n<script>${NAV2_JS}\n${js}<\/script>\n</body></html>`; // nav2
  writeFileSync(out, html);
  console.log(`single file -> ${out} (${(html.length / 1048576).toFixed(2)} MB)`);
  process.exit(0);
}

const pub = process.env.PUBLIC_DIR || join(root, "public"); // r136: PUBLIC_DIR lets parallel work build elsewhere
rmSync(pub, { recursive: true, force: true });
mkdirSync(join(pub, "assets"), { recursive: true });
mkdirSync(join(pub, "assets", "fonts"), { recursive: true });
for (const [rel, buf] of gfAssets) writeFileSync(join(pub, rel), buf);
const EXT = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif", "image/svg+xml": "svg", "video/mp4": "mp4", "video/webm": "webm" };
let n = 0, bytes = 0;
const seen = new Map();
const extract = (text) => text.replace(/data:(image\/(?:png|jpeg|webp|gif|svg\+xml)|video\/(?:mp4|webm));base64,([A-Za-z0-9+/=]+)/g, (m, mime, b64) => {
  if (seen.has(b64)) return seen.get(b64);
  const buf = Buffer.from(b64, "base64");
  const name = `assets/${hash(buf)}.${EXT[mime]}`;
  writeFileSync(join(pub, name), buf);
  seen.set(b64, name);
  n++; bytes += buf.length;
  return name;
});
// images inside markup the app builds (galleries, case pages, modals) load only when shown
const lazy = (text) => text.replace(/<img src=/g, "<img loading=lazy decoding=async src="); // unquoted: safe inside any JS string
// name -> data URI, for every embedded file assigned to a named variable in app.js
const named = new Map();
for (const m of js.matchAll(/([A-Za-z_$][\w$]*)\s*=\s*"data:((?:image|video)\/[a-z0-9+.-]+);base64,([A-Za-z0-9+/=]+)"/g)) named.set(m[1], m[3]);
let jsOut = NAV2_JS + "\n" + lazy(extract(js)); // nav2
// r139a: the map opens Steam's built page (/work/steam/?embed=1) like every other case page; the page kept as a string
// in app.js is read from the source below (page "work/steam") and is only the fallback of the single-file copy, so the
// production bundle ships it empty (~57 KB less)
{
  const before = jsOut.length;
  jsOut = jsOut.replace(/var steamCaseHtml = "(?:[^"\\]|\\.)*";/, 'var steamCaseHtml = "";');
  if (jsOut.length === before) console.warn("[build] steamCaseHtml not found in the bundle (nothing to drop)");
}
// r142: the opening's engine (site/onboarding/intro-lab/engine.js + .css) is one file for the lab and the site: it is
// laid before the app in the bundle (window.cromaticIntro4 is there when the boot asks) and its styles join the sheet
let engineCss = "";
{
  const eng = join(root, "site", "onboarding", "intro-lab");
  try { jsOut = readFileSync(join(eng, "engine.js"), "utf8") + "\n" + jsOut; engineCss = readFileSync(join(eng, "engine.css"), "utf8"); } catch (e) { console.warn("[build] opening engine not found:", e.message); }
}
let cssOut = extract(css) + "\n" + engineCss + "\n" + NAV2_CSS; // nav2
// minify for production (the single-file build stays readable); skipped if esbuild is missing
try {
  const { transformSync } = await import("esbuild");
  jsOut = transformSync(jsOut, { minify: true, target: "es2020", legalComments: "none" }).code;
  cssOut = transformSync(cssOut, { loader: "css", minify: true, legalComments: "none" }).code;
} catch (e) {
  console.warn("[build] not minified:", e.message.split("\n")[0]);
}
// r131: the studio's WordPress uploads the site still uses are mirrored at the same paths (site/wp-uploads), so
// nothing depends on the old site and its image URLs keep working once cromaticstudios.com points here
const WP_MIRROR = new Set();
{
  const base = join(root, "site", "wp-uploads");
  (function walk(d, rel) { let fs = []; try { fs = readdirSync(d); } catch { return; } for (const f of fs) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p, rel + f + "/"); else { mkdirSync(join(pub, "wp-content", "uploads", rel), { recursive: true }); copyFileSync(p, join(pub, "wp-content", "uploads", rel, f)); WP_MIRROR.add(rel + f); } } })(base, "");
}
// r134: /onboarding, the launch page of the product (site/onboarding/**, static, copied as is)
{
  const base = join(root, "site", "onboarding");
  (function walk(d, rel) { let fs = []; try { fs = readdirSync(d); } catch { return; } for (const f of fs) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p, rel + f + "/"); else { mkdirSync(join(pub, "onboarding", rel), { recursive: true }); copyFileSync(p, join(pub, "onboarding", rel, f)); } } })(base, "");
}
// r136 (N34): /onboarding stays indexable, as a page of the site: a description under 155 characters, robots, the
// page and the studio in JSON-LD, its email address kept away from Cloudflare's obfuscation (email_off), and a place
// in the sitemap and llms-full.txt (ONB, used at the end)
let ONB = null, ONB_RO = null; // r139c: and its Romanian copy
{
  const file = join(pub, "onboarding", "index.html");
  try {
    let h = readFileSync(file, "utf8");
    const url = `${SITE_URL}/onboarding/`, title = (/<title>([^<]*)<\/title>/.exec(h) || [])[1] || "Cromatic Studios · The new website";
    const desc = "The new Cromatic Studios website: a 3D city of Bucharest where every client is a building and every industry is a street. Map it, drive it or read it.";
    const og = (/<meta property="og:image" content="([^"]+)"/.exec(h) || [])[1] || `${SITE_URL}/og.jpg`;
    h = h.replace(/<meta name="description" content="[^"]*">/, `<meta name="description" content="${desc}">`);
    if (!/<link rel="canonical"/.test(h)) h = h.replace("</title>", `</title>\n<link rel="canonical" href="${url}">`);
    if (!/<meta name="robots"/.test(h)) h = h.replace(/(<link rel="canonical"[^>]*>)/, `$1\n<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1">`);
    const ld = { "@context": "https://schema.org", "@graph": [studioNode(SITE_URL, SAME_AS), websiteNode(SITE_URL),
      { "@type": "WebPage", "@id": url, url, name: title, description: desc, isPartOf: { "@id": `${SITE_URL}/#website` }, about: { "@id": `${SITE_URL}/#studio` }, primaryImageOfPage: og, inLanguage: "en" }] };
    if (!h.includes("application/ld+json")) h = h.replace("</head>", `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>\n</head>`);
    if (!h.includes("<!--email_off-->")) h = h.replace(/(<body\b[^>]*>)/, "$1<!--email_off-->").replace(/<\/body>(?![\s\S]*<\/body>)/, "<!--/email_off--></body>");
    // r139c (N34, N51): its language for social cards (the Romanian copy says ro_RO), and the real number of case studies
    if (!/<meta property="og:locale"/.test(h)) h = h.replace(/(<meta property="og:site_name"[^>]*>)/, `$1\n<meta property="og:locale" content="en_US">`);
    h = h.replace(/<b data-count="\d+" data-suffix="\+">\d+\+<\/b>(<span>Case studies)/, `<b data-count="${CASE_COUNT}">${CASE_COUNT}</b>$1`)
      .replace(/<b>\d+\+? case studies<\/b>/, `<b>${CASE_COUNT} case studies</b>`)
      .replace(/(<h2 class="h2 light">)\d+ case studies\./, `$1${CASE_COUNT} case studies.`);
    writeFileSync(file, h);
    ONB = { path: "/onboarding/", title, desc, fullDesc: desc, images: [og], html: h };
  } catch (e) { console.warn("[build] onboarding:", e.message); }
}
const wpMirror = (text) => text.replace(/https:(\\?\/)\\?\/cromaticstudios\.com\\?\/wp-content\\?\/uploads\\?\/(\d{4})\\?\/(\d{2})\\?\/(?=([\w.-]+)|\$\{)/g, (m, sl, y, mo, f) => (!f || WP_MIRROR.has(`${y}/${mo}/${f}`)) ? `/wp-content/uploads/${y}/${mo}/` : m);
jsOut = wpMirror(jsOut);
// r138h: Steam's own photos (site/media/steam) are named "m:steam/<name>" in steamCaseHtml; the bundle (the map opens
// the page as srcdoc) and /work/steam point at the hashed copies the media loop below writes (same content, same name)
const steamM = new Map();
{
  const d = join(root, "site", "media", "steam");
  let fs = [];
  try { fs = readdirSync(d); } catch {}
  for (const f of fs) if (/\.(jpe?g|png|webp)$/i.test(f)) { const k = f.replace(/\.[^.]+$/, ""); steamM.set(k, `/assets/m/steam-${k}-${hash(readFileSync(join(d, f))).slice(0, 8)}${f.slice(f.lastIndexOf("."))}`); }
}
const steamMedia = (t) => t.replace(/m:steam\/([\w-]+)/g, (x, k) => steamM.get(k) || (console.warn(`[build] steam: missing media m:steam/${k}`), x));
jsOut = steamMedia(jsOut);
const jsName = `assets/app.${hash(jsOut)}.js`, cssName = `assets/styles.${hash(cssOut)}.css`;
writeFileSync(join(pub, jsName), jsOut);
writeFileSync(join(pub, cssName), cssOut);
const html = `${head.replaceAll("%%SITE_URL%%", SITE_URL).replace(/<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">\n?/, "").replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com\/css2[^"]*">/, GF_CSS ? `<style>${GF_CSS}</style>` : "$&")}<link rel="stylesheet" href="${cssName}">
<link rel="preload" href="${jsName}" as="script">
${jsonLd(SITE_URL, DATA.PROJECTS, SAME_AS)}
</head><body><!--email_off-->
${boot}
${preLine}
${content.replace("<!--WORK-->", homeWork())}
<script>/* r153b: when the opening's first line is up (.i4-pre), the bundle runs after the first paint, so the line is on
screen (its letters animate on the compositor) while the bundle is parsed; otherwise at once, as before */(function(){var s=document.createElement("script"),d=0;s.src="${jsName}";var go=function(){if(d)return;d=1;document.body.appendChild(s)};if(window.__i4t0!=null){requestAnimationFrame(function(){setTimeout(go,0)});setTimeout(go,150)}else go()})();</script>
<noscript></noscript>
<!--/email_off--></body></html>`;
writeFileSync(join(pub, "index.html"), html);
copyFileSync(src("og.jpg"), join(pub, "og.jpg"));
writeFileSync(join(pub, "robots.txt"), robotsTxt(SITE_URL));
writeFileSync(join(pub, "site.webmanifest"), manifest());
for (const f of ["icon.svg", "apple-touch-icon.png", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "favicon-spin.png", "cup-spin.png"]) copyFileSync(src(f), join(pub, f));
writeFileSync(join(pub, "favicon.ico"), icoFromPng(readFileSync(src("favicon-32.png"))));
writeFileSync(join(pub, "404.html"), `${head.split("\n").filter((l) => !l.includes("%%SITE_URL%%")).join("\n").replace(/<title>[^<]*<\/title>/, "<title>Off the map · Cromatic Studios</title>").replace(/<meta name="robots"[^>]*>/, '<meta name="robots" content="noindex">')}
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0d0c09;color:#fbfaf5;font:16px/1.5 Poppins,system-ui,sans-serif;text-align:center}h1{font-size:clamp(32px,6vw,56px);margin:.2em 0}a{display:inline-block;margin-top:18px;padding:12px 22px;border-radius:999px;background:#FED012;color:#0d0c09;font-weight:800;text-decoration:none}</style>
</head><body><main><p>404 · OFF THE MAP</p><h1>This road isn't on our map.</h1><p>Turn around, the coffee is still warm.</p><a href="/">Back to the drive</a></main></body></html>`);
// ---- the lo-fi website: /site/ and /work/<slug>/ ----
const dims = (buf) => {
  if (buf[0] === 0x89 && buf[1] === 0x50) return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
  if (buf[0] === 0xff && buf[1] === 0xd8) {
    for (let i = 2; i < buf.length - 9;) {
      if (buf[i] !== 0xff) { i++; continue; }
      const mk = buf[i + 1], len = buf.readUInt16BE(i + 2);
      if (mk >= 0xc0 && mk <= 0xcf && mk !== 0xc4 && mk !== 0xc8 && mk !== 0xcc) return [buf.readUInt16BE(i + 7), buf.readUInt16BE(i + 5)];
      i += 2 + len;
    }
  }
  // r136 (N30): films too, so a <video> can hold its place before its first frame (a lazy film that grew from 150 px
  // to its real height pushed the next chapter down: CLS 0.52 on Two Minutes)
  // mp4/mov: the first track header (tkhd) with a picture size (16.16 fixed point, in the box's last 8 bytes)
  if (buf.length > 12 && buf.toString("latin1", 4, 8) === "ftyp") {
    for (let i = buf.indexOf("tkhd"); i > 3; i = buf.indexOf("tkhd", i + 4)) {
      const end = i - 4 + buf.readUInt32BE(i - 4);
      if (end > buf.length || end - i < 80) continue;
      const w = buf.readUInt32BE(end - 8) >>> 16, h = buf.readUInt32BE(end - 4) >>> 16;
      if (w && h) return [w, h];
    }
  }
  // webm (EBML): PixelWidth (0xB0) and PixelHeight (0xBA) inside the first Video element (0xE0)
  if (buf[0] === 0x1a && buf[1] === 0x45 && buf[2] === 0xdf && buf[3] === 0xa3) {
    const vint = (i) => { let len = 1, m = 0x80; while (len <= 8 && !(buf[i] & m)) { len++; m >>= 1; } let v = buf[i] & (m - 1); for (let k = 1; k < len; k++) v = v * 256 + buf[i + k]; return [v, len]; };
    for (let i = 0, lim = Math.min(buf.length, 1 << 20) - 8; i < lim; i++) {
      if (buf[i] !== 0xe0) continue;
      const [vs, vl] = vint(i + 1);
      if (!vs || vs > 200) continue;
      let j = i + 1 + vl, w = 0, h = 0;
      while (j < i + 1 + vl + vs) {
        const [s, l] = vint(j + 1);
        if (s > 16) break;
        let v = 0; for (let k = 0; k < s; k++) v = v * 256 + buf[j + 1 + l + k];
        if (buf[j] === 0xb0) w = v; else if (buf[j] === 0xba) h = v;
        j += 1 + l + s;
      }
      if (w && h) return [w, h];
    }
  }
  return [0, 0];
};
// SVGs embedded url-encoded (not base64) never pass through extract(): write them out on demand
const svgNamed = new Map();
for (const m of js.matchAll(/([A-Za-z_$][\w$]*)\s*=\s*"data:image\/svg\+xml,([^"]+)"/g)) svgNamed.set(m[1], m[2]);
// project photography for the website's case pages: site/media/<project>/<name>.jpg, referenced
// as "m:<project>/<name>"; copied once under content-hashed names (long cache)
const mediaMap = new Map();
{
  const mroot = join(root, "site", "media");
  let dirs = [];
  try { dirs = readdirSync(mroot); } catch {}
  for (const d of dirs) {
    if (!statSync(join(mroot, d)).isDirectory()) continue;
    mkdirSync(join(pub, "assets", "m"), { recursive: true });
    for (const f of readdirSync(join(mroot, d))) {
      if (!/\.(jpe?g|png|webp|mp4|webm)$/i.test(f)) continue;
      const buf = readFileSync(join(mroot, d, f));
      const rel = `assets/m/${d}-${f.replace(/\.[^.]+$/, "")}-${hash(buf).slice(0, 8)}${f.slice(f.lastIndexOf("."))}`;
      writeFileSync(join(pub, rel), buf);
      const [w, h] = dims(buf);
      mediaMap.set(`m:${d}/${f.replace(/\.[^.]+$/, "")}`, { src: "/" + rel, w, h });
    }
  }
}
const assetCache = new Map();
const A = (name) => {
  if (!name) return null;
  if (name.startsWith("m:")) return mediaMap.get(name) || null;
  if (assetCache.has(name)) return assetCache.get(name);
  if (!named.has(name) && svgNamed.has(name)) {
    const svg = Buffer.from(decodeURIComponent(svgNamed.get(name)));
    const rel = `assets/${hash(svg)}.svg`;
    writeFileSync(join(pub, rel), svg);
    const vb = /viewBox="[\d.-]+ [\d.-]+ ([\d.]+) ([\d.]+)"/.exec(svg.toString());
    const a = { src: "/" + rel, w: vb ? Math.round(+vb[1]) : 0, h: vb ? Math.round(+vb[2]) : 0 };
    assetCache.set(name, a);
    return a;
  }
  if (!named.has(name)) return null;
  const rel = seen.get(named.get(name));
  const [w, h] = rel ? dims(readFileSync(join(pub, rel))) : [0, 0];
  const a = rel ? { src: "/" + rel, w, h } : null;
  assetCache.set(name, a);
  return a;
};
const siteSrc = (f) => join(root, "site", f);
let siteCss = readFileSync(siteSrc("site.css"), "utf8"), siteJs = readFileSync(siteSrc("site.js"), "utf8");
try {
  const { transformSync } = await import("esbuild");
  siteCss = transformSync(siteCss, { loader: "css", minify: true }).code;
  siteJs = transformSync(siteJs, { minify: true, target: "es2019" }).code;
} catch {}
const siteCssName = `assets/site.${hash(siteCss)}.css`, siteJsName = `assets/site.${hash(siteJs)}.js`;
writeFileSync(join(pub, siteCssName), siteCss);
writeFileSync(join(pub, siteJsName), siteJs);
// r143: the website's first fold stands on a still of the city (Coffee Street, one of /onboarding/'s stills): a wide cut
// for screens, a tall one for phones, hashed like the other assets so they cache for good
let heroCity = null;
try {
  const wd = (b) => { const t = b.toString("latin1", 12, 16); if (t === "VP8X") return [b.readUIntLE(24, 3) + 1, b.readUIntLE(27, 3) + 1]; if (t === "VP8 ") return [b.readUInt16LE(26) & 0x3fff, b.readUInt16LE(28) & 0x3fff]; if (t === "VP8L") { const v = b.readUInt32LE(21); return [(v & 0x3fff) + 1, ((v >> 14) & 0x3fff) + 1]; } return [0, 0]; };
  const one = (f) => { const b = readFileSync(join(root, "site", "onboarding", "media", "z", f)); const rel = `assets/hero-${f.replace(/\.webp$/, "")}.${hash(b)}.webp`; writeFileSync(join(pub, rel), b); const [w, h] = wd(b); return { src: "/" + rel, w, h }; };
  heroCity = { d: one("hero-0.webp"), m: one("hero-0-m.webp") }; // r151: the hero keeps its own framing of the 8:00 scene (coffee-0 is now shot from the kerb for /onboarding/)
} catch (e) { console.warn("[build] hero still skipped:", e.message); }
const FONTS = "https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600&family=Montserrat:wght@800;900&family=JetBrains+Mono:wght@700&display=swap";
// the drive's kinetic intro (the wall of cups). r143: no longer the website's hero; /onboarding/'s last section and the
// intro lab still play it
let kz = null;
try {
  const K = kineticBundle(js, css);
  const kjs = `assets/kinetic.${hash(K.js)}.js`, kcss = `assets/kinetic.${hash(K.css)}.css`;
  writeFileSync(join(pub, kjs), K.js);
  let kc = K.css;
  try { const { transformSync } = await import("esbuild"); kc = transformSync(kc, { loader: "css", minify: true }).code; } catch {}
  writeFileSync(join(pub, kcss), kc);
  kz = { js: "/" + kjs, css: "/" + kcss };
} catch (e) { console.warn("[build] kinetic hero skipped:", e.message.split("\n")[0]); }
// brand canvases (site/canvas/<dir>/manifest.json + element images): copied under a hashed folder
const canvases = {};
{
  const { CANVASES } = await import("../site/data.mjs");
  for (const [slug, c] of Object.entries(CANVASES)) {
    const dir = join(root, "site", "canvas", c.dir);
    let man;
    try { man = JSON.parse(readFileSync(join(dir, "manifest.json"), "utf8")); } catch { continue; }
    const files = [man.bg?.file, ...man.items.map((i) => i.file)].filter(Boolean);
    const h = hash(Buffer.concat(files.map((f) => readFileSync(join(dir, f)))));
    const outDir = join(pub, "assets", `canvas-${c.dir}-${h}`);
    mkdirSync(outDir, { recursive: true });
    for (const f of files) copyFileSync(join(dir, f), join(outDir, f));
    // r139d: each file's 1× and 1.5× copies next to it (the board is drawn at 2×), for the screen that needs less
    const cvv = await canvasVariants(dir, files, outDir, root);
    canvases[slug] = { ...man, ...cvv, base: `/assets/canvas-${c.dir}-${h}` };
  }
}
const R = makeRender({ SITE: SITE_URL, A, cssHref: "/" + siteCssName, jsHref: "/" + siteJsName, fonts: FONTS, kz, heroCity, canvases });
// r129: every work page's cover (its og:image, else its first image) goes into covers.json, for the map cards
const COVERS = {};
// r131: every page goes through the same SEO pass (head, schema.org, sizes, lazy films, lastmod)
const today = new Date().toISOString().slice(0, 10);
const LASTMOD = lastmodStore(join(root, "build", "lastmod.json"), today, root);
// r139c (N47): the source files of a page, for its lastmod (own: made from that file alone)
const srcOf = (path) => {
  const w = /^work\/([\w-]+)$/.exec(path)?.[1];
  if (w) {
    try { statSync(join(root, "site", "cases", `${w}.html`)); return { files: [`site/cases/${w}.html`], own: true }; } catch {}
    if (w === "steam") return { files: ["src/app.js", "site/media/steam"], own: false };
    const cv = DATA.CANVASES?.[w];
    if (cv) return { files: [`site/canvas/${cv.dir}`], own: true };
    return { files: ["site/data.mjs"], own: false };
  }
  if (path === "site" || path === "team") return { files: ["site/data.mjs", "site/render.mjs"], own: false };
  if (path === "privacy") return { files: ["site/render.mjs"], own: false };
  if (/^(industries|services)\//.test(path)) return { files: ["site/hubs.mjs"], own: false };
  return null;
};
const PAGES = {};
const dimCache = new Map();
const mediaDims = (src) => {
  if (!src || !src.startsWith("/assets/")) return null;
  if (dimCache.has(src)) return dimCache.get(src);
  let d = null;
  try { const [w, h] = dims(readFileSync(join(pub, src))); if (w) d = { w, h }; } catch {}
  dimCache.set(src, d);
  return d;
};
// r131: the case pages' typeface, served from here (preloaded: no late swap, no layout shift)
const DG = {};
for (const k of ["latin", "latin-ext", "vietnamese"]) {
  try { const buf = readFileSync(join(root, "site", "fonts", `darker-grotesque-${k}.woff2`)); const rel = `assets/fonts/darker-grotesque-${k}-${hash(buf).slice(0, 8)}.woff2`; mkdirSync(join(pub, "assets", "fonts"), { recursive: true }); writeFileSync(join(pub, rel), buf); DG[k] = "/" + rel; } catch {}
}
// r134: one type system everywhere (Daniel): CromaticSans (Google Sans for the bold weights, Darker Grotesque, served
// from here, for the rest) + JetBrains Mono + Montserrat for display; the same rules for the drive, the map, the website,
// every case page and /onboarding (which links /fonts.css)
// r134h: Google Sans (OFL, on Google Fonts since 2025) is CromaticSans 700–900: served from here too, Latin preloaded
const GA_ID = process.env.GA_ID ?? "G-BRW5QJTJ77";
const GTM_ID = process.env.GTM_ID ?? "GTM-K5XBHKND";
// r165 (Daniel): the build's name, shown small under the logo on the map and the website ("beta 1.6 build")
const BUILD_LABEL = process.env.BUILD_LABEL ?? "beta 3.11"; // beta 3.11 (Daniel): the mini-game, round 2 (ten fighters, both sides picked); beta 3.1 brought it (/play/gloves/), on beta 3.01
const OAI_PIXEL = process.env.OAI_PIXEL_ID ?? "8Kok98JE9jNE1Va2uAQwDG"; // r149: the OpenAI Ads measurement pixel (Cristian), a public id
const CONSENT = consentSnippet(GA_ID, GTM_ID, OAI_PIXEL);
const GS = {};
for (const k of ["latin", "latin-ext", "vietnamese"]) {
  try { const buf = readFileSync(join(root, "site", "fonts", `google-sans-${k}.woff2`)); const rel = `assets/fonts/google-sans-${k}-${hash(buf).slice(0, 8)}.woff2`; writeFileSync(join(pub, rel), buf); GS[k] = "/" + rel; } catch {}
}
const GS_ID = { "4Ua_rENHsxJlGDuGo1OIlJfC6l_24rlCK1Yo_Iqcsih3SAyH6cAwhX9RFD48TE63OOYKtrzaJ5llpynAFyo4R4o": "latin", "4Ua_rENHsxJlGDuGo1OIlJfC6l_24rlCK1Yo_Iqcsih3SAyH6cAwhX9RFD48TE63OOYKtrzaJ5lrpynAFyo4R4r0Mw": "latin-ext", "4Ua_rENHsxJlGDuGo1OIlJfC6l_24rlCK1Yo_Iqcsih3SAyH6cAwhX9RFD48TE63OOYKtrzaJ5lqpynAFyo4R4r0Mw": "vietnamese" };
const DG_URLS = { "https://fonts.gstatic.com/s/darkergrotesque/v10/U9MH6cuh-mLQlC4BKCtayOfARkSVq7HUJEUJQOM.woff2": DG.latin, "https://fonts.gstatic.com/s/darkergrotesque/v10/U9MH6cuh-mLQlC4BKCtayOfARkSVq7_UJEUJQOMuqA.woff2": DG["latin-ext"], "https://fonts.gstatic.com/s/darkergrotesque/v10/U9MH6cuh-mLQlC4BKCtayOfARkSVq77UJEUJQOMuqA.woff2": DG.vietnamese };
const localDG = (t) => t.replace(/https:\/\/fonts\.gstatic\.com\/s\/darkergrotesque\/v10\/[\w-]+\.woff2/g, (u) => DG_URLS[u] || u)
  .replace(/https:\/\/fonts\.gstatic\.com\/s\/googlesans\/v\d+\/([\w-]+)\.woff2/g, (u, id) => GS[GS_ID[id]] || u);
const CS_CSS = localDG((readFileSync(siteSrc("site.css"), "utf8").match(/@font-face\{font-family:'CromaticSans'[^}]*\}/g) || []).join(""));
writeFileSync(join(pub, "fonts.css"), `/* Cromatic Studios type: CromaticSans, Montserrat, JetBrains Mono, Cinzel */\n${CS_CSS}\n${GF_CSS}\n`);
const wpLocal = (u) => mediaMap.get("m:wp/" + u.replace(/^.*\/uploads\/(\d{4})\/(\d{2})\/(.+)\.[a-z]+$/i, "$1-$2-$3"))?.src;
// r135i (Daniel): every case page ends with "On the same street": three more projects from its street (like the
// related rail on Bepco), the street and service pages, and a "Ready for boarding" call that opens the boarding pass
// (inside the map it asks the map to open it; on its own it goes to /?map&boarding). Covers are filled in at the end
// (%%COVER:slug%%), once every page has its cover.
// r137b (Daniel): five projects (the same street first, then the next streets over), on a rail wider than the page
// that rides to the right as the page scrolls down through it; still a plain horizontal scroller by hand, by keys,
// and for prefers-reduced-motion (then it does not move on its own)
const STREET_CSS = `<style>.cz-street{box-sizing:border-box;margin:64px 0 48px;padding:0 20px;font:500 16px/1.45 CromaticSans,"Darker Grotesque",system-ui,sans-serif;color:#0d0c09}.cz-street>*{max-width:1140px;margin-left:auto;margin-right:auto}.cz-street .czs-eb{font:700 11px/1.2 'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.14em;text-transform:uppercase;opacity:.7;margin-top:0;margin-bottom:10px}.cz-street h2{font:900 clamp(30px,4.4vw,52px)/1.02 CromaticSans,system-ui,sans-serif;letter-spacing:-.02em;margin-top:0;margin-bottom:18px}.cz-street h2 span{display:inline-block;padding:.02em .22em .08em;border-radius:.22em;background:var(--czs,#FED012);transform:rotate(-1.2deg)}.cz-street>.czs-rail{box-sizing:border-box;max-width:none;display:flex;gap:16px;overflow-x:auto;overflow-y:hidden;margin:0 -20px;padding:8px max(20px,calc((100% - 1140px) / 2 + 20px)) 20px;scroll-snap-type:x proximity;scroll-padding-inline:max(20px,calc((100% - 1140px) / 2 + 20px));scrollbar-width:thin;scrollbar-color:rgba(13,12,9,.3) transparent;overscroll-behavior-x:contain;outline:0}.czs-rail.czs-live{scroll-snap-type:none}.czs-rail:focus-visible{box-shadow:inset 0 0 0 3px #119BFE;border-radius:14px}.czs-card{flex:0 0 clamp(250px,28vw,400px);scroll-snap-align:start;display:flex;flex-direction:column;border:2px solid #0d0c09;border-radius:22px;overflow:hidden;background:#fff;color:#0d0c09;text-decoration:none;transition:transform .25s cubic-bezier(.2,.8,.2,1),box-shadow .25s}.czs-card:hover{transform:translateY(-4px) rotate(-.4deg);box-shadow:0 10px 18px rgba(13,12,9,.12)}.czs-card:focus-visible{outline:3px solid #119BFE;outline-offset:2px}.czs-card img{display:block;width:100%;height:auto;max-width:none;aspect-ratio:16/10;object-fit:cover;background:#eee}.czs-card b{font:800 20px/1.15 CromaticSans,system-ui,sans-serif;padding:14px 16px 2px}.czs-card span{font-size:14px;opacity:.72;padding:0 16px 16px}.czs-card .czs-st{display:flex;align-items:center;gap:7px;padding:14px 16px 0;font:700 10.5px/1.2 'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.12em;text-transform:uppercase;font-style:normal;opacity:.7}.czs-st::before{content:"";flex:0 0 8px;height:8px;border-radius:50%;background:var(--c,#FED012)}.czs-st+b{padding-top:6px}.czs-links{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}.czs-links a{display:inline-flex;align-items:center;gap:6px;padding:10px 16px;border:2px solid #0d0c09;border-radius:999px;background:#fff;color:#0d0c09;text-decoration:none;font:800 14px/1 CromaticSans,system-ui,sans-serif}@media (max-width:760px){.cz-street>.czs-rail{gap:12px;scrollbar-width:none}.czs-rail::-webkit-scrollbar{display:none}.czs-card{flex-basis:min(76vw,340px)}.czs-card:hover{transform:none}}@media (prefers-reduced-motion:reduce){.czs-card{transition:none}}.c-visit{padding-top:clamp(32px,5vw,64px)}</style>`;
// the ride: the rail's scroll position follows the page's (rail top from 85% to 15% of the viewport = first card to
// last), eased every frame; a swipe, a wheel, a key or a focused card takes over and the ride carries on from there
function czsClient() {
  var rail = document.querySelector("[data-czs]");
  // r138d: inside the map (?embed=1) the cards and links keep the page in its frame
  if (/[?&]embed=1/.test(location.search) && rail) rail.parentNode.addEventListener("click", function (e) {
    var a = e.target.closest && e.target.closest("a[href]");
    if (!a || a.closest("[data-czb]") || a.target || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.origin !== location.origin || /[?&]embed=1/.test(a.search)) return;
    e.preventDefault(); location.href = a.pathname + (a.search ? a.search + "&" : "?") + "embed=1" + a.hash;
  });
  if (!rail || !window.requestAnimationFrame) return;
  var mq = window.matchMedia ? matchMedia("(prefers-reduced-motion: reduce)") : null;
  var live = false, cur = 0, off = 0, lastSet = -1, userT = 0, raf = 0, last = 0;
  var de = document.documentElement;
  function max() { return Math.max(0, rail.scrollWidth - rail.clientWidth); }
  function vh() { return window.innerHeight || de.clientHeight; }
  function base() {
    var r = rail.getBoundingClientRect(), h = vh();
    var b = h * 0.15, rem = Math.max(0, de.scrollHeight - (window.scrollY + h));
    var end = Math.max(b, r.top - rem), a = Math.max(h * 0.85, end + 160);
    return Math.max(0, Math.min(1, (a - r.top) / (a - end))) * max();
  }
  function set(x) { rail.scrollLeft = x; lastSet = rail.scrollLeft; }
  function frame(now) {
    raf = 0;
    if (!live || now < userT) { last = 0; return; }
    var dt = Math.min(0.05, (now - (last || now)) / 1000); last = now;
    var want = Math.max(0, Math.min(max(), base() + off));
    cur += (want - cur) * (1 - Math.exp(-dt * 9));
    if (Math.abs(want - cur) < 0.5) cur = want;
    set(cur);
    if (cur !== want) raf = requestAnimationFrame(frame); else last = 0;
  }
  function kick() { if (live && !raf) raf = requestAnimationFrame(frame); }
  function onScroll() {
    if (!live) return;
    var r = rail.getBoundingClientRect();
    // out of sight: back on the ride, no glide when it comes into view again
    if (r.bottom < -40 || r.top > vh() + 40) { off = 0; if (performance.now() >= userT) { cur = Math.max(0, Math.min(max(), base())); set(cur); } return; }
    kick();
  }
  rail.addEventListener("scroll", function () {
    if (!live || Math.abs(rail.scrollLeft - lastSet) <= 1.5) return;
    // by hand (a swipe, a wheel, the keys, a card taking focus): it stays where the hand left it
    userT = performance.now() + 450; cur = rail.scrollLeft; off = cur - base(); lastSet = -1;
    setTimeout(kick, 470);
  }, { passive: true });
  function setLive() {
    live = !(mq && mq.matches);
    rail.classList.toggle("czs-live", live);
    if (live) { off = 0; cur = Math.max(0, Math.min(max(), base())); set(cur); }
  }
  if (mq) { if (mq.addEventListener) mq.addEventListener("change", setLive); else if (mq.addListener) mq.addListener(setLive); }
  addEventListener("scroll", onScroll, { passive: true });
  addEventListener("resize", function () { if (live) { cur = Math.max(0, Math.min(max(), base() + off)); set(cur); } });
  setLive();
}
const STREET_JS = `<script>(${czsClient.toString()})();</script>`;
const HUBS_DATA = await import("../site/hubs.mjs").catch(() => ({}));
const escH = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/"/g, "&quot;");
// r138d (Daniel: "on ALL portfolio pages, absolutely all"): every case page ends the same way, whatever made it:
// the five projects, the industry and service links, the boarding ticket last. A page that is not on a street of
// the map (Eliade 18, RDW 2023) takes the street of the industry page that writes about it, and the cards and
// industry links of the whole map when none does. hasRelated is no longer used: those blocks are taken out (caseEnd).
const hubLinks = (slug, hasRelated) => {
  const proj0 = DATA.PROJECTS.find((x) => x.page === slug);
  const ind = proj0 ? (HUBS_DATA.INDUSTRIES || []).find((x) => x.street === proj0.street) : (HUBS_DATA.INDUSTRIES || []).find((x) => (x.cases || []).includes(slug) || JSON.stringify(x).includes(`/work/${slug}/`));
  const proj = proj0 || { page: slug, street: ind ? ind.street : null };
  const svcs = (HUBS_DATA.SERVICE_PAGES || []).filter((x) => (x.cases || []).includes(slug));
  const street = proj.street && DATA.STREETS?.[proj.street];
  // r137b: five neighbours: the same street first, starting after this one (each page shows different ones), then
  // the streets next door; never this page, never the small ones or those without a page
  const seen = new Set([slug]), same = [];
  const list = DATA.PROJECTS.filter((x) => x.page && !x.small && x.street === proj.street);
  const at = list.findIndex((x) => x.page === slug);
  for (let k = 1; k <= list.length && same.length < 5; k++) { const x = list[(Math.max(at, 0) + k) % list.length]; if (!seen.has(x.page)) { seen.add(x.page); same.push(x); } }
  if (same.length < 5) {
    const all = DATA.PROJECTS, at2 = Math.max(0, all.findIndex((x) => x.page === slug), proj0 ? 0 : [...slug].reduce((a, c) => a + c.charCodeAt(0), 0) % all.length);
    for (let k = 1; k <= all.length && same.length < 5; k++) { const x = all[(at2 + k) % all.length]; if (x.page && !x.small && x.street !== proj.street && !seen.has(x.page)) { seen.add(x.page); same.push(x); } }
  }
  const stTag = (x) => { const st = x.street !== proj.street && DATA.STREETS?.[x.street]; return st ? `<i class="czs-st" style="--c:${st[1]}">${escH(st[0])}</i>` : ""; };
  const cards = same.length ? `<div class="czs-rail" data-czs tabindex="0" role="region" aria-labelledby="czs-h">${same.map((x) => `<a class="czs-card" href="/work/${x.page}/"><img src="%%COVER:${x.page}%%" alt="${escH(x.name)}" loading="lazy" decoding="async" width="800" height="500">${stTag(x)}<b>${escH(x.name)}</b><span>${escH(x.cat || "")}</span></a>`).join("")}</div>` : "";
  const indL = (d) => `<a href="/industries/${d.slug}/">${escH(d.title.replace(/ in Bucharest$/, ""))} <span aria-hidden="true">→</span></a>`;
  const links = [...(ind ? [ind] : svcs.length ? [] : HUBS_DATA.INDUSTRIES || []).map(indL), ...svcs.map((x) => `<a href="/services/${x.slug}/">${escH(x.name)} <span aria-hidden="true">→</span></a>`)].join("");
  const board = BOARD_HTML;
  if (!cards && !links && !board) return "";
  return `${STREET_CSS}${board ? BOARD_CSS : ""}<section class="cz-street" aria-label="More from the studio" style="--czs:${street ? street[1] : "#FED012"}">${cards ? `<p class="czs-eb">${escH(street ? street[0] : "")}</p><h2 id="czs-h"><span>On the same street</span></h2>${cards}` : ""}${links ? `<div class="czs-links">${links}</div>` : ""}${board}</section>${cards ? STREET_JS : ""}${board ? BOARD_JS : ""}`;
};
// r136 (N25): YouTube films become a click-to-play facade on a local poster (a still of the film when we have one)
const YT_POSTERS = { "vGNSZ_aUd8w": "m:cs/Clinica-Sante", "8KtUdarL1oI": "m:pain-plaisir/anemone" };
const ytPoster = (id) => mediaMap.get(YT_POSTERS[id]) || null;
// r138d (Daniel: "remove other calls to action"): a case page's own ending goes, whichever generator made it: the
// Steam-style related rail and "What is your winning soundtrack?" card (site/cases, Steam), the "Your brand next? /
// Start a project / More work" block and the "Next case" banner (site/render.mjs). The client's own link ("Visit
// the website") in that block is content: it stays, on its own, just before the shared ending.
const caseEnd = (raw, slug) => {
  raw = raw.replace(/(?:[ \t]*<!--(?:(?!-->)[\s\S])*?-->\s*)?<section class="card (?:related|cta)"[^>]*>[\s\S]*?<\/section>\s*/g, "");
  raw = raw.replace(/<section class="c-end">[\s\S]*?<\/section>\s*/g, (m) => { const own = /<p><a class="btn" href="[^"]*" target="_blank"[^>]*>[\s\S]*?<\/a><\/p>/.exec(m); return own ? `<section class="wrap c-visit">${own[0]}</section>\n` : ""; });
  raw = raw.replace(/<a class="c2-next"[\s\S]*?<\/a>\s*/g, "");
  if (/class="card (?:related|cta)"|<section class="c-end"|class="c2-next"/.test(raw)) console.warn(`[build] work/${slug}: an own ending is still there`);
  return raw;
};
const page = (path, raw) => {
  raw = ytFacade(raw, ytPoster);
  // r138d: the shared ending is the last thing in <main>, after the page's own ending is taken out (caseEnd)
  if (path.startsWith("work/")) { raw = caseEnd(raw, path.slice(5)); const block = hubLinks(path.slice(5)); if (block && raw.includes("</main>")) { const i = raw.lastIndexOf("</main>"); raw = raw.slice(0, i) + block + "\n" + raw.slice(i); } else console.warn(`[build] ${path}: no </main>, no shared ending`); }
  const p = `/${path}/`, slug = path.replace(/^work\//, "");
  if (GF_CSS) raw = raw.replace(/<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">\n?/, "").replace(/<link rel="preload" as="style" href="https:\/\/fonts\.googleapis\.com\/css2[^"]*"[^>]*>\n?<noscript><link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com\/css2[^"]*"><\/noscript>/, `<style>${GF_CSS}</style>`);
  const text = pageText(raw);
  const lastmod = LASTMOD.get(p, text, srcOf(path));
  const project = DATA.PROJECTS.find((x) => x.page === slug);
  const r = seoPage(raw, { path: p, SITE: SITE_URL, project, media: mediaDims, lastmod, wp: wpLocal, dg: { ...DG, cs: CS_CSS } });
  // r139c: the films a visitor can play on the page, as VideoObject in its JSON-LD
  const html = videoLd(wpMirror(r.html), { path: p, SITE: SITE_URL, pub, name: project?.name || r.title.split(/ · |: /)[0] });
  PAGES[p] = { path: p, title: r.title, desc: r.desc, fullDesc: r.fullDesc, images: r.images, lastmod, text: pageText(html) };
  mkdirSync(join(pub, path), { recursive: true }); writeFileSync(join(pub, path, "index.html"), html);
  const m = path.match(/^work\/([\w-]+)$/);
  if (m) {
    const og = /<meta property="og:image" content="([^"]+)"/.exec(html)?.[1];
    const img = /<img[^>]+src="(\/assets\/[^"]+)"/.exec(html)?.[1];
    const u = (og && og.replace(SITE_URL, "")) || img;
    if (u && !/\/og\.jpg$/.test(u)) COVERS[m[1]] = u;
  }
};
for (const slug of R.slugs) page(`work/${slug}`, R.casePage(slug));
for (const slug of R.canvasSlugs) page(`work/${slug}`, R.canvasPage(slug));
// Steam keeps its own designed case study page, given a canonical URL and a way back
{
  const lit = /var steamCaseHtml = ("(?:[^"\\]|\\.)*");/.exec(js);
  if (lit) {
    let steam = steamMedia(new Function(`return ${lit[1]}`)()); // r138h: its own photos (m:steam/...)
    // r134h: the bundle escapes its closing tags as <\/script> (a string inside a script); as a page it must close for real
    // r136: the commented-out robots tag ("<!-- <meta name="robots" ...> uncomment for preview copies -->") goes, words
    // after the tag included: while it stood there, seoPage saw a robots tag and never added the real one
    steam = steam.replaceAll("<\\/script>", "</script>").replace(/<!--\s*<meta name="robots"[^>]*>[\s\S]*?-->\n?/g, "");
    // r136: Steam's own social picture (the hero film's poster), cut to 1200×630 with the other covers at the end
    const steamOg = mediaMap.get("m:wp/2025-07-Steam-Cromaticstudios-001");
    steam = steam.replace("<head>", `<head>\n<link rel="canonical" href="${SITE_URL}/work/steam/">\n<meta name="description" content="Steam Coffee Shop: a pioneer specialty coffee brand refreshed for its community. Branding, growth and product by Cromatic Studios, Bucharest.">\n${steamOg ? `<meta property="og:image" content="${SITE_URL}${steamOg.src}">\n` : ""}<link rel="icon" href="/favicon.ico" sizes="32x32">`)
      // r139a: the map opens this page in its frame (?embed=1) like the other case pages, so it gets their embed mode:
      // html.embed set before the first paint, no "← Cromatic Studios" and no top padding inside the map, and links to
      // other case pages that stay in the frame
      .replace("<head>", `<head>\n<script>(function(){try{if(/[?&]embed\\b/.test(location.search)||window.self!==window.top)document.documentElement.classList.add("embed")}catch(e){document.documentElement.classList.add("embed")}})();</script>`)
      .replace("</head>", `<style>.cs-back{position:fixed;left:14px;top:14px;z-index:9999;padding:10px 16px;border-radius:999px;background:#FED012;color:#0d0c09;border:2.5px solid #0d0c09;font:800 14px/1 system-ui,sans-serif;text-decoration:none}html.embed .cs-back{display:none}html:not(.embed) body>main.page{padding-top:64px}</style>\n</head>`)
      .replace(/<body([^>]*)>/, `<body$1>\n<a class="cs-back" href="/site/#work">← Cromatic Studios</a>`)
      .replace(/<\/body>(?![\s\S]*<\/body>)/, `<script>if(document.documentElement.classList.contains('embed'))document.querySelectorAll('a[href^="/work/"]').forEach(function(a){a.href=a.getAttribute('href')+'?embed=1'});</script>\n</body>`);
    // r138d: "Ne știm de la Steam" in a serif close to Steam's T-shirts: DM Serif Display (SIL OFL 1.1, site/fonts,
    // licence next to it), roman latin + latin-ext (ș) and the italic for "de la", from our own domain as 'Steam Serif'
    {
      const ff = [];
      for (const [k, style, range] of [["latin", "normal", "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD"], ["latin-ext", "normal", "U+0100-02BA,U+02BD-02C5,U+02C7-02CC,U+02CE-02D7,U+02DD-02FF,U+0304,U+0308,U+0329,U+1D00-1DBF,U+1E00-1E9F,U+1EF2-1EFF,U+2020,U+20A0-20AB,U+20AD-20C4,U+2113,U+2C60-2C7F,U+A720-A7FF"], ["italic-latin", "italic", "U+0000-00FF,U+0131,U+0152-0153,U+02BB-02BC,U+02C6,U+02DA,U+02DC,U+0304,U+0308,U+0329,U+2000-206F,U+20AC,U+2122,U+2191,U+2193,U+2212,U+2215,U+FEFF,U+FFFD"]]) {
        try { const buf = readFileSync(join(root, "site", "fonts", `dm-serif-display-${k}.woff2`)); const rel = `assets/fonts/dm-serif-display-${k}-${hash(buf).slice(0, 8)}.woff2`; mkdirSync(join(pub, "assets", "fonts"), { recursive: true }); writeFileSync(join(pub, rel), buf); ff.push(`@font-face{font-family:'Steam Serif';font-style:${style};font-weight:400;font-display:swap;src:url(/${rel}) format('woff2');unicode-range:${range}}`); } catch (e) { console.warn("[build] steam serif:", e.message); }
      }
      if (ff.length) steam = steam.replace("</head>", `<style>${ff.join("")}</style>\n</head>`);
      // r139a: the three serif files (43 KB) are asked for only when the line comes near (two screens ahead), not with
      // the title: until then the line, far below, is set in the same stack without 'Steam Serif'
      const SB = ".steam-big{max-width:none;font-family:'Steam Serif',";
      if (ff.length && steam.includes(SB)) steam = steam.replace(SB, ".steam-big{max-width:none;font-family:")
        .replace("</head>", `<style>.steam-big.sb-font{font-family:'Steam Serif','DM Serif Display',Didot,'Bodoni 72',Georgia,serif}</style>\n<noscript><style>.steam-big{font-family:'Steam Serif','DM Serif Display',Didot,'Bodoni 72',Georgia,serif}</style></noscript>\n</head>`)
        .replace(/<\/body>(?![\s\S]*<\/body>)/, `<script>(function(){var b=document.querySelector(".steam-big");if(!b)return;if(!("IntersectionObserver" in window)){b.classList.add("sb-font");return}var io=new IntersectionObserver(function(es){if(es[0].isIntersecting){b.classList.add("sb-font");io.disconnect()}},{rootMargin:"200% 0px 200% 0px"});io.observe(b)})();</script>\n</body>`);
      else if (ff.length) console.warn("[build] steam: the .steam-big rule changed, its serif loads with the page");
    }
    page("work/steam", steam);
  }
}
// standalone case studies in the Steam style: site/cases/<slug>.html (generated by site/cases/src/gen.mjs)
// replace the page rendered for that slug; "m:<dir>/<name>" sources point at the hashed site/media copies
const caseSlugs = [];
{
  let files = [];
  try { files = readdirSync(join(root, "site", "cases")).filter((f) => f.endsWith(".html")); } catch {}
  for (const f of files) {
    const slug = f.slice(0, -5);
    const html = readFileSync(join(root, "site", "cases", f), "utf8")
      .replaceAll("%%SITE_URL%%", SITE_URL)
      .replace(/(["'(])m:([\w-]+\/[\w.-]+)(?=["')])/g, (m, q, k) => {
        const a = mediaMap.get(`m:${k}`);
        if (!a) console.warn(`[build] work/${slug}: missing media m:${k}`);
        return q + (a ? a.src : "");
      })
      .replace(/(<meta property="og:image" content=")\//, `$1${SITE_URL}/`);
    page(`work/${slug}`, html);
    caseSlugs.push(slug);
  }
}
// r130: map places with a real photo of their own (no case page cover, or a better one)
for (const [id, k] of Object.entries({ steam: "m:cs/Steam-Cromaticstudios-1", lab: "m:tm/cubes-lab", "w-lapterra": "m:places/lapterra", "y-5": "m:places/litorsal", "y-0": "m:places/lacalut", zdrovit: "m:places/zdrovit", "w-printoteca": "m:places/printoteca", "w-zoetis": "m:places/zoetis", "w-clinicadrk": "m:places/drk", "w-sofmedica": "m:places/sofmedica", "w-medcity": "m:places/medcity", "w-stickerrepublic": "m:places/sticker", echo: "m:echo-school/cover" /* r161: a photo from the school, students laughing at an industry talk, no type (Daniel picked it) */, end: "m:vibe/from-the-stairs", scf: "m:places/scf-poster", oma: "m:places/oma", "w-venevo": "m:places/venevo", "w-witanalytica": "m:places/witanalitica", friends: "m:rdw-2023/rdw-004" })) {
  const a = mediaMap.get(k);
  if (a) COVERS["place:" + id] = a.src; else console.warn(`[build] covers: missing ${k}`);
}
writeFileSync(join(pub, "covers.json"), JSON.stringify(COVERS));
// r130n: covers by name too (map places carry names, not slugs): every project with a case page, plus its own media
{
  const { PROJECTS } = await import("../site/data.mjs");
  for (const p of PROJECTS) {
    const own = p.img && A(p.img);
    const u = (p.page && COVERS[p.page]) || (own && own.src) || null;
    if (u) COVERS["name:" + p.name.toLowerCase()] = u;
  }
  for (const [n, slug] of Object.entries({ "unde": "unde", "berero": "casa-berero", "rdw 2023": "rdw-2023", "eliade 18": "eliade-18", "steam": "steam" })) if (COVERS[slug] && !COVERS["name:" + n]) COVERS["name:" + n] = COVERS[slug];
}
writeFileSync(join(pub, "covers.json"), JSON.stringify(COVERS));
// r130j: the home page last, so its portfolio can use the covers of every case page and place
page("site", R.home(COVERS));
// r131: industry hubs (the map's streets), service pages and the team
for (const sl of R.industrySlugs) page(`industries/${sl}`, R.industryPage(sl, COVERS));
for (const sl of R.serviceSlugs) page(`services/${sl}`, R.servicePage(sl, COVERS));
page("team", R.teamPage());
// r136: the privacy policy (EN here, RO through the dictionary)
page("privacy", R.privacyPage());
const hubPaths = [...R.industrySlugs.map((x) => `/industries/${x}/`), ...R.serviceSlugs.map((x) => `/services/${x}/`), "/team/", "/privacy/"];
const workPaths = [...new Set([...R.slugs, ...R.canvasSlugs, ...caseSlugs, "steam"])].map((s) => `/work/${s}/`).sort();
// r133: the Romanian website, from the English pages and site/i18n/ro.json
const roPaths = [];
{
  const I18N = makeI18n(root);
  const enPaths = new Set(["/site/", ...hubPaths, ...workPaths].filter((p) => PAGES[p]));
  for (const p of enPaths) {
    const file = join(pub, p, "index.html");
    const en = readFileSync(file, "utf8");
    const ro = I18N.alternates(I18N.translate(en, p, SITE_URL, enPaths), p, SITE_URL, "ro");
    const rp = roPath(p);
    mkdirSync(join(pub, rp), { recursive: true });
    writeFileSync(join(pub, rp, "index.html"), ro);
    writeFileSync(file, I18N.alternates(en, p, SITE_URL, "en"));
    const t = /<title>([^<]*)<\/title>/.exec(ro)?.[1] || "", d = /<meta name="description" content="([^"]*)"/.exec(ro)?.[1] || "";
    PAGES[rp] = { path: rp, title: t, desc: d, fullDesc: d, images: PAGES[p].images, lastmod: PAGES[p].lastmod, text: pageText(ro) };
    roPaths.push(rp);
  }
  // r139c (N34): /onboarding/ in Romanian (/ro/onboarding/), through the same dictionary. Its files stay in
  // /onboarding/ (relative addresses made absolute); both copies point at each other (hreflang) and get a language
  // switch in their own header, next to the drive button (not the corner pill the case pages have)
  if (ONB) {
    const file = join(pub, "onboarding", "index.html"), rp = roPath("/onboarding/");
    // r140: its last section plays the intro's wall of cups: it gets the kinetic bundle the website uses
    let en = readFileSync(file, "utf8");
    if (kz && !en.includes("data-kz=")) en = en.replace('<section class="go" id="go"', `<section class="go" id="go" data-kz="${kz.js}|${kz.css}"`);
    // r141: the intro lab (site/onboarding/intro-lab/, not indexed, English only) plays the same cups
    try { const lf = join(pub, "onboarding", "intro-lab", "index.html"); let lh = readFileSync(lf, "utf8"); if (kz) lh = lh.replace('<div class="lab" data-kz=""', `<div class="lab" data-kz="${kz.js}|${kz.css}"`); writeFileSync(lf, lh); } catch (e) {}
    const alt = `<link rel="alternate" hreflang="en" href="${SITE_URL}/onboarding/">\n<link rel="alternate" hreflang="ro" href="${SITE_URL}${rp}">\n<link rel="alternate" hreflang="x-default" href="${SITE_URL}/onboarding/">`;
    const sw = (href, l, name) => `<a class="onb-lang" href="${href}" hreflang="${l}" lang="${l}" title="${name}" style="display:inline-flex;align-items:center;justify-content:center;min-width:40px;height:36px;margin-left:auto;margin-right:8px;padding:0 10px;border:2px solid currentColor;border-radius:999px;color:inherit;font:800 13px/1 CromaticSans,system-ui,sans-serif;letter-spacing:.04em;text-decoration:none">${l.toUpperCase()}</a>`;
    const head2 = (h, href, l, name) => h.replace("</head>", `${alt}\n</head>`).replace(/(<a class="nav-cta see-map")/, `${sw(href, l, name)}$1`);
    let ro = I18N.translate(en, "/onboarding/", SITE_URL, new Set([...enPaths, "/onboarding/"]))
      .replace(/\b(src|href|poster|data-src)="(?![a-z][\w+.-]*:|\/|#)([^"]+)"/g, '$1="/onboarding/$2"');
    ro = head2(ro, "/onboarding/", "en", "English");
    mkdirSync(join(pub, rp), { recursive: true });
    writeFileSync(join(pub, rp, "index.html"), ro);
    writeFileSync(file, head2(en, rp, "ro", "Română"));
    ONB.html = head2(en, rp, "ro", "Română");
    const t = /<title>([^<]*)<\/title>/.exec(ro)?.[1] || "", d = /<meta name="description" content="([^"]*)"/.exec(ro)?.[1] || "";
    ONB_RO = { path: rp, title: t, desc: d, fullDesc: d, images: ONB.images, html: ro };
  }
  console.log(`[i18n] ${roPaths.length} Romanian pages, ${I18N.size} translations, ${I18N.saveMissing()} blocks still in English (site/i18n/ro.missing.json)`);
}
{
  const homeText = pageText(html);
  const home = { path: "/", title: "Cromatic Studios · Branding, web & film studio in Bucharest", desc: "Independent creative studio in Bucharest: brand strategy, identity, websites and apps, video and content.", images: [`${SITE_URL}/og.jpg`], lastmod: LASTMOD.get("/", homeText, { files: ["src/content.html", "site/data.mjs"], own: false }), text: homeText };
  // r136: /onboarding, after the website's home
  const onb = ONB ? (() => { const text = pageText(ONB.html); return { ...ONB, html: undefined, text, lastmod: LASTMOD.get(ONB.path, text, { files: ["site/onboarding"], own: true }) }; })() : null;
  // r139c (N34): and its Romanian copy, with the English one's date (as every Romanian page)
  const onbRo = onb && ONB_RO ? { ...ONB_RO, html: undefined, text: pageText(ONB_RO.html), lastmod: onb.lastmod } : null;
  const order = [home, PAGES["/site/"], ...(onb ? [onb] : []), ...hubPaths.map((p) => PAGES[p]), ...workPaths.map((p) => PAGES[p]).filter(Boolean), ...roPaths.map((p) => PAGES[p]), ...(onbRo ? [onbRo] : [])];
  // r135d: each language pair also in the sitemap (Bing reads hreflang there more reliably than in the page head)
  const roSet = new Set(roPaths), pairs = new Map();
  if (onbRo) roSet.add(onbRo.path); // r139c
  for (const p of ["/site/", ...hubPaths, ...workPaths, ...(onbRo ? ["/onboarding/"] : [])]) { const rp = roPath(p); if (rp && roSet.has(rp)) { const alt = [["en", p], ["ro", rp], ["x-default", p]]; pairs.set(p, alt); pairs.set(rp, alt); } }
  writeFileSync(join(pub, "sitemap.xml"), sitemapXml(SITE_URL, order.map((e) => ({ ...e, alt: pairs.get(e.path) }))));
  writeFileSync(join(pub, "llms.txt"), llmsTxt(SITE_URL, { ...DATA, SAME_AS }, { ...PAGES, ...(onb ? { "/onboarding/": onb } : {}), ...(onbRo ? { [onbRo.path]: onbRo } : {}) }));
  writeFileSync(join(pub, "llms-full.txt"), llmsFull(SITE_URL, order));
  LASTMOD.save();
}

// r136 (N33): pages whose description had to be cut inside its first sentence want a hand-written one
if (CLIPPED.length) console.warn(`[seo] description cut mid-sentence on ${CLIPPED.length} page(s), write one for: ${CLIPPED.join(", ")}`);
// r136 (N40): a 1200×630 social picture for every page from its own cover (case pages: their og:image or first
// picture; hubs and services: their first case; the team: the studio photo). The home pages keep the designed og.jpg.
{
  const FIRST = (slugs) => (slugs || []).map((sl) => COVERS[sl]).find((u) => u && /^\/assets\/[^?#]+\.(?:jpe?g|png|webp)$/.test(u));
  const enOf = new Map(Object.keys(PAGES).map((p) => [roPath(p), p]).filter(([r]) => r));
  const PICK = { "/team/": mediaMap.get(DATA.CREW_PHOTOS?.[0]?.src)?.src };
  for (const d of HUBS_DATA.INDUSTRIES || []) PICK[`/industries/${d.slug}/`] = FIRST(d.cases);
  for (const d of HUBS_DATA.SERVICE_PAGES || []) PICK[`/services/${d.slug}/`] = FIRST(d.cases);
  const pick = (p) => { const en = enOf.get(p) || p, w = /^\/work\/([\w-]+)\/$/.exec(en); return w ? COVERS[w[1]] : PICK[en]; };
  const skip = (p) => ["/", "/site/", "/ro/", "/privacy/", "/ro/confidentialitate/"].includes(p) || p.startsWith("/onboarding/") || p.startsWith("/ro/onboarding/"); // r139c: its own card
  await socialCards(pub, root, SITE_URL, pick, skip);
}
// r139f: the home pages, /onboarding, the team, the hubs and the services share six cinematic renders of the city
// (src/og/<shot>-<en|ro>.jpg: 1200×630, ≤ 300 KB, rendered from the 3D scene at 2400×1260, the wordmark and one line
// on them, the subject in the middle for WhatsApp's square crop). The Romanian pages get the Romanian line. Case pages
// keep their own covers (above).
{
  const SHOT = { "/": "city-jet", "/site/": "city-jet", "/onboarding/": "dacia", "/team/": "olari-night",
    "/industries/coffee-food-drink/": "dacia", "/industries/finance-fintech/": "fintech", "/industries/healthcare/": "night", "/industries/print-merch/": "sketch",
    "/services/brand-strategy/": "city-jet", "/services/brand-identity/": "sketch", "/services/websites-apps/": "fintech", "/services/social-media-content/": "dacia", "/services/video-production/": "night" };
  for (const d of HUBS_DATA.INDUSTRIES || []) SHOT[`/industries/${d.slug}/`] ||= "night";
  for (const d of HUBS_DATA.SERVICE_PAGES || []) SHOT[`/services/${d.slug}/`] ||= "city-jet";
  const ALT = {
    "city-jet": ["The Cromatic Studios jet over the 3D city of Bucharest at golden hour", "Avionul Cromatic Studios deasupra orașului 3D al Bucureștiului, la apus"],
    dacia: ["A yellow Dacia 1300 on Coffee Street, in the Cromatic Studios 3D city", "O Dacia 1300 galbenă pe Coffee Street, în orașul 3D Cromatic Studios"],
    "olari-night": ["Strada Olari 9, the Cromatic Studios house, at night in the 3D city", "Strada Olari 9, casa Cromatic Studios, noaptea, în orașul 3D"],
    fintech: ["The fintech towers at dusk in the Cromatic Studios 3D city", "Turnurile fintech la apus, în orașul 3D Cromatic Studios"],
    night: ["The Cromatic Studios 3D city of Bucharest in Night Mode", "Orașul 3D al Bucureștiului de la Cromatic Studios, în Night Mode"],
    sketch: ["The Cromatic Studios 3D city drawn in Sketchbook mode", "Orașul 3D Cromatic Studios desenat în modul Sketchbook"],
  };
  const at = (s) => s.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  const urls = new Map();
  const card = (shot, lang) => {
    const k = `${shot}-${lang}`;
    if (!urls.has(k)) {
      let buf = null;
      try { buf = readFileSync(src(join("og", `${k}.jpg`))); } catch {}
      if (buf) { mkdirSync(join(pub, "assets", "og"), { recursive: true }); writeFileSync(join(pub, "assets", "og", `${k}.${hash(buf)}.jpg`), buf); }
      urls.set(k, buf ? `${SITE_URL}/assets/og/${k}.${hash(buf)}.jpg` : null);
    }
    return urls.get(k);
  };
  let n = 0;
  for (const [en, shot] of Object.entries(SHOT)) for (const [p, lang] of [[en, "en"], [en === "/" ? null : roPath(en), "ro"]]) {
    if (!p) continue;
    const f = join(pub, p, "index.html");
    let h;
    try { h = readFileSync(f, "utf8"); } catch { continue; }
    const u = card(shot, lang);
    if (!u || !/<meta property="og:image" content="/.test(h)) continue;
    const alt = at(ALT[shot][lang === "ro" ? 1 : 0]);
    h = h.replace(/(<meta property="og:image" content=")[^"]*(")/, `$1${u}$2`)
      .replace(/(<meta name="twitter:image" content=")[^"]*(")/, `$1${u}$2`)
      .replace(/<meta property="og:image:width" content="\d+">/, `<meta property="og:image:width" content="1200">`)
      .replace(/<meta property="og:image:height" content="\d+">/, `<meta property="og:image:height" content="630">`)
      .replace(/(<meta property="og:image:alt" content=")[^"]*(")/, `$1${alt}$2`)
      .replace(/(<meta name="twitter:image:alt" content=")[^"]*(")/, `$1${alt}$2`);
    if (!/og:image:width/.test(h)) h = h.replace(/(<meta property="og:image" content="[^"]+">)/, `$1\n<meta property="og:image:width" content="1200">\n<meta property="og:image:height" content="630">`);
    if (!/og:image:alt/.test(h)) h = h.replace(/(<meta property="og:image:height" content="630">)/, `$1\n<meta property="og:image:alt" content="${alt}">`);
    if (!/og:image:type/.test(h)) h = h.replace(/(<meta property="og:image" content="[^"]+">)/, `$1\n<meta property="og:image:type" content="image/jpeg">`);
    writeFileSync(f, h);
    n++;
  }
  console.log(`[og] ${n} pages with a render of the city (${urls.size} pictures)`);
}
// r139a: the covers of the shared ending's five cards are filled in before the pictures are optimised (they were
// filled in after, so every case page ended with five full-size JPEGs, 50-300 KB each, for 400 px cards)
(function covers(d) { for (const f of readdirSync(d)) { const p2 = join(d, f); if (statSync(p2).isDirectory()) { covers(p2); continue; } if (f !== "index.html") continue; const t = readFileSync(p2, "utf8"); if (t.includes("%%COVER:")) writeFileSync(p2, t.replace(/%%COVER:([\w-]+)%%/g, (m, sl) => COVERS[sl] || COVERS["name:" + ((DATA.PROJECTS.find((x) => x.page === sl) || {}).name || "").toLowerCase()] || "/og.jpg")); } })(pub);
await optimizeImages(pub, root);
(function walkDG(d) { for (const f of readdirSync(d)) { const p2 = join(d, f); if (statSync(p2).isDirectory()) { walkDG(p2); continue; } if (!/\.(css|html|js)$/.test(f)) continue; const t = readFileSync(p2, "utf8"); let n2 = localDG(t);
  // the bold weights land before the first paint: no swap, no layout shift
  // r140: and on /onboarding/ (EN and RO), whose fonts come from /fonts.css: its hero title is set in the bold weight
  const onbPage = /\.html$/.test(f) && /[\\/]onboarding[\\/]index\.html$/.test(p2);
  if (/\.html$/.test(f) && GS.latin && (n2.includes(GS.latin) || onbPage || n2.includes('class="i4-pre"')) && !n2.includes(`rel="preload" href="${GS.latin}"`)) n2 = n2.replace(/<head>|<head [^>]*>/, (h) => `${h}\n<link rel="preload" href="${GS.latin}" as="font" type="font/woff2" crossorigin>`);
  // r136 (N30): the regular weights too (Darker Grotesque), and on the hubs, services and team the mono eyebrow above
  // the fold (JetBrains Mono): their late swap moved the intro (CLS 0.11-0.15 on a slow phone)
  if (/\.html$/.test(f) && p2 !== join(pub, "index.html") && DG.latin && /<link rel="preload" href="\/assets\/fonts\/google-sans-latin/.test(n2) && !n2.includes(`rel="preload" href="${DG.latin}"`) && (n2.includes(DG.latin) || n2.includes("/assets/site.") || onbPage)) n2 = n2.replace(/(<link rel="preload" href="\/assets\/fonts\/google-sans-latin[^>]*>)/, `$1\n<link rel="preload" href="${DG.latin}" as="font" type="font/woff2" crossorigin>`);
  // r139d: and on the brand canvases (eyebrow, meta and the drag hint in mono, first screen): found late through the
  // stylesheet it lengthened the chain to the board's first paint and could move the header (CLS 0.002)
  if (/\.html$/.test(f) && (n2.includes('class="c-hero c2-hero hub-hero"') || n2.includes('class="case cv-page"'))) { const jb = gfAssets.find(([rel]) => /gf-jetbrains-mono-latin-[0-9a-f]+\.woff2$/.test(rel)); if (jb && !n2.includes(`rel="preload" href="/${jb[0]}"`)) n2 = n2.replace(/(<link rel="preload" href="\/assets\/fonts\/google-sans-latin[^>]*>)/, `$1\n<link rel="preload" href="/${jb[0]}" as="font" type="font/woff2" crossorigin>`); }
  // nothing is fetched from Google Fonts any more: no early connection to it either
  if (/\.html$/.test(f)) n2 = n2.replace(/<link rel="preconnect" href="https:\/\/fonts\.(?:gstatic|googleapis)\.com"[^>]*>\n?/g, "");
  if (/\.html$/.test(f) && n2.includes("%%COVER:")) n2 = n2.replace(/%%COVER:([\w-]+)%%/g, (m, sl) => COVERS[sl] || COVERS["name:" + ((DATA.PROJECTS.find((x) => x.page === sl) || {}).name || "").toLowerCase()] || "/og.jpg");
  // r135c: case pages start their big film when opened from the map, and stop everything when closed
  if (/\.html$/.test(f) && /[\\/](work|proiecte)[\\/]/.test(p2) && !n2.includes("r135c-film") && n2.includes("</body>")) n2 = n2.replace(/<\/body>(?![\s\S]*<\/body>)/, `<!--r135c-film-->${FILM_AUTO}\n</body>`);
  // r139c (N49): the small footer (Privacy, Cookies, the other language) on every page of the website and every case page
  if (/\.html$/.test(f)) n2 = withFooter(n2, relative(pub, p2), SITE_URL);
  // r134h: GA4 behind the cookie card, on every page (Daniel: G-BRW5QJTJ77, stream "Cromatic Studios COM - GA4")
  if (/\.html$/.test(f) && CONSENT && !n2.includes('id="cz-ck-css"') && n2.includes("</body>")) n2 = n2.replace(/<\/body>(?![\s\S]*<\/body>)/, `${CONSENT}\n</body>`);
  // r139q (Daniel: "avoid swipe-to-refresh on mobile as much as possible"): no pull-to-refresh and no scroll chaining
  // past the page's ends, on every page (Chrome/Android and Safari 16+ honour it; elsewhere it is ignored)
  if (/\.html$/.test(f) && !n2.includes('id="cz-ob"') && n2.includes("</head>")) n2 = n2.replace("</head>", `<style id="cz-ob">html,body{overscroll-behavior-y:none}</style>\n</head>`);
  // r165: the build label: a meta every page carries (the map reads it), and under the website's logo
  if (/\.html$/.test(f) && BUILD_LABEL && !n2.includes('name="cz-build"') && n2.includes("</head>")) {
    n2 = n2.replace("</head>", `<meta name="cz-build" content="${BUILD_LABEL}">\n<style id="cz-bl">.brand{position:relative}.cz-build{position:absolute;right:0;left:auto;text-align:right;top:100%;margin-top:3px;font:500 9px/1 "JetBrains Mono",ui-monospace,monospace;letter-spacing:.1em;opacity:.38;color:currentColor;white-space:nowrap;pointer-events:none;mix-blend-mode:normal}</style>\n</head>`);
    n2 = n2.replace(/(<a class="brand" href="\/(?:site\/|ro\/(?:site\/)?)"[^>]*>[\s\S]*?)(<\/a>)/, `$1<span class="cz-build" translate="no">${BUILD_LABEL} build</span>$2`);
  }
  // long titles lose the studio suffix first in Google (~60 characters show); the brand stays in og:site_name and the schema
  if (/\.html$/.test(f)) n2 = n2.replace(/<title>([^<]*?) · Cromatic Studios<\/title>/, (m, t0) => (t0.length + 19 > 66 ? `<title>${t0}</title>` : m));
  if (n2 !== t) writeFileSync(p2, n2); } })(pub);
// r140: /rapoarte, private client reports (site/rapoarte/**, copied as is AFTER the pass above: no footer, no
// cookie card, no GA4). Unguessable folder names, noindex in the page and in the server headers, never in the sitemap
{
  const base = join(root, "site", "rapoarte");
  (function walk(d, rel) { let fs = []; try { fs = readdirSync(d); } catch { return; } for (const f of fs) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p, rel + f + "/"); else { mkdirSync(join(pub, "rapoarte", rel), { recursive: true }); copyFileSync(p, join(pub, "rapoarte", rel, f)); } } })(base, "");
}
// beta 3.1 (Daniel): "at the gloves with I O N", the Two Min Lab mini-game: its own page, /play/gloves/, with its own
// script and styles (src/minigame.js + .css, minified, hashed), so the map's bundle does not carry it: the map opens
// the page in its case frame only when the game is asked for. Written after the pass above: no footer, no cookie card
// (it sets nothing and measures nothing), never in the sitemap
{
  let mj = "", mc = "";
  try { mj = readFileSync(src("minigame.js"), "utf8"); mc = readFileSync(src("minigame.css"), "utf8"); } catch (e) { console.warn("[build] minigame:", e.message); }
  if (mj) {
    try { const { transformSync } = await import("esbuild"); mj = transformSync(mj, { minify: true, target: "es2020", legalComments: "none" }).code; mc = transformSync(mc, { loader: "css", minify: true, legalComments: "none" }).code; } catch (e) { console.warn("[build] minigame not minified:", e.message.split("\n")[0]); }
    const mjName = `assets/minigame.${hash(mj)}.js`, mcName = `assets/minigame.${hash(mc)}.css`;
    writeFileSync(join(pub, mjName), mj); writeFileSync(join(pub, mcName), mc);
    mkdirSync(join(pub, "play", "gloves"), { recursive: true });
    writeFileSync(join(pub, "play", "gloves", "index.html"), `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover, user-scalable=no">
<title>At the gloves with I O N · Two Min Lab · Cromatic Studios</title>
<meta name="description" content="A small 16-bit fighting game from the Two Min Lab: pick Daniel, Cristian or Coz from the Cromatic crew and box I O N, the founder of Two Minutes.">
<meta name="robots" content="noindex, follow">
<meta name="theme-color" content="#0b0816">
${BUILD_LABEL ? `<meta name="cz-build" content="${BUILD_LABEL}">\n` : ""}<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/${mcName}">
</head><body>
<div id="mg" class="mg"></div>
<noscript><p style="color:#fff;font:16px/1.4 system-ui;padding:24px">The game needs JavaScript. <a href="/?map" style="color:#FED012">Back to the map</a></p></noscript>
<script src="/${mjName}"></script>
</body></html>
`);
    console.log(`[minigame] /play/gloves/ -> ${mjName} (${(mj.length / 1024).toFixed(0)} KB), ${mcName}`);
  }
}
// precompress text files once, at build time (the server just picks the right variant)
const COMP = /\.(html|js|css|svg|txt|xml|json|webmanifest|ico)$/;
(function walk(d) {
  for (const f of readdirSync(d)) {
    const p = join(d, f);
    if (statSync(p).isDirectory()) { walk(p); continue; }
    if (!COMP.test(f)) continue;
    const buf = readFileSync(p);
    writeFileSync(p + ".br", zlib.brotliCompressSync(buf, { params: { [zlib.constants.BROTLI_PARAM_QUALITY]: 11, [zlib.constants.BROTLI_PARAM_SIZE_HINT]: buf.length } }));
    writeFileSync(p + ".gz", zlib.gzipSync(buf, { level: 9 }));
  }
})(pub);
console.log(`public/ -> ${n} assets (${(bytes / 1048576).toFixed(2)} MB), app ${(jsOut.length / 1048576).toFixed(2)} MB, styles ${(cssOut.length / 1024).toFixed(0)} KB, site ${SITE_URL}`);
