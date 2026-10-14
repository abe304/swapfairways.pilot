# Guía de lanzamiento: dominio, correo y primeros socios

Esta guía cubre lo que **solo puedes hacer tú** (comprar el dominio, crear el correo, tocar la configuración de Vercel/Supabase) y lo que ya hace la app (códigos de invitación, panel de administración, estatutos de clubes).

Orden recomendado: **1) base de datos → 2) ser administrador → 3) dominio → 4) correo → 5) dar de alta a los 20 primeros → 6) abrir la app a la Federación.**

---

## 1. Base de datos: corre las migraciones nuevas

En el SQL Editor de Supabase, en este orden (cada una se corre una sola vez; son seguras si se repiten):

| Migración | Qué hace |
|---|---|
| `0012_invitaciones_referidos.sql` | Códigos de invitación, créditos por referido y **candado de seguridad** sobre `profiles` |
| `0013_clubes_fotos_documentos.sql` | Foto de club, documentos (estatutos/reglamentos) y el bucket de Storage `clubes` |

> **Importante — seguridad.** Antes de `0012`, cualquier usuario con sesión podía editar sus propios `creditos_balance` e `is_admin` llamando a la API de Supabase directamente. `0012` lo cierra. Córrela **antes** de invitar a gente real.

Si `0013` marca error al crear el bucket o las políticas de Storage, crea el bucket a mano: Supabase → **Storage → New bucket** → nombre `clubes` → marca **Public bucket**, y vuelve a correr `0013`.

## 2. Hazte administrador

El panel `/admin` solo aparece para cuentas con `is_admin = true`. Para tu cuenta, en el SQL Editor:

```sql
update public.profiles
set is_admin = true
where id = (select id from auth.users where email = 'TU_CORREO@ejemplo.com');
```

Cierra sesión y vuelve a entrar. Verás **Admin** en la barra superior.

## 3. Dominio (swapfairways.com o .io)

Mi recomendación es **`swapfairways.com`**: es el que la gente escribe de memoria en México y el que se ve más confiable para socios de clubes. El `.io` suele costar bastante más al año; puedes comprarlo además y redirigirlo al `.com`. Revisa los precios vigentes en el registrador antes de decidir.

1. **Compra el dominio** en un registrador (Cloudflare Registrar, Namecheap, GoDaddy…). Cloudflare vende al costo, sin sobreprecio de renovación.
2. **Conéctalo a Vercel:** proyecto `swapfairways-pilot` → **Settings → Domains → Add** → escribe `swapfairways.com`. Vercel te muestra los registros DNS exactos (normalmente un registro `A` para `@` y un `CNAME` para `www`). Agrégalos en el panel DNS de tu registrador **con los valores que muestre Vercel**. Tarda de minutos a unas horas.
3. **Variable de entorno** (Vercel → Settings → Environment Variables):
   - `NEXT_PUBLIC_SITE_URL` = `https://swapfairways.com`

   Con eso los enlaces de invitación usan tu dominio y no la dirección `vercel.app`.
4. **Supabase → Authentication → URL Configuration:** pon `https://swapfairways.com` en **Site URL** y agrega `https://swapfairways.com/**` en **Redirect URLs**.
5. **Redeploy** en Vercel (las variables `NEXT_PUBLIC_*` se leen al construir).

## 4. Correo `mexico@swapfairways.com`

Hay dos necesidades distintas; puedes resolver una o las dos:

**a) Una bandeja real** (recibir y contestar a los socios):
- **Google Workspace**: la opción más cómoda si ya usas Gmail; es de pago por usuario.
- **Cloudflare Email Routing** (gratis, solo si el dominio está en Cloudflare): reenvía `mexico@swapfairways.com` a tu Gmail. Para contestar desde esa dirección, en Gmail usa *Configuración → Cuentas → Enviar como*.

**b) Que la app envíe correos** (invitaciones, aviso de nueva solicitud, aprobación) **desde** `mexico@`:
1. Crea cuenta en [resend.com](https://resend.com) → **Domains → Add Domain** → `swapfairways.com`.
2. Resend te da registros DNS (SPF y DKIM). Agrégalos donde administras el DNS y espera a que Resend marque el dominio como **Verified**.
3. Crea un API key en Resend.
4. En Vercel → Environment Variables:
   - `RESEND_API_KEY` = tu API key *(pégala solo en Vercel, nunca en el chat ni en el repositorio)*
   - `RESEND_FROM_EMAIL` = `SwapFairways <mexico@swapfairways.com>`
   - `NEXT_PUBLIC_CONTACT_EMAIL` = `mexico@swapfairways.com` (se muestra en la home y en el registro)
5. Redeploy.

Sin `RESEND_API_KEY` la app funciona igual: los códigos de invitación se crean y tú los compartes por WhatsApp o a mano.

## 5. Dar de alta a los primeros 20 socios

1. Entra a **Admin → Invitaciones**.
2. En **Dar de alta a los primeros socios** pega una persona por línea:
   ```
   Ana Torres, ana@correo.com
   Luis Pérez, luis@correo.com
   María Gómez
   ```
   (el correo es opcional). Cada persona recibe un **código de fundador de un solo uso**.
3. Con el correo configurado, la app les envía la invitación. Si no, usa **Copiar enlace** o **WhatsApp** junto a cada código.
4. Cuando ya hayas repartido los 20 códigos, pulsa **Exigir código de invitación**: desde ese momento nadie entra sin un código válido (la base de datos también lo hace cumplir, no solo la pantalla de registro).
5. Cada socio que entra recibe **su propio código personal** (en su perfil). Cuando alguien al que invitó juega su primera ronda, **gana créditos** (1 por defecto; ajustable en la misma pantalla de Invitaciones).

Notas:
- Los socios fundadores entran con los 3 créditos de bienvenida de siempre; el código de fundador no regala créditos extra.
- La recompensa se paga una sola vez por persona invitada, cuando esa persona juega su **primera ronda** (como invitada o como anfitriona). Así no se cobran por cuentas que nunca juegan.
- Un código de fundador usado o desactivado ya no sirve.

## 6. Federación: estatutos, reglamentos y fotos de los campos

- **Admin → Clubes** lista los 254 clubes y marca cuáles aún no tienen documentos o foto (hay filtro "Sin estatutos" y "Sin foto").
- Dentro de cada club puedes **subir el PDF** de estatutos o reglamento (hasta 25 MB) o pegar el enlace de Drive o del sitio del club. También el código de vestimenta, la foto y las obligaciones para invitados (caddie, carrito, GHIN) y el costo en créditos.
- Los socios ven todo eso en el directorio público `/clubes` y dentro de cada ronda.
- **Para que alguien de la Federación cargue los documentos él mismo**, créale una cuenta (con un código de invitación) y márcala como administradora con el mismo `update ... is_admin = true` del paso 2. Un administrador puede editar cualquier club; todavía no hay un rol "solo este club".
- Las **fotos** de la home salen de las fotos que subas aquí. Mientras un club no tenga foto, se muestra una ilustración de la marca. Usa solo imágenes que tengas derecho a publicar (propias, del club con su permiso, o con licencia).

## Lista de verificación antes de mandarlo a la Federación

- [ ] `0012` y `0013` corridas
- [ ] Tu cuenta es administradora
- [ ] Dominio conectado y `NEXT_PUBLIC_SITE_URL` configurada
- [ ] Correo `mexico@` operando (bandeja y/o Resend verificado)
- [ ] Al menos algunos clubes con estatutos y foto cargados
- [ ] Los 20 códigos de fundador creados y enviados
- [ ] "Exigir código de invitación" activado
