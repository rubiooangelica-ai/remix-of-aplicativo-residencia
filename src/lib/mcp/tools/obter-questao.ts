import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "obter_questao",
  title: "Obter questão completa",
  description:
    "Retorna uma questão completa pelo id: enunciado, alternativas, gabarito e comentário, quando existir.",
  inputSchema: { id: z.string().describe("Id da questão.") },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ id }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Não autenticado." }], isError: true };
    const { data, error } = await supabaseForUser(ctx)
      .from("questoes")
      .select("id, enunciado, alternativas, correta, comentario, banca, ano, imagem_url, anulada")
      .eq("id", id)
      .maybeSingle();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };
    if (!data) return { content: [{ type: "text", text: "Questão não encontrada." }], isError: true };

    const alternativas = Array.isArray(data.alternativas)
      ? (data.alternativas as unknown[]).map((a) =>
          typeof a === "string" ? a : JSON.stringify(a),
        )
      : [];

    const temImagem = !!data.imagem_url?.trim();

    const texto = [
      `Banca: ${data.banca ?? "?"} | Ano: ${data.ano ?? "?"}${data.anulada ? " | ANULADA" : ""}`,
      temImagem ? `Imagem: ${data.imagem_url}` : "Imagem: nenhuma",
      data.enunciado,
      alternativas.length ? alternativas.join("\n") : "",
      `Gabarito: ${data.correta}`,
      data.comentario ? `Comentário: ${data.comentario}` : "",
    ]
      .filter(Boolean)
      .join("\n\n");

    return {
      content: [{ type: "text", text: texto }],
      structuredContent: {
        questao: { ...data, alternativas, tem_imagem: temImagem },
      },
    };
  },
});
