// Builds the site from src/.
//   node build/build.mjs            -> public/  (production: assets split out, hashed, cache-friendly)
//   node build/build.mjs --single F -> F       (one self-contained HTML file, for local viewing)
import { readFileSync, writeFileSync, mkdirSync, rmSync, copyFileSync } from "node:fs";
import { createHash } from "node:crypto";
import zlib from "node:zlib";
import { readdirSync, statSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const src = (f) => join(root, "src", f);
const SITE_URL = (process.env.SITE_URL || "https://drive.cromaticstudios.com").replace(/\/$/, "");
const head = readFileSync(src("head.html"), "utf8");
const css = readFileSync(src("styles.css"), "utf8");
const js = readFileSync(src("app.js"), "utf8");
const hash = (buf) => createHash("sha1").update(buf).digest("hex").slice(0, 10);

const args = process.argv.slice(2);
const single = args.indexOf("--single");
if (single >= 0) {
  const out = args[single + 1] || join(root, "dist", "index.html");
  mkdirSync(dirname(out), { recursive: true });
  // a local file has no domain: drop the absolute social/canonical tags
  const h = head.split("\n").filter((l) => !l.includes("%%SITE_URL%%")).join("\n");
  const html = `${h}<style>${css}</style>\n</head><body>\n<script>${js}<\/script>\n</body></html>`;
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
const jsOut = extract(js), cssOut = extract(css);
const jsName = `assets/app.${hash(jsOut)}.js`, cssName = `assets/styles.${hash(cssOut)}.css`;
writeFileSync(join(pub, jsName), jsOut);
writeFileSync(join(pub, cssName), cssOut);
const html = `${head.replaceAll("%%SITE_URL%%", SITE_URL)}<link rel="stylesheet" href="${cssName}">
</head><body>
<script src="${jsName}"></script>
</body></html>`;
writeFileSync(join(pub, "index.html"), html);
copyFileSync(src("og.jpg"), join(pub, "og.jpg"));
writeFileSync(join(pub, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);
writeFileSync(join(pub, "sitemap.xml"), `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${SITE_URL}/</loc></url></urlset>\n`);
// precompress text files once, at build time (the server just picks the right variant)
const COMP = /\.(html|js|css|svg|txt|xml|json)$/;
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
