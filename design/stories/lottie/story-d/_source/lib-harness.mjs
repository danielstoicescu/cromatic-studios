// Cromatic · stories in Lottie (TASK-057): the Node half of the layer renders, used by the jobs sent to harness.mjs
import fs from "fs";
const PAGE = new URL("./page-render.js", import.meta.url);
export async function inject(p, force) {
  if (force || !(await p.evaluate(() => !!window.__R))) await p.addScriptTag({ content: fs.readFileSync(PAGE, "utf8") });
}
const toFile = (url, file) => { fs.writeFileSync(file, Buffer.from(url.split(",")[1], "base64")); return file; };
export async function save(p, o, file) {
  return toFile(await p.evaluate((o) => window.__R.shot(o), o), file);
}
// the loop's own camera put where the shot is (so the sun's shadow map covers it), a moment to settle
export async function aim(p, o, ms = 1200) {
  await p.evaluate((o) => { window.__cam(o.pos, o.tgt); window.__camSnap(); }, o);
  await p.waitForTimeout(ms);
}
// a shot's layers: the plan, then each layer (names, or groups of names) as its own PNG, the whole frame, the numbers
// layers: [[file tag, [layer names]], ...]; park: [x, y, z, yaw] puts the ride there for the shot
export async function layers(p, o, list, dir, tag, { park, full = true } = {}) {
  fs.mkdirSync(dir, { recursive: true });
  // one task in the page: the loop does not draw in between (the ride stays parked, the shadow map stays the one made here)
  const r = await p.evaluate(({ o, list, park, full }) => {
    const R = window.__R, urls = {};
    if (park) R.park(park);
    try {
      const count = R.plan(o);
      R.shot({ ...o, keepBg: true, shadowUpdate: true });
      if (full) urls.full = R.shot({ ...o, keepBg: true });
      for (const [nm, keep, ov] of list) urls[nm] = R.layer({ ...o, ...(ov || {}) }, keep); // (ov: a wider picture for a layer that slides further)
      return { count, urls };
    } finally { if (park) R.park(null); }
  }, { o, list, park, full });
  const files = {};
  for (const [nm, url] of Object.entries(r.urls)) files[nm] = toFile(url, `${dir}/${tag}-${nm}.png`);
  return { count: r.count, files };
}
