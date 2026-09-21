-- Migração aditiva: painel de administração da plataforma (multi-família).
-- Permite que administradores da plataforma (você, dono do Instituto
-- Hernandes) vejam e criem famílias sem precisar ser membro de cada uma.
-- Segura para produção — não apaga dados existentes.

create table if not exists public.platform_admins (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.platform_admins enable row level security;

-- Só um admin já existente pode ler/gerenciar essa lista (bootstrap é feito
-- manualmente por você no SQL Editor — ver instruções no final do arquivo).
create or replace function public.is_platform_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (select 1 from public.platform_admins where profile_id = auth.uid());
$$;

do $$ begin
  create policy "platform_admins: admins can read" on public.platform_admins
    for select using (public.is_platform_admin());
exception
  when duplicate_object then null;
end $$;

-- Admins enxergam TODAS as famílias e membros (além do que a policy normal
-- de "família do usuário" já permite).
do $$ begin
  create policy "families: platform admins can read all" on public.families
    for select using (public.is_platform_admin());
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "family_members: platform admins can read all" on public.family_members
    for select using (public.is_platform_admin());
exception
  when duplicate_object then null;
end $$;

-- RPC para o admin criar uma família nova SEM virar membro dela — só gera o
-- registro e o código de convite, que você entrega pro cliente (a família).
create or replace function public.admin_create_family(p_name text)
returns table (family_id uuid, invite_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_family_id uuid;
  v_invite_code text;
begin
  if not public.is_platform_admin() then
    raise exception 'Apenas administradores da plataforma podem criar famílias por aqui.';
  end if;

  insert into public.families (name) values (p_name)
  returning id, families.invite_code into v_family_id, v_invite_code;

  return query select v_family_id, v_invite_code;
end;
$$;

grant execute on function public.admin_create_family(text) to authenticated;

-- ============================================================================
-- BOOTSTRAP: depois de rodar esta migração, torne SEU usuário um admin
-- (troque o e-mail abaixo pelo seu) rodando isto UMA VEZ no SQL Editor:
--
-- insert into public.platform_admins (profile_id)
-- select id from auth.users where email = 'almaishernandes@gmail.com';
-- ============================================================================
