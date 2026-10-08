# Goldline Transportes v2: publicação e manutenção

Site estático (HTML, CSS e JS) gerado com Vite. O pacote final é `goldline-v2-hostinger.zip`, com o **conteúdo** da pasta `dist/` na raiz (inclui o `.htaccess`).

## 1. Subir na Hostinger

1. **Ative o SSL antes de tudo.** hPanel > Websites > Gerenciar > Segurança > SSL. Espere o status "Ativo". O `.htaccess` força HTTPS: sem SSL o site entra em loop.
2. hPanel > Arquivos > **Gerenciador de Arquivos** > abra `public_html`.
3. Faça backup do conteúdo atual (selecionar tudo > Compactar > baixar) e apague os arquivos antigos.
4. Clique em **Enviar** e envie `goldline-v2-hostinger.zip`.
5. Clique com o botão direito no zip > **Extrair** > destino `public_html` (não crie subpasta). Apague o zip depois.
6. Confira se o `.htaccess` está em `public_html` (no Gerenciador, ative "Mostrar arquivos ocultos").
7. Teste: `https://goldlinetransportes.com.br`, `https://www.goldlinetransportes.com.br` (deve redirecionar para sem www), `/politica-de-privacidade.html`, uma URL inexistente (página 404) e o envio do formulário.

## 2. Trocar valores e gerar de novo

Tudo que o cliente ainda vai confirmar está em **`src/js/config.js`**, com comentário `TODO`:

| Constante | O que é | Efeito quando vazio |
|---|---|---|
| `SITE_URL` | Domínio final (TODO 3) | Usado em canonical, Open Graph, JSON-LD, sitemap e robots |
| `GTM_ID` | ID do Google Tag Manager, ex.: `GTM-ABC1234` (TODO 13) | GTM não é carregado |
| `FORMSPREE_ID` | ID do formulário no Formspree (TODO 14) | Formulário mostra erro e oferece envio pelo WhatsApp |
| `AREA_CLIENTE_URL` | Link do sistema de rastreamento (hoje `https://goldline.brudam.com.br/site/`) | Link do menu e botão do card "Sistema de gestão" não aparecem |
| `FACEBOOK_URL` | Página do Facebook | Ícone não aparece no rodapé |
| `INSTAGRAM_URL` | Perfil do Instagram | |
| `EMAIL_RH` | E-mail do RH usado na página Trabalhe Conosco | |
| `YOUTUBE_ID` | ID do vídeo institucional (TODO 6) | Bloco de vídeo não aparece na seção Sobre |
| `RAZAO_SOCIAL`, `CNPJ` | Dados do rodapé e da política (TODO 2) | |
| `STATS` | Números da faixa dourada (TODO 1) | |
| `WA` | Números e mensagens de cada botão de WhatsApp | |

Depois de editar:

```bash
npm install
```

```bash
npm run build
```

```bash
npm run zip
```

E repita a seção 1 com o novo `goldline-v2-hostinger.zip`.

Outros pontos de edição:

- Textos das páginas: `index.html`, `politica-de-privacidade.html`, `obrigado.html` e `src/partials/` (cabeçalho, rodapé, formulário).
- Perguntas do FAQ (geram o HTML e o JSON-LD `FAQPage`): `src/data/faq.js`. A 9ª pergunta (seguro de carga) já tem o lugar comentado.
- Política de privacidade: encarregado de dados e data de atualização estão marcados como `[PENDENTE]` em `politica-de-privacidade.html` (TODO 15).
- Registros RNTRC, AFE ANVISA e CTF IBAMA: comentários `TODO 7` em `index.html`, seção Certificações.
- Imagens: as fotos novas ficam em `_novas-imagens/` (hero, solucoes-aereo, solucoes-rodoviario, solucoes-farma, vantagens, sobre, premiacao-nova, logos de parceiros; aceita .jpg, .png ou .webp). Troque o arquivo mantendo o nome e rode `npm run images`.
- Mapas do Google: com aceite de cookies carregam sozinhos; sem aceite aparecem os botões "Ver mapa" e "Abrir no Google Maps".
- Mapa do Brasil: gerado da malha oficial do IBGE por `npm run map` (não editar `src/data/brasil.js` à mão).

## 2.1 Formspree (receber as cotações por e-mail)

O destinatário do e-mail é definido no painel do Formspree, não no código.

1. Crie a conta em https://formspree.io usando `comercial@goldlinetransportes.com.br` (ou adicione esse endereço como e-mail vinculado em Account > Linked Emails).
2. Abra a caixa de entrada desse e-mail e clique no link de verificação enviado pelo Formspree. Sem essa confirmação os envios não são entregues.
3. Em Forms > New Form, crie o formulário "Cotação site" e escolha `comercial@goldlinetransportes.com.br` como destinatário.
4. Copie o ID do formulário: é o trecho final do endpoint `https://formspree.io/f/XXXXXXXX`.
5. Cole o ID em `FORMSPREE_ID` no `src/js/config.js`, rode `npm run build` e `npm run zip` e publique de novo.
6. Faça um envio de teste pelo site e confira o e-mail. O assunto chega como "Pedido de cotação pelo site" (campo oculto `_subject`) e o anti-spam usa o campo `_gotcha`.

## 3. Eventos para configurar no GTM

