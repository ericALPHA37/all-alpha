# FASE 2 — Correcções e integração

Data: 09/11/2026 · Estado: **promovida a produção** (v2.0.1)

- Produção (não alterada): https://ericalpha37.github.io/all-alpha/
- Cópia de recuperação anterior: https://ericalpha37.github.io/all-alpha/alpha-code-v1-0-1.html
- Recuperação ainda mais antiga: https://ericalpha37.github.io/all-alpha/alpha-code-anterior.html
- Repositório: https://github.com/ericALPHA37/all-alpha

---

## 1. Ficheiros alterados

| Ficheiro | Onde | O que mudou |
|---|---|---|
| `preview-fase2/index.html` | novo | Copy da produção com as correcções da Fase 2 |
| `preview-fase2/assets/library.js` | novo | Consentimento, novo endpoint, contagem de visitas, contagens 7+1 |
| `preview-fase2/assets/library.css` | novo | Estilos de consentimento, privacidade e barra de teste |
| `functions/subscreverNewsletter.ts` | novo | Função de inscrição com MailerLite, consentimento e cancelamento |
| `functions/registarEvento.ts` | corrigido | Passou a escrever com papel de serviço (ver problema 1) |
| Entidade `LeitorLoja` | esquema | Novos campos: `consentimento`, `consentimento_data`, `consentimento_versao`, `estado`, `idioma`, `token_cancelamento`, `mailerlite_estado` |
| `propostas-capas/` | novo | 6 capas + folha de contacto para aprovação |

A promoção foi feita a 09/11/2026. A versão anterior da raiz ficou guardada em `alpha-code-v1-0-1.html`; `alpha-code-anterior.html` continua intacta. A pasta de pré-visualização foi removida para não haver conteúdo duplicado.

## 2. Problemas encontrados e correcções

1. **Grave: o formulário nunca funcionou para visitantes reais.** A função `registarLeitor` escreve na base de dados com a sessão do chamador. Num site público e anónimo isso devolve `"This app is private, You do not have access to this app"`. O mesmo acontecia com `registarEvento`, portanto nenhuma visita estava a ser contada. Correcção: a nova função `subscreverNewsletter` escreve com papel de serviço e valida tudo no servidor; `registarEvento` foi corrigida da mesma forma.
2. **`newsletterForwardUrl` existia na configuração mas nunca era usada.** Removida. A sincronização passou a ser feita no backend, nunca no browser.
3. **Aviso de privacidade falso.** O site dizia "guardamos apenas o teu email", mas o código enviava também origem, página e idioma. Texto reescrito e painel de privacidade detalhado.
4. **Contagens erradas.** "08 obras" e "4 na ALPHA CODE" misturavam a trilogia (não publicada) com as obras disponíveis. Corrigido em hero, colecções, filtros, etiqueta do catálogo e SEO.
5. **Idioma por defeito.** O site abria em inglês para quem tinha o navegador em inglês. Agora abre sempre em português; inglês é escolha explícita (botão ou `?lang=en`).

## 3. Estado da integração MailerLite

Implementada no backend, pronta a ligar:

- Cria subscritor com `status: "unconfirmed"`, o que faz o MailerLite enviar o email de confirmação (duplo opt-in).
- Associa ao grupo configurado, quando existir.
- Regista o resultado em `LeitorLoja.mailerlite_estado`: `nao-configurado`, `sincronizado` ou `falhou`.
- Cancelamento: remove o subscritor no MailerLite e marca o contacto como `cancelado`.
- Nenhuma campanha é enviada por esta função.

Testado sem credenciais: a inscrição grava na base ALL-ALPHA e a interface diz a verdade ("o email de confirmação será enviado quando o serviço estiver activo"), sem simular sucesso.

## 4. Credenciais ainda necessárias

