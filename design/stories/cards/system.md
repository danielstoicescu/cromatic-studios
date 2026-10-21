# Stories · card & type system

Iris, TASK-065d, 21 Oct 2026. One system for every Instagram story and reel (A, B, C, D), 1080 x 1920. It comes from the site, not from the old cards: the hero's word in a pill (`remember a [place.]`), Ilinca's street cards on /site/ (radius 30, ink keyline, hard shadow, the sign tilted), the map's own place tags, and the cromaticstudios.com pill that already closes story C.

What was wrong with the v4 cards, in one line each:
- Too many devices per frame: a mono counter chip (`03/08`), a typed mono tag, a scrim, a title, sometimes a second title. One device per card now.
- Colour inside the type (`up for fu[n.]`, `[two minutes.]`, `[drive.]`, `Event locations.` in yellow). Gone: one text colour per card.
- The pill was small, thin and sat on a dark card that read as a caption box. The pill is now the site's pill, and it carries the word that matters.
- Corners without a rule: every title had its own margin and size. Now four corners, one margin, one scale.
- Soft gradient scrims behind the words. None now: legibility comes from size, the calm part of the frame, or the aplat.

---

## 1. Canvas and safe areas

| | px |
|---|---|
| Canvas | 1080 x 1920, 30 fps in the spec (the Lottie comps are 60 fps: every frame number x2) |
| Instagram top band | 0 to 250: progress bar and handle. Nothing to read in it |
| Instagram bottom band | 1580 to 1920 (340): reply bar. Nothing to read in it |
| Side margin | 80 left, 80 right (measure 920) |
| Reels only | keep right-aligned words out of x > 900 between y 1100 and 1580 (the like / comment column) |

**The corners** (the generous padding Daniel asked for, the same on every card):

| Anchor | Where |
|---|---|
| Top left / top right | x 80 / x 1000, the first line's cap height starts at y 300 |
| Bottom left / bottom right | x 80 / x 1000, the last line's baseline at y 1530 (descenders end about 1570) |
| Centre | x 540 |

A card picks one corner and stays there for its whole life, across cuts. A sentence can be split across two opposite corners (the fountain), never across three.

## 2. Type

**One face: Google Sans 600**, the site's display cut (`site/fonts/google-sans-latin.woff2`, the file the map, the intro and the welcome card are drawn with). No mono counters, no second family, no italics. Sentence case, a full stop on statements.

| Style | Size | Line height | Tracking | For |
|---|---|---|---|---|
| hero | 336 | 0.92 | -0.05em | one word that is the shot (SLOW) |
| headline | 168 | 0.94 | -0.045em | short punches: Take your drive. / Night coffee hopping. / Ended too soon? |
| title | 116 | 1.00 | -0.04em | statements of one or two lines, and every word-in-pill line |
| line | 88 | 1.06 | -0.035em | the sentence that leads into the end (Drive it for yourself.) |
| lead | 60 | 1.10 | -0.025em | the small line that sets up a big one (You should take it) |
| tag | 44 | 1.00 | -0.01em | address tags only |
| url | 64 | 1.00 | -0.02em | the cromaticstudios.com pill |

A line that carries a pill takes 0.2em more lead (the pill is taller than the letters).

## 3. Colour: one text colour per card

