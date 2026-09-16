import { createFileRoute, Link } from "@tanstack/react-router";
import { exigirLogin } from "@/lib/auth";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Flag,
  FolderTree,
  GraduationCap,
  BookOpen,
  History,
  MoveRight,
  Pencil,
  ShieldCheck,
  Trash2,
  Stethoscope,
  UserRoundSearch,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { EditarQuestaoAdmin } from "@/components/EditarQuestaoAdmin";
import {
  useEhAdmin,
  recrutarAdmin,
  buscarQuestoesReportadas,
  marcarReporteResolvido,
  removerReporte,
  type QuestaoReportada,
} from "@/lib/admin";
import { useSessao } from "@/lib/auth";
import type { QuestaoDb } from "@/lib/banco";
import { cn } from "@/lib/utils";
import {
  buscarTaxonomia,
  buscarContagensTaxonomia,
  criarEspecialidade,
  criarAssunto,
  criarSubassunto,
  excluirPastaTaxonomia,
  moverQuestoesTaxonomia,
  renomearArea,
  renomearEspecialidade,
  renomearAssunto,
  renomearSubassunto,
  type Taxonomia,
  type TipoOrigemMovimento,
} from "@/lib/banco";
import { alternarAtivoCaso, buscarTodosCasos, criarCaso, removerCaso } from "@/lib/dx-casos";
import { HistoricoEdicoesQuestoes } from "@/components/HistoricoEdicoesQuestoes";
import { ReclassificacaoLote } from "@/components/ReclassificacaoLote";
import { MigracaoTaxonomia } from "@/components/MigracaoTaxonomia";
import { GerenciarSimuladosEnamed } from "@/components/GerenciarSimuladosEnamed";
import { GerenciarMateriaisAdmin } from "@/components/GerenciarMateriaisAdmin";
import { Wand2 } from "lucide-react";

export const Route = createFileRoute("/admin")({
  beforeLoad: exigirLogin,
  component: AdminPage,
});

type Secao = "menu" | "recrutar" | "taxonomia" | "reclassificacao" | "migracao" | "casos" | "simulados" | "materiais" | "historico" | "reportadas";

