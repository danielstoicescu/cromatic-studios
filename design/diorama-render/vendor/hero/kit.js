// Cromatic · hero vehicles (TASK-111 follow-up, Radu): the shared kit for the garage's hero models. Same conventions as
// the hero Dacia 1300 (design/hero-car/src/dacia1300-hero.js): metres, origin on the ground under the middle of the
// wheelbase, +z forward, +y up, +x the vehicle's left. Built for offline renders (path traced or rasterised).
//
// Every model returns { group, body, wheels, mats, tex, parts, DIM }:
//   group   the root (place / yaw it); its direct children named "wheel" are the wheels (as on the hero 1300, so the
//           renderers' `group.children.filter(c => c.name === "wheel")` keeps working), spin them with rotation.x
//   body    everything sprung: pitch / roll it (pivot: the ground under the wheelbase's middle) without moving the wheels
//   parts   named moving or glowing parts (propeller, steer, beacons...)
// Material names follow the 1300's (chrome, satin chrome, glass, headlamp lens, bulb, tail red, amber) so the renderers'
// material passes (envMap, the lamps' emissive, simplified glass) treat every ride alike.

export const clamp = (v, a, b) => Math.max(a, Math.min(b, v)), lerp = (a, b, t) => a + (b - a) * t;
export const sstep = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
// a monotone cubic through (x, y) pairs (Fritsch-Carlson): smooth, never overshoots
export function pchip(pts) {
  const xs = pts.map((p) => p[0]), ys = pts.map((p) => p[1]), n = xs.length, d = [], m = new Array(n);
  for (let i = 0; i < n - 1; i++) d.push((ys[i + 1] - ys[i]) / (xs[i + 1] - xs[i]));
  m[0] = d[0]; m[n - 1] = d[n - 2];
  for (let i = 1; i < n - 1; i++) {
    if (d[i - 1] * d[i] <= 0) { m[i] = 0; continue; }
    const h0 = xs[i] - xs[i - 1], h1 = xs[i + 1] - xs[i], w1 = 2 * h1 + h0, w2 = h1 + 2 * h0;
    m[i] = (w1 + w2) / (w1 / d[i - 1] + w2 / d[i]);
  }
  return (x) => {
    if (x <= xs[0]) return ys[0];
    if (x >= xs[n - 1]) return ys[n - 1];
    let i = 0; while (x > xs[i + 1]) i++;
    const h = xs[i + 1] - xs[i], t = (x - xs[i]) / h, t2 = t * t, t3 = t2 * t;
    return (2 * t3 - 3 * t2 + 1) * ys[i] + (t3 - 2 * t2 + t) * h * m[i] + (-2 * t3 + 3 * t2) * ys[i + 1] + (t3 - t2) * h * m[i + 1];
  };
}

// ---------------------------------------------------------------- textures (canvas)
export function makeTex(T) {
  const cv = (w, h, draw) => { const c = document.createElement("canvas"); c.width = w; c.height = h; draw(c.getContext("2d"), w, h); return c; };
  const normalFrom = (w, h, H, k = 2) => {
    const c = document.createElement("canvas"); c.width = w; c.height = h; const ctx = c.getContext("2d"), im = ctx.createImageData(w, h);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      const dx = (H((x + 1) % w, y) - H((x - 1 + w) % w, y)) * k, dy = (H(x, (y + 1) % h) - H(x, (y - 1 + h) % h)) * k, l = Math.hypot(dx, dy, 1), o = (y * w + x) * 4;
      im.data[o] = (-dx / l * 0.5 + 0.5) * 255; im.data[o + 1] = (dy / l * 0.5 + 0.5) * 255; im.data[o + 2] = (1 / l * 0.5 + 0.5) * 255; im.data[o + 3] = 255;
    }
    ctx.putImageData(im, 0, 0); const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.colorSpace = T.NoColorSpace; return t;
  };
  const colour = (c, aniso = 8) => { const t = new T.CanvasTexture(c); t.colorSpace = T.SRGBColorSpace; t.anisotropy = aniso; return t; };
  const tread = normalFrom(128, 128, (x, y) => { const u = x / 128, v = y / 128; const block = Math.abs(((u * 2 + (v > 0.5 ? 0.25 : 0)) % 1) - 0.5) < 0.06 ? -1 : 0; const sipe = Math.abs(((u * 6 + v * 0.8) % 1) - 0.5) < 0.04 ? -0.5 : 0; return block + sipe; }, 1.5);
  const flutes = normalFrom(256, 256, (x, y) => { const a = Math.sin((x / 256) * Math.PI * 2 * 22); const b = y > 150 ? Math.sin((y / 256) * Math.PI * 2 * 18) * 0.6 : 0; return Math.abs(a) * 0.6 + Math.abs(b); }, 1.2);
  const prisms = normalFrom(128, 128, (x, y) => { const u = (x / 128) * 16 % 1, v = (y / 128) * 6 % 1; return 1 - Math.max(Math.abs(u - 0.5), Math.abs(v - 0.5)) * 2; }, 0.8);
  // fabric over ribs (the biplane's doped linen): soft ridges every rib, a faint weave
  const fabric = normalFrom(256, 256, (x, y) => { const u = x / 256, v = y / 256; const rib = Math.exp(-((((u * 8) % 1) - 0.5) ** 2) / 0.004) * 0.9; const sag = -Math.sin(((u * 8) % 1) * Math.PI) * 0.25; return rib + sag + 0.05 * Math.sin(v * 900) * Math.sin(u * 900); }, 1.4);
  const grip = normalFrom(128, 128, (x, y) => (Math.sin(x * 0.9) * Math.sin(y * 0.9) > 0.2 ? 1 : 0), 0.7); // the scooter's deck mat
  const plateRO = (text, w = 1040, h = 224) => colour(cv(w, h, (ctx) => {
    ctx.fillStyle = "#f4f4f0"; ctx.fillRect(0, 0, w, h); ctx.fillStyle = "#0f3d99"; ctx.fillRect(0, 0, 90, h);
    ctx.fillStyle = "#f4f4f0"; ctx.font = "700 48px Arial, sans-serif"; ctx.textAlign = "center"; ctx.fillText("RO", 45, 190);
    ctx.strokeStyle = "#111"; ctx.lineWidth = 8; ctx.strokeRect(4, 4, w - 8, h - 8);
    ctx.fillStyle = "#121212"; ctx.font = "700 170px 'DIN Alternate', 'Arial Narrow', Arial, sans-serif"; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(text, 565, 120);
  }));
  return { cv, normalFrom, colour, tread, flutes, prisms, fabric, grip, plateRO };
}

// ---------------------------------------------------------------- materials
export function baseMats(T, tex) {
  const P = (o) => new T.MeshPhysicalMaterial(o);
  const m = {
    chrome: P({ name: "chrome", color: new T.Color("#f4f5f7"), roughness: 0.055, metalness: 1 }),
    satin: P({ name: "satin chrome", color: new T.Color("#d9dce0"), roughness: 0.22, metalness: 1 }),
    alu: P({ name: "aluminium", color: new T.Color("#c9ccd1"), roughness: 0.32, metalness: 0.9 }),
    black: P({ name: "black trim", color: new T.Color("#0d0d0e"), roughness: 0.45, metalness: 0, clearcoat: 0.3, clearcoatRoughness: 0.3 }),
    plastic: P({ name: "black plastic", color: new T.Color("#141414"), roughness: 0.62, metalness: 0 }),
    rubber: P({ name: "rubber", color: new T.Color("#121212"), roughness: 0.82, metalness: 0 }),
    tyre: P({ name: "tyre", color: new T.Color("#151515"), roughness: 0.88, metalness: 0 }),
    tread: P({ name: "tread", color: new T.Color("#141414"), roughness: 0.92, metalness: 0, normalMap: tex.tread, normalScale: new T.Vector2(1.4, 1.4) }),
    slick: P({ name: "slick", color: new T.Color("#171717"), roughness: 0.7, metalness: 0 }),
    steel: P({ name: "steel wheel", color: new T.Color("#c3c6ca"), roughness: 0.32, metalness: 0.75, clearcoat: 0.6, clearcoatRoughness: 0.12 }),
    glass: P({ name: "glass", color: new T.Color("#eef6f2"), roughness: 0, metalness: 0, transmission: 1, ior: 1.52, thickness: 0.004, transparent: true, side: T.DoubleSide }),
    lens: P({ name: "headlamp lens", color: new T.Color("#fbfaf2"), roughness: 0.02, metalness: 0, transmission: 1, ior: 1.5, thickness: 0.006, normalMap: tex.flutes, normalScale: new T.Vector2(0.55, 0.55), transparent: true, side: T.DoubleSide }),
    red: P({ name: "tail red", color: new T.Color("#a8120c"), roughness: 0.12, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.02, normalMap: tex.prisms, normalScale: new T.Vector2(0.35, 0.35) }),
    amber: P({ name: "amber", color: new T.Color("#e3780f"), roughness: 0.12, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.02, normalMap: tex.prisms, normalScale: new T.Vector2(0.35, 0.35) }),
    clear: P({ name: "reverse lens", color: new T.Color("#e9e6dc"), roughness: 0.1, metalness: 0, clearcoat: 1, normalMap: tex.prisms, normalScale: new T.Vector2(0.35, 0.35) }),
    bulb: P({ name: "bulb", color: new T.Color("#fffbe8"), roughness: 0.05, metalness: 0, transmission: 0.9, transparent: true }),
    mirror: P({ name: "mirror glass", color: new T.Color("#ffffff"), roughness: 0.0, metalness: 1 }),
    gap: P({ name: "panel gap", color: new T.Color("#0b0907"), roughness: 0.75, metalness: 0 }),
    under: P({ name: "underbody", color: new T.Color("#141110"), roughness: 0.9, metalness: 0, side: T.DoubleSide }),
    dash: P({ name: "dashboard", color: new T.Color("#1c1a19"), roughness: 0.6, metalness: 0 }),
    liner: P({ name: "headliner", color: new T.Color("#cfc6b3"), roughness: 0.9, metalness: 0 }),
    carpet: P({ name: "carpet", color: new T.Color("#1d1715"), roughness: 0.95, metalness: 0 }),
    leather: P({ name: "leather", color: new T.Color("#5b3622"), roughness: 0.5, metalness: 0, clearcoat: 0.3, clearcoatRoughness: 0.4 }),
    wood: P({ name: "varnished wood", color: new T.Color("#7a4a22"), roughness: 0.28, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.08 }),
    engine: P({ name: "engine metal", color: new T.Color("#8d9196"), roughness: 0.45, metalness: 0.8 }),
    darkMetal: P({ name: "dark metal", color: new T.Color("#2a2b2e"), roughness: 0.5, metalness: 0.7 })
  };
  for (const k of ["chrome", "satin", "alu", "black", "plastic", "rubber", "tyre", "tread", "slick", "steel", "under", "engine", "darkMetal"]) m[k].side = T.DoubleSide;
  return m;
}
export const paintMat = (T, color, o = {}) => new T.MeshPhysicalMaterial({ name: o.name || "paint", color: new T.Color(color), roughness: 0.3, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.035, side: T.DoubleSide, ...o, ...(o.name ? {} : {}) });
// an emissive lamp material (off by default: the renderers turn emissiveIntensity up)
export const glowMat = (T, name, color, glow) => new T.MeshPhysicalMaterial({ name, color: new T.Color(color), roughness: 0.15, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.03, emissive: new T.Color(glow), emissiveIntensity: 0 });

