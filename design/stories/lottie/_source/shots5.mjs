// Cromatic · stories in Lottie · v5 (TASK-065d, Daniel's notes on v4): the cameras that change, in the map's logical
// x, z (y up). A: OMA from further away (Tampa and its BRASOV letters behind it, the shop lit from inside), the Slow
// Coffee dome from further away (the streets round it). C: see chase5.mjs.
export const A6 = {
  // OMA from across the coffee street: the whole shop on the right, Tampa with the white BRASOV letters behind it on
  // the left; its two arches glow warm from inside (the glass lit in the page; the people drawn in the story)
  // (2592 x 4608: the story's own shape, so the whole width shows; the lens of a 2592 x 3840 at 64 degrees, taller)
  oma: { pos: [890, 13, 4600], tgt: [620, 44, 4578], fov: 73.7, shift: [0, 0.0833], w: 2592, h: 4608, level: true },
  // the dome from a rooftop's height across the avenue: the dome, the streets and the houses round it
  scf: { pos: [1640, 95, 4880], tgt: [1150, 12, 5150], fov: 64, shift: [0, 0.09], w: 2592, h: 4608, level: true }
};
// OMA's two glass arches (buildOmaShop: 706, 4560, turned a quarter: local +z is the world's +x, local x the world's -z)
// as outlines in logical points: [left window, right door], each from the bottom left round the head
export function omaArches(n = 20) {
  const X0 = 706, Z0 = 4560, FZ = 48 / 2 + 0.12, AW = 26 - 3, AH = 46 - 1.5, r = AW / 2;
  return [[-17, 5 + 1.5], [17, 5]].map(([ax, base]) => {
    const pts = [[ax + r, base], [ax + r, base + AH - r]];
    for (let i = 1; i < n; i++) { const a = (Math.PI * i) / n; pts.push([ax + r * Math.cos(a), base + AH - r + r * Math.sin(a)]); }
    pts.push([ax - r, base + AH - r], [ax - r, base]);
    return pts.map(([lx, ly]) => [X0 + FZ, ly, Z0 - lx]);
  });
}
