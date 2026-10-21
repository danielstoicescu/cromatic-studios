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
