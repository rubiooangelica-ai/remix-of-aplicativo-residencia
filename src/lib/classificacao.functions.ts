/** Ações administrativas da reorganização determinística da taxonomia (sem IA). */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

async function admin(userId: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data, error } = await supabaseAdmin.rpc("is_admin", { uid: userId });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Apenas administradores podem reorganizar a taxonomia.");
  return supabaseAdmin;
}

export const progressoClassificacao = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await admin(context.userId);
    const { data, error } = await db.rpc("class_progresso");
    if (error) throw new Error(error.message);
    const l = Array.isArray(data) ? data[0] : data;
    return {
      total: Number(l?.total ?? 0),
      classificadas: Number(l?.classificadas ?? 0),
      pendentes: Number(l?.pendentes ?? 0),
      alta: Number(l?.alta ?? 0),
      media: Number(l?.media ?? 0),
      baixa: Number(l?.baixa ?? 0),
    };
  });

export const validarClassificacao = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await admin(context.userId);
    const { data, error } = await db.rpc("class_validar");
    if (error) throw new Error(error.message);
    const l = Array.isArray(data) ? data[0] : data;
    return {
      semArea: Number(l?.sem_area ?? 0),
      semTema: Number(l?.sem_tema ?? 0),
      semAssunto: Number(l?.sem_assunto ?? 0),
      foraDaTaxonomia: Number(l?.fora_da_taxonomia ?? 0),
      areas: Number(l?.areas ?? 0),
      temas: Number(l?.temas ?? 0),
      assuntos: Number(l?.assuntos ?? 0),
    };
  });

export const sincronizarArvoreOficial = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await admin(context.userId);
    const { sincronizarArvore } = await import("./classificacao/migracao.server");
    return sincronizarArvore();
  });

export const rodarLoteClassificacao = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ tamanho_lote: z.number().int().min(1).max(1000).default(500) }).parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    await admin(context.userId);
    const { processarLoteClassificacao } = await import("./classificacao/migracao.server");
    return processarLoteClassificacao(data.tamanho_lote);
  });
