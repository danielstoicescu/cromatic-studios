// Drive-it banner loop (site/media/drive-loop): a story shot re-framed for a 2:1 banner and filmed in slow motion.
// wide(base, { name, k, slow, fstopK }): the same shot, 2:1 (3840 x 1920 at scale 1), vertical fov x k (the 9:16 frame's
// subject held at a similar size), fps = base fps / slow (frame f of the wrapper = base time t0 + f * slow / 30: played at
// 30 fps it is real slow motion, every frame rendered, no interpolation), the f-stop x fstopK.
export function wide(B, { name, k = 0.8, slow = 0.5, fstopK = 1, size = [3840, 1920], look } = {}) {
  const C = B.camera, camera = { ...C, at: (t) => { const c = C.at(t); return { ...c, fov: c.fov * k }; } };
  const lens = { ...(B.lens || {}), ...(B.lens && B.lens.fstop ? { fstop: B.lens.fstop * fstopK } : {}) };
  return { ...B, name, size, fps: (B.fps || 30) / slow, camera, lens, ...(look ? { look: { ...B.look, ...look } } : {}), cameraLimits: { ...(B.cameraLimits || {}), maxTurn: 99, maxTurnJump: 99 } };
}
