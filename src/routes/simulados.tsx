import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Check,
  Clock3,
  Crown,
  FileCheck2,
  GraduationCap,
  Loader2,
  LockKeyhole,
  Medal,
  RotateCcw,
  Trophy,
  X,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { usePlano } from "@/hooks/usePlano";
import { exigirLogin } from "@/lib/auth";
import {
  abrirSimuladoEnamed,
  buscarRankingSimulado,
  buscarResultadoSimulado,
  finalizarProvaOficial,
  estruturaSimuladosPendente,
  limparRespostaSimulado,
  listarSimuladosEnamed,
  salvarRespostaSimulado,
  type QuestaoSimulado,
  type ResultadoQuestao,
  type SimuladoCatalogo,
} from "@/lib/simulados-enamed";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/simulados")({
  beforeLoad: exigirLogin,
  head: () => ({
    meta: [
      { title: "Simulados ENAMED — ResidênciaPro" },
      { name: "description", content: "Simulados semanais e provas oficiais do ENAMED." },
    ],
  }),
  component: SimuladosEnamedPage,
});

function SimuladosEnamedPage() {
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const { premium } = usePlano();
  const catalogo = useQuery({
    queryKey: ["simulados-enamed"],
    queryFn: listarSimuladosEnamed,
    retry: false,
  });
  const simulado = catalogo.data?.find((s) => s.id === selecionado);

  if (selecionado && simulado) {
    return (
      <AppShell titulo="Simulados ENAMED">
        <button onClick={() => setSelecionado(null)} className="mb-4 flex items-center gap-2 text-sm font-semibold text-primary">
          <ArrowLeft className="size-4" /> Voltar aos simulados
        </button>
        {simulado.situacao === "resultado" ? (
          <Resultado simulado={simulado} />
        ) : simulado.situacao === "aberto" ? (
          <Aplicacao simulado={simulado} aoEncerrar={() => catalogo.refetch()} />
        ) : (
          <Indisponivel simulado={simulado} />
        )}
      </AppShell>
    );
  }

  return (
    <AppShell titulo="Simulados ENAMED" descricao="Treine toda semana no formato da prova e acompanhe sua evolução.">
      <Cabecalho />
      {catalogo.isLoading ? (
        <p className="mt-6 flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Carregando simulados…</p>
      ) : catalogo.isError ? (
        <section className="mt-5 rounded-2xl border border-warning/40 bg-warning/5 p-4">
          <p className="font-semibold text-warning">
            {estruturaSimuladosPendente(catalogo.error) ? "Simulados em configuração" : "Não foi possível carregar os simulados"}
          </p>
          <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{(catalogo.error as Error).message}</p>
          <button onClick={() => catalogo.refetch()} className="mt-3 rounded-xl border border-border/60 px-4 py-2 text-sm font-semibold">Verificar novamente</button>
        </section>
      ) : (
        <Catalogo simulados={catalogo.data ?? []} premium={premium} onAbrir={setSelecionado} />
      )}
    </AppShell>
  );
}

function Cabecalho() {
  return (
    <section className="overflow-hidden rounded-3xl border border-primary/40 bg-gradient-to-br from-primary/20 via-card to-card p-5">
      <span className="flex size-12 items-center justify-center rounded-2xl bg-primary/20 text-primary"><GraduationCap className="size-6" /></span>
      <p className="mt-4 text-xs font-semibold uppercase tracking-[0.2em] text-primary">Preparação nacional</p>
      <h2 className="mt-1 font-display text-2xl font-bold">Seu ENAMED começa aqui</h2>
      <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
        Uma prova inédita por semana, com 100 questões, janela livre e resultado liberado para todos ao mesmo tempo.
      </p>
    </section>
  );
}

function Catalogo({ simulados, premium, onAbrir }: { simulados: SimuladoCatalogo[]; premium: boolean; onAbrir: (id: string) => void }) {
  const semanais = simulados.filter((s) => s.tipo === "semanal");
  const oficiais = simulados.filter((s) => s.tipo === "oficial");
  return (
    <div className="mt-6 space-y-7">
      <Grupo titulo="ENAMED da Semana" vazio="O primeiro simulado semanal está sendo preparado." simulados={semanais} premium={premium} onAbrir={onAbrir} />
      <Grupo titulo="Provas oficiais" vazio="As provas oficiais aparecerão aqui após a revisão do caderno e do gabarito." simulados={oficiais} premium={premium} onAbrir={onAbrir} />
    </div>
  );
}

