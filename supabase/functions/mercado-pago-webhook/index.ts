import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-signature, x-request-id",
};

const DIAS_POR_PLANO: Record<string, number> = {
  premium_mensal: 31,
  premium_anual: 366,
};

function separarReferencia(referencia: string) {
  const [userId, plan] = referencia.split(":");
  return { userId, plan: plan || "premium_mensal" };
}

function dataExpiracao(plan: string) {
  const dias = DIAS_POR_PLANO[plan] ?? 31;
  return new Date(Date.now() + dias * 24 * 60 * 60 * 1000).toISOString();
}

/**
 * Grava o evento no histórico do banco. Falhas de gravação são registradas nos
 * logs da função em vez de serem ignoradas em silêncio.
 */
async function registrarEvento(supabase: any, dados: Record<string, unknown>) {
  const { error } = await supabase.from("subscription_events").insert(dados);
  if (error) {
    console.error("Falha ao registrar evento de pagamento:", error.message);
  }
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
  const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN") ?? "";
  const webhookSecret = Deno.env.get("MERCADO_PAGO_WEBHOOK_SECRET") ?? "";

  try {
    // O segredo viaja como ?secret=... na notification_url configurada na assinatura.
    if (webhookSecret) {
      const url = new URL(req.url);
      if (url.searchParams.get("secret") !== webhookSecret) {
        return new Response(JSON.stringify({ error: "Webhook não autorizado." }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    const payload = (await req.json().catch(() => ({}))) as Record<string, unknown>;
    const supabase = createClient(supabaseUrl, serviceKey);

    const tipo = String(payload["type"] ?? payload["topic"] ?? "").toLowerCase();
    const idEvento = (payload["data"] as { id?: string | number } | undefined)?.id ?? payload["id"] ?? null;

    if (!accessToken) {
      await registrarEvento(supabase, {
        provider: "mercado_pago",
        provider_event_id: String(idEvento ?? crypto.randomUUID()),
        event_type: tipo || "received_without_access_token",
        payload,
      });
      return new Response(JSON.stringify({ error: "Access Token não configurado." }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!idEvento) {
      await registrarEvento(supabase, {
        provider: "mercado_pago",
        provider_event_id: crypto.randomUUID(),
        event_type: tipo || "received_without_id",
        payload,
      });
      return new Response(JSON.stringify({ ok: true, ignored: "Evento sem id." }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Assinaturas recorrentes: evento de preapproval/subscription_preapproval.
    if (["preapproval", "subscription_preapproval", "authorized_payment"].includes(tipo)) {
      const resp = await fetch(`https://api.mercadopago.com/preapproval/${idEvento}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const assinatura = await resp.json().catch(() => null);

      await registrarEvento(supabase, {
        provider: "mercado_pago",
        provider_event_id: String(idEvento),
        event_type: tipo || "preapproval",
        payload: { notificacao: payload, assinatura },
      });

      if (!resp.ok || !assinatura) {
        return new Response(JSON.stringify({ error: "Falha ao consultar assinatura no Mercado Pago." }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const status = String(assinatura.status ?? "").toLowerCase();
      const referencia = String(assinatura.external_reference ?? "");
      const { userId, plan } = separarReferencia(referencia);

      if (!userId) {
        return new Response(JSON.stringify({ ok: true, ignored: "Assinatura sem external_reference." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (["authorized", "active"].includes(status)) {
        const expiresAt = dataExpiracao(plan);
        await supabase.from("subscriptions").upsert(
          {
            user_id: userId,
            plan: "premium",
            status: "active",
            provider: "mercado_pago",
            provider_subscription_id: String(assinatura.id ?? idEvento),
            provider_customer_id: assinatura.payer_id ? String(assinatura.payer_id) : null,
            started_at: new Date().toISOString(),
            expires_at: expiresAt,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );
      } else if (["cancelled", "paused", "finished", "rejected"].includes(status)) {
        await supabase.rpc("admin_cancelar_premium", { p_user_id: userId });
      }

      return new Response(JSON.stringify({ ok: true, tipo, status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Pagamento avulso/renovação cobrada pelo Mercado Pago.
    if (tipo === "payment") {
      const resp = await fetch(`https://api.mercadopago.com/v1/payments/${idEvento}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });
      const pagamento = await resp.json().catch(() => null);

      await registrarEvento(supabase, {
        provider: "mercado_pago",
        provider_event_id: String(idEvento),
        event_type: tipo || "payment",
        payload: { notificacao: payload, pagamento },
      });

      if (!resp.ok || !pagamento) {
        return new Response(JSON.stringify({ error: "Falha ao consultar pagamento no Mercado Pago." }), {
          status: 502,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const status = String(pagamento.status ?? "").toLowerCase();
      const referencia = String(pagamento.external_reference ?? "");
      const { userId, plan } = separarReferencia(referencia);

      if (!userId) {
        return new Response(JSON.stringify({ ok: true, ignored: "Pagamento sem external_reference." }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (status === "approved") {
        await supabase.from("subscriptions").upsert(
          {
            user_id: userId,
            plan: "premium",
            status: "active",
            provider: "mercado_pago",
            provider_subscription_id: pagamento.preapproval_id ? String(pagamento.preapproval_id) : null,
            provider_customer_id: pagamento.payer?.id ? String(pagamento.payer.id) : null,
            started_at: new Date().toISOString(),
            expires_at: dataExpiracao(plan),
            updated_at: new Date().toISOString(),
          },
          { onConflict: "user_id" },
        );
      } else if (["refunded", "charged_back", "cancelled"].includes(status)) {
        await supabase.rpc("admin_cancelar_premium", { p_user_id: userId });
      }

      return new Response(JSON.stringify({ ok: true, tipo, status }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    await registrarEvento(supabase, {
      provider: "mercado_pago",
      provider_event_id: String(idEvento),
      event_type: tipo || "ignored",
      payload,
    });

    return new Response(JSON.stringify({ ok: true, ignored: true, tipo }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro inesperado." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
