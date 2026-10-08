# PROMPT: LANDING PAGE GOLDLINE TRANSPORTES (VERSÃO 2)

Você vai criar do zero a versão 2 da landing page da Goldline Transportes. Ela será comparada com uma versão 1 já aprovada (HTML estático). A versão 2 mantém o conteúdo e a identidade da versão 1 e se diferencia pela qualidade de execução: animações modernas e discretas, código organizado, desempenho alto e as correções técnicas listadas aqui.

Leia este documento inteiro antes de escrever qualquer código. Depois, apresente um plano curto (arquivos, bibliotecas, ordem de construção) e comece.

---

## 0. REGRAS INEGOCIÁVEIS

1. **Hospedagem:** Hostinger, plano de hospedagem HTML (servidor Apache/LiteSpeed com `.htaccess`). Não existe Node.js, banco de dados nem PHP garantido no servidor. O entregável final é uma pasta de arquivos estáticos que sobe direto em `public_html`.
2. **Sem conteúdo inventado.** Telefone, CNPJ, endereço, número, depoimento, prazo, registro: se não está neste documento ou em `_referencia/`, fica como `TODO` no código e na lista final. Nunca preencha com valor plausível.
3. **Copy literal.** Os textos vêm de `_referencia/01-site/index.html`. Copie exatamente, sem reescrever, resumir ou "melhorar". As únicas mudanças de texto permitidas estão listadas neste documento.
4. **Sem travessão** (o caractere "—") em nenhum texto do site.
5. **Mobile first.** PageSpeed Insights mobile 90 ou mais. LCP abaixo de 2,5s, CLS abaixo de 0,1, INP abaixo de 200ms.
6. **Um H1 por página.** Title e meta description únicos por página.
7. **Sem CDN de terceiros para bibliotecas e fontes.** Tudo instalado via npm ou baixado e servido do próprio domínio. Os únicos domínios externos permitidos são GTM/GA4/Meta (via GTM, após consentimento), Formspree, Google Maps (iframe) e YouTube nocookie.

---

## 1. MATERIAL DE REFERÊNCIA

A pasta `_referencia/` (cópia do pacote do projeto) contém:

| Caminho | Uso |
|---|---|
| `_referencia/01-site/index.html` | Versão 1 aprovada. Fonte da copy, da estrutura, das cores e do layout. Abra no navegador e tire screenshots para entender o visual antes de começar. |
| `_referencia/01-site/politica-de-privacidade.html` | Texto da política (reaproveitar e ajustar conforme a seção 9) |
| `_referencia/01-site/.htaccess` | Base para o novo `.htaccess` |
| `_referencia/02-materiais/logos/` | `logo-topo-goldline.png`, `logo-goldline-fundo-escuro.png`, `logo-rodape-goldline-branco.png`, `favicon-512.png` |
| `_referencia/02-materiais/fotos/` | `aviao.webp`, `aviao-2.webp`, `caminhao.webp`, `frota.webp`, `galpao.webp`, `hero-estrada.webp`, `parceria.webp` |
| `_referencia/02-materiais/premios/` | `premio-040.webp` a `premio-045.webp` |
| `_referencia/02-materiais/parceiros/` | `latam-cargo.png`, `gollog.png`, `azul-cargo-express.png` |
| `_referencia/02-materiais/clientes/` | 31 logos individuais em PNG |
| `_referencia/BRIEFING-PROJETO-GOLDLINE.md` | Histórico e decisões do projeto |

Não use a base React da Ótica Emanuel nem o projeto `site-goldline`. Esta versão é independente.

---

## 2. STACK

| Item | Definição |
|---|---|
| Build | Vite, template vanilla (sem React, Vue ou TypeScript obrigatório). Multi-page: `index.html`, `politica-de-privacidade.html`, `obrigado.html` configurados em `build.rollupOptions.input`. |
| Animação | `gsap` (npm) com os plugins `ScrollTrigger`, `SplitText` e `MotionPathPlugin` (todos gratuitos desde a versão 3.13) |
| Rolagem suave | `lenis` (npm), integrado ao ticker do GSAP |
| CSS | CSS puro com custom properties, organizado em arquivos por seção. Sem Tailwind. |
| Imagens | `sharp` em script de build próprio (`scripts/images.mjs`) para gerar WebP em 3 larguras (480, 960, 1600) e AVIF opcional |
| Fontes | Arquivos woff2 servidos de `/fonts/` (ver seção 4) |
| Saída | `dist/` com caminhos relativos (`base: './'`), pronta para `public_html` |

