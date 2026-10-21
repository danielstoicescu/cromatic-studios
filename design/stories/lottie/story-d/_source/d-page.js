// Cromatic · stories in Lottie · story D (TASK-066): story D's own in-page helpers, injected after page-render.js (its
// copy in this folder) into the local build opened with ?map&story.
//   __D.hit(o, uvs)      rays through points of the frame (u, v in 0..1) into the city, in its logical space (the
//                        meshes sit there; the shaders bend them, and the bend is smooth enough to be a rigid move at
//                        the scale of a building): the nearest triangle each meets, its point and normal
//   __D.quad(o, p, n, w, h, { ax, up }) a w x h rectangle lying on the plane through p with normal n (on a wall: its
//                        rows level; on the ground: its rows across ax), corners projected into the frame (tl, tr, br, bl)
//   __D.rides()          the rides' ids; __D.veh(id) switches to one and waits for it to be built
(() => {
  const S = window.__story, R = window.__R;
  if (!S || !R) throw new Error("page-render.js first");
  const { scene, camera } = S;
  const V = camera.position.constructor, M4 = camera.matrixWorld.constructor;
  const vis = (x) => { for (let o = x; o; o = o.parent) if (!o.visible) return false; return true; };
  // the logical camera of a shot (setCam warps pos and tgt; here they stay as given)
  function rayOf(o, u, v) {
    const keep = { p: camera.position.clone(), q: camera.quaternion.clone(), fov: camera.fov, a: camera.aspect, near: camera.near, far: camera.far };
    try {
      const p = new V(...o.pos), t = new V(...o.tgt);
      if (o.level) t.y = p.y;
      camera.position.copy(p); camera.up.set(0, 1, 0); camera.lookAt(t);
      if (o.roll) camera.rotateZ(o.roll);
      camera.fov = o.fov || 40; camera.aspect = o.w / o.h; camera.near = 1; camera.far = 30000;
      if (o.shift) camera.setViewOffset(o.w, o.h, -o.shift[0] * o.w, -o.shift[1] * o.h, o.w, o.h); else camera.clearViewOffset();
      camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
      const a = new V(u * 2 - 1, -(v * 2 - 1), -1).unproject(camera), b = new V(u * 2 - 1, -(v * 2 - 1), 1).unproject(camera);
      return { o: a, d: b.sub(a).normalize() };
    } finally {
      camera.position.copy(keep.p); camera.quaternion.copy(keep.q); camera.fov = keep.fov; camera.aspect = keep.a; camera.near = keep.near; camera.far = keep.far;
      camera.clearViewOffset(); camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
    }
  }
  // a ray against a box (slabs), local space: the entry distance or null
  function slab(o, d, bb) {
    let t0 = -Infinity, t1 = Infinity;
    for (const k of ["x", "y", "z"]) {
      if (Math.abs(d[k]) < 1e-12) { if (o[k] < bb.min[k] || o[k] > bb.max[k]) return null; continue; }
      let a = (bb.min[k] - o[k]) / d[k], b = (bb.max[k] - o[k]) / d[k]; if (a > b) [a, b] = [b, a];
      t0 = Math.max(t0, a); t1 = Math.min(t1, b); if (t0 > t1) return null;
    }
    return t1 < 0 ? null : Math.max(0, t0);
  }
  function hitOne(ray, skip) {
    let best = null;
    const inv = new M4(), e1 = new V(), e2 = new V(), pv = new V(), tv = new V(), qv = new V(), A = new V(), B = new V(), C = new V();
    scene.traverse((x) => {
      if (!x.isMesh || x.isInstancedMesh || !vis(x) || !x.geometry || !x.geometry.attributes.position) return;
      if (x === S.sky || (skip && skip(x))) return;
      const m = x.material; if (m && (m.transparent && m.opacity < 0.5 || m.visible === false)) return;
      const g = x.geometry; if (!g.boundingBox) g.computeBoundingBox();
      inv.copy(x.matrixWorld).invert();
      const o = ray.o.clone().applyMatrix4(inv), d = ray.d.clone().transformDirection(inv); // (unit length in local space: distances are compared in world units below)
      const tb = slab(o, d, g.boundingBox); if (tb == null) return;
      const pos = g.attributes.position, idx = g.index, n = idx ? idx.count : pos.count;
      for (let i = 0; i < n; i += 3) {
        const ia = idx ? idx.getX(i) : i, ib = idx ? idx.getX(i + 1) : i + 1, ic = idx ? idx.getX(i + 2) : i + 2;
        A.fromBufferAttribute(pos, ia); B.fromBufferAttribute(pos, ib); C.fromBufferAttribute(pos, ic);
        e1.subVectors(B, A); e2.subVectors(C, A); pv.crossVectors(d, e2); const det = e1.dot(pv);
        if (Math.abs(det) < 1e-10) continue;
        const id = 1 / det; tv.subVectors(o, A); const uu = tv.dot(pv) * id; if (uu < 0 || uu > 1) continue;
        qv.crossVectors(tv, e1); const vv = d.dot(qv) * id; if (vv < 0 || uu + vv > 1) continue;
        const t = e2.dot(qv) * id; if (t <= 0.5) continue;
        const pw = o.clone().addScaledVector(d, t).applyMatrix4(x.matrixWorld), dist = pw.distanceTo(ray.o);
        if (!best || dist < best.dist) { const nl = new V().crossVectors(e1, e2).normalize().transformDirection(x.matrixWorld); if (nl.dot(ray.d) > 0) nl.negate(); best = { dist, p: pw, n: nl, name: x.name || x.parent?.name || "" }; }
      }
    });
    return best;
  }
  function hit(o, uvs, skipNames) {
    const skip = skipNames ? (x) => { for (let q = x; q; q = q.parent) if (skipNames.includes(q.name)) return true; return false; } : null;
    return uvs.map(([u, v]) => { const r = hitOne(rayOf(o, u, v), skip); return r && { p: r.p.toArray().map((k) => +k.toFixed(2)), n: r.n.toArray().map((k) => +k.toFixed(4)), d: +r.dist.toFixed(1), name: r.name }; });
  }
  // a rectangle on the plane (p, n): on a wall (|n.y| small) its rows are level, its x along up x n; on the ground its
  // rows run across ax (a direction on the ground) so the text reads along ax. align: [0..1, 0..1] where p sits in it
  function quad(o, p, n, w, h, { ax = null, align = [0, 1], tilt = 0 } = {}) {
    const P = new V(...p), N = new V(...n).normalize(), up = new V(0, 1, 0);
    let X, Y;
    if (Math.abs(N.y) < 0.7) { X = new V().crossVectors(up, N).normalize(); Y = new V().crossVectors(N, X).normalize(); }
    else { X = new V(...(ax || [1, 0, 0])); X.addScaledVector(N, -X.dot(N)).normalize(); Y = new V().crossVectors(N, X).normalize(); }
    if (tilt) { const c = Math.cos(tilt), s = Math.sin(tilt), X2 = X.clone().multiplyScalar(c).addScaledVector(Y, s), Y2 = Y.clone().multiplyScalar(c).addScaledVector(X, -s); X = X2; Y = Y2; }
    const at = (a, b) => P.clone().addScaledVector(X, (a - align[0]) * w).addScaledVector(Y, (align[1] - b) * h);
    const corners = [at(0, 0), at(1, 0), at(1, 1), at(0, 1)].map((q) => q.toArray());
    const pr = R.project(o, corners);
    return { world: corners, px: pr.pts.map((q) => [q[0], q[1]]), z: pr.pts.map((q) => q[2]), X: X.toArray(), Y: Y.toArray() };
  }
  // the surface under a point of the map (a ray straight down): its height and normal
  function down(x, z) { const r = hitOne({ o: new V(x, 400, z), d: new V(0, -1, 0) }, (m) => { for (let q = m; q; q = q.parent) if (q === S.veh()?.group || q === S.cop()?.group) return true; return false; }); return r && { p: r.p.toArray(), n: r.n.toArray() }; }
  // the Patrol's own roof lamps (the ride, not the chaser): 0 red, 1 blue, 2 off
  function beacon(b) {
    const v = S.veh(), bc = v && v.beacon; if (!bc) return false;
    if (bc.redM) bc.redM.emissiveIntensity = b === 0 ? 2.8 : 0.15;
    if (bc.blueM) bc.blueM.emissiveIntensity = b === 1 ? 2.8 : 0.15;
    return true;
  }
  async function veh(id) {
    if (S.state.vehicleId !== id) window.__api.setVehicle(id);
    for (let i = 0; i < 40 && (!S.veh() || S.state.vehicleId !== id); i++) await new Promise((r) => setTimeout(r, 50));
    await new Promise((r) => setTimeout(r, 400));
    return !!S.veh();
  }
  window.__D = { hit, quad, rayOf, veh, down, beacon };
})();
