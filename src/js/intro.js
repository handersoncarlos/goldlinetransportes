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
      // Sublinhado dourado sob "todo o Brasil": um traço por linha, do primeiro ao último trecho dourado
      const paths = self.lines.map((line) => {
        const gs = [...line.querySelectorAll('.g')];
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

  // Eyebrow, subtítulo, CTAs e selos entram por CSS (hero.css) desde o primeiro paint: não dependem deste JS
  gsap.fromTo('.hero .curve circle', { strokeDasharray: 1, strokeDashoffset: 1 }, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut', stagger: 0.12, delay: 0.1 });

  root.classList.add('intro-ready');
}
