const CONFIG = {
  bookingUrl: "", // e.g. "https://www.airbnb.com/h/your-listing"
  instagramUrl: "", // e.g. "https://www.instagram.com/yourhandle"
};

const navToggle = document.getElementById("navToggle");
const navMenu = document.getElementById("navMenu");

if (navToggle && navMenu) {
  navToggle.addEventListener("click", () => {
    const open = navMenu.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
    // Toggle an 'open' class on the button itself to animate the hamburger into a cross
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

// Update current year in footer
const yearSpan = document.getElementById("year");
if (yearSpan) {
  yearSpan.textContent = new Date().getFullYear();
}


// Apply config-driven links (keeps hrefs out of the HTML)
const bookingLink = document.getElementById('bookingLink');
if (bookingLink && CONFIG.bookingUrl) bookingLink.href = CONFIG.bookingUrl;

const instagramLink = document.getElementById('instagramLink');
if (instagramLink && CONFIG.instagramUrl) instagramLink.href = CONFIG.instagramUrl;

const igLink = document.getElementById('igLink');
if (igLink && CONFIG.instagramUrl) igLink.href = CONFIG.instagramUrl;
