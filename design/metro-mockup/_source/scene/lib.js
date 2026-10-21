// Cromatic · metro mockups (TASK-062): the renderer. A picture is the average of many renders of the same instant,
// each one moved a hair: the pixel grid (anti-aliasing), the lens on its aperture (depth of field, a real thin lens
// with the frame's focal length and f-number), each light along its tube (soft shadows from area lights), the moment
// inside the shutter (motion blur), and the floor's mirror (glossy reflections). The average is kept in linear HDR and
// developed once: a wide glare, a filmic curve, the grade. LOCAL ONLY (design tooling).
import * as THREE from "three";

export const DEG = Math.PI / 180;
// seeded random (mulberry32)
export function rng(seed = 1) { let s = seed >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t ^= t + Math.imul(t ^ (t >>> 7), 61 | t); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
// low-discrepancy points (R2 sequence) for the per-sample jitters: even coverage with few samples
const R2 = (i) => { const g = 1.32471795724474602596; return [(0.5 + i / g) % 1, (0.5 + i / (g * g)) % 1]; };
const halton = (i, b) => { let f = 1, r = 0; while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); } return r; };
export const disk = (a, b) => { const r = Math.sqrt(a), t = 2 * Math.PI * b; return [r * Math.cos(t), r * Math.sin(t)]; };

// Lights are split by what they do best: the jittered point and spot lights give the diffuse light and the soft
// shadows (their sharp highlights would need thousands of samples to become a tube's streak), the rect area lights give
// the specular streaks (analytic, smooth) and no diffuse. CZ_PS / CZ_RD / CZ_RS: a material's own override.
{
  const C = THREE.ShaderChunk;
  let L = C.lights_physical_pars_fragment;
  L = "#ifndef CZ_PS\n#define CZ_PS 0.0\n#endif\n#ifndef CZ_RD\n#define CZ_RD 0.0\n#endif\n#ifndef CZ_RS\n#define CZ_RS 1.0\n#endif\n" + L;
  L = L.replace("reflectedLight.directSpecular += irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );", "reflectedLight.directSpecular += CZ_PS * irradiance * BRDF_GGX( directLight.direction, geometryViewDir, geometryNormal, material );");
  L = L.replace("reflectedLight.directSpecular += lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );", "reflectedLight.directSpecular += CZ_RS * lightColor * fresnel * LTC_Evaluate( normal, viewDir, position, mInv, rectCoords );");
  L = L.replace("reflectedLight.directDiffuse += lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );", "reflectedLight.directDiffuse += CZ_RD * lightColor * material.diffuseColor * LTC_Evaluate( normal, viewDir, position, mat3( 1.0 ), rectCoords );");
  if (!L.includes("CZ_PS * irradiance") || !L.includes("CZ_RS * lightColor") || !L.includes("CZ_RD * lightColor")) throw new Error("light chunk patch failed");
  C.lights_physical_pars_fragment = L;
}

let R = null;
export function renderer() {
  if (R) return R;
  const cv = document.createElement("canvas");
  document.body.appendChild(cv);
  R = new THREE.WebGLRenderer({ canvas: cv, antialias: false, alpha: true, preserveDrawingBuffer: true, powerPreference: "high-performance" });
  R.setPixelRatio(1);
  R.shadowMap.enabled = true;
  R.shadowMap.type = THREE.PCFShadowMap;
  R.toneMapping = THREE.NoToneMapping;
  R.outputColorSpace = THREE.LinearSRGBColorSpace;
  R.localClippingEnabled = true;
  return R;
}

