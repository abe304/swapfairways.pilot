# Contexto del proyecto SWF (SwapFairways)

Resumen para retomar el trabajo en una sesión nueva de Claude sin perder el hilo. No contiene claves ni secretos.

## Qué es
Piloto web para que socios de clubes de golf en México intercambien salidas (tee times) usando créditos. UI en español. Paleta: verde `#0E2B20`, dorado `#C5A059`, crema `#FAF8F5`.

## Stack y dónde vive
- Next.js 16 (App Router) + TypeScript + Tailwind v4. **Esta versión de Next tiene cambios incompatibles con lo que Claude sabe**: lee `node_modules/next/dist/docs/` antes de escribir código nuevo (ver `AGENTS.md`).
- Supabase (Postgres, Auth email+contraseña, RLS, Storage). Las migraciones están en `supabase/migrations/` (0001–0013) y **se corren a mano** en el SQL Editor de Supabase.
- Despliegue en Vercel: https://swapfairways-pilot.vercel.app
- Repo: github.com/abe304/swapfairways.pilot (rama `master`).
- Modo demo: si falta `NEXT_PUBLIC_SUPABASE_URL` (o es un placeholder), la app usa un backend simulado en `lib/mock/*`. Usuario demo: `test@test.com` / `testtest`.

## Estado actual
- Migraciones corridas en la base real: **hasta la 0013**.
- Funciones hechas: home pública con buscador, directorio de 254 clubes con estados corregidos, ofertas con varias fechas y pases por fecha, costos desglosados (carrito y caddie compartidos se dividen a la mitad para el invitado), solicitudes/aprobación, créditos, códigos de invitación (usuario y fundador) con recompensa por referido, panel `/admin` (clubes, documentos, invitaciones), candado de seguridad sobre `profiles`.
- **Código en GitHub y Vercel:** el commit `22f8657` (home, invitaciones, admin, migraciones 0012/0013) se subió el 2026-11-09 y Vercel lo desplegó en producción. El push se hace con `gh` autenticado (`gh auth login`).
- `invite_required` está en `false` (registro abierto) hasta repartir los códigos de fundador.

## Pendientes de lanzamiento (los hace el dueño; detalle en `docs/LANZAMIENTO.md`)
1. ~~Subir el código a GitHub y confirmar que Vercel despliegue.~~ Hecho (2026-11-09).
2. Hacerse administrador (SQL en LANZAMIENTO.md, paso 2).
3. Probar una subida real de PDF en Admin → Clubes (no se ha verificado contra Storage real).
4. Comprar dominio (recomendado `swapfairways.com`), conectarlo a Vercel, definir `NEXT_PUBLIC_SITE_URL`, configurar URLs en Supabase Auth.
5. Correo `mexico@…` y Resend (`RESEND_API_KEY`, `RESEND_FROM_EMAIL`, `NEXT_PUBLIC_CONTACT_EMAIL`). Sin Resend la app funciona; los códigos se comparten a mano.
6. Crear los 20 códigos de fundador en `/admin/invitaciones` y luego activar "Exigir código de invitación".
7. Opcional después del piloto: web instalable (PWA), páginas de privacidad/términos, y publicación en tiendas (cuentas de desarrollador de Apple y Google; Apple suele rechazar envoltorios web sin funciones nativas). **No hace falta Wix.**

## Cosas no obvias que conviene recordar
- PostgREST: `.insert().select().order(col)` aplica el ORDER BY al INSERT y falla (42703). No usar `.order()` ahí.
- Costos: los conceptos se guardan completos; carrito/caddie compartidos se dividen a la mitad para el invitado; `costo_estimado` es el total del invitado.
- Seguridad: los usuarios solo pueden actualizar `nombre, club_id, handicap_manual, foto_url, ghin_id, bio` en `profiles` (permisos por columna). No ampliar sin pensarlo: antes de la 0012 cualquiera podía editar su propio `creditos_balance` e `is_admin`.
- Limitaciones conocidas: la recompensa por referido se puede abusar con cuentas falsas; el rol admin es global (no por club); `npm run simulate:live` falla al crear usuarios cuando `invite_required` es `true`.
- Comandos: `npm run dev`, `npm run audit:clubs` (revisa estados/ubicaciones con geocodificación), `npm run simulate` (simulación sobre el mock).
- Los secretos viven solo en `.env.local` / `.env.live` (ignorados por git) y en Vercel. Nunca pegarlos en el chat.

## Cómo retomar con Claude
Abre la carpeta del proyecto con Claude Code (app de escritorio o `claude` en la terminal). Este archivo y `AGENTS.md` se cargan solos a través de `CLAUDE.md`. Para continuar, di qué sigue (por ejemplo: "Estado: lee docs/CONTEXTO.md; quiero hacer la PWA").
