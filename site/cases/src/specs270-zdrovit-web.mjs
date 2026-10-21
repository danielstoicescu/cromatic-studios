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

// a chapter added to a page that already exists, by its slug (gen.mjs applies it): none yet
export const EXTEND = {};

// every Zdrovit brand page built from its product site, in the order they were made
export const ZDROVIT_WEB = [ASPASIA, BONILASH];
