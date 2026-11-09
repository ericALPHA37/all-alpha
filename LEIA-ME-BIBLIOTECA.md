# ALL-ALPHA · Biblioteca Digital — v1.0

**No ar:** https://ericalpha37.github.io/all-alpha/
**Versão inglesa:** https://ericalpha37.github.io/all-alpha/?lang=en

---

## 1. Estrutura de ficheiros

```
index.html                     página da biblioteca (PT por defeito, EN por interruptor)
alpha-code-anterior.html       página de vendas anterior, preservada sem alterações
assets/library.css             sistema de design (cor, tipografia, componentes)
assets/library.js              idioma, filtros do catálogo, menu móvel, newsletter
assets/library-img/*.webp      capas e imagens de obra optimizadas
assets/eric-alpha-portal.jpg   retrato do autor (já existia no repositório)
favicon.svg · site.webmanifest
```

## 2. O que está implementado

- Cabeçalho fixo com logótipo tipográfico, navegação, botão **Explorar Obras** e interruptor **PT/EN**.
- Hero editorial com composição de capas, título, texto de apoio e dois CTAs.
- Secção de colecções (ALPHA CODE · O Arquivo Vivo · Outras Obras), cada uma com contagem e atalho que filtra o catálogo.
- Catálogo com 8 obras, filtros funcionais, contagem dinâmica e ligação directa a cada página de produto na Gumroad.
- Etiqueta **Acesso gratuito** em todas as obras disponíveis.
- Secção de acesso e contribuição voluntária, com a política editorial explicada em quatro pontos.
- Secção do autor com retrato, texto editorial e funções.
- Newsletter com validação, estados de erro e de sucesso, e gravação real do email na base de dados ALL-ALPHA.
- Rodapé com navegação, contacto, marca e direitos.
- PT/EN sem mistura de idiomas na mesma vista; preferência guardada no navegador e partilhável por `?lang=pt` / `?lang=en`.
- SEO: título, descrição, canónica, hreflang, Open Graph, Twitter Card e dados estruturados (Person + CollectionPage + 7 livros).
- Acessibilidade: ligação de salto, foco visível, `aria-pressed` nos filtros, `aria-live` na contagem, contraste AA, respeito por `prefers-reduced-motion`.
- Desempenho: imagens WebP abaixo de 50 KB, `loading="lazy"`, dimensões declaradas, sem bibliotecas externas além das tipografias.

## 3. Limitações reais da Gumroad (verificadas)

1. **Não existe HTML/CSS personalizado** para o perfil da loja nem para páginas de produto. O perfil é um template fixo (nome, bio, imagem, links, lista de produtos). Não existe o produto "Gumroad Pages" para alojar uma página própria.
2. Consequência: a biblioteca tem de viver fora da Gumroad. A Gumroad fica com o que faz bem: **checkout, entrega dos ficheiros e contribuição voluntária**.
3. **Nenhum produto foi criado, alterado ou duplicado.** Os sete links do catálogo são os produtos que já existem na loja.

## 4. Publicar em all-alpha.com

1. No repositório, criar o ficheiro `CNAME` com o conteúdo `all-alpha.com`.
2. No DNS do domínio: registos `A` para `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153` e `CNAME www → ericalpha37.github.io`.
3. Em GitHub → Settings → Pages, definir o domínio e activar *Enforce HTTPS*.
4. Actualizar no `index.html` a canónica, os `hreflang` e os URLs `og:` para `https://all-alpha.com/`.

## 5. Ajustes manuais na Gumroad (só o proprietário da conta)

- **Perfil:** nome `ALL-ALPHA`, bio curta a apontar para a biblioteca, ligação para o site.
- **Capas:** subir capas verticais 2:3 nos produtos que hoje têm banner horizontal (Arquivo Vivo I e II, Vou Buscar-te, Elysha) e nos volumes 2 e 3.
- **Preço:** manter `$0+` em todas as obras para preservar o modelo de contribuição voluntária.

## 6. Newsletter

O formulário grava o email em `LeitorLoja` através da função `registarLeitor` (testada: resposta 200). O envio de emails ainda não está activo: é preciso escolher um serviço (Buttondown, MailerLite ou ConvertKit) e colocar o endereço em `CONFIG.newsletterForwardUrl` no ficheiro `assets/library.js`. Enquanto isso, a mensagem de sucesso diz exactamente isso ao leitor, sem prometer o que não acontece.

## 7. Pendentes

| Item | Estado |
|---|---|
| Trilogia Completa | Não publicada na Gumroad. Cartão presente, sem link, marcado "Em breve". |
| Capas dos Volumes 2 e 3 | Não existem na Gumroad. Aplicado estojo tipográfico provisório na linguagem da série. |
| Tradução inglesa dos livros | Só o Volume 1 tem edição EN (em revisão). O site diz apenas o que é verdade. |
| Email público de contacto | `ericdcxavier@icloud.com`, herdado do site anterior. Confirmar. |
| Redes sociais | Não incluídas por falta de links confirmados. |
