// Cromatic · diorama renders · story E8 (TASK-111, the rides, Daniel 24 Oct: "cât mai realistă"): every ride in the
// part of the city where it lives, filmed like a 1:87 model on a macro lens: low, street level, slow tracking moves that
// keep the ride still in the frame, NO motion blur (shutter 0: every sub-frame at the same instant; the samples only
// buy the lens, the soft sun, the sky light and the anti-aliasing). Story-only set dressing (a grass field, a wet street)
// lives in the render page and is undone by each shot's dispose().
export { heroCar, hideMapRide, mapRide, followKey, world, NIGHT, warpScale, L3 } from "../d7/common.js";
export { paintSky } from "../../src/sky.js";
export { petals, wet, mirror, sakuraRow } from "../p1/common.js";
export { hideNear } from "../../src/set.js";
import { cameraPath } from "../../src/camera.js";

// the E7 clock (30 fps), the cards' clock: the renders follow it frame for frame
export const CLOCK = { t1: [0, 36], t2: [36, 78], t3: [78, 114], van: [114, 159], chrome: [159, 204], scooter: [204, 270], rush: [270, 333], patrol: [333, 405], leadin: [405, 450], end: [450, 510] };
export const dur = (k, extra = 0) => (CLOCK[k][1] - CLOCK[k][0] + extra) / 30;

// a tracking camera: keys every 0.125 s from camAt(t) -> { pos, look, fov?, focus? } (dense keys: the Catmull-Rom
// follows the function exactly, so the ride stays where the frame put it)
export function track(D, camAt, step = 0.125) {
  const keys = []; for (let t = 0; t <= D + 1e-6; t += step) keys.push({ t: +t.toFixed(4), fov: 30, ...camAt(t) });
  if (keys[keys.length - 1].t < D) keys.push({ t: D, fov: 30, ...camAt(D) });
  return cameraPath({ keys });
}
export const smooth = (u) => { u = Math.max(0, Math.min(1, u)); return u * u * (3 - 2 * u); };

// a grass field: a ground of greens (vertex colours, a little relief) and, near the lens, instanced blades of grass at
// the model's scale (1 m = 15 units: blades 0.8 to 2.6 units, a static-grass mat as on a real layout), some seed heads
export async function grass(ctx, { x0, x1, z0, z1, bx0 = x0, bx1 = x1, bz0 = z0, bz1 = z1, density = 1.1, y = 0.25, seed = 5 } = {}) {
  const { S } = ctx, K = await import("/__three/build/three.module.js"), G = new K.Group(); S.scene.add(G);
  let r = seed; const R = () => ((r = (r * 16807) % 2147483647) / 2147483647);
  const greens = ["#5e8a3a", "#6f9a44", "#7fa54c", "#58803a", "#8aa856", "#9aa860", "#4f7634"].map((c) => new K.Color(c));
  // the ground (warped by the city's shader like everything else)
  const gw = x1 - x0, gd = z1 - z0, nx = Math.ceil(gw / 6), nz = Math.ceil(gd / 6), geo = new K.PlaneGeometry(gw, gd, nx, nz);
  geo.rotateX(-Math.PI / 2); geo.translate((x0 + x1) / 2, y, (z0 + z1) / 2);
  const col = [], pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) { const c = greens[Math.floor(R() * greens.length)].clone().lerp(greens[0], R() * 0.3).multiplyScalar(0.85 + R() * 0.25); col.push(c.r, c.g, c.b); pos.setY(i, y + R() * 0.25); }
  geo.setAttribute("color", new K.Float32BufferAttribute(col, 3)); geo.computeVertexNormals();
  const ground = new K.Mesh(geo, new K.MeshStandardMaterial({ vertexColors: true, roughness: 0.95, metalness: 0 })); ground.receiveShadow = true; ground.castShadow = false; ground.userData.dioNoCast = true; G.add(ground);
  // the blades: a tapered, slightly bent strip
  const blade = new K.PlaneGeometry(0.22, 1, 1, 3); { const p = blade.attributes.position; for (let i = 0; i < p.count; i++) { const v = p.getY(i) + 0.5; p.setX(i, p.getX(i) * (1 - v * 0.85)); p.setZ(i, v * v * 0.25); p.setY(i, v); } blade.computeVertexNormals(); }
  const n = Math.round((bx1 - bx0) * (bz1 - bz0) * density), mat = new K.MeshStandardMaterial({ roughness: 0.8, side: K.DoubleSide });
  const I = new K.InstancedMesh(blade, mat, n), m = new K.Matrix4(), q = new K.Quaternion(), e = new K.Euler(), s = new K.Vector3(), p = new K.Vector3(), c = new K.Color();
  for (let i = 0; i < n; i++) {
    const h = 0.8 + Math.pow(R(), 1.5) * 1.8; e.set((R() - 0.5) * 0.5, R() * Math.PI * 2, (R() - 0.5) * 0.5); q.setFromEuler(e); s.set(0.7 + R() * 0.6, h, 1); p.set(bx0 + R() * (bx1 - bx0), y, bz0 + R() * (bz1 - bz0));
    I.setMatrixAt(i, m.compose(p, q, s)); I.setColorAt(i, c.copy(greens[Math.floor(R() * greens.length)]).multiplyScalar(0.8 + R() * 0.45).lerp(new K.Color("#b8b070"), R() < 0.08 ? 0.6 : 0));
  }
  I.castShadow = true; I.receiveShadow = true; G.add(I);
  return { dispose() { G.parent?.remove(G); geo.dispose(); blade.dispose(); } };
}

