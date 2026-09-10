"use client";

import { useActionState, useState } from "react";
import { submitReview } from "./actions";
import { Button } from "@/components/ui/Button";
import { FormField, Textarea } from "@/components/ui/Field";
import { Card } from "@/components/ui/Card";
import { BEHAVIOR_TAGS } from "@/lib/utils";

export function ReviewForm({
  requestId,
  receptorId,
}: {
  requestId: string;
  receptorId: string;
}) {
  const [state, action, pending] = useActionState(submitReview, undefined);
  const [rating, setRating] = useState(5);

  return (
    <Card>
      <form action={action} className="space-y-4">
        <input type="hidden" name="request_id" value={requestId} />
        <input type="hidden" name="receptor_id" value={receptorId} />

        <FormField label="Calificación">
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                type="button"
                onClick={() => setRating(n)}
                className={`text-2xl ${n <= rating ? "text-swf-dorado" : "text-swf-verde/20"}`}
                aria-label={`${n} estrellas`}
              >
                ★
              </button>
            ))}
          </div>
          <input type="hidden" name="rating" value={rating} />
        </FormField>

        <FormField label="Tags de comportamiento (elige los que apliquen)">
          <div className="flex flex-wrap gap-2">
            {BEHAVIOR_TAGS.map((tag) => (
              <label
                key={tag}
                className="flex items-center gap-1.5 rounded-full border border-swf-verde/20 px-3 py-1 text-xs text-swf-verde"
              >
                <input type="checkbox" name="tags" value={tag} className="h-3 w-3" />
                {tag}
              </label>
            ))}
          </div>
        </FormField>

        <FormField label="Comentario (opcional)" htmlFor="comentario">
          <Textarea id="comentario" name="comentario" placeholder="¿Algo más que compartir?" />
        </FormField>

        {state?.error ? <p className="text-sm text-red-700">{state.error}</p> : null}
        <Button type="submit" disabled={pending}>
          {pending ? "Enviando..." : "Enviar reseña"}
        </Button>
      </form>
    </Card>
  );
}
