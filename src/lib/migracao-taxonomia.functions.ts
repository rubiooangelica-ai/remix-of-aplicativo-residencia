import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function admin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("is_admin", { uid: userId });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Apenas administradores podem executar a migração da taxonomia.");
  return supabaseAdmin;
}

/** Roda um lote da migração agora (classificação semântica em duas passagens). */
export const rodarLoteMigracaoTaxonomia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        tamanho_lote: z.number().int().min(1).max(200).default(50),
        /** false = simulação: grava a proposta na auditoria sem mexer nas questões. */
        aplicar: z.boolean().default(false),
      })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    await admin(context.userId);
    const { processarLoteMigracao } = await import("./migracao-taxonomia.server");
    return processarLoteMigracao(data.tamanho_lote, data.aplicar);
  });

/** Progresso agregado da migração. */
export const progressoMigracaoTaxonomia = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabaseAdmin = await admin(context.userId);
    const { data, error } = await supabaseAdmin.rpc("mig_progresso");
    if (error) throw new Error(error.message);
    const linha = data?.[0];
    return {
      total: Number(linha?.total_questoes ?? 0),
      processadas: Number(linha?.processadas ?? 0),
      pendentes: Number(linha?.pendentes ?? 0),
      erros: Number(linha?.erros ?? 0),
      baixa_confianca: Number(linha?.baixa_confianca ?? 0),
    };
  });

const URL_PROCESSAMENTO =
  "https://project--c60c0cae-f83b-483d-9df3-4a48b6e610d0-dev.lovable.app/api/public/migracao-taxonomia/processar";

/** Diz se o processamento automático (um lote por minuto) está ligado. */
export const statusAgendadorMigracao = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabaseAdmin = await admin(context.userId);
    const { data, error } = await supabaseAdmin.rpc("mig_agendador_status");
    if (error) throw new Error(error.message);
    return { ativo: data === true };
  });

/** Liga ou desliga o processamento automático e destrava a fila. */
export const definirAgendadorMigracao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ ligar: z.boolean(), tamanho_lote: z.number().int().min(1).max(200).default(100) })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const supabaseAdmin = await admin(context.userId);
    if (!data.ligar) {
      const { error } = await supabaseAdmin.rpc("mig_desligar_agendador");
      if (error) throw new Error(error.message);
      return { ativo: false, mensagem: "Processamento automático desligado." };
    }
    await supabaseAdmin.rpc("mig_destravar_processando", { p_minutos: 0 });
    const { error } = await supabaseAdmin.rpc("mig_ligar_agendador", {
      p_url: URL_PROCESSAMENTO,
      p_tamanho: data.tamanho_lote,
    });
    if (error) throw new Error(error.message);
    return {
      ativo: true,
      mensagem: `Processamento automático ligado: ${data.tamanho_lote} questões por minuto.`,
    };
  });

/** Amostra das últimas classificações, para conferir a qualidade. */
export const amostraMigracaoTaxonomia = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ limite: z.number().int().min(1).max(100).default(20) }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const supabaseAdmin = await admin(context.userId);
    const { data: itens, error } = await supabaseAdmin
      .from("mig_reclassificacao")
      .select(
        "questao_id, new_area, new_tema, new_assunto, rationale, confidence, validator_status, migration_status, error_message",
      )
      .order("processed_at", { ascending: false, nullsFirst: false })
      .limit(data.limite);
    if (error) throw new Error(error.message);

    const backup = await supabaseAdmin
      .from("mig_taxonomia_backup")
      .select("questao_id, area_antiga, tema_antigo, assunto_antigo")
      .in("questao_id", (itens ?? []).map((i) => i.questao_id));

    const antigos = new Map(
      (backup.data ?? []).map((b) => [
        b.questao_id,
        `${b.area_antiga ?? "—"} > ${b.tema_antigo ?? "—"} > ${b.assunto_antigo ?? "—"}`,
      ]),
    );

    return {
      itens: (itens ?? []).map((i) => ({
        ...i,
        antiga: antigos.get(i.questao_id) ?? "—",
      })),
    };
  });

/** Relatório CSV com a classificação antiga e a nova. */
export const relatorioMigracaoCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ apenas_alterados: z.boolean().default(false) }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    const supabaseAdmin = await admin(context.userId);
    const campo = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
    const linhas: string[] = [
      "questao_id,area_antiga,tema_antigo,assunto_antigo,area_nova,tema_nova,assunto_novo,confianca,validador,status,erro,foco_central",
    ];

    const PAGINA = 1000;
    for (let inicio = 0; ; inicio += PAGINA) {
      const { data: itens, error } = await supabaseAdmin
        .from("mig_reclassificacao")
        .select(
          "questao_id, new_area, new_tema, new_assunto, confidence, validator_status, migration_status, error_message, rationale",
        )
        .order("created_at")
        .range(inicio, inicio + PAGINA - 1);
      if (error) throw new Error(error.message);
      if (!itens?.length) break;

      const backup = await supabaseAdmin
        .from("mig_taxonomia_backup")
        .select("questao_id, area_antiga, tema_antigo, assunto_antigo")
        .in("questao_id", itens.map((i) => i.questao_id));
      const antigos = new Map((backup.data ?? []).map((b) => [b.questao_id, b]));

      for (const i of itens) {
        const a = antigos.get(i.questao_id);
        const mudou =
          (a?.area_antiga ?? "") !== (i.new_area ?? "") ||
          (a?.tema_antigo ?? "") !== (i.new_tema ?? "") ||
          (a?.assunto_antigo ?? "") !== (i.new_assunto ?? "");
        if (data.apenas_alterados && !mudou) continue;
        linhas.push(
          [
            i.questao_id,
            a?.area_antiga,
            a?.tema_antigo,
            a?.assunto_antigo,
            i.new_area,
            i.new_tema,
            i.new_assunto,
            i.confidence,
            i.validator_status,
            i.migration_status,
            i.error_message,
            i.rationale,
          ]
            .map(campo)
            .join(","),
        );
      }
      if (itens.length < PAGINA) break;
    }

    return { csv: linhas.join("\n"), linhas: linhas.length - 1 };
  });
