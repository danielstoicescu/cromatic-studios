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
//   POST /api/core30/admin/sessions          (admin key) a new client session from an email: id, token, onboarding mail
//   GET  /api/core30/admin/sessions          (admin key) the sessions created that way
//
// Sessions created by the admin route live in <data>/_sessions/<id>.json, not in the repo: no deploy per client.
// Each one points at a repo edition (default "blank") and is served as a custom edition of it, with its own token.
//
// Public editions (config access.public, e.g. The Core Lite at /thecore30/lite): no token, many visitors on one link.
// Each visitor gets its own folder <data>/<id>/r/<visitor>/, leads are appended to <data>/<id>/leads.jsonl,
// /status returns counts only (never an email), requests are rate-limited per IP, and the mails go out on submit:
// the lead with its result to the studio, the summary to the visitor.
//
// Nothing is ever lost on the way: latest.json is the newest state, history/ keeps one snapshot per hour
// (the last write of that hour), submits are append-only and never overwritten. Emails go to the studio
// at the start (token editions, once) and on every submit, with the full JSON attached.

import { mkdir, readFile, rename, writeFile, readdir, appendFile } from "node:fs/promises";
import { existsSync, createReadStream, statSync } from "node:fs";
import { join, extname, normalize } from "node:path";
import { randomBytes, timingSafeEqual } from "node:crypto";

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
const visitorOf = (p) => String(p.device ?? p.session?.device ?? "").replace(/[^a-z0-9-]/gi, "").slice(0, 64);
// one queue per edition: every write to a client's files (meta.json, the log, leads.jsonl) happens in order.
// Writes are a few milliseconds each, so public visitors sharing the queue never notice.
const lockKey = (body) => { try { return String(JSON.parse(body).clientId ?? "").replace(/[^a-z0-9_-]/gi, "").slice(0, 64); } catch { return ""; } };
const PUBLIC_MAX = 2 * 1024 * 1024; // a public edition has no reference images

// a gentle rate limit for public editions: per IP, a rolling 10-minute window
const hits = new Map();
function limited(req, max = 300) {
  const ip = String(req.headers["cf-connecting-ip"] || req.headers["x-forwarded-for"] || req.socket?.remoteAddress || "").split(",")[0].trim();
  const now = Date.now();
  const h = hits.get(ip);
  if (!h || now - h.t > 600000) { hits.set(ip, { t: now, n: 1 }); if (hits.size > 5000) hits.clear(); return false; }
  h.n += 1;
  return h.n > max;
}
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
 * @param {string} [o.adminKey]  unlocks GET …/latest for the workshop and the /admin routes
 * @param {string} [o.publicBase] the site's origin for the links in onboarding mails
 */
