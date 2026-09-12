// Catálogo de campos de golf de México usado para poblar la tabla `clubs`
// (migración supabase/migrations/0002_clubs_mexico.sql), el modo demo
// (lib/mock/store.ts) y el seed de prueba (scripts/seed.ts) — una sola
// fuente de verdad para los tres.
//
// - tipo "publico": los 36 campos registrados en https://gogolf.mx/ (API
//   pública /api/v1/maps/all-fields/), plataforma de reserva de tee times
//   pay-and-play. Dirección tomada tal cual la publican ellos.
// - tipo "privado": principales clubes de golf de membresía en México,
//   compilados de conocimiento general (no de una fuente única
//   verificada) — son el segmento al que realmente aplica el intercambio
//   de tee times entre socios. La dirección es una cadena de búsqueda
//   (nombre + ciudad + estado) pensada para resolver bien en Google Maps,
//   no una dirección postal exacta verificada. Antes del piloto real,
//   vale la pena que alguien del equipo revise/corrija estas entradas
//   directamente en Supabase Studio si hace falta precisión exacta.
//
// Ninguna de las dos listas pretende ser exhaustiva de los 200+ clubes
// que existen en México — son un punto de partida razonable. Agregar más
// clubes después es solo un insert en la tabla `clubs` vía Supabase
// Studio, no requiere tocar código.

export type ClubTipo = "privado" | "publico";

export interface ClubSeed {
  nombre: string;
  ciudad: string;
  estado: string;
  direccion: string;
  tipo: ClubTipo;
  // Coordenadas exactas (cuando se conocen, ej. fuente KML de la
  // Federación Mexicana de Golf) — si están presentes, el link de Google
  // Maps usa el pin exacto en vez de buscar por texto.
  latitud?: number;
  longitud?: number;
}

export const CLUBES_PRIVADOS: ClubSeed[] = [
  { nombre: "Club de Golf México", ciudad: "Ciudad de México", estado: "Ciudad de México", direccion: "Club de Golf México, Ciudad de México, CDMX, México", tipo: "privado" },
  { nombre: "Club Campestre de la Ciudad de México", ciudad: "Ciudad de México", estado: "Ciudad de México", direccion: "Club Campestre de la Ciudad de México, Tlalpan, CDMX, México", tipo: "privado" },
  { nombre: "Club de Golf Chapultepec", ciudad: "Naucalpan de Juárez", estado: "Estado de México", direccion: "Club de Golf Chapultepec, Naucalpan de Juárez, Estado de México, México", tipo: "privado" },
  { nombre: "Bosque Real Country Club", ciudad: "Huixquilucan", estado: "Estado de México", direccion: "Bosque Real Country Club, Huixquilucan, Estado de México, México", tipo: "privado" },
  { nombre: "Lomas Country Club", ciudad: "Huixquilucan", estado: "Estado de México", direccion: "Lomas Country Club, Huixquilucan, Estado de México, México", tipo: "privado" },
  { nombre: "Club de Golf Bellavista", ciudad: "Atizapán de Zaragoza", estado: "Estado de México", direccion: "Club de Golf Bellavista, Atizapán de Zaragoza, Estado de México, México", tipo: "privado" },
  { nombre: "Club de Golf La Hacienda", ciudad: "Atizapán de Zaragoza", estado: "Estado de México", direccion: "Club de Golf La Hacienda, Atizapán de Zaragoza, Estado de México, México", tipo: "privado" },
  { nombre: "Club de Golf Los Encinos", ciudad: "Metepec", estado: "Estado de México", direccion: "Club de Golf Los Encinos, Metepec, Estado de México, México", tipo: "privado" },
  { nombre: "Club Santa Anita", ciudad: "Tlajomulco de Zúñiga", estado: "Jalisco", direccion: "Club Santa Anita, Tlajomulco de Zúñiga, Jalisco, México", tipo: "privado" },
  { nombre: "Club Campestre de Guadalajara", ciudad: "Zapopan", estado: "Jalisco", direccion: "Club Campestre de Guadalajara, Zapopan, Jalisco, México", tipo: "privado" },
  { nombre: "Atlas Golf Club", ciudad: "El Salto", estado: "Jalisco", direccion: "Atlas Golf Club, El Salto, Jalisco, México", tipo: "privado" },
  { nombre: "Guadalajara Country Club", ciudad: "Guadalajara", estado: "Jalisco", direccion: "Guadalajara Country Club, Guadalajara, Jalisco, México", tipo: "privado" },
  { nombre: "Club Campestre de Monterrey", ciudad: "Monterrey", estado: "Nuevo León", direccion: "Club Campestre de Monterrey, Monterrey, Nuevo León, México", tipo: "privado" },
  { nombre: "Valle Alto Golf Club", ciudad: "Monterrey", estado: "Nuevo León", direccion: "Valle Alto Golf Club, Monterrey, Nuevo León, México", tipo: "privado" },
  { nombre: "Club Campestre Tijuana", ciudad: "Tijuana", estado: "Baja California", direccion: "Club Campestre Tijuana, Tijuana, Baja California, México", tipo: "privado" },
  { nombre: "Club Campestre de Chihuahua", ciudad: "Chihuahua", estado: "Chihuahua", direccion: "Club Campestre de Chihuahua, Chihuahua, Chihuahua, México", tipo: "privado" },
  { nombre: "Club Campestre de Culiacán", ciudad: "Culiacán", estado: "Sinaloa", direccion: "Club Campestre de Culiacán, Culiacán, Sinaloa, México", tipo: "privado" },
  { nombre: "Club Campestre de Hermosillo", ciudad: "Hermosillo", estado: "Sonora", direccion: "Club Campestre de Hermosillo, Hermosillo, Sonora, México", tipo: "privado" },
  { nombre: "Club Campestre de Mérida", ciudad: "Mérida", estado: "Yucatán", direccion: "Club Campestre de Mérida, Mérida, Yucatán, México", tipo: "privado" },
  { nombre: "Yucatán Country Club", ciudad: "Mérida", estado: "Yucatán", direccion: "Yucatán Country Club, Mérida, Yucatán, México", tipo: "privado" },
  { nombre: "Club Campestre de León", ciudad: "León", estado: "Guanajuato", direccion: "Club Campestre de León, León, Guanajuato, México", tipo: "privado" },
  { nombre: "Club Campestre de Saltillo", ciudad: "Saltillo", estado: "Coahuila", direccion: "Club Campestre de Saltillo, Saltillo, Coahuila, México", tipo: "privado" },
  { nombre: "Club Campestre de Aguascalientes", ciudad: "Aguascalientes", estado: "Aguascalientes", direccion: "Club Campestre de Aguascalientes, Aguascalientes, Aguascalientes, México", tipo: "privado" },
];

