-- Apaga contas de teste criadas durante os testes automatizados (e2e.*, teste.mobile*).
-- A exclusão em auth.users propaga por cascade para profiles e family_members
-- (e para as famílias de teste que ficaram órfãs, se só tinham esse membro).

delete from auth.users
where email like 'e2e%@example.com'
   or email like 'teste.mobile%@example.com';

-- Remove famílias de teste que ficaram sem nenhum membro.
delete from public.families f
where not exists (
  select 1 from public.family_members fm where fm.family_id = f.id
);
