/** Utilidades de leitura de materiais: sumário automático e extração de seções especiais. */

export type TituloSumario = { id: string; texto: string; nivel: number };

export type SecoesEspeciais = {
  corpo: string;
  sumario: TituloSumario[];
  casosRapidos: string | null;
  pegadinhas: string | null;
  revisaoRapida: string[];
};

export function slugificarTitulo(texto: string) {
  const base = texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return base || "secao";
}

export function criarGeradorDeIds() {
  const usados = new Map<string, number>();
  return (texto: string) => {
    const base = slugificarTitulo(texto);
    const n = usados.get(base) ?? 0;
    usados.set(base, n + 1);
    return n === 0 ? base : `${base}-${n + 1}`;
  };
}

function textoDoHeading(linha: string) {
  return linha.replace(/^#{1,6}\s+/, "").replace(/[*_`]/g, "").trim();
}

function normalizar(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/\s+/g, " ")
    .trim();
}

type Tipo = "sumario" | "casos" | "pegadinhas" | "revisao" | "checklist" | null;

function classificar(titulo: string): Tipo {
  const t = normalizar(titulo);
  if (/^(sumario|indice|conteudo do capitulo)\b/.test(t)) return "sumario";
  if (t.includes("casos rapidos") || t.includes("casos clinicos rapidos")) return "casos";
  // Só captura a seção dedicada. Pequenos destaques/heads no singular ("Pegadinha de prova") permanecem no corpo.
  if (
    t.includes("pegadinhas de residencia") ||
    t.includes("pegadinhas de prova") ||
    t.includes("pegadinhas e diagnosticos diferenciais") ||
    t === "pegadinhas"
  ) return "pegadinhas";
  if (
    t.includes("tabela de revisao rapida") ||
    t.includes("resumo de revisao rapida") ||
    t.includes("revisao rapida") ||
    t.includes("sintese de alto rendimento")
  ) return "revisao";
  if (t.includes("checklist")) return "checklist";
  return null;
}

type Bloco = { nivel: number; titulo: string; inicio: number; fim: number; tipo: Tipo };

export function analisarMaterial(conteudo: string): SecoesEspeciais {
  const linhas = conteudo.split("\n");
  const headings: { nivel: number; titulo: string; linha: number }[] = [];
  let dentroDeCodigo = false;

  linhas.forEach((linha, i) => {
    if (/^\s*(```|~~~)/.test(linha)) {
      dentroDeCodigo = !dentroDeCodigo;
      return;
    }
    if (dentroDeCodigo) return;
    const m = /^(#{1,4})\s+\S/.exec(linha);
    if (m) headings.push({ nivel: m[1]!.length, titulo: textoDoHeading(linha), linha: i });
  });

  const blocos: Bloco[] = headings.map((h, idx) => {
    let fim = linhas.length;
    for (let j = idx + 1; j < headings.length; j++) {
      if (headings[j]!.nivel <= h.nivel) {
        fim = headings[j]!.linha;
        break;
      }
    }
    return { nivel: h.nivel, titulo: h.titulo, inicio: h.linha, fim, tipo: classificar(h.titulo) };
  });

  const especiais = blocos.filter((b) => b.tipo && b.nivel <= 3);
  const selecionadas: Bloco[] = [];
  for (const bloco of especiais) {
    if (selecionadas.some((s) => bloco.inicio >= s.inicio && bloco.fim <= s.fim)) continue;
    selecionadas.push(bloco);
  }

  const remover = selecionadas.map((s) => ({ inicio: s.inicio, fim: s.fim }));
  const corpoLinhas = linhas.filter((_, i) => !remover.some((r) => i >= r.inicio && i < r.fim));
  const corpo = corpoLinhas.join("\n").replace(/\n{4,}/g, "\n\n\n").trim();
  const trecho = (b: Bloco) => linhas.slice(b.inicio, b.fim).join("\n").trim();

  const casos = selecionadas.find((s) => s.tipo === "casos");
  const pegadinhas = selecionadas.find((s) => s.tipo === "pegadinhas");
  const revisao = selecionadas
    .filter((s) => s.tipo === "revisao" || s.tipo === "checklist")
    .map(trecho);

  const gerarId = criarGeradorDeIds();
  const sumario: TituloSumario[] = [];
  let emCodigo = false;
  for (const linha of corpoLinhas) {
    if (/^\s*(```|~~~)/.test(linha)) {
      emCodigo = !emCodigo;
      continue;
    }
    if (emCodigo) continue;
    const m = /^(#{1,4})\s+\S/.exec(linha);
    if (!m) continue;
    const nivel = m[1]!.length;
    const texto = textoDoHeading(linha);
    const id = gerarId(texto);
    if (nivel <= 3) sumario.push({ id, texto, nivel });
  }

  return {
    corpo,
    sumario,
    casosRapidos: casos ? trecho(casos) : null,
    pegadinhas: pegadinhas ? trecho(pegadinhas) : null,
    revisaoRapida: revisao,
  };
}
