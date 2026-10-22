// TASK-115: the garage (the map's ride menu, open, the Patrol picked) and the chase banner, on one build
//   BASE=http://localhost:8995 OUT=dir TAG=after node garage.mjs
import fs from "fs";
import { open } from "./lib.mjs";
const { BASE, OUT, TAG } = process.env; fs.mkdirSync(OUT, { recursive: true });
const { br, p, errs } = await open("desktop");
await p.goto(BASE + "/?map", { waitUntil: "domcontentloaded" });
await p.waitForFunction(() => window.__nav2 && window.__nav2.D && window.__nav2.D.ready, null, { timeout: 180000 });
await p.waitForTimeout(4000);
await p.evaluate(() => window.__api.setVehicle("cop")); await p.waitForTimeout(2500);
await p.evaluate(() => { const b = [...document.querySelectorAll(".map-ride")].find((x) => x.offsetParent); b && b.click(); }); await p.waitForTimeout(2500);
const open1 = await p.evaluate(() => { const r = document.querySelector(".map-rides"); return r && !r.classList.contains("hidden") && r.getBoundingClientRect().height > 0; });
await p.screenshot({ path: `${OUT}/${TAG}-garage.png` });
const names = await p.evaluate(() => [...document.querySelectorAll(".map-rides [data-v]")].map((b) => b.textContent.trim().replace(/✓$/, "")).filter(Boolean));
await p.evaluate(() => document.querySelector(".map-rides")?.classList.add("hidden")); await p.waitForTimeout(600);
// the chase banner (drive mode only): shown where it would be, for the picture
await p.evaluate(() => { const c = document.querySelector(".n2-cop"); if (!c) return; c.classList.add("on"); document.body.appendChild(c); c.style.cssText += ";display:flex!important;opacity:1!important;visibility:visible!important;transform:none!important;position:fixed!important;top:120px!important;left:610px!important;z-index:999999!important"; });
await p.waitForTimeout(800);
const box = await p.evaluate(() => { const c = document.querySelector(".n2-cop"); if (!c) return null; const r = c.getBoundingClientRect(); return [r.left, r.top, r.width, r.height, c.innerText.replace(/\s+/g, " ").trim()]; });
if (box && box[2] > 0) await p.screenshot({ path: `${OUT}/${TAG}-chase-banner.png`, clip: { x: Math.max(0, box[0] - 24), y: Math.max(0, box[1] - 24), width: box[2] + 48, height: box[3] + 48 } });
console.log(TAG, "menu open:", open1, "rides:", JSON.stringify(names), "banner:", JSON.stringify(box), "errors:", errs.length, errs.slice(0, 3));
await br.close();
