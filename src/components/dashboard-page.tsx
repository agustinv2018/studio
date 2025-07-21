"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { PlusCircle, Search, Sparkles } from "lucide-react";
import { supabase } from "@/lib/supabase";
import type { Asset } from "@/lib/types";
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
import { useAuth } from "@/context/auth-context";
import { Skeleton } from "./ui/skeleton";

export function DashboardPage() {
  const { user } = useAuth();
  const [assets, setAssets] = useState<Asset[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddAssetOpen, setAddAssetOpen] = useState(false);
  const [isAiDisposalOpen, setAiDisposalOpen] = useState(false);
  const [suggestedForDisposal, setSuggestedForDisposal] = useState<string[]>([]);
  const { toast } = useToast();

  const isAdmin = user?.rol === "admin";

  const fetchAssets = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("activos")
      .select("*")
      .order("fechaCompra", { ascending: false });

    if (error) {
      console.error("Error fetching assets:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los activos.",
      });
    } else {
      setAssets(data || []);
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  const filteredAssets = useMemo(() => {
    return assets.filter(
      (asset) =>
        asset.nombre?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.modelo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.numeroSerie?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        asset.tipo?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [assets, searchTerm]);

  const handleAddAsset = useCallback(
    async (newAsset: Omit<Asset, "id" | "estado" | "usuarioAlta">) => {
      if (!user) return;
      const { error } = await supabase.from("activos").insert({
        ...newAsset,
        estado: "activo",
        usuarioAlta: user.id,
        fechaAlta: new Date().toISOString(),
      });

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo agregar el activo.",
        });
        console.error("Error adding asset:", error);
      } else {
        toast({ title: "Éxito", description: "Activo agregado." });
        fetchAssets();
      }
    },
    [toast, user, fetchAssets]
  );

  const handleUpdateAssetStatus = useCallback(
    async (assetId: string, estado: Asset["estado"], reason?: string) => {
      const updateData: any = { estado };
      if (estado === "baja") {
        updateData.motivoBaja = reason;
        updateData.fechaBaja = new Date().toISOString();
        updateData.usuarioBaja = user?.id;
      }

      const { error } = await supabase
        .from("activos")
        .update(updateData)
        .eq("id", assetId);

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo actualizar el activo.",
        });
      } else {
        toast({
          title: "Activo Actualizado",
          description: `Estado: ${estado}.`,
        });
        fetchAssets();
      }
    },
    [toast, user, fetchAssets]
  );

  const handleDeleteAsset = useCallback(
    async (assetId: string) => {
      const { error } = await supabase.from("activos").delete().eq("id", assetId);

      if (error) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No se pudo eliminar el activo.",
        });
      } else {
        toast({ title: "Activo Eliminado", variant: "destructive" });
        fetchAssets();
      }
    },
    [toast, fetchAssets]
  );

  const handleBulkUpdateStatus = useCallback(async () => {
    const { error } = await supabase
      .from("activos")
      .update({ estado: "obsoleto" })
      .in("id", suggestedForDisposal);

    if (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron actualizar los activos.",
      });
    } else {
      toast({
        title: "Activos Actualizados",
        description: `${suggestedForDisposal.length} activos marcados como obsoletos.`,
      });
      setSuggestedForDisposal([]);
      fetchAssets();
    }
  }, [suggestedForDisposal, toast, fetchAssets]);

  return (
    <>
      <div className="grid flex-1 items-start gap-4">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Inventario</CardTitle>
                <CardDescription>Gestiona tu hardware y suministros.</CardDescription>
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
                {isAdmin && (
                  <div className="flex gap-2 w-full sm:w-auto">
                    <Button variant="outline" onClick={() => setAiDisposalOpen(true)}>
                      <Sparkles className="mr-2 h-4 w-4" />
                      Sugerir Bajas con IA
                    </Button>
                    <Button onClick={() => setAddAssetOpen(true)} className="bg-primary text-primary-foreground hover:bg-primary/90">
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Añadir Activo
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {suggestedForDisposal.length > 0 && isAdmin && (
              <div className="mb-4 rounded-lg border border-accent/50 bg-accent/10 p-4 text-sm flex items-center justify-between">
                <p>
                  <Sparkles className="inline-block mr-2 h-4 w-4" />
                  La IA sugiere marcar <strong>{suggestedForDisposal.length}</strong> activos como obsoletos.
                </p>
                <div className="flex gap-2">
                  <Button size="sm" onClick={handleBulkUpdateStatus} variant="outline">Marcar Obsoletos</Button>
                  <Button size="sm" variant="ghost" onClick={() => setSuggestedForDisposal([])}>Descartar</Button>
                </div>
              </div>
            )}
            {isLoading ? (
              <div className="space-y-2">
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
                <Skeleton className="h-12 w-full" />
              </div>
            ) : (
              <AssetTable
                assets={filteredAssets}
                onUpdateStatus={handleUpdateAssetStatus}
                onDelete={handleDeleteAsset}
                highlightedRows={suggestedForDisposal}
                isAdmin={isAdmin}
              />
            )}
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

export default DashboardPage;