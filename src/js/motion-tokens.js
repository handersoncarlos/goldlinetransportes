// Tokens de movimento (GSAP). Os de CSS ficam em src/css/tokens.css.
const isSmall = typeof matchMedia === 'function' && matchMedia('(max-width: 767px)').matches;

export const M = {
  dur: 0.7,          // padrão (0,4 a 0,9s)
  durShort: 0.4,
  durLong: 0.9,
  ease: 'power3.out',     // padrão
  easeReveal: 'expo.out', // revelações
  stagger: 0.08,
  staggerTight: 0.06,
  dist: isSmall ? 20 : 32, // deslocamento: 16 a 24px no mobile, 24 a 40px no desktop
};
