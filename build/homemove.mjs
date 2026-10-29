// r356 (Daniel, 28 Oct: "Poți face mutarea direct pe live"): the website is the home page, the 3D map moves to /city/.
// The build still makes both under their old names (the map at public/index.html, the website at public/site/), so every
// pass that knows them (footer, fonts, i18n, the social cards, lastmod) keeps working; this last pass, before the
// precompression, moves the two files and rewrites the addresses in every text file of the release:
//   1. links that meant the map ("/", "/?map...", "/#...", location.href="/?...") point to /city/
//   2. then "/site/" becomes "/" (links, canonicals, hreflang, og:url, JSON-LD, sitemap, llms, the map's own buttons)
//   3. the map's page asks for its files by absolute address (it was relative to "/")
//   4. the home pages (EN, RO) prefetch the map after load and idle: desktop only, never on Save-Data / 2g / 3g; on a
//      phone only on intent (r382, Mira's audit: 526 KB fetched on every phone scroll): a touch, a press or keyboard focus on
//      or within 56 px of a link to the city. A plain <link rel=prefetch>: never blocking
import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync, rmSync, existsSync } from "node:fs";
import { join } from "node:path";

const TEXT = /\.(html|xml|txt|json|webmanifest|js)$/;

export function moveHome({ pub, SITE }) {
  const cityFile = join(pub, "index.html"), siteFile = join(pub, "site", "index.html");
  if (!existsSync(siteFile)) { console.warn("[home] no public/site/index.html: nothing moved"); return; }
  const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const S = esc(SITE);
  const toCity = (t, html) => {
    if (html) t = t.replace(/(\shref=")\/(?=["?#])/g, "$1/city/");
    t = t.replace(/(location\.(?:href|assign|replace)\s*(?:=\s*|\(\s*))(["'`])\/(?=\?)/g, "$1$2/city/");
    return t;
  };
  const siteToHome = (t) => t.replace(new RegExp(`(${S}|["'\`(=\\s])/site/`, "g"), "$1/");
  let n = 0;
  (function walk(d) {
    for (const f of readdirSync(d)) {
      const p = join(d, f);
      if (statSync(p).isDirectory()) { walk(p); continue; }
      if (!TEXT.test(f) || /\.(br|gz)$/.test(f)) continue;
      // the private pages and the old WordPress files are left as they are
      if (/[\\/](rapoarte|wp-content)[\\/]/.test(p)) continue;
      const t = readFileSync(p, "utf8"), html = /\.html$/.test(f);
      let o = toCity(t, html);
      if (p === cityFile) o = o.replace(/(["'(=])assets\//g, "$1/assets/");
      o = siteToHome(o);
      if (o !== t) { writeFileSync(p, o); n++; }
    }
  })(pub);
  // the map's own page: its canonical and og:url already say /city/ (src/head.html)
  const city = readFileSync(cityFile, "utf8"), home = readFileSync(siteFile, "utf8");
  mkdirSync(join(pub, "city"), { recursive: true });
  writeFileSync(join(pub, "city", "index.html"), city);
  // the prefetch of the map, on both home pages
  const app = /src="(\/assets\/app\.[\w]+\.js)"|s\.src="(\/assets\/app\.[\w]+\.js)"/.exec(city), css = /href="(\/assets\/styles\.[\w]+\.css)"/.exec(city);
  const urls = ["/city/", app && (app[1] || app[2]), css && css[1]].filter(Boolean);
  const pf = `<script>/* r356: the Cromatic City, fetched ahead (never blocking): desktop after load and idle; r382: a phone only on intent (a touch, a press or keyboard focus on or within 56 px of a link to the city), not when a section merely comes into view; never on Save-Data, 2g or 3g */(function(){var U=${JSON.stringify(urls)},c=navigator.connection||{},done=0;if(c.saveData||/(^|-)[23]g$/.test(c.effectiveType||""))return;function pf(){if(done)return;done=1;U.forEach(function(u){var l=document.createElement("link");l.rel="prefetch";l.href=u;if(/\\.js$/.test(u))l.as="script";else if(/\\.css$/.test(u))l.as="style";document.head.appendChild(l)})}function idle(f){if("requestIdleCallback" in window)requestIdleCallback(f,{timeout:4000});else setTimeout(f,2000)}var phone=matchMedia("(max-width: 860px), (pointer: coarse)").matches;if(!phone){var go=function(){setTimeout(function(){idle(pf)},1500)};if(document.readyState==="complete")go();else addEventListener("load",go,{once:true})}else{var Q='a[href^="/city/"],.hc-tour,.drive-cta',M=56,near=function(e){var t=e.target;if(t&&t.closest&&t.closest(Q))return true;var p=e.touches&&e.touches[0]?e.touches[0]:e;if(p.clientX==null)return false;var L=document.querySelectorAll(Q);for(var i=0;i<L.length;i++){var r=L[i].getBoundingClientRect();if(r.width&&p.clientX>r.left-M&&p.clientX<r.right+M&&p.clientY>r.top-M&&p.clientY<r.bottom+M)return true}return false},ev=["touchstart","pointerdown","focusin"],on=function(e){if(near(e)){ev.forEach(function(k){removeEventListener(k,on,true)});pf()}};ev.forEach(function(k){addEventListener(k,on,{capture:true,passive:true})})}})();</script>`;
  const addPf = (h) => (h.includes("r356: the Cromatic City, fetched ahead") ? h : h.replace(/<\/body>(?![\s\S]*<\/body>)/, `${pf}\n</body>`));
  writeFileSync(cityFile, addPf(home));
  rmSync(join(pub, "site"), { recursive: true, force: true });
  const ro = join(pub, "ro", "index.html");
  if (existsSync(ro)) writeFileSync(ro, addPf(readFileSync(ro, "utf8")));
  console.log(`[home] the website is "/" now, the map "/city/" (${n} files rewritten, prefetch: ${urls.join(", ")})`);
}
