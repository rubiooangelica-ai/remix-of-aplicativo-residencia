import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

type Corpo = { acao?: string; tamanho_lote?: number };

async function processar(request: Request) {
  let corpo: Corpo = {};
  try {
    corpo = JSON.parse(await request.text()) as Corpo;
  } catch {
    // sem corpo: usa os padrões
  }

  const naoAutorizado = await authenticateCronRequest(request);
  if (naoAutorizado) return naoAutorizado;

  try {
    const mod = await import("@/lib/classificacao/migracao.server");
    const acao = corpo.acao ?? "processar";

    if (acao === "reiniciar") return Response.json(await mod.reiniciarClassificacao());
    if (acao === "sincronizar") return Response.json(await mod.sincronizarArvore());
    if (acao === "limpar") return Response.json(await mod.limparTaxonomiaAntiga());
    if (acao === "validar") return Response.json(await mod.validarTaxonomia());

    const resultado = await mod.processarLoteClassificacao(corpo.tamanho_lote ?? 500);
    console.log("[classificacao]", JSON.stringify(resultado));
    return Response.json(resultado);
  } catch (e) {
    const mensagem = e instanceof Error ? e.message : "Erro desconhecido";
    console.error("[classificacao] falhou:", mensagem);
    return Response.json({ ok: false, erro: mensagem }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/public/classificacao/processar")({
  server: {
    handlers: {
      POST: ({ request }) => processar(request),
    },
  },
});
