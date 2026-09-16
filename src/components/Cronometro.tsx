import { useEffect, useRef, useState } from "react";
import { Pause, Play, Timer } from "lucide-react";

export function useCronometro(ativoInicial = true) {
  const [segundos, setSegundos] = useState(0);
  const [rodando, setRodando] = useState(ativoInicial);
  const ref = useRef(0);
  ref.current = segundos;

  useEffect(() => {
    if (!rodando) return;
    const id = setInterval(() => setSegundos((s) => s + 1), 1000);
    return () => clearInterval(id);
  }, [rodando]);

  return {
    segundos,
    rodando,
    alternar: () => setRodando((r) => !r),
    zerar: () => setSegundos(0),
    ler: () => ref.current,
  };
}

export function formatarTempo(total: number) {
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return h ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function Cronometro({
  segundos,
  rodando,
  onAlternar,
}: {
  segundos: number;
  rodando: boolean;
  onAlternar: () => void;
}) {
  return (
    <button
      onClick={onAlternar}
      aria-label={rodando ? "Pausar cronômetro" : "Retomar cronômetro"}
      className="flex items-center gap-2 rounded-full border border-border/70 bg-surface px-3 py-1.5 text-xs font-semibold text-foreground"
    >
      {rodando ? <Pause className="size-3.5 text-primary" /> : <Play className="size-3.5" />}
      <Timer className="size-3.5 text-muted-foreground" />
      <span className="font-display tabular-nums">{formatarTempo(segundos)}</span>
      <span className="text-[10px] font-normal uppercase tracking-wide text-muted-foreground">
        {rodando ? "pausar" : "pausado"}
      </span>
    </button>
  );
}
