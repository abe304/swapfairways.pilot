import Link from "next/link";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ redirectTo?: string }>;
}) {
  const { redirectTo } = await searchParams;

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center">
      <h1 className="mb-1 text-2xl font-semibold text-swf-verde">Bienvenido de vuelta</h1>
      <p className="mb-6 text-sm text-swf-verde/70">
        Ingresa a tu cuenta de SwapFairways.
      </p>
      <LoginForm redirectTo={redirectTo ?? "/ofertas"} />
      <p className="mt-6 text-center text-sm text-swf-verde/70">
        ¿No tienes cuenta?{" "}
        <Link href="/registro" className="font-medium text-swf-dorado">
          Regístrate
        </Link>
      </p>
    </div>
  );
}
