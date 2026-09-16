import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

type Json = string | number | boolean | null | Json[] | { [k: string]: Json };

export default defineTool({
  name: "listar_schema",
  title: "Listar estrutura do banco",
  description:
    "Retorna as tabelas do aplicativo com colunas, tipos, obrigatoriedade, chaves primárias e chaves estrangeiras. Somente leitura. Requer conta administradora.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Não autenticado." }], isError: true };

    const { data, error } = await supabaseForUser(ctx).rpc("mcp_listar_schema");
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const tabelas = (data ?? []) as Json[];
    return {
      content: [{ type: "text", text: JSON.stringify(tabelas, null, 2) }],
      structuredContent: { tabelas: tabelas.length, schema: tabelas },
    };
  },
});