function Grupo({ titulo, vazio, simulados, premium, onAbrir }: { titulo: string; vazio: string; simulados: SimuladoCatalogo[]; premium: boolean; onAbrir: (id: string) => void }) {
  return (
    <section>
      <h2 className="font-display text-lg font-semibold">{titulo}</h2>
      <div className="mt-3 space-y-3">
        {simulados.length ? simulados.map((s) => <CardSimulado key={s.id} simulado={s} premium={premium} onAbrir={() => onAbrir(s.id)} />) : (
          <div className="rounded-2xl border border-dashed border-border/70 bg-card p-5 text-sm text-muted-foreground">{vazio}</div>
        )}
      </div>
    </section>
  );
}

function CardSimulado({ simulado: s, premium, onAbrir }: { simulado: SimuladoCatalogo; premium: boolean; onAbrir: () => void }) {
  const bloqueadoPlano = !s.gratuito && !premium;
  const rotulo = bloqueadoPlano ? "Exclusivo Premium" : s.situacao === "aberto" ? "Responder agora" : s.situacao === "resultado" ? "Ver resultado" : s.situacao === "agendado" ? "Ainda não liberado" : "Aguardar gabarito";
  const data = new Date(s.abreEm).toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "short" });
  return (
    <article className="rounded-2xl border border-border/60 bg-card p-4">
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">{s.tipo === "semanal" ? <CalendarClock className="size-5" /> : <FileCheck2 className="size-5" />}</span>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold">{s.titulo}</h3>
            {s.gabaritoStatus === "preliminar_nao_oficial" ? <span className="rounded-full bg-warning/15 px-2 py-1 text-[10px] font-semibold text-warning">Gabarito não oficial</span> : null}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">{s.descricao || `${s.totalQuestoes} questões · ${data}`}</p>
          <p className="mt-2 text-[11px] text-muted-foreground">{s.respondidas}/{s.totalQuestoes} respondidas</p>
        </div>
      </div>
      {bloqueadoPlano ? (
        <Link to="/premium" className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground"><Crown className="size-4" /> {rotulo}</Link>
      ) : (
        <button disabled={s.situacao === "agendado" || s.situacao === "aguardando_gabarito"} onClick={onAbrir} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:bg-surface disabled:text-muted-foreground">
          {s.situacao === "agendado" || s.situacao === "aguardando_gabarito" ? <LockKeyhole className="size-4" /> : <ArrowRight className="size-4" />} {rotulo}
        </button>
      )}
    </article>
  );
}

function Indisponivel({ simulado: s }: { simulado: SimuladoCatalogo }) {
  const aguardando = s.situacao === "aguardando_gabarito";
  return (
    <section className="rounded-2xl border border-border/60 bg-card p-6 text-center">
      <Clock3 className="mx-auto size-8 text-primary" />
      <h2 className="mt-3 font-display text-xl font-semibold">{aguardando ? "Respostas encerradas" : "Simulado agendado"}</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        {aguardando ? `O gabarito será liberado ${formatarDataHora(s.gabaritoLiberadoEm)}.` : `A prova abre ${formatarDataHora(s.abreEm)}.`}
      </p>
    </section>
  );
}

