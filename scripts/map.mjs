// Converte o contorno do Brasil da API de malhas do IBGE em src/data/brasil.js.
// Fonte: https://servicodados.ibge.gov.br/api/v3/malhas/paises/BR?formato=image/svg+xml&qualidade=minima
// (cópia em _referencia/ibge/brasil-ibge.svg)
//
// Projeção do IBGE: equiretangular. No SVG original, o path está em graus x 10^4
// com transform scale(0.0001,-0.0001): X = longitude, Y = -latitude.
// Aqui mantemos a mesma projeção e só mudamos escala e origem:
//   x = (lon - LON0) * K
//   y = (LAT0 - lat) * K
// As cidades são posicionadas com a mesma fórmula.
import { readFile, writeFile } from 'node:fs/promises';

const svg = await readFile('_referencia/ibge/brasil-ibge.svg', 'utf8');
const vb = svg.match(/viewBox="([^"]+)"/)[1].split(/\s+/).map(Number); // minX minY w h (graus)
const d = svg.match(/<path[^>]*\sd="([^"]+)"/)[1];

const LON0 = vb[0];
const LAT0 = -vb[1];
const K = 10; // 1 grau = 10 unidades
const W = Math.ceil(vb[2] * K);
const H = Math.ceil(vb[3] * K);

// Interpreta o path (comandos M, m, L, l, H, h, V, v, Z, z) em coordenadas absolutas do IBGE (x10^4)
const tokens = d.match(/[MmLlHhVvZz]|-?\d*\.?\d+(?:e-?\d+)?/g);
const rings = [];
let ring = null, cx = 0, cy = 0, cmd = null, i = 0, startX = 0, startY = 0;
const num = () => parseFloat(tokens[i++]);
while (i < tokens.length) {
  const t = tokens[i];
  if (/[A-Za-z]/.test(t)) { cmd = t; i++; if (cmd === 'Z' || cmd === 'z') { cx = startX; cy = startY; if (ring) rings.push(ring); ring = null; } continue; }
  switch (cmd) {
    case 'M': cx = num(); cy = num(); if (ring) rings.push(ring); ring = [[cx, cy]]; startX = cx; startY = cy; cmd = 'L'; break;
    case 'm': cx += num(); cy += num(); if (ring) rings.push(ring); ring = [[cx, cy]]; startX = cx; startY = cy; cmd = 'l'; break;
    case 'L': cx = num(); cy = num(); ring.push([cx, cy]); break;
    case 'l': cx += num(); cy += num(); ring.push([cx, cy]); break;
    case 'H': cx = num(); ring.push([cx, cy]); break;
    case 'h': cx += num(); ring.push([cx, cy]); break;
    case 'V': cy = num(); ring.push([cx, cy]); break;
    case 'v': cy += num(); ring.push([cx, cy]); break;
    default: i++;
  }
}
if (ring) rings.push(ring);

// IBGE (x10^4): x = lon*1e4, y = lat*1e4
const project = (lon, lat) => [(lon - LON0) * K, (LAT0 - lat) * K];
const r1 = (n) => Math.round(n * 10) / 10;

let out = '';
let points = 0;
for (const rg of rings) {
  const pts = rg.map(([x, y]) => project(x / 1e4, y / 1e4)).map(([x, y]) => [r1(x), r1(y)]);
  const clean = pts.filter((p, k) => k === 0 || p[0] !== pts[k - 1][0] || p[1] !== pts[k - 1][1]);
  if (clean.length < 3) continue;
  points += clean.length;
  out += 'M' + clean.map((p) => `${p[0]} ${p[1]}`).join('L') + 'Z';
}

const cities = {
  fortaleza: { lat: -3.7319, lon: -38.5267 },
  guarulhos: { lat: -23.4538, lon: -46.5333 },
};
for (const c of Object.values(cities)) {
  const [x, y] = project(c.lon, c.lat);
  c.x = r1(x);
  c.y = r1(y);
}

const js = `// Gerado por scripts/map.mjs a partir da malha do IBGE. Não editar à mão.
// Projeção equiretangular (mesma do IBGE): x = (lon - (${LON0})) * ${K}; y = (${LAT0} - lat) * ${K}
export const VIEWBOX = '0 0 ${W} ${H}';
export const BRASIL_PATH = '${out}';
export const CIDADES = ${JSON.stringify(cities)};
`;
await writeFile('src/data/brasil.js', js);
console.log({ rings: rings.length, points, bytes: Buffer.byteLength(js), viewBox: `0 0 ${W} ${H}`, cities });