function AdminPage() {
  const { usuario } = useSessao();
  const { ehAdmin, carregando } = useEhAdmin();
  const [secao, setSecao] = useState<Secao>("menu");

  if (!usuario) {
    return (
      <AppShell titulo="Administração">
        <p className="text-sm text-muted-foreground">Entre na sua conta para acessar essa página.</p>
      </AppShell>
    );
  }

  if (carregando) {
    return (
      <AppShell titulo="Administração">
        <p className="text-sm text-muted-foreground">Carregando...</p>
      </AppShell>
    );
  }

  if (!ehAdmin) {
    return (
      <AppShell titulo="Administração">
        <p className="text-sm text-muted-foreground">Você não tem permissão para acessar essa página.</p>
      </AppShell>
    );
  }

  const itensMenu: { id: Secao; icone: typeof ShieldCheck; titulo: string; descricao: string }[] = [
    {
      id: "recrutar",
      icone: ShieldCheck,
      titulo: "Recrutar administrador",
      descricao: "Tornar outra conta administradora pelo e-mail.",
    },
    {
      id: "taxonomia",
      icone: FolderTree,
      titulo: "Áreas, especialidades, temas e subtemas",
      descricao: "Organizar a árvore de categorias do banco de questões.",
    },
    {
      id: "reclassificacao",
      icone: Wand2,
      titulo: "Reclassificação em lote com IA",
      descricao: "Reorganizar área, tema e assunto das questões (com modo simulação).",
    },
    {
      id: "migracao",
      icone: Wand2,
      titulo: "Migração para a taxonomia oficial",
      descricao: "Releitura de cada questão pela IA dentro das 307 combinações oficiais.",
    },
    {
      id: "casos",
      icone: Stethoscope,
      titulo: "Banco de casos — Qual o diagnóstico?",
      descricao: "Cadastrar os casos clínicos do jogo diário (sem IA).",
    },
    {
      id: "simulados",
      icone: GraduationCap,
      titulo: "Simulados ENAMED",
      descricao: "Criar, importar 100 questões, validar e publicar cada prova.",
    },
    {
      id: "materiais",
      icone: BookOpen,
      titulo: "Resumos / materiais",
      descricao: "Criar, importar, editar e publicar resumos com imagens sem alterar a taxonomia.",
    },
    {
      id: "historico",
      icone: History,
      titulo: "Histórico de alterações em questões",
      descricao: "Ver quem mudou o quê em cada questão.",
    },
    {
      id: "reportadas",
      icone: Flag,
      titulo: "Questões reportadas",
      descricao: "Problemas que os usuários encontraram (dado faltando, erro etc).",
    },
  ];

  if (secao === "menu") {
    return (
      <AppShell titulo="Administração" descricao="Escolha o que você quer fazer.">
        <div className="space-y-2">
          <Link to="/admin-assinaturas" className="flex w-full items-center gap-3 rounded-2xl border border-primary/30 bg-primary/5 p-4 text-left">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <UserRoundSearch className="size-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-sm font-semibold">Usuários, acessos e assinaturas</span>
              <span className="block text-xs text-muted-foreground">Ver contas, últimos acessos e controlar planos Premium.</span>
            </span>
            <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
          </Link>
          {itensMenu.map(({ id, icone: Icone, titulo, descricao }) => (
            <button
              key={id}
              onClick={() => setSecao(id)}
              className="flex w-full items-center gap-3 rounded-2xl border border-border/60 bg-card p-4 text-left"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <Icone className="size-5" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{titulo}</span>
                <span className="block text-xs text-muted-foreground">{descricao}</span>
              </span>
              <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
            </button>
          ))}
        </div>
      </AppShell>
    );
  }

  const item = itensMenu.find((i) => i.id === secao)!;

  return (
    <AppShell titulo={item.titulo}>
      <button
        onClick={() => setSecao("menu")}
        className="mb-4 flex items-center gap-1 text-xs font-medium text-muted-foreground"
      >
        <ArrowLeft className="size-3.5" /> Voltar ao menu
      </button>

      {secao === "recrutar" ? <RecrutarAdmin /> : null}
      {secao === "taxonomia" ? <GerenciarTaxonomia /> : null}
      {secao === "reclassificacao" ? <ReclassificacaoLote /> : null}
      {secao === "migracao" ? <MigracaoTaxonomia /> : null}
      {secao === "casos" ? <GerenciarCasosDx /> : null}
      {secao === "simulados" ? <GerenciarSimuladosEnamed /> : null}
      {secao === "materiais" ? <GerenciarMateriaisAdmin /> : null}
      {secao === "historico" ? <HistoricoEdicoesQuestoes /> : null}
      {secao === "reportadas" ? <QuestoesReportadas /> : null}
    </AppShell>
  );
}

function RecrutarAdmin() {
  const [email, setEmail] = useState("");
  const [mensagem, setMensagem] = useState<string | null>(null);

  const recrutar = useMutation({
    mutationFn: () => recrutarAdmin(email.trim()),
    onSuccess: () => {
      setMensagem(`${email.trim()} agora é administrador.`);
      setEmail("");
    },
  });

  return (
    <section className="rounded-2xl border border-border/60 bg-card p-4">
      <p className="text-xs text-muted-foreground">
        A pessoa precisa já ter uma conta criada no aplicativo com esse e-mail.
      </p>
      <input
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="email@exemplo.com"
        className="mt-3 w-full rounded-xl border border-border/70 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
      />
      <button
        onClick={() => recrutar.mutate()}
        disabled={!email.trim() || recrutar.isPending}
        className="mt-3 w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50"
      >
        {recrutar.isPending ? "Enviando..." : "Tornar administrador"}
      </button>
      {recrutar.isError ? <p className="mt-2 text-xs text-destructive">{(recrutar.error as Error).message}</p> : null}
      {mensagem ? <p className="mt-2 text-xs text-success">{mensagem}</p> : null}
    </section>
  );
}

