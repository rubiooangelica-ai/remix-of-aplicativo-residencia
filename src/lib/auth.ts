import { useEffect, useState } from "react";
import type { Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export function useSessao() {
  const [sessao, setSessao] = useState<Session | null>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    let ativo = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!ativo) return;
      setSessao(data.session);
      setCarregando(false);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_evento, nova) => {
      setSessao(nova);
      setCarregando(false);
    });
    return () => {
      ativo = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  return { sessao, usuario: sessao?.user ?? null, carregando };
}
import { redirect } from "@tanstack/react-router";

/** Usado no beforeLoad de rotas protegidas: manda pra /auth se não houver sessão. */
export async function exigirLogin() {
  const { data } = await supabase.auth.getSession();
  if (!data.session) {
    throw redirect({ to: "/auth" });
  }
}
