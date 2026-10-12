// Everything machines read about the studio: schema.org JSON-LD, /llms.txt, robots.txt,
// the sitemap and the web manifest. The facts live here once; src/content.html is the prose.

export const STUDIO = {
  name: "Cromatic Studios",
  legalUrl: "https://cromaticstudios.com/",
  email: "hi@cromaticstudios.com",
  phone: "+40 728 978 068",
  street: "Strada Olari 9",
  postalCode: "024056",
  city: "București",
  geo: { lat: 44.43886, lng: 26.11626 }, // OpenStreetMap, Strada Olari 9 (Sector 2)
  country: "RO",
  founded: "2014",
  founder: { name: "Daniel Stoicescu", jobTitle: "Founder, partner and creative architect", sameAs: ["https://www.instagram.com/daniel.stoic/"] },
  ceo: { name: "Cristian Stoicescu", jobTitle: "CEO and partner" },
  size: 10,
  description: "Independent creative studio in Bucharest, Romania: brand strategy, identity design, websites and apps, video production and content for growth."
};

export const SERVICES = [
  ["Branding & Design", "Brand strategy, identity design, brand book, persona journeys, content design, generative AI for visuals."],
  ["Video Production", "Video production, photography, post production, sound design, generative AI for video."],
  ["UX & UI Design", "Rapid prototyping, information architecture, high quality mockups, websites and apps, design systems."],
  ["Growth & Content", "Content strategy, Instagram growth, social post design, ad campaigns."]
];

export const WORK = [
  ["Slow Coffee Festival", "Brand, product", "The biggest coffee lovers community in the country; a brand universe upgraded year after year since 2021."],
  ["Two Minutes", "Brand, coffee, retail", "A specialty coffee shop brand made to be loved fast and remembered long, with Two Min Lab bottled drinks and coffee packaging."],
  ["Steam Coffee Shop", "Branding, growth, product", "A pioneer coffee brand refreshed for its community."],
  ["Craft Coffee", "Branding, website", "The Romanian distributor of La Marzocco, Mazzer, PuQPress and Fellow: a brand and a shop built to equip the passion for coffee."],
  ["Artisan Coffee Gear", "Brand universe, web", "Coffee gear in a tailor made brand world, from the letterform pattern to the webshop."],
  ["OMA Coffee", "Brand", "A specialty coffee shop in Brașov, at the foot of the mountains."],
  ["Kómpus", "Brand", "Differentiating a coffee shop by enabling the founder's vision."],
  ["Sip Coffee & Wine", "Branding, communication", "A branding that fits one of the best designed coffee shops in town."],
  ["Yoshi Izakaya", "Communication, content", "Top content for the best sushi in town."],
  ["7 Oale", "Brand", "A comfort soup brand with a mission against big fast food."],
  ["Berero", "Brand", "Brand identity."],
  ["The Aesthetic Court", "Website, UX, UI", "A medical congress staged as a courtroom at the Palace of the Parliament in Bucharest, and its website built as the trial itself."],
  ["ARCA Resort", "Packaging, caviar, livery", "Caviar tins, a delivery van and smoked-fish trays for a resort in Blăgești with its own ponds and production."],
  ["Antila", "Brand identity, illustration, packaging", "A charcuterie brand, 100% Romanian, with a bold wordmark, disruptive characters and colour-coded packaging."],
  ["UNDÉ", "Brand identity, signage", "ARCA's grocery stores: a hand-drawn basket and three formats, Market, Store and Concept."],
  ["Investimental", "UX, UI, product", "A retail broker helped to win in digital, with a product experience built for first-time investors."],
  ["Routine Paris", "Brand, identity", "A daily ritual brand with a Parisian address and an indie heart."],
  ["Assetto", "Product, brand", "Product and brand for a data-driven fintech platform."],
  ["Cargus", "Website, 2023", "A website for a national courier that moves as fast as the parcels."],
  ["Help4Brain", "Product, marketing", "Enabling a pharma challenger to become a leader."]
];