// ---------------------------------------------------------------- geometry helpers bound to a parent
export function makeKit(T, root) {
  const V3 = (x, y, z) => new T.Vector3(x, y, z);
  const add = (geo, mat, name, parent = root) => { const m = new T.Mesh(geo, mat); m.name = name || mat.name; m.castShadow = true; m.receiveShadow = true; parent.add(m); return m; };
  const flipIdx = (g) => { const ia = g.index.array; for (let i = 0; i < ia.length; i += 3) { const t0 = ia[i]; ia[i] = ia[i + 1]; ia[i + 1] = t0; } g.computeVertexNormals(); };
  // a sweep of a profile [[u, v]] along a path [{ p, n }] (u along n, v along the binormal)
  function sweepGeo(path, prof, { closed = false, caps = true } = {}) {
    const pos = [], idx = [], np = prof.length;
    for (let i = 0; i < path.length; i++) {
      const { p, n } = path[i], a = path[Math.max(0, i - 1)].p, b = path[Math.min(path.length - 1, i + 1)].p;
      const t = b.clone().sub(a).normalize(), bn = new T.Vector3().crossVectors(t, n).normalize(), nn = new T.Vector3().crossVectors(bn, t).normalize();
      for (const [u, v] of prof) pos.push(...p.clone().addScaledVector(nn, u).addScaledVector(bn, v).toArray());
    }
    for (let i = 0; i < path.length - 1; i++) for (let k = 0; k < np - (closed ? 0 : 1); k++) {
      const k2 = (k + 1) % np, a = i * np + k, b = i * np + k2, c = (i + 1) * np + k, d = (i + 1) * np + k2;
      idx.push(a, c, b, b, c, d);
    }
    if (caps && closed) for (const i of [0, path.length - 1]) { const c0 = i * np; for (let k = 1; k < np - 1; k++) idx.push(...(i ? [c0, c0 + k, c0 + k + 1] : [c0, c0 + k + 1, c0 + k])); }
    const g = new T.BufferGeometry(); g.setAttribute("position", new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    { const P = g.attributes.position, N = g.attributes.normal; let dot = 0; for (let i = 0; i < path.length; i++) for (let k = 0; k < np; k++) { const v = i * np + k, p0 = path[i].p; dot += (P.getX(v) - p0.x) * N.getX(v) + (P.getY(v) - p0.y) * N.getY(v) + (P.getZ(v) - p0.z) * N.getZ(v); }
      if (dot < 0) flipIdx(g); }
    return g;
  }
  const sweep = (path, prof, mat, name, o, parent) => add(sweepGeo(path, prof, o), mat, name, parent);
  const roundProf = (r, n = 12, sq = 1) => Array.from({ length: n }, (_, k) => { const a = (k / n) * Math.PI * 2; return [Math.cos(a) * r, Math.sin(a) * r * sq]; });
  // a tube through points (a Catmull-Rom curve), round section r
  function tube(pts, r, mat, name, { seg = 64, rs = 12, parent, closed = false } = {}) {
    const c = new T.CatmullRomCurve3(pts.map((p) => (p.isVector3 ? p : V3(...p))), closed, "centripetal");
    const g = new T.TubeGeometry(c, seg, r, rs, closed); return add(g, mat, name, parent);
  }
  // a rod between two points
  function rod(a, b, r, mat, name, { seg = 12, parent, r2 } = {}) {
    const A = a.isVector3 ? a : V3(...a), B = b.isVector3 ? b : V3(...b), d = B.clone().sub(A);
    const g = new T.CylinderGeometry(r2 ?? r, r, d.length(), seg); const m = add(g, mat, name, parent);
    m.position.copy(A).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(V3(0, 1, 0), d.normalize()); return m;
  }
  // a lathe of [[r, a]] round the x axis (a along +x)
  function latheX(prof, mat, name, { seg = 64, parent } = {}) {
    const geo = new T.LatheGeometry(prof.map(([r, a]) => new T.Vector2(Math.max(0, r), a)), seg); geo.rotateZ(-Math.PI / 2); return add(geo, mat, name, parent);
  }
  // a lathe of [[r, a]] round the z axis (a along +z)
  function latheZ(prof, mat, name, { seg = 64, parent } = {}) {
    const geo = new T.LatheGeometry(prof.map(([r, a]) => new T.Vector2(Math.max(0, r), a)), seg); geo.rotateX(Math.PI / 2); return add(geo, mat, name, parent);
  }
  const rrShape = (w, h, r) => { const s = new T.Shape(), x = -w / 2, y = -h / 2; r = Math.min(r, w / 2, h / 2); s.moveTo(x + r, y); s.lineTo(x + w - r, y); s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r); s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h); s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r); s.quadraticCurveTo(x, y, x + r, y); return s; };
  const ringGeo = (w, h, r, t, depth, bevel = 0.004) => { const s = rrShape(w + 2 * t, h + 2 * t, r + t); s.holes.push(rrShape(w, h, r)); return new T.ExtrudeGeometry(s, { depth, bevelEnabled: true, bevelThickness: bevel, bevelSize: bevel * 0.8, bevelSegments: 4, curveSegments: 10 }); };
  // a rounded box (RoundedBoxGeometry if the caller passed it)
  let RB = null; const setRB = (c) => { RB = c; };
  function rbox(w, h, d, r, mat, name, at = [0, 0, 0], rot = null, parent) { const g = RB ? new RB(w, h, d, 4, Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4)) : new T.BoxGeometry(w, h, d); const m = add(g, mat, name, parent); m.position.set(...at); if (rot) m.rotation.set(...rot); return m; }
  // a profile (in the y-z plane: [z, y] points, closed) extruded across x by width w, rounded edges
  function sideExtrude(pts, w, mat, name, { bevel = 0.01, x = 0, parent, curveSegments = 12 } = {}) {
    const s = new T.Shape(pts.map(([z, y]) => new T.Vector2(z, y)));
    const dep = Math.max(0.0005, w - 2 * bevel);
    const g = new T.ExtrudeGeometry(s, { depth: dep, bevelEnabled: bevel > 0, bevelThickness: bevel, bevelSize: bevel, bevelSegments: 4, curveSegments });
    g.rotateY(-Math.PI / 2); g.translate(dep / 2 + x, 0, 0); return add(g, mat, name, parent);
  }
  // an airfoil section (chord c along z, leading edge at +z), thickness ratio th, camber cb: [[z, y]]
  function airfoil(c, th = 0.12, cb = 0.02, n = 24) {
    const up = [], lo = [];
    for (let i = 0; i <= n; i++) {
      const b = (1 - Math.cos((i / n) * Math.PI)) / 2; // 0 at the leading edge, 1 at the trailing edge (cosine spacing)
      const yt = 5 * th * (0.2969 * Math.sqrt(b) - 0.126 * b - 0.3516 * b * b + 0.2843 * b ** 3 - 0.1036 * b ** 4);
      const yc = cb * (b < 0.4 ? (2 * 0.4 * b - b * b) / 0.16 : ((1 - 0.8) + 0.8 * b - b * b) / 0.36);
      up.push([c / 2 - b * c, (yc + yt) * c]); lo.push([c / 2 - b * c, (yc - yt) * c]);
    }
    return [...up, ...lo.reverse().slice(1, -1)];
  }
  // a wing panel: an airfoil lofted along x from x0 to x1 (chords c0 -> c1, the leading edge at zLE(x), height y(x)),
  // rounded tips (the section shrinks over the last tipR of span); returns the mesh
  function wingPanel({ x0, x1, chord, zLE, y, th = 0.12, cb = 0.02, tip0 = 0, tip1 = 0.12, nSpan = 40, nChord = 24, mat, name = "wing", parent, uvScale = 1 }) {
    const sec = airfoil(1, th, cb, nChord), cols = sec.length + 1, rows = nSpan + 1, pos = [], uv = [], idx = [];
    for (let i = 0; i < rows; i++) {
      const x = lerp(x0, x1, i / nSpan);
      const dt0 = tip0 > 0 ? clamp((x - x0) / tip0, 0, 1) : 1, dt1 = tip1 > 0 ? clamp((x1 - x) / tip1, 0, 1) : 1, dt = Math.min(dt0, dt1);
      const k = Math.sqrt(1 - (1 - dt) ** 2); // a rounded tip in plan: the chord shrinks to a point round a circle
      const c = chord(x) * Math.max(0.02, k), zMid = zLE(x) - chord(x) / 2, hy = y(x);
      for (let j = 0; j < cols; j++) { const [sz, sy] = sec[j % sec.length]; pos.push(x, hy + sy * c * Math.max(0.35, k) / Math.max(0.02, k) * Math.max(0.02, k), zMid + sz * c); uv.push((x - x0) * uvScale, j / (cols - 1)); }
    }
    for (let i = 0; i < rows - 1; i++) for (let j = 0; j < cols - 1; j++) { const a = i * cols + j, b = a + 1, c2 = a + cols, d = c2 + 1; idx.push(a, b, c2, b, d, c2); }
    const g = new T.BufferGeometry(); g.setAttribute("position", new T.Float32BufferAttribute(pos, 3)); g.setAttribute("uv", new T.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    // (faces out)
    const P = g.attributes.position, N = g.attributes.normal; let dot = 0; const mid = Math.floor(rows / 2) * cols;
    for (let j = 0; j < cols; j++) { const v = mid + j; dot += N.getY(v) * (P.getY(v) - y(lerp(x0, x1, 0.5))); }
    if (dot < 0) flipIdx(g);
    return add(g, mat, name, parent);
  }
  // a grid surface: rows x cols of points P(i, j) -> [x, y, z]; keep(i, j) says which quads exist
  function gridGeo(rows, cols, P, keep, flip = false, uvF = null) {
    const pos = new Float32Array(rows * cols * 3), uv = new Float32Array(rows * cols * 2);
    for (let i = 0; i < rows; i++) for (let j = 0; j < cols; j++) { const p = P(i, j), o = (i * cols + j); pos[o * 3] = p[0]; pos[o * 3 + 1] = p[1]; pos[o * 3 + 2] = p[2]; const u = uvF ? uvF(i, j) : [j / (cols - 1), i / (rows - 1)]; uv[o * 2] = u[0]; uv[o * 2 + 1] = u[1]; }
    const idx = [];
    for (let i = 0; i < rows - 1; i++) for (let j = 0; j < cols - 1; j++) {
      if (keep && !keep(i, j)) continue;
      const a = i * cols + j, b = a + 1, c = a + cols, d = c + 1;
      if (!flip) idx.push(a, c, b, b, c, d); else idx.push(a, b, c, b, d, c);
    }
    const g = new T.BufferGeometry(); g.setAttribute("position", new T.BufferAttribute(pos, 3)); g.setAttribute("uv", new T.BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
    return g;
  }
  // a rounded quadrilateral through four corners (in order) with a radius per corner, as a dense outline
  function roundQuad(P, rad, n = 10) {
    const out = [];
    for (let i = 0; i < 4; i++) {
      const A = P[(i + 3) % 4], B = P[i], C = P[(i + 1) % 4], r = rad[i];
      const u = [A[0] - B[0], A[1] - B[1]], v = [C[0] - B[0], C[1] - B[1]], lu = Math.hypot(...u), lv = Math.hypot(...v);
      const p0 = [B[0] + (u[0] / lu) * r, B[1] + (u[1] / lu) * r], p1 = [B[0] + (v[0] / lv) * r, B[1] + (v[1] / lv) * r];
      for (let k = 0; k <= n; k++) { const t = k / n, a = (1 - t) * (1 - t), b = 2 * t * (1 - t), c = t * t; out.push([a * p0[0] + b * B[0] + c * p1[0], a * p0[1] + b * B[1] + c * p1[1]]); }
    }
    return out;
  }
  // triangulate an outline (with holes) in a surface's parameter space, split every edge longer than L (shared edges
  // split once: no cracks), then lay the vertices on the skin with map(a, b) -> { p, n } (the 1300's r4 method)
  function paramMesh(outer, holes, map, L, { inset = 0, flip = false, uv = null } = {}) {
    const shape = new T.Shape(outer.map(([a, b]) => new T.Vector2(a, b)));
    for (const h of holes) shape.holes.push(new T.Path(h.map(([a, b]) => new T.Vector2(a, b))));
    const g0 = new T.ShapeGeometry(shape, 1), P0 = g0.attributes.position;
    let V = []; for (let i = 0; i < P0.count; i++) V.push([P0.getX(i), P0.getY(i)]);
    let F = []; const I0 = g0.index.array; for (let i = 0; i < I0.length; i += 3) F.push([I0[i], I0[i + 1], I0[i + 2]]);
    for (let pass = 0; pass < 12; pass++) {
      const mid = new Map(), long = (a, b) => Math.hypot(V[a][0] - V[b][0], V[a][1] - V[b][1]) > L;
      const M = (a, b) => { const k = a < b ? a + "," + b : b + "," + a; if (!mid.has(k)) { V.push([(V[a][0] + V[b][0]) / 2, (V[a][1] + V[b][1]) / 2]); mid.set(k, V.length - 1); } return mid.get(k); };
      let any = false; const NF = [];
      for (const [a, b, c] of F) {
        const ab = long(a, b), bc = long(b, c), ca = long(c, a);
        if (!ab && !bc && !ca) { NF.push([a, b, c]); continue; }
        any = true;
        if (ab && bc && ca) { const x = M(a, b), y = M(b, c), z2 = M(c, a); NF.push([a, x, z2], [x, b, y], [z2, y, c], [x, y, z2]); continue; }
        const rot = [[a, b, c, ab, bc, ca], [b, c, a, bc, ca, ab], [c, a, b, ca, ab, bc]];
        const n = (ab ? 1 : 0) + (bc ? 1 : 0) + (ca ? 1 : 0);
        if (n === 1) { const [p, q, r] = rot.find((t) => t[3]); const m = M(p, q); NF.push([p, m, r], [m, q, r]); }
        else { const [p, q, r] = rot.find((t) => !t[3]); const m1 = M(q, r), m2 = M(r, p); NF.push([p, q, m1], [p, m1, m2], [m1, r, m2]); }
      }
      F = NF; if (!any) break;
    }
    const pos = [], nrm = [], uvs = [];
    for (const [a, b] of V) { const { p, n } = map(a, b); const q = p.clone().addScaledVector(n, -inset); pos.push(q.x, q.y, q.z); const s = flip ? -1 : 1; nrm.push(n.x * s, n.y * s, n.z * s); if (uv) uvs.push(...uv(a, b)); }
    const idx = []; for (const [a, b, c] of F) { if (flip) idx.push(a, c, b); else idx.push(a, b, c); }
    const g = new T.BufferGeometry(); g.setAttribute("position", new T.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new T.Float32BufferAttribute(nrm, 3)); if (uv) g.setAttribute("uv", new T.Float32BufferAttribute(uvs, 2)); g.setIndex(idx);
    const p = g.attributes.position, nn = g.attributes.normal, ia = g.index.array; let dot = 0;
    for (let i = 0; i < ia.length; i += 3) { const A = V3(p.getX(ia[i]), p.getY(ia[i]), p.getZ(ia[i])), B = V3(p.getX(ia[i + 1]), p.getY(ia[i + 1]), p.getZ(ia[i + 1])), C = V3(p.getX(ia[i + 2]), p.getY(ia[i + 2]), p.getZ(ia[i + 2])); const fn = new T.Vector3().crossVectors(B.clone().sub(A), C.clone().sub(A)); dot += fn.x * nn.getX(ia[i]) + fn.y * nn.getY(ia[i]) + fn.z * nn.getZ(ia[i]); }
    if (dot < 0) for (let i = 0; i < ia.length; i += 3) { const t0 = ia[i]; ia[i] = ia[i + 1]; ia[i + 1] = t0; }
    return g;
  }
  // the same, triangulated better for big panels: the outline and the holes resampled every Lb, a regular lattice of
  // points every L inside (kept off the edges), a Delaunay triangulation (Bowyer-Watson) in a metric space (param *
  // scale), the triangles outside the outline or inside a hole dropped. Far fewer, rounder triangles than paramMesh.
  function paramMeshD(outer, holes, map, L, { inset = 0, flip = false, scale = [1, 1], Lb = L * 0.5 } = {}) {
    const [ka, kb] = scale, toM = ([a, b]) => [a * ka, b * kb];
    const loops = [outer, ...holes].map((l) => l.map(toM));
    const inPoly = (pt, poly) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, yi] = poly[i], [xj, yj] = poly[j]; if ((yi > pt[1]) !== (yj > pt[1]) && pt[0] < ((xj - xi) * (pt[1] - yi)) / (yj - yi) + xi) c = !c; } return c; };
    const inside = (pt) => inPoly(pt, loops[0]) && !loops.slice(1).some((h) => inPoly(pt, h));
    const P = [];
    for (const l of loops) { for (let i = 0; i < l.length; i++) { const A = l[i], B = l[(i + 1) % l.length], d = Math.hypot(B[0] - A[0], B[1] - A[1]), n = Math.max(1, Math.ceil(d / Lb)); for (let k = 0; k < n; k++) P.push([lerp(A[0], B[0], k / n), lerp(A[1], B[1], k / n)]); } }
    // dedupe close boundary points
    const B0 = []; { const h = new Map(), cs = Lb * 0.3, key = (x, y) => Math.round(x / cs) + "," + Math.round(y / cs); for (const p of P) { const k = key(...p); if (!h.has(k)) { h.set(k, 1); B0.push(p); } } }
    const nb = B0.length, pts = B0.slice();
    { const cell = new Map(), cs = L * 0.6, key = (x, y) => Math.floor(x / cs) + "," + Math.floor(y / cs); for (const p of B0) { const k = key(...p); if (!cell.has(k)) cell.set(k, []); cell.get(k).push(p); }
      const near = (x, y) => { const cx = Math.floor(x / cs), cy = Math.floor(y / cs); for (let i = -1; i <= 1; i++) for (let j = -1; j <= 1; j++) for (const q of cell.get(cx + i + "," + (cy + j)) || []) if (Math.hypot(q[0] - x, q[1] - y) < L * 0.6) return true; return false; };
      let x0 = Infinity, x1 = -Infinity, y0 = Infinity, y1 = -Infinity; for (const [x, y] of loops[0]) { x0 = Math.min(x0, x); x1 = Math.max(x1, x); y0 = Math.min(y0, y); y1 = Math.max(y1, y); }
      for (let y = y0 + L / 2, r = 0; y < y1; y += L * 0.866, r++) for (let x = x0 + (r % 2 ? L / 2 : 0); x < x1; x += L) if (inside([x, y]) && !near(x, y)) pts.push([x, y]); }
    // Bowyer-Watson
    let minx = Infinity, miny = Infinity, maxx = -Infinity, maxy = -Infinity; for (const [x, y] of pts) { minx = Math.min(minx, x); miny = Math.min(miny, y); maxx = Math.max(maxx, x); maxy = Math.max(maxy, y); }
    const dm = Math.max(maxx - minx, maxy - miny) * 20, mx = (minx + maxx) / 2, my = (miny + maxy) / 2, n0 = pts.length;
    const V = pts.concat([[mx - dm, my - dm], [mx, my + dm], [mx + dm, my - dm]]);
    const circ = (a, b, c) => { const [ax, ay] = V[a], [bx, by] = V[b], [cx, cy] = V[c], d = 2 * (ax * (by - cy) + bx * (cy - ay) + cx * (ay - by)); const ux = ((ax * ax + ay * ay) * (by - cy) + (bx * bx + by * by) * (cy - ay) + (cx * cx + cy * cy) * (ay - by)) / d, uy = ((ax * ax + ay * ay) * (cx - bx) + (bx * bx + by * by) * (ax - cx) + (cx * cx + cy * cy) * (bx - ax)) / d; return [ux, uy, (ax - ux) ** 2 + (ay - uy) ** 2]; };
    let tris = [[n0, n0 + 1, n0 + 2, ...circ(n0, n0 + 1, n0 + 2)]];
    // insert in a spatially coherent order (rows), checking only recent triangles is not safe: check all, but prune by x
    const order = [...pts.keys()].sort((i, j) => V[i][0] - V[j][0]);
    for (const i of order) {
      const [px, py] = V[i], bad = [], keep = [];
      for (const t of tris) { const dx = px - t[3], dy = py - t[4]; if (dx * dx + dy * dy < t[5] - 1e-12) bad.push(t); else keep.push(t); }
      const em = new Map();
      for (const t of bad) for (const [a, b] of [[t[0], t[1]], [t[1], t[2]], [t[2], t[0]]]) { const k = a < b ? a + "," + b : b + "," + a; em.set(k, em.has(k) ? null : [a, b]); }
      for (const e of em.values()) if (e) keep.push([e[0], e[1], i, ...circ(e[0], e[1], i)]);
      tris = keep;
    }
    const F = [];
    for (const t of tris) { if (t[0] >= n0 || t[1] >= n0 || t[2] >= n0) continue; const c = [(V[t[0]][0] + V[t[1]][0] + V[t[2]][0]) / 3, (V[t[0]][1] + V[t[1]][1] + V[t[2]][1]) / 3]; if (inside(c)) F.push([t[0], t[1], t[2]]); }
    const pos = [], nrm = [];
    for (let i = 0; i < n0; i++) { const a = V[i][0] / ka, b = V[i][1] / kb, { p, n } = map(a, b), q = p.clone().addScaledVector(n, -inset), s = flip ? -1 : 1; pos.push(q.x, q.y, q.z); nrm.push(n.x * s, n.y * s, n.z * s); }
    const idx = []; for (const [a, b, c2] of F) idx.push(a, b, c2);
    const g = new T.BufferGeometry(); g.setAttribute("position", new T.Float32BufferAttribute(pos, 3)); g.setAttribute("normal", new T.Float32BufferAttribute(nrm, 3)); g.setIndex(idx);
    // orient every triangle to its normals
    const p = g.attributes.position, nn = g.attributes.normal, ia = g.index.array;
    for (let i = 0; i < ia.length; i += 3) { const A = V3(p.getX(ia[i]), p.getY(ia[i]), p.getZ(ia[i])), Bv = V3(p.getX(ia[i + 1]), p.getY(ia[i + 1]), p.getZ(ia[i + 1])), C = V3(p.getX(ia[i + 2]), p.getY(ia[i + 2]), p.getZ(ia[i + 2])); const fn = new T.Vector3().crossVectors(Bv.clone().sub(A), C.clone().sub(A)); if (fn.x * nn.getX(ia[i]) + fn.y * nn.getY(ia[i]) + fn.z * nn.getZ(ia[i]) < 0) { const t0 = ia[i]; ia[i] = ia[i + 1]; ia[i + 1] = t0; } }
    return g;
  }
  // a ribbon laid on a skin along points { p, n }: width w, lifted by lift
  function ribbon(pts, w, lift, mat, name, parent) {
    const pos = [], idx = [];
    for (let i = 0; i < pts.length; i++) {
      const { p, n } = pts[i], a = pts[Math.max(0, i - 1)].p, b = pts[Math.min(pts.length - 1, i + 1)].p;
      const t = b.clone().sub(a).normalize(), s = new T.Vector3().crossVectors(n, t).normalize().multiplyScalar(w / 2), q = p.clone().addScaledVector(n, lift);
      pos.push(...q.clone().add(s).toArray(), ...q.clone().sub(s).toArray());
      if (i) { const o = (i - 1) * 2; idx.push(o, o + 1, o + 2, o + 1, o + 3, o + 2); }
    }
    const g = new T.BufferGeometry(); g.setAttribute("position", new T.Float32BufferAttribute(pos, 3)); g.setIndex(idx); g.computeVertexNormals();
    const nn = g.attributes.normal; let dot = 0; for (let i = 0; i < pts.length; i++) dot += nn.getX(i * 2) * pts[i].n.x + nn.getY(i * 2) * pts[i].n.y + nn.getZ(i * 2) * pts[i].n.z;
    if (dot < 0) flipIdx(g);
    return add(g, mat, name, parent);
  }
  return { V3, add, flipIdx, sweepGeo, sweep, roundProf, tube, rod, latheX, latheZ, rrShape, ringGeo, rbox, setRB, sideExtrude, airfoil, wingPanel, gridGeo, roundQuad, paramMesh, paramMeshD, ribbon };
}

