// Testes funcionais com Playwright (Chrome do sistema).
// Uso: node scripts/verify-functional.mjs <url do build normal> <url do build de teste com FORMSPREE_ID e GTM_ID>
import { chromium } from 'playwright-core';
import { WA } from '../src/js/config.js';

const [BASE = 'http://localhost:4173/', TEST = 'http://localhost:4174/'] = process.argv.slice(2);
const browser = await chromium.launch({ executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' });
const results = [];
const check = (name, ok, detail = '') => { results.push({ ok: !!ok, name, detail }); };

async function newPage(opts = {}) {
  const ctx = await browser.newContext({ viewport: { width: opts.width || 1366, height: 900 }, reducedMotion: opts.reduced ? 'reduce' : 'no-preference' });
  const page = await ctx.newPage();
  page.errors = [];
  page.on('pageerror', (e) => page.errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') page.errors.push(m.text()); });
  return { ctx, page };
}
const dl = (page) => page.evaluate(() => window.dataLayer.filter((e) => e && e.event && !String(e.event).startsWith('gtm.')).map((e) => ({ ...e })));
const fill = async (page, data) => { for (const [k, v] of Object.entries(data)) await page.fill(`[name="${k}"]`, v); };
const VALID = { nome: 'Teste Silva', empresa: 'Empresa Teste', telefone: '85999990000', email: 'teste@exemplo.com', origem: 'Fortaleza/CE', destino: 'Recife/PE', peso: '120', observacoes: 'Teste automatizado' };

// 1. Validação, honeypot e envio rápido (build normal) ----------------------------------------------
{
  const { ctx, page } = await newPage();
  await page.goto(BASE);
  await page.click('[data-consent="denied"]');
  await page.evaluate(() => document.getElementById('cotacao').scrollIntoView());
  await page.waitForTimeout(1200);
  await page.click('.qform__submit');
  const errs = await page.$$eval('.f__err:not([hidden])', (els) => els.map((e) => e.id));
  check('Formulário vazio mostra erro em cada campo obrigatório (8)', errs.length === 8, errs.join(', '));
  check('Foco vai para o primeiro campo inválido', (await page.evaluate(() => document.activeElement.id)) === 'nome');
  const invalidAria = await page.$$eval('[aria-invalid="true"]', (els) => els.length);
  check('aria-invalid marcado nos campos com erro', invalidAria === 8, String(invalidAria));
  await fill(page, { ...VALID, email: 'invalido', telefone: '8599' });
  await page.selectOption('#tipo', 'Outro');
  await page.check('#lgpd');
  await page.click('.qform__submit');
  const errs2 = await page.$$eval('.f__err:not([hidden])', (els) => els.map((e) => e.id));
  check('E-mail e telefone inválidos são recusados', errs2.join() === 'telefone-err,email-err', errs2.join());
  check('Máscara do telefone', (await page.inputValue('#telefone')) === '(85) 99', await page.inputValue('#telefone'));
  await fill(page, VALID);
  check('Máscara do telefone (11 dígitos)', (await page.inputValue('#telefone')) === '(85) 99999-0000', await page.inputValue('#telefone'));
  await page.waitForTimeout(3100);
  // FORMSPREE_ID vazio: fluxo de erro com WhatsApp
  await page.click('.qform__submit');
  await page.waitForSelector('#qformStatus:not([hidden])');
  const waHref = await page.getAttribute('#qformWa', 'href');
  check('FORMSPREE_ID vazio cai no fluxo de erro com botão de WhatsApp', !(await page.isHidden('#qformWa')) && decodeURIComponent(waHref).includes('Nome: Teste Silva'), decodeURIComponent(waHref).slice(0, 80));
  check('Dados permanecem no formulário após erro', (await page.inputValue('#nome')) === 'Teste Silva');
  await ctx.close();
}

// 2. Envio com sucesso, falha, honeypot e envio rápido (build de teste) --------------------------
{
  const { ctx, page } = await newPage();
  let posts = 0;
  await page.route('https://formspree.io/**', (r) => { posts++; r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }); });
  await page.route('https://www.googletagmanager.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
  await page.goto(`${TEST}?utm_source=google&utm_medium=cpc&utm_campaign=teste&gclid=abc123`);
  await page.click('[data-consent="denied"]');
  // Envio rápido demais (antes de 3s)
  await page.evaluate(() => document.getElementById('cotacao').scrollIntoView());
  await fill(page, VALID);
  await page.selectOption('#tipo', 'Outro');
  await page.check('#lgpd');
  await page.click('.qform__submit');
  await page.waitForTimeout(300);
  check('Envio em menos de 3s é bloqueado', posts === 0 && (await page.textContent('.qform__msg')).includes('Aguarde'), await page.textContent('.qform__msg'));
  await page.waitForTimeout(2800);
  // Honeypot
  await page.evaluate(() => { document.getElementById('gotcha').value = 'spam'; });
  await page.click('.qform__submit');
  await page.waitForTimeout(500);
  check('Honeypot preenchido não envia', posts === 0);
  await page.evaluate(() => { document.getElementById('gotcha').value = ''; });
  // Card pré-seleciona modal e registra a origem
  await page.click('a[data-cta="card-aereo"]');
  await page.waitForTimeout(1500);
  check('Card Aéreo pré-seleciona o modal', await page.isChecked('input[name="modal"][value="Aéreo"]'));
  check('origem_pagina registra o card', (await page.inputValue('[name="origem_pagina"]')) === 'card-aereo');
  await page.click('a[data-cta="card-farma"]');
  await page.waitForTimeout(1200);
  check('Card Farma pré-seleciona o tipo de carga', (await page.inputValue('#tipo')) === 'Farmacêutico / químico / perigoso');
  // Sucesso
  const [req] = await Promise.all([
    page.waitForRequest('https://formspree.io/**'),
    page.click('.qform__submit'),
  ]);
  const body = req.postData() || '';
  check('POST para Formspree com Accept JSON', req.method() === 'POST' && req.headers()['accept'] === 'application/json');
  check('UTM e gclid enviados com o formulário', body.includes('google') && body.includes('cpc') && body.includes('abc123'));
  check('Sem campos CNPJ e volumes', !body.includes('name="cnpj"') && !body.includes('name="volumes"'));
  await page.waitForURL('**/obrigado.html');
  check('Sucesso redireciona para obrigado.html', page.url().endsWith('/obrigado.html'));
  const thanksWa = decodeURIComponent(await page.getAttribute('#thanksWa', 'href'));
  check('Obrigado: WhatsApp com o resumo do pedido', thanksWa.includes('Pedido de cotação pelo site') && thanksWa.includes('Teste Silva'), thanksWa.slice(0, 70));
  check('Obrigado: noindex', (await page.getAttribute('meta[name="robots"]', 'content')).includes('noindex'));
  await ctx.close();

  // Evento lead_form_submit (captura antes do redirecionamento)
  const b = await newPage();
  await b.page.route('https://formspree.io/**', (r) => r.fulfill({ status: 200, contentType: 'application/json', body: '{"ok":true}' }));
  await b.page.goto(TEST);
  await b.page.click('[data-consent="denied"]');
  await b.page.evaluate(() => { window.__dlCopy = []; const push = window.dataLayer.push.bind(window.dataLayer); window.dataLayer.push = (...a) => { window.__dlCopy.push(...a); try { sessionStorage.setItem('dlcopy', JSON.stringify(window.__dlCopy.filter((x) => x && x.event))); } catch {} return push(...a); }; });
  await fill(b.page, VALID);
  await b.page.selectOption('#tipo', 'Outro');
  await b.page.check('#lgpd');
  await b.page.waitForTimeout(3100);
  await b.page.click('.qform__submit');
  await b.page.waitForURL('**/obrigado.html');
  const copy = await b.page.evaluate(() => JSON.parse(sessionStorage.getItem('dlcopy') || '[]'));
  const lead = copy.find((e) => e.event === 'lead_form_submit');
  check('lead_form_submit com modal, tipo_carga e origem_pagina', lead && lead.modal === 'Ainda não sei' && lead.tipo_carga === 'Outro' && lead.origem_pagina === 'direto', JSON.stringify(lead));
  await b.ctx.close();

  // Falha
  const f = await newPage();
  await f.page.route('https://formspree.io/**', (r) => r.fulfill({ status: 500, body: 'erro' }));
  await f.page.goto(TEST);
  await f.page.click('[data-consent="denied"]');
  await fill(f.page, VALID);
  await f.page.selectOption('#tipo', 'Outro');
  await f.page.check('#lgpd');
  await f.page.waitForTimeout(3100);
  await f.page.click('.qform__submit');
  await f.page.waitForSelector('#qformWa:not([hidden])');
  check('Falha do Formspree mostra erro e WhatsApp, sem redirecionar', f.page.url().startsWith(TEST) && !f.page.url().includes('obrigado'));
  check('Botão volta ao normal após falha', (await f.page.textContent('.qform__label')) === 'Enviar pedido de cotação');
  const lead2 = (await dl(f.page)).find((e) => e.event === 'lead_form_submit');
  check('Sem lead_form_submit quando o envio falha', !lead2);
  await f.ctx.close();
}

// 3. WhatsApp: números e mensagens ---------------------------------------------------------------
{
  const { ctx, page } = await newPage();
  await page.goto(BASE);
  const links = await page.$$eval('a[href^="https://wa.me/"]', (els) => els.map((a) => ({ o: a.dataset.waOrigem, href: a.getAttribute('href'), blank: a.target === '_blank', rel: a.rel })));
  const expected = { hero: 'hero', 'card-aereo': 'card-aereo', 'card-rodoviario': 'card-rodoviario', 'card-farma': 'card-farma', 'unidade-fortaleza': 'unidade-fortaleza', 'unidade-guarulhos': 'unidade-guarulhos', flutuante: 'flutuante', 'cta-final': 'cta-final' };
  for (const [origem, key] of Object.entries(expected)) {
    const l = links.find((x) => x.o === origem);
    const want = `https://wa.me/${WA[key].numero}?text=${encodeURIComponent(WA[key].msg)}`;
    check(`WhatsApp ${origem}: número e mensagem`, l && l.href === want, l ? decodeURIComponent(l.href) : 'não encontrado');
  }
  check('Todos os links wa.me com target _blank, rel noopener e data-wa-origem', links.every((l) => l.blank && l.rel.includes('noopener') && l.o), `${links.length} links`);
  await ctx.close();
}

// 4. Eventos do dataLayer ------------------------------------------------------------------------
{
  const { ctx, page } = await newPage();
  await page.goto(BASE);
  await page.click('[data-consent="denied"]');
  await page.evaluate(() => {
    addEventListener('click', (e) => { if (e.target.closest('a[href^="https://wa.me"],a[href^="tel:"],a[href^="mailto:"]')) e.preventDefault(); }, true);
    const fire = (sel) => document.querySelector(sel).dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    fire('a[data-wa-origem="hero"]');
    fire('a[href^="tel:"][data-unidade="guarulhos"]');
    fire('a[href="mailto:comercial@goldlinetransportes.com.br"]');
    fire('a[data-cta="hero"]');
  });
  const ev = await dl(page);
  const find = (n) => ev.find((e) => e.event === n);
  check('whatsapp_click com origem', find('whatsapp_click')?.origem === 'hero', JSON.stringify(find('whatsapp_click')));
  check('phone_click com unidade', find('phone_click')?.unidade === 'guarulhos', JSON.stringify(find('phone_click')));
  check('email_click com email', find('email_click')?.email === 'comercial@goldlinetransportes.com.br', JSON.stringify(find('email_click')));
  check('cta_cotacao_click com origem', find('cta_cotacao_click')?.origem === 'hero', JSON.stringify(find('cta_cotacao_click')));
  check('Código não chama gtag("event") nem fbq()', !ev.some((e) => e[0] === 'event'));
  await ctx.close();
}

// 5. Consentimento e scripts de terceiros (build de teste com GTM_ID) -----------------------------
{
  const { ctx, page } = await newPage();
  const third = [];
  page.on('request', (r) => { const h = new URL(r.url()).host; if (!h.startsWith('localhost')) third.push(h); });
  await page.route('https://www.googletagmanager.com/**', (r) => r.fulfill({ status: 200, contentType: 'text/javascript', body: '' }));
  await page.goto(TEST, { waitUntil: 'networkidle' });
  check('Nenhum script de terceiros antes do aceite', third.length === 0, third.join(', '));
  const defaults = await page.evaluate(() => window.dataLayer.filter((e) => e[0] === 'consent').map((e) => [e[1], e[2].analytics_storage]));
  check('Consent Mode: padrão negado antes do GTM', JSON.stringify(defaults) === '[["default","denied"]]', JSON.stringify(defaults));
  check('Banner visível no primeiro acesso', await page.isVisible('#cookie'));
  check('Banner com texto novo e botões Aceitar/Recusar', (await page.textContent('#cookie p')).trim() === 'Usamos cookies para medir o desempenho do site e das campanhas. Você pode aceitar ou recusar.' && (await page.$$('#cookie [data-consent]')).length === 2);
  await page.click('[data-consent="denied"]');
  await page.waitForTimeout(800);
  check('Recusar mantém sem GTM', !third.some((h) => h.includes('googletagmanager')), third.join(', '));
  await page.click('[data-cookie-prefs]');
  check('"Preferências de cookies" reabre o banner', await page.isVisible('#cookie'));
  await page.click('[data-consent="granted"]');
  await page.waitForTimeout(800);
  check('Aceitar carrega o GTM', third.some((h) => h.includes('googletagmanager')));
  const upd = await page.evaluate(() => window.dataLayer.filter((e) => e[0] === 'consent' && e[1] === 'update').map((e) => e[2].ad_storage));
  check('Aceitar envia consent update granted', upd.at(-1) === 'granted', JSON.stringify(upd));
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('gl_consent')));
  check('Escolha salva em localStorage com data', stored?.v === 'granted' && typeof stored.t === 'number');
  // Reabrindo: aplica antes do GTM
  const third2 = [];
  page.on('request', (r) => { if (r.url().includes('googletagmanager')) third2.push(r.url()); });
  await page.reload({ waitUntil: 'networkidle' });
  const order = await page.evaluate(() => window.dataLayer.map((e) => (e[0] === 'consent' ? `consent:${e[1]}` : e.event)).filter(Boolean).slice(0, 3));
  check('Ao voltar: consent update antes do gtm.js e banner oculto', order.join() === 'consent:default,consent:update,gtm.js' && !(await page.isVisible('#cookie')), order.join());
  // Escolha expirada (mais de 6 meses)
  await page.evaluate(() => localStorage.setItem('gl_consent', JSON.stringify({ v: 'granted', t: Date.now() - 190 * 864e5 })));
  await page.reload();
  check('Escolha com mais de 6 meses volta a perguntar', await page.isVisible('#cookie'));
  await ctx.close();
}

