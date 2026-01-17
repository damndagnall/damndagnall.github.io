# Contact form setup (secure)

This site is static, so the form is wired to a **Cloudflare Pages Function** at `POST /api/contact`.

That means:
- your inbox address **is not exposed** in the public HTML
- no API keys are committed to GitHub
- Turnstile is verified **server-side** (stops most bot spam)

## 1) Create a Cloudflare Turnstile widget

In Cloudflare Dashboard:
- Turnstile → Add site
- Widget type: *Managed*
- Domains: your site domain(s) (e.g. `tasmanescape.com.au`)

Copy:
- **Site key** (public)
- **Secret key** (private)

Paste the **site key** into:
- `index.html` and `index-single.html` at `data-sitekey="YOUR_TURNSTILE_SITE_KEY"`

## 2) Set environment variables in Cloudflare Pages

Pages → your project → Settings → Environment variables:

Required:
- `TURNSTILE_SECRET_KEY` = your Turnstile secret key
- `CONTACT_TO` = the email you want enquiries delivered to
- `CONTACT_FROM` = a sender on your domain, e.g. `noreply@tasmanescape.com.au`

Optional (spam protection):
- bind a KV namespace named `CONTACT_RATE` (60s per-IP rate limit)

## 3) Mail sending

The backend uses **MailChannels** (`https://api.mailchannels.net/tx/v1/send`).

If MailChannels rejects the sender, set `CONTACT_FROM` to an address on a domain you control, and make sure DNS is set up properly for that domain.

## 4) Test

Deploy, then submit the form.

If it fails:
- check Turnstile keys are correct
- check Pages environment variables exist
- check the Pages Function logs
