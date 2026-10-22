// Cromatic · stories in Lottie · B8 (TASK-065j): the cut table and the key moments for Sorin's sound design, from
// shotsB8.mjs and buildB8.mjs's card cues (30 fps cues; end span = house + 0.9 s).   node cuesB8.mjs out.json
import fs from "fs";
import { SEG, BARS, BRAKE, STOP, DUR } from "./shotsB8.mjs";
const r = (t) => +t.toFixed(3), at = (t, what, extra = {}) => ({ t: r(t), frame60: Math.round(t * 60), what, ...extra });
const NAME = { monument: "Cromatic", nightlife: "Night Mode", underwater: "Underwater", circuit: "Race Day", sketch: "Sketchbook", orchid: "Sakura", gta2: "GTA 2", riso: "Risograph", ghibli: "Ghib.ly" };
const END = SEG[10].a + 0.9, F30 = (n) => n / 30;
const J = {
  story: "B8", fps: 60, dur: r(DUR + 2), note: "times in seconds from the start of story-b8-en.mp4 (frames at 60 fps); silent master, Sorin muxes",
  cuts: SEG.map((S, k) => ({ k, world: NAME[S.world], shot: S.kind, in: r(S.a), out: r(k === SEG.length - 1 ? END + F30(82) : S.b), len: r((k === SEG.length - 1 ? END + F30(82) : S.b) - S.a), cut: k === 0 ? "open (letterboxed)" : k === 1 ? "straight cut (same world)" : S.kind === "house" ? "smash cut, white flash 4 frames (back to Cromatic)" : "smash cut, white flash 4 frames (world change)" })).concat([{ k: SEG.length, world: "black", shot: "the pill on black", in: r(F30(82) + END), out: r(DUR + 2) }]),
  letterbox: { hold: [0, BARS.hold], open: [BARS.hold, r(BARS.hold + BARS.open)], note: "2.39:1 band, bars slide out top and bottom (ease in-out) to the full 9:16; the street plate revealed top right as they open" },
  worldChanges: SEG.slice(2).map((S) => at(S.a, `world change -> ${S.kind === "house" ? "Cromatic (the house)" : NAME[S.world]}`, { flash: true })),
  pillSwaps: [at(SEG[2].a + F30(7), "pill in: lights."), ...["tide.", "lap.", "paper.", "bloom.", "rules.", "ink.", "magic."].map((w, i) => at(SEG[3 + i].a + F30(5), `pill swap: ${w}`))],
  brake: {
    carEnters: at(SEG[10].a, "the house shot opens; the 1300 turns into the plaza and enters frame right, headlamps on"),
    bite: at(BRAKE.at, "brakes bite (tyre scrub starts), constant deceleration from street speed"),
    noseDown: at(BRAKE.at + 0.18, "nose fully dipped (held while braking)"),
    stop: at(STOP, "the car stops: the body pitches back past level (suspension rebound)"),
    rock: at(STOP + 1 / (2 * BRAKE.f), "small forward rock"),
    settled: at(STOP + 0.75, "settled, still")
  },
  cards: [at(SEG[0].a + F30(Math.round((BARS.hold + BARS.open) * 30)), "tag Cromatic + 'Same street.' in (bars open)"), at(END + F30(5), "'Nine worlds. / One street.' in"), at(END + F30(64), "cromaticstudios.com pill in"), at(END + F30(82), "cut to black (the pill on black)"), at(END + F30(111), "pill settles: last hit")]
};
fs.writeFileSync(process.argv[2], JSON.stringify(J, null, 1)); console.log("cues", process.argv[2]);
