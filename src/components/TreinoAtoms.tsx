// O sistema de linhas de série (TIPOS_SERIE) e o cartão de exercício da
// vista de treino, extraídos para aqui para serem reaproveitados tal como
// são na landing (LandingPage.tsx), sem depender de painel-pt.tsx -- que
// passa a importar tudo isto daqui, em vez de o definir localmente.
import { useState } from 'react';

export const CAMPO_SERIE = {
  reps: ['Reps', '10'],
  carga: ['Carga', '40 kg'],
  tempo: ['Tempo', '40 s'],
  duracao: ['Duração', '12 min'],
  distancia: ['Distância', '400 m'],
  velocidade: ['Velocidade', '10 km/h'],
  ritmo: ['Ritmo', '5:30 /km'],
  potencia: ['Potência', '180 W'],
  inclinacao: ['Inclinação', '6%'],
  cadencia: ['Cadência', '3-1-1'],
  percentagem1rm: ['% 1RM', '75%'],
};

export const TIPOS_SERIE = [
  { id: 'reps_carga', label: 'Repetições e carga', campos: ['reps', 'carga'] },
  { id: 'reps_carga_tempo', label: 'Repetições, carga e tempo', campos: ['reps', 'carga', 'tempo'] },
  { id: 'reps_tempo', label: 'Repetições e tempo', campos: ['reps', 'tempo'] },
  { id: 'reps_1rm', label: 'Repetições e % de 1RM', campos: ['reps', 'percentagem1rm'] },
  { id: 'cadencia', label: 'Repetições, carga e cadência', campos: ['reps', 'carga', 'cadencia'] },
  { id: 'tempo_inclinacao', label: 'Tempo e inclinação', campos: ['tempo', 'inclinacao'] },
  { id: 'corrida', label: 'Corrida', campos: ['distancia', 'tempo', 'ritmo'] },
  { id: 'cardio', label: 'Cardio', campos: ['duracao', 'velocidade', 'potencia'] },
  { id: 'observacao', label: 'Só observação', campos: [] },
];
export const TIPO_SERIE_OMISSAO = 'reps_carga';

// Os métodos que precisam de números próprios. Escolher EMOM e não haver onde
// pôr os minutos deixava o método a valer só como etiqueta.
export const CAMPOS_POR_METODO = {
  'EMOM': [['minutos', 'Minutos', '12'], ['janela', 'Minutos por janela', '1']],
  'AMRAP': [['minutos', 'Minutos', '15']],
  'Tabata': [['rondas', 'Rondas', '8'], ['trabalho', 'Trabalho (s)', '20'], ['pausa', 'Pausa (s)', '10']],
  'Circuito': [['voltas', 'Voltas', '3'], ['pausaVolta', 'Pausa entre voltas (s)', '90']],
  'Intervalado': [
    ['esforco', 'Esforço (s)', '30'], ['recuperacao', 'Recuperação (s)', '60'],
    ['blocos', 'Blocos', '1'], ['pausaBloco', 'Pausa entre blocos (s)', '120'],
    ['preparacao', 'Preparação inicial (s)', '10'],
  ],
  'For time': [['limite', 'Tempo limite', '10 min']],
  'Drop-set': [['quedas', 'Quedas', '2'], ['reducao', 'Redução por queda (%)', '20']],
  'Strip Set': [['quedas', 'Quedas', '2'], ['reducaoAbsoluta', 'Redução por queda (kg)', '5']],
  'Rest-pause': [['pausas', 'Pausas', '3'], ['pausaSeg', 'Pausa (s)', '15']],
  'Back-off': [['reducao', 'Redução (%)', '15']],
  'Pirâmide': [
    ['etapas', 'Etapas', '4'],
    ['sentido', 'Sentido (crescente, decrescente, completa)', 'crescente'],
    ['incrementoPct', 'Variação de carga por etapa (%)', '10'],
  ],
  'Cluster': [
    ['seriesCompletas', 'Séries completas', '3'],
    ['miniBlocosPorSerie', 'Blocos por série', '3'],
    ['pausaIntra', 'Pausa entre blocos (s)', '20'],
    ['pausaEntreSeries', 'Pausa entre séries (s)', '180'],
  ],
  'Myo-reps': [
    ['repsMini', 'Reps por mini-série', '3'],
    ['maxMiniseries', 'Máximo de mini-séries', '4'],
    ['pausaSeg', 'Pausa entre mini-séries (s)', '15'],
  ],
  'Método 21': [
    ['repsInferior', 'Reps — parcial inferior', '7'],
    ['repsSuperior', 'Reps — parcial superior', '7'],
    ['repsCompletas', 'Reps — completas', '7'],
  ],
  'Ladder': [
    ['degraus', 'Degraus', '5'],
    ['sentido', 'Sentido (crescente, decrescente)', 'crescente'],
    ['incrementoReps', 'Reps por degrau', '1'],
    ['pausaEntreDegraus', 'Pausa entre degraus (s)', '10'],
  ],
  'Paused Reps': [['pausaSeg', 'Pausa na posição (s)', '2']],
  'Repetições forçadas': [['repsAssistidas', 'Reps assistidas', '2']],
  'Repetições parciais': [['amplitude', 'Amplitude', 'Metade inferior']],
};

