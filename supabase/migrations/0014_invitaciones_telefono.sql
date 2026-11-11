-- Teléfono opcional en los códigos de invitación (p. ej. para mandar la
-- invitación por WhatsApp a quien no tiene correo).
--
-- Segura de correr más de una vez.

alter table public.codigos_invitacion
  add column if not exists telefono text;
