// the car alone in a neutral room (RoomEnvironment through PMREM, a key light, a ground that catches its shadow)
export async function studio(T, R, make, o = {}, RoomEnvironment) {
  const { w = 1200, h = 800, views = [[35, 12, 7]] } = o;
  R.setSize(w, h, false);
  const scene = new T.Scene(); scene.background = new T.Color("#3c4047"); scene.environmentIntensity = o.envI ?? 0.55;
  const pm = new T.PMREMGenerator(R); scene.environment = pm.fromScene(new RoomEnvironment(), 0.04).texture;
  const sun = new T.DirectionalLight("#fff4e6", 2.2); sun.position.set(4, 8, 5); sun.castShadow = true; sun.shadow.mapSize.set(4096, 4096); Object.assign(sun.shadow.camera, { left: -4, right: 4, top: 4, bottom: -4, near: 0.5, far: 30 }); sun.shadow.bias = -0.0002; sun.shadow.radius = 4; scene.add(sun);
  const gnd = new T.Mesh(new T.PlaneGeometry(40, 40), new T.MeshStandardMaterial({ color: "#5d6066", roughness: 0.9 })); gnd.rotation.x = -Math.PI / 2; gnd.receiveShadow = true; scene.add(gnd);
  const { group } = make(); scene.add(group);
  const cam = new T.PerspectiveCamera(o.fov || 28, w / h, 0.05, 100);
  const out = [];
  for (const [az, el, d, ty = 0.6, tz = -0.2] of views) {
    const a = (az * Math.PI) / 180, e = (el * Math.PI) / 180;
    cam.position.set(Math.sin(a) * Math.cos(e) * d, ty + Math.sin(e) * d, tz + Math.cos(a) * Math.cos(e) * d); cam.lookAt(0, ty, tz); cam.updateMatrixWorld();
    R.render(scene, cam); out.push(R.domElement.toDataURL("image/png"));
  }
  let tris = 0; group.traverse((m) => { if (m.isMesh) tris += (m.geometry.index ? m.geometry.index.count : m.geometry.attributes.position.count) / 3; });
  return { out, tris };
}

// TASK-112 r3: the car as a die-cast model on a dark plinth, photographed like the reference (a white sweep, a big
// softbox overhead, a key from the front left), path traced; or rasterised for framing (o.pt false)
export async function plinth(T, R, make, o = {}, PT) {
  const { w = 1400, h = 868, fov = 22, az = 52, el = 13, dist = 15.5, ty = 0.55, tz = 0.05, tx = 0, samples = 256 } = o;
  R.setSize(w, h, false); R.setPixelRatio(1);
  // the studio: an equirect of radiance (white sweep, softbox overhead, a key, a darker floor)
  const EW = 512, EH = 256, data = new Float32Array(EW * EH * 4);
  const key = new T.Vector3(-0.5, 0.75, 0.9).normalize(), fill = new T.Vector3(1, 0.35, 0.4).normalize();
  for (let r = 0; r < EH; r++) for (let i = 0; i < EW; i++) {
    const u = (i + 0.5) / EW, v = (r + 0.5) / EH, ph = (u - 0.5) * 2 * Math.PI, th = (v - 0.5) * Math.PI;
    const d = new T.Vector3(Math.cos(th) * Math.cos(ph), Math.sin(th), Math.cos(th) * Math.sin(ph));
    let L = d.y > 0 ? 0.42 + 0.2 * d.y : 0.3 + 0.1 * (1 + d.y);
    if (d.y > 0.82) L += 2.6; // the softbox overhead
    if (d.dot(key) > 0.93) L += 3.2; // the key
    if (d.dot(fill) > 0.95) L += 2.5;
    const o4 = (r * EW + i) * 4; data[o4] = L; data[o4 + 1] = L * 0.99; data[o4 + 2] = L * 0.97; data[o4 + 3] = 1;
  }
  const env = new T.DataTexture(data, EW, EH, T.RGBAFormat, T.FloatType); env.mapping = T.EquirectangularReflectionMapping; env.needsUpdate = true;
  const scene = new T.Scene(); scene.environment = env; scene.background = o.bg ? new T.Color(o.bg) : null; // (transparent: flattened on white, like the product photo)
  const base = new T.Mesh(new T.BoxGeometry(2.3, 0.16, 5.3), new T.MeshPhysicalMaterial({ color: "#121314", roughness: 0.32, metalness: 0, clearcoat: 0 }));
  base.position.set(0, -0.08, -0.2); scene.add(base);
  const floor = new T.Mesh(new T.PlaneGeometry(80, 80), new T.MeshStandardMaterial({ color: "#f2f2f0", roughness: 0.9 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -0.16; scene.add(floor);
  const { group } = make(o.model);
  if (PT) { const done = new Map(); group.traverse((m) => { if (!m.isMesh || !m.material.clearcoat) return; if (!done.has(m.material)) { const c = m.material.clone(); c.roughness = m.material.roughness + (m.material.clearcoatRoughness - m.material.roughness) * Math.min(1, m.material.clearcoat) * 0.85; c.clearcoat = 0; done.set(m.material, c); } m.material = done.get(m.material); }); }
  scene.add(group);
  const a = (az * Math.PI) / 180, e = (el * Math.PI) / 180;
  const cam = new T.PerspectiveCamera(fov, w / h, 0.1, 200);
  cam.position.set(tx + Math.sin(a) * Math.cos(e) * dist, ty + Math.sin(e) * dist, tz + Math.cos(a) * Math.cos(e) * dist); cam.lookAt(tx, ty, tz); cam.updateMatrixWorld();
  if (!PT) {
    const pm = new T.PMREMGenerator(R); scene.environment = pm.fromEquirectangular(env).texture; scene.environmentIntensity = 0.55;
    R.toneMapping = T.ACESFilmicToneMapping; R.toneMappingExposure = 1; R.render(scene, cam); return { url: R.domElement.toDataURL("image/png") };
  }
  R.toneMapping = T.ACESFilmicToneMapping; R.toneMappingExposure = o.exposure || 0.75;
  const pt = new PT(R); pt.renderDelay = 0; pt.minSamples = 1; pt.fadeDuration = 0; pt.bounces = 8; pt.transmissiveBounces = 10; pt.tiles.set(2, 2);
  pt.setScene(scene, cam);
  while (pt.samples < samples) { pt.renderSample(); await new Promise((r) => requestAnimationFrame(r)); }
  return { url: R.domElement.toDataURL("image/png"), samples: pt.samples };
}
