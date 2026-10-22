// story E2 · the rides' frames at 2160 x 3840 (30 fps), the map's renderer (iso.mjs; the app built with patch-app.py,
// the Patrol reading POLITE), and where each ride sits on screen.   node render-e2.mjs <outdir> [shot ids]
//   turntables as E1; the rush: the 1300 and the Patrol rendered apart (each its own pass, a 6-subframe shutter, the
//   camera sliding past the still ride), then put together on the paper (the nearer picture over the other; each one's
//   contact shadow multiplied onto the other)
import fs from "fs";
import sharp from "/Users/daniel.stoic/cromatic-drive/node_modules/sharp/lib/index.js";
import { open, aim, setVeh } from "./iso.mjs";
// (SHOTS=./shotsE3.mjs: E3's shots, the same machinery)
const { SHOTS, TURN, PASS } = await import(process.env.SHOTS || "./shotsE2.mjs");
const OUT = process.argv[2], ONLY = process.argv[3] ? process.argv[3].split(",") : null; fs.mkdirSync(OUT, { recursive: true });
const PAPER = [251, 250, 245];
const { br, p } = await open({ dsf: 4 });
await p.evaluate(() => { window.__noPost = true; });
const frame = () => p.evaluate(() => new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok))));
const grab = async () => (await sharp(await p.screenshot()).removeAlpha().raw().toBuffer({ resolveWithObject: true }));
const boxNow = () => p.evaluate(() => {
  const b = window.__turnBox, cam = window.__camera, V = cam.position.constructor, v = new V(); let x0 = 9, x1 = -9, y0 = 9, y1 = -9;
  for (let i = 0; i < 8; i++) { v.set(i & 1 ? b.mx[0] : b.mn[0], i & 2 ? b.mx[1] : b.mn[1], i & 4 ? b.mx[2] : b.mn[2]); if (window.__warpV) window.__warpV(v); v.project(cam); x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y); }
  return { x: Math.round((x0 + 1) * 540), y: Math.round((1 - y1) * 960), w: Math.round((x1 - x0) * 540), h: Math.round((y1 - y0) * 960) };
});
const meta = fs.existsSync(`${OUT}/shots.json`) ? JSON.parse(fs.readFileSync(`${OUT}/shots.json`, "utf8")) : [];
const put = (m) => { const i = meta.findIndex((x) => x.id === m.id); if (i >= 0) meta[i] = m; else meta.push(m); fs.writeFileSync(`${OUT}/shots.json`, JSON.stringify(meta, null, 1)); };
const name = (f) => `${OUT}/f${String(f).padStart(5, "0")}.png`;
// one pass of a still ride with the camera sliding: subframes averaged; null = paper
async function passFrames(ride, dzOf, n, tag) {
  await setVeh(p, ride);
  await aim(p, { ...TURN, a: PASS.a, e: PASS.e, R: PASS.R, ty: PASS.ty, dz: 0, pr: 4 }); await p.waitForTimeout(900);
  await p.evaluate(() => { window.__fx = null; });
  const out = [];
  for (let f = 0; f < n; f++) {
    if (dzOf(f) == null) { out.push(null); continue; }
    let acc = null, info = null;
    for (let j = 0; j < PASS.sub; j++) {
      const ff = f + ((j + 0.5) / PASS.sub - 0.5) * (PASS.shutter ?? 1), dz = dzOf(Math.max(0, ff)) ?? dzOf(f), sh = PASS.shake(f);
      const fx = PASS.fx ? PASS.fx(tag, Math.max(0, ff)) : null;
      await p.evaluate(({ dz, sh, j, ty, fx }) => { window.__turn.dz = dz; window.__turn.dx = sh * Math.sin(j * 2.1 + dz); window.__turn.ty = ty + sh * 0.6 * Math.cos(j * 1.7 + dz); window.__fx = fx; }, { dz, sh, j, ty: PASS.ty, fx }); await frame();
      const g = await grab(); info = g.info; if (!acc) acc = new Float32Array(g.data.length); for (let q = 0; q < acc.length; q++) acc[q] += g.data[q];
    }
    const buf = Buffer.alloc(acc.length); for (let q = 0; q < acc.length; q++) buf[q] = Math.round(acc[q] / PASS.sub);
    const file = `${OUT}/_${tag}-${String(f).padStart(3, "0")}.raw`; fs.writeFileSync(file, buf); out.push({ file, info });
  }
  return out;
}
for (const s of SHOTS) {
  if (!s.ride || (ONLY && !ONLY.includes(s.id))) continue;
  const n = s.t[1] - s.t[0];
  if (s.kind === "pass") {
    const A = await passFrames("dacia1300", PASS.car, n, "car"), B = await passFrames("cop", PASS.cop, n, "cop");
    let box = null;
    for (let f = 0; f < n; f++) {
      const a = A[f] && fs.readFileSync(A[f].file), b = B[f] && fs.readFileSync(B[f].file), info = (A[f] || B[f] || { info: { width: 2160, height: 3840, channels: 3 } }).info;
      const N = info.width * info.height * 3, o = Buffer.alloc(N);
      for (let q = 0; q < N; q += 3) {
        const pa = a ? [a[q], a[q + 1], a[q + 2]] : PAPER, pb = b ? [b[q], b[q + 1], b[q + 2]] : PAPER;
        const da = Math.abs(pa[0] - PAPER[0]) + Math.abs(pa[1] - PAPER[1]) + Math.abs(pa[2] - PAPER[2]);
        // (the 1300's body over the Patrol; elsewhere the Patrol with the 1300's shadow multiplied onto it)
        const solid = Math.min(1, Math.max(0, (da - 60) / 60));
        for (let c = 0; c < 3; c++) o[q + c] = Math.round(solid * pa[c] + (1 - solid) * (pb[c] * pa[c]) / PAPER[c]);
      }
      await sharp(o, { raw: { width: info.width, height: info.height, channels: 3 } }).png({ compressionLevel: 1 }).toFile(name(s.t[0] + f));
    }
    box = await boxNow();
    for (const x of [...A, ...B]) if (x) fs.rmSync(x.file);
    put({ id: s.id, ride: "dacia1300+cop", t: s.t, box });
    console.log(s.id, "pass", JSON.stringify(box));
    continue;
  }
  await p.evaluate(() => { window.__fx = null; });
  await setVeh(p, s.ride);
  await aim(p, { ...TURN, a: s.a[0], ty: Array.isArray(s.ty) ? s.ty[0] : s.ty ?? TURN.ty, dz: 0, dx: 0, pr: 4 }); await p.waitForTimeout(900);
  let box = null;
  for (let i = 0; i < n; i++) {
    const u = n > 1 ? i / (n - 1) : 0, a = s.a[0] + (s.a[1] - s.a[0]) * (s.kind === "follow" ? u * u * (3 - 2 * u) : u);
    // (ty: a number or [from, to]; bob: a climb and a dive in frame, for the plane)
    const ty0 = Array.isArray(s.ty) ? s.ty[0] + (s.ty[1] - s.ty[0]) * (u * u * (3 - 2 * u)) : s.ty ?? TURN.ty, ty = s.bob ? ty0 + s.bob * Math.sin(u * Math.PI * 2) : ty0;
    // (E4: the Patrol following drives in place: its wheels, a bob, its beacons)
    const fx = s.beacon ? { spin: -i * 3.5, lift: 0.12 * Math.sin(i * 2.3), pitch: 0.005 * Math.sin(i * 1.7), beacon: Math.floor((i * 1000) / 30 / 190) % 2 } : null;
    await p.evaluate((fx) => { window.__fx = fx; }, fx);
    await p.evaluate(({ a, i, follow, ty }) => { window.__turn.a = a; window.__turn.ty = ty; if (follow) { window.__turn.dx = 0.5 * Math.sin(i * 0.21); window.__turn.ty = ty + 0.35 * Math.sin(i * 0.37); } }, { a, i, follow: s.kind === "follow", ty }); await frame();
    if (i === Math.floor(n / 2)) box = await boxNow();
    await p.screenshot({ path: name(s.t[0] + i) });
  }
  put({ id: s.id, ride: s.ride, t: s.t, box });
  console.log(s.id, s.ride, JSON.stringify(box));
}
await br.close();
