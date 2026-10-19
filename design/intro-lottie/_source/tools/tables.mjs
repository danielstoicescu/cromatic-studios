// fills the measured tables into research.md (<!-- BENCH TABLE -->) and README.md (<!-- README NUMBERS -->)
// node tools/tables.mjs path/to/bench-results.json
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const here = path.dirname(fileURLToPath(import.meta.url)), root = path.resolve(here, "../..");
const R = JSON.parse(fs.readFileSync(process.argv[2], "utf8")), S = JSON.parse(fs.readFileSync(path.join(here, "../sizes.json"), "utf8"));
fs.copyFileSync(process.argv[2], path.join(here, "../bench-results.json"));
const get = (k) => R.find((r) => r.key === k);
const P = { svg: "lottie-web SVG (light)", canvas: "lottie-web canvas (light)", lw: "**lottie-web worker**", dl: "dotLottie, main thread", dlw: "dotLottie, worker" };
const freeze = (c) => (!c ? "n/a" : c.maxSkip > 2.5 ? (c.maxSkip / 60).toFixed(2) + " s" : "none");
let sz = "| File | Raw | gzip | brotli | Layers | Paths |\n|---|---|---|---|---|---|\n";
for (const k of Object.keys(S)) sz += `| \`${k}.json\` | ${(S[k].raw / 1024).toFixed(0)} KB | ${(S[k].gz / 1024).toFixed(1)} KB | ${(S[k].br / 1024).toFixed(1)} KB | ${S[k].layers} | ${S[k].paths} |\n`;
let t = "| | Player | Desktop fps | Desktop main thread | Phone 4× fps | Phone 4× main thread | Phone 4× + boot: fps | + boot: longest freeze |\n|---|---|---|---|---|---|---|---|\n";
for (const d of ["A", "B", "C"]) for (const p of ["svg", "canvas", "lw", "dl", "dlw"]) {
  const a = get(`${d} desktop ${p}`), b = get(`${d} phone4x ${p}`), c = get(`${d} phone4x ${p} +boot`);
  t += `| ${d} | ${P[p]} | ${a ? a.fps : "n/a"} | ${a ? a.mainBusyPct + " %" : "n/a"} | ${b ? b.fps : "n/a"} | ${b ? b.mainBusyPct + " %" : "n/a"} | ${c ? c.fps : "n/a"} | ${freeze(c)} |\n`;
}
let l = "| Player | Load to first frame, desktop | Phone 4× |\n|---|---|---|\n";
for (const p of ["svg", "canvas", "lw", "dlw"]) { const xs = ["A", "B", "C"].map((d) => get(`${d} desktop ${p}`)?.ev.loaded), ys = ["A", "B", "C"].map((d) => get(`${d} phone4x ${p}`)?.ev.loaded); l += `| ${P[p]} | ${Math.min(...xs)} to ${Math.max(...xs)} ms | ${Math.min(...ys)} to ${Math.max(...ys)} ms |\n`; }
const bench = `**File sizes** (one per artboard):\n\n${sz}\n**Playback**, the whole 10 s in real time (fps = frames the player drew; "+ boot" = the site's own boot long tasks replayed on the main thread):\n\n${t}\n**Load** (fetch the JSON, parse, load the player, build the animation; JSON and player from a local server):\n\n${l}`;
const rp = path.join(root, "research.md"); let rs = fs.readFileSync(rp, "utf8");
rs = rs.replace(/<!-- BENCH TABLE -->[\s\S]*?<!-- \/BENCH TABLE -->|<!-- BENCH TABLE -->/, `<!-- BENCH TABLE -->\n${bench}<!-- /BENCH TABLE -->`);
fs.writeFileSync(rp, rs);
// README, in Romanian: the recommended player per direction, against the plain SVG player
const n = (v) => String(v).replace(".", ",");
const row = (label, f) => `| ${label} | ${["A", "B", "C"].map(f).join(" | ")} |\n`;
let ro = "| | A · Pastila | B · Strada | C · Ceașca |\n|---|---|---|---|\n";
ro += row("JSON (brotli), laptop / telefon", (d) => `${n((S[`${d}/desktop`].br / 1024).toFixed(1))} / ${n((S[`${d}/phone`].br / 1024).toFixed(1))} KB`);
ro += row("Laptop, worker (fps)", (d) => n(get(`${d} desktop lw`).fps));
ro += row("Telefon 4× CPU, worker (fps)", (d) => n(get(`${d} phone4x lw`).fps));
ro += row("Telefon 4× cu încărcarea site-ului, worker", (d) => `${n(get(`${d} phone4x lw +boot`).fps)} fps, ${freeze(get(`${d} phone4x lw +boot`)) === "none" ? "fără înghețuri" : "îngheață " + freeze(get(`${d} phone4x lw +boot`))}`);
ro += row("Același test, player SVG obișnuit", (d) => `${n(get(`${d} phone4x svg +boot`).fps)} fps, îngheață ${n(freeze(get(`${d} phone4x svg +boot`)))}`);
ro += row("Fir principal ocupat, telefon 4× (worker / SVG)", (d) => `${n(get(`${d} phone4x lw`).mainBusyPct)} % / ${n(get(`${d} phone4x svg`).mainBusyPct)} %`);
ro += "\n„Telefon 4×” e un telefon de gamă medie simulat în Chrome (procesor de 4 ori mai lent). „Cu încărcarea site-ului” înseamnă că am redat, în timpul animației, blocajele reale ale firului principal măsurate pe site. Player-ul recomandat (lottie-web worker) are 67 KB cu brotli; cu o direcție, deschiderea costă în total cam 80 KB. Intro-ul de acum: 23,6 s până la hartă, 28 s pe un telefon lent. Măsurătorile complete și metoda sunt în `research.md`.\n";
const mp = path.join(root, "README.md"); let ms = fs.readFileSync(mp, "utf8");
ms = ms.replace(/<!-- README NUMBERS -->[\s\S]*?<!-- \/README NUMBERS -->|<!-- README NUMBERS -->/, `<!-- README NUMBERS -->\n${ro}<!-- /README NUMBERS -->`);
fs.writeFileSync(mp, ms);
console.log(bench); console.log(ro);
