// Industry hubs and service pages for drive.cromaticstudios.com.
// Plain data. Every fact here comes from public/llms-full.txt, public/llms.txt or site/data.mjs.
// Inline HTML allowed: <strong> and <a href="/work/slug/">.

export const INDUSTRIES = [
  {
    slug: "coffee-food-drink",
    street: "A",
    streetName: "Coffee Street",
    title: "Specialty coffee, food & drink branding in Bucharest",
    desc: "Branding, packaging, webshops and content for coffee shops, bakeries and food brands. Two Minutes, Steam, Craft Coffee and Slow Coffee Festival.", // r136: under 155 characters
    eyebrow: "Coffee Street · 15 case studies",
    h1: "Coffee, food and drink brands, made by regulars.",
    lead: "Cromatic Studios is a Bucharest branding studio for specialty coffee, food and drink. We design the brand, the box, the shop and the feed for the places people come back to.",
    intro: [
      "Coffee is where we grew up. <a href=\"/work/two-minutes/\">Two Minutes</a> has been our client and our neighbour for a decade, and on our 3D drive we always stop there for four double espressos. Then the street filled up. Specialty shops like <a href=\"/work/steam/\">Steam</a>, Sip and OMA Coffee in Brașov. Equipment brands like <a href=\"/work/craft-coffee/\">Craft Coffee</a> and Artisan Coffee Gear. And <a href=\"/work/slow-coffee-festival/\">Slow Coffee Festival</a>, the biggest coffee lovers community in the country, whose brand universe we have upgraded every edition since 2021.",
      "Food and drink followed the coffee. A French-style bakery with a pastry that deserved its own name. A craft beer with two cans that spell one word. A charcuterie brand you spot from the end of the aisle. A fish farm that grew into a resort, with its own caviar. A B2B bakery that wanted to look like a partner. Each one got the same order of work. Strategy first, then a mark, a box, a shop and a feed that all sound alike.",
      "The sector asks a lot of a brand. It has to work on a cup, a shelf, a van and a phone screen, often on the same day. It has to make a regular feel at home and give a stranger a reason to walk in. We design for both, from our studio at Strada Olari 9 in Bucharest, for coffee, food and drink brands across Romania."
    ],
    offer: [
      { t: "Coffee shop branding", p: "Logos, palettes, menus, cups and in-store posters for the places people queue at. Sip got two semicircles drawn from its arches, Kómpus a world map of sandwiches, and Steam a refreshed steaming cup with a line its team can say out loud." },
      { t: "Packaging that wins the shelf", p: "Coffee boxes picked up like favourite books at Two Minutes. COMM and UNITY cans for Berero. Caviar tins, jars and smoked-fish trays for ARCA Resort. Antila's charcuterie in purple, yellow and coral, each product with its own character." },
      { t: "Webshops for coffee gear", p: "We built the craftcoffee.ro webshop for the official La Marzocco, Mazzer, PuQPress and Fellow distributor in Romania. Accessories go straight to the cart, machines go to a quote request. Artisan Coffee Gear got a webshop that reads like an atelier." },
      { t: "Festival brands", p: "Slow Coffee Festival has worn our posters, merch and digital since 2021, upgraded every edition so it feels familiar and brand new. In 2025 it went back to its essence, slow, in Sage Bean, Lavender Roast and Golden Crema." },
      { t: "Food photo, film and content", p: "We shoot food the way it should be eaten. The Anemone torn and bitten for Pain Plaisir, a full season at Steam, the grill and the bar at Yoshi Izakaya, with content strategy, social media and ad campaigns behind them." },
      { t: "Brand families for food businesses", p: "When one name has to carry many, we build the family. ARCA at the top with Lotca, Foliage and Tiny Houses around it. UNDÉ's three grocery formats in three colours. Urban Bun, Sandwich+ and Primo for Patiline, one per channel." }
    ],
    cases: ["two-minutes", "slow-coffee-festival", "steam", "craft-coffee", "artisan-coffee-gear", "casa-berero", "arca-resort", "antila", "pain-plaisir", "sip-coffee-wine", "patiline", "unde", "kompus", "oma-coffee", "yoshi-izakaya"],
    faq: [
      ["Who designs coffee shop brands in Bucharest?", "Cromatic Studios, an independent creative studio at Strada Olari 9, founded in 2014. Our coffee clients include Two Minutes, Steam Coffee Shop, Sip Coffee & Wine, OMA Coffee in Brașov, Kómpus in Constanța, the equipment brands Craft Coffee and Artisan Coffee Gear, and Slow Coffee Festival, Romania's biggest coffee community."],
      ["What does a coffee or food brand project include?", "Usually a strategy, then an identity with logo, colours, type and a tone of voice. After that come the things guests touch, such as menus, cups, boxes, labels, signage, uniforms and merch, plus a website and social content. Craft Coffee got a badge system, packaging, uniforms, merch and the craftcoffee.ro webshop."],
      ["Do you design food and drink packaging?", "Yes. We designed the coffee boxes and story cards for Two Minutes, can labels for Berero's COMM lager and UNITY IPA, caviar tins, jar labels and skin trays for ARCA Resort, packaging and print-ready labels for Antila, and a gift box with flavour stickers for the Pain Plaisir Anemone."],
      ["Can you refresh a café brand without losing the regulars?", "That was the Steam brief. A pioneer of Bucharest specialty coffee had started to blend in. We began with surveys and interviews with guests, kept the steaming cup they recognise, and built a bolder voice and a palette pulled from the shop around one idea, belonging."],
      ["Do you build webshops for coffee equipment?", "Yes. craftcoffee.ro is a WooCommerce shop with an editorial skin, more than 60 products, brand pages for partners like La Marzocco and Fellow, and quote requests for the machines. For Artisan Coffee Gear we carried a whole brand universe, letterform pattern included, into the webshop."],
      ["Do you do social media for restaurants and cafés?", "Yes. For Yoshi Izakaya we built a content strategy, shot the dishes, the bar and the guests in the restaurant, and ran events and ad campaigns that brought new customers through the door. Sip Coffee & Wine opened with a social media launch that brought in its first guests."]
    ],
    services: ["brand-identity", "brand-strategy", "websites-apps", "social-media-content"]
  },

  {
    slug: "finance-fintech",
    street: "B",
    streetName: "Fintech Boulevard",
    title: "Fintech, banking & investment branding in Bucharest",
    desc: "Brand strategy, identity, websites and apps for banks, brokers and fintech. Investimental, Techventures Bank and Unchain Festival, from Bucharest.",
    eyebrow: "Fintech Boulevard · 8 case studies",
    h1: "Finance brands with a human face.",
    lead: "Cromatic Studios designs brand strategy, identities, websites and apps for banks, brokers, investment groups, fintech startups and energy companies in Romania. Clear for the regulator, warm for the customer.",
    intro: [
      "Money is a serious subject, and finance brands tend to dress for it the same way. We help each one find a look and a voice of its own. <a href=\"/work/techventures-bank/\">Techventures Bank</a>, the first entrepreneurial bank in Romania, got silver wings and landscapes in navy. <a href=\"/work/longshield/\">Longshield</a> Investment Group got a mountain inside a Roman shield, drawn on the golden ratio. <a href=\"/work/infinity-capital/\">Infinity Capital</a>, from Craiova, got Brâncuși's Endless Column, closed into a ring, in slate, ink and gold.",
      "On this boulevard the product matters as much as the logo. For <a href=\"/work/investimental/\">Investimental</a>, the newest retail broker in the market, we ran stakeholder workshops and user research, then designed two design systems, a web trading platform and a native mobile app for novices and experts alike. <a href=\"/work/assetto/\">Assetto</a>, a blockchain-based real estate startup, got a brand strategy, an edgy visual universe, a landing page and a mobile app UI.",
      "The street runs wider than banking. <a href=\"/work/esd/\">ESD</a>, the largest electronics service network in Romania, now speaks for itself. Bepco brings high-efficiency cogeneration to Brașov. <a href=\"/work/unchain-festival/\">Unchain Festival</a> gathers CEE fintech inside Oradea Fortress, and its website sells the passes. Every project starts the same way, at a table in Bucharest, with strategy first and the design built on top of it, so a bank, a broker and a power plant each end up sounding like themselves."
    ],
    offer: [
      { t: "Positioning for banks and investment firms", p: "We write the Core and the archetype before anyone draws. Techventures Bank's strategy pairs freedom with a sense of groundedness. Longshield is a Ruler with some Sage, 70/30. ESD is Hero and Ruler, built on one X factor, to be as fast as possible." },
      { t: "Identity and brandbooks", p: "Marks, type, colour and the rules that hold them. Brâncuși's Endless Column as a ring for Infinity Capital, Longshield's golden-ratio shield with gold foil, Techventures Bank's wings in metal, each delivered with a brandbook or a brand canvas." },
      { t: "Trading platforms and fintech apps", p: "UX research, information architecture, design systems and interactive prototypes, tested with users. Investimental's web platform and native app merged separate platforms for each currency into one, with KYC, GDPR and AML requirements built into the flows." },
      { t: "Websites that explain complex things", p: "bepco.ro explains cogeneration in plain words. esdrom.ro shows one-hour and one-day service, repair tracking and cost estimates. Techventures Bank shows account packages through landscapes, and Longshield keeps the share price one scroll away." },
      { t: "Fintech events and conferences", p: "Unchain Festival, the summer festival of CEE fintech, got a brand strategy, an identity built on one red thread and unchainfestival.com, with the agenda, speakers, delegates, passes and travel on every screen." },
      { t: "Fleet, signage and merch", p: "Finance brands live offline too. ESD's vans announce “am ajuns” from the roof. Techventures Bank's wings sit on the branch façade and on cars at night. Longshield and Infinity Capital got stationery, roll-ups and pins." }
    ],
    cases: ["investimental", "unchain-festival", "techventures-bank", "esd", "longshield", "infinity-capital", "assetto", "bepco"], // r159b (Daniel: Echo School is at Dacia 99, not a fintech case); was: Echo School stands on this boulevard on the map
    faq: [
      ["Which branding studio in Romania works with fintech and banks?", "Cromatic Studios, an independent creative studio in Bucharest. Our finance work includes Techventures Bank, the first entrepreneurial bank in Romania, the retail broker Investimental, Longshield Investment Group, Infinity Capital Investments, the blockchain real estate startup Assetto and Unchain Festival, the summer festival of CEE fintech at Oradea Fortress."],
      ["Do you design trading platforms and banking apps?", "Yes. For Investimental we ran stakeholder workshops, user research and a competitor audit, defined three personas, then designed two design systems, a web trading platform and a native mobile app, with interactive prototypes, usability testing and developer handoff. The platform won design awards and is considered best practice in the market."],
      ["How do you make a finance brand feel trustworthy without looking like every bank?", "We start from strategy and an archetype, then draw from them. Longshield's mark is a mountain inside a Roman shield, on golden-ratio proportions. Techventures Bank uses wings for freedom, grounded by dark navy. Infinity Capital says it believes in Romania through a symbol, not through colours: Brâncuși's Endless Column, closed into a ring."],
      ["Can you build a website for a fintech conference?", "Yes. unchainfestival.com covers an agenda on four stages, more than 130 speakers with filters, delegates, partners, three pass types, a fortress map and a travel page with routes to Oradea. One red thread from the logo builds the fortress as you scroll, on desktop and phone."],
      ["Do you work with energy and B2B companies?", "Yes. Bepco, a high-efficiency cogeneration company from Brașov, got a brand facelift, an animated hexagon mark, bepco.ro and video content we kept making after the rebrand. ESD, the largest electronics service network in Romania, got a positioning strategy, a rebrand, fleet livery, uniforms and esdrom.ro."]
    ],
    services: ["brand-strategy", "brand-identity", "websites-apps"]
  },

  {
    slug: "healthcare",
    street: "C",
    streetName: "Medical Avenue",
    title: "Healthcare, clinic & pharma branding in Bucharest",
    desc: "Brand strategy, websites, TV ads and content for clinics, pharma and aesthetic medicine. Elithia, Clinica Sante, Toskani MED and Help4Brain.", // r136: under 155 characters
    eyebrow: "Medical Avenue · 9 case studies",
    h1: "Healthcare brands that feel like care.",
    lead: "Cromatic Studios builds brands, websites, films and content for clinics, laboratories, pharma and aesthetic medicine, in Romania and abroad. Precise for the doctor. Calm for the patient.",
    intro: [
      "Healthcare asks a brand for two things at once. It has to be precise enough for a doctor and warm enough for a patient who is worried. On Medical Avenue we design for both. <a href=\"/work/elithia/\">Elithia</a>, a women's health clinic in Bucharest founded by internationally experienced gynaecologists, got a soft wordmark, ribbons that carry its specialties and a website that puts the doctors first. <a href=\"/work/clinica-sante/\">Clinica Sante</a>, a national network of medical laboratories, got a TV spot and a line people repeat.",
      "The avenue runs well past Bucharest. <a href=\"/work/toskani-med/\">Toskani MED</a>, an aesthetic medicine company in Barcelona that works with doctors, started from the Core and left with two packaging concepts, both carrying one line, designed by the skin architects in Barcelona. <a href=\"/work/routine-paris/\">Routine Paris</a> took a perfume boutique from Bucharest to Paris. <a href=\"/work/the-aesthetic-court/\">The Aesthetic Court</a> staged a congress as a courtroom at the Palace of the Parliament, and we built its website as the trial.",
      "Pharma has its own rules. <a href=\"/work/help-4-brain/\">Help4Brain</a>, a nootropic produced by Zdrovit, needed to educate people in a market where most hear about a supplement from a doctor or a pharmacist. <a href=\"/work/altius/\">ALTIUS</a>, a leader in veterinary pharmaceutical distribution, needed to look like the leader it is. Both got strategy, a website and video, made by the same studio in Bucharest. ALTIUS then kept us on as its long-term video partner, including Vets Congress."
    ],
    offer: [
      { t: "Clinic branding and websites", p: "Elithia got a wordmark, a flowing symbol, a palette of peach, teal and lilac, a business card for each doctor in a colour of their own, and elithia.ro, which introduces the doctors first and keeps an appointment one tap away." },
      { t: "TV ads for medical brands", p: "For Clinica Sante we made a TV spot that opens on a question, who tests the people who run the tests, and closes on the line “Recomandată de medici, parafată de pacienți”. Recommended by doctors, stamped by patients." },
      { t: "Pharma launches that educate", p: "Help4Brain launched with a brand and content strategy, reels with experts and creators on memory, sleep and focus, a TV commercial, ad campaigns, influencer marketing and help4brain.ro, which explains the science in plain words." },
      { t: "Aesthetic medicine and packaging", p: "Toskani MED's workshop set the archetype, a Caregiver for the relationship and a Sage for the science. Two visual concepts, Layers of beauty and Body Lines, went onto the TKN HA 3 boxes, signed by the skin architects in Barcelona." },
      { t: "Medical congresses", p: "The Aesthetic Court put botulinum toxin on trial at the Palace of the Parliament. Its website follows the courtroom, from the charge and the bench of experts to the order of proceedings, the jury's live vote and the verdict." },
      { t: "Repositioning for established players", p: "ALTIUS got a new strategy, a refreshed wordmark with its orange arrow, teal gradients, icons for every product area and a website for vets. We stayed on as its long-term partner for video content, including Vets Congress." }
    ],
    cases: ["elithia", "clinica-sante", "toskani-med", "help-4-brain", "the-aesthetic-court", "altius", "routine-paris", "darya-hope", "tracy-j", "litorsal", "lacalut"], // r179: + Darya Hope, Tracy J; TASK-026: + Litorsal, Lacalut
    faq: [
      ["Who does branding for clinics in Bucharest?", "Cromatic Studios, an independent creative studio at Strada Olari 9, Bucharest. Our medical work includes Elithia, a women's health clinic, Clinica Sante, a national network of medical laboratories, ALTIUS in veterinary pharma distribution, Help4Brain by Zdrovit and Toskani MED, an aesthetic medicine company in Barcelona."],
      ["Can you make a TV ad for a clinic or laboratory?", "Yes. For Clinica Sante we made a TV spot that, in under a minute, puts forward what the laboratories stand for: precision and up-to-date technology, more than 30 years of experience, fair prices and national coverage. It closes on the line “Recomandată de medici, parafată de pacienți”."],
      ["How do you write healthcare content for social media?", "Calm, clear and warm, in the clinic's own voice. For Elithia, ribbons carry the topics on Instagram, from the first pregnancy check-up to breast screening. For Help4Brain, education sits at the centre, with reels on memory, power naps and dopamine made with experts and creators."],
      ["Do you work with aesthetic medicine and beauty brands?", "Yes. Toskani MED in Barcelona got the Core, an archetype mix and packaging concepts for its TKN HA 3 range. The Aesthetic Court, a congress at the Palace of the Parliament, got a website built as a trial. Routine Paris got a brand strategy, its first perfume campaign and an e-shop in French."],
      ["Do you work with pharma and veterinary companies?", "Yes. Help4Brain, a nootropic produced by Zdrovit, got a brand and content strategy, a social media launch, a TV commercial and a website. ALTIUS, a leader in veterinary pharmaceutical distribution, got a repositioning, a refreshed identity, a website and long-term video work, including Vets Congress."]
    ],
    services: ["brand-strategy", "websites-apps", "video-production", "social-media-content"]
  },

  {
    slug: "print-merch",
    street: "D",
    streetName: "The Shortest Shortcut",
    title: "Content for print, sticker & merch brands in Bucharest",
    desc: "Instagram reels, carousels and social content for print-on-demand and sticker brands. Printoteca and Sticker Republic, by Cromatic Studios in Bucharest.",
    eyebrow: "The Shortest Shortcut · 2 case studies",
    h1: "Print and merch brands, made to be followed.",
    lead: "Cromatic Studios makes social content for print-on-demand, sticker and merch brands. Reels, carousels and series that show the people and the machines behind every order.",
    intro: [
      "The Shortest Shortcut on our map is a lane with a little yellow house, plastered with its own work. Two sister brands live on it. <a href=\"/work/printoteca/\">Printoteca</a> is a print-on-demand hub with no minimum orders, printing tees and hoodies one by one. <a href=\"/work/sticker-republic/\">Sticker Republic</a> makes stickers for everything and everyone. Both sell things that are small and easy to scroll past. Our job was to make people stop.",
      "For Printoteca we filmed two song reels in the atelier, among the clothes rails and the printers, with the lyrics on screen so each reel works with the sound off. Then came carousels in a hand-made spirit, useful before they are promotional. For Sticker Republic we built <strong>Sticker Zodiac</strong>, a reel series with a host in a green bob, a red table of ducks and a horoscope read through stickers. Each episode opens on the same title card and the same set, so you know it in one frame.",
      "Merch runs through the rest of the map too. T-shirts for <a href=\"/work/two-minutes/\">Two Minutes</a> with Ghica Popa. <a href=\"/work/steam/\">Steam</a>'s illustrated tees and its 10th anniversary cup. COMM UNITY tees for <a href=\"/work/casa-berero/\">Berero</a>. Patches, uniforms and backpacks for <a href=\"/work/craft-coffee/\">Craft Coffee</a>. Posters, stickers, totes and cups for our own pop-up at <a href=\"/work/rdw-2023/\">Romanian Design Week 2023</a>. If it gets printed, worn or stuck on something, we like it already."
    ],
    offer: [
      { t: "Reels with a recurring format", p: "Sticker Zodiac opens every episode on the same title card and the same set, with pink light, a red table and duck figurines. One set you recognise in a frame, built to be followed sign by sign." },
      { t: "Songs from the atelier", p: "Two reels, two songs for Printoteca, cut between the office desk, the atelier stairs and the printing floor. Karaoke-style lyrics in Romanian run on screen, so each reel works with the sound off too." },
      { t: "Carousels worth saving", p: "Lined paper, a highlighter stroke, a doodled light bulb and a taped note. Printoteca's Layering 101 carousel for the AW 2025 season is a style guide first, signed on the note, powered by Printoteca." },
      { t: "Social visuals", p: "Stills that show the product at work. Two tiny figures smooth the Sticker Republic smiley onto the back of a phone like a crew putting up a billboard, next to a wall of stickers layered edge to edge." },
      { t: "Merch for brands with a following", p: "T-shirt drops and uniforms for brands people wear. Two Minutes × Ghica Popa tees, Steam's illustrated T-shirt collection, COMM UNITY tees for Berero, and patches, overalls and backpacks for Craft Coffee's technicians." }
    ],
    cases: ["printoteca", "sticker-republic"],
    faq: [
      ["Who makes social content for print-on-demand brands in Romania?", "Cromatic Studios in Bucharest makes Instagram content for Printoteca, a print-on-demand hub with no minimum orders, and its sister brand Sticker Republic. The work covers content strategy, reels, carousels, title design and social media design, shot around the real atelier and the real product."],
      ["How do you make stickers or T-shirts interesting on Instagram?", "Give the feed a recurring format and a place people recognise. Sticker Republic got Sticker Zodiac, a reel series with a host and a fixed set. Printoteca got songs sung in its atelier and carousels useful enough to save, so the product turns up inside a story."],
      ["Do you design merch for other brands?", "Yes, often. We designed T-shirts for Two Minutes with Ghica Popa, Steam's illustrated T-shirt collection and anniversary cup, COMM UNITY tees for Berero, uniforms and patches for Craft Coffee, and totes, stickers and cups for our own pop-up at Romanian Design Week 2023."],
      ["Do your reels work without sound?", "Printoteca's do by design. Its songs run with karaoke-style lyrics in Romanian on screen. Sticker Zodiac leans on what you can see, with the host peeling stickers, holding them up and letting cut-out pictures pop up beside her on a set you know in one frame."]
    ],
    services: ["social-media-content", "video-production", "brand-identity"]
  }
];

