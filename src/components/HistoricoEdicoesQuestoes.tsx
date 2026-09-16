import { useQuery } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { buscarLogEdicoes, type AlteracaoCampo } from "@/lib/admin";

function formatarValor(v: unknown) {
  if (v === null || v === undefined || v === "") return "—";
  if (typeof v === "boolean") return v ? "sim" : "não";
  return String(v);
}

function formatarAlteracoes(alteracoes: Record<string, AlteracaoCampo>) {
  return Object.entries(alteracoes)
    .map(([campo, { de, para }]) => `${campo}: ${formatarValor(de)} → ${formatarValor(para)}`)
    .join(" · ");
}

export function HistoricoEdicoesQuestoes() {
  const log = useQuery({ queryKey: ["log-edicoes-questoes"], queryFn: buscarLogEdicoes });

  if (log.isLoading) {
    return (
      <p className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" /> Carregando histórico...
      </p>
    );
  }

  const linhas = log.data ?? [];

  if (!linhas.length) {
    return <p className="text-xs text-muted-foreground">Nenhuma alteração registrada ainda.</p>;
  }

  return (
    <div className="space-y-2">
      {linhas.map((l) => (
        <div key={l.id} className="rounded-xl border border-border/50 bg-surface p-3">
          <p className="text-xs text-foreground">
            <span className="text-muted-foreground">Enunciado:</span> {l.enunciadoResumo}
            {l.enunciadoResumo.length >= 100 ? "…" : ""}
          </p>
          <p className="mt-1 text-[11px] text-primary">{formatarAlteracoes(l.alteracoes)}</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {l.editadoPorEmail} ·{" "}
            {new Date(l.criadoEm).toLocaleString("pt-BR", {
              day: "2-digit",
              month: "2-digit",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
      ))}
    </div>
  );
}
