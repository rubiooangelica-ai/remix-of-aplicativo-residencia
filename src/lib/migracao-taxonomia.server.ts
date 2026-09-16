/**
 * Motor da migração da taxonomia oficial.
 *
 * Classificação SEMÂNTICA em duas passagens (classificador + validador), com
 * taxonomia FECHADA: o modelo só pode escolher uma das combinações oficiais.
 * Nunca usa palavras-chave, LIKE ou regex para decidir a classificação.
 */
import { z } from "zod";

const MODELO_CLASSIFICADOR = "google/gemini-3.7-flash";
const MODELO_VALIDADOR = "google/gemini-3.7-flash";
const CONCORRENCIA = 12;

export type ResultadoMigracao = {
  processadas: number;
  reclassificadas: number;
  mantidas: number;
  erros: number;
  restantes: number;
  bloqueado: string | null;
  mensagem: string;
};

class IaBloqueada extends Error {}

const texto = z
  .union([z.string(), z.array(z.unknown()), z.null()])
  .optional()
  .transform((v) =>
    Array.isArray(v) ? v.map((x) => (typeof x === "string" ? x : JSON.stringify(x))).join("; ") : (v ?? ""),
  );

const Proposta = z.object({
  area: z.string().min(1),
  tema: z.string().min(1),
  assunto: z.string().min(1),
  conhecimento_central: texto,
  termos_ignorados: texto,
  confianca: z.coerce.number().min(0).max(1).default(0.5),
});
type Proposta = z.infer<typeof Proposta>;

const Veredito = z.object({
  status: z.string().min(1),
  area: z.string().optional(),
  tema: z.string().optional(),
  assunto: z.string().optional(),
  confianca: z.coerce.number().min(0).max(1).optional(),
});

const norm = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const chave = (a: string, t: string, s: string) => `${norm(a)}|${norm(t)}|${norm(s)}`;

function extrairJson(texto: string): unknown {
  const limpo = texto.replace(/```json/gi, "").replace(/```/g, "").trim();
  const i = limpo.indexOf("{");
  const f = limpo.lastIndexOf("}");
  if (i === -1 || f === -1) throw new Error("Resposta de IA inválida.");
  return JSON.parse(limpo.slice(i, f + 1));
}

async function chamarIa(modelo: string, system: string, user: string): Promise<string> {
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
      model: modelo,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  if (resposta.status === 402)
    throw new IaBloqueada("Créditos de IA esgotados. Adicione créditos para retomar a migração.");
  if (resposta.status === 403)
    throw new IaBloqueada("A IA está bloqueada pelas configurações do espaço de trabalho.");
  if (resposta.status === 429) throw new Error("IA sobrecarregada (429).");
  if (!resposta.ok) throw new Error(`IA respondeu ${resposta.status}: ${await resposta.text()}`);
  const corpo = (await resposta.json()) as { choices?: { message?: { content?: string } }[] };
  return corpo.choices?.[0]?.message?.content ?? "";
}

const REGRAS = [
  "REGRAS DE FRONTEIRA OBRIGATÓRIAS:",
  "1. 'Medicina de Emergência e Terapia Intensiva' SÓ quando a questão testa a técnica de condução do paciente grave ou o processo de emergência/intensivo (triagem, pré-hospitalar, via aérea, sequência rápida de intubação, ventilação mecânica, RCP/ACLS/PALS, monitorização hemodinâmica, fluidoterapia, POCUS, procedimentos, toxicologia, emergências ambientais, desastres). Doença específica NÃO vira Emergência só porque o paciente está no PS ou UTI (pneumonia grave em UTI = Clínica Médica > Pneumologia > Pneumonias; IAM no PS = Cardiologia > Síndrome Coronariana Aguda).",
  "2. 'Medicina de Família e Comunidade' SÓ quando testa o modelo da Atenção Primária (longitudinalidade, vínculo, prevenção quaternária, rastreamento em APS, coordenação, método centrado na pessoa, atributos da APS). Consulta em UBS não torna a questão MFC.",
  "3. Obstetrícia e Ginecologia são áreas separadas. Doença clínica 'na gestação' só é Obstetrícia quando a gravidez é central (muda tratamento, risco fetal, contraindicação, profilaxia/monitorização obstétrica).",
  "4. Psiquiatria não é área: use Clínica Médica > Psiquiatria.",
  "5. Toxicologia: Medicina de Emergência e Terapia Intensiva > Toxicologia e Intoxicações.",
  "6. Hepatologia não existe como tema: use Clínica Médica > Gastroenterologia.",
  "IGNORE ao classificar: antecedentes e comorbidades incidentais, local do atendimento, sintomas inespecíficos, palavras presentes em distratores, descrições morfológicas que coincidem com nomes de outras doenças, medicamentos crônicos sem relação, idade/sexo/profissão irrelevantes e coincidências textuais.",
  "Se o enunciado tiver texto concatenado de outra questão, cabeçalhos, rodapés ou marcas de cursinho, use apenas o comando efetivamente ligado às alternativas.",
].join("\n");

