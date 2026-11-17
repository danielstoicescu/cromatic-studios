# One Google Sans Flex file for every Romanian line (Tudor/engineer, r484: text that alternated between the latin and
# latin-ext files was shaped in tiny runs, ~10x slower layout on a long Romanian answer).
# python3 scripts/font-ro.py  ->  src/assets/fonts/google-sans-flex-latin-ro.woff2
# r483-6 (site): ported from The Core (wt-core-r484/scripts/font-ro.py). On the site the result IS site/fonts/
# google-sans-flex-latin.woff2, so the inputs are Google's original files, given as arguments:
#   git show 3c3f29c9:site/fonts/google-sans-flex-latin.woff2 > /tmp/l.woff2
#   python3 build/font-ro.py /tmp/l.woff2 site/fonts/google-sans-flex-latin-ext.woff2 site/fonts/google-sans-flex-latin.woff2
# The latin file (from Google Fonts, the same file the site uses) plus the Romanian letters it lacks, taken from the
# latin-ext file of the same font and build: ă ș ț Ș Ț and the cedilla forms ş ţ Ş Ţ (Ă Â Î â î are already in latin).
# Outlines, variations (wght 1-1000), advances and their HVAR deltas come over as they are; each new letter kerns as
# its base letter (s, t, a, S, T), the way the font itself groups composites. No download needed.
from copy import deepcopy
from pathlib import Path
from fontTools.ttLib import TTFont
import sys

L = TTFont(sys.argv[1])
E = TTFont(sys.argv[2])
for f in (L, E): f.ensureDecompiled()  # every table read before the glyph order changes
ADD = "ăşţșțŞŢȘȚ"
cmL, cmE = L.getBestCmap(), E.getBestCmap()
order = list(L.getGlyphOrder())
have = set(order)

def closure(name, out):
    g = E["glyf"][name]
    if g.isComposite():
        for c in g.components:
            if c.glyphName not in have and c.glyphName not in out: closure(c.glyphName, out)
    if name not in have and name not in out: out.append(name)

new = []
for ch in ADD: closure(cmE[ord(ch)], new)
base = {}
for name in new:
    g = E["glyf"][name]
    base[name] = g.components[0].glyphName if g.isComposite() else None
# r483-6 (site): "a" has its own advance deltas (wider than every accented a at 650 and up), so ă advances and kerns
# as "á" (aacute), the sibling with the same deltas as latin-ext's own abreve; otherwise ă was 1-2 percent too wide at 650-900
SIB = {"abreve": "aacute"}
for name in new:
    if name in SIB and SIB[name] in have: base[name] = SIB[name]

order += new
L.setGlyphOrder(order)
glyf, gvar, hmtx = L["glyf"], L["gvar"], L["hmtx"]
glyf.glyphOrder = order
for name in new:
    glyf.glyphs[name] = deepcopy(E["glyf"][name])
    hmtx.metrics[name] = E["hmtx"].metrics[name]
    gvar.variations[name] = deepcopy(E["gvar"].variations.get(name, []))
for t in L["cmap"].tables:
    if t.isUnicode():
        for ch in ADD: t.cmap[ord(ch)] = cmE[ord(ch)]

# advance deltas: a composite advances as its base; a mark (no base) as an existing zero-width mark
h = L["HVAR"].table
mark = next(n for n in ("uni0327", "uni0306") if n in have)
for name in new: h.AdvWidthMap.mapping[name] = h.AdvWidthMap.mapping[base[name] or mark]

gdef = L["GDEF"].table
if gdef.GlyphClassDef:
    for name in new: gdef.GlyphClassDef.classDefs[name] = gdef.GlyphClassDef.classDefs.get(base[name], 1) if base[name] else 3

gid = L.getGlyphID
def pairs():
    for lk in L["GPOS"].table.LookupList.Lookup:
        for st in lk.SubTable:
            st = st.ExtSubTable if lk.LookupType == 9 else st
            if getattr(st, "LookupType", lk.LookupType) == 2: yield st
