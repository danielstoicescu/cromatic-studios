// The Bunnyshell post-symlink step (r400, Mira's audit finding 9): start or gracefully reload the site under pm2.
//
//   cd /var/www/cromatic_drive/app && node deploy/pm2-reload.mjs
//
// - "cromatic-drive" already runs in cluster mode -> `pm2 reload ecosystem.config.cjs --update-env`: the new release
//   starts beside the old one and takes over when it says "ready"; no request sees an error. If the new release
//   cannot start, pm2 keeps the old process serving and this step fails, so the deploy shows as failed.
// - otherwise (the first deploy after r400: the old fork-mode app started from app.js, or nothing at all) -> the old
//   process(es) of this app are deleted and the cluster app is started: one last short gap, then reloads from now on.
// Before either, a preflight: the new release is started once on its own on 127.0.0.1:PREFLIGHT_PORT (default 18081)
// and must answer /healthz 200 within 90 s. If it does not (a crash at boot, a missing module), pm2 is not touched: the
// old process keeps serving from memory and the step fails. (pm2 alone would retry the broken one and, after its
// timeouts, stop the old one: the site would go down a minute or two later.) Skip it with PREFLIGHT=0.
// Then `pm2 save` (so a reboot brings back the same app) and a check that /healthz answers 200 on the port.
// --update-env passes the step's environment (the Bunnyshell Secrets) on to the new process, as pm2 start does.
// Node 16 compatible; prints no environment values.
import { execFileSync, spawn } from "node:child_process";
import http from "node:http";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const NAME = "cromatic-drive";
const PM2 = process.env.PM2_BIN || "pm2";
const APP = process.env.CZ_APP_PATH || "/var/www/cromatic_drive/app";
const ECO = join(APP, "ecosystem.config.cjs");
const ROOT = dirname(APP); // the deploy root: the symlink, releases/ and shared/ live here
const PORT = Number(process.env.PORT || 8081);
const here = dirname(fileURLToPath(import.meta.url));

const pm2 = (...args) => { console.log(`$ pm2 ${args.join(" ")}`); execFileSync(PM2, args, { stdio: "inherit", cwd: APP }); };
function list() {
  const out = execFileSync(PM2, ["jlist"], { cwd: APP, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });
  try { return JSON.parse(out.slice(out.indexOf("["))); } catch { return []; }
}
const health = (port = PORT) => new Promise((resolve) => {
  const r = http.get({ host: "127.0.0.1", port, path: "/healthz", timeout: 3000 }, (x) => { x.resume(); resolve(x.statusCode); });
  r.on("timeout", () => r.destroy()); r.on("error", () => resolve(0));
});
const wait = (ms) => new Promise((r) => setTimeout(r, ms));

const PREFLIGHT_PORT = Number(process.env.PREFLIGHT_PORT || 18081);
async function preflight() {
  const t0 = Date.now(), tail = [];
  const child = spawn(process.execPath, [join(APP, "app.js")], { cwd: APP, env: { ...process.env, PORT: String(PREFLIGHT_PORT), LISTEN_HOST: "127.0.0.1" }, stdio: ["ignore", "pipe", "pipe"] });
  const keep = (d) => { for (const l of String(d).split("\n")) if (l.trim()) { tail.push(l.slice(0, 300)); if (tail.length > 20) tail.shift(); } };
  child.stdout.on("data", keep); child.stderr.on("data", keep);
  let exited = null; child.on("exit", (c, sg) => { exited = sg || c; });
  let ok = false;
  while (!ok && exited === null && Date.now() - t0 < 90000) { await wait(1000); ok = (await health(PREFLIGHT_PORT)) === 200; }
  if (exited === null) { child.kill("SIGTERM"); for (let i = 0; i < 30 && exited === null; i++) await wait(500); if (exited === null) child.kill("SIGKILL"); }
  console.log(`[deploy] preflight on 127.0.0.1:${PREFLIGHT_PORT}: ${ok ? "healthy" : "FAILED"} after ${((Date.now() - t0) / 1000).toFixed(1)} s`);
  if (!ok) for (const l of tail) console.log("  | " + l);
  return ok;
}

if (process.env.PREFLIGHT !== "0" && !(await preflight())) {
  console.error("[deploy] the new release does not start: pm2 left as it is, the previous process keeps serving");
  process.exit(1);
}
const procs = list();
const ours = procs.filter((p) => p.name === NAME);
const live = ours.length > 0 && ours.every((p) => p.pm2_env && p.pm2_env.exec_mode === "cluster_mode") && ours.some((p) => p.pm2_env.status === "online");
console.log(`[deploy] release ${here.replace(/\/deploy$/, "")}; pm2 has ${procs.length} process(es), ${NAME}: ${ours.map((p) => `${p.pm2_env.exec_mode}/${p.pm2_env.status}`).join(", ") || "none"}`);

let failed = false;
if (live) {
  try { pm2("reload", ECO, "--update-env"); } catch (e) { failed = true; console.error(`[deploy] pm2 reload failed (${e.status}): the previous process keeps serving`); }
} else {
  // the old setup: `pm2 start app.js` (fork mode, any name) from this app's folder, or a stopped/broken cluster app
  // (anything pm2 runs from under the deploy root, /var/www/cromatic_drive/: the symlink or a release folder)
  const old = procs.filter((p) => p.name === NAME || [p.pm2_env && p.pm2_env.pm_exec_path, p.pm2_env && p.pm2_env.pm_cwd].some((x) => String(x || "").startsWith(ROOT + "/")));
  for (const p of old) { try { pm2("delete", String(p.pm_id)); } catch {} }
  try { pm2("start", ECO, "--update-env"); } catch (e) { failed = true; console.error(`[deploy] pm2 start failed (${e.status})`); }
}
try { pm2("save"); } catch {}

let code = 0;
for (let i = 0; i < 30 && code !== 200; i++) { code = await health(); if (code !== 200) await wait(2000); }
console.log(`[deploy] /healthz on :${PORT} -> ${code || "no answer"}`);
process.exit(failed || code !== 200 ? 1 : 0);
