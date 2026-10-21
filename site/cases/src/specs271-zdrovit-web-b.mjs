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

export const SUPRAMAX = {
  slug: "supramax",
  name: "Supramax",
  tagline: "supramax.ro: one product site for a whole joint-care range, from collagen sachets to a spray.",
  desc: "Supramax articulații: supramax.ro, the product site for a collagen range for joints, six products on one page, on desktop and phone. By Cromatic Studios, Bucharest.",
  title: "Mobility, made younger.",
  accent: { bg: "#F39A3D", fg: "#2b1606", ink: "#b8560a" },
  info: ["Joint supplements, Supramax articulații", "Romania · Zdrovit portfolio", "Product site, desktop and mobile"],
  cover: { img: m("supramax/hero") },
  og: m("supramax/hero"),
  hero: { img: m("supramax/hero"), alt: "supramax.ro in a browser window and on a phone: a white-haired woman stretching on a wooden deck, the line Întinerește-ți mobilitatea! and the orange Supramax articulații box with peach flavour" },
  problem: {
    h: "One brand, six formats",
    p: [
      "Supramax articulații is a Zdrovit range for joints, built around hydrolysed collagen. It comes as sachets in three versions, as vials you drink, as a gel and as a spray.",
      "Each one is taken or used in its own way, and each has its own list of ingredients. One site has to explain all six without burying any of them.",
      "Before any of the boxes, it has to explain the word printed on most of them: <strong>colagen</strong>."
    ]
  },
  solution: {
    h: "Orange on white, and people moving",
    p: "The page runs in the box's orange on white. It opens with “Întinerește-ți mobilitatea!” over a woman stretching on a wooden deck, explains collagen beside a man holding his knee, then lines up the products, each with its own column of ticks and an orange “Cumpără acum” button. A couple out Nordic walking leads into how collagen works, in three steps. Joint problems and the questions close the page.",
    stat: "6",
    statText: "products on one page: three kinds of sachets, the DIRECT vials, the mobil gel and the ACUT spray"
  },
  chapters: [
    {
      pillar: "product",
      pills: ["One", "page"],
      text: "The menu runs SUPRAMAX, Comandă, Probleme articulare, Întrebări, Blog, Contact. The hero sets a white-haired woman stretching beside the peach-flavour box under “Întinerește-ți mobilitatea!”. Collagen comes next, in two paragraphs and an orange box, then a line on what Supramax articulații contains, with an orange arrow between two circles of bone tissue. After the products, an orange panel lists what the site says Supramax does for cartilage, beside a couple Nordic walking, and three numbered steps follow: Absorbția, Distribuția, Stimularea. The joint problems and six questions in orange tiles end the page.",
      deliverables: ["Product site", "UX/UI design", "Desktop and mobile", "FAQ"],
      media: [
        siteBlock("supramax", "supramax.ro", { head: ["The", "product site"], cap: "supramax.ro from the first screen to the footer, on desktop and phone." }),
        {
          rail: ["Section by", "section"],
          items: [
            shot("supramax", "collagen", "SUPRAMAX articulații conține hidrolizat de colagen: the line in large type, an orange arrow between two circles of bone tissue, and two paragraphs below"),
            shot("supramax", "benefits", "An orange panel with three ticked lines about cartilage beside a photo of an older couple Nordic walking in a park, and Hidrolizatul de colagen acționează în 3 etape below: Absorbția, Distribuția, Stimularea")
          ],
          cap: "Collagen, explained before the boxes, and the three steps"
        }
      ]
    },
    {
      pillar: "product",
      pills: ["The", "range"],
      text: "The products, the way the site lines them up. Under “Doză mare de colagen” three sachet boxes stand side by side, plain, peach and osteo, each over its own column: an orange disc for “10 g colagen hidrolizat per plic”, ticks and letters for what else is inside, and “30 plicuri”. A grey band says what Supramax does not contain and how to take it. Then the DIRECT vials, the mobil gel and the ACUT spray, each with its own paragraph, its own column of ticks, its directions in a grey box and an orange button.",
      deliverables: ["Product range", "Ingredient columns", "Usage"],
      media: [
        shot("supramax", "range", "Doză mare de colagen: three Supramax articulații boxes, plain, peach and osteo, each above a column of orange discs and ticks, with Cumpără acum buttons and a grey band of what the product does not contain", "Three sachet boxes, three columns"),
        shot("supramax", "gel", "SUPRAMAX articulații mobil gel: the tube on an orange swoosh, a column of ticks from extract de tătăneasă to 100 ml, the directions in a grey box and a Cumpără acum button", "The mobil gel, with its own column and directions")
      ]
    },
    {
      pillar: "product",
      pills: ["On a", "phone"],
      text: "On a phone the page keeps its order in one column. The hero shrinks to a band at the top and the collagen paragraphs follow, the orange box still under them. The three sachet boxes stack one above another, each with its column and button, and the orange benefits panel moves under the Nordic walking photo.",
      deliverables: ["Mobile layout", "One column"],
      media: [
        {
          rail: ["Four", "screens"],
          items: [
            shot("supramax", "phone-hero", "The first screen on a phone: the Supramax articulații logo, the menu icon, the hero band and the collagen paragraphs with the orange box"),
            shot("supramax", "phone-collagen", "The collagen line on a phone, the arrow between the circles of bone tissue and the paragraphs below"),
            shot("supramax", "phone-range", "Doză mare de colagen on a phone: the first sachet box, its column and the Cumpără acum button, the peach box below"),
            shot("supramax", "phone-benefits", "The Nordic walking photo on a phone, the orange panel under it and the first of the three steps")
          ],
          cap: "The hero, collagen, the range and the three steps, at 390 px wide"
        }
      ]
    },
    ...spotChapter("supramax")
  ],
  result: {
    text: "Six products, one page, in the box's orange: collagen explained first, then every format with its own column."
  },
  related: RELATED
};

