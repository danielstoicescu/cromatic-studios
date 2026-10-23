// Cromatic · diorama renders (TASK-118) · story A in diorama (the preview of A6's first four shots): what the shots
// share. Radu's hero Dacia (TASK-112 r4, hero-car 679e011, vendored) with its lamps off when parked and lit when it
// drives; the two looks (golden late afternoon, blue hour); A6's spans (buildA-v6.mjs, 60 fps frames).
import { buildHeroDacia } from "../../vendor/dacia1300-hero.js";
export const SPANS = { over: [0, 152], steam: [152, 268], oma: [268, 402], scf: [402, 516], drive: [516, 858], end: [830, 960] }; // (A6's, 60 fps)
export const secs = (k) => (SPANS[k][1] - SPANS[k][0]) / 60;
export const GOLDEN = {
  look: { sky: { top: "#5f7ee0", mid: "#d8afd6", hor: "#ffc9a0" }, fog: { color: "#e7cdd6", near: 1600, far: 9000 }, bounce: "#c79a80", bounceK: 0.3, domeK: 0.4, domeSunGlow: 0.8, tone: 0.06, minRough: 0.7, bump: 0.03 },
  sun: { az: 78, el: 19, color: "#ffcfa0", intensity: 3.7, radius: 1.5 },
  post: { tonemap: "neutral", exposure: 1.05, bloomK: 0.05, bloomThr: 1.0, vig: 0.24, grain: 0.022, lut: "cromatic-diorama", sat: 1.08, power: 1.12 }
};
// the story's light runs from late afternoon to the evening (A7): golden over the street and at Steam, the sun going
// down at OMA (its room already lit) and over the dome, the blue hour for the drive away (its lamps on)
export const SUNSET = {
  look: { sky: { top: "#5468c8", mid: "#d898b8", hor: "#ffad7a" }, fog: { color: "#e6b8b8", near: 1400, far: 8000 }, bounce: "#c48a72", bounceK: 0.28, domeK: 0.5, domeSunGlow: 1.0, tone: 0.06, minRough: 0.7, bump: 0.03 },
  sun: { az: 78, el: 9, color: "#ffab6a", intensity: 3.2, radius: 1.8 },
  post: { tonemap: "neutral", exposure: 1.15, bloomK: 0.07, bloomThr: 0.95, vig: 0.26, grain: 0.022, lut: "cromatic-diorama", sat: 1.08, power: 1.1 }
};
export const DUSK = {
  look: { sky: { top: "#24347a", mid: "#5a5aa0", hor: "#f08a64" }, fog: { color: "#3b3f73", near: 1200, far: 6000 }, bounce: "#5a4a68", bounceK: 0.22, domeK: 0.95, domeSunGlow: 1.2, tone: 0.06, minRough: 0.68, bump: 0.03 },
  sun: { az: 200, el: 6, color: "#ff9a6a", intensity: 0.55, radius: 4 },
  post: { tonemap: "neutral", exposure: 1.7, bloomK: 0.09, bloomThr: 0.9, vig: 0.3, grain: 0.026, lut: "cromatic-night", sat: 1.06, power: 1.08 }
};
// the map's own ride out of the frame for the whole shot (the hero car stands in for it)
export function hideMapRide(S) {
  const v = S.veh(), cop = S.cop && S.cop();
  const keep = [v && [v.group, v.group.visible], cop && [cop.group, cop.group.visible]].filter(Boolean);
  for (const [g] of keep) g.visible = false;
  return () => { for (const [g, vis] of keep) g.visible = vis; };
}
// the hero car, built with three's own modules, drawn by the map's renderer; 1 m = 15 map units.
// Its glass made plain (no transmission pass per sub-frame); its lamps: off = clear lenses over dull reflectors and an
// unlit bulb (parked: Daniel, "they shouldn't look switched on"); on = the lenses and bulbs glowing warm white
export async function heroCar(ctx, { lights = false, scale = 15 } = {}) {
  const { S, K } = ctx;
  const T = await import("/__three/build/three.module.js"), { RoundedBoxGeometry } = await import("/__three/examples/jsm/geometries/RoundedBoxGeometry.js");
  const car = buildHeroDacia(T, { RoundedBoxGeometry });
  const env = S.mats.omaGlow.envMap, lamps = [];
  car.group.traverse((m) => {
    if (!m.isMesh) return;
    const mt = m.material, nm = mt.name || "";
    if (nm === "headlamp lens") { m.material = new T.MeshPhysicalMaterial({ name: nm, color: "#f4f2ea", roughness: 0.05, metalness: 0, transparent: true, opacity: 0.14, envMap: env, envMapIntensity: 0.25, side: T.DoubleSide, depthWrite: false, emissive: new T.Color("#fff1d0"), emissiveIntensity: 0 }); lamps.push(m.material); m.castShadow = false; m.userData.dioNoCast = true; }
    else if (nm === "bulb") { m.material = new T.MeshPhysicalMaterial({ name: nm, color: "#cfcac0", roughness: 0.35, metalness: 0, emissive: new T.Color("#fff1d0"), emissiveIntensity: 0 }); lamps.push(m.material); }
    else if (mt.transmission > 0) { m.material = new T.MeshPhysicalMaterial({ name: nm, color: mt.color, roughness: 0.02, metalness: 0, transparent: true, opacity: 0.28, envMap: env, envMapIntensity: 0.3, side: T.DoubleSide, depthWrite: false }); m.castShadow = false; m.userData.dioNoCast = true; }
    else { mt.envMap = env; mt.envMapIntensity = mt.metalness > 0.5 ? (/reflector|headlamp/.test(m.name) ? 0.18 : 0.5) : 0.4; }
    m.material.userData.dioKeep = true;
  });
  const g = new K.Group(); g.add(car.group); car.group.scale.setScalar(scale); S.scene.add(g);
  // the tail lamps (red: lit with the lamps; the indicators' amber stays dark)
  const tails = []; car.group.traverse((m) => { if (m.isMesh && m.material.name === "tail red") { if (!tails.includes(m.material)) { m.material.emissive = new T.Color("#ff2a18"); tails.push(m.material); } } });
  // the headlamps' beams: two warm spots ahead (three's own SpotLight, drawn by the map's renderer), placed in the bent
  // world by place(); no shadows (they would cost a cube per sub-frame and the road is open)
  const beams = [-1, 1].map(() => { const L = new T.SpotLight("#fff0d2", 0, 420, 0.42, 0.55, 1.6); L.castShadow = false; S.scene.add(L); S.scene.add(L.target); return L; });
  const wheels = car.group.children.filter((c) => c.name === "wheel");
  let lit = false;
  const setLights = (on) => { lit = on; for (const l of lamps) { l.emissiveIntensity = on ? (l.name === "bulb" ? 6 : 1.6) : 0; if (l.name === "headlamp lens") l.opacity = on ? 0.55 : 0.14; } for (const t of tails) t.emissiveIntensity = on ? 5 : 0; for (const b of beams) b.intensity = on ? beamI : 0; };
  let beamI = 9000;
  setLights(lights);
  const V = K.Vector3, loc = (x, y, z) => { const v = new V(x * scale, y * scale, z * scale); v.applyAxisAngle(new V(0, 1, 0), g.rotation.y); return v.add(g.position); };
  return {
    group: g, setLights, wheels, setBeam(i) { beamI = i; setLights(lit); },
    // x, y, z logical; roll: the distance the car has rolled (map units), to turn the wheels (radius 0.292 m)
    // pitch: radians, + = the nose down (D10: the brake's dip as it parks)
    place(x, y, z, yaw, roll = null, pitch = 0) {
      // (P1: the city's bend scales the ground plan where the car stands, never its height: drawn 1/s wider and deeper)
      { const V = K.Vector3, p0 = S.warpV(new V(x, 0, z)), a = S.warpV(new V(x + 1, 0, z)).sub(p0), b = S.warpV(new V(x, 0, z + 1)).sub(p0), k = 1 / Math.sqrt(Math.abs(a.x * b.z - a.z * b.x)); g.scale.set(k, 1, k); }
      g.position.set(x, y, z); g.rotation.set(0, yaw, 0); if (pitch) g.rotateX(pitch); if (roll != null) for (const w of wheels) w.rotation.x = roll / scale / 0.292; g.updateMatrixWorld(true);
      [-0.55, 0.55].forEach((sx, k) => { const b = beams[k]; b.position.copy(S.warpV(loc(sx, 0.62, 2.0))); b.target.position.copy(S.warpV(loc(sx * 1.6, 0, 14))); b.updateMatrixWorld(true); b.target.updateMatrixWorld(true); });
    },
    dispose() { g.parent && g.parent?.remove(g); for (const b of beams) { b.parent && b.parent?.remove(b); b.target.parent && b.target.parent?.remove(b.target); } }
  };
}
