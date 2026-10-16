// Cromatic Studios — Navigation Mode
// A small static server (precompressed brotli/gzip, long cache for hashed assets, range requests
// for video) plus one endpoint: POST /api/boarding, which emails the boarding pass to the studio
// and a copy to the passenger.
import http from "node:http";
import https from "node:https";
import { readFileSync, readdirSync, statSync, appendFileSync, mkdirSync, createReadStream } from "node:fs";
import { join, extname, dirname, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";
import { createHash } from "node:crypto";
import nodemailer from "nodemailer";
import { passHtml, passText } from "./mail-template.js";

const APP_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = process.env.PUBLIC_DIR || join(APP_DIR, "public");
// Let's Encrypt (certbot --webroot) drops its challenge files under <webroot>/.well-known/acme-challenge/
const ACME_DIRS = [...new Set([process.env.ACME_ROOT, APP_DIR].filter(Boolean))].map((d) => join(d, ".well-known", "acme-challenge"));
const PORT = Number(process.env.PORT || 8080);
const MAIL_TO = process.env.MAIL_TO || "hi@cromaticstudios.com";
const MAIL_FROM = process.env.MAIL_FROM || "Cromatic Air <hi@cromaticstudios.com>";

const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
  ".gif": "image/gif", ".svg": "image/svg+xml", ".mp4": "video/mp4", ".webm": "video/webm", ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8", ".ico": "image/x-icon", ".webmanifest": "application/manifest+json", ".woff2": "font/woff2"
};
const COMPRESS = new Set([".html", ".js", ".css", ".svg", ".json", ".txt", ".xml", ".webmanifest", ".ico"]);

// everything is small enough to hold in memory, compressed once at start
const files = new Map();
(function load(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { load(p); continue; }
    if (p.endsWith(".br") || p.endsWith(".gz")) continue;
    const ext = extname(p).toLowerCase(), url = "/" + p.slice(ROOT.length + 1).split("\\").join("/");
    // r134h: big files (the old site's case-study PDF, long films) stay on disk and stream; the rest lives in memory
    const st = statSync(p);
    if (st.size > 8e6 && !COMPRESS.has(ext)) { files.set(url, { disk: p, size: st.size, type: TYPES[ext] || "application/octet-stream", immutable: url.startsWith("/assets/"), etag: `"${st.size.toString(36)}-${Math.round(st.mtimeMs).toString(36)}"` }); continue; }
    const buf = readFileSync(p);
    const f = { buf, type: TYPES[ext] || "application/octet-stream", immutable: url.startsWith("/assets/"), etag: `"${createHash("sha1").update(buf).digest("base64url").slice(0, 16)}"` };
    if (COMPRESS.has(ext)) {
      // precompressed by the build; fall back to compressing here if a variant is missing
      try { f.br = readFileSync(p + ".br"); } catch { f.br = zlib.brotliCompressSync(buf); }
      try { f.gz = readFileSync(p + ".gz"); } catch { f.gz = zlib.gzipSync(buf); }
    }
    files.set(url, f);
  }
})(ROOT);

const transport = process.env.SMTP_HOST
  ? nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      name: process.env.SMTP_HELO || "cromaticstudios.com", // Google's relay checks the HELO domain
      port: Number(process.env.SMTP_PORT || 587),
      secure: Number(process.env.SMTP_PORT) === 465,
      auth: process.env.SMTP_USER ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS } : undefined
    })
  : nodemailer.createTransport({ jsonTransport: true });
if (!process.env.SMTP_HOST) console.warn("[mail] SMTP_HOST is not set: emails are logged, not sent.");

// a gentle rate limit: 5 passes per address per 15 minutes
const hits = new Map();
const limited = (ip) => {
  const now = Date.now(), list = (hits.get(ip) || []).filter((t) => now - t < 15 * 60e3);
  list.push(now);
  hits.set(ip, list);
  return list.length > 5;
};

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const str = (v, max) => (typeof v === "string" ? v.trim().slice(0, max) : "");
function clean(b) {
  return {
    ref: str(b.ref, 12).replace(/[^A-Z0-9]/gi, "") || "CS00000",
    name: str(b.name, 120), first: str(b.first, 60), email: str(b.email, 160), phone: str(b.phone, 40), msg: str(b.msg, 2000),
    date: str(b.date, 20), time: str(b.time, 8), flight: str(b.flight, 12), klass: str(b.klass, 30), boarding: str(b.boarding, 40),
    biz: str(b.biz, 40), when: str(b.when, 40), seat: "1A", gate: "9", terminal: "Coffee",
    dreams: Array.isArray(b.dreams) ? b.dreams.slice(0, 6).map((d) => str(d, 40)).filter(Boolean) : [],
    stops: Array.isArray(b.stops) ? b.stops.slice(0, 6).map((s) => [str(s?.[0], 4), str(s?.[1], 30)]) : []
  };
}

