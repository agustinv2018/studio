// src/ai/flows/prompt-disposal.ts
'use server';

/**
 * @fileOverview A flow for suggesting assets for disposal based on a prompt.
 *
 * - disposeAssetsFromPrompt - A function that suggests assets for disposal based on a prompt.
 * - DisposeAssetsFromPromptInput - The input type for the disposeAssetsFromPrompt function.
 * - DisposeAssetsFromPromptOutput - The return type for the disposeAssetsFromPrompt function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const DisposeAssetsFromPromptInputSchema = z.object({
  prompt: z.string().describe('A description of the attributes of assets to dispose of.'),
  assets: z.array(z.record(z.any())).describe('The list of assets to evaluate.'),
});
export type DisposeAssetsFromPromptInput = z.infer<typeof DisposeAssetsFromPromptInputSchema>;

const DisposeAssetsFromPromptOutputSchema = z.array(z.record(z.any())).describe('The assets suggested for disposal.');
export type DisposeAssetsFromPromptOutput = z.infer<typeof DisposeAssetsFromPromptOutputSchema>;

export async function disposeAssetsFromPrompt(input: DisposeAssetsFromPromptInput): Promise<DisposeAssetsFromPromptOutput> {
  return disposeAssetsFromPromptFlow(input);
}

const prompt = ai.definePrompt({
  name: 'disposeAssetsFromPromptPrompt',
  input: {schema: DisposeAssetsFromPromptInputSchema},
  output: {schema: DisposeAssetsFromPromptOutputSchema},
  prompt: `You are an expert IT asset manager.

You will be provided with a list of assets and a description of the attributes of assets that should be disposed of.

Your job is to return a list of assets that match the description.

Description: {{{prompt}}}

Assets: {{{assets}}}

Return only the assets that match the description. Do not include any other information.`,
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
