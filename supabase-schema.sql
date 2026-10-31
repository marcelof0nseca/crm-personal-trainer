create table if not exists public.app_data (
  user_id uuid not null references auth.users(id) on delete cascade,
  data_key text not null check (data_key in ('alunos', 'agenda', 'financas', 'fotos', 'categorias', 'definicoes', 'treinos', 'formularios') or data_key ~ '^execucoes:[A-Za-z0-9_-]{1,64}$' or data_key ~ '^modulo:[a-z_]{1,32}$'),
  value jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, data_key)
);

-- `execucoes:<idDoAluno>` é o registo dos treinos realizados, uma linha por
-- aluno: cresce sem fim, e uma linha só por aluno limita o que cada gravação
-- reescreve. O padrão aceita o id que a aplicação gera (letras e números) e
-- fica curto de propósito, para não abrir a porta a chaves arbitrárias.
-- Sem correr isto no SQL Editor, ler continua a funcionar (devolve vazio) mas
-- gravar falha com "check constraint" -- a aplicação avisa e o rascunho da
-- sessão fica no aparelho.
alter table public.app_data drop constraint if exists app_data_data_key_check;
alter table public.app_data add constraint app_data_data_key_check check (
  data_key in ('alunos', 'agenda', 'financas', 'fotos', 'categorias', 'definicoes', 'treinos', 'formularios')
  or data_key ~ '^execucoes:[A-Za-z0-9_-]{1,64}$'
  -- `modulo:<nome>`: uma linha por módulo novo (src/features/modulos.ts).
  or data_key ~ '^modulo:[a-z_]{1,32}$'
);

alter table public.app_data enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.app_data to authenticated;

create table if not exists public.personal_subscriptions (
  user_id uuid primary key references auth.users(id) on delete cascade,
  plan_status text not null default 'inactive',
  plan_tier text,
  plan_value numeric(10,2),
  billing_interval text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  payment_method_brand text,
  payment_method_last4 text,
  stripe_customer_id text,
  stripe_subscription_id text,
  last_payment_status text,
  updated_at timestamptz not null default now()
);

-- Contas de criador com acesso sem subscrição. Os e-mails ficam fora deste
-- ficheiro de propósito -- este repositório é público, e um endereço aqui
-- seria visível a qualquer pessoa. Preencher com um INSERT à parte, corrido
-- uma vez à mão no SQL Editor, nunca versionado (ver CLAUDE.md). A tabela
-- não tem nenhum grant para `anon`/`authenticated` -- só a função abaixo,
-- que é `security definer` e por isso lê com os direitos de quem a criou,
-- lá chega. O mesmo padrão já usado em `aal_suficiente()` para `mfa_factors`.
create table if not exists public.app_admins (
  email text primary key
);
alter table public.app_admins enable row level security;
revoke all on public.app_admins from anon, authenticated;
grant select on public.app_admins to service_role;

create or replace function public.has_personal_app_access(target_user uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select
    target_user = auth.uid()
    and (
      exists (
        select 1 from public.app_admins a
        -- Os dois lados normalizados -- sem isto, um e-mail inserido à mão
        -- com uma maiúscula ou um espaço a mais nunca bate, e a conta de
        -- criador deixa de ser reconhecida sem erro nenhum a avisar.
        where trim(lower(a.email)) = trim(lower(coalesce(auth.jwt() ->> 'email', '')))
      )
      or exists (
        select 1
        from public.personal_subscriptions ps
        where ps.user_id = target_user
          -- 'trialing' é o período de 7 dias grátis: a Stripe ainda não
          -- cobrou nada, mas o acesso já é devido. current_period_end, para
          -- uma subscrição em trial, é a própria data em que o trial acaba.
          and ps.plan_status in ('active', 'trialing')
          and (ps.current_period_end is null or ps.current_period_end > now())
      )
    );
$$;

grant execute on function public.has_personal_app_access(uuid) to authenticated;

-- Só sim ou não, para a interface saber se mostra o estado "Vitalício" sem
-- esperar por uma subscrição -- nunca a lista em si. O mesmo padrão de
-- `aal_suficiente()`: a tabela não tem select para `authenticated`, só a
-- função (security definer) lá chega.
create or replace function public.is_creator_account()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.app_admins a
    where trim(lower(a.email)) = trim(lower(coalesce(auth.jwt() ->> 'email', '')))
  );
