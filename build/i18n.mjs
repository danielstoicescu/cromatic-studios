// r133: the Romanian website. Every English page of the plain website (/site/, the industries, the services, the
// team and the case studies) is rebuilt under /ro/ from a translation dictionary, site/i18n/ro.json, keyed by the
// English text of each block (whitespace collapsed). Same markup, pictures and schema; only the words change. A
// block with no translation stays English and is listed in site/i18n/ro.missing.json for the next translation pass.
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "node:fs";
import { join } from "node:path";
import { parse } from "node-html-parser";

export const RO_SLUGS = {
  "/site/": "/ro/",
  "/team/": "/ro/echipa/",
  "/privacy/": "/ro/confidentialitate/", // r136
  "/onboarding/": "/ro/onboarding/", // r139c (N34): the launch page, translated in build.mjs
  "/industries/coffee-food-drink/": "/ro/industrii/cafea-mancare-bauturi/",
  "/industries/finance-fintech/": "/ro/industrii/finante-fintech/",
  "/industries/healthcare/": "/ro/industrii/sanatate/",
  "/industries/print-merch/": "/ro/industrii/print-merch/",
  "/services/brand-strategy/": "/ro/servicii/strategie-de-brand/",
  "/services/brand-identity/": "/ro/servicii/identitate-vizuala/",
  "/services/websites-apps/": "/ro/servicii/site-uri-si-aplicatii/",
  "/services/video-production/": "/ro/servicii/productie-video/",
  "/services/social-media-content/": "/ro/servicii/continut-social-media/"
};
export const roPath = (p) => RO_SLUGS[p] || (p.startsWith("/work/") ? "/ro/proiecte/" + p.slice(6) : null);

