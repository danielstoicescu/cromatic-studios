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
const ATTRS = ["alt", "aria-label", "title", "placeholder", "data-label"];

// the translatable blocks of a page: the first element on each branch that holds words of its own
function walk(node, out) {
  for (const el of node.childNodes) {
    if (el.nodeType !== 1) continue;
    const tag = el.rawTagName?.toLowerCase();
    if (!tag || SKIP.has(tag)) continue;
    for (const a of ATTRS) { const v = el.getAttribute?.(a); if (v && hasWords(v)) out.push({ el, attr: a, key: norm(v) }); }
    const kids = el.childNodes.filter((c) => c.nodeType === 1);
    // a title made of pills (<h2 class="ptitle">, <span class="pill-title">): translated as one phrase, the pills
    // separated by " | " ("The | crew" -> "Iată | echipa"), so Romanian word order can move across the pills
    if (/\b(?:ptitle|pill-title)\b/.test(el.getAttribute("class") || "") && kids.length > 1 && kids.every((c) => /\bpill\b/.test(c.getAttribute("class") || ""))) {
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
  const missing = new Map();
  const tr = (key, path) => { const v = D.get(key); if (v != null && v !== "") return v; if (!missing.has(key)) missing.set(key, path); return null; };

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
              if (k === "inLanguage") o[k] = "ro";
              else if (typeof o[k] === "string" && ["name", "headline", "description", "text"].includes(k)) { const v = D.get(norm(o[k])); if (v) o[k] = v.replace(/<[^>]+>/g, ""); }
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

  function saveMissing() {
    const file = join(root, "site", "i18n", "ro.missing.json");
    mkdirSync(join(root, "site", "i18n"), { recursive: true });
    const obj = {};
    for (const [k, p] of missing) obj[k] = p;
    try { writeFileSync(file, JSON.stringify(obj, null, 1) + "\n"); } catch {}
    return missing.size;
  }
  return { translate, alternates, saveMissing, size: D.size };
}
