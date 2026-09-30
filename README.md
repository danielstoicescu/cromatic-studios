# Cromatic Studios — Navigation Mode

The 3D drive through Bucharest: a scroll-driven route through the Cromatic story that ends with a boarding pass and a coffee at Strada Olari 9.

## What is in here

| Path | What it is |
|---|---|
| `src/app.js` | the whole experience (Three.js bundle, UI, worlds, kinetic intro) |
| `src/styles.css`, `src/head.html` | styles and the document head (SEO and social cards) |
| `src/og.jpg` | the social preview image |
| `build/build.mjs` | the build: splits the inlined images and video into `public/assets/`, hashes JS/CSS, precompresses (brotli + gzip) |
| `server.js` | a small Node server: static files with long-lived caching and byte ranges for video, plus `POST /api/boarding` |
| `mail-template.js` | the boarding pass as an email (tables and inline styles, safe for Gmail/Outlook/Apple Mail) |
| `app.js` | the entry pm2 starts on the server: loads `.env`, defaults to port 8081, runs `server.js` |
| `Dockerfile`, `bunnyshell.yaml` | a container build, for Docker-based hosting |

## Run it locally

```bash
npm install
npm run dev          # builds public/ and serves it on http://localhost:8080
```

Without `SMTP_HOST`, the boarding-pass emails are accepted and logged instead of sent.
`npm run build:single` also produces one self-contained HTML file in `dist/` (for opening straight from disk).

## The boarding pass email

When someone completes the contact form, `POST /api/boarding` sends two emails:

1. to **hi@cromaticstudios.com** (`MAIL_TO`), with *reply-to* set to the passenger, so answering goes straight to them;
2. to the **passenger**, with their boarding pass.

The endpoint validates the input, ignores bots (honeypot field) and allows 5 passes per IP every 15 minutes.
If the endpoint cannot be reached, the page falls back to opening the visitor's email app, addressed to hi@cromaticstudios.com.

Environment variables (see `.env.example`):

| Variable | Default | Notes |
|---|---|---|
| `SITE_URL` | `https://drive.cromaticstudios.com` | used for canonical, social cards and the sitemap (also a Docker build arg) |
| `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` | — | any SMTP: Google Workspace, Postmark, SendGrid, Mailgun, Amazon SES… |
| `MAIL_FROM` | `Cromatic Air <hi@cromaticstudios.com>` | must be a sender the SMTP account is allowed to send as |
| `MAIL_TO` | `hi@cromaticstudios.com` | where the studio copy goes |

For good deliverability, the sending domain (cromaticstudios.com) should have SPF and DKIM set up for the SMTP provider.

## Deploy with Bunnyshell Cloud (from GitHub)

The app runs on the server `cromatic-wp-prod-new` (Node 16, pm2), deployed from `main` into `/var/www/cromatic_drive/app`.

- **Pre-symlink step** (builds the release): `npm ci --omit=dev` and `node build/build.mjs`.
- **Post-symlink step**: pm2 (re)starts `app.js` under the application's name. `app.js` listens on **8081**, the port the Bunnyshell proxy forwards to, and reads a `.env` file (next to it, or `../../shared/.env`, or the path in `ENV_FILE`).
- **Secrets**: put `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS` (and optionally `MAIL_FROM`, `MAIL_TO`) in that `.env`; see `.env.example`.
- **Domain**: `drive.cromaticstudios.com`, with an A record to the server's public IP, then the certificate from the Domains tab.
- **Auto-deploy**: the application's deployment webhook, added to the GitHub repository.

`Dockerfile` and `bunnyshell.yaml` are kept for container hosting (Bunnyshell Environments or anything that runs Docker).

Moving to the main domain later is only a change of `SITE_URL` (and a rebuild).

Health check: `GET /healthz`.
