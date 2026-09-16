import { supabase } from "@/integrations/supabase/client";

export type Jogada = {
  id: string;
  dia: string;
  diagnostico: string;
  aceitos: string[];
  dicas: string[];
  dicas_reveladas: number;
  palpites: string[];
  acertou: boolean;
  finalizado: boolean;
  pontos: number;
  valida: boolean;
  created_at: string;
};

export const LIMITE_DIARIO = 2;
export const PONTOS_BASE = 100;

/**
 * Pontuação por número de dicas usadas para acertar:
 * 1–3 dicas = 100 | 4 dicas = 50 (2 casos = 1 caso de 3 dicas)
 * 5 dicas = 33.33 (3 casos = 1 caso de 3 dicas) | erro/desistência = 0
 */
export function pontosPorDicas(dicas: number): number {
  if (dicas <= 3) return PONTOS_BASE;
  if (dicas === 4) return Math.round((PONTOS_BASE / 2) * 100) / 100;
  return Math.round((PONTOS_BASE / 3) * 100) / 100;
}

export function diaAtual() {
  return new Intl.DateTimeFormat("en-CA", { timeZone: "America/Bahia" }).format(new Date());
}

/** Segunda-feira da semana corrente (fuso America/Bahia), formato YYYY-MM-DD. */
export function inicioSemana() {
  const hoje = new Date(`${diaAtual()}T12:00:00`);
  const diaSemana = (hoje.getDay() + 6) % 7; // 0 = segunda
  hoje.setDate(hoje.getDate() - diaSemana);
  return hoje.toISOString().slice(0, 10);
}

function normalizar(linha: {
  id: string;
  dia: string;
  diagnostico: string;
  aceitos: unknown;
  dicas: unknown;
  dicas_reveladas: number;
  palpites: unknown;
  acertou: boolean;
  finalizado: boolean;
  pontos: number;
  valida: boolean;
  created_at: string;
}): Jogada {
  return {
    ...linha,
    aceitos: (linha.aceitos ?? []) as string[],
    dicas: (linha.dicas ?? []) as string[],
    palpites: (linha.palpites ?? []) as string[],
  };
}

const CAMPOS =
  "id, dia, diagnostico, aceitos, dicas, dicas_reveladas, palpites, acertou, finalizado, pontos, valida, created_at";

export async function buscarJogadas(): Promise<Jogada[]> {
  const { data, error } = await supabase
    .from("dx_jogadas")
    .select(CAMPOS)
    .order("created_at", { ascending: false })
    .limit(300);
  if (error) throw new Error(error.message);
  return (data ?? []).map(normalizar);
}

export async function criarJogada(input: {
  userId: string;
  diagnostico: string;
  aceitos: string[];
  dicas: string[];
  valida?: boolean;
}): Promise<Jogada> {
  const { data, error } = await supabase
    .from("dx_jogadas")
    .insert({
      user_id: input.userId,
      dia: diaAtual(),
      diagnostico: input.diagnostico,
      aceitos: input.aceitos,
      dicas: input.dicas,
      dicas_reveladas: 1,
      palpites: [],
      valida: input.valida ?? true,
    })
    .select(CAMPOS)
    .single();
  if (error) throw new Error(error.message);
  return normalizar(data);
}

export async function atualizarJogada(
  id: string,
  campos: Partial<
    Pick<Jogada, "dicas_reveladas" | "palpites" | "acertou" | "finalizado" | "pontos">
  >,
) {
  const { data, error } = await supabase
    .from("dx_jogadas")
    .update(campos)
    .eq("id", id)
    .select(CAMPOS)
    .single();
  if (error) throw new Error(error.message);
  return normalizar(data);
}

export function estatisticas(jogadas: Jogada[]) {
  const oficiais = jogadas.filter((j) => j.valida);
  const finalizadas = oficiais.filter((j) => j.finalizado);
  const acertos = finalizadas.filter((j) => j.acertou).length;
  const pontos = finalizadas.reduce((soma, j) => soma + Number(j.pontos ?? 0), 0);
  const semana = inicioSemana();
  const pontosSemana = finalizadas
    .filter((j) => j.dia >= semana)
    .reduce((soma, j) => soma + Number(j.pontos ?? 0), 0);
  const dias = [...new Set(oficiais.map((j) => j.dia))].sort().reverse();
  let streak = 0;
  const hoje = diaAtual();
  const cursor = new Date(`${hoje}T12:00:00`);
  for (;;) {
    const alvo = cursor.toISOString().slice(0, 10);
    if (dias.includes(alvo)) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else if (alvo === hoje) {
      cursor.setDate(cursor.getDate() - 1);
    } else break;
  }
  return {
    total: finalizadas.length,
    acertos,
    taxa: finalizadas.length ? Math.round((acertos / finalizadas.length) * 100) : 0,
    streak,
    pontos: Math.round(pontos * 100) / 100,
    pontosSemana: Math.round(pontosSemana * 100) / 100,
  };
}

export type LinhaRanking = {
  user_id: string;
  apelido: string;
  pontos: number;
  acertos: number;
  jogadas: number;
  ouro: number;
  prata: number;
  bronze: number; 
  taxaVisivel: boolean;
};

export async function buscarMeuApelido(userId: string): Promise<string> {
  const { data, error } = await supabase
    .from("profiles")
    .select("apelido")
    .eq("id", userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data?.apelido ?? "Estudante";
}

export async function salvarApelido(userId: string, apelido: string) {
  const { error } = await supabase
    .from("profiles")
    .upsert({ id: userId, apelido: apelido.trim().slice(0, 30) || "Estudante" });
  if (error) throw new Error(error.message);
}
