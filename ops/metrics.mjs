// TASK-141: the /ops Performance page and the real numbers behind /ops Analytics. Runs on the server, with no laptop.
//
// Node 16 (the server's version): no global fetch, https only, never anything that holds the event loop. Everything
// below is a background job: a request only ever reads the last stored result or starts a job and answers at once.
//
//   PSI_API_KEY        PageSpeed Insights v5, for /, /ro/, /city/ on mobile and desktop: one call at a time, once a day
//                      (plus "Măsoară acum", at most one run per 15 min). PSI takes 10-60 s per URL. History in <OPS_DATA>/perf.json.
//   GA_SA_JSON_B64     the GA4 service account's key JSON, base64. Signed here with crypto (JWT, RS256), no dependency.
//   GA_PROPERTY        the GA4 property id. Reports cached in <OPS_DATA>/ga.json, refreshed every 4 h, never per page view.
//   OPS_JOBS=off       no scheduler (a run can still be started by hand).
//
// Keys never reach the client or the log: every message that leaves this file goes through scrub().
// The score shown is never one run: the median of the last 3 fresh runs per URL and strategy. A failed run has no score
// (null, never 0), and a cached PSI answer (back in about 0 s) is kept in the history but is not a new run.
import http from "node:http";
import https from "node:https";
import { createSign } from "node:crypto";
import { readFileSync, writeFileSync, renameSync, statSync, unlinkSync, mkdirSync } from "node:fs";
import { writeFile, rename } from "node:fs/promises";
import { join } from "node:path";

const PATHS = [["/", "Homepage EN"], ["/ro/", "Homepage RO"], ["/city/", "Orașul"]];
const STRATEGIES = ["mobile", "desktop"];
const WINDOW = 3; // the headline is the median of this many fresh runs
const REQ_TIMEOUT = 150e3, RETRY_WAIT = 20e3, PSI_TRIES = 2, MAX_BYTES = 16 * 1048576, BETWEEN = 1500;
const MANUAL_EVERY = 15 * 60e3, AUTO_FROM_HOUR = 3, AUTO_TRIES = 2, MAX_RUNS = 370, FIELD_KEEP = 30, TREND_RUNS = 90;
const CACHED_MS = 3000; // a real Lighthouse run takes 10-60 s; an answer this fast came from Google's cache
const GA_EVERY = 4 * 3600e3, GA_RETRY = 30 * 60e3, GA_STALE = 24 * 3600e3;
const TICK = 10 * 60e3, FIRST_TICK = 90e3;
const GA_TOKEN_URL = "https://oauth2.googleapis.com/token", GA_API = "https://analyticsdata.googleapis.com", PSI_URL = "https://www.googleapis.com/pagespeedonline/v5/runPagespeed";
const GA_SCOPE = "https://www.googleapis.com/auth/analytics.readonly";
const LEAD = "generate_lead", PLACE = "map_place_open", GAME = "gloves_start"; // the site's real GA4 events (build/consent.mjs, src/app.js, src/minigame.js)
const SHOT_SLUG = { "/": "home", "/ro/": "ro", "/city/": "city" }, SHOT_DIR = "perf-shots", SHOT_MAX = 400 * 1024; // the screenshot PSI returns, already a small JPEG: kept as it comes, latest only per page and device
const SHOT_RE = /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/;
export const SHOT_KEY_RE = /^(home|ro|city)-(mobile|desktop)$/;
const FIELD_KEYS = { LCP: "LARGEST_CONTENTFUL_PAINT_MS", FCP: "FIRST_CONTENTFUL_PAINT_MS", CLS: "CUMULATIVE_LAYOUT_SHIFT_SCORE", TTFB: "EXPERIMENTAL_TIME_TO_FIRST_BYTE", INP: "INTERACTION_TO_NEXT_PAINT" };

