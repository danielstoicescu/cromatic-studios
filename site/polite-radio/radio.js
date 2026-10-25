/* Polite City radio · radio.js (Sorin, Cromatic Studios, 25 Oct 2026). Standalone, no dependencies, WebAudio.
 * Sound is OFF until a user gesture: nothing is created, fetched or played before play() is called, and play() called
 * outside a gesture waits for the next tap/click/key.
 *   <script src="/path/radio/radio.js" data-base="/path/radio/"></script>
 *   __politeRadio.play("olari-fm" | "radio-kerning" | "brief-talk" | 0..2)   next()   stop()   setVolume(0..1)
 * Extras: sfx(id) plays a one-shot or starts a loop from manifest.files (returns a stop function), ambience(on), duck(on),
 * state() -> { station, volume, unlocked }, onchange = fn({ station, name, dial }) for the top-centre station flash.
 * Stations run on a shared "broadcast clock": tune away and back and the station has carried on, like real radio. */
(function () {
  "use strict";
  if (window.__politeRadio) return;
  var script = document.currentScript, BASE = (script && script.getAttribute("data-base")) || (script ? script.src.replace(/[^/]*$/, "") : "./");
  var ctx = null, master = null, musicBus = null, sfxBus = null, manifest = null, ext = "webm", buffers = {}, loading = {};
  var volume = 0.8, current = -1, want = -1, playing = null, ambLoop = null, ducked = false, unlocked = false, pending = null, epoch = 0, token = 0;

  function dbToGain(d) { return Math.pow(10, (d || 0) / 20); }
  function ensureCtx() {
    if (ctx) return ctx;
    var AC = window.AudioContext || window.webkitAudioContext; if (!AC) return null;
    ctx = new AC(); master = ctx.createGain(); master.gain.value = volume; master.connect(ctx.destination);
    musicBus = ctx.createGain(); musicBus.connect(master); sfxBus = ctx.createGain(); sfxBus.connect(master);
    var probe = document.createElement("audio"); ext = probe.canPlayType && probe.canPlayType('audio/webm; codecs="opus"') ? "webm" : "m4a";
    if (/^((?!chrome|android).)*safari/i.test(navigator.userAgent)) ext = "m4a"; // Safari's WebAudio decoder is happier with AAC
    epoch = ctx.currentTime; return ctx;
  }
  function loadManifest() { if (manifest) return Promise.resolve(manifest); return fetch(BASE + "manifest.json").then(function (r) { return r.json(); }).then(function (m) { manifest = m; return m; }); }
  function decode(ab) { return new Promise(function (ok, no) { var p = ctx.decodeAudioData(ab, ok, no); if (p && p.then) p.then(ok, no); }); }
  function load(id) {
    if (buffers[id]) return Promise.resolve(buffers[id]); if (loading[id]) return loading[id];
    loading[id] = loadManifest().then(function (m) {
      var f = m.files[id]; if (!f) throw new Error("politeRadio: unknown file " + id);
      var get = function (e) { return fetch(BASE + f[e].file).then(function (r) { if (!r.ok) throw new Error(r.status); return r.arrayBuffer(); }).then(decode); };
      return get(ext).catch(function () { ext = "m4a"; return get("m4a"); }); // the fallback if Opus/WebM won't decode
    }).then(function (b) { buffers[id] = b; return b; });
    return loading[id];
  }
  function unlock() { // the first gesture: resume the context; start whatever play() asked for
    if (!ensureCtx()) return; if (ctx.state !== "running") ctx.resume();
    unlocked = true; ["pointerdown", "keydown", "touchend"].forEach(function (e) { window.removeEventListener(e, unlock, true); });
    if (pending) { var p = pending; pending = null; p(); }
  }
  ["pointerdown", "keydown", "touchend"].forEach(function (e) { window.addEventListener(e, unlock, true); });
  function whenUnlocked(fn) { if (unlocked && ctx) { if (ctx.state !== "running") ctx.resume(); fn(); } else pending = fn; }
  function fadeOut(node, t) { if (!node) return; var g = node.gain, now = ctx.currentTime; g.cancelScheduledValues(now); g.setValueAtTime(g.value, now); g.linearRampToValueAtTime(0, now + t); setTimeout(function () { try { node.src.stop(); } catch (e) {} node.disconnect(); }, t * 1000 + 60); }
  function startLoop(id, bus, gainDb, offsetFromClock, fadeIn) {
    var f = manifest.files[id], b = buffers[id], src = ctx.createBufferSource(), g = ctx.createGain(); src.buffer = b; src.loop = true;
    var ls = f.loop ? f.loop.start : 0, le = f.loop ? f.loop.end : b.duration; src.loopStart = ls; src.loopEnd = le;
    var len = le - ls, off = offsetFromClock ? ls + ((ctx.currentTime - epoch + offsetFromClock) % len) : ls;
    g.gain.value = 0; src.connect(g); g.connect(bus); src.start(0, off); g.gain.setValueAtTime(0, ctx.currentTime); g.gain.linearRampToValueAtTime(dbToGain(gainDb), ctx.currentTime + (fadeIn || 0.05));
    var node = { src: src, gain: g.gain, disconnect: function () { g.disconnect(); } }; return node;
  }
  function oneShot(id, bus, gainDb, when) { var src = ctx.createBufferSource(), g = ctx.createGain(); src.buffer = buffers[id]; g.gain.value = dbToGain(gainDb); src.connect(g); g.connect(bus); src.start(when || 0); return src; }
  function idx(st) { if (typeof st === "number") return ((st % manifest.stations.length) + manifest.stations.length) % manifest.stations.length; for (var i = 0; i < manifest.stations.length; i++) if (manifest.stations[i].id === st) return i; return 0; }

  function tune(st) {
    var my = ++token;
    loadManifest().then(function (m) {
      var i = idx(st == null ? 0 : st), S = m.stations[i];
      current = i; want = i; if (api.onchange) try { api.onchange({ station: S.id, name: S.name, dial: S.dial }); } catch (e) {}
      if (playing) { fadeOut(playing, 0.25); playing = null; }
      // the static sweep at once (cached after the first time), then the ident, then the station from the broadcast clock
      load(m.transition).then(function () { if (my === token) oneShot(m.transition, musicBus, m.files[m.transition].mixDb + 6); });
      return Promise.all([load(S.loop), load(S.ident)]).then(function () {
        if (my !== token) return;
        var t0 = ctx.currentTime + 0.55, idDur = buffers[S.ident].duration;
        oneShot(S.ident, musicBus, m.files[S.ident].mixDb + 4, t0);
        setTimeout(function () { if (my !== token) return; playing = startLoop(S.loop, musicBus, m.files[S.loop].mixDb + 4, 7 + i * 23, 1.2); }, (0.55 + idDur * 0.7) * 1000);
      });
    }).catch(function (e) { console.warn("politeRadio:", e); });
  }

  var api = {
    play: function (st) { if (typeof st === "number") want = st; ensureCtx(); whenUnlocked(function () { tune(st); }); },
    next: function () { want = want < 0 ? (current < 0 ? 0 : current + 1) : want + 1; api.play(want); },
    stop: function () { token++; pending = null; want = -1; if (playing && ctx) { fadeOut(playing, 0.4); playing = null; } current = -1; if (api.onchange) try { api.onchange({ station: null }); } catch (e) {} },
    setVolume: function (v) { volume = Math.max(0, Math.min(1, +v || 0)); if (master) master.gain.setTargetAtTime(volume, ctx.currentTime, 0.03); },
    sfx: function (id, opts) { opts = opts || {}; var stopper = { stop: function () { stopper.dead = true; } };
      ensureCtx(); whenUnlocked(function () { loadManifest().then(function (m) { return load(id).then(function () { if (stopper.dead) return; var f = m.files[id], g = (opts.db || 0) + f.mixDb;
        if (f.loop && opts.loop !== false) { var n = startLoop(id, sfxBus, g, 0, 0.3); stopper.stop = function () { fadeOut(n, 0.3); }; } else { var s = oneShot(id, sfxBus, g); stopper.stop = function () { try { s.stop(); } catch (e) {} }; } }); }).catch(function (e) { console.warn("politeRadio:", e); }); });
      return function () { stopper.stop(); }; },
    ambience: function (on) { if (!on) { if (ambLoop) { ambLoop(); ambLoop = null; } return; } if (!ambLoop) ambLoop = api.sfx("sfx-city-ambient"); },
    duck: function (on) { ducked = !!on; if (musicBus) musicBus.gain.setTargetAtTime(ducked ? 0.3 : 1, ctx.currentTime, 0.12); },
    state: function () { return { station: current >= 0 && manifest ? manifest.stations[current].id : null, volume: volume, unlocked: unlocked, format: ext }; },
    onchange: null
  };
  window.__politeRadio = api;
})();
