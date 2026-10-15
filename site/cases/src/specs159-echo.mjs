// r159: Echo School (School of Technology, Digital Arts & Videogames, Bucharest). Daniel: "For Echo School we mostly did
// social media communication: the Instagram account, for 2 years." The page reads as a feed, grouped by Daniel's themes:
// static posts, carousels (swipe or drag, with dots) and reels (short silent loops, poster first, playing only on screen).
// Everything shown is Echo School's own published material (site/media/echo-school: the posts at their web size, the reels
// cut to 6-12 s, 540x960, no sound). One variant of each post: the story versions and the alternates are left out.
// No quotes, numbers or results of our own: only what the posts themselves show.
import { readFileSync } from "node:fs";

const DIMS = JSON.parse(readFileSync(new URL("./dims.json", import.meta.url), "utf8"));
const m = (p) => "m:echo-school/" + p;
const esc = (s) => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const r4 = (n) => (+n).toFixed(4).replace(/\.?0+$/, "");
const dim = (n) => {
  const d = DIMS[m(n)];
  if (!d) throw new Error("echo-school: no dims for " + n);
  return d;
};
const SIZES = "auto, (max-width: 760px) 92vw, 440px";
const pic = (n, alt) => { const [w, h] = dim(n); return `<img src="${m(n)}" alt="${esc(alt)}" width="${w}" height="${h}" loading="lazy" decoding="async" sizes="${SIZES}" draggable="false">`; };

// ---- the posts ----
const head = (kind, date) => `<header class="fp-h"><span class="fp-av" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></span><span class="fp-who"><b>Echo School</b><span class="fp-meta"><span>${kind}</span>${date ? `<time>${date}</time>` : ""}</span></span></header>`;
const cap = (c) => (c ? `<p class="fp-c">${c}</p>` : "");
// a static post
const post = (n, alt, c, date, kind = "Post") => {
  const [w, h] = dim(n);
  return `<article class="fp">${head(kind, date)}<div class="fp-m" style="--r:${r4(w / h)}">${pic(n, alt)}</div>${cap(c)}</article>`;
};
// a carousel: the slides share the first one's frame
const carousel = (slides, c, date, r) => {
  const [w, h] = dim(slides[0][0]);
  const n = slides.length;
  return `<article class="fp fp--car">${head("Carousel", date)}<div class="fp-m fp-car" data-fc style="--r:${r4(r || w / h)}">
<div class="fp-tr" tabindex="0" aria-label="Carousel: swipe, drag or use the arrow keys">${slides.map(([s, alt], i) => `<div class="fp-s" aria-label="${i + 1} / ${n}">${pic(s, alt)}</div>`).join("")}</div>
<button type="button" class="fp-b fp-prev" data-p aria-label="Previous slide" disabled><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 5l-7 7 7 7"/></svg></button><button type="button" class="fp-b fp-next" data-n aria-label="Next slide"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7"/></svg></button><span class="fp-n" aria-hidden="true">1/${n}</span>
</div><div class="fp-dots" aria-hidden="true">${slides.map((_, i) => `<i${i ? "" : ' class="on"'}></i>`).join("")}</div>${cap(c)}</article>`;
};
// a reel: a short silent loop, its poster set once the page has painted, playing only while on screen
const reel = (n, alt, c, date) => `<article class="fp fp--reel">${head("Reel", date)}<div class="fp-m fp-reel" style="--r:0.5625"><video src="${m(n)}" data-poster="${m(n + "-poster")}" muted loop playsinline preload="none" aria-label="${esc(alt)}"></video><span class="fp-mark" aria-hidden="true"><svg viewBox="0 0 24 24"><path d="M8 5.5v13l11-6.5z"/></svg></span></div>${cap(c)}</article>`;
// the sticker set, laid out as one sheet
const STICKER_TILT = [-6, 4, -3, 7, -5, 3, 5, -7, 2, -4, 6, -2];
const sheet = (c, date) => `<article class="fp">${head("Post", date)}<div class="fp-m fp-sheet" style="--r:0.75"><div class="fp-grid" role="img" aria-label="Twelve stickers: From Gamer to Creator, the Echo School character, Just one more render, It's not a bug, it's a feature, and FPS is my love language">${STICKER_TILT.map((t, i) => `<span class="fp-st" style="--t:${t}deg">${pic(`sticker-${String(i + 1).padStart(2, "0")}`, "")}</span>`).join("")}</div></div>${cap(c)}</article>`;
const feed = (...posts) => ({ raw: `<div class="feed${posts.length === 1 ? " feed--solo" : posts.length === 2 ? " feed--duo" : ""}">\n${posts.join("\n")}\n</div>` });

