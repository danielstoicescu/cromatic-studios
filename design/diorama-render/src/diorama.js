// Cromatic · diorama renders (TASK-118): the offline renderer, in the map's own page (?map&story), with the map's own
// three (window.__story.K). The city is filmed as a model on a table: every output frame is the average of many
// sub-frames, each a full render of the scene with
//   * the camera on another point of its aperture (a thin lens: the plane at the focus distance stays put, everything
//     nearer or farther spreads into a true bokeh, occlusion-correct: the tilt-shift look without a post blur)
//   * another instant inside the shutter (motion blur of the camera and of whatever the shot moves)
//   * another sub-pixel offset (anti-aliasing)
//   * the sun on another point of its disc, its shadow map drawn again (soft, physically sized penumbrae)
//   * a second shadowed light on another point of the sky's dome, coloured as the sky is there (sky light with its
//     shadows: the occlusion of streets, eaves, doorways and the figurines' feet; the ground's bounce stays as the
//     hemisphere light's lower half)
// The sum is kept in float; the last pass makes the picture: bloom, exposure, the AgX curve, our LUT (grade.js), a
// soft vignette, a fine luminance grain. Nothing here changes the site: this file is only ever injected by the harness.
//   __D.setup(look)             the diorama state (shadows on, the blob shadows off, the lights, the model materials)
//   __D.teardown()              the map as it was
//   __D.frame(spec) -> dataURL  one finished frame (see renderFrame below)
//   __D.plain(cam, w, h)        the map's own render at a camera (the "before")
import { lutTable } from "./grade.js";
const S = window.__story, K = S.K, R = S.renderer, scene = S.scene, camera = S.camera;
const V3 = K.Vector3;
const W = (p) => S.warpV(new V3(p[0], p[1], p[2]));

// ---------------------------------------------------------------- the camera of a sub-frame
// c: a camera from camera.js (logical coordinates: the page bends it into the map's warped world)
const _m = new K.Matrix4();
function bend(c) {
  const p = W(c.pos), lk = W(c.look), fwd = lk.clone().sub(p).normalize();
  // the rotation taking the logical forward to the bent one, applied to right and up as well (Rodrigues)
  const f0 = new V3(...c.fwd), axis = new V3().crossVectors(f0, fwd), s = axis.length(), co = f0.dot(fwd);
  const rot = (v) => { if (s < 1e-9) return v; const k = axis.clone().divideScalar(s), a = Math.atan2(s, co); return v.clone().multiplyScalar(Math.cos(a)).add(new V3().crossVectors(k, v).multiplyScalar(Math.sin(a))).add(k.clone().multiplyScalar(k.dot(v) * (1 - Math.cos(a)))); };
  const right = rot(new V3(...c.right)).normalize(), up = rot(new V3(...c.up)).normalize();
  const fp = c.focusPt ? W(c.focusPt) : null, focus = fp ? Math.max(1, fp.clone().sub(p).dot(fwd)) : c.focus;
  return { pos: p, fwd, right, up, fov: c.fov, focus, shift: c.shift || null };
}
// lens: { ax, ay } the point on the aperture (world units, in the camera's right/up), { jx, jy } a sub-pixel offset
function placeCamera(b, w, h, lens = { ax: 0, ay: 0, jx: 0, jy: 0 }, near = 1.5, far = 30000) {
  camera.position.copy(b.pos).addScaledVector(b.right, lens.ax).addScaledVector(b.up, lens.ay);
  _m.makeBasis(b.right, b.up, b.fwd.clone().negate()); camera.quaternion.setFromRotationMatrix(_m);
  camera.fov = b.fov; camera.aspect = w / h; camera.near = near; camera.far = far; camera.zoom = 1;
  if (b.shift) camera.setViewOffset(w, h, -b.shift[0] * w, -b.shift[1] * h, w, h); else camera.clearViewOffset();
  camera.updateProjectionMatrix();
  const e = camera.projectionMatrix.elements;
  // the thin lens: the plane at the focus distance projects where the pinhole would put it
  e[8] += (-e[0] * lens.ax) / b.focus + (2 * lens.jx) / w;
  e[9] += (-e[5] * lens.ay) / b.focus + (2 * lens.jy) / h;
  camera.projectionMatrixInverse.copy(camera.projectionMatrix).invert();
  camera.updateMatrixWorld(true);
}