// 6. Menu mobile, FAQ, WhatsApp flutuante ---------------------------------------------------------
{
  const { ctx, page } = await newPage({ width: 390 });
  await page.goto(BASE);
  await page.click('#menuBtn');
  check('Menu abre (aria-expanded e painel visível)', (await page.getAttribute('#menuBtn', 'aria-expanded')) === 'true' && (await page.isVisible('#menu a[href="#solucoes"]')));
  check('Menu trava a rolagem do fundo', (await page.evaluate(() => document.body.style.overflow)) === 'hidden');
  await page.keyboard.press('Escape');
  check('Esc fecha o menu e devolve o foco ao botão', (await page.getAttribute('#menuBtn', 'aria-expanded')) === 'false' && (await page.evaluate(() => document.activeElement.id)) === 'menuBtn');
  await page.click('#menuBtn');
  await page.click('#menu a[href="#unidades"]');
  check('Clique em link fecha o menu', (await page.getAttribute('#menuBtn', 'aria-expanded')) === 'false' && (await page.evaluate(() => document.body.style.overflow)) === '');
  await page.waitForTimeout(1500);
  const y = await page.evaluate(() => document.getElementById('unidades').getBoundingClientRect().top);
  check('Âncora rola até a seção com offset do header', y > 40 && y < 110, `top=${Math.round(y)}`);
  // Banner de cookies x botão flutuante
  const overlap = await page.evaluate(() => { const a = document.querySelector('.wa-float').getBoundingClientRect(), b = document.getElementById('cookie').getBoundingClientRect(); return !(a.bottom <= b.top || a.top >= b.bottom || a.right <= b.left || a.left >= b.right); });
  check('Botão do WhatsApp não cobre o banner de cookies (390px)', !overlap);
  await page.click('[data-consent="denied"]');
  // Botão de envio visível: WhatsApp flutuante some
  await page.evaluate(() => document.querySelector('.qform__submit').scrollIntoView({ block: 'center' }));
  await page.waitForTimeout(1500);
  check('Botão flutuante some sobre o botão de envio (390px)', await page.evaluate(() => document.querySelector('.wa-float').classList.contains('is-hidden')));
  // FAQ
  await page.evaluate(() => document.getElementById('faq').scrollIntoView());
  await page.waitForTimeout(800);
  check('FAQ com 8 perguntas, fechadas por padrão', (await page.$$eval('.faq__btn[aria-expanded="false"]', (e) => e.length)) === 8);
  await page.click('#faq-b6');
  await page.waitForTimeout(700);
  check('FAQ abre (aria-expanded true e resposta visível)', (await page.getAttribute('#faq-b6', 'aria-expanded')) === 'true' && (await page.isVisible('#faq-p6 p')));
  await page.click('#faq-b6');
  await page.waitForTimeout(700);
  check('FAQ fecha', (await page.getAttribute('#faq-b6', 'aria-expanded')) === 'false' && (await page.isHidden('#faq-p6 p')));
  check('Sem erros de JS (mobile)', page.errors.length === 0, page.errors.join(' | '));
  await ctx.close();
}

