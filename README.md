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
| `Dockerfile`, `bunnyshell.yaml` | the container and the Bunnyshell environment |

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

## Deploy with Bunnyshell (from GitHub)

1. Push this repository to GitHub (private is fine).
2. In `bunnyshell.yaml`, set `gitRepo` to the repository URL.
3. In Bunnyshell: **Environments → Create environment → from bunnyshell.yaml**, paste or point to the file.
4. Set the secrets in the environment's variables: `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`.
5. Deploy. Bunnyshell builds the Dockerfile and serves the container on port 8080 at the host in `hosts`.
6. DNS: point `drive.cromaticstudios.com` at the Bunnyshell ingress (CNAME or A record, as Bunnyshell shows it).
7. With auto-deploy on `main`, every push redeploys.

Moving to the main domain later is only a change of `hosts` and `SITE_URL` (and a rebuild).

Health check: `GET /healthz`.
