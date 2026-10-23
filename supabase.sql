-- OrçaLivre: tabela dos orçamentos, composições e insumos próprios de cada usuário.
-- Cada pessoa só enxerga e altera os próprios registros (Row Level Security).
create table if not exists public.orcalivre_docs (
  user_id    uuid        not null default auth.uid() references auth.users(id) on delete cascade,
  id         text        not null,
  kind       text        not null check (kind in ('orc','cpu','ins')),
  data       jsonb       not null,
  updated_at timestamptz not null default now(),
  primary key (user_id, id)
);

alter table public.orcalivre_docs enable row level security;

drop policy if exists "orcalivre: ler os próprios"      on public.orcalivre_docs;
drop policy if exists "orcalivre: criar os próprios"    on public.orcalivre_docs;
drop policy if exists "orcalivre: alterar os próprios"  on public.orcalivre_docs;
drop policy if exists "orcalivre: excluir os próprios"  on public.orcalivre_docs;

create policy "orcalivre: ler os próprios"     on public.orcalivre_docs for select to authenticated using ((select auth.uid()) = user_id);
create policy "orcalivre: criar os próprios"   on public.orcalivre_docs for insert to authenticated with check ((select auth.uid()) = user_id);
create policy "orcalivre: alterar os próprios" on public.orcalivre_docs for update to authenticated using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
create policy "orcalivre: excluir os próprios" on public.orcalivre_docs for delete to authenticated using ((select auth.uid()) = user_id);

revoke all on public.orcalivre_docs from anon;
grant select, insert, update, delete on public.orcalivre_docs to authenticated;