// ---------- the camera: a level camera (verticals stay vertical) with a lens shift, a thin lens ----------
// o: { pos:[x,y,z], yaw (deg, 0 = looking down -z), pitch (deg), hfov (deg), aspect, shift:[sx, sy] (fractions of the
// frame: sy > 0 moves the picture up, i.e. shows more of what is below the horizon... see setFrustum), focus (m),
// fstop, near, far }
export function makeCam(o) {
  const cam = new THREE.PerspectiveCamera(50, o.aspect, o.near || 0.05, o.far || 400);
  cam.userData.o = o;
  placeCam(cam, 0, 0);
  return cam;
}
function placeCam(cam, u, v) {
  const o = cam.userData.o;
  cam.position.set(...o.pos);
  cam.rotation.set((o.pitch || 0) * DEG, (o.yaw || 0) * DEG, (o.roll || 0) * DEG, "YXZ");
  cam.updateMatrixWorld(true);
  if (u || v) {
    const rx = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 0), ry = new THREE.Vector3().setFromMatrixColumn(cam.matrixWorld, 1);
    cam.position.addScaledVector(rx, u).addScaledVector(ry, v);
    cam.updateMatrixWorld(true);
  }
}
// the frustum: half-width from hfov, the lens shift, the lens offset (u, v) kept on the focus plane, a pixel jitter
function setFrustum(cam, W, H, jx = 0, jy = 0, u = 0, v = 0) {
  const o = cam.userData.o, n = cam.near, f = cam.far, F = o.focus || 10;
  const tw = Math.tan((o.hfov / 2) * DEG) * n, th = tw / o.aspect;
  const sh = o.shift || [0, 0];
  let l = -tw + sh[0] * 2 * tw, r = tw + sh[0] * 2 * tw, b = -th - sh[1] * 2 * th, t = th - sh[1] * 2 * th;
  // an explicit window (a strip wider than the shot): [x0, x1, y0, y1] in metres on the plane at distance D
  if (o.win) { const [x0, x1, y0, y1, D] = o.win; l = (x0 * n) / D; r = (x1 * n) / D; b = (y0 * n) / D; t = (y1 * n) / D; }
  l -= (u * n) / F; r -= (u * n) / F; b -= (v * n) / F; t -= (v * n) / F;
  // a part of the frame only (o.sub = [x, y, w, h] in the full frame's px, of o.full = [W, H]): its own frustum
  if (o.sub) { const [sx, sy, sw, shh] = o.sub, [FW, FH] = o.full; const L0 = l, R0 = r, T0 = t, B0 = b; l = L0 + ((R0 - L0) * sx) / FW; r = L0 + ((R0 - L0) * (sx + sw)) / FW; t = T0 - ((T0 - B0) * sy) / FH; b = T0 - ((T0 - B0) * (sy + shh)) / FH; }
  const pw = (r - l) / W, ph = (t - b) / H;
  l += jx * pw; r += jx * pw; b += jy * ph; t += jy * ph;
  cam.projectionMatrix.makePerspective(l, r, t, b, n, f);
  cam.projectionMatrixInverse.copy(cam.projectionMatrix).invert();
}
export function focalMM(o) { return 18 / Math.tan((o.hfov / 2) * DEG); } // full-frame equivalent
export function project(cam, W, H, p) {
  placeCam(cam, 0, 0); setFrustum(cam, W, H);
  const v = new THREE.Vector3(...p).project(cam);
  return [(v.x * 0.5 + 0.5) * W, (-v.y * 0.5 + 0.5) * H, v.z];
}

