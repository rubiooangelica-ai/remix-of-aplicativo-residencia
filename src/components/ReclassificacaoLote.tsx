import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Download, Loader2, Pause, Play, RefreshCw } from "lucide-react";
import {
  criarTrabalhoReclassificacao,
  definirEstadoTrabalhoReclassificacao,
  listarTrabalhosReclassificacao,
  processarLoteAgora,
  relatorioReclassificacaoCsv,
} from "@/lib/reclassificacao.functions";

type Combinacao = { area: string; tema: string; assunto: string };

/** Aceita [{area,tema,assunto}] ou {"Área":{"Tema":["Assunto"]}} */
function lerTaxonomia(texto: string): Combinacao[] {
  const bruto = texto.trim();
  if (!bruto) return [];
  const json = JSON.parse(bruto) as unknown;
  if (Array.isArray(json)) {
    return json.map((c) => {
      const o = c as Record<string, string>;
      const area = (o["area"] ?? o["área"] ?? "").trim();
      const tema = (o["tema"] ?? "").trim();
      const assunto = (o["assunto"] ?? "").trim();
      if (!area || !tema || !assunto) throw new Error("Cada item precisa ter area, tema e assunto.");
      return { area, tema, assunto };
    });
  }
  const saida: Combinacao[] = [];
  for (const [area, temas] of Object.entries(json as Record<string, unknown>)) {
    for (const [tema, assuntos] of Object.entries(temas as Record<string, unknown>)) {
      for (const assunto of (assuntos as string[]) ?? []) {
        saida.push({ area: area.trim(), tema: tema.trim(), assunto: String(assunto).trim() });
      }
    }
  }
  if (!saida.length) throw new Error("Não encontrei nenhuma combinação área > tema > assunto.");
  return saida;
}

const ROTULOS: Record<string, string> = {
  pausado: "Pausado",
  ativo: "Em processamento",
  concluido: "Concluído",
  falhou: "Falhou",
  bloqueado: "Pausado por falta de créditos de IA",
};

