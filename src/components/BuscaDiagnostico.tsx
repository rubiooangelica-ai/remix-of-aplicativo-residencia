import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { buscarDiagnosticos } from "@/lib/diagnosticos-busca";

export function BuscaDiagnostico({
  lista,
  valor,
  onChange,
  onConfirmar,
  placeholder = "Digite o diagnóstico…",
}: {
  lista: string[];
  valor: string;
  onChange: (v: string) => void;
  onConfirmar: (v: string) => void;
  placeholder?: string;
}) {
  const [aberto, setAberto] = useState(false);
  const sugestoes = useMemo(() => buscarDiagnosticos(lista, valor), [lista, valor]);

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        value={valor}
        onChange={(e) => {
          onChange(e.target.value);
          setAberto(true);
        }}
        onFocus={() => setAberto(true)}
        onBlur={() => window.setTimeout(() => setAberto(false), 120)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && valor.trim()) {
            setAberto(false);
            onConfirmar(valor.trim());
          }
          if (e.key === "Escape") setAberto(false);
        }}
        placeholder={placeholder}
        autoComplete="off"
        className="w-full rounded-xl border border-border/70 bg-surface pl-10 pr-4 py-3 text-sm outline-none focus:border-primary"
      />
      {aberto && sugestoes.length ? (
        <ul className="absolute z-30 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-border/70 bg-card shadow-lg shadow-primary/10">
          {sugestoes.map((s) => (
            <li key={s}>
              <button
                type="button"
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  onChange(s);
                  setAberto(false);
                }}
                className="w-full px-4 py-2.5 text-left text-sm text-foreground/90 hover:bg-primary/15"
              >
                {s}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      {aberto && valor.trim().length >= 2 && !sugestoes.length ? (
        <p className="absolute z-30 mt-1 w-full rounded-xl border border-border/70 bg-card px-4 py-2.5 text-xs text-muted-foreground">
          Nenhum diagnóstico parecido — você pode chutar do seu jeito.
        </p>
      ) : null}
    </div>
  );
}
