// Shared by every page; sections that aren't on the current page are skipped.
const form = document.getElementById("contact-form");
// The address the contact form sends inquiries to (set in the content file, read from the form).
const CONTACT_EMAIL = form ? form.dataset.email : "";
// FormSubmit (formsubmit.co) emails each booking to CONTACT_EMAIL. No account needed:
// the very first submission sends an "Activate" email to that inbox, which must be clicked once.
const FORM_ENDPOINT = `https://formsubmit.co/ajax/${CONTACT_EMAIL}`;

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
if (lightbox) {
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
}

// ---------- Old links to the home page's booking section now go to the Packages page ----------
if (!form && location.hash === "#contact") {
  location.replace(document.querySelector(".logo").getAttribute("href") + "packages/#book");
}

// ---------- Contact form (emails each booking to CONTACT_EMAIL) ----------
if (form) {
// "Book this package" links arrive as /?package=Name#contact: preselect that shoot type.
const requested = new URLSearchParams(location.search).get("package");
if (requested) {
  const opt = [...form.type.options].find((o) => o.value.toLowerCase() === requested.toLowerCase());
  if (opt) form.type.value = opt.value;
}

// "Book this package" buttons on the same page: pick the package and scroll down without reloading.
document.querySelectorAll("[data-package]").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    const opt = [...form.type.options].find((o) => o.value.toLowerCase() === btn.dataset.package.toLowerCase());
    if (!opt) return; // let the link navigate normally
    e.preventDefault();
    form.type.value = opt.value;
    history.replaceState(null, "", btn.getAttribute("href"));
    document.getElementById("book").scrollIntoView({ behavior: "smooth" });
    setTimeout(() => form.name.focus({ preventScroll: true }), 600);
  });
});

const submitBtn = form.querySelector('button[type="submit"]');
const statusEl = document.getElementById("form-status");

function setStatus(kind, html) {
  statusEl.className = `form-status is-${kind}`;
  statusEl.innerHTML = html;
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const data = new FormData(form);
  if (data.get("_honey")) return; // filled in by spam bots only

  const subject = `New shoot booking: ${data.get("type")}${data.get("car") ? " - " + data.get("car") : ""}`;
  const payload = {
    name: data.get("name"),
    email: data.get("email"),
    car: data.get("car") || "Not given",
    shoot_type: data.get("type"),
    add_ons: data.getAll("addons").join(", ") || "None",
    details: data.get("message") || "None",
    _subject: subject,
    _template: "table",
    _replyto: data.get("email"),
  };

  submitBtn.disabled = true;
  submitBtn.textContent = "Sending...";
  setStatus("pending", "");

  try {
    const res = await fetch(FORM_ENDPOINT, {
      method: "POST",
      // FormSubmit treats each referring page address as a separate form needing activation.
      // Sending only the site origin keeps one activation valid for every page, query string or hash.
      referrerPolicy: "origin",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(payload),
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok || String(result.success) === "false") throw new Error(result.message || res.statusText);
    form.reset();
    setStatus("success", "Thanks! Your booking request was sent. I'll get back to you soon.");
  } catch (err) {
    const body = Object.entries(payload)
      .filter(([k]) => !k.startsWith("_"))
      .map(([k, v]) => `${k.replace("_", " ")}: ${v}`)
      .join("\n");
    const mailto = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    setStatus("error", `Sorry, that didn't go through. Please <a href="${mailto}">email me directly</a> instead.`);
  } finally {
    submitBtn.disabled = false;
    submitBtn.textContent = submitBtn.dataset.label;
  }
});
}

// ---------- Reveal sections on scroll ----------
const revealTargets = document.querySelectorAll(".section-head, .gallery, .service, .process li, .about-photo, .about-text, .contact-info, .contact-form, .package, .addon, .notes");
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
