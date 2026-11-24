// Odesílání poptávek rovnou na e-mail Sonii přes Web3Forms (web3forms.com).
// Klíč je veřejný (smí být v kódu) – určuje, na jaký e-mail zprávy chodí.
export const FORMS_KEY = '';

// Vrací 'ok' (odesláno) nebo 'mail' (záložně otevřen e-mail u návštěvníka).
export async function deliver(to, subject, body, who = {}) {
  if (FORMS_KEY) {
    try {
      const r = await fetch('https://api.web3forms.com/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: JSON.stringify({ access_key: FORMS_KEY, subject, from_name: 'Web Sonia Edde', name: who.name || '', email: who.email || '', replyto: who.email || '', 'Poptávka': body })
      });
      const j = await r.json().catch(() => ({}));
      if (r.ok && j.success !== false) return 'ok';
    } catch { /* záložně e-mail */ }
  }
  window.location.href = `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
  return 'mail';
}