export function createCore30({ dataDir, distDir, configDir, registry, transport, mailTo, mailFrom, adminKey, publicBase = "https://cromaticstudios.com" }) {
  const sessionsDir = join(dataDir, "_sessions");
  const isAdmin = (req, url) => {
    const given = String(req.headers.authorization ?? "").replace(/^Bearer\s+/i, "") || url.searchParams.get("key") || "";
    if (!adminKey || !given) return false;
    const a = Buffer.from(given), b = Buffer.from(adminKey);
    return a.length === b.length && timingSafeEqual(a, b);
  };
  // who may write where: every config on disk, plus the optional registry's overrides
  const clients = async () => {
    const out = {};
    const all = existsSync(configDir) ? (await readdir(configDir)).filter((f) => f.endsWith(".json")) : [];
    // <id>.json is the edition (Romanian); <id>.en.json its English version, served on ?lang=en
    const files = all.filter((f) => !/\.[a-z]{2}\.json$/.test(f));
    for (const f of files) {
      try {
        const c = JSON.parse(await readFile(join(configDir, f), "utf8"));
        const langs = ["ro", ...all.filter((g) => g.startsWith(`${c.id}.`) && /\.[a-z]{2}\.json$/.test(g)).map((g) => g.slice(c.id.length + 1, -5))];
        out[c.id] = { langs, token: c.access?.token ?? "", emailMode: c.access?.email === "optional" ? "optional" : "required", public: !!c.access?.public, cta: c.lite?.cta ?? "", title: c.title ?? "The Core 3.0", name: c.client?.name, contact: c.client?.contact, email: c.client?.email ?? "", file: join(configDir, f) };
      } catch (e) { console.error("[core30] bad config", f, e.message); }
    }
    if (registry) { try { const r = JSON.parse(await readFile(registry, "utf8")); for (const [id, x] of Object.entries(r)) out[id] = { ...(out[id] ?? {}), ...x }; } catch { /* no registry */ } }
    // sessions created from the dashboard: a repo edition underneath, their own id, token and contact
    const dyn = existsSync(sessionsDir) ? (await readdir(sessionsDir)).filter((f) => f.endsWith(".json")) : [];
    for (const f of dyn) {
      try {
        const x = JSON.parse(await readFile(join(sessionsDir, f), "utf8"));
        const base = out[x.edition];
        if (!base?.file || out[x.id]) continue; // a repo edition always wins its own id
        out[x.id] = { ...base, token: x.token, emailMode: "required", public: false, name: x.name || x.email, contact: x.contact || x.name || "", email: x.email, dynamic: x };
      } catch (e) { console.error("[core30] bad session", f, e.message); }
    }
    return out;
  };

  async function mail(subject, html, attachments) {
    if (!transport) { console.log(`[core30] mail (not sent, no SMTP): ${subject}`); return; }
    try { await transport.sendMail({ from: mailFrom, to: mailTo, subject, html, attachments }); }
    catch (e) { console.error("[core30] mail failed", e.message); } // the files are already on disk
  }

  /** where a respondent's files live: the edition folder, or the visitor's own folder on a public edition */
  function dirFor(c, id, p) {
    if (!c.public) return join(dataDir, id);
    const v = visitorOf(p);
    return v ? join(dataDir, id, "r", v) : null;
  }
  const leadLog = (id, entry) => appendFile(join(dataDir, id, "leads.jsonl"), JSON.stringify(entry) + "\n");

  async function store(kind, body) {
    let p;
    try { p = JSON.parse(body); } catch { return [400, { ok: false, error: "json" }]; }
    const reg = await clients();
    const id = safe(p.clientId);
    const c = reg[id];
    if (!c) return [404, { ok: false, error: "client" }];
    if (c.token && p.token !== c.token) return [403, { ok: false, error: "token" }];
    if (c.public && body.length > PUBLIC_MAX) return [413, { ok: false, error: "size" }];
    const dir = dirFor(c, id, p);
    if (!dir) return [400, { ok: false, error: "visitor" }];
    await mkdir(join(dir, "history"), { recursive: true });
    await mkdir(join(dir, "submits"), { recursive: true });
    const now = new Date().toISOString();
    const record = JSON.stringify({ receivedAt: now, kind, ...p }, null, 1);

    await atomicWrite(join(dir, "latest.json"), record);
    // one copy per browser too: a second device never overwrites what the first one sent
    const dev = visitorOf(p);
    if (dev && !c.public) { await mkdir(join(dir, "devices"), { recursive: true }); await atomicWrite(join(dir, "devices", `${dev}.json`), record); }
    // counters for /status: no answer content, ever
    const meta = await readMeta(dir);
    meta.firstDraftAt ??= now;
    meta.lastSaveAt = now;
    meta.saves = (meta.saves ?? 0) + 1;
    if (kind === "submit") { meta.submits = (meta.submits ?? 0) + 1; meta.lastSubmitAt = now; }
    await atomicWrite(join(dir, "meta.json"), JSON.stringify(meta));
    await atomicWrite(join(dir, "history", `${now.slice(0, 13)}.json`), record); // one per hour
    if (kind === "submit" && c.public) {
      await appendLog(dir, { at: now, type: "submit" });
      await writeFile(join(dir, "submits", `submit-${stamp()}.json`), record, { flag: "wx" });
      await liteMails(c, id, p, now);
    } else if (kind === "submit") {
      await appendLog(dir, { at: now, type: "submit" });
      const file = `submit-${stamp()}.json`;
      await writeFile(join(dir, "submits", file), record, { flag: "wx" }); // never overwrite
      const r = p.export?.readable ?? {};
      const rows = Object.values(r).filter((x) => x.answer).map((x) => `<tr><td style="padding:6px 10px;color:#5d5a52;font:12px monospace;vertical-align:top">${esc(x.module)}</td><td style="padding:6px 10px"><b>${esc(x.question)}</b><br>${esc(x.answer)}</td></tr>`).join("");
      await mail(`[The Core 3.0] ${c.name ?? id} a trimis`, `<p><b>${esc(c.contact ?? "")}</b> a trimis The Core 3.0 pentru <b>${esc(c.name ?? id)}</b>. JSON-ul complet e atașat; se încarcă direct în modul workshop.</p><table style="border-collapse:collapse;font:14px sans-serif">${rows}</table>`,
        [{ filename: `the-core-3_${id}_${now.slice(0, 10)}.json`, content: JSON.stringify(p.export ?? p, null, 2) }]);
      const to = c.email || p.export?.respondent?.email || "";
      if (EMAIL.test(to)) {
        const en = p.export?.lang === "en";
        const subject = en ? "We've got your The Core 3.0" : "Am primit The Core 3.0";
        const html = en
          ? `<p>Hi${c.contact ? ` ${esc(c.contact)}` : ""}. We've got everything you filled in. We'll read it carefully and see you at the studio, over a coffee, for the workshop.</p><p>Cromatic Studios · Str. Olari 9, Bucharest</p>`
          : `<p>Salut${c.contact ? `, ${esc(c.contact)}` : ""}. Am primit tot ce ai completat. Citim cu atenție și ne vedem în studio, la o cafea, pentru workshop.</p><p>Cromatic Studios · Str. Olari 9, București</p>`;
        try { await transport?.sendMail({ from: mailFrom, to, replyTo: mailTo, subject, html }); } catch (e) { console.error("[core30] confirm failed", e.message); }
      }
    }
    return [200, { ok: true, at: now }];
  }

  /** public edition, on submit: the lead (with its result) to the studio, the summary to the visitor */
  async function liteMails(c, id, p, now) {
    const x = p.export ?? {};
    const email = String(x.respondent?.email ?? "").trim().toLowerCase();
    const arch = x.derived?.archetype ?? {};
    const title = arch.title ?? "";
    const summary = arch.summary ?? "";
    const positioning = x.derived?.uvp?.sentence || x.derived?.positioning || "";
    const xfactor = String(x.derived?.uvp?.xfactor || x.derived?.uvp?.parts?.xfactor || "").trim().slice(0, 200);
    const en = x.lang === "en";
    const brand = String(x.respondent?.brand || x.derived?.uvp?.parts?.brand || "").trim().slice(0, 80);
    const att = x.attribution ?? {};
    const src = att.src || att.utm_source || "";
    await leadLog(id, { at: now, type: "submit", visitor: visitorOf(p), email, lang: x.lang ?? "ro", contactOk: !!x.respondent?.contactOk, brand, archetype: title, positioning, xfactor, ...att });
    const attRows = Object.entries(att).map(([k, v]) => `${esc(k)}=${esc(v)}`).join(" · ");
    await mail(`[${c.title}] lead nou · ${brand ? `${brand} · ` : ""}${email || "fără email"} · ${title}${src ? ` · ${src}` : ""}`,
      `<p><b>${esc(email)}</b> a terminat ${esc(c.title)}${brand ? ` pentru <b>${esc(brand)}</b>` : ""}.${x.respondent?.contactOk ? " <b>Vrea să fie contactat.</b>" : " Nu a bifat contactul."}</p>
       <p><b>Arhetip:</b> ${esc(title)}<br>${esc(summary)}</p><p><b>UVP:</b> ${esc(positioning)}${xfactor ? `<br><b>X-factor:</b> ${esc(xfactor)}` : ""}</p>
       <p style="color:#5d5a52;font:12px monospace">${attRows || "fără sursă"}</p>`,
      [{ filename: `the-core-lite_${now.slice(0, 10)}_${visitorOf(p).slice(0, 8)}.json`, content: JSON.stringify(x, null, 2) }]);
    if (!EMAIL.test(email) || !transport) return;
    const cta = c.cta || "https://cromaticstudios.com/site/#contact";
    const html = `<div style="font:16px/1.55 Arial,sans-serif;color:#0d0c09;max-width:560px">
      <p style="margin:0 0 6px"><span style="display:inline-block;background:#E8E6E0;border-radius:999px;padding:7px 16px 9px;font:900 20px/1 Arial,sans-serif;letter-spacing:-.02em;color:#0d0c09">The Core<sup style="font:800 11px/1 Arial,sans-serif;color:#6b665c;margin-left:3px;letter-spacing:0">lite</sup></span></p>
      <p style="font:700 11px monospace;letter-spacing:.12em;text-transform:uppercase;color:#5d5a52">Cromatic Studios</p>
      <h1 style="font:900 26px/1.2 Arial,sans-serif;margin:8px 0 14px">${esc(title || (en ? "Your result" : "Rezultatul tău"))}</h1>
      <p>${esc(summary)}</p>
      ${positioning ? `<p style="padding:14px 16px;border:1px solid #0d0c09;border-radius:14px;background:#fff6c7"><b>${en ? "Your UVP" : "UVP-ul tău"}</b><br>${esc(positioning)}${xfactor ? `<br><br><b>X-factor:</b> ${esc(xfactor)}` : ""}</p>` : ""}
      <p><b>${en ? "Want more?" : "Vrei mai mult?"}</b> ${en ? "The full Core goes through people, values, voice and visual direction, then we write it together in a workshop at the studio, over a coffee." : "The Core complet trece prin oameni, valori, voce și direcție vizuală, apoi îl scriem împreună la un workshop în studio, la o cafea."}</p>
      <p><a href="${esc(cta)}" style="display:inline-block;padding:12px 20px;border:1px solid #0d0c09;border-radius:999px;background:#FED012;color:#0d0c09;font-weight:700;text-decoration:none">${en ? "Let's grab a coffee" : "Hai la o cafea"}</a></p>
      <p style="color:#5d5a52;font-size:13px">${en ? `You're getting this email because you asked for your ${esc(c.title)} result on cromaticstudios.com. Cromatic Studios · Str. Olari 9, Bucharest · hi@cromaticstudios.com` : `Ai primit acest email pentru că ai cerut rezultatul ${esc(c.title)} pe cromaticstudios.com. Cromatic Studios · Str. Olari 9, București · hi@cromaticstudios.com`}</p></div>`;
    try { await transport.sendMail({ from: mailFrom, to: email, replyTo: mailTo, subject: `${c.title}: ${title || (en ? "your result" : "rezultatul tău")}`, html }); }
    catch (e) { console.error("[core30] lite summary mail failed", e.message); }
  }

  async function config(id, t, want) {
    const c = (await clients())[safe(id)];
    if (!c?.file) return [404, { ok: false }];
    if (c.token && t !== c.token) return [403, { ok: false }];
    // the language: ?lang= if this edition has it, else an admin session's preset, else Romanian
    const lang = [want, c.dynamic?.lang, "ro"].find((l) => l && c.langs.includes(l));
    const file = lang === "ro" ? c.file : c.file.replace(/\.json$/, `.${lang}.json`);
    const cfg = { ...JSON.parse(await readFile(file, "utf8")), lang, langs: c.langs };
    if (!c.dynamic) return [200, cfg];
    const x = c.dynamic;
    return [200, {
      ...cfg, id: x.id, version: `${cfg.version}+${x.createdAt.slice(0, 10)}`,
      edition: { kind: "custom", basedOn: cfg.version, note: "created from the Cromatic Ops dashboard" },
      client: { ...cfg.client, name: x.name || cfg.client?.name || (lang === "en" ? "your brand" : "brandul tău"), contact: x.contact || "", email: x.email },
      access: { token: x.token, email: "required" },
      intro: { ...cfg.intro, hello: x.contact ? (lang === "en" ? `Hi ${x.contact}.` : `Salut, ${x.contact}.`) : cfg.intro?.hello },
    }];
  }

  // ---- sessions created from the dashboard ----
  const slugify = (s) => String(s ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
  const FREE_MAIL = /^(gmail|yahoo|ymail|outlook|hotmail|live|icloud|me|proton|protonmail|gmx|aol|mail|yandex)\./i;
  async function createSession(body) {
    let p;
    try { p = JSON.parse(body); } catch { return [400, { ok: false, error: "json" }]; }
    const email = String(p.email ?? "").trim().toLowerCase();
    if (!EMAIL.test(email) || email.length > 200) return [422, { ok: false, error: "email" }];
    const name = String(p.name ?? "").trim().slice(0, 80);
    const contact = String(p.contact ?? "").trim().slice(0, 60);
    const lang = p.lang === "en" ? "en" : "ro";
    const reg = await clients();
    const edition = safe(p.edition || "blank");
    const base = reg[edition];
    if (!base?.file || base.dynamic || base.public) return [422, { ok: false, error: "edition" }];
    // the id: from the name, else the email's domain (or its local part for free mail), unique against everything
    const [local, domain] = email.split("@");
    const root = slugify(name) || slugify(FREE_MAIL.test(domain) ? local : domain.split(".").slice(0, -1).join("-")) || "client";
    let id = root, n = 1;
    while (reg[id] || existsSync(join(dataDir, id)) || existsSync(join(sessionsDir, `${id}.json`)) || id.startsWith("_")) id = `${root}-${++n}`;
    const token = randomBytes(12).toString("base64url");
    const now = new Date().toISOString();
    const rec = { id, token, email, name, contact, edition, lang, createdAt: now };
    await mkdir(sessionsDir, { recursive: true });
    await writeFile(join(sessionsDir, `${id}.json`), JSON.stringify(rec, null, 1), { flag: "wx" });
    const url = `${publicBase.replace(/\/$/, "")}/thecore30/${id}?t=${token}`;
    const mailSent = await onboardingMail(rec, url);
    return [200, { ok: true, id, url, token, edition, lang, mailSent }];
  }

  async function onboardingMail(x, url) {
    if (!transport) { console.log(`[core30] onboarding mail (not sent, no SMTP) to ${x.email}: ${url}`); return false; }
    const hi = x.contact ? (x.lang === "en" ? `Hi ${esc(x.contact)},` : `Salut, ${esc(x.contact)},`) : x.lang === "en" ? "Hi," : "Salut,";
    const T = x.lang === "en" ? {
      subject: "The Core: let's start your brand strategy",
      body: `<p>${hi}</p><p>This is the first step of The Core, the way Cromatic Studios writes a brand strategy. You answer on your own, at your pace: about 45 to 60 minutes, in two or three sittings if you like. Then we meet at the studio, over a coffee, for a 90-minute workshop and turn your answers into the strategy.</p><p>Everything saves as you go, on your device and with us. Close it whenever you want and open the same link to pick up where you left off. The questions are in English; you can switch to Romanian at the start.</p>`,
      cta: "Start The Core", foot: "Keep this link to yourself: it opens your answers. Questions? Just reply to this email.",
    } : {
      subject: "The Core: hai să începem strategia brandului tău",
      body: `<p>${hi}</p><p>Ăsta e primul pas din The Core, felul în care Cromatic Studios scrie strategia unui brand. Răspunzi singur, în ritmul tău: cam 45–60 de minute, în două sau trei reprize dacă vrei. Apoi ne vedem în studio, la o cafea, pentru un workshop de 90 de minute și transformăm răspunsurile în strategie.</p><p>Totul se salvează pe parcurs, pe dispozitivul tău și la noi. Poți închide oricând și reiei de unde ai rămas, de pe același link.</p>`,
      cta: "Începe The Core", foot: "Păstrează linkul pentru tine: el îți deschide răspunsurile. Întrebări? Răspunde direct la emailul ăsta.",
    };
    const html = `<div style="font:16px/1.55 Arial,sans-serif;color:#0d0c09;max-width:560px">
      <p style="font:700 11px monospace;letter-spacing:.12em;text-transform:uppercase;color:#5d5a52">Cromatic Studios · The Core 3.0${x.name ? ` · ${esc(x.name)}` : ""}</p>
      ${T.body}
      <p><a href="${esc(url)}" style="display:inline-block;padding:12px 20px;border:1px solid #0d0c09;border-radius:999px;background:#FED012;color:#0d0c09;font-weight:700;text-decoration:none">${T.cta}</a></p>
      <p style="font-size:13px;color:#5d5a52;word-break:break-all">${esc(url)}</p>
      <p style="color:#5d5a52;font-size:13px">${T.foot}<br>Cromatic Studios · Str. Olari 9, București · hi@cromaticstudios.com</p></div>`;
    try {
      await transport.sendMail({ from: mailFrom, to: x.email, bcc: mailTo, replyTo: mailTo, subject: T.subject, html });
      return true;
    } catch (e) { console.error("[core30] onboarding mail failed", e.message); return false; }
  }

  async function listSessions() {
    const files = existsSync(sessionsDir) ? (await readdir(sessionsDir)).filter((f) => f.endsWith(".json")) : [];
    const out = [];
    for (const f of files) { try { const x = JSON.parse(await readFile(join(sessionsDir, f), "utf8")); out.push({ id: x.id, email: x.email, name: x.name, edition: x.edition, lang: x.lang, createdAt: x.createdAt, url: `${publicBase.replace(/\/$/, "")}/thecore30/${x.id}?t=${x.token}` }); } catch { /* skip */ } }
    return [200, { ok: true, sessions: out.sort((a, b) => a.createdAt.localeCompare(b.createdAt)) }];
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
    const dir = dirFor(c, id, p);
    if (!dir) return [400, { ok: false, error: "visitor" }];
    await mkdir(dir, { recursive: true });
    const now = new Date().toISOString();
    if (c.public) {
      // a lead: logged, no mail (the studio gets one mail per finished result)
      const att = typeof p.attribution === "object" && p.attribution ? Object.fromEntries(Object.entries(p.attribution).slice(0, 8).map(([k, v]) => [safe(k), String(v).slice(0, 120)])) : {};
      await leadLog(id, { at: now, type: "start", visitor: visitorOf(p), email, contactOk: !!p.contactOk, ...att });
      await appendLog(dir, { at: now, type: "start" });
      return [200, { ok: true, at: now }];
    }
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
    const dir = dirFor(c, safe(p.clientId), p);
    if (!dir) return [400, { ok: false, error: "visitor" }];
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
    if (c.public) {
      // public: counts only, never an email or an answer
      let leads = [];
      try { leads = (await readFile(join(dataDir, safe(id), "leads.jsonl"), "utf8")).split("\n").filter(Boolean).map((l) => { try { return JSON.parse(l); } catch { return null; } }).filter(Boolean); } catch { /* none yet */ }
      const day = Date.now() - 86400000;
      const by = (t) => leads.filter((l) => l.type === t);
      const sources = {};
      for (const l of by("start")) { const k = l.src || l.utm_source || "direct"; sources[k] = (sources[k] ?? 0) + 1; }
      return [200, { ok: true, id: safe(id), public: true, starts: by("start").length, submits: by("submit").length,
        last24h: { starts: by("start").filter((l) => Date.parse(l.at) > day).length, submits: by("submit").filter((l) => Date.parse(l.at) > day).length },
        lastStartAt: by("start").at(-1)?.at ?? null, lastSubmitAt: by("submit").at(-1)?.at ?? null, sources }];
    }
    const dir = join(dataDir, safe(id));
    const m = existsSync(dir) ? await readMeta(dir) : {};
    const mods = c.file ? JSON.parse(await readFile(c.file, "utf8")).modules ?? [] : [];
    const total = mods.length;
    // which modules have answers in the latest copy (titles only): a module skipped and then answered is partial,
    // a module with answers but not every required item is partial too; the step log alone only knows "complete"
    let answeredIds = new Set(), skippedIds = [];
    try {
      const latest = JSON.parse(await readFile(join(dir, "latest.json"), "utf8"));
      const ans = latest.session?.answers ?? latest.export?.answers ?? {};
      for (const md of mods) if (md.items?.some((it) => ans[it.id] != null)) answeredIds.add(md.id);
      skippedIds = latest.session?.skipped ?? [];
    } catch { /* no copy yet */ }
    // the card's back: hours and titles only, never answers
    const log = (await readLog(dir)).map((e) => ({
      at: e.at, type: e.type,
      ...(e.module ? { module: e.module.id, title: e.module.title, n: e.module.n, total: e.module.total } : {}),
      ...(e.format ? { format: e.format } : {}),
      ...(e.type === "save-error" ? { code: e.code, bytes: e.bytes, ua: e.ua } : {}),
      ...(e.type === "start" && e.email ? { email: e.email } : {}),
    }));
    const doneIds = new Set(log.filter((e) => e.type === "step").map((e) => e.module));
    const titleOf = (mid) => mods.find((x) => x.id === mid)?.short ?? mid;
    const partial = mods.filter((x) => answeredIds.has(x.id) && !doneIds.has(x.id)).map((x) => x.short);
    const skippedOnly = mods.filter((x) => skippedIds.includes(x.id) && !answeredIds.has(x.id)).map((x) => titleOf(x.id));
    const lastStep = [...log].reverse().find((e) => e.type === "step" || e.type === "skip") ?? null;
    return [200, {
      ok: true, id: safe(id),
      started: !!(m.startedAt || m.firstDraftAt),
      startedAt: m.startedAt ?? null, startedBy: m.startedBy ?? null,
      firstDraftAt: m.firstDraftAt ?? null, lastSaveAt: m.lastSaveAt ?? null, saves: m.saves ?? 0,
      submits: m.submits ?? 0, lastSubmitAt: m.lastSubmitAt ?? null,
      progress: { done: doneIds.size, answered: new Set([...doneIds, ...answeredIds]).size, total, partial, skipped: skippedOnly }, lastStep, log,
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

  // the build the site serves now (its index-<hash>.js); draft and event replies carry it, so a tab left open across
  // a deploy notices it runs old code and asks for a reload (tabs from before r290 ignore the field)
  // re-read only when index.html changes, so a deploy is seen at once, with or without a restart
  let built = { mtime: -1, id: "" };
  async function build() {
    const file = join(distDir, "index.html");
    let mtime = 0;
    try { mtime = statSync(file).mtimeMs; } catch { return ""; }
    if (mtime === built.mtime) return built.id;
    let id = "";
    try { id = (await readFile(file, "utf8")).match(/assets\/(index-[\w-]+\.js)/)?.[1] ?? ""; } catch { /* no build here */ }
    built = { mtime, id };
    return id;
  }
  const withBuild = async (code, out) => (code < 300 && out && typeof out === "object" ? { ...out, build: await build() } : out);

  /** returns true when it handled the request */
  return async function handle(req, res) {
    const url = new URL(req.url, "http://x");
    const p = url.pathname;
    if (p === "/thecore30" || p.startsWith("/thecore30/")) { serveTool(req, res, p); return true; }
    if (!p.startsWith("/api/core30/")) return false;
    try {
      if (req.method === "POST" && limited(req)) { send(res, 429, { ok: false, error: "slow down" }); return true; }
      if (req.method === "POST" && p === "/api/core30/event") { const body = await readBody(req); const [code, out] = await withLock(lockKey(body), () => events(body)); send(res, code, await withBuild(code, out)); return true; }
      if (req.method === "POST" && p === "/api/core30/start") { const body = await readBody(req); const [code, out] = await withLock(lockKey(body), () => start(body)); send(res, code, out); return true; }
      if (req.method === "POST" && (p === "/api/core30/draft" || p === "/api/core30/submit")) {
        const body = await readBody(req);
        const [code, out] = await withLock(lockKey(body), () => store(p.endsWith("submit") ? "submit" : "draft", body));
        send(res, code, await withBuild(code, out)); return true;
      }
      if (p === "/api/core30/admin/sessions") {
        if (!isAdmin(req, url)) { send(res, 403, { ok: false }); return true; }
        if (req.method === "POST") { const body = await readBody(req); const [code, out] = await withLock("_sessions", () => createSession(body)); send(res, code, out); return true; }
        if (req.method === "GET") { const [code, out] = await listSessions(); send(res, code, out); return true; }
      }
      const c = p.match(/^\/api\/core30\/([a-z0-9_-]+)\/config$/i);
      if (req.method === "GET" && c) { const [code, out] = await config(c[1], url.searchParams.get("t") ?? "", url.searchParams.get("lang") ?? ""); send(res, code, out); return true; }
      const st = p.match(/^\/api\/core30\/([a-z0-9_-]+)\/status$/i);
      if (req.method === "GET" && st) { const [code, out] = await status(st[1], url.searchParams.get("t") ?? ""); send(res, code, out); return true; }
      const m = p.match(/^\/api\/core30\/([a-z0-9_-]+)\/latest$/i);
      if (req.method === "GET" && m) { const [code, out] = await latest(m[1], url.searchParams.get("key")); send(res, code, out); return true; }
      if (req.method === "GET" && p === "/api/core30/_list") {
        if (!adminKey || url.searchParams.get("key") !== adminKey) { send(res, 403, { ok: false }); return true; }
        const ids = existsSync(dataDir) ? (await readdir(dataDir)).filter((d) => !d.startsWith("_")) : [];
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
