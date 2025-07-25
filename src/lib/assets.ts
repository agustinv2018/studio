import { supabase } from "./supabase";
import type { Asset } from "./types";

export async function fetchAssets(): Promise<Asset[]> {
  const { data, error } = await supabase
    .from("assets")
    .select(`
      id,
      nombre,
      tipo,
      modelo,
      numero_serie,
      fecha_compra,
      estado,
      fecha_baja,
      motivo_baja,
      usuario_alta,
      usuario_baja,
      disposal_doc_url
    `)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ Error al obtener activos:", error.message);
    throw error;
  }

  return (
    data?.map((item) => ({
      id: item.id,
      nombre: item.nombre,
      tipo: item.tipo,
      modelo: item.modelo,
      numeroSerie: item.numero_serie,
      fechaCompra: new Date(item.fecha_compra),
      estado: item.estado,
      fechaBaja: item.fecha_baja ? new Date(item.fecha_baja) : null,
      motivoBaja: item.motivo_baja || null,
      usuarioAlta: item.usuario_alta || null,
      usuarioBaja: item.usuario_baja || null,
      documentUrl: item.disposal_doc_url || null,
    })) || []
  );
}
