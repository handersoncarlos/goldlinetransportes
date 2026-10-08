// Servidor local de dist/ com os mesmos cabeçalhos do .htaccess (CSP inclusa), gzip e 404.
// Uso: npm run preview  (porta 4173, ou PORT=xxxx)
import { createServer } from 'node:http';
import { readFile, stat } from 'node:fs/promises';
import { gzipSync } from 'node:zlib';
import path from 'node:path';

const DIST = path.resolve(process.env.DIST || 'dist');
const PORT = Number(process.env.PORT || 4173);
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.xml': 'application/xml', '.txt': 'text/plain; charset=utf-8', '.svg': 'image/svg+xml',
  '.webp': 'image/webp', '.avif': 'image/avif', '.png': 'image/png', '.jpg': 'image/jpeg', '.ico': 'image/x-icon', '.woff2': 'font/woff2',
};
const COMPRESS = /\.(html|css|js|json|xml|txt|svg|ico)$/;

const htaccess = await readFile(path.join(DIST, '.htaccess'), 'utf8');
const headers = {};
for (const m of htaccess.matchAll(/Header always set (\S+) "([^"]*)"/g)) headers[m[1]] = m[2];
// Local é http: sem HSTS e sem upgrade-insecure-requests
delete headers['Strict-Transport-Security'];
headers['Content-Security-Policy'] = headers['Content-Security-Policy'].replace('; upgrade-insecure-requests', '');

createServer(async (req, res) => {
  let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  if (p.endsWith('/')) p += 'index.html';
  let file = path.join(DIST, path.normalize(p));
  let status = 200;
  try {
    if (!file.startsWith(DIST) || !(await stat(file)).isFile()) throw 0;
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
}).listen(PORT, () => console.log(`dist/ em http://localhost:${PORT}`));
