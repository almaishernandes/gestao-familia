-- ============================================================================
-- FAMÍLIA HUB — SCHEMA POSTGRESQL / SUPABASE
-- ============================================================================
-- Convenções:
--   * Todo dado pertence a uma "family" (household). Isolamento multi-tenant
--     é feito via RLS comparando family_id com as famílias do usuário logado.
--   * profiles estende auth.users (1:1).
--   * family_members faz a ligação N:N entre profiles e families, com "role"
--     (owner/adult/dependent) usado para regras de privacidade financeira.
-- ============================================================================

create extension if not exists "uuid-ossp";
create extension if not exists "pgcrypto";

-- ============================================================================
-- 1. FAMÍLIAS & PERFIS
-- ============================================================================

create type public.subscription_status as enum ('trial', 'ativa', 'atrasada', 'cancelada');

create table public.families (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  avatar_url text,
  invite_code text not null unique default substr(md5(random()::text), 1, 8),
  subscription_status public.subscription_status not null default 'trial',
  subscription_price numeric(10,2),
  trial_ends_at date default (current_date + interval '15 days'),
  next_due_at date,
  last_payment_at date,
  payment_notes text,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  display_name text,
  avatar_url text,
  birth_date date,
  phone text,
  created_at timestamptz not null default now()
);

create type public.family_role as enum ('owner', 'adult', 'dependent');

create table public.family_members (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  role public.family_role not null default 'adult',
  can_view_finances boolean not null default true,
  joined_at timestamptz not null default now(),
  unique (family_id, profile_id)
);

-- Helper: famílias do usuário logado (usada em quase toda policy)
create or replace function public.my_family_ids()
returns setof uuid
language sql
security definer
stable
as $$
  select family_id from public.family_members where profile_id = auth.uid();
$$;

-- Helper: papel do usuário logado numa família
create or replace function public.my_role_in(fid uuid)
returns public.family_role
language sql
security definer
stable
as $$
  select role from public.family_members
  where family_id = fid and profile_id = auth.uid();
$$;

alter table public.families enable row level security;
alter table public.profiles enable row level security;
alter table public.family_members enable row level security;

create policy "families: members can read" on public.families
  for select using (id in (select public.my_family_ids()));
create policy "families: owner can update" on public.families
  for update using (public.my_role_in(id) = 'owner');
create policy "families: authenticated can create" on public.families
  for insert with check (auth.uid() is not null);

create policy "profiles: self and family members can read" on public.profiles
  for select using (
    id = auth.uid()
    or id in (
      select fm2.profile_id from public.family_members fm2
      where fm2.family_id in (select public.my_family_ids())
    )
  );
create policy "profiles: self can update" on public.profiles
  for update using (id = auth.uid());
create policy "profiles: family members can update each other" on public.profiles
  for update using (
    id in (
      select fm2.profile_id from public.family_members fm2
      where fm2.family_id in (select public.my_family_ids())
    )
  );
create policy "profiles: self can insert" on public.profiles
  for insert with check (id = auth.uid());

create policy "family_members: members can read own family" on public.family_members
  for select using (family_id in (select public.my_family_ids()));
create policy "family_members: owner manages" on public.family_members
  for all using (public.my_role_in(family_id) = 'owner');

-- ============================================================================
-- 2. HUB DE COMPRAS & ORÇAMENTOS
-- ============================================================================

create type public.item_category as enum ('alimentos','higiene','medicamentos','eletronicos','limpeza','outros');

