#!/bin/zsh
# E8h: finalh (E8f frames, t1 + chase with the r7b 1300/Patrol) -> E8c grade 1.2 -> E8g's cards (compose ST=e8h CARDS=e8g)
# -> story-e8h-en.mp4 + poster + contact sheet -> phone with E8g's hip-hop v2 track (its audio stream-copied)
set -e
S=/private/tmp/claude-501/-Users-daniel-stoic/91f99970-4c85-4c76-9af9-b4762e98f53c/scratchpad/e8h
VEH=/Users/daniel.stoic/cromatic-ops/refs/stories-lottie/vehicles
FF=/Users/daniel.stoic/Library/Python/3.9/lib/python/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1
cd /Users/daniel.stoic/cromatic-veh-e8/design/stories/vehicles/_source
node gradeE8c.mjs $S/finalh $S/gradedh 1.2
lsof -nP -iTCP:8944 -sTCP:LISTEN >/dev/null || { (PORT=8944 nohup node ../../lottie/_source/serve.mjs > $S/stage.log 2>&1 &); sleep 2; }
ST=e8h CARDS=e8g STAGE=http://127.0.0.1:8944 node compose-e8.mjs $S/gradedh $VEH 380 contact-sheet-e8h.jpg
$FF -loglevel error -y -i $VEH/story-e8h-en.mp4 -i $VEH/story-e8g-en-hiphop2-phone.mp4 -map 0:v -map 1:a -c:v libx264 -preset slow -profile:v high -pix_fmt yuv420p -b:v 6000k -maxrate 8000k -bufsize 12000k -movflags +faststart -c:a copy -shortest $VEH/story-e8h-en-hiphop2-phone.mp4
ls -la $VEH/*e8h*
