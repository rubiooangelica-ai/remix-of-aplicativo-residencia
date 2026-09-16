import { supabase } from "@/integrations/supabase/client";

export type Alternativa = { letra: string; texto: string };

export type TipoQuestao = "alternativas" | "aberta" | "vf";

export type QuestaoDb = {
  id: string;
  banca: string | null;
  ano: number | null;
  enunciado: string;
  alternativas: Alternativa[];
  correta: string;
  comentario: string | null;
  publica: boolean;
  tipo: TipoQuestao;
  area_id: string;
  especialidade_id: string | null;
  assunto_id: string | null;
  subassunto_id?: string | null;
  anulada: boolean;
  desatualizada: boolean;
  imagem_url: string | null;
};

export type Taxonomia = {
  areas: { id: string; nome: string; ordem: number }[];
  especialidades: { id: string; area_id: string; nome: string; ordem: number }[];
  assuntos: { id: string; especialidade_id: string; nome: string; ordem: number }[];
  subassuntos: { id: string; assunto_id: string; nome: string; ordem: number }[];
};

/** Ordem fixa das 5 grandes áreas (nível 1). */
export const ORDEM_AREAS = [
  "Clínica Médica",
  "Pediatria",
  "Medicina Preventiva e Social",
  "Cirurgia",
  "Obstetrícia e Ginecologia",
] as const;

const indiceArea = (nome: string) => {
  const i = ORDEM_AREAS.findIndex((n) => n.toLowerCase() === nome.toLowerCase());
  return i === -1 ? ORDEM_AREAS.length : i;
};

export async function buscarTaxonomia(): Promise<Taxonomia> {
  const [areas, especialidades, assuntos, subassuntos] = await Promise.all([
    supabase.from("areas").select("id, nome, ordem").order("ordem"),
    supabase.from("especialidades").select("id, area_id, nome, ordem").order("nome"),
    supabase.from("assuntos").select("id, especialidade_id, nome, ordem").order("nome"),
    supabase.from("subassuntos").select("id, assunto_id, nome, ordem").order("nome"),
  ]);
  const erro = areas.error ?? especialidades.error ?? assuntos.error ?? subassuntos.error;
  if (erro) throw new Error(erro.message);
  return {
    areas: (areas.data ?? []).sort((a, b) => indiceArea(a.nome) - indiceArea(b.nome)),
    especialidades: especialidades.data ?? [],
    assuntos: assuntos.data ?? [],
    subassuntos: subassuntos.data ?? [],
  };
}

export async function criarSubassunto(assuntoId: string, nome: string): Promise<string> {
  const { data, error } = await supabase
    .from("subassuntos")
    .insert({ assunto_id: assuntoId, nome })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}

