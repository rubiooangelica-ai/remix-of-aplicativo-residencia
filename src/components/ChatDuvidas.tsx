import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Loader2, Send, X } from "lucide-react";
import { tirarDuvida } from "@/lib/estudo.functions";
import { PremiumGate } from "@/components/PremiumGate";

type Mensagem = { papel: "user" | "assistant"; texto: string };

export function ChatDuvidas({
  contexto,
  onFechar,
}: {
  contexto: string;
  onFechar: () => void;
}) {
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [texto, setTexto] = useState("");
  const perguntar = useServerFn(tirarDuvida);

  const enviar = useMutation({
    mutationFn: async (pergunta: string) => {
      const r = await perguntar({ data: { contexto, historico: mensagens, pergunta } });
      return r.resposta;
    },
    onSuccess: (resposta, pergunta) =>
      setMensagens((prev) => [
        ...prev,
        { papel: "user", texto: pergunta },
        { papel: "assistant", texto: resposta },
      ]),
  });

  function submeter() {
    const pergunta = texto.trim();
    if (!pergunta || enviar.isPending) return;
    setTexto("");
    enviar.mutate(pergunta);
  }

  return (
    <aside className="fixed inset-y-0 right-0 z-50 flex w-full max-w-sm flex-col border-l border-border/60 bg-surface shadow-2xl">
      <header className="flex items-center justify-between border-b border-border/60 px-4 py-3">
        <p className="font-display text-sm font-semibold text-foreground">Tutor IA</p>
        <button onClick={onFechar} aria-label="Fechar tutor" className="text-muted-foreground">
          <X className="size-4" />
        </button>
      </header>

      <PremiumGate
        compacto
        titulo="Tutor IA exclusivo Premium"
        descricao="Assine o Premium para tirar dúvidas sobre cada questão, pedir raciocínio, conduta e diagnóstico diferencial."
      >
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-4 text-sm">
          {!mensagens.length ? (
            <p className="text-xs leading-relaxed text-muted-foreground">
              Pergunte qualquer coisa sobre a questão aberta agora — fisiopatologia, conduta,
              diagnóstico diferencial.
            </p>
          ) : null}
          {mensagens.map((m, i) => (
            <div
              key={i}
              className={
                m.papel === "user"
                  ? "ml-6 rounded-xl bg-primary/15 px-3 py-2 text-foreground"
                  : "mr-2 space-y-2 rounded-xl border border-border/60 bg-card px-3 py-2 leading-relaxed text-foreground/90"
              }
            >
              {m.texto
                .split("\n")
                .filter((l) => l.trim())
                .map((l, j) => (
                  <p key={j}>{l.replace(/^[*#\s]+/, "")}</p>
                ))}
            </div>
          ))}
          {enviar.isPending ? (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" /> pensando...
            </p>
          ) : null}
          {enviar.isError ? (
            <p className="rounded-xl border border-destructive/60 bg-destructive/10 p-2 text-xs text-destructive">
              {(enviar.error as Error).message || "Erro ao consultar a IA."}
            </p>
          ) : null}
        </div>

        <div className="flex items-end gap-2 border-t border-border/60 p-3">
          <textarea
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                submeter();
              }
            }}
            rows={2}
            placeholder="Sua dúvida..."
            className="flex-1 resize-none rounded-xl border border-border/70 bg-background px-3 py-2 text-sm outline-none focus:border-primary"
          />
          <button
            onClick={submeter}
            disabled={enviar.isPending}
            aria-label="Enviar pergunta"
            className="rounded-xl bg-primary p-2.5 text-primary-foreground disabled:opacity-60"
          >
            <Send className="size-4" />
          </button>
        </div>
      </PremiumGate>
    </aside>
  );
}
