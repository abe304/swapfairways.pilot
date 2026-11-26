// Roles del equipo de SwapFairways (ver docs/equipo-propuesta.md).
// Lo que aquí cambie (tipos de actividad, KPIs, cadencia) se refleja en
// /equipo y /admin/equipo. Las metas semanales viven en la tabla
// equipo_metas (migración 0026) para que el fundador las ajuste sin código.
import type { RolEquipo } from "@/lib/supabase/types";

export type RolConfig = {
  rol: RolEquipo;
  titulo: string;
  reportaA: RolEquipo | null;
  responsabilidad: string;
  cadencia: string;
  kpis: string[];
  tiposActividad: string[];
  /** Perfil propuesto mientras el puesto está vacante. */
  sugerido?: string;
};

export const ROLES: RolConfig[] = [
  {
    rol: "direccion",
    titulo: "Fundador y Director General",
    reportaA: null,
    responsabilidad: "Visión, prioridades y desbloqueos. Revisa este tablero cada lunes.",
    cadencia: "Revisión semanal (lunes) y estrategia mensual",
    kpis: ["Rondas jugadas por semana", "Roles en meta"],
    tiposActividad: ["Reunión estratégica", "Decisión tomada", "Desbloqueo", "Revisión del tablero"],
  },
  {
    rol: "operaciones",
    titulo: "Director de Operaciones y Tecnología",
    reportaA: "direccion",
    responsabilidad: "App funcionando y actualizada: despliegues, migraciones, soporte y prioridades técnicas. Segundo al mando.",
    cadencia: "Semanal",
    kpis: ["Despliegues y arreglos", "Incidentes abiertos", "Correos automáticos enviados"],
    tiposActividad: ["Despliegue", "Arreglo de error", "Migración", "Incidente", "Soporte a socio", "Mejora"],
    sugerido: "Diego Arriaga · ingeniero, ex líder técnico en fintech, HC 12",
  },
  {
    rol: "analista",
    titulo: "Analista de datos",
    reportaA: "operaciones",
    responsabilidad: "Revisa el uso de la app y detecta dónde fallamos u operamos mal. Cada hallazgo lleva una acción propuesta.",
    cadencia: "Semanal (hallazgos) y mensual (análisis profundo)",
    kpis: ["Hallazgos con acción", "Embudo registro → ronda jugada", "Solicitudes sin respuesta"],
    tiposActividad: ["Hallazgo", "Reporte", "Análisis de embudo", "Recomendación"],
  },
  {
    rol: "marketing",
    titulo: "Director de Marketing",
    reportaA: "direccion",
    responsabilidad: "Growth (adquisición), retención, comunicación y campañas.",
    cadencia: "Semanal",
    kpis: ["Registros nuevos", "Activación (primera oferta)", "Socios activos 30 días", "Contactos de Instagram"],
    tiposActividad: [
      "Contacto por Instagram",
      "Publicación",
      "Campaña lanzada",
      "Correo o newsletter",
      "Colaboración con influencer",
      "Prueba de crecimiento",
    ],
  },
  {
    rol: "rp",
    titulo: "Director de Relaciones Públicas",
    reportaA: "direccion",
    responsabilidad: "Relación con clubes, la Federación Mexicana de Golf y sus grupos regionales; podcasts y entrevistas.",
    cadencia: "Semanal (actividad) y mensual (relaciones cerradas)",
    kpis: ["Clubes con ofertas", "Reuniones con clubes y FMG", "Entrevistas publicadas"],
    tiposActividad: [
      "Reunión con club",
      "Contacto con la FMG",
      "Contacto con grupo regional",
      "Contacto con medio",
      "Entrevista o podcast agendado",
      "Entrevista publicada",
    ],
  },
  {
    rol: "comercial",
    titulo: "Equipo Comercial",
    reportaA: null,
    responsabilidad: "Leads, torneos, patrocinios y alianzas con las empresas de golf más relevantes. Independiente por ahora.",
    cadencia: "Semanal (pipeline) y mensual (cierres)",
    kpis: ["Leads nuevos", "Propuestas enviadas", "Patrocinios cerrados ($)", "Torneos"],
    tiposActividad: ["Lead nuevo", "Llamada o reunión", "Propuesta enviada", "Patrocinio cerrado", "Torneo organizado", "Alianza"],
  },
  {
    rol: "finanzas",
    titulo: "Director de Finanzas",
    reportaA: "direccion",
    responsabilidad: "Administra el dinero, el gasto en publicidad y los ingresos; construye el P&L.",
    cadencia: "Mensual (P&L) y semanal (gasto en publicidad)",
    kpis: ["Gasto del mes", "Ingresos", "Resultado", "Costo por registro"],
    tiposActividad: ["Cierre de mes", "Revisión de gasto", "Pago", "Presupuesto"],
  },
];

