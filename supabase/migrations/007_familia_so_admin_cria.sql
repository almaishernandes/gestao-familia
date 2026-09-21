-- Migração aditiva: só o admin da plataforma cria famílias novas.
-- Famílias já existentes continuam cadastrando membros livremente via
-- código de convite (join_family_by_code). Segura para produção.

-- 1) Bloqueia o auto-cadastro de família por qualquer usuário comum.
revoke execute on function public.create_family(text, text) from public;
revoke execute on function public.create_family(text, text) from authenticated;

-- 2) O primeiro membro a entrar numa família (criada pelo admin, ainda sem
--    ninguém dentro) vira o responsável (owner) em vez de "adult".
create or replace function public.join_family_by_code(p_invite_code text, p_full_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_family_id uuid;
  v_role public.family_role;
begin
  select id into v_family_id from public.families where invite_code = p_invite_code;

  if v_family_id is null then
    raise exception 'Código de convite inválido';
  end if;

  insert into public.profiles (id, full_name)
  values (auth.uid(), p_full_name)
  on conflict (id) do update set full_name = excluded.full_name;

  if exists (select 1 from public.family_members where family_id = v_family_id) then
    v_role := 'adult';
  else
    v_role := 'owner';
  end if;

  insert into public.family_members (family_id, profile_id, role)
  values (v_family_id, auth.uid(), v_role)
  on conflict (family_id, profile_id) do nothing;

  return v_family_id;
end;
$$;