$$;

grant execute on function public.is_creator_account() to authenticated;

drop policy if exists "Users can read own app data" on public.app_data;
create policy "Users can read own app data"
on public.app_data
for select
to authenticated
using (public.has_personal_app_access(user_id));

drop policy if exists "Users can insert own app data" on public.app_data;
create policy "Users can insert own app data"
on public.app_data
for insert
to authenticated
with check (public.has_personal_app_access(user_id));

drop policy if exists "Users can update own app data" on public.app_data;
create policy "Users can update own app data"
on public.app_data
for update
to authenticated
using (public.has_personal_app_access(user_id))
with check (public.has_personal_app_access(user_id));

drop policy if exists "Users can delete own app data" on public.app_data;
create policy "Users can delete own app data"
on public.app_data
for delete
to authenticated
using (public.has_personal_app_access(user_id));

-- Dois fatores: quem os ativou tem de os passar para chegar aos dados.
--
-- Restritiva de propósito: soma-se às políticas acima em vez de as substituir.
-- E só aperta para quem tem um fator verificado -- para os outros continua a
-- aceitar aal1, senão ninguém entrava. Sem isto, o pedido do código na
-- aplicação é só um ecrã: a sessão em aal1 continuava a ler tudo pela API.
--
-- A pergunta tem de ser feita DENTRO de uma função `security definer`. A
-- política corre com os direitos de quem faz o pedido, e `authenticated` não
-- pode ler `auth.mfa_factors` -- consultá-la diretamente numa política faz
-- toda a consulta a `app_data` rebentar com «permission denied for table
-- mfa_factors», leituras incluídas. Dar `select` nessa tabela a
-- `authenticated` resolveria o erro e abriria um buraco: lá está a coluna
-- `secret` dos códigos TOTP, de toda a gente. A função devolve só sim ou não.
create or replace function public.aal_suficiente()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select case
    when exists (
      select 1 from auth.mfa_factors f
      where f.user_id = (select auth.uid()) and f.status = 'verified'
    )
    then coalesce((select auth.jwt() ->> 'aal'), '') = 'aal2'
    else true
  end;
$$;

grant execute on function public.aal_suficiente() to authenticated;

drop policy if exists "app_data_exige_aal2" on public.app_data;
create policy "app_data_exige_aal2"
on public.app_data
as restrictive
to authenticated
using (public.aal_suficiente())
with check (public.aal_suficiente());

