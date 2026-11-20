# Correos de ciclo de vida — SwapFairways

Versión 1 · 2026-11-19 · Para revisar antes de programar.

## Decisiones tomadas
- **Meta del piloto:** ofertas publicadas **y** rondas jugadas. Hay que demostrar que, aunque somos pocos socios, el interés es alto.
- **Créditos de bienvenida:** los 3 créditos se activan al **publicar la primera oferta**, no al registrarse (migración 0021). Quien ya los tenía los conserva.
- **Canal:** solo correo por ahora.
- **Firma:** Abraham, en primera persona. Las respuestas llegan a su correo (`reply_to`).
- **Opiniones:** respondiendo al correo, sin formularios.
- **Mensualidad para socios sin club:** es de la fase 2, fuera de esta versión.

## Lo aprendido de Airbnb, Kindred y Marriott Bonvoy
1. **Lo útil gana a lo motivacional** (Airbnb). Los correos atados a una ronda real (solicitud, recordatorio, reseña) son los que más se abren y los que hacen que la plataforma funcione.
2. **Das para recibir, con datos concretos** (Kindred). Se empuja a anfitrionar mostrando demanda real y lo que el socio gana, no con "eres parte de una comunidad". Regla: **solo usamos números reales**; si un número es bajo, no lo mostramos.
3. **El saldo es el gancho** (Bonvoy). Créditos sin usar, cuánto vale tu club, qué puedes hacer con lo que tienes.
4. **Una acción por correo**, y la secuencia se detiene en cuanto el socio hace lo que se le pide.

## Reglas generales
- **Transaccionales (T):** se mandan siempre, porque responden a algo que hizo el socio u otra persona.
- **De seguimiento (S):** como máximo 1 por semana por socio. Se detienen si el socio ya hizo la acción. Llevan un enlace para dejar de recibirlos.
- Asunto corto, sin mayúsculas gritonas ni emojis. Texto corto, un botón.
- Nunca se manda un correo de seguimiento el mismo día que un transaccional.

## Mapa de puntos de contacto

| # | Correo | Cuándo | Condición / se cancela si… | Acción (botón) | Métrica | Estado |
|---|---|---|---|---|---|---|
| T1 | Bienvenida + video | Al registrarse | — | Publicar mi primera oferta | % que publica en 14 días | **Programado** |
| T2 | Se activaron tus créditos | Al publicar la 1a oferta | Solo la primera vez | Ver clubes para jugar | % que solicita en 14 días | **Programado** |
| T3 | Nueva solicitud (al anfitrión) | Al solicitar | — | Revisar solicitud | Tiempo de respuesta | **Ya existe** |
| T4 | Tienes una solicitud esperando | 48 h sin respuesta | Se cancela si aprueba o rechaza | Responder | % respondidas en 72 h | **Programado** |
| T5 | Solicitud aprobada (al invitado) | Al aprobar | — | Agregar al calendario | — | **Ya existe** |
| T6 | Solicitud no aprobada | Al rechazar | — | Ver otras ofertas | % que vuelve a solicitar | Nuevo |
| T7 | Tu ronda es mañana | 24 h antes (a los dos) | Solo con fecha fija | Ver detalles | Rondas que no se cancelan | **Programado** |
| T8 | ¿Cómo estuvo la ronda? | Día siguiente | Anfitrión: marcar jugada · los dos: reseña | Marcar jugada / Dejar reseña | % jugadas marcadas en 48 h | **Programado** |
| T9 | Tu invitado jugó: ganaste créditos | Al pagar el referido | — | Invitar a otro socio | Referidos por socio | Nuevo |
| S1 | Tu club es parte de la red | Día 7 sin ofertas | Se cancela si publica | Publicar oferta | % que publica después de S1 | Nuevo (tu punto 2) |
| S2 | Gracias por recibir a tu primer invitado | 1a ronda jugada como anfitrión | Solo una vez | Responder con feedback | % que responde | Nuevo (tu punto 3) |
| S3 | Tu primera salida con SwapFairways | 1a ronda jugada como invitado | Solo una vez | Publicar una oferta en tu club | % que publica después | Nuevo (tu punto 4) |
| S4 | Te guardamos tu lugar | Día 30 sin actividad | Sin ofertas ni solicitudes en 30 días; solo una vez | Ver ofertas | % que vuelve | Nuevo (tu punto 6) |
| F2 | Mensualidad para socios sin club | Fase 2 | Por definir | — | — | Fase 2 (tu punto 5) |

**Orden sugerido para construir:**
1. T1, T2, T4, T7 y T8: sin ellos las rondas se atoran.
2. S1, S2 y S3.
3. T6, T9 y S4.

## Cómo medimos que hay interés
Para mostrar que el interés es alto aunque seamos pocos, se ven bien los porcentajes y los tiempos, no los totales:
- **Activación:** % de registrados que publica su primera oferta en 14 días.
- **Demanda:** solicitudes por oferta publicada, y % de ofertas que reciben al menos una solicitud.
- **Velocidad:** horas promedio entre solicitud y respuesta.
- **Rondas:** rondas jugadas por socio activo al mes.
- **Opiniones:** % que responde los correos S2 y S3, y qué dicen (se registra a mano).