const wait = (ms) => new Promise((r) => { const t = setTimeout(r, ms); if (t.unref) t.unref(); });
const finite = (v) => typeof v === "number" && isFinite(v);
export function median(list) {
  const s = list.filter(finite).sort((a, b) => a - b);
  if (!s.length) return null;
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** removes every secret we know of, and anything shaped like one, from a text that may be logged or shown */
export function makeScrub(secrets) {
  const known = () => secrets().filter((s) => s && s.length > 5);
  return (text) => {
    let s = String(text == null ? "" : text);
    for (const k of known()) s = s.split(k).join("[ascuns]");
    return s
      .replace(/-----BEGIN[^-]*PRIVATE KEY-----[\s\S]*?(-----END[^-]*PRIVATE KEY-----|$)/g, "[ascuns]")
      .replace(/\b(key|access_token|assertion|token|private_key)=[^&\s"']+/gi, "$1=[ascuns]")
      .replace(/"(private_key|access_token|assertion)"\s*:\s*"[^"]*"/gi, '"$1":"[ascuns]"')
      .replace(/\bBearer\s+\S+/gi, "Bearer [ascuns]")
      .replace(/\bAIza[\w-]{20,}/g, "[ascuns]").replace(/\bya29\.[\w.-]+/g, "[ascuns]").replace(/\beyJ[\w-]+\.[\w-]+\.[\w-]*/g, "[ascuns]")
      .replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, "<email>")
      .slice(0, 300);
  };
}

/** one http(s) call that can never hang: an overall timer, a size cap. The error says what happened, never the URL (it can hold a key) */
function call(url, { method = "GET", headers = {}, body = null, timeout = REQ_TIMEOUT } = {}) {
  return new Promise((resolve, reject) => {
    const u = new URL(url), lib = u.protocol === "http:" ? http : https, started = Date.now();
    const data = body == null ? null : Buffer.from(body);
    const fail = (code) => reject(Object.assign(new Error(code), { code, ms: Date.now() - started }));
    let done = false;
    const req = lib.request(u, { method, headers: { Accept: "application/json", ...(data ? { "Content-Length": data.length } : {}), ...headers } }, (res) => {
      const parts = []; let n = 0;
      res.on("data", (c) => { n += c.length; if (n > MAX_BYTES) { finish("too_large"); return; } parts.push(c); });
      res.on("end", () => { if (done) return; done = true; clearTimeout(timer); resolve({ status: res.statusCode, text: Buffer.concat(parts).toString("utf8"), ms: Date.now() - started }); });
      res.on("error", () => finish("network"));
    });
    const finish = (code) => { if (done) return; done = true; clearTimeout(timer); req.destroy(); fail(code); };
    const timer = setTimeout(() => finish("timeout"), timeout);
    req.on("error", (e) => finish(e && e.code ? String(e.code).slice(0, 30) : "network"));
    if (data) req.write(data);
    req.end();
  });
}
const parse = (t) => { try { return JSON.parse(t); } catch { return null; } };
const googleMessage = (j) => (j && j.error && (j.error.message || (typeof j.error === "string" ? j.error_description || j.error : ""))) || "";

// ---------- PageSpeed answers -> the small rows we keep ----------
function fieldOf(exp) {
  if (!exp || !exp.metrics) return null;
  const metrics = {};
  for (const [k, name] of Object.entries(FIELD_KEYS)) {
    const m = exp.metrics[name];
    if (!m || !finite(m.percentile)) continue;
    metrics[k] = { p75: k === "CLS" ? m.percentile / 100 : m.percentile, cat: String(m.category || "").toUpperCase() || null }; // Google sends CLS x 100
  }
  return Object.keys(metrics).length ? { overall: exp.overall_category || null, metrics, fallback: !!exp.origin_fallback } : null;
}
const score = (c) => (c && finite(c.score) ? Math.round(c.score * 100) : null); // no score stays null, never 0
const num = (a) => (a && finite(a.numericValue) ? a.numericValue : null);
export function rowFromPsi(j, base) {
  const lh = (j && j.lighthouseResult) || {}, cats = lh.categories || {}, au = lh.audits || {};
  if (lh.runtimeError && lh.runtimeError.code && lh.runtimeError.code !== "NO_ERROR") return { ...base, ok: false, error: { code: "lighthouse", http: 200, message: String(lh.runtimeError.message || lh.runtimeError.code) } };
  const work = (au["mainthread-work-breakdown"] && au["mainthread-work-breakdown"].details && au["mainthread-work-breakdown"].details.items) || [];
  const row = {
    ...base, ok: true, fetchTime: lh.fetchTime || j.analysisUTCTimestamp || null,
    performance: score(cats.performance), accessibility: score(cats.accessibility), bestPractices: score(cats["best-practices"]), seo: score(cats.seo),
    lcpMs: num(au["largest-contentful-paint"]), fcpMs: num(au["first-contentful-paint"]), tbtMs: num(au["total-blocking-time"]), cls: num(au["cumulative-layout-shift"]), speedIndexMs: num(au["speed-index"]),
    field: { page: fieldOf(j.loadingExperience), origin: fieldOf(j.originLoadingExperience) },
    ...(work.length ? { work: Object.fromEntries(work.filter((x) => x && x.group && finite(x.duration)).map((x) => [x.group, Math.round(x.duration)])) } : {}), // where the main thread's time went, per run: what TBT can be compared against later
  };
  if (row.performance == null) return { ...base, ok: false, error: { code: "no-score", http: 200, message: "Lighthouse a terminat fără scor de performanță." } };
  return row;
}
/** the page as Lighthouse last saw it, and the filmstrip: only what is really an image, under the size cap */
export function shotFromPsi(j) {
  const au = (j && j.lighthouseResult && j.lighthouseResult.audits) || {}, fin = au["final-screenshot"] && au["final-screenshot"].details && au["final-screenshot"].details.data;
  if (typeof fin !== "string" || !SHOT_RE.test(fin)) return null;
  const items = (au["screenshot-thumbnails"] && au["screenshot-thumbnails"].details && au["screenshot-thumbnails"].details.items) || [];
  const thumbs = items.filter((x) => x && typeof x.data === "string" && SHOT_RE.test(x.data) && finite(x.timing)).map((x) => ({ ms: Math.round(x.timing), data: x.data }));
  const size = fin.length + thumbs.reduce((a, x) => a + x.data.length, 0);
  if (fin.length > SHOT_MAX) return null;
  return { final: fin, thumbs: size > SHOT_MAX ? [] : thumbs };
}
/** before.json (refs/psi, the 30 Oct audit), shape-converted: the first entry of the history */
export function seedRun(seed) {
  const conv = (f) => {
    if (!f) return null; const metrics = {};
    for (const [k, name] of Object.entries(FIELD_KEYS)) if (f[name] && finite(f[name].p75)) metrics[k] = { p75: k === "CLS" ? f[name].p75 / 100 : f[name].p75, cat: f[name].cat || null };
    return Object.keys(metrics).length ? { overall: f.overall || null, metrics, fallback: false } : null;
  };
  return {
    id: "seed", at: seed.at, finishedAt: seed.at, trigger: "seed", state: "done",
    results: seed.results.map((r) => {
      const base = { path: r.path, strategy: r.strategy, at: seed.at };
      if (!finite(r.performance)) return { ...base, ok: false, ms: 40000, error: { code: "lighthouse", http: 500, message: "Something went wrong" } };
      const page = conv(r.fieldUrl), origin = conv(r.fieldOrigin);
      if (page && origin && JSON.stringify(page.metrics) === JSON.stringify(origin.metrics)) page.fallback = true; // Google answered for the whole site
      return { ...base, ok: true, fetchTime: seed.at, performance: r.performance, accessibility: r.accessibility, bestPractices: r.bestPractices, seo: r.seo, lcpMs: r.lcpMs, fcpMs: r.fcpMs, tbtMs: r.tbtMs, cls: r.cls, speedIndexMs: r.speedIndexMs, field: { page, origin } };
    }),
  };
}

// ---------- GA4 report rows -> the shape the Analytics section reads ----------
const nOf = (v) => { const n = Number(v); return isFinite(n) ? n : 0; };
const kp = (v, p) => ({ value: v, prev: p, deltaPct: p ? Math.round((v - p) / p * 1000) / 10 : null });
const round1 = (v) => Math.round(v * 10) / 10;
/** a runReport answer as plain objects keyed by the dimension and metric names */
export function rowsOf(rep) {
  const dh = ((rep && rep.dimensionHeaders) || []).map((h) => h.name), mh = ((rep && rep.metricHeaders) || []).map((h) => h.name);
  return ((rep && rep.rows) || []).map((r) => {
    const o = {};
    (r.dimensionValues || []).forEach((v, i) => { o[dh[i]] = v.value; });
    (r.metricValues || []).forEach((v, i) => { o[mh[i]] = nOf(v.value); });
    return o;
  });
}
const RANGES = [{ name: "cur", startDate: "30daysAgo", endDate: "yesterday" }, { name: "prev", startDate: "60daysAgo", endDate: "31daysAgo" }, { name: "w", startDate: "7daysAgo", endDate: "yesterday" }, { name: "wprev", startDate: "14daysAgo", endDate: "8daysAgo" }];
const MONTH = [{ startDate: "30daysAgo", endDate: "yesterday" }];
const eventIs = (name) => ({ filter: { fieldName: "eventName", stringFilter: { matchType: "EXACT", value: name } } });
const isoDay = (d) => `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6, 8)}`;
function regionRo(id, fallback) { try { return new Intl.DisplayNames(["ro"], { type: "region" }).of(id) || fallback; } catch { return fallback; } }

export const GA_REPORTS = {
  totals: { dateRanges: RANGES, metrics: ["activeUsers", "sessions", "engagementRate", "userEngagementDuration"] },
  leads: { dateRanges: RANGES, metrics: ["eventCount"], dimensionFilter: eventIs(LEAD) },
  daily: { dateRanges: MONTH, dimensions: ["date"], metrics: ["activeUsers", "sessions"], orderBys: [{ dimension: { dimensionName: "date" } }], limit: 70 },
  dailyLeads: { dateRanges: MONTH, dimensions: ["date"], metrics: ["eventCount"], dimensionFilter: eventIs(LEAD), limit: 70 },
  sources: { dateRanges: MONTH, dimensions: ["sessionSource", "sessionMedium"], metrics: ["sessions", "activeUsers"], orderBys: [{ metric: { metricName: "sessions" }, desc: true }], limit: 12 },
  sourceLeads: { dateRanges: MONTH, dimensions: ["sessionSource", "sessionMedium"], metrics: ["eventCount"], dimensionFilter: eventIs(LEAD), limit: 100 },
  events: { dateRanges: MONTH, dimensions: ["eventName"], metrics: ["eventCount"], dimensionFilter: { filter: { fieldName: "eventName", inListFilter: { values: [PLACE, GAME] } } } },
  city: { dateRanges: MONTH, metrics: ["sessions"], dimensionFilter: { filter: { fieldName: "pagePath", stringFilter: { matchType: "BEGINS_WITH", value: "/city" } } } },
  pages: { dateRanges: MONTH, dimensions: ["pagePath", "pageTitle"], metrics: ["screenPageViews", "activeUsers", "userEngagementDuration"], orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }], limit: 40 },
  countries: { dateRanges: MONTH, dimensions: ["country", "countryId"], metrics: ["activeUsers"], orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }], limit: 8 },
  devices: { dateRanges: MONTH, dimensions: ["deviceCategory"], metrics: ["activeUsers"], orderBys: [{ metric: { metricName: "activeUsers" }, desc: true }] },
  campaigns: { dateRanges: MONTH, dimensions: ["sessionCampaignName"], metrics: ["sessions"], dimensionFilter: { filter: { fieldName: "sessionCampaignName", stringFilter: { matchType: "FULL_REGEXP", value: ".+-[abAB]" } } }, limit: 40 },
  campaignLeads: { dateRanges: MONTH, dimensions: ["sessionCampaignName"], metrics: ["eventCount"], dimensionFilter: { andGroup: { expressions: [eventIs(LEAD), { filter: { fieldName: "sessionCampaignName", stringFilter: { matchType: "FULL_REGEXP", value: ".+-[abAB]" } } }] } }, limit: 40 },
};
/** Only the cards the site really measures: The Core Lite, CTA clicks and postcards send no GA event, so those keys stay absent and the UI skips them */
export function buildSummary(R, now = new Date()) {
  const byRange = (rows) => Object.fromEntries(rows.map((r) => [r.dateRange || "cur", r]));
  const T = byRange(rowsOf(R.totals)), L = byRange(rowsOf(R.leads));
  const pick = (a, b, leadsA, leadsB) => {
    const x = a || {}, y = b || {};
    const avg = (t) => (t.activeUsers ? t.userEngagementDuration / t.activeUsers : 0);
    return { users: kp(x.activeUsers || 0, y.activeUsers || 0), sessions: kp(x.sessions || 0, y.sessions || 0), engagedRate: kp(x.engagementRate || 0, y.engagementRate || 0), avgEngagementSec: kp(Math.round(avg(x)), Math.round(avg(y))), leads: kp((leadsA || {}).eventCount || 0, (leadsB || {}).eventCount || 0) };
  };
  const leadsByDay = new Map(rowsOf(R.dailyLeads).map((r) => [r.date, r.eventCount]));
  const seen = new Map(rowsOf(R.daily).map((r) => [r.date, r]));
  const days = [...seen.keys()].sort();
  const daily = [];
  if (days.length) { // GA leaves out a day with no visits: the chart still needs it, at zero
    const dayMs = 86400e3, toD = (k) => Date.UTC(+k.slice(0, 4), +k.slice(4, 6) - 1, +k.slice(6, 8));
    for (let t = toD(days[0]); t <= toD(days[days.length - 1]); t += dayMs) {
      const k = new Date(t).toISOString().slice(0, 10).replace(/-/g, ""), r = seen.get(k) || {};
      daily.push({ date: isoDay(k), users: r.activeUsers || 0, sessions: r.sessions || 0, leads: leadsByDay.get(k) || 0 });
    }
  }
  const skey = (r) => r.sessionSource + "\n" + r.sessionMedium, sLeads = new Map(rowsOf(R.sourceLeads).map((r) => [skey(r), r.eventCount]));
  const sources = rowsOf(R.sources).map((r) => ({ source: r.sessionSource, medium: r.sessionMedium, sessions: r.sessions, users: r.activeUsers, leads: sLeads.get(skey(r)) || 0 }));
  const ev = new Map(rowsOf(R.events).map((r) => [r.eventName, r.eventCount]));
  const cityRow = rowsOf(R.city)[0] || {};
  const pages = new Map();
  for (const r of rowsOf(R.pages)) {
    const p = pages.get(r.pagePath) || { path: r.pagePath, title: "", views: 0, users: 0, dur: 0, best: -1 };
    if (r.screenPageViews > p.best) { p.best = r.screenPageViews; p.title = r.pageTitle && r.pageTitle !== "(not set)" ? r.pageTitle : ""; }
    p.views += r.screenPageViews; p.users += r.activeUsers; p.dur += r.userEngagementDuration; pages.set(r.pagePath, p);
  }
  const topPages = [...pages.values()].sort((a, b) => b.views - a.views).slice(0, 10).map((p) => ({ path: p.path, title: p.title, views: p.views, avgSec: p.users ? Math.round(p.dur / p.users) : 0 }));
  const cLeads = new Map(rowsOf(R.campaignLeads).map((r) => [r.sessionCampaignName, r.eventCount]));
  const campaigns = rowsOf(R.campaigns).map((r) => {
    const name = r.sessionCampaignName, m = /^(.+)-([ab])$/i.exec(name || ""); if (!m) return null;
    const leads = cLeads.get(name) || 0;
    return { slug: m[1], variant: m[2].toLowerCase(), utm_campaign: name, sessions: r.sessions, leads, conversionPct: r.sessions ? round1(leads / r.sessions * 100) : 0 };
  }).filter(Boolean);
  return {
    generatedAt: now.toISOString(), source: "ga4", range: daily.length ? { from: daily[0].date, to: daily[daily.length - 1].date } : null,
    kpis: pick(T.cur, T.prev, L.cur, L.prev), kpis7: pick(T.w, T.wprev, L.w, L.wprev), daily, sources, campaigns,
    map: { driveSessions: cityRow.sessions || 0, cardOpens: ev.get(PLACE) || 0, gameStarts: ev.get(GAME) || 0 },
    topPages,
    countries: rowsOf(R.countries).map((r) => ({ country: regionRo(r.countryId, r.country), users: r.activeUsers })),
    devices: rowsOf(R.devices).map((r) => ({ device: r.deviceCategory, users: r.activeUsers })),
  };
}

