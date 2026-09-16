import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, CheckCircle2, ChevronDown, ChevronRight, Crown, Loader2, Medal, Trophy, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useSessao } from "@/lib/auth";
import { buscarMeuProgresso, type ProgressoArea, type ProgressoTema } from "@/lib/banco";
import { buscarRankingEquipes, type LinhaRankingEquipe } from "@/lib/equipes";
import { buscarRankingQuestoesGeralSeguro, buscarRankingQuestoesHojeSeguro } from "@/lib/ranking.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/ranking")({
  head: () => ({
    meta: [
      { title: "Ranking — ResidênciaPro" },
      { name: "description", content: "Veja seu progresso, ranking de usuários e rankings de Ligas." },
    ],
  }),
  component: RankingPage,
});

type Modo = "progresso" | "hoje" | "geral" | "liga_semana" | "liga_geral";

function RankingPage() {
  const { usuario } = useSessao();
  const buscarHoje = useServerFn(buscarRankingQuestoesHojeSeguro);
  const buscarGeral = useServerFn(buscarRankingQuestoesGeralSeguro);
  const [modo, setModo] = useState<Modo>("progresso");

  const progresso = useQuery({ queryKey: ["meu-progresso", usuario?.id], queryFn: () => buscarMeuProgresso(usuario!.id), enabled: !!usuario && modo === "progresso" });
  const hoje = useQuery({ queryKey: ["ranking-questoes", "hoje"], queryFn: () => buscarHoje(), enabled: !!usuario && modo === "hoje" });
  const geral = useQuery({ queryKey: ["ranking-questoes", "geral"], queryFn: () => buscarGeral(), enabled: !!usuario && modo === "geral" });
  const ligaSemana = useQuery({ queryKey: ["ranking-ligas", "semana"], queryFn: () => buscarRankingEquipes("semana"), enabled: !!usuario && modo === "liga_semana" });
  const ligaGeral = useQuery({ queryKey: ["ranking-ligas", "geral"], queryFn: () => buscarRankingEquipes("geral"), enabled: !!usuario && modo === "liga_geral" });

  return (
    <AppShell
      titulo={modo === "progresso" ? "Meu Progresso" : modo.startsWith("liga") ? "Ranking de Ligas" : "Ranking"}
      descricao={
        modo === "progresso"
          ? "Acompanhe somente as áreas, temas e assuntos em que você já respondeu questões."
          : modo === "liga_semana"
            ? "Veja quais Ligas mais responderam questões nesta semana."
            : modo === "liga_geral"
              ? "Veja quais Ligas mais pontuaram desde que foram criadas."
              : "Quem mais respondeu questões, hoje e no total, com a taxa de acerto de cada um."
      }
    >
      {!usuario ? (
        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <p className="text-sm text-muted-foreground">Entre na sua conta para ver o ranking.</p>
          <Link to="/auth" className="mt-4 block rounded-xl bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground">Entrar ou criar conta</Link>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-1 rounded-2xl border border-border/60 bg-surface p-1 sm:grid-cols-5">
            <AbaRanking ativa={modo === "progresso"} onClick={() => setModo("progresso")}>Meu Progresso</AbaRanking>
            <AbaRanking ativa={modo === "hoje"} onClick={() => setModo("hoje")}>Hoje</AbaRanking>
            <AbaRanking ativa={modo === "geral"} onClick={() => setModo("geral")}>Geral</AbaRanking>
            <AbaRanking ativa={modo === "liga_semana"} onClick={() => setModo("liga_semana")}>Ligas semana</AbaRanking>
            <AbaRanking ativa={modo === "liga_geral"} onClick={() => setModo("liga_geral")}>Ligas geral</AbaRanking>
          </div>

          {modo === "progresso" ? (
            <MeuProgressoConteudo carregando={progresso.isLoading} erro={progresso.isError} dados={progresso.data} />
          ) : modo === "liga_semana" ? (
            <RankingLigasConteudo tipo="semana" carregando={ligaSemana.isLoading} linhas={ligaSemana.data ?? []} />
          ) : modo === "liga_geral" ? (
            <RankingLigasConteudo tipo="geral" carregando={ligaGeral.isLoading} linhas={ligaGeral.data ?? []} />
          ) : (
            <RankingUsuariosConteudo modo={modo} usuarioId={usuario.id} carregando={modo === "hoje" ? hoje.isLoading : geral.isLoading} linhas={(modo === "hoje" ? hoje.data : geral.data) ?? []} />
          )}
        </div>
      )}
    </AppShell>
  );
}