Estrutura sugerida:

```
goldline-v2/
├── _referencia/                 (não vai para o build)
├── public/
│   ├── .htaccess
│   ├── robots.txt
│   ├── sitemap.xml
│   ├── favicon.ico, apple-touch-icon.png, og-image.jpg
│   ├── fonts/
│   └── img/                     (imagens processadas)
├── src/
│   ├── css/  (tokens.css, base.css, header.css, hero.css, ...)
│   ├── js/   (main.js, motion.js, form.js, consent.js, tracking.js, config.js)
│   └── data/ (brasil.svg ou path do mapa)
├── index.html
├── politica-de-privacidade.html
├── obrigado.html
├── scripts/images.mjs
├── vite.config.js
└── README-PUBLICACAO.md
```

Centralize em `src/js/config.js` tudo que o cliente ainda vai confirmar: `GTM_ID`, `FORMSPREE_ID`, `WHATSAPP_COMERCIAL`, `AREA_CLIENTE_URL`, `FACEBOOK_URL`, `YOUTUBE_ID`, números da faixa de estatísticas. Valores pendentes ficam vazios ou com o valor da versão 1 e um comentário `// TODO`. Elementos que dependem de valor vazio (Área do Cliente, Facebook, vídeo) não são renderizados.

---

## 3. CLIENTE E NEGÓCIO

| Item | Informação |
|---|---|
| Nome | Goldline Transportes |
| Razão social | Gold Line Transporte de Cargas Aéreas LTDA (TODO: confirmar) |
| CNPJ | 05.290.498/0001-98 (TODO: confirmar) |
| Segmento | Transporte de cargas aéreo e rodoviário, cobertura nacional |
| Diferenciais | Autorizada ANTT, ANVISA e IBAMA para farmacêuticos, químicos e perigosos; 1º lugar no Prêmio Top LATAM Cargo por 4 anos consecutivos (peso embarcado e volume faturado); parceiros LATAM Cargo, GOLLOG e Azul Cargo Express |
| Público | Comércio, varejo e indústria: gerentes de logística, compras e supply chain |
| Objetivo | Gerar pedidos de cotação (leads B2B) |
| CTA principal | Solicitar cotação (formulário) |
| CTA secundário | WhatsApp comercial |
| Domínio | goldlinetransportes.com.br (TODO: confirmar) |

### Unidades

| Unidade | Endereço | Telefone | WhatsApp |
|---|---|---|---|
| Matriz Fortaleza/CE | Rua Paraguaçu, 825, Serrinha, CEP 60742-755 | (85) 3469-2888 | (85) 99701-0005 |
| Filial Guarulhos/SP | Av. Santa Ifigênia, 721, Vila Paraíso, CEP 07242-100 | (11) 2488-7888 | (11) 91060-1099 |

- E-mails: comercial@goldlinetransportes.com.br e sac@goldlinetransportes.com.br
- Horário: segunda a sexta, 8h às 18h; sábado, 8h às 13h
- Instagram: https://instagram.com/goldlinetransportes
- Facebook: TODO (não renderizar até confirmar)

---

## 4. IDENTIDADE VISUAL

### Cores (tokens em `tokens.css`)

```css
:root{
  --gold:#E5BE55;
  --gold-hover:#F0CD6C;
  --gold-dark:#C9A23F;
  --gold-soft:#F7EFD9;
  --ink:#1A1A1A;
  --ink-2:#232323;
  --ink-3:#2E2E2E;
  --text:#2B2B2B;
  --muted:#6B6B6B;
  --line:#E7E2D6;
  --bg:#FFFFFF;
  --bg-alt:#F6F4EF;
  --radius:14px;
  --max:1200px;
}
```

### Tipografia

**Títulos: Archivo variável** (eixos `wght` e `wdth`).
- Obtenha o arquivo `Archivo[wdth,wght].ttf` do repositório oficial `google/fonts` no GitHub (pasta `ofl/archivo`).
- Gere um woff2 com `pyftsubset` (fonttools) contendo só os unicode ranges latin e latin-ext, mantendo os dois eixos. Meta: 60 a 90 KB. Se passar disso, limite o eixo `wght` a 500..900 com `fonttools varLib.instancer`.
- Declare com `@font-face` usando `font-weight: 500 900` e `font-stretch: 62% 125%`.
- Faça `preload` só deste arquivo.

