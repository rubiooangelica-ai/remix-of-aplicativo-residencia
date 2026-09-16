import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Stethoscope } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { useSessao } from "@/lib/auth";

function destinoSeguro(): string {
  if (typeof window === "undefined") return "/";
  const valor = new URLSearchParams(window.location.search).get("next");
  if (!valor || !valor.startsWith("/") || valor.startsWith("//")) return "/";
  return valor;
}

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Entrar — ResidênciaPro" },
      {
        name: "description",
        content:
          "Acesse sua conta para salvar seu desempenho e importar seu próprio banco de questões de residência médica.",
      },
      { property: "og:title", content: "Entrar no ResidênciaPro" },
      {
        property: "og:description",
        content: "Login para sincronizar seu progresso e seu banco de questões.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const next = destinoSeguro();
  const { usuario } = useSessao();
  const [modo, setModo] = useState<"entrar" | "criar">("entrar");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [carregando, setCarregando] = useState(false);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setErro(null);
    setAviso(null);
    setCarregando(true);
    try {
      if (modo === "entrar") {
        const { error } = await supabase.auth.signInWithPassword({ email, password: senha });
        if (error) throw error;
        window.location.href = next;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password: senha,
          options: { emailRedirectTo: `${window.location.origin}${next}` },
        });
        if (error) throw error;
        setAviso("Conta criada. Confirme o e-mail que enviamos para começar a usar.");
      }
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Não foi possível continuar.");
    } finally {
      setCarregando(false);
    }
  }

  async function google() {
    setErro(null);
    setCarregando(true);
    const redirectTo = `${window.location.origin}${next}`;

    try {
      const result = await lovable.auth.signInWithOAuth("google", {
        redirect_uri: redirectTo,
        extraParams: {
          prompt: "select_account",
          access_type: "offline",
        },
      });

      if (result.redirected) return;
      if (!result.error) {
        window.location.href = next;
        return;
      }

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            prompt: "select_account",
            access_type: "offline",
          },
        },
      });

      if (error) throw error;
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Falha ao entrar com Google. Tente novamente.");
      setCarregando(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-xl bg-primary/15 text-primary">
            <Stethoscope className="size-5" />
          </span>
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              ResidênciaPro
            </p>
            <h1 className="font-display text-lg font-semibold">
              {usuario ? "Você já está conectado" : modo === "entrar" ? "Entrar" : "Criar conta"}
            </h1>
          </div>
        </div>

        {usuario ? (
          <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-5">
            <p className="text-sm text-muted-foreground">Conectado como {usuario.email}.</p>
            <button
              onClick={() => navigate({ to: "/" })}
              className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
            >
              Ir para o painel
            </button>
            <button
              onClick={() => navigate({ to: "/perfil" })}
              className="w-full rounded-xl border border-border/70 px-4 py-3 text-sm font-medium"
            >
              Configurações de perfil
            </button>
            <button
              onClick={async () => {
                await supabase.auth.signOut();
                window.location.href = "/auth";
              }}
              className="w-full rounded-xl border border-border/70 px-4 py-3 text-sm font-medium"
            >
              Sair da conta
            </button>
          </div>
        ) : (
          <form onSubmit={enviar} className="space-y-3 rounded-2xl border border-border/60 bg-card p-5">
            <label className="block text-xs font-medium text-muted-foreground">
              E-mail
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border/70 bg-surface px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
              />
            </label>
            <label className="block text-xs font-medium text-muted-foreground">
              Senha
              <input
                type="password"
                required
                minLength={6}
                value={senha}
                onChange={(e) => setSenha(e.target.value)}
                className="mt-1 w-full rounded-xl border border-border/70 bg-surface px-4 py-3 text-sm text-foreground outline-none focus:border-primary"
              />
            </label>

            {erro ? (
              <p className="rounded-xl border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
                {erro}
              </p>
            ) : null}
            {aviso ? (
              <p className="rounded-xl border border-success/50 bg-success/10 p-3 text-xs text-success">
                {aviso}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={carregando}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-70"
            >
              {carregando ? <Loader2 className="size-4 animate-spin" /> : null}
              {modo === "entrar" ? "Entrar" : "Criar conta"}
            </button>

            <button
              type="button"
              onClick={google}
              disabled={carregando}
              className="w-full rounded-xl border border-border/70 px-4 py-3 text-sm font-medium disabled:opacity-70"
            >
              Continuar com Google
            </button>

            <button
              type="button"
              onClick={() => setModo(modo === "entrar" ? "criar" : "entrar")}
              className="w-full pt-1 text-xs text-muted-foreground underline"
            >
              {modo === "entrar" ? "Não tenho conta ainda" : "Já tenho conta"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
