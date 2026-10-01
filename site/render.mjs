// Renders the lo-fi website: /site/ (home) and /work/<slug>/ (case pages). Plain HTML, a small
// stylesheet and a few lines of script; no WebGL. `A(name)` resolves an asset variable from
// src/app.js to { src, w, h } (src is root-relative, e.g. /assets/abc.png).
import { NAV, CHAPTERS, SERVICES, PROJECTS, CLIENT_BADGES, FRIENDS, CREW, CREW_COLORS, CREW_PHOTOS, OFFICES, FORM, CASES } from "./data.mjs";
import { STUDIO, FAQ } from "../build/seo.mjs";

const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const strip = (h) => String(h).replace(/<[^>]+>/g, "");
const STAR = `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 0 L14.6 7.2 L21.5 4.2 L17.4 10.5 L24 12 L17.4 13.5 L21.5 19.8 L14.6 16.8 L12 24 L9.4 16.8 L2.5 19.8 L6.6 13.5 L0 12 L6.6 10.5 L2.5 4.2 L9.4 7.2 Z"/></svg>`;

export function makeRender({ SITE, A, cssHref, jsHref, fonts, kz }) {
  const img = (name, alt = "", cls = "", eager = false) => {
    const a = A(name);
    if (!a) return "";
    return `<img src="${a.src}"${a.w ? ` width="${a.w}" height="${a.h}"` : ""} alt="${esc(alt)}"${cls ? ` class="${cls}"` : ""}${eager ? ' fetchpriority="high"' : ' loading="lazy"'} decoding="async">`;
  };
  const vid = (name, poster, cls = "") => {
    const a = A(name);
    if (!a) return "";
    const p = poster && A(poster);
    // played only while on screen (site.js); nothing downloads before that
    return `<video class="lv ${cls}" data-src="${a.src}"${p ? ` poster="${p.src}"` : ""} muted loop playsinline preload="none" aria-hidden="true"></video>`;
  };

  const head = ({ title, desc, path, image, ld }) => `<!DOCTYPE html><html lang="en"><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>${esc(title)}</title>
<meta name="description" content="${esc(desc)}">
<meta name="robots" content="index, follow, max-image-preview:large, max-snippet:-1">
<meta name="theme-color" content="#FED012">
<meta name="color-scheme" content="light">
<link rel="canonical" href="${SITE}${path}">
<meta property="og:type" content="website">
<meta property="og:site_name" content="Cromatic Studios">
<meta property="og:locale" content="en_US">
<meta property="og:title" content="${esc(title)}">
<meta property="og:description" content="${esc(desc)}">
<meta property="og:url" content="${SITE}${path}">
<meta property="og:image" content="${image ? SITE + image : SITE + "/og.jpg"}">
<meta name="twitter:card" content="summary_large_image">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<link rel="manifest" href="/site.webmanifest">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="preload" as="style" href="${fonts}" onload="this.onload=null;this.rel='stylesheet'">
<noscript><link rel="stylesheet" href="${fonts}"></noscript>
<link rel="stylesheet" href="${cssHref}">
<script src="${jsHref}" defer></script>
${kz ? `<script>try{if(location.pathname==="/site/"&&!location.hash&&scrollY<40&&!matchMedia("(prefers-reduced-motion: reduce)").matches&&!sessionStorage.getItem("kzSeen")){document.documentElement.classList.add("kz-wait");window.__kzT=setTimeout(function(){document.documentElement.classList.remove("kz-wait")},4000)}}catch(e){}</script>` : ""}
${ld ? `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>` : ""}
</head><body${kz ? ` data-kz-js="${kz.js}" data-kz-css="${kz.css}"` : ""}>`;

  const logo = A("logoLandscape");
  const header = (home) => `<a class="skip" href="#main">Skip to content</a>
<header class="hdr">
  <div class="wrap hdr-in">
    <a class="brand" href="/site/" aria-label="Cromatic Studios, home">${logo ? `<img src="${logo.src}" alt="Cromatic Studios" width="${logo.w}" height="${logo.h}">` : "Cromatic Studios"}</a>
    <nav class="nav" aria-label="Main">
      ${NAV.map(([h, l]) => `<a href="${home ? h : "/site/" + h}">${l}</a>`).join("")}
    </nav>
    <a class="drive-btn" href="/" title="The full 3D experience: drive through Bucharest">${STAR}<span>Take the 3D drive</span></a>
    <button class="menu-btn" aria-label="Menu" aria-expanded="false" aria-controls="mnav"><span></span><span></span></button>
  </div>
  <nav id="mnav" class="mnav" aria-label="Mobile">
    ${NAV.map(([h, l]) => `<a href="${home ? h : "/site/" + h}">${l}</a>`).join("")}
    <a class="drive-btn" href="/">${STAR}<span>Take the 3D drive</span></a>
  </nav>
</header>`;

  const footer = `<footer class="ftr">
  <div class="wrap ftr-in">
    <div>
      ${logo ? `<img class="ftr-logo" src="${logo.src}" alt="Cromatic Studios" width="${logo.w}" height="${logo.h}" loading="lazy">` : ""}
      <p>Independent creative studio. Strategy, identity, web, film and content. Bucharest, since 2014.</p>
    </div>
    <address>
      <b>Strada Olari 9, Bucharest</b><br>
      <a href="mailto:${STUDIO.email}">${STUDIO.email}</a><br>
      <a href="tel:+40728978068">${STUDIO.phone}</a><br>
      <a href="https://www.google.com/maps/search/?api=1&amp;query=Cromatic+Studios+Strada+Olari+9+Bucuresti" target="_blank" rel="noopener">Directions ↗</a>
    </address>
    <div class="ftr-links">
      <a href="/site/#work">Work</a><a href="/site/#services">Services</a><a href="/site/#contact">Start a project</a>
      <a href="/">The 3D drive</a><a href="${STUDIO.legalUrl}">cromaticstudios.com</a>
    </div>
  </div>
  <p class="wrap ftr-note mono">© ${new Date().getFullYear()} Cromatic Studios · There is always a coffee.</p>
</footer>
</body></html>`;

  const pill = (text, color, rot = 0, tag = "span") => `<${tag} class="pill" style="--pc:${color};--rot:${rot}deg">${text}</${tag}>`;

  const projectCard = (p, i) => {
    const media = p.vid ? vid(p.vid, p.img) : p.img ? img(p.img, p.name) : "";
    const badge = p.badge ? img(p.badge, "", "pc-badge") : "";
    const inner = `
      <span class="pc-media" style="--bc:${p.c};--bt:${p.t}">${media || `<span class="pc-poster">${esc(p.poster)}</span>`}${badge}</span>
      <span class="pc-body">
        <span class="pc-cat mono">${esc(p.cat)}</span>
        <span class="pc-name">${esc(p.name)}</span>
        <span class="pc-desc">${esc(p.desc)}</span>
        ${p.page ? `<span class="pc-cta">Read the case <i>→</i></span>` : ""}
      </span>`;
    return p.page
      ? `<a class="pcard${i < 2 ? " big" : ""}" href="/work/${p.page}/">${inner}</a>`
      : `<article class="pcard">${inner}</article>`;
  };

  const contactForm = () => `
  <form class="bform" id="bform" novalidate>
    <div class="bf-strip mono"><span>Cromatic Air</span><span>Flight CS-99</span><span>Olari 9 → your brand</span><span>Seat 1A</span></div>
    <fieldset><legend>What do you dream of?</legend><div class="chips" data-name="dreams" data-multi="1">${FORM.dreams.map((d) => `<button type="button" class="chip" aria-pressed="false">${esc(d)}</button>`).join("")}</div></fieldset>
    <fieldset><legend>What kind of business are you?</legend><div class="chips" data-name="biz">${FORM.biz.map((d) => `<button type="button" class="chip" aria-pressed="false">${esc(d)}</button>`).join("")}</div></fieldset>
    <fieldset><legend>When do you want to take off?</legend><div class="chips" data-name="when">${FORM.when.map((d) => `<button type="button" class="chip" aria-pressed="false">${esc(d)}</button>`).join("")}</div></fieldset>
    <div class="bf-row">
      <label><span>Your name</span><input name="name" autocomplete="name" required></label>
      <label><span>Email</span><input name="email" type="email" autocomplete="email" required></label>
      <label><span>Phone <i>(optional)</i></span><input name="phone" type="tel" autocomplete="tel"></label>
    </div>
    <label class="bf-msg"><span>Tell us a bit about it</span><textarea name="msg" rows="4"></textarea></label>
    <input class="hp" name="company_site" tabindex="-1" autocomplete="off" aria-hidden="true">
    <div class="bf-end">
      <button class="btn btn-y" type="submit">${STAR}<span>Pour the coffee</span></button>
      <p class="bf-status" role="status" aria-live="polite"></p>
    </div>
  </form>`;

  function home() {
    const ld = { "@context": "https://schema.org", "@graph": [
      { "@type": "WebPage", "@id": `${SITE}/site/#page`, url: `${SITE}/site/`, name: "Cromatic Studios · Branding, web & film studio in Bucharest", isPartOf: { "@id": `${SITE}/#website` }, about: { "@id": `${SITE}/#studio` }, inLanguage: "en" },
      { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Cromatic Studios", item: `${SITE}/site/` }] }
    ] };
    const hero = ["sP25b", "tmCover", "steamCoverImg"];
    return `${head({ title: "Cromatic Studios · Branding, web & film studio in Bucharest", desc: STUDIO.description + " Strategy, identity, websites, video and content for indie brands, startups and established companies.", path: "/site/", ld })}
${header(true)}
<main id="main">
  <section class="hero">
    <div class="wrap hero-in">
      <div class="hero-txt">
        <p class="eyebrow mono">Cromatic Studios · Bucharest · Since 2014</p>
        <h1 class="h-manif">Killer <mark>strategy</mark>. Outstanding <mark>design</mark>. Striking <mark>visuals</mark>. Powerful <mark>storytelling</mark>.</h1>
        <p class="lead">Genuine passion and real empathy for your customer. And a coffee. There is always a coffee. An independent studio for brand strategy, identity, websites, film and content.</p>
        <div class="btns"><a class="btn btn-y" href="#contact">${STAR}<span>Start a project</span></a><a class="btn" href="#work">See the work</a></div>
      </div>
      <div class="hero-art" aria-hidden="true">
        ${hero.map((n, i) => `<span class="ha ha${i}">${img(n, "", "", i === 0)}</span>`).join("")}
        <span class="ha-star">${STAR}</span>
      </div>
    </div>
  </section>

  <section class="clients" aria-label="Clients">
    <div class="wrap">
      <p class="eyebrow mono">Brands we grew with</p>
      <div class="logos">${CLIENT_BADGES.map((b) => `<span class="logo">${img(b, "")}</span>`).join("")}</div>
    </div>
  </section>

  <section id="what" class="sec">
    <div class="wrap">
      <p class="eyebrow mono">What we bring to the table</p>
      <h2 class="ptitle">${pill("From a dream", "#28C840", -1.5)}${pill("to a crowd", "#F65342", 1)}</h2>
      <div class="chapters">
        ${CHAPTERS.map((c) => `<article class="chap" style="--cc:${c.c}">
          <span class="chap-k mono">${c.k}</span>
          <h3>${esc(c.t)}</h3>
          <p class="chap-sub mono">${esc(c.sub)}</p>
          <p>${esc(c.p)}</p>
          <ul class="tags">${c.items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
        </article>`).join("")}
      </div>
    </div>
  </section>

  <section id="work" class="sec sec-alt">
    <div class="wrap">
      <p class="eyebrow mono">Selected work</p>
      <h2 class="ptitle">${pill("Coffee Street", "#FED012", -1.5)}${pill("& Digital Avenue", "#B098C8", 1)}</h2>
      <p class="sec-lead">The coffee brands we grew up with, and the products, fintech and platforms we helped win in digital.</p>
      <div class="pgrid">${PROJECTS.map(projectCard).join("")}</div>
      <p class="friends"><span class="mono">Friends we made along the way</span> ${FRIENDS.map((f) => `<span class="fpill">${esc(f)}</span>`).join("")}</p>
    </div>
  </section>

  <section id="services" class="sec">
    <div class="wrap">
      <p class="eyebrow mono">Full tank of services</p>
      <h2 class="ptitle">${pill("What we carry", "#119BFE", -1)}</h2>
      <div class="svcs">
        ${SERVICES.map((s) => `<article class="svc" style="--sc:${s.c}">
          <h3>${esc(s.t)}</h3>
          <p class="mono">${s.items.length} skills on board</p>
          <ul>${s.items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
        </article>`).join("")}
      </div>
    </div>
  </section>

  <section id="studio" class="sec sec-alt">
    <div class="wrap studio">
      <div>
        <p class="eyebrow mono">The crew</p>
        <h2 class="ptitle">${pill("Brilliant", "#28C840", -2)}${pill("humans", "#B098C8", 1.5)}</h2>
        <p class="sec-lead">We discover AI every day, but we are strong believers in the collective power of brilliant humans. Twelve of them, in a house at Strada Olari 9.</p>
        <ul class="crew">${CREW.map((n, i) => `<li style="--cc:${CREW_COLORS[i % CREW_COLORS.length]}">${esc(n)}</li>`).join("")}</ul>
      </div>
      <div class="photos">${CREW_PHOTOS.map((p) => `<figure><img src="${p.src}" alt="${esc(p.cap)}" loading="lazy" decoding="async" width="600" height="450"><figcaption class="mono">${esc(p.cap)}</figcaption></figure>`).join("")}</div>
    </div>
    <div class="wrap">
      <h3 class="tl-h">Six addresses, one studio</h3>
      <ol class="tl">${OFFICES.map((o) => `<li style="--oc:${o.c}"><b>${esc(o.addr)}</b><span class="mono">${esc(o.year || "·")}</span><p>${esc(o.note)}</p></li>`).join("")}</ol>
    </div>
  </section>

  <section id="faq" class="sec">
    <div class="wrap faq">
      <div>
        <p class="eyebrow mono">Good questions</p>
        <h2 class="ptitle">${pill("Before", "#FED012", -1.5)}${pill("the coffee", "#F65342", 1)}</h2>
      </div>
      <div class="qa">${FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</div>
    </div>
  </section>

  <section id="contact" class="sec sec-ink">
    <div class="wrap contact">
      <div class="c-txt">
        <p class="eyebrow mono">Final call · Strada Olari 9</p>
        <h2 class="ptitle">${pill("What do you", "#119BFE", -2)}${pill("dream of?", "#F65342", 1.5)}</h2>
        <p class="sec-lead">Complete your boarding pass and we'll answer within one working day. You get a copy too. Or just come by: the door is open, the coffee is on.</p>
        <p class="c-direct"><a href="mailto:${STUDIO.email}">${STUDIO.email}</a><br><a href="tel:+40728978068">${STUDIO.phone}</a></p>
      </div>
      ${contactForm()}
    </div>
  </section>

  <section class="drive-cta">
    <div class="wrap dc-in">
      <p><b>Prefer the long way round?</b> The same story is also a 3D drive through Bucharest, with a coffee stop and a few surprises.</p>
      <a class="btn btn-y" href="/">${STAR}<span>Take the 3D drive</span></a>
    </div>
  </section>
</main>
${footer}`;
  }

  function caseBlock(b) {
    const n = (b.imgs?.length || 0) + (b.vids?.length || 0) + (b.vid ? 1 : 0);
    const media = [
      ...(b.vid ? [vid(b.vid)] : []),
      ...(b.imgs || []).map((m, i) => `<figure>${img(m, b.caps?.[i] || "")}${b.caps?.[i] ? `<figcaption class="mono">${esc(b.caps[i])}</figcaption>` : ""}</figure>`),
      ...(b.vids || []).map((v) => `<figure>${vid(v)}</figure>`)
    ].join("");
    return `<section class="cblock${b.poster ? " posters" : ""}${b.small ? " small" : ""}">
      ${b.h || b.p ? `<div class="cb-txt">${b.yr ? img(b.yr, b.h, "cb-yr") : b.h ? `<h2>${esc(b.h)}</h2>` : ""}${b.p ? `<p>${b.p}</p>` : ""}</div>` : ""}
      ${n ? `<div class="cb-media n${Math.min(n, 4)}">${media}</div>` : ""}
    </section>`;
  }

  function casePage(slug) {
    const d = CASES[slug];
    const p = PROJECTS.find((x) => x.page === slug);
    const others = PROJECTS.filter((x) => x.page && x.page !== slug);
    const cover = A(p?.img || "");
    const ld = { "@context": "https://schema.org", "@graph": [
      { "@type": "CreativeWork", "@id": `${SITE}/work/${slug}/#work`, name: `${d.name} · case study`, headline: strip(d.title), description: strip(d.lead), genre: p?.cat, creator: { "@id": `${SITE}/#studio` }, url: `${SITE}/work/${slug}/`, image: cover ? SITE + cover.src : undefined, inLanguage: "en" },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Cromatic Studios", item: `${SITE}/site/` },
        { "@type": "ListItem", position: 2, name: "Work", item: `${SITE}/site/#work` },
        { "@type": "ListItem", position: 3, name: d.name, item: `${SITE}/work/${slug}/` }
      ] }
    ] };
    return `${head({ title: `${d.name} · Case study · Cromatic Studios`, desc: strip(d.lead).slice(0, 158), path: `/work/${slug}/`, image: cover?.src, ld })}
${header(false)}
<main id="main" class="case" style="--bc:${d.c};--bt:${d.t}">
  <section class="c-hero">
    <div class="wrap">
      <nav class="crumbs mono" aria-label="Breadcrumb"><a href="/site/">Cromatic Studios</a> / <a href="/site/#work">Work</a> / <span>${esc(d.name)}</span></nav>
      <p class="eyebrow mono">${esc(d.eyebrow)}</p>
      <h1>${esc(d.title)}</h1>
      <p class="lead">${d.lead}</p>
      <div class="c-meta">${d.meta.map((m) => `<span class="mono">${esc(m)}</span>`).join("")}</div>
      ${d.swatches ? `<div class="swatches" aria-hidden="true">${d.swatches.map((c) => `<span style="background:${c}"></span>`).join("")}</div>` : ""}
      ${d.hero ? `<div class="c-heroimg">${img(d.hero, d.name, "", true)}</div>` : ""}
      ${d.youtube ? `<div class="yt" data-id="${d.youtube}"><button class="yt-play" aria-label="Play the Two Minutes film">${img("tmPoster", "Two Minutes film", "", true)}<span class="yt-btn">▶ Play the film</span></button></div>` : ""}
    </div>
  </section>
  <div class="wrap">${d.blocks.map(caseBlock).join("")}</div>
  <section class="c-end">
    <div class="wrap">
      ${d.link ? `<p><a class="btn" href="${d.link.href}" target="_blank" rel="noopener">${esc(d.link.label)}</a></p>` : ""}
      <h2 class="ptitle">${pill("Your brand", "#FED012", -1.5)}${pill("next?", "#28C840", 1)}</h2>
      <p><a class="btn btn-y" href="/site/#contact">${STAR}<span>Start a project</span></a></p>
      <p class="eyebrow mono">More work</p>
      <div class="more">${others.map((o) => `<a href="/work/${o.page}/" style="--bc:${o.c};--bt:${o.t}">${esc(o.name)} <i>→</i></a>`).join("")}</div>
    </div>
  </section>
</main>
${footer}`;
  }

  return { home, casePage, slugs: Object.keys(CASES) };
}