// ---------- the floor's mirror (Reflector's virtual camera, per sample) ----------
export class Mirror {
  // a planar mirror: the floor by default (normal +y through y), or any plane (normal, point)
  constructor(W, H, { y = 0, scale = 0.5, normal = [0, 1, 0], point = null } = {}) {
    this.n = new THREE.Vector3(...normal).normalize(); this.p = point ? new THREE.Vector3(...point) : new THREE.Vector3(0, y, 0);
    this.rt = new THREE.WebGLRenderTarget(Math.round(W * scale), Math.round(H * scale), { type: THREE.HalfFloatType, colorSpace: THREE.LinearSRGBColorSpace, depthBuffer: true });
    this.cam = new THREE.PerspectiveCamera();
    this.texMatrix = new THREE.Matrix4();
    this.plane = new THREE.Plane().setFromNormalAndCoplanarPoint(this.n, this.p);
    this.uniforms = { reflTex: { value: this.rt.texture }, reflMat: { value: this.texMatrix }, reflJit: { value: new THREE.Vector2() }, reflOn: { value: 1 } };
  }
  update(Rr, scene, cam, hide = []) {
    const n = this.n, pPos = this.p;
    const camPos = new THREE.Vector3().setFromMatrixPosition(cam.matrixWorld);
    const rot = new THREE.Matrix4().extractRotation(cam.matrixWorld);
    const look = new THREE.Vector3(0, 0, -1).applyMatrix4(rot).add(camPos);
    const view = pPos.clone().sub(camPos).reflect(n).negate().add(pPos);
    const target = pPos.clone().sub(look).reflect(n).negate().add(pPos);
    const up = new THREE.Vector3(0, 1, 0).applyMatrix4(rot).reflect(n);
    const vc = this.cam;
    vc.position.copy(view); vc.up.copy(up); vc.lookAt(target); vc.far = cam.far; vc.near = cam.near;
    vc.updateMatrixWorld(); vc.projectionMatrix.copy(cam.projectionMatrix); vc.projectionMatrixInverse.copy(cam.projectionMatrixInverse);
    this.texMatrix.set(0.5, 0, 0, 0.5, 0, 0.5, 0, 0.5, 0, 0, 0.5, 0.5, 0, 0, 0, 1);
    this.texMatrix.multiply(vc.projectionMatrix).multiply(vc.matrixWorldInverse);
    // oblique near plane: nothing behind the mirror is drawn
    const pl = this.plane.clone().applyMatrix4(vc.matrixWorldInverse);
    const cp = new THREE.Vector4(pl.normal.x, pl.normal.y, pl.normal.z, pl.constant);
    const pm = vc.projectionMatrix, q = new THREE.Vector4();
    q.x = (Math.sign(cp.x) + pm.elements[8]) / pm.elements[0]; q.y = (Math.sign(cp.y) + pm.elements[9]) / pm.elements[5]; q.z = -1; q.w = (1 + pm.elements[10]) / pm.elements[14];
    cp.multiplyScalar(2 / cp.dot(q));
    pm.elements[2] = cp.x; pm.elements[6] = cp.y; pm.elements[10] = cp.z + 1 - 0.003; pm.elements[14] = cp.w;
    const vis = hide.map((x) => x.visible); hide.forEach((x) => (x.visible = false));
    this.uniforms.reflOn.value = 0;
    const prev = Rr.getRenderTarget();
    Rr.setRenderTarget(this.rt); Rr.clear(); Rr.render(scene, vc);
    Rr.setRenderTarget(prev);
    this.uniforms.reflOn.value = 1;
    hide.forEach((x, i) => (x.visible = vis[i]));
  }
}
// a standard material that also shows the mirror: k = how polished (0..1), blur = the gloss's spread (in UV)
export function mirrorize(mat, mirror, { k = 0.35, blur = 0.004, tint = [1, 1, 1] } = {}) {
  mat.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, mirror.uniforms, { reflK: { value: k }, reflBlur: { value: blur }, reflTint: { value: new THREE.Vector3(...tint) } });
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nuniform mat4 reflMat; varying vec4 vReflUv;")
      .replace("#include <worldpos_vertex>", "#include <worldpos_vertex>\nvReflUv = reflMat * modelMatrix * vec4( transformed, 1.0 );");
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", "#include <common>\nuniform sampler2D reflTex; uniform vec2 reflJit; uniform float reflK, reflBlur, reflOn; uniform vec3 reflTint; varying vec4 vReflUv;")
      .replace("#include <opaque_fragment>", `
      if (reflOn > 0.5) {
        vec2 ruv = vReflUv.xy / vReflUv.w + reflJit * reflBlur * (0.6 + 1.4 * roughnessFactor);
        vec3 rc = texture2D(reflTex, ruv).rgb;
        float cosT = clamp(dot(normalize(vViewPosition), normal), 0.0, 1.0);
        float fr = 0.04 + 0.96 * pow(1.0 - cosT, 5.0);
        float pol = reflK * (1.0 - smoothstep(0.15, 0.75, roughnessFactor));
        outgoingLight = outgoingLight * (1.0 - fr * pol) + rc * reflTint * (fr * 0.9 + 0.035) * pol;
      }
      #include <opaque_fragment>`);
  };
  mat.customProgramCacheKey = () => "mirror" + k;
  return mat;
}

