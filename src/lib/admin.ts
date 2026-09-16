import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/lib/auth";
import type { QuestaoDb } from "@/lib/banco";

/** Diz se o usuário logado é administrador. */
export function useEhAdmin() {
  const { usuario } = useSessao();
  const { data, isLoading } = useQuery({
    queryKey: ["eh-admin", usuario?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admins")
        .select("user_id")
        .eq("user_id", usuario!.id)
        .maybeSingle();
      if (error) throw new Error(error.message);
      return !!data;
    },
    enabled: !!usuario,
  });
  return { ehAdmin: !!data, carregando: isLoading };
}

/** Promove outra conta (pelo e-mail) a administrador. Só funciona se quem chama já for admin. */
export async function recrutarAdmin(email: string) {
  const { error } = await supabase.rpc("promover_admin", { email_alvo: email });
  if (error) throw new Error(error.message);
}

export type EdicaoQuestaoAdmin = {
  id: string;
  banca: string | null;
  ano: number | null;
  comentario: string | null;
  correta: string;
  anulada: boolean;
  desatualizada: boolean;
  imagem_url?: string | null;
  enunciado?: string;
  alternativas?: { letra: string; texto: string }[];
};

const BUCKET_IMAGENS = "questoes-imagens";

/** Extrai o caminho do arquivo dentro do bucket a partir da URL pública. */
function caminhoNoBucket(url: string | null | undefined): string | null {
  if (!url) return null;
  const marca = `/storage/v1/object/public/${BUCKET_IMAGENS}/`;
  const i = url.indexOf(marca);
  if (i === -1) return null;
  const caminho = url.slice(i + marca.length).split("?")[0];
  return caminho ? decodeURIComponent(caminho) : null;
}

/** Apaga o arquivo de imagem do Storage (silencioso — não bloqueia o fluxo). */
export async function removerImagemDoStorage(url: string | null | undefined) {
  const caminho = caminhoNoBucket(url);
  if (!caminho) return;
  await supabase.storage.from(BUCKET_IMAGENS).remove([caminho]);
}

/** Exclui uma questão do banco e, se houver, sua imagem no Storage. */
export async function excluirQuestaoAdmin(questao: { id: string; imagem_url?: string | null }) {
  const { error } = await supabase.from("questoes").delete().eq("id", questao.id);
  if (error) throw new Error(error.message);
  try {
    await removerImagemDoStorage(questao.imagem_url);
  } catch {
    // arquivo órfão não deve impedir a exclusão da questão
  }
}

/** Envia (ou substitui) a imagem de uma questão no bucket próprio e devolve a URL pública. */
export async function uploadImagemQuestao(
  questaoId: string,
  arquivo: File | Blob,
  nomeOriginal?: string,
): Promise<string> {
  const nome = nomeOriginal ?? (arquivo instanceof File ? arquivo.name : "imagem.jpg");
  const extensao = (nome.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "") || "jpg";
  const caminho = `${questaoId}-${Date.now()}.${extensao}`;
  const { error } = await supabase.storage
    .from("questoes-imagens")
    .upload(caminho, arquivo, arquivo.type ? { upsert: true, contentType: arquivo.type } : { upsert: true });
  if (error) throw new Error(error.message);
  const { data } = supabase.storage.from("questoes-imagens").getPublicUrl(caminho);
  return data.publicUrl;
}

/** Edita uma questão. Vale para todos os usuários do app (não é uma cópia local). */
export async function editarQuestaoAdmin(input: EdicaoQuestaoAdmin) {
  const { id, ...campos } = input;
  const { error } = await supabase.from("questoes").update(campos).eq("id", id);
  if (error) throw new Error(error.message);
}
export type AlteracaoCampo = { de: unknown; para: unknown };

export type LogEdicaoQuestao = {
  id: string;
  questaoId: string;
  editadoPorEmail: string;
  enunciadoResumo: string;
  alteracoes: Record<string, AlteracaoCampo>;
  criadoEm: string;
};

/** Grava no histórico o que mudou numa edição de questão (só chame quando algo realmente mudou). */
export async function registrarEdicaoQuestao(input: {
  questaoId: string;
  editadoPor: string;
  editadoPorEmail: string;
  enunciadoResumo: string;
  alteracoes: Record<string, AlteracaoCampo>;
}) {
  const { error } = await supabase.from("questoes_edicoes_log").insert({
    questao_id: input.questaoId,
    editado_por: input.editadoPor,
    editado_por_email: input.editadoPorEmail,
    enunciado_resumo: input.enunciadoResumo,
    alteracoes: input.alteracoes as unknown as never,
  });
  if (error) throw new Error(error.message);
}

/** Lista o histórico de edições (mais recentes primeiro). */
export async function buscarLogEdicoes(): Promise<LogEdicaoQuestao[]> {
  const { data, error } = await supabase
    .from("questoes_edicoes_log")
    .select("id, questao_id, editado_por_email, enunciado_resumo, alteracoes, created_at")
    .order("created_at", { ascending: false })
    .limit(200);
  if (error) throw new Error(error.message);
  return (data ?? []).map((l) => ({
    id: l.id,
    questaoId: l.questao_id,
    editadoPorEmail: l.editado_por_email,
    enunciadoResumo: l.enunciado_resumo,
    alteracoes: (l.alteracoes ?? {}) as Record<string, AlteracaoCampo>,
    criadoEm: l.created_at,
  }));
}

/* ---------- Questões reportadas por usuários ---------- */

export type QuestaoReportada = {
  id: string;
  questaoId: string;
  motivo: string;
  reportadoPorEmail: string | null;
  resolvido: boolean;
  criadoEm: string;
  questao: QuestaoDb | null;
};

/** Qualquer usuário logado pode reportar uma questão com dado faltando ou errado. */
export async function reportarQuestao(input: {
  questaoId: string;
  reportadoPor: string;
  reportadoPorEmail: string | null;
  motivo: string;
}) {
  const { error } = await supabase.from("questoes_reportadas").insert({
    questao_id: input.questaoId,
    reportado_por: input.reportadoPor,
    reportado_por_email: input.reportadoPorEmail,
    motivo: input.motivo.trim(),
  });
  if (error) throw new Error(error.message);
}

/** Lista os reportes (admin only — a política do banco já restringe isso). */
export async function buscarQuestoesReportadas(): Promise<QuestaoReportada[]> {
  const { data, error } = await supabase
    .from("questoes_reportadas")
    .select(
      "id, questao_id, motivo, reportado_por_email, resolvido, created_at, questoes(id, banca, ano, enunciado, alternativas, correta, comentario, publica, tipo, area_id, especialidade_id, assunto_id, anulada, desatualizada, imagem_url)",
    )
    .order("resolvido", { ascending: true })
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map((l) => ({
    id: l.id,
    questaoId: l.questao_id,
    motivo: l.motivo,
    reportadoPorEmail: l.reportado_por_email,
    resolvido: l.resolvido,
    criadoEm: l.created_at,
    questao: l.questoes as QuestaoReportada["questao"],
  }));
}

export async function marcarReporteResolvido(id: string, resolvido: boolean) {
  const { error } = await supabase.from("questoes_reportadas").update({ resolvido }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function removerReporte(id: string) {
  const { error } = await supabase.from("questoes_reportadas").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
