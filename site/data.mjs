// Content for the lo-fi website (/site/ and /work/*). Images are referenced by the name of the
// variable that holds them in src/app.js (e.g. "art09"); the build swaps in the hashed file.
// Copy mirrors the 3D drive (CARD_COPY, PROJECTS_*, CASE_PAGES, the SCF and Two Minutes modals).

export const NAV = [
  ["#work", "Work"],
  ["#services", "Services"],
  ["#studio", "Studio"],
  ["#contact", "Contact"]
];

export const CHAPTERS = [
  { k: "01", t: "The Dream", sub: "Brand strategy", c: "#28C840", p: "Every brand starts as somebody's dream at a kitchen table. Two cups of coffee and a lot of hard questions later, the dream has a spine: your strategy, positioning, personas, the reason anyone should care.", items: ["Brand strategy", "Positioning", "Persona journeys", "Naming", "Workshop at the table"] },
  { k: "02", t: "The Voice", sub: "Brand identity", c: "#B098C8", p: "Then the dream learns to talk. A name, a mark, a tone of voice. The things people repeat about you when you are not in the room.", items: ["Identity design", "Brand book", "Tone of voice", "Content design", "Editorial"] },
  { k: "03", t: "The World", sub: "Web, apps, packaging, film", c: "#119BFE", p: "A voice needs a world to live in. Websites, apps, packaging, film. Places your customer can walk into and instantly feel who you are, before reading a single word.", items: ["UX & UI", "Rapid prototyping", "Websites & apps", "Design systems", "Video & sound"] },
  { k: "04", t: "The Crowd", sub: "Content & growth", c: "#F65342", p: "A beautiful world with nobody in it is a museum. We bring the crowd. Content strategy, social design, ad campaigns and Instagram growth with taste, not tricks.", items: ["Content strategy", "Social design", "Ad campaigns", "Instagram growth", "Community"] }
];

export const SERVICES = [
  { t: "Branding & Design", c: "#28C840", items: ["Brand strategy", "Identity design", "Brand book", "Persona journeys", "Content design", "Generative AI for visuals"] },
  { t: "Video Production", c: "#FED012", items: ["Video production", "Photography", "Post production", "Sound design", "Generative AI for video"] },
  { t: "UX & UI Design", c: "#B098C8", items: ["Rapid prototyping", "Information architecture", "High quality mockups", "Websites & apps", "Design systems"] },
  { t: "Growth & Content", c: "#F65342", items: ["Content strategy", "Instagram growth", "Social post design", "Ad campaigns"] }
];

