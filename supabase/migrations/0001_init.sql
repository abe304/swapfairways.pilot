-- SwapFairways (SWF) piloto — esquema inicial
-- Ejecutar en el SQL editor de Supabase (o via supabase db push) sobre un proyecto nuevo.

-- ============================================================
-- EXTENSIONS
-- ============================================================
create extension if not exists "pgcrypto";

-- ============================================================
-- TABLES
-- ============================================================

create table public.clubs (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  ciudad text,
  created_at timestamptz not null default now()
);

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  nombre text not null,
  club_id uuid references public.clubs (id) on delete set null,
  handicap_manual numeric(4, 1),
  foto_url text,
  bio text,
  creditos_balance integer not null default 0,
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Tabla separada (no `profiles`) para poder controlar por RLS que el
-- teléfono de contacto solo se vea entre partes de una solicitud
-- aprobada/jugada, y no en la lista pública de ofertas/perfiles.
create table public.profile_contacts (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  telefono text,
  updated_at timestamptz not null default now()
);

create table public.tee_time_offers (
  id uuid primary key default gen_random_uuid(),
  host_id uuid not null references public.profiles (id) on delete cascade,
  club_id uuid not null references public.clubs (id) on delete restrict,
  fecha date not null,
  hora time not null,
  pases_disponibles integer not null check (pases_disponibles > 0),
  pases_confirmados integer not null default 0,
  caddie_incluido boolean not null default false,
  carrito_compartido boolean not null default false,
  costo_estimado numeric(10, 2) default 0,
  nota text,
  estado text not null default 'activa' check (estado in ('activa', 'cerrada', 'cancelada')),
  created_at timestamptz not null default now(),
  constraint pases_confirmados_no_exceden check (pases_confirmados <= pases_disponibles)
);

create table public.requests (
  id uuid primary key default gen_random_uuid(),
  offer_id uuid not null references public.tee_time_offers (id) on delete cascade,
  guest_id uuid not null references public.profiles (id) on delete cascade,
  estado text not null default 'pendiente' check (estado in ('pendiente', 'aprobado', 'rechazado', 'jugado', 'cancelado')),
  creditos_cobrados integer not null default 1,
  created_at timestamptz not null default now(),
  aprobado_at timestamptz,
  jugado_at timestamptz
);

-- Único por (offer_id, guest_id) solo mientras la solicitud sigue activa,
-- para permitir volver a solicitar la misma oferta tras un rechazo o
-- cancelación previos.
create unique index requests_offer_guest_active_idx on public.requests (offer_id, guest_id)
  where estado in ('pendiente', 'aprobado', 'jugado');

create table public.credit_transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  tipo text not null check (tipo in ('bienvenida', 'ganado', 'gastado', 'ajuste_admin')),
  monto integer not null,
  referencia uuid references public.requests (id) on delete set null,
  nota text,
  created_at timestamptz not null default now()
);

create table public.reviews (
  id uuid primary key default gen_random_uuid(),
  request_id uuid not null references public.requests (id) on delete cascade,
  autor_id uuid not null references public.profiles (id) on delete cascade,
  receptor_id uuid not null references public.profiles (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  tags text[] not null default '{}',
  comentario text,
  created_at timestamptz not null default now(),
  unique (request_id, autor_id)
);

create index requests_offer_id_idx on public.requests (offer_id);
create index requests_guest_id_idx on public.requests (guest_id);
create index credit_transactions_user_id_idx on public.credit_transactions (user_id);
create index tee_time_offers_club_fecha_idx on public.tee_time_offers (club_id, fecha);
create index reviews_receptor_id_idx on public.reviews (receptor_id);

-- ============================================================
-- BALANCE TRIGGER — profiles.creditos_balance sigue al ledger
-- ============================================================

create or replace function public.apply_credit_transaction()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.profiles
  set creditos_balance = creditos_balance + new.monto
  where id = new.user_id;
  return new;
end;
$$;

create trigger credit_transactions_apply
after insert on public.credit_transactions
for each row execute function public.apply_credit_transaction();

-- ============================================================
-- NUEVO USUARIO — crea profile + crédito de bienvenida
-- ============================================================

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_profile_id uuid;
begin
  insert into public.profiles (id, nombre)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1)))
  returning id into new_profile_id;

  insert into public.credit_transactions (user_id, tipo, monto, nota)
  values (new_profile_id, 'bienvenida', 3, 'Crédito de bienvenida al registrarte en SWF');

  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row execute function public.handle_new_user();

