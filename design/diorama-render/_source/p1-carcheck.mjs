// Cromatic · story P1: the hero car's proportions, frame by frame. Each car shot is prepared in the harness page (its
// own module instance), posed at every frame's time and at the ends of its open shutter, and the car's own axes
// (length, width, height: one model unit each) are carried through its world matrix and the city's bend (what the
// shader draws). Their drawn lengths must keep the model's 1 : 1 : 1; prints the worst deviation per shot.
//   node _source/p1-carcheck.mjs [f2 f3 ...]   (after the renders: it loads worlds in the shared page)
const HARNESS = process.env.HARNESS || "http://localhost:8797";
const run = async (body) => { const r = await fetch(HARNESS, { method: "POST", body }); const t = await r.text(); if (r.status !== 200) throw new Error(t); return JSON.parse(t); };
const shots = process.argv.slice(2).length ? process.argv.slice(2) : ["f2", "f3", "f4", "f5", "f6", "f7"];
const res = {};
for (const k of shots) {
  res[k] = await run(`return await p.evaluate(async (k) => {
    const S = window.__story, K = S.K, ctx = { S, K, D: window.__D };
    const mod = await import("/__dr/shots/p1/" + k + ".mjs?check=" + Date.now()), SH = mod.default;
    await SH.prepare(ctx);
    const cars = S.scene.children.filter((g) => g.isGroup && g.children[0] && g.children[0].children.some((c) => c.name === "wheel"));
    const g = cars[cars.length - 1], body = g.children[0];
    const fps = SH.fps || 30, n = Math.round(SH.duration * fps), sh = SH.shutter ?? 0.5;
    let worst = 0, at = null, minK = 9, maxK = 0;
    for (let f = 0; f < n; f++) for (const d of [-0.5, 0, 0.5]) {
      const t = SH.camera.t0 + (f + d * sh) / fps; if (SH.pose) SH.pose(t, ctx, 0);
      g.updateMatrixWorld(true);
      const M = body.matrixWorld, P = (x, y, z) => S.warpV(new K.Vector3(x, y, z).applyMatrix4(M));
      const o = P(0, 0.6, 0), L = [P(0, 0.6, 1), P(1, 0.6, 0), P(0, 1.6, 0)].map((q) => q.distanceTo(o));
      const m = (L[0] + L[1] + L[2]) / 3, dev = Math.max(...L.map((l) => Math.abs(l / m - 1)));
      if (dev > worst) { worst = dev; at = { f, d, L: L.map((l) => +l.toFixed(4)) }; }
      minK = Math.min(minK, m); maxK = Math.max(maxK, m);
    }
    SH.dispose && SH.dispose(ctx);
    return { frames: n, worstDev: +worst.toFixed(5), at, sizeRange: [+minK.toFixed(4), +maxK.toFixed(4)] };
  }, ${JSON.stringify(k)});`).catch((e) => ({ err: String(e).slice(0, 400) }));
  console.log(k, JSON.stringify(res[k]));
}
