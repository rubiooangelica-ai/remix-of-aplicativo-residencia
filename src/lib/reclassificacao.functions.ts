import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function admin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("is_admin", { uid: userId });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Apenas administradores podem usar a reclassificação em lote.");
  return supabaseAdmin;
}

const Combinacao = z.object({
  area: z.string().min(1),
  tema: z.string().min(1),
  assunto: z.string().min(1),
});

/** Cria um trabalho de reclassificação e monta a fila de questões. */
export const criarTrabalhoReclassificacao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        nome: z.string().min(1).max(120),
        criterio: z.string().default(""),
        taxonomia: z.array(Combinacao).max(5000).default([]),
        modelo: z.string().default("google/gemini-3.7-flash"),
        tamanho_lote: z.number().int().min(1).max(50).default(20),
        /** false = apenas simula e gera relatório; true = grava a nova classificação. */
        aplicar: z.boolean().default(false),
        /** Restringe a fila a uma grande área (útil para pilotos). */
        area: z.string().optional(),
        /** Amostra: processa no máximo N questões (0/ausente = banco inteiro). */
        limite: z.number().int().min(0).max(100000).optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const supabaseAdmin = await admin(context.userId);
    const { data: job, error } = await supabaseAdmin
      .from("reclass_jobs")
      .insert({
        nome: data.nome,
        criterio: data.criterio,
        taxonomia: data.taxonomia,
        modelo: data.modelo,
        tamanho_lote: data.tamanho_lote,
        aplicar: data.aplicar,
        status: "pausado",
        criado_por: context.userId,
      })
      .select("id")
      .single();
    if (error) throw new Error(error.message);

    const { data: inseridas, error: erroFila } = await supabaseAdmin.rpc("reclass_montar_fila", {
      p_job_id: job.id,
      ...(data.area?.trim() ? { p_area: data.area.trim() } : {}),
    });
    if (erroFila) throw new Error(erroFila.message);

    let naFila = Number(inseridas ?? 0);

    // Amostra: descarta o excedente da fila para validar qualidade antes do banco inteiro.
    const limite = data.limite ?? 0;
    if (limite > 0 && naFila > limite) {
      const PAGINA = 1000;
      for (;;) {
        const { data: excedente, error: erroExc } = await supabaseAdmin
          .from("reclass_itens")
          .select("id")
          .eq("job_id", job.id)
          .order("created_at")
          .range(limite, limite + PAGINA - 1);
        if (erroExc) throw new Error(erroExc.message);
        if (!excedente?.length) break;
        const { error: erroDel } = await supabaseAdmin
          .from("reclass_itens")
          .delete()
          .in(
            "id",
            excedente.map((i) => i.id),
          );
        if (erroDel) throw new Error(erroDel.message);
        if (excedente.length < PAGINA) break;
      }
      naFila = limite;
      await supabaseAdmin.from("reclass_jobs").update({ total: naFila }).eq("id", job.id);
    }

    return { job_id: job.id, questoes_na_fila: naFila };
  });

/** Atualiza critério/taxonomia/modelo de um trabalho existente (antes de rodar). */
export const atualizarTrabalhoReclassificacao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        job_id: z.string().uuid(),
        criterio: z.string().optional(),
        taxonomia: z.array(Combinacao).max(5000).optional(),
        modelo: z.string().optional(),
        tamanho_lote: z.number().int().min(1).max(50).optional(),
        aplicar: z.boolean().optional(),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const supabaseAdmin = await admin(context.userId);
    const campos: Record<string, unknown> = {};
    if (data.criterio !== undefined) campos["criterio"] = data.criterio;
    if (data.taxonomia !== undefined) campos["taxonomia"] = data.taxonomia;
    if (data.modelo !== undefined) campos["modelo"] = data.modelo;
    if (data.tamanho_lote !== undefined) campos["tamanho_lote"] = data.tamanho_lote;
    if (data.aplicar !== undefined) campos["aplicar"] = data.aplicar;
    const { error } = await supabaseAdmin
      .from("reclass_jobs")
      .update(campos as never)
      .eq("id", data.job_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Liga, pausa ou retoma o trabalho. */
export const definirEstadoTrabalhoReclassificacao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ job_id: z.string().uuid(), status: z.enum(["ativo", "pausado"]) })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const supabaseAdmin = await admin(context.userId);
    const { error } = await supabaseAdmin
      .from("reclass_jobs")
      .update({ status: data.status, mensagem_erro: null, lease_until: null })
      .eq("id", data.job_id);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Lista os trabalhos com o progresso atual. */
export const listarTrabalhosReclassificacao = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const supabaseAdmin = await admin(context.userId);
    const { data, error } = await supabaseAdmin
      .from("reclass_jobs")
      .select(
        "id, nome, status, modelo, tamanho_lote, aplicar, total, processadas, erros, mensagem_erro, created_at, updated_at",
      )
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return { trabalhos: data ?? [] };
  });

/** Roda um lote imediatamente (útil para o piloto, sem esperar o agendador). */
export const processarLoteAgora = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ job_id: z.string().uuid().optional() }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    await admin(context.userId);
    const { processarLoteReclassificacao } = await import("./reclassificacao.server");
    return processarLoteReclassificacao(data.job_id);
  });

/** Relatório em CSV: id da questão, classificação antiga e nova. */
export const relatorioReclassificacaoCsv = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        job_id: z.string().uuid(),
        apenas_alterados: z.boolean().default(false),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    const supabaseAdmin = await admin(context.userId);
    const linhas: string[] = [
      "questao_id,area_antiga,tema_antigo,assunto_antigo,area_nova,tema_novo,assunto_novo,status,erro",
    ];
    const campo = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;

    const PAGINA = 1000;
    for (let inicio = 0; ; inicio += PAGINA) {
      const { data: itens, error } = await supabaseAdmin
        .from("reclass_itens")
        .select(
          "questao_id, area_antiga, tema_antigo, assunto_antigo, area_nova, tema_novo, assunto_novo, status, erro",
        )
        .eq("job_id", data.job_id)
        .order("created_at")
        .range(inicio, inicio + PAGINA - 1);
      if (error) throw new Error(error.message);
      if (!itens?.length) break;

      for (const i of itens) {
        const mudou =
          i.area_antiga !== i.area_nova ||
          i.tema_antigo !== i.tema_novo ||
          i.assunto_antigo !== i.assunto_novo;
        if (data.apenas_alterados && !mudou) continue;
        linhas.push(
          [
            i.questao_id,
            i.area_antiga,
            i.tema_antigo,
            i.assunto_antigo,
            i.area_nova,
            i.tema_novo,
            i.assunto_novo,
            i.status,
            i.erro,
          ]
            .map(campo)
            .join(","),
        );
      }
      if (itens.length < PAGINA) break;
    }

    return { csv: linhas.join("\n"), linhas: linhas.length - 1 };
  });
