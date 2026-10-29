// r359 (Daniel, 28 Oct): the boarding pass, redesigned, and at the end of every content page of the website.
// One ticket for the home pages, the hubs, the services, the team, every case page, /onboarding/ and the landings, in
// English and in Romanian (the words are here, not in site/i18n/ro.json: the pass is filled in after the Romanian pages
// are made, build/build.mjs, the walk over public/). Self-contained: its own CSS and script, scoped under .czp, so a case
// page with its own styles shows it the same. The same fields, the same payload to POST /api/boarding, the same mail
// fallback and 429 message as the pass it replaces (site.js, r135 to r309).
// The ticket: the main part (route You -> Olari 9, three questions as chips, the passenger fields with floating labels)
// and the stub behind a perforation (gate, seat, boarding, a barcode, the booking reference). Inline validation on blur
// and on submit (aria-invalid, the message tied to its field). On success the stub tears off, a stamp lands and the
// main part becomes the filled-in pass. Nothing moves with reduced motion.
// r387 (Daniel: "it's rather tall. Let's use the space differently, maybe it takes 2/3 of the width"): the compact pass.
// The ticket takes 2/3 of the width beside the call (1/3); a slim route; the three questions in a tight grid (business
// and take-off side by side when the ticket is wide enough, a container query on the ticket, so the home's own column and
// the landings get the same); the passenger fields in two columns; the button lives in the stub, under the barcode. The
// stub is no longer aria-hidden as a whole (it holds the button), its decorations are. The error summary is for screen readers only now (each field shows its own message and the focus
// goes to the first). 838 -> 477 px on desktop, 1201 -> 923 at 412.

const T = {
  en: {
    eb: "Final call · Strada Olari 9", h: "What do you dream of?",
    lead: "Fill in your boarding pass and we answer within one working day. You get a copy too. Or just come by: the door is open, the coffee is on.",
    air: "Cromatic Air", doc: "Boarding pass", from: "From", to: "To", you: "YOU", youL: "Your brand, today", olr: "OLR", olrL: "Strada Olari 9, Bucharest",
    q1: "What are we making?", q1h: "Pick as many as you like", q2: "What kind of business are you?", q3: "When do you want to take off?",
    pax: "Passenger", name: "Your name", email: "Email", phone: "Phone", msg: "Tell us a bit about it", opt: "optional",
    go: "Pour the coffee", gate: "Gate", seat: "Seat", boarding: "Boarding", now: "Now", ref: "Booking", stamp: "Boarded",
    dreams: ["Branding", "Website / App", "Video", "Growth & Social", "Not sure yet"],
    biz: ["Indie / local", "Startup", "Scale-up", "Established"],
    when: ["Yesterday :)", "1 - 3 months", "Just exploring"],
    e: { name: "We'd love to know your name.", mail: "That email doesn't look right.", phone: "Leave us a phone number too." },
    printing: "Printing your boarding pass…", busy: "Too many passes from here for now. Write to hi@cromaticstudios.com and we'll answer.",
    hello: "Welcome aboard,", sent: "Your pass is in your inbox, and we'll answer within one working day.", mailto: "Your email app should open with the details; send it and we'll answer within one working day.",
    passenger: "PASSENGER", flight: "FLIGHT", klass: "CLASS", boardingU: "BOARDING", fix: "Two things to fix before take-off:"
  },
  ro: {
    eb: "Ultimul apel · Strada Olari 9", h: "La ce visezi?",
    lead: "Completează-ți cartea de îmbarcare și îți răspundem în cel mult o zi lucrătoare. Primești și tu o copie. Sau treci pe la noi: ușa e deschisă, cafeaua e pe foc.",
    air: "Cromatic Air", doc: "Carte de îmbarcare", from: "De la", to: "Spre", you: "TU", youL: "Brandul tău, azi", olr: "OLR", olrL: "Strada Olari 9, București",
    q1: "Ce facem împreună?", q1h: "Alege câte vrei", q2: "Ce fel de afacere ai?", q3: "Când vrei să decolezi?",
    pax: "Pasager", name: "Numele tău", email: "Email", phone: "Telefon", msg: "Povestește-ne puțin despre proiect", opt: "opțional",
    go: "Toarnă cafeaua", gate: "Poarta", seat: "Loc", boarding: "Îmbarcare", now: "Acum", ref: "Rezervare", stamp: "La bord",
    dreams: ["Branding", "Site / Aplicație", "Video", "Creștere și social media", "Încă nu știu"],
    biz: ["Indie / locală", "Startup", "Scale-up", "Consacrată"],
    when: ["Ieri :)", "1 - 3 luni", "Doar mă uit deocamdată"],
    e: { name: "Ne-ar plăcea să știm cum te cheamă.", mail: "Adresa de email nu pare corectă.", phone: "Lasă-ne și un număr de telefon." },
    printing: "Îți tipărim cartea de îmbarcare…", busy: "Prea multe carduri de îmbarcare de aici, deocamdată. Scrie-ne la hi@cromaticstudios.com și îți răspundem.",
    hello: "Bine ai venit la bord,", sent: "Cartea de îmbarcare e deja în inboxul tău și îți răspundem într-o zi lucrătoare.", mailto: "Aplicația ta de email ar trebui să se deschidă cu detaliile; trimite-le și îți răspundem într-o zi lucrătoare.",
    passenger: "PASAGER", flight: "ZBOR", klass: "CLASĂ", boardingU: "ÎMBARCARE", fix: "Mai sunt de completat câteva lucruri înainte de decolare:"
  }
};
const EN = T.en;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// a barcode that is the same on every build
function bars() {
  let x = 0, s = "", seed = 7;
  for (let i = 0; i < 38; i++) { seed = (seed * 37 + 11) % 101; const w = 1 + (seed % 3); s += `<rect x="${x}" width="${w}" height="44"/>`; x += w + 1 + ((seed >> 2) % 2); }
  return `<svg class="czp-bars" viewBox="0 0 ${x} 44" preserveAspectRatio="none" aria-hidden="true">${s}</svg>`;
}
const PLANE = `<svg class="czp-plane" viewBox="-20 -20 40 40" aria-hidden="true"><path d="M1-4-7-19h5L10-4zM1 4l-8 15h5L10 4zM-13-4l-5-7h4l6 7zM-13 4l-5 7h4l6-7z" fill="#2840F0" stroke="#0d0c09" stroke-width="1.6" stroke-linejoin="round"/><path d="M-17 0c0-3 3-4 7-4h23c5 0 8 2 9 4-1 2-4 4-9 4h-23c-4 0-7-1-7-4z" fill="#fff" stroke="#0d0c09" stroke-width="1.8"/></svg>`;

