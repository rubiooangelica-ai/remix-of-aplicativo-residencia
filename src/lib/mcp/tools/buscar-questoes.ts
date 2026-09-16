import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

type Supa = ReturnType<typeof supabaseForUser>;

async function idsPorNome(
  supabase: Supa,
  tabela: "areas" | "especialidades" | "assuntos",
  nome: string,
): Promise<string[]> {
  const { data, error } = await supabase
    .from(tabela)
    .select("id")
    .ilike("nome", `%${nome}%`)
    .limit(500);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => r.id);
}

export default defineTool({
  name: "buscar_questoes",
  title: "Buscar questões",
  description:
    "Busca questões do banco por trecho do enunciado, banca, ano, área, tema e/ou assunto. Permite listar apenas questões que têm imagem. Retorna id, enunciado resumido, banca, ano, classificação atual e se há imagem.",
  inputSchema: {
    texto: z.string().optional().describe("Trecho do enunciado a procurar."),
    banca: z.string().optional().describe("Nome da banca (ex.: USP, ABRAMEDE)."),
    ano: z.number().int().optional().describe("Ano da prova."),
    area: z.string().optional().describe("Nome (parcial) da grande área."),
    tema: z.string().optional().describe("Nome (parcial) do tema/especialidade."),
    assunto: z.string().optional().describe("Nome (parcial) do assunto."),
    apenas_com_imagem: z
      .boolean()
      .optional()
      .describe("Se verdadeiro, retorna somente questões que possuem imagem."),
    limite: z
      .number()
      .int()
      .min(1)
      .max(30)
      .optional()
      .describe("Máximo de resultados (padrão 10, máximo 30)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (
    { texto, banca, ano, area, tema, assunto, apenas_com_imagem, limite },
    ctx,
  ) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Não autenticado." }], isError: true };
    if (
      !texto?.trim() &&
      !banca?.trim() &&
      !ano &&
      !area?.trim() &&
      !tema?.trim() &&
      !assunto?.trim() &&
      !apenas_com_imagem
    )
      return {
        content: [
          {
            type: "text",
            text: "Informe ao menos um critério: texto, banca, ano, área, tema, assunto ou apenas_com_imagem.",
          },
        ],
        isError: true,
      };

    const supabase = supabaseForUser(ctx);

    let query = supabase
      .from("questoes")
      .select(
        "id, enunciado, banca, ano, imagem_url, areas(nome), especialidades(nome), assuntos(nome)",
      )
      .order("ano", { ascending: false })
      .limit(limite ?? 10);

    if (texto?.trim()) query = query.ilike("enunciado", `%${texto.trim()}%`);
    if (banca?.trim()) query = query.ilike("banca", `%${banca.trim()}%`);
    if (ano) query = query.eq("ano", ano);
    if (apenas_com_imagem) query = query.not("imagem_url", "is", null).neq("imagem_url", "");

    try {
      for (const [valor, tabela, coluna] of [
        [area, "areas", "area_id"],
        [tema, "especialidades", "especialidade_id"],
        [assunto, "assuntos", "assunto_id"],
      ] as const) {
        if (!valor?.trim()) continue;
        const ids = await idsPorNome(supabase, tabela, valor.trim());
        if (!ids.length)
          return {
            content: [
              { type: "text", text: `Nada encontrado na taxonomia para "${valor.trim()}".` },
            ],
          };
        query = query.in(coluna, ids);
      }
    } catch (e) {
      return {
        content: [{ type: "text", text: e instanceof Error ? e.message : "Erro na taxonomia." }],
        isError: true,
      };
    }

    const { data, error } = await query;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data?.length) return { content: [{ type: "text", text: "Nenhuma questão encontrada." }] };

    const nome = (v: unknown): string | null => {
      if (!v) return null;
      const alvo = Array.isArray(v) ? v[0] : v;
      return (alvo as { nome?: string } | undefined)?.nome ?? null;
    };

    const resumo = data.map((q) => ({
      id: q.id,
      banca: q.banca,
      ano: q.ano,
      area: nome(q.areas),
      tema: nome(q.especialidades),
      assunto: nome(q.assuntos),
      tem_imagem: !!q.imagem_url?.trim(),
      imagem_url: q.imagem_url,
      enunciado: q.enunciado.length > 200 ? q.enunciado.slice(0, 200) + "…" : q.enunciado,
    }));

    return {
      content: [
        {
          type: "text",
          text: resumo
            .map(
              (q) =>
                `[${q.id}] (${q.banca ?? "?"}, ${q.ano ?? "?"}) ${q.area ?? "?"} > ${q.tema ?? "?"} > ${q.assunto ?? "?"}${q.tem_imagem ? " | com imagem" : ""}\n${q.enunciado}`,
            )
            .join("\n\n"),
        },
      ],
      structuredContent: { questoes: resumo },
    };
  },
});