// Drop-set, rest-pause e cluster não vivem bem como "uma série com um
// parâmetro ao lado" -- cada queda, retomada ou mini-bloco é a sua própria
// linha, com a sua própria carga/repetições, e é isso que o registo do
// realizado depois marca ✓ uma a uma. `gerarSubEtapas` (em painel-pt.tsx,
// que tem o `uid()`) constrói essas linhas; isto só diz quais métodos o
// pedem. Strip Set reaproveita o `papel` do Drop-set (só muda a matemática
// da carga, de percentagem para kg absolutos); por isso não está na lista de
// rótulos abaixo com um nome próprio.
export const METODOS_COM_SUBETAPAS = [
  'Drop-set', 'Strip Set', 'Rest-pause', 'Cluster', 'Pirâmide', 'Myo-reps', 'Método 21', 'Ladder',
];

// Método 21 tem sempre as mesmas três etapas, nunca "Segmento 1/2/3" -- o
// nome diz o que se faz, não o número da vez.
const ROTULOS_21 = { 1: 'Parcial inferior', 2: 'Parcial superior', 3: 'Completo' };

// O nome completo de uma sub-etapa, para o texto da série e o tooltip da
// coluna do número. `rotuloCurtoDePapel` é a mesma informação a caber numa
// coluna de duas ou três letras.
export function rotuloDePapel(linha) {
  if (!linha || !linha.papel) return '';
  if (linha.papel === 'inicial') return 'Inicial';
  if (linha.papel === 'queda') return `Queda ${linha.papelIndice}`;
  if (linha.papel === 'retomada') return `Retomada ${linha.papelIndice}`;
  if (linha.papel === 'miniBloco') return `Série ${linha.papelSerie} · bloco ${linha.papelIndice}`;
  if (linha.papel === 'etapaPiramide') return `Etapa ${linha.papelIndice}`;
  if (linha.papel === 'ativacao') return 'Ativação';
  if (linha.papel === 'miniserie') return `Mini-série ${linha.papelIndice}`;
  if (linha.papel === 'segmento21') return ROTULOS_21[linha.papelIndice] || `Segmento ${linha.papelIndice}`;
  if (linha.papel === 'degrau') return `Degrau ${linha.papelIndice}`;
  return '';
}
export function rotuloCurtoDePapel(linha) {
  if (!linha || !linha.papel) return '';
  if (linha.papel === 'inicial') return 'Ini';
  if (linha.papel === 'queda') return `Q${linha.papelIndice}`;
  if (linha.papel === 'retomada') return `R${linha.papelIndice}`;
  if (linha.papel === 'miniBloco') return `${linha.papelSerie}.${linha.papelIndice}`;
  if (linha.papel === 'etapaPiramide') return `E${linha.papelIndice}`;
  if (linha.papel === 'ativacao') return 'Ativ';
  if (linha.papel === 'miniserie') return `M${linha.papelIndice}`;
  if (linha.papel === 'segmento21') return `21.${linha.papelIndice}`;
  if (linha.papel === 'degrau') return `D${linha.papelIndice}`;
  return '';
}

// O que é do exercício e não de cada série. Carga, repetições, tempo, RPE e
// companhia mudam de série para série e por isso vivem nas linhas — tê-los
// aqui também era pedir o mesmo número em dois sítios.
export const CAMPOS_EXTRA = [
  ['alternativa', 'Alternativa em casa', 'Agachamento livre'],
  ['equipamentoAlt', 'Se não houver equipamento', 'Elástico em vez de polia'],
];

export function tipoDeSerie(id) {
  return TIPOS_SERIE.find((t) => t.id === id) || TIPOS_SERIE[0];
}

export function camposDoMetodo(metodo) {
  return CAMPOS_POR_METODO[metodo] || [];
}

export function extrasPreenchidos(ex) {
  return CAMPOS_EXTRA.filter(([campo]) => ex[campo]);
}

