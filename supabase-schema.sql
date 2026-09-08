create table if not exists public.app_data (
  user_id uuid not null references auth.users(id) on delete cascade,
  data_key text not null check (data_key in ('alunos', 'agenda', 'financas', 'fotos', 'categorias', 'definicoes', 'treinos', 'formularios')),
  value jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, data_key)
);

alter table public.app_data drop constraint if exists app_data_data_key_check;
alter table public.app_data add constraint app_data_data_key_check check (data_key in ('alunos', 'agenda', 'financas', 'fotos', 'categorias', 'definicoes', 'treinos', 'formularios'));

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
      lower(coalesce(auth.jwt() ->> 'email', '')) in ('maf@cesar.school', 'bfpersonal@live.com')
      or exists (
        select 1
        from public.personal_subscriptions ps
        where ps.user_id = target_user
          and ps.plan_status = 'active'
          and (ps.current_period_end is null or ps.current_period_end > now())
      )
    );
$$;

grant execute on function public.has_personal_app_access(uuid) to authenticated;

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
drop policy if exists "app_data_exige_aal2" on public.app_data;
create policy "app_data_exige_aal2"
on public.app_data
as restrictive
to authenticated
using (
  array[(select auth.jwt() ->> 'aal')] <@ (
    select case
      when count(id) > 0 then array['aal2']
      else array['aal1', 'aal2']
    end
    from auth.mfa_factors
    where auth.mfa_factors.user_id = (select auth.uid())
      and auth.mfa_factors.status = 'verified'
  )
);

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
using (
  bucket_id <> 'fotos'
  or array[(select auth.jwt() ->> 'aal')] <@ (
    select case
      when count(id) > 0 then array['aal2']
      else array['aal1', 'aal2']
    end
    from auth.mfa_factors
    where auth.mfa_factors.user_id = (select auth.uid())
      and auth.mfa_factors.status = 'verified'
  )
);

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
