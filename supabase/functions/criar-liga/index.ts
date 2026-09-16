import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

type Body = {
  nome?: string;
};

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function gerarCodigo() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !anonKey || !serviceKey) {
      return json({ error: "Função criar-liga sem variáveis Supabase configuradas." }, 500);
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    if (!authHeader) return json({ error: "Usuário não autenticado." }, 401);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const admin = createClient(supabaseUrl, serviceKey);

    const { data: userData, error: userError } = await userClient.auth.getUser();
    if (userError || !userData.user) return json({ error: "Usuário não autenticado." }, 401);

    const body = (await req.json().catch(() => ({}))) as Body;
    const nome = String(body.nome ?? "").trim().slice(0, 40);
    if (nome.length < 2) return json({ error: "Informe um nome para a Liga." }, 400);

    const userId = userData.user.id;

    const { data: vinculo, error: vinculoError } = await admin
      .from("equipe_membros")
      .select("equipe_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (vinculoError) return json({ error: vinculoError.message }, 500);
    if (vinculo) return json({ error: "Você já participa de uma Liga." }, 400);

    let equipeId: string | null = null;
    let codigo = "";
    let ultimoErro = "";

    for (let tentativa = 0; tentativa < 5; tentativa++) {
      codigo = gerarCodigo();
      const { data: equipe, error: equipeError } = await admin
        .from("equipes")
        .insert({ nome, lider_id: userId, codigo_convite: codigo, entrada_direta: true })
        .select("id")
        .single();

      if (!equipeError && equipe?.id) {
        equipeId = equipe.id;
        break;
      }

      ultimoErro = equipeError?.message ?? "Erro ao criar Liga.";
      if (!ultimoErro.toLowerCase().includes("duplicate")) break;
    }

    if (!equipeId) return json({ error: ultimoErro || "Não foi possível criar a Liga." }, 500);

    const { error: membroError } = await admin
      .from("equipe_membros")
      .insert({ equipe_id: equipeId, user_id: userId, papel: "lider" });

    if (membroError) {
      await admin.from("equipes").delete().eq("id", equipeId);
      return json({ error: membroError.message }, 500);
    }

    return json({ id: equipeId, codigo });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Erro inesperado ao criar Liga." }, 500);
  }
});
