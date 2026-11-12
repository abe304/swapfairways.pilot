-- 0016: Niveles de club (Premium / Gold / Silver) y modalidad de acceso.
--
-- - clubs.nivel: cuánto vale una salida. Fija costo_creditos:
--   Premium = 3, Gold = 2, Silver = 1.
-- - clubs.acceso: cómo entra un invitado.
--     pase      → el socio invita con un pase del club.
--     green_fee → acepta invitados pero se paga por jugar (ej. Las Lomas, resorts).
--     abierto   → cualquiera puede reservar un tee time.
-- - tee_time_offers.green_fee_paga: en clubes green_fee/abierto, quién paga
--   el green fee en esa oferta. Si lo paga el invitado la ronda cuesta 1
--   crédito; si lo cubre el anfitrión, cuesta lo del nivel del club.
-- - Fusiona los duplicados confirmados en la revisión del directorio y quita
--   "Club Campestre de Guadalajara" (no existe).
--
-- Segura de correr más de una vez.

alter table public.clubs
  add column if not exists nivel text not null default 'gold'
    check (nivel in ('premium', 'gold', 'silver')),
  add column if not exists acceso text not null default 'pase'
    check (acceso in ('pase', 'green_fee', 'abierto'));

alter table public.tee_time_offers
  add column if not exists green_fee_paga text
    check (green_fee_paga in ('anfitrion', 'invitado'));

-- ---------------------------------------------------------------------------
-- Duplicados: mueve perfiles, accesos rápidos, ofertas y documentos al club
-- que se conserva, copia coordenadas/foto si le faltan, borra el duplicado y,
-- si aplica, renombra el que se conserva.
do $$
declare
  par record;
  v_keep uuid;
  v_drop uuid;
begin
  for par in
    select * from (values
      ('Atlas Golf Club', 'Atlas Country Club', 'Atlas Country Club'),
      ('Club Campestre Tijuana', 'Club Campestre de Tijuana', null),
      ('Yucatán Country Club', 'Yucatan Country Club El Jaguar', 'Yucatán Country Club – El Jaguar'),
      ('Club de Golf Bellavista', 'Bellavista Golf & Country Club', null),
      ('Valle Alto Golf Club', 'Club de Golf Valle Alto', null),
      ('Bosque Real Ejecutivo', 'Bosque Real Campo Ejecutivo', null),
      ('Estrella del Mar Golf y Country Club', 'Club Estrella del Mar', null),
      ('Club de Golf Vista Hermosa', 'Vistahermosa Club de Golf', null),
      ('Puerto Aventuras Golf y Racquet Club', 'Campo de Golf Puerto Aventuras & Tenis', null),
      ('Hotel Avandaro - Rancho Avandaro', 'Rancho Avandaro Country', 'Rancho Avándaro Country Club')
    ) as t (nombre_keep, nombre_drop, nombre_final)
  loop
    select id into v_keep from public.clubs where nombre = par.nombre_keep;
    select id into v_drop from public.clubs where nombre = par.nombre_drop;

    if v_keep is not null and v_drop is not null then
      update public.profiles set club_id = v_keep where club_id = v_drop;
      update public.tee_time_offers set club_id = v_keep where club_id = v_drop;
      update public.club_documentos set club_id = v_keep where club_id = v_drop;

      insert into public.profile_clubs (profile_id, club_id, created_at)
      select profile_id, v_keep, created_at from public.profile_clubs where club_id = v_drop
      on conflict do nothing;
      delete from public.profile_clubs where club_id = v_drop;

      update public.clubs k set
        latitud = coalesce(k.latitud, d.latitud),
        longitud = coalesce(k.longitud, d.longitud),
        foto_url = coalesce(k.foto_url, d.foto_url),
        ciudad = coalesce(nullif(k.ciudad, ''), d.ciudad)
      from public.clubs d
      where k.id = v_keep and d.id = v_drop;

      delete from public.clubs where id = v_drop;
    end if;

    if v_keep is not null and par.nombre_final is not null
       and not exists (select 1 from public.clubs where nombre = par.nombre_final) then
      update public.clubs set nombre = par.nombre_final where id = v_keep;
    end if;
  end loop;
