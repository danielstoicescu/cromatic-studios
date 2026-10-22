// The Core 3.0 · server side. Mounts into cromaticstudios.com's server.js (plain node:http, no framework).
//
//   GET  /thecore30/<client>?t=<token>      the tool (dist/, built with base /thecore30/)
//   POST /api/core30/start                   the respondent left their email on the intro: the session starts here
//   POST /api/core30/event                   the step log: a module completed, a "sari, revin", an export (no mail)
//   POST /api/core30/draft                   every change, debounced by the browser (+ a beacon on page close)
//   POST /api/core30/submit                  "Trimite la Cromatic": final copy + emails
//   GET  /api/core30/<client>/config?t=…     that respondent's questionnaire, only with the right token
//   GET  /api/core30/<client>/status?t=…     timestamps and counts only (for the Cromatic Ops dashboard), same token
//   GET  /api/core30/<client>/latest?key=…   the workshop loads the newest copy (CORE30_ADMIN_KEY)
//
// Nothing is ever lost on the way: latest.json is the newest state, history/ keeps one snapshot per hour
// (the last write of that hour), submits are append-only and never overwritten. Emails go to the studio
// on the first draft (someone started) and on every submit, with the full JSON attached.

import { mkdir, readFile, rename, writeFile, readdir, appendFile } from "node:fs/promises";
import { existsSync, createReadStream, statSync } from "node:fs";
import { join, extname, normalize } from "node:path";

const MAX = 25 * 1024 * 1024; // 6 reference images plus every answer stay far below this
const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".svg": "image/svg+xml", ".woff2": "font/woff2", ".json": "application/json", ".ico": "image/x-icon" };

const readBody = (req) => new Promise((ok, bad) => {
  // past the limit, keep draining (so the client gets a clean 413, not a cut connection and a proxy 502)
  let n = 0, over = false; const chunks = [];
  req.on("data", (c) => { n += c.length; if (n > MAX) over = true; else chunks.push(c); });
  req.on("end", () => (over ? bad(Object.assign(new Error("too large"), { code: 413 })) : ok(Buffer.concat(chunks).toString("utf8"))));
  req.on("error", bad);
});
const send = (res, code, obj) => { res.writeHead(code, { "Content-Type": "application/json", "Cache-Control": "no-store" }); res.end(JSON.stringify(obj)); };
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const lockKey = (body) => { try { return String(JSON.parse(body).clientId ?? "").replace(/[^a-z0-9_-]/gi, "").slice(0, 64); } catch { return ""; } };
const safe = (s) => String(s || "").replace(/[^a-z0-9_-]/gi, "").slice(0, 64);
const stamp = () => new Date().toISOString().replace(/[:.]/g, "-");

let tmpN = 0;
async function atomicWrite(file, data) {
  const tmp = `${file}.${process.pid}.${++tmpN}.${Math.random().toString(36).slice(2, 8)}.tmp`; // unique: parallel writes never share a temp file
  await writeFile(tmp, data);
  await rename(tmp, file);
}

