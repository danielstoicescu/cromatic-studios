// TASK-076: the Zdrovit brands' own product sites, one case page per brand (Aspasia first, the pilot; then Bonilash,
// Glucopil, Gripovit, Lacium, Optisomn, Parasoftin, Periferisan, Prevomit, Slaboficat, Supramax, Vizik, Vizimel,
// OchiSan, Parusan...). Daniel, 21 Oct: every Zdrovit brand's official product site is Cromatic's work.
// Built only from what the live site shows (Mira's captures and inventory, TASK-075:
// ~/cromatic-ops/refs/zdrovit-pages/), so: no year unless the site or a file gives one, no results, no campaign facts.
// Health claims on the sites are quoted as the site's own words, never restated as facts; study figures are left out.
//
// The recipe for the next brand:
//   1. design/zdrovit-mockups/brands/<slug>.json: which captures, which crops (copy aspasia.json, move the crops)
//   2. node design/zdrovit-mockups/mock.mjs <slug>: site/media/<slug>/*.jpg and their sizes in dims.json
//   3. a spec below with web(<slug>, ...) and the helpers, three chapters (the page, the product, the phone)
//   4. add it to ZDROVIT_WEB, its SEO title to build/seo-pages.mjs, its Romanian to site/i18n/ro.json; its slug goes in
//      ZDROVIT_BRANDS (site/data.mjs, at merge). Daniel, 21 Oct: no Zdrovit brand gets a portfolio card of its own
//      (no PROJECTS entry, no hub case), the pages are reached from the Zdrovit card; no link out to the brand's site;
//      no year; the client's own figures on the site may be shown, in the site's own wording.
const m = (p) => "m:" + p;

// the helpers: the mockup names are the ones in brands/<slug>.json
const shot = (slug, name, alt, cap) => ({ img: m(`${slug}/${name}`), alt, ...(cap ? { cap } : {}) });
// the page's own scrolling device frames (gen.mjs "site" block): the desktop and phone captures, resized
const siteBlock = (slug, label, { alt, altPhone, head = ["The", "landing page"], cap } = {}) => ({
  site: {
    label, // (no href: Daniel, 21 Oct, the Zdrovit pages do not link out to the brands' sites)
    d: { img: m(`${slug}/site-scroll`), scroll: true, alt: alt || `The ${label} page, scrolling` },
    m: { img: m(`${slug}/site-scroll-phone`), scroll: true, alt: altPhone || `The ${label} page on a phone, scrolling` }
  },
  head, ...(cap ? { cap } : {})
});

// The TV spot slot (Daniel, 21 Oct: only full productions, no cuts or adaptations; he sends the files). A brand's
// entry stays null until its spot is in site/media/<slug>/: then the page gets one more chapter, "On TV", after the
// web chapters and before the closing line, with the case pages' own film player (the video plays on demand, with
// controls and a poster; opened from the map it starts by itself, see build/film.mjs). Nothing renders while it is null.
// To fill one: add { "spot": { "kind": "film", "src": "<the MP4>", "at": <poster second> } } to the brand's
// design/zdrovit-mockups/brands/<slug>.json, run mock.mjs <slug> spot, then fill in the entry here, e.g.
//   aspasia: { r: 1.778, seconds: 20, text: "<what the spot shows, scene by scene>", alt: "<the spot, in one line>",
//              cap: "<a caption>" }
// and add the new strings' Romanian to site/i18n/ro.json (the build lists them in ro.missing.json).
export const SPOTS = { aspasia: null, bonilash: null, glucopil: null, gripovit: null, lacium: null, optisomn: null, parasoftin: null, periferisan: null, "help-4-brain": null };
const spotChapter = (slug) => {
  const s = SPOTS[slug];
  if (!s) return [];
  return [{
    pillar: "video",
    pills: s.pills || ["On", "TV"],
    text: s.text,
    deliverables: s.deliverables || ["TV spot", ...(s.seconds ? [`${s.seconds} seconds`] : [])],
    media: [{ video: m(`${slug}/${s.file || "spot"}`), poster: m(`${slug}/${s.file || "spot"}-poster`), r: s.r || 1.778, manual: true, alt: s.alt, ...(s.cap ? { cap: s.cap } : {}) }]
  }];
};

