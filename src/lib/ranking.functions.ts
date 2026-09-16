import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { LinhaRanking } from "@/lib/diagnostico";

function normalizarLinhas(data: unknown): LinhaRanking[] {
  return ((data ?? []) as Record<string, unknown>[]).map((linha) => ({
    ...linha,
    pontos: Number(linha["pontos"]),
    acertos: Number(linha["acertos"]),
    jogadas: Number(linha["jogadas"]),
    ouro: Number(linha["ouro"] ?? 0),
    prata: Number(linha["prata"] ?? 0),
    bronze: Number(linha["bronze"] ?? 0),
    taxaVisivel: Boolean(linha["taxa_visivel"] ?? true),
  })) as LinhaRanking[];
}

/** Lê o ranking da semana atual apenas após autenticar o estudante no servidor. */
export const buscarRankingSemanalSeguro = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<LinhaRanking[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("dx_ranking_semanal");
    if (error) throw new Error(error.message);
    return normalizarLinhas(data);
  });

/** Lê o ranking geral (todas as semanas, nunca zera). */
export const buscarRankingGeralSeguro = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<LinhaRanking[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("dx_ranking_geral");
    if (error) throw new Error(error.message);
    return normalizarLinhas(data);
  });

/** Fecha semanas passadas ainda sem broches distribuídos (1º/2º/3º lugar). */
export const fecharSemanasPendentesSeguro = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<void> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin.rpc("dx_fechar_semanas_pendentes");
    if (error) throw new Error(error.message);
  });

export type LinhaRankingQuestoes = {
  user_id: string;
  nome_usuario: string;
  total: number;
  acertos: number;
  taxa: number;
};

function normalizarLinhasQuestoes(data: unknown): LinhaRankingQuestoes[] {
  return ((data ?? []) as Record<string, unknown>[]).map((linha) => ({
    user_id: String(linha["user_id"]),
    nome_usuario: String(linha["nome_usuario"]),
    total: Number(linha["total"]),
    acertos: Number(linha["acertos"]),
    taxa: Number(linha["taxa"]),
  }));
}

/** Ranking de questões respondidas HOJE, por todos os usuários. */
export const buscarRankingQuestoesHojeSeguro = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<LinhaRankingQuestoes[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("ranking_questoes_hoje");
    if (error) throw new Error(error.message);
    return normalizarLinhasQuestoes(data);
  });

/** Ranking de questões respondidas no TOTAL (desde sempre), por todos os usuários. */
export const buscarRankingQuestoesGeralSeguro = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async (): Promise<LinhaRankingQuestoes[]> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data, error } = await supabaseAdmin.rpc("ranking_questoes_geral");
    if (error) throw new Error(error.message);
    return normalizarLinhasQuestoes(data);
  });
