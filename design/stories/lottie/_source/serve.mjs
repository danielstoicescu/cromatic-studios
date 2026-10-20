// a static server for the stage (the worktree's root on :8963, LOCAL ONLY)
import http from "http"; import fs from "fs"; import path from "path";
const ROOT = path.resolve(new URL("../../../../", import.meta.url).pathname), PORT = +process.env.PORT || 8963;
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".json": "application/json", ".webp": "image/webp", ".png": "image/png", ".jpg": "image/jpeg", ".mp4": "video/mp4" };
http.createServer((req, res) => { const u = decodeURIComponent(new URL(req.url, "http://x").pathname), f = path.join(ROOT, u); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.statusCode = 404; return res.end("404"); } res.setHeader("content-type", TYPES[path.extname(f)] || "application/octet-stream"); res.setHeader("cache-control", "no-store"); fs.createReadStream(f).pipe(res); }).listen(PORT, "127.0.0.1", () => console.log("serving", ROOT, PORT));
