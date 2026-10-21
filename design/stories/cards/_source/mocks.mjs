// Cromatic · stories · the cards, tried in the real stories (Iris, TASK-065d). Lia's v4 Lottie (story-a4-en,
// story-c4-en) with its words taken out and the cards drawn in by cards.mjs (the same call a story build makes), then
// frames rendered by lottie-web on the stage (stage.html), at each card's mock cues. LOCAL ONLY.
//   PORT=8975 node ../../lottie/_source/serve.mjs &     (the worktree's root)
//   node mocks.mjs <out dir>                             (PNGs + a sheet per story; the preview JSONs are deleted)
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pw from "/Users/daniel.stoic/node_modules/playwright/index.mjs";
import sharp from "/Users/daniel.stoic/cromatic-drive/node_modules/sharp/lib/index.js";
import { Comp } from "../../../lottie-ui/_source/lib/ui.mjs";
import { loadCards, drawCard, cue } from "../cards.mjs";
import { CLOCKS } from "./defs.mjs";

const here = path.dirname(fileURLToPath(import.meta.url)), LOT = path.resolve(here, "../../lottie");
const OUT = process.argv[2] || "/Users/daniel.stoic/cromatic-ops/refs/stories-lottie/cards/mocks";
fs.mkdirSync(OUT, { recursive: true });
const K = await loadCards();
const x2 = (c) => Object.fromEntries(Object.entries(c).map(([k, [a, b]]) => [k, [a * 2, b * 2]]));
const STORIES = {
  A: { src: "story-a4-en.json", clock: "A_v4", words: /^(website ·|brand ·|drive · (take your|drive|scrim)$|cromaticstudios\.com$|the end · black$)/ },
  C: { src: "story-c4-en.json", clock: "C_v4", words: /^(cromaticstudios\.com$|the end · black$|fintech · (number|Fintech Blvd\.|scrim)$|message ·|tm ·|scf · (you should take it|number|tag|SLOW, behind the ride)$|(fountain|steam|berero|palace|olari) · (number|tag|line \d|scrim|Coffee|hopping\.|City|landmarks\.|event locations|slug|Olari 9\.)$)/ }
};

function merge(key, variant) {
  const S = STORIES[key], j = JSON.parse(fs.readFileSync(path.join(LOT, S.src), "utf8")), T60 = x2(CLOCKS[S.clock]);
  const Cm = new Comp({ w: j.w, h: j.h, dur: j.op / 60, nm: "cards" });
  const top = [], main = [], behind = [];
  for (const spec of cardsOf(key, variant)) {
    spec.__T = K.T;
    const r = drawCard(Cm, spec, T60);
    for (const L of r.layers) (L.nm === "cromaticstudios.com" || / · black$/.test(L.nm) ? top : main).push(L);
    behind.push(...r.behind);
  }
  // my layers' numbers after the story's
  const off = Math.max(...j.layers.map((l) => l.ind)) + 10;
  for (const L of Cm.layers) { L.ind += off; if (L.parent != null) L.parent += off; }
  const out = []; let doneTop = false, doneMain = false, doneBehind = false, removed = 0;
  for (const L of j.layers) {
    const isWord = L.ty === 4 && S.words.test(L.nm);
    if (L.nm === "cromaticstudios.com" && !doneTop) { out.push(...top); doneTop = true; }
    if (L.nm === "scf · SLOW, behind the ride" && !doneBehind) { out.push(...behind); doneBehind = true; }
    if (isWord && !doneMain && L.nm !== "cromaticstudios.com" && L.nm !== "the end · black" && !/SLOW/.test(L.nm)) { out.push(...main); doneMain = true; }
    if (isWord) { removed++; continue; }
    out.push(L);
  }
  // (the nulls my cards parent to go with them)
  const used = new Set(out.map((l) => l.ind)), nulls = Cm.layers.filter((l) => l.ty === 3 && !used.has(l.ind));
  out.splice(out.indexOf(main[0]), 0, ...nulls);
  j.layers = out;
  const file = `_iris-preview-${key.toLowerCase()}${variant ? "-" + variant.id : ""}.json`;
  fs.writeFileSync(path.join(LOT, file), JSON.stringify(j));
  console.log(key, "removed", removed, "word layers; added", Cm.layers.length);
  return { file, T60 };
}

