# r481-9 (Tudor round 5, S5): Google Sans Flex has no arrows, so "→ ← ↓ ↗" fell back to Arial or the system's symbol
# face, a different drawing on every device. This draws the eight arrows on Flex's own grid (2000 units, ascent and
# descent, centred a touch above the plus sign's math axis). They join the CromaticSans family by unicode-range.
# r483-4 (Tudor round 7, R4): one stroke per weight band, matched to Flex's own stem (its "+" measured at 1000 px:
# 78 at 400, 95 at 500, 113 at 600, 122 at 650 and up), and the diagonals drawn longer so "↗" looks as big as "→"
# (same length, its box was 72 percent as wide). Plus a mono drawing at JetBrains Mono's advance (600 of 1000), for
# the arrows inside mono labels, which came from Courier or Menlo.
#   light   CromaticSans 100-449   stroke 156
#   medium  CromaticSans 450-549   stroke 190
#   semi    CromaticSans 550-649   stroke 226
#   display CromaticSans 650       stroke 244
#   mono    JetBrains Mono 400-700 stroke 180, advance 1200
# Run: python3 build/arrows-font.py  ->  site/fonts/cromatic-arrows-<name>.woff2 (under 1 KB each)
import math, os
from fontTools.fontBuilder import FontBuilder
from fontTools.pens.ttGlyphPen import TTGlyphPen

UPM, ASC, DSC = 2000, 1932, 572
CY = 640
OUT = os.path.join(os.path.dirname(__file__), "..", "site", "fonts")
ARROWS = {0x2190: 180, 0x2191: 90, 0x2192: 0, 0x2193: 270, 0x2196: 135, 0x2197: 45, 0x2198: 315, 0x2199: 225}

def arrow(stroke, angle, adv, half0):
    r2 = math.sqrt(2); h = stroke / 2
    diag = angle % 90 != 0
    half = half0 * (1.18 if diag else 1.0)   # optical: a diagonal of the same length reads smaller
    L = (380 + stroke * 0.4) * (half0 / 540)  # head arm length
    tx = half
    eu = (tx - L, L); nu = (h / r2, h / r2)
    el = (tx - L, -L); nl = (h / r2, -h / r2)
    head = [(tx + h * r2, 0), (eu[0] + nu[0], eu[1] + nu[1]), (eu[0] - nu[0], eu[1] - nu[1]), (tx - h * r2, 0), (el[0] - nl[0], el[1] - nl[1]), (el[0] + nl[0], el[1] + nl[1])]
    shaft = [(-half, -h), (-half, h), (tx - h * r2 + 4, h), (tx - h * r2 + 4, -h)]
    c, sn = math.cos(math.radians(angle)), math.sin(math.radians(angle))
    off = h * r2 / 2                          # the tip's miter, so the arrow is centred on its ink
    rot = lambda p: (round(adv / 2 + (p[0] - off) * c - p[1] * sn), round(CY + (p[0] - off) * sn + p[1] * c))
    # clockwise contours for TrueType: the head is listed counter-clockwise (reversed here), the shaft clockwise
    return [list(reversed([rot(p) for p in head])), [rot(p) for p in shaft]]

def build(name, stroke, adv=1400, half=540, weight=400):
    order = [".notdef", "space"] + [f"uni{cp:04X}" for cp in ARROWS]
    fb = FontBuilder(UPM, isTTF=True)
    fb.setupGlyphOrder(order)
    fb.setupCharacterMap({0x20: "space", **{cp: f"uni{cp:04X}" for cp in ARROWS}})
    glyphs, metrics = {}, {}
    for g in (".notdef", "space"):
        glyphs[g] = TTGlyphPen(None).glyph(); metrics[g] = (adv if name == "mono" else 500, 0)
    for cp, ang in ARROWS.items():
        pen = TTGlyphPen(None)
        for contour in arrow(stroke, ang, adv, half):
            pen.moveTo(contour[0])
            for p in contour[1:]: pen.lineTo(p)
            pen.closePath()
        g = pen.glyph(); g.recalcBounds(None)
        glyphs[f"uni{cp:04X}"] = g; metrics[f"uni{cp:04X}"] = (adv, g.xMin)
    fb.setupGlyf(glyphs)
    fb.setupHorizontalMetrics(metrics)
    fb.setupHorizontalHeader(ascent=ASC, descent=-DSC, lineGap=0)
    fb.setupNameTable({"familyName": "Cromatic Arrows", "styleName": name.capitalize(), "copyright": "Cromatic Studios"})
    fb.setupOS2(sTypoAscender=ASC, sTypoDescender=-DSC, sTypoLineGap=0, usWinAscent=ASC, usWinDescent=DSC, usWeightClass=weight, fsType=0)
    fb.setupPost()
    fb.font.flavor = "woff2"
    p = os.path.join(OUT, f"cromatic-arrows-{name}.woff2"); fb.save(p); print(p, os.path.getsize(p), "bytes")

build("light", 156, weight=400)
build("medium", 190, weight=500)
build("semi", 226, weight=600)
build("display", 244, weight=650)
build("mono", 180, adv=1200, half=500, weight=500)
