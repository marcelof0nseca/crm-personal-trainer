// Calendário do aluno por ligação privada e revogável: leva a hora e a palavra «Treino»,
// nunca avaliações, medidas nem notas. Os calendários não enviam sessão nenhuma.
import { ambiente } from '../_shared/aluno.ts';
import { calendarioDoAluno } from '../_shared/acoes-aluno.ts';

const SLUG = /^[A-Za-z0-9_-]{16,64}$/;

Deno.serve(async (req) => {
  if (req.method !== 'GET') return new Response('Method not allowed', { status: 405 });
  try {
    const env = ambiente();
    const slug = new URL(req.url).searchParams.get('c') || '';
    if (!env || !SLUG.test(slug)) return new Response('Não encontrado', { status: 404 });
    const r = await env.rest(`publico_enderecos?slug=eq.${slug}&tipo=eq.calendario&ativo=eq.true&select=user_id,ref&limit=1`);
    const e = r.ok ? (await r.json())[0] : null;
    if (!e) return new Response('Não encontrado', { status: 404 });
    const a = await env.rest(`app_data?user_id=eq.${e.user_id}&data_key=eq.agenda&select=value`);
    const agenda = a.ok ? ((await a.json())[0]?.value || []) : [];
    return new Response(calendarioDoAluno(agenda, e.ref, { agora: new Date().toISOString() }), { headers: { 'Content-Type': 'text/calendar; charset=utf-8', 'Cache-Control': 'private, max-age=900' } });
  } catch (error) {
    console.error('[publico-calendario]', error);
    return new Response('Erro', { status: 500 });
  }
});
