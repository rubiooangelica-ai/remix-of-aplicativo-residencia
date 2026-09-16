import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "estatisticas_taxonomia",
  title: "Estatísticas da taxonomia",
  description:
    "Retorna a contagem de questões agrupada por área → tema → assunto, da maior para a menor. Filtros opcionais por área e tema. Use para dimensionar a organização atual do banco.",
  inputSchema: {
    area: z.string().optional().describe("Filtra por nome (parcial) da grande área."),
    tema: z.string().optional().describe("Filtra por nome (parcial) do tema/especialidade."),
    limite: z
      .number()
      .int()
      .min(1)
      .max(2000)
      .optional()
      .describe("Máximo de linhas retornadas (padrão 300)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ area, tema, limite }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Não autenticado." }], isError: true };

    const { data, error } = await supabaseForUser(ctx).rpc("estatisticas_taxonomia", {
      p_area: area?.trim() || null,
      p_tema: tema?.trim() || null,
    });
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    type Linha = { area: string; tema: string; assunto: string; total: number };
    const todas = (data ?? []) as Linha[];
    const linhas = todas.slice(0, limite ?? 300);
    if (!linhas.length) return { content: [{ type: "text", text: "Nenhuma questão encontrada." }] };

    const total = todas.reduce((s: number, l: Linha) => s + Number(l.total), 0);
    const texto = [
      `Total de questões no escopo: ${total} (${todas.length} combinações; exibindo ${linhas.length})`,
      ...linhas.map((l: Linha) => `${l.total}\t${l.area} > ${l.tema} > ${l.assunto}`),
    ].join("\n");

    return {
      content: [{ type: "text", text: texto }],
      structuredContent: {
        total,
        combinacoes: todas.length,
        linhas: linhas.map((l: Linha) => ({
          area: l.area,
          tema: l.tema,
          assunto: l.assunto,
          total: Number(l.total),
        })),
      },
    };
  },
});
