// pm2 config for cromaticstudios.com on Bunnyshell Cloud (r400, Mira's audit finding 9: no more 503 on deploys).
//
// Cluster mode with ONE instance: the pm2 daemon holds port 8081 itself, so `pm2 reload` starts the new release's
// process beside the old one, waits for its process.send("ready") (server.js, once it listens), and only then sends
// the old one SIGINT; server.js then finishes what it is answering and exits. The port never closes, so the server's
// Apache proxy never sees "connection refused" (its 503). Fork mode cannot do this (there, reload = restart).
// One instance on purpose: 1 CPU and 1 GB shared with the WordPress, and /ops (login codes, sessions) plus The Core
// (per-client write queues) keep state in the process's memory, which a second instance would not see.
//
// The script is loaded through the deploy symlink (APP), never a release folder: every reload resolves it again and
// so starts the release the symlink points to now. deploy/pm2-reload.mjs runs this (the Bunnyshell post-symlink step).
const APP = process.env.CZ_APP_PATH || "/var/www/cromatic_drive/app";

module.exports = {
  apps: [{
    name: "cromatic-drive",
    cwd: APP,
    script: APP + "/deploy/pm2-entry.cjs", // CommonJS: pm2's cluster loader require()s it, it imports app.js (ESM)
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