export const CLUBES_PUBLICOS: ClubSeed[] = [
  { nombre: "Club de Golf Santa Gertrudis", ciudad: "Orizaba", estado: "Veracruz", direccion: "Avenida Oriente 18 #2331 entre Calle Independencia y Sur 45, 94340 Orizaba, Ver.", tipo: "publico" },
  { nombre: "Club Campestre Coatzacoalcos", ciudad: "Coatzacoalcos", estado: "Veracruz", direccion: "Carretera antigua a Mina, Hernández Ochoa KM 5.5, Coatzacoalcos, Veracruz, C.P. 96550", tipo: "publico" },
  { nombre: "Club de Golf Villa Rica", ciudad: "Alvarado", estado: "Veracruz", direccion: "Carretera Boca del Río y Antón Lizardo KM 1.5, 94290 Alvarado, Ver.", tipo: "publico" },
  { nombre: "Campestre Cocoyoc", ciudad: "Yautepec", estado: "Morelos", direccion: "Boulevard Lomas Cocoyoc, 62847, Fraccionamiento Lomas de Cocoyoc, Yautepec, Mor.", tipo: "publico" },
  { nombre: "Club de Golf Xalapa", ciudad: "Xalapa", estado: "Veracruz", direccion: "Carretera Xalapa-Veracruz Km 13.5, Col. Miradores del Mar, 91631 Xalapa, Ver.", tipo: "publico" },
  { nombre: "Club de Golf El Copal", ciudad: "Tlalnepantla de Baz", estado: "Estado de México", direccion: "C. San José 10, San Juan Ixhuatepec, 54180 Tlalnepantla, Méx.", tipo: "publico" },
  { nombre: "Club de Golf La Purisima", ciudad: "Ixtlahuaca", estado: "Estado de México", direccion: "Autopista Toluca Atlacomulco Km. 29, La Purísima, 50740 Ixtlahuaca de Rayón, Méx.", tipo: "publico" },
  { nombre: "El Tinto Golf Course", ciudad: "Puerto Morelos", estado: "Quintana Roo", direccion: "Carr. Federal 307, Chetumal Km 388, 77580 Cancún, Q.R.", tipo: "publico" },
  { nombre: "Club Campestre de Mexicali", ciudad: "Mexicali", estado: "Baja California", direccion: "Carretera a San Felipe KM. 2.5, Fraccionamiento Campestre, Mexicali, B.C.", tipo: "publico" },
  { nombre: "Amanali Country Club", ciudad: "Tepeji del Río de Ocampo", estado: "Hidalgo", direccion: "Blvd. Amanali Carr. Tula-Tepeji KM 11.4, Tepeji del Río, Hidalgo, 42850", tipo: "publico" },
  { nombre: "El Tigre Golf Club", ciudad: "Bahía de Banderas", estado: "Nayarit", direccion: "Av. Paraíso 800, Nuevo Vallarta, Nayarit", tipo: "publico" },
  { nombre: "Club de Golf Santa Fe", ciudad: "Xochitepec", estado: "Morelos", direccion: "Autopista México Acapulco KM 112.5 L1 Int. A, Col. Club de Golf Santa Fe, Xochitepec, Mor.", tipo: "publico" },
  { nombre: "Club de Golf Tequisquiapan", ciudad: "Tequisquiapan", estado: "Querétaro", direccion: "Cantáridas S/N, Fraccionamiento Club de Golf, 76799 Tequisquiapan, Qro.", tipo: "publico" },
  { nombre: "Club de Golf Malanquin", ciudad: "San Miguel de Allende", estado: "Guanajuato", direccion: "Carretera San Miguel de Allende – Celaya s/n km 3, San Miguel de Allende, Gto.", tipo: "publico" },
  { nombre: "Riviera Cancun Golf Club", ciudad: "Benito Juárez", estado: "Quintana Roo", direccion: "Blvd. Kukulcán 25.3, Zona Hotelera, 77500 Cancún, Q.R.", tipo: "publico" },
  { nombre: "Hard Rock Golf Club Riviera Maya", ciudad: "Solidaridad", estado: "Quintana Roo", direccion: "Pº Xamán-Ha S/N, Playacar, 77717 Playa del Carmen, Q.R.", tipo: "publico" },
  { nombre: "Club de Golf Hacienda Soltepec", ciudad: "Huamantla", estado: "Tlaxcala", direccion: "Carretera Huamantla Puebla KM 3, Ignacio Zaragoza, Tlax.", tipo: "publico" },
  { nombre: "Mandarina Golf Club", ciudad: "Compostela", estado: "Nayarit", direccion: "Carretera Federal Libre KM 200, Compostela, Nay.", tipo: "publico" },
  { nombre: "Solmar Golf Links", ciudad: "Los Cabos", estado: "Baja California Sur", direccion: "Carretera a Todos Santos Kilómetro 120, 23473 Cabo San Lucas, B.C.S.", tipo: "publico" },
  { nombre: "CCC Playa Palmas Country Club", ciudad: "Carmen", estado: "Campeche", direccion: "KM 5 carretera Carmen - Puerto Real, Colonia Bilvalbo, 24157 Carmen, Camp.", tipo: "publico" },
  { nombre: "Cabo Real Golf Club", ciudad: "Los Cabos", estado: "Baja California Sur", direccion: "Zona del interior, México 1 km 19.5, 23457 San José del Cabo, B.C.S.", tipo: "publico" },
  { nombre: "Club Campestre San José", ciudad: "Los Cabos", estado: "Baja California Sur", direccion: "Lib. al Aeropuerto Km. 119, Campo de Golf Fonatur, 23405 San José del Cabo, B.C.S.", tipo: "publico" },
  { nombre: "Puerto Los Cabos Golf Course", ciudad: "Los Cabos", estado: "Baja California Sur", direccion: "Paseo de los Pescadores s/n, La Playita, 23405 San José del Cabo, B.C.S.", tipo: "publico" },
  { nombre: "Las Maravillas Campo Escuela de Golf", ciudad: "Chietla", estado: "Puebla", direccion: "Av. Villas de Montecarlo SN, Chietla, Pue.", tipo: "publico" },
  { nombre: "Club de Golf San Gil", ciudad: "San Juan del Río", estado: "Querétaro", direccion: "Paseo del Abanico 19A, San Juan del Río, Qro.", tipo: "publico" },
  { nombre: "Bosque Real Ejecutivo", ciudad: "Naucalpan de Juárez", estado: "Estado de México", direccion: "Carretera México Huixquilucan No. 180, Col. San Cristóbal Texcalucan, 52774 Naucalpan, Méx.", tipo: "publico" },
  { nombre: "Estrella del Mar Golf y Country Club", ciudad: "Mazatlán", estado: "Sinaloa", direccion: "Carr. Barrón, Cam. a Isla de la Piedra km. 10 s/n, Mazatlán, Sin.", tipo: "publico" },
  { nombre: "Paraiso del Mar Golf Club", ciudad: "La Paz", estado: "Baja California Sur", direccion: "Paseo de Ciruelo SN, Paraíso del Mar, La Paz, B.C.S.", tipo: "publico" },
  { nombre: "Balvanera Golf y Polo Country Club", ciudad: "Corregidora", estado: "Querétaro", direccion: "Carretera Libre a Celaya KM 10, Corregidora, Qro.", tipo: "publico" },
  { nombre: "Club de Golf El Valle", ciudad: "Ocoyoacac", estado: "Estado de México", direccion: "KM 32.5 carretera México - Toluca, Ocoyoacac, Méx.", tipo: "publico" },
  { nombre: "Gran Coyote Golf", ciudad: "Solidaridad", estado: "Quintana Roo", direccion: "México 307 km 294, Solidaridad, 77710 Playa del Carmen, Q.R.", tipo: "publico" },
  { nombre: "Club de Golf Vista Hermosa", ciudad: "San Agustín Etla", estado: "Oaxaca", direccion: "Carretera a San Agustín Etla, Supermanzana Kilómetro 5, 68247 San Sebastián Etla, Oax.", tipo: "publico" },
  { nombre: "Hotel Avandaro - Rancho Avandaro", ciudad: "Valle de Bravo", estado: "Estado de México", direccion: "Carretera San Francisco de los Ranchos, Rancho Avándaro KM. 24, 51248 Rancho Avándaro Country Club, Méx.", tipo: "publico" },
  { nombre: "Hotel Avandaro - Club de Golf", ciudad: "Valle de Bravo", estado: "Estado de México", direccion: "Vega del Río s/n, Avándaro, 51200 Valle de Bravo, Méx.", tipo: "publico" },
  { nombre: "Puerto Aventuras Golf y Racquet Club", ciudad: "Solidaridad", estado: "Quintana Roo", direccion: "Km. 269, Carr. Federal Chetumal 5, Juárez, 77750 Puerto Aventuras, Q.R.", tipo: "publico" },
  { nombre: "Real del Bosque", ciudad: "Tula de Allende", estado: "Hidalgo", direccion: "Hotel Real del Bosque, Jacaranda 122, Col. Empleados Tolteca, 42833 Tula de Allende, Hgo.", tipo: "publico" },
];

