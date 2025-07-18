"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
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
import { TerminalSquare } from "lucide-react";
import Link from "next/link";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [rol, setRol] = useState<"admin" | "usuario">("usuario");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { toast } = useToast();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const cleanEmail = email.trim().toLowerCase();

    if (password.length < 6) {
      toast({ variant: "destructive", title: "Error", description: "La contraseña debe tener al menos 6 caracteres." });
      setIsLoading(false);
      return;
    }
    
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, password);
      const user = userCredential.user;

      await setDoc(doc(db, "usuarios", user.uid), {
        nombre,
        email: cleanEmail,
        rol,
        fechaCreacion: serverTimestamp(),
      });
      
      toast({
        title: "Registro exitoso",
        description: "Tu cuenta ha sido creada. Ahora puedes iniciar sesión.",
      });

      router.push("/login");

    } catch (error: any) {
        let msg = "Ocurrió un error inesperado. Por favor, inténtalo de nuevo.";
        if (error.code === 'auth/email-already-in-use') {
            msg = "El correo electrónico ya está en uso. Por favor, utiliza otro.";
        } else if (error.code === 'auth/weak-password') {
            msg = "La contraseña es demasiado débil. Debe tener al menos 6 caracteres.";
        } else if (error.code === 'auth/invalid-email') {
            msg = "El formato del correo electrónico no es válido.";
        }
        console.error("Error de registro:", error);
      toast({
        variant: "destructive",
        title: "Error de registro",
        description: msg,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
      <div className="absolute top-8 left-8 flex items-center gap-2">
        <TerminalSquare className="h-6 w-6 text-primary" />
        <h1 className="text-xl font-bold">Tech Inventory</h1>
      </div>
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="text-2xl">Crear una cuenta</CardTitle>
          <CardDescription>
            Introduce tus datos para registrarte.
          </CardDescription>
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
          <CardFooter className="flex flex-col gap-4">
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Creando cuenta..." : "Crear Cuenta"}
            </Button>
            <div className="text-center text-sm">
                ¿Ya tienes una cuenta?{" "}
                <Link href="/login" className="underline">
                    Iniciar Sesión
                </Link>
            </div>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
