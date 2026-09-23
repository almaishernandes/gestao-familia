-- Migração aditiva: grau de parentesco por membro (Pai, Mãe, Filho, Filha...),
-- exibido no lugar de "Responsável/Adulto/Dependente" na tela Início.
-- O campo "role" continua existindo só para permissões internas.
-- Segura para produção — não apaga dados.

alter table public.family_members
  add column if not exists relationship text;
