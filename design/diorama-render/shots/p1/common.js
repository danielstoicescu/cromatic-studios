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

// a row of sakura trees (story set dressing): trunks and clouds of blossom along a line, both kerbs
export function sakuraRow(ctx, { x = [800, 884], z0, z1, step = 46, seed = 3 } = {}) {
  const { S, K } = ctx, G = new K.Group(); S.scene.add(G);
  let r = seed; const R = () => ((r = (r * 16807) % 2147483647) / 2147483647);
  const bark = new K.MeshStandardMaterial({ color: "#5a3a34", roughness: 0.85 });
  const pinks = ["#f6b9cf", "#f4a6c4", "#fbd0df", "#f29ab9"].map((c) => new K.MeshStandardMaterial({ color: c, roughness: 0.7, emissive: new K.Color(c), emissiveIntensity: 0.06 }));
  for (const xs of x) for (let z = z0; z <= z1; z += step) {
    const t = new K.Group(); t.position.set(xs + (R() - 0.5) * 6, 0, z + (R() - 0.5) * 10); G.add(t);
    const h = 16 + R() * 6, tr = new K.Mesh(new K.CylinderGeometry(1.1, 1.7, h, 8), bark); tr.position.y = h / 2; t.add(tr);
    for (let i = 0; i < 9; i++) { const pu = new K.Mesh(new K.IcosahedronGeometry(6 + R() * 4, 1), pinks[i % 4]); pu.position.set((R() - 0.5) * 16, h + (R() - 0.2) * 9, (R() - 0.5) * 16); pu.scale.y = 0.75; t.add(pu); }
    t.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  }
  return { dispose() { G.parent?.remove(G); } };
}
// the wet street's mirror: a real reflection (three's Reflector: the scene drawn again from under the street) laid over
// the asphalt, darkened and part transparent, so the windows, the neon and the lamps are doubled in it
export async function mirror(ctx, { centre, size = 1600, y = 0.6, opacity = 0.42, tint = "#8a8fa8" } = {}) {
  const { S, K } = ctx, T = await import("/__three/build/three.module.js"), { Reflector } = await import("/__three/examples/jsm/objects/Reflector.js");
  const m = new Reflector(new T.PlaneGeometry(size, size), { textureWidth: 2048, textureHeight: 2048, color: tint, multisample: 4 });
  m.material.transparent = true; m.material.depthWrite = false; m.material.uniforms.color.value.set(tint);
  m.material.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace("gl_FragColor = vec4( blendOverlay( base.rgb, color ), 1.0 );", "gl_FragColor = vec4( base.rgb * color, " + opacity.toFixed(3) + " );"); };
  m.rotation.x = -Math.PI / 2; const c = S.warpV(new K.Vector3(centre[0], y, centre[2])); m.position.copy(c); m.renderOrder = 1; m.userData.dioNoCast = true; m.castShadow = false;
  S.scene.add(m);
  return { dispose() { m.parent?.remove(m); m.dispose?.(); } };
}

// focus that rides with the car: a plane square to the lens through the car's middle at each instant (camera: a path)
export const focusOnCar = (cam, car) => (t) => { const c = cam.at(Math.max(cam.t0, Math.min(cam.t1, t))), p = car(t); return [p, [p[0] + c.right[0] * 10, p[1] + c.right[1] * 10, p[2] + c.right[2] * 10], [p[0] + c.up[0] * 10, p[1] + c.up[1] * 10, p[2] + c.up[2] * 10]]; };