// Hero sem sublinhado e sem selos; conteúdo inteiro na primeira tela em 390px
{
  const { ctx, page } = await newPage({ width: 390 });
  await page.goto(BASE); await page.waitForTimeout(1500);
  const h = await page.evaluate(() => ({ hl: document.querySelectorAll('.hero .hl').length, tags: document.querySelectorAll('.hero__tags').length, ctas: document.querySelector('.hero__ctas').getBoundingClientRect().bottom, vh: innerHeight }));
  check('Hero sem sublinhado e sem selos', h.hl === 0 && h.tags === 0);
  check('Hero inteiro na primeira tela em 390px', h.ctas <= h.vh, JSON.stringify(h));
  await ctx.close();
}

// 7. Movimento reduzido ---------------------------------------------------------------------------
{
  const { ctx, page } = await newPage({ reduced: true });
  const scripts = [];
  page.on('request', (r) => { if (r.url().includes('/assets/motion')) scripts.push(r.url()); });
  await page.goto(BASE, { waitUntil: 'networkidle' });
  check('Movimento reduzido: bundle de animação não é baixado', scripts.length === 0);
  check('Movimento reduzido: sem Lenis e sem marquee', await page.evaluate(() => !document.documentElement.classList.contains('lenis') && !document.querySelector('.clients.is-marquee')));
  const stat = await page.textContent('.stat .count');
  check('Movimento reduzido: números no valor final', stat === '20', stat);
  await ctx.close();
}

