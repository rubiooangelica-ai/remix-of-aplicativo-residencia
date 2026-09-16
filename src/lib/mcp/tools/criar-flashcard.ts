import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "criar_flashcard",
  title: "Criar flashcard pessoal",
  description: "Cria um flashcard pessoal (frente e verso) na conta da pessoa autenticada.",
  inputSchema: {
    frente: z.string().trim().describe("Pergunta ou termo da frente do flashcard."),
    verso: z.string().trim().describe("Resposta do verso do flashcard."),
  },
  annotations: { readOnlyHint: false, destructiveHint: false, openWorldHint: false },
  handler: async ({ frente, verso }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Não autenticado." }], isError: true };
    if (!frente || !verso)
      return { content: [{ type: "text", text: "Frente e verso são obrigatórios." }], isError: true };

    const { data, error } = await supabaseForUser(ctx)
      .from("flashcards_pessoais")
      .insert({ user_id: ctx.getUserId()!, frente, verso })
      .select("id, frente, verso")
      .single();
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    return {
      content: [{ type: "text", text: `Flashcard criado: ${data.frente}` }],
      structuredContent: { flashcard: data },
    };
  },
});
