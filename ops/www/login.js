// TASK-124 · /ops login: email -> 6-digit code -> session cookie (set by the server). Nothing secret lives here.
(() => {
  "use strict";
  const $ = (id) => document.getElementById(id);
  try { const t = localStorage.getItem("ops-theme"); if (t === "dark" || t === "light") document.documentElement.dataset.theme = t; } catch {}
  let email = "", busy = false;
  const post = async (path, body) => {
    const r = await fetch(path, { method: "POST", credentials: "same-origin", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    let j = {}; try { j = await r.json(); } catch {}
    return { status: r.status, ...j };
  };
  const msg = (id, text, err) => { const m = $(id); m.textContent = text || ""; m.classList.toggle("err", !!err); };
  const show = (code) => { $("step-email").hidden = code; $("step-code").hidden = !code; (code ? $("code") : $("email")).focus(); };

  $("f-email").onsubmit = async (e) => {
    e.preventDefault();
    const v = $("email").value.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v)) { msg("m-email", "Scrie un email valid.", true); $("email").focus(); return; }
    const b = $("b-email"); b.disabled = true; msg("m-email", "Se trimite…");
    try {
      const r = await post("/api/ops/login", { email: v });
      if (r.status === 429) { msg("m-email", "Prea multe încercări. Mai încearcă peste 15 minute.", true); return; }
      if (!r.ok) { msg("m-email", "Nu a mers. Mai încearcă o dată.", true); return; }
      email = v; $("to").textContent = v; msg("m-email", ""); $("code").value = ""; msg("m-code", ""); show(true);
    } catch { msg("m-email", "Fără conexiune. Mai încearcă.", true); }
    finally { b.disabled = false; }
  };
  $("f-code").onsubmit = async (e) => {
    e.preventDefault();
    if (busy) return;
    const c = $("code").value.replace(/\D/g, "");
    if (c.length !== 6) { msg("m-code", "Codul are 6 cifre.", true); $("code").focus(); return; }
    const b = $("b-code"); b.disabled = true; busy = true; msg("m-code", "Se verifică…");
    try {
      const r = await post("/api/ops/verify", { email, code: c });
      if (r.ok) { msg("m-code", "Gata. Intri…"); location.replace("/ops"); return; }
      if (r.status === 429) msg("m-code", "Prea multe încercări. Mai încearcă peste 15 minute.", true);
      else if (r.error === "code") msg("m-code", "Cod greșit. Mai ai " + r.left + (r.left === 1 ? " încercare." : " încercări."), true);
      else if (r.error === "locked") msg("m-code", "Prea multe coduri greșite. Cere unul nou.", true);
      else msg("m-code", "Codul a expirat sau nu e valid. Cere unul nou.", true);
      $("code").select();
    } catch { msg("m-code", "Fără conexiune. Mai încearcă.", true); }
    finally { b.disabled = false; busy = false; const v = $("code").value.replace(/\D/g, ""); if (v.length === 6 && v !== c) $("f-code").requestSubmit(); }
  };
  $("code").addEventListener("input", () => { const v = $("code").value.replace(/\D/g, ""); if (v.length === 6) $("f-code").requestSubmit(); });
  $("back").onclick = () => { show(false); };
})();
