-- PASO 1 (solo lectura, no borra nada): revisa qué se va a conservar y qué se va a borrar.
-- Córrelo en Supabase → SQL Editor y revisa el resultado antes del PASO 2.
--
-- Se conservan las cuentas de quienes recibieron estos códigos de fundador:
--   SWF-SSER5R (Druso Huerta) · SWF-2VAMQV (Iván Betancourt) · SWF-6YX8QK (Abraham González)
-- Se reconocen por el correo al que se mandó el código o porque se registraron con él.

with codigos(codigo) as (
  values ('SWF-SSER5R'), ('SWF-2VAMQV'), ('SWF-6YX8QK')
),
conservar as (
  select u.id
  from auth.users u
  where lower(u.email) in (
          select lower(ci.email) from public.codigos_invitacion ci
          where ci.codigo in (select codigo from codigos) and ci.email is not null)
     or u.id in (
          select p.id from public.profiles p
          where p.codigo_usado in (select codigo from codigos))
)
select
  case when u.id in (select id from conservar) then 'CONSERVAR (se borran sus rondas)' else 'BORRAR TODO' end as accion,
  p.nombre,
  u.email,
  p.creditos_balance as creditos,
  (select count(*) from public.tee_time_offers o where o.host_id = u.id) as rondas_publicadas,
  (select count(*) from public.requests r where r.guest_id = u.id) as solicitudes,
  u.created_at::date as registro
from auth.users u
left join public.profiles p on p.id = u.id
order by accion, u.created_at;
