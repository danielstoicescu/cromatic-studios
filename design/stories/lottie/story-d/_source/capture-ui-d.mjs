// Cromatic · stories in Lottie · story D (TASK-066): the site's own UI for the portfolio beat, from the local build on a
// phone (390 x 693 css px at 1080 / 390: a 1080 x 1920 screen): The Aesthetic Court's place card on the map (the card
// alone, its corners cut round; where its "Go deeper" button is), the case page as the map opens it (the frame's
// Share and close buttons over the page's first screen), and the page itself, tall, for the scroll.
//   node capture-ui-d.mjs <RAW>
import pw from "/Users/daniel.stoic/node_modules/playwright/index.mjs";
import sharp from "/Users/daniel.stoic/cromatic-drive/node_modules/sharp/lib/index.js";
import fs from "fs";
const RAW = process.argv[2] || "/private/tmp/claude-501/-Users-daniel-stoic/307623b0-7c3c-4b30-b2d7-c12e0dda2036/scratchpad/sd/raw";
const BASE = process.env.BASE || "http://localhost:8991", PLACE = process.env.PLACE || "tac", SLUG = process.env.SLUG || "the-aesthetic-court", LANG = process.env.LANG2 || "en";
const DPR = 1080 / 390;
fs.mkdirSync(RAW, { recursive: true });
const br = await pw.chromium.launch({ args: ["--use-angle=metal", "--ignore-gpu-blocklist"] });
const ctx = await br.newContext({ viewport: { width: 390, height: 693 }, deviceScaleFactor: DPR, isMobile: true, hasTouch: true });
await ctx.route(/google-analytics|analytics\.google|googletagmanager|doubleclick|facebook|openai/, (r) => r.fulfill({ status: 204, body: "" }));
await ctx.addInitScript((lang) => { const pre = { "cz-drive-guide": "2", "cz-welcome-at": String(Date.now()), "cz-map-guide": "1", "cz-intro-at": String(Date.now()), "cz-consent": "no", "cz-sound": "0", ...(lang === "ro" ? { "cz-lang": "ro" } : {}) }; try { for (const k in pre) localStorage.setItem(k, pre[k]); } catch {} }, LANG);
const p = await ctx.newPage();
await p.goto(BASE + "/?map", { waitUntil: "domcontentloaded" });
await p.waitForFunction(() => window.__nav2 && window.__nav2.D && window.__nav2.D.ready, null, { timeout: 180000 });
await p.waitForTimeout(3000);
await p.evaluate((id) => window.__mapGo(id), PLACE);
for (let i = 0; i < 120; i++) { await p.waitForTimeout(500); if (!(await p.evaluate(() => window.__nav2.moving()))) break; }
await p.waitForTimeout(3000);
// the card: its box, its radius, the button's box (css px)
const info = await p.evaluate(() => {
  const b = document.querySelector(".map-card:not(.hidden) .mcd-open"), card = b.closest(".map-card");
  const r = card.getBoundingClientRect(), rb = b.getBoundingClientRect(), cs = getComputedStyle(card);
  return { card: [r.x, r.y, r.width, r.height], radius: parseFloat(cs.borderTopLeftRadius) || 0, btn: [rb.x, rb.y, rb.width, rb.height], btnRadius: parseFloat(getComputedStyle(b).borderTopLeftRadius) || 0, label: b.textContent.trim() };
});
await p.screenshot({ path: `${RAW}/ui-map-${LANG}.png` });
// the card cut out (a little margin for its outline and shadow), its corners masked round
{
  const m = 3, [x, y, w, h] = info.card, X = Math.round((x - m) * DPR), Y = Math.round((y - m) * DPR), Wd = Math.round((w + 2 * m) * DPR), Hd = Math.round((h + 2 * m + 4) * DPR);
  const rr = Math.round((info.radius + m) * DPR);
  const mask = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${Wd}" height="${Hd}"><rect x="0" y="0" width="${Wd}" height="${Hd}" rx="${rr}" ry="${rr}" fill="#fff"/></svg>`);
  await sharp(`${RAW}/ui-map-${LANG}.png`).extract({ left: X, top: Y, width: Wd, height: Hd }).ensureAlpha().composite([{ input: mask, blend: "dest-in" }]).png().toFile(`${RAW}/ui-card-${LANG}.png`);
  info.cardPx = [X, Y, Wd, Hd]; info.btnPx = info.btn.map((v) => v * DPR);
}
// the case page as the map opens it (tap "Go deeper"; the pill has run once it settles)
await p.tap(".map-card:not(.hidden) .mcd-open");
await p.waitForTimeout(4500);
await p.screenshot({ path: `${RAW}/ui-opened-${LANG}.png` });
info.src = await p.evaluate(() => { const f = document.querySelector(".case-frame iframe, .cf-iframe"); return f && f.getAttribute("src"); });
info.frameButtons = await p.evaluate(() => [".cf-share", ".cf-close"].map((q) => { const e = document.querySelector(q); if (!e) return null; const r = e.getBoundingClientRect(); return [r.x, r.y, r.width, r.height]; }));
// the page itself, tall (the embed the frame loads), its lazy pictures in first
const pg = await ctx.newPage();
await pg.goto(BASE + (info.src || `/work/${SLUG}/?embed=1`), { waitUntil: "networkidle" });
await pg.waitForTimeout(1200);
await pg.evaluate(async () => { for (let y = 0; y < Math.min(document.body.scrollHeight, 9000); y += 400) { window.scrollTo(0, y); await new Promise((r) => setTimeout(r, 160)); } window.scrollTo(0, 0); });
await pg.waitForTimeout(1500);
// (the top 3040 css px: a whole page at this density is past what a screenshot can hold)
const sh = await pg.evaluate(() => Math.max(document.documentElement.scrollHeight, document.body.scrollHeight));
await pg.screenshot({ path: `${RAW}/ui-page-${LANG}.png`, fullPage: true, clip: { x: 0, y: 0, width: 390, height: Math.min(sh, 3040) } });
const meta = await sharp(`${RAW}/ui-page-${LANG}.png`).metadata(), HH = meta.height;
// the headings' places on the page (for where the scroll lands)
info.heads = await pg.evaluate(() => [...document.querySelectorAll("h1, h2, h3, figure, img")].slice(0, 40).map((e) => { const r = e.getBoundingClientRect(); return [e.tagName, (e.textContent || e.alt || "").trim().slice(0, 30), Math.round(r.y + scrollY), Math.round(r.height)]; }));
info.pageH = HH;
fs.writeFileSync(`${RAW}/ui-${LANG}.json`, JSON.stringify(info, null, 1));
console.log(JSON.stringify({ card: info.card, btn: info.btn, label: info.label, pageH: HH, full: meta.height }));
await br.close();