const norm = (t) => String(t).replace(/\s+/g, " ").trim();
const hasWords = (t) => /[A-Za-z]{2,}/.test(t.replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " "));
const INLINE = new Set(["strong", "b", "em", "i", "mark", "u", "small", "sup", "sub", "br", "code", "abbr", "a", "span", "q", "s", "time"]);
const SKIP = new Set(["script", "style", "noscript", "svg", "template", "code", "pre", "video", "iframe", "select", "title", "head"]);
// beta 3.48 r217: in schema.org, a text with no lower-case word (a name: "Cromatic Studios", "Two Minutes") stays as it is
const JSONLD_KEEP = { test: (t) => !/(?:^|[\s(·:,/-])[a-zăâîșț][a-zăâîșț'’]+/.test(t) };
const ATTRS = ["alt", "aria-label", "title", "placeholder", "data-label", "data-title"]; // beta 3.48 r217: + data-title (the films' facades)

// the translatable blocks of a page: the first element on each branch that holds words of its own
function walk(node, out) {
  for (const el of node.childNodes) {
    if (el.nodeType !== 1) continue;
    const tag = el.rawTagName?.toLowerCase();
    if (!tag) continue;
    // beta 3.48 r217 (Daniel, QA round 2): a film or a frame keeps its insides, but its own label is read out: translated
    if (SKIP.has(tag)) { if (tag === "video" || tag === "iframe") for (const a of ATTRS) { const v = el.getAttribute?.(a); if (v && hasWords(v)) out.push({ el, attr: a, key: norm(v) }); } continue; }
    for (const a of ATTRS) { const v = el.getAttribute?.(a); if (v && hasWords(v)) out.push({ el, attr: a, key: norm(v) }); }
    const kids = el.childNodes.filter((c) => c.nodeType === 1);
    // a title made of pills (<h2 class="ptitle">, <span class="pill-title">): translated as one phrase, the pills
    // separated by " | " ("The | crew" -> "Iată | echipa"), so Romanian word order can move across the pills
    if ((/\b(?:ptitle|pill-title)\b/.test(el.getAttribute("class") || "") || /^h[1-6]$/.test(tag)) && kids.length > 1 && kids.every((c) => /\bpill\b/.test(c.getAttribute("class") || "")) && !el.childNodes.some((c) => c.nodeType === 3 && hasWords(c.rawText))) {
      out.push({ el, pills: kids, key: kids.map((c) => norm(c.innerHTML)).join(" | ") }); continue;
    }
    // a title set word by word (<span class="w">): one block, rebuilt word by word
    if (kids.length && kids.every((c) => c.rawTagName === "span" && /\bw\b/.test(c.getAttribute("class") || "")) && hasWords(el.text)) {
      out.push({ el, words: true, key: norm(el.text) }); continue;
    }
    const ownText = el.childNodes.some((c) => c.nodeType === 3 && hasWords(c.rawText));
    if (ownText && !(INLINE.has(tag) && el.parentNode && el.parentNode.childNodes.some((c) => c.nodeType === 3 && hasWords(c.rawText)))) {
      const inner = norm(el.innerHTML);
      // inline children must not carry blocks or images; otherwise keep descending
      if (!/<(?:p|div|h[1-6]|ul|ol|li|figure|section|article|img|video|picture|svg|button|nav|table)\b/i.test(inner)) { out.push({ el, key: inner }); continue; }
    }
    walk(el, out);
  }
}

export function makeI18n(root) {
  const dictFile = join(root, "site", "i18n", "ro.json");
  let dict = {};
  try { dict = JSON.parse(readFileSync(dictFile, "utf8")); } catch {}
  const D = new Map(Object.entries(dict).map(([k, v]) => [norm(k), v]));
  const missing = new Map(), used = new Map();
  const tr = (key, path) => { const v = D.get(key); if (v != null && v !== "") { if (!used.has(key)) used.set(key, path); return v; } if (!missing.has(key)) missing.set(key, path); return null; };
  // beta 3.48 r217 (Daniel, QA round 2): an entry whose Romanian is the English itself counted as translated, so English left
  // by mistake never showed up in ro.missing.json. Those used on a page that read as English prose (two words or more, an
  // English function word, no Romanian letters, not a Title Case name) are now listed in ro.same.json, unless
  // ro.keep-en.json keeps them in English on purpose (client taglines, the opening's lines since r144, quoted slide text)
  let keepEn = {};
  try { keepEn = JSON.parse(readFileSync(join(root, "site", "i18n", "ro.keep-en.json"), "utf8")); } catch {}
  const KEEP = new Set(Object.keys(keepEn).filter((k) => k !== "_about").map(norm));
  const FW = /^(a|an|the|and|of|to|in|on|for|with|your|our|we|you|is|are|it|its|by|from|at|as|but|or|how|what|who|will|can|one|all|more|that|this|there|s|be|not|no)$/i;
  const looksEnglish = (k) => {
    const t = k.replace(/<[^>]+>/g, " ").replace(/&[a-z#0-9]+;/gi, " ");
    if (/[ăâîșțşţĂÂÎȘȚ]/.test(t)) return false;
    const w = t.match(/[A-Za-z][A-Za-z'’]*/g) || [];
    if (w.length < 2 || !w.some((x) => FW.test(x))) return false;
    return !w.every((x) => x.length < 4 || /^[A-Z]/.test(x)); // a Title Case name ("The One Who Knocks")
  };

  // beta 3.48 r217: the schema.org names the build writes from a pattern ("Bepco: case study", "Brand strategy: case
  // studies", "Bepco video reel, from the Bepco case study by Cromatic Studios.") are translated by the same pattern
  const plain = (t) => { const v = D.get(norm(t)); return v != null && v !== "" ? v.replace(/<[^>]+>/g, "") : null; };
  const ldRule = (t) => {
    let m = /^(.+): case study$/.exec(t); if (m) return `${m[1]}: studiu de caz`;
    m = /^(.+): case studies$/.exec(t); if (m) { const n = plain(m[1]) || plain(m[1].replace(/&/g, "&amp;")); return n || JSONLD_KEEP.test(m[1]) ? `${n || m[1]}: studii de caz` : null; }
    m = /^(.+), (?:a film )?from the (.+) case study by Cromatic Studios\.$/.exec(t); if (m) { const n = plain(m[1]) || (JSONLD_KEEP.test(m[1]) ? m[1] : null); return n ? `${n}, din studiul de caz ${m[2]} de la Cromatic Studios.` : null; }
    return null;
  };
  // EN path -> RO path for every link we rewrite
  const linkRo = (href) => {
    const m = /^(\/[^?#]*)([?#].*)?$/.exec(href);
    if (!m) return href;
    const p = m[1].endsWith("/") ? m[1] : m[1] + "/";
    const r = roPath(p);
    if (!r) return href;
    let tail = m[2] || "";
    return r + tail;
  };

  function translate(html, path, SITE, enPaths) {
    html = html.replace(/<!--(?!\/?email_off)[\s\S]*?-->/g, "");
    const doc = parse(html, { comment: true, blockTextElements: { script: true, noscript: true, style: true, pre: true } });
    const htmlEl = doc.querySelector("html");
    htmlEl?.setAttribute("lang", "ro");
    const body = doc.querySelector("body") || doc.querySelector("html"), head = doc.querySelector("head");
    // the kinetic intro speaks English: the Romanian home opens on its own hero
    body.removeAttribute("data-kz-js"); body.removeAttribute("data-kz-css");
    const blocks = [];
    walk(body, blocks);
    for (const b of blocks) {
      if (b.attr) { const v = tr(b.key, path); if (v) b.el.setAttribute(b.attr, v); continue; }
      const v = tr(b.key, path);
      if (!v) continue;
      if (b.pills) {
        const parts = v.split(" | ");
        b.pills.forEach((pl, k) => { if (k < parts.length) pl.set_content(k === b.pills.length - 1 ? parts.slice(k).join(" ") : parts[k]); else pl.remove(); });
        continue;
      }
      if (b.words) b.el.set_content(v.split(" ").map((w, k) => `<span class="w" style="--k:${k}">${w}</span>`).join(" "));
      else b.el.set_content(v);
    }
    // links to pages that exist in Romanian go to the Romanian page
    for (const a of doc.querySelectorAll("a[href]")) {
      const h = a.getAttribute("href");
      if (!h || !h.startsWith("/")) continue;
      const p = (/^(\/[^?#]*)/.exec(h)?.[1] || "/");
      const pp = p.endsWith("/") ? p : p + "/";
      if (enPaths.has(pp)) a.setAttribute("href", linkRo(h));
    }
    // head: title, description, social cards, canonical, language
    const t = head.querySelector("title");
    if (t) { const v = tr(norm(t.text), path); if (v) t.set_content(v); }
    for (const m of head.querySelectorAll("meta[content]")) {
      const n = m.getAttribute("name") || m.getAttribute("property") || "";
      if (/^(description|og:title|og:description|og:image:alt|twitter:title|twitter:description)$/.test(n)) { const v = tr(norm(m.getAttribute("content")), path); if (v) m.setAttribute("content", v); }
      if (n === "og:locale") m.setAttribute("content", "ro_RO");
      if (n === "og:url") m.setAttribute("content", SITE + roPath(path));
    }
    head.querySelector('link[rel="canonical"]')?.setAttribute("href", SITE + roPath(path));
    // schema.org: the same graph, its words translated where the dictionary has them
    for (const s of head.querySelectorAll('script[type="application/ld+json"]')) {
      try {
        const j = JSON.parse(s.rawText);
        const fix = (o) => {
          if (Array.isArray(o)) return o.map(fix);
          if (o && typeof o === "object") {
            for (const k of Object.keys(o)) {
              // r136 (N28): the page is Romanian; the website (inLanguage ["en", "ro"]) stays the same everywhere
              if (k === "inLanguage") { if (!Array.isArray(o[k])) o[k] = "ro"; }
              // beta 3.48 r217 (Daniel, QA round 2): through tr(), so a schema.org text with no Romanian is listed in ro.missing.json
              // like any block (it stayed English, unseen); and the slogan, the genres and the keywords too
              else if (typeof o[k] === "string" && ["name", "headline", "description", "text", "slogan", "genre", "abstract", "caption"].includes(k) && hasWords(o[k]) && !JSONLD_KEEP.test(o[k])) { const v = ldRule(norm(o[k])) || tr(norm(o[k]), path); if (v) o[k] = v.replace(/<[^>]+>/g, ""); }
              else if (Array.isArray(o[k]) && ["genre", "keywords"].includes(k)) o[k] = o[k].map((x) => { if (typeof x !== "string" || !hasWords(x)) return x; const v = tr(norm(x), path); return v ? v.replace(/<[^>]+>/g, "") : x; });
              else if (typeof o[k] === "string" && (k === "url" || k === "item" || k === "@id" || k === "mainEntityOfPage") && o[k].startsWith(SITE)) {
                const u = o[k].slice(SITE.length), hash = u.includes("#") ? u.slice(u.indexOf("#")) : "", p = u.replace(/#.*$/, "");
                if (enPaths.has(p)) o[k] = SITE + roPath(p) + hash;
              } else o[k] = fix(o[k]);
            }
          }
          return o;
        };
        s.set_content(JSON.stringify(fix(j)).replace(/</g, "\\u003c"));
      } catch {}
    }
    let out = doc.toString();
    // (the parser can drop a bare <body> tag; put it back)
    if (!/<body[\s>]/.test(out)) out = out.replace("</head>", "</head><body>").replace(/<\/html>\s*$/, "</body></html>");
    return out;
  }

  // both languages point at each other (hreflang), and the header gets a language switch
  function alternates(html, enPath, SITE, lang) {
    const ro = roPath(enPath);
    const links = `<link rel="alternate" hreflang="en" href="${SITE}${enPath}">\n<link rel="alternate" hreflang="ro" href="${SITE}${ro}">\n<link rel="alternate" hreflang="x-default" href="${SITE}${enPath}">`;
    html = html.replace("</head>", `${links}\n</head>`);
    const other = lang === "ro" ? enPath : ro, label = lang === "ro" ? "EN" : "RO", name = lang === "ro" ? "English" : "Română";
    const sw = `<a class="lang-sw" href="${other}" hreflang="${label.toLowerCase()}" lang="${label.toLowerCase()}" title="${name}">${label}</a>`;
    if (/<a class="drive-btn"/.test(html)) html = html.replace(/<a class="drive-btn"/, `${sw}<a class="drive-btn"`);
    else html = html.replace(/(<body[^>]*>)/, `$1\n<style>html.embed .lang-fixed{display:none}</style><a class="lang-sw lang-fixed" href="${other}" hreflang="${label.toLowerCase()}" lang="${label.toLowerCase()}" title="${name}" style="position:fixed;right:14px;top:14px;z-index:9999;padding:10px 14px;border-radius:999px;background:#fff;color:#0d0c09;border:2.5px solid #0d0c09;font:800 14px/1 system-ui,sans-serif;text-decoration:none">${label}</a>`);
    return html;
  }

  function sameAsEnglish() {
    const out = {};
    for (const [k, p] of used) { const v = D.get(k); if (norm(v) === k && !KEEP.has(k) && looksEnglish(k)) out[k] = p; }
    try { writeFileSync(join(root, "site", "i18n", "ro.same.json"), JSON.stringify(out, null, 1) + "\n"); } catch {}
    return Object.keys(out).length;
  }
  function saveMissing() {
    const file = join(root, "site", "i18n", "ro.missing.json");
    mkdirSync(join(root, "site", "i18n"), { recursive: true });
    const obj = {};
    for (const [k, p] of missing) obj[k] = p;
    try { writeFileSync(file, JSON.stringify(obj, null, 1) + "\n"); } catch {}
    return missing.size;
  }
  // TASK-122: entries made by the build itself (an ads landing's own "ro" fields, build/landings.mjs), added to the
  // dictionary for this run only; a block they do not cover is still listed in ro.missing.json like any other
  function add(entries) { for (const [k, v] of Object.entries(entries)) if (v != null && v !== "") D.set(norm(k), v); }
  return { translate, alternates, saveMissing, sameAsEnglish, add, keptEnglish: KEEP.size, size: D.size };
}
