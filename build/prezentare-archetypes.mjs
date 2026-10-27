// r332: the twelve archetypes as The Core 3.0 has them (~/cromatic-core: src/config/library/archetypes.{en,ro}.ts for the
// names, zones, colours, mottos and example brands; src/components/items/ArchArt.tsx for the drawings; the wheel's
// geometry from src/components/items/ArchWheel.tsx). Generated from those files (not hand-written): regenerate when
// The Core changes them. Hex values hard-coded on purpose (SVG presentation attributes).
const Y = "#FED012", B = "#119BFE", G = "#28C840", R = "#F65342", L = "#B098C8", W = "#fbfaf5", K = "#0d0c09";
function star(cx, cy, r) { const k = r * 0.28; return `M${cx} ${cy - r} Q${cx + k} ${cy - k} ${cx + r} ${cy} Q${cx + k} ${cy + k} ${cx} ${cy + r} Q${cx - k} ${cy + k} ${cx - r} ${cy} Q${cx - k} ${cy - k} ${cx} ${cy - r}Z`; }
function rr(x, y, w, h, r) { return `M${x + r} ${y}h${w - 2 * r}a${r} ${r} 0 010 ${h}h${-(w - 2 * r)}a${r} ${r} 0 010 ${-h}z`; }
const ART = {
  innocent: (s) => `<g stroke="${s}" stroke-width="2.4" stroke-linejoin="round"> ${Array.from({ length: 12 }, (_, i) => `<ellipse cx="60" cy="36" rx="7.5" ry="17" fill="${W}" transform="rotate(${i * 30} 60 60)"/>`).join("")} <circle cx="60" cy="60" r="15" fill="${R}" /> <path d="M53 60q7 7 14 0" fill="none" stroke-linecap="round" /> <circle cx="55" cy="55" r="1.6" fill="${s}" stroke="none" /><circle cx="65" cy="55" r="1.6" fill="${s}" stroke="none" /> </g>`,
  explorer: (s) => `<g stroke="${s}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"> <circle cx="88" cy="30" r="10" fill="${Y}" /> <path d="M8 100L44 38l18 30 12-18 38 50z" fill="${W}" /> <path d="M44 38l-8 14 6-2 4 5 4-6 4 3z" fill="${B}" /> <path d="M44 38V20" /><path d="M44 20h14l-4 5 4 5H44" fill="${R}" /> <path d="M30 100c8-10 22-8 26-16s14-10 22-6" fill="none" stroke-dasharray="3 5" /> </g>`,
  sage: (s) => `<g stroke="${s}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"> <path d="M60 52c-14-8-30-8-44-4v48c14-4 30-4 44 4z" fill="${W}" /> <path d="M60 52c14-8 30-8 44-4v48c-14-4-30-4-44 4z" fill="${W}" /> <path d="M60 52v48" /> <path d="M26 62c8-2 16-2 24 1M26 72c8-2 16-2 24 1M70 63c8-3 16-3 24-1M70 73c8-3 16-3 24-1" fill="none" /> <path d="${star(60, 26, 13)}" fill="${Y}" /> <path d="M40 22l-6-4M80 22l6-4M60 6V2" fill="none" /> </g>`,
  hero: (s) => `<g stroke="${s}" stroke-width="2.4" stroke-linejoin="round"> <path d="M60 14l34 12v28c0 24-16 38-34 48-18-10-34-24-34-48V26z" fill="${W}" /> <path d="M66 30L46 64h14l-8 26 22-36H60z" fill="${Y}" /> </g>`,
  rebel: (s) => `<g stroke="${s}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"> <path d="${rr(6, 44, 50, 28, 14)} ${rr(16, 52, 30, 12, 6)}" fill="${W}" fill-rule="evenodd" transform="rotate(-24 31 58)" /> <path d="${rr(64, 52, 50, 28, 14)} ${rr(74, 60, 30, 12, 6)}" fill="${W}" fill-rule="evenodd" transform="rotate(20 89 66)" /> <path d="M56 26l-4 14 8-2-4 14" fill="none" stroke="${R}" stroke-width="3.4" /> <path d="M66 96l4-12-8 2 4-12" fill="none" stroke="${R}" stroke-width="3.4" /> <circle cx="44" cy="92" r="3" fill="${Y}" /><circle cx="78" cy="26" r="3" fill="${Y}" /> </g>`,
  magician: (s) => `<g stroke="${s}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"> <rect x="52" y="20" width="12" height="84" rx="3" fill="${K}" transform="rotate(38 58 62)" /> <rect x="52" y="20" width="12" height="16" rx="3" fill="${W}" transform="rotate(38 58 62)" /> <path d="${star(84, 30, 16)}" fill="${Y}" /> <path d="${star(30, 34, 9)}" fill="${W}" /> <path d="${star(96, 76, 8)}" fill="${W}" /> <circle cx="70" cy="18" r="2.5" fill="${W}" /> </g>`,
  everyman: (s) => `<g stroke="${s}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"> <g transform="rotate(-10 38 70)"> <path d="M18 50h36l-4 40H22z" fill="${W}" /> <path d="M54 58h6a8 8 0 010 16h-8" fill="none" /> <path d="M22 60h30" fill="none" /> </g> <g transform="rotate(12 82 70)"> <path d="M66 50h36l-4 40H70z" fill="${Y}" /> <path d="M66 58h-6a8 8 0 000 16h8" fill="none" /> </g> <path d="M36 38c-4-6 4-8 0-14M56 34c-4-6 4-8 0-14M80 38c-4-6 4-8 0-14" fill="none" /> </g>`,
  lover: (s) => `<g stroke="${s}" stroke-width="2.4" stroke-linejoin="round"> <path d="M46 98C18 78 10 62 14 48c4-14 22-18 32-4 10-14 28-10 32 4 4 14-4 30-32 50z" fill="${W}" transform="rotate(-10 46 70)" /> <path d="M76 90C54 74 48 62 51 51c3-11 17-14 25-3 8-11 22-8 25 3 3 11-3 23-25 39z" fill="#ffd9e6" transform="rotate(12 76 68)" /> </g>`,
  jester: (s) => `<g stroke="${s}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"> <path d="M24 86c-2-26-6-40-16-52 18 2 30 14 36 30 2-20 8-36 16-48 8 12 14 28 16 48 6-16 18-28 36-30-10 12-14 26-16 52z" fill="${B}" /> <path d="M60 16c8 12 14 28 16 48l-16 22-16-22c2-20 8-36 16-48z" fill="${R}" /> <path d="M22 86h76v12H22z" fill="${W}" /> <circle cx="8" cy="34" r="6" fill="${W}" /><circle cx="60" cy="14" r="6" fill="${W}" /><circle cx="112" cy="34" r="6" fill="${W}" /> </g>`,
  caregiver: (s) => `<g stroke="${s}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"> <path d="M12 54C14 30 36 16 60 16s46 14 48 38c-8-6-16-6-24 0-8-6-16-6-24 0-8-6-16-6-24 0-8-6-16-6-24 0z" fill="${W}" /> <path d="M60 16v-6" fill="none" /> <path d="M60 54v34c0 8-12 8-12 0" fill="none" /> <path d="M86 100c-10-7-14-12-13-17 1-5 8-6 13-1 5-5 12-4 13 1 1 5-3 10-13 17z" fill="${R}" /> </g>`,
  creator: (s) => `<g stroke="${s}" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"> <circle cx="50" cy="66" r="32" fill="none" stroke-dasharray="4 6" /> <circle cx="50" cy="66" r="14" fill="${Y}" /> <g transform="rotate(40 82 46)"> <rect x="74" y="8" width="16" height="62" fill="${W}" /> <rect x="74" y="8" width="16" height="12" fill="${R}" /> <path d="M74 70l8 18 8-18z" fill="#f3d9b1" /> <path d="M79 81l3 7 3-7z" fill="${s}" /> </g> </g>`,
  ruler: (s) => `<g stroke="${s}" stroke-width="2.4" stroke-linejoin="round"> <path d="M18 86L12 34l26 22 22-34 22 34 26-22-6 52z" fill="${Y}" /> <path d="M18 86h84v14H18z" fill="${Y}" /> <circle cx="12" cy="32" r="5" fill="${W}" /><circle cx="60" cy="20" r="6" fill="${W}" /><circle cx="108" cy="32" r="5" fill="${W}" /> <circle cx="40" cy="93" r="3.5" fill="${R}" /><circle cx="60" cy="93" r="3.5" fill="${B}" /><circle cx="80" cy="93" r="3.5" fill="${G}" /> <circle cx="60" cy="66" r="7" fill="${L}" /> </g>`,
};
export const archArt = (id, dark = false, size = 120) => ART[id] ? `<svg class="art" viewBox="0 0 120 120" width="${size}" height="${size}" aria-hidden="true" focusable="false">${ART[id](dark ? W : K)}</svg>` : "";
export const archArtG = (id, dark = false) => ART[id] ? ART[id](dark ? W : K) : "";
// the studio wheel's order (The Core 2.0 workbook) and the zone colours, as in ArchWheel.tsx
export const ORDER = ["stabilitate", "independenta", "maiestrie", "apartenenta"];
export const ZONE = { independenta: "#FED012", maiestrie: "#F65342", apartenenta: "#B098C8", stabilitate: "#119BFE" };
export const QUADRANTS = {"en": {"stabilitate": {"name": "Stability & Control", "need": "gives structure and safety"}, "apartenenta": {"name": "Belonging", "need": "brings people closer"}, "maiestrie": {"name": "Risk & Achievement", "need": "changes something in the world"}, "independenta": {"name": "Learning & Freedom", "need": "looks for fulfilment and meaning"}}, "ro": {"stabilitate": {"name": "Stabilitate și control", "need": "oferă structură și siguranță"}, "apartenenta": {"name": "Apartenență", "need": "îi apropie pe oameni"}, "maiestrie": {"name": "Risc și reușită", "need": "schimbă ceva în lume"}, "independenta": {"name": "Învățare și libertate", "need": "caută împlinire și sens"}}};
export const ARCHETYPES = [
{
"id": "innocent",
"name": "Innocent",
"q": "independenta",
"color": "#FED012",
"example": "Dove, Innocent Drinks, Coca-Cola",
"motto": {
"en": "Life can be simple and good.",
"ro": "Viața poate fi simplă și bună."
},
"line": {
"en": "Optimistic, honest, nothing to hide. Sees the good before the problem and helps people breathe easier.",
"ro": "Optimist, onest, fără ascunzișuri. Vede binele înaintea problemei și îi face pe oameni să respire mai ușor."
}
},
{
"id": "explorer",
"name": "Explorer",
"q": "independenta",
"color": "#28C840",
"example": "Patagonia, The North Face, Jeep",
"motto": {
"en": "Don't fence me in.",
"ro": "Nu mă închide într-o cutie."
},
"line": {
"en": "Curious, restless in the good way, always with a road in mind. Looks for the place where it feels most alive.",
"ro": "Curios, neliniștit în sensul bun, mereu cu un drum în cap. Caută locul unde se simte cel mai viu."
}
},
{
"id": "sage",
"name": "Sage",
"q": "independenta",
"color": "#119BFE",
"example": "TED, Google, The Economist",
"motto": {
"en": "The truth will set you free.",
"ro": "Adevărul te eliberează."
},
"line": {
"en": "Calm, well read, with the patience of a good teacher. Helps people see clearly before they decide.",
"ro": "Calm, documentat, cu răbdare de profesor bun. Ajută oamenii să vadă limpede înainte să decidă."
}
},
{
"id": "hero",
"name": "Hero",
"q": "maiestrie",
"color": "#F65342",
"example": "Nike, FedEx, Duracell",
"motto": {
"en": "Where there's a will, there's a way.",
"ro": "Unde e voință, e și drum."
},
"line": {
"en": "Brave, disciplined, built for high stakes. Makes hard things look possible and pushes others further.",
"ro": "Curajos, disciplinat, făcut pentru mize mari. Face lucrurile grele să pară posibile și îi împinge pe alții mai departe."
}
},
{
"id": "rebel",
"name": "Rebel",
"q": "maiestrie",
"color": "#F65342",
"example": "Harley-Davidson, Liquid Death, Virgin",
"motto": {
"en": "Rules are made to be broken.",
"ro": "Regulile sunt făcute ca să fie încălcate."
},
"line": {
"en": "A nonconformist, honest to the point of discomfort. Says what others only think and builds the alternative.",
"ro": "Nonconformist, sincer până la incomod. Spune ce alții doar gândesc și construiește alternativa."
}
},
{
"id": "magician",
"name": "Magician",
"q": "maiestrie",
"color": "#B098C8",
"example": "Disney, Dyson, Polaroid",
"motto": {
"en": "I make things happen.",
"ro": "Fac să se întâmple."
},
"line": {
"en": "Visionary, charismatic, tuned to the moment when everything clicks. Turns a vague wish into something real.",
"ro": "Vizionar, carismatic, atent la momentul în care totul se leagă. Transformă o dorință vagă într-o realitate."
}
},
{
"id": "everyman",
"name": "Everyman",
"q": "apartenenta",
"color": "#28C840",
"example": "IKEA, Dacia, Lidl",
"motto": {
"en": "All people are equal.",
"ro": "Toți oamenii sunt egali."
},
"line": {
"en": "Friendly, down to earth, no airs. The neighbour you can count on, who talks like you and keeps the door open.",
"ro": "Prietenos, realist, fără ifose. Vecinul pe care te bazezi, care vorbește ca tine și îți ține ușa deschisă."
}
},
{
"id": "lover",
"name": "Lover",
"q": "apartenenta",
"color": "#F65342",
"example": "Chanel, Godiva, Aperol",
"motto": {
"en": "You're the only one.",
"ro": "Tu ești singurul."
},
"line": {
"en": "Sensory, warm, attentive to detail. Creates closeness and makes people feel wanted and seen.",
"ro": "Senzorial, cald, atent la detalii. Creează apropiere și îi face pe oameni să se simtă doriți și văzuți."
}
},
{
"id": "jester",
"name": "Jester",
"q": "apartenenta",
"color": "#FED012",
"example": "M&M's, Old Spice, Ben & Jerry's",
"motto": {
"en": "You only live once.",
"ro": "Trăim o singură dată."
},
"line": {
"en": "Playful, spontaneous, with a good sense of humour. Lightens hard moments and gathers people around a joke.",
"ro": "Jucăuș, spontan, cu umor bun. Ușurează momentele grele și îi adună pe oameni în jurul unei glume."
}
},
{
"id": "caregiver",
"name": "Caregiver",
"q": "stabilitate",
"color": "#119BFE",
"example": "Volvo, UNICEF, Johnson & Johnson",
"motto": {
"en": "You're not alone in this.",
"ro": "Nu ești singur în asta."
},
"line": {
"en": "Generous, protective, endlessly patient. Looks after people like family and never leaves them on their own.",
"ro": "Generos, protector, cu răbdare infinită. Are grijă de oameni cum ar avea de familie și nu-i lasă singuri."
}
},
{
"id": "creator",
"name": "Creator",
"q": "stabilitate",
"color": "#B098C8",
"example": "LEGO, Apple, Adobe",
"motto": {
"en": "If you can imagine it, you can build it.",
"ro": "Dacă poți să-ți imaginezi, poți să construiești."
},
"line": {
"en": "Imaginative, a perfectionist, proud of the craft. Sees what doesn't exist yet and builds it with care.",
"ro": "Imaginativ, perfecționist, mândru de meșteșug. Vede ce nu există încă și îl construiește cu grijă."
}
},
{
"id": "ruler",
"name": "Ruler",
"q": "stabilitate",
"color": "#0d0c09",
"example": "Rolex, Mercedes-Benz, American Express",
"motto": {
"en": "The standard is the promise.",
"ro": "Standardul e promisiunea."
},
"line": {
"en": "Self-assured, organised, with high standards. Creates order, makes decisions and sets the rules of the game.",
"ro": "Sigur pe el, organizat, cu standarde înalte. Creează ordine, ia decizii și stabilește regula jocului."
}
}
];
