// Client resources (Daniel, 19 Nov): /client-resources/<client>/..., one folder of materials per client (hub, guidelines,
// audits, PDFs), behind one password per client. Uploaded by the bridge, like the offers in /proposals/, no deploy.
// Node 16, no new dependency.
//
//   GET|HEAD /client-resources/<client>[/<path>]   the files; without a valid cookie the login page (401); a folder serves its index.html
//   POST     /client-resources/<client>[/<path>]   the login form: p=<password> -> a cookie for this client, then 303 back to <path>
//   (bridge, Bearer key, routed in ops.mjs)
//   GET    /api/ops/bridge/client-resource           the clients: files, bytes, password yes/no, last change
//   POST   /api/ops/bridge/client-resource           {client, files: {"rel/path.ext": base64}}   adds or replaces, atomic per file
//   DELETE /api/ops/bridge/client-resource           {client, path} one file | {client, all: true} the whole client (files + password)
//   POST   /api/ops/bridge/client-resource/password  {client, password, name?}   sets or changes the password (8+ characters)
//
// Storage: <dataDir>/client-resources/<client>/{access.json, files/...}. Only files/ is ever served; access.json (the scrypt hash
// with its salt, and the display name) sits beside it and no URL reaches it. Every path is stored in lowercase, so a link is
// matched without regard to case (as in /proposals/). A client without a password answers 404: nothing is public by mistake.
//
// The cookie: cr_<client>=<exp>.<hmac>, HttpOnly, Secure (except on localhost), SameSite=Lax, Path=/client-resources/<client>/,
// 30 days. The HMAC key is CLIENT_RES_SECRET (32+ characters) or a random key made once in <dataDir>/client-resources/.cookie-key
// (mode 600), never in the repo. The signed text holds the client and the password's salt, so a cookie of one client is worth
// nothing on another, and a new password ends every open visit at once.
//
// The pages are ours (uploaded only with the bridge key), they use Google Fonts and pictures from other hosts (Unsplash), so they get
// a policy of their own that allows those (server.js keeps /client-resources/ out of the site's strict CSP, as it does /f/).
// They are NOT sandboxed: a sandboxed page has an opaque origin and its pictures and styles would arrive without the cookie.
import { readFileSync, writeFileSync, renameSync, mkdirSync, statSync, readdirSync, createReadStream, rmSync, realpathSync, unlinkSync } from "node:fs";
import { join, normalize, extname, dirname } from "node:path";
import { randomBytes, scrypt, timingSafeEqual, createHmac } from "node:crypto";

export const CLIENT_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const SEG_RE = /^[a-z0-9][a-z0-9._-]{0,119}$/; // one path segment, already lowercased; never starts with a dot
const PATH_MAX = 300, DEPTH_MAX = 8;
export const CR_TYPES = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".json": "application/json; charset=utf-8",
  ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp", ".gif": "image/gif", ".svg": "image/svg+xml", ".ico": "image/x-icon",
  ".pdf": "application/pdf", ".woff": "font/woff", ".woff2": "font/woff2", ".ttf": "font/ttf", ".otf": "font/otf",
  ".mp4": "video/mp4", ".webm": "video/webm", ".zip": "application/zip", ".txt": "text/plain; charset=utf-8",
};
export const CR_FILE_MAX = 25 * 1048576;          // one file
export const CR_BODY_MAX = 36 * 1048576;          // one batch, as JSON with base64 (a 25 MB file is ~33.4 MB in base64)
const PW_MIN = 8, PW_MAX = 200, TTL = 30 * 86400e3;
const pwNorm = (v) => (typeof v === "string" ? v.normalize("NFKC") : "");
const pwHash = (pw, salt) => new Promise((ok, no) => scrypt(pw, salt, 32, (e, k) => (e ? no(e) : ok(k))));

