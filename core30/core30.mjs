// The Core 3.0 · server side. Mounts into cromaticstudios.com's server.js (plain node:http, no framework).
//
//   GET  /thecore30/<client>?t=<token>      the tool (dist/, built with base /thecore30/)
//   POST /api/core30/draft                   every change, debounced by the browser (+ a beacon on page close)
//   POST /api/core30/submit                  "Trimite la Cromatic": final copy + emails
//   GET  /api/core30/<client>/config?t=…     that respondent's questionnaire, only with the right token
//   GET  /api/core30/<client>/latest?key=…   the workshop loads the newest copy (CORE30_ADMIN_KEY)
//
// Nothing is ever lost on the way: latest.json is the newest state, history/ keeps one snapshot per hour
// (the last write of that hour), submits are append-only and never overwritten. Emails go to the studio
// on the first draft (someone started) and on every submit, with the full JSON attached.

import { mkdir, readFile, rename, writeFile, readdir } from "node:fs/promises";
import { existsSync, createReadStream, statSync } from "node:fs";
import { join, extname, normalize } from "node:path";

const MAX = 4 * 1024 * 1024; // reference images are downscaled in the browser; 6 of them fit easily
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".json": "application/json", ".ico": "image/x-icon" };

const readBody = (req) => new Promise((ok, bad) => {
  let n = 0; const chunks = [];
  req.on("data", (c) => { n += c.length; if (n > MAX) { bad(Object.assign(new Error("too large"), { code: 413 })); req.destroy(); } else chunks.push(c); });
  req.on("end", () => ok(Buffer.concat(chunks).toString("utf8")));
  req.on("error", bad);
});
const send = (res, code, obj) => { res.writeHead(code, { "Content-Type": "application/json", "Cache-Control": "no-store" }); res.end(JSON.stringify(obj)); };
const safe = (s) => String(s || "").replace(/[^a-z0-9_-]/gi, "").slice(0, 64);
const stamp = () => new Date().toISOString().replace(/[:.]/g, "-");

async function atomicWrite(file, data) {
  const tmp = `${file}.${process.pid}.tmp`;
  await writeFile(tmp, data);
  await rename(tmp, file);
}

/**
 * @param {object} o
 * @param {string} o.dataDir     where answers are stored (outside the deploy folder, survives deploys)
 * @param {string} o.distDir     the tool's build (npm run build → dist/)
 * @param {string} o.configDir   one JSON per respondent (npm run configs → server/configs); its access.token guards the link
 * @param {string} [o.registry]  optional clients.json to add or override per respondent: { "<id>": { "email": "…", "token": "…" } }
 * @param {object} [o.transport] a nodemailer transport; without it, emails are logged
 * @param {string} o.mailTo      the studio inbox
 * @param {string} o.mailFrom
 * @param {string} [o.adminKey]  unlocks GET …/latest for the workshop
 */