**Texto: Montserrat** 400, 600 e 700, woff2 estáticos (latin + latin-ext), via `@fontsource/montserrat` ou subset próprio.

Ambas com `font-display: swap`. Crie uma fonte reserva com `size-adjust`, `ascent-override` e `descent-override` calibrados sobre `Arial Narrow`/`Arial` para que a troca não desloque o layout.

| Uso | Fonte | Peso | Largura | Line-height | Tamanho |
|---|---|---|---|---|---|
| H1 hero | Archivo | 800 | 72% | 1.02 | `clamp(2.4rem, 6.4vw, 5.2rem)` |
| H2 seção | Archivo | 700 | 80% | 1.05 | `clamp(2rem, 4.2vw, 3rem)` |
| H3/H4 cards | Archivo | 700 | 90% | 1.1 | 1.35 a 1.6rem |
| Números e "4x" | Archivo | 800 | 72% | 1 | conforme layout |
| Eyebrow | Montserrat | 700 | | | .78rem, `letter-spacing:.18em`, caixa alta, `--gold-dark` (ou `--gold` em fundo escuro) |
| Corpo | Montserrat | 400 | | 1.6 | 16px |

Todos os títulos em caixa alta. Palavra-chave do título em dourado com `<span class="g">`, como na versão 1.

### Elementos de marca
- Curvas douradas em arco (círculos de borda fina dourada com opacidade 0,18 a 0,35) no hero e no CTA final, como na versão 1. Na versão 2, faça como SVG para permitir desenhar o traço.
- Fotos em preto e branco (`filter: grayscale(1)`) com destaques dourados.
- Botões em pílula: dourado com texto grafite; contorno branco em fundo escuro.
- Header grafite translúcido com `backdrop-filter: blur(10px)` e borda inferior dourada a 18%.

---

## 5. ESTRUTURA DA HOME

Mantenha a ordem e os textos da versão 1. Fundo de cada seção entre parênteses.

1. **Header fixo** (grafite translúcido). Logo, menu (Soluções, Vantagens, Clientes, Sobre, Unidades), link "Área do Cliente" (só renderiza se `AREA_CLIENTE_URL` tiver valor), botão "Solicitar cotação". Hambúrguer abaixo de 1060px, com painel acessível (`aria-expanded`, fecha com Esc e ao clicar em link, trava a rolagem do fundo).
2. **Hero** (foto `hero-estrada` + gradiente escuro + curvas). Eyebrow, H1 "Sua carga em <span class="g">todo o Brasil</span>, por ar ou por estrada", subtítulo, CTAs "Solicitar cotação" e "Falar no WhatsApp", 3 selos.
3. **Números** (faixa dourada). 4 contadores com os valores da versão 1, lidos de `config.js` com `// TODO: validar com o cliente`.
4. **Soluções** (claro). 3 cards: Aéreo, Rodoviário, Farma/químicos/perigosos. Cada card com foto, descrição, subserviços e link "Cotar..." que rola até o formulário e pré-seleciona modal e tipo de carga (comportamento da versão 1).
5. **Vantagens** (alternado). Foto da frota com selo "4x 1º lugar no Prêmio Top LATAM Cargo, 4 anos consecutivos" e 4 diferenciais com ícone.
6. **Segmentos** (claro). 5 itens com ícone.
7. **Certificações + Sistema de gestão** (escuro). Selos em texto ANTT, ANVISA e IBAMA (nunca usar logos oficiais dos órgãos) com espaço para o número de registro (`TODO`). Bloco com os 3 passos da Área do Cliente; o botão só aparece se `AREA_CLIENTE_URL` tiver valor.
8. **Premiações + parceiros** (claro). Mosaico de 4 fotos da premiação, bloco "4x", logos dos 3 parceiros aéreos.
9. **Clientes** (alternado). Logos individuais (seção 6 detalha a animação). `<!-- TODO: autorização de uso das marcas -->`. Deixe um slot comentado para depoimentos futuros.
10. **Sobre** (claro). Texto, missão, visão e valores, selo "Desde 2002 em Fortaleza" (`TODO: validar`). Slot de vídeo do YouTube (nocookie, carregado só no clique com thumbnail) se `YOUTUBE_ID` tiver valor.
11. **Unidades** (escuro). Mapa animado do Brasil (seção 6) + 2 cards com endereço, telefone, WhatsApp e mapa do Google. Horário.
12. **Cotação** (alternado). Texto de apoio, contatos e formulário (seção 7).
13. **FAQ** (claro). As 5 perguntas da versão 1 + as 3 abaixo, total de 8, em acordeão acessível (`<button aria-expanded>` + região). No desktop, 2 colunas com 4 perguntas cada; no mobile, 1 coluna. Adicione o JSON-LD `FAQPage` com as 8.
    - 6\. **O que é o serviço Próximo Voo?** É a opção para cargas urgentes: a mercadoria embarca no primeiro voo disponível para o destino. `<!-- TODO: confirmar resposta com o cliente -->`
    - 7\. **Vocês fazem frete dedicado?** Sim. No rodoviário dedicado, o veículo é exclusivo para a sua carga, com rota direta da origem ao destino. `<!-- TODO: confirmar resposta com o cliente -->`
    - 8\. **Qual o horário de atendimento?** Segunda a sexta, das 8h às 18h, e sábado, das 8h às 13h, nas unidades de Fortaleza e Guarulhos.
    - Ordem final: 1 a 5 da versão 1, depois 6, 7 e 8. Deixe um slot comentado para a 9ª pergunta (seguro de carga, TODO 10).
