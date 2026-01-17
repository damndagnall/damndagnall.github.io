const CONFIG = {
  bookingUrl: "",
  instagramUrl: "https://www.instagram.com/damndagnall/",
  contactEndpoint: "/api/contact",
};

const navToggle = document.getElementById("navToggle");
const navMenu = document.getElementById("navMenu");

if (navToggle && navMenu) {
  navToggle.addEventListener("click", () => {
    const open = navMenu.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    navToggle.classList.toggle("open", open);
  });

  navMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      navMenu.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
      navToggle.classList.remove("open");
    });
  });
}

const yearSpan = document.getElementById("year");
if (yearSpan) yearSpan.textContent = new Date().getFullYear();

// Links
const bookingLink = document.getElementById("bookingLink");
if (bookingLink) {
  if (CONFIG.bookingUrl) {
    bookingLink.href = CONFIG.bookingUrl;
    bookingLink.textContent = "Book on Airbnb";
    bookingLink.removeAttribute("aria-disabled");
    bookingLink.classList.remove("btn-disabled");
  } else {
    bookingLink.href = "#book";
    bookingLink.textContent = "Bookings coming soon";
    bookingLink.setAttribute("aria-disabled", "true");
    bookingLink.classList.add("btn-disabled");
    bookingLink.addEventListener("click", (e) => e.preventDefault());
  }
}

const instagramLink = document.getElementById("instagramLink");
if (instagramLink) {
  instagramLink.href = CONFIG.instagramUrl || "#social";
  instagramLink.textContent = "@damndagnall";
}

const igLink = document.getElementById("igLink");
if (igLink) igLink.href = CONFIG.instagramUrl || "#social";

// Contact form
const form = document.getElementById("contactForm");
const formStatus = document.getElementById("formStatus");

function setStatus(message, isError = false) {
  if (!formStatus) return;
  formStatus.textContent = message;
  formStatus.classList.toggle("error", isError);
  formStatus.classList.toggle("success", !isError);
}

async function submitContact(payload) {
  const res = await fetch(CONFIG.contactEndpoint, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  let data = null;
  try {
    data = await res.json();
  } catch (_) {
    // ignore
  }

  if (!res.ok) {
    const msg = data && data.error ? data.error : "Something went wrong. Please try again.";
    throw new Error(msg);
  }
  return data;
}

if (form) {
  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const btn = form.querySelector("button[type='submit']");
    if (btn) btn.disabled = true;

    const fd = new FormData(form);

    // Honeypot: if filled, likely a bot. Pretend success but do nothing.
    if (String(fd.get("website") || "").trim().length > 0) {
      setStatus("Thanks — we’ll get back to you soon.");
      if (btn) btn.disabled = false;
      form.reset();
      return;
    }

    const payload = {
      name: String(fd.get("name") || "").trim(),
      email: String(fd.get("email") || "").trim(),
      message: String(fd.get("message") || "").trim(),
      turnstileToken: String(fd.get("cf-turnstile-response") || "").trim(),
    };

    if (!payload.turnstileToken) {
      setStatus("Please complete the anti-spam check.", true);
      if (btn) btn.disabled = false;
      return;
    }

    try {
      setStatus("Sending…");
      await submitContact(payload);
      setStatus("Sent. Cheers!");
      form.reset();
      if (typeof turnstile !== "undefined" && turnstile && turnstile.reset) {
        try {
          turnstile.reset();
        } catch (_) {
          // ignore
        }
      }
    } catch (err) {
      setStatus(err.message || "Unable to send right now.", true);
    } finally {
      if (btn) btn.disabled = false;
    }
  });
}
