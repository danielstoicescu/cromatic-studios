#!/bin/zsh
# E8h: E8g with Radu's r7 hero Dacia + Patrol: only the shots that carry them (t1: the 1300; chase: the 1300 and the
# Patrol) re-rendered at ultra into finalh (a copy of E8f's finald), chunks of 4, 2x PNG -> 1080 JPEG at the global frame.
S=/private/tmp/claude-501/-Users-daniel-stoic/91f99970-4c85-4c76-9af9-b4762e98f53c/scratchpad/e8h
cd /Users/daniel.stoic/cromatic-vera-e8/design/diorama-render
mkdir -p $S/raw $S/done
for spec in t1:0:36 chase:270:135; do
  s=${spec%%:*}; rest=${spec#*:}; g0=${rest%%:*}; n=${rest#*:}; a=0
  while [ $a -lt $n ]; do
    b=$((a+3)); [ $b -ge $n ] && b=$((n-1))
    if [ -f $S/done/$s-$b ]; then a=$((b+1)); continue; fi
    HARNESS=http://localhost:8952 node render.mjs shots/e8d/$s.mjs --frames $a-$b --quality ultra --out $S/raw 2>&1 | grep -E "frame [0-9]+:|Error" | tail -1
    for f in $(seq $a $b); do
      src=$S/raw/$s-$(printf %04d $f).png
      [ -f $src ] || { echo "MISSING $src"; continue; }
      node -e 'require("/Users/daniel.stoic/cromatic-drive/node_modules/sharp")(process.argv[1]).resize(1080,1920,{kernel:"lanczos3"}).jpeg({quality:95,chromaSubsampling:"4:4:4"}).toFile(process.argv[2]).then(()=>require("fs").unlinkSync(process.argv[1]))' $src $S/finalh/f$(printf %05d $((g0+f))).jpg && touch $S/done/$s-$f
    done
    a=$((b+1))
  done
  echo "DONE $s $(date +%T)"
done
echo ALLDONE
