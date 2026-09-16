import { useCallback, useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Cropper from "react-easy-crop";
import { Crop, ImagePlus, Search, Trash2, X } from "lucide-react";
import {
  editarQuestaoAdmin,
  excluirQuestaoAdmin,
  registrarEdicaoQuestao,
  removerImagemDoStorage,
  uploadImagemQuestao,
} from "@/lib/admin";
import { recortarImagem, type AreaRecorte } from "@/lib/recortar-imagem";
import { useSessao } from "@/lib/auth";
import {
  buscarTaxonomia,
  criarArea,
  criarEspecialidade,
  criarAssunto,
  criarSubassunto,
  type Alternativa,
  type QuestaoDb,
} from "@/lib/banco";

const NOVO = "__novo__";
const LETRAS = ["A", "B", "C", "D", "E"] as const;

function normalizarBusca(texto: string) {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

export function EditarQuestaoAdmin({
  questao,
  onFechar,
}: {
  questao: QuestaoDb;
  onFechar: () => void;
}) {
  const queryClient = useQueryClient();
  const { usuario } = useSessao();
  const [banca, setBanca] = useState(questao.banca ?? "");
  const [ano, setAno] = useState(questao.ano ? String(questao.ano) : "");
  const [comentario, setComentario] = useState(questao.comentario ?? "");
  const [correta, setCorreta] = useState(questao.correta);
  const [anulada, setAnulada] = useState(questao.anulada ?? false);
  const [desatualizada, setDesatualizada] = useState(questao.desatualizada ?? false);
  const [enunciado, setEnunciado] = useState(questao.enunciado);
  const [textosAlternativas, setTextosAlternativas] = useState<Record<string, string>>(() => {
    const base: Record<string, string> = {};
    for (const letra of LETRAS) base[letra] = "";
    for (const alt of questao.alternativas ?? []) {
      base[alt.letra.trim().toUpperCase()] = alt.texto;
    }
    return base;
  });

  const [imagemArquivo, setImagemArquivo] = useState<File | Blob | null>(null);
  const [imagemPreview, setImagemPreview] = useState<string | null>(questao.imagem_url ?? null);
  const inputImagemRef = useRef<HTMLInputElement>(null);
  const [confirmarExclusao, setConfirmarExclusao] = useState(false);

  // Recorte
  const [recorteSrc, setRecorteSrc] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [posicao, setPosicao] = useState({ x: 0, y: 0 });
  const [areaRecorte, setAreaRecorte] = useState<AreaRecorte | null>(null);
  const [erroRecorte, setErroRecorte] = useState<string | null>(null);
  const onRecorteCompleto = useCallback((_: unknown, pixels: AreaRecorte) => setAreaRecorte(pixels), []);

  const tax = useQuery({ queryKey: ["taxonomia"], queryFn: buscarTaxonomia });

  const [areaSel, setAreaSel] = useState(questao.area_id);
  const [areaNovo, setAreaNovo] = useState("");
  const [espSel, setEspSel] = useState(questao.especialidade_id ?? "");
  const [espNovo, setEspNovo] = useState("");
  const [assSel, setAssSel] = useState(questao.assunto_id ?? "");
  const [assNovo, setAssNovo] = useState("");
  const [buscaTema, setBuscaTema] = useState("");
  const [subSel, setSubSel] = useState((questao as { subassunto_id?: string | null }).subassunto_id ?? "");
  const [subNovo, setSubNovo] = useState("");

  const alternativasEditadas: Alternativa[] = LETRAS.map((letra) => ({
    letra,
    texto: (textosAlternativas[letra] ?? "").trim(),
  })).filter((alt) => alt.texto.length > 0);

  const excluir = useMutation({
    mutationFn: () => excluirQuestaoAdmin({ id: questao.id, imagem_url: questao.imagem_url }),
    onSuccess: () => {
      queryClient.setQueriesData<QuestaoDb[]>(
        {
          predicate: (query) => {
            const chave = query.queryKey[0];
            return chave === "questoes-sessao" || chave === "questoes-retomada";
          },
        },
        (old) => old?.filter((q) => q.id !== questao.id),
      );
      queryClient.invalidateQueries({ queryKey: ["contagens"] });
      queryClient.invalidateQueries({ queryKey: ["contagens-filtradas"] });
      onFechar();
    },
  });

  async function aplicarRecorte() {
    if (!recorteSrc || !areaRecorte) return;
    setErroRecorte(null);
    try {
      const blob = await recortarImagem(recorteSrc, areaRecorte);
      setImagemArquivo(blob);
      setImagemPreview(URL.createObjectURL(blob));
      setRecorteSrc(null);
    } catch (e) {
      setErroRecorte((e as Error).message);
    }
  }

  const especialidadesDaArea = useMemo(
    () => (tax.data?.especialidades ?? []).filter((e) => e.area_id === areaSel),
    [tax.data, areaSel],
  );
  const assuntosDaEspecialidade = useMemo(
    () => (tax.data?.assuntos ?? []).filter((s) => s.especialidade_id === espSel),
    [tax.data, espSel],
  );
  const subassuntosDoAssunto = useMemo(
    () => (tax.data?.subassuntos ?? []).filter((s) => s.assunto_id === assSel),
    [tax.data, assSel],
  );
  const temasEncontrados = useMemo(() => {
    const termo = normalizarBusca(buscaTema.trim());
    if (!termo) return [];
    return (tax.data?.assuntos ?? [])
      .filter((assunto) => normalizarBusca(assunto.nome).includes(termo))
      .slice(0, 12);
  }, [tax.data, buscaTema]);

  function selecionarTemaEncontrado(assuntoId: string) {
    const assunto = tax.data?.assuntos.find((item) => item.id === assuntoId);
    if (!assunto) return;
    const especialidade = tax.data?.especialidades.find((item) => item.id === assunto.especialidade_id);
    if (!especialidade) return;

    setAreaSel(especialidade.area_id);
    setEspSel(especialidade.id);
    setAssSel(assunto.id);
    setSubSel("");
    setBuscaTema("");
  }

  const salvar = useMutation({
    mutationFn: async () => {
      let areaIdFinal = areaSel;
      if (areaSel === NOVO) {
        if (!areaNovo.trim()) throw new Error("Digite o nome da nova área.");
        areaIdFinal = await criarArea(areaNovo.trim());
      }

      let espIdFinal: string | null = espSel || null;
      if (espSel === NOVO) {
        if (!espNovo.trim()) throw new Error("Digite o nome da nova especialidade.");
        espIdFinal = await criarEspecialidade(areaIdFinal, espNovo.trim());
      }

      let assIdFinal: string | null = assSel || null;
      if (assSel === NOVO) {
        if (!assNovo.trim()) throw new Error("Digite o nome do novo tema.");
        if (!espIdFinal) throw new Error("Escolha ou crie uma especialidade antes de criar um tema.");
        assIdFinal = await criarAssunto(espIdFinal, assNovo.trim());
      }

      let subIdFinal: string | null = subSel || null;
      if (subSel === NOVO) {
        if (!subNovo.trim()) throw new Error("Digite o nome do novo subtema.");
        if (!assIdFinal) throw new Error("Escolha ou crie um tema antes de criar um subtema.");
        subIdFinal = await criarSubassunto(assIdFinal, subNovo.trim());
      }

      if (!enunciado.trim()) throw new Error("O enunciado não pode ficar vazio.");
      const letraCorreta = correta.trim().toUpperCase().slice(0, 1);
      if (
        alternativasEditadas.length &&
        !alternativasEditadas.some((a) => a.letra.toUpperCase() === letraCorreta)
      ) {
        throw new Error(`O gabarito "${letraCorreta}" não corresponde a nenhuma alternativa preenchida.`);
      }

      let imagemUrlFinal = questao.imagem_url ?? null;
      if (imagemArquivo) {
        imagemUrlFinal = await uploadImagemQuestao(questao.id, imagemArquivo);
      } else if (imagemPreview === null) {
        imagemUrlFinal = null;
      }

      const dados = {
        id: questao.id,
        banca: banca.trim() || null,
        ano: ano.trim() ? Number(ano) : null,
        comentario: comentario.trim() || null,
        correta: letraCorreta,
        anulada,
        desatualizada,
        area_id: areaIdFinal,
        especialidade_id: espIdFinal,
        assunto_id: assIdFinal,
        subassunto_id: subIdFinal,
        imagem_url: imagemUrlFinal,
        enunciado: enunciado.trim(),
        alternativas: alternativasEditadas,
      };
      await editarQuestaoAdmin(dados);

      // Imagem antiga trocada ou removida: apaga o arquivo órfão do Storage.
      const antiga = questao.imagem_url ?? null;
      if (antiga && antiga !== imagemUrlFinal) {
        try {
          await removerImagemDoStorage(antiga);
        } catch {
          // nada a fazer — não deve impedir o salvamento
        }
      }

      const alteracoes: Record<string, { de: unknown; para: unknown }> = {};
      const add = (campo: string, de: unknown, para: unknown) => {
        if (de !== para) alteracoes[campo] = { de: de ?? "—", para: para ?? "—" };
      };
      add("banca", questao.banca, dados.banca);
      add("ano", questao.ano, dados.ano);
      add("gabarito", questao.correta, dados.correta);
      add("anulada", questao.anulada ?? false, dados.anulada);
      add("desatualizada", questao.desatualizada ?? false, dados.desatualizada);
      if ((questao.imagem_url ?? null) !== dados.imagem_url) {
        alteracoes["imagem"] = {
          de: questao.imagem_url ? "com imagem" : "sem imagem",
          para: dados.imagem_url ? "com imagem" : "sem imagem",
        };
      }
      if ((questao.comentario ?? "") !== (dados.comentario ?? "")) {
        alteracoes["comentario"] = {
          de: questao.comentario ? "preenchido" : "vazio",
          para: dados.comentario ? "preenchido" : "vazio",
        };
      }
      if (questao.enunciado !== dados.enunciado) {
        alteracoes["enunciado"] = { de: "texto anterior", para: "texto editado" };
      }
      const antes = (questao.alternativas ?? []).map((a) => `${a.letra}) ${a.texto}`).join(" | ");
      const depois = dados.alternativas.map((a) => `${a.letra}) ${a.texto}`).join(" | ");
      if (antes !== depois) {
        alteracoes["alternativas"] = { de: "versão anterior", para: "versão editada" };
      }
      const nomeArea = (id?: string | null) => tax.data?.areas.find((a) => a.id === id)?.nome ?? "—";
      const nomeEsp = (id?: string | null) => tax.data?.especialidades.find((e) => e.id === id)?.nome ?? "—";
      const nomeAss = (id?: string | null) => tax.data?.assuntos.find((a) => a.id === id)?.nome ?? "—";
      const nomeSub = (id?: string | null) => tax.data?.subassuntos.find((s) => s.id === id)?.nome ?? "—";
      if (questao.area_id !== areaIdFinal) {
        alteracoes["tema (área)"] = { de: nomeArea(questao.area_id), para: nomeArea(areaIdFinal) };
      }
      if ((questao.especialidade_id ?? null) !== espIdFinal) {
        alteracoes["especialidade"] = { de: nomeEsp(questao.especialidade_id), para: nomeEsp(espIdFinal) };
      }
      if ((questao.assunto_id ?? null) !== assIdFinal) {
        alteracoes["assunto"] = { de: nomeAss(questao.assunto_id), para: nomeAss(assIdFinal) };
      }
      const subassuntoAntigo = (questao as { subassunto_id?: string | null }).subassunto_id ?? null;
      if (subassuntoAntigo !== subIdFinal) {
        alteracoes["subtema"] = { de: nomeSub(subassuntoAntigo), para: nomeSub(subIdFinal) };
      }

      if (usuario && Object.keys(alteracoes).length) {
        await registrarEdicaoQuestao({
          questaoId: questao.id,
          editadoPor: usuario.id,
          editadoPorEmail: usuario.email ?? "desconhecido",
          enunciadoResumo: questao.enunciado.slice(0, 100),
          alteracoes,
        });
      }

      return dados;
    },

    onSuccess: (dados) => {
      // Em vez de recarregar a lista inteira da sessão (o que embaralharia a
      // ordem de novo), atualiza só essa questão nos dados já carregados.
      queryClient.setQueriesData<QuestaoDb[]>(
        {
          predicate: (query) => {
            const chave = query.queryKey[0];
            return chave === "questoes-sessao" || chave === "questoes-retomada";
          },
        },
        (old) =>
          old?.map((q) =>
            q.id === dados.id
              ? {
                  ...q,
                  banca: dados.banca,
                  ano: dados.ano,
                  comentario: dados.comentario,
                  correta: dados.correta,
                  anulada: dados.anulada,
                  desatualizada: dados.desatualizada,
                  area_id: dados.area_id,
                  especialidade_id: dados.especialidade_id,
                  assunto_id: dados.assunto_id,
                  imagem_url: dados.imagem_url,
                  enunciado: dados.enunciado,
                  alternativas: dados.alternativas.length ? dados.alternativas : q.alternativas,
                }
              : q,
          ),
      );
      queryClient.invalidateQueries({ queryKey: ["taxonomia"] });
      queryClient.invalidateQueries({ queryKey: ["contagens"] });
      onFechar();
    },
  });

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 sm:items-center">
      <div className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-t-2xl bg-card p-5 sm:rounded-2xl">
        <div className="flex items-center justify-between">
          <p className="font-display text-sm font-semibold">Editar questão (admin)</p>
          <button onClick={onFechar} className="rounded-lg border border-border/60 p-1.5">
            <X className="size-4" />
          </button>
        </div>

        <div className="mt-4 space-y-3">
          <label className="block text-xs font-medium text-muted-foreground">
            Instituição / banca
            <input
              value={banca}
              onChange={(e) => setBanca(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border/70 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>

          <label className="block text-xs font-medium text-muted-foreground">
            Ano
            <input
              value={ano}
              onChange={(e) => setAno(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              className="mt-1 w-full rounded-xl border border-border/70 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>

          <label className="block text-xs font-medium text-muted-foreground">
            Enunciado
            <textarea
              value={enunciado}
              onChange={(e) => setEnunciado(e.target.value)}
              rows={6}
              className="mt-1 w-full resize-y rounded-xl border border-border/70 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>

          <div>
            <p className="text-xs font-medium text-muted-foreground">Alternativas</p>
            <div className="mt-1 space-y-2">
              {LETRAS.map((letra) => (
                <div key={letra} className="flex items-start gap-2">
                  <span className="mt-2 grid size-6 shrink-0 place-items-center rounded-lg bg-primary/15 text-[11px] font-bold text-primary">
                    {letra}
                  </span>
                  <textarea
                    value={textosAlternativas[letra] ?? ""}
                    onChange={(e) =>
                      setTextosAlternativas((v) => ({ ...v, [letra]: e.target.value }))
                    }
                    rows={2}
                    placeholder={letra === "E" ? "Alternativa E (opcional)" : `Alternativa ${letra}`}
                    className="w-full resize-y rounded-xl border border-border/70 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
              ))}
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Deixe em branco para remover uma alternativa.
            </p>
          </div>

          <label className="block text-xs font-medium text-muted-foreground">
            Gabarito (letra correta)
            <select
              value={correta.trim().toUpperCase().slice(0, 1)}
              onChange={(e) => setCorreta(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border/70 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            >
              {LETRAS.map((letra) => (
                <option key={letra} value={letra} disabled={!(textosAlternativas[letra] ?? "").trim()}>
                  {letra}
                  {(textosAlternativas[letra] ?? "").trim() ? "" : " (vazia)"}
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs font-medium text-muted-foreground">
            Comentário / gabarito comentado
            <textarea
              value={comentario}
              onChange={(e) => setComentario(e.target.value)}
              rows={4}
              className="mt-1 w-full resize-none rounded-xl border border-border/70 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            />
          </label>

          <div>
            <p className="text-xs font-medium text-muted-foreground">Imagem da questão (tabela, exame, foto...)</p>
            {imagemPreview ? (
              <div className="mt-2 space-y-2">
                <img
                  src={imagemPreview}
                  alt="Pré-visualização da imagem da questão"
                  className="max-h-48 w-full rounded-xl border border-border/60 object-contain"
                />
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => inputImagemRef.current?.click()}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-border/70 py-2 text-xs font-medium text-foreground"
                  >
                    <ImagePlus className="size-3.5" /> Trocar imagem
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setZoom(1);
                      setPosicao({ x: 0, y: 0 });
                      setAreaRecorte(null);
                      setRecorteSrc(imagemPreview);
                    }}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-xl border border-primary/50 py-2 text-xs font-medium text-primary"
                  >
                    <Crop className="size-3.5" /> Recortar
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setImagemArquivo(null);
                      setImagemPreview(null);
                    }}
                    className="flex items-center justify-center gap-1.5 rounded-xl border border-destructive/50 px-3 py-2 text-xs font-medium text-destructive"
                  >
                    <Trash2 className="size-3.5" /> Remover
                  </button>
                </div>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => inputImagemRef.current?.click()}
                className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border border-dashed border-border/70 py-3 text-xs font-medium text-muted-foreground"
              >
                <ImagePlus className="size-4" /> Adicionar imagem
              </button>
            )}
            <input
              ref={inputImagemRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const arquivo = e.target.files?.[0];
                if (!arquivo) return;
                const url = URL.createObjectURL(arquivo);
                setImagemArquivo(arquivo);
                setImagemPreview(url);
                // Já abre o recorte para escolher só a área útil da questão.
                setZoom(1);
                setPosicao({ x: 0, y: 0 });
                setAreaRecorte(null);
                setRecorteSrc(url);
                e.target.value = "";
              }}
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-medium text-foreground">
            <input type="checkbox" checked={anulada} onChange={(e) => setAnulada(e.target.checked)} />
            Anular questão
          </label>

          <label className="flex items-center gap-2 text-xs font-medium text-foreground">
            <input
              type="checkbox"
              checked={desatualizada}
              onChange={(e) => setDesatualizada(e.target.checked)}
            />
            Marcar como desatualizada
          </label>
        </div>

        <div className="mt-5 border-t border-border/60 pt-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Reclassificar
          </p>

          <label className="mt-3 block text-xs font-medium text-muted-foreground">
            Área
            <select
              value={areaSel}
              onChange={(e) => {
                setAreaSel(e.target.value);
                setEspSel("");
                setAssSel("");
                setSubSel("");
              }}
              className="mt-1 w-full rounded-xl border border-border/70 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            >
              {(tax.data?.areas ?? []).map((a) => (
                <option key={a.id} value={a.id}>
                  {a.nome}
                </option>
              ))}
              <option value={NOVO}>+ Criar nova área...</option>
            </select>
            {areaSel === NOVO ? (
              <input
                value={areaNovo}
                onChange={(e) => setAreaNovo(e.target.value)}
                placeholder="Nome da nova área"
                className="mt-2 w-full rounded-xl border border-border/70 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
              />
            ) : null}
          </label>

          <label className="mt-3 block text-xs font-medium text-muted-foreground">
            Especialidade
            <select
              value={espSel}
              onChange={(e) => {
                setEspSel(e.target.value);
                setAssSel("");
                setSubSel("");
              }}
              className="mt-1 w-full rounded-xl border border-border/70 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="">Nenhuma</option>
              {especialidadesDaArea.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.nome}
                </option>
              ))}
              <option value={NOVO}>+ Criar nova especialidade...</option>
            </select>
            {espSel === NOVO ? (
              <input
                value={espNovo}
                onChange={(e) => setEspNovo(e.target.value)}
                placeholder="Nome da nova especialidade"
                className="mt-2 w-full rounded-xl border border-border/70 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
              />
            ) : null}
          </label>

          <div className="mt-3">
            <label className="block text-xs font-medium text-muted-foreground">
              Pesquisar tema
              <span className="mt-1 flex items-center gap-2 rounded-xl border border-border/70 bg-surface px-3 py-2 focus-within:border-primary">
                <Search className="size-4 shrink-0" />
                <input
                  value={buscaTema}
                  onChange={(e) => setBuscaTema(e.target.value)}
                  placeholder="Ex.: Hanseníase"
                  className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                />
              </span>
            </label>

            {buscaTema.trim() ? (
              <div className="mt-2 max-h-56 overflow-y-auto rounded-xl border border-border/70 bg-surface p-1">
                {temasEncontrados.length ? (
                  temasEncontrados.map((assunto) => {
                    const especialidade = tax.data?.especialidades.find(
                      (item) => item.id === assunto.especialidade_id,
                    );
                    const area = tax.data?.areas.find((item) => item.id === especialidade?.area_id);
                    return (
                      <button
                        key={assunto.id}
                        type="button"
                        onClick={() => selecionarTemaEncontrado(assunto.id)}
                        className="block w-full rounded-lg px-3 py-2 text-left hover:bg-primary/10"
                      >
                        <span className="block text-sm font-medium text-foreground">{assunto.nome}</span>
                        <span className="block text-[11px] text-muted-foreground">
                          {[area?.nome, especialidade?.nome].filter(Boolean).join(" › ")}
                        </span>
                      </button>
                    );
                  })
                ) : (
                  <p className="px-3 py-2 text-xs text-muted-foreground">Nenhum tema encontrado.</p>
                )}
              </div>
            ) : null}
            <p className="mt-1 text-[11px] text-muted-foreground">
              A busca considera todas as áreas e ajusta a especialidade automaticamente.
            </p>
          </div>

          <label className="mt-3 block text-xs font-medium text-muted-foreground">
            Tema
            <select
              value={assSel}
              onChange={(e) => {
                setAssSel(e.target.value);
                setSubSel("");
                setBuscaTema("");
              }}
              className="mt-1 w-full rounded-xl border border-border/70 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="">Nenhum</option>
              {assuntosDaEspecialidade.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
              <option value={NOVO}>+ Criar novo tema...</option>
            </select>
            {assSel === NOVO ? (
              <input
                value={assNovo}
                onChange={(e) => setAssNovo(e.target.value)}
                placeholder="Nome do novo tema"
                className="mt-2 w-full rounded-xl border border-border/70 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
              />
            ) : null}
          </label>

          <label className="mt-3 block text-xs font-medium text-muted-foreground">
            Subtema
            <select
              value={subSel}
              onChange={(e) => setSubSel(e.target.value)}
              className="mt-1 w-full rounded-xl border border-border/70 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
            >
              <option value="">Nenhum</option>
              {subassuntosDoAssunto.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome}
                </option>
              ))}
              <option value={NOVO}>+ Criar novo subtema...</option>
            </select>
            {subSel === NOVO ? (
              <input
                value={subNovo}
                onChange={(e) => setSubNovo(e.target.value)}
                placeholder="Nome do novo subtema"
                className="mt-2 w-full rounded-xl border border-border/70 bg-surface px-3 py-2 text-sm outline-none focus:border-primary"
              />
            ) : null}
          </label>
        </div>

        {salvar.isError ? (
          <p className="mt-3 text-xs text-destructive">{(salvar.error as Error).message}</p>
        ) : null}
        {excluir.isError ? (
          <p className="mt-3 text-xs text-destructive">{(excluir.error as Error).message}</p>
        ) : null}

        <button
          onClick={() => salvar.mutate()}
          disabled={salvar.isPending || excluir.isPending}
          className="mt-5 w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {salvar.isPending ? "Salvando..." : "Salvar alterações"}
        </button>

        {confirmarExclusao ? (
          <div className="mt-3 rounded-xl border border-destructive/50 bg-destructive/10 p-3">
            <p className="text-xs font-medium text-foreground">
              Excluir esta questão definitivamente? A imagem associada também será apagada.
            </p>
            <div className="mt-2 flex gap-2">
              <button
                onClick={() => excluir.mutate()}
                disabled={excluir.isPending}
                className="flex-1 rounded-xl bg-destructive px-3 py-2 text-xs font-semibold text-destructive-foreground disabled:opacity-60"
              >
                {excluir.isPending ? "Excluindo..." : "Sim, excluir"}
              </button>
              <button
                onClick={() => setConfirmarExclusao(false)}
                className="flex-1 rounded-xl border border-border/70 px-3 py-2 text-xs font-semibold text-foreground"
              >
                Cancelar
              </button>
            </div>
          </div>
        ) : (
          <button
            onClick={() => setConfirmarExclusao(true)}
            disabled={salvar.isPending}
            className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-xl border border-destructive/50 px-4 py-2.5 text-xs font-semibold text-destructive disabled:opacity-60"
          >
            <Trash2 className="size-3.5" /> Excluir questão
          </button>
        )}
      </div>

      {recorteSrc ? (
        <div className="fixed inset-0 z-[60] flex flex-col bg-black/90">
          <div className="flex items-center justify-between p-4">
            <p className="text-sm font-semibold text-white">Recortar imagem</p>
            <button onClick={() => setRecorteSrc(null)} className="rounded-lg border border-white/30 p-1.5">
              <X className="size-4 text-white" />
            </button>
          </div>
          <div className="relative flex-1">
            <Cropper
              image={recorteSrc}
              crop={posicao}
              zoom={zoom}
              onCropChange={setPosicao}
              onZoomChange={setZoom}
              onCropComplete={onRecorteCompleto}
              restrictPosition={false}
              objectFit="contain"
            />
          </div>
          {erroRecorte ? <p className="px-4 text-xs text-destructive">{erroRecorte}</p> : null}
          <div className="space-y-3 p-4">
            <input
              type="range"
              min={0.5}
              max={4}
              step={0.05}
              value={zoom}
              onChange={(e) => setZoom(Number(e.target.value))}
              className="w-full"
              aria-label="Zoom da imagem"
            />
            <button
              onClick={aplicarRecorte}
              className="w-full rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground"
            >
              Aplicar recorte
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