export const ASPASIA = {
  slug: "aspasia",
  name: "Aspasia",
  tagline: "A one-page product site for Aspasia Collagen Beauty, a collagen supplement in 25 ml vials.",
  desc: "Aspasia Collagen Beauty: aspasiabeauty.ro, the one-page product site, on desktop and phone, for a drinkable collagen supplement in the Zdrovit portfolio. By Cromatic Studios, Bucharest.",
  title: "Collagen you drink.",
  accent: { bg: "#7FD1DA", fg: "#0f3b40", ink: "#1c8f9c" },
  info: ["Collagen supplement, Aspasia Collagen Beauty", "Romania · Zdrovit portfolio", "Landing page, desktop and mobile"],
  cover: { img: m("aspasia/hero") },
  og: m("aspasia/hero"),
  hero: { img: m("aspasia/hero"), alt: "aspasiabeauty.ro in a browser window and on a phone: the Aspasia Collagen Beauty box, a vial and a woman's face, the line Creat special pentru o piele strălucitoare și sănătoasă din interior and a brown Comandă acum band" },
  problem: {
    h: "Collagen, in a vial",
    p: [
      "Aspasia Collagen Beauty is a food supplement from Zdrovit. It comes in a box of <strong>28 vials</strong>, each one 25 ml of a solution you drink.",
      "Most people know collagen from creams and serums. This one you drink, straight from the vial or diluted in water, and its formula lists six ingredients: hydrolysed collagen peptides, hyaluronic acid, biotin, vitamin E, vitamin C and zinc.",
      "aspasiabeauty.ro explains it on one page: why collagen, what is in the vial, how to take it and where to order."
    ]
  },
  solution: {
    h: "One page, top to bottom",
    p: "Everything sits on a single scroll, in the colours of the box: turquoise fields, white, grey type and a warm brown band for the order button. The menu jumps to each section, and the box with its vial opens the page and closes it.",
    stat: "6",
    statText: "ingredients, named in one line across the page: collagen, hyaluronic acid, biotin, vitamin E, vitamin C, zinc"
  },
  chapters: [
    {
      pillar: "product",
      pills: ["One", "page"],
      text: "The menu runs Colagen, ASPASIA®, Întrebări frecvente, Studii, Blog, Comandă, Contact, and each item drops you at its section. The hero sets the box, a vial and a face side by side under one line, “Creat special pentru o piele strălucitoare și sănătoasă din interior”, with a free delivery badge and a brown “Comandă acum” band. Below come the reasons, the product, the formula, the questions, the studies and the blog. The order block closes the page, above the Zdrovit address.",
      deliverables: ["Landing page", "UX/UI design", "Desktop and mobile", "Navigation", "FAQ"],
      media: [
        siteBlock("aspasia", "aspasiabeauty.ro", { cap: "aspasiabeauty.ro from the first screen to the footer, on desktop and phone." }),
        {
          rail: ["Section by", "section"],
          items: [
            shot("aspasia", "faq", "Întrebări frecvente: seven questions in turquoise rows, the first one open"),
            shot("aspasia", "blog", "The blog block: four article titles in turquoise capitals beside a portrait with a white lily"),
            shot("aspasia", "order", "The order block: the box and a vial, a Cumpără acum button, and the Zdrovit România address in the turquoise footer")
          ],
          cap: "The questions, the blog and the order block"
        }
      ]
    },
    {
      pillar: "product",
      pills: ["The", "vial"],
      text: "The product story, the way the site tells it. “De ce colagen?” opens with two rings, 30% and 70%, and a table of how much collagen the body loses with age. Then the box: 28 vials of drinkable solution, ready to take, and a note that this collagen is drunk, not spread on the skin. The formula gets a band of its own: the six ingredients in one line, an icon and a sentence for each, and a table of what one 25 ml vial holds, from 2500 mg of hydrolysed collagen peptides to 10 mg of zinc.",
      deliverables: ["Product story", "Ingredient band", "Ingredients table", "Usage"],
      media: [
        shot("aspasia", "why", "De ce colagen?: two rings marked 30% and 70%, a face in a turquoise circle, a table of collagen loss by age and a brown band of text", "“De ce colagen?”: the reasons, in rings, a table and a brown band"),
        shot("aspasia", "pack", "The Aspasia Collagen Beauty box open, a vial in front, 28 flacoane cu soluție buvabilă gata preparată, and the product text beside the logo", "The box and the vial: 28 vials of drinkable solution, ready to take"),
        shot("aspasia", "formula", "The formula band: Colagen, Acid hialuronic, Biotină, Vitamina E, Vitamina C, Zinc in one line, an icon and a sentence for each, and the ingredients of one 25 ml vial in a table", "Six ingredients, six icons, and what one 25 ml vial holds")
      ]
    },
    {
      pillar: "product",
      pills: ["On a", "phone"],
      text: "On a phone the page keeps its order and folds into one column. The menu turns into a single icon, the line stacks above the box, and the brown “Comandă acum” band still sits on the first screen. The ingredient line breaks over four rows, and the questions stack as an accordion.",
      deliverables: ["Mobile layout", "One column", "Accordion"],
      media: [
        {
          rail: ["Four", "screens"],
          items: [
            shot("aspasia", "phone-hero", "The first screen on a phone: the menu icon, the line, the box with a vial, the free delivery badge and the Comandă acum band"),
            shot("aspasia", "phone-pack", "The box and vial on a phone, with 28 flacoane cu soluție buvabilă and the Aspasia collagen beauty logo above the product text"),
            shot("aspasia", "phone-formula", "The ingredient line on a phone, over four rows, and the first ingredients with their icons on turquoise"),
            shot("aspasia", "phone-faq", "Întrebări frecvente on a phone: the first question open, the others closed")
          ],
          cap: "The first screen, the box, the formula and the questions, at 390 px wide"
        }
      ]
    },
    ...spotChapter("aspasia") // the TV spot, once there is one (SPOTS above)
  ],
  result: {
    text: "One product, one page: the reasons, the formula and the order button, in the colours of the box."
  },
  related: ["litorsal", "maximag", "help-4-brain"]
};

