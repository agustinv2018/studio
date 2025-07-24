"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MoreHorizontal, Bot, Archive, Trash2, ArrowDownCircle } from "lucide-react";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "./ui/skeleton";
import { Textarea } from "./ui/textarea";
import { Label } from "./ui/label";
import { Input } from "./ui/input";

type AssetTableProps = {
  assets: Asset[];
  onUpdateStatus: (assetId: string, status: AssetStatus, reason?: string) => void;
  onDelete: (assetId: string) => void;
  highlightedRows?: string[];
  isAdmin: boolean;
  currentUserId: string;
};

export function AssetTable({
  assets,
  onUpdateStatus,
  onDelete,
  highlightedRows = [],
  isAdmin,
  currentUserId,
}: AssetTableProps) {
  const [aiSuggestion, setAiSuggestion] = useState<SuggestDisposalOutput | null>(null);
  const [isSuggestionLoading, setSuggestionLoading] = useState(false);
  const [isAlertOpen, setAlertOpen] = useState(false);
  const [isDisposalAlertOpen, setIsDisposalAlertOpen] = useState(false);
  const [disposalReason, setDisposalReason] = useState("");
  const [assetForDisposal, setAssetForDisposal] = useState<Asset | null>(null);
  const [aiTargetId, setAiTargetId] = useState<string | null>(null);

  const { toast } = useToast();

  const handleGetAiSuggestion = async (asset: Asset) => {
    setSuggestionLoading(true);
    setAiSuggestion(null);
    setAiTargetId(asset.id);
    setAlertOpen(true);
    try {
      const suggestion = await suggestDisposal({
        assetDetails: `Producto: ${asset.tipo}, Modelo: ${asset.modelo}, Fecha de compra: ${
          asset.fechaCompra ? asset.fechaCompra.toISOString() : "Desconocida"
        }`,
      });
      setAiSuggestion(suggestion);
    } catch (error) {
      console.error("Error en AI Suggestion:", error);
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

  const openDisposalDialog = (asset: Asset) => {
    setAssetForDisposal(asset);
    setIsDisposalAlertOpen(true);
  };

  const handleConfirmDisposal = () => {
    if (assetForDisposal && disposalReason) {
      onUpdateStatus(assetForDisposal.id, "baja", disposalReason);
      setIsDisposalAlertOpen(false);
      setDisposalReason("");
      setAssetForDisposal(null);
    } else {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Se requiere un motivo de baja.",
      });
    }
  };

  const closeAlert = () => {
    setAlertOpen(false);
    setAiSuggestion(null);
    setAiTargetId(null);
  };

  const getStatusVariant = (status: AssetStatus) => {
    switch (status) {
      case "activo":
        return "secondary";
      case "obsoleto":
        return "outline";
      case "baja":
        return "destructive";
      default:
        return "default";
    }
  };

  const canEdit = (asset: Asset) => {
    return isAdmin || asset.usuarioAlta === currentUserId;
  };

  return (
    <>
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Estado</TableHead>
              <TableHead>Nombre</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Modelo</TableHead>
              <TableHead>Serie</TableHead>
              <TableHead>Fecha de Compra</TableHead>
              <TableHead>
                <span className="sr-only">Acciones</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {assets.length > 0 ? (
              assets.map((asset) => (
                <TableRow
                  key={asset.id}
                  className={cn(
                    highlightedRows.includes(asset.id) && "bg-accent/20",
                    asset.estado === "baja" && "opacity-50"
                  )}
                >
                  <TableCell>
                    <Badge variant={getStatusVariant(asset.estado)} className="capitalize">
                      {asset.estado}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{asset.nombre}</TableCell>
                  <TableCell>{asset.tipo}</TableCell>
                  <TableCell>{asset.modelo}</TableCell>
                  <TableCell>{asset.numeroSerie}</TableCell>
                  <TableCell>
                    {asset.fechaCompra
                      ? format(asset.fechaCompra, "PPP", { locale: es })
                      : "Sin fecha"}
                  </TableCell>
                  <TableCell>
                    {(isAdmin || canEdit(asset)) && asset.estado !== "baja" && (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Alternar menú</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>

                          {isAdmin && (
                            <DropdownMenuItem onClick={() => handleGetAiSuggestion(asset)}>
                              <Bot className="mr-2 h-4 w-4" />
                              Sugerencia de IA
                            </DropdownMenuItem>
                          )}

                          <DropdownMenuSeparator />

                          <DropdownMenuItem
                            onClick={() => onUpdateStatus(asset.id, "obsoleto")}
                            disabled={asset.estado === "obsoleto"}
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            Marcar como Obsoleto
                          </DropdownMenuItem>

                          <DropdownMenuItem onClick={() => openDisposalDialog(asset)}>
                            <ArrowDownCircle className="mr-2 h-4 w-4" />
                            Dar de baja
                          </DropdownMenuItem>

                          {isAdmin && (
                            <>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem
                                className="text-destructive focus:text-destructive focus:bg-destructive/10"
                                onClick={() => onDelete(asset.id)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Eliminar
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    )}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} className="h-24 text-center">
                  No se encontraron activos.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* AI Suggestion Dialog */}
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
                    <span
                      className={cn(
                        aiSuggestion.shouldDispose ? "text-destructive" : "text-green-600"
                      )}
                    >
                      {aiSuggestion.shouldDispose ? "Eliminar Activo" : "Conservar Activo"}
                    </span>
                  </p>
                  <p className="mt-2 text-foreground">{aiSuggestion.reason}</p>
                </>
              ) : (
                "No hay sugerencia disponible."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeAlert}>Cerrar</AlertDialogCancel>
            {aiSuggestion?.shouldDispose && aiTargetId && (
              <AlertDialogAction
                asChild
                onClick={() => {
                  onUpdateStatus(aiTargetId, "obsoleto");
                  closeAlert();
                }}
              >
                <Button>Marcar como Obsoleto</Button>
              </AlertDialogAction>
            )}
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Disposal Dialog */}
      <AlertDialog open={isDisposalAlertOpen} onOpenChange={setIsDisposalAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dar de baja activo</AlertDialogTitle>
            <AlertDialogDescription>
              Para dar de baja el activo "{assetForDisposal?.nombre}", por favor, proporciona un
              motivo y adjunta el acta de baja.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid w-full gap-1.5">
              <Label htmlFor="disposalReason">Motivo de baja (obligatorio)</Label>
              <Textarea
                id="disposalReason"
                placeholder="Escribe el motivo aquí..."
                value={disposalReason}
                onChange={(e) => setDisposalReason(e.target.value)}
                rows={3}
              />
            </div>
            <div className="grid w-full gap-1.5">
              <Label htmlFor="disposalDocument">Adjuntar acta de baja</Label>
              <Input id="disposalDocument" type="file" />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setIsDisposalAlertOpen(false)}>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDisposal}>Confirmar baja</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default AssetTable