// TASK-026: two brands from the Zdrovit yard on the map, Litorsal and Lacalut, with their own case pages.
// Built only from the studio's own files in ~/Clienti/Litorsal-Lacalut-Maximag (04_Livrabile-finale, 03_Lucru-Surse,
// 05_Foto-Video), spring 2026. No results, no quotes, no media plan: the files do not say where or how long each
// piece ran, so the copy describes the work and its formats only.
const m = (p) => "m:" + p;

export const LITORSAL = {
  slug: "litorsal",
  name: "Litorsal",
  tagline: "Three campaign lines for an electrolyte tube, from a 6 x 3 m billboard to a metro poster.",
  desc: "Litorsal: billboards, metro and pharmacy posters and product visuals for an electrolyte and mineral supplement in the Zdrovit portfolio. By Cromatic Studios, Bucharest, 2026.",
  title: "One tube, every format.",
  accent: { bg: "#FFD100", fg: "#1b2a6b", ink: "#1f3a99" },
  info: ["Electrolytes and minerals, in pharmacies", "Romania · 2026", "Billboards, posters, product visuals"],
  cover: { img: m("litorsal/heat-billboard") },
  og: m("litorsal/heat-6x3"),
  hero: { img: m("litorsal/heat-6x3"), fixed: false, alt: "Billboard: Căldură mare, Litorsal îți dă hidratare! Four Litorsal tubes in front of the sun and splashing water, four icons and a QR code" },
  problem: {
    h: "Three lines, one product",
    p: [
      "Litorsal makes effervescent tablets with <strong>electrolytes</strong> and minerals, sold in pharmacies and online. One tube, five versions: Clasic with lemon and mint, Cireșe, Grapefruit, Junior for children from three, and Senior.",
      "In 2026 the brand spoke in three lines. Each one has its own headline, its own colours and its own set of formats.",
      "Every line had to hold together from a <strong>6 x 3 m</strong> billboard down to a 60 x 40 cm poster."
    ]
  },
  solution: {
    h: "The tube is the hero",
    p: "Every layout is built around the same object. The tube stands large and close, the headline sits in the brand's navy, the flavours keep their own colours, and a QR code with “Disponibil în farmacii” closes each piece.",
    stat: "3",
    statText: "campaign lines: the heat, the vibe, the whole family"
  },
  chapters: [
    {
      pillar: "marketing",
      pills: ["Căldură", "mare"],
      text: "The summer line: “Căldură mare, Litorsal îți dă hidratare!” The tubes stand in a row in front of the sun and a splash of water. Four icons explain the product at a glance: efficient hydration, electrolytes restored, energy, support for the body. One layout, redrawn for six billboard sizes, from 6 x 3 m to 1 x 1.5 m.",
      deliverables: ["Key visual", "Billboards", "Six formats", "Icons"],
      media: [
        { img: m("litorsal/heat-billboard"), alt: "The 3.2 x 2.4 m billboard: the headline in yellow and white on blue, four tubes, four icons and a QR code", cap: "3.2 x 2.4 m" },
        {
          rail: ["More", "formats"],
          items: [
            { img: m("litorsal/heat-packs"), alt: "The same billboard with Litorsal boxes in place of the tubes, Junior on the right" },
            { img: m("litorsal/heat-tall"), alt: "The portrait version, 1 x 1.5 m: headline on top, the icons in a grid, the tubes below" },
            { img: m("litorsal/heat-250x110"), alt: "The 2.5 x 1.1 m version, the tubes moved to the right of the headline" },
            { img: m("litorsal/heat-first"), alt: "An earlier layout with round badges for electrolytes and minerals and five tubes, Senior included" }
          ],
          cap: "With the boxes, in portrait, in a long strip, and an earlier layout with round badges"
        }
      ]
    },
    {
      pillar: "marketing",
      pills: ["Super", "vibe"],
      text: "The city line: “Hidratare corectă pentru un super vibe.” A hand holds the tube up on flat yellow, the way you hold it on your way out. The layout comes in landscape and portrait for the metro, and in a 2 x 0.8 m banner.",
      deliverables: ["Metro posters", "Banner", "Landscape and portrait"],
      media: [
        { img: m("litorsal/vibe-banner"), alt: "Yellow banner: a hand holding a Litorsal tube, the headline Hidratare corectă pentru un super vibe and a QR code" },
        { row: [
          { img: m("litorsal/vibe-metro"), alt: "The landscape metro poster: the hand with the tube on the left, the headline on the right" },
          { img: m("litorsal/vibe-metro-portrait"), alt: "The portrait metro poster: the headline on top, the hand with the tube below" }
        ], cap: "Landscape and portrait, one grid" }
      ]
    },
    {
      pillar: "marketing",
      pills: ["Întreaga", "familie"],
      text: "The family line: “Hidratare corectă pentru întreaga familie.” Four tubes fan out, each with a flavour tag in its own colour: lemon and mint, cherry, grapefruit, and raspberry for Junior. The same spread runs on yellow, sky blue and navy, in 60 x 40 cm and 80 x 40 cm posters.",
      deliverables: ["Posters", "Flavour tags", "Colourways"],
      media: [
        { row: [
          { img: m("litorsal/family-poster"), alt: "Yellow 60 x 40 cm poster: four Litorsal tubes fanned out with flavour tags, the headline Hidratare corectă pentru întreaga familie" },
          { img: m("litorsal/family-portrait"), alt: "The same poster in portrait, the tubes above the headline" }
        ] },
        {
          rail: ["Three", "colours"],
          items: [
            { img: m("litorsal/family-sky"), alt: "The family poster on a pale sky blue gradient" },
            { img: m("litorsal/family-blue"), alt: "The family poster on a mid blue" },
            { img: m("litorsal/family-navy"), alt: "The family poster on navy, with the headline in white" }
          ],
          cap: "80 x 40 cm, one layout in three backgrounds"
        }
      ]
    },
    {
      pillar: "product",
      pills: ["The", "range"],
      text: "Clean visuals of the whole range, cut out so they sit on any background: five tubes and four boxes.",
      deliverables: ["Tube visuals", "Box visuals", "Five versions"],
      media: [
        { img: m("litorsal/tubes"), alt: "Five Litorsal tubes on yellow: Clasic, Cireșe, Grapefruit, Junior and Senior" },
        { img: m("litorsal/boxes"), alt: "Four Litorsal boxes: Clasic, Cireșe, Grapefruit and Junior" }
      ]
    }
  ],
  result: {
    text: "One product in three lines, and one system that keeps its shape from a 6 x 3 m billboard to a 60 x 40 cm poster.",
    media: [{ img: m("litorsal/vibe-metro-wide"), alt: "A wide yellow metro poster: the hand with the Litorsal tube, the headline Hidratare corectă pentru un super vibe and a QR code" }]
  },
  related: ["lacalut", "help-4-brain", "clinica-sante"]
};

