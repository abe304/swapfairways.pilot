import Link from "next/link";
import { RecuperarForm } from "./RecuperarForm";

export default async function RecuperarPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center">
      <h1 className="mb-1 text-2xl font-semibold text-swf-verde">¿Olvidaste tu contraseña?</h1>
      <p className="mb-6 text-sm text-swf-verde/70">
        Escribe el correo con el que te registraste y te mandaremos un enlace para crear una nueva.
      </p>
      {error === "enlace" ? (
        <p className="mb-4 rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          Ese enlace ya expiró o ya se usó. Pide uno nuevo.
        </p>
      ) : null}
      <RecuperarForm />
      <p className="mt-6 text-center text-sm text-swf-verde/70">
        ¿Ya la recordaste?{" "}
        <Link href="/login" className="font-medium text-swf-dorado">
          Ingresar
        </Link>
      </p>
    </div>
  );
}