// ---- the next pages: one builder, the same three chapters as Aspasia (the page, the product as the site tells it, the
// phone) and the spot slot; a brand fills in its copy and the names of its mockups (design/zdrovit-mockups/brands)
const web = (o) => {
  const s = o.slug, sh = (x) => (Array.isArray(x) ? shot(s, ...x) : x.row ? { ...x, row: x.row.map(sh) } : x);
  return {
    slug: s, name: o.name, tagline: o.tagline, desc: o.desc, title: o.title, accent: o.accent, info: o.info,
    cover: { img: m(`${s}/hero`) }, og: m(`${s}/hero`), hero: { img: m(`${s}/hero`), alt: o.heroAlt },
    problem: o.problem, solution: o.solution,
    chapters: [
      {
        pillar: "product", pills: ["One", "page"], text: o.page.text,
        deliverables: o.page.deliverables || ["Landing page", "UX/UI design", "Desktop and mobile", "Navigation"],
        media: [siteBlock(s, o.label, { cap: `${o.label}, top to bottom, on desktop and phone.` }), ...(o.page.shots || []).map(sh)]
      },
      { pillar: "product", pills: o.story.pills, text: o.story.text, deliverables: o.story.deliverables, media: o.story.media.map(sh) },
      {
        pillar: "product", pills: ["On a", "phone"], text: o.phone.text, deliverables: o.phone.deliverables || ["Mobile layout", "One column"],
        media: [{ rail: ["Four", "screens"], items: o.phone.shots.map(sh), cap: o.phone.cap }]
      },
      ...spotChapter(s)
    ],
    result: { text: o.result },
    related: o.related
  };
};

