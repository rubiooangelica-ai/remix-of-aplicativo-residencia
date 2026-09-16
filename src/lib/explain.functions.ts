import { createServerFn } from "@tanstack/react-start";
import { streamText } from "ai";
import { z } from "zod";

const ExplainInput = z.object({
  enunciado: z.string().min(1),
  alternativas: z.array(z.string()).min(2),
  correta: z.string().min(1),
  escolhida: z.string().min(1),
  area: z.string().min(1),
});

export const explicarQuestao = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ExplainInput.parse(input))
  .handler(async ({ data }) => {
    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("Configuração de IA ausente (LOVABLE_API_KEY).");

    const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
    const gateway = createLovableAiGatewayProvider(key);

    const prompt = [
      `Área: ${data.area}`,
      `Questão: ${data.enunciado}`,
      `Alternativas: ${data.alternativas.join(" | ")}`,
      `Gabarito: ${data.correta}`,
      `Resposta do estudante: ${data.escolhida}`,
    ].join("\n");

    const result = streamText({
      model: gateway("google/gemini-3.7-flash"),
      system:
        "Você é um preceptor de residência médica no Brasil. Explique a questão em português do Brasil, de forma didática e objetiva. Estruture assim: 1) Raciocínio clínico em 2-3 frases; 2) Por que o gabarito está correto; 3) Por que a alternativa escolhida está errada (se for o caso); 4) Pontos-chave para revisar. Use no máximo 220 palavras, sem inventar referências.",
      prompt,
    });

    return { explicacao: await result.text };
  });
