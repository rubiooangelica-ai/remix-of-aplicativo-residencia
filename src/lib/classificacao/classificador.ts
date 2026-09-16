/**
 * Classificador determinístico de questões (regras + palavras-chave ponderadas).
 * Não faz nenhuma chamada de IA: só texto, dicionário e pesos.
 *
 * Prioridade de evidência (do mais para o menos importante):
 *  1) comando / pergunta final da questão
 *  2) alternativa correta
 *  3) comentário / resolução
 *  4) restante do caso clínico
 *  5) alternativas erradas
 *  6) trechos incidentais (antecedentes, comorbidades, história familiar)
 */
import taxonomiaOficial from "@/data/taxonomia-oficial.json";
import { CONTEXTO_AREA, DICIONARIO, MARCADORES_INCIDENTAIS, type Entrada } from "./dicionario";
import { chaveTermo, ngramas, normalizar, palavras } from "./normalizar";

export type Combo = { area: string; tema: string; assunto: string };
export type Confianca = "alta" | "media" | "baixa";

export type Resultado = Combo & {
  pontos: number;
  pontosSegunda: number;
  segunda: string;
  confianca: Confianca;
  origem: "regras" | "backup";
};

export const TAXONOMIA: Combo[] = (() => {
  const vistos = new Set<string>();
  const lista: Combo[] = [];
  for (const r of taxonomiaOficial as Combo[]) {
    const k = `${r.area}>${r.tema}>${r.assunto}`;
    if (vistos.has(k)) continue;
    vistos.add(k);
    lista.push(r);
  }
  return lista;
})();

const PESOS: Record<keyof Entrada, number> = {
  fortes: 10,
  nome: 8,
  criterios: 6,
  drogas: 5,
  achados: 2,
  negativos: -8,
};

const STOP = new Set([
  "e", "de", "da", "do", "das", "dos", "a", "o", "as", "os", "em", "no", "na", "com", "sem", "por",
  "para", "ao", "aos", "the", "of", "point", "care", "outras", "outros", "geral", "gerais",
  "principios", "tipos", "manejo", "avaliacao", "protocolo", "protocolos", "sindrome", "sindromes",
  "doenca", "doencas", "disturbio", "disturbios", "infeccao", "infeccoes", "aguda", "agudo",
  "cronica", "cronico", "primaria", "secundaria",
]);

/** palavras descritivas que aparecem em muitos nomes da taxonomia e não identificam o assunto. */
const GENERICOS = new Set([
  "diagnostico", "diagnostica", "diagnosticos", "tratamento", "tratamentos", "conduta", "condutas",
  "manejo", "abordagem", "avaliacao", "classificacao", "criterio", "criterios", "escore", "escores",
  "algoritmo", "algoritmos", "protocolo", "protocolos", "indicacao", "indicacoes",
  "contraindicacao", "contraindicacoes", "complicacao", "complicacoes", "prevencao", "profilaxia",
  "rastreamento", "seguimento", "investigacao", "identificacao", "reconhecimento", "estabilizacao",
  "estratificacao", "monitorizacao", "epidemiologia", "fisiopatologia", "etiologia", "clinico",
  "clinica", "quadro", "exame", "exames", "inicial", "precoce", "tardia", "adulto", "risco",
  "medidas", "metas", "fase", "fases", "periodo", "periodos", "tipos", "principios", "aspectos",
  "assistencia", "cuidado", "cuidados", "geral", "gerais", "especifico", "especificos", "primeira",
  "hora", "horas", "janela", "terapeutica", "terapia", "eventos", "adversos", "pratica", "aplicacao",
  "dor", "febre", "tosse", "dispneia", "vomito", "vomitos", "diarreia", "nausea", "cefaleia",
  "fadiga", "astenia", "edema", "prurido", "sangramento", "dispneico", "mal estar", "cansaco",
]);

/** sintomas genéricos: nunca definem o assunto sozinhos. */
const SINTOMAS_GENERICOS = new Set([
  "dor", "febre", "tosse", "dispneia", "vomito", "diarreia", "nausea", "cefaleia", "fadiga",
  "astenia", "edema", "prurido", "sangramento", "tontura", "palpitacao", "cansaco", "emagrecimento",
]);

type Termo = { i: number; peso: number; espec: boolean };

