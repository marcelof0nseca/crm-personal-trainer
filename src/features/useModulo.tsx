// Leitura e gravação de um módulo de `app_data`. O acesso à base de dados vem do
// AppInner por contexto, para os módulos não importarem o monólito.
import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { chaveModulo, normalizarModulo } from './modulos';

const Ctx = createContext(null);
export const ModulosProvider = Ctx.Provider;
export const useApp = () => useContext(Ctx);

// { estado: 'a-carregar'|'ok'|'erro', valor, gravar(fn), recarregar() }.
// `gravar` volta ao que estava se falhar, e devolve se ficou gravado.
export function useModulo(nome) {
  const app = useContext(Ctx);
  const [estado, setEstado] = useState('a-carregar');
  const [valor, setValor] = useState(() => normalizarModulo(nome, null));
  const atual = useRef(valor);

  const recarregar = useCallback(async () => {
    setEstado('a-carregar');
    try {
      const v = normalizarModulo(nome, await app.lerChave(chaveModulo(nome)));
      atual.current = v;
      setValor(v);
      setEstado('ok');
    } catch (e) {
      console.error(`[PTMANAGER] falhou a ler o módulo ${nome}`, e);
      setEstado('erro');
    }
  }, [app, nome]);

  useEffect(() => { recarregar(); }, [recarregar]);

  const gravar = useCallback(async (fn) => {
    const anterior = atual.current;
    const seguinte = fn(anterior);
    atual.current = seguinte;
    setValor(seguinte);
    const ok = await app.gravarChave(chaveModulo(nome), seguinte, nome);
    if (!ok) {
      atual.current = anterior;
      setValor(anterior);
    }
    return ok;
  }, [app, nome]);

  return { estado, valor, gravar, recarregar };
}