// ---- the themes ----
const GOLDEN = carousel([
  ["golden-1", "Carousel cover: Care-i faza cu drumul galben?, with a pixel-art scroll"],
  ["golden-2", "Slide: in game dev it is called the golden path"],
  ["golden-3", "Slide: a pixel signpost, and where the term comes from"],
  ["golden-4", "Slide: the golden path as a game developer's compass"],
  ["golden-5", "Slide: without a golden path, the game turns into chaos"],
  ["golden-6", "Slide: Drumul tău galben unde te duce? It can start at Echo School"]
], "“Care-i faza cu drumul galben?” The golden path, the main route that takes a player to the end of a game.", "Oct 2025");
const ECONOMY = carousel([
  ["economy-1", "Carousel cover: Care-i scopul unei economii de joc?, with pixel coins"],
  ["economy-2", "Slide: game economy is emotional maths"],
  ["economy-3", "Slide: soft and hard currency, points, XP, upgrades and loot"],
  ["economy-4", "Slide: game economy is the heart of the game, with a pixel controller"],
  ["economy-5", "Slide: at Echo School you learn how the world behind the world is built"]
], "“Care-i scopul unei economii de joc?” Game economy, explained as emotional maths.", "Oct 2025");
const ONE_TAKE = carousel([
  ["one-take-1", "Carousel cover: Ai observat că în God of War: Ragnarök nu sunt tăieturi de cameră?"],
  ["one-take-2", "Slide: everything flows because dozens of teams worked in sync: art, gameplay, animation, sound"],
  ["one-take-3", "Slide: why a media production course matters"],
  ["one-take-4", "Slide: you work in a team and turn an idea into an interactive prototype"]
], "No camera cuts in God of War: Ragnarök, and the teams it takes. A carousel on media production.", "Nov 2025");

const GDR = carousel([
  ["gdr-1", "Carousel cover: Game Dev Românesc, made here, played everywhere"],
  ["gdr-2", "Slide: Link Twin, by Amber"],
  ["gdr-3", "Slide: Bear and Breakfast, by Gummy Cat Studio"],
  ["gdr-4", "Slide: Gibbous: A Cthulhu Adventure, by Stuck In Attic"],
  ["gdr-5", "Slide: Black The Fall, by Sand Sailor Studio"]
], "Made here, played everywhere: Link Twin, Bear and Breakfast, Gibbous: A Cthulhu Adventure and Black The Fall.", "Oct 2025");

const CARDS = carousel([
  ["card-nae", "Game card: Andrei Nae, The Lore Mage, Computer Arts and Animation lecturer"],
  ["card-stancu", "Game card: Gabriel Stancu, The Systemsmith, Game Design and Development lecturer"],
  ["card-solomon", "Game card: Ionuț Solomon, The Quest Maker, Game Design and Development lecturer"],
  ["card-ursu", "Game card: Lilian Ursu, The System Wizard, Game Engineering lecturer"],
  ["card-gherman", "Game card: Marius Gherman, The Code Warlock, Game Engineering lecturer"],
  ["card-zamfir", "Game card: Ștefan Zamfir, The Script Knight, Game Design and Development lecturer"],
  ["card-anghelar", "Game card: Vlad Anghelahar, The Bug Slayer, Game Engineering lecturer"],
  ["card-ionescu", "Game card: Vlad Ionescu, The Kinetic Sorcerer, Computer Arts and Animation lecturer"]
], "The lecturers as game cards, each with a title, an ability and HP 180.", "Nov 2025");

