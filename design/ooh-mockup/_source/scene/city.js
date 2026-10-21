// Cromatic · Litorsal OOH mockups (TASK-069): a Bucharest boulevard, built from boxes and our own textures. Units:
// metres. x along the street (right +), y up (the road at 0), z toward the near side. The street: a tram line in a
// paved median between two carriageways, sidewalks with lindens, prefab blocks of flats behind green strips. The sun is
// a directional light jittered over its disc (soft shadows); the sky is a gradient with the sun's glow, which also
// lights the scene (its filtered environment) together with a warm ground bounce.
import * as THREE from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { rng } from "../../../metro-mockup/_source/scene/lib.js";
import * as T from "./tex2.js";

export const std = (o) => new THREE.MeshStandardMaterial(o);
const loadTex = (u) => new Promise((res, rej) => new THREE.TextureLoader().load(u, (t) => { t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 16; res(t); }, undefined, rej));
// the campaign's real layouts (site/media/litorsal), never altered: the face's size follows the picture's own ratio
export const ART = {
  "6x3": { url: "/site/media/litorsal/heat-6x3.jpg", ar: 1600 / 838 },
  tall: { url: "/site/media/litorsal/heat-tall.jpg", ar: 1100 / 1634 },
  strip: { url: "/site/media/litorsal/heat-250x110.jpg", ar: 1600 / 800 },
  billboard: { url: "/site/media/litorsal/heat-billboard.jpg", ar: 1600 / 1200 }
};
const artCache = {};
export async function art(kind) { if (!artCache[kind]) artCache[kind] = await loadTex(ART[kind].url); return artCache[kind]; }

export function box(w, h, d, mat, x, y, z, { cast = true, recv = true } = {}) { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), mat); m.position.set(x, y, z); m.castShadow = cast; m.receiveShadow = recv; return m; }
const bgeo = (w, h, d, x, y, z) => new THREE.BoxGeometry(w, h, d).translate(x, y, z);
function merged(geos, mat, { cast = true, recv = true } = {}) { const m = new THREE.Mesh(mergeGeometries(geos), mat); m.castShadow = cast; m.receiveShadow = recv; return m; }
const cyl = (r0, r1, h, seg = 16) => new THREE.CylinderGeometry(r1, r0, h, seg);
// a cylinder from a to b (world points), radius r
function rod(a, b, r, seg = 8, r1 = r) {
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), d = B.clone().sub(A), L = d.length();
  const g = new THREE.CylinderGeometry(r1, r, L, seg, 1, true); g.translate(0, L / 2, 0);
  g.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize())); g.translate(A.x, A.y, A.z);
  return g;
}
function metricUV(geo, span, axisU = "x", axisV = "z") {
  const p = geo.attributes.position, uv = geo.attributes.uv;
  for (let i = 0; i < p.count; i++) uv.setXY(i, p["get" + axisU.toUpperCase()](i) / span, p["get" + axisV.toUpperCase()](i) / span);
  uv.needsUpdate = true; return geo;
}
function surface(t, { rep = 1, rough = 1, color = 0xffffff, metal = 0 } = {}) {
  const m = std({ map: T.tex(t.map, { rep: [rep, rep] }), roughnessMap: t.rough ? T.tex(t.rough, { srgb: false, rep: [rep, rep] }) : null, roughness: rough, color, metalness: metal });
  return m;
}

// ---------- the sky: a gradient with haze at the horizon and the sun's glow (linear HDR) ----------
export function skyMesh(o) {
  const m = new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, fog: false,
    uniforms: { sunDir: { value: new THREE.Vector3(...o.sunDir).normalize() }, zen: { value: new THREE.Color(...o.zenith) }, hor: { value: new THREE.Color(...o.horizon) }, gnd: { value: new THREE.Color(...o.ground) }, sunCol: { value: new THREE.Color(...o.sunGlow) }, k: { value: o.k ?? 1 }, disc: { value: o.disc ?? 1 } },
    vertexShader: "varying vec3 vD; void main(){ vD = normalize((modelMatrix * vec4(position, 0.0)).xyz); gl_Position = projectionMatrix * viewMatrix * modelMatrix * vec4(position, 1.0); gl_Position.z = gl_Position.w * 0.99999; }",
    fragmentShader: `uniform vec3 sunDir, zen, hor, gnd, sunCol; uniform float k, disc; varying vec3 vD;
      void main(){ vec3 d = normalize(vD); float h = d.y;
        float t = pow(clamp(h, 0.0, 1.0), 0.42);
        vec3 c = mix(hor, zen, t);
        float s = max(dot(d, sunDir), 0.0);
        c += sunCol * (0.55 * pow(s, 6.0) + 1.6 * pow(s, 48.0) + 6.0 * pow(s, 600.0)) * smoothstep(-0.05, 0.05, h);
        c += disc * sunCol * 400.0 * smoothstep(0.99996, 0.99999, s);
        c = mix(c, gnd, smoothstep(0.0, -0.08, h));
        gl_FragColor = vec4(c * k, 1.0); }`
  });
  const s = new THREE.Mesh(new THREE.SphereGeometry(1500, 48, 24), m); s.frustumCulled = false; s.renderOrder = -1;
  return s;
}
export function envFromSky(Rr, o) {
  const S = new THREE.Scene(); S.add(skyMesh({ ...o, disc: 0 }));
  const gm = new THREE.Mesh(new THREE.CircleGeometry(800, 32).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ color: new THREE.Color(...o.ground) })); gm.position.y = -1.5; S.add(gm);
  const pm = new THREE.PMREMGenerator(Rr); const rt = pm.fromScene(S, 0, 0.1, 2000); pm.dispose(); return rt.texture;
}

