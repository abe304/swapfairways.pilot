-- Costos estructurados por oferta (en vez de un solo "costo estimado"):
-- así las publicaciones son comparables y el anfitrión no olvida
-- conceptos. tee_time_offers.costo_estimado pasa a guardar el TOTAL
-- calculado por la app (suma de los conceptos), de modo que todo lo que ya
-- leía ese campo sigue funcionando; las ofertas anteriores conservan su
-- costo_estimado sin desglose.
--
-- costo_caddie y costo_carrito ya existen desde 0005 (carrito = por
-- pareja). clubs.costo_visita_sugerido (0005) ahora sugiere el green fee.

alter table public.tee_time_offers
  add column if not exists costo_green_fee numeric(10, 2),
  add column if not exists costo_desayuno numeric(10, 2),
  add column if not exists costo_snacks numeric(10, 2),
  add column if not exists costo_bebidas numeric(10, 2),
  add column if not exists costo_renta_equipo numeric(10, 2),
  add column if not exists consumo_minimo numeric(10, 2),
  add column if not exists propina_recomendada numeric(10, 2),
  add column if not exists costo_otros numeric(10, 2),
  add column if not exists concepto_otros text;

-- El Cielo Country Club (Tlajomulco de Zúñiga, Jalisco) estaba en el
-- catálogo del código pero ninguna migración lo insertaba.
insert into public.clubs (nombre, ciudad, estado, direccion, tipo, latitud, longitud)
values (
  'El Cielo Country Club',
  'Tlajomulco de Zúñiga',
  'Jalisco',
  'Paseo del Cielo 1, Tlajomulco de Zúñiga, Jalisco, México',
  'privado',
  20.590364,
  -103.4719957
)
on conflict (nombre) do nothing;