// Uma linha de série numa frase: "10 × 40 kg · RPE 8". É o que o aluno lê no
// PDF, e por isso não leva rótulos que ele não precise de decifrar.
// `semCarga` serve a vista de treino, onde a carga tem coluna própria e
// editável: repeti-la na descrição punha o mesmo número duas vezes na linha.
export function descreverLinha(linha, opcoes) {
  if (!linha) return '';
  const tipo = tipoDeSerie(linha.tipo);
  if (tipo.id === 'observacao') return linha.notas || '';
  const semCarga = Boolean(opcoes && opcoes.semCarga);
  const partes = tipo.campos
    .map((campo) => {
      if (semCarga && campo === 'carga') return null;
      const valor = String(linha[campo] || '').trim();
      if (!valor) return null;
      if (campo === 'reps') return valor;
      if (campo === 'carga') return `× ${valor}`;
      return `${CAMPO_SERIE[campo][0]} ${valor}`;
    })
    .filter(Boolean);
  if (linha.rpe) partes.push(`RPE ${linha.rpe}`);
  if (linha.rir) partes.push(`RIR ${linha.rir}`);
  const descricao = partes.join(' · ');
  const rotulo = rotuloDePapel(linha);
  return rotulo ? `${rotulo}: ${descricao}` : descricao;
}

// Mesma função que em AgendaAtoms.tsx -- duplicada de propósito, para cada
// ficheiro de átomos continuar independente dos outros.
function acentoTexto(hex) {
  return `color-mix(in srgb, ${hex}, var(--acc-mix) var(--acc-amt))`;
}

export function CargaDaSerie({ valor, rotulo, onMudar }) {
  return (
    <input
      value={valor || ''}
      data-carga-vista=""
      onChange={(e) => onMudar(e.target.value)}
      onKeyDown={(e) => {
        if (e.key !== 'Enter') return;
        e.preventDefault();
        const todos = Array.from(document.querySelectorAll('[data-carga-vista]'));
        const proximo = todos[todos.indexOf(e.currentTarget) + 1];
        if (proximo) { proximo.focus(); proximo.select(); } else e.currentTarget.blur();
      }}
      aria-label={rotulo}
      className="input-field font-mono"
      placeholder="—"
      style={{ fontSize: 13, textAlign: 'right', padding: '4px 8px' }}
    />
  );
}

// Os números de um método, na vista. São os mesmos campos do construtor, mas
// só aparecem depois de se tocar na etiqueta: fechados, o treino lê-se.
export function NumerosDoMetodo({ campos, params, prefixo, onMudar }) {
  if (campos.length === 0) return null;
  return (
    <div className="flex gap-2 flex-wrap" style={{ paddingTop: 2 }}>
      {campos.map(([campo, rotulo, exemplo]) => (
        <div key={campo} className="flex flex-col gap-1" style={{ flex: '1 1 118px', minWidth: 104 }}>
          <span className="text-2xs font-body text-faint">{rotulo}</span>
          <input
            value={params[campo] || ''}
            onChange={(e) => onMudar({ ...params, [campo]: e.target.value })}
            aria-label={`${rotulo} ${prefixo}`}
            className="input-field"
            placeholder={exemplo}
            style={{ fontSize: 13 }}
          />
        </div>
      ))}
    </div>
  );
}

