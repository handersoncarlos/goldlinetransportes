// Gera as imagens otimizadas em public/img a partir de _novas-imagens/ e _referencia/02-materiais.
// Uso: npm run images
import sharp from 'sharp';
import { mkdir, readdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const SRC = '_referencia/02-materiais';
const NOVAS = '_novas-imagens';
const OUT = 'public/img';
const WIDTHS = [480, 960, 1600];
const manifest = {};

await mkdir(OUT, { recursive: true });
await mkdir(`${OUT}/clientes`, { recursive: true });

// Acha o arquivo novo pelo nome, aceitando .jpg, .jpeg, .png ou .webp
async function findNova(name) {
  const files = await readdir(NOVAS).catch(() => []);
  const f = files.find((x) => x.replace(/\.(jpe?g|png|webp)$/i, '') === name);
  return f ? `${NOVAS}/${f}` : null;
}

// Gera WebP nas larguras 480, 960 e 1600 (sem ampliar: acima da largura original usa a original).
// Arquivo: <nome>-<largura real>.webp
// smallQuality/smallAvif: qualidade menor nas larguras 480 e 960 (hero: LCP no mobile)
async function photo(name, src, { avif = false, quality = 72, smallQuality = quality, smallAvif = 50, gray = false } = {}) {
  const meta = await sharp(src).metadata();
  const widths = [...new Set(WIDTHS.map((w) => Math.min(w, meta.width)))];
  manifest[name] = { w: meta.width, h: meta.height, widths };
  for (const width of widths) {
    const small = width <= 960;
    // PNG com canal alfa: achata sobre o grafite para não gerar transparência
    let img = sharp(src).flatten({ background: '#1A1A1A' }).resize(width);
    // Fotos exibidas em P&B no site: já saem em escala de cinza (mesmo visual, arquivo menor)
    if (gray) img = img.grayscale();
    await img.clone().webp({ quality: small ? smallQuality : quality, effort: 6 }).toFile(`${OUT}/${name}-${width}.webp`);
    if (avif) await img.clone().avif({ quality: small ? smallAvif : 50, effort: 6 }).toFile(`${OUT}/${name}-${width}.avif`);
  }
}

// Fotos novas (_novas-imagens). Se faltar alguma, usa a foto antiga da referência.
const NOVAS_FOTOS = [
  ['hero', 'hero', `${SRC}/fotos/hero-estrada.webp`, { avif: true, quality: 70, smallQuality: 50, smallAvif: 34 }],
  ['solucoes-aereo', 'solucoes-aereo', `${SRC}/fotos/aviao.webp`],
  ['solucoes-rodoviario', 'solucoes-rodoviario', `${SRC}/fotos/caminhao.webp`],
  ['solucoes-farma', 'solucoes-farma', `${SRC}/fotos/galpao.webp`],
  ['vantagens', 'vantagens', `${SRC}/fotos/frota.webp`, { gray: true }],
  ['sobre', 'sobre', `${SRC}/fotos/galpao.webp`, { gray: true }],
  ['premiacao-nova', 'premiacao-nova', null],
];
const faltando = [];
for (const [nova, out, fallback, opts] of NOVAS_FOTOS) {
  const src = (await findNova(nova)) || fallback;
  if (!(await findNova(nova))) faltando.push(nova);
  if (src) await photo(out, src, opts);
}
await photo('parceria', `${SRC}/fotos/parceria.webp`);

// Premiações: as 4 fotos do mosaico da versão 1, largura nativa
for (const f of ['premio-040.webp', 'premio-042.webp', 'premio-043.webp', 'premio-045.webp']) {
  const m = await sharp(`${SRC}/premios/${f}`).metadata();
  await sharp(`${SRC}/premios/${f}`).webp({ quality: 74 }).toFile(`${OUT}/${f}`);
  manifest[f] = { w: m.width, h: m.height };
}

// Parceiros: logos prontos (fundo e cantos no arquivo). 1x = 64px de altura, 2x = 128px
for (const n of ['logo-latamcargo', 'logo-gollog', 'logo-azulcargo', 'logo-mercadolivre']) {
  const src = await findNova(n);
  if (!src) { faltando.push(n); continue; }
  for (const [h, suf] of [[64, ''], [128, '@2x']]) {
    const info = await sharp(src).resize({ height: h }).webp({ quality: 92, alphaQuality: 100, smartSubsample: true }).toFile(`${OUT}/${n}${suf}.webp`);
    if (!suf) manifest[n] = { w: info.width, h: info.height };
  }
}

// Clientes: recorta o fundo, aplica a mesma margem interna transparente em todos e contém em 240x112.
// C&A: o arquivo original vem cortado na base; usamos a versão com a borda reconstruída.
for (const f of (await readdir(`${SRC}/clientes`)).sort()) {
  if (!f.endsWith('.png')) continue;
  const name = f.replace('.png', '');
  const src = name === 'cea' && (await findNova('cliente-cea-restaurado')) ? await findNova('cliente-cea-restaurado') : `${SRC}/clientes/${f}`;
  const trimmed = await sharp(src).trim({ threshold: 4 }).png().toBuffer({ resolveWithObject: true });
  const pad = Math.round(Math.max(trimmed.info.width, trimmed.info.height) * 0.04);
  const padded = await sharp(trimmed.data)
    .extend({ top: pad, bottom: pad, left: pad, right: pad, background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png().toBuffer({ resolveWithObject: true });
  const k = Math.min(240 / padded.info.width, 112 / padded.info.height, 1);
  const info = await sharp(padded.data)
    .resize(Math.round(padded.info.width * k), Math.round(padded.info.height * k))
    .webp({ quality: 82, alphaQuality: 90 })
    .toFile(`${OUT}/clientes/${name}.webp`);
  manifest[`clientes/${name}`] = { w: info.width, h: info.height };
}

// Logos (header 38px, rodapé 40px; geramos 2x)
for (const [src, out] of [
  ['logo-goldline-fundo-escuro', 'logo-goldline'],
  ['logo-rodape-goldline-branco', 'logo-goldline-branco'],
]) {
  const info = await sharp(`${SRC}/logos/${src}.png`).resize({ height: 80 }).webp({ quality: 90, alphaQuality: 100 }).toFile(`${OUT}/${out}.webp`);
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
if (faltando.length) console.warn('Imagens novas não encontradas em _novas-imagens/:', faltando.join(', '));
