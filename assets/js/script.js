// Nathan Web Design : comportements du site
(function () {
  "use strict";

  /* Header : fond au scroll */
  var header = document.querySelector(".site-header");
  var backToTop = document.querySelector(".back-to-top");

  function onScroll() {
    var y = window.scrollY || window.pageYOffset;
    if (header) header.classList.toggle("is-scrolled", y > 12);
    if (backToTop) backToTop.classList.toggle("is-visible", y > 600);
  }
  document.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  if (backToTop) {
    backToTop.addEventListener("click", function () {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  }

  /* Menu mobile */
  var toggle = document.querySelector(".nav-toggle");
  var mobileMenu = document.querySelector(".mobile-menu");
  if (toggle && mobileMenu) {
    var closeMenu = function () {
      toggle.classList.remove("is-open");
      mobileMenu.classList.remove("is-open");
      document.body.style.overflow = "";
      toggle.setAttribute("aria-expanded", "false");
    };
    toggle.addEventListener("click", function () {
      var isOpen = mobileMenu.classList.toggle("is-open");
      toggle.classList.toggle("is-open", isOpen);
      toggle.setAttribute("aria-expanded", String(isOpen));
      document.body.style.overflow = isOpen ? "hidden" : "";
    });
    mobileMenu.querySelectorAll("a").forEach(function (link) {
      link.addEventListener("click", closeMenu);
    });
  }

  /* Accordéon FAQ */
  document.querySelectorAll(".faq-item").forEach(function (item) {
    var btn = item.querySelector(".faq-q");
    var answer = item.querySelector(".faq-a");
    if (!btn || !answer) return;
    btn.addEventListener("click", function () {
      var isOpen = item.classList.contains("is-open");
      document.querySelectorAll(".faq-item.is-open").forEach(function (openItem) {
        if (openItem !== item) {
          openItem.classList.remove("is-open");
          openItem.querySelector(".faq-a").style.maxHeight = null;
          openItem.querySelector(".faq-q").setAttribute("aria-expanded", "false");
        }
      });
      item.classList.toggle("is-open", !isOpen);
      btn.setAttribute("aria-expanded", String(!isOpen));
      answer.style.maxHeight = !isOpen ? answer.scrollHeight + "px" : null;
    });
  });

  /* Effet de lumière suivant le curseur sur les cartes de service */
  var reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduceMotion) {
    document.querySelectorAll(".card").forEach(function (card) {
      card.addEventListener("mousemove", function (e) {
        var rect = card.getBoundingClientRect();
        card.style.setProperty("--mx", ((e.clientX - rect.left) / rect.width) * 100 + "%");
        card.style.setProperty("--my", ((e.clientY - rect.top) / rect.height) * 100 + "%");
      });
    });
  }

  /* Révélation en cascade pour les grilles de cartes, la méthode et la FAQ */
  function staggerReveal(itemSelector, groupSelector) {
    document.querySelectorAll(groupSelector).forEach(function (group) {
      var items = group.querySelectorAll(itemSelector);
      items.forEach(function (el, i) {
        el.setAttribute("data-reveal", "");
        el.style.transitionDelay = Math.min(i, 5) * 70 + "ms";
      });
      group.removeAttribute("data-reveal");
    });
  }
  staggerReveal(".card", ".grid.grid-3");
  staggerReveal(".feature", ".grid.grid-2");
  staggerReveal(".tl-item", ".timeline");
  staggerReveal(".faq-item", ".faq-list");

  /* Révélation au scroll */
  var revealEls = document.querySelectorAll("[data-reveal]");
  if ("IntersectionObserver" in window && revealEls.length) {
    var io = new IntersectionObserver(
      function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            io.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.15, rootMargin: "0px 0px -40px 0px" }
    );
    revealEls.forEach(function (el) { io.observe(el); });
  } else {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  }

  /* Questionnaire de contact en 3 étapes (activité -> objectifs -> coordonnées),
     qui ouvre ensuite le client mail avec le message pré-rempli. Aucun serveur
     n'est requis pour cette V1. Pour recevoir les messages directement en base
     de données, brancher ce formulaire plus tard sur un service comme
     Formspree, Netlify Forms ou un back-end dédié. */
  var form = document.querySelector("#contact-form");
  if (form) {
    var steps = Array.prototype.slice.call(form.querySelectorAll(".form-step"));
    var indicators = Array.prototype.slice.call(form.querySelectorAll(".form-progress-step"));
    var sectorInput = form.querySelector("#sector-value");
    var currentStep = 1;

    function goToStep(n) {
      if (n < 1 || n > steps.length) return;
      currentStep = n;
      steps.forEach(function (step) {
        step.classList.toggle("is-active", Number(step.getAttribute("data-step")) === n);
      });
      indicators.forEach(function (ind, i) {
        var stepNum = i + 1;
        ind.classList.toggle("is-active", stepNum === n);
        ind.classList.toggle("is-done", stepNum < n);
      });
      form.scrollIntoView({ behavior: "smooth", block: "start" });
    }

    /* Étape 1 : sélection du secteur (choix unique) */
    var sectorPills = form.querySelectorAll(".option-pill");
    var step1Next = form.querySelector('.form-step[data-step="1"] [data-step-next]');
    sectorPills.forEach(function (pill) {
      pill.addEventListener("click", function () {
        sectorPills.forEach(function (p) { p.classList.remove("is-selected"); });
        pill.classList.add("is-selected");
        if (sectorInput) sectorInput.value = pill.getAttribute("data-sector") || "";
        if (step1Next) step1Next.disabled = false;
      });
    });

    /* Étape 2 : sélection des objectifs (choix multiple), fallback visuel */
    form.querySelectorAll('.option-check input[type="checkbox"]').forEach(function (checkbox) {
      checkbox.addEventListener("change", function () {
        checkbox.closest(".option-check").classList.toggle("is-selected", checkbox.checked);
      });
    });

    /* Navigation entre étapes */
    form.querySelectorAll("[data-step-next]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        if (btn.disabled) return;
        goToStep(currentStep + 1);
      });
    });
    form.querySelectorAll("[data-step-back]").forEach(function (btn) {
      btn.addEventListener("click", function () {
        goToStep(currentStep - 1);
      });
    });

    function resetWizard() {
      sectorPills.forEach(function (p) { p.classList.remove("is-selected"); });
      form.querySelectorAll(".option-check.is-selected").forEach(function (l) {
        l.classList.remove("is-selected");
      });
      if (sectorInput) sectorInput.value = "";
      if (step1Next) step1Next.disabled = true;
      goToStep(1);
    }

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var data = new FormData(form);
      var name = (data.get("name") || "").toString().trim();
      var email = (data.get("email") || "").toString().trim();
      var phone = (data.get("phone") || "").toString().trim();
      var sector = (data.get("sector") || "").toString().trim();
      var goals = data.getAll("goal").map(function (g) { return g.toString(); });
      var message = (data.get("message") || "").toString().trim();

      var dest = form.getAttribute("data-mailto") || "";
      var subject = "Nouvelle demande de projet, " + (name || "site web");
      var bodyLines = [
        "Secteur d'activité : " + (sector || "non renseigné"),
        "Objectifs : " + (goals.length ? goals.join(", ") : "non renseigné"),
        "",
        "Nom : " + name,
        "Email : " + email,
        "Téléphone : " + (phone || "non renseigné"),
        "",
        "Message :",
        (message || "non renseigné")
      ];
      var mailtoUrl =
        "mailto:" + encodeURIComponent(dest) +
        "?subject=" + encodeURIComponent(subject) +
        "&body=" + encodeURIComponent(bodyLines.join("\n"));

      window.location.href = mailtoUrl;

      var success = form.querySelector(".form-success");
      if (success) success.classList.add("is-visible");
      form.reset();
      resetWizard();
    });
  }

  /* Année courante dans le pied de page */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
