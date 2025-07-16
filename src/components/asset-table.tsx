"use client";

import { useState } from "react";
import { format } from "date-fns";
import { MoreHorizontal, Bot, Archive, Trash2 } from "lucide-react";
import type { Asset, AssetStatus } from "@/lib/types";
import { suggestDisposal, type SuggestDisposalOutput } from "@/ai/flows/suggest-disposal";
import { cn } from "@/lib/utils";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "./ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "./ui/skeleton";

type AssetTableProps = {
  assets: Asset[];
  onUpdateStatus: (assetId: string, status: AssetStatus) => void;
  onDelete: (assetId: string) => void;
  highlightedRows?: string[];
};

export function AssetTable({ assets, onUpdateStatus, onDelete, highlightedRows = [] }: AssetTableProps) {
  const [aiSuggestion, setAiSuggestion] = useState<SuggestDisposalOutput | null>(null);
  const [isSuggestionLoading, setSuggestionLoading] = useState(false);
  const [isAlertOpen, setAlertOpen] = useState(false);
  const { toast } = useToast();

  const handleGetAiSuggestion = async (asset: Asset) => {
    setSuggestionLoading(true);
    setAiSuggestion(null);
    setAlertOpen(true);
    try {
      const suggestion = await suggestDisposal({
        assetDetails: `Product: ${asset.productType}, Model: ${asset.model}, Purchase Date: ${asset.purchaseDate.toISOString()}`,
      });
      setAiSuggestion(suggestion);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "AI Suggestion Failed",
        description: "Could not get a suggestion at this time.",
      });
      setAlertOpen(false);
    } finally {
      setSuggestionLoading(false);
    }
  };

  const closeAlert = () => {
    setAlertOpen(false);
    setAiSuggestion(null);
  }

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Status</TableHead>
              <TableHead>Product Type</TableHead>
              <TableHead>Model</TableHead>
              <TableHead>Serial Number</TableHead>
              <TableHead>Purchase Date</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.length > 0 ? (
              assets.map((asset) => (
                <TableRow key={asset.id} className={cn(highlightedRows.includes(asset.id) && "bg-orange-100 dark:bg-orange-900/30")}>
                  <TableCell>
                    <Badge variant={asset.status === 'Obsolete' ? 'destructive' : 'secondary'}>
                      {asset.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{asset.productType}</TableCell>
                  <TableCell className="font-medium">{asset.model}</TableCell>
                  <TableCell>{asset.serialNumber}</TableCell>
                  <TableCell>{format(asset.purchaseDate, "PPP")}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleGetAiSuggestion(asset)}>
                          <Bot className="mr-2 h-4 w-4" />
                          AI Suggestion
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onUpdateStatus(asset.id, 'Obsolete')} disabled={asset.status === 'Obsolete'}>
                          <Archive className="mr-2 h-4 w-4" />
                          Mark as Obsolete
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => onDelete(asset.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No assets found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog open={isAlertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <Bot className="inline-block mr-2" /> AI Disposal Suggestion
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isSuggestionLoading ? (
                <div className="space-y-2 pt-4">
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-1/2" />
                </div>
              ) : aiSuggestion ? (
                <>
                  <p className="font-bold text-lg mt-4">
                    Suggestion:{" "}
                    <span className={cn(aiSuggestion.shouldDispose ? "text-destructive" : "text-green-600")}>
                      {aiSuggestion.shouldDispose ? "Dispose Asset" : "Keep Asset"}
                    </span>
                  </p>
                  <p className="mt-2 text-foreground">{aiSuggestion.reason}</p>
                </>
              ) : "No suggestion available."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeAlert}>Close</AlertDialogCancel>
            {aiSuggestion?.shouldDispose && (
               <AlertDialogAction asChild>
                <Button onClick={() => {
                  const assetToUpdate = assets.find(a => a.model === aiSuggestion.reason.split("Model: ")[1]?.split(",")[0]);
                  if(assetToUpdate) {
                    onUpdateStatus(assetToUpdate.id, 'Obsolete');
                  }
                  closeAlert();
                }}>
                  Mark as Obsolete
                </Button>
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
