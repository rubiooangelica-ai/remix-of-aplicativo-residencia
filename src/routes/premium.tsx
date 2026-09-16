import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { Check, Crown, Loader2, ShieldCheck, Sparkles, Zap } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useEhAdmin } from "@/lib/admin";
import { useSessao } from "@/lib/auth";
import { criarCheckoutPremium, PLANOS_PREMIUM, type PlanoCheckout } from "@/lib/plano";

export const Route = createFileRoute("/premium")({
  head: () => ({
    meta: [
      { title: "Premium — ResidênciaPro" },
      {
        name: "description",
        content: "Conheça o ResidênciaPro Premium: questões ilimitadas, materiais completos e ferramentas de IA.",
      },
    ],
  }),
  component: PremiumPage,
});

const gratis = [
  "10 questões por dia",
  "Comentários das questões",
  "Progresso básico",
  "Ranking, Agenda e Ligas",
];

const premium = [
  "Questões ilimitadas todos os dias",
  "Resumos e materiais completos",
  "Tutor e explicações por IA",
  "Progresso avançado",
  "Caderno de erros",
  "Filtros avançados",
  "Flashcards inteligentes",
  "Simulados personalizados",
];

function PremiumPage() {
  const { ehAdmin } = useEhAdmin();
  const { usuario } = useSessao();

  const checkout = useMutation({
    mutationFn: async (plan: PlanoCheckout) => {
      const url = await criarCheckoutPremium({
        plan,
        ...(usuario?.id ? { userId: usuario.id } : {}),
        ...(usuario?.email ? { email: usuario.email } : {}),
      });
      window.location.href = url;
    },
  });

  return (
    <AppShell titulo="ResidênciaPro Premium" descricao="Estude sem limites e desbloqueie as ferramentas mais fortes do aplicativo.">
      <section className="overflow-hidden rounded-3xl border border-primary/40 bg-gradient-to-br from-primary/20 via-card to-card p-6">
        <div className="flex items-center gap-3">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Crown className="size-6" />
          </span>
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Premium</p>
            <h2 className="font-display text-2xl font-bold">Desbloqueie todo o ResidênciaPro</h2>
          </div>
        </div>

        <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
          O plano gratuito continua útil para criar hábito, com 10 questões por dia. O Premium é para quem quer estudar em volume,
          acessar os resumos completos e usar IA para acelerar a revisão.
        </p>
      </section>

      {ehAdmin ? (
        <Link
          to="/admin-assinaturas"
          className="mt-5 flex items-center justify-center gap-2 rounded-2xl border border-primary/40 bg-primary/10 px-5 py-3 text-sm font-semibold text-primary"
        >
          <ShieldCheck className="size-4" /> Administrar assinaturas
        </Link>
      ) : null}

      <section className="mt-5 grid gap-4 sm:grid-cols-2">
        <PlanoGratis />
        <PlanoPremium
          onAssinar={(id) => checkout.mutate(id)}
          carregando={checkout.isPending}
        />
      </section>

      {checkout.isError ? (
        <div className="mt-5 rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4">
          <p className="text-sm font-semibold text-amber-600">Não foi possível abrir o pagamento</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
            {(checkout.error as Error).message} Tente novamente em instantes; se persistir, fale com o suporte.
          </p>
        </div>
      ) : null}

      <section className="mt-5 rounded-3xl border border-border/60 bg-card p-5">
        <div className="flex items-start gap-3">
          <Sparkles className="mt-0.5 size-5 shrink-0 text-primary" />
          <div>
            <h3 className="font-display text-base font-semibold">Pagamento via Mercado Pago</h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Pague com PIX, cartão ou boleto em ambiente seguro do Mercado Pago. Assim que o pagamento é confirmado, seu Premium é liberado automaticamente.
            </p>
          </div>
        </div>
      </section>

      <Link
        to="/questoes"
        search={{ retomar: undefined, assunto: undefined, compartilhada: undefined }}
        className="mt-5 flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
      >
        <Zap className="size-4" />
        Continuar estudando
      </Link>
    </AppShell>
  );
}

function PlanoGratis() {
  return (
    <div className="rounded-3xl border border-border/60 bg-card p-5">
      <div className="flex items-center gap-2">
        <Sparkles className="size-5 text-muted-foreground" />
        <h2 className="font-display text-xl font-bold">Grátis</h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Para criar o hábito</p>
      <div className="mt-5 space-y-3">
        {gratis.map((i) => (
          <p key={i} className="flex items-start gap-2 text-sm">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" />
            {i}
          </p>
        ))}
      </div>
    </div>
  );
}

function PlanoPremium({
  onAssinar,
  carregando,
}: {
  onAssinar: (id: PlanoCheckout) => void;
  carregando?: boolean;
}) {
  return (
    <div className="rounded-3xl border border-primary/60 bg-primary/10 p-5">
      <div className="flex items-center gap-2">
        <Crown className="size-5 text-primary" />
        <h2 className="font-display text-xl font-bold">Premium</h2>
      </div>
      <p className="mt-1 text-xs text-muted-foreground">Para acelerar sua preparação</p>
      <div className="mt-5 space-y-3">
        {premium.map((i) => (
          <p key={i} className="flex items-start gap-2 text-sm">
            <Check className="mt-0.5 size-4 shrink-0 text-primary" />
            {i}
          </p>
        ))}
      </div>

      <div className="mt-6 space-y-2">
        {PLANOS_PREMIUM.map((plano) => (
          <button
            key={plano.id}
            onClick={() => onAssinar(plano.id)}
            disabled={carregando}
            className={
              plano.id === "premium_mensal"
                ? "flex w-full items-center justify-between rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-70"
                : "flex w-full items-center justify-between rounded-xl border border-primary/50 px-4 py-3 text-sm font-semibold text-primary disabled:opacity-70"
            }
          >
            <span className="flex items-center gap-2">
              {carregando ? <Loader2 className="size-4 animate-spin" /> : <Crown className="size-4" />}
              {plano.nome}
            </span>
            <span className="text-right">
              <span className="block">{plano.preco}</span>
              <span className="block text-[10px] font-medium opacity-80">{plano.periodo}</span>
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}