function AbaRanking({ ativa, onClick, children }: { ativa: boolean; onClick: () => void; children: React.ReactNode }) {
  return <button onClick={onClick} className={cn("rounded-xl px-2 py-2 text-xs font-semibold", ativa ? "bg-primary text-primary-foreground" : "text-muted-foreground")}>{children}</button>;
}

function RankingUsuariosConteudo({ modo, usuarioId, carregando, linhas }: { modo: "hoje" | "geral"; usuarioId: string; carregando: boolean; linhas: any[] }) {
  return (
    <>
      <div className="rounded-2xl border border-primary/40 bg-primary/10 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-primary"><Trophy className="size-4" />{modo === "hoje" ? "Quem mais respondeu hoje" : "Quem mais respondeu no total"}</p>
        <p className="mt-1 text-xs text-muted-foreground">Considera as questões respondidas por todos os usuários do app, com a respectiva taxa de acerto.</p>
      </div>

      {carregando ? <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Carregando ranking…</p> : null}

      <div className="space-y-2">
        {linhas.map((l, i) => (
          <div key={l.user_id} className={cn("flex items-center gap-3 rounded-2xl border p-3.5", l.user_id === usuarioId ? "border-primary/60 bg-primary/10" : "border-border/60 bg-card")}>
            <PosicaoRanking posicao={i} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{l.nome_usuario}</p>
              <p className="text-[11px] text-muted-foreground">{l.total} questão(ões) · {l.taxa}% de acerto</p>
            </div>
            <span className="font-display text-base font-semibold text-primary">{l.acertos}</span>
          </div>
        ))}
        {!carregando && !linhas.length ? <p className="rounded-2xl border border-border/60 bg-card p-5 text-sm text-muted-foreground">{modo === "hoje" ? "Ninguém respondeu questões hoje ainda." : "Ninguém respondeu questões ainda."}</p> : null}
      </div>
    </>
  );
}

function RankingLigasConteudo({ tipo, carregando, linhas }: { tipo: "semana" | "geral"; carregando: boolean; linhas: LinhaRankingEquipe[] }) {
  return (
    <>
      <div className="rounded-2xl border border-primary/40 bg-primary/10 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-primary"><Users className="size-4" />{tipo === "semana" ? "Ranking semanal de Ligas" : "Ranking geral de Ligas"}</p>
        <p className="mt-1 text-xs text-muted-foreground">
          {tipo === "semana" ? "Soma as questões respondidas pelos membros de cada Liga nesta semana." : "Soma todas as questões respondidas pelos membros desde que a Liga foi criada."}
        </p>
      </div>

      {carregando ? <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Carregando ranking de Ligas…</p> : null}

      <div className="space-y-2">
        {linhas.map((l, i) => (
          <div key={l.equipeId} className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-3.5">
            <PosicaoRanking posicao={i} />
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{l.nome}</p>
              <p className="text-[11px] text-muted-foreground">{l.membros} ligante(s) · {l.acertos} acertos · {l.taxa}%</p>
            </div>
            <div className="text-right">
              <p className="font-display text-base font-semibold text-primary">{l.total}</p>
              <p className="text-[10px] uppercase tracking-wide text-muted-foreground">pontos</p>
            </div>
          </div>
        ))}
        {!carregando && !linhas.length ? <p className="rounded-2xl border border-border/60 bg-card p-5 text-sm text-muted-foreground">Nenhuma Liga pontuou ainda.</p> : null}
      </div>
    </>
  );
}

function PosicaoRanking({ posicao }: { posicao: number }) {
  return (
    <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold", posicao === 0 ? "bg-warning/20 text-warning" : posicao < 3 ? "bg-primary/20 text-primary" : "bg-surface text-muted-foreground")}>
      {posicao === 0 ? <Crown className="size-4" /> : posicao < 3 ? <Medal className="size-4" /> : posicao + 1}
    </span>
  );
}