/* ========================= FOTOGRAFIAS NO STORAGE =========================
   As fotografias de progresso viviam dentro do `app_data`, em base64. O bloco
   `fotos` era lido inteiro em cada abertura da aplicação: ~90 kB por
   fotografia, ~1 GB de tráfego por mês e por treinador. Aqui só fica o
   caminho; os ficheiros vivem no balde, carregam a pedido e por URL assinado
   com prazo.

   Balde privado. Sem isto, qualquer pessoa com o endereço via fotografias
   corporais de terceiros -- categoria especial do RGPD.
   ========================================================================== */
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('fotos', 'fotos', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = 5242880,
      allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

-- O primeiro segmento do caminho é o id do dono: `<user_id>/<foto_id>.jpg`.
-- É o que impede um treinador de chegar às fotografias de outro.
drop policy if exists "fotos_ler_proprias" on storage.objects;
create policy "fotos_ler_proprias"
on storage.objects for select to authenticated
using (bucket_id = 'fotos' and (storage.foldername(name))[1] = (select auth.uid()::text));

drop policy if exists "fotos_carregar_proprias" on storage.objects;
create policy "fotos_carregar_proprias"
on storage.objects for insert to authenticated
with check (bucket_id = 'fotos' and (storage.foldername(name))[1] = (select auth.uid()::text));

drop policy if exists "fotos_substituir_proprias" on storage.objects;
create policy "fotos_substituir_proprias"
on storage.objects for update to authenticated
using (bucket_id = 'fotos' and (storage.foldername(name))[1] = (select auth.uid()::text));

drop policy if exists "fotos_apagar_proprias" on storage.objects;
create policy "fotos_apagar_proprias"
on storage.objects for delete to authenticated
using (bucket_id = 'fotos' and (storage.foldername(name))[1] = (select auth.uid()::text));

-- Dois fatores também aqui: não faria sentido trancar as medidas e deixar as
-- fotografias à porta aberta.
drop policy if exists "fotos_exige_aal2" on storage.objects;
create policy "fotos_exige_aal2"
on storage.objects
as restrictive
to authenticated
using (bucket_id <> 'fotos' or public.aal_suficiente())
with check (bucket_id <> 'fotos' or public.aal_suficiente());

/* ===========================================================================
   VÍDEO DOS EXERCÍCIOS

   Um vídeo por exercício (não por aluno nem por avaliação): demonstra a
   execução. Guarda-se o caminho no exercício, em `treinos` (bibliotecaExtra
   ou bibliotecaEdicoes); o ficheiro vive aqui, carregado a pedido e por URL
   assinado com prazo -- mesmo padrão do balde `fotos`.

   Balde privado, mas SEM exigir dois fatores (ao contrário de `fotos`): um
   vídeo de exercício não é dado de saúde de um aluno em particular -- é
   material de referência da técnica, normalmente do próprio treinador. A
   política `fotos_exige_aal2` abaixo só olha para o balde `fotos` de
   propósito, por isso não precisa de se mexer.

   Limite de 25 MB: dá folga a um vídeo de 10 s em boa qualidade (o limite de
   duração em si é imposto pela aplicação, não pelo Storage).
   ========================================================================== */
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('videos', 'videos', false, 26214400, array['video/mp4', 'video/quicktime', 'video/webm'])
on conflict (id) do update
  set public = false,
      file_size_limit = 26214400,
      allowed_mime_types = array['video/mp4', 'video/quicktime', 'video/webm'];

-- O primeiro segmento do caminho é o id do dono: `<user_id>/<video_id>.mp4`.
drop policy if exists "videos_ler_proprios" on storage.objects;
create policy "videos_ler_proprios"
on storage.objects for select to authenticated
using (bucket_id = 'videos' and (storage.foldername(name))[1] = (select auth.uid()::text));

drop policy if exists "videos_carregar_proprios" on storage.objects;
create policy "videos_carregar_proprios"
on storage.objects for insert to authenticated
with check (bucket_id = 'videos' and (storage.foldername(name))[1] = (select auth.uid()::text));

drop policy if exists "videos_substituir_proprios" on storage.objects;
create policy "videos_substituir_proprios"
on storage.objects for update to authenticated
using (bucket_id = 'videos' and (storage.foldername(name))[1] = (select auth.uid()::text));

drop policy if exists "videos_apagar_proprios" on storage.objects;
create policy "videos_apagar_proprios"
on storage.objects for delete to authenticated
using (bucket_id = 'videos' and (storage.foldername(name))[1] = (select auth.uid()::text));

alter table public.personal_subscriptions enable row level security;

grant select on public.personal_subscriptions to authenticated;
grant select, insert, update, delete on public.personal_subscriptions to service_role;

drop policy if exists "Users can read own subscription" on public.personal_subscriptions;
create policy "Users can read own subscription"
on public.personal_subscriptions
for select
to authenticated
using (auth.uid() = user_id);

/* ============================== ADMINISTRAÇÃO ==============================
   Estas duas estruturas servem apenas o painel de administração, acedido
   exclusivamente pela Edge Function `admin-overview` com a service_role key.
   Nenhuma delas dá acesso a `authenticated` — os clientes nunca as veem.
   =========================================================================== */

-- Histórico de subscrições. O `personal_subscriptions` guarda só o estado
-- atual (upsert), pelo que sem esta tabela não existe registo de upgrades,
-- downgrades nem cancelamentos passados.
create table if not exists public.subscription_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  event_type text not null,
  from_tier text,
  to_tier text,
  amount numeric(10,2),
  -- A Stripe reenvia webhooks. Sem esta restrição, cada reenvio duplicaria o
  -- evento e as métricas ficariam erradas.
  stripe_event_id text unique,
  occurred_at timestamptz not null default now(),
  raw jsonb
);

create index if not exists subscription_events_user_idx
  on public.subscription_events (user_id, occurred_at desc);
create index if not exists subscription_events_type_idx
  on public.subscription_events (event_type, occurred_at desc);

