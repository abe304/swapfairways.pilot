// Correos internos del equipo. Salen en la misma revisión diaria de
// /api/cron/correos (8:00 CDMX) y se registran en correos_enviados para no
// repetirse:
//
// * E1 · lunes: recordatorio de check-in a cada miembro que no lo ha hecho.
// * E2 · martes: resumen semanal a los administradores (semáforo por rol,
//   KPIs de la app, compromisos vencidos y bloqueos).
// * E3 · diario: aviso a quien tiene un compromiso que venció ayer.
//
// Así el sistema persigue los pendientes, no el fundador.
import { escapeHtml as e } from "@/lib/email";
import { enviarUnaVez, type ResultadoEnvio } from "@/lib/correos/enviar";
import type { Correo } from "@/lib/correos/plantillas";
import { cargarEquipo, dbServicio, estadoDelEquipo, metricasProducto, quien } from "./datos";
import { AGENTES } from "@/lib/agentes/config";
import { ROL_POR_CLAVE, diaSemanaMexico, fechaCorta, hoyMexico, lunesDe, sumarDias } from "./roles";

const VERDE = "#0E2B20";
const DORADO = "#C5A059";
const CREMA = "#FAF8F5";

function interna(preencabezado: string, cuerpo: string) {
  return `
<div style="background:${CREMA};padding:24px 12px;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${e(preencabezado)}</div>
  <div style="max-width:560px;margin:0 auto;background:#ffffff;border-radius:12px;padding:28px 24px;font-family:Helvetica,Arial,sans-serif;font-size:15px;color:${VERDE};">
    <p style="margin:0 0 20px;font-size:13px;letter-spacing:2px;color:${DORADO};font-weight:bold;">SWAPFAIRWAYS · EQUIPO</p>
    ${cuerpo}
  </div>
</div>`;
}
const p = (html: string) => `<p style="margin:0 0 14px;line-height:1.55;">${html}</p>`;
const boton = (texto: string, href: string) =>
  `<p style="margin:24px 0;"><a href="${e(href)}" style="display:inline-block;background:${DORADO};color:${VERDE};padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">${e(texto)}</a></p>`;
const primerNombre = (n: string) => n.trim().split(/\s+/)[0] || n;

function e1Checkin(nombre: string, sitio: string, rolTitulo: string): Correo {
  return {
    subject: "Tu check-in de la semana",
    html: interna(
      "Logros, bloqueos y compromisos: 3 minutos.",
      `${p(`Hola ${e(primerNombre(nombre))}:`)}
      ${p(`Es lunes: toca el check-in semanal de ${e(rolTitulo)}. Son tres minutos: qué lograste la semana pasada, qué te está frenando y a qué te comprometes esta semana (con fecha).`)}
      ${p("Con esto el tablero se actualiza solo y nadie tiene que preguntarte cómo vas.")}
      ${boton("Hacer mi check-in", `${sitio}/equipo`)}`,
    ),
  };
}

function e3Vencido(nombre: string, sitio: string, texto: string, fecha: string): Correo {
  return {
    subject: `Compromiso vencido: ${texto.slice(0, 60)}`,
    html: interna(
      "Márcalo como hecho o reprográmalo en tu próximo check-in.",
      `${p(`Hola ${e(primerNombre(nombre))}:`)}
      ${p(`Tu compromiso <strong>“${e(texto)}”</strong> venció el ${e(fechaCorta(fecha))}.`)}
      ${p("Si ya está, márcalo como hecho. Si no, anótalo de nuevo con otra fecha en tu check-in y cuenta en bloqueos qué lo frenó.")}
      ${boton("Ir a mi semana", `${sitio}/equipo`)}`,
    ),
  };
}

