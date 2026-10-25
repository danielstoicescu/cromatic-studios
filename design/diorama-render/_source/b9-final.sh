#!/bin/zsh
# B9 final: each shot at ultra (256 samples, 2160x3840; Sketchbook 128 samples at 1080, the notebook's strokes are
# drawn in screen pixels), in chunks of 4; each 2x PNG goes down to a 1080x1920 JPEG (q95, lanczos) as f1080/sKK-NNN.jpg
# and is deleted. Existing JPEGs are skipped (rerun = resume). SEGS=0,1,5,9,10 re-renders only the 1300's shots
# (delete their JPEGs first: rm f1080/s0[0159]-* f1080/s10-*).
S=/private/tmp/claude-501/-Users-daniel-stoic/91f99970-4c85-4c76-9af9-b4762e98f53c/scratchpad/vera-b9
cd /Users/daniel.stoic/cromatic-vera-e8/design/diorama-render
mkdir -p $S/f1080 $S/raw
N=(72 33 35 35 35 35 35 35 35 35 92)
for k in ${(s:,:)${SEGS:-2,3,4,6,7,8,5,0,1,9,10}}; do
  kk=$(printf %02d $k); n=${N[$((k+1))]}; a=0
  Q="--quality ultra"; [ $k -eq 5 ] && Q="--quality final --scale 0.5"
  while [ $a -lt $n ]; do
    b=$((a+3)); [ $b -ge $n ] && b=$((n-1))
    if [ -f $S/f1080/s$kk-$(printf %03d $b).jpg ]; then a=$((b+1)); continue; fi
    HARNESS=http://localhost:8952 node render.mjs shots/b9/s$kk.mjs --frames $a-$b ${=Q} --out $S/raw 2>&1 | grep -E "frame [0-9]+:|Error|error" | tail -2
    for f in $(seq $a $b); do
      src=$S/raw/s$kk-$(printf %04d $f).png
      [ -f $src ] || { echo "MISSING $src"; continue; }
      node -e 'require("/Users/daniel.stoic/cromatic-drive/node_modules/sharp")(process.argv[1]).resize(1080,1920,{kernel:"lanczos3"}).jpeg({quality:95,chromaSubsampling:"4:4:4"}).toFile(process.argv[2]).then(()=>require("fs").unlinkSync(process.argv[1]))' $src $S/f1080/s$kk-$(printf %03d $f).jpg
    done
    a=$((b+1))
  done
  echo "DONE s$kk $(date +%T) $(ls $S/f1080 | grep -c "^s$kk-")/$n"
done
echo ALLDONE
