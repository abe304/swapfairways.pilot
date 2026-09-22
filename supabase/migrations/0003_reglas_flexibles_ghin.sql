-- Segunda ronda de mejoras del piloto:
--  - GHIN en vez de foto en el perfil.
--  - Reglamento y obligaciones por club (caddie/carrito/GHIN obligatorios,
--    recomendación de hora de llegada) — editables por ahora solo desde
--    Supabase Studio (no hay todavía un login separado para clubes).
--  - Costo variable en créditos por club, para que un pase a un club de
--    mayor demanda no se intercambie 1 a 1 contra uno de menor demanda.
--  - Ofertas con fecha flexible ("a coordinar con el anfitrión") además de
--    las de fecha fija.

alter table public.profiles
  add column if not exists ghin_id text;

alter table public.clubs
  add column if not exists reglamento text,
  add column if not exists requiere_caddie_invitado boolean not null default false,
  add column if not exists carrito_obligatorio boolean not null default false,
  add column if not exists requiere_ghin boolean not null default false,
  add column if not exists recomendacion_llegada text,
  add column if not exists costo_creditos integer not null default 1 check (costo_creditos >= 1);

alter table public.tee_time_offers
  alter column fecha drop not null,
  alter column hora drop not null,
  add column if not exists fecha_flexible boolean not null default false;

alter table public.tee_time_offers
  add constraint fecha_flexible_or_fecha_set check (
    fecha_flexible or (fecha is not null and hora is not null)
  );

-- El índice anterior asumía fecha not null; se reemplaza por uno parcial
-- que solo cubre las ofertas con fecha fija (las flexibles se listan aparte).
drop index if exists tee_time_offers_club_fecha_idx;
create index tee_time_offers_club_fecha_idx on public.tee_time_offers (club_id, fecha)
  where fecha is not null;

-- create_join_request: cobra el costo en créditos configurado por club, no
-- siempre 1.
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
  v_costo integer;
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

  select costo_creditos into v_costo from public.clubs where id = v_offer.club_id;
  v_costo := coalesce(v_costo, 1);

  select creditos_balance into v_balance from public.profiles where id = v_guest_id;
  if v_balance < v_costo then
    raise exception 'No tienes créditos suficientes para solicitar esta ronda (cuesta % créditos)', v_costo;
  end if;

  insert into public.requests (offer_id, guest_id, estado, creditos_cobrados)
  values (p_offer_id, v_guest_id, 'pendiente', v_costo)
  returning * into v_request;

  return v_request;
end;
$$;

-- mark_request_played: la validación de fecha solo aplica a ofertas con
-- fecha fija — las flexibles las puede marcar jugadas el anfitrión cuando
-- de verdad ocurrió la ronda.
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

  if not v_offer.fecha_flexible and v_offer.fecha > current_date then
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

-- Ejemplo real de obligaciones por club (ver punto 10 del feedback del
-- piloto): en Club Santa Anita el invitado debe llevar caddie, es
-- obligatorio rentar carrito, y hay que mostrar el GHIN.
update public.clubs
set
  requiere_caddie_invitado = true,
  carrito_obligatorio = true,
  requiere_ghin = true,
  recomendacion_llegada = 'Llega al menos 45 minutos antes de tu hora de salida para registro y calentamiento.'
where nombre = 'Club Santa Anita';

-- Ejemplo de costo variable en créditos (punto 8 del feedback): un club de
-- mayor demanda no se intercambia 1 a 1 contra uno de menor demanda. Este
-- valor es editable por club desde Supabase Studio.
update public.clubs
set costo_creditos = 2
where nombre = 'Club de Golf Chapultepec';