// route: which road it sits on in the drive; page: slug of its own case page
// r122: 1:1 with the map: every place on the map, street by street (A Coffee Street, B Fintech
// Boulevard, C Medical Avenue with the Zdrovit yard, D The Smallest Shortcut)
export const STREETS = { A: ["Coffee Street", "#28C840"], B: ["Fintech Boulevard", "#119BFE"], C: ["Medical Avenue", "#F28BA8"], D: ["The Smallest Shortcut", "#FED012"], E: ["Bulevardul Dacia 99", "#B098C8"] };
export const PROJECTS = [
  { name: "Two Minutes", cat: "Brand · Boxes · Film", c: "#111111", t: "#fff", poster: "Two minutes, forever", img: "tmCover", badge: "bTm", page: "two-minutes", desc: "A specialty coffee shop brand made to be loved fast and remembered long. Two minutes to fall for it, a lifetime as a regular.", street: "A" },
  { name: "Two Min Lab", cat: "Drinks · Tonic Ionic", c: "#C6402E", t: "#ffffff", poster: "Bottled in the yard", street: "A", page: "two-minutes", desc: "The Two Minutes lab: Tonic Ionic and the drinks bottled by hand, in small batches, in Bucharest." },
  { name: "OMA Coffee", cat: "Brand · Coffee · Brașov", c: "#437743", t: "#fcfad4", poster: "We're brewing something", page: "oma-coffee", desc: "A specialty coffee shop at the foot of the mountains. Passionate baristas who love the craft of coffee as much as the peaks around them, and a brand as warm as the cup.", street: "A" },
  { name: "Sip Coffee & Wine", cat: "Branding · Communication", c: "#C9A227", t: "#14120c", poster: "Design in a cup", img: "m:cs/Sip_portfolio-Cromaticstudios", desc: "Complementing one of the best designed coffee shops in town with a branding that fits.", street: "A", page: "sip-coffee-wine" },
  { name: "Pain Plaisir", cat: "Video · Photo · Product design", c: "#ffffff", t: "#111111", poster: "Le bon pain", street: "A", page: "pain-plaisir", desc: "A French-style bakery with a real oven at its heart. We made their video production, the photo shootings and the product design." },
  { name: "Yoshi Izakaya", cat: "Communication · Content", c: "#F4876F", t: "#2a0f0b", poster: "The best sushi in town", img: "m:cs/Yoshy-Izacaya-cover-2", badge: "bYoshi", desc: "Delivering top content for the best sushi in town.", street: "A", page: "yoshi-izakaya" },
  { name: "Artisan Coffee Gear", cat: "Brand universe · Web", c: "#797c69", t: "#fff", poster: "Get to the core of your craft", img: "art09", page: "artisan-coffee-gear", desc: "Coffee gear for passionate customers, in a tailor made environment with a personal voice. A whole brand world, from the letterform pattern to the webshop.", street: "A" },
  { name: "Slow Coffee Festival", cat: "Brand · Product · Since 2021", c: "#5B4B9E", t: "#fff", poster: "Year after year", img: "sP25b", badge: "bScf", page: "slow-coffee-festival", desc: "The biggest coffee lovers community in the country. We upgrade its brand universe year after year, so every edition feels familiar and brand new at the same time.", street: "A" },
  { name: "Casa Berero", cat: "Brand · Labels · Merch", c: "#f4f4f0", t: "#111111", poster: "BERERO", badge: "bBerero", page: "casa-berero", desc: "Craft beer with your people. COMM and UNITY, two cans that spell one word, merch and posters for Casa Berero.", street: "A" },
  { name: "Steam Coffee Shop", cat: "Branding · Growth · Product", c: "#2f9e4f", t: "#fff", poster: "Pioneers stay fresh", img: "steamCoverImg", vid: "steamCoverVid", badge: "bSteam", page: "steam", desc: "A pioneer brand refreshed for its community. New energy for the people who were there from the start, and a clear invitation for the ones just arriving.", street: "A" },
  { name: "Craft Coffee", cat: "Branding · Website", c: "#119BFE", t: "#fff", poster: "The coffee equipment", img: "craftBox", page: "craft-coffee", desc: "The official distributor of La Marzocco, Mazzer, PuQPress and Fellow in Romania. A brand and a shop built to equip the passion for coffee.", street: "A" },
  { name: "Lapterra", cat: "Patisserie · Work in progress", c: "#6e1633", t: "#d9b45a", poster: "In the making", street: "A", wip: true, desc: "A cosy patisserie, in the making. Work in progress: more soon." },
  { name: "Kómpus", cat: "Brand", c: "#B098C8", t: "#14120c", poster: "Founder vision, bottled", img: "m:cs/Kompus-Cromaticstudios-cover", badge: "bKompus", desc: "Differentiating a coffee shop in the market by enabling the founder's vision.", street: "A", page: "kompus" },
  { name: "Coffeenativ", cat: "Specialty coffee", c: "#151515", t: "#ffffff", poster: "Coffeenativ", street: "A", desc: "Specialty coffee, roasted and served with care. By Cromatic Studios." },
  { name: "ARCA Resort", cat: "Packaging · Caviar · Livery", c: "#7a1f2b", t: "#f6f2ea", poster: "ARCA", img: "m:arca/caviar-photo", page: "arca-resort", desc: "Caviar tins, a van and smoked-fish trays for a resort-destination with its own ponds and production.", street: "A" },
  { name: "Antila", cat: "Brand · Illustration · Packaging", c: "#F2C200", t: "#1a1405", poster: "Super delicios", img: "m:antila/crenv-purple", page: "antila", desc: "A charcuterie brand with a bold wordmark, a cast of disruptive characters and packaging you spot from the end of the aisle.", street: "A" },
  { name: "UNDÉ", cat: "Brand · Signage · Merch", c: "#2b6fd6", t: "#ffffff", poster: "Băcănie & delicii", img: "m:unde/basket", page: "unde", desc: "ARCA's grocery stores: a hand-drawn basket and three formats, each in its own colour.", street: "A" },
  { name: "Patiline", cat: "Distribution web · Photo · Rebranding", c: "#d71920", t: "#ffffff", poster: "Fresh off the line", street: "A", page: "patiline", desc: "Industrial bread and croissants, made by machines you can watch. We built their distribution website and website, shot their own-production bakery range, and rebranded Patiline Bakery." },
  { name: "Bepco", cat: "Energy · Brand · Digital", c: "#2fae5a", t: "#ffffff", poster: "Energy, built", img: "m:cs/Bepco-1", page: "bepco", street: "B", desc: "An energy company with a brand and a digital presence to match the power it builds." },
  { name: "Investimental", cat: "UX · UI · Product", c: "#119BFE", t: "#fff", poster: "Win in digital", img: "m:cs/Investimental-Cromaticstudios-1-e1759417114960", badge: "bInvestimental", desc: "The newest retail broker in the market, helped to win in digital. Information architecture, high quality mockups and a product experience built for first-time investors.", street: "B", page: "investimental" },
  { name: "Infinity Capital", cat: "Identity · Digital", c: "#FFC20E", t: "#111111", poster: "Infinity", street: "B", page: "infinity-capital", desc: "Financial investments for visionary clients, from Craiova. A fi monogram, greys with a yellow that climbs like a chart, an app and a website." },
  { name: "Assetto", cat: "Product · Brand", c: "#1f8a3a", t: "#fff", poster: "Tech in fintech", img: "m:cs/Assetto-Cromaticstudios-5", badge: "bAssetto", desc: "Putting the tech in fintech. Product and brand for a data-driven platform.", street: "B", page: "assetto" },
  { name: "Longshield", cat: "Brand · Web", c: "#253322", t: "#E7B43C", poster: "Longshield", street: "B", page: "longshield", desc: "Long-term investments, under a shield drawn on the golden ratio. Strategy, logo, brandbook, stationery and website for an investment group." },
  { name: "Flask", cat: "Fintech", c: "#1f8a6a", t: "#ffffff", poster: "Flask", street: "B", desc: "Fintech, made clear. By Cromatic Studios." },
  { name: "ESD", cat: "Rebranding · Website", c: "#E30613", t: "#ffffff", poster: "ESD", street: "B", page: "esd", desc: "The largest electronics service network in Romania, speaking for itself at last. Positioning, rebranding, fleet and esdrom.ro." },
  { name: "Unchain Festival", cat: "Festival · Brand", c: "#111111", t: "#ffffff", poster: "Unchained", street: "B", page: "unchain-festival", desc: "The Davos of CEE fintech, inside Oradea Fortress. Strategy, identity and a website where one red thread builds the fortress." },
  { name: "Witanalitica", cat: "Data · Digital", c: "#6b4fd8", t: "#ffffff", poster: "Witanalitica", street: "B", desc: "Data and digital, by Cromatic Studios." },
  { name: "Techventures Bank", cat: "Rebranding · Website", c: "#1D2A42", t: "#ffffff", poster: "Techventures", street: "B", page: "techventures-bank", desc: "The first entrepreneurial bank in Romania, refreshed: silver wings, landscapes in navy and a website with a human approach to banking." },
  { name: "Clinica Sante", cat: "Clinic · Brand · Film", c: "#2f9e4f", t: "#ffffff", poster: "Health is not an option", img: "m:cs/Clinica-Sante", page: "clinica-sante", street: "C", desc: "Recommended by doctors, signed off by patients: the Clinica Sante TV film and brand work." },
  { name: "The Aesthetic Court", cat: "Website · UX · UI", c: "#1a0909", t: "#c89b3c", poster: "Toxin on trial", img: "m:tac/d-hero", page: "the-aesthetic-court", desc: "A medical congress staged as a courtroom at the Palace of the Parliament, and a website built as the trial itself.", street: "C" },
  { name: "Zdrovit", cat: "Health · A yard of brands", c: "#e30613", t: "#ffffff", poster: "Zdrovit", street: "C", desc: "A courtyard of health, clinic, beauty and perfume brands, from Bucharest to Barcelona, Los Angeles and Paris." },
  { name: "Sofmedica", cat: "Medical", c: "#2b6fd6", t: "#ffffff", poster: "Sofmedica", street: "C", small: true, desc: "Sofmedica, in the Zdrovit yard. By Cromatic Studios." },
  { name: "Medcity", cat: "Clinics", c: "#18a39b", t: "#ffffff", poster: "Medcity", street: "C", small: true, desc: "Medcity, in the Zdrovit yard. By Cromatic Studios." },
  { name: "Clinica Dr. K", cat: "Aesthetics medical center", c: "#b88a6e", t: "#ffffff", poster: "Clinica Dr. K", street: "C", small: true, desc: "Clinica Dr. K, in the Zdrovit yard. By Cromatic Studios." },
  { name: "Tskani", cat: "Barcelona", c: "#e8a33d", t: "#2a1a05", poster: "Tskani", street: "C", small: true, desc: "Tskani, in the Zdrovit yard. By Cromatic Studios." },
  { name: "Darya Hope", cat: "Beauty · Los Angeles", c: "#f08fb0", t: "#2a0f17", poster: "Darya Hope", street: "C", small: true, desc: "Darya Hope, in the Zdrovit yard. By Cromatic Studios." },
  { name: "Jesse J", cat: "Beauty · Los Angeles", c: "#62c6a6", t: "#0c2a20", poster: "Jesse J", street: "C", small: true, desc: "Jesse J, in the Zdrovit yard. By Cromatic Studios." },
  { name: "Routine Paris", cat: "Brand · Identity", c: "#28C840", t: "#0e0e0e", poster: "Make it a ritual", img: "routineCoverImg", vid: "routineCoverVid", badge: "bRoutine", page: "routine-paris", desc: "A daily ritual brand with a Parisian address and an indie heart. Built to be part of somebody's morning, every morning.", street: "C" },
  { name: "Lacalut", cat: "In the Zdrovit yard", c: "#cfcdc8", t: "#3d3c39", poster: "Lacalut", street: "C", small: true, desc: "Lacalut, one of the brands in the Zdrovit yard. By Cromatic Studios." },
  { name: "Periferisan", cat: "In the Zdrovit yard", c: "#cfcdc8", t: "#3d3c39", poster: "Periferisan", street: "C", small: true, desc: "Periferisan, one of the brands in the Zdrovit yard. By Cromatic Studios." },
  { name: "Help 4 Brain", cat: "Pharma · Product · Marketing", c: "#B098C8", t: "#14120c", poster: "Challenger to leader", img: "m:cs/Cromatic-Studios-Help4brain-1", page: "help-4-brain", street: "C", desc: "Enabling a pharma challenger to become a leader." },
  { name: "Parusan", cat: "In the Zdrovit yard", c: "#cfcdc8", t: "#3d3c39", poster: "Parusan", street: "C", small: true, desc: "Parusan, one of the brands in the Zdrovit yard. By Cromatic Studios." },
  { name: "Bonylash", cat: "In the Zdrovit yard", c: "#cfcdc8", t: "#3d3c39", poster: "Bonylash", street: "C", small: true, desc: "Bonylash, one of the brands in the Zdrovit yard. By Cromatic Studios." },
  { name: "Litorsal", cat: "In the Zdrovit yard", c: "#cfcdc8", t: "#3d3c39", poster: "Litorsal", street: "C", small: true, desc: "Litorsal, one of the brands in the Zdrovit yard. By Cromatic Studios." },
  { name: "Altius", cat: "Medical", c: "#16a89b", t: "#ffffff", poster: "Altius", img: "m:cs/Cromatic-Studios-Altius-8", page: "altius", street: "C", desc: "Medical brand and digital work by Cromatic Studios." },
  { name: "Zoetis", cat: "Animal health", c: "#f2763b", t: "#2a1205", poster: "Zoetis", street: "C", desc: "Animal health communication by Cromatic Studios." },
  { name: "Elithia", cat: "Medical", c: "#f08a70", t: "#2a0f08", poster: "Joyful motherhood", img: "m:cs/Elithia-Cromaticstudios-homepage", page: "elithia", street: "C", desc: "Making motherhood a soothing, joyful experience: brand, website and content for a women's health clinic." },
  { name: "BISM", cat: "Upstairs at Dacia 99", c: "#1f4fd6", t: "#ffffff", poster: "BISM", street: "E", desc: "BISM, under the same roof as our Dacia 99 studio: neighbours, then clients." },
  { name: "Echo School", cat: "Technology · Digital arts · Videogames", c: "#7b4fd6", t: "#ffffff", poster: "Echo School", street: "E", wip: true, desc: "Echo School of Technology, Digital Arts & Videogames. The case page is on its way." },
  { name: "Sticker Republic", cat: "Stickers · Print", c: "#FFD21F", t: "#111111", poster: "Stick it", street: "D", desc: "Stickers for everything and everyone: the little yellow house on the lane, plastered with its own work." },
  { name: "Printoteca", cat: "Print on demand", c: "#ffffff", t: "#111111", poster: "Printed one by one", street: "D", desc: "Print on demand with no minimum orders: tees and hoodies printed one by one, for anyone who wants to sell their own." }
];