alter table public.subscription_events enable row level security;
revoke all on public.subscription_events from anon, authenticated;
grant select, insert on public.subscription_events to service_role;

-- Contagens por conta. A agregação acontece dentro do Postgres, para que o
-- conteúdo dos alunos, avaliações e fotografias nunca saia da base de dados:
-- só o número atravessa a rede.
create or replace view public.admin_account_stats as
select
  user_id,
  max(case when data_key = 'alunos'   then jsonb_array_length(value) end) as alunos,
  max(case when data_key = 'agenda'   then jsonb_array_length(value) end) as aulas,
  max(case when data_key = 'fotos'    then jsonb_array_length(value) end) as fotos,
  max(case when data_key = 'financas' then jsonb_array_length(value) end) as lancamentos,
  max(updated_at) as ultima_atividade
from public.app_data
group by user_id;

revoke all on public.admin_account_stats from anon, authenticated;
grant select on public.admin_account_stats to service_role;

/* ============================ E-MAIL DE BOAS-VINDAS =========================
   Marca quem já recebeu o e-mail de "conta criada, falta escolher plano" --
   disparado uma vez só por um Database Webhook em INSERT sobre auth.users
   (ver supabase/functions/send-welcome-email). Primary key no user_id chega:
   ao contrário de subscription_events, este e-mail não tem variações.
   =========================================================================== */
create table if not exists public.welcome_email_log (
  user_id uuid primary key references auth.users(id) on delete cascade,
  sent_at timestamptz not null default now()
);

alter table public.welcome_email_log enable row level security;
revoke all on public.welcome_email_log from anon, authenticated;
grant select, insert on public.welcome_email_log to service_role;

/* ============================= ÁREA DO ALUNO ===============================
   O aluno entra por um link pessoal com token, nunca por conta Supabase
   própria -- sem fluxo de registo, sem recuperação de password a gerir, sem
   mudar de alojamento por aluno. Esta tabela guarda só o bilhete de acesso,
   não dados de treino: a mesma categoria de `personal_subscriptions`/
   `app_admins` ao lado de `app_data`, não uma tabela relacional nova para
   `treinos`/`execucoes` -- essas continuam exatamente onde estavam.

   Só o hash do token fica gravado, nunca o token em si; o token só existe no
   link que o treinador copia, mostrado uma vez. As duas Edge Functions
   (`aluno-view`, `aluno-registar-sessao`) calculam o mesmo hash do que
   recebem na chamada e comparam -- o mesmo princípio de um link de
   recuperação de password.
   ========================================================================== */
create table if not exists public.aluno_acessos (
  token_hash text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  aluno_id text not null,
  criado_em timestamptz not null default now(),
  revogado_em timestamptz
);

create index if not exists aluno_acessos_aluno_idx
  on public.aluno_acessos (user_id, aluno_id);

alter table public.aluno_acessos enable row level security;

-- O treinador gere os links dos seus próprios alunos a partir da ficha --
-- mesma regra do resto dos dados da conta (`has_personal_app_access`, que já
-- exige subscrição ativa ou conta de criador).
drop policy if exists "Users can read own aluno_acessos" on public.aluno_acessos;
create policy "Users can read own aluno_acessos"
on public.aluno_acessos
for select
to authenticated
using (public.has_personal_app_access(user_id));

drop policy if exists "Users can insert own aluno_acessos" on public.aluno_acessos;
create policy "Users can insert own aluno_acessos"
on public.aluno_acessos
for insert
to authenticated
with check (public.has_personal_app_access(user_id));

drop policy if exists "Users can update own aluno_acessos" on public.aluno_acessos;
create policy "Users can update own aluno_acessos"
on public.aluno_acessos
for update
to authenticated
using (public.has_personal_app_access(user_id))
with check (public.has_personal_app_access(user_id));

drop policy if exists "Users can delete own aluno_acessos" on public.aluno_acessos;
create policy "Users can delete own aluno_acessos"
on public.aluno_acessos
for delete
to authenticated
using (public.has_personal_app_access(user_id));

-- O token dá acesso aos treinos e ao registo de um aluno -- a mesma
-- sensibilidade das fotografias, por isso o mesmo gatilho de dois fatores.
drop policy if exists "aluno_acessos_exige_aal2" on public.aluno_acessos;
create policy "aluno_acessos_exige_aal2"
on public.aluno_acessos
as restrictive
to authenticated
using (public.aal_suficiente())
with check (public.aal_suficiente());