// one queue per client: start, drafts, submits and steps read-modify-write meta.json and the log in order
const queues = new Map();
function withLock(key, fn) {
  const prev = queues.get(key) ?? Promise.resolve();
  const run = prev.then(fn, fn);
  queues.set(key, run.catch(() => {}));
  return run;
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
        out[c.id] = { token: c.access?.token ?? "", emailMode: c.access?.email === "optional" ? "optional" : "required", name: c.client?.name, contact: c.client?.contact, email: c.client?.email ?? "", file: join(configDir, f) };
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
    const record = JSON.stringify({ receivedAt: now, kind, ...p }, null, 1);

    await atomicWrite(join(dir, "latest.json"), record);
    // one copy per browser too: a second device never overwrites what the first one sent
    const dev = String(p.device ?? p.session?.device ?? "").replace(/[^a-z0-9-]/gi, "").slice(0, 64);
    if (dev) { await mkdir(join(dir, "devices"), { recursive: true }); await atomicWrite(join(dir, "devices", `${dev}.json`), record); }
    // counters for /status: no answer content, ever
    const meta = await readMeta(dir);
    meta.firstDraftAt ??= now;
    meta.lastSaveAt = now;
    meta.saves = (meta.saves ?? 0) + 1;
    if (kind === "submit") { meta.submits = (meta.submits ?? 0) + 1; meta.lastSubmitAt = now; }
    await atomicWrite(join(dir, "meta.json"), JSON.stringify(meta));
    await atomicWrite(join(dir, "history", `${now.slice(0, 13)}.json`), record); // one per hour
    if (kind === "submit") {
      await appendLog(dir, { at: now, type: "submit" });
      const file = `submit-${stamp()}.json`;
      await writeFile(join(dir, "submits", file), record, { flag: "wx" }); // never overwrite
      const r = p.export?.readable ?? {};
      const rows = Object.values(r).filter((x) => x.answer).map((x) => `<tr><td style="padding:6px 10px;color:#5d5a52;font:12px monospace;vertical-align:top">${esc(x.module)}</td><td style="padding:6px 10px"><b>${esc(x.question)}</b><br>${esc(x.answer)}</td></tr>`).join("");
      await mail(`[The Core 3.0] ${c.name ?? id} a trimis`, `<p><b>${esc(c.contact ?? "")}</b> a trimis The Core 3.0 pentru <b>${esc(c.name ?? id)}</b>. JSON-ul complet e atașat; se încarcă direct în modul workshop.</p><table style="border-collapse:collapse;font:14px sans-serif">${rows}</table>`,
        [{ filename: `the-core-3_${id}_${now.slice(0, 10)}.json`, content: JSON.stringify(p.export ?? p, null, 2) }]);
      const to = c.email || p.export?.respondent?.email || "";
      if (EMAIL.test(to)) {
        try { await transport?.sendMail({ from: mailFrom, to, subject: "Am primit The Core 3.0", html: `<p>Salut${c.contact ? `, ${esc(c.contact)}` : ""}. Am primit tot ce ai completat. Citim cu atenție și ne vedem în studio, la o cafea, pentru workshop.</p><p>Cromatic Studios · Str. Olari 9, București</p>` }); } catch (e) { console.error("[core30] confirm failed", e.message); }
      }
    }
    return [200, { ok: true, at: now }];
  }

  async function config(id, t) {
    const c = (await clients())[safe(id)];
    if (!c?.file) return [404, { ok: false }];
    if (c.token && t !== c.token) return [403, { ok: false }];
    return [200, JSON.parse(await readFile(c.file, "utf8"))];
  }

  /** the intro's email step: records who started and when, and tells the studio */
  async function start(body) {
    let p;
    try { p = JSON.parse(body); } catch { return [400, { ok: false, error: "json" }]; }
    const c = (await clients())[safe(p.clientId)];
    if (!c) return [404, { ok: false, error: "client" }];
    if (c.token && p.token !== c.token) return [403, { ok: false, error: "token" }];
    const email = String(p.email ?? "").trim().toLowerCase();
    // an empty email is a valid start only where the edition says so (blank); a given email must be a real one
    if (email ? !EMAIL.test(email) || email.length > 200 : c.emailMode !== "optional") return [422, { ok: false, error: "email" }];
    const id = safe(p.clientId);
    const dir = join(dataDir, id);
    await mkdir(dir, { recursive: true });
    const now = new Date().toISOString();
    const meta = await readMeta(dir);
    const firstStart = !meta.startedAt;
    meta.startedAt ??= now;
    if (email) meta.startedBy ??= email;
    meta.starts = [...(meta.starts ?? []), email ? { at: now, email } : { at: now }].slice(-20); // every device or restart, newest last
    await atomicWrite(join(dir, "meta.json"), JSON.stringify(meta));
    await appendLog(dir, email ? { at: now, type: "start", email } : { at: now, type: "start" });
    if (firstStart && email) await mail(`[The Core 3.0] ${c.contact || email} a început · ${c.name ?? id}`, `<p><b>${esc(email)}</b> a început The Core 3.0 pentru <b>${esc(c.name ?? id)}</b>, la ${esc(now)}. Fiecare modificare se salvează în ${esc(dir)}.</p>`);
    return [200, { ok: true, at: now }];
  }

  // the step log: one JSON line per event, appended, never rewritten or trimmed
  const logFile = (dir) => join(dir, "log.jsonl");
  async function appendLog(dir, entry) { await appendFile(logFile(dir), JSON.stringify(entry) + "\n"); }
  async function readLog(dir) {
    try { return (await readFile(logFile(dir), "utf8")).split("\n").filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean); }
    catch { return []; }
  }

  /** steps from the browser; titles and positions come from the config on disk, not from the browser */
  async function events(body) {
    let p;
    try { p = JSON.parse(body); } catch { return [400, { ok: false, error: "json" }]; }
    const c = (await clients())[safe(p.clientId)];
    if (!c?.file) return [404, { ok: false, error: "client" }];
    if (c.token && p.token !== c.token) return [403, { ok: false, error: "token" }];
    const cfg = JSON.parse(await readFile(c.file, "utf8"));
    const mods = cfg.modules ?? [];
    const dir = join(dataDir, safe(p.clientId));
    await mkdir(dir, { recursive: true });
    const seen = new Set((await readLog(dir)).map((e) => e.id).filter(Boolean));
    const now = new Date().toISOString();
    let added = 0;
    for (const e of (Array.isArray(p.events) ? p.events : []).slice(0, 50)) {
      const eid = String(e.id ?? "").slice(0, 64);
      if (!eid || seen.has(eid) || !["step", "skip", "export", "save-error"].includes(e.type)) continue;
      const entry = { at: now, clientAt: typeof e.at === "string" ? e.at.slice(0, 40) : null, id: eid, type: e.type };
      if (e.type === "export") entry.format = e.format === "pdf" ? "pdf" : "json";
      else if (e.type === "save-error") {
        // why a draft failed in the browser: a status code or "network", the payload size, the browser. Never answers.
        entry.code = String(e.code ?? "").slice(0, 16);
        entry.bytes = Number.isFinite(e.bytes) ? Math.round(e.bytes) : null;
        entry.ua = String(e.ua ?? "").slice(0, 160);
        console.error(`[core30] ${safe(p.clientId)}: a draft failed in the browser (${entry.code}, ${entry.bytes} bytes, ${entry.ua})`);
      }
      else {
        const i = mods.findIndex((m) => m.id === e.moduleId);
        if (i < 0) continue;
        entry.module = { id: mods[i].id, title: mods[i].short, n: i + 1, total: mods.length };
      }
      await appendLog(dir, entry);
      seen.add(eid); added++;
    }
    return [200, { ok: true, added }];
  }

  async function readMeta(dir) {
    try { return JSON.parse(await readFile(join(dir, "meta.json"), "utf8")); } catch { /* first save, or data from before meta.json */ }
    // rebuild what can be known from the files already there
    const m = { saves: 0, submits: 0 };
    try { m.lastSaveAt = JSON.parse(await readFile(join(dir, "latest.json"), "utf8")).receivedAt; } catch { /* none */ }
    try {
      const h = (await readdir(join(dir, "history"))).filter((f) => f.endsWith(".json")).sort();
      if (h[0]) m.firstDraftAt = JSON.parse(await readFile(join(dir, "history", h[0]), "utf8")).receivedAt;
      m.saves = h.length; // at least one save per hour file
    } catch { /* none */ }
    try {
      const sub = (await readdir(join(dir, "submits"))).filter((f) => f.endsWith(".json")).sort();
      m.submits = sub.length;
      if (sub.length) m.lastSubmitAt = JSON.parse(await readFile(join(dir, "submits", sub[sub.length - 1]), "utf8")).receivedAt;
    } catch { /* none */ }
    return m;
  }

  /** timestamps and counts only, with the respondent's own token */
  async function status(id, t) {
    const c = (await clients())[safe(id)];
    if (!c) return [404, { ok: false }];
    if (c.token && t !== c.token) return [403, { ok: false }];
    const dir = join(dataDir, safe(id));
    const m = existsSync(dir) ? await readMeta(dir) : {};
    const total = (c.file ? JSON.parse(await readFile(c.file, "utf8")).modules?.length : 0) ?? 0;
    // the card's back: hours and titles only, never answers
    const log = (await readLog(dir)).map((e) => ({
      at: e.at, type: e.type,
      ...(e.module ? { module: e.module.id, title: e.module.title, n: e.module.n, total: e.module.total } : {}),
      ...(e.format ? { format: e.format } : {}),
      ...(e.type === "save-error" ? { code: e.code, bytes: e.bytes, ua: e.ua } : {}),
      ...(e.type === "start" && e.email ? { email: e.email } : {}),
    }));
    const doneIds = new Set(log.filter((e) => e.type === "step").map((e) => e.module));
    const lastStep = [...log].reverse().find((e) => e.type === "step" || e.type === "skip") ?? null;
    return [200, {
      ok: true, id: safe(id),
      started: !!(m.startedAt || m.firstDraftAt),
      startedAt: m.startedAt ?? null, startedBy: m.startedBy ?? null,
      firstDraftAt: m.firstDraftAt ?? null, lastSaveAt: m.lastSaveAt ?? null, saves: m.saves ?? 0,
      submits: m.submits ?? 0, lastSubmitAt: m.lastSubmitAt ?? null,
      progress: { done: doneIds.size, total }, lastStep, log,
    }];
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
      if (req.method === "POST" && p === "/api/core30/event") { const body = await readBody(req); const [code, out] = await withLock(lockKey(body), () => events(body)); send(res, code, out); return true; }
      if (req.method === "POST" && p === "/api/core30/start") { const body = await readBody(req); const [code, out] = await withLock(lockKey(body), () => start(body)); send(res, code, out); return true; }
      if (req.method === "POST" && (p === "/api/core30/draft" || p === "/api/core30/submit")) {
        const body = await readBody(req);
        const [code, out] = await withLock(lockKey(body), () => store(p.endsWith("submit") ? "submit" : "draft", body));
        send(res, code, out); return true;
      }
      const c = p.match(/^\/api\/core30\/([a-z0-9_-]+)\/config$/i);
      if (req.method === "GET" && c) { const [code, out] = await config(c[1], url.searchParams.get("t") ?? ""); send(res, code, out); return true; }
      const st = p.match(/^\/api\/core30\/([a-z0-9_-]+)\/status$/i);
      if (req.method === "GET" && st) { const [code, out] = await status(st[1], url.searchParams.get("t") ?? ""); send(res, code, out); return true; }
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
