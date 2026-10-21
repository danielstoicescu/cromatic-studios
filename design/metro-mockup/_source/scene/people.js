// Cromatic · metro mockups (TASK-062): passengers. Simple jointed figures (capsules and frusta under coats), posed by a
// walk phase; they are only ever seen through motion blur and a shallow focus, as people are in a long exposure.
// Feet at y = 0; facing +x when yaw = 0.
import * as THREE from "three";
import { rng } from "./lib.js";

const std = (o) => new THREE.MeshStandardMaterial({ roughness: 0.85, ...o });
const PALETTE = {
  coats: [0x23262c, 0x2d3440, 0x3b3a33, 0x4b4f55, 0x6b5440, 0x1f2a3c, 0x5a2f2f, 0x8a7a64, 0x2a3a30],
  pants: [0x1d2433, 0x2c3e5c, 0x222222, 0x3a3a3c, 0x4a4036],
  skin: [0xc9a089, 0xb98a6e, 0xd9b39c, 0x8d6450],
  hair: [0x1d1714, 0x3b2a1f, 0x5a4535, 0x8c8279, 0x15120f]
};
function limb(len, r0, r1, mat) {
  const g = new THREE.Group();
  const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, len, 12), mat); m.position.y = -len / 2; m.castShadow = true; g.add(m);
  const j = new THREE.Mesh(new THREE.SphereGeometry(r0, 12, 8), mat); j.castShadow = true; g.add(j);
  return g;
}
// a person: { h (height m), seed, coat (long|short|jacket), bag, hood }
export function person(o = {}) {
  const r = rng(o.seed || 1), pick = (a) => a[Math.floor(r() * a.length)];
  const H = o.h || 1.68 + r() * 0.16, k = H / 1.75;
  const coat = std({ color: o.coatColor ?? pick(PALETTE.coats), roughness: 0.9 });
  const pants = std({ color: pick(PALETTE.pants) });
  const skin = std({ color: pick(PALETTE.skin), roughness: 0.6 });
  const hair = std({ color: pick(PALETTE.hair) });
  const shoe = std({ color: 0x141414, roughness: 0.5 });
  const P = new THREE.Group(); P.userData.k = k;
  const hip = 0.92 * k, sh = 1.44 * k;
  const pelvis = new THREE.Group(); pelvis.position.y = hip; P.add(pelvis);
  const legs = [], arms = [];
  for (const s of [-1, 1]) {
    const thigh = limb(0.45 * k, 0.075 * k, 0.06 * k, pants); thigh.position.set(0, 0, s * 0.095 * k); pelvis.add(thigh);
    const shin = limb(0.43 * k, 0.058 * k, 0.045 * k, pants); shin.position.y = -0.45 * k; thigh.add(shin);
    const foot = new THREE.Mesh(new THREE.BoxGeometry(0.26 * k, 0.08 * k, 0.1 * k), shoe); foot.position.set(0.06 * k, -0.43 * k - 0.02 * k, 0); foot.castShadow = true; shin.add(foot);
    legs.push({ thigh, shin, s });
  }
  // torso under a coat: a frustum from the shoulders to the hem (long coats reach the knee)
  const len = o.coat === "long" ? 0.95 : o.coat === "jacket" ? 0.62 : 0.78;
  const torso = new THREE.Mesh(new THREE.CylinderGeometry(0.2 * k, 0.215 * k, len * k, 16), coat);
  torso.scale.z = 1.3; torso.scale.x = 0.62; torso.position.y = sh - (len * k) / 2 + 0.02 * k; torso.castShadow = true; P.add(torso);
  const shoulders = new THREE.Mesh(new THREE.SphereGeometry(0.205 * k, 16, 10), coat); shoulders.scale.set(0.62, 0.42, 1.3); shoulders.position.y = sh; shoulders.castShadow = true; P.add(shoulders);
  const neck = new THREE.Mesh(new THREE.CylinderGeometry(0.05 * k, 0.055 * k, 0.12 * k, 10), skin); neck.position.y = sh + 0.07 * k; P.add(neck);
  const head = new THREE.Mesh(new THREE.SphereGeometry(0.105 * k, 18, 14), skin); head.scale.set(1.0, 1.18, 0.92); head.position.y = sh + 0.22 * k; head.castShadow = true; P.add(head);
  const hcap = new THREE.Mesh(new THREE.SphereGeometry(0.112 * k, 18, 12, 0, Math.PI * 2, 0, Math.PI * 0.55), o.hood ? coat : hair); hcap.scale.set(1.04, 1.18, 0.96); hcap.position.y = sh + 0.235 * k; hcap.rotation.z = 0.25; P.add(hcap);
  for (const s of [-1, 1]) {
    const up = limb(0.31 * k, 0.055 * k, 0.048 * k, coat); up.position.set(0, sh - 0.03 * k, s * 0.235 * k); P.add(up);
    const fo = limb(0.28 * k, 0.046 * k, 0.04 * k, coat); fo.position.y = -0.31 * k; up.add(fo);
    const hand = new THREE.Mesh(new THREE.SphereGeometry(0.045 * k, 10, 8), skin); hand.scale.set(0.8, 1.3, 0.6); hand.position.y = -0.3 * k; fo.add(hand);
    arms.push({ up, fo, s });
  }
  if (o.bag) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.32 * k, 0.42 * k, 0.16 * k), std({ color: 0x16181b })); b.position.set(-0.2 * k, sh - 0.25 * k, 0); b.castShadow = true; P.add(b); }
  if (o.tote) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.34 * k, 0.32 * k, 0.1 * k), std({ color: 0x8c7a5c })); b.position.set(0, -0.62 * k, 0.04); b.castShadow = true; arms[1].fo.add(b); }
  // pose: phase in turns (a walk cycle is one turn); stand = 0..1 (1: standing still)
  P.userData.pose = (phase, stand = 0, sit = 0) => {
    const a = phase * Math.PI * 2, w = 1 - stand;
    if (sit) { // seated: thighs forward, shins down, the body lowered onto a 0.47 m seat
      for (const L of legs) { L.thigh.rotation.z = 1.5; L.shin.rotation.z = -1.45; }
      for (const A of arms) { A.up.rotation.z = 0.35; A.fo.rotation.z = 0.9; A.up.rotation.x = A.s * 0.1; }
      P.position.y = 0.47 - hip; return;
    }
    for (const L of legs) {
      const ph = a + (L.s > 0 ? 0 : Math.PI);
      L.thigh.rotation.z = w * 0.42 * Math.sin(ph);
      L.shin.rotation.z = -w * (0.15 + 0.5 * Math.max(0, Math.sin(ph - 1.2)));
    }
    for (const A of arms) {
      const ph = a + (A.s > 0 ? Math.PI : 0);
      A.up.rotation.z = w * 0.3 * Math.sin(ph) + (o.tote && A.s > 0 ? 0 : 0);
      A.fo.rotation.z = 0.12 + w * 0.2 * Math.max(0, Math.sin(ph));
      A.up.rotation.x = A.s * 0.08;
    }
    P.position.y = w * 0.02 * k * Math.abs(Math.cos(a));
  };
  P.userData.pose(0, o.stand ? 1 : 0);
  return P;
}
// a few looks, fixed: the shots' passers-by
export const CROWD = [
  { seed: 3, coat: "long", h: 1.8, bag: false, coatColor: 0x23262c },
  { seed: 8, coat: "short", h: 1.66, tote: true, coatColor: 0x8a7a64 },
  { seed: 12, coat: "jacket", h: 1.76, bag: true, coatColor: 0x2d3440 },
  { seed: 21, coat: "long", h: 1.7, hood: true, coatColor: 0x3b3a33 },
  { seed: 27, coat: "short", h: 1.62, coatColor: 0x5a2f2f },
  { seed: 33, coat: "jacket", h: 1.84, coatColor: 0x1f2a3c, bag: true }
];
