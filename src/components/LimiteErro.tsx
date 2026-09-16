import { Component, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { AlertTriangle, Crown } from "lucide-react";

function pareceErroPremiumOuLimite(erro: Error) {
  const msg = `${erro.message ?? ""} ${erro.stack ?? ""}`.toLowerCase();
  return (
    msg.includes("limite") ||
    msg.includes("premium") ||
    msg.includes("questões gratuitas") ||
    msg.includes("questoes gratuitas") ||
    msg.includes("premium_necessario")
  );
}

export class LimiteErro extends Component<{ children: ReactNode }, { erro: Error | null }> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { erro: null };
  }

  static getDerivedStateFromError(erro: Error) {
    return { erro };
  }

  override render() {
    if (this.state.erro) {
      if (pareceErroPremiumOuLimite(this.state.erro)) {
        return (
          <div className="rounded-3xl border border-primary/40 bg-primary/10 p-6 text-center">
            <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary">
              <Crown className="size-6" />
            </span>
            <h2 className="mt-4 font-display text-lg font-semibold">Continue com Premium</h2>
            <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">
              Você atingiu o limite gratuito ou tentou usar um recurso exclusivo Premium. Assine para continuar sem limite diário.
            </p>
            <Link
              to="/premium"
              className="mt-5 inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
            >
              <Crown className="size-4" /> Conhecer Premium
            </Link>
          </div>
        );
      }

      return (
        <div className="rounded-2xl border border-amber-500/40 bg-amber-500/10 p-4 text-sm text-amber-700">
          <p className="flex items-center gap-2 font-semibold">
            <AlertTriangle className="size-4" /> Algo deu errado nesta parte da tela.
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Tente atualizar a página. Se continuar acontecendo, envie um print para o suporte.
          </p>
        </div>
      );
    }
    return this.props.children;
  }
}
