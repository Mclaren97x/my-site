// The address the contact form sends inquiries to.
const CONTACT_EMAIL = "speedofphotography@gmail.com";

document.getElementById("year").textContent = new Date().getFullYear();

// ---------- Header background on scroll ----------
const header = document.querySelector(".site-header");
const onScroll = () => header.classList.toggle("is-scrolled", window.scrollY > 20);
window.addEventListener("scroll", onScroll, { passive: true });
onScroll();

// ---------- Mobile menu ----------
const toggle = document.querySelector(".nav-toggle");
const links = document.getElementById("nav-links");

function setMenu(open) {
  toggle.setAttribute("aria-expanded", String(open));
  toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  links.classList.toggle("is-open", open);
  header.classList.toggle("menu-open", open);
}
toggle.addEventListener("click", () => setMenu(toggle.getAttribute("aria-expanded") !== "true"));
links.querySelectorAll("a").forEach((a) => a.addEventListener("click", () => setMenu(false)));

// ---------- Gallery filters ----------
const shots = [...document.querySelectorAll(".shot")];
document.querySelectorAll(".filter").forEach((btn) => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".filter").forEach((b) => {
      b.classList.toggle("is-active", b === btn);
      b.setAttribute("aria-selected", String(b === btn));
    });
    const cat = btn.dataset.filter;
    shots.forEach((s) => s.classList.toggle("is-hidden", cat !== "all" && s.dataset.cat !== cat));
  });
});

// ---------- Lightbox ----------
const lightbox = document.getElementById("lightbox");
const lbImg = lightbox.querySelector(".lightbox-img");
const lbCaption = lightbox.querySelector(".lightbox-caption");
let current = 0;

const visibleShots = () => shots.filter((s) => !s.classList.contains("is-hidden"));

function show(index) {
  const list = visibleShots();
  current = (index + list.length) % list.length;
  const shot = list[current];
  const caption = shot.querySelector("figcaption").textContent;
  lbImg.style.backgroundImage = getComputedStyle(shot).backgroundImage;
  lbImg.setAttribute("aria-label", caption);
  lbCaption.textContent = caption;
}

function openLightbox(shot) {
  show(visibleShots().indexOf(shot));
  lightbox.hidden = false;
  document.body.style.overflow = "hidden";
  lightbox.querySelector(".lightbox-close").focus();
}

function closeLightbox() {
  lightbox.hidden = true;
  document.body.style.overflow = "";
  visibleShots()[current]?.focus();
}

shots.forEach((shot) => {
  shot.tabIndex = 0;
  shot.setAttribute("role", "button");
  shot.addEventListener("click", () => openLightbox(shot));
  shot.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openLightbox(shot);
    }
  });
});

lightbox.querySelector(".lightbox-close").addEventListener("click", closeLightbox);
lightbox.querySelector(".lightbox-prev").addEventListener("click", () => show(current - 1));
lightbox.querySelector(".lightbox-next").addEventListener("click", () => show(current + 1));
lightbox.addEventListener("click", (e) => { if (e.target === lightbox) closeLightbox(); });
document.addEventListener("keydown", (e) => {
  if (lightbox.hidden) return;
  if (e.key === "Escape") closeLightbox();
  if (e.key === "ArrowLeft") show(current - 1);
  if (e.key === "ArrowRight") show(current + 1);
});

// ---------- Contact form (opens the visitor's email app) ----------
const form = document.getElementById("contact-form");
form.addEventListener("submit", (e) => {
  e.preventDefault();
  if (!CONTACT_EMAIL) {
    alert("The contact form isn't set up yet. Please reach out on social media for now.");
    return;
  }
  const data = new FormData(form);
  const subject = `Shoot inquiry: ${data.get("type")}${data.get("car") ? " - " + data.get("car") : ""}`;
  const body = [
    `Name: ${data.get("name")}`,
    `Email: ${data.get("email")}`,
    `Car: ${data.get("car")}`,
    `Shoot type: ${data.get("type")}`,
    "",
    data.get("message"),
  ].join("\n");
  window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
});

// ---------- Reveal sections on scroll ----------
const revealTargets = document.querySelectorAll(".section-head, .gallery, .service, .process li, .about-photo, .about-text, .contact-info, .contact-form");
if ("IntersectionObserver" in window) {
  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealTargets.forEach((el) => {
    el.classList.add("reveal");
    io.observe(el);
  });
}
