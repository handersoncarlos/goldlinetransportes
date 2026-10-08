// Depois do vite build: gera .htaccess (CSP com hash dos scripts inline), robots.txt e sitemap.xml em dist/.
import { readFile, writeFile, readdir, rm } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { SITE_URL, YOUTUBE_ID } from '../src/js/config.js';

const DIST = process.env.DIST || 'dist';
const htmlFiles = (await readdir(DIST)).filter((f) => f.endsWith('.html'));
const assets = await readdir(`${DIST}/assets`);

// 1. CSS embutido no <head> (evita o recurso que bloqueia a renderização) e
// 2. modulepreload do chunk de entrada do hero e das dependências dele (baixa em paralelo com o main)
const introFile = assets.find((f) => /^intro-.*\.js$/.test(f));
const introDeps = introFile
  ? [...(await readFile(`${DIST}/assets/${introFile}`, 'utf8')).matchAll(/(?:from|import)\s*"\.\/([^"]+\.js)"/g)].map((m) => m[1])
  : [];
for (const f of htmlFiles) {
  let html = await readFile(`${DIST}/${f}`, 'utf8');
  const links = [...html.matchAll(/<link rel="stylesheet"[^>]*href="\.\/assets\/([^"]+\.css)"[^>]*>/g)];
  for (const [tag, file] of links) {
    const css = (await readFile(`${DIST}/assets/${file}`, 'utf8')).replaceAll('url(../', 'url(./');
    html = html.replace(tag, () => `<style>${css}</style>`);
  }
  if (f === 'index.html' && introFile) {
    // Só quando o movimento é permitido (classe .mo do script do <head>); com movimento reduzido nada é baixado
    const list = JSON.stringify([introFile, ...introDeps].map((d) => `./assets/${d}`));
    const pre = `<script>(function(){if(!document.documentElement.classList.contains('mo'))return;${list}.forEach(function(h){var l=document.createElement('link');l.rel='modulepreload';l.crossOrigin='';l.href=h;document.head.appendChild(l);});})();</script>`;
    html = html.replace('</head>', `${pre}\n</head>`);
  }
  await writeFile(`${DIST}/${f}`, html);
}
// O CSS agora está embutido nas páginas
for (const f of assets.filter((a) => a.endsWith('.css'))) await rm(`${DIST}/assets/${f}`);

// Hash de cada <script> inline executável (JSON-LD não executa e não precisa de hash)
const hashes = new Set();
for (const f of htmlFiles) {
  const html = await readFile(`${DIST}/${f}`, 'utf8');
  for (const m of html.matchAll(/<script(?![^>]*\bsrc=)(?![^>]*application\/ld\+json)[^>]*>([\s\S]*?)<\/script>/g)) {
    if (!m[1].trim()) continue;
    hashes.add(`'sha256-${createHash('sha256').update(m[1], 'utf8').digest('base64')}'`);
  }
}


const GA = ['https://www.googletagmanager.com', 'https://www.google-analytics.com', 'https://*.google-analytics.com', 'https://*.analytics.google.com'];
const META = ['https://connect.facebook.net', 'https://www.facebook.com'];
// Google Ads (configurado no GTM): sem estes domínios a tag de conversão é bloqueada
const ADS = ['https://www.googleadservices.com', 'https://googleads.g.doubleclick.net'];

const csp = [
  "default-src 'self'",
  `script-src 'self' ${[...hashes].join(' ')} ${[...GA, ...META, ...ADS, 'https://formspree.io'].join(' ')}`,
  `connect-src 'self' ${[...GA, ...META, ...ADS, 'https://www.google.com', 'https://formspree.io'].join(' ')}`,
  `img-src 'self' data: ${[...GA, ...META, ...ADS, 'https://www.google.com', 'https://www.google.com.br', YOUTUBE_ID ? 'https://i.ytimg.com' : ''].filter(Boolean).join(' ')}`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "frame-src https://www.google.com https://www.youtube-nocookie.com https://www.googletagmanager.com https://td.doubleclick.net",
  "form-action 'self' https://formspree.io",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  'upgrade-insecure-requests',
].join('; ');

const tpl = await readFile('scripts/htaccess.template', 'utf8');
await writeFile(`${DIST}/.htaccess`, tpl.replace('__CSP__', csp));

await writeFile(`${DIST}/robots.txt`, `User-agent: *
Allow: /

Sitemap: ${SITE_URL}/sitemap.xml
`);

const today = new Date().toISOString().slice(0, 10);
await writeFile(`${DIST}/sitemap.xml`, `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  <url><loc>${SITE_URL}/</loc><lastmod>${today}</lastmod><priority>1.0</priority></url>
  <url><loc>${SITE_URL}/trabalhe-conosco.html</loc><lastmod>${today}</lastmod><priority>0.5</priority></url>
  <url><loc>${SITE_URL}/politica-de-privacidade.html</loc><lastmod>${today}</lastmod><priority>0.3</priority></url>
</urlset>
`);

console.log(`postbuild: .htaccess (${hashes.size} hash de script inline), robots.txt e sitemap.xml em ${DIST}/`);
