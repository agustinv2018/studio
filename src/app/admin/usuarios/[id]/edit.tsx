"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/auth-context";

export default function EditUsuarioPage() {
  const { id } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState<"admin" | "usuario">("usuario");
  const [legajo, setLegajo] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    fetchUsuario();
  }, [id]);

  const fetchUsuario = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("usuarios")
      .select("*")
      .eq("id", id)
      .single();
    if (!error && data) {
      setNombre(data.nombre);
      setRol(data.rol);
      setLegajo(data.legajo);
    }
    setLoading(false);
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error } = await supabase
      .from("usuarios")
      .update({ nombre, rol, legajo, updated_at: new Date().toISOString() })
      .eq("id", id);

    if (error) {
      alert("Error actualizando usuario: " + error.message);
    } else {
      // Registrar en historial
      await supabase.from("historial").insert({
        usuario_id: user?.id,
        accion: "editar",
        tabla: "usuarios",
        detalle: { usuario_editado: id, cambios: { nombre, rol, legajo } },
      });
      router.push("/admin/usuarios");
    }
  };

  if (loading) return <p>Cargando datos del usuario...</p>;

  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-4">Editar Usuario</h1>
      <form onSubmit={handleUpdate} className="space-y-4">
        <div>
          <Label htmlFor="nombre">Nombre</Label>
          <Input
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            required
          />
        </div>
        <div>
          <Label htmlFor="rol">Rol</Label>
          <select
            id="rol"
            value={rol}
            onChange={(e) => setRol(e.target.value as "admin" | "usuario")}
            className="border rounded p-2 w-full"
          >
            <option value="usuario">Usuario</option>
            <option value="admin">Administrador</option>
          </select>
        </div>
        <div>
          <Label htmlFor="legajo">Legajo</Label>
          <Input
            id="legajo"
            value={legajo}
            onChange={(e) => setLegajo(e.target.value)}
            required
          />
        </div>
        <Button type="submit">Guardar cambios</Button>
      </form>
    </div>
  );
}