/** índice invertido: termo canônico -> combinações e pesos */
const indice = new Map<string, Termo[]>();
/** termos com mais de 4 palavras (casados por substring) */
const longos: { termo: string; alvos: Termo[] }[] = [];
/** pistas de tema (peso leve, contexto hierárquico) */
const indiceTema = new Map<string, Termo[]>();

const temas: { area: string; tema: string; combos: number[] }[] = [];
const temaDeCombo: number[] = [];

function adicionar(mapa: Map<string, Termo[]>, termo: string, alvo: Termo) {
  const k = chaveTermo(termo);
  if (!k) return;
  const n = k.split(" ").length;
  if (n > 4) {
    longos.push({ termo: k, alvos: [alvo] });
    return;
  }
  const atual = mapa.get(k);
  if (atual) {
    const existente = atual.find((t) => t.i === alvo.i);
    if (existente) {
      existente.peso = Math.max(existente.peso, alvo.peso);
      existente.espec = existente.espec || alvo.espec;
    } else atual.push(alvo);
  } else mapa.set(k, [alvo]);
}

// ---- construção do índice ----
{
  const idxTema = new Map<string, number>();
  TAXONOMIA.forEach((c, i) => {
    const kt = `${c.area}>${c.tema}`;
    let t = idxTema.get(kt);
    if (t === undefined) {
      t = temas.length;
      idxTema.set(kt, t);
      temas.push({ area: c.area, tema: c.tema, combos: [] });
    }
    temas[t]!.combos.push(i);
    temaDeCombo[i] = t;
  });

  const soGenerico = (texto: string) =>
    palavras(normalizar(texto)).every((p) => GENERICOS.has(p) || STOP.has(p) || p.length < 4);

  TAXONOMIA.forEach((c, i) => {
    // nome completo do assunto (limpo de parênteses/siglas)
    const nome = c.assunto.replace(/\(.*?\)/g, " ").trim();
    adicionar(indice, nome, { i, peso: 9, espec: true });
    // cabeça do nome antes dos dois-pontos ("DPOC: Manejo" -> "DPOC")
    const cabeca = nome.split(":")[0]!.trim();
    if (cabeca !== nome && cabeca.length >= 4 && !soGenerico(cabeca)) {
      adicionar(indice, cabeca, { i, peso: 8, espec: true });
    }
    // partes separadas por " e ", ":", "/" ou vírgula — descarta trechos genéricos
    for (const parte of nome.split(/\se\s|:|\/|,/)) {
      const limpo = parte.trim();
      if (limpo.length < 6 || soGenerico(limpo)) continue;
      if (chaveTermo(limpo) === chaveTermo(nome)) continue;
      adicionar(indice, limpo, { i, peso: 6, espec: true });
    }

    // dicionário curado (por nome do assunto ou caminho completo)
    const entrada = DICIONARIO[`${c.area}>${c.tema}>${c.assunto}`] ?? DICIONARIO[c.assunto];
    if (entrada) {
      for (const grupo of Object.keys(PESOS) as (keyof Entrada)[]) {
        for (const termo of entrada[grupo] ?? []) {
          adicionar(indice, termo, {
            i,
            peso: PESOS[grupo],
            espec: grupo === "fortes" || grupo === "nome" || grupo === "criterios",
          });
        }
      }
    }
  });

  // nome do tema como contexto
  temas.forEach((t, ti) => {
    adicionar(indiceTema, t.tema, { i: ti, peso: 3, espec: false });
  });

  // ---- poda de termos permissivos ----
  for (const [k, alvos] of [...indice]) {
    const n = k.split(" ").length;
    // termo que aponta para muitas combinações não identifica nada
    if (alvos.filter((t) => t.peso > 0).length > 6) {
      indice.delete(k);
      continue;
    }
    if (n > 1) continue;
    const pesoMax = Math.max(...alvos.map((t) => t.peso));
    const positivos = alvos.filter((t) => t.peso > 0);
    const ok =
      k.length >= 4 &&
      !GENERICOS.has(k) &&
      !STOP.has(k) &&
      !SINTOMAS_GENERICOS.has(k) &&
      positivos.length <= 3 &&
      (pesoMax >= 8 || k.length >= 8);
    // palavra isolada só permanece quando é muito específica de poucas combinações
    if (!ok) {
      const negativos = alvos.filter((t) => t.peso < 0);
      if (negativos.length) indice.set(k, negativos);
      else indice.delete(k);
    }
  }
}

