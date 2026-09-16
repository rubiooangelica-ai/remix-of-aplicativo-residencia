import { useMemo, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Clock3, Crown, Download, RefreshCw, Search, ShieldCheck, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useEhAdmin } from "@/lib/admin";
import { exigirLogin } from "@/lib/auth";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin-assinaturas")({
  beforeLoad: exigirLogin,
  component: AdminAssinaturas,
  head: () => ({ meta: [{ title: "Usuários e assinaturas — ResidênciaPro" }] }),
});

type UsuarioAdmin = {
  user_id: string; email: string | null; apelido: string | null; created_at: string;
  email_confirmed_at: string | null; last_sign_in_at: string | null; banned_until: string | null;
  last_activity_at: string | null; last_path: string | null; pageviews_30d: number;
  plan: string | null; subscription_status: string | null; provider: string | null;
  started_at: string | null; expires_at: string | null;
};

const dataPt = (data: string | null) => data
  ? new Intl.DateTimeFormat("pt-BR", { dateStyle: "short", timeStyle: "short" }).format(new Date(data))
  : "Nunca";

function premiumAtivo(u: UsuarioAdmin) {
  const status = u.subscription_status === "active" || u.subscription_status === "trialing";
  return u.plan === "premium" && status && (!u.expires_at || new Date(u.expires_at) > new Date());
}

async function listarUsuarios(): Promise<UsuarioAdmin[]> {
  const { data, error } = await (supabase as any).rpc("admin_list_users");
  if (error) throw new Error(error.message);
  return data ?? [];
}

