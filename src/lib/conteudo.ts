import { supabase } from "@/integrations/supabase/client";
import type { QuestaoDb } from "@/lib/banco";

export type MaterialStatus = "rascunho" | "revisao" | "publicado" | "arquivado";
export type MaterialNivel = "faculdade" | "residencia" | "aprofundado";
export type MaterialOrigem = "anotacoes_aula" | "anotacoes_casa" | "guideline" | "misto";

export type FonteMaterial = {
  tipo: "anotacao" | "guideline" | "livro" | "artigo" | "outro";
  titulo: string;
  referencia?: string | null;
  url?: string | null;
  ano?: number | null;
};

export type ImagemMaterial = {
  url: string;
  legenda?: string | null;
  fonte?: string | null;
  tipo: "guideline" | "autoral" | "livre";
};

export type Material = {
  id: string;
  titulo: string;
  subtitulo: string | null;
  conteudo: string;
  areaId: string | null;
  especialidadeId: string | null;
  assuntoId: string | null;
  status: MaterialStatus;
  nivel: MaterialNivel;
  origem: MaterialOrigem;
  fontes: FonteMaterial[];
  imagens: ImagemMaterial[];
  pontosProva: string[];
  revisadoEm: string | null;
  criadoEm: string;
  atualizadoEm: string | null;
};

const CAMPOS_MATERIAL_COMPLETO = "id, titulo, subtitulo, conteudo, area_id, especialidade_id, assunto_id, status, nivel, origem, fontes, imagens, pontos_prova, revisado_em, created_at, atualizado_em";
const CAMPOS_MATERIAL_LEGADO = "id, titulo, conteudo, area_id, especialidade_id, assunto_id, created_at";

function comoLista<T>(valor: unknown): T[] {
  return Array.isArray(valor) ? (valor as T[]) : [];
}

function normalizarMaterial(l: {
  id: string;
  titulo: string;
  subtitulo?: string | null;
  conteudo: string;
  area_id: string | null;
  especialidade_id: string | null;
  assunto_id: string | null;
  status?: string | null;
  nivel?: string | null;
  origem?: string | null;
  fontes?: unknown;
  imagens?: unknown;
  pontos_prova?: unknown;
  revisado_em?: string | null;
  created_at: string;
  atualizado_em?: string | null;
}): Material {
  return {
    id: l.id,
    titulo: l.titulo,
    subtitulo: l.subtitulo ?? null,
    conteudo: l.conteudo,
    areaId: l.area_id,
    especialidadeId: l.especialidade_id,
    assuntoId: l.assunto_id,
    status: (l.status ?? "publicado") as MaterialStatus,
    nivel: (l.nivel ?? "residencia") as MaterialNivel,
    origem: (l.origem ?? "misto") as MaterialOrigem,
    fontes: comoLista<FonteMaterial>(l.fontes),
    imagens: comoLista<ImagemMaterial>(l.imagens),
    pontosProva: comoLista<string>(l.pontos_prova),
    revisadoEm: l.revisado_em ?? null,
    criadoEm: l.created_at,
    atualizadoEm: l.atualizado_em ?? null,
  };
}

function erroDeSchemaMaterial(error: { message?: string; code?: string } | null) {
  const texto = `${error?.code ?? ""} ${error?.message ?? ""}`;
  return /column .* does not exist|schema cache|Could not find|PGRST/i.test(texto);
}

export async function buscarMateriais(opcoes?: { incluirRascunhos?: boolean }): Promise<Material[]> {
  let qCompleta = supabase
    .from("materiais")
    .select(CAMPOS_MATERIAL_COMPLETO)
    .order("titulo");

  if (!opcoes?.incluirRascunhos) qCompleta = qCompleta.eq("status", "publicado");

  const completa = await qCompleta;
  if (!completa.error) return (completa.data ?? []).map(normalizarMaterial);

  if (!erroDeSchemaMaterial(completa.error)) throw new Error(completa.error.message);

  // Compatibilidade com o banco antigo: antes dos metadados editoriais, a tabela
  // materiais tinha apenas estes campos. Isso evita tela vazia enquanto a migration
  // nova ainda não foi aplicada no Supabase/Lovable publicado.
  const legado = await supabase
    .from("materiais")
    .select(CAMPOS_MATERIAL_LEGADO)
    .order("titulo");

  if (legado.error) throw new Error(legado.error.message);
  return (legado.data ?? []).map(normalizarMaterial);
}

