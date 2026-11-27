# Equipo SwapFairways: organigrama, KPIs y dashboard

Propuesta (2026-11-25). Objetivo: que cada quien sepa qué le toca, lo registre en el sistema y que el fundador vea el avance sin tener que preguntar.

## Organigrama

```
Abraham Gonzalez — Fundador y Director General
├── Diego Arriaga — Director de Operaciones y Tecnología (segundo al mando)
│   └── Analistas de datos
├── Director de Marketing (growth, retención, comunicación, campañas)
├── Director de Relaciones Públicas (clubes, FMG, grupos regionales, medios)
├── Director de Finanzas (dinero, gasto en publicidad, ingresos, P&L)
└── Equipo Comercial (independiente por ahora: leads, torneos, patrocinios, alianzas)
```

**Diego Arriaga** (perfil inventado): ingeniero en computación, 34 años, ex líder técnico en una fintech mexicana, golfista con hándicap 12. Mantiene la app funcionando, decide qué se construye cada semana, cuida la base de datos y dirige a los analistas.

## Roles, KPIs y cadencia

Las métricas marcadas **(auto)** salen solas de la base de la app. Las demás salen de lo que cada quien registra.

| Rol | Responsabilidad | KPIs | Cadencia |
|---|---|---|---|
| **Fundador** | Visión, prioridades, revisa el tablero, desbloquea | Rondas jugadas por semana **(auto)**, avance de cada rol contra su meta | Revisión semanal (lunes), estrategia mensual |
| **Operaciones y Tecnología** | App estable y actualizada, despliegues, migraciones, soporte | Despliegues y arreglos registrados, incidentes abiertos, tiempo de respuesta de soporte, correos automáticos enviados **(auto)** | Semanal |
| **Analistas** | Revisar uso y detectar dónde fallamos | Hallazgos registrados con su acción propuesta; embudo registro → oferta → solicitud → ronda jugada **(auto)**; solicitudes sin respuesta **(auto)** | Semanal (reporte de hallazgos), mensual (análisis profundo) |
| **Marketing** | Adquisición, retención, comunicación, campañas | Registros nuevos **(auto)**, activación (publicó su primera oferta) **(auto)**, socios activos en 30 días **(auto)**, contactos de Instagram y respuestas, campañas lanzadas | Semanal |
| **Relaciones Públicas** | Clubes, Federación Mexicana de Golf, grupos regionales, podcasts y entrevistas | Clubes con al menos una oferta **(auto)**, reuniones con clubes y federación, entrevistas conseguidas y publicadas, pipeline por etapa | Semanal (actividad), mensual (relaciones cerradas) |
| **Comercial** | Leads, torneos, patrocinios, alianzas con marcas de golf | Leads nuevos, propuestas enviadas, patrocinios cerrados (monto), torneos organizados | Semanal (pipeline), mensual (cierres) |
| **Finanzas** | Caja, gasto en publicidad, ingresos, P&L | Gasto del mes por categoría, ingresos, resultado (P&L), costo por registro = gasto en publicidad ÷ registros nuevos **(auto)** | Mensual (P&L), semanal (gasto en publicidad) |

## Cómo se registran las actividades (sin que el fundador pida nada)

Todo vive dentro de la app, con el mismo inicio de sesión que ya existe:

1. **`/equipo` — espacio de trabajo de cada miembro.** Cada persona entra con su cuenta y ve su rol, su meta semanal y tres botones:
   - **Registrar actividad** (30 segundos): tipo (según su rol, p. ej. "Reunión con club", "Contacto por Instagram", "Despliegue", "Hallazgo"), con quién, resultado y enlace.
   - **Pipeline**: clubes, federación, medios, patrocinadores y alianzas con su etapa (identificado → contactado → en conversación → propuesta → cerrado / perdido), próximo paso y fecha.
   - **Check-in semanal** (lunes): logros, bloqueos y compromisos de la semana con fecha.
2. **Finanzas** registra ingresos y gastos (categoría y canal); el P&L mensual y el costo por registro se calculan solos.
3. **`/admin/equipo` — tablero del fundador.** Junta los KPIs de producto en vivo con lo registrado por cada rol y pinta un semáforo por persona: verde si va en meta, amarillo si va atrasado, rojo si no ha registrado nada en 7 días o no hizo su check-in. También muestra compromisos vencidos y próximos pasos del pipeline atrasados.
4. **Recordatorios automáticos** (en la revisión diaria que ya corre a las 8:00): el lunes, correo a quien no ha hecho su check-in; y un resumen semanal al fundador con el semáforo. Así el sistema persigue, no el fundador.

## Datos nuevos (migración 0026)

