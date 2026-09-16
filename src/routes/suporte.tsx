import { createFileRoute } from "@tanstack/react-router";
import { LifeBuoy, Mail, MessageSquare } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/suporte")({
  head: () => ({
    meta: [
      { title: "Suporte e feedback | ResidênciaPro" },
      {
        name: "description",
        content:
          "Fale com a equipe do ResidênciaPro: relate erros em questões, envie sugestões e consulte as dúvidas mais comuns.",
      },
      { property: "og:title", content: "Suporte e feedback — ResidênciaPro" },
      {
        property: "og:description",
        content: "Relate erros em questões, envie sugestões e tire dúvidas sobre o app.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Suporte,
});

const FAQ = [
  {
    p: "Encontrei uma questão com gabarito errado. O que faço?",
    r: "Envie o enunciado e a banca por e-mail que corrigimos o item no banco.",
  },
  {
    p: "Posso importar meu próprio banco de questões?",
    r: "Sim, na aba Importar você envia arquivos CSV ou JSON e eles entram na sua conta.",
  },
  {
    p: "Como funciona o OSCE AZ?",
    r: "Você escolhe o tema e o tempo, atende um paciente simulado por IA e recebe a correção pelo barema padrão ou pelo seu.",
  },
];

function Suporte() {
  return (
    <AppShell titulo="Suporte" descricao="Fale com a gente e veja as dúvidas mais comuns.">
      <div className="grid gap-3">
        <a
          href="mailto:suporte@residenciapro.app"
          className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-4 text-sm font-medium"
        >
          <Mail className="size-4 text-primary" />
          Enviar feedback por e-mail
        </a>
        <a
          href="mailto:suporte@residenciapro.app?subject=Erro%20em%20questão"
          className="flex items-center gap-3 rounded-2xl border border-border/60 bg-card px-4 py-4 text-sm font-medium"
        >
          <MessageSquare className="size-4 text-primary" />
          Relatar erro em questão
        </a>
      </div>

      <section className="mt-6">
        <h2 className="flex items-center gap-2 text-base font-semibold">
          <LifeBuoy className="size-4 text-primary" />
          Central de ajuda
        </h2>
        <ul className="mt-3 space-y-2">
          {FAQ.map((f) => (
            <li key={f.p} className="rounded-2xl border border-border/60 bg-surface px-4 py-3">
              <p className="text-sm font-medium">{f.p}</p>
              <p className="mt-1 text-xs text-muted-foreground">{f.r}</p>
            </li>
          ))}
        </ul>
      </section>
    </AppShell>
  );
}
