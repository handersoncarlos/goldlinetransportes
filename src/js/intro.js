// Entrada do H1 e das curvas do hero: chunk pequeno (gsap core + SplitText) com modulepreload no HTML.
// O restante das animações fica em motion.js.
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { M } from './motion-tokens.js';

gsap.registerPlugin(SplitText);

export function heroIntro() {
  const root = document.documentElement;
  const title = document.querySelector('.hero__title');
  if (!title || !root.classList.contains('mo')) return;

  SplitText.create(title, {
    type: 'lines',
    mask: 'lines',
    linesClass: 'hero__line',
    autoSplit: true,
    onSplit(self) {
      gsap.set(title, { visibility: 'visible' });
      return gsap.timeline()
        .from(self.lines, { yPercent: 110, duration: 0.62, stagger: M.staggerTight, ease: M.easeReveal })
        .fromTo(title, { fontStretch: '62%' }, { fontStretch: '72%', duration: 0.8, ease: M.ease }, 0);
    },
  });

  // Eyebrow, subtítulo e CTAs entram por CSS (hero.css) desde o primeiro paint: não dependem deste JS
  gsap.fromTo('.hero .curve circle', { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut', stagger: 0.12, delay: 0.1 });

  root.classList.add('intro-ready');
}
