# Audit Sketchbook, 19 octombrie 2026 (live beta 3.68; fix-urile în beta 3.75)

Daniel: „Sketchbook-ul e aproape complet neutilizabil." Am măsurat lumea Sketchbook față de lumea Cromatic în aceleași scene, pe laptop și pe un profil de iPhone, și am căutat ce se strică, ce nu se vede și ce nu răspunde.

- **Ce s-a schimbat pe drum:** Daniel a cerut între timp un look nou pentru Sketchbook (hârtie de caiet, creioane colorate), pe care îl face alt agent (drive-light, beta 3.76). Look-ul măsurat aici (grafit, hașură, ceară) urmează să fie înlocuit.
- **Ce conține 3.75:** doar ce rămâne valabil oricare ar fi look-ul:
  - un bug de suprapunere găsit în timpul auditului (în toate lumile);
  - mecanismul care scoate obiectele care se mișcă (mașina, poliția) și DOM-ul care se redesenează la fiecare frame de sub tratamentul Sketchbook;
  - un instrument de măsurat costul unui frame (`__perfLab.bench`).
- **Ce urmează (3.77):** fix-urile de fluiditate se fac peste look-ul nou, după ce îl măsor cu aceleași scene și profiluri. Recomandările de performanță de mai jos sunt pentru look-ul vechi: le refac pe cel nou.

Pozele sunt în `design/qa/sketchbook-2026-10-19/`.

## Pe scurt

1. **Pe laptop (M4), Sketchbook nu e lent.** Merge la ~60 fps în aproape toate scenele, ca și Cromatic. Un frame costă de vreo 1,3-1,5 ori mai mult decât în Cromatic: 7,2 față de 6,6 ms pe hartă, CPU și GPU împreună.
2. **Costul suplimentar e în GPU și ține de look:**
   - trei treceri în loc de două (scena, conturul de creion, post-procesarea);
   - **5,5 milioane de triunghiuri pe frame** față de 0,9 milioane;
   - **2,2 milioane dintre ele sunt coroanele copacilor** (sfere de 520 de triunghiuri, toate ~4.300 desenate în fiecare trecere, fiindcă un InstancedMesh se decupează doar întreg).
   - Pe un iPhone, cu un GPU de ~3 ori mai slab decât M4-ul, asta înseamnă cam 20-30 ms pe frame (35-50 fps, estimat). Rezoluția adaptivă coboară atunci la 1x, iar liniile de creion se văd moi și pixelate.
