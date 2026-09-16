import { createFileRoute, Link } from "@tanstack/react-router";
import { exigirLogin } from "@/lib/auth";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle,
  ArrowLeft,
  Brain,
  Check,
  ChevronLeft,
  ChevronRight,
  Copy,
  Flag,
  Loader2,
  MessageCircleQuestion,
  NotebookPen,
  Share2,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ChatDuvidas } from "@/components/ChatDuvidas";
import { Cronometro, useCronometro } from "@/components/Cronometro";
import { PainelResumo } from "@/components/PainelResumo";
import { BancoFiltros } from "@/components/BancoFiltros";
import { EditarQuestaoAdmin } from "@/components/EditarQuestaoAdmin";
import { TextoGrifavel, type Grifo } from "@/components/TextoGrifavel";
import { AnotacaoDesenho } from "@/components/AnotacaoDesenho";
import { LimiteErro } from "@/components/LimiteErro";
import { gerarExplicacaoQuestao } from "@/lib/estudo.functions";
import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/lib/auth";
import { useEhAdmin, reportarQuestao } from "@/lib/admin";
import { usePlano } from "@/hooks/usePlano";
import { buscarPastas, criarPasta } from "@/lib/pastas";
import { buscarSessaoPorId } from "@/lib/sessoes";
import {
  buscarAnotacoes,
  buscarAvaliacaoQuestao,
  buscarContagemAvaliacaoQuestao,
  buscarContagens,
  buscarFacetas,
  buscarQuestoesPorIds,
  buscarQuestoesSessao,
  buscarSessaoCompartilhada,
  buscarTaxonomia,
  compartilharSessao,
  salvarAnotacao,
  salvarAvaliacaoQuestao,
  salvarResposta,
  type AvaliacaoQuestao,
  type ContagemAvaliacaoQuestao,
  type Contagens,
  type Facetas,
  type FiltrosSessao,
  type Taxonomia,
  type QuestaoDb,
  type TipoQuestao,
} from "@/lib/banco";
import { salvarSessaoLocal, type RespostaSalva, type SessaoSalva } from "@/lib/sessoes";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/questoes")({
  beforeLoad: exigirLogin,
  validateSearch: (search: Record<string, unknown>) => ({
    retomar: typeof search["retomar"] === "string" ? (search["retomar"] as string) : undefined,
    assunto: typeof search["assunto"] === "string" ? (search["assunto"] as string) : undefined,
    compartilhada: typeof search["compartilhada"] === "string" ? (search["compartilhada"] as string) : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Questões por tema, ano e banca — ResidênciaPro" },
      {
        name: "description",
        content:
          "Escolha as pastas de temas, filtre por ano, estilo de questão e universidade, e resolva com cronômetro, resumos, anotações e tutor de IA.",
      },
      { property: "og:title", content: "Questões de residência filtradas por tema" },
      {
        property: "og:description",
        content: "Monte sua sessão de questões por tema, ano, estilo e banca — com tutor de IA.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: QuestoesPage,
});

const MOTIVOS_REPORTE = ["Sessão errada", "Sem banca/ano", "Falta informação"] as const;

const rotuloTipo: Record<TipoQuestao, string> = {
  alternativas: "Alternativas",
  aberta: "Questão aberta",
  vf: "Verdadeiro e falso",
};

type Etapa = "banco" | "pasta" | "sessao";

const taxVazia: Taxonomia = { areas: [], especialidades: [], assuntos: [], subassuntos: [] };
const facetasVazias: Facetas = { anos: [], bancas: [], tipos: [] };
const contagensVazias: Contagens = {
  total: 0,
  areas: {},
  especialidades: {},
  assuntos: {},
  anos: {},
  bancas: {},
  tipos: {},
};

function QuestoesPage() {
  const { usuario } = useSessao();
  const { retomar: retomarIdUrl, assunto: assuntoIdUrl, compartilhada: compartilhadaCodigoUrl } = Route.useSearch();
  const [etapa, setEtapa] = useState<Etapa>("banco");
  const [filtrosAtivos, setFiltrosAtivos] = useState<FiltrosSessao | null>(null);
  const [retomar, setRetomar] = useState<SessaoSalva | null>(null);
  const [pastaEscolhidaId, setPastaEscolhidaId] = useState<string | null>(null);
  const [codigoManual, setCodigoManual] = useState("");
  const [mostrarCodigoManual, setMostrarCodigoManual] = useState(false);
  const [erroCodigo, setErroCodigo] = useState<string | null>(null);

  const tax = useQuery({ queryKey: ["taxonomia"], queryFn: buscarTaxonomia });
  const { ehAdmin } = useEhAdmin();
  const { premium } = usePlano();
  // Questões sem banca/ano: visíveis para admin e premium, ocultas do grátis.
  const podeVerOcultas = ehAdmin || premium;
  const facetas = useQuery({ queryKey: ["facetas", podeVerOcultas], queryFn: () => buscarFacetas(podeVerOcultas) });
  const contagens = useQuery({
    queryKey: ["contagens", podeVerOcultas],
    queryFn: () => buscarContagens(podeVerOcultas),
  });

  // Se veio um link tipo /questoes?retomar=ID (ex: da tela inicial), abre
  // essa sessão específica direto, sem passar pela lista.
  useEffect(() => {
    if (!retomarIdUrl || !usuario) return;
    let ativo = true;
    buscarSessaoPorId(retomarIdUrl, usuario.id).then((s) => {
      if (!ativo || !s) return;
      setFiltrosAtivos(null);
      setPastaEscolhidaId(null);
      setRetomar(s);
      setEtapa("sessao");
    });
    return () => {
      ativo = false;
    };
  }, [retomarIdUrl, usuario]);

  // Se veio um link tipo /questoes?assunto=ID (ex: da tela de Material),
  // NÃO pula direto pra sessão: o BancoFiltros recebe o assunto como filtro
  // inicial e abre o modal "Configurar Sessão" pra pessoa ajustar título,
  // quantidade e opções avançadas antes de começar.

  // Se veio um link tipo /questoes?compartilhada=CODIGO, monta uma sessão
  // nova com exatamente as mesmas questões de quem compartilhou.
  useEffect(() => {
    if (retomarIdUrl || assuntoIdUrl || !compartilhadaCodigoUrl || !usuario) return;
    let ativo = true;
    buscarSessaoCompartilhada(compartilhadaCodigoUrl).then((s) => {
      if (!ativo) return;
      if (!s) {
        setErroCodigo("Código não encontrado.");
        return;
      }
      setRetomar(null);
      setPastaEscolhidaId(null);
      setFiltrosAtivos({
        areaIds: [],
        especialidadeIds: [],
        assuntoIds: [],
        anos: [],
        tipos: [],
        bancasIncluir: [],
        bancasExcluir: [],
        quantidade: s.questaoIds.length,
        questaoIds: s.questaoIds,
        titulo: `${s.titulo} (compartilhada)`,
      });
      setEtapa("pasta");
    });
    return () => {
      ativo = false;
    };
  }, [compartilhadaCodigoUrl, retomarIdUrl, assuntoIdUrl, usuario]);

  async function resgatarCodigoManual() {
    if (!codigoManual.trim()) return;
    setErroCodigo(null);
    const s = await buscarSessaoCompartilhada(codigoManual.trim());
    if (!s) {
      setErroCodigo("Código não encontrado. Confira se digitou certinho.");
      return;
    }
    setRetomar(null);
    setPastaEscolhidaId(null);
    setFiltrosAtivos({
      areaIds: [],
      especialidadeIds: [],
      assuntoIds: [],
      anos: [],
      tipos: [],
      bancasIncluir: [],
      bancasExcluir: [],
      quantidade: s.questaoIds.length,
      questaoIds: s.questaoIds,
      titulo: `${s.titulo} (compartilhada)`,
    });
    setEtapa("pasta");
  }

  if (etapa === "sessao" && (filtrosAtivos || retomar)) {
    return (
      <SessaoQuestoes
        key={retomar?.id ?? "nova"}
        filtros={retomar?.filtros ?? filtrosAtivos!}
        retomar={retomar}
        pastaId={retomar ? null : pastaEscolhidaId}
        onVoltar={() => {
          setRetomar(null);
          setPastaEscolhidaId(null);
          setEtapa("banco");
        }}
        tax={tax.data ?? taxVazia}
      />
    );
  }

  if (etapa === "pasta" && filtrosAtivos) {
    return (
      <EscolherPasta
        onEscolher={(id) => {
          setPastaEscolhidaId(id);
          setEtapa("sessao");
        }}
        onVoltar={() => {
          setFiltrosAtivos(null);
          setEtapa("banco");
        }}
      />
    );
  }

  return (
    <AppShell
      titulo="Praticar questões"
      descricao="Escolha especialidades, temas, instituições e anos — depois ajuste as opções da sessão e comece a resolver."
    >
      <div className="mb-5">
        {mostrarCodigoManual ? (
          <div className="rounded-2xl border border-border/60 bg-card p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Código de sessão compartilhada
            </p>
            <div className="mt-2 flex gap-2">
              <input
                value={codigoManual}
                onChange={(e) => {
                  setCodigoManual(e.target.value);
                  setErroCodigo(null);
                }}
                placeholder="Ex: a1b2c3"
                className="flex-1 rounded-xl border border-border/70 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <button
                onClick={resgatarCodigoManual}
                disabled={!codigoManual.trim()}
                className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
              >
                Abrir
              </button>
            </div>
            {erroCodigo ? <p className="mt-2 text-xs text-destructive">{erroCodigo}</p> : null}
          </div>
        ) : (
          <button
            onClick={() => setMostrarCodigoManual(true)}
            className="flex items-center gap-1.5 text-xs font-medium text-primary"
          >
            <Share2 className="size-3.5" /> Recebi um código de sessão compartilhada
          </button>
        )}
      </div>

      <BancoFiltros
        tax={tax.data ?? taxVazia}
        facetas={facetas.data ?? facetasVazias}
        contagens={contagens.data ?? contagensVazias}
        carregando={tax.isLoading || contagens.isLoading}
        assuntoInicial={retomarIdUrl || compartilhadaCodigoUrl ? undefined : assuntoIdUrl}
        onIniciar={(f) => {
          setRetomar(null);
          setPastaEscolhidaId(null);
          setFiltrosAtivos(f);
          setEtapa(usuario ? "pasta" : "sessao");
        }}
      />
    </AppShell>
  );
}

function EscolherPasta({
  onEscolher,
  onVoltar,
}: {
  onEscolher: (pastaId: string | null) => void;
  onVoltar: () => void;
}) {
  const { usuario } = useSessao();
  const queryClient = useQueryClient();
  const [nome, setNome] = useState("");

  const pastas = useQuery({
    queryKey: ["pastas", usuario?.id],
    queryFn: () => buscarPastas(usuario!.id),
    enabled: !!usuario,
  });

  const criar = useMutation({
    mutationFn: () => criarPasta(usuario!.id, nome.trim()),
    onSuccess: (pasta) => {
      queryClient.invalidateQueries({ queryKey: ["pastas"] });
      onEscolher(pasta.id);
    },
  });

  return (
    <AppShell titulo="Escolher pasta" descricao="Em qual pasta você quer guardar essa sessão?">
      <button onClick={onVoltar} className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <ArrowLeft className="size-3.5" /> ajustar filtros
      </button>

      {pastas.data?.length ? (
        <div className="mt-4 space-y-2">
          {pastas.data.map((p) => (
            <button
              key={p.id}
              onClick={() => onEscolher(p.id)}
              className="flex w-full items-center justify-between rounded-xl border border-border/70 bg-card px-4 py-3 text-left text-sm font-medium"
            >
              {p.nome}
              <ChevronRight className="size-4 text-primary" />
            </button>
          ))}
        </div>
      ) : null}

      <div className="mt-4 rounded-2xl border border-border/60 bg-card p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Criar pasta nova</p>
        <div className="mt-2 flex gap-2">
          <input
            value={nome}
            onChange={(e) => setNome(e.target.value)}
            placeholder="Nome da pasta"
            className="flex-1 rounded-xl border border-border/70 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <button
            onClick={() => nome.trim() && criar.mutate()}
            disabled={!nome.trim() || criar.isPending}
            className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-50"
          >
            {criar.isPending ? "Criando..." : "Criar"}
          </button>
        </div>
      </div>

      <button
        onClick={() => onEscolher(null)}
        className="mt-4 w-full rounded-xl border border-border/70 px-4 py-3 text-center text-sm font-medium text-muted-foreground"
      >
        Continuar sem escolher (cria uma pasta automática com o nome da sessão)
      </button>
    </AppShell>
  );
}

function Bloco({ titulo, ajuda, children }: { titulo: string; ajuda?: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-border/60 bg-card p-4">
      <p className="font-display text-sm font-semibold text-foreground">{titulo}</p>
      {ajuda ? <p className="mt-0.5 text-[11px] text-muted-foreground">{ajuda}</p> : null}
      <div className="mt-3 space-y-2">{children}</div>
    </section>
  );
}

function Chip({ rotulo, ativo, onClick }: { rotulo: string; ativo: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      aria-pressed={ativo}
      className={cn(
        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
        ativo ? "border-primary bg-primary/10 text-primary" : "border-border/70 text-muted-foreground",
      )}
    >
      {rotulo}
    </button>
  );
}

function SessaoQuestoes({
  filtros,
  retomar,
  pastaId,
  onVoltar,
  tax,
}: {
  filtros: FiltrosSessao;
  retomar?: SessaoSalva | null;
  pastaId?: string | null;
  onVoltar: () => void;
  tax: {
    areas: { id: string; nome: string }[];
    especialidades: { id: string; nome: string }[];
    assuntos: { id: string; nome: string }[];
  };
}) {
  const { usuario } = useSessao();
  const { ehAdmin } = useEhAdmin();
  const queryClient = useQueryClient();
  const cron = useCronometro(true);
  const [editandoAdmin, setEditandoAdmin] = useState(false);
  const [modalReportar, setModalReportar] = useState(false);
  const [motivosReporte, setMotivosReporte] = useState<string[]>([]);
  const [motivoReporte, setMotivoReporte] = useState("");
  const [reporteEnviado, setReporteEnviado] = useState(false);
  const [pastaAutoId, setPastaAutoId] = useState<string | null>(null);
  const [modalCompartilhar, setModalCompartilhar] = useState(false);
  const [codigoGerado, setCodigoGerado] = useState<string | null>(null);
  const [copiado, setCopiado] = useState(false);

  const [indice, setIndice] = useState(retomar?.indice ?? 0);
  const [pendente, setPendente] = useState<string | null>(null);
  const [confirmada, setConfirmada] = useState<string | null>(null);
  const [textoAberta, setTextoAberta] = useState("");
  const [mostrarNotas, setMostrarNotas] = useState(false);
  const [nota, setNota] = useState("");
  const [chatAberto, setChatAberto] = useState(false);
  const [inicioQuestao, setInicioQuestao] = useState(0);
  const [respostasSessao, setRespostasSessao] = useState<Record<string, RespostaSalva>>(retomar?.respostas ?? {});
  const [grifosPorQuestao, setGrifosPorQuestao] = useState<Record<string, Grifo[]>>({});
  const [eliminadasPorQuestao, setEliminadasPorQuestao] = useState<Record<string, string[]>>({});

  const sessaoIdRef = useRef(retomar?.id ?? `s-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`);
  const criadaEmRef = useRef(retomar?.criadaEm ?? new Date().toISOString());
  const articleWrapRef = useRef<HTMLDivElement>(null);

  const lista = useQuery({
    queryKey: retomar ? ["questoes-retomada", retomar.id] : ["questoes-sessao", filtros],
    queryFn: () => (retomar ? buscarQuestoesPorIds(retomar.questaoIds) : buscarQuestoesSessao(filtros)),
    // Busca só uma vez por sessão: como a busca embaralha a ordem, refazer
    // essa consulta no meio da sessão (ex: ao trocar de aba) fazia parecer
    // que a questão "pulava" sozinha. Agora a lista fica fixa até sair da sessão.
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnReconnect: false,
  });
  const anotacoes = useQuery({
    queryKey: ["anotacoes"],
    queryFn: buscarAnotacoes,
    enabled: !!usuario,
  });

  const questoes = lista.data ?? [];
  const questao: QuestaoDb | undefined = questoes[indice];
  const avaliacao = useQuery({
    queryKey: ["avaliacao-questao", usuario?.id, questao?.id],
    queryFn: () => buscarAvaliacaoQuestao(questao!.id),
    enabled: !!usuario && !!questao,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });
  const contagemAvaliacao = useQuery({
    queryKey: ["contagem-avaliacoes-questao", questao?.id],
    queryFn: () => buscarContagemAvaliacaoQuestao(questao!.id),
    enabled: !!usuario && !!questao,
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
  });

  const tema = useMemo(() => {
    if (!questao) return "Medicina";
    return (
      tax.assuntos.find((a) => a.id === questao.assunto_id)?.nome ??
      tax.especialidades.find((e) => e.id === questao.especialidade_id)?.nome ??
      tax.areas.find((a) => a.id === questao.area_id)?.nome ??
      "Medicina"
    );
  }, [questao, tax]);

  const rotuloSessao = useMemo(() => {
    if (retomar?.rotulo) return retomar.rotulo;
    const primeiraQuestao = questoes[0];
    const nome = primeiraQuestao
      ? (tax.assuntos.find((a) => a.id === primeiraQuestao.assunto_id)?.nome ??
        tax.especialidades.find((e) => e.id === primeiraQuestao.especialidade_id)?.nome ??
        tax.areas.find((a) => a.id === primeiraQuestao.area_id)?.nome)
      : null;
    return `${nome ?? "Sessão personalizada"} · ${questoes.length} questões`;
  }, [retomar, questoes, tax]);

  // A pasta final da sessão: a que foi escolhida antes de começar, a que já
  // veio salva (ao retomar), ou uma pasta automática criada com o nome da sessão.
  const pastaIdFinal = retomar?.pastaId ?? pastaId ?? pastaAutoId;

  useEffect(() => {
    if (retomar || pastaId || pastaAutoId || !usuario || !questoes.length) return;
    criarPasta(usuario.id, rotuloSessao)
      .then((p) => setPastaAutoId(p.id))
      .catch(() => {
        /* se falhar, a sessão continua sem pasta; tenta de novo depois */
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [retomar, pastaId, pastaAutoId, usuario, questoes.length, rotuloSessao]);

  // Salva o estado da sessão (progresso, respostas e pendentes) automaticamente.
  useEffect(() => {
    if (!questoes.length || !usuario) return;
    salvarSessaoLocal(
      {
        id: sessaoIdRef.current,
        rotulo: rotuloSessao,
        criadaEm: criadaEmRef.current,
        atualizadaEm: new Date().toISOString(),
        filtros,
        questaoIds: questoes.map((q) => q.id),
        indice,
        respostas: respostasSessao,
        segundos: cron.segundos,
        pastaId: pastaIdFinal,
      },
      usuario.id,
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questoes.length, indice, respostasSessao, rotuloSessao, pastaIdFinal, usuario]);

  const gerarExplicacao = useServerFn(gerarExplicacaoQuestao);
  const ia = useMutation({
    mutationFn: async (vars: { questaoId: string; enunciado: string; alternativas: string[]; correta: string }) => {
      const { explicacao } = await gerarExplicacao({
        data: { enunciado: vars.enunciado, alternativas: vars.alternativas, correta: vars.correta },
      });
      if (!explicacao) throw new Error("A IA não retornou explicação. Tente novamente.");
      await supabase.rpc("salvar_comentario_ia_questao", {
        p_questao_id: vars.questaoId,
        p_comentario: explicacao,
      });
      return { questaoId: vars.questaoId, explicacao };
    },
    onSuccess: ({ questaoId, explicacao }) => {
      queryClient.setQueryData<QuestaoDb[]>(
        retomar ? ["questoes-retomada", retomar.id] : ["questoes-sessao", filtros],
        (antigo) =>
          antigo?.map((q) => (q.id === questaoId && !q.comentario ? { ...q, comentario: explicacao } : q)),
      );
    },
  });

  const registrar = useMutation({
    mutationFn: (vars: { questaoId: string; letra: string; correta: boolean; tempo: number }) =>
      salvarResposta({
        userId: usuario!.id,
        questaoId: vars.questaoId,
        letra: vars.letra,
        correta: vars.correta,
        tempoSegundos: vars.tempo,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["respostas"] });
      queryClient.invalidateQueries({ queryKey: ["metricas"] });
      queryClient.invalidateQueries({ queryKey: ["status-plano"] });
    },
  });

  const avaliarQuestao = useMutation({
    mutationFn: ({ questaoId, valor }: { questaoId: string; valor: AvaliacaoQuestao; valorAnterior: AvaliacaoQuestao }) =>
      salvarAvaliacaoQuestao({ userId: usuario!.id, questaoId, valor }),
    onMutate: async ({ questaoId, valor, valorAnterior }) => {
      const chaveAvaliacao = ["avaliacao-questao", usuario!.id, questaoId] as const;
      const chaveContagem = ["contagem-avaliacoes-questao", questaoId] as const;

      await Promise.all([
        queryClient.cancelQueries({ queryKey: chaveAvaliacao }),
        queryClient.cancelQueries({ queryKey: chaveContagem }),
      ]);

      const avaliacaoAnterior = queryClient.getQueryData<AvaliacaoQuestao>(chaveAvaliacao);
      const contagemAnterior = queryClient.getQueryData<ContagemAvaliacaoQuestao>(chaveContagem);

      queryClient.setQueryData(chaveAvaliacao, valor);
      queryClient.setQueryData<ContagemAvaliacaoQuestao>(chaveContagem, (atual) => {
        let gostei = atual?.gostei ?? 0;
        let naoGostei = atual?.naoGostei ?? 0;
        if (valorAnterior === 1) gostei = Math.max(0, gostei - 1);
        if (valorAnterior === -1) naoGostei = Math.max(0, naoGostei - 1);
        if (valor === 1) gostei += 1;
        if (valor === -1) naoGostei += 1;
        return { gostei, naoGostei };
      });

      return { avaliacaoAnterior, contagemAnterior };
    },
    onError: (_erro, { questaoId }, contexto) => {
      queryClient.setQueryData(
        ["avaliacao-questao", usuario!.id, questaoId],
        contexto?.avaliacaoAnterior,
      );
      queryClient.setQueryData(
        ["contagem-avaliacoes-questao", questaoId],
        contexto?.contagemAnterior,
      );
    },
    onSettled: (_valor, _erro, { questaoId }) => {
      queryClient.invalidateQueries({ queryKey: ["avaliacao-questao", usuario!.id, questaoId] });
      queryClient.invalidateQueries({ queryKey: ["contagem-avaliacoes-questao", questaoId] });
    },
  });

  const gravarNota = useMutation({
    mutationFn: (vars: { questaoId: string; texto: string }) => salvarAnotacao({ userId: usuario!.id, ...vars }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["anotacoes"] }),
  });

  const compartilhar = useMutation({
    mutationFn: () =>
      compartilharSessao({
        titulo: rotuloSessao,
        questaoIds: questoes.map((q) => q.id),
        criadoPor: usuario!.id,
      }),
    onSuccess: (codigo) => setCodigoGerado(codigo),
  });

  const motivoFinal = [...motivosReporte, motivoReporte.trim()].filter(Boolean).join(" — ");

  const reportar = useMutation({
    mutationFn: () =>
      reportarQuestao({
        questaoId: questao!.id,
        reportadoPor: usuario!.id,
        reportadoPorEmail: usuario!.email ?? null,
        motivo: motivoFinal,
      }),
    onSuccess: () => setReporteEnviado(true),
  });

  function fecharModalReportar() {
    setModalReportar(false);
    setMotivosReporte([]);
    setMotivoReporte("");
    setReporteEnviado(false);
    reportar.reset();
  }

  function alternarMotivoReporte(motivo: string) {
    setMotivosReporte((v) => (v.includes(motivo) ? v.filter((m) => m !== motivo) : [...v, motivo]));
  }

  function alternarAvaliacao(valor: 1 | -1) {
    if (!usuario || !questao || avaliarQuestao.isPending || avaliacao.isLoading) return;
    avaliarQuestao.mutate({
      questaoId: questao.id,
      valor: avaliacao.data === valor ? null : valor,
      valorAnterior: avaliacao.data ?? null,
    });
  }

  function confirmar(letra: string) {
    if (!questao) return;
    setConfirmada(letra);
    const acertou = letra.trim().toUpperCase() === questao.correta.trim().toUpperCase();
    setRespostasSessao((prev) => ({ ...prev, [questao.id]: { letra, correta: acertou } }));
    if (usuario) {
      registrar.mutate({
        questaoId: questao.id,
        letra,
        correta: acertou,
        tempo: Math.max(0, cron.segundos - inicioQuestao),
      });
    }
  }

  function irPara(alvo: number) {
    if (!questoes.length) return;
    const novo = ((alvo % questoes.length) + questoes.length) % questoes.length;
    setPendente(null);
    setConfirmada(null);
    setTextoAberta("");
    setNota("");
    setMostrarNotas(false);
    setChatAberto(false);
    ia.reset();
    avaliarQuestao.reset();
    setInicioQuestao(cron.segundos);
    setIndice(novo);
  }

  function proxima() {
    irPara(indice + 1);
  }

  function anterior() {
    irPara(indice - 1);
  }

  // Ao trocar de questão, mostra a resposta já dada nela (se houver).
  useEffect(() => {
    if (!questao) return;
    const salva = respostasSessao[questao.id];
    setConfirmada(salva ? salva.letra : null);
    setPendente(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [questao?.id]);

  const notaSalva = questao ? (anotacoes.data?.[questao.id] ?? "") : "";
  const grifos = questao ? (grifosPorQuestao[questao.id] ?? []) : [];
  const eliminadas = questao ? (eliminadasPorQuestao[questao.id] ?? []) : [];

  function alternarEliminada(letra: string) {
    if (!questao) return;
    const atuais = eliminadasPorQuestao[questao.id] ?? [];
    const novas = atuais.includes(letra) ? atuais.filter((l) => l !== letra) : [...atuais, letra];
    setEliminadasPorQuestao((prev) => ({ ...prev, [questao.id]: novas }));
  }

  function fecharModalCompartilhar() {
    setModalCompartilhar(false);
    setCodigoGerado(null);
    setCopiado(false);
  }

  function copiar(texto: string) {
    navigator.clipboard?.writeText(texto).then(() => {
      setCopiado(true);
      setTimeout(() => setCopiado(false), 2000);
    });
  }

  return (
    <AppShell titulo="Sessão de questões">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <button onClick={onVoltar} className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
          <ArrowLeft className="size-3.5" /> ajustar filtros
        </button>

        <div className="flex items-center gap-2">
          {usuario && questoes.length ? (
            <button
              onClick={() => setModalCompartilhar(true)}
              className="flex items-center gap-1.5 rounded-full border border-border/70 px-3 py-1.5 text-xs font-medium text-foreground"
            >
              <Share2 className="size-3.5 text-primary" /> Compartilhar
            </button>
          ) : null}
          {/* O Modo Foco oculta o cronômetro se estiver ativado */}
          {!filtros.modoFoco && (
            <Cronometro segundos={cron.segundos} rodando={cron.rodando} onAlternar={cron.alternar} />
          )}
        </div>
      </div>

      {!filtros.modoFoco && (
        <p className="mt-3 text-xs text-muted-foreground">
          {lista.isLoading
            ? "Montando sua sessão..."
            : questoes.length
              ? `Questão ${indice + 1} de ${questoes.length}`
              : "Nenhuma questão bate com esses filtros."}
        </p>
      )}

      {questoes.length > 1 ? (
        <div className="mt-3 flex items-center justify-between gap-2">
          <button
            onClick={anterior}
            className="flex items-center gap-1 rounded-full border border-border/70 px-3 py-1.5 text-xs font-medium text-foreground"
          >
            <ChevronLeft className="size-3.5" /> Anterior
          </button>
          <button
            onClick={proxima}
            className="flex items-center gap-1 rounded-full border border-border/70 px-3 py-1.5 text-xs font-medium text-foreground"
          >
            Próxima <ChevronRight className="size-3.5" />
          </button>
        </div>
      ) : null}

      {!lista.isLoading && !questoes.length ? (
        <div className="mt-4 rounded-2xl border border-border/60 bg-card p-5">
          <p className="text-sm text-muted-foreground">
            Nenhuma questão para esse recorte. Solte alguns filtros ou importe seu acervo.
          </p>
          <Link
            to="/importar"
            className="mt-4 block rounded-xl bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground"
          >
            Importar questões
          </Link>
        </div>
      ) : null}

      {questao ? (
        <div className="mt-4 space-y-4">
          <PainelResumo tema={tema} />

          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setChatAberto(true)}
              className="flex items-center gap-1.5 rounded-full border border-border/70 px-3 py-1.5 text-xs font-medium text-foreground"
            >
              <MessageCircleQuestion className="size-3.5 text-primary" /> Tirar dúvida com IA
            </button>
            <button
              onClick={() => {
                setNota(notaSalva);
                setMostrarNotas((v) => !v);
              }}
              className="flex items-center gap-1.5 rounded-full border border-border/70 px-3 py-1.5 text-xs font-medium text-foreground"
            >
              <NotebookPen className="size-3.5 text-primary" /> Minhas anotações
            </button>
          </div>

          {mostrarNotas ? (
            <div className="rounded-2xl border border-border/60 bg-card p-4">
              {usuario ? (
                <>
                  <textarea
                    value={nota}
                    onChange={(e) => setNota(e.target.value)}
                    rows={4}
                    placeholder="Anote o raciocínio, o macete, o que revisar..."
                    className="w-full resize-none rounded-xl border border-border/70 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                  <button
                    onClick={() => gravarNota.mutate({ questaoId: questao.id, texto: nota })}
                    disabled={gravarNota.isPending}
                    className="mt-2 rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
                  >
                    {gravarNota.isPending ? "Salvando..." : "Salvar anotação"}
                  </button>
                </>
              ) : (
                <p className="text-xs text-muted-foreground">
                  <Link to="/auth" className="underline">
                    Entre na sua conta
                  </Link>{" "}
                  para salvar anotações.
                </p>
              )}
            </div>
          ) : null}

          <LimiteErro>
            <div ref={articleWrapRef} className="relative">
              <article className="rounded-2xl border border-border/60 bg-card p-5">
                <div className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-wide text-muted-foreground">
                  <span className="rounded-full bg-primary/15 px-2 py-0.5 text-primary">{tema}</span>
                  <span>· {rotuloTipo[questao.tipo]}</span>
                  {questao.banca ? (
                    <span>
                      · {questao.banca} {questao.ano ?? ""}
                    </span>
                  ) : null}
                  {questao.anulada ? (
                    <span className="rounded-full bg-destructive/15 px-2 py-0.5 text-destructive">Anulada</span>
                  ) : null}
                  {questao.desatualizada ? (
                    <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-amber-600">Desatualizada</span>
                  ) : null}
                  {usuario ? (
                    <button
                      onClick={() => setModalReportar(true)}
                      className={
                        ehAdmin
                          ? "flex items-center gap-1 rounded-full border border-border/60 px-2 py-0.5 text-muted-foreground"
                          : "ml-auto flex items-center gap-1 rounded-full border border-border/60 px-2 py-0.5 text-muted-foreground"
                      }
                    >
                      <Flag className="size-3" /> Reportar problema
                    </button>
                  ) : null}
                  {ehAdmin ? (
                    <button
                      onClick={() => setEditandoAdmin(true)}
                      className="ml-auto rounded-full border border-primary/50 px-2 py-0.5 text-primary"
                    >
                      Editar questão (admin)
                    </button>
                  ) : null}
                </div>

                {usuario ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2" aria-label="Avaliação da questão">
                    <span className="mr-1 text-xs text-muted-foreground">Esta questão foi útil?</span>
                    <button
                      type="button"
                      onClick={() => alternarAvaliacao(1)}
                      disabled={avaliacao.isLoading || avaliarQuestao.isPending}
                      aria-pressed={avaliacao.data === 1}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60",
                        avaliacao.data === 1
                          ? "border-success bg-success/15 text-success"
                          : "border-border/70 text-muted-foreground hover:border-success/60 hover:text-success",
                      )}
                    >
                      <ThumbsUp className="size-3.5" /> Gostei
                      <span className="tabular-nums opacity-80">
                        {contagemAvaliacao.data
                          ? contagemAvaliacao.data.gostei.toLocaleString("pt-BR")
                          : null}
                      </span>
                    </button>
                    <button
                      type="button"
                      onClick={() => alternarAvaliacao(-1)}
                      disabled={avaliacao.isLoading || avaliarQuestao.isPending}
                      aria-pressed={avaliacao.data === -1}
                      className={cn(
                        "flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors disabled:opacity-60",
                        avaliacao.data === -1
                          ? "border-destructive bg-destructive/15 text-destructive"
                          : "border-border/70 text-muted-foreground hover:border-destructive/60 hover:text-destructive",
                      )}
                    >
                      <ThumbsDown className="size-3.5" /> Não gostei
                      <span className="tabular-nums opacity-80">
                        {contagemAvaliacao.data
                          ? contagemAvaliacao.data.naoGostei.toLocaleString("pt-BR")
                          : null}
                      </span>
                    </button>
                    {avaliarQuestao.isError ? (
                      <span className="text-[11px] text-destructive">Não foi possível salvar. Tente novamente.</span>
                    ) : null}
                  </div>
                ) : null}

                {questao.imagem_url ? (
                  <img
                    src={questao.imagem_url}
                    alt="Imagem da questão"
                    className="mt-3 max-h-80 w-full rounded-xl border border-border/60 object-contain"
                  />
                ) : null}

                <TextoGrifavel
                  texto={questao.enunciado}
                  grifos={grifos}
                  onGrifosChange={(novos) => setGrifosPorQuestao((prev) => ({ ...prev, [questao.id]: novos }))}
                />

                {questao.tipo === "aberta" ? (
                  <div className="mt-4">
                    <textarea
                      value={textoAberta}
                      onChange={(e) => setTextoAberta(e.target.value)}
                      disabled={!!confirmada}
                      rows={4}
                      placeholder="Escreva sua resposta..."
                      className="w-full resize-none rounded-xl border border-border/70 bg-surface px-3 py-2 text-sm outline-none focus:border-primary disabled:opacity-70"
                    />
                    {!confirmada ? (
                      <button
                        onClick={() => setConfirmada("aberta")}
                        disabled={!textoAberta.trim()}
                        className="mt-3 w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                      >
                        Confirmar resposta
                      </button>
                    ) : null}
                  </div>
                ) : (
                  <>
                    <ul className="mt-4 space-y-2">
                      {questao.alternativas.map((alt) => {
                        const eCorreta = alt.letra.toUpperCase() === questao.correta.toUpperCase();
                        const marcada = (confirmada ?? pendente) === alt.letra;
                        const eliminada = eliminadas.includes(alt.letra);
                        return (
                          <li key={alt.letra} className="flex items-center gap-2">
                            <button
                              onClick={() => !confirmada && setPendente(alt.letra)}
                              disabled={!!confirmada}
                              className={cn(
                                "flex flex-1 items-start gap-3 rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                                eliminada && !confirmada && "opacity-40",
                                !confirmada && !marcada && "border-border/70 hover:border-primary/60",
                                !confirmada && marcada && "border-primary bg-primary/10",
                                confirmada && eCorreta && "border-success bg-success/10",
                                confirmada && marcada && !eCorreta && "border-destructive bg-destructive/10",
                                confirmada && !eCorreta && !marcada && "border-border/50 opacity-60",
                              )}
                            >
                              <span className="mt-0.5 font-display text-xs font-semibold text-muted-foreground">
                                {alt.letra}
                              </span>
                              <span className={cn("flex-1", eliminada && !confirmada && "line-through")}>
                                {alt.texto}
                              </span>
                              {confirmada && eCorreta ? <Check className="size-4 text-success" /> : null}
                              {confirmada && marcada && !eCorreta ? <X className="size-4 text-destructive" /> : null}
                            </button>
                            {!confirmada ? (
                              <button
                                onClick={() => alternarEliminada(alt.letra)}
                                aria-pressed={eliminada}
                                title={eliminada ? "Desfazer eliminação" : "Eliminar alternativa"}
                                className={cn(
                                  "shrink-0 rounded-lg border p-2",
                                  eliminada
                                    ? "border-destructive bg-destructive/10 text-destructive"
                                    : "border-border/60 text-muted-foreground",
                                )}
                              >
                                <X className="size-3.5" />
                              </button>
                            ) : null}
                          </li>
                        );
                      })}
                    </ul>

                    {!confirmada ? (
                      <button
                        onClick={() => pendente && confirmar(pendente)}
                        disabled={!pendente}
                        className="mt-4 w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
                      >
                        {pendente ? `Confirmar alternativa ${pendente}` : "Selecione uma alternativa"}
                      </button>
                    ) : null}
                  </>
                )}

                {confirmada ? (
                  <div className="mt-5 space-y-4">
                    <div className="rounded-xl border border-border/60 bg-surface p-4">
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                        Gabarito {questao.correta}
                      </p>
                      {questao.comentario ? (
                        <div className="mt-2 space-y-2 text-sm leading-relaxed text-muted-foreground">
                          {questao.comentario
                            .split("\n")
                            .filter((l) => l.trim())
                            .map((linha, i) => (
                              <p key={i}>{linha.replace(/^[*#\s]+/, "")}</p>
                            ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-sm text-muted-foreground">
                          Sem comentário cadastrado — gere a explicação da IA abaixo.
                        </p>
                      )}
                    </div>

                    {!questao.comentario ? (
                      <button
                        onClick={() =>
                          ia.mutate({
                            questaoId: questao.id,
                            enunciado: questao.enunciado,
                            alternativas: questao.alternativas.length
                              ? questao.alternativas.map((a) => `${a.letra}) ${a.texto}`)
                              : ["Questão aberta", "Sem alternativas"],
                            correta: questao.correta,
                          })
                        }
                        disabled={ia.isPending}
                        className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-70"
                      >
                        {ia.isPending ? <Loader2 className="size-4 animate-spin" /> : <Brain className="size-4" />}
                        {ia.isPending ? "Gerando explicação..." : "Explicação por IA"}
                      </button>
                    ) : null}

                    {ia.isError ? (
                      <p className="rounded-xl border border-destructive/60 bg-destructive/10 p-3 text-xs text-destructive">
                        {(ia.error as Error).message || "Erro ao gerar explicação. Tente novamente."}
                      </p>
                    ) : null}

                    <button
                      onClick={proxima}
                      className="flex w-full items-center justify-center gap-1 rounded-xl border border-border/70 px-4 py-3 text-sm font-medium text-foreground"
                    >
                      Próxima questão <ChevronRight className="size-4" />
                    </button>

                    {!usuario ? (
                      <p className="text-center text-xs text-muted-foreground">
                        <Link to="/auth" className="underline">
                          Entre na sua conta
                        </Link>{" "}
                        para salvar seu desempenho.
                      </p>
                    ) : null}
                  </div>
                ) : null}
              </article>
              <AnotacaoDesenho key={questao.id} alvoRef={articleWrapRef as React.RefObject<HTMLElement>} />
            </div>
          </LimiteErro>
        </div>
      ) : null}

      {chatAberto && questao ? (
        <ChatDuvidas
          contexto={`Tema: ${tema}\nEnunciado: ${questao.enunciado}\nAlternativas: ${questao.alternativas
            .map((a) => `${a.letra}) ${a.texto}`)
            .join(" | ")}`}
          onFechar={() => setChatAberto(false)}
        />
      ) : null}

      {editandoAdmin && questao ? (
        <EditarQuestaoAdmin questao={questao} onFechar={() => setEditandoAdmin(false)} />
      ) : null}

      {modalCompartilhar ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
          <div className="w-full max-w-sm rounded-t-2xl bg-card p-5 sm:rounded-2xl">
            <div className="flex items-center justify-between">
              <p className="font-display text-sm font-semibold">Compartilhar sessão</p>
              <button onClick={fecharModalCompartilhar} className="rounded-lg border border-border/60 p-1.5">
                <X className="size-4" />
              </button>
            </div>

            {!codigoGerado ? (
              <>
                <p className="mt-2 text-xs text-muted-foreground">
                  Gera um código que seu colega usa pra abrir uma sessão com exatamente estas mesmas {questoes.length}{" "}
                  questões — cada um responde por conta própria, sem afetar o desempenho um do outro.
                </p>
                <button
                  onClick={() => compartilhar.mutate()}
                  disabled={compartilhar.isPending}
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {compartilhar.isPending ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />}
                  {compartilhar.isPending ? "Gerando código..." : "Gerar código"}
                </button>
                {compartilhar.isError ? (
                  <p className="mt-2 text-xs text-destructive">{(compartilhar.error as Error).message}</p>
                ) : null}
              </>
            ) : (
              <div className="mt-4 space-y-3">
                <div className="rounded-xl border border-primary/40 bg-primary/10 p-4 text-center">
                  <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Código</p>
                  <p className="mt-1 font-display text-2xl font-bold tracking-wider text-primary">{codigoGerado}</p>
                </div>
                <button
                  onClick={() => copiar(codigoGerado)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-border/70 px-4 py-2.5 text-xs font-semibold text-foreground"
                >
                  <Copy className="size-3.5" /> {copiado ? "Copiado!" : "Copiar código"}
                </button>
                <button
                  onClick={() => copiar(`${window.location.origin}/questoes?compartilhada=${codigoGerado}`)}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-border/70 px-4 py-2.5 text-xs font-semibold text-foreground"
                >
                  <Copy className="size-3.5" /> Copiar link
                </button>
                <p className="text-center text-[11px] text-muted-foreground">
                  Seu colega pode colar o código na tela inicial de Questões, ou abrir o link direto.
                </p>
              </div>
            )}
          </div>
        </div>
      ) : null}

      {modalReportar && questao ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
          <div className="w-full max-w-sm rounded-t-2xl bg-card p-5 sm:rounded-2xl">
            <div className="flex items-center justify-between">
              <p className="flex items-center gap-2 font-display text-sm font-semibold">
                <AlertTriangle className="size-4 text-amber-500" /> Reportar problema
              </p>
              <button onClick={fecharModalReportar} className="rounded-lg border border-border/60 p-1.5">
                <X className="size-4" />
              </button>
            </div>

            {reporteEnviado ? (
              <p className="mt-4 text-sm text-success">Reportado! A equipe vai revisar essa questão em breve.</p>
            ) : (
              <>
                <p className="mt-2 text-xs text-muted-foreground">Marque o que se aplica (pode marcar mais de um):</p>
                <div className="mt-2 space-y-2">
                  {MOTIVOS_REPORTE.map((motivo) => (
                    <label
                      key={motivo}
                      className="flex items-center gap-2 rounded-xl border border-border/60 px-3 py-2.5 text-sm"
                    >
                      <input
                        type="checkbox"
                        checked={motivosReporte.includes(motivo)}
                        onChange={() => alternarMotivoReporte(motivo)}
                        className="size-4 accent-primary"
                      />
                      {motivo}
                    </label>
                  ))}
                </div>
                <p className="mt-3 text-xs text-muted-foreground">Outro problema? Descreva aqui (opcional):</p>
                <textarea
                  value={motivoReporte}
                  onChange={(e) => setMotivoReporte(e.target.value)}
                  rows={3}
                  placeholder="Descreva o problema..."
                  className="mt-2 w-full resize-none rounded-xl border border-border/70 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
                />
                {reportar.isError ? (
                  <p className="mt-2 text-xs text-destructive">{(reportar.error as Error).message}</p>
                ) : null}
                <button
                  onClick={() => motivoFinal && reportar.mutate()}
                  disabled={!motivoFinal || reportar.isPending}
                  className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
                >
                  {reportar.isPending ? <Loader2 className="size-4 animate-spin" /> : <Flag className="size-4" />}
                  {reportar.isPending ? "Enviando..." : "Enviar reporte"}
                </button>
              </>
            )}
          </div>
        </div>
      ) : null}
    </AppShell>
  );
}
