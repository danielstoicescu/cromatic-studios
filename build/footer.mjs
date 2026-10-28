// r139c (audit N49): one small footer on every page of the website and on every case page, whatever made the page
// (site/render.mjs, site/cases/*.html, Steam, the canvases), in English and in Romanian: the studio, its street and
// address, Privacy, Cookies (data-cookies reopens the consent card, build/consent.mjs), how the site works
// (/onboarding/) and the other language. It sits after </main>, so the shared ending ("Ready to fly") stays the last
// block of the content. The company's legal details are NOT here: they live on the privacy page only (Daniel).
// Pages made by site/render.mjs already end in their big footer: the strip takes the place of its last line there
// (<div class="cz-foot" data-czf>). Inside the map's frame (html.embed) it shrinks to © · Privacy · Cookies.
// Added after the Romanian pages are built (one pass over public/), so each language gets its own words and links.

const T = {
  en: { street: "Str. Olari 9, Bucharest", privacy: ["Privacy", "/privacy/"], cookies: "Cookies", how: ["How this site works", "/onboarding/"], nav: "Legal and language", other: ["RO", "ro", "Română"] },
  ro: { street: "Str. Olari 9, București", privacy: ["Confidențialitate", "/ro/confidentialitate/"], cookies: "Cookie-uri", how: ["Cum funcționează site-ul", "/ro/onboarding/"], nav: "Date legale și limbă", other: ["EN", "en", "English"] }
};

export const FOOTER_CSS = `<style id="czf-css">.cz-foot{box-sizing:border-box;margin:0;padding:22px 20px max(22px,env(safe-area-inset-bottom));border-top:1.5px solid rgba(13,12,9,.14);background:transparent;color:#4a463e;font:500 12px/1.5 'JetBrains Mono',ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;letter-spacing:.02em;text-align:left}.cz-foot .czf-in{max-width:1140px;margin:0 auto;display:flex;flex-wrap:wrap;align-items:center;justify-content:space-between;gap:6px 24px}.cz-foot p{margin:0;max-width:none;color:inherit;font:inherit}.cz-foot a{color:#0d0c09;text-decoration:underline;text-decoration-thickness:1px;text-underline-offset:3px;text-decoration-color:rgba(13,12,9,.35)}.cz-foot a:hover{text-decoration-color:#FED012;text-decoration-thickness:3px}.cz-foot a:focus-visible{outline:3px solid #119BFE;outline-offset:2px;border-radius:4px}.cz-foot .czf-nav{display:flex;flex-wrap:wrap;align-items:center;gap:0 4px;margin:0;padding:0;list-style:none}.cz-foot .czf-nav li{display:flex;align-items:center}.cz-foot .czf-nav li+li::before{content:"·";margin-right:4px;opacity:.6}.cz-foot .czf-nav a{display:inline-block;padding:5px 2px}.cz-foot .czf-lang a{font-weight:800;text-decoration:none;border:1.5px solid #0d0c09;border-radius:999px;padding:3px 9px;margin-left:2px}.cz-foot .czf-lang a:hover{background:#FED012}.ftr .cz-foot{margin-top:28px;padding:0;border-top:0}.ftr .cz-foot .czf-in{max-width:none;padding-top:18px;border-top:1.5px solid rgba(13,12,9,.12)}.cz-foot.czf-dark{color:rgba(251,250,245,.72);border-top-color:rgba(251,250,245,.16)}.cz-foot.czf-dark a{color:#fbfaf5;text-decoration-color:rgba(251,250,245,.4)}.cz-foot.czf-dark .czf-lang a{border-color:#fbfaf5}.cz-foot.czf-dark .czf-lang a:hover{color:#0d0c09}html.embed .cz-foot{padding:12px 16px 16px}html.embed .cz-foot .czf-st,html.embed .cz-foot .czf-mail,html.embed .cz-foot .czf-how,html.embed .cz-foot .czf-lang{display:none}html.embed .ftr .cz-foot{margin-top:0}html.embed .ftr .cz-foot .czf-in{padding:12px 0 16px;border-top:0}@media (max-width:600px){.cz-foot{padding-left:16px;padding-right:16px}.cz-foot .czf-in{flex-direction:column;align-items:flex-start}.cz-foot .czf-nav{gap:0 14px}.cz-foot .czf-nav li+li::before{content:none}}@media print{.cz-foot .czf-nav{display:none}}.czf-addr{font-style:normal;display:flex;flex-wrap:wrap;align-items:center;gap:8px 14px;margin:0 0 12px;width:100%;flex:0 0 100%;font-size:14px;font-weight:600;line-height:1.4}.czf-addr b{font-weight:800}.czf-dir{display:inline-flex;align-items:center;gap:6px;padding:6px 12px;border-radius:999px;background:#0d0c09;color:#fff!important;text-decoration:none!important;font:700 13px/1 system-ui,sans-serif}.czf-dir svg{color:#0d0c09}.czf-dark .czf-dir{background:#fbfaf5;color:#0d0c09!important}.czf-dark .czf-dir svg{color:#0d0c09}</style>`;

