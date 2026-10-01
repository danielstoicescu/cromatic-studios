// Everything machines read about the studio: schema.org JSON-LD, /llms.txt, robots.txt,
// the sitemap and the web manifest. The facts live here once; src/content.html is the prose.

export const STUDIO = {
  name: "Cromatic Studios",
  legalUrl: "https://cromaticstudios.com/",
  email: "hi@cromaticstudios.com",
  phone: "+40 728 978 068",
  street: "Strada Olari 9",
  city: "București",
  country: "RO",
  founded: "2014",
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
  ["Investimental", "UX, UI, product", "A retail broker helped to win in digital, with a product experience built for first-time investors."],
  ["Routine Paris", "Brand, identity", "A daily ritual brand with a Parisian address and an indie heart."],
  ["Assetto", "Product, brand", "Product and brand for a data-driven fintech platform."],
  ["Cargus", "Website, 2023", "A website for a national courier that moves as fast as the parcels."],
  ["Help4Brain", "Product, marketing", "Enabling a pharma challenger to become a leader."]
];

export const FAQ = [
  ["What does Cromatic Studios do?", "Cromatic Studios is an independent creative studio in Bucharest, Romania. We do brand strategy, identity design, websites and apps (UX and UI), video production and photography, and content and growth for social media."],
  ["Who do you work with?", "Indie and local businesses, startups, scale-ups and established companies. Many of our clients are specialty coffee brands (Slow Coffee Festival, Two Minutes, Steam, Craft Coffee, Artisan Coffee Gear, OMA Coffee), alongside fintech and digital products such as Investimental, Assetto, Cargus and Help4Brain."],
  ["Where is the studio?", "Strada Olari 9, Bucharest, Romania. Come by for a coffee."],
  ["How do I start a project?", "Complete the boarding pass at the end of the drive, or write to hi@cromaticstudios.com. We answer within one working day."]
];

// AI crawlers that do not run JavaScript still get the full story from the text version
const BOTS = ["GPTBot", "OAI-SearchBot", "ChatGPT-User", "ClaudeBot", "Claude-SearchBot", "Claude-User", "PerplexityBot", "Perplexity-User", "Google-Extended", "Applebot-Extended", "CCBot", "Meta-ExternalAgent", "Bingbot", "Googlebot"];

export function jsonLd(SITE) {
  const studio = `${SITE}/#studio`;
  const graph = [
    {
      "@type": ["Organization", "ProfessionalService"],
      "@id": studio,
      name: STUDIO.name,
      url: `${SITE}/`,
      sameAs: [STUDIO.legalUrl],
      logo: { "@type": "ImageObject", url: `${SITE}/icon-512.png`, width: 512, height: 512 },
      image: `${SITE}/og.jpg`,
      description: STUDIO.description,
      email: STUDIO.email,
      telephone: STUDIO.phone,
      foundingDate: STUDIO.founded,
      address: { "@type": "PostalAddress", streetAddress: STUDIO.street, addressLocality: STUDIO.city, addressCountry: STUDIO.country },
      areaServed: ["RO", "EU"],
      knowsAbout: ["Brand strategy", "Brand identity", "Visual identity design", "UX design", "UI design", "Web design", "Video production", "Photography", "Content strategy", "Social media growth", "Specialty coffee branding"],
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Services",
        itemListElement: SERVICES.map(([name, description]) => ({ "@type": "Offer", itemOffered: { "@type": "Service", name, description, provider: { "@id": studio } } }))
      }
    },
    { "@type": "WebSite", "@id": `${SITE}/#website`, url: `${SITE}/`, name: "Cromatic Studios · Navigation Mode", inLanguage: "en", publisher: { "@id": studio } },
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
      itemListElement: WORK.map(([name, genre, description], i) => ({ "@type": "ListItem", position: i + 1, item: { "@type": "CreativeWork", name, genre, description, creator: { "@id": studio } } }))
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

export function llmsTxt(SITE) {
  return `# Cromatic Studios

> ${STUDIO.description} This site (${SITE}/) tells the studio's story as an interactive 3D drive through Bucharest; the facts below are the same content in plain text.

## Studio

- Name: ${STUDIO.name}
- Address: ${STUDIO.street}, Bucharest, Romania
- Email: ${STUDIO.email}
- Phone: ${STUDIO.phone}
- Founded: ${STUDIO.founded} (Strada Muniției 5), today at ${STUDIO.street}
- Main website: ${STUDIO.legalUrl}
- Team: 12 people (Cristian, Daniel, Ana, Coz, Iulian, Alexandra, Stefan, Adina, Anne, Iulică, Ana M., Melissa)
- Positioning: indie, for indie founders; strategy first, then design, visuals and storytelling. "There is always a coffee."

## Services

${SERVICES.map(([n, d]) => `- ${n}: ${d}`).join("\n")}

## Selected work

${WORK.map(([n, g, d]) => `- ${n} (${g}): ${d}`).join("\n")}

Also worked with: Global Records, Erste, Microsoft, Echo School, Unchain Festival and more than 30 other brands.

## FAQ

${FAQ.map(([q, a]) => `### ${q}\n\n${a}`).join("\n\n")}

## Links

- [The drive (this site, 3D)](${SITE}/)
- [The website, content first](${SITE}/site/)
- [Case study: Slow Coffee Festival](${SITE}/work/slow-coffee-festival/)
- [Case study: Two Minutes and Two Min Lab](${SITE}/work/two-minutes/)
- [Case study: Steam Coffee Shop](${SITE}/work/steam/)
- [Case study: Artisan Coffee Gear](${SITE}/work/artisan-coffee-gear/)
- [Case study: Craft Coffee](${SITE}/work/craft-coffee/)
- [Cromatic Studios main website](${STUDIO.legalUrl})
- [Directions to Strada Olari 9](https://www.google.com/maps/search/?api=1&query=Cromatic+Studios+Strada+Olari+9+Bucuresti)
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

export function sitemapXml(SITE, lastmod, more = []) {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">
  <url>
    <loc>${SITE}/</loc>
    <lastmod>${lastmod}</lastmod>
    <image:image><image:loc>${SITE}/og.jpg</image:loc></image:image>
  </url>
${more.map((p) => `  <url><loc>${SITE}${p}</loc><lastmod>${lastmod}</lastmod></url>`).join("\n")}
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
    background_color: "#0d0c09",
    theme_color: "#FED012",
    icons: [
      { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icon-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
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
