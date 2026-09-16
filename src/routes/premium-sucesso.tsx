import { createFileRoute, Link } from "@tanstack/react-router";
import { CheckCircle2, Crown, Loader2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AppShell } from "@/components/AppShell";
import { buscarStatusPlano } from "@/lib/plano";

export const Route = createFileRoute("/premium-sucesso")({
  head: () => ({ meta: [{ title: "Pagamento aprovado — ResidênciaPro" }] }),
  component: PremiumSucessoPage,
});

function PremiumSucessoPage() {
  const plano = useQuery({ queryKey: ["status-plano"], queryFn: buscarStatusPlano, retry: false, refetchInterval: 4000 });
  const premium = plano.data?.premium === true;

  return (
    <AppShell titulo="Premium" descricao="Status da sua assinatura.">
      <section className="rounded-3xl border border-primary/40 bg-primary/10 p-6 text-center">
        <span className="mx-auto flex size-14 items-center justify-center rounded-2xl bg-primary/15 text-primary">
          {premium ? <CheckCircle2 className="size-8" /> : <Loader2 className="size-8 animate-spin" />}
        </span>
        <h2 className="mt-4 font-display text-xl font-bold">
          {premium ? "Premium ativado!" : "Pagamento recebido"}
        </h2>
        <p className="mx-auto mt-2 max-w-sm text-sm leading-relaxed text-muted-foreground">
          {premium
            ? "Seu acesso Premium já está liberado. Agora você pode estudar sem limite diário e acessar materiais completos e IA."
            : "Estamos aguardando a confirmação automática do Mercado Pago. Isso costuma acontecer em poucos instantes."}
        </p>
        {premium ? (
          <Link
            to="/questoes"
            search={{ retomar: undefined, assunto: undefined, compartilhada: undefined }}
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            <Crown className="size-4" /> Começar a estudar
          </Link>
        ) : (
          <Link
            to="/premium"
            className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            <Crown className="size-4" /> Voltar ao Premium
          </Link>
        )}
      </section>
    </AppShell>
  );
}
