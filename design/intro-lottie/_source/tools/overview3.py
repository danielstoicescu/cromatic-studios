# Cromatic opening, phase 3 · the overview sheet: for each concept, six moments from its desktop and phone MP4s, labelled
# in Romanian. python3 tools/overview3.py <phase3 dir> <out.jpg> <ffmpeg>
import sys, os, subprocess, tempfile
from PIL import Image, ImageDraw, ImageFont
P3, OUT, FF = sys.argv[1], sys.argv[2], sys.argv[3]
F = "/System/Library/Fonts/Supplemental/Arial.ttf"
FB = "/System/Library/Fonts/Supplemental/Arial Bold.ttf"
def font(sz, bold=False): return ImageFont.truetype(FB if bold else F, sz)
C = [
  ("crema", "Crema", "the crema", "O singură ceașcă, camera în jurul ei: aterizează văzută de sus, se rotește la fiecare cuvânt, crema devine lentila celor nouă lumi; loaderul e ceașca ce se rotește; fereastra e cafeaua.",
   [(0.5, "Aterizarea"), (1.45, "Miniatura se scufundă"), (2.45, "Cuvântul rotește ceașca"), (4.62, "Lentila: nouă lumi"), (8.7, "Banda Multiverse · loader"), (10.05, "Fereastra: harta vie")]),
  ("ninecups", "Nouă cești", "nine cups", "Ceașca e pastila: buza ei se deschide în cuvinte; nouă cești cu aceeași stradă în cafea, grila intră în perspectivă, ele se rotesc în val; una rămâne și devine pastila Multiverse cu logo-ul.",
   [(2.3, "Ceașca devine pastila"), (4.5, "Nouă cești, nouă lumi"), (5.42, "Grila în perspectivă"), (6.25, "Rămâne una"), (8.9, "Pastila cu logo · loader"), (10.05, "Fereastra")]),
  ("cupcity", "Orașul de cești", "cup city", "O stradă de cești, camera alunecă pe ea: la fiecare cuvânt se aprinde o ceașcă, nouă lumi trec peste aceeași stradă, toate devin galbene; strada se repetă cât se încarcă orașul; drumul se deschide spre hartă.",
   [(1.4, "Miniatura în ceață"), (3.0, "O ceașcă se aprinde"), (4.3, "Nouă lumi pe stradă"), (7.7, "Valul galben"), (9.2, "Strada · loader"), (9.95, "Drumul se deschide")]),
]
tmp = tempfile.mkdtemp()
def grab(mp4, t, w):
    f = os.path.join(tmp, f"{abs(hash((mp4, t)))}.png")
    subprocess.run([FF, "-y", "-loglevel", "error", "-ss", str(t), "-i", mp4, "-frames:v", "1", "-vf", f"scale={w}:-2", f], check=True)
    return Image.open(f).convert("RGB")
DW, PW = 300, 112
pad, gap = 36, 14
rowsH = []
panels = []
for key, name, en, line, moments in C:
    d = [grab(os.path.join(P3, key, "desktop.mp4"), t, DW) for t, _ in moments]
    p = [grab(os.path.join(P3, key, "phone.mp4"), t, PW) for t, _ in moments]
    panels.append((key, name, en, line, moments, d, p))
W = pad * 2 + 6 * DW + 5 * gap
ph_h = panels[0][6][0].height
H0 = 130
panelH = 92 + panels[0][5][0].height + 28 + ph_h + 34
H = H0 + len(panels) * (panelH + 24) + 20
S = Image.new("RGB", (W, H), (242, 242, 242))
dr = ImageDraw.Draw(S)
dr.text((pad, 34), "Cromatic Studios · deschiderea ca Lottie, faza 3: ceașca 3D", font=font(34, True), fill=(0, 0, 0))
dr.text((pad, 82), "Trei concepte cu ceașca veche a loaderului, refăcută 3D în vectori (modelul three.js din site, proiectat și luminat). Sus laptop (1280×900), jos telefon (390×844).", font=font(17), fill=(60, 60, 60))
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