// ---------- the street's ground ----------
// S: { x0, x1, median: [z0, z1], road: [[z0, z1], ...], walks: [[z0, z1], ...], green: [[z0, z1], ...], tracks: [z, ...] }
export function street(S) {
  const G = new THREE.Group(), L = S.x1 - S.x0, cx = (S.x0 + S.x1) / 2;
  const asp = surface(T.asphalt({ seed: 31 }), {}), sl = surface(T.slabs({ seed: 41 }), {}), med = surface(T.slabs({ seed: 43, tw: 1.0, th: 0.5, base: "#9b968b" }), {}), gr = surface(T.grass({ seed: 51 }), {});
  const strip = (z0, z1, mat, span, y = 0) => { const g = new THREE.PlaneGeometry(L, z1 - z0).rotateX(-Math.PI / 2).translate(cx, y, (z0 + z1) / 2); metricUV(g, span, "x", "z"); const m = new THREE.Mesh(g, mat); m.receiveShadow = true; G.add(m); return m; };
  for (const [z0, z1] of S.road) strip(z0, z1, asp, 12);
  strip(S.median[0], S.median[1], med, 6, 0.14);
  for (const [z0, z1] of S.walks) strip(z0, z1, sl, 6, 0.16);
  for (const [z0, z1] of S.green || []) strip(z0, z1, gr, 4, 0.12);
  // kerbs: granite, at every edge between road and the raised parts
  const kerb = std({ color: 0x8f8b84, roughness: 0.8 }), kg = [];
  for (const z of S.kerbs || []) kg.push(bgeo(L, 0.18, 0.18, cx, 0.08, z));
  if (kg.length) G.add(merged(kg, kerb));
  // the rails in the median (grooved, polished tops), and the paint on the road
  const rail = std({ color: 0x8c8780, metalness: 0.9, roughness: 0.32 }), rg = [];
  for (const z of S.tracks || []) for (const s of [-0.7175, 0.7175]) rg.push(bgeo(L, 0.03, 0.07, cx, 0.155, z + s));
  if (rg.length) G.add(merged(rg, rail, { cast: false }));
  const paint = std({ color: 0xe9e6dc, roughness: 0.7 }), pg = [];
  for (const [z, dashed] of S.lines || []) { if (!dashed) pg.push(bgeo(L, 0.004, 0.14, cx, 0.003, z)); else for (let x = S.x0; x < S.x1; x += 9) pg.push(bgeo(3, 0.004, 0.13, x + 1.5, 0.003, z)); }
  if (pg.length) { const m = merged(pg, paint, { cast: false }); G.add(m); }
  return G;
}

