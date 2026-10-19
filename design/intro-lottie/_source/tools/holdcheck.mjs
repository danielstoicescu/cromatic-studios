// the hold must loop without a jump: its first frame and its end frame must render (nearly) the same
import pw from "playwright";
import { createRequire } from "module";
const sharp = createRequire(import.meta.url)("/Users/daniel.stoic/cromatic-drive/node_modules/sharp");
const diff = async (a, b) => { const A = await sharp(a).raw().toBuffer(), B = await sharp(b).raw().toBuffer(); let n = 0, mx = 0; for (let i = 0; i < A.length; i++) { const d = Math.abs(A[i] - B[i]); if (d > 24) n++; if (d > mx) mx = d; } return { px: Math.round(n / 3), mx }; };
const br = await pw.chromium.launch({ args: ["--use-angle=metal"] });
for (const d of ["A", "B", "C"]) for (const ab of ["desktop", "phone"]) {
  const p = await br.newPage({ viewport: ab === "phone" ? { width: 390, height: 844 } : { width: 1440, height: 900 } });
  await p.goto(`http://localhost:8575/_source/tools/stage.html?d=${d}&ab=${ab}`);
  await p.waitForFunction(() => window.ready);
  const h = (await p.evaluate(() => window.meta)).markers.find((m) => m.cm === "hold");
  const shot = async (f) => { await p.evaluate((f) => window.go(f), f); return p.screenshot(); };
  const a = await shot(h.tm), b = await shot(h.tm + h.dr), c = await shot(h.tm + h.dr / 2);
  console.log(d, ab, "hold", h.tm, "-", h.tm + h.dr, "start vs end:", JSON.stringify(await diff(a, b)), "start vs middle:", JSON.stringify(await diff(a, c)));
  await p.close();
}
await br.close();