grant select, insert, update, delete on public.aluno_acessos to authenticated;

-- As duas Edge Functions (`aluno-view`, `aluno-registar-sessao`) procuram
-- pelo hash do token com a service_role key, sem sessão de treinador nenhuma
-- -- é assim que um aluno sem conta chega aos dados dele.
grant select on public.aluno_acessos to service_role;

-- A service_role ignora RLS (bypassrls, nível da conta Supabase), mas isso
-- não dispensa a GRANT -- são duas camadas diferentes, e `app_data` nunca
-- tinha dado nenhuma a `service_role` porque nada, até agora, precisava de a
-- ler fora da própria sessão do treinador. Sem isto, as duas Edge Functions
-- acima recebiam "permission denied for table app_data" (42501) ao tentar
-- ler o programa ou gravar a sessão do aluno -- apanhado ao testar esta
-- fatia a sério, não ao planeá-la.
grant select, insert, update on public.app_data to service_role;

/* ============================= CONTA DO ALUNO ==============================
   A par do link com token (acima), o aluno pode agora ter uma conta Supabase
   a sério -- email e password, convidado pelo treinador. Esta tabela só liga
   essa conta ao aluno certo; não é dados de treino, é a mesma categoria de
   `aluno_acessos`/`personal_subscriptions`.

   O aluno nunca lê esta tabela diretamente -- só a Edge Function
   (`aluno-view`/`aluno-registar-sessao`, `service_role`) a consulta, pelo
   mesmo princípio do token: o aluno nunca fala com tabelas de bilhetes,
   só com as Edge Functions.
   ========================================================================== */
