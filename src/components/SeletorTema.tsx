import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";

type Tema = "claro" | "escuro";

const CHAVE_TEMA = "residenciapro:tema";

function aplicarTema(tema: Tema) {
  const escuro = tema === "escuro";
  document.documentElement.classList.toggle("dark", escuro);
  document.documentElement.style.colorScheme = escuro ? "dark" : "light";
}

function temaInicial(): Tema {
  const salvo = window.localStorage.getItem(CHAVE_TEMA);
  if (salvo === "claro" || salvo === "escuro") return salvo;
  return window.matchMedia("(prefers-color-scheme: dark)").matches
    ? "escuro"
    : "claro";
}

export function SeletorTema() {
  const [tema, setTema] = useState<Tema | null>(null);

  useEffect(() => {
    const inicial = temaInicial();
    aplicarTema(inicial);
    setTema(inicial);
  }, []);

  function alternarTema() {
    const proximo: Tema = tema === "escuro" ? "claro" : "escuro";
    aplicarTema(proximo);
    window.localStorage.setItem(CHAVE_TEMA, proximo);
    setTema(proximo);
  }

  const escuro = tema === "escuro";

  return (
    <button
      type="button"
      onClick={alternarTema}
      aria-label={escuro ? "Ativar modo claro" : "Ativar modo escuro"}
      title={escuro ? "Modo claro" : "Modo escuro"}
      className="flex size-9 shrink-0 items-center justify-center rounded-full border border-border/70 bg-card text-muted-foreground transition-colors hover:border-primary/50 hover:text-primary"
    >
      {escuro ? <Sun className="size-4" /> : <Moon className="size-4" />}
    </button>
  );
}
