// Cromatic · hero car (TASK-112): drives the hero page (../index.html) in Playwright. LOCAL ONLY.
//   node drive.mjs studio OUT=dir            the car in a room from a few angles
//   node drive.mjs shot SHOT=top|steam MODE=pt|raster RAW=dir OUT=dir
import pw from "/Users/daniel.stoic/node_modules/playwright/index.mjs";
import fs from "fs";
import path from "path";
const HERE = path.resolve(new URL("..", import.meta.url).pathname), RAW = process.env.RAW || "", OUT = process.env.OUT || "./out";
fs.mkdirSync(OUT, { recursive: true });
const job = process.argv[2] || "studio";
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".png": "image/png", ".webp": "image/webp", ".bin": "application/octet-stream" };
const br = await pw.chromium.launch({ args: ["--use-angle=metal", "--ignore-gpu-blocklist", "--enable-unsafe-swiftshader"] });
const ctx = await br.newContext({ viewport: { width: 800, height: 600 } });
await ctx.route("http://hero.local/**", (r) => {
  const u = decodeURIComponent(new URL(r.request().url()).pathname);
  const f = u.startsWith("/raw/") ? path.join(RAW, u.slice(5)) : path.join(HERE, u === "/" ? "index.html" : u);
  if (!fs.existsSync(f)) return r.fulfill({ status: 404, body: "404 " + u });
  r.fulfill({ status: 200, body: fs.readFileSync(f), headers: { "content-type": TYPES[path.extname(f)] || "application/octet-stream" } });
});
const p = await ctx.newPage();
p.on("console", (m) => { if (["error", "warning"].includes(m.type())) console.log("console", m.type(), m.text().slice(0, 300)); else if (process.env.VERBOSE) console.log("log", m.text().slice(0, 300)); });
p.on("pageerror", (e) => console.log("pageerror", e.message));
await p.goto("http://hero.local/");
await p.waitForFunction(() => window.HERO && window.HERO.ready, null, { timeout: 60000 });
const save = (url, f) => fs.writeFileSync(f, Buffer.from(url.split(",")[1], "base64"));
const t0 = Date.now();
if (job === "studio") {
  const views = JSON.parse(process.env.VIEWS || "[[35,10,9],[90,2,10],[160,12,9],[0,3,9],[180,3,9],[30,60,9]]");
  const r = await p.evaluate((o) => window.HERO.studio(o), { w: 1400, h: 800, views, fov: +process.env.FOV || 28 });
  r.out.forEach((u, i) => save(u, `${OUT}/studio-${i}.png`));
  console.log("tris", r.tris);
} else if (job === "shot") {
  const o = { shot: process.env.SHOT, mode: process.env.MODE || "raster", samples: +process.env.SAMPLES || 256, scale: +process.env.SCALE || 1, crop: process.env.CROP ? JSON.parse(process.env.CROP) : null, debug: !!process.env.DEBUG, envK: process.env.ENVK ? +process.env.ENVK : undefined, tint: process.env.TINT ? +process.env.TINT : undefined, bounces: +process.env.BOUNCES || undefined, tiles: +process.env.TILES || 3, noShadow: !!process.env.NOSHADOW, probe: !!process.env.PROBE };
  p.setDefaultTimeout(0);
  const r = await p.evaluate((o) => window.HERO.shot(o), o);
  for (const [k, u] of Object.entries(r.images || {})) save(u, `${OUT}/${o.shot}-${o.mode}-${k}.png`);
  console.log(JSON.stringify(r.info || {}));
}
console.log(job, ((Date.now() - t0) / 1000).toFixed(1), "s");
await br.close();
