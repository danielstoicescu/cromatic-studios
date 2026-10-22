// Cromatic · stories in Lottie · story D5 (TASK-115, Iris): the map's own pins and place cards, as the site draws them
// on a phone (390 x 693 css px), at 2x of the story (1080 / 390 x 2): each pin alone on a transparent ground (its
// label, its stem, its foot: the foot is where the place is), and a few places' cards as the map opens them.
//   node capture-ui-d5.mjs <outDir>   (the stories-render-44 build on BASE)  -> pin-<id>.png, card-<id>.png, ui-d5.json
import pw from "/Users/daniel.stoic/node_modules/playwright/index.mjs";
import sharp from "/Users/daniel.stoic/cromatic-drive/node_modules/sharp/lib/index.js";
import fs from "fs";
const OUT = process.argv[2], BASE = process.env.BASE || "http://localhost:8985", DPR = (1080 / 390) * 2;
const PINS = (process.env.PINS || "steam,berero,yoshi,artisan,scf,sip,craft,oma,tac,zdrovit").split(","), CARDS = (process.env.CARDS || "berero,scf,yoshi").split(",");
fs.mkdirSync(OUT, { recursive: true });
const br = await pw.chromium.launch({ args: ["--use-angle=metal", "--ignore-gpu-blocklist"] });
const ctx = await br.newContext({ viewport: { width: 390, height: 693 }, deviceScaleFactor: DPR, isMobile: true, hasTouch: true });
await ctx.route(/google-analytics|analytics\.google|googletagmanager|doubleclick|facebook|openai/, (r) => r.fulfill({ status: 204, body: "" }));
await ctx.addInitScript(() => { const pre = { "cz-drive-guide": "2", "cz-welcome-at": String(Date.now()), "cz-map-guide": "1", "cz-intro-at": String(Date.now()), "cz-consent": "no", "cz-sound": "0" }; try { for (const k in pre) localStorage.setItem(k, pre[k]); } catch {} });
const p = await ctx.newPage();
await p.goto(BASE + "/?map", { waitUntil: "domcontentloaded" });
await p.waitForFunction(() => window.__nav2 && window.__nav2.D && window.__nav2.D.ready, null, { timeout: 180000 });
await p.waitForTimeout(3500);
const info = { dpr: DPR, pins: {}, cards: {} };
// ---- the cards first (each opened by the map itself, at its place)
for (const id of CARDS) {
  await p.evaluate((id) => window.__mapGo(id), id);
  for (let i = 0; i < 120; i++) { await p.waitForTimeout(500); if (!(await p.evaluate(() => window.__nav2.moving()))) break; }
  await p.waitForTimeout(2500);
  const c = await p.evaluate(() => { const card = document.querySelector(".map-card:not(.hidden)"); if (!card) return null; const r = card.getBoundingClientRect(); return { box: [r.x, r.y, r.width, r.height], radius: parseFloat(getComputedStyle(card).borderTopLeftRadius) || 0, title: (card.querySelector("h2,h3,b,strong") || card).textContent.trim().slice(0, 40) }; });
  if (!c) { console.log("no card for", id); continue; }
  await p.screenshot({ path: `${OUT}/_map-${id}.png` });
  const m = 3, [x, y, w, h] = c.box, X = Math.round((x - m) * DPR), Y = Math.round((y - m) * DPR), Wd = Math.round((w + 2 * m) * DPR), Hd = Math.round((h + 2 * m + 4) * DPR), rr = Math.round((c.radius + m) * DPR);
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${Wd}" height="${Hd}"><rect width="${Wd}" height="${Hd}" rx="${rr}" ry="${rr}" fill="#fff"/></svg>`);
  await sharp(`${OUT}/_map-${id}.png`).extract({ left: X, top: Y, width: Wd, height: Hd }).ensureAlpha().composite([{ input: mask, blend: "dest-in" }]).png().toFile(`${OUT}/card-${id}.png`);
  info.cards[id] = { w: Wd, h: Hd, title: c.title };
  await p.evaluate(() => { try { window.__closeAllOverlays?.(); } catch (e) {} });
  await p.waitForTimeout(800);
}
// ---- the pins: each shown alone (the city and the rest of the page hidden), on a transparent ground
await p.addStyleTag({ content: "canvas,.ui-root,.grade,.uw-veil,.gh-paper,.sk-petals,.map-card,.map-street{visibility:hidden!important} body,html{background:transparent!important} body::before,body::after{display:none!important}" });
for (const id of PINS) {
  const ok = await p.evaluate((id) => { const all = document.querySelectorAll(".map-pin"); all.forEach((e) => (e.style.visibility = "hidden")); const e = document.querySelector(`.map-pin[data-id="${id}"]`); if (!e) return false; e.classList.remove("off", "cv"); e.style.visibility = "visible"; e.style.transition = "none"; e.style.animation = "none"; e.style.opacity = "1"; e.style.transform = "translate3d(130px, 300px, 0)"; e.dataset.frozen = "1"; return true; }, id);
  if (!ok) { console.log("no pin", id); continue; }
  await p.waitForTimeout(250);
  // (the map moves its pins every frame: hold this one still while it is shot)
  await p.evaluate((id) => { const e = document.querySelector(`.map-pin[data-id="${id}"]`); const st = e.style; Object.defineProperty(st, "transform", { configurable: true, get: () => "translate3d(130px, 300px, 0px)", set: () => {} }); e.style.setProperty("transform", "translate3d(130px, 300px, 0px)", "important"); }, id);
  await p.waitForTimeout(150);
  const el = await p.$(`.map-pin[data-id="${id}"]`), bb = await el.boundingBox();
  const foot = await p.evaluate((id) => { const e = document.querySelector(`.map-pin[data-id="${id}"]`), f = e.querySelector(".mp-foot") || e, r = f.getBoundingClientRect(); return [r.x + r.width / 2, r.y + r.height / 2]; }, id);
  const pad = 8, clip = { x: bb.x - pad, y: bb.y - pad, width: bb.width + 2 * pad, height: bb.height + 2 * pad + 6 };
  await p.screenshot({ path: `${OUT}/pin-${id}.png`, omitBackground: true, clip });
  info.pins[id] = { w: Math.round(clip.width * DPR), h: Math.round(clip.height * DPR), foot: [Math.round((foot[0] - clip.x) * DPR), Math.round((foot[1] - clip.y) * DPR)] };
}
fs.writeFileSync(`${OUT}/ui-d5.json`, JSON.stringify(info, null, 1));
console.log(JSON.stringify(info));
await br.close();