export const SERVICE_PAGES = [
  {
    slug: "brand-strategy",
    name: "Brand strategy",
    chapter: "The Dream",
    title: "Brand strategy & positioning studio in Bucharest",
    desc: "Workshops, positioning, archetypes and the Core, for founders and established firms. Toskani MED, Patiline, ESD and Unchain Festival, by Cromatic Studios.",
    eyebrow: "The Dream · Brand strategy",
    h1: "Give your dream a spine.",
    lead: "Brand strategy at Cromatic Studios starts at a table in Bucharest, with two cups of coffee and a lot of hard questions. It ends with positioning, personas and the reason anyone should care.",
    intro: [
      "Every brand starts as somebody's dream at a kitchen table. Strategy is how the dream grows a spine. Before we draw a single line, we sit down with you and work out who you are for, what you offer, how you sound and why anyone should pick you. Then we write it as one sentence we call <strong>the Core</strong>, and every logo, box, website and post that follows has to answer to it.",
      "We have done this for an aesthetic medicine company in Barcelona, a B2B bakery, the largest electronics service network in Romania, a fintech festival in a medieval fortress, a pioneer coffee shop and a bank for entrepreneurs. The sentences came out very different. The method stayed the same. Listen, workshop, write the Core, then hand it to design. The questions are always hard, and there is always a coffee.",
      "Strategy is The Dream, the first of our four chapters, and the one the other three lean on. A good workshop leaves you with more than a document. <a href=\"/work/toskani-med/\">Toskani MED</a> left with a line for every box, “Designed by the skin architects in Barcelona”. <a href=\"/work/patiline/\">Patiline</a> left with a manifesto, “Tomorrow's craft. Today's partnership.” <a href=\"/work/esd/\">ESD</a> left with one X factor, to be as fast as possible, and a logo that shows it."
    ],
    includes: [
      { t: "Workshop at the table", p: "We work through mission, values and brand attributes with your team, around one table. In the Toskani MED workshop, closeness, expertise and efficacy collected the most votes and set the direction for everything after." },
      { t: "The Core", p: "One sentence for the value proposition. What you offer, to whom, in what culture, with which voice, what it gives them and how it makes them feel. Unchain Festival started from it, and Patiline worked through The Core 2.0." },
      { t: "Archetype mix", p: "Two archetypes and a ratio, so design decisions have a referee. Hero and Ruler at 60/40 for ESD, Ruler and Sage at 70/30 for Longshield, Creator and Magician for Unchain Festival, Explorer and Ruler for Artisan Coffee Gear." },
      { t: "Customer research", p: "We listen before we decide. For Steam we ran surveys and interviews with guests, and they pointed to what they value most, the feeling of belonging. That idea shaped the brand, the content, the merch and the website." },
      { t: "Customer profiles and personas", p: "Real people, written down. Unchain's profiles came from real regulators, bankers, tech leaders and founders. Investimental's workshops defined three personas, the novice investor, the active trader and the institutional manager." },
      { t: "Positioning and naming", p: "What makes you stand out, and the line that says it. ESD's positioning gave the largest service network in Romania a voice of its own after years of speaking through Samsung, Huawei, Philips and Sony. If you need a name, it starts here." },
      { t: "Brand architecture", p: "When one company runs many brands, we map the family. ARCA Resort at the top with Lotca, Foliage, Tiny Houses and Play around it. Patiline with Urban Bun, Sandwich+ and Primo, one for each channel." },
      { t: "Creative directions", p: "Strategy ends where design starts, with directions you can see. Unchain Festival got two, “Firul roșu” and “Unchained blocks”. Toskani MED got Layers of beauty and Body Lines, both drawn from its Core." }
    ],
    process: [
      { t: "Listen", p: "We start with you, your team and your customers. Stakeholder conversations, guest surveys and interviews, a look at the competition and at what the market already says about you." },
      { t: "Workshop at the table", p: "A working session with coffee on the table. We vote on attributes, argue about values and look for the X factor, the one thing you can promise that the competition cannot." },
      { t: "Write the Core", p: "We turn the workshop into one sentence, an archetype mix and customer profiles. Short enough to remember, specific enough to say no to the wrong ideas." },
      { t: "Hand it to design", p: "The strategy becomes creative directions, a positioning line and a brief for The Voice, our identity chapter. Then we stay at the table while the identity is built on top of it." }
    ],
    cases: ["toskani-med", "patiline", "esd", "unchain-festival", "steam", "artisan-coffee-gear", "longshield", "techventures-bank", "arca-resort", "elithia"],
    faq: [
      ["What is brand strategy, in plain words?", "It is the decision about who you are for, what you promise and how you sound, made before the design. At Cromatic Studios it ends in the Core, a one-sentence value proposition, plus an archetype mix and customer profiles. Toskani MED's Core describes non-invasive aesthetic treatments for caring doctors, in a family environment, with an expert voice."],
      ["What is the Core?", "The Core is our strategy tool. It sums up your culture, your clients, your voice, the feeling you give, your impact and your X factor in one sentence. Unchain Festival, Toskani MED and Patiline, with The Core 2.0, all started from it, and every design choice after that answers to it."],
      ["What happens in a brand strategy workshop?", "Your team and ours sit at one table, work through mission, values and brand attributes, then vote. In the Toskani MED workshop closeness, expertise and efficacy won. That set a Caregiver and Sage archetype and gave every box its line, designed by the skin architects in Barcelona."],
      ["Do I need a strategy if I only want a new logo?", "A logo without a strategy is a guess. Even a facelift starts from one. Steam kept its steaming cup, and the refresh came from guest interviews and a positioning built on belonging. ESD's new logo followed its Hero and Ruler strategy, so the tilted stripes carry speed for a reason."],
      ["Do you do strategy for B2B and established companies?", "Yes. Patiline, a B2B bakery for HoReCa, wanted to be seen as a partner you can trust instead of a transactional supplier. ESD, the largest electronics service network in Romania, needed a voice of its own. ALTIUS, a leader in veterinary pharma distribution, needed a repositioning to consolidate its market status."]
    ],
    industries: ["coffee-food-drink", "finance-fintech", "healthcare"]
  },

  {
    slug: "brand-identity",
    name: "Brand identity",
    chapter: "The Voice",
    title: "Brand identity & logo design studio in Bucharest",
    desc: "Logos, type, colour, brand books and packaging people remember. Two Minutes, Antila, Berero and Infinity Capital, by Cromatic Studios in Bucharest.",
    eyebrow: "The Voice · Brand identity",
    h1: "The things people repeat about you.",
    lead: "Brand identity at Cromatic Studios means a mark, a type system, a palette, a tone of voice and a brand book, designed in Bucharest to work on a cup, a can, a van and a phone.",
    intro: [
      "After the strategy, the dream learns to talk. Identity is the name, the mark and the tone of voice, and everything they turn into. We draw the logo from the idea, and often from the product itself. The <a href=\"/work/pain-plaisir/\">Pain Plaisir</a> mark is the Anemone pastry, four folds making four lobes. The <a href=\"/work/esd/\">ESD</a> logo turns its E into a number 1. <a href=\"/work/longshield/\">Longshield</a>'s shield is drawn on the golden ratio.",
      "Then we build the system around it. Type families, colour, patterns, illustration and the rules that keep them together in a brand book. <a href=\"/work/artisan-coffee-gear/\">Artisan Coffee Gear</a>'s A folds into a chevron pattern. <a href=\"/work/antila/\">Antila</a> got a cast of disruptive characters who hold the products in their hands. <a href=\"/work/unde/\">UNDÉ</a> got a hand-drawn basket and three store formats, each in its own colour.",
      "An identity is finished only when it holds up in the real world. So we follow it onto cans, boxes, menus, uniforms, signage, vans and merch. COMM and UNITY, the two <a href=\"/work/casa-berero/\">Berero</a> cans, spell one word side by side. <a href=\"/work/two-minutes/\">Two Minutes</a> coffee boxes are made to be picked up like favourite books. Does yours still sound like you from across the street?"
    ],
    includes: [
      { t: "Logo and mark", p: "Wordmarks, monograms, symbols and badges, each with a reason behind it. Infinity Capital's ring drawn from Brâncuși's Endless Column, Craft Coffee's badge that reads like a seal of approval, Antila's bold wordmark in a black oval, Sip's two semicircles from the arches of the space." },
      { t: "Typography and colour", p: "A type system and a palette that do real work. Ailerons, Gruppo and Gotham with olive, ink and paper for Artisan Coffee Gear, N27 for Steam, Premio and Archivo Expanded for Antila, a day and night palette for Sip." },
      { t: "Patterns and illustration", p: "Assets that carry the brand where the logo can't. The Artisan letterform pattern and technical drawings, Antila's characters, the Pain Plaisir quatrefoil pattern, Kómpus's world map of sandwiches, Berero's loose hand-drawn shapes." },
      { t: "Brand book", p: "The rules in one place, so the brand stays consistent long after launch. Brandbooks for ESD, Longshield and Techventures Bank, and guidelines for ARCA Resort and Sip." },
      { t: "Tone of voice and lines", p: "How the brand talks, and the lines people repeat. “Sip happens” and “Sip away” on the cups. “The finest equipment” around Craft Coffee's badge. “Part of your venture” for Techventures Bank. “Am ajuns” on the ESD vans." },
      { t: "Packaging and labels", p: "Boxes, cans, tins and labels designed to be picked up. Two Minutes coffee boxes, COMM and UNITY cans, ARCA caviar tins and smoked-fish trays, Antila's labels and the TKN HA 3 boxes for Toskani MED." },
      { t: "Signage, fleet and merch", p: "The identity out in the street. UNDÉ's light boxes and facade signs, Techventures Bank's branch façade, the vans of ESD and Patiline, Craft Coffee's technician overalls, and Slow Coffee Festival's posters and merch." }
    ],
    process: [
      { t: "Start from the Core", p: "Identity begins with the strategy, so every choice has a reason you can say out loud. When there is no strategy yet, we write it first, in a workshop at the table." },
      { t: "Explore directions", p: "We explore more than one direction before we commit, with moodboards, sketches and early marks. Toskani MED saw two visual concepts. UNDÉ's search started with bottles, jars and a basket, and the basket won." },
      { t: "Build the system", p: "The chosen direction becomes a full system. Logo lockups, type, colour, patterns, illustration and icons, tested on the surfaces you actually use, from a cup to a website." },
      { t: "Brand book and roll-out", p: "We write the rules into a brand book and roll the identity out onto packaging, print, signage, merch and digital before it goes to print." }
    ],
    cases: ["two-minutes", "slow-coffee-festival", "antila", "casa-berero", "craft-coffee", "sip-coffee-wine", "infinity-capital", "pain-plaisir", "unde", "longshield"],
    faq: [
      ["What does a brand identity project include?", "A logo or mark, a typography system, a colour palette, supporting elements such as patterns, icons or illustrations, a tone of voice and a brand book with the rules. Most projects continue onto packaging, stationery, signage, merch and digital. Craft Coffee's included a badge system, packaging, uniforms, merch and a webshop."],
      ["Can you refresh a logo without starting over?", "Yes. Steam kept the steaming cup its guests recognise and gained logo lockups, N27 as its single typeface and a palette pulled from the shop. Bepco's hexagon mark was refreshed and animated. ALTIUS got a logo refresh, a colour system of teal and orange, and icons for every product area."],
      ["Do you design packaging as part of the identity?", "Often, because packaging is where people pick a brand up. Two Minutes coffee boxes, Berero's COMM and UNITY cans, ARCA Resort's caviar tins and skin trays, Antila's charcuterie labels and Toskani MED's TKN HA 3 boxes were all designed together with their identities."],
      ["What is a brand book and do I need one?", "A brand book holds the rules for logo use, type, colour, imagery and tone, so anyone on your team or a supplier can apply the brand the same way. We have delivered brandbooks for ESD, Longshield and Techventures Bank, and brand guidelines for ARCA Resort and Sip Coffee & Wine."],
      ["Do you design identities for festivals and events?", "Yes. Slow Coffee Festival's brand universe has been upgraded every edition since 2021, across posters, merch, digital and the venue. Unchain Festival got an identity built on one red thread that builds a fortress. For Romanian Design Week 2023 we dressed our own pop-up in posters, stickers, totes and cups."]
    ],
    industries: ["coffee-food-drink", "finance-fintech", "healthcare", "print-merch"]
  },

  {
    slug: "websites-apps",
    name: "Websites & apps",
    chapter: "The World",
    title: "Website, webshop & app design studio in Bucharest",
    desc: "UX, UI, design systems and development for websites, webshops and apps. Investimental, craftcoffee.ro and unchainfestival.com, by Cromatic Studios.", // r136: under 155 characters
    eyebrow: "The World · Websites & apps",
    h1: "Places your customers can walk into.",
    lead: "Cromatic Studios designs and builds websites, webshops and mobile apps in Bucharest, from research and information architecture to design systems, interfaces and development.",
    intro: [
      "A voice needs a world to live in. For most brands, the first room people walk into is a screen. We design that room so it feels like you before anyone reads a word, and so it works for the person holding the phone. Research and structure come first, then the interface, then the code. We have done it for a broker, a bank, a clinic, a coffee distributor and a festival in a fortress.",
      "The range is wide. <a href=\"/work/investimental/\">Investimental</a>, a retail broker, got a web trading platform and a native app built on two design systems. <a href=\"/work/craft-coffee/\">Craft Coffee</a> got craftcoffee.ro, a WooCommerce shop with an editorial skin. <a href=\"/work/unchain-festival/\">Unchain Festival</a>'s site sells passes to delegates from 40+ countries. <a href=\"/work/the-aesthetic-court/\">The Aesthetic Court</a>'s site is built as a trial, from the charge to the verdict. <a href=\"/work/elithia/\">Elithia</a>'s puts the doctors first and an appointment one tap away.",
      "Every site carries the brand behind it. ESD's red stripes, Bepco's hexagons, Techventures Bank's landscapes, Artisan Coffee Gear's botanical line art. We design the phone and desktop layouts side by side and build them responsive, so the brand holds on every screen. Strategy, identity and web sit in the same studio at Strada Olari 9, so nothing gets lost between them."
    ],
    includes: [
      { t: "UX research and information architecture", p: "Stakeholder workshops, competitor audits and personas before any screen. Investimental's research put Revolut, Trading 212 and Interactive Brokers side by side and defined three personas, from the novice investor to the institutional manager." },
      { t: "Wireframes and interactive prototypes", p: "We sketch the flows, make them clickable and test them with users. Investimental went from wireframes to high-fidelity designs, interactive prototypes and usability testing, with KYC, GDPR and AML requirements built into the flows." },
      { t: "Design systems", p: "Components that keep a product consistent as it grows. Two design systems for Investimental's web and mobile, building blocks cut like fortress stone for Unchain Festival, and hexagons as the base of every section on bepco.ro." },
      { t: "Webshops and e-commerce", p: "Shops that sell the way the brand talks. craftcoffee.ro, with more than 60 products, filters and quote requests for the machines. Artisan Coffee Gear's webshop that reads like an atelier. routineparis.com, in French, for a new market." },
      { t: "Mobile apps", p: "App UI for products people check every day. Investimental's native trading app with light and dark themes, and Assetto's real estate investing app in lime and black." },
      { t: "Event and congress websites", p: "Sites with a date to sell. unchainfestival.com covers the agenda, more than 130 speakers, delegates, partners, passes and travel. The Aesthetic Court's site follows a courtroom, from the charge to the jury's live vote." },
      { t: "Company and clinic websites", p: "Sites that explain a business in plain words. bepco.ro on cogeneration, esdrom.ro with repair tracking and cost estimates, elithia.ro with doctor profiles and appointment requests, help4brain.ro on how memory works." },
      { t: "Web development", p: "We build what we design, responsive on every screen. Web development for Elithia, Bepco, ARCA Resort, ALTIUS, Assetto, Help4Brain, Kómpus and Routine Paris, and clean developer handoff when your own team builds." }
    ],
    process: [
      { t: "Research and workshops", p: "We meet your stakeholders, look at the competition and define who the product is for. The output is personas, priorities and a clear list of what each page or screen has to do." },
      { t: "Architecture and wireframes", p: "We map the structure and the flows, then wireframe them with real content. Grey boxes and honest arguments about what goes first, before any colour arrives." },
      { t: "Interface and prototype", p: "The brand arrives on screen. UI, a design system, desktop and phone layouts, and clickable prototypes we can test with real users before anyone writes code." },
      { t: "Build and handoff", p: "We develop the site, check it on every screen and launch it. When your developers build, we hand over the design system, the prototypes and the files." }
    ],
    cases: ["investimental", "craft-coffee", "unchain-festival", "the-aesthetic-court", "elithia", "artisan-coffee-gear", "assetto", "esd", "routine-paris", "bepco"],
    faq: [
      ["Do you design and build websites, or only design them?", "Both. We design the UX and UI and develop the site, as we did for Elithia, Bepco, ARCA Resort, ALTIUS, Help4Brain and Routine Paris. When a client has its own developers, as with Investimental's trading platform, we deliver design systems, interactive prototypes and developer handoff."],
      ["Can you design a trading platform or fintech app?", "Yes. For Investimental we merged separate platforms for each currency into one web trading platform and native mobile app, for novices and experts alike, with light and dark themes. The platform won design awards and is considered best practice in the market."],
      ["Do you build e-commerce websites?", "Yes. craftcoffee.ro is a WooCommerce shop for the official La Marzocco, Mazzer, PuQPress and Fellow distributor in Romania. Accessories go straight to the cart and machines go to a quote request. We also designed Artisan Coffee Gear's webshop and built the Routine Paris e-shop in French."],
      ["Can you make a website for a conference or festival?", "Yes. unchainfestival.com sells a two-day fintech festival at Oradea Fortress, with the agenda, speakers, delegates, partners, passes and travel. The Aesthetic Court's website stages a medical congress as a trial, with a bench of experts, an order of proceedings and a live jury vote."],
      ["Do you design for mobile?", "Every project gets phone layouts designed alongside desktop. On unchainfestival.com the speaker grid becomes a single column and the Buy now button sits within reach of a thumb. Investimental and Assetto got mobile app UI, and Longshield's mobile site comes in shield-shaped sections."]
    ],
    industries: ["finance-fintech", "coffee-food-drink", "healthcare"]
  },

  {
    slug: "video-production",
    name: "Video production",
    chapter: "+1",
    title: "Video production, TV ads & photography in Bucharest",
    desc: "TV ads, brand films, campaign shoots and product photography, made in house. Clinica Sante, Help4Brain, Pain Plaisir and Routine Paris, from Bucharest.",
    eyebrow: "+1 · Video production",
    h1: "Film, photo and sound, made in house.",
    lead: "Cromatic Studios produces TV ads, brand films, campaign shoots and product photography in Bucharest, with post production and sound design in the same house as the brand.",
    intro: [
      "We have three chapters we talk about every day, and one more. Video production sits right next to strategy, identity and web, so the film looks and sounds like the brand it is made for. The studio that designs your brand also shoots it, which means nobody has to explain the brief twice. Photography, post production and sound design happen under the same roof.",
      "The work runs from TV to the phone. For <a href=\"/work/clinica-sante/\">Clinica Sante</a> we made a TV spot for a national network of laboratories, with a line people repeat, recommended by doctors, stamped by patients. <a href=\"/work/help-4-brain/\">Help4Brain</a> got a TV commercial, ad campaigns and reels with experts and creators. <a href=\"/work/routine-paris/\">Routine Paris</a> got its first perfume campaign, shot as a short film and a series of stills.",
      "Food is where the camera gets hungry. We shot the <a href=\"/work/pain-plaisir/\">Pain Plaisir</a> Anemone torn, bitten and held up to the eyes, then a Christmas table full of the bakery. <a href=\"/work/casa-berero/\">Berero</a>'s cans went on the grass, on a rusted car and into a red crate. Steam was shot across a full season. Bepco and ALTIUS kept us on for video after their rebrands."
    ],
    includes: [
      { t: "TV commercials", p: "Spots built around one line. Clinica Sante's opens on a question, who tests the people who run the tests, and closes on “Recomandată de medici, parafată de pacienți”. Help4Brain's TV commercial ran alongside its social launch." },
      { t: "Brand and campaign films", p: "Films that introduce a brand or a product. The first perfume campaign for Routine Paris, the video work for Bepco, the season reel for Steam, and film for Two Minutes, our neighbour for a decade." },
      { t: "Product photography", p: "Products shot like they are already loved. The Anemone up close for Pain Plaisir, COMM and UNITY cans in their own colours for Berero, Help4Brain boxes and tablets in lifestyle stills for everyday focus." },
      { t: "Social reels", p: "Short video made for the feed. Help4Brain's reels on memory, power naps and dopamine, Printoteca's songs from the atelier and Sticker Zodiac for Sticker Republic, each built to be followed." },
      { t: "Ongoing video partnerships", p: "Video that keeps going after the launch. ALTIUS made us its long-term partner for video content, including Vets Congress. After the Bepco rebrand we stayed on, filming some of the bravest entrepreneurs we have ever met." },
      { t: "Art direction, animation and post", p: "We direct the look on set and finish it in house, with editing, animation, post production and sound design. Bepco's hexagon mark was animated to move, and Berero's city shoot was art-directed in blue and red." },
      { t: "Restaurant and venue shoots", p: "We shoot places the way regulars know them. The grill, the bar and the guests at Yoshi Izakaya, a full house on a weekday morning at Steam, a Christmas table full of Pain Plaisir." }
    ],
    process: [
      { t: "The idea", p: "We start from the brand and the one thing the film has to say. A question to open on, a line to close on, and a reason to watch to the end." },
      { t: "Pre-production", p: "Locations, casting, props and set design, planned with art direction that fits the identity, so every frame already looks like the brand before the camera rolls." },
      { t: "The shoot", p: "Photo and video together when it makes sense, in the shop, the atelier, the clinic or the studio. We shoot for every format the campaign needs, from a TV spot to a vertical reel." },
      { t: "Post and delivery", p: "Editing, animation, post production and sound design, in house. Then the cuts for TV, web and social, sized and ready to publish." }
    ],
    cases: ["clinica-sante", "help-4-brain", "pain-plaisir", "routine-paris", "bepco", "altius", "steam", "casa-berero", "yoshi-izakaya", "two-minutes"],
    faq: [
      ["Do you produce TV ads in Romania?", "Yes. We made a TV spot for Clinica Sante, a national network of medical laboratories, and a TV commercial for Help4Brain, a nootropic produced by Zdrovit. Video production, photography, post production and sound design all happen in house at Cromatic Studios in Bucharest."],
      ["Can you shoot product photography for food and drink?", "Yes. We shot the Anemone pastry and a Christmas table for Pain Plaisir, COMM and UNITY cans and a red crate of craft beers for Berero, the dishes and the bar at Yoshi Izakaya, and a full season of guests and baristas at Steam Coffee Shop."],
      ["Do you make video content for social media?", "Yes. Help4Brain's reels with experts and creators, Printoteca's songs filmed in the atelier, Sticker Republic's Sticker Zodiac series and Steam's season reel were all made for Instagram, by the same team that plans the content strategy behind them."],
      ["Do you keep making video after a project ends?", "Yes. After the Bepco rebrand we stayed on to create video content for the company, a long-term relationship that keeps producing. ALTIUS made us its long-term partner for video content, including Vets Congress, the top industry event in its market."],
      ["Can you combine a brand campaign with photo and video?", "That is how we like it. For Routine Paris we wrote the brand strategy, shot the first perfume campaign as a short film and stills, then launched it on social media one fragrance at a time. For Pain Plaisir the product branding, packaging, shoot and Christmas campaign came together."]
    ],
    industries: ["coffee-food-drink", "healthcare", "finance-fintech"]
  },

  {
    slug: "social-media-content",
    name: "Social media & content",
    chapter: "The Crowd",
    title: "Social media content & Instagram growth in Bucharest",
    desc: "Content strategy, reels, social design and ad campaigns for brands with a community. Steam, Help4Brain, Yoshi Izakaya and Printoteca, by Cromatic Studios.",
    eyebrow: "The Crowd · Content & growth",
    h1: "We bring the crowd.",
    lead: "Cromatic Studios plans and makes social media content in Bucharest. Content strategy, reels, social design, ad campaigns and Instagram growth for brands with a real community behind them.",
    intro: [
      "A beautiful world with nobody in it is a museum. The Crowd is the chapter where we bring people in. We plan what to post and why, shoot it, design it, run the campaigns and look after the community that forms around it. Most of it happens on Instagram, close to the people who make the place. Content strategy, social design, ad campaigns and Instagram growth, all done with taste.",
      "We like content that comes from real life. <a href=\"/work/steam/\">Steam</a>'s feed follows its guests, its team and its neighbourhood. <a href=\"/work/yoshi-izakaya/\">Yoshi Izakaya</a>'s shows the kitchen, the bar and the regulars. <a href=\"/work/printoteca/\">Printoteca</a>'s reels are songs sung among the printers. <a href=\"/work/help-4-brain/\">Help4Brain</a>'s puts education first, with experts and creators on memory, sleep and focus. <a href=\"/work/sticker-republic/\">Sticker Republic</a>'s has a recurring host and a set you know in one frame.",
      "Growth has to be earned. <a href=\"/work/sip-coffee-wine/\">Sip</a> opened with a launch that brought in its first guests."
    ],
    includes: [
      { t: "Content strategy", p: "What to post, how often and why. A posting rhythm built around real guests, the team and the neighbourhood at Steam, education at the centre for Help4Brain, and useful carousels before promotional ones for Printoteca." },
      { t: "Social media launches", p: "The first weeks of a brand online. Sip opened with lines like “Sip it like it's hot” and “No reservation, just take a sip”. Routine Paris introduced each fragrance with its top, heart and base notes." },
      { t: "Reels and series formats", p: "Formats people come back for. Sticker Zodiac reads a horoscope through stickers for Sticker Republic. Printoteca's reels are songs from the atelier. Help4Brain's cover memory, power naps and dopamine." },
      { t: "Social design", p: "Posts, stories and key visuals that look like the brand. Elithia's ribbons carry the topics, Steam's illustrated stories carry its brand line, and Printoteca's carousels sit on lined paper with a highlighter stroke." },
      { t: "Ad campaigns", p: "Paid campaigns that put the product in front of the right people. Campaigns that, with the content and the events, brought new customers to Yoshi Izakaya, and ad campaigns as part of the Help4Brain launch." },
      { t: "Influencer and creator content", p: "Content with people your audience already follows. Help4Brain launched with influencer marketing and short videos made with experts and creators, in a market where supplements usually reach people through doctors and pharmacists." },
      { t: "Photo and video for the feed", p: "We shoot the content ourselves. A full season at Steam, the dishes and the bar at Yoshi Izakaya, the Anemone for Pain Plaisir, and Berero's cans on a city shoot in blue and red." },
      { t: "Events and community", p: "Content that happens off the screen too. Events designed to bring new guests into Yoshi Izakaya, takeover posters for Berero, and Steam's illustrated T-shirts and cups." }
    ],
    process: [
      { t: "Listen", p: "We start with your customers and your channels. What people love, what they share, what has gone quiet. At Steam, guest surveys and interviews pointed straight to the feeling of belonging." },
      { t: "Plan", p: "A content strategy with topics, formats and a rhythm your team can keep, plus the launches and recurring series worth building around." },
      { t: "Make", p: "We shoot, design and edit in house. Photo and video sessions, reels, carousels, stories and key visuals, all in the brand's own voice." },
      { t: "Run and grow", p: "We publish, run the ad campaigns, talk with the community and watch what works, then adjust the plan as the crowd grows." }
    ],
    cases: ["steam", "help-4-brain", "yoshi-izakaya", "printoteca", "sticker-republic", "echo-school", "sip-coffee-wine", "routine-paris", "elithia", "casa-berero"], // r159: + Echo School
    faq: [
      ["Do you manage social media for restaurants and coffee shops?", "Yes. Steam got a content strategy, photo, video, social media management, stories and in-store posters. Yoshi Izakaya got a content strategy, events, ad campaigns and photography shot in the restaurant. Sip Coffee & Wine opened with a social media launch and an opening campaign."],
      ["Do you do social media for pharma and healthcare?", "Yes. Help4Brain, a nootropic produced by Zdrovit, launched on social media with education at the centre, reels with experts and creators, influencer marketing and a TV commercial. Elithia, a women's health clinic, posts calm, clear content in its own voice, from the first check-up to breast screening."],
      ["What is a content series format?", "A recurring idea your followers recognise in one frame. Sticker Zodiac, made for Sticker Republic, opens every episode on the same title card and the same set, with pink light, a red table and duck figurines, and reads the zodiac one sign at a time through stickers."],
      ["Do you make the content or only plan it?", "Both. We write the content strategy, then shoot the photo and video, design the posts, carousels and stories, and run the campaigns. For Printoteca we filmed two song reels in the atelier. For Steam we shot the shop across a full season."]
    ],
    industries: ["coffee-food-drink", "healthcare", "print-merch"]
  }
];
