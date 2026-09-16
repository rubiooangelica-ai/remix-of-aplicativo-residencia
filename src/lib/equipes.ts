import { supabase } from "@/integrations/supabase/client";

export type Equipe = { id: string; nome: string; liderId: string; codigoConvite: string; entradaDireta: boolean };
export type PapelLiga = "lider" | "vice" | "membro";
export type MembroEquipe = { userId: string; papel: PapelLiga; nome: string; avatarUrl: string | null };
export type PatenteLiga = { codigo: string; nome: string; minimo: number; proximo: number | null };
export type MinhaEquipe = Equipe & { membros: MembroEquipe[]; souLider: boolean; souVice: boolean; souAdminLiga: boolean; xp: number; patente: PatenteLiga };
export type LinhaRankingEquipe = { equipeId: string; nome: string; membros: number; total: number; acertos: number; taxa: number; xp: number; patenteCodigo: string; patenteNome: string; patenteProximoXp: number | null };
export type LinhaMembroLiga = { userId: string; nome: string; papel: PapelLiga; total: number; acertos: number; taxa: number };
export type MetaLiga = { meta: number; xp: number; titulo: string; concluida: boolean; faltam: number };
export type StatusLiga = { temLiga: boolean; equipeId?: string; semanaInicio?: string; questoesSemana: number; xpTotal: number; metas: MetaLiga[] };
export type TemporadaMensalLiga = { temLiga: boolean; equipeId?: string; mesInicio?: string; mesFim?: string; questoesMes: number; acertosMes: number; taxaMes: number; posicao: number; totalLigas: number };
export type ConquistaLiga = { semanaInicio: string; meta: number; xp: number; titulo: string; createdAt: string };
export type ConquistaLigante = { codigo: string; titulo: string; descricao: string; icone: string; meta: number };
export type LiganteConquistas = { userId: string; nome: string; papel: PapelLiga; avatarUrl: string | null; totalGeral: number; acertosGeral: number; taxaGeral: number; totalSemana: number; questoesHoje: number; metaDiaria: number; diasMeta: number; xp: number; nivel: number; xpNoNivel: number; xpProximoNivel: number; conquistas: ConquistaLigante[] };
export type PedidoEntradaLiga = { id: string; userId: string; nome: string; createdAt: string };

const db = supabase as any;

function erroEstruturaLiga(error: any) {
  const msg = String(error?.message ?? error ?? "").toLowerCase();
  return msg.includes("schema cache") || msg.includes("could not find") || msg.includes("does not exist") || msg.includes("relation \"public.equipe");
}

function mensagemEstruturaLiga(error: any) {
  const original = String(error?.message ?? error ?? "Erro desconhecido");
  if (!erroEstruturaLiga(error)) return original;
  return `O banco da Liga não está sincronizado com esta versão do aplicativo. A migration precisa ser aplicada no Supabase; republicar somente o site não resolve. Erro original: ${original}`;
}

function parsePapel(valor: unknown): PapelLiga {
  const papel = String(valor ?? "membro");
  return papel === "lider" || papel === "vice" || papel === "membro" ? papel : "membro";
}

export async function buscarMinhaEquipe(_userId: string): Promise<MinhaEquipe | null> {
  const { data, error } = await db.rpc("minha_liga_detalhes");

  if (error) {
    throw new Error(mensagemEstruturaLiga(error));
  }

  if (!data) return null;

  const papel = parsePapel(data.meu_papel);
  const membros = Array.isArray(data.membros) ? data.membros : [];

  return {
    id: String(data.id),
    nome: String(data.nome ?? "Liga"),
    liderId: String(data.lider_id),
    codigoConvite: String(data.codigo_convite ?? ""),
    entradaDireta: data.entrada_direta !== false,
    xp: Number(data.xp ?? 0),
    patente: {
      codigo: String(data.patente?.codigo ?? "iniciante"),
      nome: String(data.patente?.nome ?? "Liga Iniciante"),
      minimo: Number(data.patente?.minimo ?? 0),
      proximo: data.patente?.proximo == null ? null : Number(data.patente.proximo),
    },
    souLider: papel === "lider",
    souVice: papel === "vice",
    souAdminLiga: papel === "lider" || papel === "vice",
    membros: membros.map((m: any) => ({
      userId: String(m.user_id),
      papel: parsePapel(m.papel),
      nome: String(m.nome ?? "Estudante"),
      avatarUrl: m.avatar_url ? String(m.avatar_url) : null,
    })),
  };
}

export async function buscarRankingEquipes(periodo: "hoje" | "geral" | "semana" | "mes" = "hoje"): Promise<LinhaRankingEquipe[]> {
  const fn = periodo === "geral" ? "ranking_ligas_geral_v2" : "ranking_ligas_semana_v2";
  const { data, error } = await db.rpc(fn);
  if (error) throw new Error(mensagemEstruturaLiga(error));

  return (data ?? []).map((l: any) => ({
    equipeId: String(l.equipe_id),
    nome: String(l.equipe_nome ?? "Liga"),
    membros: Number(l.membros ?? 0),
    total: Number(l.total ?? 0),
    acertos: Number(l.acertos ?? 0),
    taxa: Number(l.taxa ?? 0),
    xp: Number(l.xp ?? 0),
    patenteCodigo: String(l.patente_codigo ?? "iniciante"),
    patenteNome: String(l.patente_nome ?? "Liga Iniciante"),
    patenteProximoXp: l.patente_proximo_xp == null ? null : Number(l.patente_proximo_xp),
  }));
}

