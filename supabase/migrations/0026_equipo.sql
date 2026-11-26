-- 0026: Equipo de SwapFairways — roles, bitácora de actividades, pipeline,
-- check-in semanal, compromisos y finanzas (ver docs/equipo-propuesta.md).
--
--  * equipo_miembros: quién es del equipo y con qué rol. Solo el admin lo
--    edita desde /admin/equipo.
--  * equipo_metas: meta semanal de actividades por rol (la edita el admin).
--  * equipo_actividades: bitácora. Cada quien registra las suyas en /equipo.
--  * equipo_pipeline: relaciones y oportunidades (clubes, FMG, grupos
--    regionales, medios, patrocinios, alianzas, leads, torneos).
--  * equipo_checkins + equipo_compromisos: check-in semanal con compromisos
--    con fecha; el tablero marca los vencidos.
--  * finanzas_movimientos: ingresos y gastos para el P&L. Solo los ve el
--    admin y quien tenga el rol 'finanzas'.
--
-- Todo el equipo puede leer lo del equipo (transparencia); cada quien solo
-- crea y edita lo suyo. Los usuarios normales no ven nada de esto.
--
-- Segura de correr más de una vez.

-- ============================================================
-- Miembros y helpers
-- ============================================================
create table if not exists public.equipo_miembros (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  rol text not null
    check (rol in ('direccion', 'operaciones', 'analista', 'marketing', 'rp', 'comercial', 'finanzas')),
  titulo text,
  activo boolean not null default true,
  created_at timestamptz not null default now()
);

-- ¿El usuario actual es del equipo (o admin)?
create or replace function public.es_equipo()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select public.es_admin()
      or exists (select 1 from public.equipo_miembros where profile_id = auth.uid() and activo);
$$;

-- Rol del usuario actual en el equipo (null si no es miembro activo).
create or replace function public.rol_equipo()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select rol from public.equipo_miembros where profile_id = auth.uid() and activo;
$$;

alter table public.equipo_miembros enable row level security;

drop policy if exists equipo_miembros_select on public.equipo_miembros;
create policy equipo_miembros_select on public.equipo_miembros
  for select using (public.es_equipo());

drop policy if exists equipo_miembros_admin on public.equipo_miembros;
create policy equipo_miembros_admin on public.equipo_miembros
  for all using (public.es_admin()) with check (public.es_admin());

-- ============================================================
-- Metas semanales por rol
-- ============================================================
create table if not exists public.equipo_metas (
  rol text primary key
    check (rol in ('direccion', 'operaciones', 'analista', 'marketing', 'rp', 'comercial', 'finanzas')),
  actividades_semana integer not null default 5 check (actividades_semana >= 0),
  updated_at timestamptz not null default now()
);

insert into public.equipo_metas (rol, actividades_semana) values
  ('direccion', 3),
  ('operaciones', 5),
  ('analista', 3),
  ('marketing', 15),
  ('rp', 6),
  ('comercial', 8),
  ('finanzas', 2)
on conflict (rol) do nothing;

alter table public.equipo_metas enable row level security;

drop policy if exists equipo_metas_select on public.equipo_metas;
create policy equipo_metas_select on public.equipo_metas
  for select using (public.es_equipo());

drop policy if exists equipo_metas_admin on public.equipo_metas;
create policy equipo_metas_admin on public.equipo_metas
  for all using (public.es_admin()) with check (public.es_admin());

