import '../css/main.css';
import { WHATSAPP_COMERCIAL, waLink } from './config.js';
import { initConsent } from './consent.js';
import { initClickTracking } from './tracking.js';
import { initHeader, initMenu, initYear } from './ui.js';

initConsent();
initClickTracking();
initHeader();
initMenu();
initYear();

// Mensagem do WhatsApp montada com o resumo do pedido (sem resumo, fica a mensagem padrão do HTML)
try {
  const s = JSON.parse(sessionStorage.getItem('gl_cotacao'));
  const btn = document.getElementById('thanksWa');
  if (s?.msg && btn) btn.href = waLink(WHATSAPP_COMERCIAL, s.msg);
} catch { /* sem resumo */ }

// Página sem bundle de animação: tudo no estado final
document.documentElement.classList.remove('mo');
