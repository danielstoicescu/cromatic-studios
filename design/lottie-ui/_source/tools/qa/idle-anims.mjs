import { ctxFor, waitMap, sleep, closeAll, BASE } from "./lib.mjs";
for (const kind of ["pixel", "desktop"]) for (const off of [false, true]) {
  const { page, ctx } = await ctxFor(kind, { consent: "yes2" });
  if (off) await ctx.addInitScript(() => { window.__czL = false; });
  await page.goto(BASE + "/?map", { waitUntil: "domcontentloaded" }); await waitMap(page); await sleep(6000);
  const r = await page.evaluate(() => document.getAnimations().filter((a) => a.playState === "running").map((a) => (a.animationName || a.id || "waapi") + "@" + ((a.effect && a.effect.target && (a.effect.target.className || a.effect.target.tagName)) + "").slice(0, 30) + (a.effect && a.effect.pseudoElement ? a.effect.pseudoElement : "")));
  console.log(kind, off ? "OFF" : "ON ", r.length, JSON.stringify(r.slice(0, 12)));
  await ctx.close();
}
await closeAll();
