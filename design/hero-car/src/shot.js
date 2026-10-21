// Cromatic · hero car (TASK-112): the hero Dacia in one of Lia's frames. Everything that has to match comes from the
// map (capture.mjs): the camera (its world matrix, its lens and shift), the car's place (with the city's warp), the sun,
// and the city round the car (six 90-degree views, turned here into the environment the paint and chrome reflect).
//   mode "pt"      three-gpu-pathtracer: pass A the car alone (alpha where the rays leave it: through the glass the
//                  plate shows), passes B / C the ground with and without the car (their ratio is the car's shadow
//                  and contact occlusion on the street); composited in the map's own scene-linear space (the plate
//                  un-tonemapped with the inverse of three's ACES, everything summed, ACES again)
//   mode "raster"  the same car in a WebGLRenderer: PMREM environment, a soft (VSM) sun shadow, a blurred contact
//                  shadow from below, the plate as the background
import { WebGLPathTracer } from "three-gpu-pathtracer";
import { HorizontalBlurShader } from "three/addons/shaders/HorizontalBlurShader.js";
import { VerticalBlurShader } from "three/addons/shaders/VerticalBlurShader.js";

// ---- three's ACES filmic (r169 / r186), forward and inverse, on linear rgb
const IN = [[0.59719, 0.35458, 0.04823], [0.076, 0.90834, 0.01566], [0.0284, 0.13383, 0.83777]]; // rows
const OUT = [[1.60475, -0.53108, -0.07367], [-0.10208, 1.10813, -0.00605], [-0.00327, -0.07276, 1.07602]];
const inv3 = (m) => { const [a, b, c] = m[0], [d, e, f] = m[1], [g, h, i] = m[2], A = e * i - f * h, B = -(d * i - f * g), C = d * h - e * g, det = a * A + b * B + c * C; return [[A / det, -(b * i - c * h) / det, (b * f - c * e) / det], [B / det, (a * i - c * g) / det, -(a * f - c * d) / det], [C / det, -(a * h - b * g) / det, (a * e - b * d) / det]]; };
const IN_I = inv3(IN), OUT_I = inv3(OUT);
const mul = (m, v) => [m[0][0] * v[0] + m[0][1] * v[1] + m[0][2] * v[2], m[1][0] * v[0] + m[1][1] * v[1] + m[1][2] * v[2], m[2][0] * v[0] + m[2][1] * v[1] + m[2][2] * v[2]];
const rrt = (v) => (v * (v + 0.0245786) - 0.000090537) / (v * (0.983729 * v + 0.432951) + 0.238081);
const rrtInv = (y) => { y = Math.min(y, 1.0); const a = 1 - 0.983729 * y, b = 0.0245786 - 0.432951 * y, c = -(0.000090537 + 0.238081 * y); if (Math.abs(a) < 1e-6) return -c / b; return (-b + Math.sqrt(Math.max(0, b * b - 4 * a * c))) / (2 * a); };
export const aces = (c, exp) => { const v = mul(IN, c.map((x) => (x * exp) / 0.6)).map(rrt); return mul(OUT, v).map((x) => Math.min(1, Math.max(0, x))); };
export const acesInv = (c, exp) => { const v = mul(OUT_I, c.map((x) => Math.min(0.999, x))).map((y) => rrtInv(Math.max(0, y))); return mul(IN_I, v).map((x) => Math.max(0, (x * 0.6) / exp)); };
const lerp = (a, b, t) => a + (b - a) * t;
const s2l = (u) => { u /= 255; return u <= 0.04045 ? u / 12.92 : Math.pow((u + 0.055) / 1.055, 2.4); };
const l2s = (l) => { l = Math.min(1, Math.max(0, l)); return Math.round(255 * (l <= 0.0031308 ? l * 12.92 : 1.055 * Math.pow(l, 1 / 2.4) - 0.055)); };
const S2L = new Float32Array(256).map((_, i) => s2l(i));

