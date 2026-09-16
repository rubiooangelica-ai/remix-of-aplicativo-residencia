import { createServerFn } from "@tanstack/react-start";
import { streamText } from "ai";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function exigirPremium(context: any) {
  const { data, error } = await (context.supabase as any).rpc("tem_acesso_premium", {
    p_user_id: context.userId,
  });
  if (error) throw new Error(`Não foi possível validar o acesso Premium: ${error.message}`);
  if (!data) throw new Error("PREMIUM_NECESSARIO: esta ferramenta é exclusiva do ResidênciaPro Premium.");
}

async function gateway() {
  const key = process.env["LOVABLE_API_KEY"];
  if (!key) throw new Error("Configuração de IA ausente (LOVABLE_API_KEY).");
  const { createLovableAiGatewayProvider } = await import("./ai-gateway.server");
  return createLovableAiGatewayProvider(key);
}

export const gerarResumo = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ tema: z.string().min(1), modo: z.enum(["flash", "topicos", "pegadinhas"]) }).parse(input))
  .handler(async ({ data, context }) => {
    await exigirPremium(context);
    const instrucao = { flash: "Resumo relâmpago em até 120 palavras com o essencial para responder questões.", topicos: "Resumo em tópicos curtos cobrindo definição, quadro clínico, diagnóstico e tratamento.", pegadinhas: "Liste de 5 a 7 pegadinhas e detalhes que as bancas de residência mais cobram sobre o tema." }[data.modo];
    const result = streamText({ model: (await gateway())("google/gemini-3.7-flash"), system: "Você é preceptor de residência médica no Brasil. Escreva em português do Brasil, objetivo, sem inventar referências ou diretrizes específicas com números de citação.", prompt: `Tema: ${data.tema}\nTarefa: ${instrucao}` });
    return { resumo: await result.text };
  });

export const tirarDuvida = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ contexto: z.string().min(1), historico: z.array(z.object({ papel: z.enum(["user", "assistant"]), texto: z.string().min(1) })).max(20), pergunta: z.string().min(1) }).parse(input))
  .handler(async ({ data, context }) => {
    await exigirPremium(context);
    const result = streamText({ model: (await gateway())("google/gemini-3.7-flash"), system: `Você é um preceptor de residência médica no Brasil tirando dúvidas de uma estudante durante a resolução de questões. Responda em português do Brasil, direto ao ponto, no máximo 180 palavras. Contexto da questão atual:\n${data.contexto}`, messages: [...data.historico.map((m) => ({ role: m.papel, content: m.texto }) as const), { role: "user" as const, content: data.pergunta }] });
    return { resposta: await result.text };
  });

export const gerarExplicacaoQuestao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ enunciado: z.string().min(1), alternativas: z.array(z.string()), correta: z.string().min(1) }).parse(input))
  .handler(async ({ data, context }) => {
    await exigirPremium(context);
    const result = streamText({ model: (await gateway())("google/gemini-3.7-flash"), system: ["Você é preceptor de residência médica no Brasil e escreve comentários oficiais de questões.", "Baseie-se em diretrizes e guidelines médicos atualizados e em fontes confiáveis reconhecidas da área.", "Nunca invente informação, dado, número ou diretriz que você não tenha certeza de que existe; se não tiver certeza, seja genérico em vez de inventar.", "Escreva em português do Brasil, em TEXTO CORRIDO — nunca use tópicos, listas, numeração, títulos ou marcadores.", "Explique o raciocínio clínico de forma lúcida e direta, aponte dentro do próprio texto por que cada alternativa incorreta está errada e por que a alternativa correta é a certa.", "Use entre 150 e 300 palavras. Não cite números de referências bibliográficas."].join(" "), prompt: [`Enunciado: ${data.enunciado}`, `Alternativas: ${data.alternativas.join(" | ")}`, `Alternativa correta: ${data.correta}`].join("\n") });
    return { explicacao: (await result.text).trim() };
  });
