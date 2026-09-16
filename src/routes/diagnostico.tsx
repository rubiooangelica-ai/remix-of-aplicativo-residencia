import { useMemo, useState } from "react";
import { exigirLogin } from "@/lib/auth";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Archive, Brain, Check, ChevronDown, History, Loader2, Play, SkipForward, Trophy, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { BuscaDiagnostico } from "@/components/BuscaDiagnostico";
import { RankingSemanal } from "@/components/RankingSemanal";
import { useSessao } from "@/lib/auth";
import { buscarTaxonomia } from "@/lib/banco";
import { montarListaDiagnosticos } from "@/lib/diagnosticos-busca";
import { arquivoCasos, buscarCatalogoDiagnosticos, conferirPalpiteLocal, idsCasosDoDia, iniciarJogadaServidor } from "@/lib/dx-casos";
import {
  LIMITE_DIARIO,
  atualizarJogada,
  buscarJogadas,
  diaAtual,
  estatisticas,
  pontosPorDicas,
  type Jogada,
} from "@/lib/diagnostico";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/diagnostico")({
  beforeLoad: exigirLogin,
  head: () => ({
    meta: [
      { title: "Qual o diagnóstico? — desafio clínico diário | ResidênciaPro" },
      {
        name: "description",
        content:
          "Mini-jogo diário de raciocínio clínico: dois casos por dia, dicas progressivas, pontuação por dicas usadas, arquivo de casos antigos e ranking.",
      },
      { property: "og:title", content: "Qual o diagnóstico? — desafio clínico diário" },
      {
        property: "og:description",
        content: "Casos clínicos com dicas progressivas, pontuação matemática e ranking entre estudantes.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Diagnostico,
});

type Aba = "jogo" | "arquivo" | "historico" | "ranking";
const DIAS_ARQUIVO = 14;

function Diagnostico() {
  const { usuario } = useSessao();
  const qc = useQueryClient();
  const [aba, setAba] = useState<Aba>("jogo");
  const [palpite, setPalpite] = useState("");
  const [erroPalpite, setErroPalpite] = useState<string | null>(null);
  const [atual, setAtual] = useState<Jogada | null>(null);
  const [treino, setTreino] = useState<Jogada | null>(null);

  const hoje = diaAtual();

  const jogadas = useQuery({
    queryKey: ["dx-jogadas"],
    queryFn: buscarJogadas,
    enabled: !!usuario,
  });
  const tax = useQuery({ queryKey: ["taxonomia"], queryFn: buscarTaxonomia });
  const catalogoDx = useQuery({ queryKey: ["dx-catalogo"], queryFn: buscarCatalogoDiagnosticos });
  const casosHoje = useQuery({ queryKey: ["dx-casos-dia", hoje], queryFn: () => idsCasosDoDia(hoje) });

  const diagnosticos = useMemo(
    () =>
      montarListaDiagnosticos([
        ...(catalogoDx.data ?? []),
        ...(tax.data?.assuntos ?? []).map((a) => a.nome),
      ]),
    [catalogoDx.data, tax.data],
  );

  const lista = jogadas.data ?? [];
  const oficiais = lista.filter((j) => j.valida);
  const doDia = oficiais.filter((j) => j.dia === hoje);
  const emAndamento = atual ?? doDia.find((j) => !j.finalizado) ?? null;
  const restantes = Math.max(0, LIMITE_DIARIO - doDia.length);
  const stats = estatisticas(lista);

  const treinoAtivo = treino ?? lista.find((j) => !j.valida && !j.finalizado) ?? null;
  const caso = aba === "arquivo" ? treinoAtivo : emAndamento;
  const setCaso = (j: Jogada) => (j.valida ? setAtual(j) : setTreino(j));

  const iniciarOficial = useMutation({
    mutationFn: async () => {
      if (!usuario) throw new Error("Entre na sua conta para jogar.");
      const ids = casosHoje.data ?? [];
      const proximo = ids[doDia.length];
      if (!proximo) throw new Error("Nenhum caso disponível agora. Tente de novo em instantes.");
      return iniciarJogadaServidor({ casoId: proximo, dia: hoje, valida: true });
    },
    onSuccess: (j) => {
      setCaso(j);
      setPalpite("");
      setErroPalpite(null);
      void qc.invalidateQueries({ queryKey: ["dx-jogadas"] });
    },
  });

  const iniciarArquivo = useMutation({
    mutationFn: async (casoId: string) => {
      if (!usuario) throw new Error("Entre na sua conta para jogar.");
      return iniciarJogadaServidor({ casoId, dia: hoje, valida: false });
    },
    onSuccess: (j) => {
      setCaso(j);
      setPalpite("");
      setErroPalpite(null);
      void qc.invalidateQueries({ queryKey: ["dx-jogadas"] });
    },
  });

  const pular = useMutation({
    mutationFn: async () => {
      if (!caso) throw new Error("Sem caso ativo.");
      return atualizarJogada(caso.id, { dicas_reveladas: caso.dicas_reveladas + 1 });
    },
    onSuccess: (j) => {
      setCaso(j);
      setErroPalpite(null);
      void qc.invalidateQueries({ queryKey: ["dx-jogadas"] });
    },
  });

  const chutar = useMutation({
    mutationFn: async (texto: string) => {
      if (!caso) throw new Error("Sem caso ativo.");
      const acertou = conferirPalpiteLocal({ diagnostico: caso.diagnostico, aceitos: caso.aceitos }, texto);
      const ultima = caso.dicas_reveladas >= caso.dicas.length;
      return atualizarJogada(caso.id, {
        palpites: [...caso.palpites, texto],
        acertou,
        finalizado: acertou || ultima,
        pontos: acertou && caso.valida ? pontosPorDicas(caso.dicas_reveladas) : 0,
        dicas_reveladas: acertou ? caso.dicas_reveladas : Math.min(caso.dicas.length, caso.dicas_reveladas + 1),
      });
    },
    onSuccess: (j) => {
      setCaso(j);
      setPalpite("");
      setErroPalpite(j.acertou ? null : "Não é esse. Veja a próxima dica.");
      void qc.invalidateQueries({ queryKey: ["dx-jogadas"] });
      void qc.invalidateQueries({ queryKey: ["dx-ranking"] });
    },
  });

  const abas: { id: Aba; rotulo: string; icone: typeof Brain }[] = [
    { id: "jogo", rotulo: "Hoje", icone: Brain },
    { id: "arquivo", rotulo: "Arquivo", icone: Archive },
    { id: "historico", rotulo: "Histórico", icone: History },
    { id: "ranking", rotulo: "Ranking", icone: Trophy },
  ];

  return (
    <AppShell
      titulo="Qual o diagnóstico?"
      descricao="Dois casos oficiais por dia, iguais pra todo mundo, valem pontos. Acertar até a 3ª dica dá pontuação cheia; na 4ª vale metade e na 5ª um terço."
    >
      <div className="mb-5 grid grid-cols-4 gap-1 rounded-2xl border border-border/60 bg-surface p-1">
        {abas.map(({ id, rotulo, icone: Icon }) => (
          <button
            key={id}
            onClick={() => setAba(id)}
            className={`flex flex-col items-center gap-1 rounded-xl py-2 text-[11px] font-semibold ${
              aba === id ? "bg-primary text-primary-foreground" : "text-muted-foreground"
            }`}
          >
            <Icon className="size-3.5" />
            {rotulo}
          </button>
        ))}
      </div>

      <section className="mb-5 grid grid-cols-5 gap-2">
        <Metrica rotulo="Casos" valor={`${stats.total}`} />
        <Metrica rotulo="Acertos" valor={`${stats.acertos}`} tom="success" />
        <Metrica rotulo="Taxa" valor={`${stats.taxa}%`} />
        <Metrica rotulo="Streak" valor={`${stats.streak}d`} tom="warning" />
        <Metrica rotulo="Semana" valor={`${Math.round(stats.pontosSemana)}`} />
      </section>

      {aba === "ranking" ? (
        <RankingSemanal userId={usuario?.id ?? null} />
      ) : aba === "historico" ? (
        <Historico lista={lista.filter((j) => j.finalizado)} />
      ) : aba === "arquivo" && !caso ? (
        <ArquivoDias
          hoje={hoje}
          onJogar={(casoId) => iniciarArquivo.mutate(casoId)}
          iniciando={iniciarArquivo.isPending}
        />
      ) : (
        <div className="space-y-4">
          {!usuario ? (
            <p className="rounded-2xl border border-border/60 bg-card p-5 text-sm text-muted-foreground">
              Entre na sua conta para jogar e guardar suas estatísticas.
            </p>
          ) : null}

          {caso ? (
            <CasoJogo
              caso={caso}
              diagnosticos={diagnosticos}
              palpite={palpite}
              setPalpite={setPalpite}
              erroPalpite={erroPalpite}
              chutando={chutar.isPending}
              pulando={pular.isPending}
              onChutar={(t) => chutar.mutate(t)}
              onPular={() => pular.mutate()}
              onVoltarArquivo={aba === "arquivo" ? () => setTreino(null) : undefined}
            />
          ) : null}

          {(!caso || caso.finalizado) && usuario && aba === "jogo" ? (
            restantes > 0 ? (
              <button
                onClick={() => iniciarOficial.mutate()}
                disabled={iniciarOficial.isPending || casosHoje.isLoading}
                className="flex w-full items-center justify-center gap-2 rounded-full bg-primary py-3.5 text-sm font-semibold text-primary-foreground disabled:opacity-60"
              >
                {iniciarOficial.isPending || casosHoje.isLoading ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <Play className="size-4" />
                )}
                Novo caso oficial ({restantes} de {LIMITE_DIARIO} hoje)
              </button>
            ) : (
              <div className="space-y-3">
                <p className="rounded-2xl border border-border/60 bg-card p-5 text-center text-sm text-muted-foreground">
                  Você já jogou os {LIMITE_DIARIO} casos oficiais de hoje. Volte amanhã — ou treine no modo arquivo.
                </p>
                <button
                  onClick={() => setAba("arquivo")}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-border/70 py-3 text-sm font-semibold text-muted-foreground"
                >
                  <Archive className="size-4" />
                  Ir para o arquivo
                </button>
              </div>
            )
          ) : null}

          {iniciarOficial.isError ? (
            <p className="text-xs text-destructive">{(iniciarOficial.error as Error).message}</p>
          ) : null}
        </div>
      )}
    </AppShell>
  );
}

function ArquivoDias({
  hoje,
  onJogar,
  iniciando,
}: {
  hoje: string;
  onJogar: (casoId: string) => void;
  iniciando: boolean;
}) {
  const [diaAberto, setDiaAberto] = useState<string | null>(null);

  const dias = useMemo(() => {
    const lista: string[] = [];
    const cursor = new Date(`${hoje}T12:00:00`);
    for (let i = 0; i < DIAS_ARQUIVO; i++) {
      cursor.setDate(cursor.getDate() - 1);
      lista.push(cursor.toISOString().slice(0, 10));
    }
    return lista;
  }, [hoje]);

  const casosPorDia = useQuery({
    queryKey: ["dx-casos-arquivo", dias],
    queryFn: () => arquivoCasos(dias),
  });

  return (
    <div className="space-y-3">
      <div className="rounded-2xl border border-border/60 bg-card p-4 text-xs leading-relaxed text-muted-foreground">
        <strong className="text-foreground">Arquivo:</strong> os casos oficiais dos últimos dias ficam guardados aqui.
        Você pode jogar qualquer um deles quando quiser — não valem pontos no ranking.
      </div>

      {casosPorDia.isLoading ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Carregando dias anteriores...
        </p>
      ) : null}

      {dias.map((dia) => {
        const casos = casosPorDia.data?.[dia] ?? [];
        if (!casos.length) return null;
        const aberto = diaAberto === dia;
        const dataFormatada = new Date(`${dia}T12:00:00`).toLocaleDateString("pt-BR", {
          weekday: "short",
          day: "2-digit",
          month: "2-digit",
        });
        return (
          <div key={dia} className="rounded-2xl border border-border/60 bg-card">
            <button
              onClick={() => setDiaAberto(aberto ? null : dia)}
              className="flex w-full items-center justify-between p-4 text-left"
            >
              <span className="text-sm font-semibold capitalize">{dataFormatada}</span>
              <ChevronDown
                className={cn("size-4 text-muted-foreground transition-transform", aberto && "rotate-180")}
              />
            </button>
            {aberto ? (
              <div className="space-y-2 border-t border-border/50 p-3">
                {casos.map((c, i) => {
                  const jogado = c.jogado;
                  return (
                    <div
                      key={c.casoId}
                      className="flex items-center justify-between gap-2 rounded-xl border border-border/50 bg-surface px-3 py-2.5"
                    >
                      <span className="text-xs text-muted-foreground">Caso {i + 1}</span>
                      <button
                        onClick={() => onJogar(c.casoId)}
                        disabled={iniciando}
                        className={cn(
                          "rounded-full px-3 py-1.5 text-xs font-semibold disabled:opacity-50",
                          jogado
                            ? "border border-border/70 text-muted-foreground"
                            : "bg-primary text-primary-foreground",
                        )}
                      >
                        {jogado ? "Jogar de novo" : "Jogar"}
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function CasoJogo({
  caso,
  diagnosticos,
  palpite,
  setPalpite,
  erroPalpite,
  chutando,
  pulando,
  onChutar,
  onPular,
  onVoltarArquivo,
}: {
  caso: Jogada;
  diagnosticos: string[];
  palpite: string;
  setPalpite: (v: string) => void;
  erroPalpite: string | null;
  chutando: boolean;
  pulando: boolean;
  onChutar: (texto: string) => void;
  onPular: () => void;
  onVoltarArquivo?: (() => void) | undefined;
}) {
  const ultima = caso.dicas_reveladas >= caso.dicas.length;

  return (
    <>
      <div className="flex items-center justify-between text-[11px]">
        <span className="rounded-full bg-surface px-3 py-1 text-muted-foreground">
          {caso.valida ? "Caso oficial do dia" : "Caso de arquivo · sem pontos"}
        </span>
        {caso.valida ? (
          <span className="text-muted-foreground">
            Vale agora: <strong className="text-primary">{pontosPorDicas(caso.dicas_reveladas)}</strong> pts
          </span>
        ) : onVoltarArquivo ? (
          <button onClick={onVoltarArquivo} className="text-primary underline">
            Voltar ao arquivo
          </button>
        ) : null}
      </div>

      <div className="space-y-3">
        {caso.dicas.slice(0, caso.dicas_reveladas).map((d, i) => (
          <article key={i} className="rounded-2xl border border-border/60 bg-card p-4 text-sm leading-relaxed">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
              Dica {i + 1} de {caso.dicas.length}
            </p>
            {d}
          </article>
        ))}
      </div>

      {caso.palpites.length ? (
        <div className="flex flex-wrap gap-2">
          {caso.palpites.map((p, i) => {
            const certo = caso.acertou && i === caso.palpites.length - 1;
            return (
              <span
                key={i}
                className={`flex items-center gap-1 rounded-full px-3 py-1.5 text-[11px] ${
                  certo ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
                }`}
              >
                {certo ? <Check className="size-3" /> : <X className="size-3" />}
                {p}
              </span>
            );
          })}
        </div>
      ) : null}

      {caso.finalizado ? (
        <div
          className={`rounded-2xl border p-5 text-center ${
            caso.acertou ? "border-success/50 bg-success/10" : "border-destructive/50 bg-destructive/10"
          }`}
        >
          <p className="text-sm font-semibold">{caso.acertou ? "Acertou! 🎉" : "Não foi dessa vez"}</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Diagnóstico: <strong className="text-foreground">{caso.diagnostico}</strong>
          </p>
          <p className="mt-2 text-xs text-muted-foreground">
            {caso.valida
              ? `${Number(caso.pontos).toFixed(2)} pontos com ${caso.dicas_reveladas} dica(s)`
              : "Treino de arquivo — não pontua no ranking"}
          </p>
          {onVoltarArquivo ? (
            <button onClick={onVoltarArquivo} className="mt-3 text-xs font-semibold text-primary underline">
              Voltar ao arquivo
            </button>
          ) : null}
        </div>
      ) : (
        <div className="space-y-3">
          <BuscaDiagnostico lista={diagnosticos} valor={palpite} onChange={setPalpite} onConfirmar={onChutar} />
          {erroPalpite ? <p className="text-xs text-destructive">{erroPalpite}</p> : null}
          <div className="flex gap-2">
            <button
              onClick={() => palpite.trim() && onChutar(palpite.trim())}
              disabled={chutando || !palpite.trim()}
              className="flex flex-1 items-center justify-center gap-2 rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
            >
              {chutando ? <Loader2 className="size-4 animate-spin" /> : <Brain className="size-4" />}
              Chutar
            </button>
            <button
              onClick={onPular}
              disabled={pulando || ultima}
              className="flex flex-1 items-center justify-center gap-2 rounded-full border border-border/70 py-3 text-sm font-semibold text-muted-foreground disabled:opacity-40"
            >
              <SkipForward className="size-4" />
              Pular dica
            </button>
          </div>
          {ultima ? (
            <p className="text-center text-[11px] text-warning">Última dica — esta é sua última chance.</p>
          ) : null}
        </div>
      )}
    </>
  );
}

function Historico({ lista }: { lista: Jogada[] }) {
  return (
    <div className="space-y-3">
      {lista.map((j) => (
        <details key={j.id} className="rounded-2xl border border-border/60 bg-card p-4">
          <summary className="flex cursor-pointer items-center justify-between gap-3 text-sm">
            <span>
              <strong>{j.diagnostico}</strong>
              <span className="block text-[11px] text-muted-foreground">
                {new Date(j.created_at).toLocaleDateString("pt-BR")} · {j.dicas_reveladas} dicas ·{" "}
                {j.valida ? `${Number(j.pontos).toFixed(2)} pts` : "arquivo"}
              </span>
            </span>
            <span
              className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-semibold ${
                j.acertou ? "bg-success/15 text-success" : "bg-destructive/15 text-destructive"
              }`}
            >
              {j.acertou ? "Acertou" : "Errou"}
            </span>
          </summary>
          <div className="mt-3 space-y-2 text-xs leading-relaxed text-muted-foreground">
            {j.dicas.map((d, i) => (
              <p key={i}>
                <span className="font-semibold text-primary">Dica {i + 1}:</span> {d}
              </p>
            ))}
            {j.palpites.length ? <p className="pt-1">Palpites: {j.palpites.join(", ")}</p> : null}
          </div>
        </details>
      ))}
      {!lista.length ? (
        <p className="rounded-2xl border border-border/60 bg-card p-5 text-sm text-muted-foreground">
          Nenhum caso finalizado ainda.
        </p>
      ) : null}
    </div>
  );
}

function Metrica({ rotulo, valor, tom }: { rotulo: string; valor: string; tom?: "success" | "warning" }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-2.5 text-center">
      <p
        className={`font-display text-base font-semibold ${
          tom === "success" ? "text-success" : tom === "warning" ? "text-warning" : "text-primary"
        }`}
      >
        {valor}
      </p>
      <p className="mt-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">{rotulo}</p>
    </div>
  );
}
