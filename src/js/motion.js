// Animações (carregado em chunk separado depois do conteúdo principal).
// Regras: só transform, opacity, clip-path (e o eixo wdth da fonte no "4x"); o hero fica em intro.js;
// entradas rodam uma vez; com prefers-reduced-motion este arquivo nem é baixado.
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { MotionPathPlugin } from 'gsap/MotionPathPlugin';
import Lenis from 'lenis';
import { M } from './motion-tokens.js';

gsap.registerPlugin(ScrollTrigger, MotionPathPlugin);

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

  // Âncoras internas (offset do header vem do scroll-padding-top)
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey) return;
    const id = a.getAttribute('href');
    const target = id.length > 1 ? document.getElementById(id.slice(1)) : null;
    if (!target) return;
    e.preventDefault();
    // O Lenis já desconta o scroll-padding-top do <html> (altura do header): sem offset extra
    lenis.scrollTo(target, {
      duration: 1.1,
      onComplete: () => {
        if (!target.hasAttribute('tabindex') && !target.matches('a,button,input,select,textarea')) target.setAttribute('tabindex', '-1');
        target.focus({ preventScroll: true });
      },
    });
    history.replaceState(null, '', id);
  });
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
  gsap.fromTo('.partners li', { opacity: 0, y: M.dist / 2 }, { opacity: 1, y: 0, duration: M.durShort + 0.1, ease: M.ease, stagger: M.stagger, scrollTrigger: once('.partners', 'top 90%') });
  gsap.fromTo('.award-photos img', { clipPath: 'inset(0% 0% 100% 0%)' }, {
    clipPath: 'inset(0% 0% 0% 0%)', duration: M.durLong, ease: M.easeReveal, stagger: 0.1, scrollTrigger: once('[data-mosaic]', 'top 82%'),
  });
}

// Unidades: mapa --------------------------------------------------------------
function mapa() {
  const map = $('[data-map]');
  if (!map) return;
  const plane = $('.map__plane', map);
  const dash = $('.map__route-dash', map);
  // Tracejado que "se desenha": o dasharray cresce com o progresso (mesma base de comprimento do avião)
  const L = dash.getTotalLength();
  const D = 5, G = 5;
  const route = { p: 0 };
  const drawDash = () => {
    const len = route.p * L;
    const n = Math.floor(len / (D + G));
    const arr = [];
    for (let i = 0; i < n; i++) arr.push(D, G);
    arr.push(Math.min(len - n * (D + G), D), L);
    dash.style.strokeDasharray = arr.join(' ');
  };
  drawDash();
  gsap.set('.map__pulse', { opacity: 0, scale: 1, transformOrigin: '50% 50%' });
  gsap.timeline({ scrollTrigger: once(map, 'top 75%'), defaults: { ease: M.ease } })
    .fromTo('.map__land', { strokeDasharray: 1, strokeDashoffset: 1, fillOpacity: 0 }, { strokeDashoffset: 0, duration: 1, ease: 'power2.inOut' })
    .to('.map__land', { fillOpacity: 1, duration: 0.5 }, 0.5)
    .fromTo('.map__pt--for', { opacity: 0, scale: 0.4, transformOrigin: '50% 50%' }, { opacity: 1, scale: 1, duration: 0.35 }, 0.75)
    .set(dash, { opacity: 1 }, 1)
    .to(route, { p: 1, duration: 1.2, ease: 'power1.inOut', onUpdate: drawDash, onComplete: () => { dash.style.strokeDasharray = ''; } }, 1)
    .set(plane, { opacity: 1 }, 1)
    .to(plane, {
      duration: 1.2,
      ease: 'power1.inOut',
      motionPath: { path: '#map-route', align: '#map-route', alignOrigin: [0.5, 0.5], autoRotate: 45 },
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
