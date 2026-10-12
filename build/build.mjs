// Builds the site from src/.
//   node build/build.mjs            -> public/  (production: assets split out, hashed, cache-friendly)
//   node build/build.mjs --single F -> F       (one self-contained HTML file, for local viewing)
import { readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync } from "node:fs";
import { createHash } from "node:crypto";
import zlib from "node:zlib";
import { readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { jsonLd, llmsTxt, llmsFull, robotsTxt, sitemapXml, manifest, icoFromPng } from "./seo.mjs";
import { seoPage, pageText, lastmodStore, SAME_AS } from "./seo-pages.mjs";
import { consentSnippet } from "./consent.mjs";
import { FILM_AUTO } from "./film.mjs";
import * as DATA from "../site/data.mjs";
import { makeRender } from "../site/render.mjs";
import { kineticBundle } from "./kinetic.mjs";
import { optimizeImages } from "./images.mjs";
import { makeI18n, roPath } from "./i18n.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = (f) => join(root, "src", f);
// r135: live on the main domain (Daniel, 2026-10-12): drive.cromaticstudios.com and www. answer with a 301 to it
const SITE_URL = (process.env.SITE_URL || "https://cromaticstudios.com").replace(/\/$/, "");
const head = readFileSync(src("head.html"), "utf8");
const css = readFileSync(src("styles.css"), "utf8");
const js = readFileSync(src("app.js"), "utf8");
const content = readFileSync(src("content.html"), "utf8").replace(/<!--[\s\S]*?-->\s*/, "");
// the dark calibrating screen, painted before the script arrives; it steps aside as soon as the
// app has drawn its own loader on top
const boot = `<div class="boot" aria-hidden="true"><svg viewBox="0 0 120 120"><circle class="r" cx="60" cy="60" r="52"/><circle class="p" cx="60" cy="60" r="52"/><g transform="translate(44 44) scale(1.333)"><path class="s" d="M12 0 L14.6 7.2 L21.5 4.2 L17.4 10.5 L24 12 L17.4 13.5 L21.5 19.8 L14.6 16.8 L12 24 L9.4 16.8 L2.5 19.8 L6.6 13.5 L0 12 L6.6 10.5 L2.5 4.2 L9.4 7.2 Z" fill="#FED012"/></g></svg></div>
<script>(function(){var t0=Date.now();(function w(){var b=document.querySelector(".boot");if(!b)return;if(document.querySelector(".loader")||Date.now()-t0>30000){b.classList.add("gone");setTimeout(function(){b.remove()},450)}else requestAnimationFrame(w)})()})();<\/script>`;
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
  const html = `${h}<style>${css}</style>\n</head><body>\n${boot}\n${content}\n<script>${js}<\/script>\n</body></html>`;
  writeFileSync(out, html);
  console.log(`single file -> ${out} (${(html.length / 1048576).toFixed(2)} MB)`);
  process.exit(0);
}