export function ReclassificacaoLote() {
  const queryClient = useQueryClient();
  const criar = useServerFn(criarTrabalhoReclassificacao);
  const listar = useServerFn(listarTrabalhosReclassificacao);
  const definirEstado = useServerFn(definirEstadoTrabalhoReclassificacao);
  const processar = useServerFn(processarLoteAgora);
  const csv = useServerFn(relatorioReclassificacaoCsv);

  const [nome, setNome] = useState("");
  const [taxonomiaTexto, setTaxonomiaTexto] = useState("");
  const [criterio, setCriterio] = useState("");
  const [simulacao, setSimulacao] = useState(true);
  const [amostra, setAmostra] = useState("300");
  const [area, setArea] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);
  const [erroForm, setErroForm] = useState<string | null>(null);

  const trabalhos = useQuery({
    queryKey: ["reclass-trabalhos"],
    queryFn: () => listar(),
    refetchInterval: 5000,
  });

  const criarTrabalho = useMutation({
    mutationFn: async () => {
      const taxonomia = lerTaxonomia(taxonomiaTexto);
      const limite = Number(amostra.trim() || "0");
      return criar({
        data: {
          nome: nome.trim() || "Reclassificação",
          criterio: criterio.trim(),
          taxonomia,
          aplicar: !simulacao,
          ...(Number.isFinite(limite) && limite > 0 ? { limite } : {}),
          ...(area.trim() ? { area: area.trim() } : {}),
        },
      });
    },
    onSuccess: (r) => {
      setErroForm(null);
      setAviso(`Trabalho criado com ${r.questoes_na_fila} questões na fila. Clique em iniciar.`);
      setNome("");
      queryClient.invalidateQueries({ queryKey: ["reclass-trabalhos"] });
    },
    onError: (e) => setErroForm(e instanceof Error ? e.message : "Erro ao criar o trabalho."),
  });

  const mudarEstado = useMutation({
    mutationFn: (v: { job_id: string; status: "ativo" | "pausado" }) => definirEstado({ data: v }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reclass-trabalhos"] }),
  });

  const rodarLote = useMutation({
    mutationFn: (job_id: string) => processar({ data: { job_id } }),
    onSuccess: (r) => {
      setAviso(r.mensagem);
      queryClient.invalidateQueries({ queryKey: ["reclass-trabalhos"] });
    },
    onError: (e) => setAviso(e instanceof Error ? e.message : "Erro ao processar o lote."),
  });

  const baixarCsv = useMutation({
    mutationFn: (job_id: string) => csv({ data: { job_id, apenas_alterados: false } }),
    onSuccess: (r) => {
      const url = URL.createObjectURL(new Blob([r.csv], { type: "text/csv;charset=utf-8" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "reclassificacao.csv";
      a.click();
      URL.revokeObjectURL(url);
    },
    onError: (e) => setAviso(e instanceof Error ? e.message : "Erro ao gerar o CSV."),
  });

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border/60 bg-card p-4">
        <h2 className="text-sm font-semibold">Novo trabalho</h2>
        <p className="mt-1 text-xs text-muted-foreground">
          A IA lê o conteúdo de cada questão e propõe área, tema e assunto. Em modo simulação nada é
          gravado no banco — só o relatório de proposta.
        </p>

        <label className="mt-4 block text-xs font-medium text-muted-foreground">Nome</label>
        <input
          value={nome}
          onChange={(e) => setNome(e.target.value)}
          placeholder="Ex.: Piloto Clínica Médica"
          className="mt-1 w-full rounded-xl border border-border/70 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
        />

        <label className="mt-3 block text-xs font-medium text-muted-foreground">
          Árvore de taxonomia nova (JSON)
        </label>
        <textarea
          value={taxonomiaTexto}
          onChange={(e) => setTaxonomiaTexto(e.target.value)}
          rows={7}
          placeholder={'{"Clínica Médica": {"Cardiologia": ["Hipertensão Arterial Sistêmica"]}}'}
          className="mt-1 w-full rounded-xl border border-border/70 bg-surface px-3 py-2 font-mono text-xs outline-none focus:border-primary"
        />
        <label className="mt-2 flex cursor-pointer items-center gap-2 text-xs text-muted-foreground">
          <input
            type="file"
            accept=".json,application/json"
            className="text-xs"
            onChange={async (e) => {
              const arquivo = e.target.files?.[0];
              if (arquivo) setTaxonomiaTexto(await arquivo.text());
            }}
          />
        </label>

        <label className="mt-3 block text-xs font-medium text-muted-foreground">
          Critério de classificação
        </label>
        <textarea
          value={criterio}
          onChange={(e) => setCriterio(e.target.value)}
          rows={4}
          placeholder="Explique como decidir o tema quando a questão citar mais de um assunto..."
          className="mt-1 w-full rounded-xl border border-border/70 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
        />

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-muted-foreground">
              Amostra (0 = tudo)
            </label>
            <input
              value={amostra}
              onChange={(e) => setAmostra(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              className="mt-1 w-full rounded-xl border border-border/70 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-muted-foreground">
              Só uma área (opcional)
            </label>
            <input
              value={area}
              onChange={(e) => setArea(e.target.value)}
              placeholder="Ex.: Clínica Médica"
              className="mt-1 w-full rounded-xl border border-border/70 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </div>
        </div>

        <button
          type="button"
          onClick={() => setSimulacao((v) => !v)}
          className="mt-4 flex w-full items-center justify-between rounded-xl border border-border/70 bg-surface px-3 py-3 text-left"
        >
          <span>
            <span className="block text-sm font-medium">Modo simulação</span>
            <span className="block text-xs text-muted-foreground">
              {simulacao ? "Nada será gravado no banco." : "Atenção: as questões serão reclassificadas."}
            </span>
          </span>
          <span
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${simulacao ? "bg-primary" : "bg-border"}`}
          >
            <span
              className={`absolute top-0.5 size-5 rounded-full bg-background transition-all ${simulacao ? "left-[22px]" : "left-0.5"}`}
            />
          </span>
        </button>

        <button
          onClick={() => criarTrabalho.mutate()}
          disabled={!taxonomiaTexto.trim() || criarTrabalho.isPending}
          className="mt-4 w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
        >
          {criarTrabalho.isPending ? "Montando a fila..." : "Criar trabalho"}
        </button>
        {erroForm ? <p className="mt-2 text-xs text-destructive">{erroForm}</p> : null}
        {aviso ? <p className="mt-2 text-xs text-primary">{aviso}</p> : null}
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Acompanhamento</h2>
          <button
            onClick={() => trabalhos.refetch()}
            className="flex items-center gap-1 text-xs text-muted-foreground"
          >
            <RefreshCw className="size-3.5" /> Atualizar
          </button>
        </div>

        {trabalhos.isLoading ? (
          <p className="mt-3 text-xs text-muted-foreground">Carregando...</p>
        ) : !trabalhos.data?.trabalhos.length ? (
          <p className="mt-3 text-xs text-muted-foreground">Nenhum trabalho criado ainda.</p>
        ) : (
          <ul className="mt-3 space-y-3">
            {trabalhos.data.trabalhos.map((t) => {
              const total = t.total || 0;
              const feitas = t.processadas || 0;
              const faltam = Math.max(total - feitas, 0);
              const pct = total ? Math.round((feitas / total) * 100) : 0;
              return (
                <li key={t.id} className="rounded-xl border border-border/60 bg-surface p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold">{t.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {ROTULOS[t.status] ?? t.status} · {t.aplicar ? "gravando no banco" : "simulação"}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1">
                      {t.status === "ativo" ? (
                        <button
                          onClick={() => mudarEstado.mutate({ job_id: t.id, status: "pausado" })}
                          className="rounded-lg border border-border/70 p-2"
                          aria-label="Pausar"
                        >
                          <Pause className="size-4" />
                        </button>
                      ) : (
                        <button
                          onClick={() => mudarEstado.mutate({ job_id: t.id, status: "ativo" })}
                          className="rounded-lg bg-primary p-2 text-primary-foreground"
                          aria-label="Iniciar processamento"
                        >
                          <Play className="size-4" />
                        </button>
                      )}
                      <button
                        onClick={() => baixarCsv.mutate(t.id)}
                        className="rounded-lg border border-border/70 p-2"
                        aria-label="Baixar CSV"
                      >
                        {baixarCsv.isPending && baixarCsv.variables === t.id ? (
                          <Loader2 className="size-4 animate-spin" />
                        ) : (
                          <Download className="size-4" />
                        )}
                      </button>
                    </div>
                  </div>

                  <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-border/60">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {feitas} de {total} processadas · faltam {faltam} · {t.erros} com erro
                  </p>
                  {t.mensagem_erro ? (
                    <p className="mt-1 text-xs text-destructive">{t.mensagem_erro}</p>
                  ) : null}

                  <button
                    onClick={() => rodarLote.mutate(t.id)}
                    disabled={rodarLote.isPending || t.status !== "ativo"}
                    className="mt-2 w-full rounded-lg border border-border/70 px-3 py-2 text-xs font-medium disabled:opacity-50"
                  >
                    {rodarLote.isPending && rodarLote.variables === t.id
                      ? "Processando lote..."
                      : `Processar agora um lote de ${t.tamanho_lote}`}
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
