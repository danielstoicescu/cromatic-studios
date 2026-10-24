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
  const wallMat = o.wallMat || mats.tyre;
  latheX(outer.slice().reverse(), wallMat, "tyre wall", { seg: 96 }); latheX(inner.slice().reverse(), wallMat, "tyre wall", { seg: 96 });
  // the crown
  const a0 = W / 2 - sh, crown = [], gro = o.grooves ?? (o.style === "racing" ? [] : [-W * 0.23, 0, W * 0.23]);
  for (let k = 0; k <= 60; k++) { const a = lerp(a0, -a0, k / 60); let r = R - (o.style === "racing" ? 0.0015 : 0.0035) * (a / a0) ** 4; for (const g0 of gro) if (Math.abs(a - g0) < 0.004) r -= 0.007 * Math.cos(((a - g0) / 0.004) * (Math.PI / 2)); crown.push([r, a]); }
  const tm = latheX(crown, o.treadMat || (o.style === "racing" ? mats.slick : mats.tread), "tread", { seg: 96 });
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
  g.traverse((m) => { if (m.isMesh) { m.castShadow = true; m.receiveShadow = true; } });
  if (side < 0) g.rotation.y = Math.PI;
  return g;
}

// count the triangles of a group
export function triCount(g) { let n = 0; g.traverse((m) => { if (m.isMesh) { const c = (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3; n += m.isInstancedMesh ? c * m.count : c; } }); return Math.round(n); }
