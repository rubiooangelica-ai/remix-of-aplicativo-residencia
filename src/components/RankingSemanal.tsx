import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Crown, Loader2, Medal, Pencil, Trophy } from "lucide-react";
import { buscarMeuApelido, inicioSemana, salvarApelido, type LinhaRanking } from "@/lib/diagnostico";
import {
  buscarRankingGeralSeguro,
  buscarRankingSemanalSeguro,
  fecharSemanasPendentesSeguro,
} from "@/lib/ranking.functions";
import { cn } from "@/lib/utils";

type Modo = "semana" | "geral";

export function RankingSemanal({ userId }: { userId: string | null }) {
  const qc = useQueryClient();
  const buscarSemanal = useServerFn(buscarRankingSemanalSeguro);
  const buscarGeral = useServerFn(buscarRankingGeralSeguro);
  const fecharSemanas = useServerFn(fecharSemanasPendentesSeguro);
  const [editando, setEditando] = useState(false);
  const [apelido, setApelido] = useState("");
  const [modo, setModo] = useState<Modo>("semana");

  // Fecha semanas passadas (distribui broches) sempre que alguém abre o ranking.
  useEffect(() => {
    if (userId) void fecharSemanas();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  const rankingSemanal = useQuery({
    queryKey: ["dx-ranking", "semana"],
    queryFn: () => buscarSemanal(),
    enabled: !!userId && modo === "semana",
  });
  const rankingGeral = useQuery({
    queryKey: ["dx-ranking", "geral"],
    queryFn: () => buscarGeral(),
    enabled: !!userId && modo === "geral",
  });

  const meu = useQuery({
    queryKey: ["dx-apelido", userId],
    queryFn: () => buscarMeuApelido(userId!),
    enabled: !!userId,
  });

  useEffect(() => {
    if (meu.data) setApelido(meu.data);
  }, [meu.data]);

  const salvar = useMutation({
    mutationFn: () => salvarApelido(userId!, apelido),
    onSuccess: () => {
      setEditando(false);
      void qc.invalidateQueries({ queryKey: ["dx-apelido", userId] });
      void qc.invalidateQueries({ queryKey: ["dx-ranking"] });
    },
  });

  const semana = new Date(`${inicioSemana()}T12:00:00`).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
  });

  if (!userId) {
    return (
      <p className="rounded-2xl border border-border/60 bg-card p-5 text-sm text-muted-foreground">
        Entre na sua conta para disputar o ranking.
      </p>
    );
  }

  const carregando = modo === "semana" ? rankingSemanal.isLoading : rankingGeral.isLoading;
  const linhas: LinhaRanking[] = (modo === "semana" ? rankingSemanal.data : rankingGeral.data) ?? [];
  const minhaLinha = linhas.find((l) => l.user_id === userId);

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-primary/40 bg-primary/10 p-4">
        <p className="flex items-center gap-2 text-sm font-semibold text-primary">
          <Trophy className="size-4" />
          {modo === "semana" ? `Ranking da semana (desde ${semana})` : "Ranking geral"}
        </p>
        <p className="mt-1 text-xs text-muted-foreground">
          {modo === "semana"
            ? "Somente casos oficiais do dia pontuam. Reinicia toda segunda-feira às 00:00 — mas os broches de quem fica no top 3 ficam pra sempre."
            : "Soma de todos os pontos de todas as semanas — esse ranking nunca zera."}
        </p>
      </div>

      <div className="flex rounded-2xl border border-border/60 bg-surface p-1">
        <button
          onClick={() => setModo("semana")}
          className={cn(
            "flex-1 rounded-xl py-2 text-xs font-semibold",
            modo === "semana" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
          )}
        >
          Esta semana
        </button>
        <button
          onClick={() => setModo("geral")}
          className={cn(
            "flex-1 rounded-xl py-2 text-xs font-semibold",
            modo === "geral" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
          )}
        >
          Geral (nunca zera)
        </button>
      </div>

      <div className="rounded-2xl border border-border/60 bg-card p-4">
        <p className="mb-2 text-[11px] uppercase tracking-wide text-muted-foreground">
          Seu apelido no ranking
        </p>
        {editando ? (
          <div className="flex gap-2">
            <input
              value={apelido}
              onChange={(e) => setApelido(e.target.value)}
              maxLength={30}
              className="flex-1 rounded-xl border border-border/70 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            />
            <button
              onClick={() => salvar.mutate()}
              disabled={salvar.isPending}
              className="rounded-xl bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
            >
              Salvar
            </button>
          </div>
        ) : (
          <button
            onClick={() => setEditando(true)}
            className="flex items-center gap-2 text-sm font-semibold text-foreground"
          >
            {meu.data ?? "…"}
            <Pencil className="size-3.5 text-muted-foreground" />
          </button>
        )}
      </div>

      {minhaLinha ? (
        <div className="rounded-2xl border border-border/60 bg-card p-4">
          <p className="mb-2 text-[11px] uppercase tracking-wide text-muted-foreground">Seus broches</p>
          <div className="flex gap-4 text-sm">
            <span>🥇 {minhaLinha.ouro}</span>
            <span>🥈 {minhaLinha.prata}</span>
            <span>🥉 {minhaLinha.bronze}</span>
          </div>
        </div>
      ) : null}

      {carregando ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" /> Carregando ranking…
        </p>
      ) : null}

      <div className="space-y-2">
        {linhas.map((l, i) => (
          <div
            key={l.user_id}
            className={`flex items-center gap-3 rounded-2xl border p-3.5 ${
              l.user_id === userId
                ? "border-primary/60 bg-primary/10"
                : "border-border/60 bg-card"
            }`}
          >
            <span
              className={`flex size-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                i === 0
                  ? "bg-warning/20 text-warning"
                  : i < 3
                    ? "bg-primary/20 text-primary"
                    : "bg-surface text-muted-foreground"
              }`}
            >
              {i === 0 ? <Crown className="size-4" /> : i < 3 ? <Medal className="size-4" /> : i + 1}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold">{l.apelido}</p>
              <p className="text-[11px] text-muted-foreground">
               {l.taxaVisivel ? `${l.acertos} acertos · ` : ""}{l.jogadas} casos
                {l.ouro || l.prata || l.bronze ? (
                  <>
                    {" · "}
                    {l.ouro ? `🥇${l.ouro} ` : ""}
                    {l.prata ? `🥈${l.prata} ` : ""}
                    {l.bronze ? `🥉${l.bronze}` : ""}
                  </>
                ) : null}
              </p>
            </div>
            <span className="font-display text-base font-semibold text-primary">
              {Number(l.pontos).toFixed(2)}
            </span>
          </div>
        ))}
        {!carregando && !linhas.length ? (
          <p className="rounded-2xl border border-border/60 bg-card p-5 text-sm text-muted-foreground">
            {modo === "semana" ? "Ninguém pontuou nesta semana ainda. Seja o primeiro!" : "Ninguém pontuou ainda."}
          </p>
        ) : null}
      </div>
    </div>
  );
}
