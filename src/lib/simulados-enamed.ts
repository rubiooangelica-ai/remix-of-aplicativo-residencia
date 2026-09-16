import { supabase } from "@/integrations/supabase/client";

export type SituacaoSimulado = "agendado" | "aberto" | "aguardando_gabarito" | "resultado";
export type TipoSimulado = "semanal" | "oficial";
export type StatusGabarito = "autoral" | "preliminar_nao_oficial" | "oficial";

export type AlternativaSimulado = { letra: string; texto: string };

export type SimuladoCatalogo = {
  id: string;
  titulo: string;
  descricao: string;
  tipo: TipoSimulado;
  abreEm: string;
  fechaEm: string;
  gabaritoLiberadoEm: string;
  gabaritoStatus: StatusGabarito;
  gratuito: boolean;
  totalQuestoes: number;
  respondidas: number;
  situacao: SituacaoSimulado;
};

export type QuestaoSimulado = {
  itemId: string;
  ordem: number;
  enunciado: string;
  alternativas: AlternativaSimulado[];
  imagemUrl: string | null;
};

export type SimuladoAberto = {
  id: string;
  titulo: string;
  tipo: TipoSimulado;
  fechaEm: string;
  questoes: QuestaoSimulado[];
  respostas: Record<string, string>;
};

export type ResultadoQuestao = QuestaoSimulado & {
  correta: string;
  marcada: string | null;
  comentario: string | null;
  areaNome: string | null;
  assuntoNome: string | null;
  anulada: boolean;
  resultado: "correta" | "errada" | "branco" | "anulada";
};

export type ResultadoSimulado = {
  id: string;
  titulo: string;
  gabaritoStatus: StatusGabarito;
  totalValidas: number;
  acertos: number;
  emBranco: number;
  questoes: ResultadoQuestao[];
};

export type LinhaRankingSimulado = {
  posicao: number;
  userId: string;
  nome: string;
  acertos: number;
  percentual: number;
};

const db = supabase as any;

const MARCADORES_ESTRUTURA_PENDENTE = [
  "simulados_enamed_catalogo",
  "admin_simulados_enamed_lista",
  "schema cache",
  "simulados_enamed",
];

export function estruturaSimuladosPendente(erro: unknown) {
  const mensagem = erro instanceof Error
    ? erro.message
    : typeof erro === "object" && erro && "message" in erro
      ? String((erro as { message?: unknown }).message ?? "")
      : String(erro ?? "");
  const normalizada = mensagem.toLowerCase();
  return (
    normalizada.includes("could not find the function") ||
    normalizada.includes("could not find the table") ||
    normalizada.includes("relation") && normalizada.includes("does not exist") ||
    MARCADORES_ESTRUTURA_PENDENTE.some((marcador) => normalizada.includes(marcador)) &&
      normalizada.includes("schema cache")
  );
}

function erroSimulado(erro: unknown) {
  if (estruturaSimuladosPendente(erro)) {
    return new Error(
      "A estrutura dos Simulados ENAMED ainda não foi aplicada ao banco publicado. Conecte o Supabase e execute as migrations pendentes.",
    );
  }
  const mensagem = typeof erro === "object" && erro && "message" in erro
    ? String((erro as { message?: unknown }).message ?? "Erro desconhecido.")
    : String(erro ?? "Erro desconhecido.");
  return new Error(mensagem);
}

function alternativas(valor: unknown): AlternativaSimulado[] {
  if (!Array.isArray(valor)) return [];
  return valor.map((a: any) => ({
    letra: String(a?.letra ?? "").toUpperCase(),
    texto: String(a?.texto ?? ""),
  })).filter((a) => a.letra && a.texto);
}

function mapearQuestao(q: any): QuestaoSimulado {
  return {
    itemId: String(q.item_id),
    ordem: Number(q.ordem),
    enunciado: String(q.enunciado ?? ""),
    alternativas: alternativas(q.alternativas),
    imagemUrl: q.imagem_url ? String(q.imagem_url) : null,
  };
}

export async function listarSimuladosEnamed(): Promise<SimuladoCatalogo[]> {
  const { data, error } = await db.rpc("simulados_enamed_catalogo");
  if (error) throw erroSimulado(error);
  const lista = Array.isArray(data) ? data : [];
  return lista.map((s: any) => ({
    id: String(s.id),
    titulo: String(s.titulo ?? "Simulado ENAMED"),
    descricao: String(s.descricao ?? ""),
    tipo: s.tipo === "oficial" ? "oficial" : "semanal",
    abreEm: String(s.abre_em),
    fechaEm: String(s.fecha_em),
    gabaritoLiberadoEm: String(s.gabarito_liberado_em),
    gabaritoStatus: s.gabarito_status ?? "autoral",
    gratuito: s.gratuito !== false,
    totalQuestoes: Number(s.total_questoes ?? 0),
    respondidas: Number(s.respondidas ?? 0),
    situacao: s.situacao as SituacaoSimulado,
  }));
}

