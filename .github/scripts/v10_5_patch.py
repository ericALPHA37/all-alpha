from pathlib import Path
import re

path = Path('index.html')
html = path.read_text(encoding='utf-8')
original = html

# Version
html = re.sub(
    r'<meta name="all-alpha-version" content="[^"]+">',
    '<meta name="all-alpha-version" content="10.5">',
    html,
    count=1,
)

# Styles: insert once before the first closing style tag.
if '/* V10.5 · CHECKOUT RECOVERY */' not in html:
    v105_css = r'''
/* V10.5 · CHECKOUT RECOVERY */
.form-input.is-invalid{border-color:#c44;box-shadow:0 0 0 1px rgba(204,68,68,.28)}
.form-error{min-height:1.2em;margin-top:6px;color:#ef8a8a;font-family:var(--mono);font-size:9px;letter-spacing:.04em}
.checkout-fallback{display:none;margin-top:16px;padding:16px;border:1px solid rgba(212,175,55,.38);border-radius:9px;background:linear-gradient(135deg,rgba(42,32,0,.48),rgba(17,17,17,.96))}
.checkout-fallback.active{display:block}
.checkout-fallback p{margin-bottom:12px;color:rgba(240,237,229,.82);font-size:15px;line-height:1.55}
.checkout-fallback .btn{width:100%}
#btn-gerar[disabled]{cursor:wait;opacity:.64;transform:none}
.free-access-note{font-family:var(--mono);font-size:9px;color:var(--gold2);margin-top:8px}
'''
    html = html.replace('</style>', v105_css + '\n</style>', 1)

# Volume I: free access must never open paid checkout.
old_vol1 = '<button class="btn secondary" onclick="openModal(\'vol1\')">OBTER VOL. I</button>'
new_vol1 = '<a class="btn secondary" href="downloads/alpha-code-volume-i.html">OBTER VOL. I</a>'
if old_vol1 in html:
    html = html.replace(old_vol1, new_vol1, 1)
elif 'href="downloads/alpha-code-volume-i.html"' not in html:
    raise RuntimeError('Volume I purchase button pattern was not found')

# Accessible inline validation and non-blocking fallback panel.
name_group_old = '<div class="form-group"><label class="form-label" for="input-name">O TEU NOME</label><input class="form-input" id="input-name" placeholder="Ex: João Silva"></div>'
name_group_new = '<div class="form-group"><label class="form-label" for="input-name">O TEU NOME</label><input class="form-input" id="input-name" name="name" autocomplete="name" required placeholder="Ex: João Silva"><div class="form-error" id="name-error" aria-live="polite"></div></div>'
email_group_old = '<div class="form-group"><label class="form-label" for="input-email">O TEU EMAIL</label><input class="form-input" type="email" id="input-email" placeholder="Ex: joao@email.com"></div>'
email_group_new = '<div class="form-group"><label class="form-label" for="input-email">O TEU EMAIL</label><input class="form-input" type="email" id="input-email" name="email" autocomplete="email" required placeholder="Ex: joao@email.com"><div class="form-error" id="email-error" aria-live="polite"></div></div>'
if name_group_old in html:
    html = html.replace(name_group_old, name_group_new, 1)
if email_group_old in html:
    html = html.replace(email_group_old, email_group_new, 1)

old_generate = '<a href="#" class="btn" style="width:100%" id="btn-gerar" onclick="return gerarReferencia()">GERAR REFERÊNCIA →</a>'
new_generate = '<button type="button" class="btn" style="width:100%" id="btn-gerar" onclick="return gerarReferencia()">GERAR REFERÊNCIA →</button>'
if old_generate in html:
    html = html.replace(old_generate, new_generate, 1)

fallback_markup = '''<div class="checkout-fallback" id="checkout-fallback" role="status" aria-live="polite">
<p>Neste momento não conseguimos gerar a referência automaticamente. Podes concluir a encomenda directamente pelo WhatsApp.</p>
<a class="btn secondary" id="btn-whatsapp-fallback" href="#" target="_blank" rel="noopener">CONTINUAR PELO WHATSAPP</a>
</div>'''
if 'id="checkout-fallback"' not in html:
    marker = '<div class="modal-note">O nome e o e-mail são enviados para gerar a referência e preparar a confirmação da encomenda.</div>'
    if marker not in html:
        raise RuntimeError('Modal note insertion point was not found')
    html = html.replace(marker, fallback_markup + '\n' + marker, 1)

