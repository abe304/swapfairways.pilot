// Auditoría de solo lectura: compara el estado de cada club del catálogo con
// el estado que devuelve OpenStreetMap (Nominatim) para sus coordenadas y
// avisa de las diferencias. No modifica nada; si encuentra errores, corrige
// lib/data/clubs-mexico.ts y agrega una migración con el `update` (ver 0011).
//
// Uso: npm run audit:clubs   (~1 petición por segundo, unos 4 min)
import { CLUBES_MEXICO } from "../lib/data/clubs-mexico";

const UA = "SwapFairwaysPilot/1.0 (auditoria de ubicaciones)";

const norm = (s: string) =>
  s
    .replace("Estado de México", "México")
    .replace("Coahuila de Zaragoza", "Coahuila")
    .replace("Michoacán de Ocampo", "Michoacán")
    .replace("Veracruz de Ignacio de la Llave", "Veracruz");

async function estadoDe(lat: number, lng: number) {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=jsonv2&zoom=10&addressdetails=1&accept-language=es`;
  const res = await fetch(url, { headers: { "User-Agent": UA } });
  if (!res.ok) return null;
  const json = (await res.json()) as { address?: { state?: string; county?: string } };
  return { estado: json.address?.state ?? null, municipio: json.address?.county ?? null };
}

async function main() {
  const conCoordenadas = CLUBES_MEXICO.filter((c) => c.latitud != null && c.longitud != null);
  const sinCoordenadas = CLUBES_MEXICO.length - conCoordenadas.length;
  const errores: string[] = [];

  for (const c of conCoordenadas) {
    const geo = await estadoDe(c.latitud!, c.longitud!);
    if (!geo?.estado) {
      errores.push(`? ${c.nombre}: sin resultado del geocodificador`);
    } else if (norm(geo.estado) !== norm(c.estado)) {
      errores.push(`✗ ${c.nombre}: catálogo=${c.estado} · coordenadas=${geo.estado} (${geo.municipio ?? "?"})`);
    }
    await new Promise((r) => setTimeout(r, 1100));
  }

  console.log(`Clubes con coordenadas revisados: ${conCoordenadas.length} (sin coordenadas, no revisables: ${sinCoordenadas})`);
  if (errores.length === 0) {
    console.log("Todos los estados coinciden con sus coordenadas ✔");
  } else {
    console.log(`${errores.length} por revisar:\n${errores.join("\n")}`);
    process.exitCode = 1;
  }
}

main();
