// Cromatic · stories in Lottie · story D2 (TASK-065c, Daniel's storyboard for "around the city"): the new shots, in the
// map's logical x, z (y up), rendered here (renderV4.mjs JOB=d2) for the story-d branch's build-d2.mjs.
//   drift    out of the street past Printoteca onto the boulevard: low on the boulevard, the ride comes round the
//            corner in a long slide, towards the lens, in slow motion (0.4x), heavy motion blur (8 subframes)
//   skyline  Fintech Boulevard from the road, low: the towers as a skyline; the map's tags over them (anchors here)
//   steam    the Steam tower by day, square on (its facade)
//   sip      the Two Minutes corner from above at night (story C's camera): the F1 drifting through it
//   endWater the roundabout at night (story D's end camera): the fountain's water frame by frame
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), sm = (t) => t * t * (3 - 2 * t), lerp = (a, b, t) => a + (b - a) * t;
const YV = 1.73;
// a path: straight up the side street (+z), a quarter turn right onto the boulevard (heading -x), on towards the lens
function driftPose(s) {
  const z0 = 5940, zt = 6050, R = 50, cx = 1450, Lst = zt - z0, Larc = (Math.PI / 2) * R;
  let x, z, h;
  if (s < Lst) { x = 1500; z = z0 + s; h = 0; }
  else if (s < Lst + Larc) { const a = (s - Lst) / R; x = cx + R * Math.cos(a); z = zt + R * Math.sin(a); h = a * -1 * 1 + 0; h = -a; }
  else { x = cx - (s - Lst - Larc); z = zt + R; h = -Math.PI / 2; }
  return { x, z, h, u: clamp((s - Lst + 10) / (Larc + 60)) };
}
export const D2 = {
  drift: {
    cam: { pos: [1220, 2.2, 6112], tgt: [1463, 14, 6052], fov: 54, shift: [0, 0.14], level: true, w: 2160, h: 3840 },
    slow: 0.5, dur: 4.6, sub: 8, shutter: 1 / 40, // (screen seconds; action = screen * slow; the shutter in action seconds)
    // speed along the path: 170, scrubbing to 60 through the slide, stopping short of the lens
    pose: (ta) => {
      const s = ta < 0.6 ? 190 * ta : ta < 1.15 ? 114 + 190 * (ta - 0.6) - 60 * (ta - 0.6) ** 2 : 200 + 124 * (ta - 1.15) - 30 * (ta - 1.15) ** 2;
      const q = driftPose(Math.min(s, 330)), slide = 0.95 * Math.sin(Math.PI * clamp(q.u)) * (q.u > 0 && q.u < 1 ? 1 : 0);
      return { x: q.x, y: YV, z: q.z, yaw: q.h - slide, lights: 1, slide: slide > 0.05 };
    }
  },
  skyline: {
    cam: { pos: [2058, 38, 5430], tgt: [2088, 60, 4700], fov: 48, shift: [0, 0.04], level: true, w: 2160, h: 3840 },
    tags: { Assetto: [2215, 92, 4760], Investimental: [2205, 120, 4500], Venevo: [1988, 70, 5160], Longshield: [1988, 96, 4880], "Infinity Capital": [1988, 90, 4600], ESD: [2205, 70, 5280] }
  },
  steam: { cam: { pos: [760, 8, 5600], tgt: [985, 40, 5640], fov: 58, shift: [0, 0.08], level: true, w: 2160, h: 3840 } },
  sip: {
    cam: { pos: [858, 300, 4296], tgt: [858, 0, 4297], fov: 52, level: false, w: 2160, h: 3840 },
    dur: 1.6, veh: "f1"
  },
  endWater: { cam: { pos: [1680, 22, 4300], tgt: [1500, 6, 4250], fov: 55, w: 2160, h: 3840 }, dur: 3.2, box: null }
};
