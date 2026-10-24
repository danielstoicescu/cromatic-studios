// Cromatic · hero vehicles: copies kit.js's v3 detail block (between "// <<detail" and "// detail>>") into the hero
// Dacia 1300, which loads alone (no imports): the same tyres, brakes, dust, plates and cabin as the garage's models.
//   node _source/sync-detail.mjs [file ...]   (default: ~/cromatic-herocar/design/hero-car/src/dacia1300-hero.js)
import fs from "fs";
import os from "os";
import path from "path";
const HERE = path.resolve(new URL("..", import.meta.url).pathname);
const kit = fs.readFileSync(path.join(HERE, "src/kit.js"), "utf8");
const a = kit.indexOf("// <<detail"), b = kit.indexOf("// detail>>") + "// detail>>".length;
const block = kit.slice(a, b).replace(/^export (function|const)/gm, "$1");
const files = process.argv.slice(2).length ? process.argv.slice(2) : [path.join(os.homedir(), "cromatic-herocar/design/hero-car/src/dacia1300-hero.js")];
for (const f of files) {
  let s = fs.readFileSync(f, "utf8");
  const i = s.indexOf("// <<detail"), j = s.indexOf("// detail>>");
  s = i >= 0 && j > i ? s.slice(0, i) + block + s.slice(j + "// detail>>".length) : s.trimEnd() + "\n\n" + block + "\n";
  fs.writeFileSync(f, s); console.log("detail block ->", f, block.length, "chars");
}