export const FAQ = [
  ["What does Cromatic Studios do?", "Cromatic Studios is an independent creative studio in Bucharest, Romania. We do brand strategy, identity design, websites and apps (UX and UI), video production and photography, and content and growth for social media."],
  ["Who do you work with?", "Indie and local businesses, startups, scale-ups and established companies. Many of our clients are specialty coffee brands (Slow Coffee Festival, Two Minutes, Steam, Craft Coffee, Artisan Coffee Gear, OMA Coffee), alongside fintech and digital products such as Investimental, Assetto, Cargus and Help4Brain."],
  ["Who runs Cromatic Studios?", "Cromatic Studios was founded in 2014 by Daniel Stoicescu, who is still its creative architect. Today the studio is led by two partners, who are also brothers: Daniel Stoicescu, the founder, and Cristian Stoicescu, the CEO."],
  ["Where is the studio?", "Strada Olari 9, Bucharest, Romania. Come by for a coffee."],
  ["How do I start a project?", "Complete the boarding pass at the end of the drive, or write to hi@cromaticstudios.com. We answer within one working day."]
];

// AI crawlers that do not run JavaScript still get the full story from the text version
const BOTS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended", "CCBot", "Meta-ExternalAgent", "Bingbot", "Googlebot"];

export function jsonLd(SITE, PROJECTS = [], SAME_AS = [STUDIO.legalUrl]) {
  const studio = `${SITE}/#studio`;
  const work = PROJECTS.length ? PROJECTS.filter((p) => p.page && !p.small).filter((p, i, a) => a.findIndex((q) => q.page === p.page) === i).map((p) => [p.name, p.cat, p.desc, `${SITE}/work/${p.page}/`]) : WORK;
  const graph = [
    {
      "@type": ["Organization", "ProfessionalService"],
      "@id": studio,
      name: STUDIO.name,
      url: `${SITE}/`,
      sameAs: SAME_AS,
      logo: { "@type": "ImageObject", url: `${SITE}/icon-512.png`, width: 512, height: 512 },
      image: `${SITE}/og.jpg`,
      description: STUDIO.description,
      email: STUDIO.email,
      telephone: STUDIO.phone,
      foundingDate: STUDIO.founded,
      foundingLocation: { "@type": "Place", name: "Strada Muniției 5, Bucharest" },
      founder: { "@type": "Person", "@id": `${SITE}/#daniel`, name: STUDIO.founder.name, jobTitle: STUDIO.founder.jobTitle, sameAs: STUDIO.founder.sameAs, worksFor: { "@id": studio } },
      employee: [{ "@id": `${SITE}/#daniel` }, { "@type": "Person", "@id": `${SITE}/#cristian`, name: STUDIO.ceo.name, jobTitle: STUDIO.ceo.jobTitle, worksFor: { "@id": studio } }],
      address: { "@type": "PostalAddress", streetAddress: STUDIO.street, postalCode: STUDIO.postalCode, addressLocality: "Bucharest", addressRegion: STUDIO.city, addressCountry: STUDIO.country },
      geo: { "@type": "GeoCoordinates", latitude: STUDIO.geo.lat, longitude: STUDIO.geo.lng },
      hasMap: "https://www.google.com/maps/search/?api=1&query=Cromatic+Studios+Strada+Olari+9+Bucuresti",
      slogan: "Killer strategy. Outstanding design. Striking visuals. Powerful storytelling.",
      contactPoint: { "@type": "ContactPoint", contactType: "new projects", email: STUDIO.email, telephone: STUDIO.phone, availableLanguage: ["English", "Romanian"] },
      areaServed: [{ "@type": "Country", name: "Romania" }, { "@type": "Place", name: "European Union" }],
      knowsAbout: ["Brand strategy", "Brand identity", "Visual identity design", "UX design", "UI design", "Web design", "Video production", "Photography", "Content strategy", "Social media growth", "Specialty coffee branding"],
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Services",
        itemListElement: SERVICES.map(([name, description]) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name, description, provider: { "@id": studio } } }))
      }
    },
    { "@type": "WebSite", "@id": `${SITE}/#website`, url: `${SITE}/`, name: "Cromatic Studios", alternateName: "Cromatic Studios · Navigation Mode", inLanguage: "en", publisher: { "@id": studio } },
    {
      "@type": "WebPage",
      "@id": `${SITE}/#page`,
      url: `${SITE}/`,
      name: "Cromatic Studios · Branding, web & film studio in Bucharest",
      isPartOf: { "@id": `${SITE}/#website` },
      about: { "@id": studio },
      primaryImageOfPage: `${SITE}/og.jpg`,
      inLanguage: "en"
    },
    {
      "@type": "ItemList",
      "@id": `${SITE}/#work`,
      name: "Selected work by Cromatic Studios",
      itemListElement: work.map(([name, genre, description, url], i) => ({ "@type": "ListItem", position: i + 1, item: { "@type": "CreativeWork", name, genre, description, ...(url ? { url, "@id": `${url}#work` } : {}), creator: { "@id": studio } } }))
    },
    {
      "@type": "FAQPage",
      "@id": `${SITE}/#faq`,
      mainEntity: FAQ.map(([q, a]) => ({ "@type": "Question", name: q, acceptedAnswer: { "@type": "Answer", text: a } }))
    }
  ];
  // "<" escaped so the JSON can never close the script tag
  return `<script type="application/ld+json">${JSON.stringify({ "@context": "https://schema.org", "@graph": graph }).replace(/</g, "\\u003c")}</script>`;
}

