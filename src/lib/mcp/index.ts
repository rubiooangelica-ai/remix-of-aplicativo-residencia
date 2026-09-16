import { auth, defineMcp } from "@lovable.dev/mcp-js";
import buscarQuestoes from "./tools/buscar-questoes";
import obterQuestao from "./tools/obter-questao";
import listarTemas from "./tools/listar-temas";
import meuDesempenho from "./tools/meu-desempenho";
import criarFlashcard from "./tools/criar-flashcard";
import editarQuestao from "./tools/editar-questao";
import estatisticasTaxonomia from "./tools/estatisticas-taxonomia";
import reclassificarQuestao from "./tools/reclassificar-questao";
import listarSchema from "./tools/listar-schema";
import consultarSql from "./tools/consultar-sql";
import executarSql from "./tools/executar-sql";
import reclassificarLote from "./tools/reclassificar-lote";

const projectRef = import.meta.env['VITE_SUPABASE_PROJECT_ID'] ?? "project-ref-unset";

export default defineMcp({
  name: "aplicativo-residencia",
  title: "Aplicativo residencia",
  version: "0.1.0",
  instructions:
  "Ferramentas do ResidênciaPro, app de estudos para residência médica. Use buscar_questoes (texto, banca, ano, área, tema, assunto, apenas_com_imagem) e obter_questao para consultar o banco, listar_temas e estatisticas_taxonomia para dimensionar e navegar pela organização atual, reclassificar_questao para corrigir a classificação (área/tema/assunto) de uma questão, meu_desempenho para estatísticas da pessoa autenticada, criar_flashcard para salvar flashcards pessoais e editar_questao para corrigir o enunciado. Antes de reclassificar, leia a questão com obter_questao. Para investigar e corrigir o banco (somente contas administradoras): listar_schema mostra tabelas, colunas e chaves; consultar_sql roda apenas SELECT/WITH; executar_sql roda um INSERT/UPDATE/DELETE nas tabelas do aplicativo; reclassificar_questoes_em_lote atualiza muitas questões de uma vez. Prefira reclassificar_questoes_em_lote a executar_sql para corrigir classificação.",
  auth: auth.oauth.issuer({
    issuer: `https://${projectRef}.supabase.co/auth/v1`,
    acceptedAudiences: "authenticated",
  }),
 tools: [
  buscarQuestoes,
  obterQuestao,
  listarTemas,
  estatisticasTaxonomia,
  meuDesempenho,
  criarFlashcard,
  editarQuestao,
  reclassificarQuestao,
  listarSchema,
  consultarSql,
  executarSql,
  reclassificarLote,
],
});