export async function enviarImagemMaterial(arquivo: File): Promise<string> {
  const extensao = arquivo.name.split(".").pop() ?? "png";
  const caminho = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${extensao}`;
  const { error } = await supabase.storage.from("materiais-imagens").upload(caminho, arquivo);
  if (error) throw new Error(error.message);
  return supabase.storage.from("materiais-imagens").getPublicUrl(caminho).data.publicUrl;
}

export async function criarMaterial(input: {
  titulo: string;
  subtitulo?: string | null;
  conteudo: string;
  criadoPor: string;
  areaId?: string | null;
  especialidadeId?: string | null;
  assuntoId?: string | null;
  status?: MaterialStatus;
  nivel?: MaterialNivel;
  origem?: MaterialOrigem;
  fontes?: FonteMaterial[];
  imagens?: ImagemMaterial[];
  pontosProva?: string[];
}): Promise<Material> {
  const registroCompleto = {
    titulo: input.titulo.trim(),
    subtitulo: input.subtitulo?.trim() || null,
    conteudo: input.conteudo.trim(),
    criado_por: input.criadoPor,
    area_id: input.areaId ?? null,
    especialidade_id: input.especialidadeId ?? null,
    assunto_id: input.assuntoId ?? null,
    status: input.status ?? "rascunho",
    nivel: input.nivel ?? "residencia",
    origem: input.origem ?? "misto",
    fontes: input.fontes ?? [],
    imagens: input.imagens ?? [],
    pontos_prova: input.pontosProva ?? [],
  };

  const completo = await supabase
    .from("materiais")
    .insert(registroCompleto)
    .select(CAMPOS_MATERIAL_COMPLETO)
    .single();

  if (!completo.error) return normalizarMaterial(completo.data);
  if (!erroDeSchemaMaterial(completo.error)) throw new Error(completo.error.message);

  const legado = await supabase
    .from("materiais")
    .insert({
      titulo: input.titulo.trim(),
      conteudo: input.conteudo.trim(),
      criado_por: input.criadoPor,
      area_id: input.areaId ?? null,
      especialidade_id: input.especialidadeId ?? null,
      assunto_id: input.assuntoId ?? null,
    })
    .select(CAMPOS_MATERIAL_LEGADO)
    .single();
  if (legado.error) throw new Error(legado.error.message);
  return normalizarMaterial(legado.data);
}

export async function editarMaterial(
  id: string,
  input: {
    titulo: string;
    subtitulo?: string | null;
    conteudo: string;
    areaId?: string | null;
    especialidadeId?: string | null;
    assuntoId?: string | null;
    status?: MaterialStatus;
    nivel?: MaterialNivel;
    origem?: MaterialOrigem;
    fontes?: FonteMaterial[];
    imagens?: ImagemMaterial[];
    pontosProva?: string[];
  },
): Promise<Material> {
  const completo = await supabase
    .from("materiais")
    .update({
      titulo: input.titulo.trim(),
      subtitulo: input.subtitulo?.trim() || null,
      conteudo: input.conteudo.trim(),
      area_id: input.areaId ?? null,
      especialidade_id: input.especialidadeId ?? null,
      assunto_id: input.assuntoId ?? null,
      ...(input.status ? { status: input.status } : {}),
      ...(input.nivel ? { nivel: input.nivel } : {}),
      ...(input.origem ? { origem: input.origem } : {}),
      ...(input.fontes ? { fontes: input.fontes } : {}),
      ...(input.imagens ? { imagens: input.imagens } : {}),
      ...(input.pontosProva ? { pontos_prova: input.pontosProva } : {}),
    })
    .eq("id", id)
    .select(CAMPOS_MATERIAL_COMPLETO)
    .single();

  if (!completo.error) return normalizarMaterial(completo.data);
  if (!erroDeSchemaMaterial(completo.error)) throw new Error(completo.error.message);

  const legado = await supabase
    .from("materiais")
    .update({
      titulo: input.titulo.trim(),
      conteudo: input.conteudo.trim(),
      area_id: input.areaId ?? null,
      especialidade_id: input.especialidadeId ?? null,
      assunto_id: input.assuntoId ?? null,
    })
    .eq("id", id)
    .select(CAMPOS_MATERIAL_LEGADO)
    .single();

  if (legado.error) throw new Error(legado.error.message);
  return normalizarMaterial(legado.data);
}

export async function publicarMaterial(id: string) {
  const { error } = await supabase.rpc("admin_publicar_material", { p_material_id: id });
  if (error) {
    if (erroDeSchemaMaterial(error)) {
      const { error: updateError } = await supabase.from("materiais").update({}).eq("id", id);
      if (updateError) throw new Error(updateError.message);
      return;
    }
    throw new Error(error.message);
  }
}

export async function removerMaterial(id: string) {
  const { error } = await supabase.from("materiais").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export type FlashcardAdmin = {
  id: string;
  pergunta: string;
  resposta: string;
  areaId: string | null;
  especialidadeId: string | null;
  assuntoId: string | null;
  criadoEm: string;
};

const CAMPOS_FLASHCARD = "id, pergunta, resposta, area_id, especialidade_id, assunto_id, created_at";

function normalizarFlashcard(l: {
  id: string;
  pergunta: string;
  resposta: string;
  area_id: string | null;
  especialidade_id: string | null;
  assunto_id: string | null;
  created_at: string;
}): FlashcardAdmin {
  return {
    id: l.id,
    pergunta: l.pergunta,
    resposta: l.resposta,
    areaId: l.area_id,
    especialidadeId: l.especialidade_id,
    assuntoId: l.assunto_id,
    criadoEm: l.created_at,
  };
}

export async function buscarFlashcardsAdmin(): Promise<FlashcardAdmin[]> {
  const { data, error } = await supabase
    .from("flashcards_admin")
    .select(CAMPOS_FLASHCARD)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(normalizarFlashcard);
}

/**
 * Cria vários flashcards de uma vez, colados no formato "pergunta | resposta"
 * (uma dupla por linha), todos com a mesma classificação.
 */
export async function criarFlashcardsEmLote(input: {
  texto: string;
  criadoPor: string;
  areaId?: string | null;
  especialidadeId?: string | null;
  assuntoId?: string | null;
}): Promise<number> {
  const linhas = input.texto
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);

  const registros = linhas
    .map((linha) => {
      const partes = linha.split("|");
      if (partes.length < 2) return null;
      const pergunta = partes[0]!.trim();
      const resposta = partes.slice(1).join("|").trim();
      if (!pergunta || !resposta) return null;
      return {
        pergunta,
        resposta,
        criado_por: input.criadoPor,
        area_id: input.areaId ?? null,
        especialidade_id: input.especialidadeId ?? null,
        assunto_id: input.assuntoId ?? null,
      };
    })
    .filter((r): r is NonNullable<typeof r> => !!r);

  if (!registros.length) throw new Error('Nenhuma linha no formato "pergunta | resposta" foi encontrada.');

  const { error } = await supabase.from("flashcards_admin").insert(registros);
  if (error) throw new Error(error.message);
  return registros.length;
}

export async function removerFlashcardAdmin(id: string) {
  const { error } = await supabase.from("flashcards_admin").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* ---------- Flashcards pessoais (cada usuário cria/edita os seus) ---------- */

export type FlashcardPessoal = {
  id: string;
  frente: string;
  verso: string;
  criadoEm: string;
  atualizadoEm: string;
};

const CAMPOS_PESSOAL = "id, frente, verso, created_at, updated_at";

function normalizarPessoal(l: {
  id: string;
  frente: string;
  verso: string;
  created_at: string;
  updated_at: string;
}): FlashcardPessoal {
  return {
    id: l.id,
    frente: l.frente,
    verso: l.verso,
    criadoEm: l.created_at,
    atualizadoEm: l.updated_at,
  };
}

export async function buscarFlashcardsPessoais(userId: string): Promise<FlashcardPessoal[]> {
  const { data, error } = await supabase
    .from("flashcards_pessoais")
    .select(CAMPOS_PESSOAL)
    .eq("user_id", userId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(normalizarPessoal);
}

export async function criarFlashcardPessoal(input: {
  userId: string;
  frente: string;
  verso: string;
}): Promise<FlashcardPessoal> {
  const { data, error } = await supabase
    .from("flashcards_pessoais")
    .insert({ user_id: input.userId, frente: input.frente.trim(), verso: input.verso.trim() })
    .select(CAMPOS_PESSOAL)
    .single();
  if (error) throw new Error(error.message);
  return normalizarPessoal(data);
}

export async function atualizarFlashcardPessoal(
  id: string,
  input: { frente: string; verso: string },
): Promise<FlashcardPessoal> {
  const { data, error } = await supabase
    .from("flashcards_pessoais")
    .update({ frente: input.frente.trim(), verso: input.verso.trim(), updated_at: new Date().toISOString() })
    .eq("id", id)
    .select(CAMPOS_PESSOAL)
    .single();
  if (error) throw new Error(error.message);
  return normalizarPessoal(data);
}

export async function removerFlashcardPessoal(id: string) {
  const { error } = await supabase.from("flashcards_pessoais").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

/* ---------- Erros por tema (pra montar flashcard a partir das questões erradas) ---------- */

export type BucketErros = {
  assuntoId: string | null;
  especialidadeId: string | null;
  areaId: string | null;
  total: number;
};

/** Só a contagem por tema, sem carregar o conteúdo das questões — leve mesmo com muito histórico. */
export async function buscarContagemErrosPorTema(): Promise<BucketErros[]> {
  const { data, error } = await supabase.rpc("contagem_erros_por_tema");
  if (error) throw new Error(error.message);
  return (data ?? []).map((l: { assunto_id: string | null; especialidade_id: string | null; area_id: string | null; total: number }) => ({
    assuntoId: l.assunto_id,
    especialidadeId: l.especialidade_id,
    areaId: l.area_id,
    total: Number(l.total),
  }));
}

/** Busca as questões erradas de UM tema específico (só quando a pessoa escolhe estudar aquele tema). */
export async function buscarQuestoesErradasPorTema(userId: string, bucket: BucketErros): Promise<QuestaoDb[]> {
  let query = supabase
    .from("respostas")
    .select(
      "questoes!inner(id, banca, ano, enunciado, alternativas, correta, comentario, publica, tipo, area_id, especialidade_id, assunto_id, anulada, desatualizada)",
    )
    .eq("user_id", userId)
    .eq("correta", false);

  if (bucket.assuntoId) query = query.eq("questoes.assunto_id", bucket.assuntoId);
  else if (bucket.especialidadeId) query = query.eq("questoes.especialidade_id", bucket.especialidadeId);
  else if (bucket.areaId) query = query.eq("questoes.area_id", bucket.areaId);

  const { data, error } = await query;
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as { questoes: QuestaoDb }[]).map((l) => l.questoes);
}
