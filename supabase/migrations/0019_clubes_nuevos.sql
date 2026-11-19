-- 0019: Seis campos que faltaban en el catálogo (2026-11-18).
-- Oleada Golf Links (BCS), Club de Golf Los Cedros (Zacapu), Club Campestre
-- Erandeni (Tarímbaro), Nueve Almas Golf (Arandas), Punta Brava Golf Club
-- (Ensenada) y Championship PGA Riviera Maya Golf Club (Akumal).
-- También aplica los cambios de acceso que hizo el dueño en la hoja: Atlas,
-- Bosque Real, Los Encinos y Guadalajara Country Club pasan a green fee, y
-- Golf Country Club Tapalpa pasa a abierto y baja a Silver.
--
-- Nivel y acceso según la hoja de evaluación. Coordenadas aproximadas a la
-- localidad. Se puede correr más de una vez: si el club ya existe, se
-- actualiza.

insert into public.clubs (nombre, ciudad, estado, direccion, tipo, latitud, longitud, nivel, acceso, costo_creditos) values
  ('Championship PGA Riviera Maya Golf Club', 'Akumal', 'Quintana Roo', 'Carretera Chetumal-Benito Juárez km 250, Akumal, Q.R.', 'publico', 20.398797, -87.3173404, 'premium', 'green_fee', 3),
  ('Oleada Golf Links', 'Cabo San Lucas', 'Baja California Sur', 'Oleada Golf Links, Cabo San Lucas, Baja California Sur, México', 'publico', 22.8938884, -109.92006, 'premium', 'green_fee', 3),
  ('Club de Golf Los Cedros', 'Zacapu', 'Michoacán', 'Privada Cedros 1224, Col. Arboledas, 58650 Zacapu, Mich.', 'privado', 19.8302856, -101.8444215, 'silver', 'pase', 1),
  ('Club Campestre Erandeni', 'Tarímbaro', 'Michoacán', 'Carretera a Salamanca km 6.5, 58880 Tarímbaro, Mich.', 'privado', 19.8162789, -101.1637311, 'gold', 'pase', 2),
  ('Nueve Almas Golf', 'Arandas', 'Jalisco', 'Camino a Jaquetas, 47195 Arandas, Jal.', 'publico', 20.7493121, -102.3142822, 'silver', 'abierto', 1),
  ('Punta Brava Golf Club', 'Ensenada', 'Baja California', 'Península de Punta Banda, Ensenada, B.C.', 'privado', 31.8280434, -116.6036996, 'premium', 'pase', 3)
on conflict (nombre) do update set
  ciudad = excluded.ciudad,
  estado = excluded.estado,
  direccion = excluded.direccion,
  tipo = excluded.tipo,
  latitud = excluded.latitud,
  longitud = excluded.longitud,
  nivel = excluded.nivel,
  acceso = excluded.acceso,
  costo_creditos = excluded.costo_creditos;

update public.clubs c
set nivel = v.nivel, acceso = v.acceso,
    costo_creditos = case v.nivel when 'premium' then 3 when 'gold' then 2 else 1 end
from (values
  ('Atlas Country Club', 'gold', 'green_fee'),
  ('Bosque Real Country Club', 'premium', 'green_fee'),
  ('Club de Golf Los Encinos', 'premium', 'green_fee'),
  ('Guadalajara Country Club', 'premium', 'green_fee'),
  ('Golf Country Club Tapalpa', 'silver', 'abierto')
) as v (nombre, nivel, acceso)
where c.nombre = v.nombre;
