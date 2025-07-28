"use server";

import { z } from "zod";
import { defineFlow, openai } from "genkit";
import { SuggestDisposalOutputSchema } from "./suggest-disposal";

export const disposeAssetsFromPrompt = defineFlow({
  name: "dispose-assets-from-prompt",
  inputSchema: z.string(),
  outputSchema: SuggestDisposalOutputSchema,
  handler: async (prompt) => {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content:
            "Sos un experto en IT y gestión de activos. Tu tarea es analizar activos que podrían darse de baja según el criterio del usuario.",
        },
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const jsonStart = response.choices[0].message.content?.indexOf("{");
    const json = response.choices[0].message.content?.slice(jsonStart).trim();

    return JSON.parse(json || "{}");
  },
});
