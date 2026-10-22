// Cromatic · diorama renders (TASK-118): OMA Coffee dressed as a set for the diorama stories (story mode only: built
// in the page by the shot, never by the map). The map's OMA (buildOmaShop, 706, 4560, its front facing +x) is a solid
// box with mirror glass on its face; for the stories its box is swapped for a shell with the two arches open, real
// glass in them, and a lit room behind: a counter with its espresso machine, a pastry case, shelves, a menu board, a
// table and chairs, pendant lamps (each a warm light with its own shadow), and figurines (figurines.js), posed.
// All in OMA's own frame (local +z = the street side, y up, the floor at 5): the city's bend comes with it.
import { figurine } from "../src/figurines.js";
export function findOma(S) {
  let g = null;
  S.scene.traverse((o) => { if (!g && o.isGroup && Math.abs(o.position.x - 706) < 0.5 && Math.abs(o.position.z - 4560) < 0.5 && o.children.length > 10) g = o; });
  return g;
}
const canvasTex = (K, w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); const t = new K.CanvasTexture(c); t.colorSpace = K.SRGBColorSpace; t.anisotropy = 8; return t; };
export function buildOmaSet(ctx, o = {}) {
  const { S, K } = ctx, oma = findOma(S);
  if (!oma) throw new Error("OMA not found in the scene");
  const set = new K.Group(); set.name = "omaSet"; oma.add(set);
  const undo = [];
  // the solid body out, the mirror glass out (kept for the "before", which shows the map as it is)
  const body = oma.children.find((c) => c.isMesh && c.geometry.type === "BoxGeometry" && c.geometry.parameters.width === 76 && c.geometry.parameters.height === 62);
  const wallM = body.material;
  const glassMeshes = []; oma.traverse((c) => { if (c.isMesh && c.material === S.mats.omaGlow) glassMeshes.push(c); });
  const M = (c, r = 0.75, x = {}) => new K.MeshStandardMaterial({ color: c, roughness: r, metalness: 0, ...x });
  const add = (g, m, x, y, z, parent = set) => { const me = new K.Mesh(g, m); me.position.set(x, y, z); me.castShadow = true; me.receiveShadow = true; parent.add(me); return me; };
  const box = (w, h, d, m, x, y, z, parent) => add(new K.BoxGeometry(w, h, d), m, x, y, z, parent);
  const cyl = (rt, rb, h, m, x, y, z, seg = 20, parent) => add(new K.CylinderGeometry(rt, rb, h, seg), m, x, y, z, parent);
  const W = 76, H = 62, D = 48;
  // ---- the shell: the walls (2 thick), the roof under the cornice, and the front with the arches cut out
  const plaster = M("#efe2cc", 0.85), floorTex = canvasTex(K, 512, 512, (g, w, h) => { g.fillStyle = "#8a5a3a"; g.fillRect(0, 0, w, h); for (let i = 0; i < 16; i++) { const y = (i * h) / 16; g.fillStyle = `hsl(24, ${38 + (i * 7) % 12}%, ${30 + ((i * 13) % 9)}%)`; g.fillRect(0, y + 1, w, h / 16 - 2); for (let k = 0; k < 3; k++) { g.fillStyle = "rgba(40,22,10,0.35)"; g.fillRect(((i * 97 + k * 173) % w), y, 2, h / 16); } } });
  floorTex.wrapS = floorTex.wrapT = K.RepeatWrapping; floorTex.repeat.set(3, 2);
  const shellOut = new K.Group(); set.add(shellOut);
  box(2, H, D, wallM, -W / 2 + 1, H / 2, 0, shellOut); box(2, H, D, wallM, W / 2 - 1, H / 2, 0, shellOut);
  box(W, H, 2, wallM, 0, H / 2, -D / 2 + 1, shellOut); box(W, 2, D, wallM, 0, H - 1, 0, shellOut);
  const archHole = (ax, b, w, h) => { const p = new K.Path(), r = w / 2; p.moveTo(ax - r, b); p.lineTo(ax + r, b); p.lineTo(ax + r, b + h - r); p.absarc(ax, b + h - r, r, 0, Math.PI, false); p.lineTo(ax - r, b); return p; };
  const front = new K.Shape(); front.moveTo(-W / 2, 0); front.lineTo(W / 2, 0); front.lineTo(W / 2, H); front.lineTo(-W / 2, H); front.lineTo(-W / 2, 0);
  front.holes.push(archHole(-17, 6.5, 23, 44.5), archHole(17, 5, 23, 44.5));
  const fg = new K.ExtrudeGeometry(front, { depth: 2, bevelEnabled: false, curveSegments: 24 }); fg.translate(0, 0, D / 2 - 2);
  add(fg, wallM, 0, 0, 0, shellOut);
  // the inside: plaster walls a hair inside the shell, a timber floor at the arches' sill, a dark ceiling
  const inner = new K.Group(); set.add(inner);
  const ig = new K.ShapeGeometry(front, 24); const innerFront = add(ig, plaster, 0, 0, D / 2 - 2.05, inner); innerFront.rotation.y = Math.PI; innerFront.position.x = 0; innerFront.scale.x = -1; innerFront.material = plaster.clone(); innerFront.material.side = K.DoubleSide;
  box(W - 4, H - 4, 0.4, plaster, 0, H / 2, -D / 2 + 2.2, inner); box(0.4, H - 4, D - 4, plaster, -W / 2 + 2.2, H / 2, 0, inner); box(0.4, H - 4, D - 4, plaster, W / 2 - 2.2, H / 2, 0, inner);
  box(W - 4, 1, D - 4, M("#ffffff", 0.7, { map: floorTex }), 0, 4.6, 0, inner);
  box(W - 4, 0.6, D - 4, M("#2b2420", 0.9), 0, H - 2.4, 0, inner);
  // a wainscot (a darker band low on the walls) and a picture rail: what a real café's walls have
  box(W - 4.4, 12, 0.3, M("#5b3f2e", 0.6), 0, 11, -D / 2 + 2.5, inner);
  box(0.3, 12, D - 4.4, M("#5b3f2e", 0.6), W / 2 - 2.5, 11, 0, inner);
  // ---- the bar, along the back wall on the right (the half of the room the street sees through both arches): timber
  // with vertical boards, a pale stone top, the espresso machine, a grinder, the pastry case, shelves and a menu behind
  const wood = M("#6b4126", 0.5), stone = M("#e9e2d6", 0.35), steel = new K.MeshStandardMaterial({ color: "#d4d7da", metalness: 0.9, roughness: 0.22, envMap: S.mats.omaGlow.envMap, envMapIntensity: 0.6 }), black = M("#1c1c1e", 0.45);
  steel.userData.dioKeep = true;
  const bz = -12; // the bar's middle (depth)
  box(32, 14, 7, wood, 13, 12, bz, inner); box(33, 1.1, 8.4, stone, 13, 19.55, bz, inner);
  for (let i = 0; i < 10; i++) box(0.25, 13, 0.3, M("#4d2e1a", 0.6), -2 + i * 3.3, 12, bz + 3.6, inner);
  const em = new K.Group(); inner.add(em); em.position.set(5, 20.1, bz - 0.5);
  box(8.5, 5.2, 6, steel, 0, 2.6, 0, em); box(8.6, 0.6, 6.1, black, 0, 5.4, 0, em);
  for (const x of [-2, 2]) { cyl(0.8, 0.8, 1.1, black, x, 2.6, 2.4, 12, em); cyl(0.35, 0.35, 1.6, steel, x, 1.6, 3.1, 8, em); }
  for (let i = 0; i < 4; i++) cyl(0.55, 0.45, 0.9, M("#f4efe6", 0.3), -2.2 + (i % 2) * 1.4, 6.2, -1 + Math.floor(i / 2) * 1.4, 12, em);
  const gr = new K.Group(); inner.add(gr); gr.position.set(12.5, 20.1, bz - 1);
  box(2.6, 4.2, 2.6, black, 0, 2.1, 0, gr); add(new K.ConeGeometry(1.6, 3, 16, 1, true), M("#3a2a20", 0.3, { transparent: true, opacity: 0.7 }), 0, 5.6, 0, gr).rotation.x = Math.PI;
  const pc = new K.Group(); inner.add(pc); pc.position.set(22, 20.1, bz);
  box(9, 0.4, 6.4, wood, 0, 0.2, 0, pc);
  const glassCase = new K.MeshStandardMaterial({ color: "#ffffff", roughness: 0.05, transparent: true, opacity: 0.16, depthWrite: false });
  const gb = box(9, 4.6, 6.4, glassCase, 0, 2.7, 0, pc); gb.castShadow = false; gb.userData.dioNoCast = true;
  const pastry = [M("#c98a3e", 0.55), M("#e0b46a", 0.6), M("#7a3f22", 0.5), M("#f0d9a8", 0.6)];
  for (let i = 0; i < 12; i++) { const p = add(new K.SphereGeometry(0.75, 12, 8), pastry[i % 4], -3 + (i % 4) * 2, 0.95, -1.6 + Math.floor(i / 4) * 1.6, pc); p.scale.set(1.3, 0.6, 0.9); }
  cyl(0.9, 0.9, 0.3, M("#c7a77a", 0.6), 28, 20.3, bz, 16, inner); // a tray by the till
  box(3, 2.4, 2.2, black, 28, 21.6, bz - 1.5, inner); // the till
  // the back wall behind the bar: two shelves of jars and coffee bags, the menu board over them, a mirror strip
  for (const y of [29, 35]) {
    box(30, 0.5, 2.4, wood, 13, y, -D / 2 + 3.6, inner);
    for (let i = 0; i < 9; i++) { const c = ["#2f5b46", "#c4553a", "#e6d2a8", "#3a3f6b", "#d9a441"][i % 5]; const tall = 2.2 + (i % 3) * 0.8; box(1.8, tall, 1.6, M(c, 0.6), 0.5 + i * 3.2, y + 0.25 + tall / 2, -D / 2 + 3.6, inner); }
  }
  const menu = canvasTex(K, 512, 340, (g, w, h) => { g.fillStyle = "#1e1f1d"; g.fillRect(0, 0, w, h); g.fillStyle = "#f2ead8"; g.font = "700 46px Georgia, serif"; g.fillText("oma", 30, 70); g.font = "26px Georgia, serif"; ["espresso  9", "flat white  14", "cortado  12", "filter  13", "cardamom bun  11"].forEach((t, i) => g.fillText(t, 34, 120 + i * 42)); g.strokeStyle = "#a88a5a"; g.lineWidth = 6; g.strokeRect(8, 8, w - 16, h - 16); });
  box(15, 10, 0.5, M("#ffffff", 0.6, { map: menu }), 13, 45, -D / 2 + 2.7, inner);
  // the left half: a long bench along the left wall, a small table, a big plant; prints on the walls
  const tableAt = (x, z, r = 5) => { cyl(r, r, 0.6, stone, x, 17.6, z, 28, inner); cyl(0.5, 0.5, 11.5, black, x, 11.6, z, 10, inner); cyl(3, 3, 0.5, black, x, 5.4, z, 20, inner); };
  const chair = (x, z, rot) => { const c = new K.Group(); inner.add(c); c.position.set(x, 5, z); c.rotation.y = rot; box(5, 0.6, 5, wood, 0, 6.1, 0, c); box(5, 7, 0.6, wood, 0, 10.0, -2.2, c); for (const [dx, dz] of [[-2.1, -2.1], [2.1, -2.1], [-2.1, 2.1], [2.1, 2.1]]) box(0.5, 6.2, 0.5, wood, dx, 3.1, dz, c); return c; };
  // the table behind the door's arch (right), two chairs: seen through the glass from the street
  tableAt(22, 7); chair(15.5, 7, Math.PI / 2); chair(28.5, 8, -Math.PI / 2);
  cyl(0.8, 0.6, 1.4, M("#f6f1e8", 0.3), 23.6, 18.6, 5.6, 14, inner); cyl(1.3, 1.3, 0.2, M("#f6f1e8", 0.3), 23.6, 18, 5.6, 16, inner);
  cyl(0.5, 0.7, 2.2, M("#4e7a8a", 0.25), 21, 19, 9.5, 12, inner);
  box(6, 7, 26, wood, -W / 2 + 6, 8.5, -2, inner); box(6.4, 1.2, 26.4, M("#7a2f2a", 0.7), -W / 2 + 6, 12.6, -2, inner); // the bench, its red cushion
  tableAt(-22, -2, 4);
  const plant = (x, z, s2 = 1) => { cyl(2.2 * s2, 1.7 * s2, 4.5 * s2, M("#b46a3c", 0.7), x, 5 + 2.25 * s2, z, 16, inner); const leaf = M("#3f7d48", 0.65); for (let i = 0; i < 11; i++) { const l = add(new K.SphereGeometry(1.7 * s2, 10, 8), leaf, x + Math.sin(i * 2.4) * 1.9 * s2, 5 + (5.5 + (i % 4) * 2.3) * s2, z + Math.cos(i * 2.4) * 1.9 * s2, inner); l.scale.set(1, 1.5, 0.7); l.rotation.y = i; } };
  plant(33, 17, 1.15); plant(-32, -19, 1.0);
  box(12, 9, 0.5, M("#2a2622", 0.5), -16, 38, -D / 2 + 2.6, inner); box(10.6, 7.6, 0.55, M("#d9b48a", 0.8), -16, 38, -D / 2 + 2.7, inner); box(4, 3, 0.6, M("#c4553a", 0.8), -17.5, 38.5, -D / 2 + 2.8, inner);
  box(0.5, 12, 9, M("#2a2622", 0.5), W / 2 - 2.6, 38, -4, inner); box(0.55, 10.6, 7.6, M("#9bb0a0", 0.8), W / 2 - 2.7, 38, -4, inner);
  // ---- the lamps: three pendants (black shades, the bulbs glowing), each a warm light; the two big ones cast shadows
  const bulbM = new K.MeshStandardMaterial({ color: "#fff1d6", emissive: new K.Color("#ffc074"), emissiveIntensity: 9, roughness: 0.4 });
  const lights = [];
  for (const [x, z, sh] of [[6, -10, true], [22, 7, true], [-16, -2, false]]) {
    cyl(0.12, 0.12, 9, black, x, H - 7.5, z, 6, inner);
    const shade = add(new K.CylinderGeometry(1.1, 4.0, 3.2, 24, 1, true), M("#151515", 0.5, { side: K.DoubleSide }), x, H - 13.4, z, inner);
    const b = add(new K.SphereGeometry(1.15, 14, 10), bulbM, x, H - 14.6, z, inner); b.castShadow = false; b.userData.dioNoCast = true;
    const L = new K.PointLight("#ffb56a", o.lampI ?? 900, 160, 2); L.position.set(x, H - 16.2, z); L.castShadow = sh;
    if (sh) { L.shadow.mapSize.set(512, 512); L.shadow.camera.near = 0.5; L.shadow.camera.far = 160; L.shadow.bias = -0.002; L.shadow.normalBias = 0.2; }
    inner.add(L); lights.push(L);
  }
  // a soft fill from just inside the glass, back into the room (the faces of the figurines, not only their backs)
  { const F = new K.PointLight("#ffd2a0", (o.lampI ?? 900) * 0.45, 120, 2); F.position.set(4, 40, 17); F.castShadow = false; inner.add(F); lights.push(F); }
  // the floor upstairs is lived in: its two small windows warm behind their curtains
  oma.traverse((c) => { if (c.isMesh && c.geometry.type === "BoxGeometry" && Math.abs(c.geometry.parameters.width - 9.6) < 0.01 && Math.abs(c.geometry.parameters.height - 6.8) < 0.01) { const m = c.material.clone(); m.color.set("#3a2a20"); m.emissive = new K.Color("#ff9a4a"); m.emissiveIntensity = 0.5; m.metalness = 0; m.roughness = 0.8; undo.push([c, c.material]); c.material = m; } });
  // ---- the figurines (each posed once; local +z faces the street; the street's lens is out at local (-190, 256))
  const people = new K.Group(); inner.add(people);
  const put = (opts, x, z, rot, y = 5) => { const f = figurine(K, opts); f.position.set(x, y, z); f.rotation.y = rot; people.add(f); return f; };
  // the barista behind the bar, at the machine
  put({ sex: "f", h: 27.5, skin: "#d9a07a", hair: "#2b1a12", hairStyle: "bun", top: "#f1ece2", bottom: "#2b2b2e", apron: "#2f5b46", shoes: "#1b1b1b", pose: "barista" }, 5.5, -18.2, 0.1);
  // a customer at the bar, cup in hand, turned to the street
  put({ sex: "m", h: 29.5, skin: "#e3b391", hair: "#5a3a22", hairStyle: "short", beard: true, top: "#dfe3e8", jacket: "#3b4e66", bottom: "#6b6152", shoes: "#3b2618", pose: "cupTalk", cupSleeve: "#2f5b46" }, 14, -3.2, Math.PI - 0.7);
  // two at the table: one seated with her cup, one leaning back, talking
  put({ sex: "f", h: 27.5, skin: "#f0c6a4", hair: "#9a5a2c", hairStyle: "long", top: "#c6463c", bottom: "#2f3b55", shoes: "#6b3b2a", pose: "sitCup", glasses: true }, 16.4, 7, Math.PI / 2);
  put({ sex: "m", h: 29, skin: "#8d5a3c", hair: "#0f0b08", hairStyle: "crop", top: "#e9e3d3", bottom: "#3a3f36", shoes: "#d9d4c8", pose: "sitTalk", shortSleeves: true }, 27.6, 8, -Math.PI / 2);
  // someone just in through the door, reading her phone (facing the lens)
  put({ sex: "f", h: 28, skin: "#e8b896", hair: "#1d1612", hairStyle: "bob", top: "#efe6d2", jacket: "#b3805a", skirt: "#2a2a30", legs: "#3a3438", shoes: "#1b1b1b", pose: "phone", bag: true, bagColor: "#7a3a2a" }, -8, 13, -0.6);
  // on the bench by the left wall, with a book's worth of patience
  put({ sex: "m", h: 28.5, skin: "#c8946c", hair: "#3a2a1e", hairStyle: "short", top: "#2f4f6b", bottom: "#c9b99a", shoes: "#2a1d14", pose: "sitCup", glasses: true, seat: 8.6 - 1.6 + 0 }, -W / 2 + 7.5, -6, Math.PI / 2);
  // outside: on the timber bench under the left window, and one walking past on the pavement
  if (o.outside !== false) {
    put({ sex: "m", h: 29, skin: "#d7a17c", hair: "#6b6b6b", hairStyle: "short", top: "#f2efe8", jacket: "#6d7a52", bottom: "#2d3340", shoes: "#2a1d14", pose: "sitCup", glasses: true, cupSleeve: "#c4553a" }, -16, 29.6, 0.15, 5.9 - 6.4);
    put({ sex: "f", h: 28.5, skin: "#c98f6a", hair: "#3b2416", hairStyle: "long", top: "#f3d36a", bottom: "#24304a", shoes: "#efe8dc", pose: "walkBag", bagColor: "#2f5b46" }, 12, 46, -Math.PI / 2 - 0.25, 0);
  }
  // ---- the glass: clear, a faint warm tint, the street's reflection in it (the city's environment), never casting
  const glass = new K.MeshStandardMaterial({ color: "#f4efe6", roughness: 0.04, metalness: 0, transparent: true, opacity: o.glassOpacity ?? 0.1, envMap: S.mats.omaGlow.envMap, envMapIntensity: o.glassRefl ?? 0.9, depthWrite: false });
  glass.userData.dioKeep = true;
  const saved = glassMeshes.map((g) => [g, g.material, g.castShadow, g.renderOrder]);
  set.traverse((m) => { if (m.isMesh) m.userData.dioNoCast = m.userData.dioNoCast || m.material.transparent; });
  const on = (v) => {
    set.visible = v; body.visible = !v;
    for (const [g, m, c, ro] of saved) { g.material = v ? glass : m; g.castShadow = v ? false : c; g.userData.dioNoCast = v; g.renderOrder = v ? 2 : ro; }
    for (const L of lights) L.visible = v;
  };
  // point lights live in the bent world: the city's warp moves every vertex in the shader (OMA's by ~110 units here)
  // but a light's position is a uniform, unbent: so the lamps are put where their bulbs are drawn (warped), in the scene
  oma.updateMatrixWorld(true);
  for (const L of lights) { const wp = S.warpV(L.getWorldPosition(new K.Vector3())); L.parent.remove(L); L.position.copy(wp); S.scene.add(L); }
  on(true);
  const dispose = () => { on(false); for (const [c, m] of undo) c.material = m; for (const L of lights) L.parent && L.parent.remove(L); set.parent && set.parent.remove(set); };
  return { set, people, lights, on, oma, body, glass: glassMeshes, dispose };
}
