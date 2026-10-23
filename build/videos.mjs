// r139c (audit: VideoObject on the pages with films): every film a visitor can play on a page gets a VideoObject in
// the page's JSON-LD: the YouTube films behind their click-to-play facade (data-yt) and our own films with controls
// (<video controls>). The silent loops (muted, autoplay, no controls) are pictures that move, not films: none.
// thumbnailUrl is always a picture on this domain (the facade's poster, the film's poster, else the page's picture).
// Dates are never guessed: the YouTube ones come from the films' YouTube pages (read 13 Oct 2026); our own files carry
// none (no creation time in the WebM/MP4 headers), so they go without uploadDate.
import { readFileSync } from "node:fs";
import { join } from "node:path";

const YT = {
  "vGNSZ_aUd8w": { name: "Clinica Sante - Recomandată de medici, parafată de pacienți!", uploadDate: "2025-02-12T04:54:04-08:00", duration: "PT50S", description: "TV spot for Clinica Sante, a network of medical laboratories: who tests the people who run the tests? Made by Cromatic Studios." },
  "8KtUdarL1oI": { name: "Buchet de Anemone | Pain Plaisir", uploadDate: "2025-12-12T09:19:01-08:00", duration: "PT36S", description: "Anemone, a short film for Pain Plaisir, a French-style bakery in Bucharest, made by Cromatic Studios." },
  "m4-5T3i3wN0": { name: "A Journey Around The World by Two Minutes", uploadDate: "2017-04-21T01:27:46-07:00", duration: "PT2M", description: "A film for Two Minutes, the specialty coffee brand, made by Cromatic Studios." },
  // TASK-092: the Litorsal TV spots, from the brand's own channel (Litorsal Romania), dates read 23 Oct 2026
  "o5FE30n77WU": { name: "Litorsal iulie 2026", uploadDate: "2026-07-30T11:52:02-07:00", duration: "PT20S", description: "Litorsal TV spot, 2026, garden version: the tail with three 3D boxes and the TV, online, pre-roll and metro versions by Cromatic Studios." },
  "NOn4fCOub88": { name: "Litorsal iulie 2026", uploadDate: "2026-07-30T11:53:42-07:00", duration: "PT20S", description: "Litorsal TV spot, 2026, gym version: the tail with three 3D boxes and the TV, online, pre-roll and metro versions by Cromatic Studios." },
  "WUxLxtCo5Wc": { name: "Litorsal Mai 2026", uploadDate: "2026-05-13T23:17:01-07:00", duration: "PT10S", description: "Litorsal 10-second TV spot, 2026, with a tail of three 3D boxes by Cromatic Studios." },
  "sdIUOZ-T0pk": { name: "Litorsal", uploadDate: "2025-04-15T04:26:12-07:00", duration: "PT20S", description: "Litorsal 20-second TV spot, 2025, edited by Cromatic Studios." },
  "kxX_o_yme08": { name: "Litorsal", uploadDate: "2023-05-30T09:50:48-07:00", duration: "PT10S", description: "Litorsal 10-second TV spot, 2023: the Romanian edit with a 3D carton by Cromatic Studios." },
  "zsz1e9QMCds": { name: "Litorsal", uploadDate: "2019-07-07T23:16:46-07:00", duration: "PT20S", description: "Litorsal 20-second TV spot, 2019, by Cromatic Studios." }
};
// our own films, by file name (the page's aria-label names them otherwise)
const OWN = {
  "GAME-SONG-MONTAGE": { description: "The first Routine Paris perfume campaign, shot as a short film by Cromatic Studios." }
};

const attr = (tag, a) => (new RegExp(`\\s${a}="([^"]*)"`).exec(tag) || [])[1];
const iso = (s) => { s = Math.round(s); const m = Math.floor(s / 60), r = s % 60; return `PT${m ? m + "M" : ""}${r || !m ? r + "S" : ""}`; };