async function e2Resumen(sitio: string): Promise<Correo> {
  const cliente = await dbServicio();
  const [datos, m] = await Promise.all([cargarEquipo(cliente), metricasProducto()]);
  const estados = estadoDelEquipo(datos);
  const hoy = hoyMexico();
  const lunes = lunesDe(hoy);
  const color = { verde: "#166534", amarillo: "#92400e", rojo: "#991b1b" } as const;
  const icono = { verde: "●", amarillo: "▲", rojo: "■" } as const;

  // Agentes de IA: actividades de la semana contra su meta.
  const filasAgentes = AGENTES.map((a) => {
    const n = datos.actividades.filter((x) => x.agente === a.rol && x.fecha >= lunes).length;
    const meta = datos.metas[a.rol] ?? 0;
    const sem = n >= meta ? "verde" : n > 0 ? "amarillo" : "rojo";
    return `<tr><td style="padding:6px 8px 6px 0;border-top:1px solid #eee;">${e(a.nombre)}<br/><span style="font-size:12px;color:#5b6b63;">Agente de IA</span></td><td style="padding:6px 0;border-top:1px solid #eee;font-size:13px;color:${color[sem]};">${icono[sem]} ${n}/${meta} actividades</td></tr>`;
  }).join("");
  const filas = filasAgentes + (estados.length
    ? estados
        .map(
          (s) =>
            `<tr><td style="padding:6px 8px 6px 0;border-top:1px solid #eee;">${e(s.miembro.nombre)}<br/><span style="font-size:12px;color:#5b6b63;">${e(ROL_POR_CLAVE[s.miembro.rol]?.titulo ?? s.miembro.rol)}</span></td><td style="padding:6px 0;border-top:1px solid #eee;font-size:13px;color:${color[s.semaforo]};">${icono[s.semaforo]} ${e(s.motivo)} · ${s.semana}/${s.meta}</td></tr>`,
        )
        .join("")
    : "");

  const vencidos = datos.compromisos.filter((c) => !c.hecho && c.fecha_limite < hoy);
  const { count: porAprobar } = await cliente
    .from("agente_acciones")
    .select("id", { count: "exact", head: true })
    .eq("estado", "pendiente");
  const bloqueos = datos.checkins.filter((c) => c.semana === lunes && c.bloqueos);
  const lista = (items: string[]) =>
    items.length ? `<ul style="margin:0 0 14px;padding-left:18px;line-height:1.5;">${items.join("")}</ul>` : p("Ninguno.");

  return {
    subject: `Equipo: resumen semanal · ${m.jugadas7} rondas jugadas`,
    html: interna(
      "Resumen semanal del equipo y de la app.",
      `${p(`<strong>Semana del ${e(fechaCorta(lunes))}</strong>`)}
      ${p(`<strong>La app (últimos 7 días):</strong> ${m.jugadas7} rondas jugadas · ${m.nuevos7} registros nuevos · ${m.ofertas7} ofertas · ${m.solicitudes7} solicitudes · ${m.pendientesSinRespuesta} solicitudes sin respuesta de más de 72 h.`)}
      ${porAprobar ? p(`<strong>Tienes ${porAprobar} propuesta${porAprobar === 1 ? "" : "s"} de los agentes por aprobar.</strong>`) : ""}
      <table style="width:100%;border-collapse:collapse;font-size:14px;margin:0 0 18px;">${filas}</table>
      ${p(`<strong>Compromisos vencidos (${vencidos.length})</strong>`)}
      ${lista(vencidos.slice(0, 10).map((c) => `<li>${e(quien(c, datos.nombres))}: ${e(c.texto)} (${e(fechaCorta(c.fecha_limite))})</li>`))}
      ${p(`<strong>Bloqueos reportados (${bloqueos.length})</strong>`)}
      ${lista(bloqueos.map((c) => `<li>${e(quien(c, datos.nombres))}: ${e(c.bloqueos ?? "")}</li>`))}
      ${boton("Abrir el tablero", `${sitio}/admin/equipo`)}`,
    ),
  };
}

export async function revisionEquipo(sitio: string) {
  const cliente = await dbServicio();
  const resumen: Record<string, Record<ResultadoEnvio, number>> = {};
  const contar = (tipo: string, r: ResultadoEnvio) => {
    resumen[tipo] ??= { enviado: 0, ya_enviado: 0, sin_correo: 0, fallo: 0 };
    resumen[tipo][r] += 1;
  };

  const { data: miembros, error } = await cliente.from("equipo_miembros").select("*").eq("activo", true);
  if (error) return { omitido: `Sin tablas del equipo (${error.message})` };

  // Los miembros humanos pueden ser cero (solo agentes): E2 sale igual.
  const ids = (miembros ?? []).map((m) => m.profile_id as string);
  const { data: perfiles } = ids.length
    ? await cliente.from("profiles").select("id, nombre").in("id", ids)
    : { data: [] as { id: string; nombre: string }[] };
  const nombre = (id: string) => (perfiles ?? []).find((p) => p.id === id)?.nombre ?? "";
  const hoy = hoyMexico();
  const lunes = lunesDe(hoy);
  const dia = diaSemanaMexico();

  // E1 · lunes: recordatorio de check-in.
  if (dia === 1) {
    const { data: hechos } = await cliente.from("equipo_checkins").select("autor_id").eq("semana", lunes);
    const ya = new Set((hechos ?? []).map((c) => c.autor_id as string));
    for (const m of miembros ?? []) {
      const id = m.profile_id as string;
      if (ya.has(id)) continue;
      const rolTitulo = (m.titulo as string | null) || ROL_POR_CLAVE[m.rol as keyof typeof ROL_POR_CLAVE]?.titulo || "tu rol";
      contar("E1", await enviarUnaVez(cliente, { userId: id, tipo: "E1", referencia: lunes, correo: e1Checkin(nombre(id), sitio, rolTitulo) }));
    }
  }

  // E3 · diario: compromisos que vencieron ayer y siguen abiertos.
  const ayer = sumarDias(hoy, -1);
  const { data: vencidos } = await cliente
    .from("equipo_compromisos")
    .select("id, autor_id, texto, fecha_limite")
    .eq("hecho", false)
    .eq("fecha_limite", ayer);
  for (const c of vencidos ?? []) {
    const id = c.autor_id as string;
    if (!ids.includes(id)) continue;
    contar(
      "E3",
      await enviarUnaVez(cliente, {
        userId: id,
        tipo: "E3",
        referencia: c.id as string,
        correo: e3Vencido(nombre(id), sitio, c.texto as string, c.fecha_limite as string),
      }),
    );
  }

  // E2 · martes: resumen semanal a los administradores.
  if (dia === 2) {
    const { data: admins } = await cliente.from("profiles").select("id").eq("is_admin", true);
    if (admins?.length) {
      const correo = await e2Resumen(sitio);
      for (const a of admins) {
        contar("E2", await enviarUnaVez(cliente, { userId: a.id as string, tipo: "E2", referencia: lunes, correo }));
      }
    }
  }

  return { resumen };
}
