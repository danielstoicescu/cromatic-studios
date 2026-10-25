#!/bin/zsh
# P1 v3 -r7: the car frames P1 v3 uses (film-v3-r7.mjs --list -> used.json), re-rendered with Radu's r7 hero Dacia at
# ultra (256 samples, 2x -> 1080 JPEG over the v1 cache copy). Existing r7 frames are skipped (marker files).
S=/private/tmp/claude-501/-Users-daniel-stoic/91f99970-4c85-4c76-9af9-b4762e98f53c/scratchpad/p1r7
cd /Users/daniel.stoic/cromatic-vera-e8/design/diorama-render
mkdir -p $S/raw $S/done
for line in $(cat $S/frames.txt); do
  s=${line%%:*}; fr=${line#*:}
  todo=(); for f in ${(s:,:)fr}; do [ -f $S/done/$s-$f ] || todo+=$f; done
  [ ${#todo} -eq 0 ] && { echo "DONE $s (cached)"; continue; }
  HARNESS=http://localhost:8952 node render.mjs shots/p1/$s.mjs --frames ${(j:,:)todo} --quality ultra --out $S/raw 2>&1 | grep -E "frame [0-9]+:|Error" | tail -2
  for f in $todo; do
    src=$S/raw/$s-$(printf %04d $f).png
    [ -f $src ] || { echo "MISSING $src"; continue; }
    node -e 'require("/Users/daniel.stoic/cromatic-drive/node_modules/sharp")(process.argv[1]).resize(1080,1920,{kernel:"lanczos3"}).jpeg({quality:95,chromaSubsampling:"4:4:4"}).toFile(process.argv[2]).then(()=>require("fs").unlinkSync(process.argv[1]))' $src $S/cache/$s-$(printf %04d $f).jpg && touch $S/done/$s-$f
  done
  echo "DONE $s $(date +%T)"
done
echo ALLDONE
