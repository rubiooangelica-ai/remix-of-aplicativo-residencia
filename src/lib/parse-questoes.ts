import type { QuestaoImportada } from "./banco";

function parseCsv(texto: string): string[][] {
  const linhas: string[][] = [];
  let campo = "";
  let linha: string[] = [];
  let dentroDeAspas = false;
  for (let i = 0; i < texto.length; i++) {
    const c = texto[i]!;
    if (dentroDeAspas) {
      if (c === '"') {
        if (texto[i + 1] === '"') {
          campo += '"';
          i++;
        } else dentroDeAspas = false;
      } else campo += c;
      continue;
    }
    if (c === '"') dentroDeAspas = true;
    else if (c === "," || c === ";" || c === "\t") {
      linha.push(campo);
      campo = "";
    } else if (c === "\n") {
      linha.push(campo);
      linhas.push(linha);
      linha = [];
      campo = "";
    } else if (c !== "\r") campo += c;
  }
  if (campo || linha.length) {
    linha.push(campo);
    linhas.push(linha);
  }
  return linhas.filter((l) => l.some((v) => v.trim()));
}

const normalizar = (s: string) =>
  s
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");

const alias: Record<string, string> = {
  area: "area",
  "grande area": "area",
  especialidade: "especialidade",
  subespecialidade: "especialidade",
  assunto: "assunto",
  tema: "assunto",
  subassunto: "subassunto",
  subtema: "subassunto",

  banca: "banca",
  instituicao: "banca",
  ano: "ano",
  enunciado: "enunciado",
  questao: "enunciado",
  pergunta: "enunciado",
  a: "a",
  b: "b",
  c: "c",
  d: "d",
  e: "e",
  "alternativa a": "a",
  "alternativa b": "b",
  "alternativa c": "c",
  "alternativa d": "d",
  "alternativa e": "e",
  correta: "correta",
  gabarito: "correta",
  resposta: "correta",
  comentario: "comentario",
  explicacao: "comentario",
  imagem: "imagem",
  imagem_url: "imagem",
  "imagem url": "imagem",
  image: "imagem",
  image_url: "imagem",
  "image url": "imagem",
};

function montarAlternativas(get: (k: string) => string | undefined): QuestaoImportada["alternativas"] {
  const letras = ["A", "B", "C", "D", "E"];
  return letras
    .map((letra) => ({ letra, texto: (get(letra.toLowerCase()) ?? "").trim() }))
    .filter((alt) => alt.texto.length > 0);
}

export type ResultadoParse = { itens: QuestaoImportada[]; erros: string[] };

export function parseImportacao(texto: string): ResultadoParse {
  const bruto = texto.trim();
  if (!bruto) return { itens: [], erros: ["Nada para importar."] };

  const erros: string[] = [];
  const itens: QuestaoImportada[] = [];

  if (bruto.startsWith("[") || bruto.startsWith("{")) {
    let json: unknown;
    try {
      json = JSON.parse(bruto);
    } catch {
      return { itens: [], erros: ["JSON inválido — confira vírgulas e chaves."] };
    }
    const lista = Array.isArray(json) ? json : [json];
    lista.forEach((cru, i) => {
      const obj = cru as Record<string, unknown>;
      const get = (k: string) => {
        const chave = Object.keys(obj).find((x) => alias[normalizar(x)] === k);
        const valor = chave ? obj[chave] : undefined;
        return valor == null ? undefined : String(valor);
      };
      const alternativas = Array.isArray(obj['alternativas'])
        ? (obj['alternativas'] as unknown[]).map((alt, idx) =>
            typeof alt === "string"
              ? { letra: ["A", "B", "C", "D", "E"][idx] ?? String(idx + 1), texto: alt }
              : {
                  letra: String((alt as { letra?: string }).letra ?? ["A", "B", "C", "D", "E"][idx]),
                  texto: String((alt as { texto?: string }).texto ?? ""),
                },
          )
          : montarAlternativas(get);
      const item = validar({ get, alternativas, linha: i + 1 }, erros);
      if (item) itens.push(item);
    });
    return { itens, erros };
  }

  const linhas = parseCsv(bruto);
  const cabecalho = (linhas[0] ?? []).map((h) => alias[normalizar(h)] ?? normalizar(h));
  if (!cabecalho.includes("enunciado") || !cabecalho.includes("correta")) {
    return {
      itens: [],
      erros: [
        "Cabeçalho do CSV precisa ter no mínimo as colunas: area, enunciado, a, b, c, d, correta.",
      ],
    };
  }
  linhas.slice(1).forEach((valores, i) => {
    const get = (k: string) => {
      const idx = cabecalho.indexOf(k);
      const v = idx >= 0 ? valores[idx] : undefined;
      return v && v.trim() ? v.trim() : undefined;
    };
    const item = validar({ get, alternativas: montarAlternativas(get), linha: i + 2 }, erros);
    if (item) itens.push(item);
  });

  return { itens, erros };
}

function validar(
  ctx: {
    get: (k: string) => string | undefined;
    alternativas: QuestaoImportada["alternativas"];
    linha: number;
  },
  erros: string[],
): QuestaoImportada | null {
  const { get, alternativas, linha } = ctx;
  const enunciado = get("enunciado");
  const correta = get("correta");
  const area = get("area");
  if (!enunciado) {
    erros.push(`Linha ${linha}: falta o enunciado.`);
    return null;
  }
  if (!correta) {
    erros.push(`Linha ${linha}: falta o gabarito.`);
    return null;
  }
  if (alternativas.length < 2) {
    erros.push(`Linha ${linha}: precisa de pelo menos 2 alternativas.`);
    return null;
  }
  const letra = correta.trim().toUpperCase().slice(0, 1);
  if (!alternativas.some((a) => a.letra.toUpperCase() === letra)) {
    erros.push(`Linha ${linha}: gabarito "${correta}" não corresponde a nenhuma alternativa.`);
    return null;
  }
  const ano = get("ano");
  return {
    area,
    especialidade: get("especialidade"),
    assunto: get("assunto"),
    subassunto: get("subassunto"),

    banca: get("banca"),
    ano: ano && /^\d{4}$/.test(ano) ? Number(ano) : undefined,
    enunciado,
    alternativas,
    correta: letra,
    comentario: get("comentario"),
    imagem: get("imagem"),
  };
}