// ---------- a prefab block of flats (a "bloc"): facade on +z (or -z), balconies, a parapet on the roof ----------
// o: { x, z, W, D, floors, FH, GF, base, seed, balc (bay indices with balconies), face: 1 | -1, gable: true (its +x end
// is a blind gable, returned as an anchor for a banner) }
export async function block(o) {
  const r = rng(o.seed || 1), FH = o.FH || 2.75, GF = o.GF || 3.4, H = GF + o.floors * FH + 0.5, BW = o.BW || 3.6, W = o.W, D = o.D || 12;
  const bays = Math.round(W / BW), balc = new Set(o.balc || Array.from({ length: bays }, (_, b) => b).filter((b) => b % 3 === 1));
  const G = new THREE.Group(); G.position.set(o.x, 0, o.z); if (o.face === -1) G.rotation.y = Math.PI; if (o.rotY) G.rotation.y = o.rotY;
  const F = T.facade({ W, H, GF, FH, BW, k: o.k || 40, seed: o.seed || 61, base: o.base || "#d6c6a6", balc, shop: o.shop !== false });
  const fm = std({ map: T.tex(F.map, { rep: [1, 1] }), roughnessMap: T.tex(F.rough, { srgb: false }), roughness: 1, envMapIntensity: 1 });
  fm.map.wrapS = fm.map.wrapT = THREE.ClampToEdgeWrapping; fm.roughnessMap.wrapS = fm.roughnessMap.wrapT = THREE.ClampToEdgeWrapping;
  const front = new THREE.Mesh(new THREE.PlaneGeometry(W, H), fm); front.position.set(0, H / 2, D / 2); front.receiveShadow = true; front.castShadow = true; G.add(front);
  // the body (sides, back, roof): plain plaster; the gable end gets its own canvas (blind, panel joints, stains)
  const side = std({ color: new THREE.Color(o.base || "#d6c6a6").multiplyScalar(0.92), roughness: 0.95 });
  const Gf = T.facade({ W: D, H, GF, FH, BW: D / 4, k: o.gk || 24, seed: (o.seed || 61) + 5, base: o.base || "#d6c6a6", gable: true });
  const gm = std({ map: T.tex(Gf.map), roughness: 0.95 }); gm.map.wrapS = gm.map.wrapT = THREE.ClampToEdgeWrapping;
  const body = new THREE.Mesh(new THREE.BoxGeometry(W - 0.02, H, D - 0.02), [gm, gm, side, side, side, side]); body.position.set(0, H / 2, 0); body.castShadow = body.receiveShadow = true; G.add(body);
  // the roof's parapet (a lip all round) and a few roof things (vent stacks, a lift housing)
  const lip = std({ color: new THREE.Color(o.base || "#d6c6a6").multiplyScalar(0.8), roughness: 0.9 });
  G.add(merged([bgeo(W + 0.1, 0.6, 0.25, 0, H + 0.1, D / 2 - 0.1), bgeo(W + 0.1, 0.6, 0.25, 0, H + 0.1, -D / 2 + 0.1), bgeo(0.25, 0.6, D, -W / 2 + 0.1, H + 0.1, 0), bgeo(0.25, 0.6, D, W / 2 - 0.1, H + 0.1, 0), bgeo(4, 2.6, 3, -W * 0.2, H + 1.3, -1), bgeo(1.2, 1.4, 1.2, W * 0.25, H + 0.7, 1)], lip));
  // balconies: a slab, two side walls, a front parapet; some closed with glazing above the parapet (each owner his own)
  const slabM = std({ color: 0xbdb3a2, roughness: 0.9 }), sg = [];
  const parTex = [0, 1, 2, 3].map((i) => std({ map: T.tex(T.parapet({ seed: (o.seed || 1) * 10 + i, base: ["#d8ccb4", "#c9bfae", "#e0d6c2", "#b9b2a6"][i], kind: i % 2 ? "ribbed" : "concrete" })), roughness: 0.9 }));
  const parG = [[], [], [], []], glazG = [], frmG = [[], [], []];
  const glazM = std({ color: 0x1b2128, roughness: 0.05, metalness: 0.0, envMapIntensity: 1.4 }), frmM = [std({ color: 0xeeeeea, roughness: 0.5 }), std({ color: 0x6b4a32, roughness: 0.6 }), std({ color: 0xa7a9ab, roughness: 0.4, metalness: 0.6 })];
  const acM = std({ color: 0xe8e6e0, roughness: 0.55 }), acG = [];
  const BD = 1.15, PH = 1.05;
  for (let f = 0; f < o.floors; f++) for (const b of balc) {
    const x0 = -W / 2 + b * BW + 0.15, w = BW - 0.3, y0 = GF + f * FH, z0 = D / 2;
    sg.push(bgeo(w, 0.14, BD, x0 + w / 2, y0 + 0.07, z0 + BD / 2));
    sg.push(bgeo(0.1, PH, BD, x0 + 0.05, y0 + 0.14 + PH / 2, z0 + BD / 2), bgeo(0.1, PH, BD, x0 + w - 0.05, y0 + 0.14 + PH / 2, z0 + BD / 2));
    const pi = Math.floor(r() * 4); const pg = new THREE.BoxGeometry(w, PH, 0.08).translate(x0 + w / 2, y0 + 0.14 + PH / 2, z0 + BD - 0.04); parG[pi].push(pg);
    if (r() < 0.55) { // closed: glazing to the slab above, in a frame
      const gh = FH - PH - 0.14 - 0.02, gy = y0 + 0.14 + PH + gh / 2, fi = r() < 0.6 ? 0 : r() < 0.5 ? 1 : 2;
      glazG.push(bgeo(w - 0.1, gh, 0.02, x0 + w / 2, gy, z0 + BD - 0.06));
      frmG[fi].push(bgeo(w, 0.07, 0.07, x0 + w / 2, y0 + 0.14 + PH + 0.035, z0 + BD - 0.05), bgeo(w, 0.07, 0.07, x0 + w / 2, y0 + FH - 0.04, z0 + BD - 0.05));
      for (let m = 0; m <= 3; m++) frmG[fi].push(bgeo(0.06, gh, 0.07, x0 + 0.03 + (m * (w - 0.06)) / 3, gy, z0 + BD - 0.05));
    }
    if (r() < 0.3) acG.push(bgeo(0.8, 0.55, 0.28, x0 + (r() < 0.5 ? 0.6 : w - 0.6), y0 + 0.14 + PH + 0.35, z0 + BD + 0.16));
  }
  // air conditioners on the plain bays' walls too
  for (let f = 0; f < o.floors; f++) for (let b = 0; b < bays; b++) if (!balc.has(b) && r() < 0.16) acG.push(bgeo(0.8, 0.55, 0.28, -W / 2 + b * BW + (r() < 0.5 ? 0.6 : BW - 0.6), GF + f * FH + 0.5, D / 2 + 0.15));
  // the top floor's balconies need a roof: the parapet lip covers it; the bottom floor's slab sits on the shop line
  if (sg.length) G.add(merged(sg, slabM));
  parG.forEach((g, i) => { if (g.length) G.add(merged(g, parTex[i])); });
  if (glazG.length) G.add(merged(glazG, glazM, { cast: false }));
  frmG.forEach((g, i) => { if (g.length) G.add(merged(g, frmM[i])); });
  if (acG.length) G.add(merged(acG, acM));
  G.userData = { W, H, D, GF, FH };
  return G;
}

