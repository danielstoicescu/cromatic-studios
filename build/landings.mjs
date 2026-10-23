// TASK-122: landing pages for ads campaigns, made from config. One file per landing, site/landings/<slug>.json, on top
// of the shared words in site/landings/_shared.json (any key of a landing replaces the shared one). The build writes
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
    try { c = { ...shared, ...JSON.parse(readFileSync(join(dir, f), "utf8")) }; } catch (e) { console.warn(`[lp] ${f}: not valid JSON, skipped (${e.message})`); continue; }
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

    // the English words for the renderer, and the Romanian ones for the dictionary
    const ro = {}, missingRo = [];
    const T = (v, where) => {
      if (!isText(v)) { if (v != null) warn(`${where}: expected { "en", "ro" }`); return String(v ?? ""); }
      if (langs.includes("ro")) {
        if (!v.ro) missingRo.push(where);
        else { ro[esc(v.en)] = esc(v.ro); ro[v.en] = esc(v.ro); }
      }
      return v.en;
    };
    const P = (pair, where) => {
      const a = T(pair[0], where + "[0]"), b = pair[1] ? T(pair[1], where + "[1]") : "";
      if (b && isText(pair[0]) && isText(pair[1]) && pair[0].ro && pair[1].ro) ro[`${esc(a)} | ${esc(b)}`] = `${esc(pair[0].ro)} | ${esc(pair[1].ro)}`;
      return b ? [a, b] : [a];
    };
    const L = {
      slug, path: `/lp/${slug}/`, color: c.color,
      title: T(c.title, "title"), desc: T(c.desc, "desc"),
      eyebrow: T(c.eyebrow, "eyebrow"), headA: T(c.headline?.a, "headline.a"), headB: T(c.headline?.b || c.headline?.a, "headline.b"),
      lead: T(c.lead, "lead"), cta: T(c.cta, "cta"), logosLabel: T(c.logosLabel, "logosLabel"), logos: c.logos || [],
      benefitsEyebrow: T(c.benefitsEyebrow, "benefitsEyebrow"), benefitsTitle: P(c.benefitsTitle || [], "benefitsTitle"),
      benefits: (c.benefits || []).map((x, i) => ({ t: T(x.t, `benefits[${i}].t`), p: T(x.p, `benefits[${i}].p`) })),
      casesEyebrow: T(c.casesEyebrow, "casesEyebrow"), casesTitle: P(c.casesTitle || [], "casesTitle"), cases,
      servicesEyebrow: T(c.servicesEyebrow, "servicesEyebrow"), servicesTitle: P(c.servicesTitle || [], "servicesTitle"), services,
      stepsEyebrow: T(c.stepsEyebrow, "stepsEyebrow"), stepsTitle: P(c.stepsTitle || [], "stepsTitle"),
      steps: (c.steps || []).map((x, i) => ({ t: T(x.t, `steps[${i}].t`), p: T(x.p, `steps[${i}].p`) })),
      freebieHref: c.freebie?.href || "/thecore30/lite",
      freebie: { eyebrow: T(c.freebie?.eyebrow, "freebie.eyebrow"), title: T(c.freebie?.title, "freebie.title"), p: T(c.freebie?.p, "freebie.p"), note: T(c.freebie?.note, "freebie.note"),
        items: (c.freebie?.items || []).map((x, i) => ({ k: T(x.k, `freebie.items[${i}].k`), t: T(x.t, `freebie.items[${i}].t`) })) },
      proofEyebrow: T(c.proofEyebrow, "proofEyebrow"), proofTitle: P(c.proofTitle || [], "proofTitle"),
      proof: (c.proof || []).map((x, i) => (x.q ? { q: T(x.q, `proof[${i}].q`), by: T(x.by, `proof[${i}].by`) } : { n: typeof x.n === "string" ? x.n : T(x.n, `proof[${i}].n`), t: T(x.t, `proof[${i}].t`) })),
      contact: { eyebrow: T(c.contact?.eyebrow, "contact.eyebrow"), title: P(c.contact?.title || [], "contact.title"), lead: T(c.contact?.lead, "contact.lead") }
    };
    if (L.steps.length !== 4) warn(`${L.steps.length} steps (4 expected)`);
    if (L.benefits.length !== 3) warn(`${L.benefits.length} benefits (3 expected)`);
    if (missingRo.length) warn(`no Romanian for: ${missingRo.join(", ")}`);
    out.push({ slug, langs, L, ro, campaign: c.campaign || null, vertical: c.vertical || "" });
  }
  return out;
}
