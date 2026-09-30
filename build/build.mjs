// Builds the site from src/.
//   node build/build.mjs            -> public/  (production: assets split out, hashed, cache-friendly)
//   node build/build.mjs --single F -> F       (one self-contained HTML file, for local viewing)
import { readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync } from "node:fs";
import { createHash } from "node:crypto";
import zlib from "node:zlib";
import { readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { jsonLd, llmsTxt, robotsTxt, sitemapXml, manifest, icoFromPng } from "./seo.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = (f) => join(root, "src", f);
const SITE_URL = (process.env.SITE_URL || "https://drive.cromaticstudios.com").replace(/\/$/, "");
const head = readFileSync(src("head.html"), "utf8");
const css = readFileSync(src("styles.css"), "utf8");
const js = readFileSync(src("app.js"), "utf8");
const content = readFileSync(src("content.html"), "utf8").replace(/<!--[\s\S]*?-->\s*/, "");
// the dark calibrating screen, painted before the script arrives; it steps aside as soon as the
// app has drawn its own loader on top
const boot = `<div class="boot" aria-hidden="true"><svg viewBox="0 0 120 120"><circle class="r" cx="60" cy="60" r="52"/><circle class="p" cx="60" cy="60" r="52"/><g transform="translate(44 44) scale(1.333)"><path class="s" d="M12 0 L14.6 7.2 L21.5 4.2 L17.4 10.5 L24 12 L17.4 13.5 L21.5 19.8 L14.6 16.8 L12 24 L9.4 16.8 L2.5 19.8 L6.6 13.5 L0 12 L6.6 10.5 L2.5 4.2 L9.4 7.2 Z" fill="#FED012"/></g></svg></div>
<script>(function(){var t0=Date.now();(function w(){var b=document.querySelector(".boot");if(!b)return;if(document.querySelector(".loader")||Date.now()-t0>30000){b.classList.add("gone");setTimeout(function(){b.remove()},450)}else requestAnimationFrame(w)})()})();<\/script>`;
const hash = (buf) => createHash("sha1").update(buf).digest("hex").slice(0, 10);

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
const jsName = `assets/app.${hash(jsOut)}.js`, cssName = `assets/styles.${hash(cssOut)}.css`;
writeFileSync(join(pub, jsName), jsOut);
writeFileSync(join(pub, cssName), cssOut);
const html = `${head.replaceAll("%%SITE_URL%%", SITE_URL)}<link rel="stylesheet" href="${cssName}">
<link rel="preload" href="${jsName}" as="script">
${jsonLd(SITE_URL)}
</head><body>
${boot}
${content}
<script src="${jsName}"></script>
</body></html>`;
writeFileSync(join(pub, "index.html"), html);
copyFileSync(src("og.jpg"), join(pub, "og.jpg"));
writeFileSync(join(pub, "robots.txt"), robotsTxt(SITE_URL));
writeFileSync(join(pub, "sitemap.xml"), sitemapXml(SITE_URL, new Date().toISOString().slice(0, 10)));
writeFileSync(join(pub, "llms.txt"), llmsTxt(SITE_URL));
writeFileSync(join(pub, "site.webmanifest"), manifest());
for (const f of ["icon.svg", "apple-touch-icon.png", "icon-192.png", "icon-512.png"]) copyFileSync(src(f), join(pub, f));
writeFileSync(join(pub, "favicon.ico"), icoFromPng(readFileSync(src("favicon-32.png"))));
writeFileSync(join(pub, "404.html"), `${head.split("\n").filter((l) => !l.includes("%%SITE_URL%%")).join("\n").replace(/<title>[^<]*<\/title>/, "<title>Off the map · Cromatic Studios</title>").replace(/<meta name="robots"[^>]*>/, '<meta name="robots" content="noindex">')}
<style>body{margin:0;min-height:100vh;display:grid;place-items:center;background:#0d0c09;color:#fbfaf5;font:16px/1.5 Poppins,system-ui,sans-serif;text-align:center}h1{font-size:clamp(32px,6vw,56px);margin:.2em 0}a{display:inline-block;margin-top:18px;padding:12px 22px;border-radius:999px;background:#FED012;color:#0d0c09;font-weight:800;text-decoration:none}</style>
</head><body><main><p>404 · OFF THE MAP</p><h1>This road isn't on our map.</h1><p>Turn around, the coffee is still warm.</p><a href="/">Back to the drive</a></main></body></html>`);
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
