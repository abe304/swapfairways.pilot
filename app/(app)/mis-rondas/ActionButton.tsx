"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

type ActionResult = { error?: string; success?: boolean } | undefined;

export function ActionButton({
  label,
  pendingLabel,
  variant = "primary",
  requestId,
  action,
}: {
  label: string;
  pendingLabel: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  requestId: string;
  // Debe ser una Server Action importada directamente (no un closure creado
  // en el Server Component) para poder pasarse como prop a este Client
  // Component — Next.js no permite serializar closures arbitrarios.
  action: (requestId: string) => Promise<ActionResult>;
}) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div>
      <Button
        variant={variant}
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await action(requestId);
            if (result?.error) {
              setError(result.error);
            } else {
              router.refresh();
            }
          })
        }
      >
        {pending ? pendingLabel : label}
      </Button>
      {error ? <p className="mt-1 text-xs text-red-700">{error}</p> : null}
    </div>
  );
}
