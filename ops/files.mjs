// TASK-142: "Fișiere" in /ops (Daniel, 30 Oct: "un loc in care pur si simplu incarcam fisiere pe server si primim linkul de la ele").
// Admins drop a file (HTML, PDF, picture) and get a link at once, no deploy. Node 16, no new dependency.
//
//   GET    /api/ops/files              (admin) the list + the space used
//   POST   /api/ops/files?name=        (admin, Origin checked) the raw file as the body -> {ok, file}
//   POST   /api/ops/files/<id>?name=   (admin, Origin checked) replace: same id, same link
//   DELETE /api/ops/files/<id>         (admin, Origin checked) the link answers 404 from that moment
//   POST   /api/ops/files/<id>/password (admin, Origin checked) {password} sets or changes it, "" takes it off
//   GET    /f/<id>/<name>              public, for whoever has the link (and the password, when the file has one)
//   POST   /f/<id>/<name>              the password form of a locked file: p=<password> -> a cookie for this one link
//
// THE ISOLATION. These pages live on the same host as /ops, with whatever script a file brings. So everything that can run
// script (HTML, SVG) goes out with `Content-Security-Policy: sandbox ...` and WITHOUT allow-same-origin: the browser gives
// the page an opaque origin, so it has no cookies, no storage of ours and no same-origin fetch. Its requests to /api/ops carry
// `Origin: null`, which originOk refuses, and SameSite=Lax keeps the session cookie off them anyway. server.js keeps these
// responses out of withCsp, because the site's own policy would otherwise be added as report-only and fill the CSP log.
// The sandbox lives in this one constant and is never relaxed per file. allow-same-origin must NEVER be added here.
//
// Beyond the brief's list, three tokens that open nothing towards /ops, because real offers need them:
// - allow-popups-to-escape-sandbox: a link to another site in a new tab opens as a normal page, not a crippled sandboxed one.
//   The new tab's own origin differs from this page's opaque one, so this page cannot reach into it (a /f/ link gets its sandbox
//   again from this header).
// - allow-top-navigation-to-custom-protocols: mailto: and tel: buttons.
// - allow-modals: window.print() ("Salvează PDF") and alert().
//
// PDFs and raster pictures run no script against this origin and need no sandbox (browsers' PDF viewers have a history of refusing
// sandboxed documents), so they get a closed policy instead. The bytes go out as uploaded: `no-transform` stops Cloudflare's email obfuscation from rewriting
// mailto: links and from injecting its own scripts, which is also why we gzip here.
//
// THE PASSWORD (Daniel, 10 Nov: "in ops, acolo unde incarcam fisierele, sa putem pune si o parola"). Optional, per file.
// meta.json keeps only scrypt(salt, password); nobody can read a password back, /ops included. A locked link answers 401 with
// a small form of ours (no script, form-action 'self'); the right password sets an HttpOnly cookie that lives 12 hours, on the
// path /f/<id>/ alone, signed with the stored hash: a changed or removed password ends every open visit at once. The sandboxed
// page cannot read that cookie (opaque origin, HttpOnly). Guesses are counted per address and per file.
//
// Storage: <dataDir>/files/<id>/{meta.json, c-<rev>}. The name in the link never touches the disk: a request is matched against
// the id's meta.json, and anything else is the same 404. A new file appears by renaming a whole folder, a replacement by
// renaming meta.json onto the new revision, a delete by renaming the folder away: a reader sees the old file or the new one.
import { readFileSync, writeFileSync, renameSync, mkdirSync, statSync, readdirSync, createReadStream, rmSync, openSync, writeSync, closeSync, fsyncSync, fstatSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import { randomBytes, scrypt, timingSafeEqual, createHmac } from "node:crypto";
import { createGzip } from "node:zlib";

export const FILE_ID_RE = /^[a-f0-9]{16}$/;
export const FILE_SANDBOX = "sandbox allow-scripts allow-popups allow-popups-to-escape-sandbox allow-forms allow-downloads allow-modals allow-top-navigation-to-custom-protocols";
const CSP_SANDBOX = FILE_SANDBOX + "; frame-ancestors 'self'";
const CSP_CLOSED = "default-src 'none'; style-src 'unsafe-inline'; img-src 'self' data:; object-src 'self'; frame-ancestors 'self'; base-uri 'none'; form-action 'none'";

// what a file may be: decided by its bytes alone
const TYPES = {
  html: { mime: "text/html; charset=utf-8", kind: "html", label: "HTML", sandbox: true, gzip: true },
  svg: { mime: "image/svg+xml", kind: "image", label: "SVG", sandbox: true, gzip: true },
  pdf: { mime: "application/pdf", kind: "pdf", label: "PDF" },
  png: { mime: "image/png", kind: "image", label: "PNG" },
  jpg: { mime: "image/jpeg", kind: "image", label: "JPG" },
  webp: { mime: "image/webp", kind: "image", label: "WebP" },
  avif: { mime: "image/avif", kind: "image", label: "AVIF" },
  gif: { mime: "image/gif", kind: "image", label: "GIF" },
};
const HEAD_MAX = 64 * 1024;
const REFUSED = "Merg HTML, PDF și imagini (PNG, JPG, WebP, AVIF, GIF, SVG). Tipul se citește din fișier, nu din nume.";

/** a file's real type from its first bytes. `sniff` is ops.mjs's check of images, PDF and SVG; video is refused here on purpose */
export function fileType(head, sniff) {
  const asc = head.subarray(0, 6).toString("latin1");
  if (asc === "GIF87a" || asc === "GIF89a") return "gif";
  const known = sniff(head);
  if (known) return TYPES[known] ? known : null;
  const t = head.toString("utf8").replace(/^﻿/, "").replace(/^(?:\s|<!--[\s\S]*?-->)+/, "");
  return /^(?:<!doctype\s+html[\s>]|<(?:html|head|title|meta|style|body)[\s>])/i.test(t) ? "html" : null; // a browser reads a file that starts at <title> as HTML too (Daniel's Loniva deck)
}

/** the name in the link: ascii, no dots but the one before the extension, and that extension always follows the real type */
export function fileSlug(name, ext) {
  const base = String(name || "").replace(/^.*[\\/]/, "").replace(/\.[^.]*$/, "");
  const s = base.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80).replace(/-+$/, "");
  return (s || "fisier") + "." + ext;
}
const niceName = (name, slug) => String(name || "").replace(/^.*[\\/]/, "").replace(/[\u0000-\u001f\u007f‪-‮⁦-⁩]+/g, "").trim().slice(0, 140) || slug;

