// lottie-ui piece 3: preview MP4s, frame-exact over stills of the real site:
//   case-<ab>.mp4  the map's place card -> the case page (the window closes onto the map, opens onto the page), and back
//   site-<ab>.mp4  the map -> the website (the paper closes in round the pill; the page opens out of it), CSS stepped
import fs from "fs";
import { execFileSync } from "child_process";
const R = "/Users/daniel.stoic/cromatic-lottie-ui", OUT = `${R}/design/lottie-ui/3-transitions`, BG = "/design/lottie-ui/_source/tools/bg";
fs.mkdirSync(OUT, { recursive: true });
const run = (o) => execFileSync("node", [`${process.env.HOME}/.x-lui-render.mjs`, JSON.stringify(o)], { stdio: "inherit" });
const css = fs.readFileSync(`${R}/src/lottie-ui/pt.css`, "utf8");
for (const ab of ["desktop", "phone"]) {
  const vp = ab === "phone" ? "pixel" : "desktop", j = `/src/lottie-ui/window-${ab}.json`;
  run({ j, bg: `${BG}/pt-map-${ab}.jpg`, full: 1, vp, pre: 24, seq: [[0, 22], [23, 58], { hold: 50, at: 58 }, [0, 22], [23, 58]], hold: 36,
    events: [[22, `window.setBg('${BG}/pt-case-${ab}.jpg')`], [22 + 36 + 50 + 23, `window.setBg('${BG}/pt-map-${ab}.jpg')`]], out: `${OUT}/case-${ab}.mp4` });
  const ov = (c) => `<div class="czpt ${c}"><i class="czpt-hole"></i><i class="czpt-body"></i><i class="czpt-ring"></i></div>`;
  run({ j, bg: `${BG}/pt-map-${ab}.jpg`, full: 1, vp, steps: 1, dom: { html: "", css }, pre: 20, seq: [{ hold: 130, at: 0 }], hold: 0,
    events: [[0, `window.layer(${JSON.stringify(ov("czpt-leave"))})`], [44, `(() => { window.setBg('${BG}/pt-site-${ab}.jpg'); window.layer(${JSON.stringify(ov("czpt-arrive"))}); })()`]], out: `${OUT}/site-${ab}.mp4` });
}
