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
(function () {
  "use strict";
  const W = 384, H = 216, FLOOR = 200, STAGE_W = 576;
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
    "*": ".|.|.|#|.|.|.", "%": "##..#|##.#.|...#.|..#..|.#...|.#.##|#..##", " ": "...|...|...|...|...|...|...",
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
    const key = s + "|" + fill + "|" + sc + "|" + sp + "|" + ol + "|" + sh;
    if (TXT.has(key)) return TXT.get(key);
    const pad = (ol ? 1 : 0) + sh, padY = pad + 2 * sc, tw = textW(s, sc, sp), th = 7 * sc; // 2 rows of room above and below (accents)
    const [c, x] = mk(tw + pad * 2 + 1, th + padY * 2 + 1);
    const grad = Array.isArray(fill) ? fill : null;
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
    const t = textImg(s, fill, o), al = o.al || "l";
    const lx = al === "c" ? Math.round(x - (t.w - t.pad * 2) / 2) : al === "r" ? x - (t.w - t.pad * 2) : x;
    ctx.drawImage(t.c, lx - t.pad, Math.round(y) - t.padY);
  }
  const GOLD = ["#fff6b8", "#ffe14a", "#ffc21a", "#ff9d14", "#f2700f", "#d9480f", "#b8320c"];
  const RED = ["#ffd0c4", "#ff8a6e", "#ff5236", "#e8301c", "#c41f14", "#9c160f", "#7a0f0b"];
  const ICE = ["#ffffff", "#e8f7ff", "#bfe9ff", "#8fd5ff", "#5cb8f5", "#3a8fe0", "#2a68c0"];

  // ===================== 2. the portraits =====================
  // beta 3.15 (Daniel: "the same head size and framing, matching the game"): every portrait is the fighter as drawn in
  // the game, head and shoulders (the glasses, the cap, the cigarette, the outfit all match), cut round the neck so
  // the head size and the eye line are the same for all; doubled with a pixel-art scaler (EPX) for the bigger frames
  function epx(src) {
    const w = src.width, h = src.height, s0 = new Uint32Array(src.getContext("2d").getImageData(0, 0, w, h).data.buffer), [c, x] = mk(w * 2, h * 2), id = x.createImageData(w * 2, h * 2), d = new Uint32Array(id.data.buffer);
    const P = (i, j) => (i < 0 || j < 0 || i >= w || j >= h ? 0 : s0[j * w + i]);
    for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) {
      const p = P(i, j), a = P(i, j - 1), b = P(i + 1, j), l = P(i - 1, j), dn = P(i, j + 1);
      const o = [p, p, p, p];
      if (l === a && l !== dn && a !== b) o[0] = a; if (a === b && a !== l && b !== dn) o[1] = b; if (dn === l && dn !== b && l !== a) o[2] = l; if (b === dn && b !== a && dn !== l) o[3] = dn;
      const k = j * 2 * w * 2 + i * 2; d[k] = o[0]; d[k + 1] = o[1]; d[k + w * 2] = o[2]; d[k + w * 2 + 1] = o[3];
    }
    x.putImageData(id, 0, 0); return c;
  }
  const PORT = {};
  function bust(id) { // 36x36, at the game's size
    if (PORT[id + ":s"]) return PORT[id + ":s"];
    const f = drawFighter(id, BUST_POSE, null), sc = (LOOKS[id].build.sc || 1) * BODY, nx = OX + BUST_POSE.neck[0] * sc, ny = OY + BUST_POSE.neck[1] * sc;
    const [c, x] = mk(36, 36); x.drawImage(f, Math.round(nx - 16), Math.round(ny - 29), 36, 36, 0, 0, 36, 36);
    return (PORT[id + ":s"] = c);
  }
  function portrait(id) { // 64x64 (from 72x72 doubled)
    if (PORT[id]) return PORT[id];
    const [c, x] = mk(64, 64); x.drawImage(epx(bust(id)), 4, 2, 64, 64, 0, 0, 64, 64);
    return (PORT[id] = c);
  }
  const portraitBig = (id) => PORT[id + ":b"] || (PORT[id + ":b"] = epx(portrait(id)));
  const drawFlipped = (ctx, img, x, y, w, h, flip) => { if (!flip) return ctx.drawImage(img, x, y, w, h); ctx.save(); ctx.translate(x + w, y); ctx.scale(-1, 1); ctx.drawImage(img, 0, 0, w, h); ctx.restore(); };

  // ===================== 3. the fighters: heads and a shaded pixel puppet =====================
  // beta 3.11 (Daniel: "more athletic, no lines between the pieces"): every limb is one continuous form, shaded by
  // the light on it (five tones a material), not outlined piece by piece. One dark outline goes round the whole
  // figure; where a nearer part crosses a farther one (an arm over the chest), the farther one gets a one-pixel
  // shadow in its own colour. Broad shoulders, tapered limbs with the muscle in them, a low stance.
  // colours: one base per material, five tones made from it (light, lit, base, shade, deep)
  const rgbOf = (h) => { const n = parseInt(h.slice(1, 7), 16); return [n >> 16, (n >> 8) & 255, n & 255]; };
  const hexOf = (c) => "#" + c.map((v) => clamp(Math.round(v), 0, 255).toString(16).padStart(2, "0")).join("");
  const RAMPS = new Map();
  function ramp(base) {
    if (RAMPS.has(base)) return RAMPS.get(base);
    const c = rgbOf(base), mix = (t, k) => c.map((v, i) => v + (t[i] - v) * k);
    const r = [mix([255, 250, 236], 0.42), mix([255, 248, 230], 0.18), c, mix([46, 26, 72], 0.36), mix([26, 14, 44], 0.6)].map((x) => u32(hexOf(x)));
    RAMPS.set(base, r);
    return r;
  }
  // per fighter: the build (sh shoulders, arm, leg, waist, sc the whole size) and the clothes
  // beta 3.12 (Daniel: "neater, more meaningful outfits, with accessories"; three archetype nods): per fighter, the
  // build (sh shoulders, arm, leg, waist, chest, sc the whole size) and a clean fighting outfit that still reads as them
  // beta 3.15 (Daniel): bare fists in hand wraps for everyone, the tape in each fighter's colour (glove)
  const LOOKS = {
    // I O N: workwear, relaxed: a navy work shirt, loose canvas work trousers, work boots worn casual, the cap backwards
    ion: { skin: "#dfa27a", top: "#22305a", topKind: "workshirt", sleeve: "rolled", pants: "#a07a44", loose: 2.3, canvas: true, boots: true, shoe: "#6e4a2c", sole: "#2a1c12", glove: "#d8342a", build: { sh: 1.08, arm: 1.06 } },
    // Cristache: shirtless, grey trousers, the calm karate stance; glasses and a cigarette (on the head)
    cristache: { skin: "#e3a47e", top: "#e3a47e", topKind: "bare", sleeve: "none", pants: "#8a8a90", loose: 1.5, barefoot: true, glove: "#28c840", build: { sh: 1.04, arm: 1.04 } },
    // Rares: the flashy nod: sleeveless, a gold chain, the key tag, taped ankles, barefoot
    rares: { skin: "#e9ae8a", top: "#f4f2ee", topKind: "muscle", sleeve: "none", chain: "#e8c050", tattoo: true, key: true, pants: "#1c1c22", loose: 1.5, belt: "#1c1c22", barefoot: true, ankle: "#f2efe6", glove: "#2fd6f0", build: { arm: 1.08 } },
    iulica: { skin: "#c88961", top: "#5f6e40", topKind: "tee", sleeve: "short", strap: "#d9cba8", pants: "#2c2c32", shoe: "#3a3a3a", sole: "#e0e0e0", glove: "#b8e02f", build: { sh: 0.98 } },
    maria: { skin: "#ebb597", top: "#f2f0ea", topKind: "oversize", knot: true, sleeve: "short", legs: "skirt", skirt: "#1c1c22", shoe: "#a8b89a", sole: "#6e7c62", glove: "#f0389a", build: { sh: 0.84, arm: 0.82, leg: 0.88, waist: 0.86, chest: 0.94 } },
    // Steve: dressed American: a varsity jacket (wool body, cream leather sleeves, a letter on the chest) over a white
    // tee, jeans, white sneakers; the glasses, the grey hair, the beard, the two metres
    steve: { skin: "#e8af8f", top: "#7a1f2a", topKind: "varsity", inner: "#f0f0f0", sleeve: "long", sleeveCol: "#efe6d0", letter: "#efe6d0", pants: "#4a6890", shoe: "#f4f4f6", sole: "#b8b8c4", glove: "#7a4fe0", build: { sh: 1.1, arm: 1.12, leg: 1.1, waist: 1.3, chest: 1.12, sc: 1.14 } },
    dony: { skin: "#ecb895", top: "#2c3c6c", topKind: "fleece", sleeve: "long", apron: "#b08a5a", pants: "#2e2e36", shoe: "#2a2a2a", sole: "#d8d8d8", glove: "#8a5530", build: { sc: 0.86, arm: 0.96 } },
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
  // the finish: a soft shadow where a nearer form crosses a farther one, and one outline round the figure
  Fig.prototype.finish = function () {
    const { w, h, c, z, g } = this, out = new Uint32Array(c), oc = u32(OUT);
    const dark = (v) => { const r = v & 255, gg = (v >> 8) & 255, b = (v >> 16) & 255; return (0xff000000 | (Math.round(b * 0.3 + 18) << 16) | (Math.round(gg * 0.26 + 8) << 8) | Math.round(r * 0.3 + 14)) >>> 0; }; // beta 3.30: the contour, dark, in the colour's own hue
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!z[i]) { if ((x > 0 && z[i - 1]) || (x < w - 1 && z[i + 1]) || (y > 0 && z[i - w]) || (y < h - 1 && z[i + w])) out[i] = oc; continue; }
      if (c[i] === oc) continue;
      for (const j of [i - 1, i + 1, i - w, i + w]) { if (j < 0 || j >= w * h || !z[j]) continue; if (z[j] > z[i] && g[j] !== g[i] && c[j] !== oc) { out[i] = dark(c[i]); break; } }
    }
    const [cv2, x2] = mk(w, h), id = x2.createImageData(w, h); new Uint32Array(id.data.buffer).set(out); x2.putImageData(id, 0, 0);
    return cv2;
  };
  // light from the front, above, a little towards us; a normal (nx, ny) on a round form -> one of five tones
  const LI = [-0.46, -0.68, 0.57];
  // beta 3.30 (Daniel: the 90s arcade look): cel shading in hard bands, with a checker dither where two bands meet
  let CURX = 0, CURY = 0;
  const BANDS = [0.84, 0.56, 0.16, -0.22];
  const toneOf = (nx, ny) => {
    const nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)), d = nx * LI[0] + ny * LI[1] + nz * LI[2];
    let t = 0; while (t < 4 && d <= BANDS[t]) t++;
    if (t > 0 && d - BANDS[t - 1] > -0.035 && ((CURX + CURY) & 1)) t--; // just under a band's edge: every other pixel takes the lighter band
    return t;
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
    cristache: { idle: breathe(pose({ hip: [0, -43], neck: [6, -71], head: [9, -82], eF: [20, -56], hF: [31, -60], eB: [-1, -50], hB: [5, -44], kF: [16, -21], fF: [27, 0], kB: [-15, -19], fB: [-27, 0] }), 0.6) },
    rares: { idle: [0, 1.5, 3, 1.5].map((d) => { const b0 = pose({ eF: [15, -66], hF: [21, -79], eB: [6, -64], hB: [14, -75], kF: [11, -25], fF: [17, 0], kB: [-9, -24], fB: [-17, 0] }); const q = upper(Object.assign({}, b0, { hip: [0, -47 + d] }), 0, d); q.kF = [12, -24 + d * 0.5]; q.kB = [-8, -23 + d * 0.5]; return q; }) },
    ion: { idle: breathe(pose({ hip: [0, -48], neck: [3, -77], head: [5, -88], eF: [15, -64], hF: [18, -80], eB: [8, -64], hB: [13, -78], kF: [11, -25], fF: [17, 0], kB: [-9, -24], fB: [-16, 0] }), 0.8) }
  };
  // beta 3.16: the bystanders, in the same puppet as the fighters (bare hands, a little smaller)
  const WRAP = "#f2f0ea";
  // beta 3.30 (Daniel): the people watching stand further back, smaller (65%), always the same ones: roster faces in
  // other clothes (Dony behind the counter, Maria on the step with a coffee, Steve and Iulica by the caravan); when
  // one of them is in the fight, a stranger takes the spot. They cheer at the hits and the K.O.
  const SPEC = 0.65;
  const NPC_LOOKS = {
    specDony: { headId: "dony", skin: "#ecb895", top: "#2a2a30", topKind: "tee", sleeve: "short", apron: "#b08a5a", pants: "#2e2e36", shoe: "#2a2a2a", sole: "#d8d8d8", hands: "bare", build: { sc: SPEC * 0.92 } },
    specMaria: { headId: "maria", skin: "#ebb597", top: "#c9a040", topKind: "tee", sleeve: "long", pants: "#4a6a92", shoe: "#f2f2f2", sole: "#c0c0c8", hands: "bare", build: { sc: SPEC * 0.92, sh: 0.86, arm: 0.84, waist: 0.86 } },
    specSteve: { headId: "steve", skin: "#e8af8f", top: "#b8463c", topKind: "plaid", plaid: "#3a1e1c", sleeve: "long", pants: "#4a6890", shoe: "#3a2a22", sole: "#1a120e", hands: "bare", build: { sc: SPEC * 1.14, sh: 1.1, waist: 1.25 } },
    specIulica: { headId: "iulica", skin: "#c88961", top: "#e07a2a", topKind: "tee", sleeve: "long", strap: "#d9cba8", pants: "#2c2c32", shoe: "#3a3a3a", sole: "#e0e0e0", hands: "bare", build: { sc: SPEC } },
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
    { id: "specDony", alt: "npcBarista", x: 186, y: 178, face: 1, rate: 0.9, clip: [106, 105, 98, 47], poses: [pose(Object.assign({}, STAND, BAR)), pose(Object.assign({}, STAND, BAR, { head: [6, -86] }))], cheer: pose(Object.assign({}, STAND, UP)) },
    { id: "specMaria", alt: "npcSit", x: 128, y: 176, face: 1, rate: 0.7, prop: "cup", poses: [pose(SIT), pose(Object.assign({}, SIT, { eF: [13, -30], hF: [11, -40] })), pose(SIT), pose(SIT)], cheer: pose(Object.assign({}, SIT, { eF: [10, -52], hF: [12, -64] })) },
    { id: "specSteve", alt: "npcPlaid", x: 466, y: 174, face: 1, rate: 1.4, poses: [pose(STAND), pose(Object.assign({}, STAND, { eF: [12, -58], hF: [18, -62] })), pose(STAND), pose(Object.assign({}, STAND, { head: [5, -86] }))], cheer: pose(Object.assign({}, STAND, UP)) },
    { id: "specIulica", alt: "npcBun", x: 490, y: 174, face: -1, rate: 1.1, poses: [pose(STAND), pose(STAND), pose(Object.assign({}, STAND, { eF: [11, -60], hF: [16, -66] })), pose(STAND)], cheer: pose(Object.assign({}, STAND, UP)) }
  ];
  const BUST_POSE = pose({ hip: [0, -47], neck: [3, -75], head: [6, -86], eF: [12, -56], hF: [14, -40], eB: [-5, -56], hB: [-7, -40], tw: 0.55 }); // for the portraits: the arms down
  const SPECIAL_PROP = { coz: "camera", iulica: "tote", rares: "key" };
  // the cell every frame is baked into: 140x142, the feet at (70, 138)
  const CW = 150, CH = 156, OX = 75, OY = 152;
  const BODY = 1.1; // beta 3.30: the bodies a size up, the heads as they are (the arcade proportions)
  // beta 3.12 (Daniel: "you can't tell it's them"): bigger heads (28x36), built from one shaded three-quarter face and,
  // per person, what makes them them: the hair (its line, volume, texture), the beard, glasses, a cap, the smile.
  // Read from their photos. The neck's foot (13, 31) sits on the body's neck.
  const HW = 28, HH = 36, HEAD_ANCHOR = [13, 28];
  const HEADSPEC = {
    daniel: { skin: "#e7a57d", hair: "#3a2516", hl: "#6e4c30", beard: "#33200f", bhl: "#6e5444", grey: 0.12,
      hairline: [7, 10], thick: 0.4, back: 19, tex: "slick", bun: [6.5, 3, 2.6, 2.3],
      beardKind: "full", beardTop: 15, beardDrop: 2.5, mouth: "grin", eyes: "smile" },
    cristian: { skin: "#e9ab84", hair: "#2c1f17", hl: "#57412f", beard: "#55361f", bhl: "#8a6244",
      hairline: [6.5, 9], thick: 1.2, back: 17, tex: "short", blobs: [[15, 3.2, 5.5, 2.6], [11, 2.8, 4, 2.4]],
      beardKind: "full", beardTop: 16, beardDrop: 1.5, mouth: "grin", glasses: { kind: "round", color: "#1c1416", thick: 1 } },
    ion: { skin: "#dfa27a", hair: "#1b1517", hl: "#3d3034", beard: "#211819", bhl: "#4a3a36",
      hairline: [7, 10], thick: 0.6, back: 17, tex: "short",
      beardKind: "short", beardTop: 16.5, beardDrop: 1, mouth: "flat", brows: "heavy",
      cap: { color: "#24252b", band: "#3a3b44", back: true } },
    maria: { skin: "#ebb597", hair: "#2a1912", hl: "#5d3b27", fem: true, rx: 0.93, jaw: 0.88,
      hairline: [6.5, 11], thick: 1.6, back: 35, tex: "curly", blobs: [[8, 18, 6.5, 13], [5.5, 26, 5, 8.5], [12, 4, 8, 4], [17.5, 5.5, 4.5, 3]],
      beardKind: null, mouth: "small", lips: "#c46a64" },
    // beta 3.15 (Daniel, from his second photo): buzzed dark hair, heavy brows, heavy-lidded eyes, stubble round the
    // jaw, full lips; glasses added; a lit cigarette in the corner of the mouth
    cristache: { skin: "#e3a47e", hair: "#1d1511", hl: "#3a2c24", beard: "#2a1c16", bhl: "#5c4234", rx: 1.03, jaw: 1.06,
      hairline: [7.5, 10.5], thick: 0.2, back: 16, tex: "buzz",
      beardKind: "stubble", beardTop: 16, mouth: "lips", lips: "#b8705e", brows: "heavy", eyes: "lidded", cig: true,
      glasses: { kind: "square", color: "#16121a", thick: 1 } },
    steve: { skin: "#e8af8f", hair: "#76747a", hl: "#b0aeb4", beard: "#6c5e58", bhl: "#a49890", rx: 1.08, jaw: 1.14,
      hairline: [6.5, 9.5], thick: 1.6, back: 17, tex: "wavy", blobs: [[13, 2.5, 8, 3.2], [7, 5, 4, 4]],
      beardKind: "full", beardTop: 16.5, beardDrop: 2, mouth: "flat", glasses: { kind: "square", color: "#121014", thick: 1 } },
    rares: { skin: "#e9ae8a", hair: "#23170f", hl: "#4d3524", beard: "#2c1e14", bhl: "#6a4c38",
      hairline: [6.5, 11], thick: 1.8, back: 27, tex: "curly", blobs: [[10, 3, 8, 4], [5.5, 13, 4.5, 8], [7, 22, 5.5, 5.5], [17, 3.6, 5, 3]],
      beardKind: "stubble", beardTop: 17, mustache: true, mouth: "flat" },
    iulica: { skin: "#c88961", hair: "#1b130f", hl: "#3b2c22", beard: "#2a1d16", bhl: "#4c3a2e", rx: 0.96,
      hairline: [6.5, 10], thick: 1.2, back: 18, tex: "messy", blobs: [[12, 3, 7, 3], [16.5, 4, 4, 2.6]],
      beardKind: "stubble", beardTop: 16, mouth: "grin", eyes: "smile" },
    dony: { skin: "#ecb895", hair: "#271c16", hl: "#463428", beard: "#7a5a48", rx: 0.96, jaw: 0.94,
      hairline: [7.5, 10], thick: 0.4, back: 16, tex: "short",
      beardKind: "stubble", beardTop: 17.5, mouth: "flat", glasses: { kind: "round", color: "#2a2026", thick: 1, thin: true },
      cap: { color: "#6a7040", band: "#8a9058", back: true, mesh: "#4e5432" } }
  };
  const HEAD_CACHE = {};
  function headOf(id, k = 1) {
    if (k < 1) { const key = id + "@" + k; if (HEAD_CACHE[key]) return HEAD_CACHE[key]; return (HEAD_CACHE[key] = shrinkHead(headOf(id), k)); }
    if (HEAD_CACHE[id]) return HEAD_CACHE[id];
    const P = HEADSPEC[id] || NPC_HEADS[id], rx = 8.7 * (P.rx || 1), ry = 10.2, cx0 = 13, cy0 = 12.5, jw = P.jaw || 1;
    const buf = new Array(HW * HH).fill(null), put = (x, y, c) => { if (x >= 0 && y >= 0 && x < HW && y < HH) buf[y * HW + x] = c; };
    const at = (x, y) => (x >= 0 && y >= 0 && x < HW && y < HH ? buf[y * HW + x] : null);
    const R = (b) => ramp(b); const SK = R(P.skin), HA = R(P.hair), BE = R(P.beard || P.hair);
    const inPoly = (pts, x, y) => { let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c; };
    const jawPts = [[5.2, 13], [7.6, 21.5], [10.8, 25.2], [14.4, 26.2], [18, 24.4], [20.6, 20.8], [21.7, 15.5], [21.2, 11]].map(([x, y]) => [cx0 + (x - cx0) * jw, y]);
    const skull = (x, y) => ((x - cx0) / rx) ** 2 + ((y - cy0) / ry) ** 2 <= 1;
    const face = (x, y) => skull(x, y) || inPoly(jawPts, x, y) || (x >= 21 && x <= (P.fem ? 21.8 : 22.6 + (P.rx || 1) - 1) && y >= (P.fem ? 14.5 : 13.5) && y <= 17.2);
    const L = [0.52, -0.5, 0.69];
    const shadeAt = (x, y, bias = 0) => { const nx = clamp((x - cx0 - 1.5) / (rx + 1), -1, 1), ny = clamp((y - cy0 + 1) / (ry + 3), -1, 1), nz = Math.sqrt(Math.max(0, 1 - nx * nx - ny * ny)); const d = nx * L[0] + ny * L[1] + nz * L[2] - bias; return d > 0.8 ? 0 : d > 0.52 ? 1 : d > 0.2 ? 2 : d > -0.1 ? 3 : 4; };
    // the neck (behind), the face, the ear
    for (let y = 22; y <= 28; y++) for (let x = 9; x <= 16; x++) put(x, y, SK[x < 11 ? 4 : 3]);
    for (let y = 0; y < HH; y++) for (let x = 0; x < HW; x++) if (face(x + 0.5, y + 0.5)) put(x, y, SK[shadeAt(x + 0.5, y + 0.5)]);
    for (let y = 12; y <= 17; y++) for (let x = 6; x <= 9; x++) if (((x + 0.5 - 7.8) / 1.7) ** 2 + ((y + 0.5 - 14.6) / 2.7) ** 2 <= 1) put(x, y, SK[x === 8 && y > 12 && y < 17 ? 3 : 2]);
    // the eye sockets and the cheek, a little darker; under the nose
    for (const [x, y] of [[13, 12], [14, 12], [18, 12], [19, 12], [21, 17], [20, 17]]) if (at(x, y)) put(x, y, SK[Math.min(4, shadeAt(x, y) + 1)]);
    // the beard: below a cheek line that runs from the sideburn (at the ear) down to the mouth's corner; a moustache
    // over the lip; full beards fall a little below the jaw. Stubble is the skin darkened towards the beard colour
    if (P.beardKind) {
      const kind = P.beardKind, drop = P.beardDrop || 0, lift = (P.beardTop ? 16.5 - P.beardTop : 0);
      const mix2 = (c1, c2, k2) => { const a2 = [c1 & 255, (c1 >> 8) & 255, (c1 >> 16) & 255], b2 = [c2 & 255, (c2 >> 8) & 255, (c2 >> 16) & 255]; const m2 = a2.map((v, i) => Math.round(v + (b2[i] - v) * k2)); return (0xff000000 | (m2[2] << 16) | (m2[1] << 8) | m2[0]) >>> 0; };
      const jawOut = jawPts.map(([a2, b2]) => [a2 + (a2 - cx0) * 0.05, b2 + drop * clamp((b2 - 14) / 12, 0, 1)]);
      for (let y = 0; y < HH; y++) for (let x = 0; x < HW; x++) {
        const fx = x + 0.5, fy = y + 0.5;
        if (!(face(fx, fy) || (kind === "full" && inPoly(jawOut, fx, fy)))) continue;
        const cheek = (fx < 8.5 ? 10.5 : fx < 14 ? lerp(11.5, 17.2, (fx - 8.5) / 5.5) : 17.6) - lift;
        if (fy < cheek) continue;
        const mouthHole = fx > 14.6 && fx < 20.4 && fy > 19.4 && fy < 21.6;
        if (mouthHole) continue;
        if (fx > 20.6 && fy < 19) continue; // the nose and the tip of the lip stay skin
        const base = buf[y * HW + x];
        if (kind === "stubble") { if (base) put(x, y, mix2(base, BE[2], 0.42)); continue; }
        if (kind === "short") { if (base) put(x, y, mix2(base, BE[clamp(shadeAt(fx, fy) , 1, 3)], 0.8)); else put(x, y, BE[3]); continue; }
        let t = clamp(shadeAt(fx, fy, 0.05), 1, 4); if ((x * 3 + y) % 5 === 0 && t < 4) t++; // strands
        if (fy > 22 && fx > 11 && fx < 18 && ((x + y) % 4 === 0)) t = Math.max(1, t - 1);
        put(x, y, BE[t]);
      }
    }
    if (P.mustache) for (let y = 18; y <= 19; y++) for (let x = 14; x <= 21; x++) if (!(y === 18 && (x === 14 || x === 21))) put(x, y, BE[y === 18 ? 2 : 3]);
    // the hair: what's above the hair line (lower at the temples), the back down to the nape, and the volume
    const [fy0, ty0] = P.hairline, th = P.thick || 0;
    const hairIn = (x, y) => {
      const sk = ((x - cx0) / (rx + th)) ** 2 + ((y - cy0) / (ry + th)) ** 2 <= 1;
      const hl = lerp(ty0, fy0, clamp((x - 8) / 12, 0, 1)) - (x > 19 ? (x - 19) * 0.6 : 0);
      if (sk && y < hl) return true;
      if (sk && x < 9.2 && y < P.back && !(x > 5.5 && y > 11.5 && y < 17.5)) return true; // behind the ear
      if (P.back > 20 && x < 10 && y < P.back && x > 3 - (y - 14) * 0.15 && y > 10 && !(x > 6 && y > 11.5 && y < 17.5 && x < 10)) return true; // long at the back
      for (const [bx, by, brx, bry] of P.blobs || []) if (((x - bx) / brx) ** 2 + ((y - by) / bry) ** 2 <= 1) return true;
      return false;
    };
    const HL = R(P.hl || P.hair);
    for (let y = 0; y < HH; y++) for (let x = 0; x < HW; x++) {
      const fx = x + 0.5, fy = y + 0.5; if (!hairIn(fx, fy)) continue;
      if (P.fem && fx > 17 && fy > 9 && fy < 22) continue; // her face stays open
      let t = clamp(shadeAt(fx, fy, -0.15), 0, 4);
      const tex = P.tex, n = hash2(x * 3 + 1, y * 5 + 2);
      if (tex === "curly") { const c = (Math.sin(x * 1.7 + y * 0.9) + Math.sin(y * 1.9 - x * 0.6)) * 0.5; t = clamp(t + (c > 0.45 ? -1 : c < -0.45 ? 1 : 0), 1, 4); }
      else if (tex === "slick") { t = clamp(t + ((y % 3 === 0 && x > 8) ? -1 : 0), 1, 4); }
      else if (tex === "wavy") { const c = Math.sin(x * 0.9 + y * 1.4); t = clamp(t + (c > 0.6 ? -1 : c < -0.7 ? 1 : 0), 0, 4); }
      else if (tex === "buzz") { t = clamp(t + 1, 2, 4); if (n > 0.6) t = Math.min(4, t + 1); }
      else if (tex === "messy") { t = clamp(t + (n > 0.78 ? -1 : n < 0.15 ? 1 : 0), 1, 4); }
      else { t = clamp(t + (n > 0.85 ? -1 : 0), 1, 4); }
      put(x, y, t <= 1 ? HL[t === 0 ? 1 : 2] : HA[t]);
    }
    if (P.bun) { const [bx, by, brx, bry] = P.bun; for (let y = 0; y < 6; y++) for (let x = 3; x < 14; x++) { const d = ((x + 0.5 - bx) / brx) ** 2 + ((y + 0.5 - by) / bry) ** 2; if (d <= 1) put(x, y, d > 0.55 ? HA[3] : (x + y) % 3 ? HA[2] : HL[1]); } } // the knot on top
    if (P.grey) for (let i = 0; i < HW * HH; i++) if (buf[i] === HA[2] && hash2(i, 7) < P.grey) buf[i] = HL[1];
    // a cap, worn backwards: the crown over the hair, the strap's opening at the forehead, the peak behind
    if (P.cap) {
      const CP = R(P.cap.color), crown = (x, y) => ((x - cx0) / (rx + 1.1)) ** 2 + ((y - cy0 + 0.5) / (ry + 1.1)) ** 2 <= 1 && y < 8.6 - Math.max(0, x - 18) * 0.5;
      for (let y = 0; y < HH; y++) for (let x = 0; x < HW; x++) { const fx = x + 0.5, fy = y + 0.5; if (!crown(fx, fy)) continue; const t = clamp(shadeAt(fx, fy, -0.1), 0, 4); put(x, y, P.cap.mesh && x < 12 && (x + y) % 2 ? u32(P.cap.mesh) : CP[clamp(t, 1, 4)]); }
      for (let x = 15; x <= 20; x++) put(x, 8, u32(P.cap.band)); // the strap across the forehead
      for (let x = 16; x <= 19; x++) put(x, 7, HA[2]); // hair through the opening
      for (let x = 1; x <= 5; x++) put(x, 8 + (x < 3 ? 1 : 0), CP[x < 3 ? 3 : 2]); // the peak, behind
      put(1, 9, CP[4]); put(2, 9, CP[3]);
    }
    // the brows, the eyes, the nose, the mouth
    const browC = P.brows === "heavy" ? HA[4] : HA[3];
    for (const [x0, x1, y] of [[12, 15, 10], [17, 20, 10]]) for (let x = x0; x <= x1; x++) put(x, y + (x === x0 ? 1 : 0), browC);
    if (P.brows === "heavy") { put(13, 11, browC); put(18, 11, browC); }
    const EW = u32("#f2ece6"), EP = u32("#1c1214");
    if (P.eyes === "lidded") { put(13, 13, EW); put(14, 13, EP); put(18, 13, EW); put(19, 13, EP); for (const x of [13, 14, 15, 18, 19, 20]) put(x, 12, SK[4]); } // heavy lids
    else if (P.eyes === "smile") { for (const [x0, x1] of [[13, 15], [18, 19]]) for (let x = x0; x <= x1; x++) put(x, 13, EP); put(13, 12, SK[3]); put(18, 12, SK[3]); }
    else { put(13, 13, EW); put(14, 13, EP); put(15, 13, SK[2]); put(18, 13, EW); put(19, 13, EP); put(14, 12, SK[3]); put(19, 12, SK[3]); }
    if (P.fem) { put(15, 12, EP); put(20, 12, EP); put(13, 13, EP); } // lashes
    if (P.fem) { put(21, 16, SK[3]); put(20, 17, SK[3]); } else { put(21, 15, SK[2]); put(21, 16, SK[3]); put(20, 17, SK[4]); put(22, 15, SK[1]); }
    const MO = u32("#5a2220"), TE = u32("#fbf6ee");
    if (P.mouth === "grin") { for (let x = 15; x <= 19; x++) { put(x, 20, TE); put(x, 21, MO); } put(14, 19, MO); put(20, 19, MO); }
    else if (P.mouth === "lips") { for (let x = 15; x <= 19; x++) { put(x, 20, x === 15 || x === 19 ? MO : u32(P.lips)); put(x, 21, x > 15 && x < 19 ? u32(P.lips) : SK[2]); } for (let x = 16; x <= 18; x++) put(x, 20, MO); put(16, 21, ramp(P.lips)[1]); }
    else if (P.mouth === "small") { put(16, 20, u32(P.lips || "#b05a50")); put(17, 20, u32(P.lips || "#b05a50")); put(18, 20, MO); }
    else for (let x = 15; x <= 19; x++) put(x, 20, x === 15 || x === 19 ? SK[3] : MO);
    // glasses
    if (P.glasses) {
      const G = u32(P.glasses.color), ring = (gx, gy, grx, gry) => { for (let a = 0; a < 40; a++) { const an = (a / 40) * Math.PI * 2; put(Math.round(gx + Math.cos(an) * grx), Math.round(gy + Math.sin(an) * gry), G); } };
      if (P.glasses.kind === "square") { for (let x = 12; x <= 16; x++) { put(x, 11, G); put(x, 15, G); } for (let y = 11; y <= 15; y++) { put(12, y, G); put(16, y, G); } for (let x = 18; x <= 21; x++) { put(x, 11, G); put(x, 15, G); } for (let y = 11; y <= 15; y++) { put(18, y, G); put(21, y, G); } put(17, 12, G); }
      else { ring(13.9, 13, 2.2, 1.9); ring(19, 13, 1.6, 1.9); put(16, 12, G); put(17, 12, G); }
      for (let x = 8; x <= 11; x++) put(x, 12 + (x < 10 ? 1 : 0), G); // the arm to the ear
    }
    // the cigarette, in the corner of the mouth: white paper, the lit end
    if (P.cig) { for (let x = 19; x <= 24; x++) put(x, 21 - (x > 22 ? 1 : 0), u32(x === 24 ? "#ff7a2a" : x === 19 ? "#d8b48a" : "#f4f2ee")); put(24, 19, u32("#ffcf6a")); }
    // one outline round the silhouette
    const out = buf.slice();
    for (let y = 0; y < HH; y++) for (let x = 0; x < HW; x++) { if (at(x, y)) continue; if (y >= 26 && x >= 8 && x <= 17) continue; if ([[1, 0], [-1, 0], [0, 1], [0, -1]].some(([dx, dy]) => at(x + dx, y + dy))) out[y * HW + x] = u32(OUT); }
    if (P.cig) for (const [x, y, a2] of [[25, 18, 0.7], [25, 16, 0.55], [26, 15, 0.45], [25, 13, 0.35], [26, 12, 0.25]]) out[y * HW + x] = u32(a2 > 0.5 ? "#d8d8de" : "#a8a8b4"); // a thin wisp of smoke
    // rows + palette, for the blitter
    const keys = new Map(), pal = {}; let kk = 0; const CH = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    const rows = []; for (let y = 0; y < HH; y++) { let r = ""; for (let x = 0; x < HW; x++) { const c = out[y * HW + x]; if (c == null) { r += "."; continue; } if (!keys.has(c)) { const ch = CH[kk++]; keys.set(c, ch); pal[ch] = c; } r += keys.get(c); } rows.push(r); }
    return (HEAD_CACHE[id] = { rows, pal, at: HEAD_ANCHOR });
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
    return { rows, pal: H0.pal, at: [Math.round(HEAD_ANCHOR[0] * k), Math.round(HEAD_ANCHOR[1] * k)] };
  }
  const hueTurn = (hex, deg) => {
    let [r, g2, b] = rgbOf(hex).map((v) => v / 255); const mx = Math.max(r, g2, b), mn = Math.min(r, g2, b), l = (mx + mn) / 2, d = mx - mn;
    if (d < 0.04) return hexOf([r, g2, b].map((v) => (1 - v) * 0.5 * 255 + v * 0.5 * 255 * 0.6)); // greys: a darker shade
    const s2 = d / (1 - Math.abs(2 * l - 1)); let h = mx === r ? ((g2 - b) / d) % 6 : mx === g2 ? (b - r) / d + 2 : (r - g2) / d + 4; h = (h * 60 + deg + 360) % 360;
    const c = (1 - Math.abs(2 * l - 1)) * s2, x = c * (1 - Math.abs(((h / 60) % 2) - 1)), m = l - c / 2, k = Math.floor(h / 60);
    const rgb = [[c, x, 0], [x, c, 0], [0, c, x], [0, x, c], [x, 0, c], [c, 0, x]][k]; return hexOf(rgb.map((v) => (v + m) * 255));
  };
  const lookOf = (id, alt) => { if (!alt) return LOOKS[id] || NPC_LOOKS[id]; const L = Object.assign({}, LOOKS[id]); for (const k of ["top", "pants", "glove", "skirt", "inner", "trim", "wrist", "apron"]) if (L[k]) L[k] = hueTurn(L[k], 150); return L; };
  function drawFighter(id, p0, prop, alt) {
    const L = lookOf(id, alt), B = Object.assign({ sh: 1, arm: 1, leg: 1, waist: 1, chest: 1, sc: 1 }, L.build), sc = B.sc * (L.hands ? 1 : BODY);
    const p = {}; for (const k in p0) p[k] = Array.isArray(p0[k]) ? [p0[k][0] * sc, p0[k][1] * sc] : p0[k];
    const F = new Fig(CW, CH), T = (q) => [q[0] + OX, q[1] + OY];
    const hip = T(p.hip), neck = T(p.neck), head = T(p.head), tw = p.tw || 0;
    const ang = Math.atan2(neck[0] - hip[0], -(neck[1] - hip[1])), ca = Math.cos(ang), sa = Math.sin(ang);
    const off = (o, dx, dy) => [o[0] + dx * ca - dy * sa, o[1] + dx * sa + dy * ca];
    const SK = ramp(L.skin), TOP = ramp(L.top), PA = ramp(L.pants || L.skin), GL = ramp(L.glove || L.wrap || "#f4f4f4"), SO = u32(L.sole || "#101014");
    const tone = (R, nx, ny) => R[toneOf(nx, ny)];
    const back = (R, nx, ny) => R[Math.min(4, toneOf(nx, ny) + 1)]; // the far side, a tone darker
    const br = p.br || 0; // the breath: the chest a little wider, the shoulders a little higher
    const wsh = (15 + br * 0.35) * B.sh * sc, len = Math.hypot(neck[0] - hip[0], neck[1] - hip[1]);
    const sF = off(neck, (7 + 3 * tw) * B.sh * sc, 4), sB = off(neck, (-7 + 2 * tw) * B.sh * sc, 3);
    const lF = off(hip, 3.5 * sc, 1), lB = off(hip, -2.5 * sc, 1); // beta 3.30: the legs from under the body (no seat sticking out)
    // an arm: the deltoid, the upper arm with the biceps, the forearm, then the glove with its cuff
    const arm = (s, e, h, far) => {
      const g = far ? 1 : 2, ar = B.arm * sc, sleeveTo = L.sleeve === "long" ? 2 : L.sleeve === "rolled" ? 1.4 : L.sleeve === "gi" ? 1.3 : L.sleeve === "short" ? 0.55 : -1;
      const SLV = L.sleeveCol ? ramp(L.sleeveCol) : TOP;
      const mat = (seg) => (nx, ny, t, px, py) => { const R = seg + t * 0.999 < sleeveTo || (seg === 1 && sleeveTo >= 2) ? SLV : SK;
        if (L.topKind === "varsity" && seg === 1 && t > 0.82) return (far ? back : tone)(ramp(L.top), nx, ny); // the knit cuff
        if (seg === 1 && t > 0.8 && R === SK && !L.hands) return (far ? back : tone)(ramp(WRAP), nx, ny); // the tape up the wrist
        if (L.sleeve === "rolled" && seg === 1 && Math.abs(t - 0.4) < 0.06) return TOP[far ? 4 : 3]; // the rolled cuff
        if (L.topKind === "fleece" && R === TOP && R === SLV) { const fz = hash2(px * 7.3, py * 5.1); return R[clamp(toneOf(nx, ny) + (far ? 1 : 0) + (fz > 0.72 ? 1 : fz < 0.12 ? -1 : 0), 0, 4)]; } if (L.tattoo && R === SK && seg === 1 && t > 0.2 && t < 0.8 && hash2(t * 40, nx * 6 + 9) > 0.62) return u32("#3a4a6a");
        // beta 3.30: the muscle drawn in: the line between biceps and triceps, the deltoid's edge, the forearm's ridge; on a sleeve, the creases at the elbow
        let ex2 = 0;
        if (R === SK) { if (seg === 0 && t > 0.32 && t < 0.86 && Math.abs(nx - 0.05) < 0.12) ex2 = 1; if (seg === 0 && t > 0.24 && t < 0.32 && nx > -0.3) ex2 = 1; if (seg === 1 && t > 0.1 && t < 0.62 && Math.abs(nx + 0.28) < 0.11) ex2 = 1; }
        else if ((seg === 0 && Math.abs(t - 0.9) < 0.04) || (seg === 1 && Math.abs(t - 0.1) < 0.04) || (seg === 0 && t > 0.5 && Math.abs(nx + 0.4 - (t - 0.5)) < 0.07)) ex2 = 1; // the crease round the elbow, a fold down the sleeve
        return R[clamp(toneOf(nx, ny) + (far ? 1 : 0) + ex2, 0, 4)]; };
      limb(F, s, e, 6.3 * ar, 4.1 * ar, 1.4 * ar, 0.42, mat(0), g); // a strong upper arm, the deltoid and the biceps
      limb(F, e, h, 4.9 * ar, 3.5 * ar, 0.8 * ar, 0.28, mat(1), g); // a thick forearm
      const vx = h[0] - e[0], vy = h[1] - e[1], vl = Math.hypot(vx, vy) || 1, ux = vx / vl, uy = vy / vl, gr = 5.9 * Math.min(1.1, sc);
      if (L.hands) blob(F, [h[0] + ux * 0.5, h[1] + uy * 0.5], 3.1 * sc + 0.6, 2.8 * sc + 0.6, (nx, ny) => (far ? back : tone)(SK, nx, ny), g + 10); // a bystander's bare hand
      else { // beta 3.16 (Daniel): a bare fist in plain white hand wraps, for everyone; the knuckles just showing
        const WR = ramp(WRAP), fr2 = 5.6 * Math.min(1.12, sc); // big fists
        blob(F, [h[0] + ux, h[1] + uy], fr2, fr2 * 0.9, (nx, ny, px, py) => {
          const along = (px - h[0]) * ux + (py - h[1]) * uy, band = Math.floor((along + 8) / 1.7) & 1;
          if (along > fr2 * 0.55 && (Math.floor(px + py) & 1)) return (far ? back : tone)(SK, nx, ny); // the knuckles
          return (far ? back : tone)(WR, nx, ny + (band ? 0.25 : 0));
        }, g + 10);
      }
    };
    const leg = (r, k, f, far) => {
      const g = far ? 3 : 4, lg = B.leg * sc, bare = L.legs === "skirt";
      const R = bare ? SK : PA, loose = bare ? 0 : L.loose || 0.8;
      const mat = (nx, ny, t = 0.5, px = CURX, py = CURY, shin = false) => {
        let ex2 = 0;
        if (R === SK) { if (shin && t > 0.12 && t < 0.55 && Math.abs(nx - 0.3) < 0.12) ex2 = 1; if (!shin && t > 0.86 && nx < 0) ex2 = 1; }
        else if ((shin && Math.abs(t - 0.1) < 0.035) || (!shin && Math.abs(t - 0.9) < 0.03) || (!shin && t > 0.3 && t < 0.75 && Math.abs(nx - 0.25 - (t - 0.5) * 0.9) < 0.07) || (shin && t > 0.35 && t < 0.8 && Math.abs(nx + 0.35) < 0.06)) ex2 = 1; // the creases at the knee, a fold down the thigh, the shin's
        return R[clamp(toneOf(nx, ny) + (far ? 1 : 0) + ex2, 0, 4)];
      };
      const thighMat = (nx, ny, t) => (L.cargo && t > 0.45 && t < 0.78 && nx < -0.1 && nx > -0.85 ? R[far ? 4 : t < 0.5 ? 1 : 3] : L.canvas && t > 0.6 && nx > -0.2 && Math.abs(t - 0.62) < 0.03 ? R[far ? 4 : 3] : mat(nx, ny, t)); // the cargo pocket; the canvas trousers' double front
      const shinMat = (nx, ny, t) => (L.ankle && t > 0.78 ? (far ? back : tone)(ramp(L.ankle), nx, ny) : mat(nx, ny, t, CURX, CURY, true));
      limb(F, r, k, (6.2 + loose) * lg, (5 + loose) * lg, (bare ? 1.4 : 1) * lg, 0.5, thighMat, g); // solid thighs, the swell mid-way (not at the seat)
      limb(F, k, [f[0], f[1] - 4], (5 + loose) * lg, (3.4 + loose * 1.2) * lg, (bare ? 1.3 : 0.6) * lg, 0.28, shinMat, g); // the calf high
      const fq = Math.min(1, sc); // the feet keep to the size of the person
      if (L.barefoot) { // a bare foot, the toes forward
        poly(F, [[f[0] - 5 * fq, f[1] - 6 * fq], [f[0] + 3 * fq, f[1] - 5 * fq], [f[0] + 12 * fq, f[1] - 1 * fq], [f[0] + 12 * fq, f[1] + 1 * fq], [f[0] - 5 * fq, f[1] + 1 * fq]], (x, y) => (x > f[0] + 7 * fq && Math.floor(x) % 2 === 0 && y > f[1] - 1.5 * fq ? SK[3] : SK[far ? 3 : y < f[1] - 2 * fq ? 1 : 2]), g + 10); // the toes
        if (L.ankle) limb(F, [f[0] - 1 * fq, f[1] - 6 * fq], [f[0] - 1 * fq, f[1] - 4 * fq], 3.4, 3.4, 0, 0.5, (nx, ny) => (far ? back : tone)(ramp(L.ankle), nx, ny), g + 11);
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
      const w0 = wsh * (1 - 0.18 * tw), wc = (13.8 + br * 0.4) * B.chest * sc * (1 - 0.15 * tw), ww = 7.6 * B.waist * sc, wh = 8.4 * Math.max(1, B.waist * 0.92) * sc;
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
        if (v > 0.45 && v < 0.78 && u > -0.1 && u < 0.85 && ((Math.abs(u - 0.38) < 0.04) || (Math.round((v - 0.45) * 20) % 3 === 0 && u > 0.05))) t2++; // the abs
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
    if (L.legs === "skirt") { const SKR = ramp(L.skirt); poly(F, [off(hip, -hw1 - 1, -3), off(hip, hw1 + 1, -3), off(hip, hw1 + 6, 15), off(hip, -hw1 - 5, 15)], (x, y) => { const [u] = tloc(x, y); return SKR[u > 0.3 ? 2 : u > -0.4 ? 3 : 4]; }, 6); }
    if (L.apron) { const AR = ramp(L.apron); poly(F, [off(hip, -1, -2), off(hip, hw1 + 2, -2), off(hip, hw1 + 4, 20), off(hip, 1, 22)], (x, y) => AR[x > hip[0] + hw1 * 0.5 ? 1 : 2], 6); }
    if (L.knot) { const kp = off(hip, hw1 * 0.75, -5); blob(F, kp, 3.2, 2.6, (nx, ny) => TOP[toneOf(nx, ny)], 7); limb(F, [kp[0], kp[1] + 1], [kp[0] + 1.5, kp[1] + 6], 1.6, 1.2, 0, 0.5, (nx, ny) => TOP[toneOf(nx, ny) + 1 > 4 ? 4 : toneOf(nx, ny) + 1], 7); }
    if (L.key) { const k = off(hip, hw1 * 0.6, 4); blob(F, [k[0], k[1] + 6], 1.6, 3.2, () => u32("#ffd23a"), 7); blob(F, [k[0], k[1] + 1.5], 1.2, 1.4, () => u32("#c9ccd4"), 7); }
    { // beta 3.12: the head's neck stands on the body's neck; the pose's head offset still tilts it a little
      const HD = headOf(L.headId || id, L.hands ? B.sc : 1), hx = (p.head[0] - p.neck[0] - 3 * sc) * 0.6, hy = (p.head[1] - p.neck[1] + 11 * sc) * 0.6, a2 = off(neck, 0.5, 1);
      if (p.lie) F.blit(HD.rows, HD.pal, a2[0], a2[1], 1, HD.at, 8); else F.blit(HD.rows, HD.pal, Math.round(a2[0] + hx), Math.round(a2[1] + hy), 0, HD.at, 8);
    }
    arm(sF, T(p.eF), T(p.hF), false);
    const hF = T(p.hF);
    if (prop === "camera") {
      poly(F, [[hF[0] - 5, hF[1] - 7], [hF[0] + 8, hF[1] - 7], [hF[0] + 8, hF[1] + 1], [hF[0] - 5, hF[1] + 1]], (x, y) => u32(y < hF[1] - 5 ? "#4a4a52" : "#26262c"), 20);
      blob(F, [hF[0] + 8, hF[1] - 3], 2.8, 2.8, (nx, ny) => ramp("#3a8fe0")[toneOf(nx, ny)], 21);
    } else if (prop === "tote") {
      poly(F, [[hF[0] - 2, hF[1] + 2], [hF[0] + 12, hF[1] + 4], [hF[0] + 10, hF[1] + 22], [hF[0] - 6, hF[1] + 19]], (x, y) => ramp("#e8dcc0")[x > hF[0] + 5 ? 1 : 2], 20);
      poly(F, [[hF[0] - 1, hF[1] + 1], [hF[0] + 4, hF[1] + 2], [hF[0] + 3, hF[1] + 6], [hF[0] - 2, hF[1] + 5]], () => u32("#c9b896"), 21);
    } else if (prop === "cup") { // a takeaway cup
      poly(F, [[hF[0] - 2, hF[1] - 8], [hF[0] + 4, hF[1] - 8], [hF[0] + 3.5, hF[1] - 1], [hF[0] - 1.5, hF[1] - 1]], (x, y) => u32(y < hF[1] - 6.5 ? "#2a2a30" : x > hF[0] + 2 ? "#d8d4cc" : "#f4f2ec"), 20);
      poly(F, [[hF[0] - 1.6, hF[1] - 5.5], [hF[0] + 3.6, hF[1] - 5.5], [hF[0] + 3.4, hF[1] - 3.5], [hF[0] - 1.4, hF[1] - 3.5]], () => u32("#b07a46"), 21);
    } else if (prop === "key") {
      blob(F, [hF[0] + 2, hF[1] - 7], 1.8, 3.4, () => u32("#ffd23a"), 20);
    } else if (prop === "stack") {
      for (let i = 0; i < 6; i++) poly(F, [[hF[0] - 12, hF[1] - 3 - i * 3], [hF[0] + 8, hF[1] - 3 - i * 3], [hF[0] + 8, hF[1] - i * 3], [hF[0] - 12, hF[1] - i * 3]], (x, y) => (Math.floor(y) === Math.floor(hF[1] - 2 - i * 3) && x > hF[0] - 9 && x < hF[0] + 5 && (Math.floor(x) % 3) ? u32("#1c1c22") : u32(i % 2 ? "#ffffff" : "#ecebe6")), 20 + i);
    }
    return F.finish();
  }
  // every frame of a fighter, baked once
  const SPR = {};
  function sprites(id, alt) {
    const key = id + (alt ? ":alt" : "");
    if (SPR[key]) return SPR[key];
    const S = {};
    for (const [k, list] of Object.entries(Object.assign({}, POSES, STYLE_POSES[id] || {}))) S[k] = list.map((p) => drawFighter(id, p, k === "intro" && id === "ion" ? "stack" : null, alt));
    S.special = SPECIAL_POSES[id].map((p) => drawFighter(id, p, SPECIAL_PROP[id] || null, alt));
    return (SPR[key] = S);
  }

  // ===================== 4. the stage: Two Minutes, Str. Constantin Aricescu 50A =====================
  // beta 3.16 (Daniel, from the street photo): the beige plaster house with the black shopfront and the white II' on
  // the door, the wooden step people sit on, the steel bin, the black bollard, the white wall with the green street
  // plate, the cream caravan parked in front, the green house-number plate, 50A. Daytime, soft clouds that drift on
  // their own parallax, the far blocks softened (drawn at half size, hazed: depth, kept pixel art)
  // a tiny 3x5 font for the signs on the stage (plates, the menu board)
  const T3 = { A: "010101111101101", B: "110101110101110", C: "011100100100011", D: "110101101101110", E: "111100110100111", F: "111100110100100", G: "011100101101011", H: "101101111101101", I: "111010010010111", K: "101101110101101", L: "100100100100111", M: "101111111101101", N: "110101101101101", O: "010101101101010", P: "110101110100100", R: "110101110101101", S: "011100010001110", T: "111010010010010", U: "101101101101111", V: "101101101101010", W: "101101111111101", Y: "101101010010010", 0: "111101101101111", 1: "010110010010111", 2: "110001010100111", 3: "110001010001110", 4: "101101111001001", 5: "111100110001110", 6: "011100111101111", 7: "111001010010010", 8: "111101111101111", 9: "111101111001110", ".": "000000000000010", " ": "000000000000000", "-": "000000111000000", "'": "010010000000000" };
  function tiny(ctx, s, x, y, col) { ctx.fillStyle = col; let cx = x; for (const ch of s) { const g2 = T3[ch] || T3[" "]; for (let i = 0; i < 15; i++) if (g2[i] === "1") ctx.fillRect(cx + (i % 3), y + Math.floor(i / 3), 1, 1); cx += 4; } }
  const tinyW = (s) => s.length * 4 - 1;
  let STAGE = null;
  const SKY_TOP = "#9cc4e4", HAZE = "#c8dcea";
  function stage() {
    if (STAGE) return STAGE;
    const r = (() => { let s2 = 11; return () => ((s2 = (s2 * 16807) % 2147483647) / 2147483647); })();
    const dith = (ctx, x, y, w, h, c1, c2, f) => { for (let yy = 0; yy < h; yy++) for (let xx = 0; xx < w; xx++) { ctx.fillStyle = ((xx + yy) & 1) && f ? c2 : c1; ctx.fillRect(x + xx, y + yy, 1, 1); } };
    // ---- the sky: a few bands, dithered where they meet
    const [sky, s] = mk(W, H);
    const BANDS = ["#8ab8de", "#96c0e2", "#a4c8e6", "#b2d0ea", "#c0d8ec", "#cfe0ee", "#dce8f0"];
    for (let y = 0; y < 150; y++) { const t = (y / 150) * (BANDS.length - 1), i = Math.floor(t), f = t - i; for (let x = 0; x < W; x++) { s.fillStyle = f > 0.5 && ((x + y) & 1) ? BANDS[Math.min(BANDS.length - 1, i + 1)] : BANDS[i]; s.fillRect(x, y, 1, 1); } }
    s.fillStyle = BANDS[BANDS.length - 1]; s.fillRect(0, 150, W, H - 150);
    // ---- the clouds, on a strip that wraps
    const [clouds, c] = mk(768, 80);
    const cloud = (cx0, cy0, w2) => {
      const puffs = []; for (let i = 0; i < 6; i++) puffs.push([cx0 - w2 / 2 + (i + 0.5) * (w2 / 6) + (r() - 0.5) * 6, cy0 - r() * 6 - (i > 1 && i < 4 ? 5 : 0), 6 + r() * 6]);
      for (let y = Math.floor(cy0 - 26); y <= cy0 + 2; y++) for (let x = Math.floor(cx0 - w2 / 2 - 14); x <= cx0 + w2 / 2 + 14; x++) {
        let inside = false, top = 1e9; for (const [px, py, pr] of puffs) { const d = Math.hypot(x - px, (y - py) * 1.2); if (d <= pr) { inside = true; top = Math.min(top, (y - (py - pr / 1.2)) / pr); } }
        if (!inside || y > cy0) continue;
        c.fillStyle = y > cy0 - 3 ? (((x + y) & 1) ? "#dfe7f0" : "#d2dcea") : top < 0.35 ? "#ffffff" : top < 0.9 ? "#f6f8fb" : ((x + y) & 1) ? "#eaf0f6" : "#f6f8fb";
        c.fillRect(((x % 768) + 768) % 768, y, 1, 1);
      }
    };
    for (const [x0, y0, w2] of [[60, 34, 70], [240, 22, 48], [400, 46, 90], [600, 28, 60], [720, 54, 40]]) cloud(x0, y0, w2);
    // ---- the far city: grey blocks, a pink one, trees; drawn at half size (soft), in the haze
    const FW = Math.ceil((W + (STAGE_W - W) * 0.4) / 2) + 2, [far, f] = mk(FW, Math.ceil(H / 2));
    const block = (x0, w2, top, col, win) => { f.fillStyle = col; f.fillRect(x0, top, w2, 90 - top); f.fillStyle = win; for (let y = top + 3; y < 82; y += 5) for (let x = x0 + 2; x < x0 + w2 - 2; x += 4) if (r() < 0.75) f.fillRect(x, y, 2, 2); f.fillStyle = "#d6dde4"; f.fillRect(x0, top, w2, 1); };
    block(2, 26, 34, "#b8bfc8", "#9aa4b0"); block(34, 18, 46, "#c8b8b8", "#a89898"); block(58, 40, 12, "#c4c9d0", "#a3abb6"); block(104, 22, 40, "#b6bcc4", "#98a0ac"); block(132, 34, 26, "#c9cdd2", "#a8afb8"); block(170, 26, 44, "#c4b2ae", "#a8958f"); block(200, 30, 20, "#bfc5cc", "#a0a8b2");
    f.fillStyle = "#9fb69a"; for (let i = 0; i < 18; i++) { const tx = (i * 23) % FW, ty = 70 + (i % 3) * 3; f.beginPath(); f.arc(tx, ty, 5 + (i % 3), 0, Math.PI * 2); f.fill(); }
    { const id2 = f.getImageData(0, 0, FW, far.height), d2 = new Uint32Array(id2.data.buffer), hz = u32(HAZE); for (let y = 0; y < far.height; y++) for (let x = 0; x < FW; x++) { const i = y * FW + x; if ((d2[i] >>> 24) && ((x + y) & 1) && (y > 20 || (x & 2))) d2[i] = hz; } f.putImageData(id2, 0, 0); } // the haze, one pixel in two
    // ---- the street (it scrolls with the fight)
    const [mid, m] = mk(STAGE_W, H);
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
    m.fillStyle = "#d8d8de"; m.fillRect(wx0 + 60, yG - 34, 18, 10); m.fillStyle = "#9a9aa4"; m.fillRect(wx0 + 60, yG - 27, 18, 3); // the machine
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
    STAGE = { sky, clouds, far, mid, npc };
    return STAGE;
  }
  // the backdrop, layer by layer: the sky (still), the clouds (drifting, slow), the far city (soft), the street
  function drawBackdrop(ctx, camX, t, sy = 0) {
    const S = stage();
    ctx.drawImage(S.sky, 0, 0);
    const cxo = Math.floor(camX * 0.15 + t * 3) % 768; ctx.drawImage(S.clouds, -cxo, sy); ctx.drawImage(S.clouds, 768 - cxo, sy);
    ctx.drawImage(S.far, 0, 0, S.far.width, S.far.height, -Math.round(camX * 0.4), 40 + sy, S.far.width * 2, S.far.height * 2);
    ctx.drawImage(S.mid, -Math.round(camX), sy);
  }
  // the bystanders: someone on the step with a cup, two people chatting by the caravan, the barista inside
  function drawCrowd(ctx, camX, t, cheer) {
    const S = stage();
    for (let i = 0; i < S.npc.length; i++) {
      const { n } = S.npc[i], busy = g && g.f && g.f.some((f) => f.id === NPC_LOOKS[n.id].headId), { frames, cheer: ch } = busy ? S.npc[i].alt : S.npc[i].own;
      const x = Math.round(n.x - camX), img = cheer && ch ? ch : frames[Math.floor(t * n.rate + i) % frames.length];
      if (x < -60 || x > W + 60) continue;
      if (n.clip) { ctx.save(); ctx.beginPath(); ctx.rect(n.clip[0] - camX, n.clip[1], n.clip[2], n.clip[3]); ctx.clip(); }
      ctx.save(); ctx.translate(x, n.y + (cheer && !ch ? -Math.round(Math.abs(Math.sin(t * 9 + i)) * 2) : 0)); if (n.face < 0) ctx.scale(-1, 1); ctx.drawImage(img, -OX, -OY); ctx.restore();
      if (n.clip) ctx.restore();
    }
  }

  // ===================== 5. the roster =====================
  const ROSTER = {
    daniel: { id: "daniel", name: "DANIEL", role: "FOUNDER - CREATIVE ARCHITECT", special: "COLOR WAVE", line: "PAINTS THE ROOM IN ONE MOVE", speed: 1, power: 1 },
    cristian: { id: "cristian", name: "CRISTIAN", role: "PARTNER - CEO", special: "DEADLINE DASH", line: "ALWAYS ONE STEP AHEAD", speed: 1.08, power: 0.95 },
    ion: { id: "ion", name: "I O N", role: "FOUNDER OF TWO MINUTES", special: "ESPRESSO SHOT", line: "TWO MINUTES IS ALL HE NEEDS", speed: 1, power: 1 },
    // beta 3.11 (Daniel): the guests (Iulica is on the crew page too)
    cristache: { id: "cristache", name: "CRISTACHE", role: "SPECIAL GUEST", special: "HIGH FIVE", line: "ALWAYS REACHING HIGHER", speed: 1.06, power: 1 },
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
  const TITLE_POSES = [P0, pose({ eF: [20, -90], hF: [26, -106], eB: [-6, -58], hB: [6, -54] }), pose({ eF: [20, -64], hF: [30, -74], eB: [4, -62], hB: [14, -70], tw: 0.6 }), pose({ eF: [18, -86], hF: [28, -102], eB: [-10, -86], hB: [-18, -102], tw: 0.7 })];
  const TITLE_FR = {};
  const titleFrame = (id, k) => TITLE_FR[id] || (TITLE_FR[id] = drawFighter(id, TITLE_POSES[k % TITLE_POSES.length], null));
  function drawTitle(ctx, t) {
    // a sky going from night to fire, sun rays turning slowly
    const SK2 = ["#1b1438", "#2a1a4a", "#4a2060", "#7a2a5a", "#b8404a", "#e8703a", "#f6a24a"];
    for (let y = 0; y < H; y++) { const tt = (y / H) * (SK2.length - 1), i = Math.floor(tt), f = tt - i; ctx.fillStyle = f > 0.5 && (y & 1) ? SK2[Math.min(SK2.length - 1, i + 1)] : SK2[i]; ctx.fillRect(0, y, W, 1); }
    ctx.save(); ctx.globalAlpha = 0.12; ctx.fillStyle = "#ffe6a0"; const rot = t * 0.08;
    for (let i = 0; i < 12; i++) { const a0 = rot + (i / 12) * Math.PI * 2; ctx.beginPath(); ctx.moveTo(W / 2, 150); ctx.lineTo(W / 2 + Math.cos(a0) * 400, 150 + Math.sin(a0) * 400); ctx.lineTo(W / 2 + Math.cos(a0 + 0.13) * 400, 150 + Math.sin(a0 + 0.13) * 400); ctx.fill(); }
    ctx.restore();
    // the roster: a back row and a front row, posing
    const back = ["steve", "cristian", "maria", "dony", "daniel"], front = ["rares", "ion", "cristache", "iulica"];
    back.forEach((id, i) => { const img = titleFrame(id, i + 1), x = 38 + i * 77; ctx.save(); ctx.filter = "brightness(0.72)"; ctx.drawImage(img, Math.round(x - OX), 214 - OY); ctx.restore(); });
    front.forEach((id, i) => { const img = titleFrame(id, i), x = 74 + i * 78, bob = Math.round(Math.sin(t * 2 + i) * 0.6); ctx.save(); if (i >= 2) { ctx.translate(Math.round(x), 0); ctx.scale(-1, 1); ctx.drawImage(img, -OX, 232 - OY + bob); } else ctx.drawImage(img, Math.round(x - OX), 232 - OY + bob); ctx.restore(); });
    // the logo
    const l1 = logoText("AT THE GLOVES", 3, METAL, "#d8342a"), l2 = logoText("I O N", 5, FIRE, "#fed012");
    ctx.drawImage(l1.c, Math.round(W / 2 - l1.w / 2), 1);
    text(ctx, "WITH", W / 2, 40, "#ffffff", { sc: 1, al: "c" });
    ctx.drawImage(l2.c, Math.round(W / 2 - l2.w / 2), 48);
    ctx.fillStyle = "rgba(14,10,26,.7)"; ctx.fillRect(0, H - 22, W, 22);
    if (Math.floor(t * 2) % 2 === 0) text(ctx, TOUCH ? "TAP TO START" : "PRESS START", W / 2, H - 19, GOLD, { sc: 1, al: "c" });
    text(ctx, "A TWO MIN LAB GAME BY CROMATIC STUDIOS", W / 2, H - 9, "#a99cc8", { al: "c" });
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
  function frame(ctx, x, y, w, col) { ctx.fillStyle = OUT; ctx.fillRect(x - 3, y - 3, w + 6, w + 6); ctx.fillStyle = col; ctx.fillRect(x - 2, y - 2, w + 4, w + 4); }
  // S: { phase: "p1" | "cpu", p1, cpu } (indexes in GRID.order)
  function drawSelect(ctx, t, S) {
    stripes(ctx, t, "#1b1438", "#211a44");
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
      const p = portraitBig(id); if (!p) return;
      ctx.fillStyle = OUT; ctx.fillRect(x - 3, 37, 134, 134); ctx.fillStyle = flip ? "#d8342a" : "#fed012"; ctx.fillRect(x - 2, 38, 132, 132); ctx.fillStyle = "#241d3d"; ctx.fillRect(x, 40, 128, 128);
      drawFlipped(ctx, p, x, 40, 128, 128, flip);
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
  function bar(ctx, x, y, w, hp, trail, flip, t) {
    ctx.fillStyle = OUT; ctx.fillRect(x - 2, y - 2, w + 4, 12);
    ctx.fillStyle = "#c9a640"; ctx.fillRect(x - 1, y - 1, w + 2, 10);
    ctx.fillStyle = "#7a0f0b"; ctx.fillRect(x, y, w, 8);
    const tw = Math.round(w * clamp(trail, 0, 1)), hw = Math.round(w * clamp(hp, 0, 1));
    ctx.fillStyle = "#ff5236"; ctx.fillRect(flip ? x : x + w - tw, y, tw, 8);
    const low = hp < 0.25 && Math.floor(t * 8) % 2;
    ctx.fillStyle = low ? "#ffffff" : "#ffd23a"; ctx.fillRect(flip ? x : x + w - hw, y, hw, 8);
    ctx.fillStyle = low ? "#ffffff" : "#fff6b8"; ctx.fillRect(flip ? x : x + w - hw, y, hw, 2);
    ctx.fillStyle = low ? "#e8e8e8" : "#f29a14"; ctx.fillRect(flip ? x : x + w - hw, y + 6, hw, 2);
  }
  function cupIcon(ctx, x, y, full) {
    ctx.fillStyle = OUT; ctx.fillRect(x, y, 8, 8); ctx.fillRect(x + 8, y + 2, 2, 4);
    ctx.fillStyle = full ? "#ffffff" : "#3a3060"; ctx.fillRect(x + 1, y + 1, 6, 6);
    if (full) { ctx.fillStyle = "#6b3f22"; ctx.fillRect(x + 1, y + 1, 6, 2); }
  }
  function drawHUD(ctx, g, t) {
    const [a, b] = g.f;
    bar(ctx, 14, 8, 150, a.hp / 100, a.trail / 100, false, t);
    bar(ctx, W - 164, 8, 150, b.hp / 100, b.trail / 100, true, t);
    text(ctx, a.R.name, 14, 21, "#ffffff");
    text(ctx, b.R.name, W - 14, 21, "#ffffff", { al: "r" });
    for (let i = 0; i < 2; i++) { cupIcon(ctx, 150 - i * 13, 20, g.wins[0] > i); cupIcon(ctx, W - 160 + i * 13, 20, g.wins[1] > i); }
    // the special meters
    const sp = (x, v, flip) => { ctx.fillStyle = OUT; ctx.fillRect(x - 1, 31, 62, 4); ctx.fillStyle = "#2a2148"; ctx.fillRect(x, 32, 60, 2); const w2 = Math.round(60 * clamp(v, 0, 1)); ctx.fillStyle = v >= 1 ? (Math.floor(t * 10) % 2 ? "#7fd8ff" : "#ffffff") : "#3a8fe0"; ctx.fillRect(flip ? x + 60 - w2 : x, 32, w2, 2); };
    sp(14, 1 - a.spCool / a.spMax, false); sp(W - 74, 1 - b.spCool / b.spMax, true);
    // the timer
    ctx.fillStyle = OUT; ctx.fillRect(W / 2 - 16, 4, 32, 22); ctx.fillStyle = "#241d3d"; ctx.fillRect(W / 2 - 15, 5, 30, 20);
    const tt = String(Math.max(0, Math.ceil(g.time))).padStart(2, "0");
    text(ctx, tt, W / 2, 8, g.time <= 10 ? RED : GOLD, { sc: 2, al: "c" });
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
  const GRAV = 0.34, JUMP_V = -6.8, ROUND_TIME = 60;
  function fighter(id, cpu, x, face, alt) {
    const R = ROSTER[id];
    return { id, R, S: sprites(id, alt), sc: (LOOKS[id].build.sc || 1) * BODY, armor: 0, cpu, x, y: 0, vx: 0, vy: 0, face, hp: 100, trail: 100, st: "idle", t: 0, atk: null, atkHit: false, hs: 0, spCool: 40, spMax: SPECIAL[id].cool, inv: 0, walkT: 0, walkDir: 1, holdBack: false, holdDown: false, ai: { t: 30, plan: null, pt: 0, seen: 0 }, flashT: 0, dz: 0, landT: 0 };
  }
  const onGround = (f) => f.y >= 0;
  const free = (f) => onGround(f) && (f.st === "idle" || f.st === "walk" || f.st === "crouch");
  const hurt = (f) => { const top = (f.st === "crouch" || (f.st === "atk" && f.atk?.crouch) || (f.st === "block" && f.crouchBlock) ? -70 : f.st === "down" ? -14 : -102) * f.sc, hw = 14 * f.sc; return [f.x - hw, f.y + top, f.x + hw, f.y - (onGround(f) ? 0 : 18)]; };
  const boxOf = (f, b0) => { const b = b0.map((v) => v * f.sc); return f.face > 0 ? [f.x + b[0], f.y + b[1], f.x + b[2], f.y + b[3]] : [f.x - b[2], f.y + b[1], f.x - b[0], f.y + b[3]]; };
  const overlap = (a, b) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];

  let g = null; // the match
  function newMatch(me, cpu) {
    g = { scene: "vs", me, cpu: cpu || "ion", voucher: null, t: 0, round: 1, wins: [0, 0], phase: "intro", pt: 0, time: ROUND_TIME, f: [], proj: [], fx: [], hitstop: 0, shake: 0, flash: 0, camX: (STAGE_W - W) / 2, slow: 0, menu: 0, result: null, perfect: false };
    resetRound();
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
  function jump(f, dir) { f.st = "jump"; f.vy = JUMP_V; f.vx = dir * 1.95 * f.R.speed; f.atk = null; f.t = 0; SND.play("jump"); }
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
        if (a.beans) for (let i = 0; i < a.beans; i++) g.proj.push({ k: "bean", x: f.x + f.face * 26, y: f.y - 58 * f.sc, vx: (a.speed + i * 0.5) * f.face, vy: -1.6 + i * 1.1, owner: f, dmg: a.dmg, t: 0, i });
        else if (a.proj) g.proj.push({ k: a.proj, x: f.x + f.face * 30, y: f.y - (a.proj === "wave" ? 62 : 70), vx: a.speed * f.face, owner: f, dmg: a.dmg, t: 0 });
        if (a.flash) { g.flash = 10; spark(f.x + f.face * 28, f.y - 80, "flash"); }
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
      if (overlap(hb, hu)) { f.atkHit = true; land(f, o, at, (Math.max(hb[0], hu[0]) + Math.min(hb[2], hu[2])) / 2, (Math.max(hb[1], hu[1]) + Math.min(hb[3], hu[3])) / 2); if (at.dash) f.vx = -f.face * 1.5; }
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
    const pbw = 28 * Math.max(a.sc, b.sc);
    if (Math.abs(a.x - b.x) < pbw && Math.abs(a.y - b.y) < 70 && a.st !== "down" && b.st !== "down") { const push = (pbw - Math.abs(a.x - b.x)) / 2, s = a.x <= b.x ? -1 : 1; a.x += s * push; b.x -= s * push; }
    for (const f of g.f) f.x = clamp(f.x, Math.max(18, g.camX + 18), Math.min(STAGE_W - 18, g.camX + W - 18));
    const goal = clamp((a.x + b.x) / 2 - W / 2, 0, STAGE_W - W); g.camX += (goal - g.camX) * 0.18;
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
      case "walk": { const n = S.walk.length, i = ((Math.floor(f.walkT / 6) % n) + n) % n; return S.walk[i]; }
      case "crouch": return S.crouch[0];
      case "block": return f.crouchBlock ? S.cblock[0] : S.block[0];
      case "jump": return S.jump[0];
      case "hit": return S.hit[0];
      case "dizzy": return S.dizzy[Math.floor(t / 12) % 2];
      case "fall": return S.fall[0];
      case "down": return S.down[0];
      case "win": return S.win[Math.floor(t / 14) % 2];
      case "intro": return S.intro[0];
      default: return S.idle[Math.floor(t / 10) % 4];
    }
  }
  function drawSprite(ctx, img, x, y, face) {
    ctx.save(); ctx.translate(Math.round(x), Math.round(y)); if (face < 0) ctx.scale(-1, 1); ctx.drawImage(img, -OX, -OY); ctx.restore();
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
  function banner(ctx, s, fill, sc, y) { const bh = 7 * sc + 13; ctx.fillStyle = "rgba(14,10,26,.74)"; ctx.fillRect(0, y - 6, W, bh); ctx.fillStyle = "rgba(254,208,18,.5)"; ctx.fillRect(0, y - 7, W, 1); ctx.fillRect(0, y - 6 + bh, W, 1); text(ctx, s, W / 2, y, fill, { sc, sh: 2, al: "c" }); }
  function drawFight(ctx, t) {
    const sx = g.shake > 0 ? Math.round(rnd(-g.shake, g.shake)) : 0, sy = g.shake > 0 ? Math.round(rnd(-g.shake, g.shake) * 0.6) : 0;
    const cx = Math.round(g.camX) - sx;
    drawBackdrop(ctx, cx, t, sy);
    if (g.cheerT > 0 && !paused) g.cheerT--;
    drawCrowd(ctx, cx, t, g.cheerT > 0 || g.phase === "ko" && g.pt > 60 || g.phase === "match");
    ctx.save(); ctx.translate(0, sy);
    // shadows
    for (const f of g.f) { const w = Math.round(30 - Math.min(16, -f.y / 6)), x = Math.round(f.x - cx); ctx.fillStyle = "rgba(10,6,24,.45)"; ctx.fillRect(x - w / 2, FLOOR - 2, w, 3); ctx.fillRect(x - w / 2 + 3, FLOOR - 3, w - 6, 5); }
    for (const e of g.fx) if (e.k === "ghost" || e.k === "stack") drawFx(ctx, e, cx);
    // the one attacking is drawn in front
    const order = g.f[0].st === "atk" ? [g.f[1], g.f[0]] : [g.f[0], g.f[1]];
    for (const f of order) {
      const jit = (f.st === "hit" || f.st === "block") && g.hitstop > 0 ? (g.hitstop % 2 ? 1 : -1) : 0;
      if (f.inv > 0 && f.inv % 4 < 2 && f.hp > 0) continue;
      const spin = f.atk?.spin && f.t >= f.atk.su && f.t < f.atk.su + f.atk.ac && (f.t >> 2) & 1 ? -1 : 1; // beta 3.11: Maria turns round
      drawSprite(ctx, frameOf(f), f.x - cx + jit, FLOOR + f.y, f.face * spin);
      if (f.st === "dizzy") for (let i = 0; i < 3; i++) { const an = t * 5 + (i * Math.PI * 2) / 3, x = Math.round(f.x - cx + Math.cos(an) * 12), y = Math.round(FLOOR + f.y - 92 + Math.sin(an) * 3); ctx.fillStyle = OUT; ctx.fillRect(x - 2, y - 2, 5, 5); ctx.fillStyle = i === 1 ? "#ffffff" : "#ffe14a"; ctx.fillRect(x - 1, y - 1, 3, 3); }
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
      if (g.round === 1) { ctx.fillStyle = "rgba(14,10,26,.72)"; ctx.fillRect(0, H - 22, W, 16); text(ctx, "TWO MINUTES COFFEE SHOP - ARICESCU 50A, BUCHAREST", W / 2, H - 18, "#ffffff", { al: "c" }); }
      else banner(ctx, "FIGHT!", RED, g.pt < 70 ? 7 : 6, 80);
    } else if (g.phase === "ko" && g.pt < 150) banner(ctx, "K.O.", RED, g.pt < 8 ? 9 : 7, 72);
    else if (g.phase === "time" && g.pt < 150) banner(ctx, g.f[0].hp === g.f[1].hp ? "DRAW" : "TIME", GOLD, 6, 78);
    else if (g.phase === "match") { banner(ctx, g.result === "win" ? "YOU WIN" : ROSTER[g.cpu].name + " WINS", g.result === "win" ? GOLD : RED, ROSTER[g.cpu].name.length > 6 && g.result !== "win" ? 4 : 5, 70); if (g.perfect && g.result === "win") text(ctx, "PERFECT!", W / 2, 112, "#ffffff", { sc: 2, al: "c" }); }
    if ((g.phase === "ko" || g.phase === "time") && g.pt > 150 && g.pt < 220) { const [a, b] = g.f; if (a.hp !== b.hp) banner(ctx, (a.hp > b.hp ? a : b).R.name + " WINS THE ROUND", "#ffffff", 2, 86); }
    if (paused) { // beta 3.15 (Daniel): the menu, any time: play on, pick other fighters, or go back to the map
      ctx.fillStyle = "rgba(14,10,26,.78)"; ctx.fillRect(0, 0, W, H); banner(ctx, "PAUSE", GOLD, 4, 46);
      PAUSE_ITEMS.forEach((s2, i) => {
        const y = 96 + i * 24, on = pmenu === i, w = 170;
        ctx.fillStyle = OUT; ctx.fillRect(W / 2 - w / 2 - 1, y - 6, w + 2, 20); ctx.fillStyle = on ? "#fed012" : "#2d2550"; ctx.fillRect(W / 2 - w / 2, y - 5, w, 18);
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
  let CAR = null;
  function carDacia() { // the yellow saloon, side on, facing right, the bonnet up
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
    tiny(x, "DACIA", 12, 41, "#7a5a10"); // the name on the boot, as on the site's car
    // the wheels
    for (const wx of [34, 136]) { x.fillStyle = OUT; x.beginPath(); x.arc(wx, gy - 10, 11, 0, Math.PI * 2); x.fill(); x.fillStyle = "#2a2a30"; x.beginPath(); x.arc(wx, gy - 10, 10, 0, Math.PI * 2); x.fill(); x.fillStyle = "#c9ccd4"; x.beginPath(); x.arc(wx, gy - 10, 5, 0, Math.PI * 2); x.fill(); x.fillStyle = "#ffffff"; x.fillRect(wx - 3, gy - 14, 2, 2); x.fillStyle = "#8a8e98"; x.fillRect(wx - 1, gy - 11, 2, 2); }
    // the engine showing over the wing, the bonnet up on its hinge
    x.fillStyle = "#3a3a42"; x.fillRect(118, 32, 44, 6); x.fillStyle = "#9a9ea8"; x.fillRect(124, 29, 14, 7); x.fillRect(142, 30, 8, 5); x.fillStyle = "#5a5e68"; x.fillRect(126, 31, 10, 2); x.fillStyle = "#d8342a"; x.fillRect(152, 31, 4, 3);
    P([[114, 35], [156, 2], [162, 6], [118, 37]], OUT); P([[115, 34], [156, 4], [160, 7], [118, 36]], Yc[3]); P([[116, 34], [154, 6], [156, 8], [118, 35]], Yc[1]);
    x.fillStyle = "#9a9ea8"; x.fillRect(136, 18, 1, 16); // the prop rod
    CAR = c; return c;
  }
  const END_POSES = {
    cristache: pose({ hip: [2, -46], neck: [14, -66], head: [18, -75], eF: [24, -56], hF: [32, -58], eB: [18, -54], hB: [26, -50], kF: [12, -24], fF: [16, 0], kB: [-6, -23], fB: [-10, 0], tw: 0.5 }),
    ion: pose({ hip: [0, -28], neck: [6, -52], head: [9, -63], eF: [16, -38], hF: [24, -26], eB: [10, -40], hB: [20, -30], kF: [14, -20], fF: [18, 0], kB: [-6, -5], fB: [-20, 0], tw: 0.4 }),
    rares: pose({ eF: [16, -88], hF: [22, -104], eB: [-6, -58], hB: [4, -52], kF: [10, -24], fF: [14, 0], kB: [-8, -23], fB: [-14, 0] })
  };
  const END_FR = {}, END_SC = 0.74; // in the scene they stand back by the car: a size that suits a car
  const endFrame = (id) => { if (END_FR[id]) return END_FR[id]; const L0 = LOOKS[id]; NPC_LOOKS["end_" + id] = Object.assign({}, L0, { headId: id, hands: "bare", build: Object.assign({}, L0.build, { sc: END_SC * (L0.build.sc || 1) }) }); return (END_FR[id] = drawFighter("end_" + id, END_POSES[id], null)); };
  function drawEnding(ctx, t) {
    drawBackdrop(ctx, 150, t);
    const gy = FLOOR - 4, cx0 = 4;
    ctx.fillStyle = "rgba(10,6,24,.35)"; ctx.fillRect(cx0 + 6, gy - 2, 170, 4);
    ctx.drawImage(carDacia(), cx0, gy - 74);
    // the battery on the pavement, the cables to the engine
    const bx = 190, by = gy - 11;
    ctx.fillStyle = OUT; ctx.fillRect(bx - 1, by - 1, 18, 12); ctx.fillStyle = "#2a2a30"; ctx.fillRect(bx, by, 16, 10); ctx.fillStyle = "#4a4a52"; ctx.fillRect(bx, by, 16, 2); ctx.fillStyle = "#d8342a"; ctx.fillRect(bx + 2, by - 3, 3, 3); ctx.fillStyle = "#9a9ea8"; ctx.fillRect(bx + 11, by - 3, 3, 3);
    const cable = (x1, y1, x2, y2, col, sag) => { ctx.strokeStyle = OUT; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo((x1 + x2) / 2, Math.max(y1, y2) + sag, x2, y2); ctx.stroke(); ctx.strokeStyle = col; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(x1, y1); ctx.quadraticCurveTo((x1 + x2) / 2, Math.max(y1, y2) + sag, x2, y2); ctx.stroke(); };
    cable(bx + 3, by - 2, cx0 + 146, gy - 42, "#e8301c", 26); cable(bx + 12, by - 2, cx0 + 156, gy - 40, "#2a2a30", 30);
    // the three of them
    const put3 = (id, x2, face) => { ctx.save(); ctx.translate(Math.round(x2), gy); if (face < 0) ctx.scale(-1, 1); ctx.drawImage(endFrame(id), -OX, -OY); ctx.restore(); };
    put3("rares", 26, 1); put3("cristache", 178, -1); put3("ion", 216, -1);
    // the sparks, at the clamps
    for (const [sx, sy] of [[bx + 3, by - 3], [cx0 + 146, gy - 43]]) for (let i = 0; i < 6; i++) { const an = (i / 6) * Math.PI * 2 + t * 7, r2 = 2 + ((Math.floor(t * 12) + i) % 4) * 2; ctx.fillStyle = i % 2 ? "#ffffff" : "#ffd23a"; ctx.fillRect(Math.round(sx + Math.cos(an) * r2), Math.round(sy + Math.sin(an) * r2), 2, 2); }
  }
  function drawResult(ctx, t) {
    drawEnding(ctx, t);
    const win = g.result === "win", cpuN = ROSTER[g.cpu].name, px0 = 232, pw = 148;
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
      ctx.fillStyle = OUT; ctx.fillRect(mx - w / 2 - 1, y - 5, w + 2, 17); ctx.fillStyle = on ? "#fed012" : "#2d2550"; ctx.fillRect(mx - w / 2, y - 4, w, 15);
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
  let root = null, cv = null, cx2 = null, scene = "title", sceneT = 0, paused = false, hits = [], stats = { fps: 0, frames: 0, t0: 0 };
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
      const move = (d) => { SEL[k] = (SEL[k] + d + n) % n; SND.play("select"); };
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
        if (g.hitstop > 0) g.hitstop--;
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
    ctx.imageSmoothingEnabled = false;
    if (scene === "title") { drawTitle(ctx, t); hit(0, 0, W, H, () => pressed.add("ok")); }
    else if (scene === "select") {
      drawSelect(ctx, t, SEL);
      GRID.order.forEach((id, i) => { const [x, y] = tilePos(i); hit(x - 3, y - 3, TILE + 6, TILE + 6, () => { const k = SEL.phase === "p1" ? "p1" : "cpu"; if (SEL[k] === i) pressed.add("ok"); else { SEL[k] = i; SND.play("select"); } }); });
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
    else { sc = Math.min((vw - 32) / W, (vh - 96) / H); if (sc >= 2) sc = Math.floor(sc); top = Math.max(16, (vh - H * sc) / 2 - 14); }
    sc = Math.max(0.3, sc);
    cvBox = { left: Math.round((vw - W * sc) / 2), top: Math.round(top), w: Math.round(W * sc), h: Math.round(H * sc) };
    cv.style.width = cvBox.w + "px"; cv.style.height = cvBox.h + "px"; cv.style.left = cvBox.left + "px"; cv.style.top = cvBox.top + "px";
    root.style.setProperty("--cv-bottom", Math.round(top + H * sc) + "px");
  }
  // the rotate screen: a little phone turning, in the game's pixels
  function drawRotate(t) {
    const c = root.querySelector(".mg-rot-cv"); if (!c) return; const x = c.getContext("2d"); x.imageSmoothingEnabled = false;
    x.fillStyle = "#140f22"; x.fillRect(0, 0, c.width, c.height);
    const side = Math.floor(t / 1.1) % 2 === 1, cx = c.width / 2, cy = 44;
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
    [cv, cx2] = mk(W, H); cv.className = "mg-cv"; cv.setAttribute("role", "img"); cv.setAttribute("aria-label", "At the gloves with I O N, a fighting game");
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
      const [rc] = mk(192, 108); rc.className = "mg-rot-cv"; rot.appendChild(rc);
      const btn = document.createElement("button"); btn.type = "button"; btn.className = "mg-rot-btn"; btn.hidden = true; btn.appendChild(pxText("PLAY SIDEWAYS ANYWAY", "#170f19", 2));
      btn.onclick = (e) => { e.stopPropagation(); SIDEWAYS = true; layout(); };
      rot.addEventListener("pointerdown", () => { SND.init(); lockLandscape(); });
      rot.appendChild(btn); root.appendChild(rot); }
    addEventListener("resize", layout); addEventListener("orientationchange", () => setTimeout(layout, 120)); layout();
    // everything is baked before the first frame (a few ms), then the loop: logic in fixed 1/60 s steps
    for (const id of FIGHTERS) portrait(id); stage(); // the fighters themselves are baked when they are picked (the VS screen)
    let last = performance.now(), acc = 0;
    stats.t0 = last;
    const loop = (now) => {
      stats.maxDt = Math.max(stats.maxDt || 0, now - last);
      acc += Math.min(0.1, (now - last) / 1000); last = now;
      let n = 0; while (acc >= 1 / 60 && n < 4) { step(); acc -= 1 / 60; n++; }
      if (n === 4) acc = 0;
      draw(now / 1000);
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
  const probe = () => ({ scene: scene === "game" && g ? g.scene : scene, phase: g?.phase, round: g?.round, wins: g?.wins.slice(), hp: g?.f.map((f) => f.hp), st: g?.f.map((f) => f.st), time: g ? Math.ceil(g.time) : null, me: g?.me, cpu: g?.cpu, sel: SEL.p1, selCpu: SEL.cpu, selPhase: SEL.phase, menu: g?.menu, result: g?.result, paused, voucher: g?.voucher?.code || null, sideways: !!SIDEWAYS, rotate: !!(root && root.classList.contains("mg-rot")), fps: stats.fps, maxDt: Math.round(stats.maxDt || 0), sound: SND.on, proj: g ? g.proj.map((p) => p.k) : [] });
  const resetMaxDt = () => { stats.maxDt = 0; };
  const setHp = (a, b) => { if (g && g.f.length) { g.f[0].hp = g.f[0].trail = a; g.f[1].hp = g.f[1].trail = b; } };

  // the art on its own, for review: every sheet as a PNG data URL, scaled with crisp pixels
  function exportArt(scale = 5) {
    const up = (c, s = scale) => { const [o, x] = mk(c.width * s, c.height * s); x.drawImage(c, 0, 0, o.width, o.height); return o.toDataURL("image/png"); };
    const out = {};
    for (const id of Object.keys(LOOKS)) {
      const S = sprites(id), order = ["idle", "walk", "crouch", "jump", "punch", "kick", "cpunch", "ckick", "jpunch", "jkick", "block", "cblock", "special", "hit", "dizzy", "fall", "down", "win", "intro"];
      const frames = []; for (const k of order) for (const f of S[k]) frames.push([k, f]);
      const cols = 8, rows = Math.ceil(frames.length / cols), [c, x] = mk(cols * CW, rows * (CH + 10));
      x.fillStyle = "#2a2148"; x.fillRect(0, 0, c.width, c.height);
      frames.forEach(([k, f], i) => { const cx = (i % cols) * CW, cy = Math.floor(i / cols) * (CH + 10); x.fillStyle = "#332a58"; x.fillRect(cx + 1, cy + 1, CW - 2, CH - 2); x.drawImage(f, cx, cy); text(x, k.toUpperCase(), cx + 3, cy + CH + 1, "#a99cc8", { ol: null }); });
      out[`sprites-${id}`] = up(c, 4);
      const [ic, ix] = mk(CW, CH); ix.fillStyle = "#332a58"; ix.fillRect(0, 0, CW, CH); ix.drawImage(S.idle[0], 0, 0); out[`idle-${id}`] = up(ic, 6);
      const [pc, px] = mk(64, 64); px.fillStyle = "#241d3d"; px.fillRect(0, 0, 64, 64); px.drawImage(portrait(id), 0, 0); out[`portrait-${id}`] = up(pc, 6);
      if (id === Object.keys(LOOKS)[0]) { const ids = Object.keys(LOOKS), [sc2, sx2] = mk(ids.length * 70 + 6, 76); sx2.fillStyle = "#1b1438"; sx2.fillRect(0, 0, sc2.width, sc2.height); ids.forEach((q, i) => { sx2.fillStyle = "#241d3d"; sx2.fillRect(6 + i * 70, 6, 64, 64); sx2.drawImage(portrait(q), 6 + i * 70, 6); }); out.portraits = up(sc2, 4); }    }
    { // the heads, big
      const ids = Object.keys(HEADSPEC), [c, x] = mk(ids.length * (HW + 6) + 6, HH + 16); x.fillStyle = "#2a2148"; x.fillRect(0, 0, c.width, c.height);
      ids.forEach((id, i) => { const HD = headOf(id), [hc, hx2] = mk(HW, HH), idd = hx2.createImageData(HW, HH), d = new Uint32Array(idd.data.buffer); HD.rows.forEach((r, y) => [...r].forEach((ch, xx) => { if (ch !== ".") d[y * HW + xx] = HD.pal[ch]; })); hx2.putImageData(idd, 0, 0); x.drawImage(hc, 6 + i * (HW + 6), 4); });
      out.heads = up(c, 8);
    }
    { // the idle loop: the four breathing frames of each fighter, in a row
      const ids = Object.keys(LOOKS), [c, x] = mk(4 * 70 + 10, ids.length * (CH - 30)); x.fillStyle = "#2a2148"; x.fillRect(0, 0, c.width, c.height);
      ids.forEach((id, r) => sprites(id).idle.forEach((f, i) => x.drawImage(f, i * 70 + 5 - (OX - 35), r * (CH - 30) - 24)));
      out["idle-loop"] = up(c, 3);
    }
    { // the line-up: everyone in the stance, then a punch and a kick at full stretch
      const ids = Object.keys(LOOKS), [c, x] = mk(ids.length * 84 + 24, 3 * (CH - 8) + 12);
      x.fillStyle = "#2a2148"; x.fillRect(0, 0, c.width, c.height);
      ["idle", "punch", "kick"].forEach((k, r) => ids.forEach((id, i) => { const S = sprites(id), f = k === "idle" ? S.idle[0] : S[k][2]; x.drawImage(f, i * 84 + 12 - (OX - 42), r * (CH - 8) - 4); if (r === 0) text(x, ROSTER[id] ? ROSTER[id].name : id.toUpperCase(), i * 84 + 54, 4, "#ffffff", { al: "c" }); }));
      out.lineup = up(c, 3);
    }
    const S = stage(); { const [c, x] = mk(STAGE_W, H); for (let cx3 = 0; cx3 < STAGE_W; cx3 += W) { x.save(); x.translate(cx3, 0); x.beginPath(); x.rect(0, 0, Math.min(W, STAGE_W - cx3), H); x.clip(); drawBackdrop(x, cx3, 0); drawCrowd(x, cx3, 0, false); x.restore(); } out.stage = up(c, 4); }
    const [c, x] = mk(W, H);
    drawTitle(x, 0); out.title = up(c);
    drawSelect(x, 0.1, { phase: "p1", p1: 0, cpu: 0 }); out.select = up(c);
    drawSelect(x, 0.1, { phase: "cpu", p1: 8, cpu: 0 }); out["select-cpu"] = up(c);
    drawVS(x, 0, "daniel", 1); out.vs = up(c);
    { const g0 = g; g = { result: "win", me: "cristache", cpu: "ion", wins: [2, 1], menu: 0, voucher: { code: "TM-K7QX-1710", date: "17.10.2026  14:32" } }; hits = []; drawResult(x, 0.2); out.voucher = up(c); g = g0; hits = []; }
    { const g0 = g; g = { result: "lose", me: "daniel", cpu: "ion", wins: [1, 2], menu: 0 }; hits = []; drawResult(x, 0.2); out["ending-lose"] = up(c); g = g0; hits = []; }
    { // the HUD over the stage, with the two fighters in their stance
      drawBackdrop(x, 96, 0); drawCrowd(x, 96, 0, false);
      const A = sprites("daniel").idle[0], B = sprites("ion").idle[0];
      x.drawImage(A, 140 - OX, FLOOR - OY);
      x.save(); x.translate(244 + OX, FLOOR - OY); x.scale(-1, 1); x.drawImage(B, 0, 0); x.restore();
      drawHUD(x, { f: [{ R: ROSTER.daniel, hp: 72, trail: 80, spCool: 0, spMax: 1 }, { R: ROSTER.ion, hp: 45, trail: 45, spCool: 0.5, spMax: 1 }], wins: [1, 0], time: 47 }, 0);
      out.hud = up(c);
    }
    return out;
  }
  window.czGloves = Object.assign(window.czGloves || {}, { mount, exportArt, probe, setHp, resetMaxDt });
  const auto = () => { const el = document.getElementById("mg"); if (el && !root) mount(el); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", auto); else auto();
})();
