#!/bin/zsh
# B9: graded frames -> story frames -> Lottie -> MP4 -> phone with B8's music. SEGS limits the post (e.g. the 1300's
# shots after a re-render: SEGS=0,1,5,9,10); the rest always runs whole.
set -e
S=/private/tmp/claude-501/-Users-daniel-stoic/91f99970-4c85-4c76-9af9-b4762e98f53c/scratchpad/vera-b9
V6=/Users/daniel.stoic/cromatic-ops/refs/stories-lottie/v6
FF=/Users/daniel.stoic/Library/Python/3.9/lib/python/site-packages/imageio_ffmpeg/binaries/ffmpeg-macos-aarch64-v7.1
L=/Users/daniel.stoic/cromatic-stories-lottie/design/stories/lottie/_source
cd /Users/daniel.stoic/cromatic-vera-e8/design/diorama-render && FORCE=1 node _source/b9-post.mjs $S/f1080 $S/graded $SEGS
cd $L && node framesB9.mjs $S/graded && node buildB9.mjs
FRAMEDIR=$S node record.mjs story-b9-en $V6 870
# phone: B8's music stream-copied (the clock is B8's), video re-encoded to stay under 15 MB
$FF -loglevel error -y -i $V6/story-b9-en.mp4 -i $V6/story-b8-en-music.mp4 -map 0:v -map 1:a -c:v libx264 -preset slow -profile:v high -pix_fmt yuv420p -b:v 5800k -maxrate 7500k -bufsize 12000k -movflags +faststart -c:a copy -shortest $V6/story-b9-en-music-phone.mp4
ls -la $V6/story-b9-en*
