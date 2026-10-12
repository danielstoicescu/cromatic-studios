// r131: responsive WebP for every photo the pages show. After all pages are written, each <img> that points at a
// JPEG/PNG of ours gets WebP copies at a few widths (cached in .cache/img by content hash) and a srcset, so a phone
// downloads a phone-sized picture. The original stays as the lightbox / og:image file.
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, existsSync, copyFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

const WIDTHS = [480, 960, 1600, 2400];
const MIN_BYTES = 24 * 1024; // small pictures are not worth it

export async function optimizeImages(pub, root, log = console.log) {
  let sharp;
  try { sharp = (await import("sharp")).default; } catch { log("[images] sharp not installed: skipped"); return; }
  sharp.concurrency(0);
  const cacheDir = join(root, ".cache", "img");
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
    let meta;
    try { meta = await sharp(buf).metadata(); } catch { return; }
    const W = meta.width || 0;
    if (!W) return;
    const widths = [...new Set([...WIDTHS.filter((w) => w < W * 0.95), Math.min(W, 2400)])].sort((a, b) => a - b);
    const set = [];
    for (const w of widths) {
      const name = `${h}-${w}.webp`, cached = join(cacheDir, name), dest = join(pub, "assets", "w", name);
      if (!existsSync(cached)) {
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
