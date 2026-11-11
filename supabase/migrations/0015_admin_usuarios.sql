-- Lista de usuarios registrados para el panel de administración.
--
-- El correo vive en auth.users, que el cliente no puede leer; esta función
-- SECURITY DEFINER lo expone solo a administradores (es_admin(), de la 0012).
--
-- Segura de correr más de una vez.

create or replace function public.admin_listar_usuarios()
returns table (
  id uuid,
  nombre text,
  email text,
  telefono text,
  club text,
  creditos integer,
  is_admin boolean,
  codigo_usado text,
  invitado_por text,
  rondas_publicadas bigint,
  solicitudes bigint,
  registrado timestamptz,
  ultimo_acceso timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
begin
  if not public.es_admin() then
    raise exception 'Solo administradores';
  end if;

  return query
    select
      p.id,
      p.nombre::text,
      u.email::text,
      pc.telefono::text,
      c.nombre::text,
      p.creditos_balance,
      p.is_admin,
      p.codigo_usado::text,
      inv.nombre::text,
      (select count(*) from public.tee_time_offers o where o.host_id = p.id),
      (select count(*) from public.requests r where r.guest_id = p.id),
      p.created_at,
      u.last_sign_in_at
    from public.profiles p
    join auth.users u on u.id = p.id
    left join public.profile_contacts pc on pc.user_id = p.id
    left join public.clubs c on c.id = p.club_id
    left join public.profiles inv on inv.id = p.invitado_por
    order by p.created_at desc;
end;
$$;

revoke all on function public.admin_listar_usuarios() from public;
grant execute on function public.admin_listar_usuarios() to authenticated;
