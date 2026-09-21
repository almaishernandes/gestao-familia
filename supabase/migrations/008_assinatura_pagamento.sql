-- Migração aditiva: status de assinatura/pagamento por família, editável
-- pelo admin da plataforma. Segura para produção — não apaga dados.

do $$ begin
  create type public.subscription_status as enum ('trial', 'ativa', 'atrasada', 'cancelada');
exception
  when duplicate_object then null;
end $$;

alter table public.families
  add column if not exists subscription_status public.subscription_status not null default 'trial';

alter table public.families
  add column if not exists subscription_price numeric(10,2);

alter table public.families
  add column if not exists trial_ends_at date default (current_date + interval '15 days');

alter table public.families
  add column if not exists next_due_at date;

alter table public.families
  add column if not exists last_payment_at date;

alter table public.families
  add column if not exists payment_notes text;

create or replace function public.admin_update_subscription(
  p_family_id uuid,
  p_status public.subscription_status,
  p_price numeric,
  p_next_due_at date,
  p_last_payment_at date,
  p_notes text
)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not public.is_platform_admin() then
    raise exception 'Apenas administradores da plataforma podem alterar a assinatura.';
  end if;

  update public.families
  set subscription_status = p_status,
      subscription_price = p_price,
      next_due_at = p_next_due_at,
      last_payment_at = p_last_payment_at,
      payment_notes = p_notes
  where id = p_family_id;
end;
$$;

grant execute on function public.admin_update_subscription(uuid, public.subscription_status, numeric, date, date, text) to authenticated;