function GerenciarTaxonomia() {
  const queryClient = useQueryClient();
  const tax = useQuery({ queryKey: ["taxonomia"], queryFn: buscarTaxonomia });
  const contagens = useQuery({ queryKey: ["taxonomia-contagens"], queryFn: buscarContagensTaxonomia });
  const [areaAberta, setAreaAberta] = useState<string | null>(null);
  const [espAberta, setEspAberta] = useState<string | null>(null);
  const [assAberto, setAssAberto] = useState<string | null>(null);
  const [movimento, setMovimento] = useState<{
    tipo: TipoOrigemMovimento;
    id: string;
    nome: string;
  } | null>(null);

  const invalidar = () => {
    queryClient.invalidateQueries({ queryKey: ["taxonomia"] });
    queryClient.invalidateQueries({ queryKey: ["taxonomia-contagens"] });
  };

  async function excluirPasta(tipo: "area" | "especialidade" | "assunto" | "subassunto", id: string, nome: string) {
    if (
      !window.confirm(
        `Excluir a pasta "${nome}"?\n\nPor segurança, a exclusão será bloqueada se ainda houver questões dentro dela.`,
      )
    )
      return;
    try {
      await excluirPastaTaxonomia(tipo, id);
      await invalidar();
    } catch (e) {
      window.alert((e as Error).message);
    }
  }

  if (tax.isLoading) return <p className="text-xs text-muted-foreground">Carregando...</p>;
  const t = tax.data;
  if (!t) return null;

  return (
    <div className="space-y-2">
      {t.areas.map((area) => (
        <div key={area.id} className="rounded-xl border border-border/60 bg-surface">
          <div className="flex items-center gap-2 p-3">
            <button
              onClick={() => setAreaAberta(areaAberta === area.id ? null : area.id)}
              className="flex-1 text-left text-sm font-semibold"
            >
              {area.nome}{" "}
              <span className="font-normal text-muted-foreground">· {contagens.data?.area[area.id] ?? 0}</span>
            </button>
            <RenomearBotao
              valorAtual={area.nome}
              onSalvar={async (novo) => {
                await renomearArea(area.id, novo);
                invalidar();
              }}
            />
            <button
              onClick={(e) => {
                e.stopPropagation();
                void excluirPasta("area", area.id, area.nome);
              }}
              title="Excluir área"
              className="shrink-0 rounded-lg border border-destructive/40 p-1.5 text-destructive"
            >
              <Trash2 className="size-3" />
            </button>
          </div>

          {areaAberta === area.id ? (
            <div className="space-y-2 border-t border-border/50 p-3 pl-5">
              {t.especialidades
                .filter((e) => e.area_id === area.id)
                .map((esp) => (
                  <div key={esp.id} className="rounded-lg border border-border/50 bg-card">
                    <div className="flex items-center gap-2 p-2">
                      <button
                        onClick={() => setEspAberta(espAberta === esp.id ? null : esp.id)}
                        className="flex-1 text-left text-xs font-medium"
                      >
                        {esp.nome}{" "}
                        <span className="font-normal text-muted-foreground">
                          · {contagens.data?.especialidade[esp.id] ?? 0}
                        </span>
                      </button>
                      <RenomearBotao
                        valorAtual={esp.nome}
                        onSalvar={async (novo) => {
                          await renomearEspecialidade(esp.id, novo);
                          invalidar();
                        }}
                      />
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          void excluirPasta("especialidade", esp.id, esp.nome);
                        }}
                        title="Excluir especialidade"
                        className="shrink-0 rounded-lg border border-destructive/40 p-1.5 text-destructive"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>

                    {espAberta === esp.id ? (
                      <div className="space-y-2 border-t border-border/40 p-2 pl-4">
                        {t.assuntos
                          .filter((a) => a.especialidade_id === esp.id)
                          .map((ass) => (
                            <div key={ass.id} className="rounded-lg border border-border/40 bg-surface">
                              <div className="flex items-center gap-2 p-2">
                                <button
                                  onClick={() => setAssAberto(assAberto === ass.id ? null : ass.id)}
                                  className="flex-1 text-left text-[11px] font-medium"
                                >
                                  {ass.nome}{" "}
                                  <span className="font-normal text-muted-foreground">
                                    · {contagens.data?.assunto[ass.id] ?? 0}
                                  </span>
                                </button>
                                <RenomearBotao
                                  valorAtual={ass.nome}
                                  onSalvar={async (novo) => {
                                    await renomearAssunto(ass.id, novo);
                                    invalidar();
                                  }}
                                />
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setMovimento({ tipo: "assunto", id: ass.id, nome: ass.nome });
                                  }}
                                  title="Mover questões deste tema"
                                  className="shrink-0 rounded-lg border border-border/60 p-1.5 text-primary"
                                >
                                  <MoveRight className="size-3" />
                                </button>
                                <button
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    void excluirPasta("assunto", ass.id, ass.nome);
                                  }}
                                  title="Excluir tema"
                                  className="shrink-0 rounded-lg border border-destructive/40 p-1.5 text-destructive"
                                >
                                  <Trash2 className="size-3" />
                                </button>
                              </div>

                              {assAberto === ass.id ? (
                                <div className="space-y-1 border-t border-border/30 p-2 pl-4">
                                  {(t.subassuntos ?? [])
                                    .filter((s) => s.assunto_id === ass.id)
                                    .map((sub) => (
                                      <div
                                        key={sub.id}
                                        className="flex items-center gap-2 rounded-lg bg-card px-2 py-1.5"
                                      >
                                        <span className="flex-1 text-[11px]">
                                          {sub.nome}{" "}
                                          <span className="text-muted-foreground">
                                            · {contagens.data?.subassunto[sub.id] ?? 0}
                                          </span>
                                        </span>
                                        <RenomearBotao
                                          valorAtual={sub.nome}
                                          onSalvar={async (novo) => {
                                            await renomearSubassunto(sub.id, novo);
                                            invalidar();
                                          }}
                                        />
                                        <button
                                          onClick={() =>
                                            setMovimento({ tipo: "subassunto", id: sub.id, nome: sub.nome })
                                          }
                                          title="Mover questões deste subtema"
                                          className="shrink-0 rounded-lg border border-border/60 p-1.5 text-primary"
                                        >
                                          <MoveRight className="size-3" />
                                        </button>
                                        <button
                                          onClick={() => void excluirPasta("subassunto", sub.id, sub.nome)}
                                          title="Excluir subtema"
                                          className="shrink-0 rounded-lg border border-destructive/40 p-1.5 text-destructive"
                                        >
                                          <Trash2 className="size-3" />
                                        </button>
                                      </div>
                                    ))}
                                  <NovoItemForm
                                    placeholder="Novo subtema"
                                    onCriar={async (nome) => {
                                      await criarSubassunto(ass.id, nome);
                                      invalidar();
                                    }}
                                  />
                                </div>
                              ) : null}
                            </div>
                          ))}
                        <NovoItemForm
                          placeholder="Novo tema"
                          onCriar={async (nome) => {
                            await criarAssunto(esp.id, nome);
                            invalidar();
                          }}
                        />
                      </div>
                    ) : null}
                  </div>
                ))}
              <NovoItemForm
                placeholder="Nova especialidade"
                onCriar={async (nome) => {
                  await criarEspecialidade(area.id, nome);
                  invalidar();
                }}
              />
            </div>
          ) : null}
        </div>
      ))}

      {movimento ? (
        <ModalMoverQuestoes
          taxonomia={t}
          origem={movimento}
          onFechar={() => setMovimento(null)}
          onConcluido={async (quantidade) => {
            setMovimento(null);
            await invalidar();
            queryClient.invalidateQueries({ queryKey: ["contagens"] });
            window.alert(`${quantidade} questão(ões) movida(s) com sucesso.`);
          }}
        />
      ) : null}
    </div>
  );
}

