// Cromatic · hero vehicles: the turntable preview. Renders a 3/4 front still of each hero vehicle at 1080x1350 and a
// contact sheet. LOCAL ONLY (Playwright, Chromium with the GPU).
//   node _source/preview.mjs [ids...]            OUT=dir (default ~/cromatic-ops/refs/stories-lottie/vehicles/hero-models)
//   env: AZ, EL, FOV (the camera), MAN=1 (a 1.75 m figure for scale), BEACONS=1 (the Patrol's beacons lit), TAG=suffix
import pw from "/Users/daniel.stoic/node_modules/playwright/index.mjs";
import fs from "fs";
import path from "path";
import os from "os";
const HERE = path.resolve(new URL("..", import.meta.url).pathname);
const OUT = process.env.OUT || path.join(os.homedir(), "cromatic-ops/refs/stories-lottie/vehicles/hero-models");
fs.mkdirSync(OUT, { recursive: true });
const ALL = ["patrol", "van", "chrome", "formula", "plane", "scooter"];
const NAMES = { patrol: "Polite Patrol · Dacia 1310", van: "Mystery van", chrome: "Chrome racer", formula: "Classic Formula", plane: "Cropduster", scooter: "E-scooter" };
const ids = process.argv.slice(2).length ? process.argv.slice(2) : ALL;
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json" };
const br = await pw.chromium.launch({ args: ["--use-angle=metal", "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader"] });
const ctx = await br.newContext({ viewport: { width: 800, height: 600 } });
await ctx.route("http://hv.local/**", (r) => {
  const u = decodeURIComponent(new URL(r.request().url()).pathname), f = path.join(HERE, u === "/" ? "index.html" : u);
  if (!fs.existsSync(f)) return r.fulfill({ status: 404, body: "404 " + u });
  r.fulfill({ status: 200, body: fs.readFileSync(f), headers: { "content-type": TYPES[path.extname(f)] || "application/octet-stream" } });
});
const p = await ctx.newPage(); p.setDefaultTimeout(0);
p.on("console", (m) => { if (["error", "warning"].includes(m.type())) console.log("console", m.type(), m.text().slice(0, 400)); });
p.on("pageerror", (e) => console.log("pageerror", e.message));
await p.goto("http://hv.local/");
await p.waitForFunction(() => window.HV && window.HV.ready, null, { timeout: 60000 });
const save = (url, f) => fs.writeFileSync(f, Buffer.from(url.split(",")[1], "base64"));
const num = (k) => (process.env[k] ? +process.env[k] : undefined);
const o = { az: num("AZ"), el: num("EL"), fov: num("FOV"), fill: num("FILL"), man: !!process.env.MAN, beacons: !!process.env.BEACONS };
const urls = [], labels = [];
for (const id of ids) {
  const t0 = Date.now();
  const r = await p.evaluate(([id, o]) => window.HV.still(id, o), [id, o]);
  const f = path.join(OUT, `${id}${process.env.TAG || ""}.png`); save(r.url, f);
  console.log(id, "tris", r.tris, "bbox (w h l)", r.size.join(" x "), ((Date.now() - t0) / 1000).toFixed(1) + "s", "->", f);
  urls.push(r.url); labels.push([NAMES[id], `${r.size[2].toFixed(2)} m long · ${r.size[0].toFixed(2)} wide · ${r.size[1].toFixed(2)} high · ${Math.round(r.tris / 1000)}k tris`]);
}
if (ids.length > 1 || process.env.SHEET) {
  const s = await p.evaluate(([u, l]) => window.HV.sheet(u, l), [urls, labels]);
  save(s, path.join(OUT, `hero-models-sheet${process.env.TAG || ""}.jpg`)); console.log("sheet ->", path.join(OUT, "hero-models-sheet.jpg"));
}
await br.close();
