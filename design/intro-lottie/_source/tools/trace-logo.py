# Cromatic opening (r226): the Cromatic Studios logo as vector shapes, traced from the site's own artwork (the portrait
# logo in src/app.js, logoPortrait, 520x211): no font stands in for it. Sub-pixel contours of the 4x up-sampled alpha,
# split at corners, each run fitted with cubic beziers (Schneider). Writes assets/logo.json: { w, h, paths: [{v,i,o}] }
# in the artwork's pixels, and a check image (the original, the trace, their difference).
# python3 tools/trace-logo.py <logoPortrait.png> <out.json> <check.png>
import sys, json, math
import numpy as np
from PIL import Image, ImageDraw, ImageFilter
from skimage import measure

src, out, check = sys.argv[1], sys.argv[2], sys.argv[3]
im = Image.open(src).convert("RGBA")
W, H = im.size
UP = 4
a = im.split()[3].resize((W * UP, H * UP), Image.LANCZOS).filter(ImageFilter.GaussianBlur(1.1))
A = np.asarray(a, dtype=np.float64) / 255.0
A = np.pad(A, 2)
contours = measure.find_contours(A, 0.5)

def bez(p0, p1, p2, p3, t):
    t = np.asarray(t)[:, None]; u = 1 - t
    return u**3 * p0 + 3 * u**2 * t * p1 + 3 * u * t**2 * p2 + t**3 * p3
def bez1(c, t):
    t = np.asarray(t)[:, None]; u = 1 - t
    return 3 * u**2 * (c[1] - c[0]) + 6 * u * t * (c[2] - c[1]) + 3 * t**2 * (c[3] - c[2])
def bez2(c, t):
    t = np.asarray(t)[:, None]
    return 6 * (1 - t) * (c[2] - 2 * c[1] + c[0]) + 6 * t * (c[3] - 2 * c[2] + c[1])
def chord(P):
    d = np.r_[0, np.cumsum(np.linalg.norm(np.diff(P, axis=0), axis=1))]
    return d / d[-1] if d[-1] > 0 else d
def gen(P, u, t1, t2):
    A1 = np.array([t1 * (3 * (1 - x) ** 2 * x) for x in u]); A2 = np.array([t2 * (3 * (1 - x) * x ** 2) for x in u])
    C = np.zeros((2, 2)); X = np.zeros(2)
    for k in range(len(u)):
        C[0, 0] += A1[k] @ A1[k]; C[0, 1] += A1[k] @ A2[k]; C[1, 0] = C[0, 1]; C[1, 1] += A2[k] @ A2[k]
        tmp = P[k] - bez(P[0], P[0], P[-1], P[-1], [u[k]])[0]
        X[0] += A1[k] @ tmp; X[1] += A2[k] @ tmp
    det = C[0, 0] * C[1, 1] - C[0, 1] * C[1, 0]
    seg = np.linalg.norm(P[-1] - P[0])
    if abs(det) > 1e-12:
        al = (X[0] * C[1, 1] - X[1] * C[0, 1]) / det; ar = (C[0, 0] * X[1] - C[1, 0] * X[0]) / det
    else: al = ar = seg / 3
    if al < 1e-6 * seg or ar < 1e-6 * seg: al = ar = seg / 3
    return [P[0], P[0] + t1 * al, P[-1] + t2 * ar, P[-1]]
def maxerr(P, c, u):
    d = np.linalg.norm(bez(*c, u) - P, axis=1); i = int(np.argmax(d)); return d[i], i
def repar(P, c, u):
    q = bez(*c, u) - P; d1 = bez1(c, u); d2 = bez2(c, u)
    num = np.sum(q * d1, axis=1); den = np.sum(d1 * d1, axis=1) + np.sum(q * d2, axis=1)
    with np.errstate(divide="ignore", invalid="ignore"): nu = np.where(np.abs(den) > 1e-12, u - num / den, u)
    return np.clip(nu, 0, 1)
def fit(P, t1, t2, err):
    if len(P) == 2:
        d = np.linalg.norm(P[1] - P[0]) / 3; return [[P[0], P[0] + t1 * d, P[1] + t2 * d, P[1]]]
    u = chord(P); c = gen(P, u, t1, t2); e, s = maxerr(P, c, u)
    if e < err: return [c]
    if e < err * 4:
        for _ in range(20):
            u = repar(P, c, u); c = gen(P, u, t1, t2); e, s = maxerr(P, c, u)
            if e < err: return [c]
    s = max(1, min(len(P) - 2, s))
    tc = P[s - 1] - P[s + 1]; n = np.linalg.norm(tc); tc = tc / n if n else tc
    return fit(P[: s + 1], t1, tc, err) + fit(P[s:], -tc, t2, err)
