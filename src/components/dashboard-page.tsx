"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { PlusCircle, Search, Sparkles } from "lucide-react";
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

  // 🔍 Obtener activos
  const fetchAssets = useCallback(async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("activos")
      .select("*")
      .order("fechacompra", { ascending: false });

    if (error) {
      console.error("Error fetching assets:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudieron cargar los activos.",
      });
    } else {
      const mappedAssets: Asset[] = (data || []).map((d: any) => ({
        id: d.id,
        nombre: d.nombre,
        tipo: d.tipo,
        modelo: d.modelo,
        numeroSerie: d.numeroserie,
        fechaCompra: d.fechacompra ? new Date(d.fechacompra) : null,
        estado: d.estado,
        motivoBaja: d.motivobaja,
        fechaBaja: d.fechabaja ? new Date(d.fechabaja) : null,
        usuarioAlta: d.usuarioalta,
        usuarioBaja: d.usuariobaja,
        documentUrl: d.document_url,
      }));
      setAssets(mappedAssets);
    }
    setIsLoading(false);
  }, [toast]);

  useEffect(() => {
    fetchAssets();
  }, [fetchAssets]);

  // 🔍 Filtro por búsqueda
  const filteredAssets = useMemo(() => {
    return assets.filter(
      (asset) =>
        asset.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.modelo || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.numeroSerie || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (asset.tipo || "").toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [assets, searchTerm]);

  // ✅ Agregar activo con logs detallados
  const handleAddAsset = async (newAsset: Omit<Asset, "id" | "estado">) => {
    if (!user) return;
    const now = new Date().toISOString();

    try {
      const { nombre, tipo, modelo, numeroSerie, fechaCompra } = newAsset;

      const payload = {
        nombre,
        tipo,
        modelo,
        numeroserie: numeroSerie,
        fechacompra: fechaCompra ? fechaCompra.toISOString() : null,
        estado: "activo",
        usuarioalta: user.id,
        fechaalta: now,
        updated_at: now,
      };

      console.log("✅ Insertando activo:", payload);

      const { data, error } = await supabase
        .from("activos")
        .insert(payload)
        .select()
        .single();

      if (error) throw error;

      console.log("✅ Activo insertado correctamente:", data);

      await supabase.from("historial").insert({
        usuario_id: user.id,
        accion: "alta",
        tabla: "activos",
        detalle: JSON.stringify({
          despues: data,
          timestamp: now,
        }),
      });

      toast({ title: "Éxito", description: "Activo agregado correctamente." });
      fetchAssets();
    } catch (error: any) {
      console.error("❌ Error en handleAddAsset:", error, JSON.stringify(error, null, 2));
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo agregar el activo.",
      });
    }
  };

  // ✅ Actualizar estado
  const handleUpdateAssetStatus = async (
    assetId: string,
    estado: Asset["estado"],
    reason?: string
  ) => {
    if (!user) return;
    const now = new Date().toISOString();

    const assetBefore = assets.find((a) => a.id === assetId);

    try {
      const { error } = await supabase
        .from("activos")
        .update({
          estado,
          motivobaja: estado === "baja" ? reason : null,
          fechabaja: estado === "baja" ? now : null,
          usuariobaja: estado === "baja" ? user.id : null,
          updated_at: now,
        })
        .eq("id", assetId);

      if (error) throw error;

      await supabase.from("historial").insert({
        usuario_id: user.id,
        accion: "modificación",
        tabla: "activos",
        detalle: JSON.stringify({
          antes: {
            ...assetBefore,
            fechaCompra: assetBefore?.fechaCompra?.toISOString(),
            fechaBaja: assetBefore?.fechaBaja?.toISOString(),
          },
          despues: { estado, motivobaja: reason },
          timestamp: now,
        }),
      });

      toast({ title: "Estado actualizado", description: `Activo marcado como ${estado}` });
      fetchAssets();
    } catch (error: any) {
      console.error("❌ Error en handleUpdateAssetStatus:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo actualizar el activo.",
      });
    }
  };

  // ✅ Eliminar activo
  const handleDeleteAsset = async (assetId: string) => {
    const assetBefore = assets.find((a) => a.id === assetId);
    const now = new Date().toISOString();

    try {
      const { error } = await supabase.from("activos").delete().eq("id", assetId);
      if (error) throw error;

      await supabase.from("historial").insert({
        usuario_id: user.id,
        accion: "eliminación",
        tabla: "activos",
        detalle: JSON.stringify({
          antes: {
            ...assetBefore,
            fechaCompra: assetBefore?.fechaCompra?.toISOString(),
            fechaBaja: assetBefore?.fechaBaja?.toISOString(),
          },
          timestamp: now,
        }),
      });

      toast({ title: "Activo eliminado", description: "Se eliminó correctamente." });
      fetchAssets();
    } catch (error: any) {
      console.error("❌ Error en handleDeleteAsset:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "No se pudo eliminar el activo.",
      });
    }
  };

  return (
    <>
      <div className="grid flex-1 items-start gap-4">
        <Card>
          <CardHeader>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
              <div>
                <CardTitle>Inventario</CardTitle>
                <CardDescription>Gestiona tu hardware y suministros de TI.</CardDescription>
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
                    <Button
                      onClick={() => setAddAssetOpen(true)}
                      className="bg-primary text-primary-foreground hover:bg-primary/90"
                    >
                      <PlusCircle className="mr-2 h-4 w-4" />
                      Añadir Activo
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
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
