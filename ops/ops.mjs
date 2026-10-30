// TASK-124: "cromaticstudios.com ops", the password-protected MIRROR of the Cromatic Ops artifact, at /ops (beta and live hosts).
//
// The server never runs AI and never executes anything. It keeps:
//   - snapshot.json   the last snapshot pushed by the coordinator's bridge (tools/ops-bridge.mjs on Daniel's Mac)
//   - outbox.jsonl    commands / bugs / feedback typed by colleagues, waiting for the bridge to pull them
//   - sessions.json   server-side sessions (only the sha256 of the cookie value is stored)
//   - logins.jsonl    one line per login event (never a code)
// in a data dir outside the release (like CORE30_DATA / LEADS_DIRS).
//
// Login is passwordless: email -> a 6-digit code by mail (10 min, 5 attempts, rate limited per IP and per email)
// -> an HttpOnly session cookie (12 h). The answer to POST /login is the same whether the email is on the list or not.
//
// Routes (the bridge side is documented in ~/cromatic-ops/tools/ops-bridge.md on the coordinator Mac):
//   GET  /ops                     the app (or the login page when there is no session)
//   GET  /ops/<asset>             the files in ops/www (whitelisted names)
//   POST /api/ops/login           {email}            -> {ok:true} always (a code is mailed if the email is allowed)
//   POST /api/ops/verify          {email, code}      -> sets the cookie
//   POST /api/ops/logout
//   GET  /api/ops/me
//   GET  /api/ops/snapshot        (session) the snapshot, filtered by role
//   POST /api/ops/inbox           (session) {kind: command|bug|feedback, text, payload?, page?, device?}
//   GET  /api/ops/bridge/outbox?since=<iso>     (Bearer key)
//   POST /api/ops/bridge/snapshot               (Bearer key) {collections:{name:{id:doc}}, generatedAt}
//   POST /api/ops/bridge/ack                    (Bearer key) {ids:[...], replies?:{id:text}}
//   POST /api/ops/bridge/proposal               (Bearer key) {slug, files:{name: html}, preview?: true}   TASK-135: offers
//        published -> <dataDir>/proposals/<slug>/ (served at /proposals/<slug>/<file> by server.js, after the repo's own proposals/)
//        preview   -> <dataDir>/offer-previews/<slug>/ (served at /ops/preview/<slug>/<file>, admins only, never public)
//   DELETE /api/ops/bridge/proposal             (Bearer key) {slug, preview?: true, all?: true}   withdraws a published offer (data dir only,
//        all: true removes the published files AND the preview ("Șterge" in the tab);
//        never the repo's proposals/ folder) or drops a preview; logged in proposals.jsonl
//   GET  /ops/preview/<slug>/<file>             (admin session) an offer preview, framed by the Ofertă tab
//   GET  /api/ops/perf                          (admin session) TASK-141: the Performance page's data (ops/metrics.mjs)
//   POST /api/ops/perf/run                      (admin session) "Măsoară acum": 202 at once, the run goes on in the background; at most one per 15 min
import { readFileSync, writeFileSync, appendFileSync, renameSync, mkdirSync, statSync, readdirSync, createReadStream, rmSync } from "node:fs";
import { join, extname } from "node:path";
import { randomBytes, randomInt, createHash, timingSafeEqual } from "node:crypto";
import { createMetrics } from "./metrics.mjs";

// the allow-list lives in ops/users.json (one place to edit); <dataDir>/users.json overrides it on a server
const USERS_FILE = new URL("./users.json", import.meta.url);

const CODE_TTL = 10 * 60e3, CODE_TRIES = 5, SESSION_TTL = 12 * 3600e3;
const COOKIE = "ops_sid";
const KINDS = new Set(["command", "bug", "feedback"]);
const TASK_FIELDS = new Set(["status", "priority", "agent", "epicId"]); // what a "task-edit" may change
const REJECT_SHOW = 6 * 3600e3; // a rejected edit stays visible on its card (for the toast + animation) this long
const ADMIN_PAYLOAD_TYPES = new Set(["core-request", "offer-new", "offer-edit", "offer-publish", "offer-unpublish", "offer-delete"]); // members cannot send these
const OFFER_TYPES = new Set(["offer-new", "offer-edit", "offer-publish", "offer-unpublish", "offer-delete"]); // TASK-135: a whole offer config rides in the payload (bigger limit)
// TASK-135: offers published without a deploy. A slug is <client>-<10 hex>, the code being the key; files are flat .html names
export const PROPOSAL_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*-[0-9a-f]{10}$/;
export const PROPOSAL_FILE_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*\.html$/i;
const PROPOSAL_FILE_MAX = 4 * 1048576, PROPOSAL_FILES_MAX = 6, PROPOSAL_BODY_MAX = 12 * 1048576;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ASSETS = { "nav.js": "text/javascript; charset=utf-8", "perf.js": "text/javascript; charset=utf-8", "perf.css": "text/css; charset=utf-8", "offers.js": "text/javascript; charset=utf-8", "offers.css": "text/css; charset=utf-8", "login.css": "text/css; charset=utf-8", "logo.css": "text/css; charset=utf-8", "adapter.js": "text/javascript; charset=utf-8", "login.js": "text/javascript; charset=utf-8", "ops.css": "text/css; charset=utf-8", "favicon.svg": "image/svg+xml" };

const sha = (x) => createHash("sha256").update(String(x)).digest();
const shaHex = (x) => createHash("sha256").update(String(x)).digest("hex");
const eq = (a, b) => timingSafeEqual(sha(a), sha(b));
const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** a sliding-window counter: hit(key) returns true when the key went over `max` in `win` ms */
function limiter(max, win) {
  const m = new Map();
  return (key) => {
    const now = Date.now();
    if (m.size > 5000) for (const [k, v] of m) if (!v.length || now - v[v.length - 1] > win) m.delete(k);
    const list = (m.get(key) || []).filter((t) => now - t < win);
    list.push(now); m.set(key, list);
    return list.length > max;
  };
}

