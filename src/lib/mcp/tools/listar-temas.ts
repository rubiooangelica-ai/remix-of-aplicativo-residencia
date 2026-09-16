import { defineTool } from "@lovable.dev/mcp-js";
import { z } from "zod";
import { supabaseForUser } from "../supabase";

export default defineTool({
  name: "listar_temas",
  title: "Listar áreas e temas",
  description:
    "Lista as grandes áreas do banco e seus temas (especialidades). Informe uma área para ver apenas os temas dela.",
  inputSchema: {
    area: z.string().optional().describe("Nome da grande área, ex.: Clínica Médica."),
  },
  annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
  handler: async ({ area }, ctx) => {
    if (!ctx.isAuthenticated())
      return { content: [{ type: "text", text: "Não autenticado." }], isError: true };
    const supabase = supabaseForUser(ctx);
    const [areasRes, espRes] = await Promise.all([
      supabase.from("areas").select("id, nome, ordem").order("ordem"),
      supabase.from("especialidades").select("id, area_id, nome").order("nome"),
    ]);
    const error = areasRes.error ?? espRes.error;
    if (error) return { content: [{ type: "text", text: error.message }], isError: true };

    const filtro = area?.trim().toLowerCase();
    const areas = (areasRes.data ?? [])
      .filter((a) => !filtro || a.nome.toLowerCase().includes(filtro))
      .map((a) => ({
        area: a.nome,
        temas: (espRes.data ?? []).filter((e) => e.area_id === a.id).map((e) => e.nome),
      }));

    return {
      content: [
        {
          type: "text",
          text: areas.length
            ? areas.map((a) => `${a.area}:\n- ${a.temas.join("\n- ")}`).join("\n\n")
            : "Nenhuma área encontrada.",
        },
      ],
      structuredContent: { areas },
    };
  },
});