// ---------------------------------------------------------------- wheels
// A wheel as a Group named "wheel", its axis along x, its outer face towards +x (rotated half a turn for side < 0).
// o: { R (tyre radius), W (tyre width), rr (rim radius), style: "steel" | "wire" | "racing" | "plane" | "scooter",
//      whitewall, bulge (sidewall), shoulder, treadMat, rimMat, capMat, spokes }
export function buildWheel(T, mats, side, o) {
  const g = new T.Group(); g.name = "wheel";
  const K = makeKit(T, g), { latheX } = K;
  const R = o.R, W = o.W, rr = o.rr, sh = o.shoulder ?? Math.min(0.03, W * 0.18), bulge = o.bulge ?? 0.08 * W;
  // the sidewall: bead -> bulge -> shoulder; mirrored for the inner wall
  const sideProf = [];
  for (let k = 0; k <= 14; k++) { const t = k / 14, r = lerp(rr + 0.004, R - sh, t), a = W / 2 - 0.006 + bulge * Math.sin(Math.PI * t * 0.85); sideProf.push([r, a]); }
  const aS = sideProf[14][1];
  for (let k = 1; k <= 8; k++) { const a = (k / 8) * (Math.PI / 2); sideProf.push([R - sh + sh * Math.sin(a), lerp(aS, W / 2 - sh, Math.sin(a))]); }
  const outer = sideProf, inner = sideProf.map(([r, a]) => [r, -a]).reverse();
  // v3: the sidewall's lettering (a bump map, the letters' colour and gloss), the tread's pattern, wear and dust
  let wallMat = o.wallMat || mats.tyre, treadMat0 = o.treadMat || (o.style === "racing" ? mats.slick : mats.tread);
  if (o.sidewall !== false && wallMat.metalness < 0.5) {
    const C = mats.__v3 || (mats.__v3 = new Map()), key = [wallMat.uuid, o.brand, o.spec, o.letters].join("|");
    if (!C.has(key)) { const t = dTyreWall(T, { brand: o.brand || "CROMATIC", spec: o.spec || `${Math.round(W * 200) * 5} R ${Math.round((rr * 2) / 0.0254)}`, sub: o.sub || (o.style === "racing" ? "RACING  SLICK" : "RADIAL  TUBELESS"), letters: o.letters || null }); const m = wallMat.clone(); Object.assign(m, { map: t.map, bumpMap: t.bumpMap, bumpScale: o.bumpScale ?? 2.2, roughnessMap: t.roughnessMap, roughness: 1 }); m.color = new T.Color("#ffffff"); C.set(key, m); }
    wallMat = C.get(key);
    const tk = treadMat0.uuid + "|tread";
    if (!C.has(tk)) { const t = dTread(T, { slick: o.style === "racing" || !!o.slick }); const m = treadMat0.clone(); Object.assign(m, { map: t.map, roughnessMap: t.roughnessMap, roughness: 1 }); if (t.normalMap) { m.normalMap = t.normalMap; m.normalScale = new T.Vector2(1.2, 1.2); } m.color = new T.Color("#ffffff"); C.set(tk, m); }
    treadMat0 = C.get(tk);
  }
  latheX(outer.slice().reverse(), wallMat, "tyre wall", { seg: 96 }); latheX(inner.slice().reverse(), wallMat, "tyre wall", { seg: 96 });
  // the crown
  const a0 = W / 2 - sh, crown = [], gro = o.grooves ?? (o.style === "racing" ? [] : [-W * 0.23, 0, W * 0.23]);
  for (let k = 0; k <= 60; k++) { const a = lerp(a0, -a0, k / 60); let r = R - (o.style === "racing" ? 0.0015 : 0.0035) * (a / a0) ** 4; for (const g0 of gro) if (Math.abs(a - g0) < 0.004) r -= 0.007 * Math.cos(((a - g0) / 0.004) * (Math.PI / 2)); crown.push([r, a]); }
  const tm = latheX(crown, treadMat0, "tread", { seg: 96 });
  { const uv = tm.geometry.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * Math.round(R * 80), uv.getY(i)); }
  if (o.whitewall) {
    // a white band on the outer wall, laid just over it
    const ww = sideProf.filter(([r]) => r > rr + (R - rr) * 0.18 && r < rr + (R - rr) * 0.62).map(([r, a]) => [r, a + 0.0015]);
    latheX(ww.slice().reverse(), o.whitewallMat || mats.white || mats.tyre, "whitewall", { seg: 96 });
  }
  const rim = o.rimMat || mats.steel, cap = o.capMat || mats.chrome;
  if (o.style === "steel") {
    const pr = [[rr + 0.006, -W * 0.39], [rr + 0.012, -W * 0.43], [rr, -W * 0.45], [rr - 0.012, -W * 0.32], [rr - 0.016, W * 0.13], [rr - 0.006, W * 0.32], [rr + 0.012, W * 0.41], [rr + 0.004, W * 0.45], [rr - 0.012, W * 0.43], [rr - 0.03, W * 0.32], [rr * 0.73, W * 0.22], [rr * 0.64, W * 0.26], [rr * 0.55, W * 0.19], [0.0, W * 0.19]];
    latheX(pr, rim, "rim");
    const cr = o.capR ?? rr * 0.42, capP = []; for (let k = 0; k <= 22; k++) { const t = k / 22, r = cr * (1 - t), a = W * 0.23 + (o.capDome ?? 0.024) * Math.sqrt(1 - (r / cr) ** 2); capP.push([Math.max(0.0005, r), a]); }
    capP.unshift([cr + 0.004, W * 0.21]);
    latheX(capP, cap, "hub cap");
    for (let k = 0; k < (o.vents ?? 8); k++) { const ang = (k / (o.vents ?? 8)) * Math.PI * 2, gv = new T.BoxGeometry(0.004, rr * 0.16, rr * 0.07); const vm = new T.Mesh(gv, mats.under); vm.position.set(W * 0.235, Math.cos(ang) * rr * 0.63, Math.sin(ang) * rr * 0.63); vm.rotation.x = -ang; vm.name = "rim vent"; g.add(vm); }
  } else if (o.style === "wire") {
    // a chrome well-base rim, a long hub barrel, two crossing sets of spokes (laced tangentially), a two-eared spinner
    latheX([[rr + 0.01, -W * 0.42], [rr + 0.004, -W * 0.46], [rr - 0.008, -W * 0.38], [rr - 0.012, W * 0.38], [rr + 0.004, W * 0.46], [rr + 0.01, W * 0.42], [rr - 0.006, W * 0.36], [rr - 0.016, W * 0.1], [rr - 0.016, -W * 0.36], [rr - 0.006, -W * 0.36]], rim, "rim");
    const hubR = rr * 0.2, hubL = W * 0.9;
    latheX([[0.0, -hubL / 2], [hubR * 1.25, -hubL / 2], [hubR * 1.25, -hubL / 2 + 0.012], [hubR, -hubL / 2 + 0.02], [hubR * 0.8, 0], [hubR, hubL / 2 - 0.02], [hubR * 1.3, hubL / 2 - 0.012], [hubR * 1.3, hubL / 2], [hubR * 0.9, hubL / 2 + 0.02], [0, hubL / 2 + 0.02]], cap, "hub");
    const n = o.spokes ?? 40, sp = new T.CylinderGeometry(0.0022, 0.0022, 1, 5); sp.translate(0, 0.5, 0);
    const im = new T.InstancedMesh(sp, o.spokeMat || mats.chrome, n); im.name = "spokes"; const M = new T.Matrix4(), Q = new T.Quaternion(), Sv = new T.Vector3(), up = new T.Vector3(0, 1, 0);
    for (let k = 0; k < n; k++) {
      const ang = (k / n) * Math.PI * 2, set = k % 2 ? 1 : -1, inner = k % 4 < 2 ? 1 : -1;
      const ha = ang + set * 0.32, A = new T.Vector3(inner * hubL * 0.42, Math.cos(ha) * hubR * 1.1, Math.sin(ha) * hubR * 1.1), B = new T.Vector3(inner * W * 0.08, Math.cos(ang) * (rr - 0.014), Math.sin(ang) * (rr - 0.014));
      const d = B.clone().sub(A); Q.setFromUnitVectors(up, d.clone().normalize()); Sv.set(1, d.length(), 1); M.compose(A, Q, Sv); im.setMatrixAt(k, M);
    }
    im.castShadow = im.receiveShadow = true; g.add(im);
    // the spinner: a hex nut with two ears
    { const nut = new T.CylinderGeometry(hubR * 0.9, hubR * 1.05, 0.03, 6); nut.rotateZ(Math.PI / 2); nut.translate(hubL / 2 + 0.035, 0, 0); K.add(nut, cap, "spinner"); for (const s of [-1, 1]) { const e = new T.BoxGeometry(0.012, hubR * 1.6, 0.016); e.translate(hubL / 2 + 0.04, s * hubR * 1.15, 0); K.add(e, cap, "spinner"); } }
  } else if (o.style === "racing") {
    // a cast magnesium wheel: a deep barrel, a star of spokes on the outer face, the centre-lock nut
    latheX([[rr + 0.012, -W * 0.46], [rr + 0.004, -W * 0.5], [rr - 0.008, -W * 0.44], [rr - 0.01, W * 0.44], [rr + 0.004, W * 0.5], [rr + 0.012, W * 0.46], [rr - 0.004, W * 0.42], [rr - 0.012, -W * 0.4]], rim, "rim");
    const face = W * 0.3, n = o.spokes ?? 12;
    latheX([[rr - 0.006, face - 0.01], [rr * 0.9, face], [rr * 0.84, face + 0.004], [rr * 0.84, face - 0.02], [rr - 0.01, face - 0.02]], rim, "rim lip");
    for (let k = 0; k < n; k++) { const ang = (k / n) * Math.PI * 2, b = new T.BoxGeometry(0.022, rr * 0.62, 0.028); b.translate(0, rr * 0.5, 0); const m = K.add(b, rim, "rim spoke"); m.rotation.x = -ang; m.position.x = face - 0.006; m.rotation.order = "XYZ"; }
    latheX([[rr * 0.24, face - 0.03], [rr * 0.26, face + 0.008], [rr * 0.18, face + 0.02], [0, face + 0.02]], rim, "rim centre");
    const nut = new T.CylinderGeometry(rr * 0.12, rr * 0.14, 0.05, 6); nut.rotateZ(Math.PI / 2); nut.translate(face + 0.035, 0, 0); K.add(nut, cap, "wheel nut");
  } else if (o.style === "plane") {
    latheX([[rr + 0.008, -W * 0.4], [rr - 0.004, -W * 0.36], [rr * 0.5, -W * 0.3], [rr * 0.3, -W * 0.45], [0, -W * 0.45], [0, W * 0.45], [rr * 0.3, W * 0.45], [rr * 0.5, W * 0.3], [rr - 0.004, W * 0.36], [rr + 0.008, W * 0.4]].reverse(), rim, "rim");
    latheX([[rr * 0.18, W * 0.42], [rr * 0.14, W * 0.5], [0, W * 0.5]], cap, "hub cap");
  } else if (o.style === "scooter") {
    // a five-spoke alloy, the hub (motor or disc) carried by the caller
    latheX([[rr + 0.004, -W * 0.42], [rr - 0.004, -W * 0.36], [rr - 0.004, W * 0.36], [rr + 0.004, W * 0.42], [rr - 0.01, W * 0.3], [rr - 0.01, -W * 0.3]], rim, "rim");
    for (let k = 0; k < 5; k++) { const ang = (k / 5) * Math.PI * 2, b = new T.BoxGeometry(W * 0.4, rr * 0.7, 0.012); b.translate(0, rr * 0.5, 0); const m = K.add(b, rim, "rim spoke"); m.rotation.x = -ang; }
    if (o.capMat) latheX([[rr * 0.25, W * 0.25], [rr * 0.2, W * 0.32], [0, W * 0.33]], cap, "hub cap");
  }
  if (o.brake) dBrake(T, g, { mats, ...o.brake });
  g.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  if (side < 0) g.rotation.y = Math.PI;
  return g;
}