create table public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  title text not null,
  store_type text, -- supermercado, farmacia, internet, outros
  created_by uuid not null references public.profiles(id),
  is_archived boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.shopping_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references public.shopping_lists(id) on delete cascade,
  name text not null,
  category public.item_category not null default 'outros',
  quantity numeric default 1,
  unit text,
  estimated_price numeric(10,2),
  final_price numeric(10,2),
  is_checked boolean not null default false,
  bought_by uuid references public.profiles(id),
  bought_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.price_quotes (
  id uuid primary key default gen_random_uuid(),
  item_id uuid not null references public.shopping_items(id) on delete cascade,
  store_name text not null,
  price numeric(10,2) not null,
  quoted_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.shopping_lists enable row level security;
alter table public.shopping_items enable row level security;
alter table public.price_quotes enable row level security;

create policy "shopping_lists: family access" on public.shopping_lists
  for all using (family_id in (select public.my_family_ids()))
  with check (family_id in (select public.my_family_ids()));

create policy "shopping_items: via list family" on public.shopping_items
  for all using (list_id in (select id from public.shopping_lists where family_id in (select public.my_family_ids())))
  with check (list_id in (select id from public.shopping_lists where family_id in (select public.my_family_ids())));

create policy "price_quotes: via item family" on public.price_quotes
  for all using (item_id in (
    select si.id from public.shopping_items si
    join public.shopping_lists sl on sl.id = si.list_id
    where sl.family_id in (select public.my_family_ids())
  ));

-- ============================================================================
-- 3. NUTRIÇÃO & CARDÁPIO SEMANAL
-- ============================================================================

create type public.meal_slot as enum ('cafe','almoco','lanche','jantar');

create table public.recipes (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  description text,
  ingredients jsonb not null default '[]', -- [{name, quantity, unit}]
  instructions text,
  calories numeric,
  protein_g numeric,
  carbs_g numeric,
  fat_g numeric,
  photo_url text,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.meal_plans (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  week_start_date date not null,
  day_of_week smallint not null check (day_of_week between 0 and 6), -- 0=domingo
  slot public.meal_slot not null,
  recipe_id uuid references public.recipes(id),
  custom_label text,
  created_at timestamptz not null default now(),
  unique (family_id, week_start_date, day_of_week, slot)
);

alter table public.recipes enable row level security;
alter table public.meal_plans enable row level security;

create policy "recipes: family access" on public.recipes
  for all using (family_id in (select public.my_family_ids()))
  with check (family_id in (select public.my_family_ids()));

create policy "meal_plans: family access" on public.meal_plans
  for all using (family_id in (select public.my_family_ids()))
  with check (family_id in (select public.my_family_ids()));

-- ============================================================================
-- 4. PRONTUÁRIO MÉDICO FAMILIAR
-- ============================================================================

create table public.health_profiles (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  blood_type text,
  allergies text[],
  chronic_conditions text[],
  emergency_contact_name text,
  emergency_contact_phone text,
  health_insurance text,
  updated_at timestamptz not null default now()
);

create table public.medications (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  dosage text,
  frequency text, -- ex: "a cada 8 horas"
  scheduled_times time[],
  start_date date,
  end_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Receituário: prescrições médicas, com dados do médico e os itens
-- prescritos (cada item é {nome, dosagem, posologia, quantidade}).
create table public.prescriptions (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  doctor_name text not null,
  doctor_crm text,
  specialty text,
  issued_date date not null default current_date,
  validity_date date,
  items jsonb not null default '[]', -- [{name, dosage, instructions, quantity}]
  notes text,
  storage_path text, -- foto/scan da receita no Supabase Storage
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create type public.exam_status as enum ('agendado','realizado','aguardando_resultado','concluido');

-- Exames médicos: do agendamento até o resultado.
create table public.medical_exams (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  exam_name text not null,
  exam_type text, -- sangue, imagem, cardiologico, urina, outros
  requested_by_doctor text,
  lab_name text,
  scheduled_at timestamptz,
  result_date date,
  status public.exam_status not null default 'agendado',
  result_summary text,
  storage_path text, -- laudo/resultado no Supabase Storage
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.medical_documents (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  family_id uuid not null references public.families(id) on delete cascade,
  title text not null,
  category text, -- exame, receita, laudo, vacina
  document_year smallint,
  storage_path text not null, -- caminho no Supabase Storage
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

alter table public.health_profiles enable row level security;
alter table public.medications enable row level security;
alter table public.prescriptions enable row level security;
alter table public.medical_exams enable row level security;
alter table public.medical_documents enable row level security;

create policy "health_profiles: family access" on public.health_profiles
  for all using (family_id in (select public.my_family_ids()))
  with check (family_id in (select public.my_family_ids()));

create policy "medications: family access" on public.medications
  for all using (family_id in (select public.my_family_ids()))
  with check (family_id in (select public.my_family_ids()));

create policy "prescriptions: family access" on public.prescriptions
  for all using (family_id in (select public.my_family_ids()))
  with check (family_id in (select public.my_family_ids()));

create policy "medical_exams: family access" on public.medical_exams
  for all using (family_id in (select public.my_family_ids()))
  with check (family_id in (select public.my_family_ids()));

create policy "medical_documents: family access" on public.medical_documents
  for all using (family_id in (select public.my_family_ids()))
  with check (family_id in (select public.my_family_ids()));

-- ============================================================================
-- 5. HUB DE VIAGENS, FÉRIAS & LAZER
-- ============================================================================

create type public.trip_status as enum ('planejando','confirmada','em_andamento','concluida','cancelada');

-- Três formatos de evento familiar fora de casa, cada um com seu próprio
-- roteiro, despesas categorizadas e fontes de recursos:
--   viagem   -> férias / viagens mais longas, com hospedagem
--   lazer    -> passeios curtos, sem pernoite (cinema, parque, restaurante)
--   excursao -> saídas em grupo/organizadas (igreja, escola, excursão comprada)
create type public.trip_category as enum ('viagem','lazer','excursao');

create table public.trips (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  category public.trip_category not null default 'viagem',
  title text not null,
  destination text,
  start_date date,
  end_date date,
  status public.trip_status not null default 'planejando',
  cover_photo_url text,
  savings_goal numeric(12,2) default 0,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.trip_itinerary_items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  day_date date,
  time_of_day time,
  title text not null,
  type text, -- hotel, voo, transporte, turismo, religioso, restaurante, outros
  location text,
  notes text,
  created_at timestamptz not null default now()
);

create type public.trip_expense_category as enum
  ('transporte','hospedagem','alimentacao','ingressos','saude','compras','outros');

create table public.trip_expenses (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  category public.trip_expense_category not null default 'outros',
  description text not null,
  amount numeric(10,2) not null,
  paid_by uuid references public.profiles(id),
  split_between uuid[], -- array de profile_id que dividem o custo
  expense_date date default current_date,
  created_at timestamptz not null default now()
);

create table public.trip_savings_contributions (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  profile_id uuid not null references public.profiles(id),
  amount numeric(10,2) not null,
  contributed_at timestamptz not null default now()
);

-- Fontes de recursos que vão viabilizar o evento além do cofrinho da família
-- (patrocínio, venda de itens/rifa, ajuda de parentes, verba da igreja/escola
-- no caso de excursões, etc.) — planejado vs. efetivamente recebido.
create type public.funding_source_type as enum
  ('cofrinho_familia','patrocinio','venda','ajuda_terceiros','verba_instituicao','outro');

create table public.trip_funding_sources (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips(id) on delete cascade,
  type public.funding_source_type not null default 'outro',
  name text not null,
  planned_amount numeric(12,2) not null default 0,
  received_amount numeric(12,2) not null default 0,
  notes text,
  created_at timestamptz not null default now()
);

create table public.leisure_wishlist (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  name text not null,
  category text, -- restaurante, passeio, evento
  address text,
  avg_rating numeric(2,1),
  suggested_by uuid references public.profiles(id),
  visited boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.leisure_ratings (
  id uuid primary key default gen_random_uuid(),
  wishlist_id uuid not null references public.leisure_wishlist(id) on delete cascade,
  profile_id uuid not null references public.profiles(id),
  rating smallint check (rating between 1 and 5),
  comment text,
  created_at timestamptz not null default now(),
  unique (wishlist_id, profile_id)
);

alter table public.trips enable row level security;
alter table public.trip_itinerary_items enable row level security;
alter table public.trip_expenses enable row level security;
alter table public.trip_savings_contributions enable row level security;
alter table public.trip_funding_sources enable row level security;
alter table public.leisure_wishlist enable row level security;
alter table public.leisure_ratings enable row level security;

create policy "trips: family access" on public.trips
  for all using (family_id in (select public.my_family_ids()))
  with check (family_id in (select public.my_family_ids()));

create policy "trip_itinerary_items: via trip family" on public.trip_itinerary_items
  for all using (trip_id in (select id from public.trips where family_id in (select public.my_family_ids())));

create policy "trip_expenses: via trip family" on public.trip_expenses
  for all using (trip_id in (select id from public.trips where family_id in (select public.my_family_ids())));

create policy "trip_savings_contributions: via trip family" on public.trip_savings_contributions
  for all using (trip_id in (select id from public.trips where family_id in (select public.my_family_ids())));

create policy "trip_funding_sources: via trip family" on public.trip_funding_sources
  for all using (trip_id in (select id from public.trips where family_id in (select public.my_family_ids())));

create policy "leisure_wishlist: family access" on public.leisure_wishlist
  for all using (family_id in (select public.my_family_ids()))
  with check (family_id in (select public.my_family_ids()));

create policy "leisure_ratings: via wishlist family" on public.leisure_ratings
  for all using (wishlist_id in (select id from public.leisure_wishlist where family_id in (select public.my_family_ids())));

-- ============================================================================
-- 6. CONTROLE FINANCEIRO
-- ============================================================================
-- Privacidade: contas/lançamentos podem ser marcados como "restricted" —
-- visíveis apenas para owner/adults quando o dono da conta é "dependent",
-- ou quando can_view_finances = false para o solicitante.

create table public.bank_accounts (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  owner_profile_id uuid references public.profiles(id),
  name text not null,
  institution text,
  account_type text, -- corrente, poupanca, investimento, reserva_emergencia
  current_balance numeric(12,2) not null default 0,
  is_private boolean not null default false, -- se true, só owner e admins veem saldo
  updated_at timestamptz not null default now()
);

create type public.transaction_kind as enum ('receita','despesa_fixa','despesa_variavel');

create table public.transactions (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  account_id uuid references public.bank_accounts(id),
  kind public.transaction_kind not null,
  category text, -- moradia, alimentacao, transporte, lazer, saude...
  description text not null,
  amount numeric(12,2) not null,
  due_date date,
  paid_at timestamptz,
  is_paid boolean not null default false,
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create table public.budgets (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  category text not null,
  month date not null, -- primeiro dia do mês
  planned_amount numeric(12,2) not null,
  unique (family_id, category, month)
);

alter table public.bank_accounts enable row level security;
alter table public.transactions enable row level security;
alter table public.budgets enable row level security;

-- Contas privadas só podem ser lidas pelo dono, owner da família, ou quem tem can_view_finances=true
create policy "bank_accounts: read with privacy rules" on public.bank_accounts
  for select using (
    family_id in (select public.my_family_ids())
    and (
      is_private = false
      or owner_profile_id = auth.uid()
      or public.my_role_in(family_id) = 'owner'
      or exists (
        select 1 from public.family_members fm
        where fm.family_id = bank_accounts.family_id
          and fm.profile_id = auth.uid()
          and fm.can_view_finances = true
      )
    )
  );
create policy "bank_accounts: write by owner/adults" on public.bank_accounts
  for insert with check (family_id in (select public.my_family_ids()));
create policy "bank_accounts: update by owner/self" on public.bank_accounts
  for update using (
    family_id in (select public.my_family_ids())
    and (owner_profile_id = auth.uid() or public.my_role_in(family_id) = 'owner')
  );
create policy "bank_accounts: delete by owner" on public.bank_accounts
  for delete using (public.my_role_in(family_id) = 'owner');

create policy "transactions: family access" on public.transactions
  for all using (family_id in (select public.my_family_ids()))
  with check (family_id in (select public.my_family_ids()));

create policy "budgets: family access" on public.budgets
  for all using (family_id in (select public.my_family_ids()))
  with check (family_id in (select public.my_family_ids()));

-- ============================================================================
-- 7. FEED, DOCUMENTOS, CALENDÁRIO & COMENTÁRIOS (transversal)
-- ============================================================================

create type public.feed_post_type as enum ('foto','aviso','recado','conquista');

create table public.feed_posts (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  author_id uuid not null references public.profiles(id),
  type public.feed_post_type not null default 'recado',
  content text,
  media_url text,
  created_at timestamptz not null default now()
);

create table public.feed_reactions (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.feed_posts(id) on delete cascade,
  profile_id uuid not null references public.profiles(id),
  emoji text not null default '❤️',
  created_at timestamptz not null default now(),
  unique (post_id, profile_id)
);

create table public.house_documents (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  title text not null,
  category text, -- contrato, escritura, comprovante, garantia
  storage_path text not null,
  expires_at date,
  uploaded_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

create type public.calendar_event_source as enum ('manual','aniversario','saude','viagem','financeiro');
create type public.calendar_event_type as enum ('compromisso','tarefa','lembrete');

create table public.calendar_events (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  title text not null,
  starts_at timestamptz not null,
  ends_at timestamptz,
  event_type public.calendar_event_type not null default 'compromisso',
  assigned_to uuid references public.profiles(id), -- null = toda a família
  is_done boolean not null default false, -- usado por tarefa/lembrete
  source public.calendar_event_source not null default 'manual',
  related_id uuid, -- id opcional da entidade de origem (trip, medication, etc.)
  created_by uuid references public.profiles(id),
  created_at timestamptz not null default now()
);

-- Comentários/diálogo em tempo real: genérico, associado por (entity_type, entity_id)
-- entity_type ex: 'shopping_list' | 'trip' | 'medication' | 'meal_plan'
create table public.comments (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  entity_type text not null,
  entity_id uuid not null,
  author_id uuid not null references public.profiles(id),
  content text not null,
  created_at timestamptz not null default now()
);
create index comments_entity_idx on public.comments (entity_type, entity_id);

alter table public.feed_posts enable row level security;
alter table public.feed_reactions enable row level security;
alter table public.house_documents enable row level security;
alter table public.calendar_events enable row level security;
alter table public.comments enable row level security;

create policy "feed_posts: family access" on public.feed_posts
  for all using (family_id in (select public.my_family_ids()))
  with check (family_id in (select public.my_family_ids()));

create policy "feed_reactions: via post family" on public.feed_reactions
  for all using (post_id in (select id from public.feed_posts where family_id in (select public.my_family_ids())));

create policy "house_documents: family access" on public.house_documents
  for all using (family_id in (select public.my_family_ids()))
  with check (family_id in (select public.my_family_ids()));

create policy "calendar_events: family access" on public.calendar_events
  for all using (family_id in (select public.my_family_ids()))
  with check (family_id in (select public.my_family_ids()));

create policy "comments: family access" on public.comments
  for all using (family_id in (select public.my_family_ids()))
  with check (family_id in (select public.my_family_ids()));

-- ============================================================================
-- 8. ONBOARDING RPCs (criar família / entrar por código de convite)
-- ============================================================================
-- security definer: necessário pois no momento da chamada o usuário ainda
-- não é membro de nenhuma família, então as policies normais bloqueariam
-- o insert em families/family_members.

create or replace function public.create_family(p_name text, p_full_name text)
returns table (family_id uuid, invite_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_family_id uuid;
  v_invite_code text;
begin
  insert into public.profiles (id, full_name)
  values (auth.uid(), p_full_name)
  on conflict (id) do update set full_name = excluded.full_name;

  insert into public.families (name) values (p_name)
  returning id, families.invite_code into v_family_id, v_invite_code;

  insert into public.family_members (family_id, profile_id, role)
  values (v_family_id, auth.uid(), 'owner');

  return query select v_family_id, v_invite_code;
end;
$$;

create or replace function public.join_family_by_code(p_invite_code text, p_full_name text)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_family_id uuid;
  v_role public.family_role;
begin
  select id into v_family_id from public.families where invite_code = p_invite_code;

  if v_family_id is null then
    raise exception 'Código de convite inválido';
  end if;

  insert into public.profiles (id, full_name)
  values (auth.uid(), p_full_name)
  on conflict (id) do update set full_name = excluded.full_name;

  -- O primeiro membro a entrar numa família (criada pelo admin da
  -- plataforma, sem nenhum membro ainda) vira o responsável (owner).
  if exists (select 1 from public.family_members where family_id = v_family_id) then
    v_role := 'adult';
  else
    v_role := 'owner';
  end if;

  insert into public.family_members (family_id, profile_id, role)
  values (v_family_id, auth.uid(), v_role)
  on conflict (family_id, profile_id) do nothing;

  return v_family_id;
end;
$$;

-- create_family não pode ser chamada por usuários comuns: só o admin da
-- plataforma cria famílias novas, via admin_create_family (seção 12).
-- Famílias já existentes cadastram membros livremente por invite_code.
revoke execute on function public.create_family(text, text) from public;
revoke execute on function public.create_family(text, text) from authenticated;
grant execute on function public.join_family_by_code(text, text) to authenticated;

-- ============================================================================
-- 9. CUPONS FISCAIS (NFC-e via QR Code)
-- ============================================================================
-- Fluxo: app escaneia o QR Code do cupom -> obtém a URL da NFC-e (portal da
-- SEFAZ do estado) -> uma Edge Function busca e interpreta a página -> os
-- itens retornados viram uma lista de compras já marcada como comprada.

create type public.receipt_status as enum ('pendente','processado','erro');

create table public.purchase_receipts (
  id uuid primary key default gen_random_uuid(),
  family_id uuid not null references public.families(id) on delete cascade,
  scanned_by uuid not null references public.profiles(id),
  nfce_url text not null,
  store_name text,
  total_amount numeric(10,2),
  purchased_at timestamptz,
  status public.receipt_status not null default 'pendente',
  raw_items jsonb, -- [{name, quantity, unit_price, total_price}]
  shopping_list_id uuid references public.shopping_lists(id),
  error_message text,
  created_at timestamptz not null default now()
);

alter table public.purchase_receipts enable row level security;

create policy "purchase_receipts: family access" on public.purchase_receipts
  for all using (family_id in (select public.my_family_ids()))
  with check (family_id in (select public.my_family_ids()));

-- ============================================================================
-- 10. STORAGE BUCKETS
-- ============================================================================
-- Buckets privados: acesso só via signed URL / policy (não são "public").

-- Limite de 15MB por arquivo, restrito a PDF, imagens e Word (evita que
-- alguém suba um arquivo gigante ou de tipo indevido por engano).
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('house-documents', 'house-documents', false, 15728640,
   array['application/pdf','image/jpeg','image/png','image/webp',
         'application/msword',
         'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('medical-documents', 'medical-documents', false, 15728640,
   array['application/pdf','image/jpeg','image/png','image/webp']),
  ('receipts', 'receipts', false, 15728640,
   array['application/pdf','image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

-- Estrutura de path esperada: <family_id>/<arquivo>. A policy extrai o
-- primeiro segmento do path e confere se é uma família do usuário.
create policy "house-documents: family access" on storage.objects
  for all using (
    bucket_id = 'house-documents'
    and (storage.foldername(name))[1]::uuid in (select public.my_family_ids())
  )
  with check (
    bucket_id = 'house-documents'
    and (storage.foldername(name))[1]::uuid in (select public.my_family_ids())
  );

create policy "medical-documents: family access" on storage.objects
  for all using (
    bucket_id = 'medical-documents'
    and (storage.foldername(name))[1]::uuid in (select public.my_family_ids())
  )
  with check (
    bucket_id = 'medical-documents'
    and (storage.foldername(name))[1]::uuid in (select public.my_family_ids())
  );

create policy "receipts: family access" on storage.objects
  for all using (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1]::uuid in (select public.my_family_ids())
  )
  with check (
    bucket_id = 'receipts'
    and (storage.foldername(name))[1]::uuid in (select public.my_family_ids())
  );

-- ============================================================================
-- 11. REALTIME
-- ============================================================================
alter publication supabase_realtime add table
  public.shopping_items,
  public.shopping_lists,
  public.comments,
  public.feed_posts,
  public.feed_reactions,
  public.trip_expenses,
  public.calendar_events,
  public.purchase_receipts;

-- ============================================================================
-- 12. ADMIN DA PLATAFORMA (multi-família)
-- ============================================================================
-- Permite que administradores da plataforma (donos do Instituto Hernandes)
-- gerenciem todas as famílias cadastradas sem precisar ser membro delas.
-- Bootstrap de admins é manual — ver instruções no final desta seção.

create table public.platform_admins (
  profile_id uuid primary key references public.profiles(id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.platform_admins enable row level security;

create or replace function public.is_platform_admin()
returns boolean
language sql
security definer
stable
as $$
  select exists (select 1 from public.platform_admins where profile_id = auth.uid());
$$;

create policy "platform_admins: admins can read" on public.platform_admins
  for select using (public.is_platform_admin());

create policy "families: platform admins can read all" on public.families
  for select using (public.is_platform_admin());

create policy "family_members: platform admins can read all" on public.family_members
  for select using (public.is_platform_admin());

create or replace function public.admin_create_family(p_name text)
returns table (family_id uuid, invite_code text)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_family_id uuid;
  v_invite_code text;
begin
  if not public.is_platform_admin() then
    raise exception 'Apenas administradores da plataforma podem criar famílias por aqui.';
  end if;

  insert into public.families (name) values (p_name)
  returning id, families.invite_code into v_family_id, v_invite_code;

  return query select v_family_id, v_invite_code;
end;
$$;

grant execute on function public.admin_create_family(text) to authenticated;

-- Admin edita o status de assinatura/pagamento de uma família (RLS de
-- "families" já permite update só pelo owner da família — este RPC dá
-- esse poder também ao admin da plataforma).
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

-- Admin apaga uma família (e tudo que pertence a ela, em cascata: listas,
-- viagens, posts, documentos etc. — via ON DELETE CASCADE em family_id).
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

-- Bootstrap: depois de aplicar o schema, torne seu usuário admin rodando
-- (uma vez): insert into public.platform_admins (profile_id)
--            select id from auth.users where email = 'seu-email@exemplo.com';
