-- Un socio puede pertenecer a más de un club (ej. su club principal más
-- clubes de reciprocidad/segunda casa). profiles.club_id sigue siendo el
-- club "principal" (el que se muestra en el perfil público y el que se
-- exige completar antes de poder anfitrionar); esta tabla es la lista
-- completa de clubes del socio, usada para ofrecerle accesos rápidos al
-- anfitrionar en cualquiera de ellos.

create table public.profile_clubs (
  profile_id uuid not null references public.profiles (id) on delete cascade,
  club_id uuid not null references public.clubs (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (profile_id, club_id)
);

alter table public.profile_clubs enable row level security;

create policy profile_clubs_select_all on public.profile_clubs for select using (true);
create policy profile_clubs_insert_own on public.profile_clubs for insert with check (auth.uid() = profile_id);
create policy profile_clubs_delete_own on public.profile_clubs for delete using (auth.uid() = profile_id);

-- A todos los que ya tengan un club principal, se les da de alta ahí
-- también en la lista completa, para que no empiecen en cero.
insert into public.profile_clubs (profile_id, club_id)
select id, club_id from public.profiles where club_id is not null
on conflict do nothing;
