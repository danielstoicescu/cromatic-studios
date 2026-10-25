#!/bin/sh
# r169b: beta 2.0 travels to the server as a patch on main (the release on the server is not a git checkout):
# what branch nav2 changes in the app and its build, never server.js. Run after nav2 moves, then commit and deploy
set -e
cd "$(dirname "$0")/.."
git fetch -q origin main nav2
REF="${1:-origin/nav2}" # r176c: or a given nav2 commit, to keep beta on a finished round
# r179c: binaries never travel in the patch (patch cannot apply them; beta keeps main's)
# r302: nor audio (.webm/.m4a) or Polite City's radio folder (site/polite-radio lives on main as is)
BASE=$(git merge-base origin/main "$REF") # r179d: only what nav2 itself changes, laid on today's main (main's newer work stays in beta)
git diff "$BASE" "$REF" -- . ':(exclude)server.js' ':(exclude)beta' ':(exclude)site/.img-cache' ':(exclude)site/media' ':(exclude)*.png' ':(exclude)*.jpg' ':(exclude)*.webp' ':(exclude)*.mp4' ':(exclude)*.woff2' ':(exclude)*.webm' ':(exclude)*.m4a' ':(exclude)site/polite-radio' > beta/nav2.patch
echo "beta/nav2.patch: $(wc -c < beta/nav2.patch | tr -d ' ') bytes, from nav2 $(git rev-parse --short "$REF") on main $(git rev-parse --short origin/main), base $(git rev-parse --short "$BASE")"
