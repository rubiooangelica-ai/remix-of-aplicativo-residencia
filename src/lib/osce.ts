import { supabase } from "@/integrations/supabase/client";
import type { CriterioAvaliado } from "./osce.functions";

export type CanalOsce = "paciente" | "exame" | "avaliador";
export type TurnoOsce = {
  papel: "user" | "assistant";
  texto: string;
  canal?: CanalOsce;
};

export type SessaoOsce = {
  id: string;
  tema: string;
  cenario: string;
  minutos: number;
  duracao_segundos: number;
  nota: number;
  criterios: CriterioAvaliado[];
  correcao: string;
  barema: string | null;
  caso: string;
  transcricao: TurnoOsce[];
  created_at: string;
};

export async function salvarSessaoOsce(input: {
  userId: string;
  tema: string;
  cenario: string;
  minutos: number;
  duracaoSegundos: number;
  nota: number;
  criterios: CriterioAvaliado[];
  correcao: string;
  barema?: string | undefined;
  caso: string;
  transcricao: TurnoOsce[];
}) {
  const { error } = await supabase.from("osce_sessoes").insert({
    user_id: input.userId,
    tema: input.tema,
    cenario: input.cenario,
    minutos: input.minutos,
    duracao_segundos: input.duracaoSegundos,
    nota: input.nota,
    criterios: input.criterios,
    correcao: input.correcao,
    barema: input.barema ?? null,
    caso: input.caso,
    transcricao: input.transcricao,
  });
  if (error) throw new Error(error.message);
}

export async function buscarSessoesOsce(): Promise<SessaoOsce[]> {
  const { data, error } = await supabase
    .from("osce_sessoes")
    .select(
      "id, tema, cenario, minutos, duracao_segundos, nota, criterios, correcao, barema, caso, transcricao, created_at",
    )
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  return (data ?? []).map((s) => ({
    ...s,
    nota: Number(s.nota),
    criterios: (s.criterios ?? []) as unknown as CriterioAvaliado[],
    transcricao: (s.transcricao ?? []) as unknown as TurnoOsce[],
  })) as SessaoOsce[];
}

export function metricasOsce(sessoes: SessaoOsce[]) {
  if (!sessoes.length) return { total: 0, media: 0, melhor: 0 };
  const soma = sessoes.reduce((t, s) => t + s.nota, 0);
  return {
    total: sessoes.length,
    media: Math.round((soma / sessoes.length) * 10) / 10,
    melhor: Math.round(Math.max(...sessoes.map((s) => s.nota)) * 10) / 10,
  };
}

export async function registrarEventoOsce(input: {
  userId: string;
  tipo: string;
  contexto?: Record<string, string | number | boolean | null>;
}) {
  const { error } = await (supabase as any).from("osce_eventos").insert({
    user_id: input.userId,
    tipo: input.tipo,
    contexto: input.contexto ?? {},
  });
  if (error) throw new Error(error.message);
}
