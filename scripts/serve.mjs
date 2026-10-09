// Servidor local do build com os mesmos cabeçalhos do .htaccess (CSP e X-Robots-Tag inclusos), gzip e 404.
// Simula o subdiretório quando SITE_BASE=/novosite/ (site em http://localhost:PORTA/novosite/).
// Uso: npm run preview (raiz) ou npm run preview:novosite  (porta 4173, ou PORT=xxxx)
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import path from 'node:path';
import { BASE, OUT_DIR } from './site-env.mjs';

const DIST = path.resolve(OUT_DIR);
const PORT = Number(process.env.PORT || 4173);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.avif': 'image/avif', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
};
const COMPRESS = /\.(html|css|js|json|xml|txt|svg|ico)$/;

const htaccess = await readFile(path.join(DIST, '.htaccess'), 'utf8');
const headers = {};
for (const m of htaccess.matchAll(/Header (?:always )?set (\S+) "([^"]*)"/g)) if (!m[0].includes('Cache-Control')) headers[m[1]] = m[2];
// Local é http: sem HSTS e sem upgrade-insecure-requests
delete headers['Strict-Transport-Security'];
headers['Content-Security-Policy'] = headers['Content-Security-Policy'].replace('; upgrade-insecure-requests', '');

createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  // Fora da base (ex.: /novosite sem a barra final): redireciona para a base, como o Apache faz com pastas
  if (p === BASE.slice(0, -1)) { res.writeHead(301, { Location: BASE }); return res.end(); }
  const inside = p.startsWith(BASE);
  p = inside ? p.slice(BASE.length - 1) : p;
  if (p.endsWith('/')) p += 'index.html';
  let file = path.join(DIST, path.normalize(p));
  let status = 200;
  try {
    if (!inside || !file.startsWith(DIST) || !(await stat(file)).isFile()) throw 0;
  } catch {
    file = path.join(DIST, '404.html');
    status = 404;
  }
  const ext = path.extname(file);
  let body = await readFile(file);
  const h = { ...headers, 'Content-Type': TYPES[ext] || 'application/octet-stream' };
  h['Cache-Control'] = ext === '.html' ? 'no-cache' : /\.(js|css|woff2|webp|avif)$/.test(ext) ? 'public, max-age=31536000, immutable' : 'public, max-age=86400';
  if (COMPRESS.test(file) && /gzip/.test(req.headers['accept-encoding'] || '')) {
    body = gzipSync(body);
    h['Content-Encoding'] = 'gzip';
  }
  res.writeHead(status, h);
  res.end(body);
}).listen(PORT, () => console.log(`${OUT_DIR}/ em http://localhost:${PORT}${BASE}`));
