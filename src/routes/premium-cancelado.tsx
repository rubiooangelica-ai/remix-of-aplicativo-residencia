import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, XCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/premium-cancelado")({
  head: () => ({ meta: [{ title: "Pagamento não concluído — ResidênciaPro" }] }),
  component: PremiumCanceladoPage,
});

function PremiumCanceladoPage() {
  return (
    <AppShell titulo="Pagamento não concluído" descricao="Você pode tentar novamente quando quiser.">
      <section className="rounded-3xl border border-border/60 bg-card p-6 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-destructive/10 text-destructive">
          <XCircle className="size-8" />
        </span>
        <h2 className="mt-4 font-display text-xl font-bold">Assinatura não ativada</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          O pagamento não foi concluído ou foi cancelado. Seu plano grátis continua funcionando com 10 questões por dia.
        </p>
        <Link
          to="/premium"
          className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
        >
          <ArrowLeft className="size-4" /> Tentar novamente
        </Link>
      </section>
    </AppShell>
  );
}