function Aplicacao({ simulado, aoEncerrar }: { simulado: SimuladoCatalogo; aoEncerrar: () => void }) {
  const qc = useQueryClient();
  const [indice, setIndice] = useState(0);
  const [respostas, setRespostas] = useState<Record<string, string>>({});
  const [agora, setAgora] = useState(Date.now());
  const prova = useQuery({ queryKey: ["simulado-enamed", simulado.id], queryFn: () => abrirSimuladoEnamed(simulado.id), retry: false });

  useEffect(() => {
    if (prova.data) setRespostas(prova.data.respostas);
  }, [prova.data]);

  useEffect(() => {
    const timer = window.setInterval(() => setAgora(Date.now()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (agora >= new Date(simulado.fechaEm).getTime()) {
      qc.invalidateQueries({ queryKey: ["simulados-enamed"] });
      aoEncerrar();
    }
  }, [agora, simulado.fechaEm, aoEncerrar, qc]);

  const salvar = useMutation({
    mutationFn: ({ itemId, letra }: { itemId: string; letra: string }) => salvarRespostaSimulado(simulado.id, itemId, letra),
  });
  const limpar = useMutation({
    mutationFn: (itemId: string) => limparRespostaSimulado(simulado.id, itemId),
  });
  const finalizar = useMutation({
    mutationFn: () => finalizarProvaOficial(simulado.id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["simulados-enamed"] });
      aoEncerrar();
    },
  });

  if (prova.isLoading) return <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Preparando sua prova…</p>;
  if (prova.isError) return <p className="rounded-xl border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">{(prova.error as Error).message}</p>;
  const questoes = prova.data?.questoes ?? [];
  const questao = questoes[indice];
  if (!questao) return <p className="rounded-xl border border-border/60 p-4 text-sm text-muted-foreground">Este simulado ainda não possui questões.</p>;

  const marcar = (letra: string) => {
    const anterior = respostas[questao.itemId];
    setRespostas((r) => ({ ...r, [questao.itemId]: letra }));
    salvar.mutate({ itemId: questao.itemId, letra }, {
      onError: () => setRespostas((r) => anterior ? ({ ...r, [questao.itemId]: anterior }) : removerChave(r, questao.itemId)),
    });
  };
  const apagar = () => {
    const anterior = respostas[questao.itemId];
    setRespostas((r) => removerChave(r, questao.itemId));
    limpar.mutate(questao.itemId, { onError: () => anterior && setRespostas((r) => ({ ...r, [questao.itemId]: anterior })) });
  };

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-primary/35 bg-primary/10 p-4">
        <div className="flex items-center justify-between gap-3">
          <div><p className="text-xs font-semibold uppercase tracking-wide text-primary">Em andamento</p><h2 className="font-display text-lg font-semibold">{simulado.titulo}</h2></div>
          <div className="text-right"><p className="text-xs text-muted-foreground">Encerra</p><p className="font-semibold">{hora(simulado.fechaEm)}</p></div>
        </div>
        <p className="mt-3 text-xs text-muted-foreground">{Object.keys(respostas).length}/{questoes.length} respondidas · salvamento automático</p>
      </section>

      <Navegador questoes={questoes} indice={indice} respostas={respostas} onSelecionar={setIndice} />
      <QuestaoAplicacao questao={questao} marcada={respostas[questao.itemId]} onMarcar={marcar} onLimpar={apagar} />

      <div className="grid grid-cols-2 gap-2">
        <button disabled={indice === 0} onClick={() => setIndice((i) => i - 1)} className="rounded-xl border border-border/60 py-3 text-sm font-semibold disabled:opacity-40">Anterior</button>
        <button disabled={indice === questoes.length - 1} onClick={() => setIndice((i) => i + 1)} className="rounded-xl border border-border/60 py-3 text-sm font-semibold disabled:opacity-40">Próxima</button>
      </div>

      {simulado.tipo === "oficial" ? (
        <button onClick={() => window.confirm("Finalizar a prova? Depois disso, as respostas não poderão ser alteradas.") && finalizar.mutate()} disabled={finalizar.isPending} className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground">
          Finalizar prova e ver resultado
        </button>
      ) : (
        <p className="rounded-xl bg-surface p-3 text-center text-xs text-muted-foreground">Você pode alterar suas respostas até as 22h. O gabarito será liberado depois desse horário.</p>
      )}
      {(salvar.isError || limpar.isError || finalizar.isError) ? <p className="text-xs text-destructive">{((salvar.error || limpar.error || finalizar.error) as Error).message}</p> : null}
    </div>
  );
}

