// TASK-124: builds ops/www/index.html (the /ops mirror) from the Cromatic Ops dashboard (the artifact's HTML).
//   node ops/tools/build-www.mjs [path/to/dashboard/index.html]
// Default source: ~/cromatic-ops/dashboard/index.html (the same file the artifact is published from).
// Every patch must match exactly once; if the dashboard changed under a patch, the build stops and says which one.
import { readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { homedir } from "node:os";

const HERE = dirname(fileURLToPath(import.meta.url));
const SRC = process.argv[2] || join(homedir(), "cromatic-ops", "dashboard", "index.html");
const OUT = join(HERE, "..", "www", "index.html");
let h = readFileSync(SRC, "utf8");
// the artifact service wraps the page in its own skeleton; take the inner page if a read dump was given
h = h.replace(/^<!doctype html><html><head><meta charset=utf8>.*?<body>\n/s, "").replace(/\n?<\/body><\/html>\s*$/s, "");

const patches = [
  // 1. head: title, noindex, the mirror's stylesheet and the adapter (defines window.claude before the page script runs)
  ["head", /<title>[^<]*<\/title>/, () =>
    '<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">'
    + '<meta name="robots" content="noindex, nofollow, noarchive"><meta name="referrer" content="no-referrer">'
    + "<title>cromaticstudios.com ops</title>"
    + '<link rel="stylesheet" href="/ops/ops.css"><script src="/ops/adapter.js"></script>'],
  // 1b. attachments live in the artifact's asset store, not on this server: a placeholder instead of a broken image
  ["blob", 'const blobUrl = (a) => "/_blob/" + a.id;', () =>
    'const OPS_BLOB = "data:image/svg+xml," + encodeURIComponent(\'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 160 120"><rect width="160" height="120" fill="#e7e7e7"/><text x="80" y="58" font-family="sans-serif" font-size="12" text-anchor="middle" fill="#5e6168">fișier în</text><text x="80" y="74" font-family="sans-serif" font-size="12" text-anchor="middle" fill="#5e6168">artifact</text></svg>\');\n  const blobUrl = (a) => (window.__ops ? OPS_BLOB : "/_blob/" + a.id);'],
  // 2. no "read only" banner: in the mirror the edit controls become requests to Claude (patch 7)
  ["banner", 'banner("Vizualizare doar pentru citire.")', () => 'banner(window.__ops ? "" : "Vizualizare doar pentru citire.")'],
  // 3. a blocked write explains itself
  ["guard", 'else if (c === "quota_exceeded")', () => 'else if (c === "read_only") toast("Asta se cere lui Claude: scrie-i din „Spune-i lui Claude”.", "err");\n      else if (c === "quota_exceeded")'],
  // 4. feedback stays possible in the mirror (it goes to the inbox only; the coordinator writes it on the task)
  ["fb-gate", "if (!canWrite) return box;", () => "if (!canWrite && !window.__ops) return box;"],
  ["fb-send", 'await db.doc("tasks/" + t.id).update({ feedback: [...(t.feedback || []), entry], updatedAt: now() }); await inboxAdd("feedback", text, { id: t.id, verdict, points: pts });', () =>
    'if (!window.__ops) await db.doc("tasks/" + t.id).update({ feedback: [...(t.feedback || []), entry], updatedAt: now() }); await inboxAdd("feedback", text, { id: t.id, verdict, points: pts, ...(window.__ops ? { entry } : {}) });'],
  // 5. a bug: in the mirror only the inbox message, with the task it should become (the coordinator creates it)
  ["bug", 'await db.doc("tasks/" + id).set(doc); await inboxAdd("bug", (panic ? "BUG · PANICĂ: " : "Bug: ") + text, { id, priority: doc.priority, panic, attachments: att, ...(extra || {}) });', () =>
    'if (!window.__ops) await db.doc("tasks/" + id).set(doc); await inboxAdd("bug", (panic ? "BUG · PANICĂ: " : "Bug: ") + text, { id, priority: doc.priority, panic, attachments: att, ...(extra || {}), ...(window.__ops ? { task: doc } : {}) });'],
  // 6. Daniel's rule: a colleague's bug can be flagged "Important / blochează lucrul" -> P0 (replaces Normal/Panică in the mirror)
  ["bug-imp-ui", '<div class="strip" id="bug-strip" hidden></div>', () =>
    '<div class="strip" id="bug-strip" hidden></div>\n  <label class="ops-imp"><input type="checkbox" id="bug-imp"> <span><b>Important / blochează lucrul</b> · intră ca P0, primul pe listă</span></label>'],
  ["bug-imp-js", 'const ok = await submitBug(text, bugLvl === "panic", bugAtt.slice(), { page, device });', () =>
    'const imp = !!($("bug-imp") && $("bug-imp").checked); const ok = await submitBug(text, bugLvl === "panic" || imp, bugAtt.slice(), { page, device, ...(window.__ops ? { important: imp || bugLvl === "panic" } : {}) });'],
  ["bug-imp-reset", 'setLvl("normal"); setPop(""); }', () => 'setLvl("normal"); if ($("bug-imp")) $("bug-imp").checked = false; setPop(""); }'],
  // 7. in the mirror an edit control is a request: it opens "Spune-i lui Claude" prefilled with a precise command
  ["ask-fn", "const setTask = (id, patch, why, okText) => guard(", () =>
    `function opsAsk(id, patch) {
    const t = S.tasks.find((x) => x.id === id), p = patch || {}, parts = [];
    if (p.deleted) parts.push("șterge task-ul");
    if (p.status) parts.push("mută în „" + (SLAB[p.status] || p.status) + "”");
    if (p.priority) parts.push("prioritate " + p.priority);
    if ("agent" in p) { const m = S.team.find((x) => x.id === p.agent); parts.push(m ? "dă-l lui " + m.name : "fără agent"); }
    if ("epicId" in p) { const e = S.epics.find((x) => x.id === p.epicId); parts.push(e ? "mută în epicul „" + e.title + "”" : "scoate-l din epic"); }
    const text = id + ": " + parts.join(", ") + (parts.length && t ? " · " + t.title : "");
    if (!$("drawer").hidden) closeDrawer();
    setPop("claude"); const q = $("q-text"); q.value = text;
    setTimeout(() => { q.focus({ preventScroll: true }); q.setSelectionRange(q.value.length, q.value.length); }, 60);
    return Promise.resolve(false);
  }
  const setTask = (id, patch, why, okText) => window.__ops ? opsAsk(id, patch) : guard(`],
  ["ask-move", "function confirmMove(t, to) {", () => "function confirmMove(t, to) {\n    if (window.__ops) { closeMenu(); return opsAsk(t.id, { status: to }); }"],
  ["ask-del", "function confirmDelete(t) {", () => "function confirmDelete(t) {\n    if (window.__ops) { closeMenu(); return opsAsk(t.id, { deleted: true }); }"],
  ["ask-opts", "if (!canWrite) o.disabled = true;", () => "if (!canWrite && !window.__ops) o.disabled = true;"],
  ["ask-epic", "if (!canWrite) ep.disabled = true;", () => "if (!canWrite && !window.__ops) ep.disabled = true;"],
  ["ask-agent", "if (!canWrite) ag.disabled = true;", () => "if (!canWrite && !window.__ops) ag.disabled = true;"],
  ["ask-card", "    if (canWrite) {\n      // Daniel's own tasks close by his hand", () => "    if (canWrite || window.__ops) {\n      // Daniel's own tasks close by his hand"],
  ["ask-close", "if (canWrite) { const opts2 = closeOpts(t);", () => "if (canWrite || window.__ops) { const opts2 = closeOpts(t);"],
  ["ask-foot", "r.append(dl, sv); f.append(startBox(t), r);\n    }", () =>
    'r.append(dl, sv); f.append(startBox(t), r);\n    }\n    else if (window.__ops) { const rq = el("button", "btn sm k"); rq.type = "button"; rq.append(icon("i-send"), el("span", "", "Cere modificarea")); rq.onclick = () => opsAsk(t.id, {}); f.append(rq); }'],
];

for (const [name, find, rep] of patches) {
  const n = typeof find === "string" ? h.split(find).length - 1 : (h.match(new RegExp(find.source, "g")) || []).length;
  if (n !== 1) { console.error(`[build-www] patch "${name}" matched ${n} times (expected 1). The dashboard changed: update ops/tools/build-www.mjs.`); process.exit(1); }
  h = h.replace(find, rep);
}
if (/[?&]t=[A-Za-z0-9_-]{12,}/.test(h)) { console.error("[build-www] the page contains what looks like a token link: refusing to build"); process.exit(1); }
writeFileSync(OUT, "<!doctype html>\n<html lang=\"ro\"><head>\n" + h.replace(/<\/script>\s*$/, "</script>") + "\n</html>\n");
console.log(`[build-www] ${OUT} (${(Buffer.byteLength(h) / 1024).toFixed(0)} KB) from ${SRC}`);
