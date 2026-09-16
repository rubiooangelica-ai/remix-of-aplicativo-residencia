import { useMemo, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChevronDown, ClipboardCheck, ListTree, Stethoscope, TriangleAlert } from "lucide-react";
import { criarGeradorDeIds, type TituloSumario } from "@/lib/material-secoes";

function textoDe(children: React.ReactNode): string {
  if (children === null || children === undefined || typeof children === "boolean") return "";
  if (typeof children === "string" || typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(textoDe).join("");
  const filho = children as { props?: { children?: React.ReactNode } };
  return filho.props ? textoDe(filho.props.children) : "";
}

/** Renderiza o Markdown do material com tipografia de leitura e IDs de âncora nos títulos. */
export function MarkdownMaterial({ conteudo, comAncoras = false }: { conteudo: string; comAncoras?: boolean }) {
  const gerarId = criarGeradorDeIds();
  const id = (children: React.ReactNode) => (comAncoras ? gerarId(textoDe(children)) : undefined);

  return (
    <div className="max-w-none text-[16px] leading-7 text-foreground sm:text-[17px]">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 id={id(children)} className="mb-6 mt-10 scroll-mt-24 border-b border-border/70 pb-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 id={id(children)} className="mb-4 mt-10 scroll-mt-24 border-l-4 border-primary pl-4 font-display text-2xl font-bold tracking-tight">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 id={id(children)} className="mb-3 mt-7 scroll-mt-24 font-display text-xl font-bold text-primary">{children}</h3>
          ),
          h4: ({ children }) => (
            <h4 id={id(children)} className="mb-2 mt-6 scroll-mt-24 text-lg font-bold">{children}</h4>
          ),
          p: ({ children }) => <p className="my-4 leading-7 text-foreground/95">{children}</p>,
          ul: ({ children }) => <ul className="my-4 list-disc space-y-2 pl-7 marker:text-primary">{children}</ul>,
          ol: ({ children }) => <ol className="my-4 list-decimal space-y-2 pl-7 marker:font-semibold marker:text-primary">{children}</ol>,
          li: ({ children }) => <li className="pl-1 leading-7">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="my-6 rounded-xl border-l-4 border-primary bg-primary/10 px-5 py-4 font-medium text-foreground [&>p]:my-0">{children}</blockquote>
          ),
          hr: () => <hr className="my-10 border-border/70" />,
          table: ({ children }) => (
            <div className="my-6 overflow-x-auto rounded-xl border border-border">
              <table className="w-full min-w-[640px] border-collapse text-left text-[14px] leading-6">{children}</table>
            </div>
          ),
          thead: ({ children }) => <thead className="bg-primary/10">{children}</thead>,
          tbody: ({ children }) => <tbody className="[&>tr:nth-child(even)]:bg-surface/60">{children}</tbody>,
          tr: ({ children }) => <tr className="border-b border-border last:border-b-0">{children}</tr>,
          th: ({ children }) => <th className="border border-border px-4 py-3 font-bold text-foreground">{children}</th>,
          td: ({ children }) => <td className="border border-border px-4 py-3 align-top text-foreground/90">{children}</td>,
          code: ({ children }) => <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.92em] text-primary">{children}</code>,
          pre: ({ children }) => <pre className="my-5 overflow-x-auto rounded-xl border border-border bg-surface p-4 text-sm leading-6">{children}</pre>,
          strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
        }}
      >
        {conteudo}
      </ReactMarkdown>
    </div>
  );
}

type Painel = "sumario" | "casos" | "pegadinhas" | "revisao";

export function AtalhosMaterial({
  sumario,
  casosRapidos,
  pegadinhas,
  revisaoRapida,
}: {
  sumario: TituloSumario[];
  casosRapidos: string | null;
  pegadinhas: string | null;
  revisaoRapida: string[];
}) {
  const [aberto, setAberto] = useState<Painel | null>(null);
  const atalhos = useMemo(
    () =>
      [
        sumario.length ? { chave: "sumario" as Painel, rotulo: "Sumário", Icone: ListTree } : null,
        casosRapidos ? { chave: "casos" as Painel, rotulo: "Casos rápidos", Icone: Stethoscope } : null,
        pegadinhas ? { chave: "pegadinhas" as Painel, rotulo: "Pegadinhas de residência", Icone: TriangleAlert } : null,
        revisaoRapida.length ? { chave: "revisao" as Painel, rotulo: "Revisão rápida", Icone: ClipboardCheck } : null,
      ].filter((a): a is { chave: Painel; rotulo: string; Icone: typeof ListTree } => a !== null),
    [sumario.length, casosRapidos, pegadinhas, revisaoRapida.length],
  );

  if (!atalhos.length) return null;

  const irPara = (id: string) => {
    setAberto(null);
    requestAnimationFrame(() => {
      document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  return (
    <div className="mt-5 rounded-2xl border border-border/60 bg-surface/70 p-3">
      <div className="flex flex-wrap gap-2">
        {atalhos.map(({ chave, rotulo, Icone }) => {
          const ativo = aberto === chave;
          return (
            <button
              key={chave}
              onClick={() => setAberto(ativo ? null : chave)}
              className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-xs font-semibold transition ${
                ativo ? "border-primary bg-primary/15 text-primary" : "border-border/70 bg-card text-foreground/90"
              }`}
            >
              <Icone className="size-3.5" />
              {rotulo}
              <ChevronDown className={`size-3.5 transition ${ativo ? "rotate-180" : ""}`} />
            </button>
          );
        })}
      </div>

      {aberto === "sumario" ? (
        <nav className="mt-3 rounded-xl border border-border/60 bg-card p-3">
          <ul className="space-y-1">
            {sumario.map((item) => (
              <li key={item.id} style={{ paddingLeft: (item.nivel - 1) * 12 }}>
                <button
                  onClick={() => irPara(item.id)}
                  className="w-full text-left text-[13px] leading-6 text-foreground/85 hover:text-primary"
                >
                  {item.texto}
                </button>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      {aberto === "casos" && casosRapidos ? <PainelMarkdown conteudo={casosRapidos} /> : null}
      {aberto === "pegadinhas" && pegadinhas ? <PainelMarkdown conteudo={pegadinhas} /> : null}
      {aberto === "revisao" && revisaoRapida.length ? (
        <PainelMarkdown conteudo={revisaoRapida.join("\n\n")} />
      ) : null}
    </div>
  );
}

function PainelMarkdown({ conteudo }: { conteudo: string }) {
  return (
    <div className="mt-3 rounded-xl border border-border/60 bg-card p-4">
      <MarkdownMaterial conteudo={conteudo} />
    </div>
  );
}
