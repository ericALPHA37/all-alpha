/* ALL-ALPHA · métricas da loja e captura de leitores
   Sem cookies. Sem rastreio entre sites. Só contagens e o email que a pessoa escrever. */
(function () {
  'use strict';

  var API_LOJA = 'https://jarvis-os-mobile.pages.dev/api/alpha-os-loja';
  var CHAVE_SESSAO = 'alpha_sessao_v1';

  function lerSessao() {
    try {
      var guardado = localStorage.getItem(CHAVE_SESSAO);
      if (guardado) return JSON.parse(guardado);
    } catch (e) {}
    var novo = {
      id: 's' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8),
      primeira: new Date().toISOString().slice(0, 10)
    };
    try { localStorage.setItem(CHAVE_SESSAO, JSON.stringify(novo)); } catch (e) {}
    return novo;
  }

  var sessao = lerSessao();

  function dispositivo() {
    var l = window.innerWidth || 0;
    if (l < 700) return 'telefone';
    if (l < 1024) return 'tablet';
    return 'computador';
  }

  function volumeDaPagina() {
    var caminho = location.pathname.toLowerCase();
    var achado = caminho.match(/volume-(i{1,3}|1|2|3)|vol(?:ume)?[-_]?([123])/);
    if (achado) {
      var mapa = { i: '1', ii: '2', iii: '3', '1': '1', '2': '2', '3': '3' };
      return mapa[(achado[1] || achado[2] || '').toLowerCase()] || '';
    }
    if (caminho.indexOf('trilogia') > -1) return 'trilogia';
    return '';
  }

  function utm() {
    var p = new URLSearchParams(location.search);
    var partes = ['utm_source', 'utm_medium', 'utm_campaign']
      .map(function (k) { return p.get(k) ? k.replace('utm_', '') + '=' + p.get(k) : ''; })
      .filter(Boolean);
    return partes.join('&').slice(0, 120);
  }

  function enviar(tipo, extra) {
    var dados = {
      tipo: tipo,
      volume: (extra && extra.volume) || volumeDaPagina(),
      pagina: location.pathname.slice(0, 120),
      referrer: document.referrer ? document.referrer.replace(/^https?:\/\//, '').split('/')[0].slice(0, 200) : '',
      dispositivo: dispositivo(),
      sessao: sessao.id,
      utm: utm()
    };
    try {
      fetch(API_LOJA, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(dados),
        keepalive: true
      }).catch(function () {});
    } catch (e) {}
  }

  // 1. visita (uma por página, por sessão)
  var chaveVisita = 'alpha_visita_' + location.pathname;
  var jaVisitou = false;
  try { jaVisitou = sessionStorage.getItem(chaveVisita) === '1'; } catch (e) {}
  if (!jaVisitou) {
    enviar('visita');
    try { sessionStorage.setItem(chaveVisita, '1'); } catch (e) {}
  }

  // 2. descargas e prévias
  document.addEventListener('click', function (ev) {
    var alvo = ev.target;
    while (alvo && alvo.tagName !== 'A') alvo = alvo.parentElement;
    if (!alvo || !alvo.getAttribute) return;
    var href = alvo.getAttribute('href') || '';
    if (/\.(pdf|zip|epub)$/i.test(href) || alvo.hasAttribute('download')) {
      enviar('descarga', { volume: (href.match(/vol(?:ume)?[-_]?([123])/i) || [])[1] || volumeDaPagina() });
    } else if (/downloads\//.test(href)) {
      enviar('previa', { volume: (href.match(/volume-(i{1,3}|[123])/i) || [])[1] || volumeDaPagina() });
    }
  }, true);

  // 3. caixa de captura (só nas páginas de descarga)
  function montarCaptura() {
    var acoes = document.querySelector('.actions');
    if (!acoes || document.getElementById('captura-leitor')) return;

    var caixa = document.createElement('div');
    caixa.id = 'captura-leitor';
    caixa.style.cssText = 'margin-top:26px;padding:18px;border:1px solid #2b2b2b;border-radius:10px;background:#101010';
    caixa.innerHTML =
      '<p style="font-family:\'Space Mono\',monospace;font-size:9px;letter-spacing:2px;color:#D4AF37;margin:0 0 8px">AVISA-ME</p>' +
      '<p style="font-size:15px;color:#A5A5A5;margin:0 0 12px">O livro físico e a mentoria vão abrir. Deixa o email e aviso-te primeiro. Só isso.</p>' +
      '<form id="form-captura" style="display:flex;gap:8px;flex-wrap:wrap">' +
      '<input id="cap-email" type="email" required placeholder="o.teu@email.com" ' +
      'style="flex:1;min-width:190px;min-height:44px;padding:10px 12px;border-radius:7px;border:1px solid #333;background:#080808;color:#F0EDE5;font-family:inherit;font-size:15px">' +
      '<button type="submit" class="btn" style="min-height:44px;padding:10px 18px">QUERO SABER</button>' +
      '</form>' +
      '<p id="cap-estado" style="font-family:\'Space Mono\',monospace;font-size:9px;color:#8B6914;margin:10px 0 0">Sem cookies. Sem partilha com terceiros.</p>';

    acoes.parentNode.insertBefore(caixa, acoes.nextSibling);

    caixa.querySelector('#form-captura').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var campo = caixa.querySelector('#cap-email');
      var estado = caixa.querySelector('#cap-estado');
      var botao = caixa.querySelector('button');
      var email = (campo.value || '').trim();
      if (!email) return;
      botao.disabled = true;
      estado.textContent = 'a registar…';
      fetch(API_LOJA, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipo: 'leitor',
          email: email,
          interesse: 'ambos',
          origem: location.pathname.slice(0, 120)
        })
      }).then(function (r) { return r.json(); }).then(function (d) {
        if (d && d.ok) {
          caixa.querySelector('form').style.display = 'none';
          estado.style.color = '#D4AF37';
          estado.textContent = 'Contigo. Aviso-te quando abrir.';
          enviar('regresso', {});
        } else {
          botao.disabled = false;
          estado.textContent = 'Não passou. Confirma o email.';
        }
      }).catch(function () {
        botao.disabled = false;
        estado.textContent = 'Sem ligação. Tenta outra vez.';
      });
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', montarCaptura);
  } else {
    montarCaptura();
  }
})();
