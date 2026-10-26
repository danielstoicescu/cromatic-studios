/* Baxx Auto Tech, prototip UX: comportamentul comun al paginilor. Varianta luminoasă și notele de proiect rămân alese de la o pagină la alta. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s), $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const store = { get(k) { try { return JSON.parse(localStorage.getItem(k)); } catch (e) { return null; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* varianta luminoasă, aceeași cheie ca pe pagina Test drive */
  const tb = $('#themeBtn');
  const setTheme = on => { document.documentElement.classList.toggle('light', on); if (tb) tb.setAttribute('aria-pressed', on); store.set('baxx-theme', on ? 'light' : 'dark'); };
  if (tb) tb.addEventListener('click', () => setTheme(tb.getAttribute('aria-pressed') !== 'true'));
  if (store.get('baxx-theme') === 'light') setTheme(true);

  /* note de proiect */
  const nb = $('#notesBtn');
  if (nb) nb.addEventListener('click', () => { const on = nb.getAttribute('aria-pressed') !== 'true'; nb.setAttribute('aria-pressed', on); document.body.classList.toggle('notes', on); });

  /* intrări la derulare: armate doar după primul scroll, ca pagina să fie completă și fără ele */
  let armed = false;
  addEventListener('scroll', () => {
    if (armed || reduce || !('IntersectionObserver' in window)) return; armed = true;
    $$('.rv').forEach(el => {
      if (el.getBoundingClientRect().top < innerHeight * .9) return;
      el.classList.add('armed');
      const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { io.disconnect(); requestAnimationFrame(() => el.classList.remove('armed')); } }), { threshold: .2 });
      io.observe(el);
    });
  }, { passive: true, once: true });

  /* bara mobilă: apare după primul ecran, se ascunde lângă ținta ei */
  const mbar = $('#mbar');
  if (mbar) {
    const target = $(mbar.dataset.hide || '#none');
    const on = () => { const r = target && target.getBoundingClientRect(); mbar.classList.toggle('on', scrollY > 500 && !(r && r.top < innerHeight && r.bottom > 0)); };
    addEventListener('scroll', on, { passive: true }); on();
  }

  /* meniul pe telefon și tabletă */
  (() => {
    const menu = document.querySelector('.site .menu'); if (!menu) return;
    const b = document.createElement('button'); b.type = 'button'; b.className = 'navbtn'; b.setAttribute('aria-expanded', 'false'); b.setAttribute('aria-controls', 'mainmenu'); b.innerHTML = 'Meniu <i aria-hidden="true"></i>';
    menu.id = 'mainmenu'; menu.after(b);
    const set = on => { menu.classList.toggle('open', on); b.setAttribute('aria-expanded', on); };
    b.addEventListener('click', e => { e.stopPropagation(); set(!menu.classList.contains('open')); });
    menu.addEventListener('click', e => { if (e.target.closest('a')) set(false); });
    document.addEventListener('click', e => { if (!e.target.closest('.site')) set(false); });
    addEventListener('keydown', e => { if (e.key === 'Escape' && menu.classList.contains('open')) { set(false); b.focus(); } });
  })();

  window.BAXX = { $, $$, store, reduce };
})();
