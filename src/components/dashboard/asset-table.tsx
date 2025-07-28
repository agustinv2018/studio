"use client";

import { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { MoreHorizontal, Bot, Archive, Trash2, ArrowDownCircle } from "lucide-react";
import type { Asset, AssetStatus } from "@/lib/types";
import { suggestDisposal, type SuggestDisposalOutput } from "@/ai/flows/suggest-disposal";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
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
} from "@/components/ui/alert-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

type AssetTableProps = {
  assets: Asset[];
  onUpdateStatus: (assetId: string, status: AssetStatus, reason?: string) => void;
  onDelete: (assetId: string) => void;
  highlightedRows?: string[];
  isAdmin: boolean;
  fetchAssets: () => void;
  user: { id: string } | null;
};

export function AssetTable({
  assets,
  onUpdateStatus,
  onDelete,
  highlightedRows = [],
  isAdmin,
  fetchAssets,
  user,
}: AssetTableProps) {
  const [aiSuggestion, setAiSuggestion] = useState<SuggestDisposalOutput | null>(null);
  const [isSuggestionLoading, setSuggestionLoading] = useState(false);
  const [isAlertOpen, setAlertOpen] = useState(false);
  const [isDisposalAlertOpen, setIsDisposalAlertOpen] = useState(false);
  const [disposalReason, setDisposalReason] = useState("");
  const [assetForDisposal, setAssetForDisposal] = useState<Asset | null>(null);

  const { toast } = useToast();

  const handleGetAiSuggestion = async (asset: Asset) => {
    setSuggestionLoading(true);
    setAiSuggestion(null);
    setAlertOpen(true);
    try {
      const suggestion = await suggestDisposal({
        assetDetails: `Producto: ${asset.tipo}, Modelo: ${asset.modelo}, Fecha de compra: ${asset.fechaCompra.toISOString()}`,
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

  const openDisposalDialog = (asset: Asset) => {
    setAssetForDisposal(asset);
    setIsDisposalAlertOpen(true);
  };

  /** ✅ Confirmar baja con subida a Supabase Storage */
  const handleConfirmDisposal = async () => {
    if (!assetForDisposal) return;

    if (!disposalReason.trim()) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Se requiere un motivo de baja.",
      });
      return;
    }

    const fileInput = document.getElementById("disposalDocument") as HTMLInputElement;
    const file = fileInput?.files?.[0];

    try {
      const now = new Date().toISOString();
      let disposalDocUrl: string | null = null;

      if (file) {
        const fileExt = file.name.split(".").pop();
        const filePath = `${assetForDisposal.id}/${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("disposal-docs")
          .upload(filePath, file, {
            cacheControl: "3600",
            upsert: true,
            contentType: file.type,
          });

        if (uploadError) throw uploadError;

        const { data: publicUrlData } = supabase.storage
          .from("disposal-docs")
          .getPublicUrl(filePath);

        disposalDocUrl = publicUrlData.publicUrl;
      }

      const beforeUpdate = {
        ...assetForDisposal,
        fechaCompra: assetForDisposal.fechaCompra.toISOString(),
        fechaBaja: assetForDisposal.fechaBaja ? assetForDisposal.fechaBaja.toISOString() : null,
      };

      const { error: updateError } = await supabase
        .from("assets")
        .update({
          estado: "baja",
          motivoBaja: disposalReason,
          fechaBaja: now,
          disposal_doc_url: disposalDocUrl,
          usuarioBaja: user?.id || null,
          updated_at: now,
        })
        .eq("id", assetForDisposal.id);

      if (updateError) throw updateError;

      const afterUpdate = {
        ...beforeUpdate,
        estado: "baja",
        motivoBaja: disposalReason,
        fechaBaja: now,
        disposal_doc_url: disposalDocUrl,
      };

      const { error: historyError } = await supabase.from("asset_history").insert({
        asset_id: assetForDisposal.id,
        usuario_id: user?.id,
        accion: "baja",
        detalle: JSON.stringify({
          antes: beforeUpdate,
          despues: afterUpdate,
        }),
        created_at: now,
      });

      if (historyError) throw historyError;

      toast({
        title: "Activo dado de baja",
        description: "El activo fue actualizado correctamente.",
      });

      setIsDisposalAlertOpen(false);
      setDisposalReason("");
      if (fileInput) fileInput.value = "";
      setAssetForDisposal(null);
      fetchAssets();
    } catch (error: any) {
      console.error("❌ Error al dar de baja el activo:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo completar la baja del activo.",
      });
    }
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

  const closeAlert = () => {
    setAlertOpen(false);
    setAiSuggestion(null);
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
              <TableHead>N° Serie</TableHead>
              <TableHead>Compra</TableHead>
              <TableHead>Acta</TableHead>
              {isAdmin && <TableHead>Acciones</TableHead>}
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
                  <TableCell>{format(asset.fechaCompra, "PPP", { locale: es })}</TableCell>
                  <TableCell>
                    {asset.documentUrl ? (
                      <a
                        href={asset.documentUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:underline"
                      >
                        Descargar
                      </a>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  {isAdmin && (
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button size="icon" variant="ghost" disabled={asset.estado === "baja"}>
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuItem onClick={() => handleGetAiSuggestion(asset)}>
                            <Bot className="mr-2 h-4 w-4" />
                            Sugerencia IA
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            onClick={() => onUpdateStatus(asset.id, "obsoleto")}
                            disabled={asset.estado === "obsoleto"}
                          >
                            <Archive className="mr-2 h-4 w-4" />
                            Marcar Obsoleto
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => openDisposalDialog(asset)}>
                            <ArrowDownCircle className="mr-2 h-4 w-4" />
                            Dar de baja
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => onDelete(asset.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  )}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={isAdmin ? 8 : 7} className="text-center">
                  No se encontraron activos.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* ✅ Diálogo IA */}
      <AlertDialog open={isAlertOpen} onOpenChange={setAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              <Bot className="inline-block mr-2" /> Sugerencia IA
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
                  <p className="mt-2">{aiSuggestion.reason}</p>
                </>
              ) : (
                "No hay sugerencia disponible."
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={closeAlert}>Cerrar</AlertDialogCancel>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ✅ Diálogo de baja */}
      <AlertDialog open={isDisposalAlertOpen} onOpenChange={setIsDisposalAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Dar de baja activo</AlertDialogTitle>
            <AlertDialogDescription>
              Para dar de baja el activo "{assetForDisposal?.nombre}", proporciona un motivo y adjunta el acta.
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
