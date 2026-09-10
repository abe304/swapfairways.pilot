import { createClient } from "@/lib/supabase/server";
import { requireProfile } from "@/lib/auth";
import { Card, Badge } from "@/components/ui/Card";

const TIPO_LABEL: Record<string, string> = {
  bienvenida: "Crédito de bienvenida",
  ganado: "Ganado como anfitrión",
  gastado: "Gastado en una ronda",
  ajuste_admin: "Ajuste del administrador",
};

const TIPO_TONE: Record<string, "default" | "gold" | "success" | "warning" | "danger"> = {
  bienvenida: "gold",
  ganado: "success",
  gastado: "warning",
  ajuste_admin: "default",
};

export default async function CreditosPage() {
  const profile = await requireProfile();
  const supabase = await createClient();

  const { data: transactions } = await supabase
    .from("credit_transactions")
    .select("*")
    .eq("user_id", profile.id)
    .order("created_at", { ascending: false });

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Card className="bg-swf-verde text-swf-crema">
        <p className="text-sm text-swf-crema/70">Tu balance actual</p>
        <p className="text-4xl font-semibold text-swf-dorado">
          {profile.creditos_balance} créditos
        </p>
      </Card>

      <section>
        <h2 className="mb-3 text-lg font-semibold text-swf-verde">Historial de movimientos</h2>
        {!transactions?.length ? (
          <Card>
            <p className="text-sm text-swf-verde/60">Aún no tienes movimientos.</p>
          </Card>
        ) : (
          <div className="space-y-2">
            {transactions.map((tx) => (
              <Card key={tx.id}>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-swf-verde">{TIPO_LABEL[tx.tipo]}</p>
                    <p className="text-xs text-swf-verde/50">
                      {new Date(tx.created_at).toLocaleString("es-MX")}
                      {tx.nota ? ` · ${tx.nota}` : ""}
                    </p>
                  </div>
                  <Badge tone={TIPO_TONE[tx.tipo]}>
                    {tx.monto > 0 ? `+${tx.monto}` : tx.monto}
                  </Badge>
                </div>
              </Card>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
