import { useMemo, useState, type ComponentType } from "react";
import {
  Activity,
  Apple,
  Baby,
  Bone,
  Brain,
  Bug,
  Building2,
  CalendarRange,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Droplet,
  Ear,
  Eye,
  Filter,
  Fingerprint,
  FlaskConical,
  Heart,
  HeartHandshake,
  Info,
  ListChecks,
  Microscope,
  Pencil,
  Play,
  Scale,
  Search,
  Shield,
  Siren,
  Stethoscope,
  ToggleLeft,
  Users,
  Wind,
  X,
  Zap,
} from "lucide-react";
import type {
  Contagens,
  Facetas,
  FiltroImagem,
  FiltrosSessao,
  QuestaoDb,
  Taxonomia,
  TipoQuestao,
} from "@/lib/banco";
import { buscarQuestoesPorEnunciado, buscarContagensFiltradas } from "@/lib/banco";
import { useQuery } from "@tanstack/react-query";
import { useEhAdmin } from "@/lib/admin";
import { usePlano } from "@/hooks/usePlano";
import { cn } from "@/lib/utils";

const rotuloTipo: Record<TipoQuestao, string> = {
  alternativas: "Alternativas",
  aberta: "Questão aberta",
  vf: "Verdadeiro e falso",
};

const numero = (n: number) => n.toLocaleString("pt-BR");

function alternar<T>(lista: T[], valor: T) {
  return lista.includes(valor) ? lista.filter((x) => x !== valor) : [...lista, valor];
}

function normalizarNome(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function StomachIcon({ className }: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M11 2v5c0 1.7-1.3 3-3 3H5.5C3.6 10 2 11.6 2 13.5V15c0 3.9 3.1 7 7 7h3c5.5 0 10-4.5 10-10 0-1.7-.9-3.2-2.4-4L18 7.1c-.6-.4-1-1-1-1.7V2" />
    </svg>
  );
}

// Um ícone temático por especialidade, só pra dar uma cara própria pra cada
// linha — sempre na cor roxa/preta do app, sem introduzir cor nova.
const ICONES_ESPECIALIDADE: { chave: string; Icone: ComponentType<{ className?: string }> }[] = [
  { chave: "cardiologia", Icone: Heart },
  { chave: "pneumologia", Icone: Wind },
  { chave: "neurologia", Icone: Brain },
  { chave: "psiquiatria", Icone: Brain },
  { chave: "nefrologia", Icone: Filter },
  { chave: "hematologia", Icone: Droplet },
  { chave: "reumatologia", Icone: Bone },
  { chave: "oncologia", Icone: Microscope },
  { chave: "dermatologia", Icone: Fingerprint },
  { chave: "emergencia", Icone: Siren },
  { chave: "urgencia", Icone: Siren },
  { chave: "geriatria", Icone: Users },
  { chave: "nutrologia", Icone: Apple },
  { chave: "toxicologia", Icone: FlaskConical },
  { chave: "intensiva", Icone: Activity },
  { chave: "paliativos", Icone: HeartHandshake },
  { chave: "alergia", Icone: Shield },
  { chave: "imunologia", Icone: Shield },
  { chave: "etica", Icone: Scale },
  { chave: "bioetica", Icone: Scale },
  { chave: "oftalmologia", Icone: Eye },
  { chave: "otorrino", Icone: Ear },
  { chave: "endocrinologia", Icone: Zap },
  { chave: "gastroenterologia", Icone: StomachIcon },
  { chave: "infectologia", Icone: Bug },
  { chave: "infecciosas", Icone: Bug },
  { chave: "propedeutica", Icone: Stethoscope },
  { chave: "puericultura", Icone: Baby },
  { chave: "neonatologia", Icone: Baby },
];

export function iconePorEspecialidade(nome: string) {
  const alvo = normalizarNome(nome);
  const achado = ICONES_ESPECIALIDADE.find((i) => alvo.includes(i.chave));
  return achado?.Icone ?? Stethoscope;
}

function resumoSelecao(nomes: string[]): string | undefined {
  if (!nomes.length) return undefined;
  const primeiros = nomes.slice(0, 2).join(", ");
  const resto = nomes.length > 2 ? ` +${nomes.length - 2}` : "";
  return `${primeiros}${resto} selecionada${nomes.length > 1 ? "s" : ""}`;
}

