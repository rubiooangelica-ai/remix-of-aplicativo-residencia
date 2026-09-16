import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/lib/auth";
import type { FiltrosSessao } from "@/lib/banco";

export type RespostaSalva = { letra: string; correta: boolean };

export type SessaoSalva = {
  id: string;
  rotulo: string;
  criadaEm: string;
  atualizadaEm: string;
  filtros: FiltrosSessao;
  questaoIds: string[];
  indice: number;
  respostas: Record<string, RespostaSalva>;
  segundos: number;
  pastaId: string | null;
  pastaNome?: string | null;
};

type LinhaSessao = {
  id: string;
  rotulo: string;
  criada_em: string;
  atualizada_em: string;
  filtros: FiltrosSessao;
  questao_ids: string[];
  indice: number;
  respostas: Record<string, RespostaSalva>;
  segundos: number;
  pasta_id: string | null;
  pastas: { nome: string } | null;
};

function converter(l: LinhaSessao): SessaoSalva {
  return {
    id: l.id,
    rotulo: l.rotulo,
    criadaEm: l.criada_em,
    atualizadaEm: l.atualizada_em,
    filtros: l.filtros,
    questaoIds: l.questao_ids,
    indice: l.indice,
    respostas: l.respostas,
    segundos: l.segundos,
    pastaId: l.pasta_id,
    pastaNome: l.pastas?.nome ?? null,
  };
}

export function sessaoConcluida(s: SessaoSalva) {
  return Object.keys(s.respostas).length >= s.questaoIds.length;
}

export async function buscarSessoesSalvas(userId: string): Promise<SessaoSalva[]> {
  const { data, error } = await supabase
    .from("sessoes_estudo")
    .select(
      "id, rotulo, criada_em, atualizada_em, filtros, questao_ids, indice, respostas, segundos, pasta_id, pastas(nome)",
    )
    .eq("user_id", userId)
    .order("atualizada_em", { ascending: false })
    .limit(60);
  if (error) throw new Error(error.message);
  return ((data ?? []) as unknown as LinhaSessao[])
    .filter((l) => (l.questao_ids ?? []).length > 0)
    .map(converter);
}

/** Grava (cria ou atualiza) uma sessão. Não faz nada se não houver usuário logado. */
export async function salvarSessaoLocal(sessao: SessaoSalva, userId: string | null) {
  if (!userId) return;
  const { error } = await supabase.from("sessoes_estudo").upsert(
    {
      id: sessao.id,
      user_id: userId,
      pasta_id: sessao.pastaId,
      rotulo: sessao.rotulo,
      filtros: sessao.filtros,
      questao_ids: sessao.questaoIds,
      indice: sessao.indice,
      respostas: sessao.respostas,
      segundos: sessao.segundos,
      criada_em: sessao.criadaEm,
      atualizada_em: new Date().toISOString(),
    },
    { onConflict: "id" },
  );
  if (error) throw new Error(error.message);
}

export async function buscarSessaoPorId(id: string, userId: string): Promise<SessaoSalva | null> {
  const { data, error } = await supabase
    .from("sessoes_estudo")
    .select(
      "id, rotulo, criada_em, atualizada_em, filtros, questao_ids, indice, respostas, segundos, pasta_id, pastas(nome)",
    )
    .eq("id", id)
    .eq("user_id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? converter(data as unknown as LinhaSessao) : null;
}

export async function removerSessaoSalva(id: string) {
  const { error } = await supabase.from("sessoes_estudo").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

export async function moverSessaoParaPasta(id: string, pastaId: string | null) {
  const { error } = await supabase.from("sessoes_estudo").update({ pasta_id: pastaId }).eq("id", id);
  if (error) throw new Error(error.message);
}

export function useSessoesSalvas() {
  const { usuario } = useSessao();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ["sessoes-salvas", usuario?.id],
    queryFn: () => buscarSessoesSalvas(usuario!.id),
    enabled: !!usuario,
  });

  const remover = useMutation({
    mutationFn: (id: string) => removerSessaoSalva(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["sessoes-salvas"] }),
  });

  return {
    sessoes: query.data ?? [],
    remover: (id: string) => remover.mutate(id),
  };
}
