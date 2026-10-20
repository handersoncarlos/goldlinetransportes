# Goldline Transportes v2: publicação e manutenção

Site estático (HTML, CSS e JS) gerado com Vite e publicado na **raiz** de `https://goldlinecargasaereas.com.br/`.

- Código: repositório privado `https://github.com/handersoncarlos/goldlinetransportes`.
- `npm run build` gera `dist/` (raiz do domínio, padrão). Esse é o conteúdo publicado.
- A cada push na branch `main`, o GitHub Actions roda o build e publica o conteúdo de `dist/` na branch `deploy`, que a Hostinger implanta em `public_html` (seção 1).

Os e-mails de contato continuam em `@goldlinetransportes.com.br`.

## 0. Fluxo de trabalho com as branches

| Branch | Uso |
|---|---|
| `dev` | Trabalho do dia a dia. Alterações são feitas e revisadas no localhost (seção 6). |
| `main` | Versão aprovada. Todo push ou merge aqui publica o site automaticamente. |
| `deploy` | Gerada pelo GitHub Actions. Contém só os arquivos do site (o conteúdo de `dist/`, com `.htaccess`). Não edite à mão. |

Para publicar uma alteração aprovada:

```bash
git checkout main
```

```bash
git merge dev
```

```bash
git push origin main
```

Se o build falhar no GitHub Actions, nada é publicado e o site continua na versão anterior.

## 1. Publicação via GitHub na Hostinger

**Antes de tudo: faça backup completo da pasta do site atual de `goldlinecargasaereas.com.br` na Hostinger.** A publicação via Git sobrescreve a pasta de destino. No hPanel: Arquivos > Gerenciador de Arquivos > `public_html` > selecionar tudo > Compactar > baixar o zip. Se houver e-mails ou outros serviços configurados no domínio, eles não são afetados (ficam no DNS), mas confira se não há outros arquivos importantes nessa pasta.

1. Confirme que o SSL do domínio está ativo (hPanel > Segurança > SSL). O `.htaccess` força HTTPS.
2. No hPanel do domínio `goldlinecargasaereas.com.br`, abra **Avançado > GIT**.
3. O repositório é privado: a Hostinger mostra uma **chave SSH**. Copie essa chave.
4. No GitHub, abra o repositório > **Settings > Deploy keys > Add deploy key**. Cole a chave, dê um nome (ex.: "Hostinger") e deixe **desmarcado** "Allow write access" (somente leitura).
5. De volta à Hostinger, preencha:
   - Repositório (formato SSH): `git@github.com:handersoncarlos/goldlinetransportes.git`
   - Branch: `deploy`
   - Diretório: `public_html` (ou o diretório do domínio, se a Hostinger indicar outro). Se o campo for relativo a `public_html`, deixe vazio.
6. Clique em **Criar** e depois em **Implantar** para a primeira publicação. Confira o site e o `.htaccess` em `public_html` (Gerenciador de Arquivos com "Mostrar arquivos ocultos").
7. Ative a **implantação automática**: a Hostinger mostra uma URL de webhook. No GitHub: Settings > Webhooks > Add webhook, cole a URL em "Payload URL", tipo `application/json`, evento "Just the push event". Faça um push de teste na `main` e confira se a Hostinger implantou (o histórico aparece na tela do GIT).
8. Teste: `https://goldlinecargasaereas.com.br`, `https://www.goldlinecargasaereas.com.br` (deve redirecionar para sem www), `/politica-de-privacidade.html`, `/trabalhe-conosco.html` e uma URL inexistente (página 404).

**Como voltar a uma versão anterior:** reverta o commit na `main` e envie. O Actions publica de novo a versão anterior na `deploy` e a Hostinger implanta.

```bash
git revert <id-do-commit>
```

```bash
git push origin main
```

Não guarde senhas, tokens ou chaves no repositório. A access key do Web3Forms é pública por definição (vai no HTML) e por isso fica no `config.js`.

## 2. Publicação manual (alternativa sem Git)

Se preferir subir os arquivos à mão:

```bash
npm run build
```

```bash
npm run zip
```

No Gerenciador de Arquivos, envie `goldline-v2-hostinger.zip` para `public_html`, extraia ali (sem subpasta) e apague o zip.

## 3. Trocar valores e gerar de novo

Tudo que o cliente ainda vai confirmar está em **`src/js/config.js`**:

