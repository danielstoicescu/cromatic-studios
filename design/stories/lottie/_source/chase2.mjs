// Cromatic · stories in Lottie · story C v2 (TASK-065): the chase through the city at night, shot by shot. Each shot:
// a fixed camera (or a wide one the frame pans across), the yellow Dacia's path (and the police car's) in the map's
// logical x, z, its lights; time in seconds from the shot's start. Read by renderC2.mjs and buildC2.mjs.
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const sm = (t) => t * t * (3 - 2 * t);
const lerp = (a, b, t) => a + (b - a) * t;
const wrap = (a) => { while (a > Math.PI) a -= 2 * Math.PI; while (a < -Math.PI) a += 2 * Math.PI; return a; };
// a polyline walked at distance s: its point and heading (yaw: atan2(dx, dz), the map's convention)
export function walker(pts) {
  const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const at = (s) => { s = clamp(s, 0, L[L.length - 1]); let i = 1; while (i < L.length - 1 && L[i] < s) i++; const u = (s - L[i - 1]) / (L[i] - L[i - 1] || 1), a = pts[i - 1], b = pts[i]; return { x: lerp(a[0], b[0], u), z: lerp(a[1], b[1], u), h: Math.atan2(b[0] - a[0], b[1] - a[1]) }; };
  return { at, len: L[L.length - 1] };
}
// an arc as points (centre, radius, from/to angle in radians on (cos, sin) of (x, z))
const arc = (cx, cz, r, a0, a1, n = 24) => Array.from({ length: n + 1 }, (_, i) => { const a = a0 + ((a1 - a0) * i) / n; return [cx + r * Math.cos(a), cz + r * Math.sin(a)]; });
const YV = 1.73, YC = 1.7;
// (each car's pose: x, y, z, yaw, lights 0/1, and for the police its lamps' beat (0 red, 1 blue, 2 off))
const beatAt = (t) => Math.floor((t * 1000) / 190) % 2;

