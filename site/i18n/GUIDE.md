# Romanian translation guide (Cromatic Studios website)

You translate the English website of Cromatic Studios (an independent creative studio in Bucharest: brand strategy,
identity, websites and apps, film, content) into Romanian. The output becomes the Romanian site under /ro/.

## Format
- Input: a JSON object `{ "<English block>": "<page path>" }`. The page path is context only.
- Output: a JSON object `{ "<English block>": "<Romanian block>" }` with EVERY key of the input, keys copied byte for
  byte (do not change, trim or re-escape a key). Write it with a script (e.g. node or python `json.dump(...,
  ensure_ascii=False, indent=1)`) so the JSON is valid.
- Blocks may contain inline HTML (`<strong>`, `<em>`, `<a href="...">`, `<span ...>`, `<br>`, `<mark>`, `<i>`) and
  entities (`&amp;`, `&nbsp;`). Keep every tag and attribute exactly as it is (same order, same attributes, same
  hrefs); translate only the text between tags. Keep entities as entities (`&amp;` stays `&amp;`).
- If a block has nothing to translate (a proper name, a URL, a code, a hex colour), return it unchanged.

## Language and voice
- Natural, modern, native Romanian, with correct diacritics (ă â î ș ț, comma-below ș/ț, never cedilla ş/ţ).
- Address the reader with **tu** (informal, warm), never "dumneavoastră". The studio speaks as **noi**.
- The voice is warm, confident, concrete, a little witty, short sentences. Do not translate word by word: write the
  sentence a good Romanian copywriter would write. Keep the jokes working in Romanian.
- No anglicisms where a natural Romanian word exists, but keep the industry terms Romanians actually use: branding,
  brand, rebranding, packaging (or ambalaj), webshop / magazin online, social media, content, UX, UI, design system,
  brand book, moodboard, mockup, reels, feed, newsletter, specialty coffee (or cafea de specialitate), fintech.
- Typographic quotes: use Romanian quotes „…” for quoted speech and titles in running text.
- Numbers: Romanian format for words (10 ani, 3×). Keep units and years as they are.

## Keep in English (do not translate)
- Brand and client names, product names, places: Cromatic Studios, Two Minutes, Two Min Lab, Steam, Slow Coffee
  Festival, Craft Coffee, Kómpus, ARCA, UNDÉ, Antila, Casa Berero, COMM, UNITY, etc.
- The map's street names: Coffee Street, Fintech Boulevard, Medical Avenue, The Shortest Shortcut, Bulevardul Dacia 99.
- The four chapter names: The Dream, The Voice, The World, The Crowd (you may add the Romanian meaning around them
  where a sentence explains them, but the names stay English).
- Client taglines and slogans that are the client's own English lines (e.g. "Designed by the skin architects in
  Barcelona", "Tomorrow's craft. Today's partnership.", "Two minutes to fall for it", deck titles quoted from a
  client): keep them in English, inside the sentence.
- Text that is already Romanian (song titles, Romanian slogans like „Oprește producția!”): keep it.
- "There is always a coffee." becomes „Cafeaua e mereu pe masă.” (the studio's motto in Romanian), and "Take the 3D
  drive" becomes „Ia-o pe drumul 3D”.

## SEO (titles, descriptions)
- Blocks that end in " · Cromatic Studios" are page titles: keep that suffix exactly; make the Romanian part rich in
  the words Romanians search: „agenție de branding București”, „studio de branding”, „identitate vizuală”,
  „design de ambalaje”, „branding pentru cafenele”, „site de prezentare”, „magazin online”, „producție video”,
  „strategie de brand”. Keep it natural; max ~60 characters before the suffix.
- Meta descriptions (long one-paragraph blocks that summarise a page) stay under 160 characters.

## Fixed terms
- Case study → studiu de caz; Case studies → studii de caz; "Read the case" → „Citește studiul de caz”
- Start a project → Pornim un proiect; See the work → Vezi proiectele
- Brand strategy → Strategie de brand; Brand identity → Identitate de brand / identitate vizuală
- Websites & apps → Site-uri și aplicații; Video production → Producție video; Social media & content → Social media
  și conținut; Growth & Content → Creștere și conținut; Branding & Design → Branding și design; UX & UI Design → Design UX și UI
- Founder → fondator; Partner → partener; CEO stays CEO; Creative Architect → arhitect creativ
- The crew → Echipa; Brilliant humans → Oameni geniali
- Your brand next? → Urmează brandul tău?; Before the coffee → Înainte de cafea; What do you dream of? → La ce visezi?
