// r440 (beta, TASK-151, Coz 2 Nov): the sentence filter's two choices ("Show me [all the work] on [every street]", in the
// Work mega menu and on /streetindex/) open the site's own list instead of the browser's: paper, ink, the yellow.
// A listbox button over the real <select>: the select stays in the form, hidden, and keeps the value the filters read;
// a choice sets it and fires input + change, so megamenu.js and si.js work as before. Without the script, the select.
// Keys: Down/Up/Enter/Space open it; inside, Up/Down/Home/End/PageUp/PageDown walk, letters jump, Enter/Space choose,
// Esc closes back to the button, Tab closes and moves on. A click outside or the focus leaving closes it.
(() => {
  const d = document, SEL = ".mm-sel select, .si-sel select";
  const proto = Object.getOwnPropertyDescriptors(HTMLSelectElement.prototype);
  let n = 0, openOne = null;

  function enhance(sel) {
    if (sel.dataset.csel) return;
    sel.dataset.csel = "1";
    const id = `csel${++n}`, lab = sel.closest("label");
    // a <label> around a button would forward every click inside the list to it: the wrapper becomes a span
    let wrap = lab;
    if (lab) { wrap = d.createElement("span"); wrap.className = lab.className; lab.replaceWith(wrap); wrap.append(...lab.childNodes); }
    else { wrap = d.createElement("span"); sel.before(wrap); wrap.append(sel); }
    wrap.classList.add("csel");
    const sr = wrap.querySelector(".mm-sr, .si-sr"); if (sr && !sr.id) sr.id = `${id}-l`;
    const btn = d.createElement("button"), val = d.createElement("span"), list = d.createElement("div");
    btn.type = "button"; btn.className = "csel-btn"; btn.id = `${id}-b`;
    btn.setAttribute("aria-haspopup", "listbox"); btn.setAttribute("aria-expanded", "false"); btn.setAttribute("aria-controls", `${id}-p`);
    val.className = "csel-v"; val.id = `${id}-v`; btn.append(val);
    btn.setAttribute("aria-labelledby", `${sr ? sr.id + " " : ""}${val.id}`);
    list.className = "csel-p"; list.id = `${id}-p`; list.setAttribute("role", "listbox"); list.tabIndex = -1; list.hidden = true;
    if (sr) list.setAttribute("aria-labelledby", sr.id);
    sel.hidden = true; sel.tabIndex = -1; sel.setAttribute("aria-hidden", "true");
    sel.after(btn, list);

    let active = -1, buf = "", tBuf = 0;
    const opts = () => [...list.children];
    const sync = () => { const o = sel.options[proto.selectedIndex.get.call(sel)]; val.textContent = o ? o.text : ""; };
    // the menu's own code sets the value directly (Reset, "Show all the work"): the button follows
    for (const k of ["value", "selectedIndex"]) Object.defineProperty(sel, k, { configurable: true, get() { return proto[k].get.call(this); }, set(v) { proto[k].set.call(this, v); sync(); } });
    sel.addEventListener("change", sync);
    sel.form && sel.form.addEventListener("reset", () => setTimeout(sync));

    const build = () => {
      // read on every open: megamenu.js puts the options into the page's language after the build
      const cur = proto.selectedIndex.get.call(sel);
      list.replaceChildren(...[...sel.options].map((o, i) => {
        const el = d.createElement("div");
        el.className = "csel-o"; el.id = `${id}-o${i}`; el.setAttribute("role", "option");
        el.setAttribute("aria-selected", String(i === cur)); el.dataset.i = i;
        const t = d.createElement("span"); t.textContent = o.text; el.append(t);
        return el;
      }));
    };
    const mark = (i, scroll = true) => {
      const os = opts(); if (!os.length) return;
      active = Math.max(0, Math.min(os.length - 1, i));
      os.forEach((o, k) => o.classList.toggle("on", k === active));
      list.setAttribute("aria-activedescendant", os[active].id);
      if (scroll) os[active].scrollIntoView({ block: "nearest" });
    };
    // where it fits: under the words, inside the screen (and inside the menu's own scroller), up when below is short
    const place = () => {
      list.classList.remove("up"); list.style.left = list.style.maxHeight = list.style.maxWidth = "";
      const vw = d.documentElement.clientWidth, g = vw < 600 ? 16 : 24;
      const sc = btn.closest(".mm-scroll"), r = btn.getBoundingClientRect(), wr = wrap.getBoundingClientRect();
      const top = Math.max(sc ? sc.getBoundingClientRect().top : 0, 0), bot = Math.min(sc ? sc.getBoundingClientRect().bottom : innerHeight, innerHeight);
      list.style.maxWidth = `${vw - g * 2}px`;
      const h = list.scrollHeight + 2, below = bot - r.bottom - 14, above = r.top - top - 14;
      const up = h > below && above > below;
      list.classList.toggle("up", up);
      list.style.maxHeight = `${Math.max(160, Math.floor(up ? above : below))}px`;
      const w = list.getBoundingClientRect().width;
      let x = 0; if (wr.left + w > vw - g) x = vw - g - w - wr.left; if (wr.left + x < g) x = g - wr.left;
      list.style.left = `${Math.round(x)}px`;
    };
    const show = (at) => {
      if (openOne && openOne !== close) openOne(false);
      build(); list.hidden = false; wrap.classList.add("open"); btn.setAttribute("aria-expanded", "true");
      place(); mark(at == null ? proto.selectedIndex.get.call(sel) : at, false);
      list.focus({ preventScroll: true });
      requestAnimationFrame(() => { list.classList.add("in"); opts()[active] && opts()[active].scrollIntoView({ block: "nearest" }); });
      openOne = close;
    };
    function close(back) {
      if (list.hidden) return;
      list.hidden = true; list.classList.remove("in", "up"); wrap.classList.remove("open"); btn.setAttribute("aria-expanded", "false");
      list.removeAttribute("aria-activedescendant");
      if (openOne === close) openOne = null;
      if (back) btn.focus({ preventScroll: true });
    }
    const choose = (i) => {
      const was = proto.selectedIndex.get.call(sel);
      close(true);
      if (i === was || i < 0) return;
      proto.selectedIndex.set.call(sel, i); sync();
      sel.dispatchEvent(new Event("input", { bubbles: true }));
      sel.dispatchEvent(new Event("change", { bubbles: true }));
    };
    // type-ahead: the letters typed within half a second find the next option that starts with them
    const seek = (ch) => {
      clearTimeout(tBuf); buf += ch.toLowerCase(); tBuf = setTimeout(() => (buf = ""), 500);
      const os = [...sel.options].map((o) => o.text.toLowerCase()), from = list.hidden ? proto.selectedIndex.get.call(sel) : active;
      const same = buf.split("").every((c) => c === buf[0]), q = same ? buf[0] : buf;
      for (let k = 1; k <= os.length; k++) { const i = (from + (same || buf.length === 1 ? k : k - 1) + os.length) % os.length; if (os[i].startsWith(q)) return i; }
      return -1;
    };

    btn.addEventListener("click", () => (list.hidden ? show() : close(true)));
    btn.addEventListener("keydown", (e) => {
      if (/^(ArrowDown|ArrowUp|Enter| |Home|End)$/.test(e.key)) { e.preventDefault(); e.stopPropagation(); show(e.key === "Home" ? 0 : e.key === "End" ? sel.options.length - 1 : undefined); return; }
      if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) { const i = seek(e.key); if (i >= 0) { e.preventDefault(); show(i); } }
    });
    list.addEventListener("keydown", (e) => {
      const os = opts(), page = 5;
      const go = { ArrowDown: active + 1, ArrowUp: active - 1, Home: 0, End: os.length - 1, PageDown: active + page, PageUp: active - page }[e.key];
      // stopPropagation: the menu's own keys (Esc closes the whole menu, the arrows walk the names) wait outside
      if (go != null) { e.preventDefault(); e.stopPropagation(); mark(go); return; }
      if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); choose(active); return; }
      if (e.key === "Escape") { e.preventDefault(); e.stopPropagation(); close(true); return; }
      if (e.key === "Tab") { close(true); return; } // the focus is back on the button, so Tab carries on from there
      if (e.key.length === 1 && !e.metaKey && !e.ctrlKey && !e.altKey) { const i = seek(e.key); e.preventDefault(); e.stopPropagation(); if (i >= 0) mark(i); }
    });
    list.addEventListener("pointermove", (e) => { const o = e.target.closest(".csel-o"); if (o && +o.dataset.i !== active) mark(+o.dataset.i, false); });
    list.addEventListener("click", (e) => { const o = e.target.closest(".csel-o"); if (o) choose(+o.dataset.i); });
    wrap.addEventListener("focusout", (e) => { if (!list.hidden && !wrap.contains(e.relatedTarget)) close(false); });
    sync();
  }

  const outside = (e) => { if (!openOne) return; const w = e.target.closest && e.target.closest(".csel.open"); if (!w) openOne(false); };
  d.addEventListener("pointerdown", outside, true);
  addEventListener("resize", () => openOne && openOne(false));
  const boot = () => d.querySelectorAll(SEL).forEach(enhance);
  if (d.readyState === "loading") d.addEventListener("DOMContentLoaded", boot); else boot();
})();
