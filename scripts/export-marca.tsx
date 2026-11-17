// Exporta el logo y las ilustraciones de la app a docs/marca/ (SVG + PNG en
// alta resolución) para presentaciones. Los dibujos salen de los mismos
// componentes que usa la página, así que si cambian basta con volver a correr:
//   npm run export:marca
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { renderToStaticMarkup } from "react-dom/server";
import sharp from "sharp";
import { Golfista } from "@/components/Logo";
import { HeroIllustration } from "@/components/HeroIllustration";
import { ClubPhoto } from "@/components/ClubPhoto";

const VERDE = "#0e2b20";
const DORADO = "#c5a059";
const CREMA = "#faf8f5";
const OUT = join(process.cwd(), "docs", "marca");
const FUENTE = "'Helvetica Neue', Helvetica, Arial, sans-serif";

function svgDoc(width: number, height: number, inner: string, viewBox = `0 0 ${width} ${height}`) {
  return `<?xml version="1.0" encoding="UTF-8"?>\n<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="${viewBox}">${inner}</svg>\n`;
}

function golfista(trazo: string, fondo: string) {
  return renderToStaticMarkup(<Golfista trazo={trazo} fondo={fondo} />);
}

// --- Logo ------------------------------------------------------------------

// Solo el golfista. El encuadre es el mismo que usa el menú (16 4 40 54).
function simbolo(trazo: string, fondo: string, conFondo: boolean) {
  const bg = conFondo ? `<rect x="16" y="4" width="40" height="54" fill="${fondo}"/>` : "";
  return svgDoc(400, 540, bg + golfista(trazo, fondo), "16 4 40 54");
}

// Golfista + "SwapFairways", como en el menú.
function logoHorizontal(texto: string, fondo: string, conFondo: boolean) {
  const w = 760;
  const h = 200;
  const bg = conFondo ? `<rect width="${w}" height="${h}" fill="${fondo}"/>` : "";
  const mark = `<svg x="24" y="18" width="120" height="162" viewBox="16 4 40 54">${golfista(texto, fondo)}</svg>`;
  const palabra = `<text x="160" y="122" font-family="${FUENTE}" font-size="72" letter-spacing="1" fill="${texto}"><tspan font-weight="300">Swap</tspan><tspan font-weight="500" fill="${DORADO}">Fairways</tspan></text>`;
  return svgDoc(w, h, bg + mark + palabra);
}

// Ícono de la app (el mismo del favicon).
const icono = readFileSync(join(process.cwd(), "app", "icon.svg"), "utf8");

// --- Ilustraciones -----------------------------------------------------------

// limpia = sin el sombreado oscuro que en la página sirve para leer el texto.
function portada(limpia = false) {
  const html = renderToStaticMarkup(<HeroIllustration />);
  let inner = html.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
  if (limpia) inner = inner.replace(/<rect[^>]*url\(#hero-(arriba|lectura)\)[^>]*(\/>|><\/rect>)/g, "");
  return svgDoc(2400, 840, inner, "0 0 1200 420");
}

// ClubPhoto pinta el fondo con un degradado de Tailwind; aquí lo pasamos a SVG.
function casaClub(nombre: string) {
  const html = renderToStaticMarkup(<ClubPhoto nombre={nombre} fotoUrl={null} />);
  const [, desde, via, hasta] = html.match(/from-\[(#\w+)\] via-\[(#\w+)\] to-\[(#\w+)\]/) ?? [];
  const svg = html.match(/<svg[\s\S]*<\/svg>/)![0];
  const inner = svg.replace(/^<svg[^>]*>/, "").replace(/<\/svg>$/, "");
  const grad = `<defs><linearGradient id="fondo" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${desde}"/><stop offset="0.5" stop-color="${via}"/><stop offset="1" stop-color="${hasta}"/></linearGradient></defs><rect width="400" height="240" fill="url(#fondo)"/>`;
  return { svg: svgDoc(1600, 960, grad + inner, "0 0 400 240"), clave: `${desde}${via}${hasta}` };
}

// Busca un nombre por cada paleta de fondo para exportar las cuatro variantes.
function casasClub() {
  const vistas = new Map<string, string>();
  for (let i = 0; vistas.size < 4 && i < 500; i++) {
    const { svg, clave } = casaClub(`Club ${i}`);
    if (!vistas.has(clave)) vistas.set(clave, svg);
  }
  return [...vistas.values()];
}

// --- Escritura ---------------------------------------------------------------

async function guardar(nombre: string, svg: string, anchoPng: number) {
  writeFileSync(join(OUT, "svg", `${nombre}.svg`), svg);
  await sharp(Buffer.from(svg), { density: 600 })
    .resize({ width: anchoPng })
    .png()
    .toFile(join(OUT, "png", `${nombre}.png`));
  console.log(`  ${nombre}`);
}

async function main() {
  mkdirSync(join(OUT, "svg"), { recursive: true });
  mkdirSync(join(OUT, "png"), { recursive: true });

  await guardar("logo-horizontal-fondo-verde", logoHorizontal(CREMA, VERDE, true), 2280);
  await guardar("logo-horizontal-fondo-crema", logoHorizontal(VERDE, CREMA, true), 2280);
  await guardar("logo-horizontal-transparente-para-fondo-oscuro", logoHorizontal(CREMA, VERDE, false), 2280);
  await guardar("simbolo-golfista-fondo-verde", simbolo(CREMA, VERDE, true), 1200);
  await guardar("simbolo-golfista-fondo-crema", simbolo(VERDE, CREMA, true), 1200);
  await guardar("icono-app", icono, 1024);
  await guardar("ilustracion-portada-carrito", portada(), 3600);
  await guardar("ilustracion-portada-carrito-sin-sombreado", portada(true), 3600);
  const casas = casasClub();
  for (const [i, svg] of casas.entries()) await guardar(`ilustracion-casa-club-${i + 1}`, svg, 2400);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
