"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [legajo, setLegajo] = useState("");
  const [rol, setRol] = useState<"admin" | "usuario">("usuario");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1️⃣ Crear usuario en auth
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) throw error;
      const userId = data.user?.id;
      if (!userId) throw new Error("No se pudo crear el usuario en Auth.");

      // 2️⃣ Insertar datos adicionales en la tabla "usuarios"
      const now = new Date().toISOString();
      const { error: dbError } = await supabase.from("usuarios").insert({
        id: userId,
        nombre,
        email,
        rol,
        legajo,
        created_at: now,
        updated_at: now,
      });

      if (dbError) throw dbError;

      // 3️⃣ Registrar acción en historial
      const { error: historialError } = await supabase.from("historial").insert({
        usuario_id: userId,
        accion: "alta",
        tabla: "usuarios",
        detalle: JSON.stringify({
          evento: "Registro de nuevo usuario",
          nombre,
          email,
          rol,
          legajo,
          timestamp: now,
        }),
      });

      if (historialError) throw historialError;

      toast({
        title: "Registro exitoso",
        description: "Ahora puedes iniciar sesión.",
      });

      router.push("/login");
    } catch (error: any) {
      console.error("Error en registro:", error);
      toast({
        variant: "destructive",
        title: "Error en registro",
        description: error.message || "Ocurrió un error inesperado",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Crear cuenta</CardTitle>
          <CardDescription>Introduce tus datos para registrarte.</CardDescription>
        </CardHeader>
        <form onSubmit={handleRegister}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="nombre">Nombre</Label>
              <Input
                id="nombre"
                type="text"
                placeholder="Tu nombre completo"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="legajo">Número de Legajo</Label>
              <Input
                id="legajo"
                type="text"
                placeholder="Ej: 12345"
                required
                value={legajo}
                onChange={(e) => setLegajo(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="m@example.com"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">Contraseña</Label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="grid gap-2">
              <Label>Rol</Label>
              <RadioGroup
                defaultValue="usuario"
                onValueChange={(value: "admin" | "usuario") => setRol(value)}
                className="flex items-center space-x-4"
                disabled={isLoading}
                value={rol}
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="usuario" id="r1" />
                  <Label htmlFor="r1">Usuario</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="admin" id="r2" />
                  <Label htmlFor="r2">Administrador</Label>
                </div>
              </RadioGroup>
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
            </Button>
            <div className="text-center text-sm">
              ¿Ya tienes cuenta?{" "}
              <Link href="/login" className="underline">
                Iniciar sesión
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
