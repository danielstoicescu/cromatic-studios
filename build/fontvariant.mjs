// r481 (Daniel, 16 Nov: "Descarcă-l. Mergem pe flex, peste tot."): the one switch for the Google Sans Flex type.
// FONT_VARIANT picks one of the three variants Daniel compared (refs/audit-2026-11/font-test/):
//   v1: the text weights x-height matched to the old Darker Grotesque (Flex at 80 percent), read at weight 430
//   v2: one notch larger (88 percent), read at 430
//   v3: "ca la Google": the text at its own size (100 percent), read at 400, the reading sections set the Google way
//       (17 to 18 px, line-height 1.45, a 70-character column, regular-weight subheads)
// Everything that depends on the choice is here: the text face's size-adjust (site.css, src/styles.css, /fonts.css),
// its fallback's metrics, and the reading CSS for the website and the cases. The display weights do not change.
// r481-2 (Daniel, 17 Nov): v3, "ca la Google".
export const FONT_VARIANT = process.env.FONT_VARIANT || "v3";

const V = {
  v1: { sa: 80, w: 430, google: false },
  v2: { sa: 88, w: 430, google: false },
  v3: { sa: 100, w: 400, google: true }
};
export const VAR = V[FONT_VARIANT] || V.v2;

// Flex's own metrics (site/fonts/google-sans-flex-latin.woff2, 2000 upm): ascent 1932, descent 572, no line gap; at
// 400 it is as wide as Arial, at 650 as wide as Arial Bold. The text face and its fallback take the same size-adjust,
// which scales both their metrics alike, so the fallback's overrides are Flex's own numbers whatever the variant
const ASC = 96.6, DSC = 28.6;
const pc = (n) => `${Math.round(n * 10) / 10}%`;

// the stylesheet with the variant's numbers, found by the faces themselves (so it works on the source and on the
// minified CSS alike): the Flex text face (weights 100 to 649) and the fallback's two text faces
export function applyVariant(css) {
  return css.replace(/@font-face\s*\{[^}]*\}/g, (f) => {
    const fb = /CromaticSans Fallback/.test(f);
    if (!/CromaticSans/.test(f)) return f;
    const w = /font-weight:\s*(\d+)\s+(\d+)/.exec(f);
    if (!w) return f;
    const lo = +w[1], hi = +w[2];
    if (hi > 649) return f; // the display faces never change
    const sa = fb && lo >= 450 ? VAR.sa * 1.055 : VAR.sa; // Flex at 450 to 649 runs 5.5 percent wider than Arial
    let g = f.replace(/size-adjust:\s*(?:\/\*\w+\*\/)?[\d.]+%/, `size-adjust:${pc(sa)}`);
    if (fb) g = g.replace(/ascent-override:\s*(?:\/\*\w+\*\/)?[\d.]+%/, `ascent-override:${pc(ASC)}`).replace(/descent-override:\s*(?:\/\*\w+\*\/)?[\d.]+%/, `descent-override:${pc(DSC)}`);
    return g;
  });
}

// the reading CSS, appended to the website's stylesheet: the reading weight, and for v3 the Google proportions
export function variantSiteCss() {
  let c = `\n/* r481: the reading weight (${FONT_VARIANT}) */ body, .sv5-card p, .c-txt p, .studio p, .hub-intro p, .c2-lead p, .lead, .sh-lead, .pw-offer, .ftr p, .faq p, .qa p, .sv5-card li { font-weight: ${VAR.w}; }`;
  c += `\n/* r481: Flex at 650 runs about 1 percent wider than the old bold: the hero title 0.01 em tighter keeps its three lines */ html body .pw-h { letter-spacing: -.055em !important; }`;
  // r481-4 (Tudor round 5, B1): the same for the hub, industry, service and case titles (.c2-title), 0.015 em tighter,
  // no lone word on the last line; the hub title's measure in em, not ch, so it does not change with the face
  c += `\n/* r481-4: Flex titles keep 4.54's line count */ .c2-title { letter-spacing: -.05em; text-wrap: pretty; } .hub .c2-hero .c2-title { max-width: 12em; }`;
  if (VAR.google) c += `\n/* r481 v3 ("ca la Google"): reading text in one calm weight, generous lines, a 70-character column */
.sv5-card p, .c-txt p, .studio p, .hub-intro p, .c2-lead p, .lead, .sh-lead, .pw-offer, .ftr p, .faq p, .qa p { font-size: clamp(17px, 1.25vw, 18px) !important; line-height: 1.45 !important; font-weight: 400 !important; letter-spacing: 0 !important; max-width: 70ch; }
.sv5-card h3, .c2-ch h2, .hub-card h3, .faq summary, .sh-sub { font-weight: 400 !important; font-size: clamp(24px, 1.8vw, 26px) !important; line-height: 1.3 !important; letter-spacing: -.005em !important; }`;
  return c;
}

// the same for the case pages (their own stylesheets), injected before </head>
export function variantCaseCss(raw = "") {
  let c = `body,.prose p,.chapter-text,.info li,.solution-intro p,.czs-cat,figcaption{font-weight:${VAR.w}}`;
  if (VAR.google) c += `.prose p,.chapter-text,.info li,.solution-intro p,.quote blockquote .q-en,.related p,.czs-cat{font-size:clamp(17px,1.25vw,18px)!important;line-height:1.45!important;font-weight:400!important;letter-spacing:0!important}.prose,.chapter-text{max-width:70ch}.sec-head h2,.solution-intro h2,.result-text{font-weight:400!important;font-size:clamp(28px,2.4vw,36px)!important;line-height:1.25!important;letter-spacing:-.005em!important}.client-name{font-weight:400!important}`;
  // r481-4 (Tudor round 5, B1): Flex at 650 sets wider than the old Google Sans bold, so 21 case titles took one more
  // line than on 4.54. The title 0.02 em tighter brings all of them back to 4.54's line count; text-wrap: pretty keeps a
  // lone word off the last line. Steam's own N27 title is left as it is. The Slow Coffee Festival statements (.hp) were
  // set in Darker Grotesque, a narrow face: Flex at 80 percent of the size has about the same x-height and wraps to the
  // same lines
  if (VAR.google && !/N27/.test(raw)) c += `.hero h1{letter-spacing:-.03em;text-wrap:pretty}`;
  if (VAR.google) c += `.hp{font-size:calc(var(--h1) * .8);letter-spacing:-.01em}`;
  return `<style id="r481-type">${c}</style>`;
}