// a film's length from its own header: WebM (Info: TimecodeScale 0x2AD7B1, Duration 0x4489) or MP4 (mvhd)
function fileDuration(file) {
  let b;
  try { b = readFileSync(file); } catch { return null; }
  if (b[0] === 0x1a && b[1] === 0x45 && b[2] === 0xdf && b[3] === 0xa3) {
    const head = b.subarray(0, 8192);
    let scale = 1000000;
    const k = head.indexOf(Buffer.from([0x2a, 0xd7, 0xb1]));
    if (k > -1) { const sz = head[k + 3] & 0x7f; let v = 0; for (let q = 0; q < sz; q++) v = v * 256 + head[k + 4 + q]; if (v) scale = v; }
    const j = head.indexOf(Buffer.from([0x44, 0x89]));
    if (j > -1) { const sz = head[j + 2] & 0x7f; const d = sz === 8 ? head.readDoubleBE(j + 3) : sz === 4 ? head.readFloatBE(j + 3) : 0; if (d > 0) return (d * scale) / 1e9; }
    return null;
  }
  const m = b.indexOf("mvhd");
  if (m > 3) { const v = b[m + 4]; const ts = v ? b.readUInt32BE(m + 24) : b.readUInt32BE(m + 16); const du = v ? Number(b.readBigUInt64BE(m + 28)) : b.readUInt32BE(m + 20); if (ts && du) return du / ts; }
  return null;
}

/** Adds the page's films to its JSON-LD graph. `pub` = the output folder (to read our own films' length). */
export function videoLd(html, { path, SITE, pub, name: pageName }) {
  const url = `${SITE}${path}`, films = [];
  const og = (/<meta property="og:image" content="([^"]+)"/.exec(html) || [])[1];
  const abs = (u) => (!u || u.startsWith("data:") ? null : /^https?:/.test(u) ? u : u.startsWith("/") ? SITE + u : null);
  for (const m of html.matchAll(/<div\b[^>]*\bdata-yt="([\w-]{11})"[^>]*>/g)) {
    const id = m[1], meta = YT[id] || {};
    if (films.some((f) => f.embedUrl?.endsWith(id))) continue;
    const after = html.slice(m.index, m.index + 4000);
    const poster = abs(attr((/<img\b[^>]*>/.exec(after) || [""])[0], "src")) || abs(og);
    const name = meta.name || attr(m[0], "data-title");
    films.push({ "@type": "VideoObject", name, description: meta.description || `${name}, a film from the ${pageName} case study by Cromatic Studios.`, thumbnailUrl: poster, ...(meta.uploadDate ? { uploadDate: meta.uploadDate } : {}), ...(meta.duration ? { duration: meta.duration } : {}), embedUrl: `https://www.youtube.com/embed/${id}`, url: `https://www.youtube.com/watch?v=${id}` });
  }
  for (const m of html.matchAll(/<video\b[^>]*>/g)) {
    const tag = m[0];
    if (!/\scontrols\b/.test(tag)) continue;
    const src = attr(tag, "src") || attr(tag, "data-src");
    if (!src || !src.startsWith("/")) continue;
    const base = src.split("/").pop().replace(/\.[^.]+$/, ""), own = OWN[base] || {};
    const name = attr(tag, "aria-label") || `${pageName}: film`;
    const poster = abs(attr(tag, "data-poster-lg")) || abs(attr(tag, "data-poster")) || abs(attr(tag, "poster")) || abs(og);
    const sec = pub ? fileDuration(join(pub, decodeURI(src.split("?")[0]))) : null;
    films.push({ "@type": "VideoObject", name, description: own.description || `${name}, from the ${pageName} case study by Cromatic Studios.`, thumbnailUrl: poster, ...(sec ? { duration: iso(sec) } : {}), contentUrl: SITE + src });
  }
  if (!films.length) return html;
  films.forEach((f, i) => { f["@id"] = `${url}#film-${i + 1}`; f.isPartOf = { "@id": url }; if (!f.thumbnailUrl) delete f.thumbnailUrl; });
  let done = false;
  const out = html.replace(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/, (m, body) => {
    try {
      const j = JSON.parse(body);
      const graph = Array.isArray(j["@graph"]) ? j["@graph"] : null;
      if (!graph) return m;
      graph.push(...films);
      // the case study itself points at its films
      const work = graph.find((n) => n && n["@id"] === `${url}#work`);
      if (work) work.video = films.map((f) => ({ "@id": f["@id"] }));
      done = true;
      return `<script type="application/ld+json">${JSON.stringify(j).replace(/</g, "\\u003c")}</script>`;
    } catch { return m; }
  });
  if (!done) console.warn(`[videos] ${path}: ${films.length} film(s) but no JSON-LD graph to add them to`);
  return out;
}
