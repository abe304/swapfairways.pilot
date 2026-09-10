# SwapFairways (SWF) — Piloto

Piloto de una red P2P donde socios de un club de golf intercambian ("swap", no
reventa) tee times entre ellos usando un sistema de créditos internos, no
dinero real. Este repo es el mínimo viable para probar el mecanismo con ~50
socios de un mismo club antes de construir algo más ambicioso.

## Stack

- [Next.js 16](https://nextjs.org/) (App Router) + TypeScript + Tailwind CSS v4
- [Supabase](https://supabase.com/) (Postgres + Auth + Storage)
- Despliegue recomendado: [Vercel](https://vercel.com/)

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
2. Ve a **SQL Editor** y ejecuta el contenido de [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql). Esto crea las tablas, triggers, funciones y políticas de RLS.
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
3. Agrega las variables de entorno `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY` en la configuración del proyecto (la `service_role key` **no** se necesita en producción — solo se usa para el seed local).

## Administración durante el piloto

No hay panel de admin dedicado. Usa **Supabase Studio** (Table Editor) directamente sobre el proyecto para:

- Dar de alta créditos manualmente: inserta una fila en `credit_transactions` con `tipo = 'ajuste_admin'` (el balance en `profiles.creditos_balance` se actualiza solo via trigger).
- Resolver disputas (ej. un anfitrión no marca una ronda como jugada, o un no-show): edita directamente `requests` y, si aplica, agrega los `credit_transactions` correspondientes.
- Ver todas las solicitudes: tabla `requests`.
- Verificar manualmente el handicap capturado por cada socio: columna `handicap_manual` en `profiles`.

## Modelo de datos

Ver [`supabase/migrations/0001_init.sql`](supabase/migrations/0001_init.sql) — es la fuente de verdad. Resumen:

- `clubs`, `profiles` (1:1 con `auth.users`), `profile_contacts` (teléfono, visible solo entre partes con una solicitud aprobada/jugada)
- `tee_time_offers`, `requests`, `credit_transactions` (ledger — `profiles.creditos_balance` se mantiene por trigger), `reviews`
- Toda mutación sensible (crear solicitud, aprobar, rechazar, marcar jugada) pasa por funciones `SECURITY DEFINER` (`create_join_request`, `approve_request`, `reject_request`, `mark_request_played`) que validan reglas de negocio server-side, no solo en el cliente.
