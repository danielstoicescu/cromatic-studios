# r481-9 (Tudor round 5, S5): Google Sans Flex has no arrows, so "→ ← ↓ ↗" fell back to Arial or the system's symbol
# face, a different drawing on every device. This draws the eight arrows once, on Flex's own grid (2000 units, the
# plus sign's advance and math axis, ascent and descent), in two weights: "text" (stroke 140, for CromaticSans 100-649)
# and "display" (stroke 230, for the 650 face). They join the CromaticSans family by unicode-range (U+2190-2199).
# Run: python3 build/arrows-font.py  ->  site/fonts/cromatic-arrows-text.woff2, -display.woff2 (about 1 KB each)
import math, os
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen

UPM, ASC, DSC = 2000, 1932, 572
ADV, CY = 1400, 640           # wider than Flex's "+" (1116), centred a touch above its math axis (620)
OUT = os.path.join(os.path.dirname(__file__), "..", "site", "fonts")

def arrow(stroke, angle):
    s, r2 = stroke, math.sqrt(2)
    L = 380 + stroke * 0.4           # head arm length
    half = 540                        # half the arrow's length along its axis
    tx = half                         # tip, before rotation (arrow centred on the origin, pointing right)
    h = s / 2
    head = [(tx + h * r2, 0)]
    eu = (tx - L, L); nu = (h / r2, h / r2)
    el = (tx - L, -L); nl = (h / r2, -h / r2)
    head += [(eu[0] + nu[0], eu[1] + nu[1]), (eu[0] - nu[0], eu[1] - nu[1]), (tx - h * r2, 0), (el[0] - nl[0], el[1] - nl[1]), (el[0] + nl[0], el[1] + nl[1])]
    shaft = [(-half, -h), (-half, h), (tx - h * r2 + 4, h), (tx - h * r2 + 4, -h)]
    k = 0.96 if angle % 90 else 1.0   # the diagonals a little shorter, so they sit in the same square
    c, sn = math.cos(math.radians(angle)), math.sin(math.radians(angle))
    off = h * r2 / 2                  # the tip's miter, so the arrow is centred on its ink
    rot = lambda p: (round(ADV / 2 + k * ((p[0] - off) * c - p[1] * sn)), round(CY + k * ((p[0] - off) * sn + p[1] * c)))
    # clockwise contours for TrueType: the head is listed counter-clockwise above (reversed), the shaft clockwise
    return [list(reversed([rot(p) for p in head])), [rot(p) for p in shaft]]

ARROWS = {0x2190: 180, 0x2191: 90, 0x2192: 0, 0x2193: 270, 0x2196: 135, 0x2197: 45, 0x2198: 315, 0x2199: 225}

def build(name, stroke):
    order = [".notdef", "space"] + [f"uni{cp:04X}" for cp in ARROWS]
    fb = FontBuilder(UPM, isTTF=True)
    fb.setupGlyphOrder(order)
    fb.setupCharacterMap({0x20: "space", **{cp: f"uni{cp:04X}" for cp in ARROWS}})
    glyphs, metrics = {}, {}
    for g in (".notdef", "space"):
        glyphs[g] = TTGlyphPen(None).glyph(); metrics[g] = (500, 0)
    for cp, ang in ARROWS.items():
        pen = TTGlyphPen(None)
        for contour in arrow(stroke, ang):
            pen.moveTo(contour[0])
            for p in contour[1:]: pen.lineTo(p)
            pen.closePath()
        g = pen.glyph(); g.recalcBounds(None)
        glyphs[f"uni{cp:04X}"] = g; metrics[f"uni{cp:04X}"] = (ADV, g.xMin)
    fb.setupGlyf(glyphs)
    fb.setupHorizontalMetrics(metrics)
    fb.setupHorizontalHeader(ascent=ASC, descent=-DSC, lineGap=0)
    fb.setupNameTable({"familyName": "Cromatic Arrows", "styleName": name.capitalize(), "copyright": "Cromatic Studios"})
    fb.setupOS2(sTypoAscender=ASC, sTypoDescender=-DSC, sTypoLineGap=0, usWinAscent=ASC, usWinDescent=DSC, usWeightClass=400 if name == "text" else 650, fsType=0)
    fb.setupPost()
    fb.font.flavor = "woff2"
    p = os.path.join(OUT, f"cromatic-arrows-{name}.woff2"); fb.save(p); print(p, os.path.getsize(p), "bytes")

build("text", 140)
build("display", 230)
