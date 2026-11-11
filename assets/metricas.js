/* ============================================================
   ALL-ALPHA · medição própria da biblioteca
   Visitas, abertura de obra, leitura e descargas.
   Sem cookies. Sem IP. Sem partilha com terceiros.
   Respeita o Do Not Track do navegador.
   ============================================================ */
(function () {
  "use strict";

  var ENDPOINT = "https://catalisador-alpha-240b44e7.base44.app/functions/registarEvento";
  var CHAVE_SESSAO = "alpha-sessao-medicao";

  if (navigator.doNotTrack === "1" || window.doNotTrack === "1" ||
      navigator.globalPrivacyControl === true) return;

  /* ---------- sessão (memória do separador, não cookie) ---------- */
  var sessao = "";
  try {
    sessao = sessionStorage.getItem(CHAVE_SESSAO) || "";
    if (!sessao) {
      sessao = "s-" + Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
      sessionStorage.setItem(CHAVE_SESSAO, sessao);
    }
  } catch (e) {
    sessao = "s-anon" + Date.now().toString(36);
  }

  /* ---------- identificação da obra a partir do caminho ---------- */
  var caminho = location.pathname;
  function obraDoCaminho() {
    var m = caminho.match(/\/library\/books\/([a-z0-9-]+)\/?/i);
    if (m) return m[1].toLowerCase();
    if (/\/experiences\/elysha\//i.test(caminho)) return "a-princesa-elysha";
    if (/\/library\/?$/i.test(caminho)) return "biblioteca";
    if (/^\/all-alpha\/?$/.test(caminho) || caminho === "/") return "catalogo";
    return "";
  }
  function volumeDoCaminho() {
    var m = caminho.match(/vol(?:ume)?[-_]?(1|2|3)/i);
    return m ? m[1] : "";
  }

  var obra = (document.body && document.body.getAttribute("data-obra")) || obraDoCaminho();
  var volume = volumeDoCaminho();
  var idioma = (document.documentElement.lang || "pt").slice(0, 2).toLowerCase();

  function dispositivo() {
    var l = window.innerWidth || 0;
    return l < 720 ? "movel" : l < 1100 ? "tablet" : "desktop";
  }

  function utm() {
    try {
      var p = new URLSearchParams(location.search);
      return ["utm_source", "utm_medium", "utm_campaign"]
        .map(function (k) { return p.get(k) ? k.replace("utm_", "") + "=" + p.get(k).slice(0, 40) : ""; })
        .filter(Boolean).join(",").slice(0, 140);
    } catch (e) { return ""; }
  }

  function host(valor) {
    try { return valor ? new URL(valor).hostname : ""; } catch (e) { return ""; }
  }

  function enviar(tipo, detalhe, obraForcada) {
    var corpo = JSON.stringify({
      tipo: tipo,
      pagina: caminho.slice(0, 140),
      obra: (obraForcada || obra || "").slice(0, 60),
      volume: volume,
      idioma: idioma,
      referrer: host(document.referrer).slice(0, 200),
      dispositivo: dispositivo(),
      sessao: sessao,
      utm: utm(),
      detalhe: (detalhe || "").slice(0, 60)
    });
    try {
      fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: corpo,
        keepalive: true,
        mode: "cors"
      }).catch(function () {});
    } catch (e) {}
  }

  /* ---------- 1. visita (uma por página, por sessão) ---------- */
  function umaVez(chave) {
    try {
      if (sessionStorage.getItem(chave) === "1") return false;
      sessionStorage.setItem(chave, "1");
      return true;
    } catch (e) { return true; }
  }

  if (umaVez("alpha-visita:" + caminho)) enviar("visita", "");

  /* ---------- 2. abertura de obra (páginas de livro) ---------- */
  var ehPaginaDeLivro = /\/library\/books\/|\/experiences\/elysha\//i.test(caminho);
  if (ehPaginaDeLivro && umaVez("alpha-obra:" + caminho)) {
    enviar("obra", "abertura");
  }

  /* ---------- 3. leitura efectiva (30s com a página visível) ---------- */
  if (ehPaginaDeLivro) {
    var segundos = 0;
    var marcado = false;
    setInterval(function () {
      if (document.hidden) return;
      segundos += 5;
      if (!marcado && segundos >= 30 && umaVez("alpha-leitura:" + caminho)) {
        marcado = true;
        enviar("leitura", "30s");
      }
      if (segundos >= 180 && umaVez("alpha-leitura-longa:" + caminho)) {
        enviar("leitura", "180s");
      }
    }, 5000);
  }

  /* ---------- 4. descargas (PDF, EPUB, ZIP) ---------- */
  document.addEventListener("click", function (ev) {
    var alvo = ev.target;
    while (alvo && alvo.tagName !== "A") alvo = alvo.parentElement;
    if (!alvo || !alvo.getAttribute) return;
    var href = alvo.getAttribute("href") || "";
    if (!/\.(pdf|epub|zip|mobi)(\?|#|$)/i.test(href)) return;
    var nome = href.split("/").pop().split("?")[0].split("#")[0].toLowerCase().slice(0, 60);
    var ficheiro = nome.replace(/\.(pdf|epub|zip|mobi)$/, "");
    // Numa página de obra, a obra é a da página; no catálogo, é o ficheiro clicado.
    var alvoObra = ehPaginaDeLivro ? obra : ficheiro;
    enviar("descarga", (alvo.hasAttribute("download") ? "ficheiro:" : "abrir:") + ficheiro, alvoObra);
  }, true);

})();
