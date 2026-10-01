# Split OMA's brand canvas (one PDF page) into isolated elements, keeping the drawing order.
# Images and forms are elements of their own; consecutive vector paths that sit together are
# merged into one element (a mascot, a sticker, a paragraph); very large paths are background.
import json, os, sys
import pypdfium2 as pdfium, pypdfium2.raw as raw

SRC = "/Users/daniel.stoic/Clienti/OMA/04_Livrabile-finale/Oma's brand canvas.pdf"
OUT = sys.argv[1] if len(sys.argv) > 1 else "out"
SCALE = float(sys.argv[2]) if len(sys.argv) > 2 else 2.0
os.makedirs(OUT, exist_ok=True)

doc = pdfium.PdfDocument(SRC)
page = doc[0]
PW, PH = page.get_size()
objs = []
for i, o in enumerate(page.get_objects()):
    l, b, r, t = o.get_bounds()
    objs.append({"i": i, "type": o.type, "box": [l, b, r, t]})

def big(o):
    l, b, r, t = o["box"]
    return o["type"] == raw.FPDF_PAGEOBJ_PATH and (r - l) > 260 and (t - b) > 260

def near(a, b, gap):
    return not (a[2] + gap < b[0] or b[2] + gap < a[0] or a[3] + gap < b[1] or b[3] + gap < a[1])

def union(a, b):
    return [min(a[0], b[0]), min(a[1], b[1]), max(a[2], b[2]), max(a[3], b[3])]

GAP = 7.0
els = []  # each: {"kind", "idx": [object indices], "box"}
bg = {"kind": "bg", "idx": [], "box": None}
for o in objs:
    if big(o):
        bg["idx"].append(o["i"]); bg["box"] = o["box"] if bg["box"] is None else union(bg["box"], o["box"])
        continue
    if o["type"] in (raw.FPDF_PAGEOBJ_IMAGE, raw.FPDF_PAGEOBJ_FORM):
        els.append({"kind": "img", "idx": [o["i"]], "box": list(o["box"])})
        continue
    last = els[-1] if els else None
    if last and last["kind"] == "vec" and near(last["box"], o["box"], GAP):
        last["idx"].append(o["i"]); last["box"] = union(last["box"], o["box"])
    else:
        els.append({"kind": "vec", "idx": [o["i"]], "box": list(o["box"])})

# second pass: neighbouring vector clusters that overlap become one (fewer, whole elements)
merged = []
for e in els:
    if merged and e["kind"] == "vec" and merged[-1]["kind"] == "vec" and near(merged[-1]["box"], e["box"], GAP):
        merged[-1]["idx"] += e["idx"]; merged[-1]["box"] = union(merged[-1]["box"], e["box"])
    else:
        merged.append(e)
# drop specks
merged = [e for e in merged if (e["box"][2] - e["box"][0]) * (e["box"][3] - e["box"][1]) > 30 or e["kind"] == "img"]
print("objects", len(objs), "background paths", len(bg["idx"]), "elements", len(merged), file=sys.stderr)

def render(idx_keep, box, name):
    d = pdfium.PdfDocument(SRC)
    pg = d[0]
    keep = set(idx_keep)
    all_objs = list(pg.get_objects())
    for i, o in enumerate(all_objs):
        if i not in keep:
            pg.remove_obj(o)
    pg.gen_content()
    l, b, r, t = box
    pad = 2
    l, b, r, t = max(0, l - pad), max(0, b - pad), min(PW, r + pad), min(PH, t + pad)
    bm = pg.render(scale=SCALE, crop=(l, b, PW - r, PH - t), fill_color=(0, 0, 0, 0), may_draw_forms=True)
    im = bm.to_pil()
    im.save(os.path.join(OUT, name + ".webp"), "WEBP", quality=84, method=5)
    d.close()
    return [l, b, r, t], im.size

manifest = {"w": PW, "h": PH, "scale": SCALE, "items": []}
if bg["idx"]:
    box, size = render(bg["idx"], [0, 0, PW, PH], "bg")
    manifest["bg"] = {"file": "bg.webp", "box": box}
for k, e in enumerate(merged):
    name = f"e{k:03d}"
    box, size = render(e["idx"], e["box"], name)
    manifest["items"].append({"file": name + ".webp", "kind": e["kind"], "box": box, "n": len(e["idx"])})
    print(k, e["kind"], [round(v) for v in box], len(e["idx"]), file=sys.stderr)
json.dump(manifest, open(os.path.join(OUT, "manifest.json"), "w"), indent=1)
print("done", file=sys.stderr)
