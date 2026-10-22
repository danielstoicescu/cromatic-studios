// Cromatic · diorama renders (TASK-118): set dressing for a shot, in the page, undone by the shot's dispose(). A film
// set moves what is in the way of the lens; so can a story (the map is never changed for visitors: this only runs in
// the harness's page).
//   const undo = hideNear(ctx, [[x, z, r], ...], { instanced: true, meshes: false })   everything standing within r of
//                (x, z) (logical coordinates): instanced trees, bushes and lamps (their instances), or whole meshes
//   undo()
export function hideNear(ctx, spots, { instanced = true, meshes = false } = {}) {
  const { S, K } = ctx, m4 = new K.Matrix4(), v = new K.Vector3(), saved = [];
  const near = (x, z) => spots.some(([sx, sz, r]) => Math.hypot(x - sx, z - sz) < r);
  S.scene.traverse((o) => {
    if (!o.isMesh) return;
    if (o.isInstancedMesh && instanced) {
      const a = o.instanceMatrix.array; let copy = null;
      for (let i = 0; i < o.count; i++) {
        o.getMatrixAt(i, m4); v.setFromMatrixPosition(m4.premultiply(o.matrixWorld));
        if (!near(v.x, v.z)) continue;
        copy = copy || a.slice();
        a.fill(0, i * 16, i * 16 + 16);
      }
      if (copy) { o.instanceMatrix.needsUpdate = true; saved.push(() => { a.set(copy); o.instanceMatrix.needsUpdate = true; }); }
    } else if (!o.isInstancedMesh && meshes && o.visible) {
      if (!o.geometry.boundingSphere) o.geometry.computeBoundingSphere();
      v.copy(o.geometry.boundingSphere.center).applyMatrix4(o.matrixWorld);
      if (near(v.x, v.z) && o.geometry.boundingSphere.radius < 60) { o.visible = false; saved.push(() => (o.visible = true)); }
    }
  });
  return () => { for (const f of saved.reverse()) f(); };
}
