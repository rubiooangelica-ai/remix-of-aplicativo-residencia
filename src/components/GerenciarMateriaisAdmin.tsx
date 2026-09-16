import { useMemo, useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import JSZip from "jszip";
import { FileText, ImagePlus, Pencil, Plus, Save, Trash2, Upload } from "lucide-react";
import { buscarTaxonomia } from "@/lib/banco";
import {
  buscarMateriais,
  criarMaterial,
  editarMaterial,
  enviarImagemMaterial,
  removerMaterial,
  type ImagemMaterial,
  type Material,
  type MaterialStatus,
} from "@/lib/conteudo";
import { useSessao } from "@/lib/auth";

type FormState = {
  id: string | null;
  titulo: string;
  subtitulo: string;
  conteudo: string;
  areaId: string;
  especialidadeId: string;
  assuntoId: string;
  status: MaterialStatus;
  pontosProva: string;
  imagens: ImagemMaterial[];
};

const vazio: FormState = {
  id: null,
  titulo: "",
  subtitulo: "",
  conteudo: "",
  areaId: "",
  especialidadeId: "",
  assuntoId: "",
  status: "rascunho",
  pontosProva: "",
  imagens: [],
};

async function extrairDocx(arquivo: File) {
  const zip = await JSZip.loadAsync(await arquivo.arrayBuffer());
  const xml = await zip.file("word/document.xml")?.async("text");
  if (!xml) throw new Error("Não consegui ler o conteúdo deste DOCX.");

  const relsXml = await zip.file("word/_rels/document.xml.rels")?.async("text");
  const relacoes = new Map<string, string>();
  if (relsXml) {
    const rels = new DOMParser().parseFromString(relsXml, "application/xml");
    Array.from(rels.getElementsByTagName("Relationship")).forEach((rel) => {
      const id = rel.getAttribute("Id");
      const target = rel.getAttribute("Target");
      if (id && target) relacoes.set(id, target);
    });
  }

  const doc = new DOMParser().parseFromString(xml, "application/xml");
  const body = doc.getElementsByTagName("w:body")[0];
  if (!body) throw new Error("DOCX sem corpo de documento.");

  const partes: string[] = [];
  const imagens: ImagemMaterial[] = [];

  for (const node of Array.from(body.childNodes)) {
    if (!(node instanceof Element)) continue;

    if (node.tagName === "w:p") {
      const texto = Array.from(node.getElementsByTagName("w:t"))
        .map((t) => t.textContent ?? "")
        .join("")
        .trim();
      const estilo = node.getElementsByTagName("w:pStyle")[0]?.getAttribute("w:val") ?? "";
      const temLista = node.getElementsByTagName("w:numPr").length > 0;
      let bloco = texto;

      if (/heading1|titulo1|título1/i.test(estilo) && texto) bloco = `# ${texto}`;
      else if (/heading2|titulo2|título2/i.test(estilo) && texto) bloco = `## ${texto}`;
      else if (/heading3|titulo3|título3/i.test(estilo) && texto) bloco = `### ${texto}`;
      else if (temLista && texto) bloco = `- ${texto}`;
      if (bloco) partes.push(bloco);

      for (const blip of Array.from(node.getElementsByTagName("a:blip"))) {
        const relId = blip.getAttribute("r:embed");
        const target = relId ? relacoes.get(relId) : null;
        if (!target) continue;
        const caminho = target.startsWith("/") ? target.slice(1) : `word/${target.replace(/^\.\.\//, "")}`;
        const entrada = zip.file(caminho);
        if (!entrada) continue;
        const blob = await entrada.async("blob");
        const nome = caminho.split("/").pop() ?? "imagem.png";
        const file = new File([blob], nome, { type: blob.type || "image/png" });
        const url = await enviarImagemMaterial(file);
        const legenda = texto || nome.replace(/\.[^.]+$/, "");
        imagens.push({ url, legenda, fonte: null, tipo: "autoral" });
        partes.push(`![${legenda}](${url})`);
      }
    }

    if (node.tagName === "w:tbl") {
      const linhas = Array.from(node.getElementsByTagName("w:tr")).map((tr) =>
        Array.from(tr.getElementsByTagName("w:tc")).map((tc) =>
          Array.from(tc.getElementsByTagName("w:t")).map((t) => t.textContent ?? "").join("").trim(),
        ),
      );
      if (linhas.length && linhas[0]?.length) {
        const colunas = Math.max(...linhas.map((l) => l.length));
        const cab = Array.from({ length: colunas }, (_, i) => linhas[0]?.[i] ?? "");
        partes.push(`| ${cab.join(" | ")} |`);
        partes.push(`| ${Array.from({ length: colunas }, () => "---").join(" | ")} |`);
        for (const linha of linhas.slice(1)) {
          partes.push(`| ${Array.from({ length: colunas }, (_, i) => linha[i] ?? "").join(" | ")} |`);
        }
      }
    }
  }

  return { texto: partes.join("\n\n"), imagens };
}

async function lerArquivoMaterial(arquivo: File) {
  const nome = arquivo.name.toLowerCase();
  if (nome.endsWith(".docx")) return extrairDocx(arquivo);
  if (nome.endsWith(".md") || nome.endsWith(".markdown") || nome.endsWith(".txt")) {
    return { texto: await arquivo.text(), imagens: [] as ImagemMaterial[] };
  }
  throw new Error("Formato não suportado. Use .docx, .md ou .txt.");
}

export function GerenciarMateriaisAdmin() {
  const { usuario } = useSessao();
  const queryClient = useQueryClient();
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const [form, setForm] = useState<FormState>(vazio);
  const [modoEditor, setModoEditor] = useState(false);
  const [aba, setAba] = useState<"editar" | "preview">("editar");
  const [legendaImagem, setLegendaImagem] = useState("");
  const [erroLocal, setErroLocal] = useState<string | null>(null);
  const [excluindoId, setExcluindoId] = useState<string | null>(null);

  const tax = useQuery({ queryKey: ["taxonomia"], queryFn: buscarTaxonomia });
  const materiais = useQuery({
    queryKey: ["materiais-admin"],
    queryFn: () => buscarMateriais({ incluirRascunhos: true }),
  });

  const especialidades = useMemo(
    () => (tax.data?.especialidades ?? []).filter((e) => !form.areaId || e.area_id === form.areaId),
    [tax.data, form.areaId],
  );
  const assuntos = useMemo(
    () => (tax.data?.assuntos ?? []).filter((a) => !form.especialidadeId || a.especialidade_id === form.especialidadeId),
    [tax.data, form.especialidadeId],
  );

  async function invalidarMateriais() {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["materiais"] }),
      queryClient.invalidateQueries({ queryKey: ["materiais-admin"] }),
    ]);
  }

  const salvar = useMutation({
    mutationFn: async () => {
      if (!usuario) throw new Error("Sessão não encontrada.");
      if (!form.titulo.trim()) throw new Error("Informe o título.");
      if (!form.areaId || !form.especialidadeId || !form.assuntoId) {
        throw new Error("Selecione Área, Especialidade e Assunto já existentes.");
      }
      if (!form.conteudo.trim()) throw new Error("O resumo está vazio.");

      const input = {
        titulo: form.titulo,
        subtitulo: form.subtitulo || null,
        conteudo: form.conteudo,
        areaId: form.areaId,
        especialidadeId: form.especialidadeId,
        assuntoId: form.assuntoId,
        status: form.status,
        nivel: "residencia" as const,
        origem: "misto" as const,
        imagens: form.imagens,
        pontosProva: form.pontosProva.split("\n").map((x) => x.trim()).filter(Boolean),
      };

      if (form.id) return editarMaterial(form.id, input);
      return criarMaterial({ ...input, criadoPor: usuario.id });
    },
    onSuccess: async () => {
      await invalidarMateriais();
      setForm(vazio);
      setModoEditor(false);
      setErroLocal(null);
    },
  });

  const excluir = useMutation({
    mutationFn: async (material: Material) => {
      setExcluindoId(material.id);
      await removerMaterial(material.id);
      return material.id;
    },
    onSuccess: async (id) => {
      await invalidarMateriais();
      if (form.id === id) {
        setForm(vazio);
        setModoEditor(false);
      }
      setErroLocal(null);
      setExcluindoId(null);
    },
    onError: (erro) => {
      setErroLocal(`Não foi possível excluir o resumo: ${(erro as Error).message}`);
      setExcluindoId(null);
    },
  });

  function confirmarExclusao(material: Material) {
    const confirmou = window.confirm(
      `Excluir permanentemente o resumo "${material.titulo}"?\n\nEsta ação remove o resumo do banco e não pode ser desfeita.`,
    );
    if (confirmou) excluir.mutate(material);
  }

  function editar(material: Material) {
    setForm({
      id: material.id,
      titulo: material.titulo,
      subtitulo: material.subtitulo ?? "",
      conteudo: material.conteudo,
      areaId: material.areaId ?? "",
      especialidadeId: material.especialidadeId ?? "",
      assuntoId: material.assuntoId ?? "",
      status: material.status,
      pontosProva: material.pontosProva.join("\n"),
      imagens: material.imagens,
    });
    setModoEditor(true);
    setAba("editar");
    setErroLocal(null);
  }

  async function importarArquivo(arquivo?: File) {
    if (!arquivo) return;
    try {
      setErroLocal(null);
      const importado = await lerArquivoMaterial(arquivo);
      setForm((f) => ({
        ...f,
        titulo: f.titulo || arquivo.name.replace(/\.(docx|md|markdown|txt)$/i, ""),
        conteudo: importado.texto,
        imagens: [...f.imagens, ...importado.imagens],
      }));
    } catch (e) {
      setErroLocal((e as Error).message);
    }
  }

  function inserirNoCursor(texto: string) {
    const textarea = textareaRef.current;
    if (!textarea) {
      setForm((f) => ({ ...f, conteudo: `${f.conteudo}\n\n${texto}\n` }));
      return;
    }
    const inicio = textarea.selectionStart;
    const fim = textarea.selectionEnd;
    setForm((f) => ({ ...f, conteudo: f.conteudo.slice(0, inicio) + texto + f.conteudo.slice(fim) }));
    requestAnimationFrame(() => {
      textarea.focus();
      const pos = inicio + texto.length;
      textarea.setSelectionRange(pos, pos);
    });
  }

  async function enviarImagem(arquivo?: File) {
    if (!arquivo) return;
    try {
      setErroLocal(null);
      const url = await enviarImagemMaterial(arquivo);
      const legenda = legendaImagem.trim() || arquivo.name.replace(/\.[^.]+$/, "");
      const imagem: ImagemMaterial = { url, legenda, fonte: null, tipo: "autoral" };
      setForm((f) => ({ ...f, imagens: [...f.imagens, imagem] }));
      inserirNoCursor(`\n\n![${legenda}](${url})\n\n`);
      setLegendaImagem("");
    } catch (e) {
      setErroLocal((e as Error).message);
    }
  }

  if (modoEditor) {
    return (
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <button onClick={() => { setModoEditor(false); setForm(vazio); }} className="text-sm font-medium text-muted-foreground">
            ← Voltar para resumos
          </button>
          <div className="flex rounded-xl border border-border/70 bg-surface p-1">
            <button onClick={() => setAba("editar")} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${aba === "editar" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Editar</button>
            <button onClick={() => setAba("preview")} className={`rounded-lg px-3 py-1.5 text-xs font-semibold ${aba === "preview" ? "bg-primary text-primary-foreground" : "text-muted-foreground"}`}>Prévia</button>
          </div>
        </div>

        {aba === "editar" ? (
          <div className="space-y-4">
            <section className="rounded-2xl border border-border/60 bg-card p-4">
              <h3 className="text-sm font-bold">1. Onde este resumo entra</h3>
              <p className="mt-1 text-xs text-muted-foreground">Só é possível escolher itens que já existem. Esta tela não cria nem altera a taxonomia.</p>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <select value={form.areaId} onChange={(e) => setForm((f) => ({ ...f, areaId: e.target.value, especialidadeId: "", assuntoId: "" }))} className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm">
                  <option value="">Área</option>
                  {(tax.data?.areas ?? []).map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
                </select>
                <select value={form.especialidadeId} onChange={(e) => setForm((f) => ({ ...f, especialidadeId: e.target.value, assuntoId: "" }))} className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm" disabled={!form.areaId}>
                  <option value="">Especialidade</option>
                  {especialidades.map((e) => <option key={e.id} value={e.id}>{e.nome}</option>)}
                </select>
                <select value={form.assuntoId} onChange={(e) => setForm((f) => ({ ...f, assuntoId: e.target.value }))} className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm" disabled={!form.especialidadeId}>
                  <option value="">Assunto</option>
                  {assuntos.map((a) => <option key={a.id} value={a.id}>{a.nome}</option>)}
                </select>
              </div>
            </section>

            <section className="rounded-2xl border border-border/60 bg-card p-4">
              <h3 className="text-sm font-bold">2. Título e conteúdo</h3>
              <div className="mt-3 grid gap-3">
                <input value={form.titulo} onChange={(e) => setForm((f) => ({ ...f, titulo: e.target.value }))} placeholder="Título do resumo" className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm" />
                <input value={form.subtitulo} onChange={(e) => setForm((f) => ({ ...f, subtitulo: e.target.value }))} placeholder="Subtítulo / descrição" className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm" />
                <div className="flex flex-wrap gap-2">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-border bg-surface px-3 py-2 text-xs font-semibold">
                    <Upload className="size-4" /> Importar .DOCX / .MD / .TXT
                    <input type="file" accept=".docx,.md,.markdown,.txt" className="hidden" onChange={(e) => void importarArquivo(e.target.files?.[0])} />
                  </label>
                  <button onClick={() => inserirNoCursor("# ")} className="rounded-xl border border-border px-3 py-2 text-xs font-semibold">Título H1</button>
                  <button onClick={() => inserirNoCursor("## ")} className="rounded-xl border border-border px-3 py-2 text-xs font-semibold">H2</button>
                  <button onClick={() => inserirNoCursor("### ")} className="rounded-xl border border-border px-3 py-2 text-xs font-semibold">H3</button>
                  <button onClick={() => inserirNoCursor("> **ATENÇÃO**\n> ")} className="rounded-xl border border-border px-3 py-2 text-xs font-semibold">Caixa destaque</button>
                  <button onClick={() => inserirNoCursor("| Coluna 1 | Coluna 2 |\n|---|---|\n| Dado | Dado |\n")} className="rounded-xl border border-border px-3 py-2 text-xs font-semibold">Tabela</button>
                </div>
                <textarea ref={textareaRef} value={form.conteudo} onChange={(e) => setForm((f) => ({ ...f, conteudo: e.target.value }))} placeholder="Cole ou escreva o resumo em Markdown..." className="min-h-[520px] w-full resize-y rounded-xl border border-border bg-surface px-4 py-3 font-mono text-sm leading-6 outline-none focus:border-primary" />
              </div>
            </section>

            <section className="rounded-2xl border border-border/60 bg-card p-4">
              <h3 className="text-sm font-bold">3. Imagens</h3>
              <p className="mt-1 text-xs text-muted-foreground">Coloque o cursor no ponto do texto onde quer a imagem, escreva uma legenda e selecione o arquivo.</p>
              <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                <input value={legendaImagem} onChange={(e) => setLegendaImagem(e.target.value)} placeholder="Legenda da imagem" className="flex-1 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm" />
                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground">
                  <ImagePlus className="size-4" /> Importar imagem
                  <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={(e) => void enviarImagem(e.target.files?.[0])} />
                </label>
              </div>
              {form.imagens.length ? (
                <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {form.imagens.map((img, i) => (
                    <div key={`${img.url}-${i}`} className="overflow-hidden rounded-xl border border-border bg-surface">
                      <img src={img.url} alt={img.legenda ?? ""} className="aspect-video w-full object-contain" />
                      <div className="p-2">
                        <p className="line-clamp-2 text-[11px] text-muted-foreground">{img.legenda}</p>
                        <button onClick={() => setForm((f) => ({ ...f, imagens: f.imagens.filter((_, idx) => idx !== i) }))} className="mt-2 text-[11px] font-semibold text-destructive">Remover da galeria</button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : null}
            </section>

            <section className="rounded-2xl border border-border/60 bg-card p-4">
              <h3 className="text-sm font-bold">4. Publicação</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <select value={form.status} onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as MaterialStatus }))} className="rounded-xl border border-border bg-surface px-3 py-2.5 text-sm">
                  <option value="rascunho">Rascunho</option><option value="revisao">Em revisão</option><option value="publicado">Publicado</option><option value="arquivado">Arquivado</option>
                </select>
                <textarea value={form.pontosProva} onChange={(e) => setForm((f) => ({ ...f, pontosProva: e.target.value }))} placeholder={"Pontos de prova — um por linha"} className="min-h-24 rounded-xl border border-border bg-surface px-3 py-2.5 text-sm" />
              </div>
            </section>

            {erroLocal ? <p className="text-sm text-destructive">{erroLocal}</p> : null}
            {salvar.isError ? <p className="text-sm text-destructive">{(salvar.error as Error).message}</p> : null}
            <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
              <button onClick={() => salvar.mutate()} disabled={salvar.isPending} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground disabled:opacity-50">
                <Save className="size-4" /> {salvar.isPending ? "Salvando..." : form.id ? "Salvar alterações" : "Criar resumo"}
              </button>
              {form.id ? (
                <button
                  onClick={() => {
                    const material = (materiais.data ?? []).find((m) => m.id === form.id);
                    if (material) confirmarExclusao(material);
                  }}
                  disabled={excluir.isPending}
                  className="flex items-center justify-center gap-2 rounded-xl border border-destructive/50 px-4 py-3 text-sm font-bold text-destructive disabled:opacity-50"
                >
                  <Trash2 className="size-4" /> {excluindoId === form.id ? "Excluindo..." : "Excluir resumo"}
                </button>
              ) : null}
            </div>
          </div>
        ) : <PreviewMaterial form={form} />}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <button onClick={() => { setForm(vazio); setModoEditor(true); }} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-bold text-primary-foreground">
        <Plus className="size-4" /> Adicionar resumo
      </button>

      {erroLocal ? <p className="rounded-xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">{erroLocal}</p> : null}

      <div className="rounded-2xl border border-border/60 bg-card p-4">
        <div className="flex items-center gap-2">
          <FileText className="size-5 text-primary" />
          <div><h3 className="text-sm font-bold">Resumos cadastrados</h3><p className="text-xs text-muted-foreground">Crie, edite ou exclua resumos sem alterar a árvore.</p></div>
        </div>
        <div className="mt-4 space-y-2">
          {(materiais.data ?? []).map((material) => (
            <div key={material.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-surface p-3">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{material.titulo}</p>
                <p className="text-[11px] text-muted-foreground">{material.status} · {material.assuntoId ? "vinculado" : "sem assunto"}</p>
              </div>
              <div className="flex shrink-0 gap-2">
                <button onClick={() => editar(material)} disabled={excluir.isPending} className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-xs font-semibold disabled:opacity-50"><Pencil className="size-3.5" /> Editar</button>
                <button onClick={() => confirmarExclusao(material)} disabled={excluir.isPending} title={`Excluir ${material.titulo}`} className="flex items-center gap-1 rounded-lg border border-destructive/50 px-3 py-2 text-xs font-semibold text-destructive disabled:opacity-50">
                  <Trash2 className="size-3.5" /> {excluindoId === material.id ? "Excluindo..." : "Excluir"}
                </button>
              </div>
            </div>
          ))}
          {!materiais.isLoading && !(materiais.data ?? []).length ? <p className="text-sm text-muted-foreground">Nenhum resumo cadastrado no banco.</p> : null}
        </div>
      </div>
    </div>
  );
}

function PreviewMaterial({ form }: { form: FormState }) {
  return (
    <article className="rounded-2xl border border-border/60 bg-card p-5">
      <h1 className="font-display text-3xl font-bold leading-tight">{form.titulo || "Título do resumo"}</h1>
      {form.subtitulo ? <p className="mt-2 text-base leading-relaxed text-muted-foreground">{form.subtitulo}</p> : null}
      <div className="mt-8 text-[17px] leading-8 text-foreground">
        <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
          h1: ({ children }) => <h1 className="mb-6 mt-10 border-b border-border/70 pb-4 font-display text-3xl font-bold">{children}</h1>,
          h2: ({ children }) => <h2 className="mb-4 mt-10 border-l-4 border-primary pl-4 font-display text-2xl font-bold">{children}</h2>,
          h3: ({ children }) => <h3 className="mb-3 mt-7 font-display text-xl font-bold text-primary">{children}</h3>,
          p: ({ children }) => <p className="my-4 leading-8">{children}</p>,
          ul: ({ children }) => <ul className="my-4 list-disc space-y-2 pl-7 marker:text-primary">{children}</ul>,
          ol: ({ children }) => <ol className="my-4 list-decimal space-y-2 pl-7 marker:text-primary">{children}</ol>,
          blockquote: ({ children }) => <blockquote className="my-6 rounded-xl border-l-4 border-primary bg-primary/10 px-5 py-4 font-medium">{children}</blockquote>,
          table: ({ children }) => <div className="my-6 overflow-x-auto rounded-xl border border-border"><table className="w-full min-w-[640px] border-collapse text-left text-[15px]">{children}</table></div>,
          thead: ({ children }) => <thead className="bg-primary/10">{children}</thead>,
          tr: ({ children }) => <tr className="border-b border-border last:border-b-0">{children}</tr>,
          th: ({ children }) => <th className="border-r border-border px-4 py-3 font-bold last:border-r-0">{children}</th>,
          td: ({ children }) => <td className="border-r border-border px-4 py-3 align-top last:border-r-0">{children}</td>,
          img: ({ src, alt }) => <img src={src} alt={alt ?? ""} className="mx-auto my-6 max-h-[560px] rounded-xl border border-border object-contain" />,
        }}>{form.conteudo || "_A prévia aparecerá aqui._"}</ReactMarkdown>
      </div>
    </article>
  );
}