export const BONILASH = web({
  slug: "bonilash", name: "Bonilash", label: "bonilash.ro",
  title: "Lashes, close up.",
  tagline: "The product site for Bonilash, a lash serum and a brow serum: a pink home page, a page for each serum and a blog.",
  desc: "Bonilash: bonilash.ro, the product site for a lash serum and a brow serum in the Zdrovit portfolio, on desktop and phone. By Cromatic Studios, Bucharest.",
  accent: { bg: "#F2D3DC", fg: "#4a1c2c", ink: "#a4506b" },
  info: ["Lash and brow serums, Bonilash", "Romania · Zdrovit portfolio", "Product website, desktop and mobile"],
  heroAlt: "bonilash.ro in a browser window and on a phone: a woman holding the lash serum, beside the line Seruri gene și sprâncene - Inovație pentru regenerare vizibilă",
  problem: {
    h: "Two serums, one slim tube each",
    p: [
      "Bonilash makes two serums, one for lashes and one for brows. Each comes in a slim tube with a fine applicator.",
      "Both go on in the evening, on clean skin, and the site is plain about time: the first results take weeks. It puts that next to the products, the reviews and the safety advice.",
      "bonilash.ro has a home page, a page for each serum and a blog, all reached from the menu."
    ]
  },
  solution: {
    h: "Pink, white and the product up close",
    p: "The site takes its colours from the packs: soft pink fields, a lot of white and a deep rose for headings and buttons. The serums lie flat on pink, and the hero slides through portraits of a woman with the tube in her hand, each with the line “Gene cu până la 25% mai lungi”.",
    stat: "2",
    statText: "serums, one for lashes and one for brows, each with its own page"
  },
  page: {
    text: "The menu runs Acasă, Produse, Blog, Contact, with Bonilash® gene and Bonilash® sprâncene under Produse and a Comandă button at the end. The home page opens with the name, the line “Seruri gene și sprâncene - Inovație pentru regenerare vizibilă” and the portrait slider. Then come the two serums, the specialist articles, the reviews, an Instagram strip, the safety tips and the questions.",
    deliverables: ["Product website", "UX/UI design", "Desktop and mobile", "Product pages", "Blog"],
    shots: [["reviews", "Articole de specialitate with a close-up of an eye, and Recenzii Bonilash®: a slider of customer reviews", "The articles, then the reviews"]]
  },
  story: {
    pills: ["Two", "serums"],
    text: "Each serum gets a pink card with a product shot, a short promise in the site's words and two buttons, Comandă and Vezi detalii produs. The lash serum leads with “până la 25% mai lungi”, the brow serum with results “după doar 12 săptămâni de utilizare”. Further down, a strip of product photos opens the safety tips, listed one by one: keep it out of the eye, not on the lower lashes, only on clean skin, and no results overnight.",
    deliverables: ["Product cards", "Safety tips", "Reviews"],
    media: [
      ["products", "The two serums: three silver tubes on pink beside the lash serum's name, three gold tubes on pink beside the brow serum's", "The lash serum and the brow serum, each on its pink card"],
      ["tips", "A strip of five product photos above Bonilash® - Sfaturi pentru utilizare în siguranță, a list of safety tips beside a round portrait", "The safety tips, under a strip of product photos"]
    ]
  },
  phone: {
    text: "On a phone the menu folds behind one icon and the page stacks into a single column: the name and the line first, then the portrait slider, then each serum as a pink photo above its name and its two buttons. The safety tips keep their full wording.",
    shots: [
      ["phone-hero", "The first screen on a phone: the logo, the menu icon, Bonilash® and the line in rose"],
      ["phone-lashes", "The lash serum on a phone: three silver tubes on pink, then its name and the 25% line"],
      ["phone-brows", "The brow serum on a phone: its name, the 12-week line, two buttons and three gold tubes on pink"],
      ["phone-tips", "The safety tips on a phone, in a single column"]
    ],
    cap: "The first screen, the two serums and the safety tips, at 390 px wide"
  },
  result: "Two serums, one pink site: the products, the reviews and the safety tips, in the colours of the pack.",
  related: ["aspasia", "parasoftin", "lacium"]
});