- `equipo_miembros`: quién es del equipo, su rol y a quién reporta (los analistas a Operaciones).
- `equipo_actividades`: bitácora de actividades por rol.
- `equipo_pipeline`: relaciones y oportunidades (clubes, FMG, medios, patrocinios, alianzas, leads).
- `equipo_checkins`: check-in semanal con logros, bloqueos y compromisos.
- `finanzas_movimientos`: ingresos y gastos para el P&L.
- `equipo_metas`: meta semanal de actividades por rol (editable por el fundador).

Seguridad: solo los miembros del equipo y los administradores ven estas tablas; cada quien solo crea y edita sus propios registros; finanzas solo la ven el fundador (admin) y el rol de Finanzas. Los KPIs de producto se leen en el servidor y solo los ve un administrador.

## Cómo quedó construido (2026-11-25)

- **`/equipo`** (Mi semana): meta semanal con avance, semáforo propio, registrar actividad, check-in con hasta 3 compromisos con fecha, compromisos abiertos y lo que hace el resto del equipo.
- **`/equipo/pipeline`**: alta y seguimiento por categoría y etapa; cambiar de etapa deja una actividad en la bitácora automáticamente.
- **`/equipo/finanzas`** (admin y rol Finanzas): ingresos y gastos, P&L de 6 meses y costo por registro con los registros reales.
- **`/admin/equipo`** (tablero del fundador): 12 KPIs de la app en vivo, embudo, últimas 8 semanas, semáforo por rol (incluye vacantes), compromisos vencidos, bloqueos, pipeline, actividad reciente, alta de miembros y metas por rol.
- **Correos internos** en la revisión diaria (`lib/equipo/correos.ts`): **E1** lunes, recordatorio de check-in; **E2** martes, resumen semanal a los administradores; **E3** diario, compromiso vencido ayer.
- La liga **Equipo** aparece en el menú para miembros activos y administradores.

### Para activarlo
1. Correr `supabase/migrations/0026_equipo.sql` en el SQL Editor de Supabase.
2. Cada miembro se registra en la app con su cuenta; en `/admin/equipo` → Miembros se le asigna su rol.
3. Ajustar las metas semanales por rol si las propuestas no cuadran.

## Agentes de IA (2026-11-25)

Por ahora los roles los ejecutan agentes de IA, no personas; todo vive en `/admin/equipo` (la liga **Equipo** del menú).

- **Quiénes:** Operaciones y Tecnología ("Diego"), Analista, Marketing, Relaciones Públicas, Comercial y Finanzas. El fundador no tiene agente: él da las directrices. Misión, cadencia y herramientas de cada uno en `lib/agentes/config.ts`.
- **Cuándo:** `/api/cron/agentes` corre diario a las 9:00 CDMX y cada agente trabaja los días que le tocan (Operaciones y Marketing de lunes a viernes, Analista lunes y jueves, RP lunes/miércoles/viernes, Comercial martes y jueves, Finanzas los lunes). También hay botón **Correr ahora**.
- **Cómo:** AI SDK (`ToolLoopAgent`) con `anthropic/claude-haiku-5.5` por AI Gateway (desde el 2026-11-27; antes Sonnet 5.5, que el plan gratis no incluye) (se cambia con `AGENTES_MODELO`). Cada corrida lee las directrices, su reporte anterior, sus compromisos y lo que el fundador decidió sobre sus propuestas; usa herramientas sobre los datos reales (KPIs, socios sin contacto, solicitudes atoradas, clubes, pipeline, finanzas) y búsqueda web (Perplexity vía Gateway) para RP, Comercial y Marketing.
- **Autonomía:** lo interno lo hacen solos (registrar actividades y hallazgos, pipeline, compromisos). Lo externo (correos, WhatsApp, Instagram, publicaciones, gasto, tareas técnicas) queda en la cola **Por aprobar**: el fundador edita, aprueba o rechaza con comentario. Los correos aprobados salen por Resend; lo demás se manda a mano con el texto aprobado y se marca como hecho. Máximo 6 propuestas por corrida.
- **Directrices:** en el tablero, para todos o por agente; tienen prioridad sobre la misión.
- **Privacidad:** la IA ve nombres y actividad de socios, nunca correos ni teléfonos; el correo de un socio se busca al momento de enviar.
- El resumen semanal de los martes (E2) incluye a los agentes y cuántas propuestas esperan aprobación.

### Para activarlo
1. Correr `0026_equipo.sql` y luego `0027_agentes.sql` en el SQL Editor.
2. En Vercel, activar **AI Gateway** en el proyecto (la autenticación OIDC es automática en los despliegues) o agregar `AI_GATEWAY_API_KEY`. El costo se cobra por uso en la cuenta de Vercel.
3. Desplegar (el cron nuevo está en `vercel.json`) y escribir las primeras directrices.