function textoQuestao(q: {
  enunciado: string;
  alternativas: unknown;
  tem_imagem: boolean;
}): string {
  const alts = Array.isArray(q.alternativas)
    ? (q.alternativas as unknown[])
        .map((a) => (typeof a === "string" ? a : JSON.stringify(a)))
        .join("\n")
    : "";
  return [
    "ENUNCIADO:",
    q.enunciado.slice(0, 5000),
    alts ? `\nALTERNATIVAS:\n${alts.slice(0, 3000)}` : "",
    q.tem_imagem ? "\n(Esta questão possui imagem anexada; considere que a imagem pode ser o objeto do que é testado.)" : "",
  ].join("\n");
}

/** Passagem 1: classificador. */
async function classificar(taxonomia: string, questao: string): Promise<Proposta> {
  const texto = await chamarIa(
    MODELO_CLASSIFICADOR,
    [
      "Você é examinador de residência médica no Brasil e classifica questões pelo conhecimento realmente exigido para acertá-las.",
      "Pergunte-se: 'qual conhecimento o candidato precisa dominar para acertar esta questão?'. A resposta define Área > Tema > Assunto.",
      "A taxonomia é FECHADA: escolha EXATAMENTE uma das combinações listadas, copiando os nomes literalmente. É proibido criar área, tema ou assunto novo, ou adaptar nomes.",
      REGRAS,
      'Responda SOMENTE um objeto JSON: {"area":"","tema":"","assunto":"","conhecimento_central":"","termos_ignorados":"","confianca":0.0}',
    ].join("\n\n"),
    `COMBINAÇÕES OFICIAIS (area > tema > assunto):\n${taxonomia}\n\n${questao}`,
  );
  return Proposta.parse(extrairJson(texto));
}

/** Passagem 2: validador independente. */
async function validar(
  taxonomia: string,
  questao: string,
  proposta: Proposta,
): Promise<{ status: string; combinacao: { area: string; tema: string; assunto: string }; confianca: number }> {
  const texto = await chamarIa(
    MODELO_VALIDADOR,
    [
      "Você audita classificações de questões de residência médica. Verifique se a proposta reflete o conhecimento central testado.",
      "Procure especialmente erros por: comorbidade incidental, sintoma inespecífico, palavra de distrator, confusão entre Emergência e doença específica, confusão entre APS/MFC e doença específica, confusão entre Obstetrícia e Ginecologia, Psiquiatria como área e Hepatologia separada de Gastroenterologia.",
      REGRAS,
      "A taxonomia é FECHADA. Se reclassificar, escolha outra combinação da lista, copiando os nomes literalmente.",
      'Responda SOMENTE JSON: {"status":"APROVAR"|"RECLASSIFICAR","area":"","tema":"","assunto":"","confianca":0.0}',
    ].join("\n\n"),
    [
      `COMBINAÇÕES OFICIAIS:\n${taxonomia}`,
      questao,
      `PROPOSTA: ${proposta.area} > ${proposta.tema} > ${proposta.assunto}`,
      `JUSTIFICATIVA DO CLASSIFICADOR: ${proposta.conhecimento_central}`,
    ].join("\n\n"),
  );
  const v = Veredito.parse(extrairJson(texto));
  const reclassificou = norm(v.status).startsWith("reclass");
  const combinacao =
    reclassificou && v.area && v.tema && v.assunto
      ? { area: v.area, tema: v.tema, assunto: v.assunto }
      : { area: proposta.area, tema: proposta.tema, assunto: proposta.assunto };
  return {
    status: reclassificou ? "reclassificado_pelo_validador" : "aprovado",
    combinacao,
    confianca: v.confianca ?? proposta.confianca,
  };
}