function ModalMoverQuestoes({
  taxonomia,
  origem,
  onFechar,
  onConcluido,
}: {
  taxonomia: Taxonomia;
  origem: { tipo: TipoOrigemMovimento; id: string; nome: string };
  onFechar: () => void;
  onConcluido: (quantidade: number) => Promise<void>;
}) {
  const [assuntoDestino, setAssuntoDestino] = useState("");
  const [subassuntoDestino, setSubassuntoDestino] = useState("");
  const [buscaTema, setBuscaTema] = useState("");
  const [menuAberto, setMenuAberto] = useState(false);

  const mover = useMutation({
    mutationFn: () =>
      moverQuestoesTaxonomia({
        origemTipo: origem.tipo,
        origemId: origem.id,
        destinoAssuntoId: assuntoDestino,
        destinoSubassuntoId: subassuntoDestino || null,
      }),
    onSuccess: (quantidade) => void onConcluido(quantidade),
  });

  const subassuntosDestino = taxonomia.subassuntos.filter((s) => s.assunto_id === assuntoDestino);
  const rotuloAssunto = (assuntoId: string) => {
    const assunto = taxonomia.assuntos.find((a) => a.id === assuntoId);
    const esp = taxonomia.especialidades.find((e) => e.id === assunto?.especialidade_id);
    const area = taxonomia.areas.find((a) => a.id === esp?.area_id);
    return [area?.nome, esp?.nome, assunto?.nome].filter(Boolean).join(" › ");
  };

  const normalizar = (texto: string) =>
    texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "");

  const temasFiltrados = taxonomia.assuntos
    .map((assunto) => ({ assunto, rotulo: rotuloAssunto(assunto.id) }))
    .filter(({ rotulo }) => normalizar(rotulo).includes(normalizar(buscaTema)))
    .slice(0, 60);

  const destinoIgual =
    origem.tipo === "assunto" ? origem.id === assuntoDestino && !subassuntoDestino : origem.id === subassuntoDestino;

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-0 sm:items-center sm:p-4">
      <div className="w-full max-w-lg rounded-t-2xl border border-border/60 bg-card p-5 shadow-xl sm:rounded-2xl">
        <p className="text-sm font-semibold">Mover questões em lote</p>
        <p className="mt-1 text-xs text-muted-foreground">
          Origem: <strong className="text-foreground">{origem.nome}</strong>. Todas as questões dessa pasta serão
          reclassificadas para o destino escolhido.
        </p>

        <label className="relative mt-4 block text-xs font-medium text-muted-foreground">
          Tema de destino
          <input
            type="text"
            value={buscaTema}
            onChange={(e) => {
              setBuscaTema(e.target.value);
              setAssuntoDestino("");
              setSubassuntoDestino("");
              setMenuAberto(true);
            }}
            onFocus={() => setMenuAberto(true)}
            onBlur={() => setTimeout(() => setMenuAberto(false), 150)}
            placeholder="Digite para pesquisar um tema..."
            className="mt-1 w-full rounded-xl border border-border/70 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
          />
          {menuAberto ? (
            <div className="absolute z-10 mt-1 max-h-64 w-full overflow-y-auto rounded-xl border border-border/70 bg-surface shadow-lg">
              {temasFiltrados.length === 0 ? (
                <p className="p-3 text-xs text-muted-foreground">Nenhum tema encontrado.</p>
              ) : (
                temasFiltrados.map(({ assunto, rotulo }) => (
                  <button
                    key={assunto.id}
                    type="button"
                    onMouseDown={(e) => {
                      e.preventDefault();
                      setAssuntoDestino(assunto.id);
                      setBuscaTema(rotulo);
                      setSubassuntoDestino("");
                      setMenuAberto(false);
                    }}
                    className="block w-full px-3 py-2 text-left text-xs hover:bg-primary/10"
                  >
                    {rotulo}
                  </button>
                ))
              )}
            </div>
          ) : null}
        </label>

        <label className="mt-3 block text-xs font-medium text-muted-foreground">
          Subtema de destino (opcional)
          <select
            value={subassuntoDestino}
            onChange={(e) => setSubassuntoDestino(e.target.value)}
            disabled={!assuntoDestino}
            className="mt-1 w-full rounded-xl border border-border/70 bg-surface px-3 py-2 text-sm outline-none focus:border-primary disabled:opacity-50"
          >
            <option value="">Nenhum — deixar diretamente no tema</option>
            {subassuntosDestino.map((sub) => (
              <option key={sub.id} value={sub.id}>
                {sub.nome}
              </option>
            ))}
          </select>
        </label>

        {mover.isError ? <p className="mt-3 text-xs text-destructive">{(mover.error as Error).message}</p> : null}

        <div className="mt-5 flex gap-2">
          <button
            onClick={onFechar}
            disabled={mover.isPending}
            className="flex-1 rounded-xl border border-border/70 px-4 py-2.5 text-sm font-medium"
          >
            Cancelar
          </button>
          <button
            onClick={() => mover.mutate()}
            disabled={!assuntoDestino || destinoIgual || mover.isPending}
            className="flex-1 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground disabled:opacity-50"
          >
            {mover.isPending ? "Movendo..." : "Mover questões"}
          </button>
        </div>
      </div>
    </div>
  );
}

