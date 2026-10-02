// Strings de `select()` de las pantallas principales, en un solo lugar para
// que la app y la simulación automática (scripts/simulate-e2e.ts) ejecuten
// exactamente las mismas consultas contra PostgREST.

export const OFFER_LIST_SELECT =
  "id, fecha, hora, fecha_flexible, pases_disponibles, pases_confirmados, caddie_compartido, carrito_compartido, costo_estimado, clubs(nombre, ciudad, direccion, latitud, longitud), profiles!tee_time_offers_host_id_fkey(nombre, handicap_manual)";

export const OFFER_DETAIL_SELECT =
  "*, clubs(nombre, ciudad, direccion, tipo, latitud, longitud, reglamento, requiere_caddie_invitado, carrito_obligatorio, requiere_ghin, recomendacion_llegada, costo_creditos), profiles!tee_time_offers_host_id_fkey(id, nombre, handicap_manual, ghin_id)";

export const HOSTED_OFFERS_SELECT =
  "id, fecha, hora, fecha_flexible, pases_disponibles, pases_confirmados, clubs(nombre), requests(id, estado, guest_id, profiles!requests_guest_id_fkey(nombre, handicap_manual))";

export const MY_REQUESTS_SELECT =
  "id, estado, offer_id, tee_time_offers(fecha, hora, fecha_flexible, host_id, clubs(nombre), profiles!tee_time_offers_host_id_fkey(nombre, handicap_manual))";
