# Split Witanalytica's brand canvas (one PDF page, 30x130 cm) into isolated elements, keeping the drawing order.
# Adapted from split-canvas.py (OMA). This canvas is built from nested forms (mockups, photo grids, gradient
# rings), so it works on the top-level objects only:
#   - the full-page white rectangle is the background;
#   - images and large forms are elements of their own ("img"); the small paths and forms drawn right after
#     them and lying inside them (a slide's text, a screen's button) are folded into them;
#   - consecutive small objects that sit together are merged into one "vec" element (a logo, a paragraph).
# Every element is trimmed to its visible pixels, so oversized image boxes (a tablet on a huge transparent
# canvas, photos running off the page) do not inflate the files.
#   python split-witanalitica.py <out_dir> [scale]
import json, os, sys
import pypdfium2 as pdfium, pypdfium2.raw as raw

SRC = os.environ.get("WIT_SRC", "/private/tmp/claude-501/-Users-daniel-stoic/307623b0-7c3c-4b30-b2d7-c12e0dda2036/scratchpad/drive-in/witanalytica/canvas.pdf")  # "brand canvas WITANALYTICA 30x130cm" from Daniel's Drive
OUT = sys.argv[1] if len(sys.argv) > 1 else "out"
SCALE = float(sys.argv[2]) if len(sys.argv) > 2 else 1.9
QUALITY = 82
os.makedirs(OUT, exist_ok=True)

doc = pdfium.PdfDocument(SRC)
page = doc[0]
PW, PH = page.get_size()
objs = []
for i, o in enumerate(page.get_objects(max_depth=0)):
    l, b, r, t = o.get_bounds()
    objs.append({"i": i, "type": o.type, "box": [max(0, l), max(0, b), min(PW, r), min(PH, t)]})

def area(b):
    return max(0, b[2] - b[0]) * max(0, b[3] - b[1])

def is_bg(o):
    return o["type"] == raw.FPDF_PAGEOBJ_PATH and area(o["box"]) > 0.9 * PW * PH

def is_img(o):
    return o["type"] == raw.FPDF_PAGEOBJ_IMAGE or (o["type"] == raw.FPDF_PAGEOBJ_FORM and area(o["box"]) > 120 * 120)

def near(a, b, gap):
    return not (a[2] + gap < b[0] or b[2] + gap < a[0] or a[3] + gap < b[1] or b[3] + gap < a[1])

def inside(a, b, tol=2):
    return a[0] >= b[0] - tol and a[1] >= b[1] - tol and a[2] <= b[2] + tol and a[3] <= b[3] + tol

def union(a, b):
    return [min(a[0], b[0]), min(a[1], b[1]), max(a[2], b[2]), max(a[3], b[3])]

GAP = 7.0
els = []
bg = {"kind": "bg", "idx": [], "box": None}
for o in objs:
    if area(o["box"]) <= 0:
        continue
    if is_bg(o):
        bg["idx"].append(o["i"]); bg["box"] = [0, 0, PW, PH]
        continue
    last = els[-1] if els else None
    if is_img(o):
        # a form that only repeats the image right before it (wrapper + image) stays with it
        if last and last["kind"] == "img" and inside(o["box"], last["box"]):
            last["idx"].append(o["i"]); continue
        els.append({"kind": "img", "idx": [o["i"]], "box": list(o["box"])})
        continue
    if last and last["kind"] == "img" and inside(o["box"], last["box"]):
        last["idx"].append(o["i"]); continue
    if last and last["kind"] == "vec" and near(last["box"], o["box"], GAP):
        last["idx"].append(o["i"]); last["box"] = union(last["box"], o["box"])
    else:
        els.append({"kind": "vec", "idx": [o["i"]], "box": list(o["box"])})

# second pass: neighbouring vector clusters become one (a ring grid, a bar chart, a type specimen),
# so small pieces of one figure appear (and float) together
GAP2 = 16.0
merged = []
for e in els:
    if merged and e["kind"] == "vec" and merged[-1]["kind"] == "vec" and near(merged[-1]["box"], e["box"], GAP2):
        merged[-1]["idx"] += e["idx"]; merged[-1]["box"] = union(merged[-1]["box"], e["box"])
    else:
        merged.append(e)
# third pass: pieces of one figure drawn out of order (a type specimen's labels) join it, as long as
# nothing drawn between them overlaps, so the stacking order stays the same
GAP3 = 20.0
def overlaps(a, b):
    return near(a, b, 0)
changed = True
while changed:
    changed = False
    for i in range(len(merged)):
        if merged[i]["kind"] != "vec":
            continue
        for j in range(i + 1, len(merged)):
            if merged[j]["kind"] != "vec" or not near(merged[i]["box"], merged[j]["box"], GAP3):
                continue
            u = union(merged[i]["box"], merged[j]["box"])
            if any(overlaps(merged[k]["box"], u) for k in range(i + 1, j)):
                continue
            merged[i]["idx"] += merged[j]["idx"]; merged[i]["box"] = u
            del merged[j]; changed = True
            break
        if changed:
            break
merged = [e for e in merged if area(e["box"]) > 30 or e["kind"] == "img"]
print("objects", len(objs), "background", len(bg["idx"]), "elements", len(merged), file=sys.stderr)

def render(idx_keep, box, name, trim=True):
    d = pdfium.PdfDocument(SRC)
    pg = d[0]
    keep = set(idx_keep)
    for i, o in enumerate(list(pg.get_objects(max_depth=0))):
        if i not in keep:
            pg.remove_obj(o)
    pg.gen_content()
    l, b, r, t = box
    pad = 2
    l, b, r, t = max(0, l - pad), max(0, b - pad), min(PW, r + pad), min(PH, t + pad)
    bm = pg.render(scale=SCALE, crop=(l, b, PW - r, PH - t), fill_color=(0, 0, 0, 0), may_draw_forms=True)
    im = bm.to_pil().convert("RGBA")
    bm.close(); pg.close(); d.close()
    if trim:
        bb = im.getchannel("A").point(lambda v: 255 if v > 3 else 0).getbbox()
        if not bb:
            return None, None
        x0, y0, x1, y1 = bb
        x0, y0, x1, y1 = max(0, x0 - 1), max(0, y0 - 1), min(im.width, x1 + 1), min(im.height, y1 + 1)
        im = im.crop((x0, y0, x1, y1))
        sx = (r - l) / bm.width if bm.width else 1 / SCALE
        sy = (t - b) / bm.height if bm.height else 1 / SCALE
        l, r, t, b = l + x0 * sx, l + x1 * sx, t - y0 * sy, t - y1 * sy
    else:
        im = im.convert("RGB")
    im.save(os.path.join(OUT, name + ".webp"), "WEBP", quality=QUALITY, method=6)
    return [l, b, r, t], im.size

manifest = {"w": PW, "h": PH, "scale": SCALE, "items": []}
if bg["idx"]:
    box, size = render(bg["idx"], [0, 0, PW, PH], "bg", trim=False)
    manifest["bg"] = {"file": "bg.webp", "box": box}
k = 0
for e in merged:
    name = f"e{k:03d}"
    box, size = render(e["idx"], e["box"], name)
    if not box:
        continue
    manifest["items"].append({"file": name + ".webp", "kind": e["kind"], "box": box, "n": len(e["idx"])})
    print(k, e["kind"], [round(v) for v in box], len(e["idx"]), size, file=sys.stderr)
    k += 1
json.dump(manifest, open(os.path.join(OUT, "manifest.json"), "w"), indent=1)
print("done", file=sys.stderr)