function GerenciarCasosDx() {
  const queryClient = useQueryClient();
  const casos = useQuery({ queryKey: ["dx-casos-admin"], queryFn: buscarTodosCasos });

  const [diagnostico, setDiagnostico] = useState("");
  const [aceitos, setAceitos] = useState("");
  const [dicas, setDicas] = useState(["", "", "", "", ""]);
  const [erro, setErro] = useState<string | null>(null);

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ["dx-casos-admin"] });

  const criar = useMutation({
    mutationFn: () =>
      criarCaso({
        diagnostico: diagnostico.trim(),
        aceitos: aceitos
          .split(",")
          .map((a) => a.trim())
          .filter(Boolean),
        dicas: dicas.map((d) => d.trim()),
      }),
    onSuccess: () => {
      setDiagnostico("");
      setAceitos("");
      setDicas(["", "", "", "", ""]);
      setErro(null);
      invalidar();
    },
    onError: (e) => setErro((e as Error).message),
  });

  const alternarAtivo = useMutation({
    mutationFn: (vars: { id: string; ativo: boolean }) => alternarAtivoCaso(vars.id, vars.ativo),
    onSuccess: invalidar,
  });

  const remover = useMutation({
    mutationFn: (id: string) => removerCaso(id),
    onSuccess: invalidar,
  });

  function salvar() {
    if (!diagnostico.trim()) {
      setErro("Digite o nome do diagnóstico.");
      return;
    }
    if (dicas.some((d) => !d.trim())) {
      setErro("Preencha as 5 dicas.");
      return;
    }
    criar.mutate();
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2 rounded-xl border border-dashed border-border/70 p-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Novo caso</p>
        <input
          value={diagnostico}
          onChange={(e) => setDiagnostico(e.target.value)}
          placeholder="Nome do diagnóstico (ex: Infarto agudo do miocárdio com supra de ST)"
          className="w-full rounded-lg border border-border/70 bg-surface px-3 py-2 text-xs outline-none focus:border-primary"
        />
        <input
          value={aceitos}
          onChange={(e) => setAceitos(e.target.value)}
          placeholder="Sinônimos aceitos, separados por vírgula (ex: IAM com supra, IAMCSST)"
          className="w-full rounded-lg border border-border/70 bg-surface px-3 py-2 text-xs outline-none focus:border-primary"
        />
        {dicas.map((d, i) => (
          <textarea
            key={i}
            value={d}
            onChange={(e) => setDicas((prev) => prev.map((x, idx) => (idx === i ? e.target.value : x)))}
            placeholder={`Dica ${i + 1} de 5`}
            rows={2}
            className="w-full resize-none rounded-lg border border-border/70 bg-surface px-3 py-2 text-xs outline-none focus:border-primary"
          />
        ))}
        {erro ? <p className="text-xs text-destructive">{erro}</p> : null}
        <button
          onClick={salvar}
          disabled={criar.isPending}
          className="w-full rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground disabled:opacity-60"
        >
          {criar.isPending ? "Salvando..." : "+ Adicionar caso"}
        </button>
      </div>

      <div className="space-y-2">
        {(casos.data ?? []).map((c) => (
          <div key={c.id} className="rounded-lg border border-border/50 bg-surface p-3">
            <div className="flex items-center justify-between gap-2">
              <p className="text-xs font-semibold">{c.diagnostico}</p>
              <div className="flex shrink-0 gap-1.5">
                <button
                  onClick={() => alternarAtivo.mutate({ id: c.id, ativo: !c.ativo })}
                  className={
                    c.ativo
                      ? "rounded-lg border border-success/50 px-2 py-1 text-[11px] text-success"
                      : "rounded-lg border border-border/60 px-2 py-1 text-[11px] text-muted-foreground"
                  }
                >
                  {c.ativo ? "Ativo" : "Inativo"}
                </button>
                <button
                  onClick={() => {
                    if (window.confirm(`Excluir o caso "${c.diagnostico}"?`)) remover.mutate(c.id);
                  }}
                  className="rounded-lg border border-destructive/50 px-2 py-1 text-[11px] text-destructive"
                >
                  Excluir
                </button>
              </div>
            </div>
            {c.aceitos.length ? (
              <p className="mt-1 text-[11px] text-muted-foreground">Aceitos: {c.aceitos.join(", ")}</p>
            ) : null}
          </div>
        ))}
        {!casos.data?.length ? <p className="text-xs text-muted-foreground">Nenhum caso cadastrado ainda.</p> : null}
      </div>
    </div>
  );
}

