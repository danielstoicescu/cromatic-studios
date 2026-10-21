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
  C_long: { olari: [0, 81], palace: [81, 141], steam: [141, 185], berero: [185, 225], fountain: [225, 330], scf: [330, 414], corner: [414, 456], cup: [456, 519], fintech: [519, 670], end: [670, 739] }
};

export const CARDS = [
  /* ============================== story A ============================== */
  {
    id: "a1-website", story: "A", beat: "Our new website / is a [city] -> [diorama]", shots: ["over"], scene: "light (the street from above: pavement and road)", ink: "ink",
    blocks: [{ id: "a1", place: "tl", lines: [
      { text: "Our new website", style: "title" },
      { text: "is a", style: "title", pill: { words: ["city.", "diorama."], fill: Y } }
    ] }],
    timing: { in: "over+3", lineStagger: 5, pillIn: "over+14", swaps: ["over+40"], out: "over.end-10" },
    mocks: [{ state: 0, at: "over+28" }, { state: 1, at: "over+58" }],
    notes: "Ink on this frame: the drone shot is light (grey pavement, the salmon road). The pill stays yellow through the swap; only its width and its word change."
  },
  {
    id: "a2-brand", story: "A", beat: "Every brand has its own / [place] -> [facade] (OMA) -> [building] (Slow Coffee, centred)", shots: ["steam", "oma", "scf"], scene: "the yellow aplat carries it (any frame)", ink: "ink",
    blocks: [{ id: "a2", place: "tl", aplat: { fill: Y }, lines: [
      { text: "Every brand", style: "title" },
      { text: "has its own", style: "title" },
      { text: "", style: "title", pill: { words: ["place.", "facade.", "building."], fill: WH } }
    ] }],
    // the third state: the card glides to the middle of the frame (Daniel: "text more centred")
    moves: [{ state: 2, to: { centreX: 540, top: 420 } }],
    timing: { in: "steam+2", lineStagger: 4, pillIn: "steam+12", swaps: ["oma+3", "scf+3"], out: "scf.end-14" },
    mocks: [{ state: 0, at: "steam+40" }, { state: 1, at: "oma+30" }, { state: 2, at: "scf+32" }],
    notes: "One card over three shots: it never leaves between them, the pill rolls at each cut (3 frames after the whip). Line break: Daniel's 'Every brand has its own / [place]' set on three lines so the block stays compact and the pill word reads big; the two-line break needs the type at 80 px."
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
    timing: { in: "palace+4", lineStagger: 8, out: "palace.end-6" },
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
  }
];
