// r131: responsive WebP for every photo the pages show. After all pages are written, each <img> that points at a
// JPEG/PNG of ours gets WebP copies at a few widths and a srcset, so a phone downloads a phone-sized picture. The
// original stays as the lightbox / og:image file. The WebP files are made on the studio's machine (sharp is a dev
// dependency) and committed in site/.img-cache by content hash: the server only copies them, it never encodes.
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, existsSync, copyFileSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";

const WIDTHS = [480, 960, 1600];
// r139a: swaps a film's inline preview poster for its WebP copy once the page has loaded and painted (see optimizeImages)
// r139a: swaps an animated picture's still first frame for the animation once the page has loaded and painted
// r139d: both wait for the page's gate (GATE_JS below: loaded, and its largest picture or title painted) when it has one;
// a picture still waiting for its file (data-lz-srcset) gets the animated set there instead
const ANIM_JS = `<script>/* r139a-anim */(function(){function go(){[].forEach.call(document.querySelectorAll("img[data-anim-srcset]"),function(i){var a=i.getAttribute("data-anim-srcset");if(i.hasAttribute("data-lz-srcset"))i.setAttribute("data-lz-srcset",a);else i.srcset=a;i.removeAttribute("data-anim-srcset")})}function later(){requestAnimationFrame(function(){requestAnimationFrame(function(){setTimeout(go,60)})})}if(window.czAfterLcp)czAfterLcp(go);else if(document.readyState==="complete")later();else addEventListener("load",later)})();</script>`;
const POSTER_JS = `<script>/* r139a-poster */(function(){function up(){[].forEach.call(document.querySelectorAll("video[data-poster]"),function(v){var w=(v.clientWidth||innerWidth)*(window.devicePixelRatio||1);v.poster=(w>1100&&v.getAttribute("data-poster-lg"))||v.getAttribute("data-poster");v.removeAttribute("data-poster")})}function later(){requestAnimationFrame(function(){requestAnimationFrame(function(){setTimeout(up,60)})})}if(window.czAfterLcp)czAfterLcp(up);else if(document.readyState==="complete")later();else addEventListener("load",later)})();</script>`;
// r139d: the loading gate of a case page, in its <head>. Nothing below the fold may compete with the first paint:
//   czAfterPaint(f): f runs once the title (or the largest picture) has painted;
//   czAfterLcp(f): f runs once the page has loaded AND its largest paint is done (the fetchpriority="high" picture, if
//   any, decoded and painted), 1.5 s after load at the latest when the browser reports no paint (a background tab).
// Browsers without the largest-contentful-paint entry (Safari, Firefox) use the first frames after DOMContentLoaded and
// after load. Then pictures get their files: img[data-lz="paint"] (a hero shown after the title) and img[data-lz="near"]
// (every lazy picture) as they come within 1.25 screens, through an IntersectionObserver (scrollMargin: a rail's next
// cards too). Until then they hold an empty SVG of their own proportions (or their tiny preview), so nothing moves.
const GATE_JS = `<script>/* r139d-gate */(function(){var w=window,d=document,P=[],L=[],paint=0,done=0,seen=0,loaded=0;function run(a){var f;while(f=a.shift())try{f()}catch(e){}}function raf2(f){requestAnimationFrame(function(){requestAnimationFrame(function(){setTimeout(f,0)})})}function ready(f){if(d.readyState==="loading")d.addEventListener("DOMContentLoaded",f);else f()}function onPaint(){if(paint)return;paint=1;ready(function(){raf2(function(){paint=2;run(P)})})}function openL(){done=2;run(L)}function settle(){if(done||!loaded||!seen)return;done=1;var im=d.querySelector('img[fetchpriority="high"]'),go=function(){raf2(openL)};if(im&&im.decode&&im.currentSrc)im.decode().then(go,go);else go()}w.czAfterPaint=function(f){if(paint===2)f();else P.push(f)};w.czAfterLcp=function(f){if(done===2)f();else L.push(f)};var ok=0;try{ok=PerformanceObserver.supportedEntryTypes.indexOf("largest-contentful-paint")>-1}catch(e){}if(ok){try{new PerformanceObserver(function(l){if(l.getEntries().length){seen=1;onPaint();settle()}}).observe({type:"largest-contentful-paint",buffered:true})}catch(e){ok=0}}if(!ok){seen=1;ready(onPaint)}function ld(){loaded=1;onPaint();if(!seen)setTimeout(function(){seen=1;settle()},1500);settle()}if(d.readyState==="complete")ld();else w.addEventListener("load",ld);setTimeout(function(){loaded=seen=1;onPaint();settle()},15000);function swap(i){var s=i.getAttribute("data-lz-srcset"),u=i.getAttribute("data-lz-src"),z=i.getAttribute("sizes")||"",wd;i.removeAttribute("data-lz");if(/^auto\\b/.test(z)&&(wd=i.getBoundingClientRect().width))i.sizes=Math.ceil(wd)+"px";i.loading="eager";var pp=i.parentNode;if(pp&&pp.nodeName==="PICTURE")[].forEach.call(pp.getElementsByTagName("source"),function(o){var q=o.getAttribute("data-lz-srcset");if(!q)return;o.sizes=i.getAttribute("sizes")||"";o.srcset=q;o.removeAttribute("data-lz-srcset")});if(s){i.srcset=s;i.removeAttribute("data-lz-srcset")}if(u){i.src=u;i.removeAttribute("data-lz-src")}}function watch(k){var ims=[].slice.call(d.querySelectorAll('img[data-lz="'+k+'"]'));if(!ims.length)return;if(!("IntersectionObserver" in w))return ims.forEach(swap);var io=new IntersectionObserver(function(es){es.forEach(function(e){if(e.isIntersecting){io.unobserve(e.target);swap(e.target)}})},{rootMargin:"125% 0px",scrollMargin:"0px 1200px"});ims.forEach(function(i){io.observe(i)})}w.czAfterPaint(function(){watch("paint")});w.czAfterLcp(function(){watch("near")})})();</script>`;
// r139d: an empty picture of the same proportions, the placeholder of a picture that waits for its file
const EMPTY = (w, h) => `data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${w} ${h}'%3E%3C/svg%3E`;
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
  // r139a: our own WebP photos (site/media, /assets/m/*.webp) get the smaller copies too (an animated one never: a
  // resize would keep its first frame); an <img data-full> keeps its one file (Steam's founders, drawn by a script at
  // a size no sizes attribute can say). Video posters get the copies and a tiny inline preview (LQIP below)
  const posters = new Set();
  const caseSrcs = new Set(); // TASK-015: pictures a case page shows get AVIF copies too
  for (const f of htmls) {
    const t = readFileSync(f, "utf8");
    for (const m of t.matchAll(/<img\b[^>]*?\bsrc="(\/assets\/[^"]+\.(?:jpe?g|png)|\/assets\/m\/[^"]+\.webp)"[^>]*>/gi)) if (!/\bdata-full\b/.test(m[0])) { srcs.add(m[1]); if (isCase(f)) caseSrcs.add(m[1]); }
    for (const m of t.matchAll(/<video\b[^>]*?\bposter="(\/assets\/[^"]+\.(?:jpe?g|png))"/gi)) { srcs.add(m[1]); posters.add(m[1]); }
    // r139d: a case page's hero pictures (shown after the title, see heroAfterTitle) get the tiny preview too
    const hr = heroRange(t, f);
    if (hr) for (const m of t.slice(hr[0], hr[1]).matchAll(/<img\b[^>]*?\bsrc="(\/assets\/[^"]+\.(?:jpe?g|png|webp))"[^>]*\bfetchpriority="high"[^>]*>/gi)) posters.add(m[1]);
  }
  const out = new Map();
  let made = 0, saved = 0, avifMade = 0, avifN = 0, avifIn = 0, avifOut = 0;
  // TASK-015: pictures whose AVIF set is not >=20% lighter (by content hash), so a build never encodes them again
  const skipFile = join(cacheDir, "avif-skip.txt");
  const avifSkip = new Set(existsSync(skipFile) ? readFileSync(skipFile, "utf8").split("\n").filter(Boolean) : []), newSkip = new Set();
  const t0 = Date.now();
  const jobs = [...srcs];
  const work = async (src) => {
    const file = join(pub, src);
    if (!existsSync(file)) return;
    const buf = readFileSync(file);
    if (buf.length < MIN_BYTES) return;
    const h = createHash("sha1").update(buf).digest("hex").slice(0, 12);
    const webp = buf.toString("latin1", 0, 4) === "RIFF" && buf.toString("latin1", 8, 12) === "WEBP";
    const dims = (() => { if (buf[0] === 0x89 && buf[1] === 0x50) return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
      // r139a: WebP: VP8X (extended, animated ones too), VP8 (lossy), VP8L (lossless)
      if (webp) { const c = buf.toString("latin1", 12, 16); if (c === "VP8X") return [1 + buf.readUIntLE(24, 3), 1 + buf.readUIntLE(27, 3)]; if (c === "VP8 ") return [buf.readUInt16LE(26) & 0x3fff, buf.readUInt16LE(28) & 0x3fff]; if (c === "VP8L") { const b = buf.readUInt32LE(21); return [(b & 0x3fff) + 1, ((b >>> 14) & 0x3fff) + 1]; } return [0, 0]; }
      for (let i = 2; i < buf.length - 9;) { if (buf[i] !== 0xff) { i++; continue; } const mk = buf[i + 1], len = buf.readUInt16BE(i + 2); if (mk >= 0xc0 && mk <= 0xcf && mk !== 0xc4 && mk !== 0xc8 && mk !== 0xcc) return [buf.readUInt16BE(i + 7), buf.readUInt16BE(i + 5)]; i += 2 + len; } return [0, 0]; })();
    const meta = { width: dims[0], height: dims[1] };
    const W = meta.width || 0;
    if (!W) return;
    // r139a: an animated WebP (Venevo's hero: 2.1 MB at 1600 px, fetched next to the title) gets its first frame as a
    // still WebP set, shown until the page has loaded, and smaller animated copies; the images-anim script below then
    // swaps the still set for the animated one (a lazy picture still waits until it comes near)
    if (webp && buf.toString("latin1", 12, 16) === "VP8X" && buf[20] & 0x02) {
      const ws = WIDTHS.filter((w) => w < W * 0.95), still = [], anim = [];
      for (const w of [...new Set([...ws, Math.min(W, 1600)])]) {
        const sName = `${h}-${w}s.webp`, sC = join(cacheDir, sName);
        if (!existsSync(sC)) { if (!sharp) return; await sharp(buf, { pages: 1 }).resize({ width: w, withoutEnlargement: true }).webp({ quality: w <= 960 ? 76 : 80, effort: 4 }).toFile(sC); made++; }
        copyFileSync(sC, join(pub, "assets", "w", sName));
        still.push({ w, src: `/assets/w/${sName}` });
        if (!ws.includes(w)) continue; // the original is the largest animated choice
        const aName = `${h}-${w}a.webp`, aC = join(cacheDir, aName);
        if (!existsSync(aC)) { if (!sharp) return; await sharp(buf, { animated: true }).resize({ width: w }).webp({ quality: 72, effort: 4 }).toFile(aC); made++; }
        copyFileSync(aC, join(pub, "assets", "w", aName));
        anim.push({ w, src: `/assets/w/${aName}`, bytes: statSync(aC).size });
      }
      anim.push({ w: W, src, bytes: buf.length });
      // r139d: a hero's tiny preview (its first frame), as for the stills below
      let alq = null;
      if (posters.has(src)) {
        const cached = join(cacheDir, `${h}-lqip.webp`);
        if (!existsSync(cached) && sharp) { await sharp(buf, { pages: 1 }).resize({ width: 40 }).webp({ quality: 50, effort: 6 }).toFile(cached); made++; }
        if (existsSync(cached)) alq = `data:image/webp;base64,${readFileSync(cached).toString("base64")}`;
      }
      out.set(src, { set: still, src: still[still.length - 1].src, anim, lqip: alq });
      return;
    }
    // a WebP of ours is already the compressed file at its full size: it stays the largest choice, only smaller copies are made
    const widths = webp ? WIDTHS.filter((w) => w < W * 0.95) : [...new Set([...WIDTHS.filter((w) => w < W * 0.95), Math.min(W, 1600)])].sort((a, b) => a - b);
    if (!widths.length) return;
    const set = [];
    // r139a: a poster's preview: the picture 40 px wide, inlined as the poster until the page has loaded (a few hundred
    // bytes in the HTML instead of the full picture fetched next to the title; images-poster script below swaps it)
    let lqip = null;
    if (posters.has(src)) {
      const cached = join(cacheDir, `${h}-lqip.webp`);
      if (!existsSync(cached) && sharp) { await sharp(buf).resize({ width: 40 }).webp({ quality: 50, effort: 6 }).toFile(cached); made++; }
      if (existsSync(cached)) lqip = `data:image/webp;base64,${readFileSync(cached).toString("base64")}`;
    }
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
    if (webp) set.push({ w: W, src, bytes: buf.length });
    const best = set.find((x) => x.w >= Math.min(W, 1600)) || set[set.length - 1];
    if (best.bytes >= buf.length && set.length === 1) return; // nothing gained
    saved += Math.max(0, buf.length - best.bytes);
    // TASK-015: a case page's picture also gets AVIF copies at the same widths (q55, q60 for the widest: the same
    // SSIM as the WebP copies; 4:2:0 like WebP). Kept only when the set comes out at least 20% lighter (the rest
    // is not worth its weight in the repo; only the kept files are committed in site/.img-cache); a copy
    // missing from the cache on a machine without sharp (the server) drops the AVIF set, never the picture
    let avif = null;
    if (caseSrcs.has(src) && !avifSkip.has(h)) {
      const list = [];
      for (const x of set) {
        const name = `${h}-${x.w}.avif`, cached = join(cacheDir, name);
        let fresh = null; // encoded here, written to the cache only if the set is kept
        if (!existsSync(cached)) {
          if (!sharp) { list.length = 0; break; }
          fresh = await sharp(buf).resize({ width: x.w, withoutEnlargement: true }).avif({ quality: x.w <= 960 ? 55 : 60, effort: 4, chromaSubsampling: "4:2:0" }).toBuffer();
        }
        list.push({ w: x.w, name, cached, fresh, bytes: fresh ? fresh.length : statSync(cached).size, webp: x.bytes });
      }
      const a = list.reduce((s, x) => s + x.bytes, 0), b = list.reduce((s, x) => s + x.webp, 0);
      if (list.length === set.length && a < b * 0.8) {
        avif = list.map((x) => { if (x.fresh) { writeFileSync(x.cached, x.fresh); avifMade++; } copyFileSync(x.cached, join(pub, "assets", "w", x.name)); return { w: x.w, src: `/assets/w/${x.name}` }; });
        avifIn += b; avifOut += a; avifN++;
      } else if (list.length === set.length) newSkip.add(h); // not worth it: remembered in avif-skip.txt, never encoded again
    }
    out.set(src, { set, src: best.src, h: Math.round((meta.height || 0) * (best.w / W)), lqip, avif, orig: src, webpOrig: webp });
  };
  const queue = jobs.slice();
  await Promise.all(Array.from({ length: 6 }, async () => { while (queue.length) await work(queue.shift()); }));
  // r139d: the tiny previews, by the address the page ends up with
  const lqipOf = new Map();
  for (const v of out.values()) if (v.lqip) lqipOf.set(v.src, v.lqip);
  // TASK-015: the AVIF sets, by the address the page ends up with
  const avifOf = new Map();
  for (const v of out.values()) if (v.avif) avifOf.set(v.src, v);
  // rewrite the pages
  for (const f of htmls) {
    const html = readFileSync(f, "utf8");
    let next = html.replace(/<img\b([^>]*?)\bsrc="(\/assets\/[^"]+\.(?:jpe?g|png)|\/assets\/m\/[^"]+\.webp)"([^>]*)>/gi, (m, a, src, b) => {
      const v = out.get(src);
      if (!v || /\bsrcset=/.test(m) || /\bdata-full\b/.test(m)) return m;
      const lazy = /loading="?lazy/.test(m);
      const sizes = `${lazy ? "auto, " : ""}(max-width: 760px) 100vw, (max-width: 1400px) 80vw, 1400px`;
      return `<img${a}src="${v.src}" srcset="${v.set.map((x) => `${x.src} ${x.w}w`).join(", ")}"${v.anim ? ` data-anim-srcset="${v.anim.map((x) => `${x.src} ${x.w}w`).join(", ")}"` : ""}${/\bsizes=/.test(m) ? "" : ` sizes="${sizes}"`}${b}>`;
    });
    // r139a: a film's poster: its tiny preview inline while the page loads, then the WebP copy for the screen (960 px
    // wide, the 1600 one on a wide or dense screen) once it has loaded; with no preview, the WebP copy straight away
    next = next.replace(/<video\b([^>]*?)\bposter="(\/assets\/[^"]+\.(?:jpe?g|png))"([^>]*)>/gi, (m, a, src, b) => {
      const v = out.get(src);
      if (!v) return m;
      const sm = (v.set.find((x) => x.w >= 960) || v.set[v.set.length - 1]).src, lg = v.set[v.set.length - 1].src;
      return v.lqip ? `<video${a}poster="${v.lqip}" data-poster="${sm}"${lg !== sm ? ` data-poster-lg="${lg}"` : ""}${b}>` : `<video${a}poster="${sm}"${b}>`;
    });
    // r139d: a case page loads in order: the title and its one LCP picture first, the rest after (gatePage)
    if (isCase(f)) next = pictures(gatePage(next, f, lqipOf), avifOf);
    if (next.includes(" data-poster=") && !next.includes("r139a-poster")) next = next.replace(/<\/body>(?![\s\S]*<\/body>)/, `${POSTER_JS}\n</body>`);
    if (next.includes(" data-anim-srcset=") && !next.includes("r139a-anim")) next = next.replace(/<\/body>(?![\s\S]*<\/body>)/, `${ANIM_JS}\n</body>`);
    if (next !== html) writeFileSync(f, next);
  }
  log(`[images] ${out.size} pictures, ${made} new WebP files, ~${(saved / 1048576).toFixed(1)} MB lighter at full size, ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  if (newSkip.size) writeFileSync(skipFile, [...new Set([...avifSkip, ...newSkip])].sort().join("\n") + "\n");
  log(`[images] AVIF: ${avifN} case-page pictures, ${avifMade} new AVIF files, their sets ${(avifIn / 1048576).toFixed(1)} MB WebP -> ${(avifOut / 1048576).toFixed(1)} MB AVIF`);
}

// r139d: a brand canvas's files are drawn at 2× the board (site/canvas/split-*.py), right for a phone or a retina
// screen; a 1× and a 1.5× copy of each (Lanczos, colour at quality 84 as the 2× files, lossless alpha) let an ordinary screen (or a
// phone at 1.75) take the file it really needs (site.js picks by the element's width on screen). Made with sharp on the
// studio's machine and kept in site/.img-cache like the WebP copies; returns { variants: { file: [{ w, file }] }, dims }
export async function canvasVariants(dir, files, outDir, root) {
  let sharp = null;
  try { sharp = (await import("sharp")).default; } catch {}
  const cacheDir = join(root, "site", ".img-cache");
  mkdirSync(cacheDir, { recursive: true });
  const variants = {}, dims = {};
  for (const f of files) {
    const buf = readFileSync(join(dir, f));
    if (buf.toString("latin1", 0, 4) !== "RIFF" || buf.toString("latin1", 8, 12) !== "WEBP") continue;
    const c = buf.toString("latin1", 12, 16);
    const W = c === "VP8X" ? 1 + buf.readUIntLE(24, 3) : c === "VP8 " ? buf.readUInt16LE(26) & 0x3fff : c === "VP8L" ? (buf.readUInt32LE(21) & 0x3fff) + 1 : 0;
    const H = c === "VP8X" ? 1 + buf.readUIntLE(27, 3) : c === "VP8 " ? buf.readUInt16LE(28) & 0x3fff : c === "VP8L" ? ((buf.readUInt32LE(21) >>> 14) & 0x3fff) + 1 : 0;
    if (!W || !H) continue;
    dims[f] = [W, H];
    const h = createHash("sha1").update(buf).digest("hex").slice(0, 12), list = [];
    for (const k of [0.5, 0.75]) {
      const w = Math.round(W * k);
      if (w < 24 || Math.round(H * k) < 2) continue;
      const name = `cv-${h}-${w}q84.webp`, cached = join(cacheDir, name);
      if (!existsSync(cached)) { if (!sharp) continue; await sharp(buf).resize({ width: w, kernel: "lanczos3" }).webp({ quality: 84, alphaQuality: 100, effort: 5 }).toFile(cached); }
      if (statSync(cached).size >= buf.length) continue; // no lighter: the 2× file serves
      const out = f.replace(/\.webp$/, `-${w}.webp`);
      copyFileSync(cached, join(outDir, out));
      list.push({ w, file: out });
    }
    if (list.length) variants[f] = list;
  }
  return { variants, dims };
}

// r139d: case pages (/work/*, /ro/proiecte/*) load in order. Their hero pictures (the .hero-media of a standalone case
// page, under the title: they come in with a wipe, so the title is what paints first and the largest) were fetched at
// high priority next to the title; they now start once the title has painted, showing their 40 px preview until then,
// sized for the share of the row they really take. Every lazy picture waits for the gate (GATE_JS) and then for its
// turn (within 1.25 screens). The one picture left at fetchpriority="high" (the LCP: a canvas board, a c2 page's cover,
// Slow Coffee's title) is preloaded.
const isCase = (f) => /[\\/](?:work|proiecte)[\\/][^\\/]+[\\/]index\.html$/.test(f);
function heroRange(t, f) {
  if (!isCase(f)) return null;
  const a = t.indexOf('<div class="hero-media">');
  if (a < 0) return null;
  const b = t.indexOf("</header>", a);
  return b < 0 ? null : [a, b];
}
const attr = (tag, k) => (new RegExp(`\\s${k}="([^"]*)"`).exec(tag) || [])[1];
function gatePage(html, f, lqipOf) {
  let t = html;
  const hr = heroRange(t, f);
  let first = null; // TASK-015: the first hero picture (a phone's LCP: the row stacks, it takes the whole width)
  if (hr) {
    const part = t.slice(hr[0], hr[1]);
    // the row's proportions (--r of each figure): a picture takes its share of the row's width (the whole width on a phone)
    const rs = [...part.matchAll(/<figure\b[^>]*--r:([\d.]+)/g)].map((m) => +m[1]);
    const sum = rs.reduce((a, b) => a + b, 0);
    let k = -1;
    const done = part.replace(/<figure\b[^>]*--r:([\d.]+)[^>]*>|<img\b[^>]*>/g, (m, r) => {
      if (r) { k++; return m; }
      if (!/\sfetchpriority="high"/.test(m)) return m;
      const src = attr(m, "src"), set = attr(m, "srcset"), w = attr(m, "width"), h = attr(m, "height");
      if (!src || src.startsWith("data:")) return m;
      const lq = lqipOf.get(src) || (w && h ? EMPTY(w, h) : null);
      if (!lq) return m;
      let tag = m.replace(/\sfetchpriority="high"/, "").replace(/\ssrc="[^"]*"/, ` src="${lq}" data-lz-src="${src}"`);
      if (set) tag = tag.replace(/\ssrcset="[^"]*"/, ` data-lz-srcset="${set}"`);
      if (rs.length > 1 && k >= 0 && sum) tag = tag.replace(/\ssizes="[^"]*"/, ` sizes="(max-width: 640px) 100vw, ${Math.ceil((rs[k] / sum) * 100)}vw"`);
      if (!first) first = { src, set, sz: attr(tag, "sizes") };
      return tag.replace(/^<img\b/, '<img data-lz="paint"');
    });
    t = t.slice(0, hr[0]) + done + t.slice(hr[1]);
  }
  // every lazy picture outside scripts, templates and styles waits for the gate
  t = t.split(/(<script\b[\s\S]*?<\/script>|<template\b[\s\S]*?<\/template>|<noscript\b[\s\S]*?<\/noscript>|<style\b[\s\S]*?<\/style>)/i).map((s, i) => i % 2 ? s : s.replace(/<img\b[^>]*>/g, (m) => {
    if (!/\sloading="lazy"/.test(m) || /\sdata-(?:lz|full|src)\b/.test(m)) return m;
    const src = attr(m, "src"), w = attr(m, "width"), h = attr(m, "height");
    if (!src || src.startsWith("data:") || !w || !h) return m;
    let tag = m.replace(/\ssrc="[^"]*"/, ` src="${EMPTY(w, h)}" data-lz-src="${src}"`);
    if (/\ssrcset="/.test(tag)) tag = tag.replace(/\ssrcset="([^"]*)"/, ' data-lz-srcset="$1"');
    return tag.replace(/^<img\b/, '<img data-lz="near"');
  })).join("");
  // the LCP picture: preloaded, at the head of the queue
  const lcp = t.split(/(<script\b[\s\S]*?<\/script>)/i).filter((s, i) => i % 2 === 0).join("").match(/<img\b[^>]*\sfetchpriority="high"[^>]*>/);
  if (lcp && !t.includes('rel="preload" as="image"')) {
    const src = attr(lcp[0], "src"), set = attr(lcp[0], "srcset"), sz = attr(lcp[0], "sizes");
    if (src && !src.startsWith("data:")) t = t.replace(/<\/title>/, `</title>\n<link rel="preload" as="image" href="${src}"${set ? ` imagesrcset="${set}"` : ""}${set && sz ? ` imagesizes="${sz}"` : ""} fetchpriority="high">`);
    // and painted in the frame it arrives in (decoding="async" let it wait a frame, past the load event); not a canvas
    // board's background (5-7 thousand pixels wide: decoded on the main thread it blocked the page, TBT 200 ms)
    if (/\sdecoding="async"/.test(lcp[0]) && !/\sclass="cv-bg"/.test(lcp[0])) t = t.replace(lcp[0], lcp[0].replace(/\sdecoding="async"/, ' decoding="sync"'));
  } else if (!lcp && first && !t.includes('rel="preload" as="image"')) {
    // TASK-015: no picture left at high priority (a standalone page whose heroes wait for the title): the first hero
    // is still fetched from the start, so it is in the cache when the gate shows it after the title (mobile LCP)
    t = t.replace(/<\/title>/, `</title>\n<link rel="preload" as="image" href="${first.src}"${first.set ? ` imagesrcset="${first.set}"` : ""}${first.set && first.sz ? ` imagesizes="${first.sz}"` : ""} fetchpriority="high">`);
  }
  if (!t.includes("r139d-gate")) t = t.replace(/<head>|<head [^>]*>/, (h) => `${h}\n${GATE_JS}`);
  return t;
}

// TASK-015: AVIF first, then WebP, then the original. On a case page each picture with an AVIF set becomes
//   <picture class="av"><source type="image/avif" …><source type="image/webp" …><img src="original.jpg" …></picture>
// (a WebP original keeps its WebP srcset on the <img>: no second source). A picture still waiting for the gate keeps
// its sets in data-lz-srcset on the sources too (GATE_JS swap fills them). picture.av is display:contents, and every
// `X>img` selector in the page's styles gets an `X>picture>img` twin, so the layout stays as it was. The LCP preload
// asks for the AVIF set (type="image/avif": a browser without AVIF skips it and takes the WebP from the <picture>).
const SPLIT = /(<script\b[\s\S]*?<\/script>|<template\b[\s\S]*?<\/template>|<noscript\b[\s\S]*?<\/noscript>|<style\b[\s\S]*?<\/style>)/i;
const CHILD_IMG = />\s*img(?![\w-])/;
function splitSelectors(s) { const out = []; let d = 0, cur = ""; for (const ch of s) { if (ch === "(" || ch === "[") d++; else if (ch === ")" || ch === "]") d--; if (ch === "," && !d) { out.push(cur); cur = ""; } else cur += ch; } out.push(cur); return out; }
export function twinChildImg(css) {
  if (!CHILD_IMG.test(css)) return css;
  return css.replace(/\/\*[\s\S]*?\*\//g, "").replace(/([^{}]+)\{/g, (m, pre) => {
    if (!CHILD_IMG.test(pre) || /^\s*@/.test(pre)) return m;
    const add = splitSelectors(pre).filter((s) => CHILD_IMG.test(s)).map((s) => s.trim().replace(new RegExp(CHILD_IMG.source, "g"), ">picture>img"));
    return `${pre.trimEnd()},${add.join(",")}{`;
  });
}
const setOf = (list) => list.map((x) => `${x.src} ${x.w}w`).join(", ");
function pictures(html, avifOf) {
  if (!avifOf.size) return html;
  let n = 0;
  const parts = html.split(SPLIT);
  for (let i = 0; i < parts.length; i += 2) {
    const s = parts[i];
    parts[i] = s.replace(/<img\b[^>]*>/g, (m, off) => {
      if (/\sdata-(?:full|anim-srcset|srcset)\b/.test(m) || /\sclass="cv-/.test(m)) return m;
      const lz = /\sdata-lz-src="/.test(m), k = lz ? "data-lz-srcset" : "srcset";
      const v = avifOf.get(attr(m, lz ? "data-lz-src" : "src"));
      if (!v) return m;
      const before = s.slice(0, off);
      if (before.lastIndexOf("<picture") > before.lastIndexOf("</picture>")) return m;
      const sizes = attr(m, "sizes") || "100vw", webpSet = attr(m, k) || setOf(v.set);
      let tag = m, webpSource = "";
      if (!v.webpOrig) {
        webpSource = `<source type="image/webp" ${k}="${webpSet}" sizes="${sizes}">`;
        tag = tag.replace(new RegExp(`\\s${k}="[^"]*"`), "").replace(lz ? /\sdata-lz-src="[^"]*"/ : /\ssrc="[^"]*"/, lz ? ` data-lz-src="${v.orig}"` : ` src="${v.orig}"`);
      }
      n++;
      return `<picture class="av"><source type="image/avif" ${k}="${setOf(v.avif)}" sizes="${sizes}">${webpSource}${tag}</picture>`;
    });
  }
  if (!n) return html;
  for (let i = 1; i < parts.length; i += 2) if (/^<style\b/i.test(parts[i])) parts[i] = twinChildImg(parts[i]);
  let t = parts.join("");
  t = t.replace(/<link rel="preload" as="image" href="([^"]+)"([^>]*)>/, (m, href, rest) => {
    const v = avifOf.get(href);
    if (!v) return m;
    const j = v.set.findIndex((x) => x.src === href);
    if (j < 0) return m;
    return `<link rel="preload" as="image" href="${v.avif[j].src}" type="image/avif"${/imagesrcset=/.test(rest) ? rest.replace(/\simagesrcset="[^"]*"/, ` imagesrcset="${setOf(v.avif)}"`) : rest}>`;
  });
  return t.replace(/<\/title>/, "</title>\n<style>picture.av{display:contents}</style>");
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