checkout_script = r'''<script>
// V10.5 · CHECKOUT RECOVERY
let selectedProduct={};
const USD_TO_MZN_RATE=64.5;
const REGISTAR_VENDA_URL='https://catalisador-alpha-240b44e7.base44.app/functions/registarVendaLivro';
const WHATSAPP_NUMBER='258843895232';
const PRODUCT_CATALOG={
 vol1:{name:'ALPHA CODE Vol.1 — O Manual do Indivíduo Indomável',title:'O Manual do Indivíduo Indomável',priceUsd:0,priceLabel:'GRÁTIS'},
 vol2:{name:'ALPHA CODE Vol.2 — O Despertar do Homem Indomável',title:'O Despertar do Homem Indomável',priceUsd:18},
 vol3:{name:'ALPHA CODE Vol.3 — A Morte do Génio e a Disciplina do Operário',title:'A Morte do Génio e a Disciplina do Operário',priceUsd:22},
 trilogy:{name:'ALPHA CODE — Trilogia Completa',title:'Trilogia Completa',priceUsd:39}
};
function formatMzn(value){return `${String(Math.round(value)).replace(/\B(?=(\d{3})+(?!\d))/g,'.')} MZN`}
function formatUsd(value){return Number(value)===0?'GRÁTIS':`$${value} USD`}
function getMznFromUsd(usd){return Math.round(Number(usd)*USD_TO_MZN_RATE)}
function getField(id){return document.getElementById(id)}
function clearFieldError(inputId,errorId){const input=getField(inputId);const error=getField(errorId);if(input)input.classList.remove('is-invalid');if(error)error.textContent=''}
function setFieldError(inputId,errorId,message){const input=getField(inputId);const error=getField(errorId);if(input){input.classList.add('is-invalid');input.focus()}if(error)error.textContent=message}
function hideCheckoutFallback(){const box=getField('checkout-fallback');if(box)box.classList.remove('active')}
function createProvisionalReference(){
 const bytes=new Uint8Array(4);
 crypto.getRandomValues(bytes);
 const suffix=Array.from(bytes,b=>b.toString(16).padStart(2,'0')).join('').toUpperCase();
 const stamp=new Date().toISOString().replace(/[-:TZ.]/g,'').slice(0,14);
 return `ALPHA-PENDENTE-${stamp}-${suffix}`;
}
function buildWhatsAppMessage({reference,name,email,product,usd,mzn,automatic=true}){
 const lines=[
  automatic?'Olá! Fiz o pagamento da encomenda.':'Olá! Quero concluir uma encomenda. A geração automática de referência estava temporariamente indisponível.',
  `Referência ${automatic?'oficial':'provisória'}: ${reference}`,
  `Nome: ${name}`,
  `Email: ${email}`,
  `Produto: ${product.name}`,
  `Título: ${product.title}`,
  `Valor: ${formatUsd(usd)} · ${formatMzn(mzn)}`,
  automatic?'Segue o comprovativo em anexo.':'Peço confirmação dos dados de pagamento e registo manual da encomenda.'
 ];
 return encodeURIComponent(lines.join('\n'));
}
function showCheckoutFallback(name,email,reason){
 const box=getField('checkout-fallback');
 const link=getField('btn-whatsapp-fallback');
 if(!box||!link)return;
 const reference=createProvisionalReference();
 const usd=Number(selectedProduct.priceUsd);
 const mzn=getMznFromUsd(usd);
 link.href=`https://wa.me/${WHATSAPP_NUMBER}?text=${buildWhatsAppMessage({reference,name,email,product:selectedProduct,usd,mzn,automatic:false})}`;
 box.classList.add('active');
 console.warn('[ALL-ALPHA checkout] automatic reference unavailable; manual fallback enabled.',{category:reason||'unknown'});
}
function openModal(productKey){
 const product=PRODUCT_CATALOG[productKey];
 if(!product)return false;
 if(productKey==='vol1'||Number(product.priceUsd)===0){window.location.href='downloads/alpha-code-volume-i.html';return false}
 selectedProduct={...product,key:productKey,price:formatUsd(product.priceUsd),mzn:getMznFromUsd(product.priceUsd)};
 getField('modal-name').textContent=selectedProduct.name;
 getField('modal-price').textContent=`${selectedProduct.price} · ${formatMzn(selectedProduct.mzn)}`;
 getField('step-form').classList.add('active');
 getField('step-payment').classList.remove('active');
 getField('modal').classList.add('active');
 document.body.classList.add('modal-open');
 hideCheckoutFallback();
 clearFieldError('input-name','name-error');
 clearFieldError('input-email','email-error');
 return false;
}
function closeModal(){getField('modal').classList.remove('active');document.body.classList.remove('modal-open');hideCheckoutFallback()}
function classifyCheckoutError(error){
 if(error&&error.name==='AbortError')return'timeout';
 if(error&&error.code)return error.code;
 if(error instanceof TypeError)return'network-or-cors';
 return'unknown';
}
async function gerarReferencia(){
 const nameInput=getField('input-name');
 const emailInput=getField('input-email');
 const name=nameInput.value.trim();
 const email=emailInput.value.trim();
 const btn=getField('btn-gerar');
 clearFieldError('input-name','name-error');
 clearFieldError('input-email','email-error');
 hideCheckoutFallback();
 if(!name){setFieldError('input-name','name-error','Introduz o teu nome.');return false}
 if(!emailInput.checkValidity()){setFieldError('input-email','email-error','Introduz um endereço de e-mail válido.');return false}
 if(!selectedProduct.key||Number(selectedProduct.priceUsd)<=0){window.location.href='downloads/alpha-code-volume-i.html';return false}
 btn.disabled=true;
 btn.textContent='A GERAR REFERÊNCIA...';
 const controller=new AbortController();
 const timer=window.setTimeout(()=>controller.abort(),12000);
 try{
  const res=await fetch(REGISTAR_VENDA_URL,{method:'POST',headers:{'Content-Type':'application/json','Accept':'application/json'},signal:controller.signal,body:JSON.stringify({nome:name,email:email,produto:selectedProduct.name,valor_usd:selectedProduct.priceUsd})});
  const contentType=(res.headers.get('content-type')||'').toLowerCase();
  const raw=await res.text();
  if(!res.ok){const err=new Error(`HTTP ${res.status}`);err.code=`http-${res.status}`;throw err}
  if(!contentType.includes('application/json')){const err=new Error('Resposta não JSON');err.code='non-json';throw err}
  let data;
  try{data=JSON.parse(raw)}catch(parseError){const err=new Error('JSON inválido');err.code='invalid-json';throw err}
  if(data.success!==true){const err=new Error('Backend recusou a operação');err.code='success-false';throw err}
  if(typeof data.referencia!=='string'||!data.referencia.trim()){const err=new Error('Referência ausente');err.code='missing-reference';throw err}
  const valorUsd=Number(data.valor_usd);
  if(!Number.isFinite(valorUsd)||valorUsd!==Number(selectedProduct.priceUsd)){const err=new Error('Valor inválido');err.code='invalid-value';throw err}
  const referencia=data.referencia.trim();
  const valorMzn=getMznFromUsd(valorUsd);
  getField('ref-code').textContent=referencia;
  getField('ref-amount').textContent=`${formatUsd(valorUsd)} · ${formatMzn(valorMzn)}`;
  getField('btn-whatsapp').href=`https://wa.me/${WHATSAPP_NUMBER}?text=${buildWhatsAppMessage({reference:referencia,name,email,product:selectedProduct,usd:valorUsd,mzn:valorMzn,automatic:true})}`;
  getField('step-form').classList.remove('active');
  getField('step-payment').classList.add('active');
 }catch(error){
  showCheckoutFallback(name,email,classifyCheckoutError(error));
 }finally{
  window.clearTimeout(timer);
  btn.disabled=false;
  btn.textContent='GERAR REFERÊNCIA →';
 }
 return false;
}
getField('modal').addEventListener('click',function(e){if(e.target===this)closeModal()});
document.addEventListener('keydown',function(e){if(e.key==='Escape')closeModal()});
</script>'''

if '// V10.5 · CHECKOUT RECOVERY' not in html:
    pattern = re.compile(r'<script>\s*let selectedProduct=\{\};.*?</script>', re.S)
    html, replacements = pattern.subn(checkout_script, html, count=1)
    if replacements != 1:
        raise RuntimeError(f'Expected to replace one checkout script, replaced {replacements}')

if '<!-- V10.5 · CHECKOUT RECOVERY -->' not in html:
    html = html.replace('<body id="top">', '<body id="top">\n<!-- V10.5 · CHECKOUT RECOVERY -->', 1)

required = [
    'content="10.5"',
    'V10.5 · CHECKOUT RECOVERY',
    'downloads/alpha-code-volume-i.html',
    'CONTINUAR PELO WHATSAPP',
    'AbortController',
    'emailInput.checkValidity()',
]
for token in required:
    if token not in html:
        raise RuntimeError(f'Missing required token after patch: {token}')

if html == original:
    print('V10.5 checkout recovery already applied; no changes needed')
else:
    path.write_text(html, encoding='utf-8')
    print('V10.5 checkout recovery patch applied successfully')
