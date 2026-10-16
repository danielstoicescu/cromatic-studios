// r179 (Daniel): Darya Hope and Tracy J, from the studio's own decks "[Darya Hope] The Core." (slides 11-20) and
// "[Tracy] The Core. Cromatic Studios." (slides 51-76). The pictures are those slides (embedded images where a slide
// is one picture, the slide itself where it is a layout). The words come from the decks too: the value proposition and
// the archetype from each Core, the social media topic and the video line from Darya Hope's slides, the CTA, the
// section names and the product names from Tracy's. No quotes, numbers or results of our own; captions stay plain.
const m = (p) => "m:" + p;

export const DARYA = {
  slug: "darya-hope",
  name: "Darya Hope",
  tagline: "The Core of a science based skincare brand, ideas for its social media and the Rescue Drops packaging.",
  desc: "Darya Hope: brand strategy (The Core), social media concepts and packaging for Rescue Drops, shampoos and conditioners, for a science based skincare brand. By Cromatic Studios.",
  title: "Science based skincare.",
  accent: { bg: "#2a68a6", fg: "#ffffff", ink: "#1f4f80" },
  info: ["Skincare", "Brand strategy · The Core", "Social media · Packaging"],
  cover: { img: m("darya-hope/rescue-bottles") },
  og: m("darya-hope/rescue-bottles"),
  hero: { img: m("darya-hope/rescue-plinth"), alt: "Rescue Drops bottles and their box on a black plinth, next to an unfolded insert" },
  problem: {
    h: "The Core first",
    p: [
      "Darya Hope makes skincare products.",
      "We started from <strong>the Core</strong>: brand attributes, an archetype and a manifesto. Then the topics for social media, and the packaging."
    ],
    quote: { text: "Darya Hope provides skincare products to conscious customers in a science based environment with a knowledgeable &amp; transparent voice. Helping them transform their skin and feel confident.", cite: "The Core, the value proposition" }
  },
  solution: {
    h: "A sage caregiver",
    p: "Darya Hope’s personality is a sage caregiver. The first topic for social media: the importance of choosing the right ingredients when formulating skin care products.",
    stat: "Sage caregiver",
    statText: "Darya Hope’s personality, from the Core"
  },
  chapters: [
    {
      pillar: "marketing",
      pills: ["Ingredient", "carousels"],
      text: "The importance of choosing the right ingredients, in Instagram carousels: mandelic acid, why it matters, its benefits, and the verdict.",
      deliverables: ["Instagram carousels", "Social media design"],
      media: [
        { img: m("darya-hope/carousel-grid"), alt: "Six carousel slides about mandelic acid: the Verdict cover, the molecule, why does this matter, benefits and the verdict Good, next to a phone showing the post", cap: "The carousel" },
        { img: m("darya-hope/carousel-spread"), alt: "The same carousel laid out in a row, with the post open on a phone", cap: "On Instagram" }
      ]
    },
    {
      pillar: "video",
      pills: ["Science", "videos"],
      text: "Simple but compelling videos, hosted by a female scientist, that show how the products actually work.",
      deliverables: ["Video concept", "IG reels"],
      media: [
        { img: m("darya-hope/video-concept"), alt: "Two phones: a scientist holding a test tube, and the Rescue Drops post in an Instagram feed", cap: "Rescue Drops, on Instagram" }
      ]
    },
    {
      pillar: "product",
      pills: ["Rescue", "Drops"],
      text: "Rescue Drops, for acne, hyperpigmentation and ageing skin: a mark, the bottle, the box and its insert, in five colours.",
      deliverables: ["Product mark", "Packaging", "Dielines", "Colourways"],
      media: [
        { row: [
          { img: m("darya-hope/rescue-mark"), alt: "The Rescue Drops mark: a drop above the name" },
          { img: m("darya-hope/rescue-dielines"), alt: "The Rescue Drops box, its flat dieline and the bottle label" }
        ] },
        { img: m("darya-hope/rescue-colourways"), alt: "Five Rescue Drops box fronts: mandelic acid in blue, lilac, teal and sage, and oil control in red", cap: "Five colours" },
        { img: m("darya-hope/rescue-range"), alt: "Rescue Drops bottles and boxes in a row, on a black shelf" }
      ]
    },
    {
      pillar: "product",
      pills: ["Hair", "care"],
      text: "The same system on the shampoos and conditioners: Amino Acid, Bakuchi and Sunflower.",
      deliverables: ["Packaging"],
      media: [
        { img: m("darya-hope/hair-care"), alt: "Darya Hope shampoo and conditioner bottles: Amino Acid Shampoo, Bakuchi Shampoo and Sunflower Conditioner" }
      ]
    }
  ],
  result: {
    text: "The Core, the topics for social media, and one packaging system, from Rescue Drops to the shampoos and conditioners.",
    media: [{ img: m("darya-hope/rescue-bottles"), alt: "Rescue Drops bottles in five colours in front of their boxes" }]
  },
  related: ["tracy-j", "toskani-med", "routine-paris"]
};

