// Cromatic · diorama renders · story P1 (TASK-129, Postcard): set pieces for the most beautiful frames of the city.
// Story-only: sakura petals falling, a rain-wet street, painted skies with the sun in them (src/sky.js). The site is
// never changed: all of this lives in the render page and is undone by each shot's dispose().
export { heroCar, hideMapRide, mapRide, followKey, world, NIGHT, warpScale, L3 } from "../d7/common.js";
export { paintSky } from "../../src/sky.js";
// petals: n small pink blossoms over a box (logical centre, half size, height), drifting down and turning; pose(t)
export function petals(ctx, { centre, half = [140, 160], height = 90, n = 420, seed = 7 } = {}) {
  const { S, K } = ctx, G = new K.Group(); S.scene.add(G);
  let r = seed; const R = () => ((r = (r * 16807) % 2147483647) / 2147483647);
  const cols = ["#f7b8cf", "#f4a3c0", "#fbd3e0", "#ffffff", "#f290b2"].map((c) => new K.MeshStandardMaterial({ color: c, roughness: 0.55, side: K.DoubleSide, emissive: new K.Color(c), emissiveIntensity: 0.12 }));
  const geo = new K.CircleGeometry(0.9, 6); geo.scale(1, 0.62, 1);
  const P = [];
  for (let i = 0; i < n; i++) {
    const m = new K.Mesh(geo, cols[i % cols.length]); m.castShadow = false; m.userData.dioNoCast = true; G.add(m);
    P.push({ m, x: centre[0] + (R() * 2 - 1) * half[0], z: centre[2] + (R() * 2 - 1) * half[1], y0: R() * height, v: 6 + R() * 7, sx: 2 + R() * 4, ph: R() * 6.28, rx: R() * 3, ry: R() * 3, s: 0.8 + R() * 0.9 });
  }
  const pose = (t) => { for (const p of P) { const y = ((p.y0 - p.v * t) % height + height) % height; p.m.position.set(p.x + Math.sin(t * 0.9 + p.ph) * p.sx, y + 1, p.z + Math.cos(t * 0.7 + p.ph) * p.sx * 0.6); p.m.rotation.set(p.rx + t * 1.7, p.ry + t * 1.3, p.ph + t); p.m.scale.setScalar(p.s); } };
  pose(0);
  return { pose, dispose() { G.parent?.remove(G); } };
}
// a rain-wet street: everything flat and low near (x, z) turned to wet asphalt (glossy, the city's reflections in it)
export function wet(ctx, { centre, r = 500, rough = 0.12, refl = 1.1 } = {}) {
  const { S, K } = ctx, env = S.mats.omaGlow.envMap, v = new K.Vector3(), done = [], cache = new Map();
  S.scene.traverse((o) => {
    if (!o.isMesh || o.isInstancedMesh || !o.visible || Array.isArray(o.material) || !o.material.isMeshStandardMaterial || o.material.transparent) return;
    if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    const b = o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld); if (b.max.y > 4 || b.max.y - b.min.y > 3) return;
    b.getCenter(v); const big = b.max.x - b.min.x > 8000; if (!big && Math.hypot(v.x - centre[0], v.z - centre[2]) > r) return;
    let m = cache.get(o.material); if (!m) { m = o.material.clone(); m.roughness = rough; m.metalness = 0.05; m.envMap = env; m.envMapIntensity = refl; m.color.multiplyScalar(0.6); m.userData.dioKeep = true; cache.set(o.material, m); }
    done.push([o, o.material]); o.material = m;
  });
  return { n: done.length, dispose() { for (const [o, m] of done) o.material = m; } };
}
