// Páginas públicas: ler um retrato publicado e receber formulários. Sem Turnstile
// configurado não aceita formulários, em vez de os aceitar sem proteção.
import { ambiente, corsHeaders, gravarEntrada, hashToken, json } from '../_shared/aluno.ts';
import { retratoPublico, validarPublico } from '../_shared/acoes-aluno.ts';

const SLUG = /^[A-Za-z0-9_-]{8,64}$/;
const LIMITE_POR_HORA = 20;

async function dentroDoLimite(env: NonNullable<ReturnType<typeof ambiente>>, chave: string) {
  const janela = new Date(Math.floor(Date.now() / 3600000) * 3600000).toISOString();
  const r = await env.rest('rpc/publico_contar_pedido', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ p_chave: chave, p_janela: janela }) });
  if (!r.ok) return false; // falha fechada: sem contagem não se aceita
  return (await r.json()) <= LIMITE_POR_HORA;
}

async function turnstileValido(token: string, ip: string) {
  const secret = Deno.env.get('TURNSTILE_SECRET_KEY');
  if (!secret) return null;
  const r = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: new URLSearchParams({ secret, response: token, remoteip: ip }) });
  return r.ok ? Boolean((await r.json()).success) : false;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  try {
    const env = ambiente();
    if (!env) return json({ error: 'Variáveis de ambiente em falta.' }, 500);
    const body = await req.json().catch(() => ({}));
    const slug = String(body?.slug || '');
    if (!SLUG.test(slug)) return json({ error: 'Esta página não existe.' }, 404);
    const r = await env.rest(`publico_enderecos?slug=eq.${slug}&select=slug,user_id,tipo,ref,dados,ativo,expira_em&limit=1`);
    const endereco = r.ok ? (await r.json())[0] : null;
    const agoraMs = Date.now();
    if (!endereco || !endereco.ativo || endereco.tipo === 'calendario' || (endereco.expira_em && Date.parse(endereco.expira_em) < agoraMs)) return json({ error: 'Esta página já não está disponível.' }, 404);

    if (body.op === 'ver') return json({ pagina: retratoPublico(endereco) });

    const ip = (req.headers.get('x-forwarded-for') || '').split(',')[0].trim();
    if (!(await dentroDoLimite(env, await hashToken(`${ip}:${slug}`)))) return json({ error: 'Demasiados pedidos. Tente mais tarde.' }, 429);
    const humano = await turnstileValido(String(body.turnstile || ''), ip);
    if (humano === null) return json({ error: 'Esta página ainda não recebe formulários.' }, 503);
    if (!humano) return json({ error: 'Não foi possível confirmar o pedido. Tente de novo.' }, 400);

    const participanteNovo = crypto.randomUUID().replace(/-/g, '');
    const v = validarPublico(endereco, body.dados || {}, { agoraMs, participanteNovo });
    if (v.erro) return json({ error: v.erro }, v.estado || 400);
    if (v.ignorar) return json({ ok: true });

    if (v.exigeInscricao) {
      const i = await env.rest(`entradas?user_id=eq.${endereco.user_id}&tipo=eq.desafio_inscricao&ref=eq.${encodeURIComponent(endereco.ref)}&dados->>participante=eq.${v.exigeInscricao}&select=id&limit=1`);
      if (!i.ok || (await i.json()).length === 0) return json({ error: 'Inscreva-se primeiro.' }, 403);
    }
    const ok = await gravarEntrada(env, { user_id: endereco.user_id, aluno_id: endereco.tipo === 'indicacao' ? null : null, origem: 'publico', ...v.entrada });
    if (!ok) return json({ error: 'Não foi possível enviar.' }, 500);
    return json({ ok: true, participante: v.participante });
  } catch (error) {
    console.error('[publico]', error);
    return json({ error: 'Erro inesperado.' }, 500);
  }
});
