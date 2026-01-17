/**
 * Cloudflare Pages Function: POST /api/contact
 *
 * Protects users by:
 * - Verifying Cloudflare Turnstile server-side (prevents spam + abuse)
 * - Keeping inbox address and any secrets off the public frontend
 * - Optional per-IP rate limiting via a KV binding
 *
 * Required env vars (Pages > Settings > Environment variables):
 * - TURNSTILE_SECRET_KEY
 * - CONTACT_TO (your receiving email)
 * - CONTACT_FROM (a verified sender on your domain, e.g. "noreply@tasmanescape.com.au")
 *
 * Optional bindings:
 * - CONTACT_RATE (KV namespace) for simple 60s rate limiting per IP
 */

function json(body, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...extraHeaders,
    },
  });
}

function isValidEmail(email) {
  // Simple sanity check (avoid rejecting valid edge cases while blocking obvious junk)
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

async function verifyTurnstile(secret, token, ip) {
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token);
  if (ip) form.append("remoteip", ip);

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: form,
  });

  if (!res.ok) return { success: false };
  return res.json();
}

export async function onRequestPost(context) {
  const { request, env } = context;

  let payload;
  try {
    payload = await request.json();
  } catch {
    return json({ error: "Invalid request." }, 400);
  }

  const name = String(payload?.name || "").trim().slice(0, 120);
  const email = String(payload?.email || "").trim().slice(0, 254);
  const message = String(payload?.message || "").trim().slice(0, 4000);
  const turnstileToken = String(payload?.turnstileToken || "").trim();

  if (!name || !email || !message) {
    return json({ error: "Please complete all fields." }, 400);
  }
  if (!isValidEmail(email)) {
    return json({ error: "Please enter a valid email address." }, 400);
  }
  if (!turnstileToken) {
    return json({ error: "Anti-spam check missing." }, 400);
  }

  const ip = request.headers.get("CF-Connecting-IP") || "";

  // Optional basic rate limiting (60 seconds per IP)
  if (env.CONTACT_RATE && ip) {
    const key = `rl:${ip}`;
    const hit = await env.CONTACT_RATE.get(key);
    if (hit) {
      return json({ error: "Too many requests. Try again in a minute." }, 429);
    }
    await env.CONTACT_RATE.put(key, "1", { expirationTtl: 60 });
  }

  if (!env.TURNSTILE_SECRET_KEY) {
    return json({ error: "Server not configured (Turnstile secret missing)." }, 500);
  }
  if (!env.CONTACT_TO || !env.CONTACT_FROM) {
    return json({ error: "Server not configured (email settings missing)." }, 500);
  }

  const verification = await verifyTurnstile(env.TURNSTILE_SECRET_KEY, turnstileToken, ip);
  if (!verification?.success) {
    return json({ error: "Anti-spam check failed. Please try again." }, 400);
  }

  // Send via MailChannels (recommended for Cloudflare Workers/Pages)
  const ua = request.headers.get("User-Agent") || "";
  const now = new Date().toISOString();

  const emailPayload = {
    personalizations: [{ to: [{ email: env.CONTACT_TO }] }],
    from: { email: env.CONTACT_FROM, name: "Tasman Escape" },
    reply_to: { email, name },
    subject: `Tasman Escape enquiry — ${name}`,
    content: [
      {
        type: "text/plain",
        value:
          `Name: ${name}\n` +
          `Email: ${email}\n\n` +
          `Message:\n${message}\n\n` +
          `---\n` +
          `IP: ${ip}\n` +
          `UA: ${ua}\n` +
          `Time: ${now}\n`,
      },
    ],
  };

  const sendRes = await fetch("https://api.mailchannels.net/tx/v1/send", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(emailPayload),
  });

  if (!sendRes.ok) {
    return json({ error: "Unable to send right now. Please try again later." }, 502);
  }

  return json({ ok: true });
}
