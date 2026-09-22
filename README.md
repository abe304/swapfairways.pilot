# SwapFairways (SWF) — Piloto

Piloto de una red P2P donde socios de un club de golf intercambian ("swap", no
reventa) tee times entre ellos usando un sistema de créditos internos, no
dinero real. Este repo es el mínimo viable para probar el mecanismo con ~50
socios de un mismo club antes de construir algo más ambicioso.

## Stack

- [Next.js 16](https://nextjs.org/) (App Router) + TypeScript + Tailwind CSS v4
- [Supabase](https://supabase.com/) (Postgres + Auth + Storage)
- Despliegue recomendado: [Vercel](https://vercel.com/)

## Modo demo (sin Supabase todavía)

Si corres `npm run dev` sin configurar `.env.local` (o con las variables
placeholder), la app arranca automáticamente en **modo demo**: un backend
falso en memoria (`lib/mock/`) con datos de ejemplo ya cargados, para poder
navegar toda la app sin crear un proyecto Supabase primero.

- Entra con **`test@test.com`** / **`testtest`**.
- Los datos viven en memoria del proceso de `next dev` — se reinician si
  reinicias el servidor. No es apto para el piloto real con socios, solo
  para explorar el flujo y el diseño.
- En cuanto configures `NEXT_PUBLIC_SUPABASE_URL`/`NEXT_PUBLIC_SUPABASE_ANON_KEY`
  reales (ver [Setup local](#setup-local) abajo), el modo demo se desactiva
  solo y la app usa Supabase de verdad.

## Cómo funciona el piloto

1. Cualquier socio se registra con email/contraseña y recibe créditos de bienvenida.
2. Un socio anfitriona una ronda (club, fecha, hora, pases, caddie/carrito, costo estimado en campo).
3. Otro socio explora las ofertas de su club y solicita unirse (1 crédito).
4. El anfitrión aprueba o rechaza. Al aprobar, se liberan los datos de contacto y detalles finos (punto de encuentro, código de vestimenta).
5. **El crédito no se descuenta al aprobar.** Se mantiene en espera hasta el día de la ronda, cuando el anfitrión marca la ronda como "jugada" — ahí se descuenta 1 crédito al invitado y se acredita 1 al anfitrión. Esto evita fraude (reservar y no presentarse).
6. Ambas partes dejan una reseña obligatoria (rating + tags de comportamiento) que alimenta la reputación visible en cada perfil.

**Nota sobre costos en campo:** el costo estimado de caddie/carrito es solo informativo — se paga directo en el club, no a través de la app. Este piloto no procesa pagos reales ni seguros automatizados.

## Fuera de alcance de este piloto

Deliberadamente no incluido (ver brief original para el detalle de por qué):

- Círculos de confianza / comunidades
- Sistema de referidos con créditos
- Membresía paga ("SWF Elite")
- Búsqueda por destino con fechas flexibles tipo viaje
- Integración automática con la API de GHIN (el handicap es un campo manual)
- Seguro o depósito en garantía automatizado, o cualquier cobro de dinero real
- Apps nativas o push notifications (solo web responsive)
- Panel de administración dedicado — usa directamente **Supabase Studio** para dar de alta créditos manualmente, resolver disputas o revisar solicitudes.

## Setup local

### 1. Crear el proyecto de Supabase

1. Crea un proyecto nuevo en [supabase.com](https://supabase.com/dashboard).
2. Ve a **SQL Editor** y ejecuta, en orden, el contenido de cada archivo en [`supabase/migrations/`](supabase/migrations/):
   - `0001_init.sql` — tablas, triggers, funciones y políticas de RLS.
   - `0002_clubs_mexico.sql` — catálogo de 166 campos de golf de México.
   - `0003_reglas_flexibles_ghin.sql` — GHIN, reglas/obligaciones por club, costo variable en créditos, ofertas con fecha flexible.
3. Ve a **Project Settings > API** y copia la `Project URL`, la `anon public key` y la `service_role key`.

### 2. Variables de entorno

```bash
cp .env.example .env.local
```

Llena `.env.local` con los valores del paso anterior. **Nunca** subas `.env.local` a git ni compartas la `service_role key`.

### 3. Instalar dependencias

```bash
npm install
```

### 4. (Opcional) Cargar datos de prueba

Crea 3 clubes, 8 socios (todos con la contraseña `SwapFairways2026!`) y varias ofertas/solicitudes en distintos estados (pendiente, aprobada, jugada con reseñas) para poder probar el flujo completo sin capturar todo a mano:

```bash
npm run seed
```

Pensado para correr **una sola vez** sobre un proyecto recién creado. Si necesitas volver a correrlo, borra primero los usuarios de prueba (`*@swf-pilot.test`) desde **Authentication > Users** en Supabase Studio.

### 5. Correr en local

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000). Si corriste el seed, puedes entrar con cualquiera de los emails de `scripts/seed.ts` y la contraseña `SwapFairways2026!`.

## Despliegue en Vercel

1. Sube el repo a GitHub.
2. Importa el repo en [Vercel](https://vercel.com/new).
3. Agrega las variables de entorno `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` y `SUPABASE_SERVICE_ROLE_KEY` en la configuración del proyecto (esta última ya se usa en producción para poder mandar el email de nueva solicitud al anfitrión — ver siguiente sección).

### Notificación por email al anfitrión (opcional)

Cuando alguien solicita unirse a una ronda, la app intenta avisarle por email al anfitrión. Es opcional — sin configurarlo, todo funciona igual, simplemente no se manda el correo.

1. Crea una cuenta gratis en [resend.com](https://resend.com) y genera un API key.
2. Agrega `RESEND_API_KEY` en las variables de entorno de Vercel (y en tu `.env.local` si quieres probarlo en local).
3. Puedes dejar el remitente de pruebas de Resend (`onboarding@resend.dev`, ya viene por default) o configurar `RESEND_FROM_EMAIL` con tu propio dominio verificado en Resend.

## Administración durante el piloto

No hay panel de admin dedicado. Usa **Supabase Studio** (Table Editor) directamente sobre el proyecto para:

- Dar de alta créditos manualmente: inserta una fila en `credit_transactions` con `tipo = 'ajuste_admin'` (el balance en `profiles.creditos_balance` se actualiza solo via trigger).
- Resolver disputas (ej. un anfitrión no marca una ronda como jugada, o un no-show): edita directamente `requests` y, si aplica, agrega los `credit_transactions` correspondientes.
- Ver todas las solicitudes: tabla `requests`.
- Verificar manualmente el handicap capturado por cada socio: columna `handicap_manual` en `profiles`.
- Configurar reglas/obligaciones de un club (caddie, carrito, GHIN obligatorios, recomendación de llegada) y su costo en créditos: tabla `clubs`, columnas `reglamento`, `requiere_caddie_invitado`, `carrito_obligatorio`, `requiere_ghin`, `recomendacion_llegada`, `costo_creditos`.

## Modelo de datos

Ver [`supabase/migrations/`](supabase/migrations/) — es la fuente de verdad. Resumen:

- `clubs` (incluye `reglamento`, obligaciones estructuradas `requiere_caddie_invitado`/`carrito_obligatorio`/`requiere_ghin`, `recomendacion_llegada` y `costo_creditos` — todo editable desde Supabase Studio por ahora, no hay todavía un login separado para que cada club administre lo suyo), `profiles` (1:1 con `auth.users`, incluye `ghin_id`), `profile_contacts` (teléfono, visible solo entre partes con una solicitud aprobada/jugada)
- `tee_time_offers` (`fecha`/`hora` son nullable — `fecha_flexible = true` significa "sin fecha fija, a coordinar con quien solicite"), `requests` (`creditos_cobrados` refleja el `costo_creditos` del club al momento de solicitar), `credit_transactions` (ledger — `profiles.creditos_balance` se mantiene por trigger), `reviews`
- Toda mutación sensible (crear solicitud, aprobar, rechazar, marcar jugada) pasa por funciones `SECURITY DEFINER` (`create_join_request`, `approve_request`, `reject_request`, `mark_request_played`) que validan reglas de negocio server-side, no solo en el cliente.

## Catálogo de clubes

[`supabase/migrations/0002_clubs_mexico.sql`](supabase/migrations/0002_clubs_mexico.sql) carga 166 campos de golf de México (fuente en [`lib/data/clubs-mexico.ts`](lib/data/clubs-mexico.ts), usada también por el modo demo y el seed):

- **gogolf.mx** (36): plataforma de reserva pay-and-play — dirección postal exacta.
- **Federación Mexicana de Golf** (107): mapa oficial "Campos de Golf Federados en México" — coordenadas exactas (usadas directo para el link de Maps), pero sin dirección postal ni ciudad, y el estado se estimó por cercanía cuando el KML no lo daba (puede haber algún error puntual cerca de límites estatales).
- **Compilación manual** (~23): clubes privados conocidos no cubiertos por las dos fuentes anteriores — dirección aproximada (nombre + ciudad + estado), no verificada.

Cada club tiene `tipo` ('privado' o 'publico') — la mayoría de los socios de SWF pertenecen a clubes privados, así que verifica que el club real de tu grupo piloto esté cargado correctamente (o corrígelo) en Supabase Studio antes de invitar gente.
