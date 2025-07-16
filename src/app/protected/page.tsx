"use client";
import { useAuth } from "@/context/auth-context";
import { redirect } from "next/navigation";

export default function ProtectedPage() {
  const { user, loading } = useAuth();

  if (loading) return <p>Cargando...</p>;
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
        <h1 className="text-2xl font-bold">Página Protegida</h1>
        <p className="mt-4">Bienvenido {user.email}</p>
    </div>
  );
}
