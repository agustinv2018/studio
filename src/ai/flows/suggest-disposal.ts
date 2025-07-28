import { z } from "zod";

export const SuggestDisposalOutputSchema = z.object({
  suggested: z.array(z.string()),
});

export type SuggestDisposalOutput = z.infer<typeof SuggestDisposalOutputSchema>;

/**
 * 🔧 Simulación de IA — reemplazar por integración real
 */
export async function suggestDisposal(assets: { id: string; estado: string }[]): Promise<SuggestDisposalOutput> {
  const suggested = assets
    .filter((a) => a.estado === "inactivo" || a.estado === "defectuoso" || a.estado === "baja")
    .map((a) => a.id);

  return { suggested };
}