// ---------- a linden: a trunk, its limbs, a rounded crown of leaf clusters (cards, alpha, instanced) ----------
const leafTex = {}, barkTex = {};
export function linden(o = {}) {
  const r = rng(o.seed || 5), H = o.h || 12, G = new THREE.Group(); G.position.set(o.x || 0, o.y || 0, o.z || 0);
  const ct = H * 0.3, crown = [o.cx ?? 0, H * 0.62, o.cz ?? 0], R = [H * 0.33 * (o.sx || 1), H * 0.36, H * 0.33 * (o.sz || 1)];
  if (!barkTex.m) barkTex.m = std({ map: T.tex(T.bark({}), { rep: [1, 3] }), roughness: 0.95, color: 0xb0a898 });
  const bg = [rod([0, 0, 0], [0, ct, 0], 0.22 * H / 12, 12, 0.17 * H / 12)];
  // limbs: from the trunk's top to clump centres on the crown, with forks
  const clumps = [];
  const NL = 5 + Math.floor(r() * 2);
  for (let l = 0; l < NL; l++) {
    const a = (l / NL) * Math.PI * 2 + r() * 0.6, el = 0.25 + r() * 0.75, end = [crown[0] + Math.cos(a) * R[0] * 0.7 * (1 - el * 0.4), crown[1] + (el - 0.35) * R[1] * 0.9, crown[2] + Math.sin(a) * R[2] * 0.7 * (1 - el * 0.4)];
    const mid = [crown[0] + (end[0] - crown[0]) * 0.45, ct + (end[1] - ct) * 0.55, crown[2] + (end[2] - crown[2]) * 0.45];
    bg.push(rod([0, ct - 0.2, 0], mid, 0.12 * H / 12, 8, 0.08 * H / 12), rod(mid, end, 0.08 * H / 12, 6, 0.035 * H / 12));
    for (let f = 0; f < 3; f++) { const fe = [end[0] + (r() - 0.5) * 2.4, end[1] + (r() - 0.2) * 1.8, end[2] + (r() - 0.5) * 2.4]; bg.push(rod(mid, fe, 0.05 * H / 12, 5, 0.02)); clumps.push(fe); }
    clumps.push(end);
  }
  // more clumps over the crown's shell so it reads as one rounded mass, with gaps
  for (let i = 0; i < 26; i++) { const u = r() * 2 - 1, t = r() * Math.PI * 2, s = Math.sqrt(1 - u * u), q = 0.75 + r() * 0.25; clumps.push([crown[0] + Math.cos(t) * s * R[0] * q, crown[1] + u * R[1] * q * 0.95, crown[2] + Math.sin(t) * s * R[2] * q]); }
  const trunk = new THREE.Mesh(mergeGeometries(bg), barkTex.m); trunk.castShadow = trunk.receiveShadow = true; G.add(trunk);
  const seed = o.leafSeed || 81;
  if (!leafTex[seed]) { const c = T.leafCluster({ seed }); const t = T.tex(c, { rep: [1, 1] }); t.wrapS = t.wrapT = THREE.ClampToEdgeWrapping; leafTex[seed] = { map: t, mat: std({ map: t, alphaTest: 0.45, side: THREE.DoubleSide, roughness: 0.62, color: 0xffffff, envMapIntensity: 0.8 }), depth: new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: t, alphaTest: 0.45, side: THREE.DoubleSide }) }; }
  const per = Math.round((o.per || 110) * 1.7), N = clumps.length * per, card = new THREE.PlaneGeometry(0.46, 0.46);
  const im = new THREE.InstancedMesh(card, leafTex[seed].mat, N); im.customDepthMaterial = leafTex[seed].depth; im.castShadow = true; im.receiveShadow = true;
  const M = new THREE.Matrix4(), Q = new THREE.Quaternion(), E = new THREE.Euler(), P = new THREE.Vector3(), Sc = new THREE.Vector3(), col = new THREE.Color();
  let n = 0;
  for (const c of clumps) for (let i = 0; i < per; i++) {
    const u = r() * 2 - 1, t = r() * Math.PI * 2, s = Math.sqrt(1 - u * u), rr = Math.cbrt(r()) * 1.25;
    P.set(c[0] + Math.cos(t) * s * rr * 1.1, c[1] + u * rr * 0.8, c[2] + Math.sin(t) * s * rr * 1.1);
    // (cards on the outside of the crown face out and up, the light catches them; inner ones darker)
    const out = new THREE.Vector3(P.x - crown[0], (P.y - crown[1]) * 0.7 + 0.5, P.z - crown[2]).normalize();
    E.set(-Math.PI / 2 + (r() - 0.5) * 1.6 + out.y * 0.4, Math.atan2(out.x, out.z) + (r() - 0.5) * 1.2, (r() - 0.5) * 3.14); Q.setFromEuler(E);
    const sc = 0.75 + r() * 0.5; Sc.set(sc, sc, sc); M.compose(P, Q, Sc); im.setMatrixAt(n, M);
    const d = Math.hypot((P.x - crown[0]) / R[0], (P.y - crown[1]) / R[1], (P.z - crown[2]) / R[2]);
    const k = 0.42 + 0.5 * Math.min(1, d) ** 2 + (r() - 0.5) * 0.16; col.setRGB(k * (0.95 + r() * 0.1), k, k * (0.85 + r() * 0.1)); im.setColorAt(n, col);
    n++;
  }
  im.count = n; im.instanceMatrix.needsUpdate = true; if (im.instanceColor) im.instanceColor.needsUpdate = true;
  G.add(im); G.userData = { leaves: im, crown, R };
  return G;
}

