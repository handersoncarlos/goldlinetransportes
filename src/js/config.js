// Valores do cliente. Tudo que ainda depende de confirmação está marcado com TODO.
// Depois de alterar este arquivo, rode `npm run build` e publique de novo a pasta dist/.

// Domínio final do site (canonical, Open Graph, JSON-LD, sitemap, robots e redirecionamento www no .htaccess).
// Os e-mails de contato continuam em @goldlinetransportes.com.br.
export const SITE_URL = 'https://goldlinecargasaereas.com.br';

// TODO 13: ID do Google Tag Manager (ex.: 'GTM-XXXXXXX'). Vazio = GTM não é carregado.
export const GTM_ID = '';

// Web3Forms: access key vinculada a comercial@goldlinetransportes.com.br. A chave é pública por definição
// (vai no HTML), por isso fica aqui versionada. Vazio = o formulário cai no fluxo de erro com WhatsApp.
// Limite do plano gratuito: 250 envios por mês. Não faça envios de teste com esta chave.
export const WEB3FORMS_ACCESS_KEY = 'a2a8b2a4-dc13-492e-8739-44ce4af627c7';
export const WEB3FORMS_ENDPOINT = 'https://api.web3forms.com/submit';

// WhatsApp principal (Matriz Fortaleza e Filial Guarulhos usam o mesmo número)
export const WHATSAPP_COMERCIAL = '5585986873887';
// Como o número aparece escrito no site
export const WHATSAPP_EXIBICAO = '(85) 98687-3887';

// Área do Cliente (sistema de rastreamento). Vazio = link e botão não aparecem.
export const AREA_CLIENTE_URL = 'https://goldline.brudam.com.br/site/';

// Vazio = ícone não aparece no rodapé.
export const FACEBOOK_URL = 'https://www.facebook.com/goldlinecargasaereas';

export const INSTAGRAM_URL = 'https://www.instagram.com/goldlinetransportes';

export const EMAIL_COMERCIAL = 'comercial@goldlinetransportes.com.br';
export const EMAIL_RH = 'rh@goldlinetransportes.com.br';

// TODO 6: ID do vídeo institucional no YouTube (ex.: 'dQw4w9WgXcQ'). Vazio = bloco de vídeo não aparece.
export const YOUTUBE_ID = '';

// Razão social e CNPJ (rodapé, política e JSON-LD)
export const RAZAO_SOCIAL = 'Gold Line Transporte de Cargas Aéreas LTDA';
export const CNPJ = '05.290.498/0001-98';

// Ano de fundação. Os anos de mercado são calculados a partir dele (selo do Sobre, faixa de números e JSON-LD).
export const ANO_FUNDACAO = 2015;
// Anos completos garantidos: ano atual - fundação - 1 (o mês de fundação não é conhecido, então o número
// nunca passa do tempo real). Roda no build (HTML sem JS) e de novo no navegador (contador).
export const anosDeMercado = (anoAtual = new Date().getFullYear()) => anoAtual - ANO_FUNDACAO - 1;

// Números da faixa dourada
export const STATS = [
  { prefix: '+', value: anosDeMercado(), decimals: 0, suffix: '', label: 'Anos de mercado', anos: true },
  { prefix: '+', value: 2000, decimals: 0, suffix: '', label: 'Clientes atendidos' },
  { prefix: '+', value: 25, decimals: 0, suffix: ' mi', label: 'Toneladas transportadas' },
  { prefix: '+', value: 1.5, decimals: 1, suffix: ' mi', label: 'Km rodados' },
];

// Mensagens de WhatsApp por botão (identificam a origem do contato)
export const WA = {
  hero: { numero: WHATSAPP_COMERCIAL, msg: 'Olá! Vim pelo site da Goldline e quero uma cotação de frete.' },
  'card-aereo': { numero: WHATSAPP_COMERCIAL, msg: 'Olá! Vim pelo site e quero cotar frete aéreo.' },
  'card-rodoviario': { numero: WHATSAPP_COMERCIAL, msg: 'Olá! Vim pelo site e quero cotar frete rodoviário.' },
  'card-farma': { numero: WHATSAPP_COMERCIAL, msg: 'Olá! Vim pelo site e quero cotar transporte de carga especial (farma, química ou perigosa).' },
  'unidade-fortaleza': { numero: WHATSAPP_COMERCIAL, msg: 'Olá! Vim pelo site e quero falar com a unidade de Fortaleza.' },
  'unidade-guarulhos': { numero: WHATSAPP_COMERCIAL, msg: 'Olá! Vim pelo site e quero falar com a unidade de Guarulhos.' },
  flutuante: { numero: WHATSAPP_COMERCIAL, msg: 'Olá! Vim pelo site da Goldline e quero atendimento.' },
  'cta-final': { numero: WHATSAPP_COMERCIAL, msg: 'Olá! Vim pelo site e quero uma proposta para minha operação.' },
};

export const waLink = (numero, msg) => `https://wa.me/${numero}?text=${encodeURIComponent(msg)}`;