---

## Textos

Las variables van entre `{llaves}`. Todos firman:

> Abraham
> Fundador, SwapFairways
> *Si respondes este correo, me llega directo a mí.*

### T1 · Bienvenida
**Asunto:** Bienvenido a SwapFairways, {nombre}
**Preencabezado:** Así funciona en 40 segundos, y cómo activar tus 3 créditos.

Hola {nombre}:

Gracias por unirte. SwapFairways es la red de socios de clubes de golf en México que se reciben entre sí: tú abres un lugar en tu club y, a cambio, juegas en el de otros.

En este video de 40 segundos te explico cómo funciona: *(portada del video con enlace a la sección del video en la home)* **[▶ Ver el video]**

El primer paso es publicar una oferta en {club}: una fecha y cuántos lugares tienes. **Al publicarla se activan tus 3 créditos de bienvenida**, y con ellos ya puedes pedir lugar en otros clubes.

**[Publicar mi primera oferta]**

> Variante sin club en el perfil: "El primer paso es agregar tu club a tu perfil y publicar una oferta…" con el botón **[Completar mi perfil]**.

### T2 · Créditos activados
**Asunto:** Listo: tus 3 créditos están activos
**Preencabezado:** Tu oferta en {club} ya está publicada.

Hola {nombre}:

Tu oferta en {club} para el {fecha} ya la pueden ver los demás socios. Te aviso por correo en cuanto alguien pida lugar.

Mientras tanto, ya tienes **3 créditos** para jugar. Un club Silver cuesta 1 crédito, uno Gold 2 y uno Premium 3. Hoy hay {n_ofertas} ofertas abiertas en la red.

**[Ver dónde puedo jugar]**

> Si `n_ofertas` es 0, se cambia la frase por: "La red apenas arranca; en cuanto alguien publique cerca de ti, te aviso."

### T4 · Solicitud sin respuesta
**Asunto:** {invitado} sigue esperando tu respuesta
**Preencabezado:** Su solicitud para jugar en {club} el {fecha}.

Hola {nombre}:

Hace dos días {invitado} pidió lugar en tu ronda del {fecha} en {club}. Contestar rápido es lo que hace que la red funcione, aunque la respuesta sea que no.

**[Responder solicitud]**

### T6 · Solicitud no aprobada
**Asunto:** Tu solicitud en {club} no se pudo confirmar
**Preencabezado:** No te cobramos ningún crédito.

Hola {nombre}:

Esta vez el anfitrión de {club} no pudo confirmar tu lugar para el {fecha}. Tus créditos siguen intactos.

Hay otras {n_ofertas} ofertas abiertas en la red; quizá alguna te queda.

**[Ver otras ofertas]**

### T7 · Recordatorio 24 h antes
**Asunto:** Mañana juegas en {club} a las {hora}
**Preencabezado:** Todo lo que necesitas para la ronda.

Hola {nombre}:

Te recuerdo tu ronda de mañana:

- **Club:** {club}, {ciudad}
- **Hora:** {hora}
- **{Anfitrión | Invitado}:** {otro_nombre}
- **Costos para el invitado:** {desglose_costos}
- **Reglamento del club:** {enlace_reglamento}

Si algo cambia, avísale a {otro_nombre} cuanto antes.

**[Ver detalles de la ronda]**

### T8 · Después de la ronda
**Al anfitrión**
**Asunto:** ¿Cómo estuvo la ronda con {invitado}?

Hola {nombre}:

Si la ronda de ayer se jugó, márcala como jugada: así recibes tus {creditos} créditos. Después puedes dejarle una reseña a {invitado}.

**[Marcar como jugada]**

**Al invitado**
**Asunto:** ¿Cómo te fue en {club}?

Hola {nombre}:

Espero que hayas disfrutado {club}. Una reseña corta de {anfitrion} ayuda a que otros socios se animen a recibir y a visitar.

**[Dejar reseña]**

### T9 · Referido
**Asunto:** {referido} jugó su primera ronda: ganaste {n} crédito
**Preencabezado:** Gracias por traer a un socio a la red.

Hola {nombre}:

{referido}, a quien invitaste, ya jugó su primera ronda en SwapFairways. Te sumamos {n} crédito; tu saldo es de {saldo}.

Cada socio nuevo es un club más donde puedes jugar. Tu código sigue activo: **{codigo}**

**[Invitar a otro socio]**

### S1 · Día 7 sin ofertas (tu punto 2)
**Asunto:** {club} todavía no tiene ofertas en la red
**Preencabezado:** Una oferta activa tus 3 créditos.

Hola {nombre}:

La red funciona porque cada socio abre un lugar en su club. Hoy hay {n_clubes} clubes con ofertas y a {club} todavía le falta la suya.

