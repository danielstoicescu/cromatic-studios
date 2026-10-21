// TASK-076, second half (Mira): more Zdrovit brands' product sites, one case page per brand, on the recipe of the
// Aspasia pilot (site/cases/src/specs270-zdrovit-web.mjs, Ina): Prevomit, Slaboficat, Supramax, Vizik, Vizimel,
// OchiSan; and the Lacalut website chapter (LACALUT_WEB, added to the Lacalut page in specs260-zdrovit.mjs).
// Daniel, 21 Oct: every Zdrovit brand's official product site is Cromatic's work; the pages show those sites only.
// Rules for every page here: built from Mira's captures (~/cromatic-ops/refs/zdrovit-pages/shots/), the site's own
// words and figures quoted as they appear, never restated as facts; no year, no results, no campaign facts; no link
// out to the brand's site (no "Visit" button, no href on the device frames); no portfolio card (PROJECTS, hubs):
// the Zdrovit card links the pages by slug. Each page keeps the TV spot slot (SPOTS_B, null until Daniel sends a
// full production). Vizimel: its medical presentation is never shown.
// The mockups: design/zdrovit-mockups/brands/<slug>.json, then node design/zdrovit-mockups/mock.mjs <slug>.
const m = (p) => "m:" + p;

// the helpers, as in specs270 (not exported there): the mockup names are the ones in brands/<slug>.json
const shot = (slug, name, alt, cap) => ({ img: m(`${slug}/${name}`), alt, ...(cap ? { cap } : {}) });
// the page's own scrolling device frames (gen.mjs "site" block), with no href: no link out to the brand's site
const siteBlock = (slug, label, { alt, altPhone, head = ["The", "landing page"], cap, name = "site-scroll" } = {}) => ({
  site: {
    label,
    d: { img: m(`${slug}/${name}`), scroll: true, alt: alt || `The ${label} page, scrolling` },
    m: { img: m(`${slug}/${name}-phone`), scroll: true, alt: altPhone || `The ${label} page on a phone, scrolling` }
  },
  head, ...(cap ? { cap } : {})
});

// The TV spot slot, as in specs270 (Daniel, 21 Oct: only full productions, no cuts or adaptations; he sends the
// files). An entry stays null until its spot is in site/media/<slug>/; then the page gets an "On TV" chapter after
// the web chapters. To fill one: { "spot": { "kind": "film", "src": "<the MP4>", "at": <poster second> } } in
// brands/<slug>.json, node mock.mjs <slug> spot, then e.g.
//   prevomit: { r: 1.778, seconds: 25, text: "<what the spot shows>", alt: "<the spot, in one line>", cap: "<a caption>" }
// and the new strings' Romanian in site/i18n/ro.json (the build lists them in ro.missing.json).
export const SPOTS_B = { prevomit: null, slaboficat: null, supramax: null, vizik: null, vizimel: null, ochisan: null };
const spotChapter = (slug) => {
  const s = SPOTS_B[slug];
  if (!s) return [];
  return [{
    pillar: "video",
    pills: s.pills || ["On", "TV"],
    text: s.text,
    deliverables: s.deliverables || ["TV spot", ...(s.seconds ? [`${s.seconds} seconds`] : [])],
    media: [{ video: m(`${slug}/${s.file || "spot"}`), poster: m(`${slug}/${s.file || "spot"}-poster`), r: s.r || 1.778, manual: true, alt: s.alt, ...(s.cap ? { cap: s.cap } : {}) }]
  }];
};
const RELATED = ["litorsal", "lacalut", "maximag"]; // (the shared ending replaces the rail; gen.mjs still asks for one)

