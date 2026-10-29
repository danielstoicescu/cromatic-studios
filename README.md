# cromaticstudios.com

The Cromatic Studios website: a real-3D (Three.js) map of the studio's Bucharest, driven with arrows or a joystick, plus a plain content site, the case pages, the 2 MINUTES 2 FIGHT mini-game, The Core 3.0 brand tool and the internal /ops mirror. One Node app serves all of it on `cromaticstudios.com` and `beta.cromaticstudios.com`.

State when this file was written: **live 4.10** (r296, `3559138`); beta = live + the private Longevity report + the "β" label (`aad3ef2`).

## What is in here

| Path | What it is |
|---|---|
| `src/app.js` | the map: Three.js world, the Multiverse worlds (`SCHEMES`: Cromatic, Sketchbook and the others), rides, places and their cards, the chase, XP, the boarding pass form |
| `src/nav2.js`, `src/nav2.css` | driving on the map (the "nav2" engine that became the only 3D mode in beta 3.0): arrow/joystick driving, Street and Bird's eye views, Nearby panel, auto-pilot, Polite Patrol pull-overs |
| `src/lottie-ui/` | the Lottie layer (`czl.js` player + pieces: `finale.js` plane finale, `pill.js` transitions, `micro.js` XP/cards, `welcome.js` welcome card, `game.js` game entry, `metro.js`, `onb.js`). The JSON files are the animations. `LUI_HOST` in `build/build.mjs` lists which pieces are inlined into the map |
| `src/intro/` | the opening (Lottie "pill" intro, worlds atlases, boot screen) |
| `src/minigame.js`, `src/minigame.css` | **2 MINUTES 2 FIGHT w/ I O N**, the Two Min Lab arcade fighter, served at `/play/gloves/` and opened from the map's arcade cabinet |
| `src/photo.js`, `src/photo.css` | Postcard photo mode on the map |
| `src/head.html`, `src/styles.css`, `src/content.html` | document head, styles, and the text version of the map (what crawlers, screen readers and no-JS visitors read; keep it in sync with the copy) |
| `site/` | the normal website: `/site/` (EN), `/ro/` (RO), case pages `/work/<slug>/` (RO `/ro/proiecte/<slug>/`), `/industries/*`, `/services/*`, `/team/`. `data.mjs` = projects and copy, `hubs.mjs` = hubs, services, team, `render.mjs` = HTML, `site.css`/`site.js`, `cases/`, `media/`, `fonts/` |
| `site/i18n/` | Romanian: `ro.json` translations, `ro.missing.json` (must stay empty), `ro.keep-en.json`, `GUIDE.md` |
| `site/landings/` | ads landing pages `/lp/<slug>/` (noindex), one JSON per landing |
| `site/onboarding/` | `/onboarding/` (the launch page) and its stills |
| `site/rapoarte/` | private client reports `/rapoarte/<slug>/` (noindex, no-store, no GA) |
| `build/` | the build. `build.mjs` (entry, `BUILD_LABEL`), `i18n.mjs`, `seo.mjs` + `seo-pages.mjs` (schema.org, llms.txt, sitemap, per-page SEO), `lastmod.json` (per-page last-modified dates), `kinetic.mjs`, `board.mjs`, `consent.mjs`, `footer.mjs`, `landings.mjs`, `images.mjs`, `videos.mjs`, `film.mjs` |
| `beta/nav2.patch`, `beta/update.sh` | what beta adds on top of main (see "main, live and beta") |
| `core30/` | **The Core 3.0** (brand discovery tool), built in `~/cromatic-core` and copied here; see `core30/README.md`. Do not edit it here |
| `ops/` | the **/ops** mirror of the Cromatic Ops dashboard (`ops.mjs` = API + passwordless login, `www/` = app, `users.json` = who may log in) |
| `server.js` | the Node server (all hosts, all routes below) |
| `app.js` | the app's entry: loads `.env`, port 8081, imports `server.js` |
| `ecosystem.config.cjs`, `deploy/` | how pm2 runs it (since r400): cluster mode, ONE instance, `wait_ready`, started through the deploy symlink (`deploy/pm2-entry.cjs` -> `app.js`); `deploy/pm2-reload.mjs` is the post-symlink step (preflight, then graceful `pm2 reload`) |
| `mail-template.js` | the boarding pass email |
| `design/` | design sources and QA. `design/lottie-ui/_source/tools/qa/` holds the Playwright QA scripts (regression, fps, game, pill, welcome, ...) |
| `Dockerfile`, `bunnyshell.yaml` | **unused** (kept from the first setup; production is Bunnyshell Cloud with deploy steps, not Environments/Docker) |

## Routes

