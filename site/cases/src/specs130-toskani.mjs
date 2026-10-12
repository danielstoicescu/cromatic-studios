// r130: Toskani MED, built from the studio's own deck "[TOSKANI] The Core. Cromatic Studios." (2023)
// and "toskani med - visual directions". Facts come from those decks only.
// The conference booth slides are third-party reference moodboards: left out. r130m: per Daniel, nothing from the
// visual directions deck; from The Core only the positioning, in words; the pictures are the packaging.
const m = (p) => "m:" + p;

export const TOSKANI = {
  slug: "toskani-med",
  name: "Toskani MED",
  tagline: "The Core of an aesthetic medicine brand for caring doctors, and the packaging that grows out of it.",
  desc: "Toskani MED: brand strategy (The Core), positioning, archetype and packaging concepts for a Barcelona aesthetic medicine company that works with doctors. By Cromatic Studios, Bucharest, 2023.",
  title: "Designed by the skin architects.",
  accent: { bg: "#FBAB2F", fg: "#111111", ink: "#9a5a00" },
  info: ["Aesthetic medicine, for doctors", "Barcelona · 2023", "Brand strategy, positioning, packaging"],
  cover: { img: m("toskani/pack-v1-colourways") },
  og: m("toskani/pack-v1-trio"),
  hero: { img: m("toskani/pack-v1-trio"), alt: "Three TKN HA 3 boxes with fine rising lines: taupe, white, and white with a taupe panel" },
  problem: {
    h: "A new range, a name to define",
    p: [
      "Toskani MED is a <strong>Barcelona-based</strong> aesthetic medicine company. It offers non-invasive treatments to doctors, and its products are for professional use only.",
      "New product ranges were on the way. The team needed to <strong>decide the image</strong> of Toskani MED, find the difference between Toskani and Toskani MED, and bring every product under one look.",
      "We started where we always start, from <strong>the Core</strong>: positioning and strategy first, then the visual language built on top of it."
    ],
    quote: { text: "Toskani MED offers aesthetic non-invasive solutions to caring doctors in a family environment with an expert voice. Giving them efficacy and making them feel close to us.", cite: "The Core, the unique value proposition" }
  },
  solution: {
    h: "Caregiver first, Sage close behind",
    p: "In the workshop, closeness, expertise and efficacy collected the most votes. They set the archetype: a Caregiver for the relationship and the voice, and a Sage for the medical workshops and the scientific reasoning.",
    stat: "60 / 40",
    statText: "Caregiver and Sage, the archetype mix behind the brand"
  },
  chapters: [
    {
      pillar: "brand",
      pills: ["The", "Core"],
      text: "One sentence for the value proposition and an archetype mix: a Caregiver for the relationship, a Sage for the science. And one line that every box should carry, the X factor from the workshop.",
      deliverables: ["Brand attributes", "Value proposition", "Archetype", "Positioning"],
      media: [
        { statement: "Designed by the skin architects in Barcelona.", sub: "The X factor from the workshop, written to go on the pack.", bg: "#FBAB2F", fg: "#111111" },
        { img: m("toskani/pack-v1-front-back"), alt: "Front and back of a textured taupe TKN HA 3 box", cap: "The line, on the box" }
      ]
    },
    {
      pillar: "brand",
      pills: ["Layers of", "beauty"],
      text: "Visual concept 1 starts from the layers of the skin and from trencadís, Gaudí's broken-tile craft. Customised tiling becomes customised aesthetics, fitted to each specific need. On paper that means a grid, geometry, transparency, warm colours and natural light photography.",
      deliverables: ["Visual concept", "Layer system", "Packaging"],
      media: [
        { img: m("toskani/pack-layers"), alt: "White TKN HA 3 boxes with orange stacked planes inside a thin grid", cap: "TKN HA 3 in Layers of beauty: a clean grid, warm layers inside" }
      ]
    },
    {
      pillar: "brand",
      pills: ["Body", "lines"],
      text: "Visual concept 2 follows lines: of the body and face, of what the product does, and of Barcelona. Traced over the Sagrada Família, the same fine lines rise like its towers.",
      deliverables: ["Visual concept", "Line system"],
      media: [
        { img: m("toskani/lines-sagrada"), alt: "White lines on a sparkling taupe surface, next to the Sagrada Família silhouette traced with the same lines", cap: "From the towers to the box" }
      ]
    },
    {
      pillar: "product",
      pills: ["The", "packaging"],
      text: "Body Lines in two variations for TKN HA 3. Variation #1 draws the lines as fine stems on taupe, white or silver grey, in white or orange. Variation #2 softens them into a waist of thin strokes on white, with a small skin-layer icon. Every box carries the same line: designed by the skin architects in Barcelona.",
      deliverables: ["Packaging", "Front and back", "Colourways", "Variation #1", "Variation #2"],
      media: [
        { img: m("toskani/pack-v1-colourways"), alt: "Two silver-grey TKN HA 3 boxes, one with orange lines, one with white lines", cap: "Variation #1 on silver grey, with orange or white lines" },
        { img: m("toskani/pack-v2"), alt: "Variation #2: white TKN HA 3 boxes with soft taupe strokes, front and back", cap: "Variation #2, front and back" }
      ]
    }
  ],
  result: {
    text: "A Core to build on: a caring, expert voice for doctors, and two ways to put it on a box, layers of skin or lines of the body, both signed by the skin architects in Barcelona.",
    media: [{ img: m("toskani/recap"), alt: "Short recap: the Layers of beauty box next to Body Lines Variation #1 and Variation #2", cap: "Short recap: Layers of beauty, and Body Lines in two variations" }]
  },
  related: ["elithia", "routine-paris", "altius"]
};