// the strip's inner markup, for a page in `lang`, `other` = the page in the other language (or null)
// r363 (Daniel): Google Maps directions to the studio (build/seo.mjs STUDIO's address), on pages without the big footer
const DIR = "https://www.google.com/maps/dir/?api=1&amp;destination=" + encodeURIComponent("Cromatic Studios, Strada Olari 9, 024056 București, Romania");
const DIRW = { en: ["Strada Olari 9, 024056 Bucharest, Sector 2", "Get directions"], ro: ["Strada Olari 9, 024056 București, Sector 2", "Cum ajungi"] };
export function footerInner(lang, other, lp = false, dir = false) {
  const t = T[lang] || T.en, y = new Date().getFullYear(), dw = DIRW[lang] || DIRW.en;
  const addr = dir ? `<address class="czf-addr"><b>${dw[0]}</b> <a class="czf-dir" href="${DIR}" target="_blank" rel="noopener"><svg viewBox="0 0 16 20" width="12" height="15" aria-hidden="true"><path d="M8 19s6-6.1 6-10.6A6 6 0 0 0 2 8.4C2 12.9 8 19 8 19z" fill="#FED012" stroke="currentColor" stroke-width="1.8"/><circle cx="8" cy="8.3" r="2.2" fill="currentColor"/></svg>${dw[1]}</a></address>` : "";
  const sw = other ? `<li class="czf-lang"><a href="${other}" hreflang="${t.other[1]}" lang="${t.other[1]}" title="${t.other[2]}">${t.other[0]}</a></li>` : "";
  return `<div class="czf-in">${addr}<p class="czf-id">© ${y} Cromatic Studios<span class="czf-st"> · ${t.street}</span><span class="czf-mail"> · <!--email_off--><a href="mailto:hi@cromaticstudios.com">hi@cromaticstudios.com</a><!--/email_off--></span></p><ul class="czf-nav" aria-label="${t.nav}"><li><a href="${t.privacy[1]}">${t.privacy[0]}</a></li><li><a href="#cookies" data-cookies>${t.cookies}</a></li>${lp ? "" : `<li class="czf-how"><a href="${t.how[1]}">${t.how[0]}</a></li>`}${sw}</ul></div>`;
}

/**
 * Adds the footer to one built page. `rel` is the file's path under public/ ("work/x/index.html"). Returns the page
 * unchanged when it is not one of ours (the 3D drive "/", 404) or already has the strip.
 */
export function withFooter(html, rel, SITE) {
  rel = rel.replace(/\\/g, "/");
  if (rel === "index.html" || rel === "404.html" || !/(^|\/)index\.html$/.test(rel) || html.includes('class="czf-in"')) return html;
  const lang = /<html[^>]*\blang="ro/.test(html) ? "ro" : "en";
  const alt = new RegExp(`<link rel="alternate" hreflang="${lang === "ro" ? "en" : "ro"}" href="([^"]+)"`).exec(html);
  const other = alt ? alt[1].replace(SITE, "") || "/" : null;
  // TASK-122: an ads landing (/lp/, /ro/lp/) keeps only Privacy and Cookies: no way out of the page
  const isLp = /^(ro\/)?lp\//.test(rel), big = /<div class="cz-foot" data-czf(?:="")?><\/div>/.test(html);
  const inner = footerInner(lang, other, isLp, !isLp && !big);
  let out = html, done = false;
  // 1. the website's own footer (site/render.mjs) keeps its place for the strip
  out = out.replace(/<div class="cz-foot" data-czf(?:="")?><\/div>/, () => { done = true; return `<div class="cz-foot"><div class="wrap">${inner}</div></div>`; });
  // 2. /onboarding/ (dark): the strip under its own footer line
  if (!done && /<footer class="foot">/.test(out)) out = out.replace(/(<footer class="foot">[\s\S]*?)(<\/footer>)/, (m, a, b) => { done = true; return `${a}<div class="cz-foot czf-dark">${inner}</div>${b}`; });
  // 3. everything else: its own <footer>, right after </main>
  if (!done) {
    const i = out.lastIndexOf("</main>");
    if (i < 0) return html;
    out = out.slice(0, i + 7) + `\n<footer class="cz-foot">${inner}</footer>` + out.slice(i + 7);
  }
  return out.replace(/<\/head>/, `${FOOTER_CSS}\n${langMemo(lang)}\n</head>`);
}
// beta 3.60 r222c (Daniel/Adina, P0: "not everything translates when switching language"): every page of the website
// remembers the language it is read in, for the 3D map ("/" has no Romanian UI of its own; its doors follow this: the case
// pages open in Romanian, "Normal website" leads to /ro/, the cookie card speaks Romanian). Not inside the map's frame
// (?embed=1, html.embed): there the map chose the page's language itself
const langMemo = (lang) => `<script>try{if(!/[?&]embed=1/.test(location.search))localStorage.setItem("cz-lang","${lang}")}catch(e){}</script>`;
