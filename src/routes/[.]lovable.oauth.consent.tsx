import { createFileRoute, redirect } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Stethoscope } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

type OAuthApi = {
  getAuthorizationDetails: (id: string) => Promise<{ data: AuthorizationDetails | null; error: { message: string } | null }>;
  approveAuthorization: (id: string) => Promise<{ data: RedirectPayload | null; error: { message: string } | null }>;
  denyAuthorization: (id: string) => Promise<{ data: RedirectPayload | null; error: { message: string } | null }>;
};

type RedirectPayload = { redirect_url?: string; redirect_to?: string };
type AuthorizationDetails = RedirectPayload & { client?: { name?: string } | null };

function oauthApi(): OAuthApi {
  return (supabase.auth as unknown as { oauth: OAuthApi }).oauth;
}

export const Route = createFileRoute("/.lovable/oauth/consent")({
  ssr: false,
  validateSearch: (s: Record<string, unknown>) => ({
    authorization_id: typeof s['authorization_id'] === "string" ? s['authorization_id'] : "",
  }),
  beforeLoad: async ({ search, location }) => {
    if (!search.authorization_id) throw new Error("Missing authorization_id");
    const { data } = await supabase.auth.getSession();
    if (!data.session) {
      const next = location.pathname + location.searchStr;
      throw redirect({ href: `/auth?next=${encodeURIComponent(next)}` });
    }
  },
  loader: async ({ location }) => {
    const authorizationId = new URLSearchParams(location.search).get("authorization_id")!;
    const { data, error } = await oauthApi().getAuthorizationDetails(authorizationId);
    if (error) throw error;
    const immediate = data?.redirect_url ?? data?.redirect_to;
    if (immediate && !data?.client) throw redirect({ href: immediate });
    return data;
  },
  component: Consent,
  errorComponent: ({ error }) => (
    <main className="flex min-h-screen items-center justify-center px-6 text-center">
      <p className="text-sm text-muted-foreground">
        Não foi possível carregar este pedido de autorização: {String((error as Error)?.message ?? error)}
      </p>
    </main>
  ),
});

function Consent() {
  const details = Route.useLoaderData();
  const { authorization_id } = Route.useSearch();
  const [busy, setBusy] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const nome = details?.client?.name ?? "um aplicativo";

  async function decidir(aprovar: boolean) {
    setBusy(true);
    setErro(null);
    const api = oauthApi();
    const { data, error } = aprovar
      ? await api.approveAuthorization(authorization_id)
      : await api.denyAuthorization(authorization_id);
    if (error) {
      setBusy(false);
      setErro(error.message);
      return;
    }
    const destino = data?.redirect_url ?? data?.redirect_to;
    if (!destino) {
      setBusy(false);
      setErro("O servidor de autorização não devolveu um endereço de retorno.");
      return;
    }
    window.location.href = destino;
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-background px-5 py-10">
      <div className="w-full max-w-sm rounded-2xl border border-border/60 bg-card p-6">
        <Stethoscope className="size-6 text-primary" />
        <h1 className="mt-3 font-display text-lg font-semibold text-foreground">
          Conectar {nome} à sua conta
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
          {nome} poderá consultar o banco de questões, ver o seu desempenho e criar flashcards no seu
          nome dentro do ResidênciaPro.
        </p>
        {erro ? (
          <p role="alert" className="mt-3 text-xs text-destructive">
            {erro}
          </p>
        ) : null}
        <div className="mt-5 flex gap-2">
          <button
            disabled={busy}
            onClick={() => decidir(true)}
            className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
          >
            {busy ? <Loader2 className="size-4 animate-spin" /> : null}
            Autorizar
          </button>
          <button
            disabled={busy}
            onClick={() => decidir(false)}
            className="flex-1 rounded-xl border border-border/70 px-4 py-2.5 text-sm text-muted-foreground disabled:opacity-60"
          >
            Recusar
          </button>
        </div>
      </div>
    </main>
  );
}
