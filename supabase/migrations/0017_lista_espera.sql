-- 0017: Lista de espera para quien quiere registrarse sin código.
--
-- Cuando el registro es solo por invitación (app_settings.invite_required),
-- quien llega sin código deja sus datos en `lista_espera`. El administrador
-- los ve en /admin/lista-espera y desde ahí les crea su código de fundador.
--
--  * El público NO puede leer ni escribir la tabla directo: solo puede
--    llamar a solicitar_invitacion(), que valida y guarda.
--  * Si la misma persona (mismo correo) vuelve a pedir mientras sigue
--    pendiente, se actualizan sus datos en vez de duplicarla.
--
-- Segura de correr más de una vez.

create table if not exists public.lista_espera (
  id uuid primary key default gen_random_uuid(),
  nombre text not null,
  email text not null,
  telefono text,
  club text,
  mensaje text,
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'invitado', 'descartado')),
  codigo text references public.codigos_invitacion (codigo) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists lista_espera_estado_idx on public.lista_espera (estado, created_at desc);
create index if not exists lista_espera_email_idx on public.lista_espera (lower(email));

alter table public.lista_espera enable row level security;

drop policy if exists lista_espera_admin_select on public.lista_espera;
create policy lista_espera_admin_select on public.lista_espera
  for select using (public.es_admin());

drop policy if exists lista_espera_admin_update on public.lista_espera;
create policy lista_espera_admin_update on public.lista_espera
  for update using (public.es_admin()) with check (public.es_admin());

drop policy if exists lista_espera_admin_delete on public.lista_espera;
create policy lista_espera_admin_delete on public.lista_espera
  for delete using (public.es_admin());

create or replace function public.solicitar_invitacion(
  p_nombre text,
  p_email text,
  p_telefono text default null,
  p_club text default null,
  p_mensaje text default null
)
returns text
language plpgsql
security definer
set search_path = public
as $$
declare
  v_nombre text := left(trim(coalesce(p_nombre, '')), 120);
  v_email text := lower(left(trim(coalesce(p_email, '')), 200));
  v_tel text := nullif(left(trim(coalesce(p_telefono, '')), 20), '');
  v_club text := nullif(left(trim(coalesce(p_club, '')), 160), '');
  v_msg text := nullif(left(trim(coalesce(p_mensaje, '')), 1000), '');
  v_id uuid;
begin
  if v_nombre = '' then
    raise exception 'Escribe tu nombre.';
  end if;
  if v_email !~ '^[^\s@]+@[^\s@]+\.[^\s@]+$' then
    raise exception 'Escribe un correo válido.';
  end if;

  if exists (select 1 from auth.users where lower(email) = v_email) then
    return 'ya_registrado';
  end if;

  select id into v_id from public.lista_espera
  where lower(email) = v_email and estado = 'pendiente'
  limit 1;

  if v_id is not null then
    update public.lista_espera
    set nombre = v_nombre, telefono = coalesce(v_tel, telefono), club = coalesce(v_club, club),
        mensaje = coalesce(v_msg, mensaje), updated_at = now()
    where id = v_id;
    return 'actualizado';
  end if;

  insert into public.lista_espera (nombre, email, telefono, club, mensaje)
  values (v_nombre, v_email, v_tel, v_club, v_msg);
  return 'nuevo';
end;
$$;

revoke all on function public.solicitar_invitacion(text, text, text, text, text) from public;
grant execute on function public.solicitar_invitacion(text, text, text, text, text) to anon, authenticated;
