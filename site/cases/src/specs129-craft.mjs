// r129: Craft Coffee, rebuilt. Replaces the "craft-coffee" entry in specs.mjs.
// Facts come from craftcoffee.ro (home, /despre-noi/, /servicii/, /branduri/, /branduri/la-marzocco/,
// /branduri/fellow/, /produse/linea-micra/, product pages) and from the earlier spec; nothing beyond them.
// Event photos: the "craft coffee la coffeeast" album (Craft Coffee stand at Coffeeast).
const m = (p) => "m:craft-coffee/" + p;
const p = (img, alt, cap) => ({ img: m(img), alt, ...(cap ? { cap } : {}) });

export const CRAFT = {
  slug: "craft-coffee",
  name: "Craft Coffee",
  tagline: "A brand and a webshop for the official La Marzocco distributor in Romania.",
  desc: "Craft Coffee: brand identity, packaging, uniforms, merch and the craftcoffee.ro webshop for the official La Marzocco, Mazzer, PuQPress and Fellow distributor in Romania. By Cromatic Studios, Bucharest.",
  title: "Equipping the passion for coffee.",
  accent: { bg: "#5AA9F0", ink: "#1f64a8" },
  info: [
    "Coffee equipment: distribution, installation and service",
    "Str. Brațului 7, Bucharest",
    "Brand identity, badge system, packaging, uniforms, merch, e-commerce website, event photography"
  ],
  cover: { img: m("event-31") },
  og: m("event-31"),
  hero: [
    { img: m("event-82"), alt: "A La Marzocco espresso machine on a plinth with the Craft Coffee logo" },
    { img: m("event-100"), alt: "A Craft Coffee team member at the stand, under the round Craft Coffee badge" }
  ],
  problem: {
    h: "Professional machines, sold by phone",
    p: [
      "Craft Coffee distributes and services <strong>professional espresso and brew equipment</strong>, chosen only from the most respected brands in the world. It is the <strong>official distributor of La Marzocco, Mazzer, PuQPress and Fellow in Romania</strong>, and also brings in Sinoova, Mahlkönig, Anfim and BWT.",
      "It was born in 2023 out of a passion for La Marzocco machines, and is run by the team behind Steam Coffee Shop. It sold <strong>through phone calls and visits alone</strong>, with <strong>no shop of its own online</strong>."
    ],
    media: [{ row: [p("linea", "A La Marzocco machine on a café counter"), p("bar", "A bright specialty coffee bar")], cap: "The equipment Craft Coffee sells, installs and maintains, at home behind the bar." }],
    quote: { text: "At Craft Coffee, we equip the passion for coffee.", cite: "Craft Coffee, on its website" }
  },
  solution: {
    h: "The finest equipment, stamped",
    p: "A badge built like a seal of approval, a red and blue system for a company that both sells and services, and a webshop that shows a multi-group espresso machine and a cupping spoon with the same care.",
    stat: "20+",
    statText: "locations equipped by Craft Coffee in recent years"
  },
  chapters: [
    // ---------------------------------------------------------------- brand
    {
      pillar: "brand",
      text: "A circular badge with the wordmark cut across the middle and “The finest equipment” around it: it reads as a seal on a box, embroidered on a patch or pressed onto a pin. Red and blue split the system into two tempers.",
      deliverables: ["Logo", "Badge system", "Colour system", "Stationery", "Packaging", "Uniforms", "Merch"],
      media: [
        { row: [{ img: m("patch"), alt: "Embroidered Craft Coffee patch: The finest equipment" }, { img: m("logo"), alt: "The Craft Coffee wordmark in blue", contain: true, bg: "#f8f5f0" }], cap: "The badge and the wordmark" },
        { statement: "The finest equipment.", sub: "Written around the badge, on every box, uniform and plinth.", bg: "#1f64a8", fg: "#ffffff" },
        { row: [{ img: m("box"), alt: "Shipping box: Your coffee equipment is here", contain: true, bg: "#ffffff" }, { img: m("tag"), alt: "Craft Coffee service tag", contain: true, bg: "#f8f5f0" }], cap: "“Your coffee equipment is here.” Before the machine is unpacked, the box already sounds like the brand." },
        { row: [{ img: m("uniform"), alt: "Grey technician overalls with the Craft Coffee badge", contain: true, bg: "#ffffff" }, { img: m("bag"), alt: "Backpack with the Craft Coffee patch", contain: true, bg: "#ffffff" }], cap: "Uniforms and bags for the technicians: the part of the brand that actually shows up at your bar" }
      ]
    },

    // ---------------------------------------------------------------- the webshop
    {
      pillar: "product",
      pills: ["The", "webshop"],
      text: "craftcoffee.ro is a WooCommerce shop with an editorial skin: warm paper backgrounds, product shots on one beige, an italic serif for names and a headline that draws itself in. It sells accessories straight to the cart and takes quote requests for the machines.",
      deliverables: ["UX/UI design", "E-commerce website", "Homepage", "Navigation", "Product cards", "Cart"],
      media: [
        { site: { label: "craftcoffee.ro", href: "https://craftcoffee.ro/", d: { img: m("home-scroll-d"), scroll: true, alt: "The craftcoffee.ro homepage, scrolling" }, m: { img: m("home-scroll-m"), scroll: true, alt: "The craftcoffee.ro homepage on a phone, scrolling" } }, head: ["The", "homepage"], cap: "The homepage: the headline, a Linea Mini card with its colour dots, the best sellers, then one section per partner brand." },
        { img: m("ui-hero"), alt: "Homepage hero: THE finest COFFEE EQUIPMENT, with a red brush mark behind finest", cap: "“The finest coffee equipment”: an animated headline, with a red brush mark behind the one word that matters" },
        { img: m("ui-bestsellers"), alt: "Best sellers grid: La Marzocco GB5 S, Strada X, Mazzer Kony G, PuQ Press Pro, Fellow Aiden", cap: "Best sellers in a bento grid, with colour and finish swatches right on the card" },
        { row: [p("ui-menu", "The open menu: Home, Equipment, Shop, About, Services, Contact, with the Bucharest showroom"), p("ui-cart", "The cart pop-up with a Fellow Tally Pro scale and a La Marzocco enamel mug")], cap: "A menu that drops down with the showroom address and phone, and a cart that opens over the page instead of leaving it" },
        { row: [p("ph-home", "The homepage hero on a phone"), p("ph-micra", "The Linea Micra product page on a phone"), p("ph-lm", "The La Marzocco brand page on a phone")], cap: "The same shop on the phone" }
      ]
    },

    // ---------------------------------------------------------------- catalogue and product pages
    {
      pillar: "product",
      pills: ["Catalogue", "&amp; product"],
      text: "More than 60 products, from the KB90 to a pack of paper filters. The equipment page sorts them into espresso machines, grinders, tampers, milk frothers and brewers. Product pages lead with the gallery, then specs, then a quote form for the machines.",
      deliverables: ["Category pages", "Filters", "Product pages", "Quote requests", "Services page"],
      media: [
        { img: m("ui-equipment"), alt: "The equipment page: espresso machines in a bento grid of beige cards", cap: "“Descoperă echipamentele”: every espresso machine on one page, in a grid that changes rhythm row by row" },
        { img: m("ui-shop"), alt: "The shop page with category filter pills and product cards", cap: "The shop: filter pills with counts, and cards that keep the price, the category and the colours in view" },
        { site: { label: "La Marzocco Linea Micra", href: "https://craftcoffee.ro/produse/linea-micra/", d: { img: m("micra-scroll-d"), scroll: true, alt: "The Linea Micra product page, scrolling" }, m: { img: m("micra-scroll-m"), scroll: true, alt: "The Linea Micra product page on a phone, scrolling" } }, head: ["Product", "page"], cap: "Linea Micra: the gallery, a colour picker, the full spec table and a quote request instead of a cart button." },
        { row: [p("ui-product", "Linea Micra: gallery, colour options and specifications"), p("ui-features", "Linea Micra features in outlined tiles, and related machines")], cap: "Specs in a table, features in tiles: dual boilers, dual PID, a 0.25 l coffee boiler and a 1.6 l steam boiler" },
        { row: [p("ui-aiden", "The Fellow Aiden product page with price, colours and delivery terms"), p("ui-services", "The services page: consultancy, installation, support and financing")], cap: "Products with a price go straight to the cart, with delivery in 24 to 48 hours. The services page explains the rest: consultancy, bench testing before delivery, installation, maintenance and financing." }
      ]
    },

    // ---------------------------------------------------------------- La Marzocco
    {
      pillar: "product",
      pills: ["La", "Marzocco"],
      text: "Craft Coffee started with La Marzocco. The brand page tells its story, founded in Florence in 1927, every machine assembled by hand in Italy, then lays out the whole range, from the Linea Micra for the kitchen to the KB90.",
      deliverables: ["Brand page", "Espresso machines", "Grinders", "Merch"],
      media: [
        { statement: "Florence, 1927.", sub: "Founded by the brothers Giuseppe and Bruno Bambi. Every machine is still assembled by hand in Italy.", bg: "#1f64a8", fg: "#ffffff" },
        {
          rail: ["La", "Marzocco"],
          items: [
            p("lm-micra", "La Marzocco Linea Micra", "Linea Micra"),
            p("lm-mini", "La Marzocco Linea Mini", "Linea Mini"),
            p("lm-gs3", "La Marzocco GS3", "GS3"),
            p("lm-classic", "La Marzocco Linea Classic S", "Linea Classic S"),
            p("lm-gb5s", "La Marzocco GB5 S", "GB5 S"),
            p("lm-stradax", "La Marzocco Strada X", "Strada X"),
            p("lm-kb90", "La Marzocco KB90", "KB90"),
            p("lm-swan", "La Marzocco Swan grinder", "Swan grinder"),
            p("lm-jay", "La Marzocco Jay grinder", "Jay grinder")
          ],
          cap: "The La Marzocco range on craftcoffee.ro, shot on the shop's beige"
        },
        { site: { label: "La Marzocco on craftcoffee.ro", href: "https://craftcoffee.ro/branduri/la-marzocco/", d: { img: m("lm-scroll-d"), scroll: true, alt: "The La Marzocco brand page, scrolling" }, m: { img: m("lm-scroll-m"), scroll: true, alt: "The La Marzocco brand page on a phone, scrolling" } }, head: ["Brand", "page"], cap: "The brand page: the story, then espresso machines, grinders and merch." },
        { img: m("ui-brand-lm"), alt: "Homepage section: La Marzocco, world leader in professional espresso machines", cap: "On the homepage, each partner brand gets a chapter of its own" }
      ]
    },

    // ---------------------------------------------------------------- Fellow, Mazzer, PuQPress
    {
      pillar: "product",
      pills: ["Home", "&amp; brew"],
      text: "Fellow brings the other half of the catalogue: kettles, grinders, scales and brewers for home and pour-over. Craft Coffee carries it alongside Mazzer grinders, made in Italy since 1948, and PuQPress, the first automatic coffee tamper in the world.",
      deliverables: ["Brand pages", "Product catalogue", "Variant swatches"],
      media: [
        { statement: "San Francisco, 2013.", sub: "Fellow started as a student project. The Stagg EKG kettle, the Ode grinder and the Atmos canister followed.", bg: "#121212", fg: "#ffffff" },
        {
          rail: ["Fellow"],
          items: [
            p("fellow-aiden", "Fellow Aiden coffee maker", "Aiden coffee maker"),
            p("fellow-stagg", "Fellow Stagg EKG Pro kettle", "Stagg EKG Pro"),
            p("fellow-corvo", "Fellow Corvo EKG kettle", "Corvo EKG"),
            p("fellow-ode", "Fellow Ode Gen 2 grinder", "Ode Gen 2"),
            p("fellow-tally", "Fellow Tally Pro scale", "Tally Pro"),
            p("fellow-staggxf", "Fellow Stagg [XF] pour-over set", "Stagg [XF] pour-over"),
            p("fellow-atmos", "Fellow Atmos vacuum canister", "Atmos canister"),
            p("fellow-server", "Fellow glass server", "Glass server"),
            p("fellow-pirch", "Fellow Pirch glasses", "Pirch glasses")
          ],
          cap: "Fellow on craftcoffee.ro: Craft Coffee is its exclusive partner in Romania"
        },
        { img: m("ui-brand-fellow"), alt: "Homepage section: Fellow, design and performance for home and brew", cap: "“Design and performance for home and brew”: the Fellow chapter on the homepage" },
        { row: [p("mazzer-kony", "Mazzer Kony G grinder", "Mazzer Kony G"), p("mazzer-philos", "Mazzer Philos grinder, Laguna Blu limited edition", "Mazzer Philos, Laguna Blu"), p("puq-m5", "PuQPress M5 automatic tamper", "PuQPress M5"), p("puq-nav", "PuQ Prep Navigator distributor", "PuQ Prep Navigator")], cap: "Mazzer grinders and PuQPress tampers complete the bar" }
      ]
    },

    // ---------------------------------------------------------------- Coffeeast
    {
      pillar: "video",
      pills: ["At", "Coffeeast"],
      text: "The Craft Coffee stand at Coffeeast: La Marzocco machines on plinths stamped with the logo, a Fellow brew bar and the team pulling shots for visitors under the badge.",
      deliverables: ["The brand, on the stand"],
      media: [
        { row: [p("event-84", "A La Marzocco machine and grinder on a dark plinth with the red Craft Coffee badge"), p("event-81", "A La Marzocco machine and grinder at the stand"), p("event-09", "A team member next to a La Marzocco machine")], cap: "La Marzocco machines on Craft Coffee plinths" },
        { row: [p("event-27", "An espresso shot running into a cup"), p("event-31", "A cup set on the drip tray")], cap: "Shots for visitors, all day" },
        { row: [p("event-12", "A team member at the brew bar"), p("event-54", "Two team members brewing coffee")], cap: "The team behind the bar" },
        { row: [p("event-62", "A glass carafe of filter coffee on a Fellow scale"), p("event-72", "A hand setting a Fellow scale"), p("event-74", "A Fellow grinder under the Craft Coffee badge")], cap: "The Fellow brew bar" },
        { row: [p("event-97", "The team with visitors, under the Craft Coffee badge"), p("event-92", "A visitor and a team member in front of the Craft Coffee badge")], cap: "Visitors at the stand, under the badge" }
      ]
    }
  ],
  result: {
    text: "Craft Coffee now has a brand that shows up the same way on a box, a uniform and a plinth, and a shop of its own: accessories go straight to the cart, machines go to a quote request, and every partner brand has a page."
  },
  link: { href: "https://craftcoffee.ro/", label: "Visit craftcoffee.ro" },
  related: ["artisan-coffee-gear", "sip-coffee-wine", "kompus"]
};