14. **CTA final** (escuro, foto `parceria` a 22% em P&B + curvas).
15. **Rodapé** (grafite). Logo branco, Instagram, soluções, unidades, razão social, CNPJ, links "Política de Privacidade" e "Preferências de cookies", copyright com ano dinâmico.
16. **Fixos:** botão flutuante de WhatsApp (não pode cobrir o banner de cookies nem o botão de envio do formulário no mobile) e banner de consentimento.

### Mudanças de conteúdo em relação à versão 1
- FAQ com 3 perguntas novas (6, 7 e 8), em 2 colunas.
- Formulário sem os campos CNPJ e Nº de volumes.
- Banner de cookies com dois botões (Aceitar e Recusar) e o texto: "Usamos cookies para medir o desempenho do site e das campanhas. Você pode aceitar ou recusar." (o "Entendi" da versão 1 sai).
- Mensagens de WhatsApp com identificação de origem (seção 8).

---

## 6. ANIMAÇÕES

### Princípios
1. Toda animação tem função: guiar a leitura, mostrar relação ou confirmar ação. Movimento sem função sai.
2. Uma animação principal por seção; o resto é discreto.
3. Animações de entrada rodam uma vez (`once: true`).
4. Anime só `transform`, `opacity` e `clip-path` (exceção controlada: eixo `wdth` da fonte, ver abaixo).
5. Tokens de movimento em `motion.js`:
   - duração 0,4 a 0,9s
   - ease `power3.out` (padrão) e `expo.out` (revelações)
   - stagger 0,06 a 0,1s
   - deslocamento 24 a 40px no desktop, 16 a 24px no mobile
6. `prefers-reduced-motion: reduce`: nenhum movimento, sem Lenis, sem marquee, sem parallax; conteúdo aparece direto no estado final.
7. Sem JavaScript, a página aparece completa. Os estados iniciais ocultos só são aplicados via classe `.js` no `<html>` adicionada por script inline no `<head>`.
8. Use `gsap.matchMedia()` para separar desktop, mobile e reduced motion. Parallax só a partir de 1024px.

### Proibido
Cursor personalizado; tilt 3D em cards; partículas ou fundo animado contínuo; ease bounce ou elastic; texto que embaralha letras; preloader; pin de seção que trava a rolagem por mais de uma tela; botão magnético.

### Por seção

