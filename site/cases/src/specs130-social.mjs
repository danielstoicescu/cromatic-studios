// r130: Printoteca and Sticker Republic, sister brands from the same founders (Sabina and Răzvan).
// Cromatic made their Instagram content: reels and carousels (social content, strategy and design).
// Facts come from Printoteca's own deck (pages 0-4: logo, founders, mission and vision, values, services) and from
// what the reels and the carousel actually show. The deck's internal statistics are left out on purpose.
// Printoteca reels are 38 s excerpts (the start of each song), re-encoded with avconvert PresetMediumQuality (320x568);
// the Sticker Republic reels are the full episodes at 360x640.
const m = (p) => "m:" + p;
const R = 0.5625; // 9:16 reels

const ptReel1 = { video: m("printoteca/reel-stop-production"), poster: m("printoteca/reel-stop-production-poster"), r: R, alt: "A woman with a guitar sings in the studio, in front of a rail of coloured tees; the lyrics run on screen in Romanian" };
const ptReel2 = { video: m("printoteca/reel-print-graphics"), poster: m("printoteca/reel-print-graphics-poster"), r: R, alt: "A guitar song about print artwork, sung in the studio and on the stairs of the print atelier" };
const ptCarousel = { img: m("printoteca/carousel-layering"), alt: "Carousel cover on lined paper with a neon green highlighter stroke: Cum să-ți construiești un outfit, Layering 101, Sezonul AW 2025, Powered by Printoteca" };

export const PRINTOTECA = {
  slug: "printoteca",
  name: "Printoteca",
  tagline: "Print on demand with no minimum orders, sung out loud from the atelier.",
  desc: "Printoteca: Instagram reels and carousels for a print-on-demand hub with no minimum orders, the creative enabler. Social content, strategy and design by Cromatic Studios, Bucharest.",
  title: "Printed one by one. Sung out loud.",
  accent: { bg: "#F21FBF", fg: "#111111", ink: "#b0008a" },
  info: ["Print on demand, no minimum orders", "Romania · Instagram", "Social content, strategy and design"],
  cover: { img: m("printoteca/deck-cover") },
  og: m("printoteca/deck-cover"),
  hero: [ptReel1, { ...ptCarousel, hideSm: true }, { ...ptReel2, hideSm: true }],
  problem: {
    h: "A print hub for anyone with an idea",
    p: [
      "Printoteca is a <strong>print-on-demand</strong> hub with <strong>no minimum orders</strong>. Tees and hoodies are printed one by one, for people and for companies, and shops on Shopify, WooCommerce and Etsy can sell them without holding stock.",
      "Its founders, Sabina and Răzvan, also co-founded Sticker Republic, T-Shirt Van and Hello Yellow. Their mission is to <strong>make creativity tangible</strong>, with print, print advice and print on demand under one roof.",
      "The brand calls itself <strong>the creative enabler</strong>. On Instagram, we set out to show the people, the atelier and the machines behind every order."
    ],
    media: [{ img: m("printoteca/deck-cover"), alt: "The Printoteca logo and the line The creative enabler, on a soft gradient of coral, pink and blue", cap: "Printoteca, the creative enabler: the cover of the company's own deck" }],
    quote: { text: "We want anyone with an idea to be able to produce it, test it and deliver it.", cite: "Printoteca's values, creative accessibility (translated from Romanian)" }
  },
  solution: {
    h: "Content made in the atelier",
    p: "We built the social content around the place where the prints happen: songs sung among the clothes rails and the printers, and carousels that are useful before they are promotional.",
    stat: "One by one",
    statText: "tees and hoodies, printed with no minimum order"
  },
  chapters: [
    {
      pillar: "marketing",
      pills: ["Instagram", "reels"],
      text: "Two reels, two songs. A guitar, a mic and a rail of coloured tees set the stage. The cuts go to the office desk, the atelier stairs and the printing floor. The lyrics run on screen in Romanian, karaoke style, so each reel works with the sound off too.",
      deliverables: ["Content strategy", "Instagram reels", "On-screen lyrics", "Social media"],
      media: [
        { statement: "Oprește producția!", sub: "“Stop production!” The line the first reel keeps coming back to.", bg: "#F21FBF", fg: "#111111" },
        { row: [
          { ...ptReel1, cap: "“Mi-ai dat un mesaj”: a message comes in, she runs into the atelier and calls to stop production" },
          { ...ptReel2, cap: "“Grafica de la print”: a song about the artwork people send to print, from a cat to a lollipop" }
        ] }
      ]
    },
    {
      pillar: "marketing",
      pills: ["Instagram", "carousels"],
      text: "Carousels in a hand-made spirit: lined paper, a highlighter stroke, a doodled light bulb and a taped note. Layering 101 for the AW 2025 season is a style guide first. Printoteca signs it on the note: powered by Printoteca.",
      deliverables: ["Carousel design", "Editorial topics", "Social media design"],
      media: [
        { field: "#FFD018", fg: "#111111", items: [ptCarousel], cap: "“How to build an outfit. Layering 101”, for the AW 2025 season" }
      ]
    }
  ],
  result: {
    text: "A feed with a voice of its own: songs from the atelier, guides worth saving, and print with no minimum order behind every post."
  },
  related: ["sticker-republic", "help-4-brain", "routine-paris"]
};

