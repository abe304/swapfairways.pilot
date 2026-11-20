import Link from "next/link";
import { redirect } from "next/navigation";
import { cambiarSeguimiento, firmaValida } from "@/lib/correos/baja";

// Baja de los correos de seguimiento (S1–S4) desde el enlace del correo.
// No pide sesión: el enlace va firmado (lib/correos/baja.ts). Se confirma con
// un botón para que los antivirus que abren enlaces no den de baja a nadie.
export default async function BajaCorreosPage({
  searchParams,
}: {
  searchParams: Promise<{ u?: string; t?: string; estado?: string }>;
}) {
  const { u, t, estado } = await searchParams;
  const valido = firmaValida(u, t);

  async function cambiar(formData: FormData) {
    "use server";
    const userId = String(formData.get("u") ?? "");
    const token = String(formData.get("t") ?? "");
    const recibir = formData.get("recibir") === "1";
    if (!firmaValida(userId, token)) redirect("/correos/baja");
    const ok = await cambiarSeguimiento(userId, recibir);
    const qs = new URLSearchParams({ u: userId, t: token, estado: ok ? (recibir ? "alta" : "baja") : "error" });
    redirect(`/correos/baja?${qs.toString()}`);
  }

  return (
    <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-8">
      <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col justify-center">
        <h1 className="mb-2 text-2xl font-semibold text-swf-verde">Correos de seguimiento</h1>

        {!valido ? (
          <p className="text-sm text-swf-verde/70">
            Este enlace no es válido. Usa el enlace que viene al final de nuestro correo.
          </p>
        ) : estado === "baja" ? (
          <>
            <p className="mb-6 text-sm text-swf-verde/70">
              Listo, ya no te mandaremos correos de seguimiento. Los avisos de tus rondas (solicitudes,
              confirmaciones y recordatorios) te seguirán llegando.
            </p>
            <form action={cambiar}>
              <input type="hidden" name="u" value={u} />
              <input type="hidden" name="t" value={t} />
              <input type="hidden" name="recibir" value="1" />
              <button type="submit" className="text-sm font-medium text-swf-dorado underline">
                Me equivoqué, quiero seguir recibiéndolos
              </button>
            </form>
          </>
        ) : (
          <>
            {estado === "alta" ? (
              <p className="mb-4 rounded-md bg-swf-verde/5 px-3 py-2 text-sm text-swf-verde">
                Listo, seguirás recibiendo los correos de seguimiento.
              </p>
            ) : null}
            {estado === "error" ? (
              <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
                No pudimos guardar el cambio. Inténtalo de nuevo en un momento.
              </p>
            ) : null}
            <p className="mb-6 text-sm text-swf-verde/70">
              De vez en cuando te escribimos para contarte cómo va la red o preguntarte cómo te fue. Si
              prefieres no recibir esos correos, dalos de baja aquí. Los avisos de tus rondas te seguirán
              llegando.
            </p>
            <form action={cambiar}>
              <input type="hidden" name="u" value={u} />
              <input type="hidden" name="t" value={t} />
              <input type="hidden" name="recibir" value="0" />
              <button
                type="submit"
                className="w-full rounded-md bg-swf-verde px-4 py-2.5 text-sm font-semibold text-swf-crema hover:bg-swf-verde-claro"
              >
                Dejar de recibirlos
              </button>
            </form>
          </>
        )}

        <p className="mt-8 text-center text-sm">
          <Link href="/" className="font-medium text-swf-dorado">
            Ir a SwapFairways
          </Link>
        </p>
      </div>
    </main>
  );
}