const PW_MIN = 4, PW_MAX = 200, PASS_TTL = 12 * 3600e3;
const PW_RULE = `Parola are între ${PW_MIN} și ${PW_MAX} de caractere.`;
const pwNorm = (v) => (typeof v === "string" ? v.normalize("NFKC").trim() : "");
const pwHash = (pw, salt) => new Promise((ok, no) => scrypt(pw, salt, 32, (e, k) => (e ? no(e) : ok(k))));
async function pwMake(pw) { const salt = randomBytes(16); return { salt: salt.toString("hex"), hash: (await pwHash(pw, salt)).toString("hex"), at: new Date().toISOString() }; }
const passSign = (meta, exp) => createHmac("sha256", Buffer.from(meta.pw.hash, "hex")).update(meta.id + "." + exp).digest("hex");
const GATE_CSP = "default-src 'none'; style-src 'unsafe-inline'; form-action 'self'; frame-ancestors 'self'; base-uri 'none'";
const GATE_MSG = { wrong: ["Parola nu e cea bună.", "That is not the password."], rate: ["Prea multe încercări. Mai încearcă peste un sfert de oră.", "Too many tries. Come back in fifteen minutes."] };
/** the form a locked link answers with. No script, no name of the file: whoever has only the link learns nothing but "locked" */
function gatePage(why) {
  const m = GATE_MSG[why];
  return `<!doctype html><html lang="ro"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex, nofollow, noarchive"><title>Fișier protejat · Cromatic Studios</title><style>
*{box-sizing:border-box}html{color-scheme:light dark}body{margin:0;min-height:100vh;min-height:100dvh;display:grid;place-items:center;padding:24px;background:#f4f1ea;color:#111;font:16px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif}
main{width:100%;max-width:400px;display:grid;gap:18px}h1{margin:0;font-size:30px;line-height:1.1;letter-spacing:-.02em}p{margin:0}.en{color:#5c5a55;font-size:14px}
label{display:grid;gap:8px;font-weight:600;font-size:14px}input{font:inherit;font-size:17px;padding:14px 16px;border:2px solid #111;border-radius:14px;background:#fff;color:#111;width:100%}
button{font:inherit;font-weight:700;font-size:16px;min-height:52px;border:2px solid #111;border-radius:999px;background:#ffd400;color:#111;cursor:pointer}button:hover{background:#111;color:#fff}
input:focus-visible,button:focus-visible{outline:3px solid #111;outline-offset:3px}.err{font-weight:700;color:#b3261a}.by{font-size:13px;color:#5c5a55}
@media (prefers-color-scheme:dark){body{background:#111;color:#f4f1ea}.en,.by{color:#a8a59e}input{border-color:#f4f1ea}button{border-color:#ffd400}button:hover{background:#f4f1ea;color:#111}input:focus-visible,button:focus-visible{outline-color:#ffd400}.err{color:#ff8a7a}}
</style></head><body><main><div><h1>Fișierul ăsta are parolă.</h1><p class="en">This file is locked with a password.</p></div>
${m ? `<p class="err" role="alert">${m[0]}<br><span class="en">${m[1]}</span></p>` : ""}<form method="post" autocomplete="off" style="display:grid;gap:14px"><label>Parola · Password<input type="password" name="p" required maxlength="${PW_MAX}" autofocus autocomplete="off" autocapitalize="none" spellcheck="false"></label><button type="submit">Deschide · Open</button></form>
<p class="by">Ai primit-o de la cine ți-a trimis linkul. · Cromatic Studios</p></main></body></html>`;
}

