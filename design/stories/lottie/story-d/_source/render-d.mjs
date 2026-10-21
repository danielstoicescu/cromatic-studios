// Cromatic · stories in Lottie · story D (TASK-066): the renders, sent to story D's harness (harness.mjs on :8992, the
// local build on :8991 opened with ?map&story) as the body of an async function. For each shot of shots-d.mjs: its
// world, its ride, the plate (and its other lenses), the ride alone where it moves (sprites: each pose a subframe of a
// 180-degree shutter), the rectangles the words lie on (a ray into the frame, or straight down onto the road), the
// lamps and bulbs that glow, and the numbers build-d.mjs needs. RAW: big PNGs, scratch only (plates-d.mjs packs them).
//   SHOT=over,yoshi,... node render-d.mjs        (no SHOT: all of them)
import fs from "fs";
import { SHOTS, ringAt } from "./shots-d.mjs";
const RAW = process.env.RAW || "/private/tmp/claude-501/-Users-daniel-stoic/307623b0-7c3c-4b30-b2d7-c12e0dda2036/scratchpad/sd/raw";
const D = new URL(".", import.meta.url).pathname;
const ids = (process.env.SHOT || Object.keys(SHOTS).join(",")).split(",");
fs.mkdirSync(RAW, { recursive: true });
const FPS = 30, SUB = 4, SHUT = 1 / 60;
// the passes (a ride round the ring): per frame of 30, SUB subframes over the open shutter (angles; y is the ride's own)
const passes = {};
for (const id of ids) {
  const s = SHOTS[id], ps = s.pass; if (!ps) continue;
  const dur = ps.frames / FPS, aOf = (t) => ps.from + (ps.to - ps.from) * (t / dur);
  passes[id] = Array.from({ length: ps.frames }, (_, i) => { const t = i / FPS; return { t, sub: Array.from({ length: SUB }, (_, k) => { const tt = t - SHUT / 2 + ((k + 0.5) / SUB) * SHUT; return ringAt(aOf(tt)); }), mid: ringAt(aOf(t)) }; });
}
const body = `
const H = await import("${D}lib-harness.mjs?" + Date.now());
await H.inject(p, true);
await p.addScriptTag({ content: fs.readFileSync("${D}d-page.js", "utf8") });
const SHOTS = ${JSON.stringify(Object.fromEntries(ids.map((k) => [k, SHOTS[k]])))}, passes = ${JSON.stringify(passes)}, RAW = "${RAW}";
const save = (url, f) => { fs.writeFileSync(f, Buffer.from(url.split(",")[1], "base64")); return f; };
const scheme = async (id) => { const cur = await p.evaluate(() => window.__story.schemes[window.__story.state.schemeIdx].id); if (cur !== id) { await p.evaluate((id) => window.__scheme(id), id); await p.waitForTimeout(7000); } };
const force = "for (let o = x; o; o = o.parent) { if (o === window.__story.veh().group) return 'car'; if (window.__story.cop() && o === window.__story.cop().group) return 'cop'; } return null;";
const report = {};
for (const [id, s] of Object.entries(SHOTS)) {
  const t0 = Date.now();
  await scheme(s.scheme);
  await p.evaluate(() => { const S = window.__story; S.state.weatherOn = false; if (S.cop()) S.cop().group.visible = false; });
  if (s.veh) await p.evaluate((v) => window.__D.veh(v), s.veh);
  const o = { ...s.cam, forceSrc: force };
  await H.aim(p, o, 2500);
  const out = { id, o: s.cam, lenses: [] };
  // the plate(s): the ride parked where the shot wants it, or far away; its beams (the map's cones) off
  const lens = [s.cam.fov, ...(s.lenses || [])];
  const parkAt = s.away ? [5000, null, 5000, 0] : s.park || null;
  for (let i = 0; i < lens.length; i++) {
    // (the clouds off: seen from under them, low, they are flat pale wedges; nosky: the sky left out, transparent, for
    // a sky of the story's own)
    const url = await p.evaluate(({ o, parkAt, nosky }) => { const S = window.__story, R = window.__R, v = S.veh(), bv = v && v.beams && v.beams.visible, hid = [];
      S.scene.traverse((x) => { if (x.visible && (x === S.farClouds || (x.material && x.material === S.mats.cloud) || (nosky && x === S.sky))) { x.visible = false; hid.push(x); } });
      if (v && v.beams) v.beams.visible = false; if (parkAt) R.park(parkAt);
      try { R.shot({ ...o, keepBg: true, shadowUpdate: true }); return R.shot({ ...o, keepBg: !nosky }); } finally { if (parkAt) R.park(null); if (v && v.beams) v.beams.visible = bv; hid.forEach((x) => (x.visible = true)); } }, { o: { ...o, fov: lens[i] }, parkAt, nosky: !!s.nosky });
    save(url, RAW + "/" + id + "-L" + i + ".png"); out.lenses.push(lens[i]);
  }
  // the camera's numbers and the named points
  const names = Object.keys(s.pts || {});
  const pr = await p.evaluate(({ o, pts }) => window.__R.project(o, pts), { o, pts: names.map((k) => s.pts[k]) });
  out.f = pr.f; out.horizon = pr.horizon; out.camY = pr.camY; out.pts = Object.fromEntries(names.map((k, i) => [k, pr.pts[i]]));
  // the words' rectangles
  out.marks = {};
  for (const m of [...(s.marks || []), ...(s.ground || [])]) {
    out.marks[m.name] = await p.evaluate(({ o, m }) => {
      const Dd = window.__D; let h;
      if (m.c) { const d = Dd.down(m.c[0], m.c[1]); h = d && { p: d.p, n: [0, 1, 0] }; }
      else if (m.p) h = { p: m.p, n: m.n };
      else h = Dd.hit(o, [m.uv])[0];
      if (!h) return null;
      // ax "right": the rows run along the camera's right on the ground (the words read across the frame, upright)
      const fx = o.tgt[0] - o.pos[0], fz = o.tgt[2] - o.pos[2], fl = Math.hypot(fx, fz), ax = m.ax === "right" ? [-fz / fl, 0, fx / fl] : m.ax;
      return { hit: h, ...Dd.quad(o, h.p, m.n || h.n, m.w, m.h, { align: m.align || (m.c ? [0.5, 0.5] : [0, 1]), ax }) };
    }, { o, m });
  }
  // the lamps and bulbs that glow at night (the festoon's bulbs, the fountain's globes)
  out.glows = await p.evaluate((o) => { const S = window.__story, pts = [], M = S.camera.matrixWorld.constructor, V = S.camera.position.constructor, m = new M();
    S.scene.traverse((x) => { const mt = x.material; if (!mt || !mt.emissive || mt.emissive.getHexString() !== "ffca6a") return; let vis = true; for (let q = x; q; q = q.parent) if (!q.visible) vis = false; if (!vis) return;
      if (x.isInstancedMesh) { for (let i = 0; i < x.count; i++) { x.getMatrixAt(i, m); m.premultiply(x.matrixWorld); pts.push(new V().setFromMatrixPosition(m).toArray()); } }
      else if (x.isMesh && x.geometry && x.geometry.type === "SphereGeometry") pts.push(new V().setFromMatrixPosition(x.matrixWorld).toArray()); });
    const pr = window.__R.project(o, pts); return pr.pts.filter((q) => q[2] < 1 && q[0] > -200 && q[0] < o.w + 200 && q[1] > -200 && q[1] < o.h + 200); }, o);
  // the ride alone: the overhead's three rides (top down, at the fountain), a single sprite, or a pass round the ring
  const y0 = await p.evaluate(() => window.__story.veh().group.position.y);
  const spriteOf = async (poses) => p.evaluate(({ o, poses }) => { const R = window.__R, v = window.__story.veh(), bv = v.beams.visible; v.beams.visible = false; try { R.park([5000, null, 5000, 0]); R.plan(o); return R.carShot(o, "car", poses, { margin: 12 }); } finally { R.park(null); v.beams.visible = bv; } }, { o, poses });
  out.sprites = {};
  if (s.rideSprites) for (const r of s.rideSprites) {
    await p.evaluate((v) => window.__D.veh(v), r);
    const y = await p.evaluate(() => window.__story.veh().group.position.y);
    const sp = await spriteOf([{ x: 1500, y, z: 4260, yaw: 0 }]);
    save(sp.url, RAW + "/" + id + "-" + r + ".png");
    const c = await p.evaluate(({ o, y }) => window.__R.project(o, [[1500, y, 4260], [1500, y, 4280]]), { o, y });
    out.sprites[r] = { rect: sp.rect, c: c.pts[0], ahead: c.pts[1] };
  }
  if (s.sprite) {
    const a = s.sprite.at, y = a[1] ?? y0;
    const sp = await spriteOf([{ x: a[0], y, z: a[2], yaw: a[3] }]);
    save(sp.url, RAW + "/" + id + "-ride.png");
    // (and its headlamps, about where they are on a ride ~50 long: for the glows)
    const fw = [Math.sin(a[3]), Math.cos(a[3])], rt = [Math.cos(a[3]), -Math.sin(a[3])];
    const c = await p.evaluate(({ o, pts }) => window.__R.project(o, pts), { o, pts: [[a[0], y, a[2]], [a[0], y, a[2] + 20], [a[0] + fw[0] * 22 + rt[0] * 8, y + 4, a[2] + fw[1] * 22 + rt[1] * 8], [a[0] + fw[0] * 22 - rt[0] * 8, y + 4, a[2] + fw[1] * 22 - rt[1] * 8]] });
    out.sprites.ride = { rect: sp.rect, c: c.pts[0], ahead: c.pts[1], lamps: [c.pts[2], c.pts[3]], y };
  }
  if (s.pass) {
    const fr = passes[id]; out.pass = [];
    for (let i = 0; i < fr.length; i++) {
      const sub = fr[i].sub.map((q) => ({ x: q.x, y: y0, z: q.z, yaw: q.yaw }));
      const sp = await spriteOf(sub);
      if (sp) save(sp.url, RAW + "/" + id + "-pass-" + String(i).padStart(3, "0") + ".png");
      const q = fr[i].mid, fw = [Math.sin(q.yaw), Math.cos(q.yaw)], rt = [Math.cos(q.yaw), -Math.sin(q.yaw)];
      const pts = [[q.x, y0 + 4, q.z], [q.x + fw[0] * 18 + rt[0] * 6, 4, q.z + fw[1] * 18 + rt[1] * 6], [q.x + fw[0] * 18 - rt[0] * 6, 4, q.z + fw[1] * 18 - rt[1] * 6], [q.x + fw[0] * 60, 0, q.z + fw[1] * 60], [q.x, 0, q.z]];
      const pp = await p.evaluate(({ o, pts }) => window.__R.project(o, pts), { o, pts });
      out.pass.push({ t: fr[i].t, rect: sp && sp.rect, mid: pp.pts[0], lamps: [pp.pts[1], pp.pts[2]], ahead: pp.pts[3], ground: pp.pts[4], yaw: q.yaw });
    }
  }
  // the Patrol's roof lamps, red and blue, as sprites over its plate
  if (s.veh === "cop") {
    out.beacons = [];
    for (const b of [0, 1]) {
      const sp = await p.evaluate(({ o, b, park, y }) => { const R = window.__R, Dd = window.__D, v = window.__story.veh(), bv = v.beams.visible; v.beams.visible = false; try { Dd.beacon(b); R.park([5000, null, 5000, 0]); R.plan(o); return R.carShot(o, "car", [{ x: park[0], y, z: park[2], yaw: park[3] }], { margin: 12 }); } finally { Dd.beacon(2); R.park(null); v.beams.visible = bv; } }, { o, b, park: s.sprite.at, y: y0 });
      save(sp.url, RAW + "/" + id + "-beacon-" + b + ".png"); out.beacons.push(sp.rect);
    }
  }
  fs.writeFileSync(RAW + "/" + id + ".json", JSON.stringify(out));
  report[id] = { s: ((Date.now() - t0) / 1000).toFixed(1), lenses: out.lenses.length, marks: Object.keys(out.marks).length, glows: out.glows.length, sprites: Object.keys(out.sprites).length, pass: out.pass ? out.pass.filter((q) => q.rect).length : 0 };
}
return report;
`;
const t0 = Date.now();
const res = await fetch("http://localhost:8992/", { method: "POST", body });
console.log(res.status, (await res.text()).slice(0, 3000), ((Date.now() - t0) / 1000).toFixed(1) + " s");