// ---------- a 6 x 3 m billboard on a monopole: a steel frame, a catwalk with a railing, lamps on arms ----------
export async function billboard(o) {
  const G = new THREE.Group(); G.position.set(o.x, 0, o.z); G.rotation.y = o.rotY || 0;
  const t = await art(o.art || "6x3"), w = o.w || 6, h = w / ART[o.art || "6x3"].ar, y0 = o.y0 || 6.2, yc = y0 + h / 2;
  const steel = std({ color: 0x8e9296, metalness: 0.75, roughness: 0.45 }), dark = std({ color: 0x3a3d40, metalness: 0.6, roughness: 0.55 }), white = std({ color: 0xe9e9e6, roughness: 0.5 });
  // the pole: a tapered tube on a footing; the head: a truss behind the face
  G.add(merged([cyl(0.34, 0.26, y0 + 0.2, 28).translate(0, (y0 + 0.2) / 2, -0.55)], steel));
  G.add(merged([bgeo(1.1, 0.25, 1.1, 0, 0.12, -0.55)], std({ color: 0x9c978d, roughness: 0.9 })));
  const tg = [bgeo(w - 0.3, 0.12, 0.12, 0, y0 + 0.25, -0.35), bgeo(w - 0.3, 0.12, 0.12, 0, y0 + h - 0.25, -0.35), bgeo(w - 0.3, 0.1, 0.1, 0, yc, -0.35)];
  for (let i = 0; i <= 6; i++) tg.push(bgeo(0.1, h - 0.4, 0.1, -w / 2 + 0.25 + (i * (w - 0.5)) / 6, yc, -0.35));
  tg.push(bgeo(0.3, h - 0.2, 0.3, 0, yc, -0.55));
  G.add(merged(tg, dark));
  // the face: the print stretched on a panel, in a galvanised frame
  const face = new THREE.Mesh(new THREE.PlaneGeometry(w, h), std({ map: t, roughness: 0.72, envMapIntensity: 0.35 })); face.position.set(0, yc, 0.02); face.receiveShadow = true; face.castShadow = true; face.userData.art = true; G.add(face);
  G.add(merged([bgeo(w + 0.24, h + 0.24, 0.16, 0, yc, -0.06)], white));
  const fr = 0.12; G.add(merged([bgeo(w + 2 * fr, fr, 0.12, 0, y0 - fr / 2, 0.02), bgeo(w + 2 * fr, fr, 0.12, 0, y0 + h + fr / 2, 0.02), bgeo(fr, h, 0.12, -w / 2 - fr / 2, yc, 0.02), bgeo(fr, h, 0.12, w / 2 + fr / 2, yc, 0.02)], steel));
  // the catwalk (grating) and its railing, under the face
  const cw = [bgeo(w + 0.4, 0.05, 0.75, 0, y0 - 0.32, 0.36)];
  for (let i = 0; i <= 8; i++) cw.push(bgeo(0.035, 0.95, 0.035, -w / 2 - 0.15 + (i * (w + 0.3)) / 8, y0 - 0.32 + 0.48, 0.7));
  cw.push(bgeo(w + 0.4, 0.04, 0.04, 0, y0 + 0.62, 0.7), bgeo(w + 0.4, 0.03, 0.03, 0, y0 + 0.15, 0.7));
  for (let i = 0; i <= 5; i++) cw.push(bgeo(0.05, 0.05, 0.75, -w / 2 + (i * w) / 5, y0 - 0.36, 0.36));
  G.add(merged(cw, steel));
  // lamps: three arms over the top, each a slim head angled at the face
  const lg = [];
  for (const lx of [-w / 3, 0, w / 3]) { lg.push(...[rod([lx, y0 + h + 0.12, -0.15], [lx, y0 + h + 0.55, 0.9], 0.03, 6)]); lg.push(new THREE.BoxGeometry(0.42, 0.1, 0.26).rotateX(0.5).translate(lx, y0 + h + 0.5, 0.98)); }
  G.add(merged(lg, dark));
  G.userData = { w, h, y0, face };
  return G;
}