3. **În WebKit (Safari), harta de „reveal" costă ~2,7 ms la fiecare upload, chiar pe M4.** E o pânză 2D de 512², urcată ca textură la fiecare trăsătură: de ~11 ori pe secundă când stai pe loc și de până la ~33 de ori când miști pointerul sau degetul. Rezultatul e o sacadare la câteva frame-uri. În Chromium costul e ~0.
4. **Prima trecere în Sketchbook îngheață pagina 120-160 ms pe laptop și 280-380 ms în WebKit.** Cauza e `crayonTextures()`, adică pânzele de ceară generate procedural, de câte ori se deschide o vizită. Întoarcerea în Cromatic durează 6-17 ms.
5. **Stratul de CSS al Sketchbook-ului nu costă nimic măsurabil.** Am cronometrat cu filtre, măști și animații de ceară puse și scoase, pe rând:
   - în Chromium (trace, CPU încetinit de 4 ori), stilul și paint-ul sunt la fel ca în Cromatic;
   - în WebKit, diferențele dintre variante sunt sub zgomot;
   - DOM-ul care se schimbă la fiecare frame (pinii, distanțele din Nearby, săgețile n2) nu are niciun filtru CSS pe el.

   Pe un telefon încetinit, firul principal e plin în ambele lumi, din cauze care nu țin de Sketchbook (vezi „În toate lumile").
6. **„Neutilizabil" e mai ales vizual și pe telefon.** Detaliile sunt mai jos:
   - Street view e închis la culoare și cețos;
   - orașul e alb unde nu „ai privit" încă;
   - butoanele principale nu au culoare pe touch;
   - cardul are jumătate goală pe telefon;
   - Multiverse are text alb pe gri.

   Toate țin de look și sunt notate pentru revamp, nereparate aici.
7. **Bug funcțional găsit (în toate lumile), reparat în 3.75:** pe telefon, cardul Two Minutes apărea peste boarding pass, dacă pass-ul se deschidea în cele 1,9 s în care cardul așteaptă după espresso. Poza 05.

## Pe ce și cum am măsurat

- **Laptop:** Chromium 1440×900 @2x pe Apple M4 (ANGLE Metal), cu pixel ratio-ul blocat la 1,11. Asta e plafonul real al hărții (1,6 MP, `app.js:42337`).
- **iPhone 13:** profilul WebKit al Playwright (390×844 @3, pixel ratio blocat la 1,5, plafonul de mobil).
- **Telefon lent:** Chromium la mărimea unui iPhone, cu CPU-ul încetinit de 4 ori (CDP).
- **Ce măsor:**
  - intervalele dintre frame-uri (fps, p50/p95/p99/max);
  - timpul JS din rAF;
  - long tasks;
  - trecerile și draw call-urile pe frame (renderer.render încapsulat);
  - timpul GPU pe trecere (`EXT_disjoint_timer_query_webgl2`, doar Chromium);
  - costul „sec" al unui frame cu `__perfLab.bench()`: 10 frame-uri unul după altul, plus o citire de 1 pixel care așteaptă GPU-ul, cel mai bun din 7 încercări;
  - trace-uri Chromium pentru style recalc, layout, paint și raster.
- **Scenele**, aceleași în Cromatic și Sketchbook: hartă în repaus; pan și zoom cu mouse-ul; condus cu săgețile; drift; urmărirea poliției; Street view la volan; auto-pilotul spre un loc; cardul deschis; hover pe CTA; pagina de proiect în frame; Nearby; jurnalul de XP; boarding pass; schimbarea lumii dus-întors.
- **Rezerve:**
  - mașina a fost împărțită cu alți agenți care rulau browsere în paralel, așa că cifrele au zgomot. Am repetat, am intercalat variantele și am luat mediane sau minime;
  - GPU-ul M4 e mult mai puternic decât cel al unui iPhone, iar WebKit-ul de pe Mac nu reproduce GPU-ul telefonului. Estimarea pentru iPhone e marcată ca estimare.
- **Fără erori:** consola nu a avut nicio eroare în nicio scenă, nicio lume și niciun profil, înainte și după.

## Măsurători: Cromatic față de Sketchbook (live 3.68)

Costul unui frame (`__perfLab.bench`, CPU și GPU împreună, ms, cel mai bun din 14 încercări):

| | Cromatic, hartă | Sketchbook, hartă | Cromatic, Street | Sketchbook, Street |
|---|---|---|---|---|
| Laptop, Chromium, 1,6 MP | 6,6 | 7,2 | 6,2 | 6,8 |
| iPhone 13, WebKit, 0,74 MP | 4,7 | 7,0 | 5,6 | 9,0 |

Ce se desenează pe frame (hartă în repaus, laptop):

| | Cromatic | Sketchbook |
|---|---|---|
| Treceri | 2 (scena în MSAA, tilt-shift) | 3 (scena, conturul OutlineEffect, post-procesarea) |
| Draw calls | ~300 | ~540 |
| Triunghiuri | 0,93 M | 5,54 M |
| GPU pe trecere (M4, p50, cu zgomot) | 4,2 + 2,8 = 7,1 ms | 6,9 + 4,1 + 3,0 = 14,7 ms |

Copacii, triunghiuri pe trecere:

- **Cromatic:** coroane din icosaedri de 80 de triunghiuri × 4.317 = 0,35 M.
- **Sketchbook:** sfere de 20×14 (520 de triunghiuri) × 4.317 = **2,24 M**, desenate de trecerea de culoare, de cea de contur și, pe laptop, de cea de umbre.

Fps pe scene (prima rundă, pixel ratio la alegerea guvernorului; a doua rundă, cu pixel ratio blocat, e în tabelul următor):

| Scena | Laptop, Cromatic | Laptop, Sketchbook | iPhone WebKit, Cromatic | iPhone WebKit, Sketchbook |
|---|---|---|---|---|
| Hartă în repaus | 60 | 60 | 60 | 58 |
| Condus cu săgețile | 41* | 60 | 60 | 59 |
| Street view la volan | 47* | 54 | 60 | 50 |
| Street, cu frame-ul așteptat până la capăt | 24* | 40 | 60 | **30** |
| Card deschis | 31* | 59 | 57 | 51 |
| Hover pe CTA | 44* | 54 | 58 | **29** |
| Nearby, condus | 35* | 45 | 60 | **29** |

\* Cromatic a rulat primul, cu orașul încă încărcând ce mai avea, iar alți agenți foloseau mașina. Căderile lui de pe laptop sunt de acolo, nu din lume (la a doua rundă, Cromatic pe laptop e la 52-60 fps în aceleași scene).

A doua rundă pe laptop, cu pixel ratio blocat la 1,11 (1.600×1.000 px), aceleași scene. Rundele pe iPhone și pe telefonul încetinit, cu pixel ratio blocat, intră în 3.77, odată cu look-ul nou:

| Scena | Cromatic fps | Cromatic p95 / max (ms) | Sketchbook fps | Sketchbook p95 / max (ms) | Draw calls C / S | GPU p50 C / S (ms) |
|---|---|---|---|---|---|---|
| Hartă în repaus | 59,6 | 17,5 / 33 | 58,1 | 17,7 / 34 | 304 / 536 | 7,1 / 7,9 |
| Pan și zoom | 48,2 | 33,4 / 500 | 59,9 | 17,7 / 50 | 182 / 339 | 6,3 / 11,3 |
| Condus cu săgețile | 51,6 | 33,4 / 67 | 59,5 | 17,7 / 34 | 178 / 299 | 6,8 / 8,5 |
| Drift | 21,8 | 99,8 / 732 | 51,4 | 33,5 / 68 | 264 / 330 | 7,4 / 7,2 |
| Urmărirea poliției | 40,3 | 50 / 65 | 30,2 | 50,1 / 150 | 236 / 479 | 7,6 / 6,8 |
| Street view la volan | 58,5 | 17,7 / 50 | 57,5 | 17,7 / 51 | 210 / 489 | 9,1 / 11,3 |
| Auto-pilot | 60,2 | 17,6 / 33 | 60 | 17,6 / 33 | 272 / 341 | 9,7 / 11,2 |
| Card deschis | 59,1 | 17,7 / 34 | 60,3 | 17,6 / 18 | 216 / 359 | 9,5 / 12,5 |
| Hover pe CTA | 60,3 | 17,7 / 18 | 60,3 | 17,6 / 18 | 210 / 342 | 7,8 / 10,0 |
| Pagina de proiect | 54,7 | 17,7 / 349 | 60,2 | 17,6 / 18 | 258 / 472 | 6,6 / 9,5 |
| Nearby, condus | 57,4 | 17,7 / 34 | 58,1 | 17,7 / 83 | 235 / 384 | 7,3 / 8,6 |
| Jurnalul de XP | 60,3 | 17,6 / 33 | 59,7 | 17,6 / 34 | 221 / 364 | 9,6 / 9,7 |
| Boarding pass | 60,2 | 17,6 / 18 | 60 | 17,4 / 33 | 221 / 363 | 9,4 / 10,9 |
| Schimbarea lumii | 56,9 | 17,6 / 233 | 60 | 17,5 / 34 | 222 / 362 | 10,3 / 10,6 |

Urmărirea poliției și drift-ul sunt slabe în ambele lumi (agentul perf-drift lucrează la ele). GPU-ul e măsurat cu timer queries pe un GPU împărțit cu alte browsere: arată tendința, nu valori absolute.

Firul principal (Chromium, CPU încetinit de 4 ori, iPhone, ms pe secundă de scenă):

| | Style recalc | Paint | Layout forțat | JS în rAF |
|---|---|---|---|---|
| Condus, Cromatic | 442 | 37 | 479 | 818 |
| Condus, Sketchbook | 411 | 55 | 420 | 837 |
| Hover CTA, Cromatic | 55 | 46 | – | 1005 |
| Hover CTA, Sketchbook | 46 | 17 | – | 837 |

Pe un telefon lent, firul principal e la limită în ambele lumi. Sketchbook nu adaugă stil sau paint măsurabil.

Schimbarea lumii (long task la clic):

| | Laptop | iPhone WebKit |
|---|---|---|
| În Sketchbook, prima dată | 121-163 ms | 276-376 ms |
| În Sketchbook, a doua oară | 7-10 ms | 9 ms |
| În Cromatic | 6-17 ms | 7-17 ms |

## Ce costă în Sketchbook: cauză, cost, ce fac

Referințele `fișier:linie` sunt pe live (`90bc9e3`).

| # | Ce | Cauza | Cost măsurat | Ce fac |
|---|---|---|---|---|
| P1 | Coroanele copacilor | `app.js:24973`, `mats.treeSketch`: `SphereGeometry(15.5, 20, 14)`. Toate cele 4.317 instanțe în fiecare trecere | 2,24 M triunghiuri pe trecere (×3 pe laptop, ×2 pe telefon), adică ~60 % din triunghiurile frame-ului | **3.77, pe look-ul nou.** Propunere testată: o sferă 12×8 (192) de sus (pe hartă o coroană are 10-30 px; 12×8 e la o jumătate de pixel de un cerc) și sfera întreagă în Street view. 5,5 → 2,5 M triunghiuri. Nu e în 3.75: e cost de look vechi |
| P2 | Conturul de creion (OutlineEffect) | `app.js:38464`. Toată scena desenată a doua oară, cu materialele de contur, plus parcurgerea ei pe CPU | ~4 ms GPU pe M4 (cu zgomot), ~230 de draw calls în plus | În 3.75, mecanismul `skipHull`, ca un look să poată scoate subarbori din contur (mașina și poliția ies deja). Ce altceva iese (obiecte mici, ploaie, copaci) e decizie de look |
| P3 | Harta de reveal (orașul „se desenează" unde te uiți) | `app.js:38263-38272` și `38327-38341`: pânză 2D de 512², `tex.needsUpdate = true` la fiecare trăsătură (la 90 ms în repaus, la 45 ms cu pointerul) | **~2,7 ms pe upload în WebKit** (M4), ~0 în Chromium, de 11-33 de ori pe secundă | **3.77, dacă look-ul nou păstrează reveal-ul.** Testat: aceleași trăsături desenate direct pe GPU, într-un target de 512² cu mipmap-uri, fără niciun upload; același amestec (alb cu alfa a peste foaie) și același disc. Patch gata, pus deoparte |
| P4 | Post-procesarea | `app.js:38342-38451`: ~20 de citiri de textură și ~12 zgomote pe pixel, la rezoluție întreagă, plus un target HalfFloat cu textură de adâncime (fără MSAA) | ~3 ms GPU pe M4 la 1,6 MP; pe iPhone, estimat ~5 ms la 0,74 MP | La rezoluție mai mică liniile ar ieși moi: decizie de look. De reluat cu shader-ul nou |
| P5 | Prima intrare în Sketchbook | `app.js:36433` cheamă `crayonTextures()` (`app.js:36324`): cinci pânze de ceară calculate pixel cu pixel pe firul principal | 120-160 ms pe laptop, 280-380 ms în WebKit (pe un iPhone real, probabil 0,3-0,6 s de îngheț). Se plătește și când se desenează previzualizările din Multiverse | Dispare odată cu look-ul de ceară. Dacă look-ul nou are texturi procedurale: într-un worker sau în idle, înainte de clic |
| P6 | Ceața împinsă la 6.000-30.000 | `app.js:39243` | În Street view tot orașul e în cadru (Cromatic îl ascunde în ceață de la 900-4.200) | Observație pentru look și 3.77 |
| P7 | Guvernorul de rezoluție | `app.js:38570`: coboară pixel ratio-ul cu 0,25 când media trece de 20 ms | În Sketchbook pe telefon ajunge la 1x: hașura și liniile se văd pixelate | Efect al P1-P4, nu cauză |
| P8 | Inelele de ceară, animația „scribble", masca de pe pini | `styles.css:4096-4122`, `app.js:38312-38325` | Nemăsurabil (sub zgomot în Chromium și WebKit). DOM-ul care se mișcă la fiecare frame nu are filtre | În 3.75 o regulă care le interzice pe DOM-ul dinamic, oricare ar fi look-ul (vezi „Mecanismul plain") |

## Probleme de utilizare (pentru look-ul nou; nereparate în 3.75)

Le notez ca revamp-ul să nu le moștenească:

| # | Unde | Ce se vede | Cauza |
|---|---|---|---|
| U1 | Street view, laptop și telefon | Drumul și orașul apropiat sunt gri închis, cu o ceață pătată. Mașina abia se distinge. Poze 02 și 03 | Hașura (`sh = 1 - smoothstep(0.4, 0.74, l)`) acoperă tot ce e în umbra clădirilor înalte, iar fibra hârtiei și vigneta se adună. Vezi „Întunecimea" |
| U2 | Condus spre locuri noi | Orașul e aproape alb unde nu ai privit încă (`g *= mix(0.035, 1.0, shown)`). Mașina ajunge din urmă reveal-ul, iar drumul din față apare abia după | `app.js:38339-38340`: o rază de 560 și ~0,1 alfa la 90 ms în modul de condus |
| U3 | CTA-urile cardurilor („Go deeper", „Take the full tour") | Pe touch sunt doar un contur, fără culoare: nu arată ca butonul principal. Galbenul apare numai la `:hover`. Pozele 04 și 09 | `styles.css:4169-4171` (umplerea pe `::before` doar la hover), `background-clip: text` la `styles.css:4078` |
| U4 | Cardul pe telefon | Poza e îngustată la 40 %, jumătatea din dreapta e goală, iar polaroidul acoperă rândul „COFFEE STREET" de sub el. Poze 04 și 05 | `styles.css:4160`: regulile de desktop (`flex-basis: 40%`, `aspect-ratio`, `margin`) se aplică și pe telefon |
| U5 | Cardul Two Min Lab, pe laptop | Afișul e tăiat la „MIN" | Același `aspect-ratio: 4 / 3.6` |
| U6 | Butonul Multiverse | Text alb pe previzualizarea făcută gri: contrast slab. Poza 10 | `styles.css:4070-4071` (`grayscale(1)` pe `.map-top`) |
| U7 | UI-ul n2 (pad, Nearby, comutatorul Street / Bird's eye), boarding pass-ul, frame-ul paginilor de proiect, frame-ul jocului, intro-ul Lottie | Au rămas în stilul Cromatic: nu au nicio regulă de Sketchbook (`nav2.css` nu are niciuna). Merg bine, dar cardurile Nearby colorate stau pe hârtie gri | Au venit după Sketchbook (beta 2-3) |
| U8 | Animațiile de ceară | Nu respectă `prefers-reduced-motion` (`crIn`, `crIn2`) | `styles.css:4118-4120` |

Am verificat butoanele: am testat `elementFromPoint` în centrul fiecărui control vizibil, pe hartă, cu card, cu jurnalul de XP și cu boarding pass. Sketchbook nu blochează niciun control care în Cromatic merge, nici pe laptop, nici pe iPhone. Dus-întorsul Cromatic → Sketchbook → Cromatic readuce cadrul Cromatic identic (la nivelul grain-ului de film). Schimbarea lumii în Street view, în timpul urmăririi, cu un card, cu boarding pass-ul și în decolarea avionului merge fără erori.

## Întunecimea (observații pentru drive-light; nimic schimbat aici)

- **În Street view, Sketchbook e mult mai închis decât pe hartă.** Pe hartă, camera vede mai ales acoperișuri și drumuri în lumină. La nivelul străzii, cadrul e plin de fațade și de umbre purtate. Shader-ul face hașură din luminanța randării: `sh` peste ~0,4, `h1`/`h2` la `app.js:38405-38410`. Așa că jumătatea de jos a ecranului devine o pată gri.
- **Mai închid imaginea și:**
  - vigneta (`vig`, `app.js:38437`);
  - fibra hârtiei;
  - „ghost"-ul liniilor (`ghost`, un al doilea contur decalat, `app.js:38397`).
- **Ceața la 6.000-30.000 nu mai deschide depărtarea**, cum face în Cromatic.
- **Pe telefon, rezoluția adaptivă coborâtă la 1x face hașura grosieră**, deci și mai închisă. Poza 03.

## În toate lumile (nu ține de Sketchbook)

| # | Ce | Cost | Stare |
|---|---|---|---|
| A1 | **Cardul Two Minutes peste boarding pass, pe telefon.** La prima vizită, cardul așteaptă 1,9 s după espresso (`app.js:41305`). Dacă între timp se deschide boarding pass-ul (pinul avionului, „Our house" → pass, un link `?boarding`), cardul apărea peste el și acoperea câmpurile. Poza 05 | Formularul de lead acoperit | **Reparat în 3.75**: timer-ul verifică și `mapBoarding`. Verificat pe iPhone în Sketchbook și în Cromatic |
| A2 | Layout forțat în fiecare frame de condus: citiri `getBoundingClientRect` / `getComputedStyle` după scrieri, în același frame (n2 `tutPlace`, `placeAnchor`…) | ~420-480 ms pe secundă pe un telefon cu CPU-ul încetinit de 4 ori, ~45 % din firul principal | Pentru agentul perf-drift |
| A3 | Pinii ascunși (`.map-pin.off`) primesc stil (transform sau proprietăți `--g*`) în fiecare frame | ~600 de mutații pe secundă la condus | Pentru perf-drift |
| A4 | `.scroll-hint` primește `classList.add("gone")` în fiecare frame (`app.js:39479`) | Ieftin (aceeași clasă), dar ~28 de mutații pe secundă | Minor |
| A5 | Drift-ul pe laptop, în Cromatic: 39 de long tasks (3,2 s) într-o scenă de 6 s la a doua rundă, 6 la prima (instabil, cu mașina încărcată) | Sacadare la drift | Pentru perf-drift (tema lui) |

## Mecanismul „plain" (în 3.75, indiferent de look)

Ce se mișcă sau se redesenează la fiecare frame poate fi scos de sub tratamentul Sketchbook fără să-i știi shader-ul.

**3D** (`app.js`, după `sketchRender`):
- **Ce se desenează plain:** `sketchPlainRoots` e lista rădăcinilor desenate plain: `[() => veh?.group, () => copCar?.group]`, getter-e, fiindcă mașinile se reconstruiesc. Pentru avion, de exemplu, ajunge încă un getter în listă.
- **Cum se desenează:**
  - obiectele rămân în trecerea de culoare, ca adâncimea și umbrele lor să fie ale scenei;
  - trecerea de contur le sare;
  - post-procesarea scrie adâncimea scenei pe ecran (`gl_FragDepth = zr;`);
  - apoi sunt desenate încă o dată, cu materialele lor, testate pe adâncime, pe layer-ul de cameră `SKETCH_PLAIN_LAYER = 7`, cu un polygon offset mic contra z-fighting-ului.
  - Rezultatul: mașina și poliția au culorile și lumina lor în Sketchbook. Pozele 06-08 și filmele 11 (laptop și telefon: condus, Street view, poliția).
  - Shader-ele lor pentru ecran se compilează în fundal (`compileAsync`). Până sunt gata, mașina e desenată în creion, așa că primul frame de Sketchbook nu mai așteaptă după ele. Fără asta, prima intrare în Sketchbook avea un long task de până la 0,5 s.
- **Alte butoane:**
  - `userData.sketchNoHull = true` scoate un subarbore doar din contur; rămâne desenat în creion;
  - `sketchPlainOn = false` (sau `__perfLab.sketchPlain(false)`) oprește tot mecanismul;
  - `OutlineEffect.skipHull` e un predicat general: `null` înseamnă exact comportamentul de dinainte.
- **Pentru un shader nou de Sketchbook:** trebuie să păstreze `gl_FragDepth` = adâncimea scenei, cu `depthTest: true, depthFunc: AlwaysDepth, depthWrite: true` pe quad-ul final.
- **Cost:** o trecere mică (doar obiectele plain), fără refacerea umbrelor și fără recalcularea matricelor. Am pornit și oprit `__perfLab.sketchPlain` pe rând, de trei ori, și am comparat medianele: ~0 pe hartă, cel mult ~0,5 ms în Street view (acolo mașina e mare în cadru și e umbrită de două ori). Asta pe laptop și în WebKit, cu un zgomot de ±1 ms de la o încercare la alta.

**DOM** (`styles.css`, după blocul Sketchbook):
- `.nav2-ui`, `.map-pins` și orice element cu clasa `.sk-plain` nu primesc în Sketchbook filtre CSS și nici animații pe `::before`, oricare ar fi regulile de look.
- Acum regula nu schimbă nimic vizibil: nimic de acolo nu avea filtru. E o plasă pentru look-ul nou: un filtru pe DOM care se schimbă la fiecare frame se re-calculează la fiecare schimbare.

Celelalte lumi nu rulează nimic din toate acestea. Le-am verificat înainte și după, pe Cromatic și Night Mode, pe hartă, aproape de mașină și în Street view:

- între 3.68 și 3.75: diferența medie e de 2,7-3,6 / 255, iar 0,1-0,5 % din pixeli diferă cu mai mult de 24;
- între două capturi ale aceluiași 3.68: 2,7-3,9 / 255 și 0,1-0,6 %.

Adică exact zgomotul grain-ului de film, care se schimbă la fiecare frame.

## Instrumente

- `window.__perfLab.bench(n, trials)` dă costul unui frame din lumea curentă, CPU și GPU împreună, fără 60 Hz-ul ecranului (`{ min, med }` în ms).
- `window.__perfLab.sketchPlain(on)` pornește și oprește trecerea plain, pentru A/B.
- Scripturile Playwright ale auditului (scene, trace, bench, suprapuneri, hit-test) sunt în scratchpad-ul sesiunii, `sk/*.mjs`.
