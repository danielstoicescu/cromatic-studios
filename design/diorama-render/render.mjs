// Cromatic · diorama renders (TASK-118): renders a shot module to PNGs through the harness (_source/harness.mjs).
//   node render.mjs shots/slow.mjs [--frames 0-104 | 0,52,104] [--quality draft|preview|final|ultra] [--samples N]
//                   [--out DIR] [--before] [--harness http://localhost:8797]
// Frames land in DIR/<shot>-NNNN.png (DIR defaults to out/<shot>); --before writes the map's own render of the same
// cameras (DIR/<shot>-before-NNNN.png). Prints the time per frame.
import fs from "fs";
import path from "path";
const args = process.argv.slice(2), opt = (k, d) => { const i = args.indexOf("--" + k); return i < 0 ? d : args[i + 1]; }, flag = (k) => args.includes("--" + k);
const shotFile = args.find((a) => a.endsWith(".mjs"));
if (!shotFile) { console.error("usage: node render.mjs shots/<shot>.mjs [--frames a-b] [--quality final] [--out dir] [--before]"); process.exit(1); }
const HERE = path.dirname(new URL(import.meta.url).pathname), HARNESS = opt("harness", process.env.HARNESS || "http://localhost:8797");
const rel = path.relative(HERE, path.resolve(shotFile)).split(path.sep).join("/"), name = path.basename(shotFile, ".mjs");
const OUT = path.resolve(opt("out", path.join(HERE, "out", name))); fs.mkdirSync(OUT, { recursive: true });
const run = async (body) => { const r = await fetch(HARNESS, { method: "POST", body }); const t = await r.text(); if (r.status !== 200) throw new Error(t); return JSON.parse(t); };
// the page's modules are cached by the browser: when src/ changed since the page imported them, the page is reloaded
const mt = (d) => fs.readdirSync(path.join(HERE, d)).filter((f) => /\.m?js$/.test(f) && path.join(HERE, d, f) !== path.resolve(shotFile)).map((f) => fs.statSync(path.join(HERE, d, f)).mtimeMs);
const ver = Math.max(fs.statSync(path.join(HERE, "../../src/app.js")).mtimeMs, ...mt("src"), ...mt("shots"), ...(fs.existsSync(path.join(HERE, "shots/a6")) ? mt("shots/a6") : []), ...mt("vendor")) | 0; // (a shot's own file is imported fresh each time; what it imports is cached by the page) // (the map's own app.js too: the harness serves it fresh)
await run(`const [v, has, st] = await p.evaluate(() => [window.__drVer, !!window.__RUN, !!window.__story]); if (!st || (has && v !== ${ver})) { await p.goto(new URL("/?map&story", p.url()).href, { waitUntil: "domcontentloaded" }); await p.waitForFunction(() => window.__nav2 && window.__nav2.D && window.__nav2.D.ready && window.__story && window.__fp && (window.__story.merged() || []).length, null, { timeout: 240000 }); await p.waitForTimeout(12000); } return v;`);
const info = await run(`await p.evaluate(async (ver) => { if (!window.__RUN) { await import("/__dr/src/runner.js?v=" + ver); window.__drVer = ver; } }, ${ver}); return await p.evaluate(async (o) => window.__RUN.load("/__dr/${rel}", o), ${JSON.stringify({ quality: opt("quality", "final"), samples: +opt("samples", 0) || undefined, scale: +opt("scale", 0) || undefined })});`);
console.log(JSON.stringify(info));
const spec = opt("frames", `0-${info.frames - 1}`), frames = [];
for (const part of spec.split(",")) { const [a, b] = part.split("-").map(Number); for (let f = a; f <= (b ?? a); f++) frames.push(f); }
const t0 = Date.now(); let sum = 0;
for (const f of frames) {
  const n = String(f).padStart(4, "0");
  if (flag("before")) {
    const u = await run(`return await p.evaluate((f) => window.__RUN.before(f), ${f});`);
    fs.writeFileSync(path.join(OUT, `${name}-before-${n}.png`), Buffer.from(u.split(",")[1], "base64"));
    if (flag("only-before")) continue;
  }
  const t1 = Date.now(), r = await run(`return await p.evaluate((f) => window.__RUN.frame(f), ${f});`);
  fs.writeFileSync(path.join(OUT, `${name}-${n}.png`), Buffer.from(r.url.split(",")[1], "base64"));
  const dt = Date.now() - t1; sum += dt;
  console.log(`frame ${f}: ${(dt / 1000).toFixed(1)} s (gpu ${(r.ms / 1000).toFixed(1)} s, ${r.w}x${r.h}, ${info.samples} samples)`);
}
console.log(`${frames.length} frames in ${((Date.now() - t0) / 1000).toFixed(0)} s, ${(sum / Math.max(1, frames.length) / 1000).toFixed(1)} s a frame -> ${OUT}`);