export const ROL_POR_CLAVE = Object.fromEntries(ROLES.map((r) => [r.rol, r])) as Record<RolEquipo, RolConfig>;

export function esRol(valor: unknown): valor is RolEquipo {
  return typeof valor === "string" && valor in ROL_POR_CLAVE;
}

export const CATEGORIAS_PIPELINE: Record<string, string> = {
  club: "Club",
  federacion: "Federación (FMG)",
  grupo_regional: "Grupo regional",
  medio: "Medio / podcast",
  influencer: "Influencer",
  patrocinio: "Patrocinio",
  alianza: "Alianza",
  lead: "Lead",
  torneo: "Torneo",
};

export const ETAPAS: { clave: string; label: string }[] = [
  { clave: "identificado", label: "Identificado" },
  { clave: "contactado", label: "Contactado" },
  { clave: "conversacion", label: "En conversación" },
  { clave: "propuesta", label: "Propuesta" },
  { clave: "cerrado", label: "Cerrado" },
  { clave: "perdido", label: "Perdido" },
];

export const CATEGORIAS_GASTO = ["publicidad", "tecnologia", "nomina", "eventos", "legal", "otros"];
export const CATEGORIAS_INGRESO = ["patrocinio", "torneo", "suscripcion", "otros"];

export const ETIQUETA_CATEGORIA_FIN: Record<string, string> = {
  publicidad: "Publicidad",
  tecnologia: "Tecnología",
  nomina: "Nómina y honorarios",
  eventos: "Eventos",
  legal: "Legal y contable",
  patrocinio: "Patrocinios",
  torneo: "Torneos",
  suscripcion: "Suscripciones",
  otros: "Otros",
};

// ---------- Fechas (centro de México, UTC-6 todo el año) ----------
const DIA_MS = 24 * 60 * 60 * 1000;

export function hoyMexico(desplazamientoDias = 0) {
  return new Date(Date.now() - 6 * 60 * 60 * 1000 + desplazamientoDias * DIA_MS).toISOString().slice(0, 10);
}

/** Día de la semana en CDMX: 0 domingo … 1 lunes … 6 sábado. */
export function diaSemanaMexico() {
  return new Date(`${hoyMexico()}T12:00:00Z`).getUTCDay();
}

/** Lunes (YYYY-MM-DD) de la semana de `fecha` (por defecto, hoy en CDMX). */
export function lunesDe(fecha = hoyMexico()) {
  const d = new Date(`${fecha}T12:00:00Z`);
  const dia = d.getUTCDay();
  d.setUTCDate(d.getUTCDate() - ((dia + 6) % 7));
  return d.toISOString().slice(0, 10);
}

export function sumarDias(fecha: string, dias: number) {
  const d = new Date(`${fecha}T12:00:00Z`);
  d.setUTCDate(d.getUTCDate() + dias);
  return d.toISOString().slice(0, 10);
}

export function fechaCorta(fecha: string) {
  return new Date(`${fecha.slice(0, 10)}T12:00:00Z`).toLocaleDateString("es-MX", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export function pesos(monto: number) {
  return new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(monto);
}