export const PREVOMIT = {
  slug: "prevomit",
  name: "Prevomit",
  tagline: "prevomit.ro: a road for children who get car-sick, a calmer page for grown-ups, and a door to each.",
  desc: "Prevomit: prevomit.ro, a product site with a road-map page for children who get car-sick and a page for adults, on desktop and phone. By Cromatic Studios, Bucharest.",
  title: "Travel without worry.",
  accent: { bg: "#8FC23F", fg: "#10293d", ink: "#3f7a12" },
  info: ["Motion sickness supplements, Prevomit", "Romania · Zdrovit portfolio", "Product site, desktop and mobile"],
  cover: { img: m("prevomit/hero") },
  og: m("prevomit/hero"),
  hero: { img: m("prevomit/hero"), alt: "prevomit.ro/kids in a browser window and on a phone: a yellow car on a winding road, the line Călătorește fără griji! and a box of Prevomit Kids lollipops on green" },
  problem: {
    h: "Two kinds of nausea",
    p: [
      "Prevomit is a range of food supplements from Zdrovit, built around ginger extract. The site says what it is for in its own words: products that “ajută împotriva stărilor de greață și a vărsăturilor și reduc disconfortul cauzat de răul de mișcare și altitudine”.",
      "The range speaks to <strong>two</strong> audiences. Children who get car-sick, with lollipops, gummies and tablets for different ages. And adults: motion sickness on the road, and morning sickness in pregnancy.",
      "A parent packing for a long drive and a pregnant woman at breakfast are not reading the same page. prevomit.ro gives each of them one."
    ]
  },
  solution: {
    h: "A chooser, then a road",
    p: "The home page is a single screen split in two: adults on the left in green, children on the right in blue, each half with its own photo and its own boxes. The children's page is a road that winds from the first screen to the footer, with a yellow car at the top. The adults' page drops the road and keeps the product's green and orange.",
    stat: "8",
    statText: "car games on the children's page, one card each, from “10 întrebări” to “Cuvintele”"
  },
  chapters: [
    {
      pillar: "product",
      pills: ["The", "road"],
      text: "The children's page is drawn as a road. A yellow car sets off under “Călătorește fără griji!” beside a box of Prevomit Kids lollipops, and the road carries you past everything below. Răul de mișcare explains what motion sickness is and who gets it. Eight illustrated tiles name the symptoms, from Greață to Anxietate. A list of tips for prevention ends with a boy asleep on a neck pillow. Then the games for the car, the three products for children, and a closing band where a car and a bus meet at the order button.",
      deliverables: ["Product site", "Illustration", "UX/UI design", "Desktop and mobile"],
      media: [
        siteBlock("prevomit", "prevomit.ro", { alt: "The prevomit.ro/kids page, scrolling: the road from the yellow car at the top to a car and a bus at the bottom", altPhone: "The prevomit.ro/kids page on a phone, scrolling", head: ["The", "children's page"], cap: "prevomit.ro/kids from the first screen to the footer, on desktop and phone." }),
        {
          rail: ["Along the", "road"],
          items: [
            shot("prevomit", "kids-symptoms", "Simptome: eight illustrated tiles, Stare generală de rău, Vărsături, Greață, Paloare, Roșeață, Transpirație, Amețeală and Anxietate, on green beside the road"),
            shot("prevomit", "kids-games", "Jocuri: eight coloured cards with a game for the car on each, from 10 întrebări to Cuvintele, a monkey, a radio and a duck among them"),
            shot("prevomit", "kids-packs", "The Prevomit block on light blue: a paragraph on ginger extract, then Prevomit Kids with two lollipop boxes on the road and four lines with icons")
          ],
          cap: "The symptoms, the games for the car and the products"
        }
      ]
    },
    {
      pillar: "product",
      pills: ["Two", "doors"],
      text: "prevomit.ro opens on one screen with two doors. On the left, green, a pregnant woman and the Prevomit Adulți box. On the right, blue, a girl in a car seat and the children's range: Kids lollipops, Junior tablets and a jar of gummies. Behind the adults' door the page is quieter: “Bucură-te de orice drum fără grețuri!” over a woman resting on a sofa, four round portraits of travellers, one by a plane window, one in a diving mask, a section on morning sickness, and an orange band of three icons for what the product is for.",
      deliverables: ["Home page", "Adults' page", "Icon band", "Ingredients"],
      media: [
        shot("prevomit", "chooser", "The prevomit.ro home page: the Prevomit logo on navy, a pregnant woman on green on the left with the Prevomit Adulți box, a girl in a car seat on blue on the right with the Kids, Junior and gummy packs, and an orange band across both", "The home page: adults on the left, children on the right"),
        {
          rail: ["The adults'", "page"],
          items: [
            shot("prevomit", "adults-hero", "The adults' page hero: a woman resting on a white sofa, the Prevomit logo, the line Bucură-te de orice drum fără grețuri!, the Prevomit Adulți box and an orange Comandă acum button"),
            shot("prevomit", "adults-morning", "Grețurile matinale: a pregnant woman with a hand over her mouth, sitting on a bed, and the section's text on white"),
            shot("prevomit", "adults-icons", "The orange band: three white rings with line icons, a pregnant woman, the intestines and a car, over Grețuri în timpul sarcinii, Disconfort digestiv and Rău de mișcare")
          ],
          cap: "The hero, morning sickness and the three uses, in the box's green and orange"
        }
      ]
    },
    {
      pillar: "product",
      pills: ["On a", "phone"],
      text: "On a phone both pages fold into one column. The road shrinks to one bend under the first screen, the symptom tiles stack two by two, and the game cards line up one under another. The adults' page keeps its photo, its line and the orange “Comandă acum” button on the first screen.",
      deliverables: ["Mobile layout", "One column"],
      media: [
        {
          rail: ["Four", "screens"],
          items: [
            shot("prevomit", "phone-kids", "The children's page on a phone: Călătorește fără griji! on green, a box of Prevomit Kids lollipops and a bend of the road"),
            shot("prevomit", "phone-symptoms", "Simptome on a phone: the illustrated tiles two by two"),
            shot("prevomit", "phone-games", "Jocuri on a phone: the game cards one under another, 10 întrebări first"),
            shot("prevomit", "phone-adults", "The adults' page on a phone: the woman on the sofa, the line, the orange Comandă acum button and the Prevomit Adulți box")
          ],
          cap: "The road, the symptoms, the games and the adults' page, at 390 px wide"
        }
      ]
    },
    ...spotChapter("prevomit")
  ],
  result: {
    text: "Two audiences, two pages: a road for the children's trip, a quieter page for the grown-ups."
  },
  related: RELATED
};

