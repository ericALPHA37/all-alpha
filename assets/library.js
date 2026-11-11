/* ============================================================
   ALL-ALPHA · Digital Library · Fase 2
   Idioma, catálogo, consentimento, newsletter e contagem de visitas
   ============================================================ */
(function () {
  "use strict";

  var STORE = { lang: "alpha-library-lang", sessao: "alpha-library-sessao" };

  var CONFIG = {
    // Inscrição: grava na base ALL-ALPHA e sincroniza com MailerLite no servidor.
    newsletterEndpoint: "https://catalisador-alpha-240b44e7.base44.app/functions/subscreverNewsletter",
    // Contagem de visitas anónima: sem cookies, sem IP, sem identificação pessoal.
    visitaEndpoint: "https://catalisador-alpha-240b44e7.base44.app/functions/registarEvento",
    versaoConsentimento: "2026-11-09.v1"
  };

  var META = {
    pt: {
      title: "Biblioteca ALL-ALPHA — Éric Xavier",
      desc: "Oito obras disponíveis com acesso gratuito, de Éric Xavier. Livros sobre disciplina, identidade, conhecimento e construção de legado. A trilogia completa está em preparação.",
      available: function (n, p) {
        var base = n === 1 ? "1 obra disponível" : n + " obras disponíveis";
        return p > 0 ? base + " · " + p + " em preparação" : base;
      }
    },
    en: {
      title: "ALL-ALPHA · Digital Library — Éric Xavier",
      desc: "Eight works, free to read, by Éric Xavier. Books on discipline, identity, knowledge and the building of a legacy. The complete trilogy is in preparation.",
      available: function (n, p) {
        var base = n === 1 ? "1 work available" : n + " works available";
        return p > 0 ? base + " · " + p + " in preparation" : base;
      }
    }
  };

  var MSG = {
    pt: {
      invalid: "Introduz um email válido.",
      consent: "Para continuar, confirma que aceitas receber comunicações editoriais.",
      sending: "A registar…",
      success: "Inscrição registada. Passas a receber as novidades editoriais da ALL-ALPHA no teu email.",
      successLocal: "Inscrição registada na base de dados da ALL-ALPHA. A ligação ao serviço de envio será feita assim que estiver activa.",
      error: "Não foi possível registar a inscrição agora. Tenta novamente em instantes.",
      duplicate: "Este email já estava inscrito. Actualizámos os teus dados e manténs-te na lista."
    },
    en: {
      invalid: "Please enter a valid email address.",
      consent: "Please confirm that you agree to receive editorial communications.",
      sending: "Saving…",
      success: "You're subscribed. ALL-ALPHA editorial news will reach you by email.",
      successLocal: "Subscription saved in the ALL-ALPHA database. Sync with the sending service happens as soon as it is connected.",
      error: "We could not save your subscription right now. Please try again in a moment.",
      duplicate: "This email was already subscribed. We updated your details and you remain on the list."
    }
  };

  var docEl = document.documentElement;
  var lang = "pt";

  /* ---------------- Idioma ---------------- */
  function detectLang() {
    var url = new URL(window.location.href);
    var fromUrl = url.searchParams.get("lang");
    if (fromUrl === "pt" || fromUrl === "en") return fromUrl;
    try {
      var saved = localStorage.getItem(STORE.lang);
      if (saved === "pt" || saved === "en") return saved;
    } catch (e) {}
    return "pt";
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

  /* ---------------- Catálogo ---------------- */
  var grid = document.getElementById("grid");
  var cards = grid ? Array.prototype.slice.call(grid.querySelectorAll(".card")) : [];
  var filterButtons = Array.prototype.slice.call(document.querySelectorAll(".filter"));
  var countLabel = document.querySelector("[data-count-label]");
  var currentFilter = "all";

  function inFilter(card) {
    return currentFilter === "all" || card.getAttribute("data-collection") === currentFilter;
  }

  function updateCount() {
    if (!countLabel) return;
    var visiveis = cards.filter(inFilter);
    var disponiveis = visiveis.filter(function (c) { return !c.classList.contains("card--pending"); }).length;
    var pendentes = visiveis.length - disponiveis;
    countLabel.textContent = META[lang].available(disponiveis, pendentes);
  }

  function setFilter(value, opts) {
    opts = opts || {};
    currentFilter = value;
    cards.forEach(function (card) {
      var match = inFilter(card);
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

  /* ---------------- Menu móvel ---------------- */
  var burger = document.querySelector(".burger");
  var drawer = document.getElementById("drawer");

  function closeDrawer() {
    if (!drawer || !burger) return;
    drawer.setAttribute("data-open", "false");
    burger.setAttribute("aria-expanded", "false");
    burger.setAttribute("aria-label", lang === "pt" ? "Abrir menu" : "Open menu");
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
        burger.setAttribute("aria-label", lang === "pt" ? "Fechar menu" : "Close menu");
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

  /* ---------------- Revelação ao scroll ---------------- */
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

  /* ---------------- Newsletter ---------------- */
  var form = document.getElementById("newsForm");
  var email = document.getElementById("newsEmail");
  var consent = document.getElementById("newsConsent");
  var status = document.getElementById("newsStatus");
  var submit = document.getElementById("newsSubmit");
  var lastState = null;

  function refreshStatus() {
    if (!status || !lastState) return;
    var key = lastState;
    status.textContent = MSG[lang][key] || MSG[lang].error;
  }

  function setStatus(state, override) {
    lastState = state;
    if (!status) return;
    status.setAttribute("data-state", state === "error" ? "error" : state === "success" ? "success" : "info");
    status.textContent = override || MSG[lang][state] || MSG[lang].error;
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

      if (consent && !consent.checked) {
        setStatus("consent");
        consent.focus();
        return;
      }

      setStatus("sending");
      if (submit) submit.disabled = true;

      var payload = {
        email: value,
        consentimento: !!(consent && consent.checked),
        versaoConsentimento: CONFIG.versaoConsentimento,
        origem: "biblioteca-all-alpha",
        pagina: window.location.pathname,
        idioma: lang
      };

      fetch(CONFIG.newsletterEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      })
        .then(function (res) {
          return res.json().then(function (data) { return { ok: res.ok, data: data }; });
        })
        .then(function (r) {
          if (submit) submit.disabled = false;
          if (!r.ok || !r.data || r.data.success !== true) {
            setStatus("error");
            return;
          }
          // Só é sucesso quando o servidor confirmou a gravação.
          if (r.data.jaExistia) {
            setStatus("duplicate", MSG[lang].duplicate);
          } else if (r.data.mailerlite === "sincronizado") {
            setStatus("success");
          } else {
            setStatus("successLocal", MSG[lang].successLocal);
          }
          form.reset();
        })
        .catch(function () {
          if (submit) submit.disabled = false;
          setStatus("error");
        });
    });

    email.addEventListener("input", function () {
      email.removeAttribute("aria-invalid");
    });
  }

  /* ---------------- Contagem de visitas ---------------- */
  function registrarVisita() {
    if (!CONFIG.visitaEndpoint) return;
    if (navigator.doNotTrack === "1" || window.doNotTrack === "1") return;
    try {
      var sessao = sessionStorage.getItem(STORE.sessao);
      if (!sessao) {
        sessao = "s-" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
        sessionStorage.setItem(STORE.sessao, sessao);
      }
      var largura = window.innerWidth;
      var params = new URLSearchParams(window.location.search);
      var utm = ["utm_source", "utm_medium", "utm_campaign"]
        .map(function (k) { return params.get(k) ? k + ":" + params.get(k) : ""; })
        .filter(Boolean)
        .join(",");

      var corpo = JSON.stringify({
        tipo: "visita",
        pagina: window.location.pathname,
        idioma: lang,
        referrer: document.referrer ? new URL(document.referrer).hostname : "",
        dispositivo: largura < 720 ? "movel" : largura < 1100 ? "tablet" : "desktop",
        sessao: sessao,
        utm: utm
      });

      fetch(CONFIG.visitaEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: corpo,
        keepalive: true
      }).catch(function () {});
    } catch (e) {}
  }

  /* ---------------- Arranque ---------------- */
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  applyLang(detectLang(), { updateUrl: false });
  setFilter("all");

  if (document.readyState === "complete") {
    registrarVisita();
  } else {
    window.addEventListener("load", registrarVisita);
  }
})();
