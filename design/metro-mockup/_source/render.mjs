// Cromatic · metro mockups (TASK-062): drives the 3D stage (stage3d.html, served by serve.mjs on :8965) in a real-GPU
// Chromium and writes the layers it returns. LOCAL ONLY.
//   node render.mjs <fn> '<json args>' out.png          one call (e.g. test, layer)
//   node render.mjs --jobs jobs.json <outDir>           a list [{ name, ...layer args }]: <outDir>/<name>.png + .json
//                                                       (done ones are skipped unless FORCE=1)
import pw from "/Users/daniel.stoic/node_modules/playwright/index.mjs";
import fs from "fs";
const args = process.argv.slice(2);
const br = await pw.chromium.launch({ args: ["--use-angle=metal", "--ignore-gpu-blocklist", "--enable-gpu"] });
const p = await br.newPage({ viewport: { width: 800, height: 450 } });
const seen = new Set();
p.on("pageerror", (e) => console.log("pageerror", e.message));
p.on("console", (m) => { const t = m.text().slice(0, 300); if ((m.type() === "error" || m.type() === "warning" || m.type() === "log") && !seen.has(t)) { seen.add(t); console.log("console", t); } });
await p.goto(`http://127.0.0.1:${process.env.PORT || 8965}/design/metro-mockup/_source/stage3d.html`);
await p.waitForFunction(() => window.ready, null, { timeout: 60000 });
p.setDefaultTimeout(0);
const save = (url, f) => fs.writeFileSync(f, Buffer.from(url.split(",")[1], "base64"));
async function call(fn, a) { return p.evaluate(async ({ fn, a }) => window.M[fn](a), { fn, a }); }
if (args[0] === "--jobs") {
  const jobs = JSON.parse(fs.readFileSync(args[1], "utf8")), out = args[2];
  fs.mkdirSync(out, { recursive: true });
  for (const j of jobs) {
    const f = `${out}/${j.name}.png`;
    if (fs.existsSync(f) && !process.env.FORCE) continue;
    const t0 = Date.now();
    const r = await call("layer", j);
    if (r.error) { console.log(j.name, r.error); continue; }
    save(r.url, f);
    const meta = Object.fromEntries(Object.entries(r).filter(([k]) => k !== "url"));
    fs.writeFileSync(`${out}/${j.name}.json`, JSON.stringify({ job: j, ...meta }));
    console.log(j.name, ((Date.now() - t0) / 1000).toFixed(1) + " s", JSON.stringify(meta).slice(0, 160));
  }
} else {
  const [fn, a = "{}", out] = args, t0 = Date.now();
  const r = await call(fn, JSON.parse(a));
  if (r.url && out) save(r.url, out);
  const meta = Object.fromEntries(Object.entries(r).filter(([k]) => k !== "url"));
  console.log(JSON.stringify(meta).slice(0, 2000), ((Date.now() - t0) / 1000).toFixed(1) + " s");
}
await br.close();
