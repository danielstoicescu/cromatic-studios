# GA4 pe mini-game („At the gloves with I O N”, /play/gloves/)

De la beta 3.41 (r211), jocul trimite evenimente în GA4 (proprietatea **G-BRW5QJTJ77**), prin același `gtag` ca restul site-ului.

## Pe scurt

- **În GTM nu trebuie făcut nimic.** Containerul GTM-K5XBHKND nu are niciun tag. GA4 rulează pe site direct prin `gtag`, nu prin GTM. Dacă ai adăuga acum în GTM un tag GA4, fiecare vizită s-ar număra de două ori.
- **În GA4 ai de făcut trei lucruri, o singură dată:**
  1. înregistrezi dimensiunile custom (lista de mai jos);
  2. marchezi un key event;
  3. îți salvezi explorarea (pâlnia).
- **Consimțământ:** jocul trimite ceva doar dacă vizitatorul a spus „Sure” pe cardul de cookie-uri. La „No, thanks”, sau fără niciun răspuns, nu se trimite nimic. Nici măcar scriptul Google nu se încarcă.
  - Am testat toate cele trei stări.
  - Dacă jocul e deschis din hartă, cardul nu mai apare a doua oară. Jocul folosește răspunsul dat deja pe hartă.
  - Dacă jocul e deschis singur (un link trimis cuiva), cardul apare și pe pagina jocului.
- **Codul de pe voucher nu se trimite.** E unic, iar odată folosit în cafenea ar putea lega o vizită de o persoană. Se trimite doar faptul că a apărut un voucher (`voucher: batch_brew`).

## De unde au venit (`entry_source`)

Fiecare buton care deschide jocul pune în link un `?from=…`. Jocul îl citește și îl scoate imediat din adresă, ca linkurile distribuite să rămână curate.

| entry_source | Ce înseamnă |
|---|---|
| `map-card-two-minutes` | butonul „Challenge I O N to a fight!” de pe cardul Two Minutes |
| `map-card-lab` | același buton, de pe cardul Two Min Lab |
| `map-card-arcade` | cardul jocului (automatul de lângă Lab) |
| `lab-modal` | butonul „Play” din fereastra Two Min Lab |
| `utm-<sursa>` | un link cu `utm_source`, de exemplu `utm-instagram` |
| `site` | venit de pe o pagină de-a noastră, fără `from` |
| `ref-<domeniu>` | venit de pe alt site, de exemplu `ref-facebook.com` |
| `direct` | nimic din cele de mai sus: adresa scrisă de mână, un bookmark |

Sursa, mediumul și campania (UTM, referrer) le înregistrează oricum GA4 la `page_view`, în rapoartele lui obișnuite (Acquisition). Adresa paginii (`page_location`) păstrează parametrii din link, inclusiv `utm_*` și `embed=1`. Doar `from` dispare, pentru că e deja în `entry_source`.

## Evenimentele

| Eveniment | Când | Parametri |
|---|---|---|
| `gloves_open` | s-a deschis jocul | `entry_source`, `device` (phone/tablet/desktop), `orientation` (portrait/landscape), `in_map` (yes = în fereastra din hartă, no = pagina singură) |
| `gloves_start` | a apăsat Start pe ecranul de titlu | `device` |
| `gloves_pick` | a ales luptătorii | `fighter`, `cpu_fighter`, `random_pick` (yes/no) |
| `gloves_round_end` | s-a terminat o rundă | `round`, `winner` (player/cpu/draw), `time_left` (secunde), `player_hp` (rotunjit la 10), `fighter`, `cpu_fighter` |
| `gloves_match_end` | s-a terminat meciul | `result` (win/lose), `rounds_won`, `rounds_lost`, `duration_s`, `fighter`, `cpu_fighter` |
| `gloves_voucher_shown` | a câștigat și a văzut voucherul | `voucher` (batch_brew), `fighter`, `cpu_fighter` |
| `gloves_rematch` | „Rematch” după meci | `fighter`, `cpu_fighter`, `last_result` |
| `gloves_change_fighters` | „Change fighters” | `from_screen` (result/pause) |
| `gloves_back_to_map` | „Back to map” sau Esc | `from_screen` (title/select/vs/fight/result/pause) |
| `gloves_sound_toggle` | a pornit sau a oprit sunetul | `sound` (on/off) |
| `gloves_rotate_prompt_shown` | telefon ținut vertical: a apărut „Rotate your phone” (o dată pe vizită) | `device` |
| `gloves_exit` | a închis jocul (sau a plecat de pe pagină) | `last_screen`, `time_on_game_s`, `matches_played` |

