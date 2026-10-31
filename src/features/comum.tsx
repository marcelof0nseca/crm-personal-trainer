// Pequenas peças repetidas pelos módulos do separador «Mais».
export const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36);
export const hojeISO = () => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; };
export const dm = (iso) => (iso ? `${String(iso).slice(8, 10)}/${String(iso).slice(5, 7)}/${String(iso).slice(0, 4)}` : '');
export const semAcento = (t) => String(t || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

export function Titulo({ children }) {
  return <h2 className="text-2xs uppercase tracking-wide text-faint font-mono" style={{ margin: 0 }}>{children}</h2>;
}

export function Vazio({ children }) {
  return <p className="text-sm font-body text-faint" style={{ margin: 0 }}>{children}</p>;
}

export function Aviso({ children }) {
  return <p className="text-xs font-body rounded-lg px-3 py-2" style={{ margin: 0, color: 'var(--gold)', backgroundColor: 'var(--gold-soft)' }}>{children}</p>;
}

// Os três estados de um módulo que ainda não se pode mostrar.
export function ProntoOu({ modulos, children }) {
  const lista = Array.isArray(modulos) ? modulos : [modulos];
  if (lista.some((m) => m.estado === 'erro')) {
    return (
      <div className="flex items-center gap-2 flex-wrap">
        <p className="text-sm font-body" style={{ margin: 0, color: 'var(--rust)' }}>Não foi possível ler estes dados.</p>
        <button type="button" onClick={() => lista.forEach((m) => m.recarregar())} className="btn btn-ghost" style={{ fontSize: 12 }}>Tentar de novo</button>
      </div>
    );
  }
  if (lista.some((m) => m.estado !== 'ok')) return <p className="text-sm font-body text-faint" role="status">A carregar...</p>;
  return children();
}

// WhatsApp por ligação: abre a conversa com o texto escrito, e quem envia é a pessoa.
export function ligacaoWhatsApp(telefone, texto) {
  const numero = String(telefone || '').replace(/\D/g, '');
  const destino = numero.length === 9 ? `351${numero}` : numero;
  return `https://wa.me/${destino}?text=${encodeURIComponent(texto || '')}`;
}

export function descarregar(nome, texto, tipo = 'text/csv;charset=utf-8') {
  const url = URL.createObjectURL(new Blob([tipo.startsWith('text/csv') ? `﻿${texto}` : texto], { type: tipo }));
  const a = document.createElement('a');
  a.href = url; a.download = nome; a.click();
  URL.revokeObjectURL(url);
}

export const csvDe = (linhas) => linhas.map((l) => l.map((c) => `"${String(c ?? '').replace(/"/g, '""')}"`).join(';')).join('\n');

export function Abas({ abas, valor, onMudar }) {
  return (
    <div className="flex items-center gap-1 flex-wrap" role="tablist">
      {abas.map((a) => (
        <button key={a.id} type="button" role="tab" aria-selected={valor === a.id} onClick={() => onMudar(a.id)} className="btn btn-ghost" style={{ fontSize: 12, ...(valor === a.id ? { color: 'var(--brass)', borderColor: 'var(--brass)' } : {}) }}>
          {a.rotulo}
        </button>
      ))}
    </div>
  );
}

export const nomeDoAluno = (students, id) => (students || []).find((s) => s.id === id)?.name || 'Aluno removido';
export const primeiroNome = (nome) => String(nome || '').trim().split(/\s+/)[0] || '';
export const alunosAtuais = (students) => (students || []).filter((s) => !s.naLixeira);

// Para um conjunto de botões: dentro de um <label> (FormField) o primeiro botão
// ficava com o nome do rótulo, e tocar no rótulo acionava-o.
export function Grupo({ rotulo, children }) {
  return (
    <div role="group" aria-label={rotulo} className="min-w-0">
      <span className="block text-xs font-body text-muted mb-1.5">{rotulo}</span>
      {children}
    </div>
  );
}