const R_LG = 1280 / 330; // the LG animated banners: 1920 x 496 at the source, 1280 x 330 here
export const LACALUT = {
  slug: "lacalut",
  name: "Lacalut",
  tagline: "Lacalut White & Repair on LG Smart TV home screens: three still formats and a 15-second banner in motion.",
  desc: "Lacalut White & Repair: Smart TV ads for LG home screens and a 15-second animated banner, in the Zdrovit portfolio. By Cromatic Studios, 2026.",
  title: "Double benefit, on the home screen.",
  accent: { bg: "#E30C2C", fg: "#ffffff", ink: "#c10a25" },
  info: ["Toothpaste, Lacalut White & Repair", "Romania · 2026", "Smart TV ads, motion"],
  cover: { img: m("lacalut/lg-launcher") },
  og: m("lacalut/lg-banner"),
  hero: { img: m("lacalut/portrait"), alt: "A woman in a red dress smiles and holds up a tube of Lacalut White & Repair, her other hand making a V" },
  problem: {
    h: "Two promises in one name",
    p: [
      "Lacalut White & Repair carries two promises in its name: <strong>white</strong> and repair. The Romanian line for it says the same thing in four words, “Beneficiu dublu pentru dinții tăi!”, a double benefit for your teeth.",
      "The campaign was made for LG Smart TV home screens. The formats there are fixed and small: a 300 x 250 tile, a 970 x 250 strip, a 1440 x 1080 wedge with a slanted edge.",
      "One picture had to work in all of them, still and in motion."
    ]
  },
  solution: {
    h: "Red and white, split down the middle",
    p: "The layouts borrow the logo's own colours. Red carries the line, white carries the name, and the woman in the red dress links the two. Every format is cut from that one picture.",
    stat: "4",
    statText: "formats from one picture: tile, strip, wedge and a 15-second banner"
  },
  chapters: [
    {
      pillar: "marketing",
      pills: ["Smart TV", "ads"],
      text: "Three still formats for LG home screens. The 300 x 250 home launcher stacks two rows: the double benefit in white on red over the tube, then the logo on white with the same smile. The 970 x 250 banner runs face, line and logo in one strip. The wedge folds it all into a slanted card.",
      deliverables: ["Home launcher", "Banner", "Wedge"],
      media: [
        { row: [
          { img: m("lacalut/lg-launcher"), alt: "The home launcher: on top the woman with the tube and the line Beneficiu dublu pentru dinții tăi! on red, below the Lacalut white & repair logo on white" },
          { img: m("lacalut/lg-wedge"), alt: "The wedge: a tall slanted card with the woman, the tube, the logo and lacalut.ro" }
        ], cap: "Home launcher, 300 x 250, and wedge, 1440 x 1080" },
        { img: m("lacalut/lg-banner"), alt: "The banner: the woman with the tube on the left, a red tag with the line, the logo on the right", cap: "Banner, 970 x 250" }
      ]
    },
    {
      pillar: "video",
      pills: ["In", "motion"],
      text: "A 15-second animated banner, 1920 x 496. The logo and the line stay on the left, a QR code and lacalut.ro on the right. In the middle the woman smiles, holds up the tube, and a white texture carries the second line: “Pentru dinți sănătoși, puternici de un alb natural.”",
      deliverables: ["Animated banner", "15 seconds", "1920 x 496"],
      media: [
        { video: m("lacalut/lg-film"), poster: m("lacalut/lg-film-poster"), r: R_LG, alt: "The animated Lacalut banner: logo and line on the left, the woman with the tube in the middle, QR code and lacalut.ro on the right", cap: "15 seconds, on loop" }
      ]
    }
  ],
  result: {
    text: "One picture, cut into every format the screen asks for, still and in motion.",
    media: [{ img: m("lacalut/tube"), alt: "The Lacalut White & Repair tube" }]
  },
  related: ["maximag", "litorsal", "help-4-brain"] // TASK-064: Maximag has its own page now
};
