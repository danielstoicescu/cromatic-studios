// Cromatic · story E8: where each ride sits on screen (1080 x 1920 px), frame by frame: the shot is prepared in the
// harness page (its own module instance), posed at the frame's time, the ride's meshes' boxes carried through their
// world matrices and the city's bend, projected through the frame's (bent) camera. For the framing and the cards' tags.
//   node _source/e8-box.mjs t1 [frames, default 0,mid,last]   -> JSON per frame { x, y, w, h }
const HARNESS = process.env.HARNESS || "http://localhost:8942";
const [k, fr] = process.argv.slice(2);
const r = await fetch(HARNESS, { method: "POST", body: `return await p.evaluate(async ([k, fr]) => {
  const S = window.__story, K = S.K, ctx = { S, K, D: window.__D };
  const SH = (await import("/__dr/shots/e8/" + k + ".mjs?box=" + Date.now())).default;
  await SH.prepare(ctx);
  const fps = SH.fps || 30, n = Math.round(SH.duration * fps), list = fr ? fr.split(",").map(Number) : [0, n >> 1, n - 1];
  const cam = new K.PerspectiveCamera(30, 1080 / 1920, 0.5, 30000), out = {};
  const subs = SH.subjects ? SH.subjects(ctx) : [["ride", SH.subject(ctx)]];
  for (const f of list) {
    const t = SH.camera.t0 + f / fps; if (SH.pose) SH.pose(t, ctx, 0);
    const c = SH.camera.at(t), P = S.warpV(new K.Vector3(...c.pos)), L = S.warpV(new K.Vector3(...c.look));
    cam.position.copy(P); cam.up.set(...c.up); cam.fov = c.fov; cam.lookAt(L); cam.updateMatrixWorld(true); cam.updateProjectionMatrix();
    out[f] = {};
    for (const [name, o] of subs) {
      o.updateMatrixWorld(true); let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
      o.traverse((m) => { if (!m.isMesh || !m.visible) return; let vis = true; for (let q = m; q; q = q.parent) if (!q.visible) vis = false; if (!vis || (m.material && m.material.transparent && (m.material.isMeshBasicMaterial || m.material.opacity < 0.3))) return; if (!m.geometry.boundingBox) m.geometry.computeBoundingBox(); const b = m.geometry.boundingBox; if (b.max.y - b.min.y < 1e-3 && m.material && m.material.isMeshBasicMaterial) return;
        for (let i = 0; i < 8; i++) { const v = new K.Vector3(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z).applyMatrix4(m.matrixWorld); const q = S.warpV(v).project(cam); if (q.z > 1) continue; const X = (q.x + 1) / 2 * 1080, Y = (1 - q.y) / 2 * 1920; x0 = Math.min(x0, X); x1 = Math.max(x1, X); y0 = Math.min(y0, Y); y1 = Math.max(y1, Y); } });
      out[f][name] = { x: Math.round(x0), y: Math.round(y0), w: Math.round(x1 - x0), h: Math.round(y1 - y0) };
    }
  }
  SH.dispose && SH.dispose(ctx);
  return out;
}, ${JSON.stringify([k, fr || ""])});` });
const t = await r.text(); if (r.status !== 200) { console.error(t.slice(0, 600)); process.exit(1); }
console.log(k, t);
