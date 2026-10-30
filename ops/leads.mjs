// Daniel, 30 Oct: "la analytics, la leads, poate fi eliminata adresa mea?". Who counts as us, in one place, on the server only.
// Our own test passes still mail out and stay in the file (marked internal), but are never reported as leads:
// not to GA4, not to OpenAI, not in /ops. Never log an address from here.
import { readFileSync, statSync } from "node:fs";
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
/** text of cromatic-leads.jsonl -> {days: {yyyy-mm-dd: n}, first: yyyy-mm-dd | null}. Counts only: nothing about a person leaves here */
export function countLeads(text) {
  const days = {}, seen = new Set(); let first = null;
  for (const line of String(text || "").split("\n")) {
    if (!line.trim()) continue;
    let r; try { r = JSON.parse(line); } catch { continue; }
    const day = dayOf(r && r.at); if (!day) continue;
    if (!first || day < first) first = day; // the store's reach counts every line, tests too
    if (r.internal || isInternalEmail(r.email)) continue;
    if (r.ref) { if (seen.has(r.ref)) continue; seen.add(r.ref); }
    days[day] = (days[day] || 0) + 1;
  }
  return { days, first };
}
export function makeLeadStore(dirs) {
  let cache = null, sig = "";
  return () => { // read like GET /api/leads: the first file that exists; reparsed only when it changes
    for (const d of dirs()) {
      const f = join(d, "cromatic-leads.jsonl");
      let st; try { st = statSync(f); } catch { continue; }
      const s = f + st.mtimeMs + ":" + st.size;
      if (s !== sig) { try { cache = countLeads(readFileSync(f, "utf8")); sig = s; } catch { continue; } }
      return cache;
    }
    return null;
  };
}
const shift = (day, n) => new Date(Date.parse(day + "T12:00:00Z") + n * 864e5).toISOString().slice(0, 10);
const span = (from, to) => Math.round((Date.parse(to + "T12:00:00Z") - Date.parse(from + "T12:00:00Z")) / 864e5) + 1;
const sum = (S, from, to) => { let n = 0; for (const [d, v] of Object.entries(S.days)) if (d >= from && d <= to) n += v; return n; };
function kpi(S, from, to) {
  const len = span(from, to), pFrom = shift(from, -len), pTo = shift(from, -1), v = sum(S, from, to), p = sum(S, pFrom, pTo);
  const prevPartial = !S.first || S.first > pFrom; // the store does not reach back over the whole previous period: no comparison
  return { value: v, prev: p, deltaPct: !prevPartial && p ? Math.round((v - p) / p * 1000) / 10 : null, source: "store", ...(prevPartial ? { prevPartial: true } : {}) };
}
/** one GA4 summary with its lead numbers replaced by the store's. Without a store the doc stays GA4's, and says nothing false: leadsStore stays absent */
export function withStoreLeads(doc, S) {
  if (!doc || !S || !doc.kpis || !Array.isArray(doc.daily) || !doc.daily.length) return doc;
  const from = doc.daily[0].date, to = doc.daily[doc.daily.length - 1].date;
  const out = { ...doc, kpis: { ...doc.kpis, leads: kpi(S, from, to) }, leadsStore: { first: S.first, from, partial: !S.first || S.first > from } };
  if (doc.kpis7) out.kpis7 = { ...doc.kpis7, leads: kpi(S, shift(to, -6), to) };
  out.daily = doc.daily.map((d) => (d.label ? d : { ...d, leads: S.days[d.date] || 0 }));
  return out;
}