function baixarCsv(usuarios: UsuarioAdmin[]) {
  const cabecalho = ["nome", "email", "criado_em", "ultimo_acesso", "ultima_pagina", "acessos_30_dias", "plano", "status", "inicio_plano", "fim_plano"];
  const escapar = (valor: unknown) => `"${String(valor ?? "").replaceAll('"', '""')}"`;
  const linhas = usuarios.map((u) => [
    u.apelido, u.email, u.created_at, u.last_activity_at ?? u.last_sign_in_at, u.last_path,
    u.pageviews_30d, premiumAtivo(u) ? "Premium" : "Grátis", u.subscription_status, u.started_at, u.expires_at,
  ].map(escapar).join(","));
  const blob = new Blob(["\ufeff" + [cabecalho.join(","), ...linhas].join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = `usuarios-residenciapro-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  URL.revokeObjectURL(url);
}

function AdminAssinaturas() {
  const { ehAdmin, carregando } = useEhAdmin();
  const queryClient = useQueryClient();
  const [busca, setBusca] = useState("");
  const [filtro, setFiltro] = useState<"todos" | "premium" | "gratis">("todos");
  const usuarios = useQuery({ queryKey: ["admin-usuarios"], queryFn: listarUsuarios, enabled: ehAdmin });

  const alterarPremium = useMutation({
    mutationFn: async ({ userId, acao }: { userId: string; acao: "conceder" | "cancelar" }) => {
      const resposta = acao === "conceder"
        ? await (supabase as any).rpc("admin_conceder_premium", { p_user_id: userId, p_dias: 30 })
        : await (supabase as any).rpc("admin_cancelar_premium", { p_user_id: userId });
      if (resposta.error) throw new Error(resposta.error.message);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-usuarios"] }),
  });

  const filtrados = useMemo(() => {
    const termo = busca.trim().toLocaleLowerCase("pt-BR");
    return (usuarios.data ?? []).filter((u) => {
      const texto = `${u.apelido ?? ""} ${u.email ?? ""}`.toLocaleLowerCase("pt-BR");
      const ativo = premiumAtivo(u);
      return (!termo || texto.includes(termo)) && (filtro === "todos" || (filtro === "premium" ? ativo : !ativo));
    });
  }, [busca, filtro, usuarios.data]);

  if (carregando) return <AppShell titulo="Usuários e assinaturas"><p className="text-sm text-muted-foreground">Carregando...</p></AppShell>;
  if (!ehAdmin) return <AppShell titulo="Usuários e assinaturas"><div className="rounded-2xl border border-destructive/30 bg-destructive/5 p-5 text-sm text-destructive">Apenas administradores podem acessar essa tela.</div></AppShell>;

  const total = usuarios.data?.length ?? 0;
  const premiums = usuarios.data?.filter(premiumAtivo).length ?? 0;
  const limite30d = Date.now() - 30 * 86400000;
  const ativos30d = usuarios.data?.filter((u) => {
    const ultimo = u.last_activity_at ?? u.last_sign_in_at;
    return ultimo && new Date(ultimo).getTime() >= limite30d;
  }).length ?? 0;

  return (
    <AppShell titulo="Usuários e assinaturas" descricao="Controle de contas, acessos ao aplicativo e planos Premium.">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <Link to="/admin" className="inline-flex items-center gap-1.5 text-xs font-medium text-primary"><ArrowLeft className="size-3.5" /> Voltar para admin</Link>
        <div className="flex gap-2">
          <button onClick={() => baixarCsv(filtrados)} className="inline-flex items-center gap-1.5 rounded-xl border border-border/70 px-3 py-2 text-xs font-semibold"><Download className="size-3.5" /> CSV</button>
          <button onClick={() => usuarios.refetch()} disabled={usuarios.isFetching} className="inline-flex items-center gap-1.5 rounded-xl border border-border/70 px-3 py-2 text-xs font-semibold disabled:opacity-50"><RefreshCw className={`size-3.5 ${usuarios.isFetching ? "animate-spin" : ""}`} /> Atualizar</button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-2">
        {[
          { rotulo: "Contas", valor: total, Icone: Users },
          { rotulo: "Ativos em 30 dias", valor: ativos30d, Icone: Clock3 },
          { rotulo: "Premium ativo", valor: premiums, Icone: Crown },
        ].map(({ rotulo, valor, Icone }) => (
          <div key={rotulo} className="rounded-2xl border border-border/60 bg-card p-3"><Icone className="mb-2 size-4 text-primary" /><p className="text-xl font-bold">{valor}</p><p className="text-[10px] leading-tight text-muted-foreground">{rotulo}</p></div>
        ))}
      </div>

      <div className="mt-4 grid gap-2 sm:grid-cols-[1fr_auto]">
        <label className="flex items-center gap-2 rounded-xl border border-border/70 bg-card px-3"><Search className="size-4 text-muted-foreground" /><input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Buscar nome ou e-mail" className="min-w-0 flex-1 bg-transparent py-2.5 text-sm outline-none" /></label>
        <select value={filtro} onChange={(e) => setFiltro(e.target.value as typeof filtro)} className="rounded-xl border border-border/70 bg-card px-3 py-2.5 text-sm outline-none">
          <option value="todos">Todos os planos</option><option value="premium">Premium ativo</option><option value="gratis">Plano grátis</option>
        </select>
      </div>

      {usuarios.isError ? <p className="mt-4 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">{(usuarios.error as Error).message}</p> : null}
      {alterarPremium.isError ? <p className="mt-4 rounded-xl bg-destructive/10 p-3 text-xs text-destructive">{(alterarPremium.error as Error).message}</p> : null}

      <div className="mt-4 space-y-3">
        {usuarios.isLoading ? <p className="text-sm text-muted-foreground">Carregando usuários...</p> : null}
        {filtrados.map((u) => {
          const ativo = premiumAtivo(u);
          const bloqueado = !!u.banned_until && new Date(u.banned_until) > new Date();
          return (
            <article key={u.user_id} className="rounded-2xl border border-border/60 bg-card p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0"><p className="truncate text-sm font-semibold">{u.apelido || "Sem nome"}</p><p className="break-all text-xs text-muted-foreground">{u.email || "Sem e-mail"}</p></div>
                <span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${ativo ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground"}`}>{ativo ? "Premium" : "Grátis"}</span>
              </div>
              <div className="mt-3 grid gap-2 text-xs sm:grid-cols-2">
                <p><span className="text-muted-foreground">Conta criada:</span> {dataPt(u.created_at)}</p>
                <p><span className="text-muted-foreground">Último acesso:</span> {dataPt(u.last_activity_at ?? u.last_sign_in_at)}</p>
                <p><span className="text-muted-foreground">Última página:</span> {u.last_path || "Ainda não registrada"}</p>
                <p><span className="text-muted-foreground">Acessos em 30 dias:</span> {u.pageviews_30d}</p>
                <p><span className="text-muted-foreground">E-mail:</span> {u.email_confirmed_at ? "Confirmado" : "Não confirmado"}{bloqueado ? " · Bloqueado" : ""}</p>
                <p><span className="text-muted-foreground">Assinatura:</span> {u.subscription_status || "Sem assinatura"}{u.provider ? ` · ${u.provider}` : ""}</p>
                {u.expires_at ? <p><span className="text-muted-foreground">Premium até:</span> {dataPt(u.expires_at)}</p> : null}
              </div>
              <div className="mt-3 flex flex-wrap gap-2 border-t border-border/50 pt-3">
                {ativo ? (
                  <button onClick={() => window.confirm("Cancelar o Premium deste usuário?") && alterarPremium.mutate({ userId: u.user_id, acao: "cancelar" })} disabled={alterarPremium.isPending} className="rounded-xl border border-destructive/40 px-3 py-2 text-xs font-semibold text-destructive disabled:opacity-50">Cancelar Premium</button>
                ) : (
                  <button onClick={() => alterarPremium.mutate({ userId: u.user_id, acao: "conceder" })} disabled={alterarPremium.isPending} className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"><ShieldCheck className="size-3.5" /> Liberar 30 dias</button>
                )}
                <span className="self-center text-[10px] text-muted-foreground">ID: {u.user_id}</span>
              </div>
            </article>
          );
        })}
        {!usuarios.isLoading && filtrados.length === 0 ? <p className="rounded-xl border border-border/60 p-4 text-sm text-muted-foreground">Nenhum usuário encontrado.</p> : null}
      </div>
    </AppShell>
  );
}
