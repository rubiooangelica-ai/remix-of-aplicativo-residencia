import JSZip from "jszip";
import { parseImportacao } from "./parse-questoes";
import type { QuestaoImportada } from "./banco";

export const TAMANHO_MAX_ZIP = 200 * 1024 * 1024; // 200 MB
export const TAMANHO_MAX_IMAGEM = 8 * 1024 * 1024; // 8 MB por imagem
const EXTENSOES_OK = ["png", "jpg", "jpeg", "webp"];

export type PacoteZip = {
  itens: QuestaoImportada[];
  /** nome do arquivo (ex.: "q22.png") -> conteúdo */
  imagens: Map<string, Blob>;
  comImagem: number;
  semImagem: number;
  erros: string[];
};

function nomeSeguro(nome: string) {
  return !nome.includes("..") && !nome.startsWith("/") && !/[\\:]/.test(nome);
}

/** Confere a assinatura binária do arquivo — não confia só na extensão. */
async function tipoRealValido(blob: Blob, extensao: string) {
  const buf = new Uint8Array(await blob.slice(0, 16).arrayBuffer());
  const ehPng = buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47;
  const ehJpg = buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff;
  const ehWebp =
    buf[0] === 0x52 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x46 &&
    buf[8] === 0x57 && buf[9] === 0x45 && buf[10] === 0x42 && buf[11] === 0x50;
  if (extensao === "png") return ehPng;
  if (extensao === "jpg" || extensao === "jpeg") return ehJpg;
  if (extensao === "webp") return ehWebp;
  return false;
}

/** Lê um .zip com questoes.json + imagens/ e valida tudo antes de qualquer gravação. */
export async function lerPacoteZip(arquivo: File): Promise<PacoteZip> {
  const erros: string[] = [];
  if (arquivo.size > TAMANHO_MAX_ZIP) {
    return { itens: [], imagens: new Map(), comImagem: 0, semImagem: 0, erros: ["O ZIP passa de 200 MB."] };
  }

  const zip = await JSZip.loadAsync(arquivo);
  const entradaJson = Object.keys(zip.files).find(
    (n) => !zip.files[n]!.dir && n.split("/").pop()?.toLowerCase() === "questoes.json",
  );
  if (!entradaJson) {
    return {
      itens: [],
      imagens: new Map(),
      comImagem: 0,
      semImagem: 0,
      erros: ["O ZIP precisa conter um arquivo chamado questoes.json."],
    };
  }

  const texto = await zip.files[entradaJson]!.async("string");
  const { itens, erros: errosParse } = parseImportacao(texto);
  erros.push(...errosParse);
  if (!itens.length) {
    erros.push("Nenhuma questão válida encontrada em questoes.json.");
    return { itens: [], imagens: new Map(), comImagem: 0, semImagem: 0, erros };
  }

  // Indexa as imagens do ZIP pelo nome do arquivo
  const disponiveis = new Map<string, JSZip.JSZipObject>();
  for (const [caminho, entrada] of Object.entries(zip.files)) {
    if (entrada.dir) continue;
    const nome = caminho.split("/").pop()!;
    if (!nome || nome.toLowerCase() === "questoes.json") continue;
    disponiveis.set(nome.toLowerCase(), entrada);
  }

  const imagens = new Map<string, Blob>();
  let comImagem = 0;
  for (let i = 0; i < itens.length; i++) {
    const ref = itens[i]!.imagem?.trim();
    if (!ref) continue;
    comImagem++;
    const rotulo = `Questão ${i + 1}`;
    if (!nomeSeguro(ref)) {
      erros.push(`${rotulo}: nome de imagem inválido (${ref}).`);
      continue;
    }
    const nomeArquivo = ref.split("/").pop()!.toLowerCase();
    const extensao = (nomeArquivo.split(".").pop() ?? "").toLowerCase();
    if (!EXTENSOES_OK.includes(extensao)) {
      erros.push(`${rotulo}: formato de imagem não aceito (${ref}). Use png, jpg, jpeg ou webp.`);
      continue;
    }
    const entrada = disponiveis.get(nomeArquivo);
    if (!entrada) {
      erros.push(`${rotulo}: imagem ${ref} não encontrada no ZIP.`);
      continue;
    }
    if (!imagens.has(nomeArquivo)) {
      const blob = await entrada.async("blob");
      if (blob.size > TAMANHO_MAX_IMAGEM) {
        erros.push(`${rotulo}: a imagem ${ref} passa de 8 MB.`);
        continue;
      }
      if (!(await tipoRealValido(blob, extensao))) {
        erros.push(`${rotulo}: o arquivo ${ref} não é uma imagem ${extensao} válida.`);
        continue;
      }
      imagens.set(nomeArquivo, blob);
    }
    itens[i]!.imagem = nomeArquivo;
  }

  return { itens, imagens, comImagem, semImagem: itens.length - comImagem, erros };
}