// ---------- full-screen passes ----------
const quadGeo = new THREE.PlaneGeometry(2, 2);
const quadCam = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
function pass(fs, uniforms) {
  const m = new THREE.ShaderMaterial({ uniforms, vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }", fragmentShader: fs, depthTest: false, depthWrite: false });
  const s = new THREE.Scene(); s.add(new THREE.Mesh(quadGeo, m));
  return { m, run(Rr, rt) { Rr.setRenderTarget(rt); Rr.render(s, quadCam); } };
}
const avgPass = () => pass(`uniform sampler2D A, S; uniform float w; varying vec2 vUv; void main(){ gl_FragColor = mix(texture2D(A, vUv), texture2D(S, vUv), w); }`, { A: { value: null }, S: { value: null }, w: { value: 1 } });
const downPass = () => pass(`uniform sampler2D T; uniform vec2 px; varying vec2 vUv; void main(){
  vec4 c = texture2D(T, vUv) * 0.25;
  c += (texture2D(T, vUv + px * vec2(-1.0,-1.0)) + texture2D(T, vUv + px * vec2(1.0,-1.0)) + texture2D(T, vUv + px * vec2(-1.0,1.0)) + texture2D(T, vUv + px * vec2(1.0,1.0))) * 0.125;
  c += (texture2D(T, vUv + px * vec2(-2.0,0.0)) + texture2D(T, vUv + px * vec2(2.0,0.0)) + texture2D(T, vUv + px * vec2(0.0,-2.0)) + texture2D(T, vUv + px * vec2(0.0,2.0))) * 0.0625;
  gl_FragColor = c; }`, { T: { value: null }, px: { value: new THREE.Vector2() } });
const upPass = () => pass(`uniform sampler2D T, B; uniform vec2 px; uniform float k; varying vec2 vUv; void main(){
  vec4 c = vec4(0.0);
  for (int i = -1; i <= 1; i++) for (int j = -1; j <= 1; j++) c += texture2D(T, vUv + px * vec2(float(i), float(j))) * ((i == 0 ? 2.0 : 1.0) * (j == 0 ? 2.0 : 1.0));
  gl_FragColor = texture2D(B, vUv) + c / 16.0 * k; }`, { T: { value: null }, B: { value: null }, px: { value: new THREE.Vector2() }, k: { value: 1 } });
// the development: glare (a wide, faint bloom of everything, the lens's own), exposure, the curve, the grade, dither
const devPass = () => pass(`uniform sampler2D T, G; uniform float expo, glare, sat, contrast, alphaOut, curve, ca; uniform vec3 wb, lift, gain; uniform vec2 res; varying vec2 vUv;
  vec3 agx(vec3 c){ // AgX (Troy Sobotka), as three.js ships it, with its "punchy" look tempered
    const mat3 AgXIn = mat3(0.856627153315983, 0.137318972929847, 0.11189821299995, 0.0951212405381588, 0.761241990602591, 0.0767994186031903, 0.0482516061458583, 0.101439036467562, 0.811302368396859);
    const mat3 AgXOut = mat3(1.1271005818144368, -0.1413297634984383, -0.14132976349843826, -0.11060664309660323, 1.157823702216272, -0.11060664309660294, -0.016493938717834573, -0.016493938717834257, 1.2519364065950405);
    const float mn = -12.47393, mx = 4.026069;
    c = AgXIn * c; c = clamp(log2(max(c, 1e-10)), mn, mx); c = (c - mn) / (mx - mn);
    vec3 x2 = c * c, x4 = x2 * x2;
    c = 15.5 * x4 * x2 - 40.14 * x4 * c + 31.96 * x4 - 6.868 * x2 * c + 0.4298 * x2 + 0.1191 * c - 0.00232;
    c = AgXOut * c; c = pow(max(vec3(0.0), c), vec3(2.2));
    return c; }
  vec3 neutral(vec3 c){ // Khronos PBR Neutral
    const float sc = 0.8 - 0.04, ds = 0.15;
    float x = min(c.r, min(c.g, c.b)); float off = x < 0.08 ? x - 6.25 * x * x : 0.04; c -= off;
    float pk = max(c.r, max(c.g, c.b)); if (pk < sc) return c;
    float d = 1.0 - sc; float np = 1.0 - d * d / (pk + d - sc); c *= np / pk;
    float g = 1.0 - 1.0 / (ds * (pk - np) + 1.0); return mix(c, vec3(np), g); }
  vec3 srgb(vec3 c){ return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
  float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
  void main(){
    vec4 a = texture2D(T, vUv), g = texture2D(G, vUv) / 6.0;
    if (ca > 0.0 && alphaOut < 0.5) { vec2 d = (vUv - 0.5) * ca; a.r = texture2D(T, vUv + d).r; a.b = texture2D(T, vUv - d).b; } // (lateral colour: the lens's own fringe at the edges)
    a = mix(a, g, glare); // (premultiplied: the glare spills colour and coverage alike)
    float al = alphaOut > 0.5 ? clamp(a.a, 0.0, 1.0) : 1.0;
    vec3 c = alphaOut > 0.5 ? (a.a > 1e-4 ? a.rgb / a.a : vec3(0.0)) : a.rgb;
    c *= wb * expo;
    if (curve > 1.5) { c = srgb(clamp(c, 0.0, 1.0)); }            // raw: the picture's own colours (the posters' pass)
    else {
      c = curve > 0.5 ? srgb(clamp(neutral(c), 0.0, 1.0)) : pow(max(agx(c), 0.0), vec3(1.0 / 2.2));
      float l = dot(c, vec3(0.2126, 0.7152, 0.0722));
      c = mix(vec3(l), c, sat);
      c = clamp((c - 0.5) * contrast + 0.5, 0.0, 1.0);
      c = lift + c * (gain - lift);
    }
    c += (h(vUv * res) - 0.5) / 255.0;
    gl_FragColor = vec4(c * al, al);
  }`, { T: { value: null }, G: { value: null }, expo: { value: 1 }, glare: { value: 0.04 }, sat: { value: 1 }, contrast: { value: 1 }, wb: { value: new THREE.Vector3(1, 1, 1) }, lift: { value: new THREE.Vector3(0, 0, 0) }, gain: { value: new THREE.Vector3(1, 1, 1) }, res: { value: new THREE.Vector2() }, alphaOut: { value: 0 }, curve: { value: 0 }, ca: { value: 0 } });

const P = {};
const rt = (w, h, type = THREE.FloatType) => new THREE.WebGLRenderTarget(w, h, { type, colorSpace: THREE.LinearSRGBColorSpace, depthBuffer: true, minFilter: THREE.LinearFilter, magFilter: THREE.LinearFilter });

// render the accumulated picture.
// job: { scene, cam, W, H, n (samples), alpha (transparent ground), mirror (Mirror) + mirrorHide, perSample(i, k, rnd)
//        (move the lights, the moving things: k in [0,1) is the moment inside the shutter), dev: { expo, glare, ... } }
// returns a PNG data URL of the developed picture (and keeps the linear average in P.acc for more passes)
export async function shoot(job) {
  const Rr = renderer();
  const { scene, cam, W, H } = job, n = job.n || 64;
  Rr.setSize(W, H, false);
  P.avg = P.avg || avgPass(); P.dev = P.dev || devPass(); P.down = P.down || downPass(); P.up = P.up || upPass();
  const S = rt(W, H, THREE.HalfFloatType), A = [rt(W, H), rt(W, H)];
  const bg = scene.background;
  if (job.alpha) scene.background = null;
  Rr.setClearColor(0x000000, 0);
  const o = cam.userData.o, F = o.focus || 10, ap = o.fstop ? focalMM(o) / 1000 / (2 * o.fstop) : 0;
  const rnd = rng(job.seed || 7);
  let cur = 0;
  const t0 = performance.now();
  for (let i = 0; i < n; i++) {
    const [ja, jb] = R2(i + 1), [la, lb] = [halton(i + 1, 2), halton(i + 1, 3)];
    const [u, v] = ap ? disk(la, lb).map((x) => x * ap) : [0, 0];
    const k = n > 1 ? (i + 0.5) / n : 0.5; // the moment inside the shutter (stratified)
    if (job.perSample) job.perSample(i, (k + rnd() / n) % 1, rnd);
    placeCam(cam, u, v);
    setFrustum(cam, W, H, ja - 0.5, jb - 0.5, u, v);
    for (const mr of [].concat(job.mirror || [])) {
      const [ra, rb] = disk(rnd(), rnd()); mr.uniforms.reflJit.value.set(ra, rb);
      mr.update(Rr, scene, cam, mr.hide || job.mirrorHide || []);
    }
    Rr.setRenderTarget(S); Rr.clear(); Rr.render(scene, cam);
    P.avg.m.uniforms.A.value = A[cur].texture; P.avg.m.uniforms.S.value = S.texture; P.avg.m.uniforms.w.value = 1 / (i + 1);
    P.avg.run(Rr, A[1 - cur]); cur = 1 - cur;
    if (i % 8 === 7) await new Promise((r) => setTimeout(r, 0)); // (let the page breathe: the GPU queue drains)
  }
  scene.background = bg;
  const acc = A[cur];
  // glare: a mip chain of the average, summed back up (wide and soft: the lens, not a "bloom effect")
  const d = job.dev || {};
  const levels = [], LV = 6;
  let src = acc, w = W, h = H;
  for (let l = 0; l < LV; l++) { w = Math.max(1, w >> 1); h = Math.max(1, h >> 1); const t = rt(w, h, THREE.HalfFloatType); P.down.m.uniforms.T.value = src.texture; P.down.m.uniforms.px.value.set(1 / (src.width), 1 / (src.height)); P.down.run(Rr, t); levels.push(t); src = t; }
  let up = levels[LV - 1];
  const ups = [];
  for (let l = LV - 2; l >= 0; l--) { const t = rt(levels[l].width, levels[l].height, THREE.HalfFloatType); P.up.m.uniforms.T.value = up.texture; P.up.m.uniforms.B.value = levels[l].texture; P.up.m.uniforms.px.value.set(1 / up.width, 1 / up.height); P.up.m.uniforms.k.value = 1.0; P.up.run(Rr, t); ups.push(t); up = t; }
  const G = up; // (the sum of the LV levels: the dev pass divides by 6)
  const U = P.dev.m.uniforms;
  U.T.value = acc.texture; U.G.value = G.texture; U.res.value.set(W, H); U.alphaOut.value = job.alpha ? 1 : 0;
  U.expo.value = d.expo ?? 1; U.ca.value = d.ca ?? 0.0011; U.curve.value = d.curve === "neutral" ? 1 : d.curve === "raw" ? 2 : 0; U.glare.value = (d.glare ?? 0.05) ; U.sat.value = d.sat ?? 1; U.contrast.value = d.contrast ?? 1;
  U.wb.value.set(...(d.wb || [1, 1, 1])); U.lift.value.set(...(d.lift || [0, 0, 0])); U.gain.value.set(...(d.gain || [1, 1, 1]));
  Rr.setRenderTarget(null); Rr.setClearColor(0x000000, 0); Rr.clear();
  P.dev.run(Rr, null);
  let url;
  if (job.crop) { // a part of the frame only: [x, y, w, h] in px
    const [cx, cy, cw, ch] = job.crop.map(Math.round), c2 = document.createElement("canvas"); c2.width = cw; c2.height = ch;
    c2.getContext("2d").drawImage(Rr.domElement, cx, cy, cw, ch, 0, 0, cw, ch); url = c2.toDataURL("image/png");
  } else url = Rr.domElement.toDataURL("image/png");
  P.lastAcc = acc; P.ms = performance.now() - t0;
  // free
  S.dispose(); A[1 - cur].dispose(); levels.forEach((t) => t.dispose()); ups.forEach((t) => t.dispose());
  if (P.keep) P.keep.dispose(); P.keep = acc;
  return url;
}
export const stats = () => ({ ms: Math.round(P.ms || 0) });