-- ============================================================
-- RPCs transaccionales — únicos paths que mutan requests/creditos
-- ============================================================

create or replace function public.create_join_request(p_offer_id uuid)
returns public.requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_offer public.tee_time_offers;
  v_guest_id uuid := auth.uid();
  v_balance integer;
  v_request public.requests;
begin
  if v_guest_id is null then
    raise exception 'No autenticado';
  end if;

  select * into v_offer from public.tee_time_offers where id = p_offer_id for update;
  if not found then
    raise exception 'Oferta no encontrada';
  end if;

  if v_offer.host_id = v_guest_id then
    raise exception 'No puedes solicitar unirte a tu propia oferta';
  end if;

  if v_offer.estado <> 'activa' then
    raise exception 'Esta oferta ya no está activa';
  end if;

  if v_offer.pases_confirmados >= v_offer.pases_disponibles then
    raise exception 'No quedan pases disponibles en esta oferta';
  end if;

  if exists (
    select 1 from public.requests
    where offer_id = p_offer_id and guest_id = v_guest_id and estado in ('pendiente', 'aprobado', 'jugado')
  ) then
    raise exception 'Ya tienes una solicitud activa para esta oferta';
  end if;

  select creditos_balance into v_balance from public.profiles where id = v_guest_id;
  if v_balance < 1 then
    raise exception 'No tienes créditos suficientes para solicitar esta ronda';
  end if;

  insert into public.requests (offer_id, guest_id, estado)
  values (p_offer_id, v_guest_id, 'pendiente')
  returning * into v_request;

  return v_request;
end;
$$;

create or replace function public.approve_request(p_request_id uuid)
returns public.requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.requests;
  v_offer public.tee_time_offers;
begin
  select * into v_request from public.requests where id = p_request_id for update;
  if not found then
    raise exception 'Solicitud no encontrada';
  end if;

  select * into v_offer from public.tee_time_offers where id = v_request.offer_id for update;
  if v_offer.host_id <> auth.uid() then
    raise exception 'Solo el anfitrión puede aprobar esta solicitud';
  end if;

  if v_request.estado <> 'pendiente' then
    raise exception 'Esta solicitud ya fue procesada';
  end if;

  if v_offer.pases_confirmados >= v_offer.pases_disponibles then
    raise exception 'No quedan pases disponibles en esta oferta';
  end if;

  update public.requests
  set estado = 'aprobado', aprobado_at = now()
  where id = p_request_id
  returning * into v_request;

  update public.tee_time_offers
  set pases_confirmados = pases_confirmados + 1,
      estado = case when pases_confirmados + 1 >= pases_disponibles then 'cerrada' else estado end
  where id = v_offer.id;

  return v_request;
end;
$$;

create or replace function public.reject_request(p_request_id uuid)
returns public.requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.requests;
  v_offer public.tee_time_offers;
begin
  select * into v_request from public.requests where id = p_request_id for update;
  if not found then
    raise exception 'Solicitud no encontrada';
  end if;

  select * into v_offer from public.tee_time_offers where id = v_request.offer_id;
  if v_offer.host_id <> auth.uid() then
    raise exception 'Solo el anfitrión puede rechazar esta solicitud';
  end if;

  if v_request.estado <> 'pendiente' then
    raise exception 'Esta solicitud ya fue procesada';
  end if;

  update public.requests
  set estado = 'rechazado'
  where id = p_request_id
  returning * into v_request;

  return v_request;
end;
$$;

create or replace function public.mark_request_played(p_request_id uuid)
returns public.requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.requests;
  v_offer public.tee_time_offers;