let uid = 0;
// the form itself (the ticket). `hidden` = extra hidden inputs (the landings' data-lead fields)
export function passForm(lang = "en", hidden = "") {
  const t = T[lang] || EN, u = `czp${++uid}`;
  const chips = (name, list, multi) => `<div class="czp-chips" data-name="${name}"${multi ? ' data-multi="1"' : ""}>${list.map((v, i) => `<button type="button" class="czp-chip" aria-pressed="false" data-v="${esc(EN[name][i])}">${esc(v)}</button>`).join("")}</div>`;
  const field = (n, label, type, ac, extra = "") => `<div class="czp-f"><input id="${u}-${n}" name="${n}" type="${type}" autocomplete="${ac}" placeholder=" " aria-describedby="${u}-${n}-e"${extra}><label for="${u}-${n}">${esc(label)}</label><p class="czp-err" id="${u}-${n}-e" aria-live="polite"></p></div>`;
  return `<form class="czp" id="czp-form" novalidate data-lang="${lang === "ro" ? "ro" : "en"}" aria-label="${esc(t.doc)}">
  <div class="czp-main">
    <div class="czp-top" aria-hidden="true"><span class="czp-air"><i>✳</i>${esc(t.air)}</span><span>${esc(t.doc)}</span><span>CS 099</span></div>
    <div class="czp-route" aria-hidden="true">
      <span class="czp-end"><small>${esc(t.from)}</small><b>${esc(t.you)}</b><em>${esc(t.youL)}</em></span>
      <span class="czp-fly"><i class="czp-dots"></i>${PLANE}</span>
      <span class="czp-end czp-to"><small>${esc(t.to)}</small><b>${esc(t.olr)}</b><em>${esc(t.olrL)}</em></span>
    </div>
    <fieldset class="czp-q"><legend><span class="czp-n">01</span>${esc(t.q1)} <i>${esc(t.q1h)}</i></legend>${chips("dreams", t.dreams, true)}</fieldset>
    <div class="czp-pair"><fieldset class="czp-q"><legend><span class="czp-n">02</span>${esc(t.q2)}</legend>${chips("biz", t.biz)}</fieldset>
    <fieldset class="czp-q"><legend><span class="czp-n">03</span>${esc(t.q3)}</legend>${chips("when", t.when)}</fieldset></div>
    <fieldset class="czp-q czp-pax"><legend><span class="czp-n">04</span>${esc(t.pax)}</legend>
      <div class="czp-row">${field("name", t.name, "text", "name", " required")}${field("email", t.email, "email", "email", " required")}${field("phone", t.phone, "tel", "tel", ' required minlength="6"')}<div class="czp-f czp-ta"><textarea id="${u}-msg" name="msg" rows="1" placeholder=" "></textarea><label for="${u}-msg">${esc(t.msg)} <i>${esc(t.opt)}</i></label></div></div>
    </fieldset>
    ${hidden}<input class="czp-hp" name="company_site" tabindex="-1" autocomplete="off" aria-hidden="true">
    <p class="czp-status" role="status" aria-live="polite"></p>
  </div>
  <div class="czp-stub">
    <span class="czp-leg" aria-hidden="true"><b>${esc(t.you)}</b><i>✈</i><b>${esc(t.olr)}</b></span>
    <span class="czp-sks" aria-hidden="true"><span class="czp-sk"><small>${esc(t.gate)}</small><b>9</b></span><span class="czp-sk"><small>${esc(t.seat)}</small><b>1A</b></span><span class="czp-sk czp-skb"><small>${esc(t.boarding)}</small><b class="czp-sm">${esc(t.now)}</b></span></span>
    <span class="czp-code" aria-hidden="true">${bars()}<span class="czp-ref"><small>${esc(t.ref)}</small><b class="czp-refv">CS·····</b></span></span>
    <button class="czp-go" type="submit"><span>${esc(t.go)}</span><i aria-hidden="true">→</i></button>
  </div>
  <span class="czp-stamp" aria-hidden="true"><b>${esc(t.stamp)}</b><small>OLR · CS 099</small></span>
</form>`;
}

