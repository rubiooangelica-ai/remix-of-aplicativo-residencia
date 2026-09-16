/** Teste manual do classificador determinístico com uma amostra de questões. */
import { readFileSync } from "node:fs";
import { classificarQuestao } from "@/lib/classificacao/classificador";

const linhas = readFileSync(process.argv[2] ?? "/tmp/cls/amostra.jsonl", "utf8")
  .split("\n")
  .filter(Boolean);

for (const linha of linhas) {
  const q = JSON.parse(linha) as {
    enunciado: string;
    alternativas: unknown;
    a?: string;
    t?: string;
    s?: string;
  };
  const r = classificarQuestao({
    enunciado: q.enunciado,
    alternativas: q.alternativas,
    areaAntiga: q.a,
    temaAntigo: q.t,
    assuntoAntigo: q.s,
  });
  console.log("—".repeat(90));
  console.log(q.enunciado.replace(/\s+/g, " ").slice(0, 300));
  console.log(`ANTIGO: ${q.a} > ${q.t} > ${q.s}`);
  console.log(
    `NOVO:   ${r.area} > ${r.tema} > ${r.assunto}  [${r.pontos} vs ${r.pontosSegunda} | ${r.confianca}]`,
  );
  console.log(`2º:     ${r.segunda}`);
}
