import { defineTool } from "@lovable.dev/mcp-js";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "meu_desempenho",
  title: "Meu desempenho",
  description:
    "Resume o desempenho da pessoa autenticada: total de questões respondidas, acertos, erros e percentual de acertos.",
  inputSchema: {},
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async (_input, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Não autenticado." }], isError: true };
    const { data, error } = await supabaseForUser(ctx).from("respostas").select("correta");
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const total = data?.length ?? 0;
    const acertos = (data ?? []).filter((r) => r.correta).length;
    const erros = total - acertos;
    const percentual = total ? Math.round((acertos / total) * 1000) / 10 : 0;

    return {
      content: [
        {
          type: "text",
          text: total
            ? `Respondidas: ${total} | Acertos: ${acertos} | Erros: ${erros} | Aproveitamento: ${percentual}%`
            : "Você ainda não respondeu nenhuma questão.",
        },
      ],
      structuredContent: { total, acertos, erros, percentual },
    };
  },
});
