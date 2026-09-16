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
  const inicio = limpo.indexOf("{");
  const fim = limpo.lastIndexOf("}");
  if (inicio === -1 || fim === -1) throw new Error("Resposta de IA inválida.");
  return JSON.parse(limpo.slice(inicio, fim + 1));
}

export type CasoDiagnostico = { diagnostico: string; dicas: string[] };

export const gerarCasoDiagnostico = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ evitar: z.array(z.string()).max(40).default([]) }).parse(input),
  )
  .handler(async ({ data }): Promise<CasoDiagnostico> => {
    const provider = await gateway();
    const result = streamText({
      model: provider(MODELO),
      system:
        'Você cria desafios diagnósticos para estudantes de medicina no Brasil, no estilo de um jogo de adivinhação por pistas progressivas. Responda SOMENTE com JSON válido, sem markdown, no formato {"diagnostico":string,"dicas":[string,string,string,string,string]}. Escreva em português do Brasil.',
      prompt: `Sorteie uma patologia relevante para provas de residência médica (pode ser de qualquer especialidade) e monte 5 pistas progressivas sobre um caso clínico real e fidedigno dessa patologia.

Regras das pistas:
1. Dica 1: queixa principal e dados demográficos, bem inespecífica.
2. Dica 2: história da doença atual e sintomas associados.
3. Dica 3: antecedentes, fatores de risco e exame físico.
4. Dica 4: exames complementares e achados característicos.
5. Dica 5: tratamento/conduta específica da doença (quase entrega o diagnóstico).

Nunca escreva o nome do diagnóstico dentro das pistas. Cada pista deve ter de 1 a 3 frases.
O campo "diagnostico" deve conter o nome da doença de forma simples e canônica.
${data.evitar.length ? `Não repita nenhum destes diagnósticos: ${data.evitar.join(", ")}.` : ""}`,
    });

    const bruto = extrairJson(await result.text) as {
      diagnostico?: string;
      dicas?: unknown[];
    };
    const dicas = (bruto.dicas ?? []).map((d) => String(d)).filter(Boolean).slice(0, 5);
    if (!bruto.diagnostico || dicas.length < 3) throw new Error("Não foi possível montar o caso.");
    return { diagnostico: String(bruto.diagnostico).trim(), dicas };
  });

export const conferirPalpite = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({ diagnostico: z.string().min(1), palpite: z.string().min(1).max(200) })
      .parse(input),
  )
  .handler(async ({ data }): Promise<{ acertou: boolean }> => {
    const provider = await gateway();
    const result = streamText({
      model: provider(MODELO),
      system:
        'Você compara duas expressões diagnósticas médicas. Responda SOMENTE com JSON no formato {"acertou":true|false}. Considere acerto quando o palpite for o mesmo diagnóstico, incluindo sinônimos, siglas e grafias diferentes. Não aceite categorias amplas demais nem diagnósticos diferentes.',
      prompt: `Diagnóstico correto: ${data.diagnostico}\nPalpite do estudante: ${data.palpite}`,
    });
    const bruto = extrairJson(await result.text) as { acertou?: boolean };
    return { acertou: bruto.acertou === true };
  });
