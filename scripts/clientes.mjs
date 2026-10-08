// Gera src/partials/clientes-1.html e clientes-2.html (duas faixas de logos).
// Ordem e nomes iguais ao alt da versão 1. Rode depois de `npm run images`.
import { readFile, writeFile } from 'node:fs/promises';

const manifest = JSON.parse(await readFile('scripts/images-manifest.json', 'utf8'));
const CLIENTES = [
  ['hapvida', 'Hapvida'], ['unimed', 'Unimed'], ['case', 'Case'], ['toyota', 'Toyota'], ['vivo', 'Vivo'],
  ['telefonica', 'Telefônica'], ['globo', 'Globo'], ['luzeiros', 'Luzeiros'], ['cabana-del-primo', 'Cabaña del Primo'],
  ['coco-bambu', 'Coco Bambu'], ['grazziotin', 'Grazziotin'], ['harrys', "Harry's"], ['renner', 'Renner'],
  ['avenida', 'Avenida'], ['pernambucanas', 'Pernambucanas'], ['torra', 'Torra'], ['eskala', 'Eskala'],
  ['hering', 'Hering'], ['riachuelo', 'Riachuelo'], ['dudalina', 'Dudalina'], ['aramis', 'Aramis'], ['taco', 'Taco'],
  ['sergio-k', 'Sergio K.'], ['brooksfield', 'Brooksfield'], ['via-veneto', 'Via Veneto'], ['loungerie', 'Loungerie'],
  ['malwee', 'Malwee'], ['tng', 'TNG'], ['marisa', 'Marisa'], ['cea', 'C&amp;A'], ['zinzane', 'Zinzane'],
];

const li = ([file, name]) => {
  const m = manifest[`clientes/${file}`];
  if (!m) throw new Error(`Logo não encontrado: ${file}`);
  return `<li class="client"><img src="/img/clientes/${file}.webp" width="${m.w}" height="${m.h}" alt="${name}" loading="lazy" decoding="async"></li>`;
};
const half = Math.ceil(CLIENTES.length / 2);
await writeFile('src/partials/clientes-1.html', CLIENTES.slice(0, half).map(li).join('\n      ') + '\n');
await writeFile('src/partials/clientes-2.html', CLIENTES.slice(half).map(li).join('\n      ') + '\n');
console.log(`Faixas: ${half} + ${CLIENTES.length - half} logos`);
