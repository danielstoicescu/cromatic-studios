// TASK-064: Maximag Bisglicinat gets its own page (it was the last chapter of the Lacalut page) and its own kiosk in
// the Zdrovit yard. Built only from the studio's files in ~/Clienti/Litorsal-Lacalut-Maximag, spring 2026:
// - the three LG still formats: home launcher and wedge from 03_Lucru-Surse/lacalut&maximag/1x, the banner rendered
//   from the final PDF (04_Livrabile-finale/lacalut&maximag.pdf, page 6, vector)
// - the 15-second LG banner (05_Foto-Video/TransferNow-20260310IwvaJOL3/10_03_26_Maximag_15s_LG.mp4) and five stills
//   cut from its middle panel (882 x 496)
// - the pack shot (04_Livrabile-finale/Maximag Bisglicinat cutie.png), shown as the product, not claimed as a deliverable
// The two 20-second TV spots on the Adstream estimate of 28.05.2026 (supermarket, bus) are not in the folders, so the
// page neither shows nor names them. No results, no quotes, no media plan.
const m = (p) => "m:" + p;
const R_LG = 1280 / 330; // the LG animated banner: 1920 x 496 at the source, 1280 x 330 here

export const MAXIMAG = {
  slug: "maximag",
  name: "Maximag",
  tagline: "Maximag Bisglicinat on LG Smart TV home screens: three still formats and a 15-second banner with a short story in it.",
  desc: "Maximag Bisglicinat: Smart TV ads for LG home screens and a 15-second animated banner for a magnesium supplement in the Zdrovit portfolio. By Cromatic Studios, 2026.",
  title: "A busy aisle, switched off.",
  accent: { bg: "#091D61", fg: "#ffffff", ink: "#D71E3E" },
  info: ["Magnesium supplement, Maximag Bisglicinat", "Romania · 2026", "Smart TV ads, motion"],
  cover: { img: m("maximag/launcher") },
  og: m("maximag/banner"),
  hero: { video: m("maximag/film"), poster: m("maximag/film-poster"), r: R_LG, fixed: false, alt: "The animated Maximag Bisglicinat banner: the logo and Agitație: OFF, Relaxare: ON on the left, a man in a supermarket in the middle, the claims and the box on the right" },
  problem: {
    h: "A long name, a small screen",
    p: [
      "Maximag Bisglicinat is a magnesium supplement sold in pharmacies. Its box leads with <strong>1000 mg</strong> of magnesium bisglycinate and vitamin B6, in 60 film-coated tablets.",
      "Round that number sit four more claims: a chelated form, high bioavailability, no lactose, no gluten. The LG Smart TV home screen gives them little room: a 300 x 250 tile, a 970 x 250 strip and a 1440 x 1080 wedge with a slanted edge.",
      "Every claim had to stay readable from the sofa, still and in motion."
    ]
  },
  solution: {
    h: "Navy, red and one glass bubble",
    p: "The layouts take their colours from the box. The name stands in navy on white, high bioavailability gets a navy field, no lactose and no gluten a red one. The dose sits in a glass bubble, the one the box already uses, so 1000 mg is the first thing you read.",
    stat: "4",
    statText: "formats for one home screen: tile, strip, wedge and a 15-second banner"
  },
  chapters: [
    {
      pillar: "marketing",
      pills: ["Smart TV", "ads"],
      text: "Three still formats for LG home screens. The 300 x 250 home launcher splits into four fields round the bubble: the box, the bioavailability claim, no lactose and no gluten, the logo. The 970 x 250 banner reads left to right, from the box through the claims to the logo. The wedge stacks the same bands down a slanted card, with the box at the foot.",
      deliverables: ["Home launcher", "Banner", "Wedge"],
      media: [
        { row: [
          { img: m("maximag/launcher"), alt: "The home launcher: the Maximag Bisglicinat box on white, Biodisponibilitate ridicată on navy, 1000 mg magneziu bisglicinat in a glass bubble, Fără lactoză and Fără gluten on red, the logo on white" },
          { img: m("maximag/wedge"), alt: "The wedge: a slanted card with Magneziu Bisglicinat and the 1000 mg bubble on navy, the claims in bands, the logo and the box below" }
        ], cap: "Home launcher, 300 x 250, and wedge, 1440 x 1080" },
        { img: m("maximag/banner"), alt: "The banner: the box on the left, the 1000 mg bubble and Magneziu Bisglicinat, Biodisponibilitate ridicată on navy, Fără lactoză and Fără gluten on red, the logo on the right", cap: "Banner, 970 x 250" }
      ]
    },
    {
      pillar: "video",
      pills: ["Fifteen", "seconds"],
      text: "A 15-second animated banner, 1920 x 496. The logo and the line, “Agitație: OFF. Relaxare: ON.”, hold the left. The claims, then a QR code, hold the right. In the middle a short story plays out. A man walks through a sunlit forest with a basket and lands in a busy supermarket. His shopping list flies past, then his day: the gym, the office, the traffic, the school run. The box cuts in, the claims follow, and he ends up smiling over the fruit.",
      deliverables: ["Animated banner", "15 seconds", "1920 x 496"],
      media: [
        {
          rail: ["The", "story"],
          items: [
            { img: m("maximag/still-forest"), alt: "A man in a checked shirt walks through a sunlit forest with a wicker basket" },
            { img: m("maximag/still-list"), alt: "The same man in a supermarket aisle, the words Cafea, Lapte, Ulei, Ceai, Biscuiți and Servețele around him" },
            { img: m("maximag/still-day"), alt: "Seen from above, he stands still in the aisle while Mers la sală, Treabă la birou, Trafic intens and De luat copiii de la școală circle him" },
            { img: m("maximag/still-box-in"), alt: "The Maximag Bisglicinat box flies in front of his face" },
            { img: m("maximag/still-smile"), alt: "He smiles over the fruit, the box beside him, with Disponibil în farmacii and Agitație: OFF, Relaxare: ON" }
          ],
          cap: "Five moments from the middle of the banner"
        }
      ]
    }
  ],
  result: {
    text: "One box, one line and a short story, cut to every format the home screen asks for.",
    media: [{ img: m("maximag/box"), contain: true, bg: "#000000", alt: "The Maximag Bisglicinat box: 1000 mg magneziu bisglicinat, Vit. B6, 60 comprimate filmate" }]
  },
  related: ["lacalut", "litorsal", "help-4-brain"]
};