export const TRACY = {
  slug: "tracy-j",
  name: "Tracy J",
  tagline: "The Core of a skincare brand with a joyous voice, its visual identity, packaging and brand universe.",
  desc: "Tracy J Skincare: brand strategy (The Core), visual identity, packaging for seven product categories and the brand universe. By Cromatic Studios.",
  title: "Get your glow on!",
  accent: { bg: "#f08751", fg: "#111111", ink: "#b4531f" },
  info: ["Skincare", "Brand strategy · The Core", "Visual identity · Packaging"],
  cover: { img: m("tracy-j/jar-pink") },
  og: m("tracy-j/jar-pink"),
  hero: { img: m("tracy-j/boxes-orange"), alt: "Delightful Experience boxes in shades of orange, tilted on an orange background" },
  problem: {
    h: "The Core first",
    p: [
      "Tracy J. Skincare makes skincare products.",
      "We started from <strong>the Core</strong>: brand attributes, the archetype, the customers’ profile and the priorities. Then the visual identity, the packaging and the brand universe."
    ],
    quote: { text: "Tracy J. Skincare provides skincare products to positive customers in a loving environment with a joyous voice. Helping them gain a healthy glow and feel inspired.", cite: "The Core, the value proposition" }
  },
  solution: {
    h: "Caregiver and Innocent",
    p: "Tracy J Skincare’s archetype is a mix of Caregiver and Innocent. The logo carries a heart.",
    stat: "7",
    statText: "product categories, each in its own colour"
  },
  chapters: [
    {
      pillar: "brand",
      pills: ["Visual", "identity"],
      text: "The wordmark with a heart, in two variations, each with its tj monogram, and a palette of glow colours.",
      deliverables: ["Logo", "Monogram", "Colour palette"],
      media: [
        { row: [
          { img: m("tracy-j/logo-v1"), alt: "The Tracy skincare wordmark in purple, with a heart" },
          { img: m("tracy-j/monogram-v1"), alt: "The tj monogram in purple" }
        ], cap: "Variation 1" },
        { row: [
          { img: m("tracy-j/logo-v2"), alt: "The Tracy skincare wordmark in orange, with a heart" },
          { img: m("tracy-j/monogram-v2"), alt: "The monogram in orange" }
        ], cap: "Variation 2" },
        { img: m("tracy-j/glow-palette"), alt: "The word glow in five colours, on tiles of each", cap: "Colours" }
      ]
    },
    {
      pillar: "product",
      pills: ["Product", "categories"],
      text: "Seven product categories, each in its own colour: Blissful Anti Aging, Delightful Experience, Pure Radiance, Youthful Expression, Fall in Love, Self-care Habits and Glowing Beauty.",
      deliverables: ["Packaging", "Product categories"],
      media: [
        { img: m("tracy-j/range"), alt: "Tracy J bottles, a dropper and a jar in a row, in orange, green, yellow, pink and teal" },
        { rail: ["Seven", "categories"], items: [
          { img: m("tracy-j/cat-anti-aging"), alt: "Blissful Anti Aging: teal boxes and their dieline", cap: "Blissful Anti Aging" },
          { img: m("tracy-j/cat-delightful"), alt: "Delightful Experience: five boxes in shades of orange", cap: "Delightful Experience" },
          { img: m("tracy-j/cat-radiance"), alt: "Pure Radiance: yellow boxes", cap: "Pure Radiance" },
          { img: m("tracy-j/cat-youthful"), alt: "Youthful Expression: olive green boxes", cap: "Youthful Expression" },
          { img: m("tracy-j/cat-fall-in-love"), alt: "Fall in Love: a red box", cap: "Fall in Love" },
          { img: m("tracy-j/cat-self-care"), alt: "Self-care Habits: a pink box", cap: "Self-care Habits" },
          { img: m("tracy-j/cat-glowing"), alt: "Glowing Beauty: pink and magenta boxes", cap: "Glowing Beauty" }
        ] }
      ]
    },
    {
      pillar: "brand",
      pills: ["Brand", "universe"],
      text: "The boxes, jars and bottles in the brand universe.",
      deliverables: ["Packaging", "Brand universe"],
      media: [
        { img: m("tracy-j/boxes-open"), alt: "An open Delightful Experience box and an open Blissful Anti Aging box" },
        { row: [
          { img: m("tracy-j/jar-pink"), alt: "A pink Self-care Habits jar and its lid with the monogram, next to a sprig of leaves" },
          { img: m("tracy-j/box-arch"), alt: "A teal Blissful Anti Aging box in the shadow of an arch" }
        ] },
        { row: [
          { img: m("tracy-j/box-young-vibes"), alt: "Young Vibes boxes in olive green" },
          { img: m("tracy-j/box-radiance"), alt: "Pure Radiance box, front and back, in yellow" }
        ] },
        { img: m("tracy-j/box-aging"), alt: "Two teal Blissful Anti Aging boxes in the air" }
      ]
    }
  ],
  result: {
    text: "The Core, an identity with a heart in it, and seven product categories, from the box to the brand universe.",
    media: [{ img: m("tracy-j/monogram-black"), alt: "The tj monogram in black" }]
  },
  related: ["darya-hope", "toskani-med", "routine-paris"]
};