const STUDENTS = carousel([
  ["students-1", "Carousel cover: Echo School through students' eyes, with Maria's portrait"],
  ["students-2", "Slide: Why Echo School?"],
  ["students-3", "Slide: How was the first year?"],
  ["students-4", "Slide: Message for future students"]
], "Echo School through students' eyes: Maria, a Computer Arts and Animation student, answers three questions.", "Nov 2025");

const CAMPUS = carousel([
  ["campus-1", "Students at their computers in a bright classroom with yellow walls"],
  ["campus-2", "Two students laughing at a laptop"],
  ["campus-3", "A team of students presenting in front of a whiteboard"],
  ["campus-4", "Students applauding at an event"],
  ["campus-5", "A large group photo of students and lecturers"],
  ["campus-6", "Students gathered around laptops, laughing"],
  ["campus-7", "Two speakers on stage in front of a Your future. Your game. banner"],
  ["campus-8", "An audience of students listening and smiling"],
  ["campus-9", "A lecturer drawing on a tablet in front of a projection"]
], "Classes, workshops and talks at Echo School, and the people in them.", "", 1.5);

const ADMISSIONS = carousel([
  ["admissions-1", "Carousel cover: Admitere pe loc la Echo School"],
  ["admissions-2", "Slide: apply to Game Engineering, Computer Arts & Animation, Game Design & Development"],
  ["admissions-3", "Slide: 18–28 November 2025, book your place"]
], "Admitere pe loc: apply, and find out on the spot if you are in.", "Nov 2025");

const WINTER = carousel([
  ["winter-1", "Carousel cover: Echo Winter School, Creează un joc în 3 zile, in a snowy scene with game controllers"],
  ["winter-2", "Slide: the mentors, for game design, programming and art"]
], "Echo Winter School, 16–18 February: make a game in three days, with mentors from Funcom and Echo School.", "Jan 2026");

const COMICCON = carousel([
  ["comiccon-1", "Carousel cover: Ne vedem la East European Comic Con, over a fantasy castle"],
  ["comiccon-2", "Slide: a drawing contest and quizzes"],
  ["comiccon-3", "Slide: portfolio reviews with artists from the industry"],
  ["comiccon-4", "Slide: a live illustration demo with Iulia Tivig"]
], "Echo School at East European Comic Con, 24–26 April: what to find at the stand.", "Mar 2026");

