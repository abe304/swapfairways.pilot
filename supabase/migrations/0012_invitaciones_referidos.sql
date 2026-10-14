-- Códigos de invitación, referidos que ganan créditos y candado de seguridad
-- sobre `profiles`.
--
--  * Cada usuario tiene un código de invitación único (tipo 'usuario',
--    usos ilimitados). El administrador puede generar códigos de 'fundador'
--    (de un solo uso, a nombre de la persona que va a invitar) para dar de
--    alta a los primeros socios.
--  * Registrarse con un código guarda quién invitó (`invitado_por`). Cuando
--    la persona invitada juega su primera ronda (como invitada o como
--    anfitriona), quien la invitó gana créditos (ajustable en app_settings).
--  * `app_settings.invite_required` decide si registrarse exige código.
--    Arranca en 'false' para no romper a los testers actuales; se activa
--    desde el panel de administración cuando ya haya códigos repartidos.
--  * SEGURIDAD: la política `profiles_update_own` permitía a cualquier
--    usuario autenticado actualizar TODAS sus columnas — incluidas
--    `creditos_balance` e `is_admin`. Se restringe a las columnas editables
--    desde el perfil.
--
-- Segura de correr más de una vez.

-- ============================================================
-- 1. Candado de seguridad sobre profiles
-- ============================================================
do $$
begin
  if exists (select 1 from pg_roles where rolname = 'authenticated') then
    revoke update on public.profiles from authenticated;
    grant update (nombre, club_id, handicap_manual, foto_url, ghin_id, bio)
      on public.profiles to authenticated;
  end if;
  if exists (select 1 from pg_roles where rolname = 'anon') then
    revoke update on public.profiles from anon;
  end if;
end $$;

-- ============================================================
-- 2. Helpers y configuración
-- ============================================================
create or replace function public.es_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

create table if not exists public.app_settings (
  key text primary key,
  value text not null,
  updated_at timestamptz not null default now()
);

insert into public.app_settings (key, value) values
  ('invite_required', 'false'),
  ('recompensa_referido', '1')
on conflict (key) do nothing;

alter table public.app_settings enable row level security;
drop policy if exists app_settings_select_all on public.app_settings;
create policy app_settings_select_all on public.app_settings for select using (true);
drop policy if exists app_settings_update_admin on public.app_settings;
create policy app_settings_update_admin on public.app_settings for update using (public.es_admin());

-- ============================================================
-- 3. Códigos de invitación
-- ============================================================
create table if not exists public.codigos_invitacion (
  codigo text primary key,
  tipo text not null check (tipo in ('usuario', 'fundador')),
  -- Dueño del código (tipo 'usuario'). Null en los de fundador.
  owner_id uuid references public.profiles (id) on delete cascade,
  -- Para códigos de fundador: a quién se le dio.
  etiqueta text,
  email text,
  usos integer not null default 0,
  usos_maximos integer,
  activo boolean not null default true,
  creado_por uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create unique index if not exists codigos_invitacion_owner_idx
  on public.codigos_invitacion (owner_id) where tipo = 'usuario';

alter table public.codigos_invitacion enable row level security;
-- Cada quien ve solo su código; el admin ve y gestiona todos. La
-- validación al registrarse pasa por validar_codigo_invitacion() (security
-- definer), así los códigos no son enumerables desde afuera.
drop policy if exists codigos_select_own_or_admin on public.codigos_invitacion;
create policy codigos_select_own_or_admin on public.codigos_invitacion
  for select using (owner_id = auth.uid() or public.es_admin());
drop policy if exists codigos_insert_admin on public.codigos_invitacion;
create policy codigos_insert_admin on public.codigos_invitacion
  for insert with check (public.es_admin());
drop policy if exists codigos_update_admin on public.codigos_invitacion;
create policy codigos_update_admin on public.codigos_invitacion
  for update using (public.es_admin());
drop policy if exists codigos_delete_admin on public.codigos_invitacion;
create policy codigos_delete_admin on public.codigos_invitacion
  for delete using (public.es_admin());

alter table public.profiles
  add column if not exists invitado_por uuid references public.profiles (id) on delete set null,
  add column if not exists codigo_usado text,
  add column if not exists referido_pagado boolean not null default false;

create or replace function public.generar_codigo_invitacion()
returns text
language plpgsql
volatile
set search_path = public
as $$
declare
  -- Sin 0/O/1/I/L para que se pueda dictar por teléfono sin confusiones.
  alfabeto constant text := 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
  v_codigo text;
  i integer;
begin
  loop
    v_codigo := 'SWF-';
    for i in 1..6 loop
      v_codigo := v_codigo || substr(alfabeto, 1 + floor(random() * length(alfabeto))::int, 1);
    end loop;
    exit when not exists (select 1 from public.codigos_invitacion where codigo = v_codigo);
  end loop;
  return v_codigo;
end;
$$;

-- Backfill: un código por cada usuario existente.
insert into public.codigos_invitacion (codigo, tipo, owner_id)
select public.generar_codigo_invitacion(), 'usuario', p.id
from public.profiles p
where not exists (
  select 1 from public.codigos_invitacion c where c.owner_id = p.id and c.tipo = 'usuario'
);

-- Validación pública (también para anon, antes de registrarse). Devuelve
-- solo si es válido y el nombre de quien invita — nunca lista códigos.
create or replace function public.validar_codigo_invitacion(p_codigo text)
returns table (valido boolean, invitador text)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_codigo text := upper(trim(coalesce(p_codigo, '')));
  v_row public.codigos_invitacion;
begin
  select * into v_row from public.codigos_invitacion where codigo = v_codigo;
  if not found or not v_row.activo
     or (v_row.usos_maximos is not null and v_row.usos >= v_row.usos_maximos) then
    return query select false, null::text;
    return;
  end if;
  return query
    select true, (select p.nombre from public.profiles p where p.id = v_row.owner_id);
end;
$$;

grant execute on function public.validar_codigo_invitacion(text) to anon, authenticated;

-- ============================================================
-- 4. Alta de usuario: perfil + código propio + redención del código usado
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

  -- Respaldo del lado de la base de datos: aunque alguien se registre
  -- saltándose la app, sin código válido no entra cuando es obligatorio.
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

  insert into public.credit_transactions (user_id, tipo, monto, nota)
  values (new_profile_id, 'bienvenida', 3, 'Crédito de bienvenida al registrarte en SWF');

  return new;
end;
$$;

-- ============================================================
-- 5. Créditos por referido
-- ============================================================
alter table public.credit_transactions drop constraint if exists credit_transactions_tipo_check;
alter table public.credit_transactions
  add constraint credit_transactions_tipo_check
  check (tipo in ('bienvenida', 'ganado', 'gastado', 'ajuste_admin', 'referido'));

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
    (v_offer.host_id, 'ganado', v_request.creditos_cobrados, v_request.id, 'Ronda jugada como anfitrión');

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
