// Cromatic · diorama renders (TASK-118): which of the city's own blocks stand in story A6's shots, and which of them
// carried the roof faults Daniel saw ("acoperișurile nefinisate, plutitoare"): eaves with nothing under them (seen
// from a camera lower than the eave), mansard dormers left in front of the slope (deep blocks), water tanks standing on
// nothing over flat roofs. A6's cameras (shotsA6.mjs) at the start, middle and end of each shot; a block counts when
// its middle or its roof is in the frame, nearer than 1600. LOCAL ONLY, through the harness.
//   node _source/roofs.mjs > out/roofs.json
const A6 = {
  over: { dur: 2.55, cam: (t) => ({ pos: [842 + 4 * Math.sin(t * 0.7), 300, 5478 + 62 * t + 18], tgt: [842, 0, 5478 + 62 * t + 18.5], fov: 52 }) },
  steam: { dur: 1.95, cam: (t) => { const u = t / 1.95; return { pos: [786 + 14 * u, 9 + 1.5 * u, 5436 + 16 * u], tgt: [940 + 12 * u, 15, 5640 - 4 * u], fov: 60, shift: [0, 0.13], level: true }; } },
  oma: { dur: 2.25, cam: (t) => { const u = t / 2.25; return { pos: [892 - 10 * u, 13.5, 4602 - 8 * u], tgt: [620, 44, 4579], fov: 73.7, shift: [0, 0.0833], level: true }; } },
  scf: { dur: 1.9, cam: (t) => { const u = t / 1.9; return { pos: [1528 - 66 * u, 168 - 18 * u, 4690 + 38 * u], tgt: [1100, 30, 5300], fov: 55 }; } },
  drive: { dur: 5.7, cam: (t) => { const u = Math.min(1, Math.max(0, (t - 0.4) / 3.6)); return { pos: [842, 2.4 + 1.2 * u, 5507 + 33 * u], tgt: [842, 5, 5760 + 40 * u], fov: 58, shift: [0, 0.12], level: true }; } }
};
const jobs = Object.fromEntries(Object.entries(A6).map(([k, S]) => [k, [0, S.dur / 2, S.dur].map((t) => S.cam(t))]));
const r = await fetch(process.env.HARNESS || "http://localhost:8797", { method: "POST", body: `return await p.evaluate((jobs) => {
  const S = window.__story, K = S.K, cam = new K.PerspectiveCamera(), W = (a) => S.warpV(new K.Vector3(a[0], a[1], a[2]));
  const FP = S.footprints(), out = {};
  // the scene's view depth through the map's own vertex chain (the city's bend included), for an occlusion test
  const RW = 270, RH = 480, rt = new K.WebGLRenderTarget(RW, RH, { type: K.FloatType, format: K.RGBAFormat, depthBuffer: true });
  const dm = new K.ShaderMaterial({ vertexShader: "#include <common>\\nvarying float vD;\\nvoid main(){\\n#include <begin_vertex>\\n#include <project_vertex>\\nvD = -mvPosition.z; }", fragmentShader: "varying float vD; void main(){ gl_FragColor = vec4(vD, 0.0, 0.0, 1.0); }" });
  const R = S.renderer, buf = new Float32Array(RW * RH * 4);
  const depthAt = (s) => { const x = Math.min(RW - 1, Math.max(0, Math.floor((s.x * 0.5 + 0.5) * RW))), y = Math.min(RH - 1, Math.max(0, Math.floor((s.y * 0.5 + 0.5) * RH))); return buf[(y * RW + x) * 4] || 1e9; };
  for (const [k, cams] of Object.entries(jobs)) {
    const seen = new Map();
    for (const c of cams) {
      const p = W(c.pos), t = W(c.tgt); if (c.level) t.y = p.y;
      cam.position.copy(p); cam.up.set(0, 1, 0); cam.lookAt(t); cam.fov = c.fov; cam.aspect = 9 / 16; cam.near = 2; cam.far = 30000;
      if (c.shift) cam.setViewOffset(1080, 1920, -c.shift[0] * 1080, -c.shift[1] * 1920, 1080, 1920); else cam.clearViewOffset();
      cam.updateProjectionMatrix(); cam.updateMatrixWorld(true);
      { const sky = S.sky.visible, bg = S.scene.background; S.sky.visible = false; S.scene.background = null; S.scene.overrideMaterial = dm; const cc = R.getClearColor(new K.Color()), ca = R.getClearAlpha(); R.setClearColor(0x000000, 0); R.setRenderTarget(rt); R.clear(); R.render(S.scene, cam); R.readRenderTargetPixels(rt, 0, 0, RW, RH, buf); R.setRenderTarget(null); S.scene.overrideMaterial = null; S.sky.visible = sky; S.scene.background = bg; R.setClearColor(cc, ca); }
      FP.forEach((f, i) => {
        if (!f.roof) return;
        const ca = Math.cos(f.ang), sa = Math.sin(f.ang), loc = (lx, lz, y) => [f.x + lx * ca + lz * sa, y, f.z - lx * sa + lz * ca];
        const pts = [loc(0, -f.d / 2 - 1.5, f.h), loc(0, f.d / 2 + 1.5, f.h), loc(-f.w / 2 - 1.5, 0, f.h), loc(f.w / 2 + 1.5, 0, f.h), loc(0, 0, f.h + 8)];
        for (const q of pts) { const v = W(q), d = v.distanceTo(p); if (d > 1600) continue; const s = v.clone().project(cam); const vz = -v.clone().applyMatrix4(cam.matrixWorldInverse).z; if (s.z < 1 && Math.abs(s.x) < 1 && Math.abs(s.y) < 1 && vz <= depthAt(s) + 6) { const below = p.y < f.h; const o = seen.get(i) || { i, x: Math.round(f.x), z: Math.round(f.z), w: Math.round(f.w), d: Math.round(f.d), h: f.h, roof: f.roof, tank: !!f.tank, dist: Math.round(d), below: false }; o.below = o.below || below; o.dist = Math.min(o.dist, Math.round(d)); seen.set(i, o); break; } }
      });
    }
    const list = [...seen.values()].map((o) => ({ ...o, faults: [o.below && o.roof !== "flat" ? "eave seen from below, no soffit" : null, o.below && o.roof === "flat" ? "slab overhang seen from below, open" : null, o.roof === "mansard" && o.d >= 34 ? "dormers in front of the slope" : null, o.tank ? "water tank on nothing" : null].filter(Boolean) })).sort((a, b) => a.dist - b.dist);
    out[k] = list;
  }
  rt.dispose(); dm.dispose();
  return out;
}, ${JSON.stringify(jobs)});` });
const t = await r.text(); if (r.status !== 200) { console.error(t); process.exit(1); }
const J = JSON.parse(t);
for (const [k, l] of Object.entries(J)) { const f = l.filter((o) => o.faults.length); console.log(k, "blocks in frame:", l.length, "with a fault:", f.length); }
console.log(JSON.stringify(J));