const NOT_FOUND = { "Content-Type": "text/plain; charset=utf-8", "X-Robots-Tag": "noindex, nofollow, noarchive", "Cache-Control": "private, no-store", "Referrer-Policy": "no-referrer", "X-Content-Type-Options": "nosniff" };

export function createFiles({ dataDir, sniff, fileMax, capBytes, usedElsewhere, appendLine, limiter, ipOf, secure = true, log = console }) {
  const ROOT = join(dataDir, "files");
  mkdirSync(ROOT, { recursive: true, mode: 0o700 });
  const statOr = (p) => { try { return statSync(p); } catch { return null; } };
  const dirOf = (id) => join(ROOT, id);
  const metaOf = (id) => { try { return JSON.parse(readFileSync(join(dirOf(id), "meta.json"), "utf8")); } catch { return null; } };
  const writeMeta = (dir, meta) => { const tmp = join(dir, "meta.json.tmp-" + process.pid); writeFileSync(tmp, JSON.stringify(meta, null, 2), { mode: 0o600 }); renameSync(tmp, join(dir, "meta.json")); };
  const dirSize = (d) => { let n = 0, list = []; try { list = readdirSync(d, { withFileTypes: true }); } catch { return 0; } for (const e of list) { const p = join(d, e.name); n += e.isDirectory() ? dirSize(p) : (statOr(p)?.size || 0); } return n; };
  const used = () => dirSize(ROOT);
  const ipTries = limiter(8, 15 * 60e3), idTries = limiter(60, 15 * 60e3); // a wrong guess costs a scrypt: one address gets 8 per file, a file 60 in all

  // what a crash or a dropped upload may leave behind (names that can never be an id), older than an hour
  function sweep() {
    let list = []; try { list = readdirSync(ROOT); } catch { return; }
    for (const n of list) { if (FILE_ID_RE.test(n)) continue; const p = join(ROOT, n), st = statOr(p); if (st && Date.now() - st.mtimeMs > 3600e3) rmSync(p, { recursive: true, force: true }); }
  }
  sweep();

  const pub = (m) => ({ id: m.id, name: m.name, slug: m.slug, url: "/f/" + m.id + "/" + m.slug, ext: m.ext, kind: TYPES[m.ext].kind, label: TYPES[m.ext].label, size: m.size, createdAt: m.createdAt, updatedAt: m.updatedAt, replaced: m.rev > 1, byName: m.byName, locked: !!m.pw });
  function list() {
    let names = []; try { names = readdirSync(ROOT); } catch {}
    return names.filter((n) => FILE_ID_RE.test(n)).map(metaOf).filter((m) => m && TYPES[m.ext]).sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)).map(pub);
  }
  const room = () => ({ used: usedElsewhere() + used(), cap: capBytes, fileMax });

  /** the request body, to a temp file in ROOT, without holding it in memory (the box has 1 GB, shared). Throws {status, ...} */
  async function receive(req, tmp) {
    const len = Number(req.headers["content-length"] || 0);
    if (len > fileMax) throw Object.assign(new Error("too large"), { status: 413, error: "too_large", message: `Fișierul e peste ${Math.round(fileMax / 1048576)} MB.` });
    const space = () => Object.assign(new Error("quota"), { status: 507, error: "quota", message: "S-a umplut spațiul pentru fișiere. Șterge ce nu mai trebuie sau spune-i lui Daniel." });
    const free = capBytes - usedElsewhere() - used();
    if (len > free) throw space();
    const fd = openSync(tmp, "wx", 0o600);
    let n = 0, head = [], headN = 0;
    try {
      for await (const c of req) {
        n += c.length;
        if (n > fileMax) throw Object.assign(new Error("too large"), { status: 413, error: "too_large", message: `Fișierul e peste ${Math.round(fileMax / 1048576)} MB.` });
        if (n > free) throw space();
        if (headN < HEAD_MAX) { head.push(c); headN += c.length; }
        for (let off = 0; off < c.length;) off += writeSync(fd, c, off);
      }
      fsyncSync(fd);
    } finally { closeSync(fd); }
    if (!n) throw Object.assign(new Error("empty"), { status: 422, error: "empty", message: "Fișierul e gol." });
    return { head: Buffer.concat(head).subarray(0, HEAD_MAX), size: n };
  }

  /** POST /api/ops/files: returns the JSON answer as [status, body] */
  async function create(req, s, rawName, rawPw) {
    const pw = pwNorm(rawPw);
    if (pw && (pw.length < PW_MIN || pw.length > PW_MAX)) return [422, { ok: false, error: "password", message: PW_RULE }];
    const id = randomBytes(8).toString("hex"), stage = join(ROOT, ".new-" + id);
    mkdirSync(stage, { mode: 0o700 });
    try {
      const { head, size } = await receive(req, join(stage, "c-1"));
      const ext = fileType(head, sniff);
      if (!ext) return [415, { ok: false, error: "type", message: REFUSED }];
      const slug = fileSlug(rawName, ext), now = new Date().toISOString();
      const meta = { id, rev: 1, name: niceName(rawName, slug), slug, ext, size, createdAt: now, updatedAt: now, by: s.email, byName: s.user.name, ...(pw ? { pw: await pwMake(pw) } : {}) };
      writeMeta(stage, meta); // locked from its first second: the link never answers without the password
      renameSync(stage, dirOf(id));
      appendLine("files.jsonl", { at: now, event: "add", id, by: s.email, name: meta.name, ext, size, ...(pw ? { locked: true } : {}) });
      return [200, { ok: true, file: pub(meta), room: room() }];
    } finally { rmSync(stage, { recursive: true, force: true }); }
  }

  /** POST /api/ops/files/<id>: the same id and link. The kind stays (a .pdf link does not turn into a web page) */
  async function replace(req, s, id, rawName) {
    const old = metaOf(id);
    if (!old || !TYPES[old.ext]) return [404, { ok: false, error: "not_found", message: "Fișierul nu mai e aici." }];
    const rev = old.rev + 1, dir = dirOf(id), part = join(dir, "c-" + rev + ".tmp-" + randomBytes(4).toString("hex"));
    try {
      const { head, size } = await receive(req, part);
      const ext = fileType(head, sniff);
      if (!ext) return [415, { ok: false, error: "type", message: REFUSED }];
      if (TYPES[ext].kind !== TYPES[old.ext].kind) return [409, { ok: false, error: "kind", message: `Linkul ăsta e pentru ${TYPES[old.ext].kind === "image" ? "o imagine" : "un " + TYPES[old.ext].label}. Înlocuiește-l cu același tip sau adaugă fișierul ca nou.` }];
      renameSync(part, join(dir, "c-" + rev));
      const now = new Date().toISOString(), cur = metaOf(id) || old; // a password set while the bytes were coming in stays
      const meta = { ...old, rev, ext, size, name: niceName(rawName, old.slug), updatedAt: now, replacedBy: s.email };
      if (cur.pw) meta.pw = cur.pw; else delete meta.pw;
      writeMeta(dir, meta);
      try { unlinkSync(join(dir, "c-" + old.rev)); } catch {}
      appendLine("files.jsonl", { at: now, event: "replace", id, by: s.email, name: meta.name, ext, size, rev });
      return [200, { ok: true, file: pub(meta), room: room() }];
    } finally { rmSync(part, { force: true }); }
  }

  function remove(s, id) {
    const m = metaOf(id);
    if (!m) return [404, { ok: false, error: "not_found", message: "Fișierul nu mai e aici." }];
    const gone = join(ROOT, ".del-" + id + "-" + randomBytes(3).toString("hex"));
    renameSync(dirOf(id), gone); // the link is dead from here on, whatever the rm below does
    rmSync(gone, { recursive: true, force: true });
    appendLine("files.jsonl", { at: new Date().toISOString(), event: "delete", id, by: s.email, name: m.name, ext: m.ext, size: m.size });
    return [200, { ok: true, room: room() }];
  }

  /** POST /api/ops/files/<id>/password: "" takes the password off. The date of the file stays: nothing about its content changed */
  async function setPassword(s, id, raw) {
    const pw = pwNorm(raw);
    if (pw && (pw.length < PW_MIN || pw.length > PW_MAX)) return [422, { ok: false, error: "password", message: PW_RULE }];
    if (!metaOf(id)) return [404, { ok: false, error: "not_found", message: "Fișierul nu mai e aici." }];
    const made = pw ? await pwMake(pw) : null, m = metaOf(id); // read again after the hash: a replace may have landed meanwhile
    if (!m || !TYPES[m.ext]) return [404, { ok: false, error: "not_found", message: "Fișierul nu mai e aici." }];
    const had = !!m.pw;
    if (made) m.pw = made; else delete m.pw;
    if (made || had) {
      writeMeta(dirOf(id), m);
      appendLine("files.jsonl", { at: new Date().toISOString(), event: made ? (had ? "password-change" : "password-set") : "password-off", id, by: s.email, name: m.name });
    }
    return [200, { ok: true, file: pub(m) }];
  }

  // ---------- a locked link ----------
  const passName = (id) => "fk_" + id;
  function hasPass(req, meta) {
    const c = new RegExp("(?:^|;\\s*)" + passName(meta.id) + "=([0-9a-z]{1,12})\\.([a-f0-9]{64})(?:;|$)").exec(String(req.headers.cookie || ""));
    if (!c) return false;
    const exp = parseInt(c[1], 36);
    if (!(exp > Date.now()) || exp > Date.now() + PASS_TTL + 60e3) return false;
    return timingSafeEqual(Buffer.from(c[2], "hex"), Buffer.from(passSign(meta, c[1]), "hex"));
  }
  const gateHeaders = (extra) => ({ ...NOT_FOUND, "Content-Type": "text/html; charset=utf-8", "Content-Security-Policy": GATE_CSP, "X-Frame-Options": "SAMEORIGIN", "Strict-Transport-Security": "max-age=31536000", ...(extra || {}) });
  function gate(req, res, code, why) {
    const html = req.method === "HEAD" ? "" : gatePage(why);
    res.writeHead(code, gateHeaders(req.method === "HEAD" ? null : { "Content-Length": Buffer.byteLength(html) }));
    res.end(html || undefined);
  }
  async function unlock(req, res, meta) {
    const here = "/f/" + meta.id + "/" + meta.slug;
    if (ipTries(ipOf(req) + " " + meta.id) || idTries(meta.id)) { res.once("finish", () => req.destroy()); return gate(req, res, 429, "rate"); }
    let n = 0; const chunks = [];
    for await (const c of req) { n += c.length; if (n > 4096) { res.once("finish", () => req.destroy()); return gate(req, res, 401, "wrong"); } chunks.push(c); }
    const pw = pwNorm(new URLSearchParams(Buffer.concat(chunks).toString("utf8")).get("p") || "").slice(0, PW_MAX);
    const now = metaOf(meta.id); // the password may have changed while the form was open
    if (!now || !now.pw) { res.writeHead(303, { ...NOT_FOUND, Location: here }); return res.end(); }
    const ok = !!pw && timingSafeEqual(await pwHash(pw, Buffer.from(now.pw.salt, "hex")), Buffer.from(now.pw.hash, "hex"));
    if (!ok) return gate(req, res, 401, "wrong");
    const exp = (Date.now() + PASS_TTL).toString(36);
    res.writeHead(303, { ...NOT_FOUND, Location: here, "Set-Cookie": `${passName(meta.id)}=${exp}.${passSign(now, exp)}; Path=/f/${meta.id}/; Max-Age=${PASS_TTL / 1000}; HttpOnly; SameSite=Lax${secure ? "; Secure" : ""}` });
    res.end();
  }

  /** GET /f/<id>/<name>: one and the same 404 for anything that is not exactly a file's link; a folder is never listed */
  function serve(req, res) {
    const miss = () => { res.writeHead(404, NOT_FOUND); res.end(req.method === "HEAD" ? undefined : "Not found"); };
    const post = req.method === "POST";
    if (req.method !== "GET" && req.method !== "HEAD" && !post) { res.writeHead(405, { ...NOT_FOUND, Allow: "GET, HEAD" }); return res.end(); }
    const m = /^\/f\/([^/?#]+)\/([^/?#]+)(?:\?.*)?$/.exec(req.url);
    if (!m || !FILE_ID_RE.test(m[1])) return miss();
    let meta = metaOf(m[1]);
    if (!meta || meta.slug !== m[2] || !TYPES[meta.ext]) return miss();
    if (meta.pw && !hasPass(req, meta)) {
      if (post) return void unlock(req, res, meta).catch((e) => { log.error?.("files unlock", e?.message); res.destroy(); });
      return gate(req, res, 401);
    }
    if (post) { res.writeHead(meta.pw ? 303 : 405, meta.pw ? { ...NOT_FOUND, Location: "/f/" + meta.id + "/" + meta.slug } : { ...NOT_FOUND, Allow: "GET, HEAD" }); return res.end(); }
    let fd = -1;
    try { fd = openSync(join(dirOf(m[1]), "c-" + meta.rev), "r"); }
    catch { meta = metaOf(m[1]); try { if (meta) fd = openSync(join(dirOf(m[1]), "c-" + meta.rev), "r"); } catch {} } // replaced between the two reads
    if (fd < 0) return miss();
    const T = TYPES[meta.ext], size = fstatSync(fd).size;
    const headers = {
      "Content-Type": T.mime, "X-Content-Type-Options": "nosniff", "X-Robots-Tag": "noindex, nofollow, noarchive",
      "Cache-Control": "private, no-store, no-transform", "Referrer-Policy": "no-referrer", "X-Frame-Options": "SAMEORIGIN",
      "Strict-Transport-Security": "max-age=31536000", "Permissions-Policy": "camera=(), microphone=(), geolocation=(), payment=(), usb=()",
      "Content-Security-Policy": T.sandbox ? CSP_SANDBOX : CSP_CLOSED, "Content-Disposition": `inline; filename="${meta.slug}"`,
    };
    const drop = () => { try { closeSync(fd); } catch {} };
    if (req.method === "HEAD") { drop(); res.writeHead(200, { ...headers, "Content-Length": size, ...(T.gzip ? { Vary: "Accept-Encoding" } : { "Accept-Ranges": "bytes" }) }); return res.end(); }
    const fail = () => res.destroy();
    if (T.gzip) {
      headers.Vary = "Accept-Encoding";
      if (/\bgzip\b/.test(String(req.headers["accept-encoding"] || "")) && size > 1024) {
        res.writeHead(200, { ...headers, "Content-Encoding": "gzip" });
        createReadStream("", { fd }).on("error", fail).pipe(createGzip({ level: 6 })).on("error", fail).pipe(res);
        return;
      }
      res.writeHead(200, { ...headers, "Content-Length": size });
      createReadStream("", { fd }).on("error", fail).pipe(res);
      return;
    }
    headers["Accept-Ranges"] = "bytes"; // a PDF viewer asks for pieces
    let start = 0, end = size - 1, code = 200;
    const rg = req.headers.range && /^bytes=(\d*)-(\d*)$/.exec(req.headers.range);
    if (rg && (rg[1] || rg[2])) {
      start = rg[1] ? Number(rg[1]) : Math.max(0, size - Number(rg[2])); end = rg[1] && rg[2] ? Math.min(Number(rg[2]), size - 1) : size - 1;
      if (start >= size || start > end) { drop(); res.writeHead(416, { ...NOT_FOUND, "Content-Range": `bytes */${size}` }); return res.end(); }
      code = 206; headers["Content-Range"] = `bytes ${start}-${end}/${size}`;
    }
    res.writeHead(code, { ...headers, "Content-Length": end - start + 1 });
    createReadStream("", { fd, start, end }).on("error", fail).pipe(res);
  }

  return { list, room, create, replace, remove, setPassword, serve, used };
}
