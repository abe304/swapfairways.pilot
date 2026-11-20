-- Baja de los correos de seguimiento (S1–S4, ver docs/correos-ciclo-de-vida.md).
--
--  * profiles.correos_seguimiento: true = recibe los correos de seguimiento.
--    Los correos de la ronda (T1–T8) siguen llegando aunque esté en false.
--
-- La columna NO se agrega a las que el usuario puede editar (candado de la
-- 0012). Solo la cambia el servidor con la service role, desde el enlace
-- firmado de "dejar de recibir estos correos" (/correos/baja).
--
-- Segura de correr más de una vez.

alter table public.profiles
  add column if not exists correos_seguimiento boolean not null default true;