create table if not exists public.aluno_contas (
  auth_user_id uuid primary key references auth.users(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  aluno_id text not null,
  criado_em timestamptz not null default now()
);

create index if not exists aluno_contas_aluno_idx
  on public.aluno_contas (user_id, aluno_id);

alter table public.aluno_contas enable row level security;

-- Só o treinador lê as contas dos seus próprios alunos (para a Ficha 360º
-- mostrar "convite pendente" / "conta ativa") -- mesma regra do resto da
-- conta. Nunca insert/update/delete para `authenticated`: só a Edge Function
-- (`service_role`) escreve aqui, no momento do convite.
drop policy if exists "Users can read own aluno_contas" on public.aluno_contas;
create policy "Users can read own aluno_contas"
on public.aluno_contas
for select
to authenticated
using (public.has_personal_app_access(user_id));

drop policy if exists "aluno_contas_exige_aal2" on public.aluno_contas;
create policy "aluno_contas_exige_aal2"
on public.aluno_contas
as restrictive
to authenticated
using (public.aal_suficiente())
with check (public.aal_suficiente());

grant select on public.aluno_contas to authenticated;
grant select, insert on public.aluno_contas to service_role;


/* ======================== ROTEIRO DE PARIDADE: SERVIDOR ======================
   Tudo aditivo e repetível. Nenhuma tabela existente muda de forma. Regra comum:
   só o dono lê as suas linhas, a escrita de fora passa pela service_role nas Edge
   Functions, e estas tabelas seguem o mesmo gatilho de dois fatores de `app_data`.
   ========================================================================== */

-- O que chega do aluno ou do público, à espera de o treinador tratar. Ninguém de
-- fora escreve em `app_data`. `chave` torna um pedido repetido num só.
create table if not exists public.entradas (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  aluno_id text,
  origem text not null check (origem in ('aluno', 'publico')),
  tipo text not null,
  ref text not null default '',
  chave text,
  dados jsonb not null default '{}'::jsonb,
  estado text not null default 'nova' check (estado in ('nova', 'tratada')),
  created_at timestamptz not null default now()
);
create unique index if not exists entradas_chave_idx on public.entradas (user_id, chave);
create index if not exists entradas_dono_idx on public.entradas (user_id, estado, created_at desc);
alter table public.entradas enable row level security;

drop policy if exists "entradas_ler" on public.entradas;
create policy "entradas_ler" on public.entradas for select to authenticated using (public.has_personal_app_access(user_id));
drop policy if exists "entradas_atualizar" on public.entradas;
create policy "entradas_atualizar" on public.entradas for update to authenticated using (public.has_personal_app_access(user_id)) with check (public.has_personal_app_access(user_id));
drop policy if exists "entradas_apagar" on public.entradas;
create policy "entradas_apagar" on public.entradas for delete to authenticated using (public.has_personal_app_access(user_id));
drop policy if exists "entradas_exige_aal2" on public.entradas;
create policy "entradas_exige_aal2" on public.entradas as restrictive to authenticated using (public.aal_suficiente()) with check (public.aal_suficiente());
grant select, delete on public.entradas to authenticated;
grant update (estado) on public.entradas to authenticated;
grant select, insert on public.entradas to service_role;

-- Retratos publicados: só o que é público, nunca os blocos. O público lê por função.
create table if not exists public.publico_enderecos (
  slug text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  tipo text not null check (tipo in ('vendas', 'inscricao', 'indicacao', 'desafio', 'calendario', 'programa')),
  ref text not null default '',
  dados jsonb not null default '{}'::jsonb,
  ativo boolean not null default true,
  expira_em timestamptz,
  created_at timestamptz not null default now()
);
create index if not exists publico_enderecos_dono_idx on public.publico_enderecos (user_id);
alter table public.publico_enderecos enable row level security;
drop policy if exists "publico_enderecos_dono" on public.publico_enderecos;
create policy "publico_enderecos_dono" on public.publico_enderecos for all to authenticated using (public.has_personal_app_access(user_id)) with check (public.has_personal_app_access(user_id));
drop policy if exists "publico_enderecos_exige_aal2" on public.publico_enderecos;
create policy "publico_enderecos_exige_aal2" on public.publico_enderecos as restrictive to authenticated using (public.aal_suficiente()) with check (public.aal_suficiente());
grant select, insert, update, delete on public.publico_enderecos to authenticated;
grant select, insert on public.publico_enderecos to service_role;

-- Limite de pedidos das páginas públicas. Guarda um hash, nunca o endereço IP.
create table if not exists public.publico_limites (
  chave text not null,
  janela timestamptz not null,
  n integer not null default 0,
  primary key (chave, janela)
);
alter table public.publico_limites enable row level security;
grant select, insert, update, delete on public.publico_limites to service_role;

create or replace function public.publico_contar_pedido(p_chave text, p_janela timestamptz)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare total integer;
begin
  insert into public.publico_limites (chave, janela, n) values (p_chave, p_janela, 1)
  on conflict (chave, janela) do update set n = public.publico_limites.n + 1
  returning n into total;
  delete from public.publico_limites where janela < now() - interval '2 days';
  return total;
end;
$$;
revoke all on function public.publico_contar_pedido(text, timestamptz) from public, anon, authenticated;
grant execute on function public.publico_contar_pedido(text, timestamptz) to service_role;

-- Carteira do treinador. Identidade e IBAN ficam no fornecedor; aqui só o estado.
create table if not exists public.cobranca_contas (
  user_id uuid primary key references auth.users(id) on delete cascade,
  stripe_account_id text not null unique,
  pagamentos_ativos boolean not null default false,
  transferencias_ativas boolean not null default false,
  requisitos jsonb not null default '[]'::jsonb,
  atualizado_em timestamptz not null default now()
);
alter table public.cobranca_contas enable row level security;
drop policy if exists "cobranca_contas_ler" on public.cobranca_contas;
create policy "cobranca_contas_ler" on public.cobranca_contas for select to authenticated using (public.has_personal_app_access(user_id));
grant select on public.cobranca_contas to authenticated;
grant select, insert, update on public.cobranca_contas to service_role;

-- Pagamentos confirmados pelo fornecedor. A referência não repete: um webhook
-- reenviado não conta duas vezes. Valores em cêntimos inteiros.
create table if not exists public.cobranca_pagamentos (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  aluno_id text not null,
  fatura_id text not null,
  centimos integer not null check (centimos >= 0),
  moeda text not null default 'EUR',
  metodo text not null default 'stripe',
  referencia text not null unique,
  estado text not null check (estado in ('pago', 'reembolsado')),
  reembolsado_centimos integer not null default 0,
  created_at timestamptz not null default now()
);
create index if not exists cobranca_pagamentos_dono_idx on public.cobranca_pagamentos (user_id, created_at desc);
alter table public.cobranca_pagamentos enable row level security;
drop policy if exists "cobranca_pagamentos_ler" on public.cobranca_pagamentos;
create policy "cobranca_pagamentos_ler" on public.cobranca_pagamentos for select to authenticated using (public.has_personal_app_access(user_id));
drop policy if exists "cobranca_pagamentos_exige_aal2" on public.cobranca_pagamentos;
create policy "cobranca_pagamentos_exige_aal2" on public.cobranca_pagamentos as restrictive to authenticated using (public.aal_suficiente()) with check (public.aal_suficiente());
grant select on public.cobranca_pagamentos to authenticated;
grant select, insert, update on public.cobranca_pagamentos to service_role;

create table if not exists public.cobranca_eventos (
  stripe_event_id text primary key,
  tipo text not null,
  recebido_em timestamptz not null default now()
);
alter table public.cobranca_eventos enable row level security;
grant select, insert on public.cobranca_eventos to service_role;

-- Avisos lidos e notificações no telemóvel: crescem sem fim, por isso são tabelas.
create table if not exists public.notificacao_leituras (
  user_id uuid not null references auth.users(id) on delete cascade,
  aluno_id text not null,
  ocorrencia_id text not null,
  lida_em timestamptz not null default now(),
  primary key (user_id, aluno_id, ocorrencia_id)
);
alter table public.notificacao_leituras enable row level security;
drop policy if exists "notificacao_leituras_dono" on public.notificacao_leituras;
create policy "notificacao_leituras_dono" on public.notificacao_leituras for all to authenticated using (public.has_personal_app_access(user_id)) with check (public.has_personal_app_access(user_id));
grant select, delete on public.notificacao_leituras to authenticated;
grant select, insert on public.notificacao_leituras to service_role;

create table if not exists public.push_subscricoes (
  endpoint text primary key,
  user_id uuid not null references auth.users(id) on delete cascade,
  aluno_id text not null,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);
create index if not exists push_subscricoes_aluno_idx on public.push_subscricoes (user_id, aluno_id);
alter table public.push_subscricoes enable row level security;
drop policy if exists "push_subscricoes_dono" on public.push_subscricoes;
create policy "push_subscricoes_dono" on public.push_subscricoes for all to authenticated using (public.has_personal_app_access(user_id)) with check (public.has_personal_app_access(user_id));
grant select, delete on public.push_subscricoes to authenticated;
grant select, insert, delete on public.push_subscricoes to service_role;

-- Biblioteca editorial comum. Lê-se com sessão; escreve-se só no painel do Supabase,
-- depois de revisto. Começa vazia de propósito.
create table if not exists public.conteudos (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,
  categoria text not null default '',
  corpo text not null default '',
  autor text not null default '',
  fontes text not null default '',
  revisto_em date,
  publicado boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.conteudos enable row level security;
drop policy if exists "conteudos_ler" on public.conteudos;
create policy "conteudos_ler" on public.conteudos for select to authenticated using (publicado);
grant select on public.conteudos to authenticated;

-- Documentos dos alunos: privados, e com dois fatores como as fotografias.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('documentos', 'documentos', false, 10485760, array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = 10485760,
      allowed_mime_types = array['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];

drop policy if exists "documentos_ler_proprios" on storage.objects;
create policy "documentos_ler_proprios" on storage.objects for select to authenticated
using (bucket_id = 'documentos' and (storage.foldername(name))[1] = (select auth.uid()::text));
drop policy if exists "documentos_carregar_proprios" on storage.objects;
create policy "documentos_carregar_proprios" on storage.objects for insert to authenticated
with check (bucket_id = 'documentos' and (storage.foldername(name))[1] = (select auth.uid()::text));
drop policy if exists "documentos_apagar_proprios" on storage.objects;
create policy "documentos_apagar_proprios" on storage.objects for delete to authenticated
using (bucket_id = 'documentos' and (storage.foldername(name))[1] = (select auth.uid()::text));
drop policy if exists "documentos_exige_aal2" on storage.objects;
create policy "documentos_exige_aal2" on storage.objects as restrictive to authenticated
using (bucket_id <> 'documentos' or public.aal_suficiente())
with check (bucket_id <> 'documentos' or public.aal_suficiente());