const CSS = `
/* r159: the feed. Posts of three kinds (static, carousel, reel) in the site's own chrome: a card with a line, a small header,
   the media, dots under a carousel, a play mark on a reel. Masonry by columns: three on a wide screen, one on a phone. */
.feed{columns:3 240px;column-gap:var(--gutter)}
.feed--duo{columns:auto;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:var(--gutter);align-items:start;max-width:840px}
.feed--duo>.fp{margin:0}
.feed--solo{columns:auto;max-width:520px}
.fp{display:inline-block;width:100%;break-inside:avoid;margin:0 0 var(--gutter);background:var(--white);border:var(--line);border-radius:var(--radius-m);overflow:hidden;vertical-align:top}
.fp-h{display:flex;align-items:center;gap:10px;padding:10px 12px}
.fp-av{flex:none;position:relative;width:32px;height:32px;border-radius:50%;background:var(--accent);box-shadow:0 0 0 2px var(--white),0 0 0 3px var(--ink)}
.fp-av i{position:absolute;width:5px;height:5px;border-radius:50%;background:#fff}
.fp-av i:nth-child(1){left:9px;top:9px}.fp-av i:nth-child(2){left:16px;top:9px}.fp-av i:nth-child(3){left:12px;top:15px}.fp-av i:nth-child(4){left:19px;top:15px}.fp-av i:nth-child(5){left:16px;top:21px}
.fp-who{display:grid;gap:1px;min-width:0}
.fp-who b{font-size:var(--fs-ui);line-height:1;font-weight:800}
.fp-meta{display:flex;flex-wrap:wrap;gap:0 6px;font-size:var(--fs-small);line-height:1.1;font-weight:600;color:var(--muted)}
.fp-meta time::before{content:"·";margin-right:6px}
.fp-m{position:relative;aspect-ratio:var(--r);background:#ececec;border-block:var(--line);overflow:hidden}
.fp-m img,.fp-m video{display:block;width:100%;height:100%;object-fit:cover}
.fp-c{padding:10px 12px 13px;font-size:var(--fs-small);line-height:var(--lh-small);font-weight:600}
/* carousels: native swipe with snap points, mouse drag, arrows on hover, a counter and dots */
.fp-tr{display:flex;height:100%;overflow-x:auto;overflow-y:hidden;scroll-snap-type:x mandatory;scrollbar-width:none;overscroll-behavior-x:contain;-webkit-overflow-scrolling:touch;outline:0}
.fp-tr::-webkit-scrollbar{display:none}
.fp-tr:focus-visible{box-shadow:inset 0 0 0 3px var(--accent)}
.fp-s{flex:0 0 100%;height:100%;scroll-snap-align:start;scroll-snap-stop:always}
.fp-tr.is-drag{scroll-snap-type:none;cursor:grabbing}
.fp-tr.is-drag *{pointer-events:none}
@media (hover:hover) and (pointer:fine){.fp-tr{cursor:grab}}
.fp-b{position:absolute;top:50%;width:36px;height:36px;margin-top:-18px;border-radius:50%;border:var(--line);background:var(--white);color:var(--ink);display:grid;place-items:center;padding:0;cursor:pointer;opacity:0;transition:opacity .2s,background .2s}
.fp-b svg{width:18px;height:18px;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}
.fp-prev{left:10px}.fp-next{right:10px}
.fp-car:hover .fp-b,.fp-b:focus-visible{opacity:1}
.fp-b:hover{background:var(--yellow)}
.fp-b[disabled]{opacity:0 !important;pointer-events:none}
@media (hover:none){.fp-b{display:none}}
.fp-n,.fp-mark{position:absolute;top:10px;right:10px;pointer-events:none}
.fp-n{padding:4px 9px 5px;border-radius:999px;background:rgba(13,12,9,.74);color:#fff;font-size:13px;line-height:1;font-weight:800;font-variant-numeric:tabular-nums}
.fp-mark{width:32px;height:32px;border-radius:50%;background:rgba(13,12,9,.74);display:grid;place-items:center}
.fp-mark svg{width:16px;height:16px;fill:#fff;margin-left:2px}
.fp-dots{display:flex;justify-content:center;gap:5px;padding:11px 12px 0}
.fp-dots i{width:6px;height:6px;border-radius:50%;background:#cfcfcf;transition:background .2s,transform .2s}
.fp-dots i.on{background:var(--accent);transform:scale(1.3)}
/* the sticker set, as one sheet */
.fp-sheet{background:#ece6fb}
.fp-grid{position:absolute;inset:0;display:grid;grid-template-columns:repeat(3,minmax(0,1fr));grid-template-rows:repeat(4,minmax(0,1fr));gap:3.5%;padding:6% 6%}
.fp-st{display:block;min-width:0;min-height:0;transform:rotate(var(--t));transition:transform .35s cubic-bezier(.2,.8,.2,1)}
.fp-st img{width:100%;height:100%;object-fit:contain;mix-blend-mode:multiply}
.fp-st:hover{transform:rotate(0deg) scale(1.12)}
@media (max-width:640px){
  .feed{columns:1}
  .feed--duo{grid-template-columns:minmax(0,1fr);gap:14px}
  .feed--solo{max-width:none}
  .fp{margin-bottom:14px}
}
@media (prefers-reduced-motion:reduce){.fp-st,.fp-dots i,.fp-b{transition:none}}`;

