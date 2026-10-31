// Notificações no telemóvel. Sem as chaves VAPID diz «configuração em falta» e não
// envia nada. Com elas, só um agendador com o segredo CRON_SECRET a pode chamar: nada
// de aberturas automáticas nem de dados de saúde no texto.
import { ambiente, corsHeaders, json } from '../_shared/aluno.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const publica = Deno.env.get('VAPID_PUBLIC_KEY');
  const privada = Deno.env.get('VAPID_PRIVATE_KEY');
  const segredo = Deno.env.get('CRON_SECRET');
  if (!publica || !privada || !segredo) return json({ ativo: false, motivo: 'configuração em falta' });
  if (req.headers.get('x-cron-secret') !== segredo) return json({ error: 'Não autorizado.' }, 401);
  const env = ambiente();
  if (!env) return json({ error: 'Variáveis de ambiente em falta.' }, 500);
  try {
    const { default: webpush } = await import('npm:web-push@3.6.7');
    webpush.setVapidDetails(`mailto:${Deno.env.get('VAPID_CONTACTO') || 'suporte@ptmanagerapp.com'}`, publica, privada);
    const { userId, alunoId, titulo, texto } = await req.json();
    const r = await env.rest(`push_subscricoes?user_id=eq.${userId}&aluno_id=eq.${alunoId}&select=endpoint,p256dh,auth`);
    const subs = r.ok ? await r.json() : [];
    let enviadas = 0;
    for (const s of subs) {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify({ titulo: String(titulo).slice(0, 80), texto: String(texto).slice(0, 180) }));
        enviadas += 1;
      } catch (e: any) {
        // Subscrição caducada: sai da lista.
        if (e?.statusCode === 404 || e?.statusCode === 410) await env.rest(`push_subscricoes?endpoint=eq.${encodeURIComponent(s.endpoint)}`, { method: 'DELETE' });
      }
    }
    return json({ ativo: true, enviadas });
  } catch (error) {
    console.error('[notificacoes-despachar]', error);
    return json({ error: 'Não foi possível enviar.' }, 500);
  }
});
