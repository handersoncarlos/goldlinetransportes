// Gera as imagens otimizadas em public/img a partir de _referencia/02-materiais.
// Uso: npm run images
import sharp from 'sharp';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SRC = '_referencia/02-materiais';
const OUT = 'public/img';
const WIDTHS = [480, 960, 1600];
const manifest = {};

await mkdir(OUT, { recursive: true });
await mkdir(`${OUT}/clientes`, { recursive: true });

async function photo(name, { avif = false, quality = 72 } = {}) {
  const src = `${SRC}/fotos/${name}.webp`;
  const meta = await sharp(src).metadata();
  manifest[name] = { w: meta.width, h: meta.height, sizes: [] };
  for (const w of WIDTHS) {
    const width = Math.min(w, meta.width);
    const height = Math.round((meta.height * width) / meta.width);
    const img = sharp(src).resize(width);
    await img.clone().webp({ quality, effort: 6 }).toFile(`${OUT}/${name}-${w}.webp`);
    if (avif) await img.clone().avif({ quality: 50, effort: 6 }).toFile(`${OUT}/${name}-${w}.avif`);
    manifest[name].sizes.push({ w, width, height });
  }
}

for (const n of ['hero-estrada', 'frota', 'galpao', 'parceria', 'aviao', 'aviao-2', 'caminhao']) {
  await photo(n, { avif: n === 'hero-estrada' });
}

// Premiações: largura nativa pequena, 1 versão
for (const f of await readdir(`${SRC}/premios`)) {
  if (!f.endsWith('.webp')) continue;
  const m = await sharp(`${SRC}/premios/${f}`).metadata();
  await sharp(`${SRC}/premios/${f}`).webp({ quality: 74 }).toFile(`${OUT}/${f}`);
  manifest[f] = { w: m.width, h: m.height };
}

// Parceiros: altura 128 (2x de 64px)
for (const f of await readdir(`${SRC}/parceiros`)) {
  if (!f.endsWith('.png')) continue;
  const name = f.replace('.png', '');
  const info = await sharp(`${SRC}/parceiros/${f}`).resize({ height: 128 }).webp({ quality: 82 }).toFile(`${OUT}/${name}.webp`);
  manifest[name] = { w: info.width, h: info.height };
}

// Clientes: contidos em 240x120 (2x do bloco de exibição)
for (const f of (await readdir(`${SRC}/clientes`)).sort()) {
  if (!f.endsWith('.png')) continue;
  const name = f.replace('.png', '');
  const info = await sharp(`${SRC}/clientes/${f}`)
    .trim({ threshold: 4 })
    .resize({ width: 240, height: 112, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 82, alphaQuality: 90 })
    .toFile(`${OUT}/clientes/${name}.webp`);
  manifest[`clientes/${name}`] = { w: info.width, h: info.height };
}

// Logos (header 38px, rodapé 40px; geramos 2x)
for (const [src, out] of [
  ['logo-goldline-fundo-escuro', 'logo-goldline'],
  ['logo-rodape-goldline-branco', 'logo-goldline-branco'],
]) {
  const info = await sharp(`${SRC}/logos/${src}.png`).resize({ height: 84 }).webp({ quality: 90, alphaQuality: 100 }).toFile(`${OUT}/${out}.webp`);
  manifest[out] = { w: info.width, h: info.height };
}

// Ícones
const fav = `${SRC}/logos/favicon-512.png`;
await sharp(fav).resize(180).png().toFile('public/apple-touch-icon.png');
await sharp(fav).resize(192).png().toFile('public/icon-192.png');
await sharp(fav).resize(512).png().toFile('public/icon-512.png');
// favicon.ico com PNGs 16, 32 e 48 embutidos
const icoSizes = [16, 32, 48];
const pngs = await Promise.all(icoSizes.map((s) => sharp(fav).resize(s).png().toBuffer()));
const header = Buffer.alloc(6 + 16 * pngs.length);
header.writeUInt16LE(0, 0);
header.writeUInt16LE(1, 2);
header.writeUInt16LE(pngs.length, 4);
let offset = header.length;
pngs.forEach((buf, i) => {
  const o = 6 + i * 16;
  header.writeUInt8(icoSizes[i], o);
  header.writeUInt8(icoSizes[i], o + 1);
  header.writeUInt16LE(1, o + 4);
  header.writeUInt16LE(32, o + 6);
  header.writeUInt32LE(buf.length, o + 8);
  header.writeUInt32LE(offset, o + 12);
  offset += buf.length;
});
await writeFile('public/favicon.ico', Buffer.concat([header, ...pngs]));

// og-image 1200x630: hero-estrada + gradiente + curvas + logo
const W = 1200, H = 630;
const overlay = Buffer.from(`<svg width="${W}" height="${H}" xmlns="http://www.w3.org/2000/svg">
  <defs><linearGradient id="g" x1="0" x2="1" y1="0" y2="0">
    <stop offset="0" stop-color="#121212" stop-opacity=".94"/>
    <stop offset=".5" stop-color="#121212" stop-opacity=".72"/>
    <stop offset="1" stop-color="#121212" stop-opacity=".3"/></linearGradient></defs>
  <rect width="${W}" height="${H}" fill="url(#g)"/>
  <circle cx="1130" cy="700" r="330" fill="none" stroke="#E5BE55" stroke-opacity=".35" stroke-width="2"/>
  <circle cx="1170" cy="760" r="380" fill="none" stroke="#E5BE55" stroke-opacity=".18" stroke-width="2"/>
  <rect x="80" y="420" width="120" height="4" fill="#E5BE55"/>
</svg>`);
const logo = await sharp(`${SRC}/logos/logo-goldline-fundo-escuro.png`).resize({ width: 560 }).png().toBuffer();
await sharp(`${SRC}/fotos/hero-estrada.webp`)
  .resize(W, H, { fit: 'cover' })
  .composite([{ input: overlay }, { input: logo, left: 80, top: 250 }])
  .jpeg({ quality: 82, mozjpeg: true })
  .toFile('public/og-image.jpg');

await writeFile(path.join('scripts', 'images-manifest.json'), JSON.stringify(manifest, null, 2));
console.log('Imagens geradas em', OUT);
