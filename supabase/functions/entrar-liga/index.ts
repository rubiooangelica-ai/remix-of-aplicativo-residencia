import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.45.4";

type Body = {
  codigo?: string;
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

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";

    if (!supabaseUrl || !anonKey || !serviceKey) {
      return json({ error: "Função entrar-liga sem variáveis Supabase configuradas." }, 500);
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
    const codigo = String(body.codigo ?? "").trim().toUpperCase();
    if (codigo.length < 4) return json({ error: "Informe o código da Liga." }, 400);

    const userId = userData.user.id;

    const { data: vinculo, error: vinculoError } = await admin
      .from("equipe_membros")
      .select("equipe_id")
      .eq("user_id", userId)
      .maybeSingle();

    if (vinculoError) return json({ error: vinculoError.message }, 500);
    if (vinculo) return json({ error: "Você já participa de uma Liga." }, 400);

    const { data: equipe, error: equipeError } = await admin
      .from("equipes")
      .select("id, entrada_direta")
      .eq("codigo_convite", codigo)
      .single();

    if (equipeError || !equipe) return json({ error: "Código de Liga não encontrado." }, 404);
    if (equipe.entrada_direta === false) return json({ error: "Esta Liga exige aprovação. Use Solicitar entrada." }, 403);

    const { count, error: countError } = await admin
      .from("equipe_membros")
      .select("id", { count: "exact", head: true })
      .eq("equipe_id", equipe.id);

    if (countError) return json({ error: countError.message }, 500);
    if ((count ?? 0) >= 12) return json({ error: "Esta Liga já possui 12 ligantes." }, 400);

    const { error: membroError } = await admin
      .from("equipe_membros")
      .insert({ equipe_id: equipe.id, user_id: userId, papel: "membro" });

    if (membroError) return json({ error: membroError.message }, 500);

    return json({ id: equipe.id });
  } catch (error) {
    return json({ error: error instanceof Error ? error.message : "Erro inesperado ao entrar na Liga." }, 500);
  }
});