function Navegador({ questoes, indice, respostas, onSelecionar }: { questoes: QuestaoSimulado[]; indice: number; respostas: Record<string, string>; onSelecionar: (i: number) => void }) {
  const faixaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    manterItemVisivel(faixaRef.current, indice);
  }, [indice]);

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-3">
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-muted-foreground">Navegue pelas questões</p>
        <span className="shrink-0 text-[11px] text-muted-foreground">Questão {indice + 1} de {questoes.length}</span>
      </div>
      <div ref={faixaRef} className="flex gap-2 overflow-x-auto px-1 py-1.5 [scrollbar-width:thin]">
        {questoes.map((q, i) => (
          <button
            key={q.itemId}
            data-indice={i}
            type="button"
            aria-label={`Ir para a questão ${q.ordem}${respostas[q.itemId] ? ", respondida" : ", não respondida"}`}
            aria-current={i === indice ? "step" : undefined}
            onClick={() => onSelecionar(i)}
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-full border text-xs font-semibold",
              i === indice && "ring-2 ring-primary ring-offset-2 ring-offset-background",
              respostas[q.itemId] ? "border-primary bg-primary text-primary-foreground" : "border-border/70 bg-surface text-muted-foreground",
            )}
          >
            {q.ordem}
          </button>
        ))}
      </div>
    </section>
  );
}

function QuestaoAplicacao({ questao, marcada, onMarcar, onLimpar }: { questao: QuestaoSimulado; marcada?: string | undefined; onMarcar: (letra: string) => void; onLimpar: () => void }) {
  return (
    <article className="rounded-2xl border border-border/60 bg-card p-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-primary">Questão {questao.ordem}</p>
      <p className="mt-3 whitespace-pre-line text-sm font-medium leading-relaxed">{questao.enunciado}</p>
      {questao.imagemUrl ? <img src={questao.imagemUrl} alt={`Imagem da questão ${questao.ordem}`} className="mt-4 max-h-96 w-full rounded-xl object-contain" /> : null}
      <div className="mt-5 space-y-2">
        {questao.alternativas.map((a) => <button key={a.letra} onClick={() => onMarcar(a.letra)} className={cn("flex w-full items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm", marcada === a.letra ? "border-primary bg-primary/10" : "border-border/60 hover:border-primary/60")}><span className="font-display text-xs font-bold text-primary">{a.letra}</span><span>{a.texto}</span></button>)}
      </div>
      {marcada ? <button onClick={onLimpar} className="mt-3 flex items-center gap-2 text-xs font-semibold text-muted-foreground"><RotateCcw className="size-3.5" /> Deixar em branco</button> : null}
    </article>
  );
}

