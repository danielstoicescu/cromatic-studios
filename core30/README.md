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

Client reports (r294; generated in Ops, uploaded by the dashboard cron with the admin key):

- `POST /api/core30/admin/report` `{id, html, pdf (base64), version?}` → `<data>/<id>/report/{index.html, raport.pdf, meta.json}`; the previous upload moves to `report/history/<stamp>-v<version>/`.
- `GET /thecore30/<id>/raport?t=<client token>` and `/raport.pdf?t=` (403 without the token). The page can link its PDF as `raport.pdf` or `{{PDF_URL}}`; the token is added when it is served.
- `POST /api/core30/admin/report-mail` `{id, note?}` → the branded mail to the session email (or whoever started a repo edition), RO/EN, bcc and reply-to hi@; returns `{ok, to (masked), sentAt}`.
- `status.report = {available, version, uploadedAt, sentAt}`; the step log gets `report-uploaded` and `report-sent`.