export const GLUCOPIL = web({
  slug: "glucopil", name: "Glucopil", label: "glucopil.ro",
  title: "Blood sugar, explained.",
  tagline: "The product site for Glucopil, a blood sugar supplement: high and low blood sugar explained before the box appears.",
  desc: "Glucopil: glucopil.ro, the one-page product site for a blood sugar supplement in the Zdrovit portfolio, on desktop and phone. By Cromatic Studios, Bucharest.",
  accent: { bg: "#A9C9DD", fg: "#0d2f5c", ink: "#1f6aa5" },
  info: ["Blood sugar supplement, Glucopil", "Romania · Zdrovit portfolio", "Landing page, desktop and mobile"],
  heroAlt: "glucopil.ro in a browser window and on a phone: an older woman and a younger one sharing cake, beside the line Soluția avansată în menținerea optimă a nivelului de glicemie",
  problem: {
    h: "A number most people never see",
    p: [
      "Glucopil is a food supplement from Zdrovit for keeping blood sugar within normal limits. It comes as tablets, one taken twice a day.",
      "Blood sugar is easy to ignore until it runs too high or too low. The site starts there: what glicemia is, and what each extreme feels like.",
      "Only then does it show the box, the plants inside and how to take it."
    ]
  },
  solution: {
    h: "Two colours for two conditions",
    p: "The page runs on a calm blue and a soft green. Hiperglicemia gets a blue card and hipoglicemia a green one, each with a photo, a short explanation and its list of symptoms, and each closes on the advice to see a doctor. The plants get three round photos on the same two colours.",
    stat: "3",
    statText: "plants in the formula, each with a round photo and its story: gymnema, fenugreek, white mulberry"
  },
  page: {
    text: "The menu runs Glicemia, Ingrediente principale, Glucopil®, Comandă, Contact. The hero puts two women and a slice of cake beside the line “Soluția avansată în menținerea optimă a nivelului de glicemie” and a Cumpără button. Below it the page explains glicemia, then the two conditions, the ingredients, how to take it and the warnings, and closes on the Zdrovit address beside a drawing of a woman among leaves.",
    shots: [["usage", "Mod de utilizare: a man pouring a glass of water, the daily dose and a blue Atenționări! card", "How to take it, and the warnings in a blue card"]]
  },
  story: {
    pills: ["High", "and low"],
    text: "Hiperglicemia and hipoglicemia sit one after the other, in the same layout and different colours, so the two read as a pair. Each card explains the condition in a few lines and lists its symptoms, from thirst and tiredness to trembling and hunger. Then the ingredients: gymnema leaf, fenugreek seed and white mulberry leaf, with chromium and B vitamins, each plant with a round photo and a few lines on where it comes from.",
    deliverables: ["Condition cards", "Symptom lists", "Ingredient cards"],
    media: [
      { row: [
        ["hyper", "Hiperglicemia: a blue card with a photo of a tired woman and a list of symptoms"],
        ["hypo", "Hipoglicemia: a green card with a photo of a woman at an open fridge and a list of symptoms"]
      ], cap: "Hiperglicemia in blue, hipoglicemia in green" },
      ["ingredients", "Three round photos, gymnema leaves, fenugreek seeds and white mulberries, above cards in green and blue, and a Cumpără Glucopil® button", "The three plants, each with its story"]
    ]
  },
  phone: {
    text: "On a phone the photo goes first and the line follows under it. The two condition cards keep their colours and list their symptoms one under the other, the ingredients come one after another, and the dose sits above the blue card of warnings.",
    shots: [
      ["phone-hero", "The first screen on a phone: the photo of the two women, then the line and the text"],
      ["phone-hyper", "Hiperglicemia on a phone: the blue card with a photo and the symptoms"],
      ["phone-ingredients", "Ingrediente on a phone: gymnema, fenugreek, white mulberry, chromium and B vitamins, in green type"],
      ["phone-usage", "Mod de utilizare and the blue Atenționări! card on a phone"]
    ],
    cap: "The first screen, a condition card, the ingredients and the dose, at 390 px wide"
  },
  result: "A page that explains high and low blood sugar first, then shows what is in the tablet and how to take it.",
  related: ["periferisan", "help-4-brain", "lacium"]
});