function Resultado({ simulado }: { simulado: SimuladoCatalogo }) {
  const { premium } = usePlano();
  const [indice, setIndice] = useState(0);
  const resultado = useQuery({ queryKey: ["resultado-simulado", simulado.id], queryFn: () => buscarResultadoSimulado(simulado.id), retry: false });
  const ranking = useQuery({ queryKey: ["ranking-simulado", simulado.id], queryFn: () => buscarRankingSimulado(simulado.id), enabled: simulado.tipo === "semanal", retry: false });
  const areas = useMemo(() => {
    const mapa = new Map<string, { total: number; acertos: number }>();
    for (const q of resultado.data?.questoes ?? []) {
      if (q.anulada) continue;
      const nome = q.areaNome || "Sem área";
      const atual = mapa.get(nome) ?? { total: 0, acertos: 0 };
      atual.total += 1;
      if (q.resultado === "correta") atual.acertos += 1;
      mapa.set(nome, atual);
    }
    return [...mapa.entries()];
  }, [resultado.data]);

  if (resultado.isLoading) return <p className="flex items-center gap-2 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Corrigindo simulado…</p>;
  if (resultado.isError) return <p className="rounded-xl border border-destructive/40 p-4 text-sm text-destructive">{(resultado.error as Error).message}</p>;
  const r = resultado.data!;
  const percentual = r.totalValidas ? Math.round(r.acertos * 1000 / r.totalValidas) / 10 : 0;
  const questao = r.questoes[indice];

  return (
    <div className="space-y-4">
      {r.gabaritoStatus === "preliminar_nao_oficial" ? <div className="rounded-xl border border-warning/40 bg-warning/10 p-3 text-xs text-warning"><strong>Gabarito preliminar não oficial.</strong> Elaborado por resolução independente e sujeito a alteração após a divulgação do Inep.</div> : null}
      <section className="rounded-2xl border border-primary/40 bg-primary/10 p-5">
        <p className="text-xs font-semibold uppercase tracking-wide text-primary">Seu resultado</p>
        <div className="mt-2 flex items-end gap-2"><span className="font-display text-4xl font-bold">{r.acertos}</span><span className="pb-1 text-muted-foreground">de {r.totalValidas}</span></div>
        <p className="mt-2 text-sm text-muted-foreground">{percentual}% de acerto · {r.emBranco} em branco</p>
      </section>

      <MapaResultado questoes={r.questoes} indice={indice} onSelecionar={setIndice} />
      {questao ? <QuestaoResultado questao={questao} /> : null}

      {premium ? (
        <section className="rounded-2xl border border-border/60 bg-card p-4">
          <p className="flex items-center gap-2 font-semibold"><Crown className="size-4 text-primary" /> Desempenho por área</p>
          <div className="mt-3 space-y-2">{areas.map(([nome, a]) => <div key={nome} className="flex items-center justify-between rounded-xl bg-surface px-3 py-2 text-sm"><span>{nome}</span><strong>{a.acertos}/{a.total} · {a.total ? Math.round(a.acertos * 100 / a.total) : 0}%</strong></div>)}</div>
        </section>
      ) : (
        <Link to="/premium" className="flex items-center gap-3 rounded-2xl border border-primary/40 bg-primary/10 p-4"><Crown className="size-5 text-primary" /><span className="flex-1 text-sm"><strong className="block">Análise detalhada Premium</strong><span className="text-xs text-muted-foreground">Veja seu desempenho por área e assunto.</span></span><ArrowRight className="size-4 text-primary" /></Link>
      )}

      {simulado.tipo === "semanal" ? <RankingSemanal linhas={ranking.data ?? []} carregando={ranking.isLoading} /> : null}
    </div>
  );
}

function MapaResultado({ questoes, indice, onSelecionar }: { questoes: ResultadoQuestao[]; indice: number; onSelecionar: (i: number) => void }) {
  const faixaRef = useRef<HTMLDivElement>(null);
  const cor = (q: ResultadoQuestao) => q.resultado === "correta" ? "border-success bg-success text-white" : q.resultado === "errada" ? "border-destructive bg-destructive text-white" : q.resultado === "anulada" ? "border-primary bg-primary/15 text-primary" : "border-border bg-muted text-muted-foreground";

  useEffect(() => {
    manterItemVisivel(faixaRef.current, indice);
  }, [indice]);

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-3">
      <div className="mb-1.5 flex items-center justify-between gap-3">
        <p className="text-xs font-semibold text-muted-foreground">Navegue pelo resultado</p>
        <span className="shrink-0 text-[11px] text-muted-foreground">Questão {indice + 1} de {questoes.length}</span>
      </div>
      <div ref={faixaRef} className="flex gap-2 overflow-x-auto px-1 py-1.5 [scrollbar-width:thin]">
        {questoes.map((q, i) => (
          <button
            key={q.itemId}
            data-indice={i}
            type="button"
            aria-label={`Ver resultado da questão ${q.ordem}: ${rotuloResultado(q)}`}
            aria-current={i === indice ? "step" : undefined}
            onClick={() => onSelecionar(i)}
            className={cn(
              "flex size-9 shrink-0 items-center justify-center rounded-full border text-xs font-bold",
              cor(q),
              i === indice && "ring-2 ring-primary ring-offset-2 ring-offset-background",
            )}
          >
            {q.ordem}
          </button>
        ))}
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-muted-foreground"><Legenda cor="bg-success" texto="Acertou" /><Legenda cor="bg-destructive" texto="Errou" /><Legenda cor="bg-muted" texto="Em branco" /><Legenda cor="bg-primary/30" texto="Anulada" /></div>
    </section>
  );
}