const JS = `// r159: the feed's carousels: swipe (native, snapped), drag with a mouse, arrows, keys; the counter and the dots follow
document.querySelectorAll('[data-fc]').forEach(function(c){
  var tr=c.querySelector('.fp-tr'),n=tr.children.length,post=c.closest('.fp'),dots=post?[].slice.call(post.querySelectorAll('.fp-dots i')):[],cnt=c.querySelector('.fp-n'),pv=c.querySelector('[data-p]'),nx=c.querySelector('[data-n]'),cur=-1,raf=0,down=null;
  var at=function(){return Math.max(0,Math.min(n-1,Math.round(tr.scrollLeft/Math.max(1,tr.clientWidth))))};
  var show=function(){raf=0;var k=at();if(k===cur)return;cur=k;dots.forEach(function(d,j){d.classList.toggle('on',j===k)});if(cnt)cnt.textContent=(k+1)+'/'+n;pv.disabled=k===0;nx.disabled=k===n-1};
  var go=function(k){k=Math.max(0,Math.min(n-1,k));tr.scrollTo({left:k*tr.clientWidth,behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'})};
  tr.addEventListener('scroll',function(){if(!raf)raf=requestAnimationFrame(show)},{passive:true});
  pv.addEventListener('click',function(){go(cur-1)});
  nx.addEventListener('click',function(){go(cur+1)});
  tr.addEventListener('keydown',function(e){if(e.key!=='ArrowRight'&&e.key!=='ArrowLeft')return;e.preventDefault();go(cur+(e.key==='ArrowRight'?1:-1))});
  tr.addEventListener('pointerdown',function(e){if(e.pointerType!=='mouse'||e.button!==0)return;down={x:e.clientX,s:tr.scrollLeft,id:e.pointerId,moved:0}});
  tr.addEventListener('pointermove',function(e){if(!down)return;var dx=e.clientX-down.x;if(!down.moved&&Math.abs(dx)>4){down.moved=1;tr.classList.add('is-drag');try{tr.setPointerCapture(down.id)}catch(_){}}if(down.moved)tr.scrollLeft=down.s-dx});
  var up=function(e){if(!down)return;var d=down;down=null;if(!d.moved)return;var dx=e.clientX-d.x,w=tr.clientWidth,k=Math.round(d.s/w);if(dx<-w*.12)k++;else if(dx>w*.12)k--;tr.classList.remove('is-drag');go(k)};
  tr.addEventListener('pointerup',up);tr.addEventListener('pointercancel',up);
  tr.addEventListener('dragstart',function(e){e.preventDefault()});
  addEventListener('resize',function(){tr.scrollLeft=cur*tr.clientWidth});
  show();
});`;

