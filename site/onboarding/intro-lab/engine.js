/* Cromatic Studios · the opening (r142): one engine, two hosts.
   The four reasons for a city, told the way a keynote would: one calm ground, lines that dissolve into each other on
   long ease-outs, the key word morphing in place (house, facade, brand), the ground dissolving to the live city under
   a camera that never stops moving, each new sky arriving as a dissolve of the last frame, the site's own objects
   inside the words (a sheet of thumbnails, the worlds' chips, the XP bar, the cup), the wall of cups parting around the
   cup that stays standing, and the real map, interface up, under the last line.
   The host says where the city is: /onboarding/intro-lab/ runs it in a frame (lab.js), "/" runs it in the page itself
   (src/app.js, r142). window.cromaticIntro4(host, opts) -> { start, next, skip, obstacles, running } */
(() => {
  const RM_Q = "(prefers-reduced-motion: reduce)";
  const lerp = (a, b, t) => a + (b - a) * t;
  // a camera path through keyframes (ms): a Catmull-Rom spline, so the move never stops or kinks at a key
  const path = (keys) => {
    const P = keys.map(([t, c]) => [t, [c.t[0], c.t[1], c.dist, c.yaw, c.pitch]]);
    return (ms) => {
      if (ms <= P[0][0]) return P[0][1];
      if (ms >= P[P.length - 1][0]) return P[P.length - 1][1];
      let i = 0; while (P[i + 1][0] < ms) i++;
      const [t1, p1] = P[i], [t2, p2] = P[i + 1], p0 = (P[i - 1] || P[i])[1], p3 = (P[i + 2] || P[i + 1])[1];
      const t = (ms - t1) / (t2 - t1), tt = t * t, ttt = tt * t;
      return p1.map((_, k) => 0.5 * (2 * p1[k] + (-p0[k] + p2[k]) * t + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * tt + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * ttt));
    };
  };
  // the worlds, in the order they pass behind "yours.": id, the pill's colour under it, the chip's name
  const WORLDS = [["nightlife", "#FF9E3D", "Night Mode"], ["ghibli", "#e0b25a", "Ghib.ly"], ["orchid", "#f08bb4", "Sakura"], ["sketch", "#ffd84a", "Sketchbook"], ["underwater", "#3de0d0", "Underwater"], ["monument", "#FED012", "Cromatic"]];
  const START = { t: [1000, 4800], dist: 3400, yaw: 0.2, pitch: 0.98 };
  // the camera's road; its end is the car (wherever it stands), framed on the right of the screen at the angle of
  // the coffee moment, so the map is left where the welcome card finds it
  const road_ = (car, phone, view) => {
    const yaw = 1.02, dist = 2600, pitch = 0.8;
    // the host's own opening view when it has one (the map's first frame: the car high, Two Minutes in it); else the
    // car to the right of the middle, lower on a phone
    const off = dist * (phone ? 0.02 : 0.1), fwd = phone ? dist * 0.065 : 0;
    const end = view || (car ? { t: [car[0] - Math.cos(yaw) * off - Math.sin(yaw) * fwd, car[1] + Math.sin(yaw) * off - Math.cos(yaw) * fwd], dist, yaw, pitch } : { t: [1300, 5100], dist: 5400, yaw: 1.18, pitch: 0.98 });
    return [
      [0, START], [5800, START],
      [8200, { t: [880, 4420], dist: 2350, yaw: 0.48, pitch: 0.8 }],
      [11200, { t: [880, 4420], dist: 2100, yaw: 0.7, pitch: 0.75 }],
      [13800, { t: [900, 4400], dist: 1950, yaw: 0.9, pitch: 0.7 }],
      [15800, { t: [1000, 4700], dist: 2600, yaw: 1.02, pitch: 0.8 }],
      [18600, end], [30000, end],
    ];
  };
  const BEATS = [300, 3350, 6300, 12500, 15000, 16300]; // where each beat begins on the clock

  window.cromaticIntro4 = function (host, opts = {}) {
    const reduced = host.reduced ?? matchMedia(RM_Q).matches;
    const phone = () => (host.isPhone ? host.isPhone() : innerWidth < 760);
    const root = host.stage;
    root.classList.add("i4");
    if (phone()) root.classList.add("lite");
    root.innerHTML = '<i class="i4-veil"></i><canvas class="i4-ghost"></canvas><div class="i4-words" aria-live="polite"></div><div class="i4-over" aria-hidden="true"></div>';
    const veil = root.querySelector(".i4-veil"), ghost = root.querySelector(".i4-ghost"), gctx = ghost.getContext("2d"), words = root.querySelector(".i4-words"), over = root.querySelector(".i4-over");
    const cur = { token: 0, t0: 0, lines: new Set(), running: false, camOn: false, camOff: 0, camHold: 0, done: false };
    const abort = () => new Error("abort");
    let readyDone = !host.ready; if (host.ready) host.ready.then(() => { readyDone = true; }, () => { readyDone = true; }); // r153: the city ready (or no gate)
    const dropPre = (ms = 0) => { const pre = document.querySelector(".i4-pre"); if (pre) setTimeout(() => pre.remove(), ms); }; // r153: the page's own first line, once adopted and done with
    const wait = (ms, tok) => new Promise((res, rej) => setTimeout(() => (tok === cur.token ? res() : rej(abort())), ms));
    // the run's clock: at(ms) waits for its moment on the clock, and the clock can be pushed forward (a click skips
    // to the next beat), so everything after the push happens at once, in order
    const at = (ms, tok) => new Promise((res, rej) => { const tick = () => { if (tok !== cur.token) return rej(abort()); if (performance.now() - cur.t0 >= ms) res(); else requestAnimationFrame(tick); }; tick(); });
    const elapsed = () => performance.now() - cur.t0;
    window.__i4dbg = () => ({ el: Math.round(elapsed()), stall: Math.round(cur.stall || 0), t0: Math.round(cur.t0), running: cur.running, lines: cur.lines.size }); // r153: tests
    const late = (ms) => elapsed() > ms + 450; // a moment the clock was pushed past: skip what it would have done
    const send = (o) => { try { host.send(o); } catch (e) {} };
    const veilTo = (o, ms = 900) => { veil.style.setProperty("--vt", ms + "ms"); veil.style.opacity = o; };
    const html = (h) => { const d = document.createElement("div"); d.innerHTML = h; const n = d.firstElementChild; over.appendChild(n); return n; };

    /* ---------- the words ---------- */
    const letterize = (s, text, from = 0) => { s.innerHTML = ""; [...text].forEach((ch, j) => { const l = document.createElement("i"); l.className = "l"; l.textContent = ch; l.style.setProperty("--ld", (from + j * 16) + "ms"); s.appendChild(l); }); };
    // parts: "word" or { w, pill, cls, d, br, brm }; a line enters word by word (stagger ms between them)
    const line = (parts, { cls = "", stagger = 55, delay = 0 } = {}) => {
      const el = document.createElement("div"); el.className = "kl calm " + cls;
      parts.forEach((p, i) => {
        const w = typeof p === "string" ? { w: p } : p;
        if (w.br || w.brm) { const r = document.createElement("i"); r.className = w.brm ? "brm" : "br"; el.appendChild(r); return; }
        const s = document.createElement("span");
        s.className = "kw" + (w.pill ? " pill pill-" + w.pill : "") + (w.cls ? " " + w.cls : "");
        if (w.pill) { const wn = document.createElement("span"); wn.className = "wn"; letterize(wn, w.w); s.appendChild(wn); } else letterize(s, w.w);
        s.style.setProperty("--d", (delay + (w.d ?? i * stagger)) + "ms");
        el.appendChild(s);
      });
      words.appendChild(el);
      cur.lines.add(el);
      requestAnimationFrame(() => el.classList.add("in"));
      return el;
    };
    // a line leaves letter by letter in a short cascade; a pill leaves whole, with its letters inside it; a forgotten
    // letter leaves from where it drifted to, with what little was left of it
    const gone = (el) => {
      if (!el || !el.isConnected) return; cur.lines.delete(el);
      el.querySelectorAll(".l").forEach((l, j) => l.style.setProperty("--lo", Math.min(120, j * 5) + "ms"));
      el.querySelectorAll(".kw.forget .l").forEach((l) => { const cs = getComputedStyle(l); l.style.opacity = cs.opacity; l.style.transform = cs.transform; l.style.animation = "none"; l.style.transition = "opacity .3s ease"; requestAnimationFrame(() => { l.style.opacity = "0"; }); });
      el.classList.add("outsoft"); setTimeout(() => el.remove(), 600);
    };
    const fast = (el) => { if (!el || !el.isConnected) return; el.classList.add("outfast"); setTimeout(() => el.remove(), 220); };
    // a word is forgotten: its letters drift apart and out of focus, each on its own moment (k: how far it goes)
    const forget = (w, k = 1, spread = 700, from = 0) => { if (!w) return; const ls = [...w.querySelectorAll(".l")]; ls.forEach((l, j) => { const u = ls.length > 1 ? j / (ls.length - 1) : 0; l.style.setProperty("--lo", (from + (0.35 * u + 0.65 * ((j * 7) % 10) / 10) * spread).toFixed(0) + "ms"); l.style.setProperty("--fx", ((u - 0.5) * 26 * k).toFixed(1) + "px"); l.style.setProperty("--fy", (-(5 + ((j * 3) % 5) * 2) * k).toFixed(1) + "px"); l.style.setProperty("--fo", k >= 1 ? 0.06 : 0.3); }); w.classList.add("forget"); };
    // the pill's word changes in place: the old word's letters leave while the new word's letters arrive, in the same
    // place, the pill easing between the two widths under them (a crossfade: the pill is never seen empty)
    const morph = async (el, list, every, tok) => {
      for (const [w, color] of list) {
        await wait(every, tok);
        if (!el.isConnected) return;
        const w0 = el.offsetWidth;
        const old = el.querySelector(":scope > .wn"); if (!old) return;
        old.className = "wv"; [...old.querySelectorAll(".l")].forEach((l, j) => l.style.setProperty("--lo", (j * 14) + "ms"));
        const nw = document.createElement("span"); nw.className = "wn m"; letterize(nw, w);
        el.appendChild(nw);
        el.style.width = "auto"; old.style.display = "none";
        const w1 = el.offsetWidth; old.style.display = ""; el.style.width = w0 + "px"; void el.offsetWidth;
        el.classList.add("mw"); el.style.width = w1 + "px"; if (color) el.style.background = color;
        await wait(620, tok);
        old.remove(); el.classList.remove("mw"); el.style.width = "";
      }
    };
    // a change of world as a dissolve: the city's last frame (snapped by the host right after its draw) is laid over
    // the city, the world changes under it, and it fades away; the camera holds still meanwhile
    const dissolveTo = async (id, ms = 420) => {
      let src = null; try { src = await host.snap(); } catch (e) {}
      cur.camHold = performance.now() + ms + 40;
      if (src && src.width) {
        if (ghost.width !== src.width || ghost.height !== src.height) { ghost.width = src.width; ghost.height = src.height; }
        gctx.drawImage(src, 0, 0);
        ghost.style.transition = "none"; ghost.style.opacity = "1";
        requestAnimationFrame(() => { send({ op: "scheme", id }); requestAnimationFrame(() => { ghost.style.transition = `opacity ${ms}ms ease`; ghost.style.opacity = "0"; }); });
      } else send({ op: "scheme", id });
    };
    const camAt = (v) => send({ op: "cam", t: [v[0], v[1]], dist: v[2], yaw: v[3], pitch: v[4] });
    // the standing cup is an obstacle for the wall of cups: it parts around it and the falling cups bounce off it
    const obstacles = () => { const el = over.querySelector(".cupbig"); if (!el) return []; const r = el.getBoundingClientRect(); return [{ x: (r.left + r.width / 2) / innerWidth, y: (r.top + r.height * 0.56) / innerHeight, r: (r.width * 0.4) / innerHeight, m: (phone() ? 0.022 : 0.04) * 1.2 }]; };

    /* ---------- the run ---------- */
    const run = async (tok) => {
      veil.style.setProperty("--vt", "0ms"); veil.style.opacity = 1; veil.classList.add("warm");
      send({ op: "mode", map: true }); send({ op: "scheme", id: "monument" }); send({ op: "frame" }); camAt([START.t[0], START.t[1], START.dist, START.yaw, START.pitch]);
      root.classList.add("warming");
      const warmP = host.warm ? host.warm().catch(() => {}) : Promise.resolve();
      if (host.warmBlocking) await warmP;
      if (host.cupsPrep) { try { await host.cupsPrep(); } catch (e) {} }
      if (tok !== cur.token) throw abort();
      root.classList.remove("warming");
      cur.t0 = performance.now(); cur.running = true; root.classList.add("running");
      opts.onStart?.();
      let car = null, view = null; try { car = host.carPos?.() || null; view = host.endView?.() || null; } catch (e) {}
      let road = path(road_(car, phone(), view));
      host.prebuild?.();
      cur.camOn = true; cur.camOff = 0; cur.camHold = 0; let camLast = performance.now();
      // r153: a stall of the main thread (the city being built under the first beats) does not push the clock: the
      // beats resume where they were, so nothing is skipped as late
      cur.stall = 0;
      (function drive(now) { if (tok !== cur.token || !cur.camOn) return; if (now - camLast > 250) { cur.t0 += now - camLast - 16; cur.stall += now - camLast - 16; } if (now < cur.camHold) cur.camOff += now - camLast; camLast = now; camAt(road(now - cur.t0 - cur.camOff)); requestAnimationFrame(drive); })(performance.now());
      // 1 · nobody remembers a thumbnail: the word sits on a sheet of thumbnails, and the sheet falls apart
      // r153: when the page painted this line itself (build.mjs, .i4-pre, before the bundle ran), it is adopted in
      // place, its letters wherever they got to, and the clock continues from its paint (at most 1.15 s in)
      const pre = document.querySelector(".i4-pre:not([hidden]):not(.gone)"), preKl = pre && pre.querySelector(".kl");
      let a;
      if (preKl) {
        const since = performance.now() - (window.__i4t0 || performance.now());
        cur.t0 = performance.now() - Math.min(1150, Math.max(300, since - 80));
        pre.classList.add("adopted"); a = preKl; cur.lines.add(a);
      } else {
        await at(300, tok);
        a = line(["Nobody", "remembers", { br: true }, { w: "a", d: 260 }, { w: "thumbnail.", cls: "thumb", d: 330 }]);
      }
      await at(1250, tok);
      const th = a.querySelector(".thumb");
      if (th && th.isConnected && !late(1250)) {
        const r = th.getBoundingClientRect(), R = root.getBoundingClientRect();
        const grid = html(`<div class="tgrid">${Array.from({ length: 9 }, (_, i) => `<i style="--i:${i};--dx:${((i % 3) - 1) * 34}px;--dy:${(Math.floor(i / 3) - 1) * 26}px;--rz:${((i * 7) % 11 - 5) * 3}deg"></i>`).join("")}</div>`);
        grid.style.left = (r.left - R.left + r.width / 2) + "px"; grid.style.top = (r.top - R.top + r.height / 2) + "px";
        grid.style.setProperty("--gw", Math.round(r.width + 120) + "px"); grid.style.setProperty("--gh", Math.round(r.height * 3) + "px");
      }
      await at(1750, tok); over.querySelector(".tgrid")?.classList.add("apart"); forget(th, 0.3, 500, 150); forget(a.querySelectorAll(".kw")[1], 0.25, 500, 400);
      await at(2750, tok); gone(a); fast(over.querySelector(".tgrid")); if (pre) setTimeout(() => pre.remove(), 700);
      // 2 · but someone could remember a house → facade → brand
      await at(3350, tok);
      const b = line(["But", "someone", "could", { br: true }, { w: "remember", d: 300 }, { w: "a", d: 360 }, { brm: true }, { w: "place.", pill: "g", d: 440 }]);
      await at(4350, tok);
      if (!late(4350)) await morph(b.querySelector(".pill"), [["facade.", "#119BFE"], ["brand.", "#FED012"]], 640, tok);
      await at(6100, tok); gone(b);
      // r153: the city is wanted from here on: if it is not ready yet (built, its programs linked, its first frames
      // drawn), the clock holds on the empty ground until it is; and the road's end is solved now, on the real car
      if (host.ready) { const w0 = performance.now(); try { await host.ready; } catch (e) {} if (tok !== cur.token) throw abort(); const dw = performance.now() - w0; if (dw > 16) cur.t0 += dw; }
      try { car = host.carPos?.() || car; view = host.endView?.() || view; road = path(road_(car, phone(), view)); } catch (e) {}
      // 3 · the ground dissolves to the city; nine worlds, one will feel like yours (the sky dissolves from one world
      // to the next behind the words, the worlds' own chips along the bottom, the one on screen lit)
      await at(6300, tok); host.reveal?.(); veilTo(0, 1300);
      await at(6900, tok);
      const c = line(["Nine", "worlds", "over", "the", "same", "streets.", { br: true }, { w: "One", d: 900 }, { w: "will", d: 955 }, { w: "feel", d: 1010 }, { w: "like", d: 1065 }, { w: "yours.", pill: "y", d: 1220 }], { cls: "mid onCity" });
      const yours = c.querySelector(".pill");
      const chips = html(`<div class="wchips">${WORLDS.map(([id, col, name], i) => `<span class="wchip" data-w="${id}" style="--wc:${col};--i:${i}">${name}</span>`).join("")}</div>`);
      for (let i = 0; i < WORLDS.length; i++) {
        await at(8600 + i * 500, tok);
        if (late(8600 + i * 500)) continue;
        const [id, pc] = WORLDS[i];
        yours.style.background = pc;
        chips.querySelectorAll(".wchip").forEach((ch) => ch.classList.toggle("on", ch.dataset.w === id));
        dissolveTo(id);
      }
      await at(11900, tok); gone(c); chips.classList.add("gone"); setTimeout(() => chips.remove(), 700);
      // 4 · that's how the right brand feels (r144: Daniel's wording, was "feels like"): the site's own XP bar fills up under the words
      await at(12500, tok);
      const d = line(["That's", "how", "the", { w: "right", pill: "y", d: 280 }, { w: "brand", d: 330 }, { w: "feels.", d: 380 }], { cls: "mid onCity" });
      const xp = html(`<div class="xpbar"><span class="xp-fill"></span><span class="xp-sun"><svg viewBox="0 0 24 24" width="20" height="20"><g fill="#FED012"><circle cx="12" cy="12" r="5"/><path d="M12 1l1.4 4h-2.8zM12 23l-1.4-4h2.8zM1 12l4-1.4v2.8zM23 12l-4 1.4v-2.8zM4.2 4.2l3.8 1.9-1.9 1.9zM19.8 19.8l-3.8-1.9 1.9-1.9zM4.2 19.8l1.9-3.8 1.9 1.9zM19.8 4.2l-1.9 3.8-1.9-1.9z"/></g></svg></span><span class="xp-label">YOU + YOUR BRAND</span><span class="xp-num"><b>0</b> XP</span></div>`);
      xp.style.setProperty("--w", (xp.getBoundingClientRect().width - 26) + "px");
      requestAnimationFrame(() => xp.classList.add("in"));
      { const n = xp.querySelector("b"), t0 = performance.now(); const tick = () => { if (tok !== cur.token || !xp.isConnected) return; const u = Math.min(1, (performance.now() - t0 - 500) / 1500); const e = u <= 0 ? 0 : 1 - Math.pow(1 - u, 3); xp.style.setProperty("--f", e.toFixed(3)); n.textContent = Math.round(225 * e); if (u < 1) requestAnimationFrame(tick); else xp.classList.add("full"); }; tick(); }
      await at(14400, tok); gone(d); xp.classList.add("gone"); setTimeout(() => xp.remove(), 700);
      // 5 · and like a good coffee: the studio's cup stands in the middle; the words leave as the wall of cups comes
      await at(15000, tok);
      const e = line(["And", "like", { w: "a", d: 160 }, { w: "good", pill: "mv", d: 240 }, { w: "coffee.", pill: "y", d: 330 }], { cls: "mid onCity hi" });
      html(`<i class="cupbig"></i>`);
      await at(16100, tok); gone(e);
      await at(16300, tok);
      // 6 · the cups: the map's interface is built while the wall covers the screen (its cost lands out of sight), so
      // when the cups fall the real map is already there, interface and all; the last line comes while they still fall
      root.classList.add("ending");
      setTimeout(() => { if (tok === cur.token) host.ui?.(true); }, 1100);
      let letGo = null; const dropP = new Promise((r) => (letGo = r));
      const cupP = (host.cups ? host.cups({ onDrop: () => letGo() }) : Promise.resolve()).catch(() => {});
      await Promise.race([dropP, cupP]);
      if (tok !== cur.token) throw abort();
      await wait(250, tok);
      const f = line(["There's", "always", "a", { w: "good", pill: "mv", d: 240 }, { w: "coffee", pill: "y", d: 330 }, { w: "around.", d: 390 }], { cls: "mid onCity lo" });
      await cupP;
      if (tok !== cur.token) throw abort();
      cur.camOn = false; // the map's own hands from here
      await wait(300, tok); gone(f); over.querySelector(".cupbig")?.classList.add("gone");
      await wait(350, tok);
      finish(tok);
    };
    const finish = (tok) => {
      if (tok !== cur.token || cur.done) return;
      cur.done = true; cur.running = false; cur.camOn = false;
      root.classList.remove("running", "ending"); root.classList.add("done");
      opts.onEnd?.();
      host.end?.();
    };
    // a click (or Space / →) skips to the next beat: the clock is pushed forward, what is on screen goes in a blink
    const next = () => {
      if (!cur.running) return;
      const e = elapsed();
      const n = BEATS.find((t) => t > e + 80);
      if (n == null) { skip(); return; }
      cur.lines.forEach((el) => fast(el)); cur.lines.clear(); dropPre(260);
      over.querySelectorAll(".tgrid, .wchips, .xpbar, .cupbig").forEach((x) => fast(x));
      cur.t0 -= (Math.max(e, n - 200) - e);
    };
    // skip: straight to the end state, whatever is on
    const skip = () => {
      if (cur.done) return;
      const wasRunning = cur.running;
      cur.token++; cur.running = false; cur.camOn = false;
      cur.lines.forEach((el) => fast(el)); cur.lines.clear(); dropPre(260);
      over.innerHTML = ""; root.classList.remove("warming", "running", "ending");
      ghost.style.transition = "none"; ghost.style.opacity = "0";
      cur.done = true; root.classList.add("done");
      opts.onEnd?.();
      try { host.skipView?.(); } catch (e) {}
      // r153: skipped before the city is ready: the ground stays up until it is, then lifts (the host ends the intro then too)
      const lift = () => veilTo(0, 500);
      if (readyDone) lift(); else host.ready.then(lift, lift);
      host.skipEnd?.(wasRunning);
    };
    root.addEventListener("click", () => { if (!cur.done) next(); });
    const onKey = (e) => { if (cur.done) return; if (e.key === " " || e.key === "ArrowRight") { e.preventDefault(); next(); } else if (e.key === "Escape") skip(); };
    addEventListener("keydown", onKey);
    const start = () => {
      cur.token++;
      const tok = cur.token;
      if (reduced) { // a short fade, no words
        veil.style.setProperty("--vt", "0ms"); veil.style.opacity = 1; veil.classList.add("warm");
        setTimeout(() => { if (tok !== cur.token) return; host.reveal?.(); veilTo(0, 700); setTimeout(() => finish(tok), 800); }, 300);
        return;
      }
      run(tok).catch((e) => { if (!(e && e.message === "abort")) console.error(e); });
    };
    const destroy = () => { cur.token++; removeEventListener("keydown", onKey); root.remove(); };
    return { start, next, skip, obstacles, destroy, get running() { return cur.running; }, get done() { return cur.done; }, elapsed };
  };
})();
