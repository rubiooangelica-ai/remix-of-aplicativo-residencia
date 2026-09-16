import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Loader2, LogOut, MoreVertical, RefreshCw, Shield, Target, Trophy, UserMinus, Users, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { CATALOGO_EMBLEMAS_LIGA, LigaEmblema, LigaEmblemaTexto, PatenteLigaSelo } from "@/components/LigaEmblema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { exigirLogin, useSessao } from "@/lib/auth";
import {
  aprovarPedidoLiga,
  buscarConquistasLigantes,
  buscarMinhaEquipe,
  buscarPedidosEntradaLiga,
  buscarStatsMembrosLiga,
  configurarEntradaDiretaLiga,
  criarEquipe,
  definirViceLiga,
  entrarEquipe,
  recusarPedidoLiga,
  regenerarCodigoEquipe,
  removerMembroEquipe,
  removerViceLiga,
  sairEquipe,
  solicitarEntradaLiga,
  transferirLiderancaLiga,
  type LiganteConquistas,
  type LinhaMembroLiga,
  type MembroEquipe,
  type PedidoEntradaLiga,
} from "@/lib/equipes";

export const Route = createFileRoute("/equipes")({
  beforeLoad: exigirLogin,
  head: () => ({ meta: [{ title: "Liga — ResidênciaPro" }] }),
  component: EquipesPage,
});

