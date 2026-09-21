-- Limpeza de dados de teste acumulados durante o desenvolvimento.
-- ORDEM IMPORTA: família primeiro (limpa tudo em cascata: listas, posts,
-- viagens, etc.), depois as contas de usuário.

-- 1) Apaga famílias de teste (e tudo que pertence a elas, em cascata)
delete from public.families
where name ilike 'Familia Teste Admin%'
   or name ilike 'Familia QA%'
   or name ilike 'Familia E2E%'
   or name ilike 'Familia Design%'
   or name ilike 'Familia Feature%'
   or name ilike 'Familia Agenda%'
   or name ilike 'Familia Layout%'
   or name ilike 'Familia Invite%'
   or name ilike 'Invite QA%'
   or name ilike 'Layout QA%';

-- 2) Apaga qualquer família órfã que tenha sobrado (sem nenhum membro)
delete from public.families f
where not exists (select 1 from public.family_members fm where fm.family_id = f.id);

-- 3) Só agora apaga as contas de teste (sem mais nada apontando pra elas)
delete from auth.users where email like '%@example.com';
