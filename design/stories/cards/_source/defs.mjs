// Cromatic · stories · the cards for A and C (Iris, TASK-065d): the copy, where it sits, and when.
// Times are cues on a story's clock: "steam+2" = 2 frames (30 fps) after the steam shot starts, "scf.end-8" = 8 frames
// before the scf shot ends. The clocks are the v4 shots (Lia's T / SP spans, halved to 30 fps); C also has the
// retimed clock Daniel's long holds need (the fountain and SLOW). cards.mjs resolves cues against whichever clock the
// story build passes it, at 60 fps.
const Y = "#FED012", WH = "#FFFFFF";

export const CLOCKS = {
  // story A v4 (buildA5.mjs SP, /2)
  A_v4: { over: [0, 76], steam: [74, 131], oma: [129, 176], scf: [174, 222], drive: [220, 390], site: [325, 490], end: [440, 490] },
  // story C v4 (buildC4.mjs T, /2)
  C_v4: { olari: [0, 81], palace: [81, 126], steam: [126, 170], berero: [170, 210], fountain: [210, 262], scf: [262, 290], corner: [290, 332], cup: [332, 395], fintech: [395, 546], end: [546, 615] },
  // story C retimed (the proposal): the Aesthetic Court 2 s (two lines to read), the fountain 3.5 s, SLOW 2.8 s, the rest as v4, shifted
  C_long: { olari: [0, 81], palace: [81, 141], steam: [141, 185], berero: [185, 225], fountain: [225, 330], scf: [330, 414], corner: [414, 456], cup: [456, 519], fintech: [519, 670], end: [670, 739] },
  // story D2 (Lia, TASK-065d: Daniel's "around the city" storyboard; build-d2.mjs T2, /2)
  // story B5 (Lia, TASK-065d: one street, nine worlds; buildB5.mjs SPAN, /2)
  B5: { monument: [0, 61], nightlife: [59, 122], underwater: [107, 165], circuit: [167, 249], sketch: [209, 283], orchid: [280, 293], gta2: [292, 305], riso: [304, 317], ghibli: [316, 338], end: [337, 480] },
  // story D5 (Iris, TASK-115: build-d5.mjs T5, /2)
  D5: { site: [0, 120], bird: [120, 228], zoom: [228, 330], steam: [330, 425], page: [395, 602], r1: [602, 644], r2: [644, 689], r3: [689, 755], r4: [755, 800], r5: [800, 848], sip: [848, 908], r9: [908, 953], r8: [953, 1013], fount: [1013, 1103], end: [1103, 1173] },
  D2: { site: [0, 105], drift: [105, 243], skyline: [243, 303], steam: [303, 400], page: [367, 452], r1: [452, 470], r2: [470, 497], r3: [497, 515], r4: [515, 542], r5: [542, 562], sip: [562, 604], r8: [604, 631], r9: [631, 653], fount: [653, 750], end: [750, 820] }
};

