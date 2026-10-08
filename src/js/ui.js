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
    items.forEach((li) => {
      const c = li.cloneNode(true);
      c.setAttribute('aria-hidden', 'true');
      c.querySelector('img').alt = '';
      row.appendChild(c);
    });
    // ~40s por ciclo, proporcional ao número de logos
    row.style.setProperty('--marquee-dur', `${Math.round(items.length * 2.6)}s`);
  });
  box.classList.add('is-marquee');
  new IntersectionObserver(([en]) => box.classList.toggle('is-paused', !en.isIntersecting)).observe(box);
}

// Iframes do Google Maps só quando o card se aproxima da tela
export function initLazyMaps() {
  const els = document.querySelectorAll('[data-gmap]');
  if (!els.length) return;
  const load = (el) => {
    const f = document.createElement('iframe');
    f.src = el.dataset.gmap;
    f.title = el.dataset.title;
    f.loading = 'lazy';
    f.referrerPolicy = 'no-referrer-when-downgrade';
    el.appendChild(f);
  };
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => { if (en.isIntersecting) { load(en.target); io.unobserve(en.target); } });
  }, { rootMargin: '200px 0px' });
  els.forEach((el) => io.observe(el));
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

// WhatsApp flutuante some quando o botão de envio do formulário está visível
export function initWaFloat() {
  const fab = document.querySelector('.wa-float');
  const submit = document.querySelector('.qform__submit');
  if (!fab || !submit) return;
  new IntersectionObserver(([en]) => fab.classList.toggle('is-hidden', en.isIntersecting), { rootMargin: '0px 0px 40px 0px' }).observe(submit);
}

export function initYear() {
  const y = String(new Date().getFullYear());
  document.querySelectorAll('[data-year]').forEach((el) => { el.textContent = y; });
}
