// Cromatic · stories in Lottie (TASK-057): the cameras of the pilot's shots, in the city's logical coordinates (the
// map's x, z; y up). Rendered by render.mjs through the harness; read by build.mjs for the parallax.
// Every street camera is level (verticals stay vertical) with a lens shift that puts the horizon low; its picture is
// wider than the story (OVER: room for the sideways drift) and twice the story's size (detail kept at 1080x1920).
export const STORY = { w: 1080, h: 1920 }, K = 2, OVER = 1.2;
const street = (o) => ({ level: true, w: Math.round(STORY.w * K * OVER / 2) * 2, h: STORY.h * K, ...o });
export const SHOTS = {
  // A1 · Bird's eye: one camera high over the east of the city, three nested lenses (each half the last's field), so a
  // zoom of x4.5 into Two Minutes never runs out of pixels
  "a-air": { pos: [2300, 3000, 4700], tgt: [640, 0, 4260], fovs: [30, 15.25, 7.67], w: STORY.w * K, h: STORY.h * K, noMesa: true,
    pins: { tm: [640, 60, 4260], lab: [602, 70, 4142], hq: [1010, 100, 4120], fight: [652, 20, 4114], round: [1500, 0, 5000] } },
  // A2 · Street level on Str. C. Aricescu, looking west at Two Minutes under the festoon; the yellow ride parked ahead
  "a-street": street({ pos: [1000, 9.5, 4255], tgt: [640, 9.5, 4262], fov: 57, shift: [0, 0.13], park: [880, null, 4243, -1.5708],
    cuts: [["near", 150], ["mid", 560], ["far", 1e9]], skyD: 6000,
    pins: { tm: [640, 70, 4260], sign: [790, 40, 4222], car: [880, 12, 4243] } }),
  // B · the corner of the Two Min Lab behind the street's sign: the same street, a few steps on (colour, then Sketchbook)
  "b-street": street({ pos: [850, 8, 4285], tgt: [610, 8, 4140], fov: 54, shift: [0, 0.16], noMesa: true, // (the pale mesa read as a wall here)
    cuts: [["near", 125], ["mid", 340], ["far", 1e9]], skyD: 6000,
    pins: { sign: [790, 40, 4222], lab: [602, 60, 4142], fight: [652, 20, 4114] } })
};