// ---------- the service ----------
export function createMetrics({ dataDir, log = console, env = process.env }) {
  const P = (f) => join(dataDir, f);
  const prod = env.NODE_ENV === "production";
  const dev = (name, real) => (!prod && env[name]) || real; // test stubs only: a production server always talks to Google
  const psiKey = () => String(env.PSI_API_KEY || "").trim();
  let gaToken = null, gaAssertion = "";
  const gaRaw = () => String(env.GA_SA_JSON_B64 || "").trim();
  const gaProperty = () => String(env.GA_PROPERTY || "").trim();
  function gaKey() { try { const j = JSON.parse(Buffer.from(gaRaw(), "base64").toString("utf8")); return j && j.client_email && j.private_key ? j : null; } catch { return null; } }
  const scrub = makeScrub(() => { const k = gaRaw() ? gaKey() : null; return [psiKey(), gaRaw(), k && k.private_key, gaToken && gaToken.value, gaAssertion]; });
  const say = (m) => log.log("[ops] " + scrub(m));
  const warn = (m) => log.error("[ops] " + scrub(m));

  const readJson = (f, d) => { try { return JSON.parse(readFileSync(P(f), "utf8")); } catch { return d; } };
  let saving = Promise.resolve();
  const saveJson = (f, v) => { // one writer at a time, never a half file, never a synchronous write in the middle of a run
    const body = JSON.stringify(v), tmp = P(f + ".tmp-" + process.pid);
    saving = saving.then(() => writeFile(tmp, body, { mode: 0o600 })).then(() => rename(tmp, P(f))).catch((e) => warn("save " + f + ": " + e.message));
    return saving;
  };
  const mtime = (f) => { try { return statSync(P(f)).mtimeMs; } catch { return 0; } };

  // ---------- content: the conclusions and the static comparison are data, <dataDir>/perf-content.json overrides the repo's without a deploy
  const REPO_CONTENT = new URL("./perf-content.json", import.meta.url), REPO_SEED = new URL("./perf-seed.json", import.meta.url);
  function content() { const over = readJson("perf-content.json", null); if (over) return over; try { return JSON.parse(readFileSync(REPO_CONTENT, "utf8")); } catch { return {}; } }

  // ---------- perf history ----------
  let store = null, storeAt = 0, mine = null; // mine: the run this process is doing now
  function load() {
    if (mine && store) return store;
    const m = mtime("perf.json");
    if (!store || m !== storeAt) { store = readJson("perf.json", null) || { runs: [], job: {} }; store.job = store.job || {}; store.runs = store.runs || []; storeAt = m; }
    if (!store.runs.some((r) => r.trigger === "seed")) {
      try { store.runs.unshift(seedRun(JSON.parse(readFileSync(REPO_SEED, "utf8")))); saveNow(); } catch (e) { warn("perf seed: " + e.message); }
    }
    return store;
  }
  function saveNow() { // the synchronous form, only for the very first seed
    const tmp = P("perf.json.tmp-" + process.pid + "-s"); writeFileSync(tmp, JSON.stringify(store), { mode: 0o600 }); renameSync(tmp, P("perf.json")); storeAt = mtime("perf.json");
  }
  const saveStore = () => saveJson("perf.json", store).then(() => { storeAt = mtime("perf.json"); });
  // ---------- a run may belong to another process for the few seconds of a pm2 reload: a lock file with its pid
  const LOCK = "perf.lock";
  const pidAlive = (pid) => { try { process.kill(pid, 0); return true; } catch (e) { return e.code === "EPERM"; } };
  function lockHolder() { const l = readJson(LOCK, null); return l && l.pid && l.pid !== process.pid && pidAlive(l.pid) ? l : null; }
  function closeOrphans() {
    if (mine || lockHolder()) return;
    let changed = false;
    for (const r of load().runs) if (r.state === "running") { r.state = "interrupted"; r.finishedAt = r.finishedAt || new Date().toISOString(); changed = true; }
    if (changed) saveStore();
  }
  const isRunning = () => !!mine || !!lockHolder();

  async function psiOne(path, strategy, seen) {
    const base = dev("OPS_SITE_BASE", "https://cromaticstudios.com"), started = Date.now();
    const q = new URLSearchParams({ url: base + path, strategy, key: psiKey() });
    for (const c of ["performance", "accessibility", "best-practices", "seo"]) q.append("category", c);
    // the audits map cannot be narrowed further (Google answers 400 to audits/<id>): about 650 KB per answer, parsed once and dropped
    q.set("fields", "analysisUTCTimestamp,loadingExperience,originLoadingExperience,lighthouseResult(fetchTime,runtimeError,categories/*/score,audits)");
    const url = dev("OPS_PSI_ENDPOINT", PSI_URL) + "?" + q.toString(), row0 = { path, strategy, at: new Date(started).toISOString() };
    let last = null, tries = 0;
    for (let i = 1; i <= PSI_TRIES; i++) {
      const t0 = Date.now(); tries = i;
      try {
        const r = await call(url);
        const j = parse(r.text);
        if (r.status === 200 && j) {
          const row = rowFromPsi(j, { ...row0, ms: r.ms, tries: i });
          if (row.ok) {
            Object.defineProperty(row, "shot", { value: shotFromPsi(j), enumerable: false }); // goes to its own file, never into perf.json
            const ft = Date.parse(row.fetchTime || "") || 0;
            row.cached = r.ms < dev("OPS_PSI_CACHED_MS", CACHED_MS) * 1 || (!!row.fetchTime && seen.has(row.fetchTime)) || (ft > 0 && ft < t0 - 300e3);
            if (row.fetchTime) seen.add(row.fetchTime);
            return row;
          }
          return row; // Lighthouse answered and said it could not measure: trying again does not change that today
        }
        last = { code: "http", http: r.status, message: scrub(googleMessage(j) || "Răspuns neașteptat de la Google."), ms: r.ms };
        if (![429, 500, 502, 503, 504].includes(r.status)) break;
      } catch (e) { last = { code: e.code || "network", http: null, message: e.code === "timeout" ? "Google n-a răspuns în " + Math.round(REQ_TIMEOUT / 1000) + " s." : "Nu am ajuns la Google (" + scrub(e.code || "rețea") + ").", ms: e.ms || Date.now() - t0 }; }
      if (i < PSI_TRIES) await wait(dev("OPS_PSI_RETRY_MS", RETRY_WAIT) * 1);
    }
    return { ...row0, ok: false, ms: last.ms, tries, error: { code: last.code, http: last.http, message: last.message } };
  }

  // ---------- the latest screenshot per page and device, one small file each (never per run)
  async function saveShot(path, st, row) {
    const key = SHOT_SLUG[path] + "-" + st;
    try {
      mkdirSync(P(SHOT_DIR), { recursive: true });
      const body = JSON.stringify({ at: row.at, final: row.shot.final, thumbs: row.shot.thumbs }), f = P(join(SHOT_DIR, key + ".json")), tmp = f + ".tmp-" + process.pid;
      await writeFile(tmp, body, { mode: 0o600 }); await rename(tmp, f);
      const s = load(); s.job.shots = { ...(s.job.shots || {}), [key]: { at: row.at, thumbs: row.shot.thumbs.length } };
    } catch (e) { warn("perf shot: " + e.message); } // a missing picture never costs the measurement
  }
  function shotOf(key) { if (!SHOT_KEY_RE.test(String(key))) return null; const j = readJson(join(SHOT_DIR, key + ".json"), null); return j && j.final ? j : null; }
  async function runPsi(trigger, by) {
    const s = load(), id = "run-" + Date.now().toString(36);
    const run = { id, at: new Date().toISOString(), trigger, ...(by ? { by } : {}), state: "running", results: [] };
    mine = run; s.runs.push(run); s.job.lastStartAt = run.at;
    if (trigger === "auto") { const d = run.at.slice(0, 10); s.job.autoTries = s.job.autoDay === d ? (s.job.autoTries || 0) + 1 : 1; s.job.autoDay = d; }
    try { writeFileSync(P(LOCK), JSON.stringify({ pid: process.pid, at: run.at }), { mode: 0o600 }); } catch {}
    await saveStore();
    const seen = new Set(s.runs.flatMap((r) => r.results.map((x) => x.fetchTime)).filter(Boolean));
    try {
      for (const [path] of PATHS) for (const st of STRATEGIES) {
        run.current = { path, strategy: st };
        const row = await psiOne(path, st, seen);
        run.results.push(row);
        if (row.ok && row.shot) await saveShot(path, st, row); // a cached answer is still Google's latest picture of the page
        await saveStore();
        await wait(BETWEEN);
      }
      run.state = "done";
    } catch (e) { run.state = "interrupted"; warn("perf run: " + e.message); }
    delete run.current; run.finishedAt = new Date().toISOString();
    // old runs keep their numbers, not their CrUX blocks: the file stays under about 1 MB
    s.runs.slice(0, -FIELD_KEEP).forEach((r) => { if (r.trigger !== "seed") r.results.forEach((x) => { delete x.field; }); });
    if (s.runs.length > MAX_RUNS) s.runs.splice(1, s.runs.length - MAX_RUNS);
    mine = null;
    await saveStore();
    try { unlinkSync(P(LOCK)); } catch {}
    const ok = run.results.filter((r) => r.ok && !r.cached).length, bad = run.results.filter((r) => !r.ok).length;
    say(`perf run ${trigger}: ${ok} measured, ${bad} without a score, ${run.results.length - ok - bad} cached`);
  }
  function startManual(email) {
    if (!psiKey()) return { ok: false, status: 503, error: "no-key" };
    closeOrphans();
    if (isRunning()) return { ok: false, status: 409, error: "running" };
    const last = Date.parse(load().job.lastStartAt || 0) || 0, next = last + MANUAL_EVERY;
    if (Date.now() < next) return { ok: false, status: 429, error: "rate", nextAt: new Date(next).toISOString() };
    runPsi("manual", email).catch((e) => warn("perf run: " + e.message)); // never awaited: PSI takes minutes
    return { ok: true, status: 202 };
  }
  function autoDue(now = new Date()) {
    if (!psiKey() || isRunning()) return false;
    if (now.getUTCHours() < AUTO_FROM_HOUR) return false;
    const s = load(), day = now.toISOString().slice(0, 10);
    if (s.runs.some((r) => r.trigger !== "seed" && r.state === "done" && String(r.at).slice(0, 10) === day)) return false;
    if (s.job.autoDay === day && (s.job.autoTries || 0) >= AUTO_TRIES) return false; // interrupted twice (two deploys): tomorrow
    return true;
  }

  // ---------- what the page gets ----------
  function perfView() {
    closeOrphans();
    const s = load(), runs = s.runs, rowsOfPair = (path, st) => { const out = []; for (let i = runs.length - 1; i >= 0; i--) for (const x of runs[i].results) if (x.path === path && x.strategy === st) out.push(x); return out; };
    const med = (rows, k) => { const v = median(rows.map((r) => r[k])); return v == null ? null : v; };
    const pages = PATHS.map(([path, label]) => {
      const strategies = {};
      for (const st of STRATEGIES) {
        const all = rowsOfPair(path, st), fresh = all.filter((r) => r.ok && !r.cached), win = fresh.slice(0, WINDOW), last = all[0] || null;
        const headline = win.length ? {
          performance: med(win, "performance"), accessibility: med(win, "accessibility"), bestPractices: med(win, "bestPractices"), seo: med(win, "seo"),
          lcpMs: med(win, "lcpMs"), fcpMs: med(win, "fcpMs"), tbtMs: med(win, "tbtMs"), cls: med(win, "cls"), speedIndexMs: med(win, "speedIndexMs"), n: win.length,
          samples: win.map((r) => r.performance),
        } : null;
        const shotMeta = (s.job.shots || {})[SHOT_SLUG[path] + "-" + st] || null;
        strategies[st] = { headline, shot: shotMeta ? { at: shotMeta.at, thumbs: shotMeta.thumbs } : null, measuredAt: win[0] ? win[0].at : null, last: last ? { at: last.at, ok: !!last.ok, cached: !!last.cached, ms: last.ms ?? null, error: last.error || null } : null, failures: all.filter((r) => !r.ok).length };
      }
      return { path, label, strategies };
    });
    // the newest CrUX block per page and device, and for the whole site
    const field = { origin: {}, pages: {} };
    for (const [path] of PATHS) { field.pages[path] = {}; for (const st of STRATEGIES) {
      const r = rowsOfPair(path, st).find((x) => x.ok && x.field && (x.field.page || x.field.origin));
      field.pages[path][st] = r && r.field.page ? { ...r.field.page, at: r.at } : null;
      if (r && r.field.origin && (!field.origin[st] || Date.parse(r.at) > Date.parse(field.origin[st].at))) field.origin[st] = { ...r.field.origin, at: r.at };
    } }
    const trend = runs.slice(-TREND_RUNS).flatMap((r) => r.results.filter((x) => x.ok && !x.cached).map((x) => ({ at: x.at, path: x.path, strategy: x.strategy, performance: x.performance, lcpMs: x.lcpMs, tbtMs: x.tbtMs })));
    const list = runs.slice(-14).reverse().map((r) => ({ id: r.id, at: r.at, trigger: r.trigger, state: r.state, total: PATHS.length * STRATEGIES.length, measured: r.results.filter((x) => x.ok && !x.cached).length, cached: r.results.filter((x) => x.ok && x.cached).length, failed: r.results.filter((x) => !x.ok).length, rows: r.results.map((x) => ({ path: x.path, strategy: x.strategy, ok: !!x.ok, cached: !!x.cached, performance: x.performance ?? null, ms: x.ms ?? null })) }));
    const running = runs.slice().reverse().find((r) => r.state === "running");
    const last = Date.parse(s.job.lastStartAt || 0) || 0, nextManual = last + MANUAL_EVERY;
    const done = runs.slice().reverse().find((r) => r.state !== "running" && r.results.length);
    return {
      configured: !!psiKey(), window: WINDOW,
      running: running && isRunning() ? { startedAt: running.at, done: running.results.length, total: PATHS.length * STRATEGIES.length, current: running.current || null } : null,
      lastRunAt: done ? done.at : null, manualNextAt: nextManual > Date.now() ? new Date(nextManual).toISOString() : null,
      pages, field, trend, runs: list, content: content(),
    };
  }

  // ---------- GA4 ----------
  const gaFile = () => readJson("ga.json", {});
  const gaConfigured = () => !!(gaRaw() && gaProperty());
  async function gaAccessToken() {
    if (gaToken && gaToken.exp > Date.now() + 60e3) return gaToken.value;
    const k = gaKey(); if (!k) throw Object.assign(new Error("Cheia din GA_SA_JSON_B64 nu se poate citi."), { code: "key" });
    const iat = Math.floor(Date.now() / 1000), b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
    const unsigned = b64({ alg: "RS256", typ: "JWT" }) + "." + b64({ iss: k.client_email, scope: GA_SCOPE, aud: GA_TOKEN_URL, iat, exp: iat + 3600 });
    let sig; try { sig = createSign("RSA-SHA256").update(unsigned).sign(k.private_key, "base64url"); } catch { throw Object.assign(new Error("Cheia privată din GA_SA_JSON_B64 nu semnează."), { code: "key" }); }
    gaAssertion = unsigned + "." + sig;
    // the token address is fixed here, never read from the key file
    const r = await call(dev("OPS_GA_TOKEN_URL", GA_TOKEN_URL), { method: "POST", timeout: 30e3, headers: { "Content-Type": "application/x-www-form-urlencoded" }, body: "grant_type=" + encodeURIComponent("urn:ietf:params:oauth:grant-type:jwt-bearer") + "&assertion=" + gaAssertion });
    const j = parse(r.text);
    if (r.status !== 200 || !j || !j.access_token) throw Object.assign(new Error(scrub(googleMessage(j) || "Google a refuzat cheia.")), { code: "token", http: r.status });
    gaToken = { value: j.access_token, exp: Date.now() + (Number(j.expires_in) || 3600) * 1000 };
    return gaToken.value;
  }
  async function gaReport(body) {
    const req = { ...body, ...(body.dimensions ? { dimensions: body.dimensions.map((name) => ({ name })) } : {}), metrics: body.metrics.map((name) => ({ name })) };
    const url = dev("OPS_GA_API", GA_API) + "/v1beta/properties/" + encodeURIComponent(gaProperty()) + ":runReport";
    for (let i = 1; ; i++) {
      const token = await gaAccessToken();
      const r = await call(url, { method: "POST", timeout: 60e3, headers: { "Content-Type": "application/json", Authorization: "Bearer " + token }, body: JSON.stringify(req) });
      const j = parse(r.text);
      if (r.status === 200 && j) return j;
      if (r.status === 401) gaToken = null;
      if (i >= 2 || ![401, 429, 500, 503].includes(r.status)) throw Object.assign(new Error(scrub(googleMessage(j) || "GA4 a răspuns cu eroare.")), { code: "report", http: r.status });
      await wait(dev("OPS_PSI_RETRY_MS", 5000) * 1);
    }
  }
  let gaBusy = false;
  async function refreshGa() {
    if (gaBusy || !gaConfigured()) return;
    if (!/^\d{3,20}$/.test(gaProperty())) { saveJson("ga.json", { ...gaFile(), lastAttemptAt: new Date().toISOString(), lastError: { code: "property", message: "GA_PROPERTY trebuie să fie doar cifre." } }); return; }
    gaBusy = true;
    const prev = gaFile(), at = new Date().toISOString();
    try {
      const R = {};
      for (const [name, body] of Object.entries(GA_REPORTS)) R[name] = await gaReport(body); // one at a time
      await saveJson("ga.json", { data: buildSummary(R), fetchedAt: new Date().toISOString(), lastAttemptAt: at, lastError: null });
      say("GA4 refreshed");
    } catch (e) {
      const err = { code: e.code || "network", http: e.http ?? null, message: scrub(e.code === "timeout" ? "GA4 n-a răspuns la timp." : e.message) };
      await saveJson("ga.json", { ...prev, lastAttemptAt: at, lastError: err });
      warn("GA4 refresh failed: " + err.code + " " + (err.http || "") + " " + err.message);
    } finally { gaBusy = false; }
  }
  function gaDue(now = Date.now()) {
    if (!gaConfigured() || gaBusy) return false;
    const f = gaFile(), fetched = Date.parse(f.fetchedAt || 0) || 0, tried = Date.parse(f.lastAttemptAt || 0) || 0;
    return now - fetched >= GA_EVERY && now - tried >= GA_RETRY;
  }
  /** analytics/summary for the snapshot (admins only). Real data when it exists; otherwise only a status, so the page keeps its labelled test data */
  function analyticsDoc() {
    const f = gaFile(), configured = gaConfigured(), age = Date.now() - (Date.parse(f.fetchedAt || 0) || 0);
    if (!configured && !f.data) return null;
    const status = { configured, fetchedAt: f.fetchedAt || null, error: f.lastError ? { code: f.lastError.code, http: f.lastError.http ?? null, message: f.lastError.message } : null, stale: !!f.data && (age > GA_STALE || !!f.lastError) };
    return f.data ? { ...f.data, status } : { status };
  }

  // ---------- the scheduler: light checks, the work is awaited in the background ----------
  let timer = null;
  async function tick() {
    try {
      closeOrphans();
      if (autoDue()) await runPsi("auto");
      if (gaDue()) await refreshGa();
    } catch (e) { warn("jobs: " + e.message); }
  }
  function start() {
    if (timer || env.OPS_JOBS === "off" || (!psiKey() && !gaConfigured())) return;
    const first = setTimeout(tick, Number(env.OPS_JOBS_FIRST_MS) || FIRST_TICK); if (first.unref) first.unref();
    timer = setInterval(tick, TICK); if (timer.unref) timer.unref();
    say(`jobs on (PageSpeed ${psiKey() ? "yes" : "no key"}, GA4 ${gaConfigured() ? "yes" : "no key"})`);
  }
  return { start, tick, perfView, shotOf, startManual, analyticsDoc, refreshGa, autoDue, gaDue, scrub, flush: () => saving };
}
