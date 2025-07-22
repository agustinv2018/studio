"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface Usuario {
  id: string;
  nombre: string;
  email: string;
  rol: "admin" | "usuario";
  legajo: string;
  created_at: string;
}

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([]);
  const [loading, setLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<Usuario | null>(null);
  const { toast } = useToast();

  // Fetch usuarios
  const fetchUsuarios = async () => {
    setLoading(true);
    const { data, error } = await supabase.from("usuarios").select("*").order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Error cargando usuarios", description: error.message, variant: "destructive" });
    } else {
      setUsuarios(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchUsuarios();
  }, []);

  // Abrir modal edición
  const openEditModal = (usuario: Usuario) => {
    setSelectedUser(usuario);
    setIsEditOpen(true);
  };

  // Guardar cambios usuario
  const handleSaveUser = async () => {
    if (!selectedUser) return;
    const { error } = await supabase.from("usuarios").update({
      nombre: selectedUser.nombre,
      email: selectedUser.email,
      rol: selectedUser.rol,
      legajo: selectedUser.legajo,
      updated_at: new Date().toISOString(),
    }).eq("id", selectedUser.id);

    if (error) {
      toast({ title: "Error actualizando usuario", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Usuario actualizado" });
      setIsEditOpen(false);
      fetchUsuarios();
    }
  };

  // Eliminar usuario
  const handleDeleteUser = async (id: string) => {
    if (!confirm("¿Estás seguro de eliminar este usuario? Esta acción no se puede deshacer.")) return;
    const { error } = await supabase.from("usuarios").delete().eq("id", id);

    if (error) {
      toast({ title: "Error eliminando usuario", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Usuario eliminado" });
      fetchUsuarios();
    }
  };

  if (loading) return <div className="p-6">Cargando usuarios...</div>;

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Gestión de Usuarios</h1>
      <Table>
        <TableCaption>Lista de usuarios registrados</TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>Nombre</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Rol</TableHead>
            <TableHead>Legajo</TableHead>
            <TableHead>Acciones</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {usuarios.map((u) => (
            <TableRow key={u.id}>
              <TableCell>{u.nombre}</TableCell>
              <TableCell>{u.email}</TableCell>
              <TableCell>{u.rol}</TableCell>
              <TableCell>{u.legajo}</TableCell>
              <TableCell className="flex gap-2">
                <Button size="sm" onClick={() => openEditModal(u)}>Editar</Button>
                <Button size="sm" variant="destructive" onClick={() => handleDeleteUser(u.id)}>Eliminar</Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {/* Modal edición */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Usuario</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nombre</Label>
              <Input
                value={selectedUser?.nombre || ""}
                onChange={(e) => setSelectedUser((prev) => prev ? { ...prev, nombre: e.target.value } : null)}
              />
            </div>
            <div>
              <Label>Email</Label>
              <Input
                value={selectedUser?.email || ""}
                onChange={(e) => setSelectedUser((prev) => prev ? { ...prev, email: e.target.value } : null)}
              />
            </div>
            <div>
              <Label>Rol</Label>
              <select
                className="border rounded px-2 py-1 w-full"
                value={selectedUser?.rol || "usuario"}
                onChange={(e) => setSelectedUser((prev) => prev ? { ...prev, rol: e.target.value as "admin" | "usuario" } : null)}
              >
                <option value="usuario">Usuario</option>
                <option value="admin">Administrador</option>
              </select>
            </div>
            <div>
              <Label>Legajo</Label>
              <Input
                value={selectedUser?.legajo || ""}
                onChange={(e) => setSelectedUser((prev) => prev ? { ...prev, legajo: e.target.value } : null)}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSaveUser}>Guardar</Button>
            <Button variant="secondary" onClick={() => setIsEditOpen(false)}>Cancelar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

