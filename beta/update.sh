#!/bin/sh
# r169b: beta 2.0 travels to the server as a patch on main (the release on the server is not a git checkout):
# what branch nav2 changes in the app and its build, never server.js. Run after nav2 moves, then commit and deploy
set -e
cd "$(dirname "$0")/.."
git fetch -q origin main nav2
git diff origin/main origin/nav2 -- . ':(exclude)server.js' ':(exclude)beta' > beta/nav2.patch
echo "beta/nav2.patch: $(wc -c < beta/nav2.patch | tr -d ' ') bytes, from nav2 $(git rev-parse --short origin/nav2) on main $(git rev-parse --short origin/main)"
