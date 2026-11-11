import { RestablecerForm } from "./RestablecerForm";

export default function RestablecerPage() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-sm flex-col justify-center">
      <h1 className="mb-1 text-2xl font-semibold text-swf-verde">Crea tu nueva contraseña</h1>
      <p className="mb-6 text-sm text-swf-verde/70">Usa al menos 8 caracteres.</p>
      <RestablecerForm />
    </div>
  );
}
