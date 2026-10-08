// Banner de consentimento (Consent Mode v2).
// O padrão "negado" e a escolha salva são aplicados no <head> antes do GTM (src/partials/head.html).
const KEY = 'gl_consent';
const GRANTED = { ad_storage: 'granted', ad_user_data: 'granted', ad_personalization: 'granted', analytics_storage: 'granted' };
const DENIED = { ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied', analytics_storage: 'denied' };

export function initConsent() {
  const banner = document.getElementById('cookie');
  if (!banner) return;
  const root = document.documentElement;

  const setOffset = () => {
    const h = banner.hidden ? 0 : banner.getBoundingClientRect().height + (innerWidth <= 560 ? 12 : 0);
    // No desktop o banner fica à esquerda e o botão do WhatsApp à direita: não precisa subir
    root.style.setProperty('--cookie-h', innerWidth <= 560 && h ? `${Math.ceil(h)}px` : '0px');
  };
  const show = () => { banner.hidden = false; setOffset(); };
  const hide = () => { banner.hidden = true; setOffset(); };

  if (!window.__glConsent) show();
  addEventListener('resize', setOffset, { passive: true });

  banner.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-consent]');
    if (!btn) return;
    const v = btn.dataset.consent === 'granted' ? 'granted' : 'denied';
    try { localStorage.setItem(KEY, JSON.stringify({ v, t: Date.now() })); } catch { /* sem armazenamento */ }
    window.__glConsent = v;
    window.gtag?.('consent', 'update', v === 'granted' ? GRANTED : DENIED);
    if (v === 'granted') window.__glLoadGTM?.();
    document.dispatchEvent(new CustomEvent('gl:consent', { detail: v }));
    hide();
  });

  document.querySelectorAll('[data-cookie-prefs]').forEach((b) =>
    b.addEventListener('click', () => { show(); banner.querySelector('button')?.focus(); })
  );
}
