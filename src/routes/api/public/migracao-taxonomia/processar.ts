import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";

/** Aceita o segredo de cron da plataforma OU o token interno da migração (guardado no banco). */
async function autorizado(request: Request): Promise<boolean> {
  const naoAutorizado = await authenticateCronRequest(request);
  if (!naoAutorizado) return true;

  const match = /^Bearer ([^\s,]+)$/.exec(request.headers.get("authorization") ?? "");
  const token = match?.[1];
  if (!token) return false;

  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin.from("mig_cron_token").select("token").limit(1).maybeSingle();
  return !!data?.token && data.token === token;
}

async function processar(request: Request) {
  let tamanho = 50;
  let aplicar = true;
  let corpoTexto = "";
  try {
    corpoTexto = await request.text();
    const corpo = JSON.parse(corpoTexto) as { tamanho_lote?: number; aplicar?: boolean };
    if (typeof corpo?.tamanho_lote === "number") tamanho = corpo.tamanho_lote;
    if (typeof corpo?.aplicar === "boolean") aplicar = corpo.aplicar;
  } catch {
    // sem corpo: usa os padrões
  }

  if (!(await autorizado(request))) return new Response("Unauthorized", { status: 401 });

  try {
    const { processarLoteMigracao } = await import("@/lib/migracao-taxonomia.server");
    const resultado = await processarLoteMigracao(tamanho, aplicar);
    console.log("[migracao-taxonomia]", JSON.stringify(resultado));
    return Response.json(resultado);
  } catch (e) {
    const mensagem = e instanceof Error ? e.message : "Erro desconhecido";
    console.error("[migracao-taxonomia] falhou:", mensagem);
    return Response.json({ ok: false, erro: mensagem }, { status: 500 });
  }
}

export const Route = createFileRoute("/api/public/migracao-taxonomia/processar")({
  server: {
    handlers: {
      POST: ({ request }) => processar(request),
    },
  },
});
