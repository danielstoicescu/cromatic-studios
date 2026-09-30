// Entry point for Bunnyshell Cloud: pm2 starts `app.js`, and the server's proxy expects port 8081.
// Settings (SMTP and the rest, see .env.example) come from a .env file next to this one, if present.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
for (const file of [process.env.ENV_FILE, join(here, ".env"), join(here, "..", "..", "shared", ".env")]) {
  if (!file) continue;
  let text;
  try { text = readFileSync(file, "utf8"); } catch { continue; }
  for (const line of text.split(/\r?\n/)) {
    const m = /^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/.exec(line);
    if (m && process.env[m[1]] === undefined) process.env[m[1]] = m[2].replace(/^(["'])(.*)\1$/, "$2");
  }
  console.log(`[env] loaded ${file}`);
  break;
}
if (!process.env.PORT) process.env.PORT = "8081";
// the webroot certbot writes to (the deploy path, a symlink to the current release)
if (!process.env.ACME_ROOT) process.env.ACME_ROOT = "/var/www/cromatic_drive/app";
await import("./server.js");
