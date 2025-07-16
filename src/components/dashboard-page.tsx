"use client";

import { useState, useMemo, useCallback } from "react";
import { PlusCircle, Search, Sparkles } from "lucide-react";
import type { Asset } from "@/lib/types";
import { mockAssets } from "@/lib/mock-data";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { AssetTable } from "@/components/asset-table";
import { AddAssetDialog } from "./add-asset-dialog";
import { AiDisposalPromptDialog } from "./ai-disposal-prompt-dialog";
import { useToast } from "@/hooks/use-toast";

export function DashboardPage() {
  const [assets, setAssets] = useState<Asset[]>(mockAssets);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddAssetOpen, setAddAssetOpen] = useState(false);
  const [isAiDisposalOpen, setAiDisposalOpen] = useState(false);
  const [suggestedForDisposal, setSuggestedForDisposal] = useState<string[]>([]);
  const { toast } = useToast();

  const filteredAssets = useMemo(() => {
    return assets.filter(
      (asset) =>
        asset.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.model.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.serialNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.productType.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [assets, searchTerm]);

  const handleAddAsset = useCallback((newAsset: Omit<Asset, 'id' | 'status'>) => {
    setAssets((prev) => [
      { ...newAsset, id: (prev.length + 1).toString(), status: "Activo" },
      ...prev,
    ]);
    toast({
      title: "Éxito",
      description: "Activo agregado al inventario.",
    });
  }, [toast]);
  
  const handleUpdateAssetStatus = useCallback((assetId: string, status: Asset['status'], reason?: string) => {
    setAssets((prev) =>
      prev.map((asset) =>
        asset.id === assetId ? { ...asset, status } : asset
      )
    );
    toast({
      title: "Activo Actualizado",
      description: `El activo ha sido marcado como ${status}.${reason ? ` Motivo: ${reason}`: ''}`,
    });
  }, [toast]);

  const handleDeleteAsset = useCallback((assetId: string) => {
    setAssets((prev) => prev.filter((asset) => asset.id !== assetId));
     toast({
      title: "Activo Eliminado",
      description: "El activo ha sido eliminado del inventario.",
      variant: "destructive",
    });
  }, [toast]);

  const handleBulkUpdateStatus = useCallback(() => {
    setAssets(prev => prev.map(asset => suggestedForDisposal.includes(asset.id) ? { ...asset, status: 'Obsoleto' } : asset));
    toast({
      title: "Activos Actualizados",
      description: `${suggestedForDisposal.length} activos han sido marcados como Obsoletos.`
    });
    setSuggestedForDisposal([]);
  }, [suggestedForDisposal, toast]);

  return (
    <>
      <div className="grid flex-1 items-start gap-4">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Inventario</CardTitle>
                <CardDescription>
                  Gestiona tu hardware y suministros de TI.
                </CardDescription>
              </div>
              <div className="flex flex-col sm:flex-row items-center gap-2">
                <div className="relative w-full sm:w-auto">
                  <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="search"
                    placeholder="Buscar activos..."
                    className="pl-8 sm:w-[300px]"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                  />
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button variant="outline" onClick={() => setAiDisposalOpen(true)} className="flex-1 sm:flex-none">
                    <Sparkles className="mr-2 h-4 w-4" />
                    Sugerir Bajas con IA
                  </Button>
                  <Button onClick={() => setAddAssetOpen(true)} className="flex-1 sm:flex-none bg-primary text-primary-foreground hover:bg-primary/90">
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Añadir Activo
                  </Button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {suggestedForDisposal.length > 0 && (
              <div className="mb-4 rounded-lg border border-orange-300 bg-orange-50 p-4 text-sm text-orange-800 flex items-center justify-between">
                <p>
                  <Sparkles className="inline-block mr-2 h-4 w-4" />
                  La IA sugiere marcar <strong>{suggestedForDisposal.length}</strong> activos como obsoletos.
                </p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleBulkUpdateStatus}>Marcar como Obsoleto</Button>
                  <Button size="sm" variant="ghost" onClick={() => setSuggestedForDisposal([])}>Descartar</Button>
                </div>
              </div>
            )}
            <AssetTable
              assets={filteredAssets}
              onUpdateStatus={handleUpdateAssetStatus}
              onDelete={handleDeleteAsset}
              highlightedRows={suggestedForDisposal}
            />
          </CardContent>
        </Card>
      </div>
      <AddAssetDialog isOpen={isAddAssetOpen} onOpenChange={setAddAssetOpen} onAddAsset={handleAddAsset} />
      <AiDisposalPromptDialog
        isOpen={isAiDisposalOpen}
        onOpenChange={setAiDisposalOpen}
        assets={assets}
        onSuggestDisposal={setSuggestedForDisposal}
      />
    </>
  );
}
