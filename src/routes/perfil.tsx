import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Activity,
  Bone,
  Brain,
  Camera,
  CreditCard,
  HeartPulse,
  Loader2,
  LogOut,
  Microscope,
  Pill,
  Stethoscope,
  Syringe,
  Trash2,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { supabase } from "@/integrations/supabase/client";
import { usePlano } from "@/hooks/usePlano";
import { useSessao } from "@/lib/auth";
import { buscarPerfil, enviarArquivoAvatar, salvarPerfil, type CamposPerfil } from "@/lib/perfil";

export const Route = createFileRoute("/perfil")({
  head: () => ({
    meta: [
      { title: "Configurações de perfil — ResidênciaPro" },
      { name: "description", content: "Edite sua foto, nome público e outras informações do seu perfil." },
    ],
  }),
  component: ConfiguracoesPerfil,
});

const ICONES = [
  { id: "stethoscope", Icone: Stethoscope },
  { id: "heart-pulse", Icone: HeartPulse },
  { id: "brain", Icone: Brain },
  { id: "syringe", Icone: Syringe },
  { id: "pill", Icone: Pill },
  { id: "microscope", Icone: Microscope },
  { id: "activity", Icone: Activity },
  { id: "bone", Icone: Bone },
] as const;

const CORES = ["#6366f1", "#0ea5e9", "#10b981", "#f59e0b", "#ef4444", "#ec4899", "#8b5cf6", "#14b8a6"];

