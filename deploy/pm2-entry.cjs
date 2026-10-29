// What pm2 runs (r407). pm2's cluster loader require()s its script, so this is CommonJS; it imports app.js (ESM).
// The deploy (deploy/pm2-reload.mjs) copies this file into a folder that never changes, <pm2 home>/cromatic-drive/,
// and writes current.json beside it: {"release": "<the release folder>"}. pm2's script and cwd are that fixed folder,
// so every `pm2 reload` starts this file again, and it starts the release current.json names NOW. No deploy symlink,
// no server path needed. Run from inside a release (no current.json beside it), it starts that release's app.js.
const { readFileSync } = require("fs");
const { join } = require("path");
const { pathToFileURL } = require("url");
let release = join(__dirname, "..");
try { const c = JSON.parse(readFileSync(join(__dirname, "current.json"), "utf8")); if (c && typeof c.release === "string" && c.release) release = c.release; } catch {}
try { process.chdir(release); } catch {}
import(pathToFileURL(join(release, "app.js")).href).catch((e) => { console.error("[pm2-entry]", release, e); process.exit(1); });
