// Cromatic · stories · E (the rides, TASK-111, Iris): the cards as a Lottie (60 fps, transparent), drawn by the card
// system (design/stories/cards: defs.mjs story E, E_VARIANT picks Mira's copy) on the story's clock. The rides are not
// in the Lottie: they are the map's own frames at 2x (render-rides.mjs), put under the cards by compose.mjs.
//   node buildE.mjs   -> ../story-e1-cards.json
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { Comp } from "../../../lottie-ui/_source/lib/ui.mjs";
import { loadCards, drawCard } from "../../cards/cards.mjs";
import { CLOCKS, E_VARIANT } from "../../cards/_source/defs.mjs";
import { F } from "./shots.mjs";

const here = path.dirname(fileURLToPath(import.meta.url));
const K = await loadCards();
const T60 = Object.fromEntries(Object.entries(CLOCKS.E1).map(([k, [a, b]]) => [k, [a * 2, b * 2]]));
const Cm = new Comp({ w: 1080, h: 1920, dur: (F * 2) / 60, nm: `Cromatic · story E1 · the rides · en · variant ${E_VARIANT}` });
// (url cards first: the pill over its black)
const cards = K.cards.filter((c) => c.story === "E").sort((a, b) => (b.layout.url ? 1 : 0) - (a.layout.url ? 1 : 0) || a.id.localeCompare(b.id, "en", { numeric: true }));
for (const c of cards) { c.__T = K.T; drawCard(Cm, c, T60); }
const j = Cm.json(); j.cromatic = { story: "E1 (the rides)", lang: "en", variant: E_VARIANT, clock: CLOCKS.E1, fps: 60 };
fs.writeFileSync(path.join(here, "..", "story-e1-cards.json"), JSON.stringify(j));
console.log("story-e1-cards", (JSON.stringify(j).length / 1024).toFixed(1), "KB", j.layers.length, "layers", j.op, "frames");