function MeuProgressoConteudo({ carregando, erro, dados }: { carregando: boolean; erro: boolean; dados: Awaited<ReturnType<typeof buscarMeuProgresso>> | undefined }) {
  if (carregando) return <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Carregando seu progresso…</p>;

  if (erro) return <p className="rounded-2xl border border-destructive/30 bg-destructive/5 p-4 text-sm text-destructive">Não foi possível carregar seu progresso agora.</p>;

  if (!dados?.feitas) {
    return (
      <div className="rounded-3xl border border-border/60 bg-card p-6 text-center">
        <span className="mx-auto flex size-12 items-center justify-center rounded-2xl bg-primary/15 text-primary"><BarChart3 className="size-6" /></span>
        <h2 className="mt-4 font-display text-base font-semibold">Seu progresso começa aqui</h2>
        <p className="mx-auto mt-2 max-w-sm text-sm text-muted-foreground">Quando você responder questões, as áreas, temas e assuntos estudados aparecerão automaticamente.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <ResumoProgresso rotulo="Questões feitas" valor={dados.feitas.toLocaleString("pt-BR")} />
        <ResumoProgresso rotulo="Assuntos estudados" valor={dados.assuntosEstudados.toLocaleString("pt-BR")} />
        <ResumoProgresso rotulo="Taxa de acerto" valor={`${dados.taxaAcerto}%`} />
        <ResumoProgresso rotulo="Áreas estudadas" valor={dados.areasEstudadas.toLocaleString("pt-BR")} />
      </div>

      <div className="rounded-2xl border border-primary/40 bg-primary/10 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-primary"><BarChart3 className="size-4" /> Conteúdos que você já estudou</p>
        <p className="mt-1 text-xs text-muted-foreground">O que você nunca respondeu não aparece aqui. Cada questão conta apenas uma vez.</p>
      </div>

      <div className="space-y-3">{dados.areas.map((area) => <AreaProgresso key={area.id} area={area} />)}</div>
    </div>
  );
}

function ResumoProgresso({ rotulo, valor }: { rotulo: string; valor: string }) {
  return <div className="rounded-2xl border border-border/60 bg-card p-4"><p className="font-display text-xl font-semibold text-primary">{valor}</p><p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">{rotulo}</p></div>;
}

function AreaProgresso({ area }: { area: ProgressoArea }) {
  const [aberta, setAberta] = useState(false);
  return (
    <div className="overflow-hidden rounded-2xl border border-border/60 bg-card">
      <button type="button" onClick={() => setAberta((v) => !v)} className="flex w-full items-center gap-3 p-4 text-left">
        {aberta ? <ChevronDown className="size-4 shrink-0 text-primary" /> : <ChevronRight className="size-4 shrink-0 text-primary" />}
        <div className="min-w-0 flex-1"><p className="truncate font-display text-sm font-semibold">{area.nome}</p><p className="mt-0.5 text-xs text-muted-foreground">{area.feitas.toLocaleString("pt-BR")} feitas · {area.taxaAcerto}% de acerto</p></div>
        <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">{area.feitas.toLocaleString("pt-BR")}</span>
      </button>
      {aberta ? <div className="space-y-2 border-t border-border/60 p-3">{area.temas.map((tema) => <TemaProgresso key={`${area.id}-${tema.id}`} tema={tema} />)}</div> : null}
    </div>
  );
}

function TemaProgresso({ tema }: { tema: ProgressoTema }) {
  const [aberto, setAberto] = useState(false);
  return (
    <div className="rounded-xl border border-border/50 bg-surface">
      <button type="button" onClick={() => setAberto((v) => !v)} className="flex w-full items-center gap-3 px-3 py-3 text-left">
        {aberto ? <ChevronDown className="size-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="size-4 shrink-0 text-muted-foreground" />}
        <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{tema.nome}</p><p className="text-[11px] text-muted-foreground">{tema.feitas.toLocaleString("pt-BR")} feitas · {tema.taxaAcerto}% de acerto</p></div>
      </button>

      {aberto ? (
        <div className="space-y-1 border-t border-border/50 p-2">
          {tema.assuntos.map((assunto) => (
            <div key={`${tema.id}-${assunto.id}`} className="flex items-center gap-3 rounded-lg px-3 py-2.5">
              <CheckCircle2 className="size-4 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm">{assunto.nome}</p>
                <p className="text-[11px] text-muted-foreground">{assunto.acertos} acertos · {assunto.erros} erros · {assunto.taxaAcerto}%</p>
              </div>
              <div className="text-right"><p className="font-display text-sm font-semibold">{assunto.feitas.toLocaleString("pt-BR")}</p><p className="text-[10px] uppercase tracking-wide text-muted-foreground">feitas</p></div>
            </div>
          ))}
        </div>
      ) : null}
    </div>
  );
}
