// Cromatic · hero car (TASK-112): the map's side of the test frames. Opens a local copy of the stories-lottie build
// (?map&story, window.__story) in Playwright, injects Lia's page-render.js (__R) and, for each test shot, writes:
//   <shot>-before.png  the frame as the stories have it (the map's Dacia 1300 parked in it)
//   <shot>-plate.png   the same frame without the car (and without its shadow): the plate the hero car goes over
//   <shot>.json        the camera (matrixWorld, projectionMatrix), the car's world matrix (with the city's warp),
//                      the sun / hemisphere / renderer numbers, so the hero render matches the plate
//   BASE=http://localhost:8991 OUT=... node capture.mjs
import pw from "/Users/daniel.stoic/node_modules/playwright/index.mjs";
import fs from "fs";
const BASE = process.env.BASE || "http://localhost:8991", OUT = process.env.OUT || "./raw";
const PAGE = process.env.PAGE_RENDER || "/Users/daniel.stoic/cromatic-stories-lottie/design/stories/lottie/_source/page-render.js";
fs.mkdirSync(OUT, { recursive: true });
// the two shots of story A v5 (shots4.mjs on stories-lottie): the ride from straight above (A5.ride, at 2x), and the
// street at Steam with the ride parked on the right (SHOTS4["a4-street"])
export const SHOTS = {
  top: { cam: { pos: [842, 350, 5520], tgt: [842, 0, 5520.5], fov: 31.4, w: 2160, h: 3840, level: false }, park: [842, 1.73, 5520, 0] },
  steam: { cam: { pos: [790, 9, 5440], tgt: [945, 14, 5640], fov: 60, shift: [0, 0.13], level: true, w: 2592, h: 3840 }, park: [842, null, 5545, 0] }
};
const br = await pw.chromium.launch({ args: ["--use-angle=metal", "--ignore-gpu-blocklist"] });
const ctx = await br.newContext({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
await ctx.route(/google-analytics|analytics\.google|googletagmanager|doubleclick|facebook|openai/, (r) => r.fulfill({ status: 204, body: "" }));
await ctx.addInitScript(() => { const pre = { "cz-drive-guide": "2", "cz-welcome-at": String(Date.now()), "cz-map-guide": "1", "cz-intro-at": String(Date.now()), "cz-consent": "no", "cz-sound": "0" }; try { for (const k in pre) localStorage.setItem(k, pre[k]); } catch {} });
const p = await ctx.newPage();
p.on("pageerror", (e) => console.log("pageerror", e.message));
await p.goto(BASE + "/?map&story", { waitUntil: "domcontentloaded" });
await p.waitForFunction(() => window.__nav2 && window.__nav2.D && window.__nav2.D.ready, null, { timeout: 180000 });
await p.waitForTimeout(2500);
await p.addScriptTag({ content: fs.readFileSync(PAGE, "utf8") });
await p.evaluate(() => { const S = window.__story; S.state.weatherOn = false; if (S.state.vehicleId !== "dacia1300") window.__api.setVehicle("dacia1300"); });
await p.waitForTimeout(1500);
const save = (url, f) => fs.writeFileSync(f, Buffer.from(url.split(",")[1], "base64"));
for (const [name, sh] of Object.entries(process.env.SHOT ? Object.fromEntries([[process.env.SHOT, SHOTS[process.env.SHOT]]]) : SHOTS)) {
  const o = sh.cam;
  await p.evaluate((o) => { window.__cam(o.pos, o.tgt); window.__camSnap(); }, o);
  await p.waitForTimeout(2500);
  const r = await p.evaluate(({ o, park }) => {
    const S = window.__story, R = window.__R, cam = S.camera, V = cam.position.constructor;
    const out = {};
    R.park(park);
    try {
      R.plan(o); R.shot({ ...o, keepBg: true, shadowUpdate: true }); out.before = R.shot({ ...o, keepBg: true });
      // the car's numbers while it is parked
      const g = S.veh().group; g.updateMatrixWorld(true);
      const c = g.position.clone(), wc = R.W([c.x, c.y, c.z]), J = [];
      for (const d of [[10, 0, 0], [0, 0, 10]]) { const q = R.W([c.x + d[0], c.y, c.z + d[2]]); J.push([(q.x - wc.x) / 10, (q.z - wc.z) / 10]); }
      let bb = null; g.traverse((m) => { if (m.isMesh && m.visible && m.geometry) { if (!m.geometry.boundingBox) m.geometry.computeBoundingBox(); const b = m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld); bb = bb ? bb.union(b) : b; } });
      out.car = { matrixWorld: g.matrixWorld.elements.slice(), pos: c.toArray(), scale: g.scale.toArray(), warped: wc.toArray(), jac: J, bbox: bb ? [bb.min.toArray(), bb.max.toArray()] : null };
    } finally { R.park(null); }
    R.park([9000, null, 9000, 0]);
    try { R.plan(o); R.shot({ ...o, keepBg: true, shadowUpdate: true }); out.plate = R.shot({ ...o, keepBg: true }); } finally { R.park(null); }
    R.setCam(o);
    out.camera = { matrixWorld: cam.matrixWorld.elements.slice(), projection: cam.projectionMatrix.elements.slice(), near: cam.near, far: cam.far, fov: cam.fov, pos: cam.position.toArray() };
    const lights = []; S.scene.traverse((x) => { if (x.isLight && x.visible) { const L = { type: x.type, color: x.color.getHexString(), intensity: x.intensity, pos: x.getWorldPosition(new V()).toArray() }; if (x.groundColor) L.ground = x.groundColor.getHexString(); if (x.target) L.target = x.target.getWorldPosition(new V()).toArray(); if (x.castShadow && x.shadow) L.shadow = { radius: x.shadow.radius, bias: x.shadow.bias, mapSize: x.shadow.mapSize.toArray() }; lights.push(L); } });
    const Rn = S.renderer;
    out.render = { toneMapping: Rn.toneMapping, exposure: Rn.toneMappingExposure, colorSpace: Rn.outputColorSpace, fog: S.scene.fog ? { color: S.scene.fog.color.getHexString(), near: S.scene.fog.near, far: S.scene.fog.far, density: S.scene.fog.density } : null, env: !!S.scene.environment };
    out.lights = lights;
    window.__R.setCam({ ...o }); // (restore is the loop's job: it re-aims every frame)
    return out;
  }, { o, park: sh.park });
  // the city round the car (the car away), six faces of 90 degrees from the middle of where it stands, for the hero
  // car's environment (the reflections of the street, the buildings, the sky; see envmap.mjs)
  const env = await p.evaluate(({ c }) => {
    const S = window.__story, R = window.__R, cam = S.camera, faces = {};
    const D = { px: [1, 0, 0.0001], nx: [-1, 0, 0.0001], py: [0, 1, 0.0001], ny: [0, -1, 0.0001], pz: [0.0001, 0, 1], nz: [0.0001, 0, -1] };
    R.park([9000, null, 9000, 0]);
    try {
      for (const [k, d] of Object.entries(D)) {
        const o = { pos: c, tgt: [c[0] + d[0] * 50, c[1] + d[1] * 50, c[2] + d[2] * 50], fov: 90, w: 768, h: 768, level: false, near: 0.5 };
        R.plan(o); const url = R.shot({ ...o, keepBg: true, shadowUpdate: k === "px" });
        R.setCam(o); faces[k] = { url, matrixWorld: cam.matrixWorld.elements.slice(), projection: cam.projectionMatrix.elements.slice() };
      }
    } finally { R.park(null); }
    return faces;
  }, { c: [sh.park[0], 9, sh.park[2]] });
  for (const [k, f] of Object.entries(env)) { save(f.url, `${OUT}/${name}-env-${k}.png`); delete f.url; }
  r.env = env;
  save(r.before, `${OUT}/${name}-before.png`); save(r.plate, `${OUT}/${name}-plate.png`);
  delete r.before; delete r.plate;
  fs.writeFileSync(`${OUT}/${name}.json`, JSON.stringify({ shot: sh, ...r }, null, 1));
  console.log(name, JSON.stringify(r.car), JSON.stringify(r.lights).slice(0, 600), JSON.stringify(r.render));
}
await br.close();
