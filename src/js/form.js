import { WEB3FORMS_ACCESS_KEY, WEB3FORMS_ENDPOINT, WHATSAPP_COMERCIAL, waLink } from './config.js';
import { track, getUtm } from './tracking.js';

const MIN_FILL_MS = 3000;
const SUMMARY_KEY = 'gl_cotacao';

export function buildWaMessage(d) {
  return [
    '*Pedido de cotação pelo site*',
    `Nome: ${d.nome || '-'}`,
    `Empresa: ${d.empresa || '-'}`,
    `Contato: ${d.telefone || '-'} / ${d.email || '-'}`,
    `Origem: ${d.origem || '-'}`,
    `Destino: ${d.destino || '-'}`,
    `Modal: ${d.modal || '-'}`,
    `Tipo de carga: ${d.tipo_carga || '-'}`,
    `Peso: ${d.peso ? `${d.peso} kg` : '-'}`,
    `Obs.: ${d.observacoes || '-'}`,
  ].join('\n');
}

function maskPhone(v) {
  const n = v.replace(/\D/g, '').slice(0, 11);
  if (n.length <= 2) return n.length ? `(${n}` : '';
  if (n.length <= 6) return `(${n.slice(0, 2)}) ${n.slice(2)}`;
  if (n.length <= 10) return `(${n.slice(0, 2)}) ${n.slice(2, 6)}-${n.slice(6)}`;
  return `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`;
}

const validators = {
  telefone: (el) => { const n = el.value.replace(/\D/g, ''); return n.length === 10 || n.length === 11; },
  email: (el) => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(el.value.trim()),
  lgpd: (el) => el.checked,
};

export function initForm() {
  const form = document.getElementById('qform');
  if (!form) return null;
  const loadedAt = Date.now();
  const status = document.getElementById('qformStatus');
  const statusMsg = status.querySelector('.qform__msg');
  const waBtn = document.getElementById('qformWa');
  const submitLabel = form.querySelector('.qform__label');
  const submitText = submitLabel.textContent;
  const tel = form.elements.telefone;

  tel.addEventListener('input', () => { tel.value = maskPhone(tel.value); });

  const fieldOk = (el) => {
    if (!el.required) return true;
    if (validators[el.name]) return validators[el.name](el);
    return el.value.trim() !== '';
  };
  const setError = (el, bad) => {
    const err = document.getElementById(el.getAttribute('aria-describedby'));
    el.setAttribute('aria-invalid', bad ? 'true' : 'false');
    if (err) err.hidden = !bad;
  };
  // Revalida ao corrigir um campo que já mostrou erro
  form.addEventListener('input', (e) => { if (e.target.getAttribute('aria-invalid') === 'true') setError(e.target, !fieldOk(e.target)); });
  form.addEventListener('change', (e) => { if (e.target.getAttribute('aria-invalid') === 'true') setError(e.target, !fieldOk(e.target)); });

  const data = () => Object.fromEntries(new FormData(form).entries());

  const showStatus = (msg, { error = true, wa = false } = {}) => {
    statusMsg.textContent = msg;
    status.classList.toggle('is-info', !error);
    waBtn.hidden = !wa;
    if (wa) waBtn.href = waLink(WHATSAPP_COMERCIAL, buildWaMessage(data()));
    status.hidden = false;
  };

  const setSending = (on) => {
    form.classList.toggle('is-sending', on);
    form.querySelector('.qform__submit').disabled = on;
    submitLabel.textContent = on ? 'Enviando...' : submitText;
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    status.hidden = true;

    let first = null;
    form.querySelectorAll('[required]').forEach((el) => {
      const ok = fieldOk(el);
      setError(el, !ok);
      if (!ok && !first) first = el;
    });
    if (first) { first.focus(); return; }

    // Anti-spam: honeypot e envio rápido demais
    if (form.elements.botcheck.value) return;
    if (Date.now() - loadedAt < MIN_FILL_MS) {
      showStatus('Aguarde alguns segundos e envie novamente.', { error: false });
      return;
    }

    const utm = getUtm();
    ['utm_source', 'utm_medium', 'utm_campaign', 'gclid', 'fbclid'].forEach((k) => { form.elements[k].value = utm[k] || ''; });

    const d = data();
    setSending(true);
    try {
      if (!WEB3FORMS_ACCESS_KEY) {
        console.warn('[form] WEB3FORMS_ACCESS_KEY vazio em src/js/config.js: usando o fluxo de erro.');
        throw new Error('WEB3FORMS_ACCESS_KEY vazio');
      }
      // Web3Forms: JSON com a access key, assunto, remetente e resposta para o e-mail do visitante,
      // mais todos os campos do formulário e os ocultos (origem, UTMs, gclid, fbclid). O honeypot não vai.
      const { botcheck, ...campos } = d;
      const res = await fetch(WEB3FORMS_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({
          access_key: WEB3FORMS_ACCESS_KEY,
          subject: 'Pedido de cotação pelo site',
          from_name: 'Site Goldline',
          replyto: d.email,
          ...campos,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (json.success !== true) throw new Error(`Web3Forms: ${res.status}`);

      track('lead_form_submit', { modal: d.modal, tipo_carga: d.tipo_carga, origem_pagina: d.origem_pagina });
      try { sessionStorage.setItem(SUMMARY_KEY, JSON.stringify({ msg: buildWaMessage(d) })); } catch { /* sem armazenamento */ }
      location.href = `${import.meta.env.BASE_URL}obrigado.html`;
    } catch {
      setSending(false);
      showStatus('Não foi possível enviar agora. Seus dados continuam no formulário: envie pelo WhatsApp ou tente de novo em instantes.', { wa: true });
      waBtn.focus();
    }
  });

  // Atalhos dos cards de solução: pré-seleciona modal e tipo de carga e registra a origem
  return function prefill(link) {
    const m = link.dataset.modal, t = link.dataset.tipo;
    if (m) { const r = form.querySelector(`input[name="modal"][value="${m}"]`); if (r) r.checked = true; }
    if (t) form.elements.tipo_carga.value = t;
    form.elements.origem_pagina.value = link.dataset.cta || 'direto';
  };
}