// ---------------------------------------------------------------- sequences
const halton = (i, b) => { let f = 1, r = 0; while (i > 0) { f /= b; r += f * (i % b); i = Math.floor(i / b); } return r; };
// a point on the unit disc (concentric map, Shirley-Chiu: even, no clumps)
function disc(u, v) {
  const a = 2 * u - 1, b = 2 * v - 1;
  if (a === 0 && b === 0) return [0, 0];
  let r, phi;
  if (Math.abs(a) > Math.abs(b)) { r = a; phi = (Math.PI / 4) * (b / a); } else { r = b; phi = Math.PI / 2 - (Math.PI / 4) * (a / b); }
  return [r * Math.cos(phi), r * Math.sin(phi)];
}

// ---------------------------------------------------------------- the diorama state
let SAVED = null, LOOK = null, dome = null, extraLights = [];
const lit = (m) => m && (m.isMeshStandardMaterial || m.isMeshLambertMaterial || m.isMeshPhongMaterial || m.isMeshPhysicalMaterial);
const matsOf = (o) => (o.material ? (Array.isArray(o.material) ? o.material : [o.material]) : []);
function patchChunks() {
  const C = K.ShaderChunk;
  if (C.__dio) return;
  C.__dio = { common: C.common, project_vertex: C.project_vertex, color_fragment: C.color_fragment, roughnessmap_fragment: C.roughnessmap_fragment, normal_fragment_maps: C.normal_fragment_maps };
  // the model's paint: a world-space value noise (attached to the geometry, before the city's bend) that varies the
  // paint's tone a little (hand-painted, two scales), raises its roughness to a matte paint's and bumps the normal
  // with a fine plaster grain; per material by the define DIO_MODEL (its numbers in DIO_TONE, DIO_MINR, DIO_BUMP)
  C.common += `
#ifdef DIO_MODEL
varying vec3 vDioW;
float dioHash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float dioNoise(vec3 x) { vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(dioHash(i), dioHash(i + vec3(1, 0, 0)), f.x), mix(dioHash(i + vec3(0, 1, 0)), dioHash(i + vec3(1, 1, 0)), f.x), f.y),
             mix(mix(dioHash(i + vec3(0, 0, 1)), dioHash(i + vec3(1, 0, 1)), f.x), mix(dioHash(i + vec3(0, 1, 1)), dioHash(i + vec3(1, 1, 1)), f.x), f.y), f.z); }
float dioFbm(vec3 p) { return 0.5 * dioNoise(p) + 0.3 * dioNoise(p * 2.03 + 7.1) + 0.2 * dioNoise(p * 4.11 + 3.3); }
#endif
`;
  C.project_vertex = C.project_vertex.replace("mvPosition = modelMatrix * mvPosition;\n", "mvPosition = modelMatrix * mvPosition;\n#ifdef DIO_MODEL\nvDioW = mvPosition.xyz;\n#endif\n");
  C.color_fragment += `
#ifdef DIO_MODEL
float dioA = dioFbm(vDioW * 0.09), dioB = dioFbm(vDioW * 0.9);
diffuseColor.rgb *= 1.0 + DIO_TONE * (dioA - 0.5) * 1.4 + DIO_TONE * 0.6 * (dioB - 0.5);
#endif
`;
  C.roughnessmap_fragment += `
#ifdef DIO_MODEL
roughnessFactor = clamp(max(roughnessFactor, DIO_MINR) + 0.12 * (dioB - 0.5), 0.05, 1.0);
#endif
`;
  C.normal_fragment_maps += `
#ifdef DIO_MODEL
{ float dioH = dioFbm(vDioW * 3.1) + 0.5 * dioFbm(vDioW * 9.3);
  vec3 dioP = - vViewPosition, dioSx = dFdx(dioP), dioSy = dFdy(dioP);
  float dioHx = dFdx(dioH), dioHy = dFdy(dioH);
  vec3 dioR1 = cross(dioSy, normal), dioR2 = cross(normal, dioSx);
  float dioDet = dot(dioSx, dioR1);
  vec3 dioG = sign(dioDet) * (dioHx * dioR1 + dioHy * dioR2);
  normal = normalize(abs(dioDet) * normal - DIO_BUMP * dioG); }
#endif
`;
}
function setDefine(m, on, look) {
  m.defines = m.defines || {};
  const had = "DIO_MODEL" in m.defines;
  if (on) { m.defines.DIO_MODEL = ""; m.defines.DIO_TONE = (look.tone ?? 0.06).toFixed(4); m.defines.DIO_MINR = (look.minRough ?? 0.72).toFixed(3); m.defines.DIO_BUMP = (look.bump ?? 0.035).toFixed(4); }
  else { delete m.defines.DIO_MODEL; delete m.defines.DIO_TONE; delete m.defines.DIO_MINR; delete m.defines.DIO_BUMP; }
  if (had !== on) m.needsUpdate = true;
}
// the map's blob shadows (contact quads under the buildings and trees): the real shadows replace them
const isBlob = (o) => o.isMesh && o.material && !Array.isArray(o.material) && o.material.isMeshBasicMaterial && o.material.transparent && o.material.map && o.material.color && o.material.color.getHex() === 0x1c1026;
function setup(look = {}) {
  if (SAVED) teardown();
  LOOK = look;
  patchChunks();
  const sv = { meshes: [], hemi: { c: S.hemi.color.clone(), g: S.hemi.groundColor.clone(), i: S.hemi.intensity }, fill: S.fill ? S.fill.intensity : 0, sun: { c: S.sun.color.clone(), i: S.sun.intensity, mapSize: S.sun.shadow.mapSize.x, bias: S.sun.shadow.bias, nb: S.sun.shadow.normalBias, cam: { l: S.sun.shadow.camera.left, r: S.sun.shadow.camera.right, t: S.sun.shadow.camera.top, b: S.sun.shadow.camera.bottom, n: S.sun.shadow.camera.near, f: S.sun.shadow.camera.far } }, sm: { on: R.shadowMap.enabled, type: R.shadowMap.type, auto: R.shadowMap.autoUpdate }, fog: scene.fog ? { c: scene.fog.color.clone(), n: scene.fog.near, f: scene.fog.far } : null, bg: scene.background, sky: { vis: S.sky.visible, u: Object.fromEntries(Object.entries(S.sky.material.uniforms).map(([k, v]) => [k, v.value.clone ? v.value.clone() : v.value])) }, exp: R.toneMappingExposure, mats: new Set() };
  scene.traverse((o) => {
    if (!o.isMesh && !o.isInstancedMesh) return;
    if (isBlob(o)) { sv.meshes.push([o, o.visible, o.castShadow, o.receiveShadow]); o.visible = false; return; }
    const ms = matsOf(o), any = ms.some(lit), opaque = ms.every((m) => !m.transparent || m.alphaTest > 0);
    sv.meshes.push([o, o.visible, o.castShadow, o.receiveShadow]);
    if (o === S.sky) return;
    o.castShadow = any && opaque && !o.userData.dioNoCast; o.receiveShadow = any;
    if (look.model !== false) for (const m of ms) if (m.isMeshStandardMaterial && !m.userData.dioKeep && m.metalness < 0.5 && !m.transparent && !m.isMeshPhysicalMaterial) { setDefine(m, true, look); sv.mats.add(m); }
  });
  R.shadowMap.enabled = true; R.shadowMap.type = K.PCFShadowMap; R.shadowMap.autoUpdate = false;
  const sun = S.sun; sun.castShadow = true;
  const ms = look.sunMap || 4096; if (sun.shadow.mapSize.x !== ms) { sun.shadow.mapSize.set(ms, ms); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
  sun.shadow.bias = look.sunBias ?? -0.00025; sun.shadow.normalBias = look.sunNormalBias ?? 0.35;
  if (!dome) { dome = new K.DirectionalLight("#ffffff", 0); dome.castShadow = true; scene.add(dome, dome.target); }
  const dm = look.domeMap || 2048; if (dome.shadow.mapSize.x !== dm) { dome.shadow.mapSize.set(dm, dm); if (dome.shadow.map) { dome.shadow.map.dispose(); dome.shadow.map = null; } }
  dome.shadow.bias = look.domeBias ?? -0.0004; dome.shadow.normalBias = look.domeNormalBias ?? 0.6; dome.visible = true;
  applyLook();
  if (S.farClouds) { sv.fc = S.farClouds.visible; S.farClouds.visible = !!look.clouds; }
  SAVED = sv;
  return { mats: sv.mats.size, meshes: sv.meshes.length };
}
// the look's lights, sky and fog (again before every frame: the map's loop sets some of them on each of its ticks)
function applyLook() {
  const look = LOOK || {};
  if (S.fill) S.fill.intensity = look.fill ?? 0;
  // the hemisphere keeps only its ground half: the bounce off the street (the sky's half is the shadowed dome)
  S.hemi.color.setRGB(0, 0, 0); S.hemi.groundColor.set(look.bounce || "#b89a80"); S.hemi.intensity = look.bounceK ?? 0.5;
  // the sky: the map's gradient dome, our colours (painted backdrop, as a diorama's)
  if (look.sky) { const u = S.sky.material.uniforms; u.top.value.set(look.sky.top); u.mid.value.set(look.sky.mid); u.hor.value.set(look.sky.hor); S.sky.visible = true; scene.background = null; }
  if (look.fog && scene.fog) { scene.fog.color.set(look.fog.color); scene.fog.near = look.fog.near; scene.fog.far = look.fog.far; }
  if (S.farClouds) S.farClouds.visible = !!look.clouds;
}
function teardown() {
  if (!SAVED) return;
  const sv = SAVED;
  for (const [o, v, c, r] of sv.meshes) { o.visible = v; o.castShadow = c; o.receiveShadow = r; }
  for (const m of sv.mats) setDefine(m, false, {});
  S.hemi.color.copy(sv.hemi.c); S.hemi.groundColor.copy(sv.hemi.g); S.hemi.intensity = sv.hemi.i;
  if (S.fill) S.fill.intensity = sv.fill;
  const sun = S.sun; sun.color.copy(sv.sun.c); sun.intensity = sv.sun.i; sun.shadow.bias = sv.sun.bias; sun.shadow.normalBias = sv.sun.nb;
  if (sun.shadow.mapSize.x !== sv.sun.mapSize) { sun.shadow.mapSize.set(sv.sun.mapSize, sv.sun.mapSize); if (sun.shadow.map) { sun.shadow.map.dispose(); sun.shadow.map = null; } }
  Object.assign(sun.shadow.camera, { left: sv.sun.cam.l, right: sv.sun.cam.r, top: sv.sun.cam.t, bottom: sv.sun.cam.b, near: sv.sun.cam.n, far: sv.sun.cam.f }); sun.shadow.camera.updateProjectionMatrix();
  R.shadowMap.enabled = sv.sm.on; R.shadowMap.type = sv.sm.type; R.shadowMap.autoUpdate = sv.sm.auto;
  if (sv.fog && scene.fog) { scene.fog.color.copy(sv.fog.c); scene.fog.near = sv.fog.n; scene.fog.far = sv.fog.f; }
  scene.background = sv.bg; S.sky.visible = sv.sky.vis; for (const [k, v] of Object.entries(sv.sky.u)) { const u = S.sky.material.uniforms[k]; if (u.value.copy) u.value.copy(v); else u.value = v; }
  if (S.farClouds && sv.fc != null) S.farClouds.visible = sv.fc;
  if (dome) dome.visible = false;
  for (const l of extraLights) l.parent && l.parent.remove(l); extraLights = [];
  R.toneMappingExposure = sv.exp;
  SAVED = null; LOOK = null;
}

// ---------------------------------------------------------------- targets and passes
let T = null;
function targets(w, h) {
  if (T && T.w === w && T.h === h) return T;
  if (T) for (const k of ["sample", "acc", "out", "b0", "b1", "b2"]) T[k].dispose();
  const rt = (ww, hh, type, depth = false) => { const t = new K.WebGLRenderTarget(ww, hh, { type, format: K.RGBAFormat, depthBuffer: depth, stencilBuffer: false, minFilter: K.LinearFilter, magFilter: K.LinearFilter }); t.texture.generateMipmaps = false; t.texture.colorSpace = K.LinearSRGBColorSpace; return t; };
  const bw = Math.ceil(w / 4), bh = Math.ceil(h / 4);
  T = { w, h, sample: rt(w, h, K.HalfFloatType, true), acc: rt(w, h, K.FloatType), out: rt(w, h, K.UnsignedByteType), b0: rt(bw, bh, K.HalfFloatType), b1: rt(bw, bh, K.HalfFloatType), b2: rt(bw, bh, K.HalfFloatType), bw, bh };
  return T;
}
const quadScene = new K.Scene(), quadCam = new K.OrthographicCamera(-1, 1, 1, -1, 0, 1), quad = new K.Mesh(new K.PlaneGeometry(2, 2));
quad.frustumCulled = false; quadScene.add(quad);
const VS = "varying vec2 vUv; void main(){ vUv = uv; gl_Position = vec4(position.xy, 0.0, 1.0); }";
const mat = (fs, uniforms, extra = {}) => new K.ShaderMaterial({ vertexShader: VS, fragmentShader: fs, uniforms, depthTest: false, depthWrite: false, toneMapped: false, ...extra });
const accM = mat("uniform sampler2D src; varying vec2 vUv; void main(){ gl_FragColor = vec4(texture2D(src, vUv).rgb, 1.0); }", { src: { value: null } }, { blending: K.AdditiveBlending, transparent: true });
// bloom: the bright part (soft knee), quartered, blurred twice at growing radii
const brightM = mat(`uniform sampler2D src; uniform float inv, thr, knee; uniform vec2 px; varying vec2 vUv;
void main(){ vec3 c = vec3(0.0); for (int i = 0; i < 4; i++) { vec2 o = vec2(float(i % 2), float(i / 2)) - 0.5; c += texture2D(src, vUv + o * px * 2.0).rgb; } c *= inv * 0.25;
  float br = max(c.r, max(c.g, c.b)), soft = clamp(br - thr + knee, 0.0, 2.0 * knee); soft = soft * soft / (4.0 * knee + 1e-4);
  float k = max(soft, br - thr) / max(br, 1e-4); gl_FragColor = vec4(c * k, 1.0); }`, { src: { value: null }, inv: { value: 1 }, thr: { value: 1 }, knee: { value: 0.5 }, px: { value: new K.Vector2() } });
const blurM = mat(`uniform sampler2D src; uniform vec2 dir; varying vec2 vUv;
void main(){ vec3 c = texture2D(src, vUv).rgb * 0.2270270; c += (texture2D(src, vUv + dir * 1.3846154).rgb + texture2D(src, vUv - dir * 1.3846154).rgb) * 0.3162162;
  c += (texture2D(src, vUv + dir * 3.2307692).rgb + texture2D(src, vUv - dir * 3.2307692).rgb) * 0.0702703; gl_FragColor = vec4(c, 1.0); }`, { src: { value: null }, dir: { value: new K.Vector2() } });
// the picture: exposure, bloom, white balance, AgX (Troy Sobotka's, as three's), our LUT, vignette, grain
const finalM = mat(`precision highp float; precision highp sampler3D;
uniform sampler2D src, bloom; uniform sampler3D lut; uniform float inv, exposure, bloomK, vig, grain, seed, lutMix, sat, power, tmo; uniform vec3 wb; uniform vec2 res; varying vec2 vUv;
const mat3 LIN_REC2020 = mat3(vec3(0.6274, 0.0691, 0.0164), vec3(0.3293, 0.9195, 0.0880), vec3(0.0433, 0.0113, 0.8956));
const mat3 REC2020_LIN = mat3(vec3(1.6605, -0.1246, -0.0182), vec3(-0.5876, 1.1329, -0.1006), vec3(-0.0728, -0.0083, 1.1187));
const mat3 AgXIn = mat3(vec3(0.856627153315983, 0.137318972929847, 0.11189821299995), vec3(0.0951212405381588, 0.761241990602591, 0.0767994186031903), vec3(0.0482516061458583, 0.101439036467562, 0.811302368396859));
const mat3 AgXOut = mat3(vec3(1.1271005818144368, -0.1413297634984383, -0.14132976349843826), vec3(-0.11060664309660323, 1.157823702216272, -0.11060664309660294), vec3(-0.016493938717834573, -0.016493938717834257, 1.2519364065950405));
vec3 agxC(vec3 x) { vec3 x2 = x * x, x4 = x2 * x2; return 15.5 * x4 * x2 - 40.14 * x4 * x + 31.96 * x4 - 6.868 * x2 * x + 0.4298 * x2 + 0.1191 * x - 0.00232; }
vec3 agx(vec3 c) { c = LIN_REC2020 * c; c = AgXIn * c; c = max(c, 1e-10); c = log2(c); c = (c + 12.47393) / 16.5; c = clamp(c, 0.0, 1.0); c = agxC(c); c = AgXOut * c; c = pow(max(vec3(0.0), c), vec3(2.2)); c = REC2020_LIN * c; return clamp(c, 0.0, 1.0); }
vec3 neutral(vec3 color) { const float SC = 0.76, DS = 0.15; float x = min(color.r, min(color.g, color.b)); float off = x < 0.08 ? x - 6.25 * x * x : 0.04; color -= off;
  float peak = max(color.r, max(color.g, color.b)); if (peak < SC) return color; float d = 1.0 - SC; float np = 1.0 - d * d / (peak + d - SC); color *= np / peak; float g = 1.0 - 1.0 / (DS * (peak - np) + 1.0); return mix(color, vec3(np), g); }
vec3 toSRGB(vec3 c) { return mix(c * 12.92, 1.055 * pow(c, vec3(1.0 / 2.4)) - 0.055, step(0.0031308, c)); }
float h12(vec2 p) { vec3 p3 = fract(vec3(p.xyx) * 0.1031); p3 += dot(p3, p3.yzx + 33.33); return fract((p3.x + p3.y) * p3.z); }
void main(){
  vec3 c = texture2D(src, vUv).rgb * inv;
  c += texture2D(bloom, vUv).rgb * bloomK;
  c *= exposure * wb;
  vec3 d = tmo > 0.5 ? toSRGB(clamp(neutral(c), 0.0, 1.0)) : toSRGB(agx(c));
  d = pow(d, vec3(power));
  float y = dot(d, vec3(0.2126, 0.7152, 0.0722)); d = mix(vec3(y), d, sat);
  vec3 g = texture(lut, clamp(d, 0.0, 1.0) * (32.0 / 33.0) + 0.5 / 33.0).rgb; d = mix(d, g, lutMix);
  vec2 q = vUv - 0.5; q.x *= res.x / res.y; float r = length(q) / 0.62; d *= mix(1.0, 1.0 - vig, smoothstep(0.35, 1.25, r));
  // grain: two octaves of white noise, a hair of correlation, strongest in the mids
  float n = (h12(gl_FragCoord.xy + seed * 61.7) + h12(gl_FragCoord.xy * 0.5 + seed * 13.1) * 0.6 - 0.8) / 0.8;
  float yy = dot(d, vec3(0.2126, 0.7152, 0.0722)); d += n * grain * (0.35 + 1.6 * yy * (1.0 - yy));
  gl_FragColor = vec4(clamp(d, 0.0, 1.0), 1.0); }`, { src: { value: null }, bloom: { value: null }, lut: { value: null }, inv: { value: 1 }, exposure: { value: 1 }, bloomK: { value: 0.05 }, vig: { value: 0.22 }, grain: { value: 0.02 }, seed: { value: 0 }, lutMix: { value: 1 }, sat: { value: 1 }, power: { value: 1 }, tmo: { value: 0 }, wb: { value: new K.Vector3(1, 1, 1) }, res: { value: new K.Vector2() } });
const LUTS = {};
function lutTex(name) {
  if (LUTS[name]) return LUTS[name];
  const N = 33, data = lutTable(name, N), t = new K.Data3DTexture(data, N, N, N);
  t.type = K.FloatType; t.format = K.RGBAFormat; t.minFilter = t.magFilter = K.LinearFilter; t.wrapS = t.wrapT = t.wrapR = K.ClampToEdgeWrapping; t.unpackAlignment = 1; t.needsUpdate = true;
  return (LUTS[name] = t);
}
function pass(m, target) { quad.material = m; R.setRenderTarget(target); R.render(quadScene, quadCam); }

// ---------------------------------------------------------------- lights per sub-frame
// the sun's direction from azimuth / elevation (deg; azimuth 0 = from +z, 90 = from +x), jittered on its disc
function dirFromAzEl(az, el) { const a = (az * Math.PI) / 180, e = (el * Math.PI) / 180; return new V3(Math.sin(a) * Math.cos(e), Math.sin(e), Math.cos(a) * Math.cos(e)); }
function jitterDir(d, radDeg, u, v) {
  if (!radDeg) return d.clone();
  const t = new V3(0, 1, 0).cross(d); if (t.lengthSq() < 1e-6) t.set(1, 0, 0); t.normalize(); const b = d.clone().cross(t).normalize();
  const [x, y] = disc(u, v), r = Math.tan((radDeg * Math.PI) / 180);
  return d.clone().addScaledVector(t, x * r).addScaledVector(b, y * r).normalize();
}
function aimShadow(light, dir, centre, ext, dist = 2600) {
  light.position.copy(centre).addScaledVector(dir, dist); light.target.position.copy(centre);
  const c = light.shadow.camera; c.left = -ext; c.right = ext; c.top = ext; c.bottom = -ext; c.near = Math.max(10, dist - 2400); c.far = dist + 900; c.updateProjectionMatrix();
  light.updateMatrixWorld(true); light.target.updateMatrixWorld(true);
  light.shadow.needsUpdate = true;
}
// the sky's radiance in a direction: the gradient the backdrop is painted with (linear), brighter towards the sun
function skyRadiance(look, d, sunDir) {
  const top = new K.Color(look.sky.top), mid = new K.Color(look.sky.mid), hor = new K.Color(look.sky.hor);
  const h = d.y, c = h > 0.0 ? mid.clone().lerp(top, Math.min(1, Math.max(0, (h - 0.02) / 0.53))) : hor.clone();
  c.lerp(hor, 1 - Math.min(1, Math.max(0, (h + 0.02) / 0.14)));
  const g = Math.pow(Math.max(0, d.dot(sunDir)), 6) * (look.domeSunGlow ?? 0.6);
  return c.multiplyScalar(1 + g);
}

// ---------------------------------------------------------------- one frame
// spec: { w, h, samples, cams: [sub-frame cameras (camera.js, logical)], look (setup's), focusPt?, poses: [fn per sub-frame
//   index] (sets the shot's moving things for that instant), post: { exposure, bloomK, bloomThr, vig, grain, lut, lutMix,
//   sat, wb }, seed, sun: { az, el, color, intensity, radius }, shadowCentre: [x, y, z], shadowExt, domeK }
function renderFrame(spec, hooks = {}) {
  const t0 = performance.now ? Date.now() : 0;
  const { w, h } = spec, N = spec.cams.length, look = LOOK || {};
  const TT = targets(w, h);
  applyLook();
  const prevRT = R.getRenderTarget(), prevAuto = R.autoClear, prevTM = R.toneMapping, cc = R.getClearColor(new K.Color()), ca = R.getClearAlpha();
  const camSave = { p: camera.position.clone(), q: camera.quaternion.clone(), fov: camera.fov, near: camera.near, far: camera.far, aspect: camera.aspect, view: camera.view ? { ...camera.view } : null };
  const sun = S.sun, sunBase = dirFromAzEl(spec.sun.az, spec.sun.el);
  sun.color.set(spec.sun.color || "#ffd2a0"); sun.intensity = spec.sun.intensity ?? 3;
  const centreL = spec.shadowCentre ? W(spec.shadowCentre) : null;
  R.setRenderTarget(TT.acc); R.setClearColor(0x000000, 0); R.clear(true, false, false);
  const fogSave = scene.fog;
  for (let i = 0; i < N; i++) {
    hooks.pose && hooks.pose(i);
    const b = bend(spec.cams[i]);
    // the aperture (Halton 2,3), the pixel jitter (5,7), the sun's disc (11,13), the dome (17,19): decorrelated
    const [dx, dy] = disc(halton(i + 1, 2), halton(i + 1, 3)), A = spec.cams[i].aperture || 0;
    placeCamera(b, w, h, { ax: dx * A, ay: dy * A, jx: halton(i + 1, 5) - 0.5, jy: halton(i + 1, 7) - 0.5 }, spec.near || 1.5, spec.far || 30000);
    S.sky.position.copy(camera.position); S.sky.updateMatrixWorld(true);
    const centre = centreL || b.pos.clone().addScaledVector(b.fwd, b.focus);
    const sd = jitterDir(sunBase, spec.sun.radius ?? 1.2, halton(i + 1, 11), halton(i + 1, 13));
    aimShadow(sun, sd, centre, spec.shadowExt || 700);
    if (dome && look.sky) {
      // a direction on the upper hemisphere (uniform in solid angle, kept above 4 degrees)
      const u = halton(i + 1, 17), v = halton(i + 1, 19), y = 0.07 + 0.93 * u, r = Math.sqrt(1 - y * y), ph = 2 * Math.PI * v;
      const dd = new V3(r * Math.cos(ph), y, r * Math.sin(ph));
      const L = skyRadiance(look, dd, sunBase);
      // uniform pdf 1 / (2 pi) over the part sampled: E = 2 pi (0.93) L cos; three's directional gives intensity * cos
      dome.color.copy(L); dome.intensity = 2 * Math.PI * 0.93 * (spec.domeK ?? look.domeK ?? 0.5);
      aimShadow(dome, dd, centre, spec.domeExt || spec.shadowExt || 700);
    }
    R.toneMapping = K.NoToneMapping; R.shadowMap.needsUpdate = true; // (the renderer's own flag: with autoUpdate off, no light's map is drawn without it)
    R.setRenderTarget(TT.sample); R.setClearColor(0x000000, 1); R.autoClear = true;
    R.render(scene, camera);
    accM.uniforms.src.value = TT.sample.texture; R.autoClear = false; pass(accM, TT.acc); R.autoClear = true;
    if ((i & 7) === 7) R.getContext().flush();
  }
  // bloom
  const P = spec.post || {};
  brightM.uniforms.src.value = TT.acc.texture; brightM.uniforms.inv.value = 1 / N; brightM.uniforms.thr.value = P.bloomThr ?? 1.1; brightM.uniforms.knee.value = 0.6; brightM.uniforms.px.value.set(1 / w, 1 / h);
  pass(brightM, TT.b0);
  let a = TT.b0, bb = TT.b1;
  for (const rad of [1, 2.5, 5]) { blurM.uniforms.src.value = a.texture; blurM.uniforms.dir.value.set(rad / TT.bw, 0); pass(blurM, bb); blurM.uniforms.src.value = bb.texture; blurM.uniforms.dir.value.set(0, rad / TT.bh); pass(blurM, a); }
  const F = finalM.uniforms;
  F.src.value = TT.acc.texture; F.bloom.value = a.texture; F.lut.value = lutTex(P.lut || "cromatic-diorama"); F.inv.value = 1 / N;
  F.exposure.value = P.exposure ?? 1; F.bloomK.value = P.bloomK ?? 0.06; F.vig.value = P.vig ?? 0.22; F.grain.value = P.grain ?? 0.022; F.seed.value = spec.seed ?? 0; F.lutMix.value = P.lutMix ?? 1; F.sat.value = P.sat ?? 1; F.power.value = P.power ?? 1; F.tmo.value = P.tonemap === "neutral" ? 1 : 0;
  F.wb.value.set(...(P.wb || [1, 1, 1])); F.res.value.set(w, h);
  pass(finalM, TT.out);
  const px = new Uint8Array(w * h * 4); R.readRenderTargetPixels(TT.out, 0, 0, w, h, px);
  // restore
  R.setRenderTarget(prevRT); R.autoClear = prevAuto; R.toneMapping = prevTM; R.setClearColor(cc, ca);
  camera.position.copy(camSave.p); camera.quaternion.copy(camSave.q); camera.fov = camSave.fov; camera.near = camSave.near; camera.far = camSave.far; camera.aspect = camSave.aspect; camera.clearViewOffset(); camera.updateProjectionMatrix();
  return { px, ms: Date.now() - t0 };
}
// pixels (bottom-up RGBA) to a PNG data URL
function toPNG(px, w, h) {
  const c = document.createElement("canvas"); c.width = w; c.height = h; const g = c.getContext("2d"), id = g.createImageData(w, h), row = w * 4;
  for (let y = 0; y < h; y++) id.data.set(px.subarray((h - 1 - y) * row, (h - y) * row), y * row);
  g.putImageData(id, 0, 0); return c.toDataURL("image/png");
}
// the map's own render at a camera (no lens, no jitter): the "before" (as A6 captured it)
function plain(c, w, h) {
  const b = bend(c), pr = R.getPixelRatio(), size = [R.domElement.width / pr, R.domElement.height / pr];
  R.setPixelRatio(1); R.setSize(w, h, false);
  placeCamera(b, w, h, undefined, 2, 30000);
  S.sky.position.copy(camera.position);
  const auto = S.sun.shadow.autoUpdate; S.sun.shadow.autoUpdate = false;
  R.setRenderTarget(null); R.render(scene, camera);
  const url = R.domElement.toDataURL("image/png");
  S.sun.shadow.autoUpdate = auto; R.setPixelRatio(pr); R.setSize(size[0], size[1], false);
  return url;
}
function addLight(l) { scene.add(l); if (l.target) scene.add(l.target); extraLights.push(l); return l; }
window.__D = { setup, teardown, renderFrame, toPNG, plain, bend, placeCamera, addLight, W, dirFromAzEl, get look() { return LOOK; } };
export default window.__D;
