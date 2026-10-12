// r131: responsive WebP for every photo the pages show. After all pages are written, each <img> that points at a
// JPEG/PNG of ours gets WebP copies at a few widths and a srcset, so a phone downloads a phone-sized picture. The
// original stays as the lightbox / og:image file. The WebP files are made on the studio's machine (sharp is a dev
// dependency) and committed in site/.img-cache by content hash: the server only copies them, it never encodes.
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, existsSync, copyFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

const WIDTHS = [480, 960, 1600];
const MIN_BYTES = 24 * 1024; // small pictures are not worth it

export async function optimizeImages(pub, root, log = console.log) {
  let sharp = null;
  try { sharp = (await import("sharp")).default; sharp.concurrency(0); } catch { log("[images] sharp not installed: using the committed WebP cache only"); }
  const cacheDir = join(root, "site", ".img-cache");
  mkdirSync(cacheDir, { recursive: true });
  mkdirSync(join(pub, "assets", "w"), { recursive: true });
  const htmls = [];
  (function walk(d) { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (f === "index.html") htmls.push(p); } })(pub);
  const srcs = new Set();
  for (const f of htmls) for (const m of readFileSync(f, "utf8").matchAll(/<img\b[^>]*?\bsrc="(\/assets\/[^"]+\.(?:jpe?g|png))"/gi)) srcs.add(m[1]);
  const out = new Map();
  let made = 0, saved = 0;
  const t0 = Date.now();
  const jobs = [...srcs];
  const work = async (src) => {
    const file = join(pub, src);
    if (!existsSync(file)) return;
    const buf = readFileSync(file);
    if (buf.length < MIN_BYTES) return;
    const h = createHash("sha1").update(buf).digest("hex").slice(0, 12);
    const dims = (() => { if (buf[0] === 0x89 && buf[1] === 0x50) return [buf.readUInt32BE(16), buf.readUInt32BE(20)]; for (let i = 2; i < buf.length - 9;) { if (buf[i] !== 0xff) { i++; continue; } const mk = buf[i + 1], len = buf.readUInt16BE(i + 2); if (mk >= 0xc0 && mk <= 0xcf && mk !== 0xc4 && mk !== 0xc8 && mk !== 0xcc) return [buf.readUInt16BE(i + 7), buf.readUInt16BE(i + 5)]; i += 2 + len; } return [0, 0]; })();
    const meta = { width: dims[0], height: dims[1] };
    const W = meta.width || 0;
    if (!W) return;
    const widths = [...new Set([...WIDTHS.filter((w) => w < W * 0.95), Math.min(W, 1600)])].sort((a, b) => a - b);
    const set = [];
    for (const w of widths) {
      const name = `${h}-${w}.webp`, cached = join(cacheDir, name), dest = join(pub, "assets", "w", name);
      if (!existsSync(cached)) {
        if (!sharp) return; // not in the cache and no encoder here: this picture keeps its original
        await sharp(buf).resize({ width: w, withoutEnlargement: true }).webp({ quality: w <= 960 ? 76 : 80, effort: 4 }).toFile(cached);
        made++;
      }
      copyFileSync(cached, dest);
      set.push({ w, src: `/assets/w/${name}`, bytes: statSync(dest).size });
    }
    const best = set.find((x) => x.w >= Math.min(W, 1600)) || set[set.length - 1];
    if (best.bytes >= buf.length && set.length === 1) return; // nothing gained
    saved += Math.max(0, buf.length - best.bytes);
    out.set(src, { set, src: best.src, h: Math.round((meta.height || 0) * (best.w / W)) });
  };
  const queue = jobs.slice();
  await Promise.all(Array.from({ length: 6 }, async () => { while (queue.length) await work(queue.shift()); }));
  // rewrite the pages
  for (const f of htmls) {
    const html = readFileSync(f, "utf8");
    const next = html.replace(/<img\b([^>]*?)\bsrc="(\/assets\/[^"]+\.(?:jpe?g|png))"([^>]*)>/gi, (m, a, src, b) => {
      const v = out.get(src);
      if (!v || /\bsrcset=/.test(m)) return m;
      const lazy = /loading="?lazy/.test(m);
      const sizes = `${lazy ? "auto, " : ""}(max-width: 760px) 100vw, (max-width: 1400px) 80vw, 1400px`;
      return `<img${a}src="${v.src}" srcset="${v.set.map((x) => `${x.src} ${x.w}w`).join(", ")}" sizes="${sizes}"${b}>`;
    });
    if (next !== html) writeFileSync(f, next);
  }
  log(`[images] ${out.size} pictures, ${made} new WebP files, ~${(saved / 1048576).toFixed(1)} MB lighter at full size, ${((Date.now() - t0) / 1000).toFixed(1)} s`);
}

