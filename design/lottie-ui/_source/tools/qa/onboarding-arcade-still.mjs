// lottie-ui piece 2: the stills of /onboarding/'s new arcade step (z/drive-4): the live city at the step's camera, alone
// (for reduced motion, no WebGL, or until the live city is there). DEV=desktop|pixel
import { ctxFor, sleep, closeAll, BASE } from "./lib.mjs";
import { createRequire } from "module"; const require = createRequire(import.meta.url);
const sharp = require("/Users/daniel.stoic/cromatic-lottie-ui/node_modules/sharp");
const kind = process.env.DEV || "desktop", m = kind !== "desktop";
const { page, log } = await ctxFor(kind, { consent: "no" });
await page.goto(BASE + "/onboarding/", { waitUntil: "load" }); await sleep(2000);
await page.evaluate(() => { const b = document.querySelector('[data-czl="game"]'); window.scrollTo(0, b.closest(".zstep").getBoundingClientRect().top + scrollY - innerHeight * 0.1); });
await sleep(7000);
await page.addStyleTag({ content: "main, .nav, header, footer, #cz-ck, .chapters, .st-veil, .st-poster { visibility: hidden !important; } body::before, body::after { display: none !important; }" });
await sleep(800);
const buf = await page.screenshot({ type: "png" });
const out = `/Users/daniel.stoic/cromatic-lottie-ui/site/onboarding/media/z/drive-4${m ? "-m" : ""}.webp`;
await sharp(buf).resize(m ? 780 : 1440, m ? 1688 : 900, { fit: "cover" }).webp({ quality: 72, effort: 6 }).toFile(out);
console.log("wrote", out, log.errs);
await closeAll();
