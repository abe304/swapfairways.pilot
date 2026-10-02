-- Fusiona clubes del catálogo anterior que quedaron en uso (0007 no borra
-- clubes referenciados) con su equivalente del directorio nuevo: mueve
-- perfiles, accesos rápidos (profile_clubs) y ofertas, y borra el viejo.
-- Segura de correr más de una vez.

do $$
declare
  par record;
  viejo uuid;
  nuevo uuid;
begin
  for par in
    select * from (values
      ('Altozano El Nuevo Colima', 'Altozano Colima'),
      ('Asturian Center of Mexico Club Campestre Ecological', 'Centro Asturiano de México'),
      ('Club de Golf Las Lomas Zapopan', 'Club de Golf Las Lomas'),
      ('Coral Golf Resort', 'Coral Clubes Golf'),
      ('Golf Juriquilla', 'Club de Golf Juriquilla')
    ) as t (nombre_viejo, nombre_nuevo)
  loop
    select id into viejo from public.clubs where nombre = par.nombre_viejo;
    select id into nuevo from public.clubs where nombre = par.nombre_nuevo;
    -- Si falta alguno de los dos no se toca nada.
    continue when viejo is null or nuevo is null;

    update public.profiles set club_id = nuevo where club_id = viejo;
    update public.tee_time_offers set club_id = nuevo where club_id = viejo;

    insert into public.profile_clubs (profile_id, club_id, created_at)
    select profile_id, nuevo, created_at from public.profile_clubs where club_id = viejo
    on conflict do nothing;
    delete from public.profile_clubs where club_id = viejo;

    delete from public.clubs where id = viejo;
  end loop;
end $$;
