-- 0024: En clubes Premium con green fee, el anfitrión recibe 2 créditos
-- aunque el invitado pague el green fee.
--
-- Antes, si el invitado pagaba el green fee, la ronda valía 1 crédito para
-- los dos, sin importar el nivel: un Premium valía lo mismo que un Gold.
-- Ahora:
--
--   Club (green fee / abierto)  | Paga invitado | Recibe anfitrión
--   Premium, invitado paga GF   |       1       |        2
--   Gold/Silver, invitado paga  |       1       |        1
--   Cualquiera, anfitrión cubre |  lo del nivel |   lo del nivel
--   Clubes de pase              |  lo del nivel |   lo del nivel
--
--  * requests.creditos_anfitrion guarda lo que recibirá el anfitrión, fijado
--    al solicitar (como creditos_cobrados). Las solicitudes anteriores quedan
--    en null y se pagan como antes (lo mismo que pagó el invitado).
--  * Ese crédito extra se crea de la nada: el sistema deja de ser de suma
--    cero en estas rondas, a propósito, para premiar abrir un Premium.
--  * create_join_request es la de la 0020 con este cálculo extra;
--    mark_request_played es la de la 0012 con este pago al anfitrión.
--
-- Segura de correr más de una vez.

alter table public.requests
  add column if not exists creditos_anfitrion integer;

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
  if coalesce(v_acceso, 'pase') <> 'pase' and coalesce(v_offer.green_fee_paga, 'invitado') = 'invitado' then
    v_costo := 1;
    -- Regla 0024: en Premium el anfitrión recibe 2 aunque el invitado pague
    -- el green fee; en Gold y Silver recibe lo mismo que paga el invitado.
    v_anfitrion := case when v_nivel = 'premium' then 2 else 1 end;
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

create or replace function public.mark_request_played(p_request_id uuid)
returns public.requests
language plpgsql
security definer
set search_path = public
as $$
declare
  v_request public.requests;
  v_offer public.tee_time_offers;
  v_user uuid;
  v_perfil public.profiles;
  v_recompensa integer;
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
    (v_offer.host_id, 'ganado', coalesce(v_request.creditos_anfitrion, v_request.creditos_cobrados),
     v_request.id, 'Ronda jugada como anfitrión');

  -- Quien invitó a alguno de los dos gana créditos la primera vez que esa
  -- persona juega una ronda (como invitada o como anfitriona).
  select coalesce((select value::integer from public.app_settings where key = 'recompensa_referido'), 1)
    into v_recompensa;
  if v_recompensa > 0 then
    foreach v_user in array array[v_request.guest_id, v_offer.host_id] loop
      select * into v_perfil from public.profiles where id = v_user for update;
      if v_perfil.invitado_por is not null and not v_perfil.referido_pagado then
        insert into public.credit_transactions (user_id, tipo, monto, referencia, nota)
        values (
          v_perfil.invitado_por, 'referido', v_recompensa, v_request.id,
          'Recomendaste a ' || v_perfil.nombre || ' y ya jugó su primera ronda'
        );
        update public.profiles set referido_pagado = true where id = v_user;
      end if;
    end loop;
  end if;

  return v_request;
end;
$$;
