// Cromatic Studios — Navigation Mode
// A small static server (precompressed brotli/gzip, long cache for hashed assets, range requests
// for video) plus one endpoint: POST /api/boarding, which emails the boarding pass to the studio
// and a copy to the passenger.
import http from "node:http";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join, extname, dirname, normalize } from "node:path";
import { fileURLToPath } from "node:url";
import zlib from "node:zlib";
import nodemailer from "nodemailer";
import { passHtml, passText } from "./mail-template.js";

const APP_DIR = dirname(fileURLToPath(import.meta.url));
const ROOT = join(APP_DIR, "public");
// Let's Encrypt (certbot --webroot) drops its challenge files under <webroot>/.well-known/acme-challenge/
const ACME_DIRS = [...new Set([process.env.ACME_ROOT, APP_DIR].filter(Boolean))].map((d) => join(d, ".well-known", "acme-challenge"));
const PORT = Number(process.env.PORT || 8080);
const MAIL_TO = process.env.MAIL_TO || "hi@cromaticstudios.com";
const MAIL_FROM = process.env.MAIL_FROM || "Cromatic Air <hi@cromaticstudios.com>";

const TYPES = {
  ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp",
  ".gif": "image/gif", ".svg": "image/svg+xml", ".mp4": "video/mp4", ".webm": "video/webm", ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml; charset=utf-8", ".ico": "image/x-icon"
};
const COMPRESS = new Set([".html", ".js", ".css", ".svg", ".json", ".txt", ".xml"]);

// everything is small enough to hold in memory, compressed once at start
const files = new Map();
(function load(dir) {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) { load(p); continue; }
    if (p.endsWith(".br") || p.endsWith(".gz")) continue;
    const ext = extname(p).toLowerCase(), buf = readFileSync(p);
    const url = "/" + p.slice(ROOT.length + 1).split("\\").join("/");
    const f = { buf, type: TYPES[ext] || "application/octet-stream", immutable: url.startsWith("/assets/") };
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

async function boarding(req, res) {
  let body = "";
  for await (const chunk of req) { body += chunk; if (body.length > 32e3) return send(res, 413, { ok: false }); }
  let b;
  try { b = JSON.parse(body); } catch { return send(res, 400, { ok: false }); }
  if (b.company_site) return send(res, 200, { ok: true }); // the honeypot caught a bot: pretend all is well
  const ip = String(req.headers["x-forwarded-for"] || req.socket.remoteAddress || "").split(",")[0].trim();
  if (limited(ip)) return send(res, 429, { ok: false });
  const t = clean(b);
  if (!t.name || !EMAIL_RE.test(t.email)) return send(res, 422, { ok: false });
  try {
    await transport.sendMail({
      from: MAIL_FROM, to: MAIL_TO, replyTo: `${t.name} <${t.email}>`,
      subject: `\u2708 Boarding pass ${t.ref} \u00B7 ${t.name}${t.biz ? " \u00B7 " + t.biz : ""}`,
      html: passHtml(t, "studio"), text: passText(t, "studio")
    });
    await transport.sendMail({
      from: MAIL_FROM, to: `${t.name} <${t.email}>`, replyTo: MAIL_TO,
      subject: `Your boarding pass to Olari 9 \u00B7 ${t.ref}`,
      html: passHtml(t, "passenger"), text: passText(t, "passenger")
    });
    return send(res, 200, { ok: true, ref: t.ref });
  } catch (e) {
    console.error("[mail]", e.message);
    return send(res, 502, { ok: false });
  }
}

function send(res, code, obj) {
  const s = JSON.stringify(obj);
  res.writeHead(code, { "Content-Type": "application/json", "Cache-Control": "no-store", "Content-Length": Buffer.byteLength(s) });
  res.end(s);
}

function serve(req, res) {
  let path = decodeURIComponent(new URL(req.url, "http://x").pathname);
  path = normalize(path).replace(/\\/g, "/");
  if (path.endsWith("/")) path += "index.html";
  const f = files.get(path) || (extname(path) ? null : files.get("/index.html"));
  if (!f) { res.writeHead(404, { "Content-Type": "text/plain" }); return res.end("Not found"); }
  const headers = {
    "Content-Type": f.type,
    "Cache-Control": f.immutable ? "public, max-age=31536000, immutable" : "public, max-age=0, must-revalidate",
    "X-Content-Type-Options": "nosniff",
    "Referrer-Policy": "strict-origin-when-cross-origin",
    "Vary": "Accept-Encoding"
  };
  const ae = String(req.headers["accept-encoding"] || "");
  let buf = f.buf;
  if (f.br && /\bbr\b/.test(ae)) { buf = f.br; headers["Content-Encoding"] = "br"; }
  else if (f.gz && /\bgzip\b/.test(ae)) { buf = f.gz; headers["Content-Encoding"] = "gzip"; }
  // video wants byte ranges (Safari will not play without them)
  const range = !headers["Content-Encoding"] && req.headers.range && /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
  if (range) {
    const total = buf.length, start = range[1] ? Number(range[1]) : total - Number(range[2]), end = range[1] && range[2] ? Math.min(Number(range[2]), total - 1) : total - 1;
    if (start >= total || start < 0 || start > end) { res.writeHead(416, { "Content-Range": `bytes */${total}` }); return res.end(); }
    res.writeHead(206, { ...headers, "Accept-Ranges": "bytes", "Content-Range": `bytes ${start}-${end}/${total}`, "Content-Length": end - start + 1 });
    return res.end(req.method === "HEAD" ? undefined : buf.subarray(start, end + 1));
  }
  headers["Accept-Ranges"] = "bytes";
  headers["Content-Length"] = buf.length;
  res.writeHead(200, headers);
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

http.createServer((req, res) => {
  if (req.url === "/healthz") return send(res, 200, { ok: true });
  if (req.url.startsWith("/.well-known/acme-challenge/")) return acme(req, res);
  if (req.url === "/api/boarding" && req.method === "POST") return void boarding(req, res).catch(() => send(res, 500, { ok: false }));
  if (req.method !== "GET" && req.method !== "HEAD") { res.writeHead(405); return res.end(); }
  serve(req, res);
}).listen(PORT, () => console.log(`Cromatic Navigation Mode on :${PORT} (${files.size} files)`));
