import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Crown, Loader2, ShieldCheck, Target, Zap } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useEhAdmin } from "@/lib/admin";
import { buscarStatusPlano, PLANOS_PREMIUM } from "@/lib/plano";

export const Route = createFileRoute("/minha-assinatura")({
  head: () => ({ meta: [{ title: "Minha assinatura — ResidênciaPro" }] }),
  component: MinhaAssinaturaPage,
});

function MinhaAssinaturaPage() {
  const { ehAdmin } = useEhAdmin();
  const plano = useQuery({ queryKey: ["status-plano"], queryFn: buscarStatusPlano, retry: false });
  const status = plano.data;
  const premium = ehAdmin || status?.premium;

  return (
    <AppShell titulo="Minha assinatura" descricao="Veja seu plano atual e o limite de questões do dia.">
      {plano.isLoading ? (
        <div className="rounded-2xl border border-border/60 bg-card p-5 text-sm text-muted-foreground">
          <p className="flex items-center gap-2">
            <Loader2 className="size-4 animate-spin" /> Carregando seu plano…
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          <section className="rounded-3xl border border-primary/40 bg-primary/10 p-6">
            <div className="flex items-center gap-3">
              <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
                {premium ? <Crown className="size-6" /> : <Target className="size-6" />}
              </span>
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Plano atual</p>
                <h2 className="font-display text-2xl font-bold">
                  {ehAdmin ? "Admin Premium" : premium ? "Premium" : "Grátis"}
                </h2>
              </div>
            </div>

            {ehAdmin ? (
              <p className="mt-4 flex items-center gap-2 text-sm text-muted-foreground">
                <ShieldCheck className="size-4 text-primary" /> Administradores têm acesso Premium automaticamente.
              </p>
            ) : premium ? (
              <p className="mt-4 text-sm text-muted-foreground">
                Você tem acesso a questões ilimitadas, materiais completos e ferramentas de IA.
              </p>
            ) : (
              <>
                <p className="mt-4 text-sm text-muted-foreground">
                  No plano grátis você pode responder até {status?.limiteDiario ?? 10} questões por dia.
                </p>
                <div className="mt-4 rounded-2xl border border-border/60 bg-card p-4">
                  <div className="flex items-center justify-between text-xs font-semibold text-primary">
                    <span>Questões hoje</span>
                    <span>{status?.questoesHoje ?? 0}/{status?.limiteDiario ?? 10}</span>
                  </div>
                  <div className="mt-2 h-2 overflow-hidden rounded-full bg-background/80">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.min(100, (((status?.questoesHoje ?? 0) / (status?.limiteDiario ?? 10)) * 100))}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-muted-foreground">
                    Restam {status?.restantesHoje ?? 10} questões gratuitas hoje.
                  </p>
                </div>
              </>
            )}
          </section>

          {!premium ? (
            <section className="rounded-3xl border border-border/60 bg-card p-5">
              <h3 className="font-display text-lg font-semibold">Assinar Premium</h3>
              <p className="mt-1 text-sm text-muted-foreground">
                Desbloqueie questões ilimitadas, materiais completos e ferramentas de IA.
              </p>
              <div className="mt-4 grid gap-2 sm:grid-cols-2">
                {PLANOS_PREMIUM.map((p) => (
                  <Link
                    key={p.id}
                    to="/premium"
                    className="rounded-2xl border border-primary/40 bg-primary/10 p-4 text-left"
                  >
                    <p className="text-sm font-semibold text-primary">{p.nome}</p>
                    <p className="mt-1 font-display text-xl font-bold">{p.preco}</p>
                    <p className="text-xs text-muted-foreground">{p.periodo}</p>
                    {p.destaque ? <p className="mt-2 text-[11px] font-semibold text-primary">{p.destaque}</p> : null}
                  </Link>
                ))}
              </div>
            </section>
          ) : null}

          <Link
            to="/questoes"
            search={{ retomar: undefined, assunto: undefined, compartilhada: undefined }}
            className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground"
          >
            <Zap className="size-4" /> Continuar estudando
          </Link>
        </div>
      )}
    </AppShell>
  );
}
