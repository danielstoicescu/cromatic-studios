// pill-stab (stack-378): the pill measured in the page (WebKit or Chromium): per open and close, the moments (ring, grow,
// open done; close run, frame hidden, ring gone), main-thread frames and gaps, and the city's own frames
// (__perfLab.info().frame) at each moment: is it drawing during the open's wait and grow, and again before the close
// runs? Three rounds: a first (cold) open, then two more; closes by Escape and by the x. DEV=iphone|pixel THR=4
import { ctxFor, waitMap, sleep, closeAll, BASE } from "./lib.mjs";
const kind = process.env.DEV || "iphone";
const { page, ctx, log } = await ctxFor(kind, { consent: "yes2" });
await ctx.addInitScript(() => {
  const P = (window.__pp = { ev: [], fr: [] });
  const cf = () => { try { return window.__perfLab ? window.__perfLab.info().frame : -1; } catch (e) { return -1; } };
  P.mark = (k) => P.ev.push([k, Math.round(performance.now()), cf()]);
  const loop = (t) => { P.fr.push(t); requestAnimationFrame(loop); }; requestAnimationFrame(loop);
  addEventListener("DOMContentLoaded", () => {
    new MutationObserver((ms) => { for (const m of ms) {
      for (const n of m.addedNodes || []) if (n.classList && n.classList.contains("czpf")) P.mark("ring+");
      for (const n of m.removedNodes || []) if (n.classList && n.classList.contains("czpf")) P.mark("ring-");
      if (m.type === "attributes" && m.target.classList && m.target.classList.contains("case-frame")) { const c = m.target.classList; const s = (c.contains("czpf-run") ? "run" : "") + (c.contains("hidden") ? "hidden" : ""); if (s !== P.last) { P.last = s; P.mark("frame:" + (s || "shown")); } }
    } }).observe(document.body, { childList: true, subtree: true, attributes: true, attributeFilter: ["class"] });
  });
});
await page.goto(BASE + "/?map", { waitUntil: "domcontentloaded" }); await waitMap(page); await sleep(3000);
if (process.env.THR && kind !== "iphone") { const c = await ctx.newCDPSession(page); await c.send("Emulation.setCPUThrottlingRate", { rate: +process.env.THR }); }
await page.evaluate(() => window.__mapGo("steam"));
for (let i = 0; i < 100; i++) { await sleep(500); if (await page.evaluate(() => !!document.querySelector(".map-card:not(.hidden) .mcd-open"))) break; }
await sleep(2500);
const read = async (t0) => page.evaluate((t0) => { const P = window.__pp; const ev = P.ev.filter((e) => e[1] >= t0); const fr = P.fr.filter((t) => t >= t0); const gaps = []; for (let i = 1; i < fr.length; i++) if (fr[i] - fr[i - 1] > 50) gaps.push(Math.round(fr[i] - fr[i - 1])); return { ev, frames: fr.length, gaps }; }, t0);
const fmt = (r, t0, c0) => r.ev.map((e) => `${e[0]}@${e[1] - t0}ms(city+${e[2] - c0})`).join("  ");
for (let round = 0; round < 3; round++) {
  const o = await page.evaluate(() => { const t = Math.round(performance.now()); window.__pp.last = "hidden"; window.__pp.mark("tap"); document.querySelector(".map-card:not(.hidden) .mcd-open").click(); return { t, c: window.__perfLab.info().frame }; });
  await sleep(2600);
  await page.evaluate(() => window.__pp.mark("end"));
  console.log("   after the open:", JSON.stringify(await page.evaluate(() => { const f = document.querySelector(".case-frame"); return { anims: f.getAnimations().length, sub: f.getAnimations({ subtree: true }).length, op: f.style.opacity, clip: f.style.clipPath, cls: f.className, style: f.getAttribute("style") }; })));
  const ro = await read(o.t);
  const done = ro.ev.find((e) => e[0] === "ring-"), dms = done ? done[1] - o.t : null;
  console.log(`open ${round ? "again" : "cold "}: ${fmt(ro, o.t, o.c)} | main frames ${ro.frames} in 2.6 s, gaps>50ms [${ro.gaps.join(",")}]`);
  await sleep(1200);
  const how = round === 1 ? "x" : "Escape";
  const c = await page.evaluate(() => { const t = Math.round(performance.now()); window.__pp.mark("close"); return { t, c: window.__perfLab.info().frame }; });
  if (how === "x") await page.evaluate(() => document.querySelector(".case-frame .cf-close").click()); else await page.keyboard.press("Escape");
  await sleep(1500);
  const rc = await read(c.t);
  console.log(`close (${how}): ${fmt(rc, c.t, c.c)} | main frames ${rc.frames} in 1.5 s, gaps>50ms [${rc.gaps.join(",")}]`);
  await sleep(1500);
}
console.log("errors:", log.errs.slice(0, 4), "bad:", log.bad.slice(0, 3));
await closeAll();
