import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2, FolderSync, Loader2, Play, RefreshCw } from "lucide-react";
import {
  progressoClassificacao,
  rodarLoteClassificacao,
  sincronizarArvoreOficial,
  validarClassificacao,
} from "@/lib/classificacao.functions";

/** Painel da reorganização determinística da taxonomia (regras e palavras-chave, sem IA). */
export function MigracaoTaxonomia() {
  const queryClient = useQueryClient();
  const progresso = useServerFn(progressoClassificacao);
  const validar = useServerFn(validarClassificacao);
  const sincronizar = useServerFn(sincronizarArvoreOficial);
  const rodar = useServerFn(rodarLoteClassificacao);

  const [tamanho, setTamanho] = useState(500);
  const [mensagem, setMensagem] = useState<string | null>(null);

  const status = useQuery({ queryKey: ["class-progresso"], queryFn: () => progresso() });
  const checagem = useQuery({ queryKey: ["class-validacao"], queryFn: () => validar() });

  const atualizar = () => {
    void queryClient.invalidateQueries({ queryKey: ["class-progresso"] });
    void queryClient.invalidateQueries({ queryKey: ["class-validacao"] });
  };

  const lote = useMutation({
    mutationFn: () => rodar({ data: { tamanho_lote: tamanho } }),
    onSuccess: (r) => {
      setMensagem(
        r.processadas === 0
          ? "Nada pendente: todas as questões já estão organizadas."
          : `${r.aplicadas} questões organizadas (alta ${r.alta} · média ${r.media} · baixa ${r.baixa}). Faltam ${r.restantes}.`,
      );
      atualizar();
    },
    onError: (e) => setMensagem(e instanceof Error ? e.message : "Erro desconhecido"),
  });

  const arvore = useMutation({
    mutationFn: () => sincronizar(),
    onSuccess: (r) =>
      setMensagem(
        `Árvore oficial conferida: ${r.combinacoes} combinações (${r.areasCriadas} áreas, ${r.temasCriados} temas e ${r.assuntosCriados} assuntos criados).`,
      ),
    onError: (e) => setMensagem(e instanceof Error ? e.message : "Erro desconhecido"),
  });

  const p = status.data;
  const v = checagem.data;
  const pct = p && p.total > 0 ? Math.round((p.classificadas / p.total) * 100) : 0;

  return (
    <div className="space-y-4">
      <section className="rounded-2xl border border-border/60 bg-card p-4">
        <p className="text-xs text-muted-foreground">
          A organização é feita por regras e expressões clínicas ponderadas, lendo o enunciado, a
          pergunta final e as alternativas. Não usa inteligência artificial e sempre escolhe uma das
          combinações da lista oficial.
        </p>

        <div className="mt-3 grid grid-cols-2 gap-2 text-center text-xs">
          <div className="rounded-xl bg-surface p-3">
            <span className="block text-lg font-semibold">{p?.classificadas ?? "—"}</span>
            organizadas ({pct}%)
          </div>
          <div className="rounded-xl bg-surface p-3">
            <span className="block text-lg font-semibold">{p?.pendentes ?? "—"}</span>
            faltando
          </div>
          <div className="rounded-xl bg-surface p-3">
            <span className="block text-lg font-semibold text-green-400">{p?.alta ?? "—"}</span>
            confiança alta
          </div>
          <div className="rounded-xl bg-surface p-3">
            <span className="block text-lg font-semibold text-amber-400">
              {p ? p.media + p.baixa : "—"}
            </span>
            para revisar
          </div>
        </div>

        <label className="mt-4 block text-xs text-muted-foreground">
          Questões por lote
          <input
            type="number"
            min={1}
            max={1000}
            value={tamanho}
            onChange={(e) => setTamanho(Number(e.target.value) || 500)}
            className="mt-1 w-full rounded-xl border border-border/70 bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-primary"
          />
        </label>

        <div className="mt-3 flex flex-wrap gap-2">
          <button
            onClick={() => lote.mutate()}
            disabled={lote.isPending}
            className="flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {lote.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Play className="size-4" />
            )}
            Organizar um lote agora
          </button>
          <button
            onClick={() => arvore.mutate()}
            disabled={arvore.isPending}
            className="flex items-center gap-2 rounded-xl border border-border/70 px-4 py-2 text-sm disabled:opacity-60"
          >
            {arvore.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <FolderSync className="size-4" />
            )}
            Conferir pastas oficiais
          </button>
          <button
            onClick={atualizar}
            className="flex items-center gap-2 rounded-xl border border-border/70 px-4 py-2 text-sm"
          >
            <RefreshCw className="size-4" /> Atualizar
          </button>
        </div>

        {mensagem ? <p className="mt-3 text-xs text-muted-foreground">{mensagem}</p> : null}
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-4">
        <h3 className="flex items-center gap-2 text-sm font-semibold">
          {v && v.semArea + v.semTema + v.semAssunto + v.foraDaTaxonomia === 0 ? (
            <CheckCircle2 className="size-4 text-green-400" />
          ) : null}
          Conferência da árvore
        </h3>
        {checagem.isLoading ? (
          <p className="mt-2 text-xs text-muted-foreground">Carregando…</p>
        ) : (
          <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
            <li>
              Áreas: <strong className="text-foreground">{v?.areas ?? "—"}</strong> · Temas:{" "}
              <strong className="text-foreground">{v?.temas ?? "—"}</strong> · Assuntos:{" "}
              <strong className="text-foreground">{v?.assuntos ?? "—"}</strong>
            </li>
            <li>Questões sem área: {v?.semArea ?? "—"}</li>
            <li>Questões sem tema: {v?.semTema ?? "—"}</li>
            <li>Questões sem assunto: {v?.semAssunto ?? "—"}</li>
            <li>Questões fora da lista oficial: {v?.foraDaTaxonomia ?? "—"}</li>
          </ul>
        )}
      </section>
    </div>
  );
}
