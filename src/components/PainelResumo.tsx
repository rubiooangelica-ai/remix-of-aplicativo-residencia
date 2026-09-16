import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { BookOpen, Loader2 } from "lucide-react";
import { ContadorQuestoesGratis, LimiteGratisAtingido } from "@/components/LimiteQuestoesGratis";
import { PremiumGate } from "@/components/PremiumGate";
import { gerarResumo } from "@/lib/estudo.functions";
import { buscarStatusPlano, planoEstaNoLimite } from "@/lib/plano";
import { useSessao } from "@/lib/auth";
import { cn } from "@/lib/utils";

const modos = [
  { id: "flash", rotulo: "Resumo relâmpago" },
  { id: "topicos", rotulo: "Tópicos completos" },
  { id: "pegadinhas", rotulo: "Pegadinhas de banca" },
] as const;

export function PainelResumo({ tema }: { tema: string }) {
  const { usuario } = useSessao();
  const statusPlano = useQuery({
    queryKey: ["status-plano", usuario?.id],
    queryFn: buscarStatusPlano,
    enabled: !!usuario,
    retry: false,
    staleTime: 0,
    refetchInterval: 15 * 1000,
  });
  const resumir = useServerFn(gerarResumo);
  const resumo = useMutation({
    mutationFn: async (modo: (typeof modos)[number]["id"]) => {
      const r = await resumir({ data: { tema, modo } });
      return { modo, texto: r.resumo };
    },
  });

  const limiteAtingido = planoEstaNoLimite(statusPlano.data);

  return (
    <section className="space-y-3">
      <ContadorQuestoesGratis status={statusPlano.data} />
      {limiteAtingido ? <LimiteGratisAtingido /> : null}

      <div className="rounded-2xl border border-border/60 bg-card p-4">
        <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          <BookOpen className="size-3.5" /> Revisar antes de resolver — {tema}
        </p>

        <PremiumGate
          compacto
          titulo="Resumos por IA são Premium"
          descricao="No plano grátis você continua respondendo questões e lendo comentários. No Premium, desbloqueia resumos rápidos, tópicos completos e pegadinhas de banca."
        >
          <div className="mt-3 flex flex-wrap gap-2">
            {modos.map((m) => (
              <button
                key={m.id}
                onClick={() => resumo.mutate(m.id)}
                disabled={resumo.isPending}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60",
                  resumo.data?.modo === m.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/70 text-muted-foreground",
                )}
              >
                {m.rotulo}
              </button>
            ))}
          </div>

          {resumo.isPending ? (
            <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" /> montando o resumo...
            </p>
          ) : null}
          {resumo.isError ? (
            <p className="mt-3 text-xs text-destructive">
              {(resumo.error as Error).message || "Não foi possível gerar o resumo."}
            </p>
          ) : null}
          {resumo.data ? (
            <div className="mt-3 space-y-2 rounded-xl border border-border/50 bg-surface p-3 text-sm leading-relaxed text-foreground/90">
              {resumo.data.texto
                .split("\n")
                .filter((l) => l.trim())
                .map((l, i) => (
                  <p key={i}>{l.replace(/^[*#\s]+/, "")}</p>
                ))}
            </div>
          ) : null}
        </PremiumGate>
      </div>
    </section>
  );
}
