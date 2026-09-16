import { createFileRoute, Link } from "@tanstack/react-router";
import { Clock, Crown } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/premium-pendente")({
  head: () => ({ meta: [{ title: "Pagamento pendente — ResidênciaPro" }] }),
  component: PremiumPendentePage,
});

function PremiumPendentePage() {
  return (
    <AppShell titulo="Pagamento pendente" descricao="Aguardando confirmação do Mercado Pago.">
      <section className="rounded-3xl border border-amber-500/40 bg-amber-500/10 p-6 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-amber-500/15 text-amber-600">
          <Clock className="size-8" />
        </span>
        <h2 className="mt-4 font-display text-xl font-bold">Pagamento em análise</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          Assim que o Mercado Pago confirmar o pagamento, o Premium será liberado automaticamente na sua conta.
        </p>
        <Link
          to="/premium"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          <Crown className="size-4" /> Ver Premium
        </Link>
      </section>
    </AppShell>
  );
}