const CACHE_ANTIGA = new Map<string, string>();
function normalizarNome(s: string): string {
  const c = CACHE_ANTIGA.get(s);
  if (c) return c;
  const v = chaveTermo(s);
  CACHE_ANTIGA.set(s, v);
  return v;
}

// ---- índices para o fallback pela classificação de backup ----
const porAssunto = new Map<string, number>();
const porTema = new Map<string, number>();
TAXONOMIA.forEach((c, i) => {
  const ka = normalizarNome(c.assunto);
  if (!porAssunto.has(ka)) porAssunto.set(ka, i);
  const kt = normalizarNome(c.tema);
  if (!porTema.has(kt)) porTema.set(kt, i);
});

/** mapeia uma classificação antiga (backup) para a taxonomia oficial. */
export function mapearAntiga(
  area?: string | null,
  tema?: string | null,
  assunto?: string | null,
): Combo | null {
  if (assunto) {
    const i = porAssunto.get(normalizarNome(assunto));
    if (i !== undefined) return TAXONOMIA[i]!;
  }
  if (tema) {
    const i = porTema.get(normalizarNome(tema));
    if (i !== undefined) return TAXONOMIA[i]!;
  }
  if (assunto) {
    // casamento parcial: assunto antigo contido em um assunto oficial (ou o contrário)
    const alvo = normalizarNome(assunto);
    if (alvo.length >= 8) {
      for (const [k, i] of porAssunto) {
        if (k.includes(alvo) || alvo.includes(k)) return TAXONOMIA[i]!;
      }
    }
  }
  // só a área não é suficiente: quem decide nesse caso é o melhor candidato dentro da área
  return null;
}

type Segmento = { ngramas: Set<string>; texto: string; mult: number; conta: boolean };

/** separa o texto por prioridade de evidência. */
function segmentar(
  enunciado: string,
  correta: string,
  erradas: string,
  comentario: string,
): Segmento[] {
  const bruto = normalizar(enunciado);

  // trechos incidentais: "antecedente de ..." até a próxima pontuação
  let incidental = "";
  let corpo = bruto;
  for (const marca of MARCADORES_INCIDENTAIS) {
    let de = corpo.indexOf(marca);
    while (de !== -1) {
      const resto = corpo.slice(de + marca.length);
      const fim = resto.search(/[.,;:?!]|\b(apresenta|procura|refere|evolui|queixa|deu entrada)\b/);
      const trecho = fim === -1 ? resto.slice(0, 120) : resto.slice(0, fim);
      incidental += ` ${trecho}`;
      corpo = `${corpo.slice(0, de)} ${corpo.slice(de + marca.length + trecho.length)}`;
      de = corpo.indexOf(marca, de + 1);
    }
  }

  // comando final: última frase interrogativa ou os últimos ~260 caracteres
  const idx = corpo.lastIndexOf("?");
  let comando = "";
  if (idx > 40) {
    const inicio = Math.max(
      corpo.lastIndexOf(".", idx - 1),
      corpo.lastIndexOf(":", idx - 1),
      idx - 320,
    );
    comando = corpo.slice(inicio + 1, idx + 1);
  } else {
    comando = corpo.slice(Math.max(0, corpo.length - 260));
  }

  const seg = (texto: string, mult: number, conta = true): Segmento => ({
    texto,
    mult,
    conta,
    ngramas: ngramas(palavras(texto)),
  });

  return [
    seg(comando, 4),
    seg(normalizar(correta, bruto), 1.6),
    seg(normalizar(comentario, bruto), 0.9),
    seg(corpo, 0.45),
    seg(normalizar(erradas, bruto), 0.12, false),
    seg(incidental, 0.05, false),
  ];
}

export type QuestaoEntrada = {
  enunciado: string;
  alternativas?: unknown;
  correta?: string | null;
  comentario?: string | null;
  areaAntiga?: string | null;
  temaAntigo?: string | null;
  assuntoAntigo?: string | null;
};

