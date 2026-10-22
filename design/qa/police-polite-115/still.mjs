// TASK-115: the Patrol in the onboarding showroom, as /onboarding/ asks its city frame for it (the frame needs a parent:
// a page of the same origin hosts it). The showroom keeps turning: of N frames the one closest to REF is kept.
//   BASE=http://localhost:8995 OUT=dir TAG=after KIND=desktop|phone REF=old.webp node still.mjs
import fs from "fs";
import sharp from "/Users/daniel.stoic/cromatic-drive/node_modules/sharp/lib/index.js";
import { open } from "./lib.mjs";
const { BASE, OUT, TAG = "still", KIND = "desktop", REF } = process.env; fs.mkdirSync(OUT, { recursive: true });
const mob = KIND === "phone", { br, p, errs } = await open(KIND);
await p.goto(BASE + "/404.html", { waitUntil: "domcontentloaded" });
await p.evaluate(() => { document.documentElement.innerHTML = '<body style="margin:0;overflow:hidden;background:#ECEAE3"><iframe src="/?map&nointro&onb" style="position:fixed;inset:0;width:100vw;height:100vh;border:0"></iframe></body>'; });
const fr = () => p.frames().find((f) => f !== p.mainFrame() && /[?]map/.test(f.url()));
for (let i = 0; i < 360 && !(fr() && (await fr().evaluate(() => !!window.__onb).catch(() => false))); i++) await p.waitForTimeout(500);
const F = fr(); await p.waitForTimeout(8000);
await F.evaluate(() => { window.__onb({ op: "mode", map: true }); window.__onb({ op: "scheme", id: "monument", ride: false }); window.__onb({ op: "veh", id: "cop" }); });
await p.waitForTimeout(2500);
await F.evaluate((s) => window.__onb(s), { op: "show", on: true, bg: "#ECEAE3", fill: mob ? 1.75 : 1.5, ay: mob ? -0.03 : -0.16, ax: mob ? 0 : 0.2, turn: 0 });
await p.waitForTimeout(2500);
const small = (b) => sharp(b).resize(180, mob ? 390 : 112, { fit: "fill" }).greyscale().raw().toBuffer();
const ref = REF ? await small(fs.readFileSync(REF)) : null;
let best = null;
for (let i = 0; i < (+process.env.N || 60); i++) { const b = await p.screenshot(); if (ref) { const a = await small(b); let d = 0; for (let k = 0; k < a.length; k++) d += (a[k] - ref[k]) ** 2; if (!best || d < best.d) best = { d, b }; } else if (!best) best = { b }; await p.waitForTimeout(250); }
fs.writeFileSync(`${OUT}/${TAG}-${KIND}.png`, best.b);
console.log(TAG, KIND, "errors", errs.length, errs.slice(0, 2));
await br.close();
