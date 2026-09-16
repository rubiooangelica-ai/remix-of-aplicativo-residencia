import { MATERIAL_CRESCIMENTO_DESENVOLVIMENTO } from "@/data/material-crescimento-desenvolvimento";
import type { Taxonomia } from "@/lib/banco";
import type { Material } from "@/lib/conteudo";

function normalizarNome(valor: string) {
  return valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

const ALIAS_ASSUNTO_POR_TITULO: Record<string, string> = {
  [normalizarNome("Puericultura e Crescimento")]: "Crescimento e Desenvolvimento",
};

export function ordenarMateriais(materiais: Material[]) {
  return [...materiais].sort((a, b) => a.titulo.localeCompare(b.titulo, "pt-BR"));
}

function incluirMateriaisLocais(materiais: Material[]) {
  const resultado = [...materiais];
  const locais = [MATERIAL_CRESCIMENTO_DESENVOLVIMENTO];

  for (const local of locais) {
    const indiceExistente = resultado.findIndex(
      (material) =>
        material.id === local.id || normalizarNome(material.titulo) === normalizarNome(local.titulo),
    );

    // A versão local é a apostila editorial atual e deve prevalecer sobre rascunhos/versões antigas do banco.
    if (indiceExistente >= 0) resultado[indiceExistente] = local;
    else resultado.push(local);
  }

  return resultado;
}

/** Preenche área/especialidade/assunto dos materiais sem vínculo, casando título ou alias editorial com a taxonomia existente. */
export function vincularMateriaisNaTaxonomiaExistente(
  materiais: Material[],
  taxonomia: Taxonomia | undefined,
): Material[] {
  const materiaisComLocais = incluirMateriaisLocais(materiais);
  if (!taxonomia) return materiaisComLocais;

  const assuntosPorNome = new Map(
    taxonomia.assuntos.map((assunto) => [normalizarNome(assunto.nome), assunto]),
  );
  const especialidadesPorId = new Map(
    taxonomia.especialidades.map((especialidade) => [especialidade.id, especialidade]),
  );

  return materiaisComLocais.map((material) => {
    if (material.assuntoId || material.especialidadeId || material.areaId) return material;

    const tituloNormalizado = normalizarNome(material.titulo);
    const nomeAssunto = ALIAS_ASSUNTO_POR_TITULO[tituloNormalizado] ?? material.titulo;
    const assunto = assuntosPorNome.get(normalizarNome(nomeAssunto));
    if (!assunto) return material;

    const especialidade = especialidadesPorId.get(assunto.especialidade_id);
    return {
      ...material,
      assuntoId: assunto.id,
      especialidadeId: assunto.especialidade_id,
      areaId: especialidade?.area_id ?? null,
    };
  });
}