// the closing section (pages without their own): the call, the words, the ticket
export function passSection(lang = "en") {
  const t = T[lang] || EN;
  return `<section class="czp-sec" id="boarding" aria-labelledby="czp-h"><div class="czp-wrap">
  <div class="czp-intro"><p class="czp-eb">${esc(t.eb)}</p><h2 id="czp-h">${esc(t.h)}</h2><p class="czp-lead">${esc(t.lead)}</p>
  <p class="czp-direct"><a href="mailto:hi@cromaticstudios.com">hi@cromaticstudios.com</a><br><a href="tel:+40728978068">+40 728 978 068</a></p></div>
  ${passForm(lang)}
</div></section>`;
}

export const PASS_CSS = `<style id="czp-css">
.czp{--ink:#0d0c09;--pap:#fbfaf5;--y:#FED012;--um:#2840F0;--r:#C8321F;--g:#1E9A31;--mut:#5f5b52;--ln:rgba(13,12,9,.16);--sw:184px;container:czp/inline-size;position:relative;display:grid;grid-template-columns:minmax(0,1fr) var(--sw);color:var(--ink);font-family:var(--f,CromaticSans,"Google Sans",system-ui,-apple-system,"Segoe UI",sans-serif);font-size:16px;line-height:1.4;text-align:left;isolation:isolate;filter:drop-shadow(0 1px 0 rgba(13,12,9,.08)) drop-shadow(0 22px 40px rgba(13,12,9,.14))}
.czp *{box-sizing:border-box}
.czp-main,.czp-stub{background:var(--pap);border:2px solid var(--ink)}
.czp-main{border-radius:24px 0 0 24px;border-right:0;padding:0 24px 20px;-webkit-mask:radial-gradient(circle 13px at 100% 0,#0000 12.5px,#000 13px) top/100% 51% no-repeat,radial-gradient(circle 13px at 100% 100%,#0000 12.5px,#000 13px) bottom/100% 51% no-repeat;mask:radial-gradient(circle 13px at 100% 0,#0000 12.5px,#000 13px) top/100% 51% no-repeat,radial-gradient(circle 13px at 100% 100%,#0000 12.5px,#000 13px) bottom/100% 51% no-repeat}
.czp-stub{border-radius:0 24px 24px 0;border-left:2px dashed rgba(13,12,9,.45);display:flex;flex-direction:column;align-items:stretch;gap:14px;padding:26px 16px 18px;background:linear-gradient(var(--y),var(--y)) top/100% 8px no-repeat,var(--pap);-webkit-mask:radial-gradient(circle 13px at 0 0,#0000 12.5px,#000 13px) top/100% 51% no-repeat,radial-gradient(circle 13px at 0 100%,#0000 12.5px,#000 13px) bottom/100% 51% no-repeat;mask:radial-gradient(circle 13px at 0 0,#0000 12.5px,#000 13px) top/100% 51% no-repeat,radial-gradient(circle 13px at 0 100%,#0000 12.5px,#000 13px) bottom/100% 51% no-repeat;transform-origin:0 0}
.czp-top{display:flex;justify-content:space-between;gap:10px;margin:0 -24px 14px;padding:10px 24px;background:var(--y);border-bottom:2px solid var(--ink);border-radius:22px 0 0 0;font:700 10.5px/1.2 'JetBrains Mono',ui-monospace,Menlo,monospace;letter-spacing:.14em;text-transform:uppercase}
.czp-air i{font-style:normal;margin-right:6px}
.czp-route{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:14px;padding:0 0 12px;margin-bottom:14px;border-bottom:1.5px dashed var(--ln)}
.czp-end{display:grid;grid-template-columns:auto auto;align-items:baseline;column-gap:10px}.czp-end small{grid-column:1/-1;margin-bottom:3px}
.czp-to{text-align:right;justify-content:end}
.czp-end small,.czp-sk small,.czp-ref small{font:700 10px/1 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.16em;text-transform:uppercase;color:var(--mut)}
.czp-end b{font-weight:900;font-size:34px;line-height:.9;letter-spacing:-.04em}
.czp-end em{font-style:normal;font-size:12.5px;line-height:1.2;color:var(--mut);font-weight:500;max-width:9.5em}
.czp-to{grid-template-columns:auto auto}.czp-to small{grid-area:1/1/2/3}.czp-to em{grid-area:2/1;text-align:right}.czp-to b{grid-area:2/2}
.czp-fly{position:relative;height:30px;align-self:end}
.czp-dots{position:absolute;left:0;right:0;top:50%;border-top:2px dotted rgba(13,12,9,.35)}
.czp-plane{position:absolute;top:50%;left:46%;width:30px;height:30px;translate:-50% -50%;transition:left .9s cubic-bezier(.65,0,.35,1)}
.czp:focus-within .czp-plane{left:62%}
.czp-q{border:0;margin:0 0 14px;padding:0;min-width:0}
.czp-q legend{display:flex;align-items:baseline;gap:8px;flex-wrap:wrap;padding:0;margin:0 0 8px;font-weight:800;font-size:15px;line-height:1.25}
.czp-q legend i{font-style:normal;font-weight:500;font-size:12.5px;color:var(--mut)}
.czp-n{font:700 10.5px/1 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.1em;color:var(--um)}
.czp-pair{display:grid;gap:0 20px}
.czp-chips{display:flex;flex-wrap:wrap;gap:6px}
.czp-chip{font-family:inherit;font-weight:600;font-size:14px;line-height:1;padding:9px 13px;min-height:36px;border-radius:999px;border:1.5px solid var(--ink);background:#fff;color:var(--ink);cursor:pointer;transition:background .18s,box-shadow .18s,translate .18s}
.czp-chip:hover{translate:0 -1px;box-shadow:0 2px 0 var(--ink)}
.czp-chip[aria-pressed="true"]{background:var(--y);box-shadow:0 2px 0 var(--ink)}
.czp-chip[aria-pressed="true"]::before{content:"✓";margin-right:6px;font-weight:900}
.czp-chip:focus-visible,.czp-go:focus-visible{outline:3px solid var(--um);outline-offset:3px}
.czp-pax{margin-bottom:0}
.czp-row{display:grid;grid-template-columns:minmax(0,1fr);gap:10px}
.czp-f{position:relative;margin:0;min-width:0}
.czp-f input,.czp-f textarea{display:block;width:100%;font-family:inherit;font-weight:500;font-size:16px;line-height:1.3;color:var(--ink);padding:21px 13px 7px;min-height:50px;border:1.5px solid var(--ink);border-radius:13px;background:#fff;transition:border-color .15s,box-shadow .15s;appearance:none}
.czp-f textarea{resize:vertical;min-height:76px;max-height:180px;field-sizing:content}
.czp-f label{position:absolute;left:14px;right:12px;top:14px;font-size:16px;font-weight:600;color:var(--mut);pointer-events:none;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;transform-origin:0 0;transition:transform .16s ease,color .16s ease}
.czp-f label i{font-style:normal;font-weight:500}
.czp-f :is(input,textarea):focus+label,.czp-f :is(input,textarea):not(:placeholder-shown)+label{transform:translateY(-8px) scale(.72);right:auto;max-width:calc((100% - 26px) / .72);color:var(--ink)}
.czp-f :is(input,textarea):focus{outline:none;border-color:var(--um);box-shadow:0 0 0 3px rgba(40,64,240,.22)}
.czp-f :is(input,textarea)[aria-invalid="true"]{border-color:var(--r);box-shadow:0 0 0 3px rgba(200,50,31,.16)}
.czp-f input[aria-invalid="false"]:not(:placeholder-shown){border-color:var(--g)}
.czp-err{margin:4px 2px 0;font-size:12.5px;line-height:1.3;font-weight:600;color:var(--r)}
.czp-err:empty{display:none}
.czp-hp{position:absolute;left:-9999px;width:1px;height:1px;opacity:0}
.czp-status{margin:12px 0 0;font-weight:600;font-size:14px;line-height:1.35}
.czp-status:empty{display:none}
.czp-status.bad{position:absolute;width:1px;height:1px;margin:-1px;overflow:hidden;clip-path:inset(50%);white-space:nowrap}
.czp-leg{display:flex;align-items:center;justify-content:center;gap:8px;padding-bottom:12px;border-bottom:1.5px dashed var(--ln);font-weight:900;font-size:18px;letter-spacing:-.01em}.czp-leg i{font-style:normal;color:var(--um);font-size:15px}
.czp-sks{display:grid;grid-template-columns:1fr 1fr;gap:12px 8px}
.czp-sk{display:grid;justify-items:center;gap:4px;text-align:center}
.czp-sk b{font-weight:900;font-size:32px;line-height:1;letter-spacing:-.03em}.czp-sk b.czp-sm{font-size:20px}
.czp-skb{grid-column:1/-1}
.czp-code{display:grid;gap:8px;justify-items:center;margin-top:auto}
.czp-bars{width:100%;height:40px;fill:var(--ink)}
.czp-ref{display:grid;justify-items:center;gap:4px}.czp-ref b{font:700 12.5px/1 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.12em}
.czp-go{display:flex;align-items:center;justify-content:space-between;gap:10px;width:100%;font-family:inherit;font-weight:800;font-size:17px;line-height:1.1;text-align:left;padding:14px 12px 14px 16px;min-height:64px;border-radius:16px;border:2px solid var(--ink);background:var(--ink);color:#fff;cursor:pointer;box-shadow:0 4px 0 var(--y);transition:translate .18s,box-shadow .18s}
.czp-go i{flex:none;font-style:normal;display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:var(--y);color:var(--ink);transition:translate .25s}
.czp-go:hover{translate:0 -2px;box-shadow:0 6px 0 var(--y)}.czp-go:hover i{translate:3px 0}
.czp-go:active{translate:0 2px;box-shadow:0 1px 0 var(--y)}
.czp-go[disabled]{opacity:.7;cursor:progress}
.czp-stamp{position:absolute;right:calc(var(--sw) + 28px);bottom:22px;display:grid;justify-items:center;gap:2px;padding:10px 16px;border:3px solid var(--um);border-radius:14px;color:var(--um);rotate:-9deg;opacity:0;scale:1.6;pointer-events:none;background:rgba(251,250,245,.6)}
.czp-stamp b{font-weight:900;font-size:28px;letter-spacing:.02em;text-transform:uppercase;line-height:1}
.czp-stamp small{font:700 10px/1 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.18em}
.czp.done .czp-main{padding-bottom:96px}
.czp.done .czp-stamp{opacity:.92;scale:1;transition:opacity .2s .45s,scale .35s cubic-bezier(.2,1.6,.4,1) .45s}
.czp.done .czp-stub{animation:czpTear .9s cubic-bezier(.5,0,.75,0) .1s forwards}
@keyframes czpTear{0%{transform:none}25%{transform:rotate(2deg)}100%{transform:translate(4px,160px) rotate(14deg);opacity:0}}
.czp-ok{outline:none}
.czp-hello{font-size:18px;line-height:1.45;margin:4px 0 16px;max-width:30em}
.czp-legs{display:flex;flex-wrap:wrap;align-items:center;gap:8px 12px;padding:14px 0;margin-bottom:16px;border-block:1.5px dashed var(--ln)}
.czp-legs span{display:grid}.czp-legs b{font-weight:900;font-size:24px;letter-spacing:-.02em}.czp-legs i{font-style:normal;font-size:12px;color:var(--mut)}
.czp-legs .hop{color:var(--um);font-weight:800}
.czp-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px 22px}
.czp-grid span{display:grid;gap:4px;font-weight:800;font-size:17px}.czp-grid small{font:700 10.5px/1 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.16em;color:var(--mut)}
@container czp (min-width:600px){
.czp-row{grid-template-columns:repeat(2,minmax(0,1fr))}
.czp-f textarea{min-height:50px;height:50px}
.czp-f textarea:focus,.czp-f textarea:not(:placeholder-shown){height:auto}
}
@container czp (min-width:700px){.czp-pair{grid-template-columns:repeat(2,minmax(0,1fr))}}
@media (min-width:641px){@container czp (max-width:640px){.czp-end,.czp-to{grid-template-columns:auto}.czp-end em{display:none}.czp-to small,.czp-to b{grid-area:auto}}}
@media (max-width:640px){
.czp{grid-template-columns:1fr}
.czp-main{border-radius:22px 22px 0 0;border-right:2px solid var(--ink);border-bottom:0;padding:0 16px 16px;-webkit-mask:radial-gradient(circle 13px at 0 100%,#0000 12.5px,#000 13px) left/51% 100% no-repeat,radial-gradient(circle 13px at 100% 100%,#0000 12.5px,#000 13px) right/51% 100% no-repeat;mask:radial-gradient(circle 13px at 0 100%,#0000 12.5px,#000 13px) left/51% 100% no-repeat,radial-gradient(circle 13px at 100% 100%,#0000 12.5px,#000 13px) right/51% 100% no-repeat}
.czp-top{margin:0 -16px 12px;padding:10px 16px;border-radius:20px 20px 0 0;font-size:10px}
.czp-top span:last-child{display:none}
.czp-route{gap:10px;padding-bottom:10px;margin-bottom:12px}
.czp-end,.czp-to{grid-template-columns:auto}.czp-to small,.czp-to em,.czp-to b{grid-area:auto}
.czp-end b{font-size:30px}.czp-end em{font-size:11.5px}
.czp-q{margin-bottom:12px}
.czp-chip{min-height:40px;padding:10px 13px}
.czp-ta label{white-space:normal;line-height:1.25}
.czp-stub{border-radius:0 0 22px 22px;border-left:2px solid var(--ink);border-top:2px dashed rgba(13,12,9,.45);display:grid;grid-template-columns:1fr auto;align-items:center;gap:12px 16px;padding:16px 16px 18px;background:var(--pap);-webkit-mask:radial-gradient(circle 13px at 0 0,#0000 12.5px,#000 13px) left/51% 100% no-repeat,radial-gradient(circle 13px at 100% 0,#0000 12.5px,#000 13px) right/51% 100% no-repeat;mask:radial-gradient(circle 13px at 0 0,#0000 12.5px,#000 13px) left/51% 100% no-repeat,radial-gradient(circle 13px at 100% 0,#0000 12.5px,#000 13px) right/51% 100% no-repeat}
.czp-leg{display:none}
.czp-sks{grid-template-columns:auto auto auto;gap:0 14px;justify-content:start}.czp-skb{grid-column:auto}
.czp-sk b{font-size:24px}.czp-sk b.czp-sm{font-size:16px;line-height:24px}
.czp-code{margin:0;grid-template-columns:auto;width:96px}.czp-bars{height:28px}.czp-ref small{display:none}.czp-ref b{font-size:11px}
.czp-go{grid-column:1/-1;min-height:56px;justify-content:center;gap:12px;text-align:center}
.czp-stamp{right:16px;bottom:16px;transform-origin:100% 100%;scale:1.15}.czp.done .czp-main{padding-bottom:96px;border-bottom:2px solid var(--ink);border-radius:22px;-webkit-mask:none;mask:none}
}
@media (prefers-reduced-motion:reduce){.czp *,.czp.done .czp-stamp{transition:none!important;animation:none!important}.czp.done .czp-stub{opacity:.35}.czp:focus-within .czp-plane{left:46%}}
.czp-sec{overflow-x:clip;--ink:#0d0c09;background:#0d0c09;color:#fbfaf5;padding:clamp(48px,6vw,88px) 0;font-family:var(--f,CromaticSans,"Google Sans",system-ui,-apple-system,"Segoe UI",sans-serif);line-height:1.5}
.czp-wrap{width:min(1180px,100% - 40px);margin:0 auto;display:grid;grid-template-columns:minmax(0,1fr) minmax(0,2fr);gap:clamp(28px,3.5vw,56px);align-items:start}
.czp-eb{margin:0 0 14px;font:700 12px/1 'JetBrains Mono',ui-monospace,monospace;letter-spacing:.16em;text-transform:uppercase;color:rgba(251,250,245,.72)}
.czp-intro{padding-top:8px}
.czp-intro h2{margin:0 0 18px;font-weight:900;font-size:clamp(40px,4.4vw,64px);line-height:.95;letter-spacing:-.045em;color:#fbfaf5}
.czp-lead{margin:0 0 22px;font-size:17px;line-height:1.5;color:rgba(251,250,245,.84);max-width:28em}
.czp-direct{margin:0}.czp-direct a{color:#fbfaf5;font-weight:700;font-size:18px;line-height:1.8;text-decoration:underline;text-decoration-color:#FED012;text-decoration-thickness:2px;text-underline-offset:5px}
@media (min-width:1101px){.contact:has(>.czp){grid-template-columns:minmax(0,1fr) minmax(0,2fr);gap:clamp(28px,3.5vw,56px)}}
@media (max-width:1100px){.czp-wrap{grid-template-columns:1fr;gap:28px}.czp-intro{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:0 32px;align-items:end;padding:0}.czp-intro h2{grid-row:2}.czp-eb{grid-column:1/-1}.czp-lead,.czp-direct{grid-column:2}.czp-lead{grid-row:2;margin:0}.czp-direct{grid-row:3;margin-top:10px}}
@media (max-width:700px){.czp-intro{display:block}.czp-intro h2{margin-bottom:14px}.czp-lead{margin-bottom:16px;font-size:16px}}
html.embed .czp-sec{padding:40px 0}
</style>`;

