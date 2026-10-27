// r322 (Daniel, 27 Oct): /prezentare/proces-<code>/, the studio's process as a deck for live meetings, often on a big
// TV. One fold per step: the page moves by whole slides (site/prezentare/prez.js), never resting halfway. Content from
// the Google Slides credentials deck (Cromatic_Studios_25), brought to today's offer (The Core 3.0, 3 visual
// directions, the Brand Canvas, Brand guidelines, Phase II in four steps, Brand experiences); the portfolio is the
// website's own (covers, case pages, media), not the deck's.
// PRIVATE, like /rapoarte/: written after the pass over public/ (no footer, no cookie card, no GA4), never in PAGES (no
// sitemap, no llms.txt), noindex in the page and in server.js's headers (no-store, no referrer), linked from nowhere.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

export const PREZ_PATH = "/prezentare/proces-5000932d55/";

const esc = (t) => String(t ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

// the portfolio: the strongest cases of the website, each with two more pictures from its own case page
const WORK = [
  { slug: "two-minutes", more: ["m:tm/tee-081", "m:tm/tee-041"] },
  { slug: "slow-coffee-festival", more: ["m:scf/p21-aeropress", "m:scf/st-5th-edition"] },
  { slug: "steam", more: ["m:wp/2025-07-Steam-Cromaticstudios-28", "m:steam/founders-wall"] },
  { slug: "arca-resort", more: ["m:cs/arcar-resort-Cromaticstudios-2", "m:cs/Lotca-by-Arca-Resort-3"] },
  { slug: "antila", more: ["m:antila/yellow", "m:antila/carnati"] },
  { slug: "artisan-coffee-gear", cover: "m:artisan-coffee-gear/art22", more: ["m:artisan-coffee-gear/art12", "m:artisan-coffee-gear/art17"] },
  { slug: "investimental", more: ["m:cs/Web-1920---portofoliu---default", "m:cs/Market-BUY-market-value"] },
  { slug: "venevo", more: ["m:venevo/d1-logo-orbit", "m:venevo/d1-app"] },
  { slug: "techventures-bank", more: ["m:techventures-bank/book-cover", "m:techventures-bank/sign"] },
  { slug: "unchain-festival", more: ["m:unchain-festival/speaker-cards", "m:unchain-festival/site-scroll-phone"] },
  { slug: "esd", more: ["m:esd/logo", "m:esd/polo"] },
  { slug: "the-aesthetic-court", more: ["m:tac/d-bench", "m:tac/d-jury"] }
];

export async function buildPrezentare({ root, pub, mediaMap, COVERS, canvases }) {
  const { PROJECTS, STREETS } = await import("../site/data.mjs");
  const warn = (m) => console.warn(`[prezentare] ${m}`);
  const src = (k) => {
    if (!k) return "";
    if (k.startsWith("/")) return k;
    const a = mediaMap.get(k);
    if (!a) { warn(`missing media ${k}`); return ""; }
    return a.src;
  };
  // every picture waits in data-src: prez.js hands it out as its slide comes near (and the rest once the deck is idle)
  const img = (k, cls = "", alt = "") => { const s = src(k); return s ? `<img class="${cls}" data-src="${s}" alt="${esc(alt)}" decoding="async" draggable="false">` : ""; };

  const slides = [];
  // theme: paper | grid | ink | yellow | green | purple | blue | coral; part: the label in the top right corner
  const S = (theme, part, title, body, cls = "") => slides.push({ theme, part, title, html: body, cls });
  const pill = (t, c = "y", extra = "") => `<span class="pill pill-${c} ${extra}">${t}</span>`;
  const eb = (t) => `<p class="eyebrow mono a">${t}</p>`;
  const deliver = (t) => `<p class="deliver a"><span class="mono">Deliverable</span><b>${t}</b></p>`;

  // ---------- 1 · cover ----------
  S("ink", "Process & Portfolio", "Cover", `
  <div class="shapes" aria-hidden="true"><i class="sh-p a"></i><i class="sh-r a"></i><i class="sh-c a"></i><i class="sh-d a"></i></div>
  <div class="cover">
    <i class="cup xxl a" aria-hidden="true"></i>
    <p class="eyebrow mono a">Cromatic Studios // Process &amp; Portfolio</p>
    <h1 class="d1 a">From the Core<br>to ${pill("market.", "y", "tilt-l")}</h1>
    <p class="lead a">How we build a brand, step by step, and the work it led to.</p>
    <p class="cover-foot mono a">Str. Olari 9, Bucharest · since 2014</p>
  </div>`, "s-cover");

  // ---------- 2 · the studio ----------
  S("paper", "The studio", "The studio", `
  <div class="split">
    <div class="col">
      ${eb("01 · The studio")}
      <h2 class="h2 a">A branding studio that solves creative ${pill("puzzles.", "b", "tilt-r")}</h2>
      <p class="lead a">We build every brand with its next step in mind: how it goes to market. Strategy in the design, and design in the service of the brand.</p>
      <ul class="ticks">
        <li class="a"><b>Goals in mind.</b> And heart. And process.</li>
        <li class="a"><b>You bring the puzzle.</b> We solve it as well as anyone can.</li>
        <li class="a"><b>Simple on purpose.</b> Every detail means something, and that is where the wow comes from.</li>
      </ul>
    </div>
    <div class="col photos3">
      ${img("/onboarding/media/studio/s5.webp", "ph p1 a", "Olari 9, the studio")}
      ${img("/onboarding/media/studio/s3.webp", "ph p2 a", "There is always a coffee")}
      ${img("/onboarding/media/studio/s0.webp", "ph p3 a", "The studio, from the stairs")}
    </div>
  </div>`);

  // ---------- 3 · people ----------
  const crew = [["cristian", "Cristian", "Partner · CEO & Strategy"], ["daniel", "Daniel", "Founder · Creative Architect"], ["ana", "Ana", ""], ["coz", "Coz", ""], ["alexandra", "Alexandra", ""], ["stefan", "Stefan", ""], ["adina", "Adina", ""], ["anne", "Anne", ""], ["iulica", "Iulică", ""], ["melissa", "Melissa", ""]];
  S("ink", "People", "People", `
  <div class="stack">
    ${eb("02 · People")}
    <h2 class="h2 a">The right team, ${pill("not the biggest.", "g", "tilt-l")}</h2>
    <div class="three">
      <div class="a"><p class="k mono">Grow up, not out</p><p>We grow people over the long run and keep them. Great retention beats a big headcount.</p></div>
      <div class="a"><p class="k mono">No silos</p><p>Everyone understands the business and the client. Everyone does creative work and brings their own eye to it.</p></div>
      <div class="a"><p class="k mono">Healthy minds</p><p>Creative work needs a clear head and a full heart. We look after both, on purpose.</p></div>
    </div>
    <ul class="crew">${crew.map(([f, n]) => `<li class="a">${img(`/onboarding/media/crew/${f}.webp`, "", n)}<b>${esc(n)}</b></li>`).join("")}</ul>
  </div>`);

  // ---------- 4 · branding process ----------
  S("yellow", "How we brand", "Branding process", `
  <div class="stack mid">
    ${eb("03 · How we brand")}
    <h2 class="d2 a">Strategy.<br>Design thinking.<br>${pill("Connection.", "w", "tilt-r")}</h2>
    <p class="lead a">We like meeting people. We listen, we get to know them, and we build brands that sound like them: a strong personality, a clear message, and a community that gathers around it.</p>
  </div>`);

  // ---------- 5 · brand = perception ----------
  S("ink", "How we brand", "Brand = Perception", `
  <div class="stack mid perception">
    <p class="eq a" aria-hidden="true">${pill("Brand", "y")}<span>=</span>${pill("Perception", "b", "tilt-l")}</p>
    <h2 class="h2 a">A brand doesn't live inside your company.<br>It lives in your customers' ${pill("minds.", "y", "tilt-r")}</h2>
  </div>`);

  // ---------- 6 · from core to market ----------
  const phases = [
    { c: "g", k: "Start", t: "The Core 3.0", items: ["Twelve modules at home", "Studio workshop", "The strategy in one sentence"] },
    { c: "p", k: "Phase I · Identity", t: "Strategy turns visual", items: ["3 visual directions", "Brand Canvas", "Brand guidelines"] },
    { c: "b", k: "Phase II · To market", t: "The brand goes out", items: ["Touchpoint roadmap & immersion", "Website UI / UX", "Communication strategy", "Content creation"] },
    { c: "r", k: "Alongside", t: "Brand experiences", items: ["Packaging", "Merch", "Prototypes & suppliers"] }
  ];
  S("grid", "Main milestones", "From Core to market", `
  <div class="stack">
    ${eb("04 · Main milestones")}
    <h2 class="h2 a">From Core to ${pill("market.", "y", "tilt-l")}</h2>
    <p class="lead a">We start from the Core: positioning and strategy. On it we build the visual language, the experience and the tools that connect the brand to its people.</p>
    <ol class="road">${phases.map((p, i) => `<li class="ph ph-${p.c} a"><span class="n mono">${String(i + 1).padStart(2, "0")}</span><p class="k mono">${p.k}</p><h3>${p.t}</h3><ul>${p.items.map((x) => `<li>${x}</li>`).join("")}</ul></li>`).join("")}</ol>
  </div>`);

  // ---------- 7 · divider: The Core 3.0 ----------
  S("green", "The Core 3.0", "Divider: The Core 3.0", `
  <div class="divider">
    <p class="big-n mono a">01</p>
    <p class="eyebrow mono a">Start · The Core 3.0</p>
    <h2 class="d1 a">Where it all<br>${pill("starts.", "w", "tilt-r")}</h2>
    <p class="lead a">The Core 3.0 is how we write a brand strategy: on your own first, then together, at the studio.</p>
  </div>`);

  // ---------- 8 · how The Core works ----------
  S("paper", "The Core 3.0", "How The Core 3.0 works", `
  <div class="stack">
    ${eb("The Core 3.0 · how it works")}
    <h2 class="h2 a">Three steps. ${pill("One sentence.", "g", "tilt-l")}</h2>
    <ol class="cards3">
      <li class="card a"><span class="n mono">01</span><p class="k mono">Self-paced · 45–60 min</p><h3>You, at your pace</h3><p>Twelve modules on your phone or laptop. You never start from a blank page, and everything saves on its own.</p></li>
      <li class="card a"><span class="n mono">02</span><p class="k mono">In person · 6–8 hours</p><h3>The studio workshop</h3><p>A full day at Str. Olari 9, built on your answers. Two people from our team, each with a clear role, and you.</p></li>
      <li class="card card-y a"><span class="n mono">03</span><p class="k mono">Output · one sentence</p><h3>The Core</h3><p>The strategy, written as one sentence. The visual directions, the canvases and everything after are built on it.</p></li>
    </ol>
    <p class="note a">When what you say and what you choose don't match, that's not a mistake. It's exactly what the workshop needs.</p>
  </div>`);

  // ---------- 9 · the core sentence ----------
  const f = (t) => `<span class="slot">${t}</span>`;
  S("ink", "The Core 3.0", "The strategy in one sentence", `
  <div class="stack mid">
    ${eb("The Core · Unique Value Proposition")}
    <h2 class="h3 a">The strategy, in one sentence.</h2>
    <p class="uvp a">${f("Brand")} offers ${f("category")} to ${f("customers")} in a ${f("culture")} environment, with a ${f("voice")} voice. Giving them ${f("impact")} and making them feel ${f("emotion")}.</p>
    <div class="xf a"><span class="pill pill-y">X factor</span><p>What you can promise and nobody else can.</p></div>
  </div>`);

  // ---------- 10 · positioning & culture ----------
  const cov = [
    ["Brand attributes", "The core values and personality that make you easy to understand."],
    ["Brand archetypes", "Two personality models and a ratio, for a voice and a look that hold together."],
    ["User profiles", "Primary and secondary customers: their jobs, challenges and pain points."],
    ["Brand goals", "Your side of the story: business goals matched to what customers need."],
    ["Love & hate", "What you'd love to see in the experience, and what we stay away from."],
    ["Brand architecture", "A clear structure for sub-brands, products and what comes later."],
    ["The workshop", "One day, in person, facilitated: insights about your customers, team and goals."],
    ["Strategy document", "Everything in one place: the story, the voice, first messages, user profiles."]
  ];
  S("grid", "The Core 3.0", "Positioning & culture", `
  <div class="stack">
    ${eb("The Core 3.0 · brand positioning & brand culture")}
    <h2 class="h2 a">What the strategy ${pill("covers.", "g", "tilt-r")}</h2>
    <ul class="grid8">${cov.map(([t, d], i) => `<li class="a${i === 7 ? " hl" : ""}"><span class="n mono">${String(i + 1).padStart(2, "0")}</span><h3>${t}</h3><p>${d}</p></li>`).join("")}</ul>
  </div>`);

  // ---------- 11–14 · the four workshop exercises ----------
  const steps4 = (on) => `<ol class="steps4 a" aria-label="Workshop exercise ${on} of 4">${["Attributes", "Archetypes", "User profiles", "Goals"].map((t, i) => `<li class="${i + 1 === on ? "on" : ""}"><span class="mono">${i + 1}</span>${t}</li>`).join("")}</ol>`;
  S("paper", "The workshop", "Brand attributes", `
  <div class="split">
    <div class="col">
      ${steps4(1)}
      ${eb("Workshop · brand attributes")}
      <h2 class="h2 a">The values your brand ${pill("lives by.", "g", "tilt-l")}</h2>
      <p class="lead a">The core values that define how your company behaves, so people understand you faster and relate to you more.</p>
    </div>
    <div class="col nums">
      <div class="num a"><b>3</b><p>values, chosen together and kept for the long run</p></div>
      <div class="num a"><b>6</b><p>categories of attributes, from character to the way you speak</p></div>
    </div>
  </div>`);

  const arch = ["Innocent", "Everyman", "Hero", "Outlaw", "Explorer", "Creator", "Ruler", "Magician", "Lover", "Caregiver", "Jester", "Sage"];
  S("paper", "The workshop", "Brand archetypes", `
  <div class="split">
    <div class="col">
      ${steps4(2)}
      ${eb("Workshop · brand archetypes · brand personality")}
      <h2 class="h2 a">Twelve archetypes. ${pill("Two are you.", "p", "tilt-r")}</h2>
      <p class="lead a">Carl Jung described them in the early 20th century; brands use them to understand their own personality. We pick two and a ratio, so the voice and the visuals stay consistent.</p>
    </div>
    <div class="col">
      <ul class="arch">${arch.map((t) => `<li class="a${t === "Creator" ? " on1" : t === "Sage" ? " on2" : ""}">${t}${t === "Creator" ? '<span class="mono">70%</span>' : t === "Sage" ? '<span class="mono">30%</span>' : ""}</li>`).join("")}</ul>
      <p class="caption mono a">Example mix · Creator 70% · Sage 30%</p>
    </div>
  </div>`);

  S("paper", "The workshop", "User profiles", `
  <div class="stack">
    ${steps4(3)}
    ${eb("Workshop · user profiles · brand community")}
    <h2 class="h2 a">Who you're really ${pill("talking to.", "b", "tilt-l")}</h2>
    <p class="lead a">Once the attributes are set, we find the audience and write it down as people, step by step.</p>
    <ol class="flow4">
      <li class="a"><span class="n mono">01</span><h3>The basics</h3><p>Age, gender, status, city.</p></li>
      <li class="a"><span class="n mono">02</span><h3>Their story</h3><p>Upbringing, tensions, what shaped them.</p></li>
      <li class="a"><span class="n mono">03</span><h3>Their needs</h3><p>What they need, and why it matters to solve.</p></li>
      <li class="a"><span class="n mono">04</span><h3>How we meet them</h3><p>And how we go past what they expect.</p></li>
    </ol>
  </div>`);

  S("paper", "The workshop", "Brand goals", `
  <div class="split">
    <div class="col">
      ${steps4(4)}
      ${eb("Workshop · brand goals · targets and actions")}
      <h2 class="h2 a">Goals, broken into ${pill("actions.", "y", "tilt-r")}</h2>
      <p class="lead a">Goals are the business targets a brand works towards. In the workshop we decide which ones to focus on, then split each one into actions you can run.</p>
    </div>
    <div class="col">
      <div class="tree">
        <span class="pill pill-y big a">Goal</span>
        <i class="tw a" aria-hidden="true"></i>
        <div class="leaves"><span class="pill pill-w a">Action</span><span class="pill pill-w a">Action</span><span class="pill pill-w a">Action</span></div>
      </div>
    </div>
  </div>`);

  // ---------- 15 · divider: identity ----------
  S("purple", "Phase I · Identity", "Divider: Phase I", `
  <div class="divider">
    <p class="big-n mono a">02</p>
    <p class="eyebrow mono a">Phase I · Identity</p>
    <h2 class="d1 a">Strategy turns<br>${pill("visual.", "w", "tilt-l")}</h2>
    <p class="lead a">Three directions, the Brand Canvas, then the rules that keep it all consistent.</p>
  </div>`);

  // ---------- 16 · 3 visual directions ----------
  S("paper", "Phase I · Identity", "3 visual directions", `
  <div class="stack">
    ${eb("Phase I · creative directions")}
    <h2 class="h2 a">Three visual ${pill("directions.", "p", "tilt-r")}</h2>
    <p class="lead a">Three distinct routes, each built on an archetype or an attribute from the strategy. You choose what feels right, not only what looks right.</p>
    <ol class="dirs">
      <li class="dir d-1 a"><div class="art" aria-hidden="true"><i class="s1"></i><i class="s2"></i><i class="s3"></i></div><p class="k mono">Direction 1</p><p>Colour, type, imagery, graphic elements and the idea behind them.</p></li>
      <li class="dir d-2 a"><div class="art" aria-hidden="true"><i class="s1"></i><i class="s2"></i><i class="s3"></i></div><p class="k mono">Direction 2</p><p>A different reading of the same positioning, in tone and composition.</p></li>
      <li class="dir d-3 a"><div class="art" aria-hidden="true"><i class="s1"></i><i class="s2"></i><i class="s3"></i></div><p class="k mono">Direction 3</p><p>A third universe, so the choice is a real one.</p></li>
    </ol>
    ${deliver("3 moodboards · 3 mark sketches · the presentation")}
  </div>`);

  // ---------- 17 · brand canvas (the website's OMA Coffee canvas, drawn from its own pieces) ----------
  const cv = canvases["oma-coffee"];
  let board = "";
  if (cv) {
    const { w: W, h: H, base, items, bg } = cv;
    const pos = (b) => `left:${(b[0] / W * 100).toFixed(3)}%;top:${((H - b[3]) / H * 100).toFixed(3)}%;width:${((b[2] - b[0]) / W * 100).toFixed(3)}%`;
    const el = (it) => `<img class="cv-el" data-src="${base}/${it.file}" alt="" decoding="async" draggable="false" style="${pos(it.box)}">`;
    board = `<div class="board a" style="aspect-ratio:${(W / H).toFixed(4)}" role="img" aria-label="OMA Coffee brand canvas">${items.filter((i) => i.under).map(el).join("")}${bg ? (bg.solid ? `<div class="cv-bg" style="background:${bg.solid}"></div>` : `<img class="cv-bg" data-src="${base}/${bg.file}" alt="" decoding="async" draggable="false">`) : ""}${items.filter((i) => !i.under).map(el).join("")}</div>`;
  } else warn("the OMA Coffee canvas is missing");
  S("paper", "Phase I · Identity", "Brand Canvas", `
  <div class="stack">
    ${eb("Phase I · the Brand Canvas · 130 × 30 cm")}
    <div class="row-h">
      <h2 class="h2 a">The Brand ${pill("Canvas.", "y", "tilt-l")}</h2>
      <p class="lead a">Where strategy turns visual. One large board shows the identity across touchpoints: the logo and its rationale, colour and type, the visual language, the applications. Each direction that moves forward gets its own.</p>
    </div>
    ${board}
    <p class="caption mono a">OMA Coffee, Brașov · brand canvas · cromaticstudios.com/work/oma-coffee</p>
  </div>`, "s-canvas");

  // ---------- 18 · brand guidelines ----------
  S("paper", "Phase I · Identity", "Brand guidelines", `
  <div class="split">
    <div class="col">
      ${eb("Phase I · Ghid de identitate")}
      <h2 class="h2 a">Brand ${pill("guidelines.", "p", "tilt-r")}</h2>
      <p class="lead a">The direction you chose, taken all the way and written down as rules. Anyone who works with you can use them, and the brand looks the same whoever applies it.</p>
      <ul class="chips a"><li>Positioning &amp; narrative</li><li>Mark rules &amp; variations</li><li>Typography</li><li>Colour</li><li>Photography</li><li>Tone of voice</li><li>Templates for rollout</li></ul>
    </div>
    <div class="col book">
      ${img("m:venevo/gl-cover", "pg g1 a", "Venevo brand guidelines, cover")}
      ${img("m:venevo/gl-logo-variations", "pg g2 a", "Venevo brand guidelines, logo variations")}
      ${img("m:venevo/gl-colours", "pg g3 a", "Venevo brand guidelines, colours")}
      <p class="caption mono a">Venevo · brand guidelines</p>
    </div>
  </div>`);

  // ---------- 19 · divider: to market ----------
  S("blue", "Phase II · To market", "Divider: Phase II", `
  <div class="divider">
    <p class="big-n mono a">03</p>
    <p class="eyebrow mono a">Phase II · To market</p>
    <h2 class="d1 a">The brand goes out<br>into the ${pill("world.", "w", "tilt-r")}</h2>
    <p class="lead a">Four steps: the touchpoints, the website, the communication and the content.</p>
  </div>`);

  const step = (n) => `<p class="stepk mono a"><span class="pill pill-b sm">Step ${n}</span> of 4 · Phase II</p>`;
  // ---------- 20 · touchpoint roadmap ----------
  const stages = ["Unaware", "Aware", "Consideration", "Purchase", "Retention", "Advocacy"];
  S("paper", "Phase II · To market", "Touchpoint roadmap & brand immersion", `
  <div class="stack">
    ${step(1)}
    <h2 class="h2 a">Touchpoint roadmap &amp; ${pill("brand immersion.", "b", "tilt-l")}</h2>
    <p class="lead a">A workshop with your team that turns positioning into daily behaviour. We map the stages people go through and where the brand can make a real difference.</p>
    <ol class="stages">${stages.map((s, i) => `<li class="a"><span class="mono">${String(i + 1).padStart(2, "0")}</span>${s}</li>`).join("")}</ol>
    <div class="cols3 a"><p><b>Per stage:</b> what people feel, need and ask.</p><p><b>Where:</b> the right platforms and activation ideas.</p><p><b>Inside:</b> brand behaviours for the team, do and don't.</p></div>
    ${deliver("The Touchpoint Roadmap, the blueprint for how the brand lives in the real world")}
  </div>`);

  // ---------- 21 · website ui/ux ----------
  S("paper", "Phase II · To market", "Website UI / UX", `
  <div class="split">
    <div class="col">
      ${step(2)}
      <h2 class="h2 a">Website ${pill("UI / UX.", "b", "tilt-r")}</h2>
      <p class="lead a">Digital experiences that carry the brand. Clear and intuitive, and built to earn conversion, retention and trust.</p>
      <ul class="ticks">
        <li class="a"><b>UX flow</b> and interaction design</li>
        <li class="a"><b>High-fidelity UI</b> screens, responsive</li>
        <li class="a"><b>Design system</b> and component library</li>
        <li class="a"><b>Developer handoff</b> files and guidelines</li>
      </ul>
    </div>
    <div class="col shots">
      ${img("m:venevo/d1-site-hero", "sh s1 a", "Venevo website")}
      ${img("m:cs/Web-1920---portofoliu---default", "sh s2 a", "Investimental platform")}
      ${img("m:unchain-festival/site-scroll-phone", "sh s3 a", "Unchain Festival website on a phone")}
    </div>
  </div>`);

  // ---------- 22 · communication strategy ----------
  S("paper", "Phase II · To market", "Communication strategy", `
  <div class="stack">
    ${step(3)}
    <h2 class="h2 a">Communication ${pill("strategy.", "b", "tilt-l")}</h2>
    <p class="lead a">Not campaigns and generic content calendars. Stories, rituals and experiences that give the brand a role in the culture around it.</p>
    <ul class="grid4">
      <li class="a"><span class="n mono">01</span><h3>Messaging pillars</h3><p>And the tone of voice that carries them.</p></li>
      <li class="a"><span class="n mono">02</span><h3>Content strategy</h3><p>Matched to your values and to how your audience behaves.</p></li>
      <li class="a"><span class="n mono">03</span><h3>Narrative themes</h3><p>The stories to tell, and ideas to bring them to life.</p></li>
      <li class="a"><span class="n mono">04</span><h3>Guidelines</h3><p>For PR, social, partnerships and experiential.</p></li>
    </ul>
    ${deliver("The Brand Communication Blueprint")}
  </div>`);

  // ---------- 23 · content creation ----------
  S("ink", "Phase II · To market", "Content creation", `
  <div class="split">
    <div class="col">
      <p class="stepk mono a"><span class="pill pill-b sm">Step 4</span> of 4 · Phase II</p>
      <h2 class="h2 a">Content ${pill("creation.", "y", "tilt-r")}</h2>
      <p class="lead a">Storytelling with a concept behind it, from short reels to big commercial spots. Always anchored in the strategy.</p>
      <ul class="ticks">
        <li class="a"><b>Creative concept</b> and direction</li>
        <li class="a"><b>Video &amp; photo</b> production</li>
        <li class="a"><b>Social and brand films</b>, delivered</li>
      </ul>
      ${deliver("The Content Production Suite")}
    </div>
    <div class="col mosaic">
      ${img("m:wp/2025-07-Steam-Cromaticstudios-26", "m1 a", "Steam Coffee Shop, photo")}
      ${img("m:cs/Clinica-Sante", "m2 a", "Clinica Sante, TV film")}
      ${img("m:tm/tee-048", "m3 a", "Two Minutes, photo shoot")}
    </div>
  </div>`);

  // ---------- 24 · brand experiences ----------
  S("coral", "Brand experiences", "Brand experiences", `
  <div class="split">
    <div class="col">
      ${eb("Alongside · brand experiences")}
      <h2 class="h2 a">Brand ${pill("experiences.", "w", "tilt-l")}</h2>
      <p class="lead a">Packaging and merch people feel before they see. Materials, finishes and craft, used to tell the story.</p>
      <ul class="ticks">
        <li class="a"><b>Packaging</b> concept and structure</li>
        <li class="a"><b>Materials &amp; finishes</b>, explored</li>
        <li class="a"><b>Prototypes</b> and supplier guidance</li>
      </ul>
      ${deliver("The Packaging &amp; Merch Toolkit, ready for production")}
    </div>
    <div class="col mosaic">
      ${img("m:arca/caviar-photo", "m1 a", "ARCA Resort, caviar tins")}
      ${img("m:antila/carnati", "m2 a", "Antila, packaging")}
      ${img("m:cs/Lotca-by-Arca-Resort-5", "m3 a", "Lotca by ARCA Resort, menu")}
    </div>
  </div>`);

  // ---------- 25 · portfolio grid ----------
  const work = WORK.map((w) => {
    const p = PROJECTS.find((x) => x.page === w.slug);
    if (!p) { warn(`no project for ${w.slug}`); return null; }
    const cover = w.cover ? src(w.cover) : COVERS[w.slug] || (p.img && src(p.img)) || "";
    if (!cover) warn(`no cover for ${w.slug}`);
    return { ...w, p, cover };
  }).filter(Boolean);
  S("ink", "Selected work", "Selected work", `
  <div class="stack">
    ${eb("05 · Selected work")}
    <div class="row-h"><h2 class="h2 a">The ${pill("work.", "y", "tilt-r")}</h2><p class="lead a">${work.length} brands from the website, every one with its own case. The full list lives at cromaticstudios.com.</p></div>
    <ul class="wall">${work.map((w) => `<li class="a"><img data-src="${w.cover}" alt="" decoding="async" draggable="false"><span class="pill" style="background:${w.p.c};color:${w.p.t}">${esc(w.p.name)}</span></li>`).join("")}</ul>
  </div>`, "s-wall");

  // ---------- 26… · one slide per project ----------
  work.forEach((w, i) => {
    const st = STREETS[w.p.street];
    S("paper", "Selected work", w.p.name, `
  <div class="case">
    <figure class="c-main a">${w.cover ? `<img data-src="${w.cover}" alt="${esc(w.p.name)}" decoding="async" draggable="false">` : ""}</figure>
    <div class="c-txt">
      <p class="eyebrow mono a">Selected work · ${String(i + 1).padStart(2, "0")} / ${String(work.length).padStart(2, "0")}${st ? ` · <i class="dot" style="background:${st[1]}"></i>${esc(st[0])}` : ""}</p>
      <h2 class="h2 a">${esc(w.p.name)}</h2>
      <p class="a"><span class="pill cat" style="background:${w.p.c};color:${w.p.t}">${esc(w.p.cat)}</span></p>
      <p class="lead a">${esc(w.p.desc)}</p>
      <div class="c-more a">${w.more.map((k) => img(k, "", "")).join("")}</div>
      <a class="c-link mono a" href="/work/${w.slug}/" target="_blank" rel="noopener">cromaticstudios.com/work/${w.slug} <span aria-hidden="true">↗</span></a>
    </div>
  </div>`, "s-case");
  });

  // ---------- last · thank you ----------
  S("yellow", "Thank you", "Thank you", `
  <div class="stack mid thanks">
    <i class="cup xxl a" aria-hidden="true"></i>
    <h2 class="d1 a">Thank you!</h2>
    <ul class="ty">
      <li class="a"><span class="pill pill-b sm">Write</span><a href="mailto:cristian@cromaticstudios.com">cristian@cromaticstudios.com</a></li>
      <li class="a"><span class="pill pill-g sm">Visit</span><a href="https://cromaticstudios.com/" target="_blank" rel="noopener">cromaticstudios.com</a></li>
      <li class="a"><span class="pill pill-r sm">Coffee</span><span>Str. Olari 9, Bucharest</span></li>
    </ul>
  </div>`);

  const n = slides.length;
  const body = slides.map((s, i) => `<section class="slide t-${s.theme} ${s.cls}" id="s${i + 1}" data-theme="${s.theme}" data-part="${esc(s.part)}" aria-roledescription="slide" aria-label="${i + 1} of ${n}: ${esc(s.title)}"><div class="in">${s.html}</div></section>`).join("\n");

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<title>Process · Cromatic Studios</title>
<meta name="robots" content="noindex, nofollow, noarchive, nosnippet, noimageindex">
<meta name="googlebot" content="noindex, nofollow, noarchive">
<meta name="referrer" content="no-referrer">
<meta name="theme-color" content="#0d0c09">
<link rel="icon" href="/favicon.ico" sizes="32x32">
<link rel="icon" href="/icon.svg" type="image/svg+xml">
<link rel="stylesheet" href="/fonts.css">
<link rel="stylesheet" href="prez.css">
<script>document.documentElement.classList.add("js");try{if(matchMedia("(prefers-reduced-motion: reduce)").matches)document.documentElement.classList.add("rm")}catch(e){}</script>
</head>
<body data-theme="ink">
<div class="deck" id="deck">
<div class="track" id="track">
${body}
</div>
</div>
<header class="chrome top" aria-hidden="true">
  <p class="frame"><span class="tri">▶</span><b>Cromatic Studios</b> <span class="sl">//</span> Process</p>
  <p class="part mono" id="part"></p>
</header>
<nav class="chrome bot" aria-label="Slides">
  <div class="prog" aria-hidden="true"><i id="bar"></i></div>
  <p class="count mono" id="count" aria-live="polite"></p>
  <button type="button" class="nb" id="prev" aria-label="Previous slide">↑</button>
  <button type="button" class="nb" id="next" aria-label="Next slide">↓</button>
  <button type="button" class="nb fs" id="fs" aria-label="Full screen (F)">⛶</button>
</nav>
<p class="hint mono" id="hint" aria-hidden="true">Scroll, arrows or space · F full screen</p>
<script src="prez.js" defer></script>
</body>
</html>
`;
  const out = join(pub, ...PREZ_PATH.split("/").filter(Boolean));
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, "index.html"), html);
  for (const f of ["prez.css", "prez.js"]) writeFileSync(join(out, f), readFileSync(join(root, "site", "prezentare", f)));
  console.log(`[prezentare] ${PREZ_PATH} -> ${n} slides (${work.length} cases), private`);
  return n;
}
