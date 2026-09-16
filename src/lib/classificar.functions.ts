import { createServerFn } from "@tanstack/react-start";
import { streamText } from "ai";
import { z } from "zod";

const MODELO = "google/gemini-3.7-flash";

async function gateway() {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("Configuração de IA ausente (LOVABLE_API_KEY).");
  const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
  return createLovableAiGatewayProvider(key);
}

function extrairJson(texto: string): unknown {
  const limpo = texto
    .replace(/```json/gi, "")
    .replace(/```/g, "")
    .trim();
  const inicio = limpo.indexOf("[");
  const fim = limpo.lastIndexOf("]");
  if (inicio === -1 || fim === -1) throw new Error("Resposta de IA inválida.");
  return JSON.parse(limpo.slice(inicio, fim + 1));
}

const ClassificarInput = z.object({
  enunciados: z.array(z.string().min(1)).min(1).max(25),
  taxonomia: z.array(z.string()).max(500),
});

const ItemClassificado = z.object({
  area: z.string().min(1),
  especialidade: z.string().min(1),
  assunto: z.string().min(1),
});

export const classificarQuestoes = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => ClassificarInput.parse(input))
  .handler(async ({ data }) => {
    const provider = await gateway();

    const result = streamText({
      model: provider(MODELO),
      system:
        "Você classifica questões de residência médica no Brasil por área, especialidade e assunto. " +
        "Responda SOMENTE com um array JSON, sem markdown, sem texto fora do array. " +
        "Cada posição do array corresponde, na mesma ordem, a uma questão da lista recebida. " +
        "Cada item deve ter exatamente os campos: area, especialidade, assunto (todos em português do Brasil). " +
        "Prefira SEMPRE reaproveitar uma combinação já existente na taxonomia fornecida. " +
        "Só crie uma especialidade ou assunto novo se nenhum da lista servir, mantendo a área dentre: " +
        "Clínica Médica, Cirurgia, Pediatria, Ginecologia e Obstetrícia, Medicina Preventiva e Social.",
      prompt: [
        "Taxonomia existente (área > especialidade > assunto), uma por linha:",
        data.taxonomia.join("\n"),
        "",
        "Classifique estas questões, na mesma ordem, respondendo só o array JSON:",
        JSON.stringify(data.enunciados.map((e, i) => ({ indice: i, enunciado: e.slice(0, 600) }))),
      ].join("\n"),
    });

    const texto = await result.text;
    let bruto: unknown;
    try {
      bruto = extrairJson(texto);
    } catch {
      throw new Error("A IA não retornou uma classificação válida. Tente novamente.");
    }

    const parsed = z.array(ItemClassificado).safeParse(bruto);
    if (!parsed.success || parsed.data.length !== data.enunciados.length) {
      throw new Error("A IA retornou uma classificação incompleta. Tente novamente.");
    }
    return { classificacoes: parsed.data };
  });
