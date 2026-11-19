-- Los 3 créditos de bienvenida ya no se dan al registrarse: se activan
-- cuando el socio publica su primera oferta ("das para recibir").
--
-- * handle_new_user deja de insertar el crédito de bienvenida (el resto
--   de la función queda igual que en la 0012).
-- * Un trigger en tee_time_offers da los 3 créditos la primera vez que el
--   socio publica una oferta. Si ya tiene un movimiento 'bienvenida'
--   (los socios registrados antes de esta migración), no se le da otro:
--   así se respetan los créditos de quien ya los tenía.
--
-- Limitación conocida: alguien puede publicar una oferta, recibir los
-- créditos y cancelarla. En el piloto se revisa a mano desde /admin.

-- ============================================================
-- 1. Alta de usuario sin crédito de bienvenida
-- ============================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  new_profile_id uuid;
  v_codigo text := upper(trim(coalesce(new.raw_user_meta_data ->> 'codigo_invitacion', '')));
  v_row public.codigos_invitacion;
  v_valido boolean := false;
  v_invitado_por uuid;
  v_requerido boolean;
begin
  select (value = 'true') into v_requerido from public.app_settings where key = 'invite_required';

  if v_codigo <> '' then
    select * into v_row from public.codigos_invitacion where codigo = v_codigo for update;
    if found and v_row.activo
       and (v_row.usos_maximos is null or v_row.usos < v_row.usos_maximos) then
      v_valido := true;
      v_invitado_por := v_row.owner_id;
      update public.codigos_invitacion set usos = usos + 1 where codigo = v_codigo;
    end if;
  end if;

  if coalesce(v_requerido, false) and not v_valido then
    raise exception 'Se requiere un código de invitación válido para registrarte';
  end if;

  insert into public.profiles (id, nombre, invitado_por, codigo_usado)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'nombre', split_part(new.email, '@', 1)),
    v_invitado_por,
    case when v_valido then v_codigo end
  )
  returning id into new_profile_id;

  insert into public.codigos_invitacion (codigo, tipo, owner_id)
  values (public.generar_codigo_invitacion(), 'usuario', new_profile_id);

  return new;
end;
$$;

-- ============================================================
-- 2. Créditos de bienvenida al publicar la primera oferta
-- ============================================================
create or replace function public.bienvenida_primera_oferta()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- Bloquea el perfil para que dos ofertas publicadas a la vez (varias
  -- fechas en un solo envío) no den el bono dos veces.
  perform 1 from public.profiles where id = new.host_id for update;

  if not exists (
    select 1 from public.credit_transactions
    where user_id = new.host_id and tipo = 'bienvenida'
  ) then
    -- referencia apunta a requests, así que aquí va vacía.
    insert into public.credit_transactions (user_id, tipo, monto, nota)
    values (new.host_id, 'bienvenida', 3,
            'Créditos de bienvenida por publicar tu primera oferta');
  end if;

  return new;
end;
$$;

drop trigger if exists bienvenida_primera_oferta on public.tee_time_offers;
create trigger bienvenida_primera_oferta
  after insert on public.tee_time_offers
  for each row execute function public.bienvenida_primera_oferta();
