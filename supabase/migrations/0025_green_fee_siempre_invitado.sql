-- 0025: El anfitrión nunca cubre el green fee.
--
-- En clubes con green fee o abiertos, el invitado siempre paga el green fee
-- directo en el club y la ronda le cuesta 1 crédito. El anfitrión recibe 1,
-- salvo en Premium con green fee, donde recibe 2 (regla 0024). Un Premium
-- abierto da solo 1. Ya no existe la opción de que el anfitrión lo cubra y
-- la ronda valga el nivel completo.
--
--  * Las ofertas que decían green_fee_paga = 'anfitrion' pasan a 'invitado'.
--    Su costo de green fee quedó vacío al publicarlas (no se capturaba), así
--    que la página dice que el monto lo confirma el anfitrión.
--  * green_fee_paga solo puede ser 'invitado' (o null en clubes de pase).
--  * create_join_request es la de la 0024 sin mirar green_fee_paga.
--
-- Correr DESPUÉS de la 0024. Segura de correr más de una vez.

alter table public.requests
  add column if not exists creditos_anfitrion integer;

update public.tee_time_offers
set green_fee_paga = 'invitado'
where green_fee_paga = 'anfitrion';

alter table public.tee_time_offers
  drop constraint if exists tee_time_offers_green_fee_paga_check;
alter table public.tee_time_offers
  add constraint tee_time_offers_green_fee_paga_check
  check (green_fee_paga is null or green_fee_paga = 'invitado');

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
  v_acceso text;
  v_nivel text;
  v_anfitrion integer;
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

  -- Regla 0020: para usar créditos primero hay que publicar una ronda propia
  -- (activa o ya cerrada; las canceladas no cuentan).
  if not exists (
    select 1 from public.tee_time_offers
    where host_id = v_guest_id and estado in ('activa', 'cerrada')
  ) then
    raise exception 'Para usar tus créditos primero publica una ronda en tu club.';
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

  select costo_creditos, acceso, nivel into v_costo, v_acceso, v_nivel
  from public.clubs where id = v_offer.club_id;
  v_costo := coalesce(v_costo, 1);
  v_anfitrion := v_costo;
  -- Regla 0025: en clubes con green fee o abiertos el invitado siempre paga
  -- el green fee, así que usa 1 crédito. El anfitrión recibe 1, salvo en
  -- Premium con green fee (no abierto), donde recibe 2 (regla 0024).
  if coalesce(v_acceso, 'pase') <> 'pase' then
    v_costo := 1;
    v_anfitrion := case when v_nivel = 'premium' and v_acceso = 'green_fee' then 2 else 1 end;
  end if;

  select creditos_balance into v_balance from public.profiles where id = v_guest_id;
  if v_balance < v_costo then
    raise exception 'No tienes créditos suficientes para solicitar esta ronda (cuesta % créditos)', v_costo;
  end if;

  insert into public.requests (offer_id, guest_id, estado, creditos_cobrados, creditos_anfitrion)
  values (p_offer_id, v_guest_id, 'pendiente', v_costo, v_anfitrion)
  returning * into v_request;

  return v_request;
end;
$$;