for st in pairs():
    cov = st.Coverage.glyphs
    if st.Format == 2:
        for name in new:
            b = base[name]
            if not b: continue
            if b in cov: cov.append(name)
            if b in st.ClassDef1.classDefs: st.ClassDef1.classDefs[name] = st.ClassDef1.classDefs[b]
            if b in st.ClassDef2.classDefs: st.ClassDef2.classDefs[name] = st.ClassDef2.classDefs[b]
        cov.sort(key=gid)
    else:
        sets = dict(zip(cov, st.PairSet))
        for name in new:
            b = base[name]
            if b and b in sets: sets[name] = deepcopy(sets[b])
        for ps in sets.values():
            for r in list(ps.PairValueRecord):
                for name in new:
                    if base[name] and r.SecondGlyph == base[name]:
                        c = deepcopy(r); c.SecondGlyph = name; ps.PairValueRecord.append(c)
            ps.PairValueRecord.sort(key=lambda r: gid(r.SecondGlyph)); ps.PairValueCount = len(ps.PairValueRecord)
        st.Coverage.glyphs = sorted(sets, key=gid)
        st.PairSet = [sets[g] for g in st.Coverage.glyphs]; st.PairSetCount = len(st.PairSet)

# Romanian and Moldavian text asks for the comma forms: under lang="ro" the font turns ş ţ Ş Ţ into ș ț Ș Ț (its own
# locl rule from the latin-ext file, carried over as a new lookup with ROM and MOL language systems under latn)
from fontTools.ttLib.tables import otTables as ot
gsub = L["GSUB"].table
emap = None
for fr in E["GSUB"].table.FeatureList.FeatureRecord:
    if fr.FeatureTag != "locl": continue
    for li in fr.Feature.LookupListIndex:
        lk = E["GSUB"].table.LookupList.Lookup[li]
        for st in lk.SubTable:
            st = st.ExtSubTable if lk.LookupType == 7 else st
            m = getattr(st, "mapping", None)
            if m and "scedilla" in m: emap = dict(m)
if emap:
    sub = ot.SingleSubst(); sub.mapping = emap; sub.Format = 1
    lk = ot.Lookup(); lk.LookupType = 1; lk.LookupFlag = 0; lk.SubTable = [sub]; lk.SubTableCount = 1
    gsub.LookupList.Lookup.append(lk); gsub.LookupList.LookupCount = len(gsub.LookupList.Lookup)
    feat = ot.Feature(); feat.FeatureParams = None; feat.LookupListIndex = [len(gsub.LookupList.Lookup) - 1]; feat.LookupCount = 1
    fr = ot.FeatureRecord(); fr.FeatureTag = "locl"; fr.Feature = feat
    gsub.FeatureList.FeatureRecord.append(fr); gsub.FeatureList.FeatureCount = len(gsub.FeatureList.FeatureRecord)
    fi = len(gsub.FeatureList.FeatureRecord) - 1
    for sr in gsub.ScriptList.ScriptRecord:
        if sr.ScriptTag != "latn": continue
        dflt = sr.Script.DefaultLangSys
        for tag in ("MOL ", "ROM "):
            ls = ot.LangSys(); ls.LookupOrder = None; ls.ReqFeatureIndex = 0xFFFF
            ls.FeatureIndex = sorted(list(dflt.FeatureIndex) + [fi]); ls.FeatureCount = len(ls.FeatureIndex)
            r = ot.LangSysRecord(); r.LangSysTag = tag; r.LangSys = ls
            sr.Script.LangSysRecord.append(r)
        sr.Script.LangSysRecord.sort(key=lambda r: r.LangSysTag); sr.Script.LangSysCount = len(sr.Script.LangSysRecord)

L.flavor = "woff2"
out = Path(sys.argv[3])
L.save(out)
print(f"{out.name}: +{len(new)} glyphs ({' '.join(new)}), {out.stat().st_size / 1024:.1f} KB")
