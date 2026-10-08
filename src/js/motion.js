// Animações (carregado em chunk separado depois do conteúdo principal).
// Regras: só transform, opacity, clip-path (e o eixo wdth da fonte nos títulos "4x" e H1);
// entradas rodam uma vez; com prefers-reduced-motion este arquivo nem é baixado.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger, SplitText, MotionPathPlugin);

// Tokens de movimento
const isSmall = matchMedia('(max-width: 767px)').matches;
export const M = {
  dur: 0.7,        // padrão
  durShort: 0.4,
  durLong: 0.9,
  ease: 'power3.out',
  easeReveal: 'expo.out',
  stagger: 0.08,
  staggerTight: 0.06,
  dist: isSmall ? 20 : 32,
};

const $ = (s, c = document) => c.querySelector(s);
const $$ = (s, c = document) => [...c.querySelectorAll(s)];
const once = (trigger, start = 'top 82%') => ({ trigger, start, once: true });
const fmt = (n, dec) => n.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });

let lenis = null;

function initLenis() {
  lenis = new Lenis({ lerp: 0.1 });
  window.__glLenis = lenis;
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);

  // Âncoras internas com offset do header
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
    const id = a.getAttribute('href');
    const target = id.length > 1 ? document.getElementById(id.slice(1)) : null;
    if (!target) return;
    e.preventDefault();
    const header = $('#header');
    const offset = target.id === 'topo' ? 0 : -((header?.offsetHeight || 60) + 8);
    lenis.scrollTo(target, {
      offset,
      duration: 1.1,
      onComplete: () => {
        if (!target.hasAttribute('tabindex') && !target.matches('a,button,input,select,textarea')) target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      },
    });
    history.replaceState(null, '', id);
  });
}

