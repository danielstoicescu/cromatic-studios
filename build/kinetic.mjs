// The kinetic intro of the drive (CH.00, "what we bring to the table", ending in a wall of coffee
// cups) lifted out of src/app.js so the lo-fi website can play it as its hero, without the city.
// The function is copied verbatim from the bundle and re-bundled against just the parts of
// three.js it touches; its styles are the .kz / .kx rules of src/styles.css.
import { buildSync } from "esbuild";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

export function kineticBundle(appJs, stylesCss) {
  const start = appJs.indexOf("\n  function createKinetic(");
  if (start < 0) throw new Error("createKinetic not found in app.js");
  const end = appJs.indexOf("\n  function ", start + 10);
  const fn = appJs.slice(start, end);
  const texStart = appJs.indexOf("\n  function canvasTexture(");
  const texFn = appJs.slice(texStart, appJs.indexOf("\n  function ", texStart + 10));
  const entry = `
import { WebGLRenderer, Scene, PMREMGenerator, HemisphereLight, DirectionalLight, PerspectiveCamera, Vector2, Vector3,
  LatheGeometry, TorusGeometry, CircleGeometry, PlaneGeometry, MeshStandardMaterial, MeshBasicMaterial, Group, Mesh,
  CanvasTexture, SRGBColorSpace, ACESFilmicToneMapping, RepeatWrapping, Color, DoubleSide } from "three";
import { RoomEnvironment } from "three/examples/jsm/environments/RoomEnvironment.js";
${texFn}
${fn}
window.cromaticKinetic = createKinetic;
`;
  const out = buildSync({
    stdin: { contents: entry, resolveDir: root, loader: "js" },
    bundle: true, minify: true, format: "iife", target: "es2020", write: false, legalComments: "none", logLevel: "silent"
  });
  return { js: out.outputFiles[0].text, css: kineticCss(stylesCss) };
}

// keep the rules that style the kinetic stage (.kz…, .kx…), inside @media too, plus the
// @keyframes they name; prepend the few theme variables they read
function kineticCss(css) {
  const blocks = splitBlocks(css.replace(/\/\*[\s\S]*?\*\//g, ""));
  const keep = [], frames = new Map();
  const isK = (sel) => /\.k[zx](?![\w])|\.k[zx]-/.test(sel);
  for (const b of blocks) {
    if (/^@keyframes\s+([\w-]+)/.test(b.head)) frames.set(/^@keyframes\s+([\w-]+)/.exec(b.head)[1], b.text);
    else if (/^@media/.test(b.head)) {
      const inner = splitBlocks(b.body).filter((r) => isK(r.head)).map((r) => r.text);
      if (inner.length) keep.push(`${b.head}{${inner.join("")}}`);
    } else if (!b.head.startsWith("@") && isK(b.head)) keep.push(b.text);
  }
  let out = keep.join("\n");
  const used = new Set([...out.matchAll(/animation(?:-name)?\s*:\s*([^;}]+)/g)].flatMap((m) => m[1].split(/[\s,]+/)));
  const kf = [...frames].filter(([n]) => used.has(n)).map(([, t]) => t).join("\n");
  return `:root{--accent:#FED012;--fg:#0d0c09;--bg:#fbfaf5;--st-ink:#0d0c09;--card-bg:#fff}\n${out}\n${kf}`;
}

function splitBlocks(css) {
  const out = [];
  let i = 0;
  while (i < css.length) {
    const open = css.indexOf("{", i);
    if (open < 0) break;
    const head = css.slice(i, open).trim();
    let depth = 1, j = open + 1;
    while (j < css.length && depth) { if (css[j] === "{") depth++; else if (css[j] === "}") depth--; j++; }
    out.push({ head, body: css.slice(open + 1, j - 1), text: css.slice(i, j).trim() });
    i = j;
  }
  return out;
}
