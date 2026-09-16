import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "executar_sql",
  title: "Executar SQL administrativo",
  description:
    "Executa um comando de escrita (INSERT, UPDATE ou DELETE) nas tabelas do aplicativo para corrigir taxonomia e classificação das questões, e retorna o número de linhas afetadas. Bloqueia alterações de estrutura (ALTER, DROP, CREATE, TRUNCATE, GRANT), autenticação, segredos, papéis de serviço e configurações do projeto. Um comando por chamada. Requer conta administradora.",
  inputSchema: {
    sql: z
      .string()
      .min(1)
      .describe("Um único comando INSERT, UPDATE ou DELETE nas tabelas do aplicativo."),
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    idempotentHint: false,
    openWorldHint: false,
  },
  handler: async ({ sql }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Não autenticado." }], isError: true };

    const { data, error } = await supabaseForUser(ctx).rpc("mcp_executar_sql", { p_sql: sql });
    if (error)
      return {
        content: [
          {
            type: "text",
            text: [
              `Erro: ${error.message}`,
              error.details ? `Detalhes: ${error.details}` : null,
              error.hint ? `Dica: ${error.hint}` : null,
              error.code ? `Código: ${error.code}` : null,
            ]
              .filter(Boolean)
              .join("\n"),
          },
        ],
        isError: true,
      };

    const resultado = (data ?? { linhas_afetadas: 0 }) as { linhas_afetadas: number };
    return {
      content: [{ type: "text", text: `Linhas afetadas: ${resultado.linhas_afetadas}` }],
      structuredContent: resultado,
    };
  },
});
