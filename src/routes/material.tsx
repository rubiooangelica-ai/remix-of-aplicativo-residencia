import { useState } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, GraduationCap, Lock, Search, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { AtalhosMaterial, MarkdownMaterial } from "@/components/MaterialLeitura";
import { iconePorEspecialidade } from "@/components/BancoFiltros";
import { MATERIAL_CALENDARIO_VACINAL } from "@/data/material-calendario-vacinal";
import { useEhAdmin } from "@/lib/admin";
import { buscarTaxonomia } from "@/lib/banco";
import { buscarMateriais, type Material } from "@/lib/conteudo";
import { analisarMaterial } from "@/lib/material-secoes";
import { ordenarMateriais, vincularMateriaisNaTaxonomiaExistente } from "@/lib/material-taxonomia";
import { buscarStatusPlano } from "@/lib/plano";

export const Route = createFileRoute("/material")({
  head: () => ({ meta: [{ title: "Material de estudos — ResidênciaPro" }] }),
  component: MaterialPage,
});

function normalizarTitulo(valor: string) {
  return valor.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

function juntarComMateriaisLocais(materiaisBanco: Material[]) {
  const resultado = [...materiaisBanco];
  const locais = [MATERIAL_CALENDARIO_VACINAL];

  for (const local of locais) {
    const existe = resultado.some(
      (material) => material.id === local.id || normalizarTitulo(material.titulo) === normalizarTitulo(local.titulo),
    );
    if (!existe) resultado.push(local);
  }

  return resultado;
}

function MaterialPage() {
  const { ehAdmin } = useEhAdmin();
  const tax = useQuery({ queryKey: ["taxonomia"], queryFn: buscarTaxonomia });
  const materiaisQuery = useQuery({
    queryKey: ["materiais", ehAdmin],
    queryFn: () => buscarMateriais({ incluirRascunhos: ehAdmin }),
    retry: false,
  });
  const plano = useQuery({ queryKey: ["status-plano"], queryFn: buscarStatusPlano, retry: false });
  const materiaisBase = ordenarMateriais(juntarComMateriaisLocais(materiaisQuery.data ?? []));
  const materiais = vincularMateriaisNaTaxonomiaExistente(materiaisBase, tax.data);
  const premium = ehAdmin || plano.data?.premium === true;
  const [areaAberta, setAreaAberta] = useState<string | null>(null);
  const [especialidadeAberta, setEspecialidadeAberta] = useState<string | null>(null);
  const [materialAberto, setMaterialAberto] = useState<string | null>(null);
  const [busca, setBusca] = useState("");

  const areas = tax.data?.areas ?? [];
  const especialidades = tax.data?.especialidades ?? [];
  const espIds = new Set(materiais.map((m) => m.especialidadeId).filter(Boolean));
  const espComMaterial = especialidades.filter((e) => espIds.has(e.id));
  const areasComMaterial = areas.filter((a) => espComMaterial.some((e) => e.area_id === a.id));
  const materiaisSemVinculo = materiais.filter((m) => !m.areaId && !m.especialidadeId && !m.assuntoId);
  const material = materialAberto ? materiais.find((m) => m.id === materialAberto) : null;

  if (material) {
    const secoes = analisarMaterial(material.conteudo);
    return (
      <AppShell titulo="Material de estudos">
        <button onClick={() => setMaterialAberto(null)} className="mb-4 flex items-center gap-1.5 text-xs font-medium text-primary">
          <ChevronLeft className="size-3.5" /> Voltar
        </button>
        <article className="rounded-2xl border border-border/60 bg-card p-4 sm:p-5">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h1 className="font-display text-3xl font-bold leading-tight sm:text-4xl">{material.titulo}</h1>
              {material.subtitulo ? <p className="mt-2 max-w-4xl text-base leading-relaxed text-muted-foreground">{material.subtitulo}</p> : null}
            </div>
            {ehAdmin ? <StatusMaterial status={material.status} /> : null}
          </div>

          {premium ? (
            <>
              {material.pontosProva.length ? (
                <div className="mt-4 rounded-2xl border border-primary/30 bg-primary/10 p-4">
                  <p className="text-sm font-bold uppercase tracking-wide text-primary">Pontos de prova</p>
                  <ul className="mt-3 space-y-2 text-base leading-7 text-foreground/90">
                    {material.pontosProva.map((ponto) => <li key={ponto}>• {ponto}</li>)}
                  </ul>
                </div>
              ) : null}

              <AtalhosMaterial
                sumario={secoes.sumario}
                casosRapidos={secoes.casosRapidos}
                pegadinhas={secoes.pegadinhas}
                revisaoRapida={secoes.revisaoRapida}
              />

              <div className="mt-6">
                <MarkdownMaterial conteudo={secoes.corpo} comAncoras />
              </div>

              {material.imagens.filter((img) => !material.conteudo.includes(img.url)).length ? (
                <div className="mt-5 grid gap-3">
                  {material.imagens
                    .filter((img) => !material.conteudo.includes(img.url))
                    .map((img) => (
                      <figure key={img.url} className="overflow-hidden rounded-2xl border border-border/60 bg-surface">
                        <img src={img.url} alt={img.legenda ?? "Imagem do resumo"} className="w-full object-contain" />
                        {img.legenda || img.fonte ? (
                          <figcaption className="px-3 py-2 text-[11px] text-muted-foreground">
                            {img.legenda}{img.fonte ? ` Fonte: ${img.fonte}` : ""}
                          </figcaption>
                        ) : null}
                      </figure>
                    ))}
                </div>
              ) : null}

              {material.fontes.length ? (
                <div className="mt-6 rounded-2xl border border-border/60 bg-surface p-4">
                  <p className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Fontes usadas</p>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                    {material.fontes.map((fonte, i) => (
                      <li key={`${fonte.titulo}-${i}`}>
                        • {fonte.titulo}{fonte.ano ? ` (${fonte.ano})` : ""}{fonte.referencia ? ` — ${fonte.referencia}` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              ) : null}
            </>
          ) : (
            <PaywallResumo conteudo={secoes.corpo} />
          )}
        </article>
      </AppShell>
    );
  }

  const termo = busca.trim().toLowerCase();
  const resultados = termo ? materiais.filter((m) => `${m.titulo} ${m.subtitulo ?? ""}`.toLowerCase().includes(termo)) : [];

  return (
    <AppShell titulo="Material de estudos" descricao="Resumos organizados por área e especialidade.">
      <div className="space-y-4">
        {!premium ? (
          <div className="rounded-2xl border border-primary/40 bg-primary/10 p-4">
            <p className="flex items-center gap-2 text-sm font-semibold text-primary">
              <Sparkles className="size-4" /> Conteúdo Premium
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Você pode explorar todos os resumos e ler o começo. A leitura completa é liberada no Premium.
            </p>
          </div>
        ) : null}

        <div className="flex items-center gap-2 rounded-xl border border-border/70 bg-surface px-3 py-2.5">
          <Search className="size-4 text-muted-foreground" />
          <input value={busca} onChange={(e) => setBusca(e.target.value)} placeholder="Pesquisar resumos..." className="w-full bg-transparent text-sm outline-none" />
        </div>

        {termo ? (
          <Grade materiais={resultados} abrir={setMaterialAberto} bloqueado={!premium} ehAdmin={ehAdmin} />
        ) : especialidadeAberta ? (
          <>
            <Voltar texto={especialidades.find((e) => e.id === especialidadeAberta)?.nome ?? "Especialidade"} acao={() => setEspecialidadeAberta(null)} />
            <Grade materiais={materiais.filter((m) => m.especialidadeId === especialidadeAberta)} abrir={setMaterialAberto} bloqueado={!premium} ehAdmin={ehAdmin} />
          </>
        ) : areaAberta ? (
          <>
            <Voltar texto={areas.find((a) => a.id === areaAberta)?.nome ?? "Área"} acao={() => setAreaAberta(null)} />
            <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
              {espComMaterial.filter((e) => e.area_id === areaAberta).map((e) => {
                const Icone = iconePorEspecialidade(e.nome);
                return (
                  <button key={e.id} onClick={() => setEspecialidadeAberta(e.id)} className="flex min-h-32 flex-col items-start justify-between rounded-2xl border border-border/70 bg-surface p-3 text-left">
                    <Icone className="size-7" />
                    <span className="text-sm font-semibold">{e.nome}</span>
                    <span className="text-[11px] text-muted-foreground">{materiais.filter((m) => m.especialidadeId === e.id).length} resumos</span>
                  </button>
                );
              })}
            </div>
          </>
        ) : (
          <div className="space-y-5">
            {areasComMaterial.length ? (
              <section>
                <h2 className="mb-3 text-sm font-semibold">Áreas com resumos</h2>
                <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {areasComMaterial.map((a) => {
                    const Icone = iconePorEspecialidade(a.nome);
                    const n = materiais.filter((m) => espComMaterial.some((e) => e.id === m.especialidadeId && e.area_id === a.id)).length;
                    return (
                      <button key={a.id} onClick={() => setAreaAberta(a.id)} className="flex min-h-32 flex-col items-start justify-between rounded-2xl border border-border/70 bg-surface p-3 text-left">
                        <Icone className="size-7" />
                        <span className="text-sm font-semibold">{a.nome}</span>
                        <span className="text-[11px] text-muted-foreground">{n} resumos</span>
                      </button>
                    );
                  })}
                </div>
              </section>
            ) : null}

            {materiaisSemVinculo.length ? (
              <section>
                <h2 className="mb-1 text-sm font-semibold">Resumos em revisão</h2>
                <p className="mb-3 text-xs text-muted-foreground">Materiais disponíveis que ainda não foram vinculados à taxonomia publicada.</p>
                <Grade materiais={materiaisSemVinculo} abrir={setMaterialAberto} bloqueado={!premium} ehAdmin={ehAdmin} />
              </section>
            ) : null}

            {!areasComMaterial.length && !materiaisSemVinculo.length ? <p className="text-sm text-muted-foreground">Nenhum resumo encontrado.</p> : null}
          </div>
        )}
      </div>
    </AppShell>
  );
}

function StatusMaterial({ status }: { status: Material["status"] }) {
  const texto = status === "publicado" ? "Publicado" : status === "revisao" ? "Revisão" : status === "arquivado" ? "Arquivado" : "Rascunho";
  return <span className="rounded-full border border-border/60 bg-surface px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">{texto}</span>;
}

function PaywallResumo({ conteudo }: { conteudo: string }) {
  const limite = Math.min(1800, Math.max(700, Math.floor(conteudo.length * 0.4)));
  const corteInicial = conteudo.slice(0, limite);
  const ultimoEspaco = corteInicial.lastIndexOf(" ");
  const previa = conteudo.length > limite
    ? `${corteInicial.slice(0, ultimoEspaco > limite * 0.8 ? ultimoEspaco : limite).trim()}…`
    : corteInicial;
  const permiteRolagem = previa.length > 900;

  return (
    <div className="mt-5">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-primary">Prévia gratuita</p>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {permiteRolagem ? "Role para ler o início deste resumo." : "Leia o início deste resumo."}
          </p>
        </div>
        <span className="shrink-0 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-primary">
          Início liberado
        </span>
      </div>

      <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card">
        <div className="max-h-[420px] overflow-y-auto overscroll-contain p-4 pb-24 sm:max-h-[480px] sm:p-5 sm:pb-28">
          <MarkdownMaterial conteudo={previa} />
        </div>
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-card via-card/95 to-transparent sm:h-28" />
      </div>

      <div className="relative -mt-5 rounded-2xl border border-primary/40 bg-card p-5 text-center shadow-lg">
        <Lock className="mx-auto size-6 text-primary" />
        <p className="mt-2 font-semibold">Continue lendo com Premium</p>
        <p className="mx-auto mt-1 max-w-sm text-xs text-muted-foreground">
          Desbloqueie o restante do resumo, os pontos de prova, os casos rápidos, as pegadinhas e a revisão completa.
        </p>
        <Link to="/premium" className="mt-4 inline-flex rounded-xl bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground">
          Conhecer Premium
        </Link>
      </div>
    </div>
  );
}

function Grade({ materiais, abrir, bloqueado, ehAdmin }: { materiais: Material[]; abrir: (id: string) => void; bloqueado: boolean; ehAdmin: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
      {materiais.map((m) => (
        <button key={m.id} onClick={() => abrir(m.id)} className="relative flex min-h-28 flex-col items-start justify-between rounded-2xl border border-border/70 bg-surface p-3 text-left">
          <GraduationCap className="size-6 text-primary" />
          {bloqueado ? <Lock className="absolute right-3 top-3 size-3.5 text-muted-foreground" /> : null}
          {ehAdmin && m.status !== "publicado" ? <span className="absolute right-3 top-3 rounded-full bg-warning/15 px-2 py-0.5 text-[9px] font-semibold uppercase text-warning">{m.status}</span> : null}
          <span className="mt-3 text-sm font-semibold leading-tight">{m.titulo}</span>
          {m.subtitulo ? <span className="mt-1 line-clamp-2 text-[10px] text-muted-foreground">{m.subtitulo}</span> : null}
        </button>
      ))}
      {!materiais.length ? <p className="col-span-full text-sm text-muted-foreground">Nenhum resumo encontrado.</p> : null}
    </div>
  );
}

function Voltar({ texto, acao }: { texto: string; acao: () => void }) {
  return <button onClick={acao} className="flex items-center gap-1.5 text-xs font-medium text-primary"><ChevronLeft className="size-3.5" /> {texto}</button>;
}
