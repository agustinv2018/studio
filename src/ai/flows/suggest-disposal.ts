// src/ai/flows/suggest-disposal.ts
'use server';

/**
 * @fileOverview A flow to suggest IT assets for disposal based on their purchase date.
 *
 * - suggestDisposal - A function that suggests IT assets for disposal.
 * - SuggestDisposalInput - The input type for the suggestDisposal function.
 * - SuggestDisposalOutput - The return type for the suggestDisposal function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SuggestDisposalInputSchema = z.object({
  assetDetails: z
    .string()
    .describe(
      'The details of the IT asset, including product type, model, serial number, and purchase date.'
    ),
  disposalReason: z
    .string()
    .optional()
    .describe('Optional: Reason for disposal consideration.'),
});
export type SuggestDisposalInput = z.infer<typeof SuggestDisposalInputSchema>;

const SuggestDisposalOutputSchema = z.object({
  shouldDispose: z
    .boolean()
    .describe(
      'Whether the asset should be disposed of based on its age and condition.'
    ),
  reason: z
    .string()
    .describe('The detailed reason for suggesting disposal of the asset.'),
});
export type SuggestDisposalOutput = z.infer<typeof SuggestDisposalOutputSchema>;

export async function suggestDisposal(input: SuggestDisposalInput): Promise<SuggestDisposalOutput> {
  return suggestDisposalFlow(input);
}

const prompt = ai.definePrompt({
  name: 'suggestDisposalPrompt',
  input: {schema: SuggestDisposalInputSchema},
  output: {schema: SuggestDisposalOutputSchema},
  prompt: `You are an IT asset management expert. Analyze the following asset details and determine if it should be disposed of.

Asset Details: {{{assetDetails}}}

Optional Disposal Reason: {{{disposalReason}}}

Consider the purchase date and the typical lifespan of the asset type. Provide a detailed reason for your suggestion.

Output should be in JSON format.
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
