// Cromatic · stories in Lottie · story C8 (TASK-065i, Daniel: "in place of the Casa Poporului shot, a cinematic pass in
// front of OMA, Brasov visible behind it, light and movement inside"): OMA Coffee at night, low across the street, the
// camera dollying along the kerb while the 1300 tears past between it and the shop; Tampa and the BRASOV letters over
// the roof; the room lit behind the glass, its people moving (omaRoom.js). renderV6.mjs JOB=a6 SET=c8 SCHEME=nightlife.
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), sm = (t) => t * t * (3 - 2 * t), lerp = (a, b, t) => a + (b - a) * t;
const L3 = (a, b, u) => a.map((v, i) => lerp(v, b[i], u));
const W = 2160, H = 3840, YV = 1.73, DUR = 1.5;
const car = (t) => ({ x: 842, y: YV, z: 4505 + 125 * t, yaw: 0, lights: 1 });
export const C8A = {
  oma: { dur: DUR, room: true, car, cam: (t) => { const u = sm(clamp(t / DUR)); return { pos: L3([905, 6.5, 4606], [900, 7.5, 4583], u), tgt: L3([620, 50, 4582], [620, 48, 4562], u), fov: 70, shift: [0, 0.1], level: true, w: W, h: H }; } }
};