// /llms.txt (llmstxt.org): what an AI assistant needs to describe the studio correctly, with a link
// to every case study. Built from site/data.mjs, so it can never fall behind the portfolio.
export function llmsTxt(SITE, D, pages = {}) {
  const { PROJECTS, STREETS, CHAPTERS, OFFICES, CREW, CREW_INFO, FRIENDS } = D;
  const seen = new Set();
  const line = (p) => {
    const pg = pages[`/work/${p.page}/`];
    return `- [${p.name}](${SITE}/work/${p.page}/): ${p.cat}. ${pg ? pg.fullDesc : p.desc}`;
  };
  const groups = Object.entries(STREETS).map(([k, [street]]) => {
    const list = PROJECTS.filter((p) => p.street === k && p.page && !seen.has(p.page) && seen.add(p.page));
    return list.length ? `### ${street}\n\n${list.map(line).join("\n")}` : "";
  }).filter(Boolean);
  const studioPages = Object.keys(pages).filter((u) => /^\/work\//.test(u) && !PROJECTS.some((p) => `/work/${p.page}/` === u));
  const noPage = PROJECTS.filter((p) => !p.page).map((p) => p.name);
  return `# Cromatic Studios

> ${STUDIO.description} Founded in ${STUDIO.founded}; today at ${STUDIO.street}, Bucharest. Strategy first, then identity, websites and apps, film and content, for indie founders, startups and established companies. "There is always a coffee."

This site (${SITE}/) tells the studio's story twice: as an interactive 3D drive through Bucharest (${SITE}/) and as a plain website (${SITE}/site/), with ${seen.size + studioPages.length} case studies under ${SITE}/work/. The plain website is also in Romanian at ${SITE}/ro/ (case studies under ${SITE}/ro/proiecte/). The full text of every page is at ${SITE}/llms-full.txt.

## Studio facts

- Name: ${STUDIO.name}
- What: independent creative studio (branding agency): brand strategy, identity design, websites and apps (UX and UI), video production and photography, content and social media growth
- Address: ${STUDIO.street}, ${STUDIO.postalCode} Bucharest (Sector 2), Romania
- Email: ${STUDIO.email}
- Phone: ${STUDIO.phone}
- Founded: ${STUDIO.founded}, by ${STUDIO.founder.name}, at Strada Muniției 5, Bucharest
- Leadership: two partners and brothers, ${STUDIO.founder.name} (founder, creative architect) and ${STUDIO.ceo.name} (CEO)
- Languages: English, Romanian
- Works with: indie and local businesses, startups, scale-ups and established companies, in Romania and abroad (Paris, Barcelona, Los Angeles)
- Known for: specialty coffee brands (Slow Coffee Festival, Two Minutes, Steam, Craft Coffee, Artisan Coffee Gear, OMA Coffee), fintech and banking (Investimental, Assetto, Techventures Bank, Unchain Festival), medical and aesthetic medicine (Toskani MED, The Aesthetic Court, Elithia, Clinica Sante)
- Team (${CREW.length}): ${CREW.map((n) => CREW_INFO[n]?.role ? `${n} (${CREW_INFO[n].role})` : n).join(", ")}
- Main website: ${STUDIO.legalUrl}
- Profiles: ${(D.SAME_AS || []).filter((u) => u !== STUDIO.legalUrl).join(", ")}

## Services

${CHAPTERS.map((c) => `- ${c.t}, ${c.sub.toLowerCase()}: ${c.p} Includes: ${c.items.join(", ")}.`).join("\n")}

${SERVICES.map(([n, d]) => `- ${n}: ${d}`).join("\n")}

## Industries (the streets of the map)

${Object.keys(pages).filter((u) => u.startsWith("/industries/")).map((u) => `- [${pages[u].title.replace(/ · Cromatic Studios$/, "")}](${SITE}${u}): ${pages[u].fullDesc}`).join("\n")}

## Services in depth

${Object.keys(pages).filter((u) => u.startsWith("/services/")).map((u) => `- [${pages[u].title.replace(/ · Cromatic Studios$/, "")}](${SITE}${u}): ${pages[u].fullDesc}`).join("\n")}
${pages["/team/"] ? `- [The team](${SITE}/team/): ${pages["/team/"].fullDesc}` : ""}

## Case studies

${groups.join("\n\n")}

### The studio itself

${studioPages.map((u) => `- [${pages[u].title.replace(/ · Cromatic Studios$/, "")}](${SITE}${u}): ${pages[u].fullDesc}`).join("\n")}

## Also on the map

Brands we worked with that have no case study page yet: ${noPage.join(", ")}. Friends along the way: ${FRIENDS.join(", ")}.

## FAQ

${FAQ.map(([q, a]) => `### ${q}\n\n${a}`).join("\n\n")}

## Optional

- [Full text of every page](${SITE}/llms-full.txt)
- [Sitemap](${SITE}/sitemap.xml)
- [Directions to ${STUDIO.street}](https://www.google.com/maps/search/?api=1&query=Cromatic+Studios+Strada+Olari+9+Bucuresti)
`;
}

// /llms-full.txt: the readable text of every page, one after the other
export function llmsFull(SITE, docs) {
  return `# Cromatic Studios: full text of ${SITE}/

> Every page of the site as plain text, for AI assistants and search tools. Facts about the studio: ${SITE}/llms.txt

${docs.map((d) => `---\n\nURL: ${SITE}${d.path}\nTitle: ${d.title}\nDescription: ${d.desc}\nLast modified: ${d.lastmod}\n\n${d.text}`).join("\n\n")}
`;
}

export function robotsTxt(SITE) {
  return `# Everyone is welcome, people and machines alike.
User-agent: *
Allow: /
Disallow: /api/

${BOTS.map((b) => `User-agent: ${b}`).join("\n")}
Allow: /
Disallow: /api/

Sitemap: ${SITE}/sitemap.xml
`;
}

// every page with its own last-modified date and its pictures (image sitemap)
export function sitemapXml(SITE, entries) {
  const x = (t) => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
${entries.map((e) => `  <url>
    <loc>${x(SITE + e.path)}</loc>
    <lastmod>${e.lastmod}</lastmod>
${(e.images || []).map((i) => `    <image:image><image:loc>${x(i)}</image:loc></image:image>`).join("\n")}
  </url>`).join("\n")}
</urlset>
`;
}

export function manifest() {
  return JSON.stringify({
    name: "Cromatic Studios · Navigation Mode",
    short_name: "Cromatic",
    description: STUDIO.description,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#0d0c09",
    theme_color: "#FED012",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml" }
    ]
  }, null, 2);
}

// a real .ico: one 32x32 PNG wrapped in the ICO header
export function icoFromPng(png) {
  const head = Buffer.alloc(22);
  head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(1, 4);
  head.writeUInt8(32, 6); head.writeUInt8(32, 7); head.writeUInt8(0, 8); head.writeUInt8(0, 9);
  head.writeUInt16LE(1, 10); head.writeUInt16LE(32, 12); head.writeUInt32LE(png.length, 14); head.writeUInt32LE(22, 18);
  return Buffer.concat([head, png]);
}
