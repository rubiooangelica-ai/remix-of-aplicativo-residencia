import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CheckCircle2, FileUp, Loader2, ShieldCheck } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { useSessao } from "@/lib/auth";
import { useEhAdmin, uploadImagemQuestao } from "@/lib/admin";
import {
  buscarTaxonomia,
  importarQuestoesDetalhado,
  type QuestaoImportada,
} from "@/lib/banco";
import { parseImportacao } from "@/lib/parse-questoes";
import { lerPacoteZip, type PacoteZip } from "@/lib/importar-zip";
import { classificarQuestoes } from "@/lib/classificar.functions";

export const Route = createFileRoute("/importar")({
  head: () => ({
    meta: [
      { title: "Importar banco de questões — ResidênciaPro" },
      {
        name: "description",
        content:
          "Suba seu acervo de questões de residência médica em CSV, JSON ou ZIP com imagens e organize automaticamente por especialidade e assunto.",
      },
      { property: "og:title", content: "Importar banco de questões de residência" },
      {
        property: "og:description",
        content: "CSV, JSON ou ZIP com imagens: as questões entram organizadas por área, especialidade e assunto.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ImportarPage,
});

const exemplo = `area,especialidade,assunto,banca,ano,enunciado,a,b,c,d,correta,comentario
Clínica Médica,Cardiologia,Insuficiência cardíaca,USP,2025,"Paciente com dispneia...","Opção A","Opção B","Opção C","Opção D",B,"Comentário do gabarito"`;

const exemploZip = `prova.zip
├── questoes.json
└── imagens/
    ├── q12.png
    └── q22.jpg`;

const LOTE_CLASSIFICACAO = 20;

type Resultado = { total: number; imagensEnviadas: number; imagensTotal: number; falhas: string[] };

function ImportarPage() {
  const { usuario, carregando } = useSessao();
  const { ehAdmin } = useEhAdmin();
  const queryClient = useQueryClient();
  const classificar = useServerFn(classificarQuestoes);
  const [texto, setTexto] = useState("");
  const [pacote, setPacote] = useState<PacoteZip | null>(null);
  const [nomeZip, setNomeZip] = useState<string | null>(null);
  const [lendoZip, setLendoZip] = useState(false);
  const [erroArquivo, setErroArquivo] = useState<string | null>(null);
  const [feito, setFeito] = useState<Resultado | null>(null);
  const [etapaImportacao, setEtapaImportacao] = useState<string | null>(null);

  const previa = useMemo(
    () => (pacote ? { itens: pacote.itens, erros: pacote.erros } : texto.trim() ? parseImportacao(texto) : null),
    [texto, pacote],
  );
  const semClassificacao =
    previa?.itens.filter((it) => !it.area || !it.especialidade || !it.assunto).length ?? 0;
  const bloqueadoPorErroZip = !!pacote && pacote.erros.length > 0;

  const importar = useMutation({
    mutationFn: async (): Promise<Resultado> => {
      if (!usuario) throw new Error("Faça login para importar.");
      if (bloqueadoPorErroZip) throw new Error("Corrija os problemas do ZIP antes de importar.");

      setEtapaImportacao("Preparando arquivo...");
      const itens = pacote ? pacote.itens : parseImportacao(texto).itens;
      if (!itens.length) throw new Error("Nenhuma questão válida encontrada.");

      const paraClassificar = itens.filter((it) => !it.area || !it.especialidade || !it.assunto);
      if (paraClassificar.length) {
        setEtapaImportacao(`Classificando ${paraClassificar.length} questão(ões) por especialidade e assunto...`);
        const tax = await buscarTaxonomia();
        const linhasTax = tax.assuntos.map((s) => {
          const esp = tax.especialidades.find((e) => e.id === s.especialidade_id);
          const area = esp ? tax.areas.find((a) => a.id === esp.area_id) : undefined;
          return `${area?.nome ?? "?"} > ${esp?.nome ?? "?"} > ${s.nome}`;
        });
        for (let i = 0; i < paraClassificar.length; i += LOTE_CLASSIFICACAO) {
          const lote = paraClassificar.slice(i, i + LOTE_CLASSIFICACAO);
          const { classificacoes } = await classificar({
            data: { enunciados: lote.map((it) => it.enunciado), taxonomia: linhasTax },
          });
          lote.forEach((it, idx) => {
            const c = classificacoes[idx];
            if (!c) return;
            it.area = it.area ?? c.area;
            it.especialidade = it.especialidade ?? c.especialidade;
            it.assunto = it.assunto ?? c.assunto;
          });
        }
      }

      setEtapaImportacao("Criando questões...");
      const prontos = itens.filter((it): it is QuestaoImportada & { area: string } => !!it.area);
      if (!prontos.length) throw new Error("Não foi possível classificar nenhuma questão.");
      const { total, ids } = await importarQuestoesDetalhado(prontos, usuario.id, { publica: ehAdmin });

      // Envia as imagens do ZIP, uma a uma, usando o ID real de cada questão criada.
      const falhas: string[] = [];
      let enviadas = 0;
      const comImagem = pacote
        ? prontos
            .map((item, idx) => ({ item, id: ids[idx], indice: idx }))
            .filter((p) => !!p.item.imagem && !!p.id)
        : [];
      for (let i = 0; i < comImagem.length; i++) {
        const { item, id, indice } = comImagem[i]!;
        setEtapaImportacao(`Enviando imagens ${i + 1}/${comImagem.length}...`);
        const blob = pacote!.imagens.get(item.imagem!);
        if (!blob) {
          falhas.push(`Questão ${indice + 1}: imagem ${item.imagem} não encontrada no ZIP.`);
          continue;
        }
        try {
          const url = await uploadImagemQuestao(id!, blob, item.imagem!);
          const { error } = await supabase.from("questoes").update({ imagem_url: url }).eq("id", id!);
          if (error) throw new Error(error.message);
          enviadas++;
        } catch (e) {
          falhas.push(`Questão ${indice + 1} (${item.imagem}): ${(e as Error).message}`);
        }
      }

      setEtapaImportacao("Finalizando...");
      return { total, imagensEnviadas: enviadas, imagensTotal: comImagem.length, falhas };
    },
    onSuccess: (resultado) => {
      setFeito(resultado);
      setTexto("");
      setPacote(null);
      setNomeZip(null);
      setEtapaImportacao(null);
      queryClient.invalidateQueries();
    },
    onError: () => setEtapaImportacao(null),
  });

  async function arquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setFeito(null);
    setErroArquivo(null);
    if (file.name.toLowerCase().endsWith(".zip")) {
      setTexto("");
      setLendoZip(true);
      try {
        const lido = await lerPacoteZip(file);
        setPacote(lido);
        setNomeZip(file.name);
      } catch (err) {
        setPacote(null);
        setNomeZip(null);
        setErroArquivo(`Não foi possível abrir o ZIP: ${(err as Error).message}`);
      } finally {
        setLendoZip(false);
      }
      return;
    }
    setPacote(null);
    setNomeZip(null);
    setTexto(await file.text());
  }

  return (
    <AppShell
      titulo="Importar questões"
      descricao={
        ehAdmin
          ? "Envie seu acervo em CSV, JSON ou ZIP com imagens. Área, especialidade e assunto podem ficar em branco — a IA classifica automaticamente. Como você é administrador, essas questões ficam visíveis para todos os usuários do app."
          : "Envie seu acervo em CSV, JSON ou ZIP com imagens. Área, especialidade e assunto podem ficar em branco — a IA classifica automaticamente. As questões ficam visíveis só para você."
      }
    >
      {!carregando && !usuario ? (
        <div className="rounded-2xl border border-border/60 bg-card p-5">
          <p className="text-sm text-muted-foreground">
            Você precisa estar logado para importar e guardar seu banco de questões.
          </p>
          <Link
            to="/auth"
            className="mt-4 block rounded-xl bg-primary px-4 py-3 text-center text-sm font-semibold text-primary-foreground"
          >
            Entrar ou criar conta
          </Link>
        </div>
      ) : null}

      {ehAdmin ? (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-xs font-medium text-primary">
          <ShieldCheck className="size-4" />
          Como administrador, essas questões entram públicas para todos os usuários.
        </div>
      ) : null}

      <section className="mt-4 rounded-2xl border border-border/60 bg-card p-5">
        <h2 className="text-base font-semibold">1. Escolha o arquivo ou cole o conteúdo</h2>
        <label className="mt-3 flex cursor-pointer items-center gap-2 rounded-xl border border-dashed border-border/70 px-4 py-3 text-sm text-muted-foreground">
          <FileUp className="size-4" />
          Selecionar arquivo .csv, .json, .txt ou .zip
          <input type="file" accept=".csv,.json,.txt,.zip" onChange={arquivo} className="hidden" />
        </label>

        {lendoZip ? (
          <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" /> Lendo o ZIP e conferindo as imagens...
          </p>
        ) : null}

        {erroArquivo ? (
          <p className="mt-3 rounded-xl border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
            {erroArquivo}
          </p>
        ) : null}

        {pacote ? (
          <div className="mt-3 space-y-1 rounded-xl border border-border/60 bg-surface p-3 text-xs">
            <p className="font-medium text-foreground">{nomeZip}</p>
            <p className="text-muted-foreground">{pacote.itens.length} questões detectadas</p>
            <p className="text-muted-foreground">{pacote.comImagem} questões possuem imagem</p>
            <p className="text-muted-foreground">{pacote.semImagem} questões sem imagem</p>
          </div>
        ) : (
          <textarea
            value={texto}
            onChange={(e) => {
              setTexto(e.target.value);
              setFeito(null);
            }}
            rows={8}
            placeholder={exemplo}
            className="mt-3 w-full rounded-xl border border-border/70 bg-surface p-3 font-mono text-[11px] leading-relaxed text-foreground outline-none focus:border-primary"
          />
        )}

        {previa ? (
          <div className="mt-3 space-y-2 text-xs">
            <p className="text-muted-foreground">
              {previa.itens.length} questão(ões) válida(s) detectada(s)
              {previa.erros.length ? ` · ${previa.erros.length} com problema` : ""}
              {semClassificacao ? ` · ${semClassificacao} sem área (serão classificadas por IA)` : ""}.
            </p>
            {previa.erros.slice(0, 8).map((e) => (
              <p key={e} className="rounded-lg border border-destructive/40 bg-destructive/10 p-2 text-destructive">
                {e}
              </p>
            ))}
            {previa.erros.length > 8 ? (
              <p className="text-muted-foreground">e mais {previa.erros.length - 8} problema(s).</p>
            ) : null}
          </div>
        ) : null}

        <button
          onClick={() => importar.mutate()}
          disabled={!usuario || importar.isPending || !previa?.itens.length || bloqueadoPorErroZip}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
        >
          {importar.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          {ehAdmin ? "Importar e publicar para todos" : "Importar para o meu banco"}
        </button>

        {bloqueadoPorErroZip ? (
          <p className="mt-3 text-xs text-destructive">
            A importação só começa depois que todos os problemas acima forem corrigidos no ZIP.
          </p>
        ) : null}

        {importar.isPending && etapaImportacao ? (
          <p className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="size-3.5 animate-spin" /> {etapaImportacao}
          </p>
        ) : null}

        {importar.isError ? (
          <p className="mt-3 rounded-xl border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
            {(importar.error as Error).message}
          </p>
        ) : null}
        {feito ? (
          <div className="mt-3 space-y-2 text-xs">
            <p className="flex items-center gap-2 rounded-xl border border-success/50 bg-success/10 p-3 text-success">
              <CheckCircle2 className="size-4" />
              {feito.total} questão(ões) importada(s) com sucesso.
              {feito.imagensTotal
                ? ` ${feito.imagensEnviadas}/${feito.imagensTotal} imagens enviadas e associadas.`
                : ""}
            </p>
            {feito.falhas.map((f) => (
              <p key={f} className="rounded-lg border border-destructive/40 bg-destructive/10 p-2 text-destructive">
                {f}
              </p>
            ))}
          </div>
        ) : null}
      </section>

      <section className="mt-6 rounded-2xl border border-border/60 bg-surface p-5 text-sm text-muted-foreground">
        <h2 className="text-base font-semibold text-foreground">Formato aceito</h2>
        <p className="mt-2 font-medium text-foreground">1. CSV, JSON ou TXT (sem imagens)</p>
        <p className="mt-1">
          CSV com cabeçalho ou JSON (lista de objetos). Colunas reconhecidas:{" "}
          <span className="text-foreground">
            area, especialidade, assunto, banca, ano, enunciado, a, b, c, d, e, correta, comentario
          </span>
          . Sinônimos como <em>tema</em>, <em>gabarito</em> e <em>explicacao</em> também funcionam. Se você
          deixar <span className="text-foreground">area</span> (e opcionalmente especialidade/assunto) em
          branco, a IA classifica automaticamente com base no que já existe no banco.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-xl border border-border/60 bg-card p-3 font-mono text-[11px] text-foreground/80">
          {exemplo}
        </pre>

        <p className="mt-5 font-medium text-foreground">2. ZIP com imagens</p>
        <p className="mt-1">
          Um arquivo .zip contendo <span className="text-foreground">questoes.json</span> e uma pasta{" "}
          <span className="text-foreground">imagens/</span>. Em cada questão, o campo opcional{" "}
          <span className="text-foreground">imagem</span> (ou imagem_url, image, image_url) aponta para o nome
          do arquivo dentro da pasta. Formatos aceitos: png, jpg, jpeg e webp (até 8 MB cada). As imagens são
          enviadas depois que as questões são criadas e ficam associadas a cada questão.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-xl border border-border/60 bg-card p-3 font-mono text-[11px] text-foreground/80">
          {exemploZip}
        </pre>
      </section>
    </AppShell>
  );
}
