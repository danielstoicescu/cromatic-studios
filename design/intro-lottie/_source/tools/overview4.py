# Cromatic opening, phase 3 · Nine cups v2: the overview sheet. The original intro's wall of cups (rendered from its own
# code, reference/), then eight moments of v2 from its desktop and phone MP4s, labelled in Romanian.
# python3 tools/overview4.py <phase3 dir> <out.jpg> <ffmpeg>
import sys, os, subprocess, tempfile
from PIL import Image, ImageDraw, ImageFont
P3, OUT, FF = sys.argv[1], sys.argv[2], sys.argv[3]
F = "/System/Library/Fonts/Supplemental/Arial.ttf"
FB = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
def font(sz, bold=False): return ImageFont.truetype(FB if bold else F, sz)
C = [
  ("ninecups-v2", "Nouă cești v2", "nine cups v2", "Ceștile aplicației originale (același model three.js, porțelanul, lumina, unghiul), nouă în romb, cu toartele întregi; rotire cu inerție, fiecare în ritmul ei; tranziții legate una de alta.",
   [(1.95, "Ceașca aterizează în rând"), (2.3, "Buza devine pastila"), (3.64, "Brand se închide pe ceașcă"), (4.75, "Nouă cești, nouă lumi"), (5.38, "Se ridică la unghiul vechi"), (5.95, "Se rotesc în val"), (6.45, "Rămâne una"), (6.88, "Buza devine pastila Multiverse"), (8.9, "Logo-ul · loader")]),
]
tmp = tempfile.mkdtemp()
def grab(mp4, t, w):
    f = os.path.join(tmp, f"{abs(hash((mp4, t)))}.png")
    subprocess.run([FF, "-y", "-loglevel", "error", "-ss", str(t), "-i", mp4, "-frames:v", "1", "-vf", f"scale={w}:-2", f], check=True)
    return Image.open(f).convert("RGB")
DW, PW = 240, 92
pad, gap = 36, 14
rowsH = []
panels = []
for key, name, en, line, moments in C:
    d = [grab(os.path.join(P3, key, "desktop.mp4"), t, DW) for t, _ in moments]
    p = [grab(os.path.join(P3, key, "phone.mp4"), t, PW) for t, _ in moments]
    panels.append((key, name, en, line, moments, d, p))
N = len(C[0][4])
W = pad * 2 + N * DW + (N - 1) * gap
ph_h = panels[0][6][0].height
REF = os.path.join(P3, "ninecups-v2", "reference")
refs = [("original-wall-4.1s.png", "Originalul (13e8689): peretele de cești"), ("original-wall-5.9s.png", "Originalul: camera se retrage"), ("compare-diamond.png", "Romb: v2 (Lottie, stânga) lângă three.js (dreapta)")]
rw = (W - 2 * pad - 2 * gap) // 3
ref_ims = []
for f, lab in refs:
    im = Image.open(os.path.join(REF, f)).convert("RGB")
    im = im.resize((rw, round(im.height * rw / im.width)))
    ref_ims.append((im, lab))
refH = max(im.height for im, _ in ref_ims)
H0 = 130 + 60 + refH + 40
panelH = 92 + panels[0][5][0].height + 28 + ph_h + 34
H = H0 + len(panels) * (panelH + 24) + 20
S = Image.new("RGB", (W, H), (242, 242, 242))
dr = ImageDraw.Draw(S)
dr.text((pad, 34), "Cromatic Studios · deschiderea ca Lottie: Nouă cești v2", font=font(34, True), fill=(0, 0, 0))
dr.text((pad, 82), "Ceștile din aplicația originală (src/app.js, 30 sept., commit 13e8689), randate din codul lor, apoi refăcute în Lottie. Sus laptop (1280×900), jos telefon (390×844).", font=font(17), fill=(60, 60, 60))
dr.text((pad, 136), "Referința: intro-ul original, randat din codul lui (three.js r169, aceleași materiale, lumini și cameră)", font=font(18, True), fill=(0, 0, 0))
for k, (im, lab) in enumerate(ref_ims):
    x = pad + k * (rw + gap)
    S.paste(im, (x, 170)); dr.rectangle([x, 170, x + rw - 1, 170 + im.height - 1], outline=(0, 0, 0), width=1)
    dr.text((x, 170 + im.height + 6), lab, font=font(14), fill=(70, 70, 70))
y = H0
for i, (key, name, en, line, moments, d, p) in enumerate(panels):
    dr.rounded_rectangle([pad - 12, y, W - pad + 12, y + panelH], radius=26, outline=(0, 0, 0), width=2, fill=(255, 255, 255))
    cx, cy = pad + 22, y + 34
    dr.ellipse([cx - 18, cy - 18, cx + 18, cy + 18], fill=(254, 208, 18), outline=(0, 0, 0), width=2)
    dr.text((cx - 7, cy - 12), str(i + 1), font=font(20, True), fill=(0, 0, 0))
    dr.text((cx + 32, y + 18), name, font=font(24, True), fill=(0, 0, 0))
    nw = dr.textlength(name, font=font(24, True))
    dr.text((cx + 32 + nw + 10, y + 22), en, font=font(18), fill=(120, 120, 120))
    dr.text((cx + 32, y + 52), line, font=font(15), fill=(40, 40, 40))
    ty = y + 92
    for k, (im, (t, lab)) in enumerate(zip(d, moments)):
        x = pad + k * (DW + gap)
        S.paste(im, (x, ty)); dr.rectangle([x, ty, x + DW - 1, ty + im.height - 1], outline=(0, 0, 0), width=1)
        dr.text((x, ty + im.height + 4), f"{lab} · {t:.1f} s", font=font(13), fill=(70, 70, 70))
    py = ty + d[0].height + 28
    for k, im in enumerate(p):
        x = pad + k * (DW + gap) + (DW - PW) // 2
        S.paste(im, (x, py)); dr.rounded_rectangle([x - 1, py - 1, x + PW, py + im.height], radius=8, outline=(0, 0, 0), width=2)
    y += panelH + 24
S.save(OUT, quality=88)
print("overview", OUT, S.size)
