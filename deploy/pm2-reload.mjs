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
// r406: APP may be the release folder itself (Bunnyshell's APP_ROOT): the script then looks for the deploy symlink
// that points at this release (CZ_APP_LINK, /var/www/cromatic_drive/app, <base>/current/app, <base>/current) and runs
// pm2 through it, so a later reload starts the new release. In this app's own pm2 home every process that is not a pm2
// module is ours: all of them are removed on a (re)start, not only "cromatic-drive" (a stray fork app that kept :8081
// made the cluster app crash-loop on EADDRINUSE while the stray kept serving an old release from memory). After the
// step, /healthz must name THIS release, or the step fails.
// Node 16 compatible; prints no environment values.
import { execFileSync, spawn } from "node:child_process";
import { realpathSync, lstatSync } from "node:fs";
import http from "node:http";
import { dirname, join } from "node:path";

const NAME = "cromatic-drive";
const PM2 = process.env.PM2_BIN || "pm2";
const GIVEN = process.env.CZ_APP_PATH || "/var/www/cromatic_drive/app";
const real = (p) => { try { return realpathSync(p); } catch { return null; } };
const isLink = (p) => { try { return lstatSync(p).isSymbolicLink(); } catch { return false; } };
const RELEASE_DIR = real(GIVEN) || GIVEN; // the release this step deploys
// the release's short name: /opt/app/cromatic_drive/releases/<id>/app -> <id> (server.js /healthz says the same)
const relName = (d) => (d.endsWith("/app") ? d.slice(0, -4) : d).split("/").pop();
const RELEASE = relName(RELEASE_DIR);
// the deploy symlink that points at this release: pm2 must load the script through it, or a reload restarts an old release
function findLink() {
  const up = RELEASE_DIR.replace(/\/releases\/[^/]+(\/app)?$/, "");
  const cands = [process.env.CZ_APP_LINK, isLink(GIVEN) ? GIVEN : null, "/var/www/cromatic_drive/app", join(up, "current", "app"), join(up, "current"), join(up, "app")].filter(Boolean);
  for (const c of cands) if (isLink(c) || isLink(dirname(c))) { if (real(c) === RELEASE_DIR) return c; }
  return null;
}
const LINK = findLink();
const APP = LINK || RELEASE_DIR;
const ECO = join(APP, "ecosystem.config.cjs");
const PORT = Number(process.env.PORT || 8081);

const pm2 = (...args) => { console.log(`$ pm2 ${args.join(" ")}`); execFileSync(PM2, args, { stdio: "inherit", cwd: APP, env: { ...process.env, CZ_APP_PATH: APP } }); };
function list() {
  const out = execFileSync(PM2, ["jlist"], { cwd: APP, encoding: "utf8", stdio: ["ignore", "pipe", "inherit"] });
  try { return JSON.parse(out.slice(out.indexOf("["))); } catch { return []; }
}
const healthJ = (port = PORT) => new Promise((resolve) => {
  const r = http.get({ host: "127.0.0.1", port, path: "/healthz", timeout: 3000 }, (x) => { let t = ""; x.on("data", (c) => { t += c; }); x.on("end", () => { let j = null; try { j = JSON.parse(t); } catch {} resolve({ code: x.statusCode, j }); }); });
  r.on("timeout", () => r.destroy()); r.on("error", () => resolve({ code: 0, j: null }));
});
const health = async (port = PORT) => (await healthJ(port)).code;
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
console.log(`[deploy] release ${RELEASE} (${RELEASE_DIR}); pm2 loads it through ${LINK ? "the symlink " + LINK : "the release folder (no symlink found: reloads fall back to delete + start)"}`);
const procs = list();
const apps = procs.filter((p) => !(p.pm2_env && (p.pm2_env.pmx_module || p.pm2_env.axm_options && p.pm2_env.axm_options.isModule)));
const ours = apps.filter((p) => p.name === NAME);
const others = apps.filter((p) => p.name !== NAME);
const sameScript = ours.every((p) => String(p.pm2_env && p.pm2_env.pm_exec_path || "") === join(APP, "deploy", "pm2-entry.cjs"));
const live = LINK && !others.length && sameScript && ours.length > 0 && ours.every((p) => p.pm2_env && p.pm2_env.exec_mode === "cluster_mode") && ours.some((p) => p.pm2_env.status === "online");
console.log(`[deploy] pm2 has ${apps.length} app process(es): ${apps.map((p) => `${p.pm_id}:${p.name}/${p.pm2_env.exec_mode}/${p.pm2_env.status}`).join(", ") || "none"}`);

let failed = false;
if (live) {
  try { pm2("reload", ECO, "--update-env"); } catch (e) { failed = true; console.error(`[deploy] pm2 reload failed (${e.status}): the previous process keeps serving`); }
} else {
  // a first start, a stray app (the old fork app, any name), a crash-looping or stopped cluster app, or no symlink:
  // remove every app process in this pm2 home (pm2 modules stay), then start. One short gap.
  for (const p of apps) { try { pm2("delete", String(p.pm_id)); } catch {} }
  try { pm2("start", ECO, "--update-env"); } catch (e) { failed = true; console.error(`[deploy] pm2 start failed (${e.status})`); }
}
try { pm2("save"); } catch {}

// the process on the port must be THIS release (a stray old process answering 200 is a failure, not a success)
let h = { code: 0, j: null };
for (let i = 0; i < 30; i++) { h = await healthJ(); if (h.code === 200 && h.j && h.j.release === RELEASE) break; await wait(2000); }
const served = h.j && h.j.release;
console.log(`[deploy] /healthz on :${PORT} -> ${h.code || "no answer"}, release ${served || "?"} (expected ${RELEASE}), beta ${h.j && h.j.beta ? "built" : "NOT built"}`);
process.exit(failed || h.code !== 200 || served !== RELEASE ? 1 : 0);
