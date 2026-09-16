import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { AlertTriangle, Crown, X } from "lucide-react";

function ehErroPremiumOuLimite(texto: string) {
  const normalizado = texto.toLowerCase();
  return (
    normalizado.includes("premium") ||
    normalizado.includes("premium_necessario") ||
    (normalizado.includes("limite") && normalizado.includes("quest")) ||
    normalizado.includes("questões gratuitas") ||
    normalizado.includes("questoes gratuitas")
  );
}

export function ErroGlobal() {
  const [erro, setErro] = useState<{ texto: string; premium: boolean } | null>(null);

  useEffect(() => {
    function mensagemAmigavel(mensagem: unknown) {
      const texto = String(mensagem ?? "");
      if (ehErroPremiumOuLimite(texto)) {
        return {
          texto: "Você atingiu o limite gratuito ou tentou usar um recurso exclusivo Premium. Assine para continuar sem limite diário.",
          premium: true,
        };
      }
      return { texto: "Algo não saiu como esperado. Tente novamente em instantes.", premium: false };
    }

    function aoErro(e: ErrorEvent) {
      setErro(mensagemAmigavel(e.message));
    }

    function aoRejeicao(e: PromiseRejectionEvent) {
      const motivo = e.reason;
      setErro(mensagemAmigavel(motivo?.message ?? motivo));
    }

    window.addEventListener("error", aoErro);
    window.addEventListener("unhandledrejection", aoRejeicao);
    return () => {
      window.removeEventListener("error", aoErro);
      window.removeEventListener("unhandledrejection", aoRejeicao);
    };
  }, []);

  if (!erro) return null;

  return (
    <div className="fixed inset-x-4 top-4 z-[80] mx-auto max-w-xl rounded-2xl border border-primary/30 bg-card p-4 shadow-xl">
      <div className="flex items-start gap-3">
        {erro.premium ? (
          <Crown className="mt-0.5 size-5 shrink-0 text-primary" />
        ) : (
          <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-500" />
        )}
        <div className="flex-1">
          <p className="text-sm font-semibold">{erro.premium ? "Continue com Premium" : "Aviso"}</p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{erro.texto}</p>
          {erro.premium ? (
            <Link to="/premium" className="mt-3 inline-flex rounded-lg bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground">
              Conhecer Premium
            </Link>
          ) : null}
        </div>
        <button onClick={() => setErro(null)} className="rounded-full p-1 text-muted-foreground hover:bg-surface">
          <X className="size-4" />
        </button>
      </div>
    </div>
  );
}
