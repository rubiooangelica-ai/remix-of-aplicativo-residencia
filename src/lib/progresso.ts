import { useCallback, useEffect, useState } from "react";

export type Progresso = {
  respondidas: Record<string, { escolhida: string; correta: boolean }>;
  blocosFeitos: string[];
};

const KEY = "residencia-progresso-v1";
const vazio: Progresso = { respondidas: {}, blocosFeitos: [] };

export function useProgresso() {
  const [progresso, setProgresso] = useState<Progresso>(vazio);
  const [pronto, setPronto] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setProgresso({ ...vazio, ...(JSON.parse(raw) as Progresso) });
    } catch {
      /* ignora storage indisponível */
    }
    setPronto(true);
  }, []);

  const salvar = useCallback((next: Progresso) => {
    setProgresso(next);
    try {
      localStorage.setItem(KEY, JSON.stringify(next));
    } catch {
      /* ignora storage indisponível */
    }
  }, []);

  const registrarResposta = useCallback(
    (id: string, escolhida: string, correta: boolean) => {
      setProgresso((prev) => {
        const next = { ...prev, respondidas: { ...prev.respondidas, [id]: { escolhida, correta } } };
        try {
          localStorage.setItem(KEY, JSON.stringify(next));
        } catch {
          /* ignora */
        }
        return next;
      });
    },
    [],
  );

  const alternarBloco = useCallback((id: string) => {
    setProgresso((prev) => {
      const feitos = prev.blocosFeitos.includes(id)
        ? prev.blocosFeitos.filter((b) => b !== id)
        : [...prev.blocosFeitos, id];
      const next = { ...prev, blocosFeitos: feitos };
      try {
        localStorage.setItem(KEY, JSON.stringify(next));
      } catch {
        /* ignora */
      }
      return next;
    });
  }, []);

  return { progresso, pronto, salvar, registrarResposta, alternarBloco };
}