// count the triangles of a group
export function triCount(g) { let n = 0; g.traverse((m) => { if (m.isMesh) { const c = (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3; n += m.isInstancedMesh ? c * m.count : c; } }); return Math.round(n); }

// <<detail ================================================================ v3 detail (TASK-111 v3, Radu)
// Realism for the macro shots: tyre sidewall lettering and tread maps, scuffing, brakes, road dust on the lower body,
// embossed number plates, stitched seats, gauges, steering wheels, interior mirrors, outline offsets for window seals.
// Self-contained (THREE passed in, no imports): _source/sync-detail.mjs copies this block verbatim into the hero Dacia
// 1300 (design/hero-car/src/dacia1300-hero.js, and its diorama-render vendor copy), which loads alone.
const dClamp = (v, a, b) => Math.max(a, Math.min(b, v)), dMix = (a, b, t) => a + (b - a) * t;
function dCv(w, h, draw) { const c = document.createElement("canvas"); c.width = w; c.height = h; const x = c.getContext("2d"); draw(x, w, h); return c; }
function dTex(T, c, srgb, rep = true) { const t = new T.CanvasTexture(c); t.colorSpace = srgb ? T.SRGBColorSpace : T.NoColorSpace; if (rep) t.wrapS = t.wrapT = T.RepeatWrapping; t.anisotropy = 8; t.needsUpdate = true; return t; }
// a tileable value noise on a period P (integer lattice), and a 3D one for vertices
function dHash(x, y, z, s) { let n = (Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 1274126177) + Math.imul(s, 1442695041)) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967295; }
export function dNoise2(seed = 1, P = 1 << 20) {
  const f = (t) => t * t * (3 - 2 * t), m = (a) => ((a % P) + P) % P;
  return (x, y) => { const X = Math.floor(x), Y = Math.floor(y), u = f(x - X), v = f(y - Y); const h = (a, b) => dHash(m(a), m(b), 0, seed); return dMix(dMix(h(X, Y), h(X + 1, Y), u), dMix(h(X, Y + 1), h(X + 1, Y + 1), u), v); };
}
export function dNoise3(seed = 1) {
  const f = (t) => t * t * (3 - 2 * t);
  return (x, y, z) => { const X = Math.floor(x), Y = Math.floor(y), Z = Math.floor(z), u = f(x - X), v = f(y - Y), w = f(z - Z), h = (a, b, c) => dHash(a, b, c, seed);
    return dMix(dMix(dMix(h(X, Y, Z), h(X + 1, Y, Z), u), dMix(h(X, Y + 1, Z), h(X + 1, Y + 1, Z), u), v), dMix(dMix(h(X, Y, Z + 1), h(X + 1, Y, Z + 1), u), dMix(h(X, Y + 1, Z + 1), h(X + 1, Y + 1, Z + 1), u), v), w); };
}
// a grey height canvas -> a normal map (k: strength)
export function dNormalFromCanvas(T, c, k = 2) {
  const w = c.width, h = c.height, src = c.getContext("2d").getImageData(0, 0, w, h).data, out = dCv(w, h, () => {}), ctx = out.getContext("2d"), im = ctx.createImageData(w, h);
  const H = (x, y) => src[(((y + h) % h) * w + ((x + w) % w)) * 4] / 255;
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const dx = (H(x + 1, y) - H(x - 1, y)) * k, dy = (H(x, y + 1) - H(x, y - 1)) * k, l = Math.hypot(dx, dy, 1), o = (y * w + x) * 4; im.data[o] = (-dx / l * 0.5 + 0.5) * 255; im.data[o + 1] = (dy / l * 0.5 + 0.5) * 255; im.data[o + 2] = (1 / l * 0.5 + 0.5) * 255; im.data[o + 3] = 255; }
  ctx.putImageData(im, 0, 0); return dTex(T, out, false);
}
// ---- tyres. The wall lathe's uv: u round the tyre, v from the shoulder (0) to the bead (1); the sidewall proper is
// v 0.36-1 (the kit's profile: 8 shoulder points then 15 down the wall). The crown: u round (repeated), v across.
const D_TYRE = new Map();
export function dTyreWall(T, { brand = "CROMATIC", spec = "155 SR 13", sub = "RADIAL  TUBELESS", letters = null, base = "#161616", key = "" } = {}) {
  const id = [brand, spec, sub, letters, base, key].join("|"); if (D_TYRE.has(id)) return D_TYRE.get(id);
  const W = 4096, Hh = 256, n2 = dNoise2(11, 64), yMid = Hh * 0.66;
  // the text run, twice round: brand, spec, sub, a DOT code (small)
  const run = (ctx, fill, stroke) => {
    for (let k = 0; k < 2; k++) {
      const x0 = k * W / 2; ctx.textBaseline = "middle"; ctx.textAlign = "left";
      ctx.font = "900 46px 'Arial Black', 'Helvetica Neue', Arial, sans-serif"; if (stroke) { ctx.lineWidth = stroke; ctx.strokeText(brand, x0 + 120, yMid); } ctx.fillText(brand, x0 + 120, yMid);
      ctx.font = "700 30px 'Helvetica Neue', Arial, sans-serif"; ctx.fillText(spec, x0 + 820, yMid);
      ctx.font = "700 20px 'Helvetica Neue', Arial, sans-serif"; ctx.fillText(sub, x0 + 1180, yMid - 2);
      ctx.font = "600 14px 'Helvetica Neue', Arial, sans-serif"; ctx.fillText("DOT  CR4X  1979", x0 + 1600, yMid + 30); ctx.fillText("MADE IN ROMANIA", x0 + 1600, yMid - 26);
      // the wear indicator triangles on the shoulder
      for (const xi of [x0 + 380, x0 + 1380]) { ctx.beginPath(); ctx.moveTo(xi, Hh * 0.3); ctx.lineTo(xi + 10, Hh * 0.38); ctx.lineTo(xi - 10, Hh * 0.38); ctx.closePath(); ctx.fill(); }
    }
  };
  // height: the base wall, a rim-protector rib near the bead, fine concentric lines by the shoulder, raised letters
  const hC = dCv(W, Hh, (ctx) => { ctx.fillStyle = "#6e6e6e"; ctx.fillRect(0, 0, W, Hh); ctx.fillStyle = "#9a9a9a"; ctx.fillRect(0, Hh * 0.885, W, 5); ctx.fillStyle = "#808080"; for (let i = 0; i < 5; i++) ctx.fillRect(0, Hh * (0.385 + i * 0.022), W, 1.5); ctx.fillStyle = "#d8d8d8"; ctx.strokeStyle = "#a0a0a0"; run(ctx, true, 3); });
  const hB = dCv(W, Hh, (ctx) => { ctx.filter = "blur(0.8px)"; ctx.drawImage(hC, 0, 0); });
  // colour: the rubber, the letters a touch lighter (or painted), scuffs and kerb rash on the shoulder, dust low
  const cC = dCv(W, Hh, (ctx) => {
    ctx.fillStyle = base; ctx.fillRect(0, 0, W, Hh);
    const im = ctx.getImageData(0, 0, W, Hh), d = im.data;
    for (let y = 0; y < Hh; y++) for (let x = 0; x < W; x++) { const o = (y * W + x) * 4, nn = n2(x / 64, y / 32), dust = (0.25 + 0.75 * (1 - y / Hh)) * Math.max(0, nn - 0.45) * 26; d[o] += dust * 1.1; d[o + 1] += dust; d[o + 2] += dust * 0.8; }
    ctx.putImageData(im, 0, 0);
    ctx.fillStyle = letters || "#2c2c2c"; run(ctx, true, 0);
    ctx.strokeStyle = "rgba(120,116,110,0.35)"; ctx.lineWidth = 1.2; for (let i = 0; i < 26; i++) { const x = (i * 1571) % W, y = Hh * (0.05 + ((i * 37) % 30) / 100); ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 60 + (i % 5) * 30, y + ((i % 3) - 1) * 4); ctx.stroke(); }
  });
  const rC = dCv(W, Hh, (ctx) => { ctx.fillStyle = "#d4d4d4"; ctx.fillRect(0, 0, W, Hh); ctx.fillStyle = "#a6a6a6"; run(ctx, true, 0); });
  // (the lathe's u runs the other way round and its v from the shoulder: turned half a turn, the letters stand on the
  // bead and read left to right from outside)
  const turn = (t) => { t.flipY = false; t.repeat.set(-1, 1); t.offset.set(1, 0); return t; };
  const out = { map: turn(dTex(T, cC, true)), bumpMap: turn(dTex(T, hB, false)), roughnessMap: turn(dTex(T, rC, false)) };
  D_TYRE.set(id, out); return out;
}
export function dTread(T, { slick = false } = {}) {
  const id = "tread|" + slick; if (D_TYRE.has(id)) return D_TYRE.get(id);
  const S = 256, n2 = dNoise2(5, 16), frac = (v) => v - Math.floor(v);
  const Hf = (u, v) => {
    if (slick) return 0.6;
    const sh = v < 0.2 || v > 0.8;
    if (sh) return Math.abs(frac(u * 3 + (v > 0.5 ? 0.17 : 0)) - 0.5) < 0.07 ? 0.05 : 1; // the shoulder blocks
    let h = 1; const lat = frac(u * 3 + (v - 0.5) * 0.9); if (lat < 0.07) h = 0.1; // angled lateral slots
    if (Math.abs(frac(u * 9 + Math.abs(v - 0.5) * 2) - 0.5) < 0.025) h = Math.min(h, 0.55); // fine sipes
    for (const g of [0.35, 0.65]) { const zz = g + 0.02 * Math.sin(u * Math.PI * 2 * 6); if (Math.abs(v - zz) < 0.018) h = 0.1; } // zig-zag circumferential grooves
    return h;
  };
  const hC = dCv(S, S, (ctx) => { const im = ctx.createImageData(S, S); for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const o = (y * S + x) * 4, h = Hf(x / S, y / S) * 255; im.data[o] = im.data[o + 1] = im.data[o + 2] = h; im.data[o + 3] = 255; } ctx.putImageData(im, 0, 0); });
  const hB = dCv(S, S, (ctx) => { ctx.filter = "blur(0.7px)"; ctx.drawImage(hC, 0, 0); });
  const cC = dCv(S, S, (ctx) => { const im = ctx.createImageData(S, S); for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const o = (y * S + x) * 4, h = Hf(x / S, y / S), nn = n2((x / S) * 16, (y / S) * 16), dust = Math.max(0, nn - 0.4) * (h < 0.5 ? 46 : 22), g = (h < 0.5 ? 13 : 30) + (slick ? (Math.sin(y * 0.9 + nn * 9) > 0.7 ? 8 : 0) : 0); im.data[o] = g + dust * 1.15; im.data[o + 1] = g + dust; im.data[o + 2] = g + dust * 0.8; im.data[o + 3] = 255; } ctx.putImageData(im, 0, 0); });
  const rC = dCv(S, S, (ctx) => { const im = ctx.createImageData(S, S); for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const o = (y * S + x) * 4, v = y / S, nn = n2((x / S) * 16 + 3, (y / S) * 16), r = slick ? 0.62 + 0.25 * nn : 0.95 - 0.18 * (1 - Math.abs(v - 0.5) * 2) * nn; im.data[o] = im.data[o + 1] = im.data[o + 2] = dClamp(r, 0, 1) * 255; im.data[o + 3] = 255; } ctx.putImageData(im, 0, 0); });
  const out = { map: dTex(T, cC, true), normalMap: slick ? null : dNormalFromCanvas(T, hB, 4), roughnessMap: dTex(T, rC, false) };
  D_TYRE.set(id, out); return out;
}
// ---- brakes behind a wheel (inside its group: they turn with it, as discs and drums do). x: the axial centre (the wheel's
// outer face is +x), r: the outer radius
export function dBrake(T, g, { type = "drum", r = 0.12, w = 0.05, x = -0.02, mats = {} } = {}) {
  const lathe = (prof, mat, name) => { const geo = new T.LatheGeometry(prof.map(([rr, a]) => new T.Vector2(Math.max(0, rr), a)), 48); geo.rotateZ(-Math.PI / 2); const m = new T.Mesh(geo, mat); m.name = name; m.castShadow = m.receiveShadow = true; g.add(m); return m; };
  const iron = mats.drum || (mats.drum = new T.MeshPhysicalMaterial({ name: "brake drum", color: new T.Color("#4a4440"), roughness: 0.72, metalness: 0.6, side: T.DoubleSide }));
  const disc = mats.disc || (mats.disc = new T.MeshPhysicalMaterial({ name: "brake disc", color: new T.Color("#9a9893"), roughness: 0.38, metalness: 0.85, side: T.DoubleSide }));
  const plate = mats.brakePlate || (mats.brakePlate = new T.MeshPhysicalMaterial({ name: "brake backing plate", color: new T.Color("#1b1a19"), roughness: 0.6, metalness: 0.4, side: T.DoubleSide }));
  if (type === "disc") {
    const a0 = x - w / 2, a1 = x + w / 2;
    lathe([[r * 0.52, a0], [r, a0], [r, a0 + w * 0.35], [r * 0.97, a0 + w * 0.5], [r, a1 - w * 0.35], [r, a1], [r * 0.52, a1]], disc, "brake disc");
    lathe([[r * 0.52, a1], [r * 0.5, a1 + 0.012], [r * 0.42, a1 + 0.03], [0.0, a1 + 0.03]], iron, "brake disc hat");
    lathe([[r * 1.06, a0 - 0.008], [r * 1.06, a0 - 0.014], [0.02, a0 - 0.014]], plate, "brake dust shield");
  } else {
    // a finned drum: the shoe face out, cooling fins round the barrel, the backing plate inboard
    const a0 = x - w / 2, a1 = x + w / 2, prof = [[r * 0.35, a1], [r * 0.92, a1], [r, a1 - 0.006]];
    for (let k = 0; k < 6; k++) { const a = dMix(a1 - 0.01, a0 + 0.008, k / 5); prof.push([r, a + 0.002], [r + 0.007, a], [r, a - 0.002]); }
    prof.push([r, a0], [r * 0.9, a0]);
    lathe(prof, iron, "brake drum");
    lathe([[r * 1.04, a0 - 0.002], [r * 1.04, a0 - 0.012], [0.02, a0 - 0.012]], plate, "brake backing plate");
  }
}
// ---- road dust on the lower body (the paint's own material, patched): a per-vertex mask baked in the vehicle's space
// (heavy at the sills, a spray behind each wheel, lighter high up, a breakup noise), a finer noise in the shader. The
// dust lightens the colour towards a road tan, dulls the clearcoat, roughens. o: { mats: [...], top, amount, color,
// wheels: [{ z, r }], seed }
export function dDust(T, root, o = {}) {
  const set = new Set(o.mats || []), top = o.top ?? 0.5, amt = o.amount ?? 0.6, col = o.color || "#9c8b74", wh = o.wheels || [], nz = dNoise3(o.seed ?? 3);
  root.updateMatrixWorld(true);
  const inv = root.matrixWorld.clone().invert(), M = new T.Matrix4(), v = new T.Vector3();
  root.traverse((m) => {
    if (!m.isMesh || !set.has(m.material) || m.isInstancedMesh) return;
    let p = m; while (p && p !== root) { if (p.name === "wheel") return; p = p.parent; }
    const g = m.geometry, P = g.attributes.position, d = new Float32Array(P.count), dp = new Float32Array(P.count * 3);
    M.multiplyMatrices(inv, m.matrixWorld);
    for (let i = 0; i < P.count; i++) {
      v.fromBufferAttribute(P, i).applyMatrix4(M); dp[i * 3] = v.x; dp[i * 3 + 1] = v.y; dp[i * 3 + 2] = v.z;
      let k = Math.pow(dClamp((top - v.y) / top, 0, 1), 1.4);
      for (const w of wh) { const dz = w.z - v.z; if (dz > -w.r * 0.2 && dz < w.r * 2.2 && v.y < w.r * 2.4) k += 0.45 * Math.exp(-((dz - w.r * 0.9) ** 2) / (w.r * w.r * 0.9)) * dClamp((w.r * 2.4 - v.y) / (w.r * 1.6), 0, 1); }
      k += 0.06; // a film everywhere
      k *= 0.45 + 1.1 * nz(v.x * 4, v.y * 7, v.z * 4);
      d[i] = dClamp(k, 0, 1);
    }
    g.setAttribute("aDust", new T.BufferAttribute(d, 1)); g.setAttribute("aDP", new T.BufferAttribute(dp, 3));
  });
  for (const mat of set) dDustPatch(T, mat, col, amt);
}
export function dDustPatch(T, mat, col, amt) {
  if (mat.userData.dustV3) return; mat.userData.dustV3 = true;
  const prev = mat.onBeforeCompile;
  mat.onBeforeCompile = (sh, r) => {
    if (prev) prev.call(mat, sh, r);
    sh.uniforms.uDustCol = { value: new T.Color(col) }; sh.uniforms.uDustAmt = { value: amt };
    sh.vertexShader = sh.vertexShader.replace("#include <common>", "#include <common>\nattribute float aDust;\nattribute vec3 aDP;\nvarying float vDust;\nvarying vec3 vDP;").replace("#include <begin_vertex>", "#include <begin_vertex>\nvDust = aDust; vDP = aDP;");
    sh.fragmentShader = sh.fragmentShader.replace("#include <common>", `#include <common>
uniform vec3 uDustCol; uniform float uDustAmt; varying float vDust; varying vec3 vDP;
float dH3(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float dN3(vec3 x) { vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(dH3(i), dH3(i + vec3(1, 0, 0)), f.x), mix(dH3(i + vec3(0, 1, 0)), dH3(i + vec3(1, 1, 0)), f.x), f.y), mix(mix(dH3(i + vec3(0, 0, 1)), dH3(i + vec3(1, 0, 1)), f.x), mix(dH3(i + vec3(0, 1, 1)), dH3(i + vec3(1, 1, 1)), f.x), f.y), f.z); }`)
      .replace("#include <color_fragment>", "#include <color_fragment>\nfloat dd = vDust * uDustAmt; float dn = dN3(vDP * 31.0) * 0.5 + dN3(vDP * 140.0) * 0.32 + dN3(vDP * 420.0) * 0.18; dd = clamp(dd * (0.3 + 1.45 * dn) - 0.05, 0.0, 0.85); diffuseColor.rgb = mix(diffuseColor.rgb, uDustCol, dd);")
      .replace("#include <roughnessmap_fragment>", "#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.82, dd);")
      .replace("#include <lights_physical_fragment>", "#include <lights_physical_fragment>\n#ifdef USE_CLEARCOAT\nmaterial.clearcoat *= 1.0 - 0.85 * dd; material.clearcoatRoughness = mix(material.clearcoatRoughness, 0.45, dd);\n#endif");
  };
  const k0 = mat.customProgramCacheKey ? mat.customProgramCacheKey.bind(mat) : () => "";
  mat.customProgramCacheKey = () => k0() + "|dust-v3"; mat.needsUpdate = true;
}
// ---- number plates (fictional numbers): the Romanian EU plate (the blue band, the stars, RO) or a plain one; raised
// letters and rim (a bump map), a little road grime. Returns a plane mesh named "number plate" (w x h metres)
export function dPlate(T, text, w = 0.52, h = 0.112, { kind = "eu", back = false } = {}) {
  const W = 1040, H = Math.round(W * h / w), n2 = dNoise2(9, 32), band = kind === "eu" ? Math.round(H * 0.42) : 0;
  const glyphs = (ctx) => { ctx.textAlign = "center"; ctx.textBaseline = "alphabetic"; let fs = H * 1.02; ctx.font = `700 ${fs}px 'DIN Condensed', 'DIN Alternate', 'Arial Narrow', Arial, sans-serif`; const room = W - band - 70; let tw = ctx.measureText(text).width; if (tw > room) { fs *= room / tw; ctx.font = `700 ${fs}px 'DIN Condensed', 'DIN Alternate', 'Arial Narrow', Arial, sans-serif`; } ctx.fillText(text, band + (W - band) / 2, H * 0.84); };
  const cC = dCv(W, H, (ctx) => {
    ctx.fillStyle = "#f3f2ec"; ctx.fillRect(0, 0, W, H);
    if (band) { ctx.fillStyle = "#1a3f98"; ctx.fillRect(0, 0, band, H); ctx.fillStyle = "#f3d21c"; for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2, cx = band / 2 + Math.cos(a) * band * 0.24, cy = H * 0.34 + Math.sin(a) * band * 0.24; ctx.beginPath(); for (let k = 0; k < 10; k++) { const rr = k % 2 ? band * 0.022 : band * 0.055, b = -Math.PI / 2 + (k / 10) * Math.PI * 2; ctx.lineTo(cx + Math.cos(b) * rr, cy + Math.sin(b) * rr); } ctx.fill(); } ctx.fillStyle = "#f3f2ec"; ctx.font = `700 ${H * 0.32}px 'Helvetica Neue', Arial, sans-serif`; ctx.textAlign = "center"; ctx.fillText("RO", band / 2, H * 0.9); }
    ctx.strokeStyle = "#141414"; ctx.lineWidth = 7; ctx.strokeRect(5, 5, W - 10, H - 10);
    ctx.fillStyle = "#141414"; glyphs(ctx);
    const im = ctx.getImageData(0, 0, W, H), d = im.data;
    for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) { const o = (y * W + x) * 4, e = Math.min(x, W - x, y, H - y) / 40, g = Math.max(0, n2(x / 40, y / 20) - 0.35) * 0.5 + Math.max(0, 1 - e) * 0.18 + (y / H) * 0.06; for (let c = 0; c < 3; c++) d[o + c] = d[o + c] * (1 - g * 0.55) + [92, 80, 64][c] * g * 0.55; }
    ctx.putImageData(im, 0, 0);
  });
  const hC = dCv(W, H, (ctx) => { ctx.fillStyle = "#606060"; ctx.fillRect(0, 0, W, H); ctx.strokeStyle = "#d0d0d0"; ctx.lineWidth = 12; ctx.strokeRect(9, 9, W - 18, H - 18); ctx.fillStyle = "#e0e0e0"; glyphs(ctx); ctx.filter = "blur(1.5px)"; ctx.drawImage(ctx.canvas, 0, 0); });
  const mat = new T.MeshPhysicalMaterial({ name: "number plate", map: dTex(T, cC, true, false), bumpMap: dTex(T, hC, false, false), bumpScale: 1.5, roughness: 0.42, metalness: 0, clearcoat: 0.35, clearcoatRoughness: 0.3 });
  const g = new T.PlaneGeometry(w, h); if (back) g.rotateY(Math.PI);
  const m = new T.Mesh(g, mat); m.name = "number plate"; m.castShadow = m.receiveShadow = true; return m;
}
// ---- seats: pleated vinyl with stitching (a grey map multiplying the material's colour, a normal map), on rounded
// boxes (their faces' uv run 0-1: the pleats run along v on the cushion's top and the back's front)
const D_STITCH = new Map();
export function dStitch(T, n = 6) {
  if (D_STITCH.has(n)) return D_STITCH.get(n);
  const S = 512, frac = (v) => v - Math.floor(v);
  const hC = dCv(S, S, (ctx) => { const im = ctx.createImageData(S, S); for (let y = 0; y < S; y++) for (let x = 0; x < S; x++) { const u = x / S, v = y / S, o = (y * S + x) * 4; const q = frac(u * n), ch = Math.min(q, 1 - q); let h = Math.min(1, ch / 0.09) ** 0.6; const edge = Math.min(u, 1 - u, v, 1 - v); if (edge < 0.035) h = Math.min(h, 0.55 + edge * 8); h *= 0.85 + 0.15 * Math.sin(v * 140 + u * 9) * 0.2; im.data[o] = im.data[o + 1] = im.data[o + 2] = dClamp(h, 0, 1) * 255; im.data[o + 3] = 255; } ctx.putImageData(im, 0, 0); });
  const cC = dCv(S, S, (ctx) => {
    ctx.drawImage(hC, 0, 0); ctx.globalCompositeOperation = "source-over";
    const im = ctx.getImageData(0, 0, S, S), d = im.data; for (let i = 0; i < d.length; i += 4) { const h = d[i] / 255; const g = 160 + 95 * h; d[i] = d[i + 1] = d[i + 2] = g; } ctx.putImageData(im, 0, 0);
    // the stitches: short dashes either side of each channel, and round the piping
    ctx.strokeStyle = "rgba(255,255,255,0.9)"; ctx.lineWidth = 2; ctx.setLineDash([7, 5]);
    for (let k = 1; k < n; k++) for (const off of [-0.022, 0.022]) { const x = (k / n + off) * S; ctx.beginPath(); ctx.moveTo(x, 10); ctx.lineTo(x, S - 10); ctx.stroke(); }
    ctx.strokeRect(0.05 * S, 0.05 * S, 0.9 * S, 0.9 * S);
  });
  const out = { map: dTex(T, cC, true), normalMap: dNormalFromCanvas(T, hC, 3) };
  D_STITCH.set(n, out); return out;
}
// a seat: cushion and back (pleated centres, plain bolsters), a headrest; facing +z. add(geo, mat, name) adds a mesh
export function dSeat(T, parent, RB, mat, { x = 0, y = 0.47, z = 0, w = 0.5, d = 0.5, h = 0.13, backH = 0.56, backT = 0.11, rake = 0.2, head = true, bolster = true, plain = null } = {}) {
  const add = (g, m, name) => { const me = new T.Mesh(g, m); me.name = name; me.castShadow = me.receiveShadow = true; parent.add(me); return me; };
  const box = (bw, bh, bd, r, m, name, at, rot) => { const g = RB ? new RB(bw, bh, bd, 3, Math.min(r, bw / 2 - 1e-4, bh / 2 - 1e-4, bd / 2 - 1e-4)) : new T.BoxGeometry(bw, bh, bd); const me = add(g, m, name); me.position.set(...at); if (rot) me.rotation.set(...rot); return me; };
  const pm = plain || mat, bw = bolster ? w * 0.16 : 0;
  box(w - 2 * bw, h, d * 0.94, 0.035, mat, "seat cushion", [x, y, z + d * 0.02]);
  if (bolster) for (const s of [-1, 1]) box(bw, h * 1.25, d, 0.035, pm, "seat bolster", [x + s * (w - bw) / 2, y + h * 0.1, z]);
  const by = y + h / 2 + backH / 2 - 0.02, bz = z - d / 2 + backT / 2 - Math.sin(rake) * backH * 0.3;
  const bk = new T.Group(); bk.position.set(x, by, bz); bk.rotation.x = -rake; parent.add(bk);
  const addB = (g, m, name) => { const me = new T.Mesh(g, m); me.name = name; me.castShadow = me.receiveShadow = true; bk.add(me); return me; }, boxB = (bw2, bh, bd, r, m, name, at) => { const g = RB ? new RB(bw2, bh, bd, 3, Math.min(r, bw2 / 2 - 1e-4, bh / 2 - 1e-4, bd / 2 - 1e-4)) : new T.BoxGeometry(bw2, bh, bd); const me = addB(g, m, name); me.position.set(...at); return me; };
  boxB(w - 2 * bw, backH, backT, 0.035, mat, "seat back", [0, 0, 0]);
  if (bolster) for (const s of [-1, 1]) boxB(bw, backH, backT * 1.3, 0.035, pm, "seat bolster", [s * (w - bw) / 2, 0, backT * 0.1]);
  if (head) { boxB(w * 0.52, 0.13, 0.08, 0.035, mat, "headrest", [0, backH / 2 + 0.09, -0.01]); for (const s of [-1, 1]) { const g = new T.CylinderGeometry(0.006, 0.006, 0.07, 8); g.translate(s * w * 0.15, backH / 2 + 0.01, -0.01); addB(g, plain || mat, "headrest post"); } }
  return bk;
}
// ---- gauges: a canvas dial (kind "speed" 0-160 km/h, "rev", "fuel"), black face, white marks, an orange needle
export function dGauge(T, kind = "speed", { face = "#101012", ink = "#f2efe6", needle = "#ff6a1a", label = "" } = {}) {
  const S = 512, c = dCv(S, S, (ctx) => {
    ctx.fillStyle = face; ctx.fillRect(0, 0, S, S); const cx = S / 2, cy = S / 2;
    const [a0, a1, n, maj, lab] = kind === "fuel" ? [Math.PI * 0.8, Math.PI * 1.2, 4, 2, ["E", "", "½", "", "F"]] : kind === "rev" ? [Math.PI * 0.75, Math.PI * 2.25, 35, 5, ["0", "1", "2", "3", "4", "5", "6", "7"]] : [Math.PI * 0.75, Math.PI * 2.25, 32, 4, ["0", "20", "40", "60", "80", "100", "120", "140", "160"]];
    ctx.strokeStyle = ink; ctx.fillStyle = ink; ctx.lineCap = "butt";
    for (let i = 0; i <= n; i++) { const a = dMix(a0, a1, i / n), big = i % maj === 0, r0 = big ? 0.36 : 0.4; ctx.lineWidth = big ? 9 : 4; ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * S * r0, cy + Math.sin(a) * S * r0); ctx.lineTo(cx + Math.cos(a) * S * 0.46, cy + Math.sin(a) * S * 0.46); ctx.stroke();
      if (big && lab[i / maj]) { ctx.font = `700 ${S * 0.085}px 'Helvetica Neue', Arial, sans-serif`; ctx.textAlign = "center"; ctx.textBaseline = "middle"; ctx.fillText(lab[i / maj], cx + Math.cos(a) * S * 0.28, cy + Math.sin(a) * S * 0.28); } }
    if (kind === "rev") { ctx.strokeStyle = "#d63a26"; ctx.lineWidth = 12; ctx.beginPath(); ctx.arc(cx, cy, S * 0.43, dMix(a0, a1, 6 / 7), a1); ctx.stroke(); }
    ctx.font = `600 ${S * 0.05}px 'Helvetica Neue', Arial, sans-serif`; ctx.textAlign = "center"; ctx.fillStyle = ink; ctx.fillText(label || (kind === "speed" ? "km/h" : kind === "rev" ? "x1000 rpm" : ""), cx, cy + S * 0.2);
    if (kind === "speed") { ctx.fillStyle = "#e8e4d8"; ctx.fillRect(cx - S * 0.11, cy + S * 0.27, S * 0.22, S * 0.07); ctx.fillStyle = "#111"; ctx.font = `700 ${S * 0.055}px 'Courier New', monospace`; ctx.fillText("041382", cx, cy + S * 0.325); }
    const na = dMix(a0, a1, kind === "fuel" ? 0.62 : 0.06); ctx.strokeStyle = needle; ctx.lineWidth = 8; ctx.beginPath(); ctx.moveTo(cx - Math.cos(na) * S * 0.06, cy - Math.sin(na) * S * 0.06); ctx.lineTo(cx + Math.cos(na) * S * 0.42, cy + Math.sin(na) * S * 0.42); ctx.stroke();
    ctx.fillStyle = "#2a2a2c"; ctx.beginPath(); ctx.arc(cx, cy, S * 0.05, 0, Math.PI * 2); ctx.fill();
    ctx.strokeStyle = "#3a3a3c"; ctx.lineWidth = 10; ctx.beginPath(); ctx.arc(cx, cy, S * 0.49, 0, Math.PI * 2); ctx.stroke();
  });
  return new T.MeshPhysicalMaterial({ name: "gauge", map: dTex(T, c, true, false), roughness: 0.35, metalness: 0, clearcoat: 1, clearcoatRoughness: 0.02 });
}
// a round gauge facing dir (-z by default): the dial, a chrome or black bezel; returns the group
export function dGaugeMesh(T, parent, mat, bezel, { r = 0.045, at = [0, 0, 0], face = -1 } = {}) {
  const G = new T.Group(); G.position.set(...at); if (face < 0) G.rotation.y = Math.PI; parent.add(G);
  const c = new T.Mesh(new T.CircleGeometry(r, 40), mat); c.name = "gauge"; G.add(c);
  const b = new T.Mesh(new T.TorusGeometry(r + 0.003, 0.004, 8, 40), bezel); b.name = "gauge bezel"; b.position.z = 0.002; G.add(b);
  const cup = new T.Mesh(new T.CylinderGeometry(r + 0.006, r + 0.006, 0.02, 32, 1, true), bezel); cup.name = "gauge cup"; cup.rotation.x = Math.PI / 2; cup.position.z = -0.008; G.add(cup);
  return G;
}
// ---- a steering wheel in the x-y plane facing +z (the driver behind it at -z): rim, spokes (2, 3 or 4), hub, horn
export function dSteering(T, parent, { r = 0.19, tube = 0.013, spokes = 2, rimMat, spokeMat, hubMat, at = [0, 0, 0], tilt = 0.45 } = {}) {
  const G = new T.Group(); G.name = "steering wheel"; G.position.set(...at); G.rotation.x = -tilt; parent.add(G);
  const m = (geo, mat, name) => { const me = new T.Mesh(geo, mat); me.name = name; me.castShadow = me.receiveShadow = true; G.add(me); return me; };
  m(new T.TorusGeometry(r, tube, 12, 72), rimMat, "steering rim");
  // finger grips on the rim's back
  const ang = spokes === 2 ? [-0.18, Math.PI + 0.18] : spokes === 3 ? [-Math.PI / 2, -0.12, Math.PI + 0.12] : [Math.PI / 4, 3 * Math.PI / 4, 5 * Math.PI / 4, 7 * Math.PI / 4];
  for (const a of ang) { const L = r - 0.03, g = new T.BoxGeometry(L, 0.018, 0.008); g.translate(0.03 + L / 2, 0, -0.012); const s = m(g, spokeMat, "steering spoke"); s.rotation.z = a; }
  { const g = new T.CylinderGeometry(0.045, 0.05, 0.04, 28); g.rotateX(Math.PI / 2); g.translate(0, 0, -0.016); m(g, hubMat || spokeMat, "steering hub"); }
  { const g = new T.CircleGeometry(0.034, 28); g.translate(0, 0, 0.0045); m(g, spokeMat, "horn button"); }
  return G;
}
// ---- an interior mirror hanging from the windscreen's header (facing -z, back at the driver)
export function dInnerMirror(T, parent, { at = [0, 1.3, 0.1], w = 0.2, h = 0.06, housing, glass, stem = 0.06, RB } = {}) {
  const G = new T.Group(); G.name = "interior mirror"; G.position.set(...at); parent.add(G);
  const m = (geo, mat, name) => { const me = new T.Mesh(geo, mat); me.name = name; me.castShadow = true; G.add(me); return me; };
  { const g = new T.CylinderGeometry(0.006, 0.008, stem, 10); g.translate(0, stem / 2, 0.01); m(g, housing, "mirror stem"); }
  m(RB ? new RB(w, h, 0.028, 3, 0.012) : new T.BoxGeometry(w, h, 0.028), housing, "mirror housing");
  { const g = new T.PlaneGeometry(w - 0.014, h - 0.014); g.rotateY(Math.PI); g.translate(0, 0, -0.0145); m(g, glass, "mirror glass"); }
  G.rotation.y = 0.08; return G;
}
// ---- offset a closed outline [[a, b]] inward by d (sa, sb: the metres per unit of a and b), for the rubber seals
export function dOffset(pts, d, sa = 1, sb = 1) {
  const n = pts.length; let area = 0; for (let i = 0; i < n; i++) { const [a0, b0] = pts[i], [a1, b1] = pts[(i + 1) % n]; area += (a0 * sa) * (b1 * sb) - (a1 * sa) * (b0 * sb); }
  const s = area > 0 ? 1 : -1;
  return pts.map((p, i) => { const A = pts[(i - 1 + n) % n], B = pts[(i + 1) % n], ta = (B[0] - A[0]) * sa, tb = (B[1] - A[1]) * sb, l = Math.hypot(ta, tb) || 1; return [p[0] + (-tb / l) * s * d / sa, p[1] + (ta / l) * s * d / sb]; });
}
// ---- the Dacia 1300 / 1310 cabin (the hero 1300's and the Patrol's shared interior, seen through the glass in the
// macro shots): stitched seats with bolsters and headrests, the rear bench, the dash with its instrument binnacle
// (round dials on the 1300, a squared hood with three on the 1310), the radio, vents and glovebox, the two-spoke wheel
// on its column, stalks, the gear lever in its boot, the handbrake, an interior mirror, sun visors, armrests.
export function dDaciaCabin(T, parent, RB, mats, { style = "1300", seatColor = null } = {}) {
  const st = dStitch(T, 6);
  const seat = mats.vinyl.clone(); seat.name = "seat vinyl"; seat.map = st.map; seat.normalMap = st.normalMap; seat.normalScale = new T.Vector2(0.9, 0.9); if (seatColor) seat.color = new T.Color(seatColor);
  const plain = mats.vinyl;
  const add = (g, m, name) => { const me = new T.Mesh(g, m); me.name = name; me.castShadow = me.receiveShadow = true; parent.add(me); return me; };
  const box = (w, h, d, r, m, name, at, rot) => { const g = RB ? new RB(w, h, d, 3, Math.min(r, w / 2 - 1e-4, h / 2 - 1e-4, d / 2 - 1e-4)) : new T.BoxGeometry(w, h, d); const me = add(g, m, name); me.position.set(...at); if (rot) me.rotation.set(...rot); return me; };
  for (const s of [-1, 1]) dSeat(T, parent, RB, seat, { x: s * 0.34, y: 0.47, z: -0.18, w: 0.5, d: 0.52, h: 0.13, backH: 0.56, backT: 0.11, rake: 0.2, head: true, plain });
  dSeat(T, parent, RB, seat, { x: 0, y: 0.45, z: -0.98, w: 1.3, d: 0.5, h: 0.14, backH: 0.48, backT: 0.12, rake: 0.3, head: false, bolster: true, plain });
  // the dash: the main moulding, a padded top roll, the binnacle over the dials, the dials, the radio, vents, glovebox
  const dash = mats.dash;
  box(1.42, 0.16, 0.3, 0.04, dash, "dashboard", [0, 0.8, 0.46]);
  box(1.44, 0.05, 0.12, 0.024, dash, "dash top roll", [0, 0.885, 0.37]);
  const bezel = style === "1310" ? mats.black : mats.chrome;
  box(style === "1310" ? 0.36 : 0.3, 0.026, 0.1, 0.012, style === "1310" ? mats.black : dash, "binnacle hood", [0.34, 0.902, 0.29]);
  if (style === "1310") {
    const sp = dGauge(T, "speed"), rv = dGauge(T, "rev"), fu = dGauge(T, "fuel");
    dGaugeMesh(T, parent, rv, bezel, { r: 0.04, at: [0.445, 0.84, 0.305] }); dGaugeMesh(T, parent, sp, bezel, { r: 0.046, at: [0.34, 0.84, 0.305] }); dGaugeMesh(T, parent, fu, bezel, { r: 0.03, at: [0.24, 0.84, 0.305] });
  } else {
    const sp = dGauge(T, "speed"), fu = dGauge(T, "fuel", { label: "°C   FUEL" });
    dGaugeMesh(T, parent, sp, bezel, { r: 0.05, at: [0.395, 0.84, 0.305] }); dGaugeMesh(T, parent, fu, bezel, { r: 0.05, at: [0.285, 0.84, 0.305] });
  }
  box(0.2, 0.055, 0.03, 0.006, mats.black, "radio", [0, 0.76, 0.312]);
  for (const x of [-0.07, 0.07]) { const g = new T.CylinderGeometry(0.009, 0.009, 0.012, 16); g.rotateX(Math.PI / 2); g.translate(x, 0.76, 0.293); add(g, mats.satin, "radio knob"); }
  { const g = new T.PlaneGeometry(0.09, 0.018); g.rotateY(Math.PI); g.translate(0, 0.768, 0.2965); add(g, mats.satin, "radio dial"); }
  for (const x of [-0.6, 0.6, -0.1, 0.1]) { box(0.085, 0.04, 0.02, 0.006, mats.black, "vent", [x, 0.84, 0.312]); for (let k = 0; k < 3; k++) box(0.08, 0.004, 0.008, 0.001, mats.satin, "vent slat", [x, 0.828 + k * 0.012, 0.302]); }
  { const g = new T.PlaneGeometry(0.34, 0.1); g.rotateY(Math.PI); g.translate(-0.34, 0.79, 0.3095); add(g, mats.gap, "glovebox gap"); box(0.33, 0.092, 0.006, 0.006, dash, "glovebox lid", [-0.34, 0.79, 0.307]); box(0.04, 0.012, 0.01, 0.003, mats.satin, "glovebox catch", [-0.34, 0.825, 0.302]); }
  // the wheel, its column and shroud, the stalks
  dSteering(T, parent, { at: [0.34, 0.86, 0.2], tilt: 0.45, r: 0.19, tube: 0.012, spokes: 2, rimMat: mats.black, spokeMat: style === "1310" ? mats.black : mats.satin, hubMat: mats.black });
  { const a = new T.Vector3(0.34, 0.835, 0.235), b = new T.Vector3(0.34, 0.74, 0.42), d = b.clone().sub(a); const g = new T.CylinderGeometry(0.03, 0.036, d.length(), 16); const m = add(g, mats.black, "column shroud"); m.position.copy(a).addScaledVector(d, 0.5); m.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), d.normalize()); }
  for (const s of [-1, 1]) { const g = new T.CylinderGeometry(0.005, 0.005, 0.12, 8); g.rotateZ(Math.PI / 2); g.translate(0.34 + s * 0.08, 0.8, 0.29); add(g, mats.black, "stalk"); }
  // the gear lever in its rubber boot, the handbrake
  { const g = new T.ConeGeometry(0.05, 0.08, 16); g.translate(0, 0.33, 0.12); add(g, mats.rubber, "gear boot"); const r = new T.CylinderGeometry(0.006, 0.008, 0.22, 10); r.translate(0, 0.44, 0.12); r.rotateX(0); add(r, mats.satin, "gear lever"); const k = new T.SphereGeometry(0.022, 16, 12); k.translate(0, 0.56, 0.12); add(k, mats.black, "gear knob"); }
  { const g = new T.CylinderGeometry(0.01, 0.012, 0.2, 10); g.rotateX(1.25); g.translate(0, 0.36, -0.05); add(g, mats.black, "handbrake"); }
  box(0.14, 0.26, 0.4, 0.02, mats.carpet, "tunnel", [0, 0.29, 0.0]);
  // the interior mirror on the header, the sun visors, the armrests on the door cards
  dInnerMirror(T, parent, { at: [0, 1.31, 0.06], w: 0.2, h: 0.058, housing: mats.black, glass: mats.mirror, stem: 0.055, RB });
  for (const s of [-1, 1]) box(0.36, 0.012, 0.14, 0.005, mats.liner, "sun visor", [s * 0.34, 1.385, -0.02], [0.18, 0, 0]);
  for (const s of [-1, 1]) for (const z of [0.0, -0.78]) box(0.045, 0.04, 0.28, 0.015, plain, "armrest", [s * 0.755, 0.64, z]);
}
// ---- a chrome script badge (the model's numerals on the tail): an alpha-cut canvas, raised (a bump map), facing +z
export function dScript(T, text, h = 0.035, { font = "italic 700 ", color = "#e9eaec" } = {}) {
  const H = 128, c0 = dCv(8, 8, () => {}), m0 = c0.getContext("2d"); m0.font = `${font}${H * 0.8}px 'Helvetica Neue', Arial, sans-serif`; const W = Math.ceil(m0.measureText(text).width + 24);
  const draw = (fill) => dCv(W, H, (x) => { x.font = `${font}${H * 0.8}px 'Helvetica Neue', Arial, sans-serif`; x.textBaseline = "middle"; x.fillStyle = fill; x.fillText(text, 12, H / 2 + 4); });
  const a = draw("#ffffff"), b = dCv(W, H, (x) => { x.filter = "blur(2px)"; x.drawImage(a, 0, 0); });
  const mat = new T.MeshPhysicalMaterial({ name: "badge chrome", color: new T.Color(color), metalness: 1, roughness: 0.12, alphaMap: dTex(T, a, false, false), alphaTest: 0.5, bumpMap: dTex(T, b, false, false), bumpScale: 3, side: T.DoubleSide });
  const m = new T.Mesh(new T.PlaneGeometry(h * W / H, h), mat); m.name = "model script"; return m;
}
// detail>>
