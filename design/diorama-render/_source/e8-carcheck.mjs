// Cromatic · story E8: every ride's proportions, frame by frame (the P1 check, for any ride). Each shot is prepared in
// the harness page (its own module instance) and posed at every frame's time (E8's shutter is 0: one instant per frame;
// a shot with a shutter is also checked at both ends of it). The ride's own axes (length, width, height: one local unit
// each, from the object the shot names in subject()/subjects()) are carried through its world matrix and the city's
// bend (what the shader draws); their drawn lengths must keep 1 : 1 : 1. Prints the worst deviation per ride.
//   node _source/e8-carcheck.mjs [t1 t2 ...]
const HARNESS = process.env.HARNESS || "http://localhost:8942";
const run = async (body) => { const r = await fetch(HARNESS, { method: "POST", body }); const t = await r.text(); if (r.status !== 200) throw new Error(t); return JSON.parse(t); };
const shots = process.argv.slice(2).length ? process.argv.slice(2) : ["t1", "t2", "t3", "van", "chrome", "scooter", "chase"];
const all = {};
for (const k of shots) {
  all[k] = await run(`return await p.evaluate(async (k) => {
    const S = window.__story, K = S.K, ctx = { S, K, D: window.__D };
    const SH = (await import("/__dr/shots/e8/" + k + ".mjs?check=" + Date.now())).default;
    await SH.prepare(ctx);
    const subs = SH.subjects ? SH.subjects(ctx) : [["ride", SH.subject(ctx)]];
    const fps = SH.fps || 30, n = Math.round(SH.duration * fps), sh = SH.shutter ?? 0.5, ends = sh > 0 ? [-0.5, 0, 0.5] : [0];
    const res = {};
    for (const [name, o] of subs) res[name] = { worstDev: 0, at: null, frames: n };
    for (let f = 0; f < n; f++) for (const d of ends) {
      const t = SH.camera.t0 + (f + d * sh) / fps; if (SH.pose) SH.pose(t, ctx, 0);
      for (const [name, o] of subs) {
        o.updateMatrixWorld(true);
        const M = o.matrixWorld, P = (x, y, z) => S.warpV(new K.Vector3(x, y, z).applyMatrix4(M));
        const c = P(0, 0.6, 0), L = [P(0, 0.6, 1), P(1, 0.6, 0), P(0, 1.6, 0)].map((q) => q.distanceTo(c));
        const m = (L[0] + L[1] + L[2]) / 3, dev = Math.max(...L.map((l) => Math.abs(l / m - 1)));
        if (dev > res[name].worstDev) res[name] = { ...res[name], worstDev: dev, at: { f, d, L: L.map((l) => +l.toFixed(4)) } };
      }
    }
    for (const name in res) res[name].worstDev = +(res[name].worstDev * 100).toFixed(4) + " %";
    SH.dispose && SH.dispose(ctx);
    return res;
  }, ${JSON.stringify(k)});`).catch((e) => ({ err: String(e).slice(0, 400) }));
  console.log(k, JSON.stringify(all[k]));
}
if (process.env.OUT) (await import("fs")).writeFileSync(process.env.OUT, JSON.stringify(all, null, 1));
