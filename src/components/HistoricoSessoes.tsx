import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronDown, FolderOpen, History, MoreVertical, X } from "lucide-react";
import { useSessao } from "@/lib/auth";
import { useSessoesSalvas, moverSessaoParaPasta } from "@/lib/sessoes";
import { buscarPastas, criarPasta, removerPasta } from "@/lib/pastas";
import { cn } from "@/lib/utils";

export function HistoricoSessoes() {
  const { usuario } = useSessao();
  const queryClient = useQueryClient();
  const { sessoes, remover } = useSessoesSalvas();

  const [aberto, setAberto] = useState(false);
  const [pastaSel, setPastaSel] = useState<string>("todas");
  const [criandoPasta, setCriandoPasta] = useState(false);
  const [novaPastaNome, setNovaPastaNome] = useState("");
  const [menuPastaAberto, setMenuPastaAberto] = useState(false);
  const [menuSessaoAberto, setMenuSessaoAberto] = useState<string | null>(null);
  const [movendoSessaoId, setMovendoSessaoId] = useState<string | null>(null);
  const [arrastandoId, setArrastandoId] = useState<string | null>(null);
  const [pastaEmFoco, setPastaEmFoco] = useState<string | null>(null);

  const pastas = useQuery({
    queryKey: ["pastas", usuario?.id],
    queryFn: () => buscarPastas(usuario!.id),
    enabled: !!usuario,
  });

  const criarPastaMut = useMutation({
    mutationFn: () => criarPasta(usuario!.id, novaPastaNome.trim()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pastas"] });
      setNovaPastaNome("");
      setCriandoPasta(false);
    },
  });

  const removerPastaMut = useMutation({
    mutationFn: (id: string) => removerPasta(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["pastas"] });
      queryClient.invalidateQueries({ queryKey: ["sessoes-salvas"] });
      setPastaSel("todas");
      setMenuPastaAberto(false);
    },
  });

  const moverMut = useMutation({
    mutationFn: (vars: { sessaoId: string; pastaId: string | null }) =>
      moverSessaoParaPasta(vars.sessaoId, vars.pastaId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessoes-salvas"] });
      setMovendoSessaoId(null);
      setMenuSessaoAberto(null);
    },
  });

  if (!usuario) {
    return (
      <section className="mt-5 rounded-2xl border border-border/60 bg-card p-4">
        <p className="flex items-center gap-2 text-sm font-semibold">
          <History className="size-4 text-primary" /> Coleções
        </p>
        <p className="mt-2 text-xs text-muted-foreground">
          <Link to="/auth" className="underline">
            Entre na sua conta
          </Link>{" "}
          para guardar e organizar suas sessões em pastas.
        </p>
      </section>
    );
  }

  const pastaAtual = pastas.data?.find((p) => p.id === pastaSel) ?? null;
  const sessoesFiltradas = pastaAtual ? sessoes.filter((s) => s.pastaId === pastaAtual.id) : sessoes;
  const sessaoMovendo = sessoes.find((s) => s.id === movendoSessaoId) ?? null;

  function soltarEm(pastaId: string | null) {
    if (arrastandoId) {
      moverMut.mutate({ sessaoId: arrastandoId, pastaId });
    }
    setArrastandoId(null);
    setPastaEmFoco(null);
  }

  return (
    <section className="mt-5 rounded-2xl border border-border/60 bg-card">
      <button onClick={() => setAberto((v) => !v)} className="flex w-full items-center justify-between p-4">
        <span className="flex items-center gap-2 text-sm font-semibold">
          <History className="size-4 text-primary" /> Coleções
          <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] font-medium text-primary">
            {sessoes.length}
          </span>
        </span>
        <ChevronDown className={cn("size-4 text-muted-foreground transition-transform", aberto && "rotate-180")} />
      </button>

      {aberto ? (
        <div className="border-t border-border/50 p-4">
          <p className="mb-2 text-[11px] text-muted-foreground">
            Dica: no computador, dá pra arrastar uma sessão e soltar em cima de uma pasta pra mover ela.
          </p>

          {/* Chips de pasta */}
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setPastaSel("todas")}
              onDragOver={(e) => {
                e.preventDefault();
                setPastaEmFoco("todas");
              }}
              onDragLeave={() => setPastaEmFoco((v) => (v === "todas" ? null : v))}
              onDrop={(e) => {
                e.preventDefault();
                soltarEm(null);
              }}
              className={cn(
                "rounded-full border px-3 py-1.5 text-xs font-medium",
                pastaSel === "todas"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border/70 text-muted-foreground",
                pastaEmFoco === "todas" && "ring-2 ring-primary",
              )}
            >
              Todas ({sessoes.length})
            </button>
            {(pastas.data ?? []).map((p) => (
              <button
                key={p.id}
                onClick={() => setPastaSel(p.id)}
                onDragOver={(e) => {
                  e.preventDefault();
                  setPastaEmFoco(p.id);
                }}
                onDragLeave={() => setPastaEmFoco((v) => (v === p.id ? null : v))}
                onDrop={(e) => {
                  e.preventDefault();
                  soltarEm(p.id);
                }}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-medium",
                  pastaSel === p.id
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-border/70 text-muted-foreground",
                  pastaEmFoco === p.id && "ring-2 ring-primary",
                )}
              >
                {p.nome}
              </button>
            ))}
            {criandoPasta ? (
              <span className="flex items-center gap-1">
                <input
                  autoFocus
                  value={novaPastaNome}
                  onChange={(e) => setNovaPastaNome(e.target.value)}
                  placeholder="Nome da pasta"
                  className="w-28 rounded-full border border-border/70 bg-surface px-3 py-1.5 text-xs outline-none focus:border-primary"
                />
                <button
                  onClick={() => novaPastaNome.trim() && criarPastaMut.mutate()}
                  disabled={!novaPastaNome.trim() || criarPastaMut.isPending}
                  className="rounded-full bg-primary px-2.5 py-1.5 text-xs font-semibold text-primary-foreground disabled:opacity-50"
                >
                  OK
                </button>
              </span>
            ) : (
              <button
                onClick={() => setCriandoPasta(true)}
                className="rounded-full border border-dashed border-border/70 px-3 py-1.5 text-xs font-medium text-muted-foreground"
              >
                + Nova pasta
              </button>
            )}
          </div>

          {/* Opções da pasta selecionada */}
          {pastaAtual ? (
            <div className="relative mt-2 flex items-center justify-end">
              <button
                onClick={() => setMenuPastaAberto((v) => !v)}
                className="flex items-center gap-1 rounded-lg border border-border/60 px-2 py-1 text-[11px] text-muted-foreground"
              >
                <MoreVertical className="size-3" /> Opções da pasta
              </button>
              {menuPastaAberto ? (
                <div className="absolute right-0 top-full z-10 mt-1 w-44 rounded-xl border border-border/60 bg-surface p-1 shadow-lg">
                  <button
                    onClick={() => {
                      if (
                        window.confirm(
                          `Excluir a pasta "${pastaAtual.nome}"? As sessões dentro dela não são apagadas, só deixam de ter pasta.`,
                        )
                      ) {
                        removerPastaMut.mutate(pastaAtual.id);
                      }
                    }}
                    className="block w-full rounded-lg px-3 py-2 text-left text-xs text-destructive"
                  >
                    Excluir pasta
                  </button>
                </div>
              ) : null}
            </div>
          ) : null}

          {/* Lista de sessões */}
          <ul className="mt-3 space-y-2">
            {sessoesFiltradas.length ? (
              sessoesFiltradas.map((s) => {
                const feitas = Object.keys(s.respostas).length;
                const pct = Math.round((feitas / Math.max(s.questaoIds.length, 1)) * 100);
                const acertos = Object.values(s.respostas).filter((r) => r.correta).length;
                const pctAcerto = feitas > 0 ? Math.round((acertos / feitas) * 100) : null;
                return (
                  <li
                    key={s.id}
                    draggable
                    onDragStart={() => setArrastandoId(s.id)}
                    onDragEnd={() => {
                      setArrastandoId(null);
                      setPastaEmFoco(null);
                    }}
                    className={cn(
                      "relative rounded-xl border border-border/50 bg-surface p-3 transition-opacity",
                      arrastandoId === s.id && "cursor-grabbing opacity-50",
                    )}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium">{s.rotulo}</p>
                        <p className="mt-0.5 text-[11px] text-muted-foreground">
                          {pastaSel === "todas" && s.pastaNome ? `${s.pastaNome} · ` : ""}
                          {feitas}/{s.questaoIds.length} respondidas · {pct}% concluído
                          {pctAcerto !== null ? ` · ${pctAcerto}% de acerto` : ""}
                        </p>
                      </div>
                      <button
                        onClick={() => setMenuSessaoAberto(menuSessaoAberto === s.id ? null : s.id)}
                        className="shrink-0 rounded-lg border border-border/60 p-1.5 text-muted-foreground"
                      >
                        <MoreVertical className="size-3.5" />
                      </button>
                    </div>

                    <span className="mt-2 block h-1.5 overflow-hidden rounded-full bg-border/60">
                      <span className="block h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </span>

                    <Link
                      to="/questoes"
                      search={{ retomar: s.id, assunto: undefined, compartilhada: undefined }}
                      className="mt-3 block rounded-lg bg-primary px-3 py-2 text-center text-xs font-semibold text-primary-foreground"
                    >
                      Continuar
                    </Link>

                    {menuSessaoAberto === s.id ? (
                      <div className="absolute right-3 top-11 z-10 w-48 rounded-xl border border-border/60 bg-card p-1 shadow-lg">
                        <button
                          onClick={() => {
                            setMovendoSessaoId(s.id);
                            setMenuSessaoAberto(null);
                          }}
                          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs"
                        >
                          <FolderOpen className="size-3.5 text-primary" /> Mover para outra pasta
                        </button>
                        <button
                          onClick={() => {
                            if (window.confirm(`Excluir a sessão "${s.rotulo}"?`)) {
                              remover(s.id);
                              setMenuSessaoAberto(null);
                            }
                          }}
                          className="block w-full rounded-lg px-3 py-2 text-left text-xs text-destructive"
                        >
                          Excluir sessão
                        </button>
                      </div>
                    ) : null}
                  </li>
                );
              })
            ) : (
              <li className="rounded-xl border border-dashed border-border/60 p-4 text-center text-xs text-muted-foreground">
                Nenhuma sessão aqui ainda.
              </li>
            )}
          </ul>
        </div>
      ) : null}

      {/* Painel de mover pasta — janela cheia, igual o painel de editar questão */}
      {sessaoMovendo ? (
        <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
          <div className="max-h-[80vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-card p-5 sm:rounded-2xl">
            <div className="flex items-center justify-between">
              <p className="font-display text-sm font-semibold">Mover sessão</p>
              <button onClick={() => setMovendoSessaoId(null)} className="rounded-lg border border-border/60 p-1.5">
                <X className="size-4" />
              </button>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">"{sessaoMovendo.rotulo}"</p>

            <div className="mt-4 space-y-2">
              <button
                onClick={() => moverMut.mutate({ sessaoId: sessaoMovendo.id, pastaId: null })}
                disabled={moverMut.isPending}
                className="flex w-full items-center gap-2 rounded-xl border border-border/70 bg-surface px-4 py-3 text-left text-sm disabled:opacity-60"
              >
                <FolderOpen className="size-4 text-muted-foreground" /> Sem pasta
              </button>
              {(pastas.data ?? [])
                .filter((p) => p.id !== sessaoMovendo.pastaId)
                .map((p) => (
                  <button
                    key={p.id}
                    onClick={() => moverMut.mutate({ sessaoId: sessaoMovendo.id, pastaId: p.id })}
                    disabled={moverMut.isPending}
                    className="flex w-full items-center gap-2 rounded-xl border border-border/70 bg-surface px-4 py-3 text-left text-sm disabled:opacity-60"
                  >
                    <FolderOpen className="size-4 text-primary" /> {p.nome}
                  </button>
                ))}
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