export const CLIENT_BADGES = ["bScf", "bTm", "bSteam", "bRoutine", "bInvestimental", "bKompus", "bYoshi", "bAssetto", "bCargus"];
export const FRIENDS = ["Erste Bank", "Microsoft", "Global Records", "Cargus", "Digi", "AWS", "Kastel Group", "Rațiu & Rațiu", "Catapult", "Robofun", "Open Bar", "Chef Sosin", "Direct Booking", "Noal Dental Clinic", "Skin Aesthetics", "Brewzeus", "7 Oale"];

export const CREW = ["Cristian", "Daniel", "Ana", "Coz", "Alexandra", "Stefan", "Adina", "Anne", "Iulică", "Melissa"];
// face crops, by the variable that holds them in src/app.js
export const CREW_FACE_VARS = { "Cristian": "crewFaceCristian", "Daniel": "crewFaceDaniel", "Ana": "crewFaceAnaMare", "Coz": "crewFaceCoz", "Alexandra": "crewFaceAlexandra", "Stefan": "crewFaceStefan", "Adina": "crewFaceAdina", "Anne": "crewFaceAnne", "Iulică": "crewFaceIulica", "Melissa": "crewFaceMelissa" };
// one line per human, shared with the drive (src/app.js CREW_INFO)
export const CREW_INFO = {
  "Cristian": { role: "CEO & Strategy Master", bio: "Asks the question nobody asked yet, then builds the plan around the answer. Keeps the studio pointed at what matters for your business, and the coffee pointed at the table." },
  "Daniel": { role: "Creative Architect", bio: "Draws the blueprint of a brand before anyone picks a colour: the idea, the system, the world it lives in. Then stays on site until it is built the way it was drawn.", instagram: "https://www.instagram.com/daniel.stoic/" },
  "Ana": { bio: "Turns a brief into something you want to look at twice. Patient with the details, impatient with the obvious." },
  "Coz": { bio: "The one who finds the shot, the angle or the joke that makes the whole thing click. Calm on set, loud in the good ideas." },
  "Alexandra": { bio: "Keeps the many moving parts moving in the same direction. Knows where every file, deadline and promise lives." },
  "Stefan": { bio: "Makes things work, on screen and behind it. If it can be built, he is already building it." },
  "Adina": { bio: "Listens first, writes second. Finds the words a brand would say if it could talk, and the tone it should say them in." },
  "Anne": { bio: "An eye for the small things that make a big impression: the crop, the colour, the pause between two frames." },
  "Iulică": { bio: "Brings the energy into the room and the frame. Equally at home behind a camera and in front of a moodboard." },
  "Melissa": { bio: "Curious about everything, careful with everything. The fresh pair of eyes that spots what the rest of us got used to." }
};
export const CREW_COLORS = ["#28C840", "#FED012", "#B098C8", "#119BFE", "#F65342"];
export const CREW_PHOTOS = [
  { src: "https://cromaticstudios.com/wp-content/uploads/2025/06/Noal.jpg", cap: "Photo production · Noal" },
  { src: "https://cromaticstudios.com/wp-content/uploads/2025/06/Dialog-Meducativ.jpg", cap: "Podcast day · Dialog Meducativ" },
  { src: "https://cromaticstudios.com/wp-content/uploads/2025/06/Clinica-Sante.jpg", cap: "On set · TV ads" },
  { src: "https://cromaticstudios.com/wp-content/uploads/2025/06/Unchain-Festival.jpg", cap: "Unchain Festival" }
];

