"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { solicitarUnion } from "../actions";
import { Button } from "@/components/ui/Button";

export function RequestButton({ offerId }: { offerId: string }) {
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const router = useRouter();

  return (
    <div>
      <Button
        disabled={pending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await solicitarUnion(offerId);
            if (result?.error) {
              setError(result.error);
            } else {
              router.refresh();
            }
          })
        }
      >
        {pending ? "Enviando..." : "Solicitar unión (1 crédito)"}
      </Button>
      {error ? <p className="mt-2 text-sm text-red-700">{error}</p> : null}
    </div>
  );
}
