// Daniel, 30 Oct: "la analytics, la leads, poate fi eliminata adresa mea?". Who counts as us, in one place, on the server only.
// Our own test passes still mail out and stay in the file (marked internal), but are never reported as leads:
// not to GA4, not to OpenAI, not in /ops. Never log an address from here.
//
// TASK-144 (Daniel: "real / nu"): an admin marks a stored lead. cromatic-leads.jsonl stays append-only, because the boarding route
// appends to it at any moment and a rewrite could lose a lead. The marks live beside it: cromatic-leads-marks.json (the state,
// replaced whole by a rename, never half written) and cromatic-leads-marks.jsonl (the audit, one line per change, no personal data).
// A lead's id is a hash, so neither file holds a name, an address or a message. Leads marked "nu" leave the Leads KPI, the chart
// and "Ce cer lead-urile"; a lead nobody marked still counts.
import { readFileSync, writeFileSync, appendFileSync, renameSync, statSync } from "node:fs";
import { createHash } from "node:crypto";
import { join } from "node:path";

const INTERNAL_ADDRESSES = new Set(["daniel.stoicescu@gmail.com"]);
const INTERNAL_DOMAINS = new Set(["cromaticstudios.com"]);

/** the same mailbox however it was typed: case and spaces everywhere; on Gmail also dots and +tags */
export function normalizeEmail(raw) {
  const e = String(raw || "").trim().toLowerCase(), at = e.lastIndexOf("@");
  if (at < 1) return e;
  let local = e.slice(0, at), domain = e.slice(at + 1);
  if (domain === "gmail.com" || domain === "googlemail.com") { domain = "gmail.com"; local = local.split("+")[0].replace(/\./g, ""); }
  return local + "@" + domain;
}
const NORMAL = new Set([...INTERNAL_ADDRESSES].map(normalizeEmail));
export function isInternalEmail(raw) {
  const n = normalizeEmail(raw), at = n.lastIndexOf("@");
  return at > 0 && (NORMAL.has(n) || INTERNAL_DOMAINS.has(n.slice(at + 1)));
}

