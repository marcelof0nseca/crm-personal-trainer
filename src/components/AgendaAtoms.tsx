// O sistema de tipos/cores da agenda e o cartão de sessão, extraídos para
// aqui para serem reaproveitados tal como são na landing (LandingPage.tsx),
// sem depender de painel-pt.tsx -- que passa a importar tudo isto daqui, em
// vez de o definir localmente. Ter um sítio só para as cores também é o que
// garante que a app e a landing nunca mostram paletas diferentes.
import {
  Repeat, Shuffle, RotateCcw, ClipboardCheck, Sparkles, Coffee, Ban, Users,
  Dumbbell, UtensilsCrossed, Stethoscope, Tag, CheckCircle2, UserX,
} from 'lucide-react';

// Cada tipo com uma cor própria e nenhuma repetida dentro da mesma lista --
// duas marcações vizinhas do mesmo tipo de lista (duas aulas, ou dois
// eventos) nunca se confundem só pela cor. `flutuante`, `outro` e
// `consulta_medica` mudaram de cor aqui (antes repetiam `reuniao`,
// `bloqueado` e `experimental`, respetivamente).
export const SESSION_TYPES = [
  { id: 'fixo', label: 'Horário Fixo', icon: Repeat, color: '#4A90D9' },
  { id: 'flutuante', label: 'Horário Flutuante', icon: Shuffle, color: '#E0A83D' },
  { id: 'reposicao', label: 'Reposição', icon: RotateCcw, color: '#5FBFA0' },
  { id: 'avaliacao', label: 'Avaliação Física', icon: ClipboardCheck, color: '#D6764A' },
  { id: 'experimental', label: 'Aula Experimental', icon: Sparkles, color: '#E08FB0' },
];

export const EVENT_TYPES = [
  { id: 'horario_livre', label: 'Horário Livre', icon: Coffee, color: '#5FC4D0' },
  { id: 'bloqueado', label: 'Bloqueado', icon: Ban, color: '#8C8C8C' },
  { id: 'reuniao', label: 'Reunião', icon: Users, color: '#9B8AC4' },
  { id: 'treino_pessoal', label: 'Meu Treino', icon: Dumbbell, color: '#6FCF97' },
  { id: 'almoco', label: 'Horário de Almoço', icon: UtensilsCrossed, color: '#F2A65A' },
  { id: 'consulta_medica', label: 'Consulta Médica', icon: Stethoscope, color: '#FF8B6B' },
  { id: 'outro', label: 'Outro', icon: Tag, color: '#9CA3AF' },
];

export const STATUS_OPTIONS = [
  { id: 'agendado', label: 'Agendado', color: '#8C8C8C' },
  { id: 'realizado', label: 'Realizado', color: '#5FBFA0' },
  { id: 'falta', label: 'Falta', color: '#D6534A' },
  { id: 'cancelado', label: 'Cancelado', color: '#5C5C5C' },
];

// As cores de tipo/estado foram escolhidas para fundo preto: sobre branco,
// várias descem abaixo de 3:1 e deixam de se ler. Como preenchimento não há
// problema -- só texto e ícones precisam desta correção. No tema escuro
// devolve a cor intacta (a mistura é de 0%).
export function acentoTexto(hex) {
  return `color-mix(in srgb, ${hex}, var(--acc-mix) var(--acc-amt))`;
}

// Um ícone é um componente React e NÃO sobrevive a JSON.stringify: as
// categorias personalizadas eram gravadas com o componente e voltavam do
// armazenamento como {}, fazendo o React rebentar ao renderizá-las (erro
// #130). Validar sempre antes de usar, e cair no ícone genérico quando o
// valor não for renderizável.
export function iconOf(candidate, fallback = Tag) {
  if (typeof candidate === 'function') return candidate;
  if (candidate && typeof candidate === 'object' && candidate.$$typeof) return candidate;
  return fallback;
}

export function sessionTypeFor(typeId, customCategories) {
  const list = [...SESSION_TYPES, ...((customCategories && customCategories.sessionTypes) || [])];
  return list.find((t) => t.id === typeId) || SESSION_TYPES[0];
}
export function eventTypeFor(typeId, customCategories) {
  const list = [...EVENT_TYPES, ...((customCategories && customCategories.eventTypes) || [])];
  return list.find((t) => t.id === typeId) || EVENT_TYPES[0];
}

