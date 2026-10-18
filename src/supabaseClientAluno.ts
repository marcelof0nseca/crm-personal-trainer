// Cliente Supabase próprio da área do aluno -- nunca o mesmo `supabase` do
// treinador (`supabaseClient.ts`). Por omissão, o cliente guarda a sessão
// numa chave fixa do `localStorage`; se o aluno iniciar sessão com o cliente
// do treinador, a sessão de um sobrepõe-se à do outro no mesmo browser
// (o treinador a testar como aluno, ou um computador partilhado) -- a última
// a entrar "ganha", e a outra pessoa é desligada sem aviso nenhum. A
// `storageKey` própria mantém as duas sessões a coexistir sem se tocarem.
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export const supabaseAluno = supabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
    auth: { storageKey: 'ptmanager-aluno-auth' },
  })
  : null;
