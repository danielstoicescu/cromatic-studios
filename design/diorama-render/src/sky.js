// Cromatic · diorama renders (TASK-118): a painted backdrop sky for the evening shots (A8, Daniel: "a richer blue-hour
// sky, soft painted clouds lit from below by the last light, maybe the first stars; a diorama's painted backdrop, not a
// photo"). Swapped onto the map's sky dome for a shot, undone after. Clouds: a soft fbm on a plane over the city, cut
// into a few painted tones (no photographic detail), their bellies lit warm towards the low sun, their tops cool; stars:
// a sparse scatter high up, where the sky is clear.
//   const undo = paintSky(ctx, { top, mid, hor, glow: [az deg of the last light], clouds: 0..1, stars: 0..1 })
export function paintSky({ S, K }, o = {}) {
  const sky = S.sky, old = sky.material;
  const m = new K.ShaderMaterial({
    uniforms: {
      top: { value: new K.Color(o.top || "#0f1a4a") }, mid: { value: new K.Color(o.mid || "#3a3f8c") }, hor: { value: new K.Color(o.hor || "#f28a62") },
      lit: { value: new K.Color(o.lit || "#ffb07a") }, shade: { value: new K.Color(o.shade || "#3b3f7e") }, star: { value: new K.Color("#fff6e0") },
      glowDir: { value: new K.Vector3(Math.sin(((o.glow ?? 0) * Math.PI) / 180), 0, Math.cos(((o.glow ?? 0) * Math.PI) / 180)) },
      cover: { value: o.clouds ?? 0.55 }, stars: { value: o.stars ?? 0.6 }, k: { value: o.k ?? 1.0 },
      // P1: the sun itself in the backdrop (a painted disc, a soft halo, a wide warm glow), when o.sun = { az, el, size, color }
      sunDir: { value: o.sun ? new K.Vector3(Math.sin((o.sun.az * Math.PI) / 180) * Math.cos((o.sun.el * Math.PI) / 180), Math.sin((o.sun.el * Math.PI) / 180), Math.cos((o.sun.az * Math.PI) / 180) * Math.cos((o.sun.el * Math.PI) / 180)) : new K.Vector3(0, -1, 0) },
      sunCol: { value: new K.Color((o.sun && o.sun.color) || "#fff1c8") }, sunSize: { value: o.sun ? o.sun.size ?? 1.6 : 0 }
    },
    vertexShader: "varying vec3 vP; void main(){ vP = normalize(position); gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }",
    fragmentShader: `uniform vec3 top, mid, hor, lit, shade, star, glowDir, sunDir, sunCol; uniform float cover, stars, k, sunSize; varying vec3 vP;
float h(vec2 p){ p = fract(p * vec2(123.34, 456.21)); p += dot(p, p + 45.32); return fract(p.x * p.y); }
float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }
float fbm(vec2 p){ float a = 0.5, s = 0.0; for (int i = 0; i < 5; i++) { s += a * n(p); p = p * 2.03 + 17.1; a *= 0.5; } return s; }
void main(){
  vec3 d = normalize(vP); float y = d.y;
  // the backdrop's gradient: warm at the horizon towards the last light, deep blue overhead
  float toward = max(0.0, dot(normalize(vec3(d.x, 0.0, d.z)), glowDir));
  vec3 c = mix(hor, mid, smoothstep(0.0, 0.22, y)); c = mix(c, top, smoothstep(0.18, 0.75, y));
  c += hor * 0.35 * pow(toward, 3.0) * (1.0 - smoothstep(0.0, 0.3, y));
  // the clouds: a deck over the city, soft painted shapes in a few tones
  if (y > 0.015) {
    vec2 uv = d.xz / (y + 0.06) * 1.6; uv = vec2(uv.x * 0.45, uv.y * 1.25); // (long, thin bands: an evening's stratus)
    float base = fbm(uv * 1.3 + vec2(3.1, 7.7)), dens = smoothstep(1.0 - cover, 1.0 - cover + 0.3, base);
    float above = fbm(uv * 1.3 + vec2(3.1, 7.7) + glowDir.xz * 0.05 + vec2(0.0, 0.04));
    float belly = clamp((base - above) * 9.0 + 0.5, 0.0, 1.0); belly = floor(belly * 4.0 + 0.5) / 4.0; // (painted: a few tones)
    vec3 cc = mix(shade, lit, belly * (0.55 + 0.45 * toward)); cc = mix(cc, mid * 1.1, smoothstep(0.35, 0.9, y) * 0.5);
    float fade = smoothstep(0.015, 0.09, y);
    c = mix(c, cc, dens * fade * 0.8 * (1.0 - 0.55 * smoothstep(0.25, 0.8, y)));
    // the first stars, high and where it is clear
    vec2 sp = d.xz / (y + 0.35) * 220.0; float sh = h(floor(sp));
    float st = step(0.9965, sh) * smoothstep(0.35, 0.8, y) * (1.0 - dens) * stars;
    vec2 f = fract(sp) - 0.5; st *= smoothstep(0.32, 0.0, length(f));
    c += star * st * 3.0;
  }
  if (sunSize > 0.0) { float a = degrees(acos(clamp(dot(d, normalize(sunDir)), -1.0, 1.0)));
    c += sunCol * (smoothstep(sunSize, sunSize * 0.82, a) * 9.0 + exp(-a / (sunSize * 2.2)) * 1.4 + exp(-a / 18.0) * 0.35); }
  gl_FragColor = vec4(c * k, 1.0); }`,
    side: K.BackSide, depthWrite: false, fog: false
  });
  m.userData = { outlineParameters: { visible: false } };
  sky.material = m;
  return () => { sky.material = old; m.dispose(); };
}