| Seção | Animação principal | Detalhes discretos |
|---|---|---|
| Header | Compacta de 72px para 60px após 80px de rolagem. Esconde ao rolar para baixo e volta ao rolar para cima (nunca esconde com o menu mobile aberto). | Barra dourada de 2px de progresso de leitura no topo |
| Hero | H1 com `SplitText` por linhas, cada linha sobe de trás de uma máscara (`overflow:hidden`), e ao mesmo tempo o eixo `font-stretch` abre de 62% para 72%. Depois, sublinhado dourado se desenha sob "todo o Brasil" (SVG `stroke-dashoffset`). | Curvas douradas desenham o traço. Parallax leve na foto (máx. 8%). Eyebrow, subtítulo, CTAs e selos entram em stagger. Tudo termina em até 1,4s; o H1 em até 0,8s. |
| Números | Contadores de 0 ao valor final (formato pt-BR) | Divisórias verticais crescem de 0 a 100% de altura |
| Soluções | Cards entram em stagger de baixo | Hover (só em dispositivos com mouse): foto faz zoom de 1 para 1,04 dentro do card com um véu dourado a 12% (`mix-blend-mode: multiply`), card sobe 4px com sombra, seta do link desliza 4px. As fotos atuais já são P&B na origem; quando chegarem as fotos coloridas (TODO 12), o hover passa a ir de P&B para cor. |
| Vantagens | Foto revelada por `clip-path: inset()` da esquerda para a direita | Selo "4x" entra com scale de 0,9 para 1 e o eixo `font-stretch` de 62% para 72%. Ícones em stagger. |
| Segmentos | Itens em stagger da esquerda para a direita | Ícone muda para dourado no hover |
| Certificações + Sistema | Linha vertical que liga os 3 passos se preenche com `scrub` conforme a rolagem | Selos com check SVG que se desenha |
| Premiações | Mosaico revelado com `clip-path` em stagger | "4x" com contador |
| Clientes e parceiros | Duas faixas de logos em loop contínuo e lento (~40s por ciclo), sentidos opostos, pausa no hover e quando fora da tela | Logos em P&B a 70% de opacidade, cor total no hover |
| **Unidades (momento de destaque)** | Mapa do Brasil em SVG. Ao entrar na tela: contorno desenha, ponto de Fortaleza aparece, rota dourada tracejada desenha um arco até Guarulhos e um ícone de avião percorre a rota (`MotionPathPlugin`, `autoRotate`). Ao chegar, o ponto de Guarulhos pulsa uma vez. Duração total entre 2,5s e 3s. | Rótulos "Matriz Fortaleza/CE" e "Filial Guarulhos/SP" entram no fim. Os 2 cards de unidade entram em stagger. |
| Cotação | Campos em stagger | Foco com borda e anel dourado. Botão com estados: normal, "Enviando..." com spinner, sucesso (redireciona), erro. |
| FAQ | Abre e fecha com animação de altura (GSAP `height: auto`) | Ícone "+" gira 45° |
| CTA final | Curvas douradas desenham o traço | Parallax leve no fundo |
| Global | Lenis com `lerp` 0,1. Âncoras do menu usam `lenis.scrollTo` com offset do header. | `ScrollTrigger.refresh()` após carregar fontes e imagens |

### Mapa do Brasil (regras)
- **Fonte do contorno:** API de malhas do IBGE, por exemplo `https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?formato=image/svg+xml&qualidade=minima`. Se a API não responder, pare e me avise. Não desenhe o contorno à mão nem gere um contorno aproximado.
- Simplifique o path (SVGO ou similar) para ficar abaixo de 15 KB.
- Posicione Fortaleza (lat -3,7319; lon -38,5267) e Guarulhos (lat -23,4538; lon -46,5333) calculando as coordenadas na mesma projeção e no mesmo `viewBox` do SVG. Não posicione a olho.
- Estilo: contorno dourado a 35% sobre fundo grafite, preenchimento `--ink-3`, rota em `--gold`.
- No mobile, o mapa fica acima dos cards com no máximo 320px de altura.

---

## 7. FORMULÁRIO

### Campos

| Campo | Tipo | Obrigatório |
|---|---|---|
| Nome | text, `autocomplete="name"` | Sim |
| Empresa | text, `autocomplete="organization"` | Sim |
| WhatsApp / Telefone | tel, máscara (00) 00000-0000, `inputmode="tel"` | Sim |
| E-mail | email | Sim |
| Origem (cidade/UF) | text | Sim |
| Destino (cidade/UF) | text | Sim |
| Modal | radio: Aéreo, Rodoviário, Ainda não sei | Não |
| Tipo de carga | select com as opções da versão 1 | Sim |
| Peso aproximado (kg) | number | Não |
| Observações | textarea | Não |
| LGPD | checkbox: "Autorizo o contato da Goldline sobre esta cotação, conforme a Política de Privacidade." (link) | Sim |

Campos ocultos: `origem_pagina` (seção ou card que levou ao formulário), `utm_source`, `utm_medium`, `utm_campaign`, `gclid`, `fbclid` (lidos da URL e guardados em `sessionStorage` com try/catch).

