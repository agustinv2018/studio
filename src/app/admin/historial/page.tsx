"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/auth-context";
import {
  Card,
  CardHeader,
  CardTitle,
  CardContent,
  CardDescription,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";

type HistorialEntry = {
  id: string;
  usuario_id: string;
  accion: string;
  tabla: string;
  detalle: any;
  fecha: string;
  usuario_nombre?: string;
};

export default function HistorialPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [historial, setHistorial] = useState<HistorialEntry[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const [filterUsuario, setFilterUsuario] = useState("");
  const [filterAccion, setFilterAccion] = useState("");
  const [filterTabla, setFilterTabla] = useState("");

  // Cargar historial y datos usuarios para mostrar nombre
  const fetchHistorial = async () => {
    setIsLoading(true);
    try {
      // Traer historial con join usuario para nombre
      const { data, error } = await supabase
        .from("historial")
        .select(`
          id,
          usuario_id,
          accion,
          tabla,
          detalle,
          fecha,
          usuarios (nombre)
        `)
        .order("fecha", { ascending: false });

      if (error) throw error;

      // Mapear para añadir nombre usuario directamente
      const mapped = (data || []).map((item: any) => ({
        ...item,
        usuario_nombre: item.usuarios?.nombre ?? "Desconocido",
      }));

      setHistorial(mapped);
    } catch (error: any) {
      console.error(error);
      toast({
        variant: "destructive",
        title: "Error al cargar historial",
        description: error.message,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.rol !== "admin") return; // Solo admin
    fetchHistorial();
  }, [user]);

  // Filtrar historial en cliente
  const filteredHistorial = useMemo(() => {
    return historial.filter((entry) => {
      return (
        (filterUsuario === "" || entry.usuario_nombre?.toLowerCase().includes(filterUsuario.toLowerCase())) &&
        (filterAccion === "" || entry.accion.toLowerCase().includes(filterAccion.toLowerCase())) &&
        (filterTabla === "" || entry.tabla.toLowerCase().includes(filterTabla.toLowerCase()))
      );
    });
  }, [historial, filterUsuario, filterAccion, filterTabla]);

  if (!user || user.rol !== "admin") {
    return (
      <div className="p-8 text-center text-red-600">
        No tienes permisos para acceder a esta página.
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <Card>
        <CardHeader>
          <CardTitle>Historial de Auditoría</CardTitle>
          <CardDescription>Registros de acciones realizadas por usuarios.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Filtros */}
          <div className="flex flex-wrap gap-4">
            <Input
              placeholder="Filtrar por usuario"
              value={filterUsuario}
              onChange={(e) => setFilterUsuario(e.target.value)}
              className="max-w-xs"
              disabled={isLoading}
            />
            <Input
              placeholder="Filtrar por acción"
              value={filterAccion}
              onChange={(e) => setFilterAccion(e.target.value)}
              className="max-w-xs"
              disabled={isLoading}
            />
            <Input
              placeholder="Filtrar por tabla"
              value={filterTabla}
              onChange={(e) => setFilterTabla(e.target.value)}
              className="max-w-xs"
              disabled={isLoading}
            />
            <Button variant="outline" onClick={fetchHistorial} disabled={isLoading}>
              Recargar
            </Button>
          </div>

          {/* Tabla de historial */}
          <div className="overflow-auto max-h-[600px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Fecha</TableHead>
                  <TableHead>Usuario</TableHead>
                  <TableHead>Acción</TableHead>
                  <TableHead>Tabla</TableHead>
                  <TableHead>Detalle</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      Cargando...
                    </TableCell>
                  </TableRow>
                ) : filteredHistorial.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      No hay registros.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredHistorial.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{new Date(entry.fecha).toLocaleString()}</TableCell>
                      <TableCell>{entry.usuario_nombre}</TableCell>
                      <TableCell>{entry.accion}</TableCell>
                      <TableCell>{entry.tabla}</TableCell>
                      <TableCell>
                        <pre className="whitespace-pre-wrap max-w-md max-h-32 overflow-auto text-xs bg-gray-100 p-2 rounded">
                          {JSON.stringify(entry.detalle, null, 2)}
                        </pre>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
