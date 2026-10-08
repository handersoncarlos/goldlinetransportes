import '../css/main.css';
import { initConsent } from './consent.js';
import { captureUtm, initClickTracking } from './tracking.js';
import { initForm } from './form.js';
import { initHeader, initMenu, initFaq, initClients, initLazyMaps, initVideo, initWaFloat, initYear } from './ui.js';

const root = document.documentElement;
const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

captureUtm();
initConsent();
const prefill = initForm();
initClickTracking((a) => prefill?.(a));
initHeader();
initMenu();
initFaq();
initClients(reduced);
initLazyMaps();
initVideo();
initWaFloat();
initYear();

// Bundle de animação (GSAP + Lenis) em chunk separado, carregado depois do conteúdo principal.
// Com movimento reduzido ele nem é baixado.
if (root.classList.contains('mo') && document.querySelector('.hero')) {
  // Entrada do hero (chunk pequeno, com modulepreload no HTML) e depois o restante
  import('./intro.js')
    .then((m) => m.heroIntro())
    .then(() => import('./motion.js'))
    .then((m) => m.initMotion())
    .catch(() => root.classList.remove('mo'));
} else {
  root.classList.remove('mo');
}
