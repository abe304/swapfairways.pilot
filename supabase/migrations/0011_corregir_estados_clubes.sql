-- Corrige el estado (y la dirección que se usa para el enlace de Google
-- Maps) de clubes cuyo estado estaba mal asignado en el catálogo — p. ej.
-- Golf Country Club Tapalpa figuraba en Colima y es Jalisco. Los estados
-- salen de reverse-geocoding (OpenStreetMap) sobre las coordenadas de cada
-- club. Solo toca esos campos: ofertas, perfiles y accesos rápidos no cambian.
-- Segura de correr más de una vez.

update public.clubs c
set estado = v.estado,
    direccion = v.direccion
from (values
  ('Alamo Country Club', 'Guanajuato', 'Alamo Country Club, Guanajuato, México'),
  ('Azul Talavera Country Club', 'Coahuila', 'Azul Talavera Country Club, Coahuila, México'),
  ('Bellavista Golf & Country Club', 'Estado de México', 'Bellavista Golf & Country Club, Estado de México, México'),
  ('Bosque Real Campo Ejecutivo', 'Estado de México', 'Bosque Real Campo Ejecutivo, Estado de México, México'),
  ('Campo de Golf Moctezuma', 'Chihuahua', 'Campo de Golf Moctezuma, Chihuahua, México'),
  ('Campo de Golf Municipal Celaya', 'Guanajuato', 'Campo de Golf Municipal Celaya, Guanajuato, México'),
  ('Club Campestre Celaya', 'Guanajuato', 'Club Campestre Celaya, Guanajuato, México'),
  ('Club Campestre Chiluca', 'Estado de México', 'Club Campestre Chiluca, Estado de México, México'),
  ('Club Campestre Lourdes', 'Coahuila', 'Club Campestre Lourdes, Coahuila, México'),
  ('Club De Golf Guamúchil', 'Sinaloa', 'Club De Golf Guamúchil, Sinaloa, México'),
  ('Club de Golf Malinalco', 'Estado de México', 'Club de Golf Malinalco, Estado de México, México'),
  ('Club de Golf Monterreal', 'Coahuila', 'Club de Golf Monterreal, Coahuila, México'),
  ('Club de Golf Valle Escondido', 'Estado de México', 'Club de Golf Valle Escondido, Estado de México, México'),
  ('Club Deportivo Campestre Torreón', 'Coahuila', 'Club Deportivo Campestre Torreón, Coahuila, México'),
  ('Coral Clubes Golf', 'Estado de México', 'Coral Clubes Golf, Estado de México, México'),
  ('Country Club Los Mochis', 'Sinaloa', 'Country Club Los Mochis, Sinaloa, México'),
  ('El Tamarindo Golf Course', 'Jalisco', 'El Tamarindo Golf Course, Jalisco, México'),
  ('Golf Country Club Tapalpa', 'Jalisco', 'Golf Country Club Tapalpa, Jalisco, México'),
  ('Gran Reserva Golf Resort & Country Club', 'Estado de México', 'Gran Reserva Golf Resort & Country Club, Estado de México, México'),
  ('Grand Isla Navidad Resort Country Club', 'Jalisco', 'Grand Isla Navidad Resort Country Club, Jalisco, México'),
  ('Hacienda Cantalagua Club de Golf', 'Michoacán', 'Hacienda Cantalagua Club de Golf, Michoacán, México'),
  ('La Esmeralda Country Club', 'Estado de México', 'La Esmeralda Country Club, Estado de México, México'),
  ('Las Lomas Habitat + Golf', 'Sinaloa', 'Las Lomas Habitat + Golf, Sinaloa, México'),
  ('Madeiras Country Club', 'Estado de México', 'Madeiras Country Club, Estado de México, México'),
  ('Marina Vallarta Golf Club', 'Jalisco', 'Marina Vallarta Golf Club, Jalisco, México'),
  ('Montetaxco Hotel & Resort', 'Guerrero', 'Montetaxco Hotel & Resort, Guerrero, México'),
  ('San Gabriel Campestre', 'Coahuila', 'San Gabriel Campestre, Coahuila, México'),
  ('The Club at Islas del Mar', 'Sonora', 'The Club at Islas del Mar, Sonora, México'),
  ('The Links Golf Course at Las Palomas', 'Sonora', 'The Links Golf Course at Las Palomas, Sonora, México'),
  ('Ventanas de San Miguel', 'Guanajuato', 'Ventanas de San Miguel, Guanajuato, México'),
  ('Vidanta Golf Puerto Peñasco', 'Sonora', 'Vidanta Golf Puerto Peñasco, Sonora, México'),
  ('Vista Vallarta Nicklaus Club de Golf', 'Jalisco', 'Vista Vallarta Nicklaus Club de Golf, Jalisco, México'),
  ('Vista Vallarta Weiskopf Club de Golf', 'Jalisco', 'Vista Vallarta Weiskopf Club de Golf, Jalisco, México'),
  ('Zirandaro Residencial & Golf', 'Guanajuato', 'Zirandaro Residencial & Golf, Guanajuato, México')
) as v (nombre, estado, direccion)
where c.nombre = v.nombre
  and (c.estado is distinct from v.estado or c.direccion is distinct from v.direccion);