// the client: chips, inline validation, submit, the torn stub and the filled-in pass
function client() {
  var forms = document.querySelectorAll("form.czp");
  forms.forEach(function (f) {
    if (f.__czp) return; f.__czp = 1;
    var RO = f.dataset.lang === "ro", RM = matchMedia("(prefers-reduced-motion: reduce)").matches;
    var L = window.__CZP_T[RO ? "ro" : "en"], pick = {};
    f.querySelectorAll(".czp-chips").forEach(function (g) {
      var name = g.dataset.name, multi = g.dataset.multi === "1"; pick[name] = multi ? [] : "";
      g.addEventListener("click", function (e) {
        var b = e.target.closest(".czp-chip"); if (!b) return;
        var v = b.dataset.v, on = b.getAttribute("aria-pressed") !== "true";
        if (multi) { b.setAttribute("aria-pressed", String(on)); pick[name] = on ? pick[name].concat(v) : pick[name].filter(function (x) { return x !== v; }); }
        else { g.querySelectorAll(".czp-chip").forEach(function (c) { c.setAttribute("aria-pressed", "false"); }); b.setAttribute("aria-pressed", String(on)); pick[name] = on ? v : ""; }
      });
    });
    var el = function (n) { return f.elements[n]; }, val = function (n) { return ((el(n) && el(n).value) || "").trim(); };
    var rules = { name: function (v) { return v ? "" : L.e.name; }, email: function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? "" : L.e.mail; }, phone: function (v) { return v.replace(/\D/g, "").length >= 6 ? "" : L.e.phone; } };
    var check = function (n) { var m = rules[n](val(n)), i = el(n), e = document.getElementById(i.getAttribute("aria-describedby")); i.setAttribute("aria-invalid", String(!!m)); if (e) e.textContent = m; return !m; };
    Object.keys(rules).forEach(function (n) {
      var i = el(n); if (!i) return;
      i.addEventListener("blur", function () { if (i.value.trim() || i.hasAttribute("aria-invalid")) check(n); });
      i.addEventListener("input", function () { if (i.getAttribute("aria-invalid") === "true") check(n); });
    });
    var status = f.querySelector(".czp-status"), btn = f.querySelector(".czp-go");
    var CODES = { "Branding": ["BRD", "Branding"], "Website / App": ["WEB", "Website / App"], "Video": ["VID", "Video"], "Growth & Social": ["GRW", "Growth & Social"], "Not sure yet": ["TBD", "Open route"] };
    var CLASS = { "Indie / local": "Indie Class", "Startup": "Startup Class", "Scale-up": "Growth Class", "Established": "First Class" };
    var BOARD = { "Yesterday :)": "Now boarding", "1 - 3 months": "In 1–3 months", "Just exploring": "Open ticket" };
    var RO_VAL = { "Website / App": "Site / Aplicație", "Growth & Social": "Creștere și social media", "Open route": "Rută deschisă", "Indie Class": "Clasa Indie", "Startup Class": "Clasa Startup", "Growth Class": "Clasa Growth", "First Class": "Clasa întâi", "Open Class": "Clasă deschisă", "Now boarding": "Îmbarcare acum", "In 1–3 months": "În 1–3 luni", "Open ticket": "Bilet deschis", "When you are ready": "Când ești gata" };
    var tv = function (x) { return (RO && RO_VAL[x]) || x; };
    var MON = RO ? ["IAN", "FEB", "MAR", "APR", "MAI", "IUN", "IUL", "AUG", "SEP", "OCT", "NOI", "DEC"] : ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
    var esc = function (t) { return String(t).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; }); };
    f.addEventListener("submit", function (e) {
      e.preventDefault();
      var bad = ["name", "email", "phone"].filter(function (n) { return !check(n); });
      if (bad.length) { status.classList.add("bad"); status.textContent = bad.length > 1 ? L.fix + " " + bad.map(function (n) { return rules[n](val(n)); }).join(" ") : rules[bad[0]](val(bad[0])); el(bad[0]).focus(); return; }
      status.classList.remove("bad");
      var now = new Date(), h = 2166136261, name = val("name"), email = val("email"), s = name + "|" + email + "|" + now.getTime();
      for (var k = 0; k < s.length; k++) h = Math.imul(h ^ s.charCodeAt(k), 16777619) >>> 0;
      var t = {
        ref: "CS" + h.toString(36).toUpperCase().slice(0, 5).padStart(5, "0"), name: name, first: name.split(/\s+/)[0], email: email, phone: val("phone"), msg: val("msg"),
        date: String(now.getDate()).padStart(2, "0") + " " + MON[now.getMonth()] + " " + now.getFullYear(), time: String(now.getHours()).padStart(2, "0") + ":" + String(now.getMinutes()).padStart(2, "0"),
        flight: "CS " + String(99 + pick.dreams.length).padStart(3, "0"), stops: pick.dreams.map(function (x) { return CODES[x] || ["TBD", x]; }), dreams: pick.dreams, biz: pick.biz, when: pick.when,
        klass: CLASS[pick.biz] || "Open Class", boarding: BOARD[pick.when] || "When you are ready", company_site: val("company_site"), lang: RO ? "ro" : "en"
      };
      f.querySelectorAll("input[data-lead]").forEach(function (i) { if (i.value) t[i.name] = i.value.slice(0, 120); });
      btn.disabled = true; status.textContent = L.printing;
      fetch("/api/boarding", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(t) }).then(function (r) { return r.status === 429 ? "busy" : r.ok; }, function () { return false; }).then(function (sent) {
        if (sent === "busy") { status.textContent = L.busy; btn.disabled = false; return; }
        if (!sent) { var body = t.msg + "\n\n" + t.name + " · " + t.email + (t.phone ? " · " + t.phone : "") + "\nDreaming about: " + (t.dreams.join(", ") || "-") + "\nBusiness: " + (t.biz || "-") + " · When: " + (t.when || "-"); location.href = "mailto:hi@cromaticstudios.com?subject=" + encodeURIComponent("Boarding pass " + t.ref + " · " + t.name) + "&body=" + encodeURIComponent(body); }
        var legs = [["YOU", RO ? "Tu" : "You"]].concat(t.stops, [["OLR", "Olari 9"]]);
        var main = f.querySelector(".czp-main"), top = main.querySelector(".czp-top").outerHTML;
        f.querySelector(".czp-refv").textContent = t.ref;
        main.innerHTML = top + '<div class="czp-ok" tabindex="-1" role="status"><p class="czp-hello">' + L.hello + " <b>" + esc(t.first) + "</b>. " + (sent ? L.sent : L.mailto) + '</p><div class="czp-legs">' + legs.map(function (x) { return "<span><b>" + esc(x[0]) + "</b><i>" + esc(tv(x[1])) + "</i></span>"; }).join('<span class="hop" aria-hidden="true">→</span>') + '</div><div class="czp-grid"><span><small>' + L.passenger + "</small>" + esc(t.name) + "</span><span><small>" + L.flight + "</small>" + esc(t.flight) + "</span><span><small>" + L.klass + "</small>" + esc(tv(t.klass)) + "</span><span><small>" + L.boardingU + "</small>" + esc(tv(t.boarding)) + "</span></div></div>";
        var stub = f.querySelector(".czp-stub"); if (!RM) stub.addEventListener("animationend", function () { stub.style.visibility = "hidden"; if (matchMedia("(max-width: 640px)").matches) stub.style.display = "none"; }, { once: true });
        f.classList.add("done"); main.querySelector(".czp-ok").focus({ preventScroll: RM });
      });
    });
  });
}
const CLIENT_T = Object.fromEntries(Object.entries(T).map(([k, v]) => [k, { e: v.e, printing: v.printing, busy: v.busy, hello: v.hello, sent: v.sent, mailto: v.mailto, passenger: v.passenger, flight: v.flight, klass: v.klass, boardingU: v.boardingU, fix: v.fix }]));
export const PASS_JS = `<script id="czp-js">window.__CZP_T=${JSON.stringify(CLIENT_T).replace(/</g, "\\u003c")};(${client.toString()})();</script>`;