// 8. SEO por página -------------------------------------------------------------------------------
{
  const { ctx, page } = await newPage();
  const seen = { t: new Set(), d: new Set() };
  for (const p of ['', 'politica-de-privacidade.html', 'obrigado.html', 'trabalhe-conosco.html']) {
    await page.goto(BASE + p);
    const info = await page.evaluate(() => ({ h1: document.querySelectorAll('h1').length, t: document.title, d: document.querySelector('meta[name="description"]')?.content || '', lang: document.documentElement.lang, can: document.querySelector('link[rel="canonical"]')?.href, dash: document.documentElement.outerHTML.includes(String.fromCharCode(8212)) }));
    check(`${p || 'index.html'}: 1 H1, lang pt-BR, canonical`, info.h1 === 1 && info.lang === 'pt-BR' && !!info.can, `h1=${info.h1}`);
    check(`${p || 'index.html'}: title e description únicos (title ${info.t.length}c, description ${info.d.length}c)`, !seen.t.has(info.t) && !seen.d.has(info.d) && info.d.length >= 100 && info.d.length <= 160 && info.t.length <= 60);
    check(`${p || 'index.html'}: sem travessão`, !info.dash);
    seen.t.add(info.t); seen.d.add(info.d);
  }
  const r404 = await page.goto(BASE + 'nao-existe/qualquer');
  check('404 personalizada com status 404 e visual carregado', r404.status() === 404 && (await page.isVisible('img[alt="Goldline Transportes"]')) && (await page.evaluate(() => document.querySelector('img').naturalWidth > 0)));
  await ctx.close();
}

