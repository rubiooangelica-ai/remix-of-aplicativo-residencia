/**
 * Motor do processo em lote de reclassificação da taxonomia.
 *
 * Regras de segurança operacional:
 * - lote limitado por execução (nunca processa o banco inteiro de uma vez);
 * - trava única (lease) no banco: duas execuções simultâneas não se atropelam;
 * - progresso gravado item a item (retomável, sem reprocessar o que já saiu);
 * - disjuntor: 402/403 da IA pausam o trabalho inteiro (status "bloqueado").
 */
import { z } from "zod";

export type ResultadoLote = {
  job_id: string | null;
  status: string;
  processadas: number;
  erros: number;
  restantes: number;
  mensagem: string;
};

const Classificacao = z.object({
  area: z.string().min(1),
  tema: z.string().min(1),
  assunto: z.string().min(1),
});

type Combinacao = z.infer<typeof Classificacao>;

const LEASE_MINUTOS = 10;

function taxonomiaEmTexto(taxonomia: unknown): string {
  const parsed = z.array(Classificacao).safeParse(taxonomia);
  if (!parsed.success || !parsed.data.length) return "";
  return parsed.data.map((c) => `${c.area} > ${c.tema} > ${c.assunto}`).join("\n");
}

function extrairJson(texto: string): unknown {
  const limpo = texto.replace(/```json/gi, "").replace(/```/g, "").trim();
  const inicio = limpo.indexOf("{");
  const fim = limpo.lastIndexOf("}");
  if (inicio === -1 || fim === -1) throw new Error("Resposta de IA inválida.");
  return JSON.parse(limpo.slice(inicio, fim + 1));
}

class IaBloqueada extends Error {
  constructor(readonly status: number, message: string) {
    super(message);
  }
}

/**
 * Chama a IA para classificar uma questão.
 * A lógica/critério vem do próprio trabalho (campo `criterio`) — este arquivo só
 * transporta o critério até o modelo, sem embutir regras clínicas próprias.
 */
async function classificar(opts: {
  modelo: string;
  criterio: string;
  taxonomia: string;
  enunciado: string;
  alternativas: string;
}): Promise<Combinacao> {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("Configuração de IA ausente (LOVABLE_API_KEY).");

  const resposta = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Lovable-API-Key": key,
      "X-Lovable-AIG-SDK": "fetch",
    },
    body: JSON.stringify({
      model: opts.modelo,
      messages: [
        {
          role: "system",
          content: [
            "Você classifica questões de residência médica no Brasil pelo conteúdo clínico.",
            "Responda SOMENTE um objeto JSON com os campos area, tema e assunto, sem markdown.",
            opts.taxonomia
              ? "Use EXCLUSIVAMENTE uma das combinações válidas listadas pelo usuário."
              : "Use nomes em português do Brasil, consistentes e sem abreviações.",
            opts.criterio ? `Critério de classificação definido pelo administrador:\n${opts.criterio}` : "",
          ]
            .filter(Boolean)
            .join("\n"),
        },
        {
          role: "user",
          content: [
            opts.taxonomia ? `Combinações válidas (area > tema > assunto):\n${opts.taxonomia}\n` : "",
            "Questão:",
            opts.enunciado.slice(0, 4000),
            opts.alternativas ? `\nAlternativas:\n${opts.alternativas.slice(0, 2000)}` : "",
          ].join("\n"),
        },
      ],
    }),
  });

  if (resposta.status === 402 || resposta.status === 403) {
    throw new IaBloqueada(
      resposta.status,
      resposta.status === 402
        ? "Créditos de IA esgotados. Adicione créditos para retomar a reclassificação."
        : "A IA está bloqueada pelas configurações do espaço de trabalho.",
    );
  }
  if (!resposta.ok) throw new Error(`IA respondeu ${resposta.status}: ${await resposta.text()}`);

  const corpo = (await resposta.json()) as {
    choices?: { message?: { content?: string } }[];
  };
  const texto = corpo.choices?.[0]?.message?.content ?? "";
  const parsed = Classificacao.safeParse(extrairJson(texto));
  if (!parsed.success) throw new Error("A IA não retornou area/tema/assunto válidos.");
  return parsed.data;
}