// ~107 clubes adicionales de la Federación Mexicana de Golf (mapa oficial
// "Campos de Golf Federados en México", Google My Maps, KML público via
// /maps/d/kml?mid=1J0VXa2hbbIyFLKmCtAkGLU5zTdEr3o8) que no tenían ya una
// entrada equivalente en las listas de arriba. Trae coordenadas exactas
// (usadas directo para el link de Google Maps) pero no ciudad/dirección
// postal — el estado se estimó por cercanía a cada estado cuando el KML no
// lo daba, así que puede haber algún error puntual cerca de límites
// estatales (fácil de corregir en Supabase Studio).
export const CLUBES_FEDERACION: ClubSeed[] = [
  { nombre: 'El Cortés Golf Club', ciudad: '', estado: 'Baja California Sur', direccion: 'El Cortés Golf Club, Baja California Sur, México', tipo: 'publico', latitud: 24.2219271, longitud: -110.3029533 },
  { nombre: 'Punta Mita Golf Club', ciudad: '', estado: 'Nayarit', direccion: 'Punta Mita Golf Club, Nayarit, México', tipo: 'publico', latitud: 20.7706471, longitud: -105.5365643 },
  { nombre: 'Bajamar Golf & Resort', ciudad: '', estado: 'Baja California', direccion: 'Bajamar Golf & Resort, Baja California, México', tipo: 'publico', latitud: 32.0165661, longitud: -116.8721905 },
  { nombre: 'Palma Real Golf & Beach Club', ciudad: '', estado: 'Guerrero', direccion: 'Palma Real Golf & Beach Club, Guerrero, México', tipo: 'publico', latitud: 17.6548593, longitud: -101.5944486 },
  { nombre: 'Cabo San Lucas Country Club', ciudad: '', estado: 'Baja California Sur', direccion: 'Cabo San Lucas Country Club, Baja California Sur, México', tipo: 'publico', latitud: 22.9152188, longitud: -109.9081472 },
  { nombre: 'Danzante Bay Golf Club', ciudad: '', estado: 'Baja California Sur', direccion: 'Danzante Bay Golf Club, Baja California Sur, México', tipo: 'publico', latitud: 25.7155844, longitud: -111.2342107 },
  { nombre: 'Iberostar Cancun Golf Club', ciudad: '', estado: 'Quintana Roo', direccion: 'Iberostar Cancun Golf Club, Quintana Roo, México', tipo: 'publico', latitud: 21.063988, longitud: -86.7806424 },
  { nombre: 'Iberostar Playa Paraíso Golf Club', ciudad: '', estado: 'Quintana Roo', direccion: 'Iberostar Playa Paraíso Golf Club, Quintana Roo, México', tipo: 'publico', latitud: 20.7631742, longitud: -86.9662515 },
  { nombre: 'Moon Palace Spa & Club Golf', ciudad: '', estado: 'Quintana Roo', direccion: 'Moon Palace Spa & Club Golf, Quintana Roo, México', tipo: 'publico', latitud: 20.9885198, longitud: -86.8401399 },
  { nombre: 'PGA Riviera Maya', ciudad: '', estado: 'Quintana Roo', direccion: 'PGA Riviera Maya, Quintana Roo, México', tipo: 'publico', latitud: 20.3751061, longitud: -87.3399548 },
  { nombre: 'Playa Mujeres Golf Club', ciudad: '', estado: 'Quintana Roo', direccion: 'Playa Mujeres Golf Club, Quintana Roo, México', tipo: 'publico', latitud: 21.2581737, longitud: -86.8204333 },
  { nombre: 'Higuera Golf Course', ciudad: '', estado: 'Nayarit', direccion: 'Higuera Golf Course, Nayarit, México', tipo: 'publico', latitud: 20.7979513, longitud: -105.4828852 },
  { nombre: 'Turtle Dunes Country Club', ciudad: '', estado: 'Guerrero', direccion: 'Turtle Dunes Country Club, Guerrero, México', tipo: 'publico', latitud: 16.7896835, longitud: -99.813308 },
  { nombre: 'Tres Vidas Golf Club Acapulco', ciudad: '', estado: 'Guerrero', direccion: 'Tres Vidas Golf Club Acapulco, Guerrero, México', tipo: 'publico', latitud: 16.7256748, longitud: -99.7234035 },
  { nombre: 'Vidanta Golf Course at Vidanta Acapulco', ciudad: '', estado: 'Guerrero', direccion: 'Vidanta Golf Course at Vidanta Acapulco, Guerrero, México', tipo: 'publico', latitud: 16.7764688, longitud: -99.7918775 },
  { nombre: 'Mayan Palace Golf', ciudad: '', estado: 'Guerrero', direccion: 'Mayan Palace Golf, Guerrero, México', tipo: 'publico', latitud: 16.7855256, longitud: -99.7999603 },
  { nombre: 'Princess Golf Course - Mundo Imperial', ciudad: '', estado: 'Guerrero', direccion: 'Princess Golf Course - Mundo Imperial, Guerrero, México', tipo: 'publico', latitud: 16.7892654, longitud: -99.8145622 },
  { nombre: 'Vidanta Golf at Vidanta Los Cabos', ciudad: '', estado: 'Baja California Sur', direccion: 'Vidanta Golf at Vidanta Los Cabos, Baja California Sur, México', tipo: 'publico', latitud: 23.0480826, longitud: -109.7043386 },
  { nombre: 'Vidanta Golf Puerto Peñasco', ciudad: '', estado: 'Baja California', direccion: 'Vidanta Golf Puerto Peñasco, Baja California, México', tipo: 'publico', latitud: 31.2455856, longitud: -113.2473992 },
  { nombre: 'Nicklaus Design Golf Course at Vidanta Riviera Maya', ciudad: '', estado: 'Quintana Roo', direccion: 'Nicklaus Design Golf Course at Vidanta Riviera Maya, Quintana Roo, México', tipo: 'publico', latitud: 20.766515, longitud: -86.956215 },
  { nombre: 'The Lakes Course at Vidanta Nuevo Vallarta', ciudad: '', estado: 'Nayarit', direccion: 'The Lakes Course at Vidanta Nuevo Vallarta, Nayarit, México', tipo: 'publico', latitud: 20.6826252, longitud: -105.2813162 },
  { nombre: 'Vidanta Greg Norman Golf Course', ciudad: '', estado: 'Nayarit', direccion: 'Vidanta Greg Norman Golf Course, Nayarit, México', tipo: 'publico', latitud: 20.6820374, longitud: -105.2663133 },
  { nombre: 'Club de Golf Santa Margarita', ciudad: '', estado: 'Guanajuato', direccion: 'Club de Golf Santa Margarita, Guanajuato, México', tipo: 'publico', latitud: 20.6864193, longitud: -101.4091073 },
  { nombre: 'Madeiras Country Club', ciudad: '', estado: 'Ciudad de México', direccion: 'Madeiras Country Club, Ciudad de México, México', tipo: 'publico', latitud: 19.6169144, longitud: -99.2668189 },
  { nombre: 'El Camaleón Golf Course at Mayakoba', ciudad: '', estado: 'Quintana Roo', direccion: 'El Camaleón Golf Course at Mayakoba, Quintana Roo, México', tipo: 'publico', latitud: 20.6897606, longitud: -87.0311157 },
  { nombre: 'Zibatá Golf', ciudad: '', estado: 'Querétaro', direccion: 'Zibatá Golf, Querétaro, México', tipo: 'publico', latitud: 20.6825675, longitud: -100.3377151 },
  { nombre: 'Club de Golf y Deportivo Las Aves', ciudad: '', estado: 'Nuevo León', direccion: 'Club de Golf y Deportivo Las Aves, Nuevo León, México', tipo: 'publico', latitud: 25.7527294, longitud: -100.039566 },
  { nombre: 'Gary Player Signature Golf Club El Cortés', ciudad: '', estado: 'Baja California Sur', direccion: 'Gary Player Signature Golf Club El Cortés, Baja California Sur, México', tipo: 'publico', latitud: 24.2219271, longitud: -110.3029533 },
  { nombre: 'Country Club de Chapala', ciudad: '', estado: 'Jalisco', direccion: 'Country Club de Chapala, Jalisco, México', tipo: 'publico', latitud: 20.3354909, longitud: -103.1216892 },
  { nombre: 'Club Refineria Madero', ciudad: '', estado: 'Tamaulipas', direccion: 'Club Refineria Madero, Tamaulipas, México', tipo: 'publico', latitud: 22.2732222, longitud: -97.8103013 },
  { nombre: 'Las Cañadas Country Club', ciudad: '', estado: 'Jalisco', direccion: 'Las Cañadas Country Club, Jalisco, México', tipo: 'publico', latitud: 20.7815379, longitud: -103.370138 },
  { nombre: 'Coral Golf Resort', ciudad: '', estado: 'Ciudad de México', direccion: 'Coral Golf Resort, Ciudad de México, México', tipo: 'publico', latitud: 19.3411988, longitud: -98.8875966 },
  { nombre: 'Club de Golf Los Tabachines', ciudad: '', estado: 'Morelos', direccion: 'Club de Golf Los Tabachines, Morelos, México', tipo: 'publico', latitud: 18.8929663, longitud: -99.2173777 },
  { nombre: 'Club de Golf de Zacatecas', ciudad: '', estado: 'Zacatecas', direccion: 'Club de Golf de Zacatecas, Zacatecas, México', tipo: 'publico', latitud: 22.7603352, longitud: -102.5320136 },
  { nombre: 'Campestre el Cristo', ciudad: '', estado: 'Puebla', direccion: 'Campestre el Cristo, Puebla, México', tipo: 'publico', latitud: 18.8824893, longitud: -98.4225347 },
  { nombre: 'Club de Golf Pachuca', ciudad: '', estado: 'Hidalgo', direccion: 'Club de Golf Pachuca, Hidalgo, México', tipo: 'publico', latitud: 20.0777571, longitud: -98.768586 },
  { nombre: 'Altozano El Nuevo Colima', ciudad: '', estado: 'Colima', direccion: 'Altozano El Nuevo Colima, Colima, México', tipo: 'publico', latitud: 19.3176364, longitud: -103.6688431 },
  { nombre: 'La Esmeralda Country Club', ciudad: '', estado: 'Ciudad de México', direccion: 'La Esmeralda Country Club, Ciudad de México, México', tipo: 'publico', latitud: 19.7257399, longitud: -98.9325282 },
  { nombre: 'Club de Golf Izar', ciudad: '', estado: 'Estado de México', direccion: 'Club de Golf Izar, Estado de México, México', tipo: 'publico', latitud: 19.1675357, longitud: -100.1605002 },
  { nombre: 'Azul Talavera Country Club', ciudad: '', estado: 'Durango', direccion: 'Azul Talavera Country Club, Durango, México', tipo: 'publico', latitud: 25.5176111, longitud: -103.3707147 },
  { nombre: 'Las Cruces Golf', ciudad: '', estado: 'Nuevo León', direccion: 'Las Cruces Golf, Nuevo León, México', tipo: 'publico', latitud: 25.7956258, longitud: -100.1145491 },
  { nombre: 'El Bosque Country Club', ciudad: '', estado: 'Guanajuato', direccion: 'El Bosque Country Club, Guanajuato, México', tipo: 'publico', latitud: 21.1984354, longitud: -101.7221529 },
  { nombre: 'Puerto Cancún Golf Club', ciudad: '', estado: 'Quintana Roo', direccion: 'Puerto Cancún Golf Club, Quintana Roo, México', tipo: 'publico', latitud: 21.166603, longitud: -86.8123397 },
  { nombre: 'Punta Tiburón Country Club', ciudad: '', estado: 'Veracruz', direccion: 'Punta Tiburón Country Club, Veracruz, México', tipo: 'publico', latitud: 19.0649246, longitud: -96.0955649 },
  { nombre: 'Ciudad Del Sol Club de Golf', ciudad: '', estado: 'Nuevo León', direccion: 'Ciudad Del Sol Club de Golf, Nuevo León, México', tipo: 'publico', latitud: 25.2508052, longitud: -99.9806107 },
  { nombre: 'Campeche Country Club', ciudad: '', estado: 'Campeche', direccion: 'Campeche Country Club, Campeche, México', tipo: 'publico', latitud: 19.7877067, longitud: -90.6279734 },
  { nombre: 'Río Grande Country Club', ciudad: '', estado: 'Coahuila', direccion: 'Río Grande Country Club, Coahuila, México', tipo: 'publico', latitud: 28.5802268, longitud: -100.5227355 },
  { nombre: 'Marina Vallarta Golf Club', ciudad: '', estado: 'Nayarit', direccion: 'Marina Vallarta Golf Club, Nayarit, México', tipo: 'publico', latitud: 20.6678227, longitud: -105.2543331 },
  { nombre: 'Alquerías Club de Golf', ciudad: '', estado: 'San Luis Potosí', direccion: 'Alquerías Club de Golf, San Luis Potosí, México', tipo: 'publico', latitud: 22.0883747, longitud: -100.865095 },
  { nombre: 'Club Campestre de Reynosa', ciudad: '', estado: 'Tamaulipas', direccion: 'Club Campestre de Reynosa, Tamaulipas, México', tipo: 'publico', latitud: 26.1445465, longitud: -98.4110412 },
  { nombre: 'Paraíso Country Club', ciudad: '', estado: 'Morelos', direccion: 'Paraíso Country Club, Morelos, México', tipo: 'publico', latitud: 18.8273072, longitud: -99.2042633 },
  { nombre: 'El Cid Golf & Country Club', ciudad: '', estado: 'Sinaloa', direccion: 'El Cid Golf & Country Club, Sinaloa, México', tipo: 'publico', latitud: 23.2507194, longitud: -106.4555635 },
  { nombre: 'NAUKA', ciudad: '', estado: 'Nayarit', direccion: 'NAUKA, Nayarit, México', tipo: 'publico', latitud: 21.0940222, longitud: -105.2218504 },
  { nombre: 'Club Campestre Nayar', ciudad: '', estado: 'Nayarit', direccion: 'Club Campestre Nayar, Nayarit, México', tipo: 'publico', latitud: 21.5170059, longitud: -104.9344177 },
  { nombre: 'The Springs Golf Club', ciudad: '', estado: 'Chihuahua', direccion: 'The Springs Golf Club, Chihuahua, México', tipo: 'publico', latitud: 30.0516019, longitud: -107.5936985 },
  { nombre: 'Club Campestre Tampico', ciudad: '', estado: 'Tamaulipas', direccion: 'Club Campestre Tampico, Tamaulipas, México', tipo: 'privado', latitud: 22.2560297, longitud: -97.8823132 },
  { nombre: 'Club Campestre Nuevo Laredo', ciudad: '', estado: 'Tamaulipas', direccion: 'Club Campestre Nuevo Laredo, Tamaulipas, México', tipo: 'privado', latitud: 27.4542361, longitud: -99.4996337 },
  { nombre: 'Club de Golf El Socorro A.C.', ciudad: '', estado: 'Coahuila', direccion: 'Club de Golf El Socorro A.C., Coahuila, México', tipo: 'privado', latitud: 26.900987, longitud: -101.4109192 },
  { nombre: 'Club Campestre de Querétaro', ciudad: '', estado: 'Querétaro', direccion: 'Club Campestre de Querétaro, Querétaro, México', tipo: 'privado', latitud: 20.5695726, longitud: -100.4077776 },
  { nombre: 'Club Campestre Juarez', ciudad: '', estado: 'Chihuahua', direccion: 'Club Campestre Juarez, Chihuahua, México', tipo: 'privado', latitud: 31.7197289, longitud: -106.4108464 },
  { nombre: 'Club Campestre Celaya S.A. De C.V.', ciudad: '', estado: 'Querétaro', direccion: 'Club Campestre Celaya S.A. De C.V., Querétaro, México', tipo: 'privado', latitud: 20.5197734, longitud: -100.7899703 },
  { nombre: 'Club de Golf Acapulco', ciudad: '', estado: 'Guerrero', direccion: 'Club de Golf Acapulco, Guerrero, México', tipo: 'privado', latitud: 16.8556404, longitud: -99.8583755 },
  { nombre: 'Club Campestre de San Luis', ciudad: '', estado: 'San Luis Potosí', direccion: 'Club Campestre de San Luis, San Luis Potosí, México', tipo: 'privado', latitud: 22.1602025, longitud: -101.0077962 },
  { nombre: 'Club Campestre Cordobés', ciudad: '', estado: 'Veracruz', direccion: 'Club Campestre Cordobés, Veracruz, México', tipo: 'privado', latitud: 18.9137145, longitud: -96.9544649 },
  { nombre: 'Club de Golf Campestre de Morelia', ciudad: '', estado: 'Michoacán', direccion: 'Club de Golf Campestre de Morelia, Michoacán, México', tipo: 'privado', latitud: 19.6816559, longitud: -101.1585021 },
  { nombre: 'Club Campestre Victoria', ciudad: '', estado: 'Tamaulipas', direccion: 'Club Campestre Victoria, Tamaulipas, México', tipo: 'privado', latitud: 23.7631341, longitud: -99.1321943 },
  { nombre: 'Club Campestre Riama', ciudad: '', estado: 'Guanajuato', direccion: 'Club Campestre Riama, Guanajuato, México', tipo: 'privado', latitud: 20.5800226, longitud: -101.1864283 },
  { nombre: 'Club de Golf Valle Imperial', ciudad: '', estado: 'Jalisco', direccion: 'Club de Golf Valle Imperial, Jalisco, México', tipo: 'privado', latitud: 20.7825695, longitud: -103.434098 },
  { nombre: 'Club de Golf San Carlos S.A. de C.V.', ciudad: '', estado: 'Estado de México', direccion: 'Club de Golf San Carlos S.A. de C.V., Estado de México, México', tipo: 'privado', latitud: 19.2728669, longitud: -99.6116236 },
  { nombre: 'Club Deportivo Campestre Torreón', ciudad: '', estado: 'Durango', direccion: 'Club Deportivo Campestre Torreón, Durango, México', tipo: 'privado', latitud: 25.5251086, longitud: -103.4109545 },
  { nombre: 'Club Campestre Chiluca', ciudad: '', estado: 'Ciudad de México', direccion: 'Club Campestre Chiluca, Ciudad de México, México', tipo: 'privado', latitud: 19.544202, longitud: -99.308116 },
  { nombre: 'Golf club Vallescondido', ciudad: '', estado: 'Ciudad de México', direccion: 'Golf club Vallescondido, Ciudad de México, México', tipo: 'privado', latitud: 19.5614362, longitud: -99.3069786 },
  { nombre: 'San Francisco Country Club', ciudad: '', estado: 'Chihuahua', direccion: 'San Francisco Country Club, Chihuahua, México', tipo: 'privado', latitud: 28.6605679, longitud: -106.1331004 },
  { nombre: 'Club Campestre Lourdes', ciudad: '', estado: 'Nuevo León', direccion: 'Club Campestre Lourdes, Nuevo León, México', tipo: 'privado', latitud: 25.385686, longitud: -100.997168 },
  { nombre: 'Golf Juriquilla', ciudad: '', estado: 'Querétaro', direccion: 'Golf Juriquilla, Querétaro, México', tipo: 'privado', latitud: 20.7070972, longitud: -100.4620957 },
  { nombre: 'Club Campestre de Tuxtla', ciudad: '', estado: 'Chiapas', direccion: 'Club Campestre de Tuxtla, Chiapas, México', tipo: 'privado', latitud: 16.7530279, longitud: -93.1956818 },
  { nombre: 'Club de Golf las Fuentes', ciudad: '', estado: 'Puebla', direccion: 'Club de Golf las Fuentes, Puebla, México', tipo: 'privado', latitud: 19.0885329, longitud: -98.2336028 },
  { nombre: 'Club Campestre Villahermosa', ciudad: '', estado: 'Tabasco', direccion: 'Club Campestre Villahermosa, Tabasco, México', tipo: 'privado', latitud: 18.0040702, longitud: -92.9483489 },
  { nombre: 'Vista Verde Country Club', ciudad: '', estado: 'Puebla', direccion: 'Vista Verde Country Club, Puebla, México', tipo: 'privado', latitud: 18.4836486, longitud: -97.4084742 },
  { nombre: 'Missions Club Campestre', ciudad: '', estado: 'Nuevo León', direccion: 'Missions Club Campestre, Nuevo León, México', tipo: 'privado', latitud: 25.5179474, longitud: -100.1916881 },
  { nombre: 'Club de Golf Pulgas Pandas', ciudad: '', estado: 'Aguascalientes', direccion: 'Club de Golf Pulgas Pandas, Aguascalientes, México', tipo: 'privado', latitud: 21.9133151, longitud: -102.3004841 },
  { nombre: 'Club Campestre de Durango', ciudad: '', estado: 'Durango', direccion: 'Club Campestre de Durango, Durango, México', tipo: 'privado', latitud: 23.972209, longitud: -104.6607268 },
  { nombre: 'Club Campestre El Campanario B.C.', ciudad: '', estado: 'Querétaro', direccion: 'Club Campestre El Campanario B.C., Querétaro, México', tipo: 'privado', latitud: 20.6114335, longitud: -100.3431049 },
  { nombre: 'Club de Golf Malinalco', ciudad: '', estado: 'Morelos', direccion: 'Club de Golf Malinalco, Morelos, México', tipo: 'privado', latitud: 18.9877033, longitud: -99.4742137 },
  { nombre: 'Alamo Country Club', ciudad: '', estado: 'Querétaro', direccion: 'Alamo Country Club, Querétaro, México', tipo: 'privado', latitud: 20.552816, longitud: -100.895788 },
  { nombre: 'Terralta Golf & Country Club', ciudad: '', estado: 'Nuevo León', direccion: 'Terralta Golf & Country Club, Nuevo León, México', tipo: 'privado', latitud: 25.7178094, longitud: -100.6059705 },
  { nombre: 'Bosques Club De Golf', ciudad: '', estado: 'Ciudad de México', direccion: 'Bosques Club De Golf, Ciudad de México, México', tipo: 'privado', latitud: 19.3773933, longitud: -99.2774582 },
  { nombre: 'Altozano Morelia Golf Bosque Monarca', ciudad: '', estado: 'Michoacán', direccion: 'Altozano Morelia Golf Bosque Monarca, Michoacán, México', tipo: 'privado', latitud: 19.6409803, longitud: -101.1654169 },
  { nombre: 'Tajin Golf Club', ciudad: '', estado: 'Veracruz', direccion: 'Tajin Golf Club, Veracruz, México', tipo: 'privado', latitud: 20.4887945, longitud: -97.4915988 },
  { nombre: 'La Vista Country Club', ciudad: '', estado: 'Puebla', direccion: 'La Vista Country Club, Puebla, México', tipo: 'privado', latitud: 19.0082973, longitud: -98.2546344 },
  { nombre: 'Club Campestre de Puebla', ciudad: '', estado: 'Puebla', direccion: 'Club Campestre de Puebla, Puebla, México', tipo: 'privado', latitud: 19.0133414, longitud: -98.2334886 },
  { nombre: 'Balvanera Polo Golf & Country Club', ciudad: '', estado: 'Querétaro', direccion: 'Balvanera Polo Golf & Country Club, Querétaro, México', tipo: 'privado', latitud: 20.540511, longitud: -100.469651 },
  { nombre: 'Club de Golf Lagunas de Miralta', ciudad: '', estado: 'Tamaulipas', direccion: 'Club de Golf Lagunas de Miralta, Tamaulipas, México', tipo: 'privado', latitud: 22.3510297, longitud: -97.9007367 },
  { nombre: 'Gran Reserva Golf Resort & Country Club', ciudad: '', estado: 'Morelos', direccion: 'Gran Reserva Golf Resort & Country Club, Morelos, México', tipo: 'privado', latitud: 18.850645, longitud: -99.681842 },
  { nombre: 'Club de Golf Cañada de Santa Fe', ciudad: '', estado: 'Ciudad de México', direccion: 'Club de Golf Cañada de Santa Fe, Ciudad de México, México', tipo: 'privado', latitud: 19.3517868, longitud: -99.2694116 },
  { nombre: 'Country Club Mante', ciudad: '', estado: 'Tamaulipas', direccion: 'Country Club Mante, Tamaulipas, México', tipo: 'privado', latitud: 22.7123001, longitud: -98.9679139 },
  { nombre: 'Tres Marias Golf Club', ciudad: '', estado: 'Michoacán', direccion: 'Tres Marias Golf Club, Michoacán, México', tipo: 'privado', latitud: 19.7080802, longitud: -101.1078643 },
  { nombre: 'Club de Golf la Herradura', ciudad: '', estado: 'Nuevo León', direccion: 'Club de Golf la Herradura, Nuevo León, México', tipo: 'privado', latitud: 25.5657087, longitud: -100.2289548 },
  { nombre: 'Club de Golf Las Lomas Zapopan', ciudad: '', estado: 'Jalisco', direccion: 'Club de Golf Las Lomas Zapopan, Jalisco, México', tipo: 'privado', latitud: 20.7146649, longitud: -103.4369671 },
  { nombre: 'Club de Golf de Cuernavaca', ciudad: '', estado: 'Morelos', direccion: 'Club de Golf de Cuernavaca, Morelos, México', tipo: 'privado', latitud: 18.9092086, longitud: -99.2376827 },
  { nombre: 'La Loma Residential & Golf Club', ciudad: '', estado: 'San Luis Potosí', direccion: 'La Loma Residential & Golf Club, San Luis Potosí, México', tipo: 'privado', latitud: 22.1175543, longitud: -101.0334395 },
  { nombre: 'Rancho Contento Golf Course', ciudad: '', estado: 'Jalisco', direccion: 'Rancho Contento Golf Course, Jalisco, México', tipo: 'privado', latitud: 20.7120776, longitud: -103.4802156 },
  { nombre: 'Altozano El Nuevo Tabasco', ciudad: '', estado: 'Tabasco', direccion: 'Altozano El Nuevo Tabasco, Tabasco, México', tipo: 'privado', latitud: 17.9478094, longitud: -92.8034935 },
  { nombre: 'Asturian Center of Mexico Club Campestre Ecological', ciudad: '', estado: 'Morelos', direccion: 'Asturian Center of Mexico Club Campestre Ecological, Morelos, México', tipo: 'privado', latitud: 18.9750961, longitud: -98.8654535 },
  { nombre: 'Club de Golf EL Molino', ciudad: '', estado: 'Guanajuato', direccion: 'Club de Golf EL Molino, Guanajuato, México', tipo: 'privado', latitud: 21.2025597, longitud: -101.6950355 },
  { nombre: 'Bosque Real Golf Course 9 Hole Course', ciudad: '', estado: 'Ciudad de México', direccion: 'Bosque Real Golf Course 9 Hole Course, Ciudad de México, México', tipo: 'privado', latitud: 19.4318313, longitud: -99.2763061 },
  { nombre: 'Club de Golf La Primavera', ciudad: '', estado: 'Sinaloa', direccion: 'Club de Golf La Primavera, Sinaloa, México', tipo: 'privado', latitud: 24.7216206, longitud: -107.3919989 },
];

export const CLUBES_MEXICO: ClubSeed[] = [...CLUBES_PRIVADOS, ...CLUBES_PUBLICOS, ...CLUBES_FEDERACION];
