-- Migração aditiva: Receituário (prescriptions) e Exames Médicos (medical_exams).
-- Segura para rodar em produção — não apaga nem altera dados existentes.

create table if not exists public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  doctor_name text not null,
  doctor_crm text,
  specialty text,
  issued_date date not null default current_date,
  validity_date date,
  items jsonb not null default '[]',
  notes text,
  storage_path text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

do $$ begin
  create type public.exam_status as enum ('agendado','realizado','aguardando_resultado','concluido');
exception
  when duplicate_object then null;
end $$;

create table if not exists public.medical_exams (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  exam_name text not null,
  exam_type text,
  requested_by_doctor text,
  lab_name text,
  scheduled_at timestamptz,
  result_date date,
  status public.exam_status not null default 'agendado',
  result_summary text,
  storage_path text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.prescriptions enable row level security;
alter table public.medical_exams enable row level security;

do $$ begin
  create policy "prescriptions: family access" on public.prescriptions
    for all using (family_id in (select public.my_family_ids()))
    with check (family_id in (select public.my_family_ids()));
exception
  when duplicate_object then null;
end $$;

do $$ begin
  create policy "medical_exams: family access" on public.medical_exams
    for all using (family_id in (select public.my_family_ids()))
    with check (family_id in (select public.my_family_ids()));
exception
  when duplicate_object then null;
end $$;
