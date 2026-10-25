// Builds the site from src/.
//   node build/build.mjs            -> public/  (production: assets split out, hashed, cache-friendly)
//   node build/build.mjs --single F -> F       (one self-contained HTML file, for local viewing)
import { readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync, existsSync } from "node:fs";
import { createHash } from "node:crypto";
import zlib from "node:zlib";
import { readdirSync, statSync } from "node:fs";
import { dirname, join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
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
// TASK-119: the photo mode (behind ?photo), its own module and styles, laid before the app like nav2
const PHOTO_JS = (() => { try { return readFileSync(src("photo.js"), "utf8"); } catch { return ""; } })();
const PHOTO_CSS = (() => { try { return readFileSync(src("photo.css"), "utf8"); } catch { return ""; } })();
// polite-city: Polite City's layer (?world=polite), its own module and styles, laid before the app like nav2 and photo
const POLITE_JS = (() => { try { return readFileSync(src("polite.js"), "utf8"); } catch { return ""; } })();
const POLITE_CSS = (() => { try { return readFileSync(src("polite.css"), "utf8"); } catch { return ""; } })();
// r231 (Daniel, Lottie across the site): the site's Lottie layer (src/lottie-ui): the shared player's host (czl.js), the
// pieces' host code, their styles; the pieces' JSON (design/lottie-ui/_source) are hashed into /assets below
const LUI_HOST = ["czl.js", "finale.js", "pill.js", "micro.js", "welcome.js", "game.js"]; // (TASK-007: welcome.js, the map's welcome card; TASK-009: game.js, into the arcade game and back out)
const LUI_JS = LUI_HOST.map((f) => { try { return readFileSync(join(root, "src", "lottie-ui", f), "utf8"); } catch { return ""; } }).join("\n");
const LUI_CSS = ["czl.css", "pt.css"].map((f) => { try { return readFileSync(join(root, "src", "lottie-ui", f), "utf8"); } catch { return ""; } }).join("\n");
// r233 (Daniel, Lottie: the pill transitions): the website's half, inlined first thing in every page's <body> (walkDG)
const PT_SITE = (() => { try { return { js: readFileSync(join(root, "src", "lottie-ui", "pt-site.js"), "utf8"), css: readFileSync(join(root, "src", "lottie-ui", "pt.css"), "utf8") }; } catch { return null; } })();
const js = readFileSync(src("app.js"), "utf8");
const content = readFileSync(src("content.html"), "utf8").replace(/<!--[\s\S]*?-->\s*/, "").replace(/\b\d+ case studies\b/g, `${CASE_COUNT} case studies`);
// r223 (Daniel, the Lottie intro): the first paint is the opening's own ground (src/intro/boot.js + boot.css, inlined
// below); the brewing cup (r136c) and the opening's first line painted from the HTML (r153, .i4-pre) are gone with
// the old intro
// TASK-074 (Daniel, 21 Oct): the Zdrovit brands have no portfolio card (not in PROJECTS) but some have a case page: as
// projects of Medical Avenue for the pages' own SEO, their "On the same street" ending, the home page's JSON-LD and llms.txt
const ZB_PROJ = (DATA.ZDROVIT_BRANDS || []).filter((b) => b.page).map((b) => ({ name: b.name, cat: b.cat || "Zdrovit · Beauty & Supplement Park", desc: b.desc || b.line, page: b.page, street: "C", zdrovit: true }));
const PROJ_ALL = [...DATA.PROJECTS, ...ZB_PROJ];
// the text version's portfolio, from site/data.mjs (every case study linked, grouped by street)
const homeWork = () => {
  const e = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const seen = new Set();
  return Object.entries(DATA.STREETS).map(([k, [street]]) => {
    const list = DATA.PROJECTS.filter((p) => p.street === k && !p.small && !p.wip && !(p.page && seen.has(p.page)) && (p.page ? seen.add(p.page) : true));
    if (!list.length) return "";
    const zd = (p) => (p.name === "Zdrovit" && DATA.ZDROVIT_BRANDS?.length ? ` Its brands: ${DATA.ZDROVIT_BRANDS.map((b) => (b.page ? `<a href="/work/${b.page}/">${e(b.name)}</a>` : e(b.name))).join(", ")}.` : ""); // TASK-074
    return `    <h3>${e(street)}</h3>\n    <ul>\n${list.map((p) => `      <li>${p.page ? `<a href="/work/${p.page}/"><strong>${e(p.name)}</strong></a>` : `<strong>${e(p.name)}</strong>`} (${e(p.cat.toLowerCase())}): ${e(p.desc)}${zd(p)}</li>`).join("\n")}\n    </ul>`;
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
  const html = `${h}<style>${css}\n${NAV2_CSS}\n${PHOTO_CSS}\n${POLITE_CSS}\n${LUI_CSS}</style>\n</head><body>\n${content}\n<script>${NAV2_JS}\n${PHOTO_JS}\n${POLITE_JS}\n${LUI_JS}\n${js}<\/script>\n</body></html>`; // nav2 (r223: no loader in the single file: the app shows the map when ready)
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
// TASK-053 (audit 3.86): two PNGs of the bundle that the map page fetches with the page (the Slow Coffee window's SLOW
// mark and its 2023 badge, ~73 KB each) ship as lossless WebP: the same pixels, about half the bytes. As the pages' WebP
// copies (images.mjs), they are made with sharp on the studio's machine and kept in site/.img-cache by content hash
// (<sha1 12>-ll.webp); the server only copies them. Listed by the PNG's own content hash (its old asset name)
const BUNDLE_WEBP = new Set(["2def44f1a5", "93d1d808f4"]);
const webpOf = new Map(); // base64 of a listed PNG -> its WebP
{
  const cacheDir = join(root, "site", ".img-cache");
  let sharp = null;
  for (const m of js.matchAll(/data:image\/png;base64,([A-Za-z0-9+/=]+)/g)) {
    if (webpOf.has(m[1])) continue;
    const png = Buffer.from(m[1], "base64");
    if (!BUNDLE_WEBP.has(hash(png))) continue;
    const cached = join(cacheDir, `${createHash("sha1").update(png).digest("hex").slice(0, 12)}-ll.webp`);
    if (!existsSync(cached)) {
      if (sharp === null) try { sharp = (await import("sharp")).default; } catch { sharp = false; }
      if (!sharp) { console.warn(`[build] ${hash(png)}.png: no WebP in site/.img-cache and no sharp here, the PNG ships`); continue; }
      mkdirSync(cacheDir, { recursive: true });
      await sharp(png).webp({ lossless: true, effort: 6 }).toFile(cached);
    }
    const webp = readFileSync(cached);
    if (webp.length < png.length) webpOf.set(m[1], webp);
  }
}
const extract = (text) => text.replace(/data:(image\/(?:png|jpeg|webp|gif|svg\+xml)|video\/(?:mp4|webm));base64,([A-Za-z0-9+/=]+)/g, (m, mime, b64) => {
  if (seen.has(b64)) return seen.get(b64);
  const webp = mime === "image/png" && webpOf.get(b64);
  const buf = webp || Buffer.from(b64, "base64");
  const name = `assets/${hash(buf)}.${webp ? "webp" : EXT[mime]}`;
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
let jsOut = NAV2_JS + "\n" + PHOTO_JS + "\n" + POLITE_JS + "\n" + LUI_JS + "\n" + lazy(extract(js)); // nav2, r231 the Lottie layer
// TASK-074: the brands of the Zdrovit park come from site/data.mjs (one list for the map, the drive and the website)
{
  const before = jsOut.length;
  jsOut = jsOut.replace("var ZDROVIT_BRANDS = [];", () => `var ZDROVIT_BRANDS = ${JSON.stringify(DATA.ZDROVIT_BRANDS || []).replace(/[\u0080-\uffff]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"))};`);
  if (jsOut.length === before) console.warn("[build] ZDROVIT_BRANDS not found in app.js (the Zdrovit card lists no brands)");
}
// r139a: the map opens Steam's built page (/work/steam/?embed=1) like every other case page; the page kept as a string
// in app.js is read from the source below (page "work/steam") and is only the fallback of the single-file copy, so the
// production bundle ships it empty (~57 KB less)
{
  const before = jsOut.length;
  jsOut = jsOut.replace(/var steamCaseHtml = "(?:[^"\\]|\\.)*";/, 'var steamCaseHtml = "";');
  if (jsOut.length === before) console.warn("[build] steamCaseHtml not found in the bundle (nothing to drop)");
}
// r223: the r142 opening engine (site/onboarding/intro-lab/engine.js) is no longer laid before the app: the opening is
// the Lottie loader now (src/intro); the intro lab keeps its own copy of the engine
let cssOut = extract(css) + "\n" + NAV2_CSS + "\n" + PHOTO_CSS + "\n" + POLITE_CSS + "\n" + LUI_CSS; // nav2, r231 the Lottie layer
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
// polite-city: Polite City's radio (Sorin: radio.js, manifest.json, audio/*.webm + .m4a; refs/gta-world/radio), copied as is to
// /assets/polite-radio/. radio.js fetches by the manifest's relative paths; nothing loads or plays until the visitor turns
// the radio on inside Polite City (src/polite.js)
{
  const base = join(root, "site", "polite-radio");
  (function walk(d, rel) { let fs = []; try { fs = readdirSync(d); } catch { return; } for (const f of fs) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p, rel + f + "/"); else { mkdirSync(join(pub, "assets", "polite-radio", rel), { recursive: true }); copyFileSync(p, join(pub, "assets", "polite-radio", rel, f)); } } })(base, "");
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
// beta 3.48 r217 (Daniel, QA round 2): a WebM film whose H.264 twin (same name, .mp4) is in the mirror plays from both, as
// <source>s. The MP4 goes first for the films WebKit could not play as WebM (MP4_FIRST: the Bepco loops were 4:4:4 VP9,
// two grey boxes on an iPhone; their twins are full size); the other twins are lighter 1280 px fallbacks for browsers with
// no WebM at all (Safari on iPhones before iOS 17.4) and go second, so nobody else gets a smaller picture.
// "<name>-poster.jpg" next to them is the poster when the tag has none
const MP4_FIRST = new Set(["2025/06/Bepco_A", "2025/06/Bepco_B"]);
const videoSources = (html) => html.replace(/<video\b([^>]*?)\ssrc="(\/wp-content\/uploads\/(\d{4}\/\d{2})\/([\w.-]+)\.webm)"([^>]*)>(?=<\/video>)/g, (m, a, src, ym, name, b) => {
  if (!WP_MIRROR.has(`${ym}/${name}.mp4`)) return m;
  const poster = !/\sposter=/.test(a + b) && WP_MIRROR.has(`${ym}/${name}-poster.jpg`) ? ` poster="/wp-content/uploads/${ym}/${name}-poster.jpg"` : "";
  const mp4 = `<source src="/wp-content/uploads/${ym}/${name}.mp4" type="video/mp4">`, webm = `<source src="${src}" type="video/webm">`;
  return `<video${a}${poster}${b}>${MP4_FIRST.has(`${ym}/${name}`) ? mp4 + webm : webm + mp4}`;
});
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
// beta 3.16: the bundle's own pictures by absolute path: while a page or the game is open over the map the address
// bar shows its address (/work/<page>/, /play/gloves/, r161), and a picture loaded then (a phone turned) must not be
// looked for under it
jsOut = jsOut.replace(/"assets\/([0-9a-f]{10}\.(?:png|jpe?g|webp|gif|svg|mp4|webm))"/g, '"/assets/$1"');
const jsName = `assets/app.${hash(jsOut)}.js`, cssName = `assets/styles.${hash(cssOut)}.css`;
// r223 (Daniel, the Lottie intro A as the site's loader): src/intro holds the opening (intro-{desktop,phone}.json and the
// worlds' pictures, made by design/intro-lottie/_source/build2.mjs), the player (lottie-web 5.12.2's worker build, MIT,
// vendored and patched for images in the worker) and the loader (boot.js + boot.css), inlined first thing in <body> so
// the ground paints with the HTML; the player and the opening load beside the app, never before it
let introHead = "", introBody = "", introEarly = "", LUI_CFG = null;
// (TASK-062: the case pages' own pieces, metro-*, stay out of the map's and /onboarding/'s inline config)
const czlMapCfg = (c) => ({ ...c, j: Object.fromEntries(Object.entries(c.j).filter(([k]) => !k.startsWith("metro-") && !k.startsWith("ooh-"))) }); // (TASK-069: and ooh-*)
{
  try {
    const { transformSync } = await import("esbuild");
    const dir = src("intro");
    const put = (name, buf) => { const dot = name.lastIndexOf("."), rel = `assets/${name.slice(0, dot)}.${hash(buf)}${name.slice(dot)}`; writeFileSync(join(pub, rel), buf); return "/" + rel; };
    const player = put("lottie-worker.js", Buffer.from(transformSync(readFileSync(join(dir, "vendor", "lottie_worker.js"), "utf8"), { minify: true, target: "es2017", legalComments: "inline" }).code));
    const cfg = { player, json: {}, pjson: {}, mk: {}, atlas: {}, size: {}, pill: {}, first: {}, brand: {} };
    for (const ab of ["desktop", "phone"]) {
      const j = JSON.parse(readFileSync(join(dir, `intro-${ab}.json`), "utf8"));
      cfg.atlas[ab] = put(`intro-worlds-${ab}.webp`, readFileSync(join(dir, `worlds-${ab}.webp`)));
      cfg.size[ab] = [j.w, j.h]; cfg.pill[ab] = j.cromatic.pill;
      // 3.69: the text the page paints first (the opening's first line; the brand line over a returning visitor's pill)
      if (j.cromatic.first) cfg.first[ab] = j.cromatic.first;
      if (j.cromatic.brand) cfg.brand[ab] = j.cromatic.brand;
      cfg.json[ab] = put(`intro-${ab}.json`, Buffer.from(JSON.stringify(j)));
      // 3.7x: the markers here (the page no longer parses the opening: the worker does), and the returning visitor's
      // pill alone (build4.mjs pillOnly: its segments' layers, the same frames)
      cfg.mk[ab] = j.cromatic.markers;
      try { cfg.pjson[ab] = put(`intro-${ab}-pill.json`, Buffer.from(JSON.stringify(JSON.parse(readFileSync(join(dir, `intro-${ab}-pill.json`), "utf8"))))); } catch (e) {}
    }
    // 3.69: that text's face is the site's own CromaticSans latin file (the same address the site's CSS uses, written by
    // the CromaticSans step below), preloaded so the first paint has it
    const gsLatin = `/assets/fonts/google-sans-latin-${hash(readFileSync(join(root, "site", "fonts", "google-sans-latin.woff2"))).slice(0, 8)}.woff2`;
    introHead = `<link rel="preload" href="${gsLatin}" as="font" type="font/woff2" crossorigin><style>${transformSync(readFileSync(join(dir, "boot.css"), "utf8").replace("%%CZI_FONT%%", gsLatin), { loader: "css", minify: true }).code.trim()}</style>`;
    // r231: the site's Lottie pieces (src/lottie-ui/*.json) and the same player, for window.czL (src/lottie-ui/czl.js)
    const lcfg = { player, j: {}, atlas: cfg.atlas.phone }; // (atlas: the worlds' previews, for /onboarding/'s Multiverse)
    try { for (const f of readdirSync(join(root, "src", "lottie-ui")).filter((x) => x.endsWith(".json")).sort()) lcfg.j[f.slice(0, -5)] = put(`lottie-${f}`, Buffer.from(JSON.stringify(JSON.parse(readFileSync(join(root, "src", "lottie-ui", f), "utf8"))))); } catch (e) { console.warn("[build] lottie-ui:", e.message); }
    LUI_CFG = lcfg;
    // TASK-014 (perf-rest, the opening on a slow network): the opening's data and player have the line before the app's
    // bundle. The bundle runs only once the opening is under way (the script at the end of <body>), yet it was preloaded from
    // the head and took the line from the start: on a phone at slow 4G the opening's data (asked for once styles.css was in,
    // at ~1.1 s) came in at ~3.4 s, sharing it with the bundle's 0.4 MB. Now the head decides (with boot.js's own rules: no
    // opening in a frame, for ?drive / ?onb / ?nointro or with reduced motion): without the opening the bundle is preloaded
    // here, at once, as before; with it, boot.js asks for the bundle (window.__cziAppGo) once the opening's data and player
    // are in (or it cannot play, or after 6 s). INTRO_HEAD_FETCH: the opening's data asked for from here at once, instead of
    // by boot.js once the stylesheet is in (measured: at once it shared the line with the render-blocking styles.css, and the
    // first paint came ~0.3 s later under the DevTools slow-4G model, for a first frame ~0.1 s sooner)
    const INTRO_HEAD_FETCH = false;
    const pre = { j: cfg.json, p: cfg.pjson, pl: player, app: "/" + jsName, now: INTRO_HEAD_FETCH };
    introEarly = `<script>/* TASK-014: the app's bundle after the opening's data (see build/build.mjs) */(function(){var C=${JSON.stringify(pre)},pl=function(h,hi){var l=document.createElement("link");l.rel="preload";l.as="script";l.href=h;if(hi)l.fetchPriority="high";document.head.appendChild(l)},A=0,ap=function(){if(!A){A=1;pl(C.app,1)}};window.__cziAppGo=ap;try{var q=location.search;if(/[?&](drive|onb|nointro)\\b/.test(q)||window.parent!==window||typeof fetch==="undefined"||typeof Worker==="undefined")return ap();var ask=/[?&]intro\\b/.test(q),rm=false;try{rm=!ask&&matchMedia("(prefers-reduced-motion: reduce)").matches}catch(e){}if(rm)return ap();if(!C.now)return;var seen=0;try{seen=+localStorage.getItem("cz-intro-at")||0}catch(e){}var full=ask||(!/[?&]map\\b/.test(q)&&Date.now()-seen>=216e5),ab=innerWidth>=innerHeight?"desktop":"phone",u=full||!C.p[ab]?C.j[ab]:C.p[ab];window.__cziPre={url:u,p:fetch(u).then(function(r){if(!r.ok)throw 0;return r.arrayBuffer()})};window.__cziPre.p.catch(function(){});pl(C.pl)}catch(e){ap()}})();</script>`;
    introBody = `<script>window.__CZL_CFG=${JSON.stringify(czlMapCfg(lcfg))};window.__CZI_CFG=${JSON.stringify(cfg)};${transformSync(readFileSync(join(dir, "boot.js"), "utf8"), { minify: true, target: "es2017", legalComments: "none" }).code.trim()}</script>`;
  } catch (e) { console.warn("[build] intro:", e.message); }
}
writeFileSync(join(pub, jsName), jsOut);
writeFileSync(join(pub, cssName), cssOut);
const html = `${head.replaceAll("%%SITE_URL%%", SITE_URL).replace(/(<meta name="viewport"[^>]*>)/, (m) => (introEarly ? `${m}\n${introEarly}` : m)).replace(/<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">\n?/, "").replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com\/css2[^"]*">/, GF_CSS ? `<style>${GF_CSS}</style>` : "$&")}<link rel="stylesheet" href="${cssName}">
${introEarly ? "" : `<link rel="preload" href="${jsName}" as="script">`}
${jsonLd(SITE_URL, PROJ_ALL, SAME_AS)}
${introHead}
</head><body><!--email_off-->
${introBody}
${content.replace("<!--WORK-->", homeWork())}
<script>/* r153b (r223: the loader): the bundle runs once the opening (a first visit) or the pill (a returning visitor) is
under way, at the latest after 1.2 s (0.6 s for the pill): its long tasks must not hold the player's start; it downloads
meanwhile, preloaded (TASK-014: when the opening plays, once its data and player are in: __czIntro.appReady, boot.js);
reduced motion and no loader: at once, as before */(function(){var s=document.createElement("script"),d=0;s.src="${jsName}";s.fetchPriority="high";var go=function(){if(d)return;d=1;var Z=window.__czIntro;(Z&&Z.appReady?Z.appReady:function(f){f()})(function(){document.body.appendChild(s)})};if(window.__czIntro&&window.__czIntro.afterStart){window.__czIntro.afterStart(function(){requestAnimationFrame(function(){setTimeout(go,0)})},1200)}else if(window.__czIntro){requestAnimationFrame(function(){setTimeout(go,0)});setTimeout(go,150)}else go()})();</script>
<noscript></noscript>
<!--/email_off--></body></html>`;
writeFileSync(join(pub, "index.html"), html);
copyFileSync(src("og.jpg"), join(pub, "og.jpg"));
writeFileSync(join(pub, "robots.txt"), robotsTxt(SITE_URL));
writeFileSync(join(pub, "site.webmanifest"), manifest());
for (const f of ["icon.svg", "apple-touch-icon.png", "icon-192.png", "icon-512.png", "icon-maskable-512.png", "favicon-spin.png", "cup-spin.png"]) copyFileSync(src(f), join(pub, f));
writeFileSync(join(pub, "favicon.ico"), icoFromPng(readFileSync(src("favicon-32.png"))));
writeFileSync(join(pub, "404.html"), `${head.split("\n").filter((l) => !l.includes("%%SITE_URL%%")).join("\n").replace(/<title>[^<]*<\/title>/, "<title>Off the map · Cromatic Studios</title>").replace(/<meta name="robots"[^>]*>/, '<meta name="robots" content="noindex">')}
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0d0c09;color:#fbfaf5;font:16px/1.5 Poppins,system-ui,sans-serif;text-align:center}h1{font-size:clamp(32px,6vw,56px);margin:.2em 0}a{display:inline-block;margin:18px 4px 0;padding:12px 22px;border-radius:999px;background:#FED012;color:#0d0c09;font-weight:800;text-decoration:none}a.o{background:none;color:#fbfaf5;box-shadow:inset 0 0 0 2px #fbfaf5}</style>
</head><body><main><p>404 · OFF THE MAP</p><h1>This road isn't on our map.</h1><p>Turn around, the coffee is still warm.</p><a href="/">Back to the drive</a> <a class="o" href="/site/">The website</a> <a class="o" href="/ro/" lang="ro">Site-ul în română</a></main></body></html>`); // beta 3.46 r215 (Daniel, QA pass): the 404 also leads to the plain website, in English and in Romanian (it only led to the 3D map)
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
// TASK-067 (Daniel: the Two Minutes scene as a Lottie that loads at once): the coffee stop on /site/ and /ro/ is the drive's
// scene drawn by the site's Lottie layer (design/lottie-ui/_source/pieces/coffee.mjs, wide and tall). Its first frame is an
// SVG (src/lottie-ui/site-coffee-*.svg, ~4 KB compressed), asked for with the page at low priority, so it is on screen long
// before the section is (inline it cost the first paint ~12 ms of parsing on every visit); the player (the map's own,
// shared and cached), its host (czl.js, one small hashed file) and the piece are fetched by site.js only when the section
// comes near, after the page has loaded, and draw over the still from that same frame
let coffee = null;
try {
  const { transformSync } = await import("esbuild");
  const lu = (f) => readFileSync(join(root, "src", "lottie-ui", f), "utf8");
  if (LUI_CFG && LUI_CFG.j["site-coffee-wide"] && LUI_CFG.j["site-coffee-tall"]) {
    const code = Buffer.from(transformSync(lu("czl.js"), { minify: true, target: "es2017", legalComments: "none" }).code);
    const rel = `assets/czl-site.${hash(code)}.js`; writeFileSync(join(pub, rel), code);
    const still = (ab) => { const svg = Buffer.from(lu(`site-coffee-${ab}.svg`)), r = `assets/site-coffee-${ab}.${hash(svg)}.svg`; writeFileSync(join(pub, r), svg); const vb = /viewBox="0 0 (\d+) (\d+)"/.exec(svg.toString()); return { src: "/" + r, w: +vb[1], h: +vb[2] }; };
    coffee = { js: "/" + rel, player: LUI_CFG.player, wide: LUI_CFG.j["site-coffee-wide"], tall: LUI_CFG.j["site-coffee-tall"], still: { wide: still("wide"), tall: still("tall") } };
  }
} catch (e) { console.warn("[build] the coffee stop's Lottie skipped (the film stays):", e.message); }
const R = makeRender({ SITE: SITE_URL, A, cssHref: "/" + siteCssName, jsHref: "/" + siteJsName, fonts: FONTS, kz, heroCity, canvases, coffee });
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
const BUILD_LABEL = process.env.BUILD_LABEL ?? "beta 4.16 β"; // beta 4.16 (r302, beta only) = beta 4.15 + Polite City, the URL-only prototype (?world=polite; gta2 an alias) + Top-down as nav2's 4th view in every world (the old topK camera retired); beta 4.15 (r301, beta only) = live 4.14 + TASK-015 AVIF/LCP case pictures (r298) + the Longevity report (private); the live history is in main's label comment
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
const STREET_CSS = `<style>.cz-street{box-sizing:border-box;margin:64px 0 48px;padding:0 20px;font:500 16px/1.45 CromaticSans,"Darker Grotesque",system-ui,sans-serif;color:#0d0c09}.cz-street>*{max-width:1140px;margin-left:auto;margin-right:auto}.cz-street .czs-eb{font:700 11px/1.2 'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.14em;text-transform:uppercase;opacity:.7;margin-top:0;margin-bottom:10px}.cz-street h2{font:900 clamp(30px,4.4vw,52px)/1.02 CromaticSans,system-ui,sans-serif;letter-spacing:-.02em;margin-top:0;margin-bottom:18px}.cz-street h2 span{display:inline-block;padding:.02em .22em .08em;border-radius:.22em;background:var(--czs,#FED012);transform:rotate(-1.2deg)}.cz-street>.czs-rail{box-sizing:border-box;max-width:none;display:flex;gap:16px;overflow-x:auto;overflow-y:hidden;margin:0 -20px;padding:8px max(20px,calc((100% - 1140px) / 2 + 20px)) 20px;scroll-snap-type:x proximity;scroll-padding-inline:max(20px,calc((100% - 1140px) / 2 + 20px));scrollbar-width:thin;scrollbar-color:rgba(13,12,9,.3) transparent;overscroll-behavior-x:contain;outline:0}.czs-rail.czs-live{scroll-snap-type:none}.czs-rail:focus-visible{box-shadow:inset 0 0 0 3px #119BFE;border-radius:14px}.czs-card{position:relative;flex:0 0 clamp(250px,28vw,400px);scroll-snap-align:start;display:flex;flex-direction:column;border:1.5px solid #0d0c09;border-radius:22px;overflow:hidden;background:#fff;color:#0d0c09;text-decoration:none;box-shadow:0 3px 0 #0d0c09;translate:0 0;transition:translate .5s cubic-bezier(.34,1.56,.64,1),box-shadow .5s cubic-bezier(.34,1.56,.64,1),opacity .6s cubic-bezier(.22,1,.36,1),transform .9s cubic-bezier(.34,1.56,.64,1);-webkit-tap-highlight-color:transparent}.czs-card:hover,.czs-card:focus-visible{translate:0 -4px;box-shadow:0 7px 0 #0d0c09}.czs-card:active{translate:0 2px;box-shadow:0 1px 0 #0d0c09;transition-duration:.12s}.czs-card:focus-visible{outline:2px solid #0d0c09;outline-offset:4px}.czs-pic{display:block;overflow:hidden;border-bottom:1.5px solid #0d0c09;background:#eee}.czs-card img{display:block;width:100%;height:auto;max-width:none;aspect-ratio:16/10;object-fit:cover;background:#eee;transition:transform 1.2s cubic-bezier(.22,1,.36,1)}.czs-card:hover img,.czs-card:focus-visible img{transform:scale(1.05)}.czs-card b{font:800 20px/1.15 CromaticSans,system-ui,sans-serif;padding:14px 62px 2px 16px}.czs-card .czs-cat{font-size:14px;opacity:.72;padding:0 62px 16px 16px}.czs-go{position:absolute;right:14px;bottom:16px;width:34px;height:34px;box-sizing:border-box;border:1.5px solid #0d0c09;border-radius:50%;background:var(--czs,#FED012);overflow:hidden;font-style:normal}.czs-go::before,.czs-go::after{content:"\\2192";position:absolute;inset:0;display:grid;place-items:center;font:800 16px/1 CromaticSans,system-ui,sans-serif;color:#0d0c09;transition:translate .45s cubic-bezier(.22,1,.36,1)}.czs-go::after{translate:-120% 0}.czs-card:hover .czs-go::before,.czs-card:focus-visible .czs-go::before{translate:120% 0}.czs-card:hover .czs-go::after,.czs-card:focus-visible .czs-go::after{translate:0 0;transition-delay:.06s}.czs-rail.czs-deal:not(.czs-in) .czs-card{opacity:0;transform:translateY(22px) rotate(calc(var(--r,1) * 1.5deg))}.czs-rail.czs-deal .czs-card{transition-delay:0s,0s,calc(var(--i,0) * 75ms),calc(var(--i,0) * 75ms)}.czs-rail.czs-deal .czs-card:nth-child(even){--r:-1}.czs-card .czs-st{display:flex;align-items:center;gap:7px;padding:14px 62px 0 16px;font:700 10.5px/1.2 'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.12em;text-transform:uppercase;font-style:normal;opacity:.7}.czs-st::before{content:"";flex:0 0 8px;height:8px;border-radius:50%;background:var(--c,#FED012)}.czs-st+b{padding-top:6px}.czs-links{display:flex;flex-wrap:wrap;gap:8px;margin-top:14px}.czs-links a{display:inline-flex;align-items:center;gap:6px;padding:10px 16px;border:1.5px solid #0d0c09;border-radius:999px;background:#fff;color:#0d0c09;text-decoration:none;font:800 14px/1 CromaticSans,system-ui,sans-serif;box-shadow:0 2px 0 #0d0c09;translate:0 0;transition:translate .45s cubic-bezier(.34,1.56,.64,1),box-shadow .45s cubic-bezier(.34,1.56,.64,1),background .25s cubic-bezier(.22,1,.36,1)}.czs-links a:hover{translate:0 -2px;box-shadow:0 4px 0 #0d0c09;background:var(--czs,#FED012)}.czs-links a:active{translate:0 1px;box-shadow:0 1px 0 #0d0c09}.czs-links a span{display:inline-block;transition:translate .45s cubic-bezier(.34,1.56,.64,1)}.czs-links a:hover span{translate:3px 0}@media (max-width:760px){.cz-street>.czs-rail{gap:12px;scrollbar-width:none}.czs-rail::-webkit-scrollbar{display:none}.czs-card{flex-basis:min(76vw,340px)}}@media (hover:none){.czs-card:hover{translate:0 0;box-shadow:0 3px 0 #0d0c09}.czs-card:hover img{transform:none}}@media (prefers-reduced-motion:reduce){.czs-card,.czs-card img,.czs-go::before,.czs-go::after{transition:none}.czs-rail.czs-deal .czs-card{opacity:1;transform:none}}.c-visit{padding-top:clamp(32px,5vw,64px)}</style>`;
// the ride: the rail's scroll position follows the page's (rail top from 85% to 15% of the viewport = first card to
// last), eased every frame; a swipe, a wheel, a key or a focused card takes over and the ride carries on from there
function czsClient() {
  var rail = document.querySelector("[data-czs]");
  // TASK-067: the cards are dealt in, one after another, as the rail comes into view (not with reduced motion)
  if (rail && window.IntersectionObserver && !(window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches)) {
    rail.classList.add("czs-deal");
    var dio = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { rail.classList.add("czs-in"); dio.disconnect(); } }, { rootMargin: "0px 0px -10% 0px" });
    dio.observe(rail);
  }
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
// TASK-076 (Daniel, 21 Oct): the Zdrovit brands' own pages get no portfolio card; they belong to the Zdrovit park, which
// is on Medical Avenue, so they end on that street. Their slugs: every ZDROVIT_WEB in site/cases/src/specs27x-zdrovit-web*.mjs,
// and any brand page in DATA.ZDROVIT_BRANDS
const ZD_PAGES = new Set((DATA.ZDROVIT_BRANDS || []).map((b) => b.page).filter(Boolean));
for (const f of readdirSync(join(root, "site", "cases", "src")).filter((f) => /^specs27\d.*zdrovit-web.*\.mjs$/.test(f))) {
  try { for (const p of (await import(pathToFileURL(join(root, "site", "cases", "src", f)).href)).ZDROVIT_WEB || []) ZD_PAGES.add(p.slug); } catch (e) { console.warn("[build] zdrovit pages:", f, e.message); }
}
const hubLinks = (slug, hasRelated) => {
  const proj0 = PROJ_ALL.find((x) => x.page === slug) || (ZD_PAGES.has(slug) ? { page: slug, street: "C" } : null); // TASK-074 + TASK-076: the Zdrovit brands' pages (Medical Avenue)
  const ind = proj0 ? (HUBS_DATA.INDUSTRIES || []).find((x) => x.street === proj0.street) : (HUBS_DATA.INDUSTRIES || []).find((x) => (x.cases || []).includes(slug) || JSON.stringify(x).includes(`/work/${slug}/`));
  const proj = proj0 || { page: slug, street: ind ? ind.street : null };
  const svcs = (HUBS_DATA.SERVICE_PAGES || []).filter((x) => (x.cases || []).includes(slug));
  const street = proj.street && DATA.STREETS?.[proj.street];
  // r137b: five neighbours: the same street first, starting after this one (each page shows different ones), then
  // the streets next door; never this page, never the small ones or those without a page
  const seen = new Set([slug]), same = [];
  const list = DATA.PROJECTS.filter((x) => x.page && !x.small && x.street === proj.street);
  // (a Zdrovit page is not in the list: it starts at a place of its own, so the pages do not all show the same five)
  const at = list.findIndex((x) => x.page === slug) >= 0 || !ZD_PAGES.has(slug) || !list.length ? list.findIndex((x) => x.page === slug) : [...slug].reduce((a, c) => a + c.charCodeAt(0), 0) % list.length;
  for (let k = 1; k <= list.length && same.length < 5; k++) { const x = list[(Math.max(at, 0) + k) % list.length]; if (!seen.has(x.page)) { seen.add(x.page); same.push(x); } }
  if (same.length < 5) {
    const all = DATA.PROJECTS, at2 = Math.max(0, all.findIndex((x) => x.page === slug), proj0 ? 0 : [...slug].reduce((a, c) => a + c.charCodeAt(0), 0) % all.length);
    for (let k = 1; k <= all.length && same.length < 5; k++) { const x = all[(at2 + k) % all.length]; if (x.page && !x.small && x.street !== proj.street && !seen.has(x.page)) { seen.add(x.page); same.push(x); } }
  }
  const stTag = (x) => { const st = x.street !== proj.street && DATA.STREETS?.[x.street]; return st ? `<i class="czs-st" style="--c:${st[1]}">${escH(st[0])}</i>` : ""; };
  const cards = same.length ? `<div class="czs-rail" data-czs tabindex="0" role="region" aria-labelledby="czs-h">${same.map((x, k) => `<a class="czs-card" href="/work/${x.page}/" style="--i:${k}"><span class="czs-pic"><img src="%%COVER:${x.page}%%" alt="${escH(x.name)}" loading="lazy" decoding="async" width="800" height="500"></span>${stTag(x)}<b>${escH(x.name)}</b><span class="czs-cat">${escH(x.cat || "")}</span><i class="czs-go" aria-hidden="true"></i></a>`).join("")}</div>` : "";
  const indL = (d) => `<a href="/industries/${d.slug}/">${escH(d.title.replace(/ in Bucharest$/, ""))} <span aria-hidden="true">→</span></a>`;
  const links = [...(ind ? [ind] : svcs.length ? [] : HUBS_DATA.INDUSTRIES || []).map(indL), ...svcs.map((x) => `<a href="/services/${x.slug}/">${escH(x.name)} <span aria-hidden="true">→</span></a>`)].join("");
  const board = BOARD_HTML;
  if (!cards && !links && !board) return "";
  return `${STREET_CSS}${board ? BOARD_CSS : ""}<section class="cz-street" aria-label="More from the studio" style="--czs:${street ? street[1] : "#FED012"}">${cards ? `<p class="czs-eb">${escH(street ? street[0] : "")}</p><h2 id="czs-h"><span>On the same street</span></h2>${cards}` : ""}${links ? `<div class="czs-links">${links}</div>` : ""}${board}</section>${cards ? STREET_JS : ""}${board ? BOARD_JS : ""}`;
};
// r136 (N25): YouTube films become a click-to-play facade on a local poster (a still of the film when we have one)
const YT_POSTERS = { "vGNSZ_aUd8w": "m:cs/Clinica-Sante", "8KtUdarL1oI": "m:pain-plaisir/anemone",
  // TASK-092: the Litorsal TV spots (stills of the films, 1280x720 webp)
  "o5FE30n77WU": "m:litorsal/tv-2026-garden", "NOn4fCOub88": "m:litorsal/tv-2026-gym", "WUxLxtCo5Wc": "m:litorsal/tv-2026-10s",
  "sdIUOZ-T0pk": "m:litorsal/tv-2025-20s", "kxX_o_yme08": "m:litorsal/tv-2023-10s", "zsz1e9QMCds": "m:litorsal/tv-2019" };
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
  const project = PROJ_ALL.find((x) => x.page === slug); // TASK-074: + the Zdrovit brands' pages
  const r = seoPage(raw, { path: p, SITE: SITE_URL, project, media: mediaDims, lastmod, wp: wpLocal, dg: { ...DG, cs: CS_CSS } });
  // r139c: the films a visitor can play on the page, as VideoObject in its JSON-LD
  const html = videoSources(videoLd(wpMirror(r.html), { path: p, SITE: SITE_URL, pub, name: project?.name || r.title.split(/ · |: /)[0] })); // beta 3.48 r217: + the MP4 twins
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
// TASK-062: a case page with Lottie pieces (.frame[data-czl], the Litorsal metro mockups) gets the site's Lottie layer:
// the player's address and its pieces only (window.__CZL_CFG), and the shared host (czl.js) with the pieces' own
// script (metro.js) as one hashed file, deferred. The player and the pieces are fetched only when a frame comes near.
let czlCaseJs = null;
const czlTransform = await import("esbuild").then((m) => m.transformSync).catch(() => null);
function czlCase(html) {
  if (!LUI_CFG || !czlTransform || !html.includes('data-czl="')) return html;
  const names = [...new Set([...html.matchAll(/data-czl="([\w-]+)"/g)].map((m) => m[1]))];
  const j = Object.fromEntries(Object.entries(LUI_CFG.j).filter(([k]) => names.some((n) => k.startsWith(n + "-"))));
  if (!czlCaseJs) {
    const code = Buffer.from(czlTransform(["czl.js", "metro.js"].map((f) => readFileSync(join(root, "src", "lottie-ui", f), "utf8")).join("\n"), { minify: true, target: "es2017", legalComments: "none" }).code);
    czlCaseJs = `assets/czl-case.${hash(code)}.js`; writeFileSync(join(pub, czlCaseJs), code);
  }
  return html.replace(/<\/body>(?![\s\S]*<\/body>)/, `<script>window.__CZL_CFG=${JSON.stringify({ player: LUI_CFG.player, j })};</script><script src="/${czlCaseJs}" defer></script>\n</body>`);
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
    page(`work/${slug}`, czlCase(html));
    caseSlugs.push(slug);
  }
}
// r130: map places with a real photo of their own (no case page cover, or a better one)
for (const [id, k] of Object.entries({ steam: "m:cs/Steam-Cromaticstudios-1", lab: "m:places/two-min-lab" /* TASK-061: the stacked TWO MIN LAB lockup (the brand's own 10-years artwork) on a 4:3 sheet; the 3:1 banner showed only "MIN" in the card */, gloves: "m:tm/gloves-title" /* r201: the mini-game's title screen */, "w-lapterra": "m:places/lapterra", zdrovit: "m:places/zdrovit-park" /* TASK-074 (Daniel): the park itself from the map (the arch, the carousel, the wheel), no one brand's product; was the Maximag pack shot */, "w-printoteca": "m:places/printoteca", "w-zoetis": "m:places/zoetis", "w-clinicadrk": "m:places/drk", "w-sofmedica": "m:places/sofmedica", "w-medcity": "m:places/medcity", "w-stickerrepublic": "m:places/sticker", echo: "m:echo-school/cover" /* r161: a photo from the school, students laughing at an industry talk, no type (Daniel picked it) */, end: "m:vibe/from-the-stairs", scf: "m:places/scf-poster", oma: "m:places/oma", "w-venevo": "m:places/venevo", "w-witanalytica": "m:places/witanalitica", friends: "m:rdw-2023/rdw-004" })) {
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
  // TASK-122: the ads landings (site/landings/*.json -> /lp/<slug>/ and /ro/lp/<slug>/), after the website so the case
  // cards have their covers; through the same dictionary (their own "ro" fields added), so the count of English blocks
  // below covers them too. Never in PAGES: no sitemap, no llms.txt. GA4 and the footer come in the pass over public/
  {
    const { loadLandings } = await import("./landings.mjs");
    const LPS = loadLandings(root, { PROJECTS: DATA.PROJECTS, INDUSTRIES: HUBS_DATA.INDUSTRIES, SERVICE_PAGES: HUBS_DATA.SERVICE_PAGES, ZD_PAGES, workPaths });
    // their own layer (site/landings/lp.css, lp.js), minified once, inlined in each page (a few KB: no extra request)
    let LP_ASSETS = { css: "", js: "" };
    try {
      const css = readFileSync(join(root, "site", "landings", "lp.css"), "utf8"), js = readFileSync(join(root, "site", "landings", "lp.js"), "utf8");
      LP_ASSETS = { css, js };
      const { transformSync } = await import("esbuild");
      LP_ASSETS = { css: transformSync(css, { loader: "css", minify: true }).code.trim(), js: transformSync(js, { minify: true, target: "es2017", legalComments: "none" }).code.trim() };
    } catch (e) { console.warn("[lp] lp.css / lp.js:", e.message.split("\n")[0]); }
    for (const lp of LPS) {
      for (const n of lp.L.drive?.stills || []) if (!existsSync(join(root, "site", "onboarding", "media", `${n}.webp`))) console.warn(`[lp] ${lp.slug}: drive still "${n}" not in site/onboarding/media`);
      let en = R.landingPage({ ...lp.L, assets: LP_ASSETS }, COVERS);
      if (GF_CSS) en = en.replace(/<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">\n?/, "").replace(/<link rel="preload" as="style" href="https:\/\/fonts\.googleapis\.com\/css2[^"]*"[^>]*>\n?<noscript><link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com\/css2[^"]*"><\/noscript>/, `<style>${GF_CSS}</style>`);
      en = wpMirror(en);
      if (lp.langs.includes("en")) { mkdirSync(join(pub, "lp", lp.slug), { recursive: true }); writeFileSync(join(pub, "lp", lp.slug, "index.html"), en); }
      if (lp.langs.includes("ro")) {
        I18N.add(lp.ro);
        const rp = `/ro/lp/${lp.slug}/`;
        const ro = I18N.translate(en, lp.L.path, SITE_URL, enPaths).replaceAll(`${SITE_URL}null`, SITE_URL + rp);
        mkdirSync(join(pub, rp), { recursive: true }); writeFileSync(join(pub, rp, "index.html"), ro);
      }
      console.log(`[lp] ${lp.slug}: ${lp.langs.map((l) => (l === "ro" ? `/ro/lp/${lp.slug}/` : `/lp/${lp.slug}/`)).join(" + ")} (${lp.L.cases.length} cases, ${lp.L.proof.length} proof items)`);
    }
  }
  // r139c (N34): /onboarding/ in Romanian (/ro/onboarding/), through the same dictionary. Its files stay in
  // /onboarding/ (relative addresses made absolute); both copies point at each other (hreflang) and get a language
  // switch in their own header, next to the drive button (not the corner pill the case pages have)
  if (ONB) {
    const file = join(pub, "onboarding", "index.html"), rp = roPath("/onboarding/");
    // r140: its last section plays the intro's wall of cups: it gets the kinetic bundle the website uses
    let en = readFileSync(file, "utf8");
    if (kz && !en.includes("data-kz=")) en = en.replace('<section class="go" id="go"', `<section class="go" id="go" data-kz="${kz.js}|${kz.css}"`);
    // r232 (Daniel, Lottie: /onboarding/): its explainers, drawn by the site's Lottie layer (src/lottie-ui: the shared player's
    // host and the page's own, one hashed file) from the pieces' JSON (window.__CZL_CFG, as on the map); the Romanian copy
    // keeps them (scripts are not translated)
    if (LUI_CFG && !en.includes("__CZL_CFG")) {
      try {
        const { transformSync } = await import("esbuild");
        const code = Buffer.from(transformSync(["czl.js", "onb.js"].map((f) => readFileSync(join(root, "src", "lottie-ui", f), "utf8")).join("\n"), { minify: true, target: "es2017", legalComments: "none" }).code);
        const rel = `assets/czl-onb.${hash(code)}.js`; writeFileSync(join(pub, rel), code);
        en = en.replace(/<\/body>(?![\s\S]*<\/body>)/, `<script>window.__CZL_CFG=${JSON.stringify(czlMapCfg(LUI_CFG))};</script><script src="/${rel}" defer></script>\n</body>`);
      } catch (e) { console.warn("[build] onboarding lottie:", e.message); }
    }
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
  console.log(`[i18n] ${roPaths.length} Romanian pages, ${I18N.size} translations, ${I18N.saveMissing()} blocks still in English (site/i18n/ro.missing.json), ${I18N.sameAsEnglish()} English-equal entries to check (site/i18n/ro.same.json; ${I18N.keptEnglish} kept in English on purpose in ro.keep-en.json)`); // beta 3.48 r217
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
  // TASK-053 (Daniel): the home (the map) has no hreflang, in its <head> or here: /ro/ is the Romanian twin of /site/
  // (the same content), and a ro link from / would be one /ro/ never returns; i18n.mjs only writes the full en/ro/x-default
  // trio, so / keeps its canonical alone
  writeFileSync(join(pub, "sitemap.xml"), sitemapXml(SITE_URL, order.map((e) => ({ ...e, alt: pairs.get(e.path) }))));
  writeFileSync(join(pub, "llms.txt"), llmsTxt(SITE_URL, { ...DATA, PROJECTS: PROJ_ALL, SAME_AS }, { ...PAGES, ...(onb ? { "/onboarding/": onb } : {}), ...(onbRo ? { [onbRo.path]: onbRo } : {}) }));
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
    "/industries/coffee-food-drink/": "dacia", "/industries/finance-fintech/": "fintech", "/industries/healthcare/": "night", "/industries/print-merch/": "sketchbook",
    "/services/brand-strategy/": "city-jet", "/services/brand-identity/": "sketchbook", "/services/websites-apps/": "fintech", "/services/social-media-content/": "dacia", "/services/video-production/": "night" };
  for (const d of HUBS_DATA.INDUSTRIES || []) SHOT[`/industries/${d.slug}/`] ||= "night";
  for (const d of HUBS_DATA.SERVICE_PAGES || []) SHOT[`/services/${d.slug}/`] ||= "city-jet";
  const ALT = {
    "city-jet": ["The Cromatic Studios jet over the 3D city of Bucharest at golden hour", "Avionul Cromatic Studios deasupra orașului 3D al Bucureștiului, la apus"],
    dacia: ["A yellow Dacia 1300 on Coffee Street, in the Cromatic Studios 3D city", "O Dacia 1300 galbenă pe Coffee Street, în orașul 3D Cromatic Studios"],
    "olari-night": ["Strada Olari 9, the Cromatic Studios house, at night in the 3D city", "Strada Olari 9, casa Cromatic Studios, noaptea, în orașul 3D"],
    fintech: ["The fintech towers at dusk in the Cromatic Studios 3D city", "Turnurile fintech la apus, în orașul 3D Cromatic Studios"],
    night: ["The Cromatic Studios 3D city of Bucharest in Night Mode", "Orașul 3D al Bucureștiului de la Cromatic Studios, în Night Mode"],
    // beta 3.995 (TASK-010): the Sketchbook card redrawn in the notebook look (src/og/sketchbook-*.jpg; the graphite sketch-*.jpg are gone)
    sketchbook: ["The Cromatic Studios 3D city drawn in Sketchbook mode, ink and crayon on a notebook page", "Orașul 3D Cromatic Studios desenat în modul Sketchbook, cu tuș și creioane cerate pe o pagină de caiet"],
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
let PT_MIN = null; // (minified once, here: walkDG is not async)
if (PT_SITE) try { const { transformSync } = await import("esbuild"); PT_MIN = { js: transformSync(PT_SITE.js, { minify: true, target: "es2017", legalComments: "none" }).code.trim(), css: transformSync(PT_SITE.css, { loader: "css", minify: true }).code.trim() }; } catch (e) { PT_MIN = { js: PT_SITE.js, css: PT_SITE.css }; }
(function walkDG(d) { for (const f of readdirSync(d)) { const p2 = join(d, f); if (statSync(p2).isDirectory()) { walkDG(p2); continue; } if (!/\.(css|html|js)$/.test(f)) continue; const t = readFileSync(p2, "utf8"); let n2 = localDG(t);
  // the bold weights land before the first paint: no swap, no layout shift
  // r140: and on /onboarding/ (EN and RO), whose fonts come from /fonts.css: its hero title is set in the bold weight
  const onbPage = /\.html$/.test(f) && /[\\/]onboarding[\\/]index\.html$/.test(p2);
  if (/\.html$/.test(f) && GS.latin && (n2.includes(GS.latin) || onbPage || n2.includes("__CZI_CFG")) && !n2.includes(`rel="preload" href="${GS.latin}"`)) n2 = n2.replace(/<head>|<head [^>]*>/, (h) => `${h}\n<link rel="preload" href="${GS.latin}" as="font" type="font/woff2" crossorigin>`);
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
  // r233 (Daniel, Lottie: the pill transitions): every page of the website opens out of the map's pill when the map led
  // to it, and closes into it on the way back (src/lottie-ui/pt-site.js + pt.css, a few hundred bytes, inline so the
  // first paint has it); not the map itself (its own half is in its bundle), not the game
  if (/\.html$/.test(f) && PT_MIN && p2 !== join(pub, "index.html") && !/[\\/]play[\\/]/.test(p2) && !n2.includes('id="czpt-css"') && n2.includes("</head>") && /<body\b[^>]*>/.test(n2)) {
    n2 = n2.replace("</head>", `<style id="czpt-css">${PT_MIN.css}</style>\n</head>`).replace(/<body\b[^>]*>/, (b) => `${b}<script>${PT_MIN.js}</script>`);
  }
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
// (r211: it measures now, with the same consent card and GA4 as every page, see below), never in the sitemap
{
  let mj = "", mc = "";
  try { mj = readFileSync(src("minigame.js"), "utf8"); mc = readFileSync(src("minigame.css"), "utf8"); } catch (e) { console.warn("[build] minigame:", e.message); }
  if (mj) {
    try { const { transformSync } = await import("esbuild"); mj = transformSync(mj, { minify: true, target: "es2020", legalComments: "none" }).code; mc = transformSync(mc, { loader: "css", minify: true, legalComments: "none" }).code; } catch (e) { console.warn("[build] minigame not minified:", e.message.split("\n")[0]); }
    const mjName = `assets/minigame.${hash(mj)}.js`, mcName = `assets/minigame.${hash(mc)}.css`;
    writeFileSync(join(pub, mjName), mj); writeFileSync(join(pub, mcName), mc);
    mkdirSync(join(pub, "play", "gloves"), { recursive: true });
    // beta 3.68 (Daniel: the game full screen, without Safari's bar): its own home-screen app. On an iPhone no page can
    // hide Safari's bars; added to the Home Screen, the game opens from its own icon full screen
    for (const [f, to] of [["gloves-icon-512.png", "icon-512.png"], ["gloves-icon-192.png", "icon-192.png"], ["gloves-touch-icon.png", "touch-icon.png"]]) copyFileSync(src(f), join(pub, "play", "gloves", to));
    writeFileSync(join(pub, "play", "gloves", "app.webmanifest"), JSON.stringify({ id: "/play/gloves/", name: "2 Minutes 2 Fight w/ I O N", short_name: "2M2F", description: "A small arcade fighting game from the Two Min Lab, by Cromatic Studios.", start_url: "/play/gloves/?from=homescreen", scope: "/play/", display: "fullscreen", display_override: ["fullscreen", "standalone"], orientation: "landscape", background_color: "#0b0816", theme_color: "#0b0816", icons: [{ src: "/play/gloves/icon-192.png", sizes: "192x192", type: "image/png" }, { src: "/play/gloves/icon-512.png", sizes: "512x512", type: "image/png" }] }, null, 2));
    writeFileSync(join(pub, "play", "gloves", "index.html"), `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, viewport-fit=cover, user-scalable=no">
<title>2 Minutes 2 Fight w/ I O N · Two Min Lab · Cromatic Studios</title>
<meta name="description" content="2 Minutes 2 Fight w/ I O N: a small arcade fighting game from the Two Min Lab. Pick a fighter from the Cromatic crew and their friends and challenge I O N, the founder of Two Minutes, in front of his coffee shop.">
<meta property="og:title" content="2 Minutes 2 Fight w/ I O N">
<meta property="og:description" content="A small arcade fighting game from the Two Min Lab. Challenge I O N to a fight in front of Two Minutes, Str. C. Aricescu 50A.">
<meta property="og:type" content="website">
<meta property="og:url" content="${SITE_URL}/play/gloves/">
${mediaMap.get("m:tm/gloves-title") ? `<meta property="og:image" content="${SITE_URL}${mediaMap.get("m:tm/gloves-title").src}">\n` : ""}
<meta name="twitter:card" content="summary_large_image">
<meta name="robots" content="noindex, follow">
<meta name="theme-color" content="#0b0816">
<link rel="manifest" href="/play/gloves/app.webmanifest">
<link rel="apple-touch-icon" href="/play/gloves/touch-icon.png">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="2M2F">
${BUILD_LABEL ? `<meta name="cz-build" content="${BUILD_LABEL}">\n` : ""}<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/${mcName}">
</head><body>
<div id="mg" class="mg"></div>
<noscript><p style="color:#fff;font:16px/1.4 system-ui;padding:24px">The game needs JavaScript. <a href="/?map" style="color:#FED012">Back to the map</a></p></noscript>
${CONSENT /* r211 (Daniel: GA4 on the mini-game): the site's consent card and GA4, as on every page: nothing from Google before a yes; inside the map's frame (?embed=1) it never asks, it counts when the map already has the yes */}
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
