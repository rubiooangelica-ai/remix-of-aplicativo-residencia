import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Check, Layers, Pencil, Plus, RotateCcw, Trash2, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useSessao } from "@/lib/auth";
import { useEhAdmin } from "@/lib/admin";
import { buscarTaxonomia, type QuestaoDb, type Taxonomia } from "@/lib/banco";
import {
  atualizarFlashcardPessoal,
  buscarContagemErrosPorTema,
  buscarFlashcardsAdmin,
  buscarFlashcardsPessoais,
  buscarQuestoesErradasPorTema,
  criarFlashcardPessoal,
  criarFlashcardsEmLote,
  removerFlashcardAdmin,
  removerFlashcardPessoal,
  type BucketErros,
  type FlashcardPessoal,
} from "@/lib/conteudo";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/flashcards")({
  head: () => ({
    meta: [
      { title: "Flashcards de revisão — ResidênciaPro" },
      {
        name: "description",
        content:
          "Revise em flashcards as questões que você errou por tema, crie seus próprios cartões, ou use o banco cadastrado pela equipe.",
      },
      { property: "og:title", content: "Flashcards de revisão — ResidênciaPro" },
      {
        property: "og:description",
        content: "Seus erros por tema, seus próprios flashcards, e o banco cadastrado pela equipe.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: FlashcardsPage,
});

type Aba = "erros" | "meus" | "banco";

function FlashcardsPage() {
  const { usuario } = useSessao();
  const [aba, setAba] = useState<Aba>("erros");

  return (
    <AppShell titulo="Flashcards" descricao="Seus erros por tema, seus próprios cartões, ou o banco da equipe.">
      <div className="mb-5 grid grid-cols-3 gap-1 rounded-2xl border border-border/60 bg-surface p-1">
        <button
          onClick={() => setAba("erros")}
          className={cn(
            "rounded-xl py-2.5 text-[11px] font-semibold",
            aba === "erros" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
          )}
        >
          Meus erros
        </button>
        <button
          onClick={() => setAba("meus")}
          className={cn(
            "rounded-xl py-2.5 text-[11px] font-semibold",
            aba === "meus" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
          )}
        >
          Meus flashcards
        </button>
        <button
          onClick={() => setAba("banco")}
          className={cn(
            "rounded-xl py-2.5 text-[11px] font-semibold",
            aba === "banco" ? "bg-primary text-primary-foreground" : "text-muted-foreground",
          )}
        >
          Banco
        </button>
      </div>

      {aba === "erros" ? (
        !usuario ? (
          <Aviso texto="Entre na sua conta para revisar os erros em flashcards." />
        ) : (
          <MeusErros userId={usuario.id} />
        )
      ) : aba === "meus" ? (
        !usuario ? (
          <Aviso texto="Entre na sua conta para criar seus flashcards." />
        ) : (
          <MeusFlashcards userId={usuario.id} />
        )
      ) : (
        <FlashcardsBanco />
      )}
    </AppShell>
  );
}

/* ---------------------------------------------------------------------- */
/* Meus erros — passo 1: lista leve de temas. passo 2: escolhe as questões */
/* ---------------------------------------------------------------------- */

function chaveBucket(b: BucketErros) {
  return `${b.areaId ?? "-"}|${b.especialidadeId ?? "-"}|${b.assuntoId ?? "-"}`;
}

function nomeBucket(b: BucketErros, tax?: Taxonomia) {
  if (!tax) return "Carregando...";
  return (
    tax.assuntos.find((a) => a.id === b.assuntoId)?.nome ??
    tax.especialidades.find((e) => e.id === b.especialidadeId)?.nome ??
    tax.areas.find((a) => a.id === b.areaId)?.nome ??
    "Sem tema"
  );
}

function MeusErros({ userId }: { userId: string }) {
  const tax = useQuery({ queryKey: ["taxonomia"], queryFn: buscarTaxonomia });
  const buckets = useQuery({ queryKey: ["erros-por-tema", userId], queryFn: buscarContagemErrosPorTema });
  const [bucketEscolhido, setBucketEscolhido] = useState<BucketErros | null>(null);

  if (bucketEscolhido) {
    return (
      <SelecaoErrosDoTema
        userId={userId}
        bucket={bucketEscolhido}
        nomeTema={nomeBucket(bucketEscolhido, tax.data)}
        onVoltar={() => setBucketEscolhido(null)}
      />
    );
  }

  if (buckets.isLoading) return <p className="text-sm text-muted-foreground">Carregando seus temas com erro...</p>;
  if (!buckets.data?.length)
    return <Aviso texto="Nenhum erro registrado ainda. Resolva algumas questões e os temas aparecem aqui." />;

  return (
    <div className="space-y-2">
      <p className="text-xs text-muted-foreground">Escolha um tema pra ver as questões que você errou nele.</p>
      {buckets.data.map((b) => (
        <button
          key={chaveBucket(b)}
          onClick={() => setBucketEscolhido(b)}
          className="flex w-full items-center justify-between rounded-2xl border border-border/60 bg-card px-4 py-3.5 text-left"
        >
          <span className="text-sm font-medium">{nomeBucket(b, tax.data)}</span>
          <span className="rounded-full bg-destructive/15 px-2.5 py-1 text-[11px] font-semibold text-destructive">
            {b.total} erro{b.total > 1 ? "s" : ""}
          </span>
        </button>
      ))}
    </div>
  );
}

function SelecaoErrosDoTema({
  userId,
  bucket,
  nomeTema,
  onVoltar,
}: {
  userId: string;
  bucket: BucketErros;
  nomeTema: string;
  onVoltar: () => void;
}) {
  const questoes = useQuery({
    queryKey: ["erros-tema", userId, chaveBucket(bucket)],
    queryFn: () => buscarQuestoesErradasPorTema(userId, bucket),
  });

  const [selecionadas, setSelecionadas] = useState<string[]>([]);
  const [estudando, setEstudando] = useState(false);

  const lista = questoes.data ?? [];

  function alternar(id: string) {
    setSelecionadas((v) => (v.includes(id) ? v.filter((x) => x !== id) : [...v, id]));
  }

  if (estudando) {
    const escolhidas = lista.filter((q) => selecionadas.includes(q.id));
    return <VisualizadorBaralho cartoes={escolhidas.map(questaoParaCartao)} onSair={() => setEstudando(false)} />;
  }

  return (
    <div className="space-y-3">
      <button onClick={onVoltar} className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
        <ArrowLeft className="size-3.5" /> Voltar aos temas
      </button>
      <p className="text-sm font-semibold">{nomeTema}</p>

      {questoes.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando questões...</p>
      ) : (
        <>
          <button
            onClick={() =>
              setSelecionadas(selecionadas.length === lista.length ? [] : lista.map((q) => q.id))
            }
            className="text-xs font-medium text-primary"
          >
            {selecionadas.length === lista.length ? "Desmarcar todas" : "Selecionar todas"}
          </button>
          <div className="space-y-2">
            {lista.map((q) => (
              <label
                key={q.id}
                className="flex items-start gap-3 rounded-xl border border-border/50 bg-card p-3"
              >
                <input
                  type="checkbox"
                  checked={selecionadas.includes(q.id)}
                  onChange={() => alternar(q.id)}
                  className="mt-0.5 size-4 shrink-0 accent-primary"
                />
                <span className="text-xs leading-relaxed text-foreground/90">
                  {q.enunciado.slice(0, 140)}
                  {q.enunciado.length > 140 ? "…" : ""}
                </span>
              </label>
            ))}
          </div>
          <button
            onClick={() => setEstudando(true)}
            disabled={!selecionadas.length}
            className="w-full rounded-xl bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            Estudar {selecionadas.length || ""} selecionada{selecionadas.length === 1 ? "" : "s"}
          </button>
        </>
      )}
    </div>
  );
}

function questaoParaCartao(q: QuestaoDb): CartaoSimples {
  const alt = q.alternativas.find((a) => a.letra.toUpperCase() === q.correta.toUpperCase());
  return {
    id: q.id,
    frente: q.enunciado,
    verso: `Gabarito ${q.correta}${alt ? ` — ${alt.texto}` : ""}${q.comentario ? `\n\n${q.comentario}` : ""}`,
  };
}

/* ---------------------------------------------------------------------- */
/* Visualizador de baralho genérico (usado pelos 3 modos)                 */
/* ---------------------------------------------------------------------- */

type CartaoSimples = { id: string; frente: string; verso: string };

function VisualizadorBaralho({
  cartoes,
  onSair,
  onEditar,
  onExcluir,
}: {
  cartoes: CartaoSimples[];
  onSair?: () => void;
  onEditar?: (c: CartaoSimples) => void;
  onExcluir?: (id: string) => void;
}) {
  const [indice, setIndice] = useState(0);
  const [virado, setVirado] = useState(false);
  const [dominados, setDominados] = useState<string[]>([]);

  const atual = cartoes[indice];

  function avancar(dominou?: boolean) {
    if (atual && dominou) setDominados((s) => [...new Set([...s, atual.id])]);
    setVirado(false);
    setIndice((i) => i + 1);
  }

  if (!atual) {
    return (
      <div className="rounded-2xl border border-border/60 bg-card p-6 text-center">
        <Layers className="mx-auto size-8 text-primary" />
        <p className="mt-3 font-display text-lg font-semibold">Baralho concluído</p>
        {dominados.length ? (
          <p className="mt-1 text-sm text-muted-foreground">
            Você marcou {dominados.length} de {cartoes.length} como dominados.
          </p>
        ) : null}
        <div className="mt-4 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              setIndice(0);
              setDominados([]);
              setVirado(false);
            }}
            className="inline-flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground"
          >
            <RotateCcw className="size-4" />
            Recomeçar
          </button>
          {onSair ? (
            <button
              onClick={onSair}
              className="inline-flex items-center gap-2 rounded-full border border-border/70 px-5 py-2.5 text-sm font-semibold text-muted-foreground"
            >
              Sair
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div>
      {onSair ? (
        <button onClick={onSair} className="mb-2 flex items-center gap-1 text-xs font-medium text-muted-foreground">
          <ArrowLeft className="size-3.5" /> Voltar
        </button>
      ) : null}
      <p className="text-xs text-muted-foreground">
        Cartão {indice + 1} de {cartoes.length}
      </p>
      <button
        onClick={() => setVirado((v) => !v)}
        className="mt-2 w-full rounded-2xl border border-border/60 bg-card p-5 text-left"
      >
        <p className={cn("whitespace-pre-wrap text-sm leading-relaxed", virado && "text-success")}>
          {virado ? atual.verso : atual.frente}
        </p>
        <span className="mt-4 block text-[11px] uppercase tracking-wide text-muted-foreground">
          {virado ? "Toque para ver a frente" : "Toque para ver a resposta"}
        </span>
      </button>

      <div className="mt-4 grid grid-cols-2 gap-3">
        <button
          onClick={() => avancar(false)}
          className="flex items-center justify-center gap-2 rounded-xl border border-destructive/50 bg-destructive/10 py-3 text-sm font-medium text-destructive"
        >
          <X className="size-4" />
          Ainda erro
        </button>
        <button
          onClick={() => avancar(true)}
          className="flex items-center justify-center gap-2 rounded-xl border border-success/50 bg-success/10 py-3 text-sm font-medium text-success"
        >
          <Check className="size-4" />
          Dominei
        </button>
      </div>

      {onEditar || onExcluir ? (
        <div className="mt-3 flex justify-center gap-4">
          {onEditar ? (
            <button
              onClick={() => onEditar(atual)}
              className="flex items-center gap-1.5 text-xs font-medium text-primary"
            >
              <Pencil className="size-3.5" /> Editar
            </button>
          ) : null}
          {onExcluir ? (
            <button
              onClick={() => onExcluir(atual.id)}
              className="flex items-center gap-1.5 text-xs font-medium text-destructive"
            >
              <Trash2 className="size-3.5" /> Excluir
            </button>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Meus flashcards — a pessoa cria, edita e apaga os próprios              */
/* ---------------------------------------------------------------------- */

function MeusFlashcards({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const cards = useQuery({ queryKey: ["flashcards-pessoais", userId], queryFn: () => buscarFlashcardsPessoais(userId) });

  const [form, setForm] = useState<"novo" | FlashcardPessoal | null>(null);

  const remover = useMutation({
    mutationFn: (id: string) => removerFlashcardPessoal(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["flashcards-pessoais", userId] }),
  });

  const lista = cards.data ?? [];

  if (form) {
    return (
      <FormFlashcardPessoal
        userId={userId}
        existente={form === "novo" ? null : form}
        onFechar={() => setForm(null)}
        onSalvo={() => {
          setForm(null);
          queryClient.invalidateQueries({ queryKey: ["flashcards-pessoais", userId] });
        }}
      />
    );
  }

  return (
    <div className="space-y-4">
      <button
        onClick={() => setForm("novo")}
        className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/50 py-3 text-sm font-semibold text-primary"
      >
        <Plus className="size-4" /> Criar flashcard
      </button>

      {cards.isLoading ? (
        <p className="text-sm text-muted-foreground">Carregando...</p>
      ) : !lista.length ? (
        <p className="rounded-2xl border border-border/60 bg-card p-5 text-sm text-muted-foreground">
          Você ainda não criou nenhum flashcard.
        </p>
      ) : (
        <VisualizadorBaralho
          cartoes={lista.map((c) => ({ id: c.id, frente: c.frente, verso: c.verso }))}
          onEditar={(c) => {
            const original = lista.find((x) => x.id === c.id);
            if (original) setForm(original);
          }}
          onExcluir={(id) => {
            if (window.confirm("Excluir este flashcard?")) remover.mutate(id);
          }}
        />
      )}
    </div>
  );
}

function FormFlashcardPessoal({
  userId,
  existente,
  onFechar,
  onSalvo,
}: {
  userId: string;
  existente: FlashcardPessoal | null;
  onFechar: () => void;
  onSalvo: () => void;
}) {
  const [frente, setFrente] = useState(existente?.frente ?? "");
  const [verso, setVerso] = useState(existente?.verso ?? "");
  const [erro, setErro] = useState<string | null>(null);

  const salvar = useMutation({
    mutationFn: () =>
      existente
        ? atualizarFlashcardPessoal(existente.id, { frente, verso })
        : criarFlashcardPessoal({ userId, frente, verso }),
    onSuccess: onSalvo,
    onError: (e) => setErro((e as Error).message),
  });

  return (
    <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-4">
      <p className="text-sm font-semibold">{existente ? "Editar flashcard" : "Novo flashcard"}</p>
      <div>
        <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Frente</label>
        <textarea
          value={frente}
          onChange={(e) => setFrente(e.target.value)}
          rows={3}
          placeholder="Pergunta ou conceito"
          className="mt-1 w-full resize-none rounded-xl border border-border/70 bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary"
        />
      </div>
      <div>
        <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Verso</label>
        <textarea
          value={verso}
          onChange={(e) => setVerso(e.target.value)}
          rows={4}
          placeholder="Resposta ou explicação"
          className="mt-1 w-full resize-none rounded-xl border border-border/70 bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary"
        />
      </div>
      {erro ? <p className="text-xs text-destructive">{erro}</p> : null}
      <div className="flex gap-2">
        <button
          onClick={onFechar}
          className="flex-1 rounded-xl border border-border/70 py-2.5 text-xs font-semibold text-muted-foreground"
        >
          Cancelar
        </button>
        <button
          onClick={() => {
            if (!frente.trim() || !verso.trim()) return setErro("Preencha frente e verso.");
            setErro(null);
            salvar.mutate();
          }}
          disabled={salvar.isPending}
          className="flex-1 rounded-xl bg-primary py-2.5 text-xs font-semibold text-primary-foreground disabled:opacity-60"
        >
          {salvar.isPending ? "Salvando..." : "Salvar"}
        </button>
      </div>
    </div>
  );
}

/* ---------------------------------------------------------------------- */
/* Banco de flashcards — cadastrados por admin, iguais pra todo mundo      */
/* ---------------------------------------------------------------------- */

function FlashcardsBanco() {
  const { usuario } = useSessao();
  const { ehAdmin } = useEhAdmin();
  const queryClient = useQueryClient();
  const cards = useQuery({ queryKey: ["flashcards-admin"], queryFn: buscarFlashcardsAdmin });
  const tax = useQuery({ queryKey: ["taxonomia"], queryFn: buscarTaxonomia });

  const [mostrarForm, setMostrarForm] = useState(false);

  const remover = useMutation({
    mutationFn: (id: string) => removerFlashcardAdmin(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["flashcards-admin"] }),
  });

  const lista = cards.data ?? [];

  return (
    <div className="space-y-4">
      {ehAdmin ? (
        <button
          onClick={() => setMostrarForm((v) => !v)}
          className="flex w-full items-center justify-center gap-2 rounded-2xl border border-dashed border-primary/50 py-3 text-sm font-semibold text-primary"
        >
          <Plus className="size-4" /> {mostrarForm ? "Fechar" : "Adicionar flashcards em lote"}
        </button>
      ) : null}

      {mostrarForm && usuario ? (
        <FormLoteFlashcardsAdmin
          userId={usuario.id}
          onFechar={() => setMostrarForm(false)}
          onCriado={() => {
            setMostrarForm(false);
            queryClient.invalidateQueries({ queryKey: ["flashcards-admin"] });
          }}
        />
      ) : null}

      {cards.isLoading ? (
        <p className="text-sm text-muted-foreground">Montando o baralho…</p>
      ) : !lista.length ? (
        <p className="rounded-2xl border border-border/60 bg-card p-5 text-sm text-muted-foreground">
          Nenhum flashcard cadastrado ainda.
        </p>
      ) : (
        <VisualizadorBaralho
          cartoes={lista.map((c) => ({ id: c.id, frente: c.pergunta, verso: c.resposta }))}
          {...(ehAdmin
            ? {
                onExcluir: (id: string) => {
                  if (window.confirm("Excluir este flashcard?")) remover.mutate(id);
                },
              }
            : {})}

        />
      )}
    </div>
  );
}

function FormLoteFlashcardsAdmin({
  userId,
  onFechar,
  onCriado,
}: {
  userId: string;
  onFechar: () => void;
  onCriado: () => void;
}) {
  const tax = useQuery({ queryKey: ["taxonomia"], queryFn: buscarTaxonomia });
  const [texto, setTexto] = useState("");
  const [assuntoId, setAssuntoId] = useState("");
  const [erro, setErro] = useState<string | null>(null);
  const [feito, setFeito] = useState<number | null>(null);

  const criar = useMutation({
    mutationFn: () => {
      const assunto = tax.data?.assuntos.find((a) => a.id === assuntoId);
      return criarFlashcardsEmLote({
        texto,
        criadoPor: userId,
        assuntoId: assunto?.id ?? null,
        especialidadeId: assunto?.especialidade_id ?? null,
        areaId: tax.data?.especialidades.find((e) => e.id === assunto?.especialidade_id)?.area_id ?? null,
      });
    },
    onSuccess: (total) => {
      setFeito(total);
      setTexto("");
      setTimeout(onCriado, 800);
    },
    onError: (e) => setErro((e as Error).message),
  });

  return (
    <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-4">
      <p className="text-xs text-muted-foreground">
        Cole uma dupla de pergunta e resposta por linha, separadas por <strong>|</strong>. Exemplo:
        <br />
        <span className="font-mono text-[11px]">Qual a tríade de Charcot? | Dor em HCD, febre e icterícia</span>
      </p>
      <select
        value={assuntoId}
        onChange={(e) => setAssuntoId(e.target.value)}
        className="w-full rounded-xl border border-border/70 bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary"
      >
        <option value="">Sem tema associado (opcional)</option>
        {(tax.data?.assuntos ?? []).map((a) => (
          <option key={a.id} value={a.id}>
            {a.nome}
          </option>
        ))}
      </select>
      <textarea
        value={texto}
        onChange={(e) => setTexto(e.target.value)}
        rows={8}
        placeholder={"Pergunta 1 | Resposta 1\nPergunta 2 | Resposta 2"}
        className="w-full resize-none rounded-xl border border-border/70 bg-surface px-3 py-2.5 font-mono text-xs outline-none focus:border-primary"
      />
      {erro ? <p className="text-xs text-destructive">{erro}</p> : null}
      {feito !== null ? <p className="text-xs text-success">{feito} flashcard(s) adicionado(s).</p> : null}
      <div className="flex gap-2">
        <button
          onClick={onFechar}
          className="flex-1 rounded-xl border border-border/70 py-2.5 text-xs font-semibold text-muted-foreground"
        >
          Cancelar
        </button>
        <button
          onClick={() => {
            setErro(null);
            criar.mutate();
          }}
          disabled={!texto.trim() || criar.isPending}
          className="flex-1 rounded-xl bg-primary py-2.5 text-xs font-semibold text-primary-foreground disabled:opacity-60"
        >
          {criar.isPending ? "Salvando..." : "Adicionar flashcards"}
        </button>
      </div>
    </div>
  );
}

function Aviso({ texto }: { texto: string }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-5">
      <p className="text-sm text-muted-foreground">{texto}</p>
      <Link
        to="/questoes"
        search={{ retomar: undefined, assunto: undefined, compartilhada: undefined }}
        className="mt-3 inline-flex rounded-full bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
      >
        Ir para as questões
      </Link>
    </div>
  );
}
