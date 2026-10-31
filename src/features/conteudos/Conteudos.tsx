// Biblioteca editorial, comum a todas as contas e só de leitura. Vazia, diz que está
// vazia: conteúdo de saúde sem fonte nem revisão não entra.
import { useEffect, useState } from 'react';
import { FormField } from '../../components/UiAtoms';
import { useModulo } from '../useModulo';
import { ProntoOu, Vazio, semAcento } from '../comum';
import { supabase } from '../../supabaseClient';
import { temServidor } from '../servidor';

export default function Conteudos() {
  const modulo = useModulo('conteudos');
  const [itens, setItens] = useState(null);
  const [erro, setErro] = useState('');
  const [procura, setProcura] = useState('');
  async function ler() {
    setItens(null); setErro('');
    if (!temServidor()) { setItens([]); return; }
    const { data, error } = await supabase.from('conteudos').select('*').eq('publicado', true).order('titulo');
    if (error) setErro('Não foi possível ler a biblioteca.');
    setItens(data || []);
  }
  useEffect(() => { ler(); }, []);
  const favoritos = modulo.valor.favoritos || [];
  const lista = (itens || []).filter((c) => semAcento(`${c.titulo} ${c.categoria}`).includes(semAcento(procura)));
  return (
    <ProntoOu modulos={modulo}>{() => (
      <div className="flex flex-col gap-3">
        {erro && <div className="flex items-center gap-2 flex-wrap"><p className="text-sm font-body" style={{ margin: 0, color: 'var(--rust)' }}>{erro}</p><button type="button" className="btn btn-ghost" style={{ fontSize: 12 }} onClick={ler}>Tentar de novo</button></div>}
        {itens === null && <p className="text-sm font-body text-faint" role="status">A carregar...</p>}
        {itens && itens.length === 0 && !erro && <Vazio>A biblioteca ainda não tem conteúdos. Cada texto entra só depois de revisto, com autor e fontes.</Vazio>}
        {itens && itens.length > 0 && <FormField label="Procurar"><input value={procura} onChange={(e) => setProcura(e.target.value)} className="input-field" /></FormField>}
        {lista.map((c) => {
          const fav = favoritos.includes(c.id);
          return (
            <div key={c.id} className="card p-3 flex flex-col gap-1">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <span className="text-sm font-body text-primary" style={{ fontWeight: 600 }}>{c.titulo}</span>
                <button type="button" aria-pressed={fav} onClick={() => modulo.gravar((m) => ({ ...m, favoritos: fav ? m.favoritos.filter((x) => x !== c.id) : [...m.favoritos, c.id] }))} className="btn btn-ghost" style={{ fontSize: 12 }}>{fav ? 'Tirar dos favoritos' : 'Guardar'}</button>
              </div>
              <p className="text-2xs font-body text-faint" style={{ margin: 0 }}>{c.categoria}{c.autor ? ` · ${c.autor}` : ''}{c.revisto_em ? ` · revisto em ${c.revisto_em}` : ''}</p>
              <p className="text-sm font-body text-muted" style={{ margin: 0, whiteSpace: 'pre-wrap' }}>{c.corpo}</p>
              {c.fontes && <p className="text-2xs font-body text-faint" style={{ margin: 0 }}>Fontes: {c.fontes}</p>}
            </div>
          );
        })}
      </div>
    )}</ProntoOu>
  );
}
