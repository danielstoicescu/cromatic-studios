// Cromatic · metro mockups (TASK-062): a static server on the worktree's root (LOCAL ONLY), for the 3D stage and the
// Lottie stage. node serve.mjs  (PORT, default 8965; PLATES: the plates folder, served at /_plates/)
import http from "http"; import fs from "fs"; import path from "path";
const ROOT = path.resolve(new URL("../../../", import.meta.url).pathname), PORT = +process.env.PORT || 8965;
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".mjs": "text/javascript", ".json": "application/json", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".mp4": "video/mp4" };
http.createServer((req, res) => {
  const u = decodeURIComponent(new URL(req.url, "http://x").pathname);
  // /_plates/...: the rendered plates (PLATES, a scratch folder outside the tree)
  const base = u.startsWith("/_plates/") && process.env.PLATES ? path.resolve(process.env.PLATES) : ROOT, f = path.join(base, base === ROOT ? u : u.slice(8));
  if (!f.startsWith(base) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.statusCode = 404; return res.end("404"); }
  res.setHeader("content-type", TYPES[path.extname(f)] || "application/octet-stream"); res.setHeader("cache-control", "no-store");
  fs.createReadStream(f).pipe(res);
}).listen(PORT, "127.0.0.1", () => console.log("serving", ROOT, PORT));