| Scene | Text |
|---|---|
| Night or dark frame (C, the dusk street in A) | paper `#FBFAF5` |
| Light frame (A's street from above) | ink `#0D0C09` |
| On the yellow aplat | ink `#0D0C09` |
| Inside any pill or tag | ink `#0D0C09` |

No letter, word or line in another colour. The pill, the aplat and the tag are objects, not type, so their fills (yellow `#FED012`, white `#FFFFFF`) do not break the rule. Every keyline and every hard shadow is ink. No gradients, no scrims, no glow.

## 4. The word in a pill

The site hero's device. The pill holds the one word the sentence is about, full stop included (as on the site: `[place.]`).

| | at title size (116) | rule |
|---|---|---|
| Height | 134.6 | 1.16em |
| Side padding | 39.4 | 0.34em |
| Gap after the words before it | 27.8 | 0.24em |
| Keyline | 5.2, ink | 0.045em |
| Hard shadow | ink, offset 3.5 / 7.5 | 0.03em / 0.065em |
| Radius | full | |
| Tilt | -3 deg about its left end | the words around it stay level |
| Fill | yellow on a scene, white on the yellow aplat | |
| Word | ink, the line's size and tracking, on the line's baseline | |

**The swap** (`city -> diorama`, `place -> facade -> building`): the left end stays, the width rolls to the next word in 8 frames (expo out), the old word rises out of the pill and the new one rises into it (the pill is their mask). The pill never leaves between words and never changes colour. Swap 3 frames after the cut, so the new shot and the new word land together.

## 5. The aplat (flat colour block)

Ilinca's street card, in the stories: a flat yellow block, radius 30, ink keyline 5, hard ink shadow 0 / 12, padding 52 at the sides, 46 on top, 50 below, tilted -2 deg about its top-left corner. Everything on it turns with it. Text on it is ink; a pill on it is white. It grows and shrinks with the pill's word (same keys as the pill). Use it when a card has to live over several busy shots (story A's `Every brand has its own [place]`), never as a caption box behind every title.

## 6. The address tag

A map tag pinned to the place: a white plate (height 84, full radius, ink keyline 4, hard shadow 0 / 7), a yellow location dot (22, ink keyline 3.5) on the left, then the name and the time in tag type, ink: `Olari 9 · 9:11`, `Fintech Blvd · 11:11`. A pointer (30 x 18) under it, 46 px from its left end, joined to the plate. Straight, no tilt: it is information, not a title. Top left at y 286 unless the place itself is somewhere else in the frame. Lands on its pointer (scale 40 % to 100 % about the pointer's tip, house bounce), leaves the same way.

## 7. The end card

Black, and only the cromaticstudios.com pill: yellow, ink text 64, keyline 6, hard shadow 10 / 14, tilt -6 deg, **centred at (540, 1000) in every story**. It arrives once (up from +260 px with the house bounce and a squash), then the screen goes black under it over 11 frames; it never moves when the black comes. The soft last move: 30 frames into the black, tilt -6 to -4 and scale 100 to 104 over 30 frames (ease in-out), then it holds until the end.

## 8. Motion (transforms and opacity only)

| Move | Frames (30 fps) | How |
|---|---|---|
| Line in | 12 | letters rise out of the line's own baseline (a mask), 0.6 frame apart; lines 4 frames apart; expo out |
| Line out | 7 | up and out of the same mask, accelerating |
| Pill in | 10 | pops from 60 % to 100 %, tilt -9 to -3, house bounce (10 % overshoot) |
| Pill swap | 8 | width rolls, words rise through it |
| Aplat in | 14 | swings in from its top-left corner: -7 to -2 deg, 24 px down, 92 % to 100 % |
| Aplat move | 12 | the whole card glides to its next place (A: to the centre for `building`) |
| Tag in / out | 9 / 6 | about the pointer's tip |
| Smash cut | 0 | SLOW only: on and off with the frame |

Holds: a line stays at least 18 frames plus 1 frame per character. The fountain and SLOW hold 70 frames or more (they need the retimed C clock below).

## 9. The cards

### Story A (v4 clock, 30 fps)

| Card | Where | What |
|---|---|---|
| a1-website | top left, ink, title | `Our new website / is a [city.]` then the pill rolls to `[diorama.]` (frame 40) |
| a2-brand | yellow aplat, top left, ink, title | `Every brand / has its own` on the aplat (Daniel's break, 116 px), and the word in **its own pill**: white, pinned 40 px in from the block's left edge, overlapping its bottom by 40 px, drawn over it. The pill swaps `[place.]` (Steam) `-> [facade.]` (OMA) `-> [building.]` (Slow Coffee) with the same rule (left end fixed, width rolls, word rises); the block never changes size. For `building` the block and its pill glide together to the centre (top 420). One card over the three shots, no re-entry |
| a2b-brand-plain | top left, paper, title | the alternative (`variantOf: a2-brand`, draw one or the other): the same two lines in paper straight on the street, the yellow pill 22 px under them. Mocked next to a2; the aplat version reads better over Steam's windows, so a2-brand is the one to use |
| a3-drive | bottom left, paper, headline | `Take your / drive.`, all paper |
| a4-end | centre | the pill at (540, 1000) over the site's last frame, then black under it, then the settle |

A card's later blocks draw over its earlier ones (the pill over the aplat). A card with a move moves as one: `drawCard` hangs all its blocks on a null.

### Story C

| Card | Where | What |
|---|---|---|
| c1-olari | tag, top left | `Olari 9 · 9:11` (replaces the typed slug and the big `Olari 9.`) |
| c2-landmarks | bottom left, paper, title | `City landmarks. / Event locations.`, one size, one colour |
| c3-coffee | bottom right, paper, headline | `Night / coffee / hopping.` in once on Steam, held through Casa Berero |
| c4-fountain | split | `Down to earth,` top left, `up for fun.` bottom right (title); the water between them |
| c5-slow | centre | `You should take it` (lead) in the sky over the dome, `SLOW` (hero) on the dark plaza under it, smash cut, drawn behind the ride |
| c6-two-minutes | top left, paper, title | `You always have / two minutes.`, held from the corner to the windscreen |
| c7-fintech | tag, top left | `Fintech Blvd · 11:11` (replaces the big super and its chip) |
| c8-soon | bottom left, paper, headline | `Ended / too soon?` |
| c9-drive | centre, paper, line | `Drive it for yourself.` over the pill (baseline 880), the pill at (540, 1000) |
| c10-end | centre | black comes under the same pill (no second entrance), then the settle |

`SLOW` moved off the dome: on its lit white ribs (v4) it lost its contrast. `Night coffee hopping.` gets a full stop like every other statement in the story.

### The C clock: Daniel's long holds need it

On v4's clock the fountain is 52 frames and the Slow Coffee shot 28: the two words Daniel wants held cannot hold. The proposed clock (`C_long` in `defs.mjs`, 30 fps, 24.6 s):

| Shot | v4 | proposed |
|---|---|---|
| olari | 0-81 | 0-81 |
| palace | 81-126 | 81-141 (two lines to read) |
| steam | 126-170 | 141-185 |
| berero | 170-210 | 185-225 |
| fountain | 210-262 | 225-330 (3.5 s) |
| scf | 262-290 | 330-414 (2.8 s) |
| corner | 290-332 | 414-456 |
| cup | 332-395 | 456-519 |
| fintech | 395-546 | 519-670 |
| end | 546-615 | 670-739 |

Every cue is relative to its shot, so the cards follow the clock: pass the new spans and they move. Each card's JSON carries its resolved frames on both clocks (`timing.frames.C_v4`, `timing.frames.C_long`).

## 10. Files

- `json/<card>.json`: the spec. `layout` has every element's position, size, colour, keyline, shadow, tilt and per-state geometry (pill widths, aplat boxes, the move's offset); `timing.cues` the cues; `timing.frames` the resolved 30 fps frames per clock (in, out, hold); `files` its SVGs. `json/tokens.json`: the system above as numbers, with the clocks.
- `svg/outlined/<card>[-state].svg`: the words as paths (the house face's own outlines and GPOS kerning, the same setLine the Lottie builds use). One SVG per pill state. Groups are named after the spec's element ids (`a2-aplat`, `a2-l3-pill`, `c1-tag-plate`...).
- `svg/live/<card>[-state].svg`: the same with live text (Google Sans 600; the @font-face points at the repo's font).
- `cards.mjs`: the cards as Lottie layers, for the story builds (`loadCards`, `drawCard`, `moveLayers`).
- `_source/`: `system.mjs` (the tokens and the layout), `defs.mjs` (the copy, the corners, the cues, the clocks), `build.mjs` (writes json/ and svg/), `mocks.mjs` (the cards drawn into Lia's v4 stories and rendered by lottie-web).
- Mocks (not in the repo): `~/cromatic-ops/refs/stories-lottie/cards/mocks/` (a frame per card and state, `sheet-a.jpg` with the a2b variant at its end, `sheet-c.jpg`) and `preview/` (the two stories recorded with the cards).

## 11. Plugging the cards into the stories (Lia)

```js
import { loadCards, drawCard, moveLayers } from "../../cards/cards.mjs";
const K = await loadCards();
// buildC4.mjs, where the words were drawn (over the shots, under the grain):
for (const id of ["c1-olari", "c2-landmarks", "c3-coffee", "c4-fountain", "c6-two-minutes", "c7-fintech", "c8-soon"]) drawCard(Cm, K.card(id), T);
const slow = drawCard(Cm, K.card("c5-slow"), T);          // the lead goes with the words...
moveLayers(Cm, slow.behind, "scf · SLOW, behind the ride"); // ...SLOW goes where v4's SLOW was (or use your own anchor layer)
// at the urlPill line (before grain): the pill and the end's black
drawCard(Cm, K.card("c9-drive"), T);
```

1. In `buildC4.mjs` take out `superTitle`, every `reveal` / `typed` / `chip` / `shade` for the words, `urlPill` and `the end · black`; draw the cards as above. `T` is your 60 fps span map, unchanged. For the long holds, change `T` to the `C_long` spans x2 and give the fountain (the water loops frame by frame) and the Slow Coffee shot (hold on the dome after the ride has passed) their extra length.
2. In `buildA5.mjs` take out both `swapLine` calls, the yellow block, the `drive ·` reveals and scrim, `urlPill` and `the end · black`; draw `a1-website`, `a2-brand`, `a3-drive` where the words were (never `a2b-brand-plain` as well: it is a2's variant) and `a4-end` at the urlPill line, with `SP` as the span map.
3. Nothing new to install: `cards.mjs` uses design/lottie-ui's `ui.mjs` and the intro's `type.mjs` (Google Sans 600 from site/fonts). Changing copy, a corner or a cue: edit `_source/defs.mjs`, run `node build.mjs` in `_source`; the JSON and SVGs follow and so does `drawCard`.
4. The cards were tried in your v4 JSONs (`mocks.mjs`: your word layers out, `drawCard` in, rendered on your stage): they build and render. Story D and B use the same tokens; new cards go in `defs.mjs`.
