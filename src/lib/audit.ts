import { supabase } from "./supabase";

export async function logHistorial(
  usuarioId: string,
  accion: "alta" | "modificación" | "eliminación" | "login" | "logout",
  tabla: string,
  detalle: string
) {
  const { error } = await supabase.from("historial").insert({
    usuario_id: usuarioId,
    accion,
    tabla,
    detalle,
  });

  if (error) {
    console.error("Error registrando historial:", error.message);
  }
}
