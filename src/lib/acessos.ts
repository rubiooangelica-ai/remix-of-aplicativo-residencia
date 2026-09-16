import { supabase } from "@/integrations/supabase/client";

const JANELA_MS = 30 * 60 * 1000;

export function registrarAcessoApp(userId: string | undefined) {
  if (!userId || typeof window === "undefined") return;
  const path = window.location.pathname.slice(0, 300) || "/";
  const janela = Math.floor(Date.now() / JANELA_MS);
  const chave = `residenciapro:acesso:${userId}:${path}:${janela}`;
  if (window.sessionStorage.getItem(chave)) return;
  window.sessionStorage.setItem(chave, "1");

  void (supabase as any).from("user_activity_events")
    .insert({ user_id: userId, event_type: "page_view", path })
    .then(({ error }: { error: { message: string } | null }) => {
      if (error) {
        window.sessionStorage.removeItem(chave);
        console.warn("[Atividade] Não foi possível registrar o acesso:", error.message);
      }
    });
}