function QuestoesReportadas() {
  const queryClient = useQueryClient();
  const reportes = useQuery({ queryKey: ["questoes-reportadas"], queryFn: buscarQuestoesReportadas });
  const [editando, setEditando] = useState<QuestaoDb | null>(null);

  const invalidar = () => queryClient.invalidateQueries({ queryKey: ["questoes-reportadas"] });

  const marcarResolvido = useMutation({
    mutationFn: (vars: { id: string; resolvido: boolean }) => marcarReporteResolvido(vars.id, vars.resolvido),
    onSuccess: invalidar,
  });

  const remover = useMutation({
    mutationFn: (id: string) => removerReporte(id),
    onSuccess: invalidar,
  });

  if (reportes.isLoading) return <p className="text-xs text-muted-foreground">Carregando...</p>;
  const lista = reportes.data ?? [];

  return (
    <div className="space-y-2">
      {!lista.length ? (
        <p className="text-xs text-muted-foreground">Nenhum problema reportado até agora.</p>
      ) : (
        lista.map((r) => (
          <div
            key={r.id}
            className={cn(
              "rounded-xl border p-3",
              r.resolvido ? "border-border/40 bg-surface/50 opacity-70" : "border-amber-500/40 bg-amber-500/5",
            )}
          >
            <div className="flex items-start justify-between gap-2">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold">
                  {r.questao ? r.questao.enunciado.slice(0, 100) : "Questão não encontrada (pode ter sido excluída)"}
                  {r.questao && r.questao.enunciado.length > 100 ? "…" : ""}
                </p>
                <p className="mt-1 text-[11px] text-muted-foreground">
                  {r.questao?.banca ? `${r.questao.banca} ${r.questao.ano ?? ""} · ` : ""}
                  {r.reportadoPorEmail ? `reportado por ${r.reportadoPorEmail} · ` : ""}
                  {new Date(r.criadoEm).toLocaleDateString("pt-BR")}
                </p>
                <p className="mt-2 rounded-lg bg-black/20 p-2 text-[11px] text-foreground/90">{r.motivo}</p>
              </div>
              {r.resolvido ? <CheckCircle2 className="size-4 shrink-0 text-success" /> : null}
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {r.questao ? (
                <button
                  onClick={() => setEditando(r.questao)}
                  className="rounded-lg border border-primary/50 px-2 py-1 text-[11px] text-primary"
                >
                  Editar questão
                </button>
              ) : null}
              <button
                onClick={() => marcarResolvido.mutate({ id: r.id, resolvido: !r.resolvido })}
                className="rounded-lg border border-border/60 px-2 py-1 text-[11px] text-muted-foreground"
              >
                {r.resolvido ? "Marcar como pendente" : "Marcar como resolvido"}
              </button>
              <button
                onClick={() => {
                  if (window.confirm("Excluir este reporte?")) remover.mutate(r.id);
                }}
                className="rounded-lg border border-destructive/50 px-2 py-1 text-[11px] text-destructive"
              >
                Excluir reporte
              </button>
            </div>
          </div>
        ))
      )}

      {editando ? (
        <EditarQuestaoAdmin
          questao={editando}
          onFechar={() => {
            setEditando(null);
            invalidar();
          }}
        />
      ) : null}
    </div>
  );
}

