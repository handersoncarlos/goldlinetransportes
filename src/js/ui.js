// Comportamentos de interface que não dependem do bundle de animação.

// Header: compacta após 80px, esconde ao descer e volta ao subir; barra de progresso de leitura
export function initHeader() {
  const header = document.getElementById('header');
  const bar = document.querySelector('.progress__bar');
  if (!header) return;
  let lastY = scrollY, ticking = false;
  const update = () => {
    ticking = false;
    const y = scrollY;
    header.classList.toggle('is-compact', y > 80);
    const menuOpen = document.documentElement.classList.contains('menu-open');
    const focusInside = header.contains(document.activeElement) && document.activeElement !== document.body;
    if (!menuOpen && !focusInside && y > 240 && y > lastY + 4) header.classList.add('is-hidden');
    else if (y < lastY - 4 || y <= 240 || menuOpen) header.classList.remove('is-hidden');
    lastY = y;
    if (bar) {
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.style.transform = `scaleX(${max > 0 ? Math.min(y / max, 1) : 0})`;
    }
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  header.addEventListener('focusin', () => header.classList.remove('is-hidden'));
  update();
}

// Menu mobile acessível: aria-expanded, Esc, fecha ao clicar em link, trava a rolagem do fundo
export function initMenu() {
  const btn = document.getElementById('menuBtn');
  const nav = document.getElementById('menu');
  if (!btn || !nav) return;
  const root = document.documentElement;
  const mq = matchMedia('(max-width: 1060px)');

  const setOpen = (open, { focusBtn = false } = {}) => {
    nav.classList.toggle('is-open', open);
    btn.setAttribute('aria-expanded', String(open));
    btn.setAttribute('aria-label', open ? 'Fechar menu' : 'Abrir menu');
    root.classList.toggle('menu-open', open);
    document.body.style.overflow = open ? 'hidden' : '';
    if (open) window.__glLenis?.stop(); else window.__glLenis?.start();
    if (open) nav.querySelector('a')?.focus();
    else if (focusBtn) btn.focus();
  };

  btn.addEventListener('click', () => setOpen(btn.getAttribute('aria-expanded') !== 'true'));
  nav.addEventListener('click', (e) => { if (e.target.closest('a') && nav.classList.contains('is-open')) setOpen(false); });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && nav.classList.contains('is-open')) setOpen(false, { focusBtn: true });
    // Mantém o foco dentro do painel enquanto aberto
    if (e.key === 'Tab' && nav.classList.contains('is-open')) {
      const items = [btn, ...nav.querySelectorAll('a')];
      const first = items[0], last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  mq.addEventListener('change', () => { if (!mq.matches) setOpen(false); });
}

// FAQ: botão com aria-expanded controlando a região. A animação de altura é registrada pelo motion.js.
export function initFaq() {
  const root = document.querySelector('[data-faq]');
  if (!root) return;
  root.querySelectorAll('.faq__panel').forEach((p) => { p.hidden = true; });
  root.addEventListener('click', (e) => {
    const btn = e.target.closest('.faq__btn');
    if (!btn) return;
    const panel = document.getElementById(btn.getAttribute('aria-controls'));
    const open = btn.getAttribute('aria-expanded') !== 'true';
    btn.setAttribute('aria-expanded', String(open));
    const anim = window.__glFaqAnim;
    if (anim) anim(panel, open);
    else panel.hidden = !open;
  });
}

// Faixas de logos de clientes em loop (desligadas com movimento reduzido)
export function initClients(reduced) {
  const box = document.querySelector('[data-clients]');
  if (!box || reduced) return;
  box.querySelectorAll('.clients__row').forEach((row) => {
    const items = [...row.children];
    // Clones via HTML (e não cloneNode): assim o loading="lazy" vale desde a criação e as
    // imagens não são baixadas antes de a faixa chegar perto da tela
    const copy = items.map((li) => li.outerHTML.replace('<li class="client"', '<li class="client" aria-hidden="true"').replace(/alt="[^"]*"/, 'alt=""')).join('');
    row.insertAdjacentHTML('beforeend', copy);
    // ~80s por ciclo (metade da velocidade inicial), proporcional ao número de logos
    row.style.setProperty('--marquee-dur', `${Math.round(items.length * 5.2)}s`);
  });
  box.classList.add('is-marquee');
  new IntersectionObserver(([en]) => box.classList.toggle('is-paused', !en.isIntersecting)).observe(box);
}

// Google Maps (grava cookies do Google):
// com aceite, o iframe carrega sozinho quando o card se aproxima da tela;
// sem aceite, fica o placeholder com "Ver mapa" (carrega só aquele card) e "Abrir no Google Maps".
export function initLazyMaps() {
  const els = [...document.querySelectorAll('[data-gmap]')];
  if (!els.length) return;
  const load = (el) => {
    if (el.classList.contains('is-loaded')) return;
    const f = document.createElement('iframe');
    f.src = el.dataset.gmap;
    f.title = el.dataset.title;
    f.loading = 'lazy';
    f.referrerPolicy = 'no-referrer-when-downgrade';
    el.appendChild(f);
    el.classList.add('is-loaded');
  };
  let io = null;
  const auto = () => {
    if (io) return;
    io = new IntersectionObserver((entries) => {
      entries.forEach((en) => { if (en.isIntersecting) { load(en.target); io.unobserve(en.target); } });
    }, { rootMargin: '200px 0px' });
    els.forEach((el) => io.observe(el));
  };
  els.forEach((el) => el.querySelector('[data-gmap-load]')?.addEventListener('click', () => load(el)));
  if (window.__glConsent === 'granted') auto();
  document.addEventListener('gl:consent', (e) => { if (e.detail === 'granted') auto(); });
}

// Vídeo do YouTube (nocookie) carregado só no clique
export function initVideo() {
  document.querySelectorAll('[data-yt]').forEach((box) => {
    box.querySelector('button')?.addEventListener('click', () => {
      const f = document.createElement('iframe');
      f.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(box.dataset.yt)}?autoplay=1&rel=0`;
      f.title = 'Vídeo institucional da Goldline';
      f.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture';
      f.allowFullscreen = true;
      box.replaceChildren(f);
      f.focus();
    }, { once: true });
  });
}

// WhatsApp flutuante e "voltar ao topo" somem quando o botão de envio do formulário está visível
export function initWaFloat() {
  const fabs = document.querySelectorAll('.wa-float, .to-top');
  const submit = document.querySelector('.qform__submit');
  if (!fabs.length || !submit) return;
  new IntersectionObserver(([en]) => fabs.forEach((f) => f.classList.toggle('is-hidden', en.isIntersecting)), { rootMargin: '0px 0px 40px 0px' }).observe(submit);
}

// Voltar ao topo: aparece depois de 600px de rolagem
export function initToTop() {
  const btn = document.getElementById('toTop');
  if (!btn) return;
  let ticking = false;
  const update = () => { ticking = false; btn.classList.toggle('is-visible', scrollY > 600); };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; requestAnimationFrame(update); } }, { passive: true });
  update();
  btn.addEventListener('click', () => {
    const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;
    if (window.__glLenis) window.__glLenis.scrollTo(0, { duration: 1.1 });
    else window.scrollTo({ top: 0, behavior: reduced ? 'auto' : 'smooth' });
    document.querySelector('.header .logo')?.focus({ preventScroll: true });
  });
}

// Botão "Copiar e-mail" ([data-copy]) com retorno "E-mail copiado"
export function initCopy(onCopy) {
  document.querySelectorAll('[data-copy]').forEach((btn) => {
    const label = btn.querySelector('[data-copy-label]') || btn;
    const original = label.textContent;
    const status = document.getElementById(btn.getAttribute('aria-describedby') || '');
    btn.addEventListener('click', async () => {
      const text = btn.dataset.copy;
      let ok = false;
      try { await navigator.clipboard.writeText(text); ok = true; } catch {
        // Alternativa: seleciona o texto visível para o usuário copiar
        const el = document.getElementById(btn.dataset.copyTarget || '');
        if (el) { const r = document.createRange(); r.selectNodeContents(el); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); ok = document.execCommand?.('copy') ?? false; }
      }
      label.textContent = ok ? 'E-mail copiado' : 'Selecione e copie o e-mail';
      if (status) status.textContent = label.textContent;
      onCopy?.(btn);
      setTimeout(() => { label.textContent = original; }, 2500);
    });
  });
}

export function initYear() {
  const y = String(new Date().getFullYear());
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = y; });
}

// Fotos grandes e longe do topo: carregam quando chegam a 400px da tela (o lazy nativo antecipa
// demais e atrasa a primeira tela no celular). Sem JS, o <noscript> ao lado tem a imagem normal.
export function initDeferredImages() {
  const imgs = document.querySelectorAll('img[data-defer]');
  if (!imgs.length) return;
  const load = (img) => {
    if (img.dataset.sizes) img.sizes = img.dataset.sizes;
    if (img.dataset.srcset) img.srcset = img.dataset.srcset;
    img.src = img.dataset.src;
    img.removeAttribute('data-defer');
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { load(en.target); io.unobserve(en.target); } });
  }, { rootMargin: '400px 0px' });
  imgs.forEach((img) => io.observe(img));
}
