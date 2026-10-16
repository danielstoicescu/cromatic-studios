// beta 3.1 (Daniel): "at the gloves with I O N", the Two Min Lab mini-game. A small 16-bit fighting game, original in
// every pixel (no character, name, sprite, sound or font of any existing game): pick Daniel, Cristian or Coz from the
// Cromatic crew and box I O N, the founder of Two Minutes, in front of the Two Minutes shop. Best of three rounds.
// It is its own page, /play/gloves/ (build/build.mjs writes it with this file and src/minigame.css, hashed, loaded
// only there); the map opens it in the case frame (openFrameHook), so closing it, Back and the camera behave as they
// do for a case page. Everything is drawn here, in code, on a 384x216 canvas scaled up with crisp pixels: the font,
// the fighters (a jointed pixel puppet baked into frames at start), the portraits (pixel maps below), the stage, the
// HUD. The sound is Web Audio, made on the spot, and keeps the site's mute setting (localStorage "cz-sound").
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
    "^": "..#..|.###.|#.#.#|..#..|..#..|..#..|..#..", "v": "..#..|..#..|..#..|..#..|#.#.#|.###.|..#.."
  };
  const GL = {};
  for (const [k, v] of Object.entries(GLYPHS)) { const rows = v.split("|"); GL[k] = { w: rows[0].length, rows }; }
  const glyph = (ch) => GL[ch] || GL[ch.toUpperCase()] || GL["?"];
  const textW = (s, sc = 1, sp = 1) => { let w = 0; for (const ch of s) w += (glyph(ch).w + sp) * sc; return Math.max(0, w - sp * sc); };
  const TXT = new Map();
  // a line of text as a small canvas: fill colour (or a vertical gradient: an array of colours, one per glyph row),
  // a dark outline and an optional drop shadow; cached, so a frame draws images, not pixels
  function textImg(s, fill, o = {}) {
    const sc = o.sc || 1, sp = o.sp ?? 1, ol = o.ol === undefined ? OUT : o.ol, sh = o.sh || 0;
    const key = s + "|" + fill + "|" + sc + "|" + sp + "|" + ol + "|" + sh;
    if (TXT.has(key)) return TXT.get(key);
    const pad = (ol ? 1 : 0) + sh, tw = textW(s, sc, sp), th = 7 * sc;
    const [c, x] = mk(tw + pad * 2 + 1, th + pad * 2 + 1);
    const grad = Array.isArray(fill) ? fill : null;
    let cx = pad;
    for (const ch of s) {
      const g = glyph(ch);
      for (let r = 0; r < 7; r++) for (let q = 0; q < g.w; q++) if (g.rows[r][q] === "#") {
        x.fillStyle = grad ? grad[Math.min(grad.length - 1, Math.floor((r * grad.length) / 7))] : fill;
        x.fillRect(cx + q * sc, pad + r * sc, sc, sc);
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
    const r = { c, w: c.width, h: c.height, pad };
    TXT.set(key, r);
    return r;
  }
  // draws text; align "l" | "c" | "r"; y is the top of the letters
  function text(ctx, s, x, y, fill, o = {}) {
    const t = textImg(s, fill, o), al = o.al || "l";
    const lx = al === "c" ? Math.round(x - (t.w - t.pad * 2) / 2) : al === "r" ? x - (t.w - t.pad * 2) : x;
    ctx.drawImage(t.c, lx - t.pad, Math.round(y) - t.pad);
  }
  const GOLD = ["#fff6b8", "#ffe14a", "#ffc21a", "#ff9d14", "#f2700f", "#d9480f", "#b8320c"];
  const RED = ["#ffd0c4", "#ff8a6e", "#ff5236", "#e8301c", "#c41f14", "#9c160f", "#7a0f0b"];
  const ICE = ["#ffffff", "#e8f7ff", "#bfe9ff", "#8fd5ff", "#5cb8f5", "#3a8fe0", "#2a68c0"];

  // ===================== 2. pixel maps: the portraits =====================
  // 64x64 portraits, one letter per palette colour, "0" the outline, "." clear. Reduced from the crew's photos
  // (site/onboarding/media/crew) and I O N's (design/minigame) to 15 colours each, cleaned, then kept as data here
  /*PORTRAITS*/
  const PORTRAITS = {
    daniel: { pal: "a0b0302 b2a180e c422c20 d02545d e674435 f965a42 g0596a5 h887a6e ibf715a j06daef kd08b74 lf2a38b m9adce0 nfdbea7 ofcd8c2", rows: [
      "................................................................",
      "................................................................",
      "................................................................",
      "................................................................",
      "................................................................",
      "................................................................",
      "................................................................",
      "........................00000000................................",
      ".....................000eaaaaaah0000............................",
      "...................00haaaaaaaaaaaaah0...........................",
      "..................0heaaaaaaaaaabbccaa00.........................",
      ".................0eeeaaaaaaabbceeeeeeae0........................",
      "................0hacbaaaaabceefhfkheeea0........................",
      "................0ecaaaaabbcefhkklnnkfeba0.......................",
      "...............0hebeaabceefiklnnnnoookeah0......................",
      "..............0ehbacbbcefkklnnnnnnnnnokba0......................",
      "..............0heabccefilllnnnnnoooononcae0.....................",
      "..............0hebhifillnnnnnnnoooooonnfaa0.....................",
      "..............0hflkkkklnlnnlnnooooooonnhbah0....................",
      "..............0ehokkkiklllnllnoooooonnohbae0....................",
      "..............0ehokikikkllnnnnnooooonnokcac0....................",
      "..............0ehokiiiikllllnnnnnooonnnneac0....................",
      "..............0eholiiiikllllnnnoooonnononab0....................",
      "..............0eholiiiikllnnnnnoniikklnnocak0...................",
      ".............0hehoniiklllllnlnnkfilnnnklofakn0..................",
      "..............0cenniifffknlllklkkllnllnnnefni0..................",
      "..............0ceooecefeefiknllkfebeieknnefnl0..................",
      "..............0hcoleklnnlfeinoniefceklllneeol0..................",
      "..............0hbonkffebffcfnnoliilnnnnlofcln0..................",
      ".............0neekoibeecnleelnnoiffiklllnieln0..................",
      ".............0ikheoifiklkkfeklnnnlllnnnnnffln0..................",
      ".............0kiibolifeeiiffillnnnnlnoonoffnn0..................",
      ".............0ofkbkkiilnnkffilnnnlilnonnnffoo0..................",
      "..............0kfchkikllliffilonnnlbfnnnnfeoo0..................",
      "..............0ofbhllilliefiklonlnonbbnnlfeoo0..................",
      "...............0lcfolikiffffiiliffilkcbnkfbn0...................",
      "...............0okclkiiffebaabbbceeeeeakkfc0....................",
      "................0lcfkkeecbaaaekfcbcfbcbfffch0...................",
      "................0oecfkacbbbacfkleeeabfeeehc0....................",
      ".................0keeiabbccefiinooofnfffeec0....................",
      ".................0lcbfbbbaakiknonlilokfeecc0....................",
      ".................0necbeceeeefiiiillnnoecebe0....................",
      "..................0eebbeffffiiiiklnnnoeecae0....................",
      "..................0ecccbiffikkkkillnnofcbbf0....................",
      "..................0hbccbfiifffffiklnonfcbbh0....................",
      "...................0cbcbckiifieknnnooiecbck0....................",
      "...................0ecbbbfeliiilloolhecbbeo0....................",
      "...................0hcccbbcflkliillfcbbbchn0....................",
      "....................0ecccbbcfffeffebbbbcelnn0...................",
      ".....................0cccbbbbcbcccbabbbbinnnn00.................",
      ".....................0ecccbabcbcbbbbbbbeonnnnno0................",
      "....................0oicccbbbcbaabcbbbbionnnnnno000.............",
      "..................00knniebccbbbaaabbbcfonnnnnooommo00...........",
      ".................0mekolifebbbbcaaabccclnnnnnnnojjjjmm00.........",
      "...............00mgbcoliiffcbcccbbbceknnnnnnomjjjjjjjmm00.......",
      ".............00mgddgaeoiiffhcccbcbehlnnnnnomjjjjjjjjjjjjm00.....",
      "............0mmddddggahlifffheeecehlnnnooojjjjjjjjjjjjjjjjm00...",
      ".........000daggddddggddhhiffihhehklnommjjjjjjjjjjjjjjjjjjjjm00.",
      "........0ohdbdddddddddgddddecehhhhhgjjjjjjjjjjjjjjjjjjjjjjjjjjm0",
      "......00mgdddddddddddddddddddddgggjjjjjjjjjjjjjjjjjjjjjjjjjjjjjm",
      "....00mggggddddddddddddddddddgggggjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj",
      "..00hggggggggddddddddddddddggggggjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj",
      ".0ogggggggggggggggddddddggggggjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjj",
      ".mgjjgggggggggggggggggggggggjjjjjjjjjjjjjjjjjjjjjjjjjjjjjjgjjjjj"
    ] },
    cristian: { pal: "a0d0301 b27160e c3d271b d4b392e e774530 f5d4e42 g82614e ha56c54 ia58673 jb6a08b kd9957c lefb299 mfcc8ae nfedbc3 offf3de", rows: [
      "................................................................",
      "................................................................",
      "........................00000...................................",
      "......................00gicad00000..............................",
      ".....................0fbaabaaaaadi0.............................",
      "...................00dabbaaaabbdab00............................",
      "..................0fbabbbabbbdffcbai0...........................",
      ".................0daabbbcabcccdcdgbbg00.........................",
      ".................0cbbababbbbddbccdfcaag0........................",
      "................0acbbabaaccccdbbbbbdcbbc0.......................",
      "...............0gabbabbbaaccccbbbaabccddd0......................",
      "...............0aaabdccbddeeeeeeffcbcddcaf0.....................",
      "..............0faaaeggikkllmllkkjjibbfdcbb0.....................",
      "..............0faaghhilmlmnnnnonnnnhbacbba0.....................",
      "..............0gadhghklllmmnmnnnnnnoibaabaf0....................",
      "..............0faighhklllmmmmmnnnnnnokbabbai0...................",
      "..............0aeihhhklmlmmlmnnnnnnnnoibaba0....................",
      "..............0aihhhhklllmmlmnooonnnmojccab0....................",
      ".............0ifjhghhklllnmlmnoonnnnmnmcgac0....................",
      ".............0gijhhhkllllmlmnnoonnnnmnmfbcb0....................",
      ".............0gligehlmmmmmmmmnoonnnnnnlgdca0....................",
      ".............0ilebcadlmnlmmnoooonnnnnnkgfbd0....................",
      "............0fabcehgbdmmlmmnkjnooonnnnkigcg0....................",
      "............0ffleegkkeehmnhedcdgkoonmnkiib0.....................",
      "............0iilacbachbaachhklllhdnoooniid0.....................",
      "............0ijieghhhebkcilccekkoiahikmggf0.....................",
      "............0jdgcceeecbojkkceaaeekciebbcago0....................",
      ".............0ehkkhihbhomhnbekkeccillnligmn0....................",
      ".............0jekmmlecknogoleehhlenmnmhiokh0....................",
      ".............0lgdeecbhlnomioomkmkiommmgmoke0....................",
      "............0jlgkheehimomohdkkkhjolnnlilmmk0....................",
      "............0jihgeeenkmoooneehgmonlmnilmkll0....................",
      "............0iihddcachkmklonemonmnmmlgnolmn0....................",
      "............0gheccccabeeeklokblmmmnmkhnnmn0.....................",
      "...........0jfgcbdfccegegghkmedlmmmkhknnnn0.....................",
      "............0fgbabbgeegeccghihekllligmoom0......................",
      "............0ddcbaailmlliieegghlkkkghlmmm0......................",
      "............0gcdccaafimomolaaeelhkhgg0000.......................",
      "............0fcfdddceegffcbiedghghegi0..........................",
      "............0jbdeeihklmoommoeegcgeghj0..........................",
      ".............0cceghehhhklmnmgeddeeggn0..........................",
      ".............0dbeegeghhklmmmheeeeggg0...........................",
      ".............0gbffeeeeehilnmgcccegei0...........................",
      ".............0icdffeehilmokjccccdehm0...........................",
      "..............0cfccdfghllhgebcccdemm0...........................",
      "..............0dfccdfdehgdfdccbdcknm0...........................",
      "..............0dddbddbdfdcddcbdbhnmm0...........................",
      "...............0ccbcbbcdccbccccdnmmmn0..........................",
      "...............0ibccbbcccdbcbbdmnmmmm0..........................",
      "................0fcbbbbcbcbcbdlnmnmnnm0.........................",
      "...............0jddcccccbbcchlmmnnnnnmm000......................",
      "..............00alicbbccbdgkmmmmnnnnnnnmdj0.....................",
      "............00iafoljcddchikmmmmmnnnnnnonigi0....................",
      ".........000ddfcfojliehhkllmmmmmnnnononiljih00..................",
      ".......00dafbfgcanliiehklllmmmmmnnonomilijlijj00................",
      ".....00gbadgddgcanlhihikkklmlmmmnnoomijijjjjjiij0...............",
      "..000gbbdbcffdfdalmhehhkklllmmmmnooljjijjjjjjjjij00.............",
      "00iddbccdcdfddffacmicgehklllmmnnonjjljjjjjjijjjjiil0............",
      "gdbcdcdddcdfccdddaekgeehkmnmmnonjijjjljjjjijjjjjjiij00..........",
      "cdbcbcddddffddfddfahlhehlmnnnnkiijijjjjjjiiijijjjjjiii00........",
      "dcbbbccddddddddfdffhnhehlnnnlggjiijjjjjjjijiijjjjjjjjjim0.......",
      "cccbbcddffdddddffdcglighmmkigiiiijjjjjjjjiiijjjjjjjjjjjjm0......",
      "dcdccccdfddffffffffcbcdfffghgiijjjjjjjjjijjjjjjjjjjjjjjji0......",
      "dcccccdffffffffggggggffddgiijjiijjjjjjijjiiijiijjjjjjjjjjj......"
    ] },
    coz: { pal: "a26130c b4a3429 c6f4e3b d976b52 eb38b71 fc0b095 ge4a283 hddc8b0 ifcc2a5 jfbd9bf ke4e3e2 lfde6cf mfeefdb nfffce9 offfff9", rows: [
      "................................................................",
      "................................................................",
      "................................................................",
      "................................................................",
      "................................................................",
      ".........................000....................................",
      ".......................00ede000.................................",
      ".....................00baaaaaef000..............................",
      "...................00aaccccbacfede0000..........................",
      "..................0baceefebdbcfffeeefh0.........................",
      ".................0acfffefcabbefffffffe00........................",
      "................0afheccccddeccehhfffffeh0.......................",
      "...............0afdaceijlnnnofecdhhfffff0.......................",
      "..............0edccgmmjjjllllnonebfhfffe0.......................",
      "..............0daelijijjllmmlllmomccjfffe0......................",
      "..............0aejiijjjllllmmlmmlmofbhffe0......................",
      ".............0ebmiijjjjllllmmmmmmmlofbhffe0.....................",
      ".............0chjiiijjjjjmmnnnnmmmmjmeaffef0....................",
      ".............0clhiiijjjjmnjeeejmmmmmjhcbhff0....................",
      ".............0dmhiiijjjlicbdgggimmlmmjeadhe0....................",
      ".............0emljiijjjideiljjljilllmlgbaefh0...................",
      ".............0fmfegijjjiiigiiiijjjllllgcbaef0...................",
      ".............0hcaacegjljieggiiiilljlllidbafjk0..................",
      ".............0ecgdddejmmgcdbbegijllljljecimdi0..................",
      ".............0ffeggbcmmnjddgjjijllljjljddlnig0..................",
      ".............0eeedcadmllliddegjlmmljjljdeimlg0..................",
      ".............0ffbdgbgmlmlljiillmmmmljljgiigmik0.................",
      ".............0hfieccjlmmjijjjlmmmmmljljgjniil0..................",
      "..............0fedegjlmmligjjlmmmmmljjjginljg0..................",
      "..............0hiigijmonnmeemmmmmmljjjigimjocb0.................",
      "..............0jigeggidcdincgmllllljjjiiilloaa0.................",
      "..............0jigbceddgjmombgnjjlljjiiigmogace0................",
      "..............0igdadccdbcginiajljjjjjiiginebbce0................",
      "..............0hgdbcbddbbcdegcdnjjjjjiigibbcace0................",
      "..............0hgcabbeecbccbbcdjljjjigiigccbacdf0...............",
      "...............0gcabbdgijfcbaacljjjiigegicbbaacdf0..............",
      "...............0jdaaadgcaacgiadlijiiigegibaaaaabef0.............",
      "...............0kgaacdbdejonodejiiiggeeieaaacbbade0.............",
      "................0heagiiiiiijlddigggegedgdabaccaabed00...........",
      "................0febeecddeiijecggeededdedcdcdbabbddkk000........",
      "................0hcbddccdejigedeededddeggccdcbccbbeokkkk00......",
      "................0hbbcdddgjjeddccdddccdgjgbabbcbaaahnkkkkkk0.....",
      "........00.......0bacddggedcccbbbccccellgbbbdbbccdmkkkkkkkk0....",
      ".......0ll0......0bbbccddcbdcbbbbcbbcilleaabccbhooonkkkkkkkk00..",
      "......0jjll0.....0bbcbbbbbbcbbbbbbbbdjlmdaacbafonnoooonkkkkkkk0.",
      "......0hjll0.....0cbbbaaaabbbbbbabbbgjljdabablonnnoooooonkkkkkk0",
      "......0jilm0.....0dbbbabaabbbbbbbbadjjljeaabhnmnnooooooooookkkkk",
      "......0jgjlm0...0edcbbaaaabbacabcacijjjjgehnnmmnoooooooooooomkkk",
      "......0jgijj0..0efdbbbaaabacabbaacijjjllmonmllmnooooooooooooomkk",
      ".......0gill0...0eaabbaaabababbbbeiillmnmmmljlmnnoooooooooooookk",
      ".......0jjlm0...0daabbaaaaaaaaabdilmnnmllmlhllnmnooooooooooooook",
      ".......0hill0..0fbaaaaaaaabedddfjmmmmllmmmjhlnmnnnooooooooooooon",
      ".......0gegjn0.0faabaaaabfniggiijllljlmmmlhhlnlnmnoooooooooooooo",
      "......0heedln0..0daaafkfoohhfffhjhhlmlmmmhhhnlmnloooonnoooonoooo",
      ".....0jgeegm0....00d0onokeefffffhlnnlmmmjhhhohnmmnnommoooooonooo",
      ".....0feecemn000...00kmfcdfdhffjnnmmmmmlhhhhnhnjnnnnmnoooooooono",
      ".....0gdcdimmmml0...0oheahecfhmmlmmmmmmjhlfllhmlnnnnmnoooooooonn",
      ".....0gdglljjjlml0..0hecbjdddlhhjmmmmmmjhlfnhjllnnnnloooooooooon",
      "....0jggiiiiijjmjl00oddadffddhffflmmmlljljenfjjmnnonmooooooooooo",
      "....0hdeggggggggij00hdcbhejhbhfffjmmllljljenfjjmmmolnoooooonoooo",
      "....0heiiigedccdej00edadhfjnhhhffjmmlljlljdmehjmmnnkooooooonnooo",
      "....0ijmmmnnnmnmf00mecbhjhlnnljhhlmmllllljdlehhnlnmlonoooooonooo",
      "....0igiijiijllmm00hdbdljhjnmmjhhmmmlllmlldjefhmhnjnooonnooooooo",
      ".....geeggggggggk..fdchjjhjnnmjhhmmmmllmjlejeffnhnhooojlnooooooo"
    ] },
    ion: { pal: "a010000 b110702 c19150e d301e12 e5c2c12 f363934 g874220 h525650 ia5572b j6c7979 kb86c44 lcc8a63 m90a8ab neeaf8a of5d6b8", rows: [
      "................................................................",
      "..............................00................................",
      "..........................0000fh0000000000......................",
      "......................0000llkffklffdcdffff00....................",
      "..................0000ffflhflfdffbbaaadfffdf0...................",
      ".................0lhfffhlhffdaaaaaaaaaabcdfhf0..................",
      "................0hhfffhlfaaaaaaaaaaaaaaaacccba0.................",
      "...............0ffffdklcabbbaaaaaaaaaaaaaaaaaaa0................",
      "..............0hfffhlhacccaaabaaaaaaaaaaaaaaaaaa0...............",
      ".............0ffffflhccdcbaaaaaaaaaaaaaaaaaaaaaad0..............",
      ".............0fffhkccdccbbaaaaaaaaaaaaaaaaaaaaaad0..............",
      "............0ffhhhfcabbbaaaaaaaaaaaaaaaaaaaaaaaacf0.............",
      "...........0ffhlhcbabbaaaaaaaaaaaaaaaaaaaaaaaaaadh0.............",
      "............0fhdaaaaabcbaaaaaaaaaaaaaaaaaaaaaaaafll0............",
      "............0fccdccaabfdbbaaaaabaaaaaaaaaaaaaaaaflh0............",
      "............0dfffffdccdaccaaaaaaaaaaaaaaaaaaaaaacfh0............",
      "............0ffcccffdcaacaaaabaaaaaaaaaaaaaaaaaaalo0............",
      "............0ccbaababdabbaaccaaaaaaaaaaaaaaaaaaaafh0............",
      "............0ccbaaaaccabaacfaaaaaaaaaaaaaaaaaaaaabf0............",
      "............0bbbaabababcddddaaaaaaaaaaaaaaaaaaaaac0.............",
      "............0baadiedddhlledeaabaaaaaaaaaaaaaaaaaac0.............",
      ".............0bblolllnnnnlgedbacddecaaaaaaaaaaaaab0.............",
      ".............0cdnnnoonnnnnnkggggikgdaaaaaaaaaaaaab0.............",
      ".............0ddlnnnooonnnnlnlkkikkgdbaaaaaaaaaaaa0.............",
      ".............0fhnnoooooonnlllkiiiikkkgebbaaaaabeeb0.............",
      ".............0choooooooonligdbdgiiiikkkgdbaaaagkgi0.............",
      ".............0cfnooooooolecbdeddgiiikikkebaabgiigg0.............",
      ".............0lhbloooooldbeknnlkggiikkiigcbdgiiiig0.............",
      ".............0hkielooongeinoonllkiiiikiigdbdiigiig0.............",
      "..............0boolooonkilnnllllkiiiiiikgddeigeeii0.............",
      "..............0clonlonnkgkgilkeggikkkiiigdbgkggggi0.............",
      "..............0fhkknnonigikiookgggkllkiigbbikgeggi0.............",
      "..............0ffhkoooliiknnnliiikllkkiiiddikiegi0..............",
      "...............0llknnnkikknnllkkklnlkiiiigeiiggkg0..............",
      "...............0lhlnnnkkkklnnnnnnnlkkiiiigegiggi0...............",
      "...............0lhnonlkkllllnnnnnllkkiiiigegiggi0...............",
      "...............0lhnonkiiilllnnnnlllkkiiiigegigg0................",
      "................0hnonkiiiglnnllnlllkkiiiggegige0................",
      "................0hkonkikkggnnllllllkkiiiigegii0.................",
      "................0lhongeekgennnlllllkkiigggeegi0.................",
      "................0lfolebegglnnnlllllkkiigggeeg0..................",
      ".................0foollkeilnnnnlllkkiiiggggeg0..................",
      ".................0hnnelgdegkllllllkkiigeeeeeg0..................",
      ".................0hlkellkigggggkllkiiggeeeddg0..................",
      "..................0hkknligigegggllkggeegeebei0..................",
      "..................0dlklkklkgginklligeedeedbe0...................",
      "...................0hnnoonkkklllkkieedddcbdg0...................",
      "...................0dlnlkkiiklkklkgeddcbcddg00..................",
      "...................0dfolgekllkkllkgedcbbddegii000...............",
      "....................0chonlnnlllliggdbabcdegiiiiib000............",
      "....................0cjolllllklkddcaabbceegiiiikgbcf00..........",
      ".....................00hklkkigedaaaaabdddegiiiiiidddhj0.........",
      ".......................0hihhhdaaaaaabdddeegiiiiiiecdfjh00.......",
      ".............000000000000fdbbbaaaaabcddegggiiiiiiebfdhhhh0......",
      "..........000cdjmomhjohjofdnlllllhhheeeggiiiiiiiiebfhfhhhf00....",
      ".......000fcfjmmjjjhmojhohboooonnnnligggiiiiiiiiigbchhhhhfhh0...",
      ".....00hhcfjmmjhhjjjjojfmjagoonnnnnnliiiiiiiiiiiigdahjhhhhfhh00.",
      "..000jjhjjmmmmjfhmmhhomjjjacloonnnnnnkiiiiiiiiiiigeajjjhhffhhff0",
      "00hhfjmmommmmjhhfjmhhojmjfaaenonnnnlllkkkkiiiiiiiidajjjjhhffhhfh",
      "hhjhhmmmmmmmmhhjfhmjhomjmfaaaenonnnllllllliiiiiikibahmjjhhhffhjh",
      "ffcfjmmmmmmmmffjjfmjhmmhmhaaaabgnoonlllllliiiiklkbaafmjjhhhffhjj",
      "ffjmmmmmmjmmmhfhjhjjhmmjjjcaaaaachlnnlllnnlkkkieaaaafmmjmhhhffhj",
      "fjmmmmmmmjjmmjffhjjjjmmmhhdaaaaaaaabegggikgedbaaaaaafmmjjmhhjhjh",
      "jmmmmjjmmmjjjjfffjjhjmmmjffaaaaaaaaaaaaaaaaaaaaaaaaafomjjmjacccd"
    ] }
  };
  /*/PORTRAITS*/
  const mapImg = (rows, pal, w, h) => {
    const [c, x] = mk(w, h), id = x.createImageData(w, h), d = new Uint32Array(id.data.buffer);
    for (let y = 0; y < h; y++) { const r = rows[y] || ""; for (let q = 0; q < w; q++) { const ch = r[q] || "."; if (ch === ".") continue; const col = pal[ch]; if (col) d[y * w + q] = u32(col); } }
    x.putImageData(id, 0, 0);
    return c;
  };
  const PORT = {};
  function portrait(id) {
    if (PORT[id]) return PORT[id];
    const p = PORTRAITS[id]; if (!p) return null;
    const pal = { 0: OUT };
    for (const e of p.pal.split(" ")) pal[e[0]] = "#" + e.slice(1);
    return (PORT[id] = mapImg(p.rows, pal, 64, 64));
  }

  // ===================== 3. the fighters: heads and a jointed pixel puppet =====================
  // heads, 18x20, facing right (three quarters); legend per fighter below: o outline, s skin, S skin shadow,
  // k skin light, H hair, h hair light, B beard, b beard light, w white (eyes, teeth), p pupil, g glasses, C/c cap
  const HEADS = {
    daniel: [
      "......ooo.........",
      ".....oHhHo........",
      ".....oHHHo........",
      "...ooooHooooo.....",
      "..oHHhhhhhhHHoo...",
      ".oHHHHHHHHHHhhHo..",
      ".oHHHHHHHHHHHHHHo.",
      ".oHHHHHHHHkkkkkko.",
      ".oHHHHHHHkHHkkHHo.",
      ".oHHHoSSskwpkwpko.",
      ".oHHoSoSsksskksko.",
      ".oHHoSSSBsssskkkso",
      ".oHHHoBBBBsBBssBo.",
      "..oHHBBBBBowwwwBo.",
      "..oHBBBBBBBowwoBo.",
      "...oBBBbBBBBBBBBo.",
      "....oBBBBBbBBBBo..",
      ".....oBBBBBBBBo...",
      "......oooBBBoo....",
      ".........ooo......"
    ],
    cristian: [
      "..................",
      "......ooooooo.....",
      "....ooHHhhhhHoo...",
      "...oHHHHHhhhhhHo..",
      "..oHHHHHHHHHHhHHo.",
      ".oHHHHHHHHHHHHHHo.",
      ".oHHHHHHHHHkkkkko.",
      ".oHHHHHHHkkkkkkko.",
      ".oHHHHHHHHHHkHHHo.",
      ".oHHHoSSsgggsgggso",
      ".oHHoSoSggwpggwpgo",
      ".oHHoSSSsgggsgggso",
      ".oHHHoBBsssskkskso",
      "..oHHBBBBBBsBBBBo.",
      "..oHBBBBBowwwwoBo.",
      "...oBBBBBBoooBBBo.",
      "....oBBBBBBBBBBo..",
      ".....oBBBBBBBBo...",
      "......oooBBBoo....",
      ".........ooo......"
    ],
    coz: [
      "..................",
      ".....ooooooo......",
      "...ooCCCCCCCoo....",
      "..oCCCcCCCCCCCo...",
      ".occCCCCCCCCCCCo..",
      ".oHHcccCCCCCCCCo..",
      ".oHHHoooooooooko..",
      ".oHHHHHHkkkkkkko..",
      ".oHHHHHHkHHkkHHko.",
      ".oHHHoSSskwpkwpko.",
      ".oHHoSoSsksskksko.",
      ".oHHoSSSssssskkkso",
      ".oHHHoBBBBsBBBBBo.",
      ".oHHHBBBBBowwwwBo.",
      ".oHHHBBBBBBowwoBo.",
      ".oHHHoBBbBBBBBBBo.",
      ".oHHH.oBBBBBbBBBo.",
      ".oHHo..oBBBBBBBBo.",
      "..oo....oBBBBBBo..",
      ".........oooooo..."
    ],
    ion: [
      "......oooo........",
      "....ooHHHHoooo....",
      "...oHHHhhHHHHHoo..",
      "..oHHHHHHhhhHHHHo.",
      ".oHHHHHHHHHHhhHHHo",
      ".oHHHHHHHHHHHHHHHo",
      ".oHHHHHHHHHHHHHHo.",
      ".oHHHHHHHHkkkkHko.",
      ".oHHHHHHHkHHkkHHo.",
      ".oHHHoSSskwpkwpko.",
      ".oHHoSoSsksskksko.",
      ".oHHoSSSssssskkkso",
      "..oHHoSsssssskkso.",
      "..oHSbbssBBBBssbo.",
      "...oSbbbbowwwwbbo.",
      "...oSbbbbBoooBbo..",
      "....obbbbBBBbbo...",
      ".....oSbbbbbbo....",
      "......ossssso.....",
      ".......ooooo......"
    ]
  };
  // per fighter: head colours, clothes, gloves, shoes; sleeves "short" | "long"
  const LOOKS = {
    daniel: {
      head: { s: "#e8a77f", S: "#b8745a", k: "#f6c9a3", H: "#3b2618", h: "#6a4a30", B: "#3a2617", b: "#7b6450", w: "#ffffff", p: "#21140f" },
      skin: ["#f6c9a3", "#e8a77f", "#b8745a"], top: ["#5fe0e4", "#22b6c0", "#137f8c"], sleeve: "short",
      pants: ["#4a5a86", "#323f66", "#232c4a"], shoe: ["#ffffff", "#d7d7e0", "#8e8ea0"], glove: ["#fff27a", "#fed012", "#d69a00"], cuff: "#ffffff"
    },
    cristian: {
      head: { s: "#eaae86", S: "#bb7b5c", k: "#f7cfaa", H: "#2e2018", h: "#574231", B: "#5a3b26", b: "#8a6448", w: "#ffffff", p: "#21140f", g: "#1c1416" },
      skin: ["#f7cfaa", "#eaae86", "#bb7b5c"], top: ["#9c8f73", "#776a52", "#544a39"], sleeve: "long",
      pants: ["#5a5a66", "#40404a", "#2b2b33"], shoe: ["#3a2a22", "#2a1c16", "#140c0a"], glove: ["#7fb2ff", "#2f6fe0", "#1d48a0"], cuff: "#ffffff"
    },
    coz: {
      head: { s: "#eeb48c", S: "#c07f5f", k: "#f8d2b0", H: "#3a281c", h: "#5a4232", B: "#4a3020", b: "#7a5a40", w: "#ffffff", p: "#21140f", C: "#8a8660", c: "#5f5c40" },
      skin: ["#f8d2b0", "#eeb48c", "#c07f5f"], top: ["#f2e6c8", "#d9c9a3", "#ad9c78"], sleeve: "short",
      pants: ["#5f6a46", "#46502f", "#30381f"], shoe: ["#2a2a2a", "#1a1a1a", "#0a0a0a"], glove: ["#ffb36b", "#f07a1e", "#b8520c"], cuff: "#ffffff"
    },
    ion: {
      head: { s: "#e3a982", S: "#b37555", k: "#f3c7a2", H: "#1c1618", h: "#3d3236", B: "#2a2024", b: "#8a5e4c", w: "#ffffff", p: "#1a1012" },
      skin: ["#f3c7a2", "#e3a982", "#b37555"], top: ["#9ec0e0", "#6f95bd", "#4c6d93"], sleeve: "long", tee: ["#2e2e34", "#1c1c22", "#0e0e12"],
      pants: ["#cfc8b4", "#a9a28c", "#7f7966"], shoe: ["#33333b", "#22222a", "#111116"], glove: ["#ff7a6a", "#d8342a", "#9a1c16"], cuff: "#ffffff"
    }
  };
  const HEAD_IMG = {};
  const headPal = (id) => Object.assign({ o: OUT, g: OUT }, LOOKS[id].head);
  // a pixel buffer and its painter: every part is a shape (a test per pixel) filled with a colour per pixel and
  // given its own 1 px outline, so a limb in front of the body keeps its edge
  function Buf(w, h) { this.w = w; this.h = h; this.d = new Uint32Array(w * h); }
  Buf.prototype.part = function (x0, y0, x1, y1, inside, color) {
    x0 = Math.max(0, Math.floor(x0) - 1); y0 = Math.max(0, Math.floor(y0) - 1); x1 = Math.min(this.w - 1, Math.ceil(x1) + 1); y1 = Math.min(this.h - 1, Math.ceil(y1) + 1);
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1, m = new Uint8Array(bw * bh);
    for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) m[y * bw + x] = inside(x0 + x + 0.5, y0 + y + 0.5) ? 1 : 0;
    const oc = u32(OUT);
    for (let y = 0; y < bh; y++) for (let x = 0; x < bw; x++) {
      const i = y * bw + x, gi = (y0 + y) * this.w + x0 + x;
      if (m[i]) { const c = color(x0 + x + 0.5, y0 + y + 0.5); if (c) this.d[gi] = c; }
      else if ((x > 0 && m[i - 1]) || (x < bw - 1 && m[i + 1]) || (y > 0 && m[i - bw]) || (y < bh - 1 && m[i + bw])) this.d[gi] = oc;
    }
  };
  Buf.prototype.blit = function (rows, pal, cx, cy, rot) {
    const h = rows.length, w = rows[0].length;
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const ch = rows[y][x]; if (!ch || ch === ".") continue;
      let px, py;
      if (rot === 1) { px = cx - h / 2 + (h - 1 - y); py = cy - w / 2 + x; } // turned a quarter, face up (lying on the back)
      else { px = cx - w / 2 + x; py = cy - h / 2 + y; }
      px = Math.round(px); py = Math.round(py);
      if (px < 0 || py < 0 || px >= this.w || py >= this.h) continue;
      this.d[py * this.w + px] = u32(pal[ch] || "#ff00ff");
    }
  };
  Buf.prototype.toCanvas = function () { const [c, x] = mk(this.w, this.h), id = x.createImageData(this.w, this.h); new Uint32Array(id.data.buffer).set(this.d); x.putImageData(id, 0, 0); return c; };
  const segD = (px, py, ax, ay, bx, by) => {
    const vx = bx - ax, vy = by - ay, l2 = vx * vx + vy * vy || 1;
    const t = clamp(((px - ax) * vx + (py - ay) * vy) / l2, 0, 1), qx = ax + vx * t, qy = ay + vy * t;
    return [Math.hypot(px - qx, py - qy), px - qx, py - qy, t];
  };
  const LX = -0.55, LY = -0.83; // the light comes from the front, above (in the fighter's own frame, before mirroring)
  const shade3 = (ramp, nx, ny, r) => { const d = (nx * LX + ny * LY) / (r || 1); return u32(d > 0.42 ? ramp[0] : d < -0.3 ? ramp[2] : ramp[1]); };
  function capsule(b, a, c, r, ramp, ramp2, split) {
    b.part(Math.min(a[0], c[0]) - r, Math.min(a[1], c[1]) - r, Math.max(a[0], c[0]) + r, Math.max(a[1], c[1]) + r,
      (x, y) => segD(x, y, a[0], a[1], c[0], c[1])[0] <= r,
      (x, y) => { const [, nx, ny, t] = segD(x, y, a[0], a[1], c[0], c[1]); return shade3(ramp2 && t > split ? ramp2 : ramp, nx, ny, r); });
  }
  function ball(b, c, r, ramp, extra) {
    b.part(c[0] - r, c[1] - r, c[0] + r, c[1] + r, (x, y) => Math.hypot(x - c[0], y - c[1]) <= r,
      (x, y) => (extra && extra(x - c[0], y - c[1])) || shade3(ramp, x - c[0], y - c[1], r));
  }
  function poly(b, pts, color) {
    const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]);
    b.part(Math.min(...xs), Math.min(...ys), Math.max(...xs), Math.max(...ys), (x, y) => {
      let c = false; for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) { const [xi, yi] = pts[i], [xj, yj] = pts[j]; if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c; } return c;
    }, color);
  }
  // ---- poses: joints in the fighter's frame (feet centre on the ground = 0,0; y up is negative; facing right)
  const P0 = { hip: [0, -46], neck: [3, -70], head: [6, -80], eF: [13, -58], hF: [19, -68], eB: [2, -57], hB: [10, -65], kF: [9, -24], fF: [13, 0], kB: [-6, -23], fB: [-12, 0], lie: 0 };
  const pose = (o) => Object.assign({}, P0, o);
  const mixP = (a, b, t) => { const o = {}; for (const k in a) o[k] = Array.isArray(a[k]) ? [lerp(a[k][0], b[k][0], t), lerp(a[k][1], b[k][1], t)] : t < 0.5 ? a[k] : b[k]; return o; };
  const shiftP = (p, dx, dy) => { const o = {}; for (const k in p) o[k] = Array.isArray(p[k]) ? [p[k][0] + dx, p[k][1] + dy] : p[k]; return o; };
  const CROUCH = pose({ hip: [0, -28], neck: [5, -51], head: [8, -61], eF: [15, -40], hF: [21, -49], eB: [4, -38], hB: [12, -46], kF: [14, -17], fF: [12, 0], kB: [-11, -12], fB: [-14, 0] });
  const POSES = {
    idle: [pose({}), pose({ hip: [0, -45], neck: [3, -69], head: [6, -79], eF: [13, -57], hF: [19, -67], eB: [2, -56], hB: [10, -64], kF: [10, -23] }), pose({ hip: [0, -44], neck: [3, -68], head: [6, -78], eF: [13, -56], hF: [19, -66], eB: [2, -55], hB: [10, -63], kF: [10, -22], kB: [-7, -22] }), pose({ hip: [0, -45], neck: [3, -69], head: [6, -79], eF: [13, -57], hF: [19, -67], eB: [2, -56], hB: [10, -64], kF: [10, -23] })],
    crouch: [CROUCH],
    cblock: [pose(Object.assign({}, CROUCH, { eF: [12, -44], hF: [13, -58], eB: [9, -42], hB: [15, -54] }))],
    block: [pose({ hip: [-1, -46], neck: [0, -70], head: [3, -80], eF: [11, -62], hF: [12, -78], eB: [8, -60], hB: [15, -72] })],
    punch: [pose({ hip: [1, -46], neck: [5, -70], head: [8, -80], eF: [10, -60], hF: [8, -66], eB: [3, -57], hB: [12, -64] }), pose({ hip: [3, -46], neck: [8, -70], head: [11, -80], eF: [24, -66], hF: [36, -67], eB: [1, -57], hB: [8, -63], kF: [11, -24], fF: [16, 0] }), pose({ hip: [2, -46], neck: [6, -70], head: [9, -80], eF: [18, -62], hF: [26, -67], eB: [2, -57], hB: [10, -64] })],
    kick: [pose({ hip: [-2, -47], neck: [-4, -71], head: [-2, -81], eF: [8, -60], hF: [14, -69], eB: [-4, -58], hB: [2, -66], kF: [10, -42], fF: [6, -26], kB: [-4, -23], fB: [-5, 0] }), pose({ hip: [-3, -48], neck: [-8, -71], head: [-7, -81], eF: [5, -61], hF: [10, -70], eB: [-8, -58], hB: [-3, -66], kF: [18, -50], fF: [38, -58], kB: [-4, -23], fB: [-5, 0] }), pose({ hip: [-2, -47], neck: [-4, -71], head: [-2, -81], eF: [8, -60], hF: [14, -69], eB: [-4, -58], hB: [2, -66], kF: [12, -38], fF: [16, -18], kB: [-4, -23], fB: [-5, 0] })],
    cpunch: [shiftP(pose(Object.assign({}, CROUCH, { eF: [22, -44], hF: [34, -47], neck: [8, -51], head: [11, -61] })), 0, 0)],
    ckick: [pose(Object.assign({}, CROUCH, { hip: [-2, -24], neck: [-6, -46], head: [-4, -56], kF: [16, -8], fF: [37, -3], kB: [-9, -11], fB: [-14, 0], eF: [8, -38], hF: [14, -46], eB: [-4, -34], hB: [-14, -22] }))],
    jump: [pose({ hip: [0, -52], neck: [3, -76], head: [6, -86], kF: [11, -40], fF: [7, -28], kB: [-2, -37], fB: [-11, -30], eF: [13, -64], hF: [19, -74], eB: [2, -62], hB: [10, -70] })],
    jkick: [pose({ hip: [0, -52], neck: [-2, -76], head: [0, -86], kF: [17, -48], fF: [36, -42], kB: [-3, -36], fB: [-12, -31], eF: [9, -66], hF: [15, -75], eB: [-4, -62], hB: [3, -70] })],
    jpunch: [pose({ hip: [0, -52], neck: [5, -76], head: [8, -86], kF: [11, -40], fF: [7, -28], kB: [-2, -37], fB: [-11, -30], eF: [20, -64], hF: [32, -58], eB: [2, -62], hB: [10, -70] })],
    hit: [pose({ hip: [-3, -46], neck: [-9, -68], head: [-11, -77], eF: [4, -58], hF: [10, -64], eB: [-12, -58], hB: [-16, -66], kF: [6, -24], fF: [10, 0], kB: [-8, -23], fB: [-14, 0] })],
    fall: [pose({ hip: [-6, -40], neck: [-20, -58], head: [-25, -66], eF: [-4, -58], hF: [4, -68], eB: [-22, -50], hB: [-30, -58], kF: [6, -30], fF: [14, -12], kB: [-2, -26], fB: [4, -8] })],
    down: [pose({ lie: 1, hip: [-4, -7], neck: [-28, -9], head: [-38, -11], eF: [-20, -17], hF: [-14, -23], eB: [-36, -3], hB: [-44, -4], kF: [10, -16], fF: [26, -4], kB: [8, -10], fB: [24, -3] })],
    win: [pose({ hip: [0, -46], neck: [2, -70], head: [5, -80], eF: [12, -84], hF: [14, -98], eB: [-6, -56], hB: [4, -50] }), pose({ hip: [0, -47], neck: [2, -71], head: [5, -81], eF: [12, -86], hF: [15, -101], eB: [-6, -57], hB: [4, -51] })],
    dizzy: [pose({ hip: [-1, -45], neck: [-3, -68], head: [-2, -78], eF: [6, -52], hF: [10, -46], eB: [-6, -52], hB: [-2, -46], kF: [8, -23], fF: [11, 0], kB: [-6, -22], fB: [-12, 0] }), pose({ hip: [1, -45], neck: [4, -68], head: [6, -78], eF: [10, -52], hF: [14, -46], eB: [-3, -52], hB: [1, -46], kF: [9, -23], fF: [12, 0], kB: [-5, -22], fB: [-11, 0] })]
  };
  // the walk: six steps of the stance, the feet swapping
  POSES.walk = [];
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2, s = Math.sin(a), c = Math.cos(a);
    POSES.walk.push(pose({ hip: [0, -46 + Math.abs(s) * 1.5], fF: [4 + 10 * s, -Math.max(0, c) * 5], kF: [6 + 6 * s, -24 + Math.max(0, c) * 3], fB: [-4 - 10 * s, -Math.max(0, -c) * 5], kB: [-1 - 6 * s, -23 + Math.max(0, -c) * 3] }));
  }
  // the specials: Daniel pushes a colour wave out with both hands, Cristian dashes in shoulder first, Coz lifts the
  // camera, I O N throws an espresso
  const SPECIAL_POSES = {
    daniel: [pose({ hip: [-2, -46], neck: [-3, -70], head: [0, -80], eF: [2, -56], hF: [-6, -52], eB: [-6, -56], hB: [-10, -50], kF: [10, -24], fF: [15, 0] }), pose({ hip: [3, -46], neck: [8, -70], head: [11, -80], eF: [22, -64], hF: [34, -64], eB: [18, -58], hB: [31, -56], kF: [12, -24], fF: [18, 0] })],
    cristian: [pose({ hip: [-2, -44], neck: [2, -66], head: [5, -76], eF: [6, -56], hF: [2, -62], kF: [10, -22], fF: [15, 0] }), pose({ hip: [6, -42], neck: [18, -62], head: [22, -71], eF: [28, -60], hF: [40, -61], eB: [14, -54], hB: [20, -50], kF: [16, -22], fF: [24, 0], kB: [-10, -18], fB: [-24, -3] })],
    coz: [pose({ hip: [0, -46], neck: [3, -70], head: [5, -80], eF: [12, -64], hF: [14, -76], eB: [8, -60], hB: [12, -72] }), pose({ hip: [1, -46], neck: [4, -70], head: [6, -80], eF: [16, -66], hF: [22, -76], eB: [10, -62], hB: [18, -72] })],
    ion: [pose({ hip: [-2, -46], neck: [-3, -70], head: [0, -80], eF: [-4, -70], hF: [-10, -82], eB: [4, -58], hB: [12, -64] }), pose({ hip: [3, -46], neck: [8, -70], head: [11, -80], eF: [24, -70], hF: [35, -74], eB: [2, -57], hB: [8, -63], kF: [12, -24], fF: [17, 0] })]
  };
  // the cell every frame is baked into: 96x108, the feet at (48, 104)
  const CW = 96, CH = 108, OX = 48, OY = 104;
  function drawFighter(id, p, prop) {
    const L = LOOKS[id], b = new Buf(CW, CH), T = (q) => [q[0] + OX, q[1] + OY];
    const hip = T(p.hip), neck = T(p.neck), head = T(p.head);
    const ang = Math.atan2(neck[0] - hip[0], -(neck[1] - hip[1])); // the torso's lean
    const ca = Math.cos(ang), sa = Math.sin(ang), rot = (x, y) => [x * ca - y * sa, x * sa + y * ca];
    const off = (o, dx, dy) => { const [rx, ry] = rot(dx, dy); return [o[0] + rx, o[1] + ry]; };
    const sF = off(neck, 7, 5), sB = off(neck, -6, 5), lF = off(hip, 4, 1), lB = off(hip, -4, 1);
    const darker = (ramp) => [ramp[1], ramp[2], ramp[2]];
    const sleeveL = L.sleeve === "long";
    const arm = (s, e, h, back) => {
      const top = back ? darker(L.top) : L.top, sk = back ? darker(L.skin) : L.skin;
      if (sleeveL) { capsule(b, s, e, 4.4, top); capsule(b, e, h, 3.8, top); }
      else { capsule(b, s, e, 4.4, top, sk, 0.5); capsule(b, e, h, 3.8, sk); }
      // the glove, its white cuff towards the elbow
      const g = back ? darker(L.glove) : L.glove, vx = h[0] - e[0], vy = h[1] - e[1], vl = Math.hypot(vx, vy) || 1;
      capsule(b, [h[0] - (vx / vl) * 5.5, h[1] - (vy / vl) * 5.5], [h[0] - (vx / vl) * 3, h[1] - (vy / vl) * 3], 4, [L.cuff, L.cuff, "#c8c8d0"]);
      ball(b, h, 6, g, (dx, dy) => (dx * LX + dy * LY > 3.9 && Math.hypot(dx, dy) < 5.4 ? u32("#ffffff") : 0));
    };
    const leg = (r, k, f, back) => {
      const pa = back ? darker(L.pants) : L.pants;
      capsule(b, r, k, 6.4, pa); capsule(b, k, [f[0], f[1] - 3], 5.2, pa);
      // the shoe, pointing forward
      const sh = back ? darker(L.shoe) : L.shoe;
      poly(b, [[f[0] - 5, f[1] - 6], [f[0] + 4, f[1] - 6], [f[0] + 10, f[1] - 2], [f[0] + 10, f[1] + 1], [f[0] - 5, f[1] + 1]], (x, y) => u32(y > f[1] - 0.5 ? (L.shoe[2]) : sh[x > f[0] + 2 ? 0 : 1]));
    };
    if (prop === "camera" || prop === "cup") {} // the props are drawn after the front arm
    // back arm, back leg, front leg, the body, the head, the front arm
    arm(sB, T(p.eB), T(p.hB), true);
    leg(lB, T(p.kB), T(p.fB), true);
    leg(lF, T(p.kF), T(p.fF), false);
    // the body: a slightly tapered block from the shoulders to the hips; the clothes are a colour per (u, v)
    const tp = [off(neck, -10, 6), off(neck, -7, 1), off(neck, 9, 1), off(neck, 12, 6), off(hip, 9, 3), off(hip, -9, 3)];
    poly(b, tp, (x, y) => {
      const dx = x - neck[0], dy = y - neck[1], v = clamp((dx * sa - dy * -ca) / (Math.hypot(hip[0] - neck[0], hip[1] - neck[1]) || 1), 0, 1);
      const u = clamp(((dx * ca + dy * sa) + 10) / 22, 0, 1); // 0 at the back, 1 at the front
      const sh = u < 0.22 ? 2 : u > 0.72 && v < 0.6 ? 0 : 1;
      if (v > 0.88) return u32(L.pants[sh === 0 ? 1 : sh]); // the waistband
      if (id === "ion") {
        if (u > 0.5 && u < 0.84) { if (v > 0.18 && v < 0.42 && u > 0.58 && u < 0.76 && ((Math.floor(x) + Math.floor(y)) & 1)) return u32("#e8e8ea"); return u32(L.tee[sh === 2 ? 2 : sh]); }
        if (u >= 0.84 && v < 0.5) return u32(L.top[0]);
      }
      if (id === "daniel" || id === "coz") if (v < 0.1 && u > 0.5 && u < 0.85) return u32(L.skin[1]); // the neckline
      if (id === "cristian") { if (v < 0.12 && u > 0.55 && u < 0.85) return u32(L.skin[1]); if (u > 0.66 && u < 0.74 && (v > 0.15 && v < 0.2 || v > 0.28 && v < 0.33)) return u32("#e8dcc0"); }
      if (id === "daniel" && v > 0.2 && v < 0.27 && u > 0.6 && u < 0.85) return u32("#fed012"); // a little Cromatic stripe
      return u32(L.top[sh]);
    });
    // the neck and the head
    capsule(b, off(neck, 1, 2), off(neck, 2, -4), 3.6, L.skin);
    if (!HEAD_IMG[id]) HEAD_IMG[id] = HEADS[id];
    b.blit(HEADS[id], headPal(id), head[0], head[1], p.lie ? 1 : 0);
    arm(sF, T(p.eF), T(p.hF), false);
    if (prop === "camera") {
      const h = T(p.hF);
      poly(b, [[h[0] - 5, h[1] - 6], [h[0] + 7, h[1] - 6], [h[0] + 7, h[1] + 1], [h[0] - 5, h[1] + 1]], (x, y) => u32(y < h[1] - 4.5 ? "#4a4a52" : "#26262c"));
      ball(b, [h[0] + 7, h[1] - 2.5], 2.6, ["#bfe9ff", "#3a8fe0", "#1a3a70"]);
      b.d[Math.round(h[1] - 6) * CW + Math.round(h[0] - 2)] = u32("#ffffff");
    }
    return b.toCanvas();
  }
  // every frame of a fighter, baked once
  const SPR = {};
  function sprites(id) {
    if (SPR[id]) return SPR[id];
    const S = {};
    for (const [k, list] of Object.entries(POSES)) S[k] = list.map((p) => drawFighter(id, p));
    S.special = SPECIAL_POSES[id].map((p) => drawFighter(id, p, id === "coz" ? "camera" : null));
    return (SPR[id] = S);
  }

  // ===================== 4. the stage: the Two Minutes shop, at dusk =====================
  let STAGE = null;
  function stage() {
    if (STAGE) return STAGE;
    const [far, fx] = mk(Math.ceil(W + (STAGE_W - W) * 0.5) + 2, H);
    const [mid, m] = mk(STAGE_W, H);
    // the sky: bands, dithered where two meet (no gradients: 16 colours, like the cartridges had)
    const SKY = ["#1b1838", "#26204a", "#38285a", "#552f66", "#7a3a6c", "#a3476a", "#cc5c62", "#ea7d5c", "#f7a364"];
    for (let y = 0; y < 132; y++) {
      const t = y / 132 * (SKY.length - 1), i = Math.floor(t), f = t - i;
      for (let x = 0; x < far.width; x++) { const c = f > 0.5 && ((x + y) & 1) ? SKY[Math.min(SKY.length - 1, i + 1)] : SKY[i]; fx.fillStyle = c; fx.fillRect(x, y, 1, 1); }
    }
    fx.fillStyle = "#2a2142"; fx.fillRect(0, 132, far.width, H - 132);
    // a few stars, a thin moon
    fx.fillStyle = "#fff6d8"; for (let i = 0; i < 26; i++) { const sx = (i * 97) % far.width, sy = (i * 37) % 40 + 38; fx.fillRect(sx, sy, 1, 1); }
    fx.fillStyle = "#fff2c0"; fx.beginPath(); fx.arc(232, 54, 9, 0, Math.PI * 2); fx.fill(); fx.fillStyle = SKY[3]; fx.beginPath(); fx.arc(228, 51, 8, 0, Math.PI * 2); fx.fill();
    // far Bucharest: blocks and old roofs, lit windows, one church dome
    let x = 0, seed = 7; const r = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    while (x < far.width) {
      const bw = 14 + Math.floor(r() * 26), bh = 26 + Math.floor(r() * 46), top = 132 - bh;
      fx.fillStyle = "#2a2142"; fx.fillRect(x, top, bw, bh + 10);
      fx.fillStyle = "#33284f"; fx.fillRect(x, top, 2, bh + 10);
      if (r() < 0.35) { fx.fillStyle = "#2a2142"; fx.fillRect(x + 2, top - 5, bw - 4, 5); fx.fillRect(x + 5, top - 9, bw - 10, 4); }
      for (let wy = top + 4; wy < 128; wy += 6) for (let wx = x + 3; wx < x + bw - 3; wx += 5) if (r() < 0.3) { fx.fillStyle = r() < 0.5 ? "#ffcf6a" : "#f2a04a"; fx.fillRect(wx, wy, 2, 3); }
      x += bw + Math.floor(r() * 4);
    }
    fx.fillStyle = "#2a2142"; fx.beginPath(); fx.arc(120, 96, 12, Math.PI, 0); fx.fill(); fx.fillRect(108, 96, 24, 40); fx.fillRect(119, 78, 2, 6); fx.fillRect(117, 80, 6, 1);
    // ---- the near street (scrolls with the fight): old houses either side, the shop in the middle
    const house = (x0, w, h, wall, trim, roof) => {
      const top = 176 - h;
      m.fillStyle = roof; m.fillRect(x0 - 3, top - 6, w + 6, 6); m.fillRect(x0 + 4, top - 10, w - 8, 4);
      m.fillStyle = wall; m.fillRect(x0, top, w, h);
      m.fillStyle = trim; m.fillRect(x0, top, w, 3); m.fillRect(x0, top + 40, w, 2); m.fillRect(x0, 170, w, 6);
      for (let wx = x0 + 8; wx < x0 + w - 16; wx += 24) {
        for (const wy of [top + 10, top + 50]) {
          m.fillStyle = trim; m.fillRect(wx - 2, wy - 3, 16, 3); m.fillRect(wx - 1, wy + 22, 14, 2);
          m.fillStyle = "#2a2440"; m.fillRect(wx, wy, 12, 22);
          m.fillStyle = (wx + wy) % 3 ? "#f7c46a" : "#3b3456"; m.fillRect(wx + 1, wy + 1, 10, 20);
          m.fillStyle = "#2a2440"; m.fillRect(wx + 6, wy, 1, 22); m.fillRect(wx, wy + 9, 12, 1);
        }
      }
      // a balcony
      m.fillStyle = OUT; m.fillRect(x0 + 6, top + 72, w - 12, 1); for (let bx = x0 + 6; bx < x0 + w - 6; bx += 3) m.fillRect(bx, top + 72, 1, 8); m.fillRect(x0 + 6, top + 80, w - 12, 2);
    };
    house(-4, 116, 128, "#e2c79a", "#f4e2bd", "#7d4a3a");
    house(426, 154, 136, "#c9b8d9", "#e6dcef", "#5a4466");
    // the shop: black facade, its white mark, the door open, warm light, the counter and the machine
    const sx = 176, sw = 236, st = 44;
    m.fillStyle = "#121214"; m.fillRect(sx, st, sw, 132);
    m.fillStyle = "#26262b"; m.fillRect(sx, st, sw, 2); m.fillRect(sx, st, 2, 132); m.fillRect(sx + sw - 2, st, 2, 132);
    m.fillStyle = "#0a0a0b"; m.fillRect(sx + 4, st + 4, sw - 8, 1);
    // the mark: two tall bars and a short one, white (the shop's sign), and the name under it
    m.fillStyle = "#f4f4f4"; m.fillRect(sx + 18, st + 22, 7, 44); m.fillRect(sx + 30, st + 22, 7, 44); m.fillRect(sx + 42, st + 22, 4, 12);
    text(m, "TWO MINUTES", sx + 14, st + 74, "#f4f4f4", { ol: null });
    text(m, "COFFEE SHOP", sx + 14, st + 84, "#bdbdc4", { ol: null });
    // the door, open, with the light inside
    const dx = sx + 84, dw = 62;
    m.fillStyle = "#3b2414"; m.fillRect(dx, st + 14, dw, 118);
    for (let y = st + 16; y < 176; y++) { const t = (y - st) / 132; m.fillStyle = t < 0.3 ? "#ffd27a" : t < 0.6 ? "#f6b45a" : "#d98a3c"; m.fillRect(dx + 2, y, dw - 4, 1); }
    // inside: the shelf with cups, the espresso machine on the counter
    m.fillStyle = "#6b3f22"; m.fillRect(dx + 2, st + 40, dw - 4, 3);
    for (let i = 0; i < 6; i++) { const cx = dx + 6 + i * 9; m.fillStyle = OUT; m.fillRect(cx - 1, st + 32, 8, 8); m.fillStyle = i % 2 ? "#ffffff" : "#d8c7a8"; m.fillRect(cx, st + 33, 6, 7); }
    m.fillStyle = "#6b3f22"; m.fillRect(dx + 2, st + 98, dw - 4, 34);
    m.fillStyle = "#8a5530"; m.fillRect(dx + 2, st + 98, dw - 4, 3);
    m.fillStyle = OUT; m.fillRect(dx + 14, st + 74, 34, 24); m.fillStyle = "#c9ccd4"; m.fillRect(dx + 15, st + 75, 32, 22); m.fillStyle = "#8b8f9a"; m.fillRect(dx + 15, st + 86, 32, 11);
    m.fillStyle = "#2a2a30"; m.fillRect(dx + 20, st + 90, 4, 6); m.fillRect(dx + 37, st + 90, 4, 6); m.fillStyle = "#e85a3a"; m.fillRect(dx + 29, st + 78, 4, 4);
    m.fillStyle = "#121214"; m.fillRect(dx - 3, st + 12, 3, 120); m.fillRect(dx + dw, st + 12, 3, 120); m.fillRect(dx - 3, st + 10, dw + 6, 4);
    // the open door leaf, black, with its edge catching the light
    m.fillStyle = "#1b1b1f"; m.fillRect(dx + dw + 3, st + 14, 14, 118); m.fillStyle = "#34343a"; m.fillRect(dx + dw + 3, st + 14, 1, 118);
    // right panel: the chalk menu board
    const bx = sx + 166, by = st + 22;
    m.fillStyle = "#2b3130"; m.fillRect(bx, by, 60, 76); m.fillStyle = "#53585a"; m.fillRect(bx, by, 60, 1); m.fillRect(bx, by + 75, 60, 1); m.fillRect(bx, by, 1, 76); m.fillRect(bx + 59, by, 1, 76);
    text(m, "MENU", bx + 30, by + 5, "#f2f2ea", { ol: null, al: "c" });
    text(m, "ESPRESSO", bx + 5, by + 20, "#e6e6dc", { ol: null });
    text(m, "FLAT WHITE", bx + 5, by + 31, "#e6e6dc", { ol: null });
    text(m, "TONIC", bx + 5, by + 42, "#ffd27a", { ol: null });
    text(m, "IONIC", bx + 5, by + 51, "#ffd27a", { ol: null });
    m.fillStyle = "#e6e6dc"; for (let i = 0; i < 5; i++) m.fillRect(bx + 8 + i * 10, by + 66, 6, 1);
    // chalk doodles on the facade, as on the wall behind the counter
    m.fillStyle = "#4a4a52";
    for (const [px, py, w2, h2] of [[sx + 60, st + 102, 14, 1], [sx + 60, st + 102, 1, 14], [sx + 73, st + 102, 1, 14], [sx + 60, st + 115, 14, 1], [sx + 76, st + 106, 4, 1], [sx + 79, st + 106, 1, 6], [sx + 12, st + 104, 30, 1], [sx + 12, st + 108, 22, 1], [sx + 12, st + 112, 26, 1]]) m.fillRect(px, py, w2, h2);
    // the pavement, the kerb, the cobbles
    const yG = 176;
    m.fillStyle = "#4b4560"; m.fillRect(0, yG, STAGE_W, H - yG);
    m.fillStyle = "#5c5674"; m.fillRect(0, yG, STAGE_W, 2);
    for (let y = yG + 4, row = 0; y < H; y += 6 + row, row++) {
      m.fillStyle = "#3d3850"; m.fillRect(0, y, STAGE_W, 1);
      const step = 18 + row * 4;
      for (let x2 = (row % 2) * (step / 2); x2 < STAGE_W; x2 += step) m.fillRect(Math.round(x2), y - 5 - row, 1, 5 + row);
    }
    // an outdoor table with a stack of cups, and a bike against the house
    const tx = 440;
    m.fillStyle = OUT; m.fillRect(tx, 150, 34, 3); m.fillRect(tx + 15, 153, 4, 23); m.fillRect(tx + 8, 174, 18, 2);
    m.fillStyle = "#f4f4f4"; for (let i = 0; i < 5; i++) { m.fillStyle = OUT; m.fillRect(tx + 4, 140 - i * 3, 9, 1); m.fillStyle = i % 2 ? "#ffffff" : "#e8e2d4"; m.fillRect(tx + 4, 141 - i * 3, 9, 2); }
    m.fillStyle = OUT; m.fillRect(tx + 20, 143, 7, 7); m.fillStyle = "#121214"; m.fillRect(tx + 21, 144, 5, 6); m.fillStyle = "#fff"; m.fillRect(tx + 22, 146, 1, 3); m.fillRect(tx + 24, 146, 1, 3);
    const bike = (bx2, by2) => { m.strokeStyle = OUT; m.lineWidth = 2; m.beginPath(); m.arc(bx2, by2, 9, 0, Math.PI * 2); m.stroke(); m.beginPath(); m.arc(bx2 + 28, by2, 9, 0, Math.PI * 2); m.stroke(); m.strokeStyle = "#d8342a"; m.beginPath(); m.moveTo(bx2, by2); m.lineTo(bx2 + 12, by2 - 14); m.lineTo(bx2 + 24, by2 - 14); m.lineTo(bx2 + 28, by2); m.moveTo(bx2 + 12, by2 - 14); m.lineTo(bx2 + 14, by2); m.lineTo(bx2, by2); m.stroke(); m.fillStyle = OUT; m.fillRect(bx2 + 8, by2 - 18, 8, 2); m.fillRect(bx2 + 22, by2 - 20, 6, 2); };
    bike(40, 165);
    // a street lamp
    m.fillStyle = "#2a2440"; m.fillRect(150, 70, 3, 106); m.fillRect(144, 64, 15, 6); m.fillStyle = "#ffe6a0"; m.fillRect(146, 70, 11, 3);
    STAGE = { far, mid };
    return STAGE;
  }
  // a few people at the door, watching (they bob, and cheer at a K.O.)
  const CROWD = [
    { x: 268, c: "#d8342a", h: "#2a1c16", s: "#e8a77f", cup: 1 },
    { x: 300, c: "#f2e6c8", h: "#4a3020", s: "#f0c49c", cup: 0 },
    { x: 330, c: "#2f6fe0", h: "#151515", s: "#c98d68", cup: 1 },
    { x: 520, c: "#28c840", h: "#6a4a30", s: "#f6c9a3", cup: 0 },
    { x: 92, c: "#fed012", h: "#2a1c16", s: "#e3a982", cup: 1 }
  ];
  function drawCrowd(ctx, camX, t, cheer) {
    for (let i = 0; i < CROWD.length; i++) {
      const p = CROWD[i], x = Math.round(p.x - camX), bob = Math.round(Math.abs(Math.sin(t * (cheer ? 9 : 2.2) + i * 1.7)) * (cheer ? 3 : 1)), y = 176 - bob;
      if (x < -20 || x > W + 20) continue;
      ctx.fillStyle = OUT; ctx.fillRect(x - 6, y - 30, 13, 31); ctx.fillRect(x - 4, y - 40, 9, 11);
      ctx.fillStyle = p.c; ctx.fillRect(x - 5, y - 29, 11, 18);
      ctx.fillStyle = "#3a3448"; ctx.fillRect(x - 5, y - 11, 11, 11);
      ctx.fillStyle = p.s; ctx.fillRect(x - 3, y - 39, 7, 9);
      ctx.fillStyle = p.h; ctx.fillRect(x - 3, y - 39, 7, 3);
      ctx.fillStyle = OUT; ctx.fillRect(x + 1, y - 35, 1, 1);
      if (cheer) { ctx.fillStyle = OUT; ctx.fillRect(x - 8, y - 46, 3, 16); ctx.fillStyle = p.s; ctx.fillRect(x - 7, y - 45, 1, 14); }
      else if (p.cup) { ctx.fillStyle = OUT; ctx.fillRect(x + 4, y - 24, 6, 7); ctx.fillStyle = "#ffffff"; ctx.fillRect(x + 5, y - 23, 4, 5); }
    }
  }

  // ===================== 5. the roster =====================
  const ROSTER = {
    daniel: { id: "daniel", name: "DANIEL", role: "FOUNDER - CREATIVE ARCHITECT", special: "COLOR WAVE", line: "PAINTS THE ROOM IN ONE MOVE", speed: 1, power: 1 },
    cristian: { id: "cristian", name: "CRISTIAN", role: "PARTNER - CEO", special: "DEADLINE DASH", line: "ALWAYS ONE STEP AHEAD", speed: 1.08, power: 0.95 },
    coz: { id: "coz", name: "COZ", role: "CALM ON SET", special: "FLASH STUN", line: "FINDS THE ANGLE, THEN THE FLASH", speed: 0.96, power: 1.05 },
    ion: { id: "ion", name: "I O N", role: "FOUNDER OF TWO MINUTES", special: "ESPRESSO SHOT", line: "TWO MINUTES IS ALL HE NEEDS", speed: 1, power: 1 }
  };
  const CREW = ["daniel", "cristian", "coz"];

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
  function drawTitle(ctx, t) {
    const S = stage();
    ctx.drawImage(S.far, -20, 0); ctx.drawImage(S.mid, -96, 0);
    ctx.fillStyle = "rgba(14,10,26,.84)"; ctx.fillRect(0, 0, W, H);
    gloveIcon(ctx, 24, 36 + Math.round(Math.sin(t * 3) * 2), "#fed012", false, 3);
    gloveIcon(ctx, W - 60, 36 + Math.round(Math.sin(t * 3 + 1) * 2), "#d8342a", true, 3);
    text(ctx, "AT THE GLOVES", W / 2, 40, GOLD, { sc: 3, sp: 1, sh: 2, al: "c" });
    text(ctx, "WITH", W / 2, 72, "#ffffff", { sc: 2, al: "c" });
    text(ctx, "I O N", W / 2, 92, RED, { sc: 6, sp: 1, sh: 2, al: "c" });
    if (Math.floor(t * 2) % 2 === 0) text(ctx, TOUCH ? "TAP TO START" : "PRESS ENTER", W / 2, 162, "#ffffff", { sc: 1, al: "c" });
    text(ctx, "A TWO MIN LAB MINI-GAME BY CROMATIC STUDIOS", W / 2, 196, "#a99cc8", { al: "c" });
  }
  function tile(ctx, x, y, id, on, t, locked) {
    ctx.fillStyle = OUT; ctx.fillRect(x - 3, y - 3, 70, 70);
    ctx.fillStyle = on ? (Math.floor(t * 6) % 2 ? "#fff27a" : "#fed012") : locked ? "#d8342a" : "#5a4e7a"; ctx.fillRect(x - 2, y - 2, 68, 68);
    ctx.fillStyle = on ? "#3a2f6a" : "#241d3d"; ctx.fillRect(x, y, 64, 64);
    ctx.fillStyle = on ? "#4a3d86" : "#2d2550"; for (let i = 0; i < 64; i += 4) ctx.fillRect(x, y + i, 64, 2);
    const p = portrait(id); if (p) ctx.drawImage(p, x, y);
  }
  function drawSelect(ctx, t, sel) {
    stripes(ctx, t, "#1b1438", "#211a44");
    text(ctx, "CHOOSE YOUR FIGHTER", W / 2, 10, GOLD, { sc: 2, sh: 1, al: "c" });
    for (let i = 0; i < 3; i++) { const x = 18 + i * 76, y = 40; tile(ctx, x, y, CREW[i], i === sel, t); text(ctx, ROSTER[CREW[i]].name, x + 32, y + 70, i === sel ? "#fed012" : "#ffffff", { al: "c" }); }
    // the cursor: "1P" over the chosen tile
    const cx = 18 + sel * 76 + 32; text(ctx, "1P", cx, 28 + Math.round(Math.sin(t * 8)), "#fed012", { al: "c" });
    const R = ROSTER[CREW[sel]];
    text(ctx, R.role, 18, 128, "#a99cc8");
    text(ctx, "SPECIAL: " + R.special, 18, 142, "#ffffff");
    text(ctx, R.line, 18, 154, "#7fd8ff");
    // the opponent
    text(ctx, "VS", 268, 64, RED, { sc: 3, sh: 1, al: "c" });
    tile(ctx, 302, 40, "ion", false, t, true);
    text(ctx, "I O N", 334, 110, "#ff8a6e", { al: "c" });
    text(ctx, "CPU", 334, 122, "#a99cc8", { al: "c" });
    text(ctx, TOUCH ? "< > TO CHOOSE - TAP P TO FIGHT" : "< > TO CHOOSE - ENTER OR J TO FIGHT", W / 2, 178, "#ffffff", { al: "c" });
    text(ctx, TOUCH ? "" : "ARROWS/WASD MOVE - J PUNCH - K KICK - L SPECIAL", W / 2, 194, "#a99cc8", { al: "c" });
  }
  function drawVS(ctx, t, me, k) {
    stripes(ctx, t * 3, "#120c24", "#1d1540");
    const slide = Math.min(1, k * 2.4), ease = 1 - Math.pow(1 - slide, 3);
    const lx = Math.round(-140 + (20 + 140) * ease), rx = Math.round(W + 12 - (W + 12 - (W - 148)) * ease);
    const big = (id, x, flip) => {
      const p = portrait(id); if (!p) return;
      ctx.fillStyle = OUT; ctx.fillRect(x - 3, 37, 134, 134); ctx.fillStyle = id === "ion" ? "#d8342a" : "#fed012"; ctx.fillRect(x - 2, 38, 132, 132); ctx.fillStyle = "#241d3d"; ctx.fillRect(x, 40, 128, 128);
      ctx.save(); if (flip) { ctx.translate(x + 128, 40); ctx.scale(-1, 1); ctx.drawImage(p, 0, 0, 128, 128); } else ctx.drawImage(p, x, 40, 128, 128); ctx.restore();
    };
    big(me, lx, false);
    big("ion", rx, false);
    if (k > 0.35) { const s = k < 0.45 ? 7 : 5; text(ctx, "VS", W / 2, 86 - (s - 5) * 4, RED, { sc: s, sh: 2, al: "c" }); }
    text(ctx, ROSTER[me].name, lx + 64, 180, GOLD, { sc: 2, sh: 1, al: "c" });
    text(ctx, "I O N", rx + 64, 180, RED, { sc: 2, sh: 1, al: "c" });
    text(ctx, "STAGE: TWO MINUTES COFFEE SHOP", W / 2, 10, "#ffffff", { al: "c" });
    text(ctx, "STR. ARICESCU, BUCHAREST", W / 2, 21, "#a99cc8", { al: "c" });
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
    punch: { su: 4, ac: 3, rc: 9, dmg: 6, box: [12, -76, 42, -58], hs: 15, bs: 9, push: 2.4, frames: "punch", sfx: "hit" },
    kick: { su: 7, ac: 4, rc: 13, dmg: 9, box: [12, -66, 48, -46], hs: 19, bs: 11, push: 3.2, frames: "kick", sfx: "heavy" },
    cpunch: { su: 4, ac: 3, rc: 8, dmg: 5, box: [12, -54, 40, -38], hs: 14, bs: 8, push: 2, frames: "cpunch", crouch: true, sfx: "hit" },
    ckick: { su: 6, ac: 4, rc: 15, dmg: 8, box: [10, -16, 48, 0], hs: 18, bs: 10, push: 2.6, frames: "ckick", crouch: true, low: true, kd: true, sfx: "heavy" },
    jpunch: { su: 3, ac: 10, rc: 0, dmg: 7, box: [10, -68, 40, -42], hs: 16, bs: 9, push: 2.2, frames: "jpunch", air: true, high: true, sfx: "hit" },
    jkick: { su: 4, ac: 11, rc: 0, dmg: 9, box: [10, -60, 46, -30], hs: 18, bs: 10, push: 2.8, frames: "jkick", air: true, high: true, sfx: "heavy" }
  };
  const SPECIAL = {
    daniel: { su: 13, ac: 1, rc: 20, cool: 150, proj: "wave", dmg: 12, speed: 3.4, sfx: "wave", sp: true },
    ion: { su: 13, ac: 1, rc: 20, cool: 150, proj: "espresso", dmg: 11, speed: 3.8, sfx: "espresso", sp: true },
    cristian: { su: 7, ac: 16, rc: 16, cool: 150, dash: 5.6, dmg: 13, box: [6, -76, 42, -34], hs: 22, bs: 14, push: 4, sfx: "dash", kd: true, sp: true, chip: 2 },
    coz: { su: 10, ac: 6, rc: 16, cool: 170, flash: true, dmg: 6, box: [6, -98, 76, -20], hs: 0, bs: 12, push: 1.5, dizzy: 80, sfx: "flash", sp: true }
  };
  const GRAV = 0.34, JUMP_V = -6.8, ROUND_TIME = 60;
  function fighter(id, cpu, x, face) {
    const R = ROSTER[id];
    return { id, R, S: sprites(id), cpu, x, y: 0, vx: 0, vy: 0, face, hp: 100, trail: 100, st: "idle", t: 0, atk: null, atkHit: false, hs: 0, spCool: 40, spMax: SPECIAL[id].cool, inv: 0, walkT: 0, walkDir: 1, holdBack: false, holdDown: false, ai: { t: 30, plan: null, pt: 0, seen: 0 }, flashT: 0, dz: 0, landT: 0 };
  }
  const onGround = (f) => f.y >= 0;
  const free = (f) => onGround(f) && (f.st === "idle" || f.st === "walk" || f.st === "crouch");
  const hurt = (f) => { const top = f.st === "crouch" || (f.st === "atk" && f.atk?.crouch) || (f.st === "block" && f.crouchBlock) ? -58 : f.st === "down" ? -14 : -86; return [f.x - 12, f.y + top, f.x + 12, f.y - (onGround(f) ? 0 : 18)]; };
  const boxOf = (f, b) => (f.face > 0 ? [f.x + b[0], f.y + b[1], f.x + b[2], f.y + b[3]] : [f.x - b[2], f.y + b[1], f.x - b[0], f.y + b[3]]);
  const overlap = (a, b) => a[0] < b[2] && a[2] > b[0] && a[1] < b[3] && a[3] > b[1];

  let g = null; // the match
  function newMatch(me) {
    g = { scene: "vs", me, t: 0, round: 1, wins: [0, 0], phase: "intro", pt: 0, time: ROUND_TIME, f: [], proj: [], fx: [], hitstop: 0, shake: 0, flash: 0, camX: (STAGE_W - W) / 2, slow: 0, menu: 0, result: null, perfect: false };
    resetRound();
    g.scene = "vs"; g.t = 0;
    SND.play("confirm");
  }
  function resetRound() {
    g.f = [fighter(g.me, false, STAGE_W / 2 - 64, 1), fighter("ion", true, STAGE_W / 2 + 64, -1)];
    g.proj = []; g.fx = []; g.phase = "intro"; g.pt = 0; g.time = ROUND_TIME; g.camX = (STAGE_W - W) / 2; g.hitstop = 0; g.shake = 0; g.flash = 0;
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
    const r = Math.random(), ready = f.spCool <= 0;
    if (d > 150) {
      if (ready && r < 0.35) inp.sp = 1;
      else ai.plan = { k: "walk", dir: 1, n: 24 + (Math.random() * 24 | 0) };
    } else if (d > 62) {
      if (ready && r < 0.18) inp.sp = 1;
      else if (r < 0.36) ai.plan = { k: "jumpf", n: 1 };
      else if (r < 0.82) ai.plan = { k: "walk", dir: 1, n: 14 + (Math.random() * 18 | 0) };
      else ai.plan = { k: "wait", n: 14 };
    } else {
      if (r < 0.33) inp.pp = 1;
      else if (r < 0.56) inp.kp = 1;
      else if (r < 0.66) { inp.d = 1; inp.kp = 1; }
      else if (r < 0.71 && ready) inp.sp = 1;
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
    if (f.trail > f.hp) f.trail = Math.max(f.hp, f.trail - (f.hs > 0 || f.st === "hit" ? 0 : 0.6));
    // attacks run their course
    if (f.atk) {
      const a = f.atk, t = f.t;
      if (t === 1) f.atkId = ++atkSeq;
      if (a.sp && t === a.su) {
        SND.play(a.sfx);
        if (a.proj) g.proj.push({ k: a.proj, x: f.x + f.face * 30, y: f.y - (a.proj === "wave" ? 62 : 70), vx: a.speed * f.face, owner: f, dmg: a.dmg, t: 0 });
        if (a.flash) { g.flash = 10; spark(f.x + f.face * 28, f.y - 76, "flash"); }
      }
      if (a.dash) { if (t >= a.su && t < a.su + a.ac && !f.atkHit) f.vx = a.dash * f.face; else f.vx *= 0.7; if (t % 3 === 0 && t >= a.su && t < a.su + a.ac) g.fx.push({ k: "ghost", x: f.x, y: f.y, face: f.face, img: f.S.special[1], t: 0, life: 10 }); }
      if (!a.air && t >= a.su + a.ac + a.rc) { f.atk = null; f.st = a.crouch ? "crouch" : "idle"; f.vx = 0; }
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
        else if (f.st === "hit") f.vx = 0;
      }
    }
    if (f.st === "walk") f.walkT += f.walkDir;
    // face the other one when free
    if (free(f) && Math.abs(o.x - f.x) > 2) f.face = o.x > f.x ? 1 : -1;
  }
  const canBlock = (d) => onGround(d) && d.holdBack && (d.st === "idle" || d.st === "walk" || d.st === "crouch" || d.st === "block");
  function land(a, d, def, px, py, proj) {
    if (d.st === "down" || d.inv > 0 || (d.st === "fall" && d.hp <= 0)) return false;
    const blocked = canBlock(d) && !(def.low && !d.holdDown) && !(def.high && d.holdDown);
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
    else if (def.kd || !onGround(d)) { d.st = "fall"; d.vy = -3.4; d.vx = away * 2; d.y = Math.min(d.y, -1); }
    else { d.st = "hit"; d.hs = def.hs; d.vx = away * def.push; }
    spark(px, py, dmg >= 9 ? "burst" : "spark"); SND.play(def.sfx === "hit" ? "hit" : "heavy");
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
      const o = p.owner === a ? b : a, hu = hurt(o), pb = [p.x - 9, p.y - 9, p.x + 9, p.y + 9];
      if (!p.dead && overlap(pb, hu) && o.st !== "down") { if (land(p.owner, o, Object.assign({ hs: 20, bs: 12, push: 2.6, sfx: "heavy", sp: true }, SPECIAL[p.owner.id]), p.x, p.y, p)) p.dead = true; }
      if (p.x < g.camX - 40 || p.x > g.camX + W + 40) p.dead = true;
    }
    if (g.proj.length === 2 && !g.proj[0].dead && !g.proj[1].dead && Math.abs(g.proj[0].x - g.proj[1].x) < 14) { g.proj.forEach((p) => (p.dead = true)); spark((g.proj[0].x + g.proj[1].x) / 2, g.proj[0].y, "burst"); SND.play("block"); }
    g.proj = g.proj.filter((p) => !p.dead);
    // bodies don't overlap; both stay on screen
    if (Math.abs(a.x - b.x) < 26 && Math.abs(a.y - b.y) < 70 && a.st !== "down" && b.st !== "down") { const push = (26 - Math.abs(a.x - b.x)) / 2, s = a.x <= b.x ? -1 : 1; a.x += s * push; b.x -= s * push; }
    for (const f of g.f) f.x = clamp(f.x, Math.max(18, g.camX + 18), Math.min(STAGE_W - 18, g.camX + W - 18));
    const goal = clamp((a.x + b.x) / 2 - W / 2, 0, STAGE_W - W); g.camX += (goal - g.camX) * 0.18;
  }
  function stepRound(inp) {
    g.pt++;
    const [a, b] = g.f;
    if (g.phase === "intro") {
      if (g.pt === 1) { SND.play("round"); SND.music("fight"); }
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
      const a = f.atk;
      if (a.sp) return t < a.su ? S.special[0] : S.special[1];
      const fr = S[a.frames]; if (fr.length === 1) return fr[0];
      return t < a.su ? fr[0] : t < a.su + a.ac ? fr[1] : fr[2];
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
    const S = stage(), sx = g.shake > 0 ? Math.round(rnd(-g.shake, g.shake)) : 0, sy = g.shake > 0 ? Math.round(rnd(-g.shake, g.shake) * 0.6) : 0;
    const cx = Math.round(g.camX) - sx;
    ctx.drawImage(S.far, -Math.round(cx * 0.5), sy); ctx.drawImage(S.mid, -cx, sy);
    drawCrowd(ctx, cx, t, g.phase === "ko" && g.pt > 60 || g.phase === "match");
    ctx.save(); ctx.translate(0, sy);
    // shadows
    for (const f of g.f) { const w = Math.round(30 - Math.min(16, -f.y / 6)), x = Math.round(f.x - cx); ctx.fillStyle = "rgba(10,6,24,.45)"; ctx.fillRect(x - w / 2, FLOOR - 2, w, 3); ctx.fillRect(x - w / 2 + 3, FLOOR - 3, w - 6, 5); }
    for (const e of g.fx) if (e.k === "ghost") drawFx(ctx, e, cx);
    // the one attacking is drawn in front
    const order = g.f[0].st === "atk" ? [g.f[1], g.f[0]] : [g.f[0], g.f[1]];
    for (const f of order) {
      const jit = (f.st === "hit" || f.st === "block") && g.hitstop > 0 ? (g.hitstop % 2 ? 1 : -1) : 0;
      if (f.inv > 0 && f.inv % 4 < 2 && f.hp > 0) continue;
      drawSprite(ctx, frameOf(f), f.x - cx + jit, FLOOR + f.y, f.face);
      if (f.st === "dizzy") for (let i = 0; i < 3; i++) { const an = t * 5 + (i * Math.PI * 2) / 3, x = Math.round(f.x - cx + Math.cos(an) * 12), y = Math.round(FLOOR + f.y - 92 + Math.sin(an) * 3); ctx.fillStyle = OUT; ctx.fillRect(x - 2, y - 2, 5, 5); ctx.fillStyle = i === 1 ? "#ffffff" : "#ffe14a"; ctx.fillRect(x - 1, y - 1, 3, 3); }
    }
    for (const p of g.proj) drawProj(ctx, p, cx);
    for (const e of g.fx) if (e.k !== "ghost") drawFx(ctx, e, cx);
    ctx.restore();
    if (g.flash > 0) { ctx.fillStyle = "rgba(255,255,255," + Math.min(0.75, g.flash / 10) + ")"; ctx.fillRect(0, 0, W, H); }
    drawHUD(ctx, g, t);
    // the banners
    if (g.phase === "intro") {
      if (g.pt < 64) { const fin = g.round === 1 ? "ROUND 1" : g.wins[0] === 1 && g.wins[1] === 1 ? "FINAL ROUND" : "ROUND " + g.round; banner(ctx, fin, GOLD, g.pt < 6 ? 6 : 4, 84); }
      // the stage, named once, at the start of the match
      if (g.round === 1) { ctx.fillStyle = "rgba(14,10,26,.72)"; ctx.fillRect(0, H - 22, W, 16); text(ctx, "TWO MINUTES COFFEE SHOP - STR. ARICESCU, BUCHAREST", W / 2, H - 18, "#ffffff", { al: "c" }); }
      else banner(ctx, "FIGHT!", RED, g.pt < 70 ? 7 : 6, 80);
    } else if (g.phase === "ko" && g.pt < 150) banner(ctx, "K.O.", RED, g.pt < 8 ? 9 : 7, 72);
    else if (g.phase === "time" && g.pt < 150) banner(ctx, g.f[0].hp === g.f[1].hp ? "DRAW" : "TIME", GOLD, 6, 78);
    else if (g.phase === "match") { banner(ctx, g.result === "win" ? "YOU WIN" : "I O N WINS", g.result === "win" ? GOLD : RED, 5, 70); if (g.perfect && g.result === "win") text(ctx, "PERFECT!", W / 2, 112, "#ffffff", { sc: 2, al: "c" }); }
    if ((g.phase === "ko" || g.phase === "time") && g.pt > 150 && g.pt < 220) { const [a, b] = g.f; if (a.hp !== b.hp) banner(ctx, (a.hp > b.hp ? a : b).R.name + " WINS THE ROUND", "#ffffff", 2, 86); }
    if (paused) { ctx.fillStyle = "rgba(14,10,26,.7)"; ctx.fillRect(0, 0, W, H); banner(ctx, "PAUSE", GOLD, 5, 74); text(ctx, TOUCH ? "TAP TO PLAY ON" : "P TO PLAY ON - ESC FOR THE MAP", W / 2, 124, "#ffffff", { al: "c" }); hit(0, 0, W, H, () => setPause(false)); }
  }
  function drawResult(ctx, t) {
    const S = stage();
    ctx.drawImage(S.far, -60, 0); ctx.drawImage(S.mid, -96, 0);
    ctx.fillStyle = "rgba(14,10,26,.86)"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "rgba(29,21,64,.9)"; ctx.fillRect(180, 22, 180, 172);
    const win = g.result === "win", id = win ? g.me : "ion", p = portrait(id);
    ctx.fillStyle = OUT; ctx.fillRect(25, 37, 134, 134); ctx.fillStyle = win ? "#fed012" : "#d8342a"; ctx.fillRect(26, 38, 132, 132); ctx.fillStyle = "#241d3d"; ctx.fillRect(28, 40, 128, 128);
    if (p) ctx.drawImage(p, 28, 40, 128, 128);
    text(ctx, win ? "YOU WIN" : "I O N WINS", 270, 34, win ? GOLD : RED, { sc: 3, sh: 1, al: "c" });
    text(ctx, win ? "THE COFFEE IS ON I O N." : "TWO MINUTES WERE ENOUGH.", 270, 64, "#ffffff", { al: "c" });
    text(ctx, (win ? ROSTER[g.me].name : "I O N") + " " + g.wins[win ? 0 : 1] + " - " + g.wins[win ? 1 : 0], 270, 78, "#a99cc8", { al: "c" });
    const items = ["REMATCH", "CHANGE FIGHTER", "BACK TO MAP"];
    items.forEach((s, i) => {
      const y = 104 + i * 22, on = g.menu === i, w = 150;
      ctx.fillStyle = OUT; ctx.fillRect(270 - w / 2 - 1, y - 5, w + 2, 18); ctx.fillStyle = on ? "#fed012" : "#2d2550"; ctx.fillRect(270 - w / 2, y - 4, w, 16);
      text(ctx, (on ? "> " : "") + s, 270, y, on ? OUT : "#ffffff", { al: "c", ol: on ? null : OUT });
      hit(270 - w / 2, y - 5, w, 18, () => { if (g.menu !== i) { g.menu = i; SND.play("select"); } pick(i); });
    });
  }
  function pick(i) {
    SND.play("confirm");
    if (i === 0) newMatch(g.me);
    else if (i === 1) { scene = "select"; g = null; SND.music("menu"); }
    else backToMap();
  }

  // ===================== 10. the page: canvas, keys, touch, the loop =====================
  let root = null, cv = null, cx2 = null, scene = "title", sel = 0, sceneT = 0, paused = false, hits = [], stats = { fps: 0, frames: 0, t0: 0 };
  const hit = (x, y, w, h, fn) => hits.push({ x, y, w, h, fn });
  const KEYMAP = { ArrowLeft: "l", KeyA: "l", ArrowRight: "r", KeyD: "r", ArrowUp: "u", KeyW: "u", ArrowDown: "d", KeyS: "d", KeyJ: "p", KeyZ: "p", KeyK: "k", KeyX: "k", KeyL: "s", KeyC: "s", Enter: "ok", Space: "ok" };
  const held = { l: 0, r: 0, u: 0, d: 0, p: 0, k: 0, s: 0, ok: 0 }, pressed = new Set();
  const press = (k) => { if (!held[k]) pressed.add(k); held[k] = 1; };
  const release = (k) => { held[k] = 0; };
  function backToMap() {
    SND.music(null);
    try { if (window.parent !== window && window.parent.location.origin === location.origin) { window.parent.postMessage({ cz: "gloves-close" }, location.origin); return; } } catch {}
    location.href = "/?map";
  }
  function setPause(v) { if (scene !== "fight" || !g || g.phase === "match") v = false; if (paused === v) return; paused = v; SND.play("pause"); if (paused) for (const k in held) held[k] = 0; }
  function menuInput() {
    const P = (k) => pressed.has(k);
    if (scene === "title") { if (P("ok") || P("p") || P("k")) { scene = "select"; sceneT = 0; SND.play("confirm"); SND.music("menu"); } return; }
    if (scene === "select") {
      if (P("l")) { sel = (sel + 2) % 3; SND.play("select"); }
      if (P("r")) { sel = (sel + 1) % 3; SND.play("select"); }
      if (P("ok") || P("p")) { newMatch(CREW[sel]); scene = "game"; }
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
      drawSelect(ctx, t, sel);
      for (let i = 0; i < 3; i++) hit(18 + i * 76 - 3, 37, 70, 82, () => { if (sel === i) pressed.add("ok"); else { sel = i; SND.play("select"); } });
    } else if (g) {
      if (g.scene === "vs") { drawVS(ctx, g.t, g.me, g.t); hit(0, 0, W, H, () => pressed.add("ok")); }
      else if (g.scene === "fight") drawFight(ctx, t);
      else drawResult(ctx, t);
    }
  }
  // the layout: the picture as big as it fits (whole multiples on a laptop), the controls under it on a phone held
  // upright, over its lower corners when held sideways
  function layout() {
    const vw = innerWidth, vh = innerHeight, upright = vh > vw * 1.05;
    root.classList.toggle("mg-touch", TOUCH); root.classList.toggle("mg-up", TOUCH && upright); root.classList.toggle("mg-side", TOUCH && !upright);
    let sc, top;
    if (TOUCH && upright) { sc = Math.min(vw / W, (vh - 76 - 230) / H); top = 76; }
    else if (TOUCH) { const side = clamp(vw * 0.16, 128, 176); sc = Math.min((vw - side * 2) / W, vh / H); top = (vh - H * sc) / 2; }
    else { sc = Math.min((vw - 32) / W, (vh - 96) / H); if (sc >= 2) sc = Math.floor(sc); top = Math.max(16, (vh - H * sc) / 2 - 14); }
    sc = Math.max(0.5, sc);
    cv.style.width = Math.round(W * sc) + "px"; cv.style.height = Math.round(H * sc) + "px";
    cv.style.left = Math.round((vw - W * sc) / 2) + "px"; cv.style.top = Math.round(top) + "px";
    root.style.setProperty("--cv-bottom", Math.round(top + H * sc) + "px");
    // held upright: the moves between the picture and the controls, when there is room for them
    const tips = root.querySelector(".mg-tips");
    if (tips) { const room = vh - 230 - (top + H * sc); tips.hidden = !(TOUCH && upright) || room < 96; }
  }
  const pxText = (s, fill, sc = 2) => { const t = textImg(s, fill, { ol: null }), [c, x] = mk(t.w, t.h); x.drawImage(t.c, 0, 0); c.className = "mg-lbl"; c.style.width = t.w * sc + "px"; c.style.height = t.h * sc + "px"; return c; };
  function buildControls() {
    // the d-pad: one surface, 8 directions from where the thumb is
    const pad = document.createElement("div"); pad.className = "mg-dpad"; pad.setAttribute("aria-label", "Move");
    pad.innerHTML = '<i class="u"></i><i class="d"></i><i class="l"></i><i class="r"></i><b></b>';
    let pid = null;
    const setDir = (e) => {
      const r = pad.getBoundingClientRect(), dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2), dz = r.width * 0.14;
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
    if (!TOUCH) { const hint = document.createElement("div"); hint.className = "mg-hint"; hint.appendChild(pxText("ARROWS/WASD MOVE   J/Z PUNCH   K/X KICK   L/C SPECIAL   P PAUSE   ESC MAP", "#a99cc8", 2)); hint.appendChild(pxText("HOLD AWAY TO BLOCK   DOWN+KICK SWEEP   UP JUMP   M SOUND   V SCANLINES", "#6f6496", 2)); root.appendChild(hint); }
    else {
      buildControls();
      const tips = document.createElement("div"); tips.className = "mg-tips"; tips.hidden = true;
      for (const [l, c] of [["HOLD BACK: BLOCK", "#ffffff"], ["DOWN + K: SWEEP", "#ffffff"], ["UP: JUMP, THEN P OR K", "#ffffff"], ["S: SPECIAL, WHEN THE", "#7fd8ff"], ["BLUE BAR IS FULL", "#7fd8ff"]]) tips.appendChild(pxText(l, c, 2));
      root.appendChild(tips);
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
      if (paused) { if (k === "ok") setPause(false); return; }
      if (!e.repeat) press(k);
      if (k === "ok" && g && g.scene === "fight") { /* Enter does nothing in a fight */ }
    });
    addEventListener("keyup", (e) => { const k = KEYMAP[e.code]; if (k) release(k); });
    addEventListener("blur", () => { for (const k in held) held[k] = 0; setPause(true); });
    document.addEventListener("visibilitychange", () => { if (document.hidden) setPause(true); });
    cv.addEventListener("pointerdown", (e) => {
      SND.init(); try { window.focus(); } catch {}
      const r = cv.getBoundingClientRect(), x = ((e.clientX - r.left) / r.width) * W, y = ((e.clientY - r.top) / r.height) * H;
      for (let i = hits.length - 1; i >= 0; i--) { const h = hits[i]; if (x >= h.x && x < h.x + h.w && y >= h.y && y < h.y + h.h) { h.fn(); break; } }
    });
    addEventListener("resize", layout); layout();
    // everything is baked before the first frame (a few ms), then the loop: logic in fixed 1/60 s steps
    for (const id of ["daniel", "cristian", "coz", "ion"]) { sprites(id); portrait(id); } stage();
    let last = performance.now(), acc = 0;
    stats.t0 = last;
    const loop = (now) => {
      acc += Math.min(0.1, (now - last) / 1000); last = now;
      let n = 0; while (acc >= 1 / 60 && n < 4) { step(); acc -= 1 / 60; n++; }
      if (n === 4) acc = 0;
      draw(now / 1000);
      stats.frames++; if (now - stats.t0 >= 1000) { stats.fps = Math.round((stats.frames * 1000) / (now - stats.t0)); stats.frames = 0; stats.t0 = now; }
      requestAnimationFrame(loop);
    };
    requestAnimationFrame(loop);
    SND.music("menu");
    try { window.focus(); } catch {}
  }
  // for tests and the review: the state, the frame rate, a shortcut to the end of a round
  const probe = () => ({ scene: scene === "game" && g ? g.scene : scene, phase: g?.phase, round: g?.round, wins: g?.wins.slice(), hp: g?.f.map((f) => f.hp), st: g?.f.map((f) => f.st), time: g ? Math.ceil(g.time) : null, me: g?.me, sel, menu: g?.menu, result: g?.result, paused, fps: stats.fps, sound: SND.on, proj: g ? g.proj.map((p) => p.k) : [] });
  const setHp = (a, b) => { if (g && g.f.length) { g.f[0].hp = g.f[0].trail = a; g.f[1].hp = g.f[1].trail = b; } };

  // the art on its own, for review: every sheet as a PNG data URL, scaled with crisp pixels
  function exportArt(scale = 5) {
    const up = (c, s = scale) => { const [o, x] = mk(c.width * s, c.height * s); x.drawImage(c, 0, 0, o.width, o.height); return o.toDataURL("image/png"); };
    const out = {};
    for (const id of ["daniel", "cristian", "coz", "ion"]) {
      const S = sprites(id), order = ["idle", "walk", "crouch", "jump", "punch", "kick", "cpunch", "ckick", "jpunch", "jkick", "block", "cblock", "special", "hit", "dizzy", "fall", "down", "win"];
      const frames = []; for (const k of order) for (const f of S[k]) frames.push([k, f]);
      const cols = 8, rows = Math.ceil(frames.length / cols), [c, x] = mk(cols * CW, rows * (CH + 10));
      x.fillStyle = "#2a2148"; x.fillRect(0, 0, c.width, c.height);
      frames.forEach(([k, f], i) => { const cx = (i % cols) * CW, cy = Math.floor(i / cols) * (CH + 10); x.fillStyle = "#332a58"; x.fillRect(cx + 1, cy + 1, CW - 2, CH - 2); x.drawImage(f, cx, cy); text(x, k.toUpperCase(), cx + 3, cy + CH + 1, "#a99cc8", { ol: null }); });
      out[`sprites-${id}`] = up(c, 4);
      const [ic, ix] = mk(CW, CH); ix.fillStyle = "#332a58"; ix.fillRect(0, 0, CW, CH); ix.drawImage(S.idle[0], 0, 0); out[`idle-${id}`] = up(ic, 6);
      const [pc, px] = mk(64, 64); px.fillStyle = "#241d3d"; px.fillRect(0, 0, 64, 64); px.drawImage(portrait(id), 0, 0); out[`portrait-${id}`] = up(pc, 6);
    }
    const S = stage(); { const [c, x] = mk(STAGE_W, H); x.drawImage(S.far, 0, 0); x.drawImage(S.mid, 0, 0); drawCrowd(x, 0, 0, false); out.stage = up(c, 4); }
    const [c, x] = mk(W, H);
    drawTitle(x, 0); out.title = up(c);
    drawSelect(x, 0.1, 0); out.select = up(c);
    drawVS(x, 0, "daniel", 1); out.vs = up(c);
    { // the HUD over the stage, with the two fighters in their stance
      x.drawImage(S.far, -60, 0); x.drawImage(S.mid, -96, 0); drawCrowd(x, 96, 0, false);
      const A = sprites("daniel").idle[0], B = sprites("ion").idle[0];
      x.drawImage(A, 140 - OX, FLOOR - OY);
      x.save(); x.translate(244 + OX, FLOOR - OY); x.scale(-1, 1); x.drawImage(B, 0, 0); x.restore();
      drawHUD(x, { f: [{ R: ROSTER.daniel, hp: 72, trail: 80, spCool: 0, spMax: 1 }, { R: ROSTER.ion, hp: 45, trail: 45, spCool: 0.5, spMax: 1 }], wins: [1, 0], time: 47 }, 0);
      out.hud = up(c);
    }
    return out;
  }
  window.czGloves = Object.assign(window.czGloves || {}, { mount, exportArt, probe, setHp });
  const auto = () => { const el = document.getElementById("mg"); if (el && !root) mount(el); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", auto); else auto();
})();