| Path | Served by |
|---|---|
| `/`, `/ro/` | the website's home page (EN, RO). Since r356; built as `/site/` and moved by `build/homemove.mjs` at the end of the build |
| `/city/` and `/city/?map` | the 3D map, the Cromatic City (`?intro` forces the full opening, `?welcome` the welcome card). `/site/` 301s to `/`; `/` with a parameter the map reads (`map`, `drive`, `intro`, `boarding`, `world`, ... or `utm_*`) 301s to `/city/` with its query (server.js `homeMove`) |
| `/work/*`, `/ro/proiecte/*`, `/industries/*`, `/services/*`, `/team/` | the normal website |
| `/play/gloves/` | the 2M2F mini-game |
| `/lp/<slug>/`, `/ro/lp/<slug>/` | ads landing pages |
| `/onboarding/`, `/rapoarte/<slug>/` | launch page, private reports |
| `/thecore30/<id>?t=<token>`, `/thecore30/lite`, `/thecore30/blank`, `/api/core30/*` | The Core 3.0 (answers live outside the release in `CORE30_DATA`) |
| `/ops`, `/api/ops/*` | the Ops mirror (email + emailed code login, data in `OPS_DATA`) |
| `POST /api/boarding` | the boarding pass form (mail to the studio + the passenger, lead saved) |
| `/api/csp-report*`, `/api/ctx`, `/api/leads`, `/healthz` | CSP reports, internal-IP flag, leads (key), health (r400: a readiness probe, 503 until the process listens and while it drains on shutdown) |

Hosts: `cromaticstudios.com` is the primary host (`PRIMARY_HOST`); `www.` and `drive.` 301 to it. `beta.cromaticstudios.com` (`BETA_HOST`) serves the beta build from `public-beta/` (never indexed, built without GA); if no beta build exists it shows the live site with `noindex`. `/ops` and The Core answer on both hosts.

## Build

```bash
npm ci
PUBLIC_DIR=/tmp/cz-public GA_ID= node build/build.mjs
git checkout -- build/lastmod.json
```

- `PUBLIC_DIR` builds somewhere other than `public/`, so parallel worktrees do not collide. `GA_ID=` (empty) builds without Google Analytics; leave it out only for a production-like build.
- The build must print **`0 blocks still in English`** in its `[i18n]` line. Anything else means `site/i18n/ro.missing.json` has entries: translate them in `ro.json` (or list them in `ro.keep-en.json`) before committing.
- A local build rewrites dates in `build/lastmod.json`; revert it with `git checkout -- build/lastmod.json` unless the commit really changes page words.
- Other env: `SITE_URL` (default `https://cromaticstudios.com`), `GTM_ID`, `OAI_PIXEL_ID`, `BUILD_LABEL` (overrides the label under the logo).
- `node build/build.mjs --single dist/cromatic-studios-3d.html` makes one self-contained HTML file for local viewing.
- Serve a build locally: `PUBLIC_DIR=/tmp/cz-public PORT=8931 node server.js`. Without `SMTP_HOST`, boarding passes are logged, not mailed.

### Labels and r-numbers

Every round gets an r-number in its commit message (`r296: ...`, follow-ups `r296b`) and a version label in `BUILD_LABEL` in `build/build.mjs` (`"beta 4.10"`, shown small under the logo). The comment after `BUILD_LABEL` is the running changelog: newest first, each entry ends with `; before: ...`. Agents' branches use a placeholder label; the coordinator sets the real one at merge. Before you pick an r-number, check `git log origin/main`: other sessions (The Core, Ops) use the same sequence.

## main, live and beta

- **`main` is exactly the live tree.** Whatever is on `origin/main` is what the next deploy puts on cromaticstudios.com. Never push unapproved work to main.
- **Beta = main + `beta/nav2.patch`.** At deploy time a step copies the release, applies `beta/nav2.patch` (`git apply`), builds it without GA into `public-beta/`, and `server.js` serves that on `beta.cromaticstudios.com`.
- The patch is text only. It never contains `server.js`, `beta/`, images, video or fonts (`beta/update.sh` excludes them). New binaries a beta needs go to main as **new file names** (unused by live), so live is unaffected.
- To stage a beta: build the stack on its own branch (e.g. `stack-45` / `live-45`), diff it against `origin/main` into `beta/nav2.patch` (`beta/update.sh <ref>` does merge-base diffing; label-only patches are fine), commit the patch on main, deploy. Always run `git apply --check beta/nav2.patch` on a clean checkout of main before committing.
- To promote beta to live: put the stack's tree on a branch cut **from `origin/main`** (so `179c62b` "The Core 3.0" and everything after stays in history, and `server.js` + `core30/` + `ops/` are kept), set the label, commit `rNNN: LIVE x.y (Daniel: "...")`, then reset `beta/nav2.patch` to what beta still adds (today: the Longevity report + the "β" label).
- Live needs Daniel's explicit OK, quoted in the commit message. Beta does not.

## QA before a deploy