export function createCore30({ dataDir, distDir, configDir, registry, transport, mailTo, mailFrom, adminKey }) {
  // who may write where: every config on disk, plus the optional registry's overrides
  const clients = async () => {
    const out = {};
    const files = existsSync(configDir) ? (await readdir(configDir)).filter((f) => f.endsWith(".json")) : [];
    for (const f of files) {
      try {
        const c = JSON.parse(await readFile(join(configDir, f), "utf8"));
        out[c.id] = { token: c.access?.token ?? "", name: c.client?.name, contact: c.client?.contact, email: c.client?.email ?? "", file: join(configDir, f) };
      } catch (e) { console.error("[core30] bad config", f, e.message); }
    }
    if (registry) { try { const r = JSON.parse(await readFile(registry, "utf8")); for (const [id, x] of Object.entries(r)) out[id] = { ...(out[id] ?? {}), ...x }; } catch { /* no registry */ } }
    return out;
  };

  async function mail(subject, html, attachments) {
    if (!transport) { console.log(`[core30] mail (not sent, no SMTP): ${subject}`); return; }
    try { await transport.sendMail({ from: mailFrom, to: mailTo, subject, html, attachments }); }
    catch (e) { console.error("[core30] mail failed", e.message); } // the files are already on disk
  }

  async function store(kind, body) {
    let p;
    try { p = JSON.parse(body); } catch { return [400, { ok: false, error: "json" }]; }
    const reg = await clients();
    const id = safe(p.clientId);
    const c = reg[id];
    if (!c) return [404, { ok: false, error: "client" }];
    if (c.token && p.token !== c.token) return [403, { ok: false, error: "token" }];
    const dir = join(dataDir, id);
    await mkdir(join(dir, "history"), { recursive: true });
    await mkdir(join(dir, "submits"), { recursive: true });
    const now = new Date().toISOString();
    const first = !existsSync(join(dir, "latest.json"));
    const record = JSON.stringify({ receivedAt: now, kind, ...p }, null, 1);

    await atomicWrite(join(dir, "latest.json"), record);
    await atomicWrite(join(dir, "history", `${now.slice(0, 13)}.json`), record); // one per hour
    if (kind === "submit") {
      const file = `submit-${stamp()}.json`;
      await writeFile(join(dir, "submits", file), record, { flag: "wx" }); // never overwrite
      const r = p.export?.readable ?? {};
      const rows = Object.values(r).filter((x) => x.answer).map((x) => `<tr><td style="padding:6px 10px;color:#5d5a52;font:12px monospace;vertical-align:top">${esc(x.module)}</td><td style="padding:6px 10px"><b>${esc(x.question)}</b><br>${esc(x.answer)}</td></tr>`).join("");
      await mail(`[The Core 3.0] ${c.name ?? id} a trimis`, `<p><b>${esc(c.contact ?? "")}</b> a trimis The Core 3.0 pentru <b>${esc(c.name ?? id)}</b>. JSON-ul complet e atașat; se încarcă direct în modul workshop.</p><table style="border-collapse:collapse;font:14px sans-serif">${rows}</table>`,
        [{ filename: `the-core-3_${id}_${now.slice(0, 10)}.json`, content: JSON.stringify(p.export ?? p, null, 2) }]);
      if (c.email) {
        try { await transport?.sendMail({ from: mailFrom, to: c.email, subject: "Am primit The Core 3.0", html: `<p>Salut, ${esc(c.contact ?? "")}. Am primit tot ce ai completat. Ne vedem la masă.</p><p>Cromatic Studios</p>` }); } catch (e) { console.error("[core30] confirm failed", e.message); }
      }
    } else if (first) {
      await mail(`[The Core 3.0] ${c.contact ?? id} a început`, `<p>${esc(c.contact ?? "")} (${esc(c.name ?? id)}) a început să completeze The Core 3.0. Salvăm fiecare modificare în ${esc(dir)}.</p>`);
    }
    return [200, { ok: true, at: now }];
  }

  async function config(id, t) {
    const c = (await clients())[safe(id)];
    if (!c?.file) return [404, { ok: false }];
    if (c.token && t !== c.token) return [403, { ok: false }];
    return [200, JSON.parse(await readFile(c.file, "utf8"))];
  }

  async function latest(id, key) {
    if (!adminKey || key !== adminKey) return [403, { ok: false }];
    try { return [200, JSON.parse(await readFile(join(dataDir, safe(id), "latest.json"), "utf8"))]; }
    catch { return [404, { ok: false }]; }
  }

  function serveTool(req, res, path) {
    const rel = normalize(path.replace(/^\/thecore30\/?/, "")).replace(/^(\.\.(\/|\\|$))+/, "");
    let file = join(distDir, rel);
    if (!rel || !extname(rel) || !existsSync(file) || statSync(file).isDirectory()) file = join(distDir, "index.html");
    const type = MIME[extname(file)] ?? "application/octet-stream";
    res.writeHead(200, { "Content-Type": type, "Cache-Control": file.endsWith("index.html") ? "no-cache" : "public, max-age=31536000, immutable", "X-Robots-Tag": "noindex" });
    if (req.method === "HEAD") return res.end();
    createReadStream(file).pipe(res);
  }

  /** returns true when it handled the request */
  return async function handle(req, res) {
    const url = new URL(req.url, "http://x");
    const p = url.pathname;
    if (p === "/thecore30" || p.startsWith("/thecore30/")) { serveTool(req, res, p); return true; }
    if (!p.startsWith("/api/core30/")) return false;
    try {
      if (req.method === "POST" && (p === "/api/core30/draft" || p === "/api/core30/submit")) {
        const [code, out] = await store(p.endsWith("submit") ? "submit" : "draft", await readBody(req));
        send(res, code, out); return true;
      }
      const c = p.match(/^\/api\/core30\/([a-z0-9_-]+)\/config$/i);
      if (req.method === "GET" && c) { const [code, out] = await config(c[1], url.searchParams.get("t") ?? ""); send(res, code, out); return true; }
      const m = p.match(/^\/api\/core30\/([a-z0-9_-]+)\/latest$/i);
      if (req.method === "GET" && m) { const [code, out] = await latest(m[1], url.searchParams.get("key")); send(res, code, out); return true; }
      if (req.method === "GET" && p === "/api/core30/_list") {
        if (!adminKey || url.searchParams.get("key") !== adminKey) { send(res, 403, { ok: false }); return true; }
        const ids = existsSync(dataDir) ? await readdir(dataDir) : [];
        send(res, 200, { ok: true, clients: ids }); return true;
      }
      send(res, 404, { ok: false });
    } catch (e) {
      console.error("[core30]", e);
      send(res, e.code === 413 ? 413 : 500, { ok: false });
    }
    return true;
  };
}

function esc(s) { return String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]); }
