import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { CalendarClock, CheckCircle2, FileJson, Loader2, Rocket } from "lucide-react";
import {
  criarSimuladoEnamedAdmin,
  importarQuestoesSimuladoEnamedAdmin,
  listarSimuladosEnamedAdmin,
  publicarSimuladoEnamedAdmin,
  type StatusGabarito,
  type TipoSimulado,
} from "@/lib/simulados-enamed";
import { cn } from "@/lib/utils";

function valorDataLocal(data: Date) {
  const deslocada = new Date(data.getTime() - data.getTimezoneOffset() * 60_000);
  return deslocada.toISOString().slice(0, 16);
}

function janelaPadrao() {
  const agora = new Date();
  const abre = new Date(agora);
  let dias = (7 - abre.getDay()) % 7;
  if (dias === 0 && abre.getHours() >= 10) dias = 7;
  abre.setDate(abre.getDate() + dias);
  abre.setHours(10, 0, 0, 0);
  const fecha = new Date(abre);
  fecha.setHours(22, 0, 0, 0);
  return { abre: valorDataLocal(abre), fecha: valorDataLocal(fecha), gabarito: valorDataLocal(fecha) };
}

export function GerenciarSimuladosEnamed() {
  const qc = useQueryClient();
  const padrao = useMemo(janelaPadrao, []);
  const [titulo, setTitulo] = useState("");
  const [descricao, setDescricao] = useState("");
  const [tipo, setTipo] = useState<TipoSimulado>("semanal");
  const [gratuito, setGratuito] = useState(true);
  const [gabaritoStatus, setGabaritoStatus] = useState<StatusGabarito>("autoral");
  const [abre, setAbre] = useState(padrao.abre);
  const [fecha, setFecha] = useState(padrao.fecha);
  const [gabarito, setGabarito] = useState(padrao.gabarito);
  const [selecionado, setSelecionado] = useState<string | null>(null);
  const [json, setJson] = useState("");
  const [mensagem, setMensagem] = useState<string | null>(null);

  const simulados = useQuery({
    queryKey: ["simulados-enamed-admin"],
    queryFn: listarSimuladosEnamedAdmin,
  });

  const criar = useMutation({
    mutationFn: () =>
      criarSimuladoEnamedAdmin({
        titulo: titulo.trim(),
        descricao: descricao.trim(),
        tipo,
        gratuito,
        gabaritoStatus,
        abreEm: new Date(abre).toISOString(),
        fechaEm: new Date(fecha).toISOString(),
        gabaritoLiberadoEm: new Date(gabarito).toISOString(),
      }),
    onSuccess: (id) => {
      setSelecionado(id);
      setMensagem("Rascunho criado. Agora importe exatamente 100 questões.");
      void qc.invalidateQueries({ queryKey: ["simulados-enamed-admin"] });
    },
  });

  const importar = useMutation({
    mutationFn: async () => {
      if (!selecionado) throw new Error("Selecione primeiro um simulado em rascunho.");
      let itens: unknown;
      try {
        itens = JSON.parse(json);
      } catch {
        throw new Error("O conteúdo colado não é um JSON válido.");
      }
      if (!Array.isArray(itens) || itens.length !== 100) {
        throw new Error("O arquivo precisa conter exatamente 100 questões.");
      }
      return importarQuestoesSimuladoEnamedAdmin(selecionado, itens);
    },
    onSuccess: (total) => {
      setMensagem(`${total} questões importadas e validadas.`);
      void qc.invalidateQueries({ queryKey: ["simulados-enamed-admin"] });
    },
  });

  const publicar = useMutation({
    mutationFn: async () => {
      if (!selecionado) throw new Error("Selecione um simulado.");
      await publicarSimuladoEnamedAdmin(selecionado);
    },
    onSuccess: () => {
      setMensagem("Simulado publicado com sucesso.");
      void qc.invalidateQueries({ queryKey: ["simulados-enamed-admin"] });
      void qc.invalidateQueries({ queryKey: ["simulados-enamed"] });
    },
  });

  const erro = criar.error ?? importar.error ?? publicar.error;

  return (
    <div className="space-y-5">
      <section className="rounded-2xl border border-border/60 bg-card p-4">
        <div className="mb-4 flex items-center gap-2">
          <CalendarClock className="size-5 text-primary" />
          <div>
            <h2 className="text-sm font-semibold">Novo simulado</h2>
            <p className="text-xs text-muted-foreground">A janela sugerida é domingo, das 10h às 22h.</p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="sm:col-span-2">
            <span className="text-xs text-muted-foreground">Título</span>
            <input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Simulado ENAMED — Semana 1" className="mt-1 w-full rounded-xl border border-border/70 bg-surface px-3 py-2 text-sm outline-none focus:border-primary" />
          </label>
          <label className="sm:col-span-2">
            <span className="text-xs text-muted-foreground">Descrição</span>
            <textarea value={descricao} onChange={(e) => setDescricao(e.target.value)} rows={2} className="mt-1 w-full rounded-xl border border-border/70 bg-surface px-3 py-2 text-sm outline-none focus:border-primary" />
          </label>
          <CampoData rotulo="Abre em" valor={abre} onChange={setAbre} />
          <CampoData rotulo="Fecha em" valor={fecha} onChange={setFecha} />
          <CampoData rotulo="Libera gabarito em" valor={gabarito} onChange={setGabarito} />
          <label>
            <span className="text-xs text-muted-foreground">Tipo</span>
            <select value={tipo} onChange={(e) => setTipo(e.target.value as TipoSimulado)} className="mt-1 w-full rounded-xl border border-border/70 bg-surface px-3 py-2 text-sm">
              <option value="semanal">Semanal</option>
              <option value="oficial">Prova completa ENAMED</option>
            </select>
          </label>
          <label>
            <span className="text-xs text-muted-foreground">Gabarito</span>
            <select value={gabaritoStatus} onChange={(e) => setGabaritoStatus(e.target.value as StatusGabarito)} className="mt-1 w-full rounded-xl border border-border/70 bg-surface px-3 py-2 text-sm">
              <option value="autoral">Autoral</option>
              <option value="preliminar_nao_oficial">Preliminar não oficial</option>
              <option value="oficial">Oficial</option>
            </select>
          </label>
          <label className="flex items-center gap-2 pt-6 text-sm">
            <input type="checkbox" checked={gratuito} onChange={(e) => setGratuito(e.target.checked)} />
            Disponível no plano gratuito
          </label>
        </div>

        <button onClick={() => criar.mutate()} disabled={criar.isPending || !titulo.trim() || !abre || !fecha || !gabarito} className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">
          {criar.isPending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
          Criar rascunho
        </button>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-4">
        <h2 className="text-sm font-semibold">Rascunhos e provas</h2>
        <div className="mt-3 space-y-2">
          {simulados.isLoading ? <p className="text-xs text-muted-foreground">Carregando...</p> : null}
          {simulados.isError ? <p className="text-xs text-destructive">{(simulados.error as Error).message}</p> : null}
          {simulados.data?.map((s) => (
            <button key={s.id} onClick={() => setSelecionado(s.id)} className={cn("flex w-full items-center justify-between rounded-xl border p-3 text-left", selecionado === s.id ? "border-primary bg-primary/10" : "border-border/60 bg-surface")}>
              <span>
                <span className="block text-sm font-semibold">{s.titulo}</span>
                <span className="text-xs text-muted-foreground">{s.status} · {s.totalQuestoes}/100 questões</span>
              </span>
              <span className="text-[11px] uppercase text-muted-foreground">{s.tipo}</span>
            </button>
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-border/60 bg-card p-4">
        <div className="flex items-center gap-2">
          <FileJson className="size-5 text-primary" />
          <div>
            <h2 className="text-sm font-semibold">Importar as 100 questões</h2>
            <p className="text-xs text-muted-foreground">Selecione um rascunho e cole um array JSON com enunciado, quatro alternativas, correta e comentário.</p>
          </div>
        </div>
        <textarea value={json} onChange={(e) => setJson(e.target.value)} rows={10} spellCheck={false} placeholder={'[{"enunciado":"...","alternativas":[{"letra":"A","texto":"..."}],"correta":"A","comentario":"..."}]'} className="mt-3 w-full rounded-xl border border-border/70 bg-surface p-3 font-mono text-xs outline-none focus:border-primary" />
        <button onClick={() => importar.mutate()} disabled={importar.isPending || !selecionado || !json.trim()} className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-primary/50 px-4 py-3 text-sm font-semibold text-primary disabled:opacity-50">
          {importar.isPending ? <Loader2 className="size-4 animate-spin" /> : <FileJson className="size-4" />}
          Validar e importar
        </button>
        <button onClick={() => window.confirm("Publicar este simulado? Depois disso as questões ficam congeladas.") && publicar.mutate()} disabled={publicar.isPending || !selecionado} className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-50">
          {publicar.isPending ? <Loader2 className="size-4 animate-spin" /> : <Rocket className="size-4" />}
          Publicar simulado selecionado
        </button>
      </section>

      {erro ? <p className="text-xs text-destructive">{(erro as Error).message}</p> : null}
      {mensagem ? <p className="text-xs text-success">{mensagem}</p> : null}
    </div>
  );
}

function CampoData({ rotulo, valor, onChange }: { rotulo: string; valor: string; onChange: (valor: string) => void }) {
  return (
    <label>
      <span className="text-xs text-muted-foreground">{rotulo}</span>
      <input type="datetime-local" value={valor} onChange={(e) => onChange(e.target.value)} className="mt-1 w-full rounded-xl border border-border/70 bg-surface px-3 py-2 text-sm outline-none focus:border-primary" />
    </label>
  );
}
