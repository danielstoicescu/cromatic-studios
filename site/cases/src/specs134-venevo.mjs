// r134: Venevo, built from the studio's own deck "Venevo's Branding Process" (two creative directions,
// UnBlurred Clarity and Evolve) and "Brand Guidelines_Venevo (culori corecte)", plus the landing page,
// the MacBook mockup and the social grid from Daniel's Drive. Facts come from that material only.
// Left out on purpose: the moodboard slides (3 and 15) and their GIFs, which are third-party references.
// The animations are the deck's own GIFs (slides 16-19), re-encoded as animated WebP at 1600 px.
const m = (p) => "m:venevo/" + p;

export const VENEVO = {
  slug: "venevo",
  name: "Venevo",
  tagline: "A dynamic brand for fractional startup investing. Fourteen ways to write one name.",
  desc: "Venevo: brand positioning, two creative directions, a dynamic logo with fourteen letter alternatives, brand guidelines, website and key visuals for a fractional startup investing platform. By Cromatic Studios, Bucharest.",
  title: "Now you can.",
  accent: { bg: "#7A5EAC", fg: "#ffffff", ink: "#40325E" },
  info: ["Fractional startup investing", "For investors and creators", "Positioning, identity, guidelines, website"],
  cover: { img: m("d2-universe") },
  og: m("d2-universe"),
  hero: { img: m("d2-site-anim"), alt: "The Venevo homepage: Venture Opportunity in large type over a purple star that turns and changes shape" },
  problem: {
    h: "Startups, opened up to everyone",
    p: [
      "Venevo is a platform for <strong>fractional startup investing</strong>. Investors browse the listings and back the projects they believe in. Entrepreneurs come to <strong>get funding</strong> for theirs.",
      "It needed a brand that speaks to both sides, and a visual identity that could keep up with a market that never stands still.",
      "We started from <strong>positioning</strong>: the archetype, the brand attributes and one sentence for the value proposition. Venevo offers transformative ventures to visionary customers, and makes them feel <strong>enabled</strong>. Then we drew two creative directions on top of it."
    ],
    quote: { text: "At Venevo, we believe in democratizing the future.", cite: "The Venevo homepage" }
  },
  solution: {
    h: "A Creator, with a Hero beside it",
    p: "The archetype mix is 55% Creator, 37% Hero and 8% Everyman. The culture is empowering, the voice uplifting, the audience visionary. And Venevo's X factor fits in three words: now you can.",
    stat: "14",
    statText: "letter alternatives for one dynamic logo"
  },
  chapters: [
    {
      pillar: "brand",
      pills: ["Direction", "one"],
      text: "UnBlurred Clarity goes from blur to empowering clarity. Growth, resilience and transparency as keywords. Black, purple, grey and blue. See-through surfaces, blur, gradients and glass. The wordmark comes into focus letter by letter, and the letters orbit a single dot.",
      deliverables: ["Creative direction", "Logo study", "Typography and colours", "Stationery", "App and web concepts"],
      media: [
        { statement: "From blur to empowering clarity.", sub: "The concept of the first direction.", bg: "#181818", fg: "#E5E5E4" },
        { img: m("d1-blur"), alt: "The lowercase venevo wordmark in white on black, the last letters still blurred" },
        { row: [
          { img: m("d1-logo-orbit"), alt: "The letters of venevo set in a circle around a black dot" },
          { img: m("d1-logo-stack"), alt: "The wordmark stacked on two lines, ven and evo, with a black dot for the o" }
        ], cap: "The letters orbit the dot, then settle into two lines" },
        { img: m("d1-type-colours"), alt: "Type specimens for Stara and Articulate CF next to swatches: Purple, Metallic Mauve, Metallic Grey, Machine Grey, Off Black and Black", cap: "Stara and Articulate CF, with Purple, Metallic Mauve, Metallic Grey, Machine Grey, Off Black and Black" },
        { rail: ["UnBlurred", "Clarity"], items: [
          { img: m("d1-stationery"), alt: "Black and grey business cards, a lanyard badge and a poster of blurred white dots", cap: "Cards, a badge and a poster of dots coming into focus" },
          { img: m("d1-app"), alt: "Three phone screens: a member card with a QR code, Today News, and a list of listings with prices" , cap: "App screens: a member card, the news, the listings" },
          { img: m("d1-site-hero"), alt: "A light grey homepage with the orbiting logo and the headline Transformative Ventures", cap: "Transformative Ventures, on the homepage" },
          { img: m("d1-site-story"), alt: "Website cards: Our Story, Start Investing, a +400 monthly users tile and a market chart", cap: "Our Story, Start Investing, and a chart of the venture market" },
          { img: m("d1-site-invest"), alt: "Glass cards over a photo: a 20K funding target, a 2025 market share forecast and a Buy Now button", cap: "Glass cards for funding targets and forecasts" }
        ] }
      ]
    },
    {
      pillar: "brand",
      pills: ["Direction", "two"],
      text: "Evolve is about growth, the future and lifting people up. Black, purple and yellow. Flat shapes, cut-outs, illustration, playful type and visuals that point forward. This is the direction Venevo took.",
      deliverables: ["Creative direction", "Logo animation", "Brand sheet"],
      media: [
        { statement: "We are the ever growing future.", sub: "The concept of the second direction.", bg: "#FBE210", fg: "#181818" },
        { img: m("d2-logo-anim"), alt: "The VENEVO wordmark on black, its letters switching between alternative shapes" },
        { img: m("d2-brand-sheet"), alt: "A brand sheet on black: the logo and its notes, a lanyard badge, stickers, phone and web screens, colours and type", cap: "Evolve on one sheet: logo, badge, stickers, screens, colours and type" }
      ]
    },
    {
      pillar: "brand",
      pills: ["The", "logo"],
      text: "A dynamic logo. The letter alternatives stand for Venevo's eclectic mix of investors and creators. The movement reflects a market that keeps changing and the opportunities in it. The short version, V✳, keeps the first and last letters and stands for venture opportunity.",
      deliverables: ["Dynamic logo", "Letter alternatives", "Short logo", "Animated logo", "Clear space"],
      media: [
        { row: [
          { img: m("gl-concept"), alt: "Guidelines page: the VENEVO wordmark with handwritten notes on the dynamic logo" },
          { img: m("gl-logo"), alt: "Guidelines page: the main logo, the venevo.com alternative and the short V✳ logo" }
        ], cap: "The concept, then the main, alternative and short logos" },
        { img: m("d2-v-anim"), alt: "The short V logo on black, its star turning into new shapes" },
        { row: [
          { img: m("gl-logo-alternatives"), alt: "Fourteen versions of the VENEVO wordmark, each with different letter shapes" },
          { img: m("gl-logo-variations"), alt: "Twelve versions of the short V logo, each with a different star or circle" }
        ], cap: "Fourteen wordmarks and twelve short logos. A different one on each material" },
        { img: m("gl-clear-space"), contain: true, bg: "#181818", alt: "Guidelines page: the clear space around each logo version", cap: "Clear space, the same rule for every version" }
      ]
    },
    {
      pillar: "brand",
      pills: ["Colour", "&amp; type"],
      text: "Two families of colour: purples from lilac #C4B0D9 to #221D35, and yellows from #FFF07B to #70631C, on #181818 and #E5E5E4. Neue Machina Inktrap sets the titles, in capitals or lower case. Sora, a Google font in many weights, sets the long text.",
      deliverables: ["Colour system", "Typography", "Text hierarchy"],
      media: [
        { img: m("gl-colours"), contain: true, bg: "#181818", alt: "The colour system: primary purples, yellows, black and light grey, plus supporting colours, each with its hex code", cap: "Primary: #181818, #C4B0D9, #7A5EAC, #40325E, #221D35, #E5E5E4, #FFF07B, #FBE210, #B3A000, #70631C" },
        { row: [
          { img: m("gl-text"), alt: "Guidelines page: the word Enjoy in Neue Machina Inktrap, and Sora for long text" },
          { img: m("gl-fonts"), alt: "Guidelines page: the alphabets of Neue Machina Inktrap Regular and Sora" }
        ], cap: "Neue Machina Inktrap for titles, Sora for long text" }
      ]
    },
    {
      pillar: "product",
      pills: ["The", "website"],
      text: "A dark homepage with a big headline and a star that never sits still. The menu opens on invest, how it works, listings and about us. The landing page speaks to creators and to investors in turn, then goes through security, the minimum investment and liquidity, and ends in the marketplace.",
      deliverables: ["Landing page", "Homepage", "Mobile", "Marketplace"],
      media: [
        { site: { label: "Venevo landing page", d: { img: m("landing-scroll"), scroll: true, alt: "The Venevo landing page, scrolling: for creators, for investors, security, liquidity and the marketplace" } } },
        { img: m("d2-devices-anim"), alt: "The Venevo homepage on desktop and mobile, the purple star turning behind the headline", cap: "Desktop and mobile, the star turning behind the headline" },
        { img: m("macbook"), alt: "A laptop on a dark desk showing the Venevo marketplace table", cap: "The marketplace, on a laptop" },
        { img: m("d2-universe"), alt: "Phone and desktop screens in black and purple next to a grid of social posts", cap: "Phone, desktop and the social grid, side by side" }
      ]
    },
    {
      pillar: "marketing",
      pills: ["Brand", "universe"],
      text: "Square posts in black, purple and yellow, each carrying one idea: now you can, act now and grow, fractional ownership made easy, a new startup listed. Badges, stickers and a QR code bring the same voice off the screen.",
      deliverables: ["Key visuals", "Social posts", "Stickers", "Badges"],
      media: [
        { row: [
          { img: m("social-grid"), alt: "A grid of twelve social posts: V✳, a black star on olive, Now you can, Act now and grow, Fractional ownership made easy, a yellow star" },
          { img: m("gl-key-visuals"), alt: "Guidelines page: key visuals with a crystal, the marketplace screen and social posts" },
          { img: m("gl-visuals"), alt: "Guidelines page: a tablet, lanyard badges, a phone with the marketplace, stickers and a QR card" }
        ], cap: "The social grid, then key visuals and brand visuals from the guidelines" },
        { img: m("gl-now-you-can"), alt: "NOW YOU CAN in large white capitals across two pages", cap: "The X factor, across a spread" }
      ]
    }
  ],
  result: {
    text: "One name that changes shape and stays recognisable. Thirty-two pages of guidelines show how: the concept, fourteen wordmarks, colour and type, key visuals, and the positioning underneath. Now you can.",
    media: [{ img: m("d2-laptop"), alt: "A man types on a laptop showing the V✳ logo, next to a notebook with a yellow star and a QR code", cap: "Venevo, at work" }]
  },
  related: ["investimental", "assetto", "infinity-capital"]
};