// r136 (N40): one social picture per page, 1200×630 JPEG (what LinkedIn, Facebook and WhatsApp crop to), cut at build
// from the page's own cover with sharp (attention crop) and committed in site/.img-cache/og-*.jpg like the WebP copies:
// the server, without sharp, only copies them. pick(path) = the local picture for a page whose og:image is the
// generic /og.jpg (the home pages keep the designed one: skip(path) is true for them).
const OG_W = 1200, OG_H = 630, OG_MAX = 300 * 1024;
export async function socialCards(pub, root, SITE, pick, skip, log = console.log) {
  let sharp = null;
  try { sharp = (await import("sharp")).default; } catch {}
  const cacheDir = join(root, "site", ".img-cache");
  mkdirSync(join(pub, "assets", "og"), { recursive: true });
  const htmls = [];
  (function walk(d) { for (const f of readdirSync(d)) { const p = join(d, f); if (statSync(p).isDirectory()) walk(p); else if (f === "index.html") htmls.push(p); } })(pub);
  const done = new Map();
  let made = 0, pages = 0, missing = 0;
  const card = async (src) => {
    if (done.has(src)) return done.get(src);
    let out = null;
    const file = join(pub, src);
    if (existsSync(file)) {
      const buf = readFileSync(file);
      const h = createHash("sha1").update(buf).update("og1200").digest("hex").slice(0, 12);
      const cached = join(cacheDir, `og-${h}.jpg`);
      if (!existsSync(cached) && sharp) {
        let q = 82, jpg;
        do { jpg = await sharp(buf).resize(OG_W, OG_H, { fit: "cover", position: sharp.strategy.attention }).flatten({ background: "#ffffff" }).jpeg({ quality: q, mozjpeg: true }).toBuffer(); q -= 8; } while (jpg.length > OG_MAX && q > 50);
        writeFileSync(cached, jpg);
        made++;
      }
      if (existsSync(cached)) { copyFileSync(cached, join(pub, "assets", "og", `${h}.jpg`)); out = `/assets/og/${h}.jpg`; }
      else missing++;
    }
    done.set(src, out);
    return out;
  };
  for (const f of htmls) {
    const path = "/" + f.slice(pub.length + 1).replace(/index\.html$/, "").split("\\").join("/");
    if (skip(path)) continue;
    let html = readFileSync(f, "utf8");
    const og = /<meta property="og:image" content="([^"]+)"/.exec(html)?.[1];
    if (!og) continue;
    let src = og.startsWith(SITE) ? og.slice(SITE.length) : og.startsWith("/") ? og : null;
    if (!src || src === "/og.jpg") src = pick(path) || null;
    if (!src || !/^\/assets\/[^?#]+\.(?:jpe?g|png|webp)$/i.test(src)) continue;
    const c = await card(src);
    if (!c) continue;
    html = html.replace(/(<meta property="og:image" content=")[^"]+(")/, `$1${SITE}${c}$2`)
      .replace(/<meta property="og:image:width" content="\d+">/, `<meta property="og:image:width" content="${OG_W}">`)
      .replace(/<meta property="og:image:height" content="\d+">/, `<meta property="og:image:height" content="${OG_H}">`)
      .replace(/(<meta name="twitter:image" content=")[^"]+(")/, `$1${SITE}${c}$2`);
    if (!/og:image:width/.test(html)) html = html.replace(/(<meta property="og:image" content="[^"]+">)/, `$1\n<meta property="og:image:width" content="${OG_W}">\n<meta property="og:image:height" content="${OG_H}">`);
    writeFileSync(f, html);
    pages++;
  }
  log(`[og] ${pages} pages with their own 1200×630 card, ${made} new${missing ? `, ${missing} not in the cache (install sharp and build once)` : ""}`);
}