// the content pages that end with the pass (relative to public/, before the home move: site/ is the home)
export const PASS_PAGES = /^(?:site\/|ro\/|team\/|ro\/echipa\/|onboarding\/|ro\/onboarding\/|(?:industries|services|work)\/[^/]+\/|ro\/(?:industrii|servicii|proiecte)\/[^/]+\/)index\.html$/;

// one page: the slot a page left (<div data-czp-slot>hidden inputs</div>) gets the ticket; a content page without one
// gets the closing section before its footer; any page with a ticket gets the CSS and the script once
export function withPass(html, rel) {
  rel = rel.replace(/\\/g, "/");
  const lang = /<html[^>]*\blang="ro/.test(html) ? "ro" : "en";
  let out = html.replace(/<div data-czp-slot>([\s\S]*?)<\/div>/g, (m, hidden) => passForm(lang, hidden));
  if (!out.includes('class="czp"') && PASS_PAGES.test(rel)) {
    // after </main> and before the footer that follows it (build/footer.mjs puts the strip right after </main>)
    const i = out.lastIndexOf("</main>");
    if (i >= 0) { const fo = out.indexOf("<footer", i), at = fo >= 0 ? fo : i + 7; out = out.slice(0, at) + passSection(lang) + "\n" + out.slice(at); }
  }
  if (out.includes('class="czp"') && !out.includes('id="czp-css"')) out = out.replace("</head>", `${PASS_CSS}\n</head>`).replace(/<\/body>(?![\s\S]*<\/body>)/, `${PASS_JS}\n</body>`);
  return out;
}
