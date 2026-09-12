/**
 * Seed de datos de prueba para el piloto de SwapFairways.
 * Pensado para correr UNA VEZ sobre un proyecto Supabase recién creado
 * (después de aplicar todas las migraciones en supabase/migrations/).
 *
 * Uso: npm run seed
 */
import "dotenv/config";
import { createAdminClient } from "../lib/supabase/admin";
import { CLUBES_MEXICO } from "../lib/data/clubs-mexico";

const SEED_PASSWORD = "SwapFairways2026!";

const supabase = createAdminClient();

function daysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

// Carga el catálogo completo de clubs (ver lib/data/clubs-mexico.ts) y
// devuelve un mapa nombre -> id para referenciarlos al crear ofertas.
// Si ya corriste supabase/migrations/0002_clubs_mexico.sql este catálogo
// ya está cargado y esto solo lo completa/idempotentiza.
async function loadClubs(): Promise<Map<string, string>> {
  const byName = new Map<string, string>();
  for (const club of CLUBES_MEXICO) {
    const { data: existing } = await supabase
      .from("clubs")
      .select("id")
      .eq("nombre", club.nombre)
      .maybeSingle();
    if (existing) {
      byName.set(club.nombre, existing.id);
      continue;
    }
    const { data, error } = await supabase
      .from("clubs")
      .insert(club)
      .select("id")
      .single();
    if (error || !data) throw error ?? new Error(`No se pudo crear el club ${club.nombre}`);
    byName.set(club.nombre, data.id);
  }
  return byName;
}

async function createUser(params: {
  email: string;
  nombre: string;
  club_id: string;
  handicap_manual: number;
  bio: string;
  telefono: string;
}) {
  const { data, error } = await supabase.auth.admin.createUser({
    email: params.email,
    password: SEED_PASSWORD,
    email_confirm: true,
    user_metadata: { nombre: params.nombre },
  });

  if (error || !data.user) {
    throw new Error(
      `No se pudo crear ${params.email}: ${error?.message ?? "sin usuario"}. ` +
        "Si ya corriste el seed antes, borra los usuarios de prueba en Supabase Studio antes de reintentar.",
    );
  }

  const userId = data.user.id;

  // El trigger on_auth_user_created ya creó el profile + crédito de bienvenida.
  const { error: profileError } = await supabase
    .from("profiles")
    .update({
      club_id: params.club_id,
      handicap_manual: params.handicap_manual,
      bio: params.bio,
    })
    .eq("id", userId);
  if (profileError) throw profileError;

  const { error: contactError } = await supabase
    .from("profile_contacts")
    .insert({ user_id: userId, telefono: params.telefono });
  if (contactError) throw contactError;

  return userId;
}

async function createOffer(params: {
  host_id: string;
  club_id: string;
  fecha: string;
  hora: string;
  pases_disponibles: number;
  pases_confirmados?: number;
  caddie_incluido: boolean;
  carrito_compartido: boolean;
  costo_estimado: number;
  nota: string;
  estado?: "activa" | "cerrada" | "cancelada";
}) {
  const { data, error } = await supabase
    .from("tee_time_offers")
    .insert({
      host_id: params.host_id,
      club_id: params.club_id,
      fecha: params.fecha,
      hora: params.hora,
      pases_disponibles: params.pases_disponibles,
      pases_confirmados: params.pases_confirmados ?? 0,
      caddie_incluido: params.caddie_incluido,
      carrito_compartido: params.carrito_compartido,
      costo_estimado: params.costo_estimado,
      nota: params.nota,
      estado: params.estado ?? "activa",
    })
    .select("id")
    .single();
  if (error || !data) throw error ?? new Error("No se pudo crear la oferta");
  return data.id;
}

