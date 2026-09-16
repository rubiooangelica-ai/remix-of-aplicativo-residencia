export type UltimaAtividadeApp = {
  to: string;
  titulo: string;
  descricao: string;
  tipo: "questoes" | "flashcards" | "material" | "agenda" | "progresso" | "ia" | "suporte";
  updatedAt: string;
};

const CHAVE = "residenciapro:ultima-atividade";

const ROTAS: Record<string, Omit<UltimaAtividadeApp, "updatedAt">> = {
  "/questoes": {
    to: "/questoes",
    titulo: "Continuar praticando questões",
    descricao: "Retome a resolução exatamente de onde você parou.",
    tipo: "questoes",
  },
  "/flashcards": {
    to: "/flashcards",
    titulo: "Retomar flashcards",
    descricao: "Volte para sua revisão ativa dos cartões.",
    tipo: "flashcards",
  },
  "/material": {
    to: "/material",
    titulo: "Continuar lendo material",
    descricao: "Abra novamente seus resumos e materiais de estudo.",
    tipo: "material",
  },
  "/cronograma": {
    to: "/cronograma",
    titulo: "Retomar agenda de estudos",
    descricao: "Continue organizando seus blocos da semana.",
    tipo: "agenda",
  },
  "/ranking": {
    to: "/ranking",
    titulo: "Ver meu progresso",
    descricao: "Acompanhe desempenho, ranking e evolução por assunto.",
    tipo: "progresso",
  },
  "/ia": {
    to: "/ia",
    titulo: "Retomar dúvidas com IA",
    descricao: "Volte ao tutor para revisar raciocínio e condutas.",
    tipo: "ia",
  },
};

function normalizarPath(pathname: string) {
  const rota = Object.keys(ROTAS).find((base) => pathname === base || pathname.startsWith(`${base}/`));
  return rota ?? null;
}

export function registrarUltimaAtividade(pathname?: string) {
  if (typeof window === "undefined") return;
  const atual = pathname ?? window.location.pathname;
  const rota = normalizarPath(atual);
  if (!rota) return;

  const item: UltimaAtividadeApp = {
    ...ROTAS[rota]!,
    updatedAt: new Date().toISOString(),
  };

  window.localStorage.setItem(CHAVE, JSON.stringify(item));
}

export function buscarUltimaAtividade(): UltimaAtividadeApp | null {
  if (typeof window === "undefined") return null;
  try {
    const bruto = window.localStorage.getItem(CHAVE);
    if (!bruto) return null;
    const item = JSON.parse(bruto) as UltimaAtividadeApp;
    if (!item?.to || !item?.titulo) return null;
    return item;
  } catch {
    return null;
  }
}

export function retomadaPadrao(): UltimaAtividadeApp {
  return {
    to: "/questoes",
    titulo: "Praticar questões",
    descricao: "Comece ou retome uma sessão com o banco de questões.",
    tipo: "questoes",
    updatedAt: new Date().toISOString(),
  };
}
