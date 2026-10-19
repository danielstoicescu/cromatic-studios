// lottie-ui: frames the worker draws for a mounted piece (enterFrame from the worker), during its segments.
// usage inside a flow: await fpsArm(page, "() => window.czFinale.piece()") ... await fpsRead(page)
export async function fpsArm(page, getter) {
  await page.evaluate((g) => {
    window.__lf = []; const get = eval(g);
    const arm = () => { const p = get(); if (!p) return setTimeout(arm, 50); p.anim.addEventListener("enterFrame", (e) => window.__lf.push([performance.now(), +e.currentTime || 0])); };
    arm();
  }, getter);
}
// fps over the drawn stretch, the longest gap between two drawn frames (ms), and how many gaps were over 25 ms
export async function fpsRead(page) {
  return page.evaluate(() => {
    const f = window.__lf || []; if (f.length < 3) return { n: f.length };
    let worst = 0, over = 0; for (let i = 1; i < f.length; i++) { const d = f[i][0] - f[i - 1][0]; if (d > worst) worst = d; if (d > 25) over++; }
    const span = f.at(-1)[0] - f[0][0];
    // on the animation's own clock (the worker's): a step of more than 1.6 frames is a frame it could not draw in time
    // (the main thread's arrival times above can bunch up while it is busy; this cannot)
    let skips = 0, maxStep = 0, steps = 0;
    for (let i = 1; i < f.length; i++) { const d = f[i][1] - f[i - 1][1]; if (d <= 0 || d > 30) continue; steps++; if (d > maxStep) maxStep = d; if (d > 1.6) skips++; }
    return { n: f.length, fps: +((f.length - 1) / (span / 1000)).toFixed(1), worstMs: Math.round(worst), over25: over, span: Math.round(span), clockSteps: steps, skips, maxStep: +maxStep.toFixed(2) };
  });
}
