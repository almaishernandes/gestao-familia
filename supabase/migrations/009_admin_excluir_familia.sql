-- Migração aditiva: permite ao admin da plataforma excluir uma família
-- direto pelo painel (apaga tudo que pertence a ela em cascata).
-- Segura para produção.

create or replace function public.admin_delete_family(p_family_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Apenas administradores da plataforma podem excluir famílias.';
  end if;

  delete from public.families where id = p_family_id;
end;
$$;

grant execute on function public.admin_delete_family(uuid) to authenticated;
