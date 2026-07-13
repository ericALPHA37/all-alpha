(function(){
  const finePointer = window.matchMedia && window.matchMedia('(hover:hover) and (pointer:fine)').matches;
  const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const cursor = document.querySelector('.alpha-cursor');

  if(cursor && finePointer && !reduceMotion){
    let x = -100, y = -100, tx = x, ty = y, raf = 0;
    document.body.classList.add('cursor-ready');
    window.addEventListener('mousemove', event => {
      tx = event.clientX + 10;
      ty = event.clientY + 10;
      if(!raf) raf = requestAnimationFrame(move);
    }, {passive:true});
    function move(){
      x += (tx - x) * .22;
      y += (ty - y) * .22;
      cursor.style.transform = `translate3d(${x}px,${y}px,0)`;
      if(Math.abs(tx - x) > .2 || Math.abs(ty - y) > .2){
        raf = requestAnimationFrame(move);
      } else {
        raf = 0;
      }
    }
  }

  const reveal = document.getElementById('revealBox');
  document.querySelectorAll('[data-preview-choice]').forEach(button => {
    button.addEventListener('click', () => {
      document.querySelectorAll('[data-preview-choice]').forEach(item => item.setAttribute('aria-pressed','false'));
      button.setAttribute('aria-pressed','true');
      if(reveal) reveal.textContent = button.dataset.previewChoice;
    });
  });

  const dossierForm = document.getElementById('dossierForm');
  if(dossierForm){
    const key = 'all_alpha_dossie_preview';
    const name = document.getElementById('warName');
    const turning = document.getElementById('turningPoint');
    const status = document.getElementById('saveStatus');
    try{
      const saved = JSON.parse(localStorage.getItem(key) || '{}');
      if(saved.name) name.value = saved.name;
      if(saved.turning) turning.value = saved.turning;
    }catch(err){}
    dossierForm.addEventListener('submit', event => {
      event.preventDefault();
      try{
        localStorage.setItem(key, JSON.stringify({name:name.value.trim(), turning:turning.value.trim(), savedAt:new Date().toISOString()}));
        status.textContent = 'Pré-visualização guardada neste navegador.';
      }catch(err){
        status.textContent = 'Não foi possível guardar neste navegador.';
      }
    });
  }
})();