/** texto de uma alternativa (string ou objeto {letra, texto}). */
function textoDe(a: unknown): string {
  if (typeof a === "string") return a;
  if (a && typeof a === "object") {
    return Object.entries(a as Record<string, unknown>)
      .filter(([k, v]) => typeof v === "string" && k.toLowerCase() !== "letra")
      .map(([, v]) => v as string)
      .join(" ");
  }
  return "";
}

/** separa a alternativa correta das demais, quando o gabarito é conhecido. */
function separarAlternativas(
  alternativas: unknown,
  correta?: string | null,
): { certa: string; erradas: string } {
  const gabarito = (correta ?? "").trim().toLowerCase();
  const letras = ["a", "b", "c", "d", "e", "f"];
  const partes: { letra: string; texto: string }[] = [];

  if (Array.isArray(alternativas)) {
    alternativas.forEach((a, i) => {
      const letraObj =
        a && typeof a === "object"
          ? String((a as Record<string, unknown>)["letra"] ?? "").trim().toLowerCase()
          : "";
      partes.push({ letra: letraObj || letras[i] || "", texto: textoDe(a) });
    });
  } else if (alternativas && typeof alternativas === "object") {
    for (const [k, v] of Object.entries(alternativas as Record<string, unknown>)) {
      partes.push({ letra: k.trim().toLowerCase(), texto: typeof v === "string" ? v : textoDe(v) });
    }
  } else if (typeof alternativas === "string") {
    return { certa: "", erradas: alternativas };
  }

  let certa = "";
  const erradas: string[] = [];
  for (const p of partes) {
    if (gabarito && p.letra === gabarito) certa += ` ${p.texto}`;
    else erradas.push(p.texto);
  }
  // sem gabarito reconhecido, todas as alternativas entram com peso baixo
  if (!certa.trim()) return { certa: "", erradas: partes.map((p) => p.texto).join(" \n ") };
  return { certa, erradas: erradas.join(" \n ") };
}

