import { supabase } from "@/integrations/supabase/client";

export type Perfil = {
  id: string;
  apelido: string;
  avatarUrl: string | null;
  avatarIcone: string | null;
  avatarCor: string | null;
  instituicao: string | null;
  areaInteresse: string | null;
  bio: string | null;
  rankingVisivel: boolean;
  rankingTaxaVisivel: boolean;
};

const CAMPOS =
  "id, apelido, avatar_url, avatar_icone, avatar_cor, instituicao, area_interesse, bio, ranking_visivel, ranking_taxa_visivel";

function normalizar(linha: {
  id: string;
  apelido: string;
  avatar_url: string | null;
  avatar_icone: string | null;
  avatar_cor: string | null;
  instituicao: string | null;
  area_interesse: string | null;
  bio: string | null;
  ranking_visivel: boolean;
  ranking_taxa_visivel: boolean;
}): Perfil {
  return {
    id: linha.id,
    apelido: linha.apelido,
    avatarUrl: linha.avatar_url,
    avatarIcone: linha.avatar_icone,
    avatarCor: linha.avatar_cor,
    instituicao: linha.instituicao,
    areaInteresse: linha.area_interesse,
    bio: linha.bio,
    rankingVisivel: linha.ranking_visivel,
    rankingTaxaVisivel: linha.ranking_taxa_visivel,
  };
}

export async function buscarPerfil(userId: string): Promise<Perfil | null> {
  const { data, error } = await supabase.from("profiles").select(CAMPOS).eq("id", userId).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? normalizar(data) : null;
}

export type CamposPerfil = {
  apelido: string;
  avatarUrl: string | null;
  avatarIcone: string | null;
  avatarCor: string | null;
  instituicao: string;
  areaInteresse: string;
  bio: string;
  rankingVisivel: boolean;
  rankingTaxaVisivel: boolean;
};

export async function salvarPerfil(userId: string, campos: CamposPerfil) {
  const { error } = await supabase
    .from("profiles")
    .update({
      apelido: campos.apelido.trim().slice(0, 30) || "Estudante",
      avatar_url: campos.avatarUrl,
      avatar_icone: campos.avatarIcone,
      avatar_cor: campos.avatarCor,
      instituicao: campos.instituicao.trim().slice(0, 80) || null,
      area_interesse: campos.areaInteresse.trim().slice(0, 80) || null,
      bio: campos.bio.trim().slice(0, 200) || null,
      ranking_visivel: campos.rankingVisivel,
      ranking_taxa_visivel: campos.rankingTaxaVisivel,
    })
    .eq("id", userId);
  if (error) throw new Error(error.message);
}

/** Envia a foto pro bucket 'avatars' (uma pasta por usuário) e devolve a URL pública. Não salva no perfil ainda — isso acontece quando a pessoa clica em "Salvar". */
export async function enviarArquivoAvatar(userId: string, arquivo: File): Promise<string> {
  const extensao = arquivo.name.split(".").pop() ?? "jpg";
  const caminho = `${userId}/avatar-${Date.now()}.${extensao}`;
  const { error } = await supabase.storage.from("avatars").upload(caminho, arquivo, { upsert: true });
  if (error) throw new Error(error.message);
  return supabase.storage.from("avatars").getPublicUrl(caminho).data.publicUrl;
}
