// Cromatic · metro mockups (TASK-062): the three cameras, as plain numbers (shared by the 3D stage and the Node tools).
// pos in metres (the station's frame: see scene/station.js), yaw in degrees (0: looking down -z), hfov in degrees,
// shift: the lens shift in frames (y > 0 shows more of what is below the horizon), focus in metres, fstop.
export const TRACKZ = -3.12, HW = 1.4;
export const INSIDE = { x: 1.85, y: 1.62, z: 0 }; // the camera inside the banner car, car-local
export const SHOTS = {
  platform: { W: 1920, H: 1080, cam: { pos: [0, 1.68, 4.5], yaw: -7, hfov: 56, aspect: 16 / 9, shift: [0, 0.13], focus: 10.3, fstop: 2.0 }, shadowX: 1.5 },
  train: { W: 1920, H: 1080, cam: { pos: [0, 1.6, 4.5], yaw: 0, hfov: 58, aspect: 16 / 9, shift: [0, 0.056], focus: 6.22, fstop: 2.8 }, shadowX: 0 },
  inside: { W: 1080, H: 1350, cam: { pos: [INSIDE.x, INSIDE.y, TRACKZ + INSIDE.z], yaw: 180, hfov: 64, aspect: 1080 / 1350, shift: [0, 0.12], focus: 1.32, fstop: 2.8 }, dev: { expo: 0.62 } }
};
// a level camera's numbers: focal length in px, the horizon's row, the column of the camera's axis
export function camPx(shot) {
  const s = SHOTS[shot], c = s.cam, f = s.W / 2 / Math.tan((c.hfov / 2) * Math.PI / 180);
  return { f, horizon: s.H / 2 - (c.shift?.[1] || 0) * s.H, cx: s.W / 2 - (c.shift?.[0] || 0) * s.W, W: s.W, H: s.H };
}

// the near wall's frames (shots 1 and 3 look at them) and the far wall's (seen across the platform from inside the train)
export const NEAR = [{ kind: "landscape", x: 0, w: 3.0, yTop: 2.75 }, { kind: "portrait", x: -2.6, w: 1.2, yTop: 2.75 }, { kind: "portrait", x: 2.6, w: 1.2, yTop: 2.75 }, { kind: "landscape", x: -5.2, w: 3.0, yTop: 2.75 }, { kind: "landscape", x: 5.2, w: 3.0, yTop: 2.75 }, { kind: "portrait", x: -7.8, w: 1.2, yTop: 2.75 }, { kind: "portrait", x: 7.8, w: 1.2, yTop: 2.75 }];
export const FAR = [-27, -21, -15, -9, -3, 3, 9, 15, 21, 27].map((x, i) => ({ kind: i % 2 ? "landscape" : "wide", x, w: i % 2 ? 3.0 : 3.6, yTop: 2.75 }));
export const AR = { landscape: 1600 / 1067, portrait: 900 / 1621, tall: 900 / 2025, wide: 1600 / 800, banner: 1600 / 641 };
export const WALLZ = -5.7;
// a world point to the shot's px (a level camera turned by yaw about y)
export function proj(shot, p) {
  const s = SHOTS[shot], c = s.cam, th = ((c.yaw || 0) * Math.PI) / 180, P = camPx(shot);
  const d = [p[0] - c.pos[0], p[1] - c.pos[1], p[2] - c.pos[2]];
  const right = [Math.cos(th), 0, -Math.sin(th)], fwd = [-Math.sin(th), 0, -Math.cos(th)];
  const z = d[0] * fwd[0] + d[2] * fwd[2], x = d[0] * right[0] + d[2] * right[2];
  return [P.cx + (P.f * x) / z, P.horizon - (P.f * d[1]) / z, z];
}
