import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

const item = z.object({
  id: z.string().describe("Id da questão."),
  area: z.string().min(1).describe("Grande área, ex.: Clínica Médica."),
  tema: z.string().min(1).describe("Tema/especialidade, ex.: Cardiologia."),
  assunto: z.string().min(1).describe("Assunto, ex.: Insuficiência Cardíaca."),
});

export default defineTool({
  name: "reclassificar_questoes_em_lote",
  title: "Reclassificar questões em lote",
  description:
    "Recebe uma lista de questões com id, área, tema e assunto, resolve (ou cria) os itens correspondentes da taxonomia e atualiza todas as questões em uma única operação. Aceita até 2000 itens por chamada. Requer conta administradora.",
  inputSchema: {
    itens: z.array(item).min(1).max(2000).describe("Lista de questões a reclassificar."),
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: false,
  },
  handler: async ({ itens }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Não autenticado." }], isError: true };

    const { data, error } = await supabaseForUser(ctx).rpc("mcp_reclassificar_lote", {
      p_itens: itens,
    });
    if (error)
      return {
        content: [
          {
            type: "text",
            text: [
              `Erro: ${error.message}`,
              error.details ? `Detalhes: ${error.details}` : null,
              error.hint ? `Dica: ${error.hint}` : null,
            ]
              .filter(Boolean)
              .join("\n"),
          },
        ],
        isError: true,
      };

    const resultado = (data ?? { atualizadas: 0, erros: [], total_erros: 0 }) as {
      atualizadas: number;
      erros: Json[];
      total_erros: number;
    };
    return {
      content: [
        {
          type: "text",
          text: `Enviadas: ${itens.length}\nAtualizadas: ${resultado.atualizadas}\nFalhas: ${resultado.total_erros}${
            resultado.total_erros ? `\n${JSON.stringify(resultado.erros, null, 2)}` : ""
          }`,
        },
      ],
      structuredContent: { enviadas: itens.length, ...resultado },
    };
  },
});
