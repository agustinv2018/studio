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
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1️⃣ Autenticación con Supabase
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;

      const userId = data.user?.id;
      if (!userId) throw new Error("No se pudo obtener el ID del usuario.");

      // 2️⃣ Actualizar última sesión
      const { error: updateError } = await supabase
        .from("usuarios")
        .update({
          ultima_sesion: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq("id", userId);

      if (updateError) throw updateError;

      // 3️⃣ Registrar en historial (JSON con detalles)
      const { error: historialError } = await supabase.from("historial").insert({
        usuario_id: userId,
        accion: "login",
        tabla: "usuarios",
        detalle: JSON.stringify({
          evento: "Inicio de sesión",
          email: email,
          timestamp: new Date().toISOString(),
        }),
      });

      if (historialError) throw historialError;

      toast({
        title: "Bienvenido",
        description: "Has iniciado sesión correctamente",
      });

      router.push("/"); // Redirigir al dashboard
    } catch (error: any) {
      console.error("Error en login:", error);
      toast({
        variant: "destructive",
        title: "Error de inicio de sesión",
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
          <CardTitle className="text-2xl">Iniciar sesión</CardTitle>
          <CardDescription>Accede a tu cuenta para continuar.</CardDescription>
        </CardHeader>
        <form onSubmit={handleLogin}>
          <CardContent className="grid gap-4">
            <div className="grid gap-2">
              <label htmlFor="email">Email</label>
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
              <label htmlFor="password">Contraseña</label>
              <Input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </CardContent>
          <CardFooter className="flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Ingresando..." : "Iniciar Sesión"}
            </Button>
            <div className="text-center text-sm">
              ¿No tienes cuenta?{" "}
              <Link href="/register" className="underline">
                Crear una cuenta
              </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