const srEp = (i, alt, cap) => ({ video: m(`sticker-republic/zodiac-${i}`), poster: m(`sticker-republic/zodiac-${i}-poster`), r: R, alt, cap });
const srEps = [
  srEp(1, "Sticker Zodiac: the host, in a green bob wig, holds a bowl to her ear at a red table set with duck figurines, skulls and a candle", "She listens to a bowl like a seashell, then reads with a sticker in hand"),
  srEp(2, "Sticker Zodiac: the host eats a banana and holds a small sticker up to the camera", "A banana, a tiny sticker held up to the camera, and a straight face"),
  srEp(3, "Sticker Zodiac: a cartoon lion pops out of the duck dish, and later a sticker goes on the host's forehead", "A cartoon lion pops out of the duck dish. Later, a sticker goes on her forehead")
];

export const STICKER = {
  slug: "sticker-republic",
  name: "Sticker Republic",
  tagline: "Stickers for everything and everyone, and a zodiac read in stickers on Instagram.",
  desc: "Sticker Republic: Instagram content for a sticker brand, with the Sticker Zodiac reel series. Social content, strategy and design by Cromatic Studios, Bucharest.",
  title: "Stickers for everything and everyone.",
  accent: { bg: "#FFD21F", fg: "#111111", ink: "#8a6a00" },
  info: ["Stickers", "A sister brand of Printoteca", "Social content, strategy and design"],
  cover: { img: m("sticker-republic/wall") },
  og: m("sticker-republic/wall"),
  hero: [{ ...srEps[0], cap: undefined }, { img: m("sticker-republic/phone"), alt: "Two miniature figures smooth a round Sticker Republic smiley sticker onto the back of a blue phone", hideSm: true }, { img: m("sticker-republic/wall"), alt: "A wall covered edge to edge in stickers of every style", hideSm: true }],
  problem: {
    h: "A sticker for everything",
    p: [
      "Sticker Republic makes <strong>stickers for everything and everyone</strong>.",
      "It is a sister brand of <strong>Printoteca</strong>, from the same founders, Sabina and Răzvan, who also co-founded T-Shirt Van and Hello Yellow.",
      "A sticker is small and easy to scroll past. On Instagram, the brand needed content as <strong>playful</strong> as the stickers."
    ]
  },
  solution: {
    h: "Sticker Zodiac",
    p: "We gave the feed a recurring series: a host in a green bob, a red table of ducks, skulls and candles, and a horoscope read through stickers.",
    stat: "One sign at a time",
    statText: "a reel series where the zodiac meets stickers"
  },
  chapters: [
    {
      pillar: "marketing",
      pills: ["Sticker", "Zodiac"],
      text: "Each episode opens on the same title card and the same set: pink light, a red table, duck figurines and a candle. The host peels stickers, holds them up, sticks one on her forehead, and lets cut-out pictures pop up beside her. One set you recognise in a frame, built to be followed.",
      deliverables: ["Content strategy", "Series format", "Instagram reels", "Title design", "Social media"],
      media: [
        { rail: ["Sticker", "Zodiac"], items: srEps, cap: "Three episodes of Sticker Zodiac, made for Instagram reels" }
      ]
    },
    {
      pillar: "marketing",
      pills: ["Social", "visuals"],
      text: "Alongside the reels, stills show the product at work. Two tiny figures smooth the Sticker Republic smiley onto the back of a phone, like a crew putting up a billboard. Next to it, a wall of stickers layered edge to edge.",
      deliverables: ["Social media design", "Key visuals"],
      media: [
        { field: "#FFD21F", fg: "#111111", items: [{ img: m("sticker-republic/phone"), alt: "Two miniature figures smooth a round Sticker Republic smiley sticker onto the back of a blue phone" }, { img: m("sticker-republic/wall"), alt: "A wall covered edge to edge in stickers of every style" }], cap: "The Sticker Republic smiley, applied by a very small crew, and stickers on stickers, edge to edge" }
      ]
    }
  ],
  result: {
    text: "A sticker brand with a recurring cast, a set you know in one frame, and a series to follow sign by sign."
  },
  related: ["printoteca", "pain-plaisir", "casa-berero"]
};
