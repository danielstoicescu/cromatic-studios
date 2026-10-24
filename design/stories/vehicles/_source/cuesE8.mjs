// story E8: the cut and type-hit times for Sorin (e8-cues.json), from E8's clock and the v8 cards' own cues, plus the
// picture's own events in the diorama chase (the 1300 past the lens, the Patrol's brake and stop, the beacons' beat).
//   node cuesE8.mjs <out.json>
import fs from "fs";
import { CLOCK, F } from "./shotsE8.mjs";
const out = process.argv[2] || "e8-cues.json";
const card = (id) => JSON.parse(fs.readFileSync(new URL(`../../cards/json/${id}.json`, import.meta.url), "utf8"));
const at = (s) => { const m = /^([a-z0-9_]+)(\.end)?([+-]\d+)$/i.exec(s), sp = CLOCK[m[1]]; return (m[2] ? sp[1] : sp[0]) + +m[3]; };
const cues = [];
const add = (frame, type, what) => cues.push({ t: +(frame / 30).toFixed(3), frame, type, what });
// the picture
const SHOT = { t1: "the 1300 on Coffee Street, golden hour", t2: "the Cropduster over the field under the Brașov hill", t3: "the Classic Formula on Fintech Boulevard, race day", van: "the Mystery van, late afternoon", chrome: "the Chrome racer on the roundabout at sunset", scooter: "the E-scooter in the sakura alley", rush: "Fintech Boulevard at night after the rain: the 1300 hurrying, the Polite Patrol behind it (one shot with the Patrol's)", leadin: "Coffee Street at night, the lens tilting up to the sky" };
for (const [k, [a]] of Object.entries(CLOCK)) if (SHOT[k]) add(a, "cut", SHOT[k]);
add(CLOCK.patrol[0], "card", "the Patrol's card (no picture cut: the chase goes on, the Patrol braking into the middle)");
// the chase's own events (shots/e8/chase.mjs: the 1300 at 150 u/s from z 4470, the lens at z 4706; the Patrol at 140 u/s
// from z 4360, braking from z 4488 to a stop at z 4552)
const r0 = CLOCK.rush[0], TB = (4488 - 4360) / 140, A = (140 * 140) / (2 * (4552 - 4488)), TS = TB + 140 / A;
add(r0, "sfx", "the Patrol's beacons start flashing red / blue, 190 ms each (a 380 ms cycle), until the lead-in cut");
add(Math.round(r0 + 30 * TB), "sfx", "the Patrol starts braking (nose dips)");
add(Math.round(r0 + 30 * ((4706 - 4470) / 150)), "sfx", "the 1300 passes the lens, right of frame (whoosh)");
add(Math.round(r0 + 30 * TS), "sfx", "the Patrol stops in the middle of the frame (rocks back once)");
// the type
const op = card("v8-0-opening").timing.cues;
add(at(op.in), "type", "Today you’re (line in)"); add(at(op.in) + op.lineStagger, "type", "a (line in)");
add(at(op.pillIn), "type", "[driver.] pill pops in (yellow)"); add(at(op.swaps[0]), "type", "pill rolls to [pilot.] (yellow)"); add(at(op.swaps[1]), "type", "pill turns red, [pilot.] (the F1)"); add(at(op.out), "type", "opening title out");
for (const [id, k, tag, l1, l2] of [["v8-van", "van", "Mystery van", "Solves cases.", "Use cases."], ["v8-chrome", "chrome", "Chrome racer", "Pass Go.", "And keep going."], ["v8-scooter", "scooter", "E-scooter", "Ride in the middle", "of the streets."], ["v8-patrol", "patrol", "Polite Patrol", "Keepin’ it safe.", "Or, you do the chasing."]]) {
  const c = card(id).timing.cues;
  add(at(c.tagIn), "type", `tag "${tag}" lands (pointer bounce)`); add(at(c.in), "type", `${l1} (line in)`); add(at(c.in) + c.lineStagger, "type", `${l2} (line in)`); add(at(c.out), "type", `${tag} card out with the cut`);
}
{ const c = card("v8-rush").timing.cues; add(at(c.in), "type", "Don’t rush. (line in)"); add(at(c.in) + c.lineStagger, "type", "They’re (line in)"); add(at(c.pillIn), "type", "[polite.] pill pops in"); add(at(c.out), "type", "rush lines out"); }
{ const c = card("v8-9-leadin").timing.cues, e = card("v8-9z-end").timing.cues; add(at(c.in), "type", "Pick your ride. (line in)"); add(at(c.urlIn), "type", "cromaticstudios.com pill arrives (house bounce)"); add(at(c.out), "type", "Pick your ride. out"); add(at(e.black), "cut", "black comes under the pill (11 frames)"); add(at(e.settle), "type", "the pill's soft settle (tilt -6 to -4, 100 to 104 %, 1 s)"); }
add(F, "end", "end of film");
cues.sort((a, b) => a.frame - b.frame);
const J = { film: "story-e8-en.mp4", fps: 30, frames: F, duration_s: F / 30, timing_note: "frame = the first frame the event shows on (0-based, 30 fps); t = frame / 30. Same clock as E7, so the E7 mix lines up; the picture's own SFX moments (the chase) moved.", clock_frames: CLOCK, cues };
fs.writeFileSync(out, JSON.stringify(J, null, 1));
console.log(cues.length, "cues ->", out);
for (const c of cues) console.log(`| ${c.t.toFixed(2)} | ${c.frame} | ${c.type} | ${c.what} |`);