function EquipesPage() {
  const { usuario } = useSessao();
  const qc = useQueryClient();
  const [nome, setNome] = useState("");
  const [codigo, setCodigo] = useState("");

  const equipe = useQuery({ queryKey: ["minha-equipe", usuario?.id], queryFn: () => buscarMinhaEquipe(usuario!.id), enabled: !!usuario });
  const statsMembros = useQuery({ queryKey: ["liga-membros-stats", usuario?.id], queryFn: buscarStatsMembrosLiga, enabled: !!usuario && !!equipe.data });
  const conquistasLigantes = useQuery({ queryKey: ["liga-ligantes-conquistas", usuario?.id], queryFn: buscarConquistasLigantes, enabled: !!usuario && !!equipe.data });
  const pedidos = useQuery({ queryKey: ["liga-pedidos", usuario?.id], queryFn: buscarPedidosEntradaLiga, enabled: !!usuario && equipe.data?.souAdminLiga === true });

  const atualizar = () => {
    qc.invalidateQueries({ queryKey: ["minha-equipe", usuario?.id] });
    qc.invalidateQueries({ queryKey: ["liga-membros-stats", usuario?.id] });
    qc.invalidateQueries({ queryKey: ["liga-ligantes-conquistas", usuario?.id] });
    qc.invalidateQueries({ queryKey: ["liga-pedidos", usuario?.id] });
    qc.invalidateQueries({ queryKey: ["ranking-ligas"] });
  };

  const criar = useMutation({ mutationFn: () => criarEquipe(nome), onSuccess: atualizar });
  const entrar = useMutation({ mutationFn: () => entrarEquipe(codigo), onSuccess: atualizar });
  const solicitar = useMutation({ mutationFn: () => solicitarEntradaLiga(codigo), onSuccess: atualizar });
  const aprovarPedido = useMutation({ mutationFn: aprovarPedidoLiga, onSuccess: atualizar });
  const recusarPedido = useMutation({ mutationFn: recusarPedidoLiga, onSuccess: atualizar });
  const sair = useMutation({ mutationFn: sairEquipe, onSuccess: atualizar });
  const novoCodigo = useMutation({ mutationFn: regenerarCodigoEquipe, onSuccess: atualizar });
  const remover = useMutation({ mutationFn: removerMembroEquipe, onSuccess: atualizar });
  const definirVice = useMutation({ mutationFn: definirViceLiga, onSuccess: atualizar });
  const removerVice = useMutation({ mutationFn: removerViceLiga, onSuccess: atualizar });
  const transferir = useMutation({ mutationFn: transferirLiderancaLiga, onSuccess: atualizar });
  const entradaDireta = useMutation({ mutationFn: configurarEntradaDiretaLiga, onSuccess: atualizar });

  if (equipe.isLoading) {
    return <AppShell titulo="Liga"><p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Carregando Liga…</p></AppShell>;
  }

  if (equipe.isError) {
    const mensagem = equipe.error instanceof Error ? equipe.error.message : "Não foi possível carregar a Liga.";
    return (
      <AppShell titulo="Liga" descricao="Não foi possível carregar a estrutura da Liga.">
        <section className="rounded-2xl border border-destructive/40 bg-destructive/5 p-5">
          <p className="text-sm font-semibold text-destructive">Erro ao carregar a Liga</p>
          <p className="mt-2 break-words text-xs text-muted-foreground">{mensagem}</p>
          <button
            type="button"
            onClick={() => equipe.refetch()}
            className="mt-4 rounded-xl border border-border/70 px-4 py-2 text-sm font-semibold"
          >
            Tentar novamente
          </button>
        </section>
      </AppShell>
    );
  }

  if (!equipe.data) {
    return (
      <AppShell titulo="Liga" descricao="Crie uma Liga, entre por código ou solicite entrada para estudar com seus amigos.">
        <div className="space-y-4">
          <section className="rounded-2xl border border-primary/40 bg-primary/10 p-5">
            <Users className="size-6 text-primary" />
            <h2 className="mt-3 font-display text-lg font-semibold">Entre para uma Liga</h2>
            <p className="mt-1 text-sm text-muted-foreground">A Liga reúne seus amigos, mostra os ligantes e libera emblemas individuais conforme cada um responde questões.</p>
          </section>

          <section className="rounded-2xl border border-border/60 bg-card p-4">
            <p className="text-sm font-semibold">Criar Liga</p>
            <input value={nome} onChange={(e) => setNome(e.target.value)} maxLength={40} placeholder="Nome da Liga" className="mt-3 w-full rounded-xl border border-border/70 bg-surface px-3 py-2.5 text-sm outline-none" />
            <button disabled={nome.trim().length < 2 || criar.isPending} onClick={() => criar.mutate()} className="mt-3 w-full rounded-xl bg-primary py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50">Criar minha Liga</button>
            {criar.isError ? <p className="mt-2 text-xs text-destructive">{(criar.error as Error).message}</p> : null}
          </section>

          <section className="rounded-2xl border border-border/60 bg-card p-4">
            <p className="text-sm font-semibold">Tenho um código</p>
            <input value={codigo} onChange={(e) => setCodigo(e.target.value.toUpperCase())} maxLength={8} placeholder="Ex.: A1B2C3D4" className="mt-3 w-full rounded-xl border border-border/70 bg-surface px-3 py-2.5 text-sm uppercase tracking-widest outline-none" />
            <button disabled={codigo.trim().length < 4 || entrar.isPending} onClick={() => entrar.mutate()} className="mt-3 w-full rounded-xl border border-primary/60 py-2.5 text-sm font-semibold text-primary disabled:opacity-50">Entrar direto na Liga</button>
            <button disabled={codigo.trim().length < 4 || solicitar.isPending} onClick={() => solicitar.mutate()} className="mt-2 w-full rounded-xl bg-surface py-2.5 text-sm font-semibold text-foreground disabled:opacity-50">Solicitar entrada</button>
            {entrar.isError ? <p className="mt-2 text-xs text-destructive">{(entrar.error as Error).message}</p> : null}
            {solicitar.isError ? <p className="mt-2 text-xs text-destructive">{(solicitar.error as Error).message}</p> : null}
            {solicitar.isSuccess ? <p className="mt-2 text-xs text-primary">Pedido enviado. Aguarde aprovação do líder ou vice-líder.</p> : null}
          </section>
        </div>
      </AppShell>
    );
  }

  const e = equipe.data;
  const totalQuestoesSemana = (statsMembros.data ?? []).reduce((s, m) => s + m.total, 0);
  const meuProgresso = (conquistasLigantes.data ?? []).find((l) => l.userId === usuario?.id);

  return (
    <AppShell titulo={e.nome} descricao={`${e.membros.length}/12 ligantes na sua Liga`}>
      <div className="space-y-4">
        <section className="rounded-2xl border border-primary/40 bg-primary/10 p-4">
          <div className="flex items-center gap-3">
            <span className="flex size-11 items-center justify-center rounded-2xl bg-primary/15 text-primary"><Shield className="size-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-primary">Sua Liga</p>
              <h2 className="truncate font-display text-xl font-bold">{e.nome}</h2>
              <p className="mt-0.5 text-xs text-muted-foreground">{totalQuestoesSemana} questões feitas pelos ligantes nesta semana</p>
            </div>
            <div className="text-right">
              <PatenteLigaSelo codigo={e.patente.codigo} nome={e.patente.nome} />
              <p className="mt-1 text-[10px] font-semibold text-muted-foreground">{e.xp.toLocaleString("pt-BR")} XP coletivo</p>
            </div>
          </div>
        </section>

        {meuProgresso ? <ProgressoDiario ligante={meuProgresso} /> : null}

        {e.souAdminLiga ? (
          <ConfiguracoesLiga
            entradaDireta={e.entradaDireta}
            carregando={entradaDireta.isPending}
            erro={entradaDireta.isError ? (entradaDireta.error as Error).message : null}
            onAlterar={(valor) => entradaDireta.mutate(valor)}
          />
        ) : null}

        {e.souAdminLiga ? <PedidosEntrada pedidos={pedidos.data ?? []} carregando={pedidos.isLoading} onAprovar={(id) => aprovarPedido.mutate(id)} onRecusar={(id) => recusarPedido.mutate(id)} /> : null}

        <section className="rounded-2xl border border-primary/40 bg-primary/10 p-4">
          <div className="flex items-center gap-2"><Shield className="size-5 text-primary" /><p className="font-semibold">Código da Liga</p></div>
          <div className="mt-3 flex items-center gap-2">
            <code className="flex-1 rounded-xl bg-surface px-4 py-3 text-center text-lg font-bold tracking-[.25em]">{e.codigoConvite}</code>
            <button onClick={() => navigator.clipboard.writeText(e.codigoConvite)} className="rounded-xl border border-border/60 p-3" aria-label="Copiar código"><Copy className="size-4" /></button>
            {e.souAdminLiga ? <button onClick={() => novoCodigo.mutate()} className="rounded-xl border border-border/60 p-3" aria-label="Novo código"><RefreshCw className="size-4" /></button> : null}
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">Compartilhe este código com seus amigos. A regra de entrada é definida nas configurações da Liga.</p>
        </section>

        <MembrosLiga
          membros={e.membros}
          stats={statsMembros.data ?? []}
          conquistas={conquistasLigantes.data ?? []}
          carregandoStats={statsMembros.isLoading || conquistasLigantes.isLoading}
          souLider={e.souLider}
          souAdminLiga={e.souAdminLiga}
          usuarioId={usuario?.id ?? ""}
          onRemover={(id) => remover.mutate(id)}
          onDefinirVice={(id) => definirVice.mutate(id)}
          onRemoverVice={() => removerVice.mutate()}
          onTransferir={(id) => transferir.mutate(id)}
        />

        <ConquistasLigantes ligantes={conquistasLigantes.data ?? []} carregando={conquistasLigantes.isLoading} />

        {!e.souLider ? <button onClick={() => sair.mutate()} className="flex w-full items-center justify-center gap-2 rounded-xl border border-destructive/40 py-3 text-sm font-semibold text-destructive"><LogOut className="size-4" /> Sair da Liga</button> : null}
      </div>
    </AppShell>
  );
}

