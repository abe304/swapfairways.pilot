-- Registro de correos automáticos (ciclo de vida) ya enviados.
--
-- Sirve para no mandar dos veces el mismo correo: antes de enviar, la app
-- inserta la fila; si ya existía (misma persona, mismo tipo, misma
-- referencia) el insert falla por la llave única y el correo no se manda.
--
--  * tipo: 'T1' bienvenida, 'T2' créditos activados, 'T4' solicitud sin
--    respuesta, 'T7' ronda mañana, 'T8' después de la ronda (ver
--    docs/correos-ciclo-de-vida.md).
--  * referencia: id de la solicitud u oferta, o '' si el correo es único
--    por persona (T1, T2).
--
-- Solo la escribe y la lee el servidor con la service role: RLS activado y
-- sin políticas, así ningún usuario la ve ni la toca.
--
-- Segura de correr más de una vez.

create table if not exists public.correos_enviados (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  tipo text not null,
  referencia text not null default '',
  enviado_at timestamptz not null default now(),
  unique (user_id, tipo, referencia)
);

alter table public.correos_enviados enable row level security;
