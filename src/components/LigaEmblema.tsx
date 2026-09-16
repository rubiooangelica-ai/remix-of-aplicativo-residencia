import { Award, Gem, Medal, Shield, Sparkles, Star, Trophy, Zap } from "lucide-react";
import { cn } from "@/lib/utils";

type LigaEmblemaProps = {
  codigo?: string | null;
  titulo?: string | null;
  descricao?: string | null;
  desbloqueado?: boolean;
  progresso?: string | null;
  tamanho?: "sm" | "md" | "lg";
};

export const CATALOGO_EMBLEMAS_LIGA = [
  { codigo: "broche_10", titulo: "Primeiras 10", descricao: "O começo da jornada na Liga.", criterio: "10 questões", meta: 10 },
  { codigo: "broche_50", titulo: "Ritmo de 50", descricao: "Ganhou ritmo nos estudos.", criterio: "50 questões", meta: 50 },
  { codigo: "broche_100", titulo: "Centena", descricao: "Chegou às primeiras 100.", criterio: "100 questões", meta: 100 },
  { codigo: "broche_250", titulo: "Constância 250", descricao: "Construiu uma rotina sólida.", criterio: "250 questões", meta: 250 },
  { codigo: "broche_500", titulo: "Destaque 500", descricao: "Virou destaque da Liga.", criterio: "500 questões", meta: 500 },
  { codigo: "broche_1000", titulo: "Mil questões", descricao: "Alcançou quatro dígitos.", criterio: "1.000 questões", meta: 1000 },
  { codigo: "broche_1500", titulo: "Elite 1.500", descricao: "Entrou para a elite dos ligantes.", criterio: "1.500 questões", meta: 1500 },
  { codigo: "broche_2000", titulo: "Lenda 2.000", descricao: "Atingiu o maior marco da Liga.", criterio: "2.000 questões", meta: 2000 },
] as const;

const CORES_BROCHES = [
  "from-amber-700/25 to-amber-500/5 text-amber-500 border-amber-600/35",
  "from-slate-300/25 to-slate-500/5 text-slate-300 border-slate-400/35",
  "from-warning/25 to-warning/5 text-warning border-warning/35",
  "from-primary/25 to-primary/5 text-primary border-primary/35",
  "from-success/25 to-success/5 text-success border-success/35",
  "from-cyan-400/25 to-primary/5 text-cyan-300 border-cyan-400/35",
  "from-violet-400/25 to-primary/5 text-violet-300 border-violet-400/35",
  "from-fuchsia-400/30 to-warning/5 text-fuchsia-300 border-fuchsia-400/40",
];

const ICONES_BROCHES = [Zap, Award, Medal, Shield, Star, Trophy, Gem, Sparkles];

function indiceBroche(codigo?: string | null, titulo?: string | null) {
  const alvo = `${codigo ?? ""} ${titulo ?? ""}`.toLowerCase();
  const codigoNumero = alvo.match(/(?:broche_|\b)(10|50|100|250|500|1000|1500|2000)\b/)?.[1];
  const metas = ["10", "50", "100", "250", "500", "1000", "1500", "2000"];
  const indice = codigoNumero ? metas.indexOf(codigoNumero) : -1;
  return indice >= 0 ? indice : 0;
}

export function LigaEmblema({ codigo, titulo, desbloqueado = true, tamanho = "md" }: LigaEmblemaProps) {
  const indice = indiceBroche(codigo, titulo);
  const Icon = ICONES_BROCHES[indice] ?? Zap;
  const dimensao = tamanho === "lg" ? "size-14" : tamanho === "sm" ? "size-7" : "size-9";
  const icone = tamanho === "lg" ? "size-7" : tamanho === "sm" ? "size-3.5" : "size-4.5";

  return (
    <span
      title={titulo ?? "Emblema da Liga"}
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full border bg-gradient-to-br shadow-sm",
        dimensao,
        desbloqueado ? CORES_BROCHES[indice] : "border-border/60 from-muted/20 to-muted/5 text-muted-foreground opacity-35 grayscale",
      )}
    >
      <Icon className={icone} />
    </span>
  );
}

export function LigaEmblemaTexto({ codigo, titulo, descricao, progresso, desbloqueado = true }: LigaEmblemaProps) {
  return (
    <div
      title={descricao ?? titulo ?? undefined}
      className={cn(
        "flex min-w-0 items-center gap-2 rounded-xl border px-2.5 py-2",
        desbloqueado ? "border-primary/25 bg-primary/5" : "border-border/50 bg-surface opacity-65",
      )}
    >
      <LigaEmblema codigo={codigo ?? null} titulo={titulo ?? null} desbloqueado={desbloqueado} tamanho="sm" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-[11px] font-semibold">{titulo}</p>
        <p className="truncate text-[9px] text-muted-foreground">{desbloqueado ? descricao : progresso}</p>
      </div>
    </div>
  );
}

const PATENTES = {
  iniciante: { icon: Shield, classe: "border-border/70 bg-surface text-muted-foreground" },
  bronze: { icon: Award, classe: "border-amber-700/40 bg-amber-700/10 text-amber-500" },
  prata: { icon: Medal, classe: "border-slate-400/40 bg-slate-400/10 text-slate-300" },
  ouro: { icon: Trophy, classe: "border-warning/40 bg-warning/10 text-warning" },
  platina: { icon: Star, classe: "border-cyan-400/40 bg-cyan-400/10 text-cyan-300" },
  diamante: { icon: Gem, classe: "border-primary/50 bg-primary/10 text-primary" },
  lendaria: { icon: Sparkles, classe: "border-fuchsia-400/50 bg-fuchsia-400/10 text-fuchsia-300" },
} as const;

export function PatenteLigaSelo({ codigo, nome, compacto = false }: { codigo: string; nome: string; compacto?: boolean }) {
  const config = PATENTES[codigo as keyof typeof PATENTES] ?? PATENTES.iniciante;
  const Icon = config.icon;
  return (
    <span className={cn("inline-flex shrink-0 items-center gap-1.5 rounded-full border font-semibold", compacto ? "px-2 py-1 text-[9px]" : "px-2.5 py-1.5 text-[10px]", config.classe)}>
      <Icon className={compacto ? "size-3" : "size-3.5"} />
      {nome}
    </span>
  );
}
