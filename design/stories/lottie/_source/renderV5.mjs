// Cromatic · stories in Lottie · v5 (TASK-065d): the renders that change after Daniel's notes on v4, through the
// harness (harness.mjs on :8962, PATH0="/?map&story"). LOCAL ONLY. Writes big PNGs and the shots' numbers to RAW.
//   JOB=a5 node renderV5.mjs     A: OMA from further away, its glass lit warm (and the arches' outlines), the dome
//   JOB=c5 node renderV5.mjs     C: see chase5.mjs (SHOT=... to redo some)
import fs from "fs";
import { A6, omaArches } from "./shots5.mjs";
import { SHOTS as S5, ORDER5, STEAM_SIGN } from "./chase5.mjs";
const job = process.env.JOB, RAW = process.env.RAW || "/private/tmp/claude-501/-Users-daniel-stoic/8f3b4503-769c-4f86-ba4b-8e36528128b3/scratchpad/stl4/raw";
fs.mkdirSync(RAW + "/v5", { recursive: true });
const D = new URL(".", import.meta.url).pathname;
const head = `
const H = await import("${D}lib-harness.mjs?" + Date.now());
await H.inject(p, true);
const RAW = "${RAW}/v5";
const save = (url, f) => { fs.writeFileSync(f, Buffer.from(url.split(",")[1], "base64")); return f; };
const scheme = async (w) => { const cur = await p.evaluate(() => window.__story.schemes[window.__story.state.schemeIdx].id); if (cur !== w) { await p.evaluate((w) => window.__scheme(w), w); await p.waitForTimeout(6500); } await p.evaluate(() => { window.__story.state.weatherOn = false; }); };
const force = "for (let o = x; o; o = o.parent) { if (o === window.__story.veh().group) return 'car'; if (o === window.__story.cop().group) return 'cop'; } return null;";
// a plate: the ride and the police far away, the near cloud bank off; before(): a change to the scene for this shot
// only (undone by after())
const plate = async (name, o, { before = "", after = "", park = [9000, null, 9000, 0] } = {}) => {
  await H.aim(p, o, 2500);
  const u = await p.evaluate(({ o, before, after, park }) => { const S = window.__story, R = window.__R, FC = S.farClouds, fv = FC && FC.visible; if (FC) FC.visible = false; R.park(park); const ctx = {}; if (before) new Function("S", "ctx", before)(S, ctx);
    try { R.plan(o); R.shot({ ...o, keepBg: true, shadowUpdate: true }); return R.shot({ ...o, keepBg: true }); } finally { if (after) new Function("S", "ctx", after)(S, ctx); R.park(null); if (FC) FC.visible = fv; } }, { o, before, after, park });
  return save(u, RAW + "/" + name + ".png");
};
`;
const JOBS = {};
JOBS.a5 = `
await scheme("monument");
const A6 = ${JSON.stringify(A6)}, arches = ${JSON.stringify(omaArches())}, out = {};
// OMA: its mirror glass turned into a lit room's glow (warm, matte), for this plate only
await plate("a5-oma", A6.oma, {
  before: "const m = S.mats.omaGlow; ctx.m = { c: m.color.getHex(), e: m.emissive.getHex(), ei: m.emissiveIntensity, me: m.metalness, ro: m.roughness, env: m.envMapIntensity }; m.color.setHex(0x3a2412); m.emissive.setHex(0xffb35c); m.emissiveIntensity = 0.62; m.metalness = 0; m.roughness = 1; m.envMapIntensity = 0; m.needsUpdate = true;",
  after: "const m = S.mats.omaGlow, k = ctx.m; m.color.setHex(k.c); m.emissive.setHex(k.e); m.emissiveIntensity = k.ei; m.metalness = k.me; m.roughness = k.ro; m.envMapIntensity = k.env; m.needsUpdate = true;" });
out.arches = arches.map((a) => null);
for (let i = 0; i < arches.length; i++) out.arches[i] = (await p.evaluate(({ o, pts }) => window.__R.project(o, pts), { o: A6.oma, pts: arches[i] })).pts;
await plate("a5-scf", A6.scf);
fs.writeFileSync(RAW + "/a5.json", JSON.stringify(out));
return { arches: out.arches.map((a) => a.length) };
`;