export const CARDS = [
  /* ============================== story A ============================== */
  {
    id: "a1-website", story: "A", beat: "Our new website / is a [city] -> [diorama]", shots: ["over"], scene: "the street from above (A6: on the aplat)", ink: "ink",
    // (A6, Daniel: "hard to read, the frame is too dark for ink": on the yellow aplat, ink, its pill white)
    blocks: [{ id: "a1", place: "tl", aplat: { fill: Y }, lines: [
      { text: "Our new website", style: "line" },
      { text: "is a", style: "line", pill: { words: ["city.", "diorama."], fill: WH } }
    ] }],
    timing: { in: "over+3", lineStagger: 5, pillIn: "over+14", swaps: ["over+40"], out: "over.end-10" },
    mocks: [{ state: 0, at: "over+28" }, { state: 1, at: "over+58" }],
    notes: "Ink on this frame: the drone shot is light (grey pavement, the salmon road). The pill stays yellow through the swap; only its width and its word change."
  },
  {
    id: "a2-brand", story: "A", beat: "Every brand / has its own + its own pill: [place] -> [facade] (OMA) -> [building] (Slow Coffee, centred)", shots: ["steam", "oma", "scf"], scene: "the yellow aplat carries the two lines (any frame)", ink: "ink",
    blocks: [
      { id: "a2", place: "tl", aplat: { fill: Y }, lines: [{ text: "Every brand", style: "title" }, { text: "has its own", style: "title" }] },
      // the pill is its own element: pinned under the block's bottom-left corner, overlapping it a little
      { id: "a2-word", attach: { to: "a2", dx: 40, gap: -40 }, lines: [{ text: "", style: "title", pill: { words: ["place.", "facade.", "building."], fill: WH } }] }
    ],
    // the third state: the card and its pill glide to the middle of the frame together (Daniel: "text more centred")
    moves: [{ state: 2, to: { centreX: 540, top: 420 } }],
    timing: { in: "steam+2", lineStagger: 4, pillIn: "steam+14", swaps: ["oma+3", "scf+3"], out: "scf.end-14" },
    mocks: [{ state: 0, at: "steam+40" }, { state: 1, at: "oma+30" }, { state: 2, at: "scf+32" }],
    notes: "Daniel's break: 'Every brand / has its own' on the aplat (title, 116), and the word in a pill of its own, white, pinned 40 px in from the block's left edge and overlapping its bottom by 40 px. The pill swaps (left end fixed) at each cut, 3 frames after the whip; the block never changes size. One card over three shots, no re-entry."
  },
  {
    id: "a2b-brand-plain", variantOf: "a2-brand", story: "A", beat: "the same without the aplat: paper lines, the yellow pill under them", shots: ["steam", "oma", "scf"], scene: "dusk street", ink: "paper",
    blocks: [
      { id: "a2b", place: "tl", lines: [{ text: "Every brand", style: "title" }, { text: "has its own", style: "title" }] },
      { id: "a2b-word", attach: { to: "a2b", dx: 0, gap: 22 }, lines: [{ text: "", style: "title", pill: { words: ["place.", "facade.", "building."], fill: Y } }] }
    ],
    moves: [{ state: 2, to: { centreX: 540, top: 420 } }],
    timing: { in: "steam+2", lineStagger: 4, pillIn: "steam+12", swaps: ["oma+3", "scf+3"], out: "scf.end-14" },
    mocks: [{ state: 0, at: "steam+40" }, { state: 1, at: "oma+30" }, { state: 2, at: "scf+32" }],
    notes: "The alternative to a2-brand (draw one or the other): no block, the two lines in paper straight on the street, the pill yellow under them."
  },
  {
    id: "a3-drive", story: "A", beat: "Take your drive.", shots: ["drive"], scene: "dusk street, the road at the bottom", ink: "paper",
    blocks: [{ id: "a3", place: "bl", lines: [{ text: "Take your", style: "headline" }, { text: "drive.", style: "headline" }] }],
    timing: { in: "drive+11", lineStagger: 5, out: "drive+151" },
    mocks: [{ state: 0, at: "drive+70" }],
    notes: "All paper: 'drive.' is no longer yellow."
  },
  {
    id: "a4-end", story: "A", beat: "end: black, only the cromaticstudios.com pill, centred (as in C)", shots: ["end"], scene: "black", ink: "ink",
    url: {},
    timing: { urlIn: "end-40", black: "end+0", settle: "end+29", out: "end.end-0" },
    mocks: [{ state: 0, at: "end.end-4" }],
    notes: "The pill lands over the site's last frame 40 frames before black (as now), at the C position (540, 1000) instead of the old (550, 1520)."
  },

  /* ============================== story C ============================== */
  {
    id: "c1-olari", story: "C", beat: "Olari 9 · 9:11 (a map tag at the start)", shots: ["olari"], scene: "night", ink: "ink",
    tags: [{ id: "c1-tag", text: "Olari 9 · 9:11", x: 80, top: 286 }],
    timing: { in: "olari+8", out: "olari.end-10" },
    mocks: [{ state: 0, at: "olari+50" }],
    notes: "Replaces the typed slug and the big 'Olari 9.': the place is told by its tag, like on the map."
  },
  {
    id: "c2-landmarks", story: "C", beat: "City landmarks. / Event locations. (The Aesthetic Court)", shots: ["palace"], scene: "night (burgundy)", ink: "paper",
    blocks: [{ id: "c2", place: "bl", lines: [{ text: "City landmarks.", style: "title" }, { text: "Event locations.", style: "title" }] }],
    timing: { in: "palace+4", lineStagger: 8, out: "palace.end-10" },
    mocks: [{ state: 0, at: "palace+32" }],
    notes: "Two statements, one size, one colour: the second is no longer small and yellow."
  },
  {
    id: "c3-coffee", story: "C", beat: "Night coffee hopping. (Steam, held through Casa Berero)", shots: ["steam", "berero"], scene: "night", ink: "paper",
    blocks: [{ id: "c3", place: "br", lines: [{ text: "Night", style: "headline" }, { text: "coffee", style: "headline" }, { text: "hopping.", style: "headline" }] }],
    timing: { in: "steam+4", lineStagger: 4, out: "berero.end-6" },
    mocks: [{ state: 0, at: "steam+26" }, { state: 0, at: "berero+22" }],
    notes: "In once on Steam, stays put across the cut to Casa Berero (no re-entry), out before the fountain."
  },
  {
    id: "c4-fountain", story: "C", beat: "Down to earth, / up for fun. (the fountain, split across corners, long hold)", shots: ["fountain"], scene: "night (the lit water in the middle)", ink: "paper",
    blocks: [
      { id: "c4a", place: "tl", lines: [{ text: "Down to earth,", style: "title" }] },
      { id: "c4b", place: "br", lines: [{ text: "up for fun.", style: "title" }] }
    ],
    timing: { in: "fountain+4", blockStagger: 8, out: "fountain.end-8" },
    mocks: [{ state: 0, at: "fountain+27" }],
    notes: "Top left, then bottom right: the water sits between them. Needs the long clock (C_long: 105 frames) for its hold; on v4 it holds 26 frames."
  },
  {
    id: "c5-slow", story: "C", beat: "You should take it (small, in the sky over the dome) + SLOW (big, on the dark plaza under it, long hold)", shots: ["scf"], scene: "night", ink: "paper",
    blocks: [
      { id: "c5a", place: { x: 540, align: "center", top: 330 }, lines: [{ text: "You should take it", style: "lead" }] },
      { id: "c5b", place: { x: 540, align: "center", base: 1530 }, lines: [{ text: "SLOW", style: "hero" }], behindRide: true }
    ],
    timing: { in: "scf+1", blockStagger: 10, out: "scf.end-4", smash: ["c5b"] },
    mocks: [{ state: 0, at: "scf+22" }],
    notes: "The sentence frames the building: the small line in the sky above the dome, 'SLOW' on the dark plaza below it (on the dome's lit ribs, as in v4, it lost its contrast). 'SLOW' is smash-cut (on and off with the frame) and is still drawn behind the ride's layers, so the car passes in front if it crosses it. Long hold: C_long gives the shot 84 frames."
  },
  {
    id: "c6-two-minutes", story: "C", beat: "You always have / two minutes.", shots: ["corner", "cup"], scene: "night (the corner from above, then the windscreen)", ink: "paper",
    blocks: [{ id: "c6", place: "tl", lines: [{ text: "You always have", style: "title" }, { text: "two minutes.", style: "title" }] }],
    timing: { in: "corner+2", lineStagger: 5, out: "cup.end-10" },
    mocks: [{ state: 0, at: "corner+30" }, { state: 0, at: "cup+40" }],
    notes: "All paper: 'two minutes.' is no longer yellow. Held across the cut to the coffee on the windscreen."
  },
  {
    id: "c7-fintech", story: "C", beat: "Fintech Blvd · 11:11 (a map tag)", shots: ["fintech"], scene: "night", ink: "ink",
    tags: [{ id: "c7-tag", text: "Fintech Blvd · 11:11", x: 80, top: 286 }],
    timing: { in: "fintech+12", out: "fintech+66" },
    mocks: [{ state: 0, at: "fintech+40" }],
    notes: "Replaces the big super 'Fintech Blvd.' and its 08/08 chip."
  },
  {
    id: "c8-soon", story: "C", beat: "Ended too soon?", shots: ["fintech"], scene: "night (the road at the bottom)", ink: "paper",
    blocks: [{ id: "c8", place: "bl", lines: [{ text: "Ended", style: "headline" }, { text: "too soon?", style: "headline" }] }],
    timing: { in: "fintech+75", lineStagger: 5, out: "fintech+121" },
    mocks: [{ state: 0, at: "fintech+100" }]
  },
  {
    id: "c9-drive", story: "C", beat: "Drive it for yourself. + the pill", shots: ["fintech"], scene: "night", ink: "paper",
    blocks: [{ id: "c9", place: { x: 540, align: "center", base: 880 }, lines: [{ text: "Drive it for yourself.", style: "line" }] }],
    url: {},
    timing: { in: "fintech+123", urlIn: "fintech+128", out: "end+0" },
    mocks: [{ state: 0, at: "fintech.end-6" }],
    notes: "The line sits over the pill, centred; it goes out as the screen goes black, the pill stays."
  },
  {
    id: "c10-end", story: "C", beat: "end: black, the pill stays centred", shots: ["end"], scene: "black", ink: "ink",
    url: { continues: "c9-drive" },
    timing: { black: "end+0", settle: "end+29", out: "end.end-0" },
    mocks: [{ state: 0, at: "end.end-4" }],
    notes: "The same pill as c9 (no second entrance): black fades in under it over 11 frames, then the soft settle."
  },
  /* ============================== story D2 (Lia, from Iris's system: the same tokens, corners and motion) ============================== */
  {
    id: "d1-portfolio", story: "D", beat: "Our portfolio / is not only + its own pill [scrollable.] (over the site, scrolled)", shots: ["site"], scene: "the site (light, busy): the yellow aplat carries it", ink: "ink",
    blocks: [
      { id: "d1", place: "tl", aplat: { fill: Y }, lines: [{ text: "Our portfolio", style: "title" }, { text: "is not only", style: "title" }] },
      { id: "d1-word", attach: { to: "d1", dx: 40, gap: -40 }, lines: [{ text: "", style: "title", pill: { words: ["scrollable."], fill: WH } }] }
    ],
    timing: { in: "site+6", lineStagger: 4, pillIn: "site+18", out: "site.end-12" }, mocks: [{ state: 0, at: "site+60" }]
  },
  {
    id: "d2-corner", story: "D", beat: "Every brand / gets its + [corner.] (the drift out of Printoteca) -> [skyline.] (Fintech) -> [facade.] (Steam)", shots: ["drift", "skyline", "steam"], scene: "any: the yellow aplat carries it", ink: "ink",
    blocks: [
      { id: "d2", place: "tl", aplat: { fill: Y }, lines: [{ text: "Every brand", style: "title" }, { text: "gets its", style: "title" }] },
      { id: "d2-word", attach: { to: "d2", dx: 40, gap: -40 }, lines: [{ text: "", style: "title", pill: { words: ["corner.", "skyline.", "facade."], fill: WH } }] }
    ],
    timing: { in: "drift+30", lineStagger: 4, pillIn: "drift+42", swaps: ["skyline+3", "steam+3"], out: "steam+30" }, mocks: [{ state: 0, at: "drift+80" }, { state: 1, at: "skyline+30" }, { state: 2, at: "steam+20" }]
  },
  {
    id: "d3-knock", story: "D", beat: "Knock / knock. (each word on its tap, over Steam's place card)", shots: ["steam"], scene: "Steam, dimmed under the card", ink: "paper",
    blocks: [{ id: "d3", place: "tl", lines: [{ text: "Knock", style: "headline" }, { text: "knock.", style: "headline" }] }],
    timing: { in: "steam+46", lineStagger: 8, out: "page-6" }, mocks: [{ state: 0, at: "steam+64" }]
  },
  {
    id: "d4-come-in", story: "D", beat: "Come in. (Steam's case page, opened)", shots: ["page"], scene: "the case page (white, busy): on the aplat", ink: "ink",
    // (on the yellow aplat: the page under it is all words and pictures, no calm corner)
    blocks: [{ id: "d4", place: { x: 132, align: "left", base: 1470 }, aplat: { fill: Y }, lines: [{ text: "Come in.", style: "headline" }] }],
    timing: { in: "page+17", out: "page+34" }, mocks: [{ state: 0, at: "page+30" }]
  },
  { id: "d5-drive", story: "D", beat: "Drive.", shots: ["r1"], scene: "night", ink: "paper", blocks: [{ id: "d5", place: "bl", lines: [{ text: "Drive.", style: "headline" }] }], timing: { in: "r1+1", out: "r1.end-7" } },
  { id: "d6-snoop", story: "D", beat: "Snoop. (slower)", shots: ["r2"], scene: "night", ink: "paper", blocks: [{ id: "d6", place: "tr", lines: [{ text: "Snoop.", style: "headline" }] }], timing: { in: "r2+2", out: "r2.end-8" } },
  { id: "d7-overtake", story: "D", beat: "Overtake.", shots: ["r3"], scene: "night", ink: "paper", blocks: [{ id: "d7", place: "tl", lines: [{ text: "Overtake.", style: "headline" }] }], timing: { in: "r3+1", out: "r3.end-7" } },
  { id: "d8-pass-go", story: "D", beat: "Pass Go. (slower, and the board's arrow: an object, drawn by the story)", shots: ["r4"], scene: "night, under the Court's lights", ink: "paper", blocks: [{ id: "d8", place: "bl", lines: [{ text: "Pass Go.", style: "headline" }] }], timing: { in: "r4+2", out: "r4.end-8" } },
  { id: "d9-fly-high", story: "D", beat: "Fly high.", shots: ["r5"], scene: "night sky", ink: "paper", blocks: [{ id: "d9", place: "tl", lines: [{ text: "Fly high.", style: "headline" }] }], timing: { in: "r5+2", out: "r5.end-7" } },
  { id: "d10-sip", story: "D", beat: "Sip through. (the F1 through the Two Minutes corner)", shots: ["sip"], scene: "night, from above", ink: "paper", blocks: [{ id: "d10", place: "tr", lines: [{ text: "Sip", style: "headline" }, { text: "through.", style: "headline" }] }], timing: { in: "sip+3", lineStagger: 4, out: "sip.end-9" } },
  { id: "d11-pulled-over", story: "D", beat: "Avoid being / pulled over. (slower)", shots: ["r8"], scene: "night, the patrol's lamps", ink: "paper", blocks: [{ id: "d11", place: "tl", lines: [{ text: "Avoid being", style: "title" }, { text: "pulled over.", style: "title" }] }], timing: { in: "r8+2", lineStagger: 4, out: "r8.end-9" } },
  { id: "d12-dive", story: "D", beat: "Dive. (a bit slower)", shots: ["r9"], scene: "under water", ink: "paper", blocks: [{ id: "d12", place: { x: 540, align: "center", base: 1530 }, lines: [{ text: "Dive.", style: "hero" }] }], timing: { in: "r9+2", out: "r9.end-8" } },
  {
    id: "d13-around", story: "D", beat: "See you around / your corner. (the fountain, split across corners)", shots: ["fount"], scene: "night (the lit water in the middle)", ink: "paper",
    blocks: [{ id: "d13a", place: "tl", lines: [{ text: "See you around", style: "title" }] }, { id: "d13b", place: "br", lines: [{ text: "your corner.", style: "title" }] }],
    timing: { in: "fount+6", blockStagger: 10, out: "fount.end-12" }, mocks: [{ state: 0, at: "fount+50" }]
  },
  {
    id: "d14-end", story: "D", beat: "end: black, only the cromaticstudios.com pill, centred (as in A and C)", shots: ["end"], scene: "black", ink: "ink",
    url: {}, timing: { urlIn: "end-30", black: "end+0", settle: "end+29", out: "end.end-0" }, mocks: [{ state: 0, at: "end.end-4" }]
  },
  /* ============================== story D5 (Iris, TASK-115: Daniel's notes on D4) ============================== */
  {
    id: "d15-portfolio", story: "D", beat: "Our portfolio / is not only + [scrollable.], centred: the block swings in, the lines rise, the pill comes last and the word lands (over the site's grid, scrolled slowly)", shots: ["site"], scene: "the site (light, busy): the yellow aplat carries it", ink: "ink",
    blocks: [
      { id: "d15", place: { x: 540, align: "center", top: 690 }, aplat: { fill: Y, tilt: -1.5 }, lines: [{ text: "Our portfolio", style: "title" }, { text: "is not only", style: "title" }] },
      { id: "d15-word", attach: { to: "d15", align: "center", gap: -40 }, lines: [{ text: "", style: "title", pill: { words: ["scrollable."], fill: WH } }] }
    ],
    timing: { in: "site+8", lineStagger: 8, pillIn: "site+34", out: "site.end-14" }, mocks: [{ state: 0, at: "site+70" }]
  },
  {
    id: "d16-map", story: "D", beat: "Every brand / in our portfolio / is on this + [map.] (Daniel's line; the bird's eye with the map's pins and place cards)", shots: ["bird"], scene: "the city from high (light): the yellow aplat carries it", ink: "ink",
    blocks: [
      // (line size: the block stays small over the city, the pins show round it)
      { id: "d16", place: "tl", aplat: { fill: Y }, lines: [{ text: "Every brand", style: "line" }, { text: "in our portfolio", style: "line" }, { text: "is on this", style: "line" }] },
      { id: "d16-word", attach: { to: "d16", dx: 36, gap: -34 }, lines: [{ text: "", style: "line", pill: { words: ["map."], fill: WH } }] }
    ],
    timing: { in: "bird+6", lineStagger: 6, pillIn: "bird+30", out: "bird.end-10" }, mocks: [{ state: 0, at: "bird+80" }]
  },
  {
    id: "d17-around", story: "D", beat: "See you / around. (bottom right, on the plaza's orange, clear of the Reels column)", shots: ["fount"], scene: "night: the plaza's orange road", ink: "paper",
    blocks: [{ id: "d17", place: { x: 900, align: "right", base: 1480 }, lines: [{ text: "See you", style: "headline" }, { text: "around.", style: "headline" }] }],
    timing: { in: "fount+8", lineStagger: 6, out: "fount.end-10" }, mocks: [{ state: 0, at: "fount+60" }]
  },
  { id: "d18-pass-go", story: "D", beat: "Pass Go. (D5: top left, in the night sky over the pop-up; the racer fills the bottom)", shots: ["r4"], scene: "night, the Court's pop-up", ink: "paper", blocks: [{ id: "d18", place: "tl", lines: [{ text: "Pass Go.", style: "headline" }] }], timing: { in: "r4+2", out: "r4.end-8" } },
  /* ============================== story B5 (Lia, from Iris's system) ============================== */
  {
    id: "b1-street", story: "B", beat: "Same street. / New [lights.] -> [tide.] -> [lap.] -> [paper.] -> [bloom.] -> [rules.] -> [ink.] -> [magic.] (one card over the nine worlds, on the plaza)", shots: ["monument", "nightlife", "underwater", "circuit", "sketch", "orchid", "gta2", "riso", "ghibli"], scene: "any world (Sketchbook is white): the yellow aplat carries it", ink: "ink",
    // (v5: on the plaza under the house, not over its roof; v6: smaller and lower, the rides stand on the plaza)
    blocks: [{ id: "b1", place: { x: 132, align: "left", base: 1470 }, aplat: { fill: Y }, lines: [{ text: "Same street.", style: "line" }, { text: "New", style: "line", pill: { words: ["lights.", "tide.", "lap.", "paper.", "bloom.", "rules.", "ink.", "magic."], fill: WH } }] }],
    timing: { in: "monument+8", lineStagger: 52, pillIn: "nightlife+7", swaps: ["underwater+8", "circuit+4", "sketch+22", "orchid+0", "gta2+0", "riso+0", "ghibli+0"], out: "ghibli.end-6" }
  },
  { id: "b2-monument", story: "B", beat: "the world's name as the map's tag: Cromatic", shots: ["monument"], scene: "any", ink: "ink", tags: [{ id: "b2-monument-tag", text: "Cromatic", x: 80, top: 286 }], timing: { in: "monument+13", out: "monument+48" } },
  { id: "b2-nightlife", story: "B", beat: "the world's name as the map's tag: Night Mode", shots: ["nightlife"], scene: "any", ink: "ink", tags: [{ id: "b2-nightlife-tag", text: "Night Mode", x: 80, top: 286 }], timing: { in: "nightlife+5", out: "nightlife+43" } },
  { id: "b2-underwater", story: "B", beat: "the world's name as the map's tag: Underwater", shots: ["underwater"], scene: "any", ink: "ink", tags: [{ id: "b2-underwater-tag", text: "Underwater", x: 80, top: 286 }], timing: { in: "underwater+16", out: "underwater+52" } },
  { id: "b2-circuit", story: "B", beat: "the world's name as the map's tag: Race Day", shots: ["circuit"], scene: "any", ink: "ink", tags: [{ id: "b2-circuit-tag", text: "Race Day", x: 80, top: 286 }], timing: { in: "circuit+6", out: "circuit+38" } },
  { id: "b2-sketch", story: "B", beat: "the world's name as the map's tag: Sketchbook", shots: ["sketch"], scene: "any", ink: "ink", tags: [{ id: "b2-sketch-tag", text: "Sketchbook", x: 80, top: 286 }], timing: { in: "sketch+17", out: "sketch+67" } },
  { id: "b2-orchid", story: "B", beat: "the world's name as the map's tag: Sakura", shots: ["orchid"], scene: "any", ink: "ink", tags: [{ id: "b2-orchid-tag", text: "Sakura", x: 80, top: 286 }], timing: { in: "orchid+0", out: "orchid+12" } },
  { id: "b2-gta2", story: "B", beat: "the world's name as the map's tag: GTA 2", shots: ["gta2"], scene: "any", ink: "ink", tags: [{ id: "b2-gta2-tag", text: "GTA 2", x: 80, top: 286 }], timing: { in: "gta2+0", out: "gta2+12" } },
  { id: "b2-riso", story: "B", beat: "the world's name as the map's tag: Risograph", shots: ["riso"], scene: "any", ink: "ink", tags: [{ id: "b2-riso-tag", text: "Risograph", x: 80, top: 286 }], timing: { in: "riso+0", out: "riso+12" } },
  { id: "b2-ghibli", story: "B", beat: "the world's name as the map's tag: Ghib.ly", shots: ["ghibli"], scene: "any", ink: "ink", tags: [{ id: "b2-ghibli-tag", text: "Ghib.ly", x: 80, top: 286 }], timing: { in: "ghibli+0", out: "ghibli+19" } },
  { id: "b3-end", story: "B", beat: "Nine worlds. / One street. (back on Cromatic, its light plaza)", shots: ["end"], scene: "light (Cromatic by day)", ink: "ink", blocks: [{ id: "b3", place: "bl", lines: [{ text: "Nine worlds.", style: "headline" }, { text: "One street.", style: "headline" }] }], timing: { in: "end+5", lineStagger: 6, out: "end+70" } },
  { id: "b4-end", story: "B", beat: "end: the pill centred, black under it (as in A, C, D)", shots: ["end"], scene: "black", ink: "ink", url: {}, timing: { urlIn: "end+64", black: "end+82", settle: "end+111", out: "end.end-0" } }
];