function minutosDe(hhmm) {
  if (!hhmm) return 0;
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

// Arrasto com Pointer Events, e nao com HTML5 drag-and-drop: o HTML5 DnD nao
// funciona em toque, que e onde a agenda mais se usa.
//
// A pega e propria (nao o cartao inteiro) por causa do touch-action: para o
// browser nos entregar o movimento em vez de deslizar a pagina, a zona tem de
// ter touch-action: none -- e isso, aplicado ao cartao todo, impediria o
// utilizador de fazer scroll comecando em cima de uma aula.
// compact = coluna estreita da semana no desktop. Aí o rótulo do tipo é
// omitido (o ícone colorido já o identifica) e as ações ficam lado a lado,
// para o nome do aluno ter a largura toda.
export function SessionCard({ session, student, onOpen, onQuickStatus, customCategories, compact, selecao }) {
  // Em modo de seleção o cartão deixa de abrir e passa a marcar-se: mover em
  // bloco faz-se pela barra, com data à escolha.
  const aSelecionar = Boolean(selecao && selecao.ativo);
  const selecionada = aSelecionar && selecao.ids.includes(session.id);
  const abrir = aSelecionar ? () => selecao.alternar(session.id) : onOpen;
  const isEvento = session.kind === 'evento';
  const type = isEvento ? eventTypeFor(session.type, customCategories) : sessionTypeFor(session.type, customCategories);
  const TypeIcon = iconOf(type.icon);
  const isFalta = session.status === 'falta';
  const isCancelado = session.status === 'cancelado';
  const isRealizado = session.status === 'realizado';
  // A cor identifica o TIPO da marcação (horário fixo, reposição, avaliação,
  // um evento pessoal…), não o aluno — cada tipo já tem cor própria fixa em
  // SESSION_TYPES/EVENT_TYPES, pensada para se reconhecer a olho na agenda. O
  // nome do aluno já vai escrito por extenso; usar a cor dele aqui apagava
  // essa diferenciação por tipo, que é a que ajuda a ler o dia de relance.
  const color = type.color;
  const statusInfo = STATUS_OPTIONS.find((o) => o.id === session.status);

  // A caixa ocupa o espaço proporcional à duração real -- 64px (32px no modo
  // compacto) por hora, com um mínimo para uma marcação curta continuar
  // legível. Uma aula de 09:00-11:00 fica visivelmente mais alta que uma de
  // 09:00-10:00, em vez de as duas parecerem do mesmo tamanho.
  const duracaoMin = Math.max(0, minutosDe(session.endTime) - minutosDe(session.startTime));
  const pxPorHora = compact ? 48 : 64;
  const alturaMin = Math.max(compact ? 52 : 64, (duracaoMin / 60) * pxPorHora);

  // Confirmar a aula, a falta e a falta com direito a reposição. Cada uma com
  // a sua cor cheia: verde é aconteceu, vermelho é falta seca, dourado é falta
  // que gera crédito. São irmãos do cartão e não filhos, pela mesma razão da
  // pega de arrastar — um <button> dentro de um elemento com role="button" é
  // ARIA inválido e o rótulo de cada ação entraria no nome acessível do
  // cartão. Por isso ficam sobrepostos no canto, e o cartão abre-lhes um vão
  // da mesma largura para o nome do aluno não passar por baixo.
  const podeDar = !isEvento && !aSelecionar && !isRealizado && !isCancelado && !isFalta;
  const podeFaltar = !isEvento && !aSelecionar && !isFalta && !isCancelado;
  const nAcoes = (podeDar ? 1 : 0) + (podeFaltar ? 2 : 0);
  const ladoAcao = compact ? 21 : 22;
  // Compacto empilha-as em linha (a coluna é baixa); largo empilha em coluna.
  const vaoAcoes = nAcoes === 0 ? 0 : (compact ? nAcoes * ladoAcao + (nAcoes - 1) * 4 : ladoAcao);
  const acaoRapida = (estado, rotulo, titulo, Icone, fundo) => (
    <button
      key={estado}
      onClick={(e) => { e.stopPropagation(); onQuickStatus(session, estado); }}
      type="button"
      className="rounded"
      style={{ padding: 4, backgroundColor: fundo, lineHeight: 0 }}
      aria-label={rotulo}
      title={titulo}
    >
      <Icone size={compact ? 13 : 14} style={{ color: '#0A0A0A', display: 'block' }} />
    </button>
  );

  const faixaHorario = session.endTime && session.endTime !== session.startTime
    ? `${session.startTime}–${session.endTime}`
    : session.startTime;

  return (
    <div className="relative min-w-0">
      {nAcoes > 0 && (
        <div
          className={`absolute flex gap-1 ${compact ? '' : 'flex-col'}`}
          style={{ top: 8, right: 6, zIndex: 2 }}
        >
          {podeDar && acaoRapida('realizado', 'Marcar como realizado', 'Aula dada', CheckCircle2, 'var(--ok)')}
          {podeFaltar && acaoRapida('falta', 'Falta sem direito a reposição', 'Falta, sem reposição', UserX, 'var(--rust)')}
          {podeFaltar && acaoRapida('falta_reposicao', 'Falta com direito a reposição', 'Falta, com direito a reposição', RotateCcw, 'var(--gold)')}
        </div>
      )}
    <div
      onClick={abrir}
      role="button"
      tabIndex={0}
      aria-pressed={aSelecionar ? selecionada : undefined}
      onKeyDown={(e) => { if (e.key === 'Enter') abrir(); }}
      className={`rounded-lg border border-hair pl-3 pr-1.5 py-2.5 cursor-pointer card-hover animate-in ${isCancelado ? 'opacity-50' : ''}`}
      // Sem borderColor: a abreviada entra em conflito com borderLeftColor e o
      // React avisa. O retorno do arrasto vem do realce da coluna e da sombra,
      // que ja chegam.
      style={{
        // A célula inteira leva a cor, não só a tira da esquerda: de relance,
        // a agenda passa a dizer-se pelas cores. A mistura é com `transparent`
        // para funcionar por cima do fundo, seja ele claro ou escuro.
        backgroundColor: `color-mix(in srgb, ${color} var(--celula-tinta), var(--bg-elevated))`,
        borderStyle: isEvento ? 'dashed solid solid dashed' : 'solid',
        borderLeftWidth: '3px',
        borderLeftColor: color,
        // Marcada: anel a toda a volta, que a cor da célula já ocupa o fundo.
        boxShadow: selecionada ? '0 0 0 2px var(--brass)' : undefined,
        opacity: aSelecionar && !selecionada ? 0.62 : undefined,
        minHeight: alturaMin,
      }}
    >
      {aSelecionar && (
        <span className="flex items-center gap-1.5 mb-1.5">
          <input
            type="checkbox"
            checked={selecionada}
            readOnly
            tabIndex={-1}
            aria-hidden="true"
            style={{ accentColor: 'var(--brass)', pointerEvents: 'none' }}
          />
          <span className="text-2xs font-body text-faint">{selecionada ? 'Selecionada' : 'Selecionar'}</span>
        </span>
      )}
      {/* Compacto: hora + ações na 1.ª linha, nome na 2.ª, estado com a linha
          toda na 3.ª — assim "Agendado" nunca é cortado a meio. */}
      {compact ? (
        <div className="flex flex-col gap-1 min-w-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <span className="font-mono text-2xs text-muted nowrap">{faixaHorario}</span>
            <span className="rounded p-0.5 flex-shrink-0" style={{ backgroundColor: `color-mix(in srgb, ${type.color} 15%, transparent)` }}>
              <TypeIcon size={10} style={{ color: acentoTexto(type.color), display: 'block' }} />
            </span>
            <span className="flex-1" />
            {vaoAcoes > 0 && <span aria-hidden="true" style={{ width: vaoAcoes, flexShrink: 0 }} />}
          </div>
          <div
            className={`font-body text-sm text-primary truncate ${isFalta ? 'line-through' : ''}`}
            style={{ fontWeight: 500 }}
            title={isEvento ? type.label : (student?.name || 'Aluno removido')}
          >
            {isEvento ? type.label : (student?.name || 'Aluno removido')}
          </div>
          <span className="badge self-start" style={{ color: acentoTexto(statusInfo?.color), backgroundColor: `color-mix(in srgb, ${statusInfo?.color} 14%, transparent)` }}>
            {statusInfo?.label}
          </span>
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between gap-1">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-1.5 mb-1 min-w-0">
                <span className="font-mono text-2xs text-muted nowrap">{faixaHorario}</span>
                <span className="rounded p-0.5 flex-shrink-0" style={{ backgroundColor: `color-mix(in srgb, ${type.color} 15%, transparent)` }}>
                  <TypeIcon size={10} style={{ color: acentoTexto(type.color), display: 'block' }} />
                </span>
                {!isEvento && <span className="text-2xs font-body text-faint truncate">{type.label}</span>}
              </div>
              <div
                className={`font-body text-sm text-primary truncate ${isFalta ? 'line-through' : ''}`}
                style={{ fontWeight: 500 }}
                title={isEvento ? type.label : (student?.name || 'Aluno removido')}
              >
                {isEvento ? type.label : (student?.name || 'Aluno removido')}
              </div>
            </div>
            {vaoAcoes > 0 && <span aria-hidden="true" style={{ width: vaoAcoes, flexShrink: 0 }} />}
          </div>
          <span className="badge mt-1.5" style={{ color: acentoTexto(statusInfo?.color), backgroundColor: `color-mix(in srgb, ${statusInfo?.color} 14%, transparent)` }}>
            {statusInfo?.label}
          </span>
        </>
      )}
    </div>
    </div>
  );
}