export async function abrirSimuladoEnamed(id: string): Promise<SimuladoAberto> {
  const { data, error } = await db.rpc("simulado_enamed_abrir", { p_simulado_id: id });
  if (error) throw erroSimulado(error);
  return {
    id: String(data.id),
    titulo: String(data.titulo),
    tipo: data.tipo === "oficial" ? "oficial" : "semanal",
    fechaEm: String(data.fecha_em),
    questoes: (Array.isArray(data.questoes) ? data.questoes : []).map(mapearQuestao),
    respostas: data.respostas && typeof data.respostas === "object" ? data.respostas : {},
  };
}

export async function salvarRespostaSimulado(simuladoId: string, itemId: string, letra: string) {
  const { error } = await db.rpc("simulado_enamed_salvar_resposta", {
    p_simulado_id: simuladoId,
    p_item_id: itemId,
    p_letra: letra,
  });
  if (error) throw erroSimulado(error);
}

export async function limparRespostaSimulado(simuladoId: string, itemId: string) {
  const { error } = await db.rpc("simulado_enamed_limpar_resposta", {
    p_simulado_id: simuladoId,
    p_item_id: itemId,
  });
  if (error) throw erroSimulado(error);
}

export async function finalizarProvaOficial(simuladoId: string) {
  const { error } = await db.rpc("simulado_enamed_finalizar", { p_simulado_id: simuladoId });
  if (error) throw erroSimulado(error);
}

export async function buscarResultadoSimulado(id: string): Promise<ResultadoSimulado> {
  const { data, error } = await db.rpc("simulado_enamed_resultado", { p_simulado_id: id });
  if (error) throw erroSimulado(error);
  return {
    id: String(data.id),
    titulo: String(data.titulo),
    gabaritoStatus: data.gabarito_status ?? "autoral",
    totalValidas: Number(data.total_validas ?? 0),
    acertos: Number(data.acertos ?? 0),
    emBranco: Number(data.em_branco ?? 0),
    questoes: (Array.isArray(data.questoes) ? data.questoes : []).map((q: any) => ({
      ...mapearQuestao(q),
      correta: String(q.correta ?? ""),
      marcada: q.marcada ? String(q.marcada) : null,
      comentario: q.comentario ? String(q.comentario) : null,
      areaNome: q.area_nome ? String(q.area_nome) : null,
      assuntoNome: q.assunto_nome ? String(q.assunto_nome) : null,
      anulada: q.anulada === true,
      resultado: q.resultado,
    })),
  };
}

export async function buscarRankingSimulado(id: string): Promise<LinhaRankingSimulado[]> {
  const { data, error } = await db.rpc("simulado_enamed_ranking", { p_simulado_id: id });
  if (error) throw erroSimulado(error);
  return (data ?? []).map((l: any) => ({
    posicao: Number(l.posicao),
    userId: String(l.user_id),
    nome: String(l.nome ?? "Estudante"),
    acertos: Number(l.acertos ?? 0),
    percentual: Number(l.percentual ?? 0),
  }));
}


export type SimuladoAdmin = {
  id: string;
  titulo: string;
  tipo: TipoSimulado;
  status: "rascunho" | "publicado";
  abreEm: string;
  fechaEm: string;
  gabaritoLiberadoEm: string;
  totalQuestoes: number;
};

export async function listarSimuladosEnamedAdmin(): Promise<SimuladoAdmin[]> {
  const { data, error } = await db.rpc("admin_simulados_enamed_lista");
  if (error) throw erroSimulado(error);
  return (Array.isArray(data) ? data : []).map((s: any) => ({
    id: String(s.id),
    titulo: String(s.titulo ?? "Simulado ENAMED"),
    tipo: s.tipo === "oficial" ? "oficial" : "semanal",
    status: s.status === "publicado" ? "publicado" : "rascunho",
    abreEm: String(s.abre_em),
    fechaEm: String(s.fecha_em),
    gabaritoLiberadoEm: String(s.gabarito_liberado_em),
    totalQuestoes: Number(s.total_questoes ?? 0),
  }));
}

export async function criarSimuladoEnamedAdmin(input: {
  titulo: string;
  descricao: string;
  tipo: TipoSimulado;
  abreEm: string;
  fechaEm: string;
  gabaritoLiberadoEm: string;
  gratuito: boolean;
  gabaritoStatus: StatusGabarito;
}): Promise<string> {
  const { data, error } = await db.rpc("admin_criar_simulado_enamed", {
    p_titulo: input.titulo,
    p_descricao: input.descricao,
    p_tipo: input.tipo,
    p_abre_em: input.abreEm,
    p_fecha_em: input.fechaEm,
    p_gabarito_liberado_em: input.gabaritoLiberadoEm,
    p_gratuito: input.gratuito,
    p_gabarito_status: input.gabaritoStatus,
  });
  if (error) throw erroSimulado(error);
  return String(data);
}

export async function importarQuestoesSimuladoEnamedAdmin(simuladoId: string, itens: unknown): Promise<number> {
  const { data, error } = await db.rpc("admin_importar_itens_simulado_enamed", {
    p_simulado_id: simuladoId,
    p_itens: itens,
  });
  if (error) throw erroSimulado(error);
  return Number(data ?? 0);
}

export async function publicarSimuladoEnamedAdmin(simuladoId: string) {
  const { error } = await db.rpc("admin_publicar_simulado_enamed", {
    p_simulado_id: simuladoId,
  });
  if (error) throw erroSimulado(error);
}