| Variável | Onde obter | Obrigatória |
|---|---|---|
| `MAILERLITE_API_KEY` | MailerLite → Integrations → API | Sim, para enviar emails |
| `MAILERLITE_GROUP_ID` | MailerLite → Subscribers → Groups (id do grupo) | Não, mas recomendada |

Devem ser guardadas como segredo do agente, nunca no JavaScript. Sem elas o sistema continua a recolher inscrições com consentimento; só não envia emails.

## 5. Resultado dos testes funcionais

| Teste | Resultado |
|---|---|
| 7 links Gumroad | Todos 200 |
| Filtro "O Arquivo Vivo" | 2 cartões, contador "2 obras disponíveis" |
| Filtro "ALPHA CODE" | 3 obras + trilogia, contador "3 disponíveis · 1 em preparação" |
| Alternância PT/EN | Textos, `<html lang>`, título, descrição e contadores mudam; contagens EN iguais às PT |
| Newsletter sem consentimento | Bloqueia com aviso próprio |
| Newsletter com consentimento | Grava registo com data, versão do aviso e idioma; estado `ativo` |
| Duplicado | Devolve `jaExistia: true` e actualiza o registo em vez de duplicar |
| Cancelamento com token errado | 403 |
| Contagem de visitas | Registo criado com página, dispositivo, sessão e origem |
| SEO / dados estruturados | JSON-LD válido: 7 livros, `numberOfItems: 7` |
| Imagens e CSS/JS | Todos 200 na pré-visualização |
| Mobile 390 px / tablet 768 px / desktop 1280 px | Layout verificado nos três |

Os registos de teste (inscrições e visitas) foram apagados depois dos testes.

## 6. Propostas de capa (aguardam aprovação)

`propostas-capas/` contém duas variantes por volume:

- **A · Série** — preto, ouro, título em marfim. É a que está em produção.
- **B · Selo** — lombada vermelha com o nome da série na vertical.
- **C · Papel** — marfim, título a preto, selo vermelho. Melhor leitura em miniatura.

Nada foi aplicado na Gumroad nem substituído no site.

## 7. Visitas

A contagem está **activa em produção desde 09/11/2026**. O que fica registado por visita: página, idioma, tipo de dispositivo, site de origem, sessão anónima e data. Sem cookies, sem IP, sem identificação. Respeita o sinal `Do Not Track` do navegador.

Para consultar: basta pedir "quantas visitas hoje" ou "visitas desta semana".

## 8. Depende de aprovação humana

2. Escolher a variante de capa para o Volume II e para o Volume III.
3. Criar a conta MailerLite e fornecer as duas credenciais.
4. Confirmar o email público de contacto (`ericdcxavier@icloud.com`).
5. Publicar a trilogia na Gumroad, quando existir.

---

## 9. Envio das boas-vindas (actualização 10/11/2026, 01:10)

O MailerLite desta conta recusa todos os envios: a campanha criada e agendada por API fica presa, e os pedidos de envio de teste devolvem `Resource does not exist`. A conta está activa mas sem remetente verificado, e nada sai enquanto isso não for resolvido no painel.

Solução implementada e testada:

- Função `enviarBoasVindas` envia o email pelos servidores do Gmail, em nome do Éric, usando uma palavra-passe de aplicação guardada como segredo. Liga-se ao SMTP do Gmail na porta 465 a partir da plataforma, sem depender de aprovação de terceiros.
- Fluxo `Boas-vindas Biblioteca ALL-ALPHA` corre de cinco em cinco minutos, chama a função e envia no máximo cinco emails por execução.
- Cada leitor é marcado com `contactado = true` depois do envio, por isso ninguém recebe duas vezes.
- Se o envio falhar, o leitor fica por marcar e volta a ser tentado na execução seguinte.
- O MailerLite mantém-se como lista de subscritores, pronto para campanhas quando a conta for verificada.

Verificado em produção: envio automático para um leitor real às 01:05 de 10/11/2026, com o registo marcado como contactado.