export function classificarQuestao(q: QuestaoEntrada): Resultado {
  const { certa, erradas } = separarAlternativas(q.alternativas, q.correta);
  const segmentos = segmentar(q.enunciado ?? "", certa, erradas, q.comentario ?? "");
  const pontos = new Float64Array(TAXONOMIA.length);
  const pontosTema = new Float64Array(temas.length);
  const especifica = new Uint8Array(TAXONOMIA.length);
  const acertos = new Uint8Array(TAXONOMIA.length);

  /** expressões inteiras valem muito mais que palavras isoladas. */
  const bonusFrase = (g: string) => {
    const n = g.split(" ").length;
    return n >= 3 ? 2 : n === 2 ? 1.4 : 0.45;
  };

  for (const s of segmentos) {
    if (!s.texto) continue;
    for (const g of s.ngramas) {
      const alvos = indice.get(g);
      if (alvos) {
        const nPalavras = g.split(" ").length;
        const b = bonusFrase(g);
        for (const t of alvos) {
          pontos[t.i]! += t.peso * s.mult * b;
          if (t.peso > 0 && s.conta) {
            acertos[t.i] = Math.min(acertos[t.i]! + 1, 250);
            if (t.espec && (nPalavras >= 2 || g.length >= 6) && s.mult >= 0.45) especifica[t.i] = 1;
          }
        }
      }
      const alvosTema = indiceTema.get(g);
      if (alvosTema) {
        const b = bonusFrase(g);
        for (const t of alvosTema) pontosTema[t.i]! += t.peso * s.mult * b;
      }
    }
    for (const { termo, alvos } of longos) {
      if (s.texto.includes(termo)) {
        for (const t of alvos) {
          pontos[t.i]! += t.peso * s.mult * 2;
          if (t.peso > 0 && s.conta) especifica[t.i] = 1;
        }
      }
    }
  }

  // evidência fraca (só palavras isoladas ou só sintomas) vale muito menos
  for (let i = 0; i < pontos.length; i += 1) {
    if (pontos[i]! <= 0) continue;
    if (!especifica[i]) pontos[i]! *= acertos[i]! >= 3 ? 0.5 : 0.3;
  }

  // contexto de área (pediatria, obstetrícia, etc.)
  const textoTodo = `${segmentos[3]!.texto} ${segmentos[0]!.texto} ${segmentos[1]!.texto}`;
  const multArea = new Map<string, number>();
  for (const [area, regra] of Object.entries(CONTEXTO_AREA)) {
    const temPista = regra.pistas.some((p) => textoTodo.includes(p));
    multArea.set(area, temPista ? 1 : regra.penalidade);
  }

  // agregação hierárquica pelo MELHOR filho (não pela soma, para não premiar temas grandes)
  const maxTema = new Float64Array(temas.length);
  const maxArea = new Map<string, number>();
  TAXONOMIA.forEach((c, i) => {
    const t = temaDeCombo[i]!;
    if (pontos[i]! > maxTema[t]!) maxTema[t] = pontos[i]!;
  });
  temas.forEach((tm, t) => {
    const v = maxTema[t]! + pontosTema[t]!;
    if (v > (maxArea.get(tm.area) ?? 0)) maxArea.set(tm.area, v);
  });

  const antigaArea = q.areaAntiga ? normalizarNome(q.areaAntiga) : "";
  const antigoTema = q.temaAntigo ? normalizarNome(q.temaAntigo) : "";
  const antigoAssunto = q.assuntoAntigo ? normalizarNome(q.assuntoAntigo) : "";

  const finais = new Float64Array(TAXONOMIA.length);
  let melhor = -1;
  let melhorPts = -Infinity;
  let segundo = -1;
  let segundoPts = -Infinity;

  TAXONOMIA.forEach((c, i) => {
    const t = temaDeCombo[i]!;
    // base: evidência do próprio assunto; contexto de tema e área só ajudam a desempatar
    let p = pontos[i]! + pontosTema[t]! * 0.3 + (maxArea.get(c.area) ?? 0) * 0.04;
    p *= multArea.get(c.area) ?? 1;

    // sinal fraco da classificação antiga (desempate apenas)
    if (antigoAssunto && normalizarNome(c.assunto) === antigoAssunto) p += 1.2;
    else if (antigoTema && normalizarNome(c.tema) === antigoTema) p += 0.5;
    else if (antigaArea && normalizarNome(c.area) === antigaArea) p += 0.25;

    // desempate estável: primeira combinação da lista oficial vence
    p -= i * 1e-6;
    finais[i] = p;

    if (p > melhorPts) {
      segundo = melhor;
      segundoPts = melhorPts;
      melhor = i;
      melhorPts = p;
    } else if (p > segundoPts) {
      segundo = i;
      segundoPts = p;
    }
  });

  const c = TAXONOMIA[melhor]!;
  const s = segundo >= 0 ? TAXONOMIA[segundo]! : null;
  const diff = melhorPts - (segundoPts === -Infinity ? 0 : segundoPts);
  const forte = especifica[melhor] === 1;

  // evidência fraca: usa a classificação anterior ao reprocessamento como fallback
  if (!forte || melhorPts < 9) {
    let backup = mapearAntiga(q.areaAntiga, q.temaAntigo, q.assuntoAntigo);
    if (!backup && antigaArea) {
      // só a área antiga é conhecida: escolhe o melhor candidato dentro dela
      let iArea = -1;
      let ptsArea = -Infinity;
      TAXONOMIA.forEach((cc, i) => {
        if (normalizarNome(cc.area) !== antigaArea) return;
        if (finais[i]! > ptsArea) {
          ptsArea = finais[i]!;
          iArea = i;
        }
      });
      if (iArea >= 0) backup = TAXONOMIA[iArea]!;
    }
    if (backup) {
      return {
        ...backup,
        pontos: Math.round(melhorPts * 100) / 100,
        pontosSegunda: Math.round(Math.max(segundoPts, 0) * 100) / 100,
        segunda: `${c.area} > ${c.tema} > ${c.assunto}`,
        confianca: "baixa",
        origem: "backup",
      };
    }
  }

  const confianca: Confianca =
    forte && melhorPts >= 20 && diff >= 8
      ? "alta"
      : forte && melhorPts >= 11 && diff >= 3
        ? "media"
        : "baixa";

  return {
    ...c,
    pontos: Math.round(melhorPts * 100) / 100,
    pontosSegunda: Math.round(Math.max(segundoPts, 0) * 100) / 100,
    segunda: s ? `${s.area} > ${s.tema} > ${s.assunto}` : "",
    confianca,
    origem: "regras",
  };
}
