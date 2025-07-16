"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
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
        assetDetails: `Producto: ${asset.productType}, Modelo: ${asset.model}, Fecha de compra: ${asset.purchaseDate.toISOString()}`,
      });
      setAiSuggestion(suggestion);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Falló la sugerencia de IA",
        description: "No se pudo obtener una sugerencia en este momento.",
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
              <TableHead>Estado</TableHead>
              <TableHead>Tipo de Producto</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>Número de Serie</TableHead>
              <TableHead>Fecha de Compra</TableHead>
              <TableHead>
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.length > 0 ? (
              assets.map((asset) => (
                <TableRow key={asset.id} className={cn(highlightedRows.includes(asset.id) && "bg-orange-100 dark:bg-orange-900/30")}>
                  <TableCell>
                    <Badge variant={asset.status === 'Obsoleto' ? 'destructive' : 'secondary'}>
                      {asset.status}
                    </Badge>
                  </TableCell>
                  <TableCell>{asset.productType}</TableCell>
                  <TableCell className="font-medium">{asset.model}</TableCell>
                  <TableCell>{asset.serialNumber}</TableCell>
                  <TableCell>{format(asset.purchaseDate, "PPP", { locale: es })}</TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button aria-haspopup="true" size="icon" variant="ghost">
                          <MoreHorizontal className="h-4 w-4" />
                          <span className="sr-only">Alternar menú</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                        <DropdownMenuItem onClick={() => handleGetAiSuggestion(asset)}>
                          <Bot className="mr-2 h-4 w-4" />
                          Sugerencia de IA
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem onClick={() => onUpdateStatus(asset.id, 'Obsoleto')} disabled={asset.status === 'Obsoleto'}>
                          <Archive className="mr-2 h-4 w-4" />
                          Marcar como Obsoleto
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive" onClick={() => onDelete(asset.id)}>
                          <Trash2 className="mr-2 h-4 w-4" />
                          Eliminar
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No se encontraron activos.
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
              <Bot className="inline-block mr-2" /> Sugerencia de Eliminación de IA
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
                    Sugerencia:{" "}
                    <span className={cn(aiSuggestion.shouldDispose ? "text-destructive" : "text-green-600")}>
                      {aiSuggestion.shouldDispose ? "Eliminar Activo" : "Conservar Activo"}
                    </span>
                  </p>
                  <p className="mt-2 text-foreground">{aiSuggestion.reason}</p>
                </>
              ) : "No hay sugerencia disponible."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeAlert}>Cerrar</AlertDialogCancel>
            {aiSuggestion?.shouldDispose && (
               <AlertDialogAction asChild>
                <Button onClick={() => {
                  const assetToUpdate = assets.find(a => a.model === aiSuggestion.reason.split("Modelo: ")[1]?.split(",")[0]);
                  if(assetToUpdate) {
                    onUpdateStatus(assetToUpdate.id, 'Obsoleto');
                  }
                  closeAlert();
                }}>
                  Marcar como Obsoleto
                </Button>
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