function QuestaoResultado({ questao: q }: { questao: ResultadoQuestao }) {
  return (
    <article className="rounded-2xl border border-border/60 bg-card p-5">
      <div className="flex items-center justify-between gap-2"><p className="text-xs font-semibold uppercase tracking-wide text-primary">Questão {q.ordem}</p><span className="text-[11px] text-muted-foreground">{[q.areaNome, q.assuntoNome].filter(Boolean).join(" · ")}</span></div>
      <p className="mt-3 whitespace-pre-line text-sm font-medium leading-relaxed">{q.enunciado}</p>
      {q.imagemUrl ? <img src={q.imagemUrl} alt="" className="mt-4 max-h-96 w-full rounded-xl object-contain" /> : null}
      <div className="mt-5 space-y-2">{q.alternativas.map((a) => {
        const correta = a.letra === q.correta;
        const marcada = a.letra === q.marcada;
        return <div key={a.letra} className={cn("flex items-start gap-3 rounded-xl border px-4 py-3 text-sm", correta && "border-success bg-success/10", marcada && !correta && "border-destructive bg-destructive/10", !correta && !marcada && "border-border/50")}><span className="font-bold">{a.letra}</span><span className="flex-1">{a.texto}</span>{correta ? <Check className="size-4 text-success" /> : marcada ? <X className="size-4 text-destructive" /> : null}</div>;
      })}</div>
      <div className="mt-4 rounded-xl bg-surface p-4"><p className="text-xs font-semibold uppercase tracking-wide text-primary">{q.anulada ? "Questão anulada" : `Gabarito ${q.correta}`}</p><p className="mt-2 whitespace-pre-line text-sm leading-relaxed text-muted-foreground">{q.comentario || "Comentário em preparação."}</p></div>
    </article>
  );
}

function RankingSemanal({ linhas, carregando }: { linhas: Awaited<ReturnType<typeof buscarRankingSimulado>>; carregando: boolean }) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card p-4">
      <p className="flex items-center gap-2 font-semibold"><Trophy className="size-5 text-primary" /> Ranking do simulado</p>
      {carregando ? <Loader2 className="mt-4 size-4 animate-spin" /> : <div className="mt-3 space-y-2">{linhas.map((l) => <div key={l.userId} className="flex items-center gap-3 rounded-xl bg-surface px-3 py-2.5"><span className="flex size-8 items-center justify-center rounded-full bg-primary/10 font-bold text-primary">{l.posicao <= 3 ? <Medal className="size-4" /> : l.posicao}</span><span className="flex-1 truncate text-sm font-medium">{l.nome}</span><strong className="text-sm">{l.acertos}/100 · {l.percentual}%</strong></div>)}</div>}
      {!carregando && !linhas.length ? <p className="mt-3 text-sm text-muted-foreground">Nenhuma participação contabilizada.</p> : null}
    </section>
  );
}

function manterItemVisivel(container: HTMLDivElement | null, indice: number) {
  if (!container) return;
  const item = container.querySelector<HTMLElement>(`[data-indice="${indice}"]`);
  if (!item) return;

  const margem = 8;
  const esquerdaVisivel = container.scrollLeft;
  const direitaVisivel = esquerdaVisivel + container.clientWidth;
  const esquerdaItem = item.offsetLeft;
  const direitaItem = esquerdaItem + item.offsetWidth;

  if (esquerdaItem < esquerdaVisivel + margem) {
    container.scrollTo({ left: Math.max(0, esquerdaItem - margem), behavior: "smooth" });
  } else if (direitaItem > direitaVisivel - margem) {
    container.scrollTo({ left: direitaItem - container.clientWidth + margem, behavior: "smooth" });
  }
}

function rotuloResultado(q: ResultadoQuestao) {
  if (q.resultado === "correta") return "acertou";
  if (q.resultado === "errada") return "errou";
  if (q.resultado === "anulada") return "anulada";
  return "em branco";
}

function Legenda({ cor, texto }: { cor: string; texto: string }) {
  return <span className="flex items-center gap-1.5"><span className={cn("size-2.5 rounded-full", cor)} />{texto}</span>;
}

function removerChave(obj: Record<string, string>, chave: string) {
  const novo = { ...obj };
  delete novo[chave];
  return novo;
}

function hora(data: string) {
  return new Date(data).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
}

function formatarDataHora(data: string) {
  return new Date(data).toLocaleString("pt-BR", { weekday: "long", day: "2-digit", month: "long", hour: "2-digit", minute: "2-digit", timeZone: "America/Sao_Paulo" });
}
