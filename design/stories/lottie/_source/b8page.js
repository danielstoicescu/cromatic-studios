// Cromatic · stories in Lottie · B8 (TASK-065j, Daniel on B7): page-side helpers for the B8 renders, injected into the
// harness page (renders only, the site's bundle untouched). window.__b8 = { warm(on, k), house(on, k), pitch(rad) }
//  - warm: a golden-hour key for the whole frame (the sun and the sky light warmer, the sun a touch lower in strength),
//    restored after each shot
//  - house: Olari 9's two arched windows with no curtains (the curtains' canvas cleared), their rooms lamp-lit warm
//    (the night lamps on, a warm lamp colour) and the light let out softly: the halo, the shaft and the pool drawn in
//    warm by day too (Daniel: "much more warm, diffuse light coming out of the house")
//  - pitch: the parked ride's nose down (rad, + = nose down), in its own frame (YXZ: yaw, then the pitch)
(() => {
  const S = window.__story, Col = S.sun.color.constructor;
  let saved = null;
  function warm(on, k = 1) {
    if (!on) { if (saved) { S.sun.color.copy(saved.sc); S.sun.intensity = saved.si; S.hemi.color.copy(saved.hc); S.hemi.groundColor.copy(saved.hg); S.hemi.intensity = saved.hi; saved = null; } return; }
    if (!saved) saved = { sc: S.sun.color.clone(), si: S.sun.intensity, hc: S.hemi.color.clone(), hg: S.hemi.groundColor.clone(), hi: S.hemi.intensity };
    S.sun.color.copy(saved.sc).lerp(new Col("#ffa055"), 0.42 * k); S.sun.intensity = saved.si * (1 + 0.08 * k);
    S.hemi.color.copy(saved.hc).lerp(new Col("#ffd4a8"), 0.3 * k); S.hemi.groundColor.copy(saved.hg).lerp(new Col("#a8643a"), 0.25 * k); S.hemi.intensity = saved.hi * (1 - 0.06 * k);
  }
  let rooms = null, curtGone = false;
  function house(on, k = 1) {
    const HW = S.mats.houseWin; if (!HW) return "no houseWin";
    if (!rooms) { rooms = []; S.scene.traverse((m) => { const mt = m.material; if (mt && !Array.isArray(mt) && mt.userData && mt.userData.room && !rooms.includes(mt)) rooms.push(mt); }); }
    if (!curtGone && rooms[0]) { const tx = rooms[0].userData.room.uCurt.value, cv = tx.image; cv.getContext("2d").clearRect(0, 0, cv.width, cv.height); tx.needsUpdate = true; curtGone = true; }
    const fx = HW.group;
    if (!on) { fx.visible = false; for (const m of rooms) m.userData.room.uNight.value = 0; return rooms.length; }
    const lamp = new Col("#ffab5c"), lamp2 = new Col("#ffc27a");
    rooms.forEach((m, i) => { const U = m.userData.room; U.uNight.value = 0.92 * k; U.uLight.value.copy(i ? lamp2 : lamp); });
    fx.visible = true;
    // fxG's children: per window halo, shaft, pool, back
    fx.children.forEach((o, j) => { const r = j % 4, c = j < 4 ? lamp : lamp2;
      if (r === 0) { o.material.color.copy(c); o.material.opacity = 0.75 * k; o.scale.set(70, 62, 1); }
      if (r === 1) { o.material.uniforms.color.value.copy(c); o.material.uniforms.opacity.value = 0.8 * k; }
      if (r === 2) { o.material.color.copy(c); o.material.opacity = 0.9 * k; }
      if (r === 3) { o.material.color.copy(c); o.material.opacity = 0.25 * k; } });
    return rooms.length;
  }
  function pitch(rad) { const g = S.veh().group; g.rotation.order = "YXZ"; g.rotation.x = rad; g.updateMatrixWorld(true); }
  window.__b8 = { warm, house, pitch };
})();
