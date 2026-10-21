// Cromatic · stories · E (the rides, TASK-111, Iris): the map's own renderer, the ride alone on paper. LOCAL ONLY.
// The app is beta 4.4 (origin/stack-44: Radu's real-size scooter, the F1 on flat slicks) built from a scratch worktree
// with the v5 recorder's debug hooks (design/stories/v5/_source/patchsrc.py) plus window.__outline = outline, served on
// :8983. Every draw of the main camera is taken over: the rest of the city hidden for that draw only, the scene's
// background the paper, the camera on a turntable round the ride's own box (the city's bend applied), the app's
// OutlineEffect for the ink line, the renderer at 4x of a 540 x 960 page (2160 x 3840: the plates at 2x).
import pw from "/Users/daniel.stoic/node_modules/playwright/index.mjs";
export async function open({ w = 540, h = 960, dsf = 4, bg = "#FBFAF5", noSpawn = true, iso = true, url = "/?drive&nointro" } = {}) {
  const br = await pw.chromium.launch({ args: ["--use-angle=metal", "--ignore-gpu-blocklist", "--enable-gpu"] });
  const ctx = await br.newContext({ viewport: { width: w, height: h }, deviceScaleFactor: dsf });
  await ctx.route(/google-analytics|analytics\.google|googletagmanager|doubleclick|facebook/, (r) => r.fulfill({ status: 204, body: "" }));
  await ctx.addInitScript(() => { const pre = { "cz-drive-guide": "2", "cz-welcome-at": String(Date.now()), "cz-map-guide": "1", "cz-intro-at": String(Date.now()), "cz-consent": "no" }; try { for (const k in pre) localStorage.setItem(k, pre[k]); } catch {} }); if (noSpawn) await ctx.addInitScript(() => { window.__noSpawn = true; });
  const p = await ctx.newPage();
  p.on("pageerror", (e) => console.log("pageerror", e.message));
  await p.goto("http://127.0.0.1:8983" + url, { waitUntil: "domcontentloaded" });
  await p.waitForFunction(() => window.__vehG && window.__vehG() && window.__scene && window.__api, null, { timeout: 120000 });
  await p.waitForTimeout(5000);
  await p.addStyleTag({ content: "body>*:not(canvas):not(#app):not(.app){visibility:hidden!important} .ui-root,.grade,.uw-veil,.gh-paper,.sk-petals,#cz-ck,.topbar,.hud,.map-top,.map-dock,.mapcard,.toast-col{display:none!important} body::before,body::after{display:none!important}" });
  await p.evaluate((bg) => {
    window.__isoBg = bg;
    // the ride alone: everything else is hidden for the draw only (and shown again after it: the app's own logic sees
    // the whole city every frame)
    window.__isoHide = () => {
      const sc = window.__scene, v = window.__vehG(); if (!v) return [];
      let r = v.group; while (r.parent && r.parent !== sc) r = r.parent;
      const hid = []; sc.children.forEach((c) => { if (c !== r && !c.isLight && c.visible) { c.visible = false; hid.push(c); } });
      const bg = sc.background; window.__bgWas = bg && bg.clone ? bg.clone() : bg; if (bg && bg.set) bg.set(window.__isoBg);
      window.__fogWas = sc.fog; sc.fog = null;
      return hid;
    };
    window.__isoShow = (hid) => { const sc = window.__scene; hid.forEach((c) => (c.visible = true)); if (window.__bgWas && sc.background && sc.background.copy) sc.background.copy(window.__bgWas); sc.fog = window.__fogWas; };
    window.__iso = () => {};
    window.__camK = 1000;
  }, bg);
  if (iso) await p.evaluate(() => window.__iso());
  return { br, p };
}
// a camera on a turntable around the ride, applied right before every render of the main camera (the app's own
// camera logic is bypassed): azimuth a, elevation e (rad), distance R, target ty above the ride's ground point. Every
// ride gets the same R: their real scale relationship.
export async function aim(p, o) {
  return p.evaluate((o) => {
    window.__turn = o;
    const r = window.__renderer;
    if (!r.__wrapped) {
      const orig = r.render.bind(r);
      r.render = (sc, cam) => {
        let hid = null;
        if (window.__inOutline) return orig(sc, cam);
        if (cam === window.__camera && window.__turn && sc === window.__scene) {
          const T = window.__turn, v = window.__vehG(); hid = window.__isoHide();
          if (v) {
            const g = v.group, V = cam.position.constructor, gp = new V(); g.updateMatrixWorld(true); g.getWorldPosition(gp);
            if (cam.view && cam.view.enabled) cam.clearViewOffset();
            cam.fov = T.fov || 22; cam.near = T.near || 4; cam.far = T.far || 6000; cam.updateProjectionMatrix();
            // the ride's own box (solid meshes only: no blob, no beams, no glow), its middle on the ground plane
            const mn = [1e9, 1e9, 1e9], mx = [-1e9, -1e9, -1e9], q = new V();
            g.traverse((o) => {
              if (!o.isMesh || !o.geometry) return; let x = o; while (x) { if (!x.visible) return; x = x.parent; }
              const m = Array.isArray(o.material) ? o.material[0] : o.material; if (m && (m.blending === 2 || m.transparent)) return;
              const geo = o.geometry; if (!geo.boundingBox) geo.computeBoundingBox(); const b = geo.boundingBox; if (!isFinite(b.min.x)) return;
              for (let i = 0; i < 8; i++) { q.set(i & 1 ? b.max.x : b.min.x, i & 2 ? b.max.y : b.min.y, i & 4 ? b.max.z : b.min.z).applyMatrix4(o.matrixWorld); for (let k = 0; k < 3; k++) { const c = q.getComponent(k); if (c < mn[k]) mn[k] = c; if (c > mx[k]) mx[k] = c; } }
            });
            const cx = (mn[0] + mx[0]) / 2, cz = (mn[2] + mx[2]) / 2;
            window.__turnBox = { mn, mx };
            if (T.pr && Math.abs(r.getPixelRatio() - T.pr) > 0.01) { r.setPixelRatio(T.pr); r.setSize(innerWidth, innerHeight); }
            const tg = new V(cx, gp.y + T.ty, cz); if (window.__warpV) window.__warpV(tg); // (the city's bend moves what is drawn)
            tg.x += T.dx || 0; tg.z += T.dz || 0;
            cam.position.set(tg.x + T.R * Math.cos(T.e) * Math.sin(T.a), tg.y + T.R * Math.sin(T.e), tg.z + T.R * Math.cos(T.e) * Math.cos(T.a));
            cam.up.set(0, 1, 0); cam.lookAt(tg); cam.updateMatrixWorld();
            window.__turnLast = { gp: [gp.x, gp.y, gp.z], rot: g.rotation.y };
          }
        }
        // the map's ink line: the app's own OutlineEffect (window.__noPost makes the app hand us the plain draw)
        if (hid) { try { if (window.__outline && window.__turn.outline !== false) { window.__inOutline = true; try { return window.__outline.render(sc, cam); } finally { window.__inOutline = false; } } return orig(sc, cam); } finally { window.__isoShow(hid); } }
        return orig(sc, cam);
      };
      r.__wrapped = true;
    }
    return window.__turnLast || null;
  }, { ty: 14, ...o });
}
export async function setVeh(p, id) { await p.evaluate((id) => { window.__api.setVehicle(id); }, id); await p.waitForTimeout(1500); await p.evaluate(() => window.__iso()); }
