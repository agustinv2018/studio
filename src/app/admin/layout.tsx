"use client";

import { ReactNode, useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/context/auth-context";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import {
  Home,
  Users,
  History,
  Package,
  Settings,
  LogOut,
  Menu,
} from "lucide-react";
import Link from "next/link";

interface AdminLayoutProps {
  children: ReactNode;
}

const navLinks = [
  { href: "/admin", label: "Dashboard", icon: Home },
  { href: "/admin/usuarios", label: "Usuarios", icon: Users },
  { href: "/admin/historial", label: "Historial", icon: History },
  { href: "/admin/activos", label: "Activos", icon: Package },
  { href: "/admin/configuracion", label: "Configuración", icon: Settings },
];

export default function AdminLayout({ children }: AdminLayoutProps) {
  const { user, loading, signOut } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // ✅ Protección para admin
  useEffect(() => {
    if (!loading) {
      if (!user || user.rol !== "admin") {
        router.replace("/"); // Redirige si no es admin
      }
    }
  }, [user, loading, router]);

  if (loading || !user) {
    return <div className="p-8 text-center">Cargando...</div>;
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={cn(
          "bg-white border-r shadow-md transition-all",
          isSidebarOpen ? "w-64" : "w-16"
        )}
      >
        <div className="flex items-center justify-between p-4">
          <span className={cn("font-bold text-lg", !isSidebarOpen && "hidden")}>
            Admin
          </span>
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded hover:bg-gray-200"
          >
            <Menu size={20} />
          </button>
        </div>
        <nav className="mt-4 flex flex-col space-y-2">
          {navLinks.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href}>
              <div
                className={cn(
                  "flex items-center gap-3 p-3 hover:bg-gray-100 transition cursor-pointer",
                  pathname === href && "bg-gray-200 font-semibold"
                )}
              >
                <Icon size={20} />
                {isSidebarOpen && <span>{label}</span>}
              </div>
            </Link>
          ))}
        </nav>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <header className="flex justify-between items-center bg-white shadow p-4">
          <div className="font-bold text-lg">Panel de Administración</div>
          <div className="flex items-center gap-4">
            {user && (
              <div className="text-sm text-gray-700">
                <p>{user.nombre}</p>
                <p className="text-xs text-gray-500">{user.email}</p>
              </div>
            )}
            <Button variant="outline" onClick={signOut}>
              <LogOut size={16} className="mr-1" /> Salir
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="p-6 flex-1">{children}</main>

        <footer className="bg-gray-200 text-center p-4 text-sm">
          &copy; {new Date().getFullYear()} Tech Inventory - Admin Panel
        </footer>
      </div>
    </div>
  );
}