export const SHOTS = {
  // 1 · Olari 9: low on the courtyard's stones in front of the house's arches. The ride waits under an arch, lights off;
  // the engine catches (it shudders), the headlights come on, it launches at the lens and past it on the right
  olari: {
    cam: { pos: [1150, 1.8, 7290], tgt: [1075, 25, 7350], fov: 62, shift: [0, 0.1], level: true },
    dur: 2.7,
    yellow: (() => {
      const P0 = [1088, 7346], P1 = [1143, 7281], P2 = [1205, 7208], w = walker([P0, P1, P2]), h0 = 2.27, T0 = 1.35, A = 170;
      return (t) => {
        const lights = t < 1.0 ? 0 : t < 1.06 ? 1 : t < 1.1 ? 0 : 1;
        if (t < T0) { const run = t > 0.7 ? 1 : 0, k = run ? 1 - 0.5 * clamp((t - 0.7) / 0.65) : 0; return { x: P0[0], y: YV, z: P0[1], yaw: h0, lights, roll: run * 0.014 * k * Math.sin(t * 70), pitch: 0 }; }
        const s = 0.5 * A * (t - T0) ** 2, q = w.at(s), k = clamp((t - T0) / 0.35);
        return { x: q.x, y: YV, z: q.z, yaw: lerp(h0, q.h, sm(k)), lights: 1, pitch: -0.035 * Math.sin(Math.PI * clamp((t - T0) / 0.5)), roll: 0 };
      };
    })()
  },
  // 2 · Casa Poporului: the Aesthetic Court's gate frames the palace; the ride crosses the frame on the avenue, close
  palace: {
    cam: { pos: [1470, 3, 4570], tgt: [1775, 50, 4570], fov: 64, shift: [0, 0.12], level: true },
    dur: 1.25,
    yellow: (t) => ({ x: 1530, y: YV, z: 4470 + 205 * (t - 0.15), yaw: 0, lights: 1 })
  },
  // 3 · Steam: a wide frame the camera pans across, following the ride up the coffee street past Steam Coffee Shop
  steam: {
    cam: { pos: [770, 4, 5590], tgt: [985, 12, 5650], fov: 60, shift: [0, 0.1], level: true, wide: 2.6 },
    dur: 1.5,
    yellow: (t) => ({ x: 836, y: YV, z: 5470 + 215 * t, yaw: 0, lights: 1 })
  },
  // 4 · the fountain's roundabout (the palace behind): the ride comes up, drifts round the south-west quarter, out west;
  // the frame crash-zooms on it at the apex
  fountain: {
    cam: { pos: [1380, 70, 4130], tgt: [1500, 0, 4260], fov: 42, level: false },
    dur: 1.7,
    yellow: (() => {
      const pts = [[1500, 4040], [1500, 4176], ...arc(1500, 4260, 80, -Math.PI / 2, -Math.PI, 20).slice(1), [1420, 4300], [1380, 4300]];
      const w = walker(pts), V = 175;
      return (t) => { const s = V * (t - 0.05), q = w.at(s), u = clamp((s - 136) / ((80 * Math.PI) / 2)), b = 0.78 * Math.sin(Math.PI * clamp(u * 1.05)); return { x: q.x, y: YV, z: q.z, yaw: q.h + b, lights: 1, slide: u > 0 && u < 1 }; };
    })()
  },
  // 5 · the Slow Coffee Festival's dome (Romexpo), lit: the ride cuts across the plaza in front of the lens, fast
  scf: {
    cam: { pos: [1462, 3, 5060], tgt: [1150, 40, 5160], fov: 62, shift: [0, 0.1], level: true },
    dur: 0.85,
    yellow: (() => { const A = [1398, 5025], B = [1432, 5131], w = walker([A, B]), h = Math.atan2(B[0] - A[0], B[1] - A[1]); return (t) => { const q = w.at(290 * (t - 0.12)); return { x: q.x, y: YV, z: q.z, yaw: h, lights: 1 }; }; })()
  },
  // 6 · the Two Minutes corner from straight above: the drift through the corner of Aricescu, its marks on the road
  corner: {
    cam: { pos: [858, 300, 4296], tgt: [858, 0, 4297], fov: 52, level: false },
    dur: 1.4,
    yellow: (() => {
      const pts = [[1030, 4258], [905, 4258], ...arc(905, 4340, 82, -Math.PI / 2, -Math.PI, 20).slice(1), [823, 4420], [823, 4520]];
      const w = walker(pts), V = 200;
      return (t) => { const s = V * t, q = w.at(s), u = clamp((s - 125) / 129), b = 0.7 * Math.sin(Math.PI * clamp(u * 1.05)); return { x: q.x, y: YV, z: q.z, yaw: q.h + b, lights: 1, slide: u > 0 && u < 1 }; };
    })()
  },
  // 7 · Fintech Boulevard: low on the road; the ride comes at the lens, the police behind it, lamps going; it pulls
  // over to the right and stops; the police stop behind it. Caught.
  fintech: {
    cam: { pos: [2062, 3.2, 4880], tgt: [2072, 3.2, 4400], fov: 55, shift: [0, 0.1], level: true },
    dur: 3.9,
    yellow: (t) => {
      // up the boulevard at 230, braking from 1.55 s, easing over to the kerb, stopped at 2.55 s
      const z0 = 4330, v = 230, tb = 1.55, td = 1.0, zb = z0 + v * tb;
      const z = t < tb ? z0 + v * t : zb + v * (Math.min(t, tb + td) - tb) - (v / (2 * td)) * (Math.min(t, tb + td) - tb) ** 2;
      const k = sm(clamp((t - tb) / td)), x = lerp(2068, 2084, k), dx = 16 * (6 * clamp((t - tb) / td) * (1 - clamp((t - tb) / td))) / td, vz = t < tb ? v : Math.max(1, v * (1 - (t - tb) / td));
      return { x, y: YV, z, yaw: t < tb + td ? Math.atan2(dx, vz) : 0.02, lights: 1 };
    },
    cop: (t) => {
      const t0 = 0.45, z0 = 4150, v = 260, tb = 1.75, td = 1.05, tt = t - t0;
      if (tt < 0) return null;
      const zb = z0 + v * tb;
      const z = tt < tb ? z0 + v * tt : zb + v * (Math.min(tt, tb + td) - tb) - (v / (2 * td)) * (Math.min(tt, tb + td) - tb) ** 2;
      const k = sm(clamp((tt - tb) / td));
      return { x: lerp(2070, 2077, k), y: YC, z, yaw: 0.03 * k, lights: 1, beat: beatAt(t) };
    }
  }
};
export const ORDER = ["olari", "palace", "steam", "fountain", "scf", "corner", "fintech"];
