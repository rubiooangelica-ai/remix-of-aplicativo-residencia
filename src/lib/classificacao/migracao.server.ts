/**
 * Motor da reorganização da taxonomia SEM IA.
 * Usa apenas o classificador determinístico (regras + palavras-chave ponderadas)
 * e a lista oficial de combinações em src/data/taxonomia-oficial.json.
 */
import { classificarQuestao, TAXONOMIA, type Combo } from "./classificador";

const chave = (a: string, t: string, s: string) =>
  `${a.trim().toLowerCase()}>${t.trim().toLowerCase()}>${s.trim().toLowerCase()}`;

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

export type ResultadoSincronizacao = {
  combinacoes: number;
  areasCriadas: number;
  temasCriados: number;
  assuntosCriados: number;
};

/** Recria a lista oficial no banco e garante que toda pasta da taxonomia existe. */
export async function sincronizarArvore(): Promise<ResultadoSincronizacao> {
  const db = await admin();

  // 1) lista oficial fechada
  const { data: atuais, error: erroLista } = await db
    .from("taxonomia_oficial")
    .select("id, area, tema, assunto");
  if (erroLista) throw new Error(`taxonomia_oficial: ${erroLista.message}`);

  const oficiais = new Set(TAXONOMIA.map((c) => chave(c.area, c.tema, c.assunto)));
  const existentes = new Set<string>();
  const sobrando: string[] = [];
  for (const r of atuais ?? []) {
    const k = chave(r.area, r.tema, r.assunto);
    if (oficiais.has(k) && !existentes.has(k)) existentes.add(k);
    else sobrando.push(r.id);
  }
  for (let i = 0; i < sobrando.length; i += 200) {
    const { error } = await db.from("taxonomia_oficial").delete().in("id", sobrando.slice(i, i + 200));
    if (error) throw new Error(`limpar taxonomia_oficial: ${error.message}`);
  }
  const faltando = TAXONOMIA.filter((c) => !existentes.has(chave(c.area, c.tema, c.assunto)));
  for (let i = 0; i < faltando.length; i += 200) {
    const { error } = await db.from("taxonomia_oficial").insert(faltando.slice(i, i + 200));
    if (error) throw new Error(`inserir taxonomia_oficial: ${error.message}`);
  }

  // 2) árvore de pastas
  const { data: areas, error: erroAreas } = await db.from("areas").select("id, nome");
  if (erroAreas) throw new Error(`areas: ${erroAreas.message}`);
  const mapaArea = new Map<string, string>();
  for (const a of areas ?? []) mapaArea.set(a.nome.trim().toLowerCase(), a.id);

  let areasCriadas = 0;
  const nomesArea = [...new Set(TAXONOMIA.map((c) => c.area.trim()))];
  for (const nome of nomesArea) {
    if (mapaArea.has(nome.toLowerCase())) continue;
    const { data, error } = await db.from("areas").insert({ nome }).select("id").single();
    if (error) throw new Error(`criar área ${nome}: ${error.message}`);
    mapaArea.set(nome.toLowerCase(), data.id);
    areasCriadas += 1;
  }

  const { data: temas, error: erroTemas } = await db
    .from("especialidades")
    .select("id, nome, area_id");
  if (erroTemas) throw new Error(`especialidades: ${erroTemas.message}`);
  const mapaTema = new Map<string, string>();
  for (const e of temas ?? []) mapaTema.set(`${e.area_id}|${e.nome.trim().toLowerCase()}`, e.id);

  let temasCriados = 0;
  const paresTema = [...new Set(TAXONOMIA.map((c) => `${c.area.trim()}||${c.tema.trim()}`))];
  for (const par of paresTema) {
    const [area, tema] = par.split("||") as [string, string];
    const areaId = mapaArea.get(area.toLowerCase())!;
    const k = `${areaId}|${tema.toLowerCase()}`;
    if (mapaTema.has(k)) continue;
    const { data, error } = await db
      .from("especialidades")
      .insert({ area_id: areaId, nome: tema })
      .select("id")
      .single();
    if (error) throw new Error(`criar tema ${tema}: ${error.message}`);
    mapaTema.set(k, data.id);
    temasCriados += 1;
  }

  const mapaAssunto = new Map<string, string>();
  for (let de = 0; ; de += 1000) {
    const { data, error } = await db
      .from("assuntos")
      .select("id, nome, especialidade_id")
      .range(de, de + 999);
    if (error) throw new Error(`assuntos: ${error.message}`);
    for (const s of data ?? [])
      mapaAssunto.set(`${s.especialidade_id}|${s.nome.trim().toLowerCase()}`, s.id);
    if (!data || data.length < 1000) break;
  }

  let assuntosCriados = 0;
  for (const c of TAXONOMIA) {
    const areaId = mapaArea.get(c.area.trim().toLowerCase())!;
    const temaId = mapaTema.get(`${areaId}|${c.tema.trim().toLowerCase()}`)!;
    const k = `${temaId}|${c.assunto.trim().toLowerCase()}`;
    if (mapaAssunto.has(k)) continue;
    const { data, error } = await db
      .from("assuntos")
      .insert({ especialidade_id: temaId, nome: c.assunto.trim() })
      .select("id")
      .single();
    if (error) throw new Error(`criar assunto ${c.assunto}: ${error.message}`);
    mapaAssunto.set(k, data.id);
    assuntosCriados += 1;
  }

  return { combinacoes: TAXONOMIA.length, areasCriadas, temasCriados, assuntosCriados };
}