// ---------- the tram's overhead line: poles both sides of the median, span wires, the contact wires ----------
export function catenary(o) {
  const G = new THREE.Group(), pole = std({ color: 0x6c7570, metalness: 0.5, roughness: 0.55 }), wire = std({ color: 0x2b2826, metalness: 0.6, roughness: 0.5 }), pg = [], wg = [];
  for (const x of o.poles) for (const z of o.poleZ) { pg.push(cyl(0.13, 0.09, 8.6, 12).translate(x, 4.3, z)); pg.push(cyl(0.15, 0.15, 0.8, 12).translate(x, 0.4, z)); }
  for (const x of o.poles) { wg.push(rod([x, 7.2, o.poleZ[0]], [x, 6.95, (o.poleZ[0] + o.poleZ[1]) / 2], 0.009, 4), rod([x, 6.95, (o.poleZ[0] + o.poleZ[1]) / 2], [x, 7.2, o.poleZ[1]], 0.009, 4)); }
  for (const z of o.tracks) for (const dz of [0, 0.0]) { wg.push(rod([o.x0, 6.3, z + dz], [o.x1, 6.3, z + dz], 0.007, 4)); wg.push(rod([o.x0, 6.75, z], [o.x1, 6.75, z], 0.006, 4)); for (let x = o.x0; x < o.x1; x += 4.5) wg.push(rod([x, 6.3, z], [x, 6.75, z], 0.003, 3)); }
  for (const g of o.extra || []) wg.push(rod(g[0], g[1], g[2] || 0.006, 4)); // (other cables across: phone lines, the trolleybus feeders)
  G.add(merged(pg, pole)); if (o.wires !== false) { const wm = merged(wg, wire); wm.castShadow = true; G.add(wm); }
  return G;
}
// ---------- street lamps: a pole with a curved arm and a flat head ----------
export function lamps(list) {
  const m = std({ color: 0x55595c, metalness: 0.6, roughness: 0.45 }), g = [];
  for (const [x, z, dir] of list) { g.push(cyl(0.11, 0.07, 9, 10).translate(x, 4.5, z)); const tip = [x, 9.2, z + dir * 1.8]; g.push(rod([x, 8.9, z], [x, 9.25, z + dir * 0.9], 0.05, 6), rod([x, 9.25, z + dir * 0.9], tip, 0.045, 6)); g.push(new THREE.BoxGeometry(0.35, 0.12, 0.7).translate(tip[0], tip[1] - 0.05, tip[2] + dir * 0.3)); }
  return merged(g, m);
}

