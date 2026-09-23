-- Limpieza de clubes duplicados.
--
-- Causa más probable: 0002_clubs_mexico.sql se corrió más de una vez en el
-- SQL Editor (el INSERT no tenía protección contra eso), insertando cada
-- club otra vez con un id nuevo. Esto deduplica CUALQUIER club cuyo
-- nombre se repita — sin importar cuántas veces — conservando la fila
-- más antigua y reasignando ofertas/perfiles que ya apunten a las
-- duplicadas antes de borrarlas. Es seguro correr esto más de una vez.
do $$
declare
  r record;
  v_keep_id uuid;
begin
  for r in
    select nombre
    from public.clubs
    group by nombre
    having count(*) > 1
  loop
    select id into v_keep_id
    from public.clubs
    where nombre = r.nombre
    order by created_at asc
    limit 1;

    update public.tee_time_offers
    set club_id = v_keep_id
    where club_id in (select id from public.clubs where nombre = r.nombre and id <> v_keep_id);

    update public.profiles
    set club_id = v_keep_id
    where club_id in (select id from public.clubs where nombre = r.nombre and id <> v_keep_id);

    delete from public.clubs
    where nombre = r.nombre and id <> v_keep_id;
  end loop;
end $$;

-- Además, dos clubes con nombres DISTINTOS pero que son el mismo campo
-- real (uno de gogolf.mx, otro de la Federación Mexicana de Golf, con
-- coordenadas idénticas o casi idénticas):
do $$
declare
  v_keep_id uuid;
  v_dup_id uuid;
begin
  select id into v_keep_id from public.clubs where nombre = 'El Cortés Golf Club' limit 1;
  select id into v_dup_id from public.clubs where nombre = 'Gary Player Signature Golf Club El Cortés' limit 1;
  if v_keep_id is not null and v_dup_id is not null then
    update public.tee_time_offers set club_id = v_keep_id where club_id = v_dup_id;
    update public.profiles set club_id = v_keep_id where club_id = v_dup_id;
    delete from public.clubs where id = v_dup_id;
  end if;

  select id into v_keep_id from public.clubs where nombre = 'Balvanera Golf y Polo Country Club' limit 1;
  select id into v_dup_id from public.clubs where nombre = 'Balvanera Polo Golf & Country Club' limit 1;
  if v_keep_id is not null and v_dup_id is not null then
    update public.tee_time_offers set club_id = v_keep_id where club_id = v_dup_id;
    update public.profiles set club_id = v_keep_id where club_id = v_dup_id;
    delete from public.clubs where id = v_dup_id;
  end if;
end $$;

update public.clubs
set latitud = 20.540511, longitud = -100.469651
where nombre = 'Balvanera Golf y Polo Country Club' and latitud is null;

-- Evita que esto vuelva a pasar si alguien corre una migración de clubes
-- dos veces por error.
alter table public.clubs add constraint clubs_nombre_unique unique (nombre);