export const OFFICES = [
  { addr: "Strada Muniției 5", year: "2014", c: "#FED012", note: "One table, two people and a company name written on a napkin." },
  { addr: "Strada Trifești 5", year: "", c: "#B098C8", note: "The second desk. Still small, already stubborn." },
  { addr: "Strada George Călinescu 54", year: "2016", c: "#F65342", note: "The villa with the red mansard, across the street from Two Minutes." },
  { addr: "Strada Mircea Eliade 18", year: "2019", c: "#119BFE", note: "More room, more people, the first proper studio floor." },
  { addr: "Bulevardul Dacia 99", year: "2024", c: "#28C840", note: "Above Club 99, under BISM. The loudest address we ever had." },
  { addr: "Strada Olari 9", year: "Today", c: "#FED012", note: "Where it all happens now. The door is open, the coffee is on." }
];

export const FORM = {
  dreams: ["Branding", "Website / App", "Video", "Growth & Social", "Not sure yet"],
  biz: ["Indie / local", "Startup", "Scale-up", "Established"],
  when: ["Yesterday :)", "1 - 3 months", "Just exploring"]
};

// ---- the case pages ----
export const CASES = {
  "slow-coffee-festival": {
    name: "Slow Coffee Festival",
    c: "#5B4B9E", t: "#fff",
    eyebrow: "Slow Coffee Festival · Brand universe · By Cromatic Studios",
    title: "For five years, we've been shaping the face of Slow Coffee Festival.",
    lead: "Not just a logo and a poster, but a positioning and a visual language that connects with people. For us, branding is more than design: it's <b>meaning</b>, a <b>voice</b> and a <b>vibe made visible</b>. A way to turn values into graphics, and graphics into something you actually feel.",
    meta: ["2021 · 2022 · 2023 · 2024 · 2025", "Brand · Posters · Merch · Digital · Spatial"],
    hero: "sAsset20",
    swatches: ["#9DB18C", "#B9A8CD", "#E9C878"],
    blocks: [
      { imgs: ["sVH2", "sVH3"] },
      { h: "2021", yr: "sY21", p: "The first face of the festival: hand-drawn, warm, a little rebellious. The festival grew bigger and more ambitious every year. And so did its looks.", imgs: ["sP21a", "sP21b", "sP21c"], poster: true },
      { h: "2022", yr: "sY22", p: "Bolder type, brighter colour: a poster system that could shout from any wall in Bucharest.", imgs: ["sP22a", "sP22b", "sP22c"], poster: true },
      { h: "2023", yr: "sY23", p: "The system matures: layouts breathe, illustration and photography start talking to each other.", imgs: ["sP23a", "s23f", "s23d"], poster: true },
      { h: "2024", yr: "s24A", p: "Four editions in, the brand could stretch across posters, merch, digital and the venue itself.", imgs: ["sP24a", "sP24b"], poster: true },
      { h: "A new chapter: SLOW", p: "After four years of building and learning, we returned to the essence: <b>slow</b>. The visual manifesto speaks with hands, and a palette of Sage Bean, Lavender Roast and Golden Crema tells of slow mornings, shared conversations and the ritual of brewing.", vid: "scfVideo", imgs: ["sHand"] },
      { h: "2025", p: "The new chapter, on every wall.", imgs: ["sP25a", "sP25b", "sP25c"], poster: true },
      { imgs: ["sIc1", "sIc2", "sIc3"], small: true }
    ],
    link: { href: "https://cromaticstudios.com/proiecte/slow-coffee-festival-history/", label: "The full story on cromaticstudios.com ↗" }
  },
  "two-minutes": {
    name: "Two Minutes",
    c: "#111111", t: "#fff",
    eyebrow: "Two Minutes · Brand development & media · By Cromatic Studios",
    title: "Two minutes to fall for it. A lifetime as a regular.",
    lead: "Identity, packaging, editorial and film for a specialty coffee brand made to be loved fast and remembered long. Poured daily at Aricescu 52A. Two Minutes has been our client and our neighbour for a decade.",
    meta: ["Brand · Packaging · Editorial · Film", "Two Min Lab drinks · Boxes · Merch"],
    youtube: "m4-5T3i3wN0",
    swatches: ["#111111", "#F2A9C4", "#28C840", "#119BFE"],
    blocks: [
      { h: "The brand", p: "A stacked TWO MIN mark that works on a cup, a tote and a shop front, with a decade of taste and moments behind it.", imgs: ["tmCover", "tmPoster", "tmTote"] },
      { h: "The boxes", p: "Green, pink, blue: coffee boxes designed to be picked up like favourite books. Straight from the shelf at Aricescu 52A.", vids: ["boxesvideo_default"] },
      { h: "Two Min Lab", p: "Two Minutes's flavour laboratory, micro-roastery and kitchen: the space where signature flavours like the <i>Tonic Ionic</i> are perfected before they reach your cup. Bottled by hand, in small batches, in Bucharest.", imgs: ["labTonic", "labSpread", "labChinotto", "labAmaro"], caps: ["Tonic Ionic · 6 plante", "Tonic Ionic · specimen index", "Chinotto · Citrus myrtifolia", "Amaro · bitter formula"] },
      { h: "Made by hand", p: "From the first sketches on grid paper to the acrylic signs, fresh from the maker.", imgs: ["labSketch", "labSigns", "labEditorial"], vids: ["labBox", "labMaking"] },
      { h: "Inside the boxes", p: "Every box carries a card with the coffee's story: The Blueprint, Silent Punch, Mosto, set in a typewriter voice, with the recipe on the back. And cubes for the Roastery and the Lab.", imgs: ["m:tm/card-blueprint", "m:tm/card-silent", "m:tm/card-mosto", "m:tm/card-silent-photo", "m:tm/cube-roastery", "m:tm/cubes-lab"] },
      { h: "Ten years", p: "Two Minutes turned ten: 10 YRS, 10 ANI, in the brand's red and green.", imgs: ["m:tm/ten-years", "m:tm/ten-ani", "m:tm/ten-green"] },
      { h: "Two Minutes × Ghica Popa", p: "A T-shirt drop with Ghica Popa, shot in the studio with friends, a guitar and a pile of tees.", imgs: ["m:tm/tee-022", "m:tm/tee-081", "m:tm/tee-014", "m:tm/tee-033", "m:tm/tee-045", "m:tm/tee-048", "m:tm/tee-071", "m:tm/tee-041"] }
    ]
  },
  "the-aesthetic-court": {
    name: "The Aesthetic Court",
    c: "#1a0909", t: "#c89b3c", theme: "tac",
    eyebrow: "The Aesthetics Court · Website · By Cromatic Studios",
    title: "Toxin on trial. Experts debate. The jury decides.",
    lead: "A one-day aesthetic medicine congress staged as a courtroom, at the Palace of the Parliament in Bucharest. We built its website as the trial itself: the charge, the bench of experts, the order of proceedings, the jury's live vote and the verdict.",
    meta: ["Website · UX · UI · Art direction", "Palace of the Parliament · Bucharest", "One trial. Many perspectives. One verdict."],
    swatches: ["#120707", "#3a0d18", "#c89b3c", "#f4f0ea"],
    hero: "m:tac/d-hero", heroFrame: true,
    blocks: [
      { h: "The charge", p: "The case file opens the site: botulinum toxin, accused of being the most used and least questioned molecule in aesthetic medicine. Paper, a court stamp and a date set the tone before anyone speaks.", imgs: ["m:tac/d-charge"], frame: true },
      { h: "The bench", p: "Eight experts take the stand, each with a portrait card and a file to open: the speakers presented as witnesses for the defence and the prosecution.", imgs: ["m:tac/d-bench"], frame: true, phones: ["m:tac/m-bench"] },
      { h: "Order of proceedings", p: "The programme reads like a docket: registration, the opening of the court, three trials (upper face, mid face, lower face & neck), breaks, and the final jury vote.", imgs: ["m:tac/d-proceedings"], frame: true, tall: true },
      { h: "Where science faces judgment", p: "The venue: the Palace of the Parliament, at night. Over a hundred international experts in the room, eight speakers on the stand, one verdict decided live by the jury.", imgs: ["m:tac/d-venue"], frame: true, phones: ["m:tac/m-venue"] },
      { h: "Jury deliberation", p: "How the room works on the day: a motion is read, both sides argue, and every seat votes. The scales of justice, in the court's gold.", imgs: ["m:tac/d-jury"], frame: true, phones: ["m:tac/m-jury"] },
      { h: "The verdict", p: "After the first edition, the site turns: the verdict is delivered, and the next date will be announced here.", imgs: ["m:tac/d-date", "m:tac/d-verdict"], frame: true }
    ],
    link: { href: "https://theaestheticscourt.com/", label: "Visit theaestheticscourt.com ↗" }
  },
  "arca-resort": {
    name: "ARCA Resort",
    c: "#7a1f2b", t: "#f6f2ea",
    eyebrow: "ARCA · Resort, restaurant, events · Blăgești, Bacău · By Cromatic Studios",
    title: "A resort-destination, with nature as an accomplice.",
    lead: "At ARCA, quiet and adventure, food with real taste and slow relaxation come together: Lotca, a fishermen's restaurant on a pontoon, Tiny Houses and Lotca Rooms, Foliage for events, and an ecosystem that grows its own fish and ingredients. We designed the products that carry its name.",
    meta: ["Packaging · Caviar · Livery · Trays", "Blăgești, Bacău"],
    swatches: ["#7a1f2b", "#2a2357", "#c9b27a", "#f6f2ea"],
    hero: "m:arca/dusk",
    blocks: [
      { h: "The place", p: "Ponds, a pontoon, the restaurant and the halls of Foliage, where weddings and private events happen against the landscape.", imgs: ["m:arca/lake", "m:arca/hall", "m:arca/table2", "m:arca/dish"] },
      { h: "ARCA Caviar", p: "Gold Imperial and Imperial, in tins dressed in deep navy and burgundy, with the thin ARCA lettering at the centre: a premium product that still feels like the resort.", imgs: ["m:arca/caviar-pair", "m:arca/caviar-photo", "m:arca/caviar-set", "m:arca/caviar-photo3"] },
      { h: "A palette for every edition", p: "The same tin, explored across colours and finishes before the final line-up.", imgs: ["m:arca/caviar-colors", "m:arca/caviar-set2", "m:arca/caviar-photo2", "m:arca/caviar-photo4"] },
      { h: "The van", p: "The delivery van as a moving shelf: ARCA's jars, life-size, along the side.", imgs: ["m:arca/van-side", "m:arca/van-back", "m:arca/van-side2"] },
      { h: "Skin trays", p: "Kraft trays for the smoked fish, with an illustrated pattern and a green ARCA band.", imgs: ["m:arca/tray", "m:arca/tray2"] }
    ],
    link: { href: "https://arca-resort.ro/", label: "Visit arca-resort.ro ↗" }
  },
  "antila": {
    name: "Antila",
    c: "#F2C200", t: "#1a1405",
    eyebrow: "Antila · Super delicios · Since 2025 · By Cromatic Studios",
    title: "Antila. Super delicios.",
    lead: "A charcuterie brand from a farm where animals are raised with care, 100% Romanian. A bold black oval wordmark, two type families, a cast of funny, disruptive illustrations, and packaging in purple, yellow and coral that you spot from the end of the aisle.",
    meta: ["Brand identity · Illustration · Packaging", "Premio · Archivo Expanded"],
    swatches: ["#111111", "#F2C200", "#7b5bb5", "#e8735a"],
    hero: "m:antila/hero",
    blocks: [
      { h: "The mark", p: "A heavy, friendly wordmark in a black oval, with “din 2025” and “super delicios” around it. It works stamped, printed on paper, or on a farm sign.", imgs: ["m:antila/logo", "m:antila/logo-paper"] },
      { h: "Type and illustrations", p: "Premio for the headlines, Archivo Expanded for everything that needs to be read. Then the characters: fun, a little disruptive, drawn to hold the products in their hands.", imgs: ["m:antila/fonts", "m:antila/ilustratii"] },
      { h: "Products from meat", p: "Mezeluri for the whole family: the brand on paper, wraps and labels.", imgs: ["m:antila/mezeluri", "m:antila/yellow", "m:antila/paper", "m:antila/wrap"] },
      { h: "Packaging", p: "Frankfurters, pastă de mici, carnați moldovenești, salam de vară: each product with its own colour and its own character.", imgs: ["m:antila/crenv-purple", "m:antila/carnati", "m:antila/mici", "m:antila/crenv-yellow"] },
      { h: "Labels, flat", p: "The full labels, ready for print.", imgs: ["m:antila/label-crenv", "m:antila/label-mici", "m:antila/label-carnati", "m:antila/label-salam"] },
      { imgs: ["m:antila/salam", "m:antila/pastrama"] }
    ]
  },
  "unde": {
    name: "UNDÉ",
    c: "#2b6fd6", t: "#ffffff",
    eyebrow: "Undé · Băcănie & delicii · ARCA's grocery stores · By Cromatic Studios",
    title: "Undé. Băcănie & delicii.",
    lead: "ARCA's grocery stores. A hand-drawn basket and a warm, handwritten wordmark, then three formats (Market, Store and Concept), each with its own colour, so every shop feels local and part of the same family.",
    meta: ["Brand identity · Signage · Merch", "Market · Store · Concept"],
    swatches: ["#c45c2a", "#2b6fd6", "#3f8a4a", "#f4ead6"],
    hero: "m:unde/basket",
    blocks: [
      { h: "From sketch to mark", p: "The search started with the shelf: bottles, jars, a basket. The basket won, drawn by hand with the wordmark underneath.", imgs: ["m:unde/marks", "m:unde/logo", "m:unde/logo-line", "m:unde/badge"] },
      { h: "Three formats, three colours", p: "Undé Market, Undé Store, Undé Concept: one system, recognisable at a glance, each with its own colour.", imgs: ["m:unde/market", "m:unde/store", "m:unde/concept", "m:unde/formats"] },
      { h: "Colour and shape", p: "Terracotta, blue and green, and a set of cut-paper shapes for everything around the logo.", imgs: ["m:unde/shapes", "m:unde/blue", "m:unde/orange", "m:unde/green"] },
      { h: "In the hand", p: "Tote bags, aprons, paper bags, and a pattern of everything you can find on the shelves.", imgs: ["m:unde/tote", "m:unde/apron", "m:unde/bag", "m:unde/pattern"] },
      { h: "On the street", p: "Light boxes and facade signs, designed down to the last fixing.", imgs: ["m:unde/lightbox", "m:unde/sign-concept", "m:unde/sign-lit", "m:unde/facade"] }
    ]
  },
  "artisan-coffee-gear": {
    name: "Artisan Coffee Gear",
    c: "#797c69", t: "#fff",
    eyebrow: "Digital brand canvas · Brand universe · By Cromatic Studios",
    title: "Artisan, coffee gear.",
    lead: "Artisan provides <b>coffee gear</b> to <b>passionate</b> customers in a <b>tailor made</b> environment with a <b>personal</b> voice. Helping them <b>join the specialty coffee community</b> and feel <b>understood</b>.",
    meta: ["Archetype · Explorer 60% / Ruler 40%", "Direction · The one who knocks", "Ailerons · Gruppo · Gotham"],
    swatches: ["#797c69", "#1e1d1d", "#e4e1d8", "#efefef"],
    blocks: [
      { h: "The direction", p: "“The One Who Knocks”. Only the best coffee gear, understood, coffee community: three keywords that decided every choice that followed.", imgs: ["art05", "art02"] },
      { h: "Type and colour", p: "Ailerons for the mark, Gruppo and Gotham for everything else. An olive, ink and paper palette that lets the equipment be the hero.", imgs: ["art07"] },
      { h: "A pattern out of the letterform", p: "The A of Artisan folds into a repeating chevron: a texture that runs across tape, packaging and posters without ever repeating itself the same way twice.", imgs: ["art08", "art10"] },
      { h: "The gear, drawn as blueprints", p: "Every machine rendered as a technical illustration, so a shop can read the catalogue like a manual.", imgs: ["art09", "art15"] },
      { h: "Identity in the hand", p: "Business cards, washi tape, polo shirts, brochures: the system built to be touched.", imgs: ["art12", "art13"] },
      { h: "The site", p: "“Get to the core of your craft.” A shop that reads like an atelier: botanical line art, generous space, the machines centre stage.", imgs: ["art17", "art18", "art19"] },
      { h: "Green beans, straight from the source", p: "Packaging and campaign for the raw side of the business: Fairtrade Columbia, brought in directly.", imgs: ["art22", "art23"] }
    ]
  },
  "craft-coffee": {
    name: "Craft Coffee",
    c: "#119BFE", t: "#fff",
    eyebrow: "Branding & website · By Cromatic Studios",
    title: "Craft Coffee. The coffee equipment.",
    lead: "Craft Coffee distributes and services professional espresso and brew equipment, picked from the most respected names in the world. We built the brand that equips the passion, and the shop that sells it.",
    meta: ["Official distributor · La Marzocco · Mazzer · PuQPress · Fellow", "Str. Bratului 7, Sector 2 · Bucharest", "Brand · Identity · Packaging · Uniforms · Ecommerce"],
    swatches: ["#119BFE", "#e63445", "#357abe", "#f8f5f0"],
    blocks: [
      { h: "A mark made to be stamped", p: "A circular badge with the wordmark cut across the middle: it reads as a seal of approval on a box, embroidered on a patch, or pressed into tape.", imgs: ["craftPatch"] },
      { h: "The box that arrives first", p: "“Your coffee equipment is here.” Before the machine is unpacked, the packaging already sounds like the brand.", imgs: ["craftBox"] },
      { h: "Worn by the people who install it", p: "Uniforms and bags for the technicians: the part of the brand that actually shows up at your bar.", imgs: ["craftUniform", "craftBag"] },
      { h: "Cards in two tempers", p: "The stationery runs in red and blue, the two halves of a company that both sells and services.", imgs: ["craftCardRed", "craftCardBlue"] }
    ],
    link: { href: "https://craftcoffee.ro", label: "Visit craftcoffee.ro ↗" }
  }
};

// brand canvases: one wide artboard, split into its elements by site/canvas/split-canvas.py,
// shown as a horizontal page (vertical scroll on desktop, drag on phones)
export const CANVASES = {
  "oma-coffee": {
    name: "OMA Coffee", dir: "oma", c: "#437743", t: "#fcfad4",
    eyebrow: "OMA Coffee · Brașov · Brand canvas · By Cromatic Studios",
    title: "We're brewing something.",
    lead: "A specialty coffee shop at the foot of the mountains. Passionate baristas who love the craft of coffee as much as the peaks around them, and a brand as warm as the cup: a rounded wordmark, a family of hand-drawn explorers, and a palette of Roast, Forest, Summit and Parchment.",
    meta: ["Brand identity · Packaging · Merch · Menus · Social", "Block W1G · Necto Mono"],
    swatches: ["#5b3535", "#437743", "#a9d8e8", "#fcfad4"]
  }
};
