// lottie-ui piece 1: the preview MP4s (frame-exact composites over stills of the real site; the end card is the site's
// own markup and CSS, its animations stepped with the frames). Writes design/lottie-ui/1-finale/*.mp4
import fs from "fs";
import { execFileSync } from "child_process";
const R = "/Users/daniel.stoic/cromatic-lottie-ui", OUT = `${R}/design/lottie-ui/1-finale`, BG = "/design/lottie-ui/_source/tools/bg";
const FF = "/Users/daniel.stoic/Library/Python/3.9/lib/python/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1";
const run = (o) => execFileSync("node", [`${process.env.HOME}/.x-lui-render.mjs`, JSON.stringify(o)], { stdio: "inherit" });
const only = process.argv[2] || "";
// the end card: its rules from the site's styles and the Lottie layer's
const css = fs.readFileSync(`${R}/src/styles.css`, "utf8").split("\n").filter((l) => /^(\.flight-end|\.fe-)/.test(l)).join("\n")
  + "\n" + fs.readFileSync(`${R}/src/lottie-ui/czl.css`, "utf8")
  + `\n@font-face{font-family:CromaticSans;font-weight:700 900;src:url(/site/fonts/google-sans-latin.woff2) format("woff2")}@font-face{font-family:CromaticSans;font-weight:700 900;src:url(/site/fonts/google-sans-latin-ext.woff2) format("woff2");unicode-range:U+0100-024F}
  .flight-end button{font-family:CromaticSans,sans-serif}`;
const card = (ro) => {
  const c = ro ? { b: "Ne vedem la bord.", s: "Cartea ta de îmbarcare e la noi. Îți răspundem într-o zi lucrătoare.", save: "⬇ Salvează cartea de îmbarcare", replay: "↻ Ia harta de la capăt", map: "Înapoi la hartă" } : { b: "See you on board.", s: "Your boarding pass is with us. We write back within one working day.", save: "⬇ Save my boarding pass", replay: "↻ Start over on the map", map: "Back to the map" };
  return `<div class="flight-end fe-pol fe-wait"><b>${c.b.split("").map((ch, i) => (ch === " " ? " " : `<i class="fe-l" style="--i:${i}">${ch}</i>`)).join("")}</b><span>${c.s}</span><button class="fe-save">${c.save}</button><button class="fe-replay">${c.replay}</button><button class="fe-map">${c.map}</button></div>`;
};
for (const ab of ["desktop", "phone"]) {
  const vp = ab === "phone" ? "pixel" : "desktop";
  if (!only || only === "stamp") for (const lang of ab === "phone" ? ["en", "ro"] : ["en"]) {
    // the stamp: where the site puts it on this pass (measured by the flow test: laptop stub band, phone right of the chips)
    const at = ab === "desktop" ? { x: 1011, y: 446, w: 333 } : { x: 280, y: 387, w: 273 };
    run({ j: `/src/lottie-ui/stamp-${lang}.json`, bg: `${BG}/pass-${ab}.jpg`, ...at, vp, frames: [0, 45], pre: 24, hold: 70, out: `${OUT}/stamp-${lang}-${ab}.mp4` });
  }
  if (!only || only === "clouds") for (const lang of ["en", "ro"]) {
    if (lang === "ro" && ab === "desktop") continue;
    run({
      j: `/src/lottie-ui/finale-${ab}.json`, bg: `${BG}/climb-${ab}.jpg`, full: 1, vp, steps: 1, dom: { html: card(lang === "ro"), css },
      // the climb into the clouds, the sky with the end card, a moment, Back to the map: down through them onto the map
      // (the clock counts the frames after the pre-roll: 0-30 in, 31-160 reveal, a held moment, 170-200 down, 201-246 up)
      seq: [[0, 30], [31, 160], { hold: 50, at: 160 }, [170, 200], [201, 246]], pre: 16, hold: 30,
      events: [[30, "window.setBg('" + BG + "/sky-" + ab + ".jpg')"], [30 + 14, "document.querySelector('.flight-end').classList.replace('fe-wait','fe-in')"],
        [31 + 130 + 50, "(() => { const e = document.querySelector('.flight-end'); for (const a of e.getAnimations({ subtree: true })) a.cancel(); e.classList.replace('fe-in','fe-out'); })()"],
        [31 + 130 + 50 + 31, "(() => { document.querySelector('.flight-end').remove(); window.setBg('" + BG + "/back-" + ab + ".jpg'); })()"]],
      out: `${OUT}/clouds-${lang}-${ab}.mp4`
    });
  }
}
