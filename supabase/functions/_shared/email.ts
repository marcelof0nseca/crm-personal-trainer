// Partilhado entre Edge Functions que mandam e-mail pelo Resend. É a
// primeira vez que duas funções precisam mesmo da mesma coisa -- o resto do
// projeto duplica CORS/origem de propósito (são ~10 linhas por função), mas
// aqui é o layout do e-mail inteiro. Duplicá-lo arriscava as duas cópias
// desalinharem sem ninguém reparar.
export const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';
export const EMAIL_FROM = 'PTMANAGER <suporte@ptmanagerapp.com>';
export const APP_URL = Deno.env.get('APP_ORIGIN') || 'https://ptmanagerapp.com';

export function formatEuro(value: number | null | undefined) {
  if (value == null) return '';
  return `€${Number(value).toFixed(2).replace('.', ',')}`;
}

// Sem depender de dados de locale do Deno (ICU pode não estar completo no
// runtime das Edge Functions) -- dd/mm/aaaa escrito à mão.
export function formatDataPT(iso: string | null | undefined) {
  if (!iso) return '';
  const d = new Date(iso);
  const dia = String(d.getUTCDate()).padStart(2, '0');
  const mes = String(d.getUTCMonth() + 1).padStart(2, '0');
  return `${dia}/${mes}/${d.getUTCFullYear()}`;
}

export function layoutEmail(preheader: string, corpo: string) {
  return `<!doctype html>
<html lang="pt">
  <body style="margin:0;padding:0;background-color:#f4f4f5;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;">
    <span style="display:none;font-size:1px;color:#f4f4f5;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;">${preheader}</span>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px;">
      <tr><td align="center">
        <table role="presentation" width="100%" style="max-width:480px;background-color:#ffffff;border-radius:12px;overflow:hidden;">
          <tr><td style="background-color:#111113;padding:24px 32px;">
            <span style="color:#f5c542;font-size:18px;font-weight:700;letter-spacing:0.02em;">PTMANAGER</span>
          </td></tr>
          <tr><td style="padding:32px;color:#18181b;font-size:15px;line-height:1.6;">
            ${corpo}
          </td></tr>
          <tr><td style="padding:20px 32px;background-color:#fafafa;color:#71717a;font-size:12px;">
            PTMANAGER — gestão para personal trainers independentes.
          </td></tr>
        </table>
      </td></tr>
    </table>
  </body>
</html>`;
}

export function botaoEmail(texto: string, href: string) {
  return `<a href="${href}" style="display:inline-block;background-color:#f5c542;color:#111113;font-weight:600;text-decoration:none;padding:12px 24px;border-radius:8px;">${texto}</a>`;
}

// Nunca lança -- o envio de e-mail é sempre acessório. Quem chama decide se
// regista o erro; esta função só diz se conseguiu, se falhou, ou se está
// desligada (sem RESEND_API_KEY configurada).
export async function enviarEmailResend(
  destinatario: string,
  { subject, html }: { subject: string; html: string },
): Promise<{ ok: boolean; skipped?: boolean; error?: string }> {
  if (!RESEND_API_KEY) return { ok: false, skipped: true };
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: EMAIL_FROM, to: destinatario, subject, html }),
    });
    if (!res.ok) return { ok: false, error: await res.text() };
    return { ok: true };
  } catch (error) {
    return { ok: false, error: error instanceof Error ? error.message : String(error) };
  }
}
