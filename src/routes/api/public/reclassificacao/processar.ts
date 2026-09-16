import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

/**
 * Endpoint do agendador (pg_cron) que processa um lote da reclassificação.
 * Protegido pelo segredo de cron — não é público de fato.
 */
async function processar(request: Request) {
  const naoAutorizado = await authenticateCronRequest(request);
  if (naoAutorizado) return naoAutorizado;

  let jobId: string | undefined;
  try {
    const corpo = (await request.json()) as { job_id?: string };
    if (typeof corpo?.job_id === "string") jobId = corpo.job_id;
  } catch {
    // sem corpo: processa o trabalho ativo
  }

  try {
    const { processarLoteReclassificacao } = await import("@/lib/reclassificacao.server");
    const resultado = await processarLoteReclassificacao(jobId);
    console.log("[reclassificacao]", JSON.stringify(resultado));
    return Response.json(resultado);
  } catch (e) {
    const mensagem = e instanceof Error ? e.message : "Erro desconhecido";
    console.error("[reclassificacao] falhou:", mensagem);
    return Response.json({ ok: false, erro: mensagem }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/public/reclassificacao/processar")({
  server: {
    handlers: {
      POST: ({ request }) => processar(request),
    },
  },
});
