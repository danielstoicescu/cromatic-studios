// Cromatic · metro mockups (TASK-062): stills of a piece at given frames (QA), from the stage.
//   node frames.mjs <json url> <outPrefix> <frame,frame,...> [W H]
import pw from "/Users/daniel.stoic/node_modules/playwright/index.mjs";
const [j, out, list, W = 1920, H = 1080] = process.argv.slice(2);
const br = await pw.chromium.launch({ args: ["--use-angle=metal", "--ignore-gpu-blocklist"] });
const p = await br.newPage({ viewport: { width: +W, height: +H } });
p.on("pageerror", (e) => console.log("pageerror", e.message));
await p.goto(`http://127.0.0.1:${process.env.PORT || 8965}/design/metro-mockup/_source/stage.html?j=${encodeURIComponent(j)}`);
await p.waitForFunction(() => window.ready, null, { timeout: 60000 });
for (const fr of list.split(",").map(Number)) { await p.evaluate((fr) => window.go(fr), fr); await p.waitForTimeout(50); await p.screenshot({ path: `${out}-${fr}.jpg`, type: "jpeg", quality: 88 }); }
await br.close();
