// Cromatic · diorama renders (TASK-118): the map's bundle as build/build.mjs makes it (the same embedded files under
// the same hashed names, the same replacements), read fresh from src/app.js and not minified, so the harness can serve
// the working copy over a built PUBLIC_DIR without a full build. LOCAL ONLY (the site is always built by build.mjs).
import { readFileSync, existsSync } from "fs";
import { createHash } from "crypto";
import { join } from "path";
const hash = (buf) => createHash("sha1").update(buf).digest("hex").slice(0, 10);
const EXT = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif", "image/svg+xml": "svg", "video/mp4": "mp4", "video/webm": "webm" };
const BUNDLE_WEBP = new Set(["2def44f1a5", "93d1d808f4"]);
export async function devApp(root) {
  const src = (f) => join(root, "src", f);
  const js = readFileSync(src("app.js"), "utf8");
  const NAV2_JS = (() => { try { return readFileSync(src("nav2.js"), "utf8"); } catch { return ""; } })();
  const LUI_JS = ["czl.js", "finale.js", "pill.js", "micro.js", "welcome.js", "game.js"].map((f) => { try { return readFileSync(join(root, "src", "lottie-ui", f), "utf8"); } catch { return ""; } }).join("\n");
  const DATA = await import(join(root, "site", "data.mjs"));
  const webpOf = new Map();
  for (const m of js.matchAll(/data:image\/png;base64,([A-Za-z0-9+/=]+)/g)) {
    if (webpOf.has(m[1])) continue;
    const png = Buffer.from(m[1], "base64");
    if (!BUNDLE_WEBP.has(hash(png))) continue;
    const cached = join(root, "site", ".img-cache", `${createHash("sha1").update(png).digest("hex").slice(0, 12)}-ll.webp`);
    if (existsSync(cached)) { const w = readFileSync(cached); if (w.length < png.length) webpOf.set(m[1], w); }
  }
  const seen = new Map();
  const extract = (text) => text.replace(/data:(image\/(?:png|jpeg|webp|gif|svg\+xml)|video\/(?:mp4|webm));base64,([A-Za-z0-9+/=]+)/g, (m, mime, b64) => {
    if (seen.has(b64)) return seen.get(b64);
    const webp = mime === "image/png" && webpOf.get(b64), buf = webp || Buffer.from(b64, "base64");
    const name = `assets/${hash(buf)}.${webp ? "webp" : EXT[mime]}`; seen.set(b64, name); return name;
  });
  const lazy = (text) => text.replace(/<img src=/g, "<img loading=lazy decoding=async src=");
  let out = NAV2_JS + "\n" + LUI_JS + "\n" + lazy(extract(js));
  out = out.replace("var ZDROVIT_BRANDS = [];", () => `var ZDROVIT_BRANDS = ${JSON.stringify(DATA.ZDROVIT_BRANDS || []).replace(/[\u0080-￿]/g, (c) => "\\u" + c.charCodeAt(0).toString(16).padStart(4, "0"))};`);
  out = out.replace(/var steamCaseHtml = "(?:[^"\\]|\\.)*";/, 'var steamCaseHtml = "";');
  return out;
}
