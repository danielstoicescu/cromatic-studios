// r128: case pages built from the studio's own decks and brandbooks (Drive, ~/Clienti) and esdrom.ro.
// Facts come from those sources only.
const m = (p) => "m:" + p;

export const PAGES128 = [
  // ------------------------------------------------------------------ ESD
  {
    slug: "esd",
    name: "ESD",
    tagline: "The largest electronics service network in Romania, finally speaking for itself.",
    desc: "ESD: positioning strategy, rebranding and website for the largest electronics service network in Romania. Brand strategy, logo, brandbook, extended graphics, fleet, merch and esdrom.ro. By Cromatic Studios, Bucharest.",
    title: "For us, you are number 1.",
    accent: { bg: "#E30613", fg: "#ffffff", ink: "#b3000f" },
    info: ["Electronics service, repairs, B2B", "Bucharest", "Positioning strategy, rebranding, brandbook, website UI and UX, social media"],
    cover: { img: m("esd/van-top") },
    og: m("esd/book-cover"),
    hero: { img: m("esd/book-cover"), alt: "The ESD logo at the end of three long red stripes, on black" },
    problem: {
      h: "A big network that spoke through other brands",
      p: [
        "ESD is <strong>the largest electronics service network in Romania</strong>. Yet it had been communicating only through the image and brands in its portfolio: <strong>Samsung, Huawei, Philips and Sony</strong>.",
        "A new positioning was urgently needed. The brand had to <strong>develop its core, create its own voice</strong> and build an image in the eyes of its customers."
      ],
      media: [{ field: "#ffffff", fg: "#b3000f", items: [{ img: m("esd/logo"), alt: "The ESD logo in red" }], cap: "The new ESD logo: speed through a visual tilt, number 1 through the letter E" }],
      quote: { text: "ESD is a tech provider for young spirits, in an environment where we have the power to be number 1.", cite: "The ESD brandbook" }
    },
    solution: {
      h: "Hero and Ruler, as fast as possible",
      p: "We built the strategy on a mix of two archetypes, the Hero and the Ruler, and on one X-factor: to be as fast as possible. Then a branding and visual universe that carries ESD's youthful, energetic spirit and its commitment to overdeliver.",
      stat: "60 / 40",
      statText: "Hero and Ruler, the archetype mix behind the brand"
    },
    chapters: [
      {
        pillar: "brand",
        text: "The logo is a hybrid of logomark and logotype: it reads ESD in full, and the E can stand alone as the mark. Three stripes, tilted at 45°, carry the speed, and the E doubles as a stylised number 1. Raleway ExtraBold Italic, red, black and grey do the rest.",
        deliverables: ["Brand strategy", "Brand archetype", "Logo", "Brandbook", "Colour system", "Typography", "Extended graphics"],
        media: [
          { row: [{ img: m("esd/book-strategy"), alt: "Brandbook spread: ESD's archetype, a mix of Hero and Ruler" }, { img: m("esd/book-logo"), alt: "Brandbook spread: logomark and logotype" }], cap: "From the brandbook: the archetype mix, then the logo" },
          { statement: "One day. One hour. One company.", sub: "The E becomes a 1, and the stripes stretch as far as the message needs.", bg: "#111111", fg: "#ffffff" },
          { row: [{ img: m("esd/book-graphics"), alt: "Brandbook spread: the extended logomark, 1 day, 1 hour, 1 company" }, { img: m("esd/book-colour"), alt: "Brandbook spread: red, black and grey" }], cap: "Extended graphics and the colour system" },
          { row: [{ img: m("esd/book-logo2"), alt: "Brandbook spread: logo on photographs and backgrounds" }, { img: m("esd/book-type"), alt: "Brandbook spread: Raleway typography rules" }] }
        ]
      },
      {
        pillar: "brand",
        text: "The system on the road and on the team: service vans that announce “am ajuns”, we've arrived, polos with the red stripe on the sleeve, and lanyards printed with the mark.",
        deliverables: ["Fleet livery", "Uniforms", "Merch"],
        media: [
          { img: m("esd/van-top"), alt: "ESD van from above, with “am ajuns” on the roof", cap: "“Am ajuns”: the van says it before the technician does" },
          { row: [{ img: m("esd/van-back"), alt: "The back of an ESD van with a QR code" }, { img: m("esd/polo") , alt: "White ESD polo with red cuffs" }] },
          { img: m("esd/lanyard"), alt: "ESD lanyards" }
        ]
      },
      {
        pillar: "product",
        text: "Once the two pillars were in place, the online presence followed: a website built on the same red, the same stripes and the same promise, “Pentru noi tu ești numărul 1”, plus a fresh social media communication strategy.",
        deliverables: ["Website UI", "Website UX", "Social media strategy", "Social media implementation"],
        media: [
          { site: { label: "esdrom.ro", href: "https://esdrom.ro/", d: { img: m("esd/site-scroll"), scroll: true, alt: "The esdrom.ro homepage, scrolling" }, m: { img: m("esd/site-scroll-phone"), scroll: true, alt: "The esdrom.ro homepage on a phone, scrolling" } }, head: ["The", "website"], cap: "esdrom.ro: one-hour and one-day service, repair tracking, cost estimates and B2B display." },
          { img: m("esd/phone"), alt: "The ESD website on a phone", cap: "The site on the phone" }
        ]
      }
    ],
    result: {
      text: "A service network that used to borrow its image from the brands it repairs now has a voice of its own, and a red that reads number 1 from a van roof to a phone screen."
    },
    link: { href: "https://esdrom.ro/", label: "Visit esdrom.ro" },
    related: ["techventures-bank", "investimental", "assetto"]
  },

  // ------------------------------------------------------------------ TechVentures Bank
  {
    slug: "techventures-bank",
    name: "Techventures Bank",
    tagline: "The first entrepreneurial bank in Romania, refreshed for a limitless mindset.",
    desc: "TechVentures Bank: positioning strategy, rebranding, brandbook and website UI and UX for the first entrepreneurial bank in Romania. By Cromatic Studios, Bucharest.",
    title: "Part of your venture.",
    accent: { bg: "#1D2A42", fg: "#ffffff", ink: "#1D2A42" },
    info: ["Banking, entrepreneurs", "2020", "Positioning strategy, rebranding, brandbook, website UI and UX"],
    cover: { img: m("techventures-bank/storefront") },
    og: m("techventures-bank/mountain"),
    hero: { img: m("techventures-bank/mountain"), alt: "The TechVentures Bank wings above a snow-capped volcano" },
    problem: {
      h: "A bold bank in need of a refresh",
      p: [
        "TechVentures Bank is <strong>the first entrepreneurial bank in Romania</strong>, with a visionary perspective, keen to empower entrepreneurs and support a <strong>limitless mindset</strong>.",
        "Despite its bold approach, the brand needed a refresh, both in its <strong>visual universe</strong> and in the way it <strong>communicates its personality</strong>."
      ],
      media: [{ img: m("techventures-bank/building"), alt: "TechVentures Bank signage on a dark building" }],
      quote: { text: "TechVentures Bank provides money services to self-made customers in an authentic, passionate environment with a sharp voice.", cite: "The TechVentures Bank brandbook" }
    },
    solution: {
      h: "Freedom, grounded",
      p: "The strategy emphasises the freedom and adventure the bank wants to inspire, while giving a sense of groundedness and security. The visual universe pairs nature with visionary architecture: a personal touch, with ambitious goals.",
      stat: "4",
      statText: "keywords for the direction: limitless, freedom, grounded, adventure"
    },
    chapters: [
      {
        pillar: "brand",
        text: "Flight as an expression of freedom, so the mark is a pair of wings, in a metal texture that reads premium, grounded by a dark navy. The logotype is derived from Encode Sans, with a twist where the H meets the V.",
        deliverables: ["Positioning strategy", "Logo", "Brandbook", "Typography", "Colour codes", "Imagery direction"],
        media: [
          { row: [{ img: m("techventures-bank/book-cover"), alt: "TechVentures Bank brandbook cover" }, { img: m("techventures-bank/book-logo"), alt: "Brandbook page: the logo concept" }], cap: "The brandbook: wings, metal and navy" },
          { statement: "Part of your venture.", sub: "The line that runs from the brandbook to the homepage.", bg: "#1D2A42", fg: "#ffffff" },
          { rail: ["Imagery"], items: [
            { img: m("techventures-bank/hero"), alt: "A skier above a volcano, Part of your venture" },
            { img: m("techventures-bank/img-ocean"), alt: "A diver beneath a wave" },
            { img: m("techventures-bank/img-snow"), alt: "Snowfield with the TechVentures logo" },
            { img: m("techventures-bank/img-arch"), alt: "A figure under a stone arch" },
            { img: m("techventures-bank/poster"), alt: "Poster: Part of your venture" }
          ], cap: "Personal imagery: hyperrealistic scenes of nature and sport, in blues and navy" }
        ]
      },
      {
        pillar: "brand",
        text: "The wings in the street: on the branch façade, on a wall sign, on cars at night, on roll-ups and on navy polos.",
        deliverables: ["Signage", "Outdoor", "Car branding", "Print", "Merch"],
        media: [
          { img: m("techventures-bank/storefront"), alt: "TechVentures Bank branch façade, lit at night", cap: "The branch" },
          { row: [{ img: m("techventures-bank/car-night"), alt: "A sports car with silver wings on its side, at night" }, { img: m("techventures-bank/sign"), alt: "Wall sign with the silver wings" }] },
          { row: [{ img: m("techventures-bank/car-city"), alt: "A branded electric car among towers" }, { img: m("techventures-bank/rollup"), alt: "Navy roll-up with the wings" }, { img: m("techventures-bank/polo"), alt: "Navy polo with the wings" }] }
        ]
      },
      {
        pillar: "product",
        text: "Using both nature and architecture, we designed a website that inspires and takes a human approach to banking: account packages and savings shown through the same landscapes.",
        deliverables: ["Website UI", "Website UX"],
        media: [
          { img: m("techventures-bank/web-hero"), alt: "Website hero: a diver, Part of your venture", cap: "The homepage" },
          { row: [{ img: m("techventures-bank/web-savings"), alt: "Website: savings products as landscape cards" }, { img: m("techventures-bank/web-accounts"), alt: "Website: current account packages" }] },
          { img: m("techventures-bank/web-dream"), alt: "Website: a car in motion, follow your dream" }
        ]
      }
    ],
    result: {
      text: "A bank for entrepreneurs with a brand that says limitless and still feels safe: wings in metal, landscapes in navy, and a website that talks to people, not accounts."
    },
    related: ["esd", "longshield", "investimental"]
  },

  // ------------------------------------------------------------------ Longshield
  {
    slug: "longshield",
    name: "Longshield",
    tagline: "Long-term investments, under a shield built on the golden ratio.",
    desc: "Longshield Investment Group: brand strategy, logo, brandbook, stationery, roll-ups and website for an investment group. By Cromatic Studios, Bucharest.",
    title: "Long-term investments.",
    accent: { bg: "#253322", fg: "#E7B43C", ink: "#253322" },
    info: ["Investments, financial services", "2023", "Brand strategy, logo, brandbook, stationery, print, website UI"],
    cover: { img: m("longshield/desktop") },
    og: m("longshield/phoenix"),
    hero: { img: m("longshield/phoenix"), alt: "A golden bird in flight, cut from gold leaf" },
    problem: {
      h: "Confidence, for decisions that take years",
      p: [
        "Longshield Investment Group offers <strong>long-term investments</strong> to clients with a vision for the future, in a partnership, with a <strong>clear and strong voice</strong>.",
        "The brand had to give them <strong>financial sustainability</strong> and make them feel <strong>confident in their investment decisions</strong>."
      ],
      media: [{ field: "#ffffff", fg: "#253322", items: [{ img: m("longshield/book-cover"), alt: "Longshield brandbook cover, dark green" }] }],
      quote: { text: "Preluăm noi de aici. We'll take it from here.", cite: "The Ruler's motto, from the Longshield brandbook" }
    },
    solution: {
      h: "A mountain inside a shield",
      p: "Using golden-ratio proportions we drew a mountain that protects wealth, rising like a growth chart, and framed it in a rectangular Roman shield: a harmonious drawing inside a pure form.",
      stat: "70 / 30",
      statText: "Ruler and Sage: stability and control, with wisdom"
    },
    chapters: [
      {
        pillar: "brand",
        text: "Dark green and gold texture, Montserrat for the logotype, and a gold bird shape derived from the shield. Images go two ways, human and generic, or conceptual, with buildings that recall wings, always bright, with green, blue and white.",
        deliverables: ["Brand strategy", "Archetype", "Slogan", "Logo", "Brandbook", "Colour palette", "Imagery direction"],
        media: [
          { row: [{ img: m("longshield/book-logo"), alt: "Brandbook: the golden-ratio logo concept" }, { img: m("longshield/book-colour"), alt: "Brandbook: Montserrat, dark green and gold" }, { img: m("longshield/book-language"), alt: "Brandbook: the visual language" }], cap: "Golden ratio, dark green and gold" },
          { statement: "Longshield. Long-term investments.", sub: "The slogan, in Romanian and English.", bg: "#253322", fg: "#E7B43C" },
          { row: [{ img: m("longshield/book-images"), alt: "Brandbook: the two image directions" }, { img: m("longshield/cards"), alt: "Brandbook: vertical business cards with gold foil" }], cap: "Business cards stay vertical, like the shield, with selective gold foil" }
        ]
      },
      {
        pillar: "brand",
        text: "The identity on paper: letterheads, folders, a stamp in green ink and roll-ups in two versions, a photograph or the gold bird on white.",
        deliverables: ["Stationery", "Folders", "Stamp", "Roll-ups"],
        media: [
          { row: [{ img: m("longshield/letterhead"), alt: "Longshield letterheads" }, { img: m("longshield/folder"), alt: "Longshield folders" }] },
          { row: [{ img: m("longshield/rollup-photo"), alt: "Roll-up with a white building against blue sky" }, { img: m("longshield/rollup-gold"), alt: "Roll-up with the gold bird" }, { img: m("longshield/stamp"), alt: "Wooden stamp and the Longshield logo" }] }
        ]
      },
      {
        pillar: "product",
        text: "The website opens on “Investiții pe termen lung!” and the gold bird, with the share price and trading history one scroll away. On mobile, information comes in shield-shaped sections.",
        deliverables: ["Website UI", "Mobile web design", "Social media"],
        media: [
          { img: m("longshield/desktop"), alt: "The Longshield website on a desktop", cap: "Desktop" },
          { row: [{ img: m("longshield/phone"), alt: "The website on a phone, held in hand" }, { img: m("longshield/tablet"), alt: "Share price page on a foldable" }, { img: m("longshield/web"), alt: "The full homepage" }] }
        ]
      }
    ],
    result: {
      text: "An investment group with a brand that looks like what it promises: patient, solid and a little golden."
    },
    related: ["infinity-capital", "techventures-bank", "assetto"]
  },

  // ------------------------------------------------------------------ Infinity Capital
  {
    slug: "infinity-capital",
    name: "Infinity Capital",
    tagline: "Financial investments for visionary clients, in grey, yellow and a lot of growth.",
    desc: "Infinity Capital Investments: visual identity, brand canvas, stationery, roll-ups, app and website for an investment company from Craiova. By Cromatic Studios.",
    title: "Investing in your vision.",
    accent: { bg: "#FFC20E", fg: "#111111", ink: "#8a6a00" },
    info: ["Investments, financial services", "Craiova, 2023", "Visual identity, brand canvas, stationery, print, app UI, website UI"],
    cover: { img: m("infinity-capital/web") },
    og: m("infinity-capital/web"),
    hero: { img: m("infinity-capital/web"), alt: "The Infinity Capital website on a laptop, with the fi mark behind" },
    problem: {
      h: "Investments with a long view",
      p: [
        "Infinity Capital Investments offers <strong>financial investments to visionary clients</strong>, with the best team at their disposal and a voice in the avant-garde.",
        "The brand had to help them reach <strong>long-term financial growth</strong>, and make them feel strong doing it."
      ],
      media: [{ img: m("infinity-capital/canvas"), alt: "The full Infinity Capital brand canvas", cap: "The brand canvas: 130 by 30 cm, the whole system on one board" }]
    },
    solution: {
      h: "The f and the i",
      p: "A monogram that ties the f and i of Infinity into one square mark, the Sora typeface, and a palette of greys with a yellow-to-orange accent that climbs like a chart.",
      stat: "130 × 30",
      statText: "centimetres: the brand canvas the identity was presented on"
    },
    chapters: [
      {
        pillar: "brand",
        text: "The wordmark, the fi monogram in grey and yellow, metal pins, letterheads and business cards with a blind-embossed logo.",
        deliverables: ["Logo", "Monogram", "Typography", "Colour palette", "Iconography", "Stationery", "Business cards"],
        media: [
          { row: [{ img: m("infinity-capital/identity"), alt: "Wordmark, Sora typeface, palette and monograms" }, { img: m("infinity-capital/stationery"), alt: "Letterhead, pins and business cards" }], cap: "Identity and stationery" }
        ]
      },
      {
        pillar: "product",
        text: "Report covers by category, an app that shows attractive long-term investments, roll-ups that say “Oferim investiții financiare pentru viziunea ta”, and a website for news and analysis.",
        deliverables: ["App UI", "Website UI", "Roll-ups", "Report templates"],
        media: [
          { img: m("infinity-capital/digital"), alt: "Report covers and the Infinity app on a phone", cap: "Reports and the app" },
          { row: [{ img: m("infinity-capital/rollups"), alt: "Infinity roll-ups" }, { img: m("infinity-capital/portrait"), alt: "Portrait with the fi pin and a QR code" }] }
        ]
      }
    ],
    result: {
      text: "An identity that makes a serious investment company feel modern and bright, built and presented as one system, from a lapel pin to a website."
    },
    related: ["longshield", "techventures-bank", "investimental"]
  },

  // ------------------------------------------------------------------ Unchain Festival
  {
    slug: "unchain-festival",
    name: "Unchain Festival",
    tagline: "The Davos of CEE fintech, inside a medieval fortress.",
    desc: "Unchain Festival: brand strategy, archetype, customer profiles, visual identity and website direction for a fintech event at Oradea Fortress. By Cromatic Studios.",
    title: "Unchain the Davos of CEE fintech.",
    accent: { bg: "#2A1238", fg: "#ffffff", ink: "#7B2CBF" },
    info: ["Fintech event", "Oradea Fortress, 19–20 June 2024", "Brand strategy, customer profiles, visual identity, website UI"],
    cover: { img: m("unchain-festival/fortress") },
    og: m("unchain-festival/fortress"),
    hero: { img: m("unchain-festival/logo"), alt: "The UNCHAIN logo on dark purple, a red thread running through it" },
    problem: {
      h: "Finance, unchained",
      p: [
        "Unchain sits where <strong>technology, liberty and finance</strong> meet. Regulators, bankers, tech companies, startups and investors gather in the heart of CEE, in neutral territory near the border between Romania and Hungary.",
        "On the ground of one of the oldest medieval fortresses, technology camps out for two days. The brand had to create <strong>a friendly, chill and magical atmosphere</strong> for one of the most rigorous fields there is."
      ],
      media: [{ row: [{ img: m("unchain-festival/core"), alt: "Unchain's core: culture, clients, voice, feeling, impact, X factor" }, { img: m("unchain-festival/archetype"), alt: "Unchain's archetype: creator and magician" }], cap: "From the strategy: the core and the archetype" }],
      quote: { text: "Unchain the Davos of CEE fintech!", cite: "Unchain's motto" }
    },
    solution: {
      h: "The red thread",
      p: "One continuous line starts at one end, runs into the UNCHAIN logo and, as you scroll, builds a fortress. It never breaks. From that line we built a set of blocks, and from the blocks a whole visual universe.",
      stat: "60 / 40",
      statText: "Creator and Magician, the archetype mix"
    },
    chapters: [
      {
        pillar: "brand",
        text: "We started from the core: an adventurous culture, clients who are creators of finance, a relaxed and confident voice. Then customer profiles drawn from real regulators, bankers, tech leaders and founders, and two creative directions, “Firul roșu” and “Unchained blocks”.",
        deliverables: ["Brand strategy", "Brand attributes", "Archetype", "Customer profiles", "Creative directions", "Logo"],
        media: [
          { statement: "For two days, Oradea will be our fortress.", sub: "From the website copy.", bg: "#2A1238", fg: "#C77DFF" },
          { img: m("unchain-festival/site-hero"), alt: "Website first fold: UNCHAIN, 19–20 June 2024, Oradea Fortress", cap: "The red thread enters the logo and becomes the tower" },
          { row: [{ img: m("unchain-festival/blocks"), alt: "Building blocks: buttons, chain illustration, menus" }, { img: m("unchain-festival/statement"), alt: "For two days Oradea will be our fortress" }] }
        ]
      },
      {
        pillar: "product",
        text: "The website, section by section: speakers framed by the thread, three gates to become an unchainer, a partner or a speaker, a fortress of blocks for the date, and the partners.",
        deliverables: ["Website UI", "Website UX", "Design system"],
        media: [
          { img: m("unchain-festival/fortress"), alt: "Website: a fortress of blocks, 19–20 June 2024, Oradea Fortress", cap: "The second direction: unchained blocks" },
          { row: [{ img: m("unchain-festival/speakers"), alt: "Website: speakers along the red thread" }, { img: m("unchain-festival/arches"), alt: "Website: three arched gates" }] },
          { row: [{ img: m("unchain-festival/become"), alt: "Become an unchainer, become a partner" }, { img: m("unchain-festival/sponsors"), alt: "Partners: Visa, Google Cloud, BCR" }] }
        ]
      }
    ],
    result: {
      text: "A fintech event with a brand as unexpected as its venue: one red thread that turns into a fortress, and a reason for finance people to loosen up for two days."
    },
    related: ["assetto", "investimental", "bepco"]
  },

  // ------------------------------------------------------------------ Patiline
  {
    slug: "patiline",
    name: "Patiline",
    tagline: "Artisan bread at scale, rebranded for HoReCa: always fresh, forever the same.",
    desc: "Patiline Bakery: The Core 2.0 brand strategy, rebranding, sub-brand architecture, catalogue, fleet, packaging, expo stand and website for a B2B bakery. By Cromatic Studios.",
    title: "Always fresh. Forever the same.",
    accent: { bg: "#EF3E46", fg: "#ffffff", ink: "#c8242c" },
    info: ["Bakery, B2B, HoReCa", "2025", "Brand strategy, rebranding, brand architecture, catalogue, packaging, fleet, expo stand, website"],
    cover: { img: m("patiline/van") },
    og: m("patiline/billboard"),
    hero: { img: m("patiline/billboard"), alt: "Always fresh. Forever the same. Patiline Bakery, with bread rolls and a croissant" },
    problem: {
      h: "More than a supplier",
      p: [
        "Patiline makes <strong>pre-baked and fully baked bread</strong> for HoReCa and street food: burger and hot dog buns, Italian sandwich breads, rolls and loaves.",
        "It wanted to stop being seen as a transactional supplier and become <strong>a partner you can trust</strong>: sure of its expertise, transparent in its intentions and proactive with solutions."
      ],
      media: [{ img: m("patiline/manifesto"), alt: "The Patiline brand manifesto" }],
      quote: { text: "Măiestria de Mâine. Parteneriatul de Azi. Tomorrow's craft. Today's partnership.", cite: "The Patiline brand manifesto" }
    },
    solution: {
      h: "Dynamic and bold",
      p: "Through The Core 2.0 we set Patiline's offer: artisan bread solutions for clients interested in innovation, in a visionary culture, with a consultative voice, delivered promptly. The creative direction made it look that way: big bold type, products shot large and frontal, rows of identical buns that show control.",
      stat: "65 / 35",
      statText: "Creator and Caregiver, the archetype mix"
    },
    chapters: [
      {
        pillar: "brand",
        text: "A handwritten wordmark and a round seal, both in Patiline red, and an architecture of product brands for each channel: Urban Bun for street food, Sandwich+ for Italian breads, Primo for HoReCa rolls and loaves.",
        deliverables: ["The Core 2.0 strategy", "Brand manifesto", "Archetype", "Customer profiles", "Logo", "Brand architecture", "Sub-brand logos"],
        media: [
          { row: [{ img: m("patiline/wordmark"), alt: "The Patiline Bakery wordmark" }, { img: m("patiline/seal"), alt: "The round Patiline seal" }] },
          { img: m("patiline/sub-brands"), alt: "The seal on red, with Urban Bun, Primo and Sandwich+", cap: "The master brand and its product lines" },
          { statement: "Order. Bake. Slice. Serve.", sub: "Frozen breads for your needs.", bg: "#EF3E46", fg: "#ffffff" }
        ]
      },
      {
        pillar: "brand",
        text: "The system at work: vans that arrive with “Am ajuns!”, shipping boxes, a catalogue for buns and brioche, a website that opens on “Your vision. Our bake-line.” and an expo stand you can see from across the hall.",
        deliverables: ["Fleet livery", "Packaging", "Catalogue", "Website", "Expo stand", "Posters", "Banners"],
        media: [
          { img: m("patiline/van"), alt: "A Patiline van with “Am ajuns!” and a loyalty card", cap: "The fleet" },
          { row: [{ img: m("patiline/box"), alt: "Shipping box: always fresh, forever the same" }, { img: m("patiline/catalogue"), alt: "Catalogue spread: burger and hot dog buns" }] },
          { img: m("patiline/website"), alt: "The Patiline website: Your vision. Our bake-line.", cap: "The website" },
          { row: [{ img: m("patiline/stand"), alt: "The Patiline expo stand with visitors" }, { img: m("patiline/poster"), alt: "Poster: Order. Bake. Slice. Serve." }], cap: "The expo stand and its posters" }
        ]
      }
    ],
    result: {
      text: "A B2B bakery that now looks like the partner it wants to be: bold, consistent and on time, from the van at the back door to the stand at the trade fair."
    },
    related: ["pain-plaisir", "arca-resort", "craft-coffee"]
  },

  // ------------------------------------------------------------------ Pain Plaisir
  {
    slug: "pain-plaisir",
    name: "Pain Plaisir",
    tagline: "A pastry with four folds, turned into a product brand, a shoot and a holiday campaign.",
    desc: "Pain Plaisir: product branding for the Anemone pastry, packaging, stickers, in-store visuals, photo shoot and Christmas campaign for a French-style bakery in Bucharest. By Cromatic Studios.",
    title: "Anemone, by Pain Plaisir.",
    accent: { bg: "#F6C944", fg: "#111111", ink: "#9a6b00" },
    info: ["Bakery, retail", "Bucharest, 2025", "Product branding, packaging, stickers, in-store, photo, campaign"],
    cover: { img: m("pain-plaisir/photo-25") },
    og: m("pain-plaisir/anemone"),
    hero: { img: m("pain-plaisir/anemone"), alt: "The Anemone pastry from above, the quatrefoil mark drawn over it" },
    problem: {
      h: "A pastry that deserved its own name",
      p: [
        "The Anemone is <strong>croissant dough with sugar and vanilla</strong>, Pain Plaisir's take on the kouign-amann, folded at four points.",
        "Pain Plaisir wanted it to stand out as <strong>a product of its own</strong>: on the shelf, in a gift box and on Instagram."
      ],
      media: [{ img: m("pain-plaisir/photo-35"), alt: "Close-up of the Anemone's caramelised layers", cap: "The product, up close" }]
    },
    solution: {
      h: "The shape is the logo",
      p: "The brand icon is a geometric abstraction of the product itself: the four-point fold makes a natural quatrefoil. Neug Asia, with its extreme contrast and teardrop terminals, rhymes with the four rounded lobes.",
      stat: "4",
      statText: "folds in the pastry, four lobes in the mark"
    },
    chapters: [
      {
        pillar: "brand",
        text: "The anemone combination mark, a “Buchet de anemone” gift version, a quatrefoil pattern, flavour stickers in yellow, red and green, and a quatrefoil crop for photos and social media.",
        deliverables: ["Product branding", "Combination mark", "Typography", "Pattern", "Box design", "Flavour stickers", "Photo treatment"],
        media: [
          { row: [{ img: m("pain-plaisir/mark"), alt: "The anemone combination mark" }, { img: m("pain-plaisir/logo"), alt: "Buchet de anemone logo" }] },
          { row: [{ img: m("pain-plaisir/pattern"), alt: "The quatrefoil pattern" }, { img: m("pain-plaisir/box"), alt: "Gift box with flavour stickers" }], cap: "Pattern, box and stickers" },
          { field: "#F6C944", fg: "#111111", items: [{ img: m("pain-plaisir/sticker-1"), alt: "Sticker: Buchet de anemone, pentru sărbători delicioase" }, { img: m("pain-plaisir/sticker-2"), alt: "Sticker: the flavours of the holidays" }, { img: m("pain-plaisir/sticker-3"), alt: "Sticker: Je ne sais quoi? Anemone și cafea" }], cap: "Holiday stickers: cinnamon, ginger, cardamom" },
          { img: m("pain-plaisir/photo-treatment"), alt: "Quatrefoil photo treatment for social media" }
        ]
      },
      {
        pillar: "brand",
        text: "In the shops: window graphics, shelf talkers, posters and coffee cups.",
        deliverables: ["Window graphics", "In-store", "Posters", "Cups"],
        media: [
          { row: [{ img: m("pain-plaisir/window"), alt: "Shop window with white anemone graphics" }, { img: m("pain-plaisir/storefront"), alt: "Storefront with stickers in the window" }, { img: m("pain-plaisir/cups"), alt: "Pain Plaisir coffee cups" }] },
          { row: [{ img: m("pain-plaisir/shop"), alt: "Inside the bakery, the anemone poster above the counter" }, { img: m("pain-plaisir/shelf"), alt: "Shelf talker on the pastry shelf" }] }
        ]
      },
      {
        pillar: "video",
        text: "We shot the Anemone the way it should be eaten: torn, bitten, held up to the eyes. Then a Christmas table full of Pain Plaisir.",
        deliverables: ["Photo shoot", "Art direction", "Campaign", "Video production"],
        media: [
          { rail: ["The", "shoot"], items: [
            { img: m("pain-plaisir/photo-25") , alt: "Two anemones held over the eyes" },
            { img: m("pain-plaisir/photo-16"), alt: "Smiling over a plate of anemones" },
            { img: m("pain-plaisir/photo-31"), alt: "A bite of anemone" },
            { img: m("pain-plaisir/photo-5"), alt: "Hands tearing an anemone" },
            { img: m("pain-plaisir/photo-9"), alt: "An anemone on a bowl" },
            { img: m("pain-plaisir/photo-39"), alt: "The flaky inside" },
            { img: m("pain-plaisir/photo-40"), alt: "Layers of croissant dough" }
          ], cap: "The Anemone photo shoot" },
          { img: m("pain-plaisir/xmas-table"), alt: "A Christmas table set with Pain Plaisir breads and pastries", cap: "Christmas at Pain Plaisir" },
          { row: [{ img: m("pain-plaisir/photo-46"), alt: "Anemones on a cake stand at the Christmas table" }, { img: m("pain-plaisir/photo-52"), alt: "Sourdough loaf and cheese at the Christmas table" }] }
        ]
      }
    ],
    result: {
      text: "One pastry, one shape, a whole small brand: a mark you can bite into, stickers for every flavour and a shoot that makes you hungry."
    },
    related: ["patiline", "yoshi-izakaya", "sip-coffee-wine"]
  },

  // ------------------------------------------------------------------ Casa Berero
  {
    slug: "casa-berero",
    name: "Casa Berero",
    tagline: "Craft beer with your people: COMM and UNITY, cans, merch and a house to drink them in.",
    desc: "Berero: brand identity, can labels for COMM lager and UNITY IPA, merch, event posters and B2B presentations for a craft beer brand and its house, Casa Berero. By Cromatic Studios.",
    title: "Craft beer with your people.",
    accent: { bg: "#111111", fg: "#ffffff", ink: "#111111" },
    info: ["Craft beer, hospitality", "2024", "Brand identity, can labels, merch, posters, presentations"],
    cover: { img: m("casa-berero/label-comm") },
    og: m("casa-berero/label-unity"),
    hero: { img: m("casa-berero/label-comm"), alt: "The Berero COMM can label: black and yellow shapes, LAGER" },
    problem: {
      h: "Not just beer",
      p: [
        "Berero brews two beers, <strong>COMM</strong> and <strong>UNITY</strong>, and pours them at its own house, Casa Berero.",
        "Together they spell community. The brand had to sell that to bars as much as to drinkers: <strong>you don't just sell beer, you create a place people want to come back to</strong>."
      ],
      media: [{ row: [{ img: m("casa-berero/logo"), alt: "The BERERO logo" }, { img: m("casa-berero/party"), alt: "Make your own beer party" }] }],
      quote: { text: "Nu vinzi doar bere. Creezi un loc în care lumea vrea să revină.", cite: "From the Berero B2B deck" }
    },
    solution: {
      h: "COMM + UNITY",
      p: "Two cans that read as one word. COMM, the lager, is black and yellow: communion, communication, community. UNITY, the IPA, is black and green: diversity, friendship, vibe. Around both, a set of loose hand-drawn shapes that can go anywhere.",
      stat: "2",
      statText: "beers, one community"
    },
    chapters: [
      {
        pillar: "brand",
        text: "Can labels for both beers, the line “Craft beer with your people”, and the cans on the B2B sheets that go to bars.",
        deliverables: ["Logo", "Can labels", "Illustration", "B2B presentations"],
        media: [
          { img: m("casa-berero/label-unity"), alt: "The Berero UNITY can label: black and green shapes, IPA", cap: "UNITY, the IPA" },
          { row: [{ img: m("casa-berero/comm-can"), alt: "A COMM can on yellow" }, { img: m("casa-berero/unity-can"), alt: "A UNITY can on green" }] },
          { img: m("casa-berero/tap"), alt: "Tap beer, available in your location or at Casa Berero, kegs against a yellow wall" }
        ]
      },
      {
        pillar: "marketing",
        text: "COMM UNITY on black tees, in yellow and green, and posters for the takeovers at Casa Berero.",
        deliverables: ["Merch", "Event posters"],
        media: [
          { row: [{ img: m("casa-berero/merch-tees"), alt: "COMM UNITY t-shirt artwork, yellow and green" }, { img: m("casa-berero/poster-backyard"), alt: "Backyard Takeover poster at Casa Berero" }, { img: m("casa-berero/poster-garden"), alt: "Garden Takeover poster" }] }
        ]
      }
    ],
    result: {
      text: "A beer brand that sells a feeling before a flavour: two cans that make one word, and a house where the word comes true."
    },
    related: ["sip-coffee-wine", "pain-plaisir", "yoshi-izakaya"]
  }
];
