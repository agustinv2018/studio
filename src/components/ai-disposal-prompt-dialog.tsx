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
            title: "AI Suggestions Ready",
            description: `Found ${suggestedIds.length} assets matching your criteria.`
        })
      } else {
        toast({
            title: "No assets found",
            description: "AI couldn't find any assets matching your criteria."
        })
      }
    } catch (error) {
      toast({
        variant: "destructive",
        title: "AI Suggestion Failed",
        description: "Could not get suggestions at this time.",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>AI Disposal Assistant</DialogTitle>
          <DialogDescription>
            Describe the assets you want to consider for disposal. For example, "laptops older than 4 years" or "monitors from Dell purchased before 2020".
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full gap-1.5">
            <Label htmlFor="prompt">Your prompt</Label>
            <Textarea 
                id="prompt" 
                placeholder="Type your criteria here..." 
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                rows={4}
            />
          </div>
        </div>
        <DialogFooter>
          <Button onClick={handleSubmit} disabled={isLoading || !prompt}>
            {isLoading ? "Thinking..." : <><Sparkles className="mr-2 h-4 w-4" /> Get Suggestions</>}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
