// Cromatic · story P1 v2: the map's own interface (normal mode, a phone, 1080 x 1920) captured alone (transparent), with
// the view switch's Postcard button rect: the first tap of the film. LOCAL ONLY.   BASE=http://localhost:8796 node _source/p1-ui-map.mjs
import pw from "/Users/daniel.stoic/node_modules/playwright/index.mjs";
import fs from "fs";
import path from "path";
const HERE = path.resolve(new URL("..", import.meta.url).pathname), BASE = process.env.BASE || "http://localhost:8796", O = path.join(HERE, "out/p1");
const br = await pw.chromium.launch({ args: ["--use-angle=metal", "--ignore-gpu-blocklist"] });
const ctx = await br.newContext({ viewport: { width: 390, height: 693 }, deviceScaleFactor: 1080 / 390, isMobile: true, hasTouch: true });
await ctx.addInitScript(() => { const pre = { "cz-drive-guide": "2", "cz-welcome-at": String(Date.now()), "cz-map-guide": "1", "cz-intro-at": String(Date.now()), "cz-consent": "no", "cz-sound": "0" }; try { for (const k in pre) localStorage.setItem(k, pre[k]); } catch {} });
const p = await ctx.newPage();
await p.goto(BASE + "/?map", { waitUntil: "domcontentloaded" });
await p.waitForFunction(() => window.__nav2 && window.__nav2.D && window.__nav2.D.ready, null, { timeout: 180000 });
await p.waitForTimeout(6000);
const D = 1080 / 390;
const r = await p.evaluate((D) => { const b = [...document.querySelectorAll("button,[role=button],a")].find((e) => (e.getAttribute("aria-label") || "") === "Postcard" || (/^postcard$/i.test((e.textContent || "").trim()) && e.offsetParent)); if (!b) return null; const q = b.getBoundingClientRect(); return [q.x * D, q.y * D, q.width * D, q.height * D].map(Math.round); }, D);
await p.screenshot({ path: path.join(O, "ui-M-full.png") });
await p.evaluate(() => { for (const c of document.querySelectorAll("canvas")) c.style.visibility = "hidden"; document.documentElement.style.background = "transparent"; document.body.style.background = "transparent"; });
await p.waitForTimeout(250);
await p.screenshot({ path: path.join(O, "ui-M.png"), omitBackground: true });
const st = JSON.parse(fs.readFileSync(path.join(O, "ui-states.json"), "utf8")); st.postcardBtn = r; fs.writeFileSync(path.join(O, "ui-states.json"), JSON.stringify(st, null, 1));
console.log("postcard btn", JSON.stringify(r));
await br.close();
