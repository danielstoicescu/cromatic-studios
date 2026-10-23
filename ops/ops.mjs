// TASK-124: "cromaticstudios.com ops", the password-protected MIRROR of the Cromatic Ops artifact, at /ops (beta hosts only).
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
import { readFileSync, writeFileSync, appendFileSync, renameSync, mkdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import { randomBytes, randomInt, createHash, timingSafeEqual } from "node:crypto";

// the allow-list lives in ops/users.json (one place to edit); <dataDir>/users.json overrides it on a server
const USERS_FILE = new URL("./users.json", import.meta.url);

const CODE_TTL = 10 * 60e3, CODE_TRIES = 5, SESSION_TTL = 12 * 3600e3;
const COOKIE = "ops_sid";
const KINDS = new Set(["command", "bug", "feedback"]);
const ADMIN_PAYLOAD_TYPES = new Set(["core-request"]); // members cannot send these
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const ASSETS = { "logo.css": "text/css; charset=utf-8", "adapter.js": "text/javascript; charset=utf-8", "login.js": "text/javascript; charset=utf-8", "ops.css": "text/css; charset=utf-8", "favicon.svg": "image/svg+xml" };

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
    const pretty = code.slice(0, 3) + " " + code.slice(3);
    const subject = `${pretty} e codul tău pentru cromaticstudios.com ops`;
    const text = `Salut, ${name}.\n\nCodul tău e ${pretty}.\nMerge 10 minute, o singură dată.\n\nDacă nu l-ai cerut tu, ignoră mailul. Nu intră nimeni fără el.\n\nCromatic Studios · Str. Olari 9`;
    const html = `<div style="font:16px/1.5 -apple-system,Segoe UI,Helvetica,Arial,sans-serif;color:#000;max-width:440px;margin:0 auto;padding:24px">
<p style="margin:0 0 16px">Salut, ${esc(name)}.</p>
<p style="margin:0 0 8px">Codul tău pentru <b>cromaticstudios.com ops</b>:</p>
<p style="margin:0 0 16px"><span style="display:inline-block;font:800 30px/1 ui-monospace,Menlo,monospace;letter-spacing:.12em;background:#f8d13b;border:1px solid #000;border-radius:999px;padding:10px 22px">${pretty}</span></p>
<p style="margin:0 0 16px;color:#5e6168">Merge 10 minute, o singură dată. Dacă nu l-ai cerut tu, ignoră mailul. Nu intră nimeni fără el.</p>
<p style="margin:0;font-size:13px;color:#8a8d93">Cromatic Studios · Str. Olari 9</p></div>`;
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
      if (name === "coreRequests" || name === "approvals" || name === "security") continue;
      if (name === "core") { out.core = {}; for (const [id, d] of Object.entries(docs || {})) { const { token, link, url, links, log: _l, ...rest } = d || {}; out.core[id] = scrub(rest); } continue; }
      out[name] = scrub(docs);
    }
    return { collections: out, generatedAt: snap.generatedAt };
  }
  // colleagues' messages not yet in the artifact show up in the conversation right away, as "Trimis"
  function withOutbox(view) {
    const snapAt = Date.parse(view.generatedAt || 0) || 0;
    const inbox = { ...(view.collections.inbox || {}) };
    for (const x of readLines("outbox.jsonl")) {
      if (inbox[x.id]) continue;
      if (x.status !== "new" && !(Date.parse(x.ackedAt || 0) > snapAt)) continue;
      inbox[x.id] = { createdAt: x.createdAt, from: "ops:" + x.from, kind: x.kind, text: x.text, payload: x.payload || null, status: "new", reply: x.reply || "", by: { email: x.from, name: x.name, role: x.role }, pending: true };
    }
    return { ...view, collections: { ...view.collections, inbox } };
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
      if (p.startsWith("/ops/")) {
        const name = p.slice(5);
        if (ASSETS[name] && (m === "GET" || m === "HEAD")) file(res, name, ASSETS[name]); else { res.writeHead(404, HDR); res.end(); }
        return true;
      }
      if (!p.startsWith("/api/ops/")) return false;
      const r = p.slice(9);

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
          const ids = new Set(Array.isArray(b.ids) ? b.ids.map(String) : []), replies = b.replies && typeof b.replies === "object" ? b.replies : {};
          const at = new Date().toISOString(); let n = 0;
          const list = readLines("outbox.jsonl").map((x) => { if (ids.has(x.id) && x.status === "new") { n++; return { ...x, status: "acked", ackedAt: at, ...(replies[x.id] ? { reply: str(replies[x.id], 4000) } : {}) }; } return x; });
          const tmp = P("outbox.jsonl.tmp-" + process.pid); writeFileSync(tmp, list.map((x) => JSON.stringify(x) + "\n").join(""), { mode: 0o600 }); renameSync(tmp, P("outbox.jsonl"));
          json(res, 200, { ok: true, acked: n }); return true;
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
      if (r === "snapshot" && m === "GET") { json(res, 200, { ok: true, user: pub(s), ...withOutbox(forRole(snapshot(), s.user.role)) }); return true; }
      if (r === "inbox" && m === "POST") {
        if (userInbox(s.email)) { json(res, 429, { ok: false, error: "rate" }); return true; }
        const b = await body(req, 32e3);
        const kind = str(b.kind, 20), text = str(b.text, 4000);
        if (!KINDS.has(kind) || !text) { json(res, 422, { ok: false, error: "kind/text" }); return true; }
        let payload = b.payload && typeof b.payload === "object" && !Array.isArray(b.payload) ? b.payload : null;
        if (payload && JSON.stringify(payload).length > 16e3) { json(res, 413, { ok: false }); return true; }
        if (payload && ADMIN_PAYLOAD_TYPES.has(String(payload.type || "")) && s.user.role !== "admin") { json(res, 403, { ok: false }); return true; }
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

export const isOps = (url) => url === "/ops" || url.startsWith("/ops/") || url.startsWith("/ops?") || url.startsWith("/api/ops/");
function esc(s) { return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])); }
