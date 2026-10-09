// Ambiente de publicação, lido pelo vite.config.js, pelo pós-build e pelo servidor local.
//   SITE_BASE=/            publicação final na raiz do domínio (padrão), saída em dist/
//   SITE_BASE=/novosite/   homologação em subdiretório, saída em dist-novosite/
// OUT_DIR sobrescreve a pasta de saída (usado só nos builds de teste).
const raw = process.env.SITE_BASE || '/';
export const BASE = `/${raw.replace(/^\/+|\/+$/g, '')}/`.replace('//', '/');
export const IS_ROOT = BASE === '/';
// Homologação: qualquer base diferente da raiz fica fora do Google e marca o ambiente no dataLayer
export const HOMOLOG = !IS_ROOT;
export const AMBIENTE = HOMOLOG ? 'homologacao' : 'producao';
export const OUT_DIR = process.env.OUT_DIR || (IS_ROOT ? 'dist' : `dist-${BASE.replace(/\//g, '')}`);
