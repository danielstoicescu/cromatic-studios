// piece 5 (TASK-009): the colours of the way in, taken from the game itself. The game's first screen is shot at each of
// the piece's two shapes (wide 1440x900: its splash; tall 390x840, a phone upright: its "rotate your phone" screen) and
// brought down to the piece's grid of blocks (24x15, 13x28), each block the average of what it covers: the pixels the
// screen breaks into on the way in are the splash's own, so their going reads as the picture coming into focus.
//   BASE=http://localhost:<port> node tools/game-mosaic.mjs   (a local build of the site) -> pieces/game-mosaic.json
// Run it again when the splash changes (src/minigame.js splashArt).
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import pw from "playwright";
import sharp from "sharp";
import { GAB } from "../pieces/game.mjs";

const here = path.dirname(fileURLToPath(import.meta.url)), BASE = process.env.BASE || "http://localhost:8955";
const out = {};
const br = await pw.chromium.launch({ args: ["--use-angle=metal"] });
for (const [ab, A] of Object.entries(GAB)) {
  const tall = ab === "tall";
  const ctx = await br.newContext({ viewport: { width: A.W, height: A.H }, deviceScaleFactor: 1, isMobile: tall, hasTouch: tall });
  await ctx.addInitScript(() => { try { localStorage.setItem("cz-consent", "no"); } catch (e) {} });
  const page = await ctx.newPage();
  await page.goto(BASE + "/play/gloves/?embed=1");
  await page.waitForFunction(() => window.czGloves && window.czGloves.ready && window.czGloves.ready(), null, { timeout: 30000 });
  await page.waitForTimeout(1500);
  // the screen without its buttons (the map's frame has its own ×; the game's speaker, MAP, FULL SCREEN are small)
  await page.addStyleTag({ content: ".mg-back, .mg-fs, .mg-snd, .mg-hint, .mg-btns, .mg-dpad, .mg-menu, .mg-ck { visibility: hidden !important; }" });
  await page.waitForTimeout(300);
  const png = await page.screenshot();
  const cols = Math.round(A.W / A.B), rows = Math.round(A.H / A.B);
  const raw = await sharp(png).resize(cols, rows, { fit: "fill", kernel: "cubic" }).removeAlpha().raw().toBuffer();
  const c = [];
  for (let i = 0; i < cols * rows; i++) c.push("#" + [raw[i * 3], raw[i * 3 + 1], raw[i * 3 + 2]].map((v) => v.toString(16).padStart(2, "0")).join(""));
  out[ab] = { cols, rows, c };
  console.log(ab, cols + "x" + rows);
  await ctx.close();
}
await br.close();
fs.writeFileSync(path.join(here, "../pieces/game-mosaic.json"), JSON.stringify(out));
