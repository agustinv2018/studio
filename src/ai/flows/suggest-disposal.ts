// src/ai/flows/suggest-disposal.ts
'use server';

/**
 * @fileOverview Un flujo para sugerir activos de TI para su eliminación en función de su fecha de compra.
 *
 * - suggestDisposal - Una función que sugiere activos de TI para su eliminación.
 * - SuggestDisposalInput - El tipo de entrada para la función suggestDisposal.
 * - SuggestDisposalOutput - El tipo de retorno para la función suggestDisposal.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestDisposalInputSchema = z.object({
  assetDetails: z
    .string()
    .describe(
      'Los detalles del activo de TI, incluyendo tipo de producto, modelo, número de serie y fecha de compra.'
    ),
  disposalReason: z
    .string()
    .optional()
    .describe('Opcional: Razón para la consideración de la eliminación.'),
});
export type SuggestDisposalInput = z.infer<typeof SuggestDisposalInputSchema>;

const SuggestDisposalOutputSchema = z.object({
  shouldDispose: z
    .boolean()
    .describe(
      'Si el activo debe ser eliminado en función de su antigüedad y estado.'
    ),
  reason: z
    .string()
    .describe('La razón detallada para sugerir la eliminación del activo.'),
});
export type SuggestDisposalOutput = z.infer<typeof SuggestDisposalOutputSchema>;

export async function suggestDisposal(input: SuggestDisposalInput): Promise<SuggestDisposalOutput> {
  return suggestDisposalFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestDisposalPrompt',
  input: {schema: SuggestDisposalInputSchema},
  output: {schema: SuggestDisposalOutputSchema},
  prompt: `Eres un experto en gestión de activos de TI. Analiza los siguientes detalles del activo y determina si debe ser eliminado. Considera que la vida útil de los activos tecnológicos es de 5 años.

Detalles del activo: {{{assetDetails}}}

Razón opcional para la eliminación: {{{disposalReason}}}

Considera la fecha de compra y la vida útil típica del tipo de activo. Proporciona una razón detallada para tu sugerencia.

La salida debe estar en formato JSON.
`,
});

const suggestDisposalFlow = ai.defineFlow(
  {
    name: 'suggestDisposalFlow',
    inputSchema: SuggestDisposalInputSchema,
    outputSchema: SuggestDisposalOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
