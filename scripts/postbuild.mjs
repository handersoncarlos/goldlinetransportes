// Depois do vite build: CSS embutido, .htaccess (CSP com hash dos scripts inline), 404 com a base certa e,
// só na publicação na raiz, robots.txt e sitemap.xml. A base vem de SITE_BASE (scripts/site-env.mjs).
import { readFile, writeFile, readdir, rm } from 'node:fs/promises';
import { BASE, IS_ROOT, HOMOLOG, OUT_DIR } from './site-env.mjs';
import { createHash } from 'node:crypto';
import { SITE_URL, YOUTUBE_ID } from '../src/js/config.js';

const DIST = OUT_DIR;

// 404 independente: troca %BASE% pela base do build
await writeFile(`${DIST}/404.html`, (await readFile(`${DIST}/404.html`, 'utf8')).replaceAll('%BASE%', BASE));
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
  const links = [...html.matchAll(/<link rel="stylesheet"[^>]*href="[^"]*assets\/([^"]+\.css)"[^>]*>/g)];
  for (const [tag, file] of links) {
    // Com base absoluta as url() do CSS já saem com a base (ex.: /novosite/fonts/...)
    const css = await readFile(`${DIST}/assets/${file}`, 'utf8');
    html = html.replace(tag, () => `<style>${css}</style>`);
  }
  if (f === 'index.html' && introFile) {
    // Só quando o movimento é permitido (classe .mo do script do <head>); com movimento reduzido nada é baixado
    const list = JSON.stringify([introFile, ...introDeps].map((d) => `${BASE}assets/${d}`));
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
  `script-src 'self' ${[...hashes].join(' ')} ${[...GA, ...META, ...ADS].join(' ')}`,
  `connect-src 'self' ${[...GA, ...META, ...ADS, 'https://www.google.com', 'https://api.web3forms.com'].join(' ')}`,
  `img-src 'self' data: ${[...GA, ...META, ...ADS, 'https://www.google.com', 'https://www.google.com.br', YOUTUBE_ID ? 'https://i.ytimg.com' : ''].filter(Boolean).join(' ')}`,
  "style-src 'self' 'unsafe-inline'",
  "font-src 'self'",
  "frame-src https://www.google.com https://www.youtube-nocookie.com https://www.googletagmanager.com https://td.doubleclick.net",
  "form-action 'self' https://api.web3forms.com",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'self'",
  'upgrade-insecure-requests',
].join('; ');

const tpl = await readFile('scripts/htaccess.template', 'utf8');
const HOST = new URL(SITE_URL).host;
const rewrite = IS_ROOT
  ? `# ---------------------------------------------------------------------------
# HTTPS e domínio sem www (301): www.${HOST} -> https://${HOST}
# ---------------------------------------------------------------------------
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteCond %{HTTPS} off [OR]
  RewriteCond %{HTTP_HOST} ^www\\.${HOST.replace(/\./g, '\\.')}$ [NC]
  RewriteRule ^ https://${HOST}%{REQUEST_URI} [L,R=301,NE]

  # /index.html -> /
  RewriteCond %{THE_REQUEST} \\s/+index\\.html[\\s?] [NC]
  RewriteRule ^index\\.html$ / [L,R=301]
</IfModule>`
  : `# ---------------------------------------------------------------------------
# Subdiretório ${BASE}: só HTTPS. Regras de www e de domínio ficam no .htaccess da raiz.
# ---------------------------------------------------------------------------
<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteBase ${BASE}
  RewriteCond %{HTTPS} off
  RewriteRule ^ https://%{HTTP_HOST}%{REQUEST_URI} [L,R=301,NE]

  # ${BASE}index.html -> ${BASE}
  RewriteCond %{THE_REQUEST} \\s${BASE.replace(/\//g, '/+')}index\\.html[\\s?] [NC]
  RewriteRule ^index\\.html$ ${BASE} [L,R=301]
</IfModule>`;
const robots = HOMOLOG ? '\n  # Homologação: fora dos buscadores\n  Header always set X-Robots-Tag "noindex, nofollow"' : '';
await writeFile(`${DIST}/.htaccess`, tpl
  .replace('__CENARIO__', IS_ROOT ? 'publicação na raiz' : `homologação em ${BASE}`)
  .replace('__BASE__', BASE)
  .replace('__REWRITE__', rewrite)
  .replace('__ROBOTS__', robots)
  .replace('__CSP__', csp));

// robots.txt e sitemap.xml só na publicação final (robots.txt só vale na raiz do domínio)
if (IS_ROOT) {
  await writeFile(`${DIST}/robots.txt`, [
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${SITE_URL}/sitemap.xml`,
    '',
  ].join('\n'));

  const today = new Date().toISOString().slice(0, 10);
  const urls = [['/', '1.0'], ['/trabalhe-conosco.html', '0.5'], ['/politica-de-privacidade.html', '0.3']];
  await writeFile(`${DIST}/sitemap.xml`, `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(([u, p]) => `  <url><loc>${SITE_URL}${u}</loc><lastmod>${today}</lastmod><priority>${p}</priority></url>`).join('\n')}
</urlset>
`);
} else {
  await rm(`${DIST}/robots.txt`, { force: true });
  await rm(`${DIST}/sitemap.xml`, { force: true });
}

console.log(`postbuild (${IS_ROOT ? 'raiz' : 'homologação ' + BASE}): .htaccess com ${hashes.size} hash de script inline${IS_ROOT ? ', robots.txt e sitemap.xml' : ', sem robots.txt e sitemap.xml'} em ${DIST}/`);