### Envio
1. Validação no navegador com mensagens por campo (`aria-describedby`), sem `alert()`.
2. Anti-spam: campo honeypot `_gotcha` (nativo do Formspree, escondido de leitores de tela e do usuário) e bloqueio de envio em menos de 3 segundos após o carregamento.
3. `fetch` POST para `https://formspree.io/f/${FORMSPREE_ID}` com `Accept: application/json`.
4. **Só se a resposta for `ok`:** dispara `lead_form_submit`, salva um resumo em `sessionStorage` (try/catch) e redireciona para `obrigado.html`.
5. **Se falhar** (erro de rede, resposta não ok ou `FORMSPREE_ID` vazio): mostra mensagem de erro com botão "Enviar pelo WhatsApp" que abre o WhatsApp comercial com a mensagem montada. Os dados permanecem no formulário.
6. `FORMSPREE_ID` vazio em desenvolvimento: avisa no console e usa o fluxo de erro.

### Página `obrigado.html`
- `<meta name="robots" content="noindex">`, H1 "Pedido de cotação recebido".
- Texto: "Nossa equipe comercial vai analisar os dados da sua carga e retornar pelo telefone ou e-mail informado." (sem prometer prazo; prazo é TODO).
- Botão "Enviar também pelo WhatsApp" com a mensagem montada do resumo (se não houver resumo, mensagem padrão).
- Botão "Voltar ao site".
- Dispara `page_view` normal; a conversão de anúncios usa o evento `lead_form_submit` ou a visualização desta página (configurado no GTM).

---

## 8. WHATSAPP, RASTREAMENTO E CONSENTIMENTO

### Mensagens de WhatsApp (identificam a origem)

| Botão | Número | Mensagem |
|---|---|---|
| Header e hero | 5585997010005 | Olá! Vim pelo site da Goldline e quero uma cotação de frete. |
| Card Aéreo | 5585997010005 | Olá! Vim pelo site e quero cotar frete aéreo. |
| Card Rodoviário | 5585997010005 | Olá! Vim pelo site e quero cotar frete rodoviário. |
| Card Farma | 5585997010005 | Olá! Vim pelo site e quero cotar transporte de carga especial (farma, química ou perigosa). |
| Unidade Fortaleza | 5585997010005 | Olá! Vim pelo site e quero falar com a unidade de Fortaleza. |
| Unidade Guarulhos | 5511910601099 | Olá! Vim pelo site e quero falar com a unidade de Guarulhos. |
| Botão flutuante | 5585997010005 | Olá! Vim pelo site da Goldline e quero atendimento. |
| CTA final | 5585997010005 | Olá! Vim pelo site e quero uma proposta para minha operação. |

Links no formato `https://wa.me/NUMERO?text=MENSAGEM_CODIFICADA`, com `target="_blank" rel="noopener"` e atributo `data-wa-origem` com o nome do botão.

### Eventos (somente `dataLayer`)
O código nunca chama `gtag()` ou `fbq()` diretamente. Tudo vai para `window.dataLayer.push`:

| Evento | Quando | Parâmetros |
|---|---|---|
| `lead_form_submit` | Envio confirmado pelo Formspree | `modal`, `tipo_carga`, `origem_pagina` |
| `whatsapp_click` | Clique em qualquer link wa.me | `origem` (valor de `data-wa-origem`) |
| `phone_click` | Clique em `tel:` | `unidade` |
| `email_click` | Clique em `mailto:` | `email` |
| `cta_cotacao_click` | Clique em botões que levam ao formulário | `origem` |

### GTM e Consent Mode v2
- Snippet do GTM no `<head>` e `<noscript>` no início do `<body>`, ativados só se `GTM_ID` tiver valor (TODO).
- **Antes** do GTM, script inline com o padrão negado:
  `gtag('consent','default',{ad_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',analytics_storage:'denied',wait_for_update:500})`, usando a função `gtag` que só empurra para o `dataLayer`.
- Banner: "Aceitar" envia `consent update` com tudo `granted`; "Recusar" mantém `denied`. Escolha salva em `localStorage` (try/catch) por 6 meses. Ao reabrir o site, aplica a escolha salva antes do GTM.
- Link "Preferências de cookies" no rodapé reabre o banner.
- GA4, Meta Pixel e Google Ads serão configurados dentro do GTM (fora do escopo do código). Documente no README quais eventos existem.