O código só envia eventos para o `dataLayer`. Nenhuma tag (GA4, Meta Pixel, Google Ads) está no código: tudo é configurado no GTM.

| Evento (`event`) | Quando dispara | Parâmetros |
|---|---|---|
| `lead_form_submit` | Formspree confirmou o envio do formulário (antes de ir para `obrigado.html`) | `modal`, `tipo_carga`, `origem_pagina` |
| `whatsapp_click` | Clique em qualquer link `wa.me` | `origem` (hero, card-aereo, card-rodoviario, card-farma, unidade-fortaleza, unidade-guarulhos, flutuante, cta-final, cotacao, rodape, rodape_fortaleza, rodape_guarulhos, formulario-erro, obrigado) |
| `phone_click` | Clique em telefone (`tel:`) | `unidade` (fortaleza, guarulhos); `origem` nos links do rodapé (rodape_fortaleza, rodape_guarulhos) |
| `email_click` | Clique em e-mail (`mailto:`) | `email` |
| `cta_cotacao_click` | Clique em botão que leva ao formulário | `origem` (header, hero, solucoes, card-aereo, card-rodoviario, card-farma, cta-final, rodape) |
| `area_cliente_click` | Clique na Área do Cliente | `origem` (menu, sistema_gestao) |
| `curriculo_email_click` | Trabalhe Conosco: clique em "Enviar currículo por e-mail" ou "Copiar e-mail" | `acao` (mailto, copiar) |

Sugestão de configuração no GTM:

1. Variáveis da camada de dados para `modal`, `tipo_carga`, `origem_pagina`, `origem`, `unidade`, `email`.
2. Acionadores do tipo "Evento personalizado" com os nomes acima.
3. GA4: tag de configuração em "All Pages" + tags de evento com os mesmos nomes. Marque `lead_form_submit` e `whatsapp_click` como eventos-chave.
4. Google Ads: conversão em `lead_form_submit` (ou visualização de página de `/obrigado.html`).
5. Meta Pixel: `PageView` em todas as páginas; `Lead` em `lead_form_submit`; `Contact` em `whatsapp_click` e `phone_click`.

**Consentimento (LGPD):** antes do GTM o site define o Consent Mode v2 com tudo negado. O GTM **só é carregado depois que a pessoa clica em Aceitar** (ou se ela já aceitou nos últimos 6 meses). Quem recusa não carrega nenhum script de terceiros. O link "Preferências de cookies" no rodapé reabre o banner.

**CSP:** o `.htaccess` libera só os domínios de GTM, GA4, Meta, Google Ads, Formspree, Google Maps e YouTube nocookie. Se você adicionar no GTM uma ferramenta de outro domínio (Hotjar, LinkedIn, Clarity etc.), inclua o domínio em `scripts/postbuild.mjs` e gere de novo. Tags do tipo "HTML personalizado" com script inline também precisam de ajuste na CSP.

## 4. Redirecionar `goldlinecargasaereas.com.br` mantendo o e-mail

O redirecionamento é só do **site** (HTTP). O e-mail depende dos registros **MX, SPF, DKIM e DMARC** no DNS, que não devem ser alterados.

Se o domínio antigo estiver na Hostinger:

1. hPanel > domínio antigo > Arquivos > `public_html`: troque o conteúdo por um `.htaccess` com:

```apache
RewriteEngine On
RewriteCond %{HTTP_HOST} ^(www\.)?goldlinecargasaereas\.com\.br$ [NC]
RewriteRule ^(.*)$ https://goldlinetransportes.com.br/$1 [R=301,L]
```

2. Mantenha o SSL ativo no domínio antigo (sem ele o redirecionamento de `https://` falha).
3. **Não** mude os nameservers nem apague registros MX/TXT do domínio antigo. Antes de qualquer mudança de DNS, exporte a zona (hPanel > Domínios > DNS) como backup.
4. Teste o e-mail (envio e recebimento) logo depois.

Se o domínio antigo estiver em outro provedor, use o redirecionamento 301 do painel desse provedor (redirecionamento "permanente", com caminho preservado), sem tocar na zona de e-mail.

## 5. Depois de publicar (fora do código)

- DNS: domínio apontando para a Hostinger e SSL ativo.
- GTM: criar o contêiner, colocar o ID em `config.js`, configurar as tags (seção 3) e publicar.
- Formspree: criar o formulário, apontar para o e-mail comercial, colocar o ID em `config.js`. No Formspree, ative o filtro de spam e confira se o campo `_gotcha` é reconhecido.
- Google Search Console: adicionar a propriedade, enviar `https://goldlinetransportes.com.br/sitemap.xml` e usar "Mudança de endereço" a partir do domínio antigo.
- Google Business Profile: atualizar o site das duas unidades.

## 6. Desenvolvimento e verificação

```bash
npm run dev
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

`verify:shots` gera capturas em `_verificacao/` (360 a 1920 px; use `--reduced` para movimento reduzido e `--nojs` para JavaScript desativado). `verify:func` testa formulário, WhatsApp, eventos, consentimento, menu, FAQ e SEO. Para os testes de envio com sucesso e GTM, ele espera em `http://localhost:4174` um build com `FORMSPREE_ID` e `GTM_ID` de teste (as requisições são interceptadas e não saem da máquina).

Os testes usam o Google Chrome instalado em `/Applications`.
