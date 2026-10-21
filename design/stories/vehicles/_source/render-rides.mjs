// story E · the rides: every frame of the ride shots at 2160 x 3840 (30 fps), and where each ride sits on screen
//   node render-rides.mjs <outdir>   (the app on :8983, see iso.mjs) -> <outdir>/f00000.png..., <outdir>/shots.json
import fs from "fs";
import { open, aim, setVeh } from "./iso.mjs";
import { SHOTS, TURN } from "./shots.mjs";
const OUT = process.argv[2]; fs.mkdirSync(OUT, { recursive: true });
const { br, p } = await open({ dsf: 4 });
await p.evaluate(() => { window.__noPost = true; });
const frame = () => p.evaluate(() => new Promise((ok) => requestAnimationFrame(() => requestAnimationFrame(ok))));
const meta = [];
for (const s of SHOTS) {
  if (!s.ride) continue;
  await setVeh(p, s.ride);
  const n = s.t[1] - s.t[0];
  await aim(p, { ...TURN, a: s.a[0], ty: s.ty ?? TURN.ty, pr: 4 }); await p.waitForTimeout(900);
  let box = null;
  for (let i = 0; i < n; i++) {
    const u = n > 1 ? i / (n - 1) : 0, a = s.a[0] + (s.a[1] - s.a[0]) * u;
    await p.evaluate((a) => { window.__turn.a = a; }, a); await frame();
    if (i === Math.floor(n / 2)) box = await p.evaluate(() => {
      const b = window.__turnBox, cam = window.__camera, V = cam.position.constructor, v = new V(); let x0 = 9, x1 = -9, y0 = 9, y1 = -9;
      for (let i = 0; i < 8; i++) { v.set(i & 1 ? b.mx[0] : b.mn[0], i & 2 ? b.mx[1] : b.mn[1], i & 4 ? b.mx[2] : b.mn[2]); if (window.__warpV) window.__warpV(v); v.project(cam); x0 = Math.min(x0, v.x); x1 = Math.max(x1, v.x); y0 = Math.min(y0, v.y); y1 = Math.max(y1, v.y); }
      return { x: Math.round((x0 + 1) * 540), y: Math.round((1 - y1) * 960), w: Math.round((x1 - x0) * 540), h: Math.round((y1 - y0) * 960) }; // (story px, 1080 x 1920)
    });
    await p.screenshot({ path: `${OUT}/f${String(s.t[0] + i).padStart(5, "0")}.png` });
  }
  meta.push({ id: s.id, ride: s.ride, t: s.t, box });
  console.log(s.id, s.ride, JSON.stringify(box));
}
fs.writeFileSync(`${OUT}/shots.json`, JSON.stringify(meta, null, 1));
await br.close();
