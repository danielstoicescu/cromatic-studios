// beta 3.1 (Daniel): "at the gloves with I O N", the Two Min Lab mini-game. A small 16-bit fighting game, original in
// every pixel (no character, name, sprite, sound or font of any existing game): pick Daniel, Cristian or Coz from the
// Cromatic crew and box I O N, the founder of Two Minutes, in front of the Two Minutes shop. Best of three rounds.
// It is its own page, /play/gloves/ (build/build.mjs writes it with this file and src/minigame.css, hashed, loaded
// only there); the map opens it in the case frame (openFrameHook), so closing it, Back and the camera behave as they
// do for a case page. Everything is drawn here, in code, on a 384x216 canvas scaled up with crisp pixels: the font,
// the fighters (a jointed pixel puppet baked into frames at start), the portraits (pixel maps below), the stage, the
// HUD. The sound is Web Audio, made on the spot, and keeps the site's mute setting (localStorage "cz-sound").
// beta 3.11 (Daniel, round 2): ten fighters (the crew, I O N, and guests: Dony, Maria, Cristache, Steve, Rares),
// drawn as shaded athletes, and both sides picked on the select screen: Player 1, then the CPU (I O N by default).
// beta 3.15 (Daniel, round 4, for the live site): bare fists in coloured wraps, workwear I O N, shirtless Cristache
// with glasses and a cigarette, Steve in a varsity jacket, portraits drawn from the fighters themselves, a MENU button.
// beta 3.32 (Daniel: "closer to the GIFs I sent: the pixel density, the shadows, the white and black outlines"): the
// arcade sprites' look, in the same puppet: six tones a material with the hue turning (yellow in the light, red or
// blue-violet in the shade), hard cel bands with no dither, every outline in its material's own darkest tone (black
// only on black things), a rim of light on the edges facing the light, fists with fingers, cloth folds with their lit
// ridge, hair in lit locks; the portraits drawn at 2x (one-pixel detail, not 2x2); Cristache smokes.
// beta 3.33 (Daniel: "let's make the pixels smaller, so we have more detail"; "closer to the refs' proportions"): the
// canvas is 768x432 (the game still counts in its 384x216 units); the fighters about 200 px in the guard with a head
// of about 36, five and a half heads tall, broader shoulders, bigger fists and feet; every face drawn again at the size
// it is shown (the fight, the select busts, the portraits, the VS at 8 pixels a head unit), never a small one made
// bigger; the splash a still key art at dusk; the ending's jump-start runs off the La Marzocco in the shop window; the
// art is baked in the spare time of the frames so nothing waits on it.
// beta 3.34 (Daniel: "the fixes related to the enlarged pixels: redraw them"): what was still the 1x drawing doubled is
// drawn at 768x432: the projectiles and the effects (sprites in the fighters' Fig), the whole street, the HUD's pieces,
// the frames, the ticket, the buttons; the letters doubled with a scaler that only fills the steps of the diagonals.
// beta 3.35: the bodies kept apart in the corner and when one gets up (they could stand inside each other for a moment).
// beta 3.36 (Daniel: "it doesn't look like Street Fighter any more; back to the initial pixels"): RS = 1, the game drawn
// at its own 384x216 again; the fighters at the arcade's size (about 95 px, a 17 px head drawn for that size), the
// 3.32 street, effects and HUD pieces at 1x, an arcade HUD; the faces in the portraits at 1x art pixels, doubled for VS.
(function () {
  "use strict";
  const W = 384, H = 216, FLOOR = 200, STAGE_W = 576;
  // beta 3.33 (Daniel: "let's make the pixels smaller, so we have more detail"): the canvas is 768x432, twice the
  // pixels each way. The game still thinks in its 384x216 units (the fight, the hit boxes, the layout of every screen:
  // a frame is drawn with the context scaled by RS), but everything that carries detail is drawn at the canvas's own
  // pixels: the fighters, the heads, the portraits, the people, the street, the bike, the car, the text (its letters
  // twice the size with a one-pixel outline). hiDraw puts such an image at a point given in game units
  const RS = 1; // beta 3.36 (Daniel: "back to the initial pixels"): the game drawn at its own 384x216 again
  const clamp = (v, a, b) => (v < a ? a : v > b ? b : v);
  const lerp = (a, b, t) => a + (b - a) * t;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const mk = (w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; const x = c.getContext("2d"); x.imageSmoothingEnabled = false; return [c, x]; };
  // "#rrggbb" -> 32-bit pixel (little-endian ABGR, as ImageData's Uint32 view sees it)
  const u32 = (h) => { const n = parseInt(h.slice(1, 7), 16); return (0xff000000 | ((n & 255) << 16) | (n & 0xff00) | (n >> 16)) >>> 0; };
  const OUT = "#170f19"; // the outline of every sprite
  let TOUCH = false; // a phone or a tablet: the on-screen controls (set when the game mounts)

  // ===================== 1. the font (5x7, drawn here) =====================
  const GLYPHS = {
    A: ".###.|#...#|#...#|#####|#...#|#...#|#...#", B: "####.|#...#|#...#|####.|#...#|#...#|####.", C: ".###.|#...#|#....|#....|#....|#...#|.###.",
    D: "####.|#...#|#...#|#...#|#...#|#...#|####.", E: "#####|#....|#....|####.|#....|#....|#####", F: "#####|#....|#....|####.|#....|#....|#....",
    G: ".###.|#...#|#....|#.###|#...#|#...#|.####", H: "#...#|#...#|#...#|#####|#...#|#...#|#...#", I: "###|.#.|.#.|.#.|.#.|.#.|###",
    J: "..###|...#.|...#.|...#.|#..#.|#..#.|.##..", K: "#...#|#..#.|#.#..|##...|#.#..|#..#.|#...#", L: "#....|#....|#....|#....|#....|#....|#####",
    M: "#...#|##.##|#.#.#|#.#.#|#...#|#...#|#...#", N: "#...#|##..#|#.#.#|#..##|#...#|#...#|#...#", O: ".###.|#...#|#...#|#...#|#...#|#...#|.###.",
    P: "####.|#...#|#...#|####.|#....|#....|#....", Q: ".###.|#...#|#...#|#...#|#.#.#|#..#.|.##.#", R: "####.|#...#|#...#|####.|#.#..|#..#.|#...#",
    S: ".####|#....|#....|.###.|....#|....#|####.", T: "#####|..#..|..#..|..#..|..#..|..#..|..#..", U: "#...#|#...#|#...#|#...#|#...#|#...#|.###.",
    V: "#...#|#...#|#...#|#...#|#...#|.#.#.|..#..", W: "#...#|#...#|#...#|#.#.#|#.#.#|##.##|#...#", X: "#...#|#...#|.#.#.|..#..|.#.#.|#...#|#...#",
    Y: "#...#|#...#|.#.#.|..#..|..#..|..#..|..#..", Z: "#####|....#|...#.|..#..|.#...|#....|#####",
    0: ".###.|#...#|#..##|#.#.#|##..#|#...#|.###.", 1: ".#.|##.|.#.|.#.|.#.|.#.|###", 2: ".###.|#...#|....#|...#.|..#..|.#...|#####",
    3: "####.|....#|....#|.###.|....#|....#|####.", 4: "...#.|..##.|.#.#.|#..#.|#####|...#.|...#.", 5: "#####|#....|####.|....#|....#|#...#|.###.",
    6: ".###.|#....|#....|####.|#...#|#...#|.###.", 7: "#####|....#|...#.|..#..|.#...|.#...|.#...", 8: ".###.|#...#|#...#|.###.|#...#|#...#|.###.",
    9: ".###.|#...#|#...#|.####|....#|....#|.###.",
    ".": ".|.|.|.|.|.|#", ",": ".|.|.|.|.|#|#", "!": "#|#|#|#|#|.|#", "?": ".###.|#...#|....#|...#.|..#..|.....|..#..",
    ":": ".|.|#|.|.|#|.", "-": "...|...|...|###|...|...|...", "'": "#|#|.|.|.|.|.", "/": "....#|...#.|...#.|..#..|.#...|.#...|#....",
    ">": "#...|.#..|..#.|...#|..#.|.#..|#...", "<": "...#|..#.|.#..|#...|.#..|..#.|...#", "+": ".....|..#..|..#..|#####|..#..|..#..|.....",
    "x": ".....|.....|#...#|.#.#.|..#..|.#.#.|#...#", "&": ".##..|#..#.|#.#..|.#...|#.#.#|#..#.|.##.#", "(": ".#|#.|#.|#.|#.|#.|.#", ")": "#.|.#|.#|.#|.#|.#|#.",
    "*": ".|.|.|#|.|.|.", "\u00B7": ".|.|.|#|.|.|.", "%": "##..#|##.#.|...#.|..#..|.#...|.#.##|#..##", " ": "...|...|...|...|...|...|...",
    "^": "..#..|.###.|#.#.#|..#..|..#..|..#..|..#..", "v": "..#..|..#..|..#..|..#..|#.#.#|.###.|..#..",
    // beta 3.11: Romanian names: rows above (~ before) and below (~ after) the letter
    "\u0102": "#...#|.###.~.###.|#...#|#...#|#####|#...#|#...#|#...#", "\u0218": ".####|#....|#....|.###.|....#|....#|####.~..#..|.#...",
    "\u021A": "#####|..#..|..#..|..#..|..#..|..#..|..#..~..#..|.#...", "\u00CE": ".###.|.....~###|.#.|.#.|.#.|.#.|.#.|###", "\u00C2": ".#.|#.#~.###.|#...#|#...#|#####|#...#|#...#|#...#"
  };
  const GL = {};
  for (const [k, v] of Object.entries(GLYPHS)) {
    const parts = v.split("~"), up = parts.length > 1 && parts[0].split("|").length < 7 ? parts.shift().split("|") : [], rows = parts.shift().split("|"), down = parts.length ? parts.shift().split("|").filter(Boolean) : [];
    GL[k] = { w: Math.max(...rows.map((r) => r.length)), rows, up, down };
  }
  const glyph = (ch) => GL[ch] || GL[ch.toUpperCase()] || GL["?"];
  const textW = (s, sc = 1, sp = 1) => { let w = 0; for (const ch of s) w += (glyph(ch).w + sp) * sc; return Math.max(0, w - sp * sc); };
  const TXT = new Map();
  // a line of text as a small canvas: fill colour (or a vertical gradient: an array of colours, one per glyph row),
  // a dark outline and an optional drop shadow; cached, so a frame draws images, not pixels
  function textImg(s, fill, o = {}) {
    const sc = o.sc || 1, sp = o.sp ?? 1, ol = o.ol === undefined ? OUT : o.ol, sh = o.sh || 0;
    const key = s + "|" + fill + "|" + sc + "|" + sp + "|" + ol + "|" + sh + (o.raw ? "|raw" : "");
    if (TXT.has(key)) return TXT.get(key);
    const pad = (ol ? 1 : 0) + sh, padY = pad + 2 * sc, tw = textW(s, sc, sp), th = 7 * sc; // 2 rows of room above and below (accents)
    const [c, x] = mk(tw + pad * 2 + 1, th + padY * 2 + 1);
    const grad = Array.isArray(fill) ? fill : null;
    // beta 3.34 (Daniel: the doubled pixels redrawn): at an even size the letters are drawn at half that size and doubled
    // with a pixel-art scaler (EPX), so their diagonals and curves step one fine pixel at a time instead of two: the
    // font at the canvas's own resolution; the outline and the shadow are then laid at that resolution
    if (RS > 1 && sc >= 2 && sc % 2 === 0 && !o.raw) {
      const half = textImg(s, fill, { sc: sc / 2, sp, ol: null, sh: 0, raw: 1 }), big = epx(half.c, true);
      x.drawImage(big, pad, padY - 2 * (half.padY));
    } else {
    let cx = pad;
    for (const ch of s) {
      const g = glyph(ch);
      const all = [...g.up.map((row, i) => [i - g.up.length, row]), ...g.rows.map((row, i) => [i, row]), ...g.down.map((row, i) => [7 + i, row])];
      for (const [r, row] of all) for (let q = 0; q < row.length; q++) if (row[q] === "#") {
        x.fillStyle = grad ? grad[clamp(Math.floor((r * grad.length) / 7), 0, grad.length - 1)] : fill;
        x.fillRect(cx + q * sc + Math.floor((g.w - row.length) / 2) * sc, padY + r * sc, sc, sc);
      }
      cx += (g.w + sp) * sc;
    }
    }
    if (ol || sh) {
      const id = x.getImageData(0, 0, c.width, c.height), d = new Uint32Array(id.data.buffer), w = c.width, h = c.height;
      const src = d.slice(), on = (i) => (src[i] >>> 24) > 0;
      if (ol) { const oc = u32(ol); for (let y = 0; y < h; y++) for (let q = 0; q < w; q++) { const i = y * w + q; if (on(i)) continue; if ((q > 0 && on(i - 1)) || (q < w - 1 && on(i + 1)) || (y > 0 && on(i - w)) || (y < h - 1 && on(i + w)) || (q > 0 && y > 0 && on(i - w - 1)) || (q < w - 1 && y > 0 && on(i - w + 1)) || (q > 0 && y < h - 1 && on(i + w - 1)) || (q < w - 1 && y < h - 1 && on(i + w + 1))) d[i] = oc; } }
      if (sh) { const s2 = d.slice(), sc2 = u32(OUT); for (let y = h - 1; y >= sh; y--) for (let q = w - 1; q >= sh; q--) { const i = y * w + q; if ((s2[i] >>> 24) === 0 && (s2[(y - sh) * w + q - sh] >>> 24) > 0) d[i] = sc2; } }
      x.putImageData(id, 0, 0);
    }
    const r = { c, w: c.width, h: c.height, pad, padY };
    TXT.set(key, r);
    return r;
  }
  // draws text; align "l" | "c" | "r"; y is the top of the letters
  function text(ctx, s, x, y, fill, o = {}) {
    const m = ctx.getTransform(), k = Math.round(m.a);
    if (k > 1) { // on the 2x canvas: the letters k times bigger, drawn at the canvas's pixels (a one-pixel outline, a k-pixel shadow)
      const sc = o.sc || 1, sp = o.sp ?? 1, t = textImg(s, fill, Object.assign({}, o, { sc: sc * k, sh: (o.sh || 0) * k })), al = o.al || "l", tw = textW(s, sc, sp);
      const lx = al === "c" ? Math.round((x - tw / 2) * k) / k : al === "r" ? x - tw : x;
      ctx.save(); ctx.setTransform(1, 0, 0, 1, 0, 0); ctx.drawImage(t.c, Math.round(m.e + m.a * lx) - t.pad, Math.round(m.f + m.d * y) - t.padY); ctx.restore();
      return;
    }
    const t = textImg(s, fill, o), al = o.al || "l";
    const lx = al === "c" ? Math.round(x - (t.w - t.pad * 2) / 2) : al === "r" ? x - (t.w - t.pad * 2) : x;
    ctx.drawImage(t.c, lx - t.pad, Math.round(y) - t.padY);
  }
  // an image drawn at the canvas's own pixels, its anchor (ax, ay, in its pixels) at the point (x, y) in game units,
  // flipped when face < 0; under any scale the context has (the game's RS, or 1 for an export)
  function hiDraw(ctx, img, x, y, face = 1, ax = 0, ay = 0) {
    const m = ctx.getTransform(), k = m.a / RS;
    ctx.save(); ctx.setTransform(k, 0, 0, k, Math.round(m.e + m.a * x), Math.round(m.f + m.d * y)); if (face < 0) ctx.scale(-1, 1); ctx.drawImage(img, -ax, -ay); ctx.restore();
  }
  const GOLD = ["#fff6b8", "#ffe14a", "#ffc21a", "#ff9d14", "#f2700f", "#d9480f", "#b8320c"];
  const RED = ["#ffd0c4", "#ff8a6e", "#ff5236", "#e8301c", "#c41f14", "#9c160f", "#7a0f0b"];
  const ICE = ["#ffffff", "#e8f7ff", "#bfe9ff", "#8fd5ff", "#5cb8f5", "#3a8fe0", "#2a68c0"];

  // ===================== 2. the portraits =====================
  // beta 3.15 (Daniel: "the same head size and framing, matching the game"): every portrait is the fighter as drawn in
  // the game, head and shoulders (the glasses, the cap, the cigarette, the outfit all match), cut round the neck so
  // the head size and the eye line are the same for all; doubled with a pixel-art scaler (EPX) for the bigger frames
  function epx(src, fillOnly) { // fillOnly (beta 3.34, the letters): only the empty pixels take a neighbour's colour (a step of a diagonal filled in), a drawn pixel keeps its square corners
    const w = src.width, h = src.height, s0 = new Uint32Array(src.getContext("2d").getImageData(0, 0, w, h).data.buffer), [c, x] = mk(w * 2, h * 2), id = x.createImageData(w * 2, h * 2), d = new Uint32Array(id.data.buffer);
    const P = (i, j) => (i < 0 || j < 0 || i >= w || j >= h ? 0 : s0[j * w + i]);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const p = P(i, j), a = P(i, j - 1), b = P(i + 1, j), l = P(i - 1, j), dn = P(i, j + 1);
      const o = [p, p, p, p];
      if (fillOnly && (p >>> 24)) { const k = j * 2 * w * 2 + i * 2; d[k] = d[k + 1] = d[k + w * 2] = d[k + w * 2 + 1] = p; continue; }
      if (l === a && l !== dn && a !== b) o[0] = a; if (a === b && a !== l && b !== dn) o[1] = b; if (dn === l && dn !== b && l !== a) o[2] = l; if (b === dn && b !== a && dn !== l) o[3] = dn;
      const k = j * 2 * w * 2 + i * 2; d[k] = o[0]; d[k + 1] = o[1]; d[k + w * 2] = o[2]; d[k + w * 2 + 1] = o[3];
    }
    x.putImageData(id, 0, 0); return c;
  }
  const PORT = {};
  // beta 3.32 (Daniel: "closer to the GIFs: the pixel density"): the portraits are no longer the small bust doubled
  // (2x2 pixels): the bust is drawn again at twice the resolution (the body K = 2, the head at 2x with its own
  // details), so a 64 px portrait has one-pixel detail like the fighters; the VS screen doubles that. Cristache has his
  // cigarette in his mouth with a wisp of smoke
  const bustPose = (id) => (LOOKS[id].smokes ? Object.assign({}, BUST_POSE, { cig: "mouth" }) : BUST_POSE);
  function wisp(x, c, e, k) { // a thin S of smoke rising from the lit end, fading
    if (!e) return;
    const pts = k > 1 ? [[0, -2, 0], [1, -3, 0], [1, -4, 0], [0, -5, 0], [-1, -6, 1], [-1, -7, 1], [0, -8, 1], [1, -9, 1], [2, -10, 2], [2, -11, 2], [1, -13, 2], [0, -14, 3], [0, -16, 3]] : [[0, -2, 0], [1, -3, 1], [0, -4, 1], [0, -5, 2], [1, -7, 3]];
    for (const [dx, dy, a] of pts) { x.fillStyle = ["#f0f0f4", "#d6d6e0", "#b8b8c8", "#9a9aac"][a]; x.fillRect(e[0] + dx, e[1] + dy, 1, 1); }
  }
  // beta 3.33 (Daniel, finer pixels): the select tiles' busts, the portraits and the VS faces are each drawn at their
  // own size, at the canvas's pixels: the head at Kh small pixels a head unit (2, 4, 8: one, two and four times the
  // fight's), the body at the scale that keeps the fight's proportions, framed the same way (the neck at the same
  // place, the head filling the frame); never a smaller picture made bigger
  // beta 3.36: the faces at 1x art pixels again, a size up from the fight's (the select tiles' busts with the 26 px
  // head, the portraits with the 52 px one); the VS shows the portrait with its pixels doubled, big and chunky, as the
  // arcade VS screens do
  function bustAt(id, Kh, size, pad) {
    const sc = (LOOKS[id].build.sc || 1) * 1.1 * Kh, cw = size + pad * 2, nX = size / 2 + pad, nY = Math.round(size * 0.906) + pad;
    const f = drawFighter(id, bustPose(id), null, null, { K: (1.1 * Kh) / BODY, HK: Kh, w: cw, h: cw, ox: nX - BUST_POSE.neck[0] * sc, oy: nY - BUST_POSE.neck[1] * sc });
    const [c, x] = mk(size, size); x.drawImage(f, pad, Math.round(pad / 2), size, size, 0, 0, size, size);
    if (f.ember) c.ember = [f.ember[0] - pad, f.ember[1] - Math.round(pad / 2)];
    return c;
  }
  function bust(id) { // 36x36, the head at 1
    if (PORT[id + ":s"]) return PORT[id + ":s"];
    const c = bustAt(id, 1, TILE, 2); if (c.ember) wisp(c.getContext("2d"), c, c.ember, 1);
    return (PORT[id + ":s"] = c);
  }
  function portrait(id) { // 64x64, the head at 2
    if (PORT[id]) return PORT[id];
    const c = bustAt(id, 2, 64, 4); if (c.ember) wisp(c.getContext("2d"), c, c.ember, 2);
    return (PORT[id] = c);
  }
  const portraitBig = (id) => { if (PORT[id + ":b"]) return PORT[id + ":b"]; const P = portrait(id), [c, x] = mk(128, 128); x.imageSmoothingEnabled = false; x.drawImage(P, 0, 0, 128, 128); if (P.ember) c.ember = [P.ember[0] * 2, P.ember[1] * 2]; return (PORT[id + ":b"] = c); }; // the VS: the portrait, its pixels doubled
  const VSQ = new Set(), wantBig = (id) => { if (id === "random" || PORT[id + ":b"] || VSQ.has(id)) return; VSQ.add(id); BAKEQ.push(() => portraitBig(id)); };
  const drawFlipped = (ctx, img, x, y, w, h, flip) => { if (!flip) return ctx.drawImage(img, x, y, w, h); ctx.save(); ctx.translate(x + w, y); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0, w, h); ctx.restore(); };

  // ===================== 3. the fighters: heads and a shaded pixel puppet =====================
  // beta 3.11 (Daniel: "more athletic, no lines between the pieces"): every limb is one continuous form, shaded by
  // the light on it (five tones a material), not outlined piece by piece. One dark outline goes round the whole
  // figure; where a nearer part crosses a farther one (an arm over the chest), the farther one gets a one-pixel
  // shadow in its own colour. Broad shoulders, tapered limbs with the muscle in them, a low stance.
  // colours: one base per material, five tones made from it (light, lit, base, shade, deep)
  const rgbOf = (h) => { const n = parseInt(h.slice(1, 7), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const hexOf = (c) => "#" + c.map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0")).join("");
  // beta 3.32 (Daniel: "closer to the GIFs: the pixel density, the shadows, the white and black outlines"): the ramps
  // as the 90s arcade sprites have them. Six tones a material: a pale highlight turned towards yellow, a lit tone, the
  // base, two shades turned towards red (warm colours) or blue-violet (cool ones) with the lightness stepping down
  // (x0.84, x0.66), and an outline tone (x0.40), the material's own darkest colour, not a flat black. Greys get a cool
  // shade; near-whites keep their colour as the lit tone and shade to warm greys (the white tee, the sneakers)
  const RAMPS = new Map(), OUTL = new Map(), RIM = new Map();
  const hslOf = ([r, g2, b]) => { r /= 255; g2 /= 255; b /= 255; const mx = Math.max(r, g2, b), mn = Math.min(r, g2, b), l = (mx + mn) / 2, d = mx - mn; if (d < 1e-6) return [0, 0, l]; const s2 = d / (1 - Math.abs(2 * l - 1)); let h = mx === r ? ((g2 - b) / d) % 6 : mx === g2 ? (b - r) / d + 2 : (r - g2) / d + 4; return [(h * 60 + 360) % 360, s2, l]; };
  const rgbOfHsl = (h, s2, l) => { h = ((h % 360) + 360) % 360; s2 = clamp(s2, 0, 1); l = clamp(l, 0, 1); const c = (1 - Math.abs(2 * l - 1)) * s2, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2, k = Math.floor(h / 60) % 6; return [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][k].map((v) => (v + m) * 255); };
  const towards = (h, to, by) => { let d = ((to - h + 540) % 360) - 180; return h + clamp(d, -by, by); };
  function ramp(base) {
    if (RAMPS.has(base)) return RAMPS.get(base);
    let [h, s2, l] = hslOf(rgbOf(base));
    const grey = s2 < 0.1, warm = !grey && (h < 75 || h > 320), cool = !grey && !warm;
    const muted = warm && s2 < 0.88; // skin, tan, khaki: the shades step down gently and lose their colour (as the refs' skin)
    const vivid = s2 > 0.55 && !muted, up1 = vivid ? 0.42 : 0.58, up2 = vivid ? 0.2 : 0.26; // a vivid colour keeps its colour in the light (a red goes orange, not pink)
    const hiH = warm ? towards(h, 50, vivid ? 22 : 14) : cool ? towards(h, 195, 8) : h, shH = (k) => (warm ? towards(h, muted ? 10 : 0, (muted ? 4 : 9) * k) : cool ? towards(h, 245, 9 * k) : grey && s2 < 0.03 ? 250 : h);
    const sh2 = (k) => (grey ? Math.max(s2, 0.05 + 0.02 * k) : muted ? s2 * [1, 0.78, 0.5, 0.44][k] : s2 * (1 - 0.05 * k));
    let L = [l + (0.97 - l) * up1, l + (0.97 - l) * up2, l, l * (muted ? 0.86 : 0.8), l * (muted ? 0.68 : 0.6), Math.max(0.05, l * (muted ? 0.3 : 0.3))]; // beta 3.36: the outline darker, as the arcade sprites
    if (l > 0.86) L = [Math.min(0.99, l + (1 - l) * 0.6), l, l * 0.9, l * 0.78, l * 0.64, l * 0.4]; // a white: it shades to warm greys
    const S = [Math.min(1, s2 * (muted ? 1.12 : 1.05)), s2, s2, sh2(1), sh2(2), Math.max(grey ? 0.06 : 0.2, sh2(3) * 0.95)];
    const Hh = [hiH, towards(h, hiH, 6), h, shH(1), shH(2), l > 0.86 ? (cool ? 240 : 30) : shH(2.6)];
    if (l > 0.86) { S[3] = Math.max(S[3], 0.12); S[4] = Math.max(S[4], 0.14); S[5] = 0.18; if (!cool) { Hh[3] = Hh[4] = 38; } }
    const r = L.map((v, i) => u32(hexOf(rgbOfHsl(Hh[i], S[i], v))));
    if (l > 0.86) r[1] = u32(base);
    else r[2] = u32(base);
    for (let i = 0; i < 6; i++) { if (!OUTL.has(r[i])) OUTL.set(r[i], r[5]); if (i > 1 && i < 5 && !RIM.has(r[i])) RIM.set(r[i], r[i - 1]); }
    RAMPS.set(base, r);
    return r;
  }
  // the outline tone of any colour (a colour from a ramp has its ramp's; any other gets one made the same way)
  const outlineOf = (v) => { let o = OUTL.get(v); if (o === undefined) { o = ramp(hexOf([v & 255, (v >> 8) & 255, (v >> 16) & 255]))[5]; OUTL.set(v, o); } return o; };
  // per fighter: the build (sh shoulders, arm, leg, waist, sc the whole size) and the clothes
  // beta 3.12 (Daniel: "neater, more meaningful outfits, with accessories"; three archetype nods): per fighter, the
  // build (sh shoulders, arm, leg, waist, chest, sc the whole size) and a clean fighting outfit that still reads as them
  // beta 3.15 (Daniel): bare fists in hand wraps for everyone, the tape in each fighter's colour (glove)
  const LOOKS = {
    // I O N: workwear, relaxed: a navy work shirt, loose canvas work trousers, work boots worn casual, the cap backwards
    // beta 3.31 (Daniel: "Ion's shoes are proportioned strangely, put him in Asics running shoes"): low, sleek runners
    // the size of everyone's shoes (light grey upper, the crossing side stripes as a nod, no logo, a chunky light
    // midsole), the trousers a little narrower at the hem so the shoe shows
    ion: { skin: "#dca07a", top: "#22305a", topKind: "workshirt", sleeve: "rolled", pants: "#a07a44", loose: 1.8, hem: 0.7, canvas: true, runner: { upper: "#f2f3f6", stripe: "#1d4fd8", heel: "#1d4fd8", mid: "#fbfaf6" }, shoe: "#f2f3f6", sole: "#3a3a46", glove: "#d8342a", build: { sh: 1.08, arm: 1.06 } },
    // Cristache: shirtless, grey trousers, the calm karate stance; glasses and a cigarette (on the head)
    // beta 3.31 (Daniel: "Cristache smaller, leaner"): a size down, a narrow chest and waist, slim arms, as in his photos
    cristache: { skin: "#e6aa86", top: "#e6aa86", topKind: "bare", lean: true, smokes: true, sleeve: "none", pants: "#8a8a90", loose: 1.4, barefoot: true, glove: "#28c840", build: { sc: 0.9, sh: 0.86, arm: 0.8, chest: 0.84, waist: 0.82, leg: 0.92 } },
    // Rares: the flashy nod: sleeveless, a gold chain, the key tag, taped ankles, barefoot
    // beta 3.31 (Daniel, likeness): the white tee he wears in both photos (short sleeves, the small print on the chest), the
    // tattoos on the arms, the yellow key tag at the belt
    rares: { skin: "#ecb593", top: "#f4f2ee", topKind: "printtee", sleeve: "short", tattoo: true, key: true, pants: "#1c1c22", loose: 1.5, belt: "#1c1c22", barefoot: true, ankle: "#f2efe6", glove: "#2fd6f0", build: { arm: 1.08 } },
    iulica: { skin: "#c27f57", top: "#5f6e40", topKind: "tee", sleeve: "short", strap: "#d9cba8", pants: "#2c2c32", shoe: "#3a3a3a", sole: "#e0e0e0", glove: "#b8e02f", build: { sh: 0.98 } },
    maria: { skin: "#ebb597", top: "#f2f0ea", topKind: "oversize", knot: true, sleeve: "short", legs: "skirt", skirt: "#1c1c22", shoe: "#a8b89a", sole: "#6e7c62", glove: "#f0389a", build: { sc: 0.94, sh: 0.84, arm: 0.82, leg: 0.88, waist: 0.86, chest: 0.94 } }, // beta 3.33: a size down
    // Steve: dressed American: a varsity jacket (wool body, cream leather sleeves, a letter on the chest) over a white
    // tee, jeans, white sneakers; the glasses, the grey hair, the beard, the two metres
    steve: { skin: "#ecb497", top: "#7a1f2a", topKind: "varsity", inner: "#f0f0f0", sleeve: "long", sleeveCol: "#efe6d0", letter: "#efe6d0", pants: "#4a6890", shoe: "#f4f4f6", sole: "#b8b8c4", glove: "#7a4fe0", build: { sh: 1.1, arm: 1.12, leg: 1.1, waist: 1.3, chest: 1.12, sc: 1.14 } },
    dony: { skin: "#efbe9e", top: "#2c3c6c", topKind: "fleece", sleeve: "long", apron: "#b08a5a", pants: "#2e2e36", shoe: "#2a2a2a", sole: "#d8d8d8", glove: "#8a5530", build: { sc: 0.86, arm: 0.96 } },
    cristian: { skin: "#e9ab84", top: "#7a6c50", topKind: "henley", sleeve: "rolled", belt: "#3a2618", buckle: "#c9a640", pants: "#3e4048", shoe: "#4a3022", sole: "#1a120e", glove: "#2f6fe0", build: {} },
    daniel: { skin: "#e7a57d", top: "#1fb0ba", topKind: "tee", sleeve: "short", stripe: "#fed012", belt: "#1c1820", buckle: "#c9ccd4", pants: "#2e3a62", shoe: "#f2f2f6", sole: "#9a9ab0", glove: "#fed012", build: {} }
  };
  // the canvas of one frame: colour, the order things were laid (z) and which form they belong to (group)
  function Fig(w, h) { this.w = w; this.h = h; this.c = new Uint32Array(w * h); this.z = new Uint16Array(w * h); this.g = new Uint8Array(w * h); this.n = 0; }
  Fig.prototype.fill = function (x0, y0, x1, y1, inside, color, group) {
    const z = ++this.n;
    x0 = Math.max(0, Math.floor(x0)); y0 = Math.max(0, Math.floor(y0)); x1 = Math.min(this.w - 1, Math.ceil(x1)); y1 = Math.min(this.h - 1, Math.ceil(y1));
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
      const px = x + 0.5, py = y + 0.5; if (!inside(px, py)) continue;
      CURX = x; CURY = y;
      const col = color(px, py); if (!col) continue;
      const i = y * this.w + x; this.c[i] = col; this.z[i] = z; this.g[i] = group;
    }
  };
  Fig.prototype.blit = function (rows, pal, cx, cy, rot, at, group) {
    const z = ++this.n, h = rows.length, w = rows[0].length, ax = at ? at[0] : w / 2, ay = at ? at[1] : h / 2;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const ch = rows[y][x]; if (!ch || ch === ".") continue;
      let px, py;
      if (rot === 1) { px = cx - (ay - y); py = cy - (x - ax); } // a quarter turn, the face up, the crown away from the body (lying on the back)
      else { px = cx + x - ax; py = cy + y - ay; }
      px = Math.round(px); py = Math.round(py);
      if (px < 0 || py < 0 || px >= this.w || py >= this.h) continue;
      const v = pal[ch]; const i = py * this.w + px; this.c[i] = typeof v === "number" ? v : u32(v || "#ff00ff"); this.z[i] = z; this.g[i] = group;
    }
  };
  // the finish: a line where a nearer form crosses a farther one, and the outline round the figure.
  // beta 3.32 (Daniel, the arcade refs): the outline in each material's own darkest tone (dark brown round the skin, a
  // warm grey round a white tee, near black round black hair and trousers), the inner lines the same, and a rim of light
  // on the edges that face the light (up and towards the back), one tone lighter, as the 90s sprites have it
  Fig.prototype.finish = function (crop) {
    const { w, h, c, z, g } = this, out = new Uint32Array(c), oc = u32(OUT), n = w * h;
    const lum = (v) => (v & 255) * 3 + ((v >> 8) & 255) * 6 + ((v >> 16) & 255);
    let best = 0, bl = 0;
    const take = (j) => { const o = c[j] === oc ? oc : outlineOf(c[j]), lo = lum(o); if (lo < bl) { bl = lo; best = o; } };
    for (let y = 0, i = 0; y < h; y++) for (let x = 0; x < w; x++, i++) {
      if (!z[i]) {
        best = 0; bl = 1e9;
        if (x > 0 && z[i - 1]) take(i - 1); if (x < w - 1 && z[i + 1]) take(i + 1); if (y > 0 && z[i - w]) take(i - w); if (y < h - 1 && z[i + w]) take(i + w);
        if (best) out[i] = best;
        continue;
      }
      const ci = c[i]; if (ci === oc) continue;
      const zi = z[i], gi = g[i];
      if ((x > 0 && z[i - 1] > zi && g[i - 1] !== gi && c[i - 1] !== oc) || (x < w - 1 && z[i + 1] > zi && g[i + 1] !== gi && c[i + 1] !== oc) || (y > 0 && z[i - w] > zi && g[i - w] !== gi && c[i - w] !== oc) || (i + w < n && z[i + w] > zi && g[i + w] !== gi && c[i + w] !== oc)) { out[i] = outlineOf(ci); continue; }
      if (y > 0 && !z[i - w]) { const r = RIM.get(ci); if (r !== undefined) out[i] = r; } // the rim light (beta 3.36: on the top edges only, as the arcade sprites)
    }
    // beta 3.33: a frame of the game is kept only as big as the figure in it (bx, by: where that box starts in the cell)
    let bx0 = 0, by0 = 0, bx1 = w - 1, by1 = h - 1;
    if (crop) { bx0 = w; by0 = h; bx1 = -1; by1 = -1; for (let y = 0, i = 0; y < h; y++) for (let x = 0; x < w; x++, i++) if (out[i]) { if (x < bx0) bx0 = x; if (x > bx1) bx1 = x; if (y < by0) by0 = y; if (y > by1) by1 = y; } if (bx1 < 0) { bx0 = by0 = 0; bx1 = by1 = 0; } }
    const cw = bx1 - bx0 + 1, chh = by1 - by0 + 1, [cv2, x2] = mk(cw, chh), id = x2.createImageData(cw, chh), o32 = new Uint32Array(id.data.buffer);
    for (let y = 0; y < chh; y++) o32.set(out.subarray((y + by0) * w + bx0, (y + by0) * w + bx0 + cw), y * cw);
    x2.putImageData(id, 0, 0); cv2.bx = bx0; cv2.by = by0;
    return cv2;
  };
  // light from the front, above, a little towards us; a normal (nx, ny) on a round form -> one of five tones
  const LI = [-0.46, -0.68, 0.57];
  // beta 3.30 (Daniel: the 90s arcade look): cel shading in hard bands. beta 3.32: no dither between them (the refs
  // have none on the fighters), the highlight a broader band
  let CURX = 0, CURY = 0;
  const BANDS = [0.88, 0.5, 0.12, -0.22]; // beta 3.36: the arcade clusters: the highlight a small spot, three broad bands
  const toneOf = (nx, ny) => {
    const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)), d = nx * LI[0] + ny * LI[1] + nz * LI[2];
    let t = 0; while (t < 4 && d <= BANDS[t]) t++;
    return t;
  };
  // beta 3.32 (the arcade refs): cloth folds as the 90s sprites draw them: a dark line two tones down with a ridge one
  // tone up on its lit side (the light comes from behind, so the ridge sits towards the back). A fold: [t0, t1, nx at
  // t0, nx at t1] along a limb, or [t, width] for a crease across it
  const LEG_FOLDS = [[[0.28, 0.78, -0.02, 0.45], [0.45, 0.9, -0.62, -0.3], [0.12, 0.42, 0.55, 0.3], [0.9, 0.03]], [[0.1, 0.035], [0.3, 0.85, -0.42, -0.3], [0.15, 0.55, 0.42, 0.1], [0.62, 0.95, 0.5, 0.2]]];
  const ARM_FOLDS = [[[0.9, 0.04], [0.5, 0.95, -0.4, 0.05], [0.2, 0.55, 0.45, 0.2]], [[0.1, 0.04], [0.25, 0.7, -0.3, 0]]];
  const folds = (nx, t, list) => {
    for (const f of list) {
      if (f.length === 2) { if (Math.abs(t - f[0]) < f[1]) return 1; continue; }
      if (t < f[0] || t > f[1]) continue;
      const d = nx - lerp(f[2], f[3], (t - f[0]) / (f[1] - f[0]));
      if (Math.abs(d) < 0.13) return 2; if (d < -0.13 && d > -0.3) return -1; // beta 3.36: a fold is a chunky shape at 1x
    }
    return 0;
  };
  // a limb: from a to b, its radius going from r0 to r1 with a swell (the muscle) peaking at "at" along it
  function limb(F, a, b, r0, r1, swell, at, mat, group) {
    const vx = b[0] - a[0], vy = b[1] - a[1], l2 = vx * vx + vy * vy || 1, R = Math.max(r0, r1) + swell, ul = Math.sqrt(l2), ux = vx / ul, uy = vy / ul;
    const geo = (px, py) => {
      const t = clamp(((px - a[0]) * vx + (py - a[1]) * vy) / l2, 0, 1), qx = a[0] + vx * t, qy = a[1] + vy * t;
      const r = lerp(r0, r1, t) + swell * Math.max(0, Math.sin(Math.PI * clamp(t / (2 * at), 0, 1)));
      return [px - qx, py - qy, r, t];
    };
    // the shading normal is taken across the limb only, so the round ends (knee, elbow) do not light up as spots
    F.fill(Math.min(a[0], b[0]) - R - 1, Math.min(a[1], b[1]) - R - 1, Math.max(a[0], b[0]) + R + 1, Math.max(a[1], b[1]) + R + 1,
      (px, py) => { const [dx, dy, r] = geo(px, py); return dx * dx + dy * dy <= r * r; },
      (px, py) => { const [dx, dy, r, t] = geo(px, py), along = dx * ux + dy * uy, ex = dx - along * ux, ey = dy - along * uy; return mat(ex / r, ey / r, t, px, py); }, group);
  }
  function blob(F, c, rx, ry, mat, group) {
    F.fill(c[0] - rx - 1, c[1] - ry - 1, c[0] + rx + 1, c[1] + ry + 1, (x, y) => ((x - c[0]) / rx) ** 2 + ((y - c[1]) / ry) ** 2 <= 1, (x, y) => mat((x - c[0]) / rx, (y - c[1]) / ry, x, y), group);
  }
  function poly(F, pts, mat, group) {
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    F.fill(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys), (x, y) => {
      let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c;
    }, mat, group);
  }
  const hash2 = (x, y) => { let h = (Math.floor(x) * 374761393 + Math.floor(y) * 668265263) | 0; h = (h ^ (h >>> 13)) * 1274126177; return ((h ^ (h >>> 16)) >>> 0) / 4294967295; };
  // ---- poses: joints in the fighter's frame (feet centre on the ground = 0,0; y up is negative; facing right).
  // tw: how far the shoulders have turned into a punch (0 side on, 1 square)
  const P0 = { hip: [0, -47], neck: [5, -75], head: [8, -86], eF: [17, -62], hF: [25, -74], eB: [7, -60], hB: [16, -69], kF: [12, -25], fF: [19, 0], kB: [-10, -23], fB: [-19, 0], tw: 0, lie: 0 };
  const pose = (o) => Object.assign({}, P0, o);
  const mixP = (a, b, t) => { const o = {}; for (const k in a) o[k] = Array.isArray(a[k]) ? [lerp(a[k][0], b[k][0], t), lerp(a[k][1], b[k][1], t)] : typeof a[k] === "number" ? lerp(a[k], b[k] ?? a[k], t) : a[k]; return o; };
  const upper = (p, dx, dy) => { const o = Object.assign({}, p); for (const k of ["neck", "head", "eF", "hF", "eB", "hB"]) o[k] = [p[k][0] + dx, p[k][1] + dy]; return o; };
  const CROUCH = pose({ hip: [0, -31], neck: [8, -57], head: [11, -68], eF: [20, -45], hF: [27, -56], eB: [10, -43], hB: [19, -52], kF: [17, -19], fF: [20, 0], kB: [-13, -13], fB: [-21, 0] });
  const KCH = pose({ hip: [-2, -49], neck: [-4, -77], head: [-1, -88], eF: [12, -64], hF: [19, -75], eB: [-1, -62], hB: [7, -71], kF: [15, -48], fF: [9, -30], kB: [-5, -24], fB: [-7, 0], tw: 0.3 });
  const KFULL = pose({ hip: [-5, -51], neck: [-12, -77], head: [-12, -88], eF: [6, -67], hF: [13, -77], eB: [-13, -61], hB: [-20, -52], kF: [24, -58], fF: [49, -64], kB: [-6, -24], fB: [-8, 0], tw: 0.6 });
  const JUMP = pose({ hip: [0, -58], neck: [4, -86], head: [7, -97], eF: [16, -73], hF: [24, -84], eB: [6, -71], hB: [15, -80], kF: [13, -46], fF: [8, -32], kB: [-1, -42], fB: [-11, -33] });
  const POSES = {
    // beta 3.30 (Daniel): the stance breathes: four frames, the chest and the shoulders rise and fall, the weight shifts
    idle: [0, 1, 2, 1].map((d) => { const p = upper(pose({ hip: [(d - 1) * 0.6, -47 + d * 0.4] }), d * 0.2, -d * 1.1); p.br = d; p.kF = [p.kF[0], p.kF[1] + d * 0.3]; p.kB = [p.kB[0] - d * 0.3, p.kB[1] + d * 0.3]; return p; }),
    crouch: [CROUCH],
    cblock: [Object.assign({}, CROUCH, { eF: [16, -50], hF: [17, -65], eB: [13, -48], hB: [22, -61] })],
    block: [pose({ hip: [-2, -47], neck: [1, -75], head: [4, -85], eF: [15, -68], hF: [16, -84], eB: [11, -66], hB: [21, -79] })],
    punch: [
      pose({ hip: [-1, -47], neck: [2, -75], head: [5, -86], eF: [13, -62], hF: [17, -70], eB: [5, -60], hB: [13, -68] }),
      pose({ hip: [3, -47], neck: [10, -75], head: [13, -85], eF: [26, -70], hF: [38, -72], eB: [4, -61], hB: [12, -69], kF: [14, -25], fF: [21, 0], tw: 0.55 }),
      pose({ hip: [5, -46], neck: [13, -74], head: [16, -84], eF: [31, -72], hF: [47, -73], eB: [3, -62], hB: [10, -70], kF: [17, -25], fF: [24, 0], kB: [-12, -21], fB: [-22, 0], tw: 0.9 }),
      pose({ hip: [2, -47], neck: [8, -75], head: [11, -85], eF: [23, -66], hF: [32, -72], eB: [6, -60], hB: [14, -69], tw: 0.4 })
    ],
    kick: [KCH, mixP(KCH, KFULL, 0.6), KFULL, mixP(KFULL, KCH, 0.6), mixP(KCH, P0, 0.5)],
    cpunch: [Object.assign({}, CROUCH, { eF: [16, -46], hF: [19, -53] }), Object.assign({}, CROUCH, { neck: [11, -56], head: [14, -66], eF: [30, -50], hF: [44, -50], tw: 0.8 })],
    ckick: [pose({ hip: [-2, -28], neck: [-6, -52], head: [-5, -63], eF: [8, -44], hF: [14, -54], eB: [-10, -36], hB: [-16, -26], kF: [12, -13], fF: [26, -3], kB: [-12, -11], fB: [-20, 0] }),
      pose({ hip: [-3, -26], neck: [-10, -50], head: [-10, -61], eF: [5, -42], hF: [12, -52], eB: [-14, -30], hB: [-22, -18], kF: [20, -9], fF: [48, -4], kB: [-12, -11], fB: [-20, 0] })],
    jump: [JUMP],
    jkick: [Object.assign({}, JUMP, { neck: [0, -86], head: [3, -97], eF: [11, -74], hF: [18, -84], eB: [-8, -70], hB: [-2, -80], kF: [20, -54], fF: [46, -48], kB: [-3, -40], fB: [-14, -34] })],
    jpunch: [Object.assign({}, JUMP, { neck: [7, -86], head: [10, -97], eF: [27, -72], hF: [42, -66], tw: 0.7 })],
    hit: [pose({ hip: [-3, -46], neck: [-11, -72], head: [-15, -81], eF: [6, -62], hF: [12, -70], eB: [-12, -62], hB: [-18, -72], kF: [8, -24], fF: [14, 0], kB: [-9, -23], fB: [-16, 0] })],
    fall: [pose({ hip: [-6, -40], neck: [-22, -58], head: [-28, -66], eF: [-4, -60], hF: [4, -72], eB: [-24, -50], hB: [-33, -58], kF: [8, -32], fF: [18, -14], kB: [-2, -28], fB: [6, -10] })],
    down: [pose({ lie: 1, hip: [-4, -8], neck: [-30, -10], head: [-41, -12], eF: [-22, -18], hF: [-15, -25], eB: [-38, -4], hB: [-48, -5], kF: [12, -17], fF: [30, -5], kB: [9, -11], fB: [27, -4] })],
    win: [pose({ eF: [13, -92], hF: [15, -108], eB: [-6, -58], hB: [6, -54] }), pose({ hip: [0, -48], neck: [5, -76], head: [8, -87], eF: [13, -93], hF: [16, -111], eB: [-6, -59], hB: [6, -55] })],
    dizzy: [pose({ hip: [-1, -46], neck: [-3, -73], head: [-2, -84], eF: [8, -56], hF: [13, -48], eB: [-6, -56], hB: [-2, -48], kF: [10, -24], fF: [14, 0], kB: [-8, -23], fB: [-16, 0] }),
      pose({ hip: [1, -46], neck: [6, -73], head: [8, -84], eF: [13, -56], hF: [18, -48], eB: [-2, -56], hB: [2, -48], kF: [11, -24], fF: [15, 0], kB: [-7, -23], fB: [-15, 0] })],
    intro: [pose({ hip: [0, -47], neck: [3, -75], head: [6, -86], eF: [15, -58], hF: [24, -64], eB: [9, -58], hB: [20, -62], kF: [8, -25], fF: [12, 0], kB: [-8, -24], fB: [-12, 0] })]
  };
  // the walk: six steps, the stance kept, the feet swapping
  POSES.walk = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2, s = Math.sin(a), c = Math.cos(a), lf = Math.max(0, c) * 6, lb = Math.max(0, -c) * 6, hy = -47 + Math.abs(s) * 1.5;
    const fF = [4 + 15 * s, -lf], fB = [-4 - 15 * s, -lb];
    POSES.walk.push(upper(pose({ hip: [0, hy], fF, fB, kF: [(fF[0]) / 2 + 7, -24 - lf * 0.4], kB: [(fB[0]) / 2 + 5, -23 - lb * 0.4] }), 0, hy + 47));
  }
  // the specials, two or three frames each
  const SPECIAL_POSES = {
    daniel: [pose({ hip: [-2, -47], neck: [-2, -75], head: [1, -86], eF: [0, -58], hF: [-6, -54], eB: [-4, -58], hB: [-10, -52] }), pose({ hip: [4, -46], neck: [11, -74], head: [14, -84], eF: [26, -68], hF: [40, -68], eB: [22, -62], hB: [37, -60], kF: [16, -25], fF: [24, 0], tw: 0.8 })],
    cristian: [Object.assign({}, CROUCH, { neck: [2, -57], head: [5, -68] }), pose({ hip: [6, -42], neck: [19, -63], head: [24, -72], eF: [30, -62], hF: [46, -63], eB: [14, -56], hB: [22, -50], kF: [18, -22], fF: [26, 0], kB: [-12, -18], fB: [-28, -3], tw: 0.9 })],
    coz: [pose({ eF: [14, -68], hF: [16, -80], eB: [9, -64], hB: [17, -77] }), pose({ hip: [2, -47], neck: [8, -75], head: [10, -86], eF: [18, -70], hF: [22, -80], eB: [12, -66], hB: [21, -77] })],
    ion: [pose({ hip: [-2, -47], neck: [-2, -75], head: [1, -86], eF: [-6, -72], hF: [-14, -84] }), pose({ hip: [4, -47], neck: [11, -75], head: [14, -85], eF: [26, -72], hF: [38, -76], kF: [16, -25], fF: [24, 0], tw: 0.8 })],
    maria: [KCH, pose({ hip: [0, -52], neck: [0, -79], head: [3, -90], eF: [18, -72], hF: [30, -76], eB: [-14, -70], hB: [-26, -74], kF: [22, -54], fF: [46, -56], kB: [-4, -26], fB: [-4, 0] }),
      pose({ hip: [0, -52], neck: [0, -79], head: [3, -90], eF: [16, -70], hF: [28, -72], eB: [-14, -72], hB: [-26, -76], kF: [16, -42], fF: [24, -30], kB: [-4, -26], fB: [-4, 0] })],
    cristache: [CROUCH, pose({ hip: [2, -52], neck: [6, -80], head: [8, -91], eF: [12, -98], hF: [14, -114], eB: [-4, -64], hB: [2, -56], kF: [12, -40], fF: [6, -26], kB: [-6, -32], fB: [-12, -18] })],
    steve: [pose({ hip: [-2, -47], neck: [0, -75], head: [3, -86], eF: [22, -66], hF: [32, -76], eB: [-8, -66], hB: [-16, -78], tw: 0.9 }), pose({ hip: [4, -46], neck: [12, -74], head: [15, -84], eF: [28, -66], hF: [34, -58], eB: [24, -62], hB: [30, -54], kF: [16, -25], fF: [24, 0], tw: 1 })],
    rares: [pose({ hip: [-2, -47], neck: [-2, -75], head: [1, -86], eF: [-6, -70], hF: [-14, -80] }), pose({ hip: [4, -47], neck: [11, -75], head: [14, -85], eF: [26, -70], hF: [38, -70], kF: [16, -25], fF: [24, 0], tw: 0.8 })],
    dony: [pose({ hip: [-2, -46], neck: [-3, -74], head: [0, -85], eF: [2, -58], hF: [-6, -50] }), pose({ hip: [4, -46], neck: [11, -74], head: [14, -84], eF: [26, -64], hF: [38, -60], kF: [16, -25], fF: [24, 0], tw: 0.8 })],
    iulica: [pose({ hip: [-2, -47], neck: [-3, -75], head: [0, -86], eF: [-6, -60], hF: [-14, -54] }), pose({ hip: [4, -47], neck: [11, -75], head: [14, -85], eF: [24, -76], hF: [36, -84], kF: [16, -25], fF: [24, 0], tw: 0.9 })]
  };
  // beta 3.12: the archetype stances (a nod, not a copy): Cristache low and still like a karateka, the back fist at the
  // hip; Rares bouncing on his toes, fists high; I O N upright and square, the guard tight
  const breathe = (b0, amp) => [0, 1, 2, 1].map((d) => { const q = upper(Object.assign({}, b0, { hip: [b0.hip[0] + (d - 1) * 0.5, b0.hip[1] + d * amp * 0.4] }), d * 0.2, -d * amp * 1.2); q.br = d; return q; });
  const STYLE_POSES = {
    // beta 3.32: Cristache wins with the back fist up and the cigarette in his mouth (the face stays clear of the arm)
    cristache: { win: [0, 1].map((d) => pose({ hip: [0, -47 - d], neck: [4, -75 - d], head: [7, -86 - d], eB: [-6, -90 - d], hB: [-3, -106 - d * 2], eF: [13, -58 - d], hF: [22, -54 - d] })), idle: breathe(pose({ hip: [0, -43], neck: [6, -71], head: [9, -82], eF: [20, -56], hF: [31, -60], eB: [-1, -50], hB: [5, -44], kF: [16, -21], fF: [27, 0], kB: [-15, -19], fB: [-27, 0] }), 0.6) },
    rares: { idle: [0, 1.5, 3, 1.5].map((d) => { const b0 = pose({ eF: [15, -66], hF: [21, -79], eB: [6, -64], hB: [14, -75], kF: [11, -25], fF: [17, 0], kB: [-9, -24], fB: [-17, 0] }); const q = upper(Object.assign({}, b0, { hip: [0, -47 + d] }), 0, d); q.kF = [12, -24 + d * 0.5]; q.kB = [-8, -23 + d * 0.5]; return q; }) },
    ion: { idle: breathe(pose({ hip: [0, -48], neck: [3, -77], head: [5, -88], eF: [15, -64], hF: [18, -80], eB: [8, -64], hB: [13, -78], kF: [11, -25], fF: [17, 0], kB: [-9, -24], fB: [-16, 0] }), 0.8) }
  };
  // beta 3.32: Cristache bringing the cigarette to his lips (the front hand up at the mouth, the back fist at the hip)
  const SMOKE_POSES = { cristache: [pose({ hip: [0, -43], neck: [6, -71], head: [9, -82], eF: [14, -58], hF: [17, -73], eB: [-1, -50], hB: [5, -44], kF: [16, -21], fF: [27, 0], kB: [-15, -19], fB: [-27, 0] })] };
  // beta 3.16: the bystanders, in the same puppet as the fighters (bare hands, a little smaller)
  const WRAP = "#f2f0ea";
  // beta 3.30 (Daniel): the people watching stand further back, smaller (65%), always the same ones: roster faces in
  // other clothes (Dony behind the counter, Maria on the step with a coffee, Steve and Iulica by the caravan); when
  // one of them is in the fight, a stranger takes the spot. They cheer at the hits and the K.O.
  const SPEC = 0.65;
  const NPC_LOOKS = {
    specDony: { headId: "dony", skin: "#efbe9e", top: "#2a2a30", topKind: "tee", sleeve: "short", apron: "#b08a5a", pants: "#2e2e36", shoe: "#2a2a2a", sole: "#d8d8d8", hands: "bare", build: { sc: SPEC * 0.92 } },
    specMaria: { headId: "maria", skin: "#ebb597", top: "#c9a040", topKind: "tee", sleeve: "long", pants: "#4a6a92", shoe: "#f2f2f2", sole: "#c0c0c8", hands: "bare", build: { sc: SPEC * 0.92, sh: 0.86, arm: 0.84, waist: 0.86 } },
    specSteve: { headId: "steve", skin: "#ecb497", top: "#b8463c", topKind: "plaid", plaid: "#3a1e1c", sleeve: "long", pants: "#4a6890", shoe: "#3a2a22", sole: "#1a120e", hands: "bare", build: { sc: SPEC * 1.14, sh: 1.1, waist: 1.25 } },
    specIulica: { headId: "iulica", skin: "#c27f57", top: "#e07a2a", topKind: "tee", sleeve: "long", strap: "#d9cba8", pants: "#2c2c32", shoe: "#3a3a3a", sole: "#e0e0e0", hands: "bare", build: { sc: SPEC } },
    npcSit: { skin: "#e2a882", top: "#232f52", topKind: "vest", sleeve: "long", sleeveCol: "#a8c8e4", pants: "#4a6a92", shoe: "#7ad08a", sole: "#e8e8e8", hands: "bare", build: { sc: SPEC } },
    npcPlaid: { skin: "#e6ae8a", top: "#b8a690", topKind: "plaid", plaid: "#6a5a4a", sleeve: "long", pants: "#2a2a30", shoe: "#2a2a2a", sole: "#e0e0e0", hands: "bare", build: { sc: SPEC } },
    npcBun: { skin: "#e9b08e", top: "#2c3a6a", topKind: "plaid", plaid: "#8aa0c8", sleeve: "long", pants: "#5a7aa0", shoe: "#f2f2f2", sole: "#b0b0b8", hands: "bare", build: { sc: SPEC } },
    npcBarista: { skin: "#f0c0a0", top: "#3a3a40", topKind: "tee", sleeve: "short", apron: "#b08a5a", pants: "#2a2a30", shoe: "#2a2a2a", sole: "#dddddd", hands: "bare", build: { sc: SPEC } }
  };
  const NPC_HEADS = {
    npcSit: { skin: "#e2a882", hair: "#2a1e18", hl: "#4a3a30", beard: "#3a2a20", hairline: [7, 10], thick: 0.5, back: 17, tex: "short", beardKind: "stubble", beardTop: 16.5, mouth: "flat" },
    npcPlaid: { skin: "#e6ae8a", hair: "#5a3e2a", hl: "#7a5a40", beard: "#5a3e2a", hairline: [6.5, 9.5], thick: 0.6, back: 17, tex: "short", beardKind: "short", beardTop: 16.5, mouth: "flat" },
    npcBun: { skin: "#e9b08e", hair: "#3a281c", hl: "#5a4232", beard: "#3a281c", hairline: [7, 10], thick: 0.4, back: 19, tex: "slick", bun: [7, 3.5, 2.4, 2.2], beardKind: "stubble", beardTop: 16.5, mouth: "flat" },
    npcBarista: { skin: "#f0c0a0", hair: "#2a1a12", hl: "#4a3020", fem: true, rx: 0.93, jaw: 0.88, hairline: [6.5, 11], thick: 1.2, back: 20, tex: "wavy", blobs: [[6, 7, 3.5, 3.5]], beardKind: null, mouth: "small", lips: "#c46a64" }
  };
  const SIT = { hip: [-2, -12], neck: [3, -40], head: [6, -51], kF: [12, -17], fF: [16, 0], kB: [9, -15], fB: [13, 0], eF: [12, -24], hF: [18, -20], eB: [6, -24], hB: [12, -16] };
  const STAND = { hip: [0, -47], neck: [1, -75], head: [4, -86], kF: [3, -24], fF: [5, 0], kB: [-3, -24], fB: [-5, 0], eF: [5, -58], hF: [7, -44], eB: [-4, -58], hB: [-5, -44] };
  const BAR = { eF: [10, -56], hF: [18, -50], eB: [4, -56], hB: [12, -50] }, UP = { eF: [8, -90], hF: [10, -104], eB: [-2, -90], hB: [0, -104] };
  const NPCS = [
    { id: "specDony", alt: "npcBarista", x: 178, y: 178, face: -1, rate: 0.9, clip: [106, 105, 98, 47], poses: [pose(Object.assign({}, STAND, BAR)), pose(Object.assign({}, STAND, BAR, { head: [6, -86] }))], cheer: pose(Object.assign({}, STAND, UP)) },
    { id: "specMaria", alt: "npcSit", x: 96, y: 176, face: 1, /* beta 3.33: at the door's end of the step, the La Marzocco clear in the window */ rate: 0.7, prop: "cup", poses: [pose(SIT), pose(Object.assign({}, SIT, { eF: [13, -30], hF: [11, -40] })), pose(SIT), pose(SIT)], cheer: pose(Object.assign({}, SIT, { eF: [10, -52], hF: [12, -64] })) },
    { id: "specSteve", alt: "npcPlaid", x: 466, y: 174, face: 1, rate: 1.4, poses: [pose(STAND), pose(Object.assign({}, STAND, { eF: [12, -58], hF: [18, -62] })), pose(STAND), pose(Object.assign({}, STAND, { head: [5, -86] }))], cheer: pose(Object.assign({}, STAND, UP)) },
    { id: "specIulica", alt: "npcBun", x: 490, y: 174, face: -1, rate: 1.1, poses: [pose(STAND), pose(STAND), pose(Object.assign({}, STAND, { eF: [11, -60], hF: [16, -66] })), pose(STAND)], cheer: pose(Object.assign({}, STAND, UP)) }
  ];
  const BUST_POSE = pose({ hip: [0, -47], neck: [3, -75], head: [6, -86], eF: [12, -56], hF: [14, -40], eB: [-5, -56], hB: [-7, -40], tw: 0.55 }); // for the portraits: the arms down
  const SPECIAL_PROP = { coz: "camera", iulica: "tote", rares: "key" };
  // the cell every frame is baked into: 140x142, the feet at (70, 138)
  // beta 3.33: in canvas pixels (twice the game's units); a frame is then cropped to the figure
  const CW = 168, CH = 172, OX = 84, OY = 166; // beta 3.36: back at the game's own pixels
  // beta 3.30: the bodies a size up, the heads as they are. beta 3.33 (Daniel, finer pixels and arcade proportions):
  // the body BODY canvas pixels to a pose unit (about 200 px from the feet to the top of the head in the guard, 100 of
  // the game's units, where 3.32 stood 115), the head HK pixels to a head unit (about 36 px from the hair to the chin):
  // about five and a half heads tall, as the arcade fighters are; the people around NPCB (and the small 1x head)
  // beta 3.36 (Daniel: "back to the initial pixels, so it resembles the reference figures"): at 1x, as the arcade
  // fighters are: about 95 px in the guard, the head about 17 px (HK 0.66, the small arcade head), five and a half heads
  const BODY = 1.0, HK = 0.66, NPCB = 0.9, FIST = 6.2, FOOT = 1.15, FSC = BODY / RS;
  // beta 3.12 (Daniel: "you can't tell it's them"): bigger heads (28x36), built from one shaded three-quarter face and,
  // per person, what makes them them: the hair (its line, volume, texture), the beard, glasses, a cap, the smile.
  // Read from their photos. The neck's foot (13, 31) sits on the body's neck.
  const HW = 28, HH = 36, HEAD_ANCHOR = [13, 28];
  const HEADSPEC = {
    daniel: { skin: "#e7a57d", hair: "#3a2516", hl: "#6e4c30", beard: "#33200f", bhl: "#6e5444", grey: 0.12,
      hairline: [7, 10], thick: 0.4, back: 19, tex: "slick", bun: [6.5, 3, 2.6, 2.3],
      beardKind: "full", beardTop: 15, beardDrop: 2.5, mouth: "grin", eyes: "smile" },
    cristian: { skin: "#e9ab84", hair: "#2c1f17", hl: "#57412f", beard: "#55361f", bhl: "#8a6244",
      hairline: [6.5, 9], thick: 1.2, back: 17, tex: "shag", crown: [9, 5], lockN: 2, curl: 0.1, blobs: [[15, 3.2, 5.5, 2.6], [11, 2.8, 4, 2.4]],
      beardKind: "full", beardTop: 16, beardDrop: 1.5, mouth: "grin", glasses: { kind: "round", color: "#1c1416", thick: 1 } },
    // beta 3.31 (Daniel, likeness round: "they should look much more like the photos"): I O N as he is now (the
    // recent photo): no cap, short dark hair with some height at the front and short sides, a broad full face, a short
    // dark beard along the jaw with the moustache, heavy straight brows, a strong nose
    ion: { skin: "#dca07a", hair: "#191416", hl: "#2c2426", beard: "#1e1617", bhl: "#4a3a36", rx: 1.06, jaw: 1.12, nose: 0.6,
      hairline: [6, 9.5], thick: 0.9, back: 17, tex: "shag", crown: [9, 6], lockN: 2, curl: 0.08, blobs: [[16.5, 2.6, 6, 2.6], [20, 4.4, 2.6, 1.8]],
      beardKind: "boxed", beardK: 0.32, beardTop: 17, beardDrop: 0.8, mouth: "flat", brows: "heavy" },
    // beta 3.31 (Daniel, likeness): the long dark curls fuller, a lock down in front of the ear framing the face, the
    // brows darker
    maria: { skin: "#ebb597", hair: "#24160f", hl: "#4e3424", fem: true, rx: 0.93, jaw: 0.88,
      hairline: [6.5, 11], thick: 1.8, back: 35, tex: "shag", crown: [12, 3], lockN: 2.8, curl: 0.4, blobs: [[8, 18, 6.5, 13], [5.5, 26, 5, 8.5], [12, 4, 8, 4], [17.5, 5.5, 4.5, 3], [10.6, 17, 2.2, 7.5], [3, 14, 3, 9]],
      beardKind: null, mouth: "small", lips: "#c46a64", browCol: "#2a1a12" },
    // beta 3.15 (Daniel, from his second photo): buzzed dark hair, heavy brows, heavy-lidded eyes, stubble round the
    // jaw, full lips; glasses added; a lit cigarette in the corner of the mouth
    // beta 3.31 (Daniel, likeness): a leaner, longer young face, the buzz cut faded at the sides, a goatee (the chin and
    // the lip dark, the cheeks shadowed), the nose bigger, and thin clear glasses (the eyes show; no more sunglasses)
    cristache: { skin: "#e6aa86", hair: "#1d1511", hl: "#3a2c24", beard: "#2a1c16", bhl: "#5c4234", rx: 0.97, jaw: 0.95, nose: 0.6,
      hairline: [7.2, 10.2], thick: 0.3, back: 16, tex: "buzz",
      beardKind: "goatee", beardTop: 16.5, beardDrop: 1.1, mouth: "lips", lips: "#c27a68", brows: "flat", eyes: "lidded",
      glasses: { kind: "square", color: "#3a2a2c", lens: [[12, 12, 16, 15], [18, 12, 21, 15]], glint: [[15, 13], [20, 13]], bridge: [[17, 13]], armY: 13 } },
    // beta 3.31 (Daniel, likeness): the hair thick and swept up and back, grey through dark brown (not white); a round,
    // full face; big black rectangular frames; a short salt-and-pepper beard, the half smile
    steve: { skin: "#ecb497", hair: "#57504c", hl: "#837b76", beard: "#7e726c", bhl: "#b4aaa2", rx: 1.1, jaw: 1.18, grey: 0.14,
      hairline: [6, 9.5], thick: 1.6, back: 17, tex: "wavy", blobs: [[14, 2, 9, 3.4], [19.5, 3.4, 4, 2.6], [7.5, 5, 4, 4]],
      beardKind: "boxed", beardTop: 16.5, beardDrop: 0.6, mouth: "smirk", glasses: { kind: "square", color: "#121014", lens: [[11, 11, 16, 15], [18, 11, 22, 15]], glint: [[15, 12], [21, 12]], bridge: [[17, 12]] } },
    // beta 3.31 (Daniel, likeness): the shaggy mullet (a fringe down over the forehead, wavy at the sides, down to the
    // nape), the big dark moustache over the lip, stubble round the chin
    // beta 3.32 (Daniel: "Rares's hair is weird"): redone from his two photos: the dark shaggy mullet, curly, with
    // volume on top and a broken outline; curls falling on the forehead to the brows in separate locks, the sides over
    // the ears, the back down to the jaw line, flicking out. Near-black brown, its light in warm grey-brown streaks
    rares: { skin: "#ecb593", hair: "#1e1611", hl: "#6a5a52", beard: "#22160f", bhl: "#4d3524",
      hairline: [8.2, 10.6], thick: 1.3, back: 22, tex: "shag", crown: [10.5, 3], lockN: 2.6, earHid: true,
      blobs: [[6.5, 3.6, 3.2, 2.6], [10.5, 1.8, 3.6, 2.2], [15, 1.9, 3.4, 2.1], [19, 3.6, 2.6, 2], [4.2, 8.5, 2.8, 3.2], [3.6, 14.5, 2.6, 3.6], [4.6, 20, 3, 3.2], [7.6, 22.6, 2.8, 2.2], [21, 6.2, 1.4, 1.6]],
      locks: [[16, 5, 15.2, 10.4, 1.4, 0.5], [19.2, 5.4, 19.8, 10, 1.3, 0.5], [21.3, 6, 22.2, 9.2, 1, 0.4], [13, 5, 12.2, 9.6, 1.3, 0.5], [9.8, 9, 10.4, 18.6, 1.5, 0.7], [3.4, 21, 1.6, 24.6, 1.5, 0.6], [7.4, 22, 7, 25.4, 1.3, 0.5], [11, 21, 11.8, 23.6, 1.1, 0.5]],
      beardKind: "stubble", stubble: 0.5, beardTop: 16.5, mustache: "big", mouth: "under", lips: "#d4917c" },
    // beta 3.31 (Daniel, likeness): thick black hair falling forward to the brows and over the ears, the wide grin
    // with all the teeth, the eyes shut with it, stubble, the darker skin
    iulica: { skin: "#c27f57", hair: "#16100d", hl: "#2e241e", beard: "#24180f", bhl: "#4c3a2e", rx: 0.96,
      hairline: [9.6, 11], thick: 1.1, back: 19, tex: "shag", crown: [10, 4], lockN: 2.4, curl: 0.2, blobs: [[18, 8.6, 3.8, 1.5], [14.5, 8.9, 2.6, 1.3], [21, 8, 1.4, 2], [7.6, 11, 2.6, 4]],
      beardKind: "stubble", stubble: 0.5, beardTop: 16, mouth: "biggrin", eyes: "smile" },
    // beta 3.31 (Daniel, likeness): clean-shaven, thin round wire glasses, a little open smile, the olive trucker cap
    // worn backwards, its strap on the forehead
    dony: { skin: "#efbe9e", hair: "#271c16", hl: "#463428", beard: "#7a5a48", rx: 0.96, jaw: 0.94,
      hairline: [7.5, 10], thick: 0.4, back: 16, tex: "short",
      beardKind: "stubble", stubble: 0.12, beardTop: 17.5, mouth: "open", browCol: "#3a2a22",
      glasses: { kind: "round", color: "#4a3e44", lens: [[14, 13.4, 2.7, 2.4], [19.7, 13.4, 1.9, 2.4]], glint: [[15, 12], [20, 12]], bridge: [[17, 13]] },
      cap: { color: "#6a7040", band: "#8a9058", back: true, mesh: "#4e5432" } }
  };
  HEADSPEC["cristache+cig"] = Object.assign({}, HEADSPEC.cristache, { cig: true }); // beta 3.32: the same face, the cigarette in the mouth
  const HEAD_CACHE = {}; let NOPLANES = false;
  // beta 3.33 (Daniel, finer pixels): a head can be drawn at any size, K small pixels to a head unit (the 28x36 grid
  // the faces are designed on). K = 1 is the old small head (the select tiles' busts, the people watching); in the
  // fight the heads are drawn at HK (about 36 px from the hair to the chin); the portraits and the VS at 4 and 6.
  // From K = 1.3 up the face is not the 1x map made bigger: the shapes (skull, jaw, hair, beard) are worked out per
  // small pixel, and the features (eyes, brows, nose, mouth, glasses, the moustache, the cigarette) are drawn again
  // at that size, snapped to the pixel grid, with what the size can carry: an iris and a light in it, the lid's line,
  // lips in two tones, the teeth, a glint on the lenses
  function headOf(id, k = 1, noG = false, K = 1) {
    if (k < 1) { const key = id + "@" + k; if (HEAD_CACHE[key]) return HEAD_CACHE[key]; const G0 = (HEADSPEC[id] || NPC_HEADS[id]).glasses; return (HEAD_CACHE[key] = smallGlasses(shrinkHead(headOf(id, 1, !!G0), k), G0, k)); }
    const key = id + (noG ? "!" : "") + "#" + K;
    return HEAD_CACHE[key] || (HEAD_CACHE[key] = headAt(id, noG, K));
  }
  function headAt(id, noG, K) {
    const P0 = HEADSPEC[id] || NPC_HEADS[id], P = noG ? Object.assign({}, P0, { glasses: null }) : P0, rx = 8.7 * (P.rx || 1), ry = 10.2, cx0 = 13, cy0 = 12.5, jw = P.jaw || 1;
    const FINE = K >= 1.3, SMALL = K < 0.95, GR = Math.max(1, Math.round(K / 3)); // SMALL (beta 3.36): the arcade head, about 17 px // GR: the grain of the textures (hair, stubble), in small pixels
    const W2 = Math.ceil(HW * K), H2 = Math.ceil(HH * K), buf = new Array(W2 * H2).fill(null), feat = new Uint8Array(W2 * H2);
    const putH = (x, y, c) => { if (x >= 0 && y >= 0 && x < W2 && y < H2) buf[y * W2 + x] = c; };
    const PX = (u) => Math.round(u * K); // a head unit's edge, in small pixels
    const put = (x, y, c) => { const X0 = PX(x), Y0 = PX(y), X1 = Math.max(X0 + 1, PX(x + 1)), Y1 = Math.max(Y0 + 1, PX(y + 1)); for (let Y = Y0; Y < Y1; Y++) for (let X = X0; X < X1; X++) putH(X, Y, c); };
    const at = (x, y) => (x >= 0 && y >= 0 && x < HW && y < HH ? buf[Math.floor((y + 0.5) * K) * W2 + Math.floor((x + 0.5) * K)] : null);
    const each = (fn) => { for (let Y = 0; Y < H2; Y++) for (let X = 0; X < W2; X++) fn(X, Y, (X + 0.5) / K, (Y + 0.5) / K); }; // every small pixel, with its place in head units
    const R = (b) => ramp(b); const SK = R(P.skin), HA = R(P.hair), BE = R(P.beard || P.hair);
    const inPoly = (pts, x, y) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
    const chaikin = (pts, n) => { for (let k = 0; k < n; k++) { const o = [pts[0]]; for (let i = 0; i < pts.length - 1; i++) { const [a, b] = [pts[i], pts[i + 1]]; o.push([a[0] * 0.75 + b[0] * 0.25, a[1] * 0.75 + b[1] * 0.25], [a[0] * 0.25 + b[0] * 0.75, a[1] * 0.25 + b[1] * 0.75]); } o.push(pts[pts.length - 1]); pts = o; } return pts; };
    const jaw0 = [[5.2, 13], [7.6, 21.5], [10.8, 25.2], [14.4, 26.2], [18, 24.4], [20.6, 20.8], [21.7, 15.5], [21.2, 11]].map(([x, y]) => [cx0 + (x - cx0) * jw, y]);
    const jawPts = FINE ? chaikin(jaw0, 2) : jaw0; // fine: the jaw a smooth line, not facets
    const skull = (x, y) => ((x - cx0) / rx) ** 2 + ((y - cy0) / ry) ** 2 <= 1;
    const nz = P.nose || 0; // beta 3.31: a bigger nose where it is theirs (Cristache, I O N)
    const nx2 = (P.rx || 1) - 1 + nz, NOSE = P.fem ? [[20.8, 13.2], [21.3, 13.4], [22, 15.7], [22.1, 16.4], [21.7, 16.9], [20.9, 17.1]] : [[20.8, 11.6 - nz * 0.5], [21.5, 12 - nz * 0.5], [22.9 + nx2, 15.2], [23.3 + nx2, 16.2], [22.9 + nx2, 17], [21.8, 17.4 + nz * 0.4], [20.4, 17.6 + nz * 0.4]];
    const face = (x, y) => skull(x, y) || inPoly(jawPts, x, y) || (FINE ? inPoly(NOSE, x, y) : x >= 21 && x <= (P.fem ? 21.8 : 22.6 + nx2) && y >= (P.fem ? 14.5 : 13.5 - nz * 0.5) && y <= 17.2 + nz * 0.4); // fine: the nose a shape, the bridge sloping to the tip
    const mix2 = (c1, c2, k2) => { const a2 = [c1 & 255, (c1 >> 8) & 255, (c1 >> 16) & 255], b2 = [c2 & 255, (c2 >> 8) & 255, (c2 >> 16) & 255]; const m2 = a2.map((v, i) => Math.round(v + (b2[i] - v) * k2)); return (0xff000000 | (m2[2] << 16) | (m2[1] << 8) | m2[0]) >>> 0; };
    const L = [0.52, -0.5, 0.69], FACE_LIFT = -0.14;
    const shadeAt = (x, y, bias = 0) => { const nx = clamp((x - cx0 - 1.5) / (rx + 1), -1, 1), ny = clamp((y - cy0 + 1) / (ry + 3), -1, 1), nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)); const d = nx * L[0] + ny * L[1] + nz * L[2] - bias; return d > 0.8 ? 0 : d > 0.52 ? 1 : d > 0.2 ? 2 : d > -0.1 ? 3 : 4; };
    const grain = (X, Y, a, b) => hash2(Math.floor(X / GR) * a + 1, Math.floor(Y / GR) * b + 2);
    // the neck (behind), the face, the ear
    each((X, Y, fx, fy) => { if (fy >= 22 && fy < 29 && fx >= 9 && fx < 17) putH(X, Y, SK[fx < 11 ? 4 : 3]); });
    each((X, Y, fx, fy) => { if (face(fx, fy)) putH(X, Y, SK[shadeAt(fx, fy, FACE_LIFT)]); }); // beta 3.31: the face a little more in the light, so the features read
    each((X, Y, fx, fy) => { if (((fx - 7.8) / 1.7) ** 2 + ((fy - 14.6) / 2.7) ** 2 <= 1 && fx > 6 && fx < 10) putH(X, Y, SK[(FINE ? Math.abs(fx - 8) < 0.45 && fy > 13.2 && fy < 16.6 || (fx > 7.2 && fx < 8.6 && Math.abs(fy - 13.1) < 0.35) : Math.floor(fx) === 8 && fy > 13 && fy < 17) ? 3 : 2]); }); // the ear (fine: its inner curl)
    if (K >= 3 && !NOPLANES) { // beta 3.34 (Daniel: the big faces less flat): hand-placed planes on the skin: the hollow under the cheekbone, the side of the nose, the fold from the nose to the mouth in shade; the forehead, the cheekbone and the chin catching the light
      const SKS = new Map(SK.slice(0, 5).map((c, i) => [c, i])), cheek = [[10.4, 16.6], [14.6, 17], [15.6, 18.8], [14.6, 21.8], [11.4, 21.4], [10, 19]], nose = [[19.7, 13.4], [20.8, 13.8], [20.7, 16.4], [19.5, 16.1]], brow = [[13.8, 6.6], [19.6, 7.2], [20.6, 9.2], [14.4, 9.5]];
      each((X, Y, x, y) => { const i0 = SKS.get(buf[Y * W2 + X]); if (i0 === undefined) return; // one pass, the skin only
        let dt = 0;
        if (y > 16.5 && y < 22 && x < 15.7 && inPoly(cheek, x, y)) dt = 1; else if (x > 19.4 && x < 20.9 && y > 13.3 && y < 16.5 && inPoly(nose, x, y)) dt = 1; else if (y > 17.4 && y < 20.4 && Math.abs(x - (20.4 - (y - 17.4) * 0.55)) < 0.32) dt = 1;
        else if (y < 9.6 && y > 6.5 && inPoly(brow, x, y)) dt = -1; else if (((x - 15.6) / 2.3) ** 2 + ((y - 15.2) / 0.95) ** 2 <= 1 || ((x - 18.4) / 1.7) ** 2 + ((y - 24.2) / 0.8) ** 2 <= 1) dt = -1;
        if (dt) putH(X, Y, SK[clamp(i0 + dt, 0, 4)]); });
    }
    // the eye sockets and the cheek, a little darker; under the nose
    for (const [x, y] of [[13, 12], [14, 12], [18, 12], [19, 12], [21, 17], [20, 17]]) if (at(x, y)) put(x, y, SK[Math.min(4, shadeAt(x + 0.5, y + 0.5) + 1)]);
    // the beard: below a cheek line that runs from the sideburn (at the ear) down to the mouth's corner; a moustache
    // over the lip; full beards fall a little below the jaw. Stubble is the skin darkened towards the beard colour
    if (P.beardKind) {
      const kind = P.beardKind, drop = P.beardDrop || 0, lift = (P.beardTop ? 16.5 - P.beardTop : 0);
      const jawOut = jawPts.map(([a2, b2]) => [a2 + (a2 - cx0) * 0.05, b2 + drop * clamp((b2 - 14) / 12, 0, 1)]);
      each((X, Y, fx, fy) => {
        const put = (x2, y2, c) => putH(X, Y, c);
        if (!(face(fx, fy) || ((kind === "full" || kind === "boxed" || (kind === "goatee" && fx > 15.4 && fx < 20.2)) && inPoly(jawOut, fx, fy)))) return;
        const cheek = (fx < 8.5 ? 10.5 : fx < 14 ? lerp(11.5, 17.2, (fx - 8.5) / 5.5) : 17.6) - lift;
        if (fy < cheek) return;
        const mouthHole = kind === "boxed" ? fx > 15.6 && fx < 19.4 && fy > 19.4 && fy < 21.6 : fx > 14.6 && fx < 20.4 && fy > 19.4 && fy < 21.6; // beta 3.31: in a boxed beard only the lips show
        if (mouthHole) return;
        if (fx > 20.6 && fy < 19) return; // the nose and the tip of the lip stay skin
        const base = buf[Y * W2 + X], x = 0, y = 0;
        if (kind === "stubble") { if (base) put(x, y, mix2(base, BE[2], (P.stubble || 0.42) * (FINE && grain(X, Y, 7, 3) > 0.7 ? 1.25 : 1))); return; } // fine: the stubble in grains
        // beta 3.31 (Daniel, likeness): a goatee (the chin and the moustache dark, the cheeks only shadowed: Cristache)
        // and a short boxed beard (dense along the jaw, the chin and over the lip, the skin still under it: I O N, Steve)
        if (kind === "goatee") {
          // beta 3.32 (Daniel: "the beard more on the chin"): the goatee on the chin only, pointed a little below it, the
          // moustache lighter, the jaw and the cheeks clean (a faint shadow where the chin beard ends)
          const chin = FINE ? fy > 20.9 && ((fx - 17.7) / 2.7) ** 2 + ((fy - 23.4) / 3.1) ** 2 <= 1 : fx > 15.2 && fy > 21.3, edge2 = FINE ? !chin && fy > 21.2 && ((fx - 17.7) / 3.5) ** 2 + ((fy - 23.4) / 3.7) ** 2 <= 1 : fx > 13.6 && fx <= 15.2 && fy > 21.6;
          const must = FINE ? fy > 17.9 + ((fx - 17.8) / 2.8) ** 2 * 0.6 && fy < 19.35 && Math.abs(fx - 17.8) < 2.9 : fy > 17.8 && fy < 19.3 && fx > 14.8 && fx < 20.6; // fine: the chin beard an oval, the moustache a curved band
          const str = FINE && (Math.floor(X / GR) + Math.floor(Y / GR) * 2) % 5 === 0 ? 1 : 0; // fine: the hair of the goatee in strands
          if (!base) { put(x, y, BE[Math.min(5, (fx > 17.5 ? 3 : 4) + str)]); return; }
          if (chin) put(x, y, BE[Math.min(4, (fx > 17.2 && fy < 23.2 ? 2 : fy > 24 || fx < 16.2 ? 4 : 3) + str)]); else if (edge2) put(x, y, mix2(base, BE[3], 0.4)); else if (must) put(x, y, FINE ? mix2(base, BE[3], fy > 18.6 ? 0.85 : 0.6) : mix2(base, BE[2], 0.6)); return;
        }
        if (kind === "boxed") {
          const edge = !face(fx, fy + 1) || !face(fx - 1, fy), must = fy > 17.6 && fy < 19.4 && fx > 14.6 && fx < 20.4, chin = fy > 21.6 && fx > 11.5;
          const k0 = chin || edge ? 0.88 : must ? 0.74 : (P.beardK || 0.58) + clamp((fy - cheek) / 5, 0, 1) * 0.32, k3 = k0 > 0.8 ? 0.9 : k0 > 0.62 ? 0.7 : 0.45; // denser towards the jaw (beta 3.32: in three hard steps, no gradient)
          const fl = FINE && grain(X, Y, 3, 11) > 0.78 ? -1 : 0; // fine: single hairs catching the light
          if (base) put(x, y, mix2(base, BE[clamp(shadeAt(fx, fy) + fl, 1, 4)], Math.min(1, k3))); else put(x, y, BE[3]); return;
        }
        if (kind === "short") { if (base) put(x, y, mix2(base, BE[clamp(shadeAt(fx, fy), 1, 3)], 0.8)); else put(x, y, BE[3]); return; }
        let t = clamp(shadeAt(fx, fy, 0.05), 1, 4); if ((Math.floor(X / GR) * 3 + Math.floor(Y / GR)) % 5 === 0 && t < 4) t++; // strands
        if (fy > 22 && fx > 11 && fx < 18 && ((Math.floor(X / GR) + Math.floor(Y / GR)) % 4 === 0)) t = Math.max(1, t - 1);
        put(x, y, BE[t]);
      });
    }
    if (!FINE && !SMALL) {
      if (P.mustache === "big") { // beta 3.31: Rares's moustache, thick, a chevron over the lip, the ends dropping past the corners
        for (const [y, x0, x1] of [[17, 16, 20], [18, 14, 21], [19, 14, 21]]) for (let x = x0; x <= x1; x++) if (!(y === 19 && x > 15 && x < 20)) put(x, y, y === 17 ? BE[x === 18 ? 1 : 2] : BE[x === 14 || x === 21 || y === 19 ? 4 : 3]);
        put(14, 20, BE[4]); put(20, 20, BE[4]);
      } else if (P.mustache) for (let y = 18; y <= 19; y++) for (let x = 14; x <= 21; x++) if (!(y === 18 && (x === 14 || x === 21))) put(x, y, BE[y === 18 ? 2 : 3]);
    } else if (FINE && P.mustache === "big") { // fine: the chevron as a shape, lit on top, its lower edge dark, in strands
      const MU = [[14, 20.4], [14.4, 19], [15.6, 18], [17.2, 17.3], [18.6, 17.4], [20.2, 17.9], [21.3, 18.9], [21.5, 20.6], [20.6, 19.8], [19.4, 19.3], [17.6, 19.4], [15.6, 19.8], [14.8, 20.7]];
      each((X, Y, fx, fy) => { if (!inPoly(MU, fx, fy)) return; const below = !inPoly(MU, fx, fy + 1 / K), str = (Math.floor(X / GR) * 2 + Math.floor(Y / GR)) % 4 === 0; putH(X, Y, BE[below ? 4 : fy < 18.2 ? (fx > 17.4 && fx < 19 ? 1 : 2) : str ? 4 : 3]); });
    } else if (FINE && P.mustache) each((X, Y, fx, fy) => { if (fy >= 18 && fy < 19.6 && fx >= 14.2 && fx < 21.6) putH(X, Y, BE[fy < 18.6 ? 2 : 3]); });
    // the hair: what's above the hair line (lower at the temples), the back down to the nape, and the volume
    const [fy0, ty0] = P.hairline, th = P.thick || 0;
    const hairIn = (x, y) => {
      const sk = ((x - cx0) / (rx + th)) ** 2 + ((y - cy0) / (ry + th)) ** 2 <= 1;
      const hl = lerp(ty0, fy0, clamp((x - 8) / 12, 0, 1)) - (x > 19 ? (x - 19) * 0.6 : 0);
      if (sk && y < hl) return true;
      if (sk && x < 9.2 && y < P.back && (P.earHid || !(x > 5.5 && y > 11.5 && y < 17.5))) return true; // behind the ear (beta 3.32: over it, earHid)
      if (P.back > 20 && x < 10 && y < P.back && x > 3 - (y - 14) * 0.15 && y > 10 && !(x > 6 && y > 11.5 && y < 17.5 && x < 10)) return true; // long at the back
      for (const [bx, by, brx, bry] of P.blobs || []) if (((x - bx) / brx) ** 2 + ((y - by) / bry) ** 2 <= 1) return true;
      for (const [x0, y0, x1, y1, w0, w1] of P.locks || []) { const vx = x1 - x0, vy = y1 - y0, q = clamp(((x - x0) * vx + (y - y0) * vy) / (vx * vx + vy * vy), 0, 1), w = lerp(w0, w1, q); if ((x - x0 - vx * q) ** 2 + (y - y0 - vy * q) ** 2 <= w * w) return true; } // beta 3.32: a lock of hair, a tapered stroke
      return false;
    };
    const HL = R(P.hl || P.hair), HC = u32(P.hl || P.hair), HR = [HC, mix2(HA[2], HC, 0.5), HA[2], HA[3], HA[4]]; // beta 3.31: the hair's tones run from its own colour to its highlight (no grey lift on dark hair)
    each((X, Y, fx, fy) => {
      if (!hairIn(fx, fy)) return;
      if (P.fem && fx > 17 && fy > 9 && fy < 22) return; // her face stays open
      const x = fx - 0.5, y = fy - 0.5;
      let t = clamp(shadeAt(fx, fy, -0.15), 0, 4);
      const tex = P.tex, n = grain(X, Y, 3, 5);
      if (tex === "curly") { const c = (Math.sin(x * 1.7 + y * 0.9) + Math.sin(y * 1.9 - x * 0.6)) * 0.5; t = clamp(t + (c > 0.45 ? -1 : c < -0.45 ? 1 : 0), 1, 4); }
      else if (tex === "slick") { t = clamp(t + ((Math.floor(Y / GR) % Math.max(3, Math.round(3 * K / GR)) === 0 && x > 8) ? -1 : 0), 1, 4); }
      else if (tex === "wavy") { const c = Math.sin(x * 0.9 + y * 1.4); t = clamp(t + (c > 0.6 ? -1 : c < -0.7 ? 1 : 0), 0, 4); if (FINE && t > 0 && n > 0.82) t--; }
      else if (tex === "buzz") { t = clamp(t + 1, 2, 4); if (n > 0.6) t = Math.min(4, t + 1); }
      else if (tex === "shag") { // beta 3.32 (Rares): locks from the crown, each a lit streak, a mid tone and a dark parting, curling as they go
        // fine: the strands flow from a point further back and down (they sweep over the head rather than fan out of a spot)
        const [kx0, ky0] = P.crown || [11, 3], kx = FINE ? kx0 - 9 : kx0, ky = FINE ? ky0 + 12 : ky0, dx = fx - kx, dy = fy - ky, rr = Math.hypot(dx, dy) - (FINE ? 12 : 0);
        const u = Math.atan2(dy, dx) * (P.lockN || 2.3) * (FINE ? 5.5 : 1) + Math.sin(rr * 0.85) * (P.curl ?? 0.32) * (FINE ? 2 : 1), fr = u - Math.floor(u);
        const lit = t <= 1; t = Math.max(2, t) + (rr > 12 ? 1 : 0); // dark hair: the mass dark, the light only in the streaks
        if (FINE) { // fine: the locks in short lengths (each lit at its root, a dark gap where it ends), none at the crown itself
          const li = Math.floor(u), sv = Math.max(0, rr + 12) * (0.42 + (P.curl || 0) * 0.5) + hash2(li, 3) * 1.7, fv = sv - Math.floor(sv);
          if (fr < 0.22 && fv < 0.62 && t < 4) t -= lit || fv < 0.25 ? 2 : 1; else if (fr < 0.32 && lit && fv < 0.5) t = 1; else if (fr > 0.78 || fv > 0.9) t++;
        } else if (fr < 0.2 && t < 4) t -= lit ? 2 : 1; else if (fr < 0.3 && lit) t = 1; else if (fr > 0.74) t++;
        t = clamp(t, 0, 4);
      }
      else if (tex === "messy") { t = clamp(t + (n > 0.78 ? -1 : n < 0.15 ? 1 : 0), 1, 4); }
      else { t = clamp(t + (n > 0.85 ? -1 : 0), 1, 4); }
      if (P.fade && fx < P.fade[0] && fy > P.fade[1] && buf[Y * W2 + X] != null) { putH(X, Y, mix2(buf[Y * W2 + X], HA[clamp(t, 2, 4)], 0.55 + (n > 0.6 ? 0.2 : 0))); return; } // beta 3.31: short at the sides, the skin through it
      putH(X, Y, HR[t]);
    });
    if (FINE) each((X, Y, fx, fy) => { // fine: where the hair meets the forehead, a few single hairs and the line in shadow
      const c = buf[Y * W2 + X]; if (c == null || !face(fx, fy) || hairIn(fx, fy)) return;
      if (hairIn(fx, fy - 1 / K) && !(P.fem && fx > 17)) putH(X, Y, grain(X, Y, 5, 7) > 0.55 ? HR[3] : mix2(c, SK[4], 0.5));
    });
    if (P.bun) { const [bx, by, brx, bry] = P.bun; each((X, Y, fx, fy) => { const d = ((fx - bx) / brx) ** 2 + ((fy - by) / bry) ** 2; if (d <= 1 && fy < 6) putH(X, Y, d > 0.55 ? HA[3] : (Math.floor(X / GR) + Math.floor(Y / GR)) % 3 ? HA[2] : HL[1]); }); } // the knot on top
    if (P.grey) each((X, Y) => { const i = Y * W2 + X; if (buf[i] === HA[2] && grain(X, Y, 13, 7) < P.grey) buf[i] = HL[1]; });
    // a cap, worn backwards: the crown over the hair, the strap's opening at the forehead, the peak behind
    if (P.cap) {
      const CP = R(P.cap.color), crown = (x, y) => ((x - cx0) / (rx + 1.1)) ** 2 + ((y - cy0 + 0.5) / (ry + 1.1)) ** 2 <= 1 && y < 8.6 - Math.max(0, x - 18) * 0.5;
      each((X, Y, fx, fy) => { if (!crown(fx, fy)) return; const t = clamp(shadeAt(fx, fy, -0.1), 0, 4); putH(X, Y, P.cap.mesh && fx < 12 && (Math.floor(X / GR) + Math.floor(Y / GR)) % 2 ? u32(P.cap.mesh) : CP[clamp(t + (FINE && Math.abs(fx - 12.2) < 0.5 / K + 0.2 ? 1 : 0), 1, 4)]); }); // fine: the seam between the panels
      for (let x = 15; x <= 20; x++) put(x, 8, u32(P.cap.band)); // the strap across the forehead
      for (let x = 16; x <= 19; x++) put(x, 7, HA[2]); // hair through the opening
      for (let x = 1; x <= 5; x++) put(x, 8 + (x < 3 ? 1 : 0), CP[x < 3 ? 3 : 2]); // the peak, behind
      put(1, 9, CP[4]); put(2, 9, CP[3]);
    }
    const EW = u32("#f2ece6"), EP = u32("#1c1214"), MO = u32("#5a2220"), TE = u32("#fbf6ee");
    const browC = P.brows === "heavy" || P.brows === "thick" || P.brows === "flat" ? HA[4] : P.browCol ? u32(P.browCol) : HA[3], bY = P.browY || 10;
    let ember = null;
    if (SMALL) {
      // beta 3.36 (Daniel: "back to the initial pixels, as the reference figures"): the arcade head, about 17 px from
      // the hair to the chin, as the 90s fighters' faces are: heavy brows, the eyes a slit with one light pixel, the
      // nose a lit tip and a shadow under it, the mouth a short dark line (the teeth where they grin); what makes each
      // of them them drawn at this size on purpose: the glasses as two small boxes, the moustache, the cigarette
      const F = (u) => Math.floor(u * K), hz = (x0, x1, y, c) => { for (let x = x0; x <= x1; x++) putH(x, y, c); };
      const by = F(10.4), ey = F(13.6), ny = F(16.4), my = F(20.4), nE = [F(13.3), F(15.1)], fE = [F(18.6), F(19.9)], LID = SK[4];
      // the brows: heavy, the outer end of the near one dropping
      hz(F(12), F(15.7), by, browC); hz(F(17.4), F(20.6), by, browC); putH(F(12) - 0, by + 1, browC);
      if (P.brows === "heavy" || P.brows === "thick") { hz(F(12.6), F(15.7), by - 1, browC); hz(F(17.6), F(20), by - 1, browC); }
      hz(nE[0], nE[1], ey - 1, SK[3]); hz(fE[0], fE[1], ey - 1, SK[3]); // the lids in shade
      if (P.eyes === "smile") { hz(nE[0], nE[1], ey, EP); hz(fE[0], fE[1], ey, EP); }
      else if (P.eyes === "lidded") { hz(nE[0], nE[1], ey - 1, LID); hz(fE[0], fE[1], ey - 1, LID); putH(nE[1], ey, EP); putH(nE[0], ey, mix2(EW, SK[3], 0.4)); putH(fE[1], ey, EP); }
      else { putH(nE[0], ey, EW); putH(nE[1], ey, EP); putH(fE[0], ey, EW); putH(fE[1], ey, EP); }
      if (P.fem) { putH(nE[0] - 1, ey - 1, EP); putH(fE[1] + 1, ey - 1, EP); }
      // the nose: the tip lit, the shadow under it
      putH(F(22.2), ny - 1, SK[1]); putH(F(20.6), ny + 1, SK[4]); putH(F(21.4), ny + 1, SK[3]);
      // the moustache
      if (P.mustache === "big") { hz(F(15.6), F(21), my - 2, BE[2]); hz(F(14.4), F(21.6), my - 1, BE[4]); putH(F(14.4), my, BE[4]); putH(F(21.6), my, BE[4]); }
      else if (P.mustache) hz(F(14.8), F(21), my - 1, BE[3]);
      // the mouth
      const m0 = F(15.4), m1 = F(19.4), LP = ramp(P.lips || "#c47a6a");
      if (P.mouth === "grin") { hz(m0, m1, my, TE); hz(m0, m1, my + 1, MO); }
      else if (P.mouth === "biggrin") { hz(m0 - 1, m1 + 1, my, TE); hz(m0 - 1, m1 + 1, my + 1, MO); putH(m0 - 1, my - 1, MO); putH(m1 + 1, my - 1, MO); }
      else if (P.mouth === "open") { hz(m0 + 1, m1, my, MO); hz(m0 + 1, m1, my + 1, LP[2]); }
      else if (P.mouth === "smirk") { hz(m0 + 1, m1, my, MO); putH(m1 + 1, my - 1, MO); }
      else if (P.mouth === "under") { hz(m0 + 1, m1, my + 1, LP[2]); }
      else if (P.mouth === "lips") { hz(m0, m1, my, MO); hz(m0 + 1, m1, my + 1, LP[2]); }
      else if (P.mouth === "small") { putH(m0 + 1, my, LP[3]); putH(m0 + 2, my, MO); }
      else hz(m0, m1, my, MO);
      // the glasses: a box round each eye (one pixel of frame), the lens light so it reads as glass and not as a dark
      // band, a glint, the eye in it, the bridge, the arm to the ear
      if (P.glasses) {
        const GP = P.glasses, G = u32(GP.color), lensC = mix2(SK[1], u32("#e6f4fb"), 0.55), round = GP.kind !== "square", big = (GP.lens && GP.lens[0][0] <= 11) ? 1 : 0;
        const boxes = [[nE[0] - 1 - big, ey - 1, nE[1] + 2, ey + 2], [fE[0] - 1, ey - 1, fE[1] + 1 + big, ey + 2]];
        for (const [x0, y0, x1, y1] of boxes) for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) {
          const edge = x === x0 || x === x1 || y === y0 || y === y1, corner = (x === x0 || x === x1) && (y === y0 || y === y1);
          if (edge) { if (!(round && corner)) putH(x, y, G); } else { const c0 = buf[y * W2 + x]; if (c0 !== EW && c0 !== EP) putH(x, y, lensC); }
        }
        putH(boxes[0][2] - 1, boxes[0][1] + 1, u32("#ffffff")); // the glint
        for (let x = F(8.6); x < boxes[0][0]; x++) putH(x, ey, G); // the arm
      }
      // the cigarette from the corner of the mouth, the lit end
      if (P.cig) { const cx = m1 + 1, cy = my + 1; putH(cx, cy, u32("#d89a5a")); putH(cx + 1, cy, u32("#f6f4ee")); putH(cx + 2, cy, u32("#f6f4ee")); putH(cx + 3, cy + 1, u32("#ff7a22")); ember = [cx + 3, cy + 1]; }
    } else if (!FINE) {
      // the brows, the eyes, the nose, the mouth (the 1x map, as designed)
      for (const [x0, x1, y] of [[12, 15, bY], [17, 20, bY]]) for (let x = x0; x <= x1; x++) put(x, y + (x === x0 && P.brows !== "flat" ? 1 : 0), browC);
      if (P.brows === "thick") for (const [x0, x1] of [[12, 15], [17, 20]]) for (let x = x0 + 1; x <= x1; x++) put(x, bY - 1, browC); // straight and thick, a row above
      if (P.brows === "heavy") { if (P.browsUp) { for (const x of [13, 14, 18, 19]) put(x, bY - 1, browC); } else { put(13, bY + 1, browC); put(18, bY + 1, browC); } } // beta 3.31: over glasses, the weight goes up, clear of the frame
      if (P.eyes === "lidded") { put(13, 13, EW); put(14, 13, EP); put(18, 13, EW); put(19, 13, EP); for (const x of [13, 14, 15, 18, 19, 20]) put(x, 12, SK[4]); } // heavy lids
      else if (P.eyes === "smile") { for (const [x0, x1] of [[13, 15], [18, 19]]) for (let x = x0; x <= x1; x++) put(x, 13, EP); put(13, 12, SK[3]); put(18, 12, SK[3]); }
      else { put(13, 13, EW); put(14, 13, EP); put(15, 13, SK[2]); put(18, 13, EW); put(19, 13, EP); put(14, 12, SK[3]); put(19, 12, SK[3]); }
      if (P.fem) { put(15, 12, EP); put(20, 12, EP); put(13, 13, EP); } // lashes
      if (P.fem) { put(21, 16, SK[3]); put(20, 17, SK[3]); } else { put(21, 15, SK[2]); put(21, 16, SK[3]); put(20, 17, SK[4]); put(22, 15, SK[1]); }
      if (P.mouth === "biggrin") { for (let x = 14; x <= 20; x++) { put(x, 20, x === 14 || x === 20 ? MO : TE); put(x, 21, x === 14 || x === 20 ? SK[3] : MO); } put(13, 19, MO); put(21, 19, MO); for (let x = 15; x <= 19; x++) put(x, 22, SK[3]); } // beta 3.31: Iulica's wide grin, all the teeth
      else if (P.mouth === "under") { for (let x = 16; x <= 18; x++) put(x, 21, u32(P.lips || "#c47a6a")); put(17, 20, SK[3]); } // the lips, closed, under a big moustache
      else if (P.mouth === "smirk") { for (let x = 16; x <= 18; x++) { put(x, 20, MO); put(x, 21, u32(P.lips || "#c98a7a")); } put(19, 19, MO); }
      else if (P.mouth === "open") { for (let x = 16; x <= 18; x++) { put(x, 20, MO); put(x, 21, u32(P.lips || "#c47a6a")); } put(15, 19, MO); put(19, 19, MO); } // a small open smile
      else if (P.mouth === "grin") { for (let x = 15; x <= 19; x++) { put(x, 20, TE); put(x, 21, MO); } put(14, 19, MO); put(20, 19, MO); }
      else if (P.mouth === "lips") { for (let x = 15; x <= 19; x++) { put(x, 20, x === 15 || x === 19 ? MO : u32(P.lips)); put(x, 21, x > 15 && x < 19 ? u32(P.lips) : SK[2]); } for (let x = 16; x <= 18; x++) put(x, 20, MO); put(16, 21, ramp(P.lips)[1]); }
      else if (P.mouth === "small") { put(16, 20, u32(P.lips || "#b05a50")); put(17, 20, u32(P.lips || "#b05a50")); put(18, 20, MO); }
      else for (let x = 15; x <= 19; x++) put(x, 20, x === 15 || x === 19 ? SK[3] : MO);
      // glasses. beta 3.31 (Daniel): one thin pixel of frame, the eyes showing through, the lens a touch lighter and a
      // glint on it, so they read as clear glasses on the small heads too (not sunglasses)
      if (P.glasses) {
        const GP = P.glasses, G = u32(GP.color), frame = [], lens = [];
        const rect = ([x0, y0, x1, y1]) => { for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) (x === x0 || x === x1 || y === y0 || y === y1 ? frame : lens).push([x, y]); };
        const ring = ([gx, gy, grx, gry]) => { const e = (x, y) => ((x - gx) / grx) ** 2 + ((y - gy) / gry) ** 2 <= 1; for (let y = Math.floor(gy - gry - 1); y <= gy + gry + 1; y++) for (let x = Math.floor(gx - grx - 1); x <= gx + grx + 1; x++) { const fx = x + 0.5, fy = y + 0.5; if (!e(fx, fy)) continue; (!e(fx - 1, fy) || !e(fx + 1, fy) || !e(fx, fy - 1) || !e(fx, fy + 1) ? frame : lens).push([x, y]); } };
        if (GP.kind === "square") (GP.lens || [[12, 11, 16, 15], [18, 11, 21, 15]]).forEach(rect);
        else (GP.lens || [[13.9, 13, 2.2, 1.9], [19, 13, 1.6, 1.9]]).forEach(ring);
        const tint = u32(GP.tint || "#e6f4fb");
        for (const [x, y] of lens) { const c0 = buf[y * W2 + x]; if (c0 != null && c0 !== EW && c0 !== EP) putH(x, y, mix2(c0, tint, 0.3)); }
        for (const [x, y] of GP.glint || []) putH(x, y, u32("#ffffff"));
        for (const [x, y] of frame) putH(x, y, G);
        for (const [x, y] of GP.bridge || [[16, 12], [17, 12]]) putH(x, y, G);
        for (let x = 8; x <= (GP.arm || 11); x++) put(x, (GP.armY || 12) + (x < 10 ? 1 : 0), G); // the arm to the ear
      }
      // the cigarette, in the corner of the mouth: white paper, the lit end
      // beta 3.32 (Daniel: "from time to time he keeps it in his mouth"): this head is the one with the cigarette in it
      // ("cristache+cig"); it hangs from the lips, forward and a little down, the lit end at (25, 22)
      if (P.cig) { for (const [x, y, c] of [[19, 21, "#c98a52"], [20, 21, "#f6f4ee"], [21, 21, "#f6f4ee"], [22, 22, "#f6f4ee"], [23, 22, "#e4e0d8"], [24, 22, "#ff7a22"]]) put(x, y, u32(c)); ember = [PX(24), PX(22)]; }
    } else {
      // ---- fine: the features drawn again at this size, snapped to the pixel grid
      const mark = (X, Y, c) => { putH(X, Y, c); if (X >= 0 && Y >= 0 && X < W2 && Y < H2) feat[Y * W2 + X] = 1; };
      const hline = (X0, X1, Y, c, m) => { for (let X = X0; X < Math.max(X0 + 1, X1); X++) (m ? mark : putH)(X, Y, c); };
      const T = Math.max(1, Math.round(K / 3)); // the weight of a drawn line: one pixel, two on the biggest heads
      // a tapered stroke along a polyline (in head units), never thinner than one pixel
      const stroke = (pts, w0, w1, col) => {
        let tot = 0; const seg = []; for (let i = 1; i < pts.length; i++) { const l = Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]); seg.push([pts[i - 1], pts[i], tot, l]); tot += l; }
        const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]), m = Math.max(w0, w1) + 1;
        for (let Y = Math.floor((Math.min(...ys) - m) * K); Y <= (Math.max(...ys) + m) * K; Y++) for (let X = Math.floor((Math.min(...xs) - m) * K); X <= (Math.max(...xs) + m) * K; X++) {
          const fx = (X + 0.5) / K, fy = (Y + 0.5) / K; let best = 1e9, bt = 0;
          for (const [a, b, t0, l] of seg) { const vx = b[0] - a[0], vy = b[1] - a[1], q = clamp(((fx - a[0]) * vx + (fy - a[1]) * vy) / (l * l || 1), 0, 1), d = Math.hypot(fx - a[0] - vx * q, fy - a[1] - vy * q); if (d < best) { best = d; bt = (t0 + q * l) / (tot || 1); } }
          const wv = lerp(w0, w1, bt) / 2; if (best * K <= Math.max(0.55, wv * K)) { const c = typeof col === "function" ? col(bt, fx, fy) : col; if (c) putH(X, Y, c); }
        }
      };
      // the brows: a stroke, the back end lower, heavier where theirs are
      const bw = P.brows === "heavy" ? [1.5, 1.0] : P.brows === "thick" ? [1.9, 1.6] : P.brows === "flat" ? [1.0, 0.9] : [0.95, 0.6];
      const bo = (P.brows === "thick" ? -0.5 : P.brows === "heavy" && P.browsUp ? -0.35 : 0) - (P.glasses && K < 2.5 ? 0.45 : 0); // over glasses, the brows clear of the frame
      for (const [x0, x1] of [[12, 15.9], [17, 20.9]]) {
        const pts = P.brows === "flat" ? [[x0 + 0.2, bY + 0.5], [x1, bY + 0.5]] : [[x0 + 0.2, bY + 1.3 + bo], [x0 + 1.1, bY + 0.55 + bo], [x1, bY + 0.45 + bo]];
        stroke(pts, bw[0], bw[1], (t) => (K >= 3 && t > 0.15 && t < 0.9 && grain(PX(x0 + t * (x1 - x0)), 0, 3, 1) > 0.7 ? mix2(browC, HR[2], 0.5) : browC));
      }
      // the eyes: an almond of white, the iris towards the nose (they look ahead), its pupil and a light in it, the
      // upper lid's line over it, the lower lid in shadow
      const IR = ramp(P.iris || "#5a3a26"), LID = mix2(EP, SK[5], 0.35);
      const eye = (cx, cy, hw, hh, minW) => {
        const X0 = PX(cx - hw), X1 = Math.max(X0 + minW, PX(cx + hw)), Y0 = PX(cy - hh), Y1 = Math.max(Y0 + 2, PX(cy + hh)), w = X1 - X0, h = Y1 - Y0;
        const ecx = (X0 + X1) / 2, ecy = (Y0 + Y1) / 2, inA = (X, Y) => { if (w < 5 || h < 3) return !(Y === Y1 - 1 && X === X1 - 1 && w >= 4); const u = (X + 0.5 - ecx) / (w / 2 + 0.25), v = (Y + 0.5 - ecy) / (h / 2 + 0.25); return u * u + v * v * (v < 0 ? 0.75 : 1.1) <= 1; };
        if (P.eyes === "smile") { // shut with the smile: an arc, the cheek pushed up under it
          for (let X = X0; X < X1; X++) { const u = (X + 0.5 - X0) / w * 2 - 1, y = Y1 - 1 - Math.round((h - 1) * 0.9 * (1 - u * u)); for (let i = 0; i < T; i++) mark(X, y + i, EP); }
          if (K >= 2.5) hline(X0 + 1, X1 - 1, Y1 + T, SK[1]);
          return;
        }
        const ix = X0 + w * 0.62, iy = ecy + (h >= 4 ? 0.2 : 0), ir = Math.max(1.15, h * 0.45);
        for (let Y = Y0; Y < Y1; Y++) for (let X = X0; X < X1; X++) {
          if (!inA(X, Y)) continue;
          const d = Math.hypot(X + 0.5 - ix, Y + 0.5 - iy);
          let c = EW;
          if (d <= ir) c = d <= ir * 0.5 || ir < 1.6 && d <= ir * 0.75 ? EP : IR[Y + 0.5 < iy ? 3 : 2];
          else if (Y === Y0 && h >= 3) c = mix2(EW, SK[3], 0.45); // the lid's shadow on the white
          mark(X, Y, c);
        }
        if (ir >= 1.6) mark(Math.floor(ix - ir * 0.45), Math.floor(iy - ir * 0.45), u32("#ffffff")); // the light in the eye
        const lidRows = P.eyes === "lidded" ? Math.max(1, Math.round(h * 0.45)) : 0;
        for (let i = 0; i < lidRows; i++) hline(X0, X1, Y0 + i, i === lidRows - 1 ? LID : SK[3], true); // heavy lids: the lid down over the eye, its edge dark
        if (!(P.glasses && K < 2.5)) for (let i = 1; i <= T; i++) hline(X0 - (i === 1 ? 1 : 0), X1, Y0 - i, i === 1 && lidRows ? SK[4] : LID, true); // the upper lid's line (behind small glasses the frame draws it)
        mark(X0 - 1, Y0, LID); // its back end, down at the corner
        if (P.fem) { mark(X0 - 2, Y0 - T - 1 + T, EP); mark(X0 - 2, Y0 - 1, EP); if (K >= 2.5) mark(X0 - 3, Y0 - 2, EP); } // the lashes
        if (K >= 2.5) hline(X0 + 1, X1 - 1, Y1, SK[3]); // the lower lid
      };
      eye(14, 13.5, 1.35, 0.62, 4); eye(19, 13.5, 1.05, 0.62, 3);
      // the nose: the bridge and the tip lit, the nostril and the shadow under it
      const rU = (x0, y0, x1, y1, c) => { const X0 = PX(x0), Y0 = PX(y0), X1 = Math.max(X0 + 1, PX(x1)), Y1 = Math.max(Y0 + 1, PX(y1)); for (let Y = Y0; Y < Y1; Y++) for (let X = X0; X < X1; X++) if (buf[Y * W2 + X] != null) putH(X, Y, c); };
      if (!P.fem) { rU(21, 12.8 - nz * 0.5, 21.5, 15, SK[1]); rU(21.6, 15, 22.3 + nz * 0.5, 15.6, SK[0]); rU(20.3, 16.4, 21.1, 17.1, SK[4]); rU(19.6, 17.1, 21.4, 17.6, SK[3]); }
      else { rU(21, 13.4, 21.4, 15.4, SK[1]); rU(20.6, 16.4, 21.2, 17, SK[3]); }
      // the moustache and the mouth: rows stacked down from the lip line, each at least a pixel
      const LP = ramp(P.lips || "#c47a6a"), my = PX(P.mouth === "under" ? 20.5 : 19.7);
      const rows = (spec, y0 = my) => { let Y = y0; for (const [hU, x0, x1, c] of spec) { const n = Math.max(1, Math.round(hU * K)); for (let i = 0; i < n; i++) hline(PX(x0), PX(x1), Y + i, c); Y += n; } return Y; };
      const teeth = (x0, x1, Y0, Y1, c) => { if (K < 3) return; for (const tx of [16.2, 17.4, 18.6, 19.8]) if (tx > x0 + 0.3 && tx < x1 - 0.3) for (let Y = Y0; Y < Y1; Y++) putH(PX(tx), Y, mix2(c, SK[3], 0.4)); };
      const corner = (x0, x1, c = MO) => hline(PX(x0), PX(x1), my - 1, c);
      const m = P.mouth;
      if (m === "grin") { const y1 = rows([[0.8, 15, 19.9, TE]]); teeth(15, 19.9, my, y1, TE); rows([[0.6, 15, 19.9, MO], [0.5, 15.5, 19.5, SK[1]]], y1); corner(14.4, 15); corner(19.9, 20.5); }
      else if (m === "biggrin") { const y1 = rows([[K < 2.5 ? 1.3 : 0.9, 14, 20.9, TE]]); teeth(14, 20.9, my, y1, TE); rows(K < 2.5 ? [[0.5, 14, 20.9, MO], [0.6, 14.7, 20.2, mix2(TE, SK[3], 0.3)], [0.5, 15.2, 19.7, SK[3]]] : [[0.45, 14, 20.9, MO], [0.5, 14.7, 20.2, mix2(TE, SK[3], 0.25)], [0.45, 14.7, 20.2, MO], [0.4, 15.2, 19.7, SK[3]]], y1); corner(13.3, 14); corner(20.9, 21.6); }
      else if (m === "open") { rows([[0.55, 16, 19, MO], [0.4, 16.2, 18.8, u32("#9a3434")], [0.5, 16.2, 18.8, LP[1]]]); corner(15.3, 16); corner(19, 19.7); }
      else if (m === "smirk") { rows([[0.45, 16, 18.9, MO], [0.6, 16, 18.9, LP[2]]]); corner(18.9, 19.7); }
      else if (m === "under") { rows([[0.4, 16, 19, SK[4]], [0.75, 16, 19, LP[2]], [0.35, 16.4, 18.6, SK[3]]]); if (K >= 2) putH(PX(16.6), my + Math.max(1, Math.round(0.4 * K)), LP[0]); }
      else if (m === "lips") { const y1 = rows([[0.7, 15, 20, LP[3]], [0.3, 15, 20, MO], [0.85, 15.6, 19.4, LP[2]], [0.3, 16, 19, SK[3]]]); if (K >= 2) putH(PX(16.4), y1 - Math.max(1, Math.round(0.3 * K)) - 1, LP[0]); }
      else if (m === "small") { const y1 = rows([[0.5, 16, 18.6, LP[3]], [0.3, 16, 18.8, MO], [0.65, 16.2, 18.4, LP[2]]]); if (K >= 2) putH(PX(16.8), y1 - 1, LP[0]); }
      else rows([[0.45, 15, 19.6, MO], [0.5, 15.4, 19.2, SK[3]]]);
      // glasses: the frame (thicker on Steve's), the eye through a lens a touch lighter, a glint across it, the bridge, the arm to the ear
      if (P.glasses) {
        const GP = P.glasses, G = u32(GP.color), tint = u32(GP.tint || "#e6f4fb"), ft = Math.max(1, Math.round(K * (GP.t || 0.3))), lenses = [];
        if (GP.kind === "square") for (const [x0, y0, x1, y1] of GP.lens || [[12, 11, 16, 15], [18, 11, 21, 15]]) {
          const X0 = PX(x0), Y0 = PX(y0), X1 = PX(x1 + 1), Y1 = PX(y1 + 1), rr = K >= 3 ? 1 : 0;
          const inside = (X, Y) => X >= X0 && X < X1 && Y >= Y0 && Y < Y1 && !(rr && (X === X0 || X === X1 - 1) && (Y === Y0 || Y === Y1 - 1));
          lenses.push({ X0, Y0, X1, Y1, inside, edge: (X, Y) => X < X0 + ft || X >= X1 - ft || Y < Y0 + ft || Y >= Y1 - ft });
        } else for (const [gx, gy, grx, gry] of GP.lens || [[13.9, 13, 2.2, 1.9], [19, 13, 1.6, 1.9]]) {
          const e = (X, Y, g) => (((X + 0.5) / K - gx) / (grx - g)) ** 2 + (((Y + 0.5) / K - gy) / (gry - g)) ** 2 <= 1;
          lenses.push({ X0: PX(gx - grx) - 1, Y0: PX(gy - gry) - 1, X1: PX(gx + grx) + 1, Y1: PX(gy + gry) + 1, inside: (X, Y) => e(X, Y, 0), edge: (X, Y) => !e(X, Y, ft / K) });
        }
        for (const l of lenses) {
          for (let Y = l.Y0; Y < l.Y1; Y++) for (let X = l.X0; X < l.X1; X++) {
            if (!l.inside(X, Y)) continue; const i = Y * W2 + X;
            if (l.edge(X, Y)) { putH(X, Y, G); continue; }
            if (buf[i] != null && !feat[i]) putH(X, Y, mix2(buf[i], tint, 0.26));
          }
          const iw = l.X1 - l.X0 - ft * 2, ih = l.Y1 - l.Y0 - ft * 2;
          if (iw >= 4 && ih >= 4) for (let i = 0; i < Math.min(iw, ih) - 2; i++) { const X = l.X0 + ft + 1 + i, Y = l.Y0 + ft + Math.round(ih * 0.62) - i; if (Y > l.Y0 + ft && !feat[Y * W2 + X]) putH(X, Y, mix2(u32("#ffffff"), tint, 0.3)); } // the glint
          else putH(l.X1 - ft - 1, l.Y0 + ft, u32("#ffffff"));
        }
        if (lenses.length > 1) { const a = lenses[0], b = lenses[1], Y = Math.round(lerp(a.Y0, a.Y1, 0.3)); for (let X = a.X1 - ft; X < b.X0 + ft; X++) for (let i = 0; i < ft; i++) if (!b.inside(X, Y + i) || b.edge(X, Y + i)) putH(X, Y + i, G); } // the bridge
        { const a = lenses[0], Y = Math.round(lerp(a.Y0, a.Y1, 0.28)); for (let X = PX(8.2); X < a.X0 + 1; X++) for (let i = 0; i < ft; i++) putH(X, Y + i + (X < PX(10) ? Math.max(1, ft) : 0), G); } // the arm
      }
      // the cigarette hanging from the corner of the mouth: the filter, the paper lit on top, the ash, the lit end
      if (P.cig) {
        const a = [19.2, 21.0], b = [24.8, 22.5];
        stroke([a, b], 0.95, 0.85, (t, fx, fy) => { const up = (fy - lerp(a[1], b[1], t)) < 0; return t < 0.15 ? u32(up ? "#e0a066" : "#b0703e") : t > 0.93 ? u32(K >= 3 && up ? "#ffd27a" : "#ff6a1a") : t > 0.87 ? u32("#8a8a94") : u32(up ? "#f8f6f0" : "#d4d0c8"); });
        ember = [PX(b[0]) - 1, PX(b[1])];
      }
    }
    // beta 3.32: no outline of its own: the figure's finish outlines the head with the rest, in the hair's and the
    // skin's own dark tones
    const out = buf.slice();
    // rows + palette, for the blitter
    const keys = new Map(), pal = {}; let kk = 0; const CH = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const rows = []; for (let y = 0; y < H2; y++) { let r = ""; for (let x = 0; x < W2; x++) { const c = out[y * W2 + x]; if (c == null) { r += "."; continue; } if (!keys.has(c)) { const ch = kk < CH.length ? CH[kk] : String.fromCharCode(0x100 + kk); kk++; keys.set(c, ch); pal[ch] = c; } r += keys.get(c); } rows.push(r); }
    return { rows, pal, at: [PX(HEAD_ANCHOR[0]), PX(HEAD_ANCHOR[1])], ember, K };
  }
  // a head made smaller (for the people further back): each new pixel takes the colour most of its block has, but the
  // darks (the outline, the eyes, the brows) win when they are a quarter of it, so the face keeps its features
  function shrinkHead(H0, k) {
    const w = Math.round(HW * k), h = Math.round(HH * k), rows = [];
    const lum = (v) => (v & 255) * 0.3 + ((v >> 8) & 255) * 0.59 + ((v >> 16) & 255) * 0.11;
    for (let y = 0; y < h; y++) { let r = ""; for (let x = 0; x < w; x++) {
      const cnt = new Map(); let n = 0, dark = null, nd = 0;
      for (let yy = Math.floor(y / k); yy < Math.min(HH, Math.ceil((y + 1) / k)); yy++) for (let xx = Math.floor(x / k); xx < Math.min(HW, Math.ceil((x + 1) / k)); xx++) { const ch = H0.rows[yy][xx]; n++; cnt.set(ch, (cnt.get(ch) || 0) + 1); if (ch !== "." && lum(H0.pal[ch]) < 60) { nd++; if (!dark || lum(H0.pal[ch]) < lum(H0.pal[dark])) dark = ch; } }
      let best = ".", bn = 0; for (const [ch, c] of cnt) if (ch !== "." && c > bn) { best = ch; bn = c; }
      if ((cnt.get(".") || 0) > n * 0.55) best = "."; else if (dark && nd >= n * 0.4) best = dark;
      r += best;
    } rows.push(r); }
    return { rows, pal: H0.pal, at: [Math.round(HEAD_ANCHOR[0] * k), Math.round(HEAD_ANCHOR[1] * k)], ember: H0.ember ? [Math.round(H0.ember[0] * k), Math.round(H0.ember[1] * k)] : null };
  }
  // beta 3.31: on a head made smaller, glasses drawn again at that size, so they stay clear glasses (a thin frame line
  // over a light lens, the eye in it), not the dark band the shrinking makes of them
  function smallGlasses(H, G, k) {
    if (!G) return H;
    const rows = H.rows.map((r) => r.split("")), pal = Object.assign({}, H.pal, { "!": u32(G.color), "%": u32("#e4f0f6"), "&": u32("#1c1214") });
    const lens = G.kind === "square" ? (G.lens || [[12, 11, 16, 15], [18, 11, 21, 15]]) : (G.lens || [[13.9, 13, 2.2, 1.9], [19, 13, 1.6, 1.9]]).map(([gx, gy, rx2, ry2]) => [gx - rx2, gy - ry2, gx + rx2, gy + ry2]);
    const set = (x, y, ch) => { if (rows[y] && x >= 0 && x < rows[y].length) rows[y][x] = ch; };
    lens.forEach(([x0, y0, x1, y1], i) => {
      const X0 = Math.round(x0 * k), X1 = Math.max(X0 + 1, Math.round(x1 * k) - (i ? 1 : 0)), Y0 = Math.round(y0 * k), Y1 = Math.round(y1 * k), px2 = Math.round((i ? 19 : 14) * k);
      for (let x = X0; x <= X1; x++) { set(x, Y0, "!"); for (let y = Y0 + 1; y < Math.max(Y0 + 2, Y1); y++) set(x, y, x === px2 && y === Y0 + 1 ? "&" : "%"); if (Y1 - Y0 >= 3) set(x, Y1, "!"); }
      if (X1 - X0 >= 3) for (let y = Y0 + 1; y < Math.max(Y0 + 2, Y1); y++) { set(X0, y, "!"); set(X1, y, "!"); }
    });
    return { rows: rows.map((r) => r.join("")), pal, at: H.at, ember: H.ember };
  }
  const hueTurn = (hex, deg) => {
    let [r, g2, b] = rgbOf(hex).map((v) => v / 255); const mx = Math.max(r, g2, b), mn = Math.min(r, g2, b), l = (mx + mn) / 2, d = mx - mn;
    if (d < 0.04) return hexOf([r, g2, b].map((v) => (1 - v) * 0.5 * 255 + v * 0.5 * 255 * 0.6)); // greys: a darker shade
    const s2 = d / (1 - Math.abs(2 * l - 1)); let h = mx === r ? ((g2 - b) / d) % 6 : mx === g2 ? (b - r) / d + 2 : (r - g2) / d + 4; h = (h * 60 + deg + 360) % 360;
    const c = (1 - Math.abs(2 * l - 1)) * s2, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2, k = Math.floor(h / 60);
    const rgb = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][k]; return hexOf(rgb.map((v) => (v + m) * 255));
  };
  const lookOf = (id, alt) => { if (!alt) return LOOKS[id] || NPC_LOOKS[id]; const L = Object.assign({}, LOOKS[id]); for (const k of ["top", "pants", "glove", "skirt", "inner", "trim", "wrist", "apron"]) if (L[k]) L[k] = hueTurn(L[k], 150); return L; };
  // view (beta 3.32, the portraits): { K, w, h, ox, oy }: the figure K times finer, into a w x h cell, the pose's origin
  // at (ox, oy); without it, a frame of the game (CW x CH, the feet at OX, OY)
  function drawFighter(id, p0, prop, alt, view) {
    // beta 3.33: sc, the canvas pixels to a pose unit; U, the canvas pixels to one pixel of the old 1.1 fighter (the
    // sizes below that were given in pixels: the feet, the fists, the props)
    const KK = view ? view.K : 1, L = lookOf(id, alt), B = Object.assign({ sh: 1, arm: 1, leg: 1, waist: 1, chest: 1, sc: 1 }, L.build), sc = B.sc * (L.hands ? NPCB : BODY) * KK, U = (L.hands ? NPCB : BODY) * KK / 1.1;
    const p = {}; for (const k in p0) p[k] = Array.isArray(p0[k]) ? [p0[k][0] * sc, p0[k][1] * sc] : p0[k];
    const F = view ? new Fig(view.w, view.h) : new Fig(CW, CH), T = view ? (q) => [q[0] + view.ox, q[1] + view.oy] : (q) => [q[0] + OX, q[1] + OY];
    let ember = null; // beta 3.32: where the cigarette's lit end is in this frame (the smoke rises from it)
    const hip = T(p.hip), neck = T(p.neck), head = T(p.head), tw = p.tw || 0;
    const ang = Math.atan2(neck[0] - hip[0], -(neck[1] - hip[1])), ca = Math.cos(ang), sa = Math.sin(ang);
    const off = (o, dx, dy) => [o[0] + dx * ca - dy * sa, o[1] + dx * sa + dy * ca];
    const SK = ramp(L.skin), TOP = ramp(L.top), PA = ramp(L.pants || L.skin), GL = ramp(L.glove || L.wrap || "#f4f4f4"), SO = u32(L.sole || "#101014");
    const tone = (R, nx, ny) => R[toneOf(nx, ny)];
    const back = (R, nx, ny) => R[Math.min(4, toneOf(nx, ny) + 1)]; // the far side, a tone darker
    const br = p.br || 0; // the breath: the chest a little wider, the shoulders a little higher
    // beta 3.33 (Daniel, arcade proportions): heroic: the shoulders and the chest broader, the waist narrower
    const wsh = (18 + br * 0.35) * B.sh * sc, len = Math.hypot(neck[0] - hip[0], neck[1] - hip[1]);
    const sF = off(neck, (7.8 + 3 * tw) * B.sh * sc, 4 * U), sB = off(neck, (-7.6 + 2 * tw) * B.sh * sc, 3 * U);
    const lF = off(hip, 3.5 * sc, U), lB = off(hip, -2.5 * sc, U); // beta 3.30: the legs from under the body (no seat sticking out)
    // an arm: the deltoid, the upper arm with the biceps, the forearm, then the glove with its cuff
    const arm = (s, e, h, far) => {
      const g = far ? 1 : 2, ar = B.arm * sc * (L.hands && !L.full ? 0.8 : 1), /* beta 3.33: the people around keep everyday arms (beta 3.34: the ending's three keep the fighters') */ sleeveTo = L.sleeve === "long" ? 2 : L.sleeve === "rolled" ? 1.4 : L.sleeve === "gi" ? 1.3 : L.sleeve === "short" ? 0.55 : -1;
      const SLV = L.sleeveCol ? ramp(L.sleeveCol) : TOP;
      const mat = (seg) => (nx, ny, t, px, py) => { const R = seg + t * 0.999 < sleeveTo || (seg === 1 && sleeveTo >= 2) ? SLV : SK;
        if (L.topKind === "varsity" && seg === 1 && t > 0.82) return (far ? back : tone)(ramp(L.top), nx, ny); // the knit cuff
        if (seg === 1 && t > 0.8 && R === SK && !L.hands) return (far ? back : tone)(ramp(WRAP), nx, ny); // the tape up the wrist
        if (L.sleeve === "rolled" && seg === 1 && Math.abs(t - 0.4) < 0.06) return TOP[far ? 4 : 3]; // the rolled cuff
        if (L.topKind === "fleece" && R === TOP && R === SLV) { const fz = hash2(px * 7.3, py * 5.1); return R[clamp(toneOf(nx, ny) + (far ? 1 : 0) + (fz > 0.72 ? 1 : fz < 0.12 ? -1 : 0), 0, 4)]; } if (L.tattoo && R === SK && seg === 1 && t > 0.2 && t < 0.8 && hash2(Math.floor(t * 8), Math.floor((nx + 1) * 2.2)) > 0.5) return ramp("#56607e")[clamp(toneOf(nx, ny) + (far ? 1 : 0) + 1, 1, 4)]; // beta 3.32: the tattoos in blocks of ink, shaded with the arm
        // beta 3.30: the muscle drawn in: the line between biceps and triceps, the deltoid's edge, the forearm's ridge; on a sleeve, the creases at the elbow
        let ex2 = 0;
        if (R === SK) { if (seg === 0 && t > 0.32 && t < 0.86 && Math.abs(nx - 0.05) < 0.12) ex2 = 1; if (seg === 0 && t > 0.24 && t < 0.32 && nx > -0.3) ex2 = 1; if (seg === 1 && t > 0.1 && t < 0.62 && Math.abs(nx + 0.28) < 0.11) ex2 = 1; }
        else ex2 = folds(nx, t, ARM_FOLDS[seg]); // beta 3.32: the creases round the elbow, the folds down the sleeve, each with its lit ridge
        return R[clamp(toneOf(nx, ny) + (far ? 1 : 0) + ex2, 0, 4)]; };
      limb(F, s, e, 6.9 * ar, 4.3 * ar, 1.7 * ar, 0.42, mat(0), g); // a strong upper arm, the deltoid and the biceps (beta 3.33: bigger)
      limb(F, e, h, 5.3 * ar, 3.7 * ar, 0.9 * ar, 0.28, mat(1), g); // a thick forearm
      const vx = h[0] - e[0], vy = h[1] - e[1], vl = Math.hypot(vx, vy) || 1, ux = vx / vl, uy = vy / vl, gr = 5.9 * Math.min(1.1, sc);
      if (L.hands) blob(F, [h[0] + ux * 0.5 * U, h[1] + uy * 0.5 * U], 3.1 * sc + 0.55 * U, 2.8 * sc + 0.55 * U, (nx, ny) => (far ? back : tone)(SK, nx, ny), g + 10); // a bystander's bare hand
      else { // beta 3.16 (Daniel): a bare fist in plain white hand wraps, for everyone; the knuckles just showing
        // beta 3.32 (the arcade refs): a fist that reads as a hand: the tape over the wrist, the back of the hand and the
        // knuckles; the curled fingers bare under it, split by dark lines, the thumb across them
        const WR = ramp(WRAP), fr2 = FIST * Math.min(1.12, B.sc * 1.1) * U, c0 = [h[0] + ux * U, h[1] + uy * U]; // big fists (beta 3.33: bigger)
        let qx = -uy, qy = ux; if (qy < 0 || (Math.abs(qy) < 0.2 && qx < 0)) { qx = -qx; qy = -qy; } // across the fist, towards the palm
        blob(F, c0, fr2, fr2 * 0.9, (nx, ny, px, py) => {
          const aa = ((px - c0[0]) * ux + (py - c0[1]) * uy) / fr2, cc = ((px - c0[0]) * qx + (py - c0[1]) * qy) / fr2, sh = far ? back : tone;
          if (aa < -0.3 || cc < -0.4 + aa * 0.2) { const band = Math.floor((aa * fr2 / U + 9) / 1.2) % 3 === 0; return sh(WR, nx, ny + (band && aa < -0.3 ? 0.35 : 0)); } // the tape
          if (cc > 0.45 && aa < 0.35) return SK[Math.min(4, toneOf(nx, ny) + (far ? 1 : 0) + (cc < 0.58 ? 2 : 0))]; // the thumb, its edge
          const line = Math.abs(cc - 0.05) < 0.09 || Math.abs(cc - 0.36) < 0.09 || (Math.abs(cc - 0.66) < 0.09 && aa >= 0.35);
          return SK[Math.min(4, toneOf(nx, ny) + (far ? 1 : 0) + (line ? 2 : 0))];
        }, g + 10);
      }
    };
    const leg = (r, k, f, far) => {
      const g = far ? 3 : 4, lg = B.leg * sc, bare = L.legs === "skirt";
      const R = bare ? SK : PA, loose = bare ? 0 : L.loose || 0.8;
      const mat = (nx, ny, t = 0.5, px = CURX, py = CURY, shin = false) => {
        let ex2 = 0;
        if (R === SK) { if (shin && t > 0.12 && t < 0.55 && Math.abs(nx - 0.3) < 0.12) ex2 = 1; if (!shin && t > 0.86 && nx < 0) ex2 = 1; }
        else ex2 = shin ? folds(nx, t, LEG_FOLDS[1]) : folds(nx, t, LEG_FOLDS[0]); // beta 3.32: the folds, a dark line with the lit ridge beside it
        return R[clamp(toneOf(nx, ny) + (far ? 1 : 0) + ex2, 0, 4)];
      };
      const thighMat = (nx, ny, t) => (L.cargo && t > 0.45 && t < 0.78 && nx < -0.1 && nx > -0.85 ? R[far ? 4 : t < 0.5 ? 1 : 3] : L.canvas && t > 0.6 && nx > -0.2 && Math.abs(t - 0.62) < 0.03 ? R[far ? 4 : 3] : mat(nx, ny, t)); // the cargo pocket; the canvas trousers' double front
      const shinMat = (nx, ny, t) => (L.ankle && t > 0.78 ? (far ? back : tone)(ramp(L.ankle), nx, ny) : mat(nx, ny, t, CURX, CURY, true));
      limb(F, r, k, (6.2 + loose) * lg, (5 + loose) * lg, (bare ? 1.4 : 1) * lg, 0.5, thighMat, g); // solid thighs, the swell mid-way (not at the seat)
      limb(F, k, [f[0], f[1] - 4 * U], (5 + loose) * lg, (3.4 + loose * (L.hem || 1.2)) * lg, (bare ? 1.3 : 0.6) * lg, 0.28, shinMat, g); // the calf high
      const fq = Math.min(1, B.sc * 1.1) * U * FOOT; // the feet keep to the size of the person (beta 3.33: bigger, as the arcade fighters' are)
      if (L.barefoot) { // a bare foot, the toes forward
        poly(F, [[f[0] - 5 * fq, f[1] - 6 * fq], [f[0] + 3 * fq, f[1] - 5 * fq], [f[0] + 12 * fq, f[1] - 1 * fq], [f[0] + 12 * fq, f[1] + 1 * fq], [f[0] - 5 * fq, f[1] + 1 * fq]], (x, y) => { const u = (x - f[0]) / fq, v = (f[1] - y) / fq; if (u > 7.4 && v < 2.2 && Math.floor((u - 7.4) / 1.25) % 2 === 1) return SK[4]; if (u > 7.4 && v < 0.6) return SK[3]; if (u < -2.5 && v < 2.5) return SK[far ? 4 : 3]; if (Math.abs(u - 1.5) < 0.7 && v > 2.4 && v < 4) return SK[far ? 3 : 2]; return SK[far ? 3 : v > 3.4 ? 1 : 2]; }, g + 10); // the toes (beta 3.33: split, the sole and the heel in shade, the ankle bone)
        if (L.ankle) limb(F, [f[0] - 1 * fq, f[1] - 6 * fq], [f[0] - 1 * fq, f[1] - 4 * fq], 3.4 * fq, 3.4 * fq, 0, 0.5, (nx, ny) => (far ? back : tone)(ramp(L.ankle), nx, ny), g + 11);
      } else if (L.runner) { // beta 3.31: a running shoe: low heel collar, the toe sloping down, a chunky midsole, the stripes crossing on the side
        // beta 3.32 (Daniel: "make Ion's Asics more visible"): a size up (x1.15), a bright white upper, the crossing side
        // stripes bold (two pixels) in a strong blue, the heel counter blue, the laces, a white midsole on a dark outsole
        const RU = L.runner, up2 = ramp(RU.upper), MID = ramp(RU.mid), ST = ramp(RU.stripe), HE = ramp(RU.heel), fr3 = fq * 1.15, fo = [f[0] + 1.2 * U, f[1]];
        poly(F, [[fo[0] - 7 * fr3, fo[1] - 2 * fr3], [fo[0] - 6.4 * fr3, fo[1] - 6.8 * fr3], [fo[0] - 4.8 * fr3, fo[1] - 7.6 * fr3], [fo[0] - 1 * fr3, fo[1] - 7 * fr3], [fo[0] + 2.5 * fr3, fo[1] - 7.4 * fr3], [fo[0] + 6 * fr3, fo[1] - 5.8 * fr3], [fo[0] + 10.5 * fr3, fo[1] - 3.8 * fr3], [fo[0] + 13.4 * fr3, fo[1] - 2.4 * fr3], [fo[0] + 13.8 * fr3, fo[1] + 0.4 * fr3], [fo[0] - 7 * fr3, fo[1] + 0.9 * fr3]], (x, y) => {
          const u = (x - fo[0]) / fr3, v = (fo[1] - y) / fr3;
          if (v < 0.7) return (Math.floor(x) % 3 === 0 && v < 0.2) ? SO : ramp(L.sole)[far ? 4 : 3]; // the outsole, its tread
          const mt = u < 0 ? 3 : 2.6 - u * 0.05;
          if (v < mt) return MID[far ? 3 : v > mt - 0.7 ? 2 : u > 8 ? 1 : 0]; // the midsole, thicker at the heel
          if (u < -4.2 && v > mt) return HE[far ? 4 : v > 5.6 ? 1 : 2]; // the heel counter
          const sA = Math.abs(v - (2.8 + (3.4 - u) * 0.85)) < 0.85 && u > -1.8 && u < 3.6, sC = Math.abs(v - (2.8 + (u + 0.8) * 0.85)) < 0.85 && u > -1 && u < 4.4;
          if (sA || sC) return ST[far ? 3 : sA ? 2 : 1]; // the stripes, crossing on the side
          if (u > 10 && v < 3.8) return up2[far ? 4 : 3]; // the toe bumper
          if (u > 0.5 && u < 6 && v > 5.2 && (Math.floor(x) % 2 === 0)) return MID[far ? 4 : 3]; // the laces
          return up2[far ? 3 : v > 5.4 ? 0 : u > 5 ? 1 : 1];
        }, g + 10);
      } else if (L.boots) { // boots, laced up the ankle
        const sr = ramp(L.shoe);
        poly(F, [[f[0] - 5 * fq, f[1] - 11 * fq], [f[0] + 3 * fq, f[1] - 11 * fq], [f[0] + 4 * fq, f[1] - 5 * fq], [f[0] + 11 * fq, f[1] - 2 * fq], [f[0] + 11 * fq, f[1] + 1 * fq], [f[0] - 5 * fq, f[1] + 1 * fq]], (x, y) => (y > f[1] - 0.6 * fq ? SO : (Math.floor(y) % 2 === 0 && x > f[0] + 1 * fq && x < f[0] + 3.5 * fq && y < f[1] - 4 * fq ? u32("#5a5a62") : sr[far ? 3 : x > f[0] + 3 * fq ? 1 : 2])), g + 10);
      } else {
        // the shoe, pointing forward, its sole
        const sr = ramp(L.shoe);
        poly(F, [[f[0] - 6 * fq, f[1] - 7 * fq], [f[0] + 4 * fq, f[1] - 7 * fq], [f[0] + 13 * fq, f[1] - 2 * fq], [f[0] + 13 * fq, f[1] + 1 * fq], [f[0] - 6 * fq, f[1] + 1 * fq]], (x, y) => (y > f[1] - 0.6 * fq ? SO : y < f[1] - 5.5 * fq && x < f[0] + 3 * fq ? sr[far ? 3 : 1] : sr[far ? 3 : x > f[0] + 4 * fq ? 1 : 2]), g + 10);
      }
    };
    // the torso: a V from the shoulders to the waist, then the hips; u across (-1 back .. 1 front), v down (0..1)
    const shape = (v) => {
      const w0 = wsh * (1 - 0.18 * tw), wc = (16.2 + br * 0.4) * B.chest * sc * (1 - 0.15 * tw), ww = 6.7 * B.waist * sc, wh = 8.4 * Math.max(1, B.waist * 0.92) * sc;
      if (v < 0.16) return w0 * (0.5 + 0.5 * Math.sqrt(v / 0.16)); // round shoulders
      if (v < 0.42) return lerp(w0, wc, (v - 0.16) / 0.26);
      if (v < 0.8) return lerp(wc, ww, (v - 0.42) / 0.38);
      return lerp(ww, wh, (v - 0.8) / 0.2);
    };
    const tloc = (x, y) => { const dx = x - neck[0], dy = y - neck[1], s = dx * ca + dy * sa, v = (dx * -sa + dy * ca) / (len || 1); const hw = shape(clamp(v, 0, 1)), cx = 1.5 * sc; return [(s - cx) / hw, v, hw]; };
    const torsoMat = (x, y) => {
      const [u, v] = tloc(x, y);
      let nx = u * 0.85, ny = v < 0.12 ? -0.75 : v < 0.4 ? -0.15 : 0.1;
      // the chest: the pecs, a shadow under them; the waistband at the bottom
      const pec = v > 0.34 && v < 0.39 && u > -0.4 ? 1 : 0;
      if (v > 0.9) return (L.legs === "skirt" ? ramp(L.skirt) : PA)[u < -0.3 ? 3 : 2];
      if (L.belt && v > 0.82 && v <= 0.9) { if (L.buckle && u > 0.42 && u < 0.62) return u32(L.buckle); if (L.topKind === "gi" && u > 0.5 && u < 0.62) return u32("#2a2a30"); return ramp(L.belt)[u < -0.3 ? 3 : 2]; }
      if (L.dogtags) { const cu = lerp(0.3, 0.55, clamp(v / 0.3, 0, 1)); if (v > 0.03 && v < 0.3 && Math.abs(u - cu) < 0.05 && (Math.floor(y) % 2 === 0)) return u32("#c9ccd4"); if (v >= 0.3 && v < 0.4 && u > 0.48 && u < 0.64) return u32(v < 0.33 ? "#f0f2f6" : "#9a9ca6"); }
      if (L.chain) { const cv = 0.1 + Math.abs(u - 0.55) * -0.06; if (u > 0.2 && u < 0.85 && Math.abs(v - (0.14 - Math.abs(u - 0.55) * 0.12)) < 0.022) return u32((Math.floor(x) % 2) ? L.chain : "#fff2b0"); }
      if (L.strap && Math.abs(u - lerp(-0.7, 0.9, clamp(v / 0.86, 0, 1))) < 0.14) return ramp(L.strap)[u < -0.3 ? 3 : (Math.floor(y) % 3 ? 1 : 2)]; // the tote bag's strap
      if (L.apron && u > -0.05 && v > 0.1) return ramp(L.apron)[u < 0.12 ? 3 : Math.min(4, toneOf(nx, ny) + (Math.floor(x * 1.3 + y) % 6 === 0 ? 1 : 0))];
      if (L.apron && v <= 0.1 && Math.abs(u - 0.25) < 0.08) return ramp(L.apron)[2]; // the neck strap
      const k = L.topKind;
      if (k === "plaid") { // a checked shirt: two sets of lines over the base
        const lx2 = Math.floor(x) % 5 === 0, ly2 = Math.floor(y) % 5 === 0, t2 = toneOf(nx, ny);
        if (v < 0.06 && u > 0.34 && u < 0.84) return tone(SK, nx, ny);
        return lx2 || ly2 ? ramp(L.plaid)[Math.min(4, t2 + (lx2 && ly2 ? 1 : 0))] : TOP[t2];
      }
      if (k === "vest") { // a padded vest over a light shirt
        if (v < 0.07 && u > 0.34 && u < 0.84) return tone(SK, nx, ny);
        if (u > 0.3 && u < 0.6 && v < 0.75) return ramp(L.sleeveCol)[Math.min(4, toneOf(nx * 0.4, ny))];
        return TOP[Math.min(4, toneOf(nx, ny) + (Math.floor(y) % 4 === 0 ? 1 : 0))];
      }
      if (k === "workshirt") { // a loose work shirt: the collar, the button placket, a chest pocket
        if (v < 0.06 && u > 0.3 && u < 0.86) return tone(SK, nx, ny);
        if (v < 0.13 && (Math.abs(u - 0.32) < 0.12 || Math.abs(u - 0.82) < 0.1)) return TOP[Math.min(4, toneOf(nx, ny) + 1)]; // the collar points
        if (Math.abs(u - 0.58) < 0.035) return (Math.floor(y) % 4 === 0) ? u32("#e8e4dc") : TOP[3]; // the placket, its buttons
        if (u > 0.68 && u < 0.92 && v > 0.17 && v < 0.33) return TOP[v < 0.2 ? 3 : Math.min(4, toneOf(nx, ny) + (Math.abs(v - 0.2) < 0.02 ? 1 : 0))]; // the pocket
        return TOP[Math.min(4, toneOf(nx, ny) + (v > 0.55 && Math.floor(x * 0.8 + y) % 7 === 0 ? 1 : 0))]; // loose folds
      }
      if (k === "bare") { // shirtless: the pecs, the line between them, the abs, the navel
        let t2 = toneOf(nx, ny);
        if (v > 0.33 && v < 0.38 && u > -0.4) t2++; // under the pecs
        if (Math.abs(u - 0.38) < 0.04 && v > 0.14 && v < 0.36) t2++; // between them
        if (v > 0.45 && v < 0.78 && u > -0.1 && u < 0.85 && ((Math.abs(u - 0.38) < 0.04) || (!L.lean && Math.round((v - 0.45) * 20) % 3 === 0 && u > 0.05))) t2++; // the abs (beta 3.31: on a lean build only the line down the middle)
        if (L.lean && Math.abs(u + 0.55 - v * 0.4) < 0.05 && v > 0.42 && v < 0.82) t2++; // and the side of the waist
        if (Math.abs(v - 0.8) < 0.025 && Math.abs(u - 0.4) < 0.06) t2 += 2; // the navel
        return SK[clamp(t2, 0, 4)];
      }
      if (k === "varsity") { // an open varsity jacket: the wool body, a white tee between, the letter, the striped hem
        if (u > 0.22 && u < 0.6) { if (v < 0.07 && u > 0.3) return tone(SK, nx, ny); return ramp(L.inner)[Math.min(4, toneOf(nx * 0.4, ny) + (v > 0.6 ? 1 : 0))]; }
        if (v > 0.74 && v < 0.84) return (Math.floor(y) % 2 ? ramp(L.sleeveCol) : TOP)[2]; // the striped knit hem
        if (v < 0.09 && u >= 0.6) return ramp(L.sleeveCol)[2]; // the collar's stripe
        if (u > 0.66 && u < 0.92 && v > 0.16 && v < 0.36) { const lu = (u - 0.66) / 0.26, lv = (v - 0.16) / 0.2; const S2 = [".###.", "#....", ".###.", "....#", "####."]; const r2 = S2[Math.min(4, Math.floor(lv * 5))], c2 = r2[Math.min(4, Math.floor(lu * 5))]; return c2 === "#" ? u32(L.letter) : TOP[1]; } // an S, for Steve
        return TOP[Math.min(4, toneOf(nx, ny))];
      }
      if (k === "gi") { // a wrap-over jacket: the chest showing in the V, the lapels, folds
        const lap = 0.12 + v * 0.95, lap2 = 0.98 - v * 0.6;
        if (v < 0.5 && u > lap && u < lap2) return tone(SK, nx, ny);
        if (v < 0.56 && (Math.abs(u - lap) < 0.09 || (Math.abs(u - lap2) < 0.07 && v < 0.5))) return TOP[Math.min(4, toneOf(nx, ny) + 1)];
        return TOP[Math.min(4, toneOf(nx, ny) + ((Math.floor(x - y * 0.5) % 7 === 0) ? 1 : 0))];
      }
      if (k === "muscle") { // sleeveless: deep arm holes, a crew neck, a small print
        if ((u < -0.5 && v < 0.34) || (u > 0.86 && v < 0.3) || (v < 0.07 && u > 0.3 && u < 0.82)) return tone(SK, nx, ny);
        if (v > 0.2 && v < 0.3 && u > 0.5 && u < 0.7 && hash2(x * 3, y * 7) > 0.5) return u32("#1c1c22");
        return TOP[Math.min(4, toneOf(nx, ny) + pec)];
      }
      if (k === "military") { // a fitted camo tee: a plain crew neck at the front, nothing open at the back
        if (v < 0.06 && u > 0.34 && u < 0.84) return tone(SK, nx, ny);
        const n = hash2(Math.floor(u * 6 + 7), Math.floor(v * 9)) + hash2(Math.floor(u * 3 + 3), Math.floor(v * 5 + 1)) * 0.8;
        const base = n > 1.25 ? "#56604a" : n < 0.55 ? "#2a3027" : L.top;
        return ramp(base)[Math.min(4, toneOf(nx, ny) + pec)];
      }
      if (k === "tank") {
        if ((u > 0.28 && u < 0.86 && v < 0.24 - (u - 0.28) * 0.05) || (v < 0.1 && u > -0.2)) return tone(SK, nx, ny); // the neckline and the open shoulders
        if (u < -0.6 && v < 0.3) return tone(SK, nx, ny);
        const t2 = toneOf(nx, ny) + pec; return TOP[Math.min(4, t2)];
      }
      if (k === "camo") {
        const n = hash2(Math.floor(u * 6 + 7), Math.floor(v * 9)) + hash2(Math.floor(u * 3 + 3), Math.floor(v * 5 + 1)) * 0.8;
        const base = n > 1.25 ? "#56604a" : n < 0.55 ? "#2a3027" : L.top;
        if (u > 0.36 && u < 0.62 && v < 0.2) return tone(SK, nx, ny); // the open collar
        return ramp(base)[Math.min(4, toneOf(nx, ny) + pec)];
      }
      if (k === "overshirt") {
        if (u > 0.2 && u < 0.62) { if (v < 0.08 && u > 0.3) return tone(SK, nx, ny); return ramp(L.inner)[Math.min(4, toneOf(nx * 0.4, ny) + (v > 0.6 ? 1 : 0))]; } // the white tee between the open sides
        const rib = (Math.floor(x) & 1) ? 1 : 0;
        if (u >= 0.62 && u < 0.72 && v < 0.6) return TOP[0]; // the open edge catching the light
        return TOP[Math.min(4, toneOf(nx, ny) + rib * (toneOf(nx, ny) < 3 ? 1 : 0))];
      }
      if (k === "fleece") {
        if (v < 0.07 && u > 0.2 && u < 0.85) return TOP[Math.min(4, toneOf(nx, ny) + 1)]; // the stand-up collar
        if (u > 0.52 && u < 0.6 && v < 0.85) return u32(v < 0.1 ? "#c9ccd4" : "#1a2440"); // the zip
        const fz = hash2(x * 7.3, y * 5.1); return TOP[clamp(toneOf(nx, ny) + (fz > 0.72 ? 1 : fz < 0.12 ? -1 : 0), 0, 4)];
      }
      if (k === "henley") {
        if (v < 0.11 && u > 0.36 && u < 0.78) return tone(SK, nx, ny);
        if (u > 0.55 && u < 0.62 && (Math.abs(v - 0.16) < 0.025 || Math.abs(v - 0.25) < 0.025)) return u32("#ece0c4");
      }
      if (k === "tee" || k === "printtee" || k === "oversize") {
        if (v < (k === "oversize" ? 0.08 : 0.1) && u > 0.36 && u < 0.8) return tone(SK, nx, ny);
        if (k === "printtee" && v > 0.2 && v < 0.32 && u > 0.5 && u < 0.72 && hash2(x * 3, y * 7) > 0.45) return u32("#1c1c22");
        if (k === "oversize" && v > 0.22 && v < 0.36 && u > 0.46 && u < 0.66 && ((Math.floor(x) + Math.floor(y)) % 3 === 0)) return u32("#1c1c22");
        if (L.stripe && v > 0.2 && v < 0.26 && u > 0.44 && u < 0.86) return u32(L.stripe);
        if (k === "oversize" && v > 0.55) return TOP[Math.min(4, toneOf(nx, ny) + ((Math.floor(y) % 5 === 0 && u > -0.6) ? 1 : 0))]; // the folds of a big tee
      }
      return TOP[Math.min(4, toneOf(nx, ny) + pec)];
    };
    // back arm, back leg, front leg, the body (and a skirt), the neck and head, the front arm
    arm(sB, T(p.eB), T(p.hB), true);
    leg(lB, T(p.kB), T(p.fB), true);
    leg(lF, T(p.kF), T(p.fF), false);
    const hw0 = shape(0), hw1 = shape(1);
    const tp = [];
    for (let i = 0; i <= 10; i++) { const v = i / 10, hw = shape(v); tp.push(off(neck, 1.5 * sc + hw, v * len)); }
    for (let i = 10; i >= 0; i--) { const v = i / 10, hw = shape(v); tp.push(off(neck, 1.5 * sc - hw, v * len)); }
    poly(F, tp, torsoMat, 5);
    if (L.legs === "skirt") { const SKR = ramp(L.skirt); poly(F, [off(hip, -hw1 - U, -3 * U), off(hip, hw1 + U, -3 * U), off(hip, hw1 + 6 * U, 15 * U), off(hip, -hw1 - 5 * U, 15 * U)], (x, y) => { const [u] = tloc(x, y); return SKR[u > 0.3 ? 2 : u > -0.4 ? 3 : 4]; }, 6); }
    if (L.apron) { const AR = ramp(L.apron); poly(F, [off(hip, -U, -2 * U), off(hip, hw1 + 2 * U, -2 * U), off(hip, hw1 + 4 * U, 20 * U), off(hip, U, 22 * U)], (x, y) => AR[x > hip[0] + hw1 * 0.5 ? 1 : 2], 6); }
    if (L.knot) { const kp = off(hip, hw1 * 0.75, -5 * U); blob(F, kp, 3.2 * U, 2.6 * U, (nx, ny) => TOP[toneOf(nx, ny)], 7); limb(F, [kp[0], kp[1] + U], [kp[0] + 1.5 * U, kp[1] + 6 * U], 1.6 * U, 1.2 * U, 0, 0.5, (nx, ny) => TOP[toneOf(nx, ny) + 1 > 4 ? 4 : toneOf(nx, ny) + 1], 7); }
    if (L.key) { const k = off(hip, hw1 * 0.6, 4 * U); blob(F, [k[0], k[1] + 6 * U], 1.6 * U, 3.2 * U, (nx, ny) => ramp("#ffd23a")[toneOf(nx, ny)], 7); blob(F, [k[0], k[1] + 1.5 * U], 1.2 * U, 1.4 * U, () => u32("#c9ccd4"), 7); }
    { // beta 3.12: the head's neck stands on the body's neck; the pose's head offset still tilts it a little
      const hid = (L.headId || id) + (p.cig === "mouth" && HEADSPEC[(L.headId || id) + "+cig"] ? "+cig" : "");
      // beta 3.33: the head at its own resolution (HK in the fight; the people around keep the small 1x head)
      const HD = headOf(hid, 1, false, view ? view.HK : L.hands ? (L.full ? HK : HK * 0.86) : HK), hx = (p.head[0] - p.neck[0] - 3 * sc) * 0.6, hy = (p.head[1] - p.neck[1] + 11 * sc) * 0.6, a2 = off(neck, 0.5 * U, U);
      if (p.lie) F.blit(HD.rows, HD.pal, a2[0], a2[1], 1, HD.at, 8); else { const bx2 = Math.round(a2[0] + hx), by2 = Math.round(a2[1] + hy); F.blit(HD.rows, HD.pal, bx2, by2, 0, HD.at, 8); if (HD.ember) ember = [bx2 + HD.ember[0] - HD.at[0], by2 + HD.ember[1] - HD.at[1]]; }
    }
    arm(sF, T(p.eF), T(p.hF), false);
    const hF = T(p.hF);
    if (p.cig === "hand" && L.smokes) { // beta 3.32 (Daniel: "the rest of the time he holds it in his hand"): between two fingers of the front hand, the lit end out in front
      const e0 = T(p.eF), vx = hF[0] - e0[0], vy = hF[1] - e0[1], vl = Math.hypot(vx, vy) || 1, ux = vx / vl, uy = vy / vl, fr2 = FIST * Math.min(1.12, B.sc * 1.1) * U, c0 = [hF[0] + ux * U, hF[1] + uy * U];
      let dx = ux * 0.35 + 0.9, dy = uy * 0.35 - 0.5; const dl = Math.hypot(dx, dy); dx /= dl; dy /= dl;
      let qx = -uy, qy = ux; if (qy < 0) { qx = -qx; qy = -qy; }
      const b0 = [c0[0] + qx * fr2 * 0.15, c0[1] + qy * fr2 * 0.15], pts = [];
      const nCig = Math.round(6 * U);
      for (let i = 0; i < 40 && pts.length < nCig; i++) { const px = Math.round(b0[0] + dx * i * 0.7), py = Math.round(b0[1] + dy * i * 0.7); if (Math.hypot(px + 0.5 - c0[0], py + 0.5 - c0[1]) < fr2 * 0.8) continue; if (pts.some(([a, b]) => a === px && b === py)) continue; pts.push([px, py]); }
      pts.forEach(([px, py], i) => { const c = u32(i === pts.length - 1 ? "#ff7a22" : i === pts.length - 2 ? "#8a8a94" : i < 2 ? "#d89a5a" : "#f6f4ee"); F.fill(px, py, px, py, () => true, () => c, 30); if (U > 1.5 && i < pts.length - 1) F.fill(px, py + 1, px, py + 1, () => true, () => u32(i < 2 ? "#a8683a" : "#cfcac0"), 30); }); // beta 3.33: two pixels thick, the filter, the paper in the light and in shade, the ash
      if (pts.length) ember = pts[pts.length - 1].slice();
    }
    const Q = (dx, dy) => [hF[0] + dx * U, hF[1] + dy * U]; // a point by the front hand, in old pixels
    if (prop === "camera") {
      poly(F, [Q(-5, -7), Q(8, -7), Q(8, 1), Q(-5, 1)], (x, y) => u32(y < hF[1] - 5 * U ? "#4a4a52" : y < hF[1] - 4.4 * U ? "#6a6a74" : "#26262c"), 20);
      blob(F, Q(8, -3), 2.8 * U, 2.8 * U, (nx, ny) => ramp("#3a8fe0")[toneOf(nx, ny)], 21);
    } else if (prop === "tote") {
      poly(F, [Q(-2, 2), Q(12, 4), Q(10, 22), Q(-6, 19)], (x, y) => ramp("#e8dcc0")[x > hF[0] + 5 * U ? 1 : (Math.floor(y / U) % 7 === 0 ? 3 : 2)], 20);
      poly(F, [Q(-1, 1), Q(4, 2), Q(3, 6), Q(-2, 5)], () => u32("#c9b896"), 21);
    } else if (prop === "cup") { // a takeaway cup
      poly(F, [Q(-2, -8), Q(4, -8), Q(3.5, -1), Q(-1.5, -1)], (x, y) => u32(y < hF[1] - 6.5 * U ? "#2a2a30" : x > hF[0] + 2 * U ? "#d8d4cc" : "#f4f2ec"), 20);
      poly(F, [Q(-1.6, -5.5), Q(3.6, -5.5), Q(3.4, -3.5), Q(-1.4, -3.5)], () => u32("#b07a46"), 21);
    } else if (prop === "key") {
      blob(F, Q(2, -7), 1.8 * U, 3.4 * U, (nx, ny) => ramp("#ffd23a")[toneOf(nx, ny)], 20);
    } else if (prop === "stack") {
      for (let i = 0; i < 6; i++) { const y0 = -3 - i * 3; poly(F, [Q(-12, y0), Q(8, y0), Q(8, y0 + 3), Q(-12, y0 + 3)], (x, y) => (Math.floor((y - hF[1]) / U) === -2 - i * 3 && x > hF[0] - 9 * U && x < hF[0] + 5 * U && (Math.floor((x - hF[0]) / U) % 3) ? u32("#1c1c22") : u32(i % 2 ? "#ffffff" : "#ecebe6")), 20 + i); }
    }
    const out = F.finish(!view);
    if (!view) { out.ax = OX - out.bx; out.ay = OY - out.by; } // the feet's point in the cropped frame
    if (ember) out.ember = ember;
    return out;
  }
  // every frame of a fighter, baked once
  // beta 3.33 (Daniel, finer pixels: four times the pixels, so four times the work): a frame is baked the first time it
  // is shown, and the rest are baked in the spare time of each frame (BAKEQ, a few milliseconds a frame) while the VS
  // screen and the round's intro play; the guard and the intro are baked at once
  const SPR = {}, BAKEQ = [];
  function sprites(id, alt) {
    const key = id + (alt ? ":alt" : "");
    if (SPR[key]) return SPR[key];
    const b0 = performance.now(), S = {}, smokes = !!LOOKS[id].smokes, jobs = [];
    // beta 3.32 (Daniel: Cristache smokes): the cigarette in the hand when he stands, walks, guards, crouches or jumps
    // (hidden in the fist when he hits, gone when he is hit); in the mouth in the win pose. idleM / walkM are the same
    // frames with it in the mouth, puff the hand brought up to the lips
    const CIG = (k) => (!smokes ? null : k === "win" ? "mouth" : ["idle", "walk", "crouch", "cblock", "block", "jump", "intro", "dizzy"].includes(k) ? "hand" : null);
    const withCig = (p, c) => (c ? Object.assign({}, p, { cig: c }) : p);
    const lazy = (k, list, make) => {
      const arr = [], cache = [];
      for (let i = 0; i < list.length; i++) { Object.defineProperty(arr, i, { enumerable: true, get() { if (!cache[i]) { const t0 = performance.now(); cache[i] = make(list[i]); stats.lazy += performance.now() - t0; } return cache[i]; } }); jobs.push([k, () => arr[i]]); }
      S[k] = arr;
    };
    const own = Object.assign({}, POSES, STYLE_POSES[id] || {});
    for (const [k, list] of Object.entries(own)) lazy(k, list, (p) => drawFighter(id, withCig(p, CIG(k)), k === "intro" && id === "ion" ? "stack" : null, alt));
    lazy("special", SPECIAL_POSES[id], (p) => drawFighter(id, p, SPECIAL_PROP[id] || null, alt));
    if (smokes) {
      lazy("idleM", own.idle, (p) => drawFighter(id, withCig(p, "mouth"), null, alt));
      lazy("walkM", own.walk, (p) => drawFighter(id, withCig(p, "mouth"), null, alt));
      lazy("puff", SMOKE_POSES[id] || [], (p) => drawFighter(id, withCig(p, "mouth"), null, alt));
    }
    const first = ["idle", "intro", "puff", "idleM"], order = ["walk", "block", "punch", "kick", "crouch", "hit", "jump", "special", "cpunch", "ckick", "jpunch", "jkick", "cblock", "fall", "down", "dizzy", "walkM", "win"];
    BAKEQ.unshift(...jobs.filter(([k]) => first.includes(k)).map(([, fn]) => fn)); // the guard and the intro first, then the rest
    for (const k of order) for (const [k2, fn] of jobs) if (k2 === k) BAKEQ.push(fn);
    for (const [k2, fn] of jobs) if (!first.includes(k2) && !order.includes(k2)) BAKEQ.push(fn);
    stats.spr[key] = Math.round(performance.now() - b0); // for the probe: how long setting a fighter up takes (its frames are queued)
    return (SPR[key] = S);
  }
  // the spare-time baker: frames (and other art queued) until the budget of this frame is spent
  function bakeIdle(budget) { const t0 = performance.now(); while (BAKEQ.length && performance.now() - t0 < budget) { const j = BAKEQ.shift(); if (j() === "again") BAKEQ.unshift(j); } } // a job that answers "again" goes on next time

  // ===================== 4. the stage: Two Minutes, Str. Constantin Aricescu 50A =====================
  // beta 3.16 (Daniel, from the street photo): the beige plaster house with the black shopfront and the white II' on
  // the door, the wooden step people sit on, the steel bin, the black bollard, the white wall with the green street
  // plate, the cream caravan parked in front, the green house-number plate, 50A. Daytime, soft clouds that drift on
  // their own parallax, the far blocks softened (drawn at half size, hazed: depth, kept pixel art)
  // a tiny 3x5 font for the signs on the stage (plates, the menu board)
  const T3 = { A: "010101111101101", B: "110101110101110", C: "011100100100011", D: "110101101101110", E: "111100110100111", F: "111100110100100", G: "011100101101011", H: "101101111101101", I: "111010010010111", K: "101101110101101", L: "100100100100111", M: "101111111101101", N: "110101101101101", O: "010101101101010", P: "110101110100100", R: "110101110101101", S: "011100010001110", T: "111010010010010", U: "101101101101111", V: "101101101101010", W: "101101111111101", Y: "101101010010010", Z: "111001010100111", 0: "111101101101111", 1: "010110010010111", 2: "110001010100111", 3: "110001010001110", 4: "101101111001001", 5: "111100110001110", 6: "011100111101111", 7: "111001010010010", 8: "111101111101111", 9: "111101111001110", ".": "000000000000010", " ": "000000000000000", "-": "000000111000000", "'": "010010000000000" };
  function tiny(ctx, s, x, y, col) { ctx.fillStyle = col; let cx = x; for (const ch of s) { const g2 = T3[ch] || T3[" "]; for (let i = 0; i < 15; i++) if (g2[i] === "1") ctx.fillRect(cx + (i % 3), y + Math.floor(i / 3), 1, 1); cx += 4; } }
  const tinyW = (s) => s.length * 4 - 1;
  let STAGE = null;
  const stageStep = () => { stage(); }; // beta 3.36: the 1x street is quick to build (one step)
  const SKY_TOP = "#9cc4e4", HAZE = "#c8dcea";
  function stage() {
    if (STAGE) return STAGE;
    const r = (() => { let s2 = 11; return () => ((s2 = (s2 * 16807) % 2147483647) / 2147483647); })();
    const dith = (ctx, x, y, w, h, c1, c2, f) => { for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) { ctx.fillStyle = ((xx + yy) & 1) && f ? c2 : c1; ctx.fillRect(x + xx, y + yy, 1, 1); } };
    // ---- the sky: a few bands, dithered where they meet
    // beta 3.33: the stage's layers are drawn at the canvas's pixels (RS times the game's units): the shapes through a
    // scaled context, the fine work (the dither, the plaster, the glass, the leaves) pixel by pixel at the full size
    const [sky, s] = mk(W * RS, H * RS);
    const BANDS = ["#8ab8de", "#96c0e2", "#a4c8e6", "#b2d0ea", "#c0d8ec", "#cfe0ee", "#dce8f0"];
    { const id = s.createImageData(W * RS, H * RS), d = new Uint32Array(id.data.buffer), B32 = BANDS.map(u32), yy0 = 150 * RS;
      for (let y = 0; y < H * RS; y++) { const t = (Math.min(y, yy0) / yy0) * (BANDS.length - 1), i = Math.min(BANDS.length - 1, Math.floor(t)), f = t - i; for (let x = 0; x < W * RS; x++) d[y * W * RS + x] = f > 0.5 && ((x + y) & 1) ? B32[Math.min(BANDS.length - 1, i + 1)] : B32[i]; }
      s.putImageData(id, 0, 0); }
    // ---- the clouds, on a strip that wraps
    const CL = ["#dfe7f0", "#d2dcea", "#ffffff", "#f6f8fb", "#eaf0f6"].map(u32), [clouds, c] = mk(768 * RS, 80 * RS), cid = c.createImageData(768 * RS, 80 * RS), cd = new Uint32Array(cid.data.buffer), CW2 = 768 * RS;
    const cloud = (cx0, cy0, w2) => {
      const puffs = []; for (let i = 0; i < 6; i++) puffs.push([cx0 - w2 / 2 + (i + 0.5) * (w2 / 6) + (r() - 0.5) * 6, cy0 - r() * 6 - (i > 1 && i < 4 ? 5 : 0), 6 + r() * 6]);
      for (let Y = Math.floor((cy0 - 26) * RS); Y <= (cy0 + 2) * RS; Y++) for (let X = Math.floor((cx0 - w2 / 2 - 14) * RS); X <= (cx0 + w2 / 2 + 14) * RS; X++) {
        const x = (X + 0.5) / RS, y = (Y + 0.5) / RS;
        let inside = false, top = 1e9; for (const [px, py, pr] of puffs) { const d = Math.hypot(x - px, (y - py) * 1.2); if (d <= pr) { inside = true; top = Math.min(top, (y - (py - pr / 1.2)) / pr); } }
        if (!inside || y > cy0 || Y < 0) continue;
        cd[Y * CW2 + (((X % CW2) + CW2) % CW2)] = CL[y > cy0 - 3 ? (((X + Y) & 1) ? 0 : 1) : top < 0.35 ? 2 : top < 0.9 ? 3 : ((X + Y) & 1) ? 4 : 3];
      }
    };
    for (const [x0, y0, w2] of [[60, 34, 70], [240, 22, 48], [400, 46, 90], [600, 28, 60], [720, 54, 40]]) cloud(x0, y0, w2);
    c.putImageData(cid, 0, 0);
    // ---- the far city: grey blocks, a pink one, trees; drawn at half size (soft), in the haze
    const FW = Math.ceil((W + (STAGE_W - W) * 0.4) / 2) + 2, FH = Math.ceil(H / 2), [far, f] = mk(FW * RS, FH * RS); f.scale(RS, RS);
    const block = (x0, w2, top, col, win) => { f.fillStyle = col; f.fillRect(x0, top, w2, 90 - top); f.fillStyle = win; for (let y = top + 3; y < 82; y += 5) for (let x = x0 + 2; x < x0 + w2 - 2; x += 4) if (r() < 0.75) f.fillRect(x, y, 2, 2); f.fillStyle = "#d6dde4"; f.fillRect(x0, top, w2, 1); };
    block(2, 26, 34, "#b8bfc8", "#9aa4b0"); block(34, 18, 46, "#c8b8b8", "#a89898"); block(58, 40, 12, "#c4c9d0", "#a3abb6"); block(104, 22, 40, "#b6bcc4", "#98a0ac"); block(132, 34, 26, "#c9cdd2", "#a8afb8"); block(170, 26, 44, "#c4b2ae", "#a8958f"); block(200, 30, 20, "#bfc5cc", "#a0a8b2");
    f.fillStyle = "#9fb69a"; for (let i = 0; i < 18; i++) { const tx = (i * 23) % FW, ty = 70 + (i % 3) * 3; f.beginPath(); f.arc(tx, ty, 5 + (i % 3), 0, Math.PI * 2); f.fill(); }
    { const FW2 = far.width, id2 = f.getImageData(0, 0, FW2, far.height), d2 = new Uint32Array(id2.data.buffer), hz = u32(HAZE); for (let y = 0; y < far.height; y++) for (let x = 0; x < FW2; x++) { const i = y * FW2 + x; if ((d2[i] >>> 24) && ((x + y) & 1) && (y > 20 * RS || (x & 2))) d2[i] = hz; } f.putImageData(id2, 0, 0); } // the haze, one pixel in two
    // ---- the street (it scrolls with the fight)
    const [mid, m] = mk(STAGE_W * RS, H * RS); m.scale(RS, RS);
    const yG = 176;
    // a small, cute neighbour on the left: yellow plaster, a tiled roof, a window with flowers
    { const x0 = 0, w2 = 46, top = 92; m.fillStyle = "#b8573c"; m.fillRect(x0, top - 10, w2 + 4, 10); m.fillStyle = "#9a4430"; for (let x = x0; x < x0 + w2 + 4; x += 4) m.fillRect(x, top - 10, 1, 10); m.fillStyle = "#e9cf8a"; m.fillRect(x0, top, w2, yG - top); dith(m, x0, top, w2, 3, "#e9cf8a", "#d8bd76", 1);
      m.fillStyle = "#5a3a26"; m.fillRect(x0 + 10, top + 14, 22, 26); m.fillStyle = "#a9c6d8"; m.fillRect(x0 + 12, top + 16, 8, 22); m.fillRect(x0 + 22, top + 16, 8, 22); m.fillStyle = "#d8e8f0"; m.fillRect(x0 + 12, top + 16, 3, 8);
      m.fillStyle = "#6b4a2e"; m.fillRect(x0 + 8, top + 40, 26, 4); for (let i = 0; i < 7; i++) { m.fillStyle = i % 2 ? "#e84a6a" : "#ffd23a"; m.fillRect(x0 + 9 + i * 3.5, top + 37 + (i % 2), 3, 3); m.fillStyle = "#4a8a3a"; m.fillRect(x0 + 10 + i * 3.5, top + 40, 2, 1); }
      m.fillStyle = "#4a3428"; m.fillRect(x0 + 14, yG - 30, 16, 30); m.fillStyle = "#6a4a36"; m.fillRect(x0 + 15, yG - 29, 14, 29); m.fillStyle = "#ffd23a"; m.fillRect(x0 + 26, yG - 16, 2, 2); }
    // the Two Minutes house: beige-pink plaster, two floors
    const hx = 46, hw = 200, ht = 22;
    m.fillStyle = "#dcc2ae"; m.fillRect(hx, ht, hw, yG - ht);
    for (let i = 0; i < 900; i++) { m.fillStyle = r() < 0.5 ? "#d2b6a2" : "#e6d0c0"; m.fillRect(hx + Math.floor(r() * hw), ht + Math.floor(r() * (yG - ht)), 1, 1); }
    m.fillStyle = "#c9ab96"; m.fillRect(hx, ht, hw, 2); m.fillRect(hx + hw - 3, ht, 3, yG - ht);
    // the upper windows: dark brown frames, the sky in the glass
    const win = (x0, y0, w2, h2) => { m.fillStyle = "#3e2418"; m.fillRect(x0, y0, w2, h2); m.fillStyle = "#9ab8cc"; m.fillRect(x0 + 2, y0 + 2, w2 - 4, h2 - 4); m.fillStyle = "#c6dbe8"; m.fillRect(x0 + 2, y0 + 2, Math.floor((w2 - 4) / 2), Math.floor((h2 - 4) / 3)); m.fillStyle = "#3e2418"; m.fillRect(x0 + Math.floor(w2 / 2) - 1, y0, 2, h2); m.fillRect(x0, y0 + Math.floor(h2 * 0.38), w2, 2); m.fillStyle = "#b89a86"; m.fillRect(x0 - 2, y0 + h2, w2 + 4, 2); };
    win(78, 32, 34, 46); win(150, 36, 26, 38);
    // the drainpipe, stickered, at the corner
    m.fillStyle = "#8a8e96"; m.fillRect(hx + hw - 6, 0, 3, yG); m.fillStyle = "#b6bac2"; m.fillRect(hx + hw - 6, 0, 1, yG);
    for (let y = 120; y < 170; y += 3) { m.fillStyle = ["#e84a6a", "#ffd23a", "#2fb8f0", "#ffffff", "#28c840"][(y / 3) % 5 | 0]; m.fillRect(hx + hw - 6, y, 3, 2); }
    // the awning bar over the shopfront, the name on it
    m.fillStyle = "#3c3d42"; m.fillRect(hx + 4, 88, 168, 11); m.fillStyle = "#56585e"; m.fillRect(hx + 4, 88, 168, 1); m.fillStyle = "rgba(40,24,20,.25)"; m.fillRect(hx + 6, 99, 164, 3);
    text(m, "TWO MINUTES", hx + 90, 90, "#f4f4f4", { ol: null, al: "c" });
    // the shopfront: a black frame; the door (the white II' on its glass, a curtain), the big window (shelves, the counter)
    const sx0 = hx + 14, sw = 152, sy0 = 102;
    m.fillStyle = "#121214"; m.fillRect(sx0, sy0, sw, yG - sy0);
    m.fillStyle = "#3a3f46"; m.fillRect(sx0 + 3, sy0 + 3, 38, yG - sy0 - 6);
    m.fillStyle = "#e9e6de"; m.fillRect(sx0 + 4, sy0 + 4, 12, yG - sy0 - 10); m.fillStyle = "#d4d0c6"; for (let y = sy0 + 4; y < yG - 6; y++) if (y % 3 === 0) m.fillRect(sx0 + 7 + ((y / 3) & 1), y, 1, 1); // the curtain
    m.fillStyle = "#f4f4f4"; m.fillRect(sx0 + 18, sy0 + 20, 4, 30); m.fillRect(sx0 + 25, sy0 + 20, 4, 30); m.fillRect(sx0 + 32, sy0 + 20, 3, 8); // II'
    m.fillStyle = "#9a9ca4"; m.fillRect(sx0 + 37, sy0 + 34, 1, 18); // the handle
    const wx0 = sx0 + 44, ww = sw - 47;
    m.fillStyle = "#5a4636"; m.fillRect(wx0, sy0 + 3, ww, yG - sy0 - 6); // the room inside, warm
    m.fillStyle = "#7a5a40"; for (const yy of [sy0 + 18, sy0 + 34]) m.fillRect(wx0 + 2, yy, ww - 4, 2); // shelves
    for (let i = 0; i < 14; i++) { const bx = wx0 + 4 + i * 7, yy = i < 7 ? sy0 + 11 : sy0 + 27; m.fillStyle = ["#e84a6a", "#28c840", "#2fb8f0", "#ffd23a", "#f4f2ea"][i % 5]; m.fillRect(bx, yy, 5, 7); m.fillStyle = "rgba(0,0,0,.25)"; m.fillRect(bx + 4, yy, 1, 7); }
    m.fillStyle = "#c9a878"; m.fillRect(wx0 + 2, yG - 24, ww - 4, 4); m.fillStyle = "#8a6a4a"; m.fillRect(wx0 + 2, yG - 20, ww - 4, 14); // the counter
    m.drawImage(marzocco(), MZ.x, MZ.y, MZ.w, MZ.h); // beta 3.33: the La Marzocco on the counter
    m.fillStyle = "rgba(255,255,255,.16)"; for (let i = 0; i < 3; i++) { m.beginPath(); m.moveTo(wx0 + 10 + i * 34, sy0 + 3); m.lineTo(wx0 + 22 + i * 34, sy0 + 3); m.lineTo(wx0 + i * 34 - 6, yG - 6); m.lineTo(wx0 + i * 34 - 18, yG - 6); m.fill(); } // reflections
    m.fillStyle = "#121214"; m.fillRect(wx0 + 50, sy0, 2, yG - sy0);
    // the wooden step along the shopfront, where people sit
    m.fillStyle = "#b98a55"; m.fillRect(sx0 + 40, yG - 8, 110, 4); m.fillStyle = "#8a6038"; m.fillRect(sx0 + 40, yG - 4, 110, 4); m.fillStyle = "#d4a870"; m.fillRect(sx0 + 40, yG - 8, 110, 1);
    // the house-number plate, green, by the door: 50A
    { const px2 = sx0 + sw + 6; m.fillStyle = "#f4f4f4"; m.fillRect(px2, 110, 17, 13); m.fillStyle = "#1e6b43"; m.fillRect(px2 + 1, 111, 15, 11); tiny(m, "50A", px2 + 3, 114, "#f4f4f4"); } // the house number, on a green Bucharest plate
    // the menu board on the wall by the door
    m.fillStyle = "#4a3428"; m.fillRect(hx - 1, 136, 17, 30); m.fillStyle = "#2b3130"; m.fillRect(hx, 137, 15, 28);
    // a tree's branches hanging over from the left, the leaves catching the light
    { // a tree's branches hanging in from the left, leaves in clusters, the light on top
      const twig = (x0, y0, x1, y1) => { for (let i = 0; i <= 40; i++) { const t2 = i / 40; m.fillStyle = "#5a4430"; m.fillRect(Math.round(lerp(x0, x1, t2)), Math.round(lerp(y0, y1, t2) + Math.sin(t2 * 3) * 3), 2, 1); } };
      twig(0, 18, 110, 52); twig(30, 30, 70, 72); twig(60, 38, 140, 70);
      for (const [cx2, cy2, n2] of [[20, 20, 24], [52, 30, 22], [84, 44, 26], [112, 54, 20], [66, 66, 16], [134, 66, 16], [36, 46, 14]]) for (let i = 0; i < n2; i++) { const a2 = r() * Math.PI * 2, d2 = r() * 10, lx = cx2 + Math.cos(a2) * d2, ly = cy2 + Math.sin(a2) * d2 * 0.7; m.fillStyle = OUT; m.fillRect(lx - 1, ly - 1, 5, 4); m.fillStyle = ly < cy2 ? "#7aa84a" : "#5e8a3c"; m.fillRect(lx, ly, 3, 2); m.fillStyle = "#a6cc6a"; if (ly < cy2 - 2) m.fillRect(lx, ly, 2, 1); }
    }
    // the white wall next door: rough plaster, the green enamel street plate, a box, a pipe
    const wx = hx + hw, wwid = 112;
    m.fillStyle = "#ecebe5"; m.fillRect(wx, 72, wwid, yG - 72); for (let i = 0; i < 700; i++) { m.fillStyle = r() < 0.5 ? "#dcdbd4" : "#f8f7f2"; m.fillRect(wx + Math.floor(r() * wwid), 72 + Math.floor(r() * (yG - 72)), 1, 1); }
    m.fillStyle = "#d6d4cc"; m.fillRect(wx, 72, wwid, 2); m.fillRect(wx, yG - 12, wwid, 12);
    m.fillStyle = "#f4f4f4"; m.fillRect(wx + 44, 110, 34, 15); m.fillStyle = "#1e6b5a"; m.fillRect(wx + 45, 111, 32, 13); tiny(m, "STR.C.", wx + 47, 112, "#f4f4f4"); tiny(m, "ARICESCU", wx + 46, 118, "#f4f4f4");
    m.fillStyle = "#c9ccd4"; m.fillRect(wx + 84, 132, 9, 12); m.fillStyle = "#9a9ca4"; m.fillRect(wx + 84, 143, 9, 1); m.fillStyle = "#1c1c20"; m.fillRect(wx + 88, 144, 2, 32);
    // the pavement, the kerb
    m.fillStyle = "#8c8a86"; m.fillRect(0, yG, STAGE_W, H - yG); m.fillStyle = "#a4a29e"; m.fillRect(0, yG, STAGE_W, 2);
    for (let y = yG + 4, row = 0; y < H; y += 6 + row, row++) { m.fillStyle = "#7a7874"; m.fillRect(0, y, STAGE_W, 1); const step = 18 + row * 4; for (let x = (row % 2) * (step / 2); x < STAGE_W; x += step) m.fillRect(Math.round(x), y - 5 - row, 1, 5 + row); }
    // the steel bin and the black bollard
    { const bx = sx0 + sw + 4; m.fillStyle = OUT; m.fillRect(bx - 1, 145, 16, yG - 145); m.fillStyle = "#b8bcc4"; m.fillRect(bx, 146, 14, yG - 147); m.fillStyle = "#e4e7ec"; m.fillRect(bx + 2, 148, 2, yG - 152); m.fillStyle = "#2a2a30"; m.fillRect(bx - 1, 143, 16, 4); }
    { const bx = wx + 26; m.fillStyle = OUT; m.fillRect(bx - 1, 141, 6, 36); m.fillStyle = "#26262c"; m.fillRect(bx, 142, 4, 34); m.fillStyle = "#4a4a52"; m.fillRect(bx, 142, 1, 34); m.fillRect(bx - 2, yG - 2, 8, 2); }
    // a pink suitcase with a jacket over it
    { const bx = wx + 52; m.fillStyle = OUT; m.fillRect(bx - 1, 148, 14, 28); m.fillStyle = "#e84a7a"; m.fillRect(bx, 149, 12, 26); m.fillStyle = "#f07a9a"; m.fillRect(bx + 2, 150, 2, 24); m.fillStyle = "#6a6a72"; m.fillRect(bx - 2, 140, 10, 14); m.fillStyle = "#2a2a30"; m.fillRect(bx + 4, 144, 2, 6); }
    // past the wall: a low house with a red roof, a tree
    { const x0 = wx + wwid - 4; m.fillStyle = "#3e6a34"; m.beginPath(); m.arc(x0 + 8, 104, 18, 0, Math.PI * 2); m.fill(); m.fillStyle = "#5e8a44"; m.beginPath(); m.arc(x0 + 4, 98, 10, 0, Math.PI * 2); m.fill();
      m.fillStyle = "#e2ddd2"; m.fillRect(x0 + 20, 118, 70, yG - 118); m.fillStyle = "#a8402e"; m.fillRect(x0 + 16, 112, 78, 7); m.fillStyle = "#c4553c"; m.fillRect(x0 + 16, 112, 78, 2);
      m.fillStyle = "#c98a3a"; m.fillRect(x0 + 34, 126, 16, 12); m.fillStyle = "#f2c47a"; m.fillRect(x0 + 35, 127, 14, 10); m.fillStyle = "#c98a3a"; m.fillRect(x0 + 41, 127, 1, 10);
      m.fillStyle = "#b8402e"; for (let x = x0 + 56; x < x0 + 90; x += 3) m.fillRect(x, 150, 2, 26); }
    // the cream caravan parked in front (a generic retro one, no name on it)
    { const cx0 = 430, cw = 136, cy0 = 112, cb = 166;
      m.fillStyle = OUT; m.beginPath(); m.moveTo(cx0 + 10, cy0 - 1); m.lineTo(cx0 + cw + 1, cy0 - 1); m.lineTo(cx0 + cw + 1, cb + 1); m.lineTo(cx0 - 1, cb + 1); m.lineTo(cx0 - 1, cy0 + 22); m.closePath(); m.fill();
      m.fillStyle = "#ece2c6"; m.beginPath(); m.moveTo(cx0 + 10, cy0); m.lineTo(cx0 + cw, cy0); m.lineTo(cx0 + cw, cb); m.lineTo(cx0, cb); m.lineTo(cx0, cy0 + 22); m.closePath(); m.fill();
      m.fillStyle = "#f8f2de"; m.fillRect(cx0 + 12, cy0 + 1, cw - 14, 3);
      m.fillStyle = "#b07a46"; m.fillRect(cx0, cy0 + 24, cw, 3); m.fillStyle = "#d89a5a"; m.fillRect(cx0, cy0 + 27, cw, 2); m.fillStyle = "#b07a46"; m.fillRect(cx0, cb - 10, cw, 2);
      m.fillStyle = "#3a3632"; m.fillRect(cx0 + 4, cy0 + 8, 40, 14); m.fillStyle = "#6a6660"; m.fillRect(cx0 + 6, cy0 + 9, 12, 4); // the front window
      m.fillStyle = "#3a3632"; m.fillRect(cx0 + 96, cy0 + 8, 26, 16); m.fillStyle = "#6a6660"; m.fillRect(cx0 + 98, cy0 + 9, 8, 4);
      m.fillStyle = "#d8ccb0"; m.fillRect(cx0 + 62, cy0 + 6, 20, cb - cy0 - 10); m.fillStyle = "#b8ac90"; m.fillRect(cx0 + 62, cy0 + 6, 1, cb - cy0 - 10); m.fillStyle = "#8a8070"; m.fillRect(cx0 + 78, cy0 + 30, 2, 4); // the door
      m.fillStyle = "#c8beb0"; m.fillRect(cx0 + 20, cy0 - 4, 40, 4); // the roof vent
      m.fillStyle = OUT; m.beginPath(); m.arc(cx0 + 92, cb + 2, 9, 0, Math.PI * 2); m.fill(); m.fillStyle = "#4a4a50"; m.beginPath(); m.arc(cx0 + 92, cb + 2, 4, 0, Math.PI * 2); m.fill(); // the wheel
      m.fillStyle = "#a8acb4"; m.fillRect(cx0 - 26, cb - 2, 28, 2); m.fillRect(cx0 - 26, cb - 2, 2, 8); m.fillStyle = OUT; m.fillRect(cx0 - 28, cb + 5, 6, 4); } // the drawbar, the jockey wheel
    // ---- the people around: drawn like the fighters (same puppet), smaller, with a little idle loop each
    const bake = (id, n) => ({ frames: n.poses.map((p) => drawFighter(id, p, n.prop || null)), cheer: n.cheer ? drawFighter(id, n.cheer, n.prop || null) : null });
    const npc = NPCS.map((n) => ({ n, own: bake(n.id, n), alt: bake(n.alt, n) }));
    STAGE = { sky, clouds, far, mid, npc, FW, FH };
    return STAGE;
  }
  // the backdrop, layer by layer: the sky (still), the clouds (drifting, slow), the far city (soft), the street
  function drawBackdrop(ctx, camX, t, sy = 0, cups = true) {
    const S = stage();
    const q = (v) => Math.round(v * RS) / RS; // to the canvas's pixel
    ctx.drawImage(S.sky, 0, 0, W, H);
    const cxo = q((camX * 0.15 + t * 3) % 768); ctx.drawImage(S.clouds, -cxo, sy, 768, 80); ctx.drawImage(S.clouds, 768 - cxo, sy, 768, 80);
    ctx.drawImage(S.far, -q(camX * 0.4), 40 + sy, S.FW * 2, S.FH * 2);
    ctx.drawImage(S.mid, -q(camX), sy, STAGE_W, H);
    if (cups) drawCups(ctx, MZ.x - q(camX), MZ.y + sy, t, false); // the cups on the machine (the ending rattles its own)
  }
  // beta 3.31 (Daniel: "park a purple road bike in front of Two Minutes"): a road bike (drop bars, thin wheels) standing
  // on the pavement against the step, under the shop window. Drawn pixel by pixel, outlined like the props; it moves
  // with the street (the facade's own layer) and stands in front of the people inside, behind the fighters
  const BIKE_X = 150, BIKE_Y = 142;
  let BIKE = null;
  function bikeImg() {
    if (BIKE) return BIKE;
    const [c, x] = mk(66, 41), px = (a, b, col) => { x.fillStyle = col; x.fillRect(Math.round(a), Math.round(b), 1, 1); };
    const line = (x0, y0, x1, y1, col, w = 1, o = 0) => { const n = Math.ceil(Math.max(Math.abs(x1 - x0), Math.abs(y1 - y0))) * 2 || 1; x.fillStyle = col; for (let i = 0; i <= n; i++) { const t2 = i / n; x.fillRect(Math.round(lerp(x0, x1, t2)) + o, Math.round(lerp(y0, y1, t2)) + o, w, w); } };
    const PU = ["#c08ef0", "#9a5ee0", "#7c42c4", "#5a2c94", "#3e1d6a"], TY = "#1e1c24", SIL = "#c9ccd4", SIL2 = "#8a8e98";
    const R = [13, 28], FW = [52, 28], BB = [30, 29], ST = [25, 12], HT = [46, 12], HB = [48, 19];
    // the wheels: an outline, the tyre, the silver rim, thin spokes, the hub
    for (const [cx, cy] of [R, FW]) {
      for (let yy = -13; yy <= 13; yy++) for (let xx = -13; xx <= 13; xx++) { const d = Math.hypot(xx + 0.5 - 0.5, yy + 0.5 - 0.5); if (d > 12.2) continue; if (d > 11.2) px(cx + xx, cy + yy, OUT); else if (d > 10) px(cx + xx, cy + yy, yy < -8 && xx < 2 && xx > -6 ? "#4a4852" : TY); else if (d > 9.1) px(cx + xx, cy + yy, yy < 0 ? SIL : SIL2); else if (d > 8.4) px(cx + xx, cy + yy, "#2a2830"); }
      for (let i = 0; i < 8; i++) { const an = (i / 8) * Math.PI * 2 + 0.2; for (let r2 = 2; r2 < 8.6; r2 += 1.4) px(cx + Math.cos(an) * r2, cy + Math.sin(an) * r2, "#a4a8b2"); }
      x.fillStyle = OUT; x.fillRect(cx - 1, cy - 1, 3, 3); x.fillStyle = SIL; x.fillRect(cx, cy, 1, 1);
    }
    // the frame: every tube an outline first, then the purple, a lit line along its top
    const tubes = [[BB, R], [ST, R], [BB, ST], [[25.5, 13], HT], [BB, [47, 17]], [HT, HB], [HB, FW]];
    for (const [a, b] of tubes) line(a[0], a[1], b[0], b[1], OUT, 4, -1);
    line(46, 11, 50, 10, OUT, 4, -1); line(50, 10, 54, 10, OUT, 3, -1); line(54, 10, 55, 14, OUT, 3, -1); line(55, 14, 51, 16, OUT, 3, -1); // the stem, the drop bar
    line(24, 12, 23, 9, OUT, 3, -1); line(18, 8, 28, 8, OUT, 4, -1); // the seat post, the saddle
    tubes.forEach(([a, b], i) => { line(a[0], a[1], b[0], b[1], i < 2 ? PU[3] : PU[2], 2); if (i >= 2) line(a[0], a[1], b[0], b[1], PU[1], 1); });
    line(25.5, 13, 46, 12, PU[0], 1); // the top tube catching the light
    line(46, 11, 50, 10, "#2a2a32", 2); line(50, 10, 54, 10, "#2a2a32", 2); line(54, 10, 55, 14, "#2a2a32", 2); line(55, 14, 51, 16, "#2a2a32", 2); px(54, 10, "#4a4a56"); // the bar tape, black
    line(24, 12, 23, 9, SIL, 1); line(18, 8, 28, 8, "#24222a", 2); px(27, 8, "#4a4854"); // the saddle
    // the chainring, the crank, the pedal, the chain to the back
    for (let yy = -4; yy <= 4; yy++) for (let xx = -4; xx <= 4; xx++) { const d = Math.hypot(xx, yy); if (d <= 4.3) px(BB[0] + xx, BB[1] + yy, d > 3.3 ? OUT : d > 2.2 ? SIL2 : SIL); }
    line(BB[0], BB[1] + 4, R[0] + 1, R[1] + 2, "#4a4a52", 1); line(BB[0] - 1, BB[1] - 4, R[0] + 1, R[1] - 2, "#4a4a52", 1);
    line(BB[0], BB[1], BB[0] + 3, BB[1] + 6, OUT, 3, -1); line(BB[0], BB[1], BB[0] + 3, BB[1] + 6, SIL2, 1); x.fillStyle = OUT; x.fillRect(BB[0] + 1, BB[1] + 6, 5, 3); x.fillStyle = "#3a3a42"; x.fillRect(BB[0] + 2, BB[1] + 7, 3, 1);
    return (BIKE = c);
  }
  function drawBike(ctx, camX, sy = 0) {
    const bx = BIKE_X - Math.round(camX * RS) / RS, by = BIKE_Y + sy; if (bx < -70 || bx > W) return;
    ctx.fillStyle = "rgba(20,14,30,.28)"; ctx.fillRect(bx + 3, by + 39, 62, 2); ctx.fillRect(bx + 8, by + 38, 52, 1); // its shadow on the pavement
    ctx.drawImage(bikeImg(), bx, by, 66, 41);
  }
  // the bystanders: someone on the step with a cup, two people chatting by the caravan, the barista inside
  function drawCrowd(ctx, camX, t, cheer) {
    const S = stage();
    for (let i = 0; i < S.npc.length; i++) {
      const { n } = S.npc[i], busy = g && g.f && g.f.some((f) => f.id === NPC_LOOKS[n.id].headId), { frames, cheer: ch } = busy ? S.npc[i].alt : S.npc[i].own;
      const x = Math.round(n.x - camX), img = cheer && ch ? ch : frames[Math.floor(t * n.rate + i) % frames.length];
      if (x < -60 || x > W + 60) continue;
      if (n.clip) { ctx.save(); ctx.beginPath(); ctx.rect(n.clip[0] - camX, n.clip[1], n.clip[2], n.clip[3]); ctx.clip(); }
      hiDraw(ctx, img, n.x - camX, n.y + (cheer && !ch ? -Math.round(Math.abs(Math.sin(t * 9 + i)) * 4) / RS : 0), n.face, img.ax, img.ay);
      if (n.clip) ctx.restore();
    }
    drawBike(ctx, camX); // beta 3.31: the bike stands outside the window, in front of the barista
  }

  // ===================== 5. the roster =====================
  const ROSTER = {
    daniel: { id: "daniel", name: "DANIEL", role: "FOUNDER - CREATIVE ARCHITECT", special: "COLOR WAVE", line: "PAINTS THE ROOM IN ONE MOVE", speed: 1, power: 1 },
    cristian: { id: "cristian", name: "CRISTIAN", role: "PARTNER - CEO", special: "DEADLINE DASH", line: "ALWAYS ONE STEP AHEAD", speed: 1.08, power: 0.95 },
    ion: { id: "ion", name: "I O N", role: "FOUNDER OF TWO MINUTES", special: "ESPRESSO SHOT", line: "TWO MINUTES IS ALL HE NEEDS", speed: 1, power: 1 },
    // beta 3.11 (Daniel): the guests (Iulica is on the crew page too)
    cristache: { id: "cristache", name: "CRISTACHE", role: "SPECIAL GUEST", special: "HIGH FIVE", line: "ALWAYS REACHING HIGHER", speed: 1.1, power: 1 }, // beta 3.31: a touch quicker now he is smaller (less reach)
    steve: { id: "steve", name: "STEVE", role: "SPECIAL GUEST - OVER TWO METRES", special: "BEAR HUG", line: "TWO METRES OF GOOD VIBES", speed: 0.86, power: 1.15 },
    rares: { id: "rares", name: "RARE\u0218", role: "SPECIAL GUEST", special: "KEY BOOMERANG", line: "NEVER LOSES HIS KEYS", speed: 1, power: 1 },
    dony: { id: "dony", name: "DONY", role: "ROASTS THE COFFEE", special: "BEAN BARRAGE", line: "SMALL, QUICK, FRESHLY ROASTED", speed: 1.12, power: 0.92 },
    iulica: { id: "iulica", name: "IULIC\u0102", role: "CREW", special: "TOTE SWING", line: "BRINGS THE ENERGY INTO THE FRAME", speed: 1.02, power: 1.02 },
    maria: { id: "maria", name: "MARIA", role: "SPECIAL GUEST", special: "CURL CYCLONE", line: "SPINS FIRST, ASKS LATER", speed: 1.1, power: 0.92 }
  };
  // the select grid: a small config. Both sides pick from it (Player 1, then the CPU); "random" is the "?" tile.
  // I O N stays the CPU's first choice
  const GRID = { cols: 5, rows: 2, order: ["ion", "cristache", "rares", "iulica", "maria", "steve", "dony", "cristian", "daniel", "random"] }; // beta 3.12 (Daniel): I O N first, the "?" back
  const FIGHTERS = GRID.order.filter((id) => id !== "random");
  const pickRandom = () => FIGHTERS[Math.floor(Math.random() * FIGHTERS.length)];

  // ===================== 6. screens: title, select, VS, the HUD =====================
  const BG_DARK = "#140f22";
  function stripes(ctx, t, c1, c2) {
    ctx.fillStyle = c1; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = c2; const o = Math.floor(t * 20) % 24;
    for (let x = -H; x < W + 24; x += 24) { ctx.beginPath(); ctx.moveTo(x + o, 0); ctx.lineTo(x + o + 10, 0); ctx.lineTo(x + o + 10 + H, H); ctx.lineTo(x + o + H, H); ctx.fill(); }
  }
  // a boxing glove icon, 2x pixels
  const GLOVE_ICON = ["...oooooo...", "..oyyyyyyo..", ".oyywwyyyyo.", "oyywyyyyyyyo", "oyyyyyyyyyyo", "oyyyyyyyyyyo", "ooyyyyyyyyyo", "oyoyyyyyyyo.", "oyyoyyyyyyo.", ".oyyyyyyyo..", "..owwwwwwo..", "..owwwwwwo..", "..oooooooo.."];
  function gloveIcon(ctx, x, y, col, flip, sc = 2) {
    const pal = { o: OUT, y: col, w: "#ffffff" };
    for (let r = 0; r < GLOVE_ICON.length; r++) for (let q = 0; q < 12; q++) { const ch = GLOVE_ICON[r][flip ? 11 - q : q]; if (ch === ".") continue; ctx.fillStyle = pal[ch]; ctx.fillRect(x + q * sc, y + r * sc, sc, sc); }
  }
  // beta 3.30 (Daniel): the splash, in the spirit of the 90s title screens (all original): the logo in chrome and
  // gold, slanted, cut with a thick outline and a red glow; the whole roster posing under it; PRESS START
  const METAL = ["#ffffff", "#f0f4fa", "#c8d4e4", "#8a9ab4", "#4a5672", "#f6d27a", "#ffc21a", "#f29a14", "#d9600f"];
  const FIRE = ["#fff2c0", "#ffd23a", "#ffa21a", "#ff6a1a", "#e8301c", "#b81c14", "#7a0f0b"];
  const LOGO = new Map();
  function logoText(s2, sc, grad, glow) {
    const key = s2 + sc + grad[0] + glow; if (LOGO.has(key)) return LOGO.get(key);
    const t0 = textImg(s2, grad, { sc, sp: 1, ol: null }), shear = Math.ceil(t0.h * 0.28), pad = 5;
    const [c, x] = mk(t0.w + shear + pad * 2, t0.h + pad * 2);
    for (let y = 0; y < t0.h; y++) x.drawImage(t0.c, 0, y, t0.w, 1, pad + Math.round((t0.h - y) * 0.28), pad + y, t0.w, 1); // slanted
    const id = x.getImageData(0, 0, c.width, c.height), d = new Uint32Array(id.data.buffer), w = c.width, h = c.height, src = d.slice();
    const on = (i) => (src[i] >>> 24) > 0, hi = u32("#ffffff"), oc = u32(OUT), gc = u32(glow);
    for (let y = 1; y < h - 1; y++) for (let q = 1; q < w - 1; q++) { const i = y * w + q; if (on(i) && !on(i - w)) d[i] = hi; } // a bright top edge on every stroke
    for (let pass = 0; pass < 2; pass++) { const s3 = d.slice(); for (let y = 1; y < h - 1; y++) for (let q = 1; q < w - 1; q++) { const i = y * w + q; if ((s3[i] >>> 24) > 0) continue; if ([i - 1, i + 1, i - w, i + w, i - w - 1, i + w + 1].some((j) => (s3[j] >>> 24) > 0)) d[i] = pass === 0 ? oc : gc; } } // the thick outline, then the glow
    x.putImageData(id, 0, 0);
    const r = { c, w, h }; LOGO.set(key, r); return r;
  }
  // beta 3.33 (Daniel: "a much more commercial splash, the characters posed much cooler, better finished"): the key
  // art, one still picture: Two Minutes at dusk (the street's own drawing, graded, the windows lit), light rays and a
  // burst of speed lines behind I O N, front and centre, a size up, the crew around him in two rows (the back one
  // smaller, in the dusk's shade), every figure rimmed with the light of the shop on one side and the sky on the
  // other; the logo over them; the lines that say what this is. Only PRESS START blinks. It is built in layers in the
  // spare time of the first frames (the sky and the logo at once, the street and the people as they are ready)
  const RO = (() => { try { if (window.parent !== window && /^\/ro(\/|$)/.test(window.parent.location.pathname)) return true; } catch {} try { return /^\/ro(\/|$)/.test(new URL(document.referrer).pathname) || new URLSearchParams(location.search).get("lang") === "ro"; } catch { return false; } })();
  const COPY = RO ? { where: "TWO MINUTES · STR. C. ARICESCU 50A", what: "CAFEA. BATCH BREW. PUMNI.", site: "PE CROMATICSTUDIOS.COM", cta: "PROVOACĂ-L PE I O N LA LUPTĂ", start: "APĂSĂ START", tap: "ATINGE PENTRU START" }
    : { where: "TWO MINUTES · STR. C. ARICESCU 50A", what: "COFFEE. BATCH BREW. FISTS.", site: "ON CROMATICSTUDIOS.COM", cta: "CHALLENGE I O N TO A FIGHT", start: "PRESS START", tap: "TAP TO START" };
  const KEY_POSES = {
    ion: pose({ hip: [0, -48], neck: [4, -77], head: [7, -88], eF: [17, -62], hF: [-1, -67], eB: [-8, -61], hB: [10, -70], kF: [12, -25], fF: [20, 0], kB: [-11, -24], fB: [-21, 0], tw: 0.8 }), // arms crossed, feet planted
    steve: pose({ hip: [0, -47], neck: [2, -75], head: [5, -86], eF: [16, -64], hF: [26, -76], eB: [8, -62], hB: [18, -72], kF: [8, -25], fF: [12, 0], kB: [-8, -24], fB: [-14, 0] }),
    cristache: Object.assign(pose({ hip: [0, -47], neck: [4, -75], head: [7, -86], eB: [-6, -90], hB: [-3, -106], eF: [13, -58], hF: [22, -54] }), { cig: "mouth" }),
    rares: pose({ hip: [0, -46], neck: [6, -74], head: [9, -85], eF: [18, -66], hF: [24, -80], eB: [8, -64], hB: [16, -76], kF: [12, -24], fF: [18, 0], kB: [-9, -23], fB: [-17, 0] }),
    daniel: pose({ eF: [18, -88], hF: [26, -104], eB: [-6, -58], hB: [6, -54] }),
    maria: pose({ hip: [0, -52], neck: [0, -79], head: [3, -90], eF: [18, -72], hF: [30, -76], eB: [-14, -70], hB: [-26, -74], kF: [22, -54], fF: [46, -56], kB: [-4, -26], fB: [-4, 0] }),
    dony: pose({ hip: [0, -47], neck: [5, -75], head: [8, -86], eF: [20, -64], hF: [30, -74], eB: [4, -62], hB: [14, -70], tw: 0.6 }),
    cristian: pose({ hip: [-2, -47], neck: [1, -75], head: [4, -86], eF: [15, -68], hF: [16, -84], eB: [11, -66], hB: [21, -79] }),
    iulica: pose({ eF: [18, -86], hF: [28, -102], eB: [-10, -86], hB: [-18, -102], tw: 0.7 })
  };
  // [id, x, feet y (game units), face, size, row (0 back, 1 middle, 2 front)]
  const KEY_CAST = [["steve", 70, 176, 1, 0.9, 0], ["cristian", 318, 175, -1, 0.88, 0], ["iulica", 268, 172, -1, 0.84, 0], ["daniel", 118, 172, 1, 0.84, 0],
    ["cristache", 146, 192, 1, 1, 1], ["maria", 250, 194, -1, 1, 1], ["dony", 330, 198, -1, 1, 1], ["rares", 40, 198, 1, 1, 1], ["ion", 192, 214, 1, 1.3, 2]];
  // a rim of light: the figure's own edge (just inside its outline) lit on the side that faces a light
  function rimLight(c, colL, colR, kL = 0.6, kR = 0.55) {
    const x = c.getContext("2d"), w = c.width, h = c.height, id = x.getImageData(0, 0, w, h), d = new Uint32Array(id.data.buffer), src = d.slice(), on = (i) => (src[i] >>> 24) > 0;
    const L = rgbOf(colL), Rr = rgbOf(colR), mixc = (v, cc, k) => { const r0 = v & 255, g0 = (v >> 8) & 255, b0 = (v >> 16) & 255; return (0xff000000 | (Math.round(b0 + (cc[2] - b0) * k) << 16) | (Math.round(g0 + (cc[1] - g0) * k) << 8) | Math.round(r0 + (cc[0] - r0) * k)) >>> 0; };
    for (let y = 2; y < h - 2; y++) for (let q = 2; q < w - 2; q++) { const i = y * w + q; if (!on(i)) continue;
      if (!on(i - 2) && on(i - 1) || !on(i - 2 * w) && on(i - w) && !on(i - w - 2)) d[i] = mixc(src[i], L, kL); else if (!on(i + 2) && on(i + 1)) d[i] = mixc(src[i], Rr, kR); }
    x.putImageData(id, 0, 0); return c;
  }
  const grade = (c, col, k) => { const x = c.getContext("2d"); x.save(); x.globalCompositeOperation = "source-atop"; x.globalAlpha = k; x.fillStyle = col; x.fillRect(0, 0, c.width, c.height); x.restore(); return c; };
  let SPLASH = null;
  function splashArt() {
    if (SPLASH) return SPLASH;
    const WD = W * RS, HD = H * RS, layers = [];
    SPLASH = { layers, done: false };
    // 1. the dusk sky, dithered bands from violet to a burning horizon; the rays turning behind the logo
    { const [c, x] = mk(WD, HD), id = x.createImageData(WD, HD), d = new Uint32Array(id.data.buffer), SK = ["#120c2c", "#1d1240", "#2e1650", "#4a1c5c", "#6e2458", "#9c3450", "#c8503e", "#ec7a36", "#f8a848"].map(u32);
      for (let y = 0; y < HD; y++) { const t = Math.min(1, y / (HD * 0.72)) * (SK.length - 1), i = Math.floor(t), f = t - i; for (let q = 0; q < WD; q++) d[y * WD + q] = SK[Math.min(SK.length - 1, f > 0.5 && ((q + y) & 1) ? i + 1 : i)]; }
      x.putImageData(id, 0, 0);
      x.save(); x.globalCompositeOperation = "lighter"; for (let i = 0; i < 18; i++) { const a0 = (i / 18) * Math.PI * 2 + 0.1, a1 = a0 + 0.09; x.fillStyle = i % 2 ? "rgba(255,170,90,.10)" : "rgba(255,120,160,.07)"; x.beginPath(); x.moveTo(WD / 2, HD * 0.62); x.lineTo(WD / 2 + Math.cos(a0) * 900, HD * 0.62 + Math.sin(a0) * 900); x.lineTo(WD / 2 + Math.cos(a1) * 900, HD * 0.62 + Math.sin(a1) * 900); x.fill(); } x.restore();
      layers.push(c); }
    // 2. the logo (cheap: it is there from the first frame)
    const logo = () => { const [c, x] = mk(WD, HD); const l1 = logoText("AT THE GLOVES", 3 * RS, METAL, "#d8342a"), l2 = logoText("I O N", 5 * RS, FIRE, "#fed012"); // beta 3.36: the 3.32 sizes at 1x
      x.drawImage(l1.c, Math.round(WD / 2 - l1.w / 2), RS); x.setTransform(RS, 0, 0, RS, 0, 0); text(x, RO ? "CU" : "WITH", W / 2, 35, "#ffffff", { sc: 1, al: "c", sh: 1 }); x.setTransform(1, 0, 0, 1, 0, 0); x.drawImage(l2.c, Math.round(WD / 2 - l2.w / 2), 44 * RS); return c; };
    const steps = [];
    // 3. Two Minutes at dusk: the street's drawing, in the dusk's colour, its windows lit warm
    steps.push(() => stageStep()); // the street first, a step at a time (beta 3.34)
    steps.push(() => { const S = stage(), [c, x] = mk(WD, HD), cam = 22; x.drawImage(S.far, 0, 0, S.far.width, S.far.height, -Math.round(cam * 0.4 * RS), 40 * RS, S.FW * 2 * RS, S.FH * 2 * RS); x.drawImage(S.mid, cam * RS, 0, WD, HD, 0, 0, WD, HD);
      grade(c, "#2a1a5a", 0.58); x.save(); x.globalCompositeOperation = "lighter"; x.fillStyle = "rgba(255,150,60,.42)";
      for (const [x0, y0, w0, h0] of [[78, 32, 34, 46], [150, 36, 26, 38], [104, 105, 105, 65], [63, 105, 38, 68]]) x.fillRect((x0 - cam) * RS, y0 * RS, w0 * RS, h0 * RS);
      x.fillStyle = "rgba(255,220,150,.22)"; x.fillRect((50 - cam) * RS, 88 * RS, 168 * RS, 11 * RS); x.restore();
      const gr = x.createLinearGradient(0, HD * 0.55, 0, HD); gr.addColorStop(0, "rgba(255,140,60,0)"); gr.addColorStop(1, "rgba(255,140,60,.18)"); x.fillStyle = gr; x.fillRect(0, 0, WD, HD);
      layers.splice(1, 0, c); });
    // 4. the burst of speed lines behind I O N
    steps.push(() => { const [c, x] = mk(WD, HD), cx = 192 * RS, cy = 128 * RS; let s2 = 7;
      const hal = x.createRadialGradient(cx, cy, 5 * RS, cx, cy, 95 * RS); hal.addColorStop(0, "rgba(255,214,120,.55)"); hal.addColorStop(0.5, "rgba(255,150,80,.2)"); hal.addColorStop(1, "rgba(255,120,80,0)"); x.fillStyle = hal; x.fillRect(0, 0, WD, HD); /* the light behind him */ const r = () => ((s2 = (s2 * 16807) % 2147483647) / 2147483647);
      for (let i = 0; i < 90; i++) { const an = r() * Math.PI * 2, r0 = (35 + r() * 30) * RS, r1 = r0 + (30 + r() * 110) * RS; x.strokeStyle = i % 3 ? "rgba(255,240,200,.5)" : "rgba(255,210,58,.7)"; x.lineWidth = 1 + (i % 4 === 0 ? 1 : 0); x.beginPath(); x.moveTo(Math.round(cx + Math.cos(an) * r0) + 0.5, Math.round(cy + Math.sin(an) * r0 * 0.8) + 0.5); x.lineTo(Math.round(cx + Math.cos(an) * r1) + 0.5, Math.round(cy + Math.sin(an) * r1 * 0.8) + 0.5); x.stroke(); }
      layers.push(c); });
    // 5. the people, back row first; each rimmed (the shop's warm light from the left, the sky's from the right)
    const cast = KEY_CAST.slice().sort((a, b) => a[5] - b[5]);
    for (const [id, gx, gy, face, size, row] of cast) steps.push(() => {
      const f0 = drawFighter(id, KEY_POSES[id], id === "ion" ? null : null, null, { K: size, HK: HK * size * (row === 2 ? 1.08 : 1), w: Math.round(CW * size), h: Math.round(CH * size), ox: Math.round(OX * size), oy: Math.round(OY * size) });
      const f = rimLight(f0, row === 2 ? "#ffd27a" : "#ffb070", row === 2 ? "#9fe4ff" : "#c0a0ff", row === 2 ? 0.7 : 0.5, row === 2 ? 0.6 : 0.45);
      if (row === 0) grade(f, "#2a1a5a", 0.42); else if (row === 1) grade(f, "#2a1a5a", 0.16);
      const [c, x] = mk(WD, HD); x.save(); x.translate(Math.round(gx * RS), Math.round(gy * RS)); if (face < 0) x.scale(-1, 1); x.drawImage(f, -Math.round(OX * size), -Math.round(OY * size)); x.restore();
      if (row === 2) { x.save(); x.globalCompositeOperation = "destination-over"; x.fillStyle = "rgba(10,6,24,.55)"; x.beginPath(); x.ellipse(gx * RS, gy * RS - 3 * RS, 35 * RS, 4.5 * RS, 0, 0, Math.PI * 2); x.fill(); x.restore(); }
      layers.push(c); });
    // 6. the band at the foot for the lines, and the lines
    steps.push(() => { const [c, x] = mk(WD, HD), y0 = 150 * RS; const gr = x.createLinearGradient(0, y0, 0, HD); gr.addColorStop(0, "rgba(14,10,26,0)"); gr.addColorStop(0.3, "rgba(14,10,26,.8)"); gr.addColorStop(1, "rgba(14,10,26,.96)"); x.fillStyle = gr; x.fillRect(0, y0, WD, HD - y0);
      x.setTransform(RS, 0, 0, RS, 0, 0);
      const plate = (s3, x0, y1, fill, bg) => { const tw = textW(s3, 1, 1); x.fillStyle = OUT; x.fillRect(x0 - 4, y1 - 3.5, tw + 8, 14); x.fillStyle = bg; x.fillRect(x0 - 3.5, y1 - 3, tw + 7, 13); text(x, s3, x0, y1, fill, { ol: null }); return tw + 8; };
      text(x, COPY.cta, W / 2, 158, GOLD, { sc: 2, sh: 1, al: "c" });
      const w1 = textW(COPY.where, 1, 1) + 8, w2 = textW(COPY.site, 1, 1) + 8, gap = 10, x0 = Math.round((W - w1 - w2 - gap) / 2) + 4;
      plate(COPY.where, x0, 179, "#170f19", "#fed012"); plate(COPY.site, x0 + w1 + gap, 179, "#170f19", "#7fd8ff");
      text(x, COPY.what, W / 2, 193, "#ffffff", { al: "c" });
      layers.push(c); SPLASH.done = true; });
    SPLASH.logo = logo();
    BAKEQ.unshift(...steps);
    return SPLASH;
  }
  function drawTitle(ctx, t) {
    const S = splashArt();
    if (S.done && !S.flat) { const [c, x] = mk(W * RS, H * RS); for (const l of S.layers) x.drawImage(l, 0, 0); x.drawImage(S.logo, 0, 0); S.flat = c; S.layers.length = 0; S.at = t; } // once whole: one picture
    // beta 3.34: until it is whole, a still first frame (the dusk sky and the logo, nothing moving, so a slow phone
    // never shows it stutter); then the whole picture comes in with a flash
    if (!S.flat) { ctx.drawImage(S.layers[0], 0, 0, W, H); ctx.drawImage(S.logo, 0, 0, W, H); return; }
    ctx.drawImage(S.flat, 0, 0, W, H);
    if (t - S.at < 0.35) { ctx.fillStyle = "rgba(255,255,255," + (1 - (t - S.at) / 0.35).toFixed(3) + ")"; ctx.fillRect(0, 0, W, H); }
    if (Math.floor(t * 2) % 2 === 0) text(ctx, TOUCH ? COPY.tap : COPY.start, W / 2, 204, GOLD, { sc: 1, al: "c", sh: 1 });
  }
  // the grid's geometry, from GRID: tiles of 36 px faces (the middle of each 64 px portrait)
  const TILE = 36, GAP = 5;
  const tilePos = (i) => { const c = i % GRID.cols, r = Math.floor(i / GRID.cols), gw = GRID.cols * (TILE + 4) + (GRID.cols - 1) * GAP; return [Math.round(10 + (222 - gw) / 2) + c * (TILE + 4 + GAP) + 2, 34 + r * (TILE + 4 + GAP) + 2]; };
  function face(ctx, id, x, y, size, t, flip) {
    ctx.fillStyle = "#241d3d"; ctx.fillRect(x, y, size, size);
    ctx.fillStyle = "#2d2550"; for (let i = 0; i < size; i += 4) ctx.fillRect(x, y + i, size, 2);
    if (id === "random") { text(ctx, "?", x + size / 2, y + size / 2 - (size > 40 ? 14 : 7), ["#ffffff", "#bfe9ff", "#7fd8ff", "#3a8fe0"], { sc: size > 40 ? 4 : 2, al: "c" }); return; }
    drawFlipped(ctx, size >= 64 ? portrait(id) : bust(id), x, y, size, size, flip);
  }
  const P1C = "#fed012", CPUC = "#ff5236";
  function frame(ctx, x, y, w, col, h = w) { // beta 3.34: at the canvas's pixels: the outline, the colour lit on its top and left, shaded under, a fine dark line inside
    const q = 1 / RS, R2 = ramp(col).map((v) => hexOf([v & 255, (v >> 8) & 255, (v >> 16) & 255]));
    ctx.fillStyle = OUT; ctx.fillRect(x - 3, y - 3, w + 6, h + 6); ctx.fillStyle = col; ctx.fillRect(x - 3 + q, y - 3 + q, w + 6 - 2 * q, h + 6 - 2 * q);
    ctx.fillStyle = R2[0]; ctx.fillRect(x - 3 + q, y - 3 + q, w + 6 - 2 * q, q); ctx.fillRect(x - 3 + q, y - 3 + q, q, h + 6 - 2 * q);
    ctx.fillStyle = R2[3]; ctx.fillRect(x - 3 + q, y + h + 3 - 2 * q, w + 6 - 2 * q, q); ctx.fillRect(x + w + 3 - 2 * q, y - 3 + q, q, h + 6 - 2 * q);
    ctx.fillStyle = OUT; ctx.fillRect(x - q, y - q, w + 2 * q, h + 2 * q);
  }
  // S: { phase: "p1" | "cpu", p1, cpu } (indexes in GRID.order)
  function drawSelect(ctx, t, S) {
    stripes(ctx, t, "#1b1438", "#211a44");
    if (S === SEL && sceneT - (S.moved || 0) > 0.35) { wantBig(GRID.order[S.p1]); if (S.phase === "cpu") wantBig(GRID.order[S.cpu]); } // beta 3.33: the VS faces baked ahead
    text(ctx, S.phase === "p1" ? "CHOOSE YOUR FIGHTER" : "CHOOSE THE CPU", W / 2, 8, S.phase === "p1" ? GOLD : RED, { sc: 2, sh: 1, al: "c" });
    const blink = Math.floor(t * 6) % 2;
    GRID.order.forEach((id, i) => {
      const [x, y] = tilePos(i), isP1 = i === S.p1, isCpu = i === S.cpu && S.phase === "cpu";
      frame(ctx, x, y, TILE, isCpu ? (blink ? "#ff8a6e" : CPUC) : isP1 ? (S.phase === "p1" && blink ? "#fff27a" : P1C) : "#5a4e7a");
      face(ctx, id, x, y, TILE, t);
    });
    // the cursors' tags
    { const [x, y] = tilePos(S.p1); text(ctx, "1P", x + 2, y - 10 + (S.phase === "p1" ? Math.round(Math.sin(t * 8)) : 0), P1C, {}); }
    if (S.phase === "cpu") { const [x, y] = tilePos(S.cpu); text(ctx, "CPU", x + TILE - 1, y - 10 + Math.round(Math.sin(t * 8)), CPUC, { al: "r" }); }
    // the two sides, big
    const id1 = GRID.order[S.p1], id2 = S.phase === "cpu" ? GRID.order[S.cpu] : null;
    frame(ctx, 238, 34, 64, P1C); face(ctx, id1, 238, 34, 64, t);
    frame(ctx, 310, 34, 64, CPUC); if (id2) face(ctx, id2, 310, 34, 64, t, true); else { ctx.fillStyle = "#241d3d"; ctx.fillRect(310, 34, 64, 64); text(ctx, "CPU", 342, 62, "#5a4e7a", { al: "c" }); }
    text(ctx, "VS", 306, 104, RED, { sc: 1, al: "c" });
    text(ctx, id1 === "random" ? "RANDOM" : ROSTER[id1].name, 270, 104, P1C, { al: "c" });
    if (id2) text(ctx, id2 === "random" ? "RANDOM" : ROSTER[id2].name, 342, 104, CPUC, { al: "c" });
    // what the cursor is on
    const cur = S.phase === "p1" ? id1 : id2;
    if (cur === "random") { text(ctx, "ANY FIGHTER, PICKED AT RANDOM", 12, 128, "#a99cc8"); text(ctx, "FEELING LUCKY?", 12, 142, "#ffffff"); }
    else { const R = ROSTER[cur]; text(ctx, R.name + " - " + R.role, 12, 128, "#a99cc8"); text(ctx, "SPECIAL: " + R.special, 12, 142, "#ffffff"); text(ctx, R.line, 12, 154, "#7fd8ff"); }
    const hint = S.phase === "p1" ? (TOUCH ? "TAP A FIGHTER, TAP AGAIN TO PICK" : "ARROWS TO CHOOSE - ENTER OR J TO PICK")
      : (TOUCH ? "TAP THE CPU, TAP AGAIN TO FIGHT - TAP 1P TO GO BACK" : "ARROWS TO CHOOSE - ENTER OR J TO FIGHT - K BACK");
    text(ctx, hint, W / 2, 176, "#ffffff", { al: "c" });
    if (!TOUCH) text(ctx, "ARROWS/WASD MOVE - J PUNCH - K KICK - L SPECIAL", W / 2, 194, "#a99cc8", { al: "c" });
  }
  function drawVS(ctx, t, me, k, cpu = "ion") {
    stripes(ctx, t * 3, "#120c24", "#1d1540");
    const slide = Math.min(1, k * 2.4), ease = 1 - Math.pow(1 - slide, 3);
    const lx = Math.round(-140 + (20 + 140) * ease), rx = Math.round(W + 12 - (W + 12 - (W - 148)) * ease);
    const big = (id, x, flip) => {
      const ready = !!PORT[id + ":b"], p = ready ? PORT[id + ":b"] : portrait(id); if (!ready) wantBig(id, true);
      frame(ctx, x, 40, 128, flip ? "#d8342a" : "#fed012"); ctx.fillStyle = "#241d3d"; ctx.fillRect(x, 40, 128, 128); // beta 3.34: the frame at the canvas's pixels
      drawFlipped(ctx, p, x, 40, 128, 128, flip);
      const e0 = ready && p.ember, e = e0 && [e0[0] / 2, e0[1] / 2]; // beta 3.32: Cristache's smoke keeps rising over his portrait
      if (e) {
        ctx.save(); ctx.beginPath(); ctx.rect(x, 40, 128, 128); ctx.clip();
        for (let i = 0; i < 6; i++) {
          const a = (t * 0.45 + i / 6) % 1, ex = e[0] * 2 + Math.round(Math.sin(a * 6 + i * 1.7) * (1 + a * 5)) + Math.round(a * 8), ey = e[1] * 2 - 30 - Math.round(a * 40), sx = flip ? x + 128 - ex - 2 : x + ex;
          ctx.globalAlpha = a < 0.4 ? 0.85 : a < 0.7 ? 0.55 : 0.28; ctx.fillStyle = a < 0.35 ? "#e8e8f0" : a < 0.7 ? "#c8c8d6" : "#a4a4b6";
          ctx.fillRect(sx, 40 + ey, 2, 2); if (a > 0.3) ctx.fillRect(sx + (flip ? -2 : 2), 40 + ey - 2, 2, 2); if (a > 0.6) ctx.fillRect(sx, 40 + ey - 4, 2, 2);
        }
        ctx.restore();
      }
    };
    big(me, lx, false);
    big(cpu, rx, true);
    if (k > 0.35) { const s = k < 0.45 ? 7 : 5; text(ctx, "VS", W / 2, 86 - (s - 5) * 4, RED, { sc: s, sh: 2, al: "c" }); }
    text(ctx, ROSTER[me].name, lx + 64, 180, GOLD, { sc: 2, sh: 1, al: "c" });
    text(ctx, ROSTER[cpu].name, rx + 64, 180, RED, { sc: 2, sh: 1, al: "c" });
    text(ctx, "STAGE: TWO MINUTES COFFEE SHOP", W / 2, 10, "#ffffff", { al: "c" });
    text(ctx, "STR. C. ARICESCU 50A, BUCHAREST", W / 2, 21, "#a99cc8", { al: "c" });
  }
  // the HUD: two bars, the names, the round wins (coffee cups), the timer, the special meters
  function bar(ctx, x, y, w, hp, trail, flip, t) { // beta 3.33: at the canvas's pixels: a one-pixel outline, the gold frame lit on top, the bar's light and shade lines, ticks
    const p = 1 / RS;
    ctx.fillStyle = OUT; ctx.fillRect(x - 2, y - 2, w + 4, 12);
    ctx.fillStyle = "#c9a640"; ctx.fillRect(x - 2 + p, y - 2 + p, w + 4 - 2 * p, 12 - 2 * p); ctx.fillStyle = "#f2d27a"; ctx.fillRect(x - 2 + p, y - 2 + p, w + 4 - 2 * p, p); ctx.fillStyle = "#8a6a20"; ctx.fillRect(x - 2 + p, y + 10 - 2 * p, w + 4 - 2 * p, p);
    ctx.fillStyle = OUT; ctx.fillRect(x - p, y - p, w + 2 * p, 8 + 2 * p);
    ctx.fillStyle = "#7a0f0b"; ctx.fillRect(x, y, w, 8); ctx.fillStyle = "#5a0a08"; ctx.fillRect(x, y + 8 - p, w, p);
    const tw = Math.round(w * clamp(trail, 0, 1) * RS) / RS, hw = Math.round(w * clamp(hp, 0, 1) * RS) / RS;
    ctx.fillStyle = "#ff5236"; ctx.fillRect(flip ? x : x + w - tw, y, tw, 8);
    const low = hp < 0.25 && Math.floor(t * 8) % 2, hx = flip ? x : x + w - hw;
    ctx.fillStyle = low ? "#ffffff" : "#ffd23a"; ctx.fillRect(hx, y, hw, 8);
    ctx.fillStyle = low ? "#ffffff" : "#fff6b8"; ctx.fillRect(hx, y, hw, 1.5); ctx.fillStyle = low ? "#ffffff" : "#ffe680"; ctx.fillRect(hx, y + 1.5, hw, p);
    ctx.fillStyle = low ? "#e8e8e8" : "#f29a14"; ctx.fillRect(hx, y + 6, hw, 2); ctx.fillStyle = low ? "#d0d0d0" : "#d9700f"; ctx.fillRect(hx, y + 8 - p, hw, p);
    ctx.fillStyle = "rgba(23,15,25,.35)"; for (let i = 1; i < 10; i++) ctx.fillRect(x + (w * i) / 10, y + 1.5, p, 5); // the ticks
  }
  function cupIcon(ctx, x, y, full) {
    ctx.fillStyle = OUT; ctx.fillRect(x, y, 8, 8); ctx.fillRect(x + 8, y + 2, 2, 4);
    ctx.fillStyle = full ? "#ffffff" : "#3a3060"; ctx.fillRect(x + 1, y + 1, 6, 6);
    if (full) { ctx.fillStyle = "#6b3f22"; ctx.fillRect(x + 1, y + 1, 6, 2); }
  }
  // beta 3.36 (Daniel: "it should look like the arcade game"): the HUD in the arcade's language, our own drawing: the
  // two yellow bars running to a KO badge in the middle (it flashes when either fighter is nearly out), the big timer
  // under it with no box, the names in bold outlined letters under the bars, the round wins as cups beside the timer
  function drawHUD(ctx, g, t) {
    const [a, b] = g.f, low = Math.min(a.hp, b.hp) < 25 && Math.floor(t * 4) % 2;
    bar(ctx, 12, 8, 160, a.hp / 100, a.trail / 100, false, t);
    bar(ctx, W - 172, 8, 160, b.hp / 100, b.trail / 100, true, t);
    ctx.fillStyle = OUT; ctx.fillRect(W / 2 - 15, 3, 30, 19); ctx.fillStyle = "#ffd23a"; ctx.fillRect(W / 2 - 14, 4, 28, 17); ctx.fillStyle = low ? "#ffffff" : "#c41f14"; ctx.fillRect(W / 2 - 13, 5, 26, 15); ctx.fillStyle = low ? "#ffd0c4" : "#e8301c"; ctx.fillRect(W / 2 - 13, 5, 26, 3);
    text(ctx, "KO", W / 2, 7, low ? RED : GOLD, { sc: 1, al: "c", sp: 2 });
    text(ctx, a.R.name, 12, 21, ["#ffffff", "#fff6b8", "#ffd23a"], { sh: 1 });
    text(ctx, b.R.name, W - 12, 21, ["#ffffff", "#fff6b8", "#ffd23a"], { al: "r", sh: 1 });
    for (let i = 0; i < 2; i++) { cupIcon(ctx, W / 2 - 34 - i * 12, 24, g.wins[0] > i); cupIcon(ctx, W / 2 + 25 + i * 12, 24, g.wins[1] > i); }
    // the special meters
    const sp = (x, v, flip) => { ctx.fillStyle = OUT; ctx.fillRect(x - 1, 31, 62, 4); ctx.fillStyle = "#2a2148"; ctx.fillRect(x, 32, 60, 2); const w2 = Math.round(60 * clamp(v, 0, 1)); ctx.fillStyle = v >= 1 ? (Math.floor(t * 10) % 2 ? "#7fd8ff" : "#ffffff") : "#3a8fe0"; ctx.fillRect(flip ? x + 60 - w2 : x, 32, w2, 2); };
    sp(12, 1 - a.spCool / a.spMax, false); sp(W - 72, 1 - b.spCool / b.spMax, true);
    // the timer: big, no box
    const tt = String(Math.max(0, Math.ceil(g.time))).padStart(2, "0");
    text(ctx, tt, W / 2, 24, g.time <= 10 ? RED : GOLD, { sc: 2, al: "c", sh: 1 });
  }


  // ===================== the rest (game, sound, input) is below =====================
  // ===================== 7. sound: chiptune, made on the spot =====================
  // square, triangle and noise voices through one gain; off when the site's sound is off (localStorage "cz-sound",
  // the same switch as the map's speaker), and the switch here writes the same key
  const SND = (() => {
    let ctx = null, master = null, musicG = null, noise = null, on = true, mode = null, step = 0, nextT = 0, timer = 0;
    try { on = localStorage.getItem("cz-sound") !== "off"; } catch {}
    const btns = new Set();
    function init() {
      if (ctx) { if (on && ctx.state === "suspended") ctx.resume(); return; }
      const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
      try { ctx = new AC(); } catch { ctx = null; return; }
      master = ctx.createGain(); master.gain.value = on ? 0.55 : 0;
      const comp = ctx.createDynamicsCompressor(); comp.threshold.value = -14; comp.ratio.value = 4; master.connect(comp); comp.connect(ctx.destination);
      musicG = ctx.createGain(); musicG.gain.value = 0.15; musicG.connect(master);
      const b = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate), d = b.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; noise = b;
      if (!on) ctx.suspend();
      if (mode) music(mode);
    }
    const toneAt = (type, f0, f1, dur, vol, t, dest) => {
      const o = ctx.createOscillator(), g = ctx.createGain();
      o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
      o.connect(g); g.connect(dest || master); o.start(t); o.stop(t + dur + 0.03);
    };
    const hissAt = (f, q, dur, vol, t, type, f1, dest) => {
      const s = ctx.createBufferSource(), fl = ctx.createBiquadFilter(), g = ctx.createGain();
      s.buffer = noise; fl.type = type || "bandpass"; fl.frequency.setValueAtTime(f, t); if (f1) fl.frequency.exponentialRampToValueAtTime(f1, t + dur); fl.Q.value = q;
      g.gain.setValueAtTime(vol, t); g.gain.exponentialRampToValueAtTime(0.0008, t + dur);
      s.connect(fl); fl.connect(g); g.connect(dest || master); s.start(t, Math.random() * 0.5); s.stop(t + dur + 0.03);
    };
    const tone = (type, f0, f1, dur, vol = 0.15, at = 0) => toneAt(type, f0, f1, dur, vol, ctx.currentTime + at);
    const hiss = (f, q, dur, vol = 0.2, at = 0, type, f1) => hissAt(f, q, dur, vol, ctx.currentTime + at, type, f1);
    const notes = (list, type, dur, vol, gap) => list.forEach((f, i) => tone(type, f, f, dur, vol, i * gap));
    const SFX = {
      swing: () => hiss(2600, 0.8, 0.07, 0.07, 0, "highpass"),
      rise: () => { tone("square", 300, 1300, 0.28, 0.09); hiss(2000, 0.8, 0.25, 0.25, 0, "bandpass", 5000); },
      hug: () => { tone("triangle", 140, 55, 0.35, 0.3); hiss(500, 0.8, 0.3, 0.35, 0, "lowpass"); },
      key: () => notes([1900, 2500, 1900, 2500], "triangle", 0.05, 0.07, 0.05),
      beans: () => { for (let i = 0; i < 5; i++) hiss(3200 + i * 300, 3, 0.03, 0.22, i * 0.035, "bandpass"); tone("square", 520, 260, 0.12, 0.06); },
      tote: () => { hiss(900, 0.8, 0.32, 0.4, 0, "bandpass", 200); tone("square", 200, 90, 0.25, 0.08); },
      hit: () => { hiss(900, 1.1, 0.12, 0.5); tone("square", 220, 70, 0.1, 0.16); },
      heavy: () => { hiss(600, 1, 0.2, 0.6); tone("square", 160, 45, 0.18, 0.2); tone("triangle", 90, 40, 0.25, 0.3); },
      block: () => { tone("square", 1100, 900, 0.05, 0.1); hiss(4200, 2, 0.06, 0.2, 0, "highpass"); },
      jump: () => tone("square", 300, 620, 0.09, 0.06),
      land: () => hiss(320, 1, 0.07, 0.16, 0, "lowpass"),
      select: () => tone("square", 660, 660, 0.06, 0.1),
      confirm: () => notes([523, 659, 784, 1046], "square", 0.09, 0.1, 0.06),
      round: () => { tone("sawtooth", 220, 220, 0.32, 0.1); tone("square", 330, 330, 0.32, 0.08); },
      fight: () => { notes([392, 523, 784], "square", 0.13, 0.12, 0.07); hiss(3000, 0.6, 0.3, 0.12, 0.14, "highpass"); },
      ko: () => { tone("sawtooth", 520, 50, 1.0, 0.2); hiss(420, 0.7, 0.9, 0.5, 0, "lowpass", 80); tone("triangle", 120, 38, 0.8, 0.3); },
      wave: () => { tone("sawtooth", 200, 900, 0.35, 0.1); tone("square", 400, 1600, 0.3, 0.05); },
      espresso: () => { hiss(1400, 3, 0.4, 0.32, 0, "bandpass", 4200); tone("square", 880, 440, 0.12, 0.07, 0.05); },
      dash: () => { hiss(1300, 0.7, 0.28, 0.35, 0, "bandpass", 280); tone("square", 180, 90, 0.2, 0.08); },
      flash: () => { tone("square", 2400, 1200, 0.08, 0.1); tone("square", 3200, 3200, 0.05, 0.07, 0.08); hiss(6000, 1, 0.28, 0.3, 0, "highpass"); },
      dizzy: () => notes([1200, 1500, 1200, 1500], "triangle", 0.07, 0.08, 0.08),
      win: () => notes([523, 659, 784, 659, 784, 1046], "square", 0.14, 0.1, 0.11),
      lose: () => notes([392, 370, 349, 330], "square", 0.22, 0.09, 0.2),
      pause: () => notes([784, 523], "square", 0.06, 0.08, 0.06)
    };
    function play(n) { if (!ctx || !on || ctx.state !== "running") return; try { SFX[n]?.(); } catch {} }
    // the music: a 4-bar loop, scheduled a little ahead. "fight": A minor, 142 bpm, bass, lead and drums; "menu": the
    // same chords, slower, an arpeggio and the bass
    const hz = (n) => 440 * Math.pow(2, (n - 69) / 12);
    const BASS = [45, 45, 57, 45, 45, 57, 45, 57, 41, 41, 53, 41, 41, 53, 41, 53, 43, 43, 55, 43, 43, 55, 43, 55, 40, 40, 52, 40, 40, 52, 47, 52];
    const LEAD = [69, 0, 72, 0, 76, 0, 74, 72, 74, 0, 72, 0, 69, 0, 67, 69, 65, 0, 69, 0, 72, 0, 71, 69, 72, 0, 74, 0, 72, 0, 69, 0, 67, 0, 71, 0, 74, 0, 72, 71, 74, 0, 76, 0, 79, 0, 76, 74, 76, 0, 0, 75, 76, 0, 79, 0, 76, 0, 74, 0, 71, 0, 68, 0];
    const CHORD = [[57, 60, 64, 69], [53, 57, 60, 65], [55, 59, 62, 67], [52, 56, 59, 64]];
    function schedule(s, t, len) {
      const bar = s >> 4;
      if (mode === "fight") {
        if (!(s & 1)) toneAt("triangle", hz(BASS[s >> 1]), hz(BASS[s >> 1]), len * 1.8, 0.5, t, musicG);
        if (LEAD[s]) toneAt("square", hz(LEAD[s]), hz(LEAD[s]), len * 1.6, 0.13, t, musicG);
        if (s % 4 === 0) toneAt("sine", 150, 45, 0.12, 0.7, t, musicG);
        if (s % 8 === 4) hissAt(1800, 0.8, 0.12, 0.35, t, "bandpass", null, musicG);
        if (s % 2 === 1) hissAt(7000, 1, 0.03, 0.12, t, "highpass", null, musicG);
      } else {
        if (s % 4 === 0) toneAt("triangle", hz(BASS[s >> 1]), hz(BASS[s >> 1]), len * 3.5, 0.45, t, musicG);
        const c = CHORD[bar]; toneAt("square", hz(c[s % 4] + 12), hz(c[s % 4] + 12), len * 0.9, 0.06, t, musicG);
      }
    }
    function tick() {
      if (!ctx || !mode || !on || ctx.state !== "running") return;
      const len = mode === "fight" ? 60 / 142 / 4 : 60 / 104 / 4;
      if (nextT < ctx.currentTime - 0.2) nextT = ctx.currentTime + 0.05;
      while (nextT < ctx.currentTime + 0.14) { schedule(step, nextT, len); step = (step + 1) % 64; nextT += len; }
    }
    function music(m) { if (mode !== m) step = 0; mode = m; if (!ctx) return; nextT = ctx.currentTime + 0.06; if (!timer) timer = setInterval(tick, 25); }
    const sync = () => { for (const b of btns) { b.classList.toggle("off", !on); b.setAttribute("aria-pressed", String(on)); b.setAttribute("aria-label", on ? "Sound off" : "Sound on"); } };
    function toggle() {
      on = !on; try { localStorage.setItem("cz-sound", on ? "on" : "off"); } catch {}
      if (on) { init(); if (ctx) { ctx.resume(); master.gain.setTargetAtTime(0.55, ctx.currentTime, 0.05); } }
      else if (ctx) { master.gain.setTargetAtTime(0, ctx.currentTime, 0.04); setTimeout(() => { if (!on) ctx.suspend(); }, 300); }
      sync();
    }
    document.addEventListener("visibilitychange", () => { if (!ctx) return; if (document.hidden) ctx.suspend(); else if (on) ctx.resume(); });
    return { init, play, music, toggle, bind: (b) => { btns.add(b); sync(); }, get on() { return on; } };
  })();

  // ===================== 8. the fight =====================
  // frame data at 60 steps a second: su start-up, ac active, rc recovery; box = [x0, y0, x1, y1] in front of the
  // fighter (y up negative from the feet); hs / bs = the stun on hit / on block; push = the knockback
  const ATK = {
    // beta 3.11: more frames (fr: which drawing shows in the start-up, the hit and the recovery) and the longer reach
    punch: { su: 5, ac: 3, rc: 10, dmg: 6, box: [16, -82, 54, -62], hs: 15, bs: 9, push: 2.4, frames: "punch", fr: [[0, 1], [2], [3]], sfx: "hit" },
    kick: { su: 8, ac: 4, rc: 14, dmg: 9, box: [14, -74, 57, -50], hs: 19, bs: 11, push: 3.2, frames: "kick", fr: [[0, 1], [2], [3, 4]], sfx: "heavy" },
    cpunch: { su: 4, ac: 3, rc: 8, dmg: 5, box: [14, -60, 52, -42], hs: 14, bs: 8, push: 2, frames: "cpunch", fr: [[0], [1], [0]], crouch: true, sfx: "hit" },
    ckick: { su: 6, ac: 4, rc: 15, dmg: 8, box: [12, -16, 55, 0], hs: 18, bs: 10, push: 2.6, frames: "ckick", fr: [[0], [1], [0]], crouch: true, low: true, kd: true, sfx: "heavy" },
    jpunch: { su: 3, ac: 10, rc: 0, dmg: 7, box: [12, -76, 50, -50], hs: 16, bs: 9, push: 2.2, frames: "jpunch", air: true, high: true, sfx: "hit" },
    jkick: { su: 4, ac: 11, rc: 0, dmg: 9, box: [12, -64, 54, -34], hs: 18, bs: 10, push: 2.8, frames: "jkick", air: true, high: true, sfx: "heavy" }
  };
  const SPECIAL = {
    daniel: { su: 13, ac: 1, rc: 20, cool: 150, proj: "wave", dmg: 12, speed: 3.4, sfx: "wave", sp: true },
    ion: { su: 13, ac: 1, rc: 20, cool: 150, proj: "espresso", dmg: 11, speed: 3.8, sfx: "espresso", sp: true },
    cristian: { su: 7, ac: 16, rc: 16, cool: 150, dash: 5.6, dmg: 13, box: [6, -82, 48, -34], hs: 22, bs: 14, push: 4, sfx: "dash", kd: true, sp: true, chip: 2 },
    coz: { su: 10, ac: 6, rc: 16, cool: 170, flash: true, dmg: 6, box: [6, -104, 80, -20], hs: 0, bs: 12, push: 1.5, dizzy: 80, sfx: "flash", sp: true },
    // beta 3.11: the guests. Maria spins in (both sides of her hit), Cristache goes up for a high five (it beats a
    // jump), Steve's hug can't be blocked (but only reaches close and leaves him open), Rares's keys come back to
    // him, Iulica swings the tote bag in a wide arc
    maria: { su: 8, ac: 24, rc: 14, cool: 150, spin: true, dash: 3.6, dmg: 12, box: [-34, -82, 52, -36], hs: 20, bs: 12, push: 3.6, kd: true, sfx: "dash", sp: true, chip: 2, fr: [[0], [1, 2], [0]] },
    cristache: { su: 5, ac: 16, rc: 14, cool: 150, rise: true, dmg: 13, box: [-4, -128, 36, -50], hs: 20, bs: 12, push: 3, kd: true, sfx: "rise", sp: true, chip: 2, armor: 10 },
    steve: { su: 11, ac: 5, rc: 24, cool: 160, grab: true, dmg: 16, box: [8, -96, 42, -30], hs: 0, bs: 0, push: 4.5, kd: true, sfx: "hug", sp: true },
    rares: { su: 12, ac: 1, rc: 18, cool: 160, proj: "key", dmg: 10, speed: 4.2, sfx: "key", sp: true },
    dony: { su: 11, ac: 1, rc: 18, cool: 150, proj: "bean", beans: 3, dmg: 5, speed: 3.6, sfx: "beans", sp: true, hs: 12, bs: 8, push: 1.6 },
    iulica: { su: 12, ac: 6, rc: 18, cool: 150, dmg: 13, box: [4, -116, 58, -30], hs: 22, bs: 14, push: 4.2, kd: true, sfx: "tote", sp: true, chip: 2 }
  };
  const GRAV = 0.34, JUMP_V = -6.4, ROUND_TIME = 60; // beta 3.33: the jump a little lower, as the fighters are (about 60 units up)
  function fighter(id, cpu, x, face, alt) {
    const R = ROSTER[id];
    return { id, R, S: sprites(id, alt), sc: (LOOKS[id].build.sc || 1) * FSC, armor: 0, cpu, x, y: 0, vx: 0, vy: 0, face, hp: 100, trail: 100, st: "idle", t: 0, atk: null, atkHit: false, hs: 0, spCool: 40, spMax: SPECIAL[id].cool, inv: 0, walkT: 0, walkDir: 1, holdBack: false, holdDown: false, ai: { t: 30, plan: null, pt: 0, seen: 0 }, flashT: 0, dz: 0, landT: 0 };
  }
  const onGround = (f) => f.y >= 0;
  const free = (f) => onGround(f) && (f.st === "idle" || f.st === "walk" || f.st === "crouch");
  // beta 3.33: the boxes refitted to the new proportions (the guard 101 units tall where it stood 115, broader)
  const hurt = (f) => { const top = (f.st === "crouch" || (f.st === "atk" && f.atk?.crouch) || (f.st === "block" && f.crouchBlock) ? -68 : f.st === "down" ? -14 : -97) * f.sc, hw = 14.5 * f.sc; return [f.x - hw, f.y + top, f.x + hw, f.y - (onGround(f) ? 0 : 18)]; };
  const boxOf = (f, b0) => { const b = b0.map((v) => v * f.sc); return f.face > 0 ? [f.x + b[0], f.y + b[1], f.x + b[2], f.y + b[3]] : [f.x - b[2], f.y + b[1], f.x - b[0], f.y + b[3]]; };
  const overlap = (a, b) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];

  let g = null; // the match
  function newMatch(me, cpu) {
    g = { scene: "vs", me, cpu: cpu || "ion", voucher: null, t: 0, round: 1, wins: [0, 0], phase: "intro", pt: 0, time: ROUND_TIME, f: [], proj: [], fx: [], hitstop: 0, shake: 0, flash: 0, camX: (STAGE_W - W) / 2, slow: 0, menu: 0, result: null, perfect: false };
    resetRound();
    BAKEQ.push(() => carDacia(), ...["cristache", "ion", "rares"].map((id) => () => endFrame(id))); // beta 3.33: the ending's art, in the spare time of the fight
    g.scene = "vs"; g.t = 0;
    SND.play("confirm");
  }
  function resetRound() {
    g.f = [fighter(g.me, false, STAGE_W / 2 - 64, 1), fighter(g.cpu, true, STAGE_W / 2 + 64, -1, g.cpu === g.me)];
    g.proj = []; g.fx = [];
    // I O N comes in with a stack of Two Minutes tees (round 1); then it waits on the pavement behind him
    for (const f of g.f) if (f.id === "ion") { if (g.round === 1) f.st = "intro"; else g.fx.push({ k: "stack", x: f.x - f.face * 30, y: 0, t: 0, life: 1e9 }); } g.phase = "intro"; g.pt = 0; g.time = ROUND_TIME; g.camX = (STAGE_W - W) / 2; g.hitstop = 0; g.shake = 0; g.flash = 0;
  }
  const spark = (x, y, kind) => g.fx.push({ k: kind || "spark", x, y, t: 0, life: kind === "bspark" ? 8 : kind === "burst" ? 14 : 10 });
  function startAtk(f, name) {
    const a = ATK[name]; f.atk = a; f.atkHit = false; f.t = 0;
    if (a.air) return; // stays "jump"
    f.st = "atk"; f.vx = 0;
    SND.play("swing");
  }
  function startSpecial(f) {
    const s = SPECIAL[f.id]; f.atk = s; f.atkHit = false; f.t = 0; f.st = "atk"; f.vx = 0; f.spCool = s.cool;
  }
  function jump(f, dir) { f.st = "jump"; f.vy = JUMP_V; f.vx = dir * 2.05 * f.R.speed; f.atk = null; f.t = 0; SND.play("jump"); }
  // one step of a fighter's controls (the player's keys or the CPU's plan, both as the same intent)
  function control(f, o, inp) {
    const fw = f.face > 0 ? inp.r : inp.l, bk = f.face > 0 ? inp.l : inp.r;
    f.holdBack = !!bk; f.holdDown = !!inp.d;
    if (free(f)) {
      if (inp.sp && f.spCool <= 0) return startSpecial(f);
      if (inp.pp) return startAtk(f, inp.d ? "cpunch" : "punch");
      if (inp.kp) return startAtk(f, inp.d ? "ckick" : "kick");
      if (inp.u) return jump(f, fw ? f.face : bk ? -f.face : 0);
      if (inp.d) { f.st = "crouch"; f.vx = 0; return; }
      const sp = f.R.speed;
      if (fw) { f.st = "walk"; f.vx = 1.6 * sp * f.face; f.walkDir = 1; }
      else if (bk) { f.st = "walk"; f.vx = -1.3 * sp * f.face; f.walkDir = -1; }
      else { f.st = "idle"; f.vx = 0; }
    } else if (f.st === "jump" && !f.atk) {
      if (inp.pp) startAtk(f, "jpunch"); else if (inp.kp) startAtk(f, "jkick");
    }
  }
  // the CPU: I O N. Reads the distance and what you are doing, with a human delay; blocks about half of what it
  // sees coming, throws the espresso from afar, jumps in now and then: a fair fight, a little easier than hard
  function think(f, o) {
    const ai = f.ai, d = Math.abs(o.x - f.x), inp = { l: 0, r: 0, u: 0, d: 0, pp: 0, kp: 0, sp: 0 };
    const fwd = f.face > 0 ? "r" : "l", back = f.face > 0 ? "l" : "r";
    if (cpuHold) return inp; // for the review renders: the CPU stands still
    ai.t--;
    // a threat: the player's attack starting near, or a projectile coming
    const threatAtk = o.st === "atk" || (o.atk && !onGround(o));
    if (threatAtk && o.atk && ai.seen !== o.atkId && d < 92) {
      ai.seen = o.atkId;
      if (Math.random() < (g.round === 1 ? 0.38 : g.round === 2 ? 0.45 : 0.52)) ai.plan = { k: "block", low: !!o.atk.low || (o.atk.crouch && Math.random() < 0.7), n: 26 + (Math.random() * 10 | 0) };
    }
    const pr = g.proj.find((p) => p.owner !== f && Math.sign(f.x - p.x) === Math.sign(p.vx) && Math.abs(f.x - p.x) < 110);
    if (pr && ai.seenP !== pr && free(f)) {
      ai.seenP = pr; const r = Math.random();
      if (r < 0.4 && Math.abs(f.x - pr.x) > 46) ai.plan = { k: "jumpf", n: 1 };
      else if (r < 0.75) ai.plan = { k: "block", low: false, n: 40 };
    }
    if (SPECIAL[f.id].rise && f.spCool <= 0 && free(f) && !onGround(o) && d < 80 && Math.random() < 0.08) { inp.sp = 1; return inp; }
    if (!onGround(f)) {
      if (!f.atk && d < 56 && f.vy > -2 && Math.random() < 0.3) inp.kp = 1;
      return inp;
    }
    if (ai.plan && free(f) || ai.plan && f.st === "block") {
      const p = ai.plan;
      if (p.k === "block") { inp[back] = 1; if (p.low) inp.d = 1; if (--p.n <= 0) ai.plan = null; return inp; }
      if (p.k === "walk") { inp[p.dir > 0 ? fwd : back] = 1; if (--p.n <= 0 || (p.dir > 0 && d < 40)) ai.plan = null; return inp; }
      if (p.k === "jumpf") { inp.u = 1; inp[fwd] = 1; ai.plan = null; return inp; }
      if (p.k === "jumpb") { inp.u = 1; inp[back] = 1; ai.plan = null; return inp; }
      if (p.k === "wait") { if (--p.n <= 0) ai.plan = null; return inp; }
    }
    if (!free(f) || ai.t > 0) return inp;
    ai.t = 14 + (Math.random() * 18 | 0) + (g.round === 1 ? 8 : 0);
    const r = Math.random(), ready = f.spCool <= 0, SP = SPECIAL[f.id], close = 66 * f.sc;
    // beta 3.11: any fighter can be the CPU; each special is used where it works (from afar, mid range, up close)
    const spAt = SP.proj ? d > 110 : SP.dash || SP.spin ? d > 50 && d < 150 : SP.grab ? d < 44 * f.sc : SP.rise ? d < 70 && (!onGround(o) || r < 0.5) : SP.flash ? d < 95 : d < 72 * f.sc;
    if (ready && spAt && r < (SP.proj ? 0.35 : 0.3)) { inp.sp = 1; return inp; }
    if (d > 150) {
      if (false) inp.sp = 1;
      else ai.plan = { k: "walk", dir: 1, n: 24 + (Math.random() * 24 | 0) };
    } else if (d > close) {
      if (r < 0.2) ai.plan = { k: "wait", n: 8 };
      else if (r < 0.36) ai.plan = { k: "jumpf", n: 1 };
      else if (r < 0.82) ai.plan = { k: "walk", dir: 1, n: 14 + (Math.random() * 18 | 0) };
      else ai.plan = { k: "wait", n: 14 };
    } else {
      if (r < 0.33) inp.pp = 1;
      else if (r < 0.56) inp.kp = 1;
      else if (r < 0.66) { inp.d = 1; inp.kp = 1; }
      else if (r < 0.8) ai.plan = { k: "walk", dir: -1, n: 16 };
      else if (r < 0.86) ai.plan = { k: "jumpb", n: 1 };
      else ai.plan = { k: "block", low: Math.random() < 0.4, n: 22 };
    }
    return inp;
  }
  let atkSeq = 0;
  function stepFighter(f, o) {
    f.t++;
    if (f.spCool > 0) f.spCool--;
    if (f.inv > 0) f.inv--;
    if (f.armor > 0) f.armor--;
    if (f.trail > f.hp) f.trail = Math.max(f.hp, f.trail - (f.hs > 0 || f.st === "hit" ? 0 : 0.6));
    // attacks run their course
    if (f.atk) {
      const a = f.atk, t = f.t;
      if (t === 1) f.atkId = ++atkSeq;
      if (a.sp && t === a.su) {
        SND.play(a.sfx);
        if (a.beans) for (let i = 0; i < a.beans; i++) g.proj.push({ k: "bean", x: f.x + f.face * 26, y: f.y - 56 * f.sc, vx: (a.speed + i * 0.5) * f.face, vy: -1.6 + i * 1.1, owner: f, dmg: a.dmg, t: 0, i });
        else if (a.proj) g.proj.push({ k: a.proj, x: f.x + f.face * 30, y: f.y - (a.proj === "wave" ? 56 : 63) * f.sc, vx: a.speed * f.face, owner: f, dmg: a.dmg, t: 0 });
        if (a.flash) { g.flash = 10; spark(f.x + f.face * 28, f.y - 76 * f.sc, "flash"); }
        if (a.rise) { f.vy = -7.8; f.vx = 1.5 * f.face; f.y = Math.min(f.y, -1); }
        if (a.armor) f.armor = a.armor;
      }
      if (a.dash) { if (t >= a.su && t < a.su + a.ac && !f.atkHit) f.vx = a.dash * f.face; else f.vx *= 0.7; if (t % 3 === 0 && t >= a.su && t < a.su + a.ac) g.fx.push({ k: "ghost", x: f.x, y: f.y, face: f.face, img: f.S.special[1], t: 0, life: 10 }); }
      if (!a.air && t >= a.su + a.ac + a.rc && onGround(f)) { f.atk = null; f.st = a.crouch ? "crouch" : "idle"; f.vx = 0; }
      if (a.air && t >= a.su + a.ac) f.atkDone = true;
    }
    // stuns
    if (f.st === "hit" && f.t >= f.hs) { f.st = "idle"; }
    if (f.st === "block" && f.t >= f.hs) { f.st = f.crouchBlock ? "crouch" : "idle"; }
    if (f.st === "dizzy" && f.t >= f.dz) { f.st = "idle"; }
    if (f.st === "down" && f.t >= 46 && f.hp > 0) { f.st = "idle"; f.inv = 24; }
    if (f.st === "hit" || f.st === "block" || f.st === "dizzy") f.vx *= 0.8;
    // movement
    f.x += f.vx;
    if (!onGround(f) || f.vy < 0) {
      f.vy += GRAV; f.y += f.vy;
      if (f.y >= 0) {
        f.y = 0; f.vy = 0;
        if (f.st === "fall") { f.st = "down"; f.t = 0; f.vx = 0; g.shake = Math.max(g.shake, 3); SND.play("land"); spark(f.x - f.face * 18, -2, "dust"); }
        else if (f.st === "jump") { f.st = "idle"; f.atk = null; f.atkDone = false; f.vx = 0; SND.play("land"); }
        else if (f.st === "atk" && f.atk?.rise) { f.vx = 0; f.t = Math.max(f.t, f.atk.su + f.atk.ac); SND.play("land"); }
        else if (f.st === "hit") f.vx = 0;
      }
    }
    if (f.st === "walk") f.walkT += f.walkDir;
    // face the other one when free
    if (free(f) && Math.abs(o.x - f.x) > 2) f.face = o.x > f.x ? 1 : -1;
  }
  const canBlock = (d) => onGround(d) && d.holdBack && (d.st === "idle" || d.st === "walk" || d.st === "crouch" || d.st === "block");
  function land(a, d, def, px, py, proj) {
    if (d.st === "down" || d.inv > 0 || d.armor > 0 || (d.st === "fall" && d.hp <= 0)) return false;
    if (def.grab && !onGround(d)) return false; // a hug needs both feet on the ground
    const blocked = !def.grab && canBlock(d) && !(def.low && !d.holdDown) && !(def.high && d.holdDown);
    const away = proj ? Math.sign(proj.vx) : (d.x >= a.x ? 1 : -1);
    if (blocked) {
      d.st = "block"; d.crouchBlock = d.holdDown; d.t = 0; d.hs = def.bs; d.vx = away * def.push * 0.9;
      d.hp = Math.max(1, d.hp - (def.chip || (def.sp ? 2 : 0)));
      spark(px, py, "bspark"); SND.play("block"); g.hitstop = 4;
      return true;
    }
    const dmg = Math.round(def.dmg * a.R.power * (d.cpu ? 1 : 0.9));
    d.hp = Math.max(0, d.hp - dmg); d.t = 0; d.atk = null; d.atkDone = false;
    if (d.hp <= 0) { d.st = "fall"; d.vy = -4.2; d.vx = away * 2.4; d.y = Math.min(d.y, -1); }
    else if (def.dizzy && onGround(d)) { d.st = "dizzy"; d.dz = def.dizzy; d.vx = away * 1; SND.play("dizzy"); }
    else if (def.grab) { d.st = "fall"; d.vy = -5; d.vx = away * 3.4; d.y = Math.min(d.y, -1); g.hitstop = 14; g.shake = 6; }
    else if (def.kd || !onGround(d)) { d.st = "fall"; d.vy = -3.4; d.vx = away * 2; d.y = Math.min(d.y, -1); }
    else { d.st = "hit"; d.hs = def.hs; d.vx = away * def.push; }
    spark(px, py, dmg >= 9 ? "burst" : "spark"); SND.play(def.sfx === "hit" ? "hit" : "heavy"); g.cheerT = 26; // the street reacts
    g.hitstop = dmg >= 9 ? 8 : 6; if (dmg >= 9 || def.sp) g.shake = 4;
    return true;
  }
  function stepFight(inp) {
    const [a, b] = g.f, fighting = g.phase === "fight";
    if (fighting) {
      if (autoP1) inp = think(a, b); // beta 3.33, for the tests: the CPU on both sides
      if (free(a) || a.st === "jump") control(a, b, inp); else { a.holdBack = !!(a.face > 0 ? inp.l : inp.r); a.holdDown = !!inp.d; }
      const ci = think(b, a);
      if (free(b) || b.st === "jump") control(b, a, ci); else { b.holdBack = !!(b.face > 0 ? ci.l : ci.r); b.holdDown = !!ci.d; }
      // holding back with an attack coming shows the guard
      for (const [f, o] of [[a, b], [b, a]]) if (free(f) && f.holdBack && (o.st === "atk" || (o.atk && !onGround(o)) || g.proj.some((p) => p.owner === o && Math.abs(p.x - f.x) < 70)) && Math.abs(o.x - f.x) < 110) { f.st = "block"; f.crouchBlock = f.holdDown; f.t = 0; f.hs = 6; f.vx = 0; }
    } else {
      for (const f of g.f) { if (free(f)) { f.st = "idle"; f.vx = 0; } f.holdBack = false; }
    }
    stepFighter(a, b); stepFighter(b, a);
    // the hits
    for (const [f, o] of [[a, b], [b, a]]) {
      const at = f.atk;
      if (!at || !at.box || f.atkHit) continue;
      const t = f.t; if (t < at.su || t >= at.su + at.ac) continue;
      const hb = boxOf(f, at.box), hu = hurt(o);
      if (overlap(hb, hu)) { f.atkHit = true; if (HITLOG.length < 400) HITLOG.push({ k: f.atk === SPECIAL[f.id] ? "sp" : Object.keys(ATK).find((n) => ATK[n] === f.atk), d: Math.round(Math.abs(f.x - o.x)), who: f.id }); land(f, o, at, (Math.max(hb[0], hu[0]) + Math.min(hb[2], hu[2])) / 2, (Math.max(hb[1], hu[1]) + Math.min(hb[3], hu[3])) / 2); if (at.dash) f.vx = -f.face * 1.5; }
    }
    // the projectiles
    for (const p of g.proj) {
      p.x += p.vx; p.t++;
      if (p.vy !== undefined) { p.y += p.vy; p.vy += 0.07; if (p.y > -3) { p.dead = true; spark(p.x, -3, "dust"); continue; } }
      if (p.k === "key") { if (!p.back && p.t > 32) { p.back = true; p.vx = -p.vx; } if (p.back && Math.abs(p.x - p.owner.x) < 16) { p.dead = true; continue; } }
      const o = p.owner === a ? b : a, hu = hurt(o), pb = [p.x - 9, p.y - 9, p.x + 9, p.y + 9];
      if (!p.dead && overlap(pb, hu) && o.st !== "down") { if (land(p.owner, o, Object.assign({ hs: 20, bs: 12, push: 2.6, sfx: "heavy", sp: true }, SPECIAL[p.owner.id]), p.x, p.y, p)) p.dead = true; }
      if (p.x < g.camX - 40 || p.x > g.camX + W + 40) p.dead = true;
    }
    for (const p of g.proj) for (const q of g.proj) if (p !== q && p.owner !== q.owner && !p.dead && !q.dead && Math.abs(p.x - q.x) < 14 && Math.abs(p.y - q.y) < 16) { p.dead = q.dead = true; spark((p.x + q.x) / 2, p.y, "burst"); SND.play("block"); }
    g.proj = g.proj.filter((p) => !p.dead);
    // bodies don't overlap; both stay on screen
    // beta 3.35 (the bodies came 15.6 apart in the tests): the bodies never overlap, in the corner too. The overlap is
    // shared between the two, then whatever a wall (the stage's end or the screen's edge) took back from one is given
    // to the other, in the same step; one lying down is not moved, the one standing over him is (a few units a step,
    // so he slides off rather than jumps), so getting up never starts inside the other. The width a touch more (32 units
    // a size, was 30), as the 3.33 bodies are broader: in the clinch only the guards overlap, not the chests
    const pbw = 32 * Math.max(a.sc, b.sc), lo = Math.max(18, g.camX + 18), hi = Math.min(STAGE_W - 18, g.camX + W - 18), near = Math.abs(a.y - b.y) < 70;
    const side = a.x < b.x || (a.x === b.x && a.face > 0) ? 1 : -1; // b to the right of a: 1
    if (near && Math.abs(b.x - a.x) < pbw) {
      const over = pbw - Math.abs(b.x - a.x), ma = a.st === "down" ? 0 : 1, mb = b.st === "down" ? 0 : 1;
      if (ma && mb) { a.x -= side * over / 2; b.x += side * over / 2; }
      else if (ma || mb) { const f = ma ? a : b, d = Math.min(over, 4); f.x += (f === a ? -side : side) * d; }
    }
    for (const f of g.f) f.x = clamp(f.x, lo, hi);
    if (near && a.st !== "down" && b.st !== "down" && Math.abs(b.x - a.x) < pbw - 0.01) { // a wall held one back: the other steps aside the rest
      const aWall = a.x <= lo + 0.01 || a.x >= hi - 0.01, bWall = b.x <= lo + 0.01 || b.x >= hi - 0.01;
      if (aWall && !bWall) b.x = clamp(a.x + side * pbw, lo, hi); else if (bWall && !aWall) a.x = clamp(b.x - side * pbw, lo, hi);
    }
    if (onGround(a) && onGround(b) && a.st !== "down" && b.st !== "down") { const gap = Math.abs(a.x - b.x); stats.minGap = Math.min(stats.minGap ?? 1e9, gap); // for the tests: how close the bodies come
      if (gapWatch && gap < gapWatch && !g.frozen) { const lo = Math.max(18, g.camX + 18), hi = Math.min(STAGE_W - 18, g.camX + W - 18); GAPLOG.push({ gap: +gap.toFixed(1), pbw: +pbw.toFixed(1), x: [+a.x.toFixed(1), +b.x.toFixed(1)], st: [a.st, b.st], vx: [+a.vx.toFixed(2), +b.vx.toFixed(2)], atk: [a.atk ? Object.keys(ATK).find((n) => ATK[n] === a.atk) || "sp" : null, b.atk ? Object.keys(ATK).find((n) => ATK[n] === b.atk) || "sp" : null], edge: [a.x <= lo + 0.01 ? "L" : a.x >= hi - 0.01 ? "R" : "", b.x <= lo + 0.01 ? "L" : b.x >= hi - 0.01 ? "R" : ""], camX: +g.camX.toFixed(1), lo: +lo.toFixed(1), hi: +hi.toFixed(1) }); if (gapFreeze) g.frozen = true; } }
    const goal = clamp((a.x + b.x) / 2 - W / 2, 0, STAGE_W - W); g.camX += (goal - g.camX) * 0.18;
    for (const f of g.f) stepSmoke(f);
  }
  // beta 3.32 (Daniel: "Cristache should blow smoke from his cigarette; he keeps it in his mouth from time to time, the
  // rest of the time he holds it in his hand"): standing or walking he runs a loop: about four seconds with it in his
  // hand, the hand up to the lips, a few seconds with it in his mouth (the guard back up), the hand up again, and as it
  // comes down he breathes the smoke out. Any other move puts it back in the hand (or the fist). The smoke: small grey
  // puffs from wherever the lit end is in the frame drawn, rising, drifting, thinning out
  const CIG_HAND = 240, CIG_UP = 20, CIG_MOUTH = 160, CIG_LOOP = CIG_HAND + CIG_UP * 2 + CIG_MOUTH;
  const cigPhase = (f) => { const n = (f.ct || 0) % CIG_LOOP; return n < CIG_HAND ? "hand" : n < CIG_HAND + CIG_UP ? "up" : n < CIG_HAND + CIG_UP + CIG_MOUTH ? "mouth" : "down"; };
  const emberAt = (f, e) => [f.x + ((f.face > 0 ? e[0] - OX : OX - e[0] - 1) + 0.5) / RS, f.y + (e[1] - OY + 0.5) / RS]; // beta 3.33: the frame's pixels are half a game unit
  function stepSmoke(f) {
    if (!f.S.puff) return;
    if (f.st === "idle" || f.st === "walk") f.ct = (f.ct || 0) + 1; // the loop runs while he stands or walks; any other move
    else if (cigPhase(f) !== "hand") f.ct = Math.ceil((f.ct || 0) / CIG_LOOP) * CIG_LOOP; // takes it out of his mouth (to the hand, the fist)
    const sm = f.smoke || (f.smoke = []), e = frameOf(f).ember;
    f.sk = (f.sk || 0) + 1;
    if (e && f.sk % 6 === 0) { const [x, y] = emberAt(f, e); sm.push({ x, y: y - 1, t: 0, life: 56 + Math.floor(rnd(0, 26)), vx: rnd(-0.06, 0.1), ph: rnd(0, 6) }); }
    if ((f.ct || 0) % CIG_LOOP === CIG_HAND + CIG_UP * 2 + CIG_MOUTH - 4) { // breathing out, as the hand comes down
      const m = f.S.idleM[0].ember; if (m) { const [x, y] = emberAt(f, [m[0] - 5 * RS, m[1] - RS]); for (let i = 0; i < 7; i++) sm.push({ x, y, t: 0, life: 40 + i * 4, vx: f.face * (0.45 + i * 0.06), vy: -0.05 - i * 0.02, ph: i, ex: 1 }); }
    }
    for (const q of sm) { q.t++; q.x += q.vx + Math.sin(q.t * 0.11 + q.ph) * 0.12; q.y -= q.ex ? 0.12 - (q.vy || 0) + q.t * 0.004 : 0.3 + q.t * 0.003; if (q.ex) q.vx *= 0.96; }
    if (sm.length) f.smoke = sm.filter((q) => q.t < q.life);
  }
  // the puffs: one light pixel when new, then a small cloud of two or three, darker and thinner as they rise
  function drawSmoke(ctx, list, cx, oy) { // beta 3.33: in the canvas's pixels (p: one of them, in game units)
    const p = 1 / RS;
    for (const q of list) {
      const k = q.t / q.life, x = Math.round((q.x - cx) * RS) / RS, y = Math.round((q.y + oy) * RS) / RS;
      // a light core with a grey underside, so a puff reads on the white wall as on the dark shopfront
      ctx.globalAlpha = k < 0.35 ? 0.95 : k < 0.65 ? 0.75 : k < 0.85 ? 0.5 : 0.25;
      const lt = k < 0.3 ? "#f6f6fa" : k < 0.65 ? "#dcdce6" : "#c0c0ce", dk = k < 0.65 ? "#8c8ca2" : "#9c9cb0", sz = k < 0.18 ? 1 : k < 0.5 ? 2 : 3;
      ctx.fillStyle = dk; ctx.fillRect(x - p * (sz - 1), y + p, p * (sz + 1), p);
      ctx.fillStyle = lt; ctx.fillRect(x - p * (sz - 1), y - p * (sz - 1), p * (sz + 1), p * sz); if (sz > 1) ctx.fillRect(x - p * (sz - 2), y - p * sz, p * (sz - 1), p);
    }
    ctx.globalAlpha = 1;
  }
  function stepRound(inp) {
    g.pt++;
    const [a, b] = g.f;
    if (g.phase === "intro") {
      if (g.pt === 1) { SND.play("round"); SND.music("fight"); }
      if (g.pt === 64) for (const f of g.f) if (f.st === "intro") { f.st = "idle"; f.t = 0; g.fx.push({ k: "stack", x: f.x - f.face * 30, y: 0, t: 0, life: 1e9 }); }
      if (g.pt === 64) SND.play("fight");
      if (g.pt >= 104) { g.phase = "fight"; g.pt = 0; }
    } else if (g.phase === "fight") {
      g.time -= 1 / 60;
      if (a.hp <= 0 || b.hp <= 0) { g.phase = "ko"; g.pt = 0; g.slow = 48; SND.play("ko"); g.flash = 6; }
      else if (g.time <= 0) { g.time = 0; g.phase = "time"; g.pt = 0; }
    } else if (g.phase === "ko" || g.phase === "time") {
      const loser = a.hp === b.hp ? null : a.hp < b.hp ? a : b, winner = loser ? (loser === a ? b : a) : null;
      if (g.pt === 120 && winner) { winner.st = "win"; winner.t = 0; winner.vx = 0; winner.atk = null; }
      if (g.pt >= 220) endRound(winner);
    } else if (g.phase === "match") {
      if (g.pt >= 200) { g.scene = "result"; g.menu = 0; g.t = 0; SND.music("menu"); }
    }
  }
  function endRound(winner) {
    const [a] = g.f;
    if (winner) g.wins[winner === a ? 0 : 1]++;
    g.perfect = !!winner && winner.hp >= 100;
    if (g.wins[0] >= 2 || g.wins[1] >= 2 || (!winner && g.round >= 5)) {
      if (!winner && g.round >= 5) g.wins[0] = 2;
      g.phase = "match"; g.pt = 0; g.result = g.wins[0] >= 2 ? "win" : "lose"; SND.music(null); SND.play(g.result === "win" ? "win" : "lose");
      return;
    }
    g.round++; resetRound();
  }

  // ===================== 9. drawing the fight =====================
  function frameOf(f) {
    const S = f.S, t = f.t;
    if (f.st === "atk" || (f.atk && !onGround(f))) {
      const a = f.atk, list = a.sp ? S.special : S[a.frames];
      if (list.length === 1 || (!a.fr && a.air)) return list[0];
      const fr = a.fr || [[0], [1], [list.length - 1]], ph = t < a.su ? 0 : t < a.su + a.ac ? 1 : 2, ids = fr[ph];
      if (a.spin && ph === 1) return list[ids[(t >> 3) & 1]];
      const start = ph === 0 ? 0 : ph === 1 ? a.su : a.su + a.ac, len = ph === 0 ? a.su : ph === 1 ? a.ac : a.rc;
      return list[Math.min(list.length - 1, ids[Math.min(ids.length - 1, Math.floor(((t - start) / Math.max(1, len)) * ids.length))])];
    }
    switch (f.st) {
      case "walk": { const n = S.walk.length, i = ((Math.floor(f.walkT / 6) % n) + n) % n; return (S.walkM && cigPhase(f) === "mouth" ? S.walkM : S.walk)[i]; }
      case "crouch": return S.crouch[0];
      case "block": return f.crouchBlock ? S.cblock[0] : S.block[0];
      case "jump": return S.jump[0];
      case "hit": return S.hit[0];
      case "dizzy": return S.dizzy[Math.floor(t / 12) % 2];
      case "fall": return S.fall[0];
      case "down": return S.down[0];
      case "win": return S.win[Math.floor(t / 14) % 2];
      case "intro": return S.intro[0];
      default: { if (S.puff) { const ph = cigPhase(f); if (ph === "up" || ph === "down") return S.puff[0]; if (ph === "mouth") return S.idleM[Math.floor(t / 10) % 4]; } return S.idle[Math.floor(t / 10) % 4]; }
    }
  }
  function drawSprite(ctx, img, x, y, face) {
    hiDraw(ctx, img, x, y, face, img.ax, img.ay); // beta 3.33: at the canvas's pixels, the feet at (x, y)
  }
  function drawProj(ctx, p, cx) {
    const x = Math.round(p.x - cx), y = Math.round(p.y + FLOOR), d = Math.sign(p.vx);
    if (p.k === "wave") {
      // the colour wave: three bands, cyan, magenta, yellow, a crescent that ripples
      const C = ["#2fd6f0", "#f0389a", "#fed012"];
      for (let i = 0; i < 3; i++) for (let k = -12; k <= 12; k++) {
        const bend = Math.round((k * k) / 18), wob = Math.round(Math.sin(p.t * 0.5 + k * 0.4) * 1);
        const xx = x - d * (bend + i * 3) + wob;
        ctx.fillStyle = OUT; ctx.fillRect(xx - 1, y + k, 4, 1);
        ctx.fillStyle = C[i]; ctx.fillRect(xx, y + k, 2, 1);
      }
      ctx.fillStyle = "#ffffff"; ctx.fillRect(x + d * 1, y - 3, 1, 6);
      for (let i = 0; i < 4; i++) { ctx.fillStyle = C[(i + (p.t >> 2)) % 3]; ctx.fillRect(x - d * (14 + i * 5) - 1, y + ((i * 7 + p.t) % 15) - 7, 2, 2); }
    } else if (p.k === "bean") {
      // a roasted coffee bean, turning, with a little smoke
      const ph = Math.floor((p.t + p.i * 2) / 3) % 2;
      ctx.fillStyle = OUT; ctx.fillRect(x - 3 - ph, y - 3 + ph, 6 + ph * 2, 6 - ph * 2); ctx.fillStyle = "#6b3f22"; ctx.fillRect(x - 2 - ph, y - 2 + ph, 4 + ph * 2, 4 - ph * 2);
      ctx.fillStyle = "#2a160c"; if (ph) ctx.fillRect(x - 2, y, 4, 1); else ctx.fillRect(x, y - 2, 1, 4); ctx.fillStyle = "#a8683a"; ctx.fillRect(x - 2 - ph, y - 2 + ph, 1, 1);
      ctx.fillStyle = "rgba(220,220,230,.5)"; ctx.fillRect(x - Math.sign(p.vx) * 6, y - 3 - (p.t % 4), 2, 2);
    } else if (p.k === "key") {
      // Rares's keys: the yellow tag and two keys on a ring, spinning
      const ph = Math.floor(p.t / 3) % 4, wv = ph % 2 ? 4 : 7, hv = ph % 2 ? 9 : 5;
      ctx.fillStyle = OUT; ctx.fillRect(x - wv / 2 - 1, y - hv / 2 - 1, wv + 2, hv + 2);
      ctx.fillStyle = "#ffd23a"; ctx.fillRect(x - wv / 2, y - hv / 2, wv, hv); ctx.fillStyle = "#fff2a0"; ctx.fillRect(x - wv / 2, y - hv / 2, wv, 1);
      const kx = x + (ph < 2 ? 5 : -6), ky = y + (ph % 3 ? 3 : -3);
      ctx.fillStyle = OUT; ctx.fillRect(kx - 1, ky - 2, 5, 4); ctx.fillStyle = "#c9ccd4"; ctx.fillRect(kx, ky - 1, 3, 2); ctx.fillRect(kx + 3, ky, 2, 1);
      ctx.fillStyle = "rgba(255,255,255,.6)"; for (let i = 1; i < 4; i++) ctx.fillRect(x - Math.sign(p.vx) * i * 5, y + ((i + p.t) % 3) - 1, 2, 1);
    } else {
      // the espresso: a little white cup, coffee in it, flying with its steam
      const tilt = Math.floor(p.t / 4) % 2;
      ctx.fillStyle = OUT; ctx.fillRect(x - 6, y - 4 + tilt, 12, 10); ctx.fillRect(x + d * 6 - (d < 0 ? 3 : 0), y - 2 + tilt, 3, 5);
      ctx.fillStyle = "#ffffff"; ctx.fillRect(x - 5, y - 3 + tilt, 10, 8);
      ctx.fillStyle = "#6b3f22"; ctx.fillRect(x - 4, y - 3 + tilt, 8, 2); ctx.fillStyle = "#c98a4a"; ctx.fillRect(x - 2, y - 3 + tilt, 3, 1);
      ctx.fillStyle = "#d8d8e0"; ctx.fillRect(x - 5, y + 3 + tilt, 10, 2);
      ctx.fillStyle = "rgba(255,255,255,.75)";
      for (let i = 0; i < 5; i++) ctx.fillRect(x - d * (8 + i * 5), y - 6 - ((p.t + i * 3) % 6) + Math.round(Math.sin(p.t * 0.3 + i)), 2, 2);
      ctx.fillStyle = "#6b3f22"; ctx.fillRect(x - d * 10, y + 2, 2, 1); ctx.fillRect(x - d * 16, y, 1, 1);
    }
  }
  function drawFx(ctx, e, cx) {
    const x = Math.round(e.x - cx), y = Math.round(e.y + FLOOR), k = e.t / e.life;
    if (e.k === "ghost") { ctx.globalAlpha = 0.35 * (1 - k); drawSprite(ctx, e.img, e.x - cx, e.y + FLOOR, e.face); ctx.globalAlpha = 1; return; }
    if (e.k === "stack") { // the Two Minutes tees I O N brought, folded, on the pavement
      for (let i = 0; i < 6; i++) { const yy = y - 3 - i * 3; ctx.fillStyle = OUT; ctx.fillRect(x - 11, yy - 1, 22, 4); ctx.fillStyle = i % 2 ? "#ffffff" : "#ecebe6"; ctx.fillRect(x - 10, yy, 20, 3); ctx.fillStyle = "#1c1c22"; for (let q = 0; q < 14; q += 3) ctx.fillRect(x - 8 + q, yy + 1, 2, 1); }
      return;
    }
    if (e.k === "dust") { ctx.fillStyle = "rgba(220,210,240," + (0.7 * (1 - k)) + ")"; for (let i = 0; i < 5; i++) ctx.fillRect(x - 10 + i * 5, y - 2 - Math.round(k * 6) - (i % 2) * 2, 3, 2); return; }
    if (e.k === "flash") { const r = Math.round(10 + k * 28); ctx.fillStyle = "rgba(255,255,255," + (1 - k) + ")"; for (let a = 0; a < 12; a++) { const an = (a / 12) * Math.PI * 2; ctx.fillRect(x + Math.round(Math.cos(an) * r) - 1, y + Math.round(Math.sin(an) * r * 0.8) - 1, 3, 3); } ctx.fillRect(x - 6, y - 6, 12, 12); return; }
    const col = e.k === "bspark" ? ["#ffffff", "#7fd8ff"] : ["#ffffff", "#ffe14a", "#ff9d14"], n = e.k === "burst" ? 10 : 8, r = (e.k === "burst" ? 6 : 4) + Math.round(k * (e.k === "burst" ? 16 : 10));
    for (let i = 0; i < n; i++) {
      const an = (i / n) * Math.PI * 2 + 0.3;
      for (let s = 0; s < 3; s++) { ctx.fillStyle = col[Math.min(col.length - 1, s)]; ctx.fillRect(x + Math.round(Math.cos(an) * (r - s * 3)), y + Math.round(Math.sin(an) * (r - s * 3)), 2, 2); }
    }
    if (k < 0.4) { ctx.fillStyle = "#ffffff"; ctx.fillRect(x - 3, y - 3, 6, 6); }
  }
  // a big line over the fight, on a dark band so it reads over the facade
  function banner(ctx, s, fill, sc, y) { const bh = 7 * sc + 13, q = 1 / RS; ctx.fillStyle = "rgba(14,10,26,.74)"; ctx.fillRect(0, y - 6, W, bh); ctx.fillStyle = "rgba(254,208,18,.75)"; ctx.fillRect(0, y - 6 - q, W, q); ctx.fillRect(0, y - 6 + bh, W, q); ctx.fillStyle = "rgba(254,208,18,.3)"; ctx.fillRect(0, y - 6 - 3 * q, W, q); ctx.fillRect(0, y - 6 + bh + 2 * q, W, q); text(ctx, s, W / 2, y, fill, { sc, sh: 2, al: "c" }); } // beta 3.34: the rules one pixel fine, doubled
  function drawFight(ctx, t) {
    const sx = g.shake > 0 ? Math.round(rnd(-g.shake, g.shake)) : 0, sy = g.shake > 0 ? Math.round(rnd(-g.shake, g.shake) * 0.6) : 0;
    const cx = Math.round(g.camX) - sx;
    drawBackdrop(ctx, cx, t, sy);
    if (g.cheerT > 0 && !paused) g.cheerT--;
    drawCrowd(ctx, cx, t, g.cheerT > 0 || g.phase === "ko" && g.pt > 60 || g.phase === "match");
    ctx.save(); ctx.translate(0, sy);
    // shadows
    for (const f of g.f) { const w = Math.round((31 * f.sc - Math.min(16, -f.y / 6)) * RS) / RS, x = Math.round((f.x - cx) * RS) / RS; ctx.fillStyle = "rgba(10,6,24,.45)"; ctx.fillRect(x - w / 2, FLOOR - 2, w, 3); ctx.fillRect(x - w / 2 + 2.5, FLOOR - 3, w - 5, 5); ctx.fillRect(x - w / 2 + 6, FLOOR - 3.5, w - 12, 6); } // beta 3.33: rounder, at the canvas's pixels
    for (const e of g.fx) if (e.k === "ghost" || e.k === "stack") drawFx(ctx, e, cx);
    // the one attacking is drawn in front
    const order = g.f[0].st === "atk" ? [g.f[1], g.f[0]] : [g.f[0], g.f[1]];
    for (const f of order) {
      const jit = (f.st === "hit" || f.st === "block") && g.hitstop > 0 ? (g.hitstop % 2 ? 1 : -1) : 0;
      if (f.inv > 0 && f.inv % 4 < 2 && f.hp > 0) continue;
      const spin = f.atk?.spin && f.t >= f.atk.su && f.t < f.atk.su + f.atk.ac && (f.t >> 2) & 1 ? -1 : 1; // beta 3.11: Maria turns round
      drawSprite(ctx, frameOf(f), f.x - cx + jit, FLOOR + f.y, f.face * spin);
      if (f.st === "dizzy") for (let i = 0; i < 3; i++) { const an = t * 5 + (i * Math.PI * 2) / 3, x = Math.round(f.x - cx + Math.cos(an) * 12), y = Math.round(FLOOR + f.y - 100 * f.sc - 2 + Math.sin(an) * 3); ctx.fillStyle = OUT; ctx.fillRect(x - 2, y - 2, 5, 5); ctx.fillStyle = i === 1 ? "#ffffff" : "#ffe14a"; ctx.fillRect(x - 1, y - 1, 3, 3); }
    }
    for (const f of g.f) { // beta 3.32: the smoke, and the lit end glowing now and then
      if (f.smoke) drawSmoke(ctx, f.smoke, cx, FLOOR);
      const e = f.S.puff && !(f.inv > 0 && f.inv % 4 < 2) ? frameOf(f).ember : null;
      if (e && Math.floor(t * 7) % 3 === 0) { const [x, y] = emberAt(f, e); ctx.fillStyle = "#ffe08a"; ctx.fillRect(Math.floor((x - cx) * RS) / RS, Math.floor((y + FLOOR) * RS) / RS, 1 / RS, 1 / RS); }
    }
    for (const p of g.proj) drawProj(ctx, p, cx);
    for (const e of g.fx) if (e.k !== "ghost" && e.k !== "stack") drawFx(ctx, e, cx);
    ctx.restore();
    if (g.flash > 0) { ctx.fillStyle = "rgba(255,255,255," + Math.min(0.75, g.flash / 10) + ")"; ctx.fillRect(0, 0, W, H); }
    drawHUD(ctx, g, t);
    // the banners
    if (g.phase === "intro") {
      if (g.pt < 64) { const fin = g.round === 1 ? "ROUND 1" : g.wins[0] === 1 && g.wins[1] === 1 ? "FINAL ROUND" : "ROUND " + g.round; banner(ctx, fin, GOLD, g.pt < 6 ? 6 : 4, 84); }
      // the stage, named once, at the start of the match
      if (g.round === 1 && g.pt < 64) { ctx.fillStyle = "rgba(14,10,26,.72)"; ctx.fillRect(0, H - 22, W, 16); text(ctx, "TWO MINUTES COFFEE SHOP - ARICESCU 50A, BUCHAREST", W / 2, H - 18, "#ffffff", { al: "c" }); }
      if (g.pt >= 64) banner(ctx, "FIGHT!", RED, g.pt < 70 ? 7 : 6, 80); // beta 3.34: the round's name first (it was drawn over for the whole intro in rounds 2+), FIGHT! in the second half
    } else if (g.phase === "ko" && g.pt < 150) banner(ctx, "K.O.", RED, g.pt < 8 ? 9 : 7, 72);
    else if (g.phase === "time" && g.pt < 150) banner(ctx, g.f[0].hp === g.f[1].hp ? "DRAW" : "TIME", GOLD, 6, 78);
    else if (g.phase === "match") { banner(ctx, g.result === "win" ? "YOU WIN" : ROSTER[g.cpu].name + " WINS", g.result === "win" ? GOLD : RED, ROSTER[g.cpu].name.length > 6 && g.result !== "win" ? 4 : 5, 70); if (g.perfect && g.result === "win") text(ctx, "PERFECT!", W / 2, 112, "#ffffff", { sc: 2, al: "c" }); }
    if ((g.phase === "ko" || g.phase === "time") && g.pt > 150 && g.pt < 220) { const [a, b] = g.f; if (a.hp !== b.hp) banner(ctx, (a.hp > b.hp ? a : b).R.name + " WINS THE ROUND", "#ffffff", 2, 86); }
    if (paused) { // beta 3.15 (Daniel): the menu, any time: play on, pick other fighters, or go back to the map
      ctx.fillStyle = "rgba(14,10,26,.78)"; ctx.fillRect(0, 0, W, H); banner(ctx, "PAUSE", GOLD, 4, 46);
      PAUSE_ITEMS.forEach((s2, i) => {
        const y = 96 + i * 24, on = pmenu === i, w = 170;
        button(ctx, W / 2 - w / 2, y - 5, w, 18, on);
        text(ctx, (on ? "> " : "") + s2, W / 2, y, on ? OUT : "#ffffff", { al: "c", ol: on ? null : OUT });
        hit(W / 2 - w / 2, y - 6, w, 20, () => { pmenu = i; pausePick(i); });
      });
      if (!TOUCH) text(ctx, "P RESUME - ESC FOR THE MAP - UP/DOWN + ENTER", W / 2, 176, "#a99cc8", { al: "c" });
    }
  }
  // beta 3.16 (Daniel): beat the CPU and win a batch brew on the house at Two Minutes. The win screen is a voucher:
  // a screenshot of it is shown at the counter. One code per win: the date, the time, four random characters
  const CODE_AB = "ACDEFGHJKLMNPQRTUVWXY34679";
  function makeVoucher() {
    const d = new Date(), p2 = (n) => String(n).padStart(2, "0");
    let rnd4 = ""; try { const a = new Uint32Array(4); crypto.getRandomValues(a); for (const v of a) rnd4 += CODE_AB[v % CODE_AB.length]; } catch { for (let i = 0; i < 4; i++) rnd4 += CODE_AB[Math.floor(Math.random() * CODE_AB.length)]; }
    return { code: `TM-${rnd4}-${p2(d.getDate())}${p2(d.getMonth() + 1)}`, date: `${p2(d.getDate())}.${p2(d.getMonth() + 1)}.${d.getFullYear()}  ${p2(d.getHours())}:${p2(d.getMinutes())}` };
  }
  // beta 3.30 (Daniel): after the match, always the same little scene: I O N, Cristache and Rares jump-starting the
  // yellow Dacia (the site's car) in front of Two Minutes, the bonnet up, cables from a battery, sparks. The voucher (a
  // win) or the try-again (a loss) sits on its right
  // beta 3.33 (Daniel: "they should charge it from the La Marzocco espresso machine in the shop's window; the La
  // Marzocco should be visible"): the shop's espresso machine, on the counter in the window: the wide polished steel
  // body, red side panels, three chrome group heads with their portafilters, the steam wands, two pressure gauges, the
  // nameplate, the cup rail on top (the cups are drawn on their own, so they can rattle). At the canvas's pixels,
  // 84x56, the counter under its feet. MZ: where it stands on the street, in game units
  const MZ = { x: 106, y: 121, w: 50, h: 31 }; // beta 3.36: at 1x, filling the window's left pane
  let MZ_IMG = null;
  function marzocco() { // beta 3.36: the La Marzocco at the game's own pixels, 50x31: steel, red side panels, two gauges, the name, three group heads
    if (MZ_IMG) return MZ_IMG;
    const [c, x] = mk(50, 31), px = (a, b, col) => { x.fillStyle = col; x.fillRect(a, b, 1, 1); }, rect = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
    const ST = ["#ffffff", "#e4e8ee", "#c4c9d4", "#9aa0ae", "#6a707e"], RD = ["#ff7a5a", "#e8402c", "#b8261a", "#7a140e"];
    rect(0, 6, 50, 1, OUT); rect(1, 5, 48, 3, OUT); rect(2, 6, 46, 1, ST[1]); for (const xx of [1, 24, 47]) rect(xx, 3, 2, 3, OUT); // the cup rail
    rect(0, 8, 50, 18, OUT); for (let yy = 9; yy < 25; yy++) for (let xx = 1; xx < 49; xx++) px(xx, yy, ST[yy === 9 ? 0 : yy > 21 ? 3 : xx % 5 === 0 ? 3 : 2]);
    for (const x0 of [1, 44]) { rect(x0, 9, 5, 16, RD[2]); rect(x0, 9, 5, 1, RD[0]); rect(x0 + (x0 === 1 ? 0 : 4), 10, 1, 15, RD[3]); rect(x0 + (x0 === 1 ? 1 : 3), 10, 1, 13, RD[1]); }
    for (const gx of [10, 39]) { rect(gx - 2, 10, 5, 4, OUT); rect(gx - 1, 10, 3, 3, "#fbfaf4"); px(gx, 11, "#d8342a"); }
    tiny(x, "LA", 23, 9, "#2a2a30"); rect(8, 15, 34, 7, OUT); rect(9, 16, 32, 5, "#1c1a20"); tiny(x, "MARZOCCO", 9, 16, "#f2f2f6");
    for (const gx of [15, 25, 35]) { rect(gx - 3, 22, 7, 4, OUT); rect(gx - 2, 22, 5, 2, ST[0]); rect(gx - 2, 24, 5, 1, ST[3]); rect(gx - 7, 25, 4, 2, OUT); rect(gx - 6, 25, 3, 1, "#3a3638"); } // the group heads, the handles
    for (const [x0, d] of [[7, -1], [43, 1]]) for (let i = 0; i < 6; i++) { px(x0 + (i > 3 ? d : 0), 22 + i, OUT); } // the steam wands
    rect(0, 26, 50, 4, OUT); for (let xx = 1; xx < 49; xx++) { px(xx, 27, ST[1]); px(xx, 28, xx % 2 ? "#2a2a30" : ST[3]); } rect(3, 30, 3, 1, OUT); rect(44, 30, 3, 1, OUT); // the drip tray, the feet
    return (MZ_IMG = c);
  }
  // the cups on the rail (game units: MZ), rattling when shake > 0; and the steam from the right wand
  function drawCups(ctx, ox, oy, t, shake) {
    const p = 1 / RS;
    for (let i = 0; i < 5; i++) {
      const jx = shake ? Math.round(Math.sin(t * 50 + i * 2.1)) * p : 0, jy = shake && (Math.floor(t * 24) + i) % 3 === 0 ? -p : 0, x0 = ox + 6 + i * 8 + jx, y0 = oy + 1 + jy;
      ctx.fillStyle = OUT; ctx.fillRect(x0 - p, y0 - p, 4 + 2 * p, 3 + 2 * p); ctx.fillRect(x0 + 4, y0 + p, 1.5, 1.5);
      ctx.fillStyle = i % 2 ? "#f4f2ec" : "#ffffff"; ctx.fillRect(x0, y0, 4, 3); ctx.fillStyle = "#c8c2b8"; ctx.fillRect(x0, y0 + 3 - p, 4, p); ctx.fillRect(x0 + 3, y0, 1, 3);
    }
  }
  // beta 3.33: the yellow Dacia, redrawn at the canvas's pixels (300x150) and facing left, so its bonnet opens towards
  // the shop: a three-box saloon, chrome round the glass, the doors and their handles, the bonnet up on its rod over the
  // engine (the battery's two terminals where the clamps go: CAR.clamps), the name on the boot, no badge
  let CAR = null;
  function carRight() { // the yellow saloon, side on, facing right, the bonnet up
    if (CAR) return CAR;
    const [c, x] = mk(176, 76), Y = ramp("#f2c21a"), gy = 70;
    const P = (pts, col) => { x.fillStyle = col; x.beginPath(); x.moveTo(pts[0][0], pts[0][1]); for (const q of pts.slice(1)) x.lineTo(q[0], q[1]); x.closePath(); x.fill(); };
    const hx3 = (v) => "#" + [v & 255, (v >> 8) & 255, (v >> 16) & 255].map((n) => n.toString(16).padStart(2, "0")).join("");
    const Yc = Y.map(hx3);
    const body = [[4, 44], [8, 36], [44, 34], [58, 20], [100, 20], [116, 36], [166, 40], [170, 48], [168, 60], [6, 60], [3, 52]];
    x.save(); x.translate(1, 1); P(body, OUT); x.restore(); P(body.map(([a2, b2]) => [a2 - 1, b2 - 1]), OUT);
    P(body, Yc[2]);
    P([[8, 37], [44, 35], [58, 21], [100, 21], [114, 36], [166, 41], [166, 44], [6, 44]], Yc[1]); // the upper body in the light
    x.fillStyle = Yc[0]; x.fillRect(10, 37, 34, 1); x.fillRect(116, 39, 48, 1); x.fillRect(58, 21, 42, 1);
    x.fillStyle = Yc[3]; x.fillRect(6, 52, 162, 7); x.fillStyle = Yc[4]; x.fillRect(6, 58, 162, 2);
    // the windows, the pillars, the chrome round them
    P([[48, 34], [60, 22], [77, 22], [77, 34]], "#c9ccd4"); P([[80, 22], [99, 22], [111, 34], [80, 34]], "#c9ccd4");
    P([[50, 33], [61, 23], [76, 23], [76, 33]], "#3a4a5e"); P([[81, 23], [98, 23], [109, 33], [81, 33]], "#3a4a5e");
    x.fillStyle = "#6a7e96"; x.fillRect(62, 24, 6, 2); x.fillRect(84, 24, 6, 2);
    // the doors, the handles, the chrome strip
    x.fillStyle = Yc[4]; x.fillRect(78, 35, 1, 22); x.fillRect(112, 37, 1, 20); x.fillRect(47, 35, 1, 22);
    x.fillStyle = "#c9ccd4"; x.fillRect(66, 40, 5, 1); x.fillRect(100, 41, 5, 1); x.fillRect(8, 47, 158, 1);
    // the bumpers, the lights, the badge
    x.fillStyle = OUT; x.fillRect(0, 48, 10, 6); x.fillRect(164, 48, 12, 6); x.fillStyle = "#d8dbe2"; x.fillRect(1, 49, 8, 4); x.fillRect(165, 49, 10, 4); x.fillStyle = "#ffffff"; x.fillRect(166, 49, 8, 1);
    x.fillStyle = "#c81e1e"; x.fillRect(4, 40, 3, 5); x.fillStyle = "#fff2b0"; x.fillRect(164, 42, 3, 4);

    // the wheels
    for (const wx of [34, 136]) { x.fillStyle = OUT; x.beginPath(); x.arc(wx, gy - 10, 11, 0, Math.PI * 2); x.fill(); x.fillStyle = "#2a2a30"; x.beginPath(); x.arc(wx, gy - 10, 10, 0, Math.PI * 2); x.fill(); x.fillStyle = "#c9ccd4"; x.beginPath(); x.arc(wx, gy - 10, 5, 0, Math.PI * 2); x.fill(); x.fillStyle = "#ffffff"; x.fillRect(wx - 3, gy - 14, 2, 2); x.fillStyle = "#8a8e98"; x.fillRect(wx - 1, gy - 11, 2, 2); }
    // the engine showing over the wing, the bonnet up on its hinge
    x.fillStyle = "#3a3a42"; x.fillRect(118, 32, 44, 6); x.fillStyle = "#9a9ea8"; x.fillRect(124, 29, 14, 7); x.fillRect(142, 30, 8, 5); x.fillStyle = "#5a5e68"; x.fillRect(126, 31, 10, 2); x.fillStyle = "#d8342a"; x.fillRect(152, 31, 4, 3);
    P([[114, 35], [156, 2], [162, 6], [118, 37]], OUT); P([[115, 34], [156, 4], [160, 7], [118, 36]], Yc[3]); P([[116, 34], [154, 6], [156, 8], [118, 35]], Yc[1]);
    x.fillStyle = "#9a9ea8"; x.fillRect(136, 18, 1, 16); // the prop rod
    return c;
  }
  function carDacia() { // beta 3.36: the 1x saloon turned to face the shop (the bonnet towards the window), the name on the boot the right way round
    if (CAR) return CAR;
    const src = carRight(), [c, x] = mk(src.width, src.height); x.translate(src.width, 0); x.scale(-1, 1); x.drawImage(src, 0, 0); x.setTransform(1, 0, 0, 1, 0, 0);
    tiny(x, "DACIA", src.width - 31, 41, "#7a5a10"); c.clamps = [[22, 32], [30, 32]];
    return (CAR = c);
  }
  // beta 3.33 (Daniel): the jump-start, now from the La Marzocco: the camera on the shop window, the machine on the
  // counter inside, its left pane pushed open a crack and the two cables out through it, across the pavement, up to the
  // battery under the Dacia's bonnet (parked facing the shop). Cristache by the window feeding the cables (smoking),
  // I O N bent over the engine, Rares at the back cheering. A loop: the clamps spark while it cranks; then it catches:
  // a puff of steam from the wand, the cups rattle on the rail, the car shakes, a puff from the exhaust
  const END_POSES = {
    cristache: pose({ hip: [0, -47], neck: [5, -75], head: [8, -86], eF: [15, -60], hF: [24, -58], eB: [9, -58], hB: [18, -55], kF: [8, -24], fF: [12, 0], kB: [-6, -24], fB: [-10, 0], tw: 0.4 }),
    ion: pose({ hip: [0, -44], neck: [14, -66], head: [18, -74], eF: [26, -52], hF: [36, -46], eB: [20, -52], hB: [32, -42], kF: [10, -23], fF: [14, 0], kB: [-8, -22], fB: [-14, 0], tw: 0.5 }),
    rares: pose({ eF: [16, -88], hF: [22, -104], eB: [-6, -88], hB: [-2, -104], kF: [10, -24], fF: [14, 0], kB: [-8, -23], fB: [-14, 0] })
  };
  const END_FR = {}, END_SC = 0.92; // a size that suits the car
  const endFrame = (id) => { if (END_FR[id]) return END_FR[id]; const L0 = LOOKS[id]; NPC_LOOKS["end_" + id] = Object.assign({}, L0, { headId: id, hands: "bare", full: true, build: Object.assign({}, L0.build, { sc: END_SC * (L0.build.sc || 1) }) }); return (END_FR[id] = drawFighter("end_" + id, L0.smokes ? Object.assign({}, END_POSES[id], { cig: "mouth" }) : END_POSES[id], null)); };
  const END_CAM = -48, END_CAR = 258, END_LOOP = 3.2; // the window at the middle of the picture, the card on its left, the car running out on the right
  function drawEnding(ctx, t) {
    const gy = FLOOR - 4, p = 1 / RS, lt = t % END_LOOP, caught = lt > 2.2, k2 = caught ? (lt - 2.2) / (END_LOOP - 2.2) : 0;
    drawBackdrop(ctx, END_CAM, t, 0, false);
    const mx = MZ.x - END_CAM, my = MZ.y;
    drawCups(ctx, mx, my, t, caught && k2 < 0.6);
    // the left pane pushed open a crack: a dark slit, the glass edge catching the light
    ctx.fillStyle = "#1c1612"; ctx.fillRect(mx + 46, 106, 2, 64); ctx.fillStyle = "#c6dbe8"; ctx.fillRect(mx + 48, 106, p, 64);
    // the car, shaking a little once it runs; its shadow
    const shk = caught && k2 < 0.7 ? (Math.floor(t * 30) % 2 ? p : 0) : 0, car = carDacia(), cy0 = gy - 74 + shk;
    ctx.fillStyle = "rgba(10,6,24,.35)"; ctx.fillRect(END_CAR + 6, gy - 2, 170, 4);
    ctx.drawImage(car, END_CAR, cy0);
    // the cables: from the back of the machine, out through the slit, down across the pavement, up to the terminals
    const [c1, c2] = car.clamps.map(([a, b]) => [END_CAR + a, cy0 + b]);
    const cable = (pts, col) => { // a cable in the canvas's pixels: its outline, then its colour, along a smooth curve
      const P2 = (u) => { const n = pts.length - 1, i = Math.min(n - 1, Math.floor(u * n)), f = u * n - i, a = pts[i], b = pts[i + 1], m0 = pts[Math.max(0, i - 1)], m3 = pts[Math.min(n, i + 2)]; const h = (q) => 0.5 * (2 * a[q] + (-m0[q] + b[q]) * f + (2 * m0[q] - 5 * a[q] + 4 * b[q] - m3[q]) * f * f + (-m0[q] + 3 * a[q] - 3 * b[q] + m3[q]) * f * f * f); return [h(0), h(1)]; };
      for (const [w, c] of [[2, OUT], [1, col]]) { ctx.fillStyle = c; for (let i = 0; i <= 240; i++) { const [x, y] = P2(i / 240); ctx.fillRect(Math.round(x * RS) / RS - (w - 1) * p / 2, Math.round(y * RS) / RS - (w - 1) * p / 2, w * p, w * p); } }
    };
    cable([[mx + 44, my + 18], [mx + 47, my + 26], [mx + 49, my + 42], [mx + 54, gy - 2], [mx + 64, gy - 1], [c1[0] - 4, gy - 8], [c1[0], c1[1] + 4], [c1[0], c1[1]]], "#e8301c");
    cable([[mx + 45, my + 20], [mx + 47, my + 29], [mx + 50, my + 45], [mx + 57, gy - 1], [mx + 68, gy], [c2[0] - 2, gy - 6], [c2[0], c2[1] + 4], [c2[0], c2[1]]], "#2a2a30");
    for (const [cx, cyy] of [c1, c2]) { const red = cx === c1[0], X = Math.round(cx * RS) / RS, Y = Math.round(cyy * RS) / RS; ctx.fillStyle = OUT; ctx.fillRect(X - 2, Y - 1.5, 4, 3.5); ctx.fillStyle = red ? "#e8301c" : "#3a3a42"; ctx.fillRect(X - 1.5, Y - 1, 3, 1.5); ctx.fillStyle = red ? "#ff8a6e" : "#6a6a74"; ctx.fillRect(X - 1.5, Y - 1, 3, p); ctx.fillStyle = "#c9ccd4"; ctx.fillRect(X - 1.5, Y + 0.5, 1, 1.5); ctx.fillRect(X + 0.5, Y + 0.5, 1, 1.5); } // the clamps: the grip in the cable's colour, the steel jaws
    // the three of them
    const put3 = (id, x2, face) => { const im = endFrame(id); hiDraw(ctx, im, x2, gy, face, im.ax, im.ay); };
    put3("rares", END_CAR + 104, -1); put3("ion", END_CAR + 50, -1); put3("cristache", mx + 76, 1);
    { const im = endFrame("cristache"), e = im.ember; if (e) for (let i = 0; i < 5; i++) { // beta 3.32: and he smokes while they work
      const a = (t * 0.5 + i / 5) % 1, x = mx + 76 + (e[0] - OX) / RS + Math.sin(a * 6 + i) * (1 + a * 3) + a * 3, y = gy + (e[1] - OY) / RS - 2 - a * 26;
      ctx.globalAlpha = a < 0.4 ? 0.85 : a < 0.7 ? 0.55 : 0.3; ctx.fillStyle = a < 0.35 ? "#eeeef4" : a < 0.7 ? "#cfcfdc" : "#a8a8ba"; ctx.fillRect(Math.round(x * RS) / RS, Math.round(y * RS) / RS, a < 0.3 ? p : 2 * p, p); if (a > 0.5) ctx.fillRect(Math.round(x * RS) / RS + p, Math.round(y * RS) / RS - p, p, p);
    } ctx.globalAlpha = 1; }
    // the sparks at the clamps while it cranks
    if (!caught || k2 < 0.3) for (const [sx, sy] of [c1, c2]) for (let i = 0; i < 7; i++) { const an = (i / 7) * Math.PI * 2 + t * 9, r2 = 1.5 + ((Math.floor(t * 14) + i) % 4) * 1.6; ctx.fillStyle = i % 3 === 0 ? "#ffffff" : i % 3 === 1 ? "#ffd23a" : "#ff9d14"; ctx.fillRect(Math.round((sx + Math.cos(an) * r2) * RS) / RS, Math.round((sy + Math.sin(an) * r2) * RS) / RS, 2 * p, 2 * p); }
    // it catches: the steam out of the wand, the exhaust's puff
    if (caught) {
      const puff = (x0, y0, dx, dy, n, col, s0) => { for (let i = 0; i < n; i++) { const a = Math.min(1, k2 * 1.6 + i * 0.04), r2 = s0 * (0.4 + a), x = x0 + dx * a * 18 + Math.sin(i * 2.3) * r2, y = y0 + dy * a * 18 + Math.cos(i * 1.7) * r2 * 0.7; ctx.globalAlpha = Math.max(0, 0.9 - a * 0.8); ctx.fillStyle = i % 3 ? col : "#ffffff"; ctx.fillRect(Math.round(x * RS) / RS, Math.round(y * RS) / RS, 2 + (i % 3), 1.5 + (i % 2)); } ctx.globalAlpha = 1; };
      puff(mx + 7, my + 27, -0.4, -1.1, 14, "#e8ecf4", 3);
      puff(END_CAR + 150, gy - 8, 0.8, -0.5, 10, "#9a9aac", 2.4);
    }
  }
  // a menu button at the canvas's pixels: a fine outline, lit along its top, the chosen one gold (beta 3.34)
  function button(ctx, x, y, w, h, on) { const q = 1 / RS; ctx.fillStyle = OUT; ctx.fillRect(x - 2 * q, y - 2 * q, w + 4 * q, h + 4 * q); ctx.fillStyle = on ? "#fed012" : "#2d2550"; ctx.fillRect(x, y, w, h); ctx.fillStyle = on ? "#fff27a" : "#3e3470"; ctx.fillRect(x, y, w, q); ctx.fillStyle = on ? "#c99a10" : "#211a40"; ctx.fillRect(x, y + h - q, w, q); }
  function drawResult(ctx, t) {
    drawEnding(ctx, t);
    const win = g.result === "win", cpuN = ROSTER[g.cpu].name, px0 = 4, pw = 148; // beta 3.33: the card on the left, the jump-start at the window on the right
    if (win) { // the voucher, a cream ticket
      if (!g.voucher) g.voucher = makeVoucher();
      const v = g.voucher, y0 = 6, h = 146;
      ctx.fillStyle = OUT; ctx.fillRect(px0 - 1, y0 - 1, pw + 2, h + 2); ctx.fillStyle = "#f6efdc"; ctx.fillRect(px0, y0, pw, h);
      ctx.fillStyle = "#e8dcbc"; for (let y = y0 + 2; y < y0 + h; y += 4) ctx.fillRect(px0, y, pw, 1);
      ctx.fillStyle = "#1b1438"; for (let x = px0 + 3; x < px0 + pw - 2; x += 6) ctx.fillRect(x, y0 + 50, 3, 1);
      text(ctx, "YOU WON", px0 + pw / 2, y0 + 6, GOLD, { sc: 2, al: "c" });
      text(ctx, "A BATCH BREW", px0 + pw / 2, y0 + 24, "#1b1438", { al: "c", ol: null });
      text(ctx, "ON THE HOUSE", px0 + pw / 2, y0 + 35, "#1b1438", { al: "c", ol: null });
      text(ctx, "SHOW THIS AT TWO MINUTES", px0 + pw / 2, y0 + 58, "#7a5a40", { al: "c", ol: null });
      text(ctx, "ARICESCU 50A - ONE PER WIN", px0 + pw / 2, y0 + 69, "#7a5a40", { al: "c", ol: null });
      text(ctx, "YOUR CODE", px0 + pw / 2, y0 + 86, "#7a5a40", { al: "c", ol: null });
      text(ctx, v.code, px0 + pw / 2, y0 + 98, ["#1b1438", "#2a2148", "#3a2f6a"], { sc: 2, al: "c", ol: null });
      text(ctx, v.date, px0 + pw / 2, y0 + 126, "#1b1438", { al: "c", ol: null });
    } else {
      ctx.fillStyle = "rgba(20,15,40,.9)"; ctx.fillRect(px0, 6, pw, 146);
      text(ctx, cpuN, px0 + pw / 2, 14, RED, { sc: cpuN.length > 7 ? 1 : 2, sh: 1, al: "c" });
      text(ctx, "WINS", px0 + pw / 2, 34, RED, { sc: 2, sh: 1, al: "c" });
      text(ctx, "TRY AGAIN!", px0 + pw / 2, 64, GOLD, { sc: 2, al: "c" });
      text(ctx, "WIN FOR A BATCH BREW", px0 + pw / 2, 96, "#ffd23a", { al: "c" });
      text(ctx, "ON THE HOUSE", px0 + pw / 2, 107, "#ffd23a", { al: "c" });
      text(ctx, g.cpu === "ion" ? "TWO MINUTES WERE ENOUGH." : "ONE MORE COFFEE?", px0 + pw / 2, 128, "#ffffff", { al: "c" });
    }
    const items = ["REMATCH", "CHANGE FIGHTERS", "BACK TO MAP"], mx = px0 + pw / 2, w = pw;
    items.forEach((s2, i) => {
      const y = 160 + i * 19, on = g.menu === i;
      button(ctx, mx - w / 2, y - 4, w, 15, on);
      text(ctx, (on ? "> " : "") + s2, mx, y - 1, on ? OUT : "#ffffff", { al: "c", ol: on ? null : OUT });
      hit(mx - w / 2, y - 5, w, 17, () => { if (g.menu !== i) { g.menu = i; SND.play("select"); } pick(i); });
    });
  }
  function pick(i) {
    SND.play("confirm");
    if (i === 0) newMatch(g.me, g.cpu);
    else if (i === 1) { scene = "select"; SEL.phase = "p1"; g = null; SND.music("menu"); }
    else backToMap();
  }

  // ===================== 10. the page: canvas, keys, touch, the loop =====================
  let root = null, cv = null, cx2 = null, scene = "title", sceneT = 0, paused = false, hits = [], stats = { fps: 0, frames: 0, t0: 0, bake: 0, spr: {}, lazy: 0 };
  const hit = (x, y, w, h, fn) => hits.push({ x, y, w, h, fn });
  const KEYMAP = { ArrowLeft: "l", KeyA: "l", ArrowRight: "r", KeyD: "r", ArrowUp: "u", KeyW: "u", ArrowDown: "d", KeyS: "d", KeyJ: "p", KeyZ: "p", KeyK: "k", KeyX: "k", KeyL: "s", KeyC: "s", Enter: "ok", Space: "ok" };
  const held = { l: 0, r: 0, u: 0, d: 0, p: 0, k: 0, s: 0, ok: 0 }, pressed = new Set();
  const press = (k) => { if (!held[k]) pressed.add(k); held[k] = 1; };
  const release = (k) => { held[k] = 0; };
  // beta 3.16 (Daniel): on a phone the game is played sideways. Held upright it shows a "rotate your phone" screen;
  // on Android the first tap asks for full screen and locks landscape (where the browser allows it); where it can't
  // be locked (iPhone, or a rotation lock), after 3 s a button turns the game itself 90 degrees ("play sideways")
  let SIDEWAYS = false, rotSince = 0, cvBox = { left: 0, top: 0, w: 1, h: 1 };
  const toLocal = (x, y) => (SIDEWAYS ? [y, innerWidth - x] : [x, y]);
  async function lockLandscape() {
    if (!TOUCH) return;
    try { const el = document.documentElement; if (!document.fullscreenElement && el.requestFullscreen) await el.requestFullscreen({ navigationUI: "hide" }); } catch {}
    try { if (screen.orientation && screen.orientation.lock) await screen.orientation.lock("landscape"); } catch {}
  }
  function unlockLandscape() { try { screen.orientation?.unlock?.(); } catch {} try { if (document.fullscreenElement) document.exitFullscreen(); } catch {} }
  function backToMap() {
    SND.music(null); unlockLandscape();
    try { if (window.parent !== window && window.parent.location.origin === location.origin) { window.parent.postMessage({ cz: "gloves-close" }, location.origin); return; } } catch {}
    location.href = "/?map";
  }
  const PAUSE_ITEMS = ["RESUME", "CHANGE FIGHTERS", "BACK TO MAP"];
  let pmenu = 0;
  function pausePick(i) {
    SND.play("confirm");
    if (i === 0) return setPause(false);
    paused = false;
    if (i === 1) { scene = "select"; SEL.phase = "p1"; g = null; SND.music("menu"); return; }
    backToMap();
  }
  function setPause(v) { if (scene !== "game" || !g || g.scene !== "fight" || g.phase === "match") v = false; if (paused === v) return; paused = v; pmenu = 0; SND.play("pause"); if (paused) for (const k in held) held[k] = 0; }
  // the select screen: Player 1 picks, then picks the CPU (I O N first), "?" is any fighter at random
  const SEL = { phase: "p1", p1: 0, cpu: GRID.order.indexOf("ion") };
  function selConfirm() {
    if (SEL.phase === "p1") { SEL.phase = "cpu"; SND.play("confirm"); return; }
    const a = GRID.order[SEL.p1], b = GRID.order[SEL.cpu];
    newMatch(a === "random" ? pickRandom() : a, b === "random" ? pickRandom() : b); scene = "game";
  }
  function menuInput() {
    const P = (k) => pressed.has(k);
    if (scene === "title") { if (P("ok") || P("p") || P("k")) { scene = "select"; sceneT = 0; SND.play("confirm"); SND.music("menu"); lockLandscape(); } return; }
    if (scene === "select") {
      const k = SEL.phase === "p1" ? "p1" : "cpu", n = GRID.order.length, c = GRID.cols;
      const move = (d) => { SEL[k] = (SEL[k] + d + n) % n; SEL.moved = sceneT; SND.play("select"); };
      if (P("l")) move(-1); if (P("r")) move(1); if (P("u")) move(-c); if (P("d")) move(c);
      if (P("ok") || P("p")) selConfirm();
      else if (P("k") && SEL.phase === "cpu") { SEL.phase = "p1"; SND.play("pause"); }
      return;
    }
    if (g && g.scene === "result") {
      if (P("u") || P("l")) { g.menu = (g.menu + 2) % 3; SND.play("select"); }
      if (P("d") || P("r")) { g.menu = (g.menu + 1) % 3; SND.play("select"); }
      if (P("ok") || P("p")) pick(g.menu);
    }
  }
  function step() {
    sceneT += 1 / 60;
    if (scene !== "game" || !g || g.scene !== "fight") menuInput();
    if (scene === "game" && g) {
      g.t += 1 / 60;
      if (g.scene === "vs") { if (g.t > 2.6 || (g.t > 0.8 && (pressed.has("ok") || pressed.has("p")))) { g.scene = "fight"; g.t = 0; } }
      else if (g.scene === "fight" && !paused) {
        const inp = { l: held.l, r: held.r, u: held.u, d: held.d, pp: pressed.has("p"), kp: pressed.has("k"), sp: pressed.has("s") };
        for (const e of g.fx) e.t++; g.fx = g.fx.filter((e) => e.t < e.life);
        if (g.flash > 0) g.flash--;
        if (g.shake > 0 && !g.hitstop) g.shake = Math.max(0, g.shake - 0.35);
        if (g.frozen) {} // for the tests: held on the frame where the bodies came too close
        else if (g.hitstop > 0) g.hitstop--;
        else if (g.slow > 0 && g.slow-- % 3) {} // the K.O. in slow motion
        else stepFight(inp);
        stepRound(inp);
      }
    }
    pressed.clear();
  }
  function draw(t) {
    hits = [];
    const ctx = cx2;
    ctx.setTransform(RS, 0, 0, RS, 0, 0); // beta 3.33: every screen is laid out in the game's units
    ctx.imageSmoothingEnabled = false;
    if (scene === "title") { drawTitle(ctx, t); hit(0, 0, W, H, () => pressed.add("ok")); }
    else if (scene === "select") {
      drawSelect(ctx, t, SEL);
      GRID.order.forEach((id, i) => { const [x, y] = tilePos(i); hit(x - 3, y - 3, TILE + 6, TILE + 6, () => { const k = SEL.phase === "p1" ? "p1" : "cpu"; if (SEL[k] === i) pressed.add("ok"); else { SEL[k] = i; SEL.moved = sceneT; SND.play("select"); } }); });
      if (SEL.phase === "cpu") hit(235, 31, 70, 70, () => { SEL.phase = "p1"; SND.play("pause"); });
    } else if (g) {
      if (g.scene === "vs") { drawVS(ctx, g.t, g.me, g.t, g.cpu); hit(0, 0, W, H, () => pressed.add("ok")); }
      else if (g.scene === "fight") drawFight(ctx, t);
      else drawResult(ctx, t);
    }
  }
  // the layout: the picture as big as it fits (whole multiples on a laptop), the controls under it on a phone held
  // upright, over its lower corners when held sideways
  function layout() {
    let vw = innerWidth, vh = innerHeight;
    if (TOUCH && SIDEWAYS && vw > vh * 1.05) SIDEWAYS = false; // turned for real: no need any more
    root.classList.toggle("mg-sideways", SIDEWAYS);
    if (SIDEWAYS) { [vw, vh] = [vh, vw]; root.style.width = vw + "px"; root.style.height = vh + "px"; root.style.transform = `translateX(${innerWidth}px) rotate(90deg)`; }
    else { root.style.width = root.style.height = root.style.transform = ""; }
    const upright = TOUCH && vh > vw * 1.05;
    root.classList.toggle("mg-touch", TOUCH); root.classList.toggle("mg-side", TOUCH && !upright); root.classList.toggle("mg-rot", upright);
    if (upright) { if (!rotSince) rotSince = performance.now(); setPause(true); } else rotSince = 0;
    let sc, top;
    if (TOUCH) { const side = clamp(vw * 0.16, 128, 176); sc = Math.min((vw - side * 2) / W, vh / H); top = (vh - H * sc) / 2; }
    else { // beta 3.33: whole multiples of the canvas's own pixels on the screen's pixels, where it is big enough
      const dpr = devicePixelRatio || 1; sc = Math.min((vw - 32) / W, (vh - 96) / H); const d = (sc * dpr) / RS; if (d >= 2) sc = (Math.floor(d) * RS) / dpr; top = Math.max(16, (vh - H * sc) / 2 - 14); }
    sc = Math.max(0.3, sc);
    cvBox = { left: Math.round((vw - W * sc) / 2), top: Math.round(top), w: Math.round(W * sc), h: Math.round(H * sc) };
    cv.style.width = cvBox.w + "px"; cv.style.height = cvBox.h + "px"; cv.style.left = cvBox.left + "px"; cv.style.top = cvBox.top + "px";
    root.style.setProperty("--cv-bottom", Math.round(top + H * sc) + "px");
  }
  // the rotate screen: a little phone turning, in the game's pixels
  function drawRotate(t) {
    const c = root.querySelector(".mg-rot-cv"); if (!c) return; const x = c.getContext("2d"); x.setTransform(RS, 0, 0, RS, 0, 0); x.imageSmoothingEnabled = false;
    x.fillStyle = "#140f22"; x.fillRect(0, 0, c.width, c.height);
    const side = Math.floor(t / 1.1) % 2 === 1, cx = c.width / 2 / RS, cy = 44;
    const phone = (w2, h2) => { x.fillStyle = OUT; x.fillRect(cx - w2 / 2 - 1, cy - h2 / 2 - 1, w2 + 2, h2 + 2); x.fillStyle = "#3a2f6a"; x.fillRect(cx - w2 / 2, cy - h2 / 2, w2, h2); x.fillStyle = "#9cc4e4"; x.fillRect(cx - w2 / 2 + 2, cy - h2 / 2 + 2, w2 - 4, h2 - 4); x.fillStyle = "#dcc2ae"; x.fillRect(cx - w2 / 2 + 2, cy + h2 / 2 - 2 - Math.floor((h2 - 4) * 0.45), Math.floor((w2 - 4) * 0.6), Math.floor((h2 - 4) * 0.45)); x.fillStyle = "#8c8a86"; x.fillRect(cx - w2 / 2 + 2, cy + h2 / 2 - 5, w2 - 4, 3); };
    if (side) phone(52, 30); else phone(30, 52);
    x.fillStyle = "#fed012"; for (let i = 0; i < 9; i++) { const an = -Math.PI * 0.9 + (i / 9) * Math.PI * 0.6 + (side ? 0 : 0.2); x.fillRect(Math.round(cx + Math.cos(an) * 38), Math.round(cy + Math.sin(an) * 38), 2, 2); }
    text(x, "ROTATE YOUR PHONE", cx, 82, GOLD, { al: "c" });
    text(x, "THE GAME PLAYS SIDEWAYS", cx, 96, "#ffffff", { al: "c" });
    const btn = root.querySelector(".mg-rot-btn"); if (btn) btn.hidden = !(rotSince && performance.now() - rotSince > 3000);
  }
  const pxText = (s, fill, sc = 2) => { const t = textImg(s, fill, { ol: null }), [c, x] = mk(t.w, t.h); x.drawImage(t.c, 0, 0); c.className = "mg-lbl"; c.style.width = t.w * sc + "px"; c.style.height = t.h * sc + "px"; return c; };
  // beta 3.17 (Daniel: "on the iPhone it zooms in at some point and the buttons and the interface are lost"): Safari
  // ignores user-scalable=no, so quick taps on the buttons (a double-tap) or two thumbs (a pinch) zoomed the page.
  // Safari's own gesture events, a second tap within 350 ms and two-finger moves are cancelled on the game page
  (() => {
    const stop = (e) => e.preventDefault();
    for (const ev of ["gesturestart", "gesturechange", "gestureend", "dblclick"]) document.addEventListener(ev, stop, { passive: false });
    let lastEnd = 0;
    document.addEventListener("touchend", (e) => { if (e.timeStamp - lastEnd < 350) e.preventDefault(); lastEnd = e.timeStamp; }, { passive: false });
    document.addEventListener("touchmove", (e) => { if (e.touches.length > 1 || (e.scale && e.scale !== 1)) e.preventDefault(); }, { passive: false });
  })();
  function buildControls() {
    // the d-pad: one surface, 8 directions from where the thumb is
    const pad = document.createElement("div"); pad.className = "mg-dpad"; pad.setAttribute("aria-label", "Move");
    pad.innerHTML = '<i class="u"></i><i class="d"></i><i class="l"></i><i class="r"></i><b></b>';
    let pid = null;
    const setDir = (e) => {
      const r = pad.getBoundingClientRect(), [ccx, ccy] = toLocal(r.left + r.width / 2, r.top + r.height / 2), [ex, ey] = toLocal(e.clientX, e.clientY), dx = ex - ccx, dy = ey - ccy, dz = Math.max(r.width, r.height) * 0.14;
      const want = { l: 0, r: 0, u: 0, d: 0 };
      if (Math.hypot(dx, dy) > dz) { const an = Math.atan2(dy, dx), oct = Math.round(an / (Math.PI / 4)); want.r = [0, 1, -1].includes(oct) ? 1 : 0; want.l = [4, -4, 3, -3].includes(oct) ? 1 : 0; want.d = [1, 2, 3].includes(oct) ? 1 : 0; want.u = [-1, -2, -3].includes(oct) ? 1 : 0; }
      for (const k of ["l", "r", "u", "d"]) { if (want[k]) press(k); else release(k); pad.classList.toggle("on-" + k, !!want[k]); }
    };
    const clear = () => { for (const k of ["l", "r", "u", "d"]) { release(k); pad.classList.remove("on-" + k); } pid = null; };
    pad.addEventListener("pointerdown", (e) => { e.preventDefault(); pid = e.pointerId; try { pad.setPointerCapture(pid); } catch {} SND.init(); setDir(e); });
    pad.addEventListener("pointermove", (e) => { if (e.pointerId === pid) setDir(e); });
    for (const ev of ["pointerup", "pointercancel", "lostpointercapture"]) pad.addEventListener(ev, (e) => { if (e.pointerId === pid) clear(); });
    const btns = document.createElement("div"); btns.className = "mg-btns";
    for (const [k, label, cls] of [["p", "PUNCH", "b-p"], ["k", "KICK", "b-k"], ["s", "SPECIAL", "b-s"]]) {
      const b = document.createElement("button"); b.type = "button"; b.className = "mg-b " + cls; b.setAttribute("aria-label", label[0] + label.slice(1).toLowerCase());
      b.appendChild(pxText(label[0], "#170f19", 3)); b.appendChild(pxText(label, "#170f19", 1.5));
      b.addEventListener("pointerdown", (e) => { e.preventDefault(); try { b.setPointerCapture(e.pointerId); } catch {} SND.init(); press(k); if (k === "p" && (scene !== "game" || g?.scene !== "fight")) pressed.add("ok"); b.classList.add("on"); });
      for (const ev of ["pointerup", "pointercancel", "lostpointercapture"]) b.addEventListener(ev, () => { release(k); b.classList.remove("on"); });
      btns.appendChild(b);
    }
    root.append(pad, btns);
  }
  function mount(el) {
    root = el; root.classList.add("mg");
    TOUCH = matchMedia("(pointer: coarse)").matches || (navigator.maxTouchPoints > 0 && !matchMedia("(pointer: fine)").matches);
    [cv, cx2] = mk(W * RS, H * RS); cv.className = "mg-cv"; cv.setAttribute("role", "img"); cv.setAttribute("aria-label", "At the gloves with I O N, a fighting game");
    root.appendChild(cv);
    // the speaker (the site's own switch) and, on a laptop, the keys under the picture
    const snd = document.createElement("button"); snd.type = "button"; snd.className = "mg-snd";
    snd.innerHTML = '<svg viewBox="0 0 16 16" width="22" height="22" aria-hidden="true" shape-rendering="crispEdges"><path fill="currentColor" d="M2 6h3l4-3v10l-4-3H2z"/><path class="w" fill="currentColor" d="M11 5h1v1h1v4h-1v1h-1zM13 3h1v1h1v8h-1v1h-1z"/><path class="x" fill="currentColor" d="M11 6h1v1h1V6h1v1h-1v1h1v1h-1v1h-1V9h-1V8h1V7h-1z"/></svg>';
    snd.onclick = () => { SND.toggle(); };
    SND.bind(snd); root.appendChild(snd);
    // beta 3.15: the menu button, during a fight (the pause menu: resume, change fighters, back to the map)
    const menu = document.createElement("button"); menu.type = "button"; menu.className = "mg-menu"; menu.setAttribute("aria-label", "Menu");
    menu.innerHTML = '<svg viewBox="0 0 16 16" width="18" height="18" aria-hidden="true" shape-rendering="crispEdges"><path fill="currentColor" d="M2 3h12v2H2zM2 7h12v2H2zM2 11h12v2H2z"/></svg>';
    menu.appendChild(pxText("MENU", "#ffffff", 2));
    menu.onclick = () => { SND.init(); setPause(!paused); menu.blur(); };
    root.appendChild(menu);
    if (!TOUCH) { const hint = document.createElement("div"); hint.className = "mg-hint"; hint.appendChild(pxText("ARROWS/WASD MOVE   J/Z PUNCH   K/X KICK   L/C SPECIAL   P PAUSE   ESC MAP", "#a99cc8", 2)); hint.appendChild(pxText("HOLD AWAY TO BLOCK   DOWN+KICK SWEEP   UP JUMP   M SOUND   V SCANLINES", "#6f6496", 2)); root.appendChild(hint); }
    else {
      buildControls();
    }
    // the scanlines: on, unless switched off (V); remembered
    try { if (localStorage.getItem("cz-gloves-crt") === "off") root.classList.add("mg-nocrt"); } catch {}
    addEventListener("keydown", (e) => {
      SND.init();
      if (e.code === "Escape") { e.preventDefault(); backToMap(); return; }
      if (e.code === "KeyP") { setPause(!paused); return; }
      if (e.code === "KeyM") { SND.toggle(); return; }
      if (e.code === "KeyV") { const off = root.classList.toggle("mg-nocrt"); try { localStorage.setItem("cz-gloves-crt", off ? "off" : "on"); } catch {} return; }
      const k = KEYMAP[e.code]; if (!k) return;
      e.preventDefault();
      if (paused) { if (k === "u") pmenu = (pmenu + 2) % 3; else if (k === "d") pmenu = (pmenu + 1) % 3; else if (k === "ok" || k === "p") pausePick(pmenu); if (k === "u" || k === "d") SND.play("select"); return; }
      if (!e.repeat) press(k);
      if (k === "ok" && g && g.scene === "fight") { /* Enter does nothing in a fight */ }
    });
    addEventListener("keyup", (e) => { const k = KEYMAP[e.code]; if (k) release(k); });
    addEventListener("blur", () => { for (const k in held) held[k] = 0; setPause(true); });
    document.addEventListener("visibilitychange", () => { if (document.hidden) setPause(true); });
    cv.addEventListener("pointerdown", (e) => {
      SND.init(); try { window.focus(); } catch {}
      const [lx, ly] = toLocal(e.clientX, e.clientY), x = ((lx - cvBox.left) / cvBox.w) * W, y = ((ly - cvBox.top) / cvBox.h) * H;
      for (let i = hits.length - 1; i >= 0; i--) { const h = hits[i]; if (x >= h.x && x < h.x + h.w && y >= h.y && y < h.y + h.h) { h.fn(); break; } }
    });
    { const rot = document.createElement("div"); rot.className = "mg-rotate";
      const [rc] = mk(192 * RS, 108 * RS); rc.className = "mg-rot-cv"; // beta 3.34: at twice the pixels, like the game rot.appendChild(rc);
      const btn = document.createElement("button"); btn.type = "button"; btn.className = "mg-rot-btn"; btn.hidden = true; btn.appendChild(pxText("PLAY SIDEWAYS ANYWAY", "#170f19", 2));
      btn.onclick = (e) => { e.stopPropagation(); SIDEWAYS = true; layout(); };
      rot.addEventListener("pointerdown", () => { SND.init(); lockLandscape(); });
      rot.appendChild(btn); root.appendChild(rot); }
    addEventListener("resize", layout); addEventListener("orientationchange", () => setTimeout(layout, 120)); layout();
    // everything is baked before the first frame (a few ms), then the loop: logic in fixed 1/60 s steps
    // beta 3.33: at the start only what the first screen needs (the splash); the street, the busts and the portraits
    // are baked in the spare time of the frames that follow (BAKEQ), the fighters when they are picked
    { const b0 = performance.now(); splashArt(); stats.bake = Math.round(performance.now() - b0); BAKEQ.push(stageStep, ...FIGHTERS.map((id) => () => bust(id)), ...FIGHTERS.map((id) => () => portrait(id))); wantBig("ion"); } // beta 3.34: and I O N's VS face, the CPU's first choice
    let last = performance.now(), acc = 0;
    stats.t0 = last;
    const loop = (now) => {
      stats.maxDt = Math.max(stats.maxDt || 0, now - last);
      acc += Math.min(0.1, (now - last) / 1000); last = now;
      let n = 0; while (acc >= 1 / 60 && n < 4) { step(); acc -= 1 / 60; n++; }
      if (n === 4) acc = 0;
      draw(now / 1000);
      if (BAKEQ.length) bakeIdle(scene === "game" && g && g.scene === "fight" && g.phase === "fight" ? 3 : 7);
      root.classList.toggle("mg-fight", scene === "game" && !!g && g.scene === "fight" && g.phase !== "match");
      if (root.classList.contains("mg-rot")) drawRotate(now / 1000);
      stats.frames++; if (now - stats.t0 >= 1000) { stats.fps = Math.round((stats.frames * 1000) / (now - stats.t0)); stats.frames = 0; stats.t0 = now; }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    SND.music("menu");
    try { window.focus(); } catch {}
  }
  // for tests and the review: the state, the frame rate, a shortcut to the end of a round
  const probe = () => ({ scene: scene === "game" && g ? g.scene : scene, phase: g?.phase, round: g?.round, wins: g?.wins.slice(), hp: g?.f.map((f) => f.hp), st: g?.f.map((f) => f.st), time: g ? Math.ceil(g.time) : null, me: g?.me, cpu: g?.cpu, sel: SEL.p1, selCpu: SEL.cpu, selPhase: SEL.phase, menu: g?.menu, result: g?.result, paused, voucher: g?.voucher?.code || null, sideways: !!SIDEWAYS, rotate: !!(root && root.classList.contains("mg-rot")), fps: stats.fps, maxDt: Math.round(stats.maxDt || 0), sound: SND.on, proj: g ? g.proj.map((p) => p.k) : [], bake: stats.bake, spr: Object.assign({}, stats.spr), lazy: Math.round(stats.lazy), queue: BAKEQ.length });
  const resetMaxDt = () => { stats.maxDt = 0; };
  let cpuHold = false, autoP1 = false, gapWatch = 0, gapFreeze = false; const HITLOG = [], GAPLOG = []; // beta 3.32: for the review renders (window.czGloves.hold(true)): the CPU stands in its guard
  const setHp = (a, b) => { if (g && g.f.length) { g.f[0].hp = g.f[0].trail = a; g.f[1].hp = g.f[1].trail = b; } };

  // the art on its own, for review: every sheet as a PNG data URL, scaled with crisp pixels. beta 3.33: the sheets are
  // at the canvas's pixels (a frame of the game is 768x432)
  function exportArt(scale = 3) {
    const up = (c, s = scale) => { const [o, x] = mk(c.width * s, c.height * s); x.drawImage(c, 0, 0, o.width, o.height); return o.toDataURL("image/png"); };
    const screen = () => { const [c, x] = mk(W * RS, H * RS); x.setTransform(RS, 0, 0, RS, 0, 0); x.imageSmoothingEnabled = false; return [c, x]; };
    const cell = (x, f, cx, cy) => x.drawImage(f, cx + OX - f.ax, cy + OY - f.ay); // a cropped frame back in its cell
    while (BAKEQ.length) { const j = BAKEQ.shift(); if (j() === "again") BAKEQ.unshift(j); } // everything baked first
    const out = {};
    const ids = Object.keys(LOOKS);
    for (const id of ids) {
      const S = sprites(id), order = ["idle", "walk", "crouch", "jump", "punch", "kick", "cpunch", "ckick", "jpunch", "jkick", "block", "cblock", "special", "hit", "dizzy", "fall", "down", "win", "intro"];
      const frames = []; for (const k of order) for (const f of S[k]) frames.push([k, f]);
      const cols = 8, rows = Math.ceil(frames.length / cols), [c, x] = mk(cols * CW, rows * (CH + 20));
      x.fillStyle = "#2a2148"; x.fillRect(0, 0, c.width, c.height);
      frames.forEach(([k, f], i) => { const cx = (i % cols) * CW, cy = Math.floor(i / cols) * (CH + 20); x.fillStyle = "#332a58"; x.fillRect(cx + 1, cy + 1, CW - 2, CH - 2); cell(x, f, cx, cy); text(x, k.toUpperCase(), cx + 3, cy + CH + 4, "#a99cc8", { ol: null, sc: 2 }); });
      out[`sprites-${id}`] = up(c, 1);
      const f0 = S.idle[0], [ic, ix] = mk(CW, CH); ix.fillStyle = "#332a58"; ix.fillRect(0, 0, CW, CH); cell(ix, f0, 0, 0); out[`idle-${id}`] = up(ic, 3);
      const P = portrait(id), [pc, px] = mk(P.width, P.height); px.fillStyle = "#241d3d"; px.fillRect(0, 0, P.width, P.height); px.drawImage(P, 0, 0); out[`portrait-${id}`] = up(pc, 3);
    }
    { const [c, x] = mk(ids.length * 136 + 8, 144); x.fillStyle = "#1b1438"; x.fillRect(0, 0, c.width, c.height); ids.forEach((q, i) => { x.fillStyle = "#241d3d"; x.fillRect(8 + i * 136, 8, 128, 128); x.drawImage(portrait(q), 8 + i * 136, 8); }); out.portraits = up(c, 2); }
    { const [c, x] = mk(ids.length * 80 + 8, 88); x.fillStyle = "#1b1438"; x.fillRect(0, 0, c.width, c.height); ids.forEach((q, i) => { x.fillStyle = "#241d3d"; x.fillRect(8 + i * 80, 8, 72, 72); x.drawImage(bust(q), 8 + i * 80, 8); }); out.busts = up(c, 3); }
    { const [c, x] = mk(2 * 264 + 8, 272); x.fillStyle = "#1b1438"; x.fillRect(0, 0, c.width, c.height); ["ion", "cristache"].forEach((q, i) => { x.fillStyle = "#241d3d"; x.fillRect(8 + i * 264, 8, 256, 256); x.drawImage(portraitBig(q), 8 + i * 264, 8); }); out["vs-heads"] = up(c, 2); }
    { // beta 3.32: Cristache's cigarette: in the hand, up to the lips, in the mouth, walking, the win
      const S = sprites("cristache"), list = [S.idle[0], S.puff[0], S.idleM[0], S.walkM[2], S.win[0]], [c, x] = mk(list.length * 180 + 20, CH - 40);
      x.fillStyle = "#332a58"; x.fillRect(0, 0, c.width, c.height); list.forEach((f, i) => cell(x, f, i * 180 + 10 - (OX - 90), -40));
      out["cig-cristache"] = up(c, 3);
    }
    { // the heads, at the fight's size (HK), at 1 (the busts' small head) and the cigarette one
      const hs = Object.keys(HEADSPEC), hw = Math.ceil(HW * HK), hh = Math.ceil(HH * HK), [c, x] = mk(hs.length * (hw + 8) + 8, hh + 16); x.fillStyle = "#2a2148"; x.fillRect(0, 0, c.width, c.height);
      hs.forEach((id, i) => { const HD = headOf(id, 1, false, HK), w2 = HD.rows[0].length, h2 = HD.rows.length, [hc, hx2] = mk(w2, h2), idd = hx2.createImageData(w2, h2), d = new Uint32Array(idd.data.buffer); HD.rows.forEach((r, y) => [...r].forEach((ch, xx) => { if (ch !== ".") d[y * w2 + xx] = HD.pal[ch]; })); hx2.putImageData(idd, 0, 0); x.drawImage(hc, 8 + i * (hw + 8), 8); });
      out.heads = up(c, 6);
    }
    { // the line-up: everyone in the stance, then a punch and a kick at full stretch
      const [c, x] = mk(ids.length * 168 + 48, 3 * (CH - 16) + 24);
      x.fillStyle = "#2a2148"; x.fillRect(0, 0, c.width, c.height);
      ["idle", "punch", "kick"].forEach((k, r) => ids.forEach((id, i) => { const S = sprites(id), f = k === "idle" ? S.idle[0] : S[k][2]; cell(x, f, i * 168 + 24 - (OX - 84), r * (CH - 16) - 8); if (r === 0) text(x, ROSTER[id] ? ROSTER[id].name : id.toUpperCase(), i * 168 + 108, 8, "#ffffff", { al: "c", sc: 2 }); }));
      out.lineup = up(c, 2);
    }
    { const S = stage(), [c, x] = mk(STAGE_W * RS, H * RS); x.setTransform(RS, 0, 0, RS, 0, 0); for (let cx3 = 0; cx3 < STAGE_W; cx3 += W) { x.save(); x.translate(cx3, 0); x.beginPath(); x.rect(0, 0, Math.min(W, STAGE_W - cx3), H); x.clip(); drawBackdrop(x, cx3, 0); drawCrowd(x, cx3, 0, false); x.restore(); } out.stage = up(c, 2); }
    let [c, x] = screen();
    drawTitle(x, 0); drawTitle(x, 10); out.title = up(c, 2);
    { // beta 3.34: the projectiles and the effects at the canvas's pixels, over the street
      drawBackdrop(x, 96, 0);
      const ps = [{ k: "espresso", vx: 1, t: 0 }, { k: "espresso", vx: -1, t: 4 }, { k: "bean", vx: 1, t: 0, i: 0 }, { k: "bean", vx: 1, t: 3, i: 0 }, { k: "bean", vx: 1, t: 6, i: 0 }, { k: "key", vx: 1, t: 0 }, { k: "key", vx: 1, t: 3 }, { k: "key", vx: -1, t: 6 }, { k: "wave", vx: 1, t: 0 }, { k: "wave", vx: -1, t: 6 }];
      ps.forEach((q, i) => drawProj(x, Object.assign({ x: 22 + i * 36, y: -120 }, q), 0));
      ["spark", "burst", "bspark"].forEach((k, r) => [0, 2, 4, 6, 8].forEach((tt, i) => drawFx(x, { k, x: 30 + i * 34 + r * 120 - (r ? 0 : 0), y: -70 + r * 0, t: tt, life: k === "burst" ? 14 : 10 }, 0)));
      [0, 3, 6, 9].forEach((tt, i) => drawFx(x, { k: "dust", x: 40 + i * 40, y: -20, t: tt, life: 12 }, 0));
      drawFx(x, { k: "stack", x: 230, y: 0, t: 0, life: 1e9 }, 0); drawFx(x, { k: "flash", x: 300, y: -40, t: 3, life: 12 }, 0);
      cupIcon(x, 300, 190, true); cupIcon(x, 314, 190, false);
      out.fx = up(c, 2);
    }
    drawSelect(x, 0.1, { phase: "p1", p1: 0, cpu: 0 }); out.select = up(c, 2);
    drawSelect(x, 0.1, { phase: "cpu", p1: 8, cpu: 0 }); out["select-cpu"] = up(c, 2);
    drawVS(x, 0, "daniel", 1); out.vs = up(c, 2);
    drawVS(x, 0, "cristache", 1, "ion"); out["vs-cristache"] = up(c, 2);
    { const g0 = g; g = { result: "win", me: "cristache", cpu: "ion", wins: [2, 1], menu: 0, voucher: { code: "TM-K7QX-1710", date: "17.10.2026  14:32" } }; hits = []; drawResult(x, 0.2); out.voucher = up(c, 2); drawResult(x, 2.15); out["voucher-catch"] = up(c, 2); g = g0; hits = []; }
    { const g0 = g; g = { result: "lose", me: "daniel", cpu: "ion", wins: [1, 2], menu: 0 }; hits = []; drawResult(x, 0.2); out["ending-lose"] = up(c, 2); g = g0; hits = []; }
    { // the HUD over the stage, with the two fighters in their stance
      drawBackdrop(x, 96, 0); drawCrowd(x, 96, 0, false);
      const A = sprites("daniel").idle[0], B = sprites("ion").idle[0];
      hiDraw(x, A, 140, FLOOR, 1, A.ax, A.ay); hiDraw(x, B, 244, FLOOR, -1, B.ax, B.ay);
      drawHUD(x, { f: [{ R: ROSTER.daniel, hp: 72, trail: 80, spCool: 0, spMax: 1 }, { R: ROSTER.ion, hp: 45, trail: 45, spCool: 0.5, spMax: 1 }], wins: [1, 0], time: 47 }, 0);
      out.hud = up(c, 2);
    }
    return out;
  }
  // beta 3.33: the sizes, for the review: each fighter's guard (its frame's height) and the head, in canvas pixels
  function measure(timeOnly) {
    const o = {};
    { const T = (f) => { const t0 = performance.now(); f(); return Math.round(performance.now() - t0); }, id = "steve"; o.times = { headHK: T(() => headAt(id, false, HK)), head4: T(() => headAt(id, false, 4)), head8: T(() => headAt(id, false, 8)), bust: T(() => bustAt(id, 2, TILE * RS, 4)), portrait: T(() => bustAt(id, 4, 128, 8)), vs: T(() => bustAt(id, 8, 256, 16)), frame: T(() => drawFighter(id, POSES.idle[0], null)), stage: T(() => { STAGE = null; stage(); }), head8flat: T(() => { NOPLANES = true; headAt(id, false, 8); NOPLANES = false; }) }; if (timeOnly) return o; }
    for (const id of FIGHTERS) { const f = sprites(id).idle[0], HD = headOf(id, 1, false, HK); let top = 1e9, chin = -1; HD.rows.forEach((r, y) => { if (r.replace(/\./g, "").length) top = Math.min(top, y); const fr = r.slice(Math.round(17 * HK), Math.round(23 * HK)); if (fr.replace(/\./g, "").length) chin = y; }); o[id] = { h: f.height, w: f.width, head: chin - top + 1, heads: +(f.height / (chin - top + 1)).toFixed(2) }; }
    return o;
  }
  window.czGloves = Object.assign(window.czGloves || {}, { mount, exportArt, measure, probe, setHp, resetMaxDt, hold: (v) => { cpuHold = !!v; }, auto: (v) => { autoP1 = !!v; }, hits: () => HITLOG.splice(0), fxKinds: () => (g ? g.fx.map((e) => e.k) : []), gapWatch: (th, freeze) => { gapWatch = th; gapFreeze = !!freeze; }, gaps: () => GAPLOG.splice(0), unfreeze: () => { if (g) g.frozen = false; }, fxPos: () => (g ? { proj: g.proj.map((p) => [p.k, Math.round((p.x - g.camX) * RS), Math.round((p.y + FLOOR) * RS)]), fx: g.fx.filter((e) => e.k !== "stack" && e.k !== "ghost").map((e) => [e.k, Math.round((e.x - g.camX) * RS), Math.round((e.y + FLOOR) * RS), e.t]) } : null), minGap: () => { const v = stats.minGap; stats.minGap = null; return v == null ? null : Math.round(v * 10) / 10; } });
  const auto = () => { const el = document.getElementById("mg"); if (el && !root) mount(el); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", auto); else auto();
})();