// r134h: every message is also kept on the server (one JSON line per message), outside the release folder so a deploy
// never wipes it: LEADS_DIR, else the app's shared folder, else the pm2 home. Email stays the main channel.
const LEADS_DIRS = [process.env.LEADS_DIR, join(APP_DIR, "..", "..", "shared"), process.env.HOME, APP_DIR].filter(Boolean);
function keepLead(t, ip) {
  const line = JSON.stringify({ at: new Date().toISOString(), ip, ...t }) + "\n";
  for (const d of LEADS_DIRS) {
    try { mkdirSync(d, { recursive: true }); appendFileSync(join(d, "cromatic-leads.jsonl"), line, { mode: 0o600 }); return join(d, "cromatic-leads.jsonl"); } catch {}
  }
  console.error("[lead] could not be saved anywhere:", line.trim());
  return null;
}
const INTERNAL_IPS = (process.env.INTERNAL_IPS || "188.26.55.18").split(",").map((x) => x.trim()).filter(Boolean);
let lastMail = null; // the last send, for /healthz (no addresses, no secrets)

// r149b: OpenAI Ads Conversions API (server side). A sent boarding pass is also reported as "lead_created", with the
// same id as the browser pixel ("lead_" + ref, so OpenAI counts it once), and only when the visitor said yes on the
// cookie card (cookie cz-consent=yes2): only that a lead happened, nothing of what was written. The key lives in the
// server's environment (Bunnyshell secret OAI_CONVERSIONS_KEY), never in the repo. At start a validate_only event
// (counted nowhere) checks the key; /healthz shows the result as oai: "ok" / "off" / "error <status>".
const OAI_KEY = String(process.env.OAI_CONVERSIONS_KEY || "").trim().replace(/^Bearer\s+/i, ""); // a pasted space, newline or "Bearer " does not break it
const OAI_PIXEL = process.env.OAI_PIXEL_ID || "8Kok98JE9jNE1Va2uAQwDG";
let oaiState = OAI_KEY ? "checking" : "off";
function oaiPost(events, validateOnly) {
  return new Promise((resolve) => {
    const body = JSON.stringify({ validate_only: !!validateOnly, events });
    const r = https.request({ host: "bzr.openai.com", path: `/v1/events?pid=${encodeURIComponent(OAI_PIXEL)}`, method: "POST", timeout: 8000,
      headers: { Authorization: `Bearer ${OAI_KEY}`, "Content-Type": "application/json", "Content-Length": Buffer.byteLength(body) } }, (x) => {
      let t = ""; x.on("data", (c) => { if (t.length < 2000) t += c; }); x.on("end", () => resolve({ status: x.statusCode, text: t }));
    });
    r.on("timeout", () => r.destroy(new Error("timeout")));
    r.on("error", (e) => resolve({ status: 0, text: e.message }));
    r.end(body);
  });
}
const oaiEvent = (id, url) => ({ id, type: "lead_created", timestamp_ms: Date.now(), source_url: url, action_source: "web", data: { type: "customer_action" } });
if (OAI_KEY) oaiPost([oaiEvent("check_" + Date.now(), "https://cromaticstudios.com/")], true).then((x) => {
  oaiState = x.status >= 200 && x.status < 300 ? "ok" : `error ${x.status}`;
  if (oaiState !== "ok") console.error("[oai] check", x.status, String(x.text).slice(0, 200));
});
function oaiLead(req, ref) {
  if (!OAI_KEY || !ref) return;
  if (!/(?:^|;\s*)cz-consent=yes2(?:;|$)/.test(String(req.headers.cookie || ""))) return;
  let url = "https://cromaticstudios.com/";
  try { const u = new URL(String(req.headers.referer || "")); if (/cromaticstudios\.com$/.test(u.hostname)) url = u.origin + u.pathname; } catch {}
  oaiPost([oaiEvent("lead_" + ref, url)], false).then((x) => { if (x.status < 200 || x.status >= 300) { oaiState = `error ${x.status}`; console.error("[oai] lead", x.status, String(x.text).slice(0, 200)); } });
}
const SUBJECT_TAG = process.env.MAIL_SUBJECT_TAG || "[mesaj de pe site!!]";

