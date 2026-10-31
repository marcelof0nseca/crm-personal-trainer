// O separador «Mais»: a entrada para os módulos que não cabem na barra. Cada área
// carrega só quando se abre.
import { Suspense, lazy, useState } from 'react';
import { ArrowLeft, BookOpen, CalendarCog, ClipboardList, Contact, FileText, HeartPulse, Inbox, ListChecks, Megaphone, MessageSquareText, Receipt, Send, Trophy } from 'lucide-react';

const AREAS = [
  { id: 'novidades', rotulo: 'Novidades', ajuda: 'O que os alunos e o público enviaram, à espera da sua decisão', icon: Inbox, comp: lazy(() => import('./novidades/Novidades')) },
  { id: 'retencao', rotulo: 'Retenção', ajuda: 'Quem está a treinar e quem deixou de treinar', icon: HeartPulse, comp: lazy(() => import('./retencao/CentralRetencao')) },
  { id: 'tarefas', rotulo: 'Tarefas e regras', ajuda: 'O que há para fazer hoje e regras automáticas', icon: ListChecks, comp: lazy(() => import('./crm/Tarefas')) },
  { id: 'crm', rotulo: 'Contactos', ajuda: 'Interessados, importação, grupos e lixeira', icon: Contact, comp: lazy(() => import('./crm/CentralCrm')) },
  { id: 'mensagens', rotulo: 'Mensagens', ajuda: 'Modelos prontos e avisos para a área do aluno', icon: Send, comp: lazy(() => import('./crm/Mensagens')) },
  { id: 'agenda', rotulo: 'Agenda avançada', ajuda: 'Modelos de horário, turmas, lista de espera, locais e calendário', icon: CalendarCog, comp: lazy(() => import('./agenda/AgendaAvancada')) },
  { id: 'planos', rotulo: 'Planos e faturas', ajuda: 'O que os alunos pagam: planos, faturas, contratos e carteira', icon: Receipt, comp: lazy(() => import('./planos/CentroPlanos')) },
  { id: 'documentos', rotulo: 'Documentos', ajuda: 'Ficheiros do aluno e formulários para ele preencher', icon: FileText, comp: lazy(() => import('./documentos/Documentos')) },
  { id: 'vendas', rotulo: 'Vendas', ajuda: 'Página de vendas, inscrição, indicações e imagens', icon: Megaphone, comp: lazy(() => import('./vendas/Vendas')) },
  { id: 'fidelizacao', rotulo: 'Desafios e pontos', ajuda: 'Desafios, pontos, recompensas e satisfação', icon: Trophy, comp: lazy(() => import('./fidelidade/Fidelizacao')) },
  { id: 'conteudos', rotulo: 'Conteúdos', ajuda: 'Biblioteca editorial revista', icon: BookOpen, comp: lazy(() => import('./conteudos/Conteudos')) },
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
