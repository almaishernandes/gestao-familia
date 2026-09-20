-- Migração aditiva: categorias de evento (Viagens/Lazer/Excursões),
-- categorias de despesa e fontes de recursos. Segura para rodar em produção —
-- não apaga nem altera dados existentes.

-- 1) Categoria do evento (viagem / lazer / excursão)
do $$ begin
  create type public.trip_category as enum ('viagem','lazer','excursao');
exception
  when duplicate_object then null;
end $$;

alter table public.trips
  add column if not exists category public.trip_category not null default 'viagem';

-- 2) Categoria da despesa
do $$ begin
  create type public.trip_expense_category as enum
    ('transporte','hospedagem','alimentacao','ingressos','saude','compras','outros');
exception
  when duplicate_object then null;
end $$;

alter table public.trip_expenses
  add column if not exists category public.trip_expense_category not null default 'outros';

-- 3) Fontes de recursos (patrocínio, venda, ajuda de terceiros, etc.)
do $$ begin
  create type public.funding_source_type as enum
    ('cofrinho_familia','patrocinio','venda','ajuda_terceiros','verba_instituicao','outro');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.trip_funding_sources (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  type public.funding_source_type not null default 'outro',
  name text not null,
  planned_amount numeric(12,2) not null default 0,
  received_amount numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

alter table public.trip_funding_sources enable row level security;

do $$ begin
  create policy "trip_funding_sources: via trip family" on public.trip_funding_sources
    for all using (trip_id in (select id from public.trips where family_id in (select public.my_family_ids())));
exception
  when duplicate_object then null;
end $$;