end $$;

-- "Club Campestre de Guadalajara" no existe. Se borra solo si no tiene
-- ofertas (las ofertas no permiten borrar su club); perfiles y accesos
-- rápidos se limpian solos por sus llaves foráneas.
delete from public.clubs c
where c.nombre = 'Club Campestre de Guadalajara'
  and not exists (select 1 from public.tee_time_offers o where o.club_id = c.id);

-- ---------------------------------------------------------------------------
-- Nivel y acceso de cada club según la evaluación revisada.
update public.clubs c
set nivel = v.nivel, acceso = v.acceso
from (values
    ('Alamo Country Club', 'gold', 'pase'),
    ('Altozano Colima', 'gold', 'pase'),
    ('Amanali Country Club', 'gold', 'abierto'),
    ('Asociación Deportiva Minatitlán', 'silver', 'pase'),
    ('Atlas Country Club', 'gold', 'pase'),
    ('Ayamonte Golf Club', 'gold', 'pase'),
    ('Azul Talavera Country Club', 'gold', 'pase'),
    ('Baja Country Club', 'silver', 'green_fee'),
    ('Balvanera Golf y Polo Country Club', 'gold', 'abierto'),
    ('Bosque Real Country Club', 'premium', 'pase'),
    ('Bosque Real Ejecutivo', 'silver', 'abierto'),
    ('CCC Playa Palmas Country Club', 'silver', 'abierto'),
    ('Cabo Real Golf Club', 'gold', 'green_fee'),
    ('Cabo San Lucas Country Club', 'gold', 'green_fee'),
    ('Cabo del Sol Golf Course', 'gold', 'green_fee'),
    ('Campestre Cocoyoc', 'silver', 'green_fee'),
    ('Campestre Gómez Palacio', 'gold', 'pase'),
    ('Campo Mitico Cola de Lagarto', 'gold', 'pase'),
    ('Campo de Golf  "Las Dalias" Cuemanco', 'silver', 'abierto'),
    ('Campo de Golf Ciudad del Sol', 'silver', 'abierto'),
    ('Campo de Golf Ensueño', 'gold', 'pase'),
    ('Campo de Golf Moctezuma', 'gold', 'pase'),
    ('Campo de Golf Municipal Celaya', 'silver', 'abierto'),
    ('Campo de Golf Nauka', 'silver', 'green_fee'),
    ('Campo de Golf Palma Real Ixtapa', 'silver', 'green_fee'),
    ('Campo de Golf Rancho Santa Monica', 'gold', 'pase'),
    ('Campo de Golf de la Marina', 'silver', 'pase'),
    ('Cancun Golf Club at Pok Ta Pok', 'silver', 'abierto'),
    ('Centro Asturiano de México', 'gold', 'pase'),
    ('Chileno Golf Course', 'premium', 'pase'),
    ('Chula Vista Country Club', 'gold', 'pase'),
    ('Club Altozano El Nuevo Tabasco', 'gold', 'pase'),
    ('Club Altozano Morelia', 'gold', 'pase'),
    ('Club Campestre Celaya', 'gold', 'pase'),
    ('Club Campestre Chiluca', 'gold', 'pase'),
    ('Club Campestre Coatzacoalcos', 'silver', 'abierto'),
    ('Club Campestre Cordobes', 'gold', 'pase'),
    ('Club Campestre El Campanario', 'gold', 'pase'),
    ('Club Campestre El Saucito', 'gold', 'pase'),
    ('Club Campestre Juárez', 'gold', 'pase'),
    ('Club Campestre Los Lagos', 'gold', 'pase'),
    ('Club Campestre Lourdes', 'gold', 'pase'),
    ('Club Campestre Mazatlán', 'gold', 'pase'),
    ('Club Campestre Morelia', 'gold', 'pase'),
    ('Club Campestre Nayar', 'gold', 'pase'),
    ('Club Campestre Nuevo Laredo', 'gold', 'pase'),
    ('Club Campestre Reynosa', 'gold', 'pase'),
    ('Club Campestre Riama', 'gold', 'pase'),
    ('Club Campestre San José', 'gold', 'green_fee'),
    ('Club Campestre Tampico', 'gold', 'pase'),
    ('Club Campestre Tijuana', 'gold', 'pase'),
    ('Club Campestre Tuxtla Gutierrez Granjas', 'gold', 'pase'),
    ('Club Campestre Victoria', 'gold', 'pase'),
    ('Club Campestre Villahermosa', 'gold', 'pase'),
    ('Club Campestre de Aguascalientes', 'gold', 'pase'),
    ('Club Campestre de Chihuahua', 'gold', 'pase'),
    ('Club Campestre de Culiacán', 'gold', 'pase'),
    ('Club Campestre de Durango', 'gold', 'pase'),
    ('Club Campestre de Hermosillo', 'gold', 'pase'),
    ('Club Campestre de León', 'gold', 'pase'),
    ('Club Campestre de Mexicali', 'silver', 'abierto'),
    ('Club Campestre de Monterrey', 'premium', 'pase'),
    ('Club Campestre de Mérida', 'gold', 'pase'),
    ('Club Campestre de Puebla', 'gold', 'pase'),
    ('Club Campestre de Querétaro', 'gold', 'pase'),
    ('Club Campestre de Saltillo', 'gold', 'pase'),
    ('Club Campestre de San Luis', 'gold', 'pase'),
    ('Club Campestre de la Ciudad de México', 'premium', 'pase'),
    ('Club De Golf Alquerias', 'gold', 'pase'),
    ('Club De Golf Guamúchil', 'silver', 'pase'),
    ('Club Deportivo Campestre Torreón', 'gold', 'pase'),
    ('Club Golf Agrario', 'silver', 'pase'),
    ('Club Refinería Francisco I. Madero', 'silver', 'pase'),
    ('Club Santa Anita', 'premium', 'pase'),
    ('Club de Golf Acapulco', 'silver', 'abierto'),
    ('Club de Golf Bellavista', 'gold', 'pase'),
    ('Club de Golf Bosques', 'gold', 'pase'),
    ('Club de Golf Campestre Salina Cruz', 'silver', 'pase'),
    ('Club de Golf Cañada de Santa Fe', 'gold', 'pase'),
    ('Club de Golf Chapultepec', 'premium', 'pase'),
    ('Club de Golf Ciudad Obregón', 'gold', 'pase'),
    ('Club de Golf Covadonga Valles', 'gold', 'pase'),
    ('Club de Golf Cuernavaca', 'gold', 'pase'),
    ('Club de Golf El Copal', 'silver', 'abierto'),
    ('Club de Golf El Valle', 'silver', 'abierto'),
    ('Club de Golf Hacienda San Gaspar', 'gold', 'pase'),
    ('Club de Golf Hacienda Soltepec', 'silver', 'abierto'),
    ('Club de Golf Izar', 'gold', 'pase'),
    ('Club de Golf Juriquilla', 'gold', 'pase'),
    ('Club de Golf La Hacienda', 'gold', 'pase'),
    ('Club de Golf La Hacienda de León', 'gold', 'pase'),
    ('Club de Golf La Herradura', 'gold', 'pase'),
    ('Club de Golf La Primavera', 'gold', 'pase'),
    ('Club de Golf La Purisima', 'silver', 'abierto'),
    ('Club de Golf Lagunas de Miralta', 'gold', 'pase'),
    ('Club de Golf Las Aves', 'gold', 'pase'),
    ('Club de Golf Las Fuentes', 'gold', 'pase'),
    ('Club de Golf Las Lomas', 'gold', 'green_fee'),
    ('Club de Golf Los Encinos', 'gold', 'pase'),
    ('Club de Golf Los Naranjos', 'gold', 'pase'),
    ('Club de Golf Los Tabachines', 'gold', 'pase'),
    ('Club de Golf Malanquin', 'gold', 'abierto'),
    ('Club de Golf Malinalco', 'gold', 'pase'),
    ('Club de Golf Monterreal', 'gold', 'pase'),
    ('Club de Golf México', 'premium', 'pase'),
    ('Club de Golf Pachuca', 'gold', 'pase'),
    ('Club de Golf Providencia', 'gold', 'pase'),
    ('Club de Golf Pulgas Pandas', 'silver', 'abierto'),
    ('Club de Golf Punta Tiburon', 'gold', 'pase'),
    ('Club de Golf Rancho Viejo', 'gold', 'pase'),
    ('Club de Golf Real de Catorce', 'gold', 'pase'),
    ('Club de Golf San Carlos', 'gold', 'pase'),
    ('Club de Golf San Gil', 'gold', 'abierto'),
    ('Club de Golf Sanford', 'gold', 'pase'),
    ('Club de Golf Santa Fe', 'silver', 'abierto'),
    ('Club de Golf Santa Gertrudis', 'silver', 'abierto'),
    ('Club de Golf Santa Margarita', 'gold', 'pase'),
    ('Club de Golf Tequisquiapan', 'silver', 'abierto'),
    ('Club de Golf Tres Marías', 'gold', 'pase'),
    ('Club de Golf Tres Vidas Acapulco', 'premium', 'pase'),
    ('Club de Golf Valle Escondido', 'gold', 'pase'),
    ('Club de Golf Valle Imperial', 'silver', 'abierto'),
    ('Club de Golf Villa Rica', 'silver', 'abierto'),
    ('Club de Golf Vista Hermosa', 'silver', 'abierto'),
    ('Club de Golf Xalapa', 'silver', 'abierto'),
    ('Club de Golf Zacatecas', 'gold', 'pase'),
    ('Club de Golf de Colima', 'gold', 'pase'),
    ('Club de Golf de Yucatan', 'gold', 'pase'),
    ('Club de Golf el Socorro', 'gold', 'pase'),
    ('Club de Golf la Huerta', 'gold', 'pase'),
    ('Coral Clubes Golf', 'gold', 'pase'),
    ('Country Club Los Mochis', 'gold', 'pase'),
    ('Country Club de Chapala', 'gold', 'pase'),
    ('Country Club de Culiacán', 'gold', 'pase'),
    ('Cozumel Country Club', 'gold', 'green_fee'),
    ('Delicias Country Club', 'gold', 'pase'),
    ('Docepiedras Golf and Wine Club', 'silver', 'green_fee'),
    ('Edén Los Sabinos', 'gold', 'pase'),
    ('El Bosque Country Club', 'gold', 'pase'),
    ('El Camaleón Mayakoba Golf Course', 'gold', 'green_fee'),
    ('El Cardonal Diamante Cabo San Lucas', 'premium', 'green_fee'),
    ('El Cid Golf & Country Club', 'silver', 'green_fee'),
    ('El Cielo Country Club', 'gold', 'pase'),
    ('El Corazon Golf Club', 'gold', 'pase'),
    ('El Cristo Golf & Country Club', 'gold', 'pase'),
    ('El Delfín Golf Course', 'gold', 'pase'),
    ('El Dorado Golf Course', 'premium', 'pase'),
    ('El Encino Residencial & Golf', 'gold', 'pase'),
    ('El Molino Residencial y Golf', 'gold', 'pase'),
    ('El Río Country Club', 'gold', 'pase'),
    ('El Tamarindo Golf Course', 'gold', 'green_fee'),
    ('El Tigre Golf Club', 'gold', 'green_fee'),
    ('El Tinto Golf Course', 'gold', 'green_fee'),
    ('Estrella del Mar Golf y Country Club', 'silver', 'green_fee'),
    ('Fairmont Acapulco Princess Golf Club', 'silver', 'green_fee'),
    ('Flamingos Club de Golf', 'silver', 'green_fee'),
    ('Golf & Residencial Alamo Grande', 'gold', 'pase'),
    ('Golf Country Club Tapalpa', 'gold', 'pase'),
    ('Golf Course Marina Mazatlán', 'silver', 'green_fee'),
    ('Gran Coyote Golf', 'gold', 'green_fee'),
    ('Gran Reserva Golf Resort & Country Club', 'silver', 'abierto'),
    ('Grand Isla Navidad Resort Country Club', 'gold', 'green_fee'),
    ('Guadalajara Country Club', 'premium', 'pase'),
    ('Hacienda Bajamar Golf', 'silver', 'green_fee'),
    ('Hacienda Cantalagua Club de Golf', 'gold', 'pase'),
    ('Hard Rock Golf Club Riviera Maya', 'silver', 'green_fee'),
    ('Higuera Golf Course', 'gold', 'pase'),
    ('Hotel Avandaro - Club de Golf', 'gold', 'green_fee'),
    ('Iberostar Cancun Golf Club', 'silver', 'green_fee'),
    ('Iberostar Playa Paraíso Golf Club', 'silver', 'green_fee'),
    ('Jade Aak-Bal Golf Club', 'gold', 'pase'),
    ('La Esmeralda Country Club', 'gold', 'pase'),
    ('La Loma Residencial & Club de Golf', 'gold', 'pase'),
    ('La Vista Country Club', 'gold', 'pase'),
    ('Las Caras de Mexico', 'gold', 'pase'),
    ('Las Cañadas Country Club', 'gold', 'pase'),
    ('Las Cruces Golf & Country Club', 'gold', 'pase'),
    ('Las Hadas Golf & Country Club', 'silver', 'green_fee'),
    ('Las Huertas Golf Club', 'gold', 'pase'),
    ('Las Lomas Habitat + Golf', 'gold', 'pase'),
    ('Las Maravillas Campo Escuela de Golf', 'silver', 'abierto'),
    ('Las Misiones Club Campestre', 'gold', 'pase'),
    ('Las Parotas Club de Golf', 'gold', 'pase'),
    ('Las Riberas', 'gold', 'pase'),
    ('Lomas Country Club', 'premium', 'pase'),
    ('Loreto Bay Golf Course', 'silver', 'green_fee'),
    ('Madeiras Country Club', 'gold', 'pase'),
    ('Mandarina Golf Club', 'gold', 'green_fee'),
    ('Marina Ixtapa Náutica Golf Course', 'silver', 'green_fee'),
    ('Marina Vallarta Golf Club', 'silver', 'green_fee'),
    ('Montetaxco Hotel & Resort', 'silver', 'green_fee'),
    ('Moon Palace Golf & Spa', 'gold', 'green_fee'),
    ('Nicklaus Design Golf Course at Vidanta Riviera Maya', 'gold', 'green_fee'),
    ('Palmilla Golf Club', 'gold', 'green_fee'),
    ('Paradisus Cancun Golf Club', 'silver', 'green_fee'),
    ('Paraiso Country Club', 'gold', 'pase'),
    ('Paraiso del Mar Golf Club', 'silver', 'green_fee'),
    ('Playa Mujeres Golf Club', 'gold', 'green_fee'),
    ('Provincia Golf', 'gold', 'pase'),
    ('Puerta Cortes Golf Club', 'gold', 'green_fee'),
    ('Puerto Aventuras Golf y Racquet Club', 'silver', 'green_fee'),
    ('Puerto Cancun Golf Club', 'gold', 'green_fee'),
    ('Puerto Los Cabos Golf Course', 'gold', 'green_fee'),
    ('Punta Mita Club de Golf Bahia', 'premium', 'pase'),
    ('Punta Mita Club de Golf Pacifico', 'premium', 'pase'),
    ('Querencia Golf Club', 'premium', 'pase'),
    ('Quivira Golf Club', 'premium', 'green_fee'),
    ('Rancho Avándaro Country Club', 'gold', 'green_fee'),
    ('Rancho Contento Golf Course', 'gold', 'pase'),
    ('Real del Bosque', 'silver', 'abierto'),
    ('Real del Mar Hotel & Golf Resort', 'silver', 'green_fee'),
    ('Rincón del Montero', 'gold', 'pase'),
    ('Riviera Cancun Golf Club', 'gold', 'green_fee'),
    ('San Francisco Country Club', 'gold', 'pase'),
    ('San Gabriel Campestre', 'gold', 'pase'),
    ('Santa Sofía Country Club Golf', 'silver', 'pase'),
    ('Santiago Country Club', 'silver', 'abierto'),
    ('Solmar Golf Links', 'gold', 'green_fee'),
    ('TPC Danzante Bay Golf at the Islands of Loreto', 'gold', 'green_fee'),
    ('Tajin Club de Golf', 'gold', 'pase'),
    ('Terralta Golf & Country Club', 'gold', 'pase'),
    ('The Club at Islas del Mar', 'silver', 'green_fee'),
    ('The Costa Palmas Golf Club Four Seasons', 'premium', 'green_fee'),
    ('The Lake Golf Range', 'silver', 'abierto'),
    ('The Links Golf Course at Las Palomas', 'silver', 'green_fee'),
    ('The Nayar Course at Vidanta Nuevo Vallarta', 'gold', 'green_fee'),
    ('The Springs Golf Club', 'gold', 'pase'),
    ('Tierra Dorada Golf Club', 'gold', 'pase'),
    ('Turtle Dunes Country Club', 'gold', 'pase'),
    ('Twin Dolphin Golf Club', 'gold', 'green_fee'),
    ('Valle Alto Golf Club', 'premium', 'pase'),
    ('Ventanas de San Miguel', 'gold', 'pase'),
    ('Vidanta Golf Course at Vidanta Acapulco', 'silver', 'green_fee'),
    ('Vidanta Golf Puerto Peñasco', 'silver', 'green_fee'),
    ('Vidanta Golf at Vidanta Los Cabos', 'gold', 'green_fee'),
    ('Vidanta Vallarta Course', 'gold', 'green_fee'),
    ('Villaseca Hotel Spa Golf', 'silver', 'green_fee'),
    ('Vista Vallarta Nicklaus Club de Golf', 'gold', 'green_fee'),
    ('Vista Vallarta Weiskopf Club de Golf', 'gold', 'green_fee'),
    ('Vista Verde Country Club Tehuacan', 'gold', 'pase'),
    ('Yucatán Country Club – El Jaguar', 'premium', 'pase'),
    ('Zibatá Golf Club', 'silver', 'green_fee'),
    ('Zirandaro Residencial & Golf', 'gold', 'pase')
) as v (nombre, nivel, acceso)
where c.nombre = v.nombre;