const loadImg = (url) => new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = url; });
const pixels = (im, x = 0, y = 0, w = im.width, h = im.height) => { const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d"); g.drawImage(im, x, y, w, h, 0, 0, w, h); return g.getImageData(0, 0, w, h); };
const toURL = (data, w, h) => { const c = document.createElement("canvas"); c.width = w; c.height = h; c.getContext("2d").putImageData(new ImageData(data, w, h), 0, 0); return c.toDataURL("image/png"); };
const frame = () => new Promise((r) => requestAnimationFrame(r));

// ---- the city round the car: the six faces into an equirect of scene-linear radiance (+ the sun's disc, the fill)
async function envFrom(T, J, shot, exp, opts = {}) {
  const { sun = true, fill = true, W = 1024, H = 512 } = opts;
  const faces = [];
  for (const [k, f] of Object.entries(J.env)) {
    const im = await loadImg(`/raw/${shot}-env-${k}.png`), px = pixels(im);
    const mw = new T.Matrix4().fromArray(f.matrixWorld), P = new T.Matrix4().fromArray(f.projection), inv = mw.clone().invert();
    faces.push({ px, w: im.width, h: im.height, VP: P.clone().multiply(inv) });
  }
  const data = new Float32Array(W * H * 4), v4 = new T.Vector4(), c0 = new T.Vector3().fromArray(J.env.px.matrixWorld.slice(12, 15));
  // (the faces' pixels un-tonemapped once: a cache per distinct colour would be faster; this is fine at 0.5 M)
  for (let r = 0; r < H; r++) for (let i = 0; i < W; i++) {
    const u = (i + 0.5) / W, v = (r + 0.5) / H, ph = (u - 0.5) * 2 * Math.PI, th = (v - 0.5) * Math.PI;
    const d = [Math.cos(th) * Math.cos(ph), Math.sin(th), Math.cos(th) * Math.sin(ph)];
    let best = null, bm = 9;
    for (const f of faces) { v4.set(c0.x + d[0] * 100, c0.y + d[1] * 100, c0.z + d[2] * 100, 1).applyMatrix4(f.VP); if (v4.w <= 0) continue; const x = v4.x / v4.w, y = v4.y / v4.w, m = Math.max(Math.abs(x), Math.abs(y)); if (m < bm) { bm = m; best = [f, x, y]; } }
    const o = (r * W + i) * 4;
    if (!best) continue;
    const [f, x, y] = best, px = Math.min(f.w - 1, Math.max(0, Math.floor((x * 0.5 + 0.5) * f.w))), py = Math.min(f.h - 1, Math.max(0, Math.floor((-y * 0.5 + 0.5) * f.h))), q = (py * f.w + px) * 4;
    const L = acesInv([S2L[f.px.data[q]], S2L[f.px.data[q + 1]], S2L[f.px.data[q + 2]]], exp);
    data[o] = L[0]; data[o + 1] = L[1]; data[o + 2] = L[2]; data[o + 3] = 1;
  }
  // the city's light as the map's materials get it: a HemisphereLight (sky / ground colours x intensity, as an
  // irradiance) where the faces show the sky's and the street's own radiance (brighter: the sky is a painted
  // backdrop). The capture is scaled to that: the up and down halves each to the hemisphere light's irradiance
  // (o.envK multiplies it: 1 = the map's own balance)
  const hemi = J.lights.find((l) => l.type === "HemisphereLight");
  const Eh = (up) => { let e = [0, 0, 0]; for (let r = 0; r < H; r++) { const th = ((r + 0.5) / H - 0.5) * Math.PI, sy = Math.sin(th); if (up ? sy <= 0 : sy >= 0) continue; const sa = ((2 * Math.PI) / W) * (Math.PI / H) * Math.cos(th); for (let i = 0; i < W; i++) { const o = (r * W + i) * 4; for (let k = 0; k < 3; k++) e[k] += data[o + k] * sa * Math.abs(sy); } } return e; };
  const Eup = Eh(true), Edn = Eh(false), lum = (c) => 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
  const hs = new T.Color("#" + hemi.color), hg = new T.Color("#" + hemi.ground);
  const kUp = (lum([hs.r, hs.g, hs.b]) * hemi.intensity) / lum(Eup), kDn = (lum([hg.r, hg.g, hg.b]) * hemi.intensity) / lum(Edn);
  const envK = opts.envK ?? 1.3;
  // (per channel, partly: opts.tint 0 keeps the capture's own colours at the hemisphere's brightness, 1 takes the
  // hemisphere's colours: the terracotta street bounces less red onto the yellow)
  const tint = opts.tint ?? 0.4, cUp = [hs.r, hs.g, hs.b].map((c, k) => lerp(kUp, (c * hemi.intensity) / Eup[k], tint)), cDn = [hg.r, hg.g, hg.b].map((c, k) => lerp(kDn, (c * hemi.intensity) / Edn[k], tint));
  for (let r = 0; r < H; r++) { const th = ((r + 0.5) / H - 0.5) * Math.PI, sy = Math.sin(th), t = Math.min(1, Math.max(0, sy * 6 + 0.5)); for (let i = 0; i < W; i++) { const o = (r * W + i) * 4; for (let k = 0; k < 3; k++) data[o + k] *= envK * lerp(cDn[k], cUp[k], t); } }
  const stats = { Eup: Eup.map((x) => +x.toFixed(3)), Edn: Edn.map((x) => +x.toFixed(3)), kUp: +kUp.toFixed(3), kDn: +kDn.toFixed(3) };
  // the map's sun (a DirectionalLight: irradiance = colour x intensity) as a disc of 1.6 degrees, and its violet fill
  // (another directional, no shadow in the map) as a broad soft lobe; both added to the radiance, for the path tracer
  const sunL = J.lights.find((l) => l.type === "DirectionalLight" && l.shadow), fillL = J.lights.find((l) => l.type === "DirectionalLight" && !l.shadow);
  const sdir = new T.Vector3().fromArray(sunL.pos).sub(new T.Vector3().fromArray(sunL.target)).normalize();
  const fdir = new T.Vector3().fromArray(fillL.pos).sub(new T.Vector3().fromArray(fillL.target || [0, 0, 0])).normalize();
  const col = (hex) => { const c = new T.Color("#" + hex); return [c.r, c.g, c.b]; }; // (THREE.Color from hex: linear)
  const add = (dir, rgb, E, ang, soft) => {
    const cosA = Math.cos(ang); let wsum = 0; const hits = [];
    for (let r = 0; r < H; r++) for (let i = 0; i < W; i++) {
      const u = (i + 0.5) / W, v = (r + 0.5) / H, ph = (u - 0.5) * 2 * Math.PI, th = (v - 0.5) * Math.PI;
      const d = [Math.cos(th) * Math.cos(ph), Math.sin(th), Math.cos(th) * Math.sin(ph)], c = d[0] * dir.x + d[1] * dir.y + d[2] * dir.z;
      if (c < cosA) continue;
      const wgt = soft ? Math.pow((c - cosA) / (1 - cosA), 2) : 1, sa = ((2 * Math.PI) / W) * (Math.PI / H) * Math.cos(th);
      hits.push([(r * W + i) * 4, wgt]); wsum += wgt * sa * c; // (irradiance on a surface facing the light)
    }
    for (const [o, wgt] of hits) for (let k = 0; k < 3; k++) data[o + k] += (rgb[k] * E * wgt) / wsum;
  };
  if (sun) add(sdir, col(sunL.color), sunL.intensity, (1.6 * Math.PI) / 180, false);
  if (fill) add(fdir, col(fillL.color), fillL.intensity, (40 * Math.PI) / 180, true);
  const tex = new T.DataTexture(data, W, H, T.RGBAFormat, T.FloatType); tex.mapping = T.EquirectangularReflectionMapping; tex.magFilter = T.LinearFilter; tex.minFilter = T.LinearFilter; tex.generateMipmaps = false; tex.colorSpace = T.LinearSRGBColorSpace; tex.needsUpdate = true;
  return { tex, sdir, fdir, sunL, fillL, stats };
}

export async function shot(T, R, make, o) {
  const J = await (await fetch(`/raw/${o.shot}.json`)).json();
  const exp = J.render.exposure, cam0 = J.shot.cam, FW = cam0.w, FH = cam0.h;
  // ---- the car where the map parks it: the logical place warped (the city bends), the warp's local Jacobian
  const { group } = make();
  const s = (51.5 / 2.441) * J.car.scale[0]; // metres -> the map's car units (wheelbase 51.5) -> its parked scale
  const [[a, b], [c, d]] = J.car.jac, sy = Math.sqrt(Math.abs(a * d - b * c));
  const M = new T.Matrix4().set(a * s, 0, c * s, J.car.warped[0], 0, sy * s, 0, J.car.warped[1], b * s, 0, d * s, J.car.warped[2], 0, 0, 0, 1);
  group.matrixAutoUpdate = false; group.matrix.copy(M); group.updateMatrixWorld(true);
  const groundY = J.car.warped[1];
  // ---- the camera, as the map's (its view offset for the lens shift, plus the crop)
  const cam = new T.PerspectiveCamera(cam0.fov, FW / FH, J.camera.near, J.camera.far);
  new T.Matrix4().fromArray(J.camera.matrixWorld).decompose(cam.position, cam.quaternion, cam.scale);
  const sh = cam0.shift || [0, 0];
  const setCrop = ([x0, y0, w, h]) => { cam.setViewOffset(FW, FH, -sh[0] * FW + x0, -sh[1] * FH + y0, w, h); cam.updateProjectionMatrix(); cam.updateMatrixWorld(true); };
  setCrop([0, 0, FW, FH]);
  const projErr = cam.projectionMatrix.elements.reduce((m, v, i) => Math.max(m, Math.abs(v - J.camera.projection[i])), 0);
  // the crop: the car's box (and room for its shadow) in frame pixels
  let crop = o.crop;
  if (!crop) {
    const bb = new T.Box3().setFromObject(group), pts = [];
    for (const x of [bb.min.x - 8, bb.max.x + 8]) for (const y of [groundY, bb.max.y]) for (const z of [bb.min.z - 8, bb.max.z + 8]) pts.push(new T.Vector3(x, y, z).project(cam));
    const xs = pts.map((p) => (p.x * 0.5 + 0.5) * FW), ys = pts.map((p) => (-p.y * 0.5 + 0.5) * FH);
    const x0 = Math.max(0, Math.floor(Math.min(...xs))), y0 = Math.max(0, Math.floor(Math.min(...ys))), x1 = Math.min(FW, Math.ceil(Math.max(...xs))), y1 = Math.min(FH, Math.ceil(Math.max(...ys)));
    crop = [x0, y0, x1 - x0, y1 - y0];
  }
  const [cx, cy, cw, ch] = crop, sc = o.scale || 1, RW = Math.round(cw * sc), RH = Math.round(ch * sc);
  setCrop(crop);
  const plateIm = await loadImg(`/raw/${o.shot}-plate.png`), plate = pixels(plateIm, cx, cy, cw, ch);
  const info = { crop, projErr, s, sy, mode: o.mode };
  const images = {};
  if (o.mode === "raster") Object.assign(images, await raster(T, R, J, o, group, cam, plateIm, crop, RW, RH, exp, groundY, info));
  else Object.assign(images, await pathtrace(T, R, J, o, group, cam, plate, crop, RW, RH, exp, groundY, info));
  return { images, info };
}

// ================= path traced =================
async function pathtrace(T, R, J, o, group, cam, plate, crop, RW, RH, exp, groundY, info) {
  const [cx, cy, cw, ch] = crop;
  const env = await envFrom(T, J, o.shot, exp, { sun: true, fill: true, envK: o.envK, tint: o.tint }); info.env = env.stats;
  R.setSize(RW, RH, false); R.setPixelRatio(1);
  R.toneMapping = T.NoToneMapping;
  const pt = new WebGLPathTracer(R);
  pt.renderDelay = 0; pt.minSamples = 1; pt.fadeDuration = 0; pt.renderToCanvas = false; pt.dynamicLowRes = false; pt.rasterizeScene = false;
  pt.bounces = o.bounces || 10; pt.transmissiveBounces = 12; pt.filterGlossyFactor = 0.25; pt.multipleImportanceSampling = true;
  pt.tiles.set(o.tiles || 3, o.tiles || 3);
  const road = (() => { // the street's albedo, roughly: its colour in the plate under the sun and sky (for B and C)
    const L = acesInv([S2L[plate.data[0]], S2L[plate.data[1]], S2L[plate.data[2]]], exp); return new T.Color(0.62, 0.3, 0.24);
  })();
  const ground = new T.Mesh(new T.PlaneGeometry(400, 400, 16, 16), new T.MeshStandardMaterial({ color: road, roughness: 0.92, metalness: 0 }));
  ground.rotation.x = -Math.PI / 2; ground.position.set(J.car.warped[0], groundY, J.car.warped[2]); ground.updateMatrixWorld(true);
  // (three-gpu-pathtracer 0.0.27 on WebGL renders clearcoat materials black here: the coat folded into the base
  // instead, a smooth dielectric over the colour, which is what a solid, non-metallic paint is anyway)
  if (!o.keepCoat) { const done = new Map(); group.traverse((m) => { if (!m.isMesh || !m.material.clearcoat) return; if (!done.has(m.material)) { const c = m.material.clone(); c.roughness = lerp(m.material.roughness, m.material.clearcoatRoughness, Math.min(1, m.material.clearcoat) * 0.85); c.clearcoat = 0; done.set(m.material, c); } m.material = done.get(m.material); }); }
  const run = async (objs, n, label) => {
    const scene = new T.Scene(); scene.background = null; scene.environment = env.tex; scene.environmentIntensity = 1;
    for (const x of objs) scene.add(x);
    scene.updateMatrixWorld(true);
    pt.setScene(scene, cam);
    const t0 = performance.now();
    while (pt.samples < n) { pt.renderSample(); if ((pt.samples | 0) % 8 === 0) await frame(); }
    const buf = new Float32Array(RW * RH * 4); R.readRenderTargetPixels(pt.target, 0, 0, RW, RH, buf);
    info[label] = { samples: pt.samples, ms: Math.round(performance.now() - t0) };
    for (const x of objs) scene.remove(x);
    return buf; // (rows bottom-up)
  };
  if (o.probe) { // a white ball where the car is: does the environment light diffuse surfaces?
    const ball = new T.Mesh(new T.SphereGeometry(8, 48, 24), new T.MeshStandardMaterial({ color: "#ffffff", roughness: 1 })); ball.position.copy(new T.Box3().setFromObject(group).getCenter(new T.Vector3())); ball.updateMatrixWorld(true);
    const P = await run([ball], 32, "probe"); let mx = [0, 0, 0, 0]; for (let i = 0; i < P.length; i += 4) if (P[i + 3] > 0.5 && P[i] + P[i + 1] > mx[0] + mx[1]) mx = [P[i], P[i + 1], P[i + 2], P[i + 3]]; info.probeMax = mx.map((x) => +x.toFixed(3));
    const D = env.tex.image.data; let mxe = 0, sum = 0, nan = 0; for (let i = 0; i < D.length; i += 4) { const l = D[i] + D[i + 1] + D[i + 2]; if (!(l >= 0)) nan++; else { sum += l; if (l > mxe) mxe = l; } } info.envData = { max: mxe, mean: sum / (D.length / 4), nan };
    return {};
  }
  const nA = o.samples || 256, nG = Math.max(64, Math.round(nA / 2));
  const A = await run([group], nA, "A");
  const B = o.noShadow ? null : await run([group, ground], nG, "B");
  const C = o.noShadow ? null : await run([ground], nG, "C");
  // composite at the render's size (the plate scaled to it if sc != 1)
  const pl = RW === cw ? plate : (() => { const c0 = document.createElement("canvas"); c0.width = cw; c0.height = ch; c0.getContext("2d").putImageData(plate, 0, 0); const c1 = document.createElement("canvas"); c1.width = RW; c1.height = RH; c1.getContext("2d").drawImage(c0, 0, 0, RW, RH); return c1.getContext("2d").getImageData(0, 0, RW, RH); })();
  // the shadow ratio, softened a little (the two passes' noise)
  let G = null;
  if (B) {
    G = new Float32Array(RW * RH * 3);
    for (let i = 0, n = RW * RH; i < n; i++) for (let k = 0; k < 3; k++) { const cC = C[i * 4 + k], cB = B[i * 4 + k]; G[i * 3 + k] = cC > 1e-5 && C[i * 4 + 3] > 0.5 ? Math.min(1.08, cB / cC) : 1; }
    G = blur3(G, RW, RH, 2);
  }
  const out = new Uint8ClampedArray(RW * RH * 4), carOnly = new Uint8ClampedArray(RW * RH * 4);
  for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) {
    const iTop = (y * RW + x) * 4, iBuf = ((RH - 1 - y) * RW + x) * 4, ig = ((RH - 1 - y) * RW + x) * 3;
    const P = acesInv([S2L[pl.data[iTop]], S2L[pl.data[iTop + 1]], S2L[pl.data[iTop + 2]]], exp);
    const al = Math.min(1, Math.max(0, A[iBuf + 3]));
    const g = G ? [G[ig], G[ig + 1], G[ig + 2]] : [1, 1, 1];
    const L = [0, 1, 2].map((k) => A[iBuf + k] + (1 - al) * P[k] * g[k]);
    const c = aces(L, exp);
    out[iTop] = l2s(c[0]); out[iTop + 1] = l2s(c[1]); out[iTop + 2] = l2s(c[2]); out[iTop + 3] = 255;
    const cc = al > 0.001 ? aces([0, 1, 2].map((k) => A[iBuf + k] / al), exp) : [0, 0, 0];
    carOnly[iTop] = l2s(cc[0]); carOnly[iTop + 1] = l2s(cc[1]); carOnly[iTop + 2] = l2s(cc[2]); carOnly[iTop + 3] = Math.round(al * 255);
  }
  const imgs = { comp: toURL(out, RW, RH) };
  if (o.debug) imgs.car = toURL(carOnly, RW, RH);
  if (o.debug && G) { const gg = new Uint8ClampedArray(RW * RH * 4); for (let y = 0; y < RH; y++) for (let x = 0; x < RW; x++) { const i = (y * RW + x) * 4, j = ((RH - 1 - y) * RW + x) * 3; gg[i] = gg[i + 1] = gg[i + 2] = Math.round(255 * Math.min(1, G[j + 1])); gg[i + 3] = 255; } imgs.shadow = toURL(gg, RW, RH); }
  if (o.debug && B) { const lum = (X, i) => 0.2126 * X[i] + 0.7152 * X[i + 1] + 0.0722 * X[i + 2]; let sb = 0, sc2 = 0, ab = 0, ac = 0; for (let i = 0; i < B.length; i += 4) { sb += lum(B, i); sc2 += lum(C, i); ab += B[i + 3]; ac += C[i + 3]; } const n = B.length / 4; info.BC = { B: sb / n, C: sc2 / n, aB: ab / n, aC: ac / n }; }
  pt.dispose();
  return imgs;
}
function blur3(src, w, h, r) {
  const tmp = new Float32Array(src.length), out = new Float32Array(src.length), n = 2 * r + 1;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) for (let k = 0; k < 3; k++) { let s = 0; for (let d = -r; d <= r; d++) s += src[(y * w + Math.min(w - 1, Math.max(0, x + d))) * 3 + k]; tmp[(y * w + x) * 3 + k] = s / n; }
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) for (let k = 0; k < 3; k++) { let s = 0; for (let d = -r; d <= r; d++) s += tmp[(Math.min(h - 1, Math.max(0, y + d)) * w + x) * 3 + k]; out[(y * w + x) * 3 + k] = s / n; }
  return out;
}

