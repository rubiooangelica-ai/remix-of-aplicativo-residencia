import { useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Send, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { PremiumGate } from "@/components/PremiumGate";
import { tirarDuvida } from "@/lib/estudo.functions";

export const Route = createFileRoute("/ia")({
  head: () => ({ meta: [{ title: "Tutor de IA — ResidênciaPro" }] }),
  component: IA,
});

type Mensagem = { papel: "user" | "assistant"; texto: string };

const SUGESTOES = [
  "Como diferenciar ICFEr de ICFEp na prova?",
  "Critérios de Light no derrame pleural",
  "Conduta na crise convulsiva febril simples",
];

function IA() {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState("");
  const perguntar = useServerFn(tirarDuvida);

  const enviar = useMutation({
    mutationFn: async (pergunta: string) =>
      (
        await perguntar({
          data: {
            contexto: "Dúvida livre de uma estudante que se prepara para a residência médica.",
            historico: mensagens.slice(-10),
            pergunta,
          },
        })
      ).resposta,
    onSuccess: (resposta, pergunta) =>
      setMensagens((prev) => [...prev, { papel: "user", texto: pergunta }, { papel: "assistant", texto: resposta }]),
  });

  function submeter(pergunta: string) {
    const limpo = pergunta.trim();
    if (!limpo || enviar.isPending) return;
    setTexto("");
    enviar.mutate(limpo);
  }

  return (
    <AppShell titulo="IA para dúvidas" descricao="Pergunte como perguntaria ao preceptor.">
      <PremiumGate
        titulo="IA exclusiva do Premium"
        descricao="No Premium você pode tirar dúvidas, pedir explicações de questões e usar as ferramentas inteligentes do ResidênciaPro."
      >
        <div className="space-y-3">
          {!mensagens.length ? (
            <div className="rounded-2xl border border-border/60 bg-card p-5">
              <Sparkles className="size-5 text-primary" />
              <p className="mt-2 text-sm text-muted-foreground">Comece por uma dessas dúvidas ou escreva a sua.</p>
              <div className="mt-3 space-y-2">
                {SUGESTOES.map((s) => (
                  <button key={s} onClick={() => submeter(s)} className="w-full rounded-xl border border-border/60 bg-surface px-4 py-3 text-left text-xs">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : null}

          {mensagens.map((m, i) => (
            <div
              key={i}
              className={
                m.papel === "user"
                  ? "ml-auto max-w-[85%] rounded-2xl bg-primary/20 px-4 py-3 text-sm"
                  : "max-w-[92%] whitespace-pre-wrap rounded-2xl border border-border/60 bg-card px-4 py-3 text-sm leading-relaxed"
              }
            >
              {m.texto}
            </div>
          ))}

          {enviar.isPending ? (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" /> Pensando…
            </p>
          ) : null}
        </div>

        <div className="sticky bottom-20 mt-5 flex gap-2 rounded-full border border-border/70 bg-surface p-1.5">
          <input
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submeter(texto)}
            placeholder="Digite sua dúvida"
            className="flex-1 bg-transparent px-3 text-sm outline-none"
          />
          <button onClick={() => submeter(texto)} className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <Send className="size-4" />
          </button>
        </div>
      </PremiumGate>
    </AppShell>
  );
}