Cum sunt făcute:
- Toți parametrii au puține valori posibile și nu conțin date personale.
- Nimic nu se trimite „pe fiecare cadru”: fiecare eveniment e un click sau o schimbare de ecran.
- Toate se văd în Realtime și în DebugView (cu extensia Tag Assistant).

## 1. Dimensiunile custom

GA4 → Admin → **Data display → Custom definitions → Create custom dimension**. Scope: **Event** pentru toate. Numele afișat poate fi oricare; **„Event parameter” trebuie scris exact ca mai jos**:

| Event parameter | Nume sugerat | Tip |
|---|---|---|
| `entry_source` | Gloves · entry source | dimensiune |
| `device` | Gloves · device | dimensiune |
| `orientation` | Gloves · orientation | dimensiune |
| `in_map` | Gloves · in map | dimensiune |
| `fighter` | Gloves · fighter | dimensiune |
| `cpu_fighter` | Gloves · CPU fighter | dimensiune |
| `result` | Gloves · result | dimensiune |
| `winner` | Gloves · round winner | dimensiune |
| `from_screen` | Gloves · from screen | dimensiune |
| `last_screen` | Gloves · last screen | dimensiune |
| `random_pick` | Gloves · random pick | dimensiune |
| `sound` | Gloves · sound | dimensiune |

Opțional, ca **metrici custom** (Custom metrics, scope Event, unit Standard): `duration_s`, `time_on_game_s`, `matches_played`, `rounds_won`, `rounds_lost`, `time_left`, `player_hp`.

GA4 arată datele pentru o dimensiune doar de când a fost creată, nu și din urmă. Merită creată din prima zi.

## 2. Key event

GA4 → Admin → **Data display → Events**. După ce evenimentul a apărut măcar o dată, îl marchezi ca **Key event**:

- **`gloves_voucher_shown`**: cineva l-a bătut pe I O N și a primit voucherul. Ăsta e „câștigul” jocului pentru Two Minutes. Recomandat ca key event.
- Opțional, `gloves_match_end` ca al doilea key event, „a jucat un meci întreg”.

Dacă vrei un key event doar pentru victorii, fără voucher: Admin → Events → **Create event** → nume `gloves_win`, condiții `event_name equals gloves_match_end` și `result equals win`. Apoi îl marchezi pe `gloves_win` ca key event. Nu e nevoie, pentru că voucherul apare exact la victorie.

## 3. Explorarea sugerată (pâlnia)

GA4 → **Explore → Funnel exploration**:
- Pași:
  1. `gloves_open`
  2. `gloves_start`
  3. `gloves_pick`
  4. `gloves_match_end`
  5. `gloves_voucher_shown`
- **Breakdown:** `Gloves · entry source`. Vezi care intrare aduce oameni care chiar joacă.
- Încearcă și breakdown pe `Gloves · device`, ca să vezi dacă telefonul pierde oameni la pasul de rotire. Compară cu numărul de `gloves_rotate_prompt_shown`.
- Bifează „Make open funnel” doar dacă vrei să numeri și pe cei care intră direct la un pas.

Alte explorări utile, de tip Free form:
- `fighter` × `result`: cu cine se câștigă.
- `last_screen` pe `gloves_exit`: unde renunță oamenii.
- Media lui `duration_s` pe `gloves_match_end`.

## Opțional: dacă vreodată muți GA4 în GTM

Acum nu e cazul. Dacă vrei la un moment dat ca GA4 să ruleze prin GTM:
1. Scoți întâi GA4 din `gtag` (în `build/consent.mjs`), altfel totul se numără de două ori.
2. În GTM: un tag **Google tag** cu ID-ul G-BRW5QJTJ77, trigger **Initialization – All Pages** (dar numai după consimțământ, prin Consent Mode).
3. Jocul pune deja în `dataLayer` și un eveniment simplu, fără efect cât timp GTM e gol:
   ```
   { event: "gloves", gloves_event: "<numele>", gloves_params: { … } }
   ```
4. În GTM ai nevoie de:
   - o variabilă Data Layer `gloves_event`;
   - câte o variabilă Data Layer pentru fiecare parametru, de exemplu `gloves_params.entry_source`;
   - un trigger **Custom Event** cu numele `gloves`;
   - un tag **GA4 Event** cu Event Name `{{gloves_event}}` și parametrii mapați din variabile.
