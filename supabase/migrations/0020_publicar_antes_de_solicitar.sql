-- 0020: Un socio no puede usar sus créditos (solicitar unirse a una ronda)
-- hasta que haya publicado al menos una ronda propia.
--
--  * Cuenta una oferta propia activa o cerrada; las canceladas no cuentan
--    (así no se desbloquea publicando y cancelando de inmediato).
--  * Es la misma create_join_request de la 0016 con esta validación extra.
--    La app también lo avisa en la página de la oferta, pero la regla vive
--    aquí para que no se pueda saltar.
--
-- Segura de correr más de una vez.

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

  select costo_creditos, acceso into v_costo, v_acceso from public.clubs where id = v_offer.club_id;
  v_costo := coalesce(v_costo, 1);
  if coalesce(v_acceso, 'pase') <> 'pase' and coalesce(v_offer.green_fee_paga, 'invitado') = 'invitado' then
    v_costo := 1;
  end if;

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
