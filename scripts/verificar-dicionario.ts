/** Cobertura do dicionário curado sobre a taxonomia oficial. */
import { DICIONARIO } from "@/lib/classificacao/dicionario";
import { TAXONOMIA } from "@/lib/classificacao/classificador";

const nomes = new Set(TAXONOMIA.map((c) => c.assunto));
const caminhos = new Set(TAXONOMIA.map((c) => `${c.area}>${c.tema}>${c.assunto}`));
const orfaos = Object.keys(DICIONARIO).filter((k) => !nomes.has(k) && !caminhos.has(k));
const cobertos = TAXONOMIA.filter(
  (c) => DICIONARIO[`${c.area}>${c.tema}>${c.assunto}`] ?? DICIONARIO[c.assunto],
).length;

console.log(`combinações: ${TAXONOMIA.length} | com dicionário: ${cobertos}`);
console.log(`chaves órfãs (${orfaos.length}):\n${orfaos.join("\n")}`);
