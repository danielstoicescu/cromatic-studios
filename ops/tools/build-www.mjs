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
    'if (window.__opsUp && window.__opsUp.busy("bug")) { toast("Așteaptă să se încarce fișierele.", "err"); btn.disabled = false; btn.innerHTML = old; return; }\n    const imp = !!($("bug-imp") && $("bug-imp").checked); const ok = await submitBug(text + (window.__opsUp ? window.__opsUp.textSuffix("bug") : ""), bugLvl === "panic" || imp, bugAtt.slice(), { page, device, ...(window.__ops ? { important: imp || bugLvl === "panic" } : {}), ...(window.__opsUp ? window.__opsUp.payload("bug") : {}) });'],
  ["bug-imp-reset", 'setLvl("normal"); setPop(""); }', () => 'setLvl("normal"); if ($("bug-imp")) $("bug-imp").checked = false; if (window.__opsUp) window.__opsUp.reset("bug"); setPop(""); }'],
  // 7. in the mirror an edit (status, priority, agent, epic; a drag on the board) applies at once and goes to Claude
  //    by itself as a "task-edit" command; the card wears an "în procesare" pill until a snapshot confirms it.
  //    Delete and "Cere modificarea" still open "Spune-i lui Claude" prefilled, for the user to send.
  ["ask-fn", "const setTask = (id, patch, why, okText) => guard(", () =>
    `function opsText(id, p) {
    const t = S.tasks.find((x) => x.id === id), parts = [];
    if (p.deleted) parts.push("șterge task-ul");
    if (p.status) parts.push("mută în „" + (SLAB[p.status] || p.status) + "”");
    if (p.priority) parts.push("prioritate " + p.priority);
    if ("agent" in p) { const m = S.team.find((x) => x.id === p.agent); parts.push(m ? "dă-l lui " + m.name : "fără agent"); }
    if ("epicId" in p) { const e = S.epics.find((x) => x.id === p.epicId); parts.push(e ? "mută în epicul „" + e.title + "”" : "scoate-l din epic"); }
    return id + ": " + parts.join(", ") + (parts.length && t ? " · " + t.title : "");
  }
  function opsAsk(id, patch) {
    const text = opsText(id, patch || {});
    if (!$("drawer").hidden) closeDrawer();
    setPop("claude"); const q = $("q-text"); q.value = text;
    setTimeout(() => { q.focus({ preventScroll: true }); q.setSelectionRange(q.value.length, q.value.length); }, 60);
    return Promise.resolve(false);
  }
  const OPS_FIELDS = ["status", "priority", "agent", "epicId"];
  function opsEdit(id, field, to) {
    const t = S.tasks.find((x) => x.id === id); if (!t) return Promise.resolve(false);
    const from = field === "status" ? norm(t.status) : (t[field] ?? "");
    if (String(from) === String(to ?? "")) return Promise.resolve(false);
    return guard(() => inboxAdd("command", opsText(id, { [field]: to }), { type: "task-edit", taskId: id, field, from, to: to ?? "" }));
  }
  function opsPatch(id, patch) { const k = Object.keys(patch || {}).filter((x) => OPS_FIELDS.includes(x)); return k.length === 1 && Object.keys(patch).length === 1 ? opsEdit(id, k[0], patch[k[0]]) : opsAsk(id, patch); }
  // a card dropped on its own column (or outside the board) just settles back
  function opsSnap(id) { const c = document.querySelector('.card[data-task="' + id + '"]'); if (!c) return; c.classList.remove("ops-snap"); void c.offsetWidth; c.classList.add("ops-snap"); setTimeout(() => c.classList.remove("ops-snap"), 700); }
  window.__opsMove = (id, k) => { const t = S.tasks.find((x) => x.id === id); if (t && k && norm(t.status) !== k) confirmMove(t, k); else opsSnap(id); };
  window.__opsToast = (m, k) => toast(m, k);
  const setTask = (id, patch, why, okText) => window.__ops ? opsPatch(id, patch) : guard(`],
  ["ask-move", "function confirmMove(t, to) {", () => "function confirmMove(t, to) {\n    if (window.__ops) { closeMenu(); return opsEdit(t.id, \"status\", to); }"],
  ["pill", "      c.append(a);\n    }\n    return c;\n  }\n  function renderBoard(box) {", () =>
    "      c.append(a);\n    }\n    if (window.__opsPill) window.__opsPill(c, t);\n    return c;\n  }\n  function renderBoard(box) {"],
  ["drag-card", 'if (canWrite && matchMedia("(pointer: fine)").matches) { c.draggable = true;', () => 'if ((canWrite || window.__ops) && matchMedia("(pointer: fine)").matches) { c.draggable = true;'],
  ["drag-lane", "if (canWrite) { lane.ondragover", () => "lane.dataset.st = k; if (canWrite || window.__ops) { lane.ondragover"],
  ["ask-del", "function confirmDelete(t) {", () => "function confirmDelete(t) {\n    if (window.__ops) { closeMenu(); return opsAsk(t.id, { deleted: true }); }"],
  ["ask-opts", "if (!canWrite) o.disabled = true;", () => "if (!canWrite && !window.__ops) o.disabled = true;"],
  ["ask-epic", "if (!canWrite) ep.disabled = true;", () => "if (!canWrite && !window.__ops) ep.disabled = true;"],
  ["ask-agent", "if (!canWrite) ag.disabled = true;", () => "if (!canWrite && !window.__ops) ag.disabled = true;"],
  ["ask-card", "    if (canWrite) {\n      // Daniel's own tasks close by his hand", () => "    if (canWrite || window.__ops) {\n      // Daniel's own tasks close by his hand"],
  ["ask-close", "if (canWrite) { const opts2 = closeOpts(t);", () => "if (canWrite || window.__ops) { const opts2 = closeOpts(t);"],
  ["ask-foot", "r.append(dl, sv); f.append(startBox(t), r);\n    }", () =>
    'r.append(dl, sv); f.append(startBox(t), r);\n    }\n    else if (window.__ops) { const rq = el("button", "btn sm k"); rq.type = "button"; rq.append(icon("i-send"), el("span", "", "Cere modificarea")); rq.onclick = () => opsAsk(t.id, {}); f.append(rq); }'],
  // 8. uploads + video links (TASK-124): a drop zone in the composer, the quick composer, the bug report and Conținut;
  //    the command carries {uploads, videoLinks} and the links in its text
  ["up-cmd-slot", '<div class="strip" id="cmd-strip" hidden></div>', () => '<div class="strip" id="cmd-strip" hidden></div>\n        <div data-up-slot="cmd"></div>'],
  ["up-q-slot", /<textarea id="q-text"[^>]*><\/textarea>/, (m) => m + '\n  <div data-up-slot="q"></div>'],
  ["up-bug-slot", '<span><b>Important / blochează lucrul</b> · intră ca P0, primul pe listă</span></label>', () => '<span><b>Important / blochează lucrul</b> · intră ca P0, primul pe listă</span></label>\n  <div data-up-slot="bug"></div>'],
  ["up-cmd-text", 'const text = $("cmd-text").value.trim() || (cmdAtt.length ? "(vezi atașamentele)" : ""); if (!text) { $("cmd-text").focus(); return; }', () =>
    'if (window.__opsUp && window.__opsUp.busy("cmd")) { toast("Așteaptă să se încarce fișierele.", "err"); return; }\n    const text = ($("cmd-text").value.trim() || (cmdAtt.length || (window.__opsUp && window.__opsUp.count("cmd")) ? "(vezi fișierele)" : "")); if (!text) { $("cmd-text").focus(); return; }'],
  ["up-cmd-send", 'const att = cmdAtt.slice(); const ok = await guard(() => inboxAdd("command", text, att.length ? { attachments: att } : null), ', () =>
    'const att = cmdAtt.slice(), up = window.__opsUp ? window.__opsUp.payload("cmd") : {}; const ok = await guard(() => inboxAdd("command", text + (window.__opsUp ? window.__opsUp.textSuffix("cmd") : ""), att.length || Object.keys(up).length ? { ...(att.length ? { attachments: att } : {}), ...up } : null), '],
  ["up-cmd-reset", 'if (ok) { $("cmd-text").value = ""; $("cmd-preview").hidden = true; cmdAtt = []; renderStrip(); }', () =>
    'if (ok) { $("cmd-text").value = ""; $("cmd-preview").hidden = true; cmdAtt = []; renderStrip(); if (window.__opsUp) window.__opsUp.reset("cmd"); }'],
  ["up-q", 'const tx = $("q-text"), text = tx.value.trim(); if (!text) { tx.focus(); return; }', () =>
    'if (window.__opsUp && window.__opsUp.busy("q")) { toast("Așteaptă să se încarce fișierele.", "err"); return; }\n    const tx = $("q-text"), text = tx.value.trim() || (window.__opsUp && window.__opsUp.count("q") ? "(vezi fișierele)" : ""); if (!text) { tx.focus(); return; }'],
  ["up-q-send", 'const ok = await guard(() => inboxAdd("command", text, null), "Trimis. Urmărește progresul în Conversație.");', () =>
    'const qup = window.__opsUp ? window.__opsUp.payload("q") : {}; const ok = await guard(() => inboxAdd("command", text + (window.__opsUp ? window.__opsUp.textSuffix("q") : ""), Object.keys(qup).length ? qup : null), "Trimis. Urmărește progresul în Conversație."); if (ok && window.__opsUp) window.__opsUp.reset("q");'],
  ["up-ct-slot", '    body.append(el("div", "mono muted", "Ajunge la Claude ca mesaj în Conversație. Pe card apare ca cerere în așteptare până o rezolvă."));', () =>
    '    if (window.__opsUp) { const upw = window.__opsUp.mount("ct", { fresh: true, open: /^(logo|cover|gallery|video)$/.test(sel.value), kind: sel.value === "logo" ? "logo" : "visual" }); const f4 = el("div", "field"); f4.append(el("label", "", sel.value === "video" ? "Fișier sau link video" : "Fișiere și linkuri (opțional)"), upw); body.append(f4); }\n    body.append(el("div", "mono muted", "Ajunge la Claude ca mesaj în Conversație. Pe card apare ca cerere în așteptare până o rezolvă."));'],
  ["up-ct-check", 'if (!v && !att.length) { val.focus();', () => 'if (window.__opsUp && window.__opsUp.busy("ct")) { toast("Așteaptă să se încarce fișierele.", "err"); return; }\n      if (!v && !att.length && !(window.__opsUp && window.__opsUp.count("ct"))) { val.focus();'],
  ["up-ct-send", 'inboxAdd("command", text, { type: "content-change", slug, field, value: v, assets: att.map((a) => a.id) })', () =>
    'inboxAdd("command", text + (window.__opsUp ? window.__opsUp.textSuffix("ct") : ""), { type: "content-change", slug, field, value: v, assets: att.map((a) => a.id), ...(window.__opsUp ? window.__opsUp.payload("ct") : {}) })'],
];

for (const [name, find, rep] of patches) {
  const n = typeof find === "string" ? h.split(find).length - 1 : (h.match(new RegExp(find.source, "g")) || []).length;
  if (n !== 1) { console.error(`[build-www] patch "${name}" matched ${n} times (expected 1). The dashboard changed: update ops/tools/build-www.mjs.`); process.exit(1); }
  h = h.replace(find, rep);
}
if (/[?&]t=[A-Za-z0-9_-]{12,}/.test(h)) { console.error("[build-www] the page contains what looks like a token link: refusing to build"); process.exit(1); }
writeFileSync(OUT, "<!doctype html>\n<html lang=\"ro\"><head>\n" + h.replace(/<\/script>\s*$/, "</script>") + "\n</html>\n");
console.log(`[build-www] ${OUT} (${(Buffer.byteLength(h) / 1024).toFixed(0)} KB) from ${SRC}`);
