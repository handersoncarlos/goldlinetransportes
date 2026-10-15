// Gera src/partials/clientes-1.html e clientes-2.html (duas faixas de logos).
// Ordem e nomes iguais ao alt da versão 1. Rode depois de `npm run images`.
import { readFile, writeFile } from 'node:fs/promises';

const manifest = JSON.parse(await readFile('scripts/images-manifest.json', 'utf8'));
// Ordem das faixas (16 + 15). Logos novos dos Ajustes 03 intercalados com os existentes.
const CLIENTES = [
  ['hapvida', 'Hapvida'], ['selects', 'Excelência Selects'], ['case', 'Case'], ['toyota', 'Toyota'], ['vivo', 'Vivo'],
  ['telefonica', 'Telefônica'], ['usibras', 'Usibras'], ['luzeiros', 'Luzeiros'], ['cabana-del-primo', 'Cabaña del Primo'],
  ['coco-bambu', 'Coco Bambu'], ['grazziotin', 'Grazziotin'], ['fornecedora', 'Grupo Fornecedora'], ['renner', 'Renner'],
  ['avenida', 'Avenida'], ['pernambucanas', 'Pernambucanas'], ['torra', 'Torra'],
  ['eskala', 'Eskala'], ['phoenix', 'Phoenix Global'], ['hering', 'Hering'], ['riachuelo', 'Riachuelo'],
  ['santana', 'Santana Textiles'], ['sergio-k', 'Sergio K.'], ['brooksfield', 'Brooksfield'], ['sellen', 'Sellene'],
  ['via-veneto', 'Via Veneto'], ['loungerie', 'Loungerie'], ['malwee', 'Malwee'], ['tng', 'TNG'], ['marisa', 'Marisa'],
  ['cea', 'C&amp;A'], ['zinzane', 'Zinzane'],
];

const li = ([file, name]) => {
  const m = manifest[`clientes/${file}`];
  if (!m) throw new Error(`Logo não encontrado: ${file}`);
  const novo = ['selects', 'usibras', 'fornecedora', 'phoenix', 'santana', 'sellen'].includes(file);
  return `<li class="client${novo ? ' client--jpg' : ''}"><img src="/img/clientes/${file}.webp" srcset="/img/clientes/${file}.webp 1x, /img/clientes/${file}@2x.webp 2x" width="${m.w}" height="${m.h}" alt="${name}" loading="lazy" decoding="async"></li>`;
};
const half = Math.ceil(CLIENTES.length / 2);
await writeFile('src/partials/clientes-1.html', CLIENTES.slice(0, half).map(li).join('\n      ') + '\n');
await writeFile('src/partials/clientes-2.html', CLIENTES.slice(half).map(li).join('\n      ') + '\n');
console.log(`Faixas: ${half} + ${CLIENTES.length - half} logos`);
