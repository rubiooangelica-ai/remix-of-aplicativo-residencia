import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

type Supa = ReturnType<typeof supabaseForUser>;

/** Encontra (ou cria) um nó da taxonomia por nome, sem duplicar por caixa/espaços. */
async function resolver(
  supabase: Supa,
  tabela: "areas" | "especialidades" | "assuntos",
  nome: string,
  pai?: { coluna: "area_id" | "especialidade_id"; id: string },
): Promise<string> {
  const limpo = nome.trim();
  let busca = supabase.from(tabela).select("id, nome").ilike("nome", limpo).limit(5);
  if (pai) busca = busca.eq(pai.coluna, pai.id);
  const { data, error } = await busca;
  if (error) throw new Error(error.message);
  const achado = data?.find((r) => r.nome.trim().toLowerCase() === limpo.toLowerCase());
  if (achado) return achado.id;

  const registro: Record<string, string> = { nome: limpo };
  if (pai) registro[pai.coluna] = pai.id;
  const { data: criado, error: erroInsert } = await supabase
    .from(tabela)
    .insert(registro as never)
    .select("id")
    .single();
  if (erroInsert) throw new Error(`Não foi possível criar "${limpo}": ${erroInsert.message}`);
  return criado.id;
}

export default defineTool({
  name: "reclassificar_questao",
  title: "Reclassificar questão",
  description:
    "Atualiza a classificação de uma questão: área, tema (especialidade) e assunto. Itens que não existirem na taxonomia são criados. Use para correções pontuais e pilotos de validação.",
  inputSchema: {
    id: z.string().describe("Id da questão."),
    area: z.string().min(1).describe("Nova grande área, ex.: Clínica Médica."),
    tema: z.string().min(1).describe("Novo tema/especialidade, ex.: Cardiologia."),
    assunto: z.string().min(1).describe("Novo assunto, ex.: Insuficiência Cardíaca."),
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
  handler: async ({ id, area, tema, assunto }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Não autenticado." }], isError: true };

    const supabase = supabaseForUser(ctx);
    const { data: questao, error: erroBusca } = await supabase
      .from("questoes")
      .select("id, areas(nome), especialidades(nome), assuntos(nome)")
      .eq("id", id)
      .maybeSingle();
    if (erroBusca) return { content: [{ type: "text", text: erroBusca.message }], isError: true };
    if (!questao)
      return { content: [{ type: "text", text: "Questão não encontrada." }], isError: true };

    const nome = (v: unknown): string | null => {
      if (!v) return null;
      const alvo = Array.isArray(v) ? v[0] : v;
      return (alvo as { nome?: string } | undefined)?.nome ?? null;
    };
    const antiga = {
      area: nome(questao.areas),
      tema: nome(questao.especialidades),
      assunto: nome(questao.assuntos),
    };

    try {
      const areaId = await resolver(supabase, "areas", area);
      const temaId = await resolver(supabase, "especialidades", tema, {
        coluna: "area_id",
        id: areaId,
      });
      const assuntoId = await resolver(supabase, "assuntos", assunto, {
        coluna: "especialidade_id",
        id: temaId,
      });

      const { error } = await supabase
        .from("questoes")
        .update({
          area_id: areaId,
          especialidade_id: temaId,
          assunto_id: assuntoId,
          subassunto_id: null,
        })
        .eq("id", id);
      if (error) throw new Error(error.message);
    } catch (e) {
      return {
        content: [
          { type: "text", text: e instanceof Error ? e.message : "Erro ao reclassificar." },
        ],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `Questão ${id} reclassificada.\nAntes: ${antiga.area ?? "?"} > ${antiga.tema ?? "?"} > ${antiga.assunto ?? "?"}\nAgora: ${area} > ${tema} > ${assunto}`,
        },
      ],
      structuredContent: {
        sucesso: true,
        id,
        anterior: antiga,
        nova: { area, tema, assunto },
      },
    };
  },
});