-- ============================================================
-- Pipeline de relaciones y oportunidades
-- ============================================================
create table if not exists public.equipo_pipeline (
  id uuid primary key default gen_random_uuid(),
  responsable_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  categoria text not null
    check (categoria in ('club', 'federacion', 'grupo_regional', 'medio', 'patrocinio', 'alianza', 'lead', 'torneo', 'influencer')),
  nombre text not null check (length(trim(nombre)) > 0),
  contacto text,
  etapa text not null default 'identificado'
    check (etapa in ('identificado', 'contactado', 'conversacion', 'propuesta', 'cerrado', 'perdido')),
  monto_estimado numeric(12, 2),
  proximo_paso text,
  proxima_fecha date,
  notas text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists equipo_pipeline_etapa_idx on public.equipo_pipeline (etapa, proxima_fecha);

alter table public.equipo_pipeline enable row level security;

drop policy if exists equipo_pipeline_select on public.equipo_pipeline;
create policy equipo_pipeline_select on public.equipo_pipeline
  for select using (public.es_equipo());

drop policy if exists equipo_pipeline_insert on public.equipo_pipeline;
create policy equipo_pipeline_insert on public.equipo_pipeline
  for insert with check (public.es_equipo() and (responsable_id = auth.uid() or public.es_admin()));

-- RP, Comercial y Marketing comparten contactos: cualquiera del equipo puede
-- mover la etapa o el próximo paso.
drop policy if exists equipo_pipeline_update on public.equipo_pipeline;
create policy equipo_pipeline_update on public.equipo_pipeline
  for update using (public.es_equipo()) with check (public.es_equipo());

drop policy if exists equipo_pipeline_delete on public.equipo_pipeline;
create policy equipo_pipeline_delete on public.equipo_pipeline
  for delete using (responsable_id = auth.uid() or public.es_admin());

-- ============================================================
-- Bitácora de actividades
-- ============================================================
create table if not exists public.equipo_actividades (
  id uuid primary key default gen_random_uuid(),
  autor_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  rol text not null,
  tipo text not null,
  titulo text not null check (length(trim(titulo)) > 0),
  contraparte text,
  resultado text,
  enlace text,
  fecha date not null default ((now() at time zone 'America/Mexico_City')::date),
  pipeline_id uuid references public.equipo_pipeline (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists equipo_actividades_fecha_idx on public.equipo_actividades (fecha desc);
create index if not exists equipo_actividades_autor_idx on public.equipo_actividades (autor_id, fecha desc);

alter table public.equipo_actividades enable row level security;

drop policy if exists equipo_actividades_select on public.equipo_actividades;
create policy equipo_actividades_select on public.equipo_actividades
  for select using (public.es_equipo());

drop policy if exists equipo_actividades_insert on public.equipo_actividades;
create policy equipo_actividades_insert on public.equipo_actividades
  for insert with check (public.es_equipo() and autor_id = auth.uid());

drop policy if exists equipo_actividades_update on public.equipo_actividades;
create policy equipo_actividades_update on public.equipo_actividades
  for update using (autor_id = auth.uid() or public.es_admin())
  with check (autor_id = auth.uid() or public.es_admin());

drop policy if exists equipo_actividades_delete on public.equipo_actividades;
create policy equipo_actividades_delete on public.equipo_actividades
  for delete using (autor_id = auth.uid() or public.es_admin());

-- ============================================================
-- Check-in semanal y compromisos
-- ============================================================
-- semana = lunes de la semana a la que corresponde el check-in.
create table if not exists public.equipo_checkins (
  id uuid primary key default gen_random_uuid(),
  autor_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  semana date not null,
  logros text,
  bloqueos text,
  plan text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (autor_id, semana)
);

alter table public.equipo_checkins enable row level security;

drop policy if exists equipo_checkins_select on public.equipo_checkins;
create policy equipo_checkins_select on public.equipo_checkins
  for select using (public.es_equipo());

drop policy if exists equipo_checkins_insert on public.equipo_checkins;
create policy equipo_checkins_insert on public.equipo_checkins
  for insert with check (public.es_equipo() and autor_id = auth.uid());

drop policy if exists equipo_checkins_update on public.equipo_checkins;
create policy equipo_checkins_update on public.equipo_checkins
  for update using (autor_id = auth.uid()) with check (autor_id = auth.uid());

create table if not exists public.equipo_compromisos (
  id uuid primary key default gen_random_uuid(),
  autor_id uuid not null default auth.uid() references public.profiles (id) on delete cascade,
  checkin_id uuid references public.equipo_checkins (id) on delete set null,
  texto text not null check (length(trim(texto)) > 0),
  fecha_limite date not null,
  hecho boolean not null default false,
  hecho_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists equipo_compromisos_pendientes_idx
  on public.equipo_compromisos (fecha_limite) where not hecho;

alter table public.equipo_compromisos enable row level security;

drop policy if exists equipo_compromisos_select on public.equipo_compromisos;
create policy equipo_compromisos_select on public.equipo_compromisos
  for select using (public.es_equipo());

drop policy if exists equipo_compromisos_insert on public.equipo_compromisos;
create policy equipo_compromisos_insert on public.equipo_compromisos
  for insert with check (public.es_equipo() and autor_id = auth.uid());

drop policy if exists equipo_compromisos_update on public.equipo_compromisos;
create policy equipo_compromisos_update on public.equipo_compromisos
  for update using (autor_id = auth.uid() or public.es_admin())
  with check (autor_id = auth.uid() or public.es_admin());

drop policy if exists equipo_compromisos_delete on public.equipo_compromisos;
create policy equipo_compromisos_delete on public.equipo_compromisos
  for delete using (autor_id = auth.uid() or public.es_admin());

-- ============================================================
-- Finanzas (P&L)
-- ============================================================
create table if not exists public.finanzas_movimientos (
  id uuid primary key default gen_random_uuid(),
  fecha date not null,
  tipo text not null check (tipo in ('ingreso', 'gasto')),
  categoria text not null,
  canal text,
  concepto text not null check (length(trim(concepto)) > 0),
  monto numeric(12, 2) not null check (monto > 0),
  registrado_por uuid default auth.uid() references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists finanzas_movimientos_fecha_idx on public.finanzas_movimientos (fecha desc);

alter table public.finanzas_movimientos enable row level security;

drop policy if exists finanzas_movimientos_todo on public.finanzas_movimientos;
create policy finanzas_movimientos_todo on public.finanzas_movimientos
  for all using (public.es_admin() or public.rol_equipo() = 'finanzas')
  with check (public.es_admin() or public.rol_equipo() = 'finanzas');
