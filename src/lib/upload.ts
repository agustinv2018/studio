import { supabase } from "./supabase";
import { v4 as uuidv4 } from "uuid";

export async function uploadFileToSupabase(file: File): Promise<string> {
  try {
    const fileExt = file.name.split(".").pop();
    const fileName = `${uuidv4()}.${fileExt}`;
    const filePath = `avatars/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("avatars") // nombre del bucket en Supabase
      .upload(filePath, file, {
        cacheControl: "3600",
        upsert: false,
      });

    if (uploadError) {
      console.error("Error al subir archivo:", uploadError.message);
      throw new Error("No se pudo subir la imagen");
    }

    const { data: publicUrlData } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    if (!publicUrlData || !publicUrlData.publicUrl) {
      throw new Error("No se pudo obtener la URL pública");
    }

    return publicUrlData.publicUrl;
  } catch (error) {
    console.error("Error en uploadFileToSupabase:", error);
    throw error;
  }
}