async function main() {
  console.log(`Creando catálogo de ${CLUBES_MEXICO.length} clubes de golf de México...`);
  const clubsByName = await loadClubs();
  const clubId = (nombre: string) => {
    const id = clubsByName.get(nombre);
    if (!id) throw new Error(`Club no encontrado en el catálogo: ${nombre}`);
    return id;
  };
  const clubBosques = clubId("Club de Golf México");
  const clubGuadalajara = clubId("Club Campestre de Guadalajara");
  const clubMonterrey = clubId("Club Campestre de Monterrey");

  console.log("Creando socios de prueba...");
  const ana = await createUser({
    email: "ana.torres@swf-pilot.test",
    nombre: "Ana Torres",
    club_id: clubBosques,
    handicap_manual: 14.2,
    bio: "Juego los fines de semana, ritmo relajado y buena plática en el carrito.",
    telefono: "+52 55 1111 0001",
  });
  const carlos = await createUser({
    email: "carlos.mendez@swf-pilot.test",
    nombre: "Carlos Méndez",
    club_id: clubBosques,
    handicap_manual: 8.5,
    bio: "Handicap bajo, me gusta jugar temprano entre semana.",
    telefono: "+52 55 1111 0002",
  });
  const sofia = await createUser({
    email: "sofia.ramirez@swf-pilot.test",
    nombre: "Sofía Ramírez",
    club_id: clubBosques,
    handicap_manual: 22.0,
    bio: "Aprendiendo el juego, busco rondas relajadas para practicar.",
    telefono: "+52 55 1111 0003",
  });
  const jorge = await createUser({
    email: "jorge.lopez@swf-pilot.test",
    nombre: "Jorge López",
    club_id: clubBosques,
    handicap_manual: 5.1,
    bio: "Ex-competitivo, disfruto rondas rápidas y con buen ritmo.",
    telefono: "+52 55 1111 0004",
  });
  const laura = await createUser({
    email: "laura.diaz@swf-pilot.test",
    nombre: "Laura Díaz",
    club_id: clubBosques,
    handicap_manual: 18.7,
    bio: "Socia desde hace 3 años, siempre buscando nuevos compañeros de juego.",
    telefono: "+52 55 1111 0005",
  });
  const mario = await createUser({
    email: "mario.hernandez@swf-pilot.test",
    nombre: "Mario Hernández",
    club_id: clubGuadalajara,
    handicap_manual: 11.3,
    bio: "Anfitrión frecuente, me encanta compartir mi tee time de los sábados.",
    telefono: "+52 33 1111 0006",
  });
  const patricia = await createUser({
    email: "patricia.gomez@swf-pilot.test",
    nombre: "Patricia Gómez",
    club_id: clubGuadalajara,
    handicap_manual: 16.0,
    bio: "Buscando socios de juego confiables para rondas de media semana.",
    telefono: "+52 33 1111 0007",
  });
  const ricardo = await createUser({
    email: "ricardo.vargas@swf-pilot.test",
    nombre: "Ricardo Vargas",
    club_id: clubMonterrey,
    handicap_manual: 9.8,
    bio: "Juego casi todos los domingos, abierto a nuevos retos.",
    telefono: "+52 81 1111 0008",
  });

  console.log("Creando ofertas de tee time...");
  const offerSinSolicitudes = await createOffer({
    host_id: laura,
    club_id: clubBosques,
    fecha: daysFromNow(2),
    hora: "07:00",
    pases_disponibles: 2,
    caddie_incluido: true,
    carrito_compartido: false,
    costo_estimado: 450,
    nota: "Nos vemos en la caseta de golfistas 15 min antes. Vestimenta: polo y pantalón/bermuda de golf.",
  });

  const offerPendiente = await createOffer({
    host_id: ana,
    club_id: clubBosques,
    fecha: daysFromNow(3),
    hora: "07:30",
    pases_disponibles: 2,
    caddie_incluido: true,
    carrito_compartido: true,
    costo_estimado: 500,
    nota: "Punto de encuentro: recepción del club. Traer identificación de socio.",
  });

  const offerAprobada = await createOffer({
    host_id: carlos,
    club_id: clubBosques,
    fecha: daysFromNow(4),
    hora: "08:00",
    pases_disponibles: 1,
    pases_confirmados: 1,
    caddie_incluido: false,
    carrito_compartido: true,
    costo_estimado: 300,
    nota: "Nos vemos en el driving range 20 min antes para calentar.",
  });

  const offerJugada = await createOffer({
    host_id: mario,
    club_id: clubGuadalajara,
    fecha: daysFromNow(-3),
    hora: "09:00",
    pases_disponibles: 1,
    pases_confirmados: 1,
    caddie_incluido: true,
    carrito_compartido: true,
    costo_estimado: 400,
    nota: "Gracias por acompañarme, nos vemos en la caseta principal.",
    estado: "cerrada",
  });

  await createOffer({
    host_id: ricardo,
    club_id: clubMonterrey,
    fecha: daysFromNow(6),
    hora: "07:00",
    pases_disponibles: 1,
    caddie_incluido: false,
    carrito_compartido: false,
    costo_estimado: 0,
    nota: "Ronda relajada de domingo, todos los niveles son bienvenidos.",
  });

  console.log("Creando solicitudes en distintos estados...");
  await supabase.from("requests").insert({
    offer_id: offerPendiente,
    guest_id: sofia,
    estado: "pendiente",
  });

  await supabase.from("requests").insert({
    offer_id: offerAprobada,
    guest_id: jorge,
    estado: "aprobado",
    aprobado_at: new Date().toISOString(),
  });

  const { data: reqJugada } = await supabase
    .from("requests")
    .insert({
      offer_id: offerJugada,
      guest_id: patricia,
      estado: "jugado",
      aprobado_at: daysFromNow(-4),
      jugado_at: daysFromNow(-3),
    })
    .select("id")
    .single();

  if (!reqJugada) throw new Error("No se pudo crear la solicitud jugada");

  console.log("Liquidando créditos de la ronda ya jugada...");
  await supabase.from("credit_transactions").insert([
    {
      user_id: patricia,
      tipo: "gastado",
      monto: -1,
      referencia: reqJugada.id,
      nota: "Ronda jugada",
    },
    {
      user_id: mario,
      tipo: "ganado",
      monto: 1,
      referencia: reqJugada.id,
      nota: "Ronda jugada como anfitrión",
    },
  ]);

  console.log("Creando reseñas cruzadas de la ronda jugada...");
  await supabase.from("reviews").insert([
    {
      request_id: reqJugada.id,
      autor_id: patricia,
      receptor_id: mario,
      rating: 5,
      tags: ["Buena etiqueta", "Gran camaradería"],
      comentario: "Excelente anfitrión, muy puntual y buena onda todo el recorrido.",
    },
    {
      request_id: reqJugada.id,
      autor_id: mario,
      receptor_id: patricia,
      rating: 5,
      tags: ["Puntual", "Buen ritmo de juego"],
      comentario: "Un placer jugar con ella, seguro la vuelvo a invitar.",
    },
  ]);

  console.log("\nListo. Usuarios de prueba (todos con la misma contraseña):");
  console.log(`  contraseña: ${SEED_PASSWORD}`);
  [
    "ana.torres@swf-pilot.test",
    "carlos.mendez@swf-pilot.test",
    "sofia.ramirez@swf-pilot.test",
    "jorge.lopez@swf-pilot.test",
    "laura.diaz@swf-pilot.test",
    "mario.hernandez@swf-pilot.test",
    "patricia.gomez@swf-pilot.test",
    "ricardo.vargas@swf-pilot.test",
  ].forEach((email) => console.log(`  - ${email}`));

  console.log(
    `\nOfertas: sin solicitudes (${offerSinSolicitudes}), pendiente (${offerPendiente}), ` +
      `aprobada (${offerAprobada}), jugada con reseñas (${offerJugada}), ` +
      `y una en Monterrey para probar el filtro por club.`,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