// Hero ------------------------------------------------------------------------
function hero() {
  const title = $('.hero__title');
  if (!title) return;

  SplitText.create(title, {
    type: 'lines',
    mask: 'lines',
    linesClass: 'hero__line',
    autoSplit: true,
    onSplit(self) {
      gsap.set(title, { visibility: 'visible' });
      // Sublinhado dourado sob "todo o Brasil": um traço por linha, do primeiro ao último trecho dourado
      const paths = self.lines.map((line) => {
        const gs = $$('.g', line);
        if (!gs.length) return null;
        const lr = line.getBoundingClientRect();
        const a = gs[0].getBoundingClientRect();
        const z = gs[gs.length - 1].getBoundingClientRect();
        line.insertAdjacentHTML('beforeend', '<svg class="hl" viewBox="0 0 100 10" preserveAspectRatio="none" aria-hidden="true"><path d="M1 7 C 30 2.5, 70 2.5, 99 5.5" pathLength="1"/></svg>');
        const svg = line.lastElementChild;
        svg.style.left = `${a.left - lr.left}px`;
        svg.style.width = `${z.right - a.left}px`;
        return svg.querySelector('path');
      }).filter(Boolean);
      return gsap.timeline()
        .from(self.lines, { yPercent: 110, duration: 0.62, stagger: M.staggerTight, ease: M.easeReveal })
        .fromTo(title, { fontStretch: '62%' }, { fontStretch: '72%', duration: 0.8, ease: M.ease }, 0)
        .fromTo(paths, { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 0.45, ease: 'power2.inOut' }, 0.75);
    },
  });

  gsap.timeline({ defaults: { ease: M.ease, duration: M.durShort + 0.1 } })
    .fromTo('.hero__eyebrow', { opacity: 0, y: M.dist / 2 }, { opacity: 1, y: 0 }, 0)
    .fromTo('.hero__sub', { opacity: 0, y: M.dist / 2 }, { opacity: 1, y: 0 }, 0.3)
    .fromTo('.hero__ctas', { opacity: 0, y: M.dist / 2 }, { opacity: 1, y: 0 }, 0.4)
    .fromTo('.hero__tags li', { opacity: 0, y: M.dist / 2 }, { opacity: 1, y: 0, stagger: M.staggerTight }, 0.5)
    .fromTo('.hero .curve circle', { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut', stagger: 0.12 }, 0.1);
}

// Números ---------------------------------------------------------------------
function counters() {
  $$('.count').forEach((el) => {
    const to = parseFloat(el.dataset.to);
    const dec = parseInt(el.dataset.dec || '0', 10);
    const suf = el.dataset.suffix || '';
    const obj = { v: 0 };
    el.textContent = fmt(0, dec) + suf;
    gsap.to(obj, {
      v: to,
      duration: 1.4,
      ease: 'power2.out',
      scrollTrigger: once(el, 'top 88%'),
      onUpdate: () => { el.textContent = fmt(obj.v, dec) + suf; },
    });
  });
  gsap.fromTo('.stat__div', { scaleY: 0 }, { scaleY: 1, duration: M.durLong, ease: M.ease, stagger: M.stagger, scrollTrigger: once('.stats', 'top 85%') });
}

// Entradas genéricas ([data-r]) -----------------------------------------------
function reveals() {
  const items = $$('[data-r]');
  gsap.set(items, { opacity: 0, y: M.dist });
  ScrollTrigger.batch(items, {
    start: 'top 86%',
    once: true,
    onEnter: (batch) => gsap.to(batch, { opacity: 1, y: 0, duration: M.dur, ease: M.ease, stagger: M.stagger, overwrite: true }),
  });
}

// Vantagens -------------------------------------------------------------------
function vantagens() {
  const img = $('[data-adv-img]');
  if (!img) return;
  gsap.timeline({ scrollTrigger: once(img, 'top 78%') })
    .fromTo(img, { clipPath: 'inset(0% 100% 0% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1, ease: M.easeReveal })
    .fromTo('.adv-img__badge .x4', { scale: 0.9, fontStretch: '62%' }, { scale: 1, fontStretch: '72%', duration: M.dur, ease: M.ease }, 0.55);
  gsap.fromTo('.adv', { opacity: 0, y: M.dist / 1.5 }, { opacity: 1, y: 0, duration: M.dur, ease: M.ease, stagger: M.stagger, scrollTrigger: once('.adv-list', 'top 85%') });
}

// Segmentos -------------------------------------------------------------------
function segmentos() {
  gsap.fromTo('.seg', { opacity: 0, x: -M.dist }, { opacity: 1, x: 0, duration: M.dur, ease: M.ease, stagger: M.stagger, scrollTrigger: once('.seg-grid', 'top 88%') });
}

// Certificações + sistema -----------------------------------------------------
function confianca() {
  gsap.fromTo('.cert__check circle, .cert__check path', { strokeDasharray: 1, strokeDashoffset: 1 }, {
    strokeDashoffset: 0, duration: 0.6, ease: 'power2.inOut', stagger: 0.12, scrollTrigger: once('.certs', 'top 85%'),
  });
  const steps = $('[data-steps]');
  if (steps) {
    gsap.fromTo('.steps__fill', { scaleY: 0 }, {
      scaleY: 1, ease: 'none',
      scrollTrigger: { trigger: steps, start: 'top 80%', end: 'bottom 55%', scrub: 0.6 },
    });
  }
}

// Premiações ------------------------------------------------------------------
function premios() {
  gsap.fromTo('.award-photos img', { clipPath: 'inset(0% 0% 100% 0%)' }, {
    clipPath: 'inset(0% 0% 0% 0%)', duration: M.durLong, ease: M.easeReveal, stagger: 0.1, scrollTrigger: once('[data-mosaic]', 'top 82%'),
  });
}

// Unidades: mapa --------------------------------------------------------------
function mapa() {
  const map = $('[data-map]');
  if (!map) return;
  const plane = $('.map__plane', map);
  gsap.set('.map__pulse', { opacity: 0, scale: 1 });
  gsap.timeline({ scrollTrigger: once(map, 'top 75%'), defaults: { ease: M.ease } })
    .fromTo('.map__land', { strokeDasharray: 1, strokeDashoffset: 1, fillOpacity: 0 }, { strokeDashoffset: 0, duration: 1, ease: 'power2.inOut' })
    .to('.map__land', { fillOpacity: 1, duration: 0.5 }, 0.5)
    .fromTo('.map__pt--for', { opacity: 0, scale: 0.4, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 0.35 }, 0.75)
    .set('.map__route-dash', { opacity: 1 }, 1)
    .fromTo('.map__route-mask', { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.2, ease: 'power1.inOut' }, 1)
    .set(plane, { opacity: 1 }, 1)
    .to(plane, {
      duration: 1.2,
      ease: 'power1.inOut',
      motionPath: { path: '#map-route', autoRotate: 45 },
    }, 1)
    .to(plane, { opacity: 0, duration: 0.2 }, 2.1)
    .fromTo('.map__pt--gru', { opacity: 0, scale: 0.4, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 0.3 }, 2.15)
    .fromTo('.map__pulse', { opacity: 0.9, scale: 1 }, { opacity: 0, scale: 3.5, duration: 0.7, ease: 'power2.out' }, 2.25)
    .fromTo('.map__label', { opacity: 0, y: 6 }, { opacity: 1, y: 0, duration: 0.35, stagger: 0.1 }, 2.35);
}

// Cotação ---------------------------------------------------------------------
function cotacao() {
  gsap.fromTo('.fgrid > *', { opacity: 0, y: M.dist / 2 }, { opacity: 1, y: 0, duration: 0.5, ease: M.ease, stagger: 0.05, scrollTrigger: once('.qform', 'top 80%') });
}

// FAQ: altura animada ---------------------------------------------------------
function faq() {
  window.__glFaqAnim = (panel, open) => {
    gsap.killTweensOf(panel);
    if (open) {
      panel.hidden = false;
      gsap.fromTo(panel, { height: 0 }, { height: 'auto', duration: 0.45, ease: M.ease, onComplete: () => { gsap.set(panel, { clearProps: 'height' }); ScrollTrigger.refresh(); } });
    } else {
      gsap.to(panel, { height: 0, duration: 0.35, ease: 'power2.inOut', onComplete: () => { panel.hidden = true; gsap.set(panel, { clearProps: 'height' }); ScrollTrigger.refresh(); } });
    }
  };
}

// CTA final -------------------------------------------------------------------
function ctaFinal() {
  gsap.fromTo('.cta-final .curve circle', { strokeDasharray: 1, strokeDashoffset: 1 }, {
    strokeDashoffset: 0, duration: 1.4, ease: 'power2.inOut', stagger: 0.15, scrollTrigger: once('.cta-final', 'top 75%'),
  });
}

// Parallax (só >= 1024px) ------------------------------------------------------
function parallax(mm) {
  mm.add('(min-width: 1024px)', () => {
    gsap.fromTo('.hero__img', { scale: 1.12, yPercent: 0 }, {
      yPercent: 5, ease: 'none', scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });
    gsap.fromTo('.cta-final__bg img', { yPercent: -6 }, {
      yPercent: 6, ease: 'none', scrollTrigger: { trigger: '.cta-final', start: 'top bottom', end: 'bottom top', scrub: true },
    });
  });
}

export function initMotion() {
  const root = document.documentElement;
  // O fallback do <head> já mostrou tudo: não reanima
  if (!root.classList.contains('mo')) return;

  const mm = gsap.matchMedia();
  initLenis();
  hero();
  counters();
  reveals();
  vantagens();
  segmentos();
  confianca();
  premios();
  mapa();
  cotacao();
  faq();
  ctaFinal();
  parallax(mm);
  root.classList.add('mo-ready');

  // Movimento reduzido ligado durante a visita: desfaz tudo
  mm.add('(prefers-reduced-motion: reduce)', () => {
    lenis?.destroy();
    window.__glLenis = null;
    gsap.globalTimeline.getChildren().forEach((t) => t.progress(1));
    ScrollTrigger.getAll().forEach((st) => st.kill());
    root.classList.remove('mo');
  });

  document.fonts?.ready.then(() => ScrollTrigger.refresh());
  addEventListener('load', () => ScrollTrigger.refresh(), { once: true });
}