// ---------- a tram: an articulated low-floor car (three sections), cream, a maroon skirt, a window band with pillars,
// glazed doors, a rounded roof edge with the equipment boxes, the pantograph on the middle section ----------
export function tram(o = {}) {
  const G = new THREE.Group(), L = o.L || 30, sec = 3, sl = L / sec, Hh = 3.4, w = 2.4;
  const paint = std({ color: 0xece6d6, roughness: 0.3, metalness: 0.05, envMapIntensity: 1.1 }), red = std({ color: 0x8e2a24, roughness: 0.4, metalness: 0.1 }), glass = std({ color: 0x1a2329, roughness: 0.04, envMapIntensity: 1.6, transparent: true, opacity: 0.42, depthWrite: false }), doorG = std({ color: 0x252d33, roughness: 0.08, envMapIntensity: 1.6 }), inWall = std({ color: 0x77736c, roughness: 0.8 }), seat = std({ color: 0x2c3a4a, roughness: 0.7 }), seen = new THREE.MeshBasicMaterial({ color: new THREE.Color(0.62, 0.7, 0.76) }), dark = std({ color: 0x1d1f21, roughness: 0.7 }), roofM = std({ color: 0xb9b6ae, roughness: 0.55, metalness: 0.3 }), grey = std({ color: 0x55585b, roughness: 0.5, metalness: 0.4 }), bellow = std({ color: 0x232425, roughness: 0.9 });
  const pg = [], rg = [], gg = [], dg = [], tg = [], gr = [], bl = [], dgl = [], iw = [], sg = [], sn = [];
  for (let s = 0; s < sec; s++) {
    const x0 = -L / 2 + s * sl + 0.2, x1 = x0 + sl - 0.4, cx = (x0 + x1) / 2, len = x1 - x0;
    // the body: below the windows, above them (to the roof's round), the roof's rounded edge as two bevels
    pg.push(bgeo(len, 1.05, w, cx, 0.35 + 0.525 + 0.3, 0), bgeo(len, 0.42, w, cx, 2.62 + 0.21, 0), bgeo(len, 0.16, w - 0.24, cx, Hh - 0.02, 0));
    pg.push(new THREE.CylinderGeometry(0.16, 0.16, len, 10, 1).rotateZ(Math.PI / 2).translate(cx, Hh - 0.12, w / 2 - 0.16), new THREE.CylinderGeometry(0.16, 0.16, len, 10, 1).rotateZ(Math.PI / 2).translate(cx, Hh - 0.12, -w / 2 + 0.16));
    rg.push(bgeo(len + 0.01, 0.42, w + 0.02, cx, 0.5, 0));
    gr.push(bgeo(len - 0.6, 0.06, w + 0.03, cx, 0.72, 0));
    // the window band: glass behind, pillars in the body colour; doors (two per section) glazed full height
    // (the window band is hollow: thin glass both sides, the car's inside behind it: the far side's wall, its windows
    // showing the street's light, the seats' backs)
    for (const zs of [1, -1]) gg.push(bgeo(len - 0.1, 1.2, 0.02, cx, 2.02, zs * (w / 2 - 0.02)));
    iw.push(bgeo(len - 0.1, 1.05, 0.04, cx, 0.88, 0), bgeo(len - 0.1, 0.3, w - 0.1, cx, 2.77, 0));
    sn.push(bgeo(len - 0.2, 1.1, 0.02, cx, 2.02, -w / 2 + 0.08));
    for (let px = x0 + 0.6; px < x1 - 0.4; px += 0.85) for (const zs of [0.55, -0.55]) sg.push(bgeo(0.1, 0.62, 0.42, px, 1.62, zs));
    const doors = [cx - len * 0.28, cx + len * 0.28];
    for (const dx of doors) { dgl.push(bgeo(1.3, 2.3, w + 0.03, dx, 1.55, 0)); dg.push(bgeo(0.06, 2.3, w + 0.05, dx, 1.55, 0), bgeo(1.4, 0.08, w + 0.05, dx, 2.72, 0), bgeo(0.08, 2.3, w + 0.05, dx - 0.69, 1.55, 0), bgeo(0.08, 2.3, w + 0.05, dx + 0.69, 1.55, 0)); }
    for (let px = x0 + 0.1; px <= x1 - 0.05; px += 1.25) if (!doors.some((d) => Math.abs(px - d) < 0.8)) for (const zs of [1, -1]) { pg.push(bgeo(0.14, 1.22, 0.06, px, 2.02, zs * (w / 2 - 0.03))); iw.push(bgeo(0.14, 1.1, 0.03, px, 2.02, -w / 2 + 0.1)); }
    tg.push(bgeo(len * 0.45, 0.32, 1.5, cx, Hh + 0.16, 0), bgeo(len * 0.2, 0.22, 1.2, cx + len * 0.32, Hh + 0.1, 0));
    if (s < sec - 1) bl.push(bgeo(0.42, 2.7, w - 0.3, x1 + 0.2, 1.75, 0));
  }
  // the cab ends: a raked windscreen, a dark mask, the lamps
  for (const e of [-1, 1]) {
    const ex = e * (L / 2 - 0.05);
    pg.push(bgeo(0.3, 1.2, w - 0.2, ex - e * 0.02, 1.05, 0));
    gg.push(new THREE.BoxGeometry(0.5, 1.45, w - 0.18).rotateZ(-e * 0.22).translate(ex - e * 0.1, 2.15, 0));
  }
  // the pantograph on the middle section
  tg.push(rod([-0.6, Hh + 0.32, 0], [0.4, Hh + 1.3, 0], 0.03, 4), rod([0.4, Hh + 1.3, 0], [-0.3, Hh + 2.55, 0], 0.025, 4), bgeo(0.12, 0.05, 1.6, -0.3, Hh + 2.6, 0));
  G.add(merged(pg, paint), merged(rg, red), merged(gg, glass, { cast: false }), merged(dgl, doorG), merged(dg, dark), merged(tg, roofM), merged(gr, grey), merged(bl, bellow), merged(iw, inWall), merged(sg, seat), merged(sn, seen, { cast: false }));
  // inside: the lit ceiling (seen through the glass, warm), seat backs, the bogies' shadow under the skirt
  const lit = new THREE.MeshBasicMaterial({ color: new THREE.Color(1.1, 1.0, 0.85) }); G.add(merged([bgeo(L - 1, 0.05, 0.6, 0, Hh - 0.62, 0)], lit, { cast: false }));
  G.add(merged([bgeo(L - 2, 0.3, w - 0.3, 0, 0.18, 0)], dark));
  return G;
}