-- Créditos por ronda según el nivel (todos los clubes, incluidos los que se
-- hayan agregado a mano y quedaron con el valor por defecto 'gold').
update public.clubs
set costo_creditos = case nivel when 'premium' then 3 when 'gold' then 2 else 1 end;

-- ---------------------------------------------------------------------------
-- create_join_request: en clubes con green fee o abiertos, si el invitado
-- paga el green fee la ronda cuesta 1 crédito; si lo cubre el anfitrión (o
-- el club es de pase), cuesta lo del nivel del club.
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

  select costo_creditos, acceso into v_costo, v_acceso from public.clubs where id = v_offer.club_id;
  v_costo := coalesce(v_costo, 1);
  if coalesce(v_acceso, 'pase') <> 'pase' and coalesce(v_offer.green_fee_paga, 'invitado') = 'invitado' then
    v_costo := 1;
  end if;

  select creditos_balance into v_balance from public.profiles where id = v_guest_id;
  if v_balance < v_costo then
    raise exception 'No tienes créditos suficientes para solicitar esta ronda (cuesta % créditos)', v_costo;
  end if;

  insert into public.requests (offer_id, guest_id, estado, creditos_cobrados)
  values (p_offer_id, v_guest_id, 'pendiente', v_costo)
  returning * into v_request;

  return v_request;
end;
$$;
