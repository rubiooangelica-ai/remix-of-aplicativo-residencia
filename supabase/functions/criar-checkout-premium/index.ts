import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

type CheckoutBody = {
  plan?: "premium_mensal" | "premium_anual";
  user_id?: string;
  email?: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Preços oficiais ficam SOMENTE aqui no servidor — nunca confiar no cliente.
const PLANOS = {
  premium_mensal: { titulo: "ResidênciaPro Premium — Mensal", preco: 29.9 },
  premium_anual: { titulo: "ResidênciaPro Premium — Anual", preco: 249.9 },
} as const;

const SITE_URL = Deno.env.get("SITE_URL") ?? "https://resident-mentor-ai.lovable.app";

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const accessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN") ?? "";
    if (!accessToken) {
      return new Response(JSON.stringify({ error: "Checkout ainda não configurado." }), {
        status: 503,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = (await req.json().catch(() => ({}))) as CheckoutBody;
    const plan = body.plan === "premium_anual" ? "premium_anual" : "premium_mensal";

    if (!body.user_id) {
      return new Response(JSON.stringify({ error: "Usuário não identificado." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const plano = PLANOS[plan];
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const webhookSecret = Deno.env.get("MERCADO_PAGO_WEBHOOK_SECRET") ?? "";
    const notificationUrl = webhookSecret
      ? `${supabaseUrl}/functions/v1/mercado-pago-webhook?secret=${webhookSecret}`
      : `${supabaseUrl}/functions/v1/mercado-pago-webhook`;

    const preference = {
      items: [
        {
          title: plano.titulo,
          quantity: 1,
          unit_price: plano.preco,
          currency_id: "BRL",
        },
      ],
      ...(body.email ? { payer: { email: body.email } } : {}),
      external_reference: `${body.user_id}:${plan}`,
      back_urls: {
        success: `${SITE_URL}/premium-sucesso`,
        pending: `${SITE_URL}/premium-pendente`,
        failure: `${SITE_URL}/premium-cancelado`,
      },
      auto_return: "approved",
      notification_url: notificationUrl,
      statement_descriptor: "RESIDENCIAPRO",
    };

    const resp = await fetch("https://api.mercadopago.com/checkout/preferences", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(preference),
    });

    const data = await resp.json().catch(() => ({}));
    if (!resp.ok || !data?.init_point) {
      const detail =
        data && typeof data === "object"
          ? {
              message: (data as Record<string, unknown>)["message"] ?? null,
              error: (data as Record<string, unknown>)["error"] ?? null,
              cause: (data as Record<string, unknown>)["cause"] ?? null,
            }
          : null;

      return new Response(
        JSON.stringify({
          error: `Mercado Pago recusou o checkout (${resp.status}).`,
          detail,
        }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(JSON.stringify({ url: data.init_point, preference_id: data.id }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Erro inesperado." }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
