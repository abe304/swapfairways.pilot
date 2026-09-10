"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/Button";

export function ActionButton({
  label,
  pendingLabel,
  variant = "primary",
  onRun,
}: {
  label: string;
  pendingLabel: string;
  variant?: "primary" | "secondary" | "danger" | "ghost";
  onRun: () => Promise<{ error?: string; success?: boolean } | undefined>;
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
            const result = await onRun();
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
