// Plantillas de los correos de ciclo de vida (T1, T2, T4, T7, T8).
// Textos aprobados en docs/correos-ciclo-de-vida.md: si cambias uno aquí,
// cámbialo también allá.
import { escapeHtml as e } from "@/lib/email";

const VERDE = "#0E2B20";
const DORADO = "#C5A059";
const CREMA = "#FAF8F5";

export type Correo = { subject: string; html: string };

function boton(texto: string, href: string) {
  return `<p style="margin:24px 0;"><a href="${e(href)}" style="display:inline-block;background:${DORADO};color:${VERDE};padding:12px 20px;border-radius:6px;text-decoration:none;font-weight:bold;">${e(texto)}</a></p>`;
}

function p(html: string) {
  return `<p style="margin:0 0 14px;line-height:1.55;">${html}</p>`;
}

// Estructura común: preencabezado oculto, cuerpo y firma de Abraham.
function plantilla(preencabezado: string, cuerpo: string) {
  return `
<div style="background:${CREMA};padding:24px 12px;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">${e(preencabezado)}</div>
  <div style="max-width:540px;margin:0 auto;background:#ffffff;border-radius:12px;padding:28px 24px;font-family:Helvetica,Arial,sans-serif;font-size:15px;color:${VERDE};">
    <p style="margin:0 0 20px;font-size:13px;letter-spacing:2px;color:${DORADO};font-weight:bold;">SWAPFAIRWAYS</p>
    ${cuerpo}
    <p style="margin:28px 0 0;line-height:1.5;">Abraham<br/><span style="color:#5b6b63;">Fundador, SwapFairways</span></p>
    <p style="margin:16px 0 0;font-size:13px;color:#5b6b63;font-style:italic;">Si respondes este correo, me llega directo a mí.</p>
  </div>
</div>`;
}

function hola(nombre: string) {
  const primero = nombre.trim().split(/\s+/)[0] || nombre;
  return p(`Hola ${e(primero)}:`);
}

// ---------- T1 · Bienvenida ----------
export function t1Bienvenida(params: {
  nombre: string;
  sitio: string;
  clubNombre: string | null;
}): Correo {
  const { nombre, sitio, clubNombre } = params;
  const video = `${sitio}/#video`;
  const portada = `${sitio}/video/swf-explicativo-portada.jpg`;
  const pasoUno = clubNombre
    ? `El primer paso es publicar una oferta en ${e(clubNombre)}: una fecha y cuántos lugares tienes.`
    : `El primer paso es agregar tu club a tu perfil y publicar una oferta: una fecha y cuántos lugares tienes.`;
  const cta = clubNombre
    ? boton("Publicar mi primera oferta", `${sitio}/ofertas/nueva`)
    : boton("Completar mi perfil", `${sitio}/perfil`);

  return {
    subject: `Bienvenido a SwapFairways, ${nombre.trim().split(/\s+/)[0]}`,
    html: plantilla(
      "Así funciona en 40 segundos, y cómo activar tus 3 créditos.",
      `${hola(nombre)}
      ${p("Gracias por unirte. SwapFairways es la red de socios de clubes de golf en México que se reciben entre sí: tú abres un lugar en tu club y, a cambio, juegas en el de otros.")}
      ${p("En este video de 40 segundos te explico cómo funciona:")}
      <p style="margin:0 0 6px;"><a href="${e(video)}"><img src="${e(portada)}" alt="Ver el video: cómo funciona SwapFairways" width="492" style="display:block;width:100%;max-width:492px;height:auto;border-radius:10px;border:0;" /></a></p>
      <p style="margin:0 0 18px;font-size:14px;"><a href="${e(video)}" style="color:${VERDE};font-weight:bold;">▶ Ver el video</a></p>
      ${p(`${pasoUno} <strong>Al publicarla se activan tus 3 créditos de bienvenida</strong>, y con ellos ya puedes pedir lugar en otros clubes.`)}
      ${cta}`,
    ),
  };
}

// ---------- T2 · Créditos activados ----------
export function t2CreditosActivados(params: {
  nombre: string;
  sitio: string;
  clubNombre: string;
  fechaLabel: string;
  ofertasAbiertas: number;
}): Correo {
  const { nombre, sitio, clubNombre, fechaLabel, ofertasAbiertas } = params;
  const red =
    ofertasAbiertas > 0
      ? ` Hoy hay ${ofertasAbiertas} ${ofertasAbiertas === 1 ? "oferta abierta" : "ofertas abiertas"} en la red.`
      : " La red apenas arranca; en cuanto alguien publique cerca de ti, te aviso.";
  return {
    subject: "Listo: tus 3 créditos están activos",
    html: plantilla(
      `Tu oferta en ${clubNombre} ya está publicada.`,
      `${hola(nombre)}
      ${p(`Tu oferta en ${e(clubNombre)} para ${e(fechaLabel)} ya la pueden ver los demás socios. Te aviso por correo en cuanto alguien pida lugar.`)}
      ${p(`Mientras tanto, ya tienes <strong>3 créditos</strong> para jugar. Un club Silver cuesta 1 crédito, uno Gold 2 y uno Premium 3.${red}`)}
      ${boton("Ver dónde puedo jugar", `${sitio}/ofertas`)}`,
    ),
  };
}