export const GRIPOVIT = web({
  slug: "gripovit", name: "Gripovit", label: "gripovit.ro",
  title: "Cold or flu?",
  tagline: "The product site for Gripovit, a range of cold and flu sachets: how to tell the two apart, then the box for each.",
  desc: "Gripovit: gripovit.ro, the one-page product site for a range of cold and flu sachets in the Zdrovit portfolio, on desktop and phone. By Cromatic Studios, Bucharest.",
  accent: { bg: "#6E5BC6", fg: "#ffffff", ink: "#4b39a8" },
  info: ["Cold and flu sachets, Gripovit", "Romania · Zdrovit portfolio", "Landing page, desktop and mobile"],
  heroAlt: "gripovit.ro in a browser window and on a phone: a laughing family and the Gripovit MAX C boxes on the desktop, a mother and daughter on the phone, under the line Susține organismul în stările de răceală și gripă",
  problem: {
    h: "Two illnesses that look alike",
    p: [
      "Gripovit is a range of sachets from Zdrovit for colds and flu: Gripovit® MAX C, MAX C Hot Lemon, MAX C Ghimbir și miere, and Gripovit® JUNIOR for children.",
      "A cold and the flu share many symptoms. The site opens with the difference: how each one starts, how long it lasts and what causes it.",
      "Advice comes next, then the boxes."
    ]
  },
  solution: {
    h: "Purple, with an orange circle",
    p: "The page uses the purple of the boxes, with orange for warmth. Cold and flu stand side by side as two circles, orange and purple, each with its symptoms and how long they last. Treatment and prevention tips follow, each with a small round icon or a photo.",
    stat: "4",
    statText: "products in the range, each with its own section: what it does, what is in it, how to take it"
  },
  page: {
    text: "The menu runs Răceală și gripă, Gripovit®, Sfaturi, Comandă, Contact. The hero is a slider of families at home with a Gripovit box, under the line “Susține organismul în stările de răceală și gripă”. Below, the page moves from information to symptoms, causes, treatment and prevention, then to the range, a section of tips for a strong immune system and the order block.",
    shots: [["tips", "SFATURI pentru un SISTEM IMUNITAR puternic, in white on a purple band with line drawings of a thermometer and a stethoscope", "The tips open on a purple band"]]
  },
  story: {
    pills: ["Cold", "or flu"],
    text: "Simptome puts the two side by side: an orange circle for the cold, with symptoms that build over about 48 hours and last 3 to 10 days, and a purple one for the flu, which starts fast, with fever and chills, and lasts 7 to 14 days. Tratament lists what helps, each tip with an orange icon. The range follows on an orange banner, and each box gets its own section: what it does, what is in it and how to take it.",
    deliverables: ["Symptom comparison", "Treatment tips", "Product sections"],
    media: [
      ["symptoms", "Simptome: a woman holding her head beside two circles, Răceală in orange and Gripă in purple, each listing its symptoms", "Simptome: the cold in orange, the flu in purple"],
      ["treatment", "Tratament: a girl with a mug beside four tips, each with an orange icon", "Tratament: four tips, four orange icons"],
      ["range", "An orange banner with honey and lemon, the row of adult packs, then Gripovit® MAX C Hot Lemon with Acțiune, Ingrediente, Mod de utilizare and Comandă", "The range banner, then Gripovit® MAX C Hot Lemon: what it does, what is in it, how to take it"]
    ]
  },
  phone: {
    text: "On a phone the slider shows the MAX C boxes with a NOU badge. The two circles stack one above the other, the prevention tips run as a column of photos, and the range turns into a grid of small packs above each box.",
    shots: [
      ["phone-hero", "The first screen on a phone: a laughing family, the MAX C boxes with a NOU badge and the line"],
      ["phone-symptoms", "Simptome on a phone: the cold's orange circle above the flu's purple one"],
      ["phone-range", "The range on a phone: the Adulți grid of packs, then the MAX C Hot Lemon boxes"],
      ["phone-tips", "The SFATURI band on a phone, then a photo of breakfast and O alimentație corectă"]
    ],
    cap: "The first screen, the symptoms, the range and the tips, at 390 px wide"
  },
  result: "A page that helps you tell a cold from the flu, then shows the box for each.",
  related: ["optisomn", "lacium", "litorsal"]
});

