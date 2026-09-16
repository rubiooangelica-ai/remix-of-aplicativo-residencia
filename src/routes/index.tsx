import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  BookOpen,
  Brain,
  CalendarDays,
  Flame,
  GraduationCap,
  Layers,
  LifeBuoy,
  MessageSquare,
  Sparkles,
  Stethoscope,
  Target,
  Trophy,
  Upload,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { HistoricoSessoes } from "@/components/HistoricoSessoes";
import { cronograma, dias } from "@/data/cronograma";
import { useSessao } from "@/lib/auth";
import { buscarMetricas, buscarRetomada, contarQuestoes } from "@/lib/banco";
import { buscarUltimaAtividade, retomadaPadrao, type UltimaAtividadeApp } from "@/lib/retomada-app";

type RotaApp = "/simulados" | "/questoes" | "/equipes" | "/material" | "/cronograma" | "/flashcards" | "/ia" | "/osce" | "/diagnostico" | "/importar" | "/ranking" | "/suporte" | "/auth";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "ResidênciaPro — Painel de estudos para residência médica" },
      {
        name: "description",
        content:
          "Painel com metas do dia, desempenho por acertos e erros, banco de questões, flashcards, cronograma, Liga e tutor de IA para residência médica.",
      },
      { property: "og:title", content: "ResidênciaPro — Painel de estudos" },
      {
        property: "og:description",
        content: "Questões, flashcards, Liga, cronograma e tutor de IA em um só lugar.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const DIAS_CURTOS = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

function Index() {
  const { usuario } = useSessao();
  const [ultimaAtividade, setUltimaAtividade] = useState<UltimaAtividadeApp>(() => retomadaPadrao());

  const total = useQuery({ queryKey: ["questoes-total"], queryFn: contarQuestoes });
  const metricas = useQuery({
    queryKey: ["metricas"],
    queryFn: buscarMetricas,
    enabled: !!usuario,
  });
  const retomada = useQuery({
    queryKey: ["retomada"],
    queryFn: buscarRetomada,
    enabled: !!usuario,
  });

  useEffect(() => {
    setUltimaAtividade(buscarUltimaAtividade() ?? retomadaPadrao());
  }, []);

  const m = metricas.data;
  const acertosHoje = m?.hojeTotal ? Math.round((m.hojeAcertos / m.hojeTotal) * 100) : 0;
  const acertosGeral = m?.geralTotal ? Math.round((m.geralAcertos / m.geralTotal) * 100) : 0;

  const hoje = new Date();
  const semana = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(hoje);
    d.setDate(hoje.getDate() - hoje.getDay() + i);
    return d;
  });
  const nomeDiaHoje = dias[(hoje.getDay() + 6) % 7];
  const blocosHoje = cronograma.filter((b) => b.dia === nomeDiaHoje);

  const descricaoRetomada = ultimaAtividade.tipo === "questoes" && retomada.data
    ? `${retomada.data.restantes} questões ainda não respondidas`
    : ultimaAtividade.descricao;

  return (
    <AppShell titulo="Painel de estudos">
      <section className="rounded-3xl border border-border/60 bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              {hoje.toLocaleDateString("pt-BR", { month: "long", year: "numeric" })}
            </p>
            <h2 className="font-display text-lg font-semibold">Sua semana</h2>
          </div>
          <span className="flex items-center gap-1.5 rounded-full bg-warning/15 px-3 py-1.5 text-xs font-medium text-warning">
            <Flame className="size-3.5" />
            {m?.diasSeguidos ?? 0} dias
          </span>
        </div>

        <div className="mt-4 flex justify-between gap-1">
          {semana.map((d) => {
            const atual = d.toDateString() === hoje.toDateString();
            return (
              <div
                key={d.toISOString()}
                className={`flex flex-1 flex-col items-center gap-1 rounded-xl py-2 text-[11px] ${
                  atual
                    ? "bg-primary text-primary-foreground font-semibold"
                    : "text-muted-foreground"
                }`}
              >
                <span>{DIAS_CURTOS[d.getDay()]}</span>
                <span className="text-sm font-semibold">{d.getDate()}</span>
              </div>
            );
          })}
        </div>

        <div className="mt-5 grid grid-cols-3 gap-2">
          <Metric label="Questões hoje" valor={`${m?.hojeTotal ?? 0}`} />
          <Metric label="Acertos hoje" valor={`${acertosHoje}%`} tom="success" />
          <Metric label="% acertos no total" valor={`${acertosGeral}%`} tom="success" />
        </div>

        {!usuario ? (
          <Link
            to="/auth"
            className="mt-4 flex items-center justify-between rounded-xl border border-primary/40 bg-primary/10 px-4 py-3 text-sm font-medium text-primary"
          >
            Entre para acompanhar seu desempenho
            <ArrowRight className="size-4" />
          </Link>
        ) : null}
      </section>

      <section className="mt-5">
        <Link
          to={ultimaAtividade.to as RotaApp}
          className="flex items-center gap-4 rounded-2xl border border-primary/35 bg-gradient-to-br from-primary/15 to-transparent p-4"
        >
          <span className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary/20 text-primary">
            <Target className="size-5" />
          </span>
          <span className="flex-1">
            <span className="block font-display text-sm font-semibold">{ultimaAtividade.titulo}</span>
            <span className="block text-xs text-muted-foreground">{descricaoRetomada}</span>
          </span>
          <ArrowRight className="size-4 text-primary" />
        </Link>
      </section>

      <HistoricoSessoes />

      <section className="mt-6">
        <h2 className="text-base font-semibold">Ferramentas</h2>
        <div className="mt-3 grid grid-cols-2 gap-3">
          <Tool to="/questoes" icone={<Target className="size-5" />} titulo="Praticar questões" texto={`${(total.data ?? 0).toLocaleString("pt-BR")} no banco`} destaque />
          <Tool to="/simulados" icone={<GraduationCap className="size-5" />} titulo="Simulados ENAMED" texto="100 questões toda semana" destaque />
          <Tool to="/equipes" icone={<Users className="size-5" />} titulo="Liga" texto="Ligantes e conquistas" destaque />
          <Tool to="/material" icone={<BookOpen className="size-5" />} titulo="Material de estudos" texto="Resumos por tema" />
          <Tool to="/cronograma" icone={<CalendarDays className="size-5" />} titulo="Agenda" texto="Blocos da semana" />
          <Tool to="/flashcards" icone={<Layers className="size-5" />} titulo="Flashcards" texto="Revisão dos erros" />
          <Tool to="/ia" icone={<Sparkles className="size-5" />} titulo="IA para dúvidas" texto="Preceptor 24h" />
          <Tool to="/osce" icone={<Stethoscope className="size-5" />} titulo="OSCE AZ" texto="Estação prática" destaque />
          <Tool to="/diagnostico" icone={<Brain className="size-5" />} titulo="Qual o diagnóstico?" texto="Desafio diário" destaque />
          <Tool to="/importar" icone={<Upload className="size-5" />} titulo="Importar banco" texto="CSV ou JSON" />
          <Tool to="/ranking" icone={<Trophy className="size-5" />} titulo="Ranking" texto="Usuários e Ligas" />
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-base font-semibold">Blocos de hoje</h2>
        <ul className="mt-3 space-y-2">
          {blocosHoje.length ? (
            blocosHoje.map((b) => (
              <li key={b.id} className="flex items-center justify-between rounded-xl border border-border/60 bg-surface px-4 py-3">
                <div>
                  <p className="text-sm font-medium">{b.tema}</p>
                  <p className="text-xs text-muted-foreground">{b.tipo} · {b.minutos} min</p>
                </div>
                <span className="rounded-full bg-primary/15 px-2 py-1 text-[11px] font-medium text-primary">{b.area}</span>
              </li>
            ))
          ) : (
            <li className="rounded-xl border border-border/60 bg-surface px-4 py-3 text-xs text-muted-foreground">Nenhum bloco planejado para hoje — monte o seu no cronograma.</li>
          )}
        </ul>
      </section>

      <section className="mt-6 rounded-2xl border border-border/60 bg-surface p-5">
        <h2 className="text-base font-semibold">Atendimento e feedback</h2>
        <p className="mt-1 text-xs text-muted-foreground">Encontrou uma questão com erro ou quer sugerir algo? Fale com a gente.</p>
        <div className="mt-3 grid gap-2">
          <Link to="/suporte" className="flex items-center gap-3 rounded-xl border border-border/60 px-4 py-3 text-sm font-medium"><MessageSquare className="size-4 text-primary" />Enviar feedback</Link>
          <Link to="/suporte" className="flex items-center gap-3 rounded-xl border border-border/60 px-4 py-3 text-sm font-medium"><LifeBuoy className="size-4 text-primary" />Central de ajuda</Link>
        </div>
      </section>
    </AppShell>
  );
}

function Metric({ label, valor, tom = "primary" }: { label: string; valor: string; tom?: "primary" | "success" | "destructive" }) {
  const cor = tom === "success" ? "text-success" : tom === "destructive" ? "text-destructive" : "text-primary";
  return (
    <div className="rounded-2xl border border-border/60 bg-surface p-3">
      <p className={`font-display text-xl font-semibold ${cor}`}>{valor}</p>
      <p className="mt-1 text-[10px] uppercase tracking-wide text-muted-foreground">{label}</p>
    </div>
  );
}

function Tool({ to, icone, titulo, texto, destaque }: { to: RotaApp; icone: React.ReactNode; titulo: string; texto: string; destaque?: boolean }) {
  return (
    <Link to={to} className={`flex flex-col gap-2 rounded-2xl border p-4 transition-colors ${destaque ? "border-primary/40 bg-primary/10 hover:border-primary" : "border-border/60 bg-card hover:border-primary/50"}`}>
      <span className="flex size-9 items-center justify-center rounded-lg bg-primary/15 text-primary">{icone}</span>
      <span className="text-sm font-medium leading-tight">{titulo}</span>
      <span className="text-[11px] text-muted-foreground">{texto}</span>
    </Link>
  );
}
