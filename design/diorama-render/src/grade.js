// Cromatic · diorama renders (TASK-118): our filmic grade, as a 3D LUT. Plain ES module (Node writes the .cube for
// Resolve / After Effects, the page samples the same table in its last pass). Applied to display values (after the
// AgX curve), 33 points a side.
//   "cromatic-diorama": warm highlights, shadows cooled towards violet-teal (never crushed: a model on a table has no
//   true black), a soft S in luminance, the saturation of the mids kept and the highlights' calmed, skin and terracotta
//   protected (the orange hue band is not pushed towards the cyan)
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const mix = (a, b, t) => a + (b - a) * t;
const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a)); return t * t * (3 - 2 * t); };
export const LOOKS = {
  "cromatic-diorama": { lift: [0.026, 0.026, 0.045], gain: [1.01, 1.0, 0.98], warmHi: [1.02, 1.0, 0.95], coolLo: [0.96, 1.0, 1.06], contrast: 0.16, sat: 1.04, hiSat: 0.88, pivot: 0.42 },
  "cromatic-night": { lift: [0.02, 0.026, 0.05], gain: [1.02, 0.99, 0.96], warmHi: [1.07, 0.99, 0.84], coolLo: [0.9, 0.99, 1.16], contrast: 0.2, sat: 1.0, hiSat: 0.85, pivot: 0.36 }
};
export function gradeFn(name = "cromatic-diorama") {
  const L = LOOKS[name] || LOOKS["cromatic-diorama"];
  return (r, g, b) => {
    let c = [r, g, b];
    const y0 = 0.2126 * r + 0.7152 * g + 0.0722 * b;
    // split toning by luminance: cool under the pivot, warm over it
    const wHi = sstep(L.pivot - 0.1, 0.95, y0), wLo = 1 - sstep(0.02, L.pivot + 0.05, y0);
    c = c.map((v, k) => v * mix(1, L.warmHi[k], wHi) * mix(1, L.coolLo[k], wLo));
    // a soft S in luminance about the pivot (contrast), applied as a ratio so the hue stays
    const y = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
    const s = (x) => { const k = L.contrast; const d = x - L.pivot; return clamp(x + k * d * (1 - Math.abs(d) / Math.max(L.pivot, 1 - L.pivot)) * 1.6, 0, 1); };
    const y2 = s(y), ratio = y > 1e-5 ? y2 / y : 1;
    c = c.map((v) => v * ratio);
    // saturation: the mids a touch up, the highlights calmed (towards a paper white, not a clipped colour)
    const yy = 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2], sat = mix(L.sat, L.hiSat, sstep(0.6, 1.0, yy));
    c = c.map((v) => yy + (v - yy) * sat);
    // lift (the model's darkest paint is never black) and gain
    c = c.map((v, k) => L.lift[k] + v * (1 - L.lift[k]) * L.gain[k]);
    return c.map((v) => clamp(v));
  };
}
// the table: N^3 rgb, r fastest (the .cube order and the order Data3DTexture wants)
export function lutTable(name, N = 33) {
  const f = gradeFn(name), out = new Float32Array(N * N * N * 4);
  let i = 0;
  for (let b = 0; b < N; b++) for (let g = 0; g < N; g++) for (let r = 0; r < N; r++) { const c = f(r / (N - 1), g / (N - 1), b / (N - 1)); out[i++] = c[0]; out[i++] = c[1]; out[i++] = c[2]; out[i++] = 1; }
  return out;
}
export function cubeFile(name, N = 33) {
  const t = lutTable(name, N), lines = [`TITLE "${name}"`, `# Cromatic Studios, TASK-118: applied after the AgX curve (display values)`, `LUT_3D_SIZE ${N}`];
  for (let i = 0; i < t.length; i += 4) lines.push(`${t[i].toFixed(6)} ${t[i + 1].toFixed(6)} ${t[i + 2].toFixed(6)}`);
  return lines.join("\n") + "\n";
}
