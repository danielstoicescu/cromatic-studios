// TASK-122: landing pages for ads campaigns, made from config. One file per landing, site/landings/<slug>.json, on top
// of the shared words in site/landings/_shared.json (any key of a landing replaces the shared one;
// objects merge key by key). The build writes
// /lp/<slug>/ (lang "en" or "both") and /ro/lp/<slug>/ (lang "ro" or "both") with the website's own blocks
// (site/render.mjs, landingPage) and stylesheet. Not in the sitemap, not in llms.txt, meta robots noindex.
// Every text is { "en": "...", "ro": "..." }; the Romanian page is the English one through the site's dictionary
// (build/i18n.mjs) with these "ro" fields added to it, so a missing one shows up in ro.missing.json like any block.
// To add one: copy site/landings/coffee-brands.json to <slug>.json, change slug, words, cases, services and proof, run
// the build; it warns here ([lp] ...) about unknown cases, services or logos and missing Romanian.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const isText = (v) => v && typeof v === "object" && !Array.isArray(v) && "en" in v;
// a landing's keys over the shared ones; objects (nudges, drive, finale...) merge key by key, texts and lists replace
const isObj = (v) => v && typeof v === "object" && !Array.isArray(v) && !isText(v);
const merge = (a, b) => { const o = { ...a }; for (const [k, v] of Object.entries(b)) o[k] = isObj(v) && isObj(a[k]) ? merge(a[k], v) : v; return o; };

export function loadLandings(root, { PROJECTS, INDUSTRIES = [], SERVICE_PAGES = [], ZD_PAGES = new Set(), workPaths = [] }) {
  const dir = join(root, "site", "landings");
  let files = [];
  try { files = readdirSync(dir).filter((f) => f.endsWith(".json") && !f.startsWith("_")); } catch { return []; }
  let shared = {};
  try { shared = JSON.parse(readFileSync(join(dir, "_shared.json"), "utf8")); } catch (e) { console.warn("[lp] _shared.json:", e.message); }
  const work = new Set(workPaths.map((p) => p.replace(/^\/work\/|\/$/g, "")));
  const out = [];
  for (const f of files) {
    let c;
    try { c = merge(shared, JSON.parse(readFileSync(join(dir, f), "utf8"))); } catch (e) { console.warn(`[lp] ${f}: not valid JSON, skipped (${e.message})`); continue; }
    const slug = c.slug || f.slice(0, -5);
    if (!/^[a-z0-9-]+$/.test(slug)) { console.warn(`[lp] ${f}: slug "${slug}" must be lower-case letters, digits and dashes`); continue; }
    const langs = c.lang === "ro" ? ["ro"] : c.lang === "en" ? ["en"] : ["en", "ro"];
    const warn = (m) => console.warn(`[lp] ${slug}: ${m}`);
    // the cases: a list of slugs, or a filter ({ street, max, exclude }); never a Zdrovit page (TASK-122: Daniel)
    let cases = Array.isArray(c.cases) ? c.cases : [];
    if (!cases.length && c.caseFilter) {
      const flt = c.caseFilter, ind = INDUSTRIES.find((x) => x.street === flt.street);
      const order = ind ? ind.cases : [];
      cases = [...new Set(PROJECTS.filter((p) => p.page && !p.small && p.street === flt.street).map((p) => p.page))]
        .filter((s) => !(flt.exclude || []).includes(s))
        .sort((a, b) => (order.indexOf(a) + 1 || 999) - (order.indexOf(b) + 1 || 999))
        .slice(0, flt.max || 6);
    }
    cases = cases.filter((s) => {
      if (ZD_PAGES.has(s) || s === "zdrovit") { warn(`case "${s}" is a Zdrovit page, left out`); return false; }
      if (!work.has(s)) { warn(`case "${s}" has no /work/ page, left out`); return false; }
      if (!PROJECTS.some((p) => p.page === s)) { warn(`case "${s}" has no portfolio card, left out`); return false; }
      return true;
    });
    if (cases.length < 3 || cases.length > 6) warn(`${cases.length} cases (3 to 6 expected)`);
    const services = (c.services || []).filter((s) => SERVICE_PAGES.some((x) => x.slug === s) || (warn(`service "${s}" unknown, left out`), false));
    for (const n of c.logos || []) if (!PROJECTS.some((p) => p.name === n)) warn(`logo "${n}" is not a client name in site/data.mjs (shown as a word)`);
    for (const x of c.proof || []) if (x.case && !work.has(x.case)) warn(`proof from "${x.case}", which has no /work/ page`);

    // the English words for the renderer, and the Romanian ones for the dictionary: every { en, ro } in the config,
    // wherever it sits; a two-pill title (a key ending in "title"/"Title" holding two texts) also as "A | B"
    const ro = {}, missingRo = [];
    const T = (v, where) => {
      if (langs.includes("ro")) {
        if (!v.ro) missingRo.push(where);
        else { ro[esc(v.en)] = esc(v.ro); ro[v.en] = esc(v.ro); }
      }
      return v.en;
    };
    const R = (v, where) => {
      if (isText(v)) return T(v, where);
      if (Array.isArray(v)) {
        if (/title$/i.test(where) && v.length && v.every(isText)) {
          const en = v.map((x, i) => T(x, `${where}[${i}]`));
          if (v.length > 1 && v.every((x) => x.ro)) ro[en.map(esc).join(" | ")] = v.map((x) => esc(x.ro)).join(" | ");
          return en;
        }
        return v.map((x, i) => R(x, `${where}[${i}]`));
      }
      if (v && typeof v === "object") return Object.fromEntries(Object.entries(v).filter(([k]) => !k.startsWith("_")).map(([k, x]) => [k, R(x, where ? `${where}.${k}` : k)]));
      return v;
    };
    const { campaign, cases: _c, caseFilter: _f, services: _s, ...words } = c;
    const L = { ...R(words, ""), slug, path: `/lp/${slug}/`, cases, services, freebieHref: c.freebie?.href || "/thecore30/lite" };
    L.headA = L.headline?.a || ""; L.headB = L.headline?.b || L.headA;
    if ((L.steps || []).length !== 4) warn(`${L.steps.length} steps (4 expected)`);
    if ((L.benefits || []).length !== 3) warn(`${L.benefits.length} benefits (3 expected)`);
    if (missingRo.length) warn(`no Romanian for: ${missingRo.join(", ")}`);
    out.push({ slug, langs, L, ro, campaign: campaign || null, vertical: c.vertical || "" });
  }
  return out;
}