Como {club} es {nivel}, cada invitado que recibes te da **{creditos_nivel} créditos**, que luego usas para jugar en otros clubes. Y con tu primera oferta se activan tus 3 créditos de bienvenida.

Publicarla toma menos de un minuto: una fecha y cuántos lugares.

**[Publicar oferta en {club}]**

### S2 · Primer hosteo (tu punto 3)
**Asunto:** Gracias por recibir a {invitado}
**Preencabezado:** Y una pregunta rápida.

Hola {nombre}:

Gracias por recibir a {invitado} en {club}. Eres de los primeros socios en hacerlo, y esto es justo lo que queremos que pase en la red.

Ya tienes {saldo} créditos para jugar donde quieras.

Una pregunta y te dejo en paz: **¿qué fue lo más difícil o lo que más te estorbó del proceso?** Responde este correo, aunque sea con una línea; lo leo todo.

**[Ver dónde usar mis créditos]**

### S3 · Primera salida como invitado (tu punto 4)
**Asunto:** Tu primera ronda con SwapFairways
**Preencabezado:** Para esto la hicimos.

Hola {nombre}:

Jugar en {club} gracias a otro socio es justo para lo que hicimos SwapFairways. Gracias por confiar en la red tan pronto.

Me ayudaría mucho saber **¿qué mejorarías para que repitas?** Responde este correo; me llega directo a mí.

Y si quieres que alguien viva lo mismo en tu club, publica una oferta en {club_propio}.

**[Publicar oferta en {club_propio}]**

> Si el socio no tiene club en su perfil, se omite el último párrafo y el botón cambia a **[Ver más ofertas]**.

### S4 · Día 30 sin actividad (tu punto 6)
**Asunto:** Lo nuevo en SwapFairways este mes
**Preencabezado:** {n_clubes_nuevos} clubes nuevos y {n_ofertas} ofertas abiertas.

Hola {nombre}:

Hace un mes que te uniste y quería contarte cómo va la red:

- {n_socios} socios de {n_clubes_socios} clubes
- {n_ofertas} ofertas abiertas, {n_cerca} en {estado}
- Clubes nuevos en el directorio: {clubes_nuevos}

Una red así solo funciona si sus socios la usan, y quiero que valga la pena para ti. Si algo te frenó, respóndeme y cuéntame.

**[Ver ofertas]**

> Solo mostramos las líneas cuyos números se ven bien; si un número es bajo, quitamos esa línea.

---

## Cómo está programado (T1, T2, T4, T7 y T8)
- **Código:** las plantillas están en `lib/correos/plantillas.ts` (si cambias un texto aquí, cámbialo también allá) y la lógica de envío en `lib/correos/enviar.ts`.
- **T1** sale desde el registro y **T2** desde "Publicar oferta". T2 solo se manda si el bono de la 0021 se acaba de dar, así que no le llega a quien ya tenía sus créditos.
- **T4, T7 y T8** los manda `/api/cron/correos`, que Vercel Cron llama todos los días a las 8:00 am de CDMX (`vercel.json`). La ruta exige la variable `CRON_SECRET`.
- **Antirrepetición:** la tabla `correos_enviados` (migración 0022) evita mandar dos veces el mismo correo. Si un envío falla, se reintenta en la siguiente revisión.
- **Sin correos atrasados:** T8 solo cubre rondas de los últimos 3 días.
- **Rondas con fecha flexible:** no reciben T7 ni T8.
- **Remitente:** "Abraham de SwapFairways", con `reply_to` al correo de `NEXT_PUBLIC_CONTACT_EMAIL`.

## Cómo está programado (S1, S2 y S3)
- **Cuándo:** en la misma revisión diaria de `/api/cron/correos`, una sola vez por persona.
  - **S1:** entre 7 y 13 días después de registrarse, si tiene club en su perfil y nunca ha publicado una oferta. Si otro socio ya publicó en su club, el asunto cambia a "Tu oferta en {club} todavía no está en la red"; si no hay ningún club con ofertas, dice que la red apenas arranca.
  - **S2:** su primera ronda como anfitrión se marcó jugada en los últimos 3 días.
  - **S3:** su primera ronda como invitado se marcó jugada hace 1 a 4 días (un día después del T8 de reseña, para no mandarle dos correos juntos).
- **Baja:** los S llevan al pie "Dejar de recibirlos" y los encabezados `List-Unsubscribe` (botón de baja de Gmail/Apple Mail). El enlace va firmado con `CORREOS_SECRET` o, si no existe, `CRON_SECRET`; no pide sesión. Guarda `profiles.correos_seguimiento = false` (migración 0023). La columna no está entre las que el usuario puede editar: solo la cambia el servidor. Los T1–T8 siguen llegando.
- **Si falta la migración 0023**, los S no salen (se registra el error) y T4–T8 siguen normales.

## Pendiente
- T6, T9 y S4.