async function boarding(req, res, tag = SUBJECT_TAG) {
  let body = "";
  for await (const chunk of req) { body += chunk; if (body.length > 32e3) return send(res, 413, { ok: false }); }
  let b;
  try { b = JSON.parse(body); } catch { return send(res, 400, { ok: false }); }
  if (b.company_site) return send(res, 200, { ok: true }); // the honeypot caught a bot: pretend all is well
  const ip = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();
  if (limited(ip)) return send(res, 429, { ok: false });
  const t = clean(b);
  if (!t.name || !EMAIL_RE.test(t.email)) return send(res, 422, { ok: false });
  const kept = keepLead(t, ip);
  try {
    await transport.sendMail({
      from: MAIL_FROM, to: MAIL_TO, replyTo: `${t.name} <${t.email}>`,
      subject: `${tag} \u2708 Boarding pass ${t.ref} \u00B7 ${t.name}${t.biz ? " \u00B7 " + t.biz : ""}`,
      html: passHtml(t, "studio"), text: passText(t, "studio")
    });
    await transport.sendMail({
      from: MAIL_FROM, to: `${t.name} <${t.email}>`, replyTo: MAIL_TO,
      subject: `Your boarding pass to Olari 9 \u00B7 ${t.ref}`,
      html: passHtml(t, "passenger"), text: passText(t, "passenger")
    });
    lastMail = { at: new Date().toISOString(), error: null };
    oaiLead(req, t.ref); // r149b
    return send(res, 200, { ok: true, ref: t.ref });
  } catch (e) {
    console.error("[mail]", e.message);
    lastMail = { at: new Date().toISOString(), error: String(e.response || e.message || e).replace(/[\w.+-]+@[\w.-]+/g, "<email>").slice(0, 300), code: e.responseCode || e.code || null };
    // the message is safe on the server: the visitor gets their confirmation, the studio reads it from the file
    if (kept) oaiLead(req, t.ref); // r149b
    return kept ? send(res, 200, { ok: true, ref: t.ref, mail: false }) : send(res, 502, { ok: false });
  }
}

function send(res, code, obj) {
  const s = JSON.stringify(obj);
  res.writeHead(code, { "Content-Type": "application/json", "Cache-Control": "no-store", "Content-Length": Buffer.byteLength(s) });
  res.end(s);
}

const OLD_WP = process.env.OLD_WP_UPLOADS || "/var/www/cromatics_26/app/wp-content/uploads";
const OLD_OK = /\.(html?|png|jpe?g|gif|webp|svg|css|js|pdf|mp4|webm|woff2?|ico)$/i;
function oldWp(req, res, path) {
  const rel = path.slice("/wp-content/uploads/".length), ext = extname(path).toLowerCase();
  if (!OLD_OK.test(path) || rel.includes("..")) return false;
  const full = join(OLD_WP, rel);
  if (!full.startsWith(OLD_WP + "/")) return false;
  let st; try { st = statSync(full); } catch { return false; }
  if (!st.isFile()) return false;
  const headers = { "Content-Type": TYPES[ext] || (ext === ".htm" ? TYPES[".html"] : ext === ".pdf" ? "application/pdf" : ext === ".woff" ? "font/woff" : "application/octet-stream"), "Content-Length": st.size, "Cache-Control": "public, max-age=3600", "X-Content-Type-Options": "nosniff" };
  if (/\.html?$/.test(ext)) headers["X-Robots-Tag"] = "noindex, nofollow";
  res.writeHead(200, headers);
  if (req.method === "HEAD") { res.end(); return true; }
  createReadStream(full).on("error", () => res.destroy()).pipe(res);
  return true;
}

