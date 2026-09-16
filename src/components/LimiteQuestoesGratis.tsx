import { Link } from "@tanstack/react-router";
import { Crown, Target, Zap } from "lucide-react";
import { LIMITE_QUESTOES_GRATIS_DIA, calcularRestantes, planoEstaNoLimite, type StatusPlano } from "@/lib/plano";

export function ContadorQuestoesGratis({ status }: { status: StatusPlano | undefined }) {
  if (!status || status.premium || !status.limiteDiario) return null;

  const usadas = Math.min(status.questoesHoje, status.limiteDiario);
  const restantes = calcularRestantes(status);
  const percentual = Math.min(100, Math.round((usadas / status.limiteDiario) * 100));
  const noLimite = planoEstaNoLimite(status);

  return (
    <Link to="/premium" className="mt-3 block rounded-2xl border border-primary/30 bg-primary/10 p-3">
      <div className="flex items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-xs font-semibold text-primary">
          <Target className="size-3.5" /> Questões grátis hoje
        </p>
        <p className="text-xs font-semibold text-primary">
          {usadas}/{status.limiteDiario}
        </p>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-background/70">
        <div className="h-full rounded-full bg-primary" style={{ width: `${percentual}%` }} />
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">
        {noLimite
          ? "Limite gratuito concluído. Continue sem limites no Premium."
          : `Restam ${restantes ?? status.limiteDiario} questões gratuitas hoje.`}
      </p>
    </Link>
  );
}

export function LimiteGratisAtingido({ limite = LIMITE_QUESTOES_GRATIS_DIA }: { limite?: number }) {
  return (
    <div className="mt-4 rounded-3xl border border-primary/40 bg-primary/10 p-6 text-center">
      <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
        <Target className="size-6" />
      </span>
      <h2 className="mt-4 font-display text-lg font-semibold">Meta gratuita concluída 🎯</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
        Você respondeu suas {limite} questões gratuitas de hoje. No Premium, continue estudando sem limite diário.
      </p>
      <Link
        to="/premium"
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
      >
        <Crown className="size-4" /> Conhecer Premium
      </Link>
      <Link
        to="/material"
        className="mt-3 flex items-center justify-center gap-2 text-xs font-medium text-primary"
      >
        <Zap className="size-3.5" /> Ver materiais e recursos Premium
      </Link>
    </div>
  );
}