const pub = join(root, "public");
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
let jsOut = lazy(extract(js));
let cssOut = extract(css);
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
const wpMirror = (text) => text.replace(/https:(\\?\/)\\?\/cromaticstudios\.com\\?\/wp-content\\?\/uploads\\?\/(\d{4})\\?\/(\d{2})\\?\/(?=([\w.-]+)|\$\{)/g, (m, sl, y, mo, f) => (!f || WP_MIRROR.has(`${y}/${mo}/${f}`)) ? `/wp-content/uploads/${y}/${mo}/` : m);
jsOut = wpMirror(jsOut);
const jsName = `assets/app.${hash(jsOut)}.js`, cssName = `assets/styles.${hash(cssOut)}.css`;
writeFileSync(join(pub, jsName), jsOut);
writeFileSync(join(pub, cssName), cssOut);
const html = `${head.replaceAll("%%SITE_URL%%", SITE_URL).replace(/<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">\n?/, "").replace(/<link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com\/css2[^"]*">/, GF_CSS ? `<style>${GF_CSS}</style>` : "$&")}<link rel="stylesheet" href="${cssName}">
<link rel="preload" href="${jsName}" as="script">
${jsonLd(SITE_URL, DATA.PROJECTS, SAME_AS)}
</head><body><!--email_off-->
${boot}
${content.replace("<!--WORK-->", homeWork())}
<script src="${jsName}"></script>
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
const FONTS = "https://fonts.googleapis.com/css2?family=Cinzel:wght@500;600&family=Montserrat:wght@800;900&family=JetBrains+Mono:wght@700&display=swap";
// the drive's kinetic intro, as the website's hero (loaded after the page has painted)
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
    canvases[slug] = { ...man, base: `/assets/canvas-${c.dir}-${h}` };
  }
}
const R = makeRender({ SITE: SITE_URL, A, cssHref: "/" + siteCssName, jsHref: "/" + siteJsName, fonts: FONTS, kz, canvases });
// r129: every work page's cover (its og:image, else its first image) goes into covers.json, for the map cards
const COVERS = {};
// r131: every page goes through the same SEO pass (head, schema.org, sizes, lazy films, lastmod)
const today = new Date().toISOString().slice(0, 10);
const LASTMOD = lastmodStore(join(root, "build", "lastmod.json"), today);
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
const CONSENT = consentSnippet(GA_ID, GTM_ID);
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
// r135d: every case page links to its street (industry page) and to the services it shows, so the hubs gather
// authority from the work (audit N6); same words on every page, translated with the rest for /ro/
const HUBS_DATA = await import("../site/hubs.mjs").catch(() => ({}));
const hubLinks = (slug) => {
  const proj = DATA.PROJECTS.find((x) => x.page === slug);
  const ind = proj && (HUBS_DATA.INDUSTRIES || []).find((x) => x.street === proj.street);
  const svcs = (HUBS_DATA.SERVICE_PAGES || []).filter((x) => (x.cases || []).includes(slug));
  if (!ind && !svcs.length) return "";
  const pill = (href, label) => `<a href="${href}" style="display:inline-flex;align-items:center;gap:6px;padding:10px 16px;border:2px solid #0d0c09;border-radius:999px;background:#fff;color:#0d0c09;text-decoration:none;font:800 15px/1 CromaticSans,system-ui,sans-serif">${label}<span aria-hidden="true">→</span></a>`;
  return `<nav class="cz-hubs" aria-label="More from the studio" style="box-sizing:border-box;max-width:1180px;margin:56px auto 40px;padding:22px 20px;display:flex;flex-wrap:wrap;gap:18px 34px;border-top:2px solid #0d0c09;font:500 15px/1.4 CromaticSans,system-ui,sans-serif;color:#0d0c09">${ind ? `<div style="display:flex;flex-direction:column;gap:10px"><span style="font:700 11px/1.2 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase;opacity:.7">More on ${ind.streetName}</span>${pill(`/industries/${ind.slug}/`, ind.title.replace(/ in Bucharest$/, "").replace(/&/g, "&amp;"))}</div>` : ""}${svcs.length ? `<div style="display:flex;flex-direction:column;gap:10px"><span style="font:700 11px/1.2 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.12em;text-transform:uppercase;opacity:.7">Services in this project</span><div style="display:flex;flex-wrap:wrap;gap:8px">${svcs.map((x) => pill(`/services/${x.slug}/`, x.name.replace(/&/g, "&amp;"))).join("")}</div></div>` : ""}</nav>`;
};
const page = (path, raw) => {
  if (path.startsWith("work/")) { const block = hubLinks(path.slice(5)); if (block && raw.includes("</main>")) { const i = raw.lastIndexOf("</main>"); raw = raw.slice(0, i) + block + raw.slice(i); } }
  const p = `/${path}/`, slug = path.replace(/^work\//, "");
  if (GF_CSS) raw = raw.replace(/<link rel="preconnect" href="https:\/\/fonts\.googleapis\.com">\n?/, "").replace(/<link rel="preload" as="style" href="https:\/\/fonts\.googleapis\.com\/css2[^"]*"[^>]*>\n?<noscript><link rel="stylesheet" href="https:\/\/fonts\.googleapis\.com\/css2[^"]*"><\/noscript>/, `<style>${GF_CSS}</style>`);
  const text = pageText(raw);
  const lastmod = LASTMOD.get(p, text);
  const project = DATA.PROJECTS.find((x) => x.page === slug);
  const r = seoPage(raw, { path: p, SITE: SITE_URL, project, media: mediaDims, lastmod, wp: wpLocal, dg: { ...DG, cs: CS_CSS } });
  const html = wpMirror(r.html);
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
    let steam = new Function(`return ${lit[1]}`)();
    // r134h: the bundle escapes its closing tags as <\/script> (a string inside a script); as a page it must close for real
    steam = steam.replaceAll("<\\/script>", "</script>").replace(/<!--\s*<meta name="robots"[^>]*>\s*-->/g, "");
    steam = steam.replace("<head>", `<head>\n<link rel="canonical" href="${SITE_URL}/work/steam/">\n<meta name="description" content="Steam Coffee Shop: a pioneer specialty coffee brand refreshed for its community. Branding, growth and product by Cromatic Studios, Bucharest.">\n<link rel="icon" href="/favicon.ico" sizes="32x32">`)
      .replace("</head>", `<style>body>main.page{padding-top:64px}</style>\n</head>`)
      .replace(/<body([^>]*)>/, `<body$1>\n<a href="/site/#work" style="position:fixed;left:14px;top:14px;z-index:9999;padding:10px 16px;border-radius:999px;background:#FED012;color:#0d0c09;border:2.5px solid #0d0c09;font:800 14px/1 system-ui,sans-serif;text-decoration:none">← Cromatic Studios</a>`);
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
for (const [id, k] of Object.entries({ steam: "m:cs/Steam-Cromaticstudios-1", lab: "m:tm/cubes-lab", "w-lapterra": "m:places/lapterra", "y-5": "m:places/litorsal", "y-0": "m:places/lacalut", zdrovit: "m:places/zdrovit", "w-printoteca": "m:places/printoteca", "w-zoetis": "m:places/zoetis", "w-clinicadrk": "m:places/drk", "w-sofmedica": "m:places/sofmedica", "w-medcity": "m:places/medcity", "w-stickerrepublic": "m:places/sticker", echo: "m:places/echo", end: "m:vibe/from-the-stairs", scf: "m:places/scf-poster", oma: "m:places/oma", "w-venevo": "m:places/venevo", "w-witanalytica": "m:places/witanalitica", friends: "m:rdw-2023/rdw-004" })) {
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
const hubPaths = [...R.industrySlugs.map((x) => `/industries/${x}/`), ...R.serviceSlugs.map((x) => `/services/${x}/`), "/team/"];
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
  console.log(`[i18n] ${roPaths.length} Romanian pages, ${I18N.size} translations, ${I18N.saveMissing()} blocks still in English (site/i18n/ro.missing.json)`);
}
{
  const homeText = pageText(html);
  const home = { path: "/", title: "Cromatic Studios · Branding, web & film studio in Bucharest", desc: "Independent creative studio in Bucharest: brand strategy, identity, websites and apps, video and content.", images: [`${SITE_URL}/og.jpg`], lastmod: LASTMOD.get("/", homeText), text: homeText };
  const order = [home, PAGES["/site/"], ...hubPaths.map((p) => PAGES[p]), ...workPaths.map((p) => PAGES[p]).filter(Boolean), ...roPaths.map((p) => PAGES[p])];
  // r135d: each language pair also in the sitemap (Bing reads hreflang there more reliably than in the page head)
  const roSet = new Set(roPaths), pairs = new Map();
  for (const p of ["/site/", ...hubPaths, ...workPaths]) { const rp = roPath(p); if (rp && roSet.has(rp)) { const alt = [["en", p], ["ro", rp], ["x-default", p]]; pairs.set(p, alt); pairs.set(rp, alt); } }
  writeFileSync(join(pub, "sitemap.xml"), sitemapXml(SITE_URL, order.map((e) => ({ ...e, alt: pairs.get(e.path) }))));
  writeFileSync(join(pub, "llms.txt"), llmsTxt(SITE_URL, { ...DATA, SAME_AS }, PAGES));
  writeFileSync(join(pub, "llms-full.txt"), llmsFull(SITE_URL, order));
  LASTMOD.save();
}

await optimizeImages(pub, root);
(function walkDG(d) { for (const f of readdirSync(d)) { const p2 = join(d, f); if (statSync(p2).isDirectory()) { walkDG(p2); continue; } if (!/\.(css|html|js)$/.test(f)) continue; const t = readFileSync(p2, "utf8"); let n2 = localDG(t);
  // the bold weights land before the first paint: no swap, no layout shift
  if (/\.html$/.test(f) && GS.latin && n2.includes(GS.latin) && !n2.includes(`rel="preload" href="${GS.latin}"`)) n2 = n2.replace(/<head>|<head [^>]*>/, (h) => `${h}\n<link rel="preload" href="${GS.latin}" as="font" type="font/woff2" crossorigin>`);
  // nothing is fetched from Google Fonts any more: no early connection to it either
  if (/\.html$/.test(f)) n2 = n2.replace(/<link rel="preconnect" href="https:\/\/fonts\.(?:gstatic|googleapis)\.com"[^>]*>\n?/g, "");
  // r135c: case pages start their big film when opened from the map, and stop everything when closed
  if (/\.html$/.test(f) && /[\\/](work|proiecte)[\\/]/.test(p2) && !n2.includes("r135c-film") && n2.includes("</body>")) n2 = n2.replace(/<\/body>(?![\s\S]*<\/body>)/, `<!--r135c-film-->${FILM_AUTO}\n</body>`);
  // r134h: GA4 behind the cookie card, on every page (Daniel: G-BRW5QJTJ77, stream "Cromatic Studios COM - GA4")
  if (/\.html$/.test(f) && CONSENT && !n2.includes('id="cz-ck-css"') && n2.includes("</body>")) n2 = n2.replace(/<\/body>(?![\s\S]*<\/body>)/, `${CONSENT}\n</body>`);
  // long titles lose the studio suffix first in Google (~60 characters show); the brand stays in og:site_name and the schema
  if (/\.html$/.test(f)) n2 = n2.replace(/<title>([^<]*?) · Cromatic Studios<\/title>/, (m, t0) => (t0.length + 19 > 66 ? `<title>${t0}</title>` : m));
  if (n2 !== t) writeFileSync(p2, n2); } })(pub);
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