1. **Build** as above: `0 blocks still in English`, no build errors.
2. **Patch check**: `git apply --check beta/nav2.patch` on main.
3. **Regression** (map card opens/closes, Go deeper opens a case page in the frame, the game opens/closes, console clean):
   ```bash
   BASE=<url> node ~/cromatic-lottie5/design/lottie-ui/_source/tools/qa/regression.mjs
   ```
   The same script is in this repo at `design/lottie-ui/_source/tools/qa/regression.mjs`. `BASE` is a local server (`http://localhost:8931`), `https://beta.cromaticstudios.com` or `https://cromaticstudios.com`. `DEV=desktop|iphone|pixel` picks the device. Read the last line: `errors: [] bad: []`.
4. **Patrol check** (Polite Patrol: speeding on Medical Avenue brings the chase, no second chase inside the 45 s calm, the drift path still works):
   ```bash
   BASE=<url> node design/lottie-ui/_source/tools/qa/patrol.mjs   # prints {"ok":true,...}, exits 1 on failure
   ```
   The script lives on branch `patrol-pullover-fix` (not on main yet): `git show origin/patrol-pullover-fix:design/lottie-ui/_source/tools/qa/patrol.mjs > design/lottie-ui/_source/tools/qa/patrol.mjs` next to `lib.mjs`.
5. **After a deploy**: `/healthz` answers `{"ok":true}` (a 503 `{"ok":false}` means the process is starting or draining), the label under the logo reads the new version, `/api/core30/simplu21/config?t=x` answers **403** (The Core is mounted), `/ops` shows its login, `beta.` shows "β".

## Deploy (Bunnyshell Cloud, manual)

Production runs on Bunnyshell Cloud (not Environments): app **cromatic-drive** (id 24496) on server `cromatic-wp-prod-new` (1 CPU / 1 GB, shared with the studio's WordPress), Node 16, pm2, multi-release under `/var/www/cromatic_drive/app`. Cloudflare proxies the domain and terminates HTTPS.

There is **no auto-deploy**. A deploy is a manual click:

1. Push to `origin/main` (only approved work, see above).
2. Open the app's deployment overview in Bunnyshell, check the deploy pointer field (`deployPointer`) is **main**, click **DEPLOY**, then **Deploy** in the "Are you sure?" modal. If another deployment is running the form is absent; wait. A "Deployment started" toast can be stale: confirm "In progress..." under the app name.
3. The steps (edited in the Bunnyshell UI, must stay ASCII-only): pre-symlink = `npm ci` + build of live into `public/` + beta (copy, apply `beta/nav2.patch`, build without GA into `public-beta/`, hard links to dedupe), keeping 2 releases; post-symlink = `cd /var/www/cromatic_drive/app && node deploy/pm2-reload.mjs` (since r400; before: pm2 delete + start of `app.js`, which gave ~10-20 s of 503 on every deploy). The script first boots the new release once on `127.0.0.1:18081` (preflight: `/healthz` must answer 200 within 90 s, else pm2 is left alone, the old process keeps serving and the deploy fails), then runs `pm2 reload ecosystem.config.cjs --update-env`: pm2 keeps port 8081 open, starts the new process beside the old one, waits for its "ready", and only then lets the old one finish its requests and exit. No request fails. The first deploy after r400 moves the old fork-mode app to cluster mode (one last short gap). Logs: `pm2 logs cromatic-drive`.
4. Wait until the live `assets/app.<hash>.js` changes, then run the post-deploy checks above.
5. **Record the deploy** in `~/cromatic-ops/refs/deploy-journal.md` (time +03:00, version, commit, what shipped, who approved).

Secrets (SMTP, leads key, The Core admin key, ops bridge key, CSP stats key, ...) are Bunnyshell Secrets or the server's shared `.env`; they reach pm2 as environment variables. They are never committed, never printed in logs (the server logs only which variable a key came from), and never pasted in chat. Variable names the server reads: `PORT`, `PRIMARY_HOST`, `BETA_HOST`, `BETA_HOST2`, `BETA_DIR`, `PUBLIC_DIR`, `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_HELO`, `MAIL_FROM`, `MAIL_TO`, `MAIL_SUBJECT_TAG`, `LEADS_DIR`, `LEADS_KEY`, `CORE30_DATA`, `CORE30_ADMIN_KEY`, `OPS_DATA`, `CSP_STATS_KEY`, `INTERNAL_IPS`, `OAI_PIXEL_ID`, `OAI_CONVERSIONS_KEY`, `OLD_WP_UPLOADS`, `ACME_ROOT`; since r400 also `DRAIN_MS` (shutdown drain, default 10000), `LISTEN_HOST`; the deploy script reads `CZ_APP_PATH` (default `/var/www/cromatic_drive/app`), `PREFLIGHT=0` (skip the preflight), `PREFLIGHT_PORT` (18081), `PM2_BIN`.

## Working in this repo

- Work in a git worktree per task, branched from `origin/main` (or from the current stack branch for beta work). Commit with pathspecs; never `git stash` in shared worktrees.
- Images get WebP variants cached in `site/.img-cache` (committed, by content hash).
- The repo is private: `github.com/danielstoicescu/cromatic-studios`.