---

## 9. PÁGINAS LEGAIS

`politica-de-privacidade.html`: reaproveite o texto da versão 1 e garanta:
- Seções: dados coletados (formulário, cookies, WhatsApp), finalidade, base legal, compartilhamento (Formspree, Google, Meta), armazenamento, direitos do titular, cookies (tabela com categoria, finalidade e exemplos), contato.
- Encarregado de dados: `TODO`.
- Data de atualização: `TODO`.
- Razão social e CNPJ iguais ao rodapé (`TODO: confirmar`).
- Mesmo header e rodapé da home, com H1 próprio, title e description próprios.

---

## 10. SEO

- Title: `Goldline Transportes | Transporte de cargas aéreo e rodoviário para todo o Brasil`
- Description: `Transportadora com bases em Fortaleza/CE e Guarulhos/SP. Cargas aéreas e rodoviárias para todo o Brasil, incluindo farmacêuticos, químicos e perigosos. Solicite sua cotação.`
- `lang="pt-BR"`, canonical `https://goldlinetransportes.com.br/` (TODO: domínio), Open Graph e Twitter Card com `og-image.jpg` 1200x630 (gerar a partir de `hero-estrada` + logo).
- Hierarquia: H1 único, H2 por seção, H3 nos cards.
- JSON-LD: as duas unidades (copiar da versão 1) + `FAQPage`.
- `robots.txt` (bloqueia `/obrigado.html`) e `sitemap.xml` (home e política).
- `alt` descritivo em todas as imagens; logos de clientes com `alt` = nome da marca.
- Favicon `.ico`, `apple-touch-icon.png` 180px, `theme-color` `#1A1A1A`.

---

## 11. DESEMPENHO E ACESSIBILIDADE

- Foto do hero: `<img>` real (não background), `fetchpriority="high"`, `preload` com `imagesrcset`, nunca começa com `opacity:0`. O parallax mexe só em `transform`.
- Imagens abaixo da primeira tela: `loading="lazy"`, `decoding="async"`, `width` e `height` explícitos, `srcset` com as larguras geradas.
- Iframes do Google Maps: carregados só quando o card entra na tela (IntersectionObserver), com placeholder do mesmo tamanho.
- JS em módulos com `defer`; o bundle de animação carregado depois do conteúdo principal. Meta: JS total abaixo de 90 KB gzip.
- CSS crítico do hero inline no `<head>` se o Lighthouse apontar bloqueio de renderização.
- Contraste mínimo AA (atenção: texto dourado em fundo branco não passa; use `--gold-dark` ou grafite).
- Foco visível em todos os interativos; ordem de tabulação lógica; `skip link` "Pular para o conteúdo".
- Alvos de toque com no mínimo 44px.
- Sem rolagem horizontal em 360, 390, 768, 1024, 1366 e 1920px.

---

## 12. `.htaccess` PARA HOSTINGER

Partindo do `.htaccess` da versão 1:
- Força HTTPS e domínio sem www (301).
- `ErrorDocument 404 /index.html` não; crie uma `404.html` simples com o visual do site e link para a home.
- Compressão (`mod_deflate`) e cache (`mod_expires`): 1 ano para `/assets/`, `/fonts/`, `/img/` (arquivos com hash); sem cache longo para `.html`.
- Cabeçalhos: `X-Content-Type-Options`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, `X-Frame-Options: SAMEORIGIN`, HSTS.
- CSP liberando apenas: `self`; scripts e conexões de `www.googletagmanager.com`, `www.google-analytics.com`, `*.google-analytics.com`, `connect.facebook.net`, `www.facebook.com`, `formspree.io`; frames de `www.google.com` (Maps) e `www.youtube-nocookie.com`; imagens de `self`, `data:` e dos domínios de GA/Meta. Teste o site com a CSP ativa no preview local (servindo `dist/` com cabeçalhos equivalentes) e corrija qualquer bloqueio.
- Fontes servidas com o tipo `font/woff2`.

---

## 13. ORDEM DE TRABALHO

