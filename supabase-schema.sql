create table if not exists public.app_data (
  user_id uuid not null references auth.users(id) on delete cascade,
  data_key text not null check (data_key in ('alunos', 'agenda', 'financas')),
  value jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, data_key)
);

alter table public.app_data enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.app_data to authenticated;

drop policy if exists "Users can read own app data" on public.app_data;
create policy "Users can read own app data"
on public.app_data
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "Users can insert own app data" on public.app_data;
create policy "Users can insert own app data"
on public.app_data
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "Users can update own app data" on public.app_data;
create policy "Users can update own app data"
on public.app_data
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "Users can delete own app data" on public.app_data;
create policy "Users can delete own app data"
on public.app_data
for delete
to authenticated
using (auth.uid() = user_id);
