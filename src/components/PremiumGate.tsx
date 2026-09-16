import { Link } from "@tanstack/react-router";
import { Crown, Lock, Loader2 } from "lucide-react";
import type { ReactNode } from "react";
import { usePlano } from "@/hooks/usePlano";
import { cn } from "@/lib/utils";

export function PremiumGate({
  children,
  titulo = "Recurso exclusivo Premium",
  descricao = "Assine o Premium para desbloquear este recurso e estudar sem limitações.",
  compacto = false,
}: {
  children: ReactNode;
  titulo?: string;
  descricao?: string;
  compacto?: boolean;
}) {
  const { premium, carregando } = usePlano();

  if (premium) return <>{children}</>;

  if (carregando) {
    return (
      <div className={cn("rounded-2xl border border-border/60 bg-card text-sm text-muted-foreground", compacto ? "m-4 p-4" : "p-5")}>
        <p className="flex items-center gap-2">
          <Loader2 className="size-4 animate-spin" /> Verificando seu plano…
        </p>
      </div>
    );
  }

  return <PremiumCallout titulo={titulo} descricao={descricao} compacto={compacto} />;
}

export function PremiumCallout({
  titulo = "Continue com Premium",
  descricao = "Desbloqueie questões ilimitadas, materiais completos e ferramentas de IA.",
  compacto = false,
}: {
  titulo?: string;
  descricao?: string;
  compacto?: boolean;
}) {
  return (
    <div className={cn("rounded-3xl border border-primary/40 bg-primary/10 text-center", compacto ? "m-4 p-4" : "p-6")}>
      <span className={cn("mx-auto flex items-center justify-center rounded-2xl bg-primary/15 text-primary", compacto ? "size-10" : "size-12")}>
        <Lock className={compacto ? "size-5" : "size-6"} />
      </span>
      <h2 className={cn("mt-4 font-display font-semibold", compacto ? "text-base" : "text-lg")}>{titulo}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">{descricao}</p>
      <Link
        to="/premium"
        className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
      >
        <Crown className="size-4" /> Conhecer Premium
      </Link>
    </div>
  );
}
