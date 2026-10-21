// TASK-026: two brands from the Zdrovit yard on the map, Litorsal and Lacalut, with their own case pages.
// Built only from the studio's own files in ~/Clienti/Litorsal-Lacalut-Maximag (04_Livrabile-finale, 03_Lucru-Surse,
// 05_Foto-Video), spring 2026. No results, no quotes, no media plan: the files do not say where or how long each
// piece ran, so the copy describes the work and its formats only. (TASK-062: Daniel, 2026-10-21, on the Super vibe
// posters: they ran in the metro, in the stations, inside the cars beside the doors and on the cars.)
import { METRO } from "./metro-assets.mjs";
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
  // TASK-062 (Daniel, 2026-10-21: "să apară o singură dată, la început, apoi cele pe galben, și variațiunile de la
  // căldură mare apoi, și încheiem"): the heat billboard once, as the hero; then the two yellow lines (Super vibe with
  // the animated metro mockups, the whole family); then the heat line's other formats; then the close, with no picture.
  // The range (tubes and boxes) is off the page for now: LITORSAL_RANGE below, ready to come back.
  chapters: [
    {
      pillar: "marketing",
      pills: ["Super", "vibe"],
      text: "The city line: “Hidratare corectă pentru un super vibe.” A hand holds the tube up on flat yellow, the way you hold it on your way out. The layout comes in landscape and portrait for the metro, and in a 2 x 0.8 m banner. Below, the posters where they ran, as animated mockups: on the platform, by the doors, on the train.",
      deliverables: ["Metro posters", "Banner", "Landscape and portrait", "Animated mockups"],
      // TASK-062: three animated mockups (design/metro-mockup: our own 3D station, carriage and train, the real artwork,
      // played by the site's Lottie layer), then the posters as printed
      media: [
        { czl: "metro-platform", img: m("metro/platform-still"), alt: "Animated mockup: the landscape and portrait posters in lit frames on a metro station's track wall, people passing in front", cap: "Animated mockup: on the platform" },
        { row: [
          { full: true, czl: "metro-inside", img: m("metro/inside-still"), alt: "Animated mockup: inside a metro car, the portrait poster on the panel beside the doors, while the train leaves the station, runs through the tunnel and pulls in again" },
          { full: true, img: m("litorsal/vibe-metro-portrait"), alt: "The portrait metro poster: the headline on top, the hand with the tube below" }
        ], wrap: true, cap: "In the carriage, beside the doors, and the 50 x 90 cm poster itself" },
        { czl: "metro-train", at: 300, img: m("metro/train-still"), alt: "Animated mockup: a metro train pulls into the station with the wide poster on the side of a car, opens and closes its doors, and pulls out", cap: "On the train, as a wrap" },
        {
          rail: ["As", "printed"],
          items: [
            { img: m("litorsal/vibe-metro"), alt: "The landscape metro poster: the hand with the tube on the left, the headline on the right" },
            { img: m("litorsal/vibe-metro-wide"), alt: "A wide yellow metro poster: the hand with the Litorsal tube, the headline Hidratare corectă pentru un super vibe and a QR code" },
            { img: m("litorsal/vibe-metro-tall"), alt: "The tall metro poster: the headline on top, the hand with the tube below" },
            { img: m("litorsal/vibe-banner"), alt: "Yellow banner: a hand holding a Litorsal tube, the headline Hidratare corectă pentru un super vibe and a QR code" }
          ],
          cap: "60 x 40, 80 x 40 and 40 x 90 cm for the metro, and the 2 x 0.8 m banner"
        }
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
      pillar: "marketing",
      pills: ["Căldură", "mare"],
      text: "The summer line, the billboard at the top of this page: “Căldură mare, Litorsal îți dă hidratare!” The tubes stand in a row in front of the sun and a splash of water. Four icons explain the product at a glance: efficient hydration, electrolytes restored, energy, support for the body. One layout, redrawn for six billboard sizes, from 6 x 3 m to 1 x 1.5 m.",
      deliverables: ["Key visual", "Billboards", "Six formats", "Icons"],
      // (the 3.2 x 2.4 m billboard, heat-billboard, is left out: it is the hero's picture again; it stays the page's cover)
      media: [
        { row: [
          { img: m("litorsal/heat-packs"), alt: "The same billboard with Litorsal boxes in place of the tubes, Junior on the right" },
          { img: m("litorsal/heat-tall"), alt: "The portrait version, 1 x 1.5 m: headline on top, the icons in a grid, the tubes below" }
        ], cap: "With the boxes, and in portrait, 1 x 1.5 m" },
        { row: [
          { img: m("litorsal/heat-250x110"), alt: "The 2.5 x 1.1 m version, the tubes moved to the right of the headline" },
          { img: m("litorsal/heat-first"), alt: "An earlier layout with round badges for electrolytes and minerals and five tubes, Senior included" }
        ], cap: "A long strip, 2.5 x 1.1 m, and an earlier layout with round badges" }
      ]
    }
  ],
  result: {
    text: "One product in three lines, and one system that keeps its shape from a 6 x 3 m billboard to a 60 x 40 cm poster."
  },
  related: ["lacalut", "help-4-brain", "clinica-sante"],
  czl: METRO // (the mockups' pictures: written into the page as #czl-assets, the build swaps in their hashed addresses)
};

// The range chapter, off the Litorsal page since TASK-062 (Daniel's order: hero, the yellow lines, the heat formats, the
// close). Put it back in LITORSAL.chapters to show it again (its pillar brings back the Product Design pill).
export const LITORSAL_RANGE = {
  pillar: "product",
  pills: ["The", "range"],
  text: "Clean visuals of the whole range, cut out so they sit on any background: five tubes and four boxes.",
  deliverables: ["Tube visuals", "Box visuals", "Five versions"],
  media: [
    { img: m("litorsal/tubes"), alt: "Five Litorsal tubes on yellow: Clasic, Cireșe, Grapefruit, Junior and Senior" },
    { img: m("litorsal/boxes"), alt: "Four Litorsal boxes: Clasic, Cireșe, Grapefruit and Junior" }
  ]
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