export async function renomearArea(id: string, nome: string) {
  const { error } = await supabase.from("areas").update({ nome }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function renomearEspecialidade(id: string, nome: string) {
  const { error } = await supabase.from("especialidades").update({ nome }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function renomearAssunto(id: string, nome: string) {
  const { error } = await supabase.from("assuntos").update({ nome }).eq("id", id);
  if (error) throw new Error(error.message);
}

export async function renomearSubassunto(id: string, nome: string) {
  const { error } = await supabase.from("subassuntos").update({ nome }).eq("id", id);
  if (error) throw new Error(error.message);
}

export type TipoPastaTaxonomia = "area" | "especialidade" | "assunto" | "subassunto";
export type TipoOrigemMovimento = "assunto" | "subassunto";

/** Exclui uma pasta vazia da taxonomia. O banco bloqueia se ainda houver questões dentro. */
export async function excluirPastaTaxonomia(tipo: TipoPastaTaxonomia, id: string) {
  const { error } = await supabase.rpc("admin_excluir_pasta_taxonomia", {
    tipo_pasta: tipo,
    pasta_id: id,
  });
  if (error) throw new Error(error.message);
}

/** Move em lote as questões de um tema/subtema para outro tema ou subtema. */
export async function moverQuestoesTaxonomia(input: {
  origemTipo: TipoOrigemMovimento;
  origemId: string;
  destinoAssuntoId: string;
  destinoSubassuntoId?: string | null;
}): Promise<number> {
  const { data, error } = await supabase.rpc("admin_mover_questoes_taxonomia", {
    origem_tipo: input.origemTipo,
    origem_id: input.origemId,
    destino_assunto_id: input.destinoAssuntoId,
    ...(input.destinoSubassuntoId ? { destino_subassunto_id: input.destinoSubassuntoId } : {}),
  });
  if (error) throw new Error(error.message);
  return Number(data ?? 0);
}

export async function criarArea(nome: string): Promise<string> {
  const { data, error } = await supabase.from("areas").insert({ nome }).select("id").single();
  if (error) throw new Error(error.message);
  return data.id;
}

export async function criarEspecialidade(areaId: string, nome: string): Promise<string> {
  const { data, error } = await supabase.from("especialidades").insert({ area_id: areaId, nome }).select("id").single();
  if (error) throw new Error(error.message);
  return data.id;
}

export async function criarAssunto(especialidadeId: string, nome: string): Promise<string> {
  const { data, error } = await supabase
    .from("assuntos")
    .insert({ especialidade_id: especialidadeId, nome })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  return data.id;
}

export type Filtros = { areaId?: string; especialidadeId?: string; assuntoId?: string };

export async function buscarQuestoes(filtros: Filtros): Promise<QuestaoDb[]> {
  let q = supabase
    .from("questoes")
    .select(
      "id, banca, ano, enunciado, alternativas, correta, comentario, publica, tipo, area_id, especialidade_id, assunto_id, imagem_url",
    )
    .order("created_at", { ascending: false })
    .limit(300);

  if (filtros.assuntoId) q = q.eq("assunto_id", filtros.assuntoId);
  else if (filtros.especialidadeId) q = q.eq("especialidade_id", filtros.especialidadeId);
  else if (filtros.areaId) q = q.eq("area_id", filtros.areaId);

  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as QuestaoDb[];
}

export async function contarQuestoes(): Promise<number> {
  const { count, error } = await supabase.from("questoes").select("id", { count: "exact", head: true });
  if (error) throw new Error(error.message);
  return count ?? 0;
}

export async function buscarRespostas() {
  const { data, error } = await supabase.from("respostas").select("questao_id, letra, correta");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function salvarResposta(input: {
  userId: string;
  questaoId: string;
  letra: string;
  correta: boolean;
  tempoSegundos?: number;
}) {
  const { error } = await supabase.from("respostas").upsert(
    {
      user_id: input.userId,
      questao_id: input.questaoId,
      letra: input.letra,
      correta: input.correta,
      tempo_segundos: input.tempoSegundos ?? null,
    },
    { onConflict: "user_id,questao_id" },
  );
  if (error) throw new Error(error.message);
}

export type AvaliacaoQuestao = -1 | 1 | null;
export type ContagemAvaliacaoQuestao = { gostei: number; naoGostei: number };

export async function buscarAvaliacaoQuestao(questaoId: string): Promise<AvaliacaoQuestao> {
  const { data, error } = await supabase
    .from("avaliacoes_questoes")
    .select("valor")
    .eq("questao_id", questaoId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? (data.valor as 1 | -1) : null;
}

export async function buscarContagemAvaliacaoQuestao(
  questaoId: string,
): Promise<ContagemAvaliacaoQuestao> {
  const { data, error } = await (supabase.rpc as unknown as (
    fn: string,
    args: Record<string, unknown>,
  ) => Promise<{ data: { gostei: number; nao_gostei: number }[] | null; error: { message: string } | null }>)(
    "contar_avaliacoes_questao",
    { p_questao_id: questaoId },
  );
  if (error) throw new Error(error.message);
  const contagem = data?.[0];
  return {
    gostei: Number(contagem?.gostei ?? 0),
    naoGostei: Number(contagem?.nao_gostei ?? 0),
  };
}

export async function salvarAvaliacaoQuestao(input: {
  userId: string;
  questaoId: string;
  valor: AvaliacaoQuestao;
}): Promise<AvaliacaoQuestao> {
  if (input.valor === null) {
    const { error } = await supabase
      .from("avaliacoes_questoes")
      .delete()
      .eq("user_id", input.userId)
      .eq("questao_id", input.questaoId);
    if (error) throw new Error(error.message);
    return null;
  }

  const { error } = await supabase.from("avaliacoes_questoes").upsert(
    {
      user_id: input.userId,
      questao_id: input.questaoId,
      valor: input.valor,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,questao_id" },
  );
  if (error) throw new Error(error.message);
  return input.valor;
}

export type QuestaoImportada = {
  area?: string | undefined;
  especialidade?: string | undefined;
  assunto?: string | undefined;
  subassunto?: string | undefined;

  banca?: string | undefined;
  ano?: number | undefined;
  enunciado: string;
  alternativas: Alternativa[];
  correta: string;
  comentario?: string | undefined;
  /** Nome do arquivo de imagem dentro do ZIP (opcional). Não é a URL final. */
  imagem?: string | undefined;
};

/** Cria (ou reaproveita) área, especialidade e assunto e insere as questões. */
export async function importarQuestoes(itens: QuestaoImportada[], userId: string, opcoes?: { publica?: boolean }) {
  const { total } = await importarQuestoesDetalhado(itens, userId, opcoes);
  return total;
}

/** Igual a importarQuestoes, mas devolve os IDs criados na mesma ordem dos itens enviados. */
export async function importarQuestoesDetalhado(
  itens: QuestaoImportada[],
  userId: string,
  opcoes?: { publica?: boolean },
): Promise<{ total: number; ids: string[] }> {
  const tax = await buscarTaxonomia();
  const norm = (s: string) => s.trim().toLowerCase().replace(/\s+/g, " ");
  const ehChaveDuplicada = (e: { code?: string; message?: string }) =>
    e.code === "23505" || /duplicate key value|already exists/i.test(e.message ?? "");

  // Cache em memória: evita consultas e inserts repetidos dentro do mesmo lote.
  const areaPorNome = new Map(tax.areas.map((a) => [norm(a.nome), a.id]));
  const espPorChave = new Map(tax.especialidades.map((e) => [`${e.area_id}::${norm(e.nome)}`, e.id]));
  const assuntoPorChave = new Map(tax.assuntos.map((s) => [`${s.especialidade_id}::${norm(s.nome)}`, s.id]));
  const subPorChave = new Map(tax.subassuntos.map((s) => [`${s.assunto_id}::${norm(s.nome)}`, s.id]));

  /**
   * Buscar → se existir reutilizar → se não existir criar → se houver conflito buscar de novo.
   * Nunca faz upsert, então nada que já existe é sobrescrito.
   */
  async function resolver(opts: {
    tabela: "areas" | "especialidades" | "assuntos" | "subassuntos";
    rotulo: string;
    nome: string;
    cache: Map<string, string>;
    chave: string;
    paiCampo?: "area_id" | "especialidade_id" | "assunto_id";
    paiId?: string;
    filtroPai?: { coluna: string; valor: string } | undefined;
  }): Promise<string> {
    const { tabela, rotulo, nome, cache, chave } = opts;
    const emCache = cache.get(chave);
    if (emCache) return emCache;

    const buscar = async () => {
      let q = supabase.from(tabela).select("id").ilike("nome", nome) as unknown as {
        eq: (c: string, v: string) => typeof q;
        limit: (n: number) => Promise<{ data: { id: string }[] | null }>;
      };
      if (opts.paiCampo && opts.paiId) q = q.eq(opts.paiCampo, opts.paiId);
      const { data } = await q.limit(1);
      return data?.[0]?.id;
    };

    const achado = await buscar();
    if (achado) {
      cache.set(chave, achado);
      return achado;
    }

    const registro: Record<string, unknown> = { nome };
    if (opts.paiCampo && opts.paiId) registro[opts.paiCampo] = opts.paiId;
    const { data, error } = await supabase
      .from(tabela)
      .insert(registro as never)
      .select("id")
      .single();
    if (error) {
      if (ehChaveDuplicada(error)) {
        const denovo = await buscar();
        if (denovo) {
          cache.set(chave, denovo);
          return denovo;
        }
      }
      throw new Error(`${rotulo} "${nome}": ${error.message}`);
    }
    cache.set(chave, data.id);
    return data.id;
  }

  async function garantirArea(nomeCru: string) {
    const nome = nomeCru.trim();
    return resolver({ tabela: "areas", rotulo: "Área", nome, cache: areaPorNome, chave: norm(nome) });
  }

  async function garantirEspecialidade(areaId: string, nomeCru?: string | undefined) {
    const nome = nomeCru?.trim();
    if (!nome) return null;
    return resolver({
      tabela: "especialidades",
      rotulo: "Especialidade",
      nome,
      cache: espPorChave,
      chave: `${areaId}::${norm(nome)}`,
      paiCampo: "area_id",
      paiId: areaId,
    });
  }

  async function garantirAssunto(especialidadeId: string | null, nomeCru?: string | undefined) {
    const nome = nomeCru?.trim();
    if (!especialidadeId || !nome) return null;
    return resolver({
      tabela: "assuntos",
      rotulo: "Assunto",
      nome,
      cache: assuntoPorChave,
      chave: `${especialidadeId}::${norm(nome)}`,
      paiCampo: "especialidade_id",
      paiId: especialidadeId,
    });
  }

  async function garantirSubassunto(assuntoId: string | null, nomeCru?: string | undefined) {
    const nome = nomeCru?.trim();
    if (!assuntoId || !nome) return null;
    return resolver({
      tabela: "subassuntos",
      rotulo: "Subtema",
      nome,
      cache: subPorChave,
      chave: `${assuntoId}::${norm(nome)}`,
      paiCampo: "assunto_id",
      paiId: assuntoId,
    });
  }

  type LinhaInsert = {
    area_id: string;
    especialidade_id: string | null;
    assunto_id: string | null;
    subassunto_id: string | null;
    banca: string | null;
    ano: number | null;
    enunciado: string;
    alternativas: Alternativa[];
    correta: string;
    comentario: string | null;
    publica: boolean;
    criado_por: string;
  };
  const linhas: LinhaInsert[] = [];
  for (const item of itens) {
    const areaId = await garantirArea(item.area ?? "Não classificado");
    const espId = await garantirEspecialidade(areaId, item.especialidade);
    const assuntoId = await garantirAssunto(espId, item.assunto);
    const subId = await garantirSubassunto(assuntoId, item.subassunto);
    linhas.push({
      area_id: areaId,
      especialidade_id: espId,
      assunto_id: assuntoId,
      subassunto_id: subId,
      banca: item.banca ?? null,

      ano: item.ano ?? null,
      enunciado: item.enunciado,
      alternativas: item.alternativas,
      correta: item.correta.trim().toUpperCase(),
      comentario: item.comentario ?? null,
      publica: opcoes?.publica ? true : false,
      criado_por: userId,
    });
  }

  const ids: string[] = [];
  for (let i = 0; i < linhas.length; i += 100) {
    const { data, error } = await supabase
      .from("questoes")
      .insert(linhas.slice(i, i + 100))
      .select("id");
    if (error) throw new Error(error.message);
    for (const linha of data ?? []) ids.push(linha.id);
  }
  return { total: linhas.length, ids };
}

/* ---------- Sessão de estudo com filtros avançados ---------- */

export type Facetas = { anos: number[]; bancas: string[]; tipos: TipoQuestao[] };

export async function buscarFacetas(incluirOcultas = false): Promise<Facetas> {
  // RPC enxuta: devolve só ano/banca/tipo (a de contagens completas estoura o
  // limite de linhas do PostgREST por causa da quantidade de assuntos).
  const { data, error } = await supabase
    .rpc("facetas_questoes", { p_incluir_ocultas: incluirOcultas })
    .select("*")
    .range(0, 19999);
  if (error) throw new Error(error.message);
  const anos = new Set<number>();
  const bancas = new Set<string>();
  const tipos = new Set<TipoQuestao>();
  for (const linha of data ?? []) {
    const chave = typeof linha.chave === "string" ? linha.chave.trim() : "";
    if (!chave) continue;
    if (linha.dimensao === "ano" && Number.isFinite(Number(chave))) anos.add(Number(chave));
    if (linha.dimensao === "banca") bancas.add(chave);
    if (linha.dimensao === "tipo") tipos.add(chave as TipoQuestao);
  }
  return {
    anos: [...anos].sort((a, b) => b - a),
    bancas: [...bancas].sort((a, b) => a.localeCompare(b, "pt-BR")),
    tipos: [...tipos],
  };
}
/** Contagens de ano/banca/formato só dentro do recorte de área/especialidade/assunto selecionado. */
export type ContagensParciais = {
  anos: Record<string, number>;
  bancas: Record<string, number>;
  tipos: Record<string, number>;
  total: number;
};

/** Contagens de ano/banca/formato e o total geral, já cruzando todos os filtros ativos. */
export async function buscarContagensFiltradas(filtros: {
  areaIds: string[];
  especialidadeIds: string[];
  assuntoIds: string[];
  anos: number[];
  tipos: TipoQuestao[];
  bancasIncluir: string[];
  bancasExcluir: string[];
  incluirOcultas?: boolean;
  imagem?: FiltroImagem;
}): Promise<ContagensParciais> {
  const { data, error } = await supabase.rpc("contagens_filtradas", {
    ...(filtros.areaIds.length ? { p_area_ids: filtros.areaIds } : {}),
    ...(filtros.especialidadeIds.length ? { p_especialidade_ids: filtros.especialidadeIds } : {}),
    ...(filtros.assuntoIds.length ? { p_assunto_ids: filtros.assuntoIds } : {}),
    ...(filtros.anos.length ? { p_anos: filtros.anos } : {}),
    ...(filtros.tipos.length ? { p_tipos: filtros.tipos as string[] } : {}),
    ...(filtros.bancasIncluir.length ? { p_bancas_incluir: filtros.bancasIncluir } : {}),
    ...(filtros.bancasExcluir.length ? { p_bancas_excluir: filtros.bancasExcluir } : {}),
    p_incluir_ocultas: filtros.incluirOcultas ?? false,
    p_imagem: filtros.imagem ?? "todas",
  } as never);
  if (error) throw new Error(error.message);
  const anos: Record<string, number> = {};
  const bancas: Record<string, number> = {};
  const tipos: Record<string, number> = {};
  let total = 0;
  for (const linha of data ?? []) {
    const valor = Number(linha.total ?? 0);
    if (linha.dimensao === "ano" && linha.chave) anos[linha.chave] = valor;
    else if (linha.dimensao === "banca" && linha.chave) bancas[linha.chave] = valor;
    else if (linha.dimensao === "tipo" && linha.chave) tipos[linha.chave] = valor;
    else if (linha.dimensao === "total") total = valor;
  }
  return { anos, bancas, tipos, total };
}

/** Filtro por presença de imagem na questão (campo questoes.imagem_url). */
export type FiltroImagem = "todas" | "com" | "sem";

export type FiltrosSessao = {
  areaIds: string[];
  especialidadeIds: string[];
  assuntoIds: string[];
  anos: number[];
  tipos: TipoQuestao[];
  bancasIncluir: string[];
  bancasExcluir: string[];
  quantidade: number;
  somenteNovas?: boolean;
  modoFoco?: boolean;
  titulo?: string;
  questaoIds?: string[];
  /** Admin: inclui na sessão questões sem banca/ano cadastrados (ocultas por padrão). */
  incluirOcultas?: boolean;
  /** "todas" (padrão), "com" = só questões com imagem, "sem" = só sem imagem. */
  imagem?: FiltroImagem;
};

const listaPostgrest = (valores: string[]) => `(${valores.map((v) => JSON.stringify(v)).join(",")})`;

/** Busca simples por trecho do enunciado (sem IA). */
export async function buscarQuestoesPorEnunciado(
  termo: string,
  limite = 30,
  imagem: FiltroImagem = "todas",
): Promise<QuestaoDb[]> {
  const texto = termo.trim();
  if (texto.length < 3) return [];
  const alvo = texto.replace(/[%,]/g, " ");
  let q = supabase
    .from("questoes")
    .select(
      "id, banca, ano, enunciado, alternativas, correta, comentario, publica, tipo, area_id, especialidade_id, assunto_id, anulada, desatualizada, imagem_url",
    )
    .ilike("enunciado", `%${alvo}%`);
  if (imagem === "com") q = q.not("imagem_url", "is", null).neq("imagem_url", "");
  if (imagem === "sem") q = q.or("imagem_url.is.null,imagem_url.eq.");
  const { data, error } = await q.limit(limite);
  if (error) throw new Error(error.message);
  return (data ?? []) as QuestaoDb[];
}

export async function buscarQuestoesSessao(f: FiltrosSessao): Promise<QuestaoDb[]> {
  if (f.questaoIds?.length) return buscarQuestoesPorIds(f.questaoIds);

  let q = supabase
    .from("questoes")
    .select(
      "id, banca, ano, enunciado, alternativas, correta, comentario, publica, tipo, area_id, especialidade_id, assunto_id, anulada, desatualizada, imagem_url",
    )
    .limit(500);

  // Questões sem banca ou ano cadastrados ficam ocultas por padrão — só
  // entram na sessão se o admin ligar "mostrar questões ocultadas".
  if (!f.incluirOcultas) q = q.not("banca", "is", null).not("ano", "is", null);

  const escopo: string[] = [];

  if (f.assuntoIds.length) escopo.push(`assunto_id.in.(${f.assuntoIds.join(",")})`);
  if (f.especialidadeIds.length) escopo.push(`especialidade_id.in.(${f.especialidadeIds.join(",")})`);
  if (f.areaIds.length) escopo.push(`area_id.in.(${f.areaIds.join(",")})`);
  if (escopo.length) q = q.or(escopo.join(","));

  if (f.anos.length) q = q.in("ano", f.anos);
  if (f.tipos.length) q = q.in("tipo", f.tipos);
  if (f.bancasIncluir.length) q = q.in("banca", f.bancasIncluir);
  else if (f.bancasExcluir.length) q = q.not("banca", "in", listaPostgrest(f.bancasExcluir));

  // Filtro por imagem — combina com todos os filtros acima.
  if (f.imagem === "com") q = q.not("imagem_url", "is", null).neq("imagem_url", "");
  if (f.imagem === "sem") q = q.or("imagem_url.is.null,imagem_url.eq.");

  const { data, error } = await q;
  if (error) throw new Error(error.message);

  let lista = [...((data ?? []) as QuestaoDb[])];

  if (f.somenteNovas) {
    const { data: respondidas } = await supabase.from("respostas").select("questao_id");
    const ja = new Set((respondidas ?? []).map((r) => r.questao_id));
    const novas = lista.filter((q) => !ja.has(q.id));
    if (novas.length) lista = novas;
  }

  for (let i = lista.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [lista[i], lista[j]] = [lista[j]!, lista[i]!];
  }
  return lista.slice(0, Math.max(1, f.quantidade));
}

/* ---------- Anotações ---------- */

export async function buscarAnotacoes(): Promise<Record<string, string>> {
  const { data, error } = await supabase.from("anotacoes").select("questao_id, texto");
  if (error) throw new Error(error.message);
  return Object.fromEntries((data ?? []).map((a) => [a.questao_id, a.texto]));
}

export async function salvarAnotacao(input: { userId: string; questaoId: string; texto: string }) {
  const { error } = await supabase
    .from("anotacoes")
    .upsert(
      { user_id: input.userId, questao_id: input.questaoId, texto: input.texto },
      { onConflict: "user_id,questao_id" },
    );
  if (error) throw new Error(error.message);
}

/* ---------- Contagens para o banco de questões ---------- */

export type Contagens = {
  total: number;
  areas: Record<string, number>;
  especialidades: Record<string, number>;
  assuntos: Record<string, number>;
  anos: Record<string, number>;
  bancas: Record<string, number>;
  tipos: Record<string, number>;
};

export async function buscarContagens(incluirOcultas = false): Promise<Contagens> {
  // Contagens calculadas no banco (exatas, sobre todas as questões).
  const { data, error } = await supabase
    .rpc("contagens_questoes", { p_incluir_ocultas: incluirOcultas })
    .select("*")
    .range(0, 49999);
  if (error) throw new Error(error.message);

  const c: Contagens = {
    total: 0,
    areas: {},
    especialidades: {},
    assuntos: {},
    anos: {},
    bancas: {},
    tipos: {},
  };
  const destino: Record<string, Record<string, number>> = {
    area: c.areas,
    especialidade: c.especialidades,
    assunto: c.assuntos,
    ano: c.anos,
    banca: c.bancas,
    tipo: c.tipos,
  };
  for (const linha of data ?? []) {
    const total = Number(linha.total ?? 0);
    if (linha.dimensao === "total") {
      c.total = total;
      continue;
    }
    const mapa = destino[linha.dimensao];
    if (mapa && linha.chave) mapa[linha.chave] = total;
  }
  return c;
}

/* ---------- Meu progresso por conteúdo ---------- */

export type ProgressoAssunto = {
  id: string;
  nome: string;
  feitas: number;
  acertos: number;
  erros: number;
  taxaAcerto: number;
};

export type ProgressoTema = {
  id: string;
  nome: string;
  feitas: number;
  acertos: number;
  erros: number;
  taxaAcerto: number;
  assuntos: ProgressoAssunto[];
};

export type ProgressoArea = {
  id: string;
  nome: string;
  feitas: number;
  acertos: number;
  erros: number;
  taxaAcerto: number;
  temas: ProgressoTema[];
};

export type MeuProgresso = {
  feitas: number;
  acertos: number;
  erros: number;
  taxaAcerto: number;
  areasEstudadas: number;
  temasEstudados: number;
  assuntosEstudados: number;
  areas: ProgressoArea[];
};

const taxaProgresso = (acertos: number, total: number) =>
  total > 0 ? Math.round((acertos / total) * 100) : 0;

/**
 * Mostra apenas conteúdos que o usuário já estudou.
 * Como respostas é salva por user_id + questao_id, cada questão conta uma única vez.
 */
export async function buscarMeuProgresso(userId: string): Promise<MeuProgresso> {
  const todas: { questao_id: string; correta: boolean }[] = [];
  const tamanhoPagina = 1000;

  for (let inicio = 0; ; inicio += tamanhoPagina) {
    const { data, error } = await supabase
      .from("respostas")
      .select("questao_id, correta")
      .eq("user_id", userId)
      .range(inicio, inicio + tamanhoPagina - 1);

    if (error) throw new Error(error.message);
    const pagina = (data ?? []) as { questao_id: string; correta: boolean }[];
    todas.push(...pagina);
    if (pagina.length < tamanhoPagina) break;
  }

  if (!todas.length) {
    return {
      feitas: 0,
      acertos: 0,
      erros: 0,
      taxaAcerto: 0,
      areasEstudadas: 0,
      temasEstudados: 0,
      assuntosEstudados: 0,
      areas: [],
    };
  }

  const ids = [...new Set(todas.map((r) => r.questao_id))];
  const questoes: {
    id: string;
    area_id: string;
    especialidade_id: string | null;
    assunto_id: string | null;
  }[] = [];

  for (let i = 0; i < ids.length; i += 400) {
    const { data, error } = await supabase
      .from("questoes")
      .select("id, area_id, especialidade_id, assunto_id")
      .in("id", ids.slice(i, i + 400));
    if (error) throw new Error(error.message);
    questoes.push(...((data ?? []) as typeof questoes));
  }

  const tax = await buscarTaxonomia();
  const questaoPorId = new Map(questoes.map((q) => [q.id, q]));
  const areaNome = new Map(tax.areas.map((a) => [a.id, a.nome]));
  const temaNome = new Map(tax.especialidades.map((e) => [e.id, e.nome]));
  const assuntoNome = new Map(tax.assuntos.map((a) => [a.id, a.nome]));

  type Ac = { ids: Set<string>; acertos: number; erros: number };
  const novo = (): Ac => ({ ids: new Set(), acertos: 0, erros: 0 });
  const areas = new Map<string, Ac>();
  const temas = new Map<string, Ac>();
  const assuntos = new Map<string, Ac>();

  for (const resposta of todas) {
    const q = questaoPorId.get(resposta.questao_id);
    if (!q) continue;

    const areaId = q.area_id;
    const temaId = q.especialidade_id ?? "__sem_tema__";
    const assuntoId = q.assunto_id ?? "__sem_assunto__";
    const temaChave = `${areaId}::${temaId}`;
    const assuntoChave = `${areaId}::${temaId}::${assuntoId}`;

    const acumuladores: [Map<string, Ac>, string][] = [
      [areas, areaId],
      [temas, temaChave],
      [assuntos, assuntoChave],
    ];

    for (const [mapa, chave] of acumuladores) {
      const ac = mapa.get(chave) ?? novo();
      ac.ids.add(q.id);
      if (resposta.correta) ac.acertos += 1;
      else ac.erros += 1;
      mapa.set(chave, ac);
    }
  }

  const areasMontadas: ProgressoArea[] = [...areas.entries()]
    .map(([areaId, area]) => {
      const temasMontados: ProgressoTema[] = [...temas.entries()]
        .filter(([chave]) => chave.startsWith(`${areaId}::`))
        .map(([temaChave, tema]) => {
          const temaId = temaChave.slice(areaId.length + 2);
          const prefixo = `${areaId}::${temaId}::`;

          const assuntosMontados: ProgressoAssunto[] = [...assuntos.entries()]
            .filter(([chave]) => chave.startsWith(prefixo))
            .map(([chave, assunto]) => {
              const assuntoId = chave.slice(prefixo.length);
              const feitas = assunto.ids.size;
              return {
                id: assuntoId,
                nome:
                  assuntoId === "__sem_assunto__"
                    ? "Sem assunto definido"
                    : assuntoNome.get(assuntoId) ?? "Assunto não encontrado",
                feitas,
                acertos: assunto.acertos,
                erros: assunto.erros,
                taxaAcerto: taxaProgresso(assunto.acertos, feitas),
              };
            })
            .filter((a) => a.feitas > 0)
            .sort((a, b) => b.feitas - a.feitas || a.nome.localeCompare(b.nome, "pt-BR"));

          const feitas = tema.ids.size;
          return {
            id: temaId,
            nome:
              temaId === "__sem_tema__"
                ? "Sem tema definido"
                : temaNome.get(temaId) ?? "Tema não encontrado",
            feitas,
            acertos: tema.acertos,
            erros: tema.erros,
            taxaAcerto: taxaProgresso(tema.acertos, feitas),
            assuntos: assuntosMontados,
          };
        })
        .filter((t) => t.feitas > 0)
        .sort((a, b) => b.feitas - a.feitas || a.nome.localeCompare(b.nome, "pt-BR"));

      const feitas = area.ids.size;
      return {
        id: areaId,
        nome: areaNome.get(areaId) ?? "Área não encontrada",
        feitas,
        acertos: area.acertos,
        erros: area.erros,
        taxaAcerto: taxaProgresso(area.acertos, feitas),
        temas: temasMontados,
      };
    })
    .filter((a) => a.feitas > 0)
    .sort((a, b) => b.feitas - a.feitas || a.nome.localeCompare(b.nome, "pt-BR"));

  const feitas = [...new Set(todas.map((r) => r.questao_id).filter((id) => questaoPorId.has(id)))].length;
  const acertos = todas.filter((r) => questaoPorId.has(r.questao_id) && r.correta).length;
  const erros = feitas - acertos;

  return {
    feitas,
    acertos,
    erros,
    taxaAcerto: taxaProgresso(acertos, feitas),
    areasEstudadas: areasMontadas.length,
    temasEstudados: areasMontadas.reduce((soma, area) => soma + area.temas.length, 0),
    assuntosEstudados: areasMontadas.reduce(
      (soma, area) => soma + area.temas.reduce((s, tema) => s + tema.assuntos.length, 0),
      0,
    ),
    areas: areasMontadas,
  };
}

/* ---------- Métricas do painel ---------- */

export type Metricas = {
  hojeTotal: number;
  hojeAcertos: number;
  geralTotal: number;
  geralAcertos: number;
  diasSeguidos: number;
};

export async function buscarMetricas(): Promise<Metricas> {
  const { data, error } = await supabase
    .from("respostas")
    .select("correta, created_at")
    .order("created_at", { ascending: false })
    .limit(5000);

  if (error) throw new Error(error.message);

  const linhas = data ?? [];

  const diaBahia = (valor: string | Date) => {
    const data = typeof valor === "string" ? new Date(valor) : valor;

    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "America/Bahia",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(data);
  };

  const hoje = diaBahia(new Date());

  const doDia = linhas.filter((r) => diaBahia(r.created_at) === hoje);

  const dias = [...new Set(linhas.map((r) => diaBahia(r.created_at)))];

  let seguidos = 0;

  const agoraBahia = new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "America/Bahia",
    }),
  );

  const cursor = new Date(agoraBahia);

  for (;;) {
    const alvo = [
      cursor.getFullYear(),
      String(cursor.getMonth() + 1).padStart(2, "0"),
      String(cursor.getDate()).padStart(2, "0"),
    ].join("-");

    if (dias.includes(alvo)) {
      seguidos += 1;
      cursor.setDate(cursor.getDate() - 1);
    } else {
      break;
    }
  }

  return {
    hojeTotal: doDia.length,
    hojeAcertos: doDia.filter((r) => r.correta).length,
    geralTotal: linhas.length,
    geralAcertos: linhas.filter((r) => r.correta).length,
    diasSeguidos: seguidos,
  };
}

export type Retomada = {
  assuntoId: string | null;
  especialidadeId: string | null;
  areaId: string;
  rotulo: string;
  restantes: number;
} | null;

export async function buscarRetomada(): Promise<Retomada> {
  const { data: ultima, error } = await supabase
    .from("respostas")
    .select("questao_id, created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!ultima) return null;

  const { data: questao } = await supabase
    .from("questoes")
    .select("area_id, especialidade_id, assunto_id")
    .eq("id", ultima.questao_id)
    .maybeSingle();
  if (!questao) return null;

  const tax = await buscarTaxonomia();
  const assunto = tax.assuntos.find((a) => a.id === questao.assunto_id);
  const esp = tax.especialidades.find((e) => e.id === questao.especialidade_id);
  const area = tax.areas.find((a) => a.id === questao.area_id);

  const escopo = questao.assunto_id
    ? supabase.from("questoes").select("id", { count: "exact", head: true }).eq("assunto_id", questao.assunto_id)
    : supabase.from("questoes").select("id", { count: "exact", head: true }).eq("area_id", questao.area_id);
  const { count } = await escopo;

  const { data: feitas } = await supabase.from("respostas").select("questao_id");

  return {
    assuntoId: questao.assunto_id,
    especialidadeId: questao.especialidade_id,
    areaId: questao.area_id,
    rotulo: assunto?.nome ?? esp?.nome ?? area?.nome ?? "Sessão anterior",
    restantes: Math.max(0, (count ?? 0) - (feitas ?? []).length),
  };
}

/* ---------- Flashcards a partir dos erros ---------- */

export type Flashcard = {
  id: string;
  enunciado: string;
  correta: string;
  textoCorreta: string;
  comentario: string | null;
};

export async function buscarFlashcards(): Promise<Flashcard[]> {
  const { data: erradas, error } = await supabase
    .from("respostas")
    .select("questao_id")
    .eq("correta", false)
    .order("created_at", { ascending: false })
    .limit(60);
  if (error) throw new Error(error.message);
  const ids = (erradas ?? []).map((r) => r.questao_id);
  if (!ids.length) return [];
  const { data, error: e2 } = await supabase
    .from("questoes")
    .select("id, enunciado, alternativas, correta, comentario")
    .in("id", ids);
  if (e2) throw new Error(e2.message);
  return (data ?? []).map((q) => {
    const alts = (q.alternativas as Alternativa[]) ?? [];
    return {
      id: q.id,
      enunciado: q.enunciado,
      correta: q.correta,
      textoCorreta: alts.find((a) => a.letra.toUpperCase() === q.correta.toUpperCase())?.texto ?? "",
      comentario: q.comentario,
    };
  });
}

/* ---------- Retomada de sessões salvas ---------- */

export async function buscarQuestoesPorIds(ids: string[]): Promise<QuestaoDb[]> {
  if (!ids.length) return [];
  const { data, error } = await supabase
    .from("questoes")
    .select(
      "id, banca, ano, enunciado, alternativas, correta, comentario, publica, tipo, area_id, especialidade_id, assunto_id, anulada, desatualizada, imagem_url",
    )
    .in("id", ids);
  if (error) throw new Error(error.message);
  const mapa = new Map(((data ?? []) as QuestaoDb[]).map((q) => [q.id, q]));
  return ids.map((id) => mapa.get(id)).filter((q): q is QuestaoDb => !!q);
}
export type SessaoCompartilhada = { codigo: string; titulo: string; questaoIds: string[] };

/** Compartilha a sessão atual: guarda a lista exata de questões e devolve um código curto. */
export async function compartilharSessao(input: {
  titulo: string;
  questaoIds: string[];
  criadoPor: string;
}): Promise<string> {
  const { data, error } = await supabase
    .from("sessoes_compartilhadas")
    .insert({ titulo: input.titulo, questao_ids: input.questaoIds, criado_por: input.criadoPor })
    .select("codigo")
    .single();
  if (error) throw new Error(error.message);
  return data.codigo;
}

/** Busca uma sessão compartilhada pelo código, pra montar uma sessão idêntica. */
export async function buscarSessaoCompartilhada(codigo: string): Promise<SessaoCompartilhada | null> {
  const { data, error } = await supabase.rpc("buscar_sessao_compartilhada", {
    p_codigo: codigo.trim().toLowerCase(),
  });
  if (error) throw new Error(error.message);
  const linha = (data ?? [])[0];
  if (!linha) return null;
  return { codigo: linha.codigo, titulo: linha.titulo, questaoIds: linha.questao_ids };
}
export type ContagensTaxonomia = {
  area: Record<string, number>;
  especialidade: Record<string, number>;
  assunto: Record<string, number>;
  subassunto: Record<string, number>;
};

export async function buscarContagensTaxonomia(): Promise<ContagensTaxonomia> {
  const { data, error } = await supabase.rpc("admin_contagens_taxonomia");
  if (error) throw new Error(error.message);
  const vazio: ContagensTaxonomia = { area: {}, especialidade: {}, assunto: {}, subassunto: {} };
  for (const linha of data ?? []) {
    const nivel = linha.nivel as keyof ContagensTaxonomia;
    if (vazio[nivel]) vazio[nivel][linha.pasta_id] = Number(linha.quantidade);
  }
  return vazio;
}