{
  // ---- C v5: the new shots as renderC4 (the plate, then each car alone at every frame of 30, a 180-degree shutter),
  // the Aesthetic Court's plate, Steam's plate with its blade sign, the side window's cup
  const FPS = 30, SUB = 4, SHUT = 1 / 60, want = process.env.SHOT ? process.env.SHOT.split(",") : [...ORDER5, "steam"];
  const jobs = {};
  for (const k of want) {
    const S = S5[k], cam = S.cam, w = Math.round((2160 * (cam.wide || 1)) / 2) * 2, o = { ...cam, w, h: 3840 };
    const frames = [];
    if (k !== "steam") for (let i = 0; i <= Math.round(S.dur * FPS); i++) { const t = i / FPS, fn = S.pose || S.yellow; frames.push({ t, yellow: Array.from({ length: SUB }, (_, j) => fn(t - SHUT / 2 + ((j + 0.5) / SUB) * SHUT)), cop: [] }); }
    jobs[k] = { o, frames, glassOff: !!S.glassOff, sign: k === "steam" };
  }
  // the TWO MIN mark as an SVG path (tm-marks.json), for the cup's sleeve
  const MK = JSON.parse(fs.readFileSync(D + "tm-marks.json", "utf8")).twoMin;
  const svgPath = MK.paths.map((q) => { const n = q.v.length; let d = "M" + q.v[0].join(" "); for (let j = 0; j < n; j++) { const a = q.v[j], b = q.v[(j + 1) % n], oa = q.o[j], ib = q.i[(j + 1) % n]; d += "C" + [a[0] + oa[0], a[1] + oa[1], b[0] + ib[0], b[1] + ib[1], b[0], b[1]].join(" "); } return d + "Z"; }).join("");
  const LOGO = "data:image/png;base64," + fs.readFileSync(process.env.LOGO || "/Users/daniel.stoic/cromatic-ops/refs/stories-lottie/v4/steam-logo-original.png").toString("base64");
  JOBS.c5 = `
await scheme("nightlife");
await p.evaluate(() => { if (window.__story.state.vehicleId !== "dacia1300") window.__api.setVehicle("dacia1300"); });
await p.waitForTimeout(1500);
const jobs = ${JSON.stringify(jobs)}, SIGN = ${JSON.stringify(STEAM_SIGN)}, MARK = { d: ${JSON.stringify(svgPath)}, w: ${MK.w}, h: ${MK.h} }, LOGO = ${JSON.stringify(LOGO)};
// three's classes, borrowed from what the scene already has
await p.evaluate(() => { const S = window.__story; if (S.K3) return; const K = { Mesh: S.sky.constructor, Group: S.veh().group.constructor }; S.scene.traverse((x) => { if (x.geometry && !K[x.geometry.type]) K[x.geometry.type] = x.geometry.constructor; const m = x.material && (Array.isArray(x.material) ? x.material[0] : x.material); if (m && !K[m.type]) K[m.type] = m.constructor; if (m && m.map && m.map.isCanvasTexture && !K.CanvasTexture) K.CanvasTexture = m.map.constructor; }); S.K3 = K; });
// Steam's blade sign: a bracket off the wall, the lit box under it (both faces the logo), made once, shown for its plate
await p.evaluate(async ({ SIGN, LOGO }) => { const S = window.__story, K = S.K3; if (S.steamBlade) return;
  const im = new Image(); im.src = LOGO; await im.decode();
  const cv = document.createElement("canvas"); cv.width = 512; cv.height = 640; const c = cv.getContext("2d"); c.fillStyle = "#ffffff"; c.fillRect(0, 0, 512, 640); const k = Math.min(440 / im.width, 560 / im.height); c.drawImage(im, 256 - (im.width * k) / 2, 320 - (im.height * k) / 2, im.width * k, im.height * k);
  const tex = new K.CanvasTexture(cv); tex.colorSpace = S.renderer.outputColorSpace; tex.anisotropy = 8;
  const face = new K.MeshStandardMaterial({ map: tex, emissiveMap: tex, emissive: 0xffffff, emissiveIntensity: 0.95, roughness: 0.6 });
  const side = new K.MeshStandardMaterial({ color: 0xffffff, emissive: 0xfff6ea, emissiveIntensity: 0.55, roughness: 0.5 });
  const iron = new K.MeshStandardMaterial({ color: 0x1b1b1d, roughness: 0.45, metalness: 0.6 });
  const g = new K.Group(), [bw, bh, bd] = SIGN.box, [wx, wy, wz] = SIGN.wall;
  // (the box's faces along z: the street sees them as it comes up or down it; x runs out from the wall, -x)
  const box = new K.Mesh(new K.BoxGeometry(bw, bh, bd), [side, side, side, side, face, face]); box.position.set(-SIGN.out / 2 - 1, -bh / 2 - 1.6, 0);
  const arm = new K.Mesh(new K.BoxGeometry(SIGN.out + 1, 0.7, 0.7), iron); arm.position.set(-(SIGN.out + 1) / 2, 0, 0);
  const plate = new K.Mesh(new K.BoxGeometry(0.6, 4.2, 2.4), iron); plate.position.set(-0.3, -1.2, 0);
  const brace = new K.Mesh(new K.BoxGeometry(Math.hypot(5, 4.5), 0.5, 0.5), iron); brace.position.set(-2.5, -2.2, 0); brace.rotation.z = Math.atan2(4.5, 5);
  for (const hx of [-SIGN.out / 2 - 1 - bw / 2 + 1.4, -SIGN.out / 2 - 1 + bw / 2 - 1.4]) { const h = new K.Mesh(new K.BoxGeometry(0.25, 1.6, 0.25), iron); h.position.set(hx, -0.8, 0); g.add(h); }
  g.add(box, arm, plate, brace); g.position.set(wx, wy, wz); g.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  g.visible = false; S.scene.add(g); S.steamBlade = g; }, { SIGN, LOGO });
// the cup: white paper with the TWO MIN mark round it, a black lid, in the car's units (it is a child of the car)
await p.evaluate(async ({ MARK, SC }) => { const S = window.__story, K = S.K3, v = S.veh(); if (v.cup) return;
  const cv = document.createElement("canvas"); cv.width = 1024; cv.height = 256; const c = cv.getContext("2d"); c.fillStyle = "#f7f3ea"; c.fillRect(0, 0, 1024, 256);
  const P = new Path2D(MARK.d), k = 150 / MARK.h; for (const x0 of [140, 652]) { c.save(); c.translate(x0, 53); c.scale(k, k); c.fillStyle = "#111111"; c.fill(P); c.restore(); }
  const tex = new K.CanvasTexture(cv); tex.colorSpace = S.renderer.outputColorSpace;
  const u = 1 / SC, g = new K.Group();
  const paper = new K.MeshStandardMaterial({ map: tex, roughness: 0.7 }), cap = new K.MeshStandardMaterial({ color: 0xece6da, roughness: 0.8 }), lidM = new K.MeshStandardMaterial({ color: 0x141414, roughness: 0.35 });
  const body = new K.Mesh(new K.CylinderGeometry(0.56 * u, 0.42 * u, 1.55 * u, 28, 1, true), paper);
  const bottom = new K.Mesh(new K.CylinderGeometry(0.42 * u, 0.42 * u, 0.02 * u, 24), cap); bottom.position.y = -0.775 * u;
  const lid = new K.Mesh(new K.CylinderGeometry(0.58 * u, 0.6 * u, 0.12 * u, 28), lidM); lid.position.y = 0.82 * u;
  const dome = new K.Mesh(new K.CylinderGeometry(0.4 * u, 0.56 * u, 0.14 * u, 28), lidM); dome.position.y = 0.95 * u;
  g.add(body, bottom, lid, dome); g.traverse((m) => { if (m.isMesh) m.castShadow = false; }); g.visible = false; v.group.add(g); v.cup = g; }, { MARK, SC: ${0.5702479338842975} });
const res = {};
for (const [k, J] of Object.entries(jobs)) {
  const o = { ...J.o, forceSrc: force, occlude: true };
  await H.aim(p, o, 2200);
  const pl = await p.evaluate(({ o, sign }) => { const S = window.__story, R = window.__R; S.cop().group.visible = true; R.park([9000, null, 9000, 0]); S.cop().group.position.set(9200, 1.7, 9200); S.cop().group.updateMatrixWorld(true); if (sign) S.steamBlade.visible = true;
    try { R.plan(o); R.shot({ ...o, keepBg: true, shadowUpdate: true }); return R.shot({ ...o, keepBg: true }); } finally { R.park(null); if (sign) S.steamBlade.visible = false; S.cop().group.visible = false; } }, { o, sign: J.sign });
  save(pl, RAW + "/c5-" + k + "-plate.png");
  if (J.sign) { res[k] = (await p.evaluate(({ o, SIGN }) => window.__R.project(o, [SIGN.wall, [SIGN.wall[0] - SIGN.out / 2 - 1, SIGN.wall[1] - 7.8, SIGN.wall[2]]]), { o: J.o, SIGN })).pts; continue; }
  const out = { o: J.o, sprites: { yellow: [], cop: [] } };
  await p.evaluate(({ o, glassOff }) => { const S = window.__story; window.__R.keyLight(o, true); if (glassOff) S.veh().group.traverse((m) => { if (m.isMesh && m.material && !Array.isArray(m.material) && m.material.transparent && m.material.color && m.material.color.getHexString() === "22343f") { m.userData.wasVis = m.visible; m.visible = false; S.glassOffM = m; } }); }, { o, glassOff: J.glassOff });
  try {
    for (let i = 0; i < J.frames.length; i++) {
      const r = await p.evaluate(({ o, sub }) => { const S = window.__story; S.veh().beams && (S.veh().beams.visible = true); return window.__R.carShot(o, "car", sub); }, { o, sub: J.frames[i].yellow });
      if (!r) { out.sprites.yellow.push(null); continue; }
      save(r.url, RAW + "/c5-" + k + "-yellow-" + String(i).padStart(3, "0") + ".png"); out.sprites.yellow.push(r.rect);
    }
  } finally { await p.evaluate(() => { const S = window.__story; window.__R.keyLight(null, false); if (S.glassOffM) { S.glassOffM.visible = true; S.glassOffM = null; } if (S.veh().cup) S.veh().cup.visible = false; }); }
  fs.writeFileSync(RAW + "/c5-" + k + ".json", JSON.stringify(out));
  res[k] = out.sprites.yellow.filter(Boolean).length;
}
return res;
`;
}
// ---- D2: the Fintech skyline from the west, wide (the frame pans across it), and where the map's tags go
JOBS.d2b = `
await scheme("monument");
const o = { pos: [1350, 55, 4840], tgt: [2100, 80, 4840], fov: 62, shift: [0, 0.06], level: true, w: 3456, h: 3840 };
const tags = ${JSON.stringify({ Assetto: [2215, 92, 4760], Investimental: [2205, 120, 4500], Venevo: [1988, 70, 5160], Longshield: [1988, 96, 4880], "Infinity Capital": [1988, 90, 4600] })};
await plate("d2-skyline-wide", o);
const r = await p.evaluate(({ o, pts }) => window.__R.project(o, pts), { o, pts: Object.values(tags) });
const out = { o, tags: Object.fromEntries(Object.keys(tags).map((k, i) => [k, r.pts[i]])) };
fs.writeFileSync(RAW + "/d2-skyline-wide.json", JSON.stringify(out));
return out.tags;
`;
if (!JOBS[job]) throw new Error("JOB=" + Object.keys(JOBS).join("|"));
const t0 = Date.now();
const r = await fetch("http://localhost:8962/", { method: "POST", body: head + JOBS[job] });
console.log(r.status, (await r.text()).slice(0, 2000), ((Date.now() - t0) / 1000).toFixed(1) + " s");
