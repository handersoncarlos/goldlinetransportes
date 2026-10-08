// Valores do cliente. Tudo que ainda depende de confirmação está marcado com TODO.
// Depois de alterar este arquivo, rode `npm run build` e publique de novo a pasta dist/.

// TODO 3: confirmar domínio final (afeta canonical, Open Graph, JSON-LD, sitemap e robots)
export const SITE_URL = 'https://goldlinetransportes.com.br';

// TODO 13: ID do Google Tag Manager (ex.: 'GTM-XXXXXXX'). Vazio = GTM não é carregado.
export const GTM_ID = '';

// TODO 14: ID do formulário no Formspree (ex.: 'xyzabcd'). O destinatário (comercial@goldlinetransportes.com.br)
// é definido no painel do Formspree: ver README-PUBLICACAO.md.
// Vazio = o formulário cai no fluxo de erro e oferece o envio pelo WhatsApp.
export const FORMSPREE_ID = '';

export const WHATSAPP_COMERCIAL = '5585997010005';
export const WHATSAPP_GUARULHOS = '5511910601099';

// Área do Cliente (sistema de rastreamento). Vazio = link e botão não aparecem.
export const AREA_CLIENTE_URL = 'https://goldline.brudam.com.br/site/';

// Vazio = ícone não aparece no rodapé.
export const FACEBOOK_URL = 'https://www.facebook.com/goldlinecargasaereas';

export const INSTAGRAM_URL = 'https://www.instagram.com/goldlinetransportes';

export const EMAIL_COMERCIAL = 'comercial@goldlinetransportes.com.br';
export const EMAIL_RH = 'rh@goldlinetransportes.com.br';

// TODO 6: ID do vídeo institucional no YouTube (ex.: 'dQw4w9WgXcQ'). Vazio = bloco de vídeo não aparece.
export const YOUTUBE_ID = '';

// TODO 2: confirmar razão social e CNPJ
export const RAZAO_SOCIAL = 'Gold Line Transporte de Cargas Aéreas LTDA';
export const CNPJ = '05.290.498/0001-98';

// TODO 1: validar com o cliente. Valores da versão 1.
export const STATS = [
  { prefix: '+', value: 20, decimals: 0, suffix: '', label: 'Anos de mercado' },
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
  'unidade-guarulhos': { numero: WHATSAPP_GUARULHOS, msg: 'Olá! Vim pelo site e quero falar com a unidade de Guarulhos.' },
  flutuante: { numero: WHATSAPP_COMERCIAL, msg: 'Olá! Vim pelo site da Goldline e quero atendimento.' },
  'cta-final': { numero: WHATSAPP_COMERCIAL, msg: 'Olá! Vim pelo site e quero uma proposta para minha operação.' },
};

export const waLink = (numero, msg) => `https://wa.me/${numero}?text=${encodeURIComponent(msg)}`;
