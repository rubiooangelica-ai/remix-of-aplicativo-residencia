import { supabase } from "@/integrations/supabase/client";
import type { Jogada } from "@/lib/diagnostico";

export type CasoDx = {
  id: string;
  diagnostico: string;
  aceitos: string[];
  dicas: string[];
  ativo: boolean;
  ordem: number;
};

const CAMPOS_CASO = "id, diagnostico, aceitos, dicas, ativo, ordem, created_at";

function normalizarCaso(l: {
  id: string;
  diagnostico: string;
  aceitos: unknown;
  dicas: unknown;
  ativo: boolean;
  ordem: number;
}): CasoDx {
  return {
    id: l.id,
    diagnostico: l.diagnostico,
    aceitos: (l.aceitos ?? []) as string[],
    dicas: (l.dicas ?? []) as string[],
    ativo: l.ativo,
    ordem: l.ordem,
  };
}

/** Lista completa de casos — só funciona pra administradores (RLS). */
export async function buscarTodosCasos(): Promise<CasoDx[]> {
  const { data, error } = await supabase
    .from("dx_casos")
    .select(CAMPOS_CASO)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(normalizarCaso);
}

export async function criarCaso(input: {
  diagnostico: string;
  aceitos: string[];
  dicas: string[];
}): Promise<CasoDx> {
  const { data, error } = await supabase
    .from("dx_casos")
    .insert({
      diagnostico: input.diagnostico.trim(),
      aceitos: input.aceitos.map((a) => a.trim()).filter(Boolean),
      dicas: input.dicas.map((d) => d.trim()).filter(Boolean),
    })
    .select(CAMPOS_CASO)
    .single();
  if (error) throw new Error(error.message);
  return normalizarCaso(data);
}

export async function removerCaso(id: string) {
  const { error } = await supabase.from("dx_casos").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function alternarAtivoCaso(id: string, ativo: boolean) {
  const { error } = await supabase.from("dx_casos").update({ ativo }).eq("id", id);
  if (error) throw new Error(error.message);
}

/**
 * Catálogo seguro para o autocomplete. A RPC mistura os diagnósticos e nomes
 * aceitos de todos os casos ativos, sem informar qual deles foi sorteado hoje.
 */
export async function buscarCatalogoDiagnosticos(): Promise<string[]> {
  const { data, error } = await supabase.rpc("dx_catalogo_diagnosticos");
  if (error) {
    // Mantém o jogo utilizável enquanto a migration ainda não foi publicada.
    return [];
  }
  return ((data ?? []) as { nome: string }[]).map((linha) => linha.nome).filter(Boolean);
}

/**
 * IDs dos casos oficiais de um dia. O sorteio acontece no servidor e fica
 * travado na tabela dx_dias — o cliente nunca recebe a resposta dos casos,
 * só os IDs.
 */
export async function idsCasosDoDia(dia: string): Promise<string[]> {
  const { data, error } = await supabase.rpc("dx_casos_do_dia", { p_dia: dia });
  if (error) throw new Error(error.message);
  return (data ?? []) as string[];
}

/** Casos de dias anteriores pro arquivo, sem revelar resposta nem dicas. */
export type CasoArquivo = { dia: string; casoId: string; jogado: boolean };

export async function arquivoCasos(dias: string[]): Promise<Record<string, CasoArquivo[]>> {
  const { data, error } = await supabase.rpc("dx_arquivo", { p_dias: dias });
  if (error) throw new Error(error.message);
  const resultado: Record<string, CasoArquivo[]> = {};
  for (const linha of (data ?? []) as { dia: string; caso_id: string; jogado: boolean }[]) {
    (resultado[linha.dia] ??= []).push({
      dia: linha.dia,
      casoId: linha.caso_id,
      jogado: linha.jogado,
    });
  }
  return resultado;
}

function normalizarJogada(l: Record<string, unknown>): Jogada {
  return {
    ...(l as unknown as Jogada),
    aceitos: (l["aceitos"] ?? []) as string[],
    dicas: (l["dicas"] ?? []) as string[],
    palpites: (l["palpites"] ?? []) as string[],
  };
}

/**
 * Começa uma jogada no servidor: ele copia diagnóstico, aceitos e dicas do
 * caso pra uma jogada do próprio usuário e devolve a jogada pronta.
 */
export async function iniciarJogadaServidor(input: {
  casoId: string;
  dia: string;
  valida: boolean;
}): Promise<Jogada> {
  const { data, error } = await supabase.rpc("dx_iniciar_jogada", {
    p_caso_id: input.casoId,
    p_dia: input.dia,
    p_valida: input.valida,
  });
  if (error) throw new Error(error.message);
  const linha = (data as Record<string, unknown>[] | null)?.[0];
  if (!linha) throw new Error("Não foi possível iniciar a jogada.");
  return normalizarJogada(linha);
}

function normalizarTexto(s: string) {
  return s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

/** Confere um palpite localmente, sem IA — compara com o nome canônico e os aceitos da jogada. */
export function conferirPalpiteLocal(caso: { diagnostico: string; aceitos: string[] }, palpite: string): boolean {
  const alvo = normalizarTexto(palpite);
  if (!alvo) return false;
  return [caso.diagnostico, ...caso.aceitos].some((c) => normalizarTexto(c) === alvo);
}
