import { createFileRoute } from "@tanstack/react-router";
import { exigirLogin } from "@/lib/auth";
import { Check, Clock } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { cronograma, dias } from "@/data/cronograma";
import { useProgresso } from "@/lib/progresso";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/cronograma")({
  beforeLoad: exigirLogin,
  head: () => ({
    meta: [
      { title: "Agenda semanal de estudos — ResidênciaPro" },
      {
        name: "description",
        content:
          "Agenda semanal para residência médica com blocos de teoria, questões, revisão e simulado, e acompanhamento do que já foi concluído.",
      },
      { property: "og:title", content: "Agenda semanal de estudos" },
      {
        property: "og:description",
        content: "Blocos de teoria, questões, revisão e simulado organizados por dia da semana.",
      },
    ],
  }),
  component: CronogramaPage,
});

function CronogramaPage() {
  const { progresso, alternarBloco } = useProgresso();
  const totalMin = cronograma.reduce((s, b) => s + b.minutos, 0);
  const feitosMin = cronograma.filter((b) => progresso.blocosFeitos.includes(b.id)).reduce((s, b) => s + b.minutos, 0);
  const pct = Math.round((feitosMin / totalMin) * 100);

  return (
    <AppShell
      titulo="Agenda semanal"
      descricao="Marque os blocos concluídos para acompanhar sua carga de estudo da semana."
    >
      <div className="rounded-2xl border border-border/60 bg-card p-5">
        <div className="flex items-end justify-between">
          <div>
            <p className="font-display text-2xl font-semibold text-primary">{pct}%</p>
            <p className="text-xs text-muted-foreground">
              {Math.round(feitosMin / 60)}h de {Math.round(totalMin / 60)}h planejadas
            </p>
          </div>
          <Clock className="size-5 text-muted-foreground" />
        </div>
        <div className="mt-4 h-2 overflow-hidden rounded-full bg-secondary">
          <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
        </div>
      </div>

      <div className="mt-6 space-y-6">
        {dias.map((dia) => {
          const blocos = cronograma.filter((b) => b.dia === dia);
          if (!blocos.length) return null;
          return (
            <section key={dia}>
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">{dia}</h2>
              <ul className="mt-2 space-y-2">
                {blocos.map((b) => {
                  const feito = progresso.blocosFeitos.includes(b.id);
                  return (
                    <li key={b.id}>
                      <button
                        onClick={() => alternarBloco(b.id)}
                        className={cn(
                          "flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors",
                          feito
                            ? "border-success/60 bg-success/10"
                            : "border-border/60 bg-surface hover:border-primary/50",
                        )}
                      >
                        <span
                          className={cn(
                            "flex size-6 shrink-0 items-center justify-center rounded-md border",
                            feito ? "border-success bg-success text-success-foreground" : "border-border",
                          )}
                        >
                          {feito ? <Check className="size-4" /> : null}
                        </span>
                        <span className="flex-1">
                          <span className={cn("block text-sm font-medium", feito && "line-through opacity-70")}>
                            {b.tema}
                          </span>
                          <span className="block text-xs text-muted-foreground">
                            {b.tipo} · {b.area} · {b.minutos} min
                          </span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
    </AppShell>
  );
}