// a hard key/fill for night shots from a lamp position, warped (README: point lights are placed bent)
export function lamp(ctx, { at, color = "#ffd7a0", I = 1800, d = 200 }) { const { S, K } = ctx, L = new K.PointLight(color, I, d, 2); L.position.copy(S.warpV(new K.Vector3(...at))); L.castShadow = false; S.scene.add(L); return { L, dispose() { L.parent?.remove(L); } }; }

// asphalt: the map's painted road (salmon, lilac... per world: any flat, saturated warm or violet paint low on the
// ground) turned to a model's asphalt (a dark warm grey, matte), so the street reads as a street in a photograph; the
// lane markings and the pavements stay. Undone on dispose.
export function asphalt(ctx, { color = "#6e6862", rough = 0.88 } = {}) {
  const { S, K } = ctx, done = [], cache = new Map(), hsl = {};
  S.scene.traverse((o) => {
    if (!o.isMesh || !o.visible || Array.isArray(o.material) || !o.material.isMeshStandardMaterial || o.material.transparent || o.material.map || !o.material.color) return;
    if (!o.geometry.boundingBox) o.geometry.computeBoundingBox();
    const b = o.geometry.boundingBox.clone().applyMatrix4(o.matrixWorld); if (b.max.y > 3 || b.max.y - b.min.y > 2.5) return;
    o.material.color.getHSL(hsl); const h = hsl.h * 360;
    if (!(hsl.s > 0.3 && hsl.l > 0.4 && hsl.l < 0.85 && (h < 28 || h > 250))) return;
    let m = cache.get(o.material); if (!m) { m = o.material.clone(); m.color.set(color); m.roughness = rough; m.metalness = 0; m.envMapIntensity = 0.25; m.userData.dioKeep = true; cache.set(o.material, m); }
    done.push([o, o.material]); o.material = m;
  });
  return () => { for (const [o, m] of done) o.material = m; };
}

// a tilted lens (Scheimpflug, the tilt-shift look): the plane of focus goes through the ride (sub(t): a point) square to
// the frame's sideways direction, its top leaned towards the lens by deg: the ride stays sharp, the city above it (and
// the street under the lens) fall further out of focus than a plain lens at the same f-stop would put them.
//   lens: { fstop: 22, plane: tilt(camera, (t) => [x, y, z], 24) }
export const tilt = (cam, sub, deg = 24) => (t) => {
  const c = cam.at(Math.max(cam.t0, Math.min(cam.t1, t))), p = sub(t), a = (deg * Math.PI) / 180;
  const u = c.up.map((v, i) => v * Math.cos(a) - c.fwd[i] * Math.sin(a));
  return [p, [p[0] + c.right[0] * 10, p[1] + c.right[1] * 10, p[2] + c.right[2] * 10], [p[0] + u[0] * 10, p[1] + u[1] * 10, p[2] + u[2] * 10]];
};