export const ECHO = {
  slug: "echo-school",
  name: "Echo School",
  tagline: "Two years of Instagram for a school of technology, digital arts and videogames.",
  desc: "Echo School: two years of Instagram for a School of Technology, Digital Arts & Videogames in Bucharest. Posts, stories, carousels, reels and campaigns by Cromatic Studios.",
  title: "From gamer to creator, two years on the feed.",
  accent: { bg: "#8B3DFF", fg: "#ffffff", ink: "#6b21d6" },
  info: ["Education · Technology, digital arts, videogames", "Bucharest · Instagram", "Social media communication, two years"],
  cover: { img: m("cover") },
  og: m("cover"),
  hero: [
    { img: m("card-solomon"), alt: "Game card: Ionuț Solomon, The Quest Maker, Game Design and Development lecturer" },
    { img: m("golden-1"), alt: "Carousel cover: Care-i faza cu drumul galben?, with a pixel-art scroll", hideSm: true },
    { img: m("comiccon-1"), alt: "Carousel cover: Ne vedem la East European Comic Con, over a fantasy castle", hideSm: true }
  ],
  problem: {
    h: "A school for the people who make games",
    p: [
      "Echo School is a <strong>School of Technology, Digital Arts &amp; Videogames</strong> in Bucharest.",
      "For <strong>two years</strong>, we ran its Instagram account.",
      "Posts, stories, carousels and reels. The campaigns for its <strong>events and workshops</strong>, the <strong>admissions</strong> campaigns, and the visuals that hold them all together."
    ]
  },
  solution: {
    h: "A feed in the language of games",
    p: "Explainers on how games are made, lecturers as game cards, students in their own words, and every event, workshop and admissions campaign in the same world. Scroll it the way you would scroll the feed.",
    stat: "Two years",
    statText: "of Instagram for Echo School: posts, stories, carousels and reels"
  },
  chapters: [
    {
      pillar: "marketing",
      pills: ["Game dev,", "explained"],
      text: "Carousels and reels that explain how games are made, one idea at a time: the golden path, the economy that keeps a game in balance, the teams behind a single shot. The workshops come in between.",
      deliverables: ["Carousels", "Reels", "Workshop campaigns", "Social media design"],
      media: [feed(
        GOLDEN,
        reel("reel-not-gaming", "A speaker in a white T-shirt talks to camera, with animated icons of code, a laptop and art around him", "A reel: game development is not gaming.", "Nov 2025"),
        ECONOMY,
        post("workshop-gameloft", "Workshop poster: George Munteanu, Cum să îți construiești eroul într-un joc video, at Gameloft", "A workshop with George Munteanu, Lead Concept Artist at Gameloft Bucharest: how to build your hero for a video game.", "Oct 2025"),
        ONE_TAKE,
        reel("reel-first-projects", "Students gathered around laptops in a full room, working on games", "A reel: simple game dev projects to start with.", "Oct 2025"),
        post("workshop-ai", "Workshop poster: Inamici inteligenți, with Lilian Ursu and a neon dragon", "Inamici inteligenți: a workshop on the basics of artificial intelligence in games, with Lilian Ursu.", "Jan 2026")
      )]
    },
    {
      pillar: "marketing",
      pills: ["Game Dev", "Românesc"],
      text: "A series on Romanian games, made here and played everywhere, each one with the studio behind it.",
      deliverables: ["Carousel series", "Social media design"],
      media: [feed(GDR)]
    },
    {
      pillar: "marketing",
      pills: ["Lecturers as", "game cards"],
      text: "The lecturers, drawn as collectible game cards: a title, an ability, HP 180 and a weakness or two. Then a Q&amp;A to meet them in person.",
      deliverables: ["Carousels", "Event campaigns", "Social media design"],
      media: [feed(
        CARDS,
        post("meet-teachers", "Meet the Teachers poster with George Munteanu, Gabriel Stancu and Vlad Anghelahar", "Meet the Teachers: a Q&amp;A with George Munteanu, Gabriel Stancu and Vlad Anghelahar.", "Feb 2026")
      )]
    },
    {
      pillar: "marketing",
      pills: ["Through", "students' eyes"],
      text: "Students, in their own words: a carousel with Maria, and short reels where students speak for themselves.",
      deliverables: ["Carousels", "Reels", "Social media design"],
      media: [feed(
        STUDENTS,
        reel("reel-crina", "Crina, a student, talks to camera in front of a purple neon wall, with subtitles", "Crina, a student at Echo School.", "2026"),
        reel("reel-george", "George, a student, talks to camera in front of a purple neon wall, with subtitles", "George, a student at Echo School.", "2026"),
        reel("reel-sara", "Sara, a student, talks to camera in front of a purple neon wall, with subtitles", "Sara, a student at Echo School.", "2026"),
        reel("reel-sofia", "Sofia, a student, talks to camera in front of a purple neon wall, with subtitles", "Sofia, a student at Echo School.", "2026"),
        reel("reel-theo", "Theo, a student, talks to camera in front of a purple neon wall, with subtitles", "Theo, a student at Echo School.", "2026")
      )]
    },
    {
      pillar: "marketing",
      pills: ["Campus", "photos"],
      text: "The school as it is on a weekday: classes, workshops, talks and the people in them.",
      deliverables: ["Photo carousels", "Posts", "Stories"],
      media: [feed(CAMPUS)]
    },
    {
      pillar: "marketing",
      pills: ["Admissions &amp;", "scholarships"],
      text: "Campaigns for open admissions, the early bird, scholarships and education fairs, in the feed, in stories and in ads.",
      deliverables: ["Admissions campaigns", "Key visuals", "Ad visuals", "Reels", "Stories"],
      media: [feed(
        ADMISSIONS,
        reel("reel-ad", "Students working at computers, with captions in pink pills", "An admissions reel: concepts, game mechanics and worlds, alongside people from the industry.", "Dec 2025"),
        post("early-bird", "Activate Super Early Bird poster with a pixel joystick and a discount banner", "Activate super early bird, as an arcade screen.", "Nov 2025"),
        post("kv-game-dev", "A student at a computer modelling a 3D creature, under the headline Vrei să urmezi o facultate în game development?", "Key visual for open admissions: Vrei să urmezi o facultate în game development?", "Feb 2026"),
        post("kv-game-art", "Two sketched game characters leaping, under the headline Visezi la o carieră în game art?", "Key visual for open admissions: Visezi la o carieră în game art?", "Feb 2026"),
        post("scholarships", "Scholarship poster: three students on a sofa next to an illustrated game heroine", "Căutăm viitori creatori de jocuri: the scholarship campaign.", "Mar 2026"),
        post("iuf", "Ne vedem la IUF! in big letters on a pink pixel pattern", "Ne vedem la IUF!: the fair's dates, in Bucharest and Timișoara.", "Mar 2026")
      )]
    },
    {
      pillar: "marketing",
      pills: ["Echo Winter", "School"],
      text: "A winter school where you make a game in three days. The posts announced it and introduced the mentors.",
      deliverables: ["Event campaign", "Carousels", "Stories"],
      media: [feed(WINTER)]
    },
    {
      pillar: "marketing",
      pills: ["Comic", "Con"],
      text: "Echo School at East European Comic Con: a carousel of what was waiting at the stand, and wide visuals from the same fantasy world.",
      deliverables: ["Event campaign", "Carousels", "Key visuals"],
      media: [feed(
        COMICCON,
        post("banner-imagination", "Fantasy heroes around a castle, under the line A career that starts from your imagination", "A career that starts from your imagination.", "Mar 2026"),
        post("banner-witch", "A witch, a knight and armoured heroes in colour, stepping out of pencil sketches", "Heroes stepping out of the sketch, from pencil to full colour.", "Mar 2026")
      )]
    },
    {
      pillar: "marketing",
      pills: ["From Gamer", "to Creator"],
      text: "A sticker set around one line, From Gamer to Creator, with the Echo School character and a few in-jokes for people who make games.",
      deliverables: ["Sticker design", "Social media design"],
      media: [feed(sheet("From Gamer to Creator: one line, one character, and stickers for people who make games.", "Mar 2026"))]
    }
  ],
  result: {
    text: "Two years of a feed with its own voice: lecturers with hit points, students in their own words, and every event, workshop and admissions campaign in the same world."
  },
  css: CSS,
  js: JS,
  related: ["printoteca", "sticker-republic", "yoshi-izakaya"]
};
