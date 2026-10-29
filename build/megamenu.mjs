// r365 (Daniel, 28 Oct; beta only, through beta/nav2.patch): the Street Index as the header's mega menu. "Work" in the
// website's header opens it: the sentence filter and the search on top, Coffee Street, Fintech Boulevard and Medical
// Avenue in three columns, The Shortest Shortcut as a row along the bottom, and a preview of the brand you point at
// (its cover and a mini gallery). On a phone it is a full-screen sheet: the filter, then each street as a rail of covers.
// Written into every English page that carries the site header, after the case pages exist (their pictures make the
// galleries) and before the Romanian pass (so site/i18n/ro.json translates it and ro.missing.json lists what it lacks).
// Its look and behaviour: site/megamenu.css + site/megamenu.js, appended to the site's own stylesheet and script.
// Pictures: nothing loads until the menu opens; every picture is a small WebP copy from site/.img-cache (480 for the
// lists and the gallery, 960 for the preview), the original only when no copy exists.
import { readFileSync, existsSync, copyFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";
import { createHash } from "node:crypto";
import { chaptersOf, caseGallery, SI_WORDS } from "./streetindex.mjs";

const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const pad = (n) => String(n).padStart(2, "0");

export function makeMegaMenu({ root, pub, R, COVERS }) {
  const cache = join(root, "site", ".img-cache");
  const sized = new Map();
  // the picture at about `w` px wide: the image pass's own copy (same content hash, same name), else the file itself
  const at = (src, w) => {
    if (!src || !src.startsWith("/assets/")) return src || "";
    const key = src + "@" + w;
    if (sized.has(key)) return sized.get(key);
    let out = src;
    try {
      const h = createHash("sha1").update(readFileSync(join(pub, src))).digest("hex").slice(0, 12);
      for (const ww of w <= 480 ? [480, 960] : [960, 1600, 480]) {
        const name = [`${h}-${ww}.webp`, `${h}-${ww}s.webp`].find((n) => existsSync(join(cache, n)));
        if (!name) continue;
        mkdirSync(join(pub, "assets", "w"), { recursive: true });
        if (!existsSync(join(pub, "assets", "w", name))) copyFileSync(join(cache, name), join(pub, "assets", "w", name));
        out = `/assets/w/${name}`; break;
      }
    } catch {}
    sized.set(key, out);
    return out;
  };
  // a picture's two sizes; the image pass's copies (same hash, two widths) as one short token, "hash.960.480"
  const pair = (big, small) => { const a = /^\/assets\/w\/([0-9a-f]{12})-(\w+)\.webp$/.exec(big), b = /^\/assets\/w\/([0-9a-f]{12})-(\w+)\.webp$/.exec(small); return a && b && a[1] === b[1] ? `${a[1]}.${a[2]}.${b[2]}` : `${big},${small}`; };
  const W = SI_WORDS.en;
  const streets = R.workStreets(COVERS);
  const total = streets.reduce((n, s) => n + s.list.length + (s.zd.length ? 1 : 0), 0);
  const gal = {};
  const pics = (cover, page) => {
    if (page && !gal[page]) gal[page] = caseGallery(pub, page, 6);
    return [...new Set([cover, ...((page && gal[page]) || [])].filter(Boolean))].slice(0, 4).map((u) => pair(at(u, 960), at(u, 480))).join(" ");
  };
  const item = (s, id, { name, cat, desc, poster, href, cover, page, wip, ch, c, extra = "" }) => {
    const ps = pics(cover, page), t0 = ps.split(" ")[0], th = !ps ? "" : t0.includes(",") ? t0.split(",")[1] : `/assets/w/${t0.split(".")[0]}-${t0.split(".")[2]}.webp`;
    const q = [name, cat, poster, s.street, extra].join(" ").toLowerCase().replace(/\s+/g, " ").trim();
    return `<li><a class="mm-i" href="${href}" data-id="${id}" data-ch="${ch}" data-q="${esc(q)}" data-pics="${esc(ps)}" data-c="${esc(/^#[0-9a-f]{3,8}$/i.test(c || "") ? c : s.col)}"${page ? "" : ' data-nocase=""'} aria-describedby="mmd-${id}">`
      + `<span class="mm-th" aria-hidden="true">${th ? `<img alt="" data-src="${th}" decoding="async">` : ""}</span>`
      + `<span class="mm-t"><span class="mm-nm">${esc(name)}</span>${wip ? ` <span class="mm-wip mono">Work in progress</span>` : ""}<span class="mm-ct mono">${esc(cat)}</span></span>`
      + `<span class="mm-d" id="mmd-${id}" hidden>${esc(desc)}</span></a></li>`;
  };
  const street = (s, si) => {
    const rows = s.list.map((p, i) => item(s, `${s.k}${pad(i + 1)}`, { name: p.name, cat: p.cat, desc: p.desc, poster: p.poster, href: p.page ? `/work/${p.page}/` : `/site/#street-${s.k.toLowerCase()}`, cover: p.cover, page: p.page, wip: p.wip, c: p.c, ch: chaptersOf(p).join(" ") }));
    if (s.zd.length) {
      const first = s.zd.find((b) => b.page && b.cover);
      rows.push(item(s, `${s.k}zd`, { name: W.yard(s.zd.length), cat: "Beauty & Supplement Park", desc: s.zd.map((b) => b.name).join(", "), poster: "", href: s.slug ? `/industries/${s.slug}/` : `/site/#street-${s.k.toLowerCase()}`, cover: first?.cover, page: first?.page, ch: "voice world crowd", extra: "zdrovit " + s.zd.map((b) => `${b.name} ${b.line}`).join(" ") }));
    }
    const n = s.list.length + (s.zd.length ? 1 : 0);
    return `<section class="mm-st${s.k === "D" ? " mm-row" : ""}" data-k="${s.k}" style="--sc:${s.col}" aria-labelledby="mmh-${s.k}">
<div class="mm-sh"><span class="mm-no mono" aria-hidden="true">${pad(si + 1)}</span><h2 class="mm-sn" id="mmh-${s.k}">${esc(s.street)}</h2><span class="mm-sc mono" data-n="${n}">${pad(n)}</span></div>
<ul class="mm-ul">${rows.join("")}</ul>
<p class="mm-none mono" hidden>Nothing here for that</p>
</section>`;
  };
  const opt = (v, l) => `<option value="${v}">${esc(l)}</option>`;
  const html = `<div class="mm" id="mm" role="dialog" aria-modal="true" aria-labelledby="mm-title" data-total="${total}" hidden>
<div class="mm-scroll" tabindex="-1">
<div class="mm-in">
<div class="mm-top"><p class="mm-k mono" id="mm-title">The Street Index</p><button class="mm-x" type="button" aria-label="Close the menu"><i aria-hidden="true"></i></button></div>
<form class="mm-f" role="search" action="/site/#work">
<p class="mm-sent"><span class="mm-dim">${W.show}</span> <label class="mm-sel"><span class="mm-sr">${W.show}</span><select name="ch">${opt("", W.all)}${Object.entries(W.chapters).map(([v, l]) => opt(v, l)).join("")}</select></label> <span class="mm-dim mm-on">${W.on}</span> <label class="mm-sel"><span class="mm-sr">${W.on}</span><select name="st">${opt("", W.every)}${streets.map((s) => opt(s.k, s.street)).join("")}</select></label></p>
<span class="mm-opts" hidden><span data-v="ch:">${W.all}</span>${Object.entries(W.chapters).map(([v, l]) => `<span data-v="ch:${v}">${esc(l)}</span>`).join("")}<span data-v="st:">${W.every}</span></span>
<div class="mm-tools"><label class="mm-search"><span class="mm-sr">${W.searchLabel}</span><svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="10.5" cy="10.5" r="6.5"/><path d="M15.5 15.5 21 21"/></svg><input type="search" name="q" placeholder="${esc(W.search)}" autocomplete="off" spellcheck="false" enterkeyhint="go"><button type="button" class="mm-clear mono" hidden>${W.clear}</button></label>
<p class="mm-count" aria-live="polite"></p></div>
</form>
<div class="mm-grid">
${streets.map(street).join("\n")}
<aside class="mm-pv" aria-hidden="true">
<a class="mm-cv" href="/site/#work" tabindex="-1"><img class="mm-lq" alt="" decoding="async"><img class="mm-im" alt="" decoding="async"><img class="mm-im" alt="" decoding="async"></a>
<div class="mm-gal"></div>
<p class="mm-pk mono"><span class="mm-pst"></span> <span class="mm-pnum"></span></p>
<p class="mm-pn"></p>
<p class="mm-pc mono"></p>
<p class="mm-pd"></p>
<p class="mm-pgo"><span class="mm-go-case">Open the case</span><span class="mm-go-st">See it on its street</span> <span aria-hidden="true">→</span></p>
</aside>
</div>
<div class="mm-empty" hidden><p class="mm-e1">Nothing for that yet.</p><p class="mm-e2">Try a client, a field or a street.</p><button type="button" class="mm-reset">Show all the work</button></div>
<p class="mm-foot"><a href="/site/#work">Every project, street by street <span aria-hidden="true">→</span></a></p>
</div>
</div>
</div>
<div class="mm-scrim" hidden></div>`;

  let n = 0;
  // the header: "Work" becomes the menu's button (the link stays for a page without the script), the phone menu
  // gets the same button, and the menu itself sits right after the header (r371: not inside it; the header's
  // backdrop-filter made it the panel's containing block, so the panel travelled with the header)
  const inject = (page) => {
    if (!page.includes('<header class="hdr">') || page.includes('id="mm"')) return page;
    const btn = (cls) => `<button class="mm-btn${cls}" type="button" aria-expanded="false" aria-controls="mm" aria-haspopup="dialog"><span>Work</span><i aria-hidden="true"></i></button>`;
    let out = page
      .replace(/(<nav class="nav" aria-label="Main">\s*)<a href="((?:\/site\/)?#work)">Work<\/a>/, (m, a, h) => `${a}${btn("")}<a class="mm-alt" href="${h}">Work</a>`)
      .replace(/(<nav id="mnav" class="mnav" aria-label="Mobile">\s*)<a href="((?:\/site\/)?#work)">Work<\/a>/, (m, a, h) => `${a}${btn(" mm-mb")}<a class="mm-alt" href="${h}">Work</a>`);
    const i = out.indexOf("</header>", out.indexOf('<header class="hdr">'));
    if (i < 0 || !out.includes('class="mm-btn')) return page;
    n++;
    const j = i + "</header>".length;
    return out.slice(0, j) + "\n" + html + out.slice(j);
  };
  return { inject, count: () => n, total, bytes: html.length };
}