export function ExercicioVista({ ex, biblioteca, grupoInfo, onMudar, comCabecalho }) {
  const [numeros, setNumeros] = useState(false);
  const daBiblioteca = biblioteca.find((b) => b.id === ex.exercicioId);
  const linhas = Array.isArray(ex.linhas) && ex.linhas.length ? ex.linhas : [];
  const camposMetodo = camposDoMetodo(ex.metodo);
  const extras = extrasPreenchidos(ex);
  const subtitulo = [daBiblioteca && daBiblioteca.grupo, daBiblioteca && daBiblioteca.equipamento]
    .filter(Boolean).join(' · ');

  function mudarLinha(id, campo, valor) {
    onMudar({ ...ex, linhas: linhas.map((l) => (l.id === id ? { ...l, [campo]: valor } : l)) });
  }

  return (
    <div
      className="rounded-lg px-3 py-2.5 flex flex-col gap-2 min-w-0"
      style={{
        // Sem borda a toda a volta: com uma dúzia de exercícios, doze caixas
        // fechadas viram uma grelha. O que separa é o fundo e a tira da cor.
        backgroundColor: grupoInfo
          ? `color-mix(in srgb, ${grupoInfo.cor} ${grupoInfo.tinta}%, var(--bg-elevated))`
          : 'var(--bg-elevated)',
        borderLeft: grupoInfo ? `3px solid ${grupoInfo.cor}` : '3px solid transparent',
      }}
    >
      <div className="flex items-baseline gap-2 flex-wrap min-w-0">
        {grupoInfo && grupoInfo.etiqueta && (
          <span className="font-mono text-2xs flex-shrink-0" style={{ color: acentoTexto(grupoInfo.cor), fontWeight: 700 }}>
            {grupoInfo.etiqueta}
          </span>
        )}
        <span className="font-body text-sm text-primary min-w-0" style={{ fontWeight: 600 }}>
          {ex.nome || 'Exercício'}
        </span>
        {subtitulo && <span className="text-2xs font-body text-faint truncate">{subtitulo}</span>}
        {ex.metodo && (
          camposMetodo.length > 0 ? (
            <button
              type="button"
              onClick={() => setNumeros((n) => !n)}
              aria-expanded={numeros}
              className="badge flex-shrink-0"
              style={{
                marginLeft: 'auto',
                color: 'var(--brass)',
                backgroundColor: 'var(--brass-soft)',
                cursor: 'pointer',
              }}
              title="Ver e mudar os números deste método"
            >
              {ex.metodo}
            </button>
          ) : (
            <span className="badge flex-shrink-0" style={{ marginLeft: 'auto', color: 'var(--brass)', backgroundColor: 'var(--brass-soft)' }}>
              {ex.metodo}
            </span>
          )
        )}
      </div>

      {daBiblioteca && daBiblioteca.videoUrl && (
        // Em loop e sem som: lê-se como uma demonstração curta, não como um
        // vídeo "a reproduzir" -- e o som ficaria preso num telemóvel na sala
        // de treino. `preload="none"`: um treino com vários exercícios com
        // vídeo não descarrega todos de uma vez, só o que se abre a tocar.
        <video
          src={daBiblioteca.videoUrl}
          controls
          muted
          loop
          playsInline
          preload="none"
          aria-label={`Vídeo de ${ex.nome || 'exercício'}`}
          style={{ width: '100%', maxWidth: 220, aspectRatio: '4 / 5', objectFit: 'cover', borderRadius: 'var(--r-lg)', backgroundColor: '#000' }}
        />
      )}

      {numeros && (
        <NumerosDoMetodo
          campos={camposMetodo}
          params={ex.metodoParams || {}}
          prefixo={`de ${ex.nome || 'exercício'}`}
          onMudar={(novos) => onMudar({ ...ex, metodoParams: novos })}
        />
      )}

      {linhas.length === 0 ? (
        <span className="text-2xs font-body text-faint">Sem séries escritas.</span>
      ) : (
        <div className="flex flex-col gap-1">
          {comCabecalho && (
            <div className="flex items-center gap-2 text-2xs font-body text-faint" style={{ paddingRight: 2 }}>
              <span className="nowrap" style={{ width: 34, flexShrink: 0 }}>Série</span>
              <span className="flex-1 min-w-0">Repetições ou tempo</span>
              <span className="nowrap" style={{ width: 92, textAlign: 'right' }}>Carga</span>
              <span className="nowrap" style={{ width: 56, textAlign: 'right' }}>Descanso</span>
            </div>
          )}
          {linhas.map((linha, i) => {
            const tipo = tipoDeSerie(linha.tipo);
            const temCarga = tipo.campos.includes('carga');
            const texto = descreverLinha(linha, { semCarga: true });
            return (
              <div key={linha.id} className="flex items-center gap-2 min-w-0" style={{ paddingRight: 2 }}>
                <span className="font-mono text-2xs text-faint flex-shrink-0" style={{ width: 34 }}>{i + 1}</span>
                <span className="text-xs font-body text-primary flex-1 min-w-0 truncate" title={texto}>
                  {texto || '—'}
                </span>
                <span style={{ width: 92, flexShrink: 0 }}>
                  {temCarga ? (
                    <CargaDaSerie
                      valor={linha.carga}
                      rotulo={`Carga da série ${i + 1} de ${ex.nome || 'exercício'}`}
                      onMudar={(v) => mudarLinha(linha.id, 'carga', v)}
                    />
                  ) : (
                    <span className="block font-mono text-2xs text-faint" style={{ textAlign: 'right' }}>—</span>
                  )}
                </span>
                <span className="font-mono text-2xs text-muted flex-shrink-0 nowrap" style={{ width: 56, textAlign: 'right' }}>
                  {linha.descanso ? `${linha.descanso}${/^\d+$/.test(String(linha.descanso).trim()) ? ' s' : ''}` : '—'}
                </span>
              </div>
            );
          })}
        </div>
      )}

      {(ex.notas || extras.length > 0) && (
        <div className="text-2xs font-body text-faint min-w-0">
          {[ex.notas, ...extras.map(([campo, rotulo]) => `${rotulo}: ${ex[campo]}`)].filter(Boolean).join(' · ')}
        </div>
      )}
    </div>
  );
}
