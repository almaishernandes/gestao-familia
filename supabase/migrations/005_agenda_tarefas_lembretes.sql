-- Migração aditiva: transforma calendar_events numa agenda com tipo
-- (compromisso/tarefa/lembrete), responsável (membro ou toda a família) e
-- status de conclusão. Segura para produção — não apaga dados existentes.

do $$ begin
  create type public.calendar_event_type as enum ('compromisso','tarefa','lembrete');
exception
  when duplicate_object then null;
end $$;

alter table public.calendar_events
  add column if not exists event_type public.calendar_event_type not null default 'compromisso';

alter table public.calendar_events
  add column if not exists assigned_to uuid references public.profiles(id);

alter table public.calendar_events
  add column if not exists is_done boolean not null default false;