function RenomearBotao({ valorAtual, onSalvar }: { valorAtual: string; onSalvar: (novo: string) => Promise<void> }) {
  const [editando, setEditando] = useState(false);
  const [valor, setValor] = useState(valorAtual);
  const [salvando, setSalvando] = useState(false);

  if (!editando) {
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          setValor(valorAtual);
          setEditando(true);
        }}
        className="shrink-0 rounded-lg border border-border/60 p-1.5"
      >
        <Pencil className="size-3" />
      </button>
    );
  }

  return (
    <span className="flex shrink-0 items-center gap-1" onClick={(e) => e.stopPropagation()}>
      <input
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        className="w-28 rounded-lg border border-border/70 bg-surface px-2 py-1 text-[11px] outline-none focus:border-primary"
      />
      <button
        onClick={async () => {
          if (!valor.trim()) return;
          setSalvando(true);
          await onSalvar(valor.trim());
          setSalvando(false);
          setEditando(false);
        }}
        disabled={salvando}
        className="rounded-lg bg-primary px-2 py-1 text-[11px] font-semibold text-primary-foreground disabled:opacity-60"
      >
        OK
      </button>
    </span>
  );
}

function NovoItemForm({ placeholder, onCriar }: { placeholder: string; onCriar: (nome: string) => Promise<void> }) {
  const [nome, setNome] = useState("");
  const [criando, setCriando] = useState(false);

  return (
    <div className="flex gap-2">
      <input
        value={nome}
        onChange={(e) => setNome(e.target.value)}
        placeholder={placeholder}
        className="flex-1 rounded-lg border border-dashed border-border/70 bg-surface px-2 py-1.5 text-[11px] outline-none focus:border-primary"
      />
      <button
        onClick={async () => {
          const nomeLimpo = nome.trim();
          if (!nomeLimpo || criando) return;

          setCriando(true);
          try {
            await onCriar(nomeLimpo);
            setNome("");
          } catch (erro) {
            const mensagem = erro instanceof Error ? erro.message : String(erro);

            if (mensagem.includes("duplicate key value violates unique constraint")) {
              window.alert("Já existe uma pasta com esse nome neste nível. Escolha outro nome.");
            } else {
              window.alert(`Não foi possível criar: ${mensagem}`);
            }
          } finally {
            setCriando(false);
          }
        }}
        disabled={!nome.trim() || criando}
        className="rounded-lg border border-primary/50 px-2 py-1.5 text-[11px] font-semibold text-primary disabled:opacity-50"
      >
        + Criar
      </button>
    </div>
  );
}