export type ResultadoLote = {
  processadas: number;
  aplicadas: number;
  alta: number;
  media: number;
  baixa: number;
  restantes: number;
  fim: boolean;
};

type Pendente = {
  questao_id: string;
  enunciado: string;
  alternativas: unknown;
  correta: string | null;
  comentario: string | null;
  old_area: string | null;
  old_tema: string | null;
  old_assunto: string | null;
};

/** Classifica e aplica um lote de questões (sem IA, sem simulação). */
export async function processarLoteClassificacao(tamanho = 500): Promise<ResultadoLote> {
  const db = await admin();
  const { data, error } = await db.rpc("class_proximo_lote", { p_limite: tamanho });
  if (error) throw new Error(`reservar lote: ${error.message}`);
  const pendentes = (data ?? []) as Pendente[];

  const contagem = { alta: 0, media: 0, baixa: 0 };
  const itens = pendentes.map((q) => {
    const r = classificarQuestao({
      enunciado: q.enunciado ?? "",
      alternativas: q.alternativas,
      correta: q.correta,
      comentario: q.comentario,
      areaAntiga: q.old_area,
      temaAntigo: q.old_tema,
      assuntoAntigo: q.old_assunto,
    });
    contagem[r.confianca] += 1;
    return {
      questao_id: q.questao_id,
      area: r.area,
      tema: r.tema,
      assunto: r.assunto,
      pontos: r.pontos,
      pontos_segunda: r.pontosSegunda,
      confianca: r.confianca,
    };
  });

  let aplicadas = 0;
  for (let i = 0; i < itens.length; i += 250) {
    const { data: n, error: erroAplicar } = await db.rpc("class_aplicar_lote", {
      p_itens: itens.slice(i, i + 250),
    });
    if (erroAplicar) throw new Error(`aplicar lote: ${erroAplicar.message}`);
    aplicadas += Number(n ?? 0);
  }

  const { count } = await db
    .from("questoes")
    .select("id", { count: "exact", head: true });
  const { count: feitas } = await db
    .from("class_det")
    .select("questao_id", { count: "exact", head: true });
  const restantes = Math.max((count ?? 0) - (feitas ?? 0), 0);

  return {
    processadas: pendentes.length,
    aplicadas,
    alta: contagem.alta,
    media: contagem.media,
    baixa: contagem.baixa,
    restantes,
    fim: pendentes.length === 0,
  };
}

/** Apaga o registro da classificação para reprocessar todas as questões. */
export async function reiniciarClassificacao(): Promise<{ limpadas: number }> {
  const db = await admin();
  const { data, error } = await db.rpc("class_reiniciar");
  if (error) throw new Error(`reiniciar: ${error.message}`);
  return { limpadas: Number(data ?? 0) };
}

/** Remove as pastas antigas que não pertencem à taxonomia oficial. */
export async function limparTaxonomiaAntiga() {
  const db = await admin();
  const { data, error } = await db.rpc("class_limpar_antigos");
  if (error) throw new Error(`limpar antigos: ${error.message}`);
  return Array.isArray(data) ? data[0] : data;
}

/** Relatório final de validação. */
export async function validarTaxonomia() {
  const db = await admin();
  const { data, error } = await db.rpc("class_validar");
  if (error) throw new Error(`validar: ${error.message}`);
  return Array.isArray(data) ? data[0] : data;
}

/** Combinações fora da lista oficial (deve ser vazio no fim). */
export function combinacoesOficiais(): Combo[] {
  return TAXONOMIA;
}