// the story's cards: the main ones, or with a variant in its base card's place
const byId = (a, b) => a.id.localeCompare(b.id, "en", { numeric: true });
function cardsOf(key, variant) {
  const main = K.cards.filter((c) => c.story === key && !c.variantOf);
  if (!variant) return main.sort(byId);
  return main.map((c) => (c.id === variant.variantOf ? variant : c)).sort(byId);
}
const port = process.env.STAGE_PORT || 8975;
const br = await pw.chromium.launch();
const sheets = {};
const ONLY = process.env.ONLY ? process.env.ONLY.split(",") : null; // (e.g. ONLY=a2-brand,a2b-brand-plain: those cards' mocks only)
const passes = [];
for (const key of ["A", "C"]) { passes.push([key, null]); for (const v of K.cards.filter((c) => c.story === key && c.variantOf)) passes.push([key, v]); }
for (const [key, variant] of passes) {
  const want = cardsOf(key, variant).filter((spec) => (!variant || spec === variant) && (!ONLY || ONLY.includes(spec.id)));
  if (!want.length) continue;
  const { file, T60 } = merge(key, variant);
  const p = await br.newPage({ viewport: { width: 1080, height: 1920 } });
  await p.goto(`http://127.0.0.1:${port}/design/stories/lottie/_source/stage.html?s=${file}`);
  await p.waitForFunction(() => window.ready === 1, null, { timeout: 120000 });
  sheets[key] = sheets[key] || [];
  for (const spec of want) {
    for (const [i, m] of (spec.mocks || []).entries()) {
      const fr = cue(m.at, T60);
      await p.evaluate((f) => window.go(f), fr); await p.waitForTimeout(250);
      const name = `${spec.id}${spec.states.length > 1 ? "-" + spec.states[m.state].label : (spec.mocks.length > 1 ? "-" + (i + 1) : "")}.png`;
      await p.screenshot({ path: path.join(OUT, name) });
    }
  }
  await p.close();
  if (!process.env.KEEP) fs.unlinkSync(path.join(LOT, file));
}
// the sheets list every mock of the story's cards (main cards first, then the variants), from the PNGs on disk
for (const key of ["A", "C"]) {
  const specs = [...K.cards.filter((c) => c.story === key && !c.variantOf).sort(byId), ...K.cards.filter((c) => c.story === key && c.variantOf).sort(byId)];
  sheets[key] = specs.flatMap((spec) => (spec.mocks || []).map((m, i) => ({ name: `${spec.id}${spec.states.length > 1 ? "-" + spec.states[m.state].label : (spec.mocks.length > 1 ? "-" + (i + 1) : "")}.png` }))).filter((t) => fs.existsSync(path.join(OUT, t.name)));
}
await br.close();
// a sheet per story
for (const key of Object.keys(sheets)) {
  const w = 360, h = 640, list = sheets[key], cols = Math.min(8, list.length), rows = Math.ceil(list.length / cols);
  const tiles = await Promise.all(list.map((t) => sharp(path.join(OUT, t.name)).resize(w, h).toBuffer()));
  await sharp({ create: { width: cols * w + (cols + 1) * 16, height: rows * (h + 16) + 16, channels: 3, background: "#111114" } })
    .composite(tiles.map((b, i) => ({ input: b, left: 16 + (i % cols) * (w + 16), top: 16 + Math.floor(i / cols) * (h + 16) }))).jpeg({ quality: 86 }).toFile(path.join(OUT, `sheet-${key.toLowerCase()}.jpg`));
}
console.log(Object.values(sheets).flat().length, "mocks in", OUT);