function ConfiguracoesLiga({ entradaDireta, carregando, erro, onAlterar }: { entradaDireta: boolean; carregando: boolean; erro: string | null; onAlterar: (valor: boolean) => void }) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card p-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="flex items-center gap-2 text-sm font-semibold"><Shield className="size-4 text-primary" /> Configurações da Liga</p>
          <p className="mt-1 text-xs text-muted-foreground">Escolha se o código permite entrada direta ou se todo novo ligante precisa ser aprovado.</p>
        </div>
        {carregando ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : null}
      </div>
      <div className="mt-3 grid grid-cols-2 gap-2">
        <button onClick={() => onAlterar(true)} disabled={carregando} className={`rounded-xl border px-3 py-2 text-xs font-semibold ${entradaDireta ? "border-primary/50 bg-primary/10 text-primary" : "border-border/60 bg-surface text-muted-foreground"}`}>Entrada direta</button>
        <button onClick={() => onAlterar(false)} disabled={carregando} className={`rounded-xl border px-3 py-2 text-xs font-semibold ${!entradaDireta ? "border-primary/50 bg-primary/10 text-primary" : "border-border/60 bg-surface text-muted-foreground"}`}>Exigir aprovação</button>
      </div>
      <p className="mt-2 text-[11px] text-muted-foreground">Atual: {entradaDireta ? "quem tiver o código entra na hora" : "quem tiver o código precisa solicitar entrada"}.</p>
      {erro ? <p className="mt-2 text-xs text-destructive">{erro}</p> : null}
    </section>
  );
}

