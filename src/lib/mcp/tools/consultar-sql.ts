import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

export default defineTool({
  name: "consultar_sql",
  title: "Consultar SQL (somente leitura)",
  description:
    "Executa uma consulta de leitura (SELECT ou WITH) nas tabelas do aplicativo e retorna as linhas e a quantidade de resultados. Qualquer INSERT, UPDATE, DELETE, ALTER, DROP, TRUNCATE, comentário SQL ou múltiplos comandos é bloqueado. Requer conta administradora.",
  inputSchema: {
    sql: z.string().min(1).describe("Consulta SQL de leitura (apenas SELECT ou WITH)."),
    limite: z
      .number()
      .int()
      .min(1)
      .max(1000)
      .optional()
      .describe("Máximo de linhas retornadas (padrão 200, máximo 1000)."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ sql, limite }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Não autenticado." }], isError: true };

    const { data, error } = await supabaseForUser(ctx).rpc("mcp_consultar_sql", {
      p_sql: sql,
      p_limite: limite ?? 200,
    });
    if (error)
      return {
        content: [
          { type: "text", text: `${error.message}${error.hint ? `\nDica: ${error.hint}` : ""}` },
        ],
        isError: true,
      };

    const resultado = (data ?? { linhas: [], quantidade: 0 }) as {
      linhas: Json[];
      quantidade: number;
    };
    return {
      content: [
        {
          type: "text",
          text: `${resultado.quantidade} linha(s)\n${JSON.stringify(resultado.linhas, null, 2)}`,
        },
      ],
      structuredContent: resultado,
    };
  },
});
