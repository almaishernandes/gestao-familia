-- Migração aditiva: cria o bucket de Storage "medical-documents" (usado para anexar
-- a foto/PDF da receita médica) e sua policy de acesso por família. Já está definido
-- em schema.sql para instalações novas, mas pode não existir ainda em bancos criados
-- antes dessa funcionalidade — este script cria só se faltar. Segura para produção.

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('medical-documents', 'medical-documents', false, 15728640,
   array['application/pdf','image/jpeg','image/png','image/webp'])
on conflict (id) do update set
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

do $$ begin
  create policy "medical-documents: family access" on storage.objects
    for all using (
      bucket_id = 'medical-documents'
      and (storage.foldername(name))[1]::uuid in (select public.my_family_ids())
    )
    with check (
      bucket_id = 'medical-documents'
      and (storage.foldername(name))[1]::uuid in (select public.my_family_ids())
    );
exception
  when duplicate_object then null;
end $$;
