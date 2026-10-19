// does Chromium's CPU throttling (CDP Emulation.setCPUThrottlingRate) slow Web Workers too, or only the main thread?
import pw from "playwright";
const br = await pw.chromium.launch({ args: ["--use-angle=metal"] });
for (const rate of [1, 4]) {
  const ctx = await br.newContext(); const p = await ctx.newPage(); const cdp = await ctx.newCDPSession(p);
  await p.goto("http://localhost:8576/throttle.html");
  if (rate > 1) await cdp.send("Emulation.setCPUThrottlingRate", { rate });
  const r1 = await p.evaluate(() => window.run()), r2 = await p.evaluate(() => window.run());
  console.log("rate", rate, JSON.stringify(r1), JSON.stringify(r2));
  await ctx.close();
}
await br.close();
