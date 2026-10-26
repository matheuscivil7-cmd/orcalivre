-- OrçaLivre: tabela dos orçamentos, composições e insumos próprios de cada usuário.
-- Cada pessoa só enxerga e altera os próprios registros (Row Level Security).
create table if not exists public.orcalivre_docs (
  user_id    uuid        not null default auth.uid() references auth.users(id) on delete cascade,
  id         text        not null,
  kind       text        not null check (kind in ('orc','cpu','ins','lic','opv')),
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

-- ============ Equipes: contatos comerciais compartilhados no radar de obras privadas ============
create table if not exists public.equipes (
  id uuid primary key default gen_random_uuid(),
  nome text not null check (length(nome) between 2 and 80),
  codigo text not null unique,
  criado_por uuid not null default auth.uid() references auth.users(id) on delete cascade,
  criado timestamptz not null default now()
);
create table if not exists public.equipe_membros (
  equipe uuid not null references public.equipes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  email text,
  entrou timestamptz not null default now(),
  primary key (equipe, user_id)
);
create table if not exists public.contatos_equipe (
  id uuid primary key default gen_random_uuid(),
  equipe uuid not null references public.equipes(id) on delete cascade,
  empresa_chave text not null,
  empresa text,
  nome text not null check (length(nome) between 1 and 120),
  cargo text, tel text, email text, obs text,
  criado_por uuid not null default auth.uid() references auth.users(id) on delete cascade,
  criado_email text,
  atualizado timestamptz not null default now()
);
create index if not exists contatos_equipe_chave on public.contatos_equipe (equipe, empresa_chave);

create or replace function public.minhas_equipes() returns setof uuid
language sql stable security definer set search_path = public as
$$ select equipe from public.equipe_membros where user_id = auth.uid() $$;
revoke all on function public.minhas_equipes() from public, anon;
grant execute on function public.minhas_equipes() to authenticated;

alter table public.equipes enable row level security;
alter table public.equipe_membros enable row level security;
alter table public.contatos_equipe enable row level security;

drop policy if exists "equipes: membros leem" on public.equipes;
create policy "equipes: membros leem" on public.equipes for select to authenticated using (id in (select public.minhas_equipes()));
drop policy if exists "equipes: dono altera" on public.equipes;
create policy "equipes: dono altera" on public.equipes for update to authenticated using (criado_por = auth.uid()) with check (criado_por = auth.uid());

drop policy if exists "membros: colegas leem" on public.equipe_membros;
create policy "membros: colegas leem" on public.equipe_membros for select to authenticated using (equipe in (select public.minhas_equipes()));
drop policy if exists "membros: sair" on public.equipe_membros;
create policy "membros: sair" on public.equipe_membros for delete to authenticated using (user_id = auth.uid());

drop policy if exists "contatos: equipe le" on public.contatos_equipe;
create policy "contatos: equipe le" on public.contatos_equipe for select to authenticated using (equipe in (select public.minhas_equipes()));
drop policy if exists "contatos: equipe cria" on public.contatos_equipe;
create policy "contatos: equipe cria" on public.contatos_equipe for insert to authenticated with check (equipe in (select public.minhas_equipes()) and criado_por = auth.uid());
drop policy if exists "contatos: equipe altera" on public.contatos_equipe;
create policy "contatos: equipe altera" on public.contatos_equipe for update to authenticated using (equipe in (select public.minhas_equipes())) with check (equipe in (select public.minhas_equipes()));
drop policy if exists "contatos: autor exclui" on public.contatos_equipe;
create policy "contatos: autor exclui" on public.contatos_equipe for delete to authenticated using (criado_por = auth.uid());

grant select, update on public.equipes to authenticated;
grant select, delete on public.equipe_membros to authenticated;
grant select, insert, update, delete on public.contatos_equipe to authenticated;
revoke all on public.equipes, public.equipe_membros, public.contatos_equipe from anon;

create or replace function public.criar_equipe(p_nome text) returns json
language plpgsql security definer set search_path = public as $$
declare v_id uuid; v_cod text;
begin
  if auth.uid() is null then raise exception 'entre na sua conta'; end if;
  if (select count(*) from public.equipes where criado_por = auth.uid()) >= 5 then raise exception 'limite de 5 equipes'; end if;
  loop
    v_cod := upper(substr(translate(md5(random()::text || clock_timestamp()::text), '01', ''), 1, 8));
    exit when length(v_cod) = 8 and not exists (select 1 from public.equipes where codigo = v_cod);
  end loop;
  insert into public.equipes (nome, codigo, criado_por) values (trim(p_nome), v_cod, auth.uid()) returning id into v_id;
  insert into public.equipe_membros (equipe, user_id, email) values (v_id, auth.uid(), auth.jwt() ->> 'email');
  return json_build_object('id', v_id, 'nome', trim(p_nome), 'codigo', v_cod);
end $$;

create or replace function public.entrar_equipe(p_codigo text) returns json
language plpgsql security definer set search_path = public as $$
declare e public.equipes;
begin
  if auth.uid() is null then raise exception 'entre na sua conta'; end if;
  select * into e from public.equipes where codigo = upper(trim(p_codigo));
  if e.id is null then raise exception 'código não encontrado'; end if;
  insert into public.equipe_membros (equipe, user_id, email) values (e.id, auth.uid(), auth.jwt() ->> 'email') on conflict do nothing;
  return json_build_object('id', e.id, 'nome', e.nome, 'codigo', e.codigo);
end $$;
revoke all on function public.criar_equipe(text), public.entrar_equipe(text) from public, anon;
grant execute on function public.criar_equipe(text), public.entrar_equipe(text) to authenticated;
