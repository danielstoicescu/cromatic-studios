// r129: two pages about the studio itself: the Eliade 18 floor, and the pop-up there for Romanian Design Week 2023.
// Facts from Daniel (Cromatic Studios) and the photos; RDW 2023 ran in May 2023 under the theme CONNECTIONS.
const m = (p) => "m:" + p;
export const STUDIO_PAGES = [
  {
    slug: "eliade-18",
    name: "Eliade 18",
    tagline: "Our floor in Eliade Tower: more room, more people, the first proper studio.",
    desc: "Eliade 18: the Cromatic Studios floor in Eliade Tower, Bucharest, from 2019. The open studio, the walls we drew on, the long table where we lay out the work, and the team.",
    title: "Eliade 18, our studio floor.",
    accent: { bg: "#F65342", fg: "#ffffff", ink: "#c2321f" },
    info: ["Our studio", "Bulevardul Mircea Eliade 18, Bucharest", "From 2019"],
    cover: { img: m("eliade-18/studio-024") },
    og: m("eliade-18/studio-024"),
    hero: { img: m("eliade-18/studio-000"), alt: "The open studio floor in Eliade Tower, desks by the long windows" },
    problem: {
      h: "A floor of our own",
      p: [
        "After the attic on Călinescu, Eliade Tower gave us <strong>a whole open floor</strong> in a long 1970s office slab: windows end to end, concrete ceilings and room to grow.",
        "It was the first place that felt like <strong>a proper studio</strong>: desks for everyone, a wall to draw on, a long table for reviews and a corner for coffee."
      ],
      media: [{ img: m("eliade-18/studio-024"), alt: "The Cromatic Studios team on a white backdrop", cap: "The crew, Eliade 18" }]
    },
    solution: {
      h: "Room to work, room to play",
      p: "We filled it with yellow, plants, shelves of things we love, a swing and a mural of the studio's characters, and we kept the middle of the floor clear for the work.",
      stat: "2019",
      statText: "the year we moved in"
    },
    chapters: [
      {
        pillar: "brand",
        pills: ["The", "floor"],
        text: "Desks along the windows, the mural wall, the long review table, a lounge corner and a swing in the middle of the room.",
        deliverables: ["Studio", "Mural", "Reviews", "Coffee"],
        media: [
          { row: [{ img: m("eliade-18/studio-005"), alt: "The mural wall with the Cromatic Studios characters" }, { img: m("eliade-18/studio-006"), alt: "Working under the Cromatic Studios lettering" }] },
          { img: m("eliade-18/studio-007"), alt: "Prints laid out along the long table for a review", cap: "A review: every page of a project laid out on the long table" },
          { rail: ["The", "studio"], items: [
            { img: m("eliade-18/studio-004"), alt: "The team at their desks" },
            { img: m("eliade-18/studio-023"), alt: "The swing in the middle of the floor" },
            { img: m("eliade-18/studio-010"), alt: "A sunny desk by the window" },
            { img: m("eliade-18/studio-012"), alt: "The lounge corner" },
            { img: m("eliade-18/studio-009"), alt: "Shelves of objects and books" },
            { img: m("eliade-18/studio-015"), alt: "The long corridor of the floor" },
            { img: m("eliade-18/studio-016"), alt: "Mockups on a desk" },
            { img: m("eliade-18/studio-025"), alt: "The coffee corner, with Two Minutes bags" },
            { img: m("eliade-18/studio-019"), alt: "A coffee by the window" }
          ], cap: "Days on the floor" },
          { row: [{ img: m("eliade-18/studio-001"), alt: "Four of us in beanies against the yellow wall" }, { img: m("eliade-18/studio-002"), alt: "Joking around by the yellow wall" }], cap: "The yellow wall" }
        ]
      }
    ],
    result: { text: "The floor where the studio grew up, and where in 2023 we opened the doors for Romanian Design Week." },
    related: ["rdw-2023", "craft-coffee", "unchain-festival"]
  },
  {
    slug: "rdw-2023",
    name: "RDW 2023 · AI pop-up",
    tagline: "Romanian Design Week 2023: our floor as a pop-up space, and a talk about using AI in design.",
    desc: "Cromatic Studios at Romanian Design Week 2023: the Eliade 18 studio opened as a pop-up space, with a talk about using AI in design, early, in 2023. Posters, stickers, cups and visitors.",
    title: "AI, early. RDW 2023.",
    accent: { bg: "#7B4FD6", fg: "#ffffff", ink: "#5a32b0" },
    info: ["Romanian Design Week 2023", "Eliade 18, Bucharest · May 2023", "Pop-up space, talk, posters, stickers, merch"],
    cover: { img: m("rdw-2023/rdw-004") },
    og: m("rdw-2023/rdw-004"),
    hero: { img: m("rdw-2023/rdw-004"), alt: "AI stickers and a red AI poster on a grey table" },
    problem: {
      h: "Open doors, one question",
      p: [
        "Romanian Design Week 2023 ran in May under the theme <strong>CONNECTIONS</strong>, with events spread across Bucharest.",
        "We opened our Eliade 18 floor as <strong>a pop-up space</strong> and talked about the question everyone was starting to ask: <strong>how do you use AI in design</strong>, and what does it change for the people who do it?"
      ],
      media: [{ row: [{ img: m("rdw-2023/rdw-001"), alt: "Two visitors with an AI tote bag against the yellow wall" }, { img: m("rdw-2023/rdw-007"), alt: "Coffee bags and AI cups" }] }]
    },
    solution: {
      h: "Pioneers, a little",
      p: "In 2023 AI in design was still new to most studios. We put it on posters, stickers, tote bags and cups, and on the screens around the floor, and talked openly about how we were already using it.",
      stat: "2023",
      statText: "AI in design, before it was everywhere"
    },
    chapters: [
      {
        pillar: "brand",
        pills: ["The", "pop-up"],
        text: "A loud purple, red and lime system for one word, AI: posters, stickers, totes and cups, and the studio open to anyone who walked in.",
        deliverables: ["Pop-up space", "Talk", "Posters", "Stickers", "Merch"],
        media: [
          { statement: "AI. Curaj. Energie.", sub: "Courage, energy: the words on the posters.", bg: "#7B4FD6", fg: "#ffffff" },
          { rail: ["The", "visitors"], items: [
            { img: m("rdw-2023/rdw-000"), alt: "Visitors walking through the studio" },
            { img: m("rdw-2023/rdw-002"), alt: "Talking by the shelves" },
            { img: m("rdw-2023/rdw-005"), alt: "Visitors on the floor" },
            { img: m("rdw-2023/rdw-009"), alt: "A conversation in the middle of the room" },
            { img: m("rdw-2023/rdw-008"), alt: "Resting on the sofa" },
            { img: m("rdw-2023/rdw-010"), alt: "A visitor at the screens" },
            { img: m("rdw-2023/rdw-011"), alt: "Showing the work on a screen" }
          ], cap: "Romanian Design Week at Eliade 18" }
        ]
      }
    ],
    result: { text: "A pop-up that put AI on the table for designers in 2023, a little ahead of everyone else." },
    related: ["eliade-18", "unchain-festival", "craft-coffee"]
  }
];
