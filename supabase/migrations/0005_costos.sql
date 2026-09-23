-- Costo de visita sugerido por club (para prellenar el costo estimado al
-- publicar una oferta — el anfitrión lo puede editar) y desglose de costo
-- de caddie/carrito por separado en la oferta.

alter table public.clubs
  add column if not exists costo_visita_sugerido numeric(10, 2);

alter table public.tee_time_offers
  add column if not exists costo_caddie numeric(10, 2),
  add column if not exists costo_carrito numeric(10, 2);

update public.clubs
set costo_visita_sugerido = 1200
where nombre = 'Club Santa Anita';
