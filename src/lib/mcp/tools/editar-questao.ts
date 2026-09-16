import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "editar_questao",
  title: "Editar questão",
  description:
    "Edita o enunciado de uma questão existente. Exige o enunciado atual para evitar sobrescrever alterações feitas depois da leitura da questão.",
  inputSchema: {
    id: z.string().describe("Id da questão."),
    enunciado_atual: z
      .string()
      .describe("Enunciado atual da questão, exatamente como está no banco."),
    novo_enunciado: z
      .string()
      .min(1)
      .describe("Novo enunciado que substituirá o atual."),
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: false,
    openWorldHint: false,
  },

  handler: async ({ id, enunciado_atual, novo_enunciado }, ctx) => {
    if (!ctx.isAuthenticated()) {
      return {
        content: [{ type: "text", text: "Não autenticado." }],
        isError: true,
      };
    }

    const supabase = supabaseForUser(ctx);

    // 1. Busca a questão antes de editar
    const { data: questaoAtual, error: erroBusca } = await supabase
      .from("questoes")
      .select("id, enunciado")
      .eq("id", id)
      .maybeSingle();

    if (erroBusca) {
      return {
        content: [{ type: "text", text: erroBusca.message }],
        isError: true,
      };
    }

    if (!questaoAtual) {
      return {
        content: [{ type: "text", text: "Questão não encontrada." }],
        isError: true,
      };
    }

    // 2. Segurança contra sobrescrita acidental
    if (questaoAtual.enunciado !== enunciado_atual) {
      return {
        content: [
          {
            type: "text",
            text:
              "O enunciado atual do banco é diferente do informado. " +
              "A questão pode ter sido modificada desde a última leitura. " +
              "Nenhuma alteração foi realizada.",
          },
        ],
        isError: true,
      };
    }

    // 3. Evita atualização vazia ou desnecessária
    const textoNovo = novo_enunciado.trim();

    if (!textoNovo) {
      return {
        content: [
          {
            type: "text",
            text: "O novo enunciado não pode ficar vazio.",
          },
        ],
        isError: true,
      };
    }

    if (textoNovo === questaoAtual.enunciado) {
      return {
        content: [
          {
            type: "text",
            text: "O novo enunciado é igual ao atual. Nenhuma alteração necessária.",
          },
        ],
        structuredContent: {
          sucesso: true,
          alterado: false,
          id,
          enunciado: questaoAtual.enunciado,
        },
      };
    }

    // 4. Atualiza
    const { data: atualizada, error: erroUpdate } = await supabase
      .from("questoes")
      .update({
        enunciado: textoNovo,
      })
      .eq("id", id)
      .select("id, enunciado, banca, ano")
      .single();

    if (erroUpdate) {
      return {
        content: [{ type: "text", text: erroUpdate.message }],
        isError: true,
      };
    }

    return {
      content: [
        {
          type: "text",
          text: `Questão ${id} atualizada com sucesso.`,
        },
      ],
      structuredContent: {
        sucesso: true,
        alterado: true,
        questao: atualizada,
      },
    };
  },
});