// 9. Ajustes 01 --------------------------------------------------------------------------------------
{
  const { ctx, page } = await newPage({ width: 1366 });
  await page.goto(BASE);
  const ext = await page.$$eval('a[href^="https://goldline.brudam"], a[href*="facebook.com"], a[href*="instagram.com"]', (els) => els.map((a) => [a.getAttribute('href'), a.target, a.rel]));
  check('Área do Cliente, Facebook e Instagram em nova aba com noopener', ext.length >= 4 && ext.every(([, t, r]) => t === '_blank' && r.includes('noopener')), JSON.stringify(ext));
  check('Área do Cliente no menu e no card Sistema de gestão', (await page.$$('a[data-area-cliente="menu"]')).length === 1 && (await page.$$('a[data-area-cliente="sistema_gestao"]')).length === 1);
  await page.evaluate(() => {
    addEventListener('click', (e) => { if (e.target.closest('a[target="_blank"],a[href^="tel:"]')) e.preventDefault(); }, true);
    const fire = (sel) => document.querySelector(sel).dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    fire('a[data-area-cliente="menu"]'); fire('a[data-area-cliente="sistema_gestao"]');
    fire('a[data-origem="rodape_fortaleza"]'); fire('a[data-wa-origem="rodape_guarulhos"]');
  });
  const ev = await dl(page);
  check('area_cliente_click com origem menu e sistema_gestao', ev.filter((e) => e.event === 'area_cliente_click').map((e) => e.origem).join() === 'menu,sistema_gestao', JSON.stringify(ev.filter((e) => e.event === 'area_cliente_click')));
  check('phone_click e whatsapp_click do rodapé com origem', ev.some((e) => e.event === 'phone_click' && e.origem === 'rodape_fortaleza') && ev.some((e) => e.event === 'whatsapp_click' && e.origem === 'rodape_guarulhos'));
  check('Rodapé sem e-mails nas colunas das unidades', (await page.$$('.footer__contact a[href^="mailto:"]')).length === 0);
  check('Link Trabalhe Conosco no rodapé', (await page.$$('.footer__links a[href="trabalhe-conosco.html"]')).length === 1);
  check('7 segmentos', (await page.$$('.seg')).length === 7);
  check('4 selos, incluindo Polícia Federal em uma linha', await page.evaluate(() => { const b = [...document.querySelectorAll('.cert b')]; const pf = b.find((x) => x.textContent === 'POLÍCIA FEDERAL'); return b.length === 4 && pf && pf.scrollWidth <= pf.clientWidth + 1 && pf.getBoundingClientRect().height < 40; }));
  await page.evaluate(() => document.getElementById('premios').scrollIntoView());
  await page.waitForFunction(() => [...document.querySelectorAll('.partners img')].every((i) => i.complete && i.naturalWidth > 0));
  await page.waitForTimeout(800);
  check('Parceiros: 4 logos na ordem, 2 x 2, até 300px, cantos de 14px, proporção original', await page.evaluate(() => { const i = [...document.querySelectorAll('.partners img')]; const tops = new Set(i.map((x) => Math.round(x.getBoundingClientRect().top))); return i.map((x) => x.alt).join() === 'LATAM Cargo,GOLLOG,Azul Cargo Express,Mercado Livre' && tops.size === 2 && i.every((x) => { const r = x.getBoundingClientRect(); return r.width <= 300 && getComputedStyle(x).borderRadius === '14px' && Math.abs(r.width / r.height - x.naturalWidth / x.naturalHeight) < 0.03; }); }));
  check('Rótulo "Parceiros"', (await page.textContent('.partners-label')).trim() === 'Parceiros');
  // Mapas: placeholder sem aceite, "Ver mapa" carrega só aquele card
  await page.click('[data-consent="denied"]');
  await page.evaluate(() => document.getElementById('unidades').scrollIntoView());
  await page.waitForTimeout(800);
  check('Sem aceite: mapas não carregam sozinhos (placeholder)', (await page.$$('.unit__map iframe')).length === 0 && (await page.isVisible('.unit__ph')));
  const before = await page.evaluate(() => document.querySelector('.unit__map').getBoundingClientRect().height);
  await page.click('.unit:first-child [data-gmap-load]');
  await page.waitForTimeout(300);
  const after = await page.evaluate(() => document.querySelector('.unit__map').getBoundingClientRect().height);
  check('"Ver mapa" carrega só aquele card, sem mudar a altura', (await page.$$('.unit__map iframe')).length === 1 && Math.round(before) === Math.round(after), `${before} -> ${after}`);
  check('Mapas sem filtro de cor', await page.evaluate(() => getComputedStyle(document.querySelector('.unit__map iframe')).filter === 'none'));
  // Logos de clientes inteiros
  const cut = await page.evaluate(() => [...document.querySelectorAll('.client:not([aria-hidden]) img')].filter((img) => { const r = img.getBoundingClientRect(), c = img.closest('.client').getBoundingClientRect(); return r.left < c.left || r.right > c.right || r.top < c.top || r.bottom > c.bottom; }).map((i) => i.alt));
  check('31 logos de clientes inteiros dentro do card', (await page.$$('.client:not([aria-hidden])')).length === 31 && cut.length === 0, cut.join(', '));
  check('Frase de Clientes em uma linha (1366px)', await page.evaluate(() => { const p = document.querySelector('.clients-lead'); return p.getBoundingClientRect().height < parseFloat(getComputedStyle(p).lineHeight) * 1.5; }));
  // Voltar ao topo
  await page.evaluate(() => window.scrollTo(0, 300)); await page.waitForTimeout(400);
  const hiddenAt300 = !(await page.evaluate(() => document.getElementById('toTop').classList.contains('is-visible')));
  await page.evaluate(() => window.scrollTo(0, 2000)); await page.waitForTimeout(600);
  check('Voltar ao topo aparece só depois de 600px', hiddenAt300 && (await page.isVisible('#toTop')));
  const geo = await page.evaluate(() => { const a = document.getElementById('toTop').getBoundingClientRect(), w = document.querySelector('.wa-float').getBoundingClientRect(); return { gap: Math.round(w.top - a.bottom), axis: Math.round((a.left + a.right) / 2 - (w.left + w.right) / 2), size: a.width }; });
  check('Voltar ao topo: 44px, 12px acima do WhatsApp, mesmo eixo', geo.gap === 12 && Math.abs(geo.axis) <= 1 && geo.size === 44, JSON.stringify(geo));
  await page.click('#toTop'); await page.waitForTimeout(1600);
  check('Clique em Voltar ao topo leva ao início', (await page.evaluate(() => scrollY)) < 5);
  await ctx.close();
}
{
  // Aceite carrega os mapas sozinhos; voltar ao topo no mobile não cobre o banner nem o envio
  const { ctx, page } = await newPage({ width: 390 });
  await page.goto(BASE);
  await page.evaluate(() => window.scrollTo(0, 1500)); await page.waitForTimeout(500);
  const ov = await page.evaluate(() => { const a = document.getElementById('toTop').getBoundingClientRect(), b = document.getElementById('cookie').getBoundingClientRect(); return !(a.bottom <= b.top || a.top >= b.bottom || a.right <= b.left || a.left >= b.right); });
  check('Mobile: voltar ao topo não cobre o banner de cookies', !ov);
  await page.click('[data-consent="granted"]');
  await page.evaluate(() => document.getElementById('unidades').scrollIntoView()); await page.waitForTimeout(800);
  await page.evaluate(() => document.querySelectorAll('.unit')[1].scrollIntoView()); await page.waitForTimeout(800);
  check('Depois do aceite: mapas carregam ao rolar', (await page.$$('.unit__map iframe')).length === 2);
  await page.evaluate(() => document.querySelector('.qform__submit').scrollIntoView({ block: 'center' })); await page.waitForTimeout(1200);
  check('Mobile: voltar ao topo some sobre o botão de envio', await page.evaluate(() => getComputedStyle(document.getElementById('toTop')).visibility === 'hidden'));
  check('Parceiros 2 x 2 no mobile, na largura total do conteúdo', await page.evaluate(() => { const i = [...document.querySelectorAll('.partners img')]; const tops = new Set(i.map((x) => Math.round(x.getBoundingClientRect().top))); const ul = document.querySelector('.partners').getBoundingClientRect(); const col = document.querySelector('.partners').parentElement.getBoundingClientRect(); return tops.size === 2 && Math.abs(ul.width - col.width) < 2; }));
  check('Segmentos: mesma altura por linha (mobile)', await page.evaluate(() => { const rows = {}; document.querySelectorAll('.seg').forEach((s) => { const r = s.getBoundingClientRect(); (rows[Math.round(r.top)] ||= []).push(Math.round(r.height)); }); return Object.values(rows).every((h) => new Set(h).size === 1); }));
  await ctx.close();
}
{
  // Trabalhe Conosco
  const { ctx, page } = await newPage({ width: 390 });
  await ctx.grantPermissions(['clipboard-read', 'clipboard-write'], { origin: BASE.replace(/\/$/, '') });
  await page.goto(BASE + 'trabalhe-conosco.html');
  const href = await page.getAttribute('[data-curriculo]', 'href');
  check('Trabalhe Conosco: mailto com assunto codificado', href === 'mailto:rh@goldlinetransportes.com.br?subject=Curr%C3%ADculo%20-%20%5B%C3%81rea%5D%20-%20%5BCidade%5D', href);
  await page.click('[data-copy]');
  await page.waitForTimeout(200);
  check('Copiar e-mail mostra "E-mail copiado"', (await page.textContent('[data-copy-label]')).trim() === 'E-mail copiado');
  check('E-mail copiado para a área de transferência', (await page.evaluate(() => navigator.clipboard.readText())) === 'rh@goldlinetransportes.com.br');
  await page.evaluate(() => { addEventListener('click', (e) => { if (e.target.closest('a[href^="mailto:"]')) e.preventDefault(); }, true); document.querySelector('[data-curriculo]').dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true })); });
  const ev = (await dl(page)).filter((e) => e.event === 'curriculo_email_click').map((e) => e.acao);
  check('curriculo_email_click no botão e na cópia', ev.includes('mailto') && ev.includes('copiar'), ev.join());
  check('Trabalhe Conosco: indexável', !(await page.$('meta[name="robots"]')));
  check('Sem erros de JS (Trabalhe Conosco)', page.errors.length === 0, page.errors.join(' | '));
  const robots = await (await page.request.get(BASE + 'robots.txt')).text();
  const sitemap = await (await page.request.get(BASE + 'sitemap.xml')).text();
  check('robots.txt sem bloqueio do obrigado; sitemap com Trabalhe Conosco', !robots.includes('obrigado') && sitemap.includes('trabalhe-conosco.html'));
  await ctx.close();
}

await browser.close();
const fails = results.filter((r) => !r.ok);
for (const r of results) console.log(`${r.ok ? 'OK  ' : 'FALHA'} ${r.name}${r.detail && !r.ok ? `  [${r.detail}]` : ''}`);
console.log(`\n${results.length - fails.length}/${results.length} verificações passaram`);
process.exit(fails.length ? 1 : 0);