begin
  select * into v_request from public.requests where id = p_request_id for update;
  if not found then
    raise exception 'Solicitud no encontrada';
  end if;

  select * into v_offer from public.tee_time_offers where id = v_request.offer_id;
  if v_offer.host_id <> auth.uid() then
    raise exception 'Solo el anfitrión puede marcar la ronda como jugada';
  end if;

  if v_request.estado <> 'aprobado' then
    raise exception 'Solo se puede marcar como jugada una solicitud aprobada';
  end if;

  if v_offer.fecha > current_date then
    raise exception 'Aún no es la fecha de la ronda';
  end if;

  update public.requests
  set estado = 'jugado', jugado_at = now()
  where id = p_request_id
  returning * into v_request;

  insert into public.credit_transactions (user_id, tipo, monto, referencia, nota)
  values
    (v_request.guest_id, 'gastado', -v_request.creditos_cobrados, v_request.id, 'Ronda jugada'),
    (v_offer.host_id, 'ganado', v_request.creditos_cobrados, v_request.id, 'Ronda jugada como anfitrión');

  return v_request;
end;
$$;

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table public.clubs enable row level security;
alter table public.profiles enable row level security;
alter table public.profile_contacts enable row level security;
alter table public.tee_time_offers enable row level security;
alter table public.requests enable row level security;
alter table public.credit_transactions enable row level security;
alter table public.reviews enable row level security;

-- clubs: lectura pública
create policy clubs_select_all on public.clubs for select using (true);

-- profiles: lectura pública (necesaria para ver anfitriones/reputación), escritura solo propia
create policy profiles_select_all on public.profiles for select using (true);
create policy profiles_update_own on public.profiles for update using (auth.uid() = id);

-- profile_contacts: visible solo para el dueño, o para la contraparte de
-- una solicitud aprobada/jugada (host <-> guest)
create policy profile_contacts_select_own on public.profile_contacts for select using (
  auth.uid() = user_id
);
create policy profile_contacts_select_counterpart on public.profile_contacts for select using (
  exists (
    select 1 from public.requests r
    join public.tee_time_offers o on o.id = r.offer_id
    where r.estado in ('aprobado', 'jugado')
      and (
        (o.host_id = auth.uid() and r.guest_id = profile_contacts.user_id)
        or (r.guest_id = auth.uid() and o.host_id = profile_contacts.user_id)
      )
  )
);
create policy profile_contacts_upsert_own on public.profile_contacts for insert with check (auth.uid() = user_id);
create policy profile_contacts_update_own on public.profile_contacts for update using (auth.uid() = user_id);

-- tee_time_offers: lectura pública, escritura solo del host
create policy offers_select_all on public.tee_time_offers for select using (true);
create policy offers_insert_own on public.tee_time_offers for insert with check (auth.uid() = host_id);
create policy offers_update_own on public.tee_time_offers for update using (auth.uid() = host_id);

-- requests: solo guest u host de la oferta pueden ver; inserts/updates solo via RPC (security definer)
create policy requests_select_participants on public.requests for select using (
  auth.uid() = guest_id
  or auth.uid() = (select host_id from public.tee_time_offers where id = offer_id)
);

-- credit_transactions: cada usuario ve solo las suyas; sin insert/update directo desde el cliente
create policy credit_transactions_select_own on public.credit_transactions for select using (auth.uid() = user_id);

-- reviews: lectura pública (reputación visible en perfiles), insert solo por participantes de un request jugado
create policy reviews_select_all on public.reviews for select using (true);
create policy reviews_insert_participants on public.reviews for insert with check (
  auth.uid() = autor_id
  and exists (
    select 1 from public.requests r
    join public.tee_time_offers o on o.id = r.offer_id
    where r.id = request_id
      and r.estado = 'jugado'
      and (auth.uid() = r.guest_id or auth.uid() = o.host_id)
      and (
        (auth.uid() = r.guest_id and receptor_id = o.host_id)
        or (auth.uid() = o.host_id and receptor_id = r.guest_id)
      )
  )
);
