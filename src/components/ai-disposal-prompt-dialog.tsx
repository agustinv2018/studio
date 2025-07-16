"use client";

import { useState } from "react";
import { Sparkles } from "lucide-react";
import type { Asset } from "@/lib/types";
import { disposeAssetsFromPrompt } from "@/ai/flows/prompt-disposal";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

type AiDisposalPromptDialogProps = {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  assets: Asset[];
  onSuggestDisposal: (assetIds: string[]) => void;
};

export function AiDisposalPromptDialog({ isOpen, onOpenChange, assets, onSuggestDisposal }: AiDisposalPromptDialogProps) {
  const [prompt, setPrompt] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async () => {
    if (!prompt) return;
    setIsLoading(true);
    try {
      const result = await disposeAssetsFromPrompt({
        prompt: prompt,
        assets: assets.map(a => ({...a, purchaseDate: a.purchaseDate.toISOString()})),
      });
      const suggestedIds = result.map((r: any) => r.id);
      onSuggestDisposal(suggestedIds);
      onOpenChange(false);
      setPrompt("");
      if (suggestedIds.length > 0) {
        toast({
            title: "Sugerencias de IA listas",
            description: `Se encontraron ${suggestedIds.length} activos que coinciden con sus criterios.`
        })
      } else {
        toast({
            title: "No se encontraron activos",
            description: "La IA no pudo encontrar ningún activo que coincida con sus criterios."
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Falló la sugerencia de IA",
        description: "No se pudieron obtener sugerencias en este momento.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Asistente de Eliminación con IA</DialogTitle>
          <DialogDescription>
            Describe los activos que quieres considerar para su eliminación. Por ejemplo, "portátiles de más de 4 años" o "monitores de Dell comprados antes de 2020".
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full gap-1.5">
            <Label htmlFor="prompt">Tu indicación</Label>
            <Textarea 
                id="prompt" 
                placeholder="Escribe tus criterios aquí..." 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isLoading || !prompt}>
            {isLoading ? "Pensando..." : <><Sparkles className="mr-2 h-4 w-4" /> Obtener Sugerencias</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
