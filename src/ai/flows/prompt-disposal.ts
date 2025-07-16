// src/ai/flows/prompt-disposal.ts
'use server';

/**
 * @fileOverview Un flujo para sugerir activos para su eliminación basándose en una indicación.
 *
 * - disposeAssetsFromPrompt - Una función que sugiere activos para su eliminación basándose en una indicación.
 * - DisposeAssetsFromPromptInput - El tipo de entrada para la función disposeAssetsFromPrompt.
 * - DisposeAssetsFromPromptOutput - El tipo de retorno para la función disposeAssetsFromPrompt.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DisposeAssetsFromPromptInputSchema = z.object({
  prompt: z.string().describe('Una descripción de los atributos de los activos a eliminar.'),
  assets: z.array(z.record(z.any())).describe('La lista de activos a evaluar.'),
});
export type DisposeAssetsFromPromptInput = z.infer<typeof DisposeAssetsFromPromptInputSchema>;

const DisposeAssetsFromPromptOutputSchema = z.array(z.record(z.any())).describe('Los activos sugeridos para su eliminación.');
export type DisposeAssetsFromPromptOutput = z.infer<typeof DisposeAssetsFromPromptOutputSchema>;

export async function disposeAssetsFromPrompt(input: DisposeAssetsFromPromptInput): Promise<DisposeAssetsFromPromptOutput> {
  return disposeAssetsFromPromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'disposeAssetsFromPromptPrompt',
  input: {schema: DisposeAssetsFromPromptInputSchema},
  output: {schema: DisposeAssetsFromPromptOutputSchema},
  prompt: `Eres un experto gestor de activos de TI.

Se te proporcionará una lista de activos y una descripción de los atributos de los activos que deben ser eliminados.

Tu trabajo es devolver una lista de activos que coincidan con la descripción.

Descripción: {{{prompt}}}

Activos: {{{assets}}}

Devuelve solo los activos que coincidan con la descripción. No incluyas ninguna otra información.`,
});

const disposeAssetsFromPromptFlow = ai.defineFlow(
  {
    name: 'disposeAssetsFromPromptFlow',
    inputSchema: DisposeAssetsFromPromptInputSchema,
    outputSchema: DisposeAssetsFromPromptOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