// ---------- a bus / tram shelter with a backlit citylight at its end ----------
export async function shelter(o) {
  const G = new THREE.Group(); G.position.set(o.x, o.y || 0.16, o.z); G.rotation.y = o.rotY || 0;
  const t = await art(o.art || "tall"), cw = 1.185, ch = cw / ART[o.art || "tall"].ar;
  const alu = std({ color: 0xa9adb1, metalness: 0.85, roughness: 0.3 }), glassM = new THREE.MeshPhysicalMaterial({ color: 0xffffff, roughness: 0.04, metalness: 0, transmission: 0, transparent: true, opacity: 0.12, envMapIntensity: 1.5, depthWrite: false }), roof = std({ color: 0x4a4e52, metalness: 0.5, roughness: 0.4 }), bench = std({ color: 0x8a6a48, roughness: 0.6 });
  const L = o.L || 4.2, D = 1.5, Hh = 2.45;
  // posts, roof, the back glass and a side glass, a bench
  const pg = []; for (const x of [-L / 2, 0, L / 2]) for (const z of [-D / 2]) pg.push(bgeo(0.08, Hh, 0.08, x, Hh / 2, z));
  pg.push(bgeo(L + 0.1, 0.08, 0.08, 0, Hh - 0.04, -D / 2), bgeo(L + 0.1, 0.08, 0.08, 0, 0.12, -D / 2));
  G.add(merged(pg, alu));
  G.add(merged([bgeo(L + 0.5, 0.12, D + 0.5, 0, Hh + 0.06, 0)], roof));
  const gl = new THREE.Mesh(new THREE.PlaneGeometry(L, Hh - 0.3), glassM); gl.position.set(0, Hh / 2 + 0.05, -D / 2 + 0.02); G.add(gl);
  G.add(merged([bgeo(L * 0.6, 0.05, 0.38, -L * 0.1, 0.48, -D / 2 + 0.3), bgeo(0.06, 0.45, 0.3, -L * 0.35, 0.24, -D / 2 + 0.3), bgeo(0.06, 0.45, 0.3, L * 0.15, 0.24, -D / 2 + 0.3)], bench));
  // the citylight: a slim box at the shelter's right end, the print backlit (unlit material: it glows), a glass front
  const cx = L / 2 + 0.05, boxD = 0.16, bw = cw + 0.2, bh = ch + 0.26, by = 0.35 + bh / 2;
  const cl = new THREE.Group(); cl.position.set(cx, 0, 0); cl.rotation.y = -Math.PI / 2 * (o.clTurn ?? 1); G.add(cl);
  cl.add(merged([bgeo(bw, bh, boxD, 0, by, 0), bgeo(0.1, 0.35, 0.1, -bw / 2 + 0.12, 0.175, 0), bgeo(0.1, 0.35, 0.1, bw / 2 - 0.12, 0.175, 0)], alu));
  const kGlow = o.glow ?? 1.25;
  for (const s of [1, -1]) { const p = new THREE.Mesh(new THREE.PlaneGeometry(cw, ch), new THREE.MeshBasicMaterial({ map: t, color: new THREE.Color(kGlow, kGlow, kGlow) })); p.position.set(0, by, s * (boxD / 2 + 0.003)); if (s < 0) p.rotation.y = Math.PI; p.userData.art = true; cl.add(p); }
  // the light it throws on the ground and the glass beside it
  const L1 = new THREE.RectAreaLight(0xfff2dc, o.lightK ?? 6, cw, ch); L1.position.set(0, by, boxD / 2 + 0.01); cl.add(L1);
  const pl = new THREE.PointLight(0xfff0d8, o.pointK ?? 4, 6, 2); pl.position.set(0, by, 0.6); cl.add(pl);
  G.userData = { citylight: cl, cw, ch, by };
  return G;
}

// ---------- a mesh banner on a blind gable: the print on a mesh that sags a little between its ties ----------
export async function gableBanner(o) {
  const t = await art(o.art || "tall"), w = o.w, h = w / ART[o.art || "tall"].ar, G = new THREE.Group(); G.position.set(...o.pos); G.rotation.y = o.rotY || 0;
  const seg = 96, geo = new THREE.PlaneGeometry(w, h, seg, Math.round(seg * h / w)), p = geo.attributes.position;
  // the mesh: pulled by ties along its hems every ~1 m, it bellies a few cm between them, and a slow fold across
  for (let i = 0; i < p.count; i++) { const x = p.getX(i), y = p.getY(i), ex = Math.min(x + w / 2, w / 2 - x), ey = Math.min(y + h / 2, h / 2 - y);
    const belly = 0.05 * Math.min(1, ex / 1.2) * Math.min(1, ey / 1.2) + 0.012 * Math.sin(x * 0.9 + y * 0.35) * Math.min(1, ex / 2) + 0.018 * Math.sin(y * 0.55 + 1.3) * Math.min(1, ex / 3) * Math.min(1, ey / 3);
    const hem = 0.012 * Math.abs(Math.sin((x + w / 2) * Math.PI / 1.0)) * Math.max(0, 1 - ey / 0.5); p.setZ(i, belly + hem); }
  geo.computeVertexNormals();
  const weave = T.tex(T.meshWeave({}), { srgb: false, rep: [w * 12, h * 12] });
  const mat = std({ map: t, roughness: 0.8, envMapIntensity: 0.3, aoMap: null });
  mat.onBeforeCompile = (sh) => { sh.uniforms.weave = { value: weave }; sh.uniforms.wrep = { value: new THREE.Vector2(w * 9, h * 9) };
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nuniform sampler2D weave; uniform vec2 wrep;").replace("#include <map_fragment>", "#include <map_fragment>\n diffuseColor.rgb *= mix(1.0, texture2D(weave, vMapUv * wrep).r, 0.35);"); };
  const m = new THREE.Mesh(geo, mat); m.castShadow = m.receiveShadow = true; m.userData.art = true; G.add(m);
  // the ties: short ropes from the hem's grommets to anchors in the wall, and a steel cable along the top
  const rope = std({ color: 0x2a2a2a, roughness: 0.8 }), rg = [];
  for (let x = -w / 2; x <= w / 2 + 1e-3; x += w / Math.round(w)) for (const y of [-h / 2, h / 2]) rg.push(rod([x, y, 0.02], [x, y + Math.sign(y) * 0.25, -0.12], 0.008, 4));
  for (let y = -h / 2; y <= h / 2 + 1e-3; y += h / Math.round(h)) for (const x of [-w / 2, w / 2]) rg.push(rod([x, y, 0.02], [x + Math.sign(x) * 0.25, y, -0.12], 0.008, 4));
  rg.push(rod([-w / 2 - 0.4, h / 2 + 0.3, -0.1], [w / 2 + 0.4, h / 2 + 0.3, -0.1], 0.012, 6));
  const rm = merged(rg, rope); G.add(rm);
  G.userData = { w, h, mesh: m };
  return G;
}
