-- Migração aditiva: o formulário de Nova Receita agora foca em medicamento + posologia,
-- deixando os dados do médico como detalhe opcional. Torna doctor_name opcional no banco
-- para não travar o insert quando o campo vier vazio. Segura para rodar em produção.

alter table public.prescriptions alter column doctor_name drop not null;