// ---------- T4 · Solicitud sin respuesta ----------
export function t4SolicitudSinRespuesta(params: {
  nombre: string;
  sitio: string;
  invitado: string;
  clubNombre: string;
  fechaLabel: string;
}): Correo {
  const { nombre, sitio, invitado, clubNombre, fechaLabel } = params;
  return {
    subject: `${invitado} sigue esperando tu respuesta`,
    html: plantilla(
      `Su solicitud para jugar en ${clubNombre}, ${fechaLabel}.`,
      `${hola(nombre)}
      ${p(`Hace dos días ${e(invitado)} pidió lugar en tu ronda de ${e(clubNombre)} (${e(fechaLabel)}). Contestar rápido es lo que hace que la red funcione, aunque la respuesta sea que no.`)}
      ${boton("Responder solicitud", `${sitio}/mis-rondas`)}`,
    ),
  };
}

// ---------- T7 · Tu ronda es mañana ----------
export function t7RondaManana(params: {
  nombre: string;
  sitio: string;
  rol: "anfitrion" | "invitado";
  otros: string[]; // con quién juega: el anfitrión, o los invitados
  clubNombre: string;
  ciudad: string | null;
  hora: string;
  costoInvitado: number | null;
  offerId: string;
}): Correo {
  const { nombre, sitio, rol, otros, clubNombre, ciudad, hora, costoInvitado, offerId } = params;
  const etiqueta = rol === "invitado" ? "Anfitrión" : otros.length > 1 ? "Invitados" : "Invitado";
  const lista = otros.map(e).join(", ");
  const costo =
    costoInvitado != null && costoInvitado > 0
      ? `<li><strong>Costo estimado para el invitado:</strong> $${costoInvitado.toLocaleString("es-MX")} MXN</li>`
      : "";
  const aviso = otros.length === 1 ? `avísale a ${e(otros[0])}` : "avísales";
  return {
    subject: `Mañana juegas en ${clubNombre} a las ${hora}`,
    html: plantilla(
      "Todo lo que necesitas para la ronda.",
      `${hola(nombre)}
      ${p("Te recuerdo tu ronda de mañana:")}
      <ul style="margin:0 0 14px;padding-left:20px;line-height:1.7;">
        <li><strong>Club:</strong> ${e(clubNombre)}${ciudad ? `, ${e(ciudad)}` : ""}</li>
        <li><strong>Hora:</strong> ${e(hora)}</li>
        <li><strong>${etiqueta}:</strong> ${lista}</li>
        ${costo}
      </ul>
      ${p(`En la página de la ronda están el reglamento del club y el desglose de costos. Si algo cambia, ${aviso} cuanto antes.`)}
      ${boton("Ver detalles de la ronda", `${sitio}/ofertas/${offerId}`)}`,
    ),
  };
}

// ---------- T8 · Después de la ronda ----------
export function t8MarcarJugada(params: {
  nombre: string;
  sitio: string;
  invitados: string[];
  clubNombre: string;
  creditos: number;
}): Correo {
  const { nombre, sitio, invitados, clubNombre, creditos } = params;
  const quien = invitados.length === 1 ? invitados[0] : "tus invitados";
  return {
    subject: `¿Cómo estuvo la ronda con ${quien}?`,
    html: plantilla(
      "Márcala como jugada para recibir tus créditos.",
      `${hola(nombre)}
      ${p(`Si la ronda en ${e(clubNombre)} se jugó, márcala como jugada: así recibes tus ${creditos} ${creditos === 1 ? "crédito" : "créditos"}. Después puedes dejarle una reseña a ${e(quien)}.`)}
      ${boton("Marcar como jugada", `${sitio}/mis-rondas`)}`,
    ),
  };
}

export function t8Resena(params: {
  nombre: string;
  sitio: string;
  anfitrion: string;
  clubNombre: string;
  requestId: string;
}): Correo {
  const { nombre, sitio, anfitrion, clubNombre, requestId } = params;
  return {
    subject: `¿Cómo te fue en ${clubNombre}?`,
    html: plantilla(
      `Una reseña corta de ${anfitrion} ayuda a toda la red.`,
      `${hola(nombre)}
      ${p(`Espero que hayas disfrutado ${e(clubNombre)}. Una reseña corta de ${e(anfitrion)} ayuda a que otros socios se animen a recibir y a visitar.`)}
      ${boton("Dejar reseña", `${sitio}/rondas/${requestId}/resena`)}`,
    ),
  };
}