| Constante | O que é | Efeito quando vazio |
|---|---|---|
| `SITE_URL` | Domínio final (`https://goldlinecargasaereas.com.br`) | Usado em canonical, Open Graph, JSON-LD, sitemap, robots e no redirecionamento www do `.htaccess` |
| `GTM_ID` | ID do Google Tag Manager, ex.: `GTM-ABC1234` (TODO 13) | GTM não é carregado |
| `WEB3FORMS_ACCESS_KEY` | Access key do Web3Forms (seção 3.1) | Formulário mostra erro e oferece envio pelo WhatsApp |
| `AREA_CLIENTE_URL` | Link do sistema de rastreamento | Link do menu e botão do card "Sistema de gestão" não aparecem |
| `FACEBOOK_URL`, `INSTAGRAM_URL` | Redes sociais (rodapé e JSON-LD) | Ícone não aparece |
| `EMAIL_RH` | E-mail do RH na página Trabalhe Conosco | |
| `YOUTUBE_ID` | ID do vídeo institucional (TODO 6) | Bloco de vídeo não aparece na seção Sobre |
| `RAZAO_SOCIAL`, `CNPJ` | Dados do rodapé, da política e do JSON-LD | |
| `ANO_FUNDACAO` | Ano de fundação (2015). Gera o selo "Desde 2015 em Fortaleza", o `foundingDate` do JSON-LD e os anos de mercado da faixa dourada: ano atual - fundação - 1 (nunca passa do tempo real). O número é recalculado no navegador; o HTML sem JavaScript usa o valor do ano em que o build foi feito | |
| `STATS` | Demais números da faixa dourada | |
| `WA` | Números e mensagens de cada botão de WhatsApp | |

Depois de editar, revise no localhost (seção 6) e envie para a `main`.

Outros pontos de edição:

- Textos das páginas: `index.html`, `politica-de-privacidade.html`, `obrigado.html`, `trabalhe-conosco.html` e `src/partials/` (cabeçalho, rodapé, formulário).
- Perguntas do FAQ (geram o HTML e o JSON-LD `FAQPage`): `src/data/faq.js`. A 9ª pergunta (seguro de carga) já tem o lugar comentado.
- Seção NR-1 (Pessoas e bem-estar): a lista de ações está pronta em comentário no `index.html` e só deve ser publicada com itens confirmados. Os `alt` das 8 fotos estão provisórios (TODO 21).
- Imagens: as fotos novas ficam em `_novas-imagens/` (hero, soluções, vantagens, sobre, premiações, logos de parceiros, `clientes/` e `nr1/`). Troque o arquivo mantendo o nome e rode `npm run images`.
- Mapas do Google: com aceite de cookies carregam sozinhos; sem aceite aparecem os botões "Ver mapa" e "Abrir no Google Maps".
- Mapa do Brasil: gerado da malha oficial do IBGE por `npm run map`.

### 3.1 Web3Forms: onde trocar a access key

O formulário de cotação envia os dados em JSON para `https://api.web3forms.com/submit`. O destinatário é o e-mail vinculado à access key no painel do Web3Forms (hoje `comercial@goldlinetransportes.com.br`).

- Para trocar a chave: altere `WEB3FORMS_ACCESS_KEY` em `src/js/config.js` e publique (push na `main`).
- Campos enviados: `access_key`, `subject` ("Pedido de cotação pelo site"), `from_name` ("Site Goldline"), `replyto` (e-mail do visitante), todos os campos do formulário e os ocultos (`origem_pagina`, UTMs, `gclid`, `fbclid`).
- Antispam: campo honeypot próprio e bloqueio de envio em menos de 3 segundos.
- O plano gratuito permite 250 envios por mês. Evite testes repetidos com a chave real.
- Se o envio falhar, o visitante vê uma mensagem com o botão "Enviar pelo WhatsApp", e os dados continuam no formulário.

## 4. Eventos para configurar no GTM

O código só envia eventos para o `dataLayer`. Nenhuma tag (GA4, Meta Pixel, Google Ads) está no código: tudo é configurado no GTM. Antes do GTM, o `dataLayer` recebe `site_ambiente: 'producao'` (ou `'homologacao'` no build de subdiretório).

