import { MOCK_LOGIN_EMAIL, MOCK_LOGIN_PASSWORD } from "./is-mock";
import { CLUBES_MEXICO } from "@/lib/data/clubs-mexico";

export type MockRow = Record<string, unknown>;
export type MockTable =
  | "clubs"
  | "profiles"
  | "profile_contacts"
  | "tee_time_offers"
  | "requests"
  | "credit_transactions"
  | "reviews";

export type MockAuthUser = { id: string; email: string; password: string };

type Store = Record<MockTable, MockRow[]> & { authUsers: MockAuthUser[] };

let idCounter = 0;
export function uid(prefix = "id") {
  idCounter += 1;
  return `${prefix}-${idCounter}-${Math.random().toString(36).slice(2, 8)}`;
}

export function nowIso() {
  return new Date().toISOString();
}

function daysFromNow(days: number) {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

export function applyCreditTx(tx: {
  id: string;
  user_id: string;
  tipo: string;
  monto: number;
  referencia: string | null;
  nota: string | null;
  created_at: string;
}) {
  store.credit_transactions.push(tx);
  const profile = store.profiles.find((p) => p.id === tx.user_id);
  if (profile) {
    profile.creditos_balance = (profile.creditos_balance as number) + tx.monto;
  }
}

function buildInitialStore(): Store {
  const clubs: MockRow[] = CLUBES_MEXICO.map((c) => ({
    id: uid("club"),
    nombre: c.nombre,
    ciudad: c.ciudad,
    estado: c.estado,
    direccion: c.direccion,
    tipo: c.tipo,
    latitud: c.latitud ?? null,
    longitud: c.longitud ?? null,
    created_at: nowIso(),
  }));
  const findClubId = (nombre: string) => {
    const club = clubs.find((c) => c.nombre === nombre);
    if (!club) throw new Error(`Club de demo no encontrado: ${nombre}`);
    return club.id as string;
  };
  const clubBosques = findClubId("Club de Golf México");
  const clubGuadalajara = findClubId("Club Campestre de Guadalajara");

  const uTest = "user-test";
  const uCarlos = "user-carlos";
  const uSofia = "user-sofia";
  const uLaura = "user-laura";
  const uJorge = "user-jorge";
  const uMario = "user-mario";

  const store: Store = {
    authUsers: [{ id: uTest, email: MOCK_LOGIN_EMAIL, password: MOCK_LOGIN_PASSWORD }],
    clubs,
    profiles: [
      {
        id: uTest,
        nombre: "Usuario de Prueba",
        club_id: clubBosques,
        handicap_manual: 15.0,
        foto_url: null,
        bio: "Cuenta de prueba para explorar el piloto de SwapFairways.",
        creditos_balance: 0,
        is_admin: false,
        created_at: nowIso(),
      },
      {
        id: uCarlos,
        nombre: "Carlos Méndez",
        club_id: clubBosques,
        handicap_manual: 8.5,
        foto_url: null,
        bio: "Handicap bajo, me gusta jugar temprano entre semana.",
        creditos_balance: 0,
        is_admin: false,
        created_at: nowIso(),
      },
      {
        id: uSofia,
        nombre: "Sofía Ramírez",
        club_id: clubBosques,
        handicap_manual: 22.0,
        foto_url: null,
        bio: "Aprendiendo el juego, busco rondas relajadas para practicar.",
        creditos_balance: 0,
        is_admin: false,
        created_at: nowIso(),
      },
      {
        id: uLaura,
        nombre: "Laura Díaz",
        club_id: clubBosques,
        handicap_manual: 18.7,
        foto_url: null,
        bio: "Socia desde hace 3 años, siempre buscando nuevos compañeros de juego.",
        creditos_balance: 0,
        is_admin: false,
        created_at: nowIso(),
      },
      {
        id: uJorge,
        nombre: "Jorge López",
        club_id: clubBosques,
        handicap_manual: 5.1,
        foto_url: null,
        bio: "Ex-competitivo, disfruto rondas rápidas y con buen ritmo.",
        creditos_balance: 0,
        is_admin: false,
        created_at: nowIso(),
      },
      {
        id: uMario,
        nombre: "Mario Hernández",
        club_id: clubGuadalajara,
        handicap_manual: 11.3,
        foto_url: null,
        bio: "Anfitrión frecuente, me encanta compartir mi tee time de los sábados.",
        creditos_balance: 0,
        is_admin: false,
        created_at: nowIso(),
      },
    ],
    profile_contacts: [
      { user_id: uCarlos, telefono: "+52 55 1111 0002", updated_at: nowIso() },
      { user_id: uTest, telefono: "+52 55 0000 0000", updated_at: nowIso() },
    ],
    tee_time_offers: [],
    requests: [],
    credit_transactions: [
      {
        id: uid("tx"),
        user_id: uTest,
        tipo: "bienvenida",
        monto: 3,
        referencia: null,
        nota: "Crédito de bienvenida al registrarte en SWF",
        created_at: nowIso(),
      },
    ],
    reviews: [],
  };

  const offer1 = uid("offer"); // host carlos, test tiene solicitud aprobada
  const offer2 = uid("offer"); // host test, sofia pendiente
  const offer3 = uid("offer"); // host laura, sin solicitudes
  const offer4 = uid("offer"); // host test, en el pasado, jorge aprobado -> se puede marcar jugada
  const offer5 = uid("offer"); // host carlos, historica, jugada con reseñas (reputación de carlos)
  const offer6 = uid("offer"); // host mario, otro club

  store.tee_time_offers.push(
    {
      id: offer1,
      host_id: uCarlos,
      club_id: clubBosques,
      fecha: daysFromNow(3),
      hora: "07:30",
      pases_disponibles: 2,
      pases_confirmados: 1,
      caddie_incluido: true,
      carrito_compartido: true,
      costo_estimado: 500,
      nota: "Punto de encuentro: recepción del club. Traer identificación de socio.",
      estado: "activa",
      created_at: nowIso(),
    },
    {
      id: offer2,
      host_id: uTest,
      club_id: clubBosques,
      fecha: daysFromNow(4),
      hora: "08:00",
      pases_disponibles: 2,
      pases_confirmados: 0,
      caddie_incluido: false,
      carrito_compartido: true,
      costo_estimado: 300,
      nota: "Nos vemos en el driving range 20 min antes.",
      estado: "activa",
      created_at: nowIso(),
    },
    {
      id: offer3,
      host_id: uLaura,
      club_id: clubBosques,
      fecha: daysFromNow(2),
      hora: "07:00",
      pases_disponibles: 1,
      pases_confirmados: 0,
      caddie_incluido: true,
      carrito_compartido: false,
      costo_estimado: 450,
      nota: "Nos vemos en la caseta de golfistas 15 min antes.",
      estado: "activa",
      created_at: nowIso(),
    },
    {
      id: offer4,
      host_id: uTest,
      club_id: clubBosques,
      fecha: daysFromNow(-1),
      hora: "07:00",
      pases_disponibles: 1,
      pases_confirmados: 1,
      caddie_incluido: false,
      carrito_compartido: false,
      costo_estimado: 0,
      nota: "Ronda relajada, todos los niveles son bienvenidos.",
      estado: "cerrada",
      created_at: nowIso(),
    },
    {
      id: offer5,
      host_id: uCarlos,
      club_id: clubBosques,
      fecha: daysFromNow(-5),
      hora: "09:00",
      pases_disponibles: 1,
      pases_confirmados: 1,
      caddie_incluido: true,
      carrito_compartido: true,
      costo_estimado: 400,
      nota: "Gracias por acompañarme.",
      estado: "cerrada",
      created_at: nowIso(),
    },
    {
      id: offer6,
      host_id: uMario,
      club_id: clubGuadalajara,
      fecha: daysFromNow(6),
      hora: "07:00",
      pases_disponibles: 1,
      pases_confirmados: 0,
      caddie_incluido: false,
      carrito_compartido: false,
      costo_estimado: 0,
      nota: "Ronda de domingo, todos los niveles son bienvenidos.",
      estado: "activa",
      created_at: nowIso(),
    },
  );

  const reqTestAprobado = uid("req");
  const reqSofiaPendiente = uid("req");
  const reqJorgeAprobado = uid("req");
  const reqSofiaJugado = uid("req");

  store.requests.push(
    {
      id: reqTestAprobado,
      offer_id: offer1,
      guest_id: uTest,
      estado: "aprobado",
      creditos_cobrados: 1,
      created_at: nowIso(),
      aprobado_at: nowIso(),
      jugado_at: null,
    },
    {
      id: reqSofiaPendiente,
      offer_id: offer2,
      guest_id: uSofia,
      estado: "pendiente",
      creditos_cobrados: 1,
      created_at: nowIso(),
      aprobado_at: null,
      jugado_at: null,
    },
    {
      id: reqJorgeAprobado,
      offer_id: offer4,
      guest_id: uJorge,
      estado: "aprobado",
      creditos_cobrados: 1,
      created_at: daysFromNow(-2),
      aprobado_at: daysFromNow(-2),
      jugado_at: null,
    },
    {
      id: reqSofiaJugado,
      offer_id: offer5,
      guest_id: uSofia,
      estado: "jugado",
      creditos_cobrados: 1,
      created_at: daysFromNow(-6),
      aprobado_at: daysFromNow(-6),
      jugado_at: daysFromNow(-5),
    },
  );

  store.credit_transactions.push(
    {
      id: uid("tx"),
      user_id: uSofia,
      tipo: "gastado",
      monto: -1,
      referencia: reqSofiaJugado,
      nota: "Ronda jugada",
      created_at: daysFromNow(-5),
    },
    {
      id: uid("tx"),
      user_id: uCarlos,
      tipo: "ganado",
      monto: 1,
      referencia: reqSofiaJugado,
      nota: "Ronda jugada como anfitrión",
      created_at: daysFromNow(-5),
    },
  );

  store.reviews.push(
    {
      id: uid("review"),
      request_id: reqSofiaJugado,
      autor_id: uSofia,
      receptor_id: uCarlos,
      rating: 5,
      tags: ["Buena etiqueta", "Gran camaradería"],
      comentario: "Excelente anfitrión, muy puntual.",
      created_at: daysFromNow(-5),
    },
    {
      id: uid("review"),
      request_id: reqSofiaJugado,
      autor_id: uCarlos,
      receptor_id: uSofia,
      rating: 5,
      tags: ["Puntual", "Buen ritmo de juego"],
      comentario: "Un placer jugar con ella.",
      created_at: daysFromNow(-5),
    },
  );

  // El balance de cada perfil se deriva de la suma del ledger, igual
  // que en producción (donde lo mantiene un trigger de Postgres).
  for (const profile of store.profiles) {
    profile.creditos_balance = store.credit_transactions
      .filter((tx) => tx.user_id === profile.id)
      .reduce((sum, tx) => sum + (tx.monto as number), 0);
  }

  return store;
}

// Vive en memoria durante la vida del proceso de `next dev`. Se reinicia si
// reinicias el servidor — es solo para poder navegar la demo sin backend.
export const store: Store = buildInitialStore();
