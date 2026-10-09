// Content of the case-study pages (see gen.mjs). Facts come from cromaticstudios.com/proiecte/<x>/,
// the clients' own websites and the existing case data in site/data.mjs; nothing beyond them.
const cs = (p) => "cs:" + p;
const v = (p, r, extra = {}) => ({ video: cs(p), r, ...extra });

export const PAGES = [
  // ------------------------------------------------------------------ Artisan Coffee Gear
  {
    slug: "artisan-coffee-gear",
    name: "Artisan Coffee Gear",
    tagline: "A whole brand world, from the letterform pattern to the webshop.",
    desc: "Artisan Coffee Gear: a brand universe for specialty coffee equipment, from strategy and identity to illustration, packaging and the webshop. By Cromatic Studios, Bucharest.",
    title: "Getting to the core of the craft.",
    accent: { bg: "#B4B79F", ink: "#5c5f4b" },
    info: ["Coffee equipment, Retail", "2019", "Brand strategy, brand universe, visual identity, illustration, packaging, website"],
    cover: { img: "m:artisan-coffee-gear/art09" },
    hero: [
      { img: "m:artisan-coffee-gear/art01", alt: "Artisan Coffee Gear wordmark on white" },
      { img: "m:artisan-coffee-gear/art09", alt: "Line drawings of brewers, grinders and kettles" }
    ],
    problem: {
      h: "Gear for people who take coffee seriously",
      p: [
        "Artisan sells coffee equipment to <strong>passionate customers</strong>: people who weigh their doses, time their pours and read up on every grinder before they buy it.",
        "A catalogue alone does not speak to them. Artisan wanted a <strong>tailor-made environment with a personal voice</strong>, one that helps customers <strong>join the specialty coffee community</strong> and feel understood."
      ],
      media: [{ row: [{ img: "m:artisan-coffee-gear/art02", alt: "The Artisan value proposition" }, { img: "m:artisan-coffee-gear/art05", alt: "The Artisan wordmark with the line coffee gear" }], cap: "The value proposition, and the wordmark it led to." }]
    },
    solution: {
      h: "The One Who Knocks",
      p: "We built the direction on three keywords: only the best coffee gear, understood, coffee community. The archetype is part Explorer, part Ruler, and every choice that followed, from type to the webshop, comes back to it.",
      stat: "60 / 40",
      statText: "Explorer and Ruler, the archetype mix behind every decision"
    },
    chapters: [
      {
        pillar: "brand",
        text: "Ailerons for the mark, Gruppo and Gotham for everything else, and an olive, ink and paper palette that lets the equipment be the hero. The A of Artisan folds into a repeating chevron, and every machine is drawn as a technical illustration.",
        deliverables: ["Brand strategy", "Brand archetype", "Logo", "Typography system", "Colour palette", "Letterform pattern", "Technical illustration", "Stationery", "Merch"],
        media: [
          { row: [{ img: "m:artisan-coffee-gear/art07", alt: "Ailerons, Gruppo and Gotham with the olive, ink and paper palette" }, { img: "m:artisan-coffee-gear/art08", alt: "The A of Artisan turning into a chevron pattern, with botanical drawings" }], cap: "Type and colour, and the pattern that grows out of the letter A" },
          { row: [{ img: "m:artisan-coffee-gear/art10", alt: "Olive posters with blueprint drawings of coffee machines" }, { img: "m:artisan-coffee-gear/art15", alt: "Posters for barista tools and home brewing" }], cap: "The gear, drawn as blueprints, so the catalogue reads like a manual" },
          { row: [{ img: "m:artisan-coffee-gear/art12", alt: "Business card and branded tape with an olive branch" }, { img: "m:artisan-coffee-gear/art13", alt: "Olive polo shirt with the Artisan mark" }], cap: "Business cards, washi tape and polo shirts: the system built to be touched" }
        ]
      },
      {
        pillar: "product",
        text: "A webshop that reads like an atelier: botanical line art, generous space and the machines centre stage, under one line, “Get to the core of your craft.” The same system dresses the green coffee side of the business.",
        deliverables: ["Website", "E-commerce UI", "Packaging", "Campaign visuals"],
        media: [
          { row: [{ img: "m:artisan-coffee-gear/art17", alt: "The Artisan website on a desktop screen" }, { img: "m:artisan-coffee-gear/art18", alt: "Website section presenting espresso machines" }, { img: "m:artisan-coffee-gear/art19", alt: "Mobile pages and a shop counter with Artisan stickers" }], cap: "The webshop on desktop and phone, and the brand on the counter" },
          { row: [{ img: "m:artisan-coffee-gear/art22", alt: "Green coffee packaging and jute sacks with the Artisan mark" }, { img: "m:artisan-coffee-gear/art23", alt: "Bottle and tablet visuals for raw beans from the source" }], cap: "Packaging and campaign for green beans, brought in directly from Colombia" }
        ]
      }
    ],
    result: {
      text: "A complete brand universe, from the letterform pattern to the webshop, for a shop that wants to be part of the specialty coffee community, not just sell to it."
    },
    related: ["craft-coffee", "steam", "sip-coffee-wine"]
  },

  // ------------------------------------------------------------------ Craft Coffee
  {
    slug: "craft-coffee",
    name: "Craft Coffee",
    tagline: "A brand and a shop built to equip the passion for coffee.",
    desc: "Craft Coffee: brand identity, packaging, uniforms, merch and the craftcoffee.ro online shop for the official La Marzocco distributor in Romania. By Cromatic Studios, Bucharest.",
    title: "Equipping the passion for coffee.",
    accent: { bg: "#5AA9F0", ink: "#1f64a8" },
    info: ["Coffee equipment, distribution and service", "Str. Brațului 7, Bucharest", "Brand identity, badge system, packaging, uniforms, merch, e-commerce website"],
    cover: { img: "m:craft-coffee/patch" },
    og: "m:craft-coffee/site-desktop",
    hero: { img: "m:craft-coffee/site-desktop", alt: "The craftcoffee.ro homepage: The finest coffee equipment", r: 1.6 },
    problem: {
      h: "Professional machines, sold by phone",
      p: [
        "Craft Coffee distributes and services <strong>professional espresso and brew equipment</strong>, chosen only from the most respected brands in the world. It is the <strong>official La Marzocco distributor in Romania</strong> and works with Mazzer, Mahlkönig, Anfim, PuqPress, Fellow and BWT.",
        "Born in 2023 out of a passion for La Marzocco machines, and run by the team behind Steam Coffee Shop, it sold <strong>through phone calls and visits alone</strong>, with <strong>no shop of its own online</strong>."
      ],
      media: [{ row: [{ img: "m:craft-coffee/linea", alt: "A La Marzocco machine on a café counter" }, { img: "m:craft-coffee/bar", alt: "A bright specialty coffee bar" }], cap: "The equipment Craft Coffee sells, installs and maintains, at home behind the bar." }],
      quote: { text: "At Craft Coffee, we equip the passion for coffee.", cite: "Craft Coffee, on its website" }
    },
    solution: {
      h: "The finest equipment, stamped",
      p: "A badge built like a seal of approval, a red and blue system for a company that both sells and services, and an online shop that puts the whole catalogue in front of buyers.",
      stat: "20+",
      statText: "venues equipped by Craft Coffee in recent years"
    },
    chapters: [
      {
        pillar: "brand",
        text: "A circular badge with the wordmark cut across the middle and “The finest equipment” around it: it reads as a seal on a box, embroidered on a patch or pressed onto a pin. Red and blue split the system into two tempers.",
        deliverables: ["Logo", "Badge system", "Colour system", "Stationery", "Packaging", "Uniforms", "Merch"],
        media: [
          { row: [{ img: "m:craft-coffee/patch", alt: "Embroidered Craft Coffee patch: The finest equipment" }, { img: "m:craft-coffee/logo", alt: "The Craft Coffee wordmark in blue", contain: true, bg: "#f8f5f0" }], cap: "The badge and the wordmark" },
          { row: [{ img: "m:craft-coffee/box", alt: "Shipping box: Your coffee equipment is here", contain: true, bg: "#ffffff" }, { img: "m:craft-coffee/tag", alt: "Craft Coffee service tag", contain: true, bg: "#f8f5f0" }], cap: "“Your coffee equipment is here.” Before the machine is unpacked, the box already sounds like the brand." },
          { row: [{ img: "m:craft-coffee/uniform", alt: "Grey technician overalls with the Craft Coffee badge", contain: true, bg: "#ffffff" }, { img: "m:craft-coffee/bag", alt: "Backpack with the Craft Coffee patch", contain: true, bg: "#ffffff" }], cap: "Uniforms and bags for the technicians: the part of the brand that actually shows up at your bar" }
        ]
      },
      {
        pillar: "product",
        text: "craftcoffee.ro: an online shop for professional espresso machines, grinders and brew gear, with a page for every partner brand, services, and a way to book a meeting with the team.",
        deliverables: ["E-commerce website", "UI design", "Brand pages", "Product catalogue", "Booking requests"],
        media: [
          { site: { label: "craftcoffee.ro", href: "https://craftcoffee.ro/", d: { img: "m:craft-coffee/site-scroll", scroll: true, alt: "The craftcoffee.ro homepage, scrolling" }, m: { img: "m:craft-coffee/site-scroll-phone", scroll: true, alt: "The craftcoffee.ro homepage on a phone, scrolling" } }, head: ["Online", "shop"], cap: "The homepage: the finest coffee equipment, the best sellers and the partner brands." },
          { row: [{ img: "m:craft-coffee/about-desktop", alt: "The About page: equipment carefully selected, tested with passion" }, { img: "m:craft-coffee/shop-desktop", alt: "The shop page with Fellow and La Marzocco products" }], cap: "The About page and the shop" }
        ]
      }
    ],
    result: {
      text: "Craft Coffee now takes orders for professional equipment through a shop of its own, with a brand that shows up the same way on a box, a uniform and a product page."
    },
    link: { href: "https://craftcoffee.ro/", label: "Visit craftcoffee.ro" },
    related: ["steam", "artisan-coffee-gear", "sip-coffee-wine"]
  },

  // ------------------------------------------------------------------ Elithia
  {
    slug: "elithia",
    name: "Elithia",
    tagline: "Making motherhood a soothing, joyful experience.",
    desc: "Elithia: brand strategy, identity, website and social content for a women's health clinic in Bucharest founded by internationally experienced gynaecologists. By Cromatic Studios.",
    title: "Making motherhood a soothing, joyful experience.",
    accent: { bg: "#F7B49A", ink: "#a2508f" },
    info: ["Healthcare, women's health clinic", "Bucharest", "Brand strategy, branding, UI, web development, social media content"],
    cover: v("2025/06/elithia-homepage.webm", 1.778, { poster: cs("2025/06/Elithia-Cromaticstudios-homepage.jpeg") }),
    og: cs("2025/06/Elithia-Cromaticstudios-homepage.jpeg"),
    hero: { img: cs("2025/06/Ribbon_Elithia.jpg"), alt: "The Elithia wordmark wrapped in ribbons naming its specialties", r: 2.658, fixed: false },
    problem: {
      h: "A new kind of clinic for mothers",
      p: [
        "Elithia was founded by a <strong>team of internationally experienced gynaecologists</strong> who wanted to bring a new concept to Romania: a clinic that gives mothers an <strong>empathy-driven experience</strong> at the <strong>highest medical standards</strong> in the market.",
        "Obstetrics, maternal-fetal medicine, gynaecology and breast care, under one roof in Bucharest, now in <strong>two locations</strong>. The brand had to feel as caring as the doctors, and as trustworthy as their training."
      ],
      media: [{ row: [{ img: "m:elithia/team", alt: "The Elithia doctors in white coats" }, { img: "m:elithia/ultrasound", alt: "An ultrasound scan at Elithia", full: true }], cap: "The team, and a scan at the clinic." }],
      quote: { text: "Elithia is a space where professionalism meets genuine care for women's health.", cite: "Elithia, on its website" }
    },
    solution: {
      h: "Care you can feel",
      p: "We built a brand universe close to the founders' vision: a soft, rounded wordmark, a flowing symbol, a warm palette of peach, teal and lilac, and ribbons that carry the clinic's specialties. Then a website and social content that speak the same language.",
      stat: "4 specialties",
      statText: "obstetrics, maternal-fetal medicine, gynaecology and breast care"
    },
    chapters: [
      {
        pillar: "brand",
        text: "The wordmark, a flowing symbol and a palette of peach, teal and lilac, with ribbons that wrap the specialties and values around every surface. Each doctor gets a card in a colour of their own.",
        deliverables: ["Brand strategy", "Logo", "Symbol", "Colour system", "Ribbon graphics", "Business cards", "Stationery"],
        media: [
          { row: [{ img: cs("2025/06/Elithia-Cromaticstudios-carti-de-vizita-3.jpg"), alt: "A stack of peach Elithia business cards" }, { img: cs("2025/06/Elithia-Cromaticstudios-carti-de-vizita-1.jpg"), alt: "A doctor's business card in peach with the Elithia symbol" }, { img: cs("2025/06/Elithia-Cromaticstudios-carti-de-vizita-2.jpg"), alt: "A doctor's business card in teal" }, { img: cs("2025/06/Elithia-Cromaticstudios-carti-de-vizita-4.jpg"), alt: "A doctor's business card in lilac" }], cap: "The wordmark on peach, and the symbol on each doctor's card, in a colour of their own" }
        ]
      },
      {
        pillar: "marketing",
        text: "Social content that sounds like the clinic: calm, clear and warm, with the ribbons carrying the topics, from the first pregnancy check-up to breast screening.",
        deliverables: ["Social media content", "Instagram posts", "Key visuals", "Copywriting"],
        media: [
          { row: [{ img: cs("2025/06/Elithia-Cromaticstudios-2.jpg"), alt: "Key visual: when to book a breast consultation" }, { img: cs("2025/06/Elithia-Cromaticstudios-3.jpg"), alt: "Key visual for gynaecology consultations" }], cap: "Key visuals for breast care and gynaecology" },
          { row: [{ img: cs("2025/06/Elithia-Cromaticstudios-Instagram-1.jpg"), alt: "Instagram post: safety and calm, from the first check-up" }, { img: cs("2025/06/Elithia-Cromaticstudios-Instagram-2.jpg"), alt: "Instagram post with the Elithia wordmark and ribbon" }, { img: cs("2025/06/Elithia-Cromaticstudios-Instagram-3-1.jpg"), alt: "Instagram post about breast health screening" }], cap: "Instagram, in the clinic's own voice" }
        ]
      },
      {
        pillar: "product",
        text: "elithia.ro introduces the doctors first, explains each specialty in plain words and keeps an appointment one tap away, on every screen.",
        deliverables: ["UX/UI design", "Web development", "Doctor profiles", "Service pages", "Appointment requests"],
        media: [
          { site: { label: "elithia.ro", href: "https://elithia.ro/", d: { video: cs("2025/06/elithia-homepage.webm"), r: 1.775, poster: cs("2025/06/Elithia-Cromaticstudios-homepage.jpeg"), alt: "Scrolling through the elithia.ro homepage" }, m: { img: "m:elithia/site-scroll-phone", scroll: true, alt: "The elithia.ro homepage on a phone, scrolling" } }, head: ["The", "website"], cap: "The homepage: the team, the specialties and the journey from the first check-up." },
          { row: [{ img: "m:elithia/mmf", alt: "Maternal-fetal medicine: a couple holding an ultrasound print" }, { img: "m:elithia/breast-care", alt: "Breast care visual on a warm beige background" }], cap: "Imagery for the service pages" }
        ]
      }
    ],
    result: {
      text: "A clinic brand close to its founders' vision: professional, warm and recognisable, from a doctor's business card to the booking page.",
      media: [{ img: "m:elithia/journey", alt: "A mother-to-be with a doctor's hands on her belly" }]
    },
    link: { href: "https://elithia.ro/", label: "Visit elithia.ro" },
    related: ["clinica-sante", "help-4-brain", "routine-paris"]
  },

  // ------------------------------------------------------------------ Yoshi Izakaya
  {
    slug: "yoshi-izakaya",
    name: "Yoshi Izakaya",
    tagline: "Delivering top content for the best sushi in town.",
    desc: "Yoshi Izakaya: content strategy, photo, video, social media, events and ad campaigns for a Japanese izakaya. By Cromatic Studios, Bucharest.",
    title: "Delivering top content for the best sushi in town.",
    accent: { bg: "#E9C27D", ink: "#8a4f12" },
    info: ["Food &amp; Beverages, restaurant", "Content strategy, video, photo, social media, ad campaigns, packaging"],
    cover: { img: cs("2025/06/Yoshy-Izacaya-cover-2.jpg") },
    og: cs("2025/07/Yoshy-Izakaya-Cromaticstudios-10.jpg"),
    hero: { img: cs("2025/07/Yoshy-Izakaya-Cromaticstudios-10.jpg"), alt: "Guests eating at Yoshi Izakaya" },
    problem: {
      h: "Great sushi, a quiet story",
      p: [
        "Yoshi Izakaya was already making <strong>the best sushi in town</strong>, but its content <strong>didn't tell the story</strong>.",
        "The kitchen, the bar, the team and the regulars who make the place feel like a community were all there, just <strong>not on screen</strong>."
      ],
      media: [{ row: [{ img: cs("2025/07/Yoshy-Izakaya-Cromaticstudios-2.jpg"), alt: "A full room at Yoshi Izakaya", full: true }, { img: cs("2025/07/Yoshy-Izakaya-Cromaticstudios-5.jpg"), alt: "Two guests at a table by the sushi counter" }], cap: "A full room, and a table by the counter." }]
    },
    solution: {
      h: "A special community, on camera",
      p: "We lifted Yoshi's social media presence with a clear strategy, targeted events and high-quality visuals: the dishes, the bar and the guests, shot in the restaurant.",
      stat: "New guests",
      statText: "drawn in by the content, the events and the campaigns"
    },
    chapters: [
      {
        pillar: "marketing",
        text: "A content strategy with a steady rhythm, events designed to bring new guests in, ad campaigns that put the food in front of the right people, and photography that shows the restaurant the way regulars know it.",
        deliverables: ["Content strategy", "Social media", "Photo production", "Video production", "Event content", "Ad campaigns", "Packaging"],
        media: [
          { stack: [
            { img: cs("2025/07/Yoshy-Izakaya-Cromaticstudios-4.jpg"), alt: "The sushi counter and bar at Yoshi Izakaya" },
            { row: [{ img: cs("2025/07/Yoshy-Izakaya-Cromaticstudios-1.jpg"), alt: "Sushi rolls on a stone plate by the counter" }, { img: cs("2025/07/Yoshy-Izakaya-Cromaticstudios-3.jpg"), alt: "A guest eating ramen with chopsticks" }] },
            { row: [{ img: cs("2025/07/Yoshy-Izakaya-Cromaticstudios-6.jpg"), alt: "Asparagus wrapped in meat on the grill" }, { img: cs("2025/07/Yoshy-Izakaya-Cromaticstudios-7.jpg"), alt: "Lifting ramen noodles from the bowl" }] },
            { row: [{ img: cs("2025/07/Yoshy-Izakaya-Cromaticstudios-8.jpg"), alt: "A green cocktail being finished at the bar" }, { img: cs("2025/07/Yoshy-Izakaya-Cromaticstudios-9.jpg"), alt: "A chef in a Yoshi apron holding a bowl" }] }
          ], head: ["Photography"], cap: "From the grill to the bar: the visuals behind the new feed" }
        ]
      }
    ],
    result: {
      text: "Yoshi's feed now tells the story of a special community, and the content, the events and the campaigns brought new customers through the door.",
      media: [{ img: cs("2025/06/Yoshy-Izacaya-cover-2.jpg"), alt: "A lit sign with Japanese characters reading dinner and fresh" }]
    },
    related: ["sip-coffee-wine", "kompus", "steam"]
  },

  // ------------------------------------------------------------------ ARCA Resort
  {
    slug: "arca-resort",
    name: "ARCA Resort",
    tagline: "Creating a truly authentic brand universe.",
    desc: "ARCA Resort: brand architecture, identity, packaging, signage and website for a resort-destination in Blăgești, Bacău, built around its own ponds and products. By Cromatic Studios.",
    title: "Creating a truly authentic brand universe.",
    accent: { bg: "#8E2C3A", fg: "#ffffff", ink: "#7a1f2b" },
    info: ["Tourism, Food &amp; Beverages", "Blăgești, Bacău", "Brand architecture, branding, design, packaging, signage, UI, web development"],
    cover: { img: cs("2025/06/arca-resort-cromaticstudios-covers-2.jpg") },
    og: cs("2025/06/arca-resort-cromaticstudios-covers-2.jpg"),
    hero: { video: cs("2025/06/arca-hom.webm"), poster: cs("2025/06/arcar-resort-Cromaticstudios-1.jpg"), r: 1.778, alt: "The ARCA website, in motion" },
    problem: {
      h: "A fish farm with big dreams",
      p: [
        "ARCA began as a <strong>fish farm</strong> and grew into a retreat for people escaping the urban hustle: ponds and a pontoon, <strong>Lotca</strong>, a fishermen's restaurant, Tiny Houses and Lotca Rooms, <strong>Foliage</strong> for weddings and events, and a wide portfolio of <strong>premium, fresh fish-based foods</strong>.",
        "A family business with the vision, and the patience, to build <strong>one of the most special brands in the country</strong>, in a highly competitive market."
      ],
      media: [{ row: [{ img: "m:arca/dusk", alt: "The ARCA ponds at dusk" }, { img: "m:arca/lake", alt: "A lifebuoy on the railing by the pond" }], cap: "The ponds at Blăgești, Bacău." }],
      quote: { text: "We took nature as our accomplice and built a resort-destination together.", cite: "ARCA, on its website" }
    },
    solution: {
      h: "One house, many brands",
      p: "We built a complex brand architecture with fertile ground for extensions: ARCA at the top, and a family of sub-brands around it, Lotca, Foliage, Tiny Houses, Play and more, so every new product or venue can launch under the same roof.",
      stat: "One architecture",
      statText: "a master brand and the family of sub-brands around it"
    },
    chapters: [
      {
        pillar: "brand",
        text: "The thin ARCA lettering at the top, a family of sub-brands below it, each with its own colour and type, and guidelines that keep them related. Then the details guests touch: menus, placemats, table cards, badges and signs.",
        deliverables: ["Brand architecture", "Brand strategy", "Logo family", "Colour system", "Brand guidelines", "Menus", "Signage", "Stationery"],
        media: [
          { row: [{ img: cs("2025/06/arcar-resort-Cromaticstudios-2.jpg"), alt: "The ARCA brand family: Lotca, Play, Foliage, Tiny Houses and more" }, { img: cs("2025/07/resort-signage-3.jpg"), alt: "The ARCA totem sign listing its venues" }], cap: "The brand family, and the totem that brings it together at the gate" },
          { row: [{ img: cs("2025/06/arcar-resort-Cromaticstudios-5.jpg"), alt: "ARCA brand book open on a table" }, { img: cs("2025/06/arcar-resort-Cromaticstudios-6.jpg"), alt: "Brand book spread with the colour palette" }], cap: "Brand guidelines" },
          { stack: [
            { row: [{ img: cs("2025/06/Lotca-by-Arca-Resort-3.jpg"), alt: "A green leather placemat embossed with Lotca" }, { img: cs("2025/06/Lotca-by-Arca-Resort-5.jpg"), alt: "A green Lotca menu cover" }, { img: cs("2025/06/Lotca-by-Arca-Resort-4.jpg"), alt: "Reserved table cards on ceramic holders" }] },
            { row: [{ img: cs("2025/06/arcar-resort-Cromaticstudios-4.jpg"), alt: "A Lotca by ARCA menu in hand" }, { img: cs("2025/06/arcar-resort-Cromaticstudios-10.jpg"), alt: "An open menu with the starters" }] },
            { img: cs("2025/07/Kitchen-Arca-resort.jpg"), alt: "The Lotca wordmark above the kitchen pass" },
            { row: [{ img: cs("2025/07/Misc-Lotca-by-Arca-Resort-3.jpg"), alt: "Pink name badges" }, { img: cs("2025/07/Misc-Lotca-by-Arca-Resort-4.jpg"), alt: "A wooden table number with a menu QR code" }, { img: cs("2025/07/arca-resort-cromaticstudios-15.jpg"), alt: "A wooden Lotca block" }, { img: cs("2025/07/arca-resort-cromaticstudios-17.jpg"), alt: "A Foliage table sign in wood" }] }
          ], head: ["Lotca", "by ARCA"], cap: "Lotca, the fishermen's restaurant: placemats, menus, table cards, badges and the kitchen" },
          { row: [{ img: cs("2025/06/arcar-resort-Cromaticstudios-3.jpg"), alt: "Soft opening menu and a printed brochure" }, { img: cs("2025/06/arcar-resort-Cromaticstudios-7.jpg"), alt: "ARCA printed materials spread on a table" }], cap: "Print for the opening" }
        ]
      },
      {
        pillar: "product",
        text: "Packaging for the products that carry ARCA's name: caviar tins, jars, smoked-fish trays and a delivery van, plus the resort's website.",
        deliverables: ["Packaging design", "Caviar tins", "Jar labels", "Skin trays", "Vehicle livery", "Website UI", "Web development"],
        media: [
          { row: [{ img: "m:arca/caviar-pair", alt: "ARCA Caviar Gold Imperial and Imperial tins" }, { img: "m:arca/caviar-photo", alt: "ARCA Imperial caviar tins on a dark surface" }], cap: "ARCA Caviar, Gold Imperial and Imperial, in navy and burgundy" },
          { row: [{ img: "m:arca/caviar-colors", alt: "Caviar tins in purple and pink" }, { img: "m:arca/caviar-set", alt: "Six navy Gold Imperial tins" }, { img: "m:arca/caviar-set2", alt: "Caviar tins in black, burgundy and copper" }] },
          { row: [{ img: "m:arca/caviar-photo2", alt: "Caviar tins, front and back" }, { img: "m:arca/caviar-photo3", alt: "Two caviar tins from above" }, { img: "m:arca/caviar-photo4", alt: "Imperial and Gold Imperial tins side by side" }], cap: "The same tin, explored across colours and finishes before the final line-up" },
          { row: [{ img: cs("2025/07/arca-resort-cromaticstudios-18.jpg"), alt: "Jars of fish zacuscă from Blăgești" }, { img: "m:arca/tray", alt: "Kraft skin trays for smoked fish" }], cap: "Jars and skin trays for the smoked fish" },
          { row: [{ img: "m:arca/van-side", alt: "The ARCA delivery van with giant jars along its side" }, { img: "m:arca/van-back", alt: "The back of the ARCA van" }], cap: "The delivery van as a moving shelf" },
          { site: { label: "arca-resort.ro", href: "https://arca-resort.ro/", d: { img: "m:arca-resort/site-scroll", scroll: true, alt: "The arca-resort.ro homepage, scrolling" }, m: { img: "m:arca-resort/site-scroll-phone", scroll: true, alt: "The arca-resort.ro homepage on a phone, scrolling" } }, head: ["The", "website"], cap: "arca-resort.ro: the restaurant, the stays, the events and the experiences." }
        ]
      }
    ],
    result: {
      text: "A brand architecture with fertile potential for extensions and new launches, giving ARCA the flexibility it needed in a highly competitive market.",
      media: [{ img: cs("2025/06/arca-resort-cromaticstudios-covers-2.jpg"), alt: "ARCA from above, at sunset over the ponds" }]
    },
    link: { href: "https://arca-resort.ro/", label: "Visit arca-resort.ro" },
    related: ["yoshi-izakaya", "sip-coffee-wine", "routine-paris"]
  },

  // ------------------------------------------------------------------ Routine Paris
  {
    slug: "routine-paris",
    name: "Routine Paris",
    tagline: "Making in Romania a brand that can win in Paris.",
    desc: "Routine Paris: brand strategy, the first perfume campaign, social media launch and e-shop for a perfume and cosmetics boutique going from Bucharest to Paris. By Cromatic Studios.",
    title: "Making in Romania a brand that can win in Paris.",
    accent: { bg: "#D4B06A", ink: "#8c2a1c" },
    info: ["Retail, Beauty &amp; Fashion", "Brand strategy, content strategy, social media, photo, video, design, packaging, UI, web development"],
    cover: v("2025/07/Routin-Cover.webm", 1.778, { poster: cs("2025/06/ROUTINE_SHY-EXTREME-5-1.jpg") }),
    og: cs("2025/06/ROUTINE_SHY-EXTREME-5-1.jpg"),
    hero: { video: cs("2025/07/Routin-Cover.webm"), poster: cs("2025/06/ROUTINE_SHY-EXTREME-5-1.jpg"), r: 1.778, alt: "A Routine Paris perfume bottle in a dark, glittering set" },
    problem: {
      h: "From Little Paris to Paris",
      p: [
        "An ambitious <strong>perfume and cosmetics boutique</strong> from Bucharest, the city once called Little Paris, wanted to make it big in the heartland of elegance itself: <strong>Paris, France</strong>.",
        "To get there it needed a <strong>strategy</strong>, a voice on social media, its <strong>first perfume campaign</strong> and an online shop to sell from."
      ],
      media: [{ row: [{ img: cs("2025/06/ROUTINE_GAME-1.jpg"), alt: "A stone cube engraved with the Routine R" }, { img: cs("2025/06/ROUTINE_GAME-SONG-022.jpg"), alt: "A Routine Paris bottle on dark glitter" }], cap: "Stills from the first perfume campaign." }]
    },
    solution: {
      h: "Strategy first, then the launch",
      p: "We met Routine Paris' ambition with a solid brand strategy, launched the brand on social media, created its first perfume campaign and built the e-shop to take it to market.",
      stat: "First campaign",
      statText: "the perfume campaign that introduced Routine Paris"
    },
    chapters: [
      {
        pillar: "brand",
        text: "A clean, wide wordmark with Paris set underneath, gold and burgundy details, and print that reads like a fashion magazine: “The art of fragrance.”",
        deliverables: ["Brand strategy", "Logo", "Packaging", "Print design", "Brochure"],
        media: [
          { row: [{ img: cs("2025/06/Logo-routine-Paris-Cover.jpg"), alt: "The Routine Paris wordmark on black" }, { img: cs("2025/06/print.jpg"), alt: "Routine Paris brochure spreads: the art of fragrance" }], cap: "The wordmark, and print that tells the art of fragrance as a story" }
        ]
      },
      {
        pillar: "marketing",
        text: "The first perfume campaign, shot as a short film and a series of stills, and the social media launch that followed, one fragrance at a time, each with its notes.",
        deliverables: ["Content strategy", "Campaign concept", "Photo production", "Video production", "Social media launch", "Instagram posts"],
        media: [
          { video: cs("2025/06/GAME-SONG-MONTAGE.webm"), r: 1.778, manual: true, poster: cs("2025/06/ROUTINE_GAME-SONG-022.jpg"), alt: "The Routine Paris campaign film", cap: "The campaign film" },
          { row: [{ img: cs("2025/06/ROUTINE_GAME-SONG-3.jpg"), alt: "A Routine bottle in an open black box" }, { img: cs("2025/06/ROUTINE_SHY-EXTREME-4.jpg"), alt: "A Routine bottle with gold frames" }], cap: "Campaign stills" },
          { rail: ["Instagram", "launch"], items: [1, 2, 3, 4, 5, 6].map((i) => ({ img: cs(`2025/06/Routine-Paris-instagram-${i}.jpg`), alt: `Routine Paris Instagram post ${i}` })), cap: "Each fragrance introduced with its top, heart and base notes" }
        ]
      },
      {
        pillar: "product",
        text: "An e-shop in French, built to sell the collection in its new market: perfumes, lifestyle and the story of the house.",
        deliverables: ["E-commerce website", "UI design", "Web development"],
        media: [
          { site: { label: "routineparis.com", href: "https://routineparis.com/", d: { video: cs("2025/06/homepage-scroll.webm"), r: 1.886, alt: "Scrolling through the Routine Paris homepage" }, m: { img: cs("2025/06/Routine-Paris-mobil-1.jpg"), r: 0.528, alt: "The Routine Paris shop on a phone" } }, head: ["The", "e-shop"], cap: "The shop, in French, on desktop and phone." },
          { row: [{ img: cs("2025/06/Routine-Paris-mobil-2.jpg"), alt: "The Parfums page on a phone" }, { img: cs("2025/06/Routine-Paris-mobil-3.jpg"), alt: "The Style de vie page on a phone" }, { img: cs("2025/06/web.jpg"), alt: "The Routine Paris shop on a laptop", full: true }] }
        ]
      }
    ],
    result: {
      text: "A boutique from Bucharest with the strategy, the campaign and the shop it needs to compete in Paris.",
      media: [{ img: cs("2025/06/ROUTINE_SHY-EXTREME-5-1.jpg"), alt: "A Routine Paris bottle on a white plinth" }]
    },
    link: { href: "https://routineparis.com/", label: "Visit routineparis.com" },
    related: ["elithia", "help-4-brain", "assetto"]
  },

  // ------------------------------------------------------------------ ALTIUS
  {
    slug: "altius",
    name: "ALTIUS",
    tagline: "Consolidating the vet pharma leader's market position.",
    desc: "ALTIUS: repositioning, a refreshed visual identity, website and video content for a leader in veterinary pharmaceutical distribution. By Cromatic Studios, Bucharest.",
    title: "Consolidating the vet pharma leader's market position.",
    accent: { bg: "#7CC9C3", ink: "#c2531a" },
    info: ["Veterinary, Pharma", "Brand strategy, branding, UI, web development, video"],
    cover: { img: cs("2025/06/Cromatic-Studios-Altius-8.jpg") },
    og: cs("2025/06/Cromatic-Studios-Altius-11.jpg"),
    hero: { img: cs("2025/06/Cromatic-Studios-Altius-10.jpg"), alt: "ALTIUS cards with soft teal and orange gradients" },
    problem: {
      h: "A leader that needed to look like one",
      p: [
        "ALTIUS is <strong>a leader in the distribution of veterinary pharmaceutical products</strong>.",
        "To consolidate its market status it needed a <strong>clear repositioning</strong> and a <strong>refreshed visual identity</strong>."
      ],
      media: [{ row: [{ img: cs("2025/06/Cromatic-Studios-Altius-3.jpg"), alt: "ALTIUS notebooks with a teal gradient" }, { img: cs("2025/06/Cromatic-Studios-Altius-4.jpg"), alt: "ALTIUS tape in white and teal" }], cap: "Notebooks and tape from the new identity." }]
    },
    solution: {
      h: "Repositioned, then refreshed",
      p: "A new strategy, then a new identity: the ALTIUS wordmark with its orange arrow, soft teal gradients, and a system of cards and icons for every product area.",
      stat: "Long-term partner",
      statText: "for video content, including Vets Congress"
    },
    chapters: [
      {
        pillar: "brand",
        text: "The wordmark and its arrow, blurred gradients in teal and orange, and an icon set for the animals and areas ALTIUS serves, used on everything from business cards to umbrellas.",
        deliverables: ["Brand strategy", "Repositioning", "Logo refresh", "Colour system", "Iconography", "Stationery", "Merch"],
        media: [
          { row: [{ img: cs("2025/06/Cromatic-Studios-Altius-11.jpg"), alt: "The ALTIUS wordmark with its orange arrow on a teal gradient" }, { img: cs("2025/06/Cromatic-Studios-Altius-12.jpg"), alt: "A row of icons for animals and product areas" }], cap: "The wordmark and its arrow, and icons for the animals and areas ALTIUS serves" },
          { row: [{ img: cs("2025/06/Cromatic-Studios-Altius-5.jpg"), alt: "An ALTIUS umbrella" }, { img: cs("2025/06/Cromatic-Studios-Altius-6.jpg"), alt: "ALTIUS business cards" }], cap: "Umbrella and business cards" },
          { row: [{ img: cs("2025/06/Cromatic-Studios-Altius-8.jpg"), alt: "Cards named Standard, Flexible and Business" }, { img: cs("2025/06/Cromatic-Studios-Altius-9.jpg"), alt: "Teal folders and envelopes" }], cap: "Cards for each offer, folders and stationery" }
        ]
      },
      {
        pillar: "product",
        text: "A website that presents the portfolio, the events and the articles ALTIUS publishes for vets, in the same soft, clinical palette.",
        deliverables: ["UI design", "Web development"],
        media: [
          { row: [{ img: cs("2025/06/Cromatic-Studios-Altius-2.jpg"), alt: "The ALTIUS website on a laptop" }, { img: cs("2025/06/Cromatic-Studios-Altius-1.jpg"), alt: "Website sections for events and articles" }], cap: "The website, with events and articles for vets" }
        ]
      }
    ],
    result: {
      text: "We delivered, exceeded expectations and became a long-term partner in video content, supporting Vets Congress, the top industry event in the market, made by ALTIUS."
    },
    related: ["help-4-brain", "bepco", "elithia"]
  },

  // ------------------------------------------------------------------ Help4Brain
  {
    slug: "help-4-brain",
    name: "Help4Brain",
    tagline: "Enabling a pharma challenger to become a leader.",
    desc: "Help4Brain by Zdrovit: brand and content strategy, social media launch, video, photo, influencer marketing and website for a nootropic supplement. By Cromatic Studios.",
    title: "Enabling a pharma challenger to become a leader.",
    accent: { bg: "#4DA3F0", ink: "#0d5fb3" },
    info: ["Pharma, nootropics", "Brand strategy, content strategy, TV commercial, video, social media, ad campaigns, photo, influencer marketing, UI, web development"],
    cover: v("2025/06/Help4brain.webm", 1.778, { poster: cs("2025/06/Cromatic-Studios-Help4brain-1.jpg") }),
    og: cs("2025/06/Cromatic-Studios-Help4brain-10.jpg"),
    hero: { img: cs("2025/06/Cromatic-Studios-Help4brain-10.jpg"), alt: "Three Help4Brain boxes on white plinths" },
    problem: {
      h: "Top of the line, little known",
      p: [
        "Produced by <strong>Zdrovit</strong>, Help4Brain is a <strong>top-of-the-line nootropic</strong>.",
        "It needed to <strong>educate consumers</strong> and build awareness in a market <strong>dominated by medical distribution</strong>, where most people hear about a supplement from a doctor or a pharmacist, not from the brand."
      ],
      media: [{ row: [{ img: cs("2025/06/Cromatic-Studios-Help4brain-12.jpg"), alt: "A woman stretching with a Help4Brain box beside her" }, { img: cs("2025/06/Cromatic-Studios-Help4brain-13.jpg"), alt: "A man reading, with a Help4Brain box in the foreground" }], cap: "Product photography for everyday focus." }]
    },
    solution: {
      h: "An authority in all things brain",
      p: "We built a solid brand and content strategy and launched Help4Brain on social media, with education at the centre: how memory works, why sleep matters, what is inside each tablet.",
      stat: "Quick impact",
      statText: "and a position as a potential authority on the brain"
    },
    chapters: [
      {
        pillar: "marketing",
        text: "Short videos with experts and creators, explainers on memory, focus and sleep, a TV commercial, ad campaigns and product photography for social.",
        deliverables: ["Brand strategy", "Content strategy", "Social media", "Influencer marketing", "TV commercial", "Video production", "Ad campaigns", "Photo production"],
        media: [
          { rail: ["Instagram", "reels"], items: [2, 3, 4, 5, 6, 7].map((i) => ({ img: cs(`2025/06/Cromatic-Studios-Help4brain-${i}.jpg`), alt: `Help4Brain Instagram reel ${i - 1}` })), cap: "Reels on memory, power naps and dopamine, with experts and creators" },
          { row: [{ img: cs("2025/06/Cromatic-Studios-Help4brain-11.jpg"), alt: "A woman lying on a yoga mat next to a Help4Brain box" }, { img: cs("2025/06/Cromatic-Studios-Help4brain-1.jpg"), alt: "Blue tablets arranged in a grid" }], cap: "Lifestyle and product stills" }
        ]
      },
      {
        pillar: "product",
        text: "A website that explains the science in plain words: how memory works, the main ingredients and how to order.",
        deliverables: ["UI design", "Web development", "Educational content"],
        media: [
          { site: { label: "help4brain.ro", href: "https://help4brain.ro/", d: { video: cs("2025/06/Help4brain.webm"), r: 1.778, poster: cs("2025/06/Cromatic-Studios-Help4brain-8.jpg"), alt: "Scrolling through the Help4Brain website" }, m: { img: cs("2025/06/mobil-hep4brain-1.jpg"), r: 0.528, alt: "The memory page on a phone" } }, head: ["The", "website"], cap: "The website, on desktop and phone." },
          { row: [{ img: cs("2025/06/Cromatic-Studios-Help4brain-8.jpg"), alt: "Desktop page explaining memory", full: true }, { img: cs("2025/06/mobil-hep4brain-2.jpg"), alt: "Mobile page on hydration and sleep" }, { img: cs("2025/06/mobil-hep4brain-3.jpg"), alt: "Mobile page listing the main ingredients" }] }
        ]
      }
    ],
    result: {
      text: "Launched with a clear brand and content strategy, Help4Brain had a quick impact on social media and a position as a potential authority in all things brain related."
    },
    related: ["altius", "elithia", "investimental"]
  },

  // ------------------------------------------------------------------ Investimental
  {
    slug: "investimental",
    name: "Investimental",
    tagline: "Helping the newest retail broker in the market win in digital.",
    desc: "Investimental: UX research, design systems, a web trading platform and a native mobile app for a retail broker, in twelve weeks. By Cromatic Studios, Bucharest.",
    title: "Helping the newest retail broker in the market win in digital.",
    accent: { bg: "#18306B", fg: "#ffffff", ink: "#2148b8" },
    info: ["Banking &amp; Finance, investment", "UX research, UI design, design systems, digital platform, native mobile app"],
    cover: { img: cs("2025/06/Investimental-Cromaticstudios-1-e1759417114960.jpg") },
    og: cs("2025/07/Investimental-Cromaticstudios-cover-1-1.jpg"),
    hero: { video: cs("2025/07/market-dashboard.webm"), r: 1.781, poster: cs("2025/07/Market-BUY-market-value.jpg"), alt: "The Investimental market dashboard in use" },
    problem: {
      h: "The youngest player in a difficult market",
      p: [
        "As the <strong>youngest player</strong> in a very difficult market, retail broker Investimental needed to stand out from its competitors and become the choice of <strong>young, up-and-coming investors</strong>.",
        "It also ran <strong>separate platforms for each currency</strong>. The brief: merge them into <strong>one accessible, transparent trading solution</strong>, for novices and experts alike."
      ],
      media: [{ img: cs("2025/07/Investimental-Cromaticstudios-cover-1-1.jpg"), alt: "The Investimental app on two phones", cap: "One platform, on web and mobile." }]
    },
    solution: {
      h: "One platform for novices and experts",
      p: "Twelve weeks from briefing to sign-off: research, wireframes, two design systems, high-fidelity web and native app designs, interactive prototypes and usability testing.",
      stat: "Design awards",
      statText: "won by the platform, now considered best practice in the market"
    },
    chapters: [
      {
        pillar: "product",
        text: "Stakeholder workshops and a side-by-side audit of Revolut, Trading 212 and Interactive Brokers defined three personas: the novice investor, the active trader and the institutional manager. KYC, GDPR and AML requirements were built into the flows from the start, and light and dark themes keep the data readable.",
        deliverables: ["Stakeholder workshops", "User research", "Information architecture", "Wireframes", "Design systems, web and mobile", "Web trading platform", "Native mobile app", "Interactive prototypes", "Usability testing", "Developer handoff"],
        media: [
          { rail: ["Web", "platform"], items: [
            { img: cs("2025/07/Web-1920-–-portofoliu-–-default.jpg"), alt: "Portfolio overview on the web platform" },
            { img: cs("2025/07/Market-BUY-market-value.jpg"), alt: "Placing a market buy order" },
            { img: cs("2025/07/Transactions-buy-–-1.jpg"), alt: "Transactions view" },
            { img: cs("2025/07/Web-1920-–-portofoliu-–-bars-Order.jpg"), alt: "Portfolio with an order panel" },
            { img: cs("2025/07/Order-details-–-buy-1.jpg"), alt: "Order details for a buy" },
            { img: cs("2025/07/Create-watchlist-popup-–-1-1.jpg"), alt: "Creating a watchlist" }
          ], cap: "The desktop platform: markets, orders, portfolios and watchlists on one screen" },
          { row: [
            { video: cs("2025/07/lists.mp4"), r: 0.46, alt: "Browsing market lists in the app" },
            { img: cs("2025/07/lista-2.jpg"), alt: "Company details with buy and sell" },
            { img: cs("2025/07/order-2.jpg"), alt: "Order history in green" },
            { video: cs("2025/07/Charts.mp4"), r: 0.463, alt: "Portfolio charts in the app" }
          ], cap: "The native app: lists, company details, orders and charts" },
          { btn: { href: "https://cromaticstudios.com/wp-content/uploads/2025/09/UI_UX-Case-studies-Cromatic.pdf", label: "Read the full UI/UX case study (PDF)" } }
        ]
      }
    ],
    result: {
      text: "A highly innovative digital platform and app that won design awards and is considered best practice in the market.",
      media: [{ img: cs("2025/07/Order-details-–-sell-1.jpg"), alt: "Order details for a sell, in red" }]
    },
    related: ["assetto", "help-4-brain", "bepco"]
  },

  // ------------------------------------------------------------------ Sip
  {
    slug: "sip-coffee-wine",
    name: "Sip Coffee &amp; Wine",
    tagline: "Complementing one of the best designed coffee shops in town with a branding that fits.",
    desc: "Sip: brand identity and social media launch for a coffee shop and wine bar in central Bucharest. By Cromatic Studios.",
    title: "A brand that fits one of the best designed coffee shops in town.",
    accent: { bg: "#5C7034", fg: "#ffffff", ink: "#b5532f" },
    info: ["Food &amp; Beverages, coffee shop and wine bar", "Bucharest", "Branding, video, social media"],
    cover: { img: cs("2025/06/Sip_portfolio-Cromaticstudios.jpg") },
    og: cs("2025/07/Sip_portfolio-Cromaticstudios-3.jpg"),
    hero: { img: cs("2025/07/Sip_portfolio-Cromaticstudios-3.jpg"), alt: "The Sip storefront: coffee shop on one side, wine bar on the other", r: 2.336, fixed: false },
    problem: {
      h: "Coffee by day, wine by night",
      p: [
        "Designed by <strong>leading architects</strong> in Bucharest, Sip is a <strong>coffee shop and wine bar</strong> that set out to reshape the life of a central neighbourhood in the city.",
        "It needed a brand <strong>up to the challenge</strong>, and a powerful launch on social media to bring in its <strong>first guests</strong>."
      ],
      media: [{ row: [{ img: cs("2025/06/Sip_portfolio-Cromaticstudios.jpg"), alt: "A cookie on a blue plate, with the Sip logo" }, { img: cs("2025/07/Sip_portfolio-Cromaticstudios-10.jpg"), alt: "The opening poster next to a glass of white wine", full: true }], cap: "One circle, two halves." }]
    },
    solution: {
      h: "Two halves, one circle",
      p: "Two semicircles inspired by the architectural arches of the space: the top for the coffee shop, the bottom for the wine bar. Together they form a complete circle, and a day and a night colour scheme keeps the two spaces distinct.",
      stat: "A household name",
      statText: "among Bucharest's new wave coffee shops"
    },
    chapters: [
      {
        pillar: "brand",
        text: "The logo, a day and night palette in black, olive, sage, blush and terracotta, Poppins for type, and a set of shapes cut from the same circle, carried onto menus, cups and bags.",
        deliverables: ["Logo", "Day and night colour system", "Typography", "Brand elements", "Brand guidelines", "Menus", "Cups and bags"],
        media: [
          { row: [{ img: cs("2025/07/Sip_portfolio-Cromaticstudios-4.jpg"), alt: "The logo construction and the day and night circle" }, { img: cs("2025/07/Sip_portfolio-Cromaticstudios-5.jpg"), alt: "The Sip brand guidelines book", full: true }], cap: "The logo construction and the guidelines" },
          { row: [{ img: cs("2025/07/Sip_portfolio-Cromaticstudios-6.jpg"), alt: "Poppins and the Sip brand shapes" }, { img: cs("2025/07/Sip_portfolio-Cromaticstudios-7.jpg"), alt: "Loyalty cards and the colour palette" }], cap: "Type, shapes, palette and loyalty cards" },
          { img: cs("2025/07/Sip_portfolio-Cromaticstudios-8.jpg"), alt: "A barista pouring latte art, and the Sip menu on a clipboard", cap: "The menu" },
          { img: cs("2025/07/Sip_portfolio-Cromaticstudios-9.jpg"), alt: "Sip cups and a paper bag: Sip away", cap: "“Sip happens.” “Sip away.” Cups and bags with a line each" }
        ]
      },
      {
        pillar: "marketing",
        text: "A social media launch with lines that sound like the place: “Sip it like it's hot”, “No reservation, just take a sip”, “Sip up, and take my money”.",
        deliverables: ["Social media launch", "Content", "Video", "Opening campaign"],
        media: [
          { row: [{ img: cs("2025/07/Sip_portfolio-Cromaticstudios-11.jpg"), alt: "The Sip Instagram grid" }, { img: cs("2025/07/Sip_portfolio-Cromaticstudios-12.jpg"), alt: "The Sip opening poster" }], cap: "The Instagram grid and the opening poster" }
        ]
      }
    ],
    result: {
      text: "Sip opened with a brand that fits its architecture and a launch that brought in its first guests, and became a household name among Bucharest's new wave coffee shops."
    },
    related: ["steam", "kompus", "yoshi-izakaya"]
  },

  // ------------------------------------------------------------------ Bepco
  {
    slug: "bepco",
    name: "Bepco",
    tagline: "Giving green energy the story it deserves.",
    desc: "Bepco: brand facelift, logo animation, website and video content for a high-efficiency cogeneration energy company from Brașov. By Cromatic Studios.",
    title: "Giving green energy the story it deserves.",
    accent: { bg: "#3FB7A3", ink: "#17705f" },
    info: ["Technology, energy solutions", "Brașov", "Brand facelift, brand development, design, animation, video production, UI, web development"],
    cover: { img: cs("2025/06/Bepco-1.jpg") },
    og: cs("2025/06/Bepco-1.jpg"),
    hero: { img: cs("2025/06/Bepco-1.jpg"), alt: "Bepco chevrons over a pine forest" },
    problem: {
      h: "A local energy company with national ambitions",
      p: [
        "Bepco, from Brașov, is <strong>the first pilot project and private urban investment in high-efficiency cogeneration</strong> in Romania, bringing the city modern, cleaner energy solutions since 2010.",
        "A growing company, it needed a <strong>transformation</strong>: a new visual identity for a <strong>clearer and stronger vision</strong>."
      ],
      media: [{ row: [v("2025/06/Bepco_A.webm", 1, { alt: "Bepco brand animation with chevrons around a hexagon" }), v("2025/06/Bepco_B.webm", 1, { alt: "Bepco brand animation with a field of hexagons" }), v("2025/06/bepco_c-1.mp4", 1, { alt: "Bepco brand animation with three cubes" })], cap: "The hexagon, in motion." }],
      quote: { text: "Our mission is to build, together, a more efficient and safer energy future for people.", cite: "Bepco, on its website" }
    },
    solution: {
      h: "Energy for change",
      p: "A facelift for the identity, a hexagon mark built to move, and a website and video content that explain cogeneration in plain words.",
      stat: "75%",
      statText: "lower CO₂ emissions than the old Brașov plant, the number the new site leads with"
    },
    chapters: [
      {
        pillar: "brand",
        text: "The hexagon mark and wordmark, refreshed and animated, in a palette of teals that ties energy to the forests around Brașov.",
        deliverables: ["Brand facelift", "Brand development", "Logo animation", "Motion design", "Design"],
        media: [
          { img: cs("2025/06/Cover-video.jpg"), alt: "The Bepco logo on teal", cap: "The refreshed mark" }
        ]
      },
      {
        pillar: "product",
        text: "A website that explains what Bepco does, how it works and what it means for the city, with hexagons as the building block of every section.",
        deliverables: ["UI design", "Web development", "Animation"],
        media: [
          { site: { label: "bepco.ro", href: "https://bepco.ro/", d: { img: "m:bepco/site-scroll", scroll: true, alt: "The bepco.ro homepage, scrolling" }, m: { img: "m:bepco/site-scroll-phone", scroll: true, alt: "The bepco.ro homepage on a phone, scrolling" } }, head: ["The", "website"], cap: "bepco.ro: integrated energy solutions, how they work, and sustainability in numbers." },
          { row: [{ img: cs("2025/06/Bepco-web.png"), alt: "The Bepco site on a tablet: how we work" }, { img: cs("2025/06/Bepco-mobil-1.jpg"), alt: "Bepco mobile page: how we contribute" }, { img: cs("2025/06/Bepco-mobil-3.jpg"), alt: "Bepco mobile page: high-efficiency cogeneration" }] }
        ]
      },
      {
        pillar: "video",
        text: "After the rebrand we stayed on, creating video content for some of the bravest entrepreneurs we have ever met.",
        deliverables: ["Video production", "Editing", "Animation"],
        media: [
          v("2025/06/bepco-mini-reel_1.mp4", 1.778, { manual: true, poster: cs("2025/06/Cover-video.jpg"), alt: "Bepco video reel", cap: "A reel from the video work for Bepco" })
        ]
      }
    ],
    result: {
      text: "A clearer, stronger identity for a company growing from Brașov towards national scale, and a long-term relationship that keeps producing."
    },
    link: { href: "https://bepco.ro/", label: "Visit bepco.ro" },
    related: ["altius", "investimental", "assetto"]
  },

  // ------------------------------------------------------------------ Kómpus
  {
    slug: "kompus",
    name: "Kómpus",
    tagline: "Differentiating a coffee shop in the market by enabling the founders' vision.",
    desc: "Kómpus: a brand identity full of colour and joy, location branding and menus for a sandwich and coffee place in Constanța. By Cromatic Studios.",
    title: "Differentiating a coffee shop by enabling the founders' vision.",
    accent: { bg: "#F0A04B", ink: "#3d4fb5" },
    info: ["Food &amp; Beverages, sandwiches and coffee", "Constanța", "Branding, location branding, UI, web development"],
    cover: { img: cs("2025/07/Kompus-Cromaticstudios-cover.jpg") },
    og: cs("2025/05/pf1-3.jpg"),
    hero: { img: cs("2025/05/pf1-3.jpg"), alt: "The Kómpus shop window: grab a sandwich, a coffee, a juice to go; taste the world", r: 2.178, fixed: false },
    problem: {
      h: "A sandwich place by the sea",
      p: [
        "Born from <strong>the love for simple Japanese sandwiches</strong>, Kómpus set out to become a special place in <strong>Constanța</strong>, Romania's biggest seaside city.",
        "It needed a brand that makes the place feel <strong>welcoming and friendly for any customer</strong>."
      ],
      media: [{ row: [{ img: cs("2025/06/Kompus_Campaign-04.jpg"), alt: "Poster: the cuban sandwich" }, { img: cs("2025/07/cuban.jpg"), alt: "Posters for the chilean and swedish sandwiches" }], cap: "Sandwiches from around the world, each with its own map." }]
    },
    solution: {
      h: "Colour and joy",
      p: "A brand identity filled with colour and joy: a playful wordmark, chunky type, and a world map of sandwiches, so every visit feels like a small trip.",
      stat: "Taste the world",
      statText: "the line on the shop window"
    },
    chapters: [
      {
        pillar: "brand",
        text: "A cheerful wordmark, a bold display face and a bright palette of blue, orange, green and cream, carried from the shop window to the menu boards, the stickers and the campaigns.",
        deliverables: ["Brand identity", "Logo", "Typography", "Colour palette", "Location branding", "Menu boards", "Stickers", "Campaign posters"],
        media: [
          { img: cs("2025/07/Kompus-Cromaticstudios.jpg"), alt: "Round stickers: I bought this for you", cap: "Stickers for the cups and boxes: “I bought this for you”" },
          { row: [{ img: cs("2025/07/m1.jpg"), alt: "Coffee menu board in orange" }, { img: cs("2025/07/m2.jpg"), alt: "Drinks menu board in blue" }, { img: cs("2025/07/m3.jpg"), alt: "Sweets and sandwiches menu board" }], cap: "Menu boards: coffee, drinks, sweets and sandwiches" },
          { img: cs("2025/06/Screenshot-2024-08-06-at-14.42.29-1.jpg"), alt: "Promotion: chicken kebab with ayran", cap: "Promotions in the same voice" },
          { img: cs("2025/07/Kompus-Cromaticstudios-1.jpg"), alt: "A plane towing a Kómpus banner: take a photo and win", cap: "A summer contest: “Fă o poză și câștigă”, take a photo and win" }
        ]
      }
    ],
    result: {
      text: "A brand filled with colour and joy that helps the location feel welcoming and friendly for any customer."
    },
    related: ["sip-coffee-wine", "yoshi-izakaya", "steam"]
  },

  // ------------------------------------------------------------------ Assetto
  {
    slug: "assetto",
    name: "Assetto",
    tagline: "Putting the tech in fintech.",
    desc: "Assetto: brand strategy, an edgy visual universe, a landing page and a mobile app UI for a blockchain-based real estate startup. By Cromatic Studios.",
    title: "Putting the tech in fintech.",
    accent: { bg: "#C6F432", ink: "#4a7300" },
    info: ["Real estate, Banking &amp; Finance", "Brand strategy, branding, communication design, mobile app, UI, web development"],
    cover: { img: cs("2025/07/Assetto-Cromaticstudios-5.jpg") },
    og: cs("2025/07/Assetto-Cromaticstudios-5.jpg"),
    hero: { img: cs("2025/07/Assetto-Cromaticstudios-5.jpg"), alt: "The Assetto mark glowing lime on dark green" },
    problem: {
      h: "Rebuilding real estate on the blockchain",
      p: [
        "Blockchain-based startup Assetto came to us aiming to <strong>revolutionise the European real estate market</strong>.",
        "It needed a strategy that matched the goal, a look <strong>as bold as the idea</strong>, and a product to prove it."
      ],
      media: [{ img: cs("2025/07/Assetto-Cromaticstudios-4.jpg"), alt: "A figure on a rock against a lime sky", cap: "The visual universe: lime, dark green and a sense of altitude." }]
    },
    solution: {
      h: "Edgy by design",
      p: "We established a brand strategy that matched Assetto's goals, an edgy visual universe, a stunning landing page and a top-notch app UI.",
      stat: "Brand + app",
      statText: "strategy, identity, landing page and mobile app UI"
    },
    chapters: [
      {
        pillar: "brand",
        text: "A geometric mark and a wide, spaced wordmark in electric lime on deep green and black, carried onto print and event materials.",
        deliverables: ["Brand strategy", "Visual identity", "Communication design", "Print", "Event materials"],
        media: [
          { row: [{ img: cs("2025/07/Assetto-Cromaticstudios-6.jpg"), alt: "A dark green brochure with lime type" }, { img: cs("2025/07/Assetto-Cromaticstudios-1.jpg"), alt: "Two Assetto roll-up banners" }], cap: "Print and roll-ups" }
        ]
      },
      {
        pillar: "product",
        text: "A landing page and a mobile app that make investing in real estate feel as simple as checking a balance.",
        deliverables: ["Landing page", "Mobile app UI", "Web development"],
        media: [
          { img: cs("2025/07/Assetto-Cromaticstudios-8-e1759392893806.jpg"), alt: "The Assetto app on two phones on a plinth", cap: "The mobile app, in the same lime and black" }
        ]
      }
    ],
    result: {
      text: "A startup with a strategy, a visual universe and a product ready to take on European real estate."
    },
    related: ["investimental", "bepco", "routine-paris"]
  },

  // ------------------------------------------------------------------ Clinica Sante
  {
    slug: "clinica-sante",
    name: "Clinica Sante",
    tagline: "TV ads: recommended by doctors, stamped by patients.",
    desc: "Clinica Sante: TV ads for a Romanian network of medical laboratories. By Cromatic Studios, Bucharest.",
    title: "Recommended by doctors, stamped by patients.",
    accent: { bg: "#8EC9E8", ink: "#0f5f8f" },
    info: ["Healthcare, medical laboratories", "TV ads"],
    film: { id: "vGNSZ_aUd8w", title: "Clinica Sante: Recomandată de medici, parafată de pacienți" },
    cover: { img: "cs:2025/06/Clinica-Sante.jpg" },
    og: "https://i.ytimg.com/vi/vGNSZ_aUd8w/maxresdefault.jpg",
    problem: {
      h: "Who tests the people who run the tests?",
      p: [
        "The spot opens with that question, and answers it: Clinica Sante's results are <strong>the basis of informed medical decisions</strong>, so they have to be precise.",
        "In under a minute it puts forward what the laboratories stand for: <strong>precision and up-to-date technology</strong>, <strong>more than 30 years of experience</strong>, fair prices and <strong>national coverage</strong>, close to the patient."
      ],
      quote: { text: "Because health is not an option. It's a commitment.", cite: "Clinica Sante" }
    },
    solution: {
      h: "A line to remember",
      p: "“Recomandată de medici, parafată de pacienți”: recommended by doctors, stamped by patients. A line that borrows the doctor's stamp, the parafă, and gives it to the people who trust the lab.",
      stat: "50 seconds",
      statText: "from the opening question to the closing line"
    },
    result: {
      text: "A spot that gives a national network of laboratories a line people can repeat: recommended by doctors, stamped by patients."
    },
    related: ["elithia", "help-4-brain", "altius"]
  }
];
