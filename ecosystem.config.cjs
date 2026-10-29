// pm2 config for cromaticstudios.com on Bunnyshell Cloud (r400, Mira's audit finding 9: no more 503 on deploys; r407).
//
// Cluster mode with ONE instance: the pm2 daemon holds port 8081 itself, so `pm2 reload` starts the new process beside
// the old one, waits for its process.send("ready") (server.js, once it listens), and only then sends the old one SIGINT;
// server.js then finishes what it is answering and exits. The port never closes. Fork mode cannot do this.
// One instance on purpose: 1 CPU and 1 GB shared with the WordPress, and /ops (login codes, sessions) plus The Core
// (per-client write queues) keep state in the process's memory, which a second instance would not see.
//
// r407: script and cwd are a FIXED folder in the pm2 home (<pm2 home>/cromatic-drive/), never a release folder: pm2
// keeps an app's script and cwd from its first start, so a release path there would make every reload restart that
// first release. The launcher there (a copy of deploy/pm2-entry.cjs) reads current.json, which deploy/pm2-reload.mjs
// rewrites on each deploy, and starts that release. Use it through deploy/pm2-reload.mjs, which writes both first.
const { join } = require("path");
const PM2_HOME = process.env.PM2_HOME || join(process.env.HOME || process.env.HOMEPATH || "/tmp", ".pm2"); // as pm2 resolves it
const STATE = process.env.CZ_PM2_STATE || join(PM2_HOME, "cromatic-drive");

module.exports = {
  apps: [{
    name: "cromatic-drive",
    cwd: STATE,
    script: join(STATE, "pm2-entry.cjs"),
    exec_mode: "cluster",
    instances: 1,
    wait_ready: true, // wait for process.send("ready")...
    listen_timeout: 90000, // ...up to 90 s (the box is slow right after a build); then pm2 goes on anyway
    kill_timeout: 15000, // SIGINT -> SIGKILL after 15 s; server.js drains for at most DRAIN_MS (10 s)
    min_uptime: 10000,
    max_restarts: 10,
    restart_delay: 2000,
    merge_logs: true,
    time: true
  }]
};
