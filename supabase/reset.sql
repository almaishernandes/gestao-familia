-- ATENÇÃO: apaga todos os dados e objetos do schema Gestão Família.
-- Rode isto ANTES de rodar schema.sql novamente, apenas se puder perder os dados atuais.

drop table if exists
  public.platform_admins,
  public.purchase_receipts,
  public.comments,
  public.calendar_events,
  public.house_documents,
  public.feed_reactions,
  public.feed_posts,
  public.budgets,
  public.transactions,
  public.bank_accounts,
  public.leisure_ratings,
  public.leisure_wishlist,
  public.trip_funding_sources,
  public.trip_savings_contributions,
  public.trip_expenses,
  public.trip_itinerary_items,
  public.trips,
  public.medical_documents,
  public.medical_exams,
  public.prescriptions,
  public.medications,
  public.health_profiles,
  public.meal_plans,
  public.recipes,
  public.price_quotes,
  public.shopping_items,
  public.shopping_lists,
  public.family_members,
  public.profiles,
  public.families
cascade;

drop function if exists public.my_family_ids();
drop function if exists public.my_role_in(uuid);
drop function if exists public.create_family(text, text);
drop function if exists public.join_family_by_code(text, text);
drop function if exists public.is_platform_admin();
drop function if exists public.admin_create_family(text);
drop function if exists public.admin_update_subscription(uuid, public.subscription_status, numeric, date, date, text);
drop function if exists public.admin_delete_family(uuid);

drop type if exists public.calendar_event_type;
drop type if exists public.calendar_event_source;
drop type if exists public.transaction_kind;
drop type if exists public.subscription_status;
drop type if exists public.exam_status;
drop type if exists public.funding_source_type;
drop type if exists public.trip_expense_category;
drop type if exists public.trip_category;
drop type if exists public.trip_status;
drop type if exists public.meal_slot;
drop type if exists public.item_category;
drop type if exists public.family_role;
drop type if exists public.feed_post_type;
drop type if exists public.receipt_status;

drop policy if exists "house-documents: family access" on storage.objects;
drop policy if exists "medical-documents: family access" on storage.objects;
drop policy if exists "receipts: family access" on storage.objects;