def unit(v):
    n = np.linalg.norm(v); return v / n if n else v

ERR = 0.55  # in up-sampled pixels (~0.14 px of the artwork)
paths = []
for C in contours:
    P = C[:, ::-1] - 2  # (x, y), undo the pad
    if np.linalg.norm(P[0] - P[-1]) < 1e-6: P = P[:-1]
    n = len(P)
    if n < 12: continue
    # corners: the turn between the directions to the points 5 samples back and ahead
    K = 5
    ang = np.zeros(n)
    for i in range(n):
        d1 = unit(P[i] - P[(i - K) % n]); d2 = unit(P[(i + K) % n] - P[i])
        ang[i] = math.degrees(math.acos(max(-1, min(1, d1 @ d2))))
    corners = [i for i in range(n) if ang[i] > 52 and ang[i] >= max(ang[(i + j) % n] for j in range(-K, K + 1))]
    # keep one per cluster
    cs = []
    for i in corners:
        if not cs or i - cs[-1] > K: cs.append(i)
    if len(cs) > 1 and (cs[0] + n) - cs[-1] <= K: cs.pop()
    if not cs:
        # a smooth closed curve (o, the bowls): split it at its top and bottom
        cs = [int(np.argmin(P[:, 1])), int(np.argmax(P[:, 1]))]
        cs.sort()
        smooth_join = True
    else: smooth_join = False
    segs = []
    for k in range(len(cs)):
        i0, i1 = cs[k], cs[(k + 1) % len(cs)]
        idx = list(range(i0, i1 + 1)) if i1 > i0 else list(range(i0, n)) + list(range(0, i1 + 1))
        Q = P[idx]
        if smooth_join:
            t1 = unit(P[(i0 + 2) % n] - P[(i0 - 2) % n]); t2 = -unit(P[(i1 + 2) % n] - P[(i1 - 2) % n])
        else:
            t1 = unit(Q[min(3, len(Q) - 1)] - Q[0]); t2 = unit(Q[max(0, len(Q) - 4)] - Q[-1])
        segs += fit(Q, t1, t2, ERR)
    v = [s[0] for s in segs]
    o = [s[1] - s[0] for s in segs]
    i_ = [segs[(k - 1) % len(segs)][2] - segs[(k - 1) % len(segs)][3] for k in range(len(segs))]
    sc = 1.0 / UP
    r = lambda arr: [[round(float(p[0]) * sc, 1), round(float(p[1]) * sc, 1)] for p in arr]
    paths.append({"v": r(v), "i": r(i_), "o": r(o), "c": True})

# the check: the artwork, the trace drawn back (beziers flattened), and their difference
def raster(paths, S):
    img = Image.new("L", (W * S, H * S), 0); dr = ImageDraw.Draw(img)
    polys = []
    for p in paths:
        pts = []
        v, i_, o = [np.array(x) for x in (p["v"], p["i"], p["o"])]
        for k in range(len(v)):
            k2 = (k + 1) % len(v)
            seg = bez(v[k], v[k] + o[k], v[k2] + i_[k2], v[k2], np.linspace(0, 1, 16))
            pts += [(float(x) * S, float(y) * S) for x, y in seg]
        polys.append(pts)
    # even-odd: xor each polygon in
    acc = np.zeros((H * S, W * S), dtype=bool)
    for pts in polys:
        m = Image.new("1", (W * S, H * S), 0); ImageDraw.Draw(m).polygon(pts, fill=1); acc ^= np.asarray(m, dtype=bool)
    return Image.fromarray((acc * 255).astype(np.uint8))
S = 2
tr = raster(paths, S)
orig = im.split()[3].resize((W * S, H * S), Image.LANCZOS)
o_ = np.asarray(orig) > 127; t_ = np.asarray(tr) > 127
iou = (o_ & t_).sum() / max(1, (o_ | t_).sum())
diff = Image.fromarray((np.dstack([o_ & ~t_, np.zeros_like(o_), ~o_ & t_]) * 255).astype(np.uint8))
sheet = Image.new("RGB", (W * S, H * S * 3), "white")
sheet.paste(Image.merge("RGB", [Image.eval(orig, lambda x: 255 - x)] * 3), (0, 0)); sheet.paste(Image.merge("RGB", [Image.eval(tr, lambda x: 255 - x)] * 3), (0, H * S)); sheet.paste(diff, (0, 2 * H * S))
sheet.save(check)
nv = sum(len(p["v"]) for p in paths)
json.dump({"w": W, "h": H, "src": "src/app.js logoPortrait (the site's own logo artwork)", "paths": paths}, open(out, "w"), separators=(",", ":"))
print("contours", len(paths), "vertices", nv, "IoU", round(float(iou), 4))
