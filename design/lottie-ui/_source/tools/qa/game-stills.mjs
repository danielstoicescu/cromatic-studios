// piece 5 (TASK-009): stills of the piece over the map, frame by frame (LOCAL): each shape (wide on a laptop, tall on a
// phone upright), the game's colours and Sketchbook's, English and Romanian. The piece is mounted as game.js mounts it
// (one canvas pixel a CSS pixel, from the 2M2F button or the middle) and held at a few frames: the way in, the loading
// loop, the way out. Writes <Q>/gs-<shape>-<theme>-<lang>.jpg (a strip of the frames)
import { ctxFor, waitMap, sleep, closeAll, BASE, Q } from "./lib.mjs";
import sharp from "sharp";
const FR = (process.env.FR || "6,14,22,30,60,100,106,112").split(",").map(Number);
for (const [dev, shape] of [["desktop", "wide"], ["iphone", "tall"]]) {
  for (const theme of (process.env.THEMES || "light,sketch").split(",")) {
    for (const lang of (process.env.LANGS || "en,ro").split(",")) {
      const ls = { "cz-drive-guide": "2", "cz-welcome-at": String(Date.now()), "cz-map-guide": "1", "cz-intro-at": String(Date.now()), "cz-consent": "no" };
      if (lang === "ro") ls["cz-lang"] = "ro";
      const { page, ctx } = await ctxFor(dev, { ls });
      await page.goto(BASE + "/?map", { waitUntil: "domcontentloaded" }); await waitMap(page, 90000); await sleep(2500);
      if (theme === "sketch") { await page.evaluate(() => window.__scheme("sketch")); await sleep(3500); }
      const files = [];
      for (const f of FR) {
        await page.evaluate(async ({ f, shape, theme }) => {
          document.querySelectorAll(".czl-game").forEach((e) => e.remove());
          const b = document.querySelector(".map-top .map-2m2f"), r = b && b.getBoundingClientRect();
          const name = "game-" + shape + (theme === "sketch" ? "-sketch" : "");
          const p = await window.czL.mount(name, { full: true, k: 1, cls: "czl-game", patch: (d) => d });
          window.__gp = p; p.at(f);
        }, { f, shape, theme });
        await sleep(700);
        const file = `${Q}/gs-tmp-${f}.png`; await page.screenshot({ path: file }); files.push(file);
      }
      // a strip: the frames side by side, small
      const w = shape === "wide" ? 480 : 195, h = shape === "wide" ? 300 : 422;
      const tiles = await Promise.all(files.map((f) => sharp(f).resize(w, h).toBuffer()));
      const cols = 4, rows = Math.ceil(tiles.length / cols);
      await sharp({ create: { width: w * cols, height: h * rows, channels: 3, background: "#ffffff" } }).composite(tiles.map((t, i) => ({ input: t, left: (i % cols) * w, top: Math.floor(i / cols) * h }))).jpeg({ quality: 78 }).toFile(`${Q}/gs-${shape}-${theme}-${lang}.jpg`);
      console.log("wrote", `gs-${shape}-${theme}-${lang}.jpg`, await page.evaluate(() => document.documentElement.lang + " " + (window.czL.ro() ? "ro" : "en")));
      await ctx.close();
    }
  }
}
await closeAll();
