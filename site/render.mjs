// Renders the lo-fi website: /site/ (home) and /work/<slug>/ (case pages). Plain HTML, a small
// stylesheet and a few lines of script; no WebGL. `A(name)` resolves an asset variable from
// src/app.js to { src, w, h } (src is root-relative, e.g. /assets/abc.png).
import { NAV, CHAPTERS, SERVICES, PROJECTS, ZDROVIT_BRANDS, STREETS, CLIENT_BADGES, FRIENDS, CREW, CREW_INFO, CREW_COLORS, CREW_PHOTOS, CREW_FACE_VARS, FORM, CASES, CANVASES, OFFICES } from "./data.mjs";
import { STUDIO, FAQ, studioNode } from "../build/seo.mjs";
import { SAME_AS, clip } from "../build/seo-pages.mjs";
const HUBS = await import("./hubs.mjs").catch(() => ({}));
const INDUSTRIES = HUBS.INDUSTRIES || [], SERVICE_PAGES = HUBS.SERVICE_PAGES || [];

const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const strip = (h) => String(h).replace(/<[^>]+>/g, "");
// r133: the star left the visual language: buttons carry the spinning yellow cup instead
const STAR = `<span class="cupspin cup-btn" aria-hidden="true"></span>`;

// r143: `kz` (the kinetic cups bundle) no longer plays on /site/; `heroCity` is the still of the city its first fold stands on
export function makeRender({ SITE, A, cssHref, jsHref, fonts, kz, heroCity = null, canvases = {}, coffee = null }) {
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

  const head = ({ title, desc, path, image, ld, preload = "" }) => `<!DOCTYPE html><html lang="en"><head>
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
${preload}
${ld ? `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, "\\u003c")}</script>` : ""}
</head><body>`;

  const logo = A("logoLandscape");
  const header = (home) => `<a class="skip" href="#main">Skip to content</a>
<header class="hdr">
  <div class="wrap hdr-in">
    <a class="brand" href="/site/" aria-label="Cromatic Studios, home">${logo ? `<img src="${logo.src}" alt="Cromatic Studios" width="${logo.w}" height="${logo.h}">` : "Cromatic Studios"}</a>
    <nav class="nav" aria-label="Main">
      ${NAV.map(([h, l]) => `<a href="${h.startsWith("/") || home ? h : "/site/" + h}">${l}</a>`).join("")}
    </nav>
    <a class="drive-btn" href="/" title="The full 3D experience: drive through Bucharest">${STAR}<span>Take the 3D drive</span></a>
    <button class="menu-btn" aria-label="Menu" aria-expanded="false" aria-controls="mnav"><span></span><span></span></button>
  </div>
  <nav id="mnav" class="mnav" aria-label="Mobile">
    ${NAV.map(([h, l]) => `<a href="${h.startsWith("/") || home ? h : "/site/" + h}">${l}</a>`).join("")}
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
  <div class="wrap ftr-motto"><span class="cupspin" aria-hidden="true"></span><p>There is always a coffee.</p></div>
  ${/* r139c: the last line is the strip every page ends with (build/footer.mjs fills it in, in the page's language) */ ""}<div class="cz-foot" data-czf></div>
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
        ${p.page ? `<span class="pc-cta">Read the case <i>→</i></span>` : p.wip ? `<span class="pc-cta mono">Work in progress</span>` : ""}
      </span>`;
    return p.page
      ? `<a class="pcard${i < 2 ? " big" : ""}" href="/work/${p.page}/">${inner}</a>`
      : `<article class="pcard">${inner}</article>`;
  };

  const contactForm = () => `
  <form class="bform" id="bform" novalidate>
    <div class="bf-strip mono"><span>Cromatic Air</span><span>Flight CS-99</span><span>Olari 9 → your brand</span><span>Seat 1A</span></div>
    <fieldset><legend>What do you dream of?</legend><div class="chips" data-name="dreams" data-multi="1">${FORM.dreams.map((d) => `<button type="button" class="chip" aria-pressed="false" data-v="${esc(d)}">${esc(d)}</button>`).join("")}</div></fieldset>
    <fieldset><legend>What kind of business are you?</legend><div class="chips" data-name="biz">${FORM.biz.map((d) => `<button type="button" class="chip" aria-pressed="false" data-v="${esc(d)}">${esc(d)}</button>`).join("")}</div></fieldset>
    <fieldset><legend>When do you want to take off?</legend><div class="chips" data-name="when">${FORM.when.map((d) => `<button type="button" class="chip" aria-pressed="false" data-v="${esc(d)}">${esc(d)}</button>`).join("")}</div></fieldset>
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

  // r130j: the portfolio on the lo-fi site is the map's, organised by what we do (3 + 1 domains), in a bento grid
  // of mixed sizes. Every card has a picture: its own media, else the map card's cover (case page og image or the
  // place's own photo, from covers.json), else its poster in the brand's colours.
  const DOMAINS = [
    { k: "brand", t: "Branding & Design", c: "#28C840", lead: "Strategy, names, identities, packaging: brands people repeat when you are not in the room." },
    { k: "ux", t: "UX & UI Design", c: "#B098C8", lead: "Websites, apps and products, from the first flow to the last pixel." },
    { k: "growth", t: "Growth & Content", c: "#F65342", lead: "Content, social and campaigns with taste, not tricks." },
    { k: "video", t: "Video Production", c: "#FED012", lead: "And one more: film, photo and sound, made in house.", plus: true }
  ];
  const DOMAIN_OF = {
    "Investimental": "ux", "Assetto": "ux", "The Aesthetic Court": "ux", "Craft Coffee": "ux", "ESD": "ux", "Techventures Bank": "ux", "Elithia": "ux",
    "Venevo": "ux", "Witanalytica": "ux", "Printoteca": "ux", "Artisan Coffee Gear": "ux", "Altius": "ux",
    "Yoshi Izakaya": "growth", "Help 4 Brain": "growth", "Zoetis": "growth", "Echo School": "growth", "Sticker Republic": "growth", "Litorsal": "growth", "Lacalut": "growth", "Maximag": "growth",
    "Pain Plaisir": "video", "Clinica Sante": "video", "Patiline": "video"
  };
  // sizes that tile six columns: a big square with two wides beside it, a tall one with two longs, a row of
  // three small, a long and a small, two halves; then again
  const SIZES = ["xl", "m", "m", "t", "w", "w", "s", "s", "s", "w", "s", "m", "m"];
  const MAP_ID = { "Two Min Lab": "lab", "Steam Coffee Shop": "steam", "Zdrovit": "zdrovit" };
  // TASK-074 (Daniel, 21 Oct): every Zdrovit brand is on the Zdrovit card only (no portfolio card of its own): one row of
  // all of them, under Medical Avenue; a brand with a case page is red and links to it (the map's card does the same)
  const zdPages = () => ZDROVIT_BRANDS.filter((b) => b.page).map((b) => b.page);
  const zdRow = () => {
    const list = ZDROVIT_BRANDS.slice().sort((a, b) => (a.page ? 0 : 1) - (b.page ? 0 : 1) || a.name.localeCompare(b.name));
    if (!list.length) return "";
    const st = "--bc:#cfcdc8;--bt:#3d3c39", stp = "--bc:#e30613;--bt:#ffffff;text-decoration:none";
    return `<div class="psmall"><span class="mono ps-h">In Zdrovit · Beauty &amp; Supplement Park</span>${list.map((b) => b.page ? `<a class="ps" href="/work/${b.page}/" style="${stp}"><b>${esc(b.name)}</b><i class="mono">${esc(b.line)}</i><i class="mono">Case study →</i></a>` : `<span class="ps" style="${st}"><b>${esc(b.name)}</b><i class="mono">${esc(b.line)}</i></span>`).join("")}</div>`;
  };
  const placeId = (name) => "w-" + name.replace(/\W+/g, "").toLowerCase();
  const coverFor = (p, covers) => (MAP_ID[p.name] && covers["place:" + MAP_ID[p.name]]) || covers["place:" + placeId(p.name)] || (p.page && covers[p.page]) || null;
  const bentoCard = (p, i, covers) => {
    const own = MAP_ID[p.name] && covers["place:" + MAP_ID[p.name]];
    const media = own ? `<img src="${own}" alt="${esc(p.name)}" loading="lazy" decoding="async">` : p.vid ? vid(p.vid, p.img) : p.img ? img(p.img, p.name) : (() => { const u = coverFor(p, covers); return u ? `<img src="${u}" alt="${esc(p.name)}" loading="lazy" decoding="async">` : ""; })();
    const size = SIZES[i % SIZES.length];
    // TASK-067: the name on a pill at the bottom (for a case, its way in: a circle in the street's colour, drawn by the
    // pill itself), the category on a chip at the top, the brief and "Read the case" on a paper note that opens under the
    // pill (site.css). One element more than before per card: the note
    const inner = `${media ? `<span class="bc-media">${media}</span>` : `<span class="bc-poster">${esc(p.poster)}</span>`}
      <span class="bc-cat mono">${esc(p.cat)}</span>
      <span class="bc-body"><span class="bc-name">${esc(p.name)}</span><span class="bc-note"><span class="bc-desc">${esc(p.desc)}</span>
      ${p.page ? `<span class="bc-cta">Read the case <i>→</i></span>` : p.wip ? `<span class="bc-cta mono">Work in progress</span>` : ""}</span></span>`;
    const cls = `bcard b-${size}${media ? " has-media" : ""}`;
    const st = `--bc:${p.c};--bt:${p.t};--i:${i}`;
    return p.page ? `<a class="${cls}" href="/work/${p.page}/" style="${st}">${inner}</a>` : `<article class="${cls}" style="${st}">${inner}</article>`;
  };
  const workByDomain = (covers) => DOMAINS.map((d) => {
    const list = PROJECTS.filter((p) => !p.small && (DOMAIN_OF[p.name] || "brand") === d.k)
      .map((p) => ({ p, w: (p.page ? 2 : 0) + (p.img || p.vid || coverFor(p, covers) ? 1 : 0) }))
      .sort((a, b) => b.w - a.w).map((x) => x.p);
    const small = d.k === "brand";
    return `<div class="dom" style="--dc:${d.c}">
      <h3 class="dom-h">${d.plus ? `<b class="dom-plus mono">+1</b> ` : ""}<span class="dom-sw"></span>${esc(d.t)} <i class="mono">${list.length} projects</i></h3>
      <p class="dom-lead">${esc(d.lead)}</p>
      <div class="bento">${list.map((p, i) => bentoCard(p, i, covers)).join("")}</div>
      ${small ? zdRow() : ""}
    </div>`;
  }).join("");
  // r131: the portfolio by industry, the way the map lays it out in streets; each street opens its own page. TASK-071
  // (beta 4.0, Daniel: "radius prea mic, fonturile prea înghesuite"): each street opens on a card in the welcome card's
  // line (cream paper, the ink keyline, a hard shadow, a generous radius), its sign hung on it in the street's colour,
  // then the industry, the lead, the way in and the count on a disc in the street's colour
  const STREET_INFO = {
    A: { t: "Specialty coffee, food & drink", lead: "Where we grew up: coffee shops, roasters, a festival, bakeries, a craft beer, a charcuterie and a caviar farm." },
    B: { t: "Banks, investments, fintech, energy & tech", lead: "Banks, brokers, investment groups, a fintech festival, an energy company and a school of technology and digital arts, made clear and human." },
    C: { t: "Clinics, pharma & aesthetic medicine", lead: "Clinics, labs, pharma and aesthetic medicine, from Bucharest to Barcelona." },
    D: { t: "Print on demand & stickers", lead: "Two print shops with a voice: one sings, one sticks." }
  };
  const industryOf = (k) => INDUSTRIES.find((x) => x.street === k);
  const workByStreet = (covers) => Object.entries(STREETS).map(([k, [street, col]]) => {
    const list = PROJECTS.filter((p) => p.street === k && !p.small)
      .map((p) => ({ p, w: (p.page ? 2 : 0) + (p.img || p.vid || coverFor(p, covers) ? 1 : 0) }))
      .sort((a, b) => b.w - a.w).map((x) => x.p);
    if (!list.length) return "";
    const small = k === "C"; // TASK-074: the Zdrovit park is on Medical Avenue
    const ind = industryOf(k), info = STREET_INFO[k] || { t: "", lead: "" };
    const n = new Set([...list.filter((p) => p.page).map((p) => p.page), ...(small ? zdPages() : [])]).size; // TASK-074: + the Zdrovit brands' case pages (reached from the Zdrovit row)
    return `<div class="dom dom-street" id="street-${k.toLowerCase()}" style="--dc:${col};--dt:${STREET_INK[k] || "#fff"}">
      <div class="street-head">
        <div class="sh-main">
          <h3 class="sh-title"><span class="street-sign"><span class="ss-name">${esc(street)}</span></span> <span class="sh-sub">${esc(info.t)}</span></h3>
          <p class="sh-lead">${esc(info.lead)}</p>
          ${ind ? `<a class="sh-more" href="/industries/${ind.slug}/" aria-label="${esc(info.t)}: the whole street"><span>The whole street</span> <i aria-hidden="true">→</i></a>` : ""}
        </div>
        <p class="sh-count"><b>${n}</b> <span class="mono">case ${n === 1 ? "study" : "studies"}</span></p>
      </div>
      <div class="bento">${list.map((p, i) => bentoCard(p, i, covers)).join("")}</div>
      ${small ? zdRow() : ""}
    </div>`;
  }).join("");
  const SVC_LINKS = { "Branding & Design": ["brand-strategy", "brand-identity"], "Video Production": ["video-production"], "UX & UI Design": ["websites-apps"], "Growth & Content": ["social-media-content"] };
  const STREET_INK = { A: "#fff", B: "#fff", C: "#0d0c09", D: "#0d0c09", E: "#0d0c09" };
  const SITE_TITLE = "Cromatic Studios: brand strategy, identity, web & film in Bucharest";
  function home(covers = {}) {
    const ld = { "@context": "https://schema.org", "@graph": [
      studioNode(SITE, SAME_AS),
      { "@type": "WebSite", "@id": `${SITE}/#website`, url: `${SITE}/`, name: "Cromatic Studios", publisher: { "@id": `${SITE}/#studio` }, inLanguage: ["en", "ro"] },
      { "@type": "WebPage", "@id": `${SITE}/site/#page`, url: `${SITE}/site/`, name: SITE_TITLE, isPartOf: { "@id": `${SITE}/#website` }, about: { "@id": `${SITE}/#studio` }, mainEntity: { "@id": `${SITE}/site/#faq` }, inLanguage: "en" },
      { "@type": "FAQPage", "@id": `${SITE}/site/#faq`, mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } })) },
      { "@type": "ItemList", "@id": `${SITE}/site/#work`, name: "Case studies by Cromatic Studios", itemListElement: PROJECTS.filter((p) => p.page).filter((p, i, a) => a.findIndex((q) => q.page === p.page) === i).map((p, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE}/work/${p.page}/`, name: p.name })) },
      { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Cromatic Studios", item: `${SITE}/site/` }] }
    ] };
    // r143 (Daniel): the first fold is no longer the kinetic cups. It is the city, Coffee Street, under the words of the
    // drive's opening (site/onboarding/intro-lab/engine.js): the pill turns place → facade → brand once, then rests
    const hc = heroCity;
    // TASK-106 (Daniel: "a very cool animated banner that takes you to the map"): a muted loop of the city from the
    // Lottie stories (Steam by day, OMA, the Aesthetic Court, Steam by night, the fountain, the Fintech Blvd drift),
    // a landscape cut for screens and the stories' own 9:16 for phones. The still above stays the poster and the LCP:
    // site.js gives the video its sources only after load, only while the hero is on screen, never with reduced motion,
    // Save-Data or a 2g connection. The whole card goes to the map (.hc-hit); the buttons keep their own links.
    const heroVideo = () => {
      const v = (n) => A(`m:hero/${n}`);
      const dm = v("drive-d"), dw = v("drive-d-av1"), mm = v("drive-m"), mw = v("drive-m-av1");
      if (!dm || !mm) return "";
      return `<video class="hc-vid" muted loop playsinline preload="none" disablepictureinpicture aria-hidden="true" tabindex="-1" data-d="${dm.src}"${dw ? ` data-dw="${dw.src}"` : ""} data-m="${mm.src}"${mw ? ` data-mw="${mw.src}"` : ""}></video>
    <button class="hc-pp" type="button" aria-pressed="false" aria-label="Pause the animation" hidden><i aria-hidden="true"></i></button>`;
    };
    const preload = hc ? `<link rel="preload" as="image" href="${hc.m.src}" media="(max-width: 700px)" fetchpriority="high">
<link rel="preload" as="image" href="${hc.d.src}" media="(min-width: 701px)" fetchpriority="high">` : "";
    return `${head({ title: SITE_TITLE, desc: "Independent creative studio in Bucharest: brand strategy, identity, websites and apps, film and content for indie brands, startups and established firms.", path: "/site/", ld, preload })}
${header(true)}
<main id="main">
  <section class="hero hero-city" aria-labelledby="hc-h">
   <div class="hc-card">
    ${hc ? `<picture class="hc-pic"><source media="(max-width: 700px)" srcset="${hc.m.src}" width="${hc.m.w}" height="${hc.m.h}"><img src="${hc.d.src}" width="${hc.d.w}" height="${hc.d.h}" alt="Coffee Street in the 3D city of Bucharest, the vintage yellow ride outside Two Min Lab" fetchpriority="high" decoding="async"></picture>` : ""}
    ${heroVideo()}
    <i class="hc-shade" aria-hidden="true"></i>
    <a class="hc-hit" href="/" tabindex="-1" aria-hidden="true"></a>
    <div class="wrap hc-in">
      <p class="eyebrow mono">Cromatic Studios · Bucharest · Since 2014</p>
      <h1 class="hc-h" id="hc-h"><span class="hc-k">Nobody remembers a thumbnail.</span> <span class="hc-big">But someone could remember a <span class="pill hc-morph"><span>place.</span><span aria-hidden="true">facade.</span><span aria-hidden="true">brand.</span></span></span></h1>
      <p class="hc-sub">Nine worlds over the same streets. One will feel like <span class="pill hc-pill-y">yours.</span> That’s how the right brand feels.</p>
      <p class="hc-what">An independent studio for brand strategy, identity, websites, film and content.</p>
      <div class="btns hc-btns"><a class="btn btn-y" href="/">${STAR}<span>Take the 3D drive</span></a><a class="btn hc-ghost" href="#work">See the work <span aria-hidden="true">↓</span></a></div>
    </div>
    <p class="hc-note"><span class="cupspin" aria-hidden="true"></span><span>There’s always a <span class="pill hc-mv">good</span> <span class="pill hc-pill-y">coffee</span> around.</span></p>
   </div>
  </section>

  <section class="clients" aria-label="Clients">
    <div class="wrap cl-head"><span class="cupspin" aria-hidden="true"></span><p class="eyebrow mono">Brands we grew with</p></div>
    <div class="marquee" tabindex="-1">
      <div class="mq-track">${[0, 1].map((r) => `<div class="mq-set"${r ? ' aria-hidden="true"' : ""}>${CLIENT_BADGES.map((b, i) => `<span class="logo-card" style="--d:${((i * 0.53) % 3).toFixed(2)}s;--r:${[-2.5, 1.8, -1.2, 2.4, -1.8, 1.2, -2.2, 2.6, -1.4][i % 9]}deg">${img(b, r ? "" : (PROJECTS.find((p) => p.badge === b)?.name || "Client"))}</span>`).join("")}</div>`).join("")}</div>
    </div>
  </section>

  <section class="stats" aria-label="The studio in numbers">
    <div class="wrap stats-in">
      <p><b>${new Set(PROJECTS.filter((x) => x.page).map((x) => x.page)).size + 2}</b><span>Case studies, every one on the map</span></p>
      <p><b>${Object.keys(STREETS).length}</b><span>Streets, one for every industry</span></p>
      <p><b>4</b><span>Chapters: The Dream, The Voice, The World, The Crowd</span></p>
      <p><b>&infin;</b><span>Coffees. There is always a coffee.</span></p>
    </div>
  </section>

  <section class="road" aria-label="The coffee stop on the drive">
    <div class="wrap road-head">
      <p class="eyebrow mono">A piece of the drive · Strada Constantin Aricescu 50A</p>
      <h2 class="ptitle">${pill("The coffee", "#FED012", -1.5)} ${pill("stop", "#F2A9C4", 1)}</h2>
      <p class="sec-lead">Two Minutes has been our client and our neighbour for a decade. On the drive we always stop here: four double espressos, and the coffee boxes fly down from the Cromatic mansard to the shelf.</p>
    </div>
    ${coffee ? `<div class="road-scene road-lottie" data-czl-js="${coffee.js}" data-czl-player="${coffee.player}" data-czl-wide="${coffee.wide}" data-czl-tall="${coffee.tall}">
      <div class="rl-art" role="img" aria-label="The coffee stop, drawn: four double espressos on the Two Minutes sill, the coffee boxes flying from the Cromatic mansard to the shelf and onto the yellow Dacia, the arcade cabinet by the door and a caravan parked on the right"><picture class="rl-still"><source media="(max-width: 700px)" srcset="${coffee.still.tall.src}" width="${coffee.still.tall.w}" height="${coffee.still.tall.h}"><img src="${coffee.still.wide.src}" width="${coffee.still.wide.w}" height="${coffee.still.wide.h}" alt="" fetchpriority="low" decoding="async"></picture></div>
      <a class="rl-game" href="/play/gloves/" aria-label="Play the arcade: 2 Minutes 2 Fight w/ I O N, in front of Two Minutes"><span class="rlg-tag"><i class="rlg-coin" aria-hidden="true"></i><span>Play the arcade</span></span></a>
      <button class="rl-pp" type="button" aria-pressed="false" aria-label="Pause the animation" hidden><i aria-hidden="true"></i></button>
    </div>
    <div class="road-foot"><a class="rs-cta" href="/work/two-minutes/">Two Minutes, the case →</a><a class="rs-drive" href="/">Drive it yourself →</a></div>` : `<div class="road-scene road-video">
      ${vid("m:tm/coffee-stop", "m:tm/coffee-stop-poster")}
      <span class="rv-tag mono">Filmed in the 3D drive · Strada Constantin Aricescu 50A</span>
      <a class="rs-cta" href="/work/two-minutes/">Two Minutes, the case →</a>
      <a class="rs-drive" href="/">Drive it yourself →</a>
    </div>`}
  </section>

  <section id="what" class="sec">
    <div class="wrap">
      <p class="eyebrow mono">What we bring to the table</p>
      <h2 class="ptitle">${pill("From a dream", "#28C840", -1.5)} ${pill("to a crowd", "#F65342", 1)}</h2><span class="cupspin cup-title" aria-hidden="true"></span>
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
      <h2 class="ptitle">${pill("Every place", "#FED012", -1.5)} ${pill("on the map", "#B098C8", 1)}</h2>
      <p class="sec-lead">The same work as the 3D map, street by street: every street is an industry we know from the inside.</p>
      <nav class="streets-nav" aria-label="Industries">${Object.entries(STREETS).map(([k, [street, col]]) => PROJECTS.some((p) => p.street === k && !p.small) ? `<a href="#street-${k.toLowerCase()}" style="--dc:${col}"><span class="dom-sw"></span>${esc(street)}</a>` : "").join("")}</nav>
      ${workByStreet(covers)}
      <p class="friends"><span class="mono">Friends we made along the way</span> ${FRIENDS.map((f) => `<span class="fpill">${esc(f)}</span>`).join("")}</p>
    </div>
  </section>

  <div class="road-div" aria-hidden="true"><span class="cupspin road-cup"></span></div>
  <section id="services" class="sec">
    <div class="wrap">
      <p class="eyebrow mono">Full tank of services</p>
      <h2 class="ptitle">${pill("What we carry", "#119BFE", -1)}</h2>
      <div class="svcs">
        ${SERVICES.map((s) => `<article class="svc" style="--sc:${s.c}">
          <h3>${esc(s.t)}</h3>
          <p class="mono">${s.items.length} skills on board</p>
          <ul>${s.items.map((x) => `<li>${esc(x)}</li>`).join("")}</ul>
          ${(SVC_LINKS[s.t] || []).filter((k) => SERVICE_PAGES.some((x) => x.slug === k)).map((k) => `<a class="svc-more" href="/services/${k}/">${esc(SERVICE_PAGES.find((x) => x.slug === k).name)} <i>→</i></a>`).join("")}
        </article>`).join("")}
      </div>
      ${SERVICE_PAGES.length ? `<p class="svc-pages"><span class="mono">In depth</span> ${SERVICE_PAGES.map((x) => `<a href="/services/${x.slug}/">${esc(x.name)} →</a>`).join("")}</p>` : ""}
    </div>
  </section>

  <section id="studio" class="sec sec-alt">
    <div class="wrap studio">
      <div>
        <p class="eyebrow mono">The crew</p>
        <h2 class="ptitle">${pill("Brilliant", "#28C840", -2)} ${pill("humans", "#B098C8", 1.5)}</h2>
        <p class="sec-lead">We discover AI every day, but we are strong believers in the collective power of brilliant humans. <a class="dom-more" href="/team/">Meet the team →</a></p>
        <ul class="crew">${CREW.map((n, i) => { const f = A(CREW_FACE_VARS[n]); return `<li style="--cc:${CREW_COLORS[i % CREW_COLORS.length]}"><span class="cr-face">${f ? `<img src="${f.src}" width="${f.w}" height="${f.h}" alt="" loading="lazy" decoding="async">` : ""}</span><span class="cr-name">${esc(n)}</span>${(() => { const ci = CREW_INFO[n] || {}; const links = [["Instagram", ci.instagram], ["Behance", ci.behance]].filter(([, u]) => u).map(([k, u]) => `<a class="cr-link" href="${u}" target="_blank" rel="noopener">${k} \u2197</a>`).join(""); return `${ci.role ? `<span class="cr-role mono">${esc(ci.role)}</span>` : ""}${ci.bio ? `<span class="cr-bio">${esc(ci.bio)}</span>` : ""}${links}`; })()}</li>`; }).join("")}</ul>
      </div>
      <div class="photos">${CREW_PHOTOS.map((p) => `<figure${p.big ? ' class="ph-big"' : ""}>${img(p.src, p.cap)}<figcaption class="mono">${esc(p.cap)}</figcaption></figure>`).join("")}</div>
    </div>
  </section>

  <section id="faq" class="sec">
    <div class="wrap faq">
      <div>
        <p class="eyebrow mono">Good questions</p>
        <h2 class="ptitle">${pill("Before", "#FED012", -1.5)} ${pill("the coffee", "#F65342", 1)}</h2>
      </div>
      <div class="qa">${FAQ.map(([q, a]) => `<details><summary>${esc(q)}</summary><p>${esc(a)}</p></details>`).join("")}</div>
    </div>
  </section>

  <section id="contact" class="sec sec-ink">
    <span class="cupspin cup-contact" aria-hidden="true"></span>
    <div class="wrap contact">
      <div class="c-txt">
        <p class="eyebrow mono">Final call · Strada Olari 9</p>
        <h2 class="ptitle">${pill("What do you", "#119BFE", -2)} ${pill("dream of?", "#F65342", 1.5)}</h2>
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

  // a screenshot inside a browser window, and one inside a phone
  const browser = (m) => `<figure class="bw"><span class="bw-bar" aria-hidden="true"><i></i><i></i><i></i></span>${img(m, "")}</figure>`;
  const phone = (m) => `<figure class="ph">${img(m, "")}</figure>`;
  // case pages, v2 (after the Steam case study): chapters with big type, then the images at
  // their natural shape (never cropped): one full width, two side by side, three or more in a
  // horizontal rail you can drag or step through. Every image opens in a lightbox.
  const lbImg = (m, alt = "") => { const a = A(m); if (!a) return ""; return `<img src="${a.src}"${a.w ? ` width="${a.w}" height="${a.h}"` : ""} alt="${esc(alt)}" loading="lazy" decoding="async" data-lb="${a.src}">`; };
  // r136: the long-form story blocks (Slow Coffee Festival, the whole story from the old site). Any block may add:
  // say (a big statement, with an optional giant word, big), art (stickers: small transparent graphics at their
  // own size, tilted, never in the lightbox), pillars (cards {k, h, p, c}), palette (swatches {n, c, p} + note)
  // and list (a numbered list next to the block's video). p may be an array of paragraphs.
  const paras = (p) => Array.isArray(p) ? `<div class="c2-ps">${p.map((x) => `<p>${x}</p>`).join("")}</div>` : `<p>${p}</p>`;
  const TILT = [-4, 3, -2, 5, -3, 2];
  const art = (list, cls = "", label = "") => list?.length ? `<div class="wrap c2-art c2-reveal${cls ? " " + cls : ""}"${label ? ` role="img" aria-label="${esc(label)}"` : ""}>${list.map((m, k) => { const a = A(m); return a ? `<img class="stk" src="${a.src}"${a.w ? ` width="${a.w}" height="${a.h}"` : ""} alt="" loading="lazy" decoding="async" style="--i:${k};--r:${TILT[k % TILT.length]}deg">` : ""; }).join("")}</div>` : "";
  const storyParts = (b) => (b.say ? `<div class="wrap c2-say c2-reveal"><p>${b.say}</p>${b.big ? `<p class="c2-big"><span class="sr">${esc(b.big)}</span>${[...b.big].map((ch, k) => `<span aria-hidden="true" style="--k:${k}">${esc(ch)}</span>`).join("")}</p>` : ""}</div>` : "")
    + art(b.art, b.artCls, b.artLabel)
    + (b.pillars ? `<div class="wrap c2-pillars">${b.pillars.map((x, k) => `<article class="c2-pc c2-reveal" style="--pc:${x.c};--i:${k}"><span class="mono">${esc(x.k)}</span><h3>${esc(x.h)}</h3><p>${x.p}</p></article>`).join("")}</div>` : "")
    + (b.palette ? `<div class="wrap c2-pal c2-reveal">${b.palette.map((x, k) => `<div class="c2-sw" style="--sc:${x.c};--i:${k}"><button class="sw" data-hex="${x.c}" title="Copy ${x.c}"></button><h3>${esc(x.n)}</h3><p>${esc(x.p)}</p><span class="mono">${x.c}</span></div>`).join("")}</div>${b.note ? `<div class="wrap c2-note c2-reveal"><p>${b.note}</p></div>` : ""}` : "");
  function caseBlock(b, i, hn) {
    const num = String(hn ?? i + 1).padStart(2, "0");
    const head = b.h || b.p ? `<div class="wrap c2-head c2-reveal">${b.yr ? img(b.yr, b.h, "cb-yr") : ""}${b.h && !b.yr ? `<span class="c2-num mono">${num}</span><h2>${esc(b.h)}</h2>` : ""}${b.p ? paras(b.p) : ""}</div>` : "";
    const extra = storyParts(b);
    if (b.list) return `<section class="c2-ch${b.small ? " small" : ""}">${head}${extra}<div class="wrap c2-apps c2-reveal">${[...(b.vid ? [b.vid] : []), ...(b.vids || [])].map((v) => `<figure class="c2-fig vid">${vid(v)}</figure>`).join("")}<ol class="c2-list">${b.list.map((x, k) => `<li style="--i:${k}"><span class="mono">${String(k + 1).padStart(2, "0")}</span><span>${x}</span></li>`).join("")}</ol></div></section>`;
    if (b.frame) return `<section class="c2-ch"><div class="wrap"><div class="cblock framed${b.tall ? " tall" : ""}${b.phones ? " with-phone" : ""}">
      <div class="cb-txt">${b.h ? `<span class="c2-num mono">${num}</span><h2>${esc(b.h)}</h2>` : ""}${b.p ? `<p>${b.p}</p>` : ""}</div>
      <div class="cb-media fr">${(b.imgs || []).map(browser).join("")}${(b.phones || []).map(phone).join("")}</div>
    </div></div></section>`;
    const imgs = b.imgs || [], vids = [...(b.vid ? [b.vid] : []), ...(b.vids || [])];
    // "tall": a rail of big portrait frames; a landscape photo is cropped to portrait, around b.pos[k] (an object-position)
    const tall = b.layout === "tall";
    const figAttr = (m, k) => { if (!tall) return ""; const a = A(m); return a && a.w > a.h ? ` class="c2-fig crop"${b.pos?.[k] ? ` style="--op:${b.pos[k]}"` : ""}` : ""; };
    const items = [...vids.map((v) => `<figure class="c2-fig vid">${vid(v)}</figure>`), ...imgs.map((m, k) => `<figure${figAttr(m, k) || ' class="c2-fig"'}>${lbImg(m, b.caps?.[k] || b.h || "")}${b.caps?.[k] ? `<figcaption class="mono">${esc(b.caps[k])}</figcaption>` : ""}</figure>`)];
    const n = items.length;
    const layout = b.layout || (n === 1 ? "full" : n === 2 ? "duo" : "rail");
    let media = "";
    // r130o: "side": a single tall piece on the left, its words on the right (not full width)
    if (layout === "side") return `<section class="c2-ch c2-side${b.small ? " small" : ""}"><div class="wrap c2-side-in c2-reveal"><div class="c2-side-m">${items.join("")}</div><div class="c2-side-t">${b.h ? `<span class="c2-num mono">${num}</span><h2>${esc(b.h)}</h2>` : ""}${b.p ? `<p>${b.p}</p>` : ""}</div></div></section>`;
    if (layout === "full") media = `<div class="wrap-wide c2-full c2-reveal">${items.join("")}</div>`;
    else if (layout === "duo") media = `<div class="wrap-wide c2-duo c2-reveal">${items.join("")}</div>`;
    else if (n) media = `<div class="c2-rail c2-reveal${b.poster ? " posters" : ""}${tall ? " tall" : ""}"><div class="c2-track" tabindex="0" aria-label="${esc(b.h || "Gallery")}, scroll sideways">${items.join("")}</div>
      <div class="wrap c2-rail-ui"><button class="c2-rb prev" aria-label="Previous">←</button><button class="c2-rb next" aria-label="Next">→</button><span class="c2-count mono">${n} images · drag</span></div></div>`;
    return `<section class="c2-ch${b.small ? " small" : ""}${b.say && !b.h ? " c2-ch-say" : ""}">${head}${extra}${media}</section>`;
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
    return `${head({ title: `${d.name} · Case study · Cromatic Studios`, desc: strip(d.lead), path: `/work/${slug}/`, image: cover?.src, ld })}
${header(false)}
<main id="main" class="case${d.theme ? " theme-" + d.theme : ""}" style="--bc:${d.c};--bt:${d.t}">
  <section class="c-hero c2-hero">
    <div class="wrap">
      <p class="eyebrow mono">${esc(d.eyebrow)}</p>
      <h1 class="c2-title">${esc(d.title).split(" ").map((w, k) => `<span class="w" style="--k:${k}">${w}</span>`).join(" ")}</h1>
      <div class="c2-row">
        <div class="c-meta">${d.meta.map((m) => `<span class="mono">${esc(m)}</span>`).join("")}</div>
        ${d.swatches ? `<div class="swatches" aria-label="Palette">${d.swatches.map((c) => `<button class="sw" style="background:${c}" data-hex="${c}" title="Copy ${c}"></button>`).join("")}</div>` : ""}
      </div>
    </div>
    ${d.heroArt ? art(d.heroArt, "strip", d.heroArtLabel) : ""}
    ${d.hero ? (d.heroFrame ? `<div class="wrap-wide c-heroimg wide">${browser(d.hero)}</div>` : `<div class="wrap-wide c2-heromedia">${lbImg(d.hero, d.name)}</div>`) : ""}
    ${d.youtube ? `<div class="wrap-wide"><div class="yt" data-id="${d.youtube}"><button class="yt-play" aria-label="Play the Two Minutes film">${img("tmPoster", "Two Minutes film", "", true)}<span class="yt-btn">▶ Play the film</span></button></div></div>` : ""}
  </section>
  <section class="wrap c2-lead c2-reveal"><p>${d.lead}</p></section>
  ${(() => { let n = 0; return d.blocks.map((b, i) => caseBlock(b, i, b.h ? ++n : n)).join(""); })()}
  <section class="c-end">
    <div class="wrap">
      ${d.link ? `<p><a class="btn" href="${d.link.href}" target="_blank" rel="noopener">${esc(d.link.label)}</a></p>` : ""}
      <h2 class="ptitle">${pill("Your brand", "#FED012", -1.5)} ${pill("next?", "#28C840", 1)}</h2>
      <p><a class="btn btn-y" href="/site/#contact">${STAR}<span>Start a project</span></a></p>
      <p class="eyebrow mono">More work</p>
      <div class="more">${others.map((o) => `<a href="/work/${o.page}/" style="--bc:${o.c};--bt:${o.t}">${esc(o.name)} <i>→</i></a>`).join("")}</div>
    </div>
  </section>
  ${(() => { const all = PROJECTS.filter((x) => x.page); const k = all.findIndex((x) => x.page === slug); const nx = all[(k + 1) % all.length]; const im = A(nx.img || ""); return `<a class="c2-next" href="/work/${nx.page}/" style="--bc:${nx.c};--bt:${nx.t}"><span class="mono">Next case</span><b>${esc(nx.name)}</b>${im ? `<img src="${im.src}" alt="" loading="lazy">` : ""}<i aria-hidden="true">→</i></a>`; })()}
</main>
${footer}`;
  }


  // a brand canvas as a horizontal page: the artboard's elements, each positioned exactly where
  // it sits on the board, revealed as the board slides past
  // r134h: a meta description ends on a whole sentence (or a whole word), never mid-word
  // r136 (N33): the same rule as every other page (build/seo-pages.mjs clip: whole sentences, 155 characters)
  const shortDesc = (t, max = 155) => clip(t, max, null);
  function canvasPage(slug) {
    const d = CANVASES[slug], cv = canvases[slug];
    const p = PROJECTS.find((x) => x.page === slug);
    const others = PROJECTS.filter((x) => x.page && x.page !== slug);
    const { w: W, h: H, base, items, bg } = cv;
    const pos = (b) => `left:${(b[0] / W * 100).toFixed(3)}%;top:${((H - b[3]) / H * 100).toFixed(3)}%;width:${((b[2] - b[0]) / W * 100).toFixed(3)}%`;
    const ld = { "@context": "https://schema.org", "@graph": [
      { "@type": "CreativeWork", "@id": `${SITE}/work/${slug}/#work`, name: `${d.name} · brand canvas`, headline: d.title, description: d.lead, genre: p?.cat, creator: { "@id": `${SITE}/#studio` }, url: `${SITE}/work/${slug}/`, image: `${SITE}${base}/${bg ? bg.file : items[0].file}`, inLanguage: "en" },
      { "@type": "BreadcrumbList", itemListElement: [
        { "@type": "ListItem", position: 1, name: "Cromatic Studios", item: `${SITE}/site/` },
        { "@type": "ListItem", position: 2, name: "Work", item: `${SITE}/site/#work` },
        { "@type": "ListItem", position: 3, name: d.name, item: `${SITE}/work/${slug}/` }
      ] }
    ] };
    const kindOf = (it) => it.kind === "img" ? "k-img" : it.box[0] < W * 0.145 ? "k-txt" : (it.box[2] - it.box[0]) < 230 && (it.box[3] - it.box[1]) < 260 ? "k-mas" : "k-vec";
    // r139d: a file's smaller copies (cv.variants, made at build) and itself, as a srcset
    // r139d: and its proportions, so a copy (rounded to whole pixels) draws in exactly the same box
    const cvAr = (file) => { const d = cv.dims?.[file]; return d ? `;aspect-ratio:${d[0]}/${d[1]}` : ""; };
    const cvSet = (file) => { const v = cv.variants?.[file], d = cv.dims?.[file]; return v?.length && d ? ` data-srcset="${[...v.map((x) => `${base}/${x.file} ${x.w}w`), `${base}/${file} ${d[0]}w`].join(", ")}"` : ""; };
    return `${head({ title: `${d.name} · Brand canvas · Cromatic Studios`, desc: shortDesc(d.lead), path: `/work/${slug}/`, image: (p?.img && A(p.img)?.src) || `${base}/${bg ? bg.file : items[0].file}`, ld })}
${header(false)}
<main id="main" class="case cv-page" style="--bc:${d.c};--bt:${d.t}">
  <section class="c-hero cv-hero">
    <div class="wrap">
      <p class="eyebrow mono">${esc(d.eyebrow)}</p>
      <h1>${esc(d.title)}</h1>
      <p class="lead">${esc(d.lead)}</p>
      <div class="c-meta">${d.meta.map((m) => `<span class="mono">${esc(m)}</span>`).join("")}</div>
      <div class="swatches" aria-hidden="true">${d.swatches.map((c) => `<span style="background:${c}"></span>`).join("")}</div>
    </div>
  </section>
  <section class="cv" aria-label="${esc(d.name)} brand canvas" style="--ar:${(W / H).toFixed(4)}">
    <div class="cv-sticky" tabindex="0">
      <div class="cv-track">
        <div class="cv-stage">
          ${/* r139d: every element waits in data-src (site.js hands the files out after the background has painted, the
            screen's first) with its 1×, 1.5× and 2× copies in data-srcset (build.mjs, canvasVariants); the background,
            the page's LCP, keeps its src with the same three copies for the stage's height (100vh less the header: 72 px,
            128 px with the bar on a phone); a background of one flat colour (Witanalytica's white) is that colour */ ""}
          ${items.filter((it) => it.under).map((it, k) => `<img class="cv-el cv-under ${kindOf(it)}" data-src="${base}/${it.file}"${cvSet(it.file)} alt="" decoding="async" style="${pos(it.box)}${cvAr(it.file)};--k:${k}">`).join("")}
          ${bg ? (bg.solid ? `<div class="cv-bg" style="background:${bg.solid}"></div>` : `<img class="cv-bg" src="${base}/${bg.file}"${(() => { const s = cvSet(bg.file); if (!s) return ""; const r = (W / H).toFixed(4); return `${s.replace(" data-srcset=", " srcset=")} sizes="(max-width: 760px) calc((100vh - 128px) * ${r}), (pointer: coarse) calc((100vh - 128px) * ${r}), calc((100vh - 72px) * ${r})"`; })()} alt="" fetchpriority="high" decoding="async">`) : ""}
          ${/* r139a: past the first 18, an element waits in data-src: site.js gives it its file as it comes within reach of the
            screen (the browser's own lazy loading fetched the whole board with the title: 40-60 files, ~0.9 MB on a phone) */ ""}
          ${items.filter((it) => !it.under).map((it, k) => `<img class="cv-el ${kindOf(it)}" data-src="${base}/${it.file}"${cvSet(it.file)} alt="" decoding="async" style="${pos(it.box)}${cvAr(it.file)};--k:${k}">`).join("\n          ")}
        </div>
      </div>
      <p class="cv-hint mono" aria-hidden="true"><span class="cv-desk">Scroll to slide the canvas</span><span class="cv-mob">Drag the canvas</span> <i>→</i></p>
      <div class="cv-bar" aria-hidden="true"><i></i></div>
    </div>
  </section>
  <section class="c-end">
    <div class="wrap">
      <h2 class="ptitle">${pill("Your brand", "#FED012", -1.5)} ${pill("next?", "#28C840", 1)}</h2>
      <p><a class="btn btn-y" href="/site/#contact">${STAR}<span>Start a project</span></a></p>
      <p class="eyebrow mono">More work</p>
      <div class="more">${others.map((o) => `<a href="/work/${o.page}/" style="--bc:${o.c};--bt:${o.t}">${esc(o.name)} <i>→</i></a>`).join("")}</div>
    </div>
  </section>
</main>
${footer}`;
  }
  // ---- r131: industry hubs (one per street), service pages, the team ----
  const byPage = (slug) => PROJECTS.find((p) => p.page === slug);
  // TASK-120 (Daniel): no visible breadcrumb under the header (it only repeated the logo); the BreadcrumbList in hubLd stays for search
  const hubLd = (path, title, desc, crumbs, extra = []) => ({ "@context": "https://schema.org", "@graph": [
    { "@type": "WebPage", "@id": `${SITE}${path}`, url: `${SITE}${path}`, name: title, description: desc, isPartOf: { "@id": `${SITE}/#website` }, about: { "@id": `${SITE}/#studio` }, inLanguage: "en" },
    ...extra,
    { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Cromatic Studios", item: `${SITE}/site/` }, ...crumbs.map(([n, u], i) => ({ "@type": "ListItem", position: i + 2, name: n, item: SITE + u }))] }
  ] });
  const faqLd = (path, faq) => ({ "@type": "FAQPage", "@id": `${SITE}${path}#faq`, mainEntity: faq.map(([q, a]) => ({ "@type": "Question", name: strip(q), acceptedAnswer: { "@type": "Answer", text: strip(a) } })) });
  const listLd = (path, slugs, name) => ({ "@type": "ItemList", "@id": `${SITE}${path}#work`, name, itemListElement: slugs.map((sl, i) => ({ "@type": "ListItem", position: i + 1, url: `${SITE}/work/${sl}/`, name: byPage(sl)?.name || ZDROVIT_BRANDS.find((b) => b.page === sl)?.name || sl })) });
  // TASK-074: a Zdrovit brand's case page has no portfolio entry; a service page that names it still shows its card
  const zdProj = (slug) => { const b = ZDROVIT_BRANDS.find((x) => x.page === slug); return b ? { name: b.name, cat: b.cat || "Zdrovit · Beauty & Supplement Park", desc: b.desc || b.line, page: b.page, c: b.c || "#e30613", t: b.t || "#ffffff", poster: b.poster || b.name, img: b.img } : null; };
  const hubCases = (slugs, covers, col) => `<div class="bento"${col ? ` style="--dc:${col}"` : ""}>${slugs.map((sl) => byPage(sl) || zdProj(sl)).filter(Boolean).map((p, i) => bentoCard(p, i, covers)).join("")}</div>`;
  const hubFaq = (faq) => `<section class="sec" id="faq"><div class="wrap faq"><div><p class="eyebrow mono">Good questions</p><h2 class="ptitle">${pill("Before", "#FED012", -1.5)} ${pill("the coffee", "#F65342", 1)}</h2></div>
      <div class="qa">${faq.map(([q, a], i) => `<details${i === 0 ? " open" : ""}><summary>${q}</summary><p>${a}</p></details>`).join("")}</div></div></section>`;
  const hubEnd = `<section class="c-end"><div class="wrap">
      <h2 class="ptitle">${pill("Your brand", "#FED012", -1.5)} ${pill("next?", "#28C840", 1)}</h2>
      <p><a class="btn btn-y" href="/site/#contact">${STAR}<span>Start a project</span></a></p>
      <p class="c-direct"><a href="mailto:${STUDIO.email}">${STUDIO.email}</a> · <a href="tel:+40728978068">${STUDIO.phone}</a> · Strada Olari 9, Bucharest</p>
    </div></section>`;
  const hubHero = (eyebrow, h1, lead, col) => `<section class="c-hero c2-hero hub-hero">
    <div class="wrap">
      <p class="eyebrow mono">${esc(eyebrow)}</p>
      <h1 class="c2-title">${esc(h1).split(" ").map((w, k) => `<span class="w" style="--k:${k}">${w}</span>`).join(" ")}</h1>
      <p class="lead hub-lead">${lead}</p>
      <div class="btns"><a class="btn btn-y" href="/site/#contact">${STAR}<span>Start a project</span></a><a class="btn" href="#work">See the work</a></div>
    </div></section>`;
  const cards = (items, col) => `<div class="hub-cards">${items.map((x, i) => `<article class="hub-card" style="--sc:${col}"><span class="mono">${String(i + 1).padStart(2, "0")}</span><h3>${esc(x.t)}</h3><p>${x.p}</p></article>`).join("")}</div>`;

  function industryPage(slug, covers = {}) {
    const d = INDUSTRIES.find((x) => x.slug === slug);
    const [street, col] = STREETS[d.street];
    const path = `/industries/${slug}/`, title = `${d.title} · Cromatic Studios`;
    const svc = (d.services || []).map((k) => SERVICE_PAGES.find((x) => x.slug === k)).filter(Boolean);
    const others = INDUSTRIES.filter((x) => x.slug !== slug);
    const ld = hubLd(path, title, d.desc, [["Industries", "/site/#work"], [street, path]], [
      { "@type": "Service", "@id": `${SITE}${path}#service`, name: d.title, serviceType: "Branding and design", provider: { "@id": `${SITE}/#studio` }, areaServed: { "@type": "Country", name: "Romania" }, audience: { "@type": "BusinessAudience", name: STREET_INFO[d.street]?.t || street } },
      listLd(path, [...d.cases, ...(d.street === "C" ? zdPages() : [])], `${street}: case studies`), faqLd(path, d.faq)]);
    return `${head({ title, desc: d.desc, path, ld })}
${header(false)}
<main id="main" class="case hub" style="--bc:${col};--bt:#111">
  ${hubHero(d.eyebrow, d.h1, d.lead, col)}
  <section class="wrap c2-lead hub-intro">${d.intro.map((x) => `<p>${x}</p>`).join("")}</section>
  <section class="sec"><div class="wrap"><h2 class="eyebrow mono">What we do on ${esc(street)}</h2>${cards(d.offer, col)}</div></section>
  <section class="sec sec-alt" id="work"><div class="wrap"><p class="eyebrow mono">${esc(street)} · ${d.cases.length + (d.street === "C" ? zdPages().length : 0)} case studies</p>
    <h2 class="ptitle">${pill("The work", col, -1.5)}</h2>${hubCases(d.cases, covers, col)}
    ${(() => { const more = PROJECTS.filter((p) => p.street === d.street && !p.page); return more.length ? `<p class="friends"><span class="mono">Also on ${esc(street)}</span> ${more.map((p) => `<span class="fpill">${esc(p.name)}</span>`).join("")}</p>` : ""; })()}
    ${d.street === "C" ? zdRow() : "" /* TASK-074: the brands in the Zdrovit park (they were pills above as yard kiosks) */}
  </div></section>
  ${svc.length ? `<section class="sec"><div class="wrap"><p class="eyebrow mono">How we can help</p><div class="hub-links">${svc.map((x) => `<a href="/services/${x.slug}/"><b>${esc(x.name)}</b><span>${esc(x.lead)}</span><i>→</i></a>`).join("")}</div></div></section>` : ""}
  ${hubFaq(d.faq)}
  <section class="sec"><div class="wrap"><p class="eyebrow mono">Other streets</p><div class="more">${others.map((o) => `<a href="/industries/${o.slug}/" style="--bc:${STREETS[o.street][1]};--bt:#111">${esc(o.streetName)} <i>→</i></a>`).join("")}</div></div></section>
  ${hubEnd}
</main>
${footer}`;
  }

  function servicePage(slug, covers = {}) {
    const d = SERVICE_PAGES.find((x) => x.slug === slug);
    const col = ({ "The Dream": "#28C840", "The Voice": "#B098C8", "The World": "#119BFE", "The Crowd": "#F65342" })[d.chapter] || "#FED012";
    const path = `/services/${slug}/`, title = `${d.title} · Cromatic Studios`;
    const inds = (d.industries || []).map((k) => INDUSTRIES.find((x) => x.slug === k)).filter(Boolean);
    const ld = hubLd(path, title, d.desc, [["Services", "/site/#services"], [d.name, path]], [
      { "@type": "Service", "@id": `${SITE}${path}#service`, name: d.name, serviceType: d.name, description: d.desc, provider: { "@id": `${SITE}/#studio` }, areaServed: [{ "@type": "Country", name: "Romania" }, { "@type": "Place", name: "European Union" }],
        hasOfferCatalog: { "@type": "OfferCatalog", name: d.name, itemListElement: d.includes.map((x) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name: x.t, description: strip(x.p) } })) } },
      listLd(path, d.cases, `${d.name}: case studies`), faqLd(path, d.faq)]);
    return `${head({ title, desc: d.desc, path, ld })}
${header(false)}
<main id="main" class="case hub" style="--bc:${col};--bt:#111">
  ${hubHero(d.eyebrow, d.h1, d.lead, col)}
  <section class="wrap c2-lead hub-intro">${d.intro.map((x) => `<p>${x}</p>`).join("")}</section>
  <section class="sec"><div class="wrap"><h2 class="eyebrow mono">What it includes</h2>${cards(d.includes, col)}</div></section>
  <section class="sec sec-alt"><div class="wrap"><h2 class="eyebrow mono">How we work</h2>
    <div class="chapters">${d.process.map((x, i) => `<article class="chap" style="--cc:${["#28C840", "#B098C8", "#119BFE", "#F65342"][i % 4]}"><span class="chap-k mono">${String(i + 1).padStart(2, "0")}</span><h3>${esc(x.t)}</h3><p>${x.p}</p></article>`).join("")}</div>
  </div></section>
  <section class="sec" id="work"><div class="wrap"><p class="eyebrow mono">${esc(d.name)} · ${d.cases.length} case studies</p>
    <h2 class="ptitle">${pill("The work", col, -1.5)}</h2>${hubCases(d.cases, covers, col)}</div></section>
  ${inds.length ? `<section class="sec sec-alt"><div class="wrap"><p class="eyebrow mono">Industries we know from the inside</p><div class="hub-links">${inds.map((x) => `<a href="/industries/${x.slug}/"><b>${esc(x.streetName)}</b><span>${esc(x.lead)}</span><i>→</i></a>`).join("")}</div></div></section>` : ""}
  ${hubFaq(d.faq)}
  <section class="sec"><div class="wrap"><p class="eyebrow mono">Other services</p><div class="more">${SERVICE_PAGES.filter((x) => x.slug !== slug).map((o) => `<a href="/services/${o.slug}/" style="--bc:#FED012;--bt:#111">${esc(o.name)} <i>→</i></a>`).join("")}</div></div></section>
  ${hubEnd}
</main>
${footer}`;
  }

  function teamPage() {
    const path = "/team/", title = "The people behind the studio, Bucharest · Cromatic Studios";
    const desc = "Meet the people of Cromatic Studios, an independent creative studio in Bucharest founded in 2014 and led by two brothers, Daniel and Cristian Stoicescu."; // r136: under 155 characters, a whole sentence
    const FULL = { Daniel: "Daniel Stoicescu", Cristian: "Cristian Stoicescu" };
    const person = (n) => ({ "@type": "Person", "@id": n === "Daniel" ? `${SITE}/#daniel` : n === "Cristian" ? `${SITE}/#cristian` : `${SITE}/team/#${n.toLowerCase().normalize("NFD").replace(/[^a-z]/g, "")}`, name: FULL[n] || n, ...(CREW_INFO[n]?.role ? { jobTitle: CREW_INFO[n].role } : {}), ...(CREW_INFO[n]?.bio ? { description: CREW_INFO[n].bio } : {}), ...(CREW_INFO[n]?.instagram ? { sameAs: [CREW_INFO[n].instagram] } : {}), worksFor: { "@id": `${SITE}/#studio` } });
    const ld = hubLd(path, title, desc, [["Team", path]], [{ "@type": "AboutPage", "@id": `${SITE}${path}#about`, url: `${SITE}${path}`, about: { "@id": `${SITE}/#studio` } }, ...CREW.map(person)]);
    return `${head({ title, desc, path, ld })}
${header(false)}
<main id="main" class="case hub" style="--bc:#B098C8;--bt:#111">
  ${hubHero("The crew · Bucharest · since 2014", "Brilliant humans, one coffee at a time", "An independent creative studio in Bucharest. We discover AI every day, and we still believe in the collective power of brilliant humans.", "#B098C8")}
  <section class="wrap c2-lead hub-intro">
    <p>Cromatic Studios started in <strong>2014</strong> with two people and a company name written on a napkin. It was founded by <strong>Daniel Stoicescu</strong>, who is still the studio's creative architect. Today the studio is led by two partners, who are also brothers: <strong>Daniel Stoicescu</strong>, the founder, and <strong>Cristian Stoicescu</strong>, the CEO.</p>
    <p>Strategy, identity, websites, film and content are made here, under one roof, for indie founders, startups and established companies.</p>
  </section>
  <section class="sec sec-alt" id="crew"><div class="wrap">
    <h2 class="ptitle">${pill("The", "#28C840", -2)} ${pill("crew", "#B098C8", 1.5)}</h2>
    <ul class="crew team-crew">${CREW.map((n, i) => { const f = A(CREW_FACE_VARS[n]); const ci = CREW_INFO[n] || {}; return `<li id="${n.toLowerCase().normalize("NFD").replace(/[^a-z]/g, "")}" style="--cc:${CREW_COLORS[i % CREW_COLORS.length]}"><span class="cr-face">${f ? `<img src="${f.src}" width="${f.w}" height="${f.h}" alt="${esc(FULL[n] || n)}" loading="lazy" decoding="async">` : ""}</span><span class="cr-name">${esc(FULL[n] || n)}</span>${ci.role ? `<span class="cr-role mono">${esc(ci.role)}</span>` : ""}${ci.bio ? `<span class="cr-bio">${esc(ci.bio)}</span>` : ""}${ci.instagram ? `<a class="cr-link" href="${ci.instagram}" target="_blank" rel="noopener">Instagram ↗</a>` : ""}</li>`; }).join("")}</ul>
  </div></section>
  <section class="sec sec-alt"><div class="wrap"><div class="photos">${CREW_PHOTOS.map((p) => `<figure${p.big ? ' class="ph-big"' : ""}>${img(p.src, p.cap)}<figcaption class="mono">${esc(p.cap)}</figcaption></figure>`).join("")}</div></div></section>
  ${hubEnd}
</main>
${footer}`;
  }

  // r136 (Daniel): the privacy policy, /privacy/ (and /ro/confidentialitate/ through the dictionary). DRAFT: the wording
  // still has to be checked by a lawyer before it is final (say so here only, never on the page). The company data
  // lives on this page, not in the footer (Daniel).
  const PRIVACY = [
    ["Who we are", [`This website belongs to Cromatic Studios, an independent creative studio in Bucharest. The company responsible for your data (the controller) is <strong>Radio Intelligence SRL</strong>, VAT number RO29014197, Bucharest, Romania.`, `For anything about your data, write to <a href="mailto:${STUDIO.email}">${STUDIO.email}</a>. A person from the studio reads it, not a bot.`]],
    ["What we collect when you write to us", [`The boarding pass on the map is how you tell us about your project. It asks for:`,
      { ul: ["your name", "your email address", "your phone number, if you want to give it", "your message", "the choices you tick: what you dream of, your industry, when you want to start"] },
      `The server also notes when the boarding pass was sent and the IP address it came from, so we can stop spam.`]],
    ["Why we use it", [`For one thing: to answer your enquiry and, if you want one, to prepare an offer. We do not sell your data, we do not add you to a newsletter and we do not use what you write for ads.`,
      `The legal basis is the steps you ask us to take before a possible contract (GDPR, Article 6(1)(b)) and your consent, which you give when you send the boarding pass (Article 6(1)(a)).`]],
    ["Who else handles it", [`A few services help us run the website. They process data only on our behalf:`,
      { ul: ["<strong>Google Workspace</strong> delivers the emails: your message to our inbox, and your copy of the boarding pass to you.", "<strong>Bunnyshell</strong> and <strong>DigitalOcean</strong> host the website and its server, where a backup copy of each message is kept.", "<strong>Cloudflare</strong> sits in front of the website, keeps it safe and fast, and sees technical data such as your IP address."] },
      `Some of these companies may process data outside the European Union. When they do, they rely on the European Commission's standard contractual clauses or adequacy decisions.`]],
    ["How long we keep it", [`Enquiries are kept for up to 24 months, then deleted. If your enquiry turns into a project, we keep what the contract and the law ask us to keep (accounting rules, for example) for as long as they ask.`]],
    ["Cookies, statistics and films", [`Nothing from Google Analytics or Google Tag Manager loads until you say yes on the cookie card. If you do, Google Analytics 4 counts visits and clicks, so we know what works. If you say no, your browser only remembers that answer, so we don't ask again. You can change your mind at any time with the Cookies link at the bottom of the page.`,
      `The same yes also loads the <strong>OpenAI Ads</strong> measurement pixel, so we can see whether our ads in ChatGPT bring visits. When you send a boarding pass, it tells OpenAI only that one was sent, never what you wrote in it. Without your yes, nothing from OpenAI loads.`,
      `Films hosted on YouTube load only when you press play. Until then you see a picture from our own server, and nothing is sent to YouTube.`]],
    ["Your rights", [`You can ask us what data we hold about you and get a copy of it. You can have it corrected or deleted, limit how we use it or object to it, and take it with you. You can withdraw your consent at any time; what we did before stays lawful.`,
      `Write to <a href="mailto:${STUDIO.email}">${STUDIO.email}</a>. We answer within a month, usually much sooner.`]],
    ["If something is wrong", [`Tell us first, we'd like to fix it. You also have the right to complain to the Romanian data protection authority, ANSPDCP (Autoritatea Națională de Supraveghere a Prelucrării Datelor cu Caracter Personal), B-dul G-ral. Gheorghe Magheru 28-30, Sector 1, Bucharest, <a href="https://www.dataprotection.ro/" target="_blank" rel="noopener">dataprotection.ro</a>.`]],
    ["Changes", [`If this page changes, the date at the top changes too.`]]
  ];
  function privacyPage() {
    const path = "/privacy/", title = "Privacy policy · Cromatic Studios";
    const desc = "How Cromatic Studios handles your data: what the boarding pass collects, why, who helps us, how long we keep it, cookies, and your rights.";
    const ld = hubLd(path, title, desc, [["Privacy", path]]);
    return `${head({ title, desc, path, ld })}
${header(false)}
<main id="main" class="case hub legal-page" style="--bc:#FED012;--bt:#111">
  <section class="c-hero c2-hero hub-hero">
    <div class="wrap">
      <p class="eyebrow mono">Privacy policy · updated 14 October 2026</p>
      <h1 class="c2-title">${"Your data, plainly".split(" ").map((w, k) => `<span class="w" style="--k:${k}">${w}</span>`).join(" ")}</h1>
      <p class="lead hub-lead">What happens to what you tell us, in plain words. Short version: we use it to answer you, and nothing else.</p>
    </div></section>
  <section class="sec"><div class="wrap legal">
    ${PRIVACY.map(([h, body]) => `<h2>${h}</h2>\n    ${body.map((b) => (typeof b === "string" ? `<p>${b}</p>` : `<ul>${b.ul.map((li) => `<li>${li}</li>`).join("")}</ul>`)).join("\n    ")}`).join("\n    ")}
  </div></section>
  ${hubEnd}
</main>
${footer}`;
  }

  // TASK-122: a landing page for an ads campaign (/lp/<slug>/), from site/landings/<slug>.json through build/landings.mjs.
  // One goal, The Core Lite: every section ends one step closer to it, the hero, the header and the sticky bar open it,
  // the finale sells it; the boarding pass is the quiet alternative. No menu, no way out but the case cards and the
  // drive; noindex, never in the sitemap. `L` holds the page's English words (the Romanian copy is made from it by the
  // dictionary, with the landing's own "ro" fields added); `L.assets` its own CSS and JS (site/landings/lp.css, lp.js),
  // inlined. The website's blocks: the logo cards, the bento case cards, the hub cards, the chapters, the boarding pass.
  const LP_ICONS = [
    '<path d="M3 18h18l-2-10-4 4-3-7-3 7-4-4z"/>', // crown
    '<path d="M12 20s-7-4.5-7-10a4 4 0 0 1 7-2.5A4 4 0 0 1 19 10c0 5.5-7 10-7 10z"/>', // heart
    '<path d="M12 3l2 7 7 2-7 2-2 7-2-7-7-2 7-2z"/>', // spark
    '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>', // shield
    '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>', // compass
    '<path d="M12 21c-4 0-6-3-6-6 0-4 4-6 4-10 3 2 4 4 4 6 1-1 1.5-2 1.5-3 2 2 2.5 4 2.5 7 0 3-2 6-6 6z"/>', // flame
    '<path d="M5 19c0-9 6-14 15-14 0 9-5 15-14 15M5 19l8-8"/>', // leaf
    '<path d="M4 5h7v14H4zM13 5h7v14h-7z"/>', // book
    '<circle cx="12" cy="12" r="9"/><path d="M8 14c2 2.2 6 2.2 8 0M9 9.5h.01M15 9.5h.01"/>', // smile
    '<path d="M4 20c2 0 4-1 4-3l9-9-2-2-9 9c-2 0-3 2-3 4zM15 6l3 3"/>', // brush
    '<circle cx="12" cy="12" r="4"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>', // sun
    '<path d="M4 11l8-7 8 7v9H4zM10 20v-5h4v5"/>' // house
  ];
  const lpIcon = (i) => `<svg viewBox="0 0 24 24" fill="none" stroke="#0d0c09" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${LP_ICONS[i % LP_ICONS.length]}</svg>`;
  const lpCar = (big) => `<svg viewBox="0 0 150 62" aria-hidden="true"><path d="M10 42 14 30q2-4 8-4h22l12-14q2-2 6-2h34q4 0 7 3l13 13 18 2q8 1 9 8l1 8q0 4-4 4H12q-4 0-2-6z" fill="#FED012" stroke="#0d0c09" stroke-width="2.5" stroke-linejoin="round"/><path d="M60 14 50 26h28V14zM82 14v12h28L99 14z" fill="#bfe3f5" stroke="#0d0c09" stroke-width="2" stroke-linejoin="round"/><path d="M12 40h130" stroke="#0d0c09" stroke-width="1.5" opacity=".35"/><rect x="88" y="30" width="8" height="2.5" rx="1" fill="#0d0c09"/><circle cx="139" cy="35" r="3.2" fill="#fff" stroke="#0d0c09" stroke-width="1.5"/><rect x="10" y="32" width="4" height="5" rx="1" fill="#F65342" stroke="#0d0c09" stroke-width="1.2"/>${[38, 116].map((x) => `<g${big ? ' class="wh"' : ""}><circle cx="${x}" cy="48" r="10" fill="#0d0c09"/><circle cx="${x}" cy="48" r="4.2" fill="#cfcdc8"/><path d="M${x} 41v14M${x - 7} 48h14" stroke="#6b6860" stroke-width="1.6"/></g>`).join("")}</svg>`;
  const lpCheck = '<svg viewBox="0 0 24 24" fill="none" stroke="#0d0c09" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>';
  function landingPage(L, covers = {}) {
    const col = L.color || "#FED012";
    const freeHref = `${esc(L.freebieHref)}?src=${esc(L.slug)}`;
    const toTool = (pos, cls = "btn btn-y", label = L.cta) => `<a class="${cls}" href="${freeHref}" data-lp-free="${pos}">${STAR}<span>${esc(label)}</span></a>`;
    const title2 = (t, rv = true) => `<h2 class="ptitle"${rv ? " data-rv" : ""}>${pill(esc(t[0]), col, -1.5)}${t[1] ? ` ${pill(esc(t[1]), "#FED012", 1)}` : ""}</h2>`;
    const words = (t) => esc(t).split(" ").map((w, k) => `<span class="w" style="--k:${k}">${w}</span>`).join(" ");
    const nudge = (k) => { const n = L.nudges?.[k]; return n ? `<div class="lp-nudge" data-rv><span class="lp-orb" aria-hidden="true"></span><p>${esc(n.t)}</p><a href="#freebie" data-lp-cta="nudge-${k}"><span>${esc(n.go)}</span> <i aria-hidden="true">→</i></a></div>` : ""; };
    const logoCard = (name, i) => {
      const p = PROJECTS.find((x) => x.name === name);
      const inner = p?.badge && A(p.badge) ? img(p.badge, name) : `<b class="lp-wm">${esc(name)}</b>`;
      return `<span class="logo-card lp-logo" style="--d:${((i * 0.53) % 3).toFixed(2)}s;--r:${[-2.5, 1.8, -1.2, 2.4, -1.8, 1.2][i % 6]}deg">${inner}</span>`;
    };
    const projects = L.cases.map((sl) => byPage(sl)).filter(Boolean);
    const svcs = L.services.map((k) => SERVICE_PAGES.find((x) => x.slug === k)).filter(Boolean);
    const hidden = ["lp", "lp_v", "utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].map((n) => `<input type="hidden" name="${n}" data-lead${n === "lp" ? ` value="${esc(L.slug)}"` : ""}>`).join("");
    const form = contactForm().replace('<input class="hp"', `${hidden}\n    <input class="hp"`);
    const fig = (x, i) => { const num = /^\d+$/.test(x.n) ? ` data-count="${x.n}"${x.from ? ` data-from="${esc(x.from)}"` : ""}` : ""; return `<p class="lp-fig" data-rv style="--i:${i}"><b${num}>${esc(x.n)}</b><span>${esc(x.t)}</span></p>`; };
    const proof = (L.proof || []).length ? `<section class="sec sec-alt lp-proof" id="proof"><div class="wrap">
      <p class="eyebrow mono" data-rv>${esc(L.proofEyebrow)}</p>${title2(L.proofTitle)}
      <div class="lp-proof-grid">${L.proof.map((x, i) => x.q
        ? `<figure class="lp-q" data-rv style="--i:${i}"><blockquote><p>${esc(x.q)}</p></blockquote><figcaption class="mono">${esc(x.by)}</figcaption></figure>`
        : fig(x, i)).join("")}</div>
      ${nudge("proof")}
    </div></section>` : "";
    const D = L.drive || {};
    const stills = (D.stills || []).map((n) => `<img src="/onboarding/media/${esc(n)}.webp" width="1280" height="800" alt="" loading="lazy" decoding="async">`).join("");
    const pins = L.logos.slice(0, 3).map((n, k) => `<span class="lpd-pin" style="--k:${k};left:${[14, 46, 70][k]}%;top:${[18, 34, 12][k]}%" aria-hidden="true">${esc(n)}</span>`).join("");
    const drive = D.title ? `<section class="lp-drive" aria-labelledby="lpd-h"><div class="wrap">
    <a class="lpd-card" href="${esc(D.href || "/?map")}" target="_blank" rel="noopener" data-lp-drive="banner" data-rv>
      <div class="lpd-txt">
        <p class="eyebrow mono"><span class="lpd-live" aria-hidden="true"></span><span>${esc(D.eyebrow)}</span></p>
        <h2 class="ptitle" id="lpd-h">${pill(esc(D.title[0]), "#FED012", -1.5)} ${pill(esc(D.title[1]), col, 1)}</h2>
        <p>${esc(D.p)}</p>
        <span class="lpd-btn"><span>${esc(D.cta)}</span><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 3h8v8M13 3 3 13"/></svg></span>
        <span class="lpd-keys" aria-hidden="true">${["W", "A", "S", "D"].map((k, i) => `<kbd style="--k:${i}">${k}</kbd>`).join("")}</span>
        <p class="lpd-note">${esc(D.note)}</p>
      </div>
      <div class="lpd-scene" aria-hidden="true">
        <div class="lpd-strip">${stills}${stills.replace(/ loading="lazy"/g, ' loading="lazy" aria-hidden="true"')}</div>
        ${pins}
        <div class="lpd-road"></div>
        <div class="lpd-car"><i class="lpd-puff"></i><i class="lpd-puff"></i><i class="lpd-puff"></i>${lpCar(true)}</div>
      </div>
    </a></div></section>` : "";
    const F = L.finale || {};
    const robots = '<meta name="robots" content="noindex, follow">';
    // ?v=b swaps the headline before the first paint; lp-js arms the reveal (no script: everything shows)
    const vScript = `<script>(function(){var c=document.documentElement.classList;c.add("lp-js");setTimeout(function(){if(!window.__lpOk)c.remove("lp-js")},3000);try{if(/[?&]v=b\\b/.test(location.search))c.add("lp-b")}catch(e){}})();</script>`;
    const h = head({ title: L.title, desc: L.desc, path: L.path, preload: `${vScript}\n<style id="lp-css">${L.assets?.css || ""}</style>` }).replace(/<meta name="robots"[^>]*>/, robots);
    return `${h}
<a class="skip" href="#main">Skip to content</a>
<header class="hdr lp-hdr"><div class="wrap hdr-in"><span class="brand">${logo ? `<img src="${logo.src}" alt="Cromatic Studios" width="${logo.w}" height="${logo.h}">` : "Cromatic Studios"}</span>${toTool("header")}</div>
  <div class="lp-road" aria-hidden="true"><span class="lp-mini">${lpCar(false)}</span><i class="lp-goal"></i></div></header>
<main id="main" class="case hub lp" style="--bc:${col};--bt:#111" data-lp="${esc(L.slug)}" data-free="${esc(L.freebieHref)}">
  <section class="c-hero c2-hero hub-hero lp-hero">
    <div class="wrap">
      <div class="lp-hero-txt">
        <p class="eyebrow mono">${esc(L.eyebrow)}</p>
        <h1 class="c2-title"><span class="lp-va">${words(L.headA)}</span><span class="lp-vb">${words(L.headB)}</span></h1>
        <p class="lead hub-lead">${esc(L.lead)}</p>
        <div class="btns">${toTool("hero")}<span class="lp-meta">${esc(L.ctaMeta)}</span></div>
      </div>
      <a class="lp-ticket" href="#freebie" data-lp-cta="ticket">
        <span class="lpt-head"><span>${esc(L.ticket.label)}</span><i aria-hidden="true">✈</i></span>
        <span class="lpt-rows">${L.ticket.rows.map((r) => `<span class="lpt-row"><small>${esc(r.k)}</small><b>${esc(r.v)}</b></span>`).join("")}</span>
        <span class="lpt-cut" aria-hidden="true"></span>
        <span class="lpt-foot"><i class="lpt-bars" aria-hidden="true"></i><span class="lpt-go">${esc(L.ticket.go)}</span></span>
      </a>
      <div class="lp-logos" aria-label="${esc(L.logosLabel)}">${L.logos.map(logoCard).join("")}</div>
    </div></section>
  <section class="sec"><div class="wrap"><p class="eyebrow mono" data-rv>${esc(L.benefitsEyebrow)}</p>${title2(L.benefitsTitle)}
    <div class="hub-cards">${L.benefits.map((x, i) => `<article class="hub-card" data-rv style="--sc:${col};--i:${i}"><span class="mono">${String(i + 1).padStart(2, "0")}</span><h3>${esc(x.t)}</h3><p>${esc(x.p)}</p></article>`).join("")}</div>
    ${nudge("benefits")}</div></section>
  <section class="sec sec-alt" id="work"><div class="wrap"><p class="eyebrow mono" data-rv>${esc(L.casesEyebrow)}</p>${title2(L.casesTitle)}
    <div class="bento" style="--dc:${col}">${projects.map((p, i) => bentoCard(p, i, covers)).join("")}</div>
    ${nudge("cases")}</div></section>
  ${drive}
  <section class="sec"><div class="wrap"><p class="eyebrow mono" data-rv>${esc(L.servicesEyebrow)}</p>${title2(L.servicesTitle)}
    <div class="lp-svc">${svcs.map((s, i) => `<article data-rv style="--i:${i}"><h3>${esc(s.name)}</h3><ul>${s.includes.slice(0, 4).map((x) => `<li>${esc(x.t)}</li>`).join("")}</ul></article>`).join("")}</div>
    ${nudge("services")}</div></section>
  <section class="sec sec-alt"><div class="wrap"><p class="eyebrow mono" data-rv>${esc(L.stepsEyebrow)}</p>${title2(L.stepsTitle)}
    <div class="chapters">${L.steps.map((x, i) => `<article class="chap" style="--cc:${["#28C840", "#B098C8", "#119BFE", "#F65342"][i % 4]}"><span class="chap-k mono">${String(i + 1).padStart(2, "0")}</span><h3>${esc(x.t)}</h3><p>${esc(x.p)}</p>${x.free ? `<a class="lp-free-chip" href="#freebie" data-lp-cta="step">${esc(L.stepsFree)}</a>` : ""}</article>`).join("")}</div>
    ${nudge("steps")}</div></section>
  ${proof}
  <section class="lp-final" id="freebie" aria-labelledby="lpf-h"><div class="wrap">
    <div class="lpf-box" data-rv>
      <span class="lpf-sticker" aria-hidden="true">${esc(F.sticker)}</span>
      <div class="lp-teller" role="img" aria-label="${esc(F.teller)}">
        <div class="lpb-orbit">${LP_ICONS.map((_, k) => `<span style="--k:${k}">${lpIcon(k)}</span>`).join("")}</div>
        <div class="lpb-stand"></div>
        <div class="lpb-ball"><span class="lpb-glyph"><svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12 2l2.4 7.2L22 12l-7.6 2.8L12 22l-2.4-7.2L2 12l7.6-2.8z"/></svg></span></div>
        <p class="lpb-cap"><b>${esc(F.teller)}</b><small>${esc(F.tellerCap)}</small></p>
      </div>
      <div>
        <p class="eyebrow mono lpf-eyebrow">${esc(F.eyebrow)}</p>
        <h2 class="lpf-h" id="lpf-h">${esc(F.title)}</h2>
        <p class="lpf-sub">${esc(F.sub)}</p>
        <p class="eyebrow mono">${esc(F.itemsTitle)}</p>
        <ul class="lpf-items" data-rv>${(F.items || []).map((x, i) => `<li style="--i:${i}"><i>${lpCheck}</i><b>${esc(x.t)}</b><span>${esc(x.p)}</span></li>`).join("")}</ul>
        <div class="lpf-cta">${toTool("final")}<span class="lp-meta">${esc(L.ctaMeta)}</span></div>
        <p class="lpf-note">${esc(F.note)}</p>
      </div>
    </div>
  </div></section>
  <section id="contact" class="sec lp-talk">
    <div class="wrap contact">
      <div class="c-txt">
        <p class="eyebrow mono">${esc(L.talk.eyebrow)}</p>
        <h2 class="ptitle">${pill(esc(L.talk.title[0]), "#119BFE", -2)} ${pill(esc(L.talk.title[1]), "#F65342", 1.5)}</h2>
        <p class="sec-lead">${esc(L.talk.lead)}</p>
      </div>
      <details><summary class="btn">${esc(L.talk.open)}</summary>
      ${form}
      </details>
    </div>
  </section>
</main>
<div class="lp-sticky" aria-hidden="true"><span class="lp-orb" aria-hidden="true"></span><span class="lps-t"><b>${esc(F.title)}</b><small>${esc(L.ctaMeta)}</small></span>${toTool("sticky").replace("<a ", '<a tabindex="-1" ')}</div>
<footer class="ftr lp-ftr"><div class="cz-foot" data-czf></div></footer>
<script>${L.assets?.js || ""}</script>
</body></html>`;
  }
  return { home, casePage, canvasPage, industryPage, servicePage, teamPage, privacyPage, landingPage, industrySlugs: INDUSTRIES.map((x) => x.slug), serviceSlugs: SERVICE_PAGES.map((x) => x.slug), slugs: Object.keys(CASES), canvasSlugs: Object.keys(CANVASES).filter((k) => canvases[k]) };
}
