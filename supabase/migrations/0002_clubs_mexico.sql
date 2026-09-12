-- Catálogo de campos de golf de México para poder anfitrionar en cualquiera
-- de ellos, con dirección conectada a Google Maps.
--
-- tipo 'publico': los 36 campos registrados en gogolf.mx (plataforma de
-- reserva pay-and-play), con dirección exacta tal como la publican ellos.
-- tipo 'privado': ~25 clubes de golf de membresía conocidos en México — el
-- segmento al que realmente aplica el intercambio de tee times entre
-- socios. La dirección de estos es una cadena de búsqueda (nombre + ciudad
-- + estado), no una dirección postal verificada — corrígela en esta tabla
-- vía Supabase Studio si necesitas precisión exacta antes del piloto real.
--
-- Ver lib/data/clubs-mexico.ts — es la fuente de la que se generó este
-- INSERT (también se usa ahí para el modo demo y el seed de prueba).

alter table public.clubs
  add column if not exists estado text,
  add column if not exists direccion text,
  add column if not exists tipo text not null default 'privado' check (tipo in ('privado', 'publico'));

insert into public.clubs (nombre, ciudad, estado, direccion, tipo) values
  ('Club de Golf México', 'Ciudad de México', 'Ciudad de México', 'Club de Golf México, Ciudad de México, CDMX, México', 'privado'),
  ('Club Campestre de la Ciudad de México', 'Ciudad de México', 'Ciudad de México', 'Club Campestre de la Ciudad de México, Tlalpan, CDMX, México', 'privado'),
  ('Club de Golf Chapultepec', 'Naucalpan de Juárez', 'Estado de México', 'Club de Golf Chapultepec, Naucalpan de Juárez, Estado de México, México', 'privado'),
  ('Bosque Real Country Club', 'Huixquilucan', 'Estado de México', 'Bosque Real Country Club, Huixquilucan, Estado de México, México', 'privado'),
  ('Lomas Country Club', 'Huixquilucan', 'Estado de México', 'Lomas Country Club, Huixquilucan, Estado de México, México', 'privado'),
  ('Club de Golf Bellavista', 'Atizapán de Zaragoza', 'Estado de México', 'Club de Golf Bellavista, Atizapán de Zaragoza, Estado de México, México', 'privado'),
  ('Hacienda de Valle Escondido', 'Atizapán de Zaragoza', 'Estado de México', 'Hacienda de Valle Escondido, Atizapán de Zaragoza, Estado de México, México', 'privado'),
  ('Club de Golf La Hacienda', 'Atizapán de Zaragoza', 'Estado de México', 'Club de Golf La Hacienda, Atizapán de Zaragoza, Estado de México, México', 'privado'),
  ('Club de Golf Los Encinos', 'Metepec', 'Estado de México', 'Club de Golf Los Encinos, Metepec, Estado de México, México', 'privado'),
  ('Club Santa Anita', 'Tlajomulco de Zúñiga', 'Jalisco', 'Club Santa Anita, Tlajomulco de Zúñiga, Jalisco, México', 'privado'),
  ('Club Campestre de Guadalajara', 'Zapopan', 'Jalisco', 'Club Campestre de Guadalajara, Zapopan, Jalisco, México', 'privado'),
  ('Atlas Golf Club', 'El Salto', 'Jalisco', 'Atlas Golf Club, El Salto, Jalisco, México', 'privado'),
  ('Guadalajara Country Club', 'Guadalajara', 'Jalisco', 'Guadalajara Country Club, Guadalajara, Jalisco, México', 'privado'),
  ('Club Campestre de Monterrey', 'Monterrey', 'Nuevo León', 'Club Campestre de Monterrey, Monterrey, Nuevo León, México', 'privado'),
  ('Valle Alto Golf Club', 'Monterrey', 'Nuevo León', 'Valle Alto Golf Club, Monterrey, Nuevo León, México', 'privado'),
  ('Club Campestre Tijuana', 'Tijuana', 'Baja California', 'Club Campestre Tijuana, Tijuana, Baja California, México', 'privado'),
  ('Club Campestre de Chihuahua', 'Chihuahua', 'Chihuahua', 'Club Campestre de Chihuahua, Chihuahua, Chihuahua, México', 'privado'),
  ('Club Campestre de Culiacán', 'Culiacán', 'Sinaloa', 'Club Campestre de Culiacán, Culiacán, Sinaloa, México', 'privado'),
  ('Club Campestre de Hermosillo', 'Hermosillo', 'Sonora', 'Club Campestre de Hermosillo, Hermosillo, Sonora, México', 'privado'),
  ('Club Campestre de Mérida', 'Mérida', 'Yucatán', 'Club Campestre de Mérida, Mérida, Yucatán, México', 'privado'),
  ('Yucatán Country Club', 'Mérida', 'Yucatán', 'Yucatán Country Club, Mérida, Yucatán, México', 'privado'),
  ('Club Campestre de León', 'León', 'Guanajuato', 'Club Campestre de León, León, Guanajuato, México', 'privado'),
  ('Club Campestre de Saltillo', 'Saltillo', 'Coahuila', 'Club Campestre de Saltillo, Saltillo, Coahuila, México', 'privado'),
  ('Club Campestre de Aguascalientes', 'Aguascalientes', 'Aguascalientes', 'Club Campestre de Aguascalientes, Aguascalientes, Aguascalientes, México', 'privado'),
  ('Club de Golf La Vista', 'San Andrés Cholula', 'Puebla', 'Club de Golf La Vista, San Andrés Cholula, Puebla, México', 'privado'),
  ('Club de Golf Santa Gertrudis', 'Orizaba', 'Veracruz', 'Avenida Oriente 18 #2331 entre Calle Independencia y Sur 45, 94340 Orizaba, Ver.', 'publico'),
  ('Club Campestre Coatzacoalcos', 'Coatzacoalcos', 'Veracruz', 'Carretera antigua a Mina, Hernández Ochoa KM 5.5, Coatzacoalcos, Veracruz, C.P. 96550', 'publico'),
  ('Club de Golf Villa Rica', 'Alvarado', 'Veracruz', 'Carretera Boca del Río y Antón Lizardo KM 1.5, 94290 Alvarado, Ver.', 'publico'),
  ('Campestre Cocoyoc', 'Yautepec', 'Morelos', 'Boulevard Lomas Cocoyoc, 62847, Fraccionamiento Lomas de Cocoyoc, Yautepec, Mor.', 'publico'),
  ('Club de Golf Xalapa', 'Xalapa', 'Veracruz', 'Carretera Xalapa-Veracruz Km 13.5, Col. Miradores del Mar, 91631 Xalapa, Ver.', 'publico'),
  ('Club de Golf El Copal', 'Tlalnepantla de Baz', 'Estado de México', 'C. San José 10, San Juan Ixhuatepec, 54180 Tlalnepantla, Méx.', 'publico'),
  ('Club de Golf La Purisima', 'Ixtlahuaca', 'Estado de México', 'Autopista Toluca Atlacomulco Km. 29, La Purísima, 50740 Ixtlahuaca de Rayón, Méx.', 'publico'),
  ('El Tinto Golf Course', 'Puerto Morelos', 'Quintana Roo', 'Carr. Federal 307, Chetumal Km 388, 77580 Cancún, Q.R.', 'publico'),
  ('Club Campestre de Mexicali', 'Mexicali', 'Baja California', 'Carretera a San Felipe KM. 2.5, Fraccionamiento Campestre, Mexicali, B.C.', 'publico'),
  ('Amanali Country Club', 'Tepeji del Río de Ocampo', 'Hidalgo', 'Blvd. Amanali Carr. Tula-Tepeji KM 11.4, Tepeji del Río, Hidalgo, 42850', 'publico'),
  ('El Tigre Golf Club', 'Bahía de Banderas', 'Nayarit', 'Av. Paraíso 800, Nuevo Vallarta, Nayarit', 'publico'),
  ('Club de Golf Santa Fe', 'Xochitepec', 'Morelos', 'Autopista México Acapulco KM 112.5 L1 Int. A, Col. Club de Golf Santa Fe, Xochitepec, Mor.', 'publico'),
  ('Club de Golf Tequisquiapan', 'Tequisquiapan', 'Querétaro', 'Cantáridas S/N, Fraccionamiento Club de Golf, 76799 Tequisquiapan, Qro.', 'publico'),
  ('Club de Golf Malanquin', 'San Miguel de Allende', 'Guanajuato', 'Carretera San Miguel de Allende – Celaya s/n km 3, San Miguel de Allende, Gto.', 'publico'),
  ('Riviera Cancun Golf Club', 'Benito Juárez', 'Quintana Roo', 'Blvd. Kukulcán 25.3, Zona Hotelera, 77500 Cancún, Q.R.', 'publico'),
  ('Hard Rock Golf Club Riviera Maya', 'Solidaridad', 'Quintana Roo', 'Pº Xamán-Ha S/N, Playacar, 77717 Playa del Carmen, Q.R.', 'publico'),
  ('Club de Golf Hacienda Soltepec', 'Huamantla', 'Tlaxcala', 'Carretera Huamantla Puebla KM 3, Ignacio Zaragoza, Tlax.', 'publico'),
  ('Mandarina Golf Club', 'Compostela', 'Nayarit', 'Carretera Federal Libre KM 200, Compostela, Nay.', 'publico'),
  ('Solmar Golf Links', 'Los Cabos', 'Baja California Sur', 'Carretera a Todos Santos Kilómetro 120, 23473 Cabo San Lucas, B.C.S.', 'publico'),
  ('CCC Playa Palmas Country Club', 'Carmen', 'Campeche', 'KM 5 carretera Carmen - Puerto Real, Colonia Bilvalbo, 24157 Carmen, Camp.', 'publico'),
  ('Cabo Real Golf Club', 'Los Cabos', 'Baja California Sur', 'Zona del interior, México 1 km 19.5, 23457 San José del Cabo, B.C.S.', 'publico'),
  ('Club Campestre San José', 'Los Cabos', 'Baja California Sur', 'Lib. al Aeropuerto Km. 119, Campo de Golf Fonatur, 23405 San José del Cabo, B.C.S.', 'publico'),
  ('Puerto Los Cabos Golf Course', 'Los Cabos', 'Baja California Sur', 'Paseo de los Pescadores s/n, La Playita, 23405 San José del Cabo, B.C.S.', 'publico'),
  ('Las Maravillas Campo Escuela de Golf', 'Chietla', 'Puebla', 'Av. Villas de Montecarlo SN, Chietla, Pue.', 'publico'),
  ('Club de Golf San Gil', 'San Juan del Río', 'Querétaro', 'Paseo del Abanico 19A, San Juan del Río, Qro.', 'publico'),
  ('Bosque Real Ejecutivo', 'Naucalpan de Juárez', 'Estado de México', 'Carretera México Huixquilucan No. 180, Col. San Cristóbal Texcalucan, 52774 Naucalpan, Méx.', 'publico'),
  ('Estrella del Mar Golf y Country Club', 'Mazatlán', 'Sinaloa', 'Carr. Barrón, Cam. a Isla de la Piedra km. 10 s/n, Mazatlán, Sin.', 'publico'),
  ('Paraiso del Mar Golf Club', 'La Paz', 'Baja California Sur', 'Paseo de Ciruelo SN, Paraíso del Mar, La Paz, B.C.S.', 'publico'),
  ('Balvanera Golf y Polo Country Club', 'Corregidora', 'Querétaro', 'Carretera Libre a Celaya KM 10, Corregidora, Qro.', 'publico'),
  ('Club de Golf El Valle', 'Ocoyoacac', 'Estado de México', 'KM 32.5 carretera México - Toluca, Ocoyoacac, Méx.', 'publico'),
  ('Gran Coyote Golf', 'Solidaridad', 'Quintana Roo', 'México 307 km 294, Solidaridad, 77710 Playa del Carmen, Q.R.', 'publico'),
  ('Club de Golf Vista Hermosa', 'San Agustín Etla', 'Oaxaca', 'Carretera a San Agustín Etla, Supermanzana Kilómetro 5, 68247 San Sebastián Etla, Oax.', 'publico'),
  ('Hotel Avandaro - Rancho Avandaro', 'Valle de Bravo', 'Estado de México', 'Carretera San Francisco de los Ranchos, Rancho Avándaro KM. 24, 51248 Rancho Avándaro Country Club, Méx.', 'publico'),
  ('Hotel Avandaro - Club de Golf', 'Valle de Bravo', 'Estado de México', 'Vega del Río s/n, Avándaro, 51200 Valle de Bravo, Méx.', 'publico'),
  ('Puerto Aventuras Golf y Racquet Club', 'Solidaridad', 'Quintana Roo', 'Km. 269, Carr. Federal Chetumal 5, Juárez, 77750 Puerto Aventuras, Q.R.', 'publico'),
  ('Real del Bosque', 'Tula de Allende', 'Hidalgo', 'Hotel Real del Bosque, Jacaranda 122, Col. Empleados Tolteca, 42833 Tula de Allende, Hgo.', 'publico');
