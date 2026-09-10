import Link from "next/link";
import { RegistroForm } from "./RegistroForm";

export default function RegistroPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center">
      <h1 className="mb-1 text-2xl font-semibold text-swf-verde">Únete a SwapFairways</h1>
      <p className="mb-6 text-sm text-swf-verde/70">
        Crea tu cuenta y recibe créditos de bienvenida para empezar a intercambiar rondas.
      </p>
      <RegistroForm />
      <p className="mt-6 text-center text-sm text-swf-verde/70">
        ¿Ya tienes cuenta?{" "}
        <Link href="/login" className="font-medium text-swf-dorado">
          Ingresa
        </Link>
      </p>
    </div>
  );
}
