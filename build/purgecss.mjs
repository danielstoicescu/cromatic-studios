// r399 (audit 29 Oct: /city/'s styles.css was 383 KB, 82-86% of it unused): drops the rules of the map's stylesheet whose
// selectors name a class or an id that nothing in the page can ever put there. "Nothing" is read from the text the page
// is made of (the bundle, the HTML, the inline loader, the build's own snippets): a class or id survives if its name is
// written anywhere in that text, or starts or ends with a piece the code glues names from ("op" + i, `w-${id}`, ...),
// or matches SAFE below. Conservative on purpose: classes inside :not(), :is(), :where(), :has() and the other
// parentheses are not looked at (such a rule stays), element and attribute selectors always stay, and @font-face,
// @keyframes and @property blocks are kept whole. Pure text in, text out; nothing runs in the browser.
export function purgeCss(css, corpus, { safe = [] } = {}) {
  const words = new Set(corpus.match(/[A-Za-z_][\w-]*/g) || []);
  // pieces names are glued from: a string ending in "-" before a + or a ${, and "-x" right after a }
  const pre = new Set(), suf = new Set();
  for (const m of corpus.matchAll(/([A-Za-z_][\w-]*)(?=\$\{|["'`]\s*\+)/g)) pre.add(m[1]); // ("op" + i, `w-${id}`)
  for (const m of corpus.matchAll(/\}(-[\w-]+)/g)) suf.add(m[1]);
  for (const m of corpus.matchAll(/\+\s*["'`](-[\w-]+)/g)) suf.add(m[1]);
  const P = [...pre].filter((p) => p.length >= 2), S = [...suf].filter((s) => s.length >= 3);
  const known = (n) => words.has(n) || P.some((p) => n.startsWith(p)) || S.some((s) => n.endsWith(s)) || safe.some((r) => r.test(n));
  // a selector list survives if one of its selectors can match
  const top = (sel) => { let d = 0, out = ""; for (let i = 0; i < sel.length; i++) { const c = sel[i]; if (c === "(" || c === "[") d++; else if (c === ")" || c === "]") d--; else if (!d) out += c; if (d && (c === "(" || c === "[")) out += " "; } return out; };
  const splitTop = (s) => { const r = []; let d = 0, cur = "", q = null; for (const c of s) { if (q) { cur += c; if (c === q) q = null; continue; } if (c === '"' || c === "'") { q = c; cur += c; continue; } if (c === "(" || c === "[") d++; else if (c === ")" || c === "]") d--; if (c === "," && !d) { r.push(cur); cur = ""; } else cur += c; } r.push(cur); return r; };
  const can = (sel) => { const t = top(sel); for (const m of t.matchAll(/[.#](-?[A-Za-z_][\w-]*)/g)) if (!known(m[1])) return false; return true; };
  let dropped = 0, kept = 0; const gone = [];
  // walk the stylesheet: blocks are "prelude{body}"; strings and parentheses are skipped over
  const walk = (s) => {
    let out = "", i = 0;
    while (i < s.length) {
      let j = i, q = null, d = 0;
      while (j < s.length) { const c = s[j]; if (q) { if (c === "\\") j++; else if (c === q) q = null; } else if (c === '"' || c === "'") q = c; else if (c === "(") d++; else if (c === ")") d--; else if (!d && (c === "{" || c === ";" || c === "}")) break; j++; }
      if (j >= s.length) { out += s.slice(i); break; }
      if (s[j] === ";" || s[j] === "}") { out += s.slice(i, j + 1); i = j + 1; continue; } // a statement (@import, @charset) or a stray brace
      const prelude = s.slice(i, j).trim();
      let k = j + 1, depth = 1; q = null;
      while (k < s.length && depth) { const c = s[k]; if (q) { if (c === "\\") k++; else if (c === q) q = null; } else if (c === '"' || c === "'") q = c; else if (c === "{") depth++; else if (c === "}") depth--; k++; }
      const body = s.slice(j + 1, k - 1);
      if (prelude[0] === "@") {
        if (/^@(media|supports|layer|container|document)\b/i.test(prelude)) { const inner = walk(body); if (inner.trim()) out += `${prelude}{${inner}}`; }
        else out += `${prelude}{${body}}`; // @font-face, @keyframes, @property, @page: whole
      } else {
        const keep = splitTop(prelude).filter(can);
        if (keep.length < splitTop(prelude).length) gone.push(...splitTop(prelude).filter((x) => !can(x)));
        if (keep.length) { out += `${keep.join(",")}{${body}}`; kept++; } else dropped++;
      }
      i = k;
    }
    return out;
  };
  const out = walk(css);
  return { css: out, dropped, kept, gone, prefixes: P.length, suffixes: S.length };
}
