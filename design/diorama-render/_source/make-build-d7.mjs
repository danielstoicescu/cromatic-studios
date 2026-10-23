// Cromatic · diorama renders (TASK-118) · story D7: writes _source/build-d7.gen.mjs from Iris's build-d6.mjs (read from
// the stories-d5 worktree, untouched): the same overlays (the pins and place cards, the cards, the page's pill and its
// close, the knocks, the screen's glass over the grid, the end), with D7's changes:
//   * "Sip through." out (its shot and its card), everything after it moved up 120 frames (60 fps)
//   * d20: "and avoid being / pulled over." in the lead style (60), the top-left corner as before
//   * no plates, no ride sprites, no glows or flares drawn for the old plates, no film (grain, flicker, vignette, the
//     weave): the diorama frames carry their own
import fs from "fs";
import path from "path";
const SRC = "/Users/daniel.stoic/cromatic-d5/design/stories/lottie/story-d/_source", HERE = path.dirname(new URL(import.meta.url).pathname);
let s = fs.readFileSync(path.join(SRC, "build-d6.mjs"), "utf8");
const cut = (a, b) => { const i = s.indexOf(a), j = s.indexOf(b, i); if (i < 0 || j < 0) throw new Error("marker " + a.slice(0, 40)); s = s.slice(0, i) + s.slice(j); };
const rep = (a, b) => { if (!s.includes(a)) throw new Error("no " + a.slice(0, 50)); s = s.replace(a, b); };
// imports and paths: absolute, into Iris's worktree
s = s.replace(/from "(\.\.?\/[^"]+)"/g, (m, p) => `from "${path.resolve(SRC, p)}"`);
rep('const here = path.dirname(fileURLToPath(import.meta.url)), OUT = path.resolve(here, "..");', `const here = ${JSON.stringify(SRC)}, OUT = ${JSON.stringify(path.resolve(HERE, "../out/d7"))};`);
// the clock without sip
rep('r5: [1600, 1696], sip: [1696, 1816], r9: [1816, 1906], r8: [1906, 2026], fount: [2026, 2206], end: [2206, 2346] };', 'r5: [1600, 1696], r9: [1696, 1786], r8: [1786, 1906], fount: [1906, 2086], end: [2086, 2226] };');
rep("const F = 2346,", "const F = 2226,");
// no cameras for the plates (the weave, the nulls), no film
cut("  const WV = weave(Cm, { amp: 0.9 });", "  // the page (story px");
rep("  grain(Cm, asset, { o: 30 });\n", "");
rep("  flicker(Cm, { amt: 3 });\n", "");
s = s.replace(/  vignette\(Cm, \{[^\n]*\n/, "");
// no plates: the fountain and the rides
cut("  // ---------- 7 · the fountain at night", "  // ---------- 2-3 (D5)");
s = s.replace(/  Cm\.shape\("ground"[^\n]*\n/, "");
// D8 (Daniel): the map's two modes named as the cuts land: "Bird's eye" on the city from high, "Drive mode" on the
// street at Steam: small yellow pills (the house's url pill, at the tag size), top-left, in before the shot's card
const D8 = ["d8", "d9", "d10", "d11"].includes(process.env.STORY), D10 = ["d10", "d11"].includes(process.env.STORY), D11 = process.env.STORY === "d11";
if (D8) rep("  clip(drawCard(Cm, card(\"d19-map\"), T2), \"zoom\");", `  for (const [text, shot, out] of [["Bird's eye", "bird", "bird+56"], ["Drive mode", "steam", ["d10", "d11"].includes(process.env.STORY) ? "steam+22" : "steam+42"]]) { const c = card("d14-end"), U = c.layout.url, size = 48, tr = -0.02, w = setLine(KC.T, text, size, tr).width, padX = 44, h = 76.8; c.id = "d8-mode-" + shot; c.layout = { url: { ...U, text, size, tracking: tr, w: w + 2 * padX, h, centre: [80 + (w + 2 * padX) / 2, 300 + h / 2], textX: 80 + padX, baseline: 300 + h / 2 + size * 0.36, keyline: 5, shadow: [8, 11], tilt: -4 } }; c.timing.cues = { urlIn: shot + "+2", out }; drawCard(Cm, c, T2); }
  clip(drawCard(Cm, card("d19-map"), T2), "zoom");`);
// D10 (Daniel on D9): the descent 0.4 s shorter and the street at Steam 0.6 s shorter (the car arrives and parks as the
// camera settles, then the place card, the knocks and the page as before, sooner): 1.0 s off the film from Steam on
if (D10) {
  rep("zoom: [456, 660], steam: [660, 850], page: [790, 1204], r1: [1204, 1288], r2: [1288, 1378], r3: [1378, 1510], r4: [1510, 1600], r5: [1600, 1696], r9: [1696, 1786], r8: [1786, 1906], fount: [1906, 2086], end: [2086, 2226] };",
      "zoom: [456, 636], steam: [636, 790], page: [730, 1144], r1: [1144, 1228], r2: [1228, 1318], r3: [1318, 1450], r4: [1450, 1540], r5: [1540, 1636], r9: [1636, 1726], r8: [1726, 1846], fount: [1846, 2026], end: [2026, 2166] };");
  rep("const F = 2226,", "const F = 2166,");
  rep("const CARD = 736, KNOCK = [752, 768], OPEN = 790,", "const CARD = 676, KNOCK = [692, 708], OPEN = 730,");
  rep("REAL = 850, CLOSE = [1140, 1176];", "REAL = 790, CLOSE = [1080, 1116];");
  rep('clip(drawCard(Cm, card("d3-knock"), T2), "steam");', 'clip(drawCard(Cm, card("d3-knock", { in: "steam+28" }), T2), "steam");');
}
// the cards: no sip; d20 smaller, its new words
rep('["d9-fly-high", "r5"], ["d10-sip", "sip"], ', '["d9-fly-high", "r5"], ');
rep("const clip = (r, shot) =>", `// D7 (Daniel): "and avoid being / pulled over.", smaller (the lead style: 60, line height 1.10, tracking -0.025),
// its first line's cap height still at y 300 in the top-left corner (Iris's rules)
const cardD7 = (id, t) => { const c = card(id, t); if (id === "d20-pulled-over") { const ls = c.layout.blocks[0].lines, size = 60, lead = 1.1, tr = -0.025, b1 = 300 + size * 0.71; [["and avoid being", b1], ["pulled over.", b1 + size * lead]].forEach(([text, bl], i) => { const L = ls[i], w = setLine(KC.T, text, size, tr).width; Object.assign(L, { text, size, tracking: tr, lead, style: "lead", baseline: +bl.toFixed(1), width: +w.toFixed(1), box: { x: 80, y: +(bl - size * 0.76).toFixed(1), w: +w.toFixed(1), h: size } }); }); } return c; };
const clip = (r, shot) =>`);
rep("clip(drawCard(Cm, card(id), T2", "clip(drawCard(Cm, cardD7(id), T2");
// D11 (Daniel on D10: "at the share button on the Steam page a problem appears"): the frame buttons over the live page were
// a rectangle cut out of the static page screenshot (its white ground and the tail of "Shop" showed as a white box over
// the photos), and they faded at the close's start so the capture's own RO button popped in under them. Now the layer
// is masked to the two buttons' own shapes (Share's pill, the close circle) and the buttons ride the close inside the
// page's pill (a matte of their own), so they go with the page.
if (D11) {
  rep("    btnLayer.hasMask = true; btnLayer.masksProperties = [{ inv: false, mode: \"a\", pt: { a: 0, k: poly([[bx0, 0], [W, 0], [W, by1], [bx0, by1]]) }, o: prop(100), x: prop(0), nm: \"buttons\" }];\n    btnLayer.ks.o = prop([[REAL, 100, E.hold], [CLOSE[0] - 4, 100, E.linear], [CLOSE[0], 0]]);",
    "    btnLayer.hasMask = true; btnLayer.masksProperties = BTN_MASKS(); BTN_FIT(btnLayer);");
  rep("    Cm.shape(\"close · matte\", [group(\"pill\", [shp(pk), fill(rgb(\"#ffffff\"))])], { ip: c0, op: c1 + 1, td: true });",
    "    Cm.shape(\"close · buttons matte\", [group(\"pill\", [shp(pk), fill(rgb(\"#ffffff\"))])], { ip: c0, op: c1 + 1, td: true });\n    { const bl = img(\"d2-ui-opened-en\", null, { ip: c0, op: c1 + 1, nm: \"close · frame buttons\" }); bl.tt = 1; bl.hasMask = true; bl.masksProperties = BTN_MASKS(); BTN_FIT(bl); }\n    Cm.shape(\"close · matte\", [group(\"pill\", [shp(pk), fill(rgb(\"#ffffff\"))])], { ip: c0, op: c1 + 1, td: true });");
  rep("const S = P.shots;", "const S = P.shots;\nconst BTN_MASKS = () => S[\"ui2-en\"].frameButtons.map(([x, y, w, h], i) => { const d = 1080 / 390; return { inv: false, mode: \"a\", pt: { a: 0, k: roundRect((x + w / 2) * d, (y + h / 2) * d, w * d + 2, h * d + 2, (h * d + 2) / 2) }, o: prop(100), x: prop(0), nm: \"button \" + i }; });\n// (the live capture has its own RO button where the close circle sits, a little wider: the buttons 5% larger about the circle, 8 px left, cover it)\nconst BTN_FIT = (L) => { const d = 1080 / 390, [x, y, w, h] = S[\"ui2-en\"].frameButtons[1], cx = (x + w / 2) * d, cy = (y + h / 2) * d; L.ks.a = prop([cx, cy, 0]); L.ks.p = prop([cx - 8, cy, 0]); L.ks.s = prop([105, 105, 100]); };");
}
rep('fs.writeFileSync(path.join(OUT, "story-d6-en.json"), s);', 'fs.mkdirSync(OUT, { recursive: true }); fs.writeFileSync(path.join(OUT, `story-${process.env.STORY || "d7"}-en.json`), s);');
rep('story: "D6 (Daniel\'s notes on D5)"', 'story: "D7 in diorama (Daniel\'s notes on D6)"');
fs.writeFileSync(path.join(HERE, `build-${process.env.STORY || "d7"}.gen.mjs`), "// GENERATED by make-build-d7.mjs from Iris's build-d6.mjs: do not edit\n" + s);
console.log("build-d7.gen.mjs", s.length);
