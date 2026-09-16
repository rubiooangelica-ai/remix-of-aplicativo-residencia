import { useQuery } from "@tanstack/react-query";
import { useEhAdmin } from "@/lib/admin";
import { useSessao } from "@/lib/auth";
import { buscarStatusPlano, calcularRestantes, planoEstaNoLimite, textoResumoPlano } from "@/lib/plano";

export function usePlano() {
  const { usuario } = useSessao();
  const { ehAdmin, carregando: carregandoAdmin } = useEhAdmin();
  const plano = useQuery({
    queryKey: ["status-plano", usuario?.id],
    queryFn: buscarStatusPlano,
    enabled: !!usuario,
    retry: false,
    staleTime: 60 * 1000,
  });

  const premium = ehAdmin || plano.data?.premium === true;
  const status = plano.data
    ? {
        ...plano.data,
        premium,
        plano: premium ? ("premium" as const) : plano.data.plano,
        restantesHoje: premium ? null : plano.data.restantesHoje,
        limiteDiario: premium ? null : plano.data.limiteDiario,
      }
    : undefined;

  return {
    usuario,
    status,
    premium,
    ehAdmin,
    carregando: carregandoAdmin || plano.isLoading,
    erro: plano.error,
    refetch: plano.refetch,
    restantesHoje: calcularRestantes(status),
    noLimite: planoEstaNoLimite(status),
    texto: textoResumoPlano(status),
  };
}
