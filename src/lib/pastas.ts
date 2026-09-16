import { supabase } from "@/integrations/supabase/client";

export type Pasta = { id: string; nome: string; created_at: string };

export async function buscarPastas(userId: string): Promise<Pasta[]> {
  const { data, error } = await supabase
    .from("pastas")
    .select("id, nome, created_at")
    .eq("user_id", userId)
    .order("nome");
  if (error) throw new Error(error.message);
  return data ?? [];
}

export async function criarPasta(userId: string, nome: string): Promise<Pasta> {
  const { data, error } = await supabase
    .from("pastas")
    .insert({ user_id: userId, nome })
    .select("id, nome, created_at")
    .single();
  if (error) throw new Error(error.message);
  return data;
}
export async function removerPasta(id: string) {
  const { error } = await supabase.from("pastas").delete().eq("id", id);
  if (error) throw new Error(error.message);
}
