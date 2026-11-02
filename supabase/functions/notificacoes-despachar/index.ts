// Envia as notificações em falta: lembretes de aula e avisos ativos. Chama-o um agendador
// com o segredo CRON_SECRET. Sem as chaves VAPID diz «configuração em falta» e não envia.
import webpush from 'npm:web-push@3.6.7';
import { ambiente, corsHeaders, json } from '../_shared/aluno.ts';
import { pushesPendentes } from '../_shared/push.ts';

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
    webpush.setVapidDetails(`mailto:${Deno.env.get('VAPID_CONTACTO') || 'suporte@ptmanagerapp.com'}`, publica, privada);
    const r = await env.rest('push_subscricoes?select=endpoint,user_id,aluno_id,p256dh,auth&limit=5000');
    if (!r.ok) return json({ error: 'Não foi possível ler as subscrições.' }, 500);
    const subs = await r.json();
    const contas = [...new Set(subs.map((s: any) => s.user_id))];
    const agoraMs = Date.now();
    let enviadas = 0;

    for (const userId of contas) {
      const dessaConta = subs.filter((s: any) => s.user_id === userId);
      const b = await env.rest(`app_data?user_id=eq.${userId}&data_key=in.(alunos,agenda,modulo:mensagens,modulo:crm)&select=data_key,value`);
      if (!b.ok) continue;
      const linhas = await b.json();
      const valor = (k: string) => linhas.find((l: any) => l.data_key === k)?.value;
      const e = await env.rest(`push_envios?user_id=eq.${userId}&select=aluno_id,ocorrencia_id&limit=20000`);
      const enviados = e.ok ? (await e.json()).map((x: any) => `${x.aluno_id}|${x.ocorrencia_id}`) : null;
      if (!enviados) continue; // sem saber o que já saiu, não se repete nada
      const pendentes = pushesPendentes({ alunos: valor('alunos'), agenda: valor('agenda'), mensagens: valor('modulo:mensagens'), grupos: valor('modulo:crm')?.grupos }, dessaConta.map((s: any) => s.aluno_id), enviados, agoraMs);

      for (const p of pendentes) {
        // Marca-se antes de enviar: em caso de dúvida, uma a menos em vez de uma repetida.
        const marca = await env.rest('push_envios?on_conflict=user_id,aluno_id,ocorrencia_id', { method: 'POST', headers: { 'Content-Type': 'application/json', Prefer: 'resolution=ignore-duplicates,return=representation' }, body: JSON.stringify({ user_id: userId, aluno_id: p.alunoId, ocorrencia_id: p.ocorrenciaId }) });
        if (!marca.ok || (await marca.json()).length === 0) continue;
        for (const s of dessaConta.filter((x: any) => x.aluno_id === p.alunoId)) {
          try {
            await webpush.sendNotification({ endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } }, JSON.stringify({ titulo: String(p.titulo).slice(0, 80), texto: String(p.texto).slice(0, 180) }));
            enviadas += 1;
          } catch (err: any) {
            // Subscrição caducada: sai da lista.
            if (err?.statusCode === 404 || err?.statusCode === 410) await env.rest(`push_subscricoes?endpoint=eq.${encodeURIComponent(s.endpoint)}`, { method: 'DELETE' });
            else console.error('[notificacoes-despachar] envio', err?.statusCode);
          }
        }
      }
    }
    return json({ ativo: true, enviadas });
  } catch (error) {
    console.error('[notificacoes-despachar]', error);
    return json({ error: 'Não foi possível enviar.' }, 500);
  }
});
