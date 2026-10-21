# core30 · The Core 3.0 on cromaticstudios.com

Built from `~/cromatic-core` (its own repo). Do not edit these files here; rebuild there and copy:

```bash
cd ~/cromatic-core && npm run build
rm -rf core30/www core30/configs && cp -R ~/cromatic-core/dist core30/www && cp -R ~/cromatic-core/server/configs core30/configs && cp ~/cromatic-core/server/core30.mjs core30/core30.mjs
```

- `www/` the tool, served at `/thecore30/<respondent>?t=<token>` (no client data inside)
- `configs/<id>.json` one questionnaire per edition, served only through `GET /api/core30/<id>/config?t=<token>`:
  `blank.json` is the canonical edition (internal validation, never sent to a client), the others are custom editions (`simplu21`, `demo`)
- `core30.mjs` the API, mounted in `server.js`: drafts, submits, emails, the workshop's `latest`

Answers live outside the release, in `CORE30_DATA` or `../../shared/core30` (fallback `$HOME/core30-data`).
The workshop key is `CORE30_ADMIN_KEY`, else `LEADS_KEY`.
