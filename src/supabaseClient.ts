import { createClient } from '@supabase/supabase-js';
import { eRegressoDoAluno } from './data/acessoAluno';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabasePublishableKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

export const supabaseConfigured = Boolean(supabaseUrl && supabasePublishableKey);

export const supabase = supabaseConfigured
  ? createClient(supabaseUrl, supabasePublishableKey, {
    auth: { detectSessionInUrl: !eRegressoDoAluno(window.location.href) },
  })
  : null;