export const LACIUM = web({
  slug: "lacium", name: "Lacium", label: "lacium.ro",
  title: "Nine strains, one capsule.",
  tagline: "The product site for Lacium, a probiotic: five advantages, nine strains round a drawn gut, and good bacteria explained.",
  desc: "Lacium: lacium.ro, the one-page product site for a probiotic in the Zdrovit portfolio, on desktop and phone. By Cromatic Studios, Bucharest.",
  accent: { bg: "#BFE3F7", fg: "#173a7a", ink: "#d9661a" },
  info: ["Probiotic, Lacium", "Romania · Zdrovit portfolio", "Landing page, desktop and mobile"],
  heroAlt: "lacium.ro in a browser window and on a phone: the orange Lacium box on a field of blue bacteria, with five claims in white tags",
  problem: {
    h: "Probiotics are not all the same",
    p: [
      "Lacium is a probiotic from Zdrovit, one capsule a day, with Lacium Junior for children.",
      "The site starts from its own argument: the number of good bacteria and the number of strains matter. Lacium has <strong>9 strains</strong> of live cultures, plus inulin.",
      "The page makes those numbers easy to follow for someone who has never heard of a strain."
    ]
  },
  solution: {
    h: "Orange box, blue bacteria",
    p: "The hero sets the orange box on a field of blue bacteria, with the five claims in white tags beside it, each with its own small icon. Below, the five advantages each get a band, and the nine strains are named round a drawing of the gut.",
    stat: "5",
    statText: "advantages, one band each: bacteria, strains, stability, inulin, one capsule a day"
  },
  page: {
    text: "The menu runs LACIUM®, Flora intestinală, Bacteriile bune, Comandă, Contact. The hero lists the claims in five tags, from “50 miliarde UFC* într-o singură capsulă” to “Administrare facilă – 1 capsulă pe zi”. Then the product, the five advantages, the intestinal flora, the good bacteria and the order block.",
    shots: [["order", "COMANDĂ: the Lacium and Lacium Junior boxes beside a Cumpără acum button", "The order block"]]
  },
  story: {
    pills: ["Nine", "strains"],
    text: "Each advantage gets a band of its own, numbered one to five. The strains band is the centre of the page: nine names round a drawing of the gut, four Lactobacillus on one side, three Bifidobacterium and two more on the other. The text says why both families are there: Lactobacillus live mostly in the small intestine, Bifidobacterium in the colon. Further down, Bacteriile bune explains what probiotics are and what they do, in two columns under a band of drawn bacteria.",
    deliverables: ["Advantage bands", "Strain diagram", "Explainers"],
    media: [
      ["advantages", "5 avantaje ale utilizării Lacium®: the Lacium and Lacium Junior boxes on peach, and a Cumpără acum button", "The five advantages open on peach, with both boxes"],
      ["strains", "Avantajul 2: the nine strains named round an illustrated gut, Lactobacillus on the left, Bifidobacterium, Lactococcus and Streptococcus on the right", "The nine strains, round a drawn gut"],
      ["bacteria", "Bacteriile bune, cunoscute și sub denumirea de probiotice: a blue band of drawn bacteria above two columns of text", "Bacteriile bune, under a band of drawn bacteria"]
    ]
  },
  phone: {
    text: "On a phone the box comes first, with its Cumpără acum button, and the five claims stack under it as tags. The advantages run one band after another, and the explanations keep their full length.",
    shots: [
      ["phone-hero", "The first screen on a phone: the menu icon, the Lacium box, a Cumpără acum button and the claims as tags"],
      ["phone-advantages", "5 avantaje on a phone: the heading, a Cumpără acum button, the two boxes and Avantajul 1"],
      ["phone-flora", "Flora intestinală on a phone: a yellow band, a photo of balanced stones and the text"],
      ["phone-bacteria", "Bacteriile bune on a phone, under a band of drawn bacteria"]
    ],
    cap: "The first screen, the advantages, the flora and the good bacteria, at 390 px wide"
  },
  result: "A probiotic's numbers, made readable: five advantages, nine strains you can count, one capsule a day.",
  related: ["glucopil", "gripovit", "aspasia"]
});

// a chapter added to a page that already exists, by its slug (gen.mjs applies it): none yet
export const EXTEND = {};

// every Zdrovit brand page built from its product site, in the order they were made
export const ZDROVIT_WEB = [ASPASIA, BONILASH, GLUCOPIL, GRIPOVIT, LACIUM];