function ConfiguracoesPerfil() {
  const { usuario } = useSessao();
  const { texto, premium } = usePlano();
  const qc = useQueryClient();
  const arquivoRef = useRef<HTMLInputElement>(null);

  const perfilQuery = useQuery({
    queryKey: ["meu-perfil", usuario?.id],
    queryFn: () => buscarPerfil(usuario!.id),
    enabled: !!usuario,
  });

  const [inicializado, setInicializado] = useState(false);
  const [apelido, setApelido] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarIcone, setAvatarIcone] = useState<string | null>(null);
  const [avatarCor, setAvatarCor] = useState<string | null>(null);
  const [instituicao, setInstituicao] = useState("");
  const [areaInteresse, setAreaInteresse] = useState("");
  const [bio, setBio] = useState("");
  const [rankingVisivel, setRankingVisivel] = useState(true);
  const [rankingTaxaVisivel, setRankingTaxaVisivel] = useState(true);
  const [salvo, setSalvo] = useState(false);

  useEffect(() => {
    if (inicializado || !perfilQuery.data) return;
    const p = perfilQuery.data;
    setApelido(p.apelido);
    setAvatarUrl(p.avatarUrl);
    setAvatarIcone(p.avatarIcone);
    setAvatarCor(p.avatarCor);
    setInstituicao(p.instituicao ?? "");
    setAreaInteresse(p.areaInteresse ?? "");
    setBio(p.bio ?? "");
    setRankingVisivel(p.rankingVisivel);
    setRankingTaxaVisivel(p.rankingTaxaVisivel);
    setInicializado(true);
  }, [inicializado, perfilQuery.data]);

  const enviarFoto = useMutation({
    mutationFn: async (arquivo: File) => enviarArquivoAvatar(usuario!.id, arquivo),
    onSuccess: (url) => {
      setAvatarUrl(url);
      setAvatarIcone(null);
      setAvatarCor(null);
    },
  });

  const salvar = useMutation({
    mutationFn: async () => {
      const campos: CamposPerfil = {
        apelido,
        avatarUrl,
        avatarIcone,
        avatarCor,
        instituicao,
        areaInteresse,
        bio,
        rankingVisivel,
        rankingTaxaVisivel,
      };
      await salvarPerfil(usuario!.id, campos);
    },
    onSuccess: () => {
      setSalvo(true);
      setTimeout(() => setSalvo(false), 2500);
      void qc.invalidateQueries({ queryKey: ["meu-perfil", usuario?.id] });
    },
  });

  function escolherIcone(id: string) {
    setAvatarIcone(id);
    setAvatarCor((cor) => cor ?? CORES[0]!);
    setAvatarUrl(null);
  }

  if (!usuario) {
    return (
      <AppShell titulo="Configurações de perfil">
        <p className="text-sm text-muted-foreground">Entre na sua conta para editar seu perfil.</p>
      </AppShell>
    );
  }

  const IconeAtual = ICONES.find((i) => i.id === avatarIcone)?.Icone ?? Stethoscope;

  return (
    <AppShell titulo="Configurações de perfil" descricao="Sua foto, nome público, plano e preferências da conta.">
      <div className="space-y-5">
        <div className="space-y-3 rounded-2xl border border-primary/40 bg-primary/10 p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-primary">Minha conta</p>
          <p className="text-sm text-muted-foreground">Conectado como {usuario.email}.</p>
          <div className="grid gap-2 sm:grid-cols-2">
            <Link to="/minha-assinatura" className="flex items-center justify-center gap-2 rounded-xl border border-primary/40 bg-card px-4 py-3 text-sm font-semibold text-primary">
              <CreditCard className="size-4" /> {premium ? "Gerenciar assinatura" : "Ver planos Premium"}
            </Link>
            <button
              type="button"
              onClick={async () => {
                await supabase.auth.signOut();
                window.localStorage.removeItem("residenciapro:ultima-atividade");
                window.location.href = "/auth";
              }}
              className="flex items-center justify-center gap-2 rounded-xl border border-border/70 bg-card px-4 py-3 text-sm font-semibold text-foreground"
            >
              <LogOut className="size-4" /> Sair da conta
            </button>
          </div>
          <p className="text-xs text-muted-foreground">Plano atual: {texto}.</p>
        </div>

        <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Foto de perfil</p>
          <div className="flex items-center gap-4">
            <span
              className="flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full text-white"
              style={{ backgroundColor: avatarUrl ? undefined : avatarCor ?? "var(--primary)" }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Sua foto de perfil" className="size-full object-cover" />
              ) : (
                <IconeAtual className="size-7" />
              )}
            </span>
            <div className="flex flex-1 flex-wrap gap-2">
              <input
                ref={arquivoRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const arquivo = e.target.files?.[0];
                  if (arquivo) enviarFoto.mutate(arquivo);
                  e.target.value = "";
                }}
              />
              <button
                type="button"
                onClick={() => arquivoRef.current?.click()}
                disabled={enviarFoto.isPending}
                className="flex items-center gap-1.5 rounded-xl border border-border/70 px-3 py-2 text-xs font-medium disabled:opacity-60"
              >
                {enviarFoto.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Camera className="size-3.5" />}
                Enviar foto
              </button>
              {avatarUrl ? (
                <button
                  type="button"
                  onClick={() => setAvatarUrl(null)}
                  className="flex items-center gap-1.5 rounded-xl border border-border/70 px-3 py-2 text-xs font-medium text-destructive"
                >
                  <Trash2 className="size-3.5" />
                  Remover foto
                </button>
              ) : null}
            </div>
          </div>

          <div className="space-y-2 pt-1">
            <p className="text-xs text-muted-foreground">Ou escolha um ícone:</p>
            <div className="flex flex-wrap gap-2">
              {ICONES.map(({ id, Icone }) => (
                <button
                  key={id}
                  type="button"
                  onClick={() => escolherIcone(id)}
                  className="flex size-9 items-center justify-center rounded-full border transition-colors"
                  style={{
                    backgroundColor: avatarIcone === id ? avatarCor ?? CORES[0] : "transparent",
                    borderColor: avatarIcone === id ? "transparent" : "var(--border)",
                    color: avatarIcone === id ? "#fff" : "var(--muted-foreground)",
                  }}
                >
                  <Icone className="size-4" />
                </button>
              ))}
            </div>
            {avatarIcone ? (
              <div className="flex flex-wrap gap-2 pt-1">
                {CORES.map((cor) => (
                  <button
                    key={cor}
                    type="button"
                    onClick={() => setAvatarCor(cor)}
                    className="size-6 rounded-full"
                    style={{ backgroundColor: cor, boxShadow: avatarCor === cor ? `0 0 0 2px ${cor}` : undefined }}
                  />
                ))}
              </div>
            ) : null}
          </div>
        </div>

        <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Informações</p>

          <label className="block text-xs font-medium text-muted-foreground">
            Nome público (aparece no ranking)
            <input
              value={apelido}
              onChange={(e) => setApelido(e.target.value)}
              maxLength={30}
              className="mt-1 w-full rounded-xl border border-border/70 bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
          </label>

          <label className="block text-xs font-medium text-muted-foreground">
            Instituição / faculdade
            <input
              value={instituicao}
              onChange={(e) => setInstituicao(e.target.value)}
              maxLength={80}
              placeholder="Ex: UFBA"
              className="mt-1 w-full rounded-xl border border-border/70 bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
          </label>

          <label className="block text-xs font-medium text-muted-foreground">
            Área de interesse
            <input
              value={areaInteresse}
              onChange={(e) => setAreaInteresse(e.target.value)}
              maxLength={80}
              placeholder="Ex: Clínica médica, generalista de UPA"
              className="mt-1 w-full rounded-xl border border-border/70 bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
          </label>

          <label className="block text-xs font-medium text-muted-foreground">
            Bio curta ({bio.length}/200)
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value.slice(0, 200))}
              rows={3}
              placeholder="Uma frase curta sobre você"
              className="mt-1 w-full resize-none rounded-xl border border-border/70 bg-surface px-3 py-2.5 text-sm outline-none focus:border-primary"
            />
          </label>
        </div>
        <div className="space-y-3 rounded-2xl border border-border/60 bg-card p-5">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Privacidade no ranking
          </p>
          <AlternarVisibilidade
            titulo="Aparecer no ranking"
            descricao="Se desligar, você some da lista de todo mundo (some da semanal e da geral)."
            valor={rankingVisivel}
            aoAlterar={setRankingVisivel}
          />
          <AlternarVisibilidade
            titulo="Mostrar minha taxa de acerto"
            descricao="Se desligar, os outros continuam vendo seu nome e pontos, mas não seus acertos."
            valor={rankingTaxaVisivel}
            aoAlterar={setRankingTaxaVisivel}
          />
        </div>

        {salvar.isError ? (
          <p className="rounded-xl border border-destructive/50 bg-destructive/10 p-3 text-xs text-destructive">
            {(salvar.error as Error).message}
          </p>
        ) : null}

        <button
          onClick={() => salvar.mutate()}
          disabled={salvar.isPending}
          className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-3 text-sm font-semibold text-primary-foreground disabled:opacity-70"
        >
          {salvar.isPending ? <Loader2 className="size-4 animate-spin" /> : null}
          {salvo ? "Salvo!" : "Salvar alterações"}
        </button>
      </div>
    </AppShell>
  );
}
function AlternarVisibilidade({
  titulo,
  descricao,
  valor,
  aoAlterar,
}: {
  titulo: string;
  descricao: string;
  valor: boolean;
  aoAlterar: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl border border-border/70 p-3">
      <div>
        <p className="text-sm font-medium">{titulo}</p>
        <p className="text-xs text-muted-foreground">{descricao}</p>
      </div>
      <button
        type="button"
        onClick={() => aoAlterar(!valor)}
        className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
          valor ? "bg-primary" : "border border-border/70 bg-surface"
        }`}
      >
        <span
          className={`absolute top-0.5 size-5 rounded-full bg-white transition-transform ${
            valor ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </button>
    </div>
  );
}
