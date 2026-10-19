import pw from "playwright";
const D = process.argv[2];
const br = await pw.chromium.launch({ args: ["--use-angle=metal", "--allow-file-access-from-files"] });
const p = await br.newPage({ viewport: { width: 1440, height: 400 }, deviceScaleFactor: 1 });
await p.goto("http://localhost:8574/parity.html"); await p.waitForFunction(() => window.done, null, { timeout: 10000 });
await p.waitForTimeout(300); await p.screenshot({ path: D + "/parity.png" }); await br.close();
