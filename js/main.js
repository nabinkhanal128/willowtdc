/* ==========================================================================
   Willow Therapy & Development Center — main.js
   Vanilla JS only. Every block guards for the elements it needs, since
   not every page contains every component (header/footer are shared,
   but the slider, accordion, gallery, etc. are page-specific).
   ========================================================================== */
(function () {
  "use strict";

  document.addEventListener("DOMContentLoaded", () => {
    setYear();
    initHeaderScroll();
    initMobileMenu();
    markActiveNavLink();
    initSmoothAnchors();
    initRevealOnScroll();
    initTestimonialSlider();
    initAccordion();
    initGalleryFilter();
    initLightbox();
    initBlogExpand();
    initContactForm();
    initNewsletterForm();
    initBackToTop();
  });

  /* ---------------------------------------------------------- utilities */
  function $(sel, ctx) { return (ctx || document).querySelector(sel); }
  function $all(sel, ctx) { return Array.prototype.slice.call((ctx || document).querySelectorAll(sel)); }

  function setYear() {
    $all("[data-year]").forEach((el) => { el.textContent = new Date().getFullYear(); });
  }

  /* ---------------------------------------------------- sticky header UI */
  function initHeaderScroll() {
    const header = $(".site-header");
    if (!header) return;
    const toggle = () => header.classList.toggle("is-scrolled", window.scrollY > 12);
    toggle();
    window.addEventListener("scroll", toggle, { passive: true });
  }

  /* ------------------------------------------------------- mobile menu */
  function initMobileMenu() {
    const btn = $(".hamburger");
    const menu = $(".mobile-menu");
    if (!btn || !menu) return;

    const closeMenu = () => {
      btn.classList.remove("is-active");
      menu.classList.remove("is-open");
      btn.setAttribute("aria-expanded", "false");
      document.body.style.overflow = "";
    };
    const openMenu = () => {
      btn.classList.add("is-active");
      menu.classList.add("is-open");
      btn.setAttribute("aria-expanded", "true");
      document.body.style.overflow = "hidden";
    };

    btn.addEventListener("click", () => {
      const isOpen = menu.classList.contains("is-open");
      isOpen ? closeMenu() : openMenu();
    });
    $all("a", menu).forEach((a) => a.addEventListener("click", closeMenu));
    document.addEventListener("keydown", (e) => { if (e.key === "Escape") closeMenu(); });
  }

  /* ------------------------------------------------- active nav link */
  function markActiveNavLink() {
    const path = window.location.pathname.split("/").pop() || "index.html";
    $all(".nav-links a, .mobile-menu a").forEach((link) => {
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#")) return;
      const linkPage = href.split("#")[0];
      if (linkPage === path || (path === "" && linkPage === "index.html")) {
        link.setAttribute("aria-current", "page");
      }
    });
  }

  /* ------------------------------------------------ smooth in-page nav */
  function initSmoothAnchors() {
    const headerEl = $(".site-header");
    const offset = () => (headerEl ? headerEl.offsetHeight + 12 : 0);

    $all('a[href*="#"]').forEach((link) => {
      const [page, hash] = link.getAttribute("href").split("#");
      if (!hash) return;
      const onSamePage = page === "" || page === window.location.pathname.split("/").pop();
      if (!onSamePage) return;

      link.addEventListener("click", (e) => {
        const target = document.getElementById(hash);
        if (!target) return;
        e.preventDefault();
        const top = target.getBoundingClientRect().top + window.pageYOffset - offset();
        window.scrollTo({ top, behavior: "smooth" });
        history.pushState(null, "", "#" + hash);
      });
    });

    // land smoothly on a hash present at page load (e.g. arriving from another page)
    if (window.location.hash) {
      const target = document.getElementById(window.location.hash.slice(1));
      if (target) {
        window.setTimeout(() => {
          const top = target.getBoundingClientRect().top + window.pageYOffset - offset();
          window.scrollTo({ top, behavior: "smooth" });
        }, 120);
      }
    }
  }

  /* --------------------------------------------------- reveal on scroll */
  function initRevealOnScroll() {
    const items = $all(".reveal");
    if (!items.length) return;

    if (!("IntersectionObserver" in window)) {
      items.forEach((el) => el.classList.add("is-visible"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    items.forEach((el, i) => {
      el.style.setProperty("--i", i % 8);
      io.observe(el);
    });
  }

  /* ------------------------------------------------- testimonial slider */
  function initTestimonialSlider() {
    const root = $(".slider");
    if (!root) return;
    const track = $(".slider-slides", root);
    const slides = $all(".slide", root);
    const dotsWrap = $(".slider-dots", root);
    const prevBtn = $(".slider-prev", root);
    const nextBtn = $(".slider-next", root);
    if (!track || !slides.length) return;

    let index = 0;
    let timer = null;

    slides.forEach((_, i) => {
      const dot = document.createElement("button");
      dot.type = "button";
      dot.setAttribute("aria-label", "Show testimonial " + (i + 1));
      if (i === 0) dot.classList.add("is-active");
      dot.addEventListener("click", () => goTo(i));
      if (dotsWrap) dotsWrap.appendChild(dot);
    });
    const dots = dotsWrap ? $all("button", dotsWrap) : [];

    function render() {
      track.style.transform = "translateX(-" + index * 100 + "%)";
      dots.forEach((d, i) => d.classList.toggle("is-active", i === index));
    }
    function goTo(i) {
      index = (i + slides.length) % slides.length;
      render();
      restart();
    }
    function next() { goTo(index + 1); }
    function prev() { goTo(index - 1); }
    function restart() {
      if (timer) window.clearInterval(timer);
      timer = window.setInterval(next, 6500);
    }

    if (nextBtn) nextBtn.addEventListener("click", next);
    if (prevBtn) prevBtn.addEventListener("click", prev);
    root.addEventListener("mouseenter", () => { if (timer) window.clearInterval(timer); });
    root.addEventListener("mouseleave", restart);

    // basic touch swipe
    let startX = null;
    track.addEventListener("touchstart", (e) => { startX = e.touches[0].clientX; }, { passive: true });
    track.addEventListener("touchend", (e) => {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      if (Math.abs(dx) > 40) (dx < 0 ? next() : prev());
      startX = null;
    });

    render();
    restart();
  }

  /* ------------------------------------------------------- FAQ accordion */
  function initAccordion() {
    $all(".accordion-item").forEach((item) => {
      const trigger = $(".accordion-trigger", item);
      const panel = $(".accordion-panel", item);
      if (!trigger || !panel) return;

      trigger.addEventListener("click", () => {
        const isOpen = item.classList.contains("is-open");
        // close siblings within the same accordion for a clean single-open feel
        const parent = item.parentElement;
        $all(".accordion-item.is-open", parent).forEach((openItem) => {
          if (openItem !== item) {
            openItem.classList.remove("is-open");
            $(".accordion-panel", openItem).style.maxHeight = null;
            $(".accordion-trigger", openItem).setAttribute("aria-expanded", "false");
          }
        });

        item.classList.toggle("is-open", !isOpen);
        trigger.setAttribute("aria-expanded", String(!isOpen));
        panel.style.maxHeight = !isOpen ? panel.scrollHeight + "px" : null;
      });
    });
  }

  /* ---------------------------------------------------- gallery filter */
  function initGalleryFilter() {
    const filters = $all(".filter-btn");
    const items = $all(".gallery-item");
    if (!filters.length || !items.length) return;

    filters.forEach((btn) => {
      btn.addEventListener("click", () => {
        filters.forEach((b) => b.classList.remove("is-active"));
        btn.classList.add("is-active");
        const cat = btn.getAttribute("data-filter");

        items.forEach((item) => {
          const match = cat === "all" || item.getAttribute("data-category") === cat;
          item.classList.toggle("is-hidden", !match);
        });
      });
    });
  }

  /* ------------------------------------------------------------ lightbox */
  function initLightbox() {
    const items = $all(".gallery-item");
    const lightbox = $(".lightbox");
    if (!items.length || !lightbox) return;

    const img = $(".lightbox-inner img", lightbox);
    const title = $(".lightbox-caption strong", lightbox);
    const desc = $(".lightbox-caption span", lightbox);
    const closeBtn = $(".lightbox-close", lightbox);
    const prevBtn = $(".lightbox-prev", lightbox);
    const nextBtn = $(".lightbox-next", lightbox);

    let visible = [];
    let current = 0;

    function refreshVisible() {
      visible = items.filter((i) => !i.classList.contains("is-hidden"));
    }

    function open(item) {
      refreshVisible();
      current = visible.indexOf(item);
      render();
      lightbox.classList.add("is-open");
      document.body.style.overflow = "hidden";
    }
    function render() {
      const item = visible[current];
      if (!item) return;
      const source = $("img", item);
      img.src = source.src;
      img.alt = source.alt;
      title.textContent = item.getAttribute("data-title") || source.alt;
      desc.textContent = item.getAttribute("data-desc") || "";
    }
    function close() {
      lightbox.classList.remove("is-open");
      document.body.style.overflow = "";
    }
    function step(dir) {
      if (!visible.length) return;
      current = (current + dir + visible.length) % visible.length;
      render();
    }

    items.forEach((item) => item.addEventListener("click", () => open(item)));
    if (closeBtn) closeBtn.addEventListener("click", close);
    if (prevBtn) prevBtn.addEventListener("click", () => step(-1));
    if (nextBtn) nextBtn.addEventListener("click", () => step(1));
    lightbox.addEventListener("click", (e) => { if (e.target === lightbox) close(); });
    document.addEventListener("keydown", (e) => {
      if (!lightbox.classList.contains("is-open")) return;
      if (e.key === "Escape") close();
      if (e.key === "ArrowLeft") step(-1);
      if (e.key === "ArrowRight") step(1);
    });
  }

  /* ------------------------------------------------------ blog "read more" */
  function initBlogExpand() {
    $all("[data-blog-toggle]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const card = btn.closest(".blog-card");
        if (!card) return;
        const full = $(".blog-full", card);
        const excerpt = $(".blog-excerpt", card);
        const isOpen = full.classList.toggle("is-open");
        if (excerpt) excerpt.style.display = isOpen ? "none" : "block";
        btn.textContent = isOpen ? "Show less" : "Read more";
      });
    });
  }

  /* ------------------------------------------------------- contact form */
  /* Submits to Web3Forms (endpoint + access key live on the <form> in
     contact.html). A failed send must never look like a successful one --
     these are real families asking for appointments. */
  function initContactForm() {
    const form = $("#contactForm");
    if (!form) return;

    const success = $("#formSuccess");
    const button = $("#submitButton", form);
    const hint = $("#formHint");
    const FALLBACK = "Something went wrong and your message was not sent. " +
                     "Please try again, or call us on 9851408530.";

    function setHint(text, isError) {
      if (!hint) return;
      hint.textContent = text || "";
      hint.style.color = isError ? "#C9503F" : "";
    }

    /* WhatsApp is a *supplement* to the email, never a replacement: the email
       has already been delivered by the time this link is built. Values must be
       captured BEFORE form.reset(), which wipes every field. */
    const WA_NOTE_LIMIT = 700; // keeps the wa.me URL well inside browser limits

    function updateWhatsappLink(values) {
      const link = $("#whatsappSend");
      if (!link) return;

      const number = (link.dataset.waNumber || "").replace(/\D/g, "");
      if (!number) { link.style.display = "none"; return; }

      const rows = [
        ["Name", values.name],
        ["Child's Age", values.child_age],
        ["Phone", values.phone],
        ["Email", values.email],
        ["Service", values.service]
      ].filter((pair) => pair[1] && String(pair[1]).trim() !== "")
       .map((pair) => pair[0] + ": " + String(pair[1]).trim());

      let note = String(values.message || "").trim();
      if (note.length > WA_NOTE_LIMIT) {
        note = note.slice(0, WA_NOTE_LIMIT) + "... (full message is in our email)";
      }

      const text = [
        "Hello Willow Therapy & Development Center,",
        "I'd like to book a free consultation.",
        "",
        rows.join("\n"),
        "",
        "Message: " + note
      ].join("\n");

      link.href = "https://wa.me/" + number + "?text=" + encodeURIComponent(text);
    }

    /* hCaptcha. The token is single-use and expires after a couple of minutes,
       so it must be reset whenever a send fails -- otherwise a retry replays a
       spent token, is rejected again, and the visitor is stuck for good. */
    function captchaBox() {
      return form.querySelector('textarea[name="h-captcha-response"]');
    }

    function resetCaptcha() {
      if (window.hcaptcha && typeof window.hcaptcha.reset === "function") {
        try { window.hcaptcha.reset(); } catch (err) { /* widget not ready yet */ }
      }
    }

    function validateCaptcha() {
      const wrap = $(".captcha-field", form);
      const box = captchaBox();
      // If the widget never rendered (script blocked, offline), don't lock the
      // visitor out of the form -- Web3Forms still rejects unsolved submissions
      // server-side, which is where the real enforcement lives.
      const ok = !box || box.value.trim() !== "";
      if (wrap) wrap.classList.toggle("has-error", !ok);
      return ok;
    }

    function validate() {
      let valid = true;
      $all("[required]", form).forEach((field) => {
        const wrap = field.closest(".field");
        const filled = field.type === "checkbox" ? field.checked : field.value.trim() !== "";
        const emailOk = field.type !== "email" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(field.value.trim());
        const phoneOk = field.type !== "tel" || field.value.replace(/\D/g, "").length >= 7;
        const ok = filled && emailOk && phoneOk;
        if (wrap) wrap.classList.toggle("has-error", !ok);
        if (!ok) valid = false;
      });
      return valid;
    }

    form.addEventListener("submit", async (e) => {
      e.preventDefault();

      const fieldsOk = validate();
      const captchaOk = validateCaptcha();
      if (!fieldsOk || !captchaOk) {
        showToast(fieldsOk ? "Please complete the robot check." : "Please fill in the highlighted fields.");
        const firstError = $(".has-error input, .has-error textarea, .has-error select", form);
        if (firstError) firstError.focus();
        return;
      }

      button.disabled = true;
      button.textContent = "Sending...";
      setHint("Sending your message...", false);

      const values = Object.fromEntries(new FormData(form).entries());

      try {
        const res = await fetch(form.action, {
          method: "POST",
          headers: { "Content-Type": "application/json", "Accept": "application/json" },
          body: JSON.stringify(values)
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok || !data.success) throw new Error(data.message || "Send failed");

        updateWhatsappLink(values);
        form.reset();
        form.classList.add("is-hidden");
        if (success) success.classList.add("is-visible");
        setHint("", false);
        showToast("Message sent -- thank you!");
      } catch (err) {
        console.error("Contact form send failed:", err);
        resetCaptcha();
        button.disabled = false;
        button.textContent = "Send Message";
        setHint(FALLBACK, true);
        showToast("Message not sent. Please try again.");
      }
    });

    // clear error state as the visitor corrects a field
    $all("input, textarea, select", form).forEach((field) => {
      const clear = () => {
        const wrap = field.closest(".field");
        if (wrap) wrap.classList.remove("has-error");
      };
      field.addEventListener("input", clear);
      field.addEventListener("change", clear);
    });
  }

  /* ------------------------------------------------------ newsletter form */
  function initNewsletterForm() {
    const form = $("#newsletterForm");
    if (!form) return;
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const input = $("input", form);
      if (input && input.value.trim()) {
        showToast("You're on the list — welcome!");
        form.reset();
      }
    });
  }

  /* -------------------------------------------------------- back to top */
  function initBackToTop() {
    const btn = $(".back-to-top");
    if (!btn) return;
    window.addEventListener("scroll", () => {
      btn.classList.toggle("is-visible", window.scrollY > 500);
    }, { passive: true });
    btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: "smooth" }));
  }

  /* -------------------------------------------------------------- toast */
  let toastTimer = null;
  function showToast(message) {
    let toast = $(".toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("is-visible");
    if (toastTimer) window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toast.classList.remove("is-visible"), 3200);
  }
})();