/** Processa um lote do trabalho ativo (ou do trabalho informado). */
export async function processarLoteReclassificacao(jobId?: string): Promise<ResultadoLote> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  let consulta = supabaseAdmin
    .from("reclass_jobs")
    .select("*")
    .eq("status", "ativo")
    .order("created_at")
    .limit(1);
  if (jobId) consulta = supabaseAdmin.from("reclass_jobs").select("*").eq("id", jobId).limit(1);

  const { data: jobs, error: erroJob } = await consulta;
  if (erroJob) throw new Error(erroJob.message);
  const job = jobs?.[0];
  if (!job)
    return {
      job_id: null,
      status: "nenhum",
      processadas: 0,
      erros: 0,
      restantes: 0,
      mensagem: "Nenhum trabalho ativo.",
    };

  // Guarda de estado pausado/bloqueado: o agendador continua disparando, o job não roda.
  if (job.status !== "ativo")
    return {
      job_id: job.id,
      status: job.status,
      processadas: 0,
      erros: 0,
      restantes: 0,
      mensagem: `Trabalho em "${job.status}" — nada a fazer.`,
    };

  // Trava única (lease) — se outra execução está rodando, esta sai.
  const agora = new Date();
  const { data: travado, error: erroLease } = await supabaseAdmin
    .from("reclass_jobs")
    .update({ lease_until: new Date(agora.getTime() + LEASE_MINUTOS * 60_000).toISOString() })
    .eq("id", job.id)
    .eq("status", "ativo")
    .or(`lease_until.is.null,lease_until.lt.${agora.toISOString()}`)
    .select("id")
    .maybeSingle();
  if (erroLease) throw new Error(erroLease.message);
  if (!travado)
    return {
      job_id: job.id,
      status: job.status,
      processadas: 0,
      erros: 0,
      restantes: 0,
      mensagem: "Outra execução já está processando este trabalho.",
    };

  const taxonomia = taxonomiaEmTexto(job.taxonomia);
  let processadas = 0;
  let erros = 0;
  let bloqueio: string | null = null;

  try {
    const { data: itens, error: erroLote } = await supabaseAdmin.rpc("reclass_reservar_lote", {
      p_job_id: job.id,
      p_limite: job.tamanho_lote,
    });
    if (erroLote) throw new Error(erroLote.message);

    for (const item of itens ?? []) {
      try {
        const alternativas = Array.isArray(item.alternativas)
          ? (item.alternativas as unknown[])
              .map((a) => (typeof a === "string" ? a : JSON.stringify(a)))
              .join("\n")
          : "";
        const nova = await classificar({
          modelo: job.modelo,
          criterio: job.criterio,
          taxonomia,
          enunciado: item.enunciado,
          alternativas,
        });
        const { error } = await supabaseAdmin.rpc("reclass_registrar_resultado", {
          p_item_id: item.item_id,
          p_area: nova.area,
          p_tema: nova.tema,
          p_assunto: nova.assunto,
          p_aplicar: job.aplicar,
        });
        if (error) throw new Error(error.message);
        processadas += 1;
      } catch (e) {
        if (e instanceof IaBloqueada) {
          bloqueio = e.message;
          // devolve o item para a fila e interrompe o lote (disjuntor)
          await supabaseAdmin
            .from("reclass_itens")
            .update({ status: "pendente" })
            .eq("id", item.item_id);
          break;
        }
        erros += 1;
        await supabaseAdmin.rpc("reclass_registrar_resultado", {
          p_item_id: item.item_id,
          p_area: "",
          p_tema: "",
          p_assunto: "",
          p_erro: e instanceof Error ? e.message.slice(0, 500) : "Erro desconhecido",
          p_aplicar: false,
        });
      }
    }

    const { count: restantes } = await supabaseAdmin
      .from("reclass_itens")
      .select("id", { count: "exact", head: true })
      .eq("job_id", job.id)
      .in("status", ["pendente", "processando"]);

    const restante = restantes ?? 0;
    const novoStatus = bloqueio ? "bloqueado" : restante === 0 ? "concluido" : "ativo";

    await supabaseAdmin
      .from("reclass_jobs")
      .update({ status: novoStatus, mensagem_erro: bloqueio, lease_until: null })
      .eq("id", job.id);

    return {
      job_id: job.id,
      status: novoStatus,
      processadas,
      erros,
      restantes: restante,
      mensagem:
        bloqueio ??
        (restante === 0
          ? "Trabalho concluído."
          : `Lote concluído. Faltam ${restante} questões.`),
    };
  } catch (e) {
    await supabaseAdmin
      .from("reclass_jobs")
      .update({
        status: "falhou",
        lease_until: null,
        mensagem_erro: e instanceof Error ? e.message.slice(0, 500) : "Erro desconhecido",
      })
      .eq("id", job.id);
    throw e;
  }
}