function serve(req, res) {
  let path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  path = normalize(path).replace(/\\/g, "/");
  // r131: /index.html and /site/index.html are the same pages as / and /site/: one address each
  if (/\/index\.html$/.test(path)) {
    res.writeHead(301, { Location: path.slice(0, -10) + (req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "") });
    return res.end();
  }
  if (path.endsWith("/")) path += "index.html";
  // one page: "/" is the site, anything else unknown is a real 404 (no soft 404s for search engines)
  if (!path.endsWith("/") && !extname(path) && files.has(path + "/index.html")) {
    res.writeHead(301, { Location: path + "/" + (req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "") });
    return res.end();
  }
  let f = files.get(path), status = 200;
  // r135f: files from the old WordPress media library (offers, brand hubs as .html, and what they use) are read on
  // request from the WordPress folder still on this server; never loaded at start, never crashing the site
  if (!f && path.startsWith("/wp-content/uploads/")) { try { if (oldWp(req, res, path)) return; } catch (e) { console.error("[old-wp]", e.message); } }
  if (!f) { f = files.get("/404.html"); status = 404; }
  if (!f) { res.writeHead(404, { "Content-Type": "text/plain" }); return res.end("Not found"); }
  const headers = {
    "Content-Type": f.type,
    "Cache-Control": f.immutable ? "public, max-age=31536000, immutable" : "public, max-age=0, must-revalidate",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Strict-Transport-Security": "max-age=31536000",
    "X-Frame-Options": "SAMEORIGIN",
    "Permissions-Policy": "camera=(), microphone=(), payment=(), usb=()",
    "Vary": "Accept-Encoding",
    "ETag": f.etag
  };
  // r140: private client reports: never indexed, never cached by Cloudflare, no referrer leaving the page
  if (path.startsWith("/rapoarte/")) { headers["X-Robots-Tag"] = "noindex, nofollow, noarchive"; headers["Cache-Control"] = "private, no-store"; headers["Referrer-Policy"] = "no-referrer"; }
  if (status === 404) headers["Cache-Control"] = "no-store";
  else if (req.headers["if-none-match"] === f.etag) { res.writeHead(304, headers); return res.end(); }
  if (f.disk) {
    const total = f.size, rg = status === 200 && req.headers.range && /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
    let start = 0, end = total - 1, code = status;
    if (rg) {
      start = rg[1] ? Number(rg[1]) : total - Number(rg[2]); end = rg[1] && rg[2] ? Math.min(Number(rg[2]), total - 1) : total - 1;
      if (start >= total || start < 0 || start > end) { res.writeHead(416, { "Content-Range": `bytes */${total}` }); return res.end(); }
      code = 206; headers["Content-Range"] = `bytes ${start}-${end}/${total}`;
    }
    headers["Accept-Ranges"] = "bytes"; headers["Content-Length"] = end - start + 1;
    res.writeHead(code, headers);
    if (req.method === "HEAD") return res.end();
    return void createReadStream(f.disk, { start, end }).on("error", () => res.destroy()).pipe(res);
  }
  const ae = String(req.headers["accept-encoding"] || "");
  let buf = f.buf;
  if (f.br && /\bbr\b/.test(ae)) { buf = f.br; headers["Content-Encoding"] = "br"; }
  else if (f.gz && /\bgzip\b/.test(ae)) { buf = f.gz; headers["Content-Encoding"] = "gzip"; }
  // video wants byte ranges (Safari will not play without them)
  const range = status === 200 && !headers["Content-Encoding"] && req.headers.range && /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
  if (range) {
    const total = buf.length, start = range[1] ? Number(range[1]) : total - Number(range[2]), end = range[1] && range[2] ? Math.min(Number(range[2]), total - 1) : total - 1;
    if (start >= total || start < 0 || start > end) { res.writeHead(416, { "Content-Range": `bytes */${total}` }); return res.end(); }
    res.writeHead(206, { ...headers, "Accept-Ranges": "bytes", "Content-Range": `bytes ${start}-${end}/${total}`, "Content-Length": end - start + 1 });
    return res.end(req.method === "HEAD" ? undefined : buf.subarray(start, end + 1));
  }
  headers["Accept-Ranges"] = "bytes";
  headers["Content-Length"] = buf.length;
  res.writeHead(status, headers);
  res.end(req.method === "HEAD" ? undefined : buf);
}

