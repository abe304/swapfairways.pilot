-- Espacio para que la administración (y quien la Federación designe como
-- admin) cargue la información de cada club: foto, estatutos y reglamentos.
--
--  * clubs.foto_url — foto principal (se usa en la home y en el directorio).
--  * club_documentos — N documentos por club (estatutos, reglamento de
--    golf, código de vestimenta…), cada uno con un archivo subido a
--    Storage o un enlace externo (Drive, sitio del club).
--  * Solo is_admin puede editar clubes y documentos; todos pueden leerlos.
--  * Bucket público de Storage `clubes` (fotos y PDFs); solo admin escribe.
--
-- Segura de correr más de una vez.

alter table public.clubs
  add column if not exists foto_url text;

create table if not exists public.club_documentos (
  id uuid primary key default gen_random_uuid(),
  club_id uuid not null references public.clubs (id) on delete cascade,
  tipo text not null default 'estatutos'
    check (tipo in ('estatutos', 'reglamento', 'vestimenta', 'otro')),
  titulo text not null,
  url text not null,
  -- Ruta dentro del bucket `clubes` cuando el archivo se subió a Storage
  -- (null si es un enlace externo); sirve para borrarlo después.
  storage_path text,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists club_documentos_club_idx on public.club_documentos (club_id);

alter table public.club_documentos enable row level security;
drop policy if exists club_documentos_select_all on public.club_documentos;
create policy club_documentos_select_all on public.club_documentos for select using (true);
drop policy if exists club_documentos_insert_admin on public.club_documentos;
create policy club_documentos_insert_admin on public.club_documentos
  for insert with check (public.es_admin());
drop policy if exists club_documentos_update_admin on public.club_documentos;
create policy club_documentos_update_admin on public.club_documentos
  for update using (public.es_admin());
drop policy if exists club_documentos_delete_admin on public.club_documentos;
create policy club_documentos_delete_admin on public.club_documentos
  for delete using (public.es_admin());

-- Edición de clubes: solo admin.
drop policy if exists clubs_update_admin on public.clubs;
create policy clubs_update_admin on public.clubs for update using (public.es_admin());

-- Storage: bucket público `clubes`, escritura solo para admin. Se omite si
-- el esquema `storage` no existe (p. ej. una base de pruebas sin Supabase).
do $$
begin
  if to_regclass('storage.buckets') is not null then
    insert into storage.buckets (id, name, public, file_size_limit)
    values ('clubes', 'clubes', true, 26214400)
    on conflict (id) do nothing;

    drop policy if exists clubes_storage_select on storage.objects;
    create policy clubes_storage_select on storage.objects
      for select using (bucket_id = 'clubes');
    drop policy if exists clubes_storage_insert_admin on storage.objects;
    create policy clubes_storage_insert_admin on storage.objects
      for insert with check (bucket_id = 'clubes' and public.es_admin());
    drop policy if exists clubes_storage_update_admin on storage.objects;
    create policy clubes_storage_update_admin on storage.objects
      for update using (bucket_id = 'clubes' and public.es_admin());
    drop policy if exists clubes_storage_delete_admin on storage.objects;
    create policy clubes_storage_delete_admin on storage.objects
      for delete using (bucket_id = 'clubes' and public.es_admin());
  end if;
end $$;