/** Processa um lote da migração (retomável e idempotente). */
export async function processarLoteMigracao(
  tamanhoLote = 50,
  aplicar = true,
): Promise<ResultadoMigracao> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

  const { data: oficiais, error: erroTax } = await supabaseAdmin
    .from("taxonomia_oficial")
    .select("area, tema, assunto")
    .order("area")
    .order("tema")
    .order("assunto");
  if (erroTax) throw new Error(erroTax.message);
  if (!oficiais?.length) throw new Error("Taxonomia oficial vazia.");

  const validas = new Map<string, { area: string; tema: string; assunto: string }>();
  for (const o of oficiais) validas.set(chave(o.area, o.tema, o.assunto), o);
  const taxonomia = oficiais.map((o) => `${o.area} > ${o.tema} > ${o.assunto}`).join("\n");

  // Devolve à fila as questões que ficaram presas em "processando" (queda no meio do lote).
  await supabaseAdmin.rpc("mig_destravar_processando", { p_minutos: 15 });

  const { data: itens, error: erroLote } = await supabaseAdmin.rpc("mig_reservar_lote", {
    p_limite: Math.max(1, Math.min(tamanhoLote, 200)),
  });
  if (erroLote) throw new Error(erroLote.message);
  const fila = itens ?? [];

  let processadas = 0;
  let reclassificadas = 0;
  let mantidas = 0;
  let erros = 0;
  let bloqueado: string | null = null;

  const trabalhar = async (item: (typeof fila)[number]) => {
    if (bloqueado) return;
    try {
      const questao = textoQuestao(item);
      const proposta = await classificar(taxonomia, questao);
      const veredito = await validar(taxonomia, questao, proposta);
      const oficial = validas.get(
        chave(veredito.combinacao.area, veredito.combinacao.tema, veredito.combinacao.assunto),
      );
      if (!oficial) throw new Error("A IA devolveu uma combinação fora da taxonomia oficial.");

      const mudou =
        norm(item.old_area ?? "") !== norm(oficial.area) ||
        norm(item.old_tema ?? "") !== norm(oficial.tema) ||
        norm(item.old_assunto ?? "") !== norm(oficial.assunto);

      const { error } = await supabaseAdmin.rpc("mig_aplicar_classificacao", {
        p_questao_id: item.questao_id,
        p_area: oficial.area,
        p_tema: oficial.tema,
        p_assunto: oficial.assunto,
        p_rationale: `${proposta.conhecimento_central}${
          proposta.termos_ignorados ? ` | ignorado: ${proposta.termos_ignorados}` : ""
        }`.slice(0, 1000),
        p_confidence: veredito.confianca,
        p_validator_status: veredito.status,
        p_aplicar: aplicar,
      });
      if (error) throw new Error(error.message);

      processadas += 1;
      if (mudou) reclassificadas += 1;
      else mantidas += 1;
    } catch (e) {
      if (e instanceof IaBloqueada) {
        bloqueado = e.message;
        await supabaseAdmin
          .from("mig_reclassificacao")
          .update({ migration_status: "pendente" })
          .eq("questao_id", item.questao_id);
        return;
      }
      erros += 1;
      await supabaseAdmin.rpc("mig_registrar_erro", {
        p_questao_id: item.questao_id,
        p_erro: e instanceof Error ? e.message : "Erro desconhecido",
      });
    }
  };

  for (let i = 0; i < fila.length; i += CONCORRENCIA) {
    if (bloqueado) break;
    await Promise.all(fila.slice(i, i + CONCORRENCIA).map(trabalhar));
  }

  const { count: restantes } = await supabaseAdmin
    .from("mig_reclassificacao")
    .select("questao_id", { count: "exact", head: true })
    .in("migration_status", ["pendente", "processando", "erro"]);

  const naoIniciadas = await supabaseAdmin
    .from("questoes")
    .select("id", { count: "exact", head: true });
  const totalRegistradas = await supabaseAdmin
    .from("mig_reclassificacao")
    .select("questao_id", { count: "exact", head: true })
    .eq("migration_status", "concluido");
  const faltam = (naoIniciadas.count ?? 0) - (totalRegistradas.count ?? 0);

  // Fila esvaziada (ou IA bloqueada): desliga o processamento automático.
  if (faltam <= 0 || bloqueado) {
    await supabaseAdmin.rpc("mig_desligar_agendador");
  }

  return {
    processadas,
    reclassificadas,
    mantidas,
    erros,
    restantes: Math.max(faltam, restantes ?? 0),
    bloqueado,
    mensagem:
      bloqueado ??
      (faltam <= 0 ? "Migração concluída." : `Lote concluído. Faltam ${faltam} questões.`),
  };
}