// ================= rasterised (what a real-time page could do) =================
async function raster(T, R, J, o, group, cam, plateIm, crop, RW, RH, exp, groundY, info) {
  const [cx, cy, cw, ch] = crop;
  const env = await envFrom(T, J, o.shot, exp, { sun: false, fill: false, envK: o.envK, tint: o.tint }); info.env = env.stats;
  R.setSize(RW, RH, false); R.setPixelRatio(1);
  R.toneMapping = T.ACESFilmicToneMapping; R.toneMappingExposure = exp; R.outputColorSpace = T.SRGBColorSpace;
  R.shadowMap.enabled = true; R.shadowMap.type = T.VSMShadowMap;
  const scene = new T.Scene();
  const pm = new T.PMREMGenerator(R); scene.environment = pm.fromEquirectangular(env.tex).texture;
  const bgc = document.createElement("canvas"); bgc.width = RW; bgc.height = RH; bgc.getContext("2d").drawImage(plateIm, cx, cy, cw, ch, 0, 0, RW, RH);
  const bg = new T.CanvasTexture(bgc); bg.colorSpace = T.SRGBColorSpace; scene.background = bg;
  scene.add(group);
  const bb = new T.Box3().setFromObject(group), ctr = bb.getCenter(new T.Vector3()), rad = bb.getSize(new T.Vector3()).length() / 2;
  const sun = new T.DirectionalLight(new T.Color("#" + env.sunL.color), env.sunL.intensity);
  sun.position.copy(ctr).addScaledVector(env.sdir, rad * 4); sun.target.position.copy(ctr); sun.castShadow = true;
  sun.shadow.mapSize.set(4096, 4096); Object.assign(sun.shadow.camera, { left: -rad * 1.2, right: rad * 1.2, top: rad * 1.2, bottom: -rad * 1.2, near: rad, far: rad * 8 });
  sun.shadow.radius = 6; sun.shadow.blurSamples = 20; sun.shadow.bias = -0.0004;
  scene.add(sun, sun.target);
  const fill = new T.DirectionalLight(new T.Color("#" + env.fillL.color), env.fillL.intensity); fill.position.copy(ctr).addScaledVector(env.fdir, rad * 4); fill.target.position.copy(ctr); scene.add(fill, fill.target);
  // the street: catches the sun's shadow (darkening the plate) and the contact shadow from below
  const gnd = new T.Mesh(new T.PlaneGeometry(rad * 6, rad * 6), new T.ShadowMaterial({ color: new T.Color("#2a1418"), opacity: 0.55 }));
  gnd.rotation.x = -Math.PI / 2; gnd.position.set(ctr.x, groundY + 0.02, ctr.z); gnd.receiveShadow = true; scene.add(gnd);
  scene.add(contactShadow(T, R, group, ctr, groundY, rad));
  R.render(scene, cam);
  return { comp: R.domElement.toDataURL("image/png") };
}
// the three.js "contact shadows" idea: the car seen from below (depth as darkness), blurred, laid on the street
function contactShadow(T, R, group, ctr, groundY, rad) {
  const S = 1024, size = rad * 1.6, H = rad * 0.35, rt = new T.WebGLRenderTarget(S, S), rtb = new T.WebGLRenderTarget(S, S);
  const oc = new T.OrthographicCamera(-size / 2, size / 2, size / 2, -size / 2, 0, H); oc.position.set(ctr.x, groundY, ctr.z); oc.rotation.x = Math.PI / 2; oc.updateMatrixWorld(true);
  const dm = new T.MeshDepthMaterial(); dm.onBeforeCompile = (sh) => { sh.fragmentShader = sh.fragmentShader.replace("gl_FragColor = vec4( vec3( 1.0 - fragCoordZ ), opacity );", "gl_FragColor = vec4( vec3( 0.0 ), pow( 1.0 - fragCoordZ, 3.0 ) );"); };
  const sc = new T.Scene(); const tmp = group.clone(); tmp.matrixAutoUpdate = false; tmp.matrix.copy(group.matrixWorld); sc.add(tmp); sc.overrideMaterial = dm;
  const cc = R.getClearColor(new T.Color()), ca = R.getClearAlpha(); R.setClearColor(0x000000, 0);
  R.setRenderTarget(rt); R.clear(); R.render(sc, oc);
  const q = new T.Mesh(new T.PlaneGeometry(2, 2)), qc = new T.OrthographicCamera(-1, 1, 1, -1, 0, 1), qs = new T.Scene(); qs.add(q);
  const hb = new T.ShaderMaterial(HorizontalBlurShader), vb = new T.ShaderMaterial(VerticalBlurShader);
  for (let k = 0; k < 3; k++) { const amt = (k + 1) * 2.2; hb.uniforms.tDiffuse.value = rt.texture; hb.uniforms.h.value = amt / 256; q.material = hb; R.setRenderTarget(rtb); R.render(qs, qc); vb.uniforms.tDiffuse.value = rtb.texture; vb.uniforms.v.value = amt / 256; q.material = vb; R.setRenderTarget(rt); R.render(qs, qc); }
  R.setRenderTarget(null); R.setClearColor(cc, ca);
  const m = new T.Mesh(new T.PlaneGeometry(size, size), new T.MeshBasicMaterial({ map: rt.texture, transparent: true, opacity: 0.85, depthWrite: false, toneMapped: false }));
  m.rotation.x = -Math.PI / 2; m.scale.y = -1; m.position.set(ctr.x, groundY + 0.03, ctr.z); m.renderOrder = 1;
  return m;
}