export const VIZIK = {
  slug: "vizik",
  name: "Vizik",
  tagline: "vizik.ro: one eye, three colours, three pages. Eye drops you pick by how your eyes feel.",
  desc: "Vizik: vizik.ro, a chooser and three product pages for a family of eye drops, one colour per problem, on desktop and phone. By Cromatic Studios, Bucharest.",
  title: "One eye, three colours.",
  accent: { bg: "#5A5FD6", fg: "#ffffff", ink: "#2f3aa8" },
  info: ["Eye drops, Vizik", "Romania · Zdrovit portfolio", "Product site, four pages, desktop and mobile"],
  cover: { img: m("vizik/hero") },
  og: m("vizik/hero"),
  hero: { img: m("vizik/hero"), alt: "vizik.ro in a browser window: one eye under three colour panels, red, green and blue, each with its line and an Află mai multe button; on a phone, the Vizik Allergy page with a green eye, the box and the bottle" },
  problem: {
    h: "Three problems, three bottles",
    p: [
      "Vizik is a family of eye drops from Zdrovit, in three versions. Each one is named for what it is for, in the site's words: “alergiilor oculare”, “ochi iritați și roșii”, “ochi uscați și obosiți”.",
      "The three boxes share a logo, a bottle and a layout. The problems they answer do not, and someone with sore eyes is looking for one of them, not for all three.",
      "So vizik.ro starts with the eyes, not the product, and lets the visitor say which <strong>kind</strong> of trouble they have."
    ]
  },
  solution: {
    h: "A colour for each problem",
    p: "The home page lays three colour panels over one close-up of an eye: red for irritated, green for allergies, blue for dry and tired. Two of them speak in the visitor's voice, “Ochii mei sunt…”. Each panel opens a page of its own, built on the same frame and dressed in its colour, from the line under the logo to the footer, and each page's menu links to the other two.",
    stat: "3",
    statText: "pages on one frame, one per problem, each in its own colour"
  },
  chapters: [
    {
      pillar: "product",
      pills: ["Three", "doors"],
      text: "vizik.ro is a single screen. One eye fills it, under three vertical panels in red, green and blue, with the Vizik logo in white over the middle one. Each panel carries a line and an “Află mai multe” button: “Ochii mei sunt iritați și roșii”, “Împotriva alergiilor oculare”, “Ochii mei sunt uscați și obosiți”. On a phone the panels stack, one screen each, and the eye shows through all three.",
      deliverables: ["Home page", "Chooser", "UX/UI design"],
      media: [
        shot("vizik", "chooser", "The vizik.ro home page: one close-up eye under three panels, red, green and blue, the Vizik logo in white, and a line and an Află mai multe button on each panel", "The home page: pick a colour, pick a problem"),
        {
          rail: ["Three", "panels"],
          items: [
            shot("vizik", "phone-door-red", "The red panel on a phone: the Vizik logo, Ochii mei sunt iritați și roșii and an Află mai multe button over the eye"),
            shot("vizik", "phone-door-green", "The green panel on a phone: Împotriva alergiilor oculare and an Află mai multe button over the eye"),
            shot("vizik", "phone-door-blue", "The blue panel on a phone: Ochii mei sunt uscați și obosiți and an Află mai multe button over the eye")
          ],
          cap: "On a phone the three panels stack, one screen each"
        }
      ]
    },
    {
      pillar: "product",
      pills: ["One", "frame"],
      text: "Behind each door, the same page in a different colour. A close-up eye sets the problem: pollen-green for allergies, red veins for irritation, a cracked surface for dryness. The box and the bottle stand beside a line in the page's colour, over three icons, “Fără conservanți”, “Sistem steril”, “Utilizare 12 luni de la deschidere”, and a turquoise drop points down to the structure of the tear film. Then the condition, its symptoms and causes in an accordion, the product with its formula, the ingredients, the directions and the order button.",
      deliverables: ["Product pages", "Page template", "Desktop and mobile", "Accordion"],
      media: [
        siteBlock("vizik", "vizik.ro", { alt: "The vizik.ro/alergii-oculare/ page, scrolling: the green eye and the Vizik Allergy box, the tear film on dark blue, the condition, the product and the green footer", altPhone: "The vizik.ro/alergii-oculare/ page on a phone, scrolling", head: ["The", "Allergy page"], cap: "The Allergy page from the first screen to the footer, on desktop and phone." }),
        {
          rail: ["Three", "eyes"],
          items: [
            shot("vizik", "allergy-hero", "The Allergy page hero: a close-up eye with a green, pollen-like iris, the Vizik Allergy box and bottle, Împotriva alergiilor oculare in green and three green icons"),
            shot("vizik", "red-hero", "The red page hero: a bloodshot eye, the Vizik box for irritated and red eyes, Împotriva ochilor iritați și roșii in red and three red icons"),
            shot("vizik", "blue-hero", "The blue page hero: an eye with a cracked, dry surface, the Vizik box for dry and tired eyes, Împotriva ochilor uscați și obosiți in blue and three blue icons")
          ],
          cap: "Allergy, red and blue: one frame, three eyes, three colours"
        }
      ]
    },
    {
      pillar: "product",
      pills: ["Inside a", "page"],
      text: "The middle of each page explains before it sells. The tear film gets a dark blue section: why tears matter, its three layers, and four things it does, each with a line icon and a green tick. Then each product has a band in its own colour, with the box and bottle on one side and the formula in large capitals on the other, from “Hialuronat de sodiu 0.15%” to “Dexpantenol”, over four icons. The red and blue pages add a section on contact lenses.",
      deliverables: ["Product story", "Icons", "Product bands"],
      media: [
        shot("vizik", "tears", "Filmul lacrimal servește 4 scopuri importante: four white eye icons with green ticks on dark blue, and a green band below, Multe organe pot fi afectate de reacții alergice", "The tear film's four jobs, one icon each"),
        {
          rail: ["Three", "formulas"],
          items: [
            shot("vizik", "allergy-product", "The Vizik Allergy band in green: the box and bottle, Hialuronat de sodiu 0.15%, Ectoină 2% and four icons"),
            shot("vizik", "red-product", "The red band: the Vizik box and bottle for irritated and red eyes, Dexpantenol, Carbomer and four icons"),
            shot("vizik", "blue-product", "The blue band: the Vizik box and bottle for dry and tired eyes, Hialuronat de sodiu 0.15%, Dexpantenol 2% and four icons")
          ],
          cap: "Each product in its own colour, its formula in large capitals"
        },
        shot("vizik", "lenses", "VIZIK și lentilele de contact: a paragraph on contact lenses, a red round icon of a lens and a drop, and a contact lens in water on the right", "Contact lenses, on the red and blue pages")
      ]
    },
    {
      pillar: "product",
      pills: ["On a", "phone"],
      text: "On a phone each page keeps its order. The line moves above the eye, the three icons line up down the right-hand side, and the box and bottle sit at the bottom of the first screen. The tear film's three layers stack as three numbered circles, one under another.",
      deliverables: ["Mobile layout", "One column"],
      media: [
        {
          rail: ["Four", "screens"],
          items: [
            shot("vizik", "phone-allergy", "The Allergy page on a phone: the Vizik logo, Împotriva alergiilor oculare, the green eye, the box, the bottle and three icons"),
            shot("vizik", "phone-layers", "Cele 3 straturi ale filmului lacrimal on a phone: three numbered circles on blue, each with a line"),
            shot("vizik", "phone-red", "The red page on a phone: the Vizik logo, Împotriva ochilor iritați și roșii, the bloodshot eye, the box, the bottle and three icons"),
            shot("vizik", "phone-blue", "The blue page on a phone: the Vizik logo, Împotriva ochilor uscați și obosiți, the dry eye, the box, the bottle and three icons")
          ],
          cap: "Allergy, the tear film, red and blue, at 390 px wide"
        }
      ]
    },
    ...spotChapter("vizik")
  ],
  result: {
    text: "One eye, three colours: you pick the page by how your eyes feel, and every page keeps its colour to the footer."
  },
  related: RELATED
};

// every Zdrovit brand page of the second half, in the order they were made
export const ZDROVIT_WEB_B = [PREVOMIT, SLABOFICAT, SUPRAMAX, VIZIK];