/** a relative path from the bridge or a URL -> its lowercase segments, or null. Rejects .., ., empty parts, absolute, backslash, NUL */
export function cleanRel(rel) {
  if (typeof rel !== "string" || !rel || rel.length > PATH_MAX || /[\\\u0000-\u001f\u007f]/.test(rel) || rel.startsWith("/")) return null;
  const segs = rel.toLowerCase().split("/");
  if (segs.length > DEPTH_MAX || !segs.every((s) => SEG_RE.test(s) && s !== "." && s !== ".." && !s.includes(".."))) return null;
  if (!CR_TYPES[extname(segs[segs.length - 1])]) return null;
  return segs;
}
const nice = (client) => client.length <= 4 ? client.toUpperCase() : client.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));

// the pages' own policy: our scripts and inline ones (the hubs are single files), Google Fonts, pictures and films from https hosts
const PAGE_CSP = [
  "default-src 'self'", "script-src 'self' 'unsafe-inline'", "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
  "font-src 'self' data: https://fonts.gstatic.com", "img-src 'self' data: blob: https:", "media-src 'self' blob: https:",
  "connect-src 'self'", "frame-src 'self' https://www.youtube-nocookie.com https://player.vimeo.com", "object-src 'none'",
  "base-uri 'self'", "form-action 'self'", "frame-ancestors 'self'",
].join("; ");
const GATE_CSP = "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'none'; base-uri 'none'";
const PRIVATE = { "X-Robots-Tag": "noindex, nofollow, noarchive", "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff" };
const NOT_FOUND = { ...PRIVATE, "Content-Type": "text/plain; charset=utf-8" };
const MSG = { wrong: "Parola nu e cea bună.", rate: "Prea multe încercări. Mai încearcă peste un sfert de oră." };

/** the login page: a password field and a button, the client's name, no script. Ilinca finishes the look (tokens on :root) */
function loginPage(name, why) {
  const m = MSG[why];
  return `<!doctype html><html lang="ro"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex, nofollow, noarchive"><title>${esc(name)} · Resurse · Cromatic Studios</title><style>
:root{--bg:#f4f1ea;--ink:#111;--muted:#5c5a55;--field:#fff;--accent:#ffd400;--err:#b3261a;--r:14px}
@media (prefers-color-scheme:dark){:root{--bg:#111;--ink:#f4f1ea;--muted:#a8a59e;--field:#1c1c1c;--err:#ff8a7a}}
*{box-sizing:border-box}html{color-scheme:light dark}body{margin:0;min-height:100vh;min-height:100dvh;display:grid;place-items:center;padding:24px 16px;background:var(--bg);color:var(--ink);font:16px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
main{width:100%;max-width:380px;display:grid;gap:20px}.k{margin:0;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted)}h1{margin:0;font-size:32px;line-height:1.1;letter-spacing:-.02em}p{margin:0}
form{display:grid;gap:12px}label{font-weight:600;font-size:14px}input{font:inherit;font-size:17px;padding:14px 16px;border:2px solid var(--ink);border-radius:var(--r);background:var(--field);color:var(--ink);width:100%}
button{font:inherit;font-weight:700;font-size:16px;min-height:52px;border:0;border-radius:999px;background:var(--accent);color:#111;cursor:pointer}button:hover{filter:brightness(.95)}
input:focus-visible,button:focus-visible{outline:3px solid var(--ink);outline-offset:3px}.err{font-weight:700;color:var(--err)}.by{font-size:13px;color:var(--muted)}
</style></head><body><main><div><p class="k">Resurse pentru</p><h1>${esc(name)}</h1></div>
${m ? `<p class="err" role="alert">${m}</p>` : ""}<form method="post" autocomplete="off"><label for="p">Parola</label><input id="p" type="password" name="p" required maxlength="${PW_MAX}" autofocus autocomplete="current-password" autocapitalize="none" spellcheck="false"><button type="submit">Intră</button></form>
<p class="by">Parola o primești de la echipa Cromatic Studios.</p></main></body></html>`;
}

