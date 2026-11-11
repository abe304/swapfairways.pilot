-- PASO 2 (BORRA DATOS, NO SE PUEDE DESHACER). Corre antes el PASO 1 y revisa la lista.
--
-- Qué hace:
--   * Borra por completo a todos los usuarios que NO sean Druso, Iván y Abraham
--     (su cuenta, perfil, rondas, solicitudes, créditos, reseñas y su código).
--   * A Druso, Iván y Abraham les conserva la cuenta, el perfil y el admin, pero
--     borra todas las rondas que publicaron y las solicitudes que hicieron o
--     aceptaron, y deja sus créditos solo con el crédito de bienvenida.
--   * No toca clubes, documentos, fotos ni los códigos de fundador.
--
-- Seguro: si no encuentra exactamente a esas 3 personas, se detiene sin borrar nada.

do $$
declare
  v_conservar uuid[];
  v_usuarios int;
  v_rondas int;
begin
  select array_agg(u.id) into v_conservar
  from auth.users u
  where lower(u.email) in (
          select lower(ci.email) from public.codigos_invitacion ci
          where ci.codigo in ('SWF-SSER5R', 'SWF-2VAMQV', 'SWF-6YX8QK') and ci.email is not null)
     or u.id in (
          select p.id from public.profiles p
          where p.codigo_usado in ('SWF-SSER5R', 'SWF-2VAMQV', 'SWF-6YX8QK'));

  if coalesce(array_length(v_conservar, 1), 0) <> 3 then
    raise exception 'Se esperaban 3 usuarios a conservar y se encontraron %. No se borró nada.',
      coalesce(array_length(v_conservar, 1), 0);
  end if;

  -- 1. Usuarios de prueba: se borra la cuenta y, en cascada, todo lo suyo.
  delete from auth.users where id <> all (v_conservar);
  get diagnostics v_usuarios = row_count;

  -- 2. Todas las rondas que quedan (solo pueden ser de los 3) y sus solicitudes y reseñas.
  delete from public.requests;
  delete from public.tee_time_offers;
  get diagnostics v_rondas = row_count;

  -- 3. Créditos: solo queda el de bienvenida; el saldo se recalcula.
  delete from public.credit_transactions where tipo <> 'bienvenida';
  update public.profiles p
  set creditos_balance = coalesce(
        (select sum(t.monto) from public.credit_transactions t where t.user_id = p.id), 0),
      referido_pagado = false
  where p.id = any (v_conservar);

  -- 4. Sus códigos personales vuelven a cero usos.
  update public.codigos_invitacion set usos = 0 where tipo = 'usuario';

  raise notice 'Listo: % usuarios borrados, % rondas borradas.', v_usuarios, v_rondas;
end $$;

-- Resultado: deben quedar solo 3 usuarios, sin rondas.
select p.nombre, u.email, p.creditos_balance as creditos, p.is_admin,
       (select count(*) from public.tee_time_offers) as rondas_totales,
       (select count(*) from public.requests) as solicitudes_totales
from public.profiles p join auth.users u on u.id = p.id
order by p.nombre;
