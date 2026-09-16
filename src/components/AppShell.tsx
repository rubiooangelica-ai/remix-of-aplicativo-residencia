import { Link } from "@tanstack/react-router";
import {
  BookOpen,
  BookOpenCheck,
  CalendarDays,
  Crown,
  GraduationCap,
  LayoutDashboard,
  LogIn,
  BarChart3,
  ShieldCheck,
  Stethoscope,
  Users,
} from "lucide-react";
import type { ReactNode } from "react";
import { useEffect } from "react";
import { ErroGlobal } from "@/components/ErroGlobal";
import { SeletorTema } from "@/components/SeletorTema";
import { usePlano } from "@/hooks/usePlano";
import { registrarUltimaAtividade } from "@/lib/retomada-app";
import { registrarAcessoApp } from "@/lib/acessos";

const navBase = [
  { to: "/", label: "Início", icon: LayoutDashboard },
  { to: "/questoes", label: "Questões", icon: BookOpenCheck },
  { to: "/simulados", label: "Simulados", icon: GraduationCap },
  { to: "/material", label: "Material", icon: BookOpen },
  { to: "/cronograma", label: "Agenda", icon: CalendarDays },
  { to: "/ranking", label: "Progresso", icon: BarChart3 },
  { to: "/equipes", label: "Liga", icon: Users },
] as const;

export function AppShell({
  children,
  titulo,
  descricao,
}: {
  children: ReactNode;
  titulo: string;
  descricao?: string;
}) {
  const { usuario, status, premium, ehAdmin, carregando } = usePlano();
  const nav = ehAdmin
    ? [...navBase, { to: "/admin" as const, label: "Admin", icon: ShieldCheck }]
    : navBase;

  useEffect(() => {
    registrarUltimaAtividade();
    registrarAcessoApp(usuario?.id);
  }, [usuario?.id]);

  return (
    <>
      <ErroGlobal />
      <div className="min-h-screen bg-background pb-24">
        <header className="border-b border-border/60 bg-surface/80 backdrop-blur">
          <div className="mx-auto flex max-w-3xl items-center gap-3 px-5 py-4">
            <span className="flex size-9 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Stethoscope className="size-5" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
                ResidênciaPro
              </p>
              <h1 className="truncate font-display text-lg font-semibold leading-tight text-foreground">
                {titulo}
              </h1>
            </div>
            {usuario && !carregando ? (
              premium ? (
                <Link
                  to="/minha-assinatura"
                  className="hidden items-center gap-1.5 rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary sm:flex"
                >
                  <Crown className="size-3.5" />{" "}
                  {ehAdmin ? "Admin Premium" : "Premium"}
                </Link>
              ) : !ehAdmin && status?.limiteDiario ? (
                <Link
                  to="/minha-assinatura"
                  className="hidden rounded-full border border-primary/40 bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary sm:block"
                >
                  {status.questoesHoje}/{status.limiteDiario} grátis
                </Link>
              ) : null
            ) : null}
            <SeletorTema />
            {usuario ? (
              <Link
                to="/perfil"
                className="flex items-center gap-1.5 rounded-full border border-border/70 px-3 py-1.5 text-xs font-medium text-muted-foreground"
              >
                <LogIn className="size-3.5" />{" "}
                <span className="hidden sm:inline">Minha conta</span>
              </Link>
            ) : (
              <Link
                to="/auth"
                className="flex items-center gap-1.5 rounded-full border border-border/70 px-3 py-1.5 text-xs font-medium text-muted-foreground"
              >
                <LogIn className="size-3.5" /> Entrar
              </Link>
            )}
          </div>
        </header>

        <main className="mx-auto max-w-3xl px-5 py-6">
          {descricao ? (
            <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
              {descricao}
            </p>
          ) : null}
          {children}
        </main>

        <nav className="fixed inset-x-0 bottom-0 border-t border-border/60 bg-surface/95 backdrop-blur">
          <div className="mx-auto flex max-w-3xl overflow-x-auto">
            {nav.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: to === "/" }}
                className="flex min-w-[68px] flex-1 flex-col items-center gap-1 py-3 text-[11px] font-medium text-muted-foreground transition-colors"
                activeProps={{ className: "text-primary" }}
              >
                <Icon className="size-5" /> {label}
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </>
  );
}