export function createClientResources({ dataDir, limiter, ipOf, appendLine, log = console }) {
  const ROOT = join(dataDir, "client-resources");
  mkdirSync(ROOT, { recursive: true });
  const statOr = (p) => { try { return statSync(p); } catch { return null; } };
  const ipTries = limiter(10, 15 * 60e3), clientTries = limiter(100, 15 * 60e3); // 10 per address and client, 100 per client in all

  // the HMAC key: from the environment, else made once beside the data (never in the repo, never printed)
  let KEY = String(process.env.CLIENT_RES_SECRET || "").trim();
  if (KEY.length < 32) {
    const kf = join(ROOT, ".cookie-key");
    try { KEY = readFileSync(kf, "utf8").trim(); } catch {}
    if (KEY.length < 32) { KEY = randomBytes(32).toString("hex"); writeFileSync(kf, KEY, { mode: 0o600, flag: "w" }); log.log("[client-resources] made a new cookie key in the data dir"); }
  }
  const dirOf = (c) => join(ROOT, c), filesOf = (c) => join(ROOT, c, "files");
  const access = (c) => { try { const a = JSON.parse(readFileSync(join(dirOf(c), "access.json"), "utf8")); return a && a.pw && a.pw.salt && a.pw.hash ? a : null; } catch { return null; } };
  const sign = (c, a, exp) => createHmac("sha256", KEY).update(`${c}.${exp}.${a.pw.salt}`).digest("hex");
  const cookieName = (c) => "cr_" + c;

  function hasPass(req, c, a) {
    const m = new RegExp("(?:^|;\\s*)" + cookieName(c) + "=([0-9a-z]{1,12})\\.([a-f0-9]{64})(?:;|$)").exec(String(req.headers.cookie || ""));
    if (!m) return false;
    const exp = parseInt(m[1], 36), now = Date.now();
    if (!(exp > now) || exp > now + TTL + 60e3) return false;
    return timingSafeEqual(Buffer.from(m[2], "hex"), Buffer.from(sign(c, a, m[1]), "hex"));
  }
  const secureFor = (req) => !/^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/.test(String(req.headers.host || ""));
  function gate(req, res, code, c, a, why) {
    const html = req.method === "HEAD" ? "" : loginPage(a.name || nice(c), why);
    res.writeHead(code, { ...PRIVATE, "Content-Type": "text/html; charset=utf-8", "Content-Security-Policy": GATE_CSP, "X-Frame-Options": "DENY", ...(html ? { "Content-Length": Buffer.byteLength(html) } : {}) });
    res.end(html || undefined);
  }
  async function unlock(req, res, c, a, here) {
    const overIp = ipTries(ipOf(req) + " " + c), overClient = clientTries(c); // both counted on every try
    if (overIp || overClient) { res.once("finish", () => req.destroy()); return gate(req, res, 429, c, a, "rate"); }
    let n = 0; const chunks = [];
    for await (const ch of req) { n += ch.length; if (n > 4096) { res.once("finish", () => req.destroy()); return gate(req, res, 401, c, a, "wrong"); } chunks.push(ch); }
    const pw = pwNorm(new URLSearchParams(Buffer.concat(chunks).toString("utf8")).get("p") || "").slice(0, PW_MAX);
    const now = access(c); // the password may have changed while the form was open
    if (!now) { res.writeHead(404, NOT_FOUND); return res.end("Not found"); }
    const ok = timingSafeEqual(await pwHash(pw, Buffer.from(now.pw.salt, "hex")), Buffer.from(now.pw.hash, "hex")) && !!pw;
    appendLine("client-resources.jsonl", { at: new Date().toISOString(), event: ok ? "login" : "login-wrong", client: c, ip: ipOf(req) });
    if (!ok) return gate(req, res, 401, c, now, "wrong");
    const exp = (Date.now() + TTL).toString(36);
    res.writeHead(303, { ...NOT_FOUND, Location: here, "Set-Cookie": `${cookieName(c)}=${exp}.${sign(c, now, exp)}; Path=/client-resources/${c}/; Max-Age=${TTL / 1000}; HttpOnly; SameSite=Lax${secureFor(req) ? "; Secure" : ""}` });
    res.end();
  }

  /** GET|HEAD|POST /client-resources/<client>/<path> */
  function serve(req, res) {
    const miss = () => { res.writeHead(404, NOT_FOUND); res.end(req.method === "HEAD" ? undefined : "Not found"); };
    const m0 = req.method;
    if (m0 !== "GET" && m0 !== "HEAD" && m0 !== "POST") { res.writeHead(405, { ...NOT_FOUND, Allow: "GET, HEAD, POST" }); return res.end(); }
    let raw = String(req.url).split("?")[0].split("#")[0], path;
    try { path = decodeURIComponent(raw); } catch { return miss(); }
    if (/[\\\u0000-\u001f\u007f]/.test(path) || /%/.test(path)) return miss(); // a "%" left after one decoding is a double encoding: never a name of ours
    const mm = /^\/client-resources\/([^/]+)(\/.*)?$/.exec(path);
    if (!mm || !CLIENT_RE.test(mm[1])) return miss();
    const c = mm[1], a = access(c);
    if (!a) return miss(); // no password, no route
    const base = "/client-resources/" + c + "/";
    if (mm[2] === undefined) { res.writeHead(301, { ...NOT_FOUND, Location: base }); return res.end(); }
    // the path inside the client: every segment checked, a folder (empty or ending in /) means its index.html
    let rest = mm[2].slice(1);
    const folder = rest === "" || rest.endsWith("/");
    if (folder) rest += "index.html";
    let segs = cleanRel(rest);
    if (!segs) {
      // "/client-resources/pmm/docs" (a folder without its slash): redirect, but only once logged in and only when it is a folder
      const s2 = rest.toLowerCase().split("/");
      if (!folder && s2.every((s) => SEG_RE.test(s) && !s.includes("..")) && hasPass(req, c, a) && statOr(join(filesOf(c), ...s2))?.isDirectory()) { res.writeHead(301, { ...NOT_FOUND, Location: base + s2.join("/") + "/" }); return res.end(); }
      if (!hasPass(req, c, a)) return m0 === "POST" ? void unlock(req, res, c, a, base).catch(() => res.destroy()) : gate(req, res, 401, c, a);
      return miss();
    }
    const here = base + segs.join("/").replace(/(^|\/)index\.html$/, "$1");
    if (!hasPass(req, c, a)) {
      if (m0 === "POST") return void unlock(req, res, c, a, here).catch((e) => { log.error?.("[client-resources] unlock", e?.message); res.destroy(); });
      return gate(req, res, 401, c, a);
    }
    if (m0 === "POST") { res.writeHead(303, { ...NOT_FOUND, Location: here }); return res.end(); }
    // the file: normalized, then its real path must still be under files/ (no symlink, no trick gets out)
    const root = filesOf(c), full = normalize(join(root, ...segs));
    if (!full.startsWith(root + "/")) return miss();
    let real; try { real = realpathSync(full); } catch { return miss(); }
    let rootReal; try { rootReal = realpathSync(root); } catch { return miss(); }
    if (!real.startsWith(rootReal + "/")) return miss();
    const st = statOr(real);
    if (!st || !st.isFile()) return miss();
    const ext = extname(real).toLowerCase(), type = CR_TYPES[ext];
    if (!type) return miss();
    const h = { ...PRIVATE, "Content-Type": type, "X-Frame-Options": "SAMEORIGIN", "Accept-Ranges": "bytes", "Last-Modified": st.mtime.toUTCString() };
    if (ext === ".html" || ext === ".svg") h["Content-Security-Policy"] = PAGE_CSP;
    if (ext === ".pdf") h["Content-Disposition"] = "inline";
    if (ext === ".zip") h["Content-Disposition"] = `attachment; filename="${segs[segs.length - 1]}"`;
    // ranges, for the films (Safari asks for them) and big PDFs
    const rg = /^bytes=(\d*)-(\d*)$/.exec(String(req.headers.range || ""));
    if (rg && (rg[1] || rg[2])) {
      let start = rg[1] ? Number(rg[1]) : Math.max(0, st.size - Number(rg[2])), end = rg[1] && rg[2] ? Math.min(Number(rg[2]), st.size - 1) : st.size - 1;
      if (start > end || start >= st.size) { res.writeHead(416, { ...NOT_FOUND, "Content-Range": `bytes */${st.size}` }); return res.end(); }
      res.writeHead(206, { ...h, "Content-Range": `bytes ${start}-${end}/${st.size}`, "Content-Length": end - start + 1 });
      if (m0 === "HEAD") return res.end();
      return void createReadStream(real, { start, end }).on("error", () => res.destroy()).pipe(res);
    }
    res.writeHead(200, { ...h, "Content-Length": st.size });
    if (m0 === "HEAD") return res.end();
    createReadStream(real).on("error", () => res.destroy()).pipe(res);
  }

  // ---------- the bridge side (ops.mjs checks the Bearer key and parses the JSON) ----------
  const walk = (d, out = [], pre = "") => { let list = []; try { list = readdirSync(d, { withFileTypes: true }); } catch { return out; } for (const e of list) { if (e.name.startsWith(".")) continue; const p = join(d, e.name); if (e.isDirectory()) walk(p, out, pre + e.name + "/"); else if (e.isFile()) { const st = statOr(p); if (st) out.push({ path: pre + e.name, size: st.size, mtime: st.mtimeMs }); } } return out; };

  function list() {
    let names = []; try { names = readdirSync(ROOT).filter((n) => CLIENT_RE.test(n) && statOr(dirOf(n))?.isDirectory()); } catch {}
    return names.sort().map((c) => {
      const files = walk(filesOf(c)), a = access(c), aSt = statOr(join(dirOf(c), "access.json"));
      const last = Math.max(0, aSt ? aSt.mtimeMs : 0, ...files.map((f) => f.mtime));
      return { client: c, name: (a && a.name) || nice(c), url: "/client-resources/" + c + "/", files: files.length, bytes: files.reduce((s, f) => s + f.size, 0), password: !!a, hasIndex: files.some((f) => f.path === "index.html"), lastModified: last ? new Date(last).toISOString() : null };
    });
  }

  /** {client, files: {rel: base64}} -> [status, body]. Every path checked before anything is written; each file lands by a rename */
  function put(b) {
    const c = String((b && b.client) || ""), files = b && b.files && typeof b.files === "object" && !Array.isArray(b.files) ? b.files : null;
    if (!CLIENT_RE.test(c) || c.length > 60) return [422, { ok: false, error: "client" }];
    const names = files ? Object.keys(files) : [];
    if (!names.length || names.length > 500) return [422, { ok: false, error: "files" }];
    const plan = [], seen = new Set();
    for (const n of names) {
      const segs = cleanRel(n);
      if (!segs) return [422, { ok: false, error: "path", file: String(n).slice(0, 120) }];
      if (typeof files[n] !== "string" || files[n].length % 4 || !/^[A-Za-z0-9+/]*={0,2}$/.test(files[n])) return [422, { ok: false, error: "content", file: segs.join("/") }]; // base64 only
      const rel = segs.join("/");
      if (seen.has(rel)) return [422, { ok: false, error: "duplicate", file: rel }]; // two names that differ only by case
      seen.add(rel);
      const buf = Buffer.from(files[n], "base64");
      if (buf.length > CR_FILE_MAX) return [413, { ok: false, error: "too-large", file: rel }];
      plan.push({ rel, segs, buf });
    }
    const root = filesOf(c);
    for (const { segs, buf } of plan) {
      const full = normalize(join(root, ...segs));
      if (!full.startsWith(root + "/")) return [422, { ok: false, error: "path" }];
      mkdirSync(dirname(full), { recursive: true });
      const tmp = join(dirname(full), "." + segs[segs.length - 1] + ".tmp-" + process.pid + "-" + randomBytes(4).toString("hex"));
      writeFileSync(tmp, buf, { mode: 0o644 });
      try { renameSync(tmp, full); } catch (e) { try { unlinkSync(tmp); } catch {} throw e; }
    }
    appendLine("client-resources.jsonl", { at: new Date().toISOString(), event: "put", client: c, files: plan.map((p) => p.rel), bytes: plan.reduce((s, p) => s + p.buf.length, 0) });
    return [200, { ok: true, client: c, password: !!access(c), urls: plan.map((p) => "/client-resources/" + c + "/" + p.rel) }];
  }

  /** {client, path} | {client, all: true} */
  function remove(b) {
    const c = String((b && b.client) || "");
    if (!CLIENT_RE.test(c)) return [422, { ok: false, error: "client" }];
    const d = dirOf(c);
    if (!d.startsWith(ROOT + "/") || !statOr(d)?.isDirectory()) return [404, { ok: false, error: "not-found" }];
    if (b.all === true) {
      const n = walk(filesOf(c)).length;
      const gone = join(ROOT, ".gone-" + c + "-" + Date.now()); // a rename first: a reader sees the client or nothing
      renameSync(d, gone); rmSync(gone, { recursive: true, force: true });
      appendLine("client-resources.jsonl", { at: new Date().toISOString(), event: "delete-all", client: c, files: n });
      return [200, { ok: true, client: c, all: true, removed: n }];
    }
    const segs = cleanRel(String(b.path || ""));
    if (!segs) return [422, { ok: false, error: "path" }];
    const root = filesOf(c), full = normalize(join(root, ...segs));
    if (!full.startsWith(root + "/") || !statOr(full)?.isFile()) return [404, { ok: false, error: "not-found" }];
    unlinkSync(full);
    appendLine("client-resources.jsonl", { at: new Date().toISOString(), event: "delete", client: c, path: segs.join("/") });
    return [200, { ok: true, client: c, removed: 1, path: segs.join("/") }];
  }

  /** {client, password, name?}: the password is never logged, never stored, only scrypt(salt, password) */
  async function setPassword(b) {
    const c = String((b && b.client) || ""), pw = pwNorm(b && b.password);
    if (!CLIENT_RE.test(c) || c.length > 60) return [422, { ok: false, error: "client" }];
    if (pw.length < PW_MIN || pw.length > PW_MAX) return [422, { ok: false, error: "password", message: `Parola are între ${PW_MIN} și ${PW_MAX} caractere.` }];
    const name = typeof b.name === "string" ? b.name.replace(/[\u0000-\u001f\u007f<>]/g, "").trim().slice(0, 80) : "";
    const old = access(c), salt = randomBytes(16);
    const doc = { client: c, name: name || (old && old.name) || "", pw: { salt: salt.toString("hex"), hash: (await pwHash(pw, salt)).toString("hex"), at: new Date().toISOString() } };
    mkdirSync(filesOf(c), { recursive: true });
    const f = join(dirOf(c), "access.json"), tmp = f + ".tmp-" + process.pid;
    writeFileSync(tmp, JSON.stringify(doc), { mode: 0o600 }); renameSync(tmp, f);
    appendLine("client-resources.jsonl", { at: new Date().toISOString(), event: old ? "password-change" : "password-set", client: c });
    return [200, { ok: true, client: c, changed: !!old, url: "/client-resources/" + c + "/" }];
  }

  return { serve, list, put, remove, setPassword };
}