function PedidosEntrada({ pedidos, carregando, onAprovar, onRecusar }: { pedidos: PedidoEntradaLiga[]; carregando: boolean; onAprovar: (id: string) => void; onRecusar: (id: string) => void }) {
  if (!carregando && !pedidos.length) return null;
  return (
    <section className="rounded-2xl border border-border/60 bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2"><Users className="size-5 text-primary" /><p className="font-semibold">Pedidos para entrar</p></div>
        {carregando ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : null}
      </div>
      <div className="space-y-2">
        {pedidos.map((p) => (
          <div key={p.id} className="flex items-center gap-3 rounded-xl bg-surface px-3 py-2.5">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary"><Users className="size-4" /></span>
            <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold">{p.nome}</p><p className="text-[11px] text-muted-foreground">Quer entrar na Liga</p></div>
            <button onClick={() => onAprovar(p.id)} className="rounded-full border border-primary/40 p-2 text-primary" aria-label="Aprovar pedido"><Check className="size-4" /></button>
            <button onClick={() => onRecusar(p.id)} className="rounded-full border border-destructive/40 p-2 text-destructive" aria-label="Recusar pedido"><X className="size-4" /></button>
          </div>
        ))}
      </div>
    </section>
  );
}

function MembrosLiga({
  membros,
  stats,
  conquistas,
  carregandoStats,
  souLider,
  souAdminLiga,
  usuarioId,
  onRemover,
  onDefinirVice,
  onRemoverVice,
  onTransferir,
}: {
  membros: MembroEquipe[];
  stats: LinhaMembroLiga[];
  conquistas: LiganteConquistas[];
  carregandoStats: boolean;
  souLider: boolean;
  souAdminLiga: boolean;
  usuarioId?: string;
  onRemover: (id: string) => void;
  onDefinirVice: (id: string) => void;
  onRemoverVice: () => void;
  onTransferir: (id: string) => void;
}) {
  const statsPorId = new Map(stats.map((linha) => [linha.userId, linha]));
  const conquistasPorId = new Map(conquistas.map((linha) => [linha.userId, linha]));

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <p className="text-sm font-semibold">Ligantes</p>
        {carregandoStats ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : null}
      </div>
      <div className="space-y-2">
        {membros.map((membro) => {
          const semanal = statsPorId.get(membro.userId);
          const progresso = conquistasPorId.get(membro.userId);
          const podeGerenciar = souAdminLiga && membro.papel !== "lider" && membro.userId !== usuarioId;
          return (
            <div key={membro.userId} className="rounded-xl bg-surface px-3 py-2.5">
              <div className="flex items-center gap-3">
                <FotoPerfil nome={membro.nome} url={membro.avatarUrl} />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{membro.nome}</p>
                  <p className="text-[10px] uppercase tracking-wide text-muted-foreground">
                    {membro.papel === "lider" ? "Líder" : membro.papel === "vice" ? "Vice-líder" : "Ligante"}
                    {progresso ? ` · nível ${progresso.nivel}` : ""}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-display text-base font-bold">{progresso?.xp ?? 0} XP</p>
                  <p className="text-[10px] text-muted-foreground">{progresso?.totalGeral ?? 0} questões</p>
                </div>
              </div>
              <div className="mt-2 flex items-center justify-between gap-2 pl-11 text-[11px] text-muted-foreground">
                <span>{semanal?.total ?? 0} esta semana · {progresso?.conquistas.length ?? 0}/8 broches</span>
                <div className="flex items-center gap-1">
                  {(progresso?.conquistas ?? []).slice(-4).map((conquista) => (
                    <LigaEmblema key={`${membro.userId}-${conquista.codigo}`} codigo={conquista.codigo} titulo={conquista.titulo} tamanho="sm" />
                  ))}
                  {podeGerenciar ? (
                    <div className="ml-1 flex flex-wrap justify-end gap-1">
                      {souLider && membro.papel !== "vice" ? <button onClick={() => onDefinirVice(membro.userId)} className="rounded-full border border-border/60 px-2 py-1 text-[10px] font-semibold text-primary">Tornar vice</button> : null}
                      {souLider && membro.papel === "vice" ? <button onClick={onRemoverVice} className="rounded-full border border-border/60 px-2 py-1 text-[10px] font-semibold text-muted-foreground">Remover vice</button> : null}
                      {souLider ? <button onClick={() => onTransferir(membro.userId)} className="rounded-full border border-border/60 px-2 py-1 text-[10px] font-semibold text-muted-foreground">Transferir líder</button> : null}
                      <button onClick={() => onRemover(membro.userId)} className="rounded-full border border-destructive/40 px-2 py-1 text-[10px] font-semibold text-destructive"><UserMinus className="mr-1 inline size-3" />Remover</button>
                    </div>
                  ) : <MoreVertical className="size-3 opacity-40" />}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function ProgressoDiario({ ligante }: { ligante: LiganteConquistas }) {
  const atual = Math.min(ligante.questoesHoje, ligante.metaDiaria);
  const percentual = Math.min(100, Math.round((atual / Math.max(ligante.metaDiaria, 1)) * 100));
  return (
    <section className="rounded-2xl border border-primary/30 bg-card p-4">
      <div className="flex items-center gap-3">
        <span className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary"><Target className="size-5" /></span>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-semibold">Meta diária</p>
            <span className="text-[11px] font-semibold text-primary">{ligante.questoesHoje}/{ligante.metaDiaria} · +25 XP</span>
          </div>
          <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface">
            <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${percentual}%` }} />
          </div>
          <div className="mt-2 flex items-center justify-between text-[10px] text-muted-foreground">
            <span>{ligante.questoesHoje >= ligante.metaDiaria ? "Meta concluída hoje!" : `Faltam ${ligante.metaDiaria - ligante.questoesHoje} questões`}</span>
            <span>Nível {ligante.nivel} · {ligante.xpNoNivel}/{ligante.xpProximoNivel} XP</span>
          </div>
        </div>
      </div>
    </section>
  );
}

function ConquistasLigantes({ ligantes, carregando }: { ligantes: LiganteConquistas[]; carregando: boolean }) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card p-3">
      <div className="flex items-center justify-between gap-2 px-1">
        <div className="flex items-center gap-2"><Trophy className="size-4 text-primary" /><p className="text-sm font-semibold">Broches dos ligantes</p></div>
        {carregando ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : <span className="text-[10px] text-muted-foreground">Toque para expandir</span>}
      </div>
      <div className="mt-2 space-y-1.5">
        {ligantes.map((ligante) => <LiganteEmblemas key={ligante.userId} ligante={ligante} />)}
      </div>
    </section>
  );
}

function LiganteEmblemas({ ligante }: { ligante: LiganteConquistas }) {
  const conquistados = new Set(ligante.conquistas.map((c) => c.codigo));
  return (
    <details className="group rounded-xl border border-border/50 bg-surface">
      <summary className="flex cursor-pointer list-none items-center gap-2 px-3 py-2">
        <FotoPerfil nome={ligante.nome} url={ligante.avatarUrl} tamanho="sm" />
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold">{ligante.nome}</p>
          <p className="text-[9px] text-muted-foreground">Nível {ligante.nivel} · {ligante.xp} XP</p>
        </div>
        <div className="flex -space-x-1">
          {ligante.conquistas.slice(-3).map((c) => <LigaEmblema key={c.codigo} codigo={c.codigo} titulo={c.titulo} tamanho="sm" />)}
        </div>
        <span className="ml-1 rounded-full bg-primary/10 px-2 py-1 text-[9px] font-semibold text-primary">{ligante.conquistas.length}/8</span>
      </summary>
      <div className="grid grid-cols-2 gap-1.5 border-t border-border/50 p-2 sm:grid-cols-4">
        {CATALOGO_EMBLEMAS_LIGA.map((emblema) => {
          const desbloqueado = conquistados.has(emblema.codigo);
          return (
            <LigaEmblemaTexto
              key={`${ligante.userId}-${emblema.codigo}`}
              codigo={emblema.codigo}
              titulo={emblema.titulo}
              descricao={emblema.criterio}
              progresso={`${Math.min(ligante.totalGeral, emblema.meta)}/${emblema.meta}`}
              desbloqueado={desbloqueado}
            />
          );
        })}
      </div>
    </details>
  );
}

function FotoPerfil({ nome, url, tamanho = "md" }: { nome: string; url?: string | null; tamanho?: "sm" | "md" }) {
  const iniciais = nome.split(/\s+/).filter(Boolean).slice(0, 2).map((parte) => parte[0]?.toUpperCase()).join("") || "E";
  return (
    <Avatar className={tamanho === "sm" ? "size-7" : "size-9"}>
      {url ? <AvatarImage src={url} alt={`Foto de ${nome}`} /> : null}
      <AvatarFallback className="bg-primary/15 text-[10px] font-semibold text-primary">{iniciais}</AvatarFallback>
    </Avatar>
  );
}
