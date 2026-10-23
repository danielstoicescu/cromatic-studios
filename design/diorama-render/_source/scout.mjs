// Cromatic · diorama renders (TASK-118): quick looks at cameras through the map's own renderer (540 x 960), to choose
// a framing.   node _source/scout.mjs '[{"pos":[..],"look":[..],"fov":50,"yaw":0}]' [outdir]
import fs from "fs";
import path from "path";
const HERE = path.resolve(new URL("..", import.meta.url).pathname), cams = JSON.parse(process.argv[2] || "[]"), OUT = process.argv[3] || path.join(HERE, "out/scout");
fs.mkdirSync(OUT, { recursive: true });
const r = await fetch(process.env.HARNESS || "http://localhost:8797", { method: "POST", body: `return await p.evaluate(async (cams) => { if (!window.__D) await import("/__dr/src/diorama.js?v=" + Date.now()); const { cameraPath } = await import("/__dr/src/camera.js"); return cams.map((k) => { const c = cameraPath({ keys: [{ t: 0, ...k }] }).at(0); return window.__D.plain(c, k.w || 540, k.h || 960); }); }, ${JSON.stringify(cams)});` });
const t = await r.text(); if (r.status !== 200) { console.error(t); process.exit(1); }
JSON.parse(t).forEach((u, i) => fs.writeFileSync(path.join(OUT, `s${i}.png`), Buffer.from(u.split(",")[1], "base64")));
console.log("scout", cams.length, "->", OUT);
