/* Cromatic opening · the host's half of the handoff, shared by the preview pages and the tools.
   cityTransform(json, frame, vw, vh) -> the CSS transform for a full-screen city layer (the map), so that it moves
   with the Lottie: a pull-back for direction B (json.cromatic.handoff), a small settle for the apertures (A, C).
   In the real site the same numbers drive the WebGL camera instead of a CSS transform. */
(function (g) {
  function bez(x1, y1, x2, y2) {
    const A = (a, b) => 1 - 3 * b + 3 * a, B = (a, b) => 3 * b - 6 * a, Cc = (a) => 3 * a;
    const calc = (t, a, b) => ((A(a, b) * t + B(a, b)) * t + Cc(a)) * t, slope = (t, a, b) => 3 * A(a, b) * t * t + 2 * B(a, b) * t + Cc(a);
    return (x) => { if (x <= 0) return 0; if (x >= 1) return 1; let t = x; for (let i = 0; i < 8; i++) { const s = slope(t, x1, x2); if (Math.abs(s) < 1e-6) break; t -= (calc(t, x1, x2) - x) / s; } return calc(t, y1, y2); };
  }
  function cityTransform(json, frame, vw, vh) {
    const W = json.w, H = json.h, k = Math.max(vw / W, vh / H), ox = (vw - W * k) / 2, oy = (vh - H * k) / 2;
    const h = json.cromatic && json.cromatic.handoff;
    const hm = (json.markers || []).find((m) => m.cm === "handoff");
    let s = 1, tx = 0, ty = 0;
    if (h && h.kind === "pullback") {
      const u = Math.max(0, Math.min(1, (frame - h.t0) / (h.t1 - h.t0))), e = bez(...h.ease)(u);
      s = h.scale + (1 - h.scale) * e;
      const a = [h.anchor[0] * W, h.anchor[1] * H], p0 = [h.from[0] * W, h.from[1] * H];
      const p = [p0[0] + (a[0] - p0[0]) * e, p0[1] + (a[1] - p0[1]) * e];
      tx = p[0] - s * a[0]; ty = p[1] - s * a[1];
    } else if (hm) {
      // an aperture opens onto a city that settles: 1.05 -> 1 over the handoff and a little after
      const u = Math.max(0, Math.min(1, (frame - hm.tm) / (hm.dr + 30))), e = 1 - Math.pow(1 - u, 3);
      s = 1.05 - 0.05 * e; tx = (W / 2) * (1 - s); ty = (H / 2) * (1 - s);
    }
    // comp px -> viewport px (the Lottie is laid out with xMidYMid slice, the city with the same cover)
    return `translate(${ox + tx * k}px, ${oy + ty * k}px) scale(${s * k})`;
  }
  g.cromaticHandoff = { cityTransform, bez };
})(typeof window !== "undefined" ? window : globalThis);
