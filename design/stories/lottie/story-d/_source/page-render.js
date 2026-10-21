// Cromatic · stories in Lottie (TASK-057): the in-page half of the layer renders. Injected by the harness into the
// local build opened with ?map&story (window.__story, a test-only hook on the stories-lottie branch).
//   __R.shot(o)        one frame of the city from a camera of its own, at a size of its own, as a PNG data URL
//   __R.plan(o)        sorts everything the scene draws into depth layers for that camera (sky, ground, near, mid, far)
//   __R.layer(o, keep) the frame with only the layers named in keep, on a transparent ground (the shadows stay frozen
//                      as the whole city cast them, so a facade keeps the shade of the tree that is now on another layer)
//   __R.project(o, pts) logical points (x, y, z) to pixels of that frame (labels pinned to buildings)
// o: { pos, tgt, fov, w, h, shift: [sx, sy] (a lens shift in frames: the camera stays level, the picture slides),
//      cuts: [[name, maxDepth], ...], groundY, flatH, mode: "plain" | "sketch", keepBg }
(() => {
  const S = window.__story;
  if (!S) throw new Error("no window.__story: open the map with ?map&story");
  const { renderer: R, scene, camera } = S;
  const V = camera.position.constructor, Col = S.sun.color.constructor;
  const W = (a) => S.warpV(new V(a[0], a[1], a[2]));
  const vis = (x) => { for (let o = x; o; o = o.parent) if (!o.visible) return false; return true; };
  const under = (x, root) => { for (let o = x; o; o = o.parent) if (o === root) return true; return false; };
  const named = (x, nm) => { for (let o = x; o; o = o.parent) if (o.name === nm) return true; return false; };
  function save() {
    return { pos: camera.position.clone(), q: camera.quaternion.clone(), fov: camera.fov, near: camera.near, far: camera.far, aspect: camera.aspect, bg: scene.background, pr: R.getPixelRatio(), size: [R.domElement.width / R.getPixelRatio(), R.domElement.height / R.getPixelRatio()], cc: R.getClearColor(new Col()), ca: R.getClearAlpha(), sh: [S.sun.shadow.autoUpdate, S.sun.shadow.needsUpdate] };
  }
  function restore(s) {
    camera.position.copy(s.pos); camera.quaternion.copy(s.q); camera.fov = s.fov; camera.near = s.near; camera.far = s.far; camera.aspect = s.aspect; camera.clearViewOffset(); camera.updateProjectionMatrix();
    scene.background = s.bg;
  }
  // a level camera (o.level) looks along the horizontal of tgt; its picture can slide (o.shift, in frames) like a
  // tilt-shift lens, so verticals stay vertical and the horizon sits where the frame wants it
  function setCam(o) {
    const p = o.raw ? new V(...o.pos) : W(o.pos), t = o.raw ? new V(...o.tgt) : W(o.tgt);
    if (o.level) t.y = p.y;
    camera.position.copy(p); camera.up.set(0, 1, 0);
    camera.lookAt(t);
    if (o.roll) camera.rotateZ(o.roll);
    camera.fov = o.fov || 40; camera.near = o.near || 2; camera.far = o.far || 30000; camera.aspect = o.w / o.h;
    if (o.shift) camera.setViewOffset(o.w, o.h, -o.shift[0] * o.w, -o.shift[1] * o.h, o.w, o.h); else camera.clearViewOffset();
    camera.updateProjectionMatrix(); camera.updateMatrixWorld(true);
  }
  function project(o, pts) {
    const s = save(); setCam(o);
    const out = pts.map((q) => { const v = W(q).project(camera); return [+((v.x * 0.5 + 0.5) * o.w).toFixed(1), +((-v.y * 0.5 + 0.5) * o.h).toFixed(1), +v.z.toFixed(4)]; });
    // and the camera's numbers, for the layers' parallax: its focal length in px, the horizon's row, its height
    const f = (o.h / 2) / Math.tan((o.fov * Math.PI) / 360);
    const hz = W([o.tgt[0], camera.position.y, o.tgt[2]]); const vh = hz.clone(); vh.y = camera.position.y; const pv = vh.project(camera);
    const res = { pts: out, f, horizon: +((-pv.y * 0.5 + 0.5) * o.h).toFixed(1), camY: camera.position.y };
    restore(s); return res;
  }
  const ZERO = (m) => { m[0] = m[1] = m[2] = m[4] = m[5] = m[6] = m[8] = m[9] = m[10] = 0; };
  let PLAN = null;
  // every drawable thing, into a layer by the depth of the middle of its box along the camera's axis
  function plan(o) {
    if (o.forceSrc && !o.force) o.force = new Function("x", "b", o.forceSrc);
    if (o.dropSrc && !o.drop) o.drop = new Function("x", o.dropSrc);
    const s = save(); setCam(o);
    const cp = camera.position.clone(), fwd = camera.getWorldDirection(new V());
    const depth = (pt) => S.warpV(pt.clone()).sub(cp).dot(fwd); // (the meshes sit at their logical places; the shaders bend them: warpV)
    const cuts = o.cuts || [["near", 120], ["mid", 420], ["far", 1e9]];
    const bin = (d) => { for (const [nm, mx] of cuts) if (d < mx) return nm; return cuts[cuts.length - 1][0]; };
    const groundY = o.groundY ?? 3.2, flatH = o.flatH ?? 3.5;
    const meshes = new Map(), inst = new Map(), count = {};
    const deps = {}; const add = (nm, d) => { count[nm] = (count[nm] || 0) + 1; if (d != null) (deps[nm] = deps[nm] || []).push(d); };
    const m4 = new camera.matrixWorld.constructor();
    scene.traverse((x) => {
      if (!(x.isMesh || x.isLine || x.isPoints || x.isSprite) || !vis(x)) return;
      // (nothing is left out by default: the "goldenRoute" group is the main road itself)
      if (o.drop && o.drop(x)) { meshes.set(x, "drop"); add("drop"); return; }
      if (x === S.sky || under(x, S.farClouds)) { meshes.set(x, "sky"); add("sky"); return; }
      const g = x.geometry; if (!g) return;
      if (!g.boundingBox) g.computeBoundingBox();
      // a small, compact set of instances (the festoon's bulbs) stays together, in the layer of the set's middle
      if (x.isInstancedMesh && x.count <= 40 && (x.computeBoundingBox(), x.boundingBox.clone().applyMatrix4(x.matrixWorld).getSize(new V()).length() < 700)) {
        const bb = x.boundingBox.clone().applyMatrix4(x.matrixWorld), dd = depth(bb.getCenter(new V()));
        const nm = o.force?.(x, bb) || (dd > (o.skyD || 1e9) ? "sky" : bin(dd)); meshes.set(x, nm); add(nm, dd); return;
      }
      if (x.isInstancedMesh) {
        const c0 = g.boundingBox.getCenter(new V()), lab = new Array(x.count), hb = g.boundingBox.max.y - g.boundingBox.min.y;
        for (let i = 0; i < x.count; i++) {
          x.getMatrixAt(i, m4); m4.premultiply(x.matrixWorld);
          const c = c0.clone().applyMatrix4(m4), sy = new V().setFromMatrixColumn(m4, 1).length();
          const flat = hb * sy < flatH && c.y < groundY;
          const dc = depth(c); lab[i] = flat ? "ground" : dc > (o.skyD || 1e9) ? "sky" : bin(dc);
          add(lab[i], flat ? null : dc);
        }
        inst.set(x, lab); return;
      }
      const b = g.boundingBox.clone().applyMatrix4(x.matrixWorld);
      // the far mesas round the city (big, tall): the sky's layer, or left out (o.noMesa)
      if (b.max.y > 150 && Math.max(b.max.x - b.min.x, b.max.z - b.min.z) > 1200) { const nm = o.noMesa ? "drop" : "sky"; meshes.set(x, nm); add(nm); return; }
      if (b.max.x - b.min.x > 8000) { meshes.set(x, "ground"); add("ground"); return; } // (the ground plane, the sea)
      const fz = o.force?.(x, b); if (fz) { meshes.set(x, fz); add(fz, depth(b.getCenter(new V()))); return; }
      const flat = b.max.y - b.min.y < flatH && b.max.y < groundY;
      const d = depth(b.getCenter(new V()));
      const nm = flat ? "ground" : d > (o.skyD || 1e9) ? "sky" : bin(d);
      meshes.set(x, nm); add(nm, flat ? null : d);
    });
    restore(s);
    PLAN = { meshes, inst, o };
    const q = (a, k) => Math.round(a[Math.min(a.length - 1, Math.floor(k * a.length))]);
    const stats = Object.fromEntries(Object.entries(deps).map(([nm, a]) => { a.sort((u, v) => u - v); return [nm, [q(a, 0), q(a, 0.25), q(a, 0.5), q(a, 0.75), q(a, 0.999)]]; }));
    return { count, stats };
  }
  // the frame with only the layers in keep (the plan made for the same camera)
  function layer(o, keep, extra = {}) {
    if (!PLAN) throw new Error("plan first");
    const K = new Set(keep), hidden = [], arrays = [];
    for (const [x, nm] of PLAN.meshes) if (!K.has(nm) && x.visible) { x.visible = false; hidden.push(x); }
    for (const [x, lab] of PLAN.inst) {
      const keepAny = lab.some((l) => K.has(l));
      if (!keepAny) { if (x.visible) { x.visible = false; hidden.push(x); } continue; }
      if (lab.every((l) => K.has(l))) continue;
      const a = x.instanceMatrix.array, copy = a.slice();
      for (let i = 0; i < lab.length; i++) if (!K.has(lab[i])) ZERO(a.subarray(i * 16, i * 16 + 16));
      x.instanceMatrix.needsUpdate = true; arrays.push([x, copy]);
    }
    try { return shot({ ...o, ...extra, keepBg: keep.includes("sky") && !extra.noBg }); }
    finally {
      for (const x of hidden) x.visible = true;
      for (const [x, copy] of arrays) { x.instanceMatrix.array.set(copy); x.instanceMatrix.needsUpdate = true; }
    }
  }
  function shot(o) {
    const s = save();
    try {
      R.setPixelRatio(1); R.setSize(o.w, o.h, false);
      setCam(o);
      S.sun.shadow.autoUpdate = false; S.sun.shadow.needsUpdate = !!o.shadowUpdate;
      if (!o.keepBg) { scene.background = null; R.setClearColor(0x000000, 0); }
      if (o.mode === "sketch") S.sketchRender(performance.now(), camera, !!o.full);
      else { R.setRenderTarget(null); R.render(scene, camera); }
      return R.domElement.toDataURL("image/png");
    } finally {
      R.setClearColor(s.cc, s.ca); scene.background = s.bg;
      S.sun.shadow.autoUpdate = s.sh[0];
      restore(s);
      R.setPixelRatio(s.pr); R.setSize(s.size[0], s.size[1], false);
    }
  }
  // the ride parked for a shot: its group put at (x, z) facing yaw, until park(null)
  let parked = null;
  function park(p) {
    const v = S.veh(); if (!v) return false;
    if (!p) { if (parked) { v.group.position.copy(parked.p); v.group.quaternion.copy(parked.q); if (parked.s) v.group.scale.copy(parked.s); parked = null; } return true; }
    if (!parked) parked = { p: v.group.position.clone(), q: v.group.quaternion.clone() };
    // (logical coordinates: the shaders bend it like the rest of the city); p[4]: its size (the map draws it at .57)
    if (!parked.s) parked.s = v.group.scale.clone();
    v.group.position.set(p[0], p[1] ?? parked.p.y, p[2]); v.group.rotation.set(0, p[3] || 0, 0);
    if (p[4]) v.group.scale.setScalar(p[4]);
    v.group.updateMatrixWorld(true);
    return true;
  }
  // TASK-058 · a car alone, as it moves: its picture at subframes of a frame (a 180-degree shutter), only the part of
  // the frame it covers (a lens offset on that rectangle), averaged on a 2D canvas (premultiplied: 'lighter' at 1/n).
  // poses: [{ x, y, z, yaw, beat }], who: "car" (the ride) | "cop"; returns { url, rect: [x, y, w, h] } in frame px
  function carShot(o, who, poses, { margin = 16 } = {}) {
    if (!PLAN) throw new Error("plan first");
    const v = who === "cop" ? S.cop() : S.veh(), g = v.group;
    const save0 = { p: g.position.clone(), q: g.quaternion.clone(), vis: g.visible };
    const s = save(); setCam(o);
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    const corners = (bb) => { const out = []; for (const xx of [bb.min.x, bb.max.x]) for (const yy of [bb.min.y, bb.max.y]) for (const zz of [bb.min.z, bb.max.z]) out.push(new V(xx, yy, zz)); return out; };
    const place = (q) => { g.visible = true; g.position.set(q.x, q.y, q.z); g.rotation.set(0, q.yaw, 0); g.updateMatrixWorld(true); if (who === "cop" && v.beacons?.length) { const off = q.beat === 2; v.beacons[0].material.emissiveIntensity = off || q.beat ? 0.15 : 2.8; v.beacons[1].material.emissiveIntensity = off || !q.beat ? 0.15 : 2.8; } };
    for (const q of poses) {
      place(q);
      let bb = null; g.traverse((m) => { if (m.isMesh && m.visible && m.geometry) { if (!m.geometry.boundingBox) m.geometry.computeBoundingBox(); const b = m.geometry.boundingBox.clone().applyMatrix4(m.matrixWorld); bb = bb ? bb.union(b) : b; } });
      // (a corner behind the lens, or one projected far off: the car is at the lens; take the whole frame)
      for (const c of corners(bb)) { const w = S.warpV(c).project(camera); const px = (w.x * 0.5 + 0.5) * o.w, py = (-w.y * 0.5 + 0.5) * o.h; if (w.z > 1 || w.z < -1 || Math.abs(px) > 4 * o.w || Math.abs(py) > 4 * o.h) { x0 = y0 = -1e9; x1 = y1 = 1e9; continue; } x0 = Math.min(x0, px); y0 = Math.min(y0, py); x1 = Math.max(x1, px); y1 = Math.max(y1, py); }
    }
    restore(s);
    x0 = Math.max(0, Math.floor(x0 - margin)); y0 = Math.max(0, Math.floor(y0 - margin)); x1 = Math.min(o.w, Math.ceil(x1 + margin)); y1 = Math.min(o.h, Math.ceil(y1 + margin));
    if (x1 - x0 < 4 || y1 - y0 < 4) { g.position.copy(save0.p); g.quaternion.copy(save0.q); g.visible = save0.vis; return null; }
    const rw = x1 - x0, rh = y1 - y0, acc = document.createElement("canvas"); acc.width = rw; acc.height = rh;
    const cx = acc.getContext("2d"); cx.globalCompositeOperation = "lighter"; cx.globalAlpha = 1 / poses.length;
    const sh = o.shift || [0, 0];
    try {
      for (const q of poses) {
        place(q);
        // the frame's lens shift, then the rectangle: setCam's offset is (-sx*w, -sy*h); this one adds (x0, y0)
        const oo = { ...o, shift: null, sub: [o.w, o.h, -sh[0] * o.w + x0, -sh[1] * o.h + y0, rw, rh] };
        layerSub(oo, [who], rw, rh, () => cx.drawImage(R.domElement, 0, 0)); // (before the canvas is sized back: that clears it)
      }
    } finally { g.position.copy(save0.p); g.quaternion.copy(save0.q); g.visible = save0.vis; }
    return { url: acc.toDataURL("image/png"), rect: [x0, y0, rw, rh] };
  }
  // layer() on a part of the frame (o.sub: the view offset's arguments), at the canvas size of that part
  function layerSub(o, keep, rw, rh, after) {
    const K = new Set(keep), hidden = [], arrays = [];
    for (const [x, nm] of PLAN.meshes) if (!K.has(nm) && x.visible) { x.visible = false; hidden.push(x); }
    for (const [x, lab] of PLAN.inst) { if (x.visible) { x.visible = false; hidden.push(x); } }
    const s = save();
    try {
      R.setPixelRatio(1); R.setSize(rw, rh, false);
      setCam({ ...o, w: o.sub[0], h: o.sub[1] });
      camera.setViewOffset(...o.sub); camera.updateProjectionMatrix();
      S.sun.shadow.autoUpdate = false; S.sun.shadow.needsUpdate = false;
      scene.background = null; R.setClearColor(0x000000, 0);
      R.setRenderTarget(null); R.render(scene, camera);
      after?.();
    } finally {
      for (const x of hidden) x.visible = true;
      R.setClearColor(s.cc, s.ca); scene.background = s.bg; S.sun.shadow.autoUpdate = s.sh[0];
      restore(s); R.setPixelRatio(s.pr); R.setSize(s.size[0], s.size[1], false);
    }
  }
  window.__R = { shot, plan, layer, project, setCam, park, W, carShot };
})();
