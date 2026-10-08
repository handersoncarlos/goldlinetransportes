import { defineConfig } from 'vite';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import * as cfg from './src/js/config.js';
import { FAQ } from './src/data/faq.js';
import { VIEWBOX, BRASIL_PATH, CIDADES } from './src/data/brasil.js';

const root = import.meta.dirname;
const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const fmt = (n, dec) => n.toLocaleString('pt-BR', { minimumFractionDigits: dec, maximumFractionDigits: dec });

// Blocos gerados no build ------------------------------------------------------

function renderStats() {
  return cfg.STATS.map(
    (s) => `<div class="stat"><p class="stat__num">${esc(s.prefix)}<span class="count" data-to="${s.value}" data-dec="${s.decimals}" data-suffix="${esc(s.suffix)}">${fmt(s.value, s.decimals)}${esc(s.suffix)}</span></p><p class="stat__label">${esc(s.label)}</p><span class="stat__div" aria-hidden="true"></span></div>`
  ).join('\n      ');
}

function renderFaq() {
  const item = (f, i) => `<div class="faq__item">
          <h3 class="faq__q"><button type="button" class="faq__btn" id="faq-b${i}" aria-expanded="false" aria-controls="faq-p${i}">${esc(f.q)}<span class="faq__icon" aria-hidden="true"></span></button></h3>
          <div class="faq__panel" id="faq-p${i}" role="region" aria-labelledby="faq-b${i}">${f.todo ? `<!-- ${f.todo} -->` : ''}<p>${esc(f.a)}</p></div>
        </div>`;
  const half = Math.ceil(FAQ.length / 2);
  const cols = [FAQ.slice(0, half), FAQ.slice(half)];
  return cols
    .map((col, c) => `<div class="faq__col">\n        ${col.map((f, i) => item(f, c * half + i + 1)).join('\n        ')}\n      </div>`)
    .join('\n      ');
}

function faqJsonLd() {
  return JSON.stringify({
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: FAQ.map((f) => ({ '@type': 'Question', name: f.q, acceptedAnswer: { '@type': 'Answer', text: f.a } })),
  });
}

function renderMap() {
  const f = CIDADES.fortaleza, g = CIDADES.guarulhos;
  // Arco da rota: curva quadrática com controle deslocado para o interior (perpendicular ao segmento)
  const mx = (f.x + g.x) / 2, my = (f.y + g.y) / 2;
  const dx = g.x - f.x, dy = g.y - f.y, len = Math.hypot(dx, dy);
  const off = len * 0.32;
  const cx = +(mx + (dy / len) * off).toFixed(1), cy = +(my - (dx / len) * off).toFixed(1);
  const route = `M${f.x} ${f.y}Q${cx} ${cy} ${g.x} ${g.y}`;
  const [vw, vh] = VIEWBOX.split(' ').slice(2).map(Number);
  const pct = (v, t) => ((v / t) * 100).toFixed(2) + '%';
  return `<div class="map" data-map>
        <svg class="map__svg" viewBox="${VIEWBOX}" role="img" aria-labelledby="map-title">
          <title id="map-title">Mapa do Brasil com a rota entre a matriz em Fortaleza/CE e a filial em Guarulhos/SP</title>
          <path class="map__land" d="${BRASIL_PATH}" pathLength="1"/>
          <path class="map__route" id="map-route" d="${route}"/>
          <path class="map__route-dash" d="${route}"/>
          <g class="map__pt map__pt--for"><circle class="map__halo" cx="${f.x}" cy="${f.y}" r="9"/><circle class="map__dot" cx="${f.x}" cy="${f.y}" r="4.5"/></g>
          <g class="map__pt map__pt--gru"><circle class="map__pulse" cx="${g.x}" cy="${g.y}" r="4.5"/><circle class="map__halo" cx="${g.x}" cy="${g.y}" r="9"/><circle class="map__dot" cx="${g.x}" cy="${g.y}" r="4.5"/></g>
          <g class="map__plane" aria-hidden="true"><path transform="scale(.62) translate(-12 -12)" d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/></g>
        </svg>
        <p class="map__label map__label--for" style="left:${pct(f.x, vw)};top:${pct(f.y, vh)}"><b>Matriz</b> Fortaleza/CE</p>
        <p class="map__label map__label--gru" style="left:${pct(g.x, vw)};top:${pct(g.y, vh)}"><b>Filial</b> Guarulhos/SP</p>
      </div>`;
}

// Plugin de template -----------------------------------------------------------
// <!--include:nome-->           insere src/partials/nome.html
// <!--if:CHAVE--> ... <!--/if:CHAVE-->       mantém só se a chave do config.js tiver valor
// <!--ifnot:CHAVE--> ... <!--/ifnot:CHAVE--> mantém só se a chave estiver vazia
// {{CHAVE}}  valor do config.js     {{wa:origem}} link do WhatsApp     {{HOME}} prefixo da home
function template() {
  return {
    name: 'goldline-template',
    transformIndexHtml: {
      order: 'pre',
      handler(html, ctx) {
        const page = ctx.filename.split('/').pop();
        const isHome = page === 'index.html';
        for (let n = 0; n < 4; n++) {
          html = html.replace(/<!--include:([\w-]+)-->/g, (_, name) => readFileSync(resolve(root, `src/partials/${name}.html`), 'utf8'));
        }
        html = html.replace(/<!--if:(\w+)-->([\s\S]*?)<!--\/if:\1-->/g, (_, k, body) => (cfg[k] ? body : ''));
        html = html.replace(/<!--ifnot:(\w+)-->([\s\S]*?)<!--\/ifnot:\1-->/g, (_, k, body) => (cfg[k] ? '' : body));
        html = html.replace(/\{\{wa:([\w-]+)\}\}/g, (_, k) => {
          const w = cfg.WA[k];
          if (!w) throw new Error(`WhatsApp sem configuração: ${k}`);
          return esc(cfg.waLink(w.numero, w.msg));
        });
        const vars = {
          HOME: isHome ? '' : './',
          YEAR: String(new Date().getFullYear()),
          STATS: renderStats(),
          FAQ: renderFaq(),
          FAQ_JSONLD: faqJsonLd(),
          MAP: renderMap(),
        };
        html = html.replace(/\{\{(\w+)\}\}/g, (m, k) => {
          if (k in vars) return vars[k];
          if (k in cfg && typeof cfg[k] === 'string') return esc(cfg[k]);
          throw new Error(`Placeholder desconhecido em ${page}: ${m}`);
        });
        return html;
      },
    },
  };
}

export default defineConfig({
  base: './',
  plugins: [template()],
  build: {
    target: 'es2020',
    assetsInlineLimit: 0,
    rollupOptions: {
      output: {
        // Núcleo do GSAP num chunk próprio, compartilhado pela entrada do hero e pelo motion.js
        manualChunks(id) {
          if (/node_modules\/gsap\/(index|gsap-core|CSSPlugin)\.js/.test(id)) return 'gsap-core';
        },
      },
      input: {
        index: resolve(root, 'index.html'),
        politica: resolve(root, 'politica-de-privacidade.html'),
        obrigado: resolve(root, 'obrigado.html'),
        trabalhe: resolve(root, 'trabalhe-conosco.html'),
      },
    },
  },
});
