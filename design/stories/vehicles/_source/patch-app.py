# story E: the debug hooks the ride render needs, on a SCRATCH worktree of origin/stack-44 only (never committed):
#   python3 ~/cromatic-drive/design/stories/v5/_source/patchsrc.py src/app.js && python3 patch-app.py src/app.js
# then PUBLIC_DIR=<tmp> GA_ID= node build/build.mjs ; PUBLIC_DIR=<tmp> PORT=8983 PRIMARY_HOST= node server.js
import sys
p = sys.argv[1]; s = open(p).read()
a = "window.__api = api; window.__jetG = "
assert s.count(a) == 1, "run the v5 patchsrc.py first"
s = s.replace(a, "window.__api = api; window.__outline = outline; window.__jetG = ")
open(p, 'w').write(s); print('patched: window.__outline')
