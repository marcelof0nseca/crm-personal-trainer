// O que o aluno pode pedir pela área dele. Lista fechada (`_shared/acoes-aluno.ts`): cada
// pedido vira uma entrada que o treinador trata. O aluno nunca escreve nos dados da conta.
import { ambiente, corsHeaders, gravarEntrada, json, lerBlocos, quemPede } from '../_shared/aluno.ts';
import { validarAcao } from '../_shared/acoes-aluno.ts';
import { configuracaoConnect, sessaoDaFatura } from '../_shared/cobranca.ts';
import { vistaDoAluno } from '../_shared/vista-aluno.ts';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  if (req.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  try {
    const env = ambiente();
    if (!env) return json({ error: 'Variáveis de ambiente em falta.' }, 500);
    const body = await req.json().catch(() => ({}));
    const token = typeof body?.token === 'string' ? body.token.trim() : '';
    const quem = await quemPede(req, token, env);
    if (!quem) return json({ error: 'Sessão em falta ou link inválido.' }, 401);

    const blocos = await lerBlocos(quem.userId, quem.alunoId, env);
    if (!blocos) return json({ error: 'Não foi possível ler os dados.' }, 500);
    const agoraMs = Date.now();
    const hoje = new Date(agoraMs).toISOString().slice(0, 10);
    const vista = vistaDoAluno(blocos, quem.alunoId, { hoje, agoraMs, via: quem.via });
    if (!vista) return json({ error: 'Link inválido ou revogado.' }, 401);

    const op = String(body?.op || '');
    const dados = body?.dados || {};
    const r = validarAcao(op, dados, { via: quem.via, vista, agenda: blocos.agenda, alunoId: quem.alunoId, agoraMs });
    if (r.erro) return json({ error: r.erro }, r.estado || 400);

    if (r.entrada) {
      // A fotografia entra primeiro: uma entrada a apontar para um ficheiro que falhou não serve.
      if (r.fotoInfo) {
        const path = `${quem.userId}/progresso-${crypto.randomUUID()}.${r.fotoInfo.extensao}`;
        const bytes = Uint8Array.from(atob(r.fotoInfo.base64), (c) => c.charCodeAt(0));
        const up = await fetch(`${env.url}/storage/v1/object/documentos/${path}`, { method: 'POST', headers: { apikey: env.service, Authorization: `Bearer ${env.service}`, 'Content-Type': r.fotoInfo.tipo }, body: bytes });
        if (!up.ok) return json({ error: 'Não foi possível guardar a fotografia.' }, 500);
        r.entrada.dados.path = path;
      }
      const ok = await gravarEntrada(env, { user_id: quem.userId, aluno_id: quem.alunoId, origem: 'aluno', ...r.entrada });
      return ok ? json({ ok: true }) : json({ error: 'Não foi possível enviar o pedido.' }, 500);
    }

    if (op === 'marcar_lida') {
      const id = String(dados.id || '').slice(0, 120);
      if (!vista.notificacoes.some((n: any) => n.id === id)) return json({ error: 'Aviso desconhecido.' }, 404);
      const g = await env.rest('notificacao_leituras?on_conflict=user_id,aluno_id,ocorrencia_id', { method: 'POST', headers: { 'Content-Type': 'application/json', Prefer: 'resolution=ignore-duplicates' }, body: JSON.stringify({ user_id: quem.userId, aluno_id: quem.alunoId, ocorrencia_id: id }) });
      return g.ok ? json({ ok: true }) : json({ error: 'Não foi possível guardar.' }, 500);
    }
    if (op === 'abrir_documento') {
      const d = ((blocos.modulos.documentos || {}).itens || []).find((x: any) => x.id === dados.id && x.studentId === quem.alunoId && x.visivelAoAluno);
      if (!d) return json({ error: 'Este documento já não está disponível.' }, 404);
      const s = await fetch(`${env.url}/storage/v1/object/sign/documentos/${d.path}`, { method: 'POST', headers: { apikey: env.service, Authorization: `Bearer ${env.service}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ expiresIn: 300 }) });
      if (!s.ok) return json({ error: 'Não foi possível abrir o ficheiro.' }, 500);
      const { signedURL } = await s.json();
      return json({ url: `${env.url}/storage/v1${signedURL}` });
    }
    if (op === 'ligacao_calendario') {
      const existente = await env.rest(`publico_enderecos?user_id=eq.${quem.userId}&tipo=eq.calendario&ref=eq.${quem.alunoId}&ativo=eq.true&select=slug&limit=1`);
      const atual = existente.ok ? (await existente.json())[0] : null;
      const slug = atual ? atual.slug : Array.from(crypto.getRandomValues(new Uint8Array(24))).map((b) => b.toString(16).padStart(2, '0')).join('');
      if (!atual) {
        const n = await env.rest('publico_enderecos', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ slug, user_id: quem.userId, tipo: 'calendario', ref: quem.alunoId, dados: {}, ativo: true }) });
        if (!n.ok) return json({ error: 'Não foi possível criar a ligação.' }, 500);
      }
      return json({ url: `${env.url}/functions/v1/publico-calendario?c=${slug}` });
    }
    if (op === 'pagar_fatura') {
      const cfg = configuracaoConnect();
      const origem = Deno.env.get('APP_ORIGIN');
      if (!cfg.ativa || !origem) return json({ error: 'O pagamento online não está disponível. Fale com o seu treinador.' }, 503);
      const fatura = ((blocos.modulos.planos || {}).faturas || []).find((f: any) => f.id === dados.id && f.studentId === quem.alunoId);
      if (!fatura) return json({ error: 'Esta fatura já não existe.' }, 404);
      const s = await sessaoDaFatura(cfg.chave!, env, { userId: quem.userId, fatura, sucesso: `${origem}/?aluno=1&pagamento=ok`, cancelado: `${origem}/?aluno=1&pagamento=cancelado` });
      return s.erro ? json({ error: s.erro }, s.estado) : json({ url: s.url });
    }
    if (op === 'push_subscrever') {
      const g = await env.rest('push_subscricoes?on_conflict=endpoint', { method: 'POST', headers: { 'Content-Type': 'application/json', Prefer: 'resolution=merge-duplicates' }, body: JSON.stringify({ endpoint: dados.endpoint, p256dh: dados.p256dh, auth: dados.auth, user_id: quem.userId, aluno_id: quem.alunoId }) });
      return g.ok ? json({ ok: true }) : json({ error: 'Não foi possível guardar.' }, 500);
    }
    if (op === 'push_cancelar') {
      const g = await env.rest(`push_subscricoes?endpoint=eq.${encodeURIComponent(String(dados.endpoint || ''))}&user_id=eq.${quem.userId}&aluno_id=eq.${quem.alunoId}`, { method: 'DELETE' });
      return g.ok ? json({ ok: true }) : json({ error: 'Não foi possível guardar.' }, 500);
    }
    return json({ error: 'Pedido desconhecido.' }, 400);
  } catch (error) {
    console.error('[aluno-acao]', error);
    return json({ error: 'Erro inesperado.' }, 500);
  }
});
