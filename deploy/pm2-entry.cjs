// pm2's cluster mode loads its script with require() (older pm2 versions cannot load an ES module there), so this
// CommonJS file is what pm2 starts; it hands over to app.js, which loads .env and imports server.js. Relative to this
// file's real path, so it always starts the release the deploy symlink pointed to when pm2 forked it.
import("../app.js").catch((e) => { console.error("[pm2-entry]", e); process.exit(1); });
