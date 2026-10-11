// A área do aluno: um shell próprio, fora da app do treinador -- ver
// CLAUDE.md, secção 4 ("Área do aluno"). O aluno entra por um link com
// token (`?a=...`), nunca por conta Supabase própria; `App()` (painel-pt.tsx)
// renderiza isto EM VEZ de `AppInner` quando a URL tem o token, antes de
// qualquer hook de autenticação do treinador sequer montar.
//
// Nunca importa nada de painel-pt.tsx (a direção é sempre a mesma dos outros
// `*Atoms.tsx`: painel-pt.tsx importa daqui, nunca o contrário) -- só de
// TreinoAtoms.tsx e de src/data, os mesmos componentes e lógica reais que o
// treinador usa, não uma reprodução.
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { supabase, supabaseConfigured } from '../supabaseClient';
import { ExercicioVista } from './TreinoAtoms';

function Ecra({ children }) {
  return (
    <div
      className="px-4 py-4 max-w-3xl mx-auto flex flex-col gap-4"
      style={{ minHeight: '100dvh' }}
    >
      {children}
    </div>
  );
}

function EcraCentrado({ children }) {
  return (
    <div style={{ minHeight: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
      <div className="flex flex-col items-center gap-3 text-center" style={{ maxWidth: 340 }}>
        {children}
      </div>
    </div>
  );
}

function ListaDeProgramas({ prescricoes, onAbrir }) {
  if (prescricoes.length === 0) {
    return (
      <p className="text-sm font-body text-faint">
        Ainda não há nenhum programa de treino atribuído. Fale com o seu treinador.
      </p>
    );
  }
  return (
    <div className="flex flex-col gap-2">
      <h2 className="text-2xs uppercase tracking-wide text-faint font-mono">Os seus programas</h2>
      {prescricoes.map((p) => (
        <button
          key={p.id}
          type="button"
          onClick={() => onAbrir(p.id)}
          className="card text-left btn-surface flex flex-col gap-0.5"
        >
          <span className="text-sm font-body text-primary" style={{ fontWeight: 600 }}>
            {p.nome || 'Programa de treino'}
          </span>
          {p.objetivo && <span className="text-2xs font-body text-faint">{p.objetivo}</span>}
        </button>
      ))}
    </div>
  );
}

function ProgramaDoAluno({ prescricao, onVoltar }) {
  const treinos = Array.isArray(prescricao.treinos) ? prescricao.treinos : [];
  const [treinoId, setTreinoId] = useState(treinos[0]?.id || null);
  const treino = treinos.find((t) => t.id === treinoId) || treinos[0] || null;

  return (
    <div className="flex flex-col gap-3">
      <button type="button" onClick={onVoltar} className="btn btn-ghost self-start" style={{ fontSize: 12 }}>
        ← Os seus programas
      </button>
      <h2 className="font-display font-semibold text-lg text-primary tracking-wide">
        {prescricao.nome || 'Programa de treino'}
      </h2>

      {treinos.length > 1 && (
        <div className="flex gap-2 flex-wrap">
          {treinos.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTreinoId(t.id)}
              className={t.id === (treino && treino.id) ? 'btn btn-primary' : 'btn btn-ghost'}
              style={{ fontSize: 12 }}
            >
              {t.nome || 'Treino'}
            </button>
          ))}
        </div>
      )}

      {treino ? (
        (treino.exercicios || []).length === 0 ? (
          <p className="text-xs font-body text-faint">Este treino ainda não tem exercícios.</p>
        ) : (
          <div className="flex flex-col gap-2">
            {(treino.exercicios || []).map((ex) => (
              // biblioteca=[] -- a área do aluno não precisa de resolver nome
              // de grupo muscular/equipamento nem vídeo: o nome, as séries e
              // a carga já vêm na própria prescrição. onMudar={() => {}} é o
              // mesmo padrão já usado na landing para uma vista só de leitura
              // (LandingPage.tsx) -- o componente é real, só não persiste.
              <ExercicioVista key={ex.id} ex={ex} biblioteca={[]} onMudar={() => {}} comCabecalho />
            ))}
          </div>
        )
      ) : (
        <p className="text-xs font-body text-faint">Este programa ainda não tem treinos.</p>
      )}
    </div>
  );
}

export default function AreaDoAluno({ token }) {
  const [estado, setEstado] = useState('a-carregar'); // a-carregar | ok | erro
  const [erro, setErro] = useState('');
  const [dados, setDados] = useState(null);
  const [abertoId, setAbertoId] = useState(null);

  useEffect(() => {
    let vivo = true;
    async function carregar() {
      if (!supabaseConfigured || !supabase) {
        if (vivo) { setErro('Esta ligação não está configurada.'); setEstado('erro'); }
        return;
      }
      try {
        const { data, error } = await supabase.functions.invoke('aluno-view', { body: { token } });
        if (!vivo) return;
        if (error) {
          // Um estado HTTP que não seja 2xx chega aqui, não em `data` -- o
          // corpo (`{ error: '...' }`) só se lê pelo `context`, a Response
          // original. Sem isto, qualquer link inválido mostrava sempre a
          // mesma mensagem genérica, nunca a razão a sério do servidor.
          let mensagem = 'Não foi possível abrir este link.';
          try {
            const corpo = error.context && typeof error.context.json === 'function'
              ? await error.context.json()
              : null;
            if (corpo && corpo.error) mensagem = corpo.error;
          } catch {
            // Resposta sem JSON -- fica a mensagem genérica.
          }
          setErro(mensagem);
          setEstado('erro');
          return;
        }
        if (!data || data.error) {
          setErro((data && data.error) || 'Não foi possível abrir este link.');
          setEstado('erro');
          return;
        }
        setDados(data);
        setEstado('ok');
      } catch {
        if (vivo) { setErro('Não foi possível ligar ao servidor.'); setEstado('erro'); }
      }
    }
    carregar();
    return () => { vivo = false; };
  }, [token]);

  if (estado === 'a-carregar') {
    return (
      <EcraCentrado>
        <Loader2 size={22} className="text-faint spin" />
        <p className="text-sm font-body text-faint">A abrir...</p>
      </EcraCentrado>
    );
  }

  if (estado === 'erro') {
    return (
      <EcraCentrado>
        <p className="text-sm font-body text-primary" style={{ fontWeight: 600 }}>Link inválido</p>
        <p className="text-xs font-body text-faint">{erro} Peça ao seu treinador um link novo.</p>
      </EcraCentrado>
    );
  }

  const { aluno, prescricoes } = dados;
  const aberto = prescricoes.find((p) => p.id === abertoId);

  return (
    <Ecra>
      <div className="flex items-center gap-2">
        <span className="w-3 h-3 rounded-full flex-shrink-0" style={{ backgroundColor: aluno.color || 'var(--brass)' }} />
        <h1 className="font-display font-semibold text-xl text-primary tracking-wide truncate">{aluno.name}</h1>
      </div>

      {aberto ? (
        <ProgramaDoAluno prescricao={aberto} onVoltar={() => setAbertoId(null)} />
      ) : (
        <ListaDeProgramas prescricoes={prescricoes} onAbrir={setAbertoId} />
      )}
    </Ecra>
  );
}
