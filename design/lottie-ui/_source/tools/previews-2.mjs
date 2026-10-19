// lottie-ui piece 2: preview MP4s of /onboarding/'s explainers, frame-exact, each in its card over a still of the page
// (design/lottie-ui/_source/tools/bg/onb-*), then joined: design/lottie-ui/2-onboarding/onboarding-{desktop,phone}.mp4
// and one clip per explainer (and the game in Romanian on the phone)
import fs from "fs";
import { execFileSync } from "child_process";
const R = "/Users/daniel.stoic/cromatic-lottie-ui", OUT = `${R}/design/lottie-ui/2-onboarding`, BG = "/design/lottie-ui/_source/tools/bg";
const FF = "/Users/daniel.stoic/Library/Python/3.9/lib/python/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1";
fs.mkdirSync(OUT, { recursive: true });
const run = (o) => execFileSync("node", [`${process.env.HOME}/.x-lui-render.mjs`, JSON.stringify(o)], { stdio: "inherit" });
const LOOPS = { drive: 330, views: 300, places: 330, worlds: 300, game: 300 };
for (const ab of ["desktop", "phone"]) {
  const rects = JSON.parse(fs.readFileSync(`${R}/design/lottie-ui/_source/tools/bg/onb-rects-${ab}.json`, "utf8")), parts = [];
  const name = (k) => ({ drive: `onb-drive-${ab === "phone" ? "stick" : "keys"}-light`, views: `onb-views-${ab === "phone" ? "tap" : "key"}-light`, places: "onb-places-light", game: "onb-game-light-en", worlds: "onb-worlds-dark" })[k];
  for (const k of ["drive", "views", "places", "game", "worlds"]) {
    const r = rects[k]; if (!r || !r.w) continue;
    const out = `${OUT}/${k}-${ab}.mp4`;
    run({ j: `/src/lottie-ui/${name(k)}.json`, ...(k === "worlds" ? { atlas: "/src/intro/worlds-phone.webp" } : {}), bg: `${BG}/onb-${k}-${ab}.jpg`, x: r.x, y: r.y, w: r.w, vp: ab === "phone" ? "pixel" : "desktop", frames: [0, LOOPS[k] - 1], out });
    parts.push(out);
  }
  if (ab === "phone") { const r = rects.game; run({ j: "/src/lottie-ui/onb-game-light-ro.json", bg: `${BG}/onb-game-${ab}.jpg`, x: r.x, y: r.y, w: r.w, vp: "pixel", frames: [0, 299], out: `${OUT}/game-ro-phone.mp4` }); }
  const list = `${OUT}/.list-${ab}.txt`; fs.writeFileSync(list, parts.map((p) => `file '${p}'`).join("\n"));
  execFileSync(FF, ["-y", "-loglevel", "error", "-f", "concat", "-safe", "0", "-i", list, "-c", "copy", `${OUT}/onboarding-${ab}.mp4`]); fs.rmSync(list);
  console.log("joined", `${OUT}/onboarding-${ab}.mp4`);
}
