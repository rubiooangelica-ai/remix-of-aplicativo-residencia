/** Classifica todas as questões exportadas (determinístico, sem IA) e grava um TSV. */
import { createReadStream, createWriteStream } from "node:fs";
import { createInterface } from "node:readline";
import { classificarQuestao } from "@/lib/classificacao/classificador";

const entrada = process.argv[2] ?? "/tmp/cls/todas.jsonl";
const saida = process.argv[3] ?? "/tmp/cls/resultado.tsv";

const out = createWriteStream(saida);
const rl = createInterface({ input: createReadStream(entrada), crlfDelay: Infinity });

const contagem = { alta: 0, media: 0, baixa: 0 };
let total = 0;

const limpar = (s: string) => s.replace(/[\t\r\n]/g, " ");

for await (const linha of rl) {
  if (!linha.trim()) continue;
  const q = JSON.parse(Buffer.from(linha, "base64").toString("utf8")) as {
    id: string;
    enunciado: string;
    alternativas: unknown;
    a?: string | null;
    t?: string | null;
    s?: string | null;
  };
  const r = classificarQuestao({
    enunciado: q.enunciado ?? "",
    alternativas: q.alternativas,
    areaAntiga: q.a,
    temaAntigo: q.t,
    assuntoAntigo: q.s,
  });
  contagem[r.confianca] += 1;
  total += 1;
  out.write(
    `${q.id}\t${limpar(r.area)}\t${limpar(r.tema)}\t${limpar(r.assunto)}\t${r.pontos}\t${r.pontosSegunda}\t${r.confianca}\n`,
  );
}

out.end();
console.log(JSON.stringify({ total, ...contagem }));