export async function buscarStatsMembrosLiga(): Promise<LinhaMembroLiga[]> {
  const { data, error } = await db.rpc("liga_membros_stats_semana");
  if (error) throw new Error(mensagemEstruturaLiga(error));

  return (data ?? []).map((l: any) => ({
    userId: String(l.user_id),
    nome: String(l.nome ?? "Estudante"),
    papel: parsePapel(l.papel),
    total: Number(l.total ?? 0),
    acertos: Number(l.acertos ?? 0),
    taxa: Number(l.taxa ?? 0),
  }));
}

export async function buscarConquistasLigantes(): Promise<LiganteConquistas[]> {
  const { data, error } = await db.rpc("liga_ligantes_progresso");
  if (error) throw new Error(mensagemEstruturaLiga(error));

  return (data ?? []).map((l: any) => ({
    userId: String(l.user_id),
    nome: String(l.nome ?? "Estudante"),
    papel: parsePapel(l.papel),
    avatarUrl: l.avatar_url ? String(l.avatar_url) : null,
    totalGeral: Number(l.total_geral ?? 0),
    acertosGeral: Number(l.acertos_geral ?? 0),
    taxaGeral: Number(l.taxa_geral ?? 0),
    totalSemana: Number(l.total_semana ?? 0),
    questoesHoje: Number(l.questoes_hoje ?? 0),
    metaDiaria: Number(l.meta_diaria ?? 10),
    diasMeta: Number(l.dias_meta ?? 0),
    xp: Number(l.xp ?? 0),
    nivel: Number(l.nivel ?? 1),
    xpNoNivel: Number(l.xp_nivel ?? 0),
    xpProximoNivel: Number(l.xp_proximo_nivel ?? 250),
    conquistas: Array.isArray(l.conquistas)
      ? l.conquistas.map((c: any) => ({
          codigo: String(c.codigo ?? "broche"),
          titulo: String(c.titulo ?? "Conquista"),
          descricao: String(c.descricao ?? ""),
          icone: String(c.icone ?? "medal"),
          meta: Number(c.meta ?? 0),
        }))
      : [],
  }));
}

export async function buscarStatusLiga(): Promise<StatusLiga> {
  return { temLiga: false, questoesSemana: 0, xpTotal: 0, metas: [] };
}

export async function buscarTemporadaMensalLiga(): Promise<TemporadaMensalLiga> {
  return { temLiga: false, questoesMes: 0, acertosMes: 0, taxaMes: 0, posicao: 0, totalLigas: 0 };
}

export async function buscarConquistasLiga(): Promise<ConquistaLiga[]> {
  return [];
}

export async function buscarPedidosEntradaLiga(): Promise<PedidoEntradaLiga[]> {
  const { data, error } = await db.rpc("liga_pedidos_pendentes");
  if (error) throw new Error(mensagemEstruturaLiga(error));

  return (data ?? []).map((p: any) => ({
    id: String(p.id),
    userId: String(p.user_id),
    nome: String(p.nome ?? "Estudante"),
    createdAt: String(p.created_at ?? ""),
  }));
}

export async function solicitarEntradaLiga(codigo: string) {
  const { data, error } = await db.rpc("solicitar_entrada_liga", { p_codigo: codigo });
  if (error) throw new Error(mensagemEstruturaLiga(error));
  return String(data);
}

export async function aprovarPedidoLiga(pedidoId: string) {
  const { error } = await db.rpc("aprovar_pedido_liga", { p_pedido_id: pedidoId });
  if (error) throw new Error(mensagemEstruturaLiga(error));
}

export async function recusarPedidoLiga(pedidoId: string) {
  const { error } = await db.rpc("recusar_pedido_liga", { p_pedido_id: pedidoId });
  if (error) throw new Error(mensagemEstruturaLiga(error));
}

export async function configurarEntradaDiretaLiga(entradaDireta: boolean) {
  const { data, error } = await db.rpc("configurar_entrada_direta_liga", { p_entrada_direta: entradaDireta });
  if (error) throw new Error(mensagemEstruturaLiga(error));
  return Boolean(data);
}

export async function criarEquipe(nome: string) {
  const { data, error } = await db.rpc("criar_equipe", { p_nome: nome });
  if (error) throw new Error(mensagemEstruturaLiga(error));
  return String(data);
}

export async function entrarEquipe(codigo: string) {
  const { data, error } = await db.rpc("entrar_equipe", { p_codigo: codigo });
  if (error) throw new Error(mensagemEstruturaLiga(error));
  return String(data);
}

export async function sairEquipe() {
  const { error } = await db.rpc("sair_equipe");
  if (error) throw new Error(mensagemEstruturaLiga(error));
}

export async function removerMembroEquipe(userId: string) {
  const { error } = await db.rpc("remover_membro_equipe", { p_user_id: userId });
  if (error) throw new Error(mensagemEstruturaLiga(error));
}

export async function definirViceLiga(userId: string) {
  const { error } = await db.rpc("definir_vice_liga", { p_user_id: userId });
  if (error) throw new Error(mensagemEstruturaLiga(error));
}

export async function removerViceLiga() {
  const { error } = await db.rpc("remover_vice_liga");
  if (error) throw new Error(mensagemEstruturaLiga(error));
}

export async function transferirLiderancaLiga(userId: string) {
  const { error } = await db.rpc("transferir_lideranca_liga", { p_user_id: userId });
  if (error) throw new Error(mensagemEstruturaLiga(error));
}

export async function regenerarCodigoEquipe() {
  const { data, error } = await db.rpc("regenerar_codigo_equipe");
  if (error) throw new Error(mensagemEstruturaLiga(error));
  return String(data);
}
