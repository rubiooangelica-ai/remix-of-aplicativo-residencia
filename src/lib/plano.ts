import { supabase } from "@/integrations/supabase/client";

export type StatusPlano = {
  plano: "gratis" | "premium";
  premium: boolean;
  questoesHoje: number;
  limiteDiario: number | null;
  restantesHoje: number | null;
};

export type PlanoCheckout = "premium_mensal" | "premium_anual";

export type PlanoPremiumInfo = {
  id: PlanoCheckout;
  nome: string;
  preco: string;
  periodo: string;
  destaque?: string;
};

export const LIMITE_QUESTOES_GRATIS_DIA = 10;

export const PLANOS_PREMIUM: PlanoPremiumInfo[] = [
  {
    id: "premium_mensal",
    nome: "Mensal",
    preco: "R$ 29,90",
    periodo: "/mês",
  },
  {
    id: "premium_anual",
    nome: "Anual",
    preco: "R$ 249,90",
    periodo: "/ano",
    destaque: "melhor custo-benefício",
  },
];

const STATUS_GRATIS_PADRAO: StatusPlano = {
  plano: "gratis",
  premium: false,
  questoesHoje: 0,
  limiteDiario: LIMITE_QUESTOES_GRATIS_DIA,
  restantesHoje: LIMITE_QUESTOES_GRATIS_DIA,
};

export function planoEstaNoLimite(status: StatusPlano | undefined) {
  return !!status && !status.premium && status.limiteDiario !== null && status.restantesHoje !== null && status.restantesHoje <= 0;
}

export function textoResumoPlano(status: StatusPlano | undefined) {
  if (!status) return "Plano grátis";
  if (status.premium) return "Premium";
  return `${status.questoesHoje}/${status.limiteDiario ?? LIMITE_QUESTOES_GRATIS_DIA} grátis hoje`;
}

export function calcularRestantes(status: StatusPlano | undefined) {
  if (!status) return LIMITE_QUESTOES_GRATIS_DIA;
  if (status.premium || status.restantesHoje === null) return null;
  return Math.max(0, status.restantesHoje);
}

export async function criarCheckoutPremium(input: { plan: PlanoCheckout; userId?: string; email?: string }) {
  const { data, error } = await supabase.functions.invoke("criar-checkout-premium", {
    body: { plan: input.plan, user_id: input.userId, email: input.email },
  });
  if (error) throw new Error(error.message);
  const payload = data as { url?: string; error?: string } | null;
  if (!payload?.url) throw new Error(payload?.error || "Checkout ainda não configurado.");
  return payload.url;
}

export async function buscarStatusPlano(): Promise<StatusPlano> {
  const cliente = supabase as any;
  const { data, error } = await cliente.rpc("meu_status_plano");

  // Durante deploy/migration, evita quebrar Material, IA e topo do app caso a
  // função ainda não exista no banco. Quando a migration aplicar, o status real assume.
  if (error) return STATUS_GRATIS_PADRAO;

  const v = (data ?? {}) as Record<string, unknown>;
  const premium = Boolean(v["premium"]);
  const limiteDiario = v["limite_diario"] == null ? null : Number(v["limite_diario"]);
  const questoesHoje = Number(v["questoes_hoje"] ?? 0);

  return {
    plano: premium ? "premium" : "gratis",
    premium,
    questoesHoje,
    limiteDiario,
    restantesHoje:
      v["restantes_hoje"] == null
        ? limiteDiario == null
          ? null
          : Math.max(0, limiteDiario - questoesHoje)
        : Number(v["restantes_hoje"]),
  };
}