function acme(req, res) {
  const token = req.url.slice("/.well-known/acme-challenge/".length).split("?")[0];
  if (/^[A-Za-z0-9_-]+$/.test(token)) {
    for (const dir of ACME_DIRS) {
      try {
        const body = readFileSync(join(dir, token));
        res.writeHead(200, { "Content-Type": "text/plain", "Cache-Control": "no-store" });
        return res.end(body);
      } catch {}
    }
  }
  res.writeHead(404, { "Content-Type": "text/plain" });
  res.end("Not found");
}

// r169 (Daniel): beta 2.0 (branch nav2) on its own address, apart from the live site: built by the deploy into
// public-beta beside the release, read from disk per request (nothing of it held in memory, so the live site's
// memory stays as it is), never indexed, no analytics (built without GA), its boarding passes marked [beta 2.0]
const BETA_HOST = process.env.BETA_HOST ?? "beta.cromaticstudios.com";
// r169c: and, until beta. points here, on the app's own Bunnyshell address (http only: it has no certificate)
const BETA_HOSTS = new Set([BETA_HOST, process.env.BETA_HOST2 ?? "cromaticdrive6abd2eab8b05b.cloud.bunnyroute.com"].filter(Boolean));
const BETA_ROOT = process.env.BETA_DIR || join(APP_DIR, "public-beta");
const statOr = (p) => { try { return statSync(p); } catch { return null; } };
function serveBeta(req, res) {
  const u = new URL(req.url, "http://x");
  let path;
  try { path = normalize(decodeURIComponent(u.pathname)).replace(/\\/g, "/"); } catch { res.writeHead(400); return res.end(); }
  if (path === "/robots.txt") { res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-cache" }); return res.end("User-agent: *\nDisallow: /\n"); }
  if (/\/index\.html$/.test(path)) { res.writeHead(301, { Location: path.slice(0, -10) + u.search }); return res.end(); }
  if (path.endsWith("/")) path += "index.html";
  let full = join(BETA_ROOT, path), st = full.startsWith(BETA_ROOT + "/") ? statOr(full) : null, status = 200;
  if (st?.isDirectory() || (!st && !extname(path) && statOr(full + "/index.html"))) { res.writeHead(301, { Location: path + "/" + u.search }); return res.end(); }
  if (!st) { full = join(BETA_ROOT, "404.html"); st = statOr(full); status = 404; }
  if (!st) { res.writeHead(503, { "Content-Type": "text/plain; charset=utf-8", "Retry-After": "120" }); return res.end("beta 2.0 is not built yet"); }
  const ext = extname(full).toLowerCase(), immutable = status === 200 && path.startsWith("/assets/");
  const headers = { "Content-Type": TYPES[ext] || "application/octet-stream", "Cache-Control": immutable ? "public, max-age=31536000, immutable" : "no-cache", "X-Robots-Tag": "noindex, nofollow", "X-Content-Type-Options": "nosniff", "X-Frame-Options": "SAMEORIGIN", "Vary": "Accept-Encoding" };
  let file = full, size = st.size;
  if (COMPRESS.has(ext)) {
    const ae = String(req.headers["accept-encoding"] || "");
    for (const [k, e] of [["br", ".br"], ["gzip", ".gz"]]) { const z = ae.includes(k) && statOr(full + e); if (z) { file = full + e; size = z.size; headers["Content-Encoding"] = k; break; } }
  }
  let start = 0, end = size - 1, code = status;
  const rg = status === 200 && !headers["Content-Encoding"] && req.headers.range && /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
  if (rg) {
    start = rg[1] ? Number(rg[1]) : size - Number(rg[2]); end = rg[1] && rg[2] ? Math.min(Number(rg[2]), size - 1) : size - 1;
    if (start >= size || start < 0 || start > end) { res.writeHead(416, { "Content-Range": `bytes */${size}` }); return res.end(); }
    code = 206; headers["Content-Range"] = `bytes ${start}-${end}/${size}`;
  }
  if (!headers["Content-Encoding"]) headers["Accept-Ranges"] = "bytes";
  headers["Content-Length"] = end - start + 1;
  res.writeHead(code, headers);
  if (req.method === "HEAD") return res.end();
  createReadStream(file, { start, end }).on("error", () => res.destroy()).pipe(res);
}

// r133: moving to cromaticstudios.com. Set PRIMARY_HOST=cromaticstudios.com (and SITE_URL) on the day the domain
// points here: every other host of ours (drive., www.) answers with a permanent redirect to it. The old WordPress
// addresses keep working: each project page goes to its case study, contact and services to their sections, and
// test pages, author archives and the feed are gone for good (410).
const PRIMARY_HOST = process.env.PRIMARY_HOST ?? "cromaticstudios.com";
const OLD = {
  "/proiecte/": "/ro/#work", "/servicii/": "/ro/#services", "/contact/": "/ro/#contact", "/avi-garden/": "/ro/#work", "/proiecte/7-oale/": "/ro/#work",
  "/proiecte/help4brain/": "/ro/proiecte/help-4-brain/", "/proiecte/sip/": "/ro/proiecte/sip-coffee-wine/",
  // r138a (Daniel): the old Slow Coffee page (written in English) and its short address go to the rebuilt English page
  "/proiecte/slow-coffee-festival-history/": "/work/slow-coffee-festival/", "/scf/": "/work/slow-coffee-festival/",
  "/proiecte/slow/": "/ro/proiecte/slow-coffee-festival/",
  "/proiecte/yoshy-izakaya/": "/ro/proiecte/yoshi-izakaya/", "/proiecte/arca/": "/ro/proiecte/arca-resort/",
  // r139c (N46): the Witanalytica page's address now spells the brand
  "/work/witanalitica/": "/work/witanalytica/", "/ro/proiecte/witanalitica/": "/ro/proiecte/witanalytica/"
};
const GONE = /^\/(?:testestes|online-core-beta|author\/[^/]+|feed|comments\/feed|wp-sitemap[^/]*\.xml|sitemap_index\.xml|xmlrpc\.php)\/?$/;
// the new address of an old WordPress page (or null)
function oldTarget(pathname) {
  let p = pathname;
  if (!p.endsWith("/") && !/\.[a-z0-9]+$/i.test(p)) p += "/";
  let to = OLD[p];
  if (!to) { const m = /^\/proiecte\/([\w-]+)\/$/.exec(p); if (m && files.has(`/ro/proiecte/${m[1]}/index.html`)) to = `/ro/proiecte/${m[1]}/`; }
  return to || null;
}
// r136 (N39): where a request ends up after every rule (old WordPress address, /index.html, the trailing slash), so a
// redirect from another host or from http goes there in ONE 301 instead of two or three
function finalUrl(url) {
  const u = new URL(url, "http://x");
  let p = u.pathname;
  try { p = normalize(decodeURIComponent(p)).replace(/\\/g, "/"); } catch { return url; }
  const old = oldTarget(p);
  if (old) return old + (old.includes("#") ? "" : u.search); // r139c: the query goes along (?embed=1 from the map)
  if (/\/index\.html$/.test(p)) p = p.slice(0, -10);
  else if (!p.endsWith("/") && !extname(p) && files.has(p + "/index.html")) p += "/";
  return encodeURI(p) + u.search;
}
function legacy(req, res) {
  const p0 = new URL(req.url, "http://x").pathname;
  const p = !p0.endsWith("/") && !/\.[a-z0-9]+$/i.test(p0) ? p0 + "/" : p0;
  const to = oldTarget(p0);
  if (to) { res.writeHead(301, { Location: to + (to.includes("#") ? "" : new URL(req.url, "http://x").search), "Cache-Control": "public, max-age=86400" }); res.end(); return true; }
  if (GONE.test(p)) { res.writeHead(410, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=86400" }); res.end("Gone"); return true; }
  return false;
}

// r136 (N45): how to report a security problem (RFC 9116); valid for a year from the server's start
const SECURITY_TXT = `Contact: mailto:hi@cromaticstudios.com
Expires: ${new Date(Date.now() + 365 * 864e5).toISOString().replace(/\.\d{3}Z$/, ".000Z")}
Preferred-Languages: en, ro
Canonical: https://${PRIMARY_HOST || "cromaticstudios.com"}/.well-known/security.txt
`;

http.createServer((req, res) => {
  // r136 (N45): the public health check says only that the site is up; the mail details need the leads key
  if (req.url === "/healthz" || req.url.startsWith("/healthz?")) {
    const key = new URL(req.url, "http://x").searchParams.get("key") || "";
    const full = !!process.env.LEADS_KEY && key.length >= 16 && key === process.env.LEADS_KEY;
    return send(res, 200, full ? { ok: true, mail: process.env.SMTP_HOST ? "smtp" : "log", leads: true, host: process.env.SMTP_HOST || null, port: process.env.SMTP_PORT || null, lastMail, oai: oaiState } : { ok: true, oai: oaiState });
  }
  if (req.url.startsWith("/.well-known/acme-challenge/")) return acme(req, res);
  if (req.url === "/.well-known/security.txt" || req.url === "/security.txt") {
    res.writeHead(200, { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=86400", "X-Content-Type-Options": "nosniff" });
    return res.end(req.method === "HEAD" ? undefined : SECURITY_TXT);
  }
  const host = String(req.headers.host || "").toLowerCase().split(":")[0];
  // r169: beta 2.0 answers on its own host only, before any rule of the live site
  if (BETA_HOSTS.has(host)) {
    if (/"scheme":"http"/.test(String(req.headers["cf-visitor"] || ""))) { res.writeHead(301, { Location: `https://${host}${req.url}` }); return res.end(); }
    if (req.url === "/api/boarding" && req.method === "POST") return void boarding(req, res, "[beta 2.0]").catch(() => send(res, 500, { ok: false }));
    if (req.url === "/api/ctx") return send(res, 200, { internal: false });
    if (req.method !== "GET" && req.method !== "HEAD") { res.writeHead(405); return res.end(); }
    // r188: with no separate beta built (beta 3.0 is the live site now), beta. shows the live site, never indexed
    if (!statOr(join(BETA_ROOT, "index.html"))) { const wh = res.writeHead.bind(res); res.writeHead = (c, h) => wh(c, { ...(h || {}), "X-Robots-Tag": "noindex, nofollow" }); return serve(req, res); }
    return serveBeta(req, res);
  }
  const otherHost = PRIMARY_HOST && host !== PRIMARY_HOST && /(^|\.)cromaticstudios\.com$/.test(host);
  // behind Cloudflare: visitors who came in over plain http get sent to https; another host of ours (drive., www.)
  // to the main one. r136 (N39): both straight to the final address (old WordPress page, slash), in one 301
  if ((/"scheme":"http"/.test(String(req.headers["cf-visitor"] || "")) && req.headers.host) || otherHost) {
    const to = (req.method === "GET" || req.method === "HEAD") ? finalUrl(req.url) : req.url;
    res.writeHead(301, { Location: `https://${otherHost ? PRIMARY_HOST : req.headers.host}${to}` });
    return res.end();
  }
  if ((req.method === "GET" || req.method === "HEAD") && legacy(req, res)) return;
  // the saved messages, for the studio only: GET /api/leads?key=<LEADS_KEY> (off unless LEADS_KEY is set)
  // r135h: is this visit from the studio itself (Olari 9)? GA4 then tags it traffic_type=internal and filters it out
  if (req.url === "/api/ctx") {
    const ip = String(req.headers["cf-connecting-ip"] || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();
    return send(res, 200, { internal: INTERNAL_IPS.includes(ip) });
  }
  if (req.url.startsWith("/api/leads") && process.env.LEADS_KEY) {
    const key = new URL(req.url, "http://x").searchParams.get("key") || "";
    if (key.length < 16 || key !== process.env.LEADS_KEY) { res.writeHead(404); return res.end(); }
    let out = "";
    for (const d of LEADS_DIRS) { try { out = readFileSync(join(d, "cromatic-leads.jsonl"), "utf8"); break; } catch {} }
    res.writeHead(200, { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", "X-Robots-Tag": "noindex" });
    return res.end(out);
  }
  if (req.url === "/api/boarding" && req.method === "POST") return void boarding(req, res).catch(() => send(res, 500, { ok: false }));
  if (req.method !== "GET" && req.method !== "HEAD") { res.writeHead(405); return res.end(); }
  serve(req, res);
}).listen(PORT, () => console.log(`Cromatic Navigation Mode on :${PORT} (${files.size} files)`));
