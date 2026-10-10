// r129: Unchain Festival, rebuilt as a use case around its main deliverable, unchainfestival.com.
// Facts come from the live site (home, /festival, /agenda, /delegates, /startups, /travel, /partners, /tickets,
// captured October 2026) and from the brand strategy deck already used in specs128.mjs.
const m = (p) => "m:unchain-festival/" + p;

export const UNCHAIN = {
  slug: "unchain-festival",
  name: "Unchain Festival",
  tagline: "The summer festival for CEE fintech, inside a medieval fortress.",
  desc: "Unchain Festival: brand strategy, visual identity and the unchainfestival.com website for the summer festival of CEE fintech at Oradea Fortress. Agenda, speakers, delegates, tickets, travel and partners, on desktop and phone. By Cromatic Studios.",
  title: "A fortress for CEE fintech, built for the web.",
  accent: { bg: "#0C001E", fg: "#ffffff", ink: "#7B2CBF" },
  info: ["Fintech festival", "Oradea Fortress, Romania", "Brand strategy, visual identity, website UI and UX"],
  cover: { img: m("live-hero") },
  og: m("live-hero"),
  hero: { img: m("live-hero"), fixed: false, alt: "The unchainfestival.com first fold: The Summer Festival for CEE Fintech, 17–18 June 2026, Oradea Fortress, framed by neon fortress towers" },
  problem: {
    h: "Finance, unchained",
    p: [
      "Unchain brings <strong>regulators, bankers, tech companies, startups and investors</strong> to Oradea, near the border between Romania and Hungary, for two days on the grounds of a medieval fortress.",
      "The festival needed a brand and a website that could do two jobs at once. Sell a serious, senior event to <strong>central banks, banks and fintechs</strong>. And make it feel like a festival: friendly, relaxed and a little magical.",
      "The website carries most of the work. It has to explain the event, show the people on stage, sell passes, bring partners in and get delegates from 40+ countries to Oradea."
    ],
    media: [{ row: [{ img: m("core"), alt: "Unchain's core: culture, clients, voice, feeling, impact, X factor" }, { img: m("archetype"), alt: "Unchain's archetype: creator and magician" }], cap: "From the strategy: the core and the archetype" }],
    quote: { text: "Unchain the Davos of CEE fintech!", cite: "Unchain's motto" }
  },
  solution: {
    h: "The red thread",
    p: "One continuous line runs into the UNCHAIN logo and, as you scroll, builds a fortress. It never breaks. On the website the line draws neon towers around the first fold and banner frames around every heading, so each page reads as part of the same fortress.",
    stat: "60 / 40",
    statText: "Creator and Magician, the archetype mix behind the brand"
  },
  chapters: [
    {
      pillar: "product",
      pills: ["The", "website"],
      text: "unchainfestival.com is the festival's front door. The homepage tells the whole story in one scroll: an aftermovie in a fortress frame, who comes, the topics, the speakers, the passes, the latest reports and the FAQ. A Tickets button and the menu stay pinned to the top on every page.",
      deliverables: ["Website UI", "Website UX", "Design system", "Responsive layouts"],
      media: [
        { site: { label: "unchainfestival.com", href: "https://unchainfestival.com/", d: { img: m("site-scroll"), scroll: true, alt: "The unchainfestival.com homepage, scrolling" }, m: { img: m("site-scroll-phone"), scroll: true, alt: "The unchainfestival.com homepage on a phone, scrolling" } }, head: ["The", "homepage"], cap: "The homepage, desktop and phone: The Summer Festival for CEE Fintech, 17–18 June 2026." },
        { img: m("menu"), alt: "The open menu: Home, Festival, Agenda, Delegates, Startups, Travel, Partners, Blog, next to a photo of the fortress gate", cap: "The menu opens over a photo of the fortress gate. Eight pages, plus three ways in: business delegations, partners and speakers." },
        { img: m("map"), alt: "A dark map of Central and Eastern Europe, green lines running from capitals to the Unchain mark in Oradea", cap: "From all over the world, right in the heart of CEE: routes from the region's capitals meet at the U in Oradea." }
      ]
    },
    {
      pillar: "product",
      pills: ["Agenda", "& speakers"],
      text: "The programme is the product. Eight topic tracks open as an accordion on the homepage. The agenda page lays out two days on four stages: Main, Focus, Ecosystem and Roundtables. Speakers sit in cut-corner cards with a flag and their institution, and flip to a short bio on hover.",
      deliverables: ["Agenda layout", "Topic tracks", "Speaker cards", "Speaker filters"],
      media: [
        { img: m("agenda-topics"), alt: "Future of Finance Agenda: Shaping the World of CEE FinTech, with Regulation and Compliance open and seven more tracks listed", cap: "Future of Finance Agenda: regulation, innovation transfers, digital banking, AI, insurtech, transactions, sustainability, digital assets." },
        { row: [{ img: m("agenda-day"), alt: "The agenda page: 17 June, four stage columns and a vertical timeline" }, { img: m("speaker-cards"), alt: "Speaker cards: Marek Belka, Michal Vodrazka flipped to his bio, Jakub Wieclaw, Zdenek Jaros" }], cap: "Two days, four stages, one timeline. On hover, a speaker card turns into a bio and a LinkedIn link." },
        { statement: "More than 130 speakers, filterable by regulation, banking, payments, insurtech, technology, investment and ecosystem.", sub: "From a former Prime Minister of Poland to the payments director of the Czech National Bank.", bg: "#0C001E", fg: "#64E724" }
      ]
    },
    {
      pillar: "product",
      pills: ["Delegates", "& partners"],
      text: "The site shows the room before you book it: 900+ business delegates, 500+ companies, 80% from fintech and financial services, 65% CEOs, founders and upper management. Visa leads the partner wall, followed by banking and gold partners, then sponsors, supporters and country pavilions.",
      deliverables: ["Stats modules", "Delegate breakdown", "Partner tiers", "Partner cards"],
      media: [
        { img: m("company"), alt: "In Good Company: presented by Visa, banking partners Raiffeisen Bank, BRD and Banca Transilvania, gold partners Leanpay, Monri and Payten, then the delegate numbers", cap: "In Good Company: the partners and the numbers, in one block." },
        { row: [{ img: m("delegates"), alt: "The delegates page: delegate numbers next to a donut chart split by industry" }, { img: m("partners"), alt: "The partners page: Visa as main partner, then Raiffeisen Bank, BRD and Banca Transilvania as banking partners, each in a card with a short description" }], cap: "The delegates page breaks the audience down by industry. The partners page gives every partner a card and a reason." },
        { img: m("startups"), alt: "The startups page: who is it for, with photos from the Innovation Stage and a large U-shaped tower", cap: "Startups get their own page: the Startup Tournament, the jurors and an application form." }
      ]
    },
    {
      pillar: "product",
      pills: ["Tickets", "& travel"],
      text: "Then the practical part. Three passes, each in its own fortress-shaped card. A fortress map of stages, expo and networking areas. And a travel page with a flight board of direct routes to Oradea, shuttle times from Budapest and Oradea airports, and partner hotels.",
      deliverables: ["Pass cards", "Ticketing flow", "Venue map", "Travel board"],
      media: [
        { img: m("tickets"), alt: "Get Tickets: a blue Business Pass card at 760 euro, a pink VIP Pass card at 1950 euro and a Startup Pass card below", cap: "Business, VIP and Startup passes, each with its own colour and the previous price struck through." },
        { row: [{ img: m("fortress-map"), alt: "The festival page: an isometric map of Oradea Fortress with pins for stages, expo and food areas" }, { img: m("travel"), alt: "The travel page: UNCHAIN Plane Routes, a LOT plane on the tarmac and a departures board" }], cap: "Explore the location, then plan the trip: the fortress map and the travel board." }
      ]
    },
    {
      pillar: "product",
      pills: ["On the", "phone"],
      text: "Every section has its own phone layout. The menu becomes a full-screen list, the speaker grid becomes a single column of cards, and the passes stack with the Buy now button in reach of a thumb.",
      deliverables: ["Mobile UI", "Mobile navigation"],
      media: [
        { row: [{ img: m("phone-hero"), alt: "The homepage on a phone: the aftermovie in a neon frame, then You've come to the right place" }, { img: m("menu-phone"), alt: "The full-screen menu on a phone" }, { img: m("phone-speakers"), alt: "A speaker card on a phone: Michal Vodrazka, Director of Payments, Czech National Bank" }, { img: m("phone-tickets"), alt: "Get Tickets on a phone: the Business Pass at 760 euro with a Buy now button" }], cap: "The homepage, the menu, a speaker card and a pass, on a phone." }
      ]
    },
    {
      pillar: "brand",
      text: "Behind the website sits the brand. We started from the core: an adventurous culture, clients who are creators of finance, a relaxed and confident voice. Then customer profiles drawn from real regulators, bankers, tech leaders and founders, and two creative directions, “Firul roșu” and “Unchained blocks”. The thread and the blocks became the logo, the fortress and the parts the website is built from.",
      deliverables: ["Brand strategy", "Brand attributes", "Archetype", "Customer profiles", "Creative directions", "Logo"],
      media: [
        { field: "#2A1238", fg: "#ffffff", items: [{ img: m("logo"), alt: "The UNCHAIN logo on dark purple, a red thread running through it" }], cap: "The logo: a thread that runs through the word" },
        { statement: "For two days, Oradea will be our fortress.", sub: "From the website copy.", bg: "#2A1238", fg: "#C77DFF" },
        { rail: ["The", "first", "designs"], items: [
          { img: m("site-hero"), alt: "First design: UNCHAIN, Oradea Fortress, the red thread entering the logo" },
          { img: m("fortress"), alt: "First design: a fortress of blocks, Oradea Fortress" },
          { img: m("speakers"), alt: "First design: speakers along the red thread" },
          { img: m("arches"), alt: "First design: three arched gates" },
          { img: m("become"), alt: "First design: become an unchainer, become a partner" }
        ], cap: "From the strategy deck: the thread, the blocks and the gates, before they went live" },
        { row: [{ img: m("blocks"), alt: "Building blocks: buttons, chain illustration, menus" }, { img: m("statement"), alt: "For two days Oradea will be our fortress" }], cap: "The building blocks: buttons, menus and frames cut like fortress stone" }
      ]
    }
  ],
  result: {
    text: "A fintech event with a brand as unexpected as its venue, and a website that does the selling: the programme, the people, the passes and the way to Oradea, on every screen.",
    media: [
      { statement: "900+ business delegates. 500+ companies. 40+ countries.", sub: "The numbers the homepage shows for Unchain, the summer festival for CEE fintech.", bg: "#A115FA", fg: "#ffffff" }
    ]
  },
  link: { href: "https://unchainfestival.com/", label: "Visit unchainfestival.com" },
  related: ["assetto", "investimental", "bepco"]
};
