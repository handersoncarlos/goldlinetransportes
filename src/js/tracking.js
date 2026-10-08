// Eventos de rastreamento. Tudo vai para window.dataLayer; o GTM decide o que enviar para GA4, Meta e Google Ads.
// O código nunca chama gtag('event') ou fbq() diretamente.

const UTM_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'gclid', 'fbclid'];
const STORE_KEY = 'gl_utm';

export function track(event, params = {}) {
  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({ event, ...params });
  if (import.meta.env.DEV) console.info('[dataLayer]', event, params);
}

// Guarda UTM, gclid e fbclid da URL de entrada durante a sessão
export function captureUtm() {
  const params = new URLSearchParams(location.search);
  const found = {};
  UTM_KEYS.forEach((k) => { if (params.get(k)) found[k] = params.get(k).slice(0, 200); });
  try {
    if (Object.keys(found).length) sessionStorage.setItem(STORE_KEY, JSON.stringify(found));
  } catch { /* armazenamento indisponível */ }
}

export function getUtm() {
  try { return JSON.parse(sessionStorage.getItem(STORE_KEY)) || {}; } catch { return {}; }
}

// Cliques: Área do Cliente, WhatsApp, telefone, e-mail e botões que levam ao formulário
export function initClickTracking(onCta) {
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a');
    if (!a) return;
    const href = a.getAttribute('href') || '';
    if (a.dataset.areaCliente) {
      track('area_cliente_click', { origem: a.dataset.areaCliente });
    } else if (href.startsWith('https://wa.me/')) {
      track('whatsapp_click', { origem: a.dataset.waOrigem || 'nao-identificado' });
    } else if (href.startsWith('tel:')) {
      track('phone_click', { unidade: a.dataset.unidade || 'nao-identificada', ...(a.dataset.origem && { origem: a.dataset.origem }) });
    } else if (a.dataset.curriculo) {
      track('curriculo_email_click', { acao: 'mailto' });
    } else if (href.startsWith('mailto:')) {
      track('email_click', { email: href.slice(7) });
    } else if (a.dataset.cta) {
      track('cta_cotacao_click', { origem: a.dataset.cta });
      onCta?.(a);
    }
  });
}