// ---------- real leads per day, from the store, with past tests left out by address (old lines have no mark) ----------
const DAY = new Intl.DateTimeFormat("en-CA", { timeZone: "Europe/Bucharest", year: "numeric", month: "2-digit", day: "2-digit" }); // GA4's days are Bucharest days
const dayOf = (iso) => { const d = new Date(iso); return isNaN(d) ? null : DAY.format(d); };
export const bucharestDay = (d = new Date()) => DAY.format(d);
const HOUR = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Bucharest", hour: "2-digit", hourCycle: "h23" });
const NO_REF = "CS00000"; // what the server stores when a pass has no reference: not a duplicate of the other passes without one
export const LEAD_ID_RE = /^L[0-9a-f]{16}$/;
export const leadId = (r) => "L" + createHash("sha256").update(String(r.at) + "|" + String(r.email) + "|" + String(r.ref)).digest("hex").slice(0, 16);
// the form's chips, in both languages, as one Romanian label. Whatever is not on this list is not counted, so free text can never reach a report
const RO_CHIP = {
  dreams: { "Branding": "Branding", "Website / App": "Site / aplicație", "Site / Aplicație": "Site / aplicație", "Video": "Video", "Growth & Social": "Creștere și social media", "Creștere și social media": "Creștere și social media", "Not sure yet": "Încă nu știu", "Încă nu știu": "Încă nu știu" },
  biz: { "Indie / local": "Indie / locală", "Indie / locală": "Indie / locală", "Startup": "Startup", "Scale-up": "Scale-up", "Established": "Consacrată", "Consacrată": "Consacrată" },
  when: { "Yesterday :)": "Ieri", "Ieri :)": "Ieri", "1 - 3 months": "1 - 3 luni", "1 - 3 luni": "1 - 3 luni", "Just exploring": "Doar se uită", "Doar mă uit deocamdată": "Doar se uită" },
};
const chip = (k, v) => (Object.prototype.hasOwnProperty.call(RO_CHIP[k], v) ? RO_CHIP[k][v] : null);
/** the real leads of the file, oldest first: tests and repeats left out, however the file got them */
function realLeads(text, onLine) {
  const seen = new Set(), out = [];
  for (const line of String(text || "").split("\n")) {
    if (!line.trim()) continue;
    let r; try { r = JSON.parse(line); } catch { continue; }
    const day = dayOf(r && r.at); if (!day) continue;
    if (onLine) onLine(day);
    if (r.internal || isInternalEmail(r.email)) continue;
    if (r.ref && r.ref !== NO_REF) { if (seen.has(r.ref)) continue; seen.add(r.ref); }
    out.push({ r, day });
  }
  return out;
}
/** text of cromatic-leads.jsonl + the marks -> counts per day, without the leads marked "nu". Nothing about a person leaves here: `rows` holds a day, a mark and form chips */
export function countLeads(text, marks = {}) {
  const days = {}, hours = {}, rows = []; let first = null, unmarked = 0;
  const leads = realLeads(text, (day) => { if (!first || day < first) first = day; }); // the store's reach counts every line, tests too
  for (const { r, day } of leads) {
    const m = (marks[leadId(r)] || {}).mark || null;
    if (!m) unmarked++;
    rows.push({ day, mark: m, dreams: Array.isArray(r.dreams) ? r.dreams.map((d) => chip("dreams", d)).filter(Boolean) : [], biz: chip("biz", r.biz), when: chip("when", r.when) });
    if (m === "nu") continue;
    days[day] = (days[day] || 0) + 1;
    const h = Number(HOUR.format(new Date(r.at))); (hours[day] = hours[day] || {})[h] = (hours[day][h] || 0) + 1;
  }
  return { days, hours, first, rows, unmarked };
}
/** the list for the admins' screen: only what it takes to judge a lead. Never the phone or the IP. Newest first */
export function leadList(text, marks = {}, cap = 300) {
  return realLeads(text).reverse().slice(0, cap).map(({ r }) => {
    const id = leadId(r), m = marks[id] || {};
    return { id, at: r.at, name: String(r.name || ""), email: String(r.email || ""), msg: String(r.msg || ""), dreams: Array.isArray(r.dreams) ? r.dreams.map((d) => chip("dreams", d)).filter(Boolean) : [], biz: chip("biz", r.biz), when: chip("when", r.when), page: typeof r.page === "string" ? r.page : "", lp: typeof r.lp === "string" ? r.lp : "", mark: m.mark || null, markBy: m.by || null, markAt: m.at || null };
  });
}
export function makeLeadStore(dirs) {
  let cache = null, sig = "";
  const LEADS = "cromatic-leads.jsonl", MARKS = "cromatic-leads-marks.json", AUDIT = "cromatic-leads-marks.jsonl";
  const home = () => { for (const d of dirs()) { try { return { dir: d, st: statSync(join(d, LEADS)) }; } catch {} } return null; }; // read like GET /api/leads: the first file that exists
  const readMarks = (dir) => { try { const j = JSON.parse(readFileSync(join(dir, MARKS), "utf8")); return j && typeof j === "object" ? j : {}; } catch { return {}; } };
  const marksSig = (dir) => { try { const st = statSync(join(dir, MARKS)); return st.mtimeMs + ":" + st.size; } catch { return "-"; } };
  const store = () => { // reparsed only when the file or the marks change
    const h = home(); if (!h) return null;
    const s = join(h.dir, LEADS) + h.st.mtimeMs + ":" + h.st.size + ":" + marksSig(h.dir);
    if (s !== sig) { try { cache = countLeads(readFileSync(join(h.dir, LEADS), "utf8"), readMarks(h.dir)); sig = s; } catch { return cache; } }
    return cache;
  };
  store.list = () => {
    const h = home(); if (!h) return { leads: [], unmarked: 0 };
    const text = readFileSync(join(h.dir, LEADS), "utf8"), marks = readMarks(h.dir), S = countLeads(text, marks);
    return { leads: leadList(text, marks), unmarked: S.unmarked, total: S.rows.length };
  };
  /** mark = "real" | "nu" | null (back to unmarked). The audit line goes first: no mark without a trace. Answers 404 for a lead that is not on the list, tests included */
  store.mark = (id, mark, who) => {
    const h = home(); if (!h) return { status: 404 };
    const text = readFileSync(join(h.dir, LEADS), "utf8");
    if (!realLeads(text).some(({ r }) => leadId(r) === id)) return { status: 404 };
    const marks = readMarks(h.dir), from = (marks[id] || {}).mark || null, at = new Date().toISOString();
    if (from !== mark) {
      appendFileSync(join(h.dir, AUDIT), JSON.stringify({ at, id, from, to: mark, by: who.email, name: who.name }) + "\n", { mode: 0o600 });
      if (mark) marks[id] = { mark, by: who.name, at }; else delete marks[id];
      const tmp = join(h.dir, MARKS + ".tmp-" + process.pid);
      writeFileSync(tmp, JSON.stringify(marks), { mode: 0o600 }); renameSync(tmp, join(h.dir, MARKS));
    }
    const cur = marks[id] || {};
    return { status: 200, mark: cur.mark || null, markBy: cur.by || null, markAt: cur.at || null, unmarked: countLeads(text, marks).unmarked };
  };
  return store;
}
export const shift = (day, n) => new Date(Date.parse(day + "T12:00:00Z") + n * 864e5).toISOString().slice(0, 10);
const span = (from, to) => Math.round((Date.parse(to + "T12:00:00Z") - Date.parse(from + "T12:00:00Z")) / 864e5) + 1;
const sum = (S, from, to) => { let n = 0; for (const [d, v] of Object.entries(S.days)) if (d >= from && d <= to) n += v; return n; };
function kpi(S, from, to) {
  const len = span(from, to), pFrom = shift(from, -len), pTo = shift(from, -1), v = sum(S, from, to), p = sum(S, pFrom, pTo);
  const prevPartial = !S.first || S.first > pFrom; // the store does not reach back over the whole previous period: no comparison
  return { value: v, prev: p, deltaPct: !prevPartial && p ? Math.round((v - p) / p * 1000) / 10 : null, source: "store", ...(prevPartial ? { prevPartial: true } : {}) };
}
/** one GA4 summary with its lead numbers replaced by the store's. Without a store the doc stays GA4's, and says nothing false: leadsStore stays absent */
export function withStoreLeads(doc, S, now = new Date()) {
  if (!doc || !S || !doc.kpis || !Array.isArray(doc.daily)) return doc;
  const today = bucharestDay(now), N = Number(doc.period), yesterday = shift(today, -1);
  // a period's real edges, not its first row with visits: a 90-day view of a young site still compares 90 days with 90 days
  const isToday = doc.period === "today";
  if (!isToday && !N && !doc.daily.length) return doc;
  const to = isToday ? today : N ? yesterday : doc.daily[doc.daily.length - 1].date, from = isToday ? today : N ? shift(to, -(N - 1)) : doc.daily[0].date;
  const inPeriod = (S.rows || []).filter((r) => r.day >= from && r.day <= to), kept = inPeriod.filter((r) => r.mark !== "nu");
  const tally = (list) => { const m = new Map(); for (const k of list) if (k) m.set(k, (m.get(k) || 0) + 1); return [...m].map(([k, n]) => ({ k, n })).sort((a, b) => b.n - a.n); };
  const out = { ...doc, kpis: { ...doc.kpis, leads: kpi(S, from, to) }, leadsStore: {
    first: S.first, from, partial: !S.first || S.first > from,
    all: inPeriod.length, unmarked: inPeriod.filter((r) => !r.mark).length, no: inPeriod.length - kept.length, unmarkedEver: S.unmarked || 0,
    ga: doc.kpis.leads ? doc.kpis.leads.value : null, // what GA saw of the same period: only ever compared with `all`
    wants: { n: kept.length, dreams: tally(kept.flatMap((r) => r.dreams)), biz: tally(kept.map((r) => r.biz)), when: tally(kept.map((r) => r.when)) },
  } };
  if (doc.kpis7) out.kpis7 = { ...doc.kpis7, leads: kpi(S, shift(to, -6), to) };
  if (isToday) { // by the hour: a pass can land in an hour GA4 has not reported yet
    const H = (S.hours && S.hours[today]) || {}, rows = doc.daily.slice(), lastLead = Math.max(-1, ...Object.keys(H).map(Number));
    for (let h = rows.length; h <= lastLead; h++) rows.push({ date: today, label: String(h).padStart(2, "0") + ":00", users: 0, sessions: 0, leads: 0 });
    out.daily = rows.map((d, h) => ({ ...d, leads: H[h] || 0 }));
  } else out.daily = doc.daily.map((d) => ({ ...d, leads: S.days[d.date] || 0 }));
  return out;
}