// ---------- uploads (logos, page visuals, PDFs, videos) ----------
const UP_MAX = 25 * 1048576;
const UP_RE = /^up-(\d{6})-[a-f0-9]{12}$/;
const UP_FILE_RE = /^(original\.(png|jpg|webp|avif|svg|pdf|mp4|webm)|optimized\.(webp|jpg|png)|clean\.svg|preview\.webp|meta\.json)$/;
const UP_TYPES = { png: "image/png", jpg: "image/jpeg", webp: "image/webp", avif: "image/avif", svg: "image/svg+xml", pdf: "application/pdf", mp4: "video/mp4", webm: "video/webm", json: "application/json" };
const UP_KINDS = new Set(["logo", "visual", "other"]);
const VIDEO_TYPES = new Set(["youtube", "vimeo", "drive", "wetransfer", "dropbox", "other"]);
let sharpP = null; // loaded on the first upload; null when sharp is not installed at runtime (it is a devDependency of the site)
const getSharp = () => (sharpP ??= process.env.OPS_NO_SHARP ? Promise.resolve(null) : import("sharp").then((m) => { const s = m.default; s.cache(false); return s; }).catch(() => null));
/** the real type, from the first bytes (never from the name or the Content-Type header) */
export function sniff(buf) {
  const h = buf.subarray(0, 64), asc = (a, b) => h.subarray(a, b).toString("latin1");
  if (h[0] === 0x89 && asc(1, 4) === "PNG") return "png";
  if (h[0] === 0xff && h[1] === 0xd8 && h[2] === 0xff) return "jpg";
  if (asc(0, 4) === "RIFF" && asc(8, 12) === "WEBP") return "webp";
  if (asc(4, 8) === "ftyp") { const brand = asc(8, 12); if (/^avi[fs]$/.test(brand)) return "avif"; if (/^(isom|iso\d|mp4\d|mp41|mp42|avc1|M4V |M4A |dash|MSNV|qt  )$/.test(brand)) return "mp4"; }
  if (h[0] === 0x1a && h[1] === 0x45 && h[2] === 0xdf && h[3] === 0xa3) return "webm";
  if (asc(0, 5) === "%PDF-") return "pdf";
  const t = buf.subarray(0, 2048).toString("utf8").replace(/^﻿/, "").replace(/<\?xml[\s\S]*?\?>/i, "").replace(/<!--[\s\S]*?-->/g, "").replace(/<!DOCTYPE[^[>]*(\[[\s\S]*?\])?\s*>/i, "").trimStart();
  if (/^<svg[\s>]/i.test(t)) return "svg";
  return null;
}
/** an SVG made safe to keep: no scripts, handlers, foreignObject, external references, entities */
export function sanitizeSvg(src) {
  let s = String(src).replace(/^﻿/, "");
  s = s.replace(/<!DOCTYPE[^[>]*(\[[\s\S]*?\])?\s*>/gi, "").replace(/<!ENTITY[\s\S]*?>/gi, "").replace(/<\?(?!xml\s)[\s\S]*?\?>/gi, "");
  const BAD = "script|foreignObject|iframe|embed|object|audio|video|canvas|handler|listener|base|meta|link";
  s = s.replace(new RegExp("<(" + BAD + ")\\b[\\s\\S]*?<\\/\\1\\s*>", "gi"), "").replace(new RegExp("<\\/?(" + BAD + ")\\b[^>]*>", "gi"), "");
  s = s.replace(/<(set|animate|animateTransform|animateMotion)\b[^>]*\battributeName\s*=\s*["']?(xlink:)?href[^>]*>/gi, "");
  s = s.replace(/\s(on[a-z]+)\s*=\s*("[^"]*"|'[^']*'|[^\s>]+)/gi, "");
  s = s.replace(/\s((?:xlink:)?href|src)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/gi, (m, a, _q, d1, d2, d3) => {
    const v = String(d1 ?? d2 ?? d3 ?? "").trim();
    return /^#[\w.-]+$/.test(v) || /^data:image\/(png|jpe?g|gif|webp);base64,[a-z0-9+/=\s]+$/i.test(v) ? m : "";
  });
  s = s.replace(/@import[^;]*;?/gi, "").replace(/url\(\s*(['"]?)(?!#|data:image\/(png|jpe?g|gif|webp);)[^)]*\)/gi, "none");
  s = s.replace(/javascript\s*:/gi, "").replace(/expression\s*\(/gi, "").replace(/-moz-binding/gi, "");
  s = s.replace(/&(?!(amp|lt|gt|quot|apos|#\d+|#x[0-9a-f]+);)[\w.:-]+;/gi, ""); // entity references left without their DTD
  return s;
}
const svgSafe = (s) => !/<script|<foreignObject|javascript:|\son[a-z]+\s*=|<!ENTITY|xlink:href\s*=\s*["']?(?![#"'])|\shref\s*=\s*["']?(?![#"']|data:image)/i.test(s);
/** width / height from the header, for when sharp is not there */
function dims(buf, ext) {
  try {
    if (ext === "png") return [buf.readUInt32BE(16), buf.readUInt32BE(20)];
    if (ext === "jpg") { let i = 2; while (i < buf.length) { if (buf[i] !== 0xff) return null; const m = buf[i + 1], len = buf.readUInt16BE(i + 2); if (m >= 0xc0 && m <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(m)) return [buf.readUInt16BE(i + 7), buf.readUInt16BE(i + 5)]; i += 2 + len; } }
    if (ext === "webp") { const c = buf.subarray(12, 16).toString("latin1"); if (c === "VP8X") return [1 + buf.readUIntLE(24, 3), 1 + buf.readUIntLE(27, 3)]; if (c === "VP8 ") return [buf.readUInt16LE(26) & 0x3fff, buf.readUInt16LE(28) & 0x3fff]; if (c === "VP8L") { const b = buf.readUInt32LE(21); return [1 + (b & 0x3fff), 1 + ((b >> 14) & 0x3fff)]; } }
    if (ext === "svg") { const t = buf.subarray(0, 4096).toString("utf8"), w = /<svg[^>]*\swidth\s*=\s*["']?([\d.]+)/i.exec(t), h = /<svg[^>]*\sheight\s*=\s*["']?([\d.]+)/i.exec(t), vb = /viewBox\s*=\s*["']\s*[\d.-]+[\s,]+[\d.-]+[\s,]+([\d.]+)[\s,]+([\d.]+)/i.exec(t); if (w && h) return [Math.round(+w[1]), Math.round(+h[1])]; if (vb) return [Math.round(+vb[1]), Math.round(+vb[2])]; }
  } catch {}
  return null;
}
/** a video link (never fetched by the server): https only, type detected */
export function videoLink(u) {
  let x; try { x = new URL(String(u || "").trim()); } catch { return null; }
  if (x.protocol !== "https:" || String(u).length > 500) return null;
  const h = x.hostname.replace(/^www\.|^m\./, "");
  let m;
  if (h === "youtu.be" && (m = /^\/([\w-]{11})/.exec(x.pathname))) return { url: x.href, type: "youtube", id: m[1] };
  if (/(^|\.)youtube(-nocookie)?\.com$/.test(h)) { const id = x.searchParams.get("v") || (/^\/(?:shorts|embed|live)\/([\w-]{11})/.exec(x.pathname) || [])[1]; return { url: x.href, type: "youtube", ...(id && /^[\w-]{11}$/.test(id) ? { id } : {}) }; }
  if (/(^|\.)vimeo\.com$/.test(h)) { m = /\/(\d{6,})/.exec(x.pathname); return { url: x.href, type: "vimeo", ...(m ? { id: m[1] } : {}) }; }
  if (/^(drive|docs)\.google\.com$/.test(h)) return { url: x.href, type: "drive" };
  if (/(^|\.)wetransfer\.com$|^we\.tl$/.test(h)) return { url: x.href, type: "wetransfer" };
  if (/(^|\.)dropbox\.com$|^db\.tt$/.test(h)) return { url: x.href, type: "dropbox" };
  return { url: x.href, type: "other" };
}

/**
 * @param {object} o
 * @param {string} o.dataDir     ops-data folder (created if missing)
 * @param {string} o.wwwDir      ops/www
 * @param {object} o.transport   nodemailer transport (the server's own)
 * @param {string} o.mailFrom
 * @param {boolean} o.smtpConfigured  false in dev: the code is printed to the console (never when NODE_ENV=production)
 * @param {(given:string)=>boolean} o.bridgeKeyOk  constant-time check of the bridge's Bearer key
 * @param {Array} [o.users]   default: <dataDir>/users.json, else ops/users.json
 */
export function createOps({ dataDir, wwwDir, transport, mailFrom, smtpConfigured, bridgeKeyOk, users, log = console }) {
  mkdirSync(dataDir, { recursive: true });
  if (!users) {
    for (const f of [join(dataDir, "users.json"), USERS_FILE]) {
      try { users = JSON.parse(readFileSync(f, "utf8")).users; if (Array.isArray(users)) { log.log(`[ops] allow-list from ${f instanceof URL ? "ops/users.json" : f} (${users.length} people)`); break; } } catch {}
    }
    if (!Array.isArray(users)) { users = []; log.error("[ops] no allow-list found: nobody can log in"); }
  }
  users = users.filter((u) => u && u.id && u.name && (u.role === "admin" || u.role === "member") && Array.isArray(u.emails));
  const P = (f) => join(dataDir, f);
  const prod = process.env.NODE_ENV === "production";
  const metrics = createMetrics({ dataDir, log }); // TASK-141: PageSpeed + GA4, background jobs only
  metrics.start();
  const byEmail = new Map();
  for (const u of users) for (const e of u.emails) byEmail.set(e.toLowerCase(), u);

  // ---------- files ----------
  const readJson = (f, dflt) => { try { return JSON.parse(readFileSync(P(f), "utf8")); } catch { return dflt; } };
  const writeJson = (f, v) => { const tmp = P(f + ".tmp-" + process.pid); writeFileSync(tmp, JSON.stringify(v), { mode: 0o600 }); renameSync(tmp, P(f)); };
  const appendLine = (f, v) => { try { appendFileSync(P(f), JSON.stringify(v) + "\n", { mode: 0o600 }); } catch (e) { log.error("[ops] append", f, e.message); } };
  const readLines = (f) => { let s = ""; try { s = readFileSync(P(f), "utf8"); } catch { return []; } return s.split("\n").filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean); };

  let sessions = readJson("sessions.json", {});
  const saveSessions = () => { const now = Date.now(); for (const [k, s] of Object.entries(sessions)) if (s.exp < now) delete sessions[k]; writeJson("sessions.json", sessions); };
  let snapCache = null, snapMtime = 0;
  function snapshot() {
    let st; try { st = statSync(P("snapshot.json")); } catch { return { collections: {}, generatedAt: null }; }
    if (!snapCache || st.mtimeMs !== snapMtime) { snapCache = readJson("snapshot.json", { collections: {}, generatedAt: null }); snapMtime = st.mtimeMs; }
    return snapCache;
  }

  // ---------- helpers ----------
  const codes = new Map(); // email -> {hash, exp, tries}
  const ipLogin = limiter(10, 15 * 60e3), emailLogin = limiter(3, 15 * 60e3), ipVerify = limiter(20, 15 * 60e3), userInbox = limiter(30, 10 * 60e3);
  const userUpload = limiter(40, 10 * 60e3);
  const UP_DIR = join(dataDir, "uploads"), UP_CAP = Number(process.env.OPS_UPLOAD_CAP_MB || 2048) * 1048576;
  let upUsed = null;
  const du = (d) => { let n = 0; let list = []; try { list = readdirSync(d, { withFileTypes: true }); } catch { return 0; } for (const e of list) { const p = join(d, e.name); n += e.isDirectory() ? du(p) : (statOr(p)?.size || 0); } return n; };
  const statOr = (p) => { try { return statSync(p); } catch { return null; } };

  async function upload(req, res, s, u) {
    if (userUpload(s.email)) return json(res, 429, { ok: false, error: "rate", message: "Prea multe fișiere deodată. Mai încearcă în câteva minute." });
    const len = Number(req.headers["content-length"] || 0);
    if (len > UP_MAX) { res.setHeader("Connection", "close"); return json(res, 413, { ok: false, error: "too_large", message: "Fișierul e peste 25 MB." }); }
    if (upUsed === null) upUsed = du(UP_DIR);
    if (upUsed + (len || 0) > UP_CAP) return json(res, 507, { ok: false, error: "quota", message: "Spațiul pentru fișiere din ops e plin (" + Math.round(UP_CAP / 1048576 / 1024 * 10) / 10 + " GB). Spune-i lui Daniel." });
    const chunks = []; let n = 0;
    for await (const c of req) { n += c.length; if (n > UP_MAX) { res.setHeader("Connection", "close"); json(res, 413, { ok: false, error: "too_large", message: "Fișierul e peste 25 MB." }); req.destroy(); return; } chunks.push(c); }
    const buf = Buffer.concat(chunks);
    if (!buf.length) return json(res, 422, { ok: false, error: "empty", message: "Fișierul e gol." });
    const ext = sniff(buf);
    if (!ext) return json(res, 415, { ok: false, error: "type", message: "Tip neacceptat. Merg PNG, JPG, WebP, AVIF, SVG, PDF, MP4 și WebM." });
    if (upUsed + buf.length > UP_CAP) return json(res, 507, { ok: false, error: "quota", message: "Spațiul pentru fișiere din ops e plin. Spune-i lui Daniel." });
    const kind = UP_KINDS.has(u.searchParams.get("kind")) ? u.searchParams.get("kind") : "other";
    const name = (str(u.searchParams.get("name") || "", 140).replace(/[\u0000-\u001f\\/<>:"|?*]+/g, "_") || "fisier." + ext);
    const now = new Date(), ym = now.toISOString().slice(0, 7).replace("-", ""), id = `up-${ym}-${randomBytes(6).toString("hex")}`;
    const dir = join(UP_DIR, ym, id); mkdirSync(dir, { recursive: true });
    const files = [];
    const put = (f, b) => { writeFileSync(join(dir, f), b, { mode: 0o600 }); files.push(f); return b.length; };
    put("original." + ext, buf);
    let w = null, h = null, bytesAfter = buf.length, optimize = false, note = "";
    if (ext === "svg") {
      const clean = sanitizeSvg(buf.toString("utf8"));
      if (!svgSafe(clean) || !/<svg[\s>]/i.test(clean)) { note = "svg-unsafe"; }
      else { bytesAfter = put("clean.svg", Buffer.from(clean)); [w, h] = dims(Buffer.from(clean), "svg") || [null, null]; }
    }
    const sharp = /^(png|jpg|webp|avif|svg)$/.test(ext) && !(ext === "svg" && note) ? await getSharp() : null;
    if (sharp) {
      try {
        const input = ext === "svg" ? readFileSync(join(dir, "clean.svg")) : buf;
        const base = () => {
          let p = sharp(input, { density: ext === "svg" ? 200 : 72, failOn: "none", limitInputPixels: 80e6 }).rotate();
          if (kind === "logo") p = p.trim({ threshold: 12 });
          return p.resize({ width: 2400, height: 2400, fit: "inside", withoutEnlargement: ext !== "svg" });
        };
        if (ext === "svg") { const b = await base().webp({ quality: 86 }).toBuffer({ resolveWithObject: true }); put("preview.webp", b.data); w = w || b.info.width; h = h || b.info.height; }
        else {
          const webp = await base().webp({ quality: 82, alphaQuality: 90 }).toBuffer({ resolveWithObject: true });
          bytesAfter = put("optimized.webp", webp.data); w = webp.info.width; h = webp.info.height;
          if (kind === "logo") put("optimized.png", (await base().png({ compressionLevel: 9, palette: false }).toBuffer()));
          else put("optimized.jpg", await base().flatten({ background: "#ffffff" }).jpeg({ quality: 82, mozjpeg: true }).toBuffer());
        }
        optimize = true;
      } catch (e) { note = "optimize-failed"; log.error("[ops] upload optimize", e.message); }
    } else if (!w) { const d = dims(buf, ext); if (d) [w, h] = d; }
    const url = (f) => "/api/ops/uploads/" + id + "/" + f;
    const urls = { original: url("original." + ext) };
    if (files.includes("optimized.webp")) urls.webp = url("optimized.webp");
    if (files.includes("optimized.jpg")) urls.jpg = url("optimized.jpg");
    if (files.includes("optimized.png")) urls.png = url("optimized.png");
    if (files.includes("clean.svg")) urls.svg = url("clean.svg");
    if (files.includes("preview.webp")) urls.preview = url("preview.webp");
    const meta = { id, by: s.email, byName: s.user.name, name, size: buf.length, type: UP_TYPES[ext], ext, w, h, kind, createdAt: now.toISOString(), optimize, ...(note ? { note } : {}), bytesBefore: buf.length, bytesAfter, files: [...files, "meta.json"], urls };
    put("meta.json", Buffer.from(JSON.stringify(meta, null, 2)));
    upUsed += files.reduce((a, f) => a + (statOr(join(dir, f))?.size || 0), 0);
    appendLine("uploads.jsonl", { at: meta.createdAt, id, by: s.email, name, ext, size: buf.length, kind, optimize });
    return json(res, 200, { ok: true, id, name, kind, type: meta.type, urls, w, h, bytesBefore: buf.length, bytesAfter, optimize, ...(note ? { note } : {}) });
  }
  function serveUpload(req, res, id, f) {
    const p = join(UP_DIR, id.slice(3, 9), id, f), st = statOr(p);
    if (!st || !st.isFile()) return json(res, 404, { ok: false });
    const ext = f.split(".").pop(), type = UP_TYPES[ext] || "application/octet-stream";
    const headers = { ...HDR, "Cache-Control": "private, max-age=86400", "Content-Type": type, "Accept-Ranges": "bytes",
      "Content-Security-Policy": "sandbox; default-src 'none'; img-src data:; style-src 'unsafe-inline'; media-src 'self'", "Cross-Origin-Resource-Policy": "same-origin" };
    // an SVG or a PDF is never rendered as a page from here: download only (an <img> still shows it)
    if (ext === "svg" || ext === "pdf" || f.startsWith("original.")) headers["Content-Disposition"] = `attachment; filename="${id}-${f}"`;
    let start = 0, end = st.size - 1, code = 200;
    const rg = req.headers.range && /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
    if (rg) { start = rg[1] ? Number(rg[1]) : st.size - Number(rg[2]); end = rg[1] && rg[2] ? Math.min(Number(rg[2]), st.size - 1) : st.size - 1; if (start >= st.size || start < 0 || start > end) { res.writeHead(416, { "Content-Range": `bytes */${st.size}` }); return res.end(); } code = 206; headers["Content-Range"] = `bytes ${start}-${end}/${st.size}`; }
    headers["Content-Length"] = end - start + 1;
    res.writeHead(code, headers);
    if (req.method === "HEAD") return res.end();
    createReadStream(p, { start, end }).on("error", () => res.destroy()).pipe(res);
  }
  const ipOf = (req) => String(req.headers["cf-connecting-ip"] || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();
  const logLogin = (event, email, req, extra) => appendLine("logins.jsonl", { at: new Date().toISOString(), event, email: email || "", ip: ipOf(req), ua: str(req.headers["user-agent"], 160), ...(extra || {}) });

  const HDR = {
    "Cache-Control": "no-store", "X-Robots-Tag": "noindex, nofollow, noarchive", "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "no-referrer", "X-Frame-Options": "DENY", "Strict-Transport-Security": "max-age=31536000",
    "Permissions-Policy": "camera=(), microphone=(), payment=(), usb=()",
  };
  function json(res, code, obj, extra) {
    const s = JSON.stringify(obj);
    res.writeHead(code, { ...HDR, "Content-Type": "application/json; charset=utf-8", "Content-Length": Buffer.byteLength(s), ...(extra || {}) });
    res.end(s);
  }
  async function body(req, limit) {
    if (Number(req.headers["content-length"]) > limit) throw Object.assign(new Error("too large"), { status: 413 });
    const chunks = []; let n = 0;
    for await (const c of req) { n += c.length; if (n > limit) throw Object.assign(new Error("too large"), { status: 413 }); chunks.push(c); }
    try { return JSON.parse(Buffer.concat(chunks).toString("utf8") || "{}"); } catch { throw Object.assign(new Error("bad json"), { status: 400 }); }
  }
  // CSRF: SameSite=Lax on the cookie + the Origin of every browser POST must be this host
  function originOk(req) {
    const o = String(req.headers.origin || ""), host = String(req.headers.host || "");
    if (!o || !host) return false;
    return o === "https://" + host || (!prod && o === "http://" + host);
  }
  function cookieOf(req) { const m = new RegExp("(?:^|;\\s*)" + COOKIE + "=([A-Za-z0-9_-]{20,100})").exec(String(req.headers.cookie || "")); return m ? m[1] : ""; }
  function sessionOf(req) {
    const sid = cookieOf(req); if (!sid) return null;
    const s = sessions[shaHex(sid)];
    if (!s || s.exp < Date.now()) return null;
    const u = byEmail.get(s.email); if (!u) return null; // removed from the list: the session dies with it
    return { ...s, user: u, key: shaHex(sid) };
  }
  const secure = (req) => prod || !/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(String(req.headers.host || ""));
  const setCookie = (req, v, maxAge) => `${COOKIE}=${v}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure(req) ? "; Secure" : ""}`;
  const pub = (s) => ({ email: s.email, name: s.user.name, id: s.user.id, role: s.user.role, initial: s.user.name.slice(0, 1).toUpperCase(), exp: new Date(s.exp).toISOString() });

  // ---------- mail ----------
  function mailCode(email, name, code) {
    const { subject, text, html } = codeMail(name, code);
    if (!smtpConfigured) {
      if (!prod) log.log(`[ops] dev: no SMTP, the code for ${email} is ${code}`);
      else log.warn("[ops] SMTP is not configured: the login code could not be sent");
      return;
    }
    transport.sendMail({ from: mailFrom, to: email, subject, text, html })
      .then(() => {}).catch((e) => log.error("[ops] mail", String(e && (e.responseCode || e.code) || ""), String(e && e.message || e).replace(/[\w.+-]+@[\w.-]+/g, "<email>").slice(0, 200)));
  }

  // ---------- snapshot filtering ----------
  const SECRET_KEY = /^(token|tok|secret|password|pass|apikey|api_key|adminkey|admin_key|key)$/i;
  const T_PARAM = /[?&](t|token|key)=/i;
  function scrub(v, depth = 0) {
    if (depth > 12) return null;
    if (typeof v === "string") return T_PARAM.test(v) ? v.replace(/https?:\/\/\S*[?&](t|token|key)=[^\s"'<)]+/gi, "[link ascuns]").replace(/[?&](t|token|key)=[^\s"']*/gi, "") : v;
    if (Array.isArray(v)) return v.map((x) => scrub(x, depth + 1));
    if (v && typeof v === "object") {
      const o = {};
      for (const [k, x] of Object.entries(v)) {
        if (SECRET_KEY.test(k)) continue;
        if ((k === "link" || k === "url" || k === "href") && typeof x === "string" && T_PARAM.test(x)) continue;
        o[k] = scrub(x, depth + 1);
      }
      return o;
    }
    return v;
  }
  function forRole(snap, role) {
    const c = snap.collections || {};
    if (role === "admin") return { collections: c, generatedAt: snap.generatedAt };
    const out = {};
    for (const [name, docs] of Object.entries(c)) {
      if (name === "coreRequests" || name === "approvals" || name === "security" || name === "offers" || name === "analytics") continue; // TASK-135: offers are admins only; TASK-141: so are GA4 numbers
      if (name === "core") { out.core = {}; for (const [id, d] of Object.entries(docs || {})) { const { token, link, url, links, log: _l, ...rest } = d || {}; out.core[id] = scrub(rest); } continue; }
      out[name] = scrub(docs);
    }
    return { collections: out, generatedAt: snap.generatedAt };
  }
  // colleagues' messages not yet in the artifact show up in the conversation right away, as "Trimis"
  function withOutbox(view) {
    const snapAt = Date.parse(view.generatedAt || 0) || 0;
    const inbox = { ...(view.collections.inbox || {}) };
    const out = readLines("outbox.jsonl"), tasks = { ...(view.collections.tasks || {}) }, now = Date.now();
    // optimistic task edits: pending ones are applied (with a _opsPending marker) so every user sees the moved card;
    // a pending edit the snapshot already reflects is done; a rejected one is shown for a while, not applied
    for (const x of out) {
      const pl = x.payload; if (!pl || pl.type !== "task-edit" || !tasks[pl.taskId]) continue;
      const cur = tasks[pl.taskId], mark = { id: x.id, field: pl.field, from: pl.from, to: pl.to, createdAt: x.createdAt, by: x.name, byEmail: x.from };
      if (x.status === "rejected") { if (now - (Date.parse(x.resolvedAt || x.ackedAt || x.createdAt) || 0) < REJECT_SHOW) tasks[pl.taskId] = { ...cur, _opsRejected: [...(cur._opsRejected || []), { ...mark, reply: x.reply || "" }] }; continue; }
      if (x.status === "done") continue;
      if (String(cur[pl.field] ?? "") === pl.to && snapAt > (Date.parse(x.createdAt) || 0)) continue;
      tasks[pl.taskId] = { ...cur, [pl.field]: pl.to, _opsPending: [...(cur._opsPending || []), mark] };
    }
    for (const x of out) {
      if (inbox[x.id]) continue;
      if (x.status !== "new" && !(Date.parse(x.resolvedAt || x.ackedAt || 0) > snapAt)) continue;
      inbox[x.id] = { createdAt: x.createdAt, from: "ops:" + x.from, kind: x.kind, text: x.text, payload: x.payload || null, status: x.status === "rejected" ? "declined" : x.status === "done" ? "done" : "new", reply: x.reply || "", by: { email: x.from, name: x.name, role: x.role }, pending: true };
    }
    return { ...view, collections: { ...view.collections, inbox, ...(view.collections.tasks ? { tasks } : {}) } };
  }

  // ---------- app files ----------
  function file(res, name, type) {
    let buf; try { buf = readFileSync(join(wwwDir, name)); } catch { res.writeHead(404, HDR); return res.end(); }
    res.writeHead(200, { ...HDR, "Content-Type": type, "Content-Length": buf.length });
    res.end(buf);
  }

  // ---------- the handler: returns true when it answered ----------
  return async function ops(req, res) {
    const u = new URL(req.url, "http://x"), p = u.pathname, m = req.method;
    try {
      if (p === "/ops" || p === "/ops/") {
        if (m !== "GET" && m !== "HEAD") { res.writeHead(405, HDR); res.end(); return true; }
        file(res, sessionOf(req) ? "index.html" : "login.html", "text/html; charset=utf-8"); return true;
      }
      const pv = /^\/ops\/preview\/([^/]+)\/([^/]+)$/.exec(p);
      if (pv) { // TASK-135: an offer preview, for admins only (the Ofertă tab frames it); same files as the published offer
        const s0 = sessionOf(req);
        if (!s0 || s0.user.role !== "admin") { res.writeHead(s0 ? 403 : 401, { ...HDR, "Content-Type": "text/plain; charset=utf-8" }); res.end(s0 ? "Doar pentru admini." : "Intră în /ops mai întâi."); return true; }
        if ((m !== "GET" && m !== "HEAD") || !PROPOSAL_SLUG_RE.test(pv[1]) || !PROPOSAL_FILE_RE.test(pv[2])) { res.writeHead(404, HDR); res.end(); return true; }
        const f = join(dataDir, "offer-previews", pv[1], pv[2]), st = statOr(f);
        if (!st || !st.isFile()) { res.writeHead(404, { ...HDR, "Content-Type": "text/plain; charset=utf-8" }); res.end("Preview-ul nu e încă aici."); return true; }
        res.writeHead(200, { ...HDR, "X-Frame-Options": "SAMEORIGIN", "Content-Security-Policy": "frame-ancestors 'self'", "Content-Type": "text/html; charset=utf-8", "Content-Length": st.size });
        if (m === "HEAD") { res.end(); return true; }
        createReadStream(f).on("error", () => res.destroy()).pipe(res); return true;
      }
      if (p === "/ops/offer-prices.json") { // TASK-135: the offer base prices, admins only (the one place to change them)
        const s0 = sessionOf(req);
        if (!s0 || s0.user.role !== "admin") { json(res, s0 ? 403 : 401, { ok: false }); return true; }
        file(res, "offer-prices.json", "application/json; charset=utf-8"); return true;
      }
      if (p.startsWith("/ops/")) {
        const name = p.slice(5);
        if (ASSETS[name] && (m === "GET" || m === "HEAD")) file(res, name, ASSETS[name]); else { res.writeHead(404, HDR); res.end(); }
        return true;
      }
      if (!p.startsWith("/api/ops/")) return false;
      const r = p.slice(9);

      // ----- uploaded files: a session, or the bridge key (the coordinator's "fetch") -----
      const um = /^uploads\/([^/]+)\/([^/]+)$/.exec(r);
      if (um && (m === "GET" || m === "HEAD")) {
        const a0 = /^Bearer\s+(\S+)$/i.exec(String(req.headers.authorization || ""));
        if (!(a0 && bridgeKeyOk(a0[1])) && !sessionOf(req)) { json(res, 401, { ok: false }); return true; }
        if (!UP_RE.test(um[1]) || !UP_FILE_RE.test(um[2])) { json(res, 404, { ok: false }); return true; }
        serveUpload(req, res, um[1], um[2]); return true;
      }
      // ----- bridge (machine) -----
      if (r.startsWith("bridge/")) {
        const a = /^Bearer\s+(\S+)$/i.exec(String(req.headers.authorization || ""));
        if (!a || !bridgeKeyOk(a[1])) { json(res, 404, { ok: false }); return true; }
        if (r === "bridge/outbox" && m === "GET") {
          const since = Date.parse(u.searchParams.get("since") || "") || 0;
          const items = readLines("outbox.jsonl").filter((x) => x.status === "new" && (Date.parse(x.createdAt) || 0) > since);
          json(res, 200, { ok: true, items, now: new Date().toISOString() }); return true;
        }
        if (r === "bridge/snapshot" && m === "POST") {
          const b = await body(req, 5 * 1048576);
          if (!b || typeof b.collections !== "object" || Array.isArray(b.collections)) { json(res, 422, { ok: false, error: "collections" }); return true; }
          const snap = { collections: b.collections, generatedAt: str(b.generatedAt, 40) || new Date().toISOString(), receivedAt: new Date().toISOString() };
          writeJson("snapshot.json", snap);
          json(res, 200, { ok: true, collections: Object.keys(b.collections).length, generatedAt: snap.generatedAt }); return true;
        }
        if (r === "bridge/ack" && m === "POST") {
          const b = await body(req, 256e3);
          // {ids, status?: "done"|"rejected", reply?, replies?: {id: text}, results?: {id: {status, reply}}}
          // without a status an item only becomes "acked" (picked up); done / rejected close it (task edits: tick / roll back)
          const ids = new Set(Array.isArray(b.ids) ? b.ids.map(String) : []), replies = b.replies && typeof b.replies === "object" ? b.replies : {};
          const results = b.results && typeof b.results === "object" ? b.results : {};
          for (const id of Object.keys(results)) ids.add(id);
          const FINAL = new Set(["done", "rejected"]), at = new Date().toISOString(); let n = 0;
          const list = readLines("outbox.jsonl").map((x) => {
            if (!ids.has(x.id)) return x;
            const r = results[x.id] || {}, st = FINAL.has(r.status) ? r.status : FINAL.has(b.status) ? b.status : null;
            const reply = str(r.reply || replies[x.id] || b.reply || "", 4000);
            if (st && x.status !== st) { n++; return { ...x, status: st, resolvedAt: at, ackedAt: x.ackedAt || at, ...(reply ? { reply } : {}) }; }
            if (!st && x.status === "new") { n++; return { ...x, status: "acked", ackedAt: at, ...(reply ? { reply } : {}) }; }
            return x;
          });
          const tmp = P("outbox.jsonl.tmp-" + process.pid); writeFileSync(tmp, list.map((x) => JSON.stringify(x) + "\n").join(""), { mode: 0o600 }); renameSync(tmp, P("outbox.jsonl"));
          json(res, 200, { ok: true, acked: n }); return true;
        }
        if (r === "bridge/proposal" && m === "POST") { // TASK-135: publish (or preview) an offer without a deploy
          const b = await body(req, PROPOSAL_BODY_MAX);
          const slug = String(b.slug || ""), files = b.files && typeof b.files === "object" && !Array.isArray(b.files) ? b.files : null;
          if (!PROPOSAL_SLUG_RE.test(slug)) { json(res, 422, { ok: false, error: "slug" }); return true; }
          const names = files ? Object.keys(files) : [];
          if (!names.length || names.length > PROPOSAL_FILES_MAX) { json(res, 422, { ok: false, error: "files" }); return true; }
          for (const n of names) {
            if (!PROPOSAL_FILE_RE.test(n) || typeof files[n] !== "string") { json(res, 422, { ok: false, error: "file-name", file: n.slice(0, 80) }); return true; }
            if (Buffer.byteLength(files[n]) > PROPOSAL_FILE_MAX || !/^\s*<!doctype html/i.test(files[n])) { json(res, 422, { ok: false, error: "file-content", file: n }); return true; }
          }
          const preview = b.preview === true, dir = join(dataDir, preview ? "offer-previews" : "proposals", slug);
          mkdirSync(dir, { recursive: true });
          for (const n of names) { const tmp = join(dir, "." + n + ".tmp-" + process.pid); writeFileSync(tmp, files[n], { mode: 0o644 }); renameSync(tmp, join(dir, n.toLowerCase())); }
          const base = preview ? "/ops/preview/" : "/proposals/";
          appendLine("proposals.jsonl", { at: new Date().toISOString(), slug, preview, files: names, bytes: names.reduce((a, n) => a + Buffer.byteLength(files[n]), 0) });
          json(res, 200, { ok: true, slug, preview, urls: Object.fromEntries(names.map((n) => [n.toLowerCase(), base + slug + "/" + n.toLowerCase()])) }); return true;
        }
        if (r === "bridge/proposal" && m === "DELETE") { // TASK-135: "Retrage oferta" (the repo's proposals/ is never touched from here)
          const b = await body(req, 4096), slug = String(b.slug || ""), preview = b.preview === true;
          if (!PROPOSAL_SLUG_RE.test(slug)) { json(res, 422, { ok: false, error: "slug" }); return true; }
          if (b.all === true) { // TASK-135 "Șterge": both folders, whichever exist (the repo's proposals/ is never touched)
            const removed = [];
            for (const sub of ["proposals", "offer-previews"]) { const root = join(dataDir, sub), d = join(root, slug), st0 = statOr(d); if (d.startsWith(root + "/") && st0 && st0.isDirectory()) { removed.push(...readdirSync(d).map((f) => sub + "/" + f)); rmSync(d, { recursive: true, force: true }); } }
            appendLine("proposals.jsonl", { at: new Date().toISOString(), slug, deleted: true, removed });
            json(res, 200, { ok: true, slug, all: true, removed: removed.length }); return true;
          }
          const root = join(dataDir, preview ? "offer-previews" : "proposals"), dir = join(root, slug), st = statOr(dir);
          if (!dir.startsWith(root + "/") || !st || !st.isDirectory()) { json(res, 404, { ok: false, error: "not-found" }); return true; }
          const files = readdirSync(dir);
          rmSync(dir, { recursive: true, force: true });
          appendLine("proposals.jsonl", { at: new Date().toISOString(), slug, preview, removed: files });
          json(res, 200, { ok: true, slug, preview, removed: files.length }); return true;
        }
        json(res, 404, { ok: false }); return true;
      }

      // ----- browser -----
      if (m === "POST" && !originOk(req)) { json(res, 403, { ok: false, error: "origin" }); return true; }

      if (r === "login" && m === "POST") {
        const ip = ipOf(req);
        if (ipLogin(ip)) { json(res, 429, { ok: false, error: "rate" }); return true; }
        const b = await body(req, 4096);
        const email = str(b.email, 160).toLowerCase();
        if (!EMAIL_RE.test(email)) { json(res, 422, { ok: false, error: "email" }); return true; }
        const user = byEmail.get(email);
        if (!user) logLogin("unknown-email", email, req);
        else if (emailLogin(email)) logLogin("email-rate", email, req);
        else {
          const code = String(randomInt(0, 1e6)).padStart(6, "0");
          codes.set(email, { hash: shaHex(email + ":" + code), exp: Date.now() + CODE_TTL, tries: 0 });
          logLogin("code-sent", email, req);
          mailCode(email, user.name, code);
        }
        json(res, 200, { ok: true }); return true; // the same answer either way
      }
      if (r === "verify" && m === "POST") {
        if (ipVerify(ipOf(req))) { json(res, 429, { ok: false, error: "rate" }); return true; }
        const b = await body(req, 4096);
        const email = str(b.email, 160).toLowerCase(), code = str(b.code, 12).replace(/\s+/g, "");
        const c = codes.get(email), user = byEmail.get(email);
        if (!c || !user || c.exp < Date.now()) { if (c) codes.delete(email); logLogin("verify-expired", email, req); json(res, 401, { ok: false, error: "expired" }); return true; }
        if (!/^\d{6}$/.test(code) || !eq(c.hash, shaHex(email + ":" + code))) {
          c.tries++;
          const left = CODE_TRIES - c.tries;
          if (left <= 0) { codes.delete(email); logLogin("verify-locked", email, req); json(res, 401, { ok: false, error: "locked" }); return true; }
          logLogin("verify-fail", email, req); json(res, 401, { ok: false, error: "code", left }); return true;
        }
        codes.delete(email);
        const sid = randomBytes(32).toString("base64url");
        sessions[shaHex(sid)] = { email, created: Date.now(), exp: Date.now() + SESSION_TTL, ip: ipOf(req) };
        saveSessions();
        logLogin("login", email, req, { role: user.role });
        json(res, 200, { ok: true }, { "Set-Cookie": setCookie(req, sid, SESSION_TTL / 1000) }); return true;
      }
      if (r === "logout" && m === "POST") {
        const s = sessionOf(req);
        if (s) { delete sessions[s.key]; saveSessions(); logLogin("logout", s.email, req); }
        json(res, 200, { ok: true }, { "Set-Cookie": setCookie(req, "", 0) }); return true;
      }

      const s = sessionOf(req);
      if (r === "me" && m === "GET") { if (!s) json(res, 401, { ok: false }); else json(res, 200, { ok: true, user: pub(s) }); return true; }
      if (!s) { json(res, 401, { ok: false }); return true; }
      if (r === "snapshot" && m === "GET") {
        const view = withOutbox(forRole(snapshot(), s.user.role));
        if (s.user.role === "admin") { const a = metrics.analyticsDoc(); if (a) view.collections = { ...view.collections, analytics: { ...(view.collections.analytics || {}), summary: a } }; } // TASK-141: GA4 from the server's cache, never a call to Google per view
        json(res, 200, { ok: true, user: pub(s), ...view }); return true;
      }
      if (r === "perf" || r === "perf/run") { // TASK-141: admins only, like core / sec / offer: a member gets nothing
        if (s.user.role !== "admin") { json(res, 403, { ok: false }); return true; }
        if (r === "perf" && m === "GET") { json(res, 200, { ok: true, ...metrics.perfView() }); return true; }
        if (r === "perf/run" && m === "POST") { const out = metrics.startManual(s.email); json(res, out.status, { ok: out.ok, ...(out.error ? { error: out.error } : {}), ...(out.nextAt ? { nextAt: out.nextAt } : {}) }); return true; }
        json(res, 405, { ok: false }); return true;
      }
      if (r === "upload" && m === "POST") { await upload(req, res, s, u); return true; }
      if (r === "inbox" && m === "POST") {
        if (userInbox(s.email)) { json(res, 429, { ok: false, error: "rate" }); return true; }
        const b = await body(req, 64e3);
        const kind = str(b.kind, 20), text = str(b.text, 4000);
        if (!KINDS.has(kind) || !text) { json(res, 422, { ok: false, error: "kind/text" }); return true; }
        let payload = b.payload && typeof b.payload === "object" && !Array.isArray(b.payload) ? b.payload : null;
        if (payload && JSON.stringify(payload).length > (OFFER_TYPES.has(String(payload.type || "")) ? 48e3 : 16e3)) { json(res, 413, { ok: false }); return true; }
        if (payload && ADMIN_PAYLOAD_TYPES.has(String(payload.type || "")) && s.user.role !== "admin") { json(res, 403, { ok: false }); return true; }
        if (payload && payload.videoLinks !== undefined) payload = { ...payload, videoLinks: (Array.isArray(payload.videoLinks) ? payload.videoLinks : []).slice(0, 10).map((v) => videoLink(v && v.url)).filter(Boolean) };
        if (payload && payload.uploads !== undefined) payload = { ...payload, uploads: (Array.isArray(payload.uploads) ? payload.uploads : []).slice(0, 20).filter((x) => x && UP_RE.test(String(x.id))).map((x) => ({ id: x.id, name: str(String(x.name || ""), 140), kind: UP_KINDS.has(x.kind) ? x.kind : "other", type: str(String(x.type || ""), 40), urls: Object.fromEntries(Object.entries(x.urls || {}).filter(([k, v]) => /^[a-z]+$/.test(k) && typeof v === "string" && v.startsWith("/api/ops/uploads/" + x.id + "/"))), w: Number(x.w) || null, h: Number(x.h) || null, bytesBefore: Number(x.bytesBefore) || null, bytesAfter: Number(x.bytesAfter) || null })) };
        if (payload && OFFER_TYPES.has(String(payload.type || ""))) { // TASK-135: the shape Claude expects (the rest is the config, data only)
          const o = payload.offer;
          if ((payload.type === "offer-new" && (!o || typeof o !== "object" || Array.isArray(o) || !str(o.client && o.client.name, 160)))
            || (payload.type !== "offer-new" && !/^[\w.-]{1,80}$/.test(String(payload.offerId || "")))) { json(res, 422, { ok: false, error: "offer" }); return true; }
        }
        if (payload && payload.type === "task-edit") {
          const f = String(payload.field || "");
          if (!TASK_FIELDS.has(f) || typeof payload.taskId !== "string" || !/^[\w.-]{1,60}$/.test(payload.taskId)) { json(res, 422, { ok: false, error: "task-edit" }); return true; }
          payload = { type: "task-edit", taskId: payload.taskId, field: f, from: str(String(payload.from ?? ""), 120), to: str(String(payload.to ?? ""), 120) };
        }
        const page = str(b.page, 500), device = str(b.device, 200);
        if (page || device) payload = { ...(payload || {}), ...(page ? { page } : {}), ...(device ? { device } : {}) };
        // Daniel's rule: a colleague's bug starts work right away; "Important / blochează lucrul" makes it P0
        const bugPri = kind === "bug" ? { important: !!(payload && payload.important), priority: payload && payload.important ? "P0" : "P1" } : {};
        const item = { id: "ops-" + Date.now().toString(36) + randomBytes(4).toString("hex"), kind, text, payload, ...bugPri, from: s.email, name: s.user.name, role: s.user.role, createdAt: new Date().toISOString(), status: "new" };
        appendLine("outbox.jsonl", item);
        json(res, 200, { ok: true, item }); return true;
      }
      json(res, 404, { ok: false }); return true;
    } catch (e) {
      if (!res.headersSent) json(res, e.status || 500, { ok: false });
      else res.destroy();
      if (!e.status) log.error("[ops]", e.message);
      return true;
    }
  };
}

/** the login code mail: the ops lockup (yellow pill + rainbow-ring OPS pill), the six digits in circles, Romanian, neutral.
 *  Email-safe: tables + inline styles, a solid fallback under the gradient ring, a plain-text part, dark-mode friendly. */
export function codeMail(name, code) {
  const pretty = code.slice(0, 3) + " " + code.slice(3), n = esc(name || "");
  const subject = `${pretty} e codul tău pentru cromaticstudios.com ops`;
  const text = `Salut${name ? ", " + name : ""}.\n\nCodul tău pentru cromaticstudios.com ops: ${pretty}\nValabil 10 minute, o singură dată.\n\nDacă nu l-ai cerut tu, ignoră mailul. Fără cod nu intră nimeni.\n\nCromatic Studios · Str. Olari 9, București`;
  const C = ["#FED012", "#28C840", "#119BFE", "#B098C8", "#F65342", "#FED012"];
  const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif";
  const digit = (d, i) => `<td align="center" valign="middle" style="padding:0 4px"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td class="dg" align="center" valign="middle" width="52" height="52" style="width:52px;height:52px;border-radius:26px;background:${C[i]};border:2px solid #0D0C09;font:800 30px/52px ${FONT};color:#0D0C09;text-align:center;mso-line-height-rule:exactly">${d}</td></tr></table></td>`;
  const html = `<!doctype html>
<html lang="ro"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light dark"><meta name="supported-color-schemes" content="light dark">
<title>${pretty} · cromaticstudios.com ops</title>
<style>
  :root { color-scheme: light dark; supported-color-schemes: light dark; }
  @media (prefers-color-scheme: dark) {
    .bg { background: #111113 !important; } .card { background: #1b1b1e !important; border-color: #2f2f34 !important; }
    .ink { color: #f2f2f3 !important; } .mut { color: #a3a6ad !important; } .ring-in { background: #1b1b1e !important; } .ops { color: #f2f2f3 !important; }
  }
  [data-ogsc] .bg { background: #111113 !important; } [data-ogsc] .card { background: #1b1b1e !important; } [data-ogsc] .ink, [data-ogsc] .ops { color: #f2f2f3 !important; } [data-ogsc] .ring-in { background: #1b1b1e !important; }
</style></head>
<body class="bg" style="margin:0;padding:0;background:#F2F2F2">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">Codul tău: ${pretty}. Valabil 10 minute.</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="bg" style="background:#F2F2F2"><tr><td align="center" style="padding:32px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="card" style="max-width:480px;background:#ffffff;border:1px solid #e3e3e3;border-radius:28px">
<tr><td align="center" style="padding:32px 24px 8px">
  <table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>
    <td valign="middle" style="padding-right:8px"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="background:#FED012;border:2px solid #0D0C09;border-radius:999px;padding:5px 12px 6px;font:700 14px/1 ${FONT};color:#0D0C09;letter-spacing:-.2px;white-space:nowrap">cromaticstudios.com</td></tr></table></td>
    <td valign="middle"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="background:#119BFE;background-image:linear-gradient(90deg,#FED012,#28C840,#119BFE,#B098C8,#F65342);border-radius:999px;padding:4px"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td class="ring-in ops" style="background:#ffffff;border-radius:999px;padding:4px 16px 7px;font:900 24px/1 ${FONT};color:#0D0C09;letter-spacing:-1px">OPS</td></tr></table></td></tr></table></td>
  </tr></table>
</td></tr>
<tr><td align="center" class="ink" style="padding:24px 28px 4px;font:800 24px/1.25 ${FONT};color:#0D0C09">Salut${n ? ", " + n : ""}.</td></tr>
<tr><td align="center" class="mut" style="padding:0 28px 20px;font:400 16px/1.5 ${FONT};color:#5e6168">Codul tău pentru <b class="ink" style="color:#0D0C09">cromaticstudios.com ops</b>:</td></tr>
<tr><td align="center" style="padding:0 16px"><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr>${[...code].map(digit).join("")}</tr></table></td></tr>
<tr><td align="center" class="mut" style="padding:20px 28px 0;font:600 15px/1.5 ${FONT};color:#5e6168">Valabil 10 minute, o singură dată.</td></tr>
<tr><td align="center" class="mut" style="padding:8px 28px 32px;font:400 14px/1.5 ${FONT};color:#5e6168">Dacă nu l-ai cerut tu, ignoră mailul. Fără cod nu intră nimeni.</td></tr>
</table>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:480px"><tr><td align="center" class="mut" style="padding:16px 12px 0;font:500 12px/1.5 ${FONT};color:#8a8d93">Cromatic Studios · Str. Olari 9, București</td></tr></table>
</td></tr></table>
</body></html>`;
  return { subject, text, html };
}
export const isOps = (url) => url === "/ops" || url.startsWith("/ops/") || url.startsWith("/ops?") || url.startsWith("/api/ops/");
function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
