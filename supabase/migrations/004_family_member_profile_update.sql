-- Migração aditiva: permite que qualquer membro da família edite o perfil
-- de outro membro da mesma família (usado na tela Início, para manutenção
-- dos dados de cada membro — nome, data de nascimento, telefone, etc.).
-- Não afeta dados existentes.

do $$ begin
  create policy "profiles: family members can update each other" on public.profiles
    for update using (
      id in (
        select fm2.profile_id from public.family_members fm2
        where fm2.family_id in (select public.my_family_ids())
      )
    );
exception
  when duplicate_object then null;
end $$;
