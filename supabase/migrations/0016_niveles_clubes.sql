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
-- Nivel, acceso y tipo de cada club según la evaluación revisada (hoja
-- "Evaluación de clubes" en Google Drive; última revisión: 2026-11-11).
-- Tipo: PRIVADO = solo se entra con un socio; PÚBLICO = se reserva directo
-- con el club pagando green fee, sin salir con un socio.
update public.clubs c
set nivel = v.nivel, acceso = v.acceso, tipo = v.tipo
from (values
    ('Alamo Country Club', 'gold', 'pase', 'privado'),
    ('Altozano Colima', 'gold', 'green_fee', 'publico'),
    ('Amanali Country Club', 'gold', 'abierto', 'publico'),
    ('Asociación Deportiva Minatitlán', 'silver', 'pase', 'privado'),
    ('Atlas Country Club', 'gold', 'pase', 'privado'),
    ('Ayamonte Golf Club', 'gold', 'pase', 'privado'),
    ('Azul Talavera Country Club', 'gold', 'pase', 'privado'),
    ('Baja Country Club', 'silver', 'green_fee', 'privado'),
    ('Balvanera Golf y Polo Country Club', 'gold', 'abierto', 'publico'),
    ('Bosque Real Country Club', 'premium', 'pase', 'privado'),
    ('Bosque Real Ejecutivo', 'silver', 'abierto', 'publico'),
    ('CCC Playa Palmas Country Club', 'silver', 'abierto', 'publico'),
    ('Cabo Real Golf Club', 'gold', 'green_fee', 'publico'),
    ('Cabo San Lucas Country Club', 'gold', 'green_fee', 'privado'),
    ('Cabo del Sol Golf Course', 'gold', 'green_fee', 'publico'),
    ('Campestre Cocoyoc', 'silver', 'green_fee', 'publico'),
    ('Campestre Gómez Palacio', 'gold', 'pase', 'privado'),
    ('Campo Mitico Cola de Lagarto', 'gold', 'pase', 'privado'),
    ('Campo de Golf  "Las Dalias" Cuemanco', 'silver', 'abierto', 'privado'),
    ('Campo de Golf Ciudad del Sol', 'silver', 'abierto', 'privado'),
    ('Campo de Golf Ensueño', 'gold', 'pase', 'privado'),
    ('Campo de Golf Moctezuma', 'gold', 'pase', 'privado'),
    ('Campo de Golf Municipal Celaya', 'silver', 'abierto', 'privado'),
    ('Campo de Golf Nauka', 'silver', 'green_fee', 'privado'),
    ('Campo de Golf Palma Real Ixtapa', 'silver', 'green_fee', 'privado'),
    ('Campo de Golf Rancho Santa Monica', 'gold', 'pase', 'privado'),
    ('Campo de Golf de la Marina', 'silver', 'pase', 'privado'),
    ('Cancun Golf Club at Pok Ta Pok', 'silver', 'abierto', 'publico'),
    ('Centro Asturiano de México', 'gold', 'pase', 'privado'),
    ('Chileno Golf Course', 'premium', 'pase', 'privado'),
    ('Chula Vista Country Club', 'gold', 'pase', 'privado'),
    ('Club Altozano El Nuevo Tabasco', 'gold', 'pase', 'privado'),
    ('Club Altozano Morelia', 'gold', 'pase', 'privado'),
    ('Club Campestre Celaya', 'gold', 'pase', 'privado'),
    ('Club Campestre Chiluca', 'gold', 'pase', 'privado'),
    ('Club Campestre Coatzacoalcos', 'silver', 'abierto', 'publico'),
    ('Club Campestre Cordobes', 'gold', 'pase', 'privado'),
    ('Club Campestre El Campanario', 'gold', 'pase', 'privado'),
    ('Club Campestre El Saucito', 'gold', 'pase', 'privado'),
    ('Club Campestre Juárez', 'gold', 'pase', 'privado'),
    ('Club Campestre Los Lagos', 'gold', 'pase', 'privado'),
    ('Club Campestre Lourdes', 'gold', 'pase', 'privado'),
    ('Club Campestre Mazatlán', 'gold', 'pase', 'privado'),
    ('Club Campestre Morelia', 'gold', 'pase', 'privado'),
    ('Club Campestre Nayar', 'gold', 'pase', 'privado'),
    ('Club Campestre Nuevo Laredo', 'gold', 'pase', 'privado'),
    ('Club Campestre Reynosa', 'gold', 'pase', 'privado'),
    ('Club Campestre Riama', 'gold', 'pase', 'privado'),
    ('Club Campestre San José', 'gold', 'green_fee', 'publico'),
    ('Club Campestre Tampico', 'gold', 'pase', 'privado'),
    ('Club Campestre Tijuana', 'gold', 'pase', 'privado'),
    ('Club Campestre Tuxtla Gutierrez Granjas', 'gold', 'pase', 'privado'),
    ('Club Campestre Victoria', 'gold', 'pase', 'privado'),
    ('Club Campestre Villahermosa', 'gold', 'pase', 'privado'),
    ('Club Campestre de Aguascalientes', 'gold', 'pase', 'privado'),
    ('Club Campestre de Chihuahua', 'gold', 'pase', 'privado'),
    ('Club Campestre de Culiacán', 'gold', 'pase', 'privado'),
    ('Club Campestre de Durango', 'gold', 'pase', 'privado'),
    ('Club Campestre de Hermosillo', 'gold', 'pase', 'privado'),
    ('Club Campestre de León', 'gold', 'pase', 'privado'),
    ('Club Campestre de Mexicali', 'silver', 'abierto', 'publico'),
    ('Club Campestre de Monterrey', 'premium', 'pase', 'privado'),
    ('Club Campestre de Mérida', 'gold', 'pase', 'privado'),
    ('Club Campestre de Puebla', 'gold', 'pase', 'privado'),
    ('Club Campestre de Querétaro', 'gold', 'pase', 'privado'),
    ('Club Campestre de Saltillo', 'gold', 'pase', 'privado'),
    ('Club Campestre de San Luis', 'gold', 'pase', 'privado'),
    ('Club Campestre de la Ciudad de México', 'premium', 'pase', 'privado'),
    ('Club De Golf Alquerias', 'gold', 'pase', 'privado'),
    ('Club De Golf Guamúchil', 'silver', 'pase', 'privado'),
    ('Club Deportivo Campestre Torreón', 'gold', 'pase', 'privado'),
    ('Club Golf Agrario', 'silver', 'pase', 'privado'),
    ('Club Refinería Francisco I. Madero', 'silver', 'pase', 'privado'),
    ('Club Santa Anita', 'premium', 'pase', 'privado'),
    ('Club de Golf Acapulco', 'silver', 'abierto', 'publico'),
    ('Club de Golf Bellavista', 'gold', 'pase', 'privado'),
    ('Club de Golf Bosques', 'gold', 'pase', 'privado'),
    ('Club de Golf Campestre Salina Cruz', 'silver', 'pase', 'privado'),
    ('Club de Golf Cañada de Santa Fe', 'gold', 'pase', 'privado'),
    ('Club de Golf Chapultepec', 'premium', 'pase', 'privado'),
    ('Club de Golf Ciudad Obregón', 'gold', 'pase', 'privado'),
    ('Club de Golf Covadonga Valles', 'gold', 'pase', 'privado'),
    ('Club de Golf Cuernavaca', 'gold', 'pase', 'privado'),
    ('Club de Golf El Copal', 'silver', 'abierto', 'publico'),
    ('Club de Golf El Valle', 'silver', 'abierto', 'publico'),
    ('Club de Golf Hacienda San Gaspar', 'gold', 'abierto', 'publico'),
    ('Club de Golf Hacienda Soltepec', 'silver', 'abierto', 'publico'),
    ('Club de Golf Izar', 'gold', 'pase', 'privado'),
    ('Club de Golf Juriquilla', 'gold', 'pase', 'privado'),
    ('Club de Golf La Hacienda', 'gold', 'pase', 'privado'),
    ('Club de Golf La Hacienda de León', 'gold', 'pase', 'privado'),
    ('Club de Golf La Herradura', 'gold', 'pase', 'privado'),
    ('Club de Golf La Primavera', 'gold', 'pase', 'privado'),
    ('Club de Golf La Purisima', 'silver', 'abierto', 'publico'),
    ('Club de Golf Lagunas de Miralta', 'gold', 'pase', 'privado'),
    ('Club de Golf Las Aves', 'gold', 'pase', 'privado'),
    ('Club de Golf Las Fuentes', 'gold', 'pase', 'privado'),
    ('Club de Golf Las Lomas', 'gold', 'green_fee', 'privado'),
    ('Club de Golf Los Encinos', 'gold', 'pase', 'privado'),
    ('Club de Golf Los Naranjos', 'gold', 'pase', 'privado'),
    ('Club de Golf Los Tabachines', 'gold', 'green_fee', 'publico'),
    ('Club de Golf Malanquin', 'gold', 'abierto', 'publico'),
    ('Club de Golf Malinalco', 'gold', 'pase', 'privado'),
    ('Club de Golf Monterreal', 'gold', 'pase', 'privado'),
    ('Club de Golf México', 'premium', 'pase', 'privado'),
    ('Club de Golf Pachuca', 'gold', 'pase', 'privado'),
    ('Club de Golf Providencia', 'gold', 'pase', 'privado'),
    ('Club de Golf Pulgas Pandas', 'silver', 'abierto', 'privado'),
    ('Club de Golf Punta Tiburon', 'gold', 'pase', 'privado'),
    ('Club de Golf Rancho Viejo', 'gold', 'pase', 'privado'),
    ('Club de Golf Real de Catorce', 'gold', 'pase', 'privado'),
    ('Club de Golf San Carlos', 'gold', 'pase', 'privado'),
    ('Club de Golf San Gil', 'gold', 'abierto', 'publico'),
    ('Club de Golf Sanford', 'gold', 'pase', 'privado'),
    ('Club de Golf Santa Fe', 'silver', 'abierto', 'publico'),
    ('Club de Golf Santa Gertrudis', 'silver', 'abierto', 'publico'),
    ('Club de Golf Santa Margarita', 'gold', 'pase', 'privado'),
    ('Club de Golf Tequisquiapan', 'silver', 'abierto', 'publico'),
    ('Club de Golf Tres Marías', 'gold', 'pase', 'privado'),
    ('Club de Golf Tres Vidas Acapulco', 'premium', 'pase', 'privado'),
    ('Club de Golf Valle Escondido', 'gold', 'pase', 'privado'),
    ('Club de Golf Valle Imperial', 'silver', 'abierto', 'privado'),
    ('Club de Golf Villa Rica', 'silver', 'abierto', 'publico'),
    ('Club de Golf Vista Hermosa', 'silver', 'abierto', 'publico'),
    ('Club de Golf Xalapa', 'silver', 'abierto', 'publico'),
    ('Club de Golf Zacatecas', 'gold', 'pase', 'privado'),
    ('Club de Golf de Colima', 'gold', 'pase', 'privado'),
    ('Club de Golf de Yucatan', 'gold', 'pase', 'privado'),
    ('Club de Golf el Socorro', 'gold', 'pase', 'privado'),
    ('Club de Golf la Huerta', 'gold', 'pase', 'privado'),
    ('Coral Clubes Golf', 'gold', 'abierto', 'publico'),
    ('Country Club Los Mochis', 'gold', 'pase', 'privado'),
    ('Country Club de Chapala', 'gold', 'pase', 'privado'),
    ('Country Club de Culiacán', 'gold', 'pase', 'privado'),
    ('Cozumel Country Club', 'gold', 'green_fee', 'privado'),
    ('Delicias Country Club', 'gold', 'pase', 'privado'),
    ('Docepiedras Golf and Wine Club', 'silver', 'green_fee', 'publico'),
    ('Edén Los Sabinos', 'gold', 'pase', 'privado'),
    ('El Bosque Country Club', 'gold', 'pase', 'privado'),
    ('El Camaleón Mayakoba Golf Course', 'gold', 'green_fee', 'publico'),
    ('El Cardonal Diamante Cabo San Lucas', 'premium', 'green_fee', 'publico'),
    ('El Cid Golf & Country Club', 'silver', 'green_fee', 'privado'),
    ('El Cielo Country Club', 'gold', 'abierto', 'publico'),
    ('El Corazon Golf Club', 'gold', 'pase', 'privado'),
    ('El Cristo Golf & Country Club', 'gold', 'pase', 'privado'),
    ('El Delfín Golf Course', 'gold', 'pase', 'privado'),
    ('El Dorado Golf Course', 'premium', 'pase', 'privado'),
    ('El Encino Residencial & Golf', 'gold', 'pase', 'privado'),
    ('El Molino Residencial y Golf', 'gold', 'pase', 'privado'),
    ('El Río Country Club', 'gold', 'abierto', 'publico'),
    ('El Tamarindo Golf Course', 'gold', 'green_fee', 'publico'),
    ('El Tigre Golf Club', 'gold', 'green_fee', 'publico'),
    ('El Tinto Golf Course', 'gold', 'green_fee', 'publico'),
    ('Estrella del Mar Golf y Country Club', 'silver', 'green_fee', 'publico'),
    ('Fairmont Acapulco Princess Golf Club', 'silver', 'green_fee', 'publico'),
    ('Flamingos Club de Golf', 'silver', 'green_fee', 'privado'),
    ('Golf & Residencial Alamo Grande', 'gold', 'pase', 'privado'),
    ('Golf Country Club Tapalpa', 'gold', 'pase', 'privado'),
    ('Golf Course Marina Mazatlán', 'silver', 'green_fee', 'privado'),
    ('Gran Coyote Golf', 'gold', 'green_fee', 'publico'),
    ('Gran Reserva Golf Resort & Country Club', 'silver', 'abierto', 'publico'),
    ('Grand Isla Navidad Resort Country Club', 'gold', 'green_fee', 'publico'),
    ('Guadalajara Country Club', 'premium', 'pase', 'privado'),
    ('Hacienda Bajamar Golf', 'silver', 'green_fee', 'privado'),
    ('Hacienda Cantalagua Club de Golf', 'gold', 'pase', 'privado'),
    ('Hard Rock Golf Club Riviera Maya', 'silver', 'green_fee', 'publico'),
    ('Higuera Golf Course', 'gold', 'pase', 'privado'),
    ('Hotel Avandaro - Club de Golf', 'gold', 'green_fee', 'publico'),
    ('Iberostar Cancun Golf Club', 'silver', 'green_fee', 'publico'),
    ('Iberostar Playa Paraíso Golf Club', 'silver', 'green_fee', 'publico'),
    ('Jade Aak-Bal Golf Club', 'gold', 'pase', 'privado'),
    ('La Esmeralda Country Club', 'gold', 'pase', 'privado'),
    ('La Loma Residencial & Club de Golf', 'gold', 'pase', 'privado'),
    ('La Vista Country Club', 'gold', 'pase', 'privado'),
    ('Las Caras de Mexico', 'gold', 'pase', 'privado'),
    ('Las Cañadas Country Club', 'gold', 'pase', 'privado'),
    ('Las Cruces Golf & Country Club', 'gold', 'pase', 'privado'),
    ('Las Hadas Golf & Country Club', 'silver', 'green_fee', 'publico'),
    ('Las Huertas Golf Club', 'gold', 'pase', 'privado'),
    ('Las Lomas Habitat + Golf', 'gold', 'pase', 'privado'),
    ('Las Maravillas Campo Escuela de Golf', 'silver', 'abierto', 'publico'),
    ('Las Misiones Club Campestre', 'gold', 'pase', 'privado'),
    ('Las Parotas Club de Golf', 'gold', 'pase', 'privado'),
    ('Las Riberas', 'gold', 'pase', 'privado'),
    ('Lomas Country Club', 'premium', 'pase', 'privado'),
    ('Loreto Bay Golf Course', 'silver', 'green_fee', 'publico'),
    ('Madeiras Country Club', 'gold', 'abierto', 'publico'),
    ('Mandarina Golf Club', 'gold', 'green_fee', 'publico'),
    ('Marina Ixtapa Náutica Golf Course', 'silver', 'green_fee', 'privado'),
    ('Marina Vallarta Golf Club', 'silver', 'green_fee', 'publico'),
    ('Montetaxco Hotel & Resort', 'silver', 'green_fee', 'publico'),
    ('Moon Palace Golf & Spa', 'gold', 'green_fee', 'publico'),
    ('Nicklaus Design Golf Course at Vidanta Riviera Maya', 'gold', 'green_fee', 'publico'),
    ('Palmilla Golf Club', 'gold', 'green_fee', 'publico'),
    ('Paradisus Cancun Golf Club', 'silver', 'green_fee', 'publico'),
    ('Paraiso Country Club', 'gold', 'abierto', 'publico'),
    ('Paraiso del Mar Golf Club', 'silver', 'green_fee', 'publico'),
    ('Playa Mujeres Golf Club', 'gold', 'green_fee', 'privado'),
    ('Provincia Golf', 'gold', 'pase', 'privado'),
    ('Puerta Cortes Golf Club', 'gold', 'green_fee', 'publico'),
    ('Puerto Aventuras Golf y Racquet Club', 'silver', 'green_fee', 'publico'),
    ('Puerto Cancun Golf Club', 'gold', 'green_fee', 'privado'),
    ('Puerto Los Cabos Golf Course', 'gold', 'green_fee', 'publico'),
    ('Punta Mita Club de Golf Bahia', 'premium', 'pase', 'privado'),
    ('Punta Mita Club de Golf Pacifico', 'premium', 'pase', 'privado'),
    ('Querencia Golf Club', 'premium', 'pase', 'privado'),
    ('Quivira Golf Club', 'premium', 'green_fee', 'publico'),
    ('Rancho Avándaro Country Club', 'gold', 'green_fee', 'publico'),
    ('Rancho Contento Golf Course', 'gold', 'pase', 'privado'),
    ('Real del Bosque', 'silver', 'abierto', 'publico'),
    ('Real del Mar Hotel & Golf Resort', 'silver', 'green_fee', 'publico'),
    ('Rincón del Montero', 'gold', 'pase', 'privado'),
    ('Riviera Cancun Golf Club', 'gold', 'green_fee', 'publico'),
    ('San Francisco Country Club', 'gold', 'pase', 'privado'),
    ('San Gabriel Campestre', 'gold', 'pase', 'privado'),
    ('Santa Sofía Country Club Golf', 'silver', 'abierto', 'publico'),
    ('Santiago Country Club', 'silver', 'abierto', 'publico'),
    ('Solmar Golf Links', 'gold', 'green_fee', 'publico'),
    ('TPC Danzante Bay Golf at the Islands of Loreto', 'gold', 'green_fee', 'publico'),
    ('Tajin Club de Golf', 'gold', 'pase', 'privado'),
    ('Terralta Golf & Country Club', 'gold', 'pase', 'privado'),
    ('The Club at Islas del Mar', 'silver', 'green_fee', 'publico'),
    ('The Costa Palmas Golf Club Four Seasons', 'premium', 'green_fee', 'publico'),
    ('The Lake Golf Range', 'silver', 'abierto', 'publico'),
    ('The Links Golf Course at Las Palomas', 'silver', 'green_fee', 'publico'),
    ('The Nayar Course at Vidanta Nuevo Vallarta', 'gold', 'green_fee', 'publico'),
    ('The Springs Golf Club', 'gold', 'pase', 'privado'),
    ('Tierra Dorada Golf Club', 'gold', 'pase', 'privado'),
    ('Turtle Dunes Country Club', 'gold', 'pase', 'privado'),
    ('Twin Dolphin Golf Club', 'gold', 'green_fee', 'publico'),
    ('Valle Alto Golf Club', 'premium', 'pase', 'privado'),
    ('Ventanas de San Miguel', 'gold', 'pase', 'privado'),
    ('Vidanta Golf Course at Vidanta Acapulco', 'silver', 'green_fee', 'publico'),
    ('Vidanta Golf Puerto Peñasco', 'silver', 'green_fee', 'publico'),
    ('Vidanta Golf at Vidanta Los Cabos', 'gold', 'green_fee', 'publico'),
    ('Vidanta Vallarta Course', 'gold', 'green_fee', 'publico'),
    ('Villaseca Hotel Spa Golf', 'silver', 'green_fee', 'publico'),
    ('Vista Vallarta Nicklaus Club de Golf', 'gold', 'green_fee', 'privado'),
    ('Vista Vallarta Weiskopf Club de Golf', 'gold', 'green_fee', 'privado'),
    ('Vista Verde Country Club Tehuacan', 'gold', 'pase', 'privado'),
    ('Yucatán Country Club – El Jaguar', 'premium', 'pase', 'privado'),
    ('Zibatá Golf Club', 'silver', 'green_fee', 'publico'),
    ('Zirandaro Residencial & Golf', 'gold', 'pase', 'privado')
) as v (nombre, nivel, acceso, tipo)
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