| Evento (`event`) | Quando dispara | Parâmetros |
|---|---|---|
| `lead_form_submit` | Web3Forms confirmou o envio (`success: true`), antes de ir para `obrigado.html` | `modal`, `tipo_carga`, `origem_pagina` |
| `whatsapp_click` | Clique em qualquer link `wa.me` | `origem` (hero, card-aereo, card-rodoviario, card-farma, unidade-fortaleza, unidade-guarulhos, flutuante, cta-final, cotacao, rodape, rodape_fortaleza, rodape_guarulhos, formulario-erro, obrigado) |
| `phone_click` | Clique em telefone (`tel:`) | `unidade` (fortaleza, guarulhos); `origem` nos links do rodapé |
| `email_click` | Clique em e-mail (`mailto:`) | `email` |
| `cta_cotacao_click` | Clique em botão que leva ao formulário | `origem` (header, hero, solucoes, card-aereo, card-rodoviario, card-farma, cta-final, rodape) |
| `area_cliente_click` | Clique na Área do Cliente | `origem` (menu, sistema_gestao) |
| `curriculo_email_click` | Trabalhe Conosco: "Enviar currículo por e-mail" ou "Copiar e-mail" | `acao` (mailto, copiar) |
| `galeria_nr1_open` | Abertura de uma foto da galeria NR-1 | `indice` (1 a 8) |

Sugestão de configuração no GTM:

1. Variáveis da camada de dados para `modal`, `tipo_carga`, `origem_pagina`, `origem`, `unidade`, `email`, `indice` e `site_ambiente`.
2. Acionadores do tipo "Evento personalizado" com os nomes acima. Nos acionadores de conversão, adicione a condição `site_ambiente igual a producao`.
3. GA4: tag de configuração em "All Pages" + tags de evento com os mesmos nomes. Marque `lead_form_submit` e `whatsapp_click` como eventos-chave.
4. Google Ads: conversão em `lead_form_submit` (ou visualização de página de `/obrigado.html`).
5. Meta Pixel: `PageView` em todas as páginas; `Lead` em `lead_form_submit`; `Contact` em `whatsapp_click` e `phone_click`.

**Consentimento (LGPD):** antes do GTM o site define o Consent Mode v2 com tudo negado. O GTM **só é carregado depois que a pessoa clica em Aceitar** (ou se ela já aceitou nos últimos 6 meses). O link "Preferências de cookies" no rodapé reabre o banner.

**CSP:** o `.htaccess` libera só os domínios de GTM, GA4, Meta, Google Ads, Web3Forms (`api.web3forms.com`), Google Maps e YouTube nocookie. Se você adicionar no GTM uma ferramenta de outro domínio (Hotjar, LinkedIn, Clarity etc.), inclua o domínio em `scripts/postbuild.mjs`. Tags do tipo "HTML personalizado" com script inline também precisam de ajuste na CSP.

## 5. Depois de publicar (fora do código)

- GTM: criar o contêiner, colocar o ID em `config.js`, configurar as tags (seção 4) e publicar.
- Web3Forms: fazer um envio real de teste pelo site publicado e conferir a caixa `comercial@goldlinetransportes.com.br` (inclusive o spam na primeira vez).
- Google Search Console: adicionar a propriedade `goldlinecargasaereas.com.br` e enviar `https://goldlinecargasaereas.com.br/sitemap.xml`.
- Google Business Profile: atualizar o site das duas unidades.

## 6. Desenvolvimento e verificação

```bash
npm install
```

```bash
npm run dev
```

```bash
npm run build
```

```bash
npm run preview
```

`npm run preview` serve `dist/` em `http://localhost:4173` com os mesmos cabeçalhos do `.htaccess` (CSP inclusa).

Com o preview rodando:

```bash
npm run verify:shots -- --sections
```

```bash
npm run verify:func
```

`verify:shots` gera capturas em `_verificacao/` (360 a 1920 px; use `--reduced` para movimento reduzido e `--nojs` para JavaScript desativado). `verify:func` testa formulário, WhatsApp, eventos, consentimento, menu, FAQ, galeria e SEO. As requisições ao Web3Forms são sempre interceptadas nos testes (nenhum envio real). Para o teste do GTM, ele espera em `http://localhost:4174` um build com um `GTM_ID` de teste, gerado por `scripts/build-test.sh` em `dist-test/` (o `config.js` é restaurado no fim) e servido com `OUT_DIR=dist-test PORT=4174 node scripts/serve.mjs`.

Os testes usam o Google Chrome instalado em `/Applications`.

## 7. Homologação em subdiretório (opcional, fora do padrão)

O projeto ainda gera uma versão de homologação em subdiretório, se for preciso mostrar uma alteração grande antes de publicar:

```bash
npm run build:novosite
```

```bash
npm run zip:novosite
```

O `goldline-novosite.zip` vai para `public_html/novosite/`. Essa versão tem `noindex` (meta e `X-Robots-Tag`), não tem `robots.txt` nem sitemap e marca `site_ambiente: 'homologacao'`. Depois de aprovar, apague a pasta `novosite` do servidor.
