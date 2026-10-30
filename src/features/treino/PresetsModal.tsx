// Escolher um preset para acrescentar a um treino, e gerir os do treinador.
import { useMemo, useState } from 'react';
import { Archive, Copy, Star, Trash2 } from 'lucide-react';
import { ConfirmDialog, FormField, Modal } from '../../components/UiAtoms';
import { useModulo } from '../useModulo';
import { PRESETS_SISTEMA, ROTULO_TIPO_PRESET } from './presets';

const semAcento = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export default function PresetsModal({ onAplicar, onClose, gerarId }) {
  const { estado, valor, gravar, recarregar } = useModulo('presets');
  const [busca, setBusca] = useState('');
  const [verArquivados, setVerArquivados] = useState(false);
  const [aApagar, setAApagar] = useState(null);
  const proprios = valor.itens;
  const lista = useMemo(() => {
    const termo = semAcento(busca);
    const todos = verArquivados
      ? proprios.filter((p) => p.arquivado)
      : [...proprios.filter((p) => !p.arquivado).sort((a, b) => Number(Boolean(b.favorito)) - Number(Boolean(a.favorito))), ...PRESETS_SISTEMA];
    return todos.filter((p) => semAcento(p.nome).includes(termo));
  }, [proprios, busca, verArquivados]);
  const mudar = (id, campos) => gravar((v) => ({ ...v, itens: v.itens.map((p) => (p.id === id ? { ...p, ...campos } : p)) }));

  return (
    <Modal title="Presets de treino" onClose={onClose}>
      <div className="flex flex-col gap-3">
        <FormField label="Procurar">
          <input value={busca} onChange={(e) => setBusca(e.target.value)} className="input-field" placeholder="Ex.: EMOM" />
        </FormField>
        {estado === 'erro' && (
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-xs font-body" style={{ margin: 0, color: 'var(--rust)' }}>Não foi possível ler os seus presets. Os do sistema continuam disponíveis.</p>
            <button type="button" onClick={recarregar} className="btn btn-ghost" style={{ fontSize: 12 }}>Tentar de novo</button>
          </div>
        )}
        {lista.length === 0 && <p className="text-sm font-body text-faint" style={{ margin: 0 }}>Nenhum preset encontrado.</p>}
        <ul className="flex flex-col gap-2" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
          {lista.map((p) => (
            <li key={p.id} className="rounded-lg border border-hair flex items-center gap-1 min-w-0">
              <button type="button" onClick={() => onAplicar(p)} className="flex-1 text-left px-3 py-2.5 btn-surface min-w-0">
                <span className="block text-sm font-body text-primary truncate" style={{ fontWeight: 600 }}>{p.nome}</span>
                <span className="block text-2xs font-body text-faint">
                  {ROTULO_TIPO_PRESET[p.tipo] || 'Preset'} · {p.exercicios.length} {p.exercicios.length === 1 ? 'exercício' : 'exercícios'}{p.sistema ? ' · do sistema' : ''}
                </span>
              </button>
              {!p.sistema && (
                <span className="flex items-center flex-shrink-0 pr-1">
                  <button type="button" onClick={() => mudar(p.id, { favorito: !p.favorito })} className="p-2 btn-surface rounded tap" aria-pressed={Boolean(p.favorito)} aria-label={`Favorito: ${p.nome}`}>
                    <Star size={14} style={{ display: 'block', color: p.favorito ? 'var(--gold)' : 'var(--text-faint)' }} />
                  </button>
                  <button type="button" onClick={() => gravar((v) => ({ ...v, itens: [...v.itens, { ...JSON.parse(JSON.stringify(p)), id: gerarId(), nome: `${p.nome} (cópia)`, favorito: false }] }))} className="p-2 btn-surface rounded tap" aria-label={`Duplicar ${p.nome}`}>
                    <Copy size={14} className="text-muted" style={{ display: 'block' }} />
                  </button>
                  <button type="button" onClick={() => mudar(p.id, { arquivado: !p.arquivado })} className="p-2 btn-surface rounded tap" aria-label={`${p.arquivado ? 'Reativar' : 'Arquivar'} ${p.nome}`}>
                    <Archive size={14} className="text-muted" style={{ display: 'block' }} />
                  </button>
                  <button type="button" onClick={() => setAApagar(p)} className="p-2 btn-surface rounded tap" aria-label={`Apagar ${p.nome}`}>
                    <Trash2 size={14} className="text-rust" style={{ display: 'block' }} />
                  </button>
                </span>
              )}
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => setVerArquivados((x) => !x)} className="text-2xs font-body link-sky self-start">
          {verArquivados ? 'Ver os ativos' : 'Ver os arquivados'}
        </button>
        <p className="text-2xs font-body text-faint" style={{ margin: 0 }}>Aplicar copia a estrutura para o treino: editá-la depois não altera o preset.</p>
      </div>
      {aApagar && (
        <ConfirmDialog
          title="Apagar este preset?"
          message={`«${aApagar.nome}» deixa de estar disponível. Os treinos onde já foi aplicado não mudam.`}
          onCancel={() => setAApagar(null)}
          onConfirm={() => { const id = aApagar.id; setAApagar(null); gravar((v) => ({ ...v, itens: v.itens.filter((p) => p.id !== id) })); }}
        />
      )}
    </Modal>
  );
}