export const SLABOFICAT = {
  slug: "slaboficat",
  name: "Slaboficat",
  tagline: "slaboficat.ro: a one-page product site for a liver supplement that starts with the liver itself, glowing.",
  desc: "Slaboficat Slim: slaboficat.ro, the one-page product site for a liver supplement, on desktop and phone. By Cromatic Studios, Bucharest.",
  title: "The liver, lit up.",
  accent: { bg: "#6A4FD0", fg: "#ffffff", ink: "#2c10a3" },
  info: ["Liver supplement, Slaboficat Slim", "Romania · Zdrovit portfolio", "Landing page, desktop and mobile"],
  cover: { img: m("slaboficat/hero") },
  og: m("slaboficat/hero"),
  hero: { img: m("slaboficat/hero"), alt: "slaboficat.ro in a browser window and on a phone: a glowing orange liver inside a blue body, the Slaboficat Slim box and three lines on a violet band" },
  problem: {
    h: "Two subjects, one box",
    p: [
      "Slaboficat Slim is a food supplement from Zdrovit, in capsules. The site puts its case as a question: “Vrei să ai grijă de ficat și în același timp să menții o greutate optimă a corpului?”",
      "That is two subjects in one box. The <strong>liver</strong>, which you never see, and your figure, which you see every day.",
      "The page has to show the first one before it can talk about the second."
    ]
  },
  solution: {
    h: "Start with the organ",
    p: "The page opens on the liver itself, glowing orange inside a blue body, with the box beside it and three lines on a violet band. Then it explains what the liver does, brings in the Slim formula, lists the ingredients one by one and ends with tips for the liver and the figure. Violet runs through all of it, from the menu to the order button.",
    stat: "10",
    statText: "tips for the liver and the figure, in one list beside a strip of photos, from a lemon to a tape measure"
  },
  chapters: [
    {
      pillar: "product",
      pills: ["One", "page"],
      text: "The menu runs Funcțiile ficatului, SLABOFICAT Slim, Sfaturi, Media, Comandă, Contact. The hero puts the glowing liver on the left and the box on the right, over a violet band with three lines, from “Ajută la regenerarea hepatică” to “Susține sănătatea ficatului”, and an “Află mai multe >>” link. A sentence in bold violet follows, “Ficatul este unul dintre cele mai mari organe din corp…”. Below come the liver's functions, the Slim formula, the ingredients, how to take it, the tips and the order button, above the Zdrovit address.",
      deliverables: ["Landing page", "UX/UI design", "Desktop and mobile", "Navigation"],
      media: [
        siteBlock("slaboficat", "slaboficat.ro", { cap: "slaboficat.ro from the first screen to the footer, on desktop and phone." }),
        shot("slaboficat", "tips", "Sfaturi pentru ficat și siluetă!: ten tips in a list with violet bullets, beside a strip of photos of a lemon, a pepper, carrots, a tomato and a tape measure", "Ten tips for the liver and the figure")
      ]
    },
    {
      pillar: "product",
      pills: ["The", "liver"],
      text: "The product story, the way the site tells it. Three of the liver's functions get a heading each: stocare, secretorie și excretorie, metabolică. Beside them a violet panel draws the liver in a ring, with six lines out to what it does, from Sinteza aminoacizilor to Neutralizarea toxinelor. Then the turn to the figure: SLABOFICAT Slim, a woman with a tape measure round her waist, the box at her side and the site's question. The ingredients follow one per row, each with its picture: Fructele de Armurariu, Colina, Curcuma longa, Piper-negru and Cromul. A violet band gives the dose and the pack in the site's words, “Adulți: 1-2 capsule pe zi, înainte de masă” and “30 capsule”.",
      deliverables: ["Product story", "Infographic", "Ingredients", "Usage"],
      media: [
        shot("slaboficat", "functions", "The liver's functions: Funcția de stocare, Funcția secretorie și excretorie and Funcția metabolică in violet headings, beside a violet panel with the liver in a ring and six functions around it", "Three functions in words, six in a drawing"),
        shot("slaboficat", "slim", "SLABOFICAT Slim: a woman in white with a tape measure round her waist, two Slaboficat Slim boxes in front of her, and the product text on the right", "The turn to the figure: SLABOFICAT Slim"),
        shot("slaboficat", "ingredients", "Ingrediente: Fructele de Armurariu with a thistle flower, Colina with its molecule, Curcuma longa and Piper-negru with their pictures, one row each", "The ingredients, one row and one picture each")
      ]
    },
    {
      pillar: "product",
      pills: ["On a", "phone"],
      text: "On a phone the logo moves to the centre with the menu icon under it, and the three lines sit under the liver, above “Află mai multe >>”. The violet panel of functions fills the width. Each ingredient gets a block of its own, picture first, and the tips keep their photos, faded behind the text.",
      deliverables: ["Mobile layout", "One column"],
      media: [
        {
          rail: ["Four", "screens"],
          items: [
            shot("slaboficat", "phone-hero", "The first screen on a phone: the Slaboficat Slim logo, the menu icon, the liver and three lines on violet, Află mai multe and the sentence about the liver"),
            shot("slaboficat", "phone-functions", "The violet panel of the liver's functions on a phone, and SLABOFICAT Slim below it"),
            shot("slaboficat", "phone-ingredients", "Ingrediente on a phone: Fructele de Armurariu with a thistle flower and its paragraph, then Colina"),
            shot("slaboficat", "phone-tips", "Sfaturi pentru ficat și siluetă! on a phone, the tips over faded photos of fruit and vegetables")
          ],
          cap: "The liver, its functions, the ingredients and the tips, at 390 px wide"
        }
      ]
    },
    ...spotChapter("slaboficat")
  ],
  result: {
    text: "The organ first, then the box: a liver supplement's page, violet from the menu to the order button."
  },
  related: RELATED
};

// every Zdrovit brand page of the second half, in the order they were made
export const ZDROVIT_WEB_B = [PREVOMIT, SLABOFICAT];