1. Ler este documento e abrir `_referencia/01-site/index.html` no navegador (Playwright). Tirar screenshots em 390px e 1366px para referência visual.
2. Apresentar o plano e seguir sem esperar aprovação, salvo se faltar algo essencial.
3. Setup: Vite multi-page, fontes (subset e @font-face), script de imagens, tokens.
4. Construir o HTML semântico completo de todas as seções com a copy literal, sem animação. Validar layout em mobile e desktop.
5. Formulário, WhatsApp, eventos, consentimento, páginas legais, obrigado e 404.
6. Animações, seção por seção, na ordem da página. Mapa por último.
7. SEO, `.htaccess`, `robots.txt`, `sitemap.xml`, `og-image`.
8. Build e verificação (seção 14).
9. Gerar `goldline-v2-hostinger.zip` com o **conteúdo** de `dist/` na raiz (incluindo `.htaccess`), pronto para extrair em `public_html`.

---

## 14. VERIFICAÇÃO ANTES DE ENTREGAR

Execute e relate o resultado de cada item:

- [ ] `npm run build` sem erros e sem avisos.
- [ ] Servir `dist/` localmente e rodar Lighthouse mobile na home: Performance 90+, Acessibilidade 95+, Boas práticas 95+, SEO 100. Se Performance ficar abaixo de 90, corrigir antes de entregar e informar o que foi feito.
- [ ] Screenshots com Playwright em 360, 390, 768, 1366 e 1920px de cada seção, após as animações terminarem. Conferir: nada cortado, sem rolagem horizontal, H1 com no máximo 4 linhas em 360px.
- [ ] Teste com `prefers-reduced-motion: reduce` emulado: todo o conteúdo visível, nenhuma animação.
- [ ] Teste com JavaScript desativado: todo o conteúdo visível.
- [ ] Formulário: validação de cada campo obrigatório, honeypot, envio simulado com sucesso (redireciona para obrigado) e com falha (mensagem de erro e WhatsApp).
- [ ] Todos os links `wa.me` com número e mensagem corretos conforme a tabela da seção 8.
- [ ] `dataLayer` recebendo os 5 eventos com os parâmetros certos (log no console em modo dev).
- [ ] Consentimento: nenhum script de terceiros carregado antes do aceite (verificar aba Network).
- [ ] Um H1 por página; title e description únicos.
- [ ] Busca por "—" nos HTML: zero ocorrências.
- [ ] Contraste AA verificado no Lighthouse/axe.
- [ ] Console sem erros.

---

## 15. ENTREGA

1. `goldline-v2-hostinger.zip` (conteúdo de `dist/` na raiz).
2. `README-PUBLICACAO.md` com:
   - como subir na Hostinger (Gerenciador de Arquivos, `public_html`, extrair o zip, ativar SSL antes);
   - onde trocar cada valor em `config.js` e rebuildar;
   - lista de eventos do `dataLayer` para configurar no GTM;
   - redirecionamento 301 de `goldlinecargasaereas.com.br` para o domínio novo, mantendo o e-mail funcionando.
3. Relatório final com: resultado da verificação (seção 14), notas do Lighthouse, peso total da página e do JS, e a lista de TODOs abaixo, indicando em que arquivo e linha cada um está.

### TODOs conhecidos (não preencher)

| # | Item | Bloqueia |
|---|---|---|
| 1 | Números oficiais (anos, clientes, toneladas, km) e "Desde 2002" | Faixa de números e Sobre |
| 2 | Razão social e CNPJ | Rodapé e política |
| 3 | Domínio final | Canonical, OG, JSON-LD, sitemap, robots, `.htaccess` |
| 4 | Link da Área do Cliente | Menu e card Sistema de gestão |
| 5 | Facebook | Rodapé |
| 6 | ID do vídeo do YouTube | Sobre |
| 7 | Registros RNTRC, AFE ANVISA, CTF IBAMA | Selos de certificação |
| 8 | Autorização dos logos de clientes | Seção Clientes |
| 9 | Descrição do serviço Hot Line | Card Aéreo |
| 10 | Seguro de carga | 9ª pergunta do FAQ |
| 16 | Confirmação das respostas 6 (Próximo Voo) e 7 (frete dedicado) do FAQ | FAQ |
| 11 | Depoimentos reais | Slot após Clientes |
| 12 | Fotos coloridas originais da frota, galpão e aviões (as atuais já são P&B na origem) | Hover P&B para cor nos cards e impacto visual geral |
| 13 | GTM_ID | Rastreamento |
| 14 | FORMSPREE_ID e e-mail de destino | Envio do formulário |
| 15 | Encarregado de dados e data de atualização | Política de privacidade |
