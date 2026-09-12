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
}

export const CLUBES_PRIVADOS: ClubSeed[] = [
  { nombre: "Club de Golf México", ciudad: "Ciudad de México", estado: "Ciudad de México", direccion: "Club de Golf México, Ciudad de México, CDMX, México", tipo: "privado" },
  { nombre: "Club Campestre de la Ciudad de México", ciudad: "Ciudad de México", estado: "Ciudad de México", direccion: "Club Campestre de la Ciudad de México, Tlalpan, CDMX, México", tipo: "privado" },
  { nombre: "Club de Golf Chapultepec", ciudad: "Naucalpan de Juárez", estado: "Estado de México", direccion: "Club de Golf Chapultepec, Naucalpan de Juárez, Estado de México, México", tipo: "privado" },
  { nombre: "Bosque Real Country Club", ciudad: "Huixquilucan", estado: "Estado de México", direccion: "Bosque Real Country Club, Huixquilucan, Estado de México, México", tipo: "privado" },
  { nombre: "Lomas Country Club", ciudad: "Huixquilucan", estado: "Estado de México", direccion: "Lomas Country Club, Huixquilucan, Estado de México, México", tipo: "privado" },
  { nombre: "Club de Golf Bellavista", ciudad: "Atizapán de Zaragoza", estado: "Estado de México", direccion: "Club de Golf Bellavista, Atizapán de Zaragoza, Estado de México, México", tipo: "privado" },
  { nombre: "Hacienda de Valle Escondido", ciudad: "Atizapán de Zaragoza", estado: "Estado de México", direccion: "Hacienda de Valle Escondido, Atizapán de Zaragoza, Estado de México, México", tipo: "privado" },
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
  { nombre: "Club de Golf La Vista", ciudad: "San Andrés Cholula", estado: "Puebla", direccion: "Club de Golf La Vista, San Andrés Cholula, Puebla, México", tipo: "privado" },
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

export const CLUBES_MEXICO: ClubSeed[] = [...CLUBES_PRIVADOS, ...CLUBES_PUBLICOS];
