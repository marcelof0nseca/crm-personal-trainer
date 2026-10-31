// O separador «Mais»: a entrada para os módulos que não cabem na barra. Cada área
// carrega só quando se abre.
import { Suspense, lazy, useState } from 'react';
import { ArrowLeft, CalendarCog, ClipboardList, MessageSquareText } from 'lucide-react';

const AREAS = [
  { id: 'agenda', rotulo: 'Agenda avançada', ajuda: 'Modelos de horário, turmas, lista de espera, locais e calendário', icon: CalendarCog, comp: lazy(() => import('./agenda/AgendaAvancada')) },
  { id: 'avaliacoes', rotulo: 'Centro de avaliações', ajuda: 'Postural, funcional, neuromotora, modelos e envio ao aluno', icon: ClipboardList, comp: lazy(() => import('./avaliacoes/CentroAvaliacoes')) },
  { id: 'feedbacks', rotulo: 'Feedbacks', ajuda: 'O que os alunos disseram dos treinos', icon: MessageSquareText, comp: lazy(() => import('./feedbacks/CentralFeedbacks')) },
];

export default function CentroModulos(props) {
  const [abertaId, setAbertaId] = useState(null);
  const aberta = AREAS.find((a) => a.id === abertaId);
  if (aberta) {
    const Area = aberta.comp;
    return (
      <div className="px-4 py-4 max-w-3xl mx-auto flex flex-col gap-4">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setAbertaId(null)} className="p-2 rounded-lg bg-surface border border-hair btn-surface flex-shrink-0" aria-label="Voltar a Mais">
            <ArrowLeft size={16} className="text-muted" />
          </button>
          <h1 className="font-display font-semibold text-xl text-primary tracking-wide truncate" style={{ margin: 0 }}>{aberta.rotulo}</h1>
        </div>
        <Suspense fallback={<p className="text-sm font-body text-faint" role="status">A carregar...</p>}>
          <Area {...props} />
        </Suspense>
      </div>
    );
  }
  return (
    <div className="px-4 py-4 max-w-3xl mx-auto grid grid-cols-1 sm:grid-cols-2 gap-2">
      {AREAS.map((a) => {
        const Icone = a.icon;
        return (
          <button key={a.id} type="button" onClick={() => setAbertaId(a.id)} className="card card-hover p-4 text-left flex items-start gap-3 min-w-0">
            <span className="rounded-md p-2 flex-shrink-0" style={{ backgroundColor: 'var(--brass-soft)' }}><Icone size={18} className="text-brass" style={{ display: 'block' }} /></span>
            <span className="min-w-0">
              <span className="block text-sm font-body text-primary" style={{ fontWeight: 600 }}>{a.rotulo}</span>
              <span className="block text-2xs font-body text-faint">{a.ajuda}</span>
            </span>
          </button>
        );
      })}
    </div>
  );
}
