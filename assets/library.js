/* ============================================================
   ALL-ALPHA · Digital Library
   Language, catalogue, navigation and newsletter behaviour
   ============================================================ */
(function () {
  "use strict";

  var STORE = {
    lang: "alpha-library-lang"
  };

  /* ---------- Config ---------- */
  var CONFIG = {
    // Backend endpoint that stores newsletter subscriptions (ALL-ALPHA database).
    newsletterEndpoint: "https://catalisador-alpha-240b44e7.base44.app/functions/registarLeitor",
    // Set to a newsletter service URL (Buttondown, MailerLite, ConvertKit) to also forward the email.
    newsletterForwardUrl: ""
  };

  var META = {
    pt: {
      title: "ALL-ALPHA · Biblioteca Digital — Éric Xavier",
      desc: "Biblioteca digital independente de Éric Xavier. Livros sobre disciplina, identidade, conhecimento e construção de legado. Todas as obras com acesso gratuito.",
      works: function (n) { return n === 1 ? "1 obra" : n + " obras"; }
    },
    en: {
      title: "ALL-ALPHA · Digital Library — Éric Xavier",
      desc: "An independent digital library by Éric Xavier. Books on discipline, identity, knowledge and the building of a legacy. Every work is free to read.",
      works: function (n) { return n === 1 ? "1 work" : n + " works"; }
    }
  };

  var MSG = {
    pt: {
      invalid: "Introduz um email válido.",
      sending: "A registar…",
      success: "Inscrição registada. Ficaste na lista da ALL-ALPHA para novidades editoriais. O envio de emails começa quando a newsletter for activada.",
      error: "Não foi possível registar a inscrição agora. Tenta novamente em instantes."
    },
    en: {
      invalid: "Please enter a valid email address.",
      sending: "Saving…",
      success: "You are on the list. You will hear from ALL-ALPHA about editorial news. Email delivery starts once the newsletter is activated.",
      error: "We could not save your subscription right now. Please try again in a moment."
    }
  };

  var docEl = document.documentElement;
  var lang = "pt";

  /* ---------- Language ---------- */
  function detectLang() {
    var url = new URL(window.location.href);
    var fromUrl = url.searchParams.get("lang");
    if (fromUrl === "pt" || fromUrl === "en") return fromUrl;
    try {
      var saved = localStorage.getItem(STORE.lang);
      if (saved === "pt" || saved === "en") return saved;
    } catch (e) {}
    return (navigator.language || "pt").toLowerCase().indexOf("pt") === 0 ? "pt" : "en";
  }

  function applyLang(next, opts) {
    opts = opts || {};
    lang = next;
    docEl.setAttribute("lang", lang);
    docEl.setAttribute("data-lang", lang);

    document.querySelectorAll("[data-pt]").forEach(function (el) {
      var value = el.getAttribute("data-" + lang);
      if (value === null) return;
      el.innerHTML = value;
    });

    document.querySelectorAll("[data-set-lang]").forEach(function (btn) {
      btn.setAttribute("aria-pressed", btn.getAttribute("data-set-lang") === lang ? "true" : "false");
    });

    document.title = META[lang].title;
    var desc = document.querySelector('meta[name="description"]');
    if (desc) desc.setAttribute("content", META[lang].desc);
    var ogTitle = document.querySelector('meta[property="og:title"]');
    if (ogTitle) ogTitle.setAttribute("content", META[lang].title);
    var ogDesc = document.querySelector('meta[property="og:description"]');
    if (ogDesc) ogDesc.setAttribute("content", META[lang].desc);
    docEl.setAttribute("data-og-locale", lang === "pt" ? "pt_MZ" : "en_US");

    try { localStorage.setItem(STORE.lang, lang); } catch (e) {}

    if (opts.updateUrl !== false) {
      var url = new URL(window.location.href);
      url.searchParams.set("lang", lang);
      history.replaceState(null, "", url.toString());
    }

    updateCount();
    refreshStatus();
  }

  document.addEventListener("click", function (event) {
    var btn = event.target.closest("[data-set-lang]");
    if (!btn) return;
    applyLang(btn.getAttribute("data-set-lang"));
  });

  /* ---------- Catalogue filters ---------- */
  var grid = document.getElementById("grid");
  var cards = grid ? Array.prototype.slice.call(grid.querySelectorAll(".card")) : [];
  var filterButtons = Array.prototype.slice.call(document.querySelectorAll(".filter"));
  var countLabel = document.querySelector("[data-count-label]");
  var currentFilter = "all";

  function visibleCards() {
    return cards.filter(function (c) {
      return currentFilter === "all" || c.getAttribute("data-collection") === currentFilter;
    });
  }

  function updateCount() {
    if (!countLabel) return;
    var n = visibleCards().length;
    countLabel.textContent = META[lang].works(n);
  }

  function setFilter(value, opts) {
    opts = opts || {};
    currentFilter = value;
    cards.forEach(function (card) {
      var match = value === "all" || card.getAttribute("data-collection") === value;
      card.hidden = !match;
      if (match) card.classList.add("is-in");
    });
    filterButtons.forEach(function (btn) {
      btn.setAttribute("aria-pressed", btn.getAttribute("data-filter") === value ? "true" : "false");
    });
    updateCount();
    if (opts.scroll) {
      var target = document.getElementById("biblioteca");
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }

  filterButtons.forEach(function (btn) {
    btn.addEventListener("click", function () {
      setFilter(btn.getAttribute("data-filter"));
    });
  });

  document.querySelectorAll("[data-filter-jump]").forEach(function (link) {
    link.addEventListener("click", function (event) {
      event.preventDefault();
      setFilter(link.getAttribute("data-filter-jump"), { scroll: true });
    });
  });

  /* ---------- Mobile drawer ---------- */
  var burger = document.querySelector(".burger");
  var drawer = document.getElementById("drawer");

  function closeDrawer() {
    if (!drawer || !burger) return;
    drawer.setAttribute("data-open", "false");
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", "Abrir menu");
    document.body.classList.remove("is-locked");
  }

  if (burger && drawer) {
    burger.addEventListener("click", function () {
      var open = burger.getAttribute("aria-expanded") === "true";
      if (open) {
        closeDrawer();
      } else {
        drawer.setAttribute("data-open", "true");
        burger.setAttribute("aria-expanded", "true");
        burger.setAttribute("aria-label", "Fechar menu");
        document.body.classList.add("is-locked");
      }
    });
    drawer.querySelectorAll("a").forEach(function (a) {
      a.addEventListener("click", closeDrawer);
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeDrawer();
    });
    window.addEventListener("resize", function () {
      if (window.innerWidth >= 960) closeDrawer();
    });
  }

  /* ---------- Scroll reveal ---------- */
  var reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var revealEls = Array.prototype.slice.call(document.querySelectorAll("[data-reveal]"));

  if (reduce || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-in"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-in");
          io.unobserve(entry.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Newsletter ---------- */
  var form = document.getElementById("newsForm");
  var email = document.getElementById("newsEmail");
  var status = document.getElementById("newsStatus");
  var submit = document.getElementById("newsSubmit");
  var lastState = null;

  function refreshStatus() {
    if (!status || !lastState) return;
    status.textContent = MSG[lang][lastState];
  }

  function setStatus(state) {
    lastState = state;
    if (!status) return;
    status.setAttribute("data-state", state === "error" ? "error" : state === "success" ? "success" : "info");
    status.textContent = MSG[lang][state];
  }

  function validEmail(value) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);
  }

  if (form) {
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var value = (email.value || "").trim();

      if (!validEmail(value)) {
        email.setAttribute("aria-invalid", "true");
        setStatus("invalid");
        email.focus();
        return;
      }
      email.removeAttribute("aria-invalid");
      setStatus("sending");
      if (submit) submit.disabled = true;

      var payload = {
        email: value,
        origem: "biblioteca-all-alpha",
        pagina: window.location.pathname,
        idioma: lang
      };

      var done = function (ok) {
        if (submit) submit.disabled = false;
        if (ok) {
          setStatus("success");
          form.reset();
        } else {
          setStatus("error");
        }
      };

      if (!CONFIG.newsletterEndpoint) {
        done(false);
        return;
      }

      fetch(CONFIG.newsletterEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          if (!res.ok) throw new Error("HTTP " + res.status);
          return res.json().catch(function () { return {}; });
        })
        .then(function () { done(true); })
        .catch(function () { done(false); });
    });

    email.addEventListener("input", function () {
      email.removeAttribute("aria-invalid");
    });
  }

  /* ---------- Misc ---------- */
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- Boot ---------- */
  applyLang(detectLang(), { updateUrl: false });
  setFilter("all");
})();
