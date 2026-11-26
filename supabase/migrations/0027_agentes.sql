-- 0027: Agentes de IA que ejecutan los roles del equipo (ver
-- docs/equipo-propuesta.md, sección "Agentes de IA"). Requiere la 0026.
--
--  * equipo_directrices: la guía del fundador, general o por rol. Cada
--    agente la lee en cada corrida.
--  * agente_corridas: bitácora de cada corrida (reporte, tokens, errores).
--  * agente_acciones: cola de aprobación. Todo lo que sale hacia afuera
--    (correos, mensajes, publicaciones, gasto) espera aquí a que el
--    fundador lo apruebe, edite o rechace. Los comentarios del fundador
--    vuelven al agente en su siguiente corrida.
--  * Las actividades, pipeline y compromisos de un agente se guardan en las
--    tablas de la 0026 con autor vacío y la columna `agente` = rol.
--
-- Los agentes escriben con la service role desde el servidor; solo el admin
-- lee y decide. Segura de correr más de una vez.

-- ---------- Autoría de agentes en las tablas del equipo ----------
alter table public.equipo_actividades alter column autor_id drop not null;
alter table public.equipo_actividades add column if not exists agente text;

alter table public.equipo_pipeline alter column responsable_id drop not null;
alter table public.equipo_pipeline add column if not exists agente text;

alter table public.equipo_compromisos alter column autor_id drop not null;
alter table public.equipo_compromisos add column if not exists agente text;

create index if not exists equipo_actividades_agente_idx on public.equipo_actividades (agente, fecha desc)
  where agente is not null;

-- ---------- Directrices del fundador ----------
create table if not exists public.equipo_directrices (
  id uuid primary key default gen_random_uuid(),
  rol text, -- null = aplica a todos los agentes
  texto text not null check (length(trim(texto)) > 0),
  activa boolean not null default true,
  created_at timestamptz not null default now()
);

alter table public.equipo_directrices enable row level security;

drop policy if exists equipo_directrices_admin on public.equipo_directrices;
create policy equipo_directrices_admin on public.equipo_directrices
  for all using (public.es_admin()) with check (public.es_admin());

-- ---------- Corridas ----------
create table if not exists public.agente_corridas (
  id uuid primary key default gen_random_uuid(),
  rol text not null,
  origen text not null default 'cron' check (origen in ('cron', 'manual')),
  estado text not null default 'corriendo' check (estado in ('corriendo', 'ok', 'error')),
  reporte text,
  error text,
  modelo text,
  pasos integer,
  tokens_entrada integer,
  tokens_salida integer,
  inicio timestamptz not null default now(),
  fin timestamptz
);

create index if not exists agente_corridas_rol_idx on public.agente_corridas (rol, inicio desc);

alter table public.agente_corridas enable row level security;

drop policy if exists agente_corridas_admin on public.agente_corridas;
create policy agente_corridas_admin on public.agente_corridas
  for select using (public.es_admin());

-- ---------- Cola de aprobación ----------
create table if not exists public.agente_acciones (
  id uuid primary key default gen_random_uuid(),
  corrida_id uuid references public.agente_corridas (id) on delete set null,
  rol text not null,
  tipo text not null
    check (tipo in ('correo', 'whatsapp', 'mensaje_instagram', 'publicacion', 'gasto', 'tarea_tecnica', 'otro')),
  -- Destinatario externo (correo, @cuenta, teléfono o nombre) o un socio de
  -- la app (user_id): su correo se busca al enviar, nunca se le pasa a la IA.
  destinatario text,
  user_id uuid references public.profiles (id) on delete set null,
  asunto text,
  cuerpo text not null,
  justificacion text,
  monto numeric(12, 2),
  estado text not null default 'pendiente'
    check (estado in ('pendiente', 'aprobada', 'rechazada', 'ejecutada', 'fallida')),
  comentario text, -- del fundador al aprobar o rechazar
  resultado text,
  created_at timestamptz not null default now(),
  decidida_at timestamptz
);

create index if not exists agente_acciones_estado_idx on public.agente_acciones (estado, created_at desc);

alter table public.agente_acciones enable row level security;

drop policy if exists agente_acciones_admin on public.agente_acciones;
create policy agente_acciones_admin on public.agente_acciones
  for all using (public.es_admin()) with check (public.es_admin());
