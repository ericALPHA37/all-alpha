/* ==========================================================================
   ALL-ALPHA — Biblioteca Digital
   Comportamento: idioma, filtros, menu, revelação, inscrição de leitores.
   Sem dependências externas. Sem cookies.
   ========================================================================== */
(function () {
  "use strict";

  var DIC = window.ALPHA_I18N || { pt: {}, en: {} };
  var CHAVE_IDIOMA = "alpha_idioma";
  var ENDPOINT = "https://jarvis-os-mobile.pages.dev/api/alpha-os-loja";
  var idiomaAtual = "pt";

  /* --- idioma ------------------------------------------------------------ */

  function texto(chave) {
    var tabela = DIC[idiomaAtual] || DIC.pt;
    return tabela[chave] !== undefined ? tabela[chave] : (DIC.pt && DIC.pt[chave]);
  }

  function aplicarIdioma(lang) {
    idiomaAtual = (lang === "en") ? "en" : "pt";
    var t = DIC[idiomaAtual];

    document.documentElement.lang = t["html_lang"] || idiomaAtual;
    document.title = t["title"] || document.title;

    var desc = document.querySelector('meta[name="description"]');
    if (desc && t["desc"]) desc.setAttribute("content", t["desc"]);

    Array.prototype.forEach.call(document.querySelectorAll("[data-i18n]"), function (el) {
      var valor = t[el.getAttribute("data-i18n")];
      if (valor !== undefined) el.innerHTML = valor;
    });

    Array.prototype.forEach.call(document.querySelectorAll("[data-i18n-placeholder]"), function (el) {
      var valor = t[el.getAttribute("data-i18n-placeholder")];
      if (valor !== undefined) el.setAttribute("placeholder", valor);
    });

    Array.prototype.forEach.call(document.querySelectorAll("[data-i18n-aria]"), function (el) {
      var valor = t[el.getAttribute("data-i18n-aria")];
      if (valor !== undefined) el.setAttribute("aria-label", valor);
    });

    Array.prototype.forEach.call(document.querySelectorAll("[data-lang]"), function (el) {
      el.setAttribute("aria-pressed", el.getAttribute("data-lang") === idiomaAtual ? "true" : "false");
    });

    Array.prototype.forEach.call(document.querySelectorAll(".obra img"), function (img) {
      var artigo = img.closest(".obra");
      if (!artigo) return;
      var chave = "obra." + (artigo.getAttribute("data-obra") || "") + ".alt";
      var alt = t[chave];
      if (alt) img.setAttribute("alt", alt);
    });

    try { localStorage.setItem(CHAVE_IDIOMA, idiomaAtual); } catch (e) {}
  }

  var botaoIdioma = document.getElementById("lang-toggle");
  if (botaoIdioma) {
    botaoIdioma.addEventListener("click", function () {
      aplicarIdioma(idiomaAtual === "pt" ? "en" : "pt");
    });
  }

  var daUrl = null;
  try { daUrl = new URLSearchParams(location.search).get("lang"); } catch (e) {}
  var guardado = null;
  try { guardado = localStorage.getItem(CHAVE_IDIOMA); } catch (e) {}
  var inicial = (daUrl === "en" || daUrl === "pt") ? daUrl : (guardado === "en" ? "en" : "pt");
  aplicarIdioma(inicial);

  /* --- menu mobile -------------------------------------------------------- */

  var menuBtn = document.getElementById("menu-toggle");
  var nav = document.getElementById("nav-principal");

  function fecharMenu() {
    if (!nav || !menuBtn) return;
    nav.setAttribute("data-aberto", "false");
    menuBtn.setAttribute("aria-expanded", "false");
  }

  if (menuBtn && nav) {
    menuBtn.addEventListener("click", function () {
      var aberto = nav.getAttribute("data-aberto") === "true";
      nav.setAttribute("data-aberto", aberto ? "false" : "true");
      menuBtn.setAttribute("aria-expanded", aberto ? "false" : "true");
    });
    Array.prototype.forEach.call(nav.querySelectorAll("a"), function (a) {
      a.addEventListener("click", fecharMenu);
    });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape") fecharMenu();
    });
  }

  /* --- filtros ------------------------------------------------------------ */

  var filtros = document.querySelectorAll("[data-filtro]");
  var obras = document.querySelectorAll(".obra");

  Array.prototype.forEach.call(filtros, function (botao) {
    botao.addEventListener("click", function () {
      var alvo = botao.getAttribute("data-filtro");

      Array.prototype.forEach.call(filtros, function (b) {
        b.setAttribute("aria-pressed", b === botao ? "true" : "false");
      });

      Array.prototype.forEach.call(obras, function (obra) {
        var mostra = alvo === "todas" || obra.getAttribute("data-colecao") === alvo;
        obra.hidden = !mostra;
      });
    });
  });

  /* --- revelação discreta ------------------------------------------------- */

  var alvos = document.querySelectorAll(".reveal");
  if ("IntersectionObserver" in window) {
    var observador = new IntersectionObserver(function (entradas) {
      entradas.forEach(function (entrada) {
        if (entrada.isIntersecting) {
          entrada.target.classList.add("visivel");
          observador.unobserve(entrada.target);
        }
      });
    }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });

    Array.prototype.forEach.call(alvos, function (el) { observador.observe(el); });
  } else {
    Array.prototype.forEach.call(alvos, function (el) { el.classList.add("visivel"); });
  }

  /* --- inscrição de leitores ---------------------------------------------- */

  var form = document.getElementById("form-comunidade");
  var estado = document.getElementById("estado-form");

  function dizer(chave, tom) {
    if (!estado) return;
    estado.setAttribute("data-i18n", chave);
    estado.textContent = texto(chave) || "";
    if (tom) estado.setAttribute("data-tom", tom);
    else estado.removeAttribute("data-tom");
  }

  if (form) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var campo = document.getElementById("email-leitor");
      var botao = form.querySelector("button[type=submit]");
      var email = (campo && campo.value ? campo.value : "").trim();

      if (!email || !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/i.test(email)) {
        dizer("news.estado.email", "erro");
        if (campo) campo.focus();
        return;
      }

      dizer("news.estado.a_enviar");
      if (botao) botao.disabled = true;

      fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: "leitor",
          email: email,
          interesse: "ambos",
          origem: location.pathname
        })
      })
        .then(function (r) { return r.json(); })
        .then(function (d) {
          if (d && d.ok) {
            dizer("news.estado.ok", "ok");
            form.reset();
          } else if (d && d.error === "email-invalido") {
            dizer("news.estado.email", "erro");
          } else {
            dizer("news.estado.rede", "erro");
          }
        })
        .catch(function () {
          dizer("news.estado.rede", "erro");
        })
        .then(function () {
          if (botao) botao.disabled = false;
        });
    });
  }

  /* --- ano do rodapé (se existir) ----------------------------------------- */

  var ano = document.querySelector("[data-ano]");
  if (ano) ano.textContent = String(new Date().getFullYear());

  aplicarIdioma(idiomaAtual);
})();