export function BancoFiltros({
  tax,
  facetas,
  contagens,
  carregando,
  onIniciar,
  assuntoInicial,
}: {
  tax: Taxonomia;
  facetas: Facetas;
  contagens: Contagens;
  carregando: boolean;
  onIniciar: (f: FiltrosSessao) => void;
  /** Quando presente (link tipo /questoes?assunto=ID), o assunto já vem
   * pré-selecionado e o modal "Configurar Sessão" abre automaticamente. */
  assuntoInicial?: string | undefined;
}) {
  const [modoVisao, setModoVisao] = useState<"filtros" | "busca">("filtros");
  const [areas, setAreas] = useState<string[]>([]);
  const [especialidades, setEspecialidades] = useState<string[]>([]);
  const [assuntos, setAssuntos] = useState<string[]>(assuntoInicial ? [assuntoInicial] : []);
  const [anos, setAnos] = useState<number[]>([]);
  const [tipos, setTipos] = useState<TipoQuestao[]>([]);
  const [bancasIncluir, setBancasIncluir] = useState<string[]>([]);
  const [bancasExcluir, setBancasExcluir] = useState<string[]>([]);
  const [quantidade, setQuantidade] = useState(10);
  const [ultimos5, setUltimos5] = useState(false);
  const [porTipo, setPorTipo] = useState(false);
  const [somenteNovas, setSomenteNovas] = useState(false);
  const [buscaEspecialidades, setBuscaEspecialidades] = useState("");
  const [mostrarTodasEspecialidades, setMostrarTodasEspecialidades] = useState(false);
  const [especialidadeExpandida, setEspecialidadeExpandida] = useState<string | null>(null);
  const [areaAberta, setAreaAberta] = useState<string | null>(null);
  const [mostrarTodasBancas, setMostrarTodasBancas] = useState(false);
  const [modalAberto, setModalAberto] = useState(!!assuntoInicial);
  const [tituloSessao, setTituloSessao] = useState("Sessão de Estudos");
  const [modoFoco, setModoFoco] = useState(false);
  const [pularAcertadas, setPularAcertadas] = useState(false);
  const [incluirOcultas, setIncluirOcultas] = useState(false);
  const [filtroImagem, setFiltroImagem] = useState<FiltroImagem>("todas");
  const { ehAdmin } = useEhAdmin();
  const { premium } = usePlano();
  // Questões sem banca/ano: visíveis para admin e premium, ocultas do grátis.
  const podeVerOcultas = ehAdmin || premium;

  // Busca por caso clínico — campo e estado próprios, separados da busca de especialidades.
  const [buscaCaso, setBuscaCaso] = useState("");
  const [buscandoCaso, setBuscandoCaso] = useState(false);
  const [resultadosCaso, setResultadosCaso] = useState<QuestaoDb[] | null>(null);
  const [erroBuscaCaso, setErroBuscaCaso] = useState<string | null>(null);

  const [abaFiltro, setAbaFiltro] = useState<"especialidades" | "instituicoes" | "anos" | "tipo">("especialidades");

  // Contagens de ano/banca/formato e o total geral, cruzando TODOS os
  // filtros ativos (especialidade/tema + anos + bancas + formato).
  const contagensVivas = useQuery({
    queryKey: [
      "contagens-filtradas",
      areas,
      especialidades,
      assuntos,
      anos,
      tipos,
      bancasIncluir,
      bancasExcluir,
      ehAdmin,
      filtroImagem,
    ],
    queryFn: () =>
      buscarContagensFiltradas({
        areaIds: areas,
        especialidadeIds: especialidades,
        assuntoIds: assuntos,
        anos,
        tipos,
        bancasIncluir,
        bancasExcluir,
        incluirOcultas: podeVerOcultas,
        imagem: filtroImagem,
      }),
  });
  const contagensAtivas = contagensVivas.data ?? { anos: {}, bancas: {}, tipos: {}, total: 0 };

  // Bancas e anos vêm das contagens já cruzadas com os filtros ativos
  // (a RPC ignora o próprio filtro de banca ao contar bancas, e o de ano ao
  // contar anos). Enquanto elas não chegam, cai na lista global de facetas.
  const anosDisponiveis = useMemo(() => {
    const vindosDasContagens = Object.keys(contagensAtivas.anos)
      .map((a) => Number(a))
      .filter((a) => Number.isFinite(a));
    const base = vindosDasContagens.length ? vindosDasContagens : facetas.anos;
    return [...new Set([...base, ...anos])].sort((a, b) => b - a);
  }, [contagensAtivas.anos, facetas.anos, anos]);

  const bancasOrdenadas = useMemo(() => {
    const vindasDasContagens = Object.keys(contagensAtivas.bancas)
      .map((b) => b.trim())
      .filter(Boolean);
    const base = vindasDasContagens.length ? vindasDasContagens : facetas.bancas;
    return [...new Set([...base, ...bancasIncluir, ...bancasExcluir])].sort((a, b) =>
      a.localeCompare(b, "pt-BR"),
    );
  }, [contagensAtivas.bancas, facetas.bancas, bancasIncluir, bancasExcluir]);

  const anosEfetivos = useMemo(() => {
    if (!ultimos5) return anos;
    const corte = (anosDisponiveis[0] ?? new Date().getFullYear()) - 4;
    const janela = anosDisponiveis.filter((a) => a >= corte);
    return anos.length ? anos.filter((a) => janela.includes(a)) : janela;
  }, [ultimos5, anos, anosDisponiveis]);

  const chips = useMemo(() => {
    const lista: { id: string; rotulo: string; remover: () => void }[] = [];
    for (const id of areas) {
      const nome = tax.areas.find((a) => a.id === id)?.nome ?? "Área";
      lista.push({ id, rotulo: nome, remover: () => setAreas((v) => alternar(v, id)) });
    }
    for (const id of especialidades) {
      const nome = tax.especialidades.find((e) => e.id === id)?.nome ?? "Especialidade";
      lista.push({ id, rotulo: nome, remover: () => setEspecialidades((v) => alternar(v, id)) });
    }
    for (const id of assuntos) {
      const nome = tax.assuntos.find((s) => s.id === id)?.nome ?? "Assunto";
      lista.push({ id, rotulo: nome, remover: () => setAssuntos((v) => alternar(v, id)) });
    }
    for (const ano of anos)
      lista.push({
        id: `ano-${ano}`,
        rotulo: String(ano),
        remover: () => setAnos((v) => alternar(v, ano)),
      });
    for (const b of bancasIncluir)
      lista.push({
        id: `bi-${b}`,
        rotulo: b,
        remover: () => setBancasIncluir((v) => alternar(v, b)),
      });
    for (const b of bancasExcluir)
      lista.push({
        id: `be-${b}`,
        rotulo: `sem ${b}`,
        remover: () => setBancasExcluir((v) => alternar(v, b)),
      });
    for (const t of tipos)
      lista.push({
        id: `tp-${t}`,
        rotulo: rotuloTipo[t],
        remover: () => setTipos((v) => alternar(v, t)),
      });
    if (filtroImagem !== "todas")
      lista.push({
        id: "img",
        rotulo: filtroImagem === "com" ? "Com imagem" : "Sem imagem",
        remover: () => setFiltroImagem("todas"),
      });
    return lista;
  }, [areas, especialidades, assuntos, anos, bancasIncluir, bancasExcluir, tipos, filtroImagem, tax]);

  function limpar() {
    setAreas([]);
    setEspecialidades([]);
    setAssuntos([]);
    setAnos([]);
    setTipos([]);
    setBancasIncluir([]);
    setBancasExcluir([]);
    setUltimos5(false);
    setPorTipo(false);
    setFiltroImagem("todas");
  }

  const disponiveis = contagensVivas.isLoading ? null : contagensAtivas.total;

  const termo = buscaEspecialidades.trim().toLowerCase();

  function iniciar() {
    setModalAberto(true);
  }

  function confirmarInicio() {
    setModalAberto(false);
    onIniciar({
      areaIds: areas,
      especialidadeIds: especialidades,
      assuntoIds: assuntos,
      anos: anosEfetivos,
      tipos: porTipo ? tipos : [],
      bancasIncluir,
      bancasExcluir,
      quantidade,
      somenteNovas: somenteNovas || pularAcertadas,
      modoFoco,
      titulo: tituloSessao,
      incluirOcultas: podeVerOcultas && (incluirOcultas || premium),
      imagem: filtroImagem,
    });
  }

  async function buscarCasoClinico() {
    setErroBuscaCaso(null);
    const texto = buscaCaso.trim();
    if (texto.length < 3) {
      setErroBuscaCaso("Digite pelo menos 3 letras.");
      return;
    }
    setBuscandoCaso(true);
    try {
      const encontrados = await buscarQuestoesPorEnunciado(texto, quantidade, filtroImagem);
      setResultadosCaso(encontrados);
    } catch (e) {
      setErroBuscaCaso((e as Error).message);
    } finally {
      setBuscandoCaso(false);
    }
  }

  function iniciarComBusca() {
    if (!resultadosCaso?.length) return;
    onIniciar({
      areaIds: [],
      especialidadeIds: [],
      assuntoIds: [],
      anos: [],
      tipos: [],
      bancasIncluir: [],
      bancasExcluir: [],
      quantidade: resultadosCaso.length,
      questaoIds: resultadosCaso.map((q) => q.id),
      titulo: `Caso clínico: "${buscaCaso.trim().slice(0, 40)}"`,
    });
  }

  // Resumos exibidos no subtítulo de cada card, mesmo fechado — mostrando
  // o que já está selecionado ali, em vez de só a contagem.
  const nomesEspSelecionadas = [
    ...areas.map((id) => tax.areas.find((a) => a.id === id)?.nome),
    ...especialidades.map((id) => tax.especialidades.find((e) => e.id === id)?.nome),
    ...assuntos.map((id) => tax.assuntos.find((s) => s.id === id)?.nome),
  ].filter((n): n is string => !!n);
  const resumoEspecialidades = resumoSelecao(nomesEspSelecionadas);
  const resumoBancas = resumoSelecao([...bancasIncluir, ...bancasExcluir.map((b) => `sem ${b}`)]);
  const resumoAnos = resumoSelecao(anos.map(String));
  const resumoTipos = resumoSelecao(tipos.map((t) => rotuloTipo[t]));
  const areasOrdenadas = tax.areas
    .filter((area) => (contagens.areas[area.id] ?? 0) > 0)
    .sort((a, b) => (contagens.areas[b.id] ?? 0) - (contagens.areas[a.id] ?? 0));
  const especialidadesOrdenadas = tax.especialidades
    .filter((esp) => {
      if (areaAberta && esp.area_id !== areaAberta) return false;
      if ((contagens.especialidades[esp.id] ?? 0) === 0) return false;
      if (!termo) return true;
      return (
        esp.nome.toLowerCase().includes(termo) ||
        tax.assuntos.some(
          (assunto) => assunto.especialidade_id === esp.id && assunto.nome.toLowerCase().includes(termo),
        )
      );
    })
    .sort((a, b) => (contagens.especialidades[b.id] ?? 0) - (contagens.especialidades[a.id] ?? 0));
  const especialidadesVisiveis =
    mostrarTodasEspecialidades || termo ? especialidadesOrdenadas : especialidadesOrdenadas.slice(0, 8);
  const bancasVisiveis = mostrarTodasBancas ? bancasOrdenadas : bancasOrdenadas.slice(0, 12);
  const iconesTipo: Record<TipoQuestao, typeof ListChecks> = {
    alternativas: ListChecks,
    aberta: Pencil,
    vf: ToggleLeft,
  };

  return (
    <div className="space-y-4 pb-36">
      {/* Cabeçalho / filtros rápidos */}
      <section className="rounded-3xl border border-border/60 bg-card p-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-muted-foreground">Banco</p>
            <h2 className="font-display text-2xl font-bold leading-tight text-foreground">
              {carregando ? "—" : numero(contagens.total)}
            </h2>
            <p className="text-xs text-muted-foreground">questões catalogadas</p>
          </div>
          <span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary/15 text-primary">
            <ListChecks className="size-6" />
          </span>
        </div>

        {/* Botões de Alternância: Filtrar vs Buscar */}
        <div className="mt-4 flex flex-col sm:flex-row gap-2">
          <button
            onClick={() => setModoVisao("filtros")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-all",
              modoVisao === "filtros"
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "border border-border/70 bg-surface text-muted-foreground hover:border-primary/50",
            )}
          >
            <Filter className="size-4" /> Ajustar filtros
          </button>

          <button
            onClick={() => setModoVisao("busca")}
            className={cn(
              "flex flex-1 items-center justify-center gap-2 rounded-2xl px-4 py-3 text-sm font-semibold transition-all",
              modoVisao === "busca"
                ? "bg-primary text-primary-foreground shadow-lg shadow-primary/25"
                : "border border-border/70 bg-surface text-muted-foreground hover:border-primary/50",
            )}
          >
            <Search className="size-4" /> Buscar por caso clínico
          </button>
        </div>
      </section>

      {modoVisao === "busca" ? (
        <div className="rounded-3xl border border-primary/40 bg-card p-5 shadow-lg">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-primary">Busca por caso clínico</p>
          <textarea
            id="input-caso-clinico"
            value={buscaCaso}
            onChange={(e) => {
              setBuscaCaso(e.target.value);
              setResultadosCaso(null);
              setErroBuscaCaso(null);
            }}
            rows={5}
            placeholder="Ex: Paciente de 67 anos, hipertenso, apresenta quadro súbito de hemiplegia direita..."
            className="w-full resize-none rounded-2xl border border-border/70 bg-surface px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-primary"
          />

          <button
            onClick={buscarCasoClinico}
            disabled={buscandoCaso || buscaCaso.trim().length < 3}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground transition-transform disabled:opacity-50"
          >
            <Search className="size-4" /> {buscandoCaso ? "Buscando..." : "Buscar"}
          </button>

          {erroBuscaCaso ? <p className="mt-2 text-xs text-destructive">{erroBuscaCaso}</p> : null}

          {resultadosCaso ? (
            <p className="mt-2 text-xs text-muted-foreground">
              {resultadosCaso.length
                ? `${numero(resultadosCaso.length)} questão(ões) encontrada(s).`
                : "Nenhuma questão encontrada com esse texto — tente outras palavras."}
            </p>
          ) : (
            <p className="mt-2 text-right text-[11px] text-muted-foreground">
              A busca procura o texto digitado no enunciado das questões.
            </p>
          )}
        </div>
      ) : (
        <>
          {/* Filtros ativos */}
          <section className="rounded-3xl border border-border/60 bg-card p-4">
            <div className="flex items-center justify-between gap-3">
              <p className="flex min-w-0 items-center gap-2 font-display text-sm font-semibold">
                Filtros
                <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[11px] text-primary">{chips.length}</span>
              </p>
              {chips.length ? (
                <button onClick={limpar} className="shrink-0 text-xs font-medium text-primary">
                  Limpar
                </button>
              ) : null}
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              {chips.length ? (
                chips.map((c) => (
                  <button
                    key={c.id}
                    onClick={c.remover}
                    className="flex items-center gap-1.5 rounded-full border border-primary/50 bg-primary/10 px-3 py-1.5 text-xs font-medium text-foreground"
                  >
                    {c.rotulo}
                    <X className="size-3 text-muted-foreground" />
                  </button>
                ))
              ) : (
                <p className="text-xs text-muted-foreground">Nenhum filtro — a sessão considera todo o banco.</p>
              )}
            </div>
          </section>

          {/* Abas de categorias de filtro */}
          <div className="flex gap-2 overflow-x-auto pb-1">
            {(
              [
                {
                  id: "especialidades",
                  rotulo: "Especialidades",
                  icone: <Stethoscope className="size-4" />,
                  contagem: especialidades.length + assuntos.length,
                },
                {
                  id: "instituicoes",
                  rotulo: "Bancas",
                  icone: <Building2 className="size-4" />,
                  contagem: bancasIncluir.length + bancasExcluir.length,
                },
                { id: "anos", rotulo: "Anos", icone: <CalendarRange className="size-4" />, contagem: anos.length },
                { id: "tipo", rotulo: "Formato", icone: <ListChecks className="size-4" />, contagem: tipos.length },
              ] as const
            ).map((aba) => {
              const ativa = abaFiltro === aba.id;
              return (
                <button
                  key={aba.id}
                  onClick={() => setAbaFiltro(aba.id)}
                  aria-pressed={ativa}
                  className={cn(
                    "flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-semibold transition-colors",
                    ativa
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border/70 bg-card text-muted-foreground",
                  )}
                >
                  {aba.icone}
                  {aba.rotulo}
                  {aba.contagem > 0 ? (
                    <span
                      className={cn(
                        "grid size-5 place-items-center rounded-full text-[10px] font-bold",
                        ativa ? "bg-primary-foreground text-primary" : "bg-primary/15 text-primary",
                      )}
                    >
                      {aba.contagem}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>

          {/* Painel da categoria ativa */}
          <div className="rounded-3xl border border-border/60 bg-card p-4">
            {abaFiltro === "especialidades" ? (
              <>
                <BuscaInterna
                  valor={buscaEspecialidades}
                  onChange={setBuscaEspecialidades}
                  placeholder="Pesquisar especialidades e temas..."
                />

                {areaAberta ? (
                  <button
                    onClick={() => {
                      setAreaAberta(null);
                      setEspecialidadeExpandida(null);
                    }}
                    className="mt-3 flex items-center gap-1.5 text-xs font-medium text-primary"
                  >
                    <ChevronLeft className="size-3.5" />
                    Voltar para áreas · {tax.areas.find((a) => a.id === areaAberta)?.nome}
                  </button>
                ) : null}
                {!areaAberta && !termo ? (
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
                    {areasOrdenadas.map((area) => {
                      const IconeArea = iconePorEspecialidade(area.nome);
                      return (
                        <button
                          key={area.id}
                          onClick={() => setAreaAberta(area.id)}
                          className="flex min-h-32 flex-col items-start justify-between rounded-2xl border border-border/70 bg-surface p-3 text-left transition-colors hover:border-primary/60"
                        >
                          <IconeArea className="size-7" />
                          <span className="mt-4 block text-sm font-semibold leading-tight">{area.nome}</span>
                          <span className="mt-1 text-[11px] text-muted-foreground">
                            {numero(contagens.areas[area.id] ?? 0)} questões
                          </span>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {especialidadesVisiveis.map((esp) => {
                const IconeEsp = iconePorEspecialidade(esp.nome);
                const selecionada = especialidades.includes(esp.id);
                const expandida = especialidadeExpandida === esp.id;
                const subs = tax.assuntos
                  .filter((s) => s.especialidade_id === esp.id && (contagens.assuntos[s.id] ?? 0) > 0)
                  .sort((a, b) => (contagens.assuntos[b.id] ?? 0) - (contagens.assuntos[a.id] ?? 0));
                return (
                  <div
                    key={esp.id}
                    className={cn(
                      "relative rounded-2xl border transition-colors",
                      expandida ? "col-span-2 sm:col-span-3" : "",
                      selecionada ? "border-primary bg-primary text-primary-foreground" : "border-border/70 bg-surface",
                    )}
                  >
                    <button
                      onClick={() => setEspecialidadeExpandida(expandida ? null : esp.id)}
                      className="flex min-h-32 w-full flex-col items-start justify-between p-3 pr-10 text-left"
                    >
                      <IconeEsp className="size-7" />
                      <span className="mt-4 block text-sm font-semibold leading-tight">{esp.nome}</span>
                      <span className={cn("mt-1 text-[11px]", selecionada ? "text-primary-foreground" : "text-muted-foreground")}>
                        {numero(contagens.especialidades[esp.id] ?? 0)} questões
                      </span>
                    </button>
                    <button
                      onClick={() => setEspecialidades((v) => alternar(v, esp.id))}
                      aria-pressed={selecionada}
                      aria-label={
                        selecionada ? `Remover ${esp.nome} dos filtros` : `Selecionar toda a especialidade ${esp.nome}`
                      }
                      className={cn(
                        "absolute right-2 top-2 flex size-6 items-center justify-center rounded-full border-2 transition-colors",
                        selecionada
                          ? "border-primary-foreground bg-primary-foreground text-primary"
                          : "border-border/70 text-transparent hover:border-primary/60",
                      )}
                    >
                      <Check className="size-3.5" strokeWidth={3} />
                    </button>
                    {expandida ? (
                      <div
                        className={cn(
                          "flex flex-wrap gap-2 border-t p-3",
                          selecionada ? "border-primary-foreground/20" : "border-border/60",
                        )}
                      >
                        {subs.map((s) => (
                          <button
                            key={s.id}
                            onClick={() => setAssuntos((v) => alternar(v, s.id))}
                            className={cn(
                              "rounded-full border px-3 py-1.5 text-xs font-medium",
                              assuntos.includes(s.id)
                                ? selecionada
                                  ? "border-primary-foreground bg-primary-foreground text-primary"
                                  : "border-primary bg-primary text-primary-foreground"
                                : selecionada
                                  ? "border-primary-foreground/40 text-primary-foreground"
                                  : "border-border/70 text-muted-foreground",
                            )}
                          >
                            {s.nome} · {numero(contagens.assuntos[s.id] ?? 0)}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                      );
                    })}
                    {!termo && especialidadesOrdenadas.length > 8 ? (
                      <button
                        onClick={() => setMostrarTodasEspecialidades((v) => !v)}
                        className="min-h-32 rounded-2xl border border-dashed border-primary/50 bg-primary/5 p-3 text-sm font-semibold text-primary"
                      >
                        {mostrarTodasEspecialidades
                          ? "Mostrar menos"
                          : `+ ${especialidadesOrdenadas.length - 8} especialidades`}
                      </button>
                    ) : null}
                  </div>
                )}
              </>
            ) : null}

            {abaFiltro === "instituicoes" && !bancasOrdenadas.length ? (
              <p className="text-xs text-muted-foreground">
                {contagensVivas.isPending
                  ? "Carregando bancas..."
                  : "Nenhuma banca disponível com os filtros atuais."}
              </p>
            ) : null}

            {abaFiltro === "instituicoes" && bancasOrdenadas.length ? (
              <div className="flex flex-wrap gap-2">
                {bancasVisiveis.map((b) => {
                  const incluida = bancasIncluir.includes(b);
                  const excluida = bancasExcluir.includes(b);
                  return (
                    <button
                      key={b}
                      onClick={() => {
                        if (incluida) {
                          setBancasIncluir((v) => alternar(v, b));
                          setBancasExcluir((v) => [...v, b]);
                        } else if (excluida) {
                          setBancasExcluir((v) => alternar(v, b));
                        } else {
                          setBancasIncluir((v) => [...v, b]);
                        }
                      }}
                      className={cn(
                        "rounded-full border px-3 py-2 text-xs font-medium transition-colors",
                        incluida
                          ? "border-primary bg-primary text-primary-foreground"
                          : excluida
                            ? "border-destructive bg-destructive/15 text-destructive line-through"
                            : "border-border/70 text-muted-foreground",
                      )}
                    >
                      {b} · {numero(contagensAtivas.bancas[b] ?? 0)}
                    </button>
                  );
                })}
                {bancasOrdenadas.length > 12 ? (
                  <button
                    onClick={() => setMostrarTodasBancas((v) => !v)}
                    className="rounded-full border border-dashed border-primary/50 px-3 py-2 text-xs font-medium text-primary"
                  >
                    {mostrarTodasBancas ? "Mostrar menos" : `+ ${bancasOrdenadas.length - 12} bancas`}
                  </button>
                ) : null}
              </div>
            ) : null}

            {abaFiltro === "anos" && !anosDisponiveis.length ? (
              <p className="text-xs text-muted-foreground">
                {contagensVivas.isPending
                  ? "Carregando anos..."
                  : "Nenhum ano disponível com os filtros atuais."}
              </p>
            ) : null}

            {abaFiltro === "anos" && anosDisponiveis.length ? (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {anosDisponiveis.map((a) => (
                  <button
                    key={a}
                    onClick={() => setAnos((v) => alternar(v, a))}
                    className={cn(
                      "rounded-xl border px-2 py-3 text-center transition-colors",
                      anos.includes(a)
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border/70 bg-surface text-foreground",
                    )}
                  >
                    <span className="block text-sm font-semibold">{a}</span>
                    <span
                      className={cn(
                        "mt-0.5 block text-[10px]",
                        anos.includes(a) ? "text-primary-foreground" : "text-muted-foreground",
                      )}
                    >
                      {numero(contagensAtivas.anos[String(a)] ?? 0)}
                    </span>
                  </button>
                ))}
              </div>
            ) : null}

            {abaFiltro === "tipo" ? (
              <div className="grid grid-cols-3 gap-2">
                {(["alternativas", "aberta", "vf"] as TipoQuestao[]).map((t) => {
                  const IconeTipo = iconesTipo[t];
                  const selecionado = tipos.includes(t);
                  return (
                    <button
                      key={t}
                      onClick={() => {
                        setPorTipo(true);
                        setTipos((v) => alternar(v, t));
                      }}
                      aria-pressed={selecionado}
                      className={cn(
                        "flex min-h-28 flex-col items-start justify-between rounded-2xl border p-3 text-left transition-colors",
                        selecionado
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border/70 bg-surface text-foreground",
                      )}
                    >
                      <IconeTipo className="size-6" />
                      <span className="mt-3 text-xs font-semibold leading-tight">{rotuloTipo[t]}</span>
                      <span
                        className={cn("text-[10px]", selecionado ? "text-primary-foreground" : "text-muted-foreground")}
                      >
                        {numero(contagensAtivas.tipos[t] ?? 0)} questões
                      </span>
                    </button>
                  );
                })}
              </div>
            ) : null}

            {/* Filtro por imagem — combina com os demais filtros */}
            <div className="mt-4 border-t border-border/50 pt-4">
              <p className="text-xs font-semibold text-foreground">Imagem na questão</p>
              <div className="mt-2 grid grid-cols-3 gap-2">
                {(
                  [
                    { id: "todas", rotulo: "Todas" },
                    { id: "com", rotulo: "Com imagem" },
                    { id: "sem", rotulo: "Sem imagem" },
                  ] as const
                ).map((op) => {
                  const ativo = filtroImagem === op.id;
                  return (
                    <button
                      key={op.id}
                      onClick={() => setFiltroImagem(op.id)}
                      aria-pressed={ativo}
                      className={cn(
                        "rounded-2xl border px-3 py-2.5 text-xs font-semibold transition-colors",
                        ativo
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border/70 bg-surface text-muted-foreground",
                      )}
                    >
                      {op.rotulo}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </>
      )}
      {/* Rodapé de Ação */}
      <div className="fixed inset-x-0 bottom-[65px] z-40 border-t border-border/60 bg-card/95 px-5 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <p className="min-w-0 text-xs text-muted-foreground">
            {modoVisao === "busca"
              ? resultadosCaso?.length
                ? `${numero(resultadosCaso.length)} questões encontradas`
                : "Busque um caso clínico acima para continuar"
              : carregando
                ? "Carregando acervo..."
                : disponiveis === null
                  ? "Calculando..."
                  : `${numero(disponiveis)} questões disponíveis · sessão de ${quantidade}`}
          </p>
          <button
            onClick={modoVisao === "busca" ? iniciarComBusca : iniciar}
            disabled={modoVisao === "busca" && !resultadosCaso?.length}
            className="flex shrink-0 items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-3 text-sm font-semibold text-primary-foreground transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
          >
            <Play className="size-4" /> Iniciar sessão
          </button>
        </div>
      </div>
      {modalAberto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-3xl border border-primary/30 bg-card p-6 text-foreground shadow-2xl space-y-6 animate-in fade-in zoom-in-95 duration-200">
            {/* Cabeçalho do Modal */}
            <div className="flex items-center justify-between border-b border-border/40 pb-4">
              <div>
                <h3 className="font-display text-xl font-bold text-foreground">Configurar Sessão</h3>
                <p className="text-xs text-muted-foreground">Personalize os ajustes finais antes de começar</p>
              </div>
              <button
                onClick={() => setModalAberto(false)}
                className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted"
              >
                <X className="size-5" />
              </button>
            </div>

            {/* 1. Título Personalizado */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Título da Sessão
              </label>
              <input
                type="text"
                value={tituloSessao}
                onChange={(e) => setTituloSessao(e.target.value)}
                placeholder="Ex: Revisão Rápida - Cardiologia"
                className="w-full rounded-2xl border border-border/70 bg-background px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary"
              />
            </div>

            {/* 2. Seletor de Quantidade (Slider) */}
            <div className="space-y-2 rounded-2xl border border-border/60 bg-background/70 p-4">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground font-medium">Quantidade de Questões</span>
                <span className="font-display font-bold text-[#9D4EDD] text-sm">{quantidade}</span>
              </div>
              <input
                type="range"
                min={5}
                max={50}
                value={quantidade}
                onChange={(e) => setQuantidade(Number(e.target.value))}
                className="w-full accent-[#9D4EDD] cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-muted-foreground">
                <span>5 qts</span>
                <span>50 qts</span>
              </div>
            </div>

            {/* 3. Opções Exclusivas (Toggles) */}
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Opções Avançadas
              </label>

              {/* Toggle Modo Foco */}
              <div
                onClick={() => setModoFoco(!modoFoco)}
                className="flex cursor-pointer items-center justify-between rounded-2xl border border-border/60 bg-background/70 p-3.5 transition-colors hover:border-primary/50"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">Modo Foco Sem Limite de Tempo</p>
                  <p className="text-[11px] text-muted-foreground">Oculta cronômetros para estudo relaxado</p>
                </div>
                <div
                  className={`relative h-6 w-11 rounded-full transition-colors ${modoFoco ? "bg-[#9D4EDD]" : "bg-muted"}`}
                >
                  <span
                    className={`absolute top-0.5 size-5 rounded-full bg-white transition-all ${modoFoco ? "left-[22px]" : "left-0.5"}`}
                  />
                </div>
              </div>

              {/* Toggle Pular Questões Já Acertadas */}
              <div
                onClick={() => setPularAcertadas(!pularAcertadas)}
                className="flex cursor-pointer items-center justify-between rounded-2xl border border-border/60 bg-background/70 p-3.5 transition-colors hover:border-primary/50"
              >
                <div>
                  <p className="text-sm font-medium text-foreground">Pular Questões Já Acertadas</p>
                  <p className="text-[11px] text-muted-foreground">Foco apenas em pendentes ou erros anteriores</p>
                </div>
                <div
                  className={`relative h-6 w-11 rounded-full transition-colors ${pularAcertadas ? "bg-[#9D4EDD]" : "bg-muted"}`}
                >
                  <span
                    className={`absolute top-0.5 size-5 rounded-full bg-white transition-all ${pularAcertadas ? "left-[22px]" : "left-0.5"}`}
                  />
                </div>
              </div>

              {/* Toggle Mostrar questões ocultadas — só aparece pra admin */}
              {ehAdmin ? (
                <div
                  onClick={() => setIncluirOcultas(!incluirOcultas)}
                  className="flex cursor-pointer items-center justify-between rounded-2xl border border-border/60 bg-background/70 p-3.5 transition-colors hover:border-primary/50"
                >
                  <div>
                    <p className="text-sm font-medium text-foreground">Mostrar questões ocultadas</p>
                    <p className="text-[11px] text-muted-foreground">
                      Inclui questões sem banca/ano cadastrados (admin)
                    </p>
                  </div>
                  <div
                    className={`relative h-6 w-11 rounded-full transition-colors ${incluirOcultas ? "bg-[#9D4EDD]" : "bg-muted"}`}
                  >
                    <span
                      className={`absolute top-0.5 size-5 rounded-full bg-white transition-all ${incluirOcultas ? "left-[22px]" : "left-0.5"}`}
                    />
                  </div>
                </div>
              ) : null}
            </div>

            {/* Botão de Ação Final */}
            <button
              onClick={confirmarInicio}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-[#9D4EDD] px-4 py-4 text-sm font-semibold text-white shadow-lg shadow-[#9D4EDD]/25 hover:bg-[#8637cb] transition-all transform hover:scale-[1.01]"
            >
              <Play className="size-4 fill-white" /> Começar Sessão
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function Secao({
  id,
  icone,
  titulo,
  resumo,
  aberta,
  onToggle,
  children,
}: {
  id: string;
  icone: React.ReactNode;
  titulo: string;
  resumo?: string | undefined;
  aberta: boolean;
  onToggle: (id: string) => void;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cn(
        "overflow-hidden rounded-2xl border bg-card transition-colors",
        aberta ? "border-primary/40 border-l-[3px] border-l-primary" : "border-border/60",
      )}
    >
      <button
        onClick={() => onToggle(id)}
        aria-expanded={aberta}
        className="grid w-full grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 px-4 py-4 text-left"
      >
        <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/15 text-primary">{icone}</span>
        <span className="min-w-0">
          <span className="block truncate font-display text-sm font-semibold text-foreground">{titulo}</span>
          {resumo ? (
            <span className="block truncate text-[11px] font-medium text-primary">{resumo}</span>
          ) : (
            <span className="text-[11px] text-muted-foreground">Todos</span>
          )}
        </span>
        {aberta ? (
          <ChevronDown className="size-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
        )}
      </button>
      {aberta ? <div className="border-t border-border/50 px-4 py-3">{children}</div> : null}
    </section>
  );
}

function BuscaInterna({
  valor,
  onChange,
  placeholder,
}: {
  valor: string;
  onChange: (v: string) => void;
  placeholder: string;
}) {
  return (
    <label className="flex items-center gap-2 rounded-2xl border border-border/70 bg-surface px-3 py-2.5">
      <Search className="size-4 shrink-0 text-muted-foreground" />
      <input
        value={valor}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </label>
  );
}

function SecaoLista({
  id,
  icone,
  titulo,
  resumo,
  placeholder,
  aberta,
  onToggle,
  itens,
  vazio,
  acao,
}: {
  id: string;
  icone: React.ReactNode;
  titulo: string;
  resumo?: string | undefined;
  placeholder: string;
  aberta: boolean;
  onToggle: (id: string) => void;
  itens: {
    id: string;
    nome: string;
    contagem: number;
    marcada: boolean;
    excluida?: boolean | undefined;
    onMarcar: () => void;
  }[];
  vazio: string;
  acao?: { rotulo: string; onClick: () => void };
}) {
  const [termo, setTermo] = useState("");
  const filtrados = itens.filter((i) => i.nome.toLowerCase().includes(termo.trim().toLowerCase()));
  return (
    <Secao id={id} icone={icone} titulo={titulo} resumo={resumo} aberta={aberta} onToggle={onToggle}>
      <BuscaInterna valor={termo} onChange={setTermo} placeholder={placeholder} />
      {acao ? (
        <button onClick={acao.onClick} className="mt-2 text-xs font-medium text-primary">
          {acao.rotulo}
        </button>
      ) : null}
      <div className="mt-2 space-y-1">
        {filtrados.length ? (
          filtrados.map((i) => (
            <Linha
              key={i.id}
              nome={i.nome}
              contagem={i.contagem}
              nivel={0}
              marcada={i.marcada}
              excluida={i.excluida}
              onMarcar={i.onMarcar}
            />
          ))
        ) : (
          <p className="py-2 text-xs text-muted-foreground">{vazio}</p>
        )}
      </div>
    </Secao>
  );
}

function Linha({
  nome,
  contagem,
  nivel,
  marcada,
  excluida,
  onMarcar,
  expandivel,
  expandida,
  onExpandir,
  icone,
}: {
  nome: string;
  contagem: number;
  nivel: 0 | 1 | 2;
  marcada: boolean;
  excluida?: boolean | undefined;
  onMarcar: () => void;
  expandivel?: boolean;
  expandida?: boolean;
  onExpandir?: () => void;
  icone?: React.ReactNode;
}) {
  return (
    <div
      onClick={onMarcar}
      className={cn(
        "flex items-center gap-2 rounded-xl py-1.5 px-2 cursor-pointer transition-all duration-200",
        marcada
          ? "bg-primary/15 text-primary font-medium"
          : excluida
            ? "bg-destructive/15 text-destructive"
            : "hover:bg-white/5 text-foreground",
      )}
      style={{ paddingLeft: nivel * 14 + 8 }}
    >
      {/* Ícone de selecionado/excluído no lugar da antiga caixa de seleção */}
      {marcada ? (
        <Check className="size-4 shrink-0" />
      ) : excluida ? (
        <X className="size-4 shrink-0" />
      ) : (
        <div className="size-4 shrink-0" />
      )}

      {icone ? (
        <span className={cn("shrink-0", marcada ? "text-primary" : "text-muted-foreground")}>{icone}</span>
      ) : null}

      <div
        className={cn(
          "min-w-0 flex-1 truncate text-left",
          nivel === 0 ? "text-sm" : "text-sm",
          nivel === 2 && "text-xs",
          excluida ? "line-through" : !marcada && nivel > 0 && "text-muted-foreground",
        )}
      >
        {nome}
      </div>

      <span
        className={cn(
          "shrink-0 text-[11px] tabular-nums",
          marcada || excluida ? "opacity-80" : "text-muted-foreground",
        )}
      >
        {numero(contagem)}
      </span>

      {expandivel ? (
        <button
          onClick={(e) => {
            e.stopPropagation(); // Impede que clicar na setinha marque a opção
            if (onExpandir) onExpandir();
          }}
          aria-label={expandida ? "Recolher" : "Expandir"}
          className="shrink-0 p-1 hover:bg-black/20 rounded-md transition-colors"
        >
          {expandida ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
        </button>
      ) : (
        <span className="w-4 shrink-0" />
      )}
    </div>
  );
}

function Switch({
  rotulo,
  badge,
  ajuda,
  ativo,
  onChange,
}: {
  rotulo: string;
  badge?: string;
  ajuda: string;
  ativo: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center gap-3 py-3">
      <button
        onClick={() => onChange(!ativo)}
        role="switch"
        aria-checked={ativo}
        aria-label={rotulo}
        className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", ativo ? "bg-primary" : "bg-muted")}
      >
        <span
          className={cn(
            "absolute top-0.5 size-5 rounded-full bg-background transition-all",
            ativo ? "left-[22px]" : "left-0.5",
          )}
        />
      </button>
      <div className="min-w-0 flex-1">
        <p className="flex flex-wrap items-center gap-2 text-sm font-medium text-foreground">
          <span className="truncate">{rotulo}</span>
          {badge ? (
            <span className="rounded-full bg-primary/15 px-2 py-0.5 text-[10px] text-primary">{badge}</span>
          ) : null}
        </p>
      </div>
      <span title={ajuda} aria-label={ajuda} className="shrink-0 text-muted-foreground">
        <Info className="size-4" />
      </span>
    </div>
  );
}
